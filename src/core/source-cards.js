// src/core/source-cards.js - Source-card logic

const SOURCES = [
  { id: "source_fire", title: "Джерело вогню", element: "fire", artFile: "istokfire.webp" },
  { id: "source_water", title: "Джерело води", element: "water", artFile: "istokwater.webp" },
  { id: "source_air", title: "Джерело повітря", element: "air", artFile: "istokair.webp" },
  { id: "source_earth", title: "Джерело землі", element: "earth", artFile: "istokearth.webp" },
];

const INVENTORY_KEY = "cardastika:inventory";
const SOURCE_DROPS_KEY = "cardastika:sourceDrops";
const SOURCE_CONSUMED_KEY = "cardastika:sourceConsumedUids";

function safeParseArray(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readConsumedSet() {
  const arr = safeParseArray(localStorage.getItem(SOURCE_CONSUMED_KEY));
  return new Set(arr.map((x) => String(x || "").trim()).filter(Boolean));
}

function writeConsumedSet(setLike) {
  try {
    const arr = Array.from(setLike || []).map((x) => String(x || "").trim()).filter(Boolean);
    localStorage.setItem(SOURCE_CONSUMED_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function readInventory() {
  try {
    const acc = window.AccountSystem?.getActive?.() || null;
    if (acc) {
      const fromAccount = Array.isArray(acc.inventory) ? acc.inventory.slice() : [];
      const seenUids = new Set(fromAccount.map((c) => String(c?.uid || "").trim()).filter(Boolean));
      const fromStorage = safeParseArray(localStorage.getItem(INVENTORY_KEY));

      let changed = false;
      for (const c of fromStorage) {
        if (!isSourceCard(c)) continue;
        const uid = String(c?.uid || "").trim();
        if (!uid || seenUids.has(uid)) continue;
        fromAccount.push({
          ...c,
          inDeck: false,
          protected: false,
          isSource: true,
        });
        seenUids.add(uid);
        changed = true;
      }

      if (changed && window.AccountSystem?.updateActive) {
        try {
          window.AccountSystem.updateActive((activeAcc) => {
            activeAcc.inventory = fromAccount.slice();
            return null;
          });
        } catch (e) {
          console.warn("[source-cards] Failed to migrate source cards to account inventory:", e);
        }
      }

      return fromAccount;
    }
  } catch {
    // ignore
  }

  try {
    return safeParseArray(localStorage.getItem(INVENTORY_KEY));
  } catch {
    return [];
  }
}

function writeInventory(inventory) {
  const next = Array.isArray(inventory) ? inventory : [];
  let updatedAccount = false;

  try {
    if (window.AccountSystem?.updateActive && window.AccountSystem?.getActive?.()) {
      window.AccountSystem.updateActive((acc) => {
        acc.inventory = next.slice();
        return null;
      });
      updatedAccount = true;
    }
  } catch (e) {
    console.warn("[source-cards] Failed to update account inventory:", e);
  }

  if (!updatedAccount) {
    try {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("[source-cards] Failed to save to inventory:", e);
    }
  }
}

function isSourceCard(card) {
  if (!card || typeof card !== "object") return false;
  if (card.isSource) return true;

  const id = String(card.id || "").toLowerCase().trim();
  if (id.startsWith("source_")) return true;
  if (id === "istokfire" || id === "istokwater" || id === "istokair" || id === "istokearth") return true;

  const rarity = String(card.rarity || "").toLowerCase().trim();
  return rarity === "source";
}

/**
 * Generates a random source card.
 * @param {number} minLevel
 * @param {number} maxLevel
 * @returns {Object}
 */
export function generateSourceCard(minLevel = 1, maxLevel = 50) {
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const level = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;

  return {
    uid: `source_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    id: source.id,
    title: source.title,
    name: source.title,
    element: source.element,
    artFile: source.artFile,
    level,
    power: 1,
    basePower: 1,
    rarity: 1,
    isSource: true,
    droppedAt: Date.now(),
  };
}

/**
 * Checks if source card should drop by chance.
 * @param {number} chance
 * @returns {boolean}
 */
export function shouldDropSource(chance = 15) {
  return Math.random() * 100 < chance;
}

/**
 * Arena source-card drop (15%, level 20-40).
 * @returns {Object|null}
 */
export function tryDropArenaSource() {
  if (!shouldDropSource(15)) return null;
  return generateSourceCard(20, 40);
}

/**
 * Tournament source-card drop by placement.
 * @param {string} placement
 * @returns {Object|null}
 */
export function getSourceForTournamentPlacement(placement) {
  const config = {
    first: { minLevel: 40, maxLevel: 50, chance: 100 },
    second: { minLevel: 35, maxLevel: 45, chance: 100 },
    third: { minLevel: 30, maxLevel: 40, chance: 100 },
    fourth: { minLevel: 25, maxLevel: 35, chance: 100 },
    quarterFinal: { minLevel: 20, maxLevel: 30, chance: 75 },
    round8: { minLevel: 15, maxLevel: 25, chance: 50 },
    round16: { minLevel: 10, maxLevel: 20, chance: 25 },
    participant: { minLevel: 10, maxLevel: 15, chance: 10 },
  };

  const cfg = config[placement];
  if (!cfg) return null;
  if (!shouldDropSource(cfg.chance)) return null;
  return generateSourceCard(cfg.minLevel, cfg.maxLevel);
}

/**
 * Saves source card to inventory.
 * @param {Object} card
 */
export function saveSourceToInventory(card) {
  if (!card || !card.uid) return;

  const inventory = readInventory();
  inventory.push({
    ...card,
    inDeck: false,
    protected: false,
    isSource: true,
    addedAt: Date.now(),
  });

  const consumed = readConsumedSet();
  consumed.delete(String(card.uid || "").trim());
  writeConsumedSet(consumed);

  writeInventory(inventory);
  saveDropHistory(card);
}

/**
 * Saves source-drop history.
 * @param {Object} card
 */
function saveDropHistory(card) {
  let drops = [];
  try {
    const raw = localStorage.getItem(SOURCE_DROPS_KEY);
    drops = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(drops)) drops = [];
  } catch {
    drops = [];
  }

  drops.push({
    uid: card.uid,
    id: card.id,
    title: card.title,
    element: card.element,
    level: card.level,
    droppedAt: card.droppedAt || Date.now(),
  });

  if (drops.length > 100) drops = drops.slice(-100);

  try {
    localStorage.setItem(SOURCE_DROPS_KEY, JSON.stringify(drops));
  } catch (e) {
    console.warn("[source-cards] Failed to save drop history:", e);
  }
}

/**
 * Returns all source cards from inventory.
 * @returns {Array}
 */
export function getSourceCardsFromInventory() {
  const inventory = readInventory();
  return inventory.filter((c) => isSourceCard(c));
}

/**
 * Removes source card from inventory.
 * @param {string} uid
 */
export function removeSourceFromInventory(uid) {
  if (!uid) return;
  const sourceUid = String(uid || "").trim();
  if (sourceUid) {
    const consumed = readConsumedSet();
    consumed.add(sourceUid);
    writeConsumedSet(consumed);
  }
  const inventory = readInventory();
  const next = inventory.filter((c) => c && c.uid !== sourceUid);
  writeInventory(next);
}

/**
 * Returns element name in Ukrainian genitive case.
 * @param {string} element
 * @returns {string}
 */
export function getElementNameUk(element) {
  const names = {
    fire: "вогню",
    water: "води",
    air: "повітря",
    earth: "землі",
  };
  return names[element] || element;
}

/**
 * Formats source-card info for UI.
 * @param {Object} card
 * @returns {string}
 */
export function formatSourceCardInfo(card) {
  if (!card) return "";
  return `${card.title} (Рівень ${card.level})`;
}
