// src/hooks/useNotifications.ts
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
export type NotificationType =
  | 'order_confirmed' | 'order_delivered' | 'review_reminder'
  | 'new_arrival' | 'flash_sale' | 'discount'
  | 'points' | 'tier_upgrade'
  | 'commission' | 'payout';
export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  image?: string | null;
  created_at: string;
}
type Uid = number | string | null | undefined;
const seenKey = (userId: number | string) => `lp_notif_seen_${userId}`;
const FIRST_VISIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // never opened -> only last 7 days count as unread
const readLastSeen = (userId: Uid): number => {
  if (userId == null) return 0;
  try { return Number(localStorage.getItem(seenKey(userId))) || 0; } catch { return 0; }
};
export const seenBaseline = (userId: Uid): number =>
  readLastSeen(userId) || Date.now() - FIRST_VISIT_WINDOW_MS;
export function useNotifications(userId: Uid) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [serverTime, setServerTime] = useState<number>(Date.now());
  const [lastSeen, setLastSeen] = useState<number>(() => readLastSeen(userId));
  const refresh = useCallback(() => {
    if (userId == null) { setNotifications([]); setLoading(false); return; }
    axios.get('/api/notifications')
      .then(r => {
        setNotifications(Array.isArray(r.data?.notifications) ? r.data.notifications : []);
        if (r.data?.serverTime) setServerTime(Date.parse(r.data.serverTime));
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);
  useEffect(() => { setLastSeen(readLastSeen(userId)); refresh(); }, [userId, refresh]);
  useEffect(() => {
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);
  const markAllRead = useCallback(() => {
    if (userId == null) return;
    try { localStorage.setItem(seenKey(userId), String(serverTime)); } catch { /* ignore */ }
    setLastSeen(serverTime);
  }, [userId, serverTime]);
  const since = lastSeen || Date.now() - FIRST_VISIT_WINDOW_MS;
  const unreadCount = notifications.filter(n => Date.parse(n.created_at) > since).length;
  return { notifications, loading, error, unreadCount, markAllRead, refresh };
}