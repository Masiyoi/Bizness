// src/components/home/ProductCard.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../constants/theme';
import QuickViewModal from './QuickViewModal';
import { toCardImage } from '../../utils/cloudinary';

interface ProductCardProps {
  product:          Product & { images?: string[] };
  inCart:           boolean;
  inWishlist:       boolean;
  isAdmin:          boolean;
  onCartToggle:     (id: number) => void;
  onWishlistToggle: (id: number) => void;
  comparePrice?:    number | string | null;
}

const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const S = {
  card: {
    position:      'relative' as const,
    background:    'transparent',
    width:         '100%',
    display:       'flex',
    flexDirection: 'column' as const,
    gap:           '8px',
    padding:       '0',
    minWidth:      0,
  } as React.CSSProperties,

  imgContainer: {
    position:      'relative' as const,
    width:         '100%',
    aspectRatio:   '1',
    background:    'transparent',
    overflow:      'hidden' as const,
    display:       'flex',
    alignItems:    'center',
    justifyContent: 'center',
    cursor:        'pointer' as const,
  } as React.CSSProperties,

  imgOuter: {
    position:   'absolute' as const,
    inset:      0,
    overflow:   'hidden' as const,
    background: '#fff',
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
    overflow:   'hidden' as const,
  }),

  img: (): React.CSSProperties => ({
    position:       'absolute',
    inset:          0,
    width:          '100%',
    height:         '100%',
    objectFit:      'cover' as const,
    objectPosition: 'center center',
    pointerEvents:  'none' as const,
    display:        'block' as const,
    margin:         0,
    padding:        0,
    border:         'none',
  }),

  soldOverlay: {
    position:       'absolute' as const,
    inset:          0,
    background:     'rgba(0,0,0,0.7)',
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
    fontSize:      11,
    fontWeight:    700,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    padding:       '8px 16px',
  } as React.CSSProperties,

  badge: {
    position:      'absolute' as const,
    top:           12,
    left:          12,
    background:    '#000',
    color:         '#fff',
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      9,
    fontWeight:    700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    padding:       '5px 10px',
    zIndex:        2,
    pointerEvents: 'none' as const,
  } as React.CSSProperties,

  dotsBar: (visible: boolean): React.CSSProperties => ({
    position:       'absolute',
    bottom:         12,
    left:           '50%',
    transform:      'translateX(-50%)',
    display:        'flex',
    justifyContent: 'center',
    gap:            5,
    zIndex:         3,
    opacity:        visible ? 1 : 0,
    transition:     'opacity 0.2s',
    pointerEvents:  'none' as const,
  }),

  dot: (active: boolean): React.CSSProperties => ({
    width:        active ? 12 : 5,
    height:       5,
    borderRadius: 2.5,
    background:   active ? '#fff' : 'rgba(255,255,255,0.5)',
    transition:   'width 0.25s ease, background 0.25s ease',
  }),

  arrowBtn: (side: 'left' | 'right', visible: boolean): React.CSSProperties => ({
    position:       'absolute',
    top:            '50%',
    [side]:         12,
    transform:      visible ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.7)',
    width:          32,
    height:         32,
    borderRadius:   '50%',
    background:     'rgba(0,0,0,0.7)',
    border:         'none',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         6,
    opacity:        visible ? 1 : 0,
    transition:     'opacity 0.2s ease, transform 0.2s ease',
    pointerEvents:  visible ? 'auto' as const : 'none' as const,
  }),

  arrowIcon: {
    fontSize:   16,
    color:      '#fff',
    fontWeight: 700,
    lineHeight: 1,
    userSelect: 'none' as const,
  } as React.CSSProperties,

  quickViewFab: {
    position:       'absolute' as const,
    bottom:         10,
    right:          10,
    width:          34,
    height:         34,
    borderRadius:   '50%',
    background:     '#fff',
    border:         'none',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         4,
    boxShadow:      '0 2px 8px rgba(0,0,0,0.18)',
    transition:     'transform 0.2s ease, background 0.2s ease',
  } as React.CSSProperties,

  quickViewFabIcon: {
    fontSize:   18,
    color:      '#0A0A0A',
    fontWeight: 400,
    lineHeight: 1,
    userSelect: 'none' as const,
  } as React.CSSProperties,

  info: {
    display:        'flex',
    flexDirection:  'column' as const,
    gap:            '3px',
    padding:        '0',
  } as React.CSSProperties,

  name: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      13,
    fontWeight:    500,
    letterSpacing: '0.3px',
    color:         '#0A0A0A',
    lineHeight:    1.4,
    overflow:      'hidden' as const,
    textOverflow:  'ellipsis' as const,
    whiteSpace:    'nowrap' as const,
  } as React.CSSProperties,

  priceWrap: {
    display:       'flex',
    alignItems:    'center',
    gap:           8,
    whiteSpace:    'nowrap' as const,
    flexWrap:      'wrap' as const,
  } as React.CSSProperties,

  compareAt: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      12,
    fontWeight:    400,
    color:         '#aaa',
    textDecoration: 'line-through' as const,
    letterSpacing: '0.1px',
  } as React.CSSProperties,

  price: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      13,
    fontWeight:    500,
    color:         '#0A0A0A',
    letterSpacing: '0.1px',
  } as React.CSSProperties,

  priceSale: {
    fontFamily:    "'DM Sans', sans-serif",
    fontSize:      13,
    fontWeight:    700,
    color:         '#C2410C',
    letterSpacing: '0.1px',
  } as React.CSSProperties,
};

const SWIPE_THRESHOLD = 35;

export default function ProductCard({
  product, inCart, inWishlist, isAdmin, onCartToggle, onWishlistToggle, comparePrice,
}: ProductCardProps) {
  const stock  = product.stock ?? 0;
  const images = (product as any).images?.length >= 1
    ? (product as any).images
    : product.image_url
      ? [product.image_url]
      : ['https://placehold.co/500x500/EFEFEF/bbb?text=No+Image'];

  const count = images.length;

  const [hovered,       setHovered]       = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [activeIdx,     setActiveIdx]     = useState(0);
  const [dragOffset,    setDragOffset]    = useState(0);
  const [isTouch,       setIsTouch]       = useState(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

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
  const hasDiscount = comparePrice != null && Number(comparePrice) > Number(product.price);

  return (
    <>
      <div
        style={S.card}
        onMouseEnter={() => !isTouch && setHovered(true)}
        onMouseLeave={onMouseLeaveCard}
      >
        <div style={S.imgContainer}>
          <div style={S.imgOuter}>
            <Link
              to={`/product/${product.id}`}
              style={{ display: 'block', width: '100%', height: '100%', overflow: 'hidden', border: 'none' }}
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
                      src={toCardImage(src)}
                      alt={i === 0 ? product.name : `${product.name} view ${i + 1}`}
                      style={S.img()}
                      draggable={false}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/500x500/EFEFEF/bbb?text=No+Image';
                      }}
                    />
                  </div>
                ))}
              </div>
            </Link>

            {isNew && <div style={S.badge}>New</div>}
            {showLowStock && !isNew && <div style={{ ...S.badge, background: '#C2410C' }}>Only {stock} left</div>}

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
                style={S.quickViewFab}
                onClick={e => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
                onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
                aria-label="Quick view"
              >
                <span style={S.quickViewFabIcon}>+</span>
              </button>
            )}
          </div>

          {count > 1 && !isTouch && (
            <>
              <button style={S.arrowBtn('left',  hovered && activeIdx > 0)}         onClick={prev} aria-label="Previous image"><span style={S.arrowIcon}>‹</span></button>
              <button style={S.arrowBtn('right', hovered && activeIdx < count - 1)} onClick={next} aria-label="Next image"><span style={S.arrowIcon}>›</span></button>
            </>
          )}
        </div>

        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit', border: 'none', display: 'block' }}>
          <div style={S.info}>
            <div style={S.name}>{product.name}</div>
            <div style={S.priceWrap}>
              {hasDiscount && (
                <span style={S.compareAt}>KSh {Number(comparePrice).toLocaleString()}</span>
              )}
              <span style={hasDiscount ? S.priceSale : S.price}>
                KSh {Number(product.price).toLocaleString()}
              </span>
            </div>
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
          salePrice={comparePrice != null ? Number(comparePrice) : undefined}
        />
      )}
    </>
  );
}
