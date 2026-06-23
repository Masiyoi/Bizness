import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import type { Product, Order } from './types';
import type { Tab } from './constants';
import { T } from './constants';
import { authH } from './utils';
import { useAdminData } from './hooks/useAdminData';

import { Toast }            from './components/Toast';
import { AdminSidebar }     from './components/AdminSidebar';
import { AdminMobileNav }   from './components/AdminMobileNav';
import { ConfirmDialog }    from './components/ConfirmDialog';
import { OverviewTab }      from './components/overview/OverviewTab';
import { AnalyticsTab }     from './components/analytics/AnalyticsTab';
import { ProductsTab }      from './components/products/ProductsTab';
import { AddProductWizard } from './components/products/AddProductWizard';
import { OrdersTab }        from './components/orders/OrdersTab';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { OrderStatusModal } from './components/orders/OrderStatusModal';
import { CustomersTab }     from './components/customers/CustomersTab';
import { ReportsTab }       from './components/reports/ReportsTab';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    stats, products, orders, loading,
    toast, toastType,
    showToast, fetchAll,
  } = useAdminData();

  const [tab,          setTab]          = useState<Tab>('overview');
  const [showWizard,   setShowWizard]   = useState(false);
  const [editProduct,  setEditProduct]  = useState<Product | null>(null);
  const [viewOrder,    setViewOrder]    = useState<Order | null>(null);
  const [editOrder,    setEditOrder]    = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.role !== 'admin') { navigate('/'); return; }
    fetchAll();
  }, []);

  const handleWizardSaved = () => {
    setShowWizard(false);
    setEditProduct(null);
    showToast(editProduct ? '✓ Product updated' : '✓ Product published');
    fetchAll();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/admin/products/${deleteTarget.id}`, authH());
      showToast('Product deleted');
      fetchAll();
    } catch {
      showToast('Delete failed', 'err');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Shared nav badge props
  const navBadgeProps = {
    productCount:  products.length,
    activeOrders:  stats?.activeOrders ?? 0,
    customerCount: stats?.totalUsers   ?? 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: T.grey5, fontFamily: "'Jost','DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Buttons ── */
        .btn {
          font-family: 'Jost', sans-serif;
          font-size: 12px;
          font-weight: 600;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          padding: 8px 14px;
          transition: filter 0.15s, transform 0.1s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.3px;
        }
        .btn:hover:not(:disabled) { filter: brightness(0.9); transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-primary {
          background: ${T.black};
          color: ${T.white};
        }
        .btn-secondary {
          background: ${T.white};
          color: ${T.black};
          border: 1px solid ${T.grey3} !important;
        }
        .btn-danger {
          background: #DC2626;
          color: ${T.white};
        }

        /* ── Cards / panels ── */
        .panel {
          background: ${T.white};
          border: 1px solid ${T.grey3};
          border-radius: 12px;
          padding: 20px;
        }

        /* ── Product / order rows ── */
        .row {
          display: flex;
          align-items: center;
          gap: 14px;
          background: ${T.white};
          border: 1px solid ${T.grey3};
          border-radius: 12px;
          padding: 14px 18px;
          transition: all 0.15s;
        }
        .row:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.08); border-color: ${T.grey2}; }

        .order-card-clickable { cursor: pointer; transition: all 0.15s; }
        .order-card-clickable:hover {
          border-color: ${T.black} !important;
          box-shadow: 0 2px 16px rgba(0,0,0,0.1) !important;
          transform: translateY(-1px);
        }

        /* ── KPI cards ── */
        .kpi {
          border-radius: 12px;
          padding: 18px 20px;
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: default;
        }
        .kpi:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .kpi.clickable { cursor: pointer; }

        /* ── Modals ── */
        .overlay2 {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 300;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          backdrop-filter: blur(3px);
        }
        .modal2 {
          background: ${T.white};
          border-radius: 16px;
          padding: 28px;
          width: 100%;
          max-width: 460px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
        }

        /* ── Form elements ── */
        .sel2 {
          background: ${T.white};
          border: 1.5px solid ${T.grey3};
          border-radius: 8px;
          padding: 10px 14px;
          font-family: 'Jost', sans-serif;
          font-size: 14px;
          color: ${T.black};
          width: 100%;
          outline: none;
          cursor: pointer;
        }
        .sel2:focus { border-color: ${T.black}; }

        .track-opt {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.12s;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          color: ${T.black};
        }
        .track-opt:hover { background: ${T.grey4}; }
        .track-opt.cur { background: ${T.black}; color: ${T.white}; font-weight: 700; }

        /* ── Animations ── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes wizardIn { from { opacity: 0; transform: scale(0.96) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .fade-up  { animation: fadeUp 0.3s ease both; }
        .slide-in { animation: slideIn 0.25s ease both; }

        /* ── Spinner ── */
        .spinner {
          width: 32px; height: 32px;
          border: 2.5px solid ${T.grey3};
          border-top-color: ${T.black};
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.grey3}; border-radius: 4px; }

        /* ── Mobile top bar (hidden on desktop) ── */
        .mob-topbar { display: none; }
        .admin-sidebar { display: flex; }

        /* ── Status badge colours (global, used in order rows etc.) ── */
        .status-pending    { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }
        .status-confirmed  { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
        .status-processing { background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }
        .status-shipped    { background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }
        .status-delivered  { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
        .status-cancelled  { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }

        /* ── Print styles (used by ReportsTab) ── */
        @media print {
          .no-print { display: none !important; }
          .admin-sidebar { display: none !important; }
          .mob-topbar { display: none !important; }
          body { background: white !important; }
          .print-full { width: 100% !important; max-width: none !important; }
        }

        /* ── Mobile breakpoint ── */
        @media (max-width: 768px) {
          .admin-sidebar  { display: none !important; }
          .mob-topbar     { display: flex !important; }
          .admin-main     { padding: 74px 14px 24px !important; }
          .kpi-grid       { grid-template-columns: repeat(2,1fr) !important; gap: 8px !important; }
          .overview-charts  { grid-template-columns: 1fr !important; }
          .overview-bottom  { grid-template-columns: 1fr !important; }
          .modal2           { padding: 20px 16px !important; border-radius: 12px !important; }
          .row              { flex-wrap: wrap !important; gap: 8px !important; }
          .row-actions      { width: 100%; justify-content: flex-end; margin-top: 2px; }
        }
      `}</style>

      {/* ── Global overlays ── */}
      <Toast message={toast} type={toastType} />

      {(showWizard || editProduct) && (
        <AddProductWizard
          onClose={() => { setShowWizard(false); setEditProduct(null); }}
          onSaved={handleWizardSaved}
          editProduct={editProduct}
        />
      )}

      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onUpdateStatus={() => { setEditOrder(viewOrder); setViewOrder(null); }}
        />
      )}

      {editOrder && (
        <OrderStatusModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSaved={() => { setEditOrder(null); fetchAll(); }}
          showToast={showToast}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Product"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmDanger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Mobile top bar + drawer ── */}
      <AdminMobileNav
        tab={tab}
        setTab={setTab}
        onRefresh={fetchAll}
        {...navBadgeProps}
      />

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* ── Desktop sidebar ── */}
        <AdminSidebar
          tab={tab}
          setTab={setTab}
          onRefresh={fetchAll}
          {...navBadgeProps}
        />

        {/* ── Main content ── */}
        <main
          className="admin-main"
          style={{ flex: 1, padding: '32px 36px 60px', overflowY: 'auto', minWidth: 0 }}
        >
          {loading ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '60vh', gap: 16,
            }}>
              <div className="spinner"/>
              <p style={{ fontFamily: 'Jost,sans-serif', color: T.grey1, fontSize: 13 }}>
                Loading dashboard…
              </p>
            </div>
          ) : (
            <>
              {tab === 'overview' && stats && (
                <OverviewTab
                  stats={stats}
                  onGoToOrders={()    => setTab('orders')}
                  onGoToProducts={()  => setTab('products')}
                  onGoToCustomers={() => setTab('customers')}
                />
              )}

              {tab === 'analytics' && (
                <AnalyticsTab showToast={showToast} />
              )}

              {tab === 'products' && (
                <ProductsTab
                  products={products}
                  onAddNew={() => { setEditProduct(null); setShowWizard(true); }}
                  onEdit={p  => setEditProduct(p)}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                  onStockSaved={fetchAll}
                  showToast={showToast}
                />
              )}

              {tab === 'orders' && (
                <OrdersTab
                  orders={orders}
                  stats={stats}
                  onView={o   => setViewOrder(o)}
                  onUpdate={o => setEditOrder(o)}
                />
              )}

              {tab === 'customers' && (
                <CustomersTab showToast={showToast} />
              )}

              {tab === 'reports' && (
                <ReportsTab showToast={showToast} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}