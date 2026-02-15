import "./account.js";
import { buildFoundMatcher, loadCollectionsConfigSmart } from "./collections-core.js";
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

function getPath(path) {
  const isInPages = location.pathname.toLowerCase().includes("/pages/");
  return isInPages ? `../../${path}` : `./${path}`;
}

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildPlaceholderArt(element, title = "") {
  // Placeholders are removed — return empty string so no placeholder image is used.
  return "";
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

function normalizeLooseCollectionId(raw) {
  return String(raw || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

async function loadCardsJson() {
  const url = getPath("data/cards.json");
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`cards.json fetch failed: ${r.status}`);
  const json = await r.json();
  const cards = Array.isArray(json?.cards) ? json.cards : [];
  return cards.filter(Boolean);
}

async function loadCardsBase() {
  const url = getPath("assets/data/cards.base.json");
  const r = await fetch(url);
  if (!r.ok) throw new Error(`cards base fetch failed: ${r.status}`);
  const json = await r.json();

  if (!Array.isArray(json)) throw new Error("cards base must be an array");
  return json;
}

function setTitle(text) {
  const el = document.getElementById("collectionTitle");
  if (el) el.textContent = String(text);
}

async function loadCollectionOpenData() {
  const url = getPath("data/collection-open-data.json");
  const r = await fetch(url);
  if (!r.ok) throw new Error(`collection-open-data fetch failed: ${r.status}`);
  const json = await r.json();
  if (!json || typeof json !== "object") throw new Error("collection-open-data must be an object");
  return json;
}

async function loadCollectionsRich() {
  const url = getPath("data/collections.json");
  const r = await fetch(url);
  if (!r.ok) throw new Error(`collections rich fetch failed: ${r.status}`);
  const json = await r.json();
  const collections = json && Array.isArray(json.collections) ? json.collections : null;
  if (!collections) throw new Error("collections rich must be { collections: [] }");
  return collections;
}

function demoArtForElement(element) {
  return buildPlaceholderArt(element);
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

function normTitle(x) {
  return fixMojibake(String(x || "")).toLowerCase().replace(/\s+/g, " ").trim();
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

function setImgWithFallback(img, primaryUrl, { element = "", title = "" } = {}) {
  if (!img) return;
  const fallback = buildPlaceholderArt(element, title) || "";
  img.onerror = () => {
    img.onerror = null;
    if (fallback) img.src = fallback;
    else img.removeAttribute('src');
  };

  const url = String(primaryUrl || "").trim();
  if (url) img.src = url;
  else if (fallback) img.src = fallback;
  else img.removeAttribute('src');
}

function renderGrid(collectionId, cardIds, isFoundAtIndex, cardMeta = []) {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;

  grid.innerHTML = "";

  for (let i = 0; i < cardIds.length; i++) {
    const rawId = cardIds[i];
    const id = String(rawId);
    const isFound = typeof isFoundAtIndex === "function" ? !!isFoundAtIndex(i) : false;
    const meta = cardMeta[i] || null;

    const a = document.createElement("a");
    a.href = `collection-card.html?collection=${encodeURIComponent(collectionId || "")}&id=${encodeURIComponent(id)}`;
    a.className = `collection-open-card ${isFound ? "is-found" : "is-locked"}`;
    a.dataset.cardId = id;
    if (meta?.title) a.title = String(meta.title);

    const art = document.createElement("div");
    art.className = "collection-open-card__art";
    const artUrl = meta?.art || (meta?.element ? demoArtForElement(meta.element) : "");
    if (artUrl) art.style.backgroundImage = `url('${artUrl}')`;
    a.appendChild(art);

    grid.appendChild(a);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const requestedId = qs("id");
  if (!requestedId) return;

  let collectionsFixed;
  let cardsBase;
  let cardsJson;
  let openData;
  let collectionsRich;
  try {
    [collectionsFixed, cardsBase, cardsJson, openData, collectionsRich] = await Promise.all([
      loadCollectionsConfigSmart(),
      loadCardsBase(),
      loadCardsJson().catch((err) => {
        console.warn("[collection-open] cards.json unavailable", err);
        return [];
      }),
      loadCollectionOpenData().catch((err) => {
        console.warn("[collection-open] collection-open-data unavailable", err);
        return null;
      }),
      loadCollectionsRich().catch((err) => {
        console.warn("[collection-open] collections rich unavailable", err);
        return null;
      }),
    ]);
  } catch (err) {
    console.error("[collection-open] failed to load config", err);
    return;
  }

  let collectionId = requestedId;
  let fixed = collectionsFixed.find((c) => c && c.id === collectionId);
  if (!fixed) {
    const requestedLoose = normalizeLooseCollectionId(requestedId);
    if (requestedLoose) {
      fixed = collectionsFixed.find((c) => normalizeLooseCollectionId(c?.id) === requestedLoose) || null;
      if (fixed?.id) collectionId = String(fixed.id);
    }
  }

  if (!fixed) {
    console.warn("[collection-open] collection not found:", requestedId);
    setTitle(requestedId);
    return;
  }

  const cardsByIdBase = new Map((cardsBase || []).filter(Boolean).map((c) => [String(c.id), c]));
  const cardsByIdJson = new Map((cardsJson || []).filter(Boolean).map((c) => [String(c.id), c]));
  const cardsByTitleElementJson = new Map();
  const addTitleElementKey = (titleRaw, elementRaw, card) => {
    const t = normTitle(titleRaw || "");
    const e = String(elementRaw || "").toLowerCase().trim();
    if (!t) return;
    const key = `${t}|${e || "*"}`;
    if (!cardsByTitleElementJson.has(key)) cardsByTitleElementJson.set(key, card);
  };
  for (const c of (cardsJson || []).filter(Boolean)) {
    addTitleElementKey(c?.title || c?.name || c?.id || "", c?.element || "", c);
    // Extra key for un-fixed mojibake strings (defensive against mixed-encoding sources).
    const rawTitle = String(c?.title || c?.name || c?.id || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (rawTitle) {
      const e = String(c?.element || "").toLowerCase().trim();
      const rawKey = `${rawTitle}|${e || "*"}`;
      if (!cardsByTitleElementJson.has(rawKey)) cardsByTitleElementJson.set(rawKey, c);
    }
  }

  const foundMatcher = buildFoundMatcher();
  setTitle(fixed.title || fixed.id);

  // Optional extra UI data (if present for this collection)
  const colExtra = openData?.collections?.[collectionId] || null;
  const colRich = Array.isArray(collectionsRich) ? collectionsRich.find((c) => c && c.id === collectionId) : null;
  const extraCardsById = new Map(
    (Array.isArray(colExtra?.cards) ? colExtra.cards : [])
      .filter(Boolean)
      .map((c) => [String(c.id || ""), c]),
  );

  // Prefer rich dataset, fallback to collection-open-data, else keep static HTML defaults.
  const uiCol = colRich || colExtra;

  if (uiCol) {
    if (uiCol.title) setTitle(uiCol.title);
    const bonusDesc = document.querySelector(".collection-open-bonus__desc");
    if (bonusDesc && uiCol.bonus) bonusDesc.textContent = String(uiCol.bonus);

    const sourceLinkEl = document.querySelector(".collection-open-source__link");
    if (sourceLinkEl && uiCol.source) {
      sourceLinkEl.textContent = String(uiCol.source);
      if (uiCol.sourceLink) sourceLinkEl.setAttribute("href", String(uiCol.sourceLink));
    }
  }

  const meta = (fixed.cardIds || []).map((cardId, idx) => {
    const id = String(cardId || "");
    const aliasId = LEGACY_CARD_ID_ALIASES[id] || "";
    const richCard = colRich?.cards?.[idx] || null;
    const richTitle = String(richCard?.title || richCard?.name || "").trim();
    const richElement = String(richCard?.element || "").toLowerCase().trim();

    // Prefer canonical meta from data/cards.json for title/element/art.
    let j = cardsByIdJson.get(id) || (aliasId ? cardsByIdJson.get(aliasId) : null) || null;
    if (!j && richTitle) {
      const exact = cardsByTitleElementJson.get(`${normTitle(richTitle)}|${richElement || "*"}`);
      const byAnyElement = cardsByTitleElementJson.get(`${normTitle(richTitle)}|*`);
      j = exact || byAnyElement || null;
    }
    if (j) {
      const title = j.title || j.name || j.id;
      const element = j.element || "";
      const art = resolveCardArtUrl(j) || (element ? demoArtForElement(element) : "");
      return {
        title: title ? String(title) : "",
        element: element ? String(element) : "",
        art,
      };
    }

    // Fallback: rich collection card meta by index (if present).
    if (richCard) {
      const title = richCard.title || richCard.name || richCard.id || "";
      const element = richCard.element || "";
      const extraCardById = extraCardsById.get(id) || (aliasId ? extraCardsById.get(aliasId) : null) || null;
      const art = resolveCardArtUrl(richCard) || resolveCardArtUrl(extraCardById) || (element ? demoArtForElement(element) : "");
      return {
        title: title ? String(title) : "",
        element: element ? String(element) : "",
        art,
      };
    }

    // Legacy fallback: cards.base.json (may not contain ids for new cards).
    const c = cardsByIdBase.get(id) || (aliasId ? cardsByIdBase.get(aliasId) : null) || null;
    if (c) {
      const title = c.name || c.title || c.id;
      const element = c.element || "";
      const art = resolveCardArtUrl(c) || (element ? demoArtForElement(element) : "");
      return {
        title: title ? String(title) : "",
        element: element ? String(element) : "",
        art,
      };
    }

    const extraCardById = extraCardsById.get(id) || (aliasId ? extraCardsById.get(aliasId) : null) || null;
    if (extraCardById) {
      const title = extraCardById.title || extraCardById.name || extraCardById.id || "";
      const element = extraCardById.element || "";
      const art = resolveCardArtUrl(extraCardById) || (element ? demoArtForElement(element) : "");
      return {
        title: title ? String(title) : "",
        element: element ? String(element) : "",
        art,
      };
    }

    return null;
  });

  const img = document.querySelector("#collectionArt img");
  if (img) {
    const title = String(uiCol?.title || fixed.title || fixed.id);
    const fromCollectionCards = (meta || []).find((m) => m && String(m.art || "").trim())?.art || "";
    const preferredArt = fromCollectionCards || uiCol?.mainArt || "";
    img.setAttribute("alt", title);
    setImgWithFallback(img, preferredArt, { element: uiCol?.element || "", title });
  }

  const cardIds = fixed.cardIds || [];
  const foundFlags = cardIds.map((cardId, idx) => {
    const rawId = String(cardId || "");
    if (foundMatcher.hasId(rawId)) return true;
    const aliasId = LEGACY_CARD_ID_ALIASES[rawId] || "";
    if (aliasId && foundMatcher.hasId(aliasId)) return true;

    const richCard = colRich?.cards?.[idx] || null;
    const extraCard = extraCardsById.get(rawId) || (aliasId ? extraCardsById.get(aliasId) : null) || null;
    const m = meta[idx] || null;
    return foundMatcher.hasCard({
      id: rawId,
      title: m?.title || richCard?.title || extraCard?.title || "",
      element: m?.element || richCard?.element || extraCard?.element || "",
    });
  });

  setText("collectionFound", foundFlags.filter(Boolean).length);
  setText("collectionTotal", cardIds.length);

  renderGrid(collectionId, cardIds, (idx) => !!foundFlags[idx], meta);
});
