import { buildFoundSet, computeCollectionProgress, loadCollectionsConfigSmart } from "../../src/collections-core.js";

const TRANSLIT_MAP = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ю: "yu", я: "ya", ь: "", "'": "", "’": "",
};

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

function slugify(text) {
  const lower = String(text || "").trim().toLowerCase();
  let out = "";

  for (const ch of lower) {
    if (Object.prototype.hasOwnProperty.call(TRANSLIT_MAP, ch)) out += TRANSLIT_MAP[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/\s|[-_]/.test(ch)) out += "-";
    else out += "-";
  }

  out = out.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return out || "collection";
}

function normalizeTitleKey(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function parseTotalFromCount(text) {
  const s = String(text || "");
  const m = s.match(/(?:з|із)\s*(\d+)/i);
  return m ? Number(m[1]) : 0;
}

function ensureCollectionId(cardEl) {
  const explicit = cardEl.dataset.collectionId?.trim();
  if (explicit) return explicit;

  const title = cardEl.querySelector(".collection-card__title")?.textContent?.trim() || "";
  const id = slugify(title);
  cardEl.dataset.collectionId = id;
  return id;
}

function ensureCollectionHref(cardEl, id) {
  cardEl.setAttribute("href", `collection-open.html?id=${encodeURIComponent(id)}`);
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

function artUrlFromFileLike(rawFile) {
  const f = normalizeArtFileName(rawFile);
  if (!f) return "";
  if (/^(data:|blob:|https?:\/\/|\/)/i.test(f)) return f;
  if (f.startsWith("../../") || f.startsWith("../") || f.startsWith("./assets/") || f.startsWith("assets/")) {
    return normalizeArtUrl(f);
  }
  return getPath(`assets/cards/arts/${f}`);
}

function resolveCardArtCandidates(cardLike) {
  const card = cardLike && typeof cardLike === "object" ? cardLike : null;
  if (!card) return [];

  const id = String(card.id || card.cardId || card.card_id || "").trim();
  const byId = artUrlFromFileLike(id);
  const byCardFile = artUrlFromFileLike(card.artFile || "");
  const byCardArt = normalizeArtUrl(card.art || card.image || card.img || card.cover || "");

  return [byId, byCardFile, byCardArt].filter(Boolean);
}

async function loadCardsJson() {
  const url = getPath("data/cards.json");
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`cards.json fetch failed: ${r.status}`);
  const json = await r.json();
  const cards = Array.isArray(json?.cards) ? json.cards : [];
  return cards.filter(Boolean);
}

async function loadCollectionsRich() {
  const url = getPath("data/collections.json");
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`collections.json fetch failed: ${r.status}`);
  const json = await r.json();
  const list = Array.isArray(json?.collections) ? json.collections : [];
  return list.filter(Boolean);
}

class CollectionsScreen {
  constructor() {
    this.collections = [];
    this.cardsById = new Map();
    this.collectionsRichById = new Map();
    this.imageCheckCache = new Map();
    this.init();
  }

  async init() {
    await Promise.all([this.loadCollectionsConfig(), this.loadCollectionArtSources()]);
    this.normalizeCollectionCards();
    this.applyProgressToGrid();
    await this.applyCollectionPreviewArt();
    this.setupEventListeners();
  }

  async loadCollectionsConfig() {
    try {
      const json = await loadCollectionsConfigSmart();
      this.collections = Array.isArray(json) ? json : [];
      return;
    } catch {
      // Fallback: derive from HTML (keeps page usable even if JSON not available)
      this.collections = [];
      document.querySelectorAll(".collection-card").forEach((a) => {
        const id = ensureCollectionId(a);
        const title = a.querySelector(".collection-card__title")?.textContent?.trim() || id;
        const total = parseTotalFromCount(a.querySelector(".collection-card__count")?.textContent);
        const cardIds = Array.from({ length: Math.max(0, total) }, (_, idx) => {
          const num = String(idx + 1).padStart(2, "0");
          return `${id}_${num}`;
        });
        this.collections.push({ id, title, cardIds });
      });
    }
  }

  normalizeCollectionCards() {
    const known = new Map((this.collections || []).map((c) => [c.id, c]));
    const knownIdByTitle = new Map(
      (this.collections || [])
        .filter((c) => c && c.id && c.title)
        .map((c) => [normalizeTitleKey(c.title), c.id]),
    );

    document.querySelectorAll(".collection-card").forEach((card) => {
      const explicit = card.dataset.collectionId?.trim();
      let id = explicit || "";
      if (!id) {
        const title = card.querySelector(".collection-card__title")?.textContent?.trim() || "";
        id = knownIdByTitle.get(normalizeTitleKey(title)) || slugify(title);
        card.dataset.collectionId = id;
      }
      if (!known.has(id)) {
        const title = card.querySelector(".collection-card__title")?.textContent?.trim() || id;
        known.set(id, { id, title, cardIds: [] });
      }
      ensureCollectionHref(card, id);
    });
  }

  async loadCollectionArtSources() {
    const [cards, richCollections] = await Promise.all([
      loadCardsJson().catch((err) => {
        console.warn("[collections] cards.json unavailable for collection preview art", err);
        return [];
      }),
      loadCollectionsRich().catch((err) => {
        console.warn("[collections] collections.json unavailable for collection preview art", err);
        return [];
      }),
    ]);

    this.cardsById = new Map((cards || []).map((c) => [String(c?.id || "").trim(), c]).filter(([id]) => id));
    this.collectionsRichById = new Map((richCollections || []).map((c) => [String(c?.id || "").trim(), c]).filter(([id]) => id));
  }

  pickCollectionPreviewCandidates(collectionId, def) {
    const safeId = String(collectionId || "").trim();
    const rich = this.collectionsRichById.get(safeId) || null;
    const candidates = [];

    const ids = [];
    for (const id of Array.isArray(def?.cardIds) ? def.cardIds : []) {
      const raw = String(id || "").trim();
      if (!raw) continue;
      ids.push(raw);
      const alias = LEGACY_CARD_ID_ALIASES[raw];
      if (alias) ids.push(alias);
    }
    for (const card of Array.isArray(rich?.cards) ? rich.cards : []) {
      const raw = String(card?.id || "").trim();
      if (!raw) continue;
      ids.push(raw);
      const alias = LEGACY_CARD_ID_ALIASES[raw];
      if (alias) ids.push(alias);
    }

    const uniqueIds = Array.from(new Set(ids));
    for (const id of uniqueIds) {
      const card = this.cardsById.get(id);
      if (!card) continue;
      candidates.push(...resolveCardArtCandidates(card));
    }

    for (const card of Array.isArray(rich?.cards) ? rich.cards : []) {
      candidates.push(...resolveCardArtCandidates(card));
    }

    const richMainArt = normalizeArtUrl(rich?.mainArt || "");
    if (richMainArt) candidates.push(richMainArt);

    if (uniqueIds.length > 0) {
      const byIdFallback = artUrlFromFileLike(uniqueIds[0]);
      if (byIdFallback) candidates.push(byIdFallback);
    }

    return Array.from(new Set(candidates.map((x) => String(x || "").trim()).filter(Boolean)));
  }

  canLoadImage(url) {
    const key = String(url || "").trim();
    if (!key) return Promise.resolve(false);
    if (this.imageCheckCache.has(key)) return this.imageCheckCache.get(key);

    const check = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = key;
    });
    this.imageCheckCache.set(key, check);
    return check;
  }

  async pickFirstLoadableArt(candidates = []) {
    for (const url of candidates) {
      if (await this.canLoadImage(url)) return url;
    }
    return "";
  }

  async applyCollectionPreviewArt() {
    const collectionsById = new Map((this.collections || []).map((c) => [String(c?.id || ""), c]));

    const cards = Array.from(document.querySelectorAll(".collection-card"));
    await Promise.all(cards.map(async (card) => {
      const id = ensureCollectionId(card);
      const def = collectionsById.get(id) || null;
      const imageEl = card.querySelector(".collection-card__image");
      if (!imageEl) return;

      const candidates = this.pickCollectionPreviewCandidates(id, def);
      const art = await this.pickFirstLoadableArt(candidates);
      if (!art) {
        imageEl.style.removeProperty("background-image");
        imageEl.classList.remove("has-art");
        return;
      }

      imageEl.style.backgroundImage = `url('${String(art).replace(/'/g, "\\'")}')`;
      imageEl.classList.add("has-art");
    }));
  }

  applyProgressToGrid() {
    const foundSet = buildFoundSet();
    const map = new Map((this.collections || []).map((c) => [c.id, c]));

    document.querySelectorAll(".collection-card").forEach((card) => {
      const id = ensureCollectionId(card);
      const def = map.get(id);
      if (!def || !Array.isArray(def.cardIds) || def.cardIds.length === 0) return;

      const countEl = card.querySelector(".collection-card__count");
      if (!countEl) return;

      const p = computeCollectionProgress(def, foundSet);
      countEl.textContent = `${p.found} з ${p.total}`;
    });
  }

  setupEventListeners() {
    document.querySelectorAll(".collection-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        const id = ensureCollectionId(card);
        ensureCollectionHref(card, id);
        window.location.href = `collection-open.html?id=${encodeURIComponent(id)}`;
      });
    });

    document.querySelectorAll("[data-route]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const route = e.currentTarget.dataset.route;
        this.navigate(route);
      });
    });
  }

  navigate(route) {
    const routes = {
      home: "../../index.html",
      deck: "../../pages/deck/deck.html",
      profile: "../../pages/profile/profile.html",
    };
    if (routes[route]) window.location.href = routes[route];
  }
}

document.addEventListener("DOMContentLoaded", () => new CollectionsScreen());
