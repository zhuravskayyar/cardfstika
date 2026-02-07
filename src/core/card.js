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

export function normalizeElement(x) {
  const s = safeString(x, "").toLowerCase().trim();
  if (["fire", "water", "air", "earth"].includes(s)) return s;
  if (s === "wind") return "air";
  return "";
}

let loadPromise = null;
let metaById = new Map();

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
          merged.set(id, {
            id,
            title: safeString(c.title ?? c.name ?? prev.title ?? c.id, id),
            element: normalizeElement(c.element) || prev.element || "earth",
            rarity: safeString(c.rarity ?? prev.rarity ?? ""),
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

    metaById = merged;
    return true;
  })();

  return loadPromise;
}

export function getCardMetaById(cardId) {
  const id = safeString(cardId).trim();
  if (!id) return null;
  return metaById.get(id) || null;
}

// Decorate any card-like object with `{ id, title, element, belongsTo }` if possible.
export function decorateCard(rawCard, belongsTo = "") {
  const card = rawCard && typeof rawCard === "object" ? { ...rawCard } : {};
  const id = safeString(card.id ?? card.cardId ?? card.card_id ?? "").trim();
  if (id) card.id = id;

  const meta = id ? getCardMetaById(id) : null;

  // If meta exists, always prefer it as the canonical title.
  const existingTitle = safeString(card.title ?? card.name ?? "").trim();
  if (meta?.title) card.title = meta.title;
  else if (existingTitle) card.title = existingTitle;

  // If meta exists, prefer its element; otherwise keep existing normalized.
  const mEl = normalizeElement(meta?.element);
  const existingEl = normalizeElement(card.element);
  if (mEl) card.element = mEl;
  else if (existingEl) card.element = existingEl;

  if (belongsTo) card.belongsTo = belongsTo;

  return card;
}
