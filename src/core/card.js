// src/core/card.js - shared card helpers for deck/shop/etc.

export const CARD_BELONGS_TO = {
  deck: "deck",
  shop: "shop",
  player: "player",
  enemy: "enemy",
};

function rootPrefix() {
  const inPages = location.pathname.toLowerCase().includes("/pages/");
  return inPages ? "../../" : "./";
}

function safeString(v, fallback = "") {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

function normTitle(x) {
  return safeString(x, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isSvgPlaceholderArt(x) {
  return safeString(x, "").trim().toLowerCase().startsWith("data:image/svg+xml");
}

function normalizeArtUrl(raw) {
  const s = safeString(raw, "").trim();
  if (!s) return "";
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(s)) return s;
  if (s.startsWith("../../") || s.startsWith("../")) return s;
  if (s.startsWith("./assets/")) return `${rootPrefix()}${s.slice(2)}`;
  if (s.startsWith("assets/")) return `${rootPrefix()}${s}`;
  if (/^[^/\\]+\.(webp|png|jpe?g|gif|svg)$/i.test(s)) return `${rootPrefix()}assets/cards/arts/${s}`;
  return s;
}

function normalizeArtFileName(raw) {
  const s = safeString(raw, "").trim();
  if (!s) return "";
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(s)) return s;
  if (s.startsWith("../../") || s.startsWith("../") || s.startsWith("./assets/") || s.startsWith("assets/")) return s;
  if (!/\.[a-z0-9]+$/i.test(s)) return `${s}.webp`;
  return s;
}

const SOURCE_ART_FILE_BY_ID = Object.freeze({
  source_fire: "istokfire.webp",
  source_water: "istokwater.webp",
  source_air: "istokair.webp",
  source_earth: "istokearth.webp",
  istokfire: "istokfire.webp",
  istokwater: "istokwater.webp",
  istokair: "istokair.webp",
  istokearth: "istokearth.webp",
});

export function artFileFromCardId(cardId) {
  const id = safeString(cardId, "").trim();
  if (!id) return "";
  const mapped = SOURCE_ART_FILE_BY_ID[id.toLowerCase()];
  if (mapped) return mapped;
  return normalizeArtFileName(id);
}

function artUrlFromFile(fileName) {
  const f = normalizeArtFileName(fileName);
  if (!f) return "";
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(f)) return f;
  if (f.startsWith("../../") || f.startsWith("../") || f.startsWith("./assets/") || f.startsWith("assets/")) {
    return normalizeArtUrl(f);
  }
  return `${rootPrefix()}assets/cards/arts/${f}`;
}

export function normalizeElement(x) {
  const s = safeString(x, "").toLowerCase().trim();
  if (["fire", "water", "air", "earth"].includes(s)) return s;
  if (s === "wind") return "air";
  return "";
}

let loadPromise = null;
let metaById = new Map();
let metaByTitleElement = new Map();
let metaByTitle = new Map();
const LEGACY_CARD_ID_ALIASES = {
  elem_01: "elem_flame_spark",
  elem_02: "elem_tide_drop",
  elem_03: "elem_gale_wisp",
  elem_04: "elem_stone_seed",
};

export async function ensureCardCatalogLoaded() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const merged = new Map();

    // Source 1: assets/data/cards.base.json (array)
    try {
      const r = await fetch(`${rootPrefix()}assets/data/cards.base.json`, { cache: "no-store" });
      if (r.ok) {
        const list = await r.json();
        if (Array.isArray(list)) {
          for (const c of list) {
            if (!c || typeof c !== "object") continue;
            const id = safeString(c.id).trim();
            if (!id) continue;
            merged.set(id, {
              id,
              title: safeString(c.name ?? c.title ?? c.id, id),
              element: normalizeElement(c.element) || "earth",
              rarity: safeString(c.rarity ?? ""),
            });
          }
        }
      }
    } catch (e) {
      console.warn("[CardCatalog] cards.base.json load failed", e);
    }

    // Source 2: main cards catalog (data/cards.json).
    const catalogCandidates = ["data/cards.json"];
    let loadedCatalog = false;
    for (const rel of catalogCandidates) {
      try {
        const r = await fetch(`${rootPrefix()}${rel}`, { cache: "no-store" });
        if (!r.ok) continue;
        const json = await r.json();
        const cards = Array.isArray(json?.cards) ? json.cards : [];
        for (const c of cards) {
          if (!c || typeof c !== "object") continue;
          const id = safeString(c.id).trim();
          if (!id) continue;
          const prev = merged.get(id) || { id };
          const legacyArtFile = normalizeArtFileName(c.artFile ?? prev.legacyArtFile ?? prev.artFile ?? "");
          const artFile = artFileFromCardId(id) || legacyArtFile;
          merged.set(id, {
            id,
            title: safeString(c.title ?? c.name ?? prev.title ?? c.id, id),
            element: normalizeElement(c.element) || prev.element || "earth",
            rarity: safeString(c.rarity ?? prev.rarity ?? ""),
            artFile,
            legacyArtFile,
          });
        }
        loadedCatalog = true;
        break;
      } catch (e) {
        console.warn(`[CardCatalog] ${rel} load failed`, e);
      }
    }
    if (!loadedCatalog) {
      console.warn("[CardCatalog] no unified/legacy card catalog loaded");
    }

    const byTitleEl = new Map();
    const byTitle = new Map();
    for (const m of merged.values()) {
      const t = normTitle(m?.title);
      const e = normalizeElement(m?.element) || "";
      if (t) {
        const k = `${t}|${e || "*"}`;
        if (!byTitleEl.has(k)) byTitleEl.set(k, m);
        if (!byTitle.has(t)) byTitle.set(t, m);
      }
    }

    metaById = merged;
    metaByTitleElement = byTitleEl;
    metaByTitle = byTitle;
    return true;
  })();

  return loadPromise;
}

export function getCardMetaById(cardId) {
  const id = safeString(cardId).trim();
  if (!id) return null;
  const direct = metaById.get(id);
  if (direct) return direct;

  const alias = LEGACY_CARD_ID_ALIASES[id];
  if (!alias) return null;
  return metaById.get(alias) || null;
}

function getCardMetaByTitleAndElement(title, element = "") {
  const t = normTitle(title);
  if (!t) return null;
  const el = normalizeElement(element) || "";
  if (el) {
    const exact = metaByTitleElement.get(`${t}|${el}`);
    if (exact) return exact;
  }
  return metaByTitle.get(t) || null;
}

export function resolveCardArt(rawCard) {
  const card = rawCard && typeof rawCard === "object" ? rawCard : {};
  const id = safeString(card.id ?? card.cardId ?? card.card_id ?? "").trim();
  const title = safeString(card.title ?? card.name ?? "", "");
  const element = normalizeElement(card.element);

  const meta = getCardMetaById(id) || getCardMetaByTitleAndElement(title, element);

  const ownArt = normalizeArtUrl(card.art ?? card.image ?? card.img ?? card.cover ?? "");
  const ownArtFile = normalizeArtFileName(safeString(card.artFile ?? "", "").trim());
  const metaArtFile = normalizeArtFileName(safeString(meta?.artFile ?? "", "").trim());
  const metaLegacyArtFile = normalizeArtFileName(safeString(meta?.legacyArtFile ?? "", "").trim());
  const idArtFile = artFileFromCardId(meta?.id || id);
  // Canonical catalog art has priority over persisted per-card art fields.
  const artFile = idArtFile || metaArtFile || metaLegacyArtFile || ownArtFile;
  const byId = artUrlFromFile(idArtFile);
  const byMetaFile = artUrlFromFile(metaArtFile);
  const byMetaLegacy = artUrlFromFile(metaLegacyArtFile);
  const byFile = artUrlFromFile(ownArtFile);
  const usableOwn = ownArt && !isSvgPlaceholderArt(ownArt) ? ownArt : "";

  // If no specific art file is available, fallback to a per-element default
  // (e.g. `fire_001.webp`, `water_001.webp`) so we don't show SVG placeholders.
  const elementDefault = element ? `${rootPrefix()}assets/cards/arts/${element}_001.webp` : "";

  return {
    art: byId || byMetaFile || byMetaLegacy || byFile || usableOwn || elementDefault || "",
    artFile,
    meta,
  };
}

// Decorate any card-like object with `{ id, title, element, belongsTo }` if possible.
export function decorateCard(rawCard, belongsTo = "") {
  const card = rawCard && typeof rawCard === "object" ? { ...rawCard } : {};
  const id = safeString(card.id ?? card.cardId ?? card.card_id ?? "").trim();
  if (id) card.id = id;

  const existingTitle = safeString(card.title ?? card.name ?? "").trim();
  const existingEl = normalizeElement(card.element);
  const meta = (id ? getCardMetaById(id) : null) || getCardMetaByTitleAndElement(existingTitle, existingEl);

  // If meta exists, always prefer it as the canonical title.
  if (meta?.title) card.title = meta.title;
  else if (existingTitle) card.title = existingTitle;
  else card.title = id || "";

  // If meta exists, prefer its element; otherwise keep existing normalized.
  const mEl = normalizeElement(meta?.element);
  if (mEl) card.element = mEl;
  else if (existingEl) card.element = existingEl;

  const artResolved = resolveCardArt(card);
  if (artResolved.art) card.art = artResolved.art;
  if (artResolved.artFile) card.artFile = artResolved.artFile;

  if (belongsTo) card.belongsTo = belongsTo;

  return card;
}
