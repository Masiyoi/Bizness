// src/components/home/AppDownload.tsx

export default function AppDownload() {
  return (
    <section style={{ background: '#fff' }}>
      <style>{`
        .ad-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: clamp(32px,5vw,64px) clamp(20px,5%,80px) 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .ad-kicker {
          font-family: var(--f-sans, 'DM Sans', sans-serif);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 3.5px;
          text-transform: uppercase;
          color: #0A0A0A;
          margin-bottom: 8px;
        }
        .ad-title {
          font-family: var(--f-display, 'Cormorant Garamond', Georgia, serif);
          font-weight: 300;
          font-size: clamp(24px,4vw,44px);
          color: #0A0A0A;
          letter-spacing: -1px;
          line-height: 1.05;
          margin-bottom: 12px;
        }
        .ad-title em {
          font-style: italic;
          color: #0A0A0A;
        }
        .ad-desc {
          font-family: var(--f-sans, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 300;
          color: #333;
          line-height: 1.7;
          max-width: 420px;
          margin-bottom: 28px;
        }
        .ad-badges {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: none;
          padding: 0 clamp(60px,12%,180px) clamp(32px,5vw,64px);
          box-sizing: border-box;
        }
        .ad-badge {
          display: block;
          height: 52px;
          border-radius: 10px;
          overflow: hidden;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        .ad-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0,0,0,0.14);
        }
        .ad-badge img {
          height: 100%;
          width: auto;
          display: block;
          object-fit: cover;
        }
        .ad-badge-apple {
          height: 68px;
        }
        @media (max-width: 480px) {
          .ad-badge { height: 46px; }
          .ad-badge-apple { height: 58px; }
        }
      `}</style>

      <div className="ad-wrap">
        <p className="ad-kicker">Shop On The Go</p>
        <h2 className="ad-title">Get the <em>App</em></h2>
        <p className="ad-desc">
          Get plugged in anywhere, anytime. Download our app for exclusive drops, faster checkout, and order tracking on the move.
        </p>
      </div>
      <div className="ad-badges">
        <a href="#" target="_blank" rel="noopener noreferrer" className="ad-badge ad-badge-apple" aria-label="Download on the App Store">
          <img src="/applestore.jpg" alt="Download on the App Store" />
        </a>
        <a href="#" target="_blank" rel="noopener noreferrer" className="ad-badge" aria-label="Get it on Google Play">
          <img src="/googleplay.png" alt="Get it on Google Play" />
        </a>
      </div>
    </section>
  );
}