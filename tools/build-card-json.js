const fs = require("fs");
const path = require("path");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeElement(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (["fire", "water", "air", "earth"].includes(s)) return s;
  if (s === "wind") return "air";
  return "earth";
}

function normalizeRarity(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (["common", "uncommon", "rare", "epic", "legendary", "mythic"].includes(s)) return s;
  if (s === "rarity-1") return "common";
  if (s === "rarity-2") return "uncommon";
  if (s === "rarity-3") return "rare";
  if (s === "rarity-4") return "epic";
  if (s === "rarity-5") return "legendary";
  if (s === "rarity-6") return "mythic";
  return "common";
}

function asNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function buildFallbackBio(card) {
  const rarityText = String(card?.rarity || "common");
  const rarityMap = {
    common: "звичайна",
    uncommon: "незвичайна",
    rare: "рідкісна",
    epic: "епічна",
    legendary: "легендарна",
    mythic: "міфічна",
  };
  const elementMap = {
    fire: "вогню",
    water: "води",
    earth: "землі",
    air: "повітря",
  };
  const elementText = elementMap[String(card?.element || "earth")] || "землі";
  const collections = ensureArray(card?.collections).filter(Boolean);
  const collectionText = collections.length ? ` Належить до колекції: ${collections.join(", ")}.` : "";
  const rarityUa = rarityMap[rarityText] || "звичайна";
  return `${card.title} — ${rarityUa} карта стихії ${elementText}.${collectionText}`.trim();
}

function main() {
  const root = path.resolve(__dirname, "..");
  const collectionsPath = path.join(root, "data", "collections.json");
  const biosPath = path.join(root, "data", "card-bio.json");
  const outPath = path.join(root, "data", "card.json");

  const collectionsJson = readJson(collectionsPath);
  const biosJson = readJson(biosPath);

  const collections = ensureArray(collectionsJson?.collections);
  const bios = biosJson && typeof biosJson === "object" && biosJson.bios && typeof biosJson.bios === "object" ? biosJson.bios : {};

  const byId = new Map();

  const upsert = (raw, extra = {}) => {
    const id = String(raw?.id || "").trim();
    if (!id) return;

    const prev = byId.get(id) || {
      id,
      title: "",
      element: "earth",
      rarity: "common",
      basePower: 0,
      collections: [],
      bio: "",
    };

    const title = String(raw?.title ?? raw?.name ?? "").trim();
    const element = normalizeElement(raw?.element ?? prev.element);
    const rarity = normalizeRarity(raw?.rarity ?? prev.rarity);
    const basePower = asNumber(raw?.basePower ?? raw?.power ?? prev.basePower, prev.basePower);
    const bioById = String(bios[id] || "").trim();

    const colSet = new Set(prev.collections);
    for (const c of ensureArray(raw?.collections)) {
      const t = String(c || "").trim();
      if (t) colSet.add(t);
    }
    for (const c of ensureArray(extra.collections)) {
      const t = String(c || "").trim();
      if (t) colSet.add(t);
    }

    const next = {
      id,
      title: title || prev.title || id,
      element,
      rarity,
      basePower,
      collections: [...colSet],
      bio: bioById || prev.bio || "",
    };

    byId.set(id, next);
  };

  for (const col of collections) {
    const colTitle = String(col?.title || col?.id || "").trim();
    for (const c of ensureArray(col?.cards)) {
      upsert(c, { collections: colTitle ? [colTitle] : [] });
    }
  }

  for (const card of byId.values()) {
    if (String(card.bio || "").trim()) continue;
    card.bio = buildFallbackBio(card);
  }

  const outCards = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, "en"));
  const out = {
    meta: {
      version: 1,
      generatedAt: new Date().toISOString(),
      sourceFiles: ["data/collections.json", "data/card-bio.json"],
      totalCards: outCards.length,
    },
    cards: outCards,
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Generated ${path.relative(root, outPath)} with ${outCards.length} cards.`);
}

main();
