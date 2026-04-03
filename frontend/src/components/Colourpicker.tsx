/**
 * ColourPicker — Buyer-facing colour selector for product pages.
 *
 * USAGE:
 *   import { ColourPicker } from './ColourPicker';
 *
 *   const [selectedColour, setSelectedColour] = useState<ColourVariant | null>(null);
 *
 *   // In your add-to-cart handler, validate:
 *   if (product.colours?.length > 0 && !selectedColour) {
 *     alert('Please select a colour');
 *     return;
 *   }
 *
 *   // Pass selected colour in the order payload:
 *   { ...orderData, selected_colour: selectedColour }
 */

import { useState } from 'react';

export interface ColourVariant {
  name: string;   // e.g. "Midnight Black"
  hex:  string;   // e.g. "#1A1A1A"
}

export interface ColourPickerProps {
  colours:   ColourVariant[];
  selected:  ColourVariant | null;
  onSelect:  (colour: ColourVariant) => void;
  /** Optional: show label + name above swatches. Default true */
  showLabel?: boolean;
  /** Optional: swatch size in px. Default 38 */
  swatchSize?: number;
}

export function ColourPicker({
  colours,
  selected,
  onSelect,
  showLabel  = true,
  swatchSize = 38,
}: ColourPickerProps) {
  if (!colours || colours.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {showLabel && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <span style={{
            fontFamily: 'Jost, sans-serif', fontSize: 10, fontWeight: 700,
            color: '#7A8099', letterSpacing: '2px', textTransform: 'uppercase',
          }}>
            Colour
          </span>
          {selected ? (
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, fontWeight: 600, color: '#0D1B3E' }}>
              — {selected.name}
            </span>
          ) : (
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: 12, color: '#7A8099' }}>
              Select one
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {colours.map(c => {
          const light      = isLightColour(c.hex);
          const isSelected = selected?.hex === c.hex;

          return (
            <button
              key={c.hex}
              title={c.name}
              onClick={() => onSelect(c)}
              aria-label={`Select colour: ${c.name}`}
              aria-pressed={isSelected}
              style={{
                width:       swatchSize,
                height:      swatchSize,
                borderRadius: '50%',
                background:  c.hex,
                border:      isSelected
                  ? '3px solid #0D1B3E'
                  : `2px solid ${light ? '#E4D9C0' : 'rgba(0,0,0,0.15)'}`,
                cursor:      'pointer',
                position:    'relative',
                transition:  'all 0.2s',
                transform:   isSelected ? 'scale(1.22)' : 'scale(1)',
                boxShadow:   isSelected
                  ? '0 0 0 3px #fff, 0 0 0 5px #0D1B3E'
                  : '0 2px 8px rgba(0,0,0,0.12)',
                flexShrink:  0,
              }}
            >
              {isSelected && (
                <span style={{
                  position: 'absolute', inset: 0,
                  display:  'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: swatchSize * 0.37,
                  fontWeight: 700,
                  color: light ? '#0D1B3E' : '#ffffff',
                }}>
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Validation hint */}
      {!selected && (
        <p style={{
          fontFamily: 'Jost, sans-serif', fontSize: 11,
          color: '#C0392B', marginTop: 8,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ⚠ Please choose a colour to continue
        </p>
      )}
    </div>
  );
}

/** Returns true if the hex colour is light (so we use a dark tick/text) */
function isLightColour(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}


// ─────────────────────────────────────────────────────────────────────────────
// Demo / usage preview (remove in production)
// ─────────────────────────────────────────────────────────────────────────────
export default function ColourPickerDemo() {
  const DEMO_COLOURS: ColourVariant[] = [
    { name: 'Midnight Black', hex: '#1A1A1A' },
    { name: 'Pearl White',    hex: '#F5F5F5' },
    { name: 'Navy Blue',      hex: '#1B3A6B' },
    { name: 'Crimson Red',    hex: '#C0392B' },
    { name: 'Forest Green',   hex: '#2E7D32' },
    { name: 'Dusty Pink',     hex: '#E8A598' },
    { name: 'Gold',           hex: '#C8A951' },
  ];

  const [selected, setSelected] = useState<ColourVariant | null>(null);

  return (
    <div style={{
      minHeight: '100vh', background: '#F9F5EC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Jost, sans-serif',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        padding: '32px', maxWidth: 400, width: '100%',
        boxShadow: '0 16px 48px rgba(13,27,62,0.12)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#C8A951', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Sneakers</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 22, color: '#0D1B3E', marginBottom: 4 }}>Air Trainer Pro</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 20, color: '#C8A951', marginBottom: 20 }}>KSh 8,500</div>

        <ColourPicker colours={DEMO_COLOURS} selected={selected} onSelect={setSelected} />

        <button
          onClick={() => {
            if (!selected) { alert('Please select a colour first'); return; }
            alert(`Added to cart: Air Trainer Pro in ${selected.name}`);
          }}
          style={{
            width: '100%', padding: '14px', border: 'none', borderRadius: 10,
            background: selected ? 'linear-gradient(135deg,#C8A951,#DEC06A)' : '#E4D9C0',
            color: selected ? '#0D1B3E' : '#7A8099',
            fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14,
            cursor: selected ? 'pointer' : 'not-allowed',
            letterSpacing: '1px', textTransform: 'uppercase',
            transition: 'all 0.2s',
          }}
        >
          {selected ? `Add to Cart — ${selected.name}` : 'Select a Colour'}
        </button>
      </div>
    </div>
  );
}