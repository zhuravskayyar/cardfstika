import "../../src/account.js";

const STORAGE = {
  pityPrefix: "cardastika:shop:pity:",
};

const SHOP_POOL_ROTATION_VERSION = "2026-02-10-v3";

const QUALITY_LABEL = {
  uncommon: "незвичайні",
  rare: "рідкі",
  epic: "епічні",
  legendary: "легендарні",
  mythic: "міфічні",
};

const QUALITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];

const OFFER_VIEW = {
  silver_500: {
    title: "Карти за 500",
    priceLabel: "Купити за 500",
    offerBuyParam: "silver_500",
    oddsRows: [
      { id: "epic", quality: "epic", label: "шанс отримати епічну карту", initialChance: 16 },
      { id: "rare", quality: "rare", label: "шанс отримати рідкісну карту", initialChance: 17.5 },
    ],
    pools: [
      { quality: "epic", count: 8 },
      { quality: "rare", count: 16 },
      { quality: "uncommon", count: 12 },
    ],
  },
  gold_50: {
    title: "Карти за 50",
    priceLabel: "Купити за 50",
    offerBuyParam: "gold_50",
    oddsRows: [
      { id: "mythic", quality: "mythic", label: "шанс отримати міфічну карту", initialChance: 30 },
      { id: "legendary", quality: "legendary", label: "шанс отримати легендарну карту", initialChance: 40 },
    ],
    pools: [
      { quality: "mythic", count: 8 },
      { quality: "legendary", count: 8 },
      { quality: "epic", count: 8 },
    ],
  },
  gold_150: {
    title: "Карти за 150",
    priceLabel: "Купити за 150",
    offerBuyParam: "gold_150",
    oddsRows: [
      { id: "mythic", quality: "mythic", label: "шанс отримати міфічну карту", initialChance: 40 },
    ],
    pools: [
      { quality: "mythic", count: 21 },
      { quality: "legendary", count: 8 },
    ],
  },
};

function getBasePath() {
  return location.pathname.toLowerCase().includes("/pages/") ? "../../" : "./";
}

function asNum(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatPercent(p) {
  const n = asNum(p, 0);
  const fixed = Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${fixed}%`;
}

function pityKey(offerId, tierId) {
  return `${STORAGE.pityPrefix}${offerId}:${tierId}`;
}

function readChance(offerId, tier) {
  const raw = localStorage.getItem(pityKey(offerId, tier.id));
  if (raw != null) return clamp(asNum(raw, 0), 0, 100);
  return clamp(asNum(tier.initialChance ?? 0, 0), 0, 100);
}

function normalizeElement(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (["fire", "water", "air", "earth"].includes(s)) return s;
  if (s === "wind") return "air";
  return "earth";
}

function normalizeQuality(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (QUALITY_ORDER.includes(s)) return s;
  if (s === "rarity-1") return "common";
  if (s === "rarity-2") return "uncommon";
  if (s === "rarity-3") return "rare";
  if (s === "rarity-4") return "epic";
  if (s === "rarity-5") return "legendary";
  if (s === "rarity-6") return "mythic";
  return "common";
}

function qualityRank(q) {
  const idx = QUALITY_ORDER.indexOf(normalizeQuality(q));
  return idx >= 0 ? idx : 0;
}

function normalizeTitle(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function rarityClassFromQuality(q) {
  if (q === "uncommon") return "rarity-2";
  if (q === "rare") return "rarity-3";
  if (q === "epic") return "rarity-4";
  if (q === "legendary") return "rarity-5";
  if (q === "mythic") return "rarity-6";
  return "rarity-1";
}

function weekIndexUtc(date = new Date()) {
  const oneDay = 24 * 60 * 60 * 1000;
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const weekday = (new Date(utc).getUTCDay() + 6) % 7;
  const mondayUtc = utc - weekday * oneDay;
  const epochMondayUtc = Date.UTC(2025, 0, 6);
  return Math.floor((mondayUtc - epochMondayUtc) / (7 * oneDay));
}

function hashStr(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sortForWeek(list, { offerId, quality, week }) {
  const copy = list.slice();
  copy.sort((a, b) => {
    const ha = hashStr(`${SHOP_POOL_ROTATION_VERSION}|${offerId}|${quality}|${week}|${a.id}`);
    const hb = hashStr(`${SHOP_POOL_ROTATION_VERSION}|${offerId}|${quality}|${week}|${b.id}`);
    return ha - hb;
  });
  return copy;
}

function uniqueById(items) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const id = String(item?.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

async function fetchJson(relPath) {
  const r = await fetch(`${getBasePath()}${relPath}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`${relPath} fetch failed: ${r.status}`);
  return r.json();
}

function extractCards(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.cards)) return payload.cards;
  return [];
}

function isShopCollection(col) {
  const source = String(col?.source || "").toLowerCase();
  const link = String(col?.sourceLink || "").toLowerCase();
  return source.includes("shop") || source.includes("крамниц") || source.includes("магаз") || link.includes("/shop/") || link.includes("shop.html");
}

function normalizeCard(raw, fallback = {}) {
  const id = String(raw?.id || fallback.id || "").trim();
  if (!id || id.startsWith("starter_")) return null;

  return {
    id,
    title: String(raw?.title ?? raw?.name ?? fallback.title ?? id).trim() || id,
    element: normalizeElement(raw?.element ?? fallback.element),
    quality: normalizeQuality(raw?.rarity ?? raw?.quality ?? fallback.quality),
    artFile: String(raw?.artFile || fallback.artFile || "").trim(),
  };
}

async function loadPoolCards() {
  const [cardsData, collectionsData] = await Promise.all([
    fetchJson("data/cards.json"),
    fetchJson("data/collections.json").catch(() => ({ collections: [] })),
  ]);

  const byId = new Map();
  const byTitle = new Map();
  for (const raw of extractCards(cardsData)) {
    const card = normalizeCard(raw);
    if (!card) continue;
    byId.set(card.id, card);
    const key = normalizeTitle(card.title);
    if (key && !byTitle.has(key)) byTitle.set(key, card.id);
  }

  const collections = Array.isArray(collectionsData?.collections) ? collectionsData.collections : [];
  const shopCardIds = new Set();

  for (const col of collections) {
    const colCards = Array.isArray(col?.cards) ? col.cards : [];
    const shop = isShopCollection(col);

    for (const raw of colCards) {
      const rawId = String(raw?.id || "").trim();
      if (!rawId) continue;

      const titleKey = normalizeTitle(raw?.title ?? raw?.name ?? rawId);
      const mappedId = byId.has(rawId)
        ? rawId
        : (titleKey && byTitle.has(titleKey) ? byTitle.get(titleKey) : "");

      if (!mappedId || !byId.has(mappedId)) continue;

      const current = byId.get(mappedId);
      const merged = normalizeCard(raw, current);
      if (!merged) continue;

      merged.id = current.id;
      merged.title = current.title || merged.title;
      merged.artFile = current.artFile || merged.artFile;
      if (qualityRank(current.quality) > qualityRank(merged.quality)) merged.quality = current.quality;

      byId.set(mappedId, merged);
      if (shop) shopCardIds.add(mappedId);
    }
  }

  return {
    cards: [...byId.values()],
    shopCardIds,
  };
}

function pickCardsForSection(cards, shopCardIds, offerId, quality, count, usedIds = new Set()) {
  const inTier = uniqueById(cards.filter((c) => c.quality === quality && !usedIds.has(c.id)));
  if (!inTier.length || count <= 0) return [];

  const week = weekIndexUtc(new Date());
  const shopTier = inTier.filter((c) => shopCardIds.has(c.id));
  const extraTier = inTier.filter((c) => !shopCardIds.has(c.id));

  const primary = sortForWeek(shopTier, { offerId, quality, week });
  const secondary = sortForWeek(extraTier, { offerId, quality, week });
  const merged = uniqueById([...primary, ...secondary]);

  return merged.slice(0, Math.min(count, merged.length));
}

function renderOdds(host, offerId, cfg) {
  host.textContent = "";
  for (const row of cfg.oddsRows) {
    const line = document.createElement("div");
    line.className = `shop-pool-odds__row is-${row.quality}`;

    const pct = document.createElement("span");
    pct.className = "shop-pool-odds__pct";
    pct.textContent = formatPercent(readChance(offerId, row));

    const txt = document.createElement("span");
    txt.className = "shop-pool-odds__text";
    txt.textContent = row.label;

    line.append(pct, txt);
    host.appendChild(line);
  }
}

function buildArtCandidates(card) {
  const base = `${getBasePath()}assets/cards/arts/`;
  const out = [];
  const artFile = String(card?.artFile || "").trim();
  const id = String(card?.id || "").trim();

  if (id) out.push(base + `${id}.webp`);
  if (artFile) out.push(base + artFile);

  return [...new Set(out)];
}

function mountArt(imgEl, candidates) {
  let idx = 0;
  const apply = () => {
    if (idx >= candidates.length) {
      imgEl.removeAttribute("src");
      imgEl.classList.add("is-missing-art");
      return;
    }
    imgEl.src = candidates[idx++];
  };

  imgEl.addEventListener("error", apply);
  apply();
}

function renderPoolSections(host, offerId, cfg, cards, shopCardIds, { onCardClick } = {}) {
  host.textContent = "";
  const usedIds = new Set();

  const heading = document.createElement("div");
  heading.className = "shop-pool-now";
  heading.textContent = "Прямо зараз у продажу:";
  host.appendChild(heading);

  for (const sectionCfg of cfg.pools) {
    const section = document.createElement("section");
    section.className = "shop-pool-section";

    const label = document.createElement("h4");
    label.className = `shop-pool-section__title is-${sectionCfg.quality}`;
    label.textContent = QUALITY_LABEL[sectionCfg.quality] || sectionCfg.quality;
    section.appendChild(label);

    const grid = document.createElement("div");
    grid.className = "shop-pool-grid";

    const picked = pickCardsForSection(
      cards,
      shopCardIds,
      offerId,
      sectionCfg.quality,
      Math.max(0, sectionCfg.count),
      usedIds,
    );
    for (const c of picked) usedIds.add(c.id);

    for (const card of picked) {
      const item = document.createElement("article");
      item.className = "shop-pool-card";
      item.title = card.title;
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      item.style.width = "100%";
      item.style.minWidth = "0";

      const art = document.createElement("div");
      art.className = "shop-pool-art";
      art.style.width = "100%";
      art.style.aspectRatio = "1 / 1";
      art.style.overflow = "hidden";
      art.style.position = "relative";

      const slot = document.createElement("div");
      slot.className = `shop-pool-slot ${rarityClassFromQuality(sectionCfg.quality)}`.trim();
      slot.style.position = "absolute";
      slot.style.inset = "0";
      slot.style.display = "block";
      slot.style.width = "100%";
      slot.style.height = "100%";

      const imgEl = document.createElement("img");
      imgEl.alt = card.title;
      imgEl.loading = "lazy";
      imgEl.decoding = "async";
      imgEl.setAttribute("data-card-id", card.id);
      imgEl.style.width = "100%";
      imgEl.style.height = "100%";
      imgEl.style.objectFit = "cover";
      imgEl.style.display = "block";
      mountArt(imgEl, buildArtCandidates(card));

      slot.appendChild(imgEl);
      art.appendChild(slot);
      item.appendChild(art);

      const open = () => {
        if (typeof onCardClick === "function") onCardClick(card);
      };
      item.addEventListener("click", open);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });

      grid.appendChild(item);
    }

    const rem = picked.length % 7;
    if (rem > 0) {
      const startIdx = picked.length - rem;
      const firstLastRow = grid.children[startIdx];
      if (firstLastRow) {
        const startCol = Math.floor((7 - rem) / 2) + 1;
        firstLastRow.style.gridColumnStart = String(startCol);
      }
    }

    section.appendChild(grid);
    host.appendChild(section);
  }
}

function getOfferIdFromUrl() {
  try {
    const u = new URL(location.href);
    const offer = String(u.searchParams.get("offer") || "").trim();
    if (offer in OFFER_VIEW) return offer;
  } catch {
    // ignore
  }
  return "gold_50";
}

async function main() {
  const offerId = getOfferIdFromUrl();
  const cfg = OFFER_VIEW[offerId] || OFFER_VIEW.gold_50;

  const titleEl = document.getElementById("poolTitle");
  if (titleEl) titleEl.textContent = cfg.title;

  const oddsHost = document.getElementById("poolOdds");
  if (oddsHost) renderOdds(oddsHost, offerId, cfg);

  const buyBtn = document.getElementById("poolBuyBtn");
  if (buyBtn) {
    buyBtn.textContent = cfg.priceLabel;
    buyBtn.addEventListener("click", () => {
      location.href = `./shop.html?buy=${encodeURIComponent(cfg.offerBuyParam)}`;
    });
  }

  const { cards, shopCardIds } = await loadPoolCards();

  const host = document.getElementById("poolSections");
  if (host) {
    renderPoolSections(host, offerId, cfg, cards, shopCardIds, {
      onCardClick: (card) => {
        const id = String(card?.id || "").trim();
        if (!id) return;
        location.href = `./shop-card.html?id=${encodeURIComponent(id)}&offer=${encodeURIComponent(offerId)}`;
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  main().catch((err) => {
    console.warn("[shop-pool] init failed", err);
    location.href = "./shop.html";
  });
});
