import React, { useState, useMemo } from 'react';
import type { Order, Stats } from '../../types';
import { T, TRACKING_TO_STATUS } from '../../constants';
import { OrderCard }    from './OrderCard';
import { OrderFilters } from './OrderFilters';

interface OrdersTabProps {
  orders:   Order[];
  stats:    Stats | null;
  onView:   (o: Order) => void;
  onUpdate: (o: Order) => void;
}

export function OrdersTab({ orders, stats, onView, onUpdate }: OrdersTabProps) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');

  const filtered = useMemo(() => orders.filter(o => {
    const matchStatus = statusFilter === '' || o.status === TRACKING_TO_STATUS[statusFilter];
    const q           = search.toLowerCase();
    const matchSearch =
      !q ||
      (o.customer_name  || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.mpesa_phone    || '').toLowerCase().includes(q) ||
      (o.mpesa_receipt  || '').toLowerCase().includes(q) ||
      String(o.id).includes(q);
    const created   = new Date(o.created_at).getTime();
    const matchFrom = !dateFrom || created >= new Date(`${dateFrom}T00:00:00`).getTime();
    const matchTo   = !dateTo   || created <= new Date(`${dateTo}T23:59:59.999`).getTime();
    return matchStatus && matchSearch && matchFrom && matchTo;
  }), [orders, search, statusFilter, dateFrom, dateTo]);

  const toISODate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const applyPreset = (days: number) => {
    const end   = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setDateFrom(toISODate(start));
    setDateTo(toISODate(end));
  };
  const hasDateFilter = !!(dateFrom || dateTo);
  const dateInputStyle: React.CSSProperties = {
    padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.grey3}`,
    background: T.white, color: T.black, fontFamily: 'Jost,sans-serif', fontSize: 12,
  };
  // Simple CSV export of visible orders
  const exportCSV = () => {
    const header = ['Order ID','Customer','Email','Phone','Total','Status','Tracking','M-Pesa Receipt','Date'].join(',');
    const rows   = filtered.map(o => [
      o.order_number || o.id,
      `"${(o.customer_name  || '').replace(/"/g, '""')}"`,
      `"${(o.customer_email || '').replace(/"/g, '""')}"`,
      o.mpesa_phone    || '',
      o.total,
      o.status,
      `"${o.tracking_status}"`,
      o.mpesa_receipt  || '',
      new Date(o.created_at).toLocaleDateString('en-KE'),
    ].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `luku-orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Sales</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>
            Orders <span style={{ fontSize: 20, color: T.grey1 }}>({orders.length})</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {stats && stats.activeOrders > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, padding: '9px 16px', fontFamily: 'Jost,sans-serif', fontSize: 12, color: '#92400E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/pending.png" alt="Pending" style={{ width: 14, height: 14 }}/>
              {stats.activeOrders} active order{stats.activeOrders !== 1 ? 's' : ''} pending
            </div>
          )}
          {/* CSV export */}
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
      </div>

      {/* Filters */}
      <OrderFilters
        search={search}           setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        totalCount={orders.length}  filteredCount={filtered.length}
      />

      {/* Date filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, fontFamily: 'Jost,sans-serif', fontSize: 12 }}>
        <span style={{ color: T.grey1, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: 10 }}>Date</span>
        {[{ label: 'Today', days: 1 }, { label: '7 days', days: 7 }, { label: '30 days', days: 30 }].map(p => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.days)}
            style={{ ...dateInputStyle, cursor: 'pointer', fontWeight: 600 }}
          >{p.label}</button>
        ))}
        <input type="date" value={dateFrom} max={dateTo || undefined} onChange={e => setDateFrom(e.target.value)} style={dateInputStyle} />
        <span style={{ color: T.grey1 }}>to</span>
        <input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} style={dateInputStyle} />
        {hasDateFilter && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ ...dateInputStyle, cursor: 'pointer', color: T.grey1 }}
          >✕ Clear dates</button>
        )}
      </div>
      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '70px 0', color: T.grey1, fontFamily: 'Jost,sans-serif' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🧾</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>No orders yet</div>
            <div style={{ fontSize: 13 }}>Orders will appear here once customers start purchasing.</div>
          </div>
        )}

        {orders.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.grey1, fontFamily: 'Jost,sans-serif' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 10 }}>No orders match your filters</div>
            <button
              className="btn btn-secondary"
              style={{ background: T.grey5, color: T.grey1, border: `1px solid ${T.grey3}`, margin: '0 auto' }}
              onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); }}
            >Clear filters</button>
          </div>
        )}

        {filtered.map(o => (
          <OrderCard key={o.id} order={o} onView={onView} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}