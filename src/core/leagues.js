// src/core/leagues.js - Duel leagues + rating thresholds (prototype)

// Mode icons (requested: дуелі / арена / турнір)
export const BATTLE_MODE_ICONS = {
  duel: "⚔️",
  arena: "🏟️",
  tournament: "🏆",
};

export const BATTLE_MODE_ORDER = ["duel", "arena", "tournament"];

const DEFAULT_LEAGUE_ID = "league-gray-3";

// League table:
// - `minRating`: lower bound of rating for the league
// - `promoSilver`: one-time silver reward on entering the league (null => no reward)
// - `baseSilver`: per-duel base silver (legacy economy); keep small and monotonic
export const DUEL_LEAGUES = [
  // Gray
  { id: "league-gray-3", name: "Третя сіра", minRating: 0, promoSilver: null, baseSilver: 100 },
  { id: "league-gray-2", name: "Друга сіра", minRating: 500, promoSilver: 1000, baseSilver: 120 },
  { id: "league-gray-1", name: "Перша сіра", minRating: 600, promoSilver: 2000, baseSilver: 150 },

  // Green
  { id: "league-green-3", name: "Третя зелена", minRating: 800, promoSilver: 3000, baseSilver: 200 },
  { id: "league-green-2", name: "Друга зелена", minRating: 1000, promoSilver: 4000, baseSilver: 250 },
  { id: "league-green-1", name: "Перша зелена", minRating: 1200, promoSilver: 5000, baseSilver: 300 },

  // Blue
  { id: "league-blue-3", name: "Третя синя", minRating: 1400, promoSilver: 6000, baseSilver: 400 },
  { id: "league-blue-2", name: "Друга синя", minRating: 1600, promoSilver: 7000, baseSilver: 450 },
  { id: "league-blue-1", name: "Перша синя", minRating: 1800, promoSilver: 8000, baseSilver: 500 },

  // Epic (keep id prefix `purple` for back-compat with existing accounts)
  { id: "league-purple-3", name: "Третя епічна", minRating: 2000, promoSilver: 10000, baseSilver: 600 },
  { id: "league-purple-2", name: "Друга епічна", minRating: 2200, promoSilver: 15000, baseSilver: 650 },
  { id: "league-purple-1", name: "Перша епічна", minRating: 2400, promoSilver: 20000, baseSilver: 700 },

  // Legendary (keep id prefix `gold` for back-compat)
  { id: "league-gold-3", name: "Третя легендарна", minRating: 2600, promoSilver: 30000, baseSilver: 1000 },
  { id: "league-gold-2", name: "Друга легендарна", minRating: 2800, promoSilver: 40000, baseSilver: 1200 },
  { id: "league-gold-1", name: "Перша легендарна", minRating: 3000, promoSilver: 50000, baseSilver: 1500 },

  // Mythic (keep id prefix `black` for back-compat)
  { id: "league-black-3", name: "Третя міфічна", minRating: 3200, promoSilver: 70000, baseSilver: 2000 },
  { id: "league-black-2", name: "Друга міфічна", minRating: 3400, promoSilver: 80000, baseSilver: 2200 },
  { id: "league-black-1", name: "Перша міфічна", minRating: 3600, promoSilver: 100000, baseSilver: 2500 },

  // Masters
  { id: "league-masters-3", name: "Третя майстрів", minRating: 3800, promoSilver: 120000, baseSilver: 3000 },
  { id: "league-masters-2", name: "Друга майстрів", minRating: 4000, promoSilver: 150000, baseSilver: 3500 },
  { id: "league-masters-1", name: "Перша майстрів", minRating: 4200, promoSilver: 200000, baseSilver: 4000 },
].slice().sort((a, b) => (a.minRating ?? 0) - (b.minRating ?? 0));

const BY_ID = new Map(DUEL_LEAGUES.map((l) => [l.id, l]));

function rootPrefix() {
  const inPages = location.pathname.toLowerCase().includes("/pages/");
  return inPages ? "../../" : "./";
}

function decorateLeague(league) {
  const l = league && typeof league === "object" ? league : BY_ID.get(DEFAULT_LEAGUE_ID);
  const modesText = BATTLE_MODE_ORDER.map((m) => BATTLE_MODE_ICONS[m]).join(" ");
  return { ...l, modes: BATTLE_MODE_ORDER.slice(), modesText };
}

export function getDuelLeague(leagueId) {
  const id = String(leagueId || "").trim();
  return decorateLeague(BY_ID.get(id) || BY_ID.get(DEFAULT_LEAGUE_ID));
}

export function getDuelLeagueByRating(rating) {
  const r = Number(rating);
  const val = Number.isFinite(r) ? Math.max(0, Math.round(r)) : 0;
  let best = BY_ID.get(DEFAULT_LEAGUE_ID);
  for (const l of DUEL_LEAGUES) {
    if ((l.minRating ?? 0) <= val) best = l;
    else break;
  }
  return decorateLeague(best);
}

export function getDuelLeagueIconPath(leagueId) {
  const league = getDuelLeague(leagueId);
  return `${rootPrefix()}assets/icons/leagues/${league.id}.svg`;
}

export function listDuelLeagues() {
  return DUEL_LEAGUES.map(decorateLeague);
}

export const DUEL_LEAGUE_DEFAULT_ID = DEFAULT_LEAGUE_ID;


