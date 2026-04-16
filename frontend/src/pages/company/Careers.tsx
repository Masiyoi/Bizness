// src/pages/company/Careers.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

const ROLES = [
  { title: 'Fashion Buyer / Sourcing Lead', type: 'Full-time · Nairobi', desc: 'Identify and source the freshest drops from local and international suppliers. You live and breathe fashion trends.' },
  { title: 'Delivery Rider', type: 'Part-time / Contract · Nairobi CBD', desc: 'Reliable rider with a motorbike for same-day deliveries within Nairobi. Good attitude and punctuality essential.' },
  { title: 'Social Media & Content Creator', type: 'Part-time · Remote', desc: 'Create scroll-stopping content for Instagram and TikTok. If your videos go viral, this job is for you.' },
  { title: 'Customer Support Agent', type: 'Full-time · Nairobi', desc: 'Handle customer queries via WhatsApp, email, and calls. Fast typist, patient, and fashion-savvy.' },
];

export default function Careers() {
  return (
    <PageShell
      badge="Company"
      title="Careers at Luku Prime"
      subtitle="Join a team that's redefining fashion in Kenya. We're growing fast and looking for passionate people."
    >
      <Section title="Why Work With Us">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {[
            { icon: '🔥', perk: 'Fast-growing startup energy' },
            { icon: '👗', perk: 'Staff discounts on all products' },
            { icon: '📈', perk: 'Room to grow quickly' },
            { icon: '🎨', perk: 'Creative, fashion-forward culture' },
            { icon: '💻', perk: 'Flexible remote roles available' },
            { icon: '🤝', perk: 'Tight-knit, supportive team' },
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
          <div key={role.title} style={{
            background: '#fff', border: '1px solid rgba(10,22,40,0.09)',
            borderRadius: 12, padding: '20px 22px', marginBottom: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0A1628', marginBottom: 4 }}>{role.title}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C8A951', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>{role.type}</div>
              <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.6 }}>{role.desc}</div>
            </div>
            <a
              href={`mailto:masiyoiisaac@gmail.com?subject=Application: ${role.title}`}
              style={{
                background: '#0A1628', color: '#C8A951',
                border: '1.5px solid #C8A951', borderRadius: 8,
                padding: '10px 20px', fontSize: 11, fontWeight: 700,
                letterSpacing: '1.2px', textTransform: 'uppercase',
                textDecoration: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start',
              }}
            >
              Apply →
            </a>
          </div>
        ))}
      </Section>

      <AccentCard>
        <strong>Don't see your role?</strong> We're always interested in talented people. Send your CV and a short note about what you'd bring to Luku Prime to <strong>masiyoiisaac@gmail.com</strong> with the subject line "Open Application."
      </AccentCard>
    </PageShell>
  );
}