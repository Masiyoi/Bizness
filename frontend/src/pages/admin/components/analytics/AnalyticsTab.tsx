import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell,
} from 'recharts';
import type { AnalyticsData, CategoryStat, TopCustomer } from '../../types';
import { T, defaultDateRange } from '../../constants';
import type { DateRange } from '../../constants';
import { authH } from '../../utils';
import { DateRangePicker } from '../shared/DateRangePicker';
import { StatCard }        from '../shared/StatCard';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtK  = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.round(n));
const fmtKsh = (n: number) => `KSh ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

function pctLabel(cur: number, prev: number) {
  if (!prev) return cur > 0 ? 100 : 0;
  return parseFloat((((cur - prev) / prev) * 100).toFixed(1));
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, prefix = 'KSh ' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.black, border: `1px solid ${T.black3}`,
      borderRadius: 9, padding: '10px 14px',
      fontFamily: 'Jost, sans-serif', fontSize: 12, minWidth: 140,
    }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 7, fontSize: 11 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{
          display: 'flex', justifyContent: 'space-between',
          gap: 16, marginBottom: 4,
        }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}</span>
          <span style={{ color: T.white, fontWeight: 700 }}>
            {prefix}{Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, sub, children }: {
  title: string; sub?: string; children: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, color: T.black }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: T.grey1, marginTop: 3 }}>
            {sub}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Revenue vs previous period area chart ────────────────────────────────────
function RevenueTrendChart({ data }: { data: AnalyticsData['revenueByDay'] }) {
  if (!data.length) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1 }}>
      No data for this period
    </div>
  );
  const chartData = data.map(d => ({
    day:     new Date(d.day).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
    Revenue: parseFloat(d.revenue as any),
    Profit:  parseFloat((d as any).profit ?? 0),
    Cost:    parseFloat((d as any).cost   ?? 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={T.black} stopOpacity={0.12}/>
            <stop offset="95%" stopColor={T.black} stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="aProfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#166534" stopOpacity={0.12}/>
            <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={T.grey3} vertical={false}/>
        <XAxis dataKey="day" tick={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fill: T.grey1 }} axisLine={false} tickLine={false}/>
        <YAxis tickFormatter={v => fmtK(v)} tick={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fill: T.grey1 }} axisLine={false} tickLine={false} width={44}/>
        <Tooltip content={<DarkTooltip />}/>
        <Legend wrapperStyle={{ fontFamily: 'Jost,sans-serif', fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8}/>
        <Area type="monotone" dataKey="Revenue" stroke={T.black}   strokeWidth={2} fill="url(#aRevGrad)" />
        <Area type="monotone" dataKey="Cost"    stroke={T.grey2}   strokeWidth={1.5} fill="none" strokeDasharray="3 2"/>
        <Area type="monotone" dataKey="Profit"  stroke="#166534"   strokeWidth={2} fill="url(#aProfGrad)" strokeDasharray="4 2"/>
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Category breakdown bar chart ──────────────────────────────────────────────
function CategoryChart({ data }: { data: CategoryStat[] }) {
  if (!data.length) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1 }}>
      No category data
    </div>
  );
  const chartData = data.map(d => ({
    name:    d.category,
    Revenue: Math.round(d.revenue),
    Profit:  Math.round(d.profit),
  }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.grey3} vertical={false}/>
        <XAxis dataKey="name" tick={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fill: T.grey1 }} axisLine={false} tickLine={false}/>
        <YAxis tickFormatter={v => fmtK(v)} tick={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fill: T.grey1 }} axisLine={false} tickLine={false} width={44}/>
        <Tooltip content={<DarkTooltip />}/>
        <Legend wrapperStyle={{ fontFamily: 'Jost,sans-serif', fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8}/>
        <Bar dataKey="Revenue" fill={T.black}   radius={[4,4,0,0]}/>
        <Bar dataKey="Profit"  fill={T.grey2}   radius={[4,4,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── AOV trend line chart ──────────────────────────────────────────────────────
function AOVChart({ data }: { data: AnalyticsData['aovByDay'] }) {
  if (!data.length) return (
    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1 }}>
      No AOV data
    </div>
  );
  const chartData = data.map(d => ({
    day: new Date(d.day).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
    AOV: Math.round(d.aov),
  }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={T.grey3} vertical={false}/>
        <XAxis dataKey="day" tick={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fill: T.grey1 }} axisLine={false} tickLine={false}/>
        <YAxis tickFormatter={v => fmtK(v)} tick={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fill: T.grey1 }} axisLine={false} tickLine={false} width={44}/>
        <Tooltip content={<DarkTooltip />}/>
        <Line type="monotone" dataKey="AOV" stroke={T.black} strokeWidth={2.5} dot={{ fill: T.black, r: 3 }} name="Avg Order Value"/>
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Category table ────────────────────────────────────────────────────────────
function CategoryTable({ data }: { data: CategoryStat[] }) {
  if (!data.length) return (
    <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1, textAlign: 'center', padding: '20px 0' }}>No data</p>
  );
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${T.grey3}` }}>
            {['Category', 'Revenue', 'Orders', 'Units', 'Profit', 'Margin'].map(h => (
              <th key={h} style={{ textAlign: h === 'Category' ? 'left' : 'right', padding: '8px 12px', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.category} style={{ borderBottom: `1px solid ${T.grey3}`, background: i % 2 === 0 ? T.white : T.grey5 }}>
              <td style={{ padding: '11px 12px', fontWeight: 600, color: T.black }}>{r.category}</td>
              <td style={{ padding: '11px 12px', textAlign: 'right', color: T.black, fontWeight: 600 }}>{fmtKsh(r.revenue)}</td>
              <td style={{ padding: '11px 12px', textAlign: 'right', color: T.grey1 }}>{r.orders}</td>
              <td style={{ padding: '11px 12px', textAlign: 'right', color: T.grey1 }}>{r.units_sold}</td>
              <td style={{ padding: '11px 12px', textAlign: 'right', color: r.profit >= 0 ? '#166534' : '#991B1B', fontWeight: 600 }}>{fmtKsh(r.profit)}</td>
              <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: r.margin_pct >= 30 ? '#F0FDF4' : r.margin_pct >= 10 ? '#FFFBEB' : '#FEF2F2',
                  color:      r.margin_pct >= 30 ? '#166534' : r.margin_pct >= 10 ? '#92400E' : '#991B1B',
                  border:     `1px solid ${r.margin_pct >= 30 ? '#BBF7D0' : r.margin_pct >= 10 ? '#FDE68A' : '#FECACA'}`,
                }}>{r.margin_pct}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Top customers table ───────────────────────────────────────────────────────
function TopCustomersTable({ data }: { data: TopCustomer[] }) {
  if (!data.length) return (
    <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1, textAlign: 'center', padding: '20px 0' }}>No customer data</p>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((c, i) => (
        <div key={c.id} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', borderRadius: 10,
          background: T.grey5, border: `1px solid ${T.grey3}`,
        }}>
          {/* Rank */}
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: i < 3 ? T.black : T.grey3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 11,
            color: i < 3 ? T.white : T.grey1,
          }}>{i + 1}</div>

          {/* Name / email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.name || 'Unknown'}
            </div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.email}
            </div>
          </div>

          {/* Orders */}
          <div style={{ textAlign: 'center', flexShrink: 0, minWidth: 48 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 16, color: T.black }}>{c.order_count}</div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey1, letterSpacing: '0.5px' }}>orders</div>
          </div>

          {/* Total spent */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 16, color: T.black }}>
              {fmtKsh(c.total_spent)}
            </div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1, marginTop: 1 }}>
              avg {fmtKsh(c.avg_order)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main AnalyticsTab ─────────────────────────────────────────────────────────
interface AnalyticsTabProps {
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}

export function AnalyticsTab({ showToast }: AnalyticsTabProps) {
  const [data,      setData]      = useState<AnalyticsData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());

  const fetchData = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const { data: d } = await axios.get(
        `/api/admin/analytics?from=${range.from}&to=${range.to}`,
        authH()
      );
      setData(d);
    } catch {
      showToast('Failed to load analytics', 'err');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(dateRange); }, []);

  const handleRangeChange = (r: DateRange) => {
    setDateRange(r);
    fetchData(r);
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div className="spinner"/>
      <p style={{ fontFamily: 'Jost,sans-serif', color: T.grey1, fontSize: 13 }}>Loading analytics…</p>
    </div>
  );

  if (!data) return null;

  const revPct = pctLabel(data.currentRevenue,  data.previousRevenue);
  const ordPct = pctLabel(data.currentOrders,   data.previousOrders);
  const aovPct = pctLabel(data.currentAOV,      data.previousAOV);
  const curProfit  = data.currentRevenue  - (data.revenueByDay.reduce((s,d) => s + parseFloat((d as any).cost ?? 0), 0));
  const prevProfit = data.previousRevenue - (data.previousRevenue * 0); // approx without prev cost

  return (
    <div className="fade-up">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Insights</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>Analytics</h1>
        </div>
        <DateRangePicker value={dateRange} onChange={handleRangeChange} />
      </div>

      {/* ── KPI comparison row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard
          label="Revenue"
          value={`KSh ${data.currentRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`vs KSh ${data.previousRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} prev period`}
          trend={revPct}
          accent
        />
        <StatCard
          label="Orders"
          value={data.currentOrders}
          sub={`vs ${data.previousOrders} prev period`}
          trend={ordPct}
        />
        <StatCard
          label="Avg Order Value"
          value={`KSh ${Math.round(data.currentAOV).toLocaleString()}`}
          sub={`vs KSh ${Math.round(data.previousAOV).toLocaleString()} prev period`}
          trend={aovPct}
        />
      </div>

      {/* ── Revenue / Profit / Cost trend ── */}
      <div style={{ marginBottom: 16 }}>
        <Section title="Revenue, Cost & Profit Trend" sub="Daily breakdown for selected period">
          <RevenueTrendChart data={data.revenueByDay} />
        </Section>
      </div>

      {/* ── Category charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Section title="Revenue & Profit by Category" sub="Comparing categories side by side">
          <CategoryChart data={data.categoryStats} />
        </Section>
        <Section title="Average Order Value Trend" sub="How AOV moves over the period">
          <AOVChart data={data.aovByDay} />
        </Section>
      </div>

      {/* ── Category breakdown table ── */}
      <div style={{ marginBottom: 16 }}>
        <Section title="Category Breakdown" sub="Detailed sales and profit metrics by product category">
          <CategoryTable data={data.categoryStats} />
        </Section>
      </div>

      {/* ── Top customers ── */}
      <Section title="Top Customers" sub={`Ranked by spend · ${dateRange.preset === 'custom' ? `${dateRange.from} – ${dateRange.to}` : `Last ${dateRange.preset === '7d' ? '7' : dateRange.preset === '30d' ? '30' : '90'} days`}`}>
        <TopCustomersTable data={data.topCustomers} />
      </Section>
    </div>
  );
}