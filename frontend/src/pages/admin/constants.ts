export const T = {
  navy:   '#0D1B3E',
  navy2:  '#152348',
  navy3:  '#1E2F5A',
  gold:   '#C8A951',
  gold2:  '#DEC06A',
  cream:  '#F9F5EC',
  cream2: '#F0EAD8',
  cream3: '#E4D9C0',
  white:  '#FFFFFF',
  muted:  '#7A8099',
};

export const TRACKING_STEPS = [
  'Order Placed',
  'Payment Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export const CATEGORIES = [
  'Dresses',
  'Designer Wear',
  'Sneakers',
  'Bags',
  'Shoes',
  'Heels',
];

export const TRACKING_TO_STATUS: Record<string, string> = {
  'Order Placed':      'confirmed',
  'Payment Confirmed': 'confirmed',
  'Processing':        'processing',
  'Packed':            'processing',
  'Shipped':           'shipped',
  'Out for Delivery':  'shipped',
  'Delivered':         'delivered',
};

/** Status colour config */
export const SC: Record<string, { bg: string; col: string; border: string }> = {
  pending:    { bg: '#FDF8EC', col: '#B7791F', border: '#F6E4A0' },
  confirmed:  { bg: '#EEF5EE', col: '#4A8A4A', border: '#C8DFC8' },
  processing: { bg: '#EEF0FA', col: '#4A5FBF', border: '#C5CBEE' },
  shipped:    { bg: '#EDF5FB', col: '#2B7AB5', border: '#BAD9EF' },
  delivered:  { bg: '#EEF5EE', col: '#2E7D32', border: '#A5D6A7' },
  cancelled:  { bg: '#FDF0EE', col: '#C0392B', border: '#F5C6C0' },
};

export const ZONE_LABELS: Record<string, { label: string; icon: string }> = {
  pickup:   { label: 'Pick Up from Shop', icon: '🏪' },
  cbd:      { label: 'Nairobi CBD',       icon: '🏙️' },
  environs: { label: 'Nairobi Environs',  icon: '🌆' },
  county:   { label: 'Other Counties',    icon: '📍' },
};

/** Shared input / label styles */
export const lbl: React.CSSProperties = {
  display:       'block',
  fontFamily:    'Jost,sans-serif',
  fontSize:      10,
  fontWeight:    700,
  color:         '#7A8099',
  letterSpacing: '1.5px',
  textTransform: 'uppercase',
  marginBottom:  8,
};

export const inp: React.CSSProperties = {
  background:  '#F9F5EC',
  border:      '1.5px solid #E4D9C0',
  borderRadius: 10,
  padding:     '12px 14px',
  fontFamily:  'Jost,sans-serif',
  fontSize:    14,
  color:       '#0D1B3E',
  width:       '100%',
  outline:     'none',
  transition:  'border-color 0.2s',
};