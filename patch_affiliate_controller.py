import shutil
from pathlib import Path

TARGET = Path("Server/controllers/affiliateController.js")

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
        "listSalespersons: u.name -> u.full_name (SELECT list)",
        """        s.created_at,
        u.name, 
        u.email,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0)::NUMERIC(10,2) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        )::NUMERIC(10,2) AS pending_balance,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'paid'), 
          0
        )::NUMERIC(10,2) AS paid_balance
      FROM salespersons s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      GROUP BY s.id, s.user_id, u.id, u.name, u.email, s.coupon_code, s.commission_pct, s.status, s.created_at""",
        """        s.created_at,
        u.full_name AS name, 
        u.email,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0)::NUMERIC(10,2) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        )::NUMERIC(10,2) AS pending_balance,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'paid'), 
          0
        )::NUMERIC(10,2) AS paid_balance
      FROM salespersons s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      GROUP BY s.id, s.user_id, u.id, u.full_name, u.email, s.coupon_code, s.commission_pct, s.status, s.created_at""",
    ),
    (
        "getSalesperson: u.name -> u.full_name (SELECT single)",
        """        s.created_at,
        u.name, 
        u.email,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0)::NUMERIC(10,2) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        )::NUMERIC(10,2) AS pending_balance
      FROM salespersons s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      WHERE s.id = $1
      GROUP BY s.id, s.user_id, u.id, u.name, u.email""",
        """        s.created_at,
        u.full_name AS name, 
        u.email,
        COUNT(e.id) AS total_sales,
        COALESCE(SUM(e.commission_amount), 0)::NUMERIC(10,2) AS total_earned,
        COALESCE(
          SUM(e.commission_amount) FILTER (WHERE e.payout_status = 'pending'), 
          0
        )::NUMERIC(10,2) AS pending_balance
      FROM salespersons s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN affiliate_earnings e ON e.salesperson_id = s.id
      WHERE s.id = $1
      GROUP BY s.id, s.user_id, u.id, u.full_name, u.email""",
    ),
]

apply_patch(TARGET, replacements)