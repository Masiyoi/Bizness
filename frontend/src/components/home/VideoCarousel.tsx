// src/components/home/VideoCarousel.tsx
import { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export interface VideoTile {
  id: number;
  src: string;
  poster: string;
  badge: string;
  headline: string;
  sub: string;
  ctaLabel: string;
  ctaHref: string;
  accentLight: boolean;
  tileHref?: string;
}

export const VIDEO_TILES: VideoTile[] = [
  {
    id: 1,
    src: 'https://res.cloudinary.com/dfiy43f01/video/upload/v1780227245/Effortless_Bridal_Makeup_Looks_to_Refresh_Your_Routine_-_Pin-1145251380255199740_lsbslj.mp4',
    poster: '/images/street-style-01-poster.jpg',
    badge: 'New Drop',
    headline: 'Streets Never Sleep',
    sub: 'Fresh drip straight from the block — drop live now.',
    ctaLabel: 'Shop the Look',
    ctaHref: '/categories/new-arrivals',
    tileHref: '/categories/new-arrivals',
    accentLight: true,
  },
  {
    id: 2,
    src: 'https://res.cloudinary.com/dfiy43f01/video/upload/v1776253181/vid2_upoe8o.mp4',
    poster: '/images/street-style-02-poster.jpg',
    badge: "Editor's Pick",
    headline: 'Voice of the Streets',
    sub: 'Classy look from the streets of Nairobi.',
    ctaLabel: 'Explore our collection',
    ctaHref: '/categories/best-sellers',
    tileHref: '/categories/best-sellers',
    accentLight: true,
  },
];

// ─── Injected styles ──────────────────────────────────────────────────────────
const TILE_STYLES = `
  .video-tile { aspect-ratio: 16 / 11; }
  @media (max-width: 640px) {
    .video-tile { aspect-ratio: 4 / 5; }
  }
  .vc-cta { transition: opacity 0.2s; }
  .vc-cta:hover { opacity: 0.72 !important; }
`;

// ─── Individual tile ──────────────────────────────────────────────────────────
function Tile({ tile }: { tile: VideoTile }) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate     = useNavigate();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = 1.0;
      v.muted = true;
    }
  }, []);

  // ── Intersection Observer: pause when < 50 % visible ──────────────
  useEffect(() => {
    const container = containerRef.current;
    const v         = videoRef.current;
    if (!container || !v) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
        if (!visible) {
          if (!v.paused) v.pause();
        } else {
          if (v.paused) v.play().catch(() => {});
        }
      },
      { threshold: [0, 0.5] }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleTileClick = () => {
    if (tile.tileHref) navigate(tile.tileHref);
  };

  const textColor = tile.accentLight ? '#FFFFFF' : '#0A1628';
  const overlayBg = tile.accentLight
    ? 'linear-gradient(to top, rgba(10,22,40,0.78) 0%, rgba(10,22,40,0.22) 55%, transparent 100%)'
    : 'linear-gradient(to top, rgba(250,247,242,0.88) 0%, rgba(250,247,242,0.28) 55%, transparent 100%)';

  // Badge colours: white text on dark semi-transparent pill
  const badgeBg   = tile.accentLight ? 'rgba(255,255,255,0.18)' : 'rgba(10,22,40,0.18)';
  const badgeText = tile.accentLight ? '#FFFFFF' : '#0A1628';

  // CTA colour: white on dark tiles, near-black on light tiles
  const ctaColor = tile.accentLight ? '#FFFFFF' : '#0A1628';

  return (
    <div
      ref={containerRef}
      className="video-tile"
      onClick={handleTileClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        cursor: tile.tileHref ? 'pointer' : 'default',
        background: '#0A1628',
      }}
    >
      {/* ── Video ── */}
      <video
        ref={videoRef}
        src={tile.src}
        poster={tile.poster}
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: hovered ? 'scale(1.03)' : 'scale(1)',
          transition: 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      />

      {/* ── Gradient overlay ── */}
      <div style={{ position: 'absolute', inset: 0, background: overlayBg }} />

      {/* ── Badge (top-left) ── */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 22,
          background: badgeBg,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          color: badgeText,
          border: `1px solid ${tile.accentLight ? 'rgba(255,255,255,0.3)' : 'rgba(10,22,40,0.3)'}`,
          fontFamily: 'sans-serif',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '1.8px',
          textTransform: 'uppercase',
          padding: '4px 11px',
          borderRadius: 20,
        }}
      >
        {tile.badge}
      </div>

      {/* ── Text block (bottom-left) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 28,
          right: 28,
          color: textColor,
        }}
      >
        <h3
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 'clamp(20px, 3.2vw, 36px)',
            fontWeight: 700,
            margin: '0 0 6px',
            lineHeight: 1.12,
            letterSpacing: '-0.4px',
          }}
        >
          {tile.headline}
        </h3>
        <p
          style={{
            fontFamily: 'sans-serif',
            fontSize: 'clamp(12px, 1.4vw, 15px)',
            margin: '0 0 16px',
            opacity: 0.88,
            maxWidth: 440,
            lineHeight: 1.55,
          }}
        >
          {tile.sub}
        </p>

        <Link
          to={tile.ctaHref}
          className="vc-cta"
          onClick={e => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: 'sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: ctaColor,
            borderBottom: `1.5px solid ${ctaColor}`,
            paddingBottom: 2,
            opacity: 1,
          }}
        >
          {tile.ctaLabel} <span style={{ fontSize: 14 }}>→</span>
        </Link>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function VideoCarousel({
  tiles,
  bordered = true,
}: {
  tiles?: VideoTile[];
  bordered?: boolean;
}) {
  const displayTiles = tiles ?? VIDEO_TILES;
  const showHeader   = !tiles;

  return (
    <>
      <style>{TILE_STYLES}</style>

      <section
        aria-label="Street style video features"
        style={{
          width: '100%',
          paddingBottom: showHeader ? 'clamp(40px, 6vw, 80px)' : 0,
        }}
      >
        {showHeader && (
          <div style={{ padding: '0 5%', marginBottom: 20 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <span
                style={{
                  width: 28,
                  height: 1.5,
                  background: '#0A1628',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: '#0A1628',
                }}
              >
                Style in Motion
              </span>
            </div>
            <h2
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 'clamp(18px, 3vw, 26px)',
                fontWeight: 700,
                margin: 0,
                color: '#0A1628',
              }}
            >
              Street Fashion Spotlight
            </h2>
          </div>
        )}

        {/* No vc-frame class — tiles render edge-to-edge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {displayTiles.map(tile => (
            <Tile key={tile.id} tile={tile} />
          ))}
        </div>
      </section>
    </>
  );
}