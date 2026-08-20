// src/components/home/ReviewSection.tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { HomepageReview } from '../../constants/theme';
interface ReviewSectionProps {
  reviews: HomepageReview[];
  loading: boolean;
  isAdmin: boolean;
}
function ReviewCard({ review, navigate }: { review: HomepageReview; navigate: (path: string) => void }) {
  const nameParts = review.full_name.split(' ');
  const displayName = nameParts[0] + (nameParts[1] ? ` ${nameParts[1][0]}.` : '');
  return (
    <div
      onClick={() => navigate(`/product/${review.product_id}`)}
      className="group w-full max-w-[210px] mx-auto shrink-0 bg-white rounded-[12px] overflow-hidden border border-cream-deep cursor-pointer transition-all duration-200 hover:border-black flex flex-col relative"
    >
      <div className="relative w-full h-[140px] bg-[#F5F5F5] overflow-hidden">
        {review.media && review.media.length > 0 ? (
          review.media[0].media_type === 'video' ? (
            <video
              src={review.media[0].url}
              className="w-full h-full object-cover"
              muted
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={review.media[0].url}
              alt={review.product_name}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <img
            src={review.product_image ?? `https://placehold.co/400x400/0A0A0A/ffffff?text=LP`}
            alt={review.product_name}
            onError={e => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/400x400/0A0A0A/ffffff?text=LP`;
            }}
            className="w-full h-full object-cover"
          />
        )}
        {review.media && review.media.length > 1 && (
          <span className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white rounded-full px-2 py-0.5">
            +{review.media.length - 1}
          </span>
        )}
        <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-[#0A0A0A] rounded-full px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
          View &rarr;
        </span>
      </div>
      <div className="flex flex-col items-center text-center gap-1 px-3 pt-2.5">
        <div className="flex gap-0.5">
          {[1,2,3,4,5].map(s => (
            <span
              key={s}
              style={{
                fontSize: 11,
                color: s <= review.rating ? '#B8960C' : '#D1D5DB',
              }}
            >
              &#9733;
            </span>
          ))}
        </div>
        <div className="font-sans text-[11px] font-bold text-navy">
          {displayName}
        </div>
        <span className="text-[9px] font-bold text-[#3A3A3A] bg-[#F0F0F0] border border-[#D1D5DB] rounded-full px-2 py-0.5 inline-flex items-center gap-1">
          &#10003; Verified purchase
        </span>
      </div>
      <div className="px-3 pb-3 pt-2">
        <p className="font-sans text-[10.5px] text-[#3A3A4A] leading-[1.6] text-center line-clamp-3">
          {review.comment}
        </p>
        <div className="font-sans text-[9px] text-muted text-center mt-1.5 truncate">
          {new Date(review.created_at).toLocaleDateString('en-KE', {
            month: 'short',
            year: 'numeric',
          })} &middot; {review.product_name}
        </div>
      </div>
    </div>
  );
}
function ScrollingColumn({
  reviews,
  speed,
  navigate,
}: {
  reviews: HomepageReview[];
  speed: number;
  navigate: (path: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || reviews.length === 0) return;
    let raf = 0;
    let lastTime = performance.now();
    const tick = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      if (!pausedRef.current) {
        el.scrollTop += (speed * dt) / 1000;
        const half = el.scrollHeight / 2;
        if (half > 0 && el.scrollTop >= half) {
          el.scrollTop -= half;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed, reviews.length]);
  const pause = () => { pausedRef.current = true; };
  const scheduleResume = (delay = 1200) => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => { pausedRef.current = false; }, delay);
  };
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, []);
  if (reviews.length === 0) return null;
  const doubled = [...reviews, ...reviews];
  return (
    <div
      ref={scrollRef}
      className="lp-review-col flex-1 min-w-0 overflow-y-auto overscroll-contain"
      style={{ scrollbarWidth: 'none' }}
      onMouseEnter={pause}
      onMouseLeave={() => scheduleResume(0)}
      onTouchStart={pause}
      onTouchEnd={() => scheduleResume()}
      onWheel={() => { pause(); scheduleResume(); }}
    >
      <div className="flex flex-col gap-3 pb-3">
        {doubled.map((review, idx) => (
          <ReviewCard key={`${review.id}-${idx}`} review={review} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}
export default function ReviewSection({ reviews, loading }: ReviewSectionProps) {
  const navigate = useNavigate();
  const buildColumns = (cols: number) => {
    const columns: HomepageReview[][] = Array.from({ length: cols }, () => []);
    reviews.forEach((r, i) => columns[i % cols].push(r));
    return columns;
  };
  const mobileColumns = buildColumns(2);
  const desktopColumns = buildColumns(3);
  const speeds = [18, 24, 14];
  return (
    <section className="px-[5%] py-[clamp(40px,6vw,72px)] bg-white border-b border-cream-deep">
      <div className="max-w-content mx-auto">
        <div className="relative flex flex-col items-center text-center mb-[clamp(24px,4vw,40px)]">
          <span className="font-sans text-[10px] font-bold tracking-[2px] uppercase text-muted">
            We'll Let It Speak For Itself
          </span>
          <h2 className="font-serif font-bold text-navy mt-1" style={{ fontSize: 'clamp(20px,3vw,28px)' }}>
            From the Family
          </h2>
          {!loading && reviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <span key={s} style={{ fontSize: 13, color: '#B8960C' }}>&#9733;</span>
                ))}
              </div>
              <span className="font-sans text-[11px] text-muted font-semibold">
                {reviews.length}+ verified reviews
              </span>
            </div>
          )}
        </div>
        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[280px] bg-white rounded-[16px] overflow-hidden border border-cream-deep">
                <div className="skel h-[60px]" />
                <div className="p-4">
                  <div className="skel h-2.5 w-[40%] mb-3" />
                  <div className="skel h-2 w-full mb-1.5" />
                  <div className="skel h-2 w-[85%] mb-1.5" />
                  <div className="skel h-2 w-[70%] mb-4" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-12">
            <div className="w-[72px] h-[72px] rounded-full bg-white border border-cream-deep flex items-center justify-center text-[32px] mx-auto mb-4">&#9733;</div>
            <p className="font-sans text-[14px] text-muted">
              No reviews yet - be the first after your purchase!
            </p>
          </div>
        )}
        {!loading && reviews.length > 0 && (
          <div
            className="relative overflow-hidden"
            style={{
              height: 'clamp(420px, 55vw, 520px)',
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
            }}
          >
            <style>{`
              .lp-review-col::-webkit-scrollbar { display: none; }
            `}</style>
            <div className="flex gap-4 h-full md:hidden">
              {mobileColumns.map((colReviews, colIdx) => (
                <ScrollingColumn
                  key={`m-${colIdx}`}
                  reviews={colReviews}
                  speed={speeds[colIdx % speeds.length]}
                  navigate={navigate}
                />
              ))}
            </div>
            <div className="hidden md:flex gap-4 h-full">
              {desktopColumns.map((colReviews, colIdx) => (
                <ScrollingColumn
                  key={`d-${colIdx}`}
                  reviews={colReviews}
                  speed={speeds[colIdx % speeds.length]}
                  navigate={navigate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}