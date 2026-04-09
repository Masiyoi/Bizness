// src/components/home/TrustStrip.tsx
import { TRUST_ITEMS } from '../../constants/theme';

export default function TrustStrip() {
  return (
    <div className="px-[5%] py-[clamp(12px,2vw,20px)]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {TRUST_ITEMS.map(t => (
          <div
            key={t.label}
            className="bg-white border border-cream-deep rounded-xl px-3.5 py-3 flex items-center gap-3"
          >
            <span className="text-xl shrink-0">{t.icon}</span>
            <div>
              <div className="font-sans font-bold text-[12px] text-navy">{t.label}</div>
              <div className="font-sans text-[10px] text-muted mt-px">{t.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}