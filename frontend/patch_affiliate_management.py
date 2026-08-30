import shutil
from pathlib import Path

TARGET = Path("src/pages/admin/components/affiliate/AffiliateManagement.tsx")

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

replacements = [
    (
        "add axios import",
        "import { useEffect, useState } from 'react';\nimport { T, lbl, inp } from '../../constants';",
        "import { useEffect, useState } from 'react';\nimport axios from 'axios';\nimport { T, lbl, inp } from '../../constants';",
    ),
    (
        "loadSalespersons: use axios + unwrap data.data",
        """  const loadSalespersons = async () => {
    try {
      const res = await fetch('/api/affiliate/salespersons', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load salespersons');
      const data = await res.json();
      setSalespersons(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load salespersons', 'err');
    } finally {
      setLoading(false);
    }
  };""",
        """  const loadSalespersons = async () => {
    try {
      const res = await axios.get('/api/affiliate/salespersons');
      setSalespersons(res.data.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load salespersons', 'err');
    } finally {
      setLoading(false);
    }
  };""",
    ),
    (
        "handleAdd: use axios + unwrap data.data.coupon_code",
        """    setAdding(true);
    try {
      const res = await fetch('/api/affiliate/salespersons', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          commissionPct: commissionPct ? Number(commissionPct) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to add salesperson');

      showToast(`✓ Added ${fullName} — code ${data.coupon_code}`);
      setEmail(''); setFullName(''); setCommissionPct('');
      loadSalespersons();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to add salesperson', 'err');
    } finally {
      setAdding(false);
    }""",
        """    setAdding(true);
    try {
      const res = await axios.post('/api/affiliate/salespersons', {
        email: email.trim(),
        fullName: fullName.trim(),
        commissionPct: commissionPct ? Number(commissionPct) : undefined,
      });

      const salesperson = res.data.data;
      showToast(`✓ Added ${fullName} — code ${salesperson.coupon_code}`);
      setEmail(''); setFullName(''); setCommissionPct('');
      loadSalespersons();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to add salesperson', 'err');
    } finally {
      setAdding(false);
    }""",
    ),
    (
        "handleMarkPaid: use axios",
        """    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/affiliate/salespersons/${confirmTarget.id}/payout`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to mark payout as paid');

      showToast('✓ Payout marked as paid');
      loadSalespersons();
    } catch (err) {
      console.error(err);
      showToast('Failed to mark payout as paid', 'err');
    } finally {
      setMarkingPaid(false);
      setConfirmTarget(null);
    }""",
        """    setMarkingPaid(true);
    try {
      await axios.patch(`/api/affiliate/salespersons/${confirmTarget.id}/payout`);

      showToast('✓ Payout marked as paid');
      loadSalespersons();
    } catch (err) {
      console.error(err);
      showToast('Failed to mark payout as paid', 'err');
    } finally {
      setMarkingPaid(false);
      setConfirmTarget(null);
    }""",
    ),
]

apply_patch(TARGET, replacements)