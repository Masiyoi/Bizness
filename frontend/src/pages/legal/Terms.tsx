// src/pages/legal/Terms.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

export default function Terms() {
  return (
    <PageShell
      badge="Legal"
      title="Terms & Conditions"
      subtitle="By using Luku Prime, you agree to these terms. Please read them carefully. Last updated: January 2025."
    >
      <Section title="1. Acceptance of Terms">
        <Prose>
          <p>By accessing or using the Luku Prime website and services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.</p>
        </Prose>
      </Section>

      <Section title="2. Use of the Platform">
        <Prose>
          <p>You may use Luku Prime for lawful personal shopping purposes only. You must not misuse the platform, attempt to defraud us or other users, submit false orders, or engage in any activity that disrupts our services. We reserve the right to suspend accounts that violate these rules.</p>
        </Prose>
      </Section>

      <Section title="3. Orders & Pricing">
        <Prose>
          <p>All prices are listed in Kenyan Shillings (KSh) and include applicable taxes unless stated otherwise. We reserve the right to cancel any order in the event of pricing errors. You will be notified and fully refunded in such cases.</p>
          <p style={{ marginTop: 10 }}>An order confirmation email/SMS constitutes acceptance of your order. We reserve the right to cancel orders due to stock unavailability, in which case a full refund will be issued.</p>
        </Prose>
      </Section>

      <Section title="4. Payments">
        <Prose>
          <p>Payment must be completed before dispatch for online orders. We accept M-Pesa, Visa/Mastercard, and cash on delivery (Nairobi only). Failed or reversed payments will result in order cancellation.</p>
        </Prose>
      </Section>

      <Section title="5. Delivery">
        <Prose>
          <p>Delivery timelines are estimates and not guarantees. While we work hard to meet them, delays may occur due to traffic, weather, or courier issues. We are not liable for delays outside our reasonable control.</p>
        </Prose>
      </Section>

      <Section title="6. Returns & Refunds">
        <Prose>
          <p>Returns are accepted within 30 days of delivery on eligible items. Please see our Returns & Exchanges page for full details. Refunds are processed within 3–5 business days of return approval.</p>
        </Prose>
      </Section>

      <Section title="7. Intellectual Property">
        <Prose>
          <p>All content on this platform — including images, logos, text, and design — is the property of Luku Prime or our content partners. You may not reproduce, distribute, or use any content without written permission.</p>
        </Prose>
      </Section>

      <Section title="8. Limitation of Liability">
        <Prose>
          <p>Luku Prime's liability is limited to the value of the goods purchased. We are not liable for indirect or consequential losses arising from the use of our platform or products.</p>
        </Prose>
      </Section>

      <Section title="9. Changes to Terms">
        <Prose>
          <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance. We will notify registered users of significant changes via email.</p>
        </Prose>
      </Section>

      <Section title="10. Contact">
        <Prose>
          <p>Questions about these terms? Email <strong>lukuprime254@gmail.com</strong> or call <strong>+254 707 099 935</strong>.</p>
        </Prose>
      </Section>
    </PageShell>
  );
}