import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const T = {
  navy: '#0D1B3E',
  gold: '#C8A951',
  goldLight: '#DEC06A',
};

interface FloatingCartProps {
  count: number;
}

export default function FloatingCart({ count }: FloatingCartProps) {
  const navigate = useNavigate();
  const [bump, setBump] = useState(false);

  // Trigger the visual "bump" animation whenever the count changes
  useEffect(() => {
    if (count > 0) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 350);
      return () => clearTimeout(timer);
    }
  }, [count]);

  // Hide the component if user is not logged in
  const token = localStorage.getItem('token');
  if (!token) return null;

  return (
    <>
      <style>{`
        @keyframes cartBump {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.22); }
          100% { transform: scale(1); }
        }
        @keyframes badgePop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .fc-btn {
          position: fixed;
          bottom: 28px;
          right: 24px;
          z-index: 999;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: ${T.navy};
          box-shadow: 0 4px 20px rgba(13,27,62,0.35), 0 0 0 1.5px rgba(200,169,81,0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: box-shadow 0.2s, background 0.2s;
        }
        .fc-btn:hover {
          background: #1E2F5A;
          box-shadow: 0 6px 28px rgba(13,27,62,0.45), 0 0 0 2px rgba(200,169,81,0.55);
        }
        .fc-icon {
          font-size: 20px;
          line-height: 1;
        }
        .fc-bump { animation: cartBump 0.35s ease both; }
        .fc-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          background: ${T.gold};
          color: ${T.navy};
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #fff;
          animation: badgePop 0.3s ease both;
          letter-spacing: 0;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .fc-tooltip {
          position: absolute;
          right: 60px;
          bottom: 50%;
          transform: translateY(50%);
          background: ${T.navy};
          color: ${T.gold};
          font-family: 'Jost', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1px;
          white-space: nowrap;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid rgba(200,169,81,0.3);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.18s;
        }
        .fc-btn:hover .fc-tooltip { opacity: 1; }
        .fc-tooltip::after {
          content: '';
          position: absolute;
          right: -5px;
          top: 50%;
          transform: translateY(-50%);
          width: 0; height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 5px solid ${T.navy};
        }
      `}</style>

      <button
        className={`fc-btn${bump ? ' fc-bump' : ''}`}
        onClick={() => navigate('/cart')}
        aria-label={`View cart — ${count} item${count !== 1 ? 's' : ''}`}
      >
        <span className="fc-tooltip">
          {count > 0 ? `${count} item${count !== 1 ? 's' : ''} in cart` : 'View cart'}
        </span>
        <span className="fc-icon">🛒</span>
        
        {count > 0 && (
          /* Using key={count} ensures the badgePop animation re-triggers on every change */
          <span className="fc-badge" key={count}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </>
  );
}