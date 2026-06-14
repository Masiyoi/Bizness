#!/usr/bin/env python3
import sys

path = sys.argv[1] if len(sys.argv) > 1 else "src/pages/Homepage.tsx"

with open(path, "r") as f:
    src = f.read()

# ── Patch H: Add flash sales CSS to css string ───────────────────────────────
OLD_H = """  /* ── Sort select ── */
  .lp-sort {
    font-family: var(--f-sans); font-size: 11px; font-weight: 500;
    background: none; border: 1px solid var(--rule);
    padding: 8px 12px; color: var(--ink); cursor: pointer;
    outline: none; appearance: none; -webkit-appearance: none;
  }
  .lp-sort:hover { border-color: var(--ink) }
`;"""

NEW_H = """  /* ── Sort select ── */
  .lp-sort {
    font-family: var(--f-sans); font-size: 11px; font-weight: 500;
    background: none; border: 1px solid var(--rule);
    padding: 8px 12px; color: var(--ink); cursor: pointer;
    outline: none; appearance: none; -webkit-appearance: none;
  }
  .lp-sort:hover { border-color: var(--ink) }

  /* ── Flash Sales strip ── */
  .lp-flash-section {
    border-bottom: 1px solid var(--rule);
    padding: clamp(24px,4vw,48px) clamp(20px,5%,80px);
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 32px;
    align-items: center;
    background: #fff;
  }
  @media(max-width:768px) {
    .lp-flash-section { grid-template-columns: 1fr; gap: 20px; padding: 24px 20px; }
  }
  .lp-flash-left-kicker {
    font-family: var(--f-sans); font-size: 9px; font-weight: 700;
    letter-spacing: 3px; text-transform: uppercase;
    color: #C0392B; margin-bottom: 6px;
    display: flex; align-items: center; gap: 6px;
  }
  .lp-flash-left-title {
    font-family: var(--f-display); font-weight: 300;
    font-size: clamp(22px,3vw,36px); color: var(--ink);
    letter-spacing: -0.5px; line-height: 1.05; margin-bottom: 14px;
  }
  .lp-flash-left-title em { font-style: italic; color: #C0392B; }
  .lp-countdown {
    display: flex; gap: 8px; align-items: flex-start; margin-bottom: 20px;
  }
  .lp-countdown-unit {
    display: flex; flex-direction: column; align-items: center; min-width: 44px;
  }
  .lp-countdown-num {
    font-family: var(--f-display); font-weight: 300;
    font-size: clamp(24px,3vw,36px); line-height: 1;
    color: var(--ink); letter-spacing: -1px;
  }
  .lp-countdown-label {
    font-family: var(--f-sans); font-size: 8px; font-weight: 500;
    letter-spacing: 2px; text-transform: uppercase; color: var(--mid); margin-top: 3px;
  }
  .lp-countdown-sep {
    font-family: var(--f-display); font-size: 28px; font-weight: 300;
    color: var(--mid); line-height: 1.1; padding-top: 2px;
  }
  .lp-flash-strip {
    display: flex; gap: 10px; overflow-x: auto;
    scrollbar-width: none; -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }
  .lp-flash-strip::-webkit-scrollbar { display: none }
  .lp-flash-item {
    flex-shrink: 0; width: 110px; cursor: pointer;
    border: 1px solid var(--rule); background: #fff;
    transition: border-color 0.2s, transform 0.2s;
  }
  .lp-flash-item:hover { border-color: #C0392B; transform: translateY(-2px); }
  .lp-flash-item-img {
    width: 100%; aspect-ratio: 3/4; object-fit: cover;
    display: block; filter: grayscale(15%);
    transition: filter 0.3s;
  }
  .lp-flash-item:hover .lp-flash-item-img { filter: grayscale(0%); }
  .lp-flash-item-info { padding: 7px 8px; }
  .lp-flash-item-name {
    font-family: var(--f-sans); font-size: 9px; font-weight: 500;
    color: var(--ink); white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; margin-bottom: 3px;
  }
  .lp-flash-item-sale { font-family: var(--f-sans); font-size: 10px; font-weight: 700; color: #C0392B; }
  .lp-flash-item-orig { font-family: var(--f-sans); font-size: 9px; color: var(--mid); text-decoration: line-through; margin-left: 4px; }
  .lp-flash-empty {
    font-family: var(--f-sans); font-size: 12px; font-weight: 300;
    color: var(--mid); font-style: italic;
  }
  @media(max-width:640px) { .lp-flash-item { width: 90px; } }
`;"""

assert OLD_H in src, "PATCH H: target string not found"
src = src.replace(OLD_H, NEW_H, 1)
print("✓ Patch H applied: flash sales CSS added")

# ── Patch I: Add useCountdown + FlashSalesStrip before Homepage ──────────────
OLD_I = """/* ─── Homepage component ─────────────────────────────────────────────────── */
export default function Homepage() {"""

NEW_I = """/* ─── Countdown hook ────────────────────────────────────────────────────── */
function useCountdown(target: string | null) {
  const calc = () => {
    if (!target) return { h: 0, m: 0, s: 0, expired: true };
    const diff = new Date(target).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

/* ─── Flash Sales Strip (replaces TrustStrip) ───────────────────────────── */
function FlashSalesStrip({ onShop }: { onShop: (cat: string) => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    axios.get('/api/products/flash-sales?limit=8')
      .then(r => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const soonest = items
    .filter(p => p.sale_ends_at)
    .sort((a, b) => new Date(a.sale_ends_at!).getTime() - new Date(b.sale_ends_at!).getTime())[0]
    ?.sale_ends_at ?? null;

  const { h, m, s, expired } = useCountdown(soonest);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="lp-flash-section">
      {/* Left — label + countdown + CTA */}
      <div>
        <div className="lp-flash-left-kicker">⚡ Flash Sale</div>
        <div className="lp-flash-left-title">
          Prices<br/><em>Slashed</em>
        </div>

        {soonest && !expired ? (
          <>
            <div style={{ fontFamily:'var(--f-sans)', fontSize:10, color:'var(--mid)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8 }}>
              Ends in
            </div>
            <div className="lp-countdown">
              <div className="lp-countdown-unit">
                <span className="lp-countdown-num">{pad(h)}</span>
                <span className="lp-countdown-label">Hrs</span>
              </div>
              <span className="lp-countdown-sep">:</span>
              <div className="lp-countdown-unit">
                <span className="lp-countdown-num">{pad(m)}</span>
                <span className="lp-countdown-label">Min</span>
              </div>
              <span className="lp-countdown-sep">:</span>
              <div className="lp-countdown-unit">
                <span className="lp-countdown-num">{pad(s)}</span>
                <span className="lp-countdown-label">Sec</span>
              </div>
            </div>
          </>
        ) : items.length > 0 ? (
          <p style={{ fontFamily:'var(--f-sans)', fontSize:12, fontWeight:300, color:'var(--mid)', marginBottom:20 }}>
            Deep discounts — limited time only.
          </p>
        ) : null}

        <button
          className="lp-btn-primary"
          style={{ background:'#C0392B', marginTop: 4 }}
          onClick={() => onShop('Flash Sales')}
        >
          Shop All Deals
        </button>
      </div>

      {/* Right — scrollable product strip */}
      <div>
        {items.length > 0 ? (
          <div className="lp-flash-strip">
            {items.map(p => (
              <div
                key={p.id}
                className="lp-flash-item"
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <img
                  className="lp-flash-item-img"
                  src={p.images?.[0] || (p as any).image_url || 'https://placehold.co/110x147/F2F2F2/888?text=LP'}
                  alt={p.name}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/110x147/F2F2F2/888?text=LP'; }}
                />
                <div className="lp-flash-item-info">
                  <div className="lp-flash-item-name">{p.name}</div>
                  <div>
                    <span className="lp-flash-item-sale">KSh {Number(p.sale_price).toLocaleString()}</span>
                    <span className="lp-flash-item-orig">{Number(p.price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="lp-flash-empty">No flash sales active right now — check back soon.</p>
        )}
      </div>
    </div>
  );
}

/* ─── Homepage component ─────────────────────────────────────────────────── */
export default function Homepage() {"""

assert OLD_I in src, "PATCH I: target string not found"
src = src.replace(OLD_I, NEW_I, 1)
print("✓ Patch I applied: useCountdown + FlashSalesStrip added")

# ── Patch J: Swap TrustStrip → FlashSalesStrip in JSX ───────────────────────
OLD_J = """      <Hero onShop={() => selectCategory('All')} />
      <TrustStrip />
      <StatsBar productCount={products.length} />"""

NEW_J = """      <Hero onShop={() => selectCategory('All')} />
      <FlashSalesStrip onShop={selectCategory} />
      <StatsBar productCount={products.length} />"""

assert OLD_J in src, "PATCH J: target string not found"
src = src.replace(OLD_J, NEW_J, 1)
print("✓ Patch J applied: TrustStrip → FlashSalesStrip")

with open(path, "w") as f:
    f.write(src)

print(f"\n✅ Homepage.tsx patched successfully → {path}")
