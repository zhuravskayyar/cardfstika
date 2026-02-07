import { buildFoundSet, computeCollectionProgress, loadCollectionsConfigSmart } from "../../src/collections-core.js";

const TRANSLIT_MAP = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ю: "yu", я: "ya", ь: "", "'": "", "’": "",
};

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

class CollectionsScreen {
  constructor() {
    this.collections = [];
    this.init();
  }

  async init() {
    await this.loadCollectionsConfig();
    this.normalizeCollectionCards();
    this.applyProgressToGrid();
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

    document.querySelectorAll(".collection-card").forEach((card) => {
      const id = ensureCollectionId(card);
      if (!known.has(id)) {
        const title = card.querySelector(".collection-card__title")?.textContent?.trim() || id;
        known.set(id, { id, title, cardIds: [] });
      }
      ensureCollectionHref(card, id);
    });
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
