// src/pages/Orders.tsx  (replace existing or keep buyer-route version separate)
// This is the public-facing "Track My Order" support page
// If you already have a buyer Orders page, name this TrackOrder.tsx
// and update Footer SUPPORT_LINKS path to '/track-order'

import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

const STEPS = [
  { icon: '📦', label: 'Order Placed',    desc: 'We receive your order and begin processing.' },
  { icon: '🔍', label: 'Quality Check',   desc: 'Every item is inspected before dispatch.' },
  { icon: '🚚', label: 'Dispatched',      desc: 'Your order is handed to our delivery partner.' },
  { icon: '📍', label: 'Out for Delivery',desc: 'Your rider is on the way.' },
  { icon: '✅', label: 'Delivered',        desc: 'Enjoy your Luku Prime order!' },
];

export default function TrackOrder() {
  return (
    <PageShell
      badge="Support"
      title="Track My Order"
      subtitle="Stay up-to-date on every step of your delivery journey, from warehouse to your door."
    >
      <Section title="How Order Tracking Works">
        <Prose>
          <p>Once your order is placed, you'll receive an SMS and email confirmation with your order number. Use this number to check your status at any time through our support line or WhatsApp.</p>
        </Prose>
      </Section>

      {/* Progress steps */}
      <Section title="Your Order Journey">
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 10, top: 12, bottom: 12, width: 2, background: 'rgba(200,169,81,0.2)', borderRadius: 2 }}/>
          {STEPS.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, position: 'relative' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#0A1628', border: '2px solid #C8A951',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0, position: 'relative', zIndex: 1,
              }}>
                {step.icon}
              </div>
              <div style={{ paddingTop: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 3 }}>{step.label}</div>
                <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Contact to Track">
        <InfoGrid items={[
          { icon: '📞', label: 'Call / WhatsApp', value: '+254 707 099 935' },
          { icon: '✉️', label: 'Email', value: 'lukuprime254@gmail.com' },
          { icon: '🕐', label: 'Support Hours', value: 'Mon–Sat, 9am–6pm' },
          { icon: '📍', label: 'Location', value: 'Nairobi CBD, Kenya' },
        ]} />
      </Section>

      <AccentCard>
        <strong>Tip:</strong> Most Nairobi CBD orders are delivered same-day or next-day. Outside Nairobi typically takes 2–4 business days. You'll always receive an SMS when your rider is on the way.
      </AccentCard>
    </PageShell>
  );
}