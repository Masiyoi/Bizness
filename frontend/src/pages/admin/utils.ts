import type { Order } from './types';

export const parseItemsSnapshot = (snapshot: any): any[] => {
  if (!snapshot) return [];
  if (Array.isArray(snapshot)) return snapshot;
  if (typeof snapshot === 'string') {
    try {
      const p = JSON.parse(snapshot);
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }
  if (typeof snapshot === 'object') {
    if (Array.isArray(snapshot.items)) return snapshot.items;
    return [];
  }
  return [];
};

export const parseShippingInfo = (order: Order): any => {
  if (order.shipping_info) {
    if (typeof order.shipping_info === 'object') return order.shipping_info;
    try { return JSON.parse(order.shipping_info); } catch {}
  }
  const snap = order.items_snapshot;
  const tryExtract = (p: any) => p?.shipping || p?.shippingInfo || p?.shipping_info || null;
  if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
    const r = tryExtract(snap); if (r) return r;
  }
  if (typeof snap === 'string') {
    try { return tryExtract(JSON.parse(snap)); } catch {}
  }
  return null;
};

export const parseDeliveryZone = (order: Order): string | null => {
  if (order.delivery_zone) return order.delivery_zone;
  const snap = order.items_snapshot;
  const tryExtract = (p: any) => p?.deliveryZone || p?.delivery_zone || null;
  if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
    const r = tryExtract(snap); if (r) return r;
  }
  if (typeof snap === 'string') {
    try { return tryExtract(JSON.parse(snap)); } catch {}
  }
  return null;
};

export const authH = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});