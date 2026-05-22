export interface Product {
  id: string;
  name: string;
  price: number;
  stock_qty: number;
  image: string;
  category: string;
  owner_uid: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';
  payment_method: string;
  created_at: string;
  owner_uid: string;
}

export interface ShopSettings {
  owner_uid: string;
  name: string;
  phone: string;
  address: string;
  kpay_number: string;
  kpay_name: string;
  slug: string;
}
