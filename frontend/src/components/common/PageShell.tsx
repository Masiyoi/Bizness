// src/pages/PageShell.tsx
// Shared wrapper: navy hero banner + white content area + footer
import { useNavigate } from 'react-router-dom';

interface PageShellProps {
  badge:       string;
  title:       string;
  subtitle:    string;
  children:    React.ReactNode;
}

export default function PageShell({ badge, title, subtitle, children }: PageShellProps) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F9F6F1', fontFamily: "'Jost','DM Sans',sans-serif" }}>

      {/* ── Hero banner ── */}
      <div style={{
        background: '#0A1628',
        borderBottom: '2px solid #C8A951',
        padding: 'clamp(48px,8vw,80px) clamp(20px,6%,80px) clamp(32px,5vw,52px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative grid lines */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg,#C8A951 0,#C8A951 1px,transparent 1px,transparent 60px),repeating-linear-gradient(90deg,#C8A951 0,#C8A951 1px,transparent 1px,transparent 60px)',
        }}/>

        <div style={{ maxWidth: 800, position: 'relative' }}>
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(200,169,81,0.1)',
              border: '1px solid rgba(200,169,81,0.3)',
              borderRadius: 20,
              padding: '5px 14px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              color: '#C8A951',
              cursor: 'pointer',
              textTransform: 'uppercase',
              marginBottom: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back
          </button>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(200,169,81,0.12)',
            border: '1px solid rgba(200,169,81,0.3)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 10, fontWeight: 700, letterSpacing: '2px',
            color: '#C8A951', textTransform: 'uppercase',
            marginBottom: 16,
          }}>
            {badge}
          </div>

          <h1 style={{
            fontFamily: "'Lora','Georgia',serif",
            fontSize: 'clamp(28px,5vw,48px)',
            fontWeight: 700,
            color: '#fff',
            margin: '12px 0 16px',
            lineHeight: 1.1,
          }}>
            {title}
          </h1>

          <p style={{
            fontSize: 'clamp(13px,1.6vw,16px)',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: 560,
            lineHeight: 1.8,
            margin: 0,
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
    <div style={{ marginBottom: 40 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
      }}>
        <span style={{ width: 3, height: 22, background: '#C8A951', borderRadius: 2, flexShrink: 0 }}/>
        <h2 style={{
          fontFamily: "'Lora','Georgia',serif",
          fontSize: 'clamp(16px,2.2vw,20px)',
          fontWeight: 700,
          color: '#0A1628',
          margin: 0,
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
      color: '#4A4035',
      lineHeight: 1.9,
    }}>
      {children}
    </div>
  );
}

export function AccentCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(200,169,81,0.07)',
      border: '1px solid rgba(200,169,81,0.25)',
      borderRadius: 12,
      padding: '18px 22px',
      fontSize: 13,
      color: '#4A4035',
      lineHeight: 1.8,
    }}>
      {children}
    </div>
  );
}

export function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{
      borderBottom: '1px solid rgba(10,22,40,0.08)',
      padding: '18px 0',
    }}>
      <div style={{
        fontWeight: 700,
        fontSize: 14,
        color: '#0A1628',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ color: '#C8A951', flexShrink: 0 }}>Q.</span>
        {q}
      </div>
      <div style={{
        fontSize: 13,
        color: '#5C5048',
        lineHeight: 1.85,
        paddingLeft: 20,
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
      gap: 14,
    }}>
      {items.map(item => (
        <div key={item.label} style={{
          background: '#fff',
          border: '1px solid rgba(10,22,40,0.08)',
          borderRadius: 12,
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: '#C8A951', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 13, color: '#0A1628', fontWeight: 600 }}>{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}