// src/constants/theme.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for Luku Prime brand tokens.
// Use these for any inline styles that can't be expressed with Tailwind classes
// (e.g. dynamic gradient strings, rgba() values in JS, canvas drawing, etc.)
//
// For everything else — use the Tailwind classes defined in tailwind.config.js:
//   bg-black, text-white, border-gray-300, etc.
// ─────────────────────────────────────────────────────────────────────────────

export const T = {
  // ── Core palette ───────────────────────────────────────────────
  navy:      '#000000',   // was #0D1B3E → pure black
  navyMid:   '#111111',   // was #152348 → near-black
  navyLight: '#222222',   // was #1E2F5A → dark charcoal

  gold:      '#FFFFFF',   // was #C8A951 → pure white (primary accent)
  goldLight: '#E0E0E0',   // was #DEC06A → light grey
  goldPale:  '#F5F5F5',   // was #F0D98A → off-white

  cream:     '#F9F9F9',   // was #F9F5EC → near-white
  creamMid:  '#EFEFEF',   // was #F0EAD8 → light grey
  creamDeep: '#D9D9D9',   // was #E4D9C0 → mid grey

  white:     '#FFFFFF',
  text:      '#000000',   // was #0D1B3E → pure black
  muted:     '#6B6B6B',   // was #7A7A8A → neutral grey
} as const;

// ── Avatar colour pool (cycles by id) ──────────────────────────────────────
export const AVATAR_COLORS = [
  '#000000', '#111111', '#222222',
  '#444444', '#555555', '#777777',
  '#999999', '#BBBBBB',
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
  pending:    { label:'Pending',    color:'#555555', bg:'rgba(0,0,0,0.05)',   border:'rgba(0,0,0,0.15)',   icon:'⏳', step:0 },
  processing: { label:'Processing', color:'#000000', bg:'rgba(0,0,0,0.07)',   border:'rgba(0,0,0,0.20)',   icon:'🔄', step:1 },
  confirmed:  { label:'Confirmed',  color:'#000000', bg:'rgba(0,0,0,0.08)',   border:'rgba(0,0,0,0.30)',   icon:'✅', step:2 },
  shipped:    { label:'Shipped',    color:'#333333', bg:'rgba(0,0,0,0.06)',   border:'rgba(0,0,0,0.25)',   icon:'🚚', step:3 },
  delivered:  { label:'Delivered',  color:'#000000', bg:'rgba(0,0,0,0.10)',   border:'rgba(0,0,0,0.35)',   icon:'🎉', step:4 },
  cancelled:  { label:'Cancelled',  color:'#888888', bg:'#F5F5F5',           border:'#CCCCCC',            icon:'✕',  step:-1 },
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
    color:   '#000000',
    hoverBg: 'rgba(0,0,0,0.08)',
  },
  {
    name:    'TikTok',
    url:     'https://tiktok.com/@lifewith_heels_bags',
    label:   '@lifewith_heels_bags',
    color:   '#000000',
    hoverBg: 'rgba(0,0,0,0.08)',
  },
  {
    name:    'YouTube',
    url:     'https://www.youtube.com/@Lukuprime254',
    label:   '@Lukuprime254',
    color:   '#000000',
    hoverBg: 'rgba(0,0,0,0.08)',
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
  sale_price?:   number | null;
  sale_ends_at?: string | null;
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
  category?:    string;
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