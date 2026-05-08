import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

import Navbar       from '../components/common/Navbar';
import Footer       from '../components/common/Footer';
import InstagramStrip from '../components/common/InstagramStrip';

interface WishlistItem {
  id: number;          // wishlist row id
  product_id: number;
  name: string; price: string; image_url: string;
  description: string; category?: string; stock?: number; created_at?: string;
}
interface User {
  id: number; full_name: string; email: string; role: string; is_verified: boolean;
}

const T = {
  navy:'#0D1B3E', navyMid:'#152348', navyLight:'#1E2F5A',
  gold:'#C8A951', goldLight:'#DEC06A', goldPale:'#F0D98A',
  cream:'#F9F5EC', creamMid:'#F0EAD8', creamDeep:'#E4D9C0',
  white:'#FFFFFF', text:'#0D1B3E', muted:'#7A7A8A',
};

const readUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
const isNewProduct = (createdAt?: string) =>
  createdAt ? Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000 : false;

export default function WishlistPage() {
  const navigate = useNavigate();
  const [user, setUser]           = useState<User | null>(readUser);
  const [items, setItems]         = useState<WishlistItem[]>([]);
  const [cartIds, setCartIds]     = useState<number[]>([]);
  const [loading, setLoading]     = useState(true);
  const [removing, setRemoving]   = useState<number | null>(null);
  const [busyCart, setBusyCart]   = useState<number | null>(null);

  // ── Sync logged-in user ──────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      const f = readUser();
      setUser(prev => JSON.stringify(prev) === JSON.stringify(f) ? prev : f);
    };
    window.addEventListener('storage', sync);
    const id = setInterval(sync, 1000);
    return () => { window.removeEventListener('storage', sync); clearInterval(id); };
  }, []);

  // ── Fetch wishlist from API ──────────────────────────────────────────────────
const fetchWishlist = useCallback(async () => {
  try {
    const res = await axios.get('/api/wishlist');
      setItems(res.data);
    } catch (e: any) {
      if (e.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  // ── Fetch cart ───────────────────────────────────────────────────────────────
const fetchCart = useCallback(async () => {
  if (!user) return;
  try {
    const res = await axios.get('/api/cart');
    setCartIds(res.data.map((i: any) => i.product_id));
  } catch {}
}, [user?.id]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // ── Remove from wishlist (optimistic) ───────────────────────────────────────
  const removeFromWishlist = (productId: number) => {
    setRemoving(productId);
    setTimeout(async () => {
      try {
        await axios.delete(`/api/wishlist/${productId}`);
        setItems(prev => prev.filter(i => i.product_id !== productId));
      } catch (e: any) {
        fetchWishlist(); // roll back on failure
        if (e.response?.status === 401) navigate('/login');
      } finally {
        setRemoving(null);
      }
    }, 360);
  };

  // ── Toggle cart ──────────────────────────────────────────────────────────────
  const toggleCart = async (productId: number) => {
  setBusyCart(productId);
  try {
    if (cartIds.includes(productId)) {
      await axios.delete(`/api/cart/${productId}`);
      setCartIds(p => p.filter(id => id !== productId));
    } else {
      await axios.post('/api/cart', { product_id: productId, quantity: 1 });
      setCartIds(p => [...p, productId]);
    }
  } catch (e: any) {
    if (e.response?.status === 401) navigate('/login');
  } finally {
    setBusyCart(null);
  }
};
  // ── Clear all ────────────────────────────────────────────────────────────────
  const clearAll = async () => {
    try {
      await axios.delete('/api/wishlist');
      setItems([]);
    } catch {}
  };

  const totalValue = items.reduce((s, i) => s + Number(i.price), 0);

  return (
    <div style={{ fontFamily:"'Playfair Display','Georgia',serif", background:T.cream, minHeight:'100vh', color:T.text, overflowX:'hidden' }}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <Navbar />


      {/* ── HERO HEADER ── */}
      <div style={{ background:T.navy, position:'relative', overflow:'hidden', padding:'clamp(40px,6vw,72px) 5% clamp(36px,5vw,60px)' }}>
        <div style={{ position:'absolute', top:'-20%', right:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(200,169,81,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-30%', left:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(200,169,81,0.05) 0%,transparent 70%)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
          <span className="jost" style={{ fontSize:11, color:'rgba(200,169,81,0.5)', letterSpacing:'2px', textTransform:'uppercase', cursor:'pointer' }} onClick={() => navigate('/')}>Home</span>
          <span style={{ color:'rgba(200,169,81,0.3)', fontSize:10 }}>›</span>
          <span className="jost" style={{ fontSize:11, color:'rgba(200,169,81,0.85)', letterSpacing:'2px', textTransform:'uppercase' }}>Wishlist</span>
        </div>

        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
              <div style={{ width:28, height:1, background:T.gold }} />
              <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3.5px', color:T.gold, textTransform:'uppercase' }}>Your Collection</span>
              <div style={{ width:28, height:1, background:T.gold }} />
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:'clamp(28px,5vw,52px)', color:T.white, lineHeight:1.05, marginBottom:12 }}>
              Saved Pieces <span style={{ display:'inline-block', marginLeft:12, fontSize:'clamp(22px,3vw,36px)', verticalAlign:'middle' }}>🤍</span>
            </h1>
            <p className="jost" style={{ fontSize:'clamp(12px,1.8vw,14px)', color:'rgba(255,255,255,0.45)', fontWeight:300, lineHeight:1.75, maxWidth:480 }}>
              Everything you've fallen in love with — synced to your account across every device.
            </p>
          </div>

          {items.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:'clamp(28px,4vw,40px)', color:T.gold, lineHeight:1 }}>{items.length}</div>
                  <div className="jost" style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'2px', textTransform:'uppercase', marginTop:4 }}>{items.length === 1 ? 'Item' : 'Items'} Saved</div>
                </div>
                <div style={{ width:1, height:44, background:'rgba(200,169,81,0.2)' }} />
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:'clamp(20px,3vw,32px)', color:T.goldLight, lineHeight:1 }}>KSh {totalValue.toLocaleString()}</div>
                  <div className="jost" style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'2px', textTransform:'uppercase', marginTop:4 }}>Total Value</div>
                </div>
              </div>
              <button className="jost clear-btn" onClick={clearAll}>Clear All</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ height:2, background:`linear-gradient(90deg,transparent 0%,${T.gold} 30%,${T.goldLight} 50%,${T.gold} 70%,transparent 100%)` }} />

      {/* ── CONTENT ── */}
      <div style={{ padding:'clamp(32px,5vw,60px) 5% clamp(60px,8vw,100px)' }}>

        {/* Not logged in */}
        {!user && !loading && (
          <div className="empty-state">
            <div style={{ fontSize:52, marginBottom:16 }}>🔐</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(20px,4vw,30px)', color:T.navy, marginBottom:12 }}>Sign in to see your wishlist</h2>
            <p className="jost" style={{ fontSize:14, color:T.muted, marginBottom:28, lineHeight:1.8, textAlign:'center', maxWidth:380 }}>Your saved items are tied to your account and sync instantly across every device you use.</p>
            <button className="jost" onClick={() => navigate('/login')}
              style={{ background:T.gold, color:T.navy, border:'none', borderRadius:8, padding:'13px 36px', fontSize:11, fontWeight:800, letterSpacing:'2.5px', textTransform:'uppercase', cursor:'pointer' }}>
              Sign In →
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="wl-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ borderRadius:20, overflow:'hidden', border:`1px solid ${T.creamDeep}` }}>
                <div className="skel" style={{ height:280, borderRadius:0 }} />
                <div style={{ padding:18, background:'#fff' }}>
                  <div className="skel" style={{ height:13, width:'70%', marginBottom:10 }} />
                  <div className="skel" style={{ height:11, width:'40%', marginBottom:16 }} />
                  <div className="skel" style={{ height:38 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && user && items.length === 0 && (
          <div className="empty-state">
            <div className="empty-heart">
              <div style={{ fontSize:56, lineHeight:1 }}>🤍</div>
              <div className="empty-pulse" />
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(22px,4vw,32px)', color:T.navy, marginBottom:12, marginTop:24 }}>Your wishlist is empty</h2>
            <p className="jost" style={{ fontSize:14, color:T.muted, marginBottom:32, lineHeight:1.8, maxWidth:400, textAlign:'center' }}>
              Tap the 🤍 on any product to save it here. Your picks sync instantly across all your devices.
            </p>
            <button className="jost" onClick={() => navigate('/')}
              style={{ background:T.gold, color:T.navy, border:'none', borderRadius:8, padding:'13px 36px', fontSize:11, fontWeight:800, letterSpacing:'2.5px', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 30px rgba(200,169,81,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
              Explore Collection →
            </button>
            <div style={{ marginTop:48, width:'100%', maxWidth:600 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginBottom:20 }}>
                <div style={{ height:1, flex:1, background:T.creamDeep }} />
                <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.muted, textTransform:'uppercase', whiteSpace:'nowrap' }}>Or browse categories</span>
                <div style={{ height:1, flex:1, background:T.creamDeep }} />
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, justifyContent:'center' }}>
                {['👗 Clothes', '👟 Shoes', '👜 Bags', '🧥 Jackets', '👠 Sneakers', '🧦 Socks'].map(cat => (
                  <button key={cat} className="jost" onClick={() => navigate('/')}
                    style={{ background:'#fff', border:`1px solid ${T.creamDeep}`, borderRadius:50, padding:'8px 18px', fontSize:12, fontWeight:500, color:T.navy, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor=T.gold; e.currentTarget.style.background=T.creamMid; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor=T.creamDeep; e.currentTarget.style.background='#fff'; }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filled */}
        {!loading && user && items.length > 0 && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
                  <div style={{ width:24, height:1, background:T.gold }} />
                  <div style={{ width:4, height:4, background:T.gold, transform:'rotate(45deg)' }} />
                  <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>Your Saved Pieces</span>
                  <div style={{ width:4, height:4, background:T.gold, transform:'rotate(45deg)' }} />
                  <div style={{ width:24, height:1, background:T.gold }} />
                </div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(18px,3vw,26px)', color:T.navy }}>
                  {items.length} {items.length === 1 ? 'Item' : 'Items'} in Your Wishlist
                </h2>
              </div>
              <button className="jost" onClick={() => navigate('/')}
                style={{ background:'transparent', color:T.gold, border:`1px solid rgba(200,169,81,0.45)`, borderRadius:6, padding:'9px 20px', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(200,169,81,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                + Add More
              </button>
            </div>

            <div className="wl-grid">
              {items.map(item => {
                const inCart  = cartIds.includes(item.product_id);
                const stock   = item.stock ?? 0;
                const isNew   = isNewProduct(item.created_at);
                const leaving = removing === item.product_id;
                const busy    = busyCart === item.product_id;
                return (
                  <div key={item.product_id} className={`wl-card ${leaving ? 'leaving' : 'entering'}`}>
                    <div style={{ position:'relative', height:260, overflow:'hidden', background:T.creamMid }}>
                      <Link to={`/product/${item.product_id}`}>
                        <img src={item.image_url} alt={item.name} className="wl-pimg"
                          onError={e => { (e.target as HTMLImageElement).src='https://placehold.co/300x260/F0EAD8/0D1B3E?text=Luku+Prime'; }} />
                      </Link>
                      {isNew && stock > 0 && <div className="new-badge">NEW</div>}
                      {item.category && !isNew && (
                        <div className="jost" style={{ position:'absolute', top:10, left:10, background:T.navy, color:T.gold, borderRadius:3, padding:'3px 8px', fontSize:8, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase' }}>{item.category}</div>
                      )}
                      <button className="wl-remove-btn" onClick={() => removeFromWishlist(item.product_id)} title="Remove from wishlist">❤️</button>
                      {stock === 0 && (
                        <div style={{ position:'absolute', inset:0, background:'rgba(13,27,62,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span className="jost" style={{ background:'rgba(255,255,255,0.95)', color:T.navy, fontWeight:700, fontSize:9, padding:'5px 14px', borderRadius:3, letterSpacing:'2px', textTransform:'uppercase' }}>Sold Out</span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding:'14px 16px 16px', flex:1, display:'flex', flexDirection:'column' }}>
                      <Link to={`/product/${item.product_id}`}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:600, fontSize:15, color:T.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:8 }}>{item.name}</div>
                      </Link>
                      <div style={{ marginBottom:10 }}>
                        {stock === 0
                          ? <span className="jost" style={{ fontSize:9, fontWeight:700, color:'#C0392B', background:'#FDF0EE', border:'1px solid #F5C6C0', borderRadius:3, padding:'2px 7px' }}>Out of stock</span>
                          : stock <= 5
                          ? <span className="jost" style={{ fontSize:9, fontWeight:700, color:'#8A6A20', background:'rgba(200,169,81,0.1)', border:'1px solid rgba(200,169,81,0.3)', borderRadius:3, padding:'2px 7px' }}>⚠ Only {stock} left</span>
                          : <span className="jost" style={{ fontSize:9, fontWeight:600, color:'#4A7A4A', background:'#EEF3EE', border:'1px solid #C8DFC8', borderRadius:3, padding:'2px 7px' }}>✓ In Stock</span>
                        }
                      </div>
                      <div className="jost" style={{ fontWeight:800, fontSize:17, color:T.navy, marginBottom:14 }}>
                        KSh {Number(item.price).toLocaleString()}
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:'auto' }}>
                        <button className="jost wl-cart-btn" disabled={stock === 0 || busy}
                          onClick={() => stock > 0 && toggleCart(item.product_id)}
                          style={{ flex:1, background:stock===0?T.creamMid:inCart?'#FDF0EE':T.gold, color:stock===0?T.muted:inCart?'#C0392B':T.navy, border:inCart?'1.5px solid #F5C6C0':'none', opacity:busy?0.7:1 }}>
                          {busy ? '…' : stock===0 ? 'Sold Out' : inCart ? '✕ Remove' : 'Add to Cart'}
                        </button>
                        <button className="jost wl-view-btn" onClick={() => navigate(`/product/${item.product_id}`)}>View</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop:48, border:`1px solid ${T.creamDeep}`, borderRadius:16, padding:'clamp(24px,4vw,40px)', background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:20, height:1, background:T.gold }} />
                  <span className="jost" style={{ fontSize:9, fontWeight:700, letterSpacing:'3px', color:T.gold, textTransform:'uppercase' }}>Ready to Checkout?</span>
                  <div style={{ width:20, height:1, background:T.gold }} />
                </div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:'clamp(16px,2.5vw,22px)', color:T.navy, marginBottom:6 }}>Move Your Favourites to Cart</h3>
                <p className="jost" style={{ fontSize:12, color:T.muted, lineHeight:1.7 }}>Items in your wishlist aren't reserved — add them to cart before they sell out.</p>
              </div>
              <button className="jost" onClick={() => navigate('/cart')}
                style={{ background:T.navy, color:T.white, border:'none', borderRadius:8, padding:'13px 32px', fontSize:11, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background=T.navyLight; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background=T.navy; e.currentTarget.style.transform='translateY(0)'; }}>
                Go to Cart 🛒
              </button>
            </div>
          </>
        )}
      </div>
      <InstagramStrip
        handle="@lukuprime"
        profileUrl="https://instagram.com/lukuprime"
        limit={12}
            />

      {/* ── FOOTER ── */}
     <Footer />
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:#F9F5EC}
  .jost{font-family:'Jost',sans-serif}
  a{text-decoration:none;color:inherit}

  .wl-marquee{display:flex;gap:56px;animation:marquee 28s linear infinite;white-space:nowrap}
  @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

  .nav-link{font-size:12px;font-weight:500;color:rgba(255,255,255,0.7);cursor:pointer;letter-spacing:1.5px;text-transform:uppercase;transition:color 0.2s;padding:4px 0;position:relative}
  .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#C8A951;transition:width 0.25s}
  .nav-link:hover{color:#DEC06A}
  .nav-link:hover::after{width:100%}

  .auth-btn{font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;border-radius:3px;padding:8px 18px;cursor:pointer;transition:all 0.2s}

  .wl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px}

  .wl-card{background:#fff;border-radius:20px;overflow:hidden;border:1px solid #E4D9C0;display:flex;flex-direction:column;transition:all 0.35s}
  .wl-card:hover{transform:translateY(-7px);box-shadow:0 24px 56px rgba(13,27,62,0.14);border-color:#C8A951}
  .wl-card:hover .wl-pimg{transform:scale(1.06)}
  .wl-pimg{width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;display:block}

  .wl-card.entering{animation:cardIn 0.4s ease both}
  @keyframes cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  .wl-card.leaving{animation:cardOut 0.33s ease forwards;pointer-events:none}
  @keyframes cardOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(0.88)}}

  .wl-remove-btn{position:absolute;top:10px;right:10px;border:none;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;transition:transform 0.2s,box-shadow 0.2s;background:rgba(255,255,255,0.92);backdrop-filter:blur(4px)}
  .wl-remove-btn:hover{transform:scale(1.22);box-shadow:0 4px 14px rgba(192,57,43,0.25)}

  .wl-cart-btn{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border:none;border-radius:8px;padding:10px 0;cursor:pointer;transition:all 0.2s}
  .wl-cart-btn:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
  .wl-cart-btn:disabled{cursor:not-allowed}
  .wl-view-btn{font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;border:1.5px solid #E4D9C0;border-radius:8px;padding:10px 14px;cursor:pointer;transition:all 0.2s;background:#fff;color:#0D1B3E;white-space:nowrap}
  .wl-view-btn:hover{border-color:#C8A951;background:#F9F5EC}

  .new-badge{position:absolute;top:10px;left:10px;background:#C8A951;color:#0D1B3E;font-family:'Jost',sans-serif;font-size:8px;font-weight:800;letter-spacing:2px;padding:3px 8px;border-radius:3px;text-transform:uppercase;z-index:2}

  .clear-btn{background:transparent;border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:7px 16px;font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.35);cursor:pointer;transition:all 0.2s}
  .clear-btn:hover{color:rgba(255,100,100,0.8);border-color:rgba(255,100,100,0.3);background:rgba(255,100,100,0.06)}

  .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(40px,8vw,100px) 20px;text-align:center}
  .empty-heart{position:relative;display:inline-flex;align-items:center;justify-content:center}
  .empty-pulse{position:absolute;width:80px;height:80px;border-radius:50%;border:2px solid rgba(200,169,81,0.25);animation:pulse 2.4s ease-in-out infinite}
  @keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.35);opacity:0}}

  .umenu{position:absolute;top:calc(100% + 10px);right:0;background:#fff;border:1px solid #E4D9C0;border-radius:14px;padding:8px;min-width:220px;box-shadow:0 24px 60px rgba(13,27,62,0.16);animation:mIn 0.18s ease;z-index:200}
  @keyframes mIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  .mitem{font-family:'Jost',sans-serif;font-size:13px;font-weight:500;padding:9px 12px;border-radius:9px;cursor:pointer;color:#0D1B3E;transition:background 0.15s;display:flex;align-items:center;gap:10px}
  .mitem:hover{background:#F9F5EC}
  .mitem.danger{color:#C0392B}
  .mitem.danger:hover{background:#FDF0EE}

  .skel{background:linear-gradient(90deg,#F0EAD8 25%,#F9F5EC 50%,#F0EAD8 75%);background-size:200% 100%;animation:sk 1.4s infinite;border-radius:6px}
  @keyframes sk{0%{background-position:-200% 0}100%{background-position:200% 0}}

  @media(max-width:768px){
    .wl-grid{grid-template-columns:repeat(2,1fr);gap:12px}
    .wl-card > div:last-child{padding:10px 10px 12px !important}
  }
  @media(max-width:440px){
    .wl-grid{grid-template-columns:1fr}
  }
`;