// src/pages/company/About.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

export default function About() {
  return (
    <PageShell
      badge="Company"
      title="About Luku Prime"
      subtitle="Kenya's premier fashion destination — built for those who know that style speaks before words do."
    >
      <Section title="Our Story">
        <Prose>
          <p>Luku Prime was born on the streets of Nairobi — a city where fashion is identity, where what you wear tells your story before you open your mouth. We started with a simple mission: bring authentic, curated streetwear and premium fashion to Kenya, without the premium price tag or the hassle.</p>
          <p style={{ marginTop: 14 }}>What began as a passion for finding the freshest drops has grown into a full platform connecting thousands of fashion-forward Kenyans with styles they love — from classic streetwear to luxury pieces, everyday fits to special occasion looks.</p>
        </Prose>
      </Section>

      <Section title="What We Stand For">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          {[
            { icon: '✅', title: 'Authenticity', desc: 'Every item is verified. Zero tolerance for counterfeits — your trust is non-negotiable.' },
            { icon: '🚀', title: 'Speed', desc: 'Same-day delivery within Nairobi CBD. Because fashion waits for no one.' },
            { icon: '🎯', title: 'Curation', desc: 'We don\'t carry everything — we carry the right things. Handpicked drops that actually hit.' },
            { icon: '🤝', title: 'Community', desc: 'Luku Prime is for the culture. We\'re building more than a store — we\'re building a movement.' },
          ].map(v => (
            <div key={v.title} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{v.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 6 }}>{v.title}</div>
              <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.65 }}>{v.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="By the Numbers">
        <InfoGrid items={[
          { icon: '👗', label: 'Products', value: '500+ items curated' },
          { icon: '😊', label: 'Customers', value: '10,000+ happy shoppers' },
          { icon: '📍', label: 'Coverage', value: 'Nationwide in Kenya' },
          { icon: '⭐', label: 'Rating', value: '4.8 / 5 avg. review' },
        ]} />
      </Section>

      <AccentCard>
        <strong>Based in Nairobi, built for Kenya.</strong> We understand local fashion, local needs, and local taste. That's what makes Luku Prime different — we're not a global retailer trying to fit into the Kenyan market. We are the Kenyan market.
      </AccentCard>
    </PageShell>
  );
}