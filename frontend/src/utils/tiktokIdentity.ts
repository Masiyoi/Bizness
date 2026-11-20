// TikTok advanced matching: hashed email, E.164 phone and a stable external_id.
const sha256 = async (s: string): Promise<string> => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};
const setCookie = (k: string, v: string, days = 90) => {
  try { document.cookie = k + '=' + encodeURIComponent(v) + ';max-age=' + days * 86400 + ';path=/;SameSite=Lax'; } catch { /* ignore */ }
};
export const toE164 = (raw: any): string => {
  let d = String(raw ?? '').replace(/[^\d+]/g, '');
  if (!d) return '';
  if (d.startsWith('+')) return d;
  if (d.startsWith('254')) return '+' + d;
  if (d.startsWith('0') && d.length === 10) return '+254' + d.slice(1);
  if (d.length === 9 && /^[17]/.test(d)) return '+254' + d;
  return '';
};
const readUser = (): any => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
const CACHE = 'pw_tt_ident';
export function identifyTikTokUser(): void {
  try {
    const tt = (window as any).ttq;
    if (!tt) return;
    const cached = localStorage.getItem(CACHE);
    if (cached) { try { tt.identify(JSON.parse(cached)); } catch { /* ignore */ } }
    refresh();
  } catch { /* never break the app */ }
}
async function refresh() {
  try {
    const tt = (window as any).ttq;
    if (!tt) return;
    let vid = localStorage.getItem('pw_vid');
    if (!vid) {
      vid = (crypto as any).randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
      localStorage.setItem('pw_vid', vid as string);
    }
    const u = readUser();
    const email = String(u?.email ?? '').trim().toLowerCase();
    const phone = toE164(u?.phone ?? u?.phone_number ?? u?.phoneNumber);
    const payload: any = {
      external_id: await sha256(u?.id != null ? 'user-' + u.id : (vid as string)),
    };
    if (email) payload.email = await sha256(email);
    if (phone) payload.phone_number = await sha256(phone);
    localStorage.setItem('pw_vid_hash', payload.external_id);
    const json = JSON.stringify(payload);
    if (localStorage.getItem(CACHE) !== json) {
      localStorage.setItem(CACHE, json);
      tt.identify(payload);
    }
  } catch { /* ignore */ }
}
(() => {
  try {
    const clid = new URLSearchParams(window.location.search).get('ttclid');
    if (clid) { localStorage.setItem('ttclid', clid); setCookie('ttclid', clid); }
    window.addEventListener('storage', (e) => { if (e.key === 'user') refresh(); });
    refresh();
  } catch { /* ignore */ }
})();
