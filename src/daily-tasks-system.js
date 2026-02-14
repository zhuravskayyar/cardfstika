import { listDuelLeagues } from "./core/leagues.js";
import { getArenaState } from "./core/arena-leagues.js";
import {
  addItem,
  addArtifact,
  EQUIPMENT_ELEMENTS,
  EQUIPMENT_ITEM_SLOTS,
  ARTIFACT_TYPES,
  RARITY_ORDER,
} from "./core/equipment-system.js";
import { CARD_BELONGS_TO, decorateCard, ensureCardCatalogLoaded } from "./core/card.js";

const STORAGE_KEY = "cardastika:dailyTasks:state";
const STORAGE_VERSION = 2;

const LEGACY_PROGRESS_KEY = "cardastika:tasks:progress";
const DRAGON_HP_BONUS_KEY = "cardastika:dragonHpBonus";
const GUILD_CARD_PROGRESS_KEY = "cardastika:guild:cardBoostProgress";

const ARENA_TASKS_UNLOCK_RATING = 2000;

const TITLE_ARENA_CHAMPION_ALIASES = new Set([
  "arenachampion",
  "arena_champion",
  "championarena",
  "championareny",
  "champion_areny",
  "чемпионарены",
  "чемпіонарени",
]);

const TASKS = Object.freeze({
  t_win_duel_20: {
    id: "t_win_duel_20",
    title: "Виграйте 20 дуелей",
    target: 20,
    href: "../duel/duel.html",
    goLabel: "Дуелі",
    rewards: { diamonds: 1, gold: 0, items: 1, cards: 0 },
  },
  t_play_duel_30: {
    id: "t_play_duel_30",
    title: "Проведіть 30 дуелей",
    target: 30,
    href: "../duel/duel.html",
    goLabel: "Дуелі",
    rewards: { diamonds: 1, gold: 0, items: 1, cards: 0 },
  },
  t_arena_play_10: {
    id: "t_arena_play_10",
    title: "Візьміть участь у боях на арені",
    target: (ctx) => (ctx.isArenaChampion ? 8 : 10),
    href: "../arena/arena.html",
    goLabel: "Арена",
    rewards: { diamonds: 3, gold: 0, items: 1, cards: 0 },
  },
  t_campaign_cards_3: {
    id: "t_campaign_cards_3",
    title: "Здобудьте 3 карти в кампанії",
    target: 3,
    href: "../campaign/campaign.html",
    goLabel: "Кампанія",
    rewards: { diamonds: 1, gold: 0, items: 1, cards: 0 },
  },
  t_upgrade_battle_1: {
    id: "t_upgrade_battle_1",
    title: "Покращте бойову карту 1 раз",
    target: 1,
    href: "../deck/deck.html",
    goLabel: "Бойова колода",
    rewards: { diamonds: 1, gold: 0, items: 1, cards: 0 },
  },
  t_arena_win_5: {
    id: "t_arena_win_5",
    title: "Виграйте бої на арені",
    target: (ctx) => (ctx.isArenaChampion ? 3 : 5),
    href: "../arena/arena.html",
    goLabel: "Арена",
    rewards: { diamonds: 0, gold: 0, items: 1, cards: 1 },
  },
  t_buy_gold_200: {
    id: "t_buy_gold_200",
    title: "Купіть 200 золота",
    target: 1,
    href: "../shop/buy-gold.html",
    goLabel: "Купити золото",
    rewards: { diamonds: 20, gold: 0, items: 1, cards: 0 },
    extraLines: [
      "+2 участі в задачі на арену",
      "+1 перемога в задачі на арену",
      "+80 HP дракона",
    ],
  },
  t_buy_gold_1000: {
    id: "t_buy_gold_1000",
    title: "Купіть 1000 золота",
    target: 1,
    href: "../shop/buy-gold.html",
    goLabel: "Купити золото",
    rewards: { diamonds: 50, gold: 0, items: 1, cards: 0 },
    guaranteedRareItem: true,
    extraLines: [
      "+6 участей в задачі на арену",
      "+3 перемоги в задачі на арену",
      "+320 HP дракона",
      "1 річ гарантовано рідкісна або вище",
    ],
  },
  t_buy_cards_5: {
    id: "t_buy_cards_5",
    title: "Купіть 5 карт",
    target: 5,
    href: "../shop/shop.html",
    goLabel: "Крамниця",
    rewards: { diamonds: 2, gold: 0, items: 1, cards: 0 },
  },
  t_absorb_cards_10: {
    id: "t_absorb_cards_10",
    title: "Поглиніть 10 карт",
    target: 10,
    href: "../deck/deck.html",
    goLabel: "Бойова колода",
    rewards: { diamonds: 1, gold: 0, items: 1, cards: 0 },
  },
});

const TASK_ORDER_ARENA = Object.freeze([
  "t_win_duel_20",
  "t_play_duel_30",
  "t_arena_play_10",
  "t_campaign_cards_3",
  "t_upgrade_battle_1",
  "t_arena_win_5",
  "t_buy_gold_200",
  "t_buy_gold_1000",
]);

const TASK_ORDER_PRE_ARENA = Object.freeze([
  "t_win_duel_20",
  "t_play_duel_30",
  "t_buy_cards_5",
  "t_campaign_cards_3",
  "t_upgrade_battle_1",
  "t_absorb_cards_10",
  "t_buy_gold_200",
  "t_buy_gold_1000",
]);

const QUALITY_ORDER = Object.freeze(["common", "uncommon", "rare", "epic", "legendary", "mythic"]);
const RARITY_CLASS_BY_QUALITY = Object.freeze({
  common: "rarity-1",
  uncommon: "rarity-2",
  rare: "rarity-3",
  epic: "rarity-4",
  legendary: "rarity-5",
  mythic: "rarity-6",
});

let cardsCatalogPromise = null;
let levelPowerMapPromise = null;

const DUEL_LEAGUE_MIN_BY_ID = (() => {
  const out = new Map();
  try {
    const leagues = listDuelLeagues();
    for (const l of leagues) {
      out.set(String(l?.id || ""), Math.max(0, asInt(l?.minRating, 0)));
    }
  } catch {
    // ignore
  }
  return out;
})();

function rootPrefix() {
  const inPages = location.pathname.toLowerCase().includes("/pages/");
  return inPages ? "../../" : "./";
}

function asInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randomInt(min, max) {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function pickRandom(list) {
  return Array.isArray(list) && list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

function safeParse(raw, fallback = null) {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function readJson(key, fallback = null) {
  try {
    return safeParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function dayKeyFromTs(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDayKey(dayKey) {
  const m = String(dayKey || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const date = new Date(y, mo, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
  return date;
}

function addDays(dayKey, delta) {
  const d = parseDayKey(dayKey);
  if (!d) return dayKeyFromTs();
  d.setDate(d.getDate() + delta);
  return dayKeyFromTs(d.getTime());
}

function previousDayKey(dayKey) {
  return addDays(dayKey, -1);
}

function getWeekdayFromDayKey(dayKey) {
  const d = parseDayKey(dayKey);
  return d ? d.getDay() : new Date().getDay();
}

function isMarathonDay(dayKey) {
  const wd = getWeekdayFromDayKey(dayKey);
  return wd >= 1 && wd <= 5;
}

function weekKeyFromDayKey(dayKey) {
  const date = parseDayKey(dayKey) || new Date();
  const d = new Date(date);
  const weekday = d.getDay();
  const shift = weekday === 0 ? -6 : 1 - weekday;
  d.setDate(d.getDate() + shift);
  const y = d.getFullYear();
  const start = new Date(y, 0, 1);
  const dayOfYear = Math.floor((d - start) / (24 * 60 * 60 * 1000)) + 1;
  const weekNo = Math.floor((dayOfYear - 1) / 7) + 1;
  return `${y}-W${pad2(weekNo)}`;
}

function normalizeQuality(raw) {
  const s = String(raw || "").toLowerCase().trim();
  return QUALITY_ORDER.includes(s) ? s : "common";
}

function qualityRank(q) {
  return QUALITY_ORDER.indexOf(normalizeQuality(q));
}

function normalizeTitleKey(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
}

function hasArenaChampionTitle() {
  const titles = [];
  try {
    const st = window.ProgressionSystem?.getState?.();
    if (Array.isArray(st?.titles)) titles.push(...st.titles);
  } catch {
    // ignore
  }
  try {
    const acc = window.AccountSystem?.getActive?.();
    if (Array.isArray(acc?.titles)) titles.push(...acc.titles);
  } catch {
    // ignore
  }
  for (const t of titles) {
    if (TITLE_ARENA_CHAMPION_ALIASES.has(normalizeTitleKey(t))) return true;
  }
  return false;
}

function getDuelRatingNow() {
  try {
    const st = window.ProgressionSystem?.getState?.();
    const r = asInt(st?.duel?.rating, NaN);
    if (Number.isFinite(r)) return Math.max(0, r);
    const leagueId = String(st?.league?.id || "");
    if (leagueId && DUEL_LEAGUE_MIN_BY_ID.has(leagueId)) return DUEL_LEAGUE_MIN_BY_ID.get(leagueId);
  } catch {
    // ignore
  }
  try {
    const acc = window.AccountSystem?.getActive?.();
    const r = asInt(acc?.duel?.rating, NaN);
    if (Number.isFinite(r)) return Math.max(0, r);
    const leagueId = String(acc?.duelLeagueId || "");
    if (leagueId && DUEL_LEAGUE_MIN_BY_ID.has(leagueId)) return DUEL_LEAGUE_MIN_BY_ID.get(leagueId);
  } catch {
    // ignore
  }
  return 0;
}

function isGuildMember() {
  try {
    const acc = window.AccountSystem?.getActive?.();
    if (acc?.guildMember === true) return true;
    if (acc?.guild?.isMember === true || acc?.guild?.member === true) return true;
  } catch {
    // ignore
  }
  try {
    const raw = String(localStorage.getItem("cardastika:guild:isMember") || "").toLowerCase();
    if (raw === "1" || raw === "true") return true;
  } catch {
    // ignore
  }
  return false;
}

function multiplierForTomorrowFromClaims(claimsCount) {
  const claims = Math.max(0, asInt(claimsCount, 0));
  if (claims >= 7) return 3;
  if (claims >= 6) return 2;
  return 1;
}

function createTaskRuntimeState() {
  const out = {};
  for (const taskId of Object.keys(TASKS)) {
    out[taskId] = { progress: 0, spent: 0, claims: 0 };
  }
  return out;
}

function createDefaultState(now = Date.now()) {
  const dayKey = dayKeyFromTs(now);
  const dragonHpBonus = Math.max(0, asInt(localStorage.getItem(DRAGON_HP_BONUS_KEY), 0));
  const guildCardProgress = Math.max(0, asInt(localStorage.getItem(GUILD_CARD_PROGRESS_KEY), 0));
  return {
    v: STORAGE_VERSION,
    createdAt: now,
    updatedAt: now,
    arenaUnlocked: false,
    day: {
      key: dayKey,
      multiplier: 1,
      claimsCount: 0,
      claimedTaskIds: [],
    },
    tasks: createTaskRuntimeState(),
    guild: {
      cardBoostProgress: guildCardProgress,
      totalClaims: 0,
    },
    marathon: {
      weekKey: weekKeyFromDayKey(dayKey),
      weekDiamonds: 0,
      totalDiamonds: 0,
    },
    login: {
      lastClaimDay: "",
      streak: 0,
      totalClaims: 0,
    },
    dragonHpBonus,
  };
}

function normalizeTaskRuntimeState(rawTasks) {
  const src = rawTasks && typeof rawTasks === "object" ? rawTasks : {};
  const out = createTaskRuntimeState();
  for (const taskId of Object.keys(out)) {
    const srcTask = src[taskId] && typeof src[taskId] === "object" ? src[taskId] : {};
    out[taskId] = {
      progress: Math.max(0, asInt(srcTask.progress, 0)),
      spent: Math.max(0, asInt(srcTask.spent, 0)),
      claims: Math.max(0, asInt(srcTask.claims, 0)),
    };
    if (out[taskId].spent > out[taskId].progress) out[taskId].spent = out[taskId].progress;
  }
  return out;
}

function normalizeState(rawState) {
  const now = Date.now();
  const src = rawState && typeof rawState === "object" ? rawState : {};
  const base = createDefaultState(now);

  const dayRaw = src.day && typeof src.day === "object" ? src.day : {};
  const dayKey = parseDayKey(dayRaw.key) ? dayRaw.key : base.day.key;

  const state = {
    v: asInt(src.v, STORAGE_VERSION),
    createdAt: asInt(src.createdAt, now),
    updatedAt: asInt(src.updatedAt, now),
    arenaUnlocked: !!src.arenaUnlocked,
    day: {
      key: dayKey,
      multiplier: clamp(asInt(dayRaw.multiplier, 1), 1, 3),
      claimsCount: Math.max(0, asInt(dayRaw.claimsCount, 0)),
      claimedTaskIds: Array.isArray(dayRaw.claimedTaskIds)
        ? Array.from(new Set(dayRaw.claimedTaskIds.map(String)))
        : [],
    },
    tasks: normalizeTaskRuntimeState(src.tasks),
    guild: {
      cardBoostProgress: Math.max(0, asInt(src?.guild?.cardBoostProgress, base.guild.cardBoostProgress)),
      totalClaims: Math.max(0, asInt(src?.guild?.totalClaims, 0)),
    },
    marathon: {
      weekKey: String(src?.marathon?.weekKey || weekKeyFromDayKey(dayKey)),
      weekDiamonds: Math.max(0, asInt(src?.marathon?.weekDiamonds, 0)),
      totalDiamonds: Math.max(0, asInt(src?.marathon?.totalDiamonds, 0)),
    },
    login: {
      lastClaimDay: parseDayKey(src?.login?.lastClaimDay) ? String(src.login.lastClaimDay) : "",
      streak: Math.max(0, asInt(src?.login?.streak, 0)),
      totalClaims: Math.max(0, asInt(src?.login?.totalClaims, 0)),
    },
    dragonHpBonus: Math.max(0, asInt(src.dragonHpBonus, base.dragonHpBonus)),
  };

  for (const taskId of state.day.claimedTaskIds.slice()) {
    if (!TASKS[taskId]) {
      state.day.claimedTaskIds = state.day.claimedTaskIds.filter((id) => id !== taskId);
    }
  }

  return state;
}

function migrateLegacyProgress(state) {
  const legacy = readJson(LEGACY_PROGRESS_KEY, null);
  if (!legacy || typeof legacy !== "object") return state;

  const next = normalizeState(state);
  const map = {
    t_win_duel_20: "t_win_duel_20",
    t_play_duel_30: "t_play_duel_30",
    t_campaign_cards_3: "t_campaign_cards_3",
    t_upgrade_battle_1: "t_upgrade_battle_1",
    t_buy_cards_5: "t_buy_cards_5",
    t_absorb_cards_10: "t_absorb_cards_10",
    t_buy_gold_200: "t_buy_gold_200",
    t_buy_gold_1000: "t_buy_gold_1000",
    t_arena_play_10: "t_arena_play_10",
    t_arena_win_5: "t_arena_win_5",
  };

  for (const [legacyId, value] of Object.entries(legacy)) {
    const taskId = map[legacyId];
    if (!taskId || !next.tasks[taskId]) continue;
    const raw = Math.max(0, asInt(value, 0));
    let progress = raw;
    if (taskId === "t_buy_gold_200") progress = Math.floor(raw / 200);
    if (taskId === "t_buy_gold_1000") progress = Math.floor(raw / 1000);
    if (progress > next.tasks[taskId].progress) next.tasks[taskId].progress = progress;
  }

  return next;
}

function ensureMarathonWeek(state) {
  const weekKey = weekKeyFromDayKey(state.day.key);
  if (state.marathon.weekKey !== weekKey) {
    state.marathon.weekKey = weekKey;
    state.marathon.weekDiamonds = 0;
    return true;
  }
  return false;
}

function rollForwardDay(state, nowTs = Date.now()) {
  let changed = false;
  const todayKey = dayKeyFromTs(nowTs);
  if (state.day.key === todayKey) return changed;

  let guard = 0;
  while (state.day.key !== todayKey && guard < 4000) {
    guard += 1;
    const nextMultiplier = multiplierForTomorrowFromClaims(state.day.claimsCount);
    const nextDayKey = addDays(state.day.key, 1);
    state.day = {
      key: nextDayKey,
      multiplier: nextMultiplier,
      claimsCount: 0,
      claimedTaskIds: [],
    };
    changed = true;
    ensureMarathonWeek(state);
  }

  if (state.day.key !== todayKey) {
    state.day = {
      key: todayKey,
      multiplier: 1,
      claimsCount: 0,
      claimedTaskIds: [],
    };
    changed = true;
  }

  return changed;
}

function maybeUnlockArenaTasks(state) {
  if (state.arenaUnlocked) return false;
  const rating = getDuelRatingNow();
  if (rating < ARENA_TASKS_UNLOCK_RATING) return false;
  state.arenaUnlocked = true;
  return true;
}

function syncMirrors(state) {
  try {
    localStorage.setItem(DRAGON_HP_BONUS_KEY, String(Math.max(0, asInt(state.dragonHpBonus, 0))));
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(GUILD_CARD_PROGRESS_KEY, String(Math.max(0, asInt(state?.guild?.cardBoostProgress, 0))));
  } catch {
    // ignore
  }
}

function saveState(state) {
  const normalized = normalizeState(state);
  normalized.v = STORAGE_VERSION;
  normalized.updatedAt = Date.now();
  writeJson(STORAGE_KEY, normalized);
  syncMirrors(normalized);
  return normalized;
}

function readState() {
  const raw = readJson(STORAGE_KEY, null);
  const hasSavedState = !!raw;
  let state = normalizeState(raw);

  if (!hasSavedState) {
    state = migrateLegacyProgress(state);
  }

  let changed = false;
  if (rollForwardDay(state)) changed = true;
  if (ensureMarathonWeek(state)) changed = true;
  if (maybeUnlockArenaTasks(state)) changed = true;

  if (changed || !hasSavedState) {
    state = saveState(state);
  }
  return state;
}

function getActiveTaskIds(state) {
  return state.arenaUnlocked ? TASK_ORDER_ARENA.slice() : TASK_ORDER_PRE_ARENA.slice();
}

function createContext(state) {
  return {
    state,
    isArenaChampion: hasArenaChampionTitle(),
  };
}

function getTaskTarget(taskId, ctx) {
  const def = TASKS[taskId];
  if (!def) return 1;
  const raw = typeof def.target === "function" ? def.target(ctx) : def.target;
  return Math.max(1, asInt(raw, 1));
}

function getTaskRewardsPreview(taskId, multiplier) {
  const def = TASKS[taskId];
  const mul = clamp(asInt(multiplier, 1), 1, 3);
  if (!def) return { diamonds: 0, gold: 0, items: 0, cards: 0, multiplier: mul };

  const rewards = def.rewards || {};
  return {
    multiplier: mul,
    diamonds: Math.max(0, asInt(rewards.diamonds, 0) * mul),
    gold: Math.max(0, asInt(rewards.gold, 0) * mul),
    items: Math.max(0, asInt(rewards.items, 0) * mul),
    cards: Math.max(0, asInt(rewards.cards, 0) * mul),
    guaranteedRareItem: !!def.guaranteedRareItem,
  };
}

function getTaskProgressModel(taskId, state, ctx) {
  const taskState = state.tasks[taskId] || { progress: 0, spent: 0, claims: 0 };
  const target = getTaskTarget(taskId, ctx);

  const progressTotal = Math.max(0, asInt(taskState.progress, 0));
  const spentTotal = Math.max(0, asInt(taskState.spent, 0));
  const claimsTotal = Math.max(0, asInt(taskState.claims, 0));
  const effective = Math.max(0, progressTotal - spentTotal);

  const pendingClaims = Math.floor(effective / target);
  const progressCurrent = pendingClaims > 0 ? target : (effective % target);
  const progressPercent = target > 0 ? clamp(Math.round((progressCurrent / target) * 100), 0, 100) : 0;
  const claimedToday = state.day.claimedTaskIds.includes(taskId);
  const canClaim = pendingClaims > 0 && !claimedToday;

  return {
    progressTotal,
    spentTotal,
    claimsTotal,
    effectiveProgress: effective,
    target,
    pendingClaims,
    progressCurrent,
    progressPercent,
    claimedToday,
    canClaim,
  };
}

function computeLoginReward(streakValue) {
  const streak = Math.max(1, asInt(streakValue, 1));
  const gold = 25 + Math.min(75, (streak - 1) * 5);
  const diamonds = streak % 7 === 0 ? 3 : 1;
  const items = streak % 3 === 0 ? 1 : 0;
  return { streak, gold, diamonds, items };
}

function getLoginRewardStatusFromState(state) {
  const today = state.day.key;
  const last = String(state?.login?.lastClaimDay || "");
  const canClaim = last !== today;
  const streak = Math.max(0, asInt(state?.login?.streak, 0));
  const nextStreak = canClaim
    ? (last === previousDayKey(today) ? streak + 1 : 1)
    : streak;
  return {
    canClaim,
    lastClaimDay: last,
    streak,
    preview: computeLoginReward(nextStreak),
  };
}

function grantCurrency({ gold = 0, diamonds = 0 } = {}) {
  const addGold = Math.max(0, asInt(gold, 0));
  const addDiamonds = Math.max(0, asInt(diamonds, 0));
  if (addGold <= 0 && addDiamonds <= 0) return;

  const acc = window.AccountSystem?.getActive?.() || null;
  if (acc && window.AccountSystem?.updateActive) {
    try {
      window.AccountSystem.updateActive((a) => {
        a.gold = Math.max(0, asInt(a.gold, 0) + addGold);
        a.diamonds = Math.max(0, asInt(a.diamonds, 0) + addDiamonds);
        return null;
      });
      return;
    } catch {
      // fallback below
    }
  }

  if (addGold > 0) {
    const cur = Math.max(0, asInt(localStorage.getItem("cardastika:gold"), 0));
    localStorage.setItem("cardastika:gold", String(cur + addGold));
  }
  if (addDiamonds > 0) {
    const cur = Math.max(0, asInt(localStorage.getItem("cardastika:diamonds"), 0));
    localStorage.setItem("cardastika:diamonds", String(cur + addDiamonds));
  }
}

function storeRewardCard(card) {
  if (!card || typeof card !== "object") return;
  const prepared = { ...card, inDeck: false, belongsTo: CARD_BELONGS_TO.shop };

  const acc = window.AccountSystem?.getActive?.() || null;
  if (acc && window.AccountSystem?.updateActive) {
    try {
      window.AccountSystem.updateActive((a) => {
        if (!Array.isArray(a.inventory)) a.inventory = [];
        a.inventory.push(prepared);
        return null;
      });
      return;
    } catch {
      // fallback below
    }
  }

  let inv = [];
  try {
    inv = safeParse(localStorage.getItem("cardastika:inventory"), []);
    if (!Array.isArray(inv)) inv = [];
  } catch {
    inv = [];
  }
  inv.push(prepared);
  localStorage.setItem("cardastika:inventory", JSON.stringify(inv));
}

function randomRarity(minRank = 0) {
  const safeRank = clamp(asInt(minRank, 0), 0, RARITY_ORDER.length - 1);
  const weighted = [
    { id: "common", w: 45 },
    { id: "uncommon", w: 28 },
    { id: "rare", w: 14 },
    { id: "epic", w: 7 },
    { id: "legendary", w: 4 },
    { id: "mythic", w: 2 },
  ].filter((x) => RARITY_ORDER.indexOf(x.id) >= safeRank);

  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  if (total <= 0) return RARITY_ORDER[safeRank] || "common";

  let roll = Math.random() * total;
  for (const row of weighted) {
    roll -= row.w;
    if (roll <= 0) return row.id;
  }
  return weighted[weighted.length - 1].id;
}

function grantRandomEquipmentRewards(count, opts = {}) {
  const amount = Math.max(0, asInt(count, 0));
  const source = String(opts.source || "daily_reward");
  const guaranteedRareCount = Math.max(0, asInt(opts.guaranteedRareCount, 0));
  const out = [];

  for (let i = 0; i < amount; i += 1) {
    const minRank = i < guaranteedRareCount ? 2 : 0;
    const rarity = randomRarity(minRank);
    const asArtifact = Math.random() < 0.32;

    if (asArtifact) {
      const payload = {
        artifactType: pickRandom(ARTIFACT_TYPES) || "spear",
        rarity,
      };
      const res = addArtifact(payload, { source });
      out.push({
        kind: "artifact",
        ok: !!res?.ok,
        rarity,
        artifactType: payload.artifactType,
        data: res?.artifact || null,
        reason: res?.reason || "",
      });
    } else {
      const payload = {
        slot: pickRandom(EQUIPMENT_ITEM_SLOTS) || "hat",
        element: pickRandom(EQUIPMENT_ELEMENTS) || "earth",
        rarity,
      };
      const res = addItem(payload, { source });
      out.push({
        kind: "item",
        ok: !!res?.ok,
        rarity,
        slot: payload.slot,
        element: payload.element,
        data: res?.item || null,
        reason: res?.reason || "",
      });
    }
  }

  return out;
}

async function loadCardsCatalog() {
  if (cardsCatalogPromise) return cardsCatalogPromise;
  cardsCatalogPromise = (async () => {
    const url = `${rootPrefix()}data/cards.json`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`cards.json fetch failed: ${r.status}`);
    const json = await r.json();
    const cards = Array.isArray(json?.cards) ? json.cards : [];
    return cards.filter((c) => c && typeof c === "object" && String(c.id || "").trim());
  })();
  return cardsCatalogPromise;
}

async function loadLevelPowerMap() {
  if (levelPowerMapPromise) return levelPowerMapPromise;
  levelPowerMapPromise = (async () => {
    const url = `${rootPrefix()}data/cardLevels.json`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`cardLevels.json fetch failed: ${r.status}`);
    const json = await r.json();
    const levels = Array.isArray(json?.cardLevels?.levels) ? json.cardLevels.levels : [];
    const byLevel = new Map();
    for (const row of levels) {
      const lvl = asInt(row?.level, 0);
      const basePower = asInt(row?.basePower, 0);
      if (lvl > 0 && basePower > 0) byLevel.set(lvl, basePower);
    }
    return byLevel;
  })();
  return levelPowerMapPromise;
}

function arenaCardProfileByRating(arenaRating) {
  const r = Math.max(0, asInt(arenaRating, 1400));
  if (r < 1800) return { minQuality: "epic", levelRange: [20, 24] };
  if (r < 2200) return { minQuality: "epic", levelRange: [24, 29] };
  if (r < 2600) return { minQuality: "legendary", levelRange: [25, 33] };
  if (r < 3000) return { minQuality: "legendary", levelRange: [35, 42] };
  if (r < 3400) return { minQuality: "legendary", levelRange: [44, 56] };
  if (r < 3800) return { minQuality: "mythic", levelRange: [60, 63] };
  return { minQuality: "mythic", levelRange: [70, 74] };
}

function makeUid(prefix = "daily") {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function resolvePowerByLevel(level, powerMap) {
  const lvl = Math.max(1, asInt(level, 1));
  if (powerMap?.has(lvl)) return powerMap.get(lvl);
  for (let down = lvl - 1; down >= 1; down -= 1) {
    if (powerMap?.has(down)) return powerMap.get(down);
  }
  return Math.max(1, Math.round(lvl * 3.6));
}

async function grantArenaTaskCards(count) {
  const amount = Math.max(0, asInt(count, 0));
  if (amount <= 0) return [];

  const arenaRating = Math.max(0, asInt(getArenaState()?.rating, 1400));
  const profile = arenaCardProfileByRating(arenaRating);
  const minRank = qualityRank(profile.minQuality);

  const [catalog, powerMap] = await Promise.all([loadCardsCatalog(), loadLevelPowerMap()]);
  await ensureCardCatalogLoaded();

  const eligible = catalog.filter((c) => {
    const id = String(c?.id || "");
    if (!id || id.startsWith("starter_") || id.startsWith("source_") || id.startsWith("boss_")) return false;
    return qualityRank(c?.rarity) >= minRank;
  });
  const pool = eligible.length ? eligible : catalog;

  const out = [];
  for (let i = 0; i < amount; i += 1) {
    const base = pickRandom(pool);
    if (!base) continue;

    const minLevel = Math.max(1, asInt(profile.levelRange?.[0], 20));
    const maxLevel = Math.max(minLevel, asInt(profile.levelRange?.[1], minLevel));
    const level = randomInt(minLevel, maxLevel);
    const power = Math.max(1, asInt(resolvePowerByLevel(level, powerMap), 1));
    const quality = normalizeQuality(base.rarity);

    const decorated = decorateCard(
      {
        uid: makeUid("daily_card"),
        id: String(base.id),
        title: String(base.title || base.name || base.id),
        name: String(base.title || base.name || base.id),
        element: String(base.element || "earth"),
        level,
        power,
        basePower: power,
        bonusFixed: 0,
        elementsStored: 0.01,
        protected: false,
        inDeck: false,
        quality,
        rarity: RARITY_CLASS_BY_QUALITY[quality] || "rarity-4",
        artFile: String(base.artFile || base.id || ""),
        source: "daily_task:arena_win",
      },
      CARD_BELONGS_TO.shop,
    );

    storeRewardCard(decorated);
    out.push({
      id: decorated.id,
      title: decorated.title || decorated.name || decorated.id,
      level: decorated.level,
      rarity: decorated.rarity,
      element: decorated.element,
      art: decorated.art || "",
    });
  }
  return out;
}

function incrementTaskProgressInState(state, taskId, amount = 1) {
  if (!TASKS[taskId]) return false;
  const delta = Math.max(0, asInt(amount, 0));
  if (delta <= 0) return false;
  const taskState = state.tasks[taskId] || { progress: 0, spent: 0, claims: 0 };
  taskState.progress = Math.max(0, asInt(taskState.progress, 0) + delta);
  taskState.spent = Math.min(taskState.progress, Math.max(0, asInt(taskState.spent, 0)));
  taskState.claims = Math.max(0, asInt(taskState.claims, 0));
  state.tasks[taskId] = taskState;
  return true;
}

function getSnapshotFromState(state) {
  const ctx = createContext(state);
  const taskIds = getActiveTaskIds(state);
  const tasks = taskIds.map((taskId) => {
    const def = TASKS[taskId];
    const model = getTaskProgressModel(taskId, state, ctx);
    return {
      id: taskId,
      title: def.title,
      href: def.href,
      goLabel: def.goLabel,
      extraLines: Array.isArray(def.extraLines) ? def.extraLines.slice() : [],
      target: model.target,
      progressCurrent: model.progressCurrent,
      progressPercent: model.progressPercent,
      pendingClaims: model.pendingClaims,
      claimsTotal: model.claimsTotal,
      claimedToday: model.claimedToday,
      canClaim: model.canClaim,
      rewards: getTaskRewardsPreview(taskId, state.day.multiplier),
    };
  });

  const claimsToday = Math.max(0, asInt(state.day.claimsCount, 0));
  return {
    dayKey: state.day.key,
    rewardMultiplier: state.day.multiplier,
    nextDayMultiplier: multiplierForTomorrowFromClaims(claimsToday),
    claimsToday,
    claimsToDouble: Math.max(0, 6 - claimsToday),
    claimsToTriple: Math.max(0, 7 - claimsToday),
    isArenaTasksMode: !!state.arenaUnlocked,
    isArenaChampion: hasArenaChampionTitle(),
    tasks,
    availableClaims: tasks.filter((t) => t.canClaim).length,
    guild: {
      isMember: isGuildMember(),
      cardBoostProgress: Math.max(0, asInt(state?.guild?.cardBoostProgress, 0)),
      totalClaims: Math.max(0, asInt(state?.guild?.totalClaims, 0)),
    },
    marathon: {
      weekKey: state.marathon.weekKey,
      weekDiamonds: Math.max(0, asInt(state.marathon.weekDiamonds, 0)),
      totalDiamonds: Math.max(0, asInt(state.marathon.totalDiamonds, 0)),
      isActiveDay: isMarathonDay(state.day.key),
    },
    dragonHpBonus: Math.max(0, asInt(state.dragonHpBonus, 0)),
    loginReward: getLoginRewardStatusFromState(state),
  };
}

async function grantTaskRewards(taskId, state) {
  const preview = getTaskRewardsPreview(taskId, state.day.multiplier);
  const out = {
    taskId,
    multiplier: preview.multiplier,
    diamonds: preview.diamonds,
    gold: preview.gold,
    marathonDiamonds: 0,
    items: [],
    cards: [],
  };

  if (preview.gold > 0 || preview.diamonds > 0) {
    grantCurrency({ gold: preview.gold, diamonds: preview.diamonds });
  }

  if (preview.items > 0) {
    const guaranteedRareCount = TASKS[taskId]?.guaranteedRareItem ? 1 : 0;
    out.items = grantRandomEquipmentRewards(preview.items, {
      source: "daily_reward",
      guaranteedRareCount,
    });
  }

  if (preview.cards > 0) {
    out.cards = await grantArenaTaskCards(preview.cards);
  }

  if (isMarathonDay(state.day.key)) {
    const base = randomInt(1, 3);
    const marathonDiamonds = Math.max(1, base * preview.multiplier);
    out.marathonDiamonds = marathonDiamonds;
    grantCurrency({ diamonds: marathonDiamonds });
    state.marathon.weekDiamonds = Math.max(0, asInt(state.marathon.weekDiamonds, 0) + marathonDiamonds);
    state.marathon.totalDiamonds = Math.max(0, asInt(state.marathon.totalDiamonds, 0) + marathonDiamonds);
  }

  return out;
}

function syncGuildProgressToAccount(value) {
  const v = Math.max(0, asInt(value, 0));
  try {
    localStorage.setItem(GUILD_CARD_PROGRESS_KEY, String(v));
  } catch {
    // ignore
  }
  try {
    if (window.AccountSystem?.updateActive && window.AccountSystem?.getActive?.()) {
      window.AccountSystem.updateActive((acc) => {
        if (!acc.guild || typeof acc.guild !== "object") acc.guild = {};
        acc.guild.cardBoostProgress = v;
        return null;
      });
    }
  } catch {
    // ignore
  }
}

function addDragonHpBonusInState(state, bonus) {
  const add = Math.max(0, asInt(bonus, 0));
  if (add <= 0) return 0;
  state.dragonHpBonus = Math.max(0, asInt(state.dragonHpBonus, 0) + add);
  return add;
}

function addProgress(taskId, amount = 1) {
  const state = readState();
  if (!TASKS[taskId]) {
    return { ok: false, reason: "unknown_task", snapshot: getSnapshotFromState(state) };
  }
  if (!incrementTaskProgressInState(state, taskId, amount)) {
    return { ok: false, reason: "invalid_amount", snapshot: getSnapshotFromState(state) };
  }
  const saved = saveState(state);
  return { ok: true, snapshot: getSnapshotFromState(saved) };
}

async function claimTask(taskId) {
  const state = readState();
  const activeTaskIds = getActiveTaskIds(state);
  if (!activeTaskIds.includes(taskId)) {
    return { ok: false, reason: "task_not_active", snapshot: getSnapshotFromState(state) };
  }

  const ctx = createContext(state);
  const model = getTaskProgressModel(taskId, state, ctx);
  if (!model.canClaim) {
    return {
      ok: false,
      reason: model.claimedToday ? "already_claimed_today" : "task_not_ready",
      snapshot: getSnapshotFromState(state),
    };
  }

  const taskState = state.tasks[taskId];
  taskState.spent = Math.min(taskState.progress, taskState.spent + model.target);
  taskState.claims = Math.max(0, asInt(taskState.claims, 0) + 1);
  state.tasks[taskId] = taskState;

  state.day.claimsCount = Math.max(0, asInt(state.day.claimsCount, 0) + 1);
  if (!state.day.claimedTaskIds.includes(taskId)) {
    state.day.claimedTaskIds.push(taskId);
  }

  const reward = await grantTaskRewards(taskId, state);

  if (isGuildMember()) {
    state.guild.cardBoostProgress = Math.max(0, asInt(state.guild.cardBoostProgress, 0) + 1);
    state.guild.totalClaims = Math.max(0, asInt(state.guild.totalClaims, 0) + 1);
    syncGuildProgressToAccount(state.guild.cardBoostProgress);
  }

  const saved = saveState(state);
  return {
    ok: true,
    reward,
    snapshot: getSnapshotFromState(saved),
  };
}

function recordArenaBattle(payload = {}) {
  const won = !!payload.won;
  const count = Math.max(1, asInt(payload.count, 1));
  const state = readState();
  incrementTaskProgressInState(state, "t_arena_play_10", count);
  if (won) incrementTaskProgressInState(state, "t_arena_win_5", count);
  const saved = saveState(state);
  return { ok: true, snapshot: getSnapshotFromState(saved) };
}

function recordGoldPurchase(amount) {
  const goldAmount = Math.max(0, asInt(amount, 0));
  const state = readState();
  const bonus = {
    hpAdded: 0,
    arenaPlaysAdded: 0,
    arenaWinsAdded: 0,
  };

  if (goldAmount === 200) {
    incrementTaskProgressInState(state, "t_buy_gold_200", 1);
    bonus.hpAdded = addDragonHpBonusInState(state, 80);
    if (state.arenaUnlocked) {
      incrementTaskProgressInState(state, "t_arena_play_10", 2);
      incrementTaskProgressInState(state, "t_arena_win_5", 1);
      bonus.arenaPlaysAdded = 2;
      bonus.arenaWinsAdded = 1;
    }
  } else if (goldAmount === 1000) {
    incrementTaskProgressInState(state, "t_buy_gold_1000", 1);
    bonus.hpAdded = addDragonHpBonusInState(state, 320);
    if (state.arenaUnlocked) {
      incrementTaskProgressInState(state, "t_arena_play_10", 6);
      incrementTaskProgressInState(state, "t_arena_win_5", 3);
      bonus.arenaPlaysAdded = 6;
      bonus.arenaWinsAdded = 3;
    }
  }

  const saved = saveState(state);
  return {
    ok: true,
    bonus,
    dragonHpBonus: Math.max(0, asInt(saved.dragonHpBonus, 0)),
    snapshot: getSnapshotFromState(saved),
  };
}

function getDragonHpBonus() {
  const state = readState();
  return Math.max(0, asInt(state.dragonHpBonus, 0));
}

function getLoginRewardStatus() {
  const state = readState();
  return getLoginRewardStatusFromState(state);
}

async function claimLoginReward() {
  const state = readState();
  const status = getLoginRewardStatusFromState(state);
  if (!status.canClaim) {
    return {
      ok: false,
      reason: "already_claimed_today",
      status,
      snapshot: getSnapshotFromState(state),
    };
  }

  const yesterday = previousDayKey(state.day.key);
  const streak = state.login.lastClaimDay === yesterday
    ? Math.max(0, asInt(state.login.streak, 0) + 1)
    : 1;
  const reward = computeLoginReward(streak);

  state.login.streak = streak;
  state.login.lastClaimDay = state.day.key;
  state.login.totalClaims = Math.max(0, asInt(state.login.totalClaims, 0) + 1);

  grantCurrency({ gold: reward.gold, diamonds: reward.diamonds });

  let itemRewards = [];
  if (reward.items > 0) {
    itemRewards = grantRandomEquipmentRewards(reward.items, { source: "daily_reward" });
  }

  const saved = saveState(state);
  return {
    ok: true,
    reward: { ...reward, itemsGranted: itemRewards },
    status: getLoginRewardStatusFromState(saved),
    snapshot: getSnapshotFromState(saved),
  };
}

function getSnapshot() {
  const state = readState();
  return getSnapshotFromState(state);
}

function resetStateForDebug() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  const state = saveState(createDefaultState());
  return getSnapshotFromState(state);
}

export const DailyTasksSystem = {
  getSnapshot,
  getLoginRewardStatus,
  claimLoginReward,
  claimTask,
  addProgress,
  recordArenaBattle,
  recordGoldPurchase,
  getDragonHpBonus,
  resetStateForDebug,

  recordDuelPlayed(count = 1) {
    return addProgress("t_play_duel_30", count);
  },
  recordDuelWin(count = 1) {
    return addProgress("t_win_duel_20", count);
  },
  recordCampaignCards(count = 1) {
    return addProgress("t_campaign_cards_3", count);
  },
  recordCardsBought(count = 1) {
    return addProgress("t_buy_cards_5", count);
  },
  recordCardsAbsorbed(count = 1) {
    return addProgress("t_absorb_cards_10", count);
  },
  recordCardUpgrades(count = 1) {
    return addProgress("t_upgrade_battle_1", count);
  },
};

if (typeof window !== "undefined") {
  window.DailyTasksSystem = DailyTasksSystem;
}

