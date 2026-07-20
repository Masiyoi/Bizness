// ─────────────────────────────────────────────────────────────────────────────
// Luku Prime Admin — Design Tokens (Black & White theme)
// ─────────────────────────────────────────────────────────────────────────────

export const T = {
  // Core blacks
  black:  '#0A0A0A',   // primary text, sidebar bg, button fills
  black2: '#1A1A1A',   // hover states, secondary dark surfaces
  black3: '#2C2C2C',   // borders on dark surfaces, dividers on dark

  // Greys
  grey1:  '#6B6B6B',   // muted text, placeholders, secondary labels
  grey2:  '#9A9A9A',   // lighter muted, disabled states
  grey3:  '#E5E5E5',   // borders, dividers on light surfaces
  grey4:  '#F0F0F0',   // card / panel backgrounds
  grey5:  '#F7F7F7',   // page background, input backgrounds
  grey6:  '#FAFAFA',   // lightest tint, alternating rows

  // White
  white:  '#FFFFFF',

  // Semantic status colours (unchanged — these are standard traffic-light colours
  // and swapping them would confuse the meaning)
  ok:     '#166534',   // delivered / confirmed text
  okBg:   '#F0FDF4',   // delivered / confirmed bg
  okBdr:  '#BBF7D0',   // delivered / confirmed border

  warn:   '#92400E',   // pending / processing text
  warnBg: '#FFFBEB',   // pending / processing bg
  warnBdr:'#FDE68A',   // pending / processing border

  info:   '#1E40AF',   // shipped text
  infoBg: '#EFF6FF',   // shipped bg
  infoBdr:'#BFDBFE',   // shipped border

  err:    '#991B1B',   // cancelled / error text
  errBg:  '#FEF2F2',   // cancelled / error bg
  errBdr: '#FECACA',   // cancelled / error border

  // Legacy aliases so existing JSX that references T.navy / T.gold
  // doesn't throw TypeScript errors during the migration.
  // Remove these once every component is migrated.
  navy:   '#0A0A0A',
  navy2:  '#1A1A1A',
  navy3:  '#2C2C2C',
  gold:   '#0A0A0A',   // was accent; now just black (used in price/highlight text)
  gold2:  '#2C2C2C',
  cream:  '#F7F7F7',
  cream2: '#F0F0F0',
  cream3: '#E5E5E5',
  muted:  '#6B6B6B',
};

// ─────────────────────────────────────────────────────────────────────────────
// Status colour config  (used by SC[order.status])
// ─────────────────────────────────────────────────────────────────────────────
export const SC: Record<string, { bg: string; col: string; border: string }> = {
  pending:    { bg: T.warnBg,  col: T.warn,  border: T.warnBdr  },
  confirmed:  { bg: T.okBg,   col: T.ok,    border: T.okBdr    },
  processing: { bg: '#EFF6FF', col: '#1D4ED8', border: '#BFDBFE' },
  shipped:    { bg: T.infoBg,  col: T.info,  border: T.infoBdr  },
  delivered:  { bg: T.okBg,   col: T.ok,    border: T.okBdr    },
  cancelled:  { bg: T.errBg,  col: T.err,   border: T.errBdr   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Order / tracking constants
// ─────────────────────────────────────────────────────────────────────────────
export const TRACKING_STEPS = [
  'Payment Confirmed',
  'Delivery in progress',
  'Delivered',
];

export const ORDER_STATUSES = [
  'Payment Confirmed',
  'Delivery in progress',
  'Delivered',
];

export const STATUS_LABELS: Record<string, string> = {
  'payment confirmed': 'Payment Confirmed',
  'delivery in progress': 'Delivery in Progress',
  delivered: 'Delivered',
};

export const TRACKING_TO_STATUS: Record<string, string> = {
  'Order Placed':      'confirmed',
  'Payment Confirmed': 'confirmed',
  'Processing':        'processing',
  'Packed':            'processing',
  'Shipped':           'shipped',
  'Out for Delivery':  'shipped',
  'Delivered':         'delivered',
};

// ─────────────────────────────────────────────────────────────────────────────
// Product categories
// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  'Dresses',
  'Designer Wear',
  'Sneakers',
  'Bags',
  'Shoes',
  'Heels',
];

// ─────────────────────────────────────────────────────────────────────────────
// Delivery zone labels
// ─────────────────────────────────────────────────────────────────────────────
export const ZONE_LABELS: Record<string, { label: string; icon: string }> = {
  pickup:   { label: 'Pick Up from Shop', icon: '🏪' },
  cbd:      { label: 'Nairobi CBD',       icon: '🏙️' },
  environs: { label: 'Nairobi Environs',  icon: '🌆' },
  county:   { label: 'Other Counties',    icon: '📍' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared form element styles  (used inside wizard / forms)
// ─────────────────────────────────────────────────────────────────────────────
export const lbl: React.CSSProperties = {
  display:       'block',
  fontFamily:    'Jost, sans-serif',
  fontSize:      10,
  fontWeight:    700,
  color:         T.grey1,
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  marginBottom:  8,
};

export const inp: React.CSSProperties = {
  background:   T.white,
  border:       `1.5px solid ${T.grey3}`,
  borderRadius: 8,
  padding:      '11px 14px',
  fontFamily:   'Jost, sans-serif',
  fontSize:     14,
  color:        T.black,
  width:        '100%',
  outline:      'none',
  transition:   'border-color 0.2s, box-shadow 0.2s',
};

// ─────────────────────────────────────────────────────────────────────────────
// Date range presets  (used by DateRangePicker and analytics endpoints)
// ─────────────────────────────────────────────────────────────────────────────
export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  from:   string;   // ISO date string YYYY-MM-DD
  to:     string;
}

export const defaultDateRange = (): DateRange => {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 6);   // last 7 days inclusive
  return {
    preset: '7d',
    from:   from.toISOString().slice(0, 10),
    to:     to.toISOString().slice(0, 10),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Navigation tabs (source of truth for sidebar + mobile drawer)
// ─────────────────────────────────────────────────────────────────────────────
export type Tab = 'overview' | 'analytics' | 'products' | 'orders' | 'customers' | 'reports';

export interface NavItem {
  id:    Tab;
  icon:  string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview',   icon: '▣',  label: 'Overview'   },
  { id: 'analytics',  icon: '↗',  label: 'Analytics'  },
  { id: 'products',   icon: '⊞',  label: 'Products'   },
  { id: 'orders',     icon: '≡',  label: 'Orders'     },
  { id: 'customers',  icon: '◎',  label: 'Customers'  },
  { id: 'reports',    icon: '⎙',  label: 'Reports'    },
];