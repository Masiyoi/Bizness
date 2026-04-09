// src/components/home/ReviewSection.tsx
import { useNavigate }   from 'react-router-dom';
import { T, AVATAR_COLORS, getInitials } from '../../constants/theme';
import type { HomepageReview } from '../../constants/theme';
import Ornament           from '../ui/Ornament';

interface ReviewSectionProps {
  reviews: HomepageReview[];
  loading: boolean;
  isAdmin: boolean;
}

export default function ReviewSection({ reviews, loading, isAdmin }: ReviewSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="px-[5%] py-[clamp(40px,6vw,72px)] bg-cream-mid border-t border-b border-cream-deep">
      <div className="max-w-content mx-auto">

        {/* Header */}
        <div className="flex justify-between items-end mb-7 flex-wrap gap-3">
          <div>
            <Ornament label="Verified Buyers"/>
            <h2 className="font-serif font-bold text-navy mt-1" style={{ fontSize:'clamp(20px,3vw,28px)' }}>
              What Our Customers Say
            </h2>
            {!loading && reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-gold text-[13px]">★</span>)}
                </div>
                <span className="font-sans text-[11px] text-muted font-medium">
                  {reviews.length}+ verified reviews
                </span>
              </div>
            )}
          </div>

          {!isAdmin && (
            <button
              onClick={() => navigate('/reviews')}
              className="font-sans text-[10px] font-bold tracking-[2px] uppercase bg-transparent border border-cream-deep text-navy rounded-md px-5 py-2.5 cursor-pointer transition-all duration-200 shrink-0 hover:border-gold hover:text-gold"
            >
              ⭐ My Reviews
            </button>
          )}
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-cream-deep rounded-card p-5">
                <div className="skel h-2.5 w-1/2 mb-2.5"/>
                <div className="skel h-2 w-[85%] mb-1.5"/>
                <div className="skel h-2 w-[70%] mb-4"/>
                <div className="flex gap-2.5 items-center pt-3 border-t border-cream-deep">
                  <div className="skel w-[38px] h-[38px] rounded-full shrink-0"/>
                  <div className="flex-1">
                    <div className="skel h-2 w-[55%] mb-1.5"/>
                    <div className="skel h-2 w-[40%]"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-12">
            <div className="w-[72px] h-[72px] rounded-full bg-white border border-cream-deep flex items-center justify-center text-[32px] mx-auto mb-4">⭐</div>
            <p className="font-sans text-[14px] text-muted">
              No reviews yet — be the first after your purchase!
            </p>
          </div>
        )}

        {/* Cards grid */}
        {!loading && reviews.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 sm:grid-cols-2 md:grid-cols-3">
            {reviews.map((review, idx) => {
              const initials    = getInitials(review.full_name);
              const avatarBg    = AVATAR_COLORS[review.id % AVATAR_COLORS.length];
              const nameParts   = review.full_name.split(' ');
              const displayName = nameParts[0] + (nameParts[1] ? ` ${nameParts[1][0]}.` : '');

              return (
                <div
                  key={review.id}
                  className="review-card"
                  style={{ animationDelay:`${idx * 0.05}s` }}
                  onClick={() => navigate(`/product/${review.product_id}`)}
                >
                  {/* Decorative quote */}
                  <div className="absolute top-2.5 right-3.5 text-[52px] leading-none text-gold/10 font-serif select-none pointer-events-none">
                    "
                  </div>

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-2.5">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize:13, color: s <= review.rating ? T.gold : T.creamDeep }}>★</span>
                    ))}
                  </div>

                  {/* Comment */}
                  <p
                    className="font-sans text-[12px] text-[#3A3A4A] leading-[1.85] mb-4 flex-1 overflow-hidden"
                    style={{ display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical' as any }}
                  >
                    {review.comment}
                  </p>

                  {/* Footer row */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-cream-deep mt-auto">
                    {/* Avatar */}
                    <div
                      className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 border-2 border-cream-deep shadow-sm"
                      style={{ background: avatarBg }}
                    >
                      <span className="font-sans text-[12px] font-extrabold text-white tracking-[0.5px]">
                        {initials}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-sans text-[12px] font-bold text-navy overflow-hidden text-ellipsis whitespace-nowrap">
                        {displayName}
                      </div>
                      <div className="font-sans text-[10px] font-semibold text-gold overflow-hidden text-ellipsis whitespace-nowrap mt-px">
                        {review.product_name}
                      </div>
                    </div>

                    <div className="font-sans text-[9px] text-muted whitespace-nowrap shrink-0">
                      {new Date(review.created_at).toLocaleDateString('en-KE',{month:'short',year:'numeric'})}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}