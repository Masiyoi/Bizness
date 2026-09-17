import pathlib
def find_file(root, filename):
    matches = list(pathlib.Path(root).rglob(filename))
    if not matches:
        print(f"[FAIL] Could not find {filename} under {root}")
        return None
    if len(matches) > 1:
        print(f"[WARN] Multiple matches for {filename}, using first: {matches[0]}")
    return matches[0]
def patch_file(path, replacements):
    if path is None:
        return
    raw = path.read_bytes()
    text = raw.replace(b'\r\n', b'\n').decode('utf-8')
    backup = path.with_suffix(path.suffix + '.bak')
    backup.write_bytes(raw)
    changed = 0
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new, 1)
            changed += 1
            print(f"[OK] Applied patch in {path.name} ({changed}/{len(replacements)})")
        else:
            print(f"[FAIL] Pattern not found in {path.name}: {old[:60]!r}...")
    if changed:
        out = text.replace('\n', '\r\n').encode('utf-8')
        path.write_bytes(out)
        print(f"[OK] Wrote {path} ({changed} patch(es) applied, backup at {backup.name})")
    else:
        print(f"[SKIP] No changes applied to {path}, backup left untouched")
# ── Backend: adminController.js ──────────────────────────────────────────
controller_path = find_file('Server', 'adminController.js')
controller_replacements = [
(
'''    const result = await db.query(
      `SELECT al.*, u.email, u.full_name AS name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );''',
'''    const result = await db.query(
      `SELECT al.*, u.email, u.full_name AS name, p.name AS product_name
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       LEFT JOIN products p
         ON al.metadata ? 'product_id'
        AND p.id = (al.metadata->>'product_id')::int
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );'''
),
]
patch_file(controller_path, controller_replacements)
# ── Frontend: ActivityLog.tsx ────────────────────────────────────────────
frontend_path = find_file('frontend', 'ActivityLog.tsx')
frontend_replacements = [
(
'''interface ActivityLogRow {
  id: number;
  event_type: string;
  metadata: Record<string, any>;
  email?: string;
  name?: string;
  created_at: string;
}''',
'''interface ActivityLogRow {
  id: number;
  event_type: string;
  metadata: Record<string, any>;
  email?: string;
  name?: string;
  product_name?: string;
  created_at: string;
}'''
),
(
'''function formatMetadata(row: ActivityLogRow): string {
  const m = row.metadata || {};
  switch (row.event_type) {
    case 'wishlist_add':
    case 'wishlist_remove':
      return m.product_id != null ? `Product #${m.product_id}` : '—';
    case 'cart_add': {
      const parts = [`Product #${m.product_id}`, `qty ${m.quantity ?? 1}`];
      if (m.selected_color) parts.push(m.selected_color);
      if (m.selected_size) parts.push(`size ${m.selected_size}`);
      return parts.join(' · ');
    }''',
'''function formatMetadata(row: ActivityLogRow): string {
  const m = row.metadata || {};
  const productLabel = row.product_name ?? (m.product_id != null ? `Product #${m.product_id}` : '—');
  switch (row.event_type) {
    case 'wishlist_add':
    case 'wishlist_remove':
      return productLabel;
    case 'cart_add': {
      const parts = [productLabel, `qty ${m.quantity ?? 1}`];
      if (m.selected_color) parts.push(m.selected_color);
      if (m.selected_size) parts.push(`size ${m.selected_size}`);
      return parts.join(' · ');
    }'''
),
]
patch_file(frontend_path, frontend_replacements)
