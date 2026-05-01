/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, Edit3, Check, X, ImageIcon, Sparkles, Loader2, Plus, ArrowLeft, Search, Heart, User as UserIcon, SlidersHorizontal, Database } from 'lucide-react';
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy, limit, serverTimestamp, getDocFromServer, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// --- FIREBASE INITIALIZATION ---
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// --- ERROR HANDLING ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};
testConnection();

// --- GEMINI INITIALIZATION ---
let genAI: GoogleGenAI | null = null;
const getAI = () => {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is required");
    genAI = new GoogleGenAI({ apiKey: key });
  }
  return genAI;
};

const ADMIN_EMAIL = "northclee@gmail.com";

import { Product, CartItem } from './types';
import { productService } from './services/productService';

const TideLogo = () => (
  <svg width="30" height="28" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-0 overflow-hidden opacity-80">
    <motion.path 
      d="M-48 24C-42 20 -30 28 -24 24C-18 20 -6 28 0 24C6 20 18 28 24 24C30 20 42 28 48 24C54 20 66 28 72 24" 
      stroke="#5a7a9a" 
      strokeWidth="2.2" 
      strokeLinecap="round"
      animate={{ x: [-24, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    />
    <motion.path 
      d="M-48 16C-42 12 -30 20 -24 16C-18 12 -6 20 0 16C6 12 18 20 24 16C30 12 42 20 48 16C54 12 66 20 72 16" 
      stroke="#708090" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      opacity="0.8"
      animate={{ x: [-24, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    />
    <motion.path 
      d="M-48 8C-42 4 -30 12 -24 8C-18 4 -6 12 0 8C6 4 18 12 24 8C30 4 42 12 48 8C54 4 66 12 72 8" 
      stroke="#8ba0b0" 
      strokeWidth="1.4" 
      strokeLinecap="round" 
      opacity="0.6"
      animate={{ x: [-24, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    />
  </svg>
);

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCart: (cart: CartItem[]) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);
const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

interface WishlistContextType {
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);
const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};


// --- CONTEXT FOR EDITOR ---
interface EditorContextType {
  isEditMode: boolean;
  updateField: (path: string, value: string) => void;
  updateListItem: (listPath: string, id: string, field: string, value: string) => void;
  updateImageFilter: (url: string, filterClass: string) => void;
  marqueeText: string;
  imageFilters: Record<string, string>;
  globalPhotoFilter: string;
}

const EditorContext = createContext<EditorContextType | null>(null);

const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within an EditorProvider');
  return context;
};

// --- HELPERS FOR EDITABLE CONTENT ---

interface EditableTextProps {
  path?: string; 
  value: string; 
  className?: string; 
  multiline?: boolean;
  listPath?: string;
  id?: string;
  field?: string;
}

const EditableText: React.FC<EditableTextProps> = ({ 
  path, 
  value, 
  className, 
  multiline = false,
  listPath,
  id,
  field
}) => {
  const { isEditMode, updateField, updateListItem } = useEditor();
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  if (!isEditMode) return <span className={className}>{value || ""}</span>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (listPath && id && field) {
      updateListItem(listPath, id, field, e.target.value);
    } else if (path) {
      updateField(path, e.target.value);
    }
  };

  const handleAIRefine = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    try {
      const ai = getAI();
      const systemInstruction = "You are an expert luxury brand copywriter for 'MEI MAREA', a high-end Italian jewelry boutique. Your task is to REFINE and ELEVATE the provided text while strictly adhering to the user's style instructions. You MUST preserve the core message and specific details of the original text, but transform the phrasing to be more sophisticated, minimal, and poetic. Do not hallucinate new features; just polish the existing draft. Return ONLY the improved text without quotes or commentary.";
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `[Original Text]: "${value}"\n[Edit Instruction]: "${aiPrompt}"`,
        config: {
          systemInstruction
        }
      });

      const refinedText = response.text || value;
      
      if (listPath && id && field) {
        updateListItem(listPath, id, field, refinedText);
      } else if (path) {
        updateField(path, refinedText);
      }
      setShowAI(false);
      setAiPrompt("");
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group/text w-full" ref={containerRef}>
      {multiline ? (
        <textarea
          value={value || ""}
          onChange={handleChange}
          className={`${className} bg-gray-50 border-none outline-none w-full p-2 focus:ring-1 focus:ring-black rounded-none resize-none`}
          rows={Math.max(2, (value || "").split('\n').length)}
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={handleChange}
          className={`${className} bg-gray-50 border-none outline-none w-full p-1 focus:ring-1 focus:ring-black rounded-none`}
        />
      )}
      
      <button 
        onClick={() => setShowAI(!showAI)}
        className="absolute -top-3 -right-3 p-1.5 bg-white border border-black shadow-md rounded-full text-black hover:bg-black hover:text-white z-20 transition-transform hover:scale-110 active:scale-95"
        title="AI로 문구 다듬기"
      >
        <Sparkles size={14} />
      </button>

      <AnimatePresence>
        {showAI && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-[240px] bg-white border border-black p-4 z-[60] shadow-xl"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
              <Sparkles size={10} /> AI 문구 에디터
            </p>
            <input 
              autoFocus
              type="text" 
              placeholder="예: 더 우아하게, 짧게 요약해줘..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIRefine()}
              className="w-full text-[11px] border border-gray-200 p-2 mb-3 outline-none focus:border-black"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleAIRefine}
                disabled={isLoading}
                className="flex-grow bg-black text-white text-[10px] font-bold py-2 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : '적용'}
              </button>
              <button 
                onClick={() => setShowAI(false)}
                className="px-3 border border-gray-200 text-[10px]"
              >
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const EditableImage = ({ 
  path, 
  src, 
  alt, 
  className,
  listPath,
  id,
  field = 'img'
}: { 
  path?: string; 
  src: string; 
  alt: string; 
  className?: string;
  listPath?: string;
  id?: string;
  field?: string;
}) => {
  const { isEditMode, updateField, updateListItem, imageFilters, updateImageFilter, globalPhotoFilter } = useEditor();
  const [isHovered, setIsHovered] = useState(false);
  const [tempUrl, setTempUrl] = useState(src);
  const [tempFilter, setTempFilter] = useState(imageFilters[src] || '');

  useEffect(() => {
    setTempUrl(src);
    setTempFilter(imageFilters[src] || '');
  }, [src, imageFilters]);

  const handleSave = () => {
    if (listPath && id && field) {
      updateListItem(listPath, id, field, tempUrl);
    } else if (path) {
      updateField(path, tempUrl);
    }
    updateImageFilter(src, tempFilter);
    setIsHovered(false);
  };

  const currentFilterClass = imageFilters[src] !== undefined ? imageFilters[src] : globalPhotoFilter;
  
  return (
    <div 
      className="relative group"
      onMouseEnter={() => isEditMode && setIsHovered(true)}
      onMouseLeave={() => isEditMode && setIsHovered(false)}
    >
      <img 
        src={src} 
        alt={alt} 
        className={`${className} ${currentFilterClass}`} 
        referrerPolicy="no-referrer"
      />
      <AnimatePresence>
        {isEditMode && isHovered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 z-40 overflow-y-auto"
          >
            <div className="bg-white p-4 w-full max-w-sm flex flex-col gap-3">
              <p className="text-[9px] font-bold tracking-[0.1em] text-gray-500 uppercase flex items-center gap-2">
                <ImageIcon size={12} /> 이미지 필터 
              </p>
              {(path || listPath) && (
                <input 
                  type="text" 
                  value={tempUrl} 
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="text-[11px] border border-gray-200 p-2 outline-none focus:border-black w-full"
                  placeholder="이미지 주소를 입력하세요"
                />
              )}
              <select 
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                className="text-[11px] border border-gray-200 p-2 outline-none focus:border-black w-full bg-white"
              >
                <option value="">필터 없음 (None)</option>
                <option value="retro-filter">Retro</option>
                <option value="filter-kodachrome">Kodachrome</option>
                <option value="filter-agfa-vista">Agfa Vista</option>
                <option value="filter-agfa-ultra">Agfa Ultra</option>
                <option value="filter-fuji-fortia">Fuji Fortia SP</option>
                <option value="filter-analog-film">Analog Film</option>
              </select>
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-grow bg-black text-white text-[10px] font-bold py-2 flex items-center justify-center gap-1">
                  <Check size={12} /> 적용
                </button>
                <button onClick={() => { setTempUrl(src); setTempFilter(imageFilters[src]||''); setIsHovered(false); }} className="px-4 border border-gray-200 text-[10px] py-2">
                  <X size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {isEditMode && (
        <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full pointer-events-none group-hover:hidden">
          <ImageIcon size={14} />
        </div>
      )}
    </div>
  );
};

// --- INITIAL CONFIGURATION ---
const INITIAL_CONFIG = {
  labels: {
    newSeason: '뉴 시즌',
    taxIncluded: '관세 포함',
    oneSize: '원사이즈 상품',
    addToBag: '쇼핑백에 담기',
    wishlist: '위시리스트',
    deliveryEstimate: '예상 배송일',
    deliveryDates: '5월 7일 - 5월 12일',
    freeReturnTitle: '30일 무료 반품 | 집으로 찾아오는 간편한 반품 픽업',
    descTitle: '상품 설명',
    shippingTitle: '배송 & 반품',
    shippingDesc: '모든 주문에 대해 반품 픽업 서비스가 무료로 제공됩니다.',
    breadcrumbRoot: '여성',
    shopTitle: '주얼리',
    allBrands: '전체 브랜드',
    allCategories: '전체',
    backLink: '액세서리 돌아가기'
  },
  navMainMenu: [
    {
      id: 'women', label: '여성 컬렉션', subCategories: [
        { id: 'w1', label: '새로운 게 필요할 땐' },
        { id: 'w2', label: '바캉스' },
        { id: 'w3', label: '브랜드' },
        { id: 'w4', label: '의류' },
        { id: 'w5', label: '슈즈' },
        { id: 'w6', label: '백' },
        { id: 'w7', label: '액세서리' },
        { id: 'w8', label: '주얼리' },
      ]
    },
    {
       id: 'men', label: '남성 컬렉션', subCategories: [
        { id: 'm1', label: '새로운 컬렉션' },
        { id: 'm2', label: '브랜드' },
        { id: 'm3', label: '의류' },
        { id: 'm4', label: '슈즈' },
        { id: 'm5', label: '백' },
        { id: 'm6', label: '액세서리' },
       ]
    },
    {
       id: 'kids', label: '키즈 컬렉션', subCategories: [
        { id: 'k1', label: '여아 (2-12세)' },
        { id: 'k2', label: '남아 (2-12세)' },
        { id: 'k3', label: '베이비 (0-36개월)' },
       ]
    }
  ],
  marquee: {
    text: 'NEW COLLECTION OUT NOW — FREE WORLDWIDE SHIPPING ON ALL ORDERS OVER $500 — HANDCRAFTED IN ITALY'
  },
  brand: {
    name: 'MEI MAREA',
    concept: '이탈리아 장인 주얼리 셀렉션 부티크',
    description: '장인 정신과 현대적 미학을 결합한 프리미엄 주얼리 브랜드',
    selectionBoutique: {
      title: 'SELECTION BOUTIQUE',
      subtitle: '이탈리아 장인 정신의 정수',
      description: '메이 마레아는 이탈리아 전역의 유서 깊은 공방과 현대적 장인들로부터 가장 독창적인 주얼리를 엄선합니다. 우리는 전통적인 금속 공예 기술과 전위적인 디자인이 교차하는 지점을 탐구하며, 단순한 장신구를 넘어선 하나의 예술 작품으로서의 가치를 지향합니다.',
      image: 'https://images.unsplash.com/photo-1573333243148-5256e076633f?q=80&w=2072&auto=format&fit=crop'
    }
  },
  navigation: [
    { label: '컬렉션', href: '#' },
    { label: '장인', href: '#', active: true },
    { label: '에디토리얼', href: '#' },
    { label: '아카이브', href: '#' },
  ],
  hero: {
    title: '예술적\n숙련',
    description: '손과 재료 사이의 고요한 대화.\n과정, 존재, 그리고 장식의 미학에 관한 기록입니다.',
    cta: '제작자 알아보기',
    image: 'https://images.unsplash.com/photo-1610492421943-88cc2974ab6e?q=80&w=2070&auto=format&fit=crop',
  },
  theme: {
    photoFilter: 'retro-filter',
    imageFilters: {} as Record<string, string>
  },
  curatedSeries: {
    label: 'SERIES 01 — FORM',
    title: '엄선된 제품',
    products: [
      { id: 'eclipse', name: '이클립스 링', material: 'STERLING SILVER', img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop' },
      { id: 'void', name: '보이드 네크리스', material: 'OXIDIZED SILVER', img: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=1974&auto=format&fit=crop' },
      { id: 'fracture', name: '프랙처 이어링', material: 'WHITE GOLD', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1974&auto=format&fit=crop' },
      { id: 'linear', name: '리니어 브레이슬릿', material: 'PLATINUM', img: 'https://images.unsplash.com/photo-1611085583191-a3b1aee33433?q=80&w=2070&auto=format&fit=crop' }
    ]
  },
  profiles: {
    label: 'VOL. 01 — FLORENCE',
    title: '아카이브: 선정된 프로필',
    viewCollectionLabel: '컬렉션 보기',
    primary: {
      name: '엘레나 로시 (ELENA ROSSI)',
      role: '마스터 실버헤드',
      bio: '"구조적 기하학을 전문으로 하는 마스터 실버헤드. 그녀의 작업은 브루탈리즘 건축의 렌즈를 통해 전통적인 기술을 재정의합니다."',
      image: 'https://images.unsplash.com/photo-1611095773767-114b53ef539f?q=80&w=2070&auto=format&fit=crop'
    },
    secondary: {
      name: '마테오 비앙키 (MATTEO BIANCHI)',
      bio: '"여백에 집중하다. 비앙키의 접근 방식은 필수적인 구조만 남을 때까지 재료를 제거하여, 부정적인 공간(negative space)에 의해 정의되는 작품을 창조합니다."',
      image: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070&auto=format&fit=crop'
    },
    study: {
      label: '재질 연구',
      name: '001. 원석 은 (RAW SILVER)',
      image: 'https://images.unsplash.com/photo-1626497746870-394200787593?q=80&w=1964&auto=format&fit=crop'
    }
  },
  featured: {
    title: '장식의 미학',
    description: '형태, 그림자, 그리고 여백에 대한 연구.\n실용적인 디자인과 조각적 주얼리의 교차점을 조명합니다.',
    mainImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb0ce33e?q=80&w=2070&auto=format&fit=crop',
    mainLabel: '대표 제품 // OBLIVION CHOKER',
    detail1: 'https://images.unsplash.com/photo-1630019017590-f024b6e0c0b4?q=80&w=1969&auto=format&fit=crop',
    detail1Label: '상세 / 01',
    detail2: 'https://images.unsplash.com/photo-1543840922-38379ba4a29a?q=80&w=2070&auto=format&fit=crop',
    detail2Label: '상세 / 02'
  },
  archiveSeries: {
    label: 'SERIES 02 — VOID',
    title: '아카이브 제품',
    items: [
      { id: 'tension', name: '텐션 링', detail: 'BRUSHED STEEL', img: 'https://images.unsplash.com/photo-1617038220319-276d3acb2824?q=80&w=1974&auto=format&fit=crop' },
      { id: 'gravity', name: '그래비티 펜던트', detail: 'OBSIDIAN & SILVER', img: 'https://images.unsplash.com/photo-1589674781757-0a93182367ac?q=80&w=1965&auto=format&fit=crop' },
      { id: 'monolith', name: '모노리스 시그넷', detail: 'BLACKENED GOLD', img: 'https://images.unsplash.com/photo-1629193512534-110037a3c398?q=80&w=2070&auto=format&fit=crop' },
      { id: 'industrial', name: '인더스트리얼 체인', detail: 'TITANIUM', img: 'https://images.unsplash.com/photo-1531995811006-35cb42e1a022?q=80&w=2070&auto=format&fit=crop' }
    ]
  },
  footer: {
    links: [
      { label: '인스타그램', href: '#' },
      { label: '저널', href: '#' },
      { label: '개인정보 보호 정책', href: '#' },
      { label: '문의하기', href: '#' }
    ],
    copyright: '© 2024 MEI MAREA. ALL RIGHTS RESERVED.'
  }
};

// --- MARQUEE COMPONENT ---
const Marquee = () => {
  const { marqueeText, isEditMode } = useEditor();
  
  return (
    <div className="bg-black text-white h-8 flex items-center overflow-hidden border-b border-white/10 relative">
      <div className="marquee-content text-[9px] font-bold tracking-[0.3em] uppercase items-center gap-16 px-8">
        <span className="flex-shrink-0">{marqueeText}</span>
        <span className="flex-shrink-0">{marqueeText}</span>
        <span className="flex-shrink-0">{marqueeText}</span>
        <span className="flex-shrink-0">{marqueeText}</span>
        {/* We duplicate for seamless coverage */}
        <span className="flex-shrink-0">{marqueeText}</span>
        <span className="flex-shrink-0">{marqueeText}</span>
        <span className="flex-shrink-0">{marqueeText}</span>
        <span className="flex-shrink-0">{marqueeText}</span>
      </div>
      {isEditMode && (
        <div className="absolute inset-0 z-10 flex items-center bg-black/95 px-4 w-full">
          <EditableText path="marquee.text" value={marqueeText} className="text-white bg-transparent border-none p-0 focus:ring-0 w-full text-[10px] tracking-widest font-mono" />
        </div>
      )}
    </div>
  );
};

// --- PRODUCT CARD COMPONENT ---
const ProductCard: React.FC<{ product: Product, config?: typeof INITIAL_CONFIG }> = ({ product, config }) => {
  const getFilter = (url: string) => {
    if (config?.theme?.imageFilters && config.theme.imageFilters[url]) {
      return config.theme.imageFilters[url];
    }
    return config?.theme?.photoFilter || '';
  };

  return (
    <Link 
      to={`/shop/${product.id}`} 
      className="group/card block"
    >
      <div className="aspect-[3/5] mb-6 overflow-hidden bg-[#f4f4f4] relative flex items-center justify-center">
        <EditableImage 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
        />
        {product.images.length > 1 && (
          <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-all duration-700 flex">
            <EditableImage 
              src={product.images[1]} 
              alt={`${product.name} alternate`} 
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
            />
          </div>
        )}
      </div>
      <div className="text-center px-2">
        <div className="text-[13px] font-medium tracking-widest mb-2 uppercase">
          {product.name}
        </div>
        <div className="text-[11px] text-gray-500 font-mono">
          ₩{product.price.toLocaleString()}
        </div>
      </div>
    </Link>
  );
};

// --- PAGE: HOME ---
const HomePage = ({ config, user }: { config: typeof INITIAL_CONFIG, user: User | null }) => {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(4));
        const snap = await getDocs(q);
        setLatestProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch (e) {
        console.error(e);
      }
    };
    fetchLatest();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <main className="pt-48">
        {/* Hero Section */}
        <section className="px-4 md:px-16 py-12 md:py-24 flex flex-col md:flex-row items-center gap-12 md:gap-24">
          <motion.div className="w-full md:w-5/12" {...fadeInUp}>
            <div className="text-4xl md:text-6xl font-medium uppercase tracking-[0.05em] leading-tight mb-8">
              <EditableText path="hero.title" value={config.hero.title} multiline />
            </div>
            <div className="text-lg md:text-xl text-gray-600 mb-12 max-w-md leading-relaxed">
              <EditableText path="hero.description" value={config.hero.description} multiline />
            </div>
            <Link to="/shop" className="inline-block border border-black px-12 py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300">
              <EditableText path="hero.cta" value={config.hero.cta} />
            </Link>
          </motion.div>
          
          <motion.div 
            className="w-full md:w-7/12"
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2 }}
          >
            <EditableImage 
              path="hero.image"
              src={config.hero.image} 
              alt="Hero" 
              className="w-full h-auto object-cover aspect-[4/5]"
            />
          </motion.div>
        </section>

        {/* Dynamic New Arrivals Section */}
        {latestProducts.length > 0 && (
          <section className="px-4 md:px-16 py-24 border-t border-black/5">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-2xl font-light tracking-[0.3em] uppercase mb-4">New Arrivals</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Selected from our fall collection</p>
              </div>
              <Link to="/shop" className="text-[9px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-400 hover:border-gray-400 transition-all">
                View All Collection
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {latestProducts.map(product => (
                <ProductCard key={product.id} product={product} config={config} />
              ))}
            </div>
          </section>
        )}

        {/* Selection Boutique Section */}
        <section className="px-4 md:px-16 py-32 bg-black text-white text-center md:text-left overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp}>
              <div className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase mb-4 block">
                <EditableText path="brand.selectionBoutique.title" value={config.brand.selectionBoutique.title} />
              </div>
              <div className="text-3xl md:text-5xl font-medium uppercase tracking-[0.1em] mb-8 leading-tight">
                <EditableText path="brand.selectionBoutique.subtitle" value={config.brand.selectionBoutique.subtitle} multiline />
              </div>
              <div className="text-gray-400 max-w-xl leading-loose text-lg italic">
                <EditableText path="brand.selectionBoutique.description" value={config.brand.selectionBoutique.description} multiline />
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <EditableImage 
                path="brand.selectionBoutique.image"
                src={config.brand.selectionBoutique.image} 
                alt="Boutique" 
                className="w-full h-auto object-cover aspect-[16/9] border border-white/10"
              />
              <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-white/20 -translate-y-4 translate-x-4 hidden md:block"></div>
            </motion.div>
          </div>
        </section>

        <div className="px-4 md:px-16 pt-32">
          <div className="w-full h-[1px] bg-black opacity-10"></div>
        </div>

        {/* Curated Pieces */}
        <section className="px-4 md:px-16 py-32">
          <div className="flex justify-between items-end mb-16 px-1">
            <div className="text-3xl font-medium uppercase tracking-[0.1em]">
              <EditableText path="curatedSeries.title" value={config.curatedSeries.title} />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <EditableText path="curatedSeries.label" value={config.curatedSeries.label} />
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-12"
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
          >
            {config.curatedSeries.products.map((product) => (
              <motion.div key={product.id} className="w-full" variants={fadeInUp}>
                <div className="aspect-[3/5] mb-6 overflow-hidden bg-gray-100">
                  <EditableImage 
                    listPath="curatedSeries.products"
                    id={product.id}
                    src={product.img} 
                    alt={product.name} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="text-center px-1">
                  <div className="text-[13px] font-medium uppercase tracking-[0.15em] mb-2">
                    <EditableText listPath="curatedSeries.products" id={product.id} field="name" value={product.name} />
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                    <EditableText listPath="curatedSeries.products" id={product.id} field="material" value={product.material} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Profiles */}
        <section className="px-4 md:px-16 py-32 bg-gray-50/50">
          <div className="flex justify-between items-end mb-16 px-4">
            <div className="text-3xl font-medium uppercase tracking-[0.1em]">
              <EditableText path="profiles.title" value={config.profiles.title} />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <EditableText path="profiles.label" value={config.profiles.label} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
            <motion.div className="col-span-1 md:col-span-7" {...fadeInUp}>
              <div className="aspect-[4/3] overflow-hidden mb-12">
                <EditableImage 
                  path="profiles.primary.image"
                  src={config.profiles.primary.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="max-w-md">
                <div className="text-2xl font-bold uppercase tracking-[0.1em] mb-4">
                  <EditableText path="profiles.primary.name" value={config.profiles.primary.name} />
                </div>
                <div className="text-gray-600 mb-8 leading-relaxed italic">
                  <EditableText path="profiles.primary.bio" value={config.profiles.primary.bio} multiline />
                </div>
                <a href="#" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] border-b border-black pb-1">
                  <EditableText path="profiles.viewCollectionLabel" value={config.profiles.viewCollectionLabel} /> <ChevronRight size={14} />
                </a>
              </div>
            </motion.div>

            <motion.div 
              className="col-span-1 md:col-span-5 md:pt-32"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="border border-gray-200 p-8 mb-12 bg-white">
                <div className="aspect-square bg-gray-100 mb-6">
                  <EditableImage 
                    path="profiles.study.image"
                    src={config.profiles.study.image} 
                    alt="Study" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase block mb-1">
                    <EditableText path="profiles.study.label" value={config.profiles.study.label} />
                  </div>
                  <div className="text-sm font-medium">
                    <EditableText path="profiles.study.name" value={config.profiles.study.name} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="px-4 md:px-16 py-32 text-center">
          <motion.div {...fadeInUp}>
            <div className="text-3xl md:text-4xl font-medium uppercase tracking-[0.2em] mb-8">
              <EditableText path="featured.title" value={config.featured.title} />
            </div>
            <div className="text-gray-600 max-w-2xl mx-auto mb-24 leading-loose">
              <EditableText path="featured.description" value={config.featured.description} multiline />
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <motion.div 
              className="col-span-1 md:col-span-7 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <EditableImage 
                path="featured.mainImage"
                src={config.featured.mainImage} 
                alt="Featured" 
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute bottom-8 left-8 bg-white/95 p-6 text-left border border-gray-100 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em]">
                  <EditableText path="featured.mainLabel" value={config.featured.mainLabel} />
                </div>
              </div>
            </motion.div>
            
            <div className="col-span-1 md:col-span-5 flex flex-col gap-24">
              <motion.div className="text-right" {...fadeInUp}>
                <EditableImage 
                  path="featured.detail1"
                  src={config.featured.detail1} 
                  alt="Detail 1" 
                  className="w-[85%] ml-auto aspect-square object-cover"
                />
                <div className="text-[9px] font-bold tracking-[0.2em] text-gray-400 mt-4 uppercase">
                  <EditableText path="featured.detail1Label" value={config.featured.detail1Label} />
                </div>
              </motion.div>
              <motion.div 
                className="text-left"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <EditableImage 
                  path="featured.detail2"
                  src={config.featured.detail2} 
                  alt="Detail 2" 
                  className="w-[90%] aspect-[4/3] object-cover"
                />
                <div className="text-[9px] font-bold tracking-[0.2em] text-gray-400 mt-4 uppercase">
                  <EditableText path="featured.detail2Label" value={config.featured.detail2Label} />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Second Profile */}
        <section className="px-4 md:px-16 py-32 bg-black text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            <motion.div className="col-span-1 md:col-span-4 order-2 md:order-1" {...fadeInUp}>
              <div className="text-2xl font-bold uppercase tracking-[0.1em] mb-6">
                <EditableText path="profiles.secondary.name" value={config.profiles.secondary.name} />
              </div>
              <div className="text-gray-400 mb-10 leading-relaxed italic">
                <EditableText path="profiles.secondary.bio" value={config.profiles.secondary.bio} multiline />
              </div>
              <a href="#" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] border-b border-white pb-1">
                <EditableText path="profiles.viewCollectionLabel" value={config.profiles.viewCollectionLabel} /> <ChevronRight size={14} />
              </a>
            </motion.div>
            <motion.div 
              className="col-span-1 md:col-span-8 order-1 md:order-2"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            >
              <div className="border border-white/10 p-2">
                <EditableImage 
                  path="profiles.secondary.image"
                  src={config.profiles.secondary.image} 
                  alt="Secondary Profile" 
                  className="w-full aspect-[16/9] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Archive Pieces */}
        <section className="px-4 md:px-16 py-32">
          <div className="flex justify-between items-end mb-16">
            <div className="text-3xl font-medium uppercase tracking-[0.1em]">
              <EditableText path="archiveSeries.title" value={config.archiveSeries.title} />
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
              <EditableText path="archiveSeries.label" value={config.archiveSeries.label} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {config.archiveSeries.items.map((item) => (
              <motion.div key={item.id} className="group" {...fadeInUp}>
                <div className="aspect-[3/5] mb-6 overflow-hidden bg-gray-100">
                  <EditableImage 
                    listPath="archiveSeries.items"
                    id={item.id}
                    src={item.img} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="text-center">
                  <div className="text-[13px] font-medium uppercase tracking-[0.15em] mb-2">
                    <EditableText listPath="archiveSeries.items" id={item.id} field="name" value={item.name} />
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                    <EditableText listPath="archiveSeries.items" id={item.id} field="detail" value={item.detail} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

// --- PAGE: SHOP ---
const ShopPage = ({ user, config }: { user: User | null, config: typeof INITIAL_CONFIG }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEditMode } = useEditor();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "", price: 0, description: "", images: [""], category: "", brand: "", stock: 0
  });
  
  const [searchParams] = useSearchParams();
  const brandFilter = searchParams.get('brand');
  const categoryFilter = searchParams.get('category');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState<string>('Latest arrivals');

  const fetchProducts = async () => {
    try {
      const docs = await productService.fetchProducts();
      setProducts(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async () => {
    console.log("Attempting to add product:", newProduct);
    setErrorMsg(null);
    if (!newProduct.name || !newProduct.price) {
      setErrorMsg("Name and Price are required.");
      return;
    }
    
    if (!user) {
      setErrorMsg("You must be logged in to save products.");
      return;
    }

    try {
      const path = 'products';
      console.log("Sending to Firestore...");
      await addDoc(collection(db, path), {
        ...newProduct,
        createdAt: serverTimestamp()
      }).catch(err => {
        console.error("Firestore inner error:", err);
        handleFirestoreError(err, OperationType.WRITE, path);
      });
      
      console.log("Product saved successfully");
      setShowAddModal(false);
      setNewProduct({ name: "", price: 0, description: "", images: [""], category: "", brand: "", stock: 0 });
      fetchProducts();
    } catch (err: any) {
      console.error("Caught error in handleAddProduct:", err);
      try {
        const errorData = JSON.parse(err.message);
        setErrorMsg(`저장 실패: ${errorData.error || '접근 권한이 없습니다.'} (Firebase Auth에 권한이 부족합니다)`);
      } catch {
        setErrorMsg(`제품 저장 중 오류가 발생했습니다: ${err.message || 'Unknown error'}`);
      }
    }
  };

  let filteredProducts = products.filter(p => {
    if (brandFilter && p.brand !== brandFilter) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    return true;
  });

  if (sortOption === 'Price: Low to high') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOption === 'Price: High to low') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortOption === 'Latest arrivals') {
    filteredProducts.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }

  const uniqueBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  if (loading) return <div className="pt-48 flex justify-center"><Loader2 className="animate-spin text-gray-300" /></div>;

  return (
    <div className="pt-48 px-0 md:px-0 mb-24 w-full min-h-screen">
      <div className="flex flex-col items-center mb-16 relative w-full pt-8 px-4 md:px-12">
        <Link to="/" className="flex items-center text-sm font-medium hover:text-gray-500 transition-colors mb-8 text-gray-900 absolute left-4 md:left-12 top-8">
          <ArrowLeft size={16} className="mr-2" />
          <EditableText path="labels.backLink" value={config.labels.backLink || '돌아가기'} />
        </Link>
        
        <h1 className="text-3xl font-bold tracking-tight mb-8 mt-12">
          {brandFilter || categoryFilter || <EditableText path="labels.shopTitle" value={config.labels.shopTitle} />}
        </h1>
      </div>

      <div className="flex flex-col gap-8 w-full items-start">
        {/* Main Content */}
        <div className="flex-1 w-full relative">
          <div className="flex justify-between items-center mb-8 px-4 md:px-12">
            <div className="text-[13px] font-bold">{filteredProducts.length}개의 결과</div>
            <div className="flex items-center gap-6">
              {isAdmin && (
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-bold uppercase tracking-widest hover:text-gray-500 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} /> 제품 추가
                </button>
              )}
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="text-[13px] font-bold hover:text-gray-500 transition-colors gap-2 flex items-center"
              >
                <SlidersHorizontal size={14} />
                필터
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-16 w-full px-4 md:px-12">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} config={config} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-32 text-gray-400 text-sm font-bold tracking-widest uppercase">
              결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-[200]" 
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[210] shadow-2xl overflow-y-auto px-8 py-10"
            >
              <div className="flex items-center justify-between mb-16 border-b border-gray-200 pb-6">
                <h2 className="text-xl font-bold uppercase tracking-widest">Filter</h2>
                <button onClick={() => setIsFilterOpen(false)} className="hover:opacity-70">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex flex-col gap-12">
                <div>
                  <h3 className="text-[13px] font-bold tracking-widest uppercase mb-4">SORT</h3>
                  <ul className="space-y-4 text-sm text-[#111]">
                    {['Latest arrivals', 'Trending', 'Price: Low to high', 'Price: High to low', 'Discount: High to low'].map(option => (
                      <li key={option}>
                        <button 
                          onClick={() => {
                            setSortOption(option);
                            setIsFilterOpen(false);
                          }}
                          className={`transition-colors text-left uppercase hover:underline ${sortOption === option ? 'font-bold underline' : ''}`}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold tracking-widest uppercase mb-4">CATEGORIES</h3>
                  <ul className="space-y-4 text-sm text-[#111]">
                    <li>
                      <Link 
                        to={`/shop${brandFilter ? `?brand=${brandFilter}` : ''}`}
                        className={`transition-colors uppercase hover:underline ${!categoryFilter ? 'font-bold underline' : ''}`}
                        onClick={() => setIsFilterOpen(false)}
                      >
                        All Categories
                      </Link>
                    </li>
                    {config.navMainMenu?.flatMap(m => m.subCategories || []).map(category => (
                      <li key={category.label}>
                        <Link 
                          to={`/shop?category=${encodeURIComponent(category.label)}${brandFilter ? `&brand=${brandFilter}` : ''}`}
                          className={`transition-colors uppercase hover:underline ${categoryFilter === category.label ? 'font-bold underline' : ''}`}
                          onClick={() => setIsFilterOpen(false)}
                        >
                          {category.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold tracking-widest uppercase mb-4">DESIGNERS</h3>
                  <ul className="space-y-4 text-sm text-[#111]">
                    <li>
                      <Link 
                        to={`/shop${categoryFilter ? `?category=${categoryFilter}` : ''}`}
                        className={`transition-colors uppercase hover:underline ${!brandFilter ? 'font-bold underline' : ''}`}
                        onClick={() => setIsFilterOpen(false)}
                      >
                        All Designers
                      </Link>
                    </li>
                    {uniqueBrands.map(brand => (
                      <li key={brand}>
                        <Link 
                          to={`/shop?brand=${encodeURIComponent(brand)}${categoryFilter ? `&category=${categoryFilter}` : ''}`}
                          className={`transition-colors uppercase hover:underline ${brandFilter === brand ? 'font-bold underline' : ''}`}
                          onClick={() => setIsFilterOpen(false)}
                        >
                          {brand}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 w-full max-w-lg border border-black shadow-2xl">
            <h2 className="text-xl font-light tracking-widest mb-8 text-center">ADD NEW PRODUCT</h2>
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                {errorMsg}
              </div>
            )}
            <div className="space-y-6">
              <input 
                placeholder="Product Name" 
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full border-b border-black/10 py-2 outline-none focus:border-black text-sm"
              />
              <input 
                placeholder="Brand" 
                value={newProduct.brand || ""}
                onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                className="w-full border-b border-black/10 py-2 outline-none focus:border-black text-sm"
              />
              <input 
                placeholder="Price (Number)" 
                type="number"
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                className="w-full border-b border-black/10 py-2 outline-none focus:border-black text-sm"
              />
              <select 
                value={newProduct.category}
                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full border-b border-black/10 py-2 outline-none focus:border-black text-sm bg-transparent"
              >
                <option value="">Select Category</option>
                {config.navMainMenu?.flatMap(m => m.subCategories || []).map((menu, idx) => (
                  <option key={idx} value={menu.label}>{menu.label}</option>
                ))}
              </select>
              <textarea 
                placeholder="Description" 
                value={newProduct.description}
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                className="w-full border border-black/10 p-3 h-32 outline-none focus:border-black text-sm"
              />
              <input 
                placeholder="Image URL" 
                value={newProduct.images?.[0]}
                onChange={e => setNewProduct({...newProduct, images: [e.target.value]})}
                className="w-full border-b border-black/10 py-2 outline-none focus:border-black text-sm"
              />
              <input 
                placeholder="Stock Quantity" 
                type="number"
                value={newProduct.stock}
                onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                className="w-full border-b border-black/10 py-2 outline-none focus:border-black text-sm"
              />
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleAddProduct}
                  className="flex-grow bg-black text-white py-3 text-[11px] font-bold tracking-widest"
                >
                  SAVE PRODUCT
                </button>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 border border-black/10 text-[11px]"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT: PRODUCT EDIT VIEW ---
const ProductEditView = ({ id, onClose }: { id: string, onClose: () => void }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await productService.fetchProductById(id);
        if (data) setProduct(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    try {
      const updates: any = {};
      if (product.name !== undefined) updates.name = product.name;
      if (product.category !== undefined) updates.category = product.category;
      if (product.brand !== undefined) updates.brand = product.brand;
      if (product.price !== undefined) updates.price = Number(product.price) || 0;
      if (product.stock !== undefined) updates.stock = Number(product.stock) || 0;
      if (product.images !== undefined) updates.images = product.images;
      if (product.description !== undefined) updates.description = product.description;
      
      await productService.updateProduct(id, updates);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(`Failed to save product: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-gray-300" /></div>;
  if (!product) return <div className="p-20 text-center">Product not found.</div>;

  return (
    <form onSubmit={handleSave} className="p-8 space-y-6">
      {error && <div className="p-4 bg-red-50 text-red-600 text-xs mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Product Name</label>
            <input 
              value={product.name} 
              onChange={e => setProduct({...product, name: e.target.value})}
              className="w-full border-b border-gray-100 py-2 outline-none focus:border-black text-sm uppercase font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Category</label>
            <input 
              value={product.category} 
              onChange={e => setProduct({...product, category: e.target.value})}
              className="w-full border-b border-gray-100 py-2 outline-none focus:border-black text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Brand</label>
            <input 
              value={product.brand || ""} 
              onChange={e => setProduct({...product, brand: e.target.value})}
              className="w-full border-b border-gray-100 py-2 outline-none focus:border-black text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Price (₩)</label>
            <input 
              type="number"
              value={product.price} 
              onChange={e => setProduct({...product, price: Number(e.target.value)})}
              className="w-full border-b border-gray-100 py-2 outline-none focus:border-black text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Stock Quantity</label>
            <input 
              type="number"
              value={product.stock} 
              onChange={e => setProduct({...product, stock: Number(e.target.value)})}
              className="w-full border-b border-gray-100 py-2 outline-none focus:border-black text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Image URL</label>
            <input 
              value={product.images?.[0] || ""} 
              onChange={e => setProduct({...product, images: [e.target.value]})}
              className="w-full border-b border-gray-100 py-2 outline-none focus:border-black text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Description</label>
        <textarea 
          value={product.description || ""} 
          onChange={e => setProduct({...product, description: e.target.value})}
          className="w-full border border-gray-100 p-4 h-32 outline-none focus:border-black text-sm leading-relaxed"
        />
      </div>

      <div className="flex gap-4 pt-8">
        <button 
          type="submit"
          disabled={saving}
          className="flex-grow bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black/90 transition-all flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {saving ? 'Updating...' : 'Confirm Changes'}
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="px-8 border border-gray-100 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-all"
        >
          Discard
        </button>
      </div>
    </form>
  );
};

// --- PAGE: PRODUCT DETAIL ---
const ProductDetailPage = ({ config, user }: { config: typeof INITIAL_CONFIG, user: User | null }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProductState, setEditProductState] = useState<Partial<Product>>({});
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const data = await productService.fetchProductById(id);
        if (data) {
          setProduct(data);
          setEditProductState(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleUpdateProduct = async () => {
    if (!id || !editProductState.name) return;
    try {
      setEditError(null);
      await productService.updateProduct(id, {
        name: editProductState.name,
        price: Number(editProductState.price),
        description: editProductState.description || '',
        category: editProductState.category || '',
        brand: editProductState.brand || '',
        images: editProductState.images || [''],
        stock: Number(editProductState.stock || 0)
      });
      setProduct({ ...product, ...editProductState } as Product);
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || 'Failed to update product');
    }
  };

  if (loading) return <div className="pt-48 flex justify-center"><Loader2 className="animate-spin text-gray-300" /></div>;
  if (!product) return <div className="pt-48 text-center">Product not found.</div>;

  const getFilter = (url: string) => {
    if (config?.theme?.imageFilters && config.theme.imageFilters[url]) {
      return config.theme.imageFilters[url];
    }
    return config?.theme?.photoFilter || '';
  };

  return (
    <div className="pt-48 px-0 md:px-0 mb-32 w-full min-h-screen">
      <div className="md:px-16 px-4 mb-4">
        <div className="flex items-center gap-2 text-[12px] text-gray-500">
          <Link to="/" className="hover:underline text-gray-900"><EditableText path="labels.breadcrumbRoot" value={config.labels.breadcrumbRoot} /></Link>
          <ChevronRight size={12} className="text-gray-400" />
          <Link to={`/shop?brand=${encodeURIComponent(product.brand || 'Cult Gaia')}`} className="hover:underline text-gray-900">{product.brand || 'Cult Gaia'}</Link>
          <ChevronRight size={12} className="text-gray-400" />
          <Link to={`/shop?category=${encodeURIComponent(product.category || '주얼리')}`} className="hover:underline text-gray-900">{product.category || '주얼리'}</Link>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-gray-500">{product.name}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 relative mt-4">
        {/* Left: Images Area (Thumbnails + Main Img) + Bottom info */}
        <div className="lg:w-[70%] flex flex-col gap-0 border-r border-gray-100">
          {/* Images row */}
          <div className="flex flex-col md:flex-row gap-0">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-4 overflow-x-auto md:w-32 shrink-0 p-8 order-2 md:order-1 bg-white border-r border-gray-50">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={`border-b-2 md:border-b-0 md:border-l-2 transition-all p-1 ${activeImage === idx ? 'border-gray-900' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className={`w-16 md:w-20 object-cover aspect-square ${getFilter(img)}`} />
                </button>
              ))}
            </div>
            
            {/* Main Image */}
            <div className="flex-grow order-1 md:order-2 bg-[#f4f4f4] flex items-center justify-center p-0 relative">
              <EditableImage 
                src={product.images[activeImage] || product.images[0]} 
                alt={product.name} 
                className="w-full h-auto object-contain max-h-screen" 
              />
            </div>
          </div>
          
          {/* Left Accordions */}
          <div className="md:pl-32">
            {/* Accordion Details */}
            <div className="space-y-0 border-t border-gray-200">
              <details className="group border-b border-gray-200" open>
                <summary className="flex justify-between items-center cursor-pointer list-none py-5 text-sm font-medium text-gray-900">
                  <EditableText path="labels.descTitle" value={config.labels.descTitle} />
                  <ChevronRight size={18} className="text-gray-400 group-open:-rotate-90 transition-transform" />
                </summary>
                <div className="pb-6 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description || '상품 상세 설명이 제공되지 않았습니다.'}
                  <div className="mt-4 text-[12px] text-gray-500">
                    <p>브랜드 스타일 ID: {product.id?.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </details>
              
              <details className="group border-b border-gray-200">
                <summary className="flex justify-between items-center cursor-pointer list-none py-5 text-sm font-medium text-gray-900">
                  <EditableText path="labels.shippingTitle" value={config.labels.shippingTitle} />
                  <ChevronRight size={18} className="text-gray-400 group-open:-rotate-90 transition-transform" />
                </summary>
                <div className="pb-6 text-sm text-gray-600 leading-relaxed">
                  <EditableText path="labels.shippingDesc" value={config.labels.shippingDesc} multiline />
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Right: Info Area */}
        <div className="lg:w-[30%] p-8 md:p-16 flex flex-col items-start lg:sticky lg:top-48 h-fit bg-white">
          <div className="flex justify-between items-center mb-2">
            <div className="text-[12px] text-gray-500 whitespace-nowrap"><EditableText path="labels.newSeason" value={config.labels.newSeason} /></div>
            {isAdmin && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs hover:text-gray-500 flex items-center gap-1 uppercase tracking-widest font-bold"
              >
                <Edit3 size={12} /> Edit
              </button>
            )}
          </div>
          
          {/* Title block */}
          <Link to={`/shop?brand=${encodeURIComponent(product.brand || 'Cult Gaia')}`} className="hover:underline block">
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-gray-900">{product.brand || 'Cult Gaia'}</h1>
          </Link>
          <div className="text-sm text-gray-600 mb-6">{product.name}</div>
          
          {/* Price */}
          <div className="text-lg font-medium mb-1">₩{product.price.toLocaleString()}</div>
          <div className="text-[12px] text-gray-500 mb-8 whitespace-nowrap"><EditableText path="labels.taxIncluded" value={config.labels.taxIncluded} /></div>
          
          {/* Size */}
          <div className="text-sm font-medium mb-6 mt-12 text-gray-900 whitespace-nowrap">
            <EditableText path="labels.oneSize" value={config.labels.oneSize} />
          </div>

          {/* Stock Display */}
          <div className="mb-8 p-3 border border-gray-100 flex items-center justify-between w-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stock Available</span>
            <span className={`text-xs font-mono font-bold ${product.stock > 0 ? 'text-black' : 'text-red-500'}`}>
              {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8 w-full">
            <button 
              disabled={product.stock <= 0}
              onClick={() => product && addToCart(product)}
              className={`flex-1 py-4 text-sm font-medium transition-colors whitespace-nowrap ${product.stock > 0 ? 'bg-[#222222] text-white hover:bg-black' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {product.stock > 0 ? <EditableText path="labels.addToBag" value={config.labels.addToBag} /> : 'SOLD OUT'}
            </button>
            <button 
              onClick={() => product && toggleWishlist(product)}
              className="flex-1 py-4 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <span className="sr-only">Wishlist</span>
              <EditableText path="labels.wishlist" value={config.labels.wishlist} /> 
              <Heart 
                size={18} 
                className="ml-2" 
                fill={product && wishlist.some(item => item.id === product.id) ? "currentColor" : "none"} 
              />
            </button>
          </div>

          {/* Delivery & Returns Info */}
          <div className="mb-4">
            <div className="text-[11px] font-bold text-gray-900 mb-1 whitespace-nowrap"><EditableText path="labels.deliveryEstimate" value={config.labels.deliveryEstimate} /></div>
            <div className="text-[13px] text-gray-800 whitespace-nowrap"><EditableText path="labels.deliveryDates" value={config.labels.deliveryDates} /></div>
          </div>
          
          <div className="bg-gray-100 py-3 px-4 text-[13px] text-gray-700 mb-12 whitespace-nowrap">
            <EditableText path="labels.freeReturnTitle" value={config.labels.freeReturnTitle} />
          </div>

        </div>
      </div>

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-8 w-full max-w-lg border border-black shadow-2xl relative">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 hover:opacity-50"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold tracking-widest mb-8 text-center uppercase">Edit Product</h2>
            
            {editError && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                {editError}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Brand</label>
                <input 
                  value={editProductState.brand || ""}
                  onChange={e => setEditProductState({...editProductState, brand: e.target.value})}
                  className="w-full border-b border-black/20 py-2 outline-none focus:border-black text-sm"
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Product Name</label>
                <input 
                  value={editProductState.name || ""}
                  onChange={e => setEditProductState({...editProductState, name: e.target.value})}
                  className="w-full border-b border-black/20 py-2 outline-none focus:border-black text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Price (₩)</label>
                <input 
                  type="number"
                  value={editProductState.price || 0}
                  onChange={e => setEditProductState({...editProductState, price: Number(e.target.value)})}
                  className="w-full border-b border-black/20 py-2 outline-none focus:border-black text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Category</label>
                <select 
                  value={editProductState.category || ""}
                  onChange={e => setEditProductState({...editProductState, category: e.target.value})}
                  className="w-full border-b border-black/20 py-2 outline-none focus:border-black text-sm bg-transparent"
                >
                  <option value="">Select Category</option>
                  {config.navMainMenu?.flatMap(m => m.subCategories || []).map((menu, idx) => (
                    <option key={idx} value={menu.label}>{menu.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Images (Comma-separated URLs)</label>
                <input 
                  value={(editProductState.images || []).join(", ")}
                  onChange={e => setEditProductState({...editProductState, images: e.target.value.split(",").map(url => url.trim())})}
                  className="w-full border-b border-black/20 py-2 outline-none focus:border-black text-sm"
                  placeholder="https://image1.jpg, https://image2.jpg"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Stock Inventory</label>
                <input 
                  type="number"
                  value={editProductState.stock || 0}
                  onChange={e => setEditProductState({...editProductState, stock: Number(e.target.value)})}
                  className="w-full border-b border-black/20 py-2 outline-none focus:border-black text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block mb-2">Description</label>
                <textarea 
                  value={editProductState.description || ""}
                  onChange={e => setEditProductState({...editProductState, description: e.target.value})}
                  className="w-full border-b border-black/20 py-2 outline-none focus:border-black text-sm min-h-[100px] resize-y"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 border border-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateProduct}
                  className="flex-1 bg-black text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-800"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CART DRAWER COMPONENT ---
const CartDrawer = () => {
  const { cart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, setCart } = useCart();
  const { imageFilters, globalPhotoFilter } = useEditor();
  const totalPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const getFilter = (url: string) => imageFilters[url] !== undefined ? imageFilters[url] : globalPhotoFilter;

  const handleCheckout = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login to proceed with checkout.");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      return;
    }

    try {
      const orderData = {
        userId: user.uid,
        email: user.email!,
        totalAmount: totalPrice,
        status: 'pending',
        items: cart,
        createdAt: serverTimestamp()
      };
      
      const orderRef = await addDoc(collection(db, `users/${user.uid}/orders`), orderData);
      
      // Sync with Google Sheets
      await fetch('/api/sync-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order: { 
            ...orderData, 
            id: orderRef.id,
            createdAt: new Date().toISOString() 
          } 
        })
      });

      alert("ORDER PLACED!\n\nYour order has been recorded and synced to the tracking system.");
      setCart([]);
      setIsCartOpen(false);
    } catch (e) {
      console.error("Checkout error:", e);
      alert("Failed to place order. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[200]" 
            onClick={() => setIsCartOpen(false)}
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[210] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold uppercase tracking-widest">Shopping Bag</h2>
              <button onClick={() => setIsCartOpen(false)} className="hover:opacity-70">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 font-medium uppercase tracking-widest text-sm py-12">
                  Your bag is empty
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex gap-4">
                    <img src={item.product.images[0]} alt={item.product.name} className={`w-24 h-32 object-cover border border-gray-100 ${getFilter(item.product.images[0])}`} />
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wide">{item.product.brand || 'MEI MAREA'}</h3>
                        <p className="text-sm text-gray-500 mb-2">{item.product.name}</p>
                        <p className="text-sm font-medium">₩{item.product.price.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 border border-gray-200 px-3 py-1">
                          <button onClick={() => updateQuantity(item.product.id!, item.quantity - 1)} className="hover:text-gray-500">-</button>
                          <span className="text-xs font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id!, item.quantity + 1)} className="hover:text-gray-500">+</button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.product.id!)}
                          className="text-xs text-gray-500 underline uppercase tracking-wider hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold uppercase tracking-widest text-sm">Total</span>
                  <span className="font-bold text-lg">₩{totalPrice.toLocaleString()}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-black text-white py-4 uppercase font-bold tracking-widest text-sm hover:bg-gray-800 transition-colors"
                >
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- WISHLIST DRAWER COMPONENT ---
const WishlistDrawer = () => {
  const { wishlist, toggleWishlist, isWishlistOpen, setIsWishlistOpen } = useWishlist();
  const { imageFilters, globalPhotoFilter } = useEditor();

  const getFilter = (url: string) => imageFilters[url] !== undefined ? imageFilters[url] : globalPhotoFilter;

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[200]" 
            onClick={() => setIsWishlistOpen(false)}
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[210] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold uppercase tracking-widest">Wishlist</h2>
              <button onClick={() => setIsWishlistOpen(false)} className="hover:opacity-70">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-8">
              {wishlist.length === 0 ? (
                <div className="text-center text-gray-500 font-medium uppercase tracking-widest text-sm py-12">
                  Your wishlist is empty
                </div>
              ) : (
                wishlist.map(product => (
                  <div key={product.id} className="flex gap-4 group">
                    <img src={product.images[0]} alt={product.name} className={`w-24 h-32 object-cover border border-gray-100 ${getFilter(product.images[0])}`} />
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm uppercase tracking-wide">{product.brand || 'Cult Gaia'}</h3>
                        <p className="text-sm text-gray-500 mb-2">{product.name}</p>
                        <p className="text-sm font-medium">₩{product.price.toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={() => toggleWishlist(product)}
                          className="text-xs text-gray-500 underline uppercase tracking-wider hover:text-black"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {wishlist.length > 0 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button 
                  onClick={() => setIsWishlistOpen(false)}
                  className="w-full bg-black text-white py-4 uppercase font-bold tracking-widest text-sm hover:bg-gray-800 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const AccountPage = ({ user }: { user: User | null }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, `users/${user.uid}/orders`), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) return (
    <div className="pt-64 px-4 text-center min-h-[60vh]">
      <h1 className="text-2xl font-light uppercase tracking-widest mb-8">Please Login</h1>
      <button 
        onClick={async () => {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        }} 
        className="border border-black px-12 py-4 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
      >
        Login with Google
      </button>
    </div>
  );

  return (
    <div className="pt-64 px-4 md:px-12 max-w-7xl mx-auto pb-32 min-h-screen">
      <div className="flex flex-col md:flex-row gap-16">
        <div className="md:w-1/3">
          <h1 className="text-3xl font-light uppercase tracking-tighter mb-8 italic">My Account</h1>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Name</p>
              <p className="text-sm font-medium">{user.displayName || 'Guest'}</p>
            </div>
            <button onClick={() => auth.signOut()} className="text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-400 hover:border-gray-400 transition-colors">Sign Out</button>
          </div>
        </div>
        
        <div className="md:w-2/3">
          <h2 className="text-xl font-light uppercase tracking-widest mb-12 border-b border-black/5 pb-4">Order History</h2>
          {loading ? (
             <p className="text-xs font-mono text-gray-400">Loading orders...</p>
          ) : orders.length === 0 ? (
             <p className="text-gray-500 text-sm italic">You haven't placed any orders yet.</p>
          ) : (
            <div className="space-y-8">
              {orders.map(order => (
                <div key={order.id} className="border border-gray-100 p-6 bg-gray-50/30">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Order ID</p>
                      <p className="text-xs font-mono">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black bg-white border border-black px-3 py-1 inline-block">{order.status}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center text-xs">
                        <span className="text-gray-600 truncate mr-4">{item.product.name} x {item.quantity}</span>
                        <span className="font-medium whitespace-nowrap">₩{(item.product.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Total Amount</span>
                    <span className="text-sm font-bold">₩{order.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InventoryPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { imageFilters } = useEditor();

  const fetchProducts = async () => {
    try {
      const data = await productService.fetchProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStock = async (id: string, newStock: number) => {
    // Optimistic update
    const previousProducts = [...products];
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    
    try {
      await productService.updateProduct(id, { stock: newStock });
    } catch (err: any) {
      console.error("Update failed", err);
      // Rollback on failure
      setProducts(previousProducts);
      alert(`Failed to update stock: ${err.message}`);
    }
  };

  const handlePushToSheets = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, action: 'push' })
      });
      
      const result = await response.json();
      if (response.ok) {
        alert("PUSH COMPLETE!\n\nInventory has been pushed to Google Sheets.");
      } else {
        throw new Error(result.error || "Unknown sync error");
      }
    } catch (error: any) {
      console.error("Sync Error:", error);
      alert(`SYNC ERROR:\n\n${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromSheets = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/sync-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, action: 'sync' }) // 'sync' pulls from sheets
      });
      
      const result = await response.json();
      if (response.ok) {
        // Update local state and Firestore with pulled data
        if (result.pulledData && result.pulledData.length > 0) {
          const updates = result.pulledData.map((item: any) => {
            const up: any = {};
            if (item.name !== undefined) up.name = item.name;
            if (item.category !== undefined) up.category = item.category;
            if (item.price !== undefined) up.price = Number(item.price) || 0;
            if (item.stock !== undefined) up.stock = Number(item.stock) || 0;
            if (item.brand !== undefined) up.brand = item.brand;
            return productService.updateProduct(item.id, up);
          });
          await Promise.all(updates);
          await fetchProducts();
        }
        alert("PULL COMPLETE!\n\nInventory synchronized from Google Sheets.");
      } else {
        throw new Error(result.error || "Unknown sync error");
      }
    } catch (error: any) {
      console.error("Sync Error:", error);
      alert(`SYNC ERROR:\n\n${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-mono text-[10px] tracking-widest uppercase">Analyzing Inventory...</div>;

  return (
    <div className="bg-white min-h-screen pt-40 pb-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 border-b border-gray-100 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-tighter mb-2">Inventory Management</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Inventory Status & Stock Analysis</p>
          </div>
          <div className="flex gap-4 items-end">
            <button 
              onClick={handlePullFromSheets}
              disabled={syncing}
              className="px-6 py-3 border border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2"
            >
              {syncing ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              Pull
            </button>
            <button 
              onClick={handlePushToSheets}
              disabled={syncing}
              className="px-6 py-3 bg-black text-white border border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black/90 transition-all flex items-center gap-2"
            >
              {syncing ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
              Push
            </button>
            <div className="text-right border-l border-gray-100 pl-8 ml-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Total Valuation</div>
              <div className="text-xl font-medium">
                ₩{products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">(est.)</span>
              </div>
            </div>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 w-[30%]">SKU / Product</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 w-[15%]">Category</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 w-[15%]">Price</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 w-[150px] text-center">Quantity</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 w-[15%] text-right">Stock Status</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-left">
              {products.map((product) => (
                <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-gray-100 overflow-hidden flex-shrink-0">
                        <img src={product.images[0]} alt={product.name} className={`w-full h-full object-cover ${getFilter(product.images[0])}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium uppercase tracking-wider mb-1 group-hover:text-black transition-colors truncate">{product.name}</div>
                        <div className="text-[9px] text-gray-400 font-mono">ID: {product.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-6">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap">{product.category}</span>
                  </td>
                  <td className="py-6">
                    <span className="text-[11px] font-mono text-gray-700 font-medium">₩{product.price.toLocaleString()}</span>
                  </td>
                  <td className="py-6">
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-4 border border-gray-100 px-3 py-2 bg-white rounded-sm shadow-sm">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateStock(product.id, Math.max(0, (product.stock || 0) - 1));
                          }} 
                          className="hover:text-black text-gray-400 transition-colors w-6 h-6 flex items-center justify-center font-bold text-lg leading-none"
                        >
                          −
                        </button>
                        <input 
                          type="number" 
                          value={product.stock || 0} 
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            handleUpdateStock(product.id, isNaN(val) ? 0 : val);
                          }}
                          className="w-12 text-center text-[13px] font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-transparent"
                        />
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleUpdateStock(product.id, (product.stock || 0) + 1);
                          }} 
                          className="hover:text-black text-gray-400 transition-colors w-6 h-6 flex items-center justify-center font-bold text-lg leading-none"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 text-right">
                    <span className={`text-[11px] font-bold uppercase tracking-widest ${product.stock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    <button 
                      onClick={() => setEditingProduct(product)}
                      className="p-2 hover:bg-black hover:text-white transition-all border border-transparent rounded-sm text-gray-400"
                    >
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Overlay */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setEditingProduct(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white overflow-y-auto shadow-2xl flex flex-col items-stretch z-10"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-sm font-bold uppercase tracking-widest">Edit Product: {editingProduct.name}</h2>
              <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-grow">
              <ProductEditView 
                id={editingProduct.id} 
                onClose={() => {
                  setEditingProduct(null);
                  fetchProducts();
                }} 
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [activeMainMenuId, setActiveMainMenuId] = useState('women');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist State
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('shoppingCart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  // Persistence & Auth Listener
  useEffect(() => {
    const saved = localStorage.getItem('siteConfig');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setConfig(prev => ({
          ...INITIAL_CONFIG,
          ...parsed,
          labels: { ...INITIAL_CONFIG.labels, ...(parsed.labels || {}) },
          brand: { ...INITIAL_CONFIG.brand, ...(parsed.brand || {}) },
          theme: { ...INITIAL_CONFIG.theme, ...(parsed.theme || {}) },
          marquee: { ...INITIAL_CONFIG.marquee, ...(parsed.marquee || {}) }
        }));
      } catch (e) { console.error(e); }
    }
    
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        syncUserWithSheets(u);
        try {
          const wishlistRef = collection(db, `users/${u.uid}/wishlist`);
          const snapshot = await getDocs(wishlistRef);
          
          if (!snapshot.empty) {
            const productPromises = snapshot.docs.map(async d => {
              const pId = d.data().productId;
              const pDoc = await getDoc(doc(db, 'products', pId));
              return pDoc.exists() ? { id: pDoc.id, ...pDoc.data() } as Product : null;
            });
            const prods = (await Promise.all(productPromises)).filter(Boolean) as Product[];
            setWishlist(prods);
          } else {
            setWishlist([]); // Clear if empty
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${u.uid}/wishlist`);
        }
      } else {
        setWishlist([]);
      }
    });
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const toggleWishlist = async (product: Product) => {
    if (!user) {
      // If not logged in, force login
      await login();
      // After login it triggers auth state changed, might be too slow to instantly save.
      // So let's alert for now.
      if (!auth.currentUser) return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (!product.id) return;
    
    const exists = wishlist.some(item => item.id === product.id);
    const wishListDocRef = doc(db, `users/${currentUser.uid}/wishlist`, product.id);

    try {
      if (exists) {
        // Optimistic update locally
        setWishlist(prev => prev.filter(item => item.id !== product.id));
        await deleteDoc(wishListDocRef);
      } else {
        // Optimistic update locally
        setWishlist(prev => [...prev, product]);
        await setDoc(wishListDocRef, {
          productId: product.id,
          addedAt: serverTimestamp() // Add to DB
        });
      }
    } catch (e) {
      handleFirestoreError(e, exists ? OperationType.DELETE : OperationType.CREATE, `users/${currentUser.uid}/wishlist`);
      // Revert optimistic update 
      if (exists) {
         setWishlist(prev => [...prev, product]); // Revert remove
      } else {
         setWishlist(prev => prev.filter(item => item.id !== product.id)); // Revert add
      }
    }
  };


  const logout = () => auth.signOut();
  
  const syncUserWithSheets = async (u: User) => {
    try {
      await fetch('/api/sync-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName
          }
        })
      });
    } catch (error) {
      console.error("Failed to sync user with sheets:", error);
    }
  };

  const saveConfig = (newConfig: typeof INITIAL_CONFIG) => {
    setConfig(newConfig);
    localStorage.setItem('siteConfig', JSON.stringify(newConfig));
  };

  const updateField = (path: string, value: string) => {
    const keys = path.split('.');
    const nextConfig = JSON.parse(JSON.stringify(config));
    let current = nextConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    saveConfig(nextConfig);
  };

  const updateListItem = (listPath: string, id: string, field: string, value: string) => {
    const nextConfig = JSON.parse(JSON.stringify(config));
    const keys = listPath.split('.');
    let list = nextConfig;
    for (const key of keys) { list = list[key]; }
    
    const index = list.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      list[index][field] = value;
      saveConfig(nextConfig);
    }
  };

  const updateImageFilter = (url: string, filterClass: string) => {
    const nextConfig = JSON.parse(JSON.stringify(config));
    if (!nextConfig.theme) nextConfig.theme = {};
    if (!nextConfig.theme.imageFilters) nextConfig.theme.imageFilters = {};
    nextConfig.theme.imageFilters[url] = filterClass;
    saveConfig(nextConfig);
  };

  const contextValue = {
    isEditMode,
    updateField,
    updateListItem,
    updateImageFilter,
    marqueeText: config.marquee?.text || INITIAL_CONFIG.marquee.text,
    imageFilters: config.theme?.imageFilters || {},
    globalPhotoFilter: config.theme?.photoFilter || ''
  };

  return (
    <BrowserRouter>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, setCart }}>
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlistOpen, setIsWishlistOpen }}>
          <EditorContext.Provider value={contextValue}>
            <CartDrawer />
            <WishlistDrawer />
            <div className={`flex flex-col min-h-screen bg-white ${isEditMode ? 'cursor-auto' : ''}`}>
          {/* Edit Mode Toggle */}
          <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-2">
            {isEditMode && (
              <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 mb-2">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-2">Photo Filter</label>
                <select 
                  value={config.theme?.photoFilter || ''}
                  onChange={(e) => saveConfig({...config, theme: {...config.theme, photoFilter: e.target.value}})}
                  className="text-xs border border-gray-200 rounded p-1 outline-none w-40"
                >
                  <option value="">None</option>
                  <option value="retro-filter">Retro</option>
                  <option value="filter-kodachrome">Kodachrome</option>
                  <option value="filter-agfa-vista">Agfa Vista</option>
                  <option value="filter-agfa-ultra">Agfa Ultra</option>
                  <option value="filter-fuji-fortia">Fuji Fortia SP</option>
                </select>
              </div>
            )}
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`group flex items-center gap-3 px-6 py-3 rounded-full shadow-lg transition-all duration-500 ${isEditMode ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
            >
              {isEditMode ? <Check size={18} /> : <Edit3 size={18} />}
              <span className="text-[11px] font-bold tracking-[0.1em] uppercase">
                {isEditMode ? '편집 저장' : '편집 모드'}
              </span>
            </button>
          </div>

          {/* TopNavBar */}
          <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-100">
            <Marquee />
            
            {/* Top row */}
            <div className="py-5 px-4 md:px-12 grid grid-cols-3 items-center">
              {/* Left: Collections */}
              <nav className="hidden md:flex items-center gap-8 text-[12px] font-medium tracking-[0.1em] uppercase">
                {config.navMainMenu?.map(mainMenu => (
                  <Link 
                    key={mainMenu.id} 
                    to={mainMenu.id === 'women' ? '/' : '/shop'} 
                    onMouseEnter={() => setActiveMainMenuId(mainMenu.id)}
                    className={`transition-colors ${activeMainMenuId === mainMenu.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {mainMenu.label}
                  </Link>
                ))}
              </nav>
              
            {/* Center: Logo */}
            <Link to="/" className="flex flex-col items-center justify-center w-full group">
              <div className="text-xl md:text-2xl tracking-[0.35em] text-center uppercase wave-text" style={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 900 }}>
                <EditableText path="brand.name" value={config.brand.name} />
              </div>
            </Link>

              {/* Right: Actions */}
              <div className="flex items-center justify-end gap-6 text-gray-800">
                <div className="flex items-center gap-1 text-[11px] font-medium cursor-pointer uppercase tracking-widest text-gray-600">
                  <span role="img" aria-label="KR">🇰🇷</span> KR
                </div>
                {user ? (
                  <div className="flex items-center gap-3">
                     <Link to="/account" className="hidden md:inline text-[11px] uppercase tracking-widest font-medium text-gray-800 border-b border-black">{user.email?.split('@')[0]}</Link>
                     <button onClick={logout} className="text-[11px] text-gray-400 hover:text-black uppercase tracking-widest transition-colors" title="Logout">로그아웃</button>
                  </div>
                ) : (
                  <button onClick={login} className="text-gray-800 hover:opacity-70 transition-opacity" title="Login">
                    <UserIcon size={18} strokeWidth={1.2} />
                  </button>
                )}
                <button onClick={() => setIsWishlistOpen(true)} className="text-gray-800 hover:opacity-70 transition-opacity relative">
                  <Heart size={18} strokeWidth={1.2} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#2c2c2c] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setIsCartOpen(true)}
                  className="text-gray-800 hover:opacity-70 transition-opacity relative"
                >
                  <ShoppingBag size={18} strokeWidth={1.2} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#2c2c2c] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                      {cart.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Row: Sub Navigation & Search */}
            <div className="px-4 md:px-12 pb-4 flex items-center justify-between">
              <nav className="flex items-center gap-8 text-[12px] font-medium text-gray-600 overflow-x-auto no-scrollbar whitespace-nowrap hidden md:flex">
                {config.navMainMenu?.find(m => m.id === activeMainMenuId)?.subCategories?.map((menu) => (
                  <Link 
                    key={menu.id} 
                    to={`/shop?category=${encodeURIComponent(menu.label)}`} 
                    className="hover:text-black transition-colors"
                  >
                     {menu.label}
                  </Link>
                ))}
                <Link to="/shop?sale=true" className="text-red-400 hover:text-red-600 transition-colors">세일</Link>
              </nav>

              {/* Search Bar */}
              <div className="flex-grow md:flex-grow-0 md:w-64 border-b border-gray-200 focus-within:border-gray-500 transition-colors pb-1 flex items-center gap-2">
                <Search size={14} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="검색" 
                  className="bg-transparent border-none outline-none w-full text-[12px] placeholder:text-gray-400"
                />
              </div>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<HomePage config={config} user={user} />} />
            <Route path="/shop" element={<ShopPage user={user} config={config} />} />
            <Route path="/shop/:id" element={<ProductDetailPage config={config} user={user} />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/account" element={<AccountPage user={user} />} />
          </Routes>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-100 pt-32 pb-16 px-4 md:px-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-48">
              {/* Left col */}
              <div className="md:col-span-4">
                <h3 className="text-xl font-medium mb-8 tracking-tight">Experience MEI MAREA</h3>
                <div className="flex flex-col gap-3 text-xs text-gray-500 tracking-wider">
                  <a href="#" className="hover:text-black transition-colors">Download Journal</a>
                  <a href="#" className="hover:text-black transition-colors">Product Care</a>
                  <a href="#" className="hover:text-black transition-colors">Digital Catalogue</a>
                </div>
              </div>

              {/* Mid cols */}
              <div className="md:col-span-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-gray-400">Resources</h4>
                <div className="flex flex-col gap-3 text-xs text-gray-600">
                  <Link to="/" className="hover:text-black transition-colors">Home</Link>
                  <Link to="/shop" className="hover:text-black transition-colors">Collection</Link>
                  <a href="#" className="hover:text-black transition-colors">Press</a>
                  <a href="#" className="hover:text-black transition-colors">Releases</a>
                </div>
              </div>

              <div className="md:col-span-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-gray-400">Company</h4>
                <div className="flex flex-col gap-3 text-xs text-gray-600">
                  {config.footer.links.map((link, idx) => (
                    <a key={idx} href={link.href} className="hover:text-black transition-colors">
                      <EditableText 
                        listPath="footer.links"
                        id={idx.toString()}
                        field="label"
                        value={link.label}
                      />
                    </a>
                  ))}
                </div>
              </div>

              {/* Right col */}
              <div className="md:col-span-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6 text-gray-400">Social</h4>
                <div className="flex flex-col gap-3 text-xs text-gray-600">
                  <a href="#" className="hover:text-black transition-colors underline underline-offset-4">Instagram</a>
                </div>
              </div>
            </div>

            {/* Huge Brand Text */}
            <div className="my-8 flex justify-center items-center w-full text-center overflow-hidden px-2 md:px-0">
              <div 
                className="text-[19vw] md:text-[19vw] leading-[0.75] tracking-[-0.05em] font-black uppercase wave-text select-none w-full whitespace-nowrap opacity-95 pb-4 flex justify-center"
                style={{ fontFamily: '"Space Grotesk", "Outfit", sans-serif' }}
              >
                <EditableText path="brand.name" value={config.brand.name} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-gray-100 pt-12">
              <div className="flex items-center gap-2 group">
                <TideLogo />
                <span className="text-[10px] font-bold tracking-widest uppercase">Mei Marea Selection</span>
              </div>
              
              <div className="flex gap-8 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                {user?.email === 'northclee@gmail.com' && (
                  <Link to="/inventory" className="hover:text-black transition-colors text-black border-b border-black">Inventory</Link>
                )}
                <a href="#" className="hover:text-black transition-colors">About Us</a>
                <a href="#" className="hover:text-black transition-colors">Privacy</a>
                <a href="#" className="hover:text-black transition-colors">Terms</a>
                <span><EditableText path="footer.copyright" value={config.footer.copyright} /></span>
              </div>
            </div>
          </footer>
        </div>
        </EditorContext.Provider>
        </WishlistContext.Provider>
      </CartContext.Provider>
    </BrowserRouter>
  );
}
