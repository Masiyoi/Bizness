// src/pages/Notifications.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/common/Footer';
import { readUser } from '../constants/theme';
import type { User } from '../constants/theme';
import { useNotifications, seenBaseline } from '../hooks/useNotifications';
import type { NotificationType } from '../hooks/useNotifications';
type Group = 'all' | 'orders' | 'offers' | 'rewards' | 'affiliate';
const META: Record<NotificationType, { label: string; group: Exclude<Group, 'all'>; color: string }> = {
  order_confirmed: { label: 'Order confirmed',   group: 'orders',    color: '#1A7F4B' },
  order_delivered: { label: 'Delivered',         group: 'orders',    color: '#1A7F4B' },
  review_reminder: { label: 'Leave a review',    group: 'orders',    color: '#B7791F' },
  new_arrival:     { label: 'New arrival',       group: 'offers',    color: '#0A0A0A' },
  flash_sale:      { label: 'Flash sale',        group: 'offers',    color: '#D93025' },
  discount:        { label: 'Discount applied',  group: 'offers',    color: '#D93025' },
  points:          { label: 'Members Club',      group: 'rewards',   color: '#7C3AED' },
  tier_upgrade:    { label: 'Tier upgrade',      group: 'rewards',   color: '#7C3AED' },
  commission:      { label: 'Commission earned', group: 'affiliate', color: '#0B6E99' },
  payout:          { label: 'Payout',            group: 'affiliate', color: '#0B6E99' },
};
const TABS: { key: Group; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'orders', label: 'Orders' },
  { key: 'offers', label: 'Offers' },
  { key: 'rewards', label: 'Rewards' },
  { key: 'affiliate', label: 'Affiliate' },
];
const timeAgo = (iso: string) => {
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=DM+Sans:wght@300;400;500;700&display=swap');
  @keyframes ntPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
  .nt-page { --ink: #0A0A0A; --mid: #888; --rule: rgba(0,0,0,0.10); --f-display: 'Cormorant Garamond', Georgia, serif; --f-sans: 'DM Sans', system-ui, sans-serif; background: #FAFAFA; min-height: 100vh; color: var(--ink); font-family: var(--f-sans); }
  .nt-page *, .nt-page *::before, .nt-page *::after { box-sizing: border-box; }
  .nt-top { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 14px clamp(20px,5%,80px); background: rgba(250,250,250,0.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--rule); }
  .nt-linkbtn { font-family: var(--f-sans); font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; background: none; border: none; cursor: pointer; color: var(--ink); padding: 6px 0; }
  .nt-linkbtn:hover { opacity: 0.6; }
  .nt-wrap { max-width: 760px; margin: 0 auto; padding: clamp(32px,6vw,72px) clamp(16px,4vw,32px) clamp(48px,8vw,96px); }
  .nt-kicker { font-size: 10px; font-weight: 500; letter-spacing: 3.5px; text-transform: uppercase; color: var(--mid); margin-bottom: 8px; }
  .nt-title { font-family: var(--f-display); font-weight: 300; font-size: clamp(32px,5vw,56px); letter-spacing: -1px; line-height: 1.05; margin-bottom: 28px; }
  .nt-title em { font-style: italic; color: var(--mid); }
  .nt-tabs { display: flex; overflow-x: auto; border-bottom: 1px solid var(--rule); scrollbar-width: none; }
  .nt-tabs::-webkit-scrollbar { display: none; }
  .nt-tab { flex-shrink: 0; position: relative; padding: 14px 18px; font-family: var(--f-sans); font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: var(--mid); background: none; border: none; cursor: pointer; white-space: nowrap; }
  .nt-tab:hover, .nt-tab.active { color: var(--ink); }
  .nt-tab.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--ink); }
  .nt-tab small { margin-left: 6px; font-size: 10px; font-weight: 400; opacity: 0.6; }
  .nt-item { width: 100%; text-align: left; display: flex; gap: 14px; align-items: flex-start; padding: 18px 14px; background: none; border: none; border-bottom: 1px solid var(--rule); border-left: 2px solid transparent; font-family: var(--f-sans); color: var(--ink); cursor: default; transition: background 0.18s; }
  .nt-item.link { cursor: pointer; }
  .nt-item.link:hover { background: rgba(0,0,0,0.03); }
  .nt-item.unread { background: rgba(0,0,0,0.035); border-left-color: var(--ink); }
  .nt-thumb { width: 56px; height: 56px; object-fit: cover; flex-shrink: 0; background: #eee; }
  .nt-body { flex: 1; min-width: 0; }
  .nt-kick { display: block; font-size: 9px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 5px; }
  .nt-item-title { display: block; font-size: 14px; font-weight: 500; line-height: 1.4; margin-bottom: 3px; }
  .nt-msg { display: block; font-size: 13px; font-weight: 300; color: #444; line-height: 1.6; }
  .nt-time { display: block; font-size: 11px; color: var(--mid); margin-top: 6px; }
  .nt-empty { text-align: center; padding: clamp(48px,8vw,96px) 24px; }
  .nt-empty-title { font-family: var(--f-display); font-weight: 300; font-style: italic; font-size: clamp(26px,4vw,40px); margin-bottom: 10px; }
  .nt-empty-sub { font-size: 13px; font-weight: 300; color: var(--mid); margin-bottom: 24px; }
  .nt-btn { font-family: var(--f-sans); font-size: 11px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; background: var(--ink); color: #fff; border: none; padding: 14px 32px; cursor: pointer; }
  .nt-skel { height: 76px; margin: 14px 0; background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); animation: ntPulse 1.4s ease infinite; }
`;
export default function Notifications() {
  const navigate = useNavigate();
  const [user] = useState<User | null>(readUser);
  const { notifications, loading, error, markAllRead, refresh } = useNotifications(user?.id);
  const [seenAtEntry] = useState(() => seenBaseline(user?.id)); // keeps "new" highlights during this visit
  const [group, setGroup] = useState<Group>('all');
  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading && !error) markAllRead(); }, [loading]);
  const counts = useMemo(() => {
    const c: Record<Group, number> = { all: notifications.length, orders: 0, offers: 0, rewards: 0, affiliate: 0 };
    notifications.forEach(n => { const g = META[n.type]?.group; if (g) c[g] += 1; });
    return c;
  }, [notifications]);
  const visible = group === 'all' ? notifications : notifications.filter(n => META[n.type]?.group === group);
  return (
    <div className="nt-page">
      <style>{css}</style>
      <header className="nt-top">
        <button className="nt-linkbtn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>← Back</button>
        <button className="nt-linkbtn" onClick={() => navigate('/')}>Continue shopping</button>
      </header>
      <main className="nt-wrap">
        <p className="nt-kicker">Your activity</p>
        <h1 className="nt-title">Your <em>Notifications</em></h1>
        <div className="nt-tabs">
          {TABS.filter(t => t.key === 'all' || counts[t.key] > 0).map(t => (
            <button key={t.key} className={`nt-tab${group === t.key ? ' active' : ''}`} onClick={() => setGroup(t.key)}>
              {t.label}<small>{counts[t.key]}</small>
            </button>
          ))}
        </div>
        {loading && [0, 1, 2, 3].map(i => <div key={i} className="nt-skel" />)}
        {!loading && error && (
          <div className="nt-empty">
            <p className="nt-empty-title">Couldn’t load notifications</p>
            <p className="nt-empty-sub">Check your connection and try again.</p>
            <button className="nt-btn" onClick={refresh}>Retry</button>
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <div className="nt-empty">
            <p className="nt-empty-title">You’re all caught up</p>
            <p className="nt-empty-sub">Order updates, offers and rewards will show up here.</p>
            <button className="nt-btn" onClick={() => navigate('/')}>Start shopping</button>
          </div>
        )}
        {!loading && !error && visible.map(n => {
          const meta = META[n.type];
          const unread = Date.parse(n.created_at) > seenAtEntry;
          return (
            <button
              key={n.id}
              type="button"
              className={`nt-item${n.link ? ' link' : ''}${unread ? ' unread' : ''}`}
              onClick={() => { if (n.link) navigate(n.link); }}
            >
              {n.image && <img className="nt-thumb" src={n.image} alt="" loading="lazy" />}
              <span className="nt-body">
                <span className="nt-kick" style={{ color: meta?.color ?? '#0A0A0A' }}>{meta?.label ?? n.type}</span>
                <span className="nt-item-title">{n.title}</span>
                <span className="nt-msg">{n.message}</span>
                <span className="nt-time">{timeAgo(n.created_at)}</span>
              </span>
            </button>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}