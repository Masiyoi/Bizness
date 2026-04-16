// src/pages/support/Returns.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

const ELIGIBLE = ['Wrong size received', 'Wrong item received', 'Item is damaged or defective', 'Item differs significantly from photos'];
const NOT_ELIGIBLE = ['Item worn, washed, or altered', 'Tags removed', 'Purchased on sale / clearance', 'Intimates & swimwear for hygiene reasons'];

export default function Returns() {
  return (
    <PageShell
      badge="Support"
      title="Returns & Exchanges"
      subtitle="We want you to love every piece. If something isn't right, we'll make it right — within 30 days."
    >
      <Section title="Our 30-Day Return Policy">
        <Prose>
          <p>You have <strong>30 days from delivery</strong> to request a return or exchange. Items must be in original condition — unworn, unwashed, with all tags attached and in original packaging.</p>
        </Prose>
      </Section>

      <Section title="What Can Be Returned">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#15803d', textTransform: 'uppercase', marginBottom: 12 }}>✓ Eligible</div>
            {ELIGIBLE.map(item => (
              <div key={item} style={{ fontSize: 13, color: '#166534', marginBottom: 8, display: 'flex', gap: 8 }}>
                <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>{item}
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#b91c1c', textTransform: 'uppercase', marginBottom: 12 }}>✗ Not Eligible</div>
            {NOT_ELIGIBLE.map(item => (
              <div key={item} style={{ fontSize: 13, color: '#991b1b', marginBottom: 8, display: 'flex', gap: 8 }}>
                <span style={{ flexShrink: 0 }}>✗</span>{item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="How to Return">
        {[
          { step: '01', title: 'Contact Us', desc: 'WhatsApp or email us with your order number and reason for return.' },
          { step: '02', title: 'Get Approval', desc: 'We\'ll confirm eligibility and send return instructions within 24 hours.' },
          { step: '03', title: 'Send the Item', desc: 'Pack it securely and drop it off at our Nairobi CBD location or arrange pickup.' },
          { step: '04', title: 'Refund / Exchange', desc: 'Approved refunds are processed within 3–5 business days to your M-Pesa or original payment method.' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-start' }}>
            <div style={{
              minWidth: 40, height: 40, borderRadius: 8,
              background: '#0A1628', color: '#C8A951',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, letterSpacing: '1px', flexShrink: 0,
            }}>{s.step}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </Section>

      <AccentCard>
        <strong>Exchange faster:</strong> For size swaps, WhatsApp us directly at <strong>+254 714 022 882</strong> — we often process same-day exchanges for Nairobi CBD customers.
      </AccentCard>
    </PageShell>
  );
}