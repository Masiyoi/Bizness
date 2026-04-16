import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar       from '../components/common/Navbar';
import Footer       from '../components/common/Footer';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  category: string;
  quantity: number;
  colors: string[];
  sizes: string[];
  selected_color: string | null;
  selected_size:  string | null;
}

const T = {
  navy:      '#0D1B3E',
  navyMid:   '#152348',
  navyLight: '#1E2F5A',
  gold:      '#C8A951',
  goldLight: '#DEC06A',
  goldPale:  '#F0D98A',
  cream:     '#F9F5EC',
  creamMid:  '#F0EAD8',
  creamDeep: '#E4D9C0',
  white:     '#FFFFFF',
  text:      '#0D1B3E',
  muted:     '#7A7A8A',
};

type DeliveryZone = 'pickup' | 'cbd' | 'environs' | 'county';

interface ShippingInfo {
  firstName:      string;
  lastName:       string;
  phone:          string;
  email:          string;
  county:         string;
  town:           string;
  pickupLocation: string;
  additionalInfo: string;
}

const DELIVERY_OPTIONS: { value: DeliveryZone; label: string; sub: string; fee: number; icon: string }[] = [
  { value: 'pickup',   label: 'Pick Up from Shop',  sub: 'Collect at our shop — no charge',    fee: 0,   icon: '🏪' },
  { value: 'cbd',      label: 'Nairobi CBD',         sub: 'Delivery within the CBD area',       fee: 100, icon: '🏙️' },
  { value: 'environs', label: 'Nairobi Environs',    sub: 'Outside CBD, within Nairobi county', fee: 200, icon: '🌆' },
  { value: 'county',   label: 'Other Counties',      sub: 'Mombasa, Kisumu, Nakuru & more',     fee: 300, icon: '📍' },
];

const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa',"Murang'a",
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri',
  'Samburu','Siaya','Taita Taveta','Tana River','Tharaka Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
];

const PICKUP_LOCATIONS = [
  'Luku Prime — Nairobi CBD (Moi Avenue)',
  'Luku Prime — Westlands',
  'Luku Prime — Upperhill',
];

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const EMPTY_SHIPPING: ShippingInfo = {
  firstName: '', lastName: '', phone: '', email: '',
  county: '', town: '', pickupLocation: '', additionalInfo: '',
};

const parseArr = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter(Boolean) : []; }
    catch { return []; }
  }
  return [];
};

const broadcastCartChange = () =>
  window.dispatchEvent(new CustomEvent('cartUpdated'));

export default function Cart() {
  const navigate = useNavigate();
  const [items,          setItems]          = useState<CartItem[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [updating,       setUpdating]       = useState<number | null>(null);
  const [error,          setError]          = useState('');
  const [deliveryZone,   setDeliveryZone]   = useState<DeliveryZone>('cbd');
  const [shipping,       setShipping]       = useState<ShippingInfo>(EMPTY_SHIPPING);
  const [formErrors,     setFormErrors]     = useState<Partial<ShippingInfo>>({});
  const [formTouched,    setFormTouched]    = useState<Partial<Record<keyof ShippingInfo, boolean>>>({});
  const [selectedColors, setSelectedColors] = useState<Record<number, string>>({});
  const [selectedSizes,  setSelectedSizes]  = useState<Record<number, string>>({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchCart();
    try {
      const saved = sessionStorage.getItem('luku_shipping');
      if (saved) setShipping(JSON.parse(saved));
      const savedZone = sessionStorage.getItem('luku_zone') as DeliveryZone | null;
      if (savedZone) setDeliveryZone(savedZone);
    } catch {}
  }, []);

  // ✅ Listen for cartUpdated events fired by ProductDetail when color/size changes there
  useEffect(() => {
    const handler = () => fetchCart();
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart', authHeaders());
      const normalised: CartItem[] = (res.data as any[]).map(item => ({
        ...item,
        colors:         parseArr(item.colors),
        sizes:          parseArr(item.sizes),
        selected_color: item.selected_color || null,
        selected_size:  item.selected_size  || null,
      }));
      setItems(normalised);

      // ✅ Always trust DB values as the source of truth — DB is updated by ProductDetail
      const dbColors: Record<number, string> = {};
      const dbSizes:  Record<number, string> = {};
      normalised.forEach(item => {
        if (item.selected_color) dbColors[item.id] = item.selected_color;
        if (item.selected_size)  dbSizes[item.id]  = item.selected_size;
      });

      // Merge: DB wins over sessionStorage (DB is always most up-to-date)
      try {
        const sc = sessionStorage.getItem('luku_colors');
        const ss = sessionStorage.getItem('luku_sizes');
        // DB values take precedence — spread them last so they override session
        const mergedColors = { ...(sc ? JSON.parse(sc) : {}), ...dbColors };
        const mergedSizes  = { ...(ss ? JSON.parse(ss) : {}), ...dbSizes  };
        setSelectedColors(mergedColors);
        setSelectedSizes(mergedSizes);
        sessionStorage.setItem('luku_colors', JSON.stringify(mergedColors));
        sessionStorage.setItem('luku_sizes',  JSON.stringify(mergedSizes));
      } catch {
        setSelectedColors(dbColors);
        setSelectedSizes(dbSizes);
      }

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
      // ✅ Always include selected_color and selected_size alongside quantity
      const item = items.find(i => i.id === itemId);
      await axios.patch(`/api/cart/${itemId}`, {
        quantity:       qty,
        selected_color: selectedColors[itemId] ?? item?.selected_color ?? null,
        selected_size:  selectedSizes[itemId]  ?? item?.selected_size  ?? null,
      }, authHeaders());
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
      broadcastCartChange();
    } catch { setError('Failed to update quantity.'); }
    finally { setUpdating(null); }
  };

  const removeItem = async (itemId: number) => {
    setUpdating(itemId);
    try {
      await axios.delete(`/api/cart/${itemId}`, authHeaders());
      setItems(prev => prev.filter(i => i.id !== itemId));
      setSelectedColors(prev => {
        const next = { ...prev }; delete next[itemId];
        sessionStorage.setItem('luku_colors', JSON.stringify(next));
        return next;
      });
      setSelectedSizes(prev => {
        const next = { ...prev }; delete next[itemId];
        sessionStorage.setItem('luku_sizes', JSON.stringify(next));
        return next;
      });
      broadcastCartChange();
    } catch { setError('Failed to remove item.'); }
    finally { setUpdating(null); }
  };

  const clearCart = async () => {
    try {
      await axios.delete('/api/cart', authHeaders());
      setItems([]);
      setSelectedColors({});
      setSelectedSizes({});
      sessionStorage.removeItem('luku_colors');
      sessionStorage.removeItem('luku_sizes');
      broadcastCartChange();
    } catch { setError('Failed to clear cart.'); }
  };

  // ✅ handleColorChange — passes quantity so backend PATCH validation passes
  const handleColorChange = async (itemId: number, color: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Update local state immediately for snappy UI
    setSelectedColors(prev => {
      const next = { ...prev, [itemId]: color };
      sessionStorage.setItem('luku_colors', JSON.stringify(next));
      return next;
    });

    // ✅ Must include quantity — backend requires it
    try {
      const res = await axios.patch(`/api/cart/${itemId}`, {
        quantity:       item.quantity,
        selected_color: color,
        selected_size:  selectedSizes[itemId] ?? item.selected_size ?? null,
      }, authHeaders());

      // If backend merged rows (variant collision), re-fetch to get accurate state
      if (res.data?.merged) {
        await fetchCart();
      }
      broadcastCartChange();
    } catch { setError('Failed to update colour.'); }
  };

  // ✅ handleSizeChange — passes quantity so backend PATCH validation passes
  const handleSizeChange = async (itemId: number, size: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    setSelectedSizes(prev => {
      const next = { ...prev, [itemId]: size };
      sessionStorage.setItem('luku_sizes', JSON.stringify(next));
      return next;
    });

    try {
      const res = await axios.patch(`/api/cart/${itemId}`, {
        quantity:       item.quantity,
        selected_color: selectedColors[itemId] ?? item.selected_color ?? null,
        selected_size:  size,
      }, authHeaders());

      if (res.data?.merged) {
        await fetchCart();
      }
      broadcastCartChange();
    } catch { setError('Failed to update size.'); }
  };

  const subtotal    = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const deliveryFee = DELIVERY_OPTIONS.find(o => o.value === deliveryZone)!.fee;
  const total       = subtotal + deliveryFee;

  const setField = (field: keyof ShippingInfo, value: string) => {
    const updated = { ...shipping, [field]: value };
    setShipping(updated);
    sessionStorage.setItem('luku_shipping', JSON.stringify(updated));
    if (formTouched[field]) validateField(field, value);
  };

  const touch = (field: keyof ShippingInfo) => {
    setFormTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, shipping[field]);
  };

  const validateField = (field: keyof ShippingInfo, value: string) => {
    let msg = '';
    if (field === 'firstName'  && !value.trim()) msg = 'First name is required';
    if (field === 'lastName'   && !value.trim()) msg = 'Last name is required';
    if (field === 'phone') {
      if (!value.trim()) msg = 'Phone number is required';
      else if (!/^(\+?254|0)[17]\d{8}$/.test(value.replace(/\s/g, ''))) msg = 'Enter a valid Kenyan phone number';
    }
    if (field === 'county'         && deliveryZone !== 'pickup' && !value) msg = 'Please select your county';
    if (field === 'pickupLocation' && deliveryZone === 'pickup' && !value) msg = 'Please select a pickup location';
    setFormErrors(prev => ({ ...prev, [field]: msg }));
    return !msg;
  };

  const validateAll = () => {
    const fields: (keyof ShippingInfo)[] = ['firstName', 'lastName', 'phone', 'county', 'pickupLocation'];
    setFormTouched(Object.fromEntries(fields.map(f => [f, true])));
    let ok = true;
    fields.forEach(f => { if (!validateField(f, shipping[f])) ok = false; });
    return ok;
  };

  const handleCheckout = () => {
    if (!validateAll()) {
      document.getElementById('shipping-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const missingColor = items.find(i => i.colors.length > 0 && !selectedColors[i.id]);
    if (missingColor) {
      setError(`Please select a colour for "${missingColor.name}" before continuing.`);
      document.getElementById('items-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const missingSize = items.find(i => i.sizes.length > 0 && !selectedSizes[i.id]);
    if (missingSize) {
      setError(`Please select a size for "${missingSize.name}" before continuing.`);
      document.getElementById('items-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setError('');
    sessionStorage.setItem('luku_shipping', JSON.stringify(shipping));
    sessionStorage.setItem('luku_zone',     deliveryZone);
    sessionStorage.setItem('luku_colors',   JSON.stringify(selectedColors));
    sessionStorage.setItem('luku_sizes',    JSON.stringify(selectedSizes));
    navigate('/checkout', { state: { deliveryZone, shipping, selectedColors, selectedSizes } });
  };

  const inputStyle = (field: keyof ShippingInfo): React.CSSProperties => ({
    width: '100%',
    fontFamily: "'Jost',sans-serif",
    fontSize: 14,
    color: T.navy,
    background: '#fff',
    border: `1.5px solid ${formErrors[field] && formTouched[field] ? '#E74C3C' : formTouched[field] && shipping[field] ? T.gold : T.creamDeep}`,
    borderRadius: 10,
    padding: '12px 14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    appearance: 'none' as any,
    WebkitAppearance: 'none' as any,
  });

  if (loading) return (
    <div style={{ background: T.cream, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🛒</div>
      <p style={{ fontFamily: "'Jost',sans-serif", color: T.muted, letterSpacing: '1px', fontSize: 13 }}>Loading your cart…</p>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Playfair Display','Georgia',serif", background: T.cream, minHeight: '100vh', color: T.text, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.cream}; }
        .jost { font-family: 'Jost', sans-serif; }
        a { text-decoration: none; color: inherit; }
        .back-btn { background: none; border: none; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: ${T.gold}; padding: 8px 0; display: flex; align-items: center; gap: 8px; transition: opacity 0.2s; min-height: 44px; }
        .back-btn:hover { opacity: 0.75; }
        .item-card { background: #fff; border-radius: 16px; border: 1px solid ${T.creamDeep}; transition: all 0.25s; display: flex; align-items: flex-start; gap: 16px; padding: 16px; }
        .item-card:hover { border-color: ${T.gold}; box-shadow: 0 12px 32px rgba(13,27,62,0.1); }
        .qty-btn { border: 1px solid ${T.creamDeep}; background: ${T.cream}; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; font-family: 'Jost', sans-serif; font-weight: 600; transition: all 0.15s; color: ${T.navy}; flex-shrink: 0; }
        .qty-btn:hover:not(:disabled) { background: ${T.navy}; color: ${T.goldLight}; border-color: ${T.navy}; }
        .qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .remove-btn { background: none; border: none; cursor: pointer; color: ${T.muted}; font-size: 16px; transition: color 0.15s; padding: 8px; border-radius: 6px; flex-shrink: 0; min-height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; }
        .remove-btn:hover { color: #C0392B; background: #FDF0EE; }
        .cta-primary { font-family: 'Jost', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; border: none; border-radius: 10px; padding: 16px; width: 100%; cursor: pointer; transition: all 0.25s; background: ${T.gold}; color: ${T.navy}; position: relative; overflow: hidden; min-height: 52px; }
        .cta-primary::before { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0.12); transform: translateX(-100%); transition: transform 0.3s; }
        .cta-primary:hover::before { transform: translateX(0); }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(200,169,81,0.35); }
        .cta-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .cta-secondary { font-family: 'Jost', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; border: 1px solid ${T.creamDeep}; border-radius: 10px; padding: 14px; width: 100%; cursor: pointer; transition: all 0.2s; background: #fff; color: ${T.navy}; margin-top: 10px; min-height: 48px; }
        .cta-secondary:hover { border-color: ${T.gold}; background: ${T.cream}; }
        .clear-btn { background: none; border: 1px solid ${T.creamDeep}; border-radius: 6px; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: ${T.muted}; padding: 9px 16px; transition: all 0.15s; white-space: nowrap; min-height: 44px; }
        .clear-btn:hover { border-color: #C0392B; color: #C0392B; }
        .ornament { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
        .ornament-line { flex: 0 0 28px; height: 1px; background: ${T.gold}; }
        .ornament-diamond { width: 4px; height: 4px; background: ${T.gold}; transform: rotate(45deg); flex-shrink: 0; }
        .summary-card { background: #fff; border: 1px solid ${T.creamDeep}; border-radius: 20px; padding: clamp(18px,4vw,28px); }
        .shipping-card { background: #fff; border: 1px solid ${T.creamDeep}; border-radius: 20px; padding: clamp(18px,4vw,28px); margin-top: 24px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .field-label { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: ${T.navy}; }
        .field-error { font-family: 'Jost', sans-serif; font-size: 11px; color: #E74C3C; margin-top: 3px; }
        input:focus, select:focus, textarea:focus { border-color: ${T.gold} !important; box-shadow: 0 0 0 3px rgba(200,169,81,0.12); }
        select option { color: ${T.navy}; }
        .color-select { font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600; color: ${T.navy}; background: ${T.cream}; border-radius: 8px; padding: 6px 30px 6px 10px; outline: none; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%230D1B3E' stroke-width='1.5' fill='none'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; transition: border-color 0.2s, box-shadow 0.2s; }
        .color-select:focus { border-color: ${T.gold} !important; box-shadow: 0 0 0 3px rgba(200,169,81,0.12); }
        .color-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 4px 0 8px; }
        .color-swatch-pill { display: inline-flex; align-items: center; gap: 5px; background: ${T.cream}; border: 1px solid ${T.creamDeep}; border-radius: 20px; padding: 3px 10px 3px 6px; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; color: ${T.navy}; }
        .color-nudge { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; color: #B7791F; }
        .size-nudge { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; color: #B7791F; display: block; margin-top: 4px; }
        .mobile-checkout-bar { display: none; }
        .cart-layout { display: grid; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }
        .sidebar-sticky { position: sticky; top: 24px; }
        .item-thumb { width: 88px; height: 88px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: ${T.creamMid}; }
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr; gap: 0; }
          .sidebar-sticky { position: static; }
          .item-thumb { width: 68px; height: 68px; border-radius: 10px; }
          .item-card { padding: 12px; gap: 12px; }
          .cart-nav-sub { display: none; }
          .back-label { display: none; }
          .form-row { grid-template-columns: 1fr; gap: 0; }
          .shipping-card { border-radius: 16px; margin-top: 16px; }
          .summary-card { border-radius: 16px; }
          .mobile-checkout-bar { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: ${T.navy}; border-top: 1px solid rgba(200,169,81,0.25); padding: 12px 5%; gap: 12px; align-items: center; z-index: 200; box-shadow: 0 -8px 32px rgba(13,27,62,0.3); }
          .cart-body-pad { padding-bottom: 100px !important; }
          .desktop-ctas { display: none; }
        }
        @media (max-width: 400px) {
          .item-cat-badge { display: none; }
          .item-name { font-size: 13px !important; }
          .item-thumb { width: 58px; height: 58px; }
        }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── NAVBAR ── */}
     <Navbar />

      {/* ── PAGE BODY ── */}
      <div className="cart-body-pad" style={{ padding: 'clamp(20px,4vw,40px) clamp(16px,5%,5%) 80px', maxWidth: 1160, margin: '0 auto' }}>

        {error && (
          <div className="jost" style={{ background: '#FDF0EE', border: '1px solid #F5C6C0', borderRadius: 10, padding: '12px 18px', color: '#C0392B', fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', textAlign: 'center', padding: '0 16px' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: T.creamMid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 24, border: `1px solid ${T.creamDeep}` }}>🛒</div>
            <div className="ornament" style={{ justifyContent: 'center' }}>
              <div className="ornament-line" /><div className="ornament-diamond" />
              <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Empty</span>
              <div className="ornament-diamond" /><div className="ornament-line" />
            </div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(22px,5vw,30px)', color: T.navy, marginBottom: 12 }}>Your cart is empty</h2>
            <p className="jost" style={{ fontSize: 14, color: T.muted, marginBottom: 32, lineHeight: 1.7, fontWeight: 300 }}>
              Looks like you haven't added anything yet.<br />Discover our premium collection.
            </p>
            <button className="cta-primary" style={{ width: 'auto', padding: '14px 44px' }} onClick={() => navigate('/')}>
              Explore Products →
            </button>
          </div>
        ) : (
          <div className="cart-layout">

            {/* ── LEFT: items + shipping form ── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div className="ornament">
                    <div className="ornament-line" /><div className="ornament-diamond" />
                    <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Cart</span>
                    <div className="ornament-diamond" /><div className="ornament-line" />
                  </div>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(18px,4vw,24px)', color: T.navy }}>Your Items</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="jost" style={{ fontSize: 12, color: T.muted }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  <button className="clear-btn" onClick={clearCart}>Clear All</button>
                </div>
              </div>

              {/* ── ITEMS LIST ── */}
              <div id="items-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map(item => {
                  const isBusy     = updating === item.id;
                  const hasColors  = item.colors.length > 0;
                  const hasSizes   = item.sizes.length > 0;
                  const chosen     = selectedColors[item.id] || '';
                  const chosenSize = selectedSizes[item.id] || '';

                  return (
                    <div key={item.id} className="item-card" style={{ opacity: isBusy ? 0.55 : 1 }}>

                      {/* thumbnail */}
                      <div className="item-thumb">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/88x88/F0EAD8/0D1B3E?text=📦'; }}
                        />
                      </div>

                      {/* info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {item.category && (
                          <div className="item-cat-badge jost" style={{ display: 'inline-block', background: T.navy, color: T.gold, borderRadius: 3, padding: '2px 7px', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 5 }}>
                            {item.category}
                          </div>
                        )}

                        <div className="item-name" style={{ fontFamily: "'Playfair Display',serif", fontWeight: 600, fontSize: 15, color: T.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                          {item.name}
                        </div>

                        {/* ── COLOUR SELECTOR ── */}
                        {hasColors && (
                          <div className="color-row">
                            <select
                              className="color-select"
                              value={chosen}
                              onChange={e => handleColorChange(item.id, e.target.value)}
                              disabled={isBusy}
                              style={{ border: `1.5px solid ${chosen ? T.gold : T.creamDeep}` }}
                            >
                              <option value="">Select colour…</option>
                              {item.colors.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            {chosen ? (
                              <div className="color-swatch-pill">
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: chosen, border: '1.5px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                                {chosen}
                              </div>
                            ) : (
                              <span className="color-nudge">⚠ Pick a colour</span>
                            )}
                          </div>
                        )}

                        {/* ── SIZE SELECTOR ── */}
                        {hasSizes && (
                          <div style={{ margin: '4px 0 8px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {item.sizes.map(size => {
                                const active = chosenSize === size;
                                return (
                                  <button
                                    key={size}
                                    onClick={() => handleSizeChange(item.id, size)}
                                    disabled={isBusy}
                                    style={{
                                      padding: '5px 12px',
                                      borderRadius: 7,
                                      border: active ? `2px solid ${T.gold}` : `1.5px solid ${T.creamDeep}`,
                                      background: active ? `rgba(200,169,81,0.1)` : T.cream,
                                      fontFamily: "'Jost',sans-serif",
                                      fontSize: 11,
                                      fontWeight: active ? 700 : 500,
                                      color: active ? T.navy : T.muted,
                                      cursor: isBusy ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.15s',
                                    }}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                            {!chosenSize && (
                              <span className="size-nudge">⚠ Pick a size</span>
                            )}
                          </div>
                        )}

                        {/* price */}
                        <div className="jost" style={{ fontWeight: 700, fontSize: 15, color: T.gold }}>
                          KSh {(Number(item.price) * item.quantity).toLocaleString()}
                        </div>
                        <div className="jost" style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>
                          KSh {Number(item.price).toLocaleString()} each
                        </div>
                      </div>

                      {/* qty + remove */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity - 1)} disabled={isBusy}>−</button>
                          <span className="jost" style={{ fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center', color: T.navy }}>{item.quantity}</span>
                          <button className="qty-btn" onClick={() => updateQty(item.id, item.quantity + 1)} disabled={isBusy}>+</button>
                        </div>
                        <button className="remove-btn" onClick={() => removeItem(item.id)} disabled={isBusy} title="Remove item">🗑️</button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* ── SHIPPING FORM ── */}
              <div id="shipping-form" className="shipping-card fade-in">
                <div className="ornament">
                  <div className="ornament-line" /><div className="ornament-diamond" />
                  <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Delivery Info</span>
                  <div className="ornament-diamond" /><div className="ornament-line" />
                </div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(18px,4vw,22px)', color: T.navy, marginBottom: 6 }}>Shipping Information</h2>
                <p className="jost" style={{ fontSize: 12, color: T.muted, marginBottom: 24, fontWeight: 300, lineHeight: 1.6 }}>
                  Tell us where to deliver or who's picking up your order.
                </p>

                <div className="form-row">
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">First Name *</label>
                    <input type="text" placeholder="e.g. Amina" value={shipping.firstName}
                      onChange={e => setField('firstName', e.target.value)} onBlur={() => touch('firstName')} style={inputStyle('firstName')} />
                    {formTouched.firstName && formErrors.firstName && <span className="field-error">{formErrors.firstName}</span>}
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="field-label">Last Name *</label>
                    <input type="text" placeholder="e.g. Wanjiku" value={shipping.lastName}
                      onChange={e => setField('lastName', e.target.value)} onBlur={() => touch('lastName')} style={inputStyle('lastName')} />
                    {formTouched.lastName && formErrors.lastName && <span className="field-error">{formErrors.lastName}</span>}
                  </div>
                </div>

                <div className="form-field">
                  <label className="field-label">Phone Number *</label>
                  <div style={{ position: 'relative' }}>
                    <span className="jost" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: T.muted, pointerEvents: 'none' }}>🇰🇪</span>
                    <input type="tel" placeholder="0712 345 678" value={shipping.phone}
                      onChange={e => setField('phone', e.target.value)} onBlur={() => touch('phone')} style={{ ...inputStyle('phone'), paddingLeft: 36 }} />
                  </div>
                  {formTouched.phone && formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                </div>

                <div className="form-field">
                  <label className="field-label">Email <span style={{ color: T.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional — for order updates)</span></label>
                  <input type="email" placeholder="amina@example.com" value={shipping.email}
                    onChange={e => setField('email', e.target.value)} style={inputStyle('email')} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="field-label" style={{ display: 'block', marginBottom: 10 }}>Delivery Method *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    {DELIVERY_OPTIONS.map(opt => (
                      <div key={opt.value}
                        onClick={() => { setDeliveryZone(opt.value); sessionStorage.setItem('luku_zone', opt.value); }}
                        style={{ border: `1.5px solid ${deliveryZone === opt.value ? T.gold : T.creamDeep}`, background: deliveryZone === opt.value ? 'rgba(200,169,81,0.07)' : '#fff', borderRadius: 12, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.18s' }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{opt.icon}</div>
                        <div className="jost" style={{ fontSize: 12, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{opt.label}</div>
                        <div className="jost" style={{ fontSize: 10, color: T.muted, lineHeight: 1.4 }}>{opt.sub}</div>
                        <div className="jost" style={{ fontSize: 13, fontWeight: 800, color: opt.fee === 0 ? '#4A7A4A' : T.gold, marginTop: 6 }}>
                          {opt.fee === 0 ? 'FREE' : `KSh ${opt.fee}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {deliveryZone === 'pickup' ? (
                  <div className="form-field fade-in">
                    <label className="field-label">Pickup Location *</label>
                    <select value={shipping.pickupLocation} onChange={e => setField('pickupLocation', e.target.value)} onBlur={() => touch('pickupLocation')}
                      style={{ ...inputStyle('pickupLocation'), backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230D1B3E' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}>
                      <option value="">Select pickup branch…</option>
                      {PICKUP_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    {formTouched.pickupLocation && formErrors.pickupLocation && <span className="field-error">{formErrors.pickupLocation}</span>}
                    <div style={{ background: 'rgba(74,122,74,0.08)', border: '1px solid rgba(74,122,74,0.25)', borderRadius: 10, padding: '10px 14px', marginTop: 10 }}>
                      <p className="jost" style={{ fontSize: 12, color: '#4A7A4A', fontWeight: 500 }}>🏪 You'll collect your order at this branch — no delivery fee!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="form-field fade-in">
                      <label className="field-label">County *</label>
                      <select value={shipping.county} onChange={e => setField('county', e.target.value)} onBlur={() => touch('county')}
                        style={{ ...inputStyle('county'), backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230D1B3E' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: 36 }}>
                        <option value="">Select county…</option>
                        {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {formTouched.county && formErrors.county && <span className="field-error">{formErrors.county}</span>}
                    </div>
                    <div className="form-field fade-in">
                      <label className="field-label">Town / Estate <span style={{ color: T.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span></label>
                      <input type="text" placeholder="e.g. Kilimani, Westlands, Nyali…" value={shipping.town}
                        onChange={e => setField('town', e.target.value)} style={inputStyle('town')} />
                    </div>
                  </>
                )}

                <div className="form-field" style={{ marginBottom: 0 }}>
                  <label className="field-label">Delivery Notes <span style={{ color: T.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>(optional)</span></label>
                  <textarea rows={3} placeholder="Landmark, building name, gate colour, best time to deliver…"
                    value={shipping.additionalInfo} onChange={e => setField('additionalInfo', e.target.value)}
                    style={{ ...inputStyle('additionalInfo'), resize: 'none', lineHeight: 1.6 }} />
                </div>
              </div>
            </div>

            {/* ── RIGHT: order summary sidebar ── */}
            <div className="sidebar-sticky">
              <div className="summary-card">
                <div className="ornament">
                  <div className="ornament-line" /><div className="ornament-diamond" />
                  <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', color: T.gold, textTransform: 'uppercase' }}>Summary</span>
                  <div className="ornament-diamond" /><div className="ornament-line" />
                </div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 'clamp(18px,3vw,22px)', color: T.navy, marginBottom: 20 }}>Order Summary</h2>

                {(shipping.firstName || shipping.county || shipping.pickupLocation) && (
                  <div style={{ background: T.cream, border: `1px solid ${T.creamDeep}`, borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                    <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>Delivering to</div>
                    {shipping.firstName && <div className="jost" style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 2 }}>{shipping.firstName} {shipping.lastName}</div>}
                    {shipping.phone && <div className="jost" style={{ fontSize: 12, color: T.muted }}>{shipping.phone}</div>}
                    {deliveryZone === 'pickup' && shipping.pickupLocation && (
                      <div className="jost" style={{ fontSize: 12, color: T.gold, marginTop: 4, fontWeight: 600 }}>🏪 {shipping.pickupLocation}</div>
                    )}
                    {deliveryZone !== 'pickup' && (shipping.county || shipping.town) && (
                      <div className="jost" style={{ fontSize: 12, color: T.gold, marginTop: 4, fontWeight: 600 }}>
                        📍 {[shipping.town, shipping.county].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* ── unified per-item colour + size recap ── */}
                {items.some(i => i.colors.length > 0 || i.sizes.length > 0) && (
                  <div style={{ background: T.cream, border: `1px solid ${T.creamDeep}`, borderRadius: 12, padding: '12px 14px', marginBottom: 18 }}>
                    <div className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Item Selections</div>
                    {items.filter(i => i.colors.length > 0 || i.sizes.length > 0).map((i, idx, arr) => {
                      const hasColor = i.colors.length > 0;
                      const hasSize  = i.sizes.length > 0;
                      const color    = selectedColors[i.id];
                      const size     = selectedSizes[i.id];
                      const isLast   = idx === arr.length - 1;
                      return (
                        <div key={i.id} style={{ marginBottom: isLast ? 0 : 12, paddingBottom: isLast ? 0 : 12, borderBottom: isLast ? 'none' : `1px solid ${T.creamDeep}` }}>
                          {/* item name */}
                          <div className="jost" style={{ fontSize: 11, fontWeight: 700, color: T.navy, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {i.name}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* colour row — only for items that have colours */}
                            {hasColor && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="jost" style={{ fontSize: 10, color: T.muted, letterSpacing: '0.5px' }}>Colour</span>
                                {color ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />
                                    <span className="jost" style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{color}</span>
                                  </div>
                                ) : (
                                  <span className="jost" style={{ fontSize: 10, color: '#B7791F', fontWeight: 600 }}>⚠ Not chosen</span>
                                )}
                              </div>
                            )}
                            {/* size row — only for items that have sizes */}
                            {hasSize && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="jost" style={{ fontSize: 10, color: T.muted, letterSpacing: '0.5px' }}>Size</span>
                                {size ? (
                                  <span className="jost" style={{ fontSize: 11, fontWeight: 700, color: T.navy }}>{size}</span>
                                ) : (
                                  <span className="jost" style={{ fontSize: 10, color: '#B7791F', fontWeight: 600 }}>⚠ Not chosen</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                  <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span className="jost" style={{ fontSize: 13, color: T.muted }}>Delivery</span>
                  <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: deliveryFee === 0 ? '#4A7A4A' : T.navy }}>
                    {deliveryFee === 0 ? 'FREE 🎉' : `KSh ${deliveryFee}`}
                  </span>
                </div>
                <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${T.gold},transparent)`, margin: '16px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                  <span className="jost" style={{ fontWeight: 700, fontSize: 14, color: T.navy, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Total</span>
                  <span className="jost" style={{ fontWeight: 800, fontSize: 22, color: T.navy, letterSpacing: '-0.5px' }}>KSh {total.toLocaleString()}</span>
                </div>

                <div style={{ background: T.navy, borderRadius: 12, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid rgba(200,169,81,0.2)` }}>
                  <span style={{ fontSize: 20 }}>📱</span>
                  <div>
                    <div className="jost" style={{ fontSize: 12, fontWeight: 700, color: T.goldLight }}>Pay with M-Pesa</div>
                    <div className="jost" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Fast & secure mobile payments</div>
                  </div>
                </div>

                <div className="desktop-ctas">
                  <button className="cta-primary" onClick={handleCheckout}>Proceed to Checkout →</button>
                  <button className="cta-secondary" onClick={() => navigate('/')}>Continue Shopping</button>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['🔒 Secure', '↩️ 30-Day Returns', '🚚 Fast Delivery'].map(b => (
                    <span key={b} className="jost" style={{ fontSize: 10, color: T.muted }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE STICKY CHECKOUT BAR ── */}
      {items.length > 0 && (
        <div className="mobile-checkout-bar">
          <div style={{ flex: 1 }}>
            <div className="jost" style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Total</div>
            <div className="jost" style={{ fontWeight: 800, fontSize: 18, color: T.white }}>KSh {total.toLocaleString()}</div>
          </div>
          <button className="cta-primary" style={{ width: 'auto', padding: '14px 24px', flex: 1 }} onClick={handleCheckout}>
            Checkout →
          </button>
        </div>
      )}

      {/* ── FOOTER ── */}
       {/* ── Shared Footer (same as Homepage) ── */}
            <Footer />
    </div>
  );
}