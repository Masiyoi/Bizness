// src/pages/support/Delivery.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

const ZONES = [
  { zone: 'Nairobi CBD', time: 'Same day / Next day', cost: 'From KSh 100' },
  { zone: 'Nairobi Suburbs', time: '1–2 business days', cost: 'From KSh 150' },
  { zone: 'Mombasa', time: '2–3 business days', cost: 'From KSh 350' },
  { zone: 'Kisumu', time: '2–3 business days', cost: 'From KSh 350' },
  { zone: 'Other Towns', time: '3–5 business days', cost: 'From KSh 400' },
  { zone: 'Rest of Kenya', time: '4–7 business days', cost: 'Calculated at checkout' },
];

export default function Delivery() {
  return (
    <PageShell
      badge="Support"
      title="Delivery Info"
      subtitle="Fast, reliable delivery across Kenya. We partner with trusted couriers to get your order to you safely."
    >
      <Section title="Delivery Zones & Estimates">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#0A1628' }}>
                {['Zone', 'Estimated Time', 'Cost'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#C8A951', fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONES.map((row, i) => (
                <tr key={row.zone} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(10,22,40,0.02)', borderBottom: '1px solid rgba(10,22,40,0.07)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0A1628' }}>{row.zone}</td>
                  <td style={{ padding: '12px 16px', color: '#5C5048' }}>{row.time}</td>
                  <td style={{ padding: '12px 16px', color: '#C8A951', fontWeight: 600 }}>{row.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="How We Deliver">
        <Prose>
          <p>All orders are dispatched from our Nairobi CBD warehouse. Once dispatched, you'll receive an SMS with your rider's contact details. Our delivery partners operate Monday–Saturday, 8am–7pm.</p>
          <p style={{ marginTop: 12 }}>For bulk orders or corporate deliveries, please contact us directly to arrange a custom delivery schedule.</p>
        </Prose>
      </Section>

      <Section title="Quick Info">
        <InfoGrid items={[
          { icon: '📦', label: 'Processing Time', value: 'Same day (orders before 12pm)' },
          { icon: '🚚', label: 'Fastest Delivery', value: 'Nairobi CBD — same day' },
          { icon: '💳', label: 'Pay on Delivery', value: 'Available for Nairobi orders' },
          { icon: '📞', label: 'Delivery Support', value: '+254 714 022 882' },
        ]} />
      </Section>

      <AccentCard>
        <strong>Free delivery</strong> on orders above <strong>KSh 5,000</strong> within Nairobi. Promo codes for free shipping are occasionally offered to newsletter subscribers — sign up in the footer!
      </AccentCard>
    </PageShell>
  );
}