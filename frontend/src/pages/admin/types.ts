export interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  description: string;
  features: string[];
  stock: number;
  images: string[];
  image_url: string;
  colors: string[];
  sizes: string[];
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total: string;
  status: string;
  tracking_status: string;
  mpesa_phone: string;
  mpesa_receipt: string;
  items_snapshot: any;
  created_at: string;
  shipping_info?: any;
  delivery_zone?: string;
  delivery_fee?: string | number;
}

export interface Stats {
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  totalUsers: number;
  activeOrders: number;
  recentOrders: Order[];
  topProducts: any[];
  lowStock: any[];
  revenueByDay: { day: string; revenue: string; orders: string }[];
  ordersByStatus: { status: string; count: string }[];
}