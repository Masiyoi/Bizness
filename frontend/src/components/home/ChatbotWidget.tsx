// src/components/home/ChatbotWidget.tsx
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

type Msg = { role: 'user' | 'assistant'; text: string; error?: boolean };

const WHATSAPP_URL = 'https://wa.me/254723831949';

const GREETING: Msg = {
  role: 'assistant',
  text: "Hi, I'm the Plug. Ask me about shipping, returns, payments or the Members Club.",
};

const QUICK_QUESTIONS = [
  'How does shipping work?',
  'What is your return policy?',
  'How can I pay?',
  'How do Members Club points work?',
];

const css = `
  .cp-fab { position: fixed; right: 28px; bottom: 94px; z-index: 9999; width: 58px; height: 58px; padding: 0; border: none; background: none; cursor: grab; touch-action: none; }
  .cp-fab:active { cursor: grabbing; }
  .cp-fab-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; box-shadow: 0 4px 16px rgba(0,0,0,0.28); pointer-events: none; }
  .cp-fab-badge { position: absolute; top: -2px; right: -2px; width: 20px; height: 20px; border-radius: 50%; background: #0A0A0A; color: #fff; font-family: var(--f-sans); font-size: 14px; font-weight: 700; line-height: 1; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); pointer-events: none; }
  @media(max-width:640px) { .cp-fab { right: 20px; bottom: 76px; width: 50px; height: 50px; } }

  @keyframes cpPop { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
  @keyframes cpDot { 0%, 80%, 100% { opacity: 0.25 } 40% { opacity: 1 } }

  .cp-panel { position: fixed; right: 20px; bottom: 20px; z-index: 10000; width: 380px; height: min(580px, calc(100vh - 40px)); display: flex; flex-direction: column; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 48px rgba(0,0,0,0.22); font-family: var(--f-sans); animation: cpPop 0.22s cubic-bezier(.22,.68,0,1.2) both; }
  @media(max-width:640px) { .cp-panel { right: 8px; left: 8px; bottom: 8px; width: auto; height: min(640px, calc(100dvh - 16px)); } }

  .cp-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #0A0A0A; color: #fff; flex-shrink: 0; }
  .cp-head-img { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .cp-head-title { font-size: 13px; font-weight: 700; letter-spacing: 1px; }
  .cp-head-sub { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 2px; }
  .cp-close { margin-left: auto; width: 30px; height: 30px; border-radius: 50%; border: none; background: rgba(255,255,255,0.12); color: #fff; font-size: 18px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.18s; }
  .cp-close:hover { background: rgba(255,255,255,0.22); }

  .cp-body { flex: 1; overflow-y: auto; padding: 16px; background: #FAFAFA; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
  .cp-row { display: flex; }
  .cp-row.user { justify-content: flex-end; }
  .cp-bubble { max-width: 82%; padding: 10px 14px; font-size: 13px; font-weight: 400; line-height: 1.55; white-space: pre-wrap; word-wrap: break-word; border-radius: 14px; }
  .cp-bubble.assistant { background: #fff; color: #0A0A0A; border: 1px solid rgba(0,0,0,0.08); border-bottom-left-radius: 4px; }
  .cp-bubble.user { background: #0A0A0A; color: #fff; border-bottom-right-radius: 4px; }
  .cp-bubble a { color: inherit; font-weight: 600; text-decoration: underline; }

  .cp-typing { display: inline-flex; gap: 4px; padding: 4px 0; }
  .cp-typing span { width: 6px; height: 6px; border-radius: 50%; background: #0A0A0A; animation: cpDot 1.2s infinite; }
  .cp-typing span:nth-child(2) { animation-delay: 0.15s; }
  .cp-typing span:nth-child(3) { animation-delay: 0.3s; }

  .cp-chips { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 4px; }
  .cp-chip { font-family: var(--f-sans); font-size: 12px; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.18); border-radius: 999px; background: #fff; color: #0A0A0A; cursor: pointer; transition: background 0.18s, color 0.18s, border-color 0.18s; }
  .cp-chip:hover { background: #0A0A0A; color: #fff; border-color: #0A0A0A; }

  .cp-form { display: flex; align-items: center; gap: 8px; padding: 12px; border-top: 1px solid rgba(0,0,0,0.08); background: #fff; flex-shrink: 0; }
  .cp-input { flex: 1; min-width: 0; font-family: var(--f-sans); font-size: 16px; padding: 10px 14px; border: 1px solid rgba(0,0,0,0.15); border-radius: 999px; outline: none; color: #0A0A0A; background: #fff; }
  .cp-input:focus { border-color: #0A0A0A; }
  .cp-send { width: 40px; height: 40px; flex-shrink: 0; border-radius: 50%; border: none; background: #0A0A0A; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: opacity 0.18s; }
  .cp-send:disabled { opacity: 0.3; cursor: not-allowed; }
  .cp-note { padding: 0 12px 10px; background: #fff; font-size: 10px; color: #888; text-align: center; flex-shrink: 0; }
  .cp-note a { color: inherit; text-decoration: underline; }

  @media (prefers-reduced-motion: reduce) { .cp-panel { animation: none; } .cp-typing span { animation: none; opacity: 0.6; } }
`;

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Draggable launcher (same behaviour as the old inline FAB)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = fabRef.current?.getBoundingClientRect();
    if (!rect) return;
    drag.current = { dragging: true, moved: false, startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.dragging) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
    const size = fabRef.current?.offsetWidth ?? 58;
    setPos({
      x: Math.min(Math.max(0, drag.current.origX + dx), window.innerWidth - size),
      y: Math.min(Math.max(0, drag.current.origY + dy), window.innerHeight - size),
    });
  };

  const onPointerUp = () => { drag.current.dragging = false; };

  const onFabClick = () => {
    if (drag.current.moved) { drag.current.moved = false; return; }
    setOpen(true);
  };

  // Scroll to newest message
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending, open]);

  // Focus input on open, close on Escape
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;

    const next: Msg[] = [...messages, { role: 'user', text }];
    setMessages(next);
    setInput('');
    setSending(true);

    try {
      const { data } = await axios.post('/api/chat', {
        // the greeting is UI-only; don't send it or error bubbles to the model
        messages: next
          .filter(m => m !== GREETING && !m.error)
          .map(m => ({ role: m.role, text: m.text })),
      });
      setMessages(p => [...p, { role: 'assistant', text: data.reply }]);
    } catch (e: any) {
      const msg = e.response?.data?.error || "I couldn't answer that right now.";
      setMessages(p => [...p, { role: 'assistant', text: `${msg} You can reach our team on`, error: true }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <style>{css}</style>

      {!open && (
        <button
          ref={fabRef}
          type="button"
          className="cp-fab"
          aria-label="Ask the Plug"
          style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onFabClick}
        >
          <img className="cp-fab-img" src="/chatbot.jpg" alt="" aria-hidden="true" draggable={false} />
          <span className="cp-fab-badge">+</span>
        </button>
      )}

      {open && (
        <div className="cp-panel" role="dialog" aria-label="Ask the Plug">
          <div className="cp-head">
            <img className="cp-head-img" src="/chatbot.jpg" alt="" aria-hidden="true" />
            <div>
              <div className="cp-head-title">Ask the Plug</div>
              <div className="cp-head-sub">Luku Prime assistant</div>
            </div>
            <button type="button" className="cp-close" aria-label="Close chat" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="cp-body">
            {messages.map((m, i) => (
              <div key={i} className={`cp-row ${m.role}`}>
                <div className={`cp-bubble ${m.role}`}>
                  {m.text}
                  {m.error && <> <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">WhatsApp</a>.</>}
                </div>
              </div>
            ))}

            {messages.length === 1 && !sending && (
              <div className="cp-chips">
                {QUICK_QUESTIONS.map(q => (
                  <button key={q} type="button" className="cp-chip" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            )}

            {sending && (
              <div className="cp-row assistant">
                <div className="cp-bubble assistant" aria-label="The Plug is typing">
                  <span className="cp-typing"><span /><span /><span /></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="cp-form" onSubmit={e => { e.preventDefault(); send(input); }}>
            <input
              ref={inputRef}
              className="cp-input"
              placeholder="Type your question"
              value={input}
              maxLength={300}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" className="cp-send" aria-label="Send message" disabled={sending || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
          <div className="cp-note">
            AI assistant, answers may be wrong. For orders, <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.
          </div>
        </div>
      )}
    </>
  );
}