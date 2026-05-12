// src/pages/support/FAQs.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';
import { useState } from 'react';

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left font-medium flex justify-between items-center hover:text-blue-600"
      >
        {q}
        <span className={`transform transition ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <p className="mt-2 text-gray-700">{a}</p>}
    </div>
  );
}

export default function FAQs() {
  return (
    <PageShell
      badge="Support"
      title="Frequently Asked Questions"
      subtitle="Everything you need to know about ordering, delivery, returns, and more."
    >
      <Section title="Ordering">
        <FAQItem q="How do I place an order?" a="Browse our categories, add items to your cart, and proceed to checkout. You can pay via M-Pesa, card, or cash on delivery for Nairobi orders." />
        <FAQItem q="Can I modify my order after placing it?" a="Contact us within 1 hour of placing the order via WhatsApp (+254 707 099 935) and we'll do our best to accommodate changes before dispatch." />
        <FAQItem q="Do you offer gift wrapping?" a="Yes! Add a note at checkout requesting gift wrapping and we'll package your order beautifully at no extra charge." />
      </Section>

      <Section title="Payments">
        <FAQItem q="What payment methods do you accept?" a="We accept M-Pesa (Paybill & Till), Visa/Mastercard, and cash on delivery for Nairobi CBD and suburbs." />
        <FAQItem q="Is my payment information secure?" a="Absolutely. All card payments are processed through encrypted, PCI-DSS compliant gateways. We never store your card details." />
        <FAQItem q="Can I pay in installments?" a="We currently don't offer installment plans, but keep an eye on our newsletter for upcoming promotions and flexible payment options." />
      </Section>

      <Section title="Delivery">
        <FAQItem q="How long does delivery take?" a="Nairobi CBD orders can arrive same-day (before 12pm cutoff). Suburbs take 1–2 days, and upcountry orders take 3–7 business days depending on the destination." />
        <FAQItem q="How will I know when my order is on the way?" a="You'll receive an SMS confirmation at each stage: order placed, dispatched, and when your rider is nearby." />
        <FAQItem q="Do you deliver outside Nairobi?" a="Yes, we deliver nationwide across Kenya via G4S and partner couriers. Delivery times and costs vary by location." />
      </Section>

      <Section title="Returns & Exchanges">
        <FAQItem q="What is your return policy?" a="We offer 30-day returns on eligible items in original condition with tags attached. See our Returns & Exchanges page for full details." />
        <FAQItem q="How long do refunds take?" a="Approved refunds are processed within 3–5 business days back to your original payment method or M-Pesa." />
        <FAQItem q="What if I received the wrong item?" a="We're so sorry! Contact us immediately via WhatsApp with a photo and your order number. We'll arrange a priority exchange at no cost to you." />
      </Section>

      <Section title="Products">
        <FAQItem q="Are your products authentic?" a="Yes. Every item on Luku Prime is carefully sourced and verified. We have a zero-tolerance policy for counterfeit goods." />
        <FAQItem q="How do I know if an item will fit me?" a="Check our Size Guide page for detailed measurements, or WhatsApp us with your measurements and we'll recommend the right size." />
        <FAQItem q="Do you restock sold-out items?" a="Some items restock, others don't — especially limited drops. Subscribe to our newsletter to be first to know about restocks." />
      </Section>

      <AccentCard>
        Still have a question? Reach us directly on WhatsApp at <strong>+254 707 099 935</strong> or email <strong>lukuprime254@gmail.com</strong> — we typically respond within a few hours during business hours.
      </AccentCard>
    </PageShell>
  );
}