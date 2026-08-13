// src/pages/profile/profileStyles.ts
// Shared styling tokens for the whole /profile section.
// Mirrors the tokens already used in Homepage.tsx / Navbar.tsx
// (--ink, --mid, --rule, Jost + Cormorant Garamond) so this section
// doesn't feel like a bolted-on module.

export const profileCss = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

  .pf-root {
    --pf-ink: #0A0A0A;
    --pf-paper: #FFFFFF;
    --pf-mid: #888;
    --pf-rule: rgba(0,0,0,0.08);
    --pf-card: #fff;
    --pf-accent: #0A0A0A;
    --pf-danger: #dc2626;
    --pf-f-display: 'Cormorant Garamond', Georgia, serif;
    --pf-f-sans: 'Jost', 'DM Sans', system-ui, sans-serif;
    --pf-f-inter: 'Inter', system-ui, sans-serif;
    background: var(--pf-paper);
    color: var(--pf-ink);
    min-height: 100vh;
    transition: background 0.25s ease, color 0.25s ease;
  }

  .pf-root[data-theme='dark'] {
    --pf-ink: #F2F2F0;
    --pf-paper: #0A0A0A;
    --pf-mid: #9A9A9A;
    --pf-rule: rgba(255,255,255,0.10);
    --pf-card: #141414;
    --pf-accent: #F2F2F0;
  }

  .pf-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    max-width: 1240px;
    margin: 0 auto;
    padding: 40px clamp(16px, 4vw, 40px) 100px;
    gap: clamp(24px, 4vw, 56px);
    padding-top: 120px; /* clears fixed Navbar + announcement bar */
  }
  @media (max-width: 860px) {
    .pf-shell { grid-template-columns: 1fr; padding-top: 112px; }
  }

  .pf-sidebar { position: sticky; top: 112px; align-self: start; }
  @media (max-width: 860px) { .pf-sidebar { position: static; } }

  .pf-user-card {
    display: flex; align-items: center; gap: 12px;
    padding-bottom: 20px; margin-bottom: 8px;
    border-bottom: 1px solid var(--pf-rule);
  }
  .pf-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--pf-ink); color: var(--pf-paper);
    font-family: var(--pf-f-sans); font-size: 13px; font-weight: 600; letter-spacing: 1px;
    flex-shrink: 0;
  }
  .pf-user-name { font-family: var(--pf-f-sans); font-size: 13px; font-weight: 600; color: var(--pf-ink); }
  .pf-user-tier { font-family: var(--pf-f-sans); font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--pf-ink); margin-top: 2px; }
  .pf-user-tier.bronze { color: #A0826D; }
  .pf-user-tier.silver { color: #9CA3AF; }
  .pf-user-tier.gold { color: #D4AF37; }
  .pf-user-tier.platinum { color: #E5E7EB; }

  .pf-nav { display: flex; flex-direction: column; gap: 2px; }
  .pf-nav-link {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--pf-f-sans); font-size: 12px; font-weight: 500; letter-spacing: 1px;
    color: var(--pf-mid); text-transform: uppercase;
    padding: 11px 12px; border-radius: 8px; cursor: pointer;
    border: none; background: none; text-align: left; width: 100%;
    transition: background 0.15s, color 0.15s;
  }
  .pf-nav-link:hover { background: rgba(0,0,0,0.04); color: var(--pf-ink); }
  .pf-root[data-theme='dark'] .pf-nav-link:hover { background: rgba(255,255,255,0.06); }
  .pf-nav-link.active { background: var(--pf-ink); color: var(--pf-paper); }
  .pf-nav-divider { margin: 10px 4px; border-top: 1px solid var(--pf-rule); }
  .pf-nav-link.danger { color: var(--pf-danger); }
  .pf-nav-link.danger:hover { background: rgba(220,38,38,0.07); }

  /* Mobile tab bar */
  .pf-tabbar {
    display: none;
    overflow-x: auto; gap: 8px; padding-bottom: 12px; margin-bottom: 8px;
    border-bottom: 1px solid var(--pf-rule);
    scrollbar-width: none;
  }
  .pf-tabbar::-webkit-scrollbar { display: none; }
  @media (max-width: 860px) { .pf-tabbar { display: flex; } .pf-sidebar-desktop { display: none; } }
  .pf-tab {
    flex-shrink: 0; font-family: var(--pf-f-sans); font-size: 10.5px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--pf-mid);
    padding: 8px 14px; border-radius: 20px; border: 1px solid var(--pf-rule);
    background: none; cursor: pointer; white-space: nowrap;
  }
  .pf-tab.active { background: var(--pf-ink); color: var(--pf-paper); border-color: var(--pf-ink); }

  .pf-main { min-width: 0; }
  .pf-eyebrow { font-family: var(--pf-f-inter); font-size: 10px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--pf-ink); margin-bottom: 6px; }
  .pf-title { font-family: var(--pf-f-sans); font-weight: 700; font-size: clamp(26px, 3.4vw, 40px); letter-spacing: -0.5px; color: var(--pf-ink); margin-bottom: 4px; }
  .pf-title em { font-style: italic; font-weight: 400; color: var(--pf-ink); }
  .pf-sub { font-family: var(--pf-f-inter); font-size: 13px; font-weight: 400; color: var(--pf-ink); margin-bottom: 32px; max-width: 520px; }

  .pf-card {
    background: var(--pf-card); border: 1px solid var(--pf-rule); border-radius: 12px;
    padding: clamp(18px, 2.6vw, 28px);
  }
  .pf-card + .pf-card { margin-top: 16px; }

  .pf-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  @media (max-width: 640px) { .pf-stats-grid { grid-template-columns: repeat(2, 1fr); } }
  .pf-stat { background: var(--pf-card); border: 1px solid var(--pf-rule); border-radius: 12px; padding: 18px 16px; }
  .pf-stat-value { font-family: var(--pf-f-sans); font-weight: 700; font-size: 28px; color: var(--pf-ink); line-height: 1; }
  .pf-stat-label { font-family: var(--pf-f-inter); font-size: 9.5px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--pf-ink); margin-top: 8px; }

  .pf-section-title { font-family: var(--pf-f-sans); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--pf-ink); margin-bottom: 14px; }

  .pf-btn-primary {
    font-family: var(--pf-f-sans); font-size: 11px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    background: var(--pf-ink); color: var(--pf-paper); border: none; padding: 13px 26px; cursor: pointer;
    border-radius: 4px; transition: opacity 0.2s, transform 0.15s;
  }
  .pf-btn-primary:hover { opacity: 0.82; }
  .pf-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .pf-btn-ghost {
    font-family: var(--pf-f-sans); font-size: 11px; font-weight: 500; letter-spacing: 2.5px; text-transform: uppercase;
    background: transparent; color: var(--pf-ink); border: 1px solid var(--pf-rule); padding: 12px 24px; cursor: pointer;
    border-radius: 4px; transition: border-color 0.2s, background 0.2s;
  }
  .pf-btn-ghost:hover { border-color: var(--pf-ink); }

  .pf-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
  .pf-label { font-family: var(--pf-f-inter); font-size: 10px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--pf-ink); }
  .pf-input, .pf-select {
    font-family: var(--pf-f-inter); font-size: 13px; color: var(--pf-ink);
    background: var(--pf-paper); border: 1px solid var(--pf-rule); border-radius: 6px;
    padding: 11px 13px; outline: none; transition: border-color 0.15s;
  }
  .pf-input:focus, .pf-select:focus { border-color: var(--pf-ink); }

  .pf-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--pf-rule); }
  .pf-row:last-child { border-bottom: none; }
  .pf-row-label { font-family: var(--pf-f-sans); font-size: 13px; font-weight: 500; color: var(--pf-ink); }
  .pf-row-desc { font-family: var(--pf-f-inter); font-size: 11.5px; color: var(--pf-ink); margin-top: 2px; }

  .pf-toggle { position: relative; width: 42px; height: 24px; border-radius: 20px; background: var(--pf-rule); border: none; cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
  .pf-toggle.on { background: var(--pf-ink); }
  .pf-toggle-knob { position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
  .pf-toggle.on .pf-toggle-knob { transform: translateX(18px); }

  .pf-empty { text-align: center; padding: 48px 20px; }
  .pf-empty-title { font-family: var(--pf-f-sans); font-weight: 700; font-style: italic; font-size: 22px; color: var(--pf-ink); margin-bottom: 8px; }
  .pf-empty-sub { font-family: var(--pf-f-inter); font-size: 12.5px; color: var(--pf-ink); }

  .pf-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: var(--pf-ink); color: var(--pf-paper); font-family: var(--pf-f-sans);
    font-size: 12px; font-weight: 500; letter-spacing: 0.5px; padding: 12px 20px;
    border-radius: 8px; z-index: 999; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: pfToastIn 0.2s ease;
  }
  @keyframes pfToastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
`;