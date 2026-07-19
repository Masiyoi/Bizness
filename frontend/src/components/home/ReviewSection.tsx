// src/components/home/ReviewSection.tsx
import { useNavigate } from 'react-router-dom';
import { AVATAR_COLORS, getInitials } from '../../constants/theme';
import type { HomepageReview } from '../../constants/theme';

interface ReviewSectionProps {
  reviews: HomepageReview[];
  loading: boolean;
  isAdmin: boolean;
}

export default function ReviewSection({ reviews, loading, isAdmin }: ReviewSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="px-[5%] py-[clamp(40px,6vw,72px)] bg-white border-t border-b border-cream-deep">
      <div className="max-w-content mx-auto">

        {/* ── Header ── */}
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
                  <span key={s} style={{ fontSize: 13, color: '#0A0A0A' }}>★</span>
                ))}
              </div>
              <span className="font-sans text-[11px] text-muted font-semibold">
                {reviews.length}+ verified reviews
              </span>
            </div>
          )}
        </div>

        {/* ── Skeleton ── */}
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

        {/* ── Empty state ── */}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-12">
            <div className="w-[72px] h-[72px] rounded-full bg-white border border-cream-deep flex items-center justify-center text-[32px] mx-auto mb-4">★</div>
            <p className="font-sans text-[14px] text-muted">
              No reviews yet — be the first after your purchase!
            </p>
          </div>
        )}

        {/* ── Vertical Sliding Review Wall (Generation-style, 3 cols desktop / 2 mobile) ── */}
        {!loading && reviews.length > 0 && (() => {
          const COLS = 3;
          const columns: HomepageReview[][] = Array.from({ length: COLS }, () => []);
          reviews.forEach((r, i) => columns[i % COLS].push(r));
          const speeds = [9, 12, 7];

          return (
            <div
              className="relative overflow-hidden"
              style={{
                height: 'clamp(420px, 55vw, 520px)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}
            >
              <style>{`
                @keyframes lp-col-scroll {
                  from { transform: translateY(-50%); }
                  to   { transform: translateY(0); }
                }
              `}</style>

              <div className="flex gap-4 h-full">
                {columns.map((colReviews, colIdx) => {
                  if (colReviews.length === 0) return null;
                  const doubled = [...colReviews, ...colReviews];

                  return (
                    <div
                      key={colIdx}
                      className={`flex-1 min-w-0 overflow-hidden ${colIdx === 2 ? 'hidden md:block' : ''}`}
                    >
                      <div
                        className="flex flex-col gap-3"
                        style={{ animation: `lp-col-scroll ${speeds[colIdx % speeds.length]}s linear infinite` }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'paused'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.animationPlayState = 'running'; }}
                      >
                        {doubled.map((review, idx) => {
                          const initials  = getInitials(review.full_name);
                          const avatarBg  = AVATAR_COLORS[review.id % AVATAR_COLORS.length];
                          const nameParts = review.full_name.split(' ');
                          const displayName = nameParts[0] + (nameParts[1] ? ` ${nameParts[1][0]}.` : '');

                          return (
                            <div
                              key={`${review.id}-${colIdx}-${idx}`}
                              onClick={() => navigate(`/product/${review.product_id}`)}
                              className="group w-full max-w-[210px] mx-auto shrink-0 bg-white rounded-[12px] overflow-hidden border border-cream-deep cursor-pointer transition-all duration-200 hover:border-black flex flex-col relative"
                            >
                              {/* Product image — large, centered, top */}
                              <div className="relative w-full h-[140px] bg-[#F5F5F5] overflow-hidden">
                                <img
                                  src={review.product_image ?? `https://placehold.co/400x400/0A0A0A/ffffff?text=LP`}
                                  alt={review.product_name}
                                  onError={e => {
                                    (e.target as HTMLImageElement).src =
                                      `https://placehold.co/400x400/0A0A0A/ffffff?text=LP`;
                                  }}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-[#0A0A0A] rounded-full px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  View →
                                </span>
                              </div>

                              {/* Rating + name — centered, under image */}
                              <div className="flex flex-col items-center text-center gap-1 px-3 pt-2.5">
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <span
                                      key={s}
                                      style={{
                                        fontSize: 11,
                                        color: s <= review.rating ? '#0A0A0A' : '#D1D5DB',
                                      }}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <div className="font-sans text-[11px] font-bold text-navy">
                                  {displayName}
                                </div>
                                <span className="text-[9px] font-bold text-[#3A3A3A] bg-[#F0F0F0] border border-[#D1D5DB] rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                                  ✓ Verified purchase
                                </span>
                              </div>

                              {/* Review text — bottom */}
                              <div className="px-3 pb-3 pt-2">
                                <p className="font-sans text-[10.5px] text-[#3A3A4A] leading-[1.6] text-center line-clamp-3">
                                  {review.comment}
                                </p>
                                <div className="font-sans text-[9px] text-muted text-center mt-1.5 truncate">
                                  {new Date(review.created_at).toLocaleDateString('en-KE', {
                                    month: 'short',
                                    year: 'numeric',
                                  })} · {review.product_name}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>
    </section>
  );
}