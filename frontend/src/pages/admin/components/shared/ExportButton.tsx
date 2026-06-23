import React, { useState, useRef, useEffect } from 'react';
import { T } from '../../constants';

function toCsvValue(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv<T>(
  columns: { header: string; key: string; csvValue?: (row: T) => unknown }[],
  rows: T[],
): string {
  const head = columns.map(c => toCsvValue(c.header)).join(',');
  const body = rows.map(row =>
    columns.map(c => toCsvValue(c.csvValue ? c.csvValue(row) : (row as any)[c.key])).join(','),
  );
  return [head, ...body].join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ExportButtonProps {
  onExportCsv?: () => void;
  onPrint?: () => void;
  label?: string;
}

/** Single button that opens a small menu with CSV / Print actions.
 *  Pass only one handler if you just want a single-action button. */
export function ExportButton({ onExportCsv, onPrint, label = 'Export' }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // If only one handler is supplied, render a single plain button.
  if (onExportCsv && !onPrint) {
    return (
      <button onClick={onExportCsv} style={btnStyle}>⬇ {label} CSV</button>
    );
  }
  if (onPrint && !onExportCsv) {
    return (
      <button onClick={onPrint} style={btnStyle}>⎙ Print / Save PDF</button>
    );
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={btnStyle}>
        ⬇ {label} <span style={{ color: T.grey1, fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30,
          minWidth: 170, background: T.white, border: `1px solid ${T.grey3}`,
          borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', overflow: 'hidden',
        }}>
          {onExportCsv && (
            <button
              onClick={() => { onExportCsv(); setOpen(false); }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = T.grey5)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >⬇ Export CSV</button>
          )}
          {onPrint && (
            <button
              onClick={() => { onPrint(); setOpen(false); }}
              style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = T.grey5)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >⎙ Print / Save PDF</button>
          )}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 7,
  padding: '9px 16px', borderRadius: 8,
  border: `1px solid ${T.grey3}`, background: T.white,
  fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600,
  color: T.black, cursor: 'pointer',
};

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '10px 14px', border: 'none', background: 'transparent',
  fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600,
  color: T.black, cursor: 'pointer',
};