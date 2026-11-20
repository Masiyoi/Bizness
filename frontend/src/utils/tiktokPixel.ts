import { identifyTikTokUser } from './tiktokIdentity';
// Thin wrapper around the TikTok browser pixel (loaded in index.html).
declare global { interface Window { ttq?: any } }
export const newTtEventId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
export const trackTikTok = (
  event: string,
  props: Record<string, unknown> = {},
  eventId?: string
) => {
  try {
    identifyTikTokUser(); window.ttq?.track(event, props, { event_id: eventId || newTtEventId() });
  } catch { /* tracking must never break the UI */ }
};
export const ttViewContent = (p: { id: number | string; name: string; price: number }) =>
  trackTikTok('ViewContent', {
    contents: [{
      content_id: String(p.id),
      content_type: 'product',
      content_name: p.name,
      price: p.price,
      quantity: 1,
    }],
    content_type: 'product',
    currency: 'KES',
    value: p.price,
  });
export const ttPageView = () => {
  try { identifyTikTokUser(); window.ttq?.page(); } catch { /* ignore */ }
};