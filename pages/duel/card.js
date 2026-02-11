// card.js - довідник карт для дуелі (глобальний, без module import)
// Дає: назву карти, стихію, та "належність" (player/enemy) для логу бою.

(function () {
  const CATALOG_URL = "../../data/cards.json";

  let loadPromise = null;
  let byId = new Map();

  function safeString(v, fallback = "") {
    if (typeof v === "string") return v;
    if (v == null) return fallback;
    return String(v);
  }

  function normalizeElement(x) {
    const s = safeString(x, "").toLowerCase().trim();
    if (["fire", "water", "air", "earth"].includes(s)) return s;
    if (s === "wind") return "air";
    return "";
  }

  async function ensureLoaded() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      try {
        const res = await fetch(CATALOG_URL, { cache: "no-store" });
        const data = await res.json();
        const cards = Array.isArray(data?.cards) ? data.cards : [];
        byId = new Map(cards.filter(Boolean).map((c) => [safeString(c.id), c]));
      } catch (e) {
        console.warn("[CardCatalog] failed to load", e);
        byId = new Map();
      }
      return true;
    })();
    return loadPromise;
  }

  function getCardMeta(cardId) {
    const id = safeString(cardId).trim();
    if (!id) return null;
    return byId.get(id) || null;
  }

  // Decorate a duel card object with name/element + owner flag.
  // owner: "player" | "enemy"
  function decorate(card, owner) {
    const c = card && typeof card === "object" ? { ...card } : {};
    const id = safeString(c.id || c.cardId || c.card_id || "").trim();

    if (id) {
      const meta = getCardMeta(id);
      if (meta) {
        const title = safeString(meta.title || meta.name || meta.id, id);
        c.name = safeString(c.name || c.title || "", "").trim() ? c.name : title;
        const el = normalizeElement(c.element || meta.element);
        if (el) c.element = el;
      }
    }

    if (!c.name) {
      c.name = safeString(c.title || c.element || c.id || "Карта");
    }

    if (owner) c.belongsTo = owner;
    return c;
  }

  window.CardCatalog = window.CardCatalog || {
    ensureLoaded,
    getCardMeta,
    decorate,
  };
})();

