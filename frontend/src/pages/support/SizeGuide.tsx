// src/pages/support/SizeGuide.tsx
import PageShell, { Section, Prose, AccentCard, InfoGrid } from '../../components/common/PageShell';

const WOMEN_TOPS = [
  { size: 'XS', bust: '76–80', waist: '60–64', hips: '84–88' },
  { size: 'S',  bust: '81–85', waist: '65–69', hips: '89–93' },
  { size: 'M',  bust: '86–90', waist: '70–74', hips: '94–98' },
  { size: 'L',  bust: '91–97', waist: '75–80', hips: '99–105' },
  { size: 'XL', bust: '98–104', waist: '81–87', hips: '106–112' },
  { size: 'XXL', bust: '105–112', waist: '88–95', hips: '113–120' },
];

const SHOE_SIZES = [
  { eu: '36', uk: '3', us: '5.5', cm: '22.5' },
  { eu: '37', uk: '4', us: '6.5', cm: '23.5' },
  { eu: '38', uk: '5', us: '7.5', cm: '24' },
  { eu: '39', uk: '6', us: '8.5', cm: '25' },
  { eu: '40', uk: '7', us: '9.5', cm: '25.5' },
  { eu: '41', uk: '8', us: '10.5', cm: '26.5' },
  { eu: '42', uk: '9', us: '11.5', cm: '27' },
];

function SizeTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#0A1628' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#C8A951', fontWeight: 700, fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : 'rgba(10,22,40,0.02)', borderBottom: '1px solid rgba(10,22,40,0.07)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', color: j === 0 ? '#0A1628' : '#5C5048', fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SizeGuide() {
  return (
    <PageShell
      badge="Support"
      title="Size Guide"
      subtitle="Find your perfect fit. All measurements are in centimetres unless stated."
    >
      <Section title="How to Measure">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 8 }}>
          {[
            { icon: '📏', label: 'Bust', desc: 'Measure around the fullest part of your chest, keeping the tape parallel to the ground.' },
            { icon: '📏', label: 'Waist', desc: 'Measure around the narrowest part of your natural waist, usually just above the belly button.' },
            { icon: '📏', label: 'Hips', desc: 'Measure around the fullest part of your hips, about 20cm below your natural waist.' },
          ].map(m => (
            <div key={m.label} style={{ background: '#fff', border: '1px solid rgba(10,22,40,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0A1628', marginBottom: 6 }}>{m.icon} {m.label}</div>
              <div style={{ fontSize: 12, color: '#7A6A5A', lineHeight: 1.65 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Women's Clothing (cm)">
        <SizeTable
          headers={['Size', 'Bust', 'Waist', 'Hips']}
          rows={WOMEN_TOPS.map(r => [r.size, r.bust, r.waist, r.hips])}
        />
      </Section>

      <Section title="Shoe Sizes">
        <SizeTable
          headers={['EU', 'UK', 'US', 'Length (cm)']}
          rows={SHOE_SIZES.map(r => [r.eu, r.uk, r.us, r.cm])}
        />
      </Section>

      <AccentCard>
        <strong>Between sizes?</strong> We recommend sizing up for a relaxed fit or sizing down for a more tailored look. Still unsure? WhatsApp us at <strong>+254 714 022 882</strong> with the item name and your measurements — we'll advise personally.
      </AccentCard>
    </PageShell>
  );
}