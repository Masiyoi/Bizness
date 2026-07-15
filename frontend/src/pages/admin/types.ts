// ─────────────────────────────────────────────────────────────────────────────
// Luku Prime Admin — TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Core entities ─────────────────────────────────────────────────────────────

export interface Product {
  id:          number;
  name:        string;
  price:       string;
  cost_price:  string | null;    // NEW — null until admin sets it
  category:    string;
  description: string;
  features:    string[];
  stock:       number;
  images:      string[];
  image_url:   string;
  colors:      string[];
  sizes:       string[];
  // Computed client-side from price + cost_price
  margin_pct?: number | null;    // e.g. 42.5 → "42.5%"
  profit_per_unit?: number | null;
}

export interface Order {
  id:              number;
  order_number?:   string;
  customer_name:   string;
  customer_email:  string;
  total:           string;
  status:          string;
  tracking_status: string;
  mpesa_phone:     string;
  mpesa_receipt:   string;
  items_snapshot:  any;
  created_at:      string;
  shipping_info?:  any;
  delivery_zone?:  string;
  delivery_fee?:   string | number;
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface Stats {
  totalOrders:    number;
  totalProducts:  number;
  totalRevenue:   number;
  totalUsers:     number;
  activeOrders:   number;
  recentOrders:   Order[];
  topProducts:    any[];
  lowStock:       LowStockItem[];
  revenueByDay:   RevenueByDay[];
  ordersByStatus: OrderByStatus[];
  // NEW
  avgOrderValue:  number;
  totalCost:      number;         // sum of cost_price × qty across delivered orders
  totalProfit:    number;         // totalRevenue − totalCost
  profitMargin:   number;         // percentage
  revenueVsPrev:  number;         // % change vs previous period
  ordersVsPrev:   number;         // % change vs previous period
}

export interface RevenueByDay {
  day:     string;
  revenue: string;
  orders:  string;
  cost?:   string;   // NEW — for profit chart overlay
  profit?: string;   // NEW
}

export interface OrderByStatus {
  status: string;
  count:  string;
}

export interface LowStockItem {
  id:        number;
  name:      string;
  stock:     number;
  price:     string;
  image_url: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface CategoryStat {
  category:    string;
  revenue:     number;
  orders:      number;
  units_sold:  number;
  avg_price:   number;
  total_cost:  number;
  profit:      number;
  margin_pct:  number;
}

export interface TopCustomer {
  id:           number;
  name:         string;
  email:        string;
  total_spent:  number;
  order_count:  number;
  avg_order:    number;
  last_order:   string;
}

export interface AOVDataPoint {
  day:     string;
  aov:     number;
  orders:  number;
}

export interface AnalyticsData {
  revenueByDay:    RevenueByDay[];
  categoryStats:   CategoryStat[];
  topCustomers:    TopCustomer[];
  aovByDay:        AOVDataPoint[];
  // Period comparison
  currentRevenue:  number;
  previousRevenue: number;
  currentOrders:   number;
  previousOrders:  number;
  currentAOV:      number;
  previousAOV:     number;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface SalesReportRow {
  order_id:      number;
  created_at:    string;
  customer_name: string;
  items_count:   number;
  total:         number;
  cost:          number;
  profit:        number;
  margin_pct:    number;
  status:        string;
  delivery_zone: string;
  mpesa_receipt: string;
}

export interface SalesReport {
  from:          string;
  to:            string;
  rows:          SalesReportRow[];
  summary: {
    total_orders:  number;
    total_revenue: number;
    total_cost:    number;
    total_profit:  number;
    avg_margin:    number;
    avg_order:     number;
  };
}

export interface InventoryReportRow {
  id:             number;
  name:           string;
  category:       string;
  stock:          number;
  price:          number;
  cost_price:     number | null;
  stock_value:    number;         // stock × price  (retail)
  cost_value:     number;         // stock × cost_price
  potential_profit: number;       // stock × (price − cost_price)
  margin_pct:     number | null;
}

export interface InventoryReport {
  generated_at:       string;
  rows:               InventoryReportRow[];
  total_retail_value: number;
  total_cost_value:   number;
  total_potential_profit: number;
  avg_margin:         number;
  out_of_stock_count: number;
  low_stock_count:    number;    // stock > 0 && stock <= 5
}

export interface ProfitReportRow {
  product_id:   number;
  product_name: string;
  category:     string;
  units_sold:   number;
  revenue:      number;
  cost:         number;
  profit:       number;
  margin_pct:   number;
}

export interface ProfitReport {
  from:          string;
  to:            string;
  rows:          ProfitReportRow[];
  summary: {
    total_revenue: number;
    total_cost:    number;
    total_profit:  number;
    avg_margin:    number;
  };
}

// ── Hook / shared shapes ──────────────────────────────────────────────────────

export interface AdminDataState {
  stats:    Stats | null;
  products: Product[];
  orders:   Order[];
  loading:  boolean;
  toast:    string;
  toastType: 'ok' | 'err';
}