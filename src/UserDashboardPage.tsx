import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from './App';
import { Package, Clock, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserDashboardPage({ user }: { user: User | null }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadOrders = async () => {
      try {
        const q = query(collection(db, `users/${user.uid}/orders`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedOrders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setOrders(fetchedOrders);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching orders:", err);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error("Error setting up orders listener", err);
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen pt-40 px-4 flex flex-col items-center">
        <h1 className="text-2xl font-light mb-4">로그인이 필요합니다</h1>
        <p className="text-gray-500 mb-8">주문 내역을 확인하려면 로그인해주세요.</p>
        <Link to="/" className="text-sm border-b border-black pb-1">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-24 px-4 md:px-12 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-light tracking-tight mb-2">My Account</h1>
        <p className="text-gray-500 text-sm">환영합니다, {user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <nav className="flex flex-col gap-4 text-sm">
            <Link to="/account" className="font-medium text-black">주문 내역</Link>
            <button className="text-left text-gray-500 hover:text-black transition-colors">위시리스트</button>
            <button className="text-left text-gray-500 hover:text-black transition-colors">개인정보 수정</button>
          </nav>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-xl font-medium mb-8 flex items-center gap-2">
            <Package size={20} className="text-gray-400" />
            최근 주문 내역
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="border border-gray-100 p-12 text-center flex flex-col items-center">
              <Clock size={40} strokeWidth={1} className="text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm mb-6">주문 내역이 없습니다.</p>
              <Link to="/shop" className="bg-black text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">
                쇼핑 계속하기
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {orders.map(order => (
                <div key={order.id} className="border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Order #{order.id.substring(0, 8)}</span>
                    <span className="text-sm">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex flex-col gap-4 flex-grow md:px-8">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-gray-50 overflow-hidden flex-shrink-0">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-xs text-gray-500">수량: {item.quantity || 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-4 md:border-l md:border-gray-100 md:pl-6 min-w-[120px]">
                    <div className="flex flex-col md:items-end gap-1">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
                      <span className="font-medium font-mono text-sm">₩{order.totalAmount?.toLocaleString()}</span>
                    </div>
                    
                    <span className={`text-xs px-3 py-1 rounded-full text-center ${
                      order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                      order.status === 'shipped' ? 'bg-blue-50 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status === 'pending' ? '결제 대기' :
                       order.status === 'processing' ? '상품 준비중' :
                       order.status === 'shipped' ? '배송중' :
                       order.status === 'delivered' ? '배송 완료' :
                       order.status === 'cancelled' ? '주문 취소' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
