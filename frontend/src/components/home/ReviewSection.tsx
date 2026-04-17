// src/components/home/ReviewSection.tsx
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { T, AVATAR_COLORS, getInitials } from '../../constants/theme';
import type { HomepageReview } from '../../constants/theme';
import Ornament from '../ui/Ornament';

interface ReviewSectionProps {
  reviews: HomepageReview[];
  loading: boolean;
  isAdmin: boolean;
}

export default function ReviewSection({ reviews, loading, isAdmin }: ReviewSectionProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  return (
    <section className="px-[5%] py-[clamp(40px,6vw,72px)] bg-cream-mid border-t border-b border-cream-deep">
      <div className="max-w-content mx-auto">

        {/* ── Header ── */}
        <div className="flex justify-between items-end mb-[clamp(24px,4vw,40px)] flex-wrap gap-3">
          <div>
            <Ornament label="Verified Buyers" />
            <h2 className="font-serif font-bold text-navy mt-1" style={{ fontSize: 'clamp(20px,3vw,28px)' }}>
              What Our Customers Say
            </h2>

            {!loading && reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-gold text-[13px]">★</span>
                  ))}
                </div>
                <span className="font-sans text-[11px] text-muted font-semibold">
                  {reviews.length}+ verified reviews
                </span>
              </div>
            )}
          </div>

          {!isAdmin && (
            <button
              onClick={() => navigate('/reviews')}
              className="font-sans text-[10px] font-bold tracking-[2px] uppercase bg-transparent border-[1.5px] border-cream-deep text-navy rounded-lg px-5 py-2.5 cursor-pointer transition-all duration-200 shrink-0 hover:border-gold hover:text-gold"
            >
              ⭐ My Reviews
            </button>
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
            <div className="w-[72px] h-[72px] rounded-full bg-white border border-cream-deep flex items-center justify-center text-[32px] mx-auto mb-4">⭐</div>
            <p className="font-sans text-[14px] text-muted">
              No reviews yet — be the first after your purchase!
            </p>
          </div>
        )}

        {/* ── Horizontal Scroll Reviews ── */}
        {!loading && reviews.length > 0 && (
          <div className="relative">

            {/* Arrows (desktop UX boost) */}
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-cream-deep shadow hover:border-gold"
            >
              ‹
            </button>

            <button
              onClick={() => scroll('right')}
              className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-cream-deep shadow hover:border-gold"
            >
              ›
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide"
            >
              {reviews.map((review, idx) => {
                const initials = getInitials(review.full_name);
                const avatarBg = AVATAR_COLORS[review.id % AVATAR_COLORS.length];
                const nameParts = review.full_name.split(' ');
                const displayName =
                  nameParts[0] + (nameParts[1] ? ` ${nameParts[1][0]}.` : '');

                return (
                  <div
                    key={review.id}
                    onClick={() => navigate(`/product/${review.product_id}`)}
                    className="group min-w-[280px] max-w-[320px] snap-start bg-white rounded-[16px] overflow-hidden border-[1.5px] border-cream-deep cursor-pointer transition-all duration-200 hover:border-gold hover:-translate-y-[3px] flex flex-col relative"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    {/* Product strip */}
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-navy">
                      <img
                        src={review.product_image ?? `https://placehold.co/40x40/152348/C8A951?text=LP`}
                        alt={review.product_name}
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            `https://placehold.co/40x40/152348/C8A951?text=LP`;
                        }}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 border-2 border-gold/30"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-sans text-[11px] font-bold text-white truncate">
                          {review.product_name}
                        </div>
                        {review.category && (
                          <div className="font-sans text-[9px] font-semibold text-gold/70 uppercase tracking-[1.5px] mt-0.5">
                            {review.category}
                          </div>
                        )}
                      </div>
                      <span className="font-sans text-[10px] font-bold text-gold tracking-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                        View →
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col gap-2.5">
                      <div className="absolute top-[52px] right-3 font-serif text-[48px] text-gold/10">
                        "
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <span
                              key={s}
                              style={{
                                fontSize: 12,
                                color: s <= review.rating ? T.gold : T.creamDeep
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="font-sans text-[10px] text-muted">
                          {new Date(review.created_at).toLocaleDateString('en-KE', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <p
                        className="font-sans text-[12px] text-[#3A3A4A] leading-[1.85] flex-1 overflow-hidden"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical' as any
                        }}
                      >
                        {review.comment}
                      </p>

                      <div className="flex items-center gap-2.5 pt-2.5 border-t border-cream-deep mt-auto">
                        <div
                          className="w-[34px] h-[34px] rounded-full flex items-center justify-center border-2 border-cream-deep"
                          style={{ background: avatarBg }}
                        >
                          <span className="text-white text-[11px] font-extrabold">
                            {initials}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans text-[12px] font-bold text-navy truncate">
                            {displayName}
                          </div>
                          <span className="text-[9px] font-bold text-[#4A7A4A] bg-[#EEF3EE] border border-[#C8DFC8] rounded-full px-2 py-0.5 mt-0.5 inline-flex items-center gap-1">
                            ✓ Verified purchase
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}