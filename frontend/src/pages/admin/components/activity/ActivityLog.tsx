// components/admin/ActivityLog.tsx
import { useState, useEffect } from 'react';
import { DataTable } from '../shared/DataTable';
import { DateRangePicker } from '../shared/DateRangePicker';
import { ExportButton, rowsToCsv, downloadCsv } from '../shared/ExportButton';
import type { DateRange } from '../../constants';
import axios from 'axios';

const EVENT_LABELS: Record<string, string> = {
  user_registered: 'Registered',
  wishlist_add: 'Added to wishlist',
  wishlist_remove: 'Removed from wishlist',
  cart_add: 'Added to cart',
  order_placed: 'Placed order',
  order_status_change: 'Order status changed',
  login: 'Logged in',
};

interface ActivityLogRow {
  id: number;
  event_type: string;
  metadata: Record<string, any>;
  email?: string;
  name?: string;
  created_at: string;
}

function formatMetadata(row: ActivityLogRow): string {
  const m = row.metadata || {};
  switch (row.event_type) {
    case 'wishlist_add':
    case 'wishlist_remove':
      return m.product_id != null ? `Product #${m.product_id}` : '—';
    case 'cart_add': {
      const parts = [`Product #${m.product_id}`, `qty ${m.quantity ?? 1}`];
      if (m.selected_color) parts.push(m.selected_color);
      if (m.selected_size) parts.push(`size ${m.selected_size}`);
      return parts.join(' · ');
    }
    case 'order_placed':
      return m.order_id != null
        ? `Order #${m.order_id} · KSh ${Number(m.amount ?? 0).toLocaleString()}`
        : '—';
    case 'order_status_change':
      return m.order_id != null
        ? `Order #${m.order_id} → ${m.status ?? m.tracking_status ?? '—'}`
        : '—';
    case 'user_registered':
      return m.email ?? '—';
    case 'login':
      return m.method ? `via ${m.method}` : '—';
    default:
      return Object.keys(m).length ? JSON.stringify(m) : '—';
  }
}
export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [eventType, setEventType] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: '30d',
    from: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    axios.get('/api/admin/activity-logs', {
      params: { eventType, from: dateRange.from, to: dateRange.to },
    }).then(res => setLogs(res.data));
  }, [eventType, dateRange]);

  const columns = [
    { key: 'user',     header: 'User',     render: (row: ActivityLogRow) => row.email ?? 'Guest' },
    { key: 'activity', header: 'Activity', render: (row: ActivityLogRow) => EVENT_LABELS[row.event_type] ?? row.event_type },
    { key: 'details',  header: 'Details',  render: (row: ActivityLogRow) => formatMetadata(row) },
    { key: 'time',     header: 'Time',     render: (row: ActivityLogRow) => new Date(row.created_at).toLocaleString() },
  ];

  const handleExportCsv = () => {
    const csv = rowsToCsv(
      columns.map(c => ({ header: c.header, key: c.key, csvValue: c.render })),
      logs,
    );
    downloadCsv('activity-log', csv);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All activity</option>
            {Object.entries(EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <ExportButton onExportCsv={handleExportCsv} label="Activity" />
      </div>
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(row) => row.id}
        emptyLabel="No activity recorded yet"
      />
    </div>
  );
}