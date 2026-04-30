import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../constants';

type Tab = 'overview' | 'products' | 'orders' | 'customers';

interface AdminSidebarProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  productCount: number;
  activeOrders: number;
  customerCount: number;
  onRefresh: () => void;
}

export function AdminSidebar({
  tab, setTab, productCount, activeOrders, customerCount, onRefresh,
}: AdminSidebarProps) {
  const navigate = useNavigate();

  const NAV_ITEMS: { id: Tab; icon: string; label: string; badge: number | null }[] = [
    { id: 'overview', icon: '📊', label: 'Overview',  badge: null            },
    { id: 'products', icon: '📦', label: 'Products',  badge: productCount || null },
    { id: 'orders',   icon: '🧾', label: 'Orders',    badge: activeOrders || null },
    { id: 'customers', icon: '👥', label: 'Customers', badge: customerCount || null },
  ];

  return (
    <aside
      className="admin-sidebar"
      style={{
        width:        232,
        background:   T.navy,
        padding:      '24px 14px',
        flexDirection: 'column',
        gap:          4,
        position:     'sticky',
        top:          0,
        height:       '100vh',
        flexShrink:   0,
        borderRight:  '1px solid rgba(200,169,81,0.15)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30, paddingLeft: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg,${T.gold},${T.gold2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 14,
          color: T.navy, flexShrink: 0,
        }}>L</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>Luku Prime</div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: 'rgba(200,169,81,0.55)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 1 }}>Control Panel</div>
        </div>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(200,169,81,0.3),transparent)', margin: '0 4px 16px' }}/>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV_ITEMS.map(t => (
          <button
            key={t.id}
            className={`tbtn ${tab === t.id ? 'on' : 'off'}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span>
            <span style={{ flex: 1 }}>{t.label}</span>
            {t.badge !== null && (
              <span style={{
                background:   tab === t.id ? 'rgba(13,27,62,0.2)' : T.gold,
                color:        tab === t.id ? T.navy : '#fff',
                borderRadius: 20,
                padding:      '1px 8px',
                fontSize:     10,
                fontWeight:   800,
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer buttons */}
      <div style={{ borderTop: '1px solid rgba(200,169,81,0.15)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          className="btn"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', justifyContent: 'center', padding: '10px' }}
          onClick={onRefresh}
        >🔄 Refresh</button>
        <button
          className="btn"
          style={{ background: 'rgba(200,169,81,0.1)', color: T.gold2, border: '1px solid rgba(200,169,81,0.2)', width: '100%', justifyContent: 'center', padding: '10px' }}
          onClick={() => navigate('/')}
        >← Back to Store</button>
      </div>
    </aside>
  );
}