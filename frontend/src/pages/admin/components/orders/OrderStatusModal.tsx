import React, { useState } from 'react';
import axios from 'axios';
import type { Order } from '../../types';
import { T, SC, ORDER_STATUSES, TRACKING_STEPS, TRACKING_TO_STATUS } from '../../constants';
import { authH } from '../../utils';

interface OrderStatusModalProps {
  order: Order;
  onClose: () => void;
  onSaved: () => void;
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}

export function OrderStatusModal({ order, onClose, onSaved, showToast }: OrderStatusModalProps) {
  const [form, setForm] = useState({
    status:          order.status,
    tracking_status: order.tracking_status,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/admin/orders/${order.id}/status`, form, authH());
      showToast('Order status updated!');
      onSaved();
    } catch {
      showToast('Update failed', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay2"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal2" style={{ animation: 'fadeUp 0.3s ease both' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 6 }}>Order #{order.id}</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: T.navy }}>Update Status</h2>
          </div>
          <button onClick={onClose} style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 9, width: 36, height: 36, cursor: 'pointer', fontSize: 15, color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Customer summary */}
        <div style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 12, padding: '13px 16px', marginBottom: 18 }}>
          <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.navy }}>{order.customer_name || 'Customer'}</div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted, marginTop: 2 }}>{order.customer_email}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted }}>📱 {order.mpesa_phone || '—'}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: T.gold }}>KSh {Number(order.total).toLocaleString()}</div>
          </div>
        </div>

        {/* Hint */}
        <div style={{ background: 'rgba(200,169,81,0.07)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.gold }}>
          💡 Selecting a tracking step automatically sets the matching order status.
        </div>

        {/* Status dropdown */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            Order Status
            {form.status && (
              <span style={{ background: SC[form.status]?.bg, color: SC[form.status]?.col, border: `1px solid ${SC[form.status]?.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.3px' }}>{form.status}</span>
            )}
          </div>
          <select
            className="sel2"
            value={form.status}
            onChange={e => {
              const ns = e.target.value;
              setForm({ status: ns, tracking_status: ns === 'cancelled' ? 'Order Placed' : form.tracking_status });
            }}
          >
            {ORDER_STATUSES.map(st => (
              <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Tracking step list */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Tracking Step</div>
          <div style={{ background: T.cream, borderRadius: 12, padding: 8, border: `1px solid ${T.cream3}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TRACKING_STEPS.map((step, i) => {
              const isActive = form.tracking_status === step;
              return (
                <div
                  key={step}
                  className={`track-opt ${isActive ? 'cur' : ''}`}
                  onClick={() => setForm({ tracking_status: step, status: TRACKING_TO_STATUS[step] ?? form.status })}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isActive ? T.gold : T.cream3}`,
                    background: isActive ? T.gold : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    color: isActive ? T.navy : T.muted,
                    fontFamily: 'Jost,sans-serif',
                  }}>{i + 1}</div>
                  <span style={{ flex: 1 }}>{step}</span>
                  <span style={{
                    fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700,
                    color: SC[TRACKING_TO_STATUS[step]]?.col,
                    opacity: isActive ? 1 : 0.45,
                    textTransform: 'capitalize', letterSpacing: '0.5px',
                  }}>→ {TRACKING_TO_STATUS[step]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn"
            style={{ flex: 1, background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, padding: '13px', fontSize: 12, fontWeight: 700, justifyContent: 'center', borderRadius: 10, letterSpacing: '0.5px', boxShadow: '0 4px 14px rgba(200,169,81,0.28)' }}
            onClick={handleSave}
            disabled={saving}
          >{saving ? '⏳ Saving…' : '✓ Save Changes'}</button>
          <button
            className="btn"
            style={{ background: T.cream, color: T.muted, border: `1px solid ${T.cream3}`, padding: '13px 18px', borderRadius: 10 }}
            onClick={onClose}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}