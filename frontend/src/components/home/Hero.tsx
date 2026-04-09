// src/components/home/Hero.tsx
import { useEffect, useRef, useState } from 'react';
import { T, BANNERS } from '../../constants/theme';

export default function Hero() {
  const [banner,       setBanner]       = useState(0);
  const [bannerFading, setBannerFading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    setBannerFading(true);
    setTimeout(() => { setBanner(idx); setBannerFading(false); }, 300);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setBannerFading(true);
      setTimeout(() => { setBanner(p => (p + 1) % BANNERS.length); setBannerFading(false); }, 300);
    }, 5500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const b = BANNERS[banner];

  return (
    <div className="px-[5%] pt-[clamp(12px,2vw,28px)]">
      <div
        className="rounded-[clamp(12px,2vw,20px)] overflow-hidden relative bg-navy"
        style={{ height: 'clamp(260px,50vw,490px)' }}
      >
        {/* Background image */}
        <img
          src={b.img} alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: bannerFading ? 0 : 0.3 }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background:`linear-gradient(105deg,${T.navy} 40%,rgba(13,27,62,0.6) 75%,transparent)` }}/>

        {/* Content */}
        <div
          className="absolute inset-0 flex flex-col justify-center transition-opacity duration-300"
          style={{
            padding: '0 clamp(20px,5%,60px)',
            opacity: bannerFading ? 0 : 1,
          }}
        >
          {/* Tag line */}
          <div className="flex items-center gap-2.5 mb-[clamp(10px,2vw,18px)]">
            <div className="w-5 h-px bg-gold"/>
            <span className="font-sans font-bold tracking-[3px] uppercase text-gold"
              style={{ fontSize:'clamp(8px,1.5vw,10px)' }}>
              {b.tag}
            </span>
            <div className="w-5 h-px bg-gold"/>
          </div>

          {/* Headline */}
          <h1
            className="font-serif font-extrabold text-white leading-[1.05] whitespace-pre-line mb-[clamp(10px,2vw,18px)]"
            style={{ fontSize:'clamp(26px,5vw,48px)' }}
          >
            {b.title}
          </h1>

          {/* Sub */}
          <p className="font-sans font-light text-white/60 mb-[clamp(18px,3vw,36px)] max-w-[420px] leading-[1.75]"
            style={{ fontSize:'clamp(12px,1.8vw,14px)' }}>
            {b.sub}
          </p>

          {/* CTA */}
          <button className="btn-gold w-fit">
            {b.cta} →
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center">
          {BANNERS.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              className="h-[3px] rounded-sm cursor-pointer transition-all duration-300"
              style={{ width: i === banner ? 24 : 5, background: i === banner ? T.gold : 'rgba(255,255,255,0.25)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}