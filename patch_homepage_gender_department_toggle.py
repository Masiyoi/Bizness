"""
Patch: src/pages/Homepage.tsx

Adds the actual UI for the gender/department filters. `genderFilter` already
existed in state but nothing ever called `setGenderFilter` -- this adds a
Men/Women toggle plus a new All/Clothing/Footwear toggle, placed right under
the "Featured Fashion" heading and above the CategoryBanner strip.

Usage:
    python patch_homepage_gender_department_toggle.py

Run from repo root (C:\\Users\\Administrator\\bizness), or edit TARGET below.
Creates a .bak3 backup before writing.
"""
import pathlib

TARGET = pathlib.Path("frontend/src/pages/Homepage.tsx")


def main():
    if not TARGET.exists():
        print(f"\u2717 File not found: {TARGET}")
        print("  Edit TARGET at the top of this script to point at Homepage.tsx")
        return

    raw = TARGET.read_bytes()
    had_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    had_crlf = "\r\n" in text
    text_lf = text.replace("\r\n", "\n")
    changed = False

    # 1) Add departmentFilter state next to genderFilter
    old1 = """  const [genderFilter, setGenderFilter] = useState<'men' | 'women'>('men');
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);"""
    new1 = """  const [genderFilter, setGenderFilter] = useState<'men' | 'women'>('men');
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'clothing' | 'footwear'>('all');
  const [categoryTree, setCategoryTree] = useState<CategoryTree | null>(null);"""
    if old1 in text_lf:
        text_lf = text_lf.replace(old1, new1)
        print("[OK] 1/5 Added departmentFilter state")
        changed = True
    else:
        print("\u2717 1/5 Pattern not found: genderFilter/categoryTree state block (skipping)")

    # 2) genderCategoryNodes now respects departmentFilter
    old2 = """  const genderCategoryNodes = categoryTree
    ? [...categoryTree[genderFilter].clothing, ...categoryTree[genderFilter].footwear]
    : [];"""
    new2 = """  const genderCategoryNodes = categoryTree
    ? (departmentFilter === 'all'
        ? [...categoryTree[genderFilter].clothing, ...categoryTree[genderFilter].footwear]
        : categoryTree[genderFilter][departmentFilter])
    : [];"""
    if old2 in text_lf:
        text_lf = text_lf.replace(old2, new2)
        print("[OK] 2/5 genderCategoryNodes now filters by departmentFilter")
        changed = True
    else:
        print("\u2717 2/5 Pattern not found: genderCategoryNodes block (skipping -- already patched?)")

    # 3) Product filter now also checks category_department
    old3 = """  let filtered = products
    .filter(p => !(p.id in flashSaleMap))
    .filter(p =>
      (activeBaseSlug === null || (p.category_slug === activeBaseSlug && p.category_gender === genderFilter)) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );"""
    new3 = """  let filtered = products
    .filter(p => !(p.id in flashSaleMap))
    .filter(p =>
      (activeBaseSlug === null || (p.category_slug === activeBaseSlug && p.category_gender === genderFilter)) &&
      (departmentFilter === 'all' || p.category_department === departmentFilter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );"""
    if old3 in text_lf:
        text_lf = text_lf.replace(old3, new3)
        print("[OK] 3/5 Product filter now checks category_department")
        changed = True
    else:
        print("\u2717 3/5 Pattern not found: product filter block (skipping -- already patched?)")

    # 4) Reset page/category when departmentFilter changes too
    old4 = """  useEffect(() => { setCategory('all'); setPage(1); }, [genderFilter]);"""
    new4 = """  useEffect(() => { setCategory('all'); setPage(1); }, [genderFilter, departmentFilter]);"""
    if old4 in text_lf:
        text_lf = text_lf.replace(old4, new4)
        print("[OK] 4/5 Gender/department change now resets activeCategory + page")
        changed = True
    else:
        print("\u2717 4/5 Pattern not found: genderFilter reset effect (skipping -- already patched?)")

    # 5a) Add toggle CSS
    old5a = """  .lp-video-wrap-top { border-top: 1px solid var(--rule); }
`;"""
    new5a = """  .lp-video-wrap-top { border-top: 1px solid var(--rule); }
  .lp-filter-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 0 clamp(20px,5%,80px) 20px; }
  .lp-toggle-group { display: flex; gap: 6px; }
  .lp-toggle-btn { font-family: var(--f-sans); font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 9px 18px; border: 1px solid rgba(0,0,0,0.15); background: #fff; color: var(--mid); cursor: pointer; transition: all 0.18s; }
  .lp-toggle-btn:hover { border-color: var(--ink); color: var(--ink); }
  .lp-toggle-btn.active { background: var(--ink); color: #fff; border-color: var(--ink); }
  @media(max-width:640px) { .lp-toggle-btn { padding: 8px 12px; font-size: 9px; letter-spacing: 1px; } }
`;"""
    if old5a in text_lf:
        text_lf = text_lf.replace(old5a, new5a)
        print("[OK] 5a/5 Added toggle CSS")
        changed = True
    else:
        print("\u2717 5a/5 Pattern not found: css template tail (skipping -- already patched?)")

    # 5b) Insert the toggle row JSX right after the section-head, before CategoryBanner
    old5b = """                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <CategoryBanner
          categories={categoryBannerItems}
          activeCategory={activeCategory}
          onSelect={selectCategory}
        />"""
    new5b = """                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lp-filter-row">
          <div className="lp-toggle-group">
            {(['men', 'women'] as const).map(g => (
              <button
                key={g}
                className={`lp-toggle-btn ${genderFilter === g ? 'active' : ''}`}
                onClick={() => setGenderFilter(g)}
              >
                {g === 'men' ? 'Men' : 'Women'}
              </button>
            ))}
          </div>
          <div className="lp-toggle-group">
            {(['all', 'clothing', 'footwear'] as const).map(d => (
              <button
                key={d}
                className={`lp-toggle-btn ${departmentFilter === d ? 'active' : ''}`}
                onClick={() => setDepartmentFilter(d)}
              >
                {d === 'all' ? 'All' : d === 'clothing' ? 'Clothing' : 'Footwear'}
              </button>
            ))}
          </div>
        </div>

        <CategoryBanner
          categories={categoryBannerItems}
          activeCategory={activeCategory}
          onSelect={selectCategory}
        />"""
    if old5b in text_lf:
        text_lf = text_lf.replace(old5b, new5b)
        print("[OK] 5b/5 Inserted Men/Women + All/Clothing/Footwear toggle row")
        changed = True
    else:
        print("\u2717 5b/5 Pattern not found: section-head/CategoryBanner boundary (skipping -- already patched?)")

    if not changed:
        print("No changes applied.")
        return

    backup = TARGET.with_suffix(TARGET.suffix + ".bak3")
    backup.write_bytes(raw)
    print(f"[OK] Backup written: {backup}")

    out_text = text_lf.replace("\n", "\r\n") if had_crlf else text_lf
    prefix = "\ufeff" if had_bom else ""
    TARGET.write_bytes((prefix + out_text).encode("utf-8"))
    print(f"[OK] Patched: {TARGET}")


if __name__ == "__main__":
    main()