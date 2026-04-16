// src/pages/support/Contact.tsx
import { useState } from 'react';
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    // Wire up to your backend / EmailJS / etc.
    setSent(true);
  };

  const inputStyle = {
    width: '100%',
    background: '#fff',
    border: '1px solid rgba(10,22,40,0.15)',
    borderRadius: 8,
    padding: '12px 14px',
    fontFamily: "'Jost',sans-serif",
    fontSize: 13,
    color: '#0A1628',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: 14,
  };

  return (
    <PageShell
      badge="Support"
      title="Contact Us"
      subtitle="We're here to help. Reach out via any channel below and we'll get back to you quickly."
    >
      <Section title="Get in Touch">
        <InfoGrid items={[
          { icon: '📞', label: 'Phone / WhatsApp', value: '+254 714 022 882' },
          { icon: '✉️', label: 'Email', value: 'masiyoiisaac@gmail.com' },
          { icon: '📍', label: 'Visit Us', value: 'Nairobi CBD, Kenya' },
          { icon: '🕐', label: 'Working Hours', value: 'Mon–Sat, 9am–6pm' },
        ]} />
      </Section>

      <Section title="Send a Message">
        {sent ? (
          <div style={{
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 12, padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0A1628', marginBottom: 6 }}>Message Sent!</div>
            <div style={{ fontSize: 13, color: '#5C5048' }}>We'll get back to you within a few hours during business hours.</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#0A1628', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Name *</label>
                <input style={inputStyle} placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#0A1628', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email *</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#0A1628', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Subject</label>
            <input style={inputStyle} placeholder="Order issue, sizing question, etc." value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: '#0A1628', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Message *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical', marginBottom: 18 }}
              placeholder="How can we help you?"
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
            />
            <button
              onClick={handleSubmit}
              style={{
                background: '#0A1628', color: '#C8A951',
                border: '1.5px solid #C8A951', borderRadius: 8,
                padding: '12px 28px', fontFamily: "'Jost',sans-serif",
                fontSize: 12, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Send Message →
            </button>
          </div>
        )}
      </Section>

      <AccentCard>
        <strong>Fastest response:</strong> WhatsApp us directly at <strong>+254 714 022 882</strong> for urgent queries — we typically reply within minutes during business hours.
      </AccentCard>
    </PageShell>
  );
}