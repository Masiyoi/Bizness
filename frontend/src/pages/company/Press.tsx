// src/pages/company/Press.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

export default function Press() {
  return (
    <PageShell
      badge="Company"
      title="Press & Media"
      subtitle="For press enquiries, brand partnerships, and media kit requests — we'd love to hear from you."
    >
      <Section title="About Luku Prime">
        <Prose>
          <p>Luku Prime is Kenya's premier online fashion destination, offering curated streetwear, designer pieces, shoes, bags, and more — delivered fast across the country. Launched in Nairobi, we've quickly become the go-to platform for fashion-forward Kenyans who demand quality, authenticity, and speed.</p>
        </Prose>
      </Section>

      <Section title="Key Facts">
        <InfoGrid items={[
          { icon: '📅', label: 'Founded', value: '2024, Nairobi Kenya' },
          { icon: '🛍️', label: 'Categories', value: '8+ fashion categories' },
          { icon: '🚚', label: 'Delivery', value: 'Nationwide Kenya' },
          { icon: '📱', label: 'Channels', value: 'Instagram, TikTok, YouTube' },
        ]} />
      </Section>

      <Section title="Press Contact">
        <div style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.09)', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#C8A951', textTransform: 'uppercase', marginBottom: 12 }}>Media Enquiries</div>
          <div style={{ fontSize: 14, color: '#0A1628', lineHeight: 2 }}>
            <div>✉️ <strong>masiyoiisaac@gmail.com</strong></div>
            <div>📞 <strong>+254 714 022 882</strong></div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#7A6A5A' }}>Please use the subject line <em>"Press Enquiry — [Topic]"</em> for a faster response.</div>
          </div>
        </div>
      </Section>

      <Section title="Brand Assets">
        <Prose>
          <p>Our media kit — including high-resolution logos, brand guidelines, and product imagery — is available on request. Email us with your publication or outlet name and we'll send it over promptly.</p>
        </Prose>
      </Section>

      <AccentCard>
        <strong>Partnership opportunities:</strong> We're open to collaborations with influencers, stylists, photographers, and media outlets that align with our brand values. Reach out and let's create something great together.
      </AccentCard>
    </PageShell>
  );
}