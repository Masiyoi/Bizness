const express = require('express');
const db = require('../config/db');
const router = express.Router();
const SITE = (process.env.FEED_SITE || 'https://www.plugwalk.co').replace(/\/+$/, '');
const BRAND = process.env.FEED_BRAND || 'Plug Walk Studio';
const COLUMNS = [
  'id', 'item_group_id', 'title', 'description', 'availability', 'condition',
  'price', 'sale_price', 'link', 'image_link', 'additional_image_link',
  'brand', 'product_type', 'color', 'size', 'gender', 'age_group',
];
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const csv = (v) => '"' + clean(v).replace(/"/g, '""') + '"';
const money = (n) => Number(n).toFixed(2) + ' KES';
function imageUrls(p) {
  const list = [];
  if (p.image_url) list.push(p.image_url);
  let imgs = p.images;
  if (typeof imgs === 'string') {
    try { imgs = JSON.parse(imgs); } catch (e) { imgs = []; }
  }
  if (Array.isArray(imgs)) {
    for (const i of imgs) {
      const u = typeof i === 'string' ? i : (i && (i.url || i.secure_url));
      if (u) list.push(u);
    }
  }
  return [...new Set(list.filter((u) => /^https?:\/\//i.test(u)))];
}
router.get('/meta.csv', async (req, res) => {
  const expected = process.env.FEED_KEY;
  if (!expected) return res.status(503).send('Feed not configured');
  if (req.query.key !== expected) return res.status(403).send('Forbidden');
  try {
    const pRes = await db.query(
      'SELECT id, name, description, price, sale_price, sale_ends_at, stock_quantity, stock, image_url, images, category FROM products ORDER BY id'
    );
    const vRes = await db.query(
      'SELECT id, product_id, color, size, stock FROM product_variants ORDER BY product_id, id'
    );
    const products = pRes.rows || pRes;
    const variants = vRes.rows || vRes;
    const byProduct = new Map();
    for (const v of variants) {
      if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, []);
      byProduct.get(v.product_id).push(v);
    }
    const now = Date.now();
    const lines = [COLUMNS.join(',')];
    for (const p of products) {
      const price = Number(p.price);
      if (!(price > 0)) continue;
      const imgs = imageUrls(p);
      if (!imgs.length) continue;
      const salePrice = Number(p.sale_price);
      const saleActive =
        salePrice > 0 && salePrice < price &&
        p.sale_ends_at && new Date(p.sale_ends_at).getTime() > now;
      const base = {
        item_group_id: p.id,
        title: String(p.name || '').slice(0, 200),
        description: String(p.description || p.name || '').slice(0, 9000),
        condition: 'new',
        price: money(price),
        sale_price: saleActive ? money(salePrice) : '',
        link: SITE + '/#/product/' + p.id,
        image_link: imgs[0],
        additional_image_link: imgs.slice(1, 11).join(','),
        brand: BRAND,
        product_type: p.category || '',
        gender: 'unisex',
        age_group: 'adult',
      };
      const own = byProduct.get(p.id) || [];
      const rows = own.length
        ? own.map((v) => ({
            ...base,
            id: p.id + '-' + v.id,
            availability: Number(v.stock) > 0 ? 'in stock' : 'out of stock',
            color: v.color || '',
            size: v.size || '',
          }))
        : [{
            ...base,
            id: String(p.id),
            availability: Number(p.stock_quantity ?? p.stock ?? 0) > 0 ? 'in stock' : 'out of stock',
            color: '',
            size: '',
          }];
      for (const r of rows) lines.push(COLUMNS.map((c) => csv(r[c])).join(','));
    }
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' });
    res.send(lines.join('\r\n'));
  } catch (err) {
    console.error('Meta feed error:', err.message);
    res.status(500).send('Feed error');
  }
});
module.exports = router;