// src/components/common/InstagramStrip.tsx
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Ornament from '../ui/Ornament';

export interface InstagramPost {
  id:        string | number;
  imageUrl:  string;
  videoUrl?: string;
  href?:     string;
  caption?:  string;
  timestamp?: string;
  source?:   string;
}

interface Props {
  handle?:    string;
  profileUrl?: string;
  limit?:     number;
}

// ── Skeleton tile ─────────────────────────────────────────────────────────────
function SkeletonTile() {
  return (
    <div className="flex-none rounded-[12px] bg-white border-[1.5px] border-cream-deep overflow-hidden"
      style={{ width: 'clamp(160px, 22vw, 260px)', aspectRatio: '3/4' }}>
      <div className="skel w-full h-full" />
    </div>
  );
}

export default function InstagramStrip({
  handle     = '@YOURBRAND_',
  profileUrl = 'https://instagram.com',
  limit      = 12,
}: Props) {
  const [posts,   setPosts]   = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [hovered, setHovered] = useState<string | number | null>(null);

  const trackRef = useRef<HTMLDivElement>(null);
  const drag     = useRef({ active: false, startX: 0, scrollLeft: 0 });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`/api/instagram/posts?limit=${limit}`)
      .then(res => { setPosts(Array.isArray(res.data) ? res.data : []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [limit]);

  // ── Drag-to-scroll ────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.pageX, scrollLeft: trackRef.current?.scrollLeft ?? 0 };
    if (trackRef.current) trackRef.current.style.cursor = 'grabbing';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.active || !trackRef.current) return;
    trackRef.current.scrollLeft = drag.current.scrollLeft - (e.pageX - drag.current.startX);
  };
  const endDrag = () => {
    drag.current.active = false;
    if (trackRef.current) trackRef.current.style.cursor = 'grab';
  };

  if (error) return null;

  return (
    <section className="px-[5%] py-[clamp(40px,6vw,72px)] bg-cream-mid border-t border-b border-cream-deep">
      <div className="max-w-content mx-auto">

        {/* ── Header ── */}
        <div className="flex justify-between items-end mb-[clamp(24px,4vw,40px)] flex-wrap gap-3">
          <div>
            <Ornament label="Community" />
            <h2
              className="font-serif font-bold text-navy mt-1"
              style={{ fontSize: 'clamp(20px,3vw,28px)' }}
            >
              Tag Us on Instagram
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <a
                href={profileUrl} target="_blank" rel="noopener noreferrer"
                className="font-sans text-[11px] font-bold tracking-[1.5px] uppercase text-gold border-b border-gold pb-[1px] hover:opacity-75 transition-opacity"
              >
                {handle}
              </a>
            </div>
          </div>

          <a
            href={profileUrl} target="_blank" rel="noopener noreferrer"
            className="font-sans text-[10px] font-bold tracking-[2px] uppercase bg-transparent border-[1.5px] border-cream-deep text-navy rounded-lg px-5 py-2.5 transition-all duration-200 shrink-0 hover:border-gold hover:text-gold"
          >
            Follow on Instagram →
          </a>
        </div>

        {/* ── Tile track ── */}
        <div
          ref={trackRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          style={{ cursor: 'grab', WebkitOverflowScrolling: 'touch' as any, userSelect: 'none' }}
        >
          {/* Loading skeletons */}
          {loading && [...Array(6)].map((_, i) => <SkeletonTile key={i} />)}

          {/* Real tiles */}
          {!loading && posts.map(post => {
            const isHovered = hovered === post.id;
            const Tag       = post.href ? 'a' : 'div';
            const linkProps = post.href
              ? { href: post.href, target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <Tag
                key={post.id}
                {...(linkProps as any)}
                onMouseEnter={() => setHovered(post.id)}
                onMouseLeave={() => setHovered(null)}
                className="flex-none snap-start rounded-[12px] overflow-hidden relative block no-underline transition-all duration-200"
                style={{
                  width:       'clamp(160px, 22vw, 260px)',
                  aspectRatio: '3/4',
                  background:  '#F0ECE3',
                  border:      isHovered ? '1.5px solid #C9A84C' : '1.5px solid #E8E0D0',
                  transform:   isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow:   isHovered
                    ? '0 12px 32px rgba(13,27,42,0.15)'
                    : '0 2px 8px rgba(13,27,42,0.06)',
                }}
              >
                {/* Media */}
                {post.videoUrl ? (
                  <video
                    src={post.videoUrl}
                    autoPlay muted loop playsInline
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <img
                    src={post.imageUrl}
                    alt={post.caption?.slice(0, 80) || 'Instagram post'}
                    draggable={false}
                    className="w-full h-full object-cover block"
                  />
                )}

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity duration-200"
                  style={{
                    background: 'rgba(13, 27, 42, 0.72)',
                    opacity: isHovered ? 1 : 0,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                    stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="0.8" fill="#C9A84C" stroke="none"/>
                  </svg>
                  <span className="font-sans text-[9px] font-bold tracking-[2px] uppercase text-white">
                    View Post
                  </span>
                </div>

                {/* Tagged badge */}
                {post.source === 'tagged' && (
                  <div className="absolute top-2.5 left-2.5 font-sans text-[9px] font-bold tracking-[1px] uppercase text-navy bg-gold rounded-full px-2 py-0.5">
                    Tagged Us
                  </div>
                )}

                {/* Video badge */}
                {post.videoUrl && (
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-navy/60 flex items-center justify-center">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                )}
              </Tag>
            );
          })}

          {/* Empty state */}
          {!loading && posts.length === 0 && (
            <div className="flex-1 text-center py-12">
              <div className="w-[72px] h-[72px] rounded-full bg-white border border-cream-deep flex items-center justify-center text-[32px] mx-auto mb-4">
                📸
              </div>
              <p className="font-sans text-[13px] text-muted">
                No posts yet — be the first to tag us!
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}