import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  quantity: number;
}

type CheckoutStep = 'summary' | 'choose' | 'phone' | 'waiting' | 'success' | 'failed' | 'pesapal-redirect';
type DeliveryZone = 'pickup' | 'cbd' | 'environs' | 'county';
type PaymentMethod = 'mpesa' | 'pesapal';

// ─── Luku Prime Design Tokens ──────────────────────────────────────────────
const T = {
  navy:     '#0D1B3E',
  navyMid:  '#152348',
  navyLight:'#1E2F5A',
  gold:     '#C8A951',
  goldLight:'#DEC06A',
  goldPale: '#F0D98A',
  cream:    '#F9F5EC',
  creamMid: '#F0EAD8',
  creamDeep:'#E4D9C0',
  white:    '#FFFFFF',
  text:     '#0D1B3E',
  muted:    '#7A7A8A',
};

const DELIVERY_OPTIONS: { value: DeliveryZone; label: string; fee: number }[] = [
  { value:'pickup',   label:'Pick Up from Shop',  fee:0   },
  { value:'cbd',      label:'Nairobi CBD',         fee:100 },
  { value:'environs', label:'Nairobi Environs',    fee:200 },
  { value:'county',   label:'Other Counties',      fee:300 },
];

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function Checkout() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [items, setItems]                       = useState<CartItem[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [step, setStep]                         = useState<CheckoutStep>('summary');
  const [paymentMethod, setPaymentMethod]       = useState<PaymentMethod | null>(null);

  // M-Pesa state
  const [phone, setPhone]                       = useState('');
  const [phoneError, setPhoneError]             = useState('');
  const [pushing, setPushing]                   = useState(false);
  const [, setCheckoutRequestId]                = useState('');
  const [receipt, setReceipt]                   = useState('');
  const [elapsed, setElapsed]                   = useState(0);

  // Pesapal state
  const [pesapalLoading, setPesapalLoading]     = useState(false);
  const [pesapalTrackingId, setPesapalTrackingId] = useState('');

  // Shared state
  const [failMsg, setFailMsg]                   = useState('');
  const [serverError, setServerError]           = useState('');

  const passedZone = (location.state as { deliveryZone?: DeliveryZone } | null)?.deliveryZone;
  const deliveryZone: DeliveryZone = passedZone ?? 'cbd';
  const deliveryFee   = DELIVERY_OPTIONS.find(o => o.value === deliveryZone)!.fee;
  const deliveryLabel = DELIVERY_OPTIONS.find(o => o.value === deliveryZone)!.label;

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    axios.get('/api/cart', authHeaders())
      .then(res => { setItems(res.data); setLoading(false); })
      .catch(() => { setLoading(false); navigate('/cart'); });
  }, []);

  // On return from Pesapal redirect, check URL params
  useEffect(() => {
  const hash = window.location.hash; // e.g. "#/checkout?OrderTrackingId=xxx"
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(queryString);
  const trackingId = params.get('OrderTrackingId');
  if (trackingId) {
    setPesapalTrackingId(trackingId);
    setPaymentMethod('pesapal');
    setStep('waiting');
    startPesapalPolling(trackingId);
  }
}, []);

  useEffect(() => () => {
    if (pollRef.current)    clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tickRef.current)    clearInterval(tickRef.current);
  }, []);

  const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const total    = subtotal + deliveryFee;

  const validatePhone = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').replace(/^0/, '254').replace(/^\+/, '');
    if (!/^254\d{9}$/.test(cleaned)) return 'Enter a valid Safaricom number (07xxxxxxxx)';
    return '';
  };

  // ── M-Pesa payment ─────────────────────────────────────────────────────────
  const handleMpesaPay = async () => {
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError('');
    setPushing(true);
    setServerError('');
    try {
      const passedShipping = (location.state as any)?.shipping ?? {};
      const passedColors   = (location.state as any)?.selectedColors ?? {};
      const passedSizes    = (location.state as any)?.selectedSizes ?? {};

      const res = await axios.post('/api/payments/stk-push', {
        phone,
        amount:         total,
        delivery_zone:  deliveryZone,
        delivery_fee:   deliveryFee,
        shipping:       passedShipping,
        selectedColors: passedColors,
        selectedSizes:  passedSizes,
      }, authHeaders());

      setCheckoutRequestId(res.data.checkoutRequestId);
      setStep('waiting');
      startMpesaPolling(res.data.checkoutRequestId);
    } catch (err: any) {
      setServerError(err.response?.data?.msg || 'Failed to send STK push. Try again.');
    } finally {
      setPushing(false);
    }
  };

  const startMpesaPolling = (reqId: string) => {
    setElapsed(0);
    let seconds = 0;
    tickRef.current = setInterval(() => { seconds++; setElapsed(seconds); }, 1000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/payments/status/${reqId}`, authHeaders());
        const { status, mpesa_receipt } = res.data;
        if (status === 'completed') {
          clearAll(); setReceipt(mpesa_receipt || ''); setStep('success');
          await axios.delete('/api/cart', authHeaders());
        } else if (status === 'failed') {
          clearAll(); setFailMsg(res.data.result_desc || 'Payment was not completed.'); setStep('failed');
        }
      } catch { /* keep polling */ }
    }, 3000);
    timeoutRef.current = setTimeout(async () => {
      clearAll();
      try {
        await axios.get(`/api/payments/query/${reqId}`, authHeaders());
        const res = await axios.get(`/api/payments/status/${reqId}`, authHeaders());
        if (res.data.status === 'completed') {
          setReceipt(res.data.mpesa_receipt || ''); setStep('success');
          await axios.delete('/api/cart', authHeaders());
        } else {
          setFailMsg('Payment timed out. If charged, contact support.'); setStep('failed');
        }
      } catch {
        setFailMsg('Payment timed out. Check your M-Pesa messages.'); setStep('failed');
      }
    }, 90000);
  };

  // ── Pesapal payment ────────────────────────────────────────────────────────
  const handlePesapalPay = async () => {
    setPesapalLoading(true);
    setServerError('');
    try {
      const passedShipping = (location.state as any)?.shipping ?? {};
      const passedColors   = (location.state as any)?.selectedColors ?? {};
      const passedSizes    = (location.state as any)?.selectedSizes ?? {};

      const res = await axios.post('/api/payments/pesapal/initiate', {
        amount:         total,
        delivery_zone:  deliveryZone,
        delivery_fee:   deliveryFee,
        shipping:       passedShipping,
        selectedColors: passedColors,
        selectedSizes:  passedSizes,
      }, authHeaders());

      // Save tracking ID in case user comes back via callback URL
      setPesapalTrackingId(res.data.orderTrackingId);
      localStorage.setItem('pesapal_tracking_id', res.data.orderTrackingId);

      // Redirect customer to Pesapal hosted payment page
      window.location.href = res.data.redirectUrl;
    } catch (err: any) {
      setServerError(err.response?.data?.msg || 'Failed to initiate Pesapal payment. Try again.');
      setPesapalLoading(false);
    }
  };

  // Poll Pesapal status after customer returns from redirect
  const startPesapalPolling = (trackingId: string) => {
    setElapsed(0);
    let seconds = 0;
    tickRef.current = setInterval(() => { seconds++; setElapsed(seconds); }, 1000);
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/payments/pesapal/status/${trackingId}`, authHeaders());
        const { status, confirmation_code } = res.data;
        if (status === 'completed') {
          clearAll(); setReceipt(confirmation_code || ''); setStep('success');
        } else if (status === 'failed') {
          clearAll(); setFailMsg('Payment was not completed.'); setStep('failed');
        }
      } catch { /* keep polling */ }
    }, 3000);
    timeoutRef.current = setTimeout(() => {
      clearAll();
      setFailMsg('Payment status unknown. If you were charged, contact support.'); setStep('failed');
    }, 60000);
  };

  const clearAll = () => {
    if (pollRef.current)    clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (tickRef.current)    clearInterval(tickRef.current);
  };

  if (loading) return (
    <div style={{ background: T.cream, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🛒</div>
      <p style={{ fontFamily: "'Jost',sans-serif", color: T.muted, letterSpacing: '1px', fontSize: 13 }}>Loading your order…</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Playfair Display','Georgia',serif", background: T.cream, minHeight: '100vh', color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Jost:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.cream}}
        .jost{font-family:'Jost',sans-serif}

        .topbar-marquee{display:flex;gap:64px;animation:marquee 28s linear infinite;white-space:nowrap}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

        .ornament{display:flex;align-items:center;gap:14px;margin-bottom:10px}
        .ornament-line{flex:0 0 32px;height:1px;background:${T.gold}}
        .ornament-diamond{width:5px;height:5px;background:${T.gold};transform:rotate(45deg);flex-shrink:0}

        .lp-card{background:#fff;border:1px solid ${T.creamDeep};border-radius:20px;padding:40px 38px;width:100%;max-width:500px;box-shadow:0 20px 60px rgba(13,27,62,0.1)}

        .item-card{display:flex;align-items:center;gap:14px;background:${T.cream};border:1px solid ${T.creamDeep};border-radius:14px;padding:14px 16px;transition:border-color 0.2s}
        .item-card:hover{border-color:${T.gold}}

        .back-btn{background:none;border:none;cursor:pointer;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${T.gold};padding:8px 0;display:flex;align-items:center;gap:8px;transition:opacity 0.2s;margin-bottom:24px}
        .back-btn:hover{opacity:0.7}

        .cta-gold{font-family:'Jost',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;border-radius:8px;padding:16px;width:100%;cursor:pointer;transition:all 0.25s;background:${T.gold};color:${T.navy};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px}
        .cta-gold::before{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.13);transform:translateX(-100%);transition:transform 0.3s}
        .cta-gold:hover:not(:disabled)::before{transform:translateX(0)}
        .cta-gold:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 28px rgba(200,169,81,0.35)}
        .cta-gold:disabled{opacity:0.55;cursor:not-allowed}

        .cta-outline{font-family:'Jost',sans-serif;font-weight:600;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid ${T.creamDeep};border-radius:8px;padding:14px;width:100%;cursor:pointer;transition:all 0.2s;background:#fff;color:${T.navy};margin-top:10px}
        .cta-outline:hover{border-color:${T.gold};background:${T.cream}}

        .cta-navy{font-family:'Jost',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;border-radius:8px;padding:16px;width:100%;cursor:pointer;transition:all 0.25s;background:${T.navy};color:${T.goldLight};margin-top:10px;display:flex;align-items:center;justify-content:center;gap:10px}
        .cta-navy:hover{background:${T.navyLight};transform:translateY(-1px)}

        /* Payment method selector cards */
        .pay-method-card{border-radius:16px;padding:20px 22px;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;gap:16px;width:100%;background:#fff;margin-bottom:12px}
        .pay-method-card:hover{transform:translateY(-2px)}
        .pay-method-card.selected{border:2px solid ${T.gold};background:rgba(200,169,81,0.04)}
        .pay-method-card.unselected{border:1.5px solid ${T.creamDeep}}

        .phone-input{background:${T.cream};border:1.5px solid ${T.creamDeep};border-radius:10px;padding:14px 18px;color:${T.navy};font-size:16px;font-family:'Jost',sans-serif;width:100%;outline:none;transition:border-color 0.2s;letter-spacing:1.5px}
        .phone-input:focus{border-color:${T.gold};background:#fff}
        .phone-input.error{border-color:#C0392B}

        .totals-box{background:${T.cream};border:1px solid ${T.creamDeep};border-radius:14px;padding:18px 20px}
        .trust-badge{flex:1;text-align:center;background:#fff;border:1px solid ${T.creamDeep};border-radius:10px;padding:8px 0;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;color:${T.muted};letter-spacing:0.3px}
        .mpesa-badge{display:flex;align-items:center;gap:12px;background:${T.navy};border:1px solid rgba(200,169,81,0.2);border-radius:14px;padding:14px 18px;margin-bottom:24px}
        .amount-pill{display:flex;flex-direction:column;align-items:center;background:${T.navy};border:1px solid rgba(200,169,81,0.2);border-radius:14px;padding:20px;margin:20px 0;gap:6px}
        .progress-box{background:${T.cream};border:1px solid ${T.creamDeep};border-radius:14px;padding:18px 20px;margin-bottom:20px;text-align:left}
        .step-list{display:flex;flex-direction:column;gap:14px;background:${T.cream};border:1px solid ${T.creamDeep};border-radius:14px;padding:18px 20px;margin-bottom:20px;text-align:left}
        .receipt-box{background:${T.navy};border:1px solid rgba(200,169,81,0.3);border-radius:14px;padding:18px 24px;margin-bottom:20px;text-align:center}
        .status-circle{width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;margin:0 auto 24px}

        /* Divider */
        .or-divider{display:flex;align-items:center;gap:12px;margin:4px 0 16px}
        .or-divider::before,.or-divider::after{content:'';flex:1;height:1px;background:${T.creamDeep}}

        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes checkPop{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
        .fade-in{animation:fadeIn 0.35s ease forwards}
        .check-pop{animation:checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards}
        .pulse-anim{animation:pulse 1.6s ease-in-out infinite}
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{ background: T.navy, height: 34, overflow: 'hidden', display: 'flex', alignItems: 'center', borderBottom: `1px solid rgba(200,169,81,0.2)` }}>
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="topbar-marquee">
            {[...Array(2)].map((_, r) =>
              ['✦ NAIROBI CBD DELIVERY — KSH 100', '✦ NAIROBI ENVIRONS — KSH 200', '✦ OTHER COUNTIES — KSH 300', '✦ FREE PICKUP FROM OUR SHOP', '✦ SECURE M-PESA CHECKOUT', '✦ VISA / MASTERCARD ACCEPTED', '✦ 30-DAY RETURNS'].map((t, i) => (
                <span key={`${r}-${i}`} className="jost" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', color: 'rgba(200,169,81,0.85)' }}>{t}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: T.navy, padding: '0 5%', height: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 4px 32px rgba(13,27,62,0.35)`,
        borderBottom: `1px solid rgba(200,169,81,0.25)`,
      }}>
        <button className="jost" onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gold, fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          ← Cart
        </button>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div className="jost" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase', marginBottom: 3 }}>Secure</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20, color: T.white }}>Checkout</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(['summary', 'choose', 'phone', 'waiting', 'success'] as CheckoutStep[]).map((s) => (
            <div key={s} style={{ width: s === step ? 20 : 6, height: 3, borderRadius: 2, background: s === step ? T.gold : 'rgba(255,255,255,0.18)', transition: 'all 0.3s' }} />
          ))}
        </div>
      </nav>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px 80px', minHeight: 'calc(100vh - 114px)' }}>

        {/* ── STEP: SUMMARY ── */}
        {step === 'summary' && (
          <div className="lp-card fade-in">
            <button className="back-btn" onClick={() => navigate('/cart')}>← Back to Cart</button>
            <div className="ornament">
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Review</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 26, color: T.navy, marginBottom: 4 }}>Your Order</h1>
            <p className="jost" style={{ color: T.muted, fontSize: 13, marginBottom: 28, fontWeight: 300 }}>Review before proceeding to payment</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {items.map(item => (
                <div key={item.id} className="item-card">
                  <div style={{ width: 58, height: 58, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: T.creamMid }}>
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/58x58/${T.creamMid.replace('#','')}/${T.navy.replace('#','')}?text=📦`; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 14, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div className="jost" style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>Qty: {item.quantity}</div>
                  </div>
                  <div className="jost" style={{ fontWeight: 700, fontSize: 15, color: T.gold, flexShrink: 0 }}>
                    KSh {(Number(item.price) * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="totals-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Delivery · <span style={{ color: T.gold }}>{deliveryLabel}</span></span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: deliveryFee === 0 ? '#5A8A5A' : T.navy }}>
                  {deliveryFee === 0 ? 'FREE 🎉' : `KSh ${deliveryFee}`}
                </span>
              </div>
              {deliveryZone === 'pickup' && (
                <div style={{ background: 'rgba(90,138,90,0.08)', border: '1px solid rgba(90,138,90,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                  <p className="jost" style={{ fontSize: 11, color: '#4A7A4A', fontWeight: 500 }}>🏪 You'll collect this order from our shop.</p>
                </div>
              )}
              <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${T.gold},transparent)`, margin: '14px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span className="jost" style={{ fontWeight: 700, fontSize: 14, color: T.navy, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total</span>
                <span className="jost" style={{ fontWeight: 800, fontSize: 22, color: T.navy }}>KSh {total.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {['🔒 Secure', '📱 M-Pesa', '💳 Cards'].map(t => (
                <div key={t} className="trust-badge">{t}</div>
              ))}
            </div>

            <button className="cta-gold" onClick={() => setStep('choose')} style={{ marginTop: 22 }}>
              Choose Payment Method →
            </button>
          </div>
        )}

        {/* ── STEP: CHOOSE PAYMENT METHOD ── */}
        {step === 'choose' && (
          <div className="lp-card fade-in">
            <button className="back-btn" onClick={() => setStep('summary')}>← Back</button>
            <div className="ornament">
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Payment</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 24, color: T.navy, marginBottom: 6 }}>How would you like to pay?</h2>
            <p className="jost" style={{ color: T.muted, fontSize: 13, marginBottom: 28, fontWeight: 300 }}>
              Choose your preferred payment method
            </p>

            {/* M-Pesa option */}
            <div
              className={`pay-method-card ${paymentMethod === 'mpesa' ? 'selected' : 'unselected'}`}
              onClick={() => setPaymentMethod('mpesa')}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: T.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
                border: paymentMethod === 'mpesa' ? `2px solid ${T.gold}` : '2px solid transparent',
              }}>📱</div>
              <div style={{ flex: 1 }}>
                <div className="jost" style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>M-Pesa</div>
                <div className="jost" style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Lipa Na M-Pesa · STK Push to your phone</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: paymentMethod === 'mpesa' ? `6px solid ${T.gold}` : `2px solid ${T.creamDeep}`,
                transition: 'all 0.2s',
              }} />
            </div>

            {/* Pesapal option */}
            <div
              className={`pay-method-card ${paymentMethod === 'pesapal' ? 'selected' : 'unselected'}`}
              onClick={() => setPaymentMethod('pesapal')}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg,#1565C0,#0D47A1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
                border: paymentMethod === 'pesapal' ? `2px solid ${T.gold}` : '2px solid transparent',
              }}>💳</div>
              <div style={{ flex: 1 }}>
                <div className="jost" style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>Credit / Debit Card</div>
                <div className="jost" style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Visa, Mastercard & more · Powered by Pesapal</div>
                {/* Card logos */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {['VISA', 'MC'].map(brand => (
                    <span key={brand} className="jost" style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '1px',
                      padding: '3px 8px', borderRadius: 4,
                      background: brand === 'VISA' ? '#1A1F71' : '#EB001B',
                      color: '#fff',
                    }}>{brand}</span>
                  ))}
                  <span className="jost" style={{ fontSize: 9, color: T.muted, alignSelf: 'center' }}>+ more</span>
                </div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: paymentMethod === 'pesapal' ? `6px solid ${T.gold}` : `2px solid ${T.creamDeep}`,
                transition: 'all 0.2s',
              }} />
            </div>

            {/* Amount summary */}
            <div className="amount-pill" style={{ marginTop: 8 }}>
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase' }}>Amount to pay</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 32, color: T.gold }}>
                KSh {total.toLocaleString()}
              </span>
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                incl. {deliveryFee === 0 ? 'free' : `KSh ${deliveryFee}`} delivery · {deliveryLabel}
              </span>
            </div>

            {serverError && (
              <div className="jost" style={{ background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 10, padding: '12px 16px', color: '#C0392B', fontSize: 12, marginBottom: 16 }}>
                {serverError}
              </div>
            )}

            {/* Continue CTA — changes based on selected method */}
            {paymentMethod === 'mpesa' && (
              <button className="cta-gold" onClick={() => setStep('phone')}>
                📱 Continue with M-Pesa →
              </button>
            )}

            {paymentMethod === 'pesapal' && (
              <button className="cta-gold" onClick={handlePesapalPay} disabled={pesapalLoading}>
                {pesapalLoading
                  ? <><span style={{ display: 'inline-block', animation: 'pulse 0.8s ease infinite' }}>⏳</span> Redirecting to Pesapal…</>
                  : <>💳 Pay KSh {total.toLocaleString()} with Card →</>
                }
              </button>
            )}

            {!paymentMethod && (
              <button className="cta-gold" disabled style={{ opacity: 0.4 }}>
                Select a payment method above
              </button>
            )}

            <p className="jost" style={{ textAlign: 'center', fontSize: 11, color: T.muted, marginTop: 14 }}>
              🔒 All payments are encrypted and secure
            </p>
          </div>
        )}

        {/* ── STEP: PHONE (M-Pesa) ── */}
        {step === 'phone' && (
          <div className="lp-card fade-in">
            <button className="back-btn" onClick={() => setStep('choose')}>← Back</button>

            <div className="mpesa-badge">
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(200,169,81,0.12)', border: `1px solid rgba(200,169,81,0.25)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📱</div>
              <div>
                <div className="jost" style={{ fontWeight: 800, fontSize: 13, color: T.goldLight, letterSpacing: '1px' }}>M-PESA</div>
                <div className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Lipa Na M-Pesa · STK Push</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="jost" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', textTransform: 'uppercase' }}>Powered by</div>
                <div className="jost" style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>Safaricom</div>
              </div>
            </div>

            <div className="ornament">
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>M-Pesa</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 24, color: T.navy, marginBottom: 6 }}>Enter M-Pesa Number</h2>
            <p className="jost" style={{ color: T.muted, fontSize: 13, marginBottom: 28, fontWeight: 300, lineHeight: 1.7 }}>
              A payment prompt will be sent to your phone.<br />Enter your PIN to complete the purchase.
            </p>

            <div style={{ marginBottom: 6 }}>
              <label className="jost" style={{ fontSize: 10, fontWeight: 700, color: T.navy, letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Safaricom Number
              </label>
              <input
                className={`phone-input ${phoneError ? 'error' : ''}`}
                type="tel"
                placeholder="07xx xxx xxx"
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleMpesaPay()}
              />
              {phoneError && <p className="jost" style={{ color: '#C0392B', fontSize: 12, marginTop: 6 }}>{phoneError}</p>}
            </div>

            {serverError && (
              <div className="jost" style={{ background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 10, padding: '12px 16px', color: '#C0392B', fontSize: 12, marginBottom: 16, marginTop: 12 }}>
                {serverError}
              </div>
            )}

            <div className="amount-pill">
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase' }}>Amount to pay</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 32, color: T.gold }}>KSh {total.toLocaleString()}</span>
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                incl. {deliveryFee === 0 ? 'free' : `KSh ${deliveryFee}`} delivery · {deliveryLabel}
              </span>
            </div>

            <button className="cta-gold" onClick={handleMpesaPay} disabled={pushing}>
              {pushing
                ? <><span style={{ display: 'inline-block', animation: 'pulse 0.8s ease infinite' }}>⏳</span> Sending prompt…</>
                : <>📲 Send KSh {total.toLocaleString()} Prompt</>
              }
            </button>
            <p className="jost" style={{ textAlign: 'center', fontSize: 11, color: T.muted, marginTop: 14 }}>
              🔒 Secured by Safaricom · We never store your PIN
            </p>
          </div>
        )}

        {/* ── STEP: WAITING ── */}
        {step === 'waiting' && (
          <div className="lp-card fade-in" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20, display: 'inline-block' }} className="pulse-anim">
              {paymentMethod === 'pesapal' ? '💳' : '📱'}
            </div>

            <div className="ornament" style={{ justifyContent: 'center' }}>
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Processing</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 24, color: T.navy, marginBottom: 10 }}>
              {paymentMethod === 'pesapal' ? 'Confirming Payment…' : 'Check Your Phone'}
            </h2>
            <p className="jost" style={{ color: T.muted, fontSize: 13, maxWidth: 300, margin: '0 auto 28px', lineHeight: 1.75, fontWeight: 300 }}>
              {paymentMethod === 'pesapal'
                ? <>We're confirming your card payment of <strong style={{ color: T.gold, fontWeight: 700 }}>KSh {total.toLocaleString()}</strong>. This usually takes a few seconds.</>
                : <>A prompt was sent to <strong style={{ color: T.navy, fontWeight: 600 }}>{phone}</strong>. Enter your M-Pesa PIN to pay <strong style={{ color: T.gold, fontWeight: 700 }}>KSh {total.toLocaleString()}</strong>.</>
              }
            </p>

            <div className="progress-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 12, color: T.muted }}>Waiting for confirmation…</span>
                <span className="jost" style={{ fontSize: 12, color: T.gold, fontWeight: 700 }}>
                  {elapsed < 60 ? `${60 - elapsed}s` : 'Checking…'}
                </span>
              </div>
              <div style={{ background: T.creamDeep, borderRadius: 8, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 8,
                  background: `linear-gradient(90deg,${T.navy},${T.gold})`,
                  width: `${Math.min((elapsed / 60) * 100, 100)}%`,
                  transition: 'width 1s linear',
                }} />
              </div>
            </div>

            <div className="step-list">
              {(paymentMethod === 'pesapal'
                ? [
                    { done: true,  active: false, text: 'Redirected to Pesapal payment page' },
                    { done: true,  active: false, text: 'Payment submitted' },
                    { done: false, active: true,  text: 'Awaiting confirmation from Pesapal' },
                  ]
                : [
                    { done: true,  active: false, text: 'STK push sent to your phone' },
                    { done: false, active: true,  text: 'Waiting for your PIN entry' },
                    { done: false, active: false, text: 'Payment confirmation' },
                  ]
              ).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: item.done ? T.navy : item.active ? `rgba(200,169,81,0.12)` : T.creamMid,
                    border: item.active ? `2px solid ${T.gold}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: item.done ? T.gold : T.muted,
                    fontFamily: "'Jost',sans-serif", fontWeight: 700,
                  }}>
                    {item.done ? '✓' : i + 1}
                  </div>
                  <span className="jost" style={{ fontSize: 13, color: item.done ? T.navy : item.active ? T.gold : T.muted, fontWeight: item.active ? 600 : 400 }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {paymentMethod === 'mpesa' && (
              <button className="cta-outline" onClick={() => { clearAll(); setStep('phone'); }}>
                Cancel — Try Different Number
              </button>
            )}
          </div>
        )}

        {/* ── STEP: SUCCESS ── */}
        {step === 'success' && (
          <div className="lp-card fade-in" style={{ textAlign: 'center' }}>
            <div className="status-circle check-pop" style={{ background: `rgba(200,169,81,0.1)`, border: `3px solid ${T.gold}` }}>✅</div>

            <div className="ornament" style={{ justifyContent: 'center' }}>
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Confirmed</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 26, color: T.navy, marginBottom: 8 }}>Payment Successful!</h2>
            <p className="jost" style={{ color: T.muted, fontSize: 13, marginBottom: 28, fontWeight: 300, lineHeight: 1.7 }}>
              Your order has been placed.<br />Thank you for shopping with Luku Prime!
            </p>

            {receipt && (
              <div className="receipt-box">
                <div className="jost" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 8 }}>
                  {paymentMethod === 'pesapal' ? 'Pesapal Confirmation' : 'M-Pesa Receipt'}
                </div>
                <div className="jost" style={{ fontWeight: 800, fontSize: 24, color: T.gold, letterSpacing: '3px' }}>{receipt}</div>
              </div>
            )}

            <div className="totals-box" style={{ textAlign: 'left', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Delivery · <span style={{ color: T.gold }}>{deliveryLabel}</span></span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: deliveryFee === 0 ? '#5A8A5A' : T.navy }}>
                  {deliveryFee === 0 ? 'FREE' : `KSh ${deliveryFee}`}
                </span>
              </div>
              <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${T.gold},transparent)`, margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Paid</span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>KSh {total.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Payment method</span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>
                  {paymentMethod === 'pesapal' ? '💳 Card (Pesapal)' : `📱 M-Pesa · ${phone}`}
                </span>
              </div>
            </div>

            <button className="cta-gold" onClick={() => navigate('/')}>🛍️ Continue Shopping →</button>
            <button className="cta-navy" onClick={() => navigate('/orders')}>📦 View My Orders</button>
          </div>
        )}

        {/* ── STEP: FAILED ── */}
        {step === 'failed' && (
          <div className="lp-card fade-in" style={{ textAlign: 'center' }}>
            <div className="status-circle check-pop" style={{ background: '#FDF0EE', border: '3px solid #C0392B' }}>❌</div>

            <div className="ornament" style={{ justifyContent: 'center' }}>
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: '#C0392B', textTransform: 'uppercase' }}>Failed</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 24, color: '#C0392B', marginBottom: 8 }}>Payment Failed</h2>
            <p className="jost" style={{ color: T.muted, fontSize: 13, maxWidth: 300, margin: '0 auto 32px', lineHeight: 1.75, fontWeight: 300 }}>
              {failMsg || 'The payment was cancelled or not completed. Your cart is saved.'}
            </p>

            <button className="cta-gold" onClick={() => { setStep('choose'); setServerError(''); setFailMsg(''); }}>
              🔄 Try Again
            </button>
            <button className="cta-outline" onClick={() => navigate('/cart')}>← Back to Cart</button>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: T.navy, borderTop: `1px solid rgba(200,169,81,0.2)` }}>
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent 0%,${T.gold} 30%,${T.goldLight} 50%,${T.gold} 70%,transparent 100%)` }} />
        <div style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: T.white }}>
            Luku <span style={{ color: T.gold }}>Prime</span>
          </div>
          <div className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>© 2025 Luku Prime · All rights reserved</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Help'].map(l => (
              <span key={l} className="jost" style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.goldLight)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}