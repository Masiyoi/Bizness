// src/pages/profile/Affiliate.tsx
import { useOutletContext } from 'react-router-dom';
import type { User } from '../../constants/theme';

interface OutletCtx { user: User; setUser: (u: User) => void; }

const STEPS = [
  { step: '01', title: 'Share your Code', desc: 'Share your coupon code with friends, followers, or your audience.' },
  { step: '02', title: 'They shop',       desc: 'Anyone who buys through your coupon code instantly counts towards your earnings.' },
  { step: '03', title: 'You get paid',    desc: 'Commission is credited to your account and paid out instantly via M-Pesa.' },
];

export default function Affiliate() {
  const { user } = useOutletContext<OutletCtx>();

  const applyMailto = `mailto:lukuprime254@gmail.com?subject=${encodeURIComponent('Application for Salesperson')}&body=${encodeURIComponent('Hi Luku Prime team,\n\nI\'d like to apply to become a salesperson and get a coupon code.\n\nName:\nInstagram/TikTok/Audience:\nPhone number:\n')}`;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* ── Hero card ── */}
      <div style={{
        background: '#000',
        borderRadius: 16,
        padding: 'clamp(28px,4vw,44px)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 32,
        minHeight: 320,
      }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="https://res.cloudinary.com/dfiy43f01/video/upload/v1787948711/document_5805545609406456259_dzmwrh.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px)',
          backgroundSize: '26px 26px',
        }}/>
        <div style={{ position: 'absolute', zIndex: 1, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,169,81,0.14) 0%,transparent 70%)', top: -80, right: -60, pointerEvents: 'none' }}/>
        <div style={{
          position: 'absolute', zIndex: 1, inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)',
          pointerEvents: 'none',
        }}/>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 560 }}>
          <div style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '2px', color: '#E8CD7A', textTransform: 'uppercase', marginBottom: 16,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}>
            Salesperson
          </div>

          <h1 style={{ fontSize: 'clamp(24px,3.5vw,34px)', fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-0.5px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Earn <em style={{ color: '#E8CD7A', fontStyle: 'normal' }}>10% commission</em> from every sale
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, margin: '0 0 24px', fontWeight: 300, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
            Share your coupon code. When customers shop through your code, you earn 10% commission.
          </p>

          <a
            href={applyMailto}
            style={{
              display: 'inline-flex', flexDirection: 'column', gap: 2,
              background: 'transparent',
              border: '1.5px solid rgba(232,205,122,0.6)',
              borderRadius: 8,
              padding: '10px 20px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
            }}>
              Want to sell for us?
            </span>
            <span style={{
              fontSize: 12.5, fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', color: '#E8CD7A',
            }}>
              Apply to Become a Salesperson
            </span>
          </a>
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <span style={{ width: 2, height: 20, background: '#000', borderRadius: 2, flexShrink: 0 }}/>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0a0a0a', margin: 0, letterSpacing: '-0.2px' }}>How It Works</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
          {STEPS.map(s => (
            <div key={s.step}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#B8860B', marginBottom: 8, letterSpacing: '-1px' }}>{s.step}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Payout info ── */}
      <div style={{
        background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 10,
        padding: '18px 22px', fontSize: 13, color: '#444', lineHeight: 1.85,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <strong>Payouts</strong> are processed instantly via M-Pesa once your pending balance reaches KSh 500. Questions about your earnings? Reach us at{' '}
        <a href="mailto:lukuprime254@gmail.com" style={{ color: '#B8860B', fontWeight: 700, textDecoration: 'none' }}>lukuprime254@gmail.com</a>
        {' '}or via call{' '}
        <a href="tel:0723831949" style={{ color: '#B8860B', fontWeight: 700, textDecoration: 'none' }}>0723831949</a>.
      </div>
    </div>
  );
}