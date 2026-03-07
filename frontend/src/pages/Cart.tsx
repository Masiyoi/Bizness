import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  category: string;
  quantity: number;
}

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems]       = useState<CartItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState<number | null>(null); // itemId being updated
  const [error, setError]       = useState('');

  const token = localStorage.getItem('token');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart', authHeaders());
      setItems(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) navigate('/login');
      else setError('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (itemId: number, qty: number) => {
    if (qty < 1) return removeItem(itemId);
    setUpdating(itemId);
    try {
      await axios.patch(`/api/cart/${itemId}`, { quantity: qty }, authHeaders());
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
    } catch { setError('Failed to update quantity.'); }
    finally { setUpdating(null); }
  };

  const removeItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      await axios.delete(`/api/cart/${itemId}`, authHeaders());
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch { setError('Failed to remove item.'); }
    finally { setUpdating(null); }
  };

  const clearCart = async () => {
    try {
      await axios.delete('/api/cart', authHeaders());
      setItems([]);
    } catch { setError('Failed to clear cart.'); }
  };

  const subtotal  = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const delivery  = subtotal >= 2000 ? 0 : 200;
  const total     = subtotal + delivery;

  if (loading) return (
    <div style={s.page}>
      <div style={s.center}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🛒</div>
        <p style={{ color: '#9C7A60', fontFamily: 'DM Sans,sans-serif' }}>Loading your cart…</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .sans { font-family: 'DM Sans', sans-serif; }
        .qty-btn { border:1px solid #E8D8C8; background:#FFFDF9; border-radius:8px; width:32px; height:32px; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .qty-btn:hover { background:#F5EDE3; border-color:#C4703A; }
        .remove-btn { background:none; border:none; cursor:pointer; color:#BEA898; font-size:18px; transition:color 0.15s; padding:4px; }
        .remove-btn:hover { color:#C0392B; }
        .item-row { background:#fff; border-radius:18px; padding:18px; display:flex; align-items:center; gap:16px; box-shadow:0 2px 10px rgba(44,26,14,0.06); transition:box-shadow 0.2s; }
        .item-row:hover { box-shadow:0 6px 20px rgba(44,26,14,0.10); }
        .checkout-btn { background:linear-gradient(135deg,#C4703A,#E8944A); color:#fff; border:none; border-radius:14px; padding:16px; width:100%; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition:filter 0.2s; }
        .checkout-btn:hover { filter:brightness(0.92); }
        .continue-btn { background:#FFFDF9; color:#5C3D1E; border:1px solid #E8D8C8; border-radius:14px; padding:13px; width:100%; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; cursor:pointer; margin-top:10px; transition:background 0.15s; }
        .continue-btn:hover { background:#F5EDE3; }
      `}</style>

      {/* ── Header ── */}
      <div style={s.header}>
        <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>
        <h1 style={s.title}>My Cart</h1>
        {items.length > 0 && (
          <button onClick={clearCart} style={s.clearBtn}>Clear all</button>
        )}
      </div>

      {error && (
        <div style={{ background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:10, padding:'10px 16px', color:'#C0392B', fontSize:13, marginBottom:16, fontFamily:'DM Sans,sans-serif' }}>
          {error}
        </div>
      )}

      {items.length === 0 ? (
        /* ── Empty state ── */
        <div style={s.center}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🛒</div>
          <h2 style={{ fontFamily: 'Lora,serif', fontSize: 22, color: '#2C1A0E', marginBottom: 10 }}>
            Your cart is empty
          </h2>
          <p style={{ color: '#9C7A60', fontSize: 14, fontFamily: 'DM Sans,sans-serif', marginBottom: 28 }}>
            Looks like you haven't added anything yet.
          </p>
          <button className="checkout-btn" style={{ width: 'auto', padding: '13px 32px' }} onClick={() => navigate('/')}>
            Start Shopping →
          </button>
        </div>
      ) : (
        <div style={s.layout}>
          {/* ── Items list ── */}
          <div style={s.itemsList}>
            <p className="sans" style={{ fontSize: 13, color: '#9C7A60', marginBottom: 14 }}>
              {items.length} item{items.length !== 1 ? 's' : ''} in your cart
            </p>

            {items.map(item => {
              const isBusy = updating === item.id;
              return (
                <div key={item.id} className="item-row" style={{ opacity: isBusy ? 0.5 : 1 }}>
                  {/* Image */}
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/F5EDE3/9C7A60?text=📦'; }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Lora,serif', fontWeight: 600, fontSize: 15, color: '#2C1A0E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                    <div className="sans" style={{ fontSize: 12, color: '#9C7A60', marginTop: 3 }}>
                      {item.category}
                    </div>
                    <div className="sans" style={{ fontWeight: 700, fontSize: 16, color: '#C4703A', marginTop: 6 }}>
                      KSh {(Number(item.price) * item.quantity).toLocaleString()}
                    </div>
                    <div className="sans" style={{ fontSize: 11, color: '#BEA898' }}>
                      KSh {Number(item.price).toLocaleString()} each
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)} disabled={isBusy}>−</button>
                    <span className="sans" style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)} disabled={isBusy}>+</button>
                  </div>

                  {/* Remove */}
                  <button className="remove-btn" onClick={() => removeItem(item.id)} disabled={isBusy} title="Remove">
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Order summary ── */}
          <div style={s.summary}>
            <h2 style={{ fontFamily: 'Lora,serif', fontSize: 20, color: '#2C1A0E', marginBottom: 20 }}>
              Order Summary
            </h2>

            <div style={s.summaryRow}>
              <span className="sans" style={s.summaryLabel}>Subtotal</span>
              <span className="sans" style={s.summaryValue}>KSh {subtotal.toLocaleString()}</span>
            </div>
            <div style={s.summaryRow}>
              <span className="sans" style={s.summaryLabel}>Delivery</span>
              <span className="sans" style={{ ...s.summaryValue, color: delivery === 0 ? '#5A8A5A' : '#2C1A0E' }}>
                {delivery === 0 ? 'FREE 🎉' : `KSh ${delivery.toLocaleString()}`}
              </span>
            </div>

            {delivery > 0 && (
              <div style={{ background: '#FDF0E6', borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
                <p className="sans" style={{ fontSize: 12, color: '#C4703A' }}>
                  Add KSh {(2000 - subtotal).toLocaleString()} more for free delivery!
                </p>
              </div>
            )}

            <div style={{ borderTop: '1px solid #EDE3D9', margin: '18px 0' }} />

            <div style={{ ...s.summaryRow, marginBottom: 24 }}>
              <span className="sans" style={{ fontWeight: 700, fontSize: 16, color: '#2C1A0E' }}>Total</span>
              <span className="sans" style={{ fontWeight: 800, fontSize: 20, color: '#C4703A' }}>
                KSh {total.toLocaleString()}
              </span>
            </div>

            {/* M-Pesa badge */}
            <div style={{ background: '#EEF5EE', borderRadius: 12, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <div>
                <div className="sans" style={{ fontSize: 12, fontWeight: 700, color: '#5A8A5A' }}>Pay with M-Pesa</div>
                <div className="sans" style={{ fontSize: 11, color: '#9C7A60' }}>Fast & secure mobile payments</div>
              </div>
            </div>

            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
              Proceed to Checkout →
            </button>
            <button className="continue-btn" onClick={() => navigate('/')}>
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: '#FBF6F0', minHeight: '100vh',
    padding: '32px 5%', maxWidth: 1100, margin: '0 auto',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 600,
    color: '#C4703A', padding: '8px 0',
  },
  title: {
    fontFamily: 'Lora,serif', fontSize: 28, fontWeight: 700, color: '#2C1A0E',
  },
  clearBtn: {
    background: 'none', border: '1px solid #E8D8C8', borderRadius: 8,
    cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
    fontSize: 12, color: '#9C7A60', padding: '6px 14px',
  },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '50vh', textAlign: 'center',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: 28, alignItems: 'start',
  },
  itemsList: { display: 'flex', flexDirection: 'column', gap: 14 },
  summary: {
    background: '#fff', borderRadius: 20, padding: 28,
    boxShadow: '0 4px 20px rgba(44,26,14,0.08)',
    position: 'sticky', top: 24,
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  summaryLabel: { fontSize: 14, color: '#9C7A60' },
  summaryValue: { fontSize: 14, fontWeight: 600, color: '#2C1A0E' },
};