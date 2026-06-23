import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';
import type { Stats } from '../../types';
import { T, SC, defaultDateRange } from '../../constants';
import type { DateRange } from '../../constants';
import { StatCard }       from '../shared/StatCard';
import { DateRangePicker } from '../shared/DateRangePicker';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtKsh(n: number) {
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `KSh ${(n / 1_000).toFixed(1)}k`;
  return `KSh ${n.toLocaleString()}`;
}

function shortDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' });
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.black, border: `1px solid ${T.black3}`,
      borderRadius: 9, padding: '10px 14px',
      fontFamily: 'Jost, sans-serif', fontSize: 12,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{
          color: T.white, display: 'flex', justifyContent: 'space-between',
          gap: 16, marginBottom: 3,
        }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
          <span style={{ fontWeight: 700 }}>KSh {Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Revenue + Profit area chart ───────────────────────────────────────────────
function RevenueChart({ data }: { data: Stats['revenueByDay'] }) {
  if (!data.length) {
    return (
      <div style={{
        height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Jost, sans-serif', fontSize: 13, color: T.grey1,
        border: `1px dashed ${T.grey3}`, borderRadius: 8,
      }}>No revenue data for this period</div>
    );
  }

  const chartData = data.map(d => ({
    day:     shortDay(d.day),
    Revenue: parseFloat(d.revenue as any),
    Profit:  parseFloat((d as any).profit ?? '0'),
    Cost:    parseFloat((d as any).cost   ?? '0'),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={T.black} stopOpacity={0.15}/>
            <stop offset="95%" stopColor={T.black} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#166534" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={T.grey3} vertical={false}/>
        <XAxis
          dataKey="day"
          tick={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fill: T.grey1 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
          tick={{ fontFamily: 'Jost, sans-serif', fontSize: 11, fill: T.grey1 }}
          axisLine={false} tickLine={false} width={40}
        />
        <Tooltip content={<ChartTooltip />}/>
        <Legend
          wrapperStyle={{ fontFamily: 'Jost, sans-serif', fontSize: 12, paddingTop: 8 }}
          iconType="circle" iconSize={8}
        />
        <Area
          type="monotone" dataKey="Revenue" name="Revenue"
          stroke={T.black} strokeWidth={2}
          fill="url(#revGrad)"
        />
        <Area
          type="monotone" dataKey="Profit" name="Profit"
          stroke="#166534" strokeWidth={2}
          fill="url(#profGrad)"
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Orders by status ──────────────────────────────────────────────────────────
function OrdersByStatus({ data, onGoToOrders }: {
  data: Stats['ordersByStatus'];
  onGoToOrders: () => void;
}) {
  if (!data.length) {
    return (
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: T.grey1, textAlign: 'center', padding: '20px 0' }}>
        No orders yet
      </p>
    );
  }

  const total = data.reduce((s, r) => s + parseInt(r.count as any), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map(r => {
        const sc    = SC[r.status] || SC.pending;
        const count = parseInt(r.count as any);
        const pct   = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
        return (
          <div
            key={r.status}
            onClick={onGoToOrders}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 9,
              background: sc.bg, border: `1px solid ${sc.border}`,
              cursor: 'pointer', transition: 'opacity 0.15s',
            }}
          >
            <span style={{
              fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 600,
              color: sc.col, textTransform: 'capitalize', flex: 1,
            }}>{r.status}</span>
            {/* Mini bar */}
            <div style={{ width: 60, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: sc.col, borderRadius: 2 }}/>
            </div>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
              fontSize: 15, color: sc.col, minWidth: 24, textAlign: 'right',
            }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Recent orders ─────────────────────────────────────────────────────────────
function RecentOrders({ orders, onGoToOrders }: {
  orders: Stats['recentOrders'];
  onGoToOrders: () => void;
}) {
  if (!orders.length) {
    return (
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: T.grey1, textAlign: 'center', padding: '20px 0' }}>
        No orders yet
      </p>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {orders.map(o => {
        const sc = SC[o.status] || SC.pending;
        return (
          <div
            key={o.id}
            onClick={onGoToOrders}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 9,
              background: T.grey5, border: `1px solid ${T.grey3}`,
              cursor: 'pointer',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: T.black,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 700, fontSize: 14, color: T.white,
            }}>
              {(o.customer_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Jost, sans-serif', fontWeight: 600, fontSize: 13,
                color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {o.customer_name || 'Customer'}
                <span style={{ color: T.grey1, fontWeight: 400 }}> #{o.id}</span>
              </div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 11, color: T.grey1, marginTop: 1 }}>
                {new Date(o.created_at).toLocaleDateString('en-KE')}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 700, fontSize: 14, color: T.black,
              }}>KSh {Number(o.total).toLocaleString()}</span>
              <span style={{
                fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20,
                background: sc.bg, color: sc.col, border: `1px solid ${sc.border}`,
                textTransform: 'capitalize',
              }}>{o.status}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Low stock ─────────────────────────────────────────────────────────────────
function LowStockAlerts({ items, onGoToProducts }: {
  items: Stats['lowStock'];
  onGoToProducts: () => void;
}) {
  if (!items.length) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', borderRadius: 9,
        background: '#F0FDF4', border: '1px solid #BBF7D0',
      }}>
        <span style={{ fontSize: 16 }}>✓</span>
        <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, color: '#166534', fontWeight: 600 }}>
          All products are well stocked
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map(p => {
        const out = p.stock === 0;
        return (
          <div
            key={p.id}
            onClick={onGoToProducts}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              background: out ? '#FEF2F2' : '#FFFBEB',
              border: `1px solid ${out ? '#FECACA' : '#FDE68A'}`,
            }}
          >
            <img
              src={p.image_url || `https://placehold.co/40x40/F0F0F0/0A0A0A?text=📦`}
              alt={p.name}
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/F0F0F0/0A0A0A?text=📦`; }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Jost, sans-serif', fontWeight: 600, fontSize: 13,
                color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{p.name}</div>
              <div style={{
                fontFamily: 'Jost, sans-serif', fontSize: 11, fontWeight: 700, marginTop: 2,
                color: out ? '#991B1B' : '#92400E',
              }}>
                {out ? 'Out of stock' : `Only ${p.stock} left`}
              </div>
            </div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 700, fontSize: 14, color: T.black, flexShrink: 0,
            }}>KSh {Number(p.price).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: T.black }}>
        {title}
      </span>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            fontFamily: 'Jost, sans-serif', fontSize: 12, fontWeight: 600,
            color: T.grey1, background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: 6,
          }}
        >{action} →</button>
      )}
    </div>
  );
}

// ── Main OverviewTab ──────────────────────────────────────────────────────────

interface OverviewTabProps {
  stats:           Stats;
  onGoToOrders:    () => void;
  onGoToProducts:  () => void;
  onGoToCustomers: () => void;
}

export function OverviewTab({ stats, onGoToOrders, onGoToProducts, onGoToCustomers }: OverviewTabProps) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());

  // KPI cards config
  const KPI_ROWS = [
    [
      {
        label:   'Total Revenue',
        value:   fmtKsh(stats.totalRevenue),
        sub:     'Confirmed orders',
        trend:   stats.revenueVsPrev ?? null,
        accent:  true,
      },
      {
        label:   'Total Profit',
        value:   fmtKsh(stats.totalProfit ?? 0),
        sub:     `${stats.profitMargin ?? 0}% margin`,
        trend:   null as null,
        accent:  false,
      },
      {
        label:   'Avg Order Value',
        value:   fmtKsh(stats.avgOrderValue ?? 0),
        sub:     'Per confirmed order',
        trend:   null as null,
        accent:  false,
      },
    ],
    [
      {
        label:   'Active Orders',
        value:   stats.activeOrders,
        sub:     'Awaiting delivery',
        trend:   null as null,
        accent:  false,
        onClick: onGoToOrders,
      },
      {
        label:   'Total Orders',
        value:   stats.totalOrders,
        sub:     'All time',
        trend:   stats.ordersVsPrev ?? null,
        accent:  false,
        onClick: onGoToOrders,
      },
      {
        label:   'Products',
        value:   stats.totalProducts,
        sub:     'In catalogue',
        trend:   null as null,
        accent:  false,
        onClick: onGoToProducts,
      },
      {
        label:   'Customers',
        value:   stats.totalUsers,
        sub:     'Registered',
        trend:   null as null,
        accent:  false,
        onClick: onGoToCustomers,
      },
    ],
  ];

  return (
    <div className="fade-up">
      {/* ── Page header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 700,
            color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6,
          }}>Dashboard</div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1,
          }}>Overview</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <div style={{
            fontFamily: 'Jost, sans-serif', fontSize: 12, color: T.grey1,
            background: T.white, border: `1px solid ${T.grey3}`,
            borderRadius: 8, padding: '9px 14px',
          }}>
            {new Date().toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* ── KPI row 1 — Revenue / Profit / AOV ── */}
      <div className="kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 12,
      }}>
        {KPI_ROWS[0].map(k => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* ── KPI row 2 — Orders / Products / Customers ── */}
      <div className="kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {KPI_ROWS[1].map((k: any) => (
          <StatCard key={k.label} {...k} />
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="overview-charts" style={{
        display: 'grid', gridTemplateColumns: '1.6fr 1fr',
        gap: 16, marginBottom: 16,
      }}>
        {/* Revenue / Profit chart */}
        <div className="panel">
          <SectionHeader
            title="Revenue & Profit"
            action="View Analytics"
          />
          <div style={{
            display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>Period Revenue</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: T.black }}>
                {fmtKsh(stats.revenueByDay.reduce((s, d) => s + parseFloat(d.revenue as any), 0))}
              </div>
            </div>
            {stats.totalProfit !== undefined && (
              <div>
                <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 3 }}>Period Profit</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: '#166534' }}>
                  {fmtKsh(stats.totalProfit)}
                </div>
              </div>
            )}
          </div>
          <RevenueChart data={stats.revenueByDay} />
        </div>

        {/* Orders by status */}
        <div className="panel">
          <SectionHeader title="Orders by Status" action="View all" onAction={onGoToOrders} />
          <OrdersByStatus data={stats.ordersByStatus} onGoToOrders={onGoToOrders} />
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="overview-bottom" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        {/* Recent orders */}
        <div className="panel">
          <SectionHeader title="Recent Orders" action="View all" onAction={onGoToOrders} />
          <RecentOrders orders={stats.recentOrders} onGoToOrders={onGoToOrders} />
        </div>

        {/* Low stock */}
        <div className="panel">
          <SectionHeader title="Low Stock Alerts" action="Manage" onAction={onGoToProducts} />
          <LowStockAlerts items={stats.lowStock} onGoToProducts={onGoToProducts} />
        </div>
      </div>
    </div>
  );
}