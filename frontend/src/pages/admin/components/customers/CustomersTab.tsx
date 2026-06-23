import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { T, SC } from '../../constants';
import { authH } from '../../utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CustomerOrder {
  id:         number;
  total:      string | number;
  status:     string;
  created_at: string;
}
interface Customer {
  id:              number;
  name:            string;
  email:           string;
  phone?:          string;
  role:            string;
  is_verified:     boolean;
  profile_picture?: string;
  created_at:      string;
  orders:          CustomerOrder[];
  total_spent:     number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

function StatusChip({ status }: { status: string }) {
  const sc = SC[status] || SC.pending;
  return (
    <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.col, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ customer, size = 40 }: { customer: Customer; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (customer.profile_picture && !failed) {
    return (
      <img
        src={customer.profile_picture} alt={customer.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: T.black,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Cormorant Garamond',serif", fontWeight: 700,
      fontSize: Math.round(size * 0.4), color: T.white,
    }}>
      {customer.name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

// ── Order history modal ───────────────────────────────────────────────────────
function OrderHistoryModal({ customer, onClose, onVerify, verifying }: {
  customer:  Customer;
  onClose:   () => void;
  onVerify:  () => void;
  verifying: boolean;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal2" style={{ maxWidth: 520, width: '100%', animation: 'wizardIn 0.25s cubic-bezier(.34,1.56,.64,1)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar customer={customer} />
            <div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, color: T.grey1, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 3 }}>Customer Profile</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: T.black }}>{customer.name}</h2>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>{customer.email}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: T.grey1, padding: 4 }}>✕</button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Orders',       value: customer.orders.length },
            { label: 'Total Spent',  value: `KSh ${customer.total_spent.toLocaleString()}` },
            { label: 'Member Since', value: fmtDate(customer.created_at) },
          ].map(s => (
            <div key={s.label} style={{ background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 10, padding: '11px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, color: T.black }}>{s.value}</div>
              <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, color: T.grey1, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Verification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16, flexWrap: 'wrap' }}>
          {customer.is_verified ? (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }}>✓ Verified</span>
          ) : (
            <>
              <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>⏳ Not Verified</span>
              <button
                disabled={verifying} onClick={onVerify}
                style={{ background: T.black, color: T.white, border: 'none', borderRadius: 7, padding: '5px 14px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.6 : 1 }}
              >{verifying ? 'Verifying…' : 'Mark as Verified'}</button>
            </>
          )}
          {customer.phone && (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>📞 {customer.phone}</span>
          )}
        </div>

        {/* Order history */}
        <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 700, fontSize: 12, color: T.black, marginBottom: 9, letterSpacing: '0.3px' }}>Order History</div>
        {customer.orders.length === 0 ? (
          <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.grey1, textAlign: 'center', padding: '20px 0' }}>No orders yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
            {customer.orders.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: T.grey5, border: `1px solid ${T.grey3}`, borderRadius: 9 }}>
                <div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 12, color: T.black }}>Order #{o.id}</div>
                  <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, marginTop: 1 }}>{fmtDate(o.created_at)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 14, color: T.black }}>
                    KSh {Number(o.total).toLocaleString()}
                  </span>
                  <StatusChip status={o.status}/>
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
  customer:  Customer;
  onView:    () => void;
  onVerify:  () => void;
  verifying: boolean;
}) {
  const pending = !customer.is_verified;
  return (
    <div
      className="row order-card-clickable"
      style={{ border: `1px solid ${pending ? '#FDE68A' : T.grey3}`, background: T.white }}
      onClick={onView}
    >
      <Avatar customer={customer} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Jost,sans-serif', fontWeight: 600, fontSize: 13, color: T.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {customer.name}
          </span>
          {pending ? (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', whiteSpace: 'nowrap' }}>⏳ Pending</span>
          ) : (
            <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', whiteSpace: 'nowrap' }}>✓ Verified</span>
          )}
        </div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {customer.email}{customer.phone ? ` · ${customer.phone}` : ''}
        </div>
      </div>

      {/* Spend */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 15, color: T.black }}>
          KSh {customer.total_spent.toLocaleString()}
        </div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, marginTop: 1 }}>
          {customer.orders.length} order{customer.orders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Joined */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 76 }}>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, color: T.grey2, marginBottom: 2, letterSpacing: '0.5px' }}>Joined</div>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 600, color: T.black }}>{fmtDate(customer.created_at)}</div>
      </div>

      {/* Verify button */}
      {pending && (
        <button
          disabled={verifying}
          onClick={e => { e.stopPropagation(); onVerify(); }}
          style={{ background: T.black, color: T.white, border: 'none', borderRadius: 7, padding: '7px 14px', fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, cursor: verifying ? 'not-allowed' : 'pointer', opacity: verifying ? 0.6 : 1, flexShrink: 0 }}
        >{verifying ? '…' : 'Verify'}</button>
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
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'all' | 'verified' | 'unverified'>('all');
  const [selected,  setSelected]  = useState<Customer | null>(null);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [sortBy,    setSortBy]    = useState<'joined' | 'spent' | 'orders'>('joined');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/customers', authH());
      setCustomers(data);
    } catch {
      showToast('Failed to load customers', 'err');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleVerify = async (id: number) => {
    setVerifying(id);
    try {
      await axios.patch(`/api/admin/customers/${id}/verify`, {}, authH());
      showToast('✓ Customer verified');
      const patch = (c: Customer) => c.id === id ? { ...c, is_verified: true } : c;
      setCustomers(prev => prev.map(patch));
      setSelected(prev => prev?.id === id ? { ...prev, is_verified: true } : prev);
    } catch {
      showToast('Verification failed', 'err');
    } finally { setVerifying(null); }
  };

  const visible = customers
    .filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
      const matchFilter = filter === 'all' ? true : filter === 'verified' ? c.is_verified : !c.is_verified;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'spent')  return b.total_spent - a.total_spent;
      if (sortBy === 'orders') return b.orders.length - a.orders.length;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const unverifiedCount = customers.filter(c => !c.is_verified).length;

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 26, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>CRM</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>
            Customers <span style={{ fontSize: 20, color: T.grey1 }}>({customers.length})</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {unverifiedCount > 0 && (
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 20, background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}>
              ⏳ {unverifiedCount} awaiting verification
            </div>
          )}
          <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1, background: T.white, border: `1px solid ${T.grey3}`, borderRadius: 9, padding: '7px 13px' }}>
            👥 {customers.length} registered
          </div>
        </div>
      </div>

      {/* Search + filter + sort */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search by name, email or phone…"
          style={{ flex: 1, minWidth: 200, fontFamily: 'Jost,sans-serif', fontSize: 13, color: T.black, background: T.white, border: `1.5px solid ${T.grey3}`, borderRadius: 9, padding: '9px 13px', outline: 'none' }}
        />

        {/* Filter pills */}
        {(['all', 'verified', 'unverified'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700,
            padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
            background: filter === f ? T.black : T.white,
            color:      filter === f ? T.white : T.grey1,
            border:     `1px solid ${filter === f ? T.black : T.grey3}`,
            transition: 'all 0.15s',
          }}>
            {f === 'unverified' ? '⏳ Pending' : f === 'verified' ? '✓ Verified' : 'All'}
          </button>
        ))}

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.black, background: T.white, border: `1px solid ${T.grey3}`, borderRadius: 8, padding: '7px 12px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="joined">Sort: Newest</option>
          <option value="spent">Sort: Top Spenders</option>
          <option value="orders">Sort: Most Orders</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner"/></div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.grey1 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>
            {search || filter !== 'all' ? 'No customers match your filters' : 'No customers yet'}
          </div>
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