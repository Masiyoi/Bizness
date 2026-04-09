// src/components/common/Footer.tsx
import logo from '../../assets/logo.png';
import { T, SOCIAL_LINKS } from '../../constants/theme';

// SVG icons per social platform
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/>
    </svg>
  ),
  TikTok: (
    <svg width="20" height="22" viewBox="0 0 24 26" fill="none">
      <path d="M17 1c.4 2.2 1.7 3.7 4 4v3.5c-1.4 0-2.7-.4-4-1.2V16a7 7 0 1 1-7-7c.3 0 .6 0 .9.04V12.6a3.5 3.5 0 1 0 2.1 3.4V1h4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  YouTube: (
    <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
      <rect x="1" y="1" width="22" height="16" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 5.5l6 3.5-6 3.5V5.5z" fill="currentColor"/>
    </svg>
  ),
};

export default function Footer() {
  return (
    <footer className="bg-navy border-t border-gold/20">
      {/* Gold gradient rule */}
      <div style={{ height:2, background:`linear-gradient(90deg,transparent 0%,${T.gold} 30%,${T.goldLight} 50%,${T.gold} 70%,transparent 100%)` }}/>

      {/* Social strip */}
      <div className="border-b border-gold/[0.12] py-7 px-[5%]">
        <div className="max-w-content mx-auto flex flex-col items-center gap-4">

          {/* Label */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-gold/40"/>
            <span className="font-sans text-[9px] font-bold tracking-[3px] text-gold/60 uppercase">Follow Us</span>
            <div className="w-8 h-px bg-gold/40"/>
          </div>

          <p className="font-sans text-[13px] text-white/45 font-light text-center tracking-[0.3px]">
            Stay in the loop — new drops, style inspo & exclusive deals
          </p>

          {/* Social pills */}
          <div className="flex gap-3 flex-wrap justify-center">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] min-w-[220px] transition-all duration-200 cursor-pointer no-underline group hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                style={{ '--hover-bg': s.hoverBg } as React.CSSProperties}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = s.hoverBg; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <span className="flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ color: s.color }}>
                  {SOCIAL_ICONS[s.name]}
                </span>
                <div>
                  <div className="font-sans text-[12px] font-bold text-white/90 tracking-[0.3px]">{s.name}</div>
                  <div className="font-sans text-[10px] text-white/40 mt-px">{s.label}</div>
                </div>
                <span className="ml-auto font-sans text-[10px] text-white/30 tracking-[0.5px]">↗</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-[5%] py-5 flex justify-between items-center flex-wrap gap-4">
        <img src={logo} alt="Luku Prime" className="h-11 object-contain"/>

        <div className="text-center">
          <div className="font-sans text-[9px] font-bold tracking-[3px] text-gold/70 uppercase mb-1">Dress the Finest</div>
          <div className="font-sans text-[10px] text-white/25">© 2025 Luku Prime · All rights reserved</div>
        </div>

        <div className="flex gap-4">
          {['Privacy', 'Terms', 'Help'].map(l => (
            <span key={l}
              className="font-sans cursor-pointer text-white/35 text-[11px] tracking-[1px] uppercase transition-colors duration-200 hover:text-gold-light">
              {l}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}