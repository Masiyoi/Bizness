import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T, NAV_ITEMS } from '../constants';
import type { Tab } from '../constants';

interface AdminSidebarProps {
  tab:           Tab;
  setTab:        (t: Tab) => void;
  productCount:  number;
  activeOrders:  number;
  customerCount: number;
  onRefresh:     () => void;
}

const BADGES: Partial<Record<Tab, (p: AdminSidebarProps) => number | null>> = {
  products:  (p) => p.productCount  || null,
  orders:    (p) => p.activeOrders  || null,
  customers: (p) => p.customerCount || null,
};

export function AdminSidebar({
  tab, setTab, productCount, activeOrders, customerCount, onRefresh,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const props    = { tab, setTab, productCount, activeOrders, customerCount, onRefresh };

  return (
    <aside
      className="admin-sidebar"
      style={{
        width:        220,
        background:   T.black,
        display:      'flex',
        flexDirection: 'column',
        position:     'sticky',
        top:          0,
        height:       '100vh',
        flexShrink:   0,
        borderRight:  `1px solid ${T.black3}`,
        overflow:     'hidden',
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        padding:      '28px 20px 20px',
        borderBottom: `1px solid ${T.black3}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: T.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 700, fontSize: 16, color: T.black, flexShrink: 0,
          }}>L</div>
          <div>
            <div style={{
              fontFamily:    "'Cormorant Garamond', serif",
              fontWeight:    700,
              fontSize:      15,
              color:         T.white,
              letterSpacing: '0.5px',
            }}>Luku Prime</div>
            <div style={{
              fontFamily:    'Jost, sans-serif',
              fontSize:      9,
              color:         T.grey1,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginTop:     2,
            }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const isActive = tab === item.id;
          const badgeFn  = BADGES[item.id];
          const badge    = badgeFn ? badgeFn(props) : null;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                width:          '100%',
                padding:        '10px 12px',
                borderRadius:   8,
                border:         'none',
                cursor:         'pointer',
                background:     isActive ? T.white : 'transparent',
                color:          isActive ? T.black : T.grey1,
                fontFamily:     'Jost, sans-serif',
                fontSize:       13,
                fontWeight:     isActive ? 700 : 500,
                letterSpacing:  '0.2px',
                textAlign:      'left',
                transition:     'all 0.15s',
                position:       'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = T.black2;
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {/* Active left bar */}
              {isActive && (
                <div style={{
                  position:     'absolute',
                  left:         0,
                  top:          '20%',
                  height:       '60%',
                  width:        3,
                  borderRadius: '0 2px 2px 0',
                  background:   T.white,
                }}/>
              )}
              <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge !== null && (
                <span style={{
                  background:   isActive ? T.black : T.white,
                  color:        isActive ? T.white : T.black,
                  borderRadius: 20,
                  padding:      '1px 7px',
                  fontSize:     10,
                  fontWeight:   700,
                  fontFamily:   'Jost, sans-serif',
                  flexShrink:   0,
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding:    '14px 10px',
        borderTop:  `1px solid ${T.black3}`,
        display:    'flex',
        flexDirection: 'column',
        gap:        6,
      }}>
        <button
          onClick={onRefresh}
          style={{
            width:       '100%',
            padding:     '9px 12px',
            borderRadius: 8,
            border:      `1px solid ${T.black3}`,
            background:  'transparent',
            color:       T.grey1,
            fontFamily:  'Jost, sans-serif',
            fontSize:    12,
            fontWeight:  600,
            cursor:      'pointer',
            display:     'flex',
            alignItems:  'center',
            gap:         8,
            letterSpacing: '0.3px',
          }}
        >↺ Refresh data</button>

        <button
          onClick={() => navigate('/')}
          style={{
            width:       '100%',
            padding:     '9px 12px',
            borderRadius: 8,
            border:      `1px solid ${T.black3}`,
            background:  'transparent',
            color:       T.grey1,
            fontFamily:  'Jost, sans-serif',
            fontSize:    12,
            fontWeight:  600,
            cursor:      'pointer',
            display:     'flex',
            alignItems:  'center',
            gap:         8,
            letterSpacing: '0.3px',
          }}
        >← Back to Store</button>
      </div>
    </aside>
  );
}