import React, { useRef } from 'react';
import { T } from '../../constants';

// ── Report header (also appears inside the print window) ──────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ReportHeader({ title, subtitle, dateRange }: {
  title: string;
  subtitle?: string;
  dateRange?: { from: string; to: string };
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, background: T.black,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 18, color: T.white,
        }}>L</div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, color: T.black }}>
            Luku Prime — {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.grey1 }}>{subtitle}</div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
        {dateRange && (
          <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>
            Period: {fmtDate(dateRange.from)} – {fmtDate(dateRange.to)}
          </span>
        )}
        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1 }}>
          Generated: {fmtDate(new Date().toISOString())}
        </span>
      </div>
      <div style={{ height: 1, background: T.black, marginTop: 14 }} />
    </div>
  );
}

// ── Print stylesheet shared by every report ─────────────────────────────────────
const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Jost', 'Helvetica Neue', sans-serif; font-size: 12px; color: #0A0A0A; padding: 32px; }
  h1 { font-family: Georgia, serif; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th { text-align: left; padding: 8px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #6B6B6B; border-bottom: 2px solid #0A0A0A; }
  td { padding: 8px 10px; border-bottom: 1px solid #E5E5E5; font-size: 11px; }
  tr:nth-child(even) td { background: #F7F7F7; }
  .summary { display: flex; gap: 24px; margin: 16px 0; padding: 14px 18px; background: #0A0A0A; color: white; border-radius: 8px; flex-wrap: wrap; }
  .summary div { min-width: 120px; }
  .summary .lbl { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 4px; }
  .summary .val { font-family: Georgia, serif; font-size: 18px; font-weight: 700; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .ok { background: #F0FDF4; color: #166534; }
  .warn { background: #FFFBEB; color: #92400E; }
  .err { background: #FEF2F2; color: #991B1B; }
  @media print { body { padding: 16px; } }
`;

function openPrintWindow(title: string, innerHtml: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`
    <html><head><title>${title}</title>
    <style>${PRINT_STYLES}</style>
    </head><body>${innerHtml}</body></html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ── PrintLayout ──────────────────────────────────────────────────────────────
interface PrintLayoutProps {
  /** Used for the browser tab title of the popped-out print window */
  printTitle: string;
  title: string;
  subtitle?: string;
  dateRange?: { from: string; to: string };
  children: React.ReactNode;
  /** Render prop giving access to the print trigger, e.g. for a custom toolbar button */
  renderActions?: (handlePrint: () => void) => React.ReactNode;
}

export function PrintLayout({
  printTitle,
  title,
  subtitle,
  dateRange,
  children,
  renderActions,
}: PrintLayoutProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    openPrintWindow(printTitle, el.innerHTML);
  };

  return (
    <div>
      {renderActions && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          {renderActions(handlePrint)}
        </div>
      )}
      <div ref={printRef}>
        <ReportHeader title={title} subtitle={subtitle} dateRange={dateRange} />
        {children}
      </div>
    </div>
  );
}

export { openPrintWindow };