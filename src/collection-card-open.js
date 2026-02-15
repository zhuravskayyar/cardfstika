// src/collection-card-open.js — separate card view for collection (not the deck screen)
import "./account.js";
import { buildFoundMatcher } from "./collections-core.js";
import { fixMojibake } from "./core/mojibake.js";

const LEGACY_CARD_ID_ALIASES = {
  elem_01: "elem_flame_spark",
  elem_02: "elem_tide_drop",
  elem_03: "elem_gale_wisp",
  elem_04: "elem_stone_seed",
  battle_elem_01: "war_elem_flamebrand",
  battle_elem_02: "war_elem_tidehammer",
  battle_elem_03: "war_elem_stormclaw",
  battle_elem_04: "war_elem_rockfist",
};

function $(id) {
  return document.getElementById(id);
}

function getPath(path) {
  const isInPages = location.pathname.toLowerCase().includes("/pages/");
  return isInPages ? `../../${path}` : `./${path}`;
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = String(value);
}

function normalizeBioText(raw) {
  const s = String(raw ?? "")
    .replaceAll("\r\n", "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+[-–—]\s+/g, " — ")
    .trim();
  return s;
}

function renderBioText(el, raw, { isFound } = {}) {
  if (!el) return;
  const normalized = normalizeBioText(raw);
  el.textContent = "";

  if (!normalized) {
    const p = document.createElement("p");
    p.className = `card-bio__p ${isFound ? "is-muted" : ""}`.trim();
    p.textContent = isFound ? "Опис ще не додано." : "Цю карту ще не знайдено. Відкрий її в пригодах або в крамниці.";
    el.appendChild(p);
    return;
  }

  const parts = normalized.split(/\n\s*\n/g).map((x) => x.trim()).filter(Boolean);
  for (const part of parts.length ? parts : [normalized]) {
    const p = document.createElement("p");
    p.className = "card-bio__p";
    p.textContent = part;
    el.appendChild(p);
  }
}

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeRarityClass(raw) {
  if (!raw) return "";
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const n = Math.max(1, Math.min(6, Math.round(raw)));
    return `rarity-${n}`;
  }
  const s = String(raw).toLowerCase().trim();
  if (/^rarity-[1-6]$/.test(s)) return s;
  if (s === "common") return "rarity-1";
  if (s === "uncommon") return "rarity-2";
  if (s === "rare") return "rarity-3";
  if (s === "epic") return "rarity-4";
  if (s === "legendary") return "rarity-5";
  if (s === "mythic") return "rarity-6";
  return "";
}

async function tryFetchJson(path, { noStore = false } = {}) {
  const url = getPath(path);
  const r = await fetch(url, { cache: noStore ? "no-store" : "default" });
  if (!r.ok) throw new Error(`${path} fetch failed: ${r.status}`);
  return r.json();
}

let cardBioMapCache = null;
let titleBioMapCache = null;
async function loadCardBioMap() {
  if (cardBioMapCache) return cardBioMapCache;
  try {
    const json = await tryFetchJson("data/card-bio.json", { noStore: true });
    const bios = json && typeof json === "object" && json.bios && typeof json.bios === "object" ? json.bios : {};
    cardBioMapCache = bios;
    return bios;
  } catch (err) {
    console.warn("[collection-card-open] card-bio.json unavailable", err);
    cardBioMapCache = {};
    return cardBioMapCache;
  }
}

function normTitle(s) {
  return fixMojibake(String(s || ""))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeElement(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "wind") return "air";
  if (s === "fire" || s === "water" || s === "air" || s === "earth") return s;
  return "";
}

function normalizeArtUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(s)) return s;
  if (s.startsWith("../../") || s.startsWith("../")) return s;
  if (s.startsWith("./assets/")) return getPath(s.slice(2));
  if (s.startsWith("assets/")) return getPath(s);
  return s;
}

function normalizeArtFileName(rawFile) {
  const s = String(rawFile || "").trim();
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

function artFileFromCardId(cardId) {
  const id = String(cardId || "").trim();
  if (!id) return "";
  const mapped = SOURCE_ART_FILE_BY_ID[id.toLowerCase()];
  if (mapped) return mapped;
  return normalizeArtFileName(id);
}

function artUrlFromFileLike(rawFile) {
  const f = normalizeArtFileName(rawFile);
  if (!f) return "";
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(f)) return f;
  if (f.startsWith("../../") || f.startsWith("../") || f.startsWith("./assets/") || f.startsWith("assets/")) {
    return normalizeArtUrl(f);
  }
  return getPath(`assets/cards/arts/${f}`);
}

function resolveCardArtUrl(cardLike, metaLike = null) {
  const card = cardLike && typeof cardLike === "object" ? cardLike : null;
  const meta = metaLike && typeof metaLike === "object" ? metaLike : null;
  if (!card && !meta) return "";

  const id = String(meta?.id || card?.id || card?.cardId || card?.card_id || "").trim();
  const byId = artUrlFromFileLike(artFileFromCardId(id));
  const byMetaFile = artUrlFromFileLike(meta?.artFile || "");
  const byCardFile = artUrlFromFileLike(card?.artFile || "");
  const byCardArt = normalizeArtUrl(card?.art || card?.image || card?.img || card?.cover || "");
  const byMetaArt = normalizeArtUrl(meta?.art || meta?.image || meta?.img || meta?.cover || "");

  return byId || byMetaFile || byCardFile || byCardArt || byMetaArt || "";
}

async function loadTitleBioMap() {
  if (titleBioMapCache) return titleBioMapCache;

  const bios = await loadCardBioMap();
  const byTitle = new Map();

  const attach = (id, title) => {
    const bio = bios?.[String(id)];
    if (!bio) return;
    const key = normTitle(title);
    if (!key) return;
    if (!byTitle.has(key)) byTitle.set(key, String(bio));
  };

  // Source A: collections.json cards (authoritative for collection pages)
  try {
    const collections = await loadCollectionsRich();
    for (const col of collections || []) {
      const cards = Array.isArray(col?.cards) ? col.cards : [];
      for (const c of cards) attach(c?.id, c?.title ?? c?.name ?? c?.id);
    }
  } catch (err) {
    console.warn("[collection-card-open] collections.json for bio index failed", err);
  }

  // Source B: cards catalog (cards.json) — helps when ids differ but titles match.
  try {
    const cards = await loadCardCatalog();
    for (const c of cards || []) attach(c?.id, c?.title ?? c?.name ?? c?.id);
  } catch (err) {
    console.warn("[collection-card-open] cards catalog for bio index failed", err);
  }

  titleBioMapCache = byTitle;
  return byTitle;
}

let cardCatalogCache = null;
async function loadCardCatalog() {
  if (cardCatalogCache) return cardCatalogCache;
  const candidates = ["data/cards.json"];
  const merged = [];
  const seen = new Set();
  for (const p of candidates) {
    try {
      const json = await tryFetchJson(p, { noStore: true });
      const cards = Array.isArray(json?.cards) ? json.cards.filter(Boolean) : null;
      if (cards) {
        for (const card of cards) {
          const id = String(card?.id ?? "").trim();
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push(card);
        }
      }
    } catch (err) {
      console.warn("[collection-card-open] cards catalog unavailable", err);
    }
  }
  cardCatalogCache = merged;
  return cardCatalogCache;
}

let collectionsRichCache = null;
async function loadCollectionsRich() {
  if (collectionsRichCache) return collectionsRichCache;
  const json = await tryFetchJson("data/collections.json");
  const collections = json && Array.isArray(json.collections) ? json.collections : [];
  collectionsRichCache = collections;
  return collections;
}

async function loadCardFromBase(id) {
  try {
    const list = await tryFetchJson("assets/data/cards.base.json");
    if (!Array.isArray(list)) return null;
    const raw = list.find((c) => c && String(c.id) === String(id));
    if (!raw) return null;
    const power = Number(raw.power ?? raw.basePower ?? 0);
    const art = resolveCardArtUrl(raw);
    return {
      id: String(raw.id ?? ""),
      title: String(raw.name ?? raw.title ?? raw.id ?? "Карта"),
      power: Number.isFinite(power) ? power : 0,
      level: Number(raw.level ?? 1) || 1,
      element: String(raw.element ?? "earth"),
      rarity: normalizeRarityClass(raw.rarity),
      art,
      bio: String(raw.bio ?? "").trim(),
    };
  } catch {
    return null;
  }
}

async function loadCardFromCatalog(id) {
  const cards = await loadCardCatalog();
  const raw = cards.find((c) => c && String(c.id) === String(id));
  if (!raw) return null;
  const power = Number(raw.power ?? raw.basePower ?? 0);
  const art = resolveCardArtUrl(raw);
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? raw.name ?? raw.id ?? "Карта"),
    power: Number.isFinite(power) ? power : 0,
    level: Number(raw.level ?? 1) || 1,
    element: String(raw.element ?? "earth"),
    rarity: normalizeRarityClass(raw.rarity),
    art,
    bio: String(raw.bio ?? "").trim(),
  };
}

async function loadCardFromCollectionsRichById(id) {
  const collections = await loadCollectionsRich();
  const want = String(id);
  for (const col of collections) {
    const cards = Array.isArray(col?.cards) ? col.cards : [];
    const raw = cards.find((c) => c && String(c.id) === want);
    if (!raw) continue;
    const power = Number(raw.power ?? raw.basePower ?? 0);
    const art = resolveCardArtUrl(raw);
    return {
      id: String(raw.id ?? ""),
      title: String(raw.title ?? raw.name ?? raw.id ?? "Карта"),
      power: Number.isFinite(power) ? power : 0,
      level: Number(raw.level ?? 1) || 1,
      element: String(raw.element ?? "earth"),
      rarity: normalizeRarityClass(raw.rarity),
      art,
      bio: String(raw.bio ?? "").trim(),
    };
  }
  return null;
}

function applyElementRarity(card) {
  const frame = $("cardFrame");
  if (frame) {
    frame.classList.remove(
      "elem-fire",
      "elem-water",
      "elem-earth",
      "elem-air",
      "rarity-1",
      "rarity-2",
      "rarity-3",
      "rarity-4",
      "rarity-5",
      "rarity-6",
    );
    frame.classList.add("card-frame", "elem-" + (card.element || "earth"));
    if (card.rarity) frame.classList.add(card.rarity);
  }

  const titleElem = $("cardTitleElem");
  if (titleElem) {
    titleElem.classList.remove("elem-fire", "elem-water", "elem-earth", "elem-air");
    titleElem.classList.add("card-titlebar__elem", "elem-" + (card.element || "earth"));
  }

  const titlebar = titleElem?.closest(".card-titlebar");
  if (titlebar) {
    titlebar.classList.remove("elem-fire", "elem-water", "elem-earth", "elem-air");
    titlebar.classList.add("elem-" + (card.element || "earth"));
  }
}

function applyArt(card) {
  const art = $("cardArt");
  if (!art) return;
  const url = resolveCardArtUrl(card);
  art.style.backgroundImage = url ? `url('${url}')` : "";
}

async function findCatalogMetaForCard({ id = "", title = "", element = "" } = {}) {
  const cards = await loadCardCatalog();
  const byId = new Map((cards || []).filter(Boolean).map((c) => [String(c.id || ""), c]));

  const cardId = String(id || "").trim();
  const aliasId = LEGACY_CARD_ID_ALIASES[cardId] || "";
  if (cardId && byId.has(cardId)) return byId.get(cardId);
  if (aliasId && byId.has(aliasId)) return byId.get(aliasId);

  const t = normTitle(title);
  const e = normalizeElement(element);
  if (!t) return null;
  for (const c of cards || []) {
    if (!c) continue;
    const ct = normTitle(c.title || c.name || c.id || "");
    if (!ct || ct !== t) continue;
    const ce = normalizeElement(c.element || "");
    if (!e || !ce || ce === e) return c;
  }
  return null;
}

function parseCollectionIndexFromCardId(id) {
  const m = String(id || "").match(/^(.*)_([0-9]{2})$/);
  if (!m) return null;
  const idx = Number(m[2]);
  if (!Number.isInteger(idx) || idx < 1) return null;
  return { collectionId: m[1], index: idx };
}

async function loadCardFromCollectionsRichByCollectionIndex(collectionId, cardId) {
  const parsed = parseCollectionIndexFromCardId(cardId);
  if (!parsed) return null;
  const colId = String(collectionId || "").trim();
  if (!colId || parsed.collectionId !== colId) return null;

  const collections = await loadCollectionsRich();
  const col = (collections || []).find((c) => c && String(c.id || "") === colId);
  if (!col) return null;

  const raw = Array.isArray(col.cards) ? col.cards[parsed.index - 1] : null;
  if (!raw) return null;

  const power = Number(raw.power ?? raw.basePower ?? 0);
  const art = resolveCardArtUrl(raw);
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? raw.name ?? raw.id ?? "Карта"),
    power: Number.isFinite(power) ? power : 0,
    level: Number(raw.level ?? 1) || 1,
    element: String(raw.element ?? "earth"),
    rarity: normalizeRarityClass(raw.rarity),
    art,
    bio: String(raw.bio ?? "").trim(),
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  const cardId = qs("id") || qs("card") || "";
  const collectionId = qs("collection") || qs("col") || "";

  if (!cardId) {
    console.warn("[collection-card-open] missing card id");
    return;
  }

  const back = $("backToCollection");
  if (back) {
    back.setAttribute(
      "href",
      collectionId ? `collection-open.html?id=${encodeURIComponent(collectionId)}` : "collections.html",
    );
  }

  const foundMatcher = buildFoundMatcher();
  let isFound = foundMatcher.hasId(String(cardId));

  let card =
    (await loadCardFromCatalog(cardId).catch(() => null)) ||
    (await loadCardFromCollectionsRichByCollectionIndex(collectionId, cardId).catch(() => null)) ||
    (await loadCardFromCollectionsRichById(cardId).catch(() => null)) ||
    (await loadCardFromBase(cardId).catch(() => null));

  if (!card) {
    card = {
      id: String(cardId),
      title: String(cardId),
      power: 0,
      level: 1,
      element: "earth",
      rarity: "rarity-1",
      art: "",
      bio: "",
    };
  }

  try {
    const meta = await findCatalogMetaForCard({
      id: card?.id || cardId,
      title: card?.title || "",
      element: card?.element || "",
    });
    if (meta) {
      if (meta.id) card.catalogId = String(meta.id);
      if (meta.title || meta.name) card.title = String(meta.title || meta.name || card.title || card.id || "");
      if (meta.element) card.element = String(meta.element);
      if (meta.rarity && !card.rarity) card.rarity = normalizeRarityClass(meta.rarity);

      const metaArt = resolveCardArtUrl(card, meta);
      if (metaArt) card.art = metaArt;

      if (meta.bio && !card.bio) card.bio = String(meta.bio);
    }
  } catch (e) {
    console.warn("[collection-card-open] failed to apply catalog meta", e);
  }

  if (!isFound && card?.catalogId) isFound = foundMatcher.hasId(card.catalogId);
  if (!isFound) isFound = foundMatcher.hasCard(card);

  if (card?.id) {
    try {
      const bios = await loadCardBioMap();
      const b = bios?.[String(card.id)];
      if (b && !card.bio) card.bio = String(b);

      if (!card.bio && card.title) {
        const byTitle = await loadTitleBioMap();
        const tBio = byTitle.get(normTitle(card.title));
        if (tBio) card.bio = String(tBio);
      }
    } catch {
      // ignore
    }
  }

  if (card?.title) document.title = `${String(card.title)} — Cardastika`;
  setText("cardTitle", card.title || "Карта");
  applyElementRarity(card);
  applyArt(card);

  const frame = $("cardFrame");
  const art = $("cardArt");
  if (frame) frame.classList.toggle("is-locked", !isFound);
  if (art) art.classList.toggle("is-locked", !isFound);

  const bioWrap = $("cardBioWrap");
  const bioEl = $("cardBio");
  if (bioEl) {
    renderBioText(bioEl, card?.bio || "", { isFound });
    if (bioWrap) bioWrap.style.display = "";
  }
});


