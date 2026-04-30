import React, { useState, useMemo } from 'react';
import type { Order } from '../../types';
import type { Stats } from '../../types';
import { T } from '../../constants';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';

interface OrdersTabProps {
  orders: Order[];
  stats: Stats | null;
  onView: (o: Order) => void;
  onUpdate: (o: Order) => void;
}

export function OrdersTab({ orders, stats, onView, onUpdate }: OrdersTabProps) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = statusFilter === '' || o.status === statusFilter;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (o.customer_name  || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q) ||
        (o.mpesa_phone    || '').toLowerCase().includes(q) ||
        (o.mpesa_receipt  || '').toLowerCase().includes(q) ||
        String(o.id).includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Sales</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: T.navy }}>Orders ({orders.length})</h1>
        </div>
        {stats && stats.activeOrders > 0 && (
          <div style={{ background: 'rgba(200,169,81,0.1)', border: '1px solid rgba(200,169,81,0.3)', borderRadius: 10, padding: '10px 18px', fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.gold, fontWeight: 700 }}>
            ⏳ {stats.activeOrders} active order{stats.activeOrders !== 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      {/* Filters */}
      <OrderFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalCount={orders.length}
        filteredCount={filtered.length}
      />

      {/* Orders list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontFamily: 'Jost,sans-serif' }}>
            <div style={{ fontSize: 50, marginBottom: 14 }}>🧾</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.navy, marginBottom: 6 }}>No orders yet</div>
            <div style={{ fontSize: 13 }}>Orders will appear here once customers start purchasing.</div>
          </div>
        )}

        {orders.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted, fontFamily: 'Jost,sans-serif' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.navy, marginBottom: 8 }}>No orders match your filters</div>
            <button
              className="btn"
              style={{ background: T.cream, color: T.muted, border: `1px solid ${T.cream3}`, margin: '0 auto', padding: '8px 20px' }}
              onClick={() => { setSearch(''); setStatusFilter(''); }}
            >Clear filters</button>
          </div>
        )}

        {filtered.map(o => (
          <OrderCard
            key={o.id}
            order={o}
            onView={onView}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}