/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ── Brand colours (Black & White theme) ────────────────────
      colors: {
        navy: {
          DEFAULT: '#000000',   // was #0D1B3E
          mid:     '#111111',   // was #152348
          light:   '#222222',   // was #1E2F5A
        },
        gold: {
          DEFAULT: '#000000',   // was #C8A951 → black (accent on white bg)
          light:   '#333333',   // was #DEC06A
          pale:    '#555555',   // was #F0D98A
        },
        cream: {
          DEFAULT: '#FFFFFF',   // was #F9F5EC → pure white
          mid:     '#F0F0F0',   // was #F0EAD8
          deep:    '#E0E0E0',   // was #E4D9C0
        },
        muted: '#6B6B6B',       // was #7A7A8A
      },

      // ── Typography ──────────────────────────────────────────────
      fontFamily: {
        serif:  ['"Playfair Display"', 'Georgia', 'serif'],
        sans:   ['Jost', 'sans-serif'],
      },

      // ── Spacing extras ──────────────────────────────────────────
      maxWidth: {
        content: '1100px',
      },

      // ── Box shadows ─────────────────────────────────────────────
      boxShadow: {
        card:         '0 12px 36px rgba(0,0,0,0.08)',
        'card-hover': '0 20px 48px rgba(0,0,0,0.12)',
        nav:          '0 4px 32px rgba(0,0,0,0.12)',
        modal:        '0 32px 80px rgba(0,0,0,0.18)',
        gold:         '0 8px 24px rgba(0,0,0,0.15)',
      },

      // ── Border radius ───────────────────────────────────────────
      borderRadius: {
        card: '16px',
        pill: '50px',
      },

      // ── Keyframe animations ─────────────────────────────────────
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        pop: {
          '50%': { transform: 'scale(1.5)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.94) translateY(16px)' },
          to:   { opacity: '1', transform: 'scale(1)   translateY(0)' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(12px)' },
          to:   { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
      animation: {
        marquee:    'marquee 32s linear infinite',
        'fade-up':  'fadeUp 0.4s ease both',
        'fade-in':  'fadeIn 0.35s ease forwards',
        shimmer:    'shimmer 1.4s infinite',
        pop:        'pop 0.3s ease',
        'modal-in': 'modalIn 0.22s ease',
        'toast-in': 'toastIn 0.3s ease',
      },
    },
  },
  plugins: [],
};