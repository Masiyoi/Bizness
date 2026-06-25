// src/components/home/ProductCard.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../constants/theme';
import QuickViewModal from './QuickViewModal';

interface ProductCardProps {
  product:          Product & { images?: string[] };
  inCart:           boolean;
  inWishlist:       boolean;
  isAdmin:          boolean;
  onCartToggle:     (id: number) => void;
  onWishlistToggle: (id: number) => void;
  comparePrice?:    number | string | null; // original price before discount (e.g. flash sales)
}

const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const IMG_ASPECT = '125%';

const S = {
  card: {
    position:  'relative' as const,
    background:'transparent',
    width:     '100%',
    alignSelf: 'start' as const,
    minWidth:  0,
    overflow:  'visible' as const,
  } as React.CSSProperties,

  imgOuter: {
    position:   'relative' as const,
    width:      '100%',
    paddingTop: IMG_ASPECT,
    boxShadow:  '0 1px 6px rgba(0,0,0,0.07)',
    overflow:   'visible' as const,
    background: '#ffffff',
    flexShrink: 0,
  } as React.CSSProperties,

  imgInner: {
    position: 'absolute' as const,
    inset:    0,
    overflow: 'hidden' as const,
    display:  'block',
  } as React.CSSProperties,

  track: (index: number, dragging: boolean, dragOffset: number, count: number): React.CSSProperties => ({
    display:    'flex',
    width:      `${count * 100}%`,
    height:     '100%',
    transform:  `translateX(calc(${-index * (100 / count)}% + ${dragOffset}px))`,
    transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
    willChange: 'transform',
  }),

  slide: (count: number): React.CSSProperties => ({
    flex:       `0 0 ${100 / count}%`,
    height:     '100%',
    position:   'relative' as const,
    background: '#ffffff',
  }),

  img: (): React.CSSProperties => ({
    position:       'absolute',
    inset:          '6%',
    width:          '88%',
    height:         '88%',
    objectFit:      'contain' as const,
    objectPosition: 'center center',
    pointerEvents:  'none' as const,
  }),

  soldOverlay: {
    position:       'absolute' as const,
    inset:          0,
    background:     'rgba(239,239,239,0.65)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         3,
    pointerEvents:  'none' as const,
  } as React.CSSProperties,

  soldLabel: {
    background:    '#fff',
    color:         '#000',
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      9,
    fontWeight:    700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase' as const,
    padding:       '6px 14px',
  } as React.CSSProperties,

  newBadge: {
    position:      'absolute' as const,
    top:           10,
    left:          10,
    background:    '#000',
    color:         '#fff',
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      9,
    fontWeight:    700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    padding:       '4px 9px',
    zIndex:        2,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  stockBadge: {
    position:      'absolute' as const,
    top:           10,
    left:          10,
    background:    'rgba(255,255,255,0.92)',
    color:         '#000',
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      9,
    fontWeight:    700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    padding:       '4px 9px',
    zIndex:        2,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  actionBtn: (visible: boolean, inCart: boolean, isTouch: boolean): React.CSSProperties => ({
    position:       'absolute',
    bottom:         10,
    right:          10,
    width:          34,
    height:         34,
    borderRadius:   '50%',
    background:     inCart ? '#0D1B3E' : '#fff',
    border:         'none',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         10,
    opacity:        visible || isTouch ? 1 : 0,
    transform:      visible || isTouch ? 'scale(1)' : 'scale(0.75)',
    transition:     'opacity 0.2s ease, transform 0.2s ease, background 0.15s',
    boxShadow:      '0 2px 10px rgba(0,0,0,0.18)',
    pointerEvents:  'auto' as const,
  }),

  quickView: (visible: boolean): React.CSSProperties => ({
    position:      'absolute',
    bottom:        0,
    left:          0,
    right:         0,
    background:    'rgba(0,0,0,0.82)',
    color:         '#fff',
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      10,
    fontWeight:    600,
    letterSpacing: '2.5px',
    textTransform: 'uppercase' as const,
    textAlign:     'center' as const,
    padding:       '11px 0',
    paddingRight:  '52px',
    border:        'none',
    cursor:        'pointer',
    zIndex:        4,
    transform:     visible ? 'translateY(0)' : 'translateY(100%)',
    transition:    'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
    pointerEvents: visible ? 'auto' as const : 'none' as const,
  }),

  dotsBar: (visible: boolean): React.CSSProperties => ({
    position:       'absolute',
    bottom:         8,
    left:           0,
    right:          0,
    display:        'flex',
    justifyContent: 'center',
    gap:            4,
    zIndex:         3,
    opacity:        visible ? 1 : 0,
    transition:     'opacity 0.2s',
    pointerEvents:  'none' as const,
  }),

  dot: (active: boolean): React.CSSProperties => ({
    width:        active ? 14 : 4,
    height:       4,
    borderRadius: 2,
    background:   active ? '#fff' : 'rgba(255,255,255,0.55)',
    transition:   'width 0.25s ease, background 0.25s ease',
    boxShadow:    '0 1px 3px rgba(0,0,0,0.3)',
  }),

  arrowBtn: (side: 'left' | 'right', visible: boolean): React.CSSProperties => ({
    position:       'absolute',
    top:            '50%',
    [side]:         8,
    transform:      visible ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.8)',
    width:          26,
    height:         26,
    borderRadius:   '50%',
    background:     'rgba(255,255,255,0.92)',
    border:         'none',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         6,
    opacity:        visible ? 1 : 0,
    transition:     'opacity 0.2s ease, transform 0.2s ease',
    boxShadow:      '0 2px 8px rgba(0,0,0,0.15)',
    pointerEvents:  visible ? 'auto' as const : 'none' as const,
  }),

  arrowIcon: {
    fontSize:   10,
    color:      '#000',
    fontWeight: 700,
    lineHeight: 1,
    userSelect: 'none' as const,
  } as React.CSSProperties,

  info: {
    paddingTop: 9,
    minHeight:  52,
  } as React.CSSProperties,

  nameRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    gap:            6,
  } as React.CSSProperties,

  name: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      12,
    fontWeight:    500,
    letterSpacing: '0.2px',
    color:         '#0A0A0A',
    lineHeight:    1.35,
    overflow:      'hidden' as const,
    textOverflow:  'ellipsis' as const,
    whiteSpace:    'nowrap' as const,
    flex:          1,
    minWidth:      0,
  } as React.CSSProperties,

  priceWrap: {
    display:       'flex',
    alignItems:    'baseline',
    gap:           6,
    flexShrink:    0,
    whiteSpace:    'nowrap' as const,
  } as React.CSSProperties,

  compareAt: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      11,
    fontWeight:    400,
    color:         '#aaa',
    textDecoration:'line-through' as const,
    letterSpacing: '0.1px',
  } as React.CSSProperties,

  price: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      12,
    fontWeight:    400,
    color:         '#0A0A0A',
    letterSpacing: '0.1px',
    whiteSpace:    'nowrap' as const,
    flexShrink:    0,
  } as React.CSSProperties,

  priceSale: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      12,
    fontWeight:    600,
    color:         '#C2410C',
    letterSpacing: '0.1px',
    whiteSpace:    'nowrap' as const,
    flexShrink:    0,
  } as React.CSSProperties,

  meta: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      10,
    fontWeight:    400,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    color:         '#aaa',
    marginTop:     3,
    lineHeight:    1,
  } as React.CSSProperties,
};

const SWIPE_THRESHOLD = 35;

function CartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  );
}

export default function ProductCard({
  product, inCart, inWishlist, isAdmin, onCartToggle, onWishlistToggle, comparePrice,
}: ProductCardProps) {
  const stock  = product.stock ?? 0;
  const images = (product as any).images?.length >= 1
    ? (product as any).images
    : product.image_url
      ? [product.image_url]
      : ['https://placehold.co/400x480/EFEFEF/bbb?text=No+Image'];

  const count = images.length;

  const [hovered,       setHovered]       = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [activeIdx,     setActiveIdx]     = useState(0);
  const [dragOffset,    setDragOffset]    = useState(0);
  const [isTouch,       setIsTouch]       = useState(isTouchDevice);

  useEffect(() => { setIsTouch(isTouchDevice()); }, []);

  const dragging = useRef(false);
  const startX   = useRef(0);

  const goTo = useCallback((idx: number) => {
    setActiveIdx(Math.max(0, Math.min(count - 1, idx)));
  }, [count]);

  const prev = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); goTo(activeIdx - 1);
  }, [activeIdx, goTo]);

  const next = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); goTo(activeIdx + 1);
  }, [activeIdx, goTo]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (count <= 1) return;
    dragging.current = true;
    startX.current   = e.clientX;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setDragOffset(e.clientX - startX.current);
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const delta = e.clientX - startX.current;
    setDragOffset(0);
    if (Math.abs(delta) > SWIPE_THRESHOLD) delta < 0 ? goTo(activeIdx + 1) : goTo(activeIdx - 1);
  };
  const onMouseLeaveCard = () => {
    if (dragging.current) { dragging.current = false; setDragOffset(0); }
    setHovered(false);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (count <= 1) return;
    dragging.current = true;
    startX.current   = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    setDragOffset(e.touches[0].clientX - startX.current);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const delta = e.changedTouches[0].clientX - startX.current;
    setDragOffset(0);
    if (Math.abs(delta) > SWIPE_THRESHOLD) delta < 0 ? goTo(activeIdx + 1) : goTo(activeIdx - 1);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (Math.abs(dragOffset) > 5) e.stopPropagation();
  };

  const isDragging   = dragOffset !== 0;
  const isNew        = (product as any).created_at &&
    Date.now() - new Date((product as any).created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
  const showLowStock = stock > 0 && stock <= 5;

  // Quick View / Plus button should be visible on hover (desktop) or always-on-touch (mobile)
  const showOverlayUI = hovered || isTouch;

  const handleActionBtn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  // Force show button on touch tap
  const handleTouchBtn = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const hasDiscount = comparePrice != null && Number(comparePrice) > Number(product.price);

  return (
    <>
      <div
        style={S.card}
        onMouseEnter={() => !isTouch && setHovered(true)}
        onMouseLeave={onMouseLeaveCard}
      >
        <div style={S.imgOuter}>
          <Link
            to={`/product/${product.id}`}
            style={S.imgInner}
            aria-label={product.name}
            onClickCapture={onClickCapture}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div style={S.track(activeIdx, isDragging, dragOffset, count)}>
              {images.map((src: string, i: number) => (
                <div key={i} style={S.slide(count)}>
                  <img
                    src={src}
                    alt={i === 0 ? product.name : `${product.name} view ${i + 1}`}
                    style={S.img()}
                    draggable={false}
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/400x480/EFEFEF/bbb?text=No+Image';
                    }}
                  />
                </div>
              ))}
            </div>

            {isNew        && <div style={S.newBadge}>New</div>}
            {showLowStock && !isNew && <div style={S.stockBadge}>Only {stock} left</div>}

            {count > 1 && (
              <div style={S.dotsBar(isTouch || hovered || isDragging)}>
                {images.map((_: string, i: number) => (
                  <div key={i} style={S.dot(i === activeIdx)} />
                ))}
              </div>
            )}

            {stock === 0 && (
              <div style={S.soldOverlay}>
                <span style={S.soldLabel}>Sold Out</span>
              </div>
            )}

            {!isAdmin && stock > 0 && (
              <button
                style={S.quickView(showOverlayUI)}
                onClick={e => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
                onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
              >
                Quick View
              </button>
            )}
          </Link>

          {count > 1 && !isTouch && (
            <>
              <button style={S.arrowBtn('left',  hovered && activeIdx > 0)}         onClick={prev} aria-label="Previous image"><span style={S.arrowIcon}>‹</span></button>
              <button style={S.arrowBtn('right', hovered && activeIdx < count - 1)} onClick={next} aria-label="Next image"><span style={S.arrowIcon}>›</span></button>
            </>
          )}

          {!isAdmin && stock > 0 && (
            <button
              style={S.actionBtn(hovered, inCart, isTouch)}
              onClick={handleActionBtn}
              onTouchEnd={handleTouchBtn}
              aria-label={inCart ? 'View in bag' : 'Quick add'}
            >
              {inCart ? <CartIcon /> : (
                <span style={{ fontSize: 20, lineHeight: 1, color: '#000', fontWeight: 300, userSelect: 'none', marginTop: -1 }}>+</span>
              )}
            </button>
          )}
        </div>

        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
          <div style={S.info}>
            <div style={S.nameRow}>
              <span style={S.name}>{product.name}</span>
              <span style={S.priceWrap}>
                {hasDiscount && (
                  <span style={S.compareAt}>KSh {Number(comparePrice).toLocaleString()}</span>
                )}
                <span style={hasDiscount ? S.priceSale : S.price}>
                  KSh {Number(product.price).toLocaleString()}
                </span>
              </span>
            </div>
            {(product.category || showLowStock) && (
              <div style={S.meta}>
                {product.category}
                {product.category && showLowStock && ' · '}
                {showLowStock && `${stock} left`}
              </div>
            )}
          </div>
        </Link>
      </div>

      {quickViewOpen && (
        <QuickViewModal
          product={product}
          inCart={inCart}
          inWishlist={inWishlist}
          isAdmin={isAdmin}
          onCartToggle={onCartToggle}
          onWishlistToggle={onWishlistToggle}
          onClose={() => setQuickViewOpen(false)}
          salePrice={comparePrice != null ? Number(comparePrice) : null}
        />
      )}
    </>
  );
}
