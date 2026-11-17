import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Landing handler for Meta checkout links: /meta-checkout?products=172-5%3A2%2C163%3A1&coupon=CODE
// The app uses HashRouter, so the real query string is read from window.location.search.
const PENDING_KEY = 'pw_meta_pending';

const getUser = () => {
  try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
};

const cleanUrl = () => {
  if (window.location.search) window.history.replaceState({}, '', '/' + window.location.hash);
};

const fmt = (n: number) => 'KSh ' + Number(n).toLocaleString('en-KE');

// A discount code counts as valid only if supplying it changes the server's discount preview.
const discountCodeApplies = async (code: string): Promise<boolean> => {
  try {
    const opts = { headers: { 'X-Skip-Auth-Redirect': 'true' } };
    const [withCode, without] = await Promise.all([
      axios.get('/api/discount/preview?discount_code=' + encodeURIComponent(code), opts),
      axios.get('/api/discount/preview', opts),
    ]);
    return withCode.data.discountType !== without.data.discountType
      || Number(withCode.data.discountAmount) !== Number(without.data.discountAmount);
  } catch { return false; }
};

interface PreviewItem {
  id: string; name: string; image_url?: string; color?: string | null; size?: string | null;
  unit_price: number; quantity: number; line_total: number;
}

export default function MetaCheckoutGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const running  = useRef(false);
  const [state, setState]     = useState<'idle' | 'working' | 'guest' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<{ items: PreviewItem[]; subtotal: number } | null>(null);

  // 1. Capture the link once. Logged-in users get the URL cleaned right away;
  //    guests keep it until they continue, so the page stays a valid checkout URL.
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const products = params.get('products');
    if (products) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ products, coupon: params.get('coupon') || undefined }));
      if (getUser()) cleanUrl();
    }
  }, []);

  // 2. Resume whenever the route changes (covers the return from /login).
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw || running.current) return;

    let pending: { products: string; coupon?: string };
    try { pending = JSON.parse(raw); } catch { sessionStorage.removeItem(PENDING_KEY); return; }

    const user = getUser();

    // ---- Guest: show a read-only preview instead of bouncing to /login ----
    if (!user) {
      if (['/login', '/register'].includes(location.pathname)) { setState('idle'); return; }
      running.current = true;
      setState('working');
      (async () => {
        try {
          const { data } = await axios.get('/api/cart/meta-checkout-preview', {
            params: { products: pending.products },
            headers: { 'X-Skip-Auth-Redirect': 'true' },
          });
          setPreview({ items: data.items, subtotal: data.subtotal });
          setState('guest');
        } catch (err: any) {
          setMessage(err?.response?.data?.msg || 'We could not load your cart from that link.');
          setState('error');
        } finally {
          running.current = false;
        }
      })();
      return;
    }

    if (user.role === 'admin') { sessionStorage.removeItem(PENDING_KEY); cleanUrl(); return; }

    // ---- Logged in: fill the real cart (unchanged) ----
    running.current = true;
    setState('working');
    (async () => {
      try {
        const { data } = await axios.post('/api/cart/meta-checkout', pending);
        if (data.affiliate_code) sessionStorage.setItem('luku_coupon', data.affiliate_code);
        if (data.coupon && await discountCodeApplies(data.coupon)) {
          sessionStorage.setItem('luku_discount_code', data.coupon);
        }
        sessionStorage.removeItem(PENDING_KEY);
        cleanUrl();
        window.dispatchEvent(new Event('cartUpdated'));
        setState('idle');
        navigate('/cart', { replace: true });
      } catch (err: any) {
        // 401: the global interceptor sends them to /login; the pending link is kept and resumes after login.
        if (err?.response?.status === 401) { setState('idle'); return; }
        sessionStorage.removeItem(PENDING_KEY);
        cleanUrl();
        setMessage(err?.response?.data?.msg || 'We could not load your cart from that link.');
        setState('error');
      } finally {
        running.current = false;
      }
    })();
  }, [location.pathname]);

  if (state === 'idle') return null;

  const wrap: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 16, padding: 24, fontFamily: "'DM Sans',sans-serif",
  };
  const btn: React.CSSProperties = {
    background: '#000', color: '#fff', border: 'none', padding: '12px 28px',
    fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
  };

  if (state === 'working') {
    return <div style={wrap}><p style={{ color: '#888', letterSpacing: '1px', fontSize: 13 }}>Preparing your cart…</p></div>;
  }

  if (state === 'guest' && preview) {
    return (
      <div style={wrap}>
        <h2 style={{ fontSize: 14, letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>Your Items</h2>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {preview.items.map((it) => (
            <div key={it.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid #eee' }}>
              {it.image_url && <img src={it.image_url} alt={it.name} style={{ width: 64, height: 80, objectFit: 'cover' }} />}
              <div style={{ flex: 1, fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{it.name}</div>
                <div style={{ color: '#888' }}>{[it.color, it.size].filter(Boolean).join(' / ')}</div>
                <div style={{ color: '#888' }}>Qty {it.quantity} × {fmt(it.unit_price)}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(it.line_total)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: 14, fontWeight: 700 }}>
            <span>Subtotal</span><span>{fmt(preview.subtotal)}</span>
          </div>
        </div>
        <button style={btn} onClick={() => navigate('/login')}>Continue to checkout</button>
        <button
          style={{ ...btn, background: 'transparent', color: '#000' }}
          onClick={() => { sessionStorage.removeItem(PENDING_KEY); cleanUrl(); setState('idle'); navigate('/', { replace: true }); }}
        >
          Keep shopping
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <p style={{ color: '#C0392B', fontSize: 14, maxWidth: 320, textAlign: 'center' }}>{message}</p>
      <button style={btn} onClick={() => { setState('idle'); navigate('/cart', { replace: true }); }}>Go to cart</button>
    </div>
  );
}