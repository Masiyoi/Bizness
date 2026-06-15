// src/components/common/PageShell.tsx
import { useNavigate } from 'react-router-dom';

interface PageShellProps {
  badge:    string;
  title:    string;
  subtitle: string;
  children: React.ReactNode;
}

export default function PageShell({ badge, title, subtitle, children }: PageShellProps) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f9', fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Hero banner ── */}
      <div style={{
        background: '#000',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: 'clamp(48px,8vw,80px) clamp(20px,6%,80px) clamp(32px,5vw,52px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)',
          backgroundSize: '28px 28px',
        }}/>
        {/* Subtle orbs */}
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,255,255,0.04) 0%,transparent 70%)', top:-100, right:-80, pointerEvents:'none' }}/>

        <div style={{ maxWidth: 800, position: 'relative' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 20,
              padding: '5px 14px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              textTransform: 'uppercase',
              marginBottom: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
          >
            ← Back
          </button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 10, fontWeight: 700, letterSpacing: '2px',
            color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase',
            marginBottom: 16, marginLeft: 10,
          }}>
            {badge}
          </div>

          <h1 style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 'clamp(28px,5vw,48px)',
            fontWeight: 700,
            color: '#fff',
            margin: '12px 0 16px',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
          }}>
            {title}
          </h1>

          <p style={{
            fontSize: 'clamp(13px,1.6vw,15px)',
            color: 'rgba(255,255,255,0.38)',
            maxWidth: 520,
            lineHeight: 1.85,
            margin: 0,
            fontWeight: 300,
          }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(32px,5vw,64px) clamp(20px,6%,40px)' }}>
        {children}
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <span style={{ width: 2, height: 20, background: '#000', borderRadius: 2, flexShrink: 0 }}/>
        <h2 style={{
          fontFamily: "'DM Sans',sans-serif",
          fontSize: 'clamp(15px,2.2vw,18px)',
          fontWeight: 700,
          color: '#0a0a0a',
          margin: 0,
          letterSpacing: '-0.2px',
        }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 14,
      color: '#444',
      lineHeight: 1.95,
      fontWeight: 300,
    }}>
      {children}
    </div>
  );
}

export function AccentCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.09)',
      borderRadius: 10,
      padding: '18px 22px',
      fontSize: 13,
      color: '#444',
      lineHeight: 1.85,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      {children}
    </div>
  );
}

export function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      padding: '20px 0',
    }}>
      <div style={{
        fontWeight: 600,
        fontSize: 14,
        color: '#0a0a0a',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0, fontWeight: 300 }}>Q.</span>
        {q}
      </div>
      <div style={{
        fontSize: 13,
        color: '#666',
        lineHeight: 1.9,
        paddingLeft: 22,
        fontWeight: 300,
      }}>
        {a}
      </div>
    </div>
  );
}

export function InfoGrid({ items }: { items: { icon: string; label: string; value: string }[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
      gap: 12,
    }}>
      {items.map(item => (
        <div key={item.label} style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 10,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: '#0a0a0a', fontWeight: 600 }}>{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
