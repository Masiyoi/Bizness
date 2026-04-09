import { HashRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

import Homepage       from './pages/Homepage';
import Register       from './pages/Register';
import Login          from './pages/Login';
import Cart           from './pages/Cart';
import Checkout       from './pages/Checkout';
import ProductDetail  from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import Orders         from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Reviews from './pages/Reviews';

// ─── Auth helpers ─────────────────────────────────────────────────────────────
const isAuthenticated = () => !!localStorage.getItem('token');

const getUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

// ─── Clear expired tokens on app load ────────────────────────────────────────
const clearIfExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ─── GuestRoute ───────────────────────────────────────────────────────────────
function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (isAuthenticated() && user?.is_verified) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

// ─── AdminRoute ───────────────────────────────────────────────────────────────
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── BuyerRoute ───────────────────────────────────────────────────────────────
// Buyers only — admins are redirected back to /admin
// Use for cart, checkout, and orders
function BuyerRoute({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  useEffect(() => { clearIfExpired(); }, []);

  return (
    <Router>
      <Routes>

        {/* ── Public ── */}
        <Route path="/"            element={<Homepage />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* ── Auth (guests only) ── */}
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />

        {/* ── Buyer only (admins blocked) ── */}
        <Route path="/cart"     element={<BuyerRoute><Cart /></BuyerRoute>} />
        <Route path="/checkout" element={<BuyerRoute><Checkout /></BuyerRoute>} />
        <Route path="/orders"   element={<BuyerRoute><Orders /></BuyerRoute>} />
        <Route path="/wishlist" element={<BuyerRoute><Wishlist /></BuyerRoute>} />
        <Route path="/reviews"  element={<BuyerRoute><Reviews/></BuyerRoute>} />

        {/* ── Email verification ── */}
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* ── Admin only ── */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;

// ─── Email Verification Page ──────────────────────────────────────────────────
function VerifyEmail() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const hasCalled  = useRef(false); // ← prevents double-call in React Strict Mode
  const [status, setStatus]   = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (hasCalled.current) return; // ← if already called, bail out immediately
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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FBF6F0', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '48px 40px',
        textAlign: 'center', maxWidth: 400, width: '100%',
        boxShadow: '0 8px 32px rgba(44,26,14,0.1)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 52, marginBottom: 16 }}>⏳</div>
            <p style={{ color: '#5C3D1E', fontWeight: 600 }}>Verifying your email…</p>
          </>
        )}
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
            <button
              onClick={() => navigate('/login')}
              style={{
                marginTop: 20, background: '#C4703A', color: '#fff',
                border: 'none', borderRadius: 12, padding: '12px 28px',
                fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── 404 Not Found ────────────────────────────────────────────────────────────
function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#FBF6F0', fontFamily: "'DM Sans', sans-serif",
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 72 }}>🌿</div>
      <h1 style={{ fontFamily: 'Lora, serif', fontSize: 32, color: '#2C1A0E' }}>Page Not Found</h1>
      <p style={{ color: '#9C7A60', fontSize: 15 }}>The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate('/')}
        style={{
          background: '#C4703A', color: '#fff', border: 'none',
          borderRadius: 12, padding: '12px 28px', fontWeight: 600,
          cursor: 'pointer', fontSize: 14, marginTop: 8,
        }}
      >
        Back to Homepage
      </button>
    </div>
  );
}