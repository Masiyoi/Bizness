import shutil
from pathlib import Path

def read_text(p: Path) -> str:
    raw = p.read_bytes()
    return raw.decode("utf-8").replace("\r\n", "\n")

def write_text(p: Path, text: str, had_crlf: bool):
    if had_crlf:
        text = text.replace("\n", "\r\n")
    p.write_bytes(text.encode("utf-8"))

def apply_patch(path: Path, replacements):
    if not path.exists():
        print(f"[SKIP] {path} not found")
        return
    raw = path.read_bytes()
    had_crlf = b"\r\n" in raw
    text = read_text(path)

    backup = path.with_suffix(path.suffix + ".bak")
    shutil.copy2(path, backup)
    print(f"[BACKUP] {backup}")

    changed = 0
    for label, old, new in replacements:
        count = text.count(old)
        if count == 0:
            print(f"[X] pattern not found: {label}")
        elif count > 1:
            print(f"[X] pattern not unique ({count}x), skipped: {label}")
        else:
            text = text.replace(old, new)
            print(f"[OK] {label}")
            changed += 1

    if changed:
        write_text(path, text, had_crlf)
        print(f"[WRITTEN] {path} ({changed}/{len(replacements)} patches applied)")
    else:
        print(f"[NO CHANGES] {path}")

# ── Cart.tsx: show applied coupon in the order-summary sidebar ─────────────
cart_path = Path("frontend/src/pages/Cart.tsx")
cart_replacements = [
    (
        "show applied coupon before Subtotal line",
        """                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                  <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
                </div>""",
        """                {couponCode && (
                  <div style={{ background: T.cream, border: 'none', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="jost" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: T.muted }}>Coupon Applied</span>
                    <span className="jost" style={{ fontSize: 13, fontWeight: 800, color: '#16a34a', letterSpacing: '1px' }}>{couponCode}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                  <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
                </div>""",
    ),
]
apply_patch(cart_path, cart_replacements)

print()

# ── Checkout.tsx: show applied coupon in the review step's totals ──────────
checkout_path = Path("frontend/src/pages/Checkout.tsx")
checkout_replacements = [
    (
        "show applied coupon before Subtotal in review step",
        """              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
              </div>""",
        """              {affiliateCode && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="jost" style={{ fontSize: 13, color: T.muted }}>Coupon</span>
                  <span className="jost" style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', letterSpacing: '1px' }}>{affiliateCode}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span className="jost" style={{ fontSize: 13, color: T.muted }}>Subtotal</span>
                <span className="jost" style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>KSh {subtotal.toLocaleString()}</span>
              </div>""",
    ),
]
apply_patch(checkout_path, checkout_replacements)