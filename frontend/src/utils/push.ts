// src/utils/push.ts
// Requires VITE_VAPID_PUBLIC_KEY (the PUBLIC key only) in Vercel env vars and your local .env.
// Vite bakes it in at build time, so redeploy after changing it.
import axios from 'axios';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

const OPT_OUT_KEY = 'push_opt_out';
const ASKED_KEY   = 'push_asked_at';
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Registers (or reuses) the service worker and waits until it's active. */
async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration('/sw.js');
  const registration = existing ?? (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  return registration;
}

/** Sends a subscription to the API. Throws if the server didn't save it. */
async function saveSubscription(subscription: PushSubscription): Promise<void> {
  await axios.post('/api/push/subscribe', subscription.toJSON());
}

/**
 * Call from the "Enable notifications" toggle (must run from a user tap on iOS).
 * Returns true only if the subscription exists in the browser AND was saved on the server.
 */
export async function enablePushNotifications(): Promise<boolean> {
  if (!isPushSupported()) return false;

  if (!VAPID_PUBLIC_KEY) {
    console.error('push: VITE_VAPID_PUBLIC_KEY is not set');
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  try { localStorage.removeItem(OPT_OUT_KEY); } catch { /* ignore */ }

  try {
    const registration = await getRegistration();

    // Reuse an existing browser subscription if there is one, so a previous
    // subscribe whose server save failed gets retried instead of duplicated.
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await saveSubscription(subscription);
    return true;
  } catch (err) {
    console.error('push: enable failed', err);
    return false;
  }
}

/** Call from the "Disable notifications" toggle. */
export async function disablePushNotifications(): Promise<void> {
  try { localStorage.setItem(OPT_OUT_KEY, '1'); } catch { /* ignore */ }
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;

    // Tell the server first (best effort), then drop the browser subscription.
    await axios
      .post('/api/push/unsubscribe', { endpoint: subscription.endpoint })
      .catch((err) => console.error('push: server unsubscribe failed', err));

    await subscription.unsubscribe();
  } catch (err) {
    console.error('push: disable failed', err);
  }
}

/**
 * Default-on behaviour for customers. Call after login; returns a cleanup fn.
 * - opted out on this device -> does nothing
 * - permission already granted -> (re)subscribes and saves silently
 * - permission not yet asked  -> asks on the first tap (iOS needs a gesture), at most once a week
 * - permission blocked        -> does nothing
 */
export function autoEnablePush(): () => void {
  const noop = () => {};
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return noop;
  try {
    if (localStorage.getItem(OPT_OUT_KEY) === '1') return noop;
    if (Notification.permission === 'denied') return noop;
    if (Notification.permission === 'granted') {
      void enablePushNotifications();
      return noop;
    }
    const askedAt = Number(localStorage.getItem(ASKED_KEY) || 0);
    if (Date.now() - askedAt < 7 * 24 * 60 * 60 * 1000) return noop;
    const onTap = () => {
      localStorage.setItem(ASKED_KEY, String(Date.now()));
      void enablePushNotifications();
    };
    window.addEventListener('click', onTap, { once: true });
    return () => window.removeEventListener('click', onTap);
  } catch {
    return noop;
  }
}
/** Use for the toggle's initial position. */
export async function isPushEnabled(): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    const subscription = await registration?.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}