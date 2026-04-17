import { useEffect, useState, useRef } from 'react';
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

  // ── Drag state ──────────────────────────────────────────────────
  const btnRef    = useRef<HTMLButtonElement>(null);
  const dragging  = useRef(false);
  const hasDragged = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Default position: bottom-right (mirrors original CSS)
  const [pos, setPos] = useState<{ bottom: number; right: number } | { top: number; left: number }>({
    bottom: 28,
    right:  24,
  });

  // Trigger bump animation on count change
  useEffect(() => {
    if (count > 0) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 350);
      return () => clearTimeout(t);
    }
  }, [count]);

  // ── Pointer-based drag ──────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only primary button (left-click / touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragging.current  = true;
    hasDragged.current = false;

    const rect = btnRef.current!.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    btnRef.current!.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;

    hasDragged.current = true;

    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;

    // Clamp within viewport
    const size = 52;
    const clampedLeft = Math.max(0, Math.min(window.innerWidth  - size, x));
    const clampedTop  = Math.max(0, Math.min(window.innerHeight - size, y));

    setPos({ top: clampedTop, left: clampedLeft });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragging.current = false;
    btnRef.current!.releasePointerCapture(e.pointerId);
  };

  const onClick = () => {
    // Suppress navigation if the user was dragging
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }
    navigate('/cart');
  };

  // ── Auth guard ──────────────────────────────────────────────────
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
          z-index: 999;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: none;
          background: ${T.navy};
          box-shadow: 0 4px 20px rgba(13,27,62,0.35), 0 0 0 1.5px rgba(200,169,81,0.35);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: box-shadow 0.2s, background 0.2s;
          touch-action: none;
          user-select: none;
        }
        .fc-btn:hover {
          background: #1E2F5A;
          box-shadow: 0 6px 28px rgba(13,27,62,0.45), 0 0 0 2px rgba(200,169,81,0.55);
        }
        .fc-btn:active { cursor: grabbing; }
        .fc-icon {
          font-size: 20px;
          line-height: 1;
          pointer-events: none;
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
          pointer-events: none;
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
        ref={btnRef}
        className={`fc-btn${bump ? ' fc-bump' : ''}`}
        style={pos}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={onClick}
        aria-label={`View cart — ${count} item${count !== 1 ? 's' : ''}`}
      >
        <span className="fc-tooltip">
          {count > 0 ? `${count} item${count !== 1 ? 's' : ''} in cart` : 'View cart'}
        </span>
        <span className="fc-icon">🛒</span>

        {count > 0 && (
          <span className="fc-badge" key={count}>
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </>
  );
}