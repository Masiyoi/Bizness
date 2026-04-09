// src/components/ui/Ornament.tsx
// Reusable section-header ornament: ── ◆ LABEL ◆ ──

interface OrnamentProps {
  label: string;
  /** Pass 'light' when sitting on a dark (navy) background */
  variant?: 'dark' | 'light';
}

export default function Ornament({ label, variant = 'dark' }: OrnamentProps) {
  const lineColor   = variant === 'dark' ? 'bg-gold'               : 'bg-gold/50';
  const diamondColor= variant === 'dark' ? 'bg-gold'               : 'bg-gold/50';
  const textColor   = variant === 'dark' ? 'text-gold'             : 'text-gold/70';

  return (
    <div className="flex items-center gap-3 mb-1.5">
      <div className={`w-7 h-px shrink-0 ${lineColor}`} />
      <div className={`w-1 h-1 rotate-45 shrink-0 ${diamondColor}`} />
      <span className={`font-sans text-[9px] font-bold tracking-[3px] uppercase ${textColor}`}>
        {label}
      </span>
      <div className={`w-1 h-1 rotate-45 shrink-0 ${diamondColor}`} />
      <div className={`w-7 h-px shrink-0 ${lineColor}`} />
    </div>
  );
}