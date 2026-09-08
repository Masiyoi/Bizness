import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import type { SalesReport, InventoryReport, ProfitReport } from '../../types';
import { T, defaultDateRange } from '../../constants';
import type { DateRange } from '../../constants';
import { authH } from '../../utils';
import { DateRangePicker } from '../shared/DateRangePicker';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtKsh = (n: number) =>
  `KSh ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtPct = (n: number | null) =>
  n === null ? '—' : `${n.toFixed(1)}%`;

function MarginBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={{ color: T.grey2, fontFamily: 'Jost,sans-serif', fontSize: 12 }}>—</span>;
  const good = pct >= 30, ok = pct >= 10;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      background: good ? '#F0FDF4' : ok ? '#FFFBEB' : '#FEF2F2',
      color:      good ? '#166534' : ok ? '#92400E' : '#991B1B',
      border:     `1px solid ${good ? '#BBF7D0' : ok ? '#FDE68A' : '#FECACA'}`,
    }}>{pct.toFixed(1)}%</span>
  );
}

// ── Summary strip ─────────────────────────────────────────────────────────────
function SummaryStrip({ items }: { items: { label: string; value: string; accent?: boolean }[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${items.length}, 1fr)`,
      gap: 1, marginBottom: 24,
      border: `1px solid ${T.grey3}`, borderRadius: 12, overflow: 'hidden',
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: '16px 18px',
          background: item.accent ? T.black : T.white,
          borderRight: i < items.length - 1 ? `1px solid ${T.grey3}` : 'none',
        }}>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: item.accent ? 'rgba(255,255,255,0.4)' : T.grey1, marginBottom: 6 }}>
            {item.label}
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: item.accent ? T.white : T.black }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Print button ──────────────────────────────────────────────────────────────
function PrintButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '9px 16px', borderRadius: 8,
        border: `1px solid ${T.grey3}`, background: T.white,
        fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600,
        color: T.black, cursor: 'pointer',
      }}
    >⎙ Print / Save PDF</button>
  );
}

// ── Report page header (appears in print too) ─────────────────────────────────
function ReportHeader({ title, subtitle, dateRange }: { title: string; subtitle?: string; dateRange?: { from: string; to: string } }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: T.black,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: T.white,
        }}>L</div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: T.black }}>
            Luku Prime — {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>{subtitle}</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
        {dateRange && (
          <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>
            Period: {fmtDate(dateRange.from)} – {fmtDate(dateRange.to)}
          </span>
        )}
        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>
          Generated: {fmtDate(new Date().toISOString())}
        </span>
      </div>
      <div style={{ height: 1, background: T.black, marginTop: 14 }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALES REPORT
// ─────────────────────────────────────────────────────────────────────────────
function SalesReportView() {
  const [report,    setReport]    = useState<SalesReport | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());
  const printRef = useRef<HTMLDivElement>(null);

  const fetch = useCallback(async (r: DateRange) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/reports/sales?from=${r.from}&to=${r.to}`, authH());
      setReport(data);
    } catch {
      // silently fail — parent showToast is not passed in here, keep it simple
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRangeChange = (r: DateRange) => { setDateRange(r); fetch(r); };
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open('', '_blank')!;
    w.document.write(`
      <html><head><title>Sales Report — Luku Prime</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Jost', 'Helvetica Neue', sans-serif; font-size: 12px; color: #0A0A0A; padding: 32px; }
        h1 { font-family: Georgia, serif; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6B6B6B; border-bottom: 2px solid #0A0A0A; }
        td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; font-size: 11px; }
        tr:nth-child(even) td { background: #F7F7F7; }
        .summary { display: flex; gap: 24px; margin: 16px 0; padding: 14px 18px; background: #0A0A0A; color: white; border-radius: 8px; flex-wrap: wrap; }
        .summary div { min-width: 120px; }
        .summary .lbl { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 4px; }
        .summary .val { font-family: Georgia, serif; font-size: 18px; font-weight: 700; }
        .badge { display: inline-block; padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 700; }
        .ok { background: #F0FDF4; color: #166534; }
        .warn { background: #FFFBEB; color: #92400E; }
        .err { background: #FEF2F2; color: #991B1B; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      ${el.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <DateRangePicker value={dateRange} onChange={handleRangeChange} />
        <button
          onClick={() => fetch(dateRange)}
          disabled={loading}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: T.black, color: T.white,
            fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >{loading ? '⏳ Loading…' : 'Generate Report'}</button>
        {report && <PrintButton onClick={handlePrint} />}
      </div>

      {/* Report content */}
      {report && (
        <div ref={printRef}>
          <ReportHeader
            title="Sales Report"
            subtitle="Order-level revenue, cost and profit analysis"
            dateRange={{ from: report.from, to: report.to }}
          />

          {/* Summary strip */}
          <SummaryStrip items={[
            { label: 'Total Orders',  value: String(report.summary.total_orders),                accent: true },
            { label: 'Revenue',       value: fmtKsh(report.summary.total_revenue)               },
            { label: 'Cost',          value: fmtKsh(report.summary.total_cost)                  },
            { label: 'Profit',        value: fmtKsh(report.summary.total_profit)                },
            { label: 'Avg Margin',    value: fmtPct(report.summary.avg_margin)                  },
            { label: 'Avg Order',     value: fmtKsh(report.summary.avg_order)                   },
          ]}/>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: `1px solid ${T.grey3}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif', fontSize: 12 }}>
              <thead style={{ background: T.grey5 }}>
                <tr>
                  {['Order', 'Date', 'Customer', 'Items', 'Revenue', 'Cost', 'Profit', 'Margin', 'Status', 'M-Pesa'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.grey3}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={row.order_id} style={{ background: i % 2 === 0 ? T.white : T.grey5 }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: T.black, borderBottom: `1px solid ${T.grey3}` }}>#{row.order_id}</td>
                    <td style={{ padding: '9px 12px', color: T.grey1, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtDate(row.created_at)}</td>
                    <td style={{ padding: '9px 12px', color: T.black, borderBottom: `1px solid ${T.grey3}`, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.customer_name}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: T.grey1, borderBottom: `1px solid ${T.grey3}` }}>{row.items_count}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.black, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.total)}</td>
                    <td style={{ padding: '9px 12px', color: T.grey1, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.cost)}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: row.profit >= 0 ? '#166534' : '#991B1B', borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.profit)}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.grey3}` }}><MarginBadge pct={row.margin_pct}/></td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.grey3}` }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                        fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
                        background: row.status === 'delivered' ? '#F0FDF4' : row.status === 'cancelled' ? '#FEF2F2' : '#FFFBEB',
                        color:      row.status === 'delivered' ? '#166534' : row.status === 'cancelled' ? '#991B1B' : '#92400E',
                      }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '9px 12px', color: T.grey1, borderBottom: `1px solid ${T.grey3}`, fontFamily: 'monospace', fontSize: 11 }}>{row.mpesa_receipt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Jost,sans-serif', color: T.grey1 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>Select a date range and generate your report</div>
          <div style={{ fontSize: 13 }}>The report will include all orders, revenue, cost and profit data.</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY REPORT
// ─────────────────────────────────────────────────────────────────────────────
function InventoryReportView() {
  const [report,  setReport]  = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/reports/inventory', authH());
      setReport(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open('', '_blank')!;
    w.document.write(`<html><head><title>Inventory Report — Luku Prime</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #0A0A0A; padding: 32px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6B6B6B; border-bottom: 2px solid #0A0A0A; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; font-size: 11px; }
        tr:nth-child(even) td { background: #F7F7F7; }
        @media print { body { padding: 16px; } }
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 400);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <button
          onClick={fetch}
          disabled={loading}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: T.black, color: T.white,
            fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >{loading ? '⏳ Loading…' : 'Generate Report'}</button>
        {report && <PrintButton onClick={handlePrint} />}
      </div>

      {report && (
        <div ref={printRef}>
          <ReportHeader
            title="Inventory Valuation Report"
            subtitle="Current stock levels, retail value, cost value and potential profit"
          />

          <SummaryStrip items={[
            { label: 'Products',         value: String(report.rows.length),              accent: true },
            { label: 'Retail Value',     value: fmtKsh(report.total_retail_value)       },
            { label: 'Cost Value',       value: fmtKsh(report.total_cost_value)         },
            { label: 'Potential Profit', value: fmtKsh(report.total_potential_profit)   },
            { label: 'Avg Margin',       value: fmtPct(report.avg_margin)               },
            { label: 'Out of Stock',     value: String(report.out_of_stock_count)       },
          ]}/>

          <div style={{ overflowX: 'auto', border: `1px solid ${T.grey3}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif', fontSize: 12 }}>
              <thead style={{ background: T.grey5 }}>
                <tr>
                  {['Product', 'Category', 'Stock', 'Selling Price', 'Cost Price', 'Stock Value (Retail)', 'Cost Value', 'Pot. Profit', 'Margin'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={row.id} style={{ background: i % 2 === 0 ? T.white : T.grey5 }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.black, borderBottom: `1px solid ${T.grey3}`, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</td>
                    <td style={{ padding: '9px 12px', color: T.grey1, borderBottom: `1px solid ${T.grey3}` }}>{row.category}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: `1px solid ${T.grey3}` }}>
                      <span style={{ fontWeight: 700, color: row.stock === 0 ? '#991B1B' : row.stock <= 5 ? '#92400E' : T.black }}>{row.stock}</span>
                    </td>
                    <td style={{ padding: '9px 12px', color: T.black, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.price)}</td>
                    <td style={{ padding: '9px 12px', color: row.cost_price ? T.black : T.grey2, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>
                      {row.cost_price ? fmtKsh(row.cost_price) : '—'}
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.black, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.stock_value)}</td>
                    <td style={{ padding: '9px 12px', color: T.grey1, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.cost_value)}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: row.potential_profit >= 0 ? '#166534' : '#991B1B', borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.potential_profit)}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.grey3}` }}><MarginBadge pct={row.margin_pct}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Jost,sans-serif', color: T.grey1 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>Click Generate to load your inventory valuation</div>
          <div style={{ fontSize: 13 }}>Shows stock levels, retail value, cost value and potential profit for all products.</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFIT REPORT
// ─────────────────────────────────────────────────────────────────────────────
function ProfitReportView() {
  const [report,    setReport]    = useState<ProfitReport | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange());
  const printRef = useRef<HTMLDivElement>(null);

  const fetch = useCallback(async (r: DateRange) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/reports/profit?from=${r.from}&to=${r.to}`, authH());
      setReport(data);
    } catch {} finally { setLoading(false); }
  }, []);

  const handleRangeChange = (r: DateRange) => { setDateRange(r); fetch(r); };
  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open('', '_blank')!;
    w.document.write(`<html><head><title>Profit Report — Luku Prime</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #0A0A0A; padding: 32px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6B6B6B; border-bottom: 2px solid #0A0A0A; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; font-size: 11px; }
        tr:nth-child(even) td { background: #F7F7F7; }
        @media print { body { padding: 16px; } }
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => w.print(), 400);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <DateRangePicker value={dateRange} onChange={handleRangeChange} />
        <button
          onClick={() => fetch(dateRange)}
          disabled={loading}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: T.black, color: T.white,
            fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
          }}
        >{loading ? '⏳ Loading…' : 'Generate Report'}</button>
        {report && <PrintButton onClick={handlePrint} />}
      </div>

      {report && (
        <div ref={printRef}>
          <ReportHeader
            title="Product Profit Report"
            subtitle="Revenue, cost and profit margin by product for selected period"
            dateRange={{ from: report.from, to: report.to }}
          />

          <SummaryStrip items={[
            { label: 'Total Revenue', value: fmtKsh(report.summary.total_revenue), accent: true },
            { label: 'Total Cost',    value: fmtKsh(report.summary.total_cost)    },
            { label: 'Total Profit',  value: fmtKsh(report.summary.total_profit)  },
            { label: 'Avg Margin',    value: fmtPct(report.summary.avg_margin)    },
          ]}/>

          <div style={{ overflowX: 'auto', border: `1px solid ${T.grey3}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif', fontSize: 12 }}>
              <thead style={{ background: T.grey5 }}>
                <tr>
                  {['Product', 'Category', 'Units Sold', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={row.product_id} style={{ background: i % 2 === 0 ? T.white : T.grey5 }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.black, borderBottom: `1px solid ${T.grey3}`, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.product_name}</td>
                    <td style={{ padding: '9px 12px', color: T.grey1, borderBottom: `1px solid ${T.grey3}` }}>{row.category}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', color: T.black, fontWeight: 600, borderBottom: `1px solid ${T.grey3}` }}>{row.units_sold}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: T.black, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.revenue)}</td>
                    <td style={{ padding: '9px 12px', color: T.grey1, borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.cost)}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: row.profit >= 0 ? '#166534' : '#991B1B', borderBottom: `1px solid ${T.grey3}`, whiteSpace: 'nowrap' }}>{fmtKsh(row.profit)}</td>
                    <td style={{ padding: '9px 12px', borderBottom: `1px solid ${T.grey3}` }}><MarginBadge pct={row.margin_pct}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Jost,sans-serif', color: T.grey1 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>Select a period and generate your profit report</div>
          <div style={{ fontSize: 13 }}>Shows revenue, cost and profit margin broken down by product.</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ReportsTab
// ─────────────────────────────────────────────────────────────────────────────
type ReportType = 'sales' | 'inventory' | 'profit';

interface ReportsTabProps {
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}

export function ReportsTab({ showToast }: ReportsTabProps) {
  const [active, setActive] = useState<ReportType>('sales');

  const TABS: { id: ReportType; label: string; icon: string; desc: string }[] = [
    { id: 'sales',     label: 'Sales Report',     icon: '📊', desc: 'Order-level revenue & profit by date range' },
    { id: 'inventory', label: 'Inventory Report',  icon: '📦', desc: 'Stock levels, retail value & cost valuation' },
    { id: 'profit',    label: 'Profit Report',     icon: '💰', desc: 'Product-level profit margin analysis' },
  ];

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Export</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>Reports</h1>
      </div>

      {/* Report type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 28 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding:     '16px 18px',
              borderRadius: 10,
              border:      `1.5px solid ${active === t.id ? T.black : T.grey3}`,
              background:  active === t.id ? T.black : T.white,
              cursor:      'pointer',
              textAlign:   'left',
              transition:  'all 0.15s',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 700, color: active === t.id ? T.white : T.black, marginBottom: 4 }}>
              {t.label}
            </div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: active === t.id ? 'rgba(255,255,255,0.5)' : T.grey1 }}>
              {t.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Active report */}
      <div className="panel">
        {active === 'sales'     && <SalesReportView     />}
        {active === 'inventory' && <InventoryReportView />}
        {active === 'profit'    && <ProfitReportView    />}
      </div>
    </div>
  );
}