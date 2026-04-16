// src/pages/legal/Privacy.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

export default function Privacy() {
  return (
    <PageShell
      badge="Legal"
      title="Privacy Policy"
      subtitle="We respect your privacy and are committed to protecting your personal data. Last updated: January 2025."
    >
      <Section title="Information We Collect">
        <Prose>
          <p>When you use Luku Prime, we collect information you provide directly — such as your name, email address, phone number, delivery address, and payment details. We also collect usage data such as pages visited, items viewed, and purchase history to improve your experience.</p>
        </Prose>
      </Section>

      <Section title="How We Use Your Information">
        <Prose>
          <p>We use your data to process orders, arrange delivery, send order updates, and handle returns. With your consent, we may send you promotional emails or SMS messages about new arrivals and offers. We never sell your personal data to third parties.</p>
        </Prose>
      </Section>

      <Section title="Data Sharing">
        <Prose>
          <p>We share your information only with trusted partners who help us operate — including delivery companies (for your address and contact details), payment processors (for transaction processing), and email/SMS services. All partners are contractually bound to protect your data.</p>
        </Prose>
      </Section>

      <Section title="Data Retention">
        <Prose>
          <p>We keep your account data for as long as your account is active. Order records are retained for 7 years for tax and legal compliance. You may request deletion of your account and associated data at any time by contacting us.</p>
        </Prose>
      </Section>

      <Section title="Your Rights">
        <Prose>
          <p>You have the right to access, correct, or delete your personal data. You can opt out of marketing communications at any time by clicking "Unsubscribe" in any email or replying STOP to any SMS. For data requests, email us at <strong>masiyoiisaac@gmail.com</strong>.</p>
        </Prose>
      </Section>

      <Section title="Cookies">
        <Prose>
          <p>We use cookies to keep you logged in, remember your cart, and analyse site performance. You can manage cookie preferences in your browser settings. See our Cookie Policy for full details.</p>
        </Prose>
      </Section>

      <Section title="Contact">
        <Prose>
          <p>For any privacy-related questions or requests, contact us at <strong>masiyoiisaac@gmail.com</strong> or call <strong>+254 714 022 882</strong> during business hours (Mon–Sat, 9am–6pm).</p>
        </Prose>
      </Section>
    </PageShell>
  );
}