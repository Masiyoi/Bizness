// src/components/home/VideoCarousel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Styled video tile component.
// • Accepts an optional `tiles` prop so Homepage can split top / bottom
// • Accepts an optional `bordered` prop (default: true) for gold frame
// • Edge-to-edge layout within frame (no border-radius on tiles)
// • Cinematic playback (1.0×)
// • Unmuted by default — user can mute with the sound button
// • Clicking tile navigates to tileHref (no play/pause toggle)
// • Play/pause overlay removed
// • Responsive aspect ratio: 16/7 desktop → 9/16 mobile
// • Full original styling: serif headline, gold CTA, badge typography,
//   gradient overlay, frosted-glass sound button
// • Auto-mutes AND auto-pauses when tile scrolls past 50% visibility;
//   re-mutes on return so user must intentionally unmute each visit
// ─────────────────────────────────────────────────────────────────────────────
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
  /** Clicking anywhere on the tile navigates here */
  tileHref?: string;
}

export const VIDEO_TILES: VideoTile[] = [
  {
    id: 1,
    src: 'https://res.cloudinary.com/dfiy43f01/video/upload/v1776335332/vid1_xuoo4c.mp4',
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
  .video-tile { aspect-ratio: 16 / 7; }
  @media (max-width: 640px) {
    .video-tile { aspect-ratio: 9 / 16; }
  }
  .vc-sound-btn {
    transition: background 0.2s, transform 0.15s;
  }
  .vc-sound-btn:hover {
    background: rgba(255,255,255,0.32) !important;
    transform: scale(1.08);
  }
  .vc-cta { transition: opacity 0.2s; }
  .vc-cta:hover { opacity: 0.72 !important; }
`;

const FRAME_STYLES = `
  .vc-frame {
    border: 1.5px solid #C8A951;
    outline: 1px solid rgba(200, 169, 81, 0.18);
    outline-offset: 4px;
    margin: 0 5%;
    overflow: hidden;
  }
`;

// ─── Individual tile ──────────────────────────────────────────────────────────
function Tile({ tile }: { tile: VideoTile }) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate     = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [muted,   setMuted]   = useState(false); // unmuted on first view

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = 1.0;
  }, []);

  // ── Intersection Observer: mute + pause when < 50 % visible ──────────────
  useEffect(() => {
    const container = containerRef.current;
    const v         = videoRef.current;
    if (!container || !v) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;

        if (!visible) {
          // Scrolled away — mute and pause regardless of user preference
          v.muted = true;
          setMuted(true);
          if (!v.paused) v.pause();
        } else {
          // Back in view — resume but muted so user re-unmutes intentionally
          v.muted = true;
          setMuted(true);
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

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  };

  const textColor = tile.accentLight ? '#FFFFFF' : '#0A1628';
  const overlayBg = tile.accentLight
    ? 'linear-gradient(to top, rgba(10,22,40,0.78) 0%, rgba(10,22,40,0.22) 55%, transparent 100%)'
    : 'linear-gradient(to top, rgba(250,247,242,0.88) 0%, rgba(250,247,242,0.28) 55%, transparent 100%)';

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
        muted={muted}
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
          background: 'rgba(200,169,81,0.92)',
          color: '#0A1628',
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

      {/* ── Sound toggle (top-right) ── */}
      <button
        className="vc-sound-btn"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        style={{
          position: 'absolute',
          top: 14,
          right: 16,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.22)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {muted ? (
          /* Speaker with X — muted */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/>
            <line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : (
          /* Speaker with waves — unmuted */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>

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
    color: '#C8A951',
    borderBottom: '1.5px solid #C8A951',
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
      {bordered && <style>{FRAME_STYLES}</style>}

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
                  background: '#C8A951',
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
                  color: '#C8A951',
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

        <div
          className={bordered ? 'vc-frame' : undefined}
          style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
        >
          {displayTiles.map(tile => (
            <Tile key={tile.id} tile={tile} />
          ))}
        </div>
      </section>
    </>
  );
}