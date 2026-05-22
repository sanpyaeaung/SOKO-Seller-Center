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
  payment_account_id?: string; // Selected payment account ID
  payment_slip_image?: string; // Base64 representation of proof of payment receipt
  created_at: string;
  owner_uid: string;
}

export interface PaymentAccount {
  id: string;
  provider: string; // KBZPay, WaveMoney, CB Bank, AYA Bank, KBZ Bank, Yoma Bank, etc.
  account_number: string;
  account_name: string;
}

export interface ShopSettings {
  owner_uid: string;
  parent_uid?: string; // Links branch settings to original merchant UID
  name: string;
  phone: string;
  address: string;
  kpay_number: string;
  kpay_name: string;
  slug: string;
  payment_accounts?: PaymentAccount[]; // Unlimited banking/mobile payment accounts
  allowed_payment_modes?: 'both' | 'cod' | 'prepay'; // Both modes, cash on delivery only, or online prepay only
}
