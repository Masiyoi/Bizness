// OrderStatusModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import axios from 'axios';
import type { Order } from '../../types';
import { TRACKING_STEPS, TRACKING_TO_STATUS, ORDER_STATUSES, SC, STATUS_LABELS, T } from '../../constants';
import { authH } from '../../utils';
 
interface OrderStatusModalProps {
  order:     Order;
  onClose:   () => void;
  onSaved:   () => void;
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}
 
export function OrderStatusModal({ order, onClose, onSaved, showToast }: OrderStatusModalProps) {
  const [form,   setForm]   = useState({ status: order.status, tracking_status: order.tracking_status });
  const [saving, setSaving] = useState(false);
 
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/orders/${order.id}/status`, form, authH());
      showToast('Order status updated');
      onSaved();
    } catch {
      showToast('Update failed', 'err');
    } finally { setSaving(false); }
  };
 
  return (
    <div
      className="overlay2"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal2" style={{ animation: 'fadeUp 0.28s ease both' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 5 }}>Order #{order.order_number || order.id}</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: T.black }}>Update Status</h2>
          </div>
          <button onClick={onClose} style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: 14, color: T.grey1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
 
        {/* Customer summary */}
        <div style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.black }}>{order.customer_name || 'Customer'}</div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1, marginTop: 2 }}>{order.customer_email}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>📱 {order.mpesa_phone || '—'}</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 16, color: T.black }}>KSh {Number(order.total).toLocaleString()}</div>
          </div>
        </div>
 
        {/* Hint */}
        <div style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 8, padding: '9px 12px', marginBottom: 14, fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>
          💡 Selecting a tracking step auto-sets the order status.
        </div>
 
        {/* Status dropdown */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
            Order Status
            {form.status && (
              <span style={{ background: SC[form.status]?.bg, color: SC[form.status]?.col, border: `1px solid ${SC[form.status]?.border}`, borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>
                {form.status}
              </span>
            )}
          </div>
          <select
            className="sel2"
            value={form.status}
            onChange={e => setForm({ status: e.target.value, tracking_status: e.target.value === 'cancelled' ? 'Payment Failed' : form.tracking_status })}
          >
            {ORDER_STATUSES.map(st => (
              <option key={st} value={st}>{STATUS_LABELS[st] || st}</option>
            ))}
          </select>
        </div>
 
        {/* Tracking steps */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Tracking Step</div>
          <div style={{ background: T.grey5, borderRadius: 10, padding: 6, border: `1px solid ${T.grey3}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TRACKING_STEPS.map((step, i) => {
              const isActive = form.tracking_status === step;
              const mapped   = TRACKING_TO_STATUS[step];
              const sc       = SC[mapped] || SC.confirmed;
              return (
                <div
                  key={step}
                  className={`track-opt ${isActive ? 'cur' : ''}`}
                  onClick={() => setForm({ tracking_status: step, status: mapped ?? form.status })}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isActive ? T.white : T.grey3}`,
                    background: isActive ? T.white : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    color: isActive ? T.black : T.grey1,
                    fontFamily: 'Jost,sans-serif',
                  }}>{i + 1}</div>
                  <span style={{ flex: 1 }}>{step}</span>
                  <span style={{
                    fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700,
                    color: isActive ? 'rgba(255,255,255,0.6)' : sc.col,
                    textTransform: 'capitalize',
                  }}>→ {mapped}</span>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, borderRadius: 9, border: 'none', padding: '13px', fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, background: T.black, color: T.white, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >{saving ? '⏳ Saving…' : '✓ Save Changes'}</button>
          <button
            onClick={onClose}
            style={{ borderRadius: 9, border: `1px solid ${T.grey3}`, padding: '13px 18px', fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, background: T.grey5, color: T.grey1, cursor: 'pointer' }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}