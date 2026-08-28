import pathlib

TARGET = "Affiliate.tsx"

START_MARKER = "you earn 10% commission.\n          </p>"
END_MARKER = "Apply to Become a Salesperson\n            </span>\n          </a>"

NEW_BLOCK = """you earn 10% commission.
          </p>

          <a
            href={applyMailto}
            style={{
              display: 'inline-flex', flexDirection: 'column', gap: 2,
              background: 'transparent',
              border: '1.5px solid rgba(232,205,122,0.6)',
              borderRadius: 8,
              padding: '10px 20px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{
              fontSize: 9.5, fontWeight: 600, letterSpacing: '1.5px',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
            }}>
              Want to sell for us?
            </span>
            <span style={{
              fontSize: 12.5, fontWeight: 700, letterSpacing: '1px',
              textTransform: 'uppercase', color: '#E8CD7A',
            }}>
              Apply to Become a Salesperson
            </span>
          </a>"""

def main():
    matches = list(pathlib.Path(".").rglob(TARGET))
    if not matches:
        print(f"[X] Could not find {TARGET} under current directory")
        return

    for path in matches:
        raw = path.read_bytes()
        text = raw.decode("utf-8")
        normalized = text.replace("\r\n", "\n")

        start_idx = normalized.find(START_MARKER)
        end_idx = normalized.find(END_MARKER)

        if start_idx == -1 or end_idx == -1:
            print(f"[X] Could not find both anchor points in {path}")
            print(f"    start found: {start_idx != -1}, end found: {end_idx != -1}")
            continue

        end_idx_full = end_idx + len(END_MARKER)
        before = normalized[:start_idx]
        after = normalized[end_idx_full:]

        patched = before + NEW_BLOCK + after

        # sanity check: exactly one <a and one </a> in the whole file
        if patched.count("<a\n") != 1 or patched.count("</a>") != 3:
            # note: 2 other </a> exist in the payout section, so </a> total should be 3
            print(f"[!] Unexpected tag count after patch in {path} - not writing, please check manually")
            continue

        backup = path.with_suffix(path.suffix + ".bak2")
        backup.write_bytes(raw)

        if b"\r\n" in raw:
            out = patched.replace("\n", "\r\n").encode("utf-8")
        else:
            out = patched.encode("utf-8")

        path.write_bytes(out)
        print(f"[OK] Rebuilt button block in {path} (backup at {backup})")

if __name__ == "__main__":
    main()