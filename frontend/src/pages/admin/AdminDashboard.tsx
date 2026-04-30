import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import type { Product, Order } from './types';
import { T } from './constants';
import { authH } from './utils';
import { useAdminData } from './hooks/useAdminData';

import { Toast }            from './components/Toast';
import { AdminSidebar }     from './components/AdminSidebar';
import { AdminMobileNav }   from './components/AdminMobileNav';
import { ConfirmDialog }    from './components/ConfirmDialog';
import { OverviewTab }      from './components/overview/OverviewTab';
import { ProductsTab }      from './components/products/ProductsTab';
import { AddProductWizard } from './components/products/AddProductWizard';
import { OrdersTab }        from './components/orders/OrdersTab';
import { OrderDetailModal } from './components/orders/OrderDetailModal';
import { OrderStatusModal } from './components/orders/OrderStatusModal';
import { CustomersTab } from './components/customers/CustomersTab';

type Tab = 'overview' | 'products' | 'orders' | 'customers';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    stats, products, orders, loading,
    toast, toastType,
    showToast, fetchAll,
  } = useAdminData();

  const [tab,         setTab]         = useState<Tab>('overview');
  const [showWizard,  setShowWizard]  = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewOrder,   setViewOrder]   = useState<Order | null>(null);
  const [editOrder,   setEditOrder]   = useState<Order | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.role !== 'admin') { navigate('/'); return; }
    fetchAll();
  }, []);

  const handleWizardSaved = () => {
    setShowWizard(false);
    setEditProduct(null);
    showToast(editProduct ? '✓ Product updated!' : '✓ Product published to store!');
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

  return (
    <div style={{ minHeight: '100vh', background: T.cream, fontFamily: "'Jost','DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Jost:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .tbtn{font-family:'Jost',sans-serif;font-size:13px;font-weight:600;padding:11px 14px;border-radius:9px;border:none;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:9px;width:100%;text-align:left;letter-spacing:0.3px}
        .tbtn.on{background:linear-gradient(135deg,${T.gold},${T.gold2});color:${T.navy};box-shadow:0 4px 14px rgba(200,169,81,0.3)}
        .tbtn.off{background:transparent;color:${T.muted}}
        .tbtn.off:hover{background:rgba(200,169,81,0.08);color:${T.navy}}
        .btn{font-family:'Jost',sans-serif;font-size:12px;font-weight:600;border-radius:8px;border:none;cursor:pointer;padding:9px 16px;transition:filter 0.15s,transform 0.1s;display:inline-flex;align-items:center;gap:6px;letter-spacing:0.3px}
        .btn:hover:not(:disabled){filter:brightness(0.93);transform:translateY(-1px)}
        .btn:disabled{opacity:0.6;cursor:not-allowed}
        .row{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid ${T.cream3};border-radius:14px;padding:14px 18px;transition:all 0.2s}
        .row:hover{box-shadow:0 4px 18px rgba(13,27,62,0.08);border-color:${T.gold}}
        .kpi{border-radius:16px;padding:20px 22px;transition:transform 0.2s,box-shadow 0.2s}
        .kpi:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(13,27,62,0.1)}
        .panel{background:#fff;border:1px solid ${T.cream3};border-radius:16px;padding:20px}
        .overlay2{position:fixed;inset:0;background:rgba(13,27,62,0.6);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px)}
        .modal2{background:#fff;border-radius:20px;padding:32px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(13,27,62,0.25)}
        .track-opt{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:9px;cursor:pointer;transition:background 0.15s;font-family:'Jost',sans-serif;font-size:13px;color:${T.navy}}
        .track-opt:hover{background:${T.cream}}
        .track-opt.cur{background:rgba(200,169,81,0.1);color:${T.gold};font-weight:700}
        .sel2{background:${T.cream};border:1.5px solid ${T.cream3};border-radius:9px;padding:11px 14px;font-family:'Jost',sans-serif;font-size:14px;color:${T.navy};width:100%;outline:none;cursor:pointer}
        .order-card-clickable{cursor:pointer;transition:all 0.2s}
        .order-card-clickable:hover{border-color:${T.gold}!important;box-shadow:0 4px 20px rgba(13,27,62,0.1)!important;transform:translateY(-1px)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wizardIn{from{opacity:0;transform:scale(0.94) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.35s ease both}
        .slide-in{animation:slideIn 0.28s ease both}
        .spinner{width:36px;height:36px;border:3px solid ${T.cream3};border-top-color:${T.gold};border-radius:50%;animation:spin 0.8s linear infinite}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:${T.cream3};border-radius:6px}
        .mob-nav{display:none}
        .admin-sidebar{display:flex}
        @media(max-width:768px){
          .admin-sidebar{display:none !important}
          .mob-nav{display:flex !important;position:fixed;bottom:0;left:0;right:0;z-index:200;background:${T.navy};border-top:1px solid rgba(200,169,81,0.2);height:60px;box-shadow:0 -8px 32px rgba(13,27,62,0.3)}
          .mob-nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:none;cursor:pointer;background:transparent;padding:6px 4px;font-family:'Jost',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;transition:all 0.2s}
          .mob-nav-btn.on{color:${T.gold}}
          .mob-nav-btn.off{color:rgba(255,255,255,0.4)}
          .mob-nav-btn .nav-icon{font-size:19px;line-height:1}
          .admin-main{padding:14px 14px 80px !important}
          .admin-main h1{font-size:20px !important}
          .kpi-grid{grid-template-columns:repeat(2,1fr) !important;gap:9px !important;margin-bottom:14px !important}
          .kpi{padding:13px 12px !important}
          .overview-charts{grid-template-columns:1fr !important;gap:12px !important}
          .overview-bottom{grid-template-columns:1fr !important;gap:12px !important}
          .row{flex-wrap:wrap !important;gap:8px !important;padding:12px !important;align-items:flex-start !important}
          .row-actions{width:100%;justify-content:flex-end;margin-top:2px}
          .row-price{min-width:unset !important;text-align:left !important;flex:1}
          .order-card{padding:14px !important}
          .order-card-inner{flex-direction:column !important;align-items:stretch !important;gap:12px !important}
          .order-card-right{flex-direction:row !important;align-items:center !important;justify-content:space-between !important;width:100% !important}
          .order-meta-grid{grid-template-columns:1fr 1fr !important}
          .modal2{padding:20px 16px !important;border-radius:16px !important}
          .dash-date{display:none !important}
          .dash-header{flex-wrap:wrap;gap:10px}
          .products-header{flex-wrap:wrap;gap:10px}
          .products-header h1{flex:1}
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
          onUpdateStatus={() => {
            setEditOrder(viewOrder);
            setViewOrder(null);
          }}
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
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmDanger
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Mobile nav ── */}
      <AdminMobileNav tab={tab} setTab={setTab} />

      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* ── Sidebar ── */}
        <AdminSidebar
          tab={tab}
          setTab={setTab}
          productCount={products.length}
          activeOrders={stats?.activeOrders ?? 0}
          customerCount={stats?.totalUsers ?? 0}
          onRefresh={fetchAll}
        />

        {/* ── Main content ── */}
        <main className="admin-main" style={{ flex: 1, padding: '32px 36px 60px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 18 }}>
              <div className="spinner"/>
              <p style={{ fontFamily: 'Jost,sans-serif', color: T.muted, fontSize: 14 }}>Loading dashboard…</p>
            </div>
          ) : (
            <>
              {tab === 'overview' && stats && (
                <OverviewTab
                  stats={stats}
                  onGoToOrders={() => setTab('orders')}
                  onGoToProducts={() => setTab('products')}
                  onGoToCustomers={() => setTab('customers')}
                />
              )}

              {tab === 'products' && (
                <ProductsTab
                  products={products}
                  onAddNew={() => { setEditProduct(null); setShowWizard(true); }}
                  onEdit={p => setEditProduct(p)}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                  onStockSaved={fetchAll}
                  showToast={showToast}
                />
              )}

              {tab === 'orders' && (
                <OrdersTab
                  orders={orders}
                  stats={stats}
                  onView={o => setViewOrder(o)}
                  onUpdate={o => setEditOrder(o)}
                />
              )}
              {tab === 'customers' && <CustomersTab showToast={showToast} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}