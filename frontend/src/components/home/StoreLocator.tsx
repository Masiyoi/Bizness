// src/components/home/StoreLocator.tsx
import coverageIcon   from '../../assets/about/coverae.png';
import telephoneIcon  from '../../assets/about/telephone.png';
import timeIcon       from '../../assets/about/time.png';

export default function StoreLocator() {
  return (
    <section style={{ background: '#fff', borderTop: '1px solid var(--rule, rgba(0,0,0,0.10))' }}>
      <style>{`
        .sl-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: clamp(32px,5vw,72px) clamp(20px,5%,80px);
        }
        .sl-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(200px,1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        .sl-info-card {
          background: #fff;
          border-radius: 10px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sl-info-icon {
          width: 26px;
          height: 26px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .sl-info-label {
          font-family: var(--f-sans, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 3px;
        }
        .sl-info-value {
          font-family: var(--f-sans, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 700;
          color: #0A0A0A;
          text-decoration: none;
        }
        .sl-map {
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .sl-maps-link {
          display: inline-block;
          font-family: var(--f-sans, 'DM Sans', sans-serif);
          font-size: 12px;
          font-weight: 700;
          color: #0A0A0A;
          text-decoration: underline;
          margin-bottom: 24px;
        }
        .sl-accent {
          background: #fff;
          border-radius: 10px;
          padding: 18px 22px;
          font-family: var(--f-sans, 'DM Sans', sans-serif);
          font-size: 13px;
          color: #555;
          line-height: 1.75;
        }
      `}</style>

      <div className="sl-wrap">
        <div style={{ marginBottom: 'clamp(20px,3vw,32px)' }}>
          <p className="lp-section-kicker">Find Us</p>
          <h2 className="lp-section-title">Store <em>Locator</em></h2>
        </div>

        <div className="sl-info-grid">
          <div className="sl-info-card">
            <img src={coverageIcon} alt="" className="sl-info-icon" />
            <div>
              <div className="sl-info-label">Location</div>
              <div className="sl-info-value">Nairobi CBD, Kenya</div>
            </div>
          </div>
          <div className="sl-info-card">
            <img src={telephoneIcon} alt="" className="sl-info-icon" />
            <div>
              <div className="sl-info-label">Phone</div>
              <a href="tel:+254707099935" className="sl-info-value">+254 707 099 935</a>
            </div>
          </div>
          <div className="sl-info-card">
            <img src={timeIcon} alt="" className="sl-info-icon" />
            <div>
              <div className="sl-info-label">Hours</div>
              <div className="sl-info-value">Mon–Sat, 9am–6pm EAT</div>
            </div>
          </div>
        </div>

        <div className="sl-map">
          <iframe
            title="Imenti House, Nairobi CBD"
            src="https://www.google.com/maps?q=Imenti+House,+Nairobi+CBD,+Kenya&output=embed"
            width="100%"
            height="360"
            style={{ border: 0, display: 'block' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <a
          href="https://www.google.com/maps/search/?api=1&query=Imenti+House+Nairobi+CBD+Kenya"
          target="_blank"
          rel="noopener noreferrer"
          className="sl-maps-link"
        >
          Open in Google Maps →
        </a>

        <div className="sl-accent">
          Prefer to shop from home? Our entire catalogue is available online with same-day delivery across Nairobi.{' '}
          <strong style={{ color: '#0A0A0A' }}>WhatsApp us</strong> to arrange a viewing at our Nairobi CBD location.
        </div>
      </div>
    </section>
  );
}