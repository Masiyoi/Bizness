import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import viewingIcon from '../assets/adstrip/viewing.png';
import sellingfastIcon from '../assets/adstrip/sellingfast.png';
import addtocartIcon from '../assets/adstrip/add-to-cart.png';
import hoursIcon from '../assets/adstrip/24-hours.png';
import informationIcon from '../assets/adstrip/information.png';
import orderIcon from '../assets/adstrip/orderplaced.png';
import returnIcon from '../assets/adstrip/return.png';
import toppickIcon from '../assets/adstrip/toppick.png';
import deliveryIcon from '../assets/adstrip/delivery (2).png';

import Navbar         from '../components/common/Navbar';
import Footer         from '../components/common/Footer';
import InstagramStrip from '../components/common/InstagramStrip';
import bookmarkIcon from '../assets/bookmark.png';
import addedIcon from '../assets/added.png';
import bookmarkedIcon from '../assets/bookmarked.png';
import zoomInIcon from '../assets/zoom-in.png';
import ProductCard    from '../components/home/ProductCard';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Variant {
  id:         number;
  product_id: number;
  color:      string;
  size:       string;
  stock:      number;
  sku:        string;
}

interface Product {
  id:          number;
  name:        string;
  price:       string;
  description: string;
  features:    string[];
  category:    string;
  stock:       number;
  images:      string[];
  image_url:   string;
  colors:      string[];
  sizes:       string[];
  variants:    Variant[];
  complete_the_look: number[];
  video_url:   string | null;
}

interface Review {
  id:         number;
  rating:     number;
  comment:    string | null;
  created_at: string;
  full_name:  string;
}

interface ReviewStats {
  total:   number;
  average: number;
  five:    number;
  four:    number;
  three:   number;
  two:     number;
  one:     number;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  navy:      '#000000',
  navyLight: '#1A1A1A',
  gold:      '#000000',
  goldLight: '#1A1A1A',
  cream:     '#FFFFFF',
  creamMid:  '#F5F5F5',
  creamDeep: '#E0E0E0',
  muted:     '#666666',
};

// ── Social proof messages ──────────────────────────────────────────────────────
interface ProofItem {
  icon: string | null;
  text: string;
}

const SOCIAL_PROOF: ProofItem[] = [
  { icon: viewingIcon, text: '3 people are viewing this right now' },
  { icon: sellingfastIcon, text: 'Selling fast — only a few left' },
  { icon: addtocartIcon, text: 'Someone in Nairobi just added this to cart' },
  { icon: hoursIcon, text: '12 people bought this in the last 24 hours' },
  { icon: informationIcon, text: '"Exactly as described!" — recent buyer' },
  { icon: orderIcon, text: 'Orders placed now ship within 24 hrs' },
  { icon: toppickIcon, text: 'Top pick in this category this week' },
  { icon: returnIcon, text: 'Return policy free 3day returns' },
  { icon: deliveryIcon, text: 'Same day delivery in Nairobi CBD' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isLightColor(color: string): boolean {
  const lightNames = ['white','ivory','cream','beige','yellow','snow','linen','wheat',
    'lightyellow','lightgray','lightgrey','silver','lavender','mintcream'];
  const lower = color.toLowerCase().replace(/\s+/g, '');
  if (lightNames.includes(lower)) return true;
  const hex = lower.startsWith('#') ? lower.slice(1) : null;
  if (hex && hex.length === 6) {
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return (r*0.299 + g*0.587 + b*0.114) > 186;
  }
  return false;
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div style={{ display:'flex', gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize:size, color: i<=Math.round(rating)?'#B8960C':'#DDDDDD', lineHeight:1 }}>
          {i <= Math.round(rating) ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

// ── Slideshow ─────────────────────────────────────────────────────────────────
// stock = -1 means "selection not made yet, hide overlays"
// stock =  0 means "genuinely sold out, show overlay"
// stock >  0 means show low-stock badge if <= 5
function Slideshow({ media, productName, stock }: {
  media:       { type: 'image' | 'video'; src: string }[];
  productName: string;
  stock:       number;
}) {
  const [active, setActive]         = useState(0);
  const [zoomLevels, setZoomLevels] = useState<Record<number, number>>({});
  const [zoomDir, setZoomDir]       = useState<Record<number, 1 | -1>>({});
  const [panOffsets, setPanOffsets] = useState<Record<number, { x: number; y: number }>>({});
  const videoRef     = useRef<HTMLVideoElement>(null);
  const mediaBoxRef  = useRef<HTMLDivElement>(null);
  const MAX_ZOOM  = 3;
  const ZOOM_STEP = 0.5;

  const clampPan = (x: number, y: number, scale: number) => {
    const box = mediaBoxRef.current;
    const w = box?.clientWidth  ?? 300;
    const h = box?.clientHeight ?? 300;
    const maxX = Math.max(0, ((scale - 1) * w) / 2);
    const maxY = Math.max(0, ((scale - 1) * h) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  // Same button zooms in step-by-step up to MAX_ZOOM, then — on further
  // clicks — zooms back out step-by-step instead of snapping to 1
  const bumpZoom = (idx: number) => {
    const current = zoomLevels[idx] ?? 1;
    const dir     = zoomDir[idx] ?? 1;
    let next    = current + ZOOM_STEP * dir;
    let nextDir = dir;
    if (next >= MAX_ZOOM) { next = MAX_ZOOM; nextDir = -1; }
    else if (next <= 1)   { next = 1;        nextDir = 1;  }

    setZoomDir(prev => ({ ...prev, [idx]: nextDir }));
    setZoomLevels(prev => ({ ...prev, [idx]: next }));
    setPanOffsets(prev => {
      if (next === 1) return { ...prev, [idx]: { x: 0, y: 0 } };
      const existing = prev[idx] ?? { x: 0, y: 0 };
      return { ...prev, [idx]: clampPan(existing.x, existing.y, next) };
    });
  };

  // ── Pan (drag-to-move) while zoomed in ──
  const dragPan = useRef<{ idx: number; startX: number; startY: number; startOffX: number; startOffY: number } | null>(null);

  const panStart = (idx: number, clientX: number, clientY: number) => {
    if ((zoomLevels[idx] ?? 1) <= 1) return;
    const existing = panOffsets[idx] ?? { x: 0, y: 0 };
    dragPan.current = { idx, startX: clientX, startY: clientY, startOffX: existing.x, startOffY: existing.y };
  };
  const panMove = (clientX: number, clientY: number) => {
    const d = dragPan.current;
    if (!d) return;
    const scale = zoomLevels[d.idx] ?? 1;
    const next  = clampPan(d.startOffX + (clientX - d.startX), d.startOffY + (clientY - d.startY), scale);
    setPanOffsets(prev => ({ ...prev, [d.idx]: next }));
  };
  const panEnd = () => { dragPan.current = null; };

  const touchStartX  = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    if ((zoomLevels[active] ?? 1) > 1) { panStart(active, e.touches[0].clientX, e.touches[0].clientY); return; }
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMoveMain = (e: React.TouchEvent) => {
    if (dragPan.current) {
      // Stop the page/viewport from scrolling or gesture-panning while the
      // user is actively dragging the zoomed image around with a finger
      e.preventDefault();
      e.stopPropagation();
      panMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (dragPan.current) { panEnd(); return; }
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) setActive(a => (a + 1) % media.length);
    else        setActive(a => (a - 1 + media.length) % media.length);
  };

  const onMouseDownMain = (e: React.MouseEvent) => { panStart(active, e.clientX, e.clientY); };
  const onMouseMoveMain = (e: React.MouseEvent) => { panMove(e.clientX, e.clientY); };
  const onMouseUpMain   = () => panEnd();

  const getPoster = (videoUrl: string) => videoUrl.replace(/\.(mp4|mov|webm|mkv|m4v)(\?.*)?$/i, '.jpg');

  // Play the video only while its slide is the active one; pause the moment the user scrolls away
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (media[active]?.type === 'video') {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [active, media]);

  useEffect(() => {
    setZoomLevels(prev => (prev[active] ? { ...prev, [active]: 1 } : prev));
    setZoomDir(prev => (prev[active] ? { ...prev, [active]: 1 } : prev));
    setPanOffsets(prev => (prev[active] ? { ...prev, [active]: { x: 0, y: 0 } } : prev));
  }, [active]);

  return (
    <div style={{ display:'flex', gap:0 }}>
      {/* ── Left vertical thumbnail strip (desktop only) ── */}
      {media.length > 1 && (
        <div className="lp-thumb-strip" style={{
          display:'flex', flexDirection:'column', gap:4,
          marginRight:8, flexShrink:0, width:80,
        }}>
          {media.map((m, i) => (
            <div key={i} onClick={() => setActive(i)} style={{
              width:80, height:80, flexShrink:0, cursor:'pointer',
              border:`2px solid ${i === active ? '#000' : 'transparent'}`,
              overflow:'hidden', background:'#f2f2f2', position:'relative',
            }}>
              <img
                src={m.type === 'video' ? getPoster(m.src) : m.src}
                alt=""
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/f2f2f2/000?text=LP'; }}
              />
              {m.type === 'video' && (
                <div style={{
                  position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(0,0,0,0.25)',
                }}>
                  <span style={{
                    width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.9)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#000',
                  }}>▶</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Main media ── */}
      <div style={{ flex:1, position:'relative' }}>
        <div
          ref={mediaBoxRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMoveMain}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDownMain}
          onMouseMove={onMouseMoveMain}
          onMouseUp={onMouseUpMain}
          onMouseLeave={onMouseUpMain}
          style={{
            overflow:'hidden', background:'#f2f2f2', lineHeight:0, aspectRatio:'1/1', position:'relative',
            cursor: (zoomLevels[active] ?? 1) > 1 ? 'grab' : 'default',
            touchAction: (zoomLevels[active] ?? 1) > 1 ? 'none' : 'pan-y',
          }}
        >
          {/* Media carousel using sliding track (like ProductCard) */}
          <div style={{
            display:'flex',
            width:`${media.length * 100}%`,
            height:'100%',
            transform:`translateX(${-active * (100 / media.length)}%)`,
            transition:'transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}>
            {media.map((m, i) => (
              <div key={i} style={{
                flex:`0 0 ${100 / media.length}%`,
                height:'100%',
                position:'relative',
                background:'#f2f2f2',
              }}>
                {m.type === 'video' ? (
                  <video
                    ref={videoRef}
                    src={m.src}
                    controls
                    playsInline
                    muted
                    preload="metadata"
                    style={{ width:'100%', height:'100%', display:'block', objectFit:'cover', background:'#000' }}
                  />
                ) : (
                  <>
                    <img
                      src={m.src}
                      alt={productName}
                      style={{
                        width:'100%',
                        height:'100%',
                        display:'block',
                        objectFit:'cover',
                        transform:`scale(${zoomLevels[i] ?? 1}) translate(${(panOffsets[i]?.x ?? 0) / (zoomLevels[i] ?? 1)}px, ${(panOffsets[i]?.y ?? 0) / (zoomLevels[i] ?? 1)}px)`,
                        transformOrigin:'center center',
                        transition: dragPan.current ? 'none' : 'transform 0.3s ease',
                        cursor: (zoomLevels[i] ?? 1) > 1 ? 'grab' : 'zoom-in',
                      }}
                      draggable={false}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f2f2f2/000?text=LP'; }}
                    />
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.preventDefault(); e.stopPropagation(); bumpZoom(i); }}
                      aria-label={(zoomLevels[i] ?? 1) > 1 && (zoomDir[i] ?? 1) === -1 ? 'Zoom out' : 'Zoom in'}
                      style={{
                        position:'absolute', bottom:12, right:12, zIndex:3,
                        width:34, height:34, borderRadius:'50%',
                        background:'rgba(255,255,255,0.9)', border:'none', cursor:'pointer',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        boxShadow:'0 2px 8px rgba(0,0,0,0.18)',
                      }}
                    >
                      <img
                        src={zoomInIcon}
                        alt=""
                        style={{
                          width:18, height:18, objectFit:'contain',
                          transform: (zoomLevels[i] ?? 1) > 1 && (zoomDir[i] ?? 1) === -1 ? 'rotate(45deg)' : 'none',
                          transition:'transform 0.2s ease',
                        }}
                      />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          {stock !== -1 && stock === 0 && (
            <div style={{
              position:'absolute', inset:0, background:'rgba(255,255,255,0.65)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <span style={{
                background:'#000', color:'#fff', fontFamily:"'Jost',sans-serif",
                fontWeight:700, fontSize:10, padding:'8px 24px',
                letterSpacing:'3px', textTransform:'uppercase',
              }}>Sold Out</span>
            </div>
          )}
          
          {/* ── Dot indicators ── */}
          {media.length > 1 && (
            <div style={{
              position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)',
              display:'flex', gap:6, zIndex:2,
            }}>
              {media.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{
                    width: i === active ? 20 : 8,
                    height:8, borderRadius:4,
                    background: i === active ? '#fff' : 'rgba(255,255,255,0.6)',
                    border:'none', cursor:'pointer',
                    transition:'all 0.25s ease', padding:0,
                    boxShadow:'0 2px 4px rgba(0,0,0,0.2)',
                  }}
                  aria-label={`View item ${i + 1}`}
                  aria-current={i === active ? 'true' : 'false'}
                />
              ))}
            </div>
          )}
        </div>



        {/* Mobile thumbnail strip (replaces dot indicators) */}
        {media.length > 1 && (
          <div className="lp-mobile-thumbs" style={{
            display:'none !important', gap:6, marginTop:8,
            overflowX:'auto', scrollbarWidth:'none',
          }}>
            {media.map((m, i) => (
              <div
                key={i}
                onClick={() => setActive(i)}
                style={{
                  flexShrink:0, width:64, height:64, cursor:'pointer',
                  border:`2px solid ${i === active ? '#000' : 'transparent'}`,
                  overflow:'hidden', background:'#f2f2f2', position:'relative',
                }}
              >
                <img
                  src={m.type === 'video' ? getPoster(m.src) : m.src} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x64/f2f2f2/000?text=LP'; }}
                />
                {m.type === 'video' && (
                  <div style={{
                    position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                    background:'rgba(0,0,0,0.25)',
                  }}>
                    <span style={{
                      width:18, height:18, borderRadius:'50%', background:'rgba(255,255,255,0.9)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, color:'#000',
                    }}>▶</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Social Proof Badge ────────────────────────────────────────────────────────
function SocialProofBadge() {
  const [msgIdx,  setMsgIdx]  = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setMsgIdx(i => (i+1) % SOCIAL_PROOF.length); setVisible(true); }, 400);
    }, 4500);
    return () => clearInterval(cycle);
  }, []);

  const item = SOCIAL_PROOF[msgIdx];

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      background:'transparent', border:'none',
      borderRadius:0, padding:'10px 0', marginBottom:20,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-4px)',
      transition:'opacity 0.35s ease, transform 0.35s ease',
    }}>
      {item.icon ? (
        <img
          src={item.icon}
          alt=""
          style={{
            width:24, height:24, flexShrink:0, objectFit:'contain',
          }}
        />
      ) : (
        <div style={{
          width:8, height:8, borderRadius:'50%', background:'#4A9A4A',
          flexShrink:0, boxShadow:'0 0 0 3px rgba(74,154,74,0.2)', animation:'pulse 2s infinite',
        }}/>
      )}
      <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.navy, fontWeight:500, lineHeight:1.4 }}>
        {item.text}
      </span>
    </div>
  );
}

// ── Variant Stock Badge ───────────────────────────────────────────────────────
function VariantStockBadge({ variant, hasVariants, selectionComplete, productStock, selectedColor, hasSizeDim }: {
  variant:           Variant | null;
  hasVariants:       boolean;
  selectionComplete: boolean;
  productStock:      number;
  selectedColor:     string;
  hasSizeDim:        boolean;
}) {
  // FIX: not done selecting yet → show contextual prompt, never "Sold Out"
  if (hasVariants && !selectionComplete) {
    return (
      <span style={{
        background:'transparent', border:'none',
        color:'#000', borderRadius:0, padding:'0',
        fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:800,
        letterSpacing:'1px', textTransform:'uppercase' as const,
      }}>
        {selectedColor && hasSizeDim ? 'Select a size' : 'Select options'}
      </span>
    );
  }

  // Selection complete but combo not found in DB = genuinely sold out combo
  if (hasVariants && selectionComplete && !variant) {
    return (
      <span style={{
        background:'#000', border:'1.5px solid #000', color:'#fff',
        borderRadius:0, padding:'5px 12px',
        fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700,
        letterSpacing:'1px', textTransform:'uppercase' as const,
      }}>
        Sold Out
      </span>
    );
  }

  const stock = variant ? variant.stock : productStock;

  if (stock === 0) return (
    <span style={{
      background:'#000', border:'1.5px solid #000', color:'#fff',
      borderRadius:0, padding:'5px 12px',
      fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:700,
      letterSpacing:'1px', textTransform:'uppercase' as const,
    }}>
      Sold Out
    </span>
  );

  if (stock <= 5) return (
    <span style={{
      background:'#000', border:'1.5px solid #000', color:'#fff',
      borderRadius:0, padding:'4px 12px',
      fontFamily:"'Jost',sans-serif", fontSize:10, fontWeight:700,
      letterSpacing:'1px', textTransform:'uppercase' as const,
    }}>
      Only {stock} left
    </span>
  );

  return (
    <span style={{
      background:'transparent', border:'none', color:'#4A7A4A',
      borderRadius:0, padding:'0',
      fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:600,
      letterSpacing:'1px', textTransform:'uppercase' as const,
    }}>
      In Stock — {stock} available
    </span>
  );
}

// ── Product Carousel Section ──────────────────────────────────────────────────
function ProductCarouselSection({ title, products, currentId }: { title: string; products: Product[]; currentId: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  // Group products into chunks of 3 so each scroll-snap "page" shows 3 cards
  const chunks: Product[][] = [];
  for (let i = 0; i < products.length; i += 3) {
    chunks.push(products.slice(i, i + 3));
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontFamily: "'Jost',sans-serif", fontWeight: 700,
        fontSize: 'clamp(14px,2vw,18px)', color: '#000000',
        marginBottom: 8, letterSpacing: '-0.2px',
      }}>
        {title}
      </h3>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 8,
        }}
        className="lp-carousel"
      >
        {chunks.map((chunk, ci) => (
          <div
            key={ci}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: 16,
              flex: '0 0 100%',
              scrollSnapAlign: 'start',
            }}
          >
            {chunk.map(p => (
              <div
                key={p.id}
                className="lp-carousel-item"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '0 0 calc((100% - 32px) / 3)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <ProductCard
                  product={p}
                  inCart={false}
                  inWishlist={false}
                  isAdmin={false}
                  onCartToggle={() => {}}
                  onWishlistToggle={() => {}}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared products cache (avoids RelatedProducts + CompleteTheLookGrid both
//    fetching the entire /api/products catalog separately on every page load) ──
let _allProductsCache: { data: Product[]; ts: number } | null = null;
let _allProductsInFlight: Promise<Product[]> | null = null;
const PRODUCTS_CACHE_TTL = 60000; // 60s

function fetchAllProductsCached(): Promise<Product[]> {
  const now = Date.now();
  if (_allProductsCache && now - _allProductsCache.ts < PRODUCTS_CACHE_TTL) {
    return Promise.resolve(_allProductsCache.data);
  }
  if (_allProductsInFlight) return _allProductsInFlight;
  _allProductsInFlight = axios.get('/api/products')
    .then(res => {
      _allProductsCache = { data: res.data, ts: Date.now() };
      _allProductsInFlight = null;
      return res.data;
    })
    .catch(err => { _allProductsInFlight = null; throw err; });
  return _allProductsInFlight;
}

// ── Related Products (Three Sections) ──────────────────────────────────────
function RelatedProducts({ category, currentId }: { category: string; currentId: number }) {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchAllProductsCached()
      .then(data => { if (!cancelled) { setAllProducts(data); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('recentlyViewed');
    const viewed = stored ? JSON.parse(stored) : [];
    const updated = [currentId, ...viewed.filter((id: number) => id !== currentId)].slice(0, 20);
    localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    setRecentlyViewed(updated);
  }, [currentId]);

  if (loading) return null;

  const customersAlsoBought = allProducts
    .filter(p =>
      p.id !== currentId &&
      (p.category ?? '').trim().toLowerCase() === (category ?? '').trim().toLowerCase()
    )
    .slice(0, 8);

  const boughtIds = new Set(customersAlsoBought.map(p => p.id));
  const customersAlsoViewed = allProducts
    .filter(p =>
      p.id !== currentId &&
      !boughtIds.has(p.id) &&
      (p.category ?? '').trim().toLowerCase() === (category ?? '').trim().toLowerCase()
    )
    .slice(0, 8);

  const recentProducts = recentlyViewed
    .filter(id => id !== currentId)
    .slice(0, 8)
    .map(id => allProducts.find(p => p.id === id))
    .filter((p): p is Product => !!p);

  if (customersAlsoBought.length === 0 && customersAlsoViewed.length === 0 && recentProducts.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      {customersAlsoBought.length > 0 && <ProductCarouselSection title="Customers Also Bought" products={customersAlsoBought} currentId={currentId} />}
      {customersAlsoViewed.length > 0 && <ProductCarouselSection title="Customers Also Viewed" products={customersAlsoViewed} currentId={currentId} />}
      {recentProducts.length > 0 && <ProductCarouselSection title="Recently Viewed" products={recentProducts} currentId={currentId} />}
    </div>
  );
}

// ── Reviews Section ───────────────────────────────────────────────────────────
function ReviewsSection({ productId }: { productId: number }) {
  const [open,    setOpen]    = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats,   setStats]   = useState<ReviewStats|null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    axios.get(`/api/reviews/product/${productId}`)
      .then(res => { setReviews(res.data.reviews); setStats(res.data.stats); setFetched(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, productId, fetched]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });

  const statRows: { label: string; key: keyof ReviewStats }[] = [
    { label:'5★', key:'five'  },
    { label:'4★', key:'four'  },
    { label:'3★', key:'three' },
    { label:'2★', key:'two'   },
    { label:'1★', key:'one'   },
  ];

  return (
    <div style={{ marginTop:40, fontFamily:"'Jost','DM Sans',sans-serif" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', background:'transparent', border:'none',
          borderTop:`1px solid ${T.creamDeep}`,
          padding:'18px 0', display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{
            fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700,
            letterSpacing:'2.5px', textTransform:'uppercase', color:T.navy,
          }}>
            Reviews
          </span>
          {stats && (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <Stars rating={stats.average ?? 0} size={12}/>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>
                  {Number(stats.average).toFixed(1)}
                </span>
              </div>
              <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>
                ({stats.total} review{stats.total !== 1 ? 's' : ''})
              </span>
            </>
          )}
        </div>
        <span style={{
          color:T.muted, fontSize:10, transition:'transform 0.25s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display:'inline-block',
        }}>
          ▼
        </span>
      </button>

      <div style={{ overflow:'hidden', maxHeight: open ? 3000 : 0, transition:'max-height 0.4s ease' }}>
        <div style={{
          background:'#fff', borderRadius:0, padding:'22px 22px 20px',
        }}>
          {loading && (
            <div style={{ textAlign:'center', padding:'28px 0', color:T.muted, fontSize:13 }}>
              Loading reviews…
            </div>
          )}
          {!loading && fetched && (
            <>
              {stats && stats.total > 0 && (
                <div style={{ marginBottom:4 }}>
                  {statRows.map(({ label, key }) => {
                    const count = stats[key] as number;
                    const pct   = stats.total ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:7 }}>
                        <span style={{ fontSize:10, fontWeight:700, color:T.muted, width:24, textAlign:'right' }}>
                          {label}
                        </span>
                        <div style={{ flex:1, height:6, background:T.creamDeep, borderRadius:3, overflow:'hidden' }}>
                          <div style={{
                            width:`${pct}%`, height:'100%', background:'#111111',
                            borderRadius:3, transition:'width 0.5s ease',
                          }}/>
                        </div>
                        <span style={{ fontSize:11, color:T.muted, width:18 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{
                height:1,
                background:'#E8E8E8',
                margin:'18px 0',
              }}/>
              {reviews.length === 0 ? (
                <div style={{ textAlign:'center', padding:'24px 0', fontSize:13, color:T.muted }}>
                  No reviews yet — be the first after your purchase!
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{
                      background:'#fff',
                      borderRadius:0, padding:'16px 18px',
                    }}>
                      <div style={{
                        display:'flex', alignItems:'flex-start',
                        justifyContent:'space-between', marginBottom:8,
                      }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.navy }}>{r.full_name}</div>
                          <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{fmtDate(r.created_at)}</div>
                        </div>
                        <Stars rating={r.rating} size={14}/>
                      </div>
                      {r.comment && (
                        <p style={{ fontSize:13, color:'rgba(13,27,62,0.75)', lineHeight:1.75, margin:0 }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Accordion Row ────────────────────────────────────────────────────────────
function AccordionRow({ label, body, children }: { label: string; body?: string; children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', background:'transparent', border:'none',
          padding:'16px 0', display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer',
          borderTop:'1px solid #E8E8E8',
        }}
      >
        <span style={{
          fontFamily:"'Jost',sans-serif", fontSize:11, fontWeight:700,
          letterSpacing:'2.5px', textTransform:'uppercase', color:'#111',
        }}>
          {label}
        </span>
        <span style={{
          fontSize:16, color:'#888', lineHeight:1,
          transition:'transform 0.25s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          display:'inline-block',
        }}>+</span>
      </button>
      <div style={{
        overflow:'hidden',
        maxHeight: open ? 2000 : 0,
        transition:'max-height 0.4s ease',
      }}>
        <div style={{ paddingBottom:18 }}>
          {children ? children : (
            <p style={{
              fontFamily:"'Jost',sans-serif", fontSize:13, color:'#555',
              lineHeight:1.8,
            }}>
              {body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Complete the Look Grid ────────────────────────────────────────────────────
function CompleteTheLookGrid({ ids, currentId }: { ids: number[]; currentId: number }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!ids || ids.length === 0) { setLoading(false); return; }
    fetchAllProductsCached()
      .then(all => {
        const matched = ids
          .map(pid => all.find(p => p.id === pid))
          .filter((p): p is Product => !!p && p.id !== currentId);
        setProducts(matched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ids, currentId]);

  if (loading) {
    return (
      <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'#888' }}>
        Loading complementary pieces…
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <p style={{ fontFamily:"'Jost',sans-serif", fontSize:13, color:'#555', lineHeight:1.8 }}>
        Style this piece with complementary items from our collection. Mix and match to create your signature aesthetic.
      </p>
    );
  }

  return (
    <div className="related-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:16 }}>
      {products.map(p => (
        <div key={p.id} style={{ position:'relative', overflow:'hidden' }}>
          <ProductCard
            product={p}
            inCart={false}
            inWishlist={false}
            isAdmin={false}
            onCartToggle={() => { navigate(`/product/${p.id}`); window.scrollTo({ top:0, behavior:'smooth' }); }}
            onWishlistToggle={() => {}}
          />
        </div>
      ))}
    </div>
  );
}

// ── Normalize raw API/list product shape (JSON-string fields → arrays, etc.) ──
function normalizeProduct(raw: any): Product {
  const p = { ...raw };
  if (!p.images || p.images.length === 0) p.images = p.image_url ? [p.image_url] : [];
  if (typeof p.images === 'string') p.images = JSON.parse(p.images);
  if (typeof p.features === 'string') p.features = JSON.parse(p.features || '[]');
  if (typeof p.colors === 'string') p.colors = JSON.parse(p.colors || '[]');
  if (!Array.isArray(p.colors)) p.colors = [];
  if (typeof p.sizes === 'string') p.sizes = JSON.parse(p.sizes || '[]');
  if (!Array.isArray(p.sizes)) p.sizes = [];
  if (typeof p.complete_the_look === 'string') p.complete_the_look = JSON.parse(p.complete_the_look || '[]');
  if (!Array.isArray(p.complete_the_look)) p.complete_the_look = [];
  return p;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { preview?: Product } | null;
  const previewProduct = navState?.preview ? normalizeProduct(navState.preview) : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  const [product,       setProduct]       = useState<Product|null>(previewProduct);
  const [variants,      setVariants]      = useState<Variant[]>(previewProduct?.variants || []);
  const [loading,       setLoading]       = useState(!previewProduct);

  // Re-seed from the freshly-clicked card's full data on every navigation, not
  // just the first mount (this component instance is reused across /product/:id
  // changes, so a useState initializer alone only ever fires once).
  useEffect(() => {
    if (previewProduct) {
      setProduct(previewProduct);
      setVariants(previewProduct.variants || []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  const [qty,           setQty]           = useState(1);
  const [inCart,        setInCart]        = useState(false);
  const [adding,        setAdding]        = useState(false);
  const [toast,         setToast]         = useState<{ text: string; icon?: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [colorError,    setColorError]    = useState(false);
  const [selectedSize,  setSelectedSize]  = useState('');
  const [sizeError,     setSizeError]     = useState(false);
  const [cartCount,     setCartCount]     = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [inWishlist,    setInWishlist]    = useState(false);
  const [salePrice,     setSalePrice]     = useState<number | null>(null);
  const [ratingStats,   setRatingStats]   = useState<ReviewStats | null>(null);

  // ── Derived variant state ──────────────────────────────────────────────────
  const hasVariants  = variants.length > 0;
  const hasColorDim  = hasVariants && variants.some(v => v.color && v.color !== '');
  const hasSizeDim   = hasVariants && variants.some(v => v.size  && v.size  !== '');

  const selectionComplete: boolean = (() => {
    if (!hasVariants) return true;
    if (hasColorDim && hasSizeDim)  return selectedColor !== '' && selectedSize !== '';
    if (hasColorDim && !hasSizeDim) return selectedColor !== '';
    if (!hasColorDim && hasSizeDim) return selectedSize  !== '';
    return true;
  })();

  const selectedVariant: Variant | null = (() => {
    if (!hasVariants || !selectionComplete) return null;
    return variants.find(v => {
      const colorMatch = hasColorDim ? v.color === selectedColor : true;
      const sizeMatch  = hasSizeDim  ? v.size  === selectedSize  : true;
      return colorMatch && sizeMatch;
    }) ?? null;
  })();

  const effectiveStock: number = (() => {
    if (!product)         return 0;
    if (!hasVariants)     return product.stock;
    if (!selectionComplete) return 0;
    return selectedVariant ? selectedVariant.stock : 0;
  })();

  const productSoldOut: boolean = hasVariants
    ? variants.every(v => v.stock === 0)
    : (product?.stock ?? 0) === 0;

  // FIX: pass -1 to slideshow when selection is pending, so no overlay shows
  const slideshowStock: number = (() => {
    if (!hasVariants) return effectiveStock;           // plain product — always show
    if (!selectionComplete) return -1;                 // pending — hide overlays
    return effectiveStock;                             // selection done — show real stock
  })();

  const isColorSoldOut = (color: string): boolean =>
    hasVariants && variants.filter(v => v.color === color).every(v => v.stock === 0);

  const isSizeSoldOut = (size: string): boolean => {
    if (!hasVariants) return false;
    if (selectedColor)
      return (variants.find(x => x.color === selectedColor && x.size === size)?.stock ?? 1) === 0;
    return variants.filter(v => v.size === size).every(v => v.stock === 0);
  };

  const getColorStock = (color: string): number | null => {
    if (!hasVariants) return null;
    if (hasSizeDim && !selectedSize) return null;
    const v = variants.find(x =>
      x.color === color && (hasSizeDim ? x.size === selectedSize : true)
    );
    return v ? v.stock : null;
  };

  const getSizeStock = (size: string): number | null => {
    if (!hasVariants) return null;
    if (hasColorDim && !selectedColor) return null;
    const v = variants.find(x =>
      x.size === size && (hasColorDim ? x.color === selectedColor : true)
    );
    return v ? v.stock : null;
  };

  const variantHint: string = (() => {
    if (!hasVariants || !selectionComplete || !selectedVariant) return '';
    if (selectedVariant.stock === 0) return 'This combination is sold out';
    if (selectedVariant.stock <= 5)  return `Only ${selectedVariant.stock} left`;
    return `${selectedVariant.stock} available`;
  })();

  // ── Cart / wishlist counts ─────────────────────────────────────────────────
  const fetchCartCount = useCallback(() => {
    axios.get('/api/cart')
      .then(res => setCartCount(res.data.reduce((s: number, i: any) => s + i.quantity, 0)))
      .catch(() => {});
  }, []);

  const fetchWishlistCount = useCallback(() => {
    axios.get('/api/wishlist').then(res => {
      setWishlistCount(res.data.length);
      setInWishlist(res.data.some((i: any) => i.product_id === Number(id)));
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    fetchCartCount();
    fetchWishlistCount();
    window.addEventListener('focus', fetchCartCount);
    window.addEventListener('focus', fetchWishlistCount);
    return () => {
      window.removeEventListener('focus', fetchCartCount);
      window.removeEventListener('focus', fetchWishlistCount);
    };
  }, [fetchCartCount, fetchWishlistCount]);

  useEffect(() => {
    const h = () => { fetchCartCount(); fetchWishlistCount(); };
    window.addEventListener('cartUpdated', h);
    return () => window.removeEventListener('cartUpdated', h);
  }, [fetchCartCount, fetchWishlistCount]);

  // ── Load product ───────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`/api/products/${id}`)
      .then(res => {
        const p = normalizeProduct(res.data);
        setProduct(p);
        setVariants(p.variants || []);
        setLoading(false);
      })
      .catch(() => { setLoading(false); navigate('/'); });
  }, [id]);

  // Fetch flash sale price for this product (if any)
  useEffect(() => {
    setSalePrice(null);
    axios.get('/api/products/flash-sales?limit=100')
      .then(res => {
        const match = (res.data as { id: number; sale_price: number }[])
          .find(p => p.id === Number(id));
        if (match) setSalePrice(match.sale_price);
      })
      .catch(() => {});
  }, [id]);

  // Fetch review rating summary for this product
  useEffect(() => {
    setRatingStats(null);
    axios.get(`/api/reviews/product/${id}`)
      .then(res => setRatingStats(res.data.stats))
      .catch(() => {});
  }, [id]);

  // ── Restore selections if item already in cart ─────────────────────────────
  useEffect(() => {
    if (!id) return;
    axios.get('/api/cart').then(res => {
      const item = res.data.find((i: any) => i.product_id === Number(id));
      if (item) {
        setInCart(true);
        if (item.selected_color) setSelectedColor(item.selected_color);
        if (item.selected_size)  setSelectedSize(item.selected_size);
      } else {
        setInCart(false);
      }
    }).catch(() => {});
  }, [id]);

  const showToast = (msg: string, icon?: string) => {
    setToast({ text: msg, icon });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const toggleWishlist = async () => {
    if (inWishlist) {
      // Optimistic update — change immediately
      setInWishlist(false);
      showToast('Removed from wishlist.');
      // Then sync with server
      try { await axios.delete(`/api/wishlist/${product!.id}`); }
      catch { setInWishlist(true); showToast('Failed to remove. Try again.'); }
    } else {
      // Optimistic update — change immediately
      setInWishlist(true);
      showToast('Added to wishlist!', '/favourite.png');
      // Then sync with server
      try { await axios.post('/api/wishlist', { product_id: product!.id }); }
      catch { setInWishlist(false); showToast('Failed to add. Try again.'); }
    }
    fetchWishlistCount();
  };

  // ── Color change ───────────────────────────────────────────────────────────
  // FIX: always clear size on color change — no stale-closure conditional block
  const handleColorChange = async (color: string) => {
    setSelectedColor(color);
    setSelectedSize('');        // always reset — prevents stale "complete" state
    setColorError(false);

    if (!inCart || !product) return;
    try {
      const cartRes  = await axios.get('/api/cart');
      const cartItem = cartRes.data.find((i: any) => i.product_id === product.id);
      if (cartItem) {
        await axios.patch(`/api/cart/${cartItem.id}`, {
          quantity:       cartItem.quantity,
          selected_color: color,
          selected_size:  null,   // cleared along with local state
        });
        showToast(`Colour updated to ${color}`);
      }
    } catch {}
  };

  // ── Size change ────────────────────────────────────────────────────────────
  const handleSizeChange = async (size: string) => {
    setSelectedSize(size);
    setSizeError(false);
    if (!inCart || !product) return;
    try {
      const cartRes  = await axios.get('/api/cart');
      const cartItem = cartRes.data.find((i: any) => i.product_id === product.id);
      if (cartItem) {
        await axios.patch(`/api/cart/${cartItem.id}`, {
          quantity:       cartItem.quantity,
          selected_color: selectedColor || cartItem.selected_color,
          selected_size:  size,
        });
        showToast(`Size updated to ${size}`);
      }
    } catch {}
  };

  // ── Cart toggle ────────────────────────────────────────────────────────────
  const handleCartToggle = async () => {
    if (!inCart) {
      if (product?.colors?.length && !selectedColor) {
        setColorError(true);
        setTimeout(() => setColorError(false), 600);
        showToast('Please select a colour first.');
        return;
      }
      if (product?.sizes?.length && !selectedSize) {
        setSizeError(true);
        setTimeout(() => setSizeError(false), 600);
        showToast('Please select a size first.');
        return;
      }
      if (hasVariants && selectedVariant && selectedVariant.stock === 0) {
        showToast('This combination is sold out.');
        return;
      }
    }

    setAdding(true);
    try {
      if (inCart) {
        const cartRes  = await axios.get('/api/cart');
        const cartItem = cartRes.data.find((i: any) => i.product_id === product!.id);
        if (cartItem) await axios.delete(`/api/cart/${cartItem.id}`);
        setInCart(false);
        setSelectedColor('');
        setSelectedSize('');
        showToast('Removed from cart.');
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        await axios.post('/api/cart', {
          product_id:     product!.id,
          quantity:       qty,
          selected_color: selectedColor || null,
          selected_size:  selectedSize  || null,
        });
        setInCart(true);
        showToast('Added to cart!', addedIcon);
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      }
    } catch {
      showToast('Could not update cart.');
    } finally {
      setAdding(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  // Only reached on a hard refresh / pasted link / back-forward nav with no
  // preview data carried over — a click from anywhere in the app renders the
  // full page immediately via the seeded preview product above, no wait.
  if (loading) return (
    <div style={{
      minHeight:'100vh', background:'#FFFFFF',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        width:38, height:38,
        border:`3px solid rgba(0,0,0,0.1)`, borderTopColor:'#111111',
        borderRadius:'50%', animation:'spin 0.8s linear infinite',
      }}/>
      <p style={{
        color:'rgba(0,0,0,0.45)', fontFamily:"'Jost',sans-serif",
        fontSize:13, letterSpacing:'1px', marginTop:16, textTransform:'uppercase',
      }}>
        Loading…
      </p>
    </div>
  );

  if (!product) return null;

  const images    = product.images.length
    ? product.images
    : ['https://placehold.co/600x600/F0EAD8/0D1B3E?text=Luku+Prime'];
  const media: { type: 'image' | 'video'; src: string }[] = [
    ...images.map(img => ({ type: 'image' as const, src: img })),
    ...(product.video_url ? [{ type: 'video' as const, src: product.video_url }] : []),
  ];
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const hasSizes  = Array.isArray(product.sizes)  && product.sizes.length  > 0;
  const qtyMax    = effectiveStock;

  return (
    <div className="font-serif bg-cream min-h-screen text-navy overflow-x-hidden">
      <style>{css}</style>

      {toast && (
        <div className="lp-toast" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {toast.icon && (
            <img src={toast.icon} alt="" style={{ width:18, height:18, objectFit:'contain', flexShrink:0 }} />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={() => { setCartCount(0); setWishlistCount(0); }}
      />

      <div className="lp-page-wrap" style={{
        maxWidth:1100, margin:'0 auto',
        padding:'clamp(20px,4vw,48px) clamp(16px,5%,5%) 80px',
        paddingTop:'calc(96px + clamp(20px,4vw,48px))',
      }}>
        {/* Breadcrumb */}
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          marginBottom:'clamp(18px,3vw,32px)', flexWrap:'wrap',
        }}>
          <button className="lp-back" onClick={() => navigate(-1)}>← Back</button>
          <span style={{ color:'#CCC', fontSize:10 }}>/</span>
          <button className="lp-back" style={{ color:T.muted }} onClick={() => navigate('/')}>Home</button>
          <span style={{ color:'#CCC', fontSize:10 }}>/</span>
          <span style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:T.muted }}>
            {product.category || 'Product'}
          </span>
          <span style={{ color:'#CCC', fontSize:10 }}>/</span>
          <span style={{
            fontFamily:"'Jost',sans-serif", fontSize:11, color:T.navy, fontWeight:600,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            maxWidth:'clamp(100px,30vw,220px)',
          }}>
            {product.name}
          </span>
        </div>

        <div className="lp-grid">

          {/* ── Slideshow ── */}
          <div className="lp-img-bleed">
            <Slideshow
              media={media}
              productName={product.name}
              stock={slideshowStock}
            />
          </div>

          {/* ── Info panel ── */}
          <div>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <h1 style={{
                fontFamily:"'Playfair Display',serif", fontWeight:800,
                fontSize:'clamp(22px,4vw,34px)', color:T.navy,
                lineHeight:1.15, marginBottom:14, flex:1,
              }}>
                {product.name}
              </h1>
              <button
                onClick={toggleWishlist}
                style={{
                  background:'none',
                  border:'none',
                  width:42, height:42,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', flexShrink:0,
                  transition:'all 0.2s', marginTop:4,
                  opacity: 1,
                }}
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <img 
                  src={inWishlist ? bookmarkedIcon : bookmarkIcon}
                  alt={inWishlist ? 'Bookmarked' : 'Bookmark'}
                  style={{ width:24, height:24, objectFit:'contain', transition:'all 0.3s ease' }}
                />
              </button>
            </div>



            {/* Price */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8, flexWrap:'wrap' }}>
              {salePrice !== null ? (
                <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
                  <span style={{
                    fontFamily:"'Inter',sans-serif", fontWeight:700,
                    fontSize:'clamp(18px,2.5vw,24px)', color:'#C2410C',
                  }}>
                    KSh {salePrice.toLocaleString()}
                  </span>
                  <span style={{
                    fontFamily:"'Inter',sans-serif", fontWeight:400,
                    fontSize:'clamp(13px,1.5vw,16px)', color:'#aaa',
                    textDecoration:'line-through',
                  }}>
                    KSh {Number(product.price).toLocaleString()}
                  </span>
                  <span style={{
                    background:'#EF4444', color:'#fff',
                    fontFamily:"'Jost',sans-serif", fontWeight:800, fontSize:11,
                    padding:'3px 9px', borderRadius:6, letterSpacing:'0.5px',
                  }}>
                    -{Math.round(((Number(product.price) - salePrice) / Number(product.price)) * 100)}%
                  </span>
                </div>
              ) : (
                <span style={{
                  fontFamily:"'Inter',sans-serif", fontWeight:700,
                  fontSize:'clamp(18px,2.5vw,24px)', color:'#000000',
                }}>
                  KSh {Number(product.price).toLocaleString()}
                </span>
              )}
            </div>

            {ratingStats && ratingStats.total > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                <Stars rating={ratingStats.average ?? 0} size={14}/>
                <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, color:T.muted }}>
                  {Number(ratingStats.average).toFixed(1)} ({ratingStats.total} review{ratingStats.total !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            <SocialProofBadge/>

            {product.features?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <div style={s.lbl}>Features</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {product.features.map((f, i) => (
                    <div key={i} style={{
                      display:'inline-flex', alignItems:'center', gap:6,
                      background:'#f5f5f5', border:'1px solid #E0E0E0',
                      borderRadius:0, padding:'6px 12px',
                      fontFamily:"'Jost',sans-serif", fontSize:12, color:T.navy, fontWeight:500,
                    }}>
                      <span style={{ color:'#111111' }}>✦</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasVariants && (
              <div style={{ marginBottom:12 }}>
                <VariantStockBadge
                  variant={selectedVariant}
                  hasVariants={hasVariants}
                  selectionComplete={selectionComplete}
                  productStock={product.stock}
                  selectedColor={selectedColor}
                  hasSizeDim={hasSizeDim}
                />
              </div>
            )}

            {/* ── COLOUR SELECTOR ── */}
            {hasColors && (
              <div className="lp-color-block" style={{ marginBottom:22 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ ...s.lbl, color:'#000', fontWeight:800 }}>Colour</div>
                  {selectedColor && (
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:700, color:T.navy }}>
                      {selectedColor}
                      {inCart && (
                        <span style={{ marginLeft:6, fontSize:10, color:'#4A7A4A', fontWeight:600 }}>✓ saved</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Colour swatches — circular product image thumbnails */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:10 }}>
                  {product.colors.map((color, i) => {
                    const active     = selectedColor === color;
                    const soldOut    = isColorSoldOut(color);
                    const colorStock = getColorStock(color);
                    const thumb      = product.images[i] || product.images[0] || product.image_url;
                    return (
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, width:46 }}>
                        <button
                          title={soldOut
                            ? `${color} — sold out`
                            : colorStock !== null
                              ? `${color} — ${colorStock} available`
                              : color}
                          onClick={() => !soldOut && handleColorChange(color)}
                          style={{
                            width:40, height:40, borderRadius:'50%', padding:0, border:'none',
                            boxShadow: active
                              ? '0 0 0 2px #fff, 0 0 0 4px #000'
                              : '0 0 0 2px transparent',
                            cursor: soldOut ? 'not-allowed' : 'pointer',
                            opacity: soldOut ? 0.4 : 1,
                            overflow:'hidden', background:'#f2f2f2',
                            transition:'box-shadow 0.18s, opacity 0.18s',
                            position:'relative', flexShrink:0,
                          }}
                          aria-label={`${color}${soldOut ? ' (sold out)' : ''}`}
                          aria-pressed={active}
                        >
                          <img
                            src={thumb}
                            alt={color}
                            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', borderRadius:'50%' }}
                            onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/f2f2f2/000?text=LP'; }}
                          />
                          {soldOut && (
                            <div style={{
                              position:'absolute', inset:0, borderRadius:'50%',
                              background:'rgba(255,255,255,0.65)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:12, color:'#555', fontWeight:700,
                            }}>✕</div>
                          )}
                        </button>
                        <span style={{
                          fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:700,
                          color: soldOut ? T.muted : active ? '#000' : '#666',
                          textAlign:'center', maxWidth:46,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        }}>
                          {color}
                        </span>

                      </div>
                    );
                  })}
                </div>


              </div>
            )}

            {/* ── SIZE SELECTOR ── */}
            {hasSizes && (
              <div style={{ marginBottom:22 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <div style={{ ...s.lbl, color:'#000', fontWeight:800 }}>Size</div>
                  {selectedSize && (
                    <span style={{ fontFamily:"'Jost',sans-serif", fontSize:12, fontWeight:700, color:T.navy }}>
                      {selectedSize}
                      {inCart && (
                        <span style={{ marginLeft:6, fontSize:10, color:'#4A7A4A', fontWeight:600 }}>✓ saved</span>
                      )}
                    </span>
                  )}
                </div>

                <div className={sizeError ? 'lp-shake' : ''} style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:8 }}>
                  {product.sizes
                    .filter(size =>
                      // FIX: only show sizes that exist for the selected color (or all if no color chosen)
                      selectedColor
                        ? variants.some(v => v.color === selectedColor && v.size === size)
                        : variants.some(v => v.size === size)
                    )
                    .map((size, i) => {
                      const active    = selectedSize === size;
                      const soldOut   = isSizeSoldOut(size);
                      const sizeStock = getSizeStock(size);
                      return (
                        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:40 }}>
                          <button
                            onClick={() => !soldOut && handleSizeChange(size)}
                            title={soldOut
                              ? `${size} — sold out`
                              : sizeStock !== null
                                ? `${size} — ${sizeStock} available`
                                : size}
                            style={{
                              width:'100%', padding:'7px 10px', borderRadius:0,
                              border: active ? '2px solid #000' : '1.5px solid #D0D0D0',
                              background: soldOut ? '#F5F5F5' : active ? '#000' : '#fff',
                              fontFamily:"'Inter',sans-serif", fontSize:12,
                              fontWeight:700,
                              color: soldOut ? '#AAA' : active ? '#fff' : '#000',
                              cursor: soldOut ? 'not-allowed' : 'pointer',
                              opacity: soldOut ? 0.5 : 1,
                              transition:'all 0.15s',
                              textDecoration: soldOut ? 'line-through' : 'none',
                              position:'relative',
                            }}
                          >
                            {size}
                            {!soldOut && sizeStock !== null && sizeStock > 0 && sizeStock <= 5 && (
                              <span style={{
                                position:'absolute', top:4, right:4,
                                width:5, height:5, borderRadius:'50%', background:'#111111',
                              }}/>
                            )}
                          </button>

                        </div>
                      );
                    })}
                </div>

                {sizeError ? (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#C0392B', fontWeight:700 }}>
                    ⚠ Please select a size to continue
                  </div>
                ) : selectedSize ? (
                  <div style={{ fontFamily:"'Jost',sans-serif", fontSize:11, color:'#4A7A4A', fontWeight:600 }}>
                    ✓ Size {selectedSize} selected{inCart ? ' · saved to cart' : ''}
                  </div>
                ) : null}
              </div>
            )}

            {/* ── QUANTITY ── */}
            {!productSoldOut && effectiveStock > 0 && (
              <div style={{ marginBottom:22 }}>
                <div style={{ ...s.lbl, color:'#000' }}>Quantity</div>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <button className="lp-qty" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <span style={{
                    fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:20,
                    color:T.navy, minWidth:24, textAlign:'center',
                  }}>
                    {qty}
                  </span>
                  <button className="lp-qty" onClick={() => setQty(q => Math.min(qtyMax, q+1))}>+</button>

                </div>
              </div>
            )}

            {/* ── CART BUTTON ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {productSoldOut ? (
                <button className="lp-btn" style={{ background:T.creamDeep, color:T.muted }} disabled>
                  Sold Out
                </button>
              ) : (hasVariants && selectedVariant && selectedVariant.stock === 0) ? (
                <button className="lp-btn" style={{ background:T.creamDeep, color:T.muted }} disabled>
                  This combination is Sold Out
                </button>
              ) : inCart ? (
                <>
                  <button className="lp-btn lp-btn-green" onClick={() => navigate('/cart')}>
                    ✓ In Cart — View Cart
                  </button>
                  <button className="lp-btn lp-btn-outline" onClick={handleCartToggle} disabled={adding}>
                    {adding ? '⏳ Updating…' : '✕ Remove from Cart'}
                  </button>
                </>
              ) : (
                <button
                  className="lp-btn"
                  style={{ background:`linear-gradient(135deg,#111111,#333333)`, color:'#FFFFFF' }}
                  onClick={handleCartToggle}
                  disabled={adding || (hasVariants && !selectedVariant)}
                >
                  {adding
                    ? '⏳ Adding…'
                    : hasVariants && !selectedColor && product.colors.length > 0
                      ? 'Select a colour to add to cart'
                      : hasVariants && !selectedSize && product.sizes.length > 0
                        ? 'Select a size to add to cart'
                        : `Add to Cart — KSh ${((salePrice ?? Number(product.price)) * qty).toLocaleString()}`}
                </button>
              )}
            </div>

            {/* ── ACCORDION DROPDOWNS ── */}
            {[
              {
                key: 'description',
                label: 'Description',
                content: product.description || 'Premium quality product. Carefully sourced and curated by Luku Prime.',
              },
              {
                key: 'care',
                label: 'Product Care Guide',
                content: 'Dry clean or gentle hand wash recommended. Avoid harsh chemicals. Store in cool, dry place away from direct sunlight.',
              },
            ].map(({ key, label, content: body }) => (
              <AccordionRow key={key} label={label} body={body} />
            ))}

            {product.complete_the_look && product.complete_the_look.length > 0 && (
              <AccordionRow label="Complete the Look">
                <CompleteTheLookGrid ids={product.complete_the_look} currentId={product.id} />
              </AccordionRow>
            )}

            <ReviewsSection productId={product.id}/>

          </div>
        </div>

        <div style={{ padding:'0 clamp(16px,5%,5%)' }}>
          <RelatedProducts category={product.category} currentId={product.id}/>
        </div>
      </div>

      <InstagramStrip handle="@lukuprime" profileUrl="https://instagram.com/lukuprime" limit={12}/>
      <Footer/>
    </div>
  );
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Jost:wght@300;400;500;600;700&display=swap');
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideIn { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin    { to { transform:rotate(360deg) } }
  @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)} 40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
  @keyframes pulse   { 0%,100%{box-shadow:0 0 0 3px rgba(74,154,74,0.2)} 50%{box-shadow:0 0 0 6px rgba(74,154,74,0.05)} }


  .lp-fade  { animation:fadeUp 0.45s ease forwards }
  .lp-shake { animation:shake 0.45s ease both }

  .lp-toast {
    position:fixed; top:18px; left:50%; transform:translateX(-50%);
    background:#FFFFFF; color:#111111;
    font-family:'Jost',sans-serif; font-size:13px; font-weight:700; letter-spacing:1px;
    border-radius:8px; padding:12px 24px; z-index:9999;
    box-shadow:0 8px 28px rgba(0,0,0,0.18); border:1px solid rgba(0,0,0,0.1);
    animation:slideIn 0.3s ease forwards; max-width:calc(100vw - 32px); text-align:center;
  }
  .lp-back {
    background:none; border:none; cursor:pointer;
    font-family:'Jost',sans-serif; font-size:10px; font-weight:700;
    color:rgba(0,0,0,0.5); display:flex; align-items:center; gap:5px;
    padding:0; transition:color 0.15s; letter-spacing:1px; text-transform:uppercase; white-space:nowrap;
  }
  .lp-back:hover { color:#111111 }
  .lp-qty {
    background:#fff; border:1.5px solid #000;
    border-radius:0; width:36px; height:36px; font-size:18px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:background 0.15s; color:#0D1B3E; flex-shrink:0;
  }
  .lp-qty:hover { background:rgba(0,0,0,0.12) }
  .lp-btn {
    border:none; border-radius:0; padding:16px 16px;
    font-family:'Inter',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:3px; text-transform:uppercase; cursor:pointer; transition:all 0.2s; width:100%;
  }
  .lp-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(0,0,0,0.18) }
  .lp-btn:disabled { opacity:0.6; cursor:not-allowed }
  .lp-btn-green   { background:#000; color:#fff }
  .lp-btn-outline { background:transparent !important; border:1.5px solid rgba(0,0,0,0.25); color:#111111 }
  .lp-btn-outline:hover:not(:disabled) { border-color:#111111; background:rgba(0,0,0,0.04) !important }

  /* ── Grid ── */
  .lp-grid { display:grid; grid-template-columns:1fr 1fr; gap:clamp(24px,4vw,48px); align-items:start }

  /* ── Desktop: thumbnail strip layout ── */
  .lp-thumb-strip { display:none !important }

  /* ── Mobile overrides ── */
  @media(max-width:768px) {
    .lp-grid { grid-template-columns:1fr; gap:0 }
    .lp-page-wrap { padding-left:0 !important; padding-right:0 !important }
    .lp-img-bleed { width:100vw }
    .lp-thumb-strip { display:none !important }
    .lp-mobile-thumbs { display:none !important }
    .lp-grid > div:last-child { padding:20px 16px 0 }
    .lp-color-block { margin-bottom:10px !important; }
  }
  @media(min-width:769px) {
    .lp-mobile-dots { display:none !important }
  }

  /* Related card — image scales naturally, hover lifts it */
  .lp-carousel::-webkit-scrollbar { display: none }
  .lp-carousel { -ms-overflow-style: none }
  .lp-carousel-item {
    transition: transform 0.2s ease;
    height: 100%;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }
  .lp-carousel-item:hover { transform: scale(1.02) }
  .lp-carousel-item > * {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }
  .related-card:hover .related-img { transform:scale(1.04) }
  .related-img { transition:transform 0.4s ease !important }
  @media(min-width:640px) {
    .related-grid { grid-template-columns:repeat(4,1fr) !important; gap:20px !important }
  }
`;

const s: Record<string, React.CSSProperties> = {
  lbl: {
    fontFamily:"'Jost',sans-serif", fontSize:9, fontWeight:800,
    letterSpacing:'2.5px', color:'#000',
    textTransform:'uppercase', marginBottom:6,
  },
};