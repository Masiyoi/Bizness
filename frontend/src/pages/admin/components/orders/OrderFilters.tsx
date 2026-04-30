import React from 'react';
import { T, SC, ORDER_STATUSES } from '../../constants';

interface OrderFiltersProps {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  totalCount: number;
  filteredCount: number;
}

export function OrderFilters({
  search, setSearch,
  statusFilter, setStatusFilter,
  totalCount, filteredCount,
}: OrderFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: `1px solid ${T.cream3}`, borderRadius: 10, padding: '10px 16px', gap: 10, flex: 1, minWidth: 200 }}>
        <span style={{ opacity: 0.4, fontSize: 15 }}>🔍</span>
        <input
          style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.navy, flex: 1 }}
          placeholder="Search customer, receipt, phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 15 }}>✕</button>
        )}
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setStatusFilter('')}
          style={{
            fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700,
            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: statusFilter === '' ? T.navy : T.cream,
            color: statusFilter === '' ? T.gold : T.muted,
            transition: 'all 0.15s',
          }}
        >All {statusFilter === '' && totalCount > 0 && `(${totalCount})`}</button>
        {ORDER_STATUSES.map(s => {
          const sc = SC[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? '' : s)}
              style={{
                fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700,
                padding: '8px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${active ? sc.border : T.cream3}`,
                background: active ? sc.bg : '#fff',
                color: active ? sc.col : T.muted,
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >{s}</button>
          );
        })}
      </div>

      {/* Result count */}
      {(search || statusFilter) && (
        <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted, whiteSpace: 'nowrap' }}>
          {filteredCount} of {totalCount} order{totalCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}