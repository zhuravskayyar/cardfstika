import "./account.js";
import { buildFoundSet, computeCollectionProgress, loadCollectionsConfigSmart } from "./collections-core.js";

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
  const el = String(element || "").toLowerCase().trim();
  const palette = {
    fire: ["#ff6a4a", "#2a0c05"],
    water: ["#4aa3ff", "#061122"],
    earth: ["#4ee07a", "#05140b"],
    air: ["#f6c35c", "#1a1406"],
  }[el] || ["#8fb6ff", "#0b0b12"];

  const safeTitle = String(title || "").slice(0, 40);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">` +
    `<defs>` +
    `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${palette[0]}"/>` +
    `<stop offset="1" stop-color="${palette[1]}"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="600" height="800" fill="url(#g)"/>` +
    `<circle cx="470" cy="170" r="140" fill="rgba(255,255,255,0.10)"/>` +
    `<circle cx="110" cy="640" r="180" fill="rgba(0,0,0,0.18)"/>` +
    (safeTitle
      ? `<text x="40" y="740" font-size="34" font-family="serif" fill="rgba(255,255,255,0.85)">${escapeXml(
          safeTitle,
        )}</text>`
      : "") +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function qs(name) {
  return new URLSearchParams(location.search).get(name);
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

function setImgWithFallback(img, primaryUrl, { element = "", title = "" } = {}) {
  if (!img) return;
  const fallback = buildPlaceholderArt(element, title);
  img.onerror = () => {
    img.onerror = null;
    img.src = fallback;
  };

  const url = String(primaryUrl || "").trim();
  img.src = url || fallback;
}

function renderGrid(collectionId, cardIds, foundSet, cardMeta = []) {
  const grid = document.getElementById("collectionGrid");
  if (!grid) return;

  grid.innerHTML = "";

  for (let i = 0; i < cardIds.length; i++) {
    const rawId = cardIds[i];
    const id = String(rawId);
    const isFound = foundSet.has(id);
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
  const id = qs("id");
  if (!id) return;

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

  const fixed = collectionsFixed.find((c) => c && c.id === id);
  if (!fixed) {
    console.warn("[collection-open] collection not found:", id);
    setTitle(id);
    return;
  }

  const cardsByIdBase = new Map((cardsBase || []).filter(Boolean).map((c) => [String(c.id), c]));
  const cardsByIdJson = new Map((cardsJson || []).filter(Boolean).map((c) => [String(c.id), c]));

  const foundSet = buildFoundSet();
  setTitle(fixed.title || fixed.id);

  const prog = computeCollectionProgress(fixed, foundSet);
  setText("collectionFound", prog.found);
  setText("collectionTotal", prog.total);

  // Optional extra UI data (if present for this collection)
  const colExtra = openData?.collections?.[id] || null;
  const colRich = Array.isArray(collectionsRich) ? collectionsRich.find((c) => c && c.id === id) : null;

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

    const img = document.querySelector("#collectionArt img");
    if (img) {
      const title = String(uiCol.title || fixed.title || fixed.id);
      img.setAttribute("alt", title);
      setImgWithFallback(img, uiCol.mainArt, { element: uiCol.element || "", title });
    }
  }

  const meta = (fixed.cardIds || []).map((cardId, idx) => {
    const id = String(cardId);

    // Prefer canonical meta from data/cards.json for title/element.
    const j = cardsByIdJson.get(id);
    if (j) {
      const title = j.title || j.name || j.id;
      const element = j.element || "";
      return {
        title: title ? String(title) : "",
        element: element ? String(element) : "",
        art: element ? demoArtForElement(element) : "",
      };
    }

    // Fallback: rich collection card meta by index (if present).
    const richCard = colRich?.cards?.[idx] || null;
    if (richCard) {
      const title = richCard.title || richCard.name || richCard.id || "";
      const element = richCard.element || "";
      return {
        title: title ? String(title) : "",
        element: element ? String(element) : "",
        art: element ? demoArtForElement(element) : "",
      };
    }

    // Legacy fallback: cards.base.json (may not contain ids for new cards).
    const c = cardsByIdBase.get(id);
    if (c) {
      const title = c.name || c.title || c.id;
      const element = c.element || "";
      return {
        title: title ? String(title) : "",
        element: element ? String(element) : "",
        art: element ? demoArtForElement(element) : "",
      };
    }

    return null;
  });

  renderGrid(id, fixed.cardIds || [], foundSet, meta);
});
