import React, { useState, useRef, useEffect } from 'react';
import { T } from '../../constants';
import type { DateRange, DateRangePreset } from '../../constants';

// ── Preset definitions ────────────────────────────────────────────────────────
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function presetRange(days: number, preset: DateRangePreset): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { preset, from: toISO(from), to: toISO(to) };
}

// "Today" and "This month" don't map onto the fixed 7d/30d/90d preset enum,
// so they're stored as 'custom' even though they're offered as quick presets.
function todayRange(): DateRange {
  const today = toISO(new Date());
  return { preset: 'custom', from: today, to: today };
}

function monthToDateRange(): DateRange {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { preset: 'custom', from: toISO(from), to: toISO(now) };
}

const PRESETS: { label: string; get: () => DateRange }[] = [
  { label: 'Today',        get: () => todayRange() },
  { label: 'Last 7 days',  get: () => presetRange(7, '7d') },
  { label: 'Last 30 days', get: () => presetRange(30, '30d') },
  { label: 'This month',   get: () => monthToDateRange() },
  { label: 'Last 90 days', get: () => presetRange(90, '90d') },
];

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen]   = useState(false);
  const [draft, setDraft] = useState<DateRange>(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const apply = (r: DateRange) => {
    onChange(r);
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px', borderRadius: 8,
          border: `1px solid ${T.grey3}`, background: T.white,
          fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600,
          color: T.black, cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 14 }}>📅</span>
        {fmtShort(value.from)} – {fmtShort(value.to)}
        <span style={{ color: T.grey1, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 30,
          width: 280, background: T.white, border: `1px solid ${T.grey3}`,
          borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', padding: 14,
        }}>
          {/* Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => apply(p.get())}
                style={{
                  textAlign: 'left', padding: '8px 10px', borderRadius: 7,
                  border: 'none', background: 'transparent',
                  fontFamily: 'Jost,sans-serif', fontSize: 13, fontWeight: 600,
                  color: T.black, cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = T.grey5)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >{p.label}</button>
            ))}
          </div>

          <div style={{ height: 1, background: T.grey3, margin: '4px 0 12px' }} />

          {/* Custom range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.grey1 }}>
              Custom range
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="date"
                value={draft.from}
                max={draft.to}
                onChange={e => setDraft(d => ({ ...d, preset: 'custom', from: e.target.value }))}
                style={{
                  flex: 1, padding: '7px 8px', borderRadius: 7,
                  border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif',
                  fontSize: 12, color: T.black,
                }}
              />
              <input
                type="date"
                value={draft.to}
                min={draft.from}
                onChange={e => setDraft(d => ({ ...d, preset: 'custom', to: e.target.value }))}
                style={{
                  flex: 1, padding: '7px 8px', borderRadius: 7,
                  border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif',
                  fontSize: 12, color: T.black,
                }}
              />
            </div>
            <button
              onClick={() => apply(draft)}
              style={{
                marginTop: 4, padding: '9px 0', borderRadius: 7, border: 'none',
                background: T.black, color: T.white,
                fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}
            >Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}