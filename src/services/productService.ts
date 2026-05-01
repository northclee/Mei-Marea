import { collection, query, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../App'; // Assuming db is exported from App or a separate config file
import { Product } from '../types';

// Toggle this to true to use an external API instead of Firestore
const USE_EXTERNAL_API = false;
const EXTERNAL_API_URL = 'https://api.example.com/products';

export const productService = {
  async fetchProducts(): Promise<Product[]> {
    if (USE_EXTERNAL_API) {
      const response = await fetch(EXTERNAL_API_URL);
      if (!response.ok) throw new Error('Failed to fetch from external API');
      return response.json();
    }

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  },

  async fetchProductById(id: string): Promise<Product | null> {
    if (USE_EXTERNAL_API) {
      const response = await fetch(`${EXTERNAL_API_URL}/${id}`);
      if (!response.ok) return null;
      return response.json();
    }

    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  },

  async addProduct(product: Partial<Product>) {
    if (USE_EXTERNAL_API) {
      const response = await fetch(EXTERNAL_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return response.json();
    }

    return addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
    });
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    if (USE_EXTERNAL_API) {
      const response = await fetch(`${EXTERNAL_API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return response.json();
    }

    const docRef = doc(db, 'products', id);
    return updateDoc(docRef, updates);
  }
};
