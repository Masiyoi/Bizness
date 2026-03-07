import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  quantity: number;
}

type CheckoutStep = 'summary' | 'phone' | 'waiting' | 'success' | 'failed';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function Checkout() {
  const navigate   = useNavigate();
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [items, setItems]         = useState<CartItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState<CheckoutStep>('summary');
  const [phone, setPhone]         = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pushing, setPushing]     = useState(false);
  const [, setCheckoutRequestId]  = useState('');
  const [receipt, setReceipt]     = useState('');
  const [failMsg, setFailMsg]     = useState('');
  const [elapsed, setElapsed]     = useState(0);
  const [serverError, setServerError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get('/api/cart', authHeaders())
      .then(res => { setItems(res.data); setLoading(false); })
      .catch(() => { setLoading(false); navigate('/cart'); });
  }, []);

  useEffect(() => () => {
    if (pollRef.current)   clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tickRef.current)   clearInterval(tickRef.current);
  }, []);

  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const delivery = subtotal >= 2000 ? 0 : 200;
  const total    = subtotal + delivery;

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
    if (!/^254\d{9}$/.test(cleaned)) return 'Enter a valid Safaricom number (07xxxxxxxx)';
    return '';
  };

  const handlePay = async () => {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError('');
    setPushing(true);
    setServerError('');
    try {
      const res = await axios.post('/api/payments/stk-push', { phone, amount: total }, authHeaders());
      setCheckoutRequestId(res.data.checkoutRequestId);
      setStep('waiting');
      startPolling(res.data.checkoutRequestId);
    } catch (err: any) {
      setServerError(err.response?.data?.msg || 'Failed to send STK push. Try again.');
    } finally {
      setPushing(false);
    }
  };

  const startPolling = (reqId: string) => {
    setElapsed(0);
    let seconds = 0;

    tickRef.current = setInterval(() => {
      seconds++;
      setElapsed(seconds);
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/payments/status/${reqId}`, authHeaders());
        const { status, mpesa_receipt } = res.data;
        if (status === 'completed') {
          clearAll();
          setReceipt(mpesa_receipt || '');
          setStep('success');
          await axios.delete('/api/cart', authHeaders());
        } else if (status === 'failed') {
          clearAll();
          setFailMsg(res.data.result_desc || 'Payment was not completed.');
          setStep('failed');
        }
      } catch { /* keep polling */ }
    }, 3000);

    timeoutRef.current = setTimeout(async () => {
      clearAll();
      try {
        await axios.get(`/api/payments/query/${reqId}`, authHeaders());
        const res = await axios.get(`/api/payments/status/${reqId}`, authHeaders());
        if (res.data.status === 'completed') {
          setReceipt(res.data.mpesa_receipt || '');
          setStep('success');
          await axios.delete('/api/cart', authHeaders());
        } else {
          setFailMsg('Payment timed out. If charged, contact support.');
          setStep('failed');
        }
      } catch {
        setFailMsg('Payment timed out. Check your M-Pesa messages.');
        setStep('failed');
      }
    }, 90000);
  };

  const clearAll = () => {
    if (pollRef.current)   clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tickRef.current)   clearInterval(tickRef.current);
  };

  if (loading) return (
    <div style={s.page}>
      <div style={s.center}>
        <div style={{ fontSize: 40 }}>🛒</div>
        <p style={{ color: '#9C7A60', fontFamily: 'DM Sans,sans-serif', marginTop: 12 }}>Loading your order…</p>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .sans { font-family: 'DM Sans', sans-serif; }

        .pay-btn {
          background: linear-gradient(135deg, #4CAF50, #2E7D32);
          color: #fff; border: none; border-radius: 14px; padding: 16px;
          width: 100%; font-family: 'DM Sans',sans-serif; font-size: 15px;
          font-weight: 700; cursor: pointer; transition: filter 0.2s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .pay-btn:hover:not(:disabled) { filter: brightness(0.92); transform: translateY(-1px); }
        .pay-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .primary-btn {
          background: linear-gradient(135deg, #C4703A, #E8944A);
          color: #fff; border: none; border-radius: 14px; padding: 16px;
          width: 100%; font-family: 'DM Sans',sans-serif; font-size: 15px;
          font-weight: 700; cursor: pointer; transition: filter 0.2s, transform 0.1s;
        }
        .primary-btn:hover { filter: brightness(0.92); transform: translateY(-1px); }

        .back-btn {
          background: #FFFDF9; border: 1px solid #E8D8C8; border-radius: 10px;
          padding: 10px 18px; font-family: 'DM Sans',sans-serif; font-size: 13px;
          color: #9C7A60; cursor: pointer; transition: background 0.15s;
        }
        .back-btn:hover { background: #F5EDE3; }
        .back-btn.full { width: 100%; margin-top: 12px; }

        .phone-input {
          background: #FFFDF9; border: 2px solid #E8D8C8; border-radius: 12px;
          padding: 14px 18px; color: #2C1A0E; font-size: 16px;
          font-family: 'DM Sans',sans-serif; width: 100%; outline: none;
          transition: border-color 0.2s; letter-spacing: 1px;
        }
        .phone-input:focus { border-color: #C4703A; }
        .phone-input.error { border-color: #ef4444; }

        .item-card {
          display: flex; align-items: center; gap: 14px;
          background: #FFFDF9; border: 1px solid #EDE3D9;
          border-radius: 16px; padding: 14px 16px;
          transition: box-shadow 0.2s;
        }
        .item-card:hover { box-shadow: 0 4px 16px rgba(44,26,14,0.08); }

        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes checkPop { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        .fade-in { animation: fadeIn 0.35s ease forwards; }
        .check-pop { animation: checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        .progress-bar {
          background: linear-gradient(90deg, #EDE3D9 25%, #F5EDE3 50%, #EDE3D9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
      `}</style>

      {/* ── SUMMARY ─────────────────────────────────────────────── */}
      {step === 'summary' && (
        <div style={s.card} className="fade-in">
          <button className="back-btn" onClick={() => navigate('/cart')} style={{ marginBottom: 24 }}>
            ← Back to Cart
          </button>

          <div style={s.logoRow}>
            <div style={s.logoDot} />
            <span style={s.logoLabel}>Secure Checkout</span>
          </div>

          <h1 style={s.heading}>Your Order</h1>
          <p className="sans" style={{ color: '#9C7A60', fontSize: 14, marginBottom: 28 }}>
            Review before proceeding to payment
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {items.map(item => (
              <div key={item.id} className="item-card">
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/56x56/F5EDE3/9C7A60?text=📦'; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Lora,serif', fontWeight: 600, fontSize: 14, color: '#2C1A0E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div className="sans" style={{ fontSize: 12, color: '#9C7A60', marginTop: 3 }}>
                    Qty: {item.quantity}
                  </div>
                </div>
                <div className="sans" style={{ fontWeight: 700, fontSize: 15, color: '#C4703A', flexShrink: 0 }}>
                  KSh {(Number(item.price) * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={s.totalsBox}>
            <div style={s.row}>
              <span className="sans" style={s.rowLabel}>Subtotal</span>
              <span className="sans" style={s.rowValue}>KSh {subtotal.toLocaleString()}</span>
            </div>
            <div style={s.row}>
              <span className="sans" style={s.rowLabel}>Delivery</span>
              <span className="sans" style={{ ...s.rowValue, color: delivery === 0 ? '#5A8A5A' : '#2C1A0E' }}>
                {delivery === 0 ? 'FREE 🎉' : `KSh ${delivery}`}
              </span>
            </div>
            <div style={{ borderTop: '1px solid #EDE3D9', margin: '14px 0' }} />
            <div style={s.row}>
              <span className="sans" style={{ fontWeight: 700, fontSize: 16, color: '#2C1A0E' }}>Total</span>
              <span className="sans" style={{ fontWeight: 800, fontSize: 22, color: '#C4703A' }}>
                KSh {total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div style={s.trustRow}>
            {['🔒 Secure', '📱 M-Pesa', '✅ Instant'].map(t => (
              <div key={t} className="sans" style={s.trustBadge}>{t}</div>
            ))}
          </div>

          <button className="pay-btn" onClick={() => setStep('phone')} style={{ marginTop: 20 }}>
            📱 Pay with M-Pesa
          </button>
        </div>
      )}

      {/* ── PHONE ENTRY ─────────────────────────────────────────── */}
      {step === 'phone' && (
        <div style={s.card} className="fade-in">
          <button className="back-btn" onClick={() => setStep('summary')} style={{ marginBottom: 24 }}>
            ← Back
          </button>

          {/* M-Pesa branding */}
          <div style={s.mpesaBadge}>
            <div style={s.mpesaIcon}>📱</div>
            <div>
              <div className="sans" style={{ fontWeight: 800, fontSize: 15, color: '#5A8A5A' }}>M-PESA</div>
              <div className="sans" style={{ fontSize: 11, color: '#9C7A60' }}>Lipa Na M-Pesa · STK Push</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div className="sans" style={{ fontSize: 10, color: '#BEA898', textAlign: 'right' }}>Powered by</div>
              <div className="sans" style={{ fontSize: 12, fontWeight: 700, color: '#5A8A5A' }}>Safaricom</div>
            </div>
          </div>

          <h2 style={{ ...s.heading, fontSize: 22, marginBottom: 8 }}>Enter M-Pesa number</h2>
          <p className="sans" style={{ color: '#9C7A60', fontSize: 13, marginBottom: 28 }}>
            A payment prompt will be sent to your phone. Enter your PIN to complete.
          </p>

          <div style={{ marginBottom: 6 }}>
            <label className="sans" style={{ fontSize: 12, fontWeight: 600, color: '#8C6A50', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
              SAFARICOM NUMBER
            </label>
            <input
              className={`phone-input ${phoneError ? 'error' : ''}`}
              type="tel"
              placeholder="07xx xxx xxx"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
              onKeyDown={e => e.key === 'Enter' && handlePay()}
            />
            {phoneError && (
              <p className="sans" style={{ color: '#C0392B', fontSize: 12, marginTop: 6 }}>{phoneError}</p>
            )}
          </div>

          {serverError && (
            <div style={s.errorBox}>{serverError}</div>
          )}

          {/* Amount pill */}
          <div style={s.amountPill}>
            <span className="sans" style={{ fontSize: 13, color: '#9C7A60' }}>Amount to pay</span>
            <span style={{ fontFamily: 'Lora,serif', fontWeight: 700, fontSize: 30, color: '#C4703A' }}>
              KSh {total.toLocaleString()}
            </span>
          </div>

          <button className="pay-btn" onClick={handlePay} disabled={pushing} style={{ marginTop: 8 }}>
            {pushing
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', animation: 'pulse 0.8s ease infinite' }}>⏳</span>
                  Sending prompt…
                </span>
              : <>📲 Send KSh {total.toLocaleString()} Prompt</>
            }
          </button>

          <p className="sans" style={{ textAlign: 'center', fontSize: 11, color: '#BEA898', marginTop: 14 }}>
            🔒 Secured by Safaricom. We never store your PIN.
          </p>
        </div>
      )}

      {/* ── WAITING ─────────────────────────────────────────────── */}
      {step === 'waiting' && (
        <div style={{ ...s.card, textAlign: 'center' }} className="fade-in">
          <div style={{ fontSize: 64, marginBottom: 20, display: 'inline-block', animation: 'pulse 1.6s ease-in-out infinite' }}>
            📱
          </div>

          <h2 style={{ ...s.heading, fontSize: 22, marginBottom: 10 }}>Check your phone</h2>
          <p className="sans" style={{ color: '#9C7A60', fontSize: 14, maxWidth: 300, margin: '0 auto 28px' }}>
            A prompt was sent to <strong style={{ color: '#2C1A0E' }}>{phone}</strong>.
            Enter your M-Pesa PIN to pay <strong style={{ color: '#C4703A' }}>KSh {total.toLocaleString()}</strong>.
          </p>

          {/* Progress bar */}
          <div style={s.progressWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span className="sans" style={{ fontSize: 12, color: '#9C7A60' }}>Waiting for payment…</span>
              <span className="sans" style={{ fontSize: 12, color: '#C4703A', fontWeight: 600 }}>
                {elapsed < 90 ? `${90 - elapsed}s` : 'Checking…'}
              </span>
            </div>
            <div style={{ background: '#EDE3D9', borderRadius: 8, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                background: 'linear-gradient(90deg, #C4703A, #E8944A)',
                width: `${Math.min((elapsed / 90) * 100, 100)}%`,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>

          {/* Steps */}
          <div style={s.stepList}>
            {[
              { done: true,  active: false, text: 'STK push sent to your phone' },
              { done: false, active: true,  text: 'Waiting for your PIN entry' },
              { done: false, active: false, text: 'Payment confirmation' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: item.done ? '#5A8A5A' : item.active ? '#FDF0E6' : '#EDE3D9',
                  border: item.active ? '2px solid #C4703A' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: item.done ? '#fff' : '#9C7A60',
                  fontFamily: 'DM Sans,sans-serif', fontWeight: 700,
                }}>
                  {item.done ? '✓' : i + 1}
                </div>
                <span className="sans" style={{
                  fontSize: 13,
                  color: item.done ? '#2C1A0E' : item.active ? '#C4703A' : '#BEA898',
                  fontWeight: item.active ? 600 : 400,
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <button
            className="back-btn full"
            onClick={() => { clearAll(); setStep('phone'); }}
          >
            Cancel — try different number
          </button>
        </div>
      )}

      {/* ── SUCCESS ─────────────────────────────────────────────── */}
      {step === 'success' && (
        <div style={{ ...s.card, textAlign: 'center' }} className="fade-in">
          <div style={s.successCircle} className="check-pop">✅</div>

          <h2 style={{ ...s.heading, fontSize: 26, color: '#5A8A5A', marginBottom: 8 }}>
            Payment Successful!
          </h2>
          <p className="sans" style={{ color: '#9C7A60', fontSize: 14, marginBottom: 28 }}>
            Your order has been placed. Thank you for shopping with us!
          </p>

          {receipt && (
            <div style={s.receiptBox}>
              <div className="sans" style={{ fontSize: 10, color: '#9C7A60', letterSpacing: '2px', marginBottom: 6 }}>
                M-PESA RECEIPT
              </div>
              <div className="sans" style={{ fontWeight: 800, fontSize: 22, color: '#5A8A5A', letterSpacing: '2px' }}>
                {receipt}
              </div>
            </div>
          )}

          <div style={s.totalsBox}>
            <div style={s.row}>
              <span className="sans" style={s.rowLabel}>Amount paid</span>
              <span className="sans" style={s.rowValue}>KSh {total.toLocaleString()}</span>
            </div>
            <div style={s.row}>
              <span className="sans" style={s.rowLabel}>Phone</span>
              <span className="sans" style={s.rowValue}>{phone}</span>
            </div>
          </div>

          <button className="primary-btn" onClick={() => navigate('/')} style={{ marginTop: 24 }}>
            🛍️ Continue Shopping
          </button>
          <button className="back-btn full" onClick={() => navigate('/orders')}>
            📦 View My Orders
          </button>
        </div>
      )}

      {/* ── FAILED ──────────────────────────────────────────────── */}
      {step === 'failed' && (
        <div style={{ ...s.card, textAlign: 'center' }} className="fade-in">
          <div style={s.failCircle} className="check-pop">❌</div>

          <h2 style={{ ...s.heading, fontSize: 24, color: '#C0392B', marginBottom: 8 }}>
            Payment Failed
          </h2>
          <p className="sans" style={{ color: '#9C7A60', fontSize: 14, maxWidth: 280, margin: '0 auto 28px' }}>
            {failMsg || 'The payment was cancelled or not completed. Your cart is saved.'}
          </p>

          <button className="pay-btn" onClick={() => { setStep('phone'); setServerError(''); }}
            style={{ background: 'linear-gradient(135deg,#C4703A,#E8944A)', marginBottom: 12 }}>
            🔄 Try Again
          </button>
          <button className="back-btn full" onClick={() => navigate('/cart')}>
            ← Back to Cart
          </button>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#FBF6F0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: "'DM Sans', sans-serif",
  },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '50vh',
  },
  card: {
    background: '#fff',
    border: '1px solid #EDE3D9',
    borderRadius: 24, padding: '40px 36px',
    width: '100%', maxWidth: 480,
    boxShadow: '0 20px 60px rgba(44,26,14,0.1)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
  },
  logoDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: 'linear-gradient(135deg,#C4703A,#E8944A)',
  },
  logoLabel: {
    fontFamily: 'DM Sans,sans-serif', fontSize: 12,
    fontWeight: 700, color: '#C4703A',
    letterSpacing: '1.5px', textTransform: 'uppercase' as const,
  },
  heading: {
    fontFamily: 'Lora,serif', fontWeight: 700,
    fontSize: 26, color: '#2C1A0E', marginBottom: 4,
  },
  totalsBox: {
    background: '#FBF6F0', border: '1px solid #EDE3D9',
    borderRadius: 16, padding: '18px 20px',
  },
  row: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  rowLabel: { fontSize: 14, color: '#9C7A60' },
  rowValue: { fontSize: 14, fontWeight: 600, color: '#2C1A0E' },
  trustRow: {
    display: 'flex', gap: 8, marginTop: 18,
  },
  trustBadge: {
    flex: 1, textAlign: 'center' as const,
    background: '#FBF6F0', border: '1px solid #EDE3D9',
    borderRadius: 10, padding: '8px 0',
    fontSize: 12, fontWeight: 600, color: '#8C6A50',
  },
  mpesaBadge: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#EEF5EE', border: '1px solid #C8DFC8',
    borderRadius: 14, padding: '14px 18px', marginBottom: 24,
  },
  mpesaIcon: {
    width: 40, height: 40, borderRadius: 12,
    background: '#fff', border: '1px solid #C8DFC8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, flexShrink: 0,
  },
  amountPill: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    background: '#FBF6F0', border: '1px solid #EDE3D9',
    borderRadius: 16, padding: '20px', margin: '20px 0', gap: 4,
  },
  errorBox: {
    background: '#FDF0EE', border: '1px solid #F5C6C0',
    borderRadius: 10, padding: '12px 16px', color: '#C0392B',
    fontSize: 13, marginBottom: 16,
    fontFamily: 'DM Sans,sans-serif',
  },
  progressWrap: {
    background: '#FBF6F0', border: '1px solid #EDE3D9',
    borderRadius: 16, padding: '18px 20px', marginBottom: 20, textAlign: 'left' as const,
  },
  stepList: {
    display: 'flex', flexDirection: 'column' as const, gap: 14,
    background: '#FBF6F0', border: '1px solid #EDE3D9',
    borderRadius: 16, padding: '18px 20px',
    marginBottom: 20, textAlign: 'left' as const,
  },
  successCircle: {
    width: 80, height: 80, borderRadius: '50%',
    background: '#EEF5EE', border: '3px solid #5A8A5A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, margin: '0 auto 24px',
  },
  failCircle: {
    width: 80, height: 80, borderRadius: '50%',
    background: '#FDF0EE', border: '3px solid #C0392B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, margin: '0 auto 24px',
  },
  receiptBox: {
    background: '#EEF5EE', border: '1px solid #C8DFC8',
    borderRadius: 14, padding: '16px 24px',
    marginBottom: 20, textAlign: 'center' as const,
  },
};