const fs = require("fs");
const path = require("path");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function normalizeTitle(s) {
  return String(s || "")
    .replace(/[«»"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\(трофей\)/gi, "")
    .replace(/\(в колекції\)/gi, "")
    .replace(/\(генерал\)/gi, "")
    .replace(/\(гном\)/gi, "")
    .replace(/\(ордену\)/gi, "")
    .replace(/\(алмазний\)/gi, "")
    .replace(/\(берегів\)/gi, "")
    .replace(/\(пустелі\)/gi, "")
    .replace(/\(полум'я\)/gi, "")
    .replace(/\(буря\)/gi, "")
    .replace(/\(ковка\)/gi, "")
    .replace(/\(дракон\. магії\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEntriesFromText(rawText, knownCollections) {
  const lines = String(rawText || "").split(/\r?\n/);
  const entries = [];
  let currentCollection = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === "---") continue;

    let m = line.match(/^###\s+\*\*(.+?)\*\*\s*$/);
    if (m) {
      currentCollection = m[1].trim();
      continue;
    }

    if (knownCollections.has(line)) {
      currentCollection = line;
      continue;
    }

    // Special malformed line for "Шторм"
    if (/^\d+\.\s*\*\*шторм/i.test(line) && /елементаль повітря/i.test(line)) {
      const bio = line
        .replace(/^\d+\.\s*\*\*шторм\s*/i, "")
        .replace(/\*\*$/, "")
        .trim();
      entries.push({
        collection: currentCollection,
        title: "Шторм",
        bio: `Шторм — ${bio}`.trim(),
      });
      continue;
    }

    // 1) Numbered bold markdown
    m = line.match(/^\d+\.\s+\*\*(.+?)\*\*\s*[–-]\s+(.+)$/);
    if (m) {
      entries.push({ collection: currentCollection, title: m[1].trim(), bio: m[2].trim() });
      continue;
    }

    // 2) Numbered plain
    m = line.match(/^\d+\.\s+(.+?)\s*[–-]\s+(.+)$/);
    if (m) {
      entries.push({ collection: currentCollection, title: m[1].trim(), bio: m[2].trim() });
      continue;
    }

    // 3) Plain title – bio
    m = line.match(/^(.+?)\s*[–-]\s+(.+)$/);
    if (m) {
      entries.push({ collection: currentCollection, title: m[1].trim(), bio: m[2].trim() });
      continue;
    }
  }

  return entries;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const cardsPath = path.join(root, "data", "cards.json");
  const bioPath = path.join(root, "data", "card-bio.json");
  const sourcePath = path.join(root, "data", "card-bio-source.md");

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing source file: ${sourcePath}`);
  }

  const cards = readJson(cardsPath).cards || [];
  const bioJson = readJson(bioPath);
  bioJson.bios = bioJson.bios || {};

  const knownCollections = new Set(
    [...new Set(cards.flatMap((c) => (Array.isArray(c.collections) ? c.collections : [])))]
      .map((x) => String(x || "").trim())
      .filter(Boolean),
  );
  // Extra explicit names that may appear as standalone headings.
  [
    "Солдати Урфіна",
    "Генерали Урфіна",
    "Механісти",
    "Чарівниці",
    "Мирні гноми",
    "Бойові гноми",
    "Люті Берсерки",
    "Мисливці за скарбами",
    "Укротительки драконів",
    "Любителі драконів",
    "Повітряні знаки зодіаку",
    "Земні знаки зодіаку",
    "Вогняні знаки зодіаку",
    "Водні знаки зодіаку",
  ].forEach((x) => knownCollections.add(x));

  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const entries = parseEntriesFromText(sourceText, knownCollections);

  // Build lookups from parsed entries.
  const byCollection = new Map(); // collection -> Map(normalizedTitle -> bio)
  const globalByTitle = new Map(); // normalizedTitle -> bio (first)

  for (const e of entries) {
    const col = String(e.collection || "").trim();
    const titleNorm = normalizeTitle(e.title);
    const bio = String(e.bio || "").trim();
    if (!titleNorm || !bio) continue;

    if (col) {
      if (!byCollection.has(col)) byCollection.set(col, new Map());
      byCollection.get(col).set(titleNorm, bio);
    }
    if (!globalByTitle.has(titleNorm)) globalByTitle.set(titleNorm, bio);
  }

  let updated = 0;
  const missing = [];

  for (const card of cards) {
    const id = String(card.id || "").trim();
    if (!id || id.startsWith("starter_")) continue;

    const title = String(card.title || "").trim();
    const titleNorm = normalizeTitle(title);
    const col = String((Array.isArray(card.collections) && card.collections[0]) || "").trim();

    let bio = "";
    if (col && byCollection.has(col)) bio = String(byCollection.get(col).get(titleNorm) || "").trim();
    if (!bio) bio = String(globalByTitle.get(titleNorm) || "").trim();

    if (!bio) {
      missing.push({ id, title, collection: col });
      continue;
    }

    bioJson.bios[id] = bio;
    updated++;
  }

  fs.writeFileSync(bioPath, JSON.stringify(bioJson, null, 2) + "\n", "utf8");

  console.log(`Parsed entries: ${entries.length}`);
  console.log(`Updated bios: ${updated}`);
  console.log(`Missing bios: ${missing.length}`);
  if (missing.length) {
    for (const m of missing.slice(0, 80)) {
      console.log(`- ${m.id} | ${m.title} | ${m.collection}`);
    }
  }
}

main();

