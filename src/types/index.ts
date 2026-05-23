export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  items: number;
  total: number;
  status: 'Completed' | 'Pending' | 'Refunded';
}

export interface Stat {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}