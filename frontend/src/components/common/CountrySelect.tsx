// src/components/common/CountrySelect.tsx
import { useEffect, useRef, useState } from 'react';
import { COUNTRIES } from '../../constants/countries';

interface CountrySelectProps {
  value: string;
  onChange: (countryName: string) => void;
  placeholder?: string;
}

export default function CountrySelect({ value, onChange, placeholder = 'Select country' }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRIES.find(c => c.name.toLowerCase() === value.toLowerCase());
  const filtered = query.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : COUNTRIES;

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setQuery('');
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="pf-input"
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer', background: '#fff' }}
      >
        {selected ? (
          <>
            <img
              src={`https://flagcdn.com/w20/${selected.code.toLowerCase()}.png`}
              alt=""
              width={18}
              height={13}
              style={{ objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
          </>
        ) : (
          <span style={{ color: 'rgba(0,0,0,0.4)' }}>{placeholder}</span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ marginLeft: 'auto', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)', maxHeight: 280, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search country…"
              style={{ width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: '8px 10px', fontFamily: "'Jost', sans-serif", fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <p style={{ padding: '12px 14px', fontFamily: "'Jost', sans-serif", fontSize: 12.5, color: 'rgba(0,0,0,0.4)' }}>
                No matches
              </p>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => pick(c.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '9px 14px', border: 'none', cursor: 'pointer',
                  background: c.name === value ? 'rgba(0,0,0,0.04)' : 'transparent',
                  fontFamily: "'Jost', sans-serif", fontSize: 13,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = c.name === value ? 'rgba(0,0,0,0.04)' : 'transparent')}
              >
                <img
                  src={`https://flagcdn.com/w20/${c.code.toLowerCase()}.png`}
                  alt=""
                  width={18}
                  height={13}
                  style={{ objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
                />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}