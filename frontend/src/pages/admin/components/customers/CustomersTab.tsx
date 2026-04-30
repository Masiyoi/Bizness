import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { T, SC } from '../../constants';
import { authH } from '../../utils';

// ── Types ────────────────────────────────────────────────────────────────────
interface CustomerOrder {
  id: number;
  total: string | number;
  status: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;           // aliased from full_name in the SQL SELECT
  email: string;
  phone?: string;
  role: string;
  is_verified: boolean;   // your actual DB column
  profile_picture?: string;
  created_at: string;
  orders: CustomerOrder[];
  total_spent: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusChip({ status }: { status: string }) {
  const sc = SC[status] || SC.pending;
  return (
    <span style={{
      fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20,
      background: sc.bg, color: sc.col, border: `1px solid ${sc.border}`,
      textTransform: 'capitalize',
    }}>{status}</span>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ customer }: { customer: Customer }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (customer.profile_picture && !imgFailed) {
    return (
      <img
        src={customer.profile_picture}
        alt={customer.name}
        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${T.gold},${T.gold2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: T.navy,
    }}>
      {customer.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

// ── Order history modal ───────────────────────────────────────────────────────
function OrderHistoryModal({ customer, onClose, onVerify, verifying }: {
  customer: Customer;
  onClose: () => void;
  onVerify: () => void;
  verifying: boolean;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,62,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal2" style={{ maxWidth: 520, width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar customer={customer} />
            <div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 2 }}>Customer Profile</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: T.navy }}>{customer.name}</h2>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted }}>{customer.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.muted, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Orders', value: customer.orders.length },
            { label: 'Total Spent',  value: `KSh ${customer.total_spent.toLocaleString()}` },
            { label: 'Member Since', value: fmtDate(customer.created_at) },
          ].map(s => (
            <div key={s.label} style={{ background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: T.gold }}>{s.value}</div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Verification status + phone */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          {customer.is_verified ? (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#EEF5EE', color: '#4A8A4A', border: '1px solid #C8DFC8' }}>✓ Email Verified</span>
          ) : (
            <>
              <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FDF8EC', color: '#B7791F', border: '1px solid #F6E4A0' }}>⏳ Not Verified</span>
              <button
                className="btn"
                disabled={verifying}
                onClick={onVerify}
                style={{ background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, fontSize: 11, padding: '5px 14px' }}
              >
                {verifying ? 'Verifying…' : 'Mark as Verified'}
              </button>
            </>
          )}
          {customer.phone && (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted }}>📞 {customer.phone}</span>
          )}
        </div>

        {/* Orders list */}
        <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 13, color: T.navy, marginBottom: 10 }}>
          🧾 Order History
        </div>
        {customer.orders.length === 0 ? (
          <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.muted, textAlign: 'center', padding: '24px 0' }}>No orders yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
            {customer.orders.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: T.cream, border: `1px solid ${T.cream3}`, borderRadius: 10 }}>
                <div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 12, color: T.navy }}>Order #{o.id}</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, marginTop: 1 }}>{fmtDate(o.created_at)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 13, color: T.gold }}>
                    KSh {Number(o.total).toLocaleString()}
                  </span>
                  <StatusChip status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Customer row ──────────────────────────────────────────────────────────────
function CustomerRow({ customer, onView, onVerify, verifying }: {
  customer: Customer;
  onView: () => void;
  onVerify: () => void;
  verifying: boolean;
}) {
  const pending = !customer.is_verified;
  return (
    <div
      className="row order-card-clickable"
      style={{
        display: 'flex', alignItems: 'center', gap: 14, background: '#fff',
        border: `1px solid ${pending ? '#F6E4A0' : T.cream3}`,
        borderRadius: 14, padding: '14px 18px',
      }}
      onClick={onView}
    >
      <Avatar customer={customer} />

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.name}
          </span>
          {pending ? (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FDF8EC', color: '#B7791F', border: '1px solid #F6E4A0', whiteSpace: 'nowrap' }}>⏳ Awaiting Verification</span>
          ) : (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#EEF5EE', color: '#4A8A4A', border: '1px solid #C8DFC8', whiteSpace: 'nowrap' }}>✓ Verified</span>
          )}
        </div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {customer.email}{customer.phone ? ` · ${customer.phone}` : ''}
        </div>
      </div>

      {/* Spend */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: T.gold }}>KSh {customer.total_spent.toLocaleString()}</div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.muted, marginTop: 1 }}>{customer.orders.length} order{customer.orders.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Joined */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.muted }}>Joined</div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.navy }}>{fmtDate(customer.created_at)}</div>
      </div>

      {/* Inline verify button */}
      {pending && (
        <button
          className="btn"
          disabled={verifying}
          onClick={e => { e.stopPropagation(); onVerify(); }}
          style={{ background: `linear-gradient(135deg,${T.gold},${T.gold2})`, color: T.navy, fontSize: 11, padding: '6px 14px', flexShrink: 0 }}
        >
          {verifying ? '…' : 'Verify'}
        </button>
      )}
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────
interface CustomersTabProps {
  showToast: (msg: string, type?: 'ok' | 'err') => void;
}

export function CustomersTab({ showToast }: CustomersTabProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<'all' | 'verified' | 'unverified'>('all');
  const [selected, setSelected]   = useState<Customer | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/customers', authH());
      setCustomers(data);
    } catch {
      showToast('Failed to load customers', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleVerify = async (id: number) => {
    setVerifying(id);
    try {
      await axios.patch(`/api/admin/customers/${id}/verify`, {}, authH());
      showToast('✓ Customer verified!');
      // Optimistic update — no full refetch needed
      const patch = (c: Customer) => c.id === id ? { ...c, is_verified: true } : c;
      setCustomers(prev => prev.map(patch));
      setSelected(prev => prev?.id === id ? { ...prev, is_verified: true } : prev);
    } catch {
      showToast('Verification failed', 'err');
    } finally {
      setVerifying(null);
    }
  };

  const visible = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' ? true : filter === 'verified' ? c.is_verified : !c.is_verified;
    return matchSearch && matchFilter;
  });

  const unverifiedCount = customers.filter(c => !c.is_verified).length;

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.gold, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: T.navy }}>Customers</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {unverifiedCount > 0 && (
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: '#FDF8EC', color: '#B7791F', border: '1px solid #F6E4A0' }}>
              ⏳ {unverifiedCount} awaiting verification
            </div>
          )}
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.muted, background: '#fff', border: `1px solid ${T.cream3}`, borderRadius: 9, padding: '8px 14px' }}>
            👥 {customers.length} registered
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name, email or phone…"
          style={{ flex: 1, minWidth: 200, fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.navy, background: '#fff', border: `1.5px solid ${T.cream3}`, borderRadius: 10, padding: '10px 14px', outline: 'none' }}
        />
        {(['all', 'verified', 'unverified'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn" style={{
            background: filter === f ? `linear-gradient(135deg,${T.gold},${T.gold2})` : '#fff',
            color: filter === f ? T.navy : T.muted,
            border: `1px solid ${filter === f ? T.gold : T.cream3}`, fontSize: 12,
          }}>
            {f === 'unverified' ? '⏳ Pending' : f === 'verified' ? '✓ Verified' : 'All'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.muted }}>
          {search || filter !== 'all' ? 'No customers match your filters.' : 'No customers registered yet.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(c => (
            <CustomerRow
              key={c.id}
              customer={c}
              onView={() => setSelected(c)}
              onVerify={() => handleVerify(c.id)}
              verifying={verifying === c.id}
            />
          ))}
        </div>
      )}

      {selected && (
        <OrderHistoryModal
          customer={selected}
          onClose={() => setSelected(null)}
          onVerify={() => handleVerify(selected.id)}
          verifying={verifying === selected.id}
        />
      )}
    </div>
  );
}