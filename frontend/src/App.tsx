// src/App.tsx
import { HashRouter as Router, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

// ── Pages ──────────────────────────────────────────────────────────────────────
import Homepage       from './pages/Homepage';
import Register       from './pages/Register';
import Login          from './pages/Login';
import Cart           from './pages/Cart';
import Checkout       from './pages/Checkout';
import ProductDetail  from './pages/ProductDetail';
import Orders         from './pages/Orders';
import Wishlist       from './pages/Wishlist';
import Reviews        from './pages/Reviews';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';

// ── Admin ──────────────────────────────────────────────────────────────────────
import AdminDashboard from './pages/admin/AdminDashboard';

// ── Category Pages ─────────────────────────────────────────────────────────────
import Dresses      from './pages/categories/Dresses';
import NewArrivals  from './pages/categories/NewArrivals';
import Sneakers     from './pages/categories/Sneakers';
import Bags         from './pages/categories/Bags';
import BestSellers  from './pages/categories/BestSellers';
import DesignerWear from './pages/categories/DesignerWear';
import Shoes        from './pages/categories/Shoes';
import Heels        from './pages/categories/Heels';

// ── Components ─────────────────────────────────────────────────────────────────
import FloatingCart from './components/common/FloatingCart';
import ScrollToTop  from './components/common/ScrollToTop';

// ── Support Pages ──────────────────────────────────────────────────────────────
import TrackOrder from './pages/support/TrackOrder';
import Returns    from './pages/support/Returns';
import Delivery   from './pages/support/Delivery';
import SizeGuide  from './pages/support/SizeGuide';
import FAQs       from './pages/support/FAQs';
import Contact    from './pages/support/Contact';

// ── Company Pages ──────────────────────────────────────────────────────────────
import About   from './pages/company/About';
import Careers from './pages/company/Careers';
import Press   from './pages/company/Press';

// ── Legal Pages ────────────────────────────────────────────────────────────────
import Privacy from './pages/legal/Privacy';
import Terms   from './pages/legal/Terms';
import Cookies from './pages/legal/Cookies';

// ── Global axios config ────────────────────────────────────────────────────────
// withCredentials: true means axios automatically sends the httpOnly cookie
// on every request without you needing to pass it manually anywhere.
axios.defaults.withCredentials = true;

// ─── Auth helpers ──────────────────────────────────────────────────────────────
// We no longer check for a token in localStorage (it doesn't exist there anymore).
// We only check for the user object, which holds safe UI data (name, role, avatar).
// The actual authentication is enforced server-side via the httpOnly cookie.

const getUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

// isAuthenticated now just checks if we have a user object stored.
// If the cookie has expired, the next API call will return 401 and the
// error handler will redirect to /login — no need to decode the JWT here.
const isAuthenticated = () => !!getUser();

// ─── Route Guards ──────────────────────────────────────────────────────────────

/** Redirect logged-in verified users away from auth pages */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (isAuthenticated() && user?.is_verified) {
    return user?.role === 'admin'
      ? <Navigate to="/admin" replace />
      : <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

/** Admins only */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Logged-in buyers only — admins are redirected to /admin */
function BuyerRoute({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

// ─── Global 401 interceptor ───────────────────────────────────────────────────
// If any API call returns 401 (cookie expired or missing), automatically
// clear the stale user object and redirect to login.
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.hash = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── FloatingCart wrapper ──────────────────────────────────────────────────────
function FloatingCartManager() {
  const [cartCount, setCartCount] = useState(0);
  const { pathname } = useLocation();

  const allowedPaths    = ['/', '/wishlist', '/orders'];
  const allowedPrefixes = ['/categories/', '/product/'];

  const shouldShow =
    allowedPaths.includes(pathname) ||
    allowedPrefixes.some(prefix => pathname.startsWith(prefix));

  const fetchCount = () => {
    const user = getUser();
    // Don't fetch cart for unauthenticated users or admins
    if (!user || user.role === 'admin') { setCartCount(0); return; }
    // Cookie is sent automatically via axios.defaults.withCredentials = true
    axios.get('/api/cart')
      .then(r => setCartCount(r.data.reduce((s: number, i: any) => s + i.quantity, 0)))
      .catch(() => setCartCount(0));
  };

  useEffect(() => {
    fetchCount();
    window.addEventListener('cartUpdated', fetchCount);
    window.addEventListener('focus',       fetchCount);
    return () => {
      window.removeEventListener('cartUpdated', fetchCount);
      window.removeEventListener('focus',       fetchCount);
    };
  }, []);

  if (!shouldShow) return null;

  return <FloatingCart count={cartCount} />;
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // clearIfExpired() is removed — the server handles cookie expiry automatically.
  // When the cookie expires, the next API call returns 401 and the interceptor
  // above clears localStorage and redirects to /login.

  return (
    <Router>
      <ScrollToTop />
      <FloatingCartManager />

      <Routes>

        {/* ── Public ─────────────────────────────────────────────────────────── */}
        <Route path="/"            element={<Homepage />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* ── Categories ──────────────────────────────────────────────────────── */}
        <Route path="/categories/dresses"       element={<Dresses />} />
        <Route path="/categories/new-arrivals"  element={<NewArrivals />} />
        <Route path="/categories/sneakers"      element={<Sneakers />} />
        <Route path="/categories/bags"          element={<Bags />} />
        <Route path="/categories/best-sellers"  element={<BestSellers />} />
        <Route path="/categories/designer-wear" element={<DesignerWear />} />
        <Route path="/categories/shoes"         element={<Shoes />} />
        <Route path="/categories/heels"         element={<Heels />} />

        {/* ── Support ─────────────────────────────────────────────────────────── */}
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/returns"     element={<Returns />} />
        <Route path="/delivery"    element={<Delivery />} />
        <Route path="/size-guide"  element={<SizeGuide />} />
        <Route path="/faqs"        element={<FAQs />} />
        <Route path="/contact"     element={<Contact />} />

        {/* ── Company ─────────────────────────────────────────────────────────── */}
        <Route path="/about"   element={<About />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/press"   element={<Press />} />

        {/* ── Legal ───────────────────────────────────────────────────────────── */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms"   element={<Terms />} />
        <Route path="/cookies" element={<Cookies />} />

        {/* ── Auth (guests only) ──────────────────────────────────────────────── */}
        <Route path="/register"              element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/login"                 element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/forgot-password"       element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />

        {/* ── Buyer only ──────────────────────────────────────────────────────── */}
        <Route path="/cart"     element={<BuyerRoute><Cart /></BuyerRoute>} />
        <Route path="/checkout" element={<BuyerRoute><Checkout /></BuyerRoute>} />
        <Route path="/orders"   element={<BuyerRoute><Orders /></BuyerRoute>} />
        <Route path="/wishlist" element={<BuyerRoute><Wishlist /></BuyerRoute>} />
        <Route path="/reviews"  element={<BuyerRoute><Reviews /></BuyerRoute>} />

        {/* ── Email verification ──────────────────────────────────────────────── */}
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* ── Admin only ──────────────────────────────────────────────────────── */}
        <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/overview" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/orders"   element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* ── 404 ─────────────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

// ─── Email Verification Page ───────────────────────────────────────────────────
function VerifyEmail() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const hasCalled = useRef(false);
  const [status,  setStatus]  = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;
    axios.get(`/api/auth/verify/${token}`)
      .then(res => {
        setStatus('success');
        setMessage(res.data.msg || 'Email verified!');
        setTimeout(() => navigate('/login?verified=true'), 2200);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.msg || 'Verification failed. Link may have expired.');
      });
  }, [token, navigate]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#FBF6F0', fontFamily: "'DM Sans', sans-serif",
  };
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 20, padding: '48px 40px', textAlign: 'center',
    maxWidth: 400, width: '100%', boxShadow: '0 8px 32px rgba(44,26,14,0.1)',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {status === 'loading' && <><div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div><p style={{ color: '#5C3D1E', fontWeight: 600 }}>Verifying your email…</p></>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: '#2C1A0E', marginBottom: 8, fontFamily: 'Lora, serif' }}>Email Verified!</h2>
            <p style={{ color: '#9C7A60', fontSize: 14 }}>{message}</p>
            <p style={{ color: '#C4703A', fontSize: 13, marginTop: 12 }}>Redirecting to login…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: '#2C1A0E', marginBottom: 8, fontFamily: 'Lora, serif' }}>Link Expired</h2>
            <p style={{ color: '#9C7A60', fontSize: 14 }}>{message}</p>
            <button onClick={() => navigate('/login')} style={{ marginTop: 20, background: '#C4703A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 404 Not Found ─────────────────────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF6F0', fontFamily: "'DM Sans', sans-serif", flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 72 }}>🌿</div>
      <h1 style={{ fontFamily: 'Lora, serif', fontSize: 32, color: '#2C1A0E' }}>Page Not Found</h1>
      <p style={{ color: '#9C7A60', fontSize: 15 }}>The page you're looking for doesn't exist.</p>
      <button onClick={() => navigate('/')} style={{ background: '#C4703A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 600, cursor: 'pointer', fontSize: 14, marginTop: 8 }}>
        Back to Homepage
      </button>
    </div>
  );
}