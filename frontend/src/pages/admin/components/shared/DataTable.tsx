import React, { useState, useMemo } from 'react';
import { T } from '../../constants';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Optional renderer. Defaults to String(row[key]) */
  render?: (row: T) => React.ReactNode;
  /** Value used for sorting; falls back to row[key] */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  nowrap?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  pageSize?: number;
  emptyLabel?: string;
  onRowClick?: (row: T) => void;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 10,
  emptyLabel = 'No data to display',
  onRowClick,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage]       = useState(0);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find(c => c.key === sortKey);
    if (!col) return rows;
    const getVal = col.sortValue ?? ((r: T) => (r as any)[col.key]);
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va ?? '').toLowerCase();
      const sb = String(vb ?? '').toLowerCase();
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [rows, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage  = Math.min(page, pageCount - 1);
  const pageRows  = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  if (!rows.length) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px 0',
        fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1,
        border: `1px dashed ${T.grey3}`, borderRadius: 10,
      }}>{emptyLabel}</div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: 'auto', border: `1px solid ${T.grey3}`, borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Jost,sans-serif', fontSize: 12 }}>
          <thead style={{ background: T.grey5 }}>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{
                    padding: '10px 12px',
                    textAlign: col.align ?? 'left',
                    fontSize: 9, fontWeight: 700, color: T.grey1,
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    whiteSpace: 'nowrap', userSelect: 'none', cursor: 'pointer',
                    borderBottom: `1px solid ${T.grey3}`,
                    width: col.width,
                  }}
                >
                  {col.header}
                  {sortKey === col.key && (
                    <span style={{ marginLeft: 4, fontSize: 9 }}>
                      {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                style={{
                  background: i % 2 === 0 ? T.white : T.grey5,
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding: '9px 12px',
                      textAlign: col.align ?? 'left',
                      color: T.black,
                      borderBottom: `1px solid ${T.grey3}`,
                      whiteSpace: col.nowrap ? 'nowrap' : undefined,
                    }}
                  >
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 12, fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1,
        }}>
          <span>
            Showing {safePage * pageSize + 1}–{Math.min(sorted.length, (safePage + 1) * pageSize)} of {sorted.length}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              style={{
                padding: '6px 12px', borderRadius: 7,
                border: `1px solid ${T.grey3}`, background: T.white,
                fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600,
                color: T.black, cursor: safePage === 0 ? 'not-allowed' : 'pointer',
                opacity: safePage === 0 ? 0.4 : 1,
              }}
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              style={{
                padding: '6px 12px', borderRadius: 7,
                border: `1px solid ${T.grey3}`, background: T.white,
                fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 600,
                color: T.black, cursor: safePage >= pageCount - 1 ? 'not-allowed' : 'pointer',
                opacity: safePage >= pageCount - 1 ? 0.4 : 1,
              }}
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}