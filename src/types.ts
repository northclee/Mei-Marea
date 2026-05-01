export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  category: string;
  brand?: string;
  details?: string[];
  stock: number;
  createdAt?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
