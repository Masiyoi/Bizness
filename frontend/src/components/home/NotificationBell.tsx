// src/components/home/NotificationBell.tsx
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
const css = `
  .lp-notif-fab { position: fixed; bottom: 28px; left: 28px; z-index: 9999; width: 58px; height: 58px; border-radius: 50%; border: none; background: #0A0A0A; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.18); transition: transform 0.2s, box-shadow 0.2s; padding: 0; }
  .lp-notif-fab:hover { transform: translateY(-3px) scale(1.06); box-shadow: 0 8px 28px rgba(0,0,0,0.22); }
  .lp-notif-badge { position: absolute; top: -3px; right: -3px; min-width: 22px; height: 22px; padding: 0 5px; border-radius: 11px; background: #D93025; color: #fff; border: 2px solid #FAFAFA; box-sizing: border-box; font-family: 'DM Sans', system-ui, sans-serif; font-size: 10px; font-weight: 700; line-height: 18px; text-align: center; }
  @keyframes lpNotifRing { 0%,50%,100% { transform: rotate(0) } 10%,30% { transform: rotate(-14deg) } 20%,40% { transform: rotate(14deg) } }
  .lp-notif-fab.has-unread svg { transform-origin: 50% 10%; animation: lpNotifRing 2.4s ease 1s 2; }
  .lp-notif-tooltip { position: fixed; bottom: 96px; left: 28px; z-index: 9999; background: #0a0a0a; color: #fff; font-family: 'DM Sans', system-ui, sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 1px; padding: 7px 14px; border-radius: 4px; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(4px); transition: opacity 0.18s, transform 0.18s; }
  .lp-notif-fab:hover + .lp-notif-tooltip, .lp-notif-fab:focus-visible + .lp-notif-tooltip { opacity: 1; transform: translateY(0); }
  @media (max-width: 640px) { .lp-notif-fab { width: 50px; height: 50px; bottom: 20px; left: 20px; } .lp-notif-tooltip { display: none; } }
`;
export default function NotificationBell({ userId }: { userId: number | string }) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications(userId);
  return (
    <>
      <style>{css}</style>
      <button
        type="button"
        className={`lp-notif-fab${unreadCount > 0 ? ' has-unread' : ''}`}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={() => navigate('/notifications')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && <span className="lp-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      <span className="lp-notif-tooltip">Notifications</span>
    </>
  );
}