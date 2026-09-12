"""
Patch: src/pages/Homepage.tsx + src/constants/theme.ts

Wires the (currently unused) `categoryTree` / `genderFilter` state to actually
drive the CategoryBanner strip, instead of the flat hardcoded `categories`
array. Also adds a fetch for the category tree, and extends `Product` with
the category_gender / category_department / category_slug / category_name
fields the backend now returns (see productController.js patch).

ASSUMPTIONS -- please confirm/adjust if wrong:
  1. There is a GET /api/categories endpoint returning a FLAT array of rows:
       { id, name, slug, gender: 'men'|'women', department: 'footwear'|'clothing', sort_order }
     If your endpoint already returns a nested tree, or lives at a different
     path, tell me and I'll adjust the fetch + shaping logic instead of this
     client-side grouping.
  2. CategoryBanner slugs are gender-prefixed ("men-tops", "women-heels") to
     match the keys already hardcoded in CategoryBanner.tsx's CATEGORY_IMAGES.
  3. Navbar's `categories` prop keeps using plain category NAMES (not slugs),
     deduped across both genders/departments -- this is a separate nav flow
     from the CategoryBanner strip and I have not changed how Navbar's
     onCategorySelect behaves when a name (rather than a slug) is picked.
     That's an existing split in the code, not something this patch resolves.

Usage:
    python patch_homepage_category_tree.py

Run from repo root (C:\\Users\\Administrator\\bizness), or edit the TARGET_*
paths below. Creates a .bak backup of each file before writing.
"""
import pathlib

TARGET_HOMEPAGE = pathlib.Path("frontend/src/pages/Homepage.tsx")
TARGET_THEME    = pathlib.Path("frontend/src/constants/theme.ts")


def load(path: pathlib.Path):
    raw = path.read_bytes()
    had_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    had_crlf = "\r\n" in text
    return raw, text.replace("\r\n", "\n"), had_bom, had_crlf


def save(path: pathlib.Path, text_lf: str, had_bom: bool, had_crlf: bool, raw_backup: bytes):
    backup = path.with_suffix(path.suffix + ".bak")
    backup.write_bytes(raw_backup)
    print(f"[OK] Backup written: {backup}")
    out = text_lf.replace("\n", "\r\n") if had_crlf else text_lf
    prefix = "\ufeff" if had_bom else ""
    path.write_bytes((prefix + out).encode("utf-8"))
    print(f"[OK] Patched: {path}")


def patch_homepage():
    if not TARGET_HOMEPAGE.exists():
        print(f"\u2717 File not found: {TARGET_HOMEPAGE}")
        return
    raw, text, had_bom, had_crlf = load(TARGET_HOMEPAGE)
    changed = False

    # 1) Fetch the category tree after the flash-sales effect
    old1 = """  useEffect(() => {
    axios.get('/api/products/flash-sales?limit=100')
      .then(r => {
        const map: Record<number, number> = {};
        (r.data as { id: number; sale_price: number }[]).forEach(p => {
          map[p.id] = p.sale_price;
        });
        setFlashSaleMap(map);
      })
      .catch(() => {});
  }, []);"""
    new1 = old1 + """

  useEffect(() => {
    axios.get('/api/categories')
      .then(r => {
        type CategoryRow = CategoryNode & { gender: 'men' | 'women'; department: 'footwear' | 'clothing' };
        const rows: CategoryRow[] = r.data;
        const tree: CategoryTree = {
          men:   { footwear: [], clothing: [] },
          women: { footwear: [], clothing: [] },
        };
        rows.forEach(row => {
          const bucket = tree[row.gender]?.[row.department];
          if (bucket) bucket.push({ id: row.id, name: row.name, slug: row.slug, sort_order: row.sort_order });
        });
        (Object.keys(tree) as Array<'men' | 'women'>).forEach(g => {
          (Object.keys(tree[g]) as Array<'footwear' | 'clothing'>).forEach(d => {
            tree[g][d].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          });
        });
        setCategoryTree(tree);
      })
      .catch(() => {});
  }, []);"""
    if old1 in text:
        text = text.replace(old1, new1)
        print("[OK] 1/5 Added /api/categories fetch + tree builder")
        changed = True
    else:
        print("\u2717 1/5 Pattern not found: flash-sales effect block (skipping)")

    # 2) Replace the flat `categories` array with tree-derived arrays
    old2 = """  const categories = [
    'All', 'Tops', 'Bottoms', 'Outwear', 'Heels', 'Accessories',
    'Bags', 'Footwear', 'Sets', 'Headgear', 'Hoodies and jackets',
  ];"""
    new2 = """  const genderCategoryNodes = categoryTree
    ? [...categoryTree[genderFilter].clothing, ...categoryTree[genderFilter].footwear]
    : [];

  // CategoryBanner needs { slug, name }; slugs are gender-prefixed to match
  // the keys hardcoded in CategoryBanner.tsx's CATEGORY_IMAGES.
  const categoryBannerItems: { slug: string; name: string }[] = [
    { slug: 'all', name: 'All' },
    ...genderCategoryNodes.map(c => ({ slug: `${genderFilter}-${c.slug}`, name: c.name })),
  ];

  const activeCategoryName =
    categoryBannerItems.find(c => c.slug === activeCategory)?.name ?? activeCategory;

  // Navbar shows plain category names (not gender-specific slugs), deduped
  // across both genders and departments.
  const navCategoryNames = categoryTree
    ? Array.from(new Set(
        [
          ...categoryTree.men.clothing, ...categoryTree.men.footwear,
          ...categoryTree.women.clothing, ...categoryTree.women.footwear,
        ].map(c => c.name)
      ))
    : [];"""
    if old2 in text:
        text = text.replace(old2, new2)
        print("[OK] 2/5 Replaced flat `categories` array with tree-derived arrays")
        changed = True
    else:
        print("\u2717 2/5 Pattern not found: flat `categories` array (skipping -- already patched?)")

    # 3) Update product filtering to match on category_slug + category_gender
    old3 = """  let filtered = products
    .filter(p => !(p.id in flashSaleMap))
    .filter(p =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );"""
    new3 = """  const activeBaseSlug = activeCategory === 'all' ? null : activeCategory.slice(genderFilter.length + 1);

  let filtered = products
    .filter(p => !(p.id in flashSaleMap))
    .filter(p =>
      (activeBaseSlug === null || (p.category_slug === activeBaseSlug && p.category_gender === genderFilter)) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    );"""
    if old3 in text:
        text = text.replace(old3, new3)
        print("[OK] 3/5 Product filter now matches category_slug + category_gender")
        changed = True
    else:
        print("\u2717 3/5 Pattern not found: product filter block (skipping -- already patched?)")

    # 4) Navbar categories prop -> plain names from the tree
    old4 = "        categories={categories.filter(c => c !== 'All')}"
    new4 = "        categories={navCategoryNames}"
    if old4 in text:
        text = text.replace(old4, new4)
        print("[OK] 4/5 Navbar categories prop now uses navCategoryNames")
        changed = True
    else:
        print("\u2717 4/5 Pattern not found: Navbar categories prop (run patch_homepage_bannercategories.py first?)")

    # 5) CategoryBanner categories prop + section title + empty-state text
    old5a = """        <CategoryBanner
          categories={categories}
          activeCategory={activeCategory}
          onSelect={selectCategory}
        />"""
    new5a = """        <CategoryBanner
          categories={categoryBannerItems}
          activeCategory={activeCategory}
          onSelect={selectCategory}
        />"""
    if old5a in text:
        text = text.replace(old5a, new5a)
        print("[OK] 5a/5 CategoryBanner categories prop now uses categoryBannerItems")
        changed = True
    else:
        print("\u2717 5a/5 Pattern not found: CategoryBanner usage (skipping -- already patched?)")

    old5b = """            <h2 className="lp-section-title">
              {activeCategory === 'All' ? <>Featured <em>Fashion</em></> : activeCategory}
            </h2>"""
    new5b = """            <h2 className="lp-section-title">
              {activeCategory === 'all' ? <>Featured <em>Fashion</em></> : activeCategoryName}
            </h2>"""
    if old5b in text:
        text = text.replace(old5b, new5b)
        print("[OK] 5b/5 Section title now shows the resolved category name")
        changed = True
    else:
        print("\u2717 5b/5 Pattern not found: section title block (skipping -- already patched?)")

    old5c = '''                {search ? `No results for "${search}" — try a different term` : `No products in ${activeCategory} yet — check back soon`}'''
    new5c = '''                {search ? `No results for "${search}" — try a different term` : `No products in ${activeCategoryName} yet — check back soon`}'''
    if old5c in text:
        text = text.replace(old5c, new5c)
        print("[OK] 5c/5 Empty-state text now shows the resolved category name")
        changed = True
    else:
        print("\u2717 5c/5 Pattern not found: empty-state text (skipping -- already patched?)")

    if changed:
        save(TARGET_HOMEPAGE, text, had_bom, had_crlf, raw)
    else:
        print("No changes applied to Homepage.tsx.")


def patch_theme():
    if not TARGET_THEME.exists():
        print(f"\u2717 File not found: {TARGET_THEME}")
        return
    raw, text, had_bom, had_crlf = load(TARGET_THEME)

    old = """  sale_price?:   number | null;
  sale_ends_at?: string | null;
  video_url: string | null;
}"""
    new = """  sale_price?:   number | null;
  sale_ends_at?: string | null;
  video_url: string | null;
  category_gender?:     'men' | 'women' | null;
  category_department?: 'footwear' | 'clothing' | null;
  category_slug?:        string | null;
  category_name?:        string | null;
}"""
    if old in text:
        text = text.replace(old, new)
        print("[OK] Product interface now includes category_gender/department/slug/name")
        save(TARGET_THEME, text, had_bom, had_crlf, raw)
    else:
        print("\u2717 Pattern not found: Product interface tail in theme.ts (skipping -- already patched?)")


if __name__ == "__main__":
    print("--- Homepage.tsx ---")
    patch_homepage()
    print("\n--- theme.ts ---")
    patch_theme()