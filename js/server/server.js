import express from "express";
import cors from "cors";
import { all, get, run } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // base64 image орж ирэх тул

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// бүх зар авах
app.get("/api/ads", async (req, res) => {
  const rows = await all(
    `SELECT * FROM ads ORDER BY featured DESC, datetime(createdAt) DESC`
  );
  res.json(rows.map(rowToAd));
});

// нэг зар авах (+views нэмэх)
app.get("/api/ads/:id", async (req, res) => {
  const { id } = req.params;

  // views++
  await run(`UPDATE ads SET views = views + 1 WHERE id = ?`, [id]);

  const row = await get(`SELECT * FROM ads WHERE id = ?`, [id]);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(rowToAd(row));
});

// зар нэмэх
app.post("/api/ads", async (req, res) => {
  const ad = req.body;

  if (!ad?.id || !ad.title || !ad.category || !ad.location || !ad.phone || !ad.description || !ad.pin) {
    return res.status(400).json({ error: "Missing fields" });
  }

  await run(
    `INSERT INTO ads (id,title,category,price,location,phone,description,image,pin,featured,views,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      ad.id,
      ad.title,
      ad.category,
      Number(ad.price || 0),
      ad.location,
      ad.phone,
      ad.description,
      ad.image || "",
      ad.pin,
      ad.featured ? 1 : 0,
      Number(ad.views || 0),
      ad.createdAt || new Date().toISOString(),
      ad.updatedAt || ""
    ]
  );

  res.json({ ok: true });
});

// зар засах (PIN шаардлагатай)
app.put("/api/ads/:id", async (req, res) => {
  const { id } = req.params;
  const patch = req.body;

  const row = await get(`SELECT * FROM ads WHERE id = ?`, [id]);
  if (!row) return res.status(404).json({ error: "Not found" });

  if (!patch?.pin || String(patch.pin).trim() !== String(row.pin).trim()) {
    return res.status(403).json({ error: "Wrong pin" });
  }

  await run(
    `UPDATE ads SET
      title = ?,
      category = ?,
      price = ?,
      location = ?,
      phone = ?,
      description = ?,
      image = ?,
      featured = ?,
      updatedAt = ?
     WHERE id = ?`,
    [
      patch.title ?? row.title,
      patch.category ?? row.category,
      Number(patch.price ?? row.price ?? 0),
      patch.location ?? row.location,
      patch.phone ?? row.phone,
      patch.description ?? row.description,
      patch.image ?? row.image ?? "",
      patch.featured ? 1 : 0,
      new Date().toISOString(),
      id
    ]
  );

  res.json({ ok: true });
});

// зар устгах (PIN шаардлагатай)
app.delete("/api/ads/:id", async (req, res) => {
  const { id } = req.params;
  const { pin } = req.body || {};

  const row = await get(`SELECT * FROM ads WHERE id = ?`, [id]);
  if (!row) return res.status(404).json({ error: "Not found" });

  if (!pin || String(pin).trim() !== String(row.pin).trim()) {
    return res.status(403).json({ error: "Wrong pin" });
  }

  await run(`DELETE FROM ads WHERE id = ?`, [id]);
  res.json({ ok: true });
});

function rowToAd(row) {
  return {
    ...row,
    price: Number(row.price || 0),
    featured: !!row.featured,
    views: Number(row.views || 0)
  };
}

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});