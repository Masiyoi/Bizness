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
  navy:     '#000000',
  navyMid:  '#111111',
  navyLight:'#1A1A1A',
  gold:     '#000000',
  goldLight:'#333333',
  goldPale: '#555555',
  cream:    '#FFFFFF',
  creamMid: '#F5F5F5',
  creamDeep:'#E0E0E0',
  white:    '#FFFFFF',
  text:     '#000000',
  muted:    '#888888',
};

const DELIVERY_OPTIONS: { value: DeliveryZone; label: string; fee: number }[] = [
  { value:'pickup',   label:'Pick Up from Shop',  fee:0   },
  { value:'cbd',      label:'Nairobi CBD',         fee:100 },
  { value:'environs', label:'Nairobi Environs',    fee:200 },
  { value:'county',   label:'Other Counties',      fee:300 },
];

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
  const [flashSaleMap, setFlashSaleMap]         = useState<Record<number, number>>({});

  const passedZone = (location.state as { deliveryZone?: DeliveryZone } | null)?.deliveryZone;
  const deliveryZone: DeliveryZone = passedZone ?? 'cbd';
  const deliveryFee   = DELIVERY_OPTIONS.find(o => o.value === deliveryZone)!.fee;
  const deliveryLabel = DELIVERY_OPTIONS.find(o => o.value === deliveryZone)!.label;

  const user = localStorage.getItem('user');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get('/api/cart')
      .then(res => { setItems(res.data); setLoading(false); })
      .catch(() => { setLoading(false); navigate('/cart'); });

    axios.get('/api/products/flash-sales?limit=100')
      .then(r => {
        const map: Record<number, number> = {};
        (r.data as { id: number; sale_price: number }[]).forEach(p => {
          map[p.id] = p.sale_price;
        });
        setFlashSaleMap(map);
      })
      .catch(() => {});
  }, []);

  // Returns the active price for an item — sale price if flash-sale, else regular price
  const getEffectivePrice = (item: CartItem): number =>
    flashSaleMap[item.product_id] ?? Number(item.price);

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

  const subtotal = items.reduce((s, i) => s + getEffectivePrice(i) * i.quantity, 0);
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
      });

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
        const res = await axios.get(`/api/payments/status/${reqId}`);
        const { status, mpesa_receipt } = res.data;
        if (status === 'completed') {
          clearAll(); setReceipt(mpesa_receipt || ''); setStep('success');
          await axios.delete('/api/cart');
        } else if (status === 'failed') {
          clearAll(); setFailMsg(res.data.result_desc || 'Payment was not completed.'); setStep('failed');
        }
      } catch { /* keep polling */ }
    }, 3000);
    timeoutRef.current = setTimeout(async () => {
      clearAll();
      try {
        await axios.get(`/api/payments/query/${reqId}`);
        const res = await axios.get(`/api/payments/status/${reqId}`);
        if (res.data.status === 'completed') {
          setReceipt(res.data.mpesa_receipt || ''); setStep('success');
          await axios.delete('/api/cart');
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
      });

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
        const res = await axios.get(`/api/payments/pesapal/status/${trackingId}`);
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
      <p style={{ fontFamily: "'DM Sans',sans-serif", color: '#888', letterSpacing: '1px', fontSize: 13 }}>Loading your order…</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: T.cream, minHeight: '100vh', color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:${T.cream}}
        .jost{font-family:'DM Sans',sans-serif}

        .topbar-marquee{display:flex;gap:64px;animation:marquee 28s linear infinite;white-space:nowrap}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

        .ornament{display:flex;align-items:center;gap:14px;margin-bottom:10px}
        .ornament-line{flex:0 0 32px;height:1px;background:#000}
        .ornament-diamond{width:5px;height:5px;background:#000;transform:rotate(45deg);flex-shrink:0}

        .lp-card{background:#fff;border:1px solid #E0E0E0;border-radius:0;padding:40px 38px;width:100%;max-width:500px;box-shadow:0 4px 24px rgba(0,0,0,0.06)}

        .item-card{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #E0E0E0;border-radius:0;padding:14px 16px;transition:border-color 0.2s}
        .item-card:hover{border-color:#000}

        .back-btn{background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#000;padding:8px 0;display:flex;align-items:center;gap:8px;transition:opacity 0.2s;margin-bottom:24px}
        .back-btn:hover{opacity:0.7}

        .cta-gold{font-family:'DM Sans',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:none;border-radius:0;padding:16px;width:100%;cursor:pointer;transition:all 0.25s;background:#000;color:#fff;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:10px}
        .cta-gold::before{content:'';position:absolute;inset:0;background:rgba(255,255,255,0.13);transform:translateX(-100%);transition:transform 0.3s}
        .cta-gold:hover:not(:disabled)::before{transform:translateX(0)}
        .cta-gold:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.18)}
        .cta-gold:disabled{opacity:0.55;cursor:not-allowed}

        .cta-outline{font-family:'DM Sans',sans-serif;font-weight:600;font-size:11px;letter-spacing:2px;text-transform:uppercase;border:1px solid #E0E0E0;border-radius:0;padding:14px;width:100%;cursor:pointer;transition:all 0.2s;background:#fff;color:#000;margin-top:10px}
        .cta-outline:hover{border-color:#000;background:#F5F5F5}

        .cta-navy{font-family:'DM Sans',sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;border:1px solid #000;border-radius:0;padding:16px;width:100%;cursor:pointer;transition:all 0.25s;background:#fff;color:#000;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:10px}
        .cta-navy:hover{background:#F5F5F5;transform:translateY(-1px)}

        /* Payment method selector cards */
        .pay-method-card{border-radius:0;padding:20px 22px;cursor:pointer;transition:all 0.25s;display:flex;align-items:center;gap:16px;width:100%;background:#fff;margin-bottom:12px}
        .pay-method-card:hover{transform:translateY(-2px)}
        .pay-method-card.selected{border:2px solid #000;background:#F5F5F5}
        .pay-method-card.unselected{border:1.5px solid #E0E0E0}

        .phone-input{background:#fff;border:1.5px solid #E0E0E0;border-radius:0;padding:14px 18px;color:#000;font-size:16px;font-family:'DM Sans',sans-serif;width:100%;outline:none;transition:border-color 0.2s;letter-spacing:1.5px}
        .phone-input:focus{border-color:#000;background:#fff}
        .phone-input.error{border-color:#C0392B}

        .totals-box{background:#F5F5F5;border:1px solid #E0E0E0;border-radius:0;padding:18px 20px}
        .trust-badge{flex:1;text-align:center;background:#fff;border:1px solid #E0E0E0;border-radius:0;padding:8px 0;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;color:#888;letter-spacing:0.3px}
        .mpesa-badge{display:flex;align-items:center;gap:12px;background:#000;border:1px solid #333;border-radius:0;padding:14px 18px;margin-bottom:24px}
        .amount-pill{display:flex;flex-direction:column;align-items:center;background:#000;border:1px solid #333;border-radius:0;padding:20px;margin:20px 0;gap:6px}
        .progress-box{background:#F5F5F5;border:1px solid #E0E0E0;border-radius:0;padding:18px 20px;margin-bottom:20px;text-align:left}
        .step-list{display:flex;flex-direction:column;gap:14px;background:#F5F5F5;border:1px solid #E0E0E0;border-radius:0;padding:18px 20px;margin-bottom:20px;text-align:left}
        .receipt-box{background:#000;border:1px solid #333;border-radius:0;padding:18px 24px;margin-bottom:20px;text-align:center}
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
      <div style={{ background: '#000', height: 34, overflow: 'hidden', display: 'flex', alignItems: 'center', borderBottom: '1px solid #222' }}>
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="topbar-marquee">
            {[...Array(2)].map((_, r) =>
              ['✦ NAIROBI CBD DELIVERY — KSH 100', '✦ NAIROBI ENVIRONS — KSH 200', '✦ OTHER COUNTIES — KSH 300', '✦ FREE PICKUP FROM OUR SHOP', '✦ SECURE M-PESA CHECKOUT', '✦ VISA / MASTERCARD ACCEPTED', '✦ 30-DAY RETURNS'].map((t, i) => (
                <span key={`${r}-${i}`} className="jost" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>{t}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: '#000', padding: '0 5%', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        borderBottom: '1px solid #222',
      }}>
        <button className="jost" onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
          ← Cart
        </button>
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div className="jost" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '3px', color: '#888', textTransform: 'uppercase', marginBottom: 3 }}>Secure</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, color: '#fff' }}>Checkout</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {(['summary', 'choose', 'phone', 'waiting', 'success'] as CheckoutStep[]).map((s) => (
            <div key={s} style={{ width: s === step ? 20 : 6, height: 3, borderRadius: 2, background: s === step ? '#fff' : 'rgba(255,255,255,0.25)', transition: 'all 0.3s' }} />
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
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 26, color: T.navy, marginBottom: 4 }}>Your Order</h1>
            <p className="jost" style={{ color: T.muted, fontSize: 13, marginBottom: 28, fontWeight: 300 }}>Review before proceeding to payment</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {items.map(item => (
                <div key={item.id} className="item-card">
                  <div style={{ width: 58, height: 58, borderRadius: 0, overflow: 'hidden', flexShrink: 0, background: '#F5F5F5' }}>
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/58x58/${T.creamMid.replace('#','')}/${T.navy.replace('#','')}?text=📦`; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: 14, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div className="jost" style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {(() => {
                      const effectivePrice = getEffectivePrice(item);
                      const onSale = flashSaleMap[item.product_id] !== undefined;
                      return (
                        <>
                          <div className="jost" style={{ fontWeight: 700, fontSize: 15, color: onSale ? '#C2410C' : T.gold }}>
                            KSh {(effectivePrice * item.quantity).toLocaleString()}
                          </div>
                          {onSale && (
                            <div className="jost" style={{ fontSize: 11, color: T.muted, textDecoration: 'line-through', marginTop: 2 }}>
                              KSh {(Number(item.price) * item.quantity).toLocaleString()}
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Delivery · <span style={{ color: '#000' }}>{deliveryLabel}</span></span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: deliveryFee === 0 ? '#5A8A5A' : T.navy }}>
                  {deliveryFee === 0 ? 'FREE 🎉' : `KSh ${deliveryFee}`}
                </span>
              </div>
              {deliveryZone === 'pickup' && (
                <div style={{ background: 'rgba(90,138,90,0.08)', border: '1px solid rgba(90,138,90,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                  <p className="jost" style={{ fontSize: 11, color: '#4A7A4A', fontWeight: 500 }}>🏪 You'll collect this order from our shop.</p>
                </div>
              )}
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#000,transparent)', margin: '14px 0' }} />
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
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 24, color: T.navy, marginBottom: 6 }}>How would you like to pay?</h2>
            <p className="jost" style={{ color: T.muted, fontSize: 13, marginBottom: 28, fontWeight: 300 }}>
              Choose your preferred payment method
            </p>

            {/* M-Pesa option */}
            <div
              className={`pay-method-card ${paymentMethod === 'mpesa' ? 'selected' : 'unselected'}`}
              onClick={() => setPaymentMethod('mpesa')}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 0, background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
                border: paymentMethod === 'mpesa' ? '2px solid #000' : '2px solid #E0E0E0',
              }}>📱</div>
              <div style={{ flex: 1 }}>
                <div className="jost" style={{ fontWeight: 700, fontSize: 14, color: T.navy }}>M-Pesa</div>
                <div className="jost" style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>Lipa Na M-Pesa · STK Push to your phone</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: paymentMethod === 'mpesa' ? '6px solid #000' : '2px solid #E0E0E0',
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
                border: paymentMethod === 'pesapal' ? '2px solid #000' : '2px solid transparent',
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
                border: paymentMethod === 'pesapal' ? '6px solid #000' : '2px solid #E0E0E0',
                transition: 'all 0.2s',
              }} />
            </div>

            {/* Amount summary */}
            <div className="amount-pill" style={{ marginTop: 8 }}>
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '2px', textTransform: 'uppercase' }}>Amount to pay</span>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: '#fff' }}>
                KSh {total.toLocaleString()}
              </span>
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
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
                <div className="jost" style={{ fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: '1px' }}>M-PESA</div>
                <div className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Lipa Na M-Pesa · STK Push</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="jost" style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', letterSpacing: '1px', textTransform: 'uppercase' }}>Powered by</div>
                <div className="jost" style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Safaricom</div>
              </div>
            </div>

            <div className="ornament">
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>M-Pesa</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 24, color: T.navy, marginBottom: 6 }}>Enter M-Pesa Number</h2>
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
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '2px', textTransform: 'uppercase' }}>Amount to pay</span>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: '#fff' }}>KSh {total.toLocaleString()}</span>
              <span className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
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
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 24, color: T.navy, marginBottom: 10 }}>
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
              <div style={{ background: '#E0E0E0', borderRadius: 0, height: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 8,
                  background: 'linear-gradient(90deg,#333,#000)',
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
                    background: item.done ? '#000' : item.active ? '#F0F0F0' : '#F5F5F5',
                    border: item.active ? '2px solid #000' : '1px solid #E0E0E0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: item.done ? '#fff' : '#888',
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 700,
                  }}>
                    {item.done ? '✓' : i + 1}
                  </div>
                  <span className="jost" style={{ fontSize: 13, color: item.done ? '#000' : item.active ? '#000' : '#888', fontWeight: item.active ? 600 : 400 }}>
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
            <div className="status-circle check-pop" style={{ background: '#F5F5F5', border: '3px solid #000' }}>✅</div>

            <div className="ornament" style={{ justifyContent: 'center' }}>
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Confirmed</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 26, color: T.navy, marginBottom: 8 }}>Payment Successful!</h2>
            <p className="jost" style={{ color: T.muted, fontSize: 13, marginBottom: 28, fontWeight: 300, lineHeight: 1.7 }}>
              Your order has been placed.<br />Thank you for shopping with Luku Prime!
            </p>

            {receipt && (
              <div className="receipt-box">
                <div className="jost" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 8 }}>
                  {paymentMethod === 'pesapal' ? 'Pesapal Confirmation' : 'M-Pesa Receipt'}
                </div>
                <div className="jost" style={{ fontWeight: 800, fontSize: 24, color: '#fff', letterSpacing: '3px' }}>{receipt}</div>
              </div>
            )}

            <div className="totals-box" style={{ textAlign: 'left', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Delivery · <span style={{ color: '#000' }}>{deliveryLabel}</span></span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: deliveryFee === 0 ? '#5A8A5A' : T.navy }}>
                  {deliveryFee === 0 ? 'FREE' : `KSh ${deliveryFee}`}
                </span>
              </div>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#000,transparent)', margin: '12px 0' }} />
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
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 24, color: '#C0392B', marginBottom: 8 }}>Payment Failed</h2>
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
      <footer style={{ background: '#000', borderTop: '1px solid #222' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent 0%,#fff 30%,#ccc 50%,#fff 70%,transparent 100%)' }} />
        <div style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>
            Luku <span style={{ color: '#ccc' }}>Prime</span>
          </div>
          <div className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>© 2025 Luku Prime · All rights reserved</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Help'].map(l => (
              <span key={l} className="jost" style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
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
