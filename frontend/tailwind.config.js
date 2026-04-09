/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // ── Brand colours ──────────────────────────────────────────
      colors: {
        navy: {
          DEFAULT: '#0D1B3E',
          mid:     '#152348',
          light:   '#1E2F5A',
        },
        gold: {
          DEFAULT: '#C8A951',
          light:   '#DEC06A',
          pale:    '#F0D98A',
        },
        cream: {
          DEFAULT: '#F9F5EC',
          mid:     '#F0EAD8',
          deep:    '#E4D9C0',
        },
        muted: '#7A7A8A',
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
        card:  '0 12px 36px rgba(13,27,62,0.10)',
        'card-hover': '0 20px 48px rgba(13,27,62,0.13)',
        nav:   '0 4px 32px rgba(13,27,62,0.35)',
        modal: '0 32px 80px rgba(13,27,62,0.30)',
        gold:  '0 8px 24px rgba(200,169,81,0.35)',
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
        marquee:  'marquee 32s linear infinite',
        'fade-up':'fadeUp 0.4s ease both',
        'fade-in':'fadeIn 0.35s ease forwards',
        shimmer:  'shimmer 1.4s infinite',
        pop:      'pop 0.3s ease',
        'modal-in':'modalIn 0.22s ease',
        'toast-in':'toastIn 0.3s ease',
      },
    },
  },
  plugins: [],
};