// src/constants/theme.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for Luku Prime brand tokens.
// Use these for any inline styles that can't be expressed with Tailwind classes
// (e.g. dynamic gradient strings, rgba() values in JS, canvas drawing, etc.)
//
// For everything else — use the Tailwind classes defined in tailwind.config.js:
//   bg-navy, text-gold, border-cream-deep, etc.
// ─────────────────────────────────────────────────────────────────────────────

export const T = {
  // ── Core palette ───────────────────────────────────────────────
  navy:      '#0D1B3E',
  navyMid:   '#152348',
  navyLight: '#1E2F5A',

  gold:      '#C8A951',
  goldLight: '#DEC06A',
  goldPale:  '#F0D98A',

  cream:     '#F9F5EC',
  creamMid:  '#F0EAD8',
  creamDeep: '#E4D9C0',

  white:     '#FFFFFF',
  text:      '#0D1B3E',
  muted:     '#7A7A8A',
} as const;

// ── Avatar colour pool (cycles by id) ──────────────────────────────────────
export const AVATAR_COLORS = [
  '#0D1B3E', '#1E2F5A', '#8A6A20',
  '#3A6EA8', '#4A7A4A', '#5A3E8A',
  '#C0392B', '#2D6A9F',
] as const;

// ── Delivery zone labels ────────────────────────────────────────────────────
export const DELIVERY_ZONE_LABELS: Record<string, string> = {
  pickup:   'Shop Pickup',
  cbd:      'Nairobi CBD',
  environs: 'Nairobi Environs',
  county:   'Other County',
};

// ── Order status config ─────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  pending:    { label:'Pending',    color:'#8A6A20', bg:'rgba(200,169,81,0.1)',  border:'rgba(200,169,81,0.3)',  icon:'⏳', step:0 },
  processing: { label:'Processing', color:'#0D1B3E', bg:'rgba(13,27,62,0.07)',   border:'rgba(13,27,62,0.15)',   icon:'🔄', step:1 },
  confirmed:  { label:'Confirmed',  color:'#2D6A9F', bg:'rgba(45,106,159,0.08)', border:'rgba(45,106,159,0.25)', icon:'✅', step:2 },
  shipped:    { label:'Shipped',    color:'#5A3E8A', bg:'rgba(90,62,138,0.08)',  border:'rgba(90,62,138,0.25)',  icon:'🚚', step:3 },
  delivered:  { label:'Delivered',  color:'#4A7A4A', bg:'rgba(74,122,74,0.1)',   border:'rgba(74,122,74,0.25)',  icon:'🎉', step:4 },
  cancelled:  { label:'Cancelled',  color:'#C0392B', bg:'#FDF0EE',              border:'#F5C6C0',               icon:'✕',  step:-1 },
} as const;

// ── Announcement bar items ──────────────────────────────────────────────────
export const ANNOUNCEMENTS = [
  '✦ NAIROBI CBD DELIVERY — KSH 100',
  '✦ NAIROBI ENVIRONS — KSH 200',
  '✦ OTHER COUNTIES — KSH 300',
  '✦ FREE PICKUP FROM OUR SHOP',
  '✦ NEW DROPS EVERY FRIDAY',
  '✦ AUTHENTIC FASHION ONLY',
  "✦ KENYA'S PREMIER FASHION STORE",
  '✦ SECURE M-PESA CHECKOUT',
  '✦ 30-DAY EASY RETURNS',
  '✦ WOMEN\'S COLLECTION NOW LIVE',
  '✦ EXCLUSIVE SNEAKER DROPS',
] as const;

// ── Social links ────────────────────────────────────────────────────────────
export const SOCIAL_LINKS = [
  {
    name:    'Instagram',
    url:     'https://www.instagram.com/lukuprimeshoesbagsthrift?igsh=MWxmazlvM2JseWNzeQ==',
    label:   '@lukuprimeshoesbagsthrift',
    color:   '#E1306C',
    hoverBg: 'rgba(225,48,108,0.12)',
  },
  {
    name:    'TikTok',
    url:     'https://tiktok.com/@lifewith_heels_bags',
    label:   '@lifewith_heels_bags',
    color:   '#ffffff',
    hoverBg: 'rgba(255,255,255,0.1)',
  },
  {
    name:    'YouTube',
    url:     'https://www.youtube.com/@Lukuprime254',
    label:   '@Lukuprime254',
    color:   '#FF0000',
    hoverBg: 'rgba(255,0,0,0.12)',
  },
] as const;

// ── Homepage banner slides ──────────────────────────────────────────────────
export const BANNERS = [
  {
    tag:   'NEW COLLECTION',
    title: 'Luku ni\nPrime Siku Zote',
    sub:   'Premium fashion arrivals crafted for those who demand the finest — delivered across Kenya.',
    cta:   'Shop Now',
    img:   'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80',
  },
  {
    tag:   'FOOTWEAR DROP',
    title: 'Step into\nStyle',
    sub:   'Exclusive sneakers and shoes that turn heads wherever you go.',
    cta:   'Shop Footwear',
    img:   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
  },
  {
    tag:   'OUTERWEAR SEASON',
    title: 'Piga Luku\nSafi',
    sub:   'Hoodies, jackets and outerwear for every mood and every weather.',
    cta:   'Shop Outerwear',
    img:   'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=1200&q=80',
  },
] as const;

// ── Product categories ──────────────────────────────────────────────────────
export const CATEGORIES = [
  { label:'All',         icon:'👑', desc:'Full Collection'  },
  { label:'Clothes',     icon:'👗', desc:'Tops & Bottoms'   },
  { label:'Shoes',       icon:'👟', desc:'All Footwear'     },
  { label:'Bags',        icon:'👜', desc:'Bags & Purses'    },
  { label:'Female Wear', icon:'💃', desc:"Women's Fashion"  },
  { label:'Sneakers',    icon:'👠', desc:'Kicks & Trainers' },
  { label:'Jackets',     icon:'🧥', desc:'Outerwear'        },
  { label:'Socks',       icon:'🧦', desc:'Every Pair'       },
  { label:'Jerseys',     icon:'⚽', desc:'Team & Sport'     },
  { label:'Hoodies',     icon:'🏷️', desc:'Comfy Fleece'    },
] as const;

// ── Trust strip items ───────────────────────────────────────────────────────
export const TRUST_ITEMS = [
  { icon:'🚚', label:'Delivery Fees',    sub:'CBD 100 · Environs 200 · Counties 300' },
  { icon:'🏪', label:'Free Shop Pickup', sub:'Collect at no extra charge'             },
  { icon:'🔒', label:'Secure Checkout',  sub:'M-Pesa & Cards'                         },
  { icon:'↩️', label:'30-Day Returns',   sub:'Hassle-free exchanges'                  },
] as const;

// ── Shared types ────────────────────────────────────────────────────────────
export interface Product {
  id:          number;
  name:        string;
  price:       string;
  image_url:   string;
  description: string;
  category?:   string;
  stock?:      number;
  created_at?: string;
}

export interface User {
  id:          number;
  full_name:   string;
  email:       string;
  role:        string;
  is_verified: boolean;
}

export interface HomepageReview {
  id:            number;
  rating:        number;
  comment:       string;
  created_at:    string;
  full_name:     string;
  product_name:  string;
  product_image: string;
  product_id:    number;
}

// ── Utility helpers ─────────────────────────────────────────────────────────
export const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const readUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
};

export const isNewProduct = (createdAt?: string) =>
  createdAt ? Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000 : false;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day:'numeric', month:'long', year:'numeric' });

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' });