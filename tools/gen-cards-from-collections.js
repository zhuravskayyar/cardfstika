#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const INPUT_HTML = path.resolve("pages/collections/collections.html");
const OUT_COLLECTIONS = path.resolve("assets/data/collections.fixed.json");
const OUT_CARDS = path.resolve("assets/data/cards.base.json");

function readFile(p) {
  return fs.readFileSync(p, "utf-8");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const map = {
  а:"a", б:"b", в:"v", г:"h", ґ:"g", д:"d", е:"e", є:"ye", ж:"zh", з:"z", и:"y", і:"i", ї:"yi", й:"y",
  к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r", с:"s", т:"t", у:"u", ф:"f", х:"kh", ц:"ts", ч:"ch",
  ш:"sh", щ:"shch", ю:"yu", я:"ya", ь:"", "'":"", "’":""
};

function slugify(s) {
  const lower = s.trim().toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (map[ch]) out += map[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/\s|[-_]/.test(ch)) out += "-";
    else if (/[«»"]/g.test(ch)) out += "";
    else out += "-";
  }
  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return out || "collection";
}

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const ELEMENTS = ["fire", "water", "earth", "air"];
const RARITIES = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

const COLLECTION_ELEMENT_OVERRIDES = {
  "sea-masters": "water",
  "horde-power": "fire",
  "sky-heroes": "air",
  "forest-dwellers": "earth",
};

function pickElement(cardId) {
  return ELEMENTS[hash32(cardId) % ELEMENTS.length];
}

function pickRarity(cardId) {
  const x = hash32(cardId) % 100;
  if (x < 45) return "common";
  if (x < 70) return "uncommon";
  if (x < 85) return "rare";
  if (x < 93) return "epic";
  if (x < 98) return "legendary";
  return "mythic";
}

function basePowerFor(level, rarity) {
  const rarityMul = {
    common: 1.00,
    uncommon: 1.08,
    rare: 1.18,
    epic: 1.30,
    legendary: 1.45,
    mythic: 1.65,
  }[rarity] ?? 1;

  const base = 10 + (level - 1) * 3;
  return Math.round(base * rarityMul);
}

function parseCollectionsFromHtml(html) {
  const blocks = [...html.matchAll(/<a[^>]*class="collection-card[\s\S]*?<\/a>/g)].map(m => m[0]);

  const collections = [];
  for (const b of blocks) {
    const title = (b.match(/collection-card__title">([^<]+)</)?.[1] ?? "").trim();
    const countText = (b.match(/collection-card__count">([^<]+)</)?.[1] ?? "").trim();
    const total = Number((countText.match(/з\s*(\d+)/)?.[1] ?? "0"));

    if (!title || !total) continue;

    const explicitId = b.match(/data-collection-id="([^\"]+)"/)?.[1] ?? null;
    const id = explicitId ? explicitId.trim() : slugify(title);

    collections.push({ id, title, total });
  }

  const uniq = new Map();
  for (const c of collections) {
    if (!uniq.has(c.id)) uniq.set(c.id, c);
  }
  return [...uniq.values()];
}

function buildData(collections) {
  const cardsById = new Map();
  const collectionsFixed = [];

  for (const col of collections) {
    const cardIds = [];
    for (let i = 1; i <= col.total; i++) {
      const num = String(i).padStart(2, "0");
      const cardId = `${col.id}_${num}`;
      cardIds.push(cardId);

      if (!cardsById.has(cardId)) {
        const rarity = pickRarity(cardId);
        const level = 1;
        const forcedElement = COLLECTION_ELEMENT_OVERRIDES[col.id] || null;
        cardsById.set(cardId, {
          id: cardId,
          name: `${col.title} — Карта ${num}`,
          element: forcedElement || pickElement(cardId),
          rarity,
          level,
          basePower: basePowerFor(level, rarity),
          collections: [col.id],
        });
      } else {
        const c = cardsById.get(cardId);
        if (!c.collections.includes(col.id)) c.collections.push(col.id);
      }
    }

    collectionsFixed.push({
      id: col.id,
      title: col.title,
      cardIds
    });
  }

  const cards = [...cardsById.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { collectionsFixed, cards };
}

function main() {
  if (!fs.existsSync(INPUT_HTML)) {
    console.error(`Input HTML not found: ${INPUT_HTML}`);
    process.exit(1);
  }

  const html = readFile(INPUT_HTML);

  const collections = parseCollectionsFromHtml(html);
  if (!collections.length) {
    console.error("Не знайшов колекцій у HTML. Перевір шлях INPUT_HTML і структуру .collection-card");
    process.exit(1);
  }

  const { collectionsFixed, cards } = buildData(collections);

  ensureDir(OUT_COLLECTIONS);
  ensureDir(OUT_CARDS);

  fs.writeFileSync(OUT_COLLECTIONS, JSON.stringify(collectionsFixed, null, 2), "utf-8");
  fs.writeFileSync(OUT_CARDS, JSON.stringify(cards, null, 2), "utf-8");

  console.log(`OK: collections=${collectionsFixed.length}, cards=${cards.length}`);
  console.log(`-> ${OUT_COLLECTIONS}`);
  console.log(`-> ${OUT_CARDS}`);
}

main();
