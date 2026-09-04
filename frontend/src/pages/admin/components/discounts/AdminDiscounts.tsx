import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { T } from '../../constants';
interface DiscountOrder {
  order_number:    string;
  customer_name:   string | null;
  customer_email:  string | null;
  mpesa_phone:     string | null;
  total:           number;
  discount_type:   string | null;
  discount_amount: number;
  created_at:      string;
}
interface DiscountSummary {
  totalDiscountAmount: number;
  ordersCount:         number;
  orders:              DiscountOrder[];
}
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const discountLabel = (type: string | null) =>
  type === 'first_order' ? 'First order (10%)' : type ?? 'Discount';
export function AdminDiscounts() {
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');
  const [search, setSearch]   = useState('');
  const [data, setData]       = useState<DiscountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const load = () => {
    setLoading(true);
    setError(false);
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to)   params.to   = to;
    axios.get('/api/admin/discount/summary', { params })
      .then(r => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    if (!q) return data.orders;
    return data.orders.filter(o =>
      (o.customer_name  || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.mpesa_phone    || '').toLowerCase().includes(q) ||
      o.order_number.toLowerCase().includes(q)
    );
  }, [data, search]);
  const exportCSV = () => {
    const header = ['Order Number','Customer','Email','Phone','Discount Type','Discount Amount','Order Total','Date'].join(',');
    const rows = filtered.map(o => [
      o.order_number,
      `"${(o.customer_name  || '').replace(/"/g, '""')}"`,
      `"${(o.customer_email || '').replace(/"/g, '""')}"`,
      o.mpesa_phone || '',
      `"${discountLabel(o.discount_type)}"`,
      o.discount_amount,
      o.total,
      new Date(o.created_at).toLocaleDateString('en-KE'),
    ].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `luku-discounts-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Marketing</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>
            Discounts
          </h1>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={exportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 8,
              border: `1px solid ${T.grey3}`, background: T.white,
              fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600, color: T.black, cursor: 'pointer',
            }}
          >⬇ Export CSV</button>
        )}
      </div>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="pf-card" style={{ flex: '1 1 220px', padding: '18px 20px' }}>
          <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
            Total Discount Given
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 28, color: T.black }}>
            {loading ? '—' : `KSh ${(data?.totalDiscountAmount ?? 0).toLocaleString()}`}
          </p>
        </div>
        <div className="pf-card" style={{ flex: '1 1 220px', padding: '18px 20px' }}>
          <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
            Discounted Orders
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 28, color: T.black }}>
            {loading ? '—' : (data?.ordersCount ?? 0)}
          </p>
        </div>
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <label style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>
          From{' '}
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ marginLeft: 6, padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 12 }} />
        </label>
        <label style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>
          To{' '}
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ marginLeft: 6, padding: '7px 10px', borderRadius: 7, border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 12 }} />
        </label>
        <button
          onClick={load}
          style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: T.black, color: T.white, fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >Apply</button>
        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo(''); }}
            style={{ padding: '8px 16px', borderRadius: 7, border: `1px solid ${T.grey3}`, background: T.white, color: T.grey1, fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >Clear dates</button>
        )}
        <input
          type="text"
          placeholder="Search customer, email, phone, order #"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 12 }}
        />
      </div>
      {/* Table */}
      {loading && <div className="pf-card" style={{ padding: 20 }}>Loading…</div>}
      {!loading && error && (
        <div className="pf-card" style={{ padding: 20 }}>
          <div className="pf-empty">
            <p className="pf-empty-title">Couldn't load discount data</p>
            <p className="pf-empty-sub">Try refreshing, or adjust the date range.</p>
          </div>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.grey1, fontFamily: 'Jost,sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>No discounted orders found</div>
          <div style={{ fontSize: 13 }}>Try widening the date range or clearing the search.</div>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="pf-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `1px solid ${T.grey3}` }}>
                {['Order', 'Customer', 'Contact', 'Discount', 'Amount', 'Order Total', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <tr key={o.order_number} style={{ borderBottom: i < filtered.length - 1 ? `1px solid rgba(0,0,0,0.06)` : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: T.black }}>{o.order_number}</td>
                  <td style={{ padding: '12px 16px' }}>{o.customer_name || '—'}</td>
                  <td style={{ padding: '12px 16px', color: T.grey1 }}>
                    <div>{o.customer_email || '—'}</div>
                    {o.mpesa_phone && <div style={{ fontSize: 12 }}>{o.mpesa_phone}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{discountLabel(o.discount_type)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1F8A3D' }}>-KSh {o.discount_amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px' }}>KSh {o.total.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: T.grey1 }}>{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}