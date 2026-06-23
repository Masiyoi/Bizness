import React from 'react';
import { T, SC, ORDER_STATUSES } from '../../constants';

interface OrderFiltersProps {
  search:          string;
  setSearch:       (v: string) => void;
  statusFilter:    string;
  setStatusFilter: (v: string) => void;
  totalCount:      number;
  filteredCount:   number;
}

export function OrderFilters({ search, setSearch, statusFilter, setStatusFilter, totalCount, filteredCount }: OrderFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', background: T.white, border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '9px 14px', gap: 9, flex: 1, minWidth: 220 }}>
        <span style={{ opacity: 0.35, fontSize: 14 }}>🔍</span>
        <input
          style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black, flex: 1 }}
          placeholder="Search customer, receipt, phone, order #…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.grey1, fontSize: 14 }}>✕</button>
        )}
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setStatusFilter('')}
          style={{
            fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700,
            padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: statusFilter === '' ? T.black : T.grey5,
            color:      statusFilter === '' ? T.white  : T.grey1,
            transition: 'all 0.15s',
          }}
        >All {statusFilter === '' && totalCount > 0 && `(${totalCount})`}</button>

        {ORDER_STATUSES.map(s => {
          const sc     = SC[s];
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? '' : s)}
              style={{
                fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700,
                padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${active ? sc.border : T.grey3}`,
                background: active ? sc.bg : T.white,
                color: active ? sc.col : T.grey1,
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >{s}</button>
          );
        })}
      </div>

      {/* Count */}
      {(search || statusFilter) && (
        <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1, whiteSpace: 'nowrap' }}>
          {filteredCount} of {totalCount} order{totalCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}