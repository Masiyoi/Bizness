import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { T, NAV_ITEMS } from '../constants';
import type { Tab } from '../constants';

interface AdminMobileNavProps {
  tab:           Tab;
  setTab:        (t: Tab) => void;
  productCount:  number;
  activeOrders:  number;
  customerCount: number;
  onRefresh:     () => void;
}

const BADGES: Partial<Record<Tab, (p: AdminMobileNavProps) => number | null>> = {
  products:  (p) => p.productCount  || null,
  orders:    (p) => p.activeOrders  || null,
  customers: (p) => p.customerCount || null,
};

export function AdminMobileNav(props: AdminMobileNavProps) {
  const { tab, setTab, onRefresh } = props;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Close drawer on tab change
  useEffect(() => { setOpen(false); }, [tab]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const currentItem = NAV_ITEMS.find(i => i.id === tab);

  return (
    <>
      {/* ── Top bar (mobile only) ── */}
      <header
  className="mob-topbar"
  style={{
    position:       'fixed',
    top:            0,
    left:           0,
    right:          0,
    zIndex:         200,
    height:         56,
    background:     T.black,
    borderBottom:   `1px solid ${T.black3}`,
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '0 16px',
  }}
>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* Logo backdrop — white circle so the dark logo shows up on dark backgrounds */}
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 3 }}>
            <img src="/plugwalk.jpg" alt="Plug Walk" style={{
            width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
            display: 'block', mixBlendMode: 'multiply',
          }} />
          </div>
          <span style={{
            fontFamily:    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontWeight:    400,
            fontSize:      15,
            color:         T.white,
            letterSpacing: '0.5px',
          }}>𝓟𝓵𝓾𝓰 𝓦𝓪𝓵𝓴</span>
        </div>

        {/* Current tab label */}
        <span style={{
          fontFamily: 'Jost, sans-serif',
          fontSize:   12,
          fontWeight: 600,
          color:      T.grey2,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
        }}>{currentItem?.label}</span>

        {/* Hamburger button */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Open navigation"
          style={{
            width:       40,
            height:      40,
            borderRadius: 8,
            border:      `1px solid ${T.black3}`,
            background:  'transparent',
            cursor:      'pointer',
            display:     'flex',
            flexDirection: 'column',
            alignItems:  'center',
            justifyContent: 'center',
            gap:         5,
            padding:     0,
          }}
        >
          {/* Hamburger lines — animate to X when open */}
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display:      'block',
              width:        18,
              height:       1.5,
              background:   T.white,
              borderRadius: 2,
              transition:   'all 0.2s',
              transform: open
                ? i === 0 ? 'translateY(6.5px) rotate(45deg)'
                : i === 2 ? 'translateY(-6.5px) rotate(-45deg)'
                : 'scaleX(0)'
                : 'none',
              opacity: open && i === 1 ? 0 : 1,
            }}/>
          ))}
        </button>
      </header>

      {/* ── Backdrop ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position:   'fixed',
            inset:      0,
            zIndex:     300,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Drawer ── */}
      <div
        style={{
          position:   'fixed',
          top:        0,
          right:      0,
          bottom:     0,
          width:      280,
          zIndex:     400,
          background: T.black,
          borderLeft: `1px solid ${T.black3}`,
          display:    'flex',
          flexDirection: 'column',
          transform:  open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
          overflowY:  'auto',
        }}
      >
        {/* Drawer header */}
        <div style={{
          padding:      '20px 20px 16px',
          borderBottom: `1px solid ${T.black3}`,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 700, fontSize: 17, color: T.white,
            }}>Navigation</div>
            <div style={{
              fontFamily: 'Jost, sans-serif', fontSize: 10,
              color: T.grey1, letterSpacing: '2px',
              textTransform: 'uppercase', marginTop: 2,
            }}>Admin Panel</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 32, height: 32, borderRadius: 6,
              border: `1px solid ${T.black3}`,
              background: 'transparent', cursor: 'pointer',
              color: T.grey1, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          <div style={{
            fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 700,
            color: T.grey1, letterSpacing: '2px',
            textTransform: 'uppercase', padding: '8px 8px 12px',
          }}>Sections</div>

          {NAV_ITEMS.map(item => {
            const isActive = tab === item.id;
            const badgeFn  = BADGES[item.id];
            const badge    = badgeFn ? badgeFn(props) : null;

            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  gap:           12,
                  width:         '100%',
                  padding:       '13px 14px',
                  borderRadius:  8,
                  border:        'none',
                  cursor:        'pointer',
                  background:    isActive ? T.white : 'transparent',
                  color:         isActive ? T.black : T.grey1,
                  fontFamily:    'Jost, sans-serif',
                  fontSize:      14,
                  fontWeight:    isActive ? 700 : 500,
                  textAlign:     'left',
                  marginBottom:  3,
                  transition:    'all 0.15s',
                }}
              >
                <img src={item.icon} alt={item.label} style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge !== null && (
                  <span style={{
                    background:   isActive ? T.black : T.white,
                    color:        isActive ? T.white : T.black,
                    borderRadius: 20,
                    padding:      '2px 8px',
                    fontSize:     10,
                    fontWeight:   700,
                  }}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div style={{
          padding:    '14px 12px',
          borderTop:  `1px solid ${T.black3}`,
          display:    'flex',
          flexDirection: 'column',
          gap:        8,
        }}>
          <button
            onClick={() => { onRefresh(); setOpen(false); }}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 8,
              border: `1px solid ${T.black3}`,
              background: 'transparent', color: T.grey1,
              fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >↺ Refresh data</button>
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 8,
              border: `1px solid ${T.black3}`,
              background: 'transparent', color: T.grey1,
              fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >← Back to Store</button>
        </div>
      </div>
    </>
  );
}