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

# ── Affiliate.tsx ─────────────────────────────────────────────────────────
affiliate_path = Path("frontend/src/pages/profile/Affiliate.tsx")
affiliate_replacements = [
    (
        "add axios import",
        "import { useEffect, useState } from 'react';\nimport { useNavigate, useOutletContext } from 'react-router-dom';",
        "import { useEffect, useState } from 'react';\nimport axios from 'axios';\nimport { useNavigate, useOutletContext } from 'react-router-dom';",
    ),
    (
        "use axios + check isAffiliate instead of res.ok",
        """    (async () => {
      try {
        const res = await fetch('/api/affiliate/me', { credentials: 'include' });
        if (res.ok) {
          if (!cancelled) navigate('/profile/affiliate/dashboard', { replace: true });
          return;
        }
      } catch {
        // couldn't check — fall through and show the apply page
      }
      if (!cancelled) setChecking(false);
    })();""",
        """    (async () => {
      try {
        const res = await axios.get('/api/affiliate/me');
        if (res.data?.isAffiliate) {
          if (!cancelled) navigate('/profile/affiliate/dashboard', { replace: true });
          return;
        }
      } catch {
        // couldn't check — fall through and show the apply page
      }
      if (!cancelled) setChecking(false);
    })();""",
    ),
]
apply_patch(affiliate_path, affiliate_replacements)

print()

# ── SalespersonDashboard.tsx ─────────────────────────────────────────────
dash_path = Path("frontend/src/pages/profile/SalespersonDashboard.tsx")
dash_replacements = [
    (
        "add axios import",
        "import { useEffect, useState } from 'react';\nimport { useOutletContext } from 'react-router-dom';",
        "import { useEffect, useState } from 'react';\nimport axios from 'axios';\nimport { useOutletContext } from 'react-router-dom';",
    ),
    (
        "use axios + read isAffiliate/data correctly",
        """      try {
        const res = await fetch('/api/affiliate/me', { credentials: 'include' });

        if (res.status === 404) {
          if (!cancelled) { setStats(null); setLoading(false); }
          return;
        }
        if (!res.ok) throw new Error('Failed to load affiliate stats');

        const data = await res.json();
        if (!cancelled) { setStats(data); setLoading(false); }
      } catch (err) {
        console.error(err);
        if (!cancelled) { setError('Could not load your affiliate stats. Please try again.'); setLoading(false); }
      }""",
        """      try {
        const res = await axios.get('/api/affiliate/me');
        const body = res.data;

        if (!body?.isAffiliate) {
          if (!cancelled) { setStats(null); setLoading(false); }
          return;
        }

        if (!cancelled) { setStats({ isAffiliate: true, ...body.data }); setLoading(false); }
      } catch (err) {
        console.error(err);
        if (!cancelled) { setError('Could not load your affiliate stats. Please try again.'); setLoading(false); }
      }""",
    ),
]
apply_patch(dash_path, dash_replacements)