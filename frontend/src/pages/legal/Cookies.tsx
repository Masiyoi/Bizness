// src/pages/legal/Cookies.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

const COOKIE_TYPES = [
  { name: 'Essential Cookies', required: true, desc: 'Required for the website to function. These include session cookies that keep you logged in and cart cookies that remember your items. Cannot be disabled.' },
  { name: 'Analytics Cookies', required: false, desc: 'Help us understand how visitors interact with our site — which pages are popular, how long people browse, and where they drop off. This data is anonymised.' },
  { name: 'Marketing Cookies', required: false, desc: 'Used to show you relevant adverts on other websites and measure the effectiveness of our marketing campaigns.' },
];

export default function Cookies() {
  return (
    <PageShell
      badge="Legal"
      title="Cookie Policy"
      subtitle="We use cookies to make your experience on Luku Prime smooth, personalised, and secure. Last updated: January 2025."
    >
      <Section title="What Are Cookies">
        <Prose>
          <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how the site is being used.</p>
        </Prose>
      </Section>

      <Section title="Cookies We Use">
        {COOKIE_TYPES.map(ct => (
          <div key={ct.name} style={{
            background: '#fff', border: '1px solid rgba(10,22,40,0.08)',
            borderRadius: 10, padding: '16px 18px', marginBottom: 12,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0A1628' }}>{ct.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 10,
                  background: ct.required ? 'rgba(200,169,81,0.15)' : 'rgba(10,22,40,0.07)',
                  color: ct.required ? '#C8A951' : '#7A6A5A',
                }}>
                  {ct.required ? 'Required' : 'Optional'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.65 }}>{ct.desc}</div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Managing Cookies">
        <Prose>
          <p>You can control and delete cookies through your browser settings. Most browsers allow you to block or delete cookies entirely, though this may affect how our site works. Essential cookies cannot be disabled as they are necessary for the site to function.</p>
          <p style={{ marginTop: 10 }}>For instructions on managing cookies in your browser, visit your browser's help section or <strong>aboutcookies.org</strong>.</p>
        </Prose>
      </Section>

      <Section title="Third-Party Cookies">
        <Prose>
          <p>Some of our partners — such as analytics providers and payment processors — may also set cookies when you use Luku Prime. These are governed by those third parties' own privacy and cookie policies.</p>
        </Prose>
      </Section>

      <AccentCard>
        Questions about our use of cookies? Email <strong>masiyoiisaac@gmail.com</strong>. We're happy to explain what we collect and why.
      </AccentCard>
    </PageShell>
  );
}