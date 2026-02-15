// pages/weak/weak.js — list all cards not in the battle deck
import "../../src/account.js";
import { CARD_BELONGS_TO, decorateCard, ensureCardCatalogLoaded, resolveCardArt } from "../../src/core/card.js";

const SOURCE_DROPS_KEY = "cardastika:sourceDrops";
const SOURCE_CONSUMED_KEY = "cardastika:sourceConsumedUids";

function asNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeElement(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (["fire", "water", "air", "earth"].includes(s)) return s;
  if (s === "wind") return "air";
  return "earth";
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function normalizeRarity(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return clamp(Math.round(raw), 1, 6);
  const s = String(raw || "").toLowerCase().trim();
  const m = s.match(/^rarity-([1-6])$/);
  if (m) return Number(m[1]);
  if (s === "common") return 1;
  if (s === "uncommon") return 2;
  if (s === "rare") return 3;
  if (s === "epic") return 4;
  if (s === "legendary") return 5;
  if (s === "mythic") return 6;
  return 1;
}

function newUid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

let _levelsPromise = null;
async function loadCardLevelsData() {
  if (_levelsPromise) return _levelsPromise;
  _levelsPromise = (async () => {
    const r = await fetch("../../data/cardLevels.json", { cache: "no-store" });
    if (!r.ok) throw new Error(`cardLevels.json fetch failed: ${r.status}`);
    const json = await r.json();
    const levels = json?.cardLevels?.levels;
    if (!Array.isArray(levels)) throw new Error("cardLevels.json: levels must be array");

    const byLevel = new Map();
    for (const row of levels) {
      const lvl = Math.round(asNum(row?.level, 0));
      if (!lvl) continue;
      byLevel.set(lvl, {
        level: lvl,
        basePower: asNum(row?.basePower, 0),
        elements: asNum(row?.elements, 0),
      });
    }

    return { byLevel };
  })();
  return _levelsPromise;
}

function migrateList(levelsData, list) {
  if (!Array.isArray(list)) return false;
  let changed = false;
  for (const c of list) {
    if (!c || typeof c !== "object") continue;
    if (!c.uid) {
      c.uid = newUid();
      changed = true;
    }
    const lvl = Math.max(1, Math.round(asNum(c.level, 1)));
    const row = levelsData.byLevel.get(lvl) || null;
    if (!Number.isFinite(Number(c.elementsStored)) && !Number.isFinite(Number(c.elements))) {
      if (row) {
        c.elementsStored = row.elements;
        changed = true;
      }
    } else if (!Number.isFinite(Number(c.elementsStored)) && Number.isFinite(Number(c.elements))) {
      c.elementsStored = Math.max(0, Number(c.elements));
      changed = true;
    }
    if (!Number.isFinite(Number(c.basePower)) && row) {
      c.basePower = Math.round(asNum(row.basePower, 0));
      changed = true;
    }
    if (!Number.isFinite(Number(c.power)) || Math.round(Number(c.power)) <= 0) {
      const bonus = Math.round(asNum(c.bonusFixed, 0));
      if (row) {
        c.power = Math.max(0, Math.round(asNum(row.basePower, 0) + bonus));
        changed = true;
      }
    }
  }
  return changed;
}

function isSourceCardLike(raw) {
  if (!raw || typeof raw !== "object") return false;
  if (raw.isSource) return true;
  const id = String(raw.id || "").toLowerCase().trim();
  if (id.startsWith("source_")) return true;
  if (id === "istokfire" || id === "istokwater" || id === "istokair" || id === "istokearth") return true;
  const rarity = String(raw.rarity || "").toLowerCase().trim();
  return rarity === "source";
}

function safeArray(raw) {
  const parsed = safeParse(raw || "null");
  return Array.isArray(parsed) ? parsed : [];
}

function sourceArtFileById(id) {
  const key = String(id || "").toLowerCase().trim();
  if (key === "source_fire" || key === "istokfire") return "istokfire.webp";
  if (key === "source_water" || key === "istokwater") return "istokwater.webp";
  if (key === "source_air" || key === "istokair") return "istokair.webp";
  if (key === "source_earth" || key === "istokearth") return "istokearth.webp";
  return "";
}

function sourceCardFromDrop(drop) {
  if (!drop || typeof drop !== "object") return null;
  const uid = String(drop.uid || "").trim();
  if (!uid) return null;

  const id = String(drop.id || "").trim();
  const element = normalizeElement(drop.element || "");
  const level = Math.max(1, Math.round(asNum(drop.level, 1)));
  const title = String(drop.title || drop.name || id || "Джерело");
  const artFile = sourceArtFileById(id);

  return {
    uid,
    id,
    title,
    name: title,
    element,
    level,
    power: 1,
    basePower: 1,
    rarity: 1,
    inDeck: false,
    protected: false,
    isSource: true,
    artFile: artFile || "",
    droppedAt: asNum(drop.droppedAt, Date.now()),
  };
}

function mergeSourceCardsFromStorage(baseInventory) {
  const inventory = Array.isArray(baseInventory) ? baseInventory.slice() : [];
  const rawStorage = safeParse(localStorage.getItem("cardastika:inventory") || "null");
  const storageInventory = Array.isArray(rawStorage) ? rawStorage : [];

  const seenUids = new Set(inventory.map((c) => String(c?.uid || "").trim()).filter(Boolean));
  let changed = false;

  for (const c of storageInventory) {
    if (!isSourceCardLike(c)) continue;
    const uid = String(c?.uid || "").trim();
    if (!uid || seenUids.has(uid)) continue;
    inventory.push({
      ...c,
      inDeck: false,
      protected: false,
      isSource: true,
    });
    seenUids.add(uid);
    changed = true;
  }

  const drops = safeArray(localStorage.getItem(SOURCE_DROPS_KEY));
  const consumed = new Set(safeArray(localStorage.getItem(SOURCE_CONSUMED_KEY)).map((x) => String(x || "").trim()).filter(Boolean));
  for (const d of drops) {
    const uid = String(d?.uid || "").trim();
    if (!uid || seenUids.has(uid) || consumed.has(uid)) continue;
    const card = sourceCardFromDrop(d);
    if (!card) continue;
    inventory.push(card);
    seenUids.add(uid);
    changed = true;
  }

  return { inventory, changed };
}

function readState() {
  const acc = window.AccountSystem?.getActive?.() || null;
  if (acc) {
    const merged = mergeSourceCardsFromStorage(Array.isArray(acc.inventory) ? acc.inventory : []);
    if (merged.changed && window.AccountSystem?.updateActive) {
      try {
        window.AccountSystem.updateActive((activeAcc) => {
          activeAcc.inventory = merged.inventory.slice();
          return null;
        });
      } catch {
        // ignore
      }
    }
    return {
      source: "account",
      deck: Array.isArray(acc.deck) ? acc.deck : [],
      inventory: merged.inventory,
    };
  }

  const deck = safeParse(localStorage.getItem("cardastika:deck") || "null");
  const inventoryRaw = safeParse(localStorage.getItem("cardastika:inventory") || "null");
  const merged = mergeSourceCardsFromStorage(Array.isArray(inventoryRaw) ? inventoryRaw : []);
  if (merged.changed) {
    try {
      localStorage.setItem("cardastika:inventory", JSON.stringify(merged.inventory));
    } catch {
      // ignore
    }
  }
  return {
    source: "storage",
    deck: Array.isArray(deck) ? deck : [],
    inventory: merged.inventory,
  };
}

function saveState(st) {
  if (st.source === "account" && window.AccountSystem?.updateActive) {
    window.AccountSystem.updateActive((acc) => {
      acc.deck = Array.isArray(st.deck) ? st.deck : [];
      acc.inventory = Array.isArray(st.inventory) ? st.inventory : [];
      return null;
    });
    return;
  }

  try {
    localStorage.setItem("cardastika:deck", JSON.stringify(st.deck || []));
    localStorage.setItem("cardastika:inventory", JSON.stringify(st.inventory || []));
  } catch {
    // ignore
  }
}

function normalizeCard(raw, idx) {
  if (!raw || typeof raw !== "object") return null;
  const uid = String(raw.uid || raw.cardUid || raw.cardUID || "").trim();
  const id = String(raw.id || raw.cardId || `card_${idx + 1}`);
  const title = String(raw.name || raw.title || raw.cardTitle || id);
  const element = normalizeElement(raw.element || raw.elem || raw.type);
  const power = Math.max(0, Math.round(asNum(raw.power ?? raw.basePower, 0)));
  const level = Math.max(1, Math.round(asNum(raw.level ?? raw.lvl, 1)));
  const rarity = normalizeRarity(raw.rarity ?? raw.quality ?? raw.rarityClass ?? 1);
  // Support both 'art' (full URL) and 'artFile' (filename only)
  let art = String(raw.art || raw.image || raw.img || raw.cover || "").trim();
  const artFile = String(raw.artFile || "").trim();
  const idArtFile = id ? (/\.[a-z0-9]+$/i.test(id) ? id : `${id}.webp`) : "";
  if (!art && idArtFile) art = `../../assets/cards/arts/${idArtFile}`;
  if (!art && artFile) art = `../../assets/cards/arts/${artFile}`;
  const protectedFlag = !!(raw.protected ?? raw.isProtected ?? raw.locked ?? false);
  const isSource = !!(raw.isSource);
  return { uid, id, title, element, power, level, rarity, protected: protectedFlag, art, artFile, isSource };
}

function cardFp(c) {
  return `${String(c?.id || "")}|${String(c?.element || "")}|${Math.max(1, Math.round(asNum(c?.level, 1)))}|${Math.round(asNum(c?.power ?? c?.basePower, 0))}`;
}

function renderRefCardButton(card, inDeck) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `ref-card elem-${card.element} rarity-${card.rarity}${card.isSource ? " ref-card--source" : ""}`;
  btn.dataset.cardUid = String(card.uid || "");
  btn.dataset.cardId = String(card.id || "");
  btn.dataset.cardTitle = String(card.title || "");
  btn.dataset.cardPower = String(card.power ?? 0);
  btn.dataset.cardLevel = String(card.level ?? 1);
  btn.dataset.cardElement = String(card.element || "earth");
  btn.dataset.cardInDeck = inDeck ? "1" : "0";
  btn.dataset.cardProtected = card.protected ? "1" : "0";
  btn.dataset.cardArt = String(card.art || "");
  btn.dataset.cardIsSource = card.isSource ? "1" : "0";
  btn.setAttribute("aria-label", card.title);

  btn.innerHTML = `
    <div class="ref-card__top">
      <span class="ref-card__type" aria-hidden="true"></span>
      <span class="ref-card__power">${card.power}</span>
    </div>
    <div class="ref-card__art"></div>
    <div class="ref-card__elem" aria-hidden="true"></div>
  `;

  const artEl = btn.querySelector(".ref-card__art");
  if (artEl && card.art) artEl.style.backgroundImage = `url('${card.art}')`;

  return btn;
}

async function render() {
  await ensureCardCatalogLoaded();
  const levelsData = await loadCardLevelsData();

  const hint = document.getElementById("weakHintText");
  const grid = document.getElementById("weakGrid");
  if (!grid) return;

  const st = readState();
  const changed = migrateList(levelsData, st.deck) || migrateList(levelsData, st.inventory);
  if (changed) saveState(st);

  const rawDeck = (st.deck || []).slice(0, 9).map(normalizeCard).filter(Boolean);
  const rawInv = (st.inventory || []).map(normalizeCard).filter(Boolean);

  const deck = rawDeck.map((c) => {
    const card = decorateCard({ ...c, inDeck: true }, CARD_BELONGS_TO.deck);
    const artResolved = resolveCardArt(card);
    if (artResolved.art) card.art = artResolved.art;
    if (artResolved.artFile && !card.artFile) card.artFile = artResolved.artFile;
    return card;
  });
  const deckUids = new Set(deck.map((c) => String(c?.uid || "")).filter(Boolean));
  const deckFpCounts = new Map();
  for (const c of rawDeck) {
    const fp = cardFp(c);
    deckFpCounts.set(fp, (deckFpCounts.get(fp) || 0) + 1);
  }

  const weak = rawInv
    .filter((c) => {
      const uid = String(c.uid || "").trim();
      if (uid && deckUids.has(uid)) return false;
      const fp = cardFp(c);
      const left = deckFpCounts.get(fp) || 0;
      if (left > 0) {
        deckFpCounts.set(fp, left - 1);
        return false;
      }
      return true;
    })
    .map((c) => {
      const card = decorateCard({ ...c, inDeck: false }, CARD_BELONGS_TO.player);
      const artResolved = resolveCardArt(card);
      if (artResolved.art) card.art = artResolved.art;
      if (artResolved.artFile && !card.artFile) card.artFile = artResolved.artFile;
      return card;
    });

  weak.sort((a, b) =>
    (Number(b?.level ?? 0) - Number(a?.level ?? 0)) ||
    (Number(b?.power ?? 0) - Number(a?.power ?? 0)) ||
    (Number(b?.rarity ?? 0) - Number(a?.rarity ?? 0)) ||
    String(a?.title ?? "").localeCompare(String(b?.title ?? "")),
  );

  if (hint) {
    const n = weak.length;
    hint.innerHTML = `У вас є <b>${n}</b> слабких карт, які можна витратити для покращення карт у <b>Бойовій колоді</b>.`;
  }

  grid.innerHTML = "";
  for (const c of weak) {
    grid.appendChild(renderRefCardButton(c, false));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  render().catch((e) => console.warn("[weak] render failed", e));
});
