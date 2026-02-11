// src/progression-system.js
// Global progression: XP/levels, duel leagues, duel rewards (prototype)

import "./account.js";
import { computeLevelUps, getLevelProgressFromTotalXp, MEDAL_LEVELS, PLAYER_MAX_LEVEL } from "./core/experience.js";
import { DUEL_LEAGUE_DEFAULT_ID, getDuelLeague, getDuelLeagueByRating, listDuelLeagues } from "./core/leagues.js";
import { buildFoundSet } from "./collections-core.js";

const TITLE_TOURNAMENT_CHAMPION = "tournamentChampion";
const TITLE_DUEL_CHAMPION = "duelChampion";
const TITLE_ABSOLUTE_CHAMPION = "absoluteChampion";

function asInt(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : d;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function todayKeyLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hasTitle(acc, title) {
  const t = acc?.titles;
  if (Array.isArray(t)) return t.includes(title);
  if (typeof t === "string") return t.split(",").map((x) => x.trim()).includes(title);
  return false;
}

function normalizeAccProgression(acc) {
  if (!acc || typeof acc !== "object") return acc;

  acc.xpTotal = Math.max(0, asInt(acc.xpTotal, 0));
  if (typeof acc.duelLeagueId !== "string" || !acc.duelLeagueId.trim()) {
    acc.duelLeagueId = DUEL_LEAGUE_DEFAULT_ID;
  }

  acc.guildLevel = clamp(asInt(acc.guildLevel, 0), 0, 999);

  if (!acc.bonuses || typeof acc.bonuses !== "object") acc.bonuses = {};
  const b = acc.bonuses;
  b.xpDaily = clamp(asInt(b.xpDaily, 0), 0, 300);
  b.xpPotion = clamp(asInt(b.xpPotion, 0), 0, 100);
  b.xpGuildArena = clamp(asInt(b.xpGuildArena, 0), 0, 100);
  b.xpEvent = clamp(asInt(b.xpEvent, 0), 0, 1000);

  b.silverDaily = clamp(asInt(b.silverDaily, 0), 0, 100);
  b.silverPotion = clamp(asInt(b.silverPotion, 0), 0, 100);
  b.silverGuildArena = clamp(asInt(b.silverGuildArena, 0), 0, 100);
  b.silverEvent = clamp(asInt(b.silverEvent, 0), 0, 1000);

  if (!acc.duel || typeof acc.duel !== "object") acc.duel = {};
  const d = acc.duel;
  const hadRating = Object.prototype.hasOwnProperty.call(d, "rating");
  d.rating = Math.max(0, asInt(d.rating, 0));
  // Migration: if rating didn't exist yet, derive it from stored leagueId bounds.
  if (!hadRating) {
    try {
      const l = getDuelLeague(acc.duelLeagueId);
      d.rating = Math.max(0, asInt(l?.minRating, 0));
    } catch {
      // ignore
    }
  }
  if (!Array.isArray(d.promoLeaguesClaimed)) d.promoLeaguesClaimed = [];
  d.dailyGold = Math.max(0, asInt(d.dailyGold, 0));
  d.dailyGoldDate = typeof d.dailyGoldDate === "string" ? d.dailyGoldDate : "";
  d.goldPity = clamp(asInt(d.goldPity, 0), 0, 999);
  d.played = Math.max(0, asInt(d.played, 0));
  d.wins = Math.max(0, asInt(d.wins, 0));
  d.losses = Math.max(0, asInt(d.losses, 0));
  d.draws = Math.max(0, asInt(d.draws, 0));

  if (!Array.isArray(acc.medals)) acc.medals = [];

  return acc;
}

function updateActive(updater) {
  if (window.AccountSystem?.updateActive) {
    return window.AccountSystem.updateActive((acc) => {
      normalizeAccProgression(acc);
      const res = updater(acc) || null;
      if (res && typeof res === "object") Object.assign(acc, res);
      normalizeAccProgression(acc);
      return null;
    });
  }

  // Fallback: update derived keys only (limited)
  const acc = window.AccountSystem?.getActive?.() || null;
  if (!acc) return null;
  normalizeAccProgression(acc);
  const res = updater(acc) || null;
  if (res && typeof res === "object") Object.assign(acc, res);
  normalizeAccProgression(acc);
  try {
    localStorage.setItem(`account:${acc.name}`, JSON.stringify(acc));
  } catch {
    // ignore
  }
  return acc;
}

function getCollectionsFlags() {
  const found = buildFoundSet();

  const hasAll = (ids) => ids.every((id) => found.has(String(id)));

  return {
    elementals: hasAll(["elem_01", "elem_02", "elem_03", "elem_04"]),
    ancientDragons: hasAll(["ancient_dragon_01", "ancient_dragon_02", "ancient_dragon_03"]),
    rareDragons: hasAll(["rare_dragon_01", "rare_dragon_02", "rare_dragon_03", "rare_dragon_04"]),
    urfinMutants: hasAll(["urfin_mut_01", "urfin_mut_02", "urfin_mut_03", "urfin_mut_04"]),
  };
}

function getXpBonusPercent(acc) {
  const b = acc?.bonuses || {};
  return (
    clamp(asInt(acc?.guildLevel, 0), 0, 999) +
    clamp(asInt(b.xpDaily, 0), 0, 300) +
    clamp(asInt(b.xpPotion, 0), 0, 100) +
    clamp(asInt(b.xpGuildArena, 0), 0, 100) +
    clamp(asInt(b.xpEvent, 0), 0, 1000)
  );
}

function getSilverBonusPercent(acc, flags) {
  const b = acc?.bonuses || {};
  const elementalsBonus = flags?.elementals ? 10 : 0;
  const duelChampBonus = hasTitle(acc, TITLE_DUEL_CHAMPION) ? 50 : 0;

  return (
    clamp(asInt(acc?.guildLevel, 0), 0, 999) +
    clamp(asInt(b.silverDaily, 0), 0, 100) +
    clamp(asInt(b.silverPotion, 0), 0, 100) +
    clamp(asInt(b.silverGuildArena, 0), 0, 100) +
    clamp(asInt(b.silverEvent, 0), 0, 1000) +
    elementalsBonus +
    duelChampBonus
  );
}

function getDuelGoldLimit(level, flags, acc) {
  const base = clamp(asInt(level, 1), 1, PLAYER_MAX_LEVEL);
  const add = (flags?.ancientDragons ? 5 : 0) + (flags?.rareDragons ? 10 : 0);
  const mult = hasTitle(acc, TITLE_TOURNAMENT_CHAMPION) ? 2 : 1;
  return (base + add) * mult;
}

function ensureDailyReset(acc) {
  const today = todayKeyLocal();
  const duel = acc.duel || {};
  if (duel.dailyGoldDate !== today) {
    duel.dailyGoldDate = today;
    duel.dailyGold = 0;
    duel.goldPity = 0;
  }
}

function roundRandom(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  const lo = Math.floor(n);
  const hi = Math.ceil(n);
  if (lo === hi) return lo;
  const frac = n - lo;
  return Math.random() < frac ? hi : lo;
}

function computeDuelGoldDrop(acc, flags) {
  const progress = getLevelProgressFromTotalXp(acc.xpTotal);
  const level = progress.level;

  const limit = getDuelGoldLimit(level, flags, acc);
  const duel = acc.duel;
  const already = Math.max(0, asInt(duel.dailyGold, 0));
  const remaining = limit - already;
  if (remaining <= 0) return { shouldDrop: false, amount: 0, limit };

  const pity = clamp(asInt(duel.goldPity, 0), 0, 999);
  const baseChance = 0.2;
  const chance = Math.min(0.9, baseChance + pity * 0.15);
  const shouldDrop = pity >= 4 || Math.random() < chance;

  if (!shouldDrop) return { shouldDrop: false, amount: 0, limit };

  const pct = flags?.urfinMutants ? 0.1 : 0.05;
  const raw = limit * pct;
  const amount = clamp(roundRandom(raw), 1, remaining);
  return { shouldDrop: amount > 0, amount, limit };
}

function grantXpAndHandleLevels(acc, gainedXp) {
  const xpGain = Math.max(0, asInt(gainedXp, 0));
  if (xpGain <= 0) {
    const p = getLevelProgressFromTotalXp(acc.xpTotal);
    return { xpGain: 0, levelBefore: p.level, levelAfter: p.level, levelUpGold: 0, medalsEarned: [] };
  }

  const before = getLevelProgressFromTotalXp(acc.xpTotal);
  const newTotal = acc.xpTotal + xpGain;
  const ups = computeLevelUps(acc.xpTotal, newTotal);

  acc.xpTotal = newTotal;

  let levelUpGold = 0;
  for (const l of ups.levels) levelUpGold += l;
  if (levelUpGold > 0) acc.gold = asInt(acc.gold, 0) + levelUpGold;

  const existingMedalLevels = new Set((acc.medals || []).map((m) => asInt(m?.level, -1)));
  const medalsEarned = [];
  for (const l of ups.levels) {
    if (!MEDAL_LEVELS.includes(l)) continue;
    if (existingMedalLevels.has(l)) continue;
    const medal = { level: l, kind: "bronze", ts: Date.now() };
    medalsEarned.push(medal);
    acc.medals.push(medal);
  }

  return {
    xpGain,
    levelBefore: before.level,
    levelAfter: ups.after,
    levelUpGold,
    medalsEarned,
  };
}

function applyCurrencyDelta(acc, { silver = 0, gold = 0 } = {}) {
  const s = asInt(silver, 0);
  const g = asInt(gold, 0);
  if (s !== 0) acc.silver = asInt(acc.silver, 0) + s;
  if (g !== 0) acc.gold = asInt(acc.gold, 0) + g;
  acc.gems = acc.silver;
}

function computeDuelSilverReward(baseSilver, result, bonusPct) {
  const r = String(result || "");
  const factor = r === "win" ? 1 : 0.5; // lose/draw -> половина бази
  const base = baseSilver * factor;
  const total = base + base * (bonusPct / 100);
  return Math.max(0, Math.round(total));
}

function computeDuelXpGain(damageDealt, bonusPct) {
  const base = Math.max(0, asInt(damageDealt, 0));
  const total = base + base * (bonusPct / 100);
  return Math.max(0, Math.round(total));
}

function defaultRatingDelta(result) {
  const r = String(result || "");
  if (r === "win") return 30;
  if (r === "lose") return -20;
  if (r === "draw") return 10;
  return 0;
}

function applyLeagueProgression(acc, ratingBefore, ratingAfter) {
  const beforeLeague = getDuelLeagueByRating(ratingBefore);
  const afterLeague = getDuelLeagueByRating(ratingAfter);

  const beforeMin = asInt(beforeLeague?.minRating, 0);
  const afterMin = asInt(afterLeague?.minRating, 0);

  let promoSilver = 0;
  if (afterMin > beforeMin) {
    const claimed = new Set((acc.duel?.promoLeaguesClaimed || []).map(String));
    const leagueId = String(afterLeague?.id || "");
    const promo = asInt(afterLeague?.promoSilver, 0);
    if (leagueId && promo > 0 && !claimed.has(leagueId)) {
      promoSilver = promo;
      claimed.add(leagueId);
      acc.duel.promoLeaguesClaimed = Array.from(claimed);
    }
  }

  // Keep leagueId in sync with rating-derived league (rating is source of truth)
  acc.duelLeagueId = String(afterLeague?.id || acc.duelLeagueId || DUEL_LEAGUE_DEFAULT_ID);

  return { beforeLeague, afterLeague, promoSilver };
}

function applyDuelBattleResult(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const result = String(p.result || "");

  let lastSummary = null;

  updateActive((acc) => {
    normalizeAccProgression(acc);
    ensureDailyReset(acc);

    const flags = getCollectionsFlags();

    // Rating + league progression
    const ratingBefore = asInt(acc.duel.rating, 0);
    const explicitDelta = Number.isFinite(Number(p.ratingDelta)) ? Math.round(Number(p.ratingDelta)) : null;
    const ratingDelta = explicitDelta ?? defaultRatingDelta(result);
    const ratingAfter = Math.max(0, ratingBefore + ratingDelta);
    acc.duel.rating = ratingAfter;

    const leagueProg = applyLeagueProgression(acc, ratingBefore, ratingAfter);

    // XP first (level can affect duel-gold limit)
    const xpBonusPct = getXpBonusPercent(acc) + clamp(asInt(p.xpBonusBattlePct, 0), 0, 1000);
    const baseDamage = Math.max(0, asInt(p.damageDealt ?? 0));
    const xpGain = computeDuelXpGain(baseDamage, xpBonusPct);
    const xpRes = grantXpAndHandleLevels(acc, xpGain);

    const league = getDuelLeague(acc.duelLeagueId);
    const silverBonusPct = getSilverBonusPercent(acc, flags) + clamp(asInt(p.silverBonusBattlePct, 0), 0, 1000);

    let duelGold = 0;
    let duelSilver = 0;
    let promoSilver = asInt(leagueProg?.promoSilver, 0);
    let goldDropped = false;
    let goldLimit = getDuelGoldLimit(xpRes.levelAfter, flags, acc);

    if (result === "win") {
      // Silver is always awarded for a win; gold is an extra (limited) drop.
      duelSilver = computeDuelSilverReward(league.baseSilver, result, silverBonusPct);

      const drop = computeDuelGoldDrop(acc, flags);
      goldLimit = drop.limit;
      if (drop.shouldDrop) {
        goldDropped = true;
        duelGold = drop.amount;
        acc.duel.dailyGold = asInt(acc.duel.dailyGold, 0) + duelGold;
        acc.duel.goldPity = 0;
      } else {
        acc.duel.goldPity = clamp(asInt(acc.duel.goldPity, 0) + 1, 0, 999);
      }
    } else {
      acc.duel.goldPity = clamp(asInt(acc.duel.goldPity, 0) + 1, 0, 999);
      duelSilver = computeDuelSilverReward(league.baseSilver, result, silverBonusPct);
    }

    applyCurrencyDelta(acc, { silver: duelSilver + promoSilver, gold: duelGold });

    acc.duel.played += 1;
    if (result === "win") acc.duel.wins += 1;
    else if (result === "lose") acc.duel.losses += 1;
    else if (result === "draw") acc.duel.draws += 1;

    const progressAfter = getLevelProgressFromTotalXp(acc.xpTotal);

    const summary = {
      result,
      enemyName: String(p.enemyName || ""),
      player: { hp: asInt(p.playerHp, 0), maxHp: asInt(p.playerMaxHp, 0) },
      enemy: { hp: asInt(p.enemyHp, 0), maxHp: asInt(p.enemyMaxHp, 0) },

      league: { id: acc.duelLeagueId, name: league.name, baseSilver: league.baseSilver },
      rating: { before: ratingBefore, after: ratingAfter, delta: ratingDelta },
      leagueTransition: {
        from: { id: leagueProg?.beforeLeague?.id, name: leagueProg?.beforeLeague?.name, minRating: asInt(leagueProg?.beforeLeague?.minRating, 0) },
        to: { id: leagueProg?.afterLeague?.id, name: leagueProg?.afterLeague?.name, minRating: asInt(leagueProg?.afterLeague?.minRating, 0) },
        promoSilver,
      },
      duel: {
        played: asInt(acc?.duel?.played, 0),
        wins: asInt(acc?.duel?.wins, 0),
        losses: asInt(acc?.duel?.losses, 0),
        draws: asInt(acc?.duel?.draws, 0),
      },
      xp: {
        base: baseDamage,
        gained: xpRes.xpGain,
        bonusPct: xpBonusPct,
        levelBefore: xpRes.levelBefore,
        levelAfter: xpRes.levelAfter,
        levelUpGold: xpRes.levelUpGold,
        medalsEarned: xpRes.medalsEarned,
        intoLevel: progressAfter.xpIntoLevel,
        nextReq: progressAfter.xpForNextLevel,
        progressPercent: progressAfter.progressPercent,
      },
      rewards: {
        silver: duelSilver + promoSilver,
        duelSilver,
        promoSilver,
        gold: duelGold,
        goldDropped,
        silverBonusPct,
        goldToday: asInt(acc.duel.dailyGold, 0),
        goldLimit,
        goldPity: asInt(acc.duel.goldPity, 0),
      },
      ts: Date.now(),
    };

    try {
      sessionStorage.setItem("cardastika:lastBattleSummary", JSON.stringify(summary));
    } catch {
      // ignore
    }

    lastSummary = summary;
  });

  return lastSummary;
}

function grantXpReward(amount) {
  let out = null;
  updateActive((acc) => {
    normalizeAccProgression(acc);
    const res = grantXpAndHandleLevels(acc, amount);
    const progressAfter = getLevelProgressFromTotalXp(acc.xpTotal);
    out = {
      xpGain: res.xpGain,
      levelBefore: res.levelBefore,
      levelAfter: res.levelAfter,
      levelUpGold: res.levelUpGold,
      medalsEarned: res.medalsEarned,
      intoLevel: progressAfter.xpIntoLevel,
      nextReq: progressAfter.xpForNextLevel,
      progressPercent: progressAfter.progressPercent,
    };
  });
  return out;
}

function getActiveProgressionState() {
  const acc = window.AccountSystem?.getActive?.() || null;
  if (!acc) return null;
  normalizeAccProgression(acc);
  ensureDailyReset(acc);
  const flags = getCollectionsFlags();
  const progress = getLevelProgressFromTotalXp(acc.xpTotal);
  // Rating is source of truth for league
  const rating = asInt(acc?.duel?.rating, 0);
  const leagueByRating = getDuelLeagueByRating(rating);
  acc.duelLeagueId = String(leagueByRating?.id || acc.duelLeagueId || DUEL_LEAGUE_DEFAULT_ID);
  const league = getDuelLeague(acc.duelLeagueId);

  // Progress to next league
  const leagues = listDuelLeagues().slice().sort((a, b) => (a.minRating ?? 0) - (b.minRating ?? 0));
  const curMin = asInt(leagueByRating?.minRating, 0);
  let next = null;
  for (const l of leagues) {
    if (asInt(l?.minRating, 0) > curMin) {
      next = l;
      break;
    }
  }
  const nextMin = next ? asInt(next.minRating, 0) : null;
  const span = nextMin != null ? Math.max(1, nextMin - curMin) : null;
  const into = Math.max(0, rating - curMin);
  const pct = span != null ? clamp(Math.round((into / span) * 100), 0, 100) : 100;
  const goldLimit = getDuelGoldLimit(progress.level, flags, acc);
  return {
    level: progress.level,
    xpTotal: acc.xpTotal,
    xpIntoLevel: progress.xpIntoLevel,
    xpForNextLevel: progress.xpForNextLevel,
    league,
    duel: {
      rating,
      leagueProgress: {
        current: { id: leagueByRating?.id, name: leagueByRating?.name, minRating: curMin },
        next: next ? { id: next.id, name: next.name, minRating: nextMin } : null,
        into,
        span,
        pct,
        toNext: nextMin != null ? Math.max(0, nextMin - rating) : 0,
      },
      dailyGold: asInt(acc.duel.dailyGold, 0),
      dailyGoldLimit: goldLimit,
      goldPity: asInt(acc.duel.goldPity, 0),
      played: asInt(acc.duel.played, 0),
      wins: asInt(acc.duel.wins, 0),
      losses: asInt(acc.duel.losses, 0),
      draws: asInt(acc.duel.draws, 0),
    },
    bonuses: {
      xpPct: getXpBonusPercent(acc),
      silverPct: getSilverBonusPercent(acc, flags),
      flags,
      fields: {
        xpDaily: asInt(acc?.bonuses?.xpDaily, 0),
        xpPotion: asInt(acc?.bonuses?.xpPotion, 0),
        xpGuildArena: asInt(acc?.bonuses?.xpGuildArena, 0),
        xpEvent: asInt(acc?.bonuses?.xpEvent, 0),

        silverDaily: asInt(acc?.bonuses?.silverDaily, 0),
        silverPotion: asInt(acc?.bonuses?.silverPotion, 0),
        silverGuildArena: asInt(acc?.bonuses?.silverGuildArena, 0),
        silverEvent: asInt(acc?.bonuses?.silverEvent, 0),
      },
    },
    medals: Array.isArray(acc.medals) ? acc.medals.slice() : [],
    titles: Array.isArray(acc.titles) ? acc.titles.slice() : [],
    guildLevel: asInt(acc.guildLevel, 0),
  };
}

function setDuelLeague(leagueId) {
  const id = String(leagueId || "").trim();
  if (!id) return null;
  return updateActive((acc) => {
    acc.duelLeagueId = id;
  });
}

function setBonuses(next) {
  const obj = next && typeof next === "object" ? next : {};
  return updateActive((acc) => {
    if (!acc.bonuses || typeof acc.bonuses !== "object") acc.bonuses = {};
    for (const [k, v] of Object.entries(obj)) {
      acc.bonuses[k] = asInt(v, acc.bonuses[k] ?? 0);
    }
  });
}

function setGuildLevel(level) {
  const n = clamp(asInt(level, 0), 0, 999);
  return updateActive((acc) => {
    acc.guildLevel = n;
  });
}

function toggleTitle(title, enabled) {
  const t = String(title || "").trim();
  if (!t) return null;
  return updateActive((acc) => {
    if (!Array.isArray(acc.titles)) acc.titles = [];
    const set = new Set(acc.titles.map(String));
    const shouldEnable = !!enabled;
    if (shouldEnable) set.add(t);
    else set.delete(t);
    acc.titles = Array.from(set);
  });
}

export const ProgressionSystem = {
  getState: getActiveProgressionState,
  applyDuelBattleResult,
  grantXpReward,

  setDuelLeague,
  setBonuses,
  setGuildLevel,
  toggleTitle,

  titles: {
    TITLE_TOURNAMENT_CHAMPION,
    TITLE_DUEL_CHAMPION,
    TITLE_ABSOLUTE_CHAMPION,
  },
};

if (typeof window !== "undefined") {
  window.ProgressionSystem = ProgressionSystem;
}
