import React from 'react';
const T = {
  navy:  '#000000',
  muted: '#666666',
};
// Photos live in /public/gallery — served from site root as /gallery/<file>
const GALLERY_IMAGES = [
  '/gallery/1.jpg',
  '/gallery/2.jpg',
  '/gallery/3.jpg',
  '/gallery/4.jpg',
];
export default function Gallery() {
  return (
    <div style={{ marginTop: 8, marginBottom: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{
          fontFamily: "'Playfair Display',serif", fontWeight: 800,
          fontSize: 'clamp(20px,3vw,28px)', color: T.navy,
          letterSpacing: '-0.3px', marginBottom: 6,
        }}>
          Styled By The Plug
        </h2>
        <p style={{
          fontFamily: "'Jost',sans-serif", fontSize: 12, color: T.muted,
          letterSpacing: '1px', textTransform: 'uppercase',
        }}>
          The look, in motion
        </p>
      </div>
      <div className="lp-gallery-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 4,
      }}>
        {GALLERY_IMAGES.map((src, i) => (
          <div key={i} style={{ aspectRatio: '3/4', overflow: 'hidden', background: '#f2f2f2' }}>
            <img
              src={src}
              alt={`Luku Prime styled look ${i + 1}`}
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transition: 'transform 0.5s ease',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
              onError={e => { (e.target as HTMLImageElement).closest('div')!.style.display = 'none'; }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @media (max-width: 768px) {
          .lp-gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}