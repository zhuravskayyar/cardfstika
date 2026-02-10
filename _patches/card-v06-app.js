// Р“Р°СЂР°РЅС‚РѕРІР°РЅРѕ Р·РЅС–РјР°С” Р±Р»РѕРєСѓРІР°РЅРЅСЏ РїСЂРё РІС…РѕРґС– РІ РєРѕР»РѕРґСѓ
function onEnterDeckPage(){
  document.body.classList.remove('duel-locked','duel-anim-lock');
}
// РљРѕРЅС‚СЂРѕР»СЊРЅР° С‚РѕС‡РєР° РґР»СЏ РїРµСЂРµРІС–СЂРєРё РїРѕРІРЅРѕС‚Рё РјРѕРґРµР»С– РєР°СЂС‚Рё (hoisted)
function assertFullCard(card, ctx = '') {
  if (!card || !card.id || !card.rarity || !card.element) {
    console.warn('[BROKEN CARD MODEL]', ctx, card);
  }
}
// Expose on window if not already
window.assertFullCard = window.assertFullCard || assertFullCard;
/* ===== js/data/cards.js ===== */
/**
 * РљРђР РўРћР’Рђ Р‘РђР—Рђ Р“Р Р - 40 Р¤Р РђРљР¦Р†Р™, 240 РљРђР Рў
 * 
 * РЎС‚СЂСѓРєС‚СѓСЂР° РєР°СЂС‚Рё:
 * - id: СѓРЅС–РєР°Р»СЊРЅРёР№ С–РґРµРЅС‚РёС„С–РєР°С‚РѕСЂ (С„РѕСЂРјР°С‚: "F##-R#" РґРµ ## - РЅРѕРјРµСЂ С„СЂР°РєС†С–С—, # - СЂС–РґРєС–СЃС‚СЊ)
 * - element: "fire" | "water" | "air" | "earth"
 * - faction: ID С„СЂР°РєС†С–С—
 * - factionName: РќР°Р·РІР° С„СЂР°РєС†С–С—
 * - rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic"
 * - basePower: С„С–РЅР°Р»СЊРЅР° СЃРёР»Р° РєР°СЂС‚Рё (base * multiplier)
 * - multiplier: РјРЅРѕР¶РЅРёРє СЂС–РґРєРѕСЃС‚С– (РґР»СЏ СЂРѕР·СЂР°С…СѓРЅРєС–РІ)
 * - upgradeMult: РјРЅРѕР¶РЅРёРє РїСЂРѕРєР°С‡РєРё (РґР»СЏ СЃРёСЃС‚РµРјРё СЂС–РІРЅС–РІ)
 * - attack: Р°С‚Р°РєР° (РґРѕСЂС–РІРЅСЋС” basePower)
 * - defense: Р·Р°С…РёСЃС‚ (80% РІС–Рґ basePower)
 * - name: С–Рј'СЏ РєР°СЂС‚Рё
 */

// =========================================================
// TASKS DATA
// =========================================================

const TASKS = [
  {
    id: "duel_1",
    title: "РџРµСЂС€РёР№ Р±С–Р№",
    desc: "Р—С–РіСЂР°Р№С‚Рµ 1 РґСѓРµР»СЊ",
    type: "duel",
    target: 1,
    reward: { xp: 50, gears: 1 }
  },
  {
    id: "duel_10",
    title: "Р РѕР·С–РіСЂС–РІ",
    desc: "Р—С–РіСЂР°Р№С‚Рµ 10 РґСѓРµР»РµР№",
    type: "duel",
    target: 10,
    reward: { xp: 200, gears: 3 }
  },
  {
    id: "win_5",
    title: "РџРµСЂРµРјРѕР¶РµС†СЊ",
    desc: "Р’РёРіСЂР°Р№С‚Рµ 5 РґСѓРµР»РµР№",
    type: "win",
    target: 5,
    reward: { xp: 300, gears: 5 }
  }
];



const TASKS_RESET_MS = 12 * 60 * 60 * 1000; // 12 РіРѕРґРёРЅ

function ensureTasksState(profile) {
  profile.tasks = profile.tasks || {};
  profile.completedTasks = profile.completedTasks || [];
  if (!profile.tasksResetAt) profile.tasksResetAt = Date.now();
}

function maybeResetTasks(profile) {
  ensureTasksState(profile);

  const now = Date.now();
  const last = Number(profile.tasksResetAt) || 0;

  if (now - last < TASKS_RESET_MS) return false;

  // reset
  profile.tasks = {};
  profile.completedTasks = [];
  profile.tasksResetAt = now;

  userProfile.updateCurrentUser(profile);
  userProfile.updateUI();

  return true;
}

// =========================================================
// TASKS RENDERING & UPDATING
// =========================================================
function renderTasks() {
  if (typeof renderTasksV2 === 'function') return renderTasksV2();
  const container = document.getElementById('tasks-list');
  if (!container) return;
  const profile = userProfile.getProfile();
  if (!profile) {
    container.innerHTML = '<div class="no-tasks">РЈРІС–Р№РґС–С‚СЊ, С‰РѕР± Р±Р°С‡РёС‚Рё Р·Р°РІРґР°РЅРЅСЏ</div>';
    return;
  }

  ensureTasksState(profile);

  container.innerHTML = TASKS.map(task => {
    const progress = profile.tasks[task.id] || 0;
    const completed = Array.isArray(profile.completedTasks) && profile.completedTasks.includes(task.id);
    const pct = Math.min(100, Math.round((progress / Math.max(1, task.target)) * 100));
    const rewardParts = [];
    if (task.reward && task.reward.xp) rewardParts.push(`+${task.reward.xp} XP`);
    if (task.reward && task.reward.gears) rewardParts.push(`+${task.reward.gears} вљ™пёЏ`);
    const rewardTxt = rewardParts.join(', ');

    return `
      <div class="task-card ${completed ? 'task-done' : ''}" data-task-id="${task.id}">
        <div class="task-top"><div class="task-title">${task.title}</div><div class="task-reward">${rewardTxt}</div></div>
        <div class="task-desc">${task.desc}</div>
        <div class="task-bar"><div class="task-bar-fill" style="width:${pct}%"></div></div>
        <div class="task-footer">${completed ? 'Р’РёРєРѕРЅР°РЅРѕ' : `${progress}/${task.target}`}</div>
      </div>
    `;
  }).join('');
}

function updateTasks(type, amount = 1) {
  if (typeof taskEvent === 'function') {
    try { taskEvent(type, amount); } catch (e) { console.warn('taskEvent delegate failed', e); }
    return;
  }
  const profile = userProfile.getProfile();
  if (!profile) return;
  ensureTasksState(profile);

  let changed = false;
  TASKS.forEach(task => {
    if (task.type !== type) return;
    const cur = Number(profile.tasks[task.id] || 0);
    const next = Math.min(task.target, cur + Number(amount || 1));
    if (next !== cur) {
      profile.tasks[task.id] = next;
      changed = true;
    }

    if (next >= task.target && !(profile.completedTasks || []).includes(task.id)) {
      // complete and award
      profile.completedTasks = profile.completedTasks || [];
      profile.completedTasks.push(task.id);
      profile.xp = (profile.xp || 0) + (task.reward && task.reward.xp ? task.reward.xp : 0);
      profile.gears = (profile.gears || 0) + (task.reward && task.reward.gears ? task.reward.gears : 0);
    }
  });

  if (changed) {
    userProfile.updateCurrentUser(profile);
    userProfile.updateUI();
    try {
      if (typeof navigation !== 'undefined' && typeof navigation.updateXP === 'function') navigation.updateXP(profile);
      else if (typeof updateHudXp === 'function') updateHudXp(profile);
    } catch (e) { /* ignore */ }
    try { renderTasks(); } catch (e) { /* ignore */ }
  }
}


// =========================================================
// PATCH: Enemy power cap relative to player (+20 max)
// =========================================================

function capEnemyPowerRelative(enemyPower, playerPower) {
  const ep = Number(enemyPower) || 0;
  const pp = Number(playerPower) || 0;
  // РЎРёР»Р° РІРѕСЂРѕРіР° Сѓ РґС–Р°РїР°Р·РѕРЅС– [pp-20, pp+20], Р°Р»Рµ РЅРµ РјРµРЅС€Рµ 0
  const minPower = Math.max(0, pp - 20);
  const maxPower = pp + 20;
  return Math.max(minPower, Math.min(ep, maxPower));
}

// =========================================================
// PATCH: Build enemy card pool by target power (no random mismatch)
// =========================================================
function buildEnemyCardPool(targetPower, allCards, maxCards = 9) {
  // Р±РµСЂРµРјРѕ С‚С–Р»СЊРєРё Р±Р°Р·РѕРІС– РєР°СЂС‚Рё (Р±РµР· РїСЂРѕРєР°С‡РєРё РіСЂР°РІС†СЏ)
  // РЇРєС‰Рѕ СЃРёР»Р° РіСЂР°РІС†СЏ = 12 * РєС–Р»СЊРєС–СЃС‚СЊ РєР°СЂС‚ (РІСЃС– РєР°СЂС‚Рё РїРѕ 12), РЅРµ РґР°РІР°С‚Рё РІРѕСЂРѕРіСѓ РјС–С„С–С‡РЅС– РєР°СЂС‚Рё
  let filteredCards = allCards.filter(c => c && typeof c.power === 'number');
  // If targetPower is small (<=1000), forbid legendary/mythic (R5/R6)
  if (typeof targetPower === 'number' && targetPower <= 1000) {
    const nonHigh = filteredCards.filter(c => c.rarityId !== 'R5' && c.rarityId !== 'R6' && c.rarity !== 'legendary' && c.rarity !== 'mythic');
    if (nonHigh.length) filteredCards = nonHigh;
  }
  // Р’РёР·РЅР°С‡Р°С”РјРѕ, С‡Рё РІСЃС– РєР°СЂС‚Рё РіСЂР°РІС†СЏ РїРѕ 12 (СЃС‚Р°СЂС‚РѕРІС–)
  if (typeof window !== 'undefined' && window.playerDeck) {
    const playerCards = window.playerDeck;
    const allTwelve = Array.isArray(playerCards) && playerCards.length > 0 && playerCards.every(card => (card.basePower || card.power) === 12);
    if (allTwelve) {
      filteredCards = filteredCards.filter(c => c.rarity !== 'mythic' && c.rarityId !== 'R6');
    }
  }
  // РџС–РґР±С–СЂ РєР°СЂС‚ С‚Р°Рє, С‰РѕР± СЃСѓРјР° С—С… СЃРёР»Рё Р±СѓР»Р° РІ РґС–Р°РїР°Р·РѕРЅС– [targetPower-20, targetPower+20]
  filteredCards = filteredCards.sort((a, b) => b.power - a.power);
  let bestCombo = [];
  let bestSum = 0;
  const minPower = Math.max(0, targetPower - 20);
  const maxPower = targetPower + 20;
  // РџРµСЂРµР±РёСЂР°С”РјРѕ РІСЃС– РєРѕРјР±С–РЅР°С†С–С— РґРѕ maxCards (Р¶Р°РґС–Р±РЅРѕ, Р°Р»Рµ РЅРµ СЂР°РЅРґРѕРјРЅРѕ)
  function findBestCombo(cards, maxCards, minTarget, maxTarget, current = [], sum = 0, idx = 0) {
    if (current.length > maxCards || sum > maxTarget) return;
    if (sum >= minTarget && sum <= maxTarget && sum > bestSum) {
      bestSum = sum;
      bestCombo = [...current];
    }
    for (let i = idx; i < cards.length; i++) {
      findBestCombo(cards, maxCards, minTarget, maxTarget, [...current, cards[i]], sum + cards[i].power, i + 1);
    }
  }
  findBestCombo(filteredCards, maxCards, minPower, maxPower);
  // fallback: СЏРєС‰Рѕ РЅРµ РЅР°Р±СЂР°Р»Рё РЅС–С‡РѕРіРѕ вЂ” РІР·СЏС‚Рё РјС–РЅС–РјР°Р»СЊРЅСѓ РєР°СЂС‚Сѓ
  if (bestCombo.length === 0 && filteredCards.length) {
    bestCombo = [filteredCards[filteredCards.length - 1]];
    bestSum = bestCombo[0].power;
  }
  return { cards: bestCombo, totalPower: bestSum };
}

// --- Helper utilities for enemy generation ---
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function getPlayerDeckPower() {
  try {
    const profile = (typeof userProfile !== 'undefined') ? userProfile.getProfile() : null;
    const deck = (profile && profile.deckCards) ? profile.deckCards : [];
    return deck.reduce((sum, c) => {
      const card = getCardById(c.cardId || c.id || c);
      return sum + (card ? (window.getPower ? window.getPower(card, c.level || 1) : getPower(card, c.level || 1)) : 0);
    }, 0);
  } catch (e) {
    return 0;
  }
}

function isStarterDeck(deck) {
  if (!deck || !Array.isArray(deck) || deck.length === 0) return false;
  return deck.every(c => {
    const card = getCardById(c.cardId || c.id || c);
    return card && Number(card.basePower) === 12 && (c.level || 1) === 1;
  });
}
function buildEnemyDeckExact9(targetPower, maxAllowed = Number.POSITIVE_INFINITY) {
  const pool = [...ALL_CARDS]
    .filter(c => c && c.basePower)
    .sort((a, b) => getPower(b, 1) - getPower(a, 1));

  // If enemy target power is <= 1000, don't include R5/R6 in the pool
  if (typeof targetPower === 'number' && targetPower <= 1000) {
    const nonHigh = pool.filter(c => (c.rarityId || c.rarity) && c.rarityId !== 'R5' && c.rarityId !== 'R6' && c.rarity !== 'legendary' && c.rarity !== 'mythic');
    if (nonHigh.length) {
      // preserve sorted order
      while (pool.length) pool.pop();
      nonHigh.forEach(x => pool.push(x));
    }
  }

  const deck = [];
  let sum = 0;

  // 1. РќР°Р±РёСЂР°С”РјРѕ СЃРёР»СЊРЅС– РєР°СЂС‚Рё but do not exceed targetPower
  for (const card of pool) {
    if (deck.length >= 9) break;
    const p = getPower(card, 1);
    if (sum + p <= targetPower && sum + p <= maxAllowed) {
      deck.push({ id: card.id, level: 1, power: p });
      sum += p;
    }
  }

  // 2. Try to fill remaining slots with cards that do not push sum above maxAllowed
  // Prefer weak cards first
  const sortedByWeak = pool.slice().sort((a,b)=> getPower(a,1) - getPower(b,1));
  let wi = 0;
  while (deck.length < 9 && wi < sortedByWeak.length) {
    const card = sortedByWeak[wi];
    const p = getPower(card, 1);
    if (sum + p <= maxAllowed) {
      deck.push({ id: card.id, level: 1, power: p });
      sum += p;
    }
    wi++;
  }

  // 3. If still not 9, allow adding weakest cards even if it slightly exceeds maxAllowed
  const weakest = pool[pool.length - 1];
  while (deck.length < 9 && weakest) {
    const p = getPower(weakest, 1) || 12;
    deck.push({ id: weakest.id, level: 1, power: p });
    sum += p;
  }

  return { hand: deck, hp: sum, maxHp: sum };
}

function buildEnemyDeckByPower(targetPower, maxCards = 9) {
  const profile = (typeof userProfile !== 'undefined') ? userProfile.getProfile() : null;
  const playerDeck = (profile && profile.deckCards) ? profile.deckCards : [];

  const starter = isStarterDeck(playerDeck);

  // Р‘РµСЂРµРјРѕ Р±Р°Р·РѕРІРёР№ РїСѓР»
  let pool = (window.ALL_CARDS || []).filter(Boolean);

  // If targetPower is small, filter out very high rarities
  if (typeof targetPower === 'number' && targetPower <= 1000) {
    const nonHigh = pool.filter(c => c.rarityId !== 'R5' && c.rarityId !== 'R6' && c.rarity !== 'legendary' && c.rarity !== 'mythic');
    if (nonHigh.length) pool = nonHigh;
  }

  // РЇРєС‰Рѕ СЃС‚Р°СЂС‚РѕРІР° РєРѕР»РѕРґР° вЂ” РЅРµ РґР°С”РјРѕ РјС–С„С–РєРё
  if (starter) pool = pool.filter(c => c.rarity !== 'mythic' && c.rarityId !== 'R6');

  // РњР°РїР° РїРѕС‚СѓР¶РЅРѕСЃС‚С– РєР°СЂС‚Рё РЅР° 1 СЂС–РІРЅС–
  const p1 = (card) => {
    try { return Math.max(12, Math.round(window.getPower ? window.getPower(card, 1) : getPower(card, 1) || 12)); }
    catch (e) { return Math.max(12, Math.round(card.basePower || card.power || 12)); }
  };

  // РЎРѕСЂС‚СѓС”РјРѕ Р·Р° СЃРёР»РѕСЋ
  const sorted = pool
    .map(c => ({ id: c.id, power: p1(c) }))
    .filter(x => x.id)
    .sort((a,b) => a.power - b.power); // СЃР»Р°Р±РєС– -> СЃРёР»СЊРЅС–

  // РЈРЅС–РєР°Р»СЊРЅС–СЃС‚СЊ
  const pickUnique = (arr, count) => {
    const res = [];
    const used = new Set();
    for (const x of arr) {
      if (res.length >= count) break;
      if (used.has(x.id)) continue;
      used.add(x.id);
      res.push({ id: x.id, level: 1, power: x.power });
    }
    return res;
  };

  // 1) РЎС‚Р°СЂС‚: Р±РµСЂРµРјРѕ 9 РЅР°Р№СЃР»Р°Р±С€РёС… (РіР°СЂР°РЅС‚РѕРІР°РЅРѕ 9, СЏРєС‰Рѕ РїСѓР» РЅРѕСЂРјР°Р»СЊРЅРёР№)
  let deck = pickUnique(sorted, maxCards);

  // fallback СЏРєС‰Рѕ РїСѓР» РјРµРЅС€РёР№ (РґСѓР¶Рµ СЂС–РґРєРѕ)
  while (deck.length < maxCards && sorted.length) {
    const x = sorted[Math.floor(Math.random() * sorted.length)];
    if (!deck.some(d => d.id === x.id)) deck.push({ id: x.id, level: 1, power: x.power });
  }

  const sumDeck = () => deck.reduce((s,c)=>s+(c.power||0),0);

  // Р¦С–Р»СЊРѕРІРёР№ РґС–Р°РїР°Р·РѕРЅ
  const minT = Math.max(0, targetPower - 20);
  const maxT = targetPower + 20;

  // 2) РђРїРіСЂРµР№Рґ: Р·Р°РјС–РЅСЋС”РјРѕ РЅР°Р№СЃР»Р°Р±С€С– РЅР° СЃРёР»СЊРЅС–С€С–, РїРѕРєРё РЅРµ СѓРІС–Р№РґРµРјРѕ РІ РґС–Р°РїР°Р·РѕРЅ
  // Р‘РµСЂРµРјРѕ РєР°РЅРґРёРґР°С‚С–РІ РІС–Рґ СЃРёР»СЊРЅРёС… РґРѕ СЃР»Р°Р±РєРёС…
  const candidatesDesc = sorted.slice().sort((a,b)=>b.power-a.power);

  let guard = 0;
  while (sumDeck() < minT && guard++ < 2000) {
    // РЅР°Р№СЃР»Р°Р±С€РёР№ СЃР»РѕС‚
    deck.sort((a,b)=>a.power-b.power);
    const weakest = deck[0];

    // РїСЂРѕР±СѓС”РјРѕ РІСЃС‚Р°РІРёС‚Рё РЅР°Р№РєСЂР°С‰РѕРіРѕ РєР°РЅРґРёРґР°С‚Р°, СЏРєРёР№ РЅРµ Р·Р»Р°РјР°С” СѓРЅС–РєР°Р»СЊРЅС–СЃС‚СЊ
    let replaced = false;
    for (const cand of candidatesDesc) {
      if (deck.some(d => d.id === cand.id)) continue; // РЅРµ РјРѕР¶РЅР° РґСѓР±Р»СЊ
      const newSum = sumDeck() - weakest.power + cand.power;
      if (newSum <= maxT) {
        deck[0] = { id: cand.id, level: 1, power: cand.power };
        replaced = true;
        break;
      }
    }

    // СЏРєС‰Рѕ РќР• Р·РЅР°Р№С€Р»Рё, РґРѕР·РІРѕР»СЏС”РјРѕ РІРёР№С‚Рё С‚СЂС–С€РєРё Р·Р° maxT, Р°Р»Рµ Р±Р»РёР¶С‡Рµ РґРѕ РґС–Р°РїР°Р·РѕРЅСѓ (РєСЂР°С‰Рµ РЅС–Р¶ 108)
    if (!replaced) {
      for (const cand of candidatesDesc) {
        if (deck.some(d => d.id === cand.id)) continue;
        const newSum = sumDeck() - weakest.power + cand.power;
        // Р±РµСЂРµРјРѕ РїРµСЂС€РёР№, СЏРєРёР№ РїС–РґРЅС–РјР°С” СЃСѓРјСѓ (РЅР°РІС–С‚СЊ СЏРєС‰Рѕ С‚СЂРѕС…Рё РІРёС‰Рµ maxT)
        if (newSum > sumDeck()) {
          deck[0] = { id: cand.id, level: 1, power: cand.power };
          break;
        }
      }
      break;
    }
  }

  // 3) РЇРєС‰Рѕ РїРµСЂРµР»РµС‚С–Р»Рё РІРёС‰Рµ maxT вЂ” РґР°СѓРЅРіСЂРµР№Рґ РЅР°Р№СЃРёР»СЊРЅС–С€РёС…
  guard = 0;
  while (sumDeck() > maxT && guard++ < 2000) {
    deck.sort((a,b)=>b.power-a.power);
    const strongest = deck[0];

    // С€СѓРєР°С”РјРѕ СЃР»Р°Р±С€Сѓ Р·Р°РјС–РЅСѓ (СЏРєРѕС— РЅРµРјР° РІ deck)
    let replaced = false;
    for (const cand of sorted) { // РІС–Рґ СЃР»Р°Р±РєРёС…
      if (deck.some(d => d.id === cand.id)) continue;
      const newSum = sumDeck() - strongest.power + cand.power;
      if (newSum >= minT) {
        deck[0] = { id: cand.id, level: 1, power: cand.power };
        replaced = true;
        break;
      }
    }
    if (!replaced) break;
  }

  return { cards: deck.map(d => ({ id: d.id, level: 1 })), power: sumDeck() };
}

/* ==============================
   Simple card renderer (recommended)
   Usage: document.getElementById('some').innerHTML = renderCard(cardObj);
   cardObj: { image, name, rarity, element, basePower }
   ============================== */
function renderCard(card){
  if(!card) return '';
  const rarity = (card.rarity || 'common').toString().toLowerCase();
  const element = (card.element || '').toString().toLowerCase();
  const img = card.image || (card.imageUrl || card.src) || '';
  const name = card.name || '';
  const power = (typeof card.basePower !== 'undefined') ? card.basePower : (card.power || '');

  return `
    <div class="card-frame ${rarity} ${element}">
      <div class="card-art">
        <img src="${img}" alt="${name}">
      </div>
      <div class="card-ui">
        <div class="card-element">${getElementGlyph(element)}</div>
        <div class="card-power">${power}</div>
      </div>
    </div>
  `;
}

function getElementGlyph(el){
  switch(el){
    case 'fire': return 'рџ”Ґ';
    case 'water': return 'рџ’§';
    case 'air': return 'рџЊ¬пёЏ';
    case 'earth': return 'в›°пёЏ';
    default: return '';
  }
}

// expose globally for quick usage in console/templates
if(typeof window !== 'undefined') window.renderCard = renderCard;


function generateEnemyForDuel() {
  const playerPower = getPlayerDeckPower();

  // choose a target within В±20 of player power
  const offset = Math.floor(Math.random() * 41) - 20; // -20..+20
  const minAllowed = Math.max(0, Math.round(playerPower - 20));
  const maxAllowed = Math.round(playerPower + 20);
  let target = Math.round(playerPower + offset);
  target = Math.max(minAllowed, Math.min(maxAllowed, target));

  // Use robust builder that guarantees 9 cards and targets the В±20 window
  const built = buildEnemyDeckByPower(target, 9);
  let deck = (built && built.cards) ? built.cards.map(ci => ({ id: ci.id, level: ci.level || 1 })) : [];
  let powerSum = built && typeof built.power === 'number' ? built.power : 0;

  // Map to full card objects with power, element, rarity
  let mapped = deck.map(ci => {
    const src = getCardById(ci.id) || {};
    const level = ci.level || 1;
    const p = Math.max(12, Math.round(window.getPower ? window.getPower(src, level) : getPower(src, level) || 12));
    return { id: src.id || ci.id, element: src.element || 'fire', rarity: src.rarity || 'common', level, power: p };
  });

  // Guarantee exactly 9 cards (fallback to weakest) if something went wrong
  if (!Array.isArray(mapped) || mapped.length < 9) {
    const all = (window.ALL_CARDS || []).filter(Boolean);
    const fill = [];
    for (const c of all) {
      if (fill.length >= 9) break;
      const p = Math.max(12, Math.round(window.getPower ? window.getPower(c, 1) : getPower(c, 1) || 12));
      if (!fill.some(x => x.id === c.id)) fill.push({ id: c.id, element: c.element || 'fire', rarity: c.rarity || 'common', level: 1, power: p });
    }
    mapped = mapped || [];
    let fi = 0;
    while (mapped.length < 9 && fill[fi]) mapped.push(fill[fi++]);
    powerSum = mapped.reduce((s,c)=>s+(c.power||0),0);
  }

  // Diagnostic log
  try { console.debug('generateEnemyForDuel -> deck powers', mapped.map(d=>d.power)); } catch(e) {}

  const powerTotal = mapped.reduce((s, c) => s + (c.power || 0), 0);

  return {
    deck: mapped,
    power: powerTotal,
    hp: powerTotal,
    maxHp: powerTotal,
    target
  };
}

// РњР°РїРїС–РЅРі РµР»РµРјРµРЅС‚С–РІ РґР»СЏ С„СЂР°РєС†С–Р№
const FACTION_ELEMENTS = {
  "F01": "fire", "F02": "fire", "F03": "fire", "F04": "fire", "F05": "fire",
  "F06": "fire", "F07": "fire", "F08": "fire", "F09": "fire", "F10": "fire",
  "F11": "water", "F12": "water", "F13": "water", "F14": "water", "F15": "water",
  "F16": "water", "F17": "water", "F18": "water", "F19": "water", "F20": "water",
  "F21": "air", "F22": "air", "F23": "air", "F24": "air", "F25": "air",
  "F26": "air", "F27": "air", "F28": "air", "F29": "air", "F30": "air",
  "F31": "earth", "F32": "earth", "F33": "earth", "F34": "earth", "F35": "earth",
  "F36": "earth", "F37": "earth", "F38": "earth", "F39": "earth", "F40": "earth"
};

// РќР°Р·РІРё С„СЂР°РєС†С–Р№
// ================================
// Steampunk factions: 4 Houses
// ================================
const HOUSE_NAMES = {
  H1: "Р”С–Рј РџРµС‡РµР№",
  H2: "Р”С–Рј Р“Р»РёР±РёРЅ",
  H3: "Р”С–Рј РќРµР±Р°",
  H4: "Р”С–Рј РќР°РґСЂ"
};

// 40 С„СЂР°РєС†С–Р№ (ID РЅРµ Р·РјС–РЅСЋС”РјРѕ)
const FACTION_NAMES = {
  // =========================
  // H1 вЂ” Р”С–Рј РџРµС‡РµР№ (F01вЂ“F10)
  // =========================
  "F01": "РћСЂРґРµРЅ Р›Р°С‚СѓРЅРЅРѕРіРѕ РџРѕРїРµР»Сѓ",
  "F02": "Р›РµРіС–РѕРЅ РљР»РµРїР°РЅРёС… РљР»РёРЅРєС–РІ",
  "F03": "РљСѓР»СЊС‚ Р•Р»РµРєС‚СЂРѕС–СЃРєСЂРё",
  "F04": "РўСЂРѕРЅ РџР°СЂРѕРІРёС… РџРµС‡РµР№",
  "F05": "Р¦РµС… РњР°РіРјРѕРєРѕРІР°Р»С–РІ",
  "F06": "Р’СѓР»РєР°РЅС–С‡РЅРёР№ РљРѕСЂРїСѓСЃ РўРёСЃРєСѓ",
  "F07": "РљР»Р°РЅРё РљРѕС‚РµР»СЊРЅРѕРіРѕ Р–Р°СЂСѓ",
  "F08": "Р‘СЂР°С‚СЃС‚РІРѕ РЎР°Р¶РѕРІРёС… РњР°СЃРѕРє",
  "F09": "Р’Р°СЂС‚Р° РџР»Р°РІРёР»СЊРЅРёС… Р‘СЂР°Рј",
  "F10": "РџСЂРѕСЂРѕРєРё РљРѕСЂРѕРЅРЅРѕРіРѕ РџРѕР»СѓРјвЂ™СЏ",

  // =========================
  // H2 вЂ” Р”С–Рј Р“Р»РёР±РёРЅ (F11вЂ“F20)
  // =========================
  "F11": "РўСЂРѕРЅ РђР±С–СЃР°Р»СЊРЅРѕС— Р“Р»РёР±РёРЅРё",
  "F12": "РћСЂРґРµРЅ РџСЂРёРїР»РёРІРЅРёС… РњРµС…Р°РЅС–РєС–РІ",
  "F13": "Р РёС„РѕРІС– Р’С–РґСЊРјРё РўСѓРјР°РЅСѓ",
  "F14": "РўРёС…РёР№ Р¤Р»РѕС‚ Р”РѕРєС–РІ",
  "F15": "РљСЂРёР¶Р°РЅРёР№ РЎРёРЅРѕРґ РҐСЂР°РЅРёС‚РµР»С–РІ",
  "F16": "Р”РµР»СЊС‚РѕРІРёР№ РЎРёРЅРґРёРєР°С‚ РљР°РЅР°Р»С–РІ",
  "F17": "Р–СЂРµС†С– Р›РµРІС–Р°С„Р°РЅРѕРІРѕРіРѕ РљСѓР»СЊС‚Сѓ",
  "F18": "РџРµСЂР»РёРЅРЅРёР№ РљРѕРЅРєР»Р°РІ РќР°РІС–РіР°С‚РѕСЂС–РІ",
  "F19": "РљР»Р°РЅ РџСЂРёР±С–Р№РЅРёС… РЁС‚РѕСЂРјС–РІ",
  "F20": "РђСЂС…С–РІ Р“С–РґСЂРѕРіСЂР°С„С–РІ РњРѕСЂС–РІ",

  // =========================
  // H3 вЂ” Р”С–Рј РќРµР±Р° (F21вЂ“F30)
  // =========================
  "F21": "РљР°СЂР°РІР°РЅРё РќРµР±РµСЃРЅРёС… Р”РёСЂРёР¶Р°Р±Р»С–РІ",
  "F22": "РћСЂРґРµРЅ Р’С–С‚СЂРѕРІРёС… Р РѕС‚РѕСЂС–РІ",
  "F23": "РЇСЃС‚СЂСѓР±Рё Р“СЂРѕР·РѕРІРёС… Р’РµР¶",
  "F24": "Р›С–РіР° Р›РµРІС–С‚Р°С†С–Р№РЅРёС… РџР»Р°С‚С„РѕСЂРј",
  "F25": "Р¦РµС… РђРµСЂРѕРґРІРёРіСѓРЅС–РІ Р•РЅРґР¶РёРЅР°",
  "F26": "РЈСЂР°РіР°РЅРЅРёР№ Р›РµРіС–РѕРЅ РўСѓСЂР±С–РЅ",
  "F27": "Р”Р·РІРѕРЅР°СЂС– РќРµР±РµСЃРЅРѕРіРѕ РҐСЂРѕРЅРѕРјРµС‚СЂР°",
  "F28": "Р’Р°СЂС‚Р° РџС–РєРѕРІРёС… РЎС‚Р°РЅС†С–Р№",
  "F29": "РњР°РЅРґСЂС–РІС†С– РђСЃС‚СЂРѕРЅР°РІС–РіР°С†С–С—",
  "F30": "РљРѕРЅРєР»Р°РІ РђС‚РјРѕСЃС„РµСЂРЅРёС… РЎС„РµСЂ",

  // =========================
  // H4 вЂ” Р”С–Рј РќР°РґСЂ (F31вЂ“F40)
  // =========================
  "F31": "Р”РѕРјС–РЅС–РѕРЅРё РљР°РјвЂ™СЏРЅРёС… РЁРµСЃС‚РµСЂРµРЅСЊ",
  "F32": "РћСЂРґРµРЅ РљРѕСЂРµРЅРµРІРёС… РњРµС…Р°РЅС–Р·РјС–РІ",
  "F33": "Р”СЂСѓС—РґРё РЎС‚Р°Р»РµРІРёС… Р СѓРЅ",
  "F34": "РљР»Р°РЅРё Р‘СЂРѕРЅР·РѕРІРѕРіРѕ Р©РёС‚Р°",
  "F35": "РҐСЂР°РЅРёС‚РµР»С– РњРѕРЅРѕР»С–С‚РЅРёС… РџСЂРµСЃС–РІ",
  "F36": "РќР°СЂРѕРґ РџРµС‡РµСЂРЅРёС… РЁР°С…С‚",
  "F37": "РЎРёРЅРґРёРєР°С‚ РћР±СЃРёРґС–Р°РЅРѕРІРёС… РљРѕРЅС‚СЂР°РєС‚С–РІ",
  "F38": "РЎС‚РѕСЂРѕР¶С– Р›С–СЃРѕРІРёС… РџРѕСЂС‚Р°Р»С–РІ",
  "F39": "РђСЂС…РѕРЅС‚Рё РўРµРєС‚РѕРЅС–С‡РЅРёС… РџР»РёС‚",
  "F40": "РџР»РµРјРµРЅР° РЎРєРµР»СЊРЅРёС… РљР°СЂвЂ™С”СЂС–РІ"
};

// РњР°РїР°: С„СЂР°РєС†С–СЏ -> РґС–Рј (РґР»СЏ UI/Р±РѕРЅСѓСЃС–РІ/Р»РѕРіС–РєРё)
const HOUSE_BY_FACTION = {
  // H1
  F01:"H1",F02:"H1",F03:"H1",F04:"H1",F05:"H1",F06:"H1",F07:"H1",F08:"H1",F09:"H1",F10:"H1",
  // H2
  F11:"H2",F12:"H2",F13:"H2",F14:"H2",F15:"H2",F16:"H2",F17:"H2",F18:"H2",F19:"H2",F20:"H2",
  // H3
  F21:"H3",F22:"H3",F23:"H3",F24:"H3",F25:"H3",F26:"H3",F27:"H3",F28:"H3",F29:"H3",F30:"H3",
  // H4
  F31:"H4",F32:"H4",F33:"H4",F34:"H4",F35:"H4",F36:"H4",F37:"H4",F38:"H4",F39:"H4",F40:"H4"
};

function getHouseIdByFaction(factionId){
  return HOUSE_BY_FACTION[factionId] || null;
}
function getHouseNameByFaction(factionId){
  const hid = getHouseIdByFaction(factionId);
  return hid ? HOUSE_NAMES[hid] : "";
}

// expose (optional)
window.HOUSE_NAMES = HOUSE_NAMES;
window.HOUSE_BY_FACTION = HOUSE_BY_FACTION;
window.getHouseNameByFaction = getHouseNameByFaction;

// РљРѕР»РµРєС†С–С— С„СЂР°РєС†С–Р№
// РљРѕР»РµРєС†С–С— С„СЂР°РєС†С–Р№
const COLLECTIONS = [
  {
    id: "f01",
    name: "РћСЂРґРµРЅ РџРѕРїРµР»Сѓ",
    faction: "РћСЂРґРµРЅ РџРѕРїРµР»Сѓ",
    cards: ["F01-R1","F01-R2","F01-R3","F01-R4","F01-R5","F01-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f02",
    name: "Р›РµРіС–РѕРЅ РљР»РёРЅРєС–РІ",
    faction: "Р›РµРіС–РѕРЅ РљР»РёРЅРєС–РІ",
    cards: ["F02-R1","F02-R2","F02-R3","F02-R4","F02-R5","F02-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f03",
    name: "РљСѓР»СЊС‚ Р†СЃРєСЂРё",
    faction: "РљСѓР»СЊС‚ Р†СЃРєСЂРё",
    cards: ["F03-R1","F03-R2","F03-R3","F03-R4","F03-R5","F03-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f04",
    name: "РўСЂРѕРЅ Р”СЂР°РєРѕРЅР°",
    faction: "РўСЂРѕРЅ Р”СЂР°РєРѕРЅР°",
    cards: ["F04-R1","F04-R2","F04-R3","F04-R4","F04-R5","F04-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f05",
    name: "РљРѕРІР°Р»С– РњР°РіРјРё",
    faction: "РљРѕРІР°Р»С– РњР°РіРјРё",
    cards: ["F05-R1","F05-R2","F05-R3","F05-R4","F05-R5","F05-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f06",
    name: "РЎРёРЅРё Р’СѓР»РєР°РЅСѓ",
    faction: "РЎРёРЅРё Р’СѓР»РєР°РЅСѓ",
    cards: ["F06-R1","F06-R2","F06-R3","F06-R4","F06-R5","F06-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f07",
    name: "РљР»Р°РЅРё Р–Р°СЂСѓ",
    faction: "РљР»Р°РЅРё Р–Р°СЂСѓ",
    cards: ["F07-R1","F07-R2","F07-R3","F07-R4","F07-R5","F07-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f08",
    name: "Р‘СЂР°С‚СЃС‚РІРѕ РЎР°Р¶С–",
    faction: "Р‘СЂР°С‚СЃС‚РІРѕ РЎР°Р¶С–",
    cards: ["F08-R1","F08-R2","F08-R3","F08-R4","F08-R5","F08-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f09",
    name: "Р’Р°СЂС‚Р° РљР°Р»СЊРґРµСЂРё",
    faction: "Р’Р°СЂС‚Р° РљР°Р»СЊРґРµСЂРё",
    cards: ["F09-R1","F09-R2","F09-R3","F09-R4","F09-R5","F09-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f10",
    name: "РџСЂРѕСЂРѕРєРё РљСЂРѕРЅРё",
    faction: "РџСЂРѕСЂРѕРєРё РљСЂРѕРЅРё",
    cards: ["F10-R1","F10-R2","F10-R3","F10-R4","F10-R5","F10-R6"],
    bonus: {
      type: "element",
      element: "fire",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРіРЅСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f11",
    name: "РўСЂРѕРЅ Р“Р»РёР±РёРЅ",
    faction: "РўСЂРѕРЅ Р“Р»РёР±РёРЅ",
    cards: ["F11-R1","F11-R2","F11-R3","F11-R4","F11-R5","F11-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f12",
    name: "РћСЂРґРµРЅ РџСЂРёРїР»РёРІСѓ",
    faction: "РћСЂРґРµРЅ РџСЂРёРїР»РёРІСѓ",
    cards: ["F12-R1","F12-R2","F12-R3","F12-R4","F12-R5","F12-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f13",
    name: "Р’С–РґСЊРјРё Р РёС„С–РІ",
    faction: "Р’С–РґСЊРјРё Р РёС„С–РІ",
    cards: ["F13-R1","F13-R2","F13-R3","F13-R4","F13-R5","F13-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f14",
    name: "Р¤Р»РѕС‚ РўРёС€С–",
    faction: "Р¤Р»РѕС‚ РўРёС€С–",
    cards: ["F14-R1","F14-R2","F14-R3","F14-R4","F14-R5","F14-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f15",
    name: "РҐСЂР°РЅРёС‚РµР»С– Р›СЊРѕРґСѓ",
    faction: "РҐСЂР°РЅРёС‚РµР»С– Р›СЊРѕРґСѓ",
    cards: ["F15-R1","F15-R2","F15-R3","F15-R4","F15-R5","F15-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f16",
    name: "РќР°СЂРѕРґ Р”РµР»СЊС‚Рё",
    faction: "РќР°СЂРѕРґ Р”РµР»СЊС‚Рё",
    cards: ["F16-R1","F16-R2","F16-R3","F16-R4","F16-R5","F16-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f17",
    name: "Р–РµСЂС†С– Р›РµРІС–Р°",
    faction: "Р–РµСЂС†С– Р›РµРІС–Р°",
    cards: ["F17-R1","F17-R2","F17-R3","F17-R4","F17-R5","F17-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f18",
    name: "РџРµСЂР»РёРЅРЅРёР№ РљРѕРЅРєР»Р°РІ",
    faction: "РџРµСЂР»РёРЅРЅРёР№ РљРѕРЅРєР»Р°РІ",
    cards: ["F18-R1","F18-R2","F18-R3","F18-R4","F18-R5","F18-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f19",
    name: "РљР»Р°РЅ РҐРІРёР»С–",
    faction: "РљР»Р°РЅ РҐРІРёР»С–",
    cards: ["F19-R1","F19-R2","F19-R3","F19-R4","F19-R5","F19-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f20",
    name: "РђСЂС…С–РІ РњРѕСЂС–РІ",
    faction: "РђСЂС…С–РІ РњРѕСЂС–РІ",
    cards: ["F20-R1","F20-R2","F20-R3","F20-R4","F20-R5","F20-R6"],
    bonus: {
      type: "element",
      element: "water",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РІРѕРґРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f21",
    name: "РљРѕС‡С–РІРЅРёРєРё РќРµР±Р°",
    faction: "РљРѕС‡С–РІРЅРёРєРё РќРµР±Р°",
    cards: ["F21-R1","F21-R2","F21-R3","F21-R4","F21-R5","F21-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f22",
    name: "РћСЂРґРµРЅ Р’С–С‚СЂСѓ",
    faction: "РћСЂРґРµРЅ Р’С–С‚СЂСѓ",
    cards: ["F22-R1","F22-R2","F22-R3","F22-R4","F22-R5","F22-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f23",
    name: "РЇСЃС‚СЂСѓР±Рё Р“СЂРѕР·Рё",
    faction: "РЇСЃС‚СЂСѓР±Рё Р“СЂРѕР·Рё",
    cards: ["F23-R1","F23-R2","F23-R3","F23-R4","F23-R5","F23-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f24",
    name: "Р›С–РіР° Р›РµРІС–С‚Рё",
    faction: "Р›С–РіР° Р›РµРІС–С‚Рё",
    cards: ["F24-R1","F24-R2","F24-R3","F24-R4","F24-R5","F24-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f25",
    name: "Р¦РµС… Р•РЅРґР¶РёРЅР°",
    faction: "Р¦РµС… Р•РЅРґР¶РёРЅР°",
    cards: ["F25-R1","F25-R2","F25-R3","F25-R4","F25-R5","F25-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f26",
    name: "РЎРёРЅРё РЈСЂР°РіР°РЅСѓ",
    faction: "РЎРёРЅРё РЈСЂР°РіР°РЅСѓ",
    cards: ["F26-R1","F26-R2","F26-R3","F26-R4","F26-R5","F26-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f27",
    name: "Р”Р·РІРѕРЅР°СЂС– РќРµР±Р°",
    faction: "Р”Р·РІРѕРЅР°СЂС– РќРµР±Р°",
    cards: ["F27-R1","F27-R2","F27-R3","F27-R4","F27-R5","F27-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f28",
    name: "Р’Р°СЂС‚Р° РџС–РєС–РІ",
    faction: "Р’Р°СЂС‚Р° РџС–РєС–РІ",
    cards: ["F28-R1","F28-R2","F28-R3","F28-R4","F28-R5","F28-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f29",
    name: "РњР°РЅРґСЂС–РІС†С– РђСЃС‚СЂСѓ",
    faction: "РњР°РЅРґСЂС–РІС†С– РђСЃС‚СЂСѓ",
    cards: ["F29-R1","F29-R2","F29-R3","F29-R4","F29-R5","F29-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f30",
    name: "РљРѕРЅРєР»Р°РІ РЎС„РµСЂ",
    faction: "РљРѕРЅРєР»Р°РІ РЎС„РµСЂ",
    cards: ["F30-R1","F30-R2","F30-R3","F30-R4","F30-R5","F30-R6"],
    bonus: {
      type: "element",
      element: "air",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј РїРѕРІС–С‚СЂСЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f31",
    name: "Р”РѕРјС–РЅС–РѕРЅРё РљР°РјРµРЅСЋ",
    faction: "Р”РѕРјС–РЅС–РѕРЅРё РљР°РјРµРЅСЋ",
    cards: ["F31-R1","F31-R2","F31-R3","F31-R4","F31-R5","F31-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f32",
    name: "РћСЂРґРµРЅ РљРѕСЂС–РЅРЅСЏ",
    faction: "РћСЂРґРµРЅ РљРѕСЂС–РЅРЅСЏ",
    cards: ["F32-R1","F32-R2","F32-R3","F32-R4","F32-R5","F32-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f33",
    name: "Р”СЂСѓС—РґРё РЁС‚Р°Р»С–",
    faction: "Р”СЂСѓС—РґРё РЁС‚Р°Р»С–",
    cards: ["F33-R1","F33-R2","F33-R3","F33-R4","F33-R5","F33-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f34",
    name: "РљР»Р°РЅРё Р©РёС‚Р°",
    faction: "РљР»Р°РЅРё Р©РёС‚Р°",
    cards: ["F34-R1","F34-R2","F34-R3","F34-R4","F34-R5","F34-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f35",
    name: "РҐСЂР°РЅРёС‚РµР»С– РњРѕРЅРѕР»С–С‚",
    faction: "РҐСЂР°РЅРёС‚РµР»С– РњРѕРЅРѕР»С–С‚",
    cards: ["F35-R1","F35-R2","F35-R3","F35-R4","F35-R5","F35-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f36",
    name: "РќР°СЂРѕРґ РџРµС‡РµСЂ",
    faction: "РќР°СЂРѕРґ РџРµС‡РµСЂ",
    cards: ["F36-R1","F36-R2","F36-R3","F36-R4","F36-R5","F36-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f37",
    name: "РЎРёРЅРґРёРєР°С‚ РћР±СЃРёРґС–Р°РЅ",
    faction: "РЎРёРЅРґРёРєР°С‚ РћР±СЃРёРґС–Р°РЅ",
    cards: ["F37-R1","F37-R2","F37-R3","F37-R4","F37-R5","F37-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f38",
    name: "РЎС‚РѕСЂРѕР¶С– Р›С–СЃСѓ",
    faction: "РЎС‚РѕСЂРѕР¶С– Р›С–СЃСѓ",
    cards: ["F38-R1","F38-R2","F38-R3","F38-R4","F38-R5","F38-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f39",
    name: "РђСЂС…РѕРЅС‚Рё РџР»РёС‚",
    faction: "РђСЂС…РѕРЅС‚Рё РџР»РёС‚",
    cards: ["F39-R1","F39-R2","F39-R3","F39-R4","F39-R5","F39-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  },
  {
    id: "f40",
    name: "РџР»РµРјРµРЅР° РЎРєРµР»С–",
    faction: "РџР»РµРјРµРЅР° РЎРєРµР»С–",
    cards: ["F40-R1","F40-R2","F40-R3","F40-R4","F40-R5","F40-R6"],
    bonus: {
      type: "element",
      element: "earth",
      value: 0.05,
      text: "+5% РєР°СЂС‚Р°Рј Р·РµРјР»СЏРЅРѕС— СЃС‚РёС…С–С— РЅР° С‚СѓСЂРЅС–СЂС–"
    }
  }
];

// Р“Р»РѕР±Р°Р»СЊРЅРёР№ Р°РєС‚РёРІРЅРёР№ Р±СѓС„РµСЂ Р±РѕРЅСѓСЃС–РІ РєРѕР»РµРєС†С–Р№
let ACTIVE_COLLECTION_BONUSES = [];

// ================================
// CARD NAMES (Berserk-style)
// 4 Houses Г— 40 Factions Г— 6 cards
// ================================
const CARD_NAMES = {
  F01: ["РљС–РїС‚СЏРІРёР№ Р РѕР±С–С‚РЅРёРє","Р РѕР·РїРµС‡РµРЅРёР№ РљР°СЂР°С‚РµР»СЊ","РџР°СЂРѕРІР° Р“Р°СЂРїС–СЏ","Р’РѕРіРЅСЏРЅРёР№ Р‘РµСЂСЃРµСЂРє","РњР°РіРјРѕРІРёР№ Р“РѕР»РµРј","РџРѕР»СѓРјвЂ™СЏРЅРёР№ РўРёС‚Р°РЅ"],
  F02: ["Р—Р°РєС–РїС‚СЋР¶РµРЅРёР№ Р’Р°СЂС‚РѕРІРёР№","Р›Р°С‚СѓРЅРЅРёР№ РњРµС‡РЅРёРє","РџС–С‡РЅРёР№ РЁС‚СѓСЂРјРѕРІРёРє","РљР»РµРїР°РЅРёР№ Р›РёС†Р°СЂ","РљРѕРІР°Р»СЊ Р СѓР№РЅСѓРІР°РЅРЅСЏ","Р’РѕР»РѕРґР°СЂ РџРµС‡РµР№"],
  F03: ["Р†СЃРєСЂРёСЃС‚РёР№ РЈС‡РµРЅСЊ","РџР°СЂРѕРІРёР№ РџС–РґСЂРёРІРЅРёРє","Р•Р»РµРєС‚СЂРѕ-РњСѓС‚Р°РЅС‚","РџСЂРѕРІС–РґРЅРёРєРѕРІРёР№ РњР°Рі","РЇРґСЂРѕРІРёР№ РљРѕРЅС‚СЂРѕР»РµСЂ","РЎРµСЂС†Рµ Р†СЃРєСЂРё"],
  F04: ["РљРѕС‚РµР»СЊРЅРёР№ Р Р°Р±","РћР±РїР°Р»РµРЅРёР№ РћС…РѕСЂРѕРЅРµС†СЊ","РџР°СЂРѕРєСЂРёР»Р° Р“Р°СЂРїС–СЏ","Р’РѕРіРЅРµРЅРЅРёР№ РљРѕРјР°РЅРґРёСЂ","Р”СЂР°РєРѕРЅ РџРµС‡С–","РђРІР°С‚Р°СЂ Р“РѕСЂРЅР°"],
  F05: ["РЁР»Р°РєРѕРІРёР№ РќРѕСЃС–Р№","РњР°РіРјРѕРІРёР№ Р РѕР±С–С‚РЅРёРє","РљРѕРІР°Р»СЊ Р›Р°РЅС†СЋРіС–РІ","РЎРїР»Р°РІРЅРёР№ Р—Р°С…РёСЃРЅРёРє","РњР°Р№СЃС‚РµСЂ Р“РѕСЂРЅР°","РўРёС‚Р°РЅ РњР°РіРјРё"],
  F06: ["Р”РёРјРЅРёР№ РЎРѕР»РґР°С‚","РџР°СЂРѕРІРёР№ РЁС‚СѓСЂРјРѕРІРёРє","Р’СѓР»РєР°РЅС–С‡РЅРёР№ РњРёСЃР»РёРІРµС†СЊ","РљРѕРјР°РЅРґРёСЂ РўРёСЃРєСѓ","Р›РѕСЂРґ РљСЂР°С‚РµСЂР°","РЎРµСЂС†Рµ Р’СѓР»РєР°РЅСѓ"],
  F07: ["Р—Р°РєС–РїС‚СЋР¶РµРЅРёР№ РџС–СЂР°С‚","Р–Р°СЂРѕРІРёР№ РќР°Р»СЊРѕС‚РЅРёРє","РџР°СЂРѕРІРёР№ Р РµР№РґРµСЂ","РљРѕРјР°РЅРґРёСЂ РљР»Р°РЅСѓ","Р’РѕР»РѕРґР°СЂ Р–Р°СЂСѓ","РђРІР°С‚Р°СЂ РљРѕС‚Р»Р°"],
  F08: ["РЎР°Р¶РѕРІРёР№ РџРѕСЃР»СѓС€РЅРёРє","Р”РёРјРЅРёР№ РђСЃР°СЃРёРЅ","РўС–РЅСЊРѕРІРёР№ РџР°Р»С–Р№","РњР°СЃРєРѕРІР°РЅРёР№ Р›С–РґРµСЂ","РњРѕСЂРѕРє РџРµС‡С–","Р‘РµР·Р»РёРєР° РџРѕР¶РµР¶Р°"],
  F09: ["РћС…РѕСЂРѕРЅРµС†СЊ Р‘СЂР°РјРё","Р РѕР·РїРµС‡РµРЅРёР№ РЎС‚СЂР°Р¶","Р›Р°РІРѕРІРёР№ Р—Р°С…РёСЃРЅРёРє","РљРѕРјР°РЅРґРёСЂ Р’РѕСЂС–С‚","РҐСЂР°РЅРёС‚РµР»СЊ РљР°Р»СЊРґРµСЂРё","РЇРґСЂРѕ Р‘СЂР°РјРё"],
  F10: ["РџРѕСЃР»СѓС€РЅРёРє РџРѕР»СѓРјвЂ™СЏ","РџСЂРѕРІС–СЃРЅРёРє Р–Р°СЂСѓ","РџСЂРѕСЂРѕРє Р†СЃРєСЂРё","Р“РѕР»РѕСЃ РџРµС‡С–","РћСЂР°РєСѓР» РџРѕР»СѓРјвЂ™СЏ","Р’С‚С–Р»РµРЅРЅСЏ РљСЂРѕРЅРё"],

  F11: ["РЎР»РёР·СЊРєРёР№ РџР°РґР°Р»СЊРЅРёРє","РўСѓРјР°РЅРЅРёР№ РЎС‚СЂР°Р¶","Р“Р»РёР±РѕРєРѕРІРѕРґРЅРёР№ РњСѓС‚Р°РЅС‚","Р‘РµР·РѕРґРЅС–Р№ РћС…РѕСЂРѕРЅРµС†СЊ","Р›РµРІС–Р°С„Р°РЅ Р“Р»РёР±РёРЅ","РЎРµСЂС†Рµ РђР±С–СЃСѓ"],
  F12: ["РљР°РЅР°Р»СЊРЅРёР№ Р РѕР±С–С‚РЅРёРє","РњРѕРєСЂРёР№ РњРµС…Р°РЅС–Рє","РџСЂРёРїР»РёРІРЅРёР№ РћРїРµСЂР°С‚РѕСЂ","РљРѕРЅС‚СЂРѕР»РµСЂ РќР°СЃРѕСЃС–РІ","РњР°Р№СЃС‚РµСЂ РЁР»СЋР·С–РІ","РЇРґСЂРѕ РўРµС‡С–С—"],
  F13: ["Р РёС„РѕРІРёР№ РЎРїРѕСЃС‚РµСЂС–РіР°С‡","РЎРѕР»РѕРЅР° Р’С–РґСЊРјР°","РўСѓРјР°РЅРЅР° РЎРёСЂРµРЅР°","Р—Р°РєР»РёРЅР°С‚РµР»СЊРєР° Р РёС„Сѓ","РљРѕСЂРѕР»РµРІР° Р“Р»РёР±РёРЅ","РњРѕСЂСЃСЊРєР° РџРѕРіРёР±РµР»СЊ"],
  F14: ["Р”РѕРєРѕРІРёР№ Р’Р°СЂС‚РѕРІРёР№","РњРѕРІС‡Р°Р·РЅРёР№ РњР°С‚СЂРѕСЃ","РўСѓРјР°РЅРЅРёР№ РљР°РїС–С‚Р°РЅ","РљРѕРјР°РЅРґРёСЂ Р¤Р»РѕС‚Сѓ","Р’РѕР»РѕРґР°СЂ Р”РѕРєС–РІ","РџСЂРёРІРёРґ Р“Р°РІР°РЅС–"],
  F15: ["РҐРѕР»РѕРґРЅРёР№ РЎР»СѓР¶РєР°","РљСЂРёР¶Р°РЅРёР№ РћС…РѕСЂРѕРЅРµС†СЊ","РњРѕСЂРѕР·РЅРёР№ РђРґРµРїС‚","РђСЂС…С–РІРЅРёР№ РЎРёРЅРѕРґР°Р»","Р›РѕСЂРґ Р›СЊРѕРґСѓ","Р’С–С‡РЅРёР№ РњРѕСЂРѕР·"],
  F16: ["Р‘РѕР»РѕС‚РЅРѕ-РєР°РЅР°Р»СЊРЅРёР№ Р РѕР±С–С‚РЅРёРє","РЎР»РёР·СЊРєРёР№ РљСѓСЂвЂ™С”СЂ","Р”РµР»СЊС‚РѕРІРёР№ РњСѓС‚Р°РЅС‚","РљРѕРЅС‚СЂРѕР»РµСЂ РЁР»СЋР·С–РІ","Р’РѕР»РѕРґР°СЂ РљР°РЅР°Р»С–РІ","РџРѕРІС–РЅСЊ"],
  F17: ["Р“Р»РёР±РѕРєРёР№ РџРѕСЃР»С–РґРѕРІРЅРёРє","РљСЂРѕРІРѕР¶Р°РґРЅРёР№ Р–СЂРµС†СЊ","РўС–РЅСЊРѕРІРёР№ РљСѓР»СЊС‚РёСЃС‚","Р“РѕР»РѕСЃ Р›РµРІС–Р°С„Р°РЅР°","РџСЂРѕСЂРѕРє Р‘РµР·РѕРґРЅС–","РђРІР°С‚Р°СЂ Р›РµРІС–Р°С„Р°РЅР°"],
  F18: ["РџРµСЂР»РёРЅРЅРёР№ РЎС‚РѕСЂРѕР¶","РќР°РІС–РіР°С‚РѕСЂ Р“Р»РёР±РёРЅ","РњРѕСЂСЃСЊРєРёР№ Р”РёРїР»РѕРјР°С‚","РЎС‚Р°СЂС€РёР№ РљРѕРЅРєР»Р°РІСѓ","Р’РѕР»РѕРґР°СЂ РџРµСЂР»РёРЅ","РЎСѓРґ РњРѕСЂСЏ"],
  F19: ["РњРѕРєСЂРёР№ РќР°Р»СЊРѕС‚РЅРёРє","РЁС‚РѕСЂРјРѕРІРёР№ Р РµР№РґРµСЂ","РџСЂРёР±С–Р№РЅРёР№ РњРёСЃР»РёРІРµС†СЊ","Р’Р°С‚Р°Р¶РѕРє РљР»Р°РЅСѓ","Р’РѕР»РѕРґР°СЂ РҐРІРёР»СЊ","РЁС‚РѕСЂРј"],
  F20: ["РђСЂС…С–РІРЅРёР№ РЈС‡РµРЅСЊ","РҐСЂРѕРЅС–РєР°СЂ РњРѕСЂС–РІ","РљР°СЂС‚РѕРіСЂР°С„ Р“Р»РёР±РёРЅ","РҐСЂР°РЅРёС‚РµР»СЊ Р—РЅР°РЅСЊ","РњР°Р№СЃС‚РµСЂ РђС‚Р»Р°СЃС–РІ","РџР°РјвЂ™СЏС‚СЊ РћРєРµР°РЅСѓ"],

  F21: ["РљСѓСЂвЂ™С”СЂ РџРѕРІС–С‚СЂСЏ","Р›РµС‚СЋС‡РёР№ РЎРєР°СѓС‚","Р”РёСЂРёР¶Р°Р±РµР»СЊРЅРёР№ РЎС‚СЂР°Р¶","РџРѕРІС–С‚СЂСЏРЅРёР№ РљР°РїС–С‚Р°РЅ","Р’РѕР»РѕРґР°СЂ РљР°СЂР°РІР°РЅС–РІ","РљРѕСЂРѕР»СЊ РќРµР±Р°"],
  F22: ["Р РѕС‚РѕСЂРЅРёР№ РЈС‡РµРЅСЊ","Р’С–С‚СЂСЏРЅРёР№ РњРµС…Р°РЅС–Рє","РўСѓСЂР±С–РЅРЅРёР№ Р‘РѕС”С†СЊ","Р†РЅР¶РµРЅРµСЂ РџРѕС‚РѕРєСѓ","РњР°Р№СЃС‚РµСЂ Р’С–С‚СЂСѓ","РЎРµСЂС†Рµ Р‘СѓСЂС–"],
  F23: ["РќРµР±РµСЃРЅРёР№ РЎС‚РѕСЂРѕР¶","РЁС‚РѕСЂРјРѕРІРёР№ РЇСЃС‚СЂСѓР±","Р“СЂРѕР·РѕРІРёР№ РњРёСЃР»РёРІРµС†СЊ","РљРѕРјР°РЅРґРёСЂ Р’РµР¶С–","Р’РѕР»РѕРґР°СЂ Р“СЂРѕРјСѓ","Р‘Р»РёСЃРєР°РІРєР°"],
  F24: ["РџР»Р°С‚С„РѕСЂРјРЅРёР№ Р РѕР±С–С‚РЅРёРє","Р›РµРІС–С‚СѓСЋС‡РёР№ РћС…РѕСЂРѕРЅРµС†СЊ","РџРѕРІС–С‚СЂСЏРЅРёР№ РњР°РЅРµРІСЂРµСЂ","РљРѕРѕСЂРґРёРЅР°С‚РѕСЂ РћСЂР±С–С‚Рё","РњР°Р№СЃС‚РµСЂ Р‘Р°Р»Р°РЅСЃСѓ","Р—СЃСѓРІ РџСЂРѕСЃС‚РѕСЂСѓ"],
  F25: ["РђРµСЂРѕРїРѕСЂС‚РѕРІРёР№ РўРµС…РЅС–Рє","Р”РІРёРіСѓРЅРЅРёР№ РћРїРµСЂР°С‚РѕСЂ","РђРµСЂРѕР±РѕР№РѕРІРёР№ РђСѓС‚РѕРјР°С‚","Р†РЅР¶РµРЅРµСЂ РўСЏРіРё","РђСЂС…С–С‚РµРєС‚РѕСЂ РџРѕР»С‘С‚Сѓ","РЇРґСЂРѕ Р”РІРёРіСѓРЅР°"],
  F26: ["Р’С–С‚СЂСЏРЅРёР№ РЎРѕР»РґР°С‚","РЎРїС–СЂР°Р»СЊРЅРёР№ Р‘РѕС”С†СЊ","РЈСЂР°РіР°РЅРЅРёР№ РњРёСЃР»РёРІРµС†СЊ","РљРѕРјР°РЅРґРёСЂ РџРѕС‚РѕРєСѓ","Р’РѕР»РѕРґР°СЂ РўСѓСЂР±С–РЅ","РћРєРѕ Р‘СѓСЂС–"],
  F27: ["Р”Р·РІС–РЅРєРёР№ РЎР»СѓР¶РєР°","РҐСЂРѕРЅРѕРјРµС‚СЂРёС‡РЅРёР№ Р’Р°СЂС‚РѕРІРёР№","Р РёС‚РјС–С‡РЅРёР№ РљРѕРЅС‚СЂРѕР»РµСЂ","РҐСЂР°РЅРёС‚РµР»СЊ Р§Р°СЃСѓ","Р’РѕР»РѕРґР°СЂ Р РёС‚РјСѓ","Р—СѓРїРёРЅРєР° РњРёС‚С–"],
  F28: ["РЎС‚Р°РЅС†С–Р№РЅРёР№ РћС…РѕСЂРѕРЅРµС†СЊ","Р’РёСЃРѕС‚РЅРёР№ РЎРєР°СѓС‚","РџС–РєРѕРІРёР№ РњРёСЃР»РёРІРµС†СЊ","РљРѕРјР°РЅРґРёСЂ РџСѓРЅРєС‚Сѓ","Р’РѕР»РѕРґР°СЂ Р’РёСЃРѕС‚Рё","РќРµР±РµСЃРЅРёР№ РљСЂР°Р№"],
  F29: ["Р—РѕСЂСЏРЅРёР№ РљСѓСЂвЂ™С”СЂ","РђСЃС‚СЂРѕРЅР°РІС–РіР°С‚РѕСЂ","РћСЂР±С–С‚Р°Р»СЊРЅРёР№ РЎРїРѕСЃС‚РµСЂС–РіР°С‡","РџСЂРѕРІС–РґРЅРёРє РЁР»СЏС…С–РІ","Р’РѕР»РѕРґР°СЂ РњР°СЂС€СЂСѓС‚С–РІ","РљР°СЂС‚Р° РќРµР±Р°"],
  F30: ["РђС‚РјРѕСЃС„РµСЂРЅРёР№ РЈС‡РµРЅСЊ","РљРѕРЅС‚СЂРѕР»РµСЂ РўРёСЃРєСѓ","РЎС„РµСЂРЅРёР№ РћРїРµСЂР°С‚РѕСЂ","РҐСЂР°РЅРёС‚РµР»СЊ РљСѓРїРѕР»Р°","Р’РѕР»РѕРґР°СЂ РЎС„РµСЂ","Р‘Р°Р»Р°РЅСЃ РќРµР±Р°"],

  F31: ["РљР°РјвЂ™СЏРЅРёР№ Р РѕР±С–С‚РЅРёРє","Р‘СЂРѕРЅР·РѕРІРёР№ РћС…РѕСЂРѕРЅРµС†СЊ","РЁРµСЃС‚РµСЂРЅРёР№ Р‘РѕС”С†СЊ","РљРѕРјР°РЅРґРёСЂ РџР»РёС‚","Р’РѕР»РѕРґР°СЂ РљР°РјРµРЅСЋ","РЎРµСЂС†Рµ РќР°РґСЂ"],
  F32: ["РљРѕСЂРµРЅРµРІРёР№ РЎС‚РѕСЂРѕР¶","РњРµС…Р°РЅС–С‡РЅРёР№ Р”РѕРіР»СЏРґР°С‡","Р–РёРІРёР№ РњРµС…Р°РЅС–Р·Рј","РҐСЂР°РЅРёС‚РµР»СЊ РЎРїР»РµС‚С–РЅРЅСЏ","Р’РѕР»РѕРґР°СЂ РљРѕСЂС–РЅРЅСЏ","Р”СЂРµРІРЅС–Р№ РњРѕС‚РѕСЂ"],
  F33: ["Р СѓРЅРЅРёР№ РЈС‡РµРЅСЊ","РЎС‚Р°Р»РµРІРёР№ Р—Р°РєР»РёРЅР°С‡","РњРµС…Р°РЅРѕРґСЂСѓС—Рґ","РџСЂРѕРІС–РґРЅРёРє Р СѓРЅ","Р’РѕР»РѕРґР°СЂ РЎРёРјРІРѕР»С–РІ","Р–РёРІРёР№ РљРѕРґ"],
  F34: ["Р©РёС‚РѕРІРёР№ РќРѕСЃС–Р№","Р‘СЂРѕРЅР·РѕРІРёР№ Р’РѕС—РЅ","Р—Р°С…РёСЃРЅРёРє РљР»Р°РЅСѓ","РљРѕРјР°РЅРґРёСЂ РћР±РѕСЂРѕРЅРё","Р’РѕР»РѕРґР°СЂ Р©РёС‚С–РІ","РќРµРїСЂРѕР±РёРІРЅРёР№"],
  F35: ["РџСЂРµСЃРѕРІРёР№ Р РѕР±С–С‚РЅРёРє","РљР°РјРµСЂРЅРёР№ РћС…РѕСЂРѕРЅРµС†СЊ","РњРѕРЅРѕР»С–С‚РЅРёР№ Р‘РѕС”С†СЊ","РљРѕРЅС‚СЂРѕР»РµСЂ РўРёСЃРєСѓ","Р’РѕР»РѕРґР°СЂ РџСЂРµСЃС–РІ","РђР±СЃРѕР»СЋС‚РЅР° РњР°СЃР°"],
  F36: ["РЁР°С…С‚РЅРёР№ РЎС‚РѕСЂРѕР¶","РџС–РґР·РµРјРЅРёР№ Р РѕР±С–С‚РЅРёРє","Р–РёР»СЊРЅРёР№ РњСѓС‚Р°РЅС‚","РџСЂРѕРІС–РґРЅРёРє Р“Р»РёР±РёРЅ","Р’РѕР»РѕРґР°СЂ РџРµС‡РµСЂ","РўРµРјСЂСЏРІР° РќР°РґСЂ"],
  F37: ["РљРѕРЅС‚СЂР°РєС‚РЅРёР№ Р’РёРєРѕРЅР°РІРµС†СЊ","РћР±СЃРёРґС–Р°РЅРѕРІРёР№ РђРґРІРѕРєР°С‚","РљРѕР»РµРєС‚РѕСЂ Р‘РѕСЂРіС–РІ","РђСЂР±С–С‚СЂ РЈРіРѕРґ","Р’РѕР»РѕРґР°СЂ РљРѕРЅС‚СЂР°РєС‚С–РІ","Р§РѕСЂРЅР° РџРµС‡Р°С‚РєР°"],
  F38: ["Р›С–СЃРѕРІРёР№ РћС…РѕСЂРѕРЅРµС†СЊ","РњРµС…Р°РЅС–С‡РЅРёР№ Р„РіРµСЂ","РљРѕСЂРµРЅРµРІРёР№ РЎС‚СЂР°Р¶","РҐСЂР°РЅРёС‚РµР»СЊ РџРѕСЂС‚Р°Р»Сѓ","Р’РѕР»РѕРґР°СЂ Р“Р°СЋ","Р–РёРІРёР№ Р›С–СЃ"],
  F39: ["РўРµРєС‚РѕРЅС–С‡РЅРёР№ Р РѕР±С–С‚РЅРёРє","РџР»РёС‚РЅРёР№ Р’РѕС—РЅ","Р—СЃСѓРІРЅРёР№ Р‘РѕС”С†СЊ","РљРѕРЅС‚СЂРѕР»РµСЂ Р РѕР·Р»РѕРјСѓ","Р’РѕР»РѕРґР°СЂ РџР»РёС‚","Р РѕР·Р»РѕРј"],
  F40: ["РљР°СЂвЂ™С”СЂРЅРёР№ Р РѕР±С–С‚РЅРёРє","РљР°РјРµРЅРѕР»РѕРј","РЎРєРµР»СЊРЅРёР№ Р—Р°С…РёСЃРЅРёРє","РљРѕРјР°РЅРґРёСЂ РљР°СЂвЂ™С”СЂСѓ","Р’РѕР»РѕРґР°СЂ РЎРєРµР»СЊ","Р’С–С‡РЅР° Р‘СЂРёР»Р°"]
};

window.CARD_NAMES = CARD_NAMES;

// РњРЅРѕР¶РЅРёРєРё СЂС–РґРєРѕСЃС‚С–
const RARITY_MULTIPLIERS = {
  "R1": { value: 1.00, name: "common", displayName: "Р—РІРёС‡Р°Р№РЅР°" },
  "R2": { value: 1.10, name: "uncommon", displayName: "РќРµР·РІРёС‡Р°Р№РЅР°" },
  "R3": { value: 1.25, name: "rare", displayName: "Р С–РґРєС–СЃРЅР°" },
  "R4": { value: 1.45, name: "epic", displayName: "Р•РїС–С‡РЅР°" },
  "R5": { value: 1.70, name: "legendary", displayName: "Р›РµРіРµРЅРґР°СЂРЅР°" },
  "R6": { value: 2.00, name: "mythic", displayName: "РњС–С„С–С‡РЅР°" }
};

/**
 * Р‘Р°Р»Р°РЅСЃ СЃРёР» (Р»С–РЅС–Р№РЅР° РїСЂРѕРєР°С‡РєР°):
 *  - R1 / СЃС‚Р°СЂС‚РѕРІС–: +10 Р·Р° СЂС–РІРµРЅСЊ
 *  - R2: +20
 *  - R3: +50
 *  - R4: +100
 *  - R5: +500
 *  - R6: +500
 *
 * Р‘Р°Р·Р° (РґС–Р°РїР°Р·РѕРЅРё РїРѕ СЂС–РґРєРѕСЃС‚С–):
 *  - R1: 12..100
 *  - R2: 30..140
 *  - R3: 60..220
 *  - R4: 100..320
 *  - R5: 160..450
 *  - R6: 250..650
 */

const RARITY_BASE_RANGES = {
  R1: [12, 100],
  R2: [30, 140],
  R3: [60, 220],
  R4: [100, 320],
  R5: [160, 450],
  R6: [250, 650]
};

function lerp(min, max, t) {
  return Math.round(min + (max - min) * t);
}

// Р„РґРёРЅРµ РґР¶РµСЂРµР»Рѕ С–СЃС‚РёРЅРё РґР»СЏ СЃРёР»Рё РєР°СЂС‚Рё Р· СѓСЂР°С…СѓРІР°РЅРЅСЏРј СЂС–РІРЅСЏ
if (typeof window !== 'undefined' && typeof window.getPower === 'undefined') {
  window.getPower = function getPower(card, level = 1) {
    const lvl = Math.max(1, Number(level) || 1);
    const rarityId = (card.rarityId || card.rarity || 'R1').toString().toUpperCase();
    const incByRarity = { R1: 10, R2: 20, R3: 50, R4: 100, R5: 500, R6: 500 };
    const inc = incByRarity[rarityId] ?? 10;
    const base = Number(card.basePower) || 0;
    const upgradedPower = Math.round(base + inc * (lvl - 1));

    // Р—Р°СЃС‚РѕСЃСѓРІР°С‚Рё Р±РѕРЅСѓСЃРё РєРѕР»РµРєС†С–Р№
    return window.applyCollectionBonus ? window.applyCollectionBonus(card, upgradedPower) : upgradedPower;
  };
}

// Р“Р»РѕР±Р°Р»СЊРЅР° С„СѓРЅРєС†С–СЏ РґР»СЏ Р±РѕРЅСѓСЃС–РІ РєРѕР»РµРєС†С–Р№
if (typeof window !== 'undefined' && typeof window.applyCollectionBonus === 'undefined') {
  window.applyCollectionBonus = function applyCollectionBonus(card, basePower) {
    let power = basePower;

    (window.ACTIVE_COLLECTION_BONUSES || []).forEach(b => {
      if (b.type === "element" && card.element === b.element) {
        power *= (1 + b.value);
      }
    });

    return Math.round(power);
  };
}

// Р“РµРЅРµСЂР°С†С–СЏ РІСЃС–С… 240 РєР°СЂС‚
const ALL_CARDS = [];

// Р•Р»РµРјРµРЅС‚Рё РїРѕ СЂС–РґРєРѕСЃС‚С– (С„СЂР°РєС†С–СЏ РјРѕР¶Рµ РјР°С‚Рё СЂС–Р·РЅС– РµР»РµРјРµРЅС‚Рё)
const ELEMENTS_BY_RARITY = ["fire","water","air","earth","fire","water"];

// Card type detection by name
function getCardTypeByName(name){
  const n = (name || '').toLowerCase();

  if (n.includes("РіР°СЂРї") || n.includes("РїС–СЂР°РЅ") || n.includes("СЏСЃС‚СЂСѓР±") || n.includes("СЃРёСЂРµРЅ") || n.includes("СЃРёСЂРµРЅ"))
    return "creature";

  if (n.includes("РіРѕР»РµРј") || n.includes("РєРѕР»РѕСЃ") || n.includes("С‚РёС‚Р°РЅ") || n.includes("Р°СѓС‚РѕРјР°С‚") || n.includes("Р°РІС‚РѕРјР°С‚"))
    return "construct";

  if (n.includes("Р°СЂС…РѕРЅС‚") || n.includes("РїСЂРѕСЂРѕРє") || n.includes("РѕСЂР°РєР»") || n.includes("РѕСЂР°РєСѓР»") || n.includes("Р¶СЂРµС†СЊ") || n.includes("РїСЂРѕСЂРѕРє"))
    return "caster";

  if (n.includes("СЏРґСЂРѕ") || n.includes("СЃРµСЂС†Рµ") || n.includes("С€С‚РѕСЂРј") || n.includes("СЂРѕР·Р»РѕРј") || n.includes("С€С‚СѓСЂРј"))
    return "entity";

  return "unit";
}

// Icon map by card type (paths relative to project)
const CARD_TYPE_ICON = {
  unit: "./icons/unit.png",
  creature: "./icons/creature.png",
  construct: "./icons/construct.png",
  caster: "./icons/caster.png",
  entity: "./icons/entity.png"
};

function getCardIcon(card){
  const type = getCardTypeByName(card.name || '');
  return CARD_TYPE_ICON[type] || CARD_TYPE_ICON.unit;
}

function getCardArt(card){
  const prefix = location.pathname.toLowerCase().includes('/pages/') ? '../../' : './';
  // 1. explicit image
  if (card && card.image) return card.image;

  // If card object contains art/artFile/element use arts folder or element default
  try {
    if (card) {
      if (card.art && typeof card.art === 'string' && card.art.trim()) return card.art;
      if (card.artFile && typeof card.artFile === 'string' && card.artFile.trim()) {
        let f = String(card.artFile).trim();
        if (!/\.[a-z0-9]+$/i.test(f)) f = f + '.webp';
        return `${prefix}assets/cards/arts/${f}`;
      }
      if (card.element && typeof card.element === 'string' && card.element.trim()) return `${prefix}assets/cards/arts/${String(card.element).trim()}_001.webp`;
    }
  } catch (e) { /* ignore */ }

  // 2. by ID
  const rawId = card && card.id ? String(card.id) : null;
  if (rawId) {
    const idUp = rawId.toUpperCase();
    // direct match (e.g. F01-R1, S01)
    const candidates = [];
    candidates.push(`./assets/cards/${idUp}.png`);
    candidates.push(`./assets/cards/${idUp}.jpg`);

    // try padding numeric part for starter ids like S1 -> S01
    const m = idUp.match(/^([A-Z])(\d{1,2})(.*)$/);
    if (m) {
      const prefix = m[1];
      const num = m[2].padStart(2,'0');
      const rest = m[3] || '';
      const padded = `${prefix}${num}${rest}`;
      if (padded !== idUp) {
        candidates.push(`./assets/cards/${padded}.png`);
        candidates.push(`./assets/cards/${padded}.jpg`);
      }
    }

    // try lowercase variants
    const idLow = rawId.toLowerCase();
    candidates.push(`./assets/cards/${idLow}.png`);
    candidates.push(`./assets/cards/${idLow}.jpg`);

    // return first candidate path (we don't check FS here)
    for (const c of candidates) {
      if (c) return c;
    }
  }

  // 3. fallback by type
  const type = getCardTypeByName(card && card.name ? card.name : '');
  return `./assets/cards/types/${type}.png`;
}

for (let factionNum = 1; factionNum <= 40; factionNum++) {
  const factionId = `F${String(factionNum).padStart(2, '0')}`;
  const factionName = FACTION_NAMES[factionId];
  const cardNames = CARD_NAMES[factionId];

  // РґРµС‚РµСЂРјС–РЅРѕРІР°РЅР° РїРѕР·РёС†С–СЏ РІ РґС–Р°РїР°Р·РѕРЅС– 0..1 (С‰РѕР± Р±Р°Р·Рё Р±СѓР»Рё СЃС‚Р°Р±С–Р»СЊРЅС–)
  const t = (factionNum - 1) / 39;

  for (let rarityNum = 1; rarityNum <= 6; rarityNum++) {
    const rarityId = `R${rarityNum}`;
    const cardId = `${factionId}-${rarityId}`;
    // РµР»РµРјРµРЅС‚ С‚РµРїРµСЂ РІРёР·РЅР°С‡Р°С”С‚СЊСЃСЏ РїРѕ С„СЂР°РєС†С–С—; СЏРєС‰Рѕ РЅРµРјР°С” РјР°РїРё вЂ” С„РѕР»Р±РµРє РЅР° СЂС–РґРєС–СЃС‚СЊ
    const element = (FACTION_ELEMENTS && FACTION_ELEMENTS[factionId]) ? FACTION_ELEMENTS[factionId] : ELEMENTS_BY_RARITY[rarityNum - 1]; // РµР»РµРјРµРЅС‚ Р·Р°Р»РµР¶РёС‚СЊ РІС–Рґ С„СЂР°РєС†С–С—
    const rarityData = RARITY_MULTIPLIERS[rarityId];

    // РќРѕРІР° Р±Р°Р·Р° РїРѕ РґС–Р°РїР°Р·РѕРЅР°С… (Р·Р°РјС–СЃС‚СЊ РјРЅРѕР¶РµРЅРЅСЏ rarity multiplier)
    const [minP, maxP] = RARITY_BASE_RANGES[rarityId] || RARITY_BASE_RANGES.R1;
    const finalPower = lerp(minP, maxP, t);
    
    // upgradeMult РґР»СЏ СЃРёСЃС‚РµРјРё РїСЂРѕРєР°С‡РєРё (Р·Р°Р»РµР¶РёС‚СЊ РІС–Рґ СЂС–РґРєРѕСЃС‚С–)
    // Р§РёРј СЂС–РґРєС–СЃРЅС–С€Р° РєР°СЂС‚Р°, С‚РёРј РјРµРЅС€РёР№ РїСЂРёСЂС–СЃС‚ РїСЂРё РїСЂРѕРєР°С‡С†С– (Р±Р°Р»Р°РЅСЃ)
    const upgradeMult = {
      1: 1.15, // common - С€РІРёРґРєРµ Р·СЂРѕСЃС‚Р°РЅРЅСЏ
      2: 1.13, // uncommon
      3: 1.11, // rare
      4: 1.09, // epic
      5: 1.07, // legendary
      6: 1.05  // mythic - РїРѕРІС–Р»СЊРЅРµ Р·СЂРѕСЃС‚Р°РЅРЅСЏ, Р°Р»Рµ РІРёСЃРѕРєР° Р±Р°Р·Р°
    }[rarityNum];
    
    const name = (CARD_NAMES[factionId] && CARD_NAMES[factionId][rarityNum - 1]) || (cardNames && cardNames[rarityNum - 1]) || `Card ${cardId}`;
    const icon = getCardIcon({ name });
    const image = getCardArt({ id: cardId, name });

    ALL_CARDS.push({
      id: cardId,
      element: element,
      faction: factionId,
      factionName: factionName,
      // РЇРІРЅРѕ РїСЂРёСЃРІРѕСЋС”РјРѕ rarity РґР»СЏ РєРѕР¶РЅРѕС— РєР°СЂС‚Рё (РІР°Р¶Р»РёРІРѕ РґР»СЏ CSS-СЂР°РјРѕРє)
      rarity: rarityData.name, // "common", "uncommon", ...
      rarityId: rarityId,      // "R1".."R6"
      rarityName: rarityData.name,
      rarityDisplay: rarityData.displayName,
      basePower: finalPower,
      multiplier: 1.0,
      upgradeMult: upgradeMult,
      attack: finalPower,
      defense: Math.round(finalPower * 0.8),
      name: name,
      icon: icon,
      image: image
    });
  }
}

// РЎС‚Р°СЂС‚РѕРІРёР№ РЅР°Р±С–СЂ РєР°СЂС‚ (16 С€С‚), СѓСЃС– РјР°СЋС‚СЊ СЃРёР»Сѓ 12
const STARTER_CARDS = [
  { id:'S01', name:'Р†СЃРєСЂРёСЃС‚РёР№ РќРѕРІРѕР±СЂР°РЅРµС†СЊ', element:'fire',  faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S02', name:'Р–Р°СЂРѕРІРёР№ Р‘РѕС”С†СЊ',        element:'fire',  faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S03', name:'РџС–С‡РЅРёР№ Р’Р°СЂС‚РѕРІРёР№',      element:'fire',  faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S04', name:'РљРѕС‡РµРіР°СЂ Р“РѕСЂРЅР°',         element:'fire',  faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S05', name:'РўСѓРјР°РЅРЅРёР№ РњР°С‚СЂРѕСЃ',       element:'water', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S06', name:'Р“С–РґСЂР°РІР»С–С‡РЅРёР№ РЎС‚РѕСЂРѕР¶',   element:'water', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S07', name:'РљР°РЅР°Р»СЊРЅРёР№ РџСЂРѕРІС–РґРЅРёРє',   element:'water', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S08', name:'Р РµР·РµСЂРІРЅРёР№ РћС…РѕСЂРѕРЅРµС†СЊ',   element:'water', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S09', name:'Р’С–С‚СЂСЏРЅРёР№ РљСѓСЂвЂ™С”СЂ',       element:'air',   faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S10', name:'РђРµСЂРѕС‚РµС…РЅС–Рє',             element:'air',   faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S11', name:'РЎРёРіРЅР°Р»СЊРЅРёР№ РЎРїРѕСЃС‚РµСЂС–РіР°С‡',element:'air',   faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S12', name:'РўСѓСЂР±С–РЅРЅРёР№ Р’Р°СЂС‚РѕРІРёР№',    element:'air',   faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S13', name:'Р”РѕРєРѕРІРёР№ Р РѕР±С–С‚РЅРёРє',      element:'earth', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S14', name:'РџС–РґР№РѕРјРЅРёР№ РЎС‚РѕСЂРѕР¶',      element:'earth', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S15', name:'РЁР°С…С‚РЅРёР№ Р’Р°СЂС‚РѕРІРёР№',      element:'earth', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 },
  { id:'S16', name:'РћСЃР°РґРЅРёР№ РўРµС…РЅС–Рє',        element:'earth', faction:'S', factionName:'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ', rarity:'common', rarityDisplay:'Р—РІРёС‡Р°Р№РЅР°', basePower:12, multiplier:1.0, upgradeMult:1.0, attack:12, defense:0 }
];

ALL_CARDS.push(...STARTER_CARDS);

// Р”РѕРґР°С‚Рё РєРѕР»РµРєС†С–СЋ РґР»СЏ СЃС‚Р°СЂС‚РѕРІРёС… РєР°СЂС‚ (РІСЃС– РєР°СЂС‚Рё Р·С– STARTER_CARDS)
if (typeof COLLECTIONS !== 'undefined' && Array.isArray(COLLECTIONS)) {
  COLLECTIONS.unshift({
    id: 'starter',
    name: 'РЎС‚Р°СЂС‚РѕРІС–',
    faction: 'РЎС‚Р°СЂС‚РѕРІРёР№ РќР°Р±С–СЂ',
    cards: STARTER_CARDS.map(c => c.id),
    bonus: { type: 'none', value: 0, text: 'РЎС‚Р°СЂС‚РѕРІРёР№ РЅР°Р±С–СЂ вЂ” Р±РѕРЅСѓСЃ РІС–РґСЃСѓС‚РЅС–Р№' }
  });
}

/**
 * РЁРІРёРґРєРёР№ С–РЅРґРµРєСЃ РєР°СЂС‚ Р·Р° ID
 */
const CARDS_BY_ID = Object.fromEntries(
  ALL_CARDS.map(card => [card.id, card])
);

/**
 * Р“СЂСѓРїСѓРІР°РЅРЅСЏ РєР°СЂС‚ РїРѕ СЃС‚РёС…С–СЏС…
 */
const CARDS_BY_ELEMENT = ALL_CARDS.reduce((acc, card) => {
  if (!acc[card.element]) {
    acc[card.element] = [];
  }
  acc[card.element].push(card);
  return acc;
}, {});

/**
 * Р“СЂСѓРїСѓРІР°РЅРЅСЏ РєР°СЂС‚ РїРѕ С„СЂР°РєС†С–СЏС…
 */
const CARDS_BY_FACTION = ALL_CARDS.reduce((acc, card) => {
  if (!acc[card.faction]) {
    acc[card.faction] = [];
  }
  acc[card.faction].push(card);
  return acc;
}, {});

// РҐРµР»РїРµСЂРё РґР»СЏ РґРѕСЃС‚СѓРїСѓ РґРѕ СЃС‚Р°СЂС‚РѕРІРёС… С‚Р° СѓСЃС–С… РєР°СЂС‚
const getAllCardIds = () => ALL_CARDS.map(card => card.id);
const getStarterCardIds = () => STARTER_CARDS.map(card => card.id);
const getRandomStarterCardIds = (count = 9) => {
  const ids = [...getStarterCardIds()];

  // Fisher-Yates shuffle РґР»СЏ С‡РµСЃРЅРѕРіРѕ РІРёРїР°РґРєРѕРІРѕРіРѕ РїРѕСЂСЏРґРєСѓ
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  return ids.slice(0, Math.min(count, ids.length));
};

// Р›РѕРєР°Р»СЊРЅРёР№ РїРѕС€СѓРє Р±РµР· РєРѕРЅС„Р»С–РєС‚Сѓ Р· РіР»РѕР±Р°Р»СЊРЅРёРјРё РѕРіРѕР»РѕС€РµРЅРЅСЏРјРё
function lookupCardById(id) {
  return CARDS_BY_ID[id] || null;
}

/**
 * Р“СЂСѓРїСѓРІР°РЅРЅСЏ РєР°СЂС‚ РїРѕ СЂС–РґРєРѕСЃС‚С–
 */
const CARDS_BY_RARITY = ALL_CARDS.reduce((acc, card) => {
  if (!acc[card.rarity]) {
    acc[card.rarity] = [];
  }
  acc[card.rarity].push(card);
  return acc;
}, {});

// Р•РєСЃРїРѕСЂС‚СѓС”РјРѕ РіР»РѕР±Р°Р»СЊРЅРѕ РґР»СЏ Р±СЂР°СѓР·РµСЂР°
window.ALL_CARDS = ALL_CARDS;
window.CARDS_BY_ID = CARDS_BY_ID;
window.CARDS_BY_ELEMENT = CARDS_BY_ELEMENT;
window.CARDS_BY_FACTION = CARDS_BY_FACTION;
window.CARDS_BY_RARITY = CARDS_BY_RARITY;
window.FACTION_NAMES = FACTION_NAMES;
window.RARITY_MULTIPLIERS = RARITY_MULTIPLIERS;
window.STARTER_CARDS = STARTER_CARDS;
window.COLLECTIONS = COLLECTIONS;
window.ACTIVE_COLLECTION_BONUSES = ACTIVE_COLLECTION_BONUSES;

// Р“Р»РѕР±Р°Р»СЊРЅС– С„СѓРЅРєС†С–С— РґР»СЏ РґРѕСЃС‚СѓРїСѓ РґРѕ РєР°СЂС‚
window.CARDS = ALL_CARDS;

// РџРѕРІРµСЂС‚Р°С” С€Р»СЏС… РґРѕ Р·РѕР±СЂР°Р¶РµРЅРЅСЏ РєР°СЂС‚Рё (РїРµСЂРµРІР°РіР° РїРѕР»СЋ `image` РІ РѕР±'С”РєС‚С– РєР°СЂС‚Рё)
window.getCardImage = function(cardOrId) {
  const FALLBACK_IMG = '';
  if (!cardOrId) return FALLBACK_IMG;

  let card = null;
  let id = null;
  if (typeof cardOrId === 'string') {
    id = cardOrId;
    card = (window.getCardById ? window.getCardById(id) : null) || window.CARDS_BY_ID?.[id] || null;
  } else if (typeof cardOrId === 'object') {
    card = cardOrId;
    id = card.cardId || card.id || null;
    if (id && typeof id === 'object') id = id.id || null;
  }

  if (card && card.image) return card.image;

  // special mapping for a few legacy ids
  const idToImg = {
    'card_001': `${prefix}assets/cards/s01.png`,
    'card_002': `${prefix}assets/cards/s02.png`,
    'card_003': `${prefix}assets/cards/s03.png`,
    'card_004': `${prefix}assets/cards/s04.jpg`
  };
  if (id && idToImg[id]) return idToImg[id];

  // Determine faction id (if available) to allow faction-wide images
  let factionId = null;
  try {
    if (card && card.faction) factionId = card.faction;
    // if id looks like "F01-R1" or "F01-R2" use prefix
    if (!factionId && id && typeof id === 'string' && id.indexOf('-') !== -1) {
      factionId = id.split('-')[0];
    }
  } catch (e) { factionId = null; }

  // Build faction image candidates (assets/factions)
  const factionCandidates = [];
  if (factionId) {
    const fUp = String(factionId).toUpperCase();
    const fLow = String(factionId).toLowerCase();
    factionCandidates.push(`${prefix}assets/factions/${fUp}.png`);
    factionCandidates.push(`${prefix}assets/factions/${fUp}.jpg`);
    factionCandidates.push(`${prefix}assets/factions/${fLow}.png`);
    factionCandidates.push(`${prefix}assets/factions/${fLow}.jpg`);
    factionCandidates.push(`${prefix}assets/factions/${factionId}.png`);
    factionCandidates.push(`${prefix}assets/factions/${factionId}.jpg`);
  }

  if (id) {
    const up = String(id).toUpperCase();
    const low = String(id).toLowerCase();
    const candidates = [];
    const artsCandidates = [];
    try {
      const cleaned = String(id).replace(/[^a-z0-9]/gi, '_');
      const parts = String(id).split(/[^a-z0-9]+/i).filter(Boolean);
      const last = parts.length ? parts[parts.length - 1] : '';
      const padded = (/^\d+$/.test(last) ? String(Number(last)).padStart(3, '0') : '');

      artsCandidates.push(`${prefix}assets/cards/arts/${up}.webp`);
      artsCandidates.push(`${prefix}assets/cards/arts/${low}.webp`);
      artsCandidates.push(`${prefix}assets/cards/arts/${id}.webp`);
      artsCandidates.push(`${prefix}assets/cards/arts/${cleaned}.webp`);
      if (last) artsCandidates.push(`${prefix}assets/cards/arts/${last}.webp`);
      if (padded) artsCandidates.push(`${prefix}assets/cards/arts/${padded}.webp`);

      // only .webp variants (project uses webp for arts)
    } catch (e) { /* ignore */ }
    if (artsCandidates.length) candidates.push(...artsCandidates);
    // Prefer assets folder with uppercase names (we copied files there)
    // If desired, enable window.PREFER_FACTION_IMAGES = true to use faction images
    // before per-card images.
    const preferFaction = !!window.PREFER_FACTION_IMAGES;
    if (preferFaction && factionCandidates.length) {
      candidates.push(...factionCandidates);
    }
    candidates.push(`./assets/cards/${up}.png`);
    candidates.push(`./assets/cards/${up}.jpg`);
    candidates.push(`./assets/cards/${low}.png`);
    candidates.push(`./assets/cards/${low}.jpg`);
    candidates.push(`./assets/cards/${id}.png`);
    candidates.push(`./assets/cards/${id}.jpg`);

    // If not preferring faction images, try faction images as a fallback
    if (!preferFaction && factionCandidates.length) {
      candidates.push(...factionCandidates);
    }

    // Then legacy cards folder (lowercase filenames first)
    candidates.push(`./cards/${low}.png`);
    candidates.push(`./cards/${low}.jpg`);
    candidates.push(`./cards/${id}.png`);
    candidates.push(`./cards/${id}.jpg`);

    // Return first candidate path (we can't check file existence synchronously here).
    // Ordering chosen to match actual files copied into `assets/cards`.
    for (const c of candidates) {
      if (c) return c;
    }
  }

  return FALLBACK_IMG;
};

// Р‘С‹СЃС‚СЂС‹Р№ СЂРµРЅРґРµСЂ-РєР°СЂС‚С‹: РІРѕР·РІСЂР°С‰Р°РµС‚ HTML СЃС‚СЂСѓРєС‚СѓСЂС‹ РєР°СЂС‚С‹ СЃ Р°СЂС‚-Р±Р»РѕРєРѕРј Рё РѕРІРµСЂР»РµРµРј UI
window.renderCard = function(card) {
  const img = window.getCardImage(card);
  return `
    <div class="card">
      <div class="card-art-frame">
        <img class="card-art-img" src="${img}" alt="${card.name}">
      </div>
      <div class="card-overlay">
        <div class="card-element ${card.element || ''}"></div>
        <div class="card-power">${card.basePower || card.attack || 0}</div>
      </div>
    </div>
  `;
};

if (!window.getCardById) {
  window.getCardById = function(id) {
    return lookupCardById(id);
  };
}

window.getAllCardIds = function() {
  return getAllCardIds();
};

window.getStarterCardIds = function() {
  return getStarterCardIds();
};

window.getRandomStarterCardIds = function(count = 9) {
  return getRandomStarterCardIds(count);
};

window.getCardsByElement = function(element) {
  return CARDS_BY_ELEMENT[element] || [];
};

window.getCardsByFaction = function(factionId) {
  return CARDS_BY_FACTION[factionId] || [];
};

window.getCardsByRarity = function(rarity) {
  return CARDS_BY_RARITY[rarity] || [];
};

// Node/CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CARDS: ALL_CARDS,
    STARTER_CARDS,
    getAllCardIds,
    getStarterCardIds,
    getRandomStarterCardIds,
    getCardById: lookupCardById,
    CARDS_BY_ID,
    CARDS_BY_ELEMENT,
    CARDS_BY_FACTION,
    CARDS_BY_RARITY
  };
}


/* ===== js/game/power.js ===== */
/**
 * РЎРРЎРўР•РњРђ Р РћР—Р РђРҐРЈРќРљРЈ РЎРР›Р РљРђР Рў
 * 
 * Р¤РѕСЂРјСѓР»Р° РїСЂРѕРєР°С‡РєРё:
 * power(level) = basePower * (upgradeMult) ^ (level - 1)
 * 
 * РџСЂРёРєР»Р°РґРё:
 * - Level 1: 10 * 1.12^0 = 10
 * - Level 2: 10 * 1.12^1 = 11.2 в‰€ 11
 * - Level 3: 10 * 1.12^2 = 12.54 в‰€ 13
 * - Level 5: 10 * 1.12^4 = 15.73 в‰€ 16
 */

/**
 * РћС‚СЂРёРјР°С‚Рё РїРѕС‚РѕС‡РЅСѓ СЃРёР»Сѓ РєР°СЂС‚Рё РїСЂРё РїРµРІРЅРѕРјСѓ СЂС–РІРЅС–
 * 
 * @param {Object} card - РѕР±'С”РєС‚ РєР°СЂС‚Рё Р· basePower С‚Р° upgradeMult
 * @param {number} level - СЂС–РІРµРЅСЊ РїСЂРѕРєР°С‡РєРё (РјС–РЅ 1)
 * @returns {number} РѕРєСЂСѓРіР»РµРЅР° СЃРёР»Р° РєР°СЂС‚Рё
 */
function getPower(card, level = 1) {
  if (!card) return 0;

  // Р•СЃР»Рё РµСЃС‚СЊ basePower вЂ” РёСЃРїРѕР»СЊР·СѓРµРј С„РѕСЂРјСѓР»Сѓ РїСЂРѕРєР°С‡РєРё
  if (typeof card.basePower === 'number' && !isNaN(card.basePower) && card.basePower > 0) {
    const lvl = Math.max(1, Math.floor(level));
    const multiplier = card.upgradeMult || 1.1;
    const power = card.basePower * Math.pow(multiplier, lvl - 1);
    return Math.round(power);
  }

  // Р•СЃР»Рё basePower РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚, РЅРѕ СѓР¶Рµ РµСЃС‚СЊ СЂР°СЃСЃС‡РёС‚Р°РЅРЅРѕРµ РїРѕР»Рµ `power` вЂ” РёСЃРїРѕР»СЊР·СѓРµРј РµРіРѕ
  if (typeof card.power === 'number' && !isNaN(card.power)) {
    return Math.round(card.power);
  }

  // Р’ РѕСЃС‚Р°Р»СЊРЅС‹С… СЃР»СѓС‡Р°СЏС… Р»РѕРіРёСЂСѓРµРј РѕРґРЅРѕ РїСЂРµРґСѓРїСЂРµР¶РґРµРЅРёРµ Рё РІРѕР·РІСЂР°С‰Р°РµРј 0
  console.warn('Invalid card or missing basePower and power:', card);
  return 0;
}

/**
 * РћС‚СЂРёРјР°С‚Рё РјР°СЃРёРІ СЃРёР» РєР°СЂС‚Рё РїСЂРё СЂС–Р·РЅРёС… СЂС–РІРЅСЏС…
 * РћС‚СЂРёРјР°С‚Рё РјР°СЃРёРІ СЃРёР» РєР°СЂС‚Рё РїСЂРё СЂС–Р·РЅРёС… СЂС–РІРЅСЏС…
 * РљРѕСЂРёСЃРЅРѕ РґР»СЏ РІС–РґРѕР±СЂР°Р¶РµРЅРЅСЏ С‚Р°Р±Р»РёС†С– РїСЂРѕРєР°С‡РєРё
 * 
 * @param {Object} card - РѕР±'С”РєС‚ РєР°СЂС‚Рё
 * @param {number} maxLevel - РјР°РєСЃРёРјР°Р»СЊРЅРёР№ СЂС–РІРµРЅСЊ РґР»СЏ РїРѕРєР°Р·Сѓ
 * @returns {Array} РјР°СЃРёРІ [level, power]
 */
function getPowerProgression(card, maxLevel = 20) {
  const progression = [];
  for (let level = 1; level <= maxLevel; level++) {
    progression.push({
      level,
      power: getPower(card, level)
    });
  }
  return progression;
}

/**
 * РћС‚СЂРёРјР°С‚Рё РїСЂРёСЂС–СЃС‚ СЃРёР»Рё РїСЂРё РїРµСЂРµС…РѕРґС– РјС–Р¶ СЂС–РІРЅСЏРјРё
 * 
 * @param {Object} card - РѕР±'С”РєС‚ РєР°СЂС‚Рё
 * @param {number} fromLevel - РІС–Рґ СЏРєРѕРіРѕ СЂС–РІРЅСЏ
 * @param {number} toLevel - РґРѕ СЏРєРѕРіРѕ СЂС–РІРЅСЏ
 * @returns {number} РїСЂРёСЂС–СЃС‚ СЃРёР»Рё (С‡РёСЃР»o)
 */
function getPowerGain(card, fromLevel, toLevel) {
  const from = getPower(card, fromLevel);
  const to = getPower(card, toLevel);
  return to - from;
}

/**
 * РћС‚СЂРёРјР°С‚Рё РІС–РґСЃРѕС‚РѕРє РїСЂРёСЂРѕСЃС‚Сѓ СЃРёР»Рё
 * 
 * @param {Object} card - РѕР±'С”РєС‚ РєР°СЂС‚Рё
 * @param {number} fromLevel - РІС–Рґ СЏРєРѕРіРѕ СЂС–РІРЅСЏ
 * @param {number} toLevel - РґРѕ СЏРєРѕРіРѕ СЂС–РІРЅСЏ
 * @returns {number} РІС–РґСЃРѕС‚РѕРє РїСЂРёСЂРѕСЃС‚Сѓ (0-100)
 */
function getPowerGainPercent(card, fromLevel, toLevel) {
  const from = getPower(card, fromLevel);
  const to = getPower(card, toLevel);
  if (from === 0) return 0;
  return Math.round(((to - from) / from) * 100);
}

/**
 * РћС‚СЂРёРјР°С‚Рё СЃС‚Р°РЅРґР°СЂС‚РЅСѓ СЃРёР»Сѓ РєР°СЂС‚Рё (level 1)
 * 
 * @param {Object} card - РѕР±'С”РєС‚ РєР°СЂС‚Рё
 * @returns {number} Р±Р°Р·РѕРІР° СЃРёР»Р°
 */
function getBasePower(card) {
  return card?.basePower || 0;
}

/**
 * РџРѕСЂС–РІРЅСЏС‚Рё РґРІС– РєР°СЂС‚Рё РїРѕ СЃРёР»С– РїСЂРё РїРµРІРЅРѕРјСѓ СЂС–РІРЅС–
 * 
 * @param {Object} card1 - РїРµСЂС€Р° РєР°СЂС‚Р°
 * @param {Object} card2 - РґСЂСѓРіР° РєР°СЂС‚Р°
 * @param {number} level - СЂС–РІРµРЅСЊ РґР»СЏ РїРѕСЂС–РІРЅСЏРЅРЅСЏ
 * @returns {number} СЂС–Р·РЅРёС†СЏ (card1 - card2)
 */
function comparePower(card1, card2, level = 1) {
  const power1 = getPower(card1, level);
  const power2 = getPower(card2, level);
  return power1 - power2;
}

/**
 * Р РѕР·СЂР°С…СѓРІР°С‚Рё СЃРёР»Сѓ РєРѕР»РѕРґРё (СЃСѓРјР° РІСЃС–С… РєР°СЂС‚)
 * 
 * @param {Array} cards - РјР°СЃРёРІ РєР°СЂС‚
 * @param {number} level - СЂС–РІРµРЅСЊ РєРѕР¶РЅРѕС— РєР°СЂС‚Рё
 * @returns {number} Р·Р°РіР°Р»СЊРЅР° СЃРёР»Р° РєРѕР»РѕРґРё
 */
function getDeckPower(cards, level = 1) {
  if (!Array.isArray(cards)) return 0;
  
  return cards.reduce((total, card) => {
    return total + getPower(card, level);
  }, 0);
}

/**
 * РћС‚СЂРёРјР°С‚Рё С–РЅС„РѕСЂРјР°С†С–СЋ РїСЂРѕ РїСЂРѕРєР°С‡РєСѓ РєР°СЂС‚Рё РІ С‚РµРєСЃС‚РѕРІРѕРјСѓ С„РѕСЂРјР°С‚С–
 * 
 * @param {Object} card - РѕР±'С”РєС‚ РєР°СЂС‚Рё
 * @param {number} level - СЂС–РІРµРЅСЊ РєР°СЂС‚Рё
 * @returns {string} СЂСЏРґРѕРє С–РЅС„РѕСЂРјР°С†С–С—
 */
function getCardInfoString(card, level = 1) {
  const power = getPower(card, level);
  const mult = (card.upgradeMult * 100 - 100).toFixed(0);
  return `${card.name}: ${power} (+${mult}% Р·Р° СЂС–РІРµРЅСЊ)`;
}

/**
 * РЎРРЎРўР•РњРђ РџР РћРљРђР§РљР РљРђР Рў (XP-СЃРёСЃС‚РµРјР°)
 * Р§РёСЃС‚Р° СЂРµР°Р»С–Р·Р°С†С–СЏ Р±РµР· Р·Р°Р»РµР¶РЅРѕСЃС‚РµР№, Р»РµРіРєРѕ СЂРѕР·С€РёСЂСЋРІР°РЅР°.
 */

/**
 * Р“Р°СЂР°РЅС‚СѓРІР°С‚Рё, С‰Рѕ РїСЂРѕРіСЂРµСЃ РєР°СЂС‚Рё С–СЃРЅСѓС” (С…РµР»РїРµСЂ)
 * @param {Object} state - РѕР±'С”РєС‚ РіСЂР°РІС†СЏ
 * @param {string} cardId - ID РєР°СЂС‚Рё
 * @returns {Object} {level, xp}
 */
function getProgress(state, cardId) {
  if (!state.progress) state.progress = {};
  if (!state.progress[cardId]) {
    state.progress[cardId] = { level: 1, xp: 0 };
  }
  return state.progress[cardId];
}

/**
 * РЎРєС–Р»СЊРєРё XP РїРѕС‚СЂС–Р±РЅРѕ РґР»СЏ Р°Рї РЅР° РЅР°СЃС‚СѓРїРЅРёР№ СЂС–РІРµРЅСЊ
 * РџР»Р°РІРЅРµ Р·СЂРѕСЃС‚Р°РЅРЅСЏ: lvl1в†’2: 20, lvl2в†’3: 32, lvl3в†’4: 46, lvl4в†’5: 62 ...
 * @param {number} level - РїРѕС‚РѕС‡РЅРёР№ СЂС–РІРµРЅСЊ
 * @returns {number} XP РґР»СЏ level в†’ level+1
 */
function xpNeed(level) {
  return Math.round((20 + 12 * (level - 1) + 2 * (level - 1) ** 2) * 1.15);
}

/**
 * РЎРєС–Р»СЊРєРё XP РґР°С” РєР°СЂС‚Р° РїСЂРё СЃРїР°Р»РµРЅРЅС–
 * lvl1 = 5, lvl5 = 50
 * Р¤РѕСЂРјСѓР»Р°: (5 * level * (level + 3)) / 4
 * @param {number} level - СЂС–РІРµРЅСЊ РєР°СЂС‚Рё, СЏРєСѓ СЃРїР°Р»СЋС”РјРѕ
 * @returns {number} РєС–Р»СЊРєС–СЃС‚СЊ XP
 */
function xpValue(level) {
  return Math.round((5 * level * (level + 3)) / 4);
}

/**
 * Р”РѕРґР°С‚Рё XP РґРѕ РєР°СЂС‚Рё С– Р°РІС‚РѕРјР°С‚РёС‡РЅРѕ Р°Рї СЂС–РІРЅС–
 * @param {Object} state - РѕР±'С”РєС‚ РіСЂР°РІС†СЏ
 * @param {string} cardId - ID РєР°СЂС‚Рё
 * @param {number} amount - СЃРєС–Р»СЊРєРё XP РґРѕРґР°С‚Рё
 */
function addXp(state, cardId, amount) {
  const p = getProgress(state, cardId);
  p.xp += amount;

  // РђРї СЂС–РІРЅС–РІ, РїРѕРєРё РІРёСЃС‚Р°С‡Р°С” XP
  while (p.xp >= xpNeed(p.level)) {
    p.xp -= xpNeed(p.level);
    p.level += 1;
  }
}

/**
 * Р РµРЅРґРµСЂРёС‚Рё XP-Р±Р°СЂ (РѕРЅРѕРІРёС‚Рё DOM РµР»РµРјРµРЅС‚Рё cu-*)
 * @param {Object} state - РѕР±'С”РєС‚ РіСЂР°РІС†СЏ
 * @param {string} cardId - ID РєР°СЂС‚Рё
 */
function renderUpgradeBar(state, cardId) {
  const cuLevel = document.getElementById('cu-level');
  const cuXpText = document.getElementById('cu-xp-text');
  const cuXpFill = document.getElementById('cu-xp-fill');

  if (!cuLevel || !cuXpText || !cuXpFill) {
    console.warn('Upgrade bar elements not found');
    return;
  }

  const prog = getProgress(state, cardId);
  const need = xpNeed(prog.level);
  const pct = Math.min(100, Math.round((prog.xp / need) * 100));

  cuLevel.textContent = `LV ${prog.level}`;
  cuXpText.textContent = `${prog.xp} / ${need} XP`;
  cuXpFill.style.width = `${pct}%`;
}

/**
 * РћРЅРѕРІРёС‚Рё СЃС‚Р°РЅ РєРЅРѕРїРєРё РџСЂРѕРєР°С‡РёС‚Рё (disabled СЏРєС‰Рѕ РЅРµРјР°С” РєР°СЂС‚ РґР»СЏ СЃРїР°Р»РµРЅРЅСЏ)
 * @param {Object} state - РѕР±'С”РєС‚ РіСЂР°РІС†СЏ
 * @param {string} cardId - ID РєР°СЂС‚Рё РґР»СЏ РїСЂРѕРєР°С‡РєРё
 */
function updateUpgradeButton(state, cardId) {
  const btn = document.getElementById('cu-upgrade-btn');
  if (!btn) return;

  // Р—РЅР°Р№С‚Рё РґР°РЅС– РєР°СЂС‚Рё РґР»СЏ РѕС‚СЂРёРјР°РЅРЅСЏ СЃС‚РёС…С–С—
  const cardData = window.getCardById ? window.getCardById(cardId) : null;
  if (!cardData) {
    btn.disabled = true;
    return;
  }

  // Р—РЅР°Р№С‚Рё РІСЃС– РєР°СЂС‚Рё, СЏРєС– РјРѕР¶РµРјРѕ СЃРїР°Р»РёС‚Рё (С‚Р° Р¶ СЃС‚РёС…С–СЏ, Р°Р»Рµ РЅРµ СЃР°РјР° РєР°СЂС‚Р°)
  const allCards = window.ALL_CARDS || window.CARDS_COMMON || [];
  const canBurn = allCards.some(c => {
    // РўР° Р¶ СЃС‚РёС…С–СЏ, Р°Р»Рµ РЅРµ СЃР°РјР° РєР°СЂС‚Р°
    if (c.element !== cardData.element || c.id === cardId) return false;
    // РџРµСЂРµРІС–СЂРёС‚Рё С–РЅРІРµРЅС‚Р°СЂ (С” РєР°СЂС‚Рё РґР»СЏ СЃРїР°Р»РµРЅРЅСЏ)
    const count = state.inventory && state.inventory[c.id] ? state.inventory[c.id] : 0;
    return count > 0;
  });

  btn.disabled = !canBurn;
}

// Р•РєСЃРїРѕСЂС‚СѓС”РјРѕ РіР»РѕР±Р°Р»СЊРЅРѕ РґР»СЏ Р±СЂР°СѓР·РµСЂР°
window.getPower = getPower;
window.getPowerProgression = getPowerProgression;
window.getPowerGain = getPowerGain;
window.getPowerGainPercent = getPowerGainPercent;
window.getBasePower = getBasePower;
window.comparePower = comparePower;
window.getDeckPower = getDeckPower;
window.getCardInfoString = getCardInfoString;
window.getProgress = getProgress;
window.xpValue = xpValue;
window.xpNeed = xpNeed;
window.addXp = addXp;
window.renderUpgradeBar = renderUpgradeBar;
window.updateUpgradeButton = updateUpgradeButton;


/* ===== js/game/drop.js ===== */
// Card drop system with rarity and element chances
// Based on balanced TCG drop rates

// Drop rate configuration
const DROP_CONFIG = {
  rarity_drop_rates: {
    R1: 60,
    R2: 15,
    R3: 15,
    R4: 10,
    R5: 0,
    R6: 0
  },
  element_drop_rates: {
    fire: 25,
    water: 25,
    air: 25,
    earth: 25
  },
  starter_pool: {
    enabled_until_complete: true
  },
  pity_system: {
    legendary_guarantee_after: 40,
    mythic_guarantee_after: 120
  }
};

const RARITY_ORDER = ['R1','R2','R3','R4','R5','R6'];
const rarityRank = r => Math.max(1, RARITY_ORDER.indexOf(r) + 1);

const sumRates = (rates) => Object.values(rates || {}).reduce((s,v)=>s+(v||0),0);

const normalizeRates = (rates) => {
  const total = sumRates(rates) || 1;
  const out = {};
  for (const r of RARITY_ORDER) out[r] = ((rates[r] || 0) / total) * 100;
  return out;
};

const clampRatesToMax = (rates, maxRarity) => {
  if (!maxRarity) return {...rates};
  const maxRank = rarityRank(maxRarity);
  const out = {};
  for (const r of RARITY_ORDER) out[r] = (rarityRank(r) > maxRank) ? 0 : (rates[r] || 0);
  return out;
};

const rollFromNormalized = (normalized) => {
  const roll = Math.random() * 100;
  let cum = 0;
  for (const r of RARITY_ORDER) {
    cum += (normalized[r] || 0);
    if (roll <= cum) return r;
  }
  return 'R1';
};

const rollElement = (elementRates) => {
  const rates = elementRates || DROP_CONFIG.element_drop_rates;
  const roll = Math.random() * 100;
  let cum = 0;
  for (const el of Object.keys(rates)) {
    cum += rates[el] || 0;
    if (roll <= cum) return el;
  }
  return Object.keys(rates)[0] || 'fire';
};

const getRandomFromPool = (pool) => {
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

const hasCompletedStarterCollection = (profile, starterCards) => {
  if (!profile || !profile.inventory) return false;
  const starterIds = (starterCards || []).map(c => c.id);
  return starterIds.every(id => profile.inventory && profile.inventory[id] > 0);
};

// Core option-aware single drop implementation
const dropCardCore = (profile, allCards, starterCards, pityCounters = {noLegendary:0,noMythic:0}, opts = {}) => {
  const counters = { noLegendary: (pityCounters.noLegendary||0), noMythic: (pityCounters.noMythic||0) };

  // Starter pool
  const starterActive = DROP_CONFIG.starter_pool.enabled_until_complete && !hasCompletedStarterCollection(profile, starterCards);
  if (starterActive && starterCards && starterCards.length) {
    return { card: getRandomFromPool(starterCards), rarity: null, fromStarterPool: true, pityCounters: counters };
  }

  // Assemble rates
  const baseRates = opts.rarityRates || DROP_CONFIG.rarity_drop_rates;
  // First clamp to maxRarity if provided
  const capped = clampRatesToMax(baseRates, opts.maxRarity);
  // Normalize
  const normalized = normalizeRates(capped);

  // Pity checks (won't exceed maxRarity because capped above)
  let forcedRarity = null;
  if ((counters.noMythic || 0) >= (DROP_CONFIG.pity_system.mythic_guarantee_after || 999999)) {
    forcedRarity = 'R6';
  } else if ((counters.noLegendary || 0) >= (DROP_CONFIG.pity_system.legendary_guarantee_after || 999999)) {
    forcedRarity = 'R5';
  }

  if (forcedRarity) {
    // If forced rarity is above maxRarity, clamp it down
    if (opts.maxRarity && rarityRank(forcedRarity) > rarityRank(opts.maxRarity)) {
      forcedRarity = opts.maxRarity;
    }
    // If the forced rarity has zero chance in the capped rates, pick the highest allowed rarity with non-zero chance
    const cappedRates = clampRatesToMax(baseRates, opts.maxRarity);
    const hasChance = (r) => (cappedRates[r] || 0) > 0;
    if (!hasChance(forcedRarity)) {
      // find highest allowed rarity with positive weight
      let found = null;
      for (let i = RARITY_ORDER.length - 1; i >= 0; i--) {
        const r = RARITY_ORDER[i];
        if (hasChance(r)) { found = r; break; }
      }
      forcedRarity = found; // may be null
    }
  }

  // Roll rarity (or apply forced)
  let rarity = forcedRarity || rollFromNormalized(normalized);

  // Guaranteed at least
  if (opts.guaranteedAtLeast) {
    const need = rarityRank(opts.guaranteedAtLeast);
    if (rarityRank(rarity) < need) rarity = opts.guaranteedAtLeast;
  }

  // Final clamp to maxRarity again to be safe
  if (opts.maxRarity && rarityRank(rarity) > rarityRank(opts.maxRarity)) {
    rarity = opts.maxRarity;
  }

  const element = rollElement(opts.elementRates);

  let pool = (allCards || []).filter(c => c.rarity === rarity && c.element === element);
  if (!pool.length) pool = (allCards || []).filter(c => c.rarity === rarity);
  if (!pool.length) pool = (allCards || []).filter(c => c.element === element);
  if (!pool.length) pool = allCards || [];

  const card = getRandomFromPool(pool);

  // Update pity counters
  if (rarity === 'R6') {
    counters.noMythic = 0; counters.noLegendary = 0;
  } else if (rarity === 'R5') {
    counters.noLegendary = 0; counters.noMythic = (counters.noMythic||0) + 1;
  } else {
    counters.noLegendary = (counters.noLegendary||0) + 1; counters.noMythic = (counters.noMythic||0) + 1;
  }

  return { card, rarity, fromStarterPool: false, pityCounters: counters };
};

// Public API
if (typeof window !== 'undefined') {
  window.dropCardWithOptions = window.dropCardWithOptions || function(profile, allCards, starterCards, pityCounters, opts) {
    return dropCardCore(profile, allCards, starterCards, pityCounters, opts);
  };

  window.dropCardsWithOptions = window.dropCardsWithOptions || function(profile, allCards, starterCards, count = 1, pityCounters, opts) {
    const res = { cards: [], pityCounters: { noLegendary: (pityCounters && pityCounters.noLegendary)||0, noMythic: (pityCounters && pityCounters.noMythic)||0 } };
    for (let i=0;i<count;i++){
      const t = dropCardCore(profile, allCards, starterCards, res.pityCounters, opts);
      if (t.card) res.cards.push(t.card);
      res.pityCounters = t.pityCounters;
    }
    return res;
  };

  // Backwards-compatible wrappers
  window.dropCard = window.dropCard || function(profile, allCards, starterCards, pityCounters) {
    const opts = {}; return dropCardCore(profile, allCards, starterCards, pityCounters, opts);
  };

  window.dropCards = window.dropCards || function(profile, allCards, starterCards, count, pityCounters) {
    return window.dropCardsWithOptions(profile, allCards, starterCards, count, pityCounters, {});
  };

  const getDropChance = (result) => {
    // After duel drop chance: set to 5% for all duel outcomes
    switch (result) {
      case 'win': return 0.05;
      case 'lose': return 0.05;
      case 'draw': return 0.05;
      default: return 0;
    }
  };

  const shouldDrop = (result) => Math.random() < getDropChance(result);

  window.dropSystem = window.dropSystem || {};
  window.dropSystem.DROP_CONFIG = DROP_CONFIG;
  window.dropSystem.dropCard = window.dropCard;
  window.dropSystem.dropCards = window.dropCards;
  window.dropSystem.dropCardWithOptions = window.dropCardWithOptions;
  window.dropSystem.dropCardsWithOptions = window.dropCardsWithOptions;
  window.dropSystem.getDropChance = getDropChance;
  window.dropSystem.shouldDrop = shouldDrop;
  window.dropSystem.simulateDrops = function(allCards, starterCards, profile = {}, trials = 10000, opts = {}){
    let counters = { noLegendary: 0, noMythic: 0 };
    const counts = { R1:0,R2:0,R3:0,R4:0,R5:0,R6:0 };
    for (let i=0;i<trials;i++){
      const r = dropCardCore(profile, allCards, starterCards, counters, opts);
      counters = r.pityCounters;
      const rr = r.rarity || (r.card && r.card.rarity) || null;
      if (rr) counts[rr] = (counts[rr]||0) + 1;
    }
    return { counts, counters };
  };
}


/* ===== js/data/cards_index.js ===== */
/**
 * Р†РќР”Р•РљРЎР РљРђР Рў - РґР»СЏ С€РІРёРґРєРѕРіРѕ РїРѕС€СѓРєСѓ
 * 
 * Р’РёРєРѕСЂРёСЃС‚Р°РЅРЅСЏ:
 * - getCardById('C-F-001')
 * - getCardsByElement('fire')
 * - getRandomCards(16)
 */

// Р¤СѓРЅРєС†С–С— РґРѕСЃС‚СѓРїСѓ РґРѕ РєР°СЂС‚ (Р±РµР·РїРµС‡РЅС– РїСЂРёСЃРІРѕС”РЅРЅСЏ РІ РіР»РѕР±Р°Р»СЊРЅС–Р№ РѕР±Р»Р°СЃС‚С–)
if (typeof window.getCardById === 'undefined') {
  window.getCardById = function(id) {
    return (window.CARDS_BY_ID && window.CARDS_BY_ID[id]) || null;
  };
}

if (typeof window.getCardsByElement === 'undefined') {
  window.getCardsByElement = function(element) {
    return (window.CARDS_BY_ELEMENT && window.CARDS_BY_ELEMENT[element]) || [];
  };
}

if (typeof window.getRandomCards === 'undefined') {
  window.getRandomCards = function(count) {
    const allCards = window.ALL_CARDS || [];
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, allCards.length));
  };
}


/* ===== js/game/currencies.js ===== */
/**
 * Currency System
 * Р’Р°Р»СЋС‚РЅР° СЃРёСЃС‚РµРјР° РіСЂРё
 * 
 * Р’Р°Р»СЋС‚Рё:
 * рџ”© Р‘РѕР»С‚Рё (bolts) - Р±Р°Р·РѕРІР° РІР°Р»СЋС‚Р°
 * вљ™пёЏ РЁРµСЃС‚РµСЂРЅС– (gears) - СЃРµСЂРµРґРЅСЏ РІР°Р»СЋС‚Р°
 * вњґпёЋ РџР°СЂРѕРІС– СЏРґСЂР° (cores) - РїСЂРµРјС–СѓРј РІР°Р»СЋС‚Р°
 */

window.CurrencySystem = {
  // РўРёРїРё РІР°Р»СЋС‚
  TYPES: {
    BOLTS: 'bolts',    // рџ”©
    GEARS: 'gears',    // вљ™пёЏ
    CORES: 'cores'     // вњґпёЋ
  },

  // Р•РјРѕРґР·С– РІР°Р»СЋС‚
  EMOJIS: {
    bolts: 'рџ”©',
    gears: 'вљ™пёЏ',
    cores: 'вњґпёЋ'
  },

  // РќР°Р·РІРё РІР°Р»СЋС‚
  NAMES: {
    bolts: 'Р‘РѕР»С‚Рё',
    gears: 'РЁРµСЃС‚РµСЂРЅС–',
    cores: 'РџР°СЂРѕРІС– СЏРґСЂР°'
  },

  // РЎС‚Р°СЂС‚РѕРІС– Р·РЅР°С‡РµРЅРЅСЏ
  STARTING_AMOUNTS: {
    bolts: 500,   // рџ”©
    gears: 0,   // вљ™пёЏ
    cores: 0    // вњґпёЋ
  },

  /**
   * РћС‚СЂРёРјР°С‚Рё С–РЅС„РѕСЂРјР°С†С–СЋ РїСЂРѕ РІР°Р»СЋС‚Сѓ
   */
  getCurrency(type) {
    return {
      type: type,
      emoji: this.EMOJIS[type],
      name: this.NAMES[type],
      starting: this.STARTING_AMOUNTS[type]
    };
  },

  /**
   * РћС‚СЂРёРјР°С‚Рё РІСЃС– РІР°Р»СЋС‚Рё
   */
  getAllCurrencies() {
    return Object.values(this.TYPES).map(type => this.getCurrency(type));
  },

  /**
   * РћС‚СЂРёРјР°С‚Рё РґР°РЅС– РґР»СЏ С‚РѕРїР±Р°СЂР°
   */
  getTopbarData(profile) {
    const data = {};
    this.getAllCurrencies().forEach(currency => {
      data[currency.type] = {
        emoji: currency.emoji,
        value: profile[currency.type] || 0
      };
    });
    return data;
  },

  /**
   * РџРµСЂРµРІС–СЂРёС‚Рё, С‡Рё РІРёСЃС‚Р°С‡Р°С” РІР°Р»СЋС‚Рё
   */
  canAfford(profile, currency, amount) {
    if (!profile[currency]) return false;
    return profile[currency] >= amount;
  },

  /**
   * РЎРїРёСЃР°С‚Рё РІР°Р»СЋС‚Сѓ
   */
  deduct(profile, currency, amount) {
    if (!this.canAfford(profile, currency, amount)) {
      return false;
    }
    profile[currency] -= amount;
    return true;
  },

  /**
   * Р”РѕРґР°С‚Рё РІР°Р»СЋС‚Сѓ
   */
  add(profile, currency, amount) {
    profile[currency] = (profile[currency] || 0) + amount;
    return true;
  },

  /**
   * РћС‚СЂРёРјР°С‚Рё С†С–РЅСѓ С‚РѕРІР°СЂСѓ СЏРє С‚РµРєСЃС‚
   */
  getPriceText(product) {
    const currency = window.CurrencySystem.getCurrency(product.price.currency);
    return `${currency.emoji} ${product.price.amount}`;
  },

  /**
   * РћС‚СЂРёРјР°С‚Рё РЅР°Р·РІСѓ РІР°Р»СЋС‚Рё РІ СЂРѕРґРѕРІРѕРјСѓ РІС–РґРјС–РЅРєСѓ
   */
  getCurrencyNameGenitive(type) {
    const genetiveNames = {
      bolts: 'Р±РѕР»С‚С–РІ',
      gears: 'С€РµСЃС‚РµСЂРµРЅСЊ',
      cores: 'РїР°СЂРѕРІРёС… СЏРґРµСЂ'
    };
    return genetiveNames[type] || type;
  }
};

// Р•РєСЃРїРѕСЂС‚ РґР»СЏ РіР»РѕР±Р°Р»СЊРЅРѕРіРѕ РІРёРєРѕСЂРёСЃС‚Р°РЅРЅСЏ
window.Currencies = window.CurrencySystem;


/* ===== card-renderer.js ===== */
/**
 * РЎРРЎРўР•РњРђ Р Р•РќР”Р•Р РЈ РљРђР Рў - РЎС‚РёРјРїР°РЅРє Р”Р•РўРђР›Р¬РќРР™ Р”РР—РђР™Рќ
 * Р’РµР»РёРєР° С€РµСЃС‚РµСЂРЅСЏ, Р·Р°РєР»РµРїРєРё, Р°РЅС–РјРѕРІР°РЅС– Р·РЅР°С‡РєРё, РґРµС‚Р°Р»СЊРЅС– РµС„РµРєС‚Рё
 */

class CardRenderer {
  constructor() {
    // Р•РјРѕРґР·С– Р·РЅР°С‡РєРё РґР»СЏ РєРѕР¶РЅРѕС— СЃС‚РёС…С–С— Р· РєР»Р°СЃР°РјРё Р°РЅС–РјР°С†С–Р№
    this.elementIcons = {
      fire: `<div class="element-emoji fire-emoji">рџ”Ґ</div>`,
      water: `<div class="element-emoji water-emoji">рџ’§</div>`,
      air: `<div class="element-emoji air-emoji">рџ’Ё</div>`,
      earth: `<div class="element-emoji earth-emoji">рџЌѓ</div>`
    };

    this.rarityNames = {
      R1: 'Р—Р’РР§РђР™РќРђ',
      R2: 'РќР•Р—Р’РР§РђР™РќРђ',
      R3: 'Р Р†Р”РљР†РЎРќРђ',
      R4: 'Р•РџР†Р§РќРђ',
      R5: 'Р›Р•Р“Р•РќР”РђР РќРђ',
      R6: 'РњР†Р¤Р†Р§РќРђ'
    };

    this.elementNames = {
      fire: 'Р’РѕРіРѕРЅСЊ',
      water: 'Р’РѕРґР°',
      air: 'РџРѕРІС–С‚СЂСЏ',
      earth: 'Р—РµРјР»СЏ'
    };
  }

  /**
   * РћРЎРќРћР’РќРР™ РњР•РўРћР” Р Р•РќР”Р•Р РЈ - Р”Р•РўРђР›Р¬РќРР™ Р”РР—РђР™Рќ
   * @param {Object} cardData - РґР°РЅС– РєР°СЂС‚Рё Р· Р±Р°Р·Рё
   * @returns {String} HTML СЂРѕР·РјС–С‚РєР° РєР°СЂС‚Рё Р· РґРµС‚Р°Р»СЊРЅРёРј РґРёР·Р°Р№РЅРѕРј
   */
  render(cardData, opts = {}) {
    const {
      id = 'unknown',
      name = 'Unknown Card',
      element = 'fire',
      rarity = 'R1',
      basePower = 0,
      attack = 0,
      factionName = '',
      rarityDisplay = '',
      faction = ''
    } = cardData;

    const rarityBadge = rarityDisplay || this.rarityNames[rarity] || 'Р—Р’РР§РђР™РќРђ';
    const elementIcon = this.elementIcons[element] || this.elementIcons.fire;
    const displayPower = (opts.power !== undefined) ? opts.power : (attack || basePower);
    const level = opts.level || (cardData.level || 1);
    const showUpgrade = !!opts.showUpgrade;

    // Картинка арту — сначала пробуем helper, иначе пустая строка (без заглушок)
    let imgSrc = '';
    try { imgSrc = (window.getCardImage ? window.getCardImage(cardData) : imgSrc) || imgSrc; } catch(e) {}
    return `
      <div class="sp-card ${element} ${rarity} ${showUpgrade ? 'upgradable' : ''}" 
           data-id="${id}"
           data-card-id="${id}"
           data-element="${element}"
           data-rarity="${rarity}"
           data-power="${displayPower}"
           data-attack="${attack}"
           data-level="${level}"
           data-faction="${faction}"
           data-name="${name}">
        
        <!-- Р”Р•РљРћР РђРўРР’РќР† Р›Р†РќР†Р‡ -->
        <div class="decor-line line-top"></div>
        <div class="decor-line line-bottom"></div>
        
        <!-- РљРђР РўРРќРљРђ РђР РўРЈ (СЏРєС‰Рѕ С”) -->
        <div class="card-art-frame">
          <img class="card-art-img" src="${imgSrc}" alt="${name}" />
        </div>

        <!-- Р‘Р•Р™Р”Р– Р Р†Р”РљРћРЎРўР† -->
        <div class="rarity-badge">${rarityBadge}</div>
        
        <!-- Р’Р•Р›РРљРђ Р”Р•РўРђР›Р¬РќРђ РЁР•РЎРўР•Р РќРЇ -->
        <div class="corner-gear">
          <div class="gear-inner">
            ${elementIcon}
          </div>
        </div>

        <!-- РџР›РђРЁРљРђ РЎРР›Р РІРЅРёР·Сѓ -->
        <div class="power-plate">
          <div class="power-value">${displayPower}</div>
        </div>
        ${showUpgrade ? '<div class="upgrade-arrow" title="РњРѕР¶РЅР° РїСЂРѕРєР°С‡Р°С‚Рё">в–І</div>' : ''}
      </div>
    `;
  }

  /**
   * РџРђРљР•РўРќРР™ Р Р•РќР”Р•Р РРќР“
   * @param {Array} cardsArray - РјР°СЃРёРІ РєР°СЂС‚
   * @returns {String} HTML РІСЃС–С… РєР°СЂС‚
   */
  renderMultiple(cardsArray) {
    return cardsArray
      .map(card => this.render(card))
      .join('');
  }

  /**
   * Р Р•РќР”Р•Р РРќР“ Р— Р†РќР¤РћР РњРђР¦Р†Р™РќРћР® РџРђРќР•Р›Р›Р®
   * @param {Object} cardData - РґР°РЅС– РєР°СЂС‚Рё
   * @returns {String} HTML РєР°СЂС‚Рё + С–РЅС„РѕСЂРјР°С†С–СЏ
   */
  renderWithInfo(cardData) {
    const cardHTML = this.render(cardData);
    const infoHTML = this.renderInfo(cardData);
    
    return `
      <div class="card-with-info">
        ${cardHTML}
        ${infoHTML}
      </div>
    `;
  }

  /**
   * Р†РќР¤РћР РњРђР¦Р†Р™РќРђ РџРђРќР•Р›Р¬
   * @param {Object} cardData - РґР°РЅС– РєР°СЂС‚Рё (РЅРѕРІР° СЃС‚СЂСѓРєС‚СѓСЂР°)
   * @returns {String} HTML С–РЅС„РѕСЂРјР°С†С–С—
   */
  renderInfo(cardData) {
    const {
      name = 'Unknown',
      element = 'fire',
      rarity = 'R1',
      basePower = 0,
      attack = 0,
      defense = 0,
      multiplier = 1.0,
      upgradeMult = 1.05,
      factionName = '',
      rarityDisplay = '',
      faction = ''
    } = cardData;

    const elementName = this.elementNames[element] || element;
    const rarityName = rarityDisplay || this.rarityNames[rarity] || rarity;

    return `
      <div class="card-info">
        <h3 class="card-name">${name}</h3>
        
        <div class="card-stats">
          <div class="stat">
            <span class="stat-label">РЎС‚РёС…С–СЏ:</span>
            <span class="stat-value element-${element}">${elementName}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Р С–РґРєС–СЃС‚СЊ:</span>
            <span class="stat-value rarity-${rarity}">${rarityName}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Р¤СЂР°РєС†С–СЏ:</span>
            <span class="stat-value faction">${factionName || faction}</span>
          </div>
          <div class="stat">
            <span class="stat-label">РђС‚Р°РєР°:</span>
            <span class="stat-value attack">вљ”пёЏ ${attack}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Р—Р°С…РёСЃС‚:</span>
            <span class="stat-value defense">рџ›ЎпёЏ ${defense}</span>
          </div>
          <div class="stat">
            <span class="stat-label">РњРЅРѕР¶РЅРёРє РїРѕРєСЂР°С‰РµРЅРЅСЏ:</span>
            <span class="stat-value upgrade">Г—${upgradeMult}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Р“Р•РќР•Р РђРўРћР  CSS Р”Р›РЇ Р”РРќРђРњР†Р§РќРРҐ РљРћР›Р¬РћР Р†Р’
   * @returns {String} CSS Р·РјС–РЅРЅС– РґР»СЏ 4 СЃС‚РёС…С–Р№ С– 6 СЂС–РґРєРѕСЃС‚РµР№
   */
  generateColorCSS() {
    return `
      :root {
        /* 4 РѕСЃРЅРѕРІРЅС– СЃС‚РёС…С–С— */
        --fire:   #c45a2a;
        --water:  #3b6c8e;
        --air:    #9fb6c1;
        --earth:  #7a6a3a;
        
        /* 6 СЂС–РІРЅС–РІ СЂС–РґРєРѕСЃС‚С– */
        --R1: #b8a27b;    /* Р—РІРёС‡Р°Р№РЅР° */
        --R2: #7aaa6f;    /* РќРµР·РІРёС‡Р°Р№РЅР° */
        --R3: #6fb2ff;    /* Р С–РґРєС–СЃРЅР° */
        --R4: #b07cff;    /* Р•РїС–С‡РЅР° */
        --R5: #ffcc66;    /* Р›РµРіРµРЅРґР°СЂРЅР° */
        --R6: #ff6b9d;    /* РњС–С„С–С‡РЅР° */
      }
    `;
  }

  /**
   * РџР†Р”Р“РћРўРћР’РљРђ РљРђР РўР Р”Рћ Р’Р†Р”РћР‘Р РђР–Р•РќРќРЇ
   * Р”РѕРґР°С” РѕР±СЂРѕР±РЅРёРєРё РїРѕРґС–Р№ С‚Р° С–РЅС€С– С„СѓРЅРєС†С–С—
   */
  attachEventHandlers(cardElement, onSelect = null, onHover = null) {
    // РџСЂРё РєР»С–РєСѓ РЅР° РєР°СЂС‚Сѓ
    cardElement.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Р’РёРґР°Р»СЏС”РјРѕ РєР»Р°СЃ Р· С–РЅС€РёС… РєР°СЂС‚
      document.querySelectorAll('.sp-card').forEach(c => {
        c.classList.remove('selected');
      });
      
      // Р”РѕРґР°С”РјРѕ РєР»Р°СЃ РїРѕС‚РѕС‡РЅС–Р№ РєР°СЂС‚С–
      cardElement.classList.add('selected');
      
      // Callback
      if (onSelect) {
        const cardData = {
          id: cardElement.dataset.id,
          name: cardElement.dataset.name,
          element: cardElement.dataset.element,
          rarity: cardElement.dataset.rarity,
          power: cardElement.dataset.power
        };
        onSelect(cardData);
      }
    });

    // РџСЂРё С…РѕРІРµСЂС–
    if (onHover) {
      cardElement.addEventListener('mouseenter', () => {
        onHover(cardElement.dataset.id, true);
      });
      cardElement.addEventListener('mouseleave', () => {
        onHover(cardElement.dataset.id, false);
      });
    }
  }

  /**
   * Р¤Р†Р›Р¬РўР РђР¦Р†РЇ РљРђР Рў
   * @param {Array} cardsArray - РІСЃС– РєР°СЂС‚Рё
   * @param {String} filter - С„С–Р»СЊС‚СЂ (element Р°Р±Рѕ 'legend')
   * @returns {Array} РІС–РґС„С–Р»СЊС‚СЂРѕРІР°РЅС– РєР°СЂС‚Рё
   */
  filterCards(cardsArray, filter) {
    if (filter === 'all') return cardsArray;
    
    if (filter === 'legend') {
      return cardsArray.filter(card => card.rarity === 'legend');
    }
    
    // Р¤С–Р»СЊС‚СЂ РїРѕ СЃС‚РёС…С–С—
    return cardsArray.filter(card => card.element === filter);
  }

  /**
   * РЎРћР РўРЈР’РђРќРќРЇ РљРђР Рў
   * @param {Array} cardsArray - РєР°СЂС‚Рё
   * @param {String} sortBy - РїРѕР»Рµ РґР»СЏ СЃРѕСЂС‚СѓРІР°РЅРЅСЏ
   * @param {String} order - 'asc' Р°Р±Рѕ 'desc'
   * @returns {Array} РІС–РґСЃРѕСЂС‚РѕРІР°РЅС– РєР°СЂС‚Рё
   */
  sortCards(cardsArray, sortBy = 'power', order = 'desc') {
    const sorted = [...cardsArray].sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      
      if (order === 'asc') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
    
    return sorted;
  }

  /**
   * РџРћРЁРЈРљ РљРђР Рў
   * @param {Array} cardsArray - РєР°СЂС‚Рё
   * @param {String} query - РїРѕС€СѓРєРѕРІРёР№ Р·Р°РїРёС‚
   * @returns {Array} СЂРµР·СѓР»СЊС‚Р°С‚Рё РїРѕС€СѓРєСѓ
   */
  searchCards(cardsArray, query) {
    const lowerQuery = query.toLowerCase();
    
    return cardsArray.filter(card => {
      return card.name.toLowerCase().includes(lowerQuery) ||
             card.description.toLowerCase().includes(lowerQuery) ||
             card.element.toLowerCase().includes(lowerQuery);
    });
  }

  /**
   * Р“Р РЈРџРЈР’РђРќРќРЇ РљРђР Рў РџРћ РЎРўРРҐР†РЇРњ
   * @param {Array} cardsArray - РєР°СЂС‚Рё
   * @returns {Object} РєР°СЂС‚Рё Р·РіСЂСѓРїРѕРІР°РЅС– РїРѕ СЃС‚РёС…С–СЏРј
   */
  groupByElement(cardsArray) {
    return cardsArray.reduce((groups, card) => {
      const element = card.element;
      if (!groups[element]) {
        groups[element] = [];
      }
      groups[element].push(card);
      return groups;
    }, {});
  }

  /**
   * Р“Р РЈРџРЈР’РђРќРќРЇ РљРђР Рў РџРћ Р Р†Р”РљРћРЎРўР†
   * @param {Array} cardsArray - РєР°СЂС‚Рё
   * @returns {Object} РєР°СЂС‚Рё Р·РіСЂСѓРїРѕРІР°РЅС– РїРѕ СЂС–РґРєРѕСЃС‚С–
   */
  groupByRarity(cardsArray) {
    return cardsArray.reduce((groups, card) => {
      const rarity = card.rarity;
      if (!groups[rarity]) {
        groups[rarity] = [];
      }
      groups[rarity].push(card);
      return groups;
    }, {});
  }
}

// Р•РљРЎРџРћР Рў Р”Р›РЇ Р’РРљРћР РРЎРўРђРќРќРЇ
// СЏРєС‰Рѕ С†Рµ РјРѕРґСѓР»СЊ
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CardRenderer;
}

// РџР РРљР›РђР” Р’РРљРћР РРЎРўРђРќРќРЇ:
/*
// 1. Р†РЅС–С†С–Р°Р»С–Р·Р°С†С–СЏ
const cardRenderer = new CardRenderer();

// 2. Р—Р°РІР°РЅС‚Р°Р¶РёС‚Рё Р±Р°Р·Сѓ РєР°СЂС‚
fetch('./assets/cards-database.json')
  .then(response => response.json())
  .then(data => {
    const cards = data.cards;
    
    // 3. РћС‚СЂРёРјР°С‚Рё РєРѕРЅС‚РµР№РЅРµСЂ
    const container = document.getElementById('cardsContainer');
    
    // 4. Р РµРЅРґРµСЂРёРЅРі РІСЃС–С… РєР°СЂС‚
    container.innerHTML = cardRenderer.renderMultiple(cards);
    
    // 5. РџСЂРёРєСЂС–РїРёС‚Рё РѕР±СЂРѕР±РЅРёРєРё РїРѕРґС–Р№
    document.querySelectorAll('.sp-card').forEach(cardEl => {
      cardRenderer.attachEventHandlers(
        cardEl,
        (cardData) => {
          console.log('Р’РёР±СЂР°РЅР° РєР°СЂС‚Р°:', cardData);
        },
        (cardId, isHovering) => {
          if (isHovering) {
            console.log('РҐРѕРІРµСЂ РЅР° РєР°СЂС‚Сѓ:', cardId);
          }
        }
      );
    });
    
    // 6. Р¤С–Р»СЊС‚СЂР°С†С–СЏ
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        const filtered = cardRenderer.filterCards(cards, filter);
        container.innerHTML = cardRenderer.renderMultiple(filtered);
      });
    });
  });

// Р”РћР”РђРўРљРћР’Рћ - РџРѕС€СѓРє РєР°СЂС‚
const searchInput = document.querySelector('.search-input');
searchInput?.addEventListener('input', (e) => {
  const query = e.target.value;
  const filtered = cardRenderer.searchCards(cards, query);
  container.innerHTML = cardRenderer.renderMultiple(filtered);
});

// Р”РћР”РђРўРљРћР’Рћ - РЎРѕСЂС‚СѓРІР°РЅРЅСЏ
const sortSelect = document.querySelector('.sort-select');
sortSelect?.addEventListener('change', (e) => {
  const sortBy = e.target.value;
  const sorted = cardRenderer.sortCards(cards, sortBy, 'desc');
  container.innerHTML = cardRenderer.renderMultiple(sorted);
});
*/


/* ===== js/game/elements.js ===== */
// Steampunk Elements multipliers and damage helper (global)
(function(){
  window.ELEMENTS = ["fire","water","air","earth"];
  window.MULT = {
    fire:  { fire:1.0, water:0.5, air:1.5, earth:1.0 },
    water: { fire:1.5, water:1.0, air:1.0, earth:0.5 },
    air:   { fire:0.5, water:1.0, air:1.0, earth:1.5 },
    earth: { fire:1.0, water:1.5, air:0.5, earth:1.0 }
  };
  window.damage = function(attackerCard, defenderCard){
    // Guard: СЏРєС‰Рѕ Р±СѓРґСЊ-С‰Рѕ РЅРµ С–СЃРЅСѓС” вЂ” РЅРµ Р»Р°РјР°С”РјРѕ РґСѓРµР»СЊ
    if (!attackerCard || !defenderCard) return { dmg: 0, mult: 1.0 };

    const aEl = attackerCard.element;
    const dEl = defenderCard.element;

    const m = (window.MULT[aEl] || {})[dEl];
    const mult = typeof m === 'number' ? m : 1.0;

    const p = Number(attackerCard.power) || 0;
    const dmg = Math.round(p * mult);

    return { dmg, mult };
  };
})();


/* ===== js/game/duel_runtime.js ===== */
// Runtime duel engine for index.html usage (global functions)
(function(){
  function shuffle(arr){
    const a = arr.slice();
    for (let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }
  
  // Get IDs already on field (excluding specific slot)
  function getFieldIds(hand, excludeIdx){
    const ids = [];
    for (let i=0; i<hand.length; i++){
      if (i !== excludeIdx && hand[i]) ids.push(hand[i].id);
    }
    return ids;
  }
  
  // Draw next unique card (circular deck)
  function drawNextUnique(side, slotIdx){
    const fieldIds = getFieldIds(side.hand, slotIdx);
    // If deck is empty, fall back to side.hand or ALL_CARDS to avoid returning undefined
    const deckSize = Array.isArray(side.deck) ? side.deck.length : 0;
    if (deckSize === 0) {
      const pool = (Array.isArray(side.hand) && side.hand.length) ? side.hand : (Array.isArray(window.ALL_CARDS) ? window.ALL_CARDS : []);
      const poolSize = pool.length || 1;
      // Try to find a non-duplicate in pool
      for (let attempt = 0; attempt < poolSize; attempt++) {
        const candidate = pool[side.cursor % poolSize];
        side.cursor = (side.cursor + 1) % poolSize;
        if (!candidate) continue;
        if (!fieldIds.includes(candidate.id)) return candidate;
      }
      // fallback: return any from pool or a minimal placeholder
      const any = pool[(side.cursor % poolSize)] || null;
      side.cursor = (side.cursor + 1) % poolSize;
      return any || { id: 'filler', element: 'fire', rarity: 'common', power: 12, level: 1 };
    }

    const maxAttempts = deckSize;
    for (let attempt=0; attempt<maxAttempts; attempt++){
      const candidate = side.deck[side.cursor];
      side.cursor = (side.cursor + 1) % side.deck.length;
      
      if (!fieldIds.includes(candidate.id)){
        return candidate;
      }
    }
    // If no unique found (РЅР°РїСЂРёРєР»Р°Рґ, Р±Р°РіР°С‚Рѕ РґСѓР±Р»С–РєР°С‚С–РІ) вЂ” РІСЃРµ РѕРґРЅРѕ Р±РµСЂРµРјРѕ РЅР°СЃС‚СѓРїРЅСѓ РєР°СЂС‚Сѓ Р·Р° РєСѓСЂСЃРѕСЂРѕРј
    const fallback = side.deck[side.cursor];
    side.cursor = (side.cursor + 1) % side.deck.length;
    return fallback;
  }
  
  // Fill initial hand with unique cards
  function fillInitialHand(side, handSize){
    side.hand = [];
    for (let i=0; i<handSize; i++){
      side.hand[i] = drawNextUnique(side, i);
    }
  }
  
  window.createDuel = function(playerDeck9, enemyDeck9){
    // Normalize decks: ensure each card object has numeric `power` based on its id/level
    const normalizeDeck = (deck) => (Array.isArray(deck) ? deck.map(d => {
      const entry = (d && typeof d === 'object') ? d : { id: d };
      const id = entry.id || entry.cardId || entry;
      const level = entry.level || 1;
      const src = (typeof getCardById === 'function') ? getCardById(id) : null;
      const providedPower = Number(entry.power);
      const hasProvidedPower = Number.isFinite(providedPower) && providedPower > 0;

      let computedPower = 0;
      try {
        computedPower = src ? (window.getPower ? window.getPower(src, level) : getPower(src, level)) : 0;
      } catch (e) {
        computedPower = 0;
      }

      let power = hasProvidedPower ? providedPower : computedPower;
      if (!Number.isFinite(power) || power <= 0) power = (Number.isFinite(computedPower) ? computedPower : 0);
      if (!Number.isFinite(power) || power <= 0) power = (entry && entry.basePower) ? entry.basePower : 12;
      power = Math.max(12, Math.round(power));
      return { id, element: (src && src.element) || entry.element || 'fire', rarity: (src && src.rarity) || entry.rarity || 'common', level, power };
    }).filter(x => x && x.id && Number.isFinite(Number(x.power))) : []);

    const fillToNine = (deck) => {
      const out = Array.isArray(deck) ? deck.slice(0, 9) : [];
      if (out.length >= 9) return out;
      const pool = Array.isArray(window.ALL_CARDS) ? window.ALL_CARDS : [];
      for (const c of pool) {
        if (out.length >= 9) break;
        if (!c || !c.id) continue;
        if (out.some(x => String(x.id) === String(c.id))) continue;
        const p = Math.max(12, Math.round(window.getPower ? window.getPower(c, 1) : getPower(c, 1) || c.basePower || 12));
        out.push({ id: c.id, element: c.element || 'fire', rarity: c.rarity || 'common', level: 1, power: p });
      }
      while (out.length < 9) out.push({ id: `filler_${out.length+1}`, element: 'fire', rarity: 'common', level: 1, power: 12 });
      return out;
    };

    const normPlayerDeck = fillToNine(normalizeDeck(playerDeck9));
    const normEnemyDeck = fillToNine(normalizeDeck(enemyDeck9));

    const pHP = normPlayerDeck.reduce((s,c)=>s+(c.power||0),0);
    const eHP = normEnemyDeck.reduce((s,c)=>s+(c.power||0),0);

    const player = {
      hp: pHP,
      maxHp: pHP,
      deck: shuffle(normPlayerDeck.slice()),
      cursor: 0,
      hand: []
    };

    // For enemy: keep a proper deck so drawNextUnique can pick replacements,
    // but also expose the full 9-card pool for rendering/HP as `fullNine`.
    const enemy = {
      hp: eHP,
      maxHp: eHP,
      deck: shuffle(normEnemyDeck.slice()),
      cursor: 0,
      hand: [],
      fullNine: shuffle(normEnemyDeck.slice())
    };

    // ASSERT: СЃСѓРјР°СЂРЅР° СЃРёР»Р° РєР°СЂС‚ РїРѕРІРёРЅРЅР° РґРѕСЂС–РІРЅСЋРІР°С‚Рё hp РІРѕСЂРѕРіР°
    try {
      const chk = normEnemyDeck.reduce((s, c) => s + (c.power || 0), 0);
      if (chk !== enemy.maxHp) {
        console.error('вќЊ ENEMY POWER MISMATCH in createDuel', { chk, maxHp: enemy.maxHp, deck: normEnemyDeck });
      }
    } catch (e) { console.error('createDuel assert failed', e); }
    
    // Player keeps usual 3-card hand behavior
    fillInitialHand(player, 3);
    // Enemy: fill 3 visible slots from its deck as usual
    fillInitialHand(enemy, 3);
    
    return {
      turn: 1,
      player,
      enemy,
      log: [],
      lastTurn: null,
      finished: false,
      result: null
    };
  };

  // РљРѕРЅС‚СЂРѕР»СЊРЅР° С‚РѕС‡РєР° РґР»СЏ РїРµСЂРµРІС–СЂРєРё РїРѕРІРЅРѕС‚Рё РјРѕРґРµР»С– РєР°СЂС‚Рё
  // (hoisted implementation at file top exposes `window.assertFullCard`)

  window.playTurn = function(duel, playerIdx){
    if (!duel || duel.finished) return duel;
    
    // Mirror model: player card at slot i fights enemy card at slot i
    let pCard = duel.player.hand[playerIdx];
    let eCard = duel.enemy.hand[playerIdx];
    // Якщо слот раптом порожній — дотягуємо з колоди, щоб гра не "зависала"
    if (!pCard) {
      duel.player.hand[playerIdx] = drawNextUnique(duel.player, playerIdx);
      pCard = duel.player.hand[playerIdx];
    }
    if (!eCard) {
      duel.enemy.hand[playerIdx] = drawNextUnique(duel.enemy, playerIdx);
      eCard = duel.enemy.hand[playerIdx];
    }
    if (!pCard || !eCard) return duel;
    
    // Calculate damage both ways (guard NaN)
    const pHit = window.damage(pCard, eCard);
    const eHit = window.damage(eCard, pCard);
    const pDmg = Number.isFinite(Number(pHit?.dmg)) ? Number(pHit.dmg) : 0;
    const eDmg = Number.isFinite(Number(eHit?.dmg)) ? Number(eHit.dmg) : 0;
    
    duel.enemy.hp = Math.max(0, duel.enemy.hp - pDmg);
    duel.player.hp = Math.max(0, duel.player.hp - eDmg);
    
    // Log this turn
    duel.lastTurn = {
      slotIdx: playerIdx,
      player: { cardId: pCard.id, element: pCard.element, power: pCard.power, dmg: pDmg, mult: pHit.mult },
      enemy: { cardId: eCard.id, element: eCard.element, power: eCard.power, dmg: eDmg, mult: eHit.mult }
    };
    duel.log.push({ turn: duel.turn, ...duel.lastTurn });
    duel.turn += 1;
    
    // Refill ONLY the played slot with unique cards
    duel.player.hand[playerIdx] = drawNextUnique(duel.player, playerIdx);
    duel.enemy.hand[playerIdx] = drawNextUnique(duel.enemy, playerIdx);
    
    // Check end condition
    if (duel.player.hp <= 0 || duel.enemy.hp <= 0){
      duel.finished = true;
      if (duel.player.hp > duel.enemy.hp) duel.result = 'win';
      else if (duel.player.hp < duel.enemy.hp) duel.result = 'lose';
      else duel.result = 'draw';
      try { console.debug('playTurn: duel finished', { result: duel.result, playerHp: duel.player.hp, enemyHp: duel.enemy.hp }); } catch(e){/* ignore */}

      // Tasks: count one duel finished (once per duel)
      try {
        if (typeof updateTasks === 'function') updateTasks('duel', 1);
        // If player won, count a win task as well
        if (duel.result === 'win' && typeof updateTasks === 'function') updateTasks('win', 1);
      } catch (e) { /* ignore task update failures */ }
    }
    
    // Keep last 10 log entries
    if (duel.log.length > 10) duel.log.splice(0, duel.log.length - 10);
    
    return duel;
  };
})();


/* ===== js/ui/components/CardView.global.js ===== */
// CardView.global вЂ” РіР°СЂР°РЅС‚РёСЂСѓРµС‚ РЅР°Р»РёС‡РёРµ РіР»РѕР±Р°Р»СЊРЅРѕРіРѕ `cardRenderer`
try {
  if (typeof CardRenderer !== 'undefined') {
    window.cardRenderer = window.cardRenderer || new CardRenderer();
  }
} catch (err) {
  console.warn('CardView.global init failed', err);
}


/* ===== inline script from original index.html ===== */

    // Initialize CardRenderer
    window.addEventListener('DOMContentLoaded', () => {
      window.cardRenderer = new CardRenderer();
      console.log('CardRenderer initialized');
    });
    
    // Р”РµР»РµРіРѕРІР°РЅРёР№ РїР°СЂР°Р»Р°РєСЃ РµС„РµРєС‚ РґР»СЏ РІСЃС–С… РєР°СЂС‚
    function initCardParallax() {
      document.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.sp-card');
        if (!card) return;
        
        // РќРµ Р·Р°СЃС‚РѕСЃРѕРІСѓС”РјРѕ С‚СЂР°РЅСЃС„РѕСЂРјР°С†С–СЋ РЅР° РєР°СЂС‚Сѓ, СЏРєС‰Рѕ РІРѕРЅР° РЅРµ РІ :hover
        // С†Рµ Р·Р°РїРѕР±С–РіР°С” РєРѕРЅС„Р»С–РєС‚Р°Рј Р· РїРѕР·РёС†С–СЋРІР°РЅРЅСЏРј РґС–С‚РµР№
        if (!card.matches(':hover')) {
          return;
        }

        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = (e.clientX - centerX) / 50;
        const y = (e.clientY - centerY) / 50;

        // Р—Р°СЃС‚РѕСЃРѕРІСѓС”РјРѕ С‚С–Р»СЊРєРё Р±Р°Р·РѕРІС– С‚СЂР°РЅСЃС„РѕСЂРјР°С†С–С—, СЏРєС– РЅРµ РєРѕРЅС„Р»С–РєС‚СѓСЋС‚СЊ Р· РґС–С‚СЊРјРё
        card.style.transform = `perspective(1000px) rotateX(${5 - y}deg) rotateY(${-2 + x}deg)`;
      });

      // РЎРєРёРґР°РЅРЅСЏ С‚СЂР°РЅСЃС„РѕСЂРјР°С†С–С— РїСЂРё РІРёС…РѕРґС–
      document.addEventListener('mouseleave', (e) => {
        const card = e.target.closest?.('.sp-card');
        if (card) {
          card.style.transform = '';
        }
      }, true);
    }
    
    // Р†РЅС–С†С–Р°Р»С–Р·СѓС”РјРѕ РїР°СЂР°Р»Р°РєСЃ РїС–СЃР»СЏ DOMContentLoaded
    window.addEventListener('DOMContentLoaded', () => {
      initCardParallax();
    });

    // LocalStorage management
    const storage = {
      get(key, defaultValue = null) {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
          console.error(`Error reading localStorage (${key}):`, error);
          return defaultValue;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          console.error(`Error writing localStorage (${key}):`, error);
          return false;
        }
      }
    };

    /* =========================================================
       PATCH: HUD XP updater (bar only)
       - Р—Р°РїРѕРІРЅРµРЅРЅСЏ: profile.xp / xpNeededForLevel(profile.level)
       - Р‘РµР· Р±СѓРґСЊ-СЏРєРёС… РЅР°РґРїРёСЃС–РІ/Р»РµР№Р±Р»С–РІ
       ========================================================= */
    function updateHudXp(profile) {
      try {
        const fill = document.getElementById('top-xp-bar');
        if (!fill || !profile) return;

        const lvl = Math.max(1, Number(profile.level || 1));
        const xp = Math.max(0, Number(profile.xp || 0));

        let need = window.getXpForLevel ? window.getXpForLevel(lvl) : 200;
        need = Math.max(1, need);

        const pct = Math.max(0, Math.min(100, Math.round((xp / need) * 100)));
        fill.style.width = pct + '%';

        // РґР»СЏ РґРѕСЃС‚СѓРїРЅРѕСЃС‚С–: Р±РµР· РІРёРґРёРјРѕРіРѕ С‚РµРєСЃС‚Сѓ, Р°Р»Рµ Р· aria
        fill.setAttribute('aria-label', `XP ${pct}%`);
      } catch (e) {
        console.warn('updateHudXp failed', e);
      }
    }

    // Р·СЂРѕР±РёС‚Рё РґРѕСЃС‚СѓРїРЅРёРј РіР»РѕР±Р°Р»СЊРЅРѕ (Р±Рѕ updateUI() РІРёРєР»РёРєР°С” updateHudXp(profile))
    try { window.updateHudXp = updateHudXp; } catch (e) { /* ignore */ }

    // Legacy HUD XP helper removed вЂ” use `updateHudXp(profile)` from main.js

    // expose to global for console/debugging (new API)
    try { if (typeof updateHudXp === 'function') window.updateHudXp = updateHudXp; } catch (e) { /* ignore */ }

    // User profile management
    const userProfile = {
      STORAGE_KEY: 'elem_user_profile',
      USERS_KEY: 'elem_users',
      
      // Get all registered users
      getAllUsers() {
        return storage.get(this.USERS_KEY, {});
      },
      
      // Save all users
      saveAllUsers(users) {
        return storage.set(this.USERS_KEY, users);
      },
      
      // Check if username exists
      userExists(username) {
        const users = this.getAllUsers();
        return users.hasOwnProperty(username);
      },
      
      // Register new user
      registerUser(username) {
        if (this.userExists(username)) {
          return { success: false, error: 'Р¦Рµ С–Рј\'СЏ РІР¶Рµ Р·Р°Р№РЅСЏС‚Рµ' };
        }
        
        if (username.length < 3) {
          return { success: false, error: 'Р†Рј\'СЏ РјР°С” Р±СѓС‚Рё РЅРµ РјРµРЅС€Рµ 3 СЃРёРјРІРѕР»С–РІ' };
        }
        
        // Generate random 16 starter cards (4 per element)
        const starterIds = (window.getRandomStarterCardIds && window.getRandomStarterCardIds(16))
          || (window.getStarterCardIds && window.getStarterCardIds())
          || [];

        // Fallback to any cards if starters unavailable
        const pool = starterIds.length ? starterIds : (window.ALL_CARDS || []).map(c => c.id);

        // Shuffle ids
        const shuffled = [...pool];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selectedIds = shuffled.slice(0, 16);
        const selectedCards = selectedIds
          .map(id => (window.getCardById ? window.getCardById(id) : null))
          .filter(Boolean);
        
        // First 9 go to deck, rest go to collection
        const deckCards = selectedCards.slice(0, 9).map(card => ({
          id: card.id,
          level: 1
        }));
        const collectionCards = selectedCards.slice(9, 16).map(card => ({
          id: card.id,
          level: 1
        }));
        
        // Initialize progress (XP) for each card
        const progress = {};
        selectedCards.forEach(card => {
          progress[card.id] = { level: 1, xp: 0 };
        });
        
        // Initialize inventory: count of each card
        const inventory = {};
        selectedCards.forEach(card => {
          inventory[card.id] = (inventory[card.id] || 0) + 1;
        });
        
        const users = this.getAllUsers();
        users[username] = {
          name: username,
          level: 1,
          xp: 0,
          bolts: 500,         // Р‘РѕР»С‚Рё рџ”© (Р±Р°Р·РѕРІР° РІР°Р»СЋС‚Р°)
          gears: 0,           // РЁРµСЃС‚РµСЂРЅС– вљ™пёЏ (СЃРµСЂРµРґРЅСЏ РІР°Р»СЋС‚Р°)
          cores: 0,           // РџР°СЂРѕРІС– СЏРґСЂР° вњґпёЋ (РїСЂРµРјС–СѓРј РІР°Р»СЋС‚Р°)
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
          createdAt: Date.now(),
          deckCards: deckCards,
          collectionCards: collectionCards,
          progress: progress,    // XP РґР»СЏ РєРѕР¶РЅРѕС— РєР°СЂС‚Рё
          inventory: inventory   // РєС–Р»СЊРєС–СЃС‚СЊ РєРѕРїС–Р№
        };
        
        this.saveAllUsers(users);
        return { success: true, profile: users[username] };
      },
      
      // Login user
      loginUser(username) {
        // Special-case: if someone attempts to login as the admin test user,
        // create the admin profile automatically with full currencies.
        if (!this.userExists(username)) {
          if (username === 'delta5977525') {
            const users = this.getAllUsers();
            const now = Date.now();
            // Build starter pool similar to registerUser()
            const starterIds = (window.getRandomStarterCardIds && window.getRandomStarterCardIds(16))
              || (window.getStarterCardIds && window.getStarterCardIds())
              || [];
            const pool = starterIds.length ? starterIds : (window.ALL_CARDS || []).map(c => c.id);
            const shuffled = [...pool];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selectedIds = shuffled.slice(0, 16);
            const selectedCards = selectedIds
              .map(id => (window.getCardById ? window.getCardById(id) : null))
              .filter(Boolean);

            const deckCards = selectedCards.slice(0, 9).map(card => ({ id: card.id, level: 1 }));
            const collectionCards = selectedCards.slice(9, 16).map(card => ({ id: card.id, level: 1 }));

            const progress = {};
            selectedCards.forEach(card => {
              progress[card.id] = { level: 1, xp: 0 };
            });

            const inventory = {};
            selectedCards.forEach(card => {
              inventory[card.id] = (inventory[card.id] || 0) + 1;
            });

            const profile = {
              name: username,
              level: 1,
              xp: 0,
              bolts: 9999,
              gears: 9999,
              cores: 9999,
              wins: 0,
              losses: 0,
              gamesPlayed: 0,
              createdAt: now,
              deckCards: deckCards,
              collectionCards: collectionCards,
              progress: progress,
              inventory: inventory,
              tasks: {},
              completedTasks: [],
              tasksResetAt: now
            };
            users[username] = profile;
            this.saveAllUsers(users);
            storage.set(this.STORAGE_KEY, profile);
            return { success: true, profile };
          }
          return { success: false, error: 'РљРѕСЂРёСЃС‚СѓРІР°С‡Р° РЅРµ Р·РЅР°Р№РґРµРЅРѕ' };
        }

        const users = this.getAllUsers();
        const profile = users[username];
        storage.set(this.STORAGE_KEY, profile);
        return { success: true, profile: profile };
      },
      
      // Get current logged in profile
      getCurrentUser() {
        return storage.get(this.STORAGE_KEY);
      },
      
      // Check if user is logged in
      isLoggedIn() {
        return this.getCurrentUser() !== null;
      },
      
      // Logout
      logout() {
        storage.set('currentUser', null);
        localStorage.removeItem(this.STORAGE_KEY);
      },
      
      // Update current user profile
      updateCurrentUser(updates) {
        const profile = this.getCurrentUser();
        if (!profile) return false;
        
        Object.assign(profile, updates);
        storage.set(this.STORAGE_KEY, profile);
        
        // Also update in users list
        const users = this.getAllUsers();
        if (users[profile.name]) {
          users[profile.name] = profile;
          this.saveAllUsers(users);
        }
        
        return profile;
      },
      
      getProfile() {
        return this.getCurrentUser();
      },
      
      saveProfile(profile) {
        return this.updateCurrentUser(profile);
      },

      autoAddToDeck(profile, cardEntry) {
        if (!profile || !cardEntry) {
          return { added: false, replaced: false, replacedPower: null };
        }

        if (!profile.deckCards) profile.deckCards = [];

        // Ensure we work with a proper card instance (with uid and cardId).
        // Use global `createCardInstance` when available; otherwise fall back
        // to a minimal inline creator so code can run before `js/main.js` loads.
        function _makeInstance(input) {
          // input may be an id or an object
          const entry = (input && typeof input === 'object') ? input : { id: input };
          if (typeof window !== 'undefined' && typeof window.createCardInstance === 'function') {
            try {
              return window.createCardInstance(entry.id || entry.cardId || entry, {
                level: entry.level || 1,
                xp: entry.xp || 0,
                power: entry.power || 0
              });
            } catch (e) {
              // fallback to minimal instance below
            }
          }
          const _gen = (typeof window !== 'undefined' && typeof window.genUID === 'function') ? window.genUID : function(p){ return (p||'c') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,10); };
          return {
            uid: entry.uid || _gen('card'),
            cardId: entry.cardId || entry.id,
            level: entry.level || 1,
            xp: entry.xp || 0,
            power: entry.power || 0
          };
        }

        const inst = _makeInstance(cardEntry || (cardEntry && (cardEntry.id || cardEntry.cardId)));

        // Prevent duplicate cardId in deck
        if (profile.deckCards.some(dc => (dc.cardId || dc.id) === inst.cardId)) {
          return { added: false, replaced: false, replacedPower: null };
        }

        const cardObj = window.getCardById && window.getCardById(inst.cardId);
        const cardPower = window.getPower
          ? window.getPower(cardObj, inst.level || 1)
          : (cardObj ? (cardObj.basePower || inst.power || 0) : (inst.power || 0));

        if (profile.deckCards.length < 9) {
          profile.deckCards.push(inst);
          return { added: true, replaced: false, replacedPower: null };
        }

        let weakestIdx = -1;
        let weakestPower = Infinity;

        profile.deckCards.forEach((dc, idx) => {
          const dcObj = window.getCardById && window.getCardById(dc.cardId || dc.id);
          const pwr = window.getPower
            ? window.getPower(dcObj, dc.level || 1)
            : (dcObj ? (dcObj.basePower || dc.power || 0) : (dc.power || 0));

          if (pwr < weakestPower) {
            weakestPower = pwr;
            weakestIdx = idx;
          }
        });

        if (weakestIdx >= 0 && cardPower > weakestPower) {
          profile.deckCards[weakestIdx] = inst;
          return { added: false, replaced: true, replacedPower: weakestPower };
        }

        return { added: false, replaced: false, replacedPower: null };
      },
      
      // Compact number formatter: 1500 -> 1.5k; always uses 'k' for >=1000
      formatCompact(number) {
        const n = Number(number) || 0;
        const neg = n < 0;
        const abs = Math.abs(n);
        if (abs < 1000) return String(n);
        let v = abs / 1000;
        // show one decimal for values < 10k, integer otherwise
        let out;
        if (v < 10) {
          out = Math.round(v * 10) / 10; // one decimal
        } else {
          out = Math.round(v); // integer
        }
        // strip trailing .0
        out = String(out).replace(/\.0$/, '');
        return (neg ? '-' : '') + out + 'k';
      },

      updateUI() {
        const profile = this.getCurrentUser();
        if (!profile) return;
        
        // Update level
        const levelSpan = document.querySelector('.level span');
        if (levelSpan) {
          levelSpan.textContent = profile.level;
        }
        
        // Update currencies on HOME PAGE
        const homeBolts = document.getElementById('home-bolts');
        const homeGears = document.getElementById('home-gears');
        const homeCores = document.getElementById('home-cores');
        
        if (homeBolts) homeBolts.textContent = this.formatCompact(profile.bolts || 0);
        if (homeGears) homeGears.textContent = this.formatCompact(profile.gears || 0);
        if (homeCores) homeCores.textContent = this.formatCompact(profile.cores || 0);
        
        // Update currencies on DECK PAGE
        const boltVal = document.getElementById('deck-bolts');
        const gearVal = document.getElementById('deck-gears');
        const coreVal = document.getElementById('deck-cores');
        
        if (boltVal) boltVal.textContent = this.formatCompact(profile.bolts || 0);
        if (gearVal) gearVal.textContent = this.formatCompact(profile.gears || 0);
        if (coreVal) coreVal.textContent = this.formatCompact(profile.cores || 0);
        
        // Update HUD XP (use centralized updateHudXp)
        try {
          if (typeof updateHudXp === 'function') updateHudXp(profile);
        } catch (e) {
          console.warn('updateHudXp failed', e);
        }
        
        // Update deck power on home screen (use duel-ready deck calculation so UI matches duel)
        try {
          let totalPower = 0;
          if (typeof navigation !== 'undefined' && typeof navigation.buildDuelDeckFromProfile === 'function' && typeof navigation.calcDeckPower === 'function') {
            const battleDeck = navigation.buildDuelDeckFromProfile(profile);
            totalPower = navigation.calcDeckPower(battleDeck);
          } else if (profile.deckCards && profile.deckCards.length > 0) {
            profile.deckCards.forEach(dc => {
              const card = window.getCardById && window.getCardById(dc.cardId || dc.id);
              if (card) {
                const prog = window.getProgress ? window.getProgress(profile, dc.cardId || dc.id) : { level: dc.level || 1, xp: 0 };
                const level = (prog && prog.level) ? prog.level : (dc.level || 1);
                const power = window.getPower ? window.getPower(card, level) : (typeof getPower === 'function' ? getPower(card, level) : 0);
                totalPower += power || 0;
              }
            });
          }
          const deckPowerHome = document.getElementById('deck-power-home');
          if (deckPowerHome) deckPowerHome.textContent = this.formatCompact ? this.formatCompact(totalPower) : String(totalPower);
        } catch (e) {
          console.warn('Failed to compute deck power for home', e);
        }
        
        // Update username in portrait
        const portrait = document.querySelector('.portrait');
        if (portrait) {
          portrait.title = profile.name;
        }
      }
    };

    // Auth UI management
    const authUI = {
      overlay: null,
      
      init() {
        this.overlay = document.getElementById('authOverlay');
        
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
          tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            this.switchTab(tabName);
          });
        });
        
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleLogin();
        });
        
        // Register form
        document.getElementById('registerForm').addEventListener('submit', (e) => {
          e.preventDefault();
          this.handleRegister();
        });
        
        // Check if already logged in
        if (userProfile.isLoggedIn()) {
          this.hideAuth();
        } else {
          this.showAuth();
        }
      },
      
      switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === tabName);
        });
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(f => {
          f.classList.toggle('active', f.id === tabName + 'Form');
        });
        
        // Clear errors
        this.hideError('login');
        this.hideError('register');
      },
      
      handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        
        if (!username) {
          this.showError('login', 'Р’РІРµРґС–С‚СЊ С–Рј\'СЏ РєРѕСЂРёСЃС‚СѓРІР°С‡Р°');
          return;
        }
        
        const result = userProfile.loginUser(username);
        
        if (result.success) {
          console.log('Login successful:', result.profile);
          this.hideAuth();
          userProfile.updateUI();
          if (typeof taskEvent === 'function') taskEvent('login', 1);
        } else {
          this.showError('login', result.error);
        }
      },
      
      handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        
        if (!username) {
          this.showError('register', 'Р’РІРµРґС–С‚СЊ С–Рј\'СЏ РєРѕСЂРёСЃС‚СѓРІР°С‡Р°');
          return;
        }
        
        const result = userProfile.registerUser(username);
        
        if (result.success) {
          console.log('Registration successful:', result.profile);
          // Auto-login after registration
          userProfile.loginUser(username);
          this.hideAuth();
          userProfile.updateUI();
          if (typeof taskEvent === 'function') taskEvent('login', 1);
        } else {
          this.showError('register', result.error);
        }
      },
      
      showError(formType, message) {
        const errorEl = document.getElementById(formType + 'Error');
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.classList.add('show');
        }
      },
      
      hideError(formType) {
        const errorEl = document.getElementById(formType + 'Error');
        if (errorEl) {
          errorEl.classList.remove('show');
        }
      },
      
      showAuth() {
        if (this.overlay) {
          this.overlay.style.display = 'flex';
          setTimeout(() => {
            this.overlay.classList.remove('hidden');
          }, 10);
        }
      },
      
      hideAuth() {
        if (this.overlay) {
          this.overlay.classList.add('hidden');
        }
      }
    };

    // Page navigation system
    const navigation = {
        // ========== BAG SYSTEM ========== 
        loadBagCards() {
          const profile = userProfile.getProfile();
          if (!profile) return;
          // Р’ СЃСѓРјС†С– вЂ” Р»РёС€Рµ С‚С– РєР°СЂС‚Рё Р· collectionCards, СЏРєРёС… РЅРµРјР°С” РІ deckCards
          let deckIds = new Set((profile.deckCards || []).map(c => c.id));
          const bagCards = (profile.collectionCards || []).filter(c => !deckIds.has(c.id));
          const container = document.getElementById('bag-cards-list');
          if (!container) return;
          if (bagCards.length === 0) {
            container.innerHTML = '<div class="no-bag-cards">РќРµРјР°С” РєР°СЂС‚ Сѓ СЃСѓРјС†С–</div>';
            return;
          }
          const elementEmojis = {
            fire: 'рџ”Ґ',
            water: 'рџ’§',
            air: 'в™ЁпёЏ',
            earth: 'рџЌѓ'
          };
          container.innerHTML = bagCards.map(card => {
            const cardData = getCardById(card.id);
            if (!cardData) return '';
            const emoji = elementEmojis[cardData.element] || 'вљ™';
            const src = window.getCardImage(cardData);
            return `
              <div class="bag-card-item" data-card-id="${card.id}">
                <img class="bag-card-img" src="${src}" alt="${cardData.name}" />
                <span class="bag-card-emoji">${emoji}</span>
                <span class="bag-card-name">${cardData.name}</span>
                <span class="bag-card-status">Р—РЅР°Р№РґРµРЅРѕ</span>
              </div>
            `;
          }).join('');
        },
        // ========== END BAG SYSTEM ========== 
          // РћС‚СЂРёРјР°С‚Рё РєР°СЂС‚Рё Р· СЃСѓРјРєРё (СЏРєС– РЅРµ РІ РєРѕР»РѕРґС–)
          getBagCards(profile) {
            if (!profile) return [];
            let deckIds = new Set((profile.deckCards || []).map(c => c.id));
            // РџРѕРІРµСЂС‚Р°С”РјРѕ С‚С–Р»СЊРєРё С‚С– РєР°СЂС‚Рё Р· collectionCards, СЏРєРёС… РЅРµРјР°С” РІ deckCards
            return (profile.collectionCards || []).filter(c => !deckIds.has(c.id));
          },
      currentPage: 'home',
      
      showPage(pageId) {
        // Remove active class from all pages
        document.querySelectorAll('.page').forEach(page => {
          page.classList.remove('active');
        });
        
        // Add active class to target page
        const targetPage = document.getElementById(`page-${pageId}`);
        if (targetPage) {
          targetPage.classList.add('active');
          this.currentPage = pageId;
          
          // Update profile stats if on profile page
          if (pageId === 'profile') {
            this.updateProfilePage();
          }
          
          // Load deck cards if on deck page
          if (pageId === 'deck') {
            this.loadDeckCards();
          }
          
          // Load collection cards if on collections page
          if (pageId === 'collections') {
            if (typeof this.renderCollections === 'function') {
              this.renderCollections();
            }
          }
          
          // Load shop if on shop page
          if (pageId === 'shop') {
            this.loadShop();
          }

          // Initialize duels UI
          if (pageId === 'duels') {
            this.initDuelsPage();
          }

          // Load tasks
          if (pageId === 'tasks') {
            const profile = userProfile.getProfile();
            if (profile) maybeResetTasks(profile);
            renderTasks();
          }
        }
      },
      
      updateProfilePage() {
        const profile = userProfile.getProfile();
        document.getElementById('profile-level').textContent = profile.level;
        document.getElementById('profile-wins').textContent = profile.wins;
        document.getElementById('profile-losses').textContent = profile.losses;
        document.getElementById('profile-games').textContent = profile.gamesPlayed;
        this.updateXP(profile);
      },

      updateXP(profile) {
        const currentXp = profile.xp;
        const level = profile.level;
        const xpMax = getXpForLevel(level);

        const percent = Math.min(100, (currentXp / xpMax) * 100);

        // РўРµРєСЃС‚
        const xpText = document.getElementById("xp-text");
        if (xpText) {
          xpText.textContent = `${currentXp} / ${xpMax}`;
        }

        // РЁРєР°Р»Р° РІ РїСЂРѕС„С–Р»С–
        const xpFill = document.getElementById("xp-bar-fill");
        if (xpFill) {
          xpFill.style.width = percent + "%";
        }

        // Р’РµСЂС…РЅСЏ С€РєР°Р»Р° (Р’РђР–Р›РР’Рћ)
        const topXpBar = document.getElementById("top-xp-bar");
        if (topXpBar) {
          topXpBar.style.width = percent + "%";
        }
      },

      

      // ========== UPGRADE SYSTEM ==========
      
      // Build inventory from deck + collection
      getInventory(profile) {
        const inventory = {};
        
        // Count cards from both deck and collection
        [...profile.deckCards, ...profile.collectionCards].forEach(userCard => {
          inventory[userCard.id] = (inventory[userCard.id] || 0) + 1;
        });
        
        return inventory;
      },

      // Get count of extra copies available for upgrade
      getExtraCopies(inventory, cardId) {
        const total = inventory[cardId] || 0;
        return Math.max(0, total - 1); // -1 because one copy is in deck
      },

      // Get cost to upgrade from current level to next
      getUpgradeCost(level) {
        return level; // lvl 1->2 costs 1, lvl 2->3 costs 2, etc
      },

      // Check if a deck card can be upgraded
      canUpgradeCard(deckItem, inventory) {
        const cost = this.getUpgradeCost(deckItem.level);
        const extra = this.getExtraCopies(inventory, deckItem.id);
        return extra >= cost;
      },

      // Check if deck has any upgradable cards
      hasAnyUpgradable(deck, inventory) {
        return deck.some(item => this.canUpgradeCard(item, inventory));
      },

      // Check if a target card can be guaranteed to level up by burning owned weaker cards
      canGuaranteedLevelByBurning(profile, targetCardId) {
        if (!profile || !targetCardId) return false;
        // get current progress
          const prog = window.getProgress ? window.getProgress(profile, targetCardId) : (profile.progress && profile.progress[targetCardId]) || { level: 1, xp: 0 };
        const need = window.xpNeed ? window.xpNeed(prog.level) : this.xpNeededForLevel(prog.level);
        const remaining = Math.max(0, need - (prog.xp || 0));
        if (remaining <= 0) return true;

        const targetCard = window.getCardById ? window.getCardById(targetCardId) : null;
        if (!targetCard) return false;

          const deckIds = new Set((profile.deckCards || []).map(d => d.id));
          // If target card is in deck, never show guarantee indicator
          if (deckIds.has(targetCardId)) return false;

        // Sum available XP from collection entries (excluding deck copies)
        let totalXp = 0;
        if (Array.isArray(profile.collectionCards)) {
          for (let i = 0; i < profile.collectionCards.length; i++) {
            const entry = profile.collectionCards[i];
            if (!entry || !entry.id) continue;
            if (entry.id === targetCardId) continue;
            if (deckIds.has(entry.id)) continue;
            const c = window.getCardById ? window.getCardById(entry.id) : null;
            if (!c || c.element !== targetCard.element) continue;
            const lvl = entry.level || 1;
            const gain = window.xpValue ? window.xpValue(lvl) : (c.basePower || 10);
            totalXp += gain;
            if (totalXp >= remaining) return true;
          }
        }

        // Sum available XP from inventory counters (assume level 1 for inventory entries)
        const inv = profile.inventory || {};
        for (const id in inv) {
          if (!Object.prototype.hasOwnProperty.call(inv, id)) continue;
          const count = inv[id] || 0;
          if (count <= 0) continue;
          if (id === targetCardId) continue;
          if (deckIds.has(id)) continue;
          const c = window.getCardById ? window.getCardById(id) : null;
          if (!c || c.element !== targetCard.element) continue;
          const gain = window.xpValue ? window.xpValue(1) : (c.basePower || 10);
          totalXp += gain * count;
          if (totalXp >= remaining) return true;
        }

        return false;
      },

      // Perform upgrade on a deck card
      performUpgrade(deckItem, inventory, profile) {
        const cost = this.getUpgradeCost(deckItem.level);
        const extra = this.getExtraCopies(inventory, deckItem.id);

        if (extra < cost) return false;

        // Remove used copies from collection
        let toRemove = cost;
        for (let i = profile.collectionCards.length - 1; i >= 0 && toRemove > 0; i--) {
          if (profile.collectionCards[i].id === deckItem.id) {
            profile.collectionCards.splice(i, 1);
            toRemove--;
          }
        }

        // Increase level
        deckItem.level += 1;

        // Save profile
        userProfile.updateCurrentUser(profile);

        return true;
      },

      // ========== END UPGRADE SYSTEM ==========

      // ========== SHOP SYSTEM ==========
      
      // Shop products catalog
      getShopProducts() {
        return {
          offers: [
            {
              sku: 'offer_elements',
              title: 'РљРѕР»РµРєС†С–СЏ РµР»РµРјРµРЅС‚Р°Р»С–РІ',
              description: 'Р’СЃС– С‡РѕС‚РёСЂРё РєР°СЂС‚Рё Р· РєРѕР»РµРєС†С–С— В«Р•Р»РµРјРµРЅС‚Р°Р»С–В»',
              icon: 'рџ”Ґ',
              price: { currency: 'gears', amount: 20 },
              contents: { cards: 4 },
              limited: true
            }
          ],
          packs: [],
          singleCards: [
            {
              sku: 'card_legendary',
              title: 'Р›РµРіРµРЅРґР°СЂРЅР° РєР°СЂС‚Р°',
              description: 'Р“Р°СЂР°РЅС‚РѕРІР°РЅР° Р»РµРіРµРЅРґР°СЂРЅР° РєР°СЂС‚Р°',
              icon: 'вљЎ',
              price: { currency: 'gears', amount: 150 },
              contents: { cards: 1 },
              chance: { text: '40% С€Р°РЅСЃ РјС–С„С–С‡РЅРѕС—', class: '' }
            },
            {
              sku: 'card_epic',
              title: 'Р•РїС–С‡РЅР° РєР°СЂС‚Р°',
              description: 'Р“Р°СЂР°РЅС‚РѕРІР°РЅР° РµРїС–С‡РЅР° РєР°СЂС‚Р°',
              icon: 'рџ’њ',
              price: { currency: 'gears', amount: 50 },
              contents: { cards: 1 },
              chance: { text: '30% С€Р°РЅСЃ РјС–С„С–С‡РЅРѕС—', class: 'rare' }
            },
            {
              sku: 'card_uncommon',
              title: 'РќРµР·РІРёС‡Р°Р№РЅР° РєР°СЂС‚Р°',
              description: 'Р“Р°СЂР°РЅС‚РѕРІР°РЅР° РЅРµР·РІРёС‡Р°Р№РЅР° РєР°СЂС‚Р°',
              icon: 'рџ’љ',
              price: { currency: 'bolts', amount: 500 },
              contents: { cards: 1 },
              chance: { text: '15% С€Р°РЅСЃ РµРїС–С‡РЅРѕС—', class: 'uncommon' }
            }
          ]
        };
      },

      loadShop() {
        const products = this.getShopProducts();
        this.renderNewShopItems('offers-container', products.offers, true);
        this.renderNewShopItems('single-cards-container', products.singleCards, false, true);
      },

      renderNewShopItems(containerId, items, isLimited = false, hasChance = false) {
        const container = document.getElementById(containerId);
        if (!container) {
          console.warn(`Container not found: ${containerId}`);
          return;
        }

        const profile = userProfile.getProfile();
        container.innerHTML = '';

        console.log(`Rendering ${items.length} items to ${containerId}`);

        items.forEach(item => {
          // Check if this is a one-time purchase that was already bought
          if (item.sku === 'offer_elements' && profile && profile.purchasedOffers && profile.purchasedOffers.includes('offer_elements')) {
            console.log(`Skipping already purchased: ${item.sku}`);
            return; // Skip rendering this item
          }

          const card = document.createElement('div');
          card.className = 'shop-item-card';

          const currencyEmojis = {
            bolts: 'рџ”©',
            gears: 'вљ™пёЏ',
            cores: 'вњґпёЋ'
          };
          const currencyIcon = currencyEmojis[item.price.currency] || '?';
          
          const chanceHTML = hasChance && item.chance 
            ? `<div class="shop-item-chance ${item.chance.class}">${item.chance.text}</div>`
            : '';

          card.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-content">
              <div class="shop-item-name">${item.title}</div>
              <div class="shop-item-desc">${item.description}</div>
              ${chanceHTML}
            </div>
            <div class="shop-item-action">
              <div class="shop-item-price">${currencyIcon} ${item.price.amount}</div>
              <button class="shop-buy-button" data-sku="${item.sku}">
                РљСѓРїРёС‚Рё
              </button>
            </div>
          `;

          container.appendChild(card);
        });

        // Add click handlers
        container.querySelectorAll('.shop-buy-button').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sku = btn.dataset.sku;
            console.log('Buying product:', sku);
            navigation.buyProduct(sku);
          });
        });
      },

      loadShopCards(elementFilter = 'all') {
        const profile = userProfile.getProfile();
        if (!profile) return;

        const container = document.getElementById('cards-container');
        if (!container) return;

        container.innerHTML = '';

        // Get all cards
        let allCards = window.ALL_CARDS || [];
        
        // Filter by element
        const filteredCards = elementFilter === 'all' 
          ? allCards 
          : allCards.filter(c => c.element === elementFilter);

        // Display cards with prices (use cardRenderer/createCardView if available)
        filteredCards.forEach(card => {
          const cardDiv = document.createElement('div');
          cardDiv.className = 'product-card';

          const displayPower = window.getPower ? window.getPower(card, 1) : (card.basePower || card.power || 0);
          // Price based on rarity/power
          const prices = {
            gears: Math.max(1, Math.ceil(displayPower * 2)),
            bolts: Math.max(1, Math.ceil(displayPower / 1.5)),
            cores: Math.max(1, Math.ceil(displayPower / 3))
          };

          // Render visual: use CardRendererV2 (standard). Fallback to createCardView or emoji.
          let visualHtml = '';
          if (window.CardRendererV2 && typeof window.CardRendererV2.render === 'function') {
            try {
              visualHtml = window.CardRendererV2.render(card, { size: 'normal', showElement: true, showPower: false });
            } catch (err) {
              console.warn('CardRendererV2.render failed for shop card', card.id, err);
              visualHtml = '';
            }
          }
          if (!visualHtml && window.createCardView) {
            try {
              const el = window.createCardView(card);
              visualHtml = el ? el.outerHTML : '';
            } catch (err) {
              console.warn('createCardView failed for shop card', card.id, err);
            }
          }
          if (!visualHtml) {
            const elementEmoji = this.getElementEmoji(card.element);
            visualHtml = `<div class="product-icon">${elementEmoji}</div>`;
          } else {
            visualHtml = `<div class="product-icon">${visualHtml}</div>`;
          }

          cardDiv.innerHTML = `
            <div class="product-header">
              ${visualHtml}
              <div class="product-info">
                <div class="product-title">${card.name}</div>
                <div class="product-desc">РЎРёР»Р°: ${displayPower}</div>
              </div>
            </div>
            <div class="product-footer">
              <div style="display: flex; gap: 8px; flex-direction: column; width: 100%;">
                <button class="product-buy-btn" data-card-id="${card.id}" data-currency="gears" data-price="${prices.gears}" title="РЁРµСЃС‚РµСЂРЅС–">
                  рџ”§ ${prices.gears}
                </button>
                <button class="product-buy-btn" data-card-id="${card.id}" data-currency="bolts" data-price="${prices.bolts}" title="Р‘РѕР»С‚Рё">
                  вљ™пёЏ ${prices.bolts}
                </button>
                <button class="product-buy-btn" data-card-id="${card.id}" data-currency="cores" data-price="${prices.cores}" title="РџР°СЂРѕРІС– СЏРґСЂР°">
                  рџ”Ґ ${prices.cores}
                </button>
              </div>
            </div>
          `;

          container.appendChild(cardDiv);
        });

        // Add click handlers for card purchase
        container.querySelectorAll('.product-buy-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const cardId = btn.dataset.cardId;
            const currency = btn.dataset.currency;
            const price = parseInt(btn.dataset.price);
            this.buyCard(cardId, currency, price);
          });
        });
      },

      buyCard(cardId, currency, price) {
        const profile = this.getProfile();
        if (!profile) return;

        // Check balance using Currency System
        if (!window.CurrencySystem.canAfford(profile, currency, price)) {
          const currencyName = window.CurrencySystem.getCurrencyNameGenitive(currency);
          alert(`РќРµРґРѕСЃС‚Р°С‚РЅСЊРѕ ${currencyName}! РџРѕС‚СЂС–Р±РЅРѕ ${price}`);
          return;
        }

        const card = window.getCardById(cardId);
        if (!card) return;

        // Deduct currency using Currency System
        window.CurrencySystem.deduct(profile, currency, price);

        // Add card to collection
        if (!profile.collectionCards) {
          profile.collectionCards = [];
        }
        const newCardEntry = { id: card.id, level: 1 };
        profile.collectionCards.push(newCardEntry);

        // РђРІС‚Рѕ-РґРѕРґР°РІР°РЅРЅСЏ РІ РєРѕР»РѕРґСѓ: СЏРєС‰Рѕ РјРµРЅС€Рµ 9 РєР°СЂС‚ вЂ“ РґРѕРґР°С”РјРѕ;
        // С–РЅР°РєС€Рµ Р·Р°РјС–РЅСЋС”РјРѕ РЅР°Р№СЃР»Р°Р±С€Сѓ РєР°СЂС‚Сѓ, СЏРєС‰Рѕ РЅРѕРІР° СЃРёР»СЊРЅС–С€Р°
        userProfile.autoAddToDeck(profile, newCardEntry);

        // Р”РѕРґР°С‚Рё РІ inventory (РґР»СЏ РїСЂРѕРєР°С‡РєРё)
        if (!profile.inventory) {
          profile.inventory = {};
        }
        profile.inventory[card.id] = (profile.inventory[card.id] || 0) + 1;

        // Р†РЅС–С†С–Р°Р»С–Р·СѓРІР°С‚Рё РїСЂРѕРіСЂРµСЃ РєР°СЂС‚Рё
        const prog = window.getProgress ? window.getProgress(profile, card.id) : null;

        // Save profile (includes collection + deck changes)
        this.saveProfile(profile);

        // Update UI
        this.loadDeckCards(); // This will update topbar

        // Show success message
        const currencyEmojis = {
          gears: 'вљ™пёЏ',
          bolts: 'рџ”©',
          cores: 'вњґпёЋ'
        };
        alert(`вњ… ${card.name} РєСѓРїР»РµРЅРѕ Р·Р° ${price} ${currencyEmojis[currency]}!`);

        // Reload cards
        this.loadShopCards(this.currentCardFilter || 'all');
      },

      renderProducts(containerId, products) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        products.forEach(product => {
          const card = document.createElement('div');
          card.className = 'product-card';

          const currencyEmojis = {
            bolts: 'рџ”©',
            gears: 'вљ™пёЏ',
            cores: 'вњґпёЋ'
          };
          const currencyIcon = currencyEmojis[product.price.currency] || '?';
          const badgeHTML = product.badge 
            ? `<div class="product-badge ${product.badge.class}">${product.badge.text}</div>` 
            : '';
          const bonusHTML = product.bonus 
            ? `<div class="product-bonus">${product.bonus}</div>` 
            : '';

          card.innerHTML = `
            ${badgeHTML}
            <div class="product-header">
              <div class="product-icon">${product.icon}</div>
              <div class="product-info">
                <div class="product-title">${product.title}</div>
                <div class="product-desc">${product.description}</div>
                ${bonusHTML}
              </div>
            </div>
            <div class="product-footer">
              <div class="product-price">
                <span class="currency-icon">${currencyIcon}</span>
                <span>${product.price.amount}</span>
              </div>
              <button class="product-buy-btn" data-sku="${product.sku}">РљСѓРїРёС‚Рё</button>
            </div>
          `;

          container.appendChild(card);
        });

        // Add click handlers
        container.querySelectorAll('.product-buy-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const sku = btn.dataset.sku;
            this.buyProduct(sku);
          });
        });
      },

      canAfford(product) {
        const profile = this.getProfile();
        if (!profile) return false;

        const currency = product.price.currency;
        return profile[currency] >= product.price.amount;
      },

      buyProduct(sku) {
        console.log('[BUY] Starting purchase for SKU:', sku);
        const profile = userProfile.getProfile();
        if (!profile) {
          console.error('[BUY] No profile found!');
          return;
        }
        console.log('[BUY] Profile loaded:', profile);

        const allProducts = this.getShopProducts();
        const product = [...allProducts.offers, ...allProducts.singleCards]
          .find(p => p.sku === sku);

        if (!product) {
          console.error('[BUY] Product not found:', sku);
          alert('РўРѕРІР°СЂ РЅРµ Р·РЅР°Р№РґРµРЅРѕ!');
          return;
        }

        // РљР РћРљ 1: РџРµСЂРµРІС–СЂРєР° РјРѕР¶Р»РёРІРѕСЃС‚С– РїРѕРєСѓРїРєРё
        const canAfford = this.canAfford(profile, product.price);
        if (!canAfford) {
          console.warn('[BUY] Cannot afford. Need:', product.price.amount, 'Have:', profile[product.price.currency]);
          const currencyNames = {
            bolts: 'Р±РѕР»С‚С–РІ',
            gears: 'С€РµСЃС‚РµСЂРµРЅСЊ',
            cores: 'РїР°СЂРѕРІРёС… СЏРґРµСЂ'
          };
          const currencyName = currencyNames[product.price.currency] || 'РІР°Р»СЋС‚Рё';
          alert(`РќРµРґРѕСЃС‚Р°С‚РЅСЊРѕ ${currencyName}! РџРѕС‚СЂС–Р±РЅРѕ ${product.price.amount}`);
          return;
        }

        // РљР РћРљ 2: РЎРїРёСЃР°РЅРЅСЏ РІР°Р»СЋС‚Рё
        const currency = product.price.currency;
        profile[currency] -= product.price.amount;
        console.log('[BUY] Currency deducted. New balance:', profile[currency]);

        // РљР РћРљ 3: Р’РёРґР°С‡Р° РЅР°РіРѕСЂРѕРґ (РєР°СЂС‚Рё Р°Р±Рѕ РІР°Р»СЋС‚Р°)
        const rewards = [];

        if (product.contents.cards) {
          console.log('[BUY] Granting pack of', product.contents.cards, 'cards');
          // Mark SKU so grantPack can apply product-specific drop options
          profile._lastPurchasedSku = sku;
          const cards = this.grantPack(profile, product.contents.cards);
          // cleanup helper flag
          delete profile._lastPurchasedSku;
          rewards.push(...cards);
        }

        // Р’РёРґР°С‡Р° С–РЅС€РёС… РЅР°РіРѕСЂРѕРґ (РіР°СЂРЅРёР№ Р±РѕРЅСѓСЃ)
        if (product.contents.gears) {
          profile.gears = (profile.gears || 0) + product.contents.gears;
          if (typeof taskEvent === 'function') taskEvent('gears', product.contents.gears);
        }
        if (product.contents.cores) {
          profile.cores = (profile.cores || 0) + product.contents.cores;
        }
        if (product.contents.bolts) {
          profile.bolts = (profile.bolts || 0) + product.contents.bolts;
        }

        // РљР РћРљ 4: РџРѕР·РЅР°С‡РёС‚Рё РѕРґРЅРѕСЂР°Р·РѕРІС– С‚РѕРІР°СЂРё СЏРє РєСѓРїР»РµРЅС–
        if (sku === 'offer_elements') {
          if (!profile.purchasedOffers) {
            profile.purchasedOffers = [];
          }
          profile.purchasedOffers.push(sku);
        }

        // РљР РћРљ 5: Р—Р±РµСЂРµР¶РµРЅРЅСЏ РїСЂРѕС„С–Р»СЋ
        userProfile.updateCurrentUser(profile);
        console.log('[BUY] Profile saved');

        // РљР РћРљ 6: РћРЅРѕРІР»РµРЅРЅСЏ UI
        userProfile.updateUI();
        console.log('[BUY] UI updated');

        // РљР РћРљ 7: РџРµСЂРµР·Р°РІР°РЅС‚Р°Р¶РёС‚Рё РјР°РіР°Р·РёРЅ (РїСЂРёС…РѕРІР°С‚Рё РѕРґРЅРѕСЂР°Р·РѕРІС– С‚РѕРІР°СЂРё)
        if (sku === 'offer_elements') {
          this.loadShop();
        }

        // РљР РћРљ 8: РџРѕРєР°Р· РјРѕРґР°Р»РєРё Р· РЅР°РіРѕСЂРѕРґР°РјРё
        console.log('[BUY] Purchase complete! Rewards:', rewards.length, 'cards');
        if (rewards.length > 0) {
          this.showPackModal(rewards);
        } else {
          alert(`вњ… РџРѕРєСѓРїРєР° СѓСЃРїС–С€РЅР°!`);
        }
      },

      // Р¤СѓРЅРєС†С–СЏ РґР»СЏ РїРµСЂРµРІС–СЂРєРё РјРѕР¶Р»РёРІРѕСЃС‚С– РїРѕРєСѓРїРєРё
      canAfford(profile, price) {
        const { currency, amount } = price;
        return (profile[currency] ?? 0) >= amount;
      },

      grantPack(profile, count) {
        let allCards = window.ALL_CARDS || [];
        const rewards = [];

        // Р†РЅС–С†С–Р°Р»С–Р·СѓРІР°С‚Рё С–РЅРІРµРЅС‚Р°СЂ СЏРєС‰Рѕ РЅРµ С–СЃРЅСѓС”
        if (!profile.inventory) {
          profile.inventory = {};
        }
        if (!profile.collectionCards) {
          profile.collectionCards = [];
        }

        for (let i = 0; i < count; i++) {
          let card = null;
          const sku = profile._lastPurchasedSku || '';

          // Р Р†Р—РќР† РўРРџР РџРђРљР†Р’ Р— Р Р†Р—РќРРњР РћР‘РњР•Р–Р•РќРќРЇРњР
          if (sku === 'card_uncommon') {
            // "РќРµР·РІРёС‡Р°Р№РЅР° РєР°СЂС‚Р°" - 500 Р±РѕР»С‚С–РІ
            // РћР‘РњР•Р–Р•РќРќРЇ: РўС–Р»СЊРєРё R1-R4 (Р±РµР· Р»РµРіРµРЅРґР°СЂРЅРёС…/РјС–С„С–С‡РЅРёС…)
            const rarityRoll = Math.random() * 100;
            let targetRarity;
            
            if (rarityRoll < 60) {
              targetRarity = 'common';       // 60% - Р—РІРёС‡Р°Р№РЅР° (R1)
            } else if (rarityRoll < 75) {
              targetRarity = 'uncommon';     // 15% - РќРµР·РІРёС‡Р°Р№РЅР° (R2)
            } else if (rarityRoll < 90) {
              targetRarity = 'rare';         // 15% - Р С–РґРєС–СЃРЅР° (R3)
            } else {
              targetRarity = 'epic';         // 10% - Р•РїС–С‡РЅР° (R4)
            }
            
            // Р¤С–Р»СЊС‚СЂСѓС”РјРѕ РєР°СЂС‚Рё С‚С–Р»СЊРєРё Р· РґРѕР·РІРѕР»РµРЅРёРјРё СЂС–РґРєРѕСЃС‚СЏРјРё
            const allowedRarities = ['common', 'uncommon', 'rare', 'epic'];
            const candidates = allCards.filter(c => 
              allowedRarities.includes(c.rarity) && c.rarity === targetRarity
            );
            
            if (candidates.length > 0) {
              card = candidates[Math.floor(Math.random() * candidates.length)];
              console.log(`[GRANTPACK] ${sku}: ${targetRarity} - ${card.name}`);
            } else {
              // Р РµР·РµСЂРІРЅРёР№ РІР°СЂС–Р°РЅС‚: Р±СѓРґСЊ-СЏРєР° РєР°СЂС‚Р° R1-R4
              const fallback = allCards.filter(c => allowedRarities.includes(c.rarity));
              card = fallback[Math.floor(Math.random() * fallback.length)];
              console.log(`[GRANTPACK] ${sku}: Fallback ${card.rarity} - ${card.name}`);
            }
            
          } else if (sku === 'card_epic') {
            // "Р•РїС–С‡РЅР° РєР°СЂС‚Р°" - 50 С€РµСЃС‚РµСЂРµРЅСЊ
            // РћР‘РњР•Р–Р•РќРќРЇ: R4-R6 Р· С€Р°РЅСЃР°РјРё 50%/30%/20%
            const rarityRoll = Math.random() * 100;
            let targetRarity;
            
            if (rarityRoll < 50) {
              targetRarity = 'epic';       // 50% - Р•РїС–С‡РЅР° (R4)
            } else if (rarityRoll < 80) {
              targetRarity = 'legendary';  // 30% - Р›РµРіРµРЅРґР°СЂРЅР° (R5)
            } else {
              targetRarity = 'mythic';     // 20% - РњС–С„С–С‡РЅР° (R6)
            }
            
            // Р¤С–Р»СЊС‚СЂСѓС”РјРѕ РєР°СЂС‚Рё С‚С–Р»СЊРєРё Р· РґРѕР·РІРѕР»РµРЅРёРјРё СЂС–РґРєРѕСЃС‚СЏРјРё
            const allowedRarities = ['epic', 'legendary', 'mythic'];
            const candidates = allCards.filter(c => 
              allowedRarities.includes(c.rarity) && c.rarity === targetRarity
            );
            
            if (candidates.length > 0) {
              card = candidates[Math.floor(Math.random() * candidates.length)];
              console.log(`[GRANTPACK] ${sku}: ${targetRarity} - ${card.name}`);
            } else {
              // РЇРєС‰Рѕ РЅРµРјР°С” РєР°СЂС‚ С†С–С”С— СЂС–РґРєРѕСЃС‚С–, Р±РµСЂРµРјРѕ Р±СѓРґСЊ-СЏРєСѓ Р· РґРѕР·РІРѕР»РµРЅРёС…
              const fallback = allCards.filter(c => allowedRarities.includes(c.rarity));
              card = fallback[Math.floor(Math.random() * fallback.length)];
              console.log(`[GRANTPACK] ${sku}: Fallback ${card.rarity} - ${card.name}`);
            }
            
          } else if (sku === 'card_legendary') {
            // "Р›РµРіРµРЅРґР°СЂРЅР° РєР°СЂС‚Р°" - 150 С€РµСЃС‚РµСЂРµРЅСЊ
            // РћР‘РњР•Р–Р•РќРќРЇ: Р“Р°СЂР°РЅС‚РѕРІР°РЅРѕ Р»РµРіРµРЅРґР°СЂРЅР° (R5) Р°Р±Рѕ РјС–С„С–С‡РЅР° (R6)
            const allowedRarities = ['legendary', 'mythic'];
            
            // 80% С€Р°РЅСЃ РЅР° R5, 20% РЅР° R6
            const isMythic = Math.random() < 0.2;
            const targetRarity = isMythic ? 'mythic' : 'legendary';
            
            const candidates = allCards.filter(c => c.rarity === targetRarity);
            if (candidates.length > 0) {
              card = candidates[Math.floor(Math.random() * candidates.length)];
              console.log(`[GRANTPACK] ${sku}: ${targetRarity} - ${card.name}`);
            } else {
              // РЇРєС‰Рѕ РЅРµРјР°С” РјС–С„С–С‡РЅРёС…, Р±РµСЂРµРјРѕ Р»РµРіРµРЅРґР°СЂРЅСѓ, С– РЅР°РІРїР°РєРё
              const fallback = allCards.filter(c => allowedRarities.includes(c.rarity));
              card = fallback[Math.floor(Math.random() * fallback.length)];
              console.log(`[GRANTPACK] ${sku}: Fallback ${card.rarity} - ${card.name}`);
            }
            
          } else if (sku === 'offer_elements') {
            // "РљРѕР»РµРєС†С–СЏ РµР»РµРјРµРЅС‚Р°Р»С–РІ" - 20 С€РµСЃС‚РµСЂРµРЅСЊ
            // РћР‘РњР•Р–Р•РќРќРЇ: РўС–Р»СЊРєРё R1-R4 (Р±РµР· Р»РµРіРµРЅРґР°СЂРЅРёС…/РјС–С„С–С‡РЅРёС…)
            const allowedRarities = ['common', 'uncommon', 'rare', 'epic'];
            
            // Р”Р»СЏ РЅР°Р±РѕСЂС–РІ - СЂС–РІРЅРѕРјС–СЂРЅРёР№ СЂРѕР·РїРѕРґС–Р»
            const rarityRoll = Math.random() * 100;
            let targetRarity;
            
            if (rarityRoll < 25) {
              targetRarity = 'common'; // 25% - Р—РІРёС‡Р°Р№РЅР°
            } else if (rarityRoll < 50) {
              targetRarity = 'uncommon'; // 25% - РќРµР·РІРёС‡Р°Р№РЅР°
            } else if (rarityRoll < 75) {
              targetRarity = 'rare'; // 25% - Р С–РґРєС–СЃРЅР°
            } else {
              targetRarity = 'epic'; // 25% - Р•РїС–С‡РЅР°
            }
            
            const candidates = allCards.filter(c => c.rarity === targetRarity);
            if (candidates.length > 0) {
              card = candidates[Math.floor(Math.random() * candidates.length)];
              console.log(`[GRANTPACK] ${sku}: ${targetRarity} - ${card.name}`);
            } else {
              const fallback = allCards.filter(c => allowedRarities.includes(c.rarity));
              card = fallback[Math.floor(Math.random() * fallback.length)];
              console.log(`[GRANTPACK] ${sku}: Fallback ${card.rarity} - ${card.name}`);
            }
            
          } else {
            // Р”Р»СЏ С–РЅС€РёС… С‚РѕРІР°СЂС–РІ (СЏРєС‰Рѕ РІРёРєРѕСЂРёСЃС‚РѕРІСѓС”С‚СЊСЃСЏ dropSystem)
            if (window.dropSystem && typeof window.dropSystem.dropCardWithOptions === 'function') {
              let opts = {};
              
              // РќР°Р»Р°С€С‚СѓРІР°РЅРЅСЏ РґР»СЏ СЂС–Р·РЅРёС… SKU
              if (sku && sku.startsWith('card_')) {
                opts = { maxRarity: 'epic' }; // Р—Р° Р·Р°РјРѕРІС‡СѓРІР°РЅРЅСЏРј - Р±РµР· Р»РµРіРµРЅРґР°СЂРЅРёС…
              }
              
              const res = window.dropSystem.dropCardWithOptions(
                profile, 
                allCards, 
                window.STARTER_CARDS || [], 
                profile.pityCounters || {noLegendary:0, noMythic:0}, 
                opts
              );
              card = res.card;
              profile.pityCounters = res.pityCounters;
              console.log(`[GRANTPACK] ${sku}: DropSystem ${card.rarity} - ${card.name}`);
            } else {
              // Fallback: РІРёРїР°РґРєРѕРІР° РєР°СЂС‚Р° Р· РѕР±РјРµР¶РµРЅРЅСЏРјРё
              const allowedRarities = ['common', 'uncommon', 'rare', 'epic'];
              const fallback = allCards.filter(c => allowedRarities.includes(c.rarity));
              card = fallback[Math.floor(Math.random() * fallback.length)];
              console.log(`[GRANTPACK] ${sku}: Fallback ${card.rarity} - ${card.name}`);
            }
          }

          const newEntry = { id: card.id, level: 1 };

          // Р”РћР”РђРўР Р’ РљРћР›Р•РљР¦Р†Р®
          profile.collectionCards.push(newEntry);
          userProfile.autoAddToDeck(profile, newEntry);

          // Р”РћР”РђРўР Р’ Р†РќР’Р•РќРўРђР  (РґР»СЏ РїСЂРѕРєР°С‡РєРё)
          profile.inventory[card.id] = (profile.inventory[card.id] ?? 0) + 1;

          // Р—Р‘Р•Р Р•Р“РўР Р”Р›РЇ РџРћРљРђР—РЈ Р’ РњРћР”РђР›Р¦Р†
          rewards.push(card);
        }

        return rewards;
      },

      showPackModal(rewards) {
        const modal = document.getElementById('pack-modal');
        const rewardsContainer = document.getElementById('pack-rewards');
        if (!modal || !rewardsContainer) return;
        rewardsContainer.innerHTML = '';

        // Render rewards: prefer createCardView, then cardRenderer, otherwise fallback HTML
        rewards.forEach(card => {
          const wrapper = document.createElement('div');
          wrapper.className = 'pack-card-wrapper';

          let visualAppended = false;
          if (window.createCardView) {
            try {
              const cardEl = window.createCardView(card);
              if (cardEl) {
                wrapper.appendChild(cardEl);
                visualAppended = true;
              }
            } catch (err) {
              console.warn('createCardView failed in pack modal', err);
            }
          }

          if (!visualAppended && window.CardRendererV2 && typeof window.CardRendererV2.render === 'function') {
            try {
              const html = window.CardRendererV2.render(card, { size: 'normal', showElement: true, showPower: false });
              const frag = document.createElement('div');
              frag.innerHTML = html;
              if (frag.firstElementChild) wrapper.appendChild(frag.firstElementChild);
              visualAppended = true;
            } catch (err) {
              console.warn('CardRendererV2.render failed in pack modal', err);
            }
          }
          if (!visualAppended && window.cardRenderer && typeof window.cardRenderer.render === 'function') {
            try {
              const html = window.cardRenderer.render(card);
              const frag = document.createElement('div');
              frag.innerHTML = html;
              if (frag.firstElementChild) wrapper.appendChild(frag.firstElementChild);
              visualAppended = true;
            } catch (err) {
              console.warn('cardRenderer.render failed in pack modal', err);
            }
          }

          if (!visualAppended) {
            // Minimal fallback visual
            const el = document.createElement('div');
            el.className = 'sp-card pack-fallback-card ' + (card.element || '');
            el.innerHTML = `
              <div class="corner-gear">${card.element || ''}</div>
              <div class="power-plate"><div class="power-value">${card.basePower || card.power || ''}</div></div>
            `;
            wrapper.appendChild(el);
          }

          // Info under card
          const info = document.createElement('div');
          info.className = 'pack-card-info';
          const nameDiv = document.createElement('div');
          nameDiv.className = 'pack-card-name';
          nameDiv.textContent = card.name || '';
          info.appendChild(nameDiv);
          const elDiv = document.createElement('div');
          elDiv.className = 'pack-card-element';
          let elementName = card.element;
          if (window.ELEMENT_INFO && window.ELEMENT_INFO[card.element] && window.ELEMENT_INFO[card.element].name) {
            elementName = window.ELEMENT_INFO[card.element].name;
          }
          elDiv.textContent = elementName || '';
          info.appendChild(elDiv);

          wrapper.appendChild(info);
          rewardsContainer.appendChild(wrapper);
        });
        modal.classList.add('active');
      },

      closePackModal() {
        const modal = document.getElementById('pack-modal');
        if (modal) {
          modal.classList.remove('active');
        }
      },

      // ========== END SHOP SYSTEM ==========

      loadDeckCards() {
        // РћРЅРѕРІРёС‚Рё РґР°РЅС– РєРѕСЂРёСЃС‚СѓРІР°С‡Р° РЅР° С‚РѕРїР±Р°СЂС–
        const profile = userProfile.getProfile();
        if (!profile) {
          console.error('No user profile found');
          return;
        }

        const boltsEl = document.getElementById('deck-bolts');
        const gearsEl = document.getElementById('deck-gears');
        const coresEl = document.getElementById('deck-cores');
        
        if (boltsEl) boltsEl.textContent = this.formatCompact ? this.formatCompact(profile.bolts || 0) : String(profile.bolts || 0);
        if (gearsEl) gearsEl.textContent = this.formatCompact ? this.formatCompact(profile.gears || 0) : String(profile.gears || 0);
        if (coresEl) coresEl.textContent = this.formatCompact ? this.formatCompact(profile.cores || 0) : String(profile.cores || 0);

        // Р†РЅС–С†С–Р°Р»С–Р·СѓРІР°С‚Рё РєР°СЂС‚Рё СЏРєС‰Рѕ С—С… РЅРµРјР°С” (РґР»СЏ СЃС‚Р°СЂРёС… РєРѕСЂРёСЃС‚СѓРІР°С‡С–РІ)
        if (!profile.deckCards || !profile.collectionCards) {
          console.log('Initializing cards for existing user...');
          const selectedCards = getRandomCards(16);
          profile.deckCards = selectedCards.slice(0, 9).map(card => ({
            id: card.id,
            level: 1
          }));
          profile.collectionCards = selectedCards.slice(9, 16).map(card => ({
            id: card.id,
            level: 1
          }));
          userProfile.updateCurrentUser(profile);
        }

        // РњС–РіСЂР°С†С–СЏ СЃС‚Р°СЂРёС… РєРѕСЂРёСЃС‚СѓРІР°С‡С–РІ: РґРѕРґР°С‚Рё progress С– inventory
        if (!profile.progress) {
          console.log('Migrating profile: adding progress...');
          profile.progress = {};
          const allCards = profile.deckCards.concat(profile.collectionCards || []);
          allCards.forEach(dc => {
            const cid = dc && (dc.cardId || dc.id);
            if (cid) {
              profile.progress[cid] = { level: dc.level || 1, xp: 0 };
            }
          });
        }

        if (!profile.inventory) {
          console.log('Migrating profile: adding inventory...');
          profile.inventory = {};
          const allCards = profile.deckCards.concat(profile.collectionCards || []);
          allCards.forEach(dc => {
            const cid = dc && (dc.cardId || dc.id);
            if (cid) {
              profile.inventory[cid] = (profile.inventory[cid] || 0) + 1;
            }
          });
        }

        // Р’РёР±СЂР°С‚Рё РєР°СЂС‚Рё Р· РєРѕР»РѕРґРё (РїС–РґС‚СЂРёРјРєР° СЃС‚Р°СЂРѕРіРѕ С„РѕСЂРјР°С‚Сѓ {id} С– РЅРѕРІРѕРіРѕ {cardId, uid})
        const deckCardIds = (profile.deckCards || [])
          .map(dc => (dc && (dc.cardId || dc.id)) ? (dc.cardId || dc.id) : null)
          .filter(Boolean);

        const deckCards = deckCardIds
          .map(cardId => getCardById(cardId))
          .filter(Boolean);
        
        // РџРµСЂРµРІС–СЂРєР° С‡Рё РєР°СЂС‚Рё Р·РЅР°Р№РґРµРЅС–
        if (deckCards.length === 0) {
          console.error('No cards found! Check if card scripts are loaded.');
          document.getElementById('deckGrid').innerHTML = '<p style="color: red; text-align: center; padding: 20px;">РџРѕРјРёР»РєР° Р·Р°РІР°РЅС‚Р°Р¶РµРЅРЅСЏ РєР°СЂС‚</p>';
          return;
        }
        
        console.log('Loading deck cards:', deckCards.length, 'cards found');
        console.log('First card:', deckCards[0]);
        
        // Р РµРЅРґРµСЂРёРЅРі РєР°СЂС‚ вЂ” СЃС‚РІРѕСЂСЋС”РјРѕ РїР°СЂРё {card, level, originalIndex}, СЃРѕСЂС‚СѓС”РјРѕ Р·Р° Р·СЂРѕСЃС‚Р°РЅРЅСЏРј РїРѕС‚СѓР¶РЅРѕСЃС‚С–
        const deckGrid = document.getElementById('deckGrid');
        if (deckGrid) {
          const deckPairs = deckCards.map((card, index) => {
            const dc = (profile.deckCards && profile.deckCards[index]) ? profile.deckCards[index] : null;
            const lvl = (dc && dc.level) ? dc.level : 1;
            return { card, level: lvl, originalIndex: index };
          });

          // Р¤СѓРЅРєС†С–СЏ РѕС‚СЂРёРјР°РЅРЅСЏ РїРѕС‚СѓР¶РЅРѕСЃС‚С– Р· СѓСЂР°С…СѓРІР°РЅРЅСЏРј СЂС–РІРЅСЏ
          const getCardPower = (c, lvl) => {
            try { return (window.getPower ? window.getPower(c, lvl) : getPower(c, lvl)) || 0; }
            catch (e) { return 0; }
          };

          // Sort descending: strongest first
          deckPairs.sort((a, b) => {
            const pa = getCardPower(a.card, a.level);
            const pb = getCardPower(b.card, b.level);
            if (pa === pb) return (b.card.id || '').localeCompare(a.card.id || '');
            return pb - pa;
          });

          const cardsHTML = deckPairs.map(p => {
            const card = p.card;
            return `<div class="card-wrapper" data-card-id="${card.id}">
              ${window.CardRendererV2 && typeof window.CardRendererV2.render === 'function' ? CardRendererV2.render(card, { size: 'normal', showElement: true, showPower: true }) : ''}
            </div>`;
          }).join('');

          deckGrid.innerHTML = cardsHTML;
          initCardParallax();

          // Р”РµР»РµРіРѕРІР°РЅРёР№ РєР»С–Рє РїРѕ .card-wrapper
          deckGrid.addEventListener('click', (e) => {
            const cardEl = e.target.closest('.card-wrapper');
            if (!cardEl) return;
            const cardId = cardEl.dataset.cardId;
            if (!cardId) return;
            if (typeof this.showCardDetails === 'function') {
              this.showCardDetails(cardId, true);
            } else if (typeof openCardDetails === 'function') {
              openCardDetails(cardId);
            }
          });

          // РћРЅРѕРІРёС‚Рё СЃРёР»Сѓ РєРѕР»РѕРґРё (Р· СѓСЂР°С…СѓРІР°РЅРЅСЏРј СЃРѕСЂС‚СѓРІР°РЅРЅСЏ)
          let totalPower = 0;
          deckPairs.forEach((p) => {
            totalPower += getCardPower(p.card, p.level);
          });
          const powerDisplay = document.getElementById('deck-power-value');
          if (powerDisplay) powerDisplay.textContent = totalPower;

          // РџСЂРёРєСЂС–РїРёС‚Рё РѕР±СЂРѕР±РЅРёРєРё РїРѕРґС–Р№ Р· СѓСЂР°С…СѓРІР°РЅРЅСЏРј РѕСЂРёРіС–РЅР°Р»СЊРЅРёС… С–РЅРґРµРєСЃС–РІ
          const profileForUpgrade = userProfile.getProfile();
          const inventory = this.getInventory(profileForUpgrade);

          const hintEl = document.getElementById('deck-hint');
          if (hintEl) {
            if (this.hasAnyUpgradable(profileForUpgrade.deckCards, inventory)) {
              hintEl.classList.add('hot');
            } else {
              hintEl.classList.remove('hot');
            }
          }

          document.querySelectorAll('#deckGrid .sp-card').forEach((cardEl) => {
            const origAttr = cardEl.getAttribute('data-original-index');
            let originalIndex = origAttr ? parseInt(origAttr, 10) : -1;
            let deckItem = (originalIndex >= 0 && Array.isArray(profileForUpgrade.deckCards)) ? profileForUpgrade.deckCards[originalIndex] : undefined;

            // Fallback: try to resolve deckItem by card-id if originalIndex is invalid
            if (!deckItem) {
              const cardIdAttr = cardEl.getAttribute('data-card-id') || cardEl.getAttribute('data-id');
              if (cardIdAttr && Array.isArray(profileForUpgrade.deckCards)) {
                const foundIndex = profileForUpgrade.deckCards.findIndex(c => c && String(c.id) === String(cardIdAttr));
                if (foundIndex >= 0) {
                  deckItem = profileForUpgrade.deckCards[foundIndex];
                  originalIndex = foundIndex;
                }
              }
            }

            const canUpgrade = deckItem ? this.canUpgradeCard(deckItem, inventory) : false;

            // Р”РµР»РµРіСѓС”РјРѕ РєР»С–Рє РЅР° .sp-card С– .card-frame (РѕР±РёРґРІР°), С‰РѕР± РїСЂР°С†СЋРІР°Р»Рѕ Сѓ РІСЃС–С… СЂРµР¶РёРјР°С…
            const frame = cardEl.querySelector('.card-frame');
            const clickHandler = (e) => {
              e.preventDefault();
              e.stopPropagation();
              const cardId = deckItem ? deckItem.id : cardEl.getAttribute('data-card-id') || cardEl.getAttribute('data-id');
              this.showCardDetails(cardId, true, originalIndex);
            };
            cardEl.style.cursor = 'pointer';
            cardEl.addEventListener('click', clickHandler);
            if (frame) {
              frame.style.cursor = 'pointer';
              frame.addEventListener('click', clickHandler);
            }
          });
        }
        
        // РћРЅРѕРІРёС‚Рё СЃРёР»Сѓ РєРѕР»РѕРґРё (РІРёСЂР°С…РѕРІСѓС”РјРѕ С‚Р°Рє, СЏРє Сѓ РґСѓРµР»С–, С‰РѕР± РІС–РґРѕР±СЂР°Р¶РµРЅРЅСЏ Р·Р±С–РіР°Р»РѕСЃСЏ)
        try {
          let totalPower = 0;
          if (typeof navigation !== 'undefined' && typeof navigation.buildDuelDeckFromProfile === 'function' && typeof navigation.calcDeckPower === 'function') {
            const battleDeck = navigation.buildDuelDeckFromProfile(profile);
            totalPower = navigation.calcDeckPower(battleDeck);
          } else {
            deckCards.forEach((card) => {
              const prog = window.getProgress ? window.getProgress(profile, card.id) : { level: 1, xp: 0 };
              const cardLevel = prog.level;
              totalPower += window.getPower ? window.getPower(card, cardLevel) : getPower(card, cardLevel);
            });
          }
          const powerDisplay = document.getElementById('deck-power-value');
          if (powerDisplay) powerDisplay.textContent = totalPower;
        } catch (e) {
          console.warn('Failed to compute deck power for deck page', e);
        }
        
        // РџСЂРёРєСЂС–РїРёС‚Рё РѕР±СЂРѕР±РЅРёРєРё РїРѕРґС–Р№
        const profileForUpgrade = userProfile.getProfile();
        const inventory = this.getInventory(profileForUpgrade);
        
        // РћРЅРѕРІРёС‚Рё СЃС‚Р°РЅ hint-Сѓ
        const hintEl = document.getElementById('deck-hint');
        if (hintEl) {
          if (this.hasAnyUpgradable(profileForUpgrade.deckCards, inventory)) {
            hintEl.classList.add('hot');
          } else {
            hintEl.classList.remove('hot');
          }
        }
        
        // NOTE: event handlers for deck cards are attached above using sorted `deckPairs`
        // (we avoid attaching duplicate handlers here to prevent index mismatch bugs)
      },

      renderDeckCard(cardData, level = 1, originalIndex = -1) {
        const profile = userProfile.getProfile();
        const inventory = this.getInventory(profile);
        const prog = window.getProgress ? window.getProgress(profile, cardData.id) : { level: level, xp: 0 };
        const displayLevel = prog.level || level;
        const displayPower = window.getPower ? window.getPower(cardData, displayLevel) : getPower(cardData, displayLevel);
        const canUpgrade = this.canUpgradeCard({ id: cardData.id, level: displayLevel }, inventory);
        const canAutoLevel = canUpgrade && this.canGuaranteedLevelByBurning(profile, cardData.id);
        
        // Р’РёРєРѕСЂРёСЃС‚РѕРІСѓС”РјРѕ CardRenderer СЏРєС‰Рѕ РґРѕСЃС‚СѓРїРЅРёР№
        // Prefer CardRendererV2 when available
        if (window.CardRendererV2 && typeof window.CardRendererV2.render === 'function') {
          const boostedCard = { 
            ...cardData, 
            attack: displayPower,
            power: displayPower,
            stats: { ...(cardData.stats || {}), power: displayPower }
          };
          try {
            const html = window.CardRendererV2.render(boostedCard, { size: 'normal', showElement: true, showPower: true });
            return html;
          } catch (err) {
            console.warn('CardRendererV2.render failed for deck card', cardData.id, err);
          }
        }
        if (window.cardRenderer) {
          // РџРµСЂРµРґР°С”РјРѕ Р°С‚Р°РєСѓ СЏРє Р°РєС‚СѓР°Р»СЊРЅСѓ СЃРёР»Сѓ, С‰РѕР± СЂРµРЅРґРµСЂ РїРѕРєР°Р·СѓРІР°РІ РїСЂРѕРєР°С‡РєСѓ
          const boostedCard = { 
            ...cardData, 
            attack: displayPower,
            power: displayPower,
            stats: { ...(cardData.stats || {}), power: displayPower }
          };
          if (window.CardRendererV2 && typeof window.CardRendererV2.render === 'function') {
            try {
              return window.CardRendererV2.render(boostedCard, { size: 'normal', showElement: true, showPower: true });
            } catch (err) {
              console.warn('CardRendererV2.render failed for deck card', cardData.id, err);
            }
          }
          let html = window.cardRenderer.render(boostedCard, { level: displayLevel, power: displayPower, showUpgrade: canAutoLevel, interactive: true });
          return html;
        }

        // Fallback СЂРµРЅРґРµСЂРёРЅРі - РѕРґРЅР°РєРѕРІРёР№ С€Р°Р±Р»РѕРЅ СЏРє CardRenderer
        const {
          id = 'unknown',
          element = 'fire',
          rarity = 'R1',
          basePower = 0,
          attack = displayPower
        } = cardData;

        const rarityNames = {
          'R1': 'Р—Р’РР§РђР™РќРђ',
          'R2': 'РќР•Р—Р’РР§РђР™РќРђ',
          'R3': 'Р Р†Р”РљР†РЎРќРђ',
          'R4': 'Р•РџР†Р§РќРђ',
          'R5': 'Р›Р•Р“Р•РќР”РђР РќРђ',
          'R6': 'РњР†Р¤Р†Р§РќРђ'
        };

        const rarityBadge = rarityNames[rarity] || 'Р—Р’РР§РђР™РќРђ';
        const shownPower = attack || basePower;

        const elementIcons = {
          fire: `<div class="element-emoji fire-emoji">рџ”Ґ</div>`,
          water: `<div class="element-emoji water-emoji">рџ’§</div>`,
          air: `<div class="element-emoji air-emoji">рџ’Ё</div>`,
          earth: `<div class="element-emoji earth-emoji">рџЌѓ</div>`
        };

        const elementIcon = elementIcons[element] || elementIcons.fire;

        return `
          <div class="sp-card ${element} ${rarity} ${canUpgrade ? 'upgradable' : ''}" 
               data-id="${id}"
               data-card-id="${id}"
               data-original-index="${originalIndex}"
               data-element="${element}"
               data-rarity="${rarity}"
               data-power="${shownPower}"
               data-attack="${attack}">
            <!-- Р”Р•РљРћР РђРўРР’РќР† Р›Р†РќР†Р‡ -->
            <div class="decor-line line-top"></div>
            <div class="decor-line line-bottom"></div>
            <!-- Р‘Р•Р™Р”Р– Р Р†Р”РљРћРЎРўР† -->
            <div class="rarity-badge">${rarityBadge}</div>
            <!-- Р’Р•Р›РРљРђ Р”Р•РўРђР›Р¬РќРђ РЁР•РЎРўР•Р РќРЇ -->
            <div class="corner-gear">
              <div class="gear-inner">
                ${elementIcon}
              </div>
            </div>
            <!-- РџР›РђРЁРљРђ РЎРР›Р РІРЅРёР·Сѓ -->
            <div class="power-plate">
              <div class="power-value">${shownPower}</div>
            </div>
            ${canAutoLevel ? '<div class="upgrade-arrow">в–І</div>' : ''}
          </div>
        `;
      },

      // РћРЅРѕРІР»РµРЅРЅСЏ СЃРёР»Рё РєР°СЂС‚Рё РІ DOM РїС–СЃР»СЏ РїСЂРѕРєР°С‡РєРё
      refreshCardPowerInDeck(cardId) {
        const profile = userProfile.getProfile();
        const cardData = window.getCardById(cardId);
        if (!cardData) return;

        const prog = window.getProgress ? window.getProgress(profile, cardId) : { level: 1, xp: 0 };
        const newPower = window.getPower ? window.getPower(cardData, prog.level) : cardData.basePower;

        // РћРЅРѕРІРёС‚Рё СЃРёР»Сѓ РІ DOM
        const powerEl = document.querySelector(
          `.sp-card[data-card-id="${cardId}"] .power-value`
        );
        if (powerEl) {
          powerEl.textContent = String(newPower);
        }

        // РћРЅРѕРІРёС‚Рё Р°С‚СЂРёР±СѓС‚Рё data-power С‚Р° data-attack
        const cardEl = document.querySelector(`.sp-card[data-card-id="${cardId}"]`);
        if (cardEl) {
          cardEl.setAttribute('data-power', newPower);
          cardEl.setAttribute('data-attack', newPower);
        }

        // РћРЅРѕРІРёС‚Рё Р·Р°РіР°Р»СЊРЅСѓ СЃРёР»Сѓ РєРѕР»РѕРґРё
        this.loadDeckCards();
      },

      // РџРµСЂРµРІС–СЂРєР°, С‡Рё РјР°С” РіСЂР°РІРµС†СЊ РєР°СЂС‚Сѓ
      playerHasCard(cardId) {
        const profile = userProfile.getProfile();
        if (!profile) return false;
        const foundIds = new Set([
          ...((profile.collectionCards || []).map(c => c.id)),
          ...((profile.deckCards || []).map(c => c.id))
        ]);
        return foundIds.has(cardId);
      },

      loadCollectionCards() {
        // РЎС‚Р°СЂР° С„СѓРЅРєС†С–СЏ РґР»СЏ РµР»РµРјРµРЅС‚С–РІ - С‚РµРїРµСЂ Р·Р°РјС–РЅСЋС”РјРѕ РЅР° С„СЂР°РєС†С–С—
        this.renderCollections();
      },

      // Р РµРЅРґРµСЂ СЃРїРёСЃРєСѓ РєРѕР»РµРєС†С–Р№
      renderCollections() {
        this.updateCollectionBonuses();
        const grid = document.getElementById('collectionsGrid');
        if (!grid) return;
        const profile = userProfile.getProfile();
        const inventory = profile?.inventory || {};
        grid.innerHTML = COLLECTIONS.map(col => {
          const owned = col.cards.filter(id => inventory[id] > 0).length;
          const total = col.cards.length;
          // Р”РѕРґР°С”РјРѕ С–РєРѕРЅРєСѓ С„СЂР°РєС†С–С— Сѓ РїСЂРµРІКјСЋ (РјРѕР¶РЅР° РїС–РґСЃС‚Р°РІРёС‚Рё С€Р»СЏС… РґРѕ Р·РѕР±СЂР°Р¶РµРЅРЅСЏ, СЏРєС‰Рѕ С”)
          const previewIcon = `<div class="collection-preview collection-preview-${col.id}"></div>`;
          return `
            <div class="collection-card" data-id="${col.id}">
              ${previewIcon}
              <div class="collection-info">
                <div class="collection-title">${col.name}</div>
                <div class="collection-progress">${owned} / ${total}</div>
              </div>
            </div>
          `;
        }).join('');

        // Р”РµР»РµРіРѕРІР°РЅРёР№ РєР»С–Рє РїРѕ .collection-card
        grid.onclick = (e) => {
          const card = e.target.closest('.collection-card');
          if (!card) return;
          const collectionId = card.dataset.id;
          this.openCollection(collectionId);
        };
      },

      // Р’С–РґРєСЂРёС‚С‚СЏ СЃС‚РѕСЂС–РЅРєРё РѕРґРЅС–С”С— РєРѕР»РµРєС†С–С—
      openCollection(id) {
        const col = COLLECTIONS.find(c => c.id === id);
        if (!col) return;

        // РџРѕРєР°Р·Р°С‚Рё РЅРѕРІСѓ СЃС‚РѕСЂС–РЅРєСѓ grid-РєРѕР»РµРєС†С–С—
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById('page-collection-details').classList.remove('hidden');

        // РћРЅРѕРІРёС‚Рё Р·Р°РіРѕР»РѕРІРєРё С‚Р° РїСЂРѕРіСЂРµСЃ
        document.getElementById('collectionTitle').textContent = col.name;
        const profile = userProfile.getProfile();
        const inventory = profile?.inventory || {};
        document.getElementById('collectionProgress').textContent = `${col.cards.filter(id => inventory[id] > 0).length} С–Р· ${col.cards.length}`;

        // Р РµРЅРґРµСЂ grid РєР°СЂС‚
        const grid = document.getElementById('collectionCardsGrid');
        grid.innerHTML = "";
        col.cards.forEach(cardId => {
          const owned = inventory[cardId] > 0;
          // Always try to resolve full card data from DB; fallback to minimal object
          const card = (window.getCardById && window.getCardById(cardId)) || { id: cardId };
          const wrapper = document.createElement("div");
          wrapper.className = "card-wrapper" + (owned ? "" : " locked");
          wrapper.dataset.cardId = cardId;
          wrapper.innerHTML = window.CardRendererV2 && typeof window.CardRendererV2.render === 'function'
            ? CardRendererV2.render(card, { size: 'normal', showElement: true, showPower: true })
            : `<img src="${window.getCardImage(cardId)}" alt="${cardId}">`;
          grid.appendChild(wrapper);
        });

        // Р”РµР»РµРіРѕРІР°РЅРёР№ РєР»С–Рє РїРѕ .card-wrapper вЂ” РґРѕР·РІРѕР»СЏС”РјРѕ РІС–РґРєСЂРёРІР°С‚Рё РґРµС‚Р°Р»С– РЅР°РІС–С‚СЊ РґР»СЏ РЅРµР·РЅР°Р№РґРµРЅРёС…/locked РєР°СЂС‚
        grid.onclick = (e) => {
          const cardEl = e.target.closest('.card-wrapper');
          if (!cardEl) return;
          const cardId = cardEl.dataset.cardId;
          if (!cardId) return;
          if (typeof this.showCardDetails === 'function') {
            this.showCardDetails(cardId, false, -1);
          }
        };
      },

      // Р—Р°РєСЂРёС‚С‚СЏ РєРѕР»РµРєС†С–С—
      closeCollection() {
        document.getElementById("collection-view").classList.add("hidden");
        document.getElementById("factions-grid").style.display = "grid";
      },

      // Р’С–РґРєСЂРёС‚Рё РјР°РіР°Р·РёРЅ (С‚РёРјС‡Р°СЃРѕРІР° С„СѓРЅРєС†С–СЏ)
      openShop() {
        alert('РњР°РіР°Р·РёРЅ С‰Рµ РЅРµ СЂРµР°Р»С–Р·РѕРІР°РЅРёР№');
      },

      // РђРєС‚РёРІСѓРІР°С‚Рё Р±РѕРЅСѓСЃРё РєРѕР»РµРєС†С–Р№
      updateCollectionBonuses() {
        ACTIVE_COLLECTION_BONUSES = [];

        COLLECTIONS.forEach(col => {
          const owned = col.cards.filter(cardId => this.playerHasCard(cardId)).length;
          if (owned === col.cards.length) {
            ACTIVE_COLLECTION_BONUSES.push(col.bonus);
          }
        });
      },

      // Р—Р°СЃС‚РѕСЃСѓРІР°РЅРЅСЏ Р±РѕРЅСѓСЃСѓ РІ Р±РѕСЋ
      applyCollectionBonus(card, basePower) {
        let power = basePower;

        ACTIVE_COLLECTION_BONUSES.forEach(b => {
          if (b.type === "element" && card.element === b.element) {
            power *= (1 + b.value);
          }
        });

        return Math.round(power);
      },

      // Р—Р°СЃС‚РѕСЃСѓРІР°РЅРЅСЏ Р±РѕРЅСѓСЃСѓ РєРѕР»РµРєС†С–С— (СЃС‚Р°СЂР° С„СѓРЅРєС†С–СЏ)
      applyCollectionBonusOld(bonus) {
        // РўСѓС‚ Р»РѕРіС–РєР° Р°РєС‚РёРІР°С†С–С— Р±РѕРЅСѓСЃСѓ
        // РќР°РїСЂРёРєР»Р°Рґ, РґРѕРґР°С‚Рё РґРѕ РїСЂРѕС„С–Р»СЋ Р°РєС‚РёРІРЅС– Р±РѕРЅСѓСЃС‹
        console.log('Applying collection bonus:', bonus);
        // РњРѕР¶РЅР° Р·Р±РµСЂС–РіР°С‚Рё РІ profile.activeBonuses Р°Р±Рѕ РїРѕРґС–Р±РЅРµ
      },

      loadCollectionCardsOld() {
        const profile = userProfile.getProfile();
        if (!profile) {
          console.error('No profile found');
          return;
        }

        // Р—РЅР°Р№РґРµРЅС– РєР°СЂС‚Рё (ID): Р· РєРѕР»РµРєС†С–С— С‚Р° РєРѕР»РѕРґРё
        let foundIds = new Set([
          ...((profile.collectionCards || []).map(c => c.id)),
          ...((profile.deckCards || []).map(c => c.id))
        ]);

        // Р’СЃРµ РєР°СЂС‚С‹ РїРѕ СЌР»РµРјРµРЅС‚Р°Рј
        let allCards = window.ALL_CARDS || [];
        const elements = ['fire', 'water', 'air', 'earth'];
        const elementNames = {
          fire: 'Р’РѕРіРЅСЏРЅР° СЃС‚РёС…С–СЏ',
          water: 'Р’РѕРґСЏРЅР° СЃС‚РёС…С–СЏ',
          air: 'РџРѕРІС–С‚СЂСЏРЅР° СЃС‚РёС…С–СЏ',
          earth: 'Р—РµРјР»СЏРЅР° СЃС‚РёС…С–СЏ'
        };

        elements.forEach(element => {
          const grid = document.getElementById(element + '-collection');
          if (!grid) return;
          const cards = allCards.filter(card => card.element === element);
          let foundCount = 0;
          grid.innerHTML = cards.map(card => {
            const found = foundIds.has(card.id);
            if (found) foundCount++;
            const src = window.getCardImage(card);
            return `
              <div class="collection-card-item${found ? ' found' : ' not-found'}">
                <img class="collection-card-img" src="${src}" alt="${card.name}" />
                <span class="collection-card-name">${card.name}</span>
                <span class="collection-card-status">${found ? 'Р—РЅР°Р№РґРµРЅРѕ' : 'РќРµ Р·РЅР°Р№РґРµРЅРѕ'}</span>
              </div>
            `;
          }).join('');
          // РћР±РЅРѕРІРёС‚СЊ РїСЂРѕРіСЂРµСЃСЃ
          const progress = document.getElementById(element + '-progress');
          if (progress) progress.textContent = `${foundCount}/${cards.length} РєР°СЂС‚`;
        });
      },

      // ========== CARD DETAILS PAGE ==========

      showCardDetails(cardId, fromDeck = false, deckIndex = -1) {
        const profile = userProfile.getProfile();
        const cardData = getCardById(cardId);

        if (!cardData) {
          console.error('Card not found:', cardId);
          return;
        }

        // Р’РёР·РЅР°С‡РёС‚Рё СЂС–РІРµРЅСЊ Р·Р° РїСЂРѕРіСЂРµСЃРѕРј (РїСЂРѕРєР°С‡РєР°)
        const prog = window.getProgress ? window.getProgress(profile, cardId) : { level: 1, xp: 0 };
        const cardLevel = prog.level;
        const actualPower = window.getPower ? window.getPower(cardData, cardLevel) : Math.round(cardData.basePower * Math.pow(cardData.upgradeMult, cardLevel - 1));

        // Р РµРЅРґРµСЂРёС‚Рё РѕСЃРЅРѕРІРЅСѓ С–РЅС„РѕСЂРјР°С†С–СЋ РїСЂРѕ РєР°СЂС‚Сѓ
        this.renderCardDetails(cardData, cardLevel, actualPower, deckIndex);

        // Р—РЅР°Р№РґРµРЅС– РєР°СЂС‚Рё (ID): Р· РєРѕР»РµРєС†С–С— С‚Р° РєРѕР»РѕРґРё
        const foundIds = new Set([
          ...((profile.collectionCards || []).map(c => c.id)),
          ...((profile.deckCards || []).map(c => c.id))
        ]);
        // Р—РЅР°Р№С‚Рё РІСЃС– РєР°СЂС‚Рё С†С–С”С— СЃС‚РёС…С–С— (Р· Р±Р°Р·Рё РґР°РЅРёС…)
        const allCards = window.ALL_CARDS || window.CARDS_COMMON || [];
        const sameElementCards = allCards.filter(c => c.element === cardData.element);
        // Р’РёР·РЅР°С‡РёС‚Рё СЃРёР»Сѓ С†С–Р»СЊРѕРІРѕС— РєР°СЂС‚Рё С‡РµСЂРµР· getPower (Р· СѓСЂР°С…СѓРІР°РЅРЅСЏРј СЂС–РІРЅСЏ РїСЂРѕРіСЂРµСЃСѓ)
        const targetPower = window.getPower ? (window.getPower(cardData, cardLevel)) : (cardData.basePower || cardData.power || 0);
        const deckIds = new Set((profile.deckCards || []).map(c => c.id));
        // Р’СЃС– СЃР»Р°Р±С€С– РєР°СЂС‚Рё С†С–С”С— СЃС‚РёС…С–С—, СЏРєС– Р·РЅР°Р№РґРµРЅС– Сѓ РїСЂРѕС„С–Р»С–, Р°Р»Рµ РќР• РІ РєРѕР»РѕРґС–
        const weakerCards = sameElementCards.filter(c => {
          if (!c || !c.id) return false;
          if (!foundIds.has(c.id)) return false;
          if (deckIds.has(c.id)) return false;
          // РІС‹С‡РёСЃР»РёРј СЃРёР»Сѓ РєР°РЅРґРёРґР°С‚Р° (РёСЃРїРѕР»СЊР·СѓРµРј getPower РµСЃР»Рё РµСЃС‚СЊ Рё СѓС‡РёС‚С‹РІР°РµРј РµРіРѕ РїСЂРѕРіСЂРµСЃСЃ)
          const candProg = window.getProgress ? window.getProgress(profile, c.id) : { level: 1, xp: 0 };
          const candPower = window.getPower ? window.getPower(c, candProg.level) : (c.basePower || c.power || 0);
          return candPower < targetPower && c.id !== cardId;
        });

        // РџРѕРєР°Р·/СЃРєСЂС‹С‚РёРµ Р·Р°РіРѕР»РѕРІРєР° Рё СЃРїРёСЃРєР° СЃР»Р°Р±С€РёС… РєР°СЂС‚
        const weakerHeader = document.getElementById('weaker-cards-header');
        const weakerList = document.getElementById('weaker-cards-list');
        if (weakerCards.length > 0) {
          if (weakerHeader) weakerHeader.style.display = '';
          if (weakerList) weakerList.style.display = '';
          this.renderWeakerCards(weakerCards, cardId, profile);
        } else {
          if (weakerHeader) weakerHeader.style.display = 'none';
          if (weakerList) {
            weakerList.style.display = 'none';
            weakerList.innerHTML = '';
          }
        }

        // === РџР РћРЎРўРђ Р’Р†Р—РЈРђР›Р†Р—РђР¦Р†РЇ РџР РћРљРђР§РљР ===
        // РџРѕРєР°Р¶РµРјРѕ РїСЂРѕСЃС‚РёР№ XP-Р±Р°СЂ Р°Р±Рѕ РІРёРєР»РёС‡РµРјРѕ РІРЅРµС€РЅСЋСЋ РѕС‚СЂРёСЃРѕРІРєСѓ, СЏРєС‰Рѕ РґРѕСЃС‚СѓРїРЅР°
        const cardMain = document.getElementById('card-main-info');
        const xpBar = cardMain ? cardMain.querySelector('.xp-bar') : null;
        if (window.renderUpgradeBar) {
          window.renderUpgradeBar(profile, cardId);
        } else if (xpBar) {
          const need = this.xpNeededForLevel(prog.level || 1) || 100;
          xpBar.style.width = `${Math.min(100, Math.round(((prog.xp || 0) / need) * 100))}%`;
        }
        // РћР±РЅРѕРІРёС‚Рё РєРЅРѕРїРєСѓ "РќР°Р·Р°Рґ"
        const backBtn = document.getElementById('card-details-back');
        if (backBtn) {
          backBtn.onclick = (e) => {
            e.preventDefault();
            if (fromDeck) {
              this.showPage('deck');
            } else {
              this.showPage('collections');
            }
          };
        }

        // РџРѕРєР°Р·Р°С‚Рё СЃС‚РѕСЂС–РЅРєСѓ
        this.showPage('card-details');
      },
      renderCardDetails(cardData, level, power, deckIndex) {
        const mainDisplay = document.getElementById('card-main-info');
        if (!mainDisplay) return;

        // Р’РёР·СѓР°Р»СЊРЅС‹Р№ Р±Р»РѕРє РєР°СЂС‚РѕС‡РєРё вЂ” РёСЃРїРѕР»СЊР·СѓРµРј С‚РѕР»СЊРєРѕ CardRendererV2 (РЅРѕРІС‹Р№ СЃС‚Р°РЅРґР°СЂС‚)
        let visualHtml = '';
        if (window.CardRendererV2 && typeof window.CardRendererV2.render === 'function') {
          try {
            visualHtml = window.CardRendererV2.render(cardData, { size: 'details', showElement: true, showPower: true });
          } catch (err) {
            console.warn('CardRendererV2.render failed', err);
            visualHtml = '';
          }
        } else {
          console.warn('CardRendererV2 is not available; card details visual will be empty');
          visualHtml = '';
        }

        if (!visualHtml) {
          // РџСЂРѕСЃС‚РѕР№ fallback РІРёР·СѓР°Р» вЂ” РЅРѕРІР°СЏ recommended СЃС‚СЂСѓРєС‚СѓСЂР° card-frame
          const elem = (cardData.element || '').toString().toLowerCase();
          const shownPower = power || cardData.basePower || 0;
          const imgSrc = window.getCardImage ? window.getCardImage(cardData) : (cardData.image || cardData.imageUrl || '');
          const rarityClass = (cardData.rarity || 'common').toString().toLowerCase();

          visualHtml = `
            <div class="card-frame ${rarityClass} ${elem}">
              <div class="card-art">
                ${imgSrc ? `<img src="${imgSrc}" alt="${cardData.name || ''}">` : ''}
              </div>
              <div class="card-ui">
                <div class="card-element">${getElementGlyph(elem)}</div>
                <div class="card-power">${shownPower}</div>
              </div>
            </div>`;
        }

        // РРЅС„Рѕ СЃРїСЂР°РІР°: РёРјСЏ, СЃС‚РёС…РёСЏ, СЂРµРґРєРѕСЃС‚СЊ, СѓСЂРѕРІРµРЅСЊ
        const prog = (userProfile.getProfile && window.getProgress) ? window.getProgress(userProfile.getProfile(), cardData.id) : { level: level || 1, xp: 0 };
        const levelText = `LV ${prog.level || level || 1}`;
        const need = this.xpNeededForLevel(prog.level || 1) || 100;
        const xpText = `${prog.xp || 0} / ${need} XP`;

        mainDisplay.innerHTML = `
          <div class="card-details-layout">
            <div class="card-details-card card-visual-area">${visualHtml}</div>
            <div class="card-details-text">
              <h3>${cardData.name || ''}</h3>
              <p>РЎС‚РёС…С–СЏ: <strong>${(cardData.element || '').toUpperCase()}</strong></p>
              <p>Р С–РґРєС–СЃС‚СЊ: <strong>${cardData.rarity || ''}</strong></p>
              <p>Р С–РІРµРЅСЊ: <span id="cu-level-inner">${levelText}</span></p>
              <p>XP: <span id="cu-xp-text-inner">${xpText}</span></p>
            </div>
          </div>`;

        // РћР±РЅРѕРІР»СЏРµРј РіР»РѕР±Р°Р»СЊРЅСѓСЋ РїР°РЅРµР»СЊ РїСЂРѕРєР°С‡РєРё РІ СЃРµРєС†РёРё РґРµС‚Р°Р»РµР№
        const cuLevel = document.getElementById('cu-level');
        const cuXpText = document.getElementById('cu-xp-text');
        const cuXpFill = document.getElementById('cu-xp-fill');
        if (cuLevel) cuLevel.textContent = levelText;
        if (cuXpText) cuXpText.textContent = xpText;
        if (cuXpFill) cuXpFill.style.width = `${Math.min(100, Math.round(((prog.xp || 0) / need) * 100))}%`;

        // РќР°СЃС‚СЂРѕР№РєР° РєРЅРѕРїРѕРє РґРµР№СЃС‚РІРёР№
        const addBtn = document.getElementById('card-add-to-deck-btn');
        const removeBtn = document.getElementById('card-remove-btn');
        const upgradeBtn = document.getElementById('card-upgrade-btn');

        if (addBtn) {
          addBtn.onclick = (e) => {
            e.preventDefault();
            const profile = userProfile.getProfile();
            const res = userProfile.autoAddToDeck(profile, { id: cardData.id, level: prog.level || 1 });
            if (res.added || res.replaced) {
              userProfile.updateCurrentUser(profile);
              this.loadDeckCards();
              this.loadCollectionCards();
              alert('РљР°СЂС‚Р° РґРѕРґР°РЅР° РІ РєРѕР»РѕРґСѓ');
            } else {
              alert('РќРµ РІРґР°Р»РѕСЃСЏ РґРѕРґР°С‚Рё РєР°СЂС‚Сѓ РІ РєРѕР»РѕРґСѓ');
            }
          };
        }

        if (removeBtn) {
          removeBtn.onclick = (e) => {
            e.preventDefault();
            const profile = userProfile.getProfile();
            // РЈРґР°Р»СЏРµРј РєР°СЂС‚Сѓ РёР· РєРѕР»Р»РµРєС†РёРё Рё/РёР»Рё РёР· РєРѕР»РѕРґС‹
            if (profile.collectionCards) {
              for (let i = profile.collectionCards.length - 1; i >= 0; i--) {
                if (profile.collectionCards[i].id === cardData.id) {
                  profile.collectionCards.splice(i, 1);
                  break;
                }
              }
            }
            if (profile.deckCards) {
              for (let i = profile.deckCards.length - 1; i >= 0; i--) {
                if (profile.deckCards[i].id === cardData.id) {
                  profile.deckCards.splice(i, 1);
                  break;
                }
              }
            }
            userProfile.updateCurrentUser(profile);
            this.loadDeckCards();
            this.loadCollectionCards();
            this.showPage('collections');
          };
        }

        // РљРЅРѕРїРєР° РїСЂРѕРєР°С‡РєРё СѓРґР°Р»РµРЅР° вЂ” РЅРёС‡РµРіРѕ РЅРµ РґРµР»Р°РµРј
        try {
          const upgradeBtnEl = document.getElementById('card-upgrade-btn');
          if (upgradeBtnEl) {
            upgradeBtnEl.style.display = 'none';
            upgradeBtnEl.onclick = null;
          }
          const cuBtn = document.getElementById('cu-upgrade-btn');
          if (cuBtn) cuBtn.remove();
        } catch (err) {
          console.warn('upgrade button cleanup failed', err);
        }
      },

        // Р РµРЅРґРµСЂ СЃРїРёСЃРєР° СЃР»Р°Р±С€РёС… РєР°СЂС‚: РїР»РёС‚РєРё СЃ РІРёР·СѓР°Р»РѕРј (РёСЃРїРѕР»СЊР·СѓРµС‚ cardRenderer, РµСЃР»Рё РґРѕСЃС‚СѓРїРµРЅ)
        renderWeakerCards(weakerCards, targetCardId, profile) {
          const list = document.getElementById('weaker-cards-list');
          if (!list) return;
          const targetCard = window.getCardById ? window.getCardById(targetCardId) : null;

          // РЎРѕР·РґР°С‘Рј СЃРµС‚РєСѓ
          const tiles = weakerCards.map(c => {
            const card = (c && c.id && window.getCardById) ? window.getCardById(c.id) : c;
            if (!card) return '';

            // РџСЂРѕС†РµРЅС‚РЅС‹Р№ РїРѕРєР°Р·Р°С‚РµР»СЊ: СЃРєРѕР»СЊРєРѕ XP РґР°СЃС‚ СЃРїР°Р»РµРЅРЅСЏ СЌС‚РѕР№ РєР°СЂС‚С‹ РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ РЅСѓР¶РЅРѕРіРѕ XP РґР»СЏ СЃР»РµРґСѓСЋС‰РµРіРѕ СѓСЂРѕРІРЅСЏ
            const progTarget = (profile && profile.progress && profile.progress[targetCardId]) ? profile.progress[targetCardId] : { level: 1, xp: 0 };
            const need = this.xpNeededForLevel(progTarget.level) || 100;
            const cardPower = card.basePower || card.power || 0;
            const xpGain = cardPower || 10;
            const pct = Math.max(0, Math.min(100, Math.round((xpGain / need) * 100)));

            // Render via CardRendererV2 if available, else createCardView, else minimal fallback
            let cardHtml = '';
            if (window.CardRendererV2 && typeof window.CardRendererV2.render === 'function') {
              try {
                cardHtml = window.CardRendererV2.render({ ...card, power: cardPower }, { size: 'normal', showElement: true, showPower: true });
              } catch (err) {
                console.warn('CardRendererV2.render failed for weaker card', card.id, err);
                cardHtml = '';
              }
            }
            if (!cardHtml && window.createCardView) {
              const el = window.createCardView(card);
              cardHtml = el ? el.outerHTML : '';
            }
            if (!cardHtml) {
              // fallback РјРёРЅРёРјР°Р»СЊРЅС‹Р№ РІРёР·СѓР°Р»
              cardHtml = `
                <div class="sp-card ${card.element || ''}">
                  <div class="corner-gear">${card.element || ''}</div>
                  <div class="power-plate"><div class="power-value">${cardPower}</div></div>
                  <div class="card-name">${card.name}</div>
                </div>`;
            }

            return `
              <div class="weaker-card-tile" data-card-id="${card.id}">
                <div class="weaker-card-visual">${cardHtml}</div>
                <div class="weaker-card-footer">
                  <div class="weaker-card-power">${cardPower}</div>
                  <div class="weaker-card-pct">+${pct}%</div>
                </div>
              </div>`;
          }).join('');

          list.innerHTML = `<div class="weaker-grid">${tiles}</div>`;

          // Р”РѕР±Р°РІР»СЏРµРј РѕР±СЂР°Р±РѕС‚С‡РёРє РєР»РёРєР° РЅР° РїР»РёС‚РєСѓ: РїСЂРѕСЃС‚Рѕ РЅР°Р¶РёРјР°РµС€СЊ РЅР° РєР°СЂС‚Сѓ вЂ” РѕРЅР° СЃРіРѕСЂР°РµС‚
          list.querySelectorAll('.weaker-card-tile').forEach(tile => {
            tile.addEventListener('click', (e) => {
              const srcId = tile.dataset.cardId;
              if (!srcId) return;
              const result = this.burnCardForXP(profile, srcId, targetCardId);
              if (result && result.success) {
                // РЈРґР°Р»СЏРµРј РїР»РёС‚РєСѓ РёР· DOM
                tile.remove();
                userProfile.updateCurrentUser(profile);
                // РћР±РЅРѕРІР»СЏРµРј СЃРїРёСЃРєРё
                this.loadCollectionCards();
                this.loadDeckCards();
                // РћР±РЅРѕРІРёРј РґРµС‚Р°Р»Рё РµСЃР»Рё РјС‹ РЅР° СЃС‚СЂР°РЅРёС†Рµ РєР°СЂС‚РєРё
                if (this.currentPage === 'card-details') {
                  this.renderCardDetails(window.getCardById(targetCardId), result.newLevel, result.newPower || 0, -1);
                  if (window.renderUpgradeBar) window.renderUpgradeBar(profile, targetCardId);
                }
                // Р‘РµР· alert'Р° вЂ” РєР°СЂС‚РѕС‡РєР° РёСЃС‡РµР·Р»Р° Рё РїСЂРѕРіСЂРµСЃСЃ РѕР±РЅРѕРІР»С‘РЅ
              } else {
                console.warn(result && result.error ? result.error : 'РќРµ РІРґР°Р»РѕСЃСЏ СЃРїР°Р»РёС‚Рё РєР°СЂС‚Сѓ');
              }
            });
          });
        },

        // РЎР¶РµС‡СЊ РєР°СЂС‚Сѓ РёР· РєРѕР»Р»РµРєС†РёРё/С–РЅРІРµРЅС‚Р°СЂСЏ СЂР°РґРё XP С†РµР»РµРІРѕР№ РєР°СЂС‚С‹ (Р±РµР· РїРѕРґС‚РІРµСЂР¶РґРµРЅРёР№)
        burnCardForXP(profile, sourceCardId, targetCardId) {
          if (!profile || !sourceCardId || !targetCardId) return { success: false, error: 'РќРµРІС–СЂРЅС– РїР°СЂР°РјРµС‚СЂРё' };

          // РќР°Р№С‚Рё Рё СѓРґР°Р»РёС‚СЊ РѕРґРЅСѓ РєРѕРїРёСЋ РёР· collectionCards (РїСЂРµРґРїРѕС‡С‚РёС‚РµР»СЊРЅРѕ РёР· РєРѕР»Р»РµРєС†РёРё, Р° РЅРµ РёР· РєРѕР»РѕРґС‹)
          let removed = false;
          let removedFromInventory = false;
          if (Array.isArray(profile.collectionCards)) {
            for (let i = profile.collectionCards.length - 1; i >= 0; i--) {
              if (profile.collectionCards[i].id === sourceCardId) {
                profile.collectionCards.splice(i, 1);
                removed = true;
                break;
              }
            }
          }

          // Р•СЃР»Рё РЅРµ РЅР°Р№РґРµРЅРѕ РІ РєРѕР»Р»РµРєС†РёРё, РїРѕРїСЂРѕР±СѓРµРј СѓРґР°Р»РёС‚СЊ РёР· РёРЅРІРµРЅС‚Р°СЂСЏ РЅР°РїСЂСЏРјСѓСЋ (inventory СЃС‡РµС‚С‡РёРє)
          if (!removed && profile.inventory && profile.inventory[sourceCardId] > 0) {
            profile.inventory[sourceCardId] = Math.max(0, profile.inventory[sourceCardId] - 1);
            removed = true;
            removedFromInventory = true;
          }

          if (!removed) return { success: false, error: 'РљРѕРїС–СЏ РєР°СЂС‚Рё РЅРµ Р·РЅР°Р№РґРµРЅР° РґР»СЏ СЃРїР°Р»РµРЅРЅСЏ' };

          // РћРїСЂРµРґРµР»СЏРµРј XP-РіРёРІ (РёСЃРїРѕР»СЊР·СѓРµРј СЃРёР»Сѓ РєР°СЂС‚С‹ РєР°Рє Р±Р°Р·РѕРІС‹Р№ XP)
          const srcCard = window.getCardById ? window.getCardById(sourceCardId) : null;
          const tgtCard = window.getCardById ? window.getCardById(targetCardId) : null;
          const xpGain = srcCard ? (srcCard.basePower || srcCard.power || 10) : 10;

          // РЈР±РµРґРёРјСЃСЏ, С‡С‚Рѕ СЃС‚СЂСѓРєС‚СѓСЂР° progress РµСЃС‚СЊ
          if (!profile.progress) profile.progress = {};
          if (!profile.progress[targetCardId]) profile.progress[targetCardId] = { level: 1, xp: 0 };

          // Р”РѕР±Р°РІР»СЏРµРј XP РёСЃРїРѕР»СЊР·СѓСЏ РіР»РѕР±Р°Р»СЊРЅСѓСЋ СЃРёСЃС‚РµРјСѓ (РµСЃР»Рё РґРѕСЃС‚СѓРїРЅР°), С‡С‚РѕР±С‹ РёР·Р±РµР¶Р°С‚СЊ СЂР°СЃСЃРёРЅС…СЂРѕРЅР°
          if (window.addXp && window.getProgress) {
            window.addXp(profile, targetCardId, xpGain);
            const prog = window.getProgress(profile, targetCardId);
            var newLevel = prog.level || 1;
            var leveled = true; // РЅРµРІР°Р¶РЅРѕ С‚РѕС‡РЅРѕ С‡РёСЃР»Рѕ вЂ” РјС‹ РІРµСЂРЅС‘Рј С„Р°РєС‚ СѓСЃРїРµС…Р°
          } else {
            // fallback: Р»РѕРєР°Р»СЊРЅР°СЏ РѕР±СЂР°Р±РѕС‚РєР° (СѓСЃС‚Р°СЂРµРІС€Р°СЏ Р»РѕРіРёРєР°)
            profile.progress[targetCardId].xp = (profile.progress[targetCardId].xp || 0) + xpGain;
            let leveledLocal = false;
            let newLevelLocal = profile.progress[targetCardId].level || 1;
            while (profile.progress[targetCardId].xp >= this.xpNeededForLevel(newLevelLocal)) {
              profile.progress[targetCardId].xp -= this.xpNeededForLevel(newLevelLocal);
              newLevelLocal += 1;
              leveledLocal = true;
            }
            profile.progress[targetCardId].level = newLevelLocal;
            var newLevel = newLevelLocal;
            var leveled = leveledLocal;
          }

          // Р•СЃР»Рё РєР°СЂС‚Р° Р±С‹Р»Р° СѓРґР°Р»РµРЅР° РёР· РєРѕР»Р»РµРєС†РёРё, РЅРµ С‚СЂРѕРіР°РµРј inventory; РµСЃР»Рё СѓРґР°Р»РµРЅР° РёР· inventory, СѓР¶Рµ СѓРјРµРЅСЊС€РёР»Рё РІС‹С€Рµ

          // РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ СѓСЂРѕРІРµРЅСЊ РІ Р·Р°РїРёСЃРё РєРѕР»РѕРґС‹, РµСЃР»Рё РєР°СЂС‚Р° С‚Р°Рј РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚
          if (Array.isArray(profile.deckCards)) {
            for (let i = 0; i < profile.deckCards.length; i++) {
              if (profile.deckCards[i] && profile.deckCards[i].id === targetCardId) {
                profile.deckCards[i].level = newLevel;
                break;
              }
            }
          }

          // РЎРѕС…СЂР°РЅРµРЅРёРµ РІС‹РїРѕР»РЅСЏРµС‚СЃСЏ РІС‹Р·С‹РІР°СЋС‰РµР№ СЃС‚РѕСЂРѕРЅРѕР№
          const newPower = tgtCard ? (window.getPower ? window.getPower(tgtCard, newLevel) : (tgtCard.basePower || 0)) : null;

          return { success: true, leveled, newLevel, newPower };
        },

      // ========== DUELS (MVP) ==========
      
      // ========== DUELS (MVP) ========== 
      updatePlayerMultiplierPreview() {
        if (!window.CURRENT_DUEL) return;
        const duel = window.CURRENT_DUEL;
        const container = document.getElementById('duelMultipliers');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Create 3 multiplier badges for 3 slots
        for (let i = 0; i < 3; i++) {
          const pCard = duel.player.hand[i];
          const eCard = duel.enemy.hand[i];
          
          if (!pCard || !eCard) {
            container.innerHTML += '<div class="mult-badge" style="opacity:0.3"><span class="mult-text">вЂ”</span></div>';
            continue;
          }
          
          const mult = (window.MULT[pCard.element]?.[eCard.element]) ?? 1;
          const multClass = mult > 1 ? 'mult-good' : mult < 1 ? 'mult-bad' : 'mult-neutral';
          const multText = mult === 1 ? 'Г— 1' : `Г— ${mult.toFixed(1)}`;
          
          container.innerHTML += `
            <div class="mult-badge ${multClass}">
              <span class="swords"></span>
              <span class="mult-text">${multText}</span>
            </div>
          `;
        }
      },
      
      initDuelsPage() {
        const btn = document.getElementById('duel-start-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            startDuelSearchAnimation(() => {
              navigation.startRandomDuel();
            });
          });
        }
        // Clear UI and show searching state
        const enemyHpEl = document.getElementById('enemyHp');
        const playerHpEl = document.getElementById('playerHp');
        const enemyHandEl = document.getElementById('enemyHand');
        const playerHandEl = document.getElementById('playerHand');
        const duelLogEl = document.getElementById('duelLog');
        // update both legacy text nodes and new HUD elements
        if (enemyHpEl) enemyHpEl.textContent = '0/0';
        if (playerHpEl) playerHpEl.textContent = '0/0';
        const enemyHpText = document.getElementById('enemyHpText');
        const playerHpText = document.getElementById('playerHpText');
        const enemyHpBar = document.getElementById('enemyHpBar');
        const playerHpBar = document.getElementById('playerHpBar');
        if (enemyHpText) enemyHpText.textContent = '0/0';
        if (playerHpText) playerHpText.textContent = '0/0';
        if (enemyHpBar) enemyHpBar.style.width = '0%';
        if (playerHpBar) playerHpBar.style.width = '0%';
        if (enemyHandEl) enemyHandEl.innerHTML = '';
        if (playerHandEl) playerHandEl.innerHTML = '';
        if (duelLogEl) duelLogEl.innerHTML = 'РџРѕС€СѓРє РІРѕСЂРѕРіР°...';

        // РђРІС‚РѕРјР°С‚РёС‡РЅРѕ РїРѕС‡РёРЅР°С”РјРѕ РїРѕС€СѓРє/Р·Р°РїСѓСЃРє РґСѓРµР»С–
        setTimeout(() => {
          startDuelSearchAnimation(() => {
            navigation.startRandomDuel();
          });
        }, 250);
      },

      buildDuelDeckFromProfile(profile) {
        // Р’РёРєРѕСЂРёСЃС‚РѕРІСѓС”РјРѕ level Р· progress РґР»СЏ СЂРѕР·СЂР°С…СѓРЅРєСѓ СЃРёР»Рё РІ РґСѓРµР»С–
        return profile.deckCards.map(dc => {
          const base = getCardById(dc.cardId || dc.id);
          if (!base) {
            // Fallback РґР»СЏ РЅРµРІС–РґРѕРјРёС… РєР°СЂС‚
            return {
              id: dc.cardId || dc.id || 'unknown',
              element: 'fire',
              rarity: 'common',
              basePower: 10,
              upgradeMult: 1.12,
              name: 'Unknown Card',
              level: dc.level || 1,
              power: 10,
              attack: 10,
              image: `./assets/cards/${String(dc.cardId || dc.id || 'unknown')}.png`
            };
          }

          const prog = window.getProgress ? window.getProgress(profile, dc.cardId || dc.id) : { level: 1, xp: 0 };
          const level = prog.level;
          const power = window.getPower ? window.getPower(base, level) : Math.round(base.basePower * Math.pow(base.upgradeMult, level - 1));
          return {
            ...base,
            level,
            power,
            attack: power,
            image: base.image || window.getCardImage?.(base)
          };
        });
      },

      calcDeckPower(deck) {
        return deck.reduce((s, c) => s + (c.power || 0), 0);
      },

      // Р“РµРЅРµСЂР°С†РёСЏ Р°РґР°РїС‚РёРІРЅРѕР№ РєРѕР»РѕРґС‹ РїСЂРѕС‚РёРІРЅРёРєР°: HP РІСЂР°РіР° в‰€ HP РёРіСЂРѕРєР° В±20
      generateAdaptiveEnemyDeck(playerDeck9, playerHP) {
        const calcPower = (card, level = 1) => {
          if (window.getPower) return window.getPower(card, level);
          return card.attack || card.basePower || 0;
        };

        // Р¦РµР»РµРІРѕРµ Р·РЅР°С‡РµРЅРёРµ вЂ” HP РёРіСЂРѕРєР° В±20
        const offset = Math.floor(Math.random() * 41) - 20; // -20..+20
        const targetTotal = Math.max(0, playerHP + offset);
        console.log('generateAdaptiveEnemyDeck: playerHP=', playerHP, 'offset=', offset, 'targetTotal=', targetTotal);

        // pool: РµСЃР»Рё РјР°Р»Рѕ РєР°СЂС‚ - РёСЃРїРѕР»СЊР·СѓРµРј ALL_CARDS
        const allCards = window.ALL_CARDS || window.CARDS_COMMON || [];
        let pool = allCards.slice().filter(c => !(String(c.id).startsWith('S')));
        if (pool.length < 9) pool = allCards.slice();

        const cardPower = c => calcPower(c, 1) || 0;

        // Ensure pool items have numeric `power` field (buildEnemyCardPool expects that)
        // Рё РјРёРЅРёРјСѓРј СЃРёР»С‹ РєР°СЂС‚С‹ 12
        const poolWithPower = pool.map(c => Object.assign({}, c, { power: Math.max(12, cardPower(c)) }));

        // Use buildEnemyCardPool to select cards close to targetTotal
        const { cards: selected, totalPower: baseTotal } = buildEnemyCardPool(targetTotal, poolWithPower, 9);

        // Fill if not enough
        if (selected.length < 9) {
          // If pool selection returned too few, fill with lowest-power cards from poolWithPower
          const extras = poolWithPower.filter(c => !selected.includes(c)).slice(0, 9 - selected.length);
          selected.push(...extras.map(e => ({ id: e.id, element: e.element, rarity: e.rarity, power: Math.max(12, e.power) })));
        }

        // Level-up selected cards to approach targetTotal
        const enriched = selected.map(c => ({ src: c, level: 1, power: Math.max(12, (c && typeof c.power === 'number') ? c.power : cardPower(c)) }));
        let selectedSum = enriched.reduce((s, e) => s + e.power, 0);
        let attempts = 0;
        const maxAttempts = 500;
        while (selectedSum < targetTotal && attempts < maxAttempts) {
          let bestIdx = -1;
          let bestGain = 0;
          for (let i = 0; i < enriched.length; i++) {
            const e = enriched[i];
            const nextLevel = Math.min((e.level || 1) + 1, 20);
            const nextPower = calcPower(e.src, nextLevel) || e.power;
            const gain = nextPower - e.power;
            if (gain > bestGain) { bestGain = gain; bestIdx = i; }
          }
          if (bestIdx === -1 || bestGain <= 0) break;
          enriched[bestIdx].level = Math.min((enriched[bestIdx].level || 1) + 1, 20);
          enriched[bestIdx].power = calcPower(enriched[bestIdx].src, enriched[bestIdx].level) || enriched[bestIdx].power;
          selectedSum = enriched.reduce((s, e) => s + e.power, 0);
          attempts++;
        }

        // Ensure total power does not exceed playerHP + 20
        let totalPower = enriched.reduce((s, e) => s + e.power, 0);
        if (totalPower > playerHP + 20) {
          // Sort by power descending and reduce levels
          enriched.sort((a, b) => b.power - a.power);
          for (let i = 0; i < enriched.length && totalPower > playerHP + 20; i++) {
            const e = enriched[i];
            const minPower = calcPower(e.src, 1);
            if (e.power > minPower) {
              e.level = Math.max(1, e.level - 1);
              e.power = calcPower(e.src, e.level);
              totalPower = enriched.reduce((s, e) => s + e.power, 0);
            }
          }
        }

        // Map to lightweight enemy objects compatible with legacy duel
        const enemyDeck9 = enriched.map(e => ({
          id: e.src.id,
          element: e.src.element,
          rarity: e.src.rarity,
          level: e.level || 1,
          power: Math.max(12, Math.round(e.power || 12))
        }));
        console.log('enemyDeck9 length=', enemyDeck9.length, 'totalPower=', enriched.reduce((s, e) => s + e.power, 0));
        return enemyDeck9;
      },

      getXpForLevel(level) {
        return Math.floor(100 * Math.pow(level, 1.35));
      },

      xpNeededForLevel(level) {
        return this.getXpForLevel(level);
      },

      pendingDuel: null,

      createCardNode(card, isPlayer, slotIdx) {
        const elementIcons = {
          fire: '<div class="element-emoji fire-emoji">рџ”Ґ</div>',
          water: '<div class="element-emoji water-emoji">рџ’§</div>',
          air: '<div class="element-emoji air-emoji">рџ’Ё</div>',
          earth: '<div class="element-emoji earth-emoji">рџЌѓ</div>'
        };
        // Defensive: if card is missing, create a placeholder to avoid runtime errors
        if (!card) card = { id: 'unknown', element: 'fire', rarity: 'common', power: 12, basePower: 12, level: 1, name: 'Unknown' };
        const elementIcon = elementIcons[card.element] || elementIcons.fire;
        const el = document.createElement('div');
        el.className = `sp-card ${card.element} ${card.rarity || 'common'}`;
        el.dataset.rarity = card.rarity || 'common';
        if (slotIdx !== undefined) el.dataset.slot = slotIdx;


        // Р—Р°РІР¶РґРё CardRendererV2 СЏРє Сѓ РєРѕР»РѕРґС– вЂ” РїРѕРІРµСЂС‚Р°С”РјРѕ СЃР°РјРµ `.card-frame`, Р±РµР· РґРѕРґР°С‚РєРѕРІРѕРіРѕ wrapper
        if (window.CardRendererV2 && typeof window.CardRendererV2.render === 'function') {
          // CardRendererV2 in some builds displays `basePower` (or recomputes power from base+level),
          // so for duels we force-render the already calculated `card.power` as the shown power.
          let renderCard = card;
          try {
            const src = (card && card.id)
              ? (window.getCardById ? window.getCardById(card.id) : (typeof getCardById === 'function' ? getCardById(card.id) : null))
              : null;
            renderCard = Object.assign({}, src || {}, card || {});

            const pNum = Number(renderCard.power);
            if (Number.isFinite(pNum) && pNum > 0) {
              const p = Math.max(12, Math.round(pNum));
              renderCard.power = p;
              renderCard.basePower = p;
              renderCard.attack = p;
              renderCard.defense = Math.round(p * 0.8);
            }
          } catch (e) {
            renderCard = card;
          }

          const html = window.CardRendererV2.render(renderCard, { size: 'normal', showElement: true, showPower: true }) || '';
          const tmp = document.createElement('div');
          tmp.innerHTML = html.trim();

          const node = tmp.firstElementChild;
          if (!node) return el;

          // Р·Р±РµСЂРµРіС‚Рё СЃР»РѕС‚ С–РЅРґРµРєСЃ РґР»СЏ Р»РѕРіС–РєРё РєР»С–РєС–РІ/СѓРґР°СЂС–РІ
          if (slotIdx !== undefined) node.dataset.slot = slotIdx;

          // РїРѕРјС–С‚РєР° РґР»СЏ СЃС‚РёР»С–РІ СЃР°РјРµ РІ РґСѓРµР»С–
          node.classList.add('duel-card');

          return node;
        }

        // Legacy minimal card view if nothing else available
        // Use card's own power if present, fallback to calculation by id/level
        let displayPower = 0;
        try {
          if (card && typeof card.power === 'number' && !isNaN(card.power)) displayPower = Math.round(card.power);
          else {
            const src = (card && card.id) ? (window.getCardById ? window.getCardById(card.id) : getCardById(card.id)) : null;
            const lvl = (card && card.level) ? card.level : 1;
            displayPower = src ? (window.getPower ? window.getPower(src, lvl) : getPower(src, lvl)) : (card && card.basePower ? card.basePower : 12);
          }
        } catch (e) { displayPower = (card && card.power) || 12; }

        el.innerHTML = `
          <div class="corner-gear">
            ${elementIcon}
          </div>
          <div class="power-plate"><div class="power-value">${displayPower}</div></div>
        `;
        return el;
      },

      startRandomDuel() {
        const profile = userProfile.getProfile();
        if (!profile || !profile.deckCards || profile.deckCards.length < 9) {
          alert('РљРѕР»РѕРґР° РЅРµРїРѕРІРЅР°. РџРѕС‚СЂС–Р±РЅРѕ 9 РєР°СЂС‚.');
          return;
        }
        const playerDeck9 = this.buildDuelDeckFromProfile(profile);
        // HP РёРіСЂРѕРєР° = СЃСѓРјРјР° СЃРёР»С‹ 9 РєР°СЂС‚
        const playerHP = playerDeck9.reduce((s, c) => s + (c.power || 0), 0);

        // Р“РµРЅРµСЂРёСЂСѓРµРј РєРѕР»РѕРґСѓ РїСЂРѕС‚РёРІРЅРёРєР° С‡РµСЂРµР· РЅРѕРІС‹Р№ РіРµРЅРµСЂР°С‚РѕСЂ, РїСЂРёРІСЏР·Р°РЅРЅС‹Р№ Рє СЂРµР°Р»СЊРЅРѕР№ СЃРёР»Рµ РёРіСЂРѕРєР°
        const enemyObj = (typeof generateEnemyForDuel === 'function') ? generateEnemyForDuel() : { hand: [], power: 0 };
        // make a safe shallow copy of deck objects to avoid accidental shared references
        const enemyDeck9 = (enemyObj.hand || enemyObj.deck || enemyObj.deckCards || enemyObj.cards || []).map(c => Object.assign({}, c));
        const enemyPower = this.calcDeckPower(enemyDeck9); // == HP РІРѕСЂРѕРіР° (СЃСѓРјР° 9 РєР°СЂС‚), Р±РµР· cap
        try { console.debug('startRandomDuel -> generated enemy deck powers', enemyDeck9.map(d => d.power)); } catch(e) {}

        // Р—Р±РµСЂС–РіР°С”РјРѕ pending
        this.pendingDuel = { playerDeck9, enemyDeck9, playerPower: playerHP, enemyPower };
        // РђРІС‚РѕРјР°С‚РёС‡РЅРёР№ РїРѕС€СѓРє/РїРѕС‡Р°С‚РѕРє Р±РѕСЋ вЂ” РјС–РЅС–-С‚Р°Р№РјР°СѓС‚ РґР»СЏ РІС–РґС‡СѓС‚С‚СЏ РїРѕС€СѓРєСѓ
        const logEl = document.getElementById('duelLog');
        if (logEl) logEl.textContent = 'РџСЂРѕС‚РёРІРЅРёРє Р·РЅР°Р№РґРµРЅРёР№ вЂ” РіРѕС‚СѓС”РјРѕСЃСЊ...';
        setTimeout(() => {
          window.CURRENT_DUEL = window.createDuel(this.pendingDuel.playerDeck9, this.pendingDuel.enemyDeck9);
          this.renderDuel();
        }, 700);
      },

      showPreDuelDialog() {
        const modal = document.getElementById('duel-pre-modal');
        if (!modal || !this.pendingDuel) return;
        const profile = userProfile.getProfile();
        const enemyNameEl = document.getElementById('duel-pre-name');
        const enemyPowerEl = document.getElementById('duel-pre-power');
        const playerPowerEl = document.getElementById('duel-pre-player-power');

        // Р“РµРЅРµСЂСѓС”РјРѕ С–Рј'СЏ РІРѕСЂРѕРіР°
        const names = ['Lucky Harry','Steam Witch','Rust Baron','Copper Shade','Gearmancer','Brass Vex','Coal Phantom'];
        const picked = names[Math.floor(Math.random()*names.length)];
        this.pendingDuel.enemyName = picked;

        if (enemyNameEl) enemyNameEl.textContent = picked;
        if (enemyPowerEl) enemyPowerEl.textContent = this.pendingDuel.enemyPower;
        if (playerPowerEl) playerPowerEl.textContent = this.pendingDuel.playerPower;

        modal.classList.add('active');

        const attackBtn = document.getElementById('duel-pre-attack');
        const rerollBtn = document.getElementById('duel-pre-reroll');
        if (attackBtn) {
          attackBtn.onclick = () => {
            modal.classList.remove('active');
            window.CURRENT_DUEL = window.createDuel(this.pendingDuel.playerDeck9, this.pendingDuel.enemyDeck9);
            this.renderDuel();
          };
        }
        if (rerollBtn) {
          rerollBtn.onclick = () => {
            modal.classList.remove('active');
            startDuelSearchAnimation(() => {
              navigation.startRandomDuel();
            });
          };
        }
      },

      renderDuel() {
        const duel = window.CURRENT_DUEL;
        if (!duel) return;

        // Update legacy text nodes if present
        const legacyEnemyHp = document.getElementById('enemyHp');
        const legacyPlayerHp = document.getElementById('playerHp');
        if (legacyEnemyHp) legacyEnemyHp.textContent = `${duel.enemy.hp}/${duel.enemy.maxHp}`;
        if (legacyPlayerHp) legacyPlayerHp.textContent = `${duel.player.hp}/${duel.player.maxHp}`;

        // Update new HUD bars and labels
        const enemyHpText = document.getElementById('enemyHpText');
        const playerHpText = document.getElementById('playerHpText');
        const enemyHpBar = document.getElementById('enemyHpBar');
        const playerHpBar = document.getElementById('playerHpBar');
        if (enemyHpText) enemyHpText.textContent = `${duel.enemy.hp}/${duel.enemy.maxHp}`;
        if (playerHpText) playerHpText.textContent = `${duel.player.hp}/${duel.player.maxHp}`;
        if (enemyHpBar) {
          const pct = Math.max(0, Math.min(100, Math.round((duel.enemy.hp / Math.max(1, duel.enemy.maxHp)) * 100)));
          enemyHpBar.style.width = pct + '%';
        }
        if (playerHpBar) {
          const pctP = Math.max(0, Math.min(100, Math.round((duel.player.hp / Math.max(1, duel.player.maxHp)) * 100)));
          playerHpBar.style.width = pctP + '%';
        }

        const enemyPowerEl = document.getElementById('enemyPower');
        const playerPowerEl = document.getElementById('playerPower');
        if (enemyPowerEl) enemyPowerEl.textContent = formatCompact(duel.enemy.maxHp);
        if (playerPowerEl) playerPowerEl.textContent = formatCompact(duel.player.maxHp);

        const enemyHandEl  = document.getElementById('enemyHand');
        const playerHandEl = document.getElementById('playerHand');
        enemyHandEl.innerHTML = '';
        playerHandEl.innerHTML = '';

        // Render enemy visible hand (3 cards on field). fullNine is kept for HP calculation only.
        (duel.enemy.hand || []).forEach((c, idx) => {
          window.assertFullCard(c, 'duel-enemy');
          const node = this.createCardNode(c, false, idx);
          enemyHandEl.appendChild(node);
        });

        // Diagnostic: ensure enemy deck sum equals maxHp (full pool)
        try {
          const deckPool = Array.isArray(duel.enemy.deck) && duel.enemy.deck.length ? duel.enemy.deck : (Array.isArray(duel.enemy.fullNine) ? duel.enemy.fullNine : []);
          const deckSum = deckPool.reduce((s, cc) => s + (cc.power || 0), 0);
          if (deckSum !== duel.enemy.maxHp) {
            console.warn('ENEMY DECK MISMATCH', { deckSum, maxHp: duel.enemy.maxHp, deck: deckPool });
          }
        } catch (e) {}

        // Render player hand (click to play)
        duel.player.hand.forEach((c, idx) => {
          window.assertFullCard(c, 'duel-player');
          const node = this.createCardNode(c, true, idx);
          // Р”РµР»РµРіСѓС”РјРѕ РєР»С–Рє РЅР° .card-frame, СЏРєС‰Рѕ РІРѕРЅР° С”, С–РЅР°РєС€Рµ РЅР° РІРµСЃСЊ node
          const frame = node.querySelector('.card-frame');
          const clickTarget = frame || node;
          clickTarget.style.cursor = 'pointer';
          clickTarget.addEventListener('click', (e) => {
            e.stopPropagation();
            if (duel.finished || duelAnimLock) return;

            const defenderCard = duel.enemy.hand[idx];
            const defenderEl = enemyHandEl.children[idx];
            if (!defenderCard || !defenderEl) return;

            const dmg = window.damage(c, defenderCard).dmg;

            // Call animator which itself manages the duelAnimLock; do not set lock here
            animateOriginalFlyHit(node, defenderEl, dmg, () => {
              window.CURRENT_DUEL = window.playTurn(duel, idx);
              this.renderDuel();

              if (window.CURRENT_DUEL.finished) {
                this.showDuelResult(window.CURRENT_DUEL);
              }
            });
          });
          playerHandEl.appendChild(node);
        });

        const logEl = document.getElementById('duelLog');
        logEl.innerHTML = duel.log.map(r => `РҐС–Рґ ${r.turn}: Р’Рё(${r.player.element}) ${formatCompact(r.player.dmg)} Г—${r.player.mult} в†” Р’РѕСЂРѕРі(${r.enemy.element}) ${formatCompact(r.enemy.dmg)} Г—${r.enemy.mult}`).join('<br>');
        
        this.updatePlayerMultiplierPreview();
      },

      showDuelResult(duel) {
        const profile = userProfile.getProfile();
        if (!profile) return;

        const modal = document.getElementById('duel-result-modal');
        const titleEl = document.getElementById('duel-result-title');
        const subtitleEl = document.getElementById('duel-result-subtitle');
        const rewardsEl = document.getElementById('duel-result-rewards');
        const winsInfoEl = document.getElementById('duel-wins-info');
        const summaryHpEl = document.getElementById('duel-summary-player-hp');
        const battleCardsEl = document.getElementById('duel-battle-cards');

        if (!modal) return;

        // Р’РёР·РЅР°С‡РёС‚Рё СЂРµР·СѓР»СЊС‚Р°С‚ Р·Р° HP (СЏРєС‰Рѕ HP РіСЂР°РІС†СЏ 0 - РїРѕСЂР°Р·РєР°, СЏРєС‰Рѕ РІРѕСЂРѕРіР° 0 - РїРµСЂРµРјРѕРіР°)
        let result = duel.result;
        if (duel.player.hp === 0 && duel.enemy.hp > 0) {
          result = 'lose';
        } else if (duel.enemy.hp === 0 && duel.player.hp > 0) {
          result = 'win';
        }

        updateTasks("duel");

        let xpGain = 0;
        let boltsGain = 0;

        // Helper: exponential bolts reward based on player level
        const boltsReward = (base, growth, level) => {
          const L = Math.max(1, Number(level) || 1);
          return Math.round(base * Math.pow(growth, L - 1));
        };
        let dropInfo = '';

        if (result === 'win') {
          titleEl.textContent = 'рџЏ† РџР•Р Р•РњРћР“Рђ';
          xpGain = Math.round(80 * Math.pow(1.08, (profile.level||1)-1));
          boltsGain = boltsReward(55, 1.12, profile.level);
          profile.wins = (profile.wins || 0) + 1;
          updateTasks("win");
          // РЎРёСЃС‚РµРјР° РґСЂРѕРїР° РєР°СЂС‚ Р· СѓСЂР°С…СѓРІР°РЅРЅСЏРј СЂС–РґРєРѕСЃС‚С–
          if (window.dropSystem && window.dropSystem.shouldDrop('win')) {
            // Р†РЅС–С†С–Р°Р»С–Р·Р°С†С–СЏ pity Р»С–С‡РёР»СЊРЅРёРєС–РІ
            profile.pityCounters = profile.pityCounters || { noLegendary: 0, noMythic: 0 };
            
            const allCards = window.ALL_CARDS || [];
            const starterCards = window.STARTER_CARDS || [];
            
            const dropResult = window.dropSystem.dropCard(
              profile,
              allCards,
              starterCards,
              profile.pityCounters
            );
            
            if (dropResult.card) {
              const card = dropResult.card;
              
              // РћРЅРѕРІРёС‚Рё pity Р»С–С‡РёР»СЊРЅРёРєРё
              profile.pityCounters = dropResult.pityCounters;
              
              // Р”РѕРґР°С‚Рё РєР°СЂС‚Сѓ РІ РєРѕР»РµРєС†С–СЋ
              profile.collectionCards = profile.collectionCards || [];
              const newEntry = { id: card.id, level: 1 };
              profile.collectionCards.push(newEntry);
              userProfile.autoAddToDeck(profile, newEntry);

              // РћРЅРѕРІРёС‚Рё С–РЅРІРµРЅС‚Р°СЂ
              profile.inventory = profile.inventory || {};
              profile.inventory[card.id] = (profile.inventory[card.id] || 0) + 1;
              
              // РџРѕРєР°Р·Р°С‚Рё С–РЅС„РѕСЂРјР°С†С–СЋ РїСЂРѕ РґСЂРѕРї
              const rarityNames = { R1: 'Р·РІРёС‡Р°Р№РЅР°', R2: 'РЅРµР·РІРёС‡Р°Р№РЅР°', R3: 'СЂС–РґРєС–СЃРЅР°', R4: 'РµРїС–С‡РЅР°', R5: 'Р»РµРіРµРЅРґР°СЂРЅР°', R6: 'РјС–С„С–С‡РЅР°' };
              const rarityName = rarityNames[card.rarity] || card.rarity;
              const sourceInfo = dropResult.fromStarterPool ? ' (СЃС‚Р°СЂС‚РѕРІР°)' : '';
              dropInfo = ` + ${rarityName} РєР°СЂС‚Р° ${card.id}${sourceInfo}`;
            }
          }
        } else if (result === 'lose') {
          titleEl.textContent = 'рџ’Ђ РџРћР РђР—РљРђ';
          xpGain = Math.round(30 * Math.pow(1.05, (profile.level||1)-1));
          boltsGain = boltsReward(12, 1.08, profile.level);
          profile.losses = (profile.losses || 0) + 1;
          
          // РњРµРЅС€РёР№ С€Р°РЅСЃ РґСЂРѕРїР° РїСЂРё РїРѕСЂР°Р·С†С– (10%)
          if (window.dropSystem && window.dropSystem.shouldDrop('lose')) {
            profile.pityCounters = profile.pityCounters || { noLegendary: 0, noMythic: 0 };
            
            const allCards = window.ALL_CARDS || [];
            const starterCards = window.STARTER_CARDS || [];
            
            const dropResult = window.dropSystem.dropCard(
              profile,
              allCards,
              starterCards,
              profile.pityCounters
            );
            
            if (dropResult.card) {
              const card = dropResult.card;
              profile.pityCounters = dropResult.pityCounters;
              
              profile.collectionCards = profile.collectionCards || [];
              const newEntry = { id: card.id, level: 1 };
              profile.collectionCards.push(newEntry);
              userProfile.autoAddToDeck(profile, newEntry);

              profile.inventory = profile.inventory || {};
              profile.inventory[card.id] = (profile.inventory[card.id] || 0) + 1;
              
              const rarityNames = { R1: 'Р·РІРёС‡Р°Р№РЅР°', R2: 'РЅРµР·РІРёС‡Р°Р№РЅР°', R3: 'СЂС–РґРєС–СЃРЅР°', R4: 'РµРїС–С‡РЅР°', R5: 'Р»РµРіРµРЅРґР°СЂРЅР°', R6: 'РјС–С„С–С‡РЅР°' };
              const rarityName = rarityNames[card.rarity] || card.rarity;
              const sourceInfo = dropResult.fromStarterPool ? ' (СЃС‚Р°СЂС‚РѕРІР°)' : '';
              dropInfo = ` + ${rarityName} РєР°СЂС‚Р° ${card.id}${sourceInfo}`;
            }
          }
        } else {
          titleEl.textContent = 'вљ–пёЏ РќР†Р§РРЇ';
          xpGain = Math.round(45 * Math.pow(1.06, (profile.level||1)-1));
          boltsGain = boltsReward(28, 1.10, profile.level);
          
          // РЎРµСЂРµРґРЅС–Р№ С€Р°РЅСЃ РґСЂРѕРїР° РїСЂРё РЅС–С‡РёС— (20%)
          if (window.dropSystem && window.dropSystem.shouldDrop('draw')) {
            profile.pityCounters = profile.pityCounters || { noLegendary: 0, noMythic: 0 };
            
            const allCards = window.ALL_CARDS || [];
            const starterCards = window.STARTER_CARDS || [];
            
            const dropResult = window.dropSystem.dropCard(
              profile,
              allCards,
              starterCards,
              profile.pityCounters
            );
            
            if (dropResult.card) {
              const card = dropResult.card;
              profile.pityCounters = dropResult.pityCounters;
              
              profile.collectionCards = profile.collectionCards || [];
              const newEntry = { id: card.id, level: 1 };
              profile.collectionCards.push(newEntry);
              userProfile.autoAddToDeck(profile, newEntry);

              profile.inventory = profile.inventory || {};
              profile.inventory[card.id] = (profile.inventory[card.id] || 0) + 1;
              
              const rarityNames = { R1: 'Р·РІРёС‡Р°Р№РЅР°', R2: 'РЅРµР·РІРёС‡Р°Р№РЅР°', R3: 'СЂС–РґРєС–СЃРЅР°', R4: 'РµРїС–С‡РЅР°', R5: 'Р»РµРіРµРЅРґР°СЂРЅР°', R6: 'РјС–С„С–С‡РЅР°' };
              const rarityName = rarityNames[card.rarity] || card.rarity;
              const sourceInfo = dropResult.fromStarterPool ? ' (СЃС‚Р°СЂС‚РѕРІР°)' : '';
              dropInfo = ` + ${rarityName} РєР°СЂС‚Р° ${card.id}${sourceInfo}`;
            }
          }
        }

        subtitleEl.textContent = 'Р’Рё РѕС‚СЂРёРјР°Р»Рё:';

        // РћРЅРѕРІРёС‚Рё РїСЂРѕС„С–Р»СЊ
        profile.xp = (profile.xp || 0) + xpGain;
        // Ensure level is numeric to avoid string/undefined edge cases
        profile.level = Number(profile.level) || 1;
        profile.bolts = (profile.bolts || 0) + boltsGain;
        profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;

        // РџРµСЂРµРІС–СЂРёС‚Рё СЂС–РІРµРЅСЊ (С€РµСЃС‚РµСЂРЅС– РЅР°СЂР°С…РѕРІСѓСЋС‚СЊСЃСЏ Р»РёС€Рµ РїСЂРё РїС–РґРІРёС‰РµРЅРЅС– СЂС–РІРЅСЏ)
        let leveled = 0;
        let gearsGained = 0;
        // Diagnostic: log initial values to help debug failed level-ups
        try {
          const needInitial = this.xpNeededForLevel(profile.level || 1);
          console.debug('Level check start:', { level: profile.level, xp: profile.xp, needInitial });
        } catch (e) {
          console.warn('xpNeededForLevel threw', e);
        }

        while (profile.xp >= this.xpNeededForLevel(profile.level || 1)) {
          const need = this.xpNeededForLevel(profile.level || 1);
          console.debug('Leveling: before subtract', { level: profile.level, xp: profile.xp, need });
          profile.xp -= need;
          // Р—Р±С–Р»СЊС€СѓС”РјРѕ СЂС–РІРµРЅСЊ
          profile.level = Number(profile.level) + 1;
          console.info('Leveled up to', profile.level);
          // РќР°СЂР°С…РѕРІСѓС”РјРѕ С€РµСЃС‚РµСЂРЅС– Р·Р° С†РµР№ СЂС–РІРµРЅСЊ (Р»РѕРіС–РєР°: РґРѕРґР°С”РјРѕ РєС–Р»СЊРєС–СЃС‚СЊ С€РµСЃС‚РµСЂРµРЅСЊ СЂС–РІРЅСЏ)
          const gearForThisLevel = profile.level;
          profile.gears = (profile.gears || 0) + gearForThisLevel;
          gearsGained += gearForThisLevel;
          leveled += 1;
        }

        userProfile.updateCurrentUser(profile);
        userProfile.updateUI();
        this.updateXP(profile);

        if (gearsGained > 0 && typeof taskEvent === 'function') {
          try { taskEvent('gears', gearsGained); } catch (e) { console.warn('taskEvent failed', e); }
        }

        // РџРѕРєР°Р·Р°С‚Рё Р»РёС€Рµ С‚Рµ, С‰Рѕ РѕС‚СЂРёРјР°РЅРѕ Сѓ Р±РѕСЋ: XP, Р±РѕР»С‚Рё, РґСЂРѕРї, С‚Р° С€РµСЃС‚РµСЂРЅС– (СЏРєС‰Рѕ Р±СѓР»Рё РѕС‚СЂРёРјР°РЅС– С‡РµСЂРµР· СЂС–РІРµРЅСЊ)
        const parts = [];
        if (xpGain > 0) parts.push(`XP: +${this.formatCompact ? this.formatCompact(xpGain) : xpGain}`);
        if (boltsGain > 0) parts.push(`рџ”© +${this.formatCompact ? this.formatCompact(boltsGain) : boltsGain}`);
        if (gearsGained > 0) parts.push(`вљ™пёЏ +${gearsGained}`);
        if (dropInfo) parts.push(dropInfo.trim());
        rewardsEl.textContent = parts.join('  вЂў  ') || 'РќС–С‡РѕРіРѕ РЅРµ РѕС‚СЂРёРјР°РЅРѕ';
        winsInfoEl.textContent = `РџРµСЂРµРјРѕРі РІ РґСѓРµР»СЏС…: рџЏ† ${formatCompact(profile.wins || 0)}`;
        summaryHpEl.textContent = duel.player.hp;

        // РџРѕРєР°Р·Р°С‚Рё РїС–РґСЃСѓРјРєРё Р±РѕСЋ Р· РєР°СЂС‚Р°РјРё
        const elementEmojis = {
          fire: 'рџ”Ґ',
          water: 'рџ’§',
          air: 'рџ’Ё',
          earth: 'рџЌѓ'
        };

        battleCardsEl.innerHTML = duel.log.map(log => {
          const pEmoji = elementEmojis[log.player.element] || elementEmojis.fire;
          const eEmoji = elementEmojis[log.enemy.element] || elementEmojis.fire;
          return `
            <div class="duel-battle-card-row">
              <div class="duel-battle-card-player">
                <div class="duel-battle-card-icon" style="--elem: var(--${log.player.element})">
                  <span class="element-emoji">${pEmoji}</span>
                </div>
                <span class="duel-battle-card-dmg">${log.player.dmg}</span>
              </div>
              <span class="duel-battle-vs">вљ”</span>
              <div class="duel-battle-card-enemy">
                <span class="duel-battle-card-dmg">${log.enemy.dmg}</span>
                <div class="duel-battle-card-icon" style="--elem: var(--${log.enemy.element})">
                  <span class="element-emoji">${eEmoji}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');

        modal.classList.add('active');
      },

      closeDuelResult() {
        const modal = document.getElementById('duel-result-modal');
        if (modal) {
          modal.classList.remove('active');
          // РџРµСЂРµР·Р°РїСѓСЃС‚РёС‚Рё РґСѓРµР»СЊ
          startDuelSearchAnimation(() => {
            navigation.startRandomDuel();
          });
        }
      }
    };

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
      // РњРµРЅСЋ "РЎСѓРјРєР°"
      document.getElementById('menu-bag-btn')?.addEventListener('click', () => navigation.showPage('bag'));
      document.getElementById('bag-back-btn')?.addEventListener('click', () => navigation.showPage('home'));
      // Initialize auth UI
      authUI.init();
      
      // Update UI with profile data if logged in
      if (userProfile.isLoggedIn()) {
        userProfile.updateUI();
        const profile = userProfile.getProfile();
        if (profile) maybeResetTasks(profile);
        console.log('User profile loaded:', userProfile.getCurrentUser());
      }
      
      // Navigation handlers for tiles
      document.querySelectorAll('[data-page]').forEach(element => {
        element.addEventListener('click', (e) => {
          e.preventDefault();
          const pageId = element.dataset.page;
          navigation.showPage(pageId);
        });
      });
      
      // Bottom nav handlers
      const navButtons = {
        'nav-home': 'home',
        'nav-profile': 'profile',
        'nav-guild': 'guild'
      };
      
      document.querySelectorAll('.navbtn').forEach(btn => {
        btn.addEventListener('click', () => {
          // Update active state
          document.querySelectorAll('.navbtn').forEach(x => x.classList.remove('active'));
          btn.classList.add('active');
          
          // Navigate to page
          const pageId = navButtons[btn.id];
          if (pageId) {
            navigation.showPage(pageId);
          }
        });
      });
      
      // Logout button handler
      document.querySelector('.logout-btn')?.addEventListener('click', () => {
        if (confirm('Р’Рё РІРїРµРІРЅРµРЅС–, С‰Рѕ С…РѕС‡РµС‚Рµ РІРёР№С‚Рё?')) {
          userProfile.logout();
          location.reload();
        }
      });
      
      // Shop tab handlers
      document.querySelectorAll('.shop-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          // Update active tab
          document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          
          // Show corresponding content
          const tabId = this.dataset.tab;
          document.querySelectorAll('.shop-tab-content').forEach(content => {
            content.classList.remove('active');
          });
          document.getElementById(`shop-tab-${tabId}`)?.classList.add('active');
        });
      });

      // Card filter handlers
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          // Update active state
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          
          // Load filtered cards
          const element = this.dataset.element;
          navigation.currentCardFilter = element;
          navigation.loadShopCards(element);
        });
      });

      // Pack modal close handler
      document.getElementById('pack-modal-close')?.addEventListener('click', () => {
        navigation.closePackModal();
      });

      

      // Click outside modal to close
      document.getElementById('pack-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'pack-modal') {
          navigation.closePackModal();
        }
      });

      // Duel result modal close handler
      document.getElementById('duel-result-close')?.addEventListener('click', () => {
        navigation.closeDuelResult();
      });

      // Click outside duel modal to close
      document.getElementById('duel-result-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'duel-result-modal') {
          navigation.closeDuelResult();
        }
      });
    });

    window.getXpForLevel = navigation.getXpForLevel;

function renderTasks() {
  if (typeof renderTasksV2 === 'function') return renderTasksV2();
  const root = document.getElementById("tasks-list");
  if (!root) return;

  const profile = userProfile.getProfile();
  if (!profile) return;

  ensureTasksState(profile);

  root.innerHTML = "";

  TASKS.forEach(task => {
    const progress = profile.tasks[task.id] || 0;
    const done = profile.completedTasks.includes(task.id);
    const percent = Math.min(100, (progress / task.target) * 100);

    const el = document.createElement("div");
    el.className = "task-card" + (done ? " task-done" : "");

    const xp = task.reward?.xp || 0;
    const gears = task.reward?.gears || 0;

    el.innerHTML = `
      <div class="task-top">
        <span>${task.title}</span>
        <span>${progress}/${task.target}</span>
      </div>
      <div class="task-desc">${task.desc}</div>
      <div class="task-bar">
        <div class="task-bar-fill" style="width:${percent}%"></div>
      </div>
      <div class="task-reward">
        РќР°РіРѕСЂРѕРґР°: ${xp} XP${gears ? ` + ${gears} вљ™пёЏ` : ""}
      </div>
    `;

    root.appendChild(el);
  });
}

function updateTasks(type, amount = 1) {
  if (typeof taskEvent === 'function') {
    try { taskEvent(type, amount); } catch (e) { console.warn('taskEvent delegate failed', e); }
    return;
  }
  const profile = userProfile.getProfile();
  if (!profile) return;

  ensureTasksState(profile);

  TASKS.forEach(task => {
    if (task.type !== type) return;
    if (profile.completedTasks.includes(task.id)) return;

    profile.tasks[task.id] = (profile.tasks[task.id] || 0) + 1;

    if (profile.tasks[task.id] >= task.target) {
      profile.completedTasks.push(task.id);

      profile.xp = (profile.xp || 0) + (task.reward?.xp || 0);
        const _g = (task.reward?.gears || 0);
        profile.gears = (profile.gears || 0) + _g;
        if (_g > 0 && typeof taskEvent === 'function') taskEvent('gears', _g);

      userProfile.updateCurrentUser(profile);
      userProfile.updateUI();
      if (typeof navigation !== 'undefined' && typeof navigation.updateXP === 'function') {
        navigation.updateXP(profile);
      } else if (typeof window !== 'undefined' && typeof window.updateXP === 'function') {
        window.updateXP(profile);
      }
    }
  });

  renderTasks();
}

    // Accordion (removed since we're using page navigation now)

    // Tiles (removed since we're using page navigation now)

  

// =========================================================
// DUEL SEARCH ANIMATION LOGIC
// =========================================================

let duelSearchTimer = null;
let duelDotsTimer = null;

function startDuelSearchAnimation(onFinish) {
  const overlay = document.getElementById('duelSearchOverlay');
  const textEl = document.getElementById('duelSearchText');
  if (!overlay || !textEl) return;

  overlay.classList.remove('hidden');

  let dots = 0;
  duelDotsTimer = setInterval(() => {
    dots = (dots + 1) % 4;
    textEl.textContent = 'РџРѕС€СѓРє СЃСѓРїРµСЂРЅРёРєР°' + '.'.repeat(dots);
  }, 400);

  const duration = 2000 + Math.random() * 2000;

  duelSearchTimer = setTimeout(() => {
    stopDuelSearchAnimation();
    if (typeof onFinish === 'function') onFinish();
  }, duration);
}

function stopDuelSearchAnimation() {
  const overlay = document.getElementById('duelSearchOverlay');
  if (overlay) overlay.classList.add('hidden');

  // FIX: РіР°СЂР°РЅС‚РѕРІР°РЅРѕ РїРѕРІРµСЂС‚Р°С”РјРѕ РєР»С–РєРё
  document.body.classList.remove('duel-locked', 'duel-anim-lock');

  if (duelDotsTimer) {
    clearInterval(duelDotsTimer);
    duelDotsTimer = null;
  }
  if (duelSearchTimer) {
    clearTimeout(duelSearchTimer);
    duelSearchTimer = null;
  }
}

// =========================================================
// ANTI-SPAM LOCK (during animations)
// =========================================================
// =========================================================
// GLOBAL NUMBER FORMATTER (k for >=1000)
// =========================================================
function formatCompact(number) {
  const n = Number(number) || 0;
  const neg = n < 0;
  const abs = Math.abs(n);
  if (abs < 1000) return String(n);
  let v = abs / 1000;
  // show one decimal for values < 10k, integer otherwise
  let out;
  if (v < 10) {
    out = Math.round(v * 10) / 10; // one decimal
  } else {
    out = Math.round(v); // integer
  }
  // strip trailing .0
  out = String(out).replace(/\.0$/, '');
  return (neg ? '-' : '') + out + 'Рє';
}

let duelAnimationLocked = false;

function lockDuelActions() {
  duelAnimationLocked = true;
}

function unlockDuelActions() {
  duelAnimationLocked = false;
}

/* ---------- Damage number ---------- */
function spawnDamageNumber(targetEl, value) {
  const num = document.createElement('div');
  num.className = 'damage-number';
  num.textContent = `-${formatCompact(value)}`;

  const rect = targetEl.getBoundingClientRect();
  const arena = document.querySelector('.duel-arena') || document.body;

  num.style.left = rect.left + rect.width / 2 - 14 + 'px';
  num.style.top  = rect.top + rect.height / 2 - 20 + 'px';

  arena.appendChild(num);
  setTimeout(() => num.remove(), 1000);
}

/* ---------- Element FX ---------- */
function spawnElementEffect(targetEl, element) {
  const fx = document.createElement('div');
  fx.className = `element-effect ${element}-effect`;

  const rect = targetEl.getBoundingClientRect();
  const arena = document.querySelector('.duel-arena') || document.body;

  fx.style.left = rect.left + rect.width / 2 - 30 + 'px';
  fx.style.top  = rect.top + rect.height / 2 - 30 + 'px';

  arena.appendChild(fx);
  setTimeout(() => fx.remove(), 800);
}

/* ---------- MAIN ATTACK ANIMATION ---------- */
function animateCardAttack(attackerEl, defenderEl, cardData, damage, onDone) {
  if (duelAnimationLocked) return;
  if (!attackerEl || !defenderEl) return;

  lockDuelActions();

  // attacker animation
  attackerEl.classList.add('card-attacking');

  // defender reaction
  defenderEl.classList.add('card-hit', 'card-shake');

  // visual effects
  spawnDamageNumber(defenderEl, damage);
  spawnElementEffect(defenderEl, cardData.element);

  // cleanup (duration = cardAttack 0.8s)
  setTimeout(() => {
    attackerEl.classList.remove('card-attacking');
    defenderEl.classList.remove('card-hit', 'card-shake');

    unlockDuelActions();
    if (typeof onDone === 'function') onDone();
  }, 800);
}

/* =========================================================
   DUEL: card flies & hits (damage-scaled) + anti-spam lock
   ========================================================= */

let duelAnimLock = false;
let duelAnimUnlockTimer = null;

function setDuelAnimLock(v){
  duelAnimLock = !!v;
  document.body.classList.toggle('duel-anim-lock', duelAnimLock);

  if (duelAnimUnlockTimer) {
    clearTimeout(duelAnimUnlockTimer);
    duelAnimUnlockTimer = null;
  }

  // Fail-safe: якщо через будь-яку помилку lock не скинувся — авто-розблок через 2с
  if (duelAnimLock) {
    duelAnimUnlockTimer = setTimeout(() => {
      try {
        if (duelAnimLock) {
          console.warn('[duel] forced unlock (timeout)');
          setDuelAnimLock(false);
        }
      } catch(e) {}
    }, 2000);
  }
}
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function rectCenter(r){
  return { x: r.left + r.width/2, y: r.top + r.height/2 };
}

function spawnHitFlash(x, y, intensity01){
  const size = 70 + Math.round(70 * intensity01); // 70..140
  const el = document.createElement('div');
  el.className = 'duel-hit-flash';
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  el.style.left = (x - size/2) + 'px';
  el.style.top  = (y - size/2) + 'px';
  el.style.animation = `hitFlash ${260 + Math.round(140 * intensity01)}ms ease-out forwards`;
  el.style.filter = `brightness(${1.0 + 0.6 * intensity01})`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

function animateOriginalFlyHit(attackerEl, defenderEl, damage, onDone){
  if (duelAnimLock) return;
  if (!attackerEl || !defenderEl) return;

  setDuelAnimLock(true);

  const finish = (callDone = true) => {
    try { setDuelAnimLock(false); } catch(e) {}
    try { if (callDone && typeof onDone === 'function') onDone(); } catch(e) {}
  };

  const watchdog = setTimeout(() => {
    try {
      if (duelAnimLock) {
        console.warn('[duel] animation watchdog unlock');
        finish(false);
      }
    } catch(e) {}
  }, 2000);

  let placeholder = null;
  const originalParent = attackerEl.parentNode;
  const originalNext = attackerEl.nextSibling;

  const restoreAttacker = () => {
    try {
      if (placeholder && placeholder.parentNode) {
        placeholder.replaceWith(attackerEl);
        placeholder = null;
        return;
      }
    } catch(e) {}

    try {
      if (originalParent) {
        if (originalNext && originalNext.parentNode === originalParent) originalParent.insertBefore(attackerEl, originalNext);
        else originalParent.appendChild(attackerEl);
      }
    } catch(e) {}

    try { if (placeholder && placeholder.parentNode) placeholder.remove(); } catch(e) {}
  };

  try {
    const arena = document.querySelector('.duel-arena');
    if (!arena) {
      clearTimeout(watchdog);
      finish(true);
      return;
    }

    // --- 1. Зберігаємо стан ---
    const aRect = attackerEl.getBoundingClientRect();
    const dRect = defenderEl.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();

    const startX = aRect.left - arenaRect.left;
    const startY = aRect.top  - arenaRect.top;

    const endX = dRect.left + dRect.width / 2 - arenaRect.left - aRect.width / 2;
    const endY = dRect.top  + dRect.height / 2 - arenaRect.top  - aRect.height / 2;

    const originalStyle = {
      position: attackerEl.style.position,
      left: attackerEl.style.left,
      top: attackerEl.style.top,
      zIndex: attackerEl.style.zIndex,
      transition: attackerEl.style.transition,
      transform: attackerEl.style.transform
    };

    // --- 2. Placeholder (щоб layout не схлопнувся) ---
    placeholder = document.createElement('div');
    placeholder.style.width = aRect.width + 'px';
    placeholder.style.height = aRect.height + 'px';
    if (attackerEl.parentNode) attackerEl.parentNode.insertBefore(placeholder, attackerEl);

    // --- 3. Вириваємо карту ---
    attackerEl.classList.add('attacking');
    attackerEl.style.position = 'absolute';
    attackerEl.style.left = startX + 'px';
    attackerEl.style.top  = startY + 'px';
    attackerEl.style.zIndex = '6000';
    arena.appendChild(attackerEl);

    attackerEl.getBoundingClientRect(); // reflow

    // --- 4. Політ ---
    attackerEl.style.transition = 'left 299ms cubic-bezier(.2,.9,.2,1), top 299ms cubic-bezier(.2,.9,.2,1), transform 299ms ease';
    attackerEl.style.transform = 'scale(1.08)';
    attackerEl.style.left = endX + 'px';
    attackerEl.style.top  = (endY - 20) + 'px';

    setTimeout(() => {
      try {
        // --- 5. УДАР ---
        defenderEl.classList.add('duel-hit');
        attackerEl.style.transition = 'top 138ms ease-out, transform 138ms ease-out';
        attackerEl.style.top = (endY + 12) + 'px';
        attackerEl.style.transform = 'scale(0.96)';
      } catch(e) {}
    }, 299);

    setTimeout(() => {
      try {
        defenderEl.classList.remove('duel-hit');
        // --- 6. ПОВЕРНЕННЯ ---
        attackerEl.style.transition = 'left 253ms ease-in, top 253ms ease-in, transform 253ms ease-in';
        attackerEl.style.left = startX + 'px';
        attackerEl.style.top  = startY + 'px';
        attackerEl.style.transform = 'scale(1)';
      } catch(e) {}
    }, 437);

    setTimeout(() => {
      try {
        // --- 7. Відновлення ---
        attackerEl.classList.remove('attacking');
        attackerEl.style.position = originalStyle.position;
        attackerEl.style.left = originalStyle.left;
        attackerEl.style.top = originalStyle.top;
        attackerEl.style.zIndex = originalStyle.zIndex;
        attackerEl.style.transition = originalStyle.transition;
        attackerEl.style.transform = originalStyle.transform;
      } catch(e) {}

      restoreAttacker();
      clearTimeout(watchdog);
      setDuelAnimLock(false);

      if (typeof onDone === 'function') onDone();
    }, 690);
  } catch (e) {
    console.warn('[duel] animateOriginalFlyHit failed', e);
    try { restoreAttacker(); } catch(_) {}
    try { clearTimeout(watchdog); } catch(_) {}
    finish(true);
  }
}

// ===== PERF PATCH v1 (mobile) =====
(function () {
  // 1) RAF-batched DOM writes
  const textQueue = new Map(); // el -> string
  const classQueue = []; // [el, className, enabled]
  let rafPending = false;

  function flushUI() {
    rafPending = false;

    // text updates
    for (const [el, val] of textQueue) {
      if (el && el.textContent !== val) el.textContent = val;
    }
    textQueue.clear();

    // class toggles
    for (let i = 0; i < classQueue.length; i++) {
      const [el, cls, on] = classQueue[i];
      if (!el) continue;
      el.classList.toggle(cls, !!on);
    }
    classQueue.length = 0;
  }

  function scheduleFlush() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(flushUI);
  }

  // API to use in your code
  window.uiSetText = function (selectorOrEl, value) {
    const el =
      typeof selectorOrEl === "string"
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;

    if (!el) return;
    textQueue.set(el, String(value));
    scheduleFlush();
  };

  window.uiToggleClass = function (selectorOrEl, className, enabled) {
    const el =
      typeof selectorOrEl === "string"
        ? document.querySelector(selectorOrEl)
        : selectorOrEl;

    if (!el) return;
    classQueue.push([el, className, enabled]);
    scheduleFlush();
  };

  // 2) One UI interval for timers/progress (instead of many setInterval)
  // Call window.uiTickCallbacks.add(fn) to run fn every 250ms
  const callbacks = new Set();
  window.uiTickCallbacks = callbacks;

  setInterval(() => {
    // Run lightweight callbacks only (no full re-render)
    callbacks.forEach((fn) => {
      try { fn(); } catch (e) {}
    });
  }, 250);

  // 3) Debounced save (avoid localStorage freezes)
  let saveTimer = null;
  window.debouncedSaveProfile = function (saveFn, delay = 800) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try { saveFn(); } catch (e) {}
    }, delay);
  };

  // 4) Prefer passive listeners for touch/scroll
  // (doesn't change your code; just helper if you add listeners)
  window.addPassive = function (el, event, handler) {
    el.addEventListener(event, handler, { passive: true });
  };

  window.closeCollection = navigation.closeCollection;
})();

/* ===== Click delegation helper (optional) =====
   Usage: mark actionable buttons with data-action and optional data-id.
   Example: <button data-action="upgradeCard" data-id="123">Upgrade</button>
*/
(function () {
  const root = document.body;
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    try {
      if (action === 'takeTaskReward' && window.takeTaskReward) window.takeTaskReward(id);
      else if (action === 'upgradeCard' && window.upgradeCard) window.upgradeCard(id);
      else if (action === 'buyItem' && window.buyItem) window.buyItem(id);
      // add more routes as needed
    } catch (e) {
      // swallow errors to avoid breaking global handler
    }
  }, { passive: true });
})();

// ===== FAKE ONLINE COUNTER (GitHub Pages friendly) =====
(function onlineCounter() {
  const KEY = 'online-heartbeats';
  const TTL = 15000; // 15 СЃРµРє
  const id = Math.random().toString(36).slice(2);

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function tick() {
    const now = Date.now();
    const data = load();
    data[id] = now;

    // С‡РёСЃС‚РёРјРѕ СЃС‚Р°СЂС–
    for (const k in data) {
      if (now - data[k] > TTL) delete data[k];
    }

    save(data);

    const el = document.getElementById('online-count');
    if (el) el.textContent = Object.keys(data).length;
  }

  tick();
  setInterval(tick, 5000);
})();

// ===== REAL ONLINE VIA GIST (GitHub Pages) =====
(function gistOnlineCounter() {
  const DEFAULT_GIST = localStorage.getItem('gh_gist_id') || 'YOUR_GIST_ID';
  const FILE = 'online.json';
  const TOKEN = localStorage.getItem('gh_gist_token') || 'YOUR_GITHUB_TOKEN';
  const TTL_MS = 30000;     // who didn't ping in 30s => offline
  const PING_EVERY = 3000; // ping every 3s

  const clientId =
    localStorage.getItem('client_id') || (localStorage.setItem('client_id', crypto.randomUUID()), localStorage.getItem('client_id'));

  async function ghFetch(url, opts = {}) {
    const headers = {
      'Accept': 'application/vnd.github+json',
      ...(opts.headers || {})
    };
    if (TOKEN && TOKEN !== 'YOUR_GITHUB_TOKEN') headers['Authorization'] = `Bearer ${TOKEN}`;
    return fetch(url, { ...opts, headers });
  }

  async function readGist(gistId) {
    const res = await ghFetch(`https://api.github.com/gists/${gistId}`);
    if (!res.ok) throw new Error('Gist read failed');
    const data = await res.json();
    const content = data.files?.[FILE]?.content || `{"v":1,"users":{}}`;
    return JSON.parse(content);
  }

  async function writeGist(gistId, obj) {
    const res = await ghFetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(obj) } } })
    });
    if (!res.ok) throw new Error('Gist write failed');
  }

  function render(n) {
    const el = document.getElementById('online-count');
    if (el) el.textContent = String(n);
  }

  async function ping() {
    const gistId = localStorage.getItem('gh_gist_id') || DEFAULT_GIST;
    if (!gistId || gistId === 'YOUR_GIST_ID') {
      // no gist configured вЂ” fallback to fake counter
      return;
    }

    try {
      const now = Date.now();
      const state = await readGist(gistId);
      state.v = 1;
      state.users = state.users || {};

      // update self
      state.users[clientId] = now;

      // cleanup
      for (const [k, t] of Object.entries(state.users)) {
        if (now - Number(t) > TTL_MS) delete state.users[k];
      }

      // write back (requires TOKEN with gist write permission)
      await writeGist(gistId, state);

      render(Object.keys(state.users).length);
    } catch (e) {
      // silent: if no token or network error, show 0
      render(0);
      // console.debug('Gist online error', e);
    }
  }

  // initial ping and timer
  ping();
  const t = setInterval(ping, PING_EVERY);
  window.addEventListener('beforeunload', () => clearInterval(t));

  // expose ping and simple setter for manual calls
  window.gistOnlinePing = ping;
  window.gistOnlineSet = function (gistId, token) {
    if (!gistId) {
      localStorage.removeItem('gh_gist_id');
      localStorage.removeItem('gh_gist_token');
      return;
    }
    localStorage.setItem('gh_gist_id', gistId);
    if (token) localStorage.setItem('gh_gist_token', token);
    else localStorage.removeItem('gh_gist_token');
    try { ping(); } catch (e) { /* ignore */ }
  };

  // Quick console instructions (token optional; if present will be used automatically)
  console.info('Gist online counter loaded. To enable real gist-based counter:' +
    '\n1) Create a public or secret gist containing file "online.json" with { "v":1, "users": {} }' +
    '\n2) save gist id in localStorage: localStorage.setItem("gh_gist_id","<GIST_ID>")' +
    '\nOptionally you can store a token (Gists: Read/Write) in localStorage: localStorage.setItem("gh_gist_token","<TOKEN>")' +
    '\nThe counter will attempt to PATCH the gist automatically every ~3s if configured.');
})();

// Expose helper to open a quick prompt-based setup from UI
(function exposeGistHelpers() {
  function openSetupPrompt() {
    const currentGist = localStorage.getItem('gh_gist_id') || '';
    const gist = prompt('Р’РІРµРґС–С‚СЊ Gist ID РґР»СЏ online.json (РїРѕСЂРѕР¶РЅСЊРѕ вЂ” РІС–РґРєР»СЋС‡РёС‚Рё):', currentGist);
    if (gist === null) return; // cancelled
    if (gist.trim() === '') {
      localStorage.removeItem('gh_gist_id');
      // keep token if previously set (optional)
      alert('Gist РІС–РґРєР»СЋС‡РµРЅРѕ. Р›С–С‡РёР»СЊРЅРёРє РїРѕРІРµСЂРЅРµС‚СЊСЃСЏ РґРѕ Р»РѕРєР°Р»СЊРЅРѕРіРѕ СЂРµР¶РёРјСѓ.');
      return;
    }
    localStorage.setItem('gh_gist_id', gist.trim());
    alert('Gist ID Р·Р±РµСЂРµР¶РµРЅРѕ. РЇРєС‰Рѕ РІ localStorage С” С‚РѕРєРµРЅ вЂ” РІС–РЅ Р±СѓРґРµ РІРёРєРѕСЂРёСЃС‚Р°РЅРёР№ Р°РІС‚РѕРјР°С‚РёС‡РЅРѕ.');

    // try to trigger immediate ping if available
    if (window.gistOnlinePing) try { window.gistOnlinePing(); } catch (e) { /* ignore */ }
  }

  // attach to window for direct calls
  window.openGistSetup = openSetupPrompt;

  // wire UI button if exists
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('#gist-setup');
    if (!btn) return;
    e.preventDefault();
    openSetupPrompt();
  });
})();


