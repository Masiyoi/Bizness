// src/pages/company/About.tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

// ── Shared sub-components ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}
function Prose({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, color: '#444', lineHeight: 1.85, fontFamily: "'DM Sans',sans-serif" }}>{children}</div>;
}
function AccentCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f9f6f1', border: '1px solid rgba(200,169,81,0.25)', borderRadius: 10, padding: '18px 22px', fontSize: 13, color: '#555', lineHeight: 1.75, marginTop: 8 }}>
      {children}
    </div>
  );
}
function InfoGrid({ items }: { items: { icon: string; label: string; value: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
      {items.map(it => (
        <div key={it.label} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>{it.icon}</div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 4 }}>{it.label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}
function SizeTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#0A1628' }}>
            {headers.map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#C8A951', fontWeight: 700, fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(10,22,40,0.02)', borderBottom: '1px solid rgba(10,22,40,0.07)' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: '10px 14px', color: j === 0 ? '#0A1628' : '#5C5048', fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '14px 0' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, color: '#0A1628', gap: 12 }}>
        {q}
        <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', color: '#999', fontSize: 11, flexShrink: 0 }}>▼</span>
      </button>
      {open && <p style={{ marginTop: 10, fontSize: 13, color: '#666', lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif" }}>{a}</p>}
    </div>
  );
}

// ── Tab definitions ───────────────────────────────────────────────
const GROUPS = [
  {
    label: 'Company',
    tabs: [
      { id: 'about',   label: 'About Us'      },
      { id: 'careers', label: 'Careers'        },
      { id: 'press',   label: 'Press'          },
      { id: 'stores',  label: 'Store Locator'  },
    ],
  },
  {
    label: 'Support',
    tabs: [
      { id: 'faqs',       label: 'FAQs'              },
      { id: 'contact',    label: 'Contact Us'         },
      { id: 'delivery',   label: 'Delivery Info'      },
      { id: 'returns',    label: 'Returns & Exchanges'},
      { id: 'size-guide', label: 'Size Guide'         },
      { id: 'orders',     label: 'Track My Order'     },
    ],
  },
  {
    label: 'Legal',
    tabs: [
      { id: 'privacy', label: 'Privacy Policy'     },
      { id: 'terms',   label: 'Terms & Conditions' },
      { id: 'cookies', label: 'Cookie Policy'      },
    ],
  },
];

const ALL_TABS = GROUPS.flatMap(g => g.tabs);

// ── Tab content components ────────────────────────────────────────
function TabAbout() {
  return (
    <>
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
            { icon: '🚀', title: 'Speed',        desc: 'Same-day delivery within Nairobi CBD. Because fashion waits for no one.' },
            { icon: '🎯', title: 'Curation',     desc: "We don't carry everything — we carry the right things. Handpicked drops that actually hit." },
            { icon: '🤝', title: 'Community',    desc: "Luku Prime is for the culture. We're building more than a store — we're building a movement." },
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
          { icon: '👗', label: 'Products',   value: '500+ items curated'      },
          { icon: '😊', label: 'Customers',  value: '10,000+ happy shoppers'  },
          { icon: '📍', label: 'Coverage',   value: 'Nationwide in Kenya'     },
          { icon: '⭐', label: 'Rating',     value: '4.8 / 5 avg. review'    },
        ]} />
      </Section>
      <AccentCard>
        <strong>Based in Nairobi, built for Kenya.</strong> We understand local fashion, local needs, and local taste. That's what makes Luku Prime different — we're not a global retailer trying to fit into the Kenyan market. We are the Kenyan market.
      </AccentCard>
    </>
  );
}

function TabCareers() {
  const ROLES = [
    { title: 'Fashion Buyer / Sourcing Lead',    type: 'Full-time · Nairobi',             desc: 'Identify and source the freshest drops from local and international suppliers. You live and breathe fashion trends.' },
    { title: 'Delivery Rider',                   type: 'Part-time / Contract · Nairobi CBD', desc: 'Reliable rider with a motorbike for same-day deliveries within Nairobi. Good attitude and punctuality essential.' },
    { title: 'Social Media & Content Creator',   type: 'Part-time · Remote',              desc: 'Create scroll-stopping content for Instagram and TikTok. If your videos go viral, this job is for you.' },
    { title: 'Customer Support Agent',           type: 'Full-time · Nairobi',             desc: 'Handle customer queries via WhatsApp, email, and calls. Fast typist, patient, and fashion-savvy.' },
  ];
  return (
    <>
      <Section title="Why Work With Us">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {[
            { icon: '🔥', perk: 'Fast-growing startup energy'       },
            { icon: '👗', perk: 'Staff discounts on all products'   },
            { icon: '📈', perk: 'Room to grow quickly'              },
            { icon: '🎨', perk: 'Creative, fashion-forward culture' },
            { icon: '💻', perk: 'Flexible remote roles available'   },
            { icon: '🤝', perk: 'Tight-knit, supportive team'      },
          ].map(p => (
            <div key={p.perk} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <span style={{ fontSize: 13, color: '#0A1628', fontWeight: 600, lineHeight: 1.5 }}>{p.perk}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Open Positions">
        {ROLES.map(role => (
          <div key={role.title} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.09)', borderRadius: 12, padding: '20px 22px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0A1628', marginBottom: 4 }}>{role.title}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C8A951', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{role.type}</div>
              <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>{role.desc}</div>
            </div>
            <a href={`mailto:masiyoiisaac@gmail.com?subject=Application: ${role.title}`} style={{ background: '#0A1628', color: '#C8A951', border: '1.5px solid #C8A951', borderRadius: 8, padding: '10px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>Apply →</a>
          </div>
        ))}
      </Section>
      <AccentCard>
        <strong>Don't see your role?</strong> Send your CV to <strong>masiyoiisaac@gmail.com</strong> with the subject "Open Application."
      </AccentCard>
    </>
  );
}

function TabPress() {
  return (
    <>
      <Section title="About Luku Prime">
        <Prose><p>Luku Prime is Kenya's premier online fashion destination, offering curated streetwear, designer pieces, shoes, bags, and more — delivered fast across the country. Launched in Nairobi, we've quickly become the go-to platform for fashion-forward Kenyans who demand quality, authenticity, and speed.</p></Prose>
      </Section>
      <Section title="Key Facts">
        <InfoGrid items={[
          { icon: '📅', label: 'Founded',    value: '2024, Nairobi Kenya'     },
          { icon: '🛍️', label: 'Categories', value: '8+ fashion categories'   },
          { icon: '🚚', label: 'Delivery',   value: 'Nationwide Kenya'        },
          { icon: '📱', label: 'Channels',   value: 'Instagram, TikTok, YouTube' },
        ]} />
      </Section>
      <Section title="Press Contact">
        <div style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.09)', borderRadius: 12, padding: '20px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#C8A951', textTransform: 'uppercase', marginBottom: 12 }}>Media Enquiries</div>
          <div style={{ fontSize: 14, color: '#0A1628', lineHeight: 2 }}>
            <div>✉️ <strong>lukuprime254@gmail.com</strong></div>
            <div>📞 <strong>+254 707 099 935</strong></div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#7A6A5A' }}>Use subject line <em>"Press Enquiry — [Topic]"</em> for faster response.</div>
          </div>
        </div>
      </Section>
      <AccentCard><strong>Partnership opportunities:</strong> We're open to collaborations with influencers, stylists, photographers, and media outlets. Reach out and let's create something great together.</AccentCard>
    </>
  );
}

function TabStores() {
  return (
    <>
      <Section title="Our Location">
        <div style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.09)', borderRadius: 12, padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#C8A951', textTransform: 'uppercase', marginBottom: 12 }}>Luku Prime — Nairobi</div>
          <div style={{ fontSize: 14, color: '#0A1628', lineHeight: 2 }}>
            <div>📍 <strong>Nairobi CBD, Kenya</strong></div>
            <div>📞 <strong>+254 707 099 935</strong></div>
            <div>🕐 <strong>Mon–Sat, 9am–6pm EAT</strong></div>
          </div>
        </div>
        <a href="https://www.google.com/maps/search/Nairobi+CBD+Kenya" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#0A1628', color: '#C8A951', border: '1.5px solid #C8A951', borderRadius: 8, padding: '12px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', textDecoration: 'none' }}>
          View on Google Maps →
        </a>
      </Section>
      <AccentCard>Prefer to shop from home? Our entire catalogue is available online with same-day delivery across Nairobi. <strong>WhatsApp us</strong> to arrange a viewing at our Nairobi CBD location.</AccentCard>
    </>
  );
}

function TabFAQs() {
  return (
    <>
      <Section title="Ordering">
        <FAQItem q="How do I place an order?" a="Browse our categories, add items to your cart, and proceed to checkout. You can pay via M-Pesa, card, or cash on delivery for Nairobi orders." />
        <FAQItem q="Can I modify my order after placing it?" a="Contact us within 1 hour of placing the order via WhatsApp (+254 707 099 935) and we'll do our best to accommodate changes before dispatch." />
        <FAQItem q="Do you offer gift wrapping?" a="Yes! Add a note at checkout requesting gift wrapping and we'll package your order beautifully at no extra charge." />
      </Section>
      <Section title="Payments">
        <FAQItem q="What payment methods do you accept?" a="We accept M-Pesa (Paybill & Till), Visa/Mastercard, and cash on delivery for Nairobi CBD and suburbs." />
        <FAQItem q="Is my payment information secure?" a="Absolutely. All card payments are processed through encrypted, PCI-DSS compliant gateways. We never store your card details." />
        <FAQItem q="Can I pay in installments?" a="We currently don't offer installment plans, but keep an eye on our newsletter for upcoming promotions." />
      </Section>
      <Section title="Delivery">
        <FAQItem q="How long does delivery take?" a="Nairobi CBD orders can arrive same-day (before 12pm cutoff). Suburbs take 1–2 days, and upcountry orders take 3–7 business days." />
        <FAQItem q="Do you deliver outside Nairobi?" a="Yes, we deliver nationwide across Kenya via G4S and partner couriers. Delivery times and costs vary by location." />
      </Section>
      <Section title="Returns & Products">
        <FAQItem q="What is your return policy?" a="We offer 30-day returns on eligible items in original condition with tags attached." />
        <FAQItem q="Are your products authentic?" a="Yes. Every item on Luku Prime is carefully sourced and verified. We have a zero-tolerance policy for counterfeit goods." />
      </Section>
      <AccentCard>Still have a question? Reach us on WhatsApp at <strong>+254 707 099 935</strong> or email <strong>lukuprime254@gmail.com</strong>.</AccentCard>
    </>
  );
}

function TabContact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const inp: React.CSSProperties = { width: '100%', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '12px 14px', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#0a0a0a', outline: 'none', boxSizing: 'border-box', marginBottom: 14 };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: 6 };
  const card: React.CSSProperties = { background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, textDecoration: 'none' };
  return (
    <>
      <Section title="Get in Touch">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 8 }}>
          <a href="https://wa.me/254707099935" target="_blank" rel="noopener noreferrer" style={card}>
            <span style={{ fontSize: 20 }}>📞</span>
            <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Phone / WhatsApp</div><div style={{ fontSize: 13, color: '#0a0a0a', fontWeight: 600, marginBottom: 2 }}>+254 707 099 935</div><div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>Tap to open WhatsApp</div></div>
          </a>
          <a href="mailto:lukuprime254@gmail.com" style={card}>
            <span style={{ fontSize: 20 }}>✉️</span>
            <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Email</div><div style={{ fontSize: 13, color: '#0a0a0a', fontWeight: 600, marginBottom: 2 }}>lukuprime254@gmail.com</div><div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>Tap to send email</div></div>
          </a>
          <a href="https://www.google.com/maps/search/Nairobi+CBD+Kenya" target="_blank" rel="noopener noreferrer" style={card}>
            <span style={{ fontSize: 20 }}>📍</span>
            <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Visit Us</div><div style={{ fontSize: 13, color: '#0a0a0a', fontWeight: 600, marginBottom: 2 }}>Nairobi CBD, Kenya</div><div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>View on Maps</div></div>
          </a>
          <div style={card}>
            <span style={{ fontSize: 20 }}>🕐</span>
            <div><div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Working Hours</div><div style={{ fontSize: 13, color: '#0a0a0a', fontWeight: 600, marginBottom: 2 }}>Mon–Sat, 9am–6pm</div><div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)' }}>EAT (UTC+3)</div></div>
          </div>
        </div>
      </Section>
      <Section title="Send a Message">
        {sent ? (
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Message Sent!</div>
            <div style={{ fontSize: 13, color: '#666' }}>We'll get back to you within a few hours during business hours.</div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div><label style={lbl}>Name *</label><input style={inp} placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={lbl}>Email *</label><input style={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <label style={lbl}>Subject</label>
            <input style={inp} placeholder="Order issue, sizing question…" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <label style={lbl}>Message *</label>
            <textarea style={{ ...inp, minHeight: 120, resize: 'vertical', marginBottom: 18 }} placeholder="How can we help?" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            <button onClick={() => { if (form.name && form.email && form.message) setSent(true); }} style={{ background: '#000', color: '#fff', border: 'none', borderRadius: 6, padding: '13px 28px', fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer' }}>Send Message</button>
          </div>
        )}
      </Section>
      <AccentCard><strong>Fastest response:</strong> WhatsApp us at <a href="https://wa.me/254707099935" target="_blank" rel="noopener noreferrer" style={{ color: '#000', fontWeight: 700 }}>+254 707 099 935</a> — we typically reply within minutes during business hours.</AccentCard>
    </>
  );
}

function TabDelivery() {
  const ZONES = [
    { zone: 'Nairobi CBD',     time: 'Same day / Next day',   cost: 'From KSh 100' },
    { zone: 'Nairobi Suburbs', time: '1–2 business days',     cost: 'From KSh 150' },
    { zone: 'Mombasa',         time: '2–3 business days',     cost: 'From KSh 350' },
    { zone: 'Kisumu',          time: '2–3 business days',     cost: 'From KSh 350' },
    { zone: 'Other Towns',     time: '3–5 business days',     cost: 'From KSh 400' },
    { zone: 'Rest of Kenya',   time: '4–7 business days',     cost: 'Calculated at checkout' },
  ];
  return (
    <>
      <Section title="Delivery Zones & Estimates">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#0A1628' }}>{['Zone','Estimated Time','Cost'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#C8A951', fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
            <tbody>{ZONES.map((row, i) => <tr key={row.zone} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(10,22,40,0.02)', borderBottom: '1px solid rgba(10,22,40,0.07)' }}><td style={{ padding: '12px 16px', fontWeight: 600, color: '#0A1628' }}>{row.zone}</td><td style={{ padding: '12px 16px', color: '#5C5048' }}>{row.time}</td><td style={{ padding: '12px 16px', color: '#C8A951', fontWeight: 600 }}>{row.cost}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>
      <Section title="Quick Info">
        <InfoGrid items={[
          { icon: '📦', label: 'Processing Time',  value: 'Same day (orders before 12pm)' },
          { icon: '🚚', label: 'Fastest Delivery', value: 'Nairobi CBD — same day'         },
          { icon: '💳', label: 'Pay on Delivery',  value: 'Available for Nairobi orders'  },
          { icon: '📞', label: 'Delivery Support', value: '+254 707 099 935'               },
        ]} />
      </Section>
      <AccentCard><strong>Free delivery</strong> on orders above <strong>KSh 5,000</strong> within Nairobi. Sign up to our newsletter for free-shipping promo codes!</AccentCard>
    </>
  );
}

function TabReturns() {
  const ELIGIBLE     = ['Wrong size received','Wrong item received','Item is damaged or defective','Item differs significantly from photos'];
  const NOT_ELIGIBLE = ['Item worn, washed, or altered','Tags removed','Purchased on sale / clearance','Intimates & swimwear for hygiene reasons'];
  return (
    <>
      <Section title="Our 30-Day Return Policy">
        <Prose><p>You have <strong>30 days from delivery</strong> to request a return or exchange. Items must be unworn, unwashed, with all tags attached and in original packaging.</p></Prose>
      </Section>
      <Section title="What Can Be Returned">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#15803d', textTransform: 'uppercase', marginBottom: 12 }}>✓ Eligible</div>
            {ELIGIBLE.map(item => <div key={item} style={{ fontSize: 13, color: '#166534', marginBottom: 8, display: 'flex', gap: 8 }}><span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>{item}</div>)}
          </div>
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#b91c1c', textTransform: 'uppercase', marginBottom: 12 }}>✗ Not Eligible</div>
            {NOT_ELIGIBLE.map(item => <div key={item} style={{ fontSize: 13, color: '#991b1b', marginBottom: 8, display: 'flex', gap: 8 }}><span style={{ flexShrink: 0 }}>✗</span>{item}</div>)}
          </div>
        </div>
      </Section>
      <Section title="How to Return">
        {[
          { step: '01', title: 'Contact Us',       desc: 'WhatsApp or email us with your order number and reason for return.' },
          { step: '02', title: 'Get Approval',     desc: "We'll confirm eligibility and send return instructions within 24 hours." },
          { step: '03', title: 'Send the Item',    desc: 'Pack it securely and drop it off at our Nairobi CBD location or arrange pickup.' },
          { step: '04', title: 'Refund/Exchange',  desc: 'Approved refunds are processed within 3–5 business days to M-Pesa or original payment method.' },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', gap: 16, marginBottom: 18, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 40, height: 40, borderRadius: 8, background: '#0A1628', color: '#C8A951', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.step}</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 3 }}>{s.title}</div><div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>{s.desc}</div></div>
          </div>
        ))}
      </Section>
      <AccentCard><strong>Exchange faster:</strong> WhatsApp us at <strong>+254 707 099 935</strong> — we often process same-day exchanges for Nairobi CBD customers.</AccentCard>
    </>
  );
}

function TabSizeGuide() {
  const WOMEN_TOPS = [
    { size:'XS', bust:'76–80',   waist:'60–64', hips:'84–88'  },
    { size:'S',  bust:'81–85',   waist:'65–69', hips:'89–93'  },
    { size:'M',  bust:'86–90',   waist:'70–74', hips:'94–98'  },
    { size:'L',  bust:'91–97',   waist:'75–80', hips:'99–105' },
    { size:'XL', bust:'98–104',  waist:'81–87', hips:'106–112'},
    { size:'XXL',bust:'105–112', waist:'88–95', hips:'113–120'},
  ];
  const SHOE_SIZES = [
    { eu:'36',uk:'3',us:'5.5',cm:'22.5'},
    { eu:'37',uk:'4',us:'6.5',cm:'23.5'},
    { eu:'38',uk:'5',us:'7.5',cm:'24'  },
    { eu:'39',uk:'6',us:'8.5',cm:'25'  },
    { eu:'40',uk:'7',us:'9.5',cm:'25.5'},
    { eu:'41',uk:'8',us:'10.5',cm:'26.5'},
    { eu:'42',uk:'9',us:'11.5',cm:'27' },
  ];
  return (
    <>
      <Section title="Women's Clothing (cm)">
        <SizeTable headers={['Size','Bust','Waist','Hips']} rows={WOMEN_TOPS.map(r => [r.size,r.bust,r.waist,r.hips])} />
      </Section>
      <Section title="Shoe Sizes">
        <SizeTable headers={['EU','UK','US','Length (cm)']} rows={SHOE_SIZES.map(r => [r.eu,r.uk,r.us,r.cm])} />
      </Section>
      <AccentCard><strong>Between sizes?</strong> WhatsApp us at <strong>+254 714 022 882</strong> with the item name and your measurements — we'll advise personally.</AccentCard>
    </>
  );
}

function TabOrders() {
  const STEPS = [
    { icon:'📦', label:'Order Placed',     desc:'We receive your order and begin processing.'         },
    { icon:'🔍', label:'Quality Check',    desc:'Every item is inspected before dispatch.'            },
    { icon:'🚚', label:'Dispatched',       desc:'Your order is handed to our delivery partner.'       },
    { icon:'📍', label:'Out for Delivery', desc:'Your rider is on the way.'                           },
    { icon:'✅', label:'Delivered',         desc:'Enjoy your Luku Prime order!'                        },
  ];
  return (
    <>
      <Section title="How Order Tracking Works">
        <Prose><p>Once your order is placed, you'll receive an SMS and email confirmation with your order number. Use this to check your status at any time via our support line or WhatsApp.</p></Prose>
      </Section>
      <Section title="Your Order Journey">
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          <div style={{ position: 'absolute', left: 10, top: 12, bottom: 12, width: 2, background: 'rgba(200,169,81,0.2)', borderRadius: 2 }} />
          {STEPS.map(step => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0A1628', border: '2px solid #C8A951', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, position: 'relative', zIndex: 1 }}>{step.icon}</div>
              <div style={{ paddingTop: 6 }}><div style={{ fontWeight: 700, fontSize: 14, color: '#0A1628', marginBottom: 3 }}>{step.label}</div><div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>{step.desc}</div></div>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Contact to Track">
        <InfoGrid items={[
          { icon:'📞', label:'Call / WhatsApp', value:'+254 707 099 935'     },
          { icon:'✉️', label:'Email',           value:'lukuprime254@gmail.com'},
          { icon:'🕐', label:'Support Hours',   value:'Mon–Sat, 9am–6pm'    },
          { icon:'📍', label:'Location',        value:'Nairobi CBD, Kenya'   },
        ]} />
      </Section>
      <AccentCard><strong>Tip:</strong> Most Nairobi CBD orders are delivered same-day or next-day. You'll always receive an SMS when your rider is on the way.</AccentCard>
    </>
  );
}

function TabPrivacy() {
  return (
    <>
      <Section title="Information We Collect"><Prose><p>When you use Luku Prime, we collect information you provide directly — name, email, phone number, delivery address, and payment details. We also collect usage data such as pages visited, items viewed, and purchase history to improve your experience.</p></Prose></Section>
      <Section title="How We Use Your Information"><Prose><p>We use your data to process orders, arrange delivery, send order updates, and handle returns. With your consent, we may send you promotional emails or SMS. We never sell your personal data to third parties.</p></Prose></Section>
      <Section title="Data Sharing"><Prose><p>We share your information only with trusted partners — delivery companies, payment processors, and email/SMS services. All partners are contractually bound to protect your data.</p></Prose></Section>
      <Section title="Your Rights"><Prose><p>You have the right to access, correct, or delete your personal data. Opt out of marketing at any time by clicking "Unsubscribe" or replying STOP to any SMS. For data requests, email <strong>masiyoiisaac@gmail.com</strong>.</p></Prose></Section>
    </>
  );
}

function TabTerms() {
  const sections = [
    ['1. Acceptance of Terms', 'By accessing or using the Luku Prime website and services, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our platform.'],
    ['2. Use of the Platform', 'You may use Luku Prime for lawful personal shopping purposes only. We reserve the right to suspend accounts that violate these rules.'],
    ['3. Orders & Pricing', 'All prices are in Kenyan Shillings (KSh). We reserve the right to cancel any order in the event of pricing errors, with full refunds issued.'],
    ['4. Payments', 'Payment must be completed before dispatch. We accept M-Pesa, Visa/Mastercard, and cash on delivery (Nairobi only).'],
    ['5. Returns & Refunds', 'Returns are accepted within 30 days of delivery on eligible items. Refunds are processed within 3–5 business days of return approval.'],
    ['6. Intellectual Property', 'All content on this platform is the property of Luku Prime or our content partners. Do not reproduce without written permission.'],
  ];
  return (
    <>
      {sections.map(([title, body]) => <Section key={title} title={title}><Prose><p>{body}</p></Prose></Section>)}
      <AccentCard>Questions? Email <strong>lukuprime254@gmail.com</strong> or call <strong>+254 707 099 935</strong>.</AccentCard>
    </>
  );
}

function TabCookies() {
  const COOKIE_TYPES = [
    { name: 'Essential Cookies',  required: true,  desc: 'Required for the website to function — session cookies and cart cookies. Cannot be disabled.' },
    { name: 'Analytics Cookies',  required: false, desc: 'Help us understand how visitors interact with our site. Data is anonymised.' },
    { name: 'Marketing Cookies',  required: false, desc: 'Used to show you relevant adverts on other websites and measure campaign effectiveness.' },
  ];
  return (
    <>
      <Section title="What Are Cookies"><Prose><p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how the site is being used.</p></Prose></Section>
      <Section title="Cookies We Use">
        {COOKIE_TYPES.map(ct => (
          <div key={ct.name} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0A1628' }}>{ct.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 10, background: ct.required ? 'rgba(200,169,81,0.15)' : 'rgba(10,22,40,0.07)', color: ct.required ? '#C8A951' : '#7A6A5A' }}>{ct.required ? 'Required' : 'Optional'}</span>
            </div>
            <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.65 }}>{ct.desc}</div>
          </div>
        ))}
      </Section>
      <AccentCard>Questions about cookies? Email <strong>masiyoiisaac@gmail.com</strong>.</AccentCard>
    </>
  );
}

// ── Tab content map ───────────────────────────────────────────────
const TAB_CONTENT: Record<string, React.ReactNode> = {
  about:      <TabAbout />,
  careers:    <TabCareers />,
  press:      <TabPress />,
  stores:     <TabStores />,
  faqs:       <TabFAQs />,
  contact:    <TabContact />,
  delivery:   <TabDelivery />,
  returns:    <TabReturns />,
  'size-guide': <TabSizeGuide />,
  orders:     <TabOrders />,
  privacy:    <TabPrivacy />,
  terms:      <TabTerms />,
  cookies:    <TabCookies />,
};

const TAB_META: Record<string, { badge: string; title: string; subtitle: string }> = {
  about:      { badge: 'Company', title: 'About Luku Prime',         subtitle: "Kenya's premier fashion destination — built for those who know that style speaks before words do." },
  careers:    { badge: 'Company', title: 'Careers at Luku Prime',    subtitle: "Join a team that's redefining fashion in Kenya. We're growing fast and looking for passionate people." },
  press:      { badge: 'Company', title: 'Press & Media',            subtitle: 'For press enquiries, brand partnerships, and media kit requests.' },
  stores:     { badge: 'Company', title: 'Store Locator',            subtitle: 'Find us in Nairobi CBD — or shop the full catalogue online from anywhere in Kenya.' },
  faqs:       { badge: 'Support', title: 'Frequently Asked Questions', subtitle: 'Everything you need to know about ordering, delivery, returns, and more.' },
  contact:    { badge: 'Support', title: 'Contact Us',               subtitle: "We're here to help. Reach out via any channel below." },
  delivery:   { badge: 'Support', title: 'Delivery Info',            subtitle: 'Fast, reliable delivery across Kenya.' },
  returns:    { badge: 'Support', title: 'Returns & Exchanges',      subtitle: "We want you to love every piece. If something isn't right, we'll make it right." },
  'size-guide':{ badge: 'Support',title: 'Size Guide',               subtitle: 'Find your perfect fit. All measurements are in centimetres unless stated.' },
  orders:     { badge: 'Support', title: 'Track My Order',           subtitle: 'Stay up-to-date on every step of your delivery journey.' },
  privacy:    { badge: 'Legal',   title: 'Privacy Policy',           subtitle: 'We respect your privacy. Last updated: January 2025.' },
  terms:      { badge: 'Legal',   title: 'Terms & Conditions',       subtitle: 'By using Luku Prime, you agree to these terms. Last updated: January 2025.' },
  cookies:    { badge: 'Legal',   title: 'Cookie Policy',            subtitle: 'We use cookies to make your experience smooth and secure. Last updated: January 2025.' },
};

// ── Main page ─────────────────────────────────────────────────────
export default function About() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get('tab') ?? 'about';
  const activeTab = ALL_TABS.find(t => t.id === paramTab) ? paramTab : 'about';
  const [visible, setVisible] = useState(true);

  const setTab = (id: string) => {
    if (id === activeTab) return;
    setVisible(false);
    setTimeout(() => {
      setSearchParams({ tab: id });
      setVisible(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 160);
  };

  const meta = TAB_META[activeTab] ?? TAB_META['about'];

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0 }
        .ab-tab-group-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(0,0,0,0.35); padding: 0 4px 6px; }
        .ab-tab-btn { background: none; border: none; cursor: pointer; font-family: 'DM Sans',sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.5px; color: #888; padding: 8px 14px; border-radius: 6px; transition: all 0.15s; white-space: nowrap; }
        .ab-tab-btn:hover { color: #111; background: rgba(0,0,0,0.04); }
        .ab-tab-btn.active { color: #111; background: #fff; font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,0.10); }
        .ab-content { opacity: 0; transform: translateY(8px); transition: opacity 0.2s ease, transform 0.2s ease; }
        .ab-content.visible { opacity: 1; transform: translateY(0); }
        @media (max-width: 700px) {
          .ab-sidebar { display: none !important; }
          .ab-mobile-tabs { display: flex !important; }
          .ab-layout { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 701px) {
          .ab-mobile-tabs { display: none !important; }
        }
      `}</style>

      <Navbar cartCount={0} wishlistCount={0} onLogout={() => {}} />

      {/* ── Hero header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: 'clamp(32px,5vw,64px) clamp(20px,6%,80px) clamp(24px,4vw,48px)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#C8A951', marginBottom: 10 }}>{meta.badge}</div>
        <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 'clamp(28px,5vw,52px)', color: '#0A0A0A', lineHeight: 1.1, marginBottom: 12 }}>{meta.title}</h1>
        <p style={{ fontSize: 'clamp(13px,1.4vw,15px)', color: '#777', lineHeight: 1.75, maxWidth: 560 }}>{meta.subtitle}</p>
      </div>

      {/* ── Mobile horizontal tabs ── */}
      <div className="ab-mobile-tabs" style={{ overflowX: 'auto', borderBottom: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: '0 16px', scrollbarWidth: 'none', gap: 0 }}>
        {ALL_TABS.map(tab => (
          <button key={tab.id} className={`ab-tab-btn ${activeTab === tab.id ? 'active' : ''}`} style={{ borderRadius: 0, borderBottom: activeTab === tab.id ? '2px solid #111' : '2px solid transparent', padding: '14px 12px' }} onClick={() => setTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Desktop: sidebar + content ── */}
      <div className="ab-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', maxWidth: 1100, margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,5%,48px)', gap: 'clamp(24px,4vw,48px)', alignItems: 'start' }}>

        {/* Sidebar */}
        <div className="ab-sidebar" style={{ position: 'sticky', top: 80 }}>
          {GROUPS.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: gi < GROUPS.length - 1 ? 24 : 0 }}>
              <div className="ab-tab-group-label">{group.label}</div>
              {group.tabs.map(tab => (
                <button key={tab.id} className={`ab-tab-btn ${activeTab === tab.id ? 'active' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 2 }} onClick={() => setTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className={`ab-content ${visible ? 'visible' : ''}`}>
          {TAB_CONTENT[activeTab]}
        </div>

      </div>

      <Footer />
    </div>
  );
}
