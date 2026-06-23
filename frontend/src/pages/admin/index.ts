// ─────────────────────────────────────────────────────────────────────────────
// Luku Prime Admin — barrel exports
// ─────────────────────────────────────────────────────────────────────────────

// Types
export * from './types';

// Constants & utilities
export * from './constants';
export * from './utils';

// Hooks
export { useAdminData } from './hooks/useAdminData';

// Root
export { default } from './AdminDashboard';

// Shared components
export { Toast }           from './components/Toast';
export { ConfirmDialog }   from './components/ConfirmDialog';
export { StatCard }        from './components/shared/StatCard';
export { DateRangePicker } from './components/shared/DateRangePicker';

// Navigation
export { AdminSidebar }   from './components/AdminSidebar';
export { AdminMobileNav } from './components/AdminMobileNav';

// Tabs
export { OverviewTab }   from './components/overview/OverviewTab';
export { AnalyticsTab }  from './components/analytics/AnalyticsTab';
export { ProductsTab }   from './components/products/ProductsTab';
export { OrdersTab }     from './components/orders/OrdersTab';
export { CustomersTab }  from './components/customers/CustomersTab';
export { ReportsTab }    from './components/reports/ReportsTab';

// Products
export { AddProductWizard } from './components/products/AddProductWizard';

// Orders
export { OrderCard }         from './components/orders/OrderCard';
export { OrderFilters }      from './components/orders/OrderFilters';
export { OrderDetailModal }  from './components/orders/OrderDetailModal';
export { OrderStatusModal }  from './components/orders/OrderStatusModal';