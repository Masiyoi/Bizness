declare global { interface Window { fbq?: (...args: any[]) => void } }
// One ID per user action. Send the same value to the browser Pixel (eventID)
// and to the server (event_id) so Meta dedupes the pair.
export const newEventId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export const trackPixel = (
  event: string,
  params: Record<string, unknown> = {},
  eventId?: string
) => {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;
    window.fbq('track', event, params, eventId ? { eventID: eventId } : undefined);
  } catch { /* tracking must never break the UI */ }
};
