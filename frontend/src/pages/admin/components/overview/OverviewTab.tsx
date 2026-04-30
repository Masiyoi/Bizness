import type { Stats } from '../../types';
import { T, SC } from '../../constants';

// ── Revenue sparkline chart ──────────────────────────────────────────────────
function RevenueChart({ data }: { data: { day: string; revenue: string }[] }) {
  if (!data.length) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted }}>
      No revenue data yet
    </div>
  );
  const max = Math.max(...data.map(d => parseFloat(d.revenue)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h   = Math.max((parseFloat(d.revenue) / max) * 100, 3);
        const day = new Date(d.day).toLocaleDateString('en-KE', { weekday: 'short' });
        const rev = parseFloat(d.revenue);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, minHeight: 14 }}>
              {rev > 0 ? `${(rev / 1000).toFixed(1)}k` : ''}
            </div>
            <div
              title={`KSh ${rev.toLocaleString()}`}
              style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                background: `linear-gradient(180deg,${T.gold2} 0%,${T.gold} 100%)`,
                height: `${h}%`, minHeight: 4,
                transition: 'height 0.6s cubic-bezier(.34,1.56,.64,1)',
                cursor: 'default',
              }}
            />
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.muted }}>{day}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  col: string;
  bg: string;
  border: string;
  sub: string;
  onClick?: () => void;   // ← optional click handler
}

function KpiCard({ label, value, icon, col, bg, border, sub, onClick }: KpiCardProps) {
  return (
    <div
      className="kpi"
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Small arrow hint for clickable cards */}
          {onClick && (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: col, opacity: 0.6 }}>→</span>
          )}
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, marginTop: 4 }}/>
        </div>
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: col, marginBottom: 4 }}>{value}</div>
      <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 12, color: T.navy }}>{label}</div>
      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────
interface OverviewTabProps {
  stats: Stats;
  onGoToOrders: () => void;
  onGoToProducts: () => void;
  onGoToCustomers: () => void;   // ← new prop
}

export function OverviewTab({ stats, onGoToOrders, onGoToProducts, onGoToCustomers }: OverviewTabProps) {
  const KPI_ITEMS: KpiCardProps[] = [
    {
      label: 'Total Revenue', value: `KSh ${stats.totalRevenue.toLocaleString()}`,
      icon: '💰', col: T.gold, bg: 'rgba(200,169,81,0.08)', border: 'rgba(200,169,81,0.25)', sub: 'Confirmed orders',
      // Revenue has no dedicated tab so no onClick
    },
    {
      label: 'Active Orders', value: stats.activeOrders,
      icon: '⏳', col: '#B7791F', bg: '#FDF8EC', border: '#F6E4A0', sub: 'Awaiting delivery',
      onClick: onGoToOrders,
    },
    {
      label: 'Total Orders', value: stats.totalOrders,
      icon: '🧾', col: '#4A8A4A', bg: '#EEF5EE', border: '#C8DFC8', sub: 'All time',
      onClick: onGoToOrders,
    },
    {
      label: 'Products', value: stats.totalProducts,
      icon: '📦', col: T.navy3, bg: 'rgba(30,47,90,0.07)', border: 'rgba(30,47,90,0.15)', sub: 'In catalogue',
      onClick: onGoToProducts,
    },
    {
      label: 'Customers', value: stats.totalUsers,
      icon: '👥', col: '#2B7AB5', bg: '#EDF5FB', border: '#BAD9EF', sub: 'Registered',
      onClick: onGoToCustomers,
    },
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Dashboard</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: T.navy }}>Overview</h1>
        </div>
        <div className="dash-date" style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted, background: '#fff', border: `1px solid ${T.cream3}`, borderRadius: 9, padding: '8px 14px' }}>
          📅 {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(178px,1fr))', gap: 14, marginBottom: 24 }}>
        {KPI_ITEMS.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Charts row */}
      <div className="overview-charts" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, marginBottom: 18 }}>
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.navy }}>📈 Revenue — Last 7 Days</div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted }}>
              KSh {stats.revenueByDay.reduce((s, d) => s + parseFloat(d.revenue), 0).toLocaleString()}
            </div>
          </div>
          <RevenueChart data={stats.revenueByDay} />
        </div>
        <div className="panel">
          <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 14 }}>📊 Orders by Status</div>
          {stats.ordersByStatus.length === 0
            ? <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>No orders yet</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {stats.ordersByStatus.map(r => {
                  const sc = SC[r.status] || SC.pending;
                  return (
                    <div
                      key={r.status}
                      onClick={onGoToOrders}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 9, cursor: 'pointer' }}
                    >
                      <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600, color: sc.col, textTransform: 'capitalize' }}>{r.status}</span>
                      <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: sc.col }}>{r.count}</span>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* Bottom row */}
      <div className="overview-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Recent orders */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.navy }}>🧾 Recent Orders</div>
            <button className="btn" style={{ background: T.cream, color: T.gold, border: `1px solid ${T.cream3}`, fontSize: 11, padding: '5px 12px' }} onClick={onGoToOrders}>View All →</button>
          </div>
          {stats.recentOrders.length === 0
            ? <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0' }}>No orders yet</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {stats.recentOrders.map(o => {
                  const sc = SC[o.status] || SC.pending;
                  return (
                    <div
                      key={o.id}
                      onClick={onGoToOrders}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: T.cream, borderRadius: 10, border: `1px solid ${T.cream3}`, cursor: 'pointer' }}
                    >
                      <div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 12, color: T.navy }}>
                          {o.customer_name || 'Customer'} <span style={{ color: T.muted, fontWeight: 400 }}>#{o.id}</span>
                        </div>
                        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, marginTop: 1 }}>
                          {new Date(o.created_at).toLocaleDateString('en-KE')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 13, color: T.gold }}>KSh {Number(o.total).toLocaleString()}</span>
                        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.col, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>{o.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>

        {/* Low stock */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.navy }}>⚠️ Low Stock Alerts</div>
            <button className="btn" style={{ background: T.cream, color: T.gold, border: `1px solid ${T.cream3}`, fontSize: 11, padding: '5px 12px' }} onClick={onGoToProducts}>Manage →</button>
          </div>
          {stats.lowStock.length === 0
            ? <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: '#4A8A4A', textAlign: 'center', padding: '16px 0' }}>✓ All products well stocked</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {stats.lowStock.map(p => (
                  <div
                    key={p.id}
                    onClick={onGoToProducts}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: p.stock === 0 ? '#FDF0EE' : '#FDF8EC', borderRadius: 10, border: `1px solid ${p.stock === 0 ? '#F5C6C0' : '#F6E4A0'}`, cursor: 'pointer' }}
                  >
                    <img
                      src={p.image_url || 'https://placehold.co/40x40/F0EAD8/0D1B3E?text=📦'}
                      style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/F0EAD8/0D1B3E?text=📦'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 12, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: p.stock === 0 ? '#C0392B' : '#B7791F', marginTop: 1 }}>
                        {p.stock === 0 ? '❌ Out of stock' : `⚠️ Only ${p.stock} left`}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 13, color: T.gold, flexShrink: 0 }}>KSh {Number(p.price).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}