// src/components/home/Hero.tsx
import { useNavigate } from 'react-router-dom';

const VIDEO_URL =
  'https://res.cloudinary.com/dfiy43f01/video/upload/v1780182574/Soul-soothing_scripture_reflections_for_creative_people_to_save_for_Sunday_inspiration_-_Pin-720364902941634412_bwyhcj.mp4';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="relative bg-black" style={{ height: 'clamp(260px,50vw,490px)' }}>
      {/* Full-bleed background video */}
      <video
        src={VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Minimal left-side gradient — just enough for text contrast */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(105deg,rgba(0,0,0,0.42) 30%,rgba(0,0,0,0.08) 60%,transparent)' }}
      />

      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col justify-center"
        style={{ padding: '0 clamp(20px,5%,60px)' }}
      >
        {/* Tag line */}
        <div className="flex items-center gap-2.5 mb-[clamp(10px,2vw,18px)]">
          <div className="w-5 h-px bg-white/70" />
          <span
            className="font-sans font-bold tracking-[3px] uppercase text-white/90"
            style={{ fontSize: 'clamp(8px,1.5vw,10px)' }}
          >
            NEW COLLECTION
          </span>
          <div className="w-5 h-px bg-white/70" />
        </div>

        {/* Headline */}
        <h1
          className="font-serif font-extrabold text-white leading-[1.05] whitespace-pre-line mb-[clamp(10px,2vw,18px)]"
          style={{ fontSize: 'clamp(26px,5vw,48px)' }}
        >
          {'Luku ni\nPrime Siku Zote'}
        </h1>

        {/* Sub */}
        <p
          className="font-sans font-light text-white/75 mb-[clamp(18px,3vw,36px)] max-w-[420px] leading-[1.75]"
          style={{ fontSize: 'clamp(12px,1.8vw,14px)' }}
        >
          Premium fashion arrivals crafted for those who demand the finest —
          delivered across Kenya.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/?category=All')}
          className="w-fit font-sans font-bold tracking-[2px] uppercase text-black bg-white px-6 py-3 rounded transition-opacity hover:opacity-80"
          style={{ fontSize: 'clamp(10px,1.4vw,12px)' }}
        >
          Shop Now →
        </button>
      </div>
    </div>
  );
}