import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Landing handler for Meta checkout links: /meta-checkout?products=172-5%3A2%2C163%3A1&coupon=CODE
// The app uses HashRouter, so the real query string is read from window.location.search.
const PENDING_KEY = 'pw_meta_pending';
const getUser = () => {
  try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
};
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
export default function MetaCheckoutGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const running  = useRef(false);
  const [state, setState]     = useState<'idle' | 'working' | 'error'>('idle');
  const [message, setMessage] = useState('');
  // 1. Capture the link once, then clean the URL so a refresh can't replay it.
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const products = params.get('products');
    if (products) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ products, coupon: params.get('coupon') || undefined }));
      window.history.replaceState({}, '', '/' + window.location.hash);
    }
  }, []);
  // 2. Resume whenever the route changes (covers the return from /login).
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw || running.current) return;
    const user = getUser();
    if (!user) {
      if (!['/login', '/register'].includes(location.pathname)) navigate('/login', { replace: true });
      return;
    }
    if (user.role === 'admin') { sessionStorage.removeItem(PENDING_KEY); return; }
    let pending: { products: string; coupon?: string };
    try { pending = JSON.parse(raw); } catch { sessionStorage.removeItem(PENDING_KEY); return; }
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
        window.dispatchEvent(new Event('cartUpdated'));
        setState('idle');
        navigate('/cart', { replace: true });
      } catch (err: any) {
        // 401: the global interceptor sends them to /login; the pending link is kept and resumes after login.
        if (err?.response?.status === 401) { setState('idle'); return; }
        sessionStorage.removeItem(PENDING_KEY);
        setMessage(err?.response?.data?.msg || 'We could not load your cart from that link.');
        setState('error');
      } finally {
        running.current = false;
      }
    })();
  }, [location.pathname]);
  if (state === 'idle') return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'DM Sans',sans-serif" }}>
      {state === 'working' ? (
        <p style={{ color: '#888', letterSpacing: '1px', fontSize: 13 }}>Preparing your cart…</p>
      ) : (
        <>
          <p style={{ color: '#C0392B', fontSize: 14, maxWidth: 320, textAlign: 'center' }}>{message}</p>
          <button onClick={() => { setState('idle'); navigate('/cart', { replace: true }); }}
            style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 28px', fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' }}>
            Go to cart
          </button>
        </>
      )}
    </div>
  );
}