import "../../src/progression-system.js";
import { getDuelLeagueIconPath, listDuelLeagues } from "../../src/core/leagues.js";
import { emitCampaignEvent } from "../../src/campaign/campaign-events.js";

function showToast(message) {
  const host = document.getElementById("toastHost") || document.body;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = String(message || "");
  host.appendChild(toast);
  setTimeout(() => toast.classList.add("is-show"), 10);
  setTimeout(() => {
    toast.classList.remove("is-show");
    setTimeout(() => toast.remove(), 250);
  }, 2200);
}

function asInt(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : d;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function fmtNumAbs(v) {
  const n = Math.abs(asInt(v, 0));
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value ?? "");
  return el;
}

function logout() {
  localStorage.removeItem("cardastika:auth:active");

  // Account system
  localStorage.removeItem("activeAccount");

  // Derived game state (HUD/deck)
  localStorage.removeItem("cardastika:deck");
  localStorage.removeItem("cardastika:inventory");
  localStorage.removeItem("cardastika:gold");
  localStorage.removeItem("cardastika:silver");
  localStorage.removeItem("cardastika:gems");
  localStorage.removeItem("cardastika:profile");

  window.location.href = "../auth/auth.html";
}

function render() {
  const active = localStorage.getItem("cardastika:auth:active") || localStorage.getItem("activeAccount");
  if (active) setText("profileWho", `Ви увійшли як: ${active}`);

  const state = window.ProgressionSystem?.getState?.() || null;
  if (!state) return;

  setText("profLevel", state.level);
  setText("profXpBonus", `${asInt(state.bonuses?.xpPct, 0)}%`);
  setText("profSilverBonus", `${asInt(state.bonuses?.silverPct, 0)}%`);

  setText("profXpInto", fmtNumAbs(state.xpIntoLevel));
  if (state.xpForNextLevel != null) setText("profXpNeed", fmtNumAbs(state.xpForNextLevel));
  else setText("profXpNeed", "MAX");

  const pct = state.xpForNextLevel != null
    ? clamp(
      Math.round((Math.max(0, asInt(state.xpIntoLevel, 0)) / Math.max(1, asInt(state.xpForNextLevel, 1))) * 100),
      0,
      100
    )
    : 100;

  const fill = document.getElementById("profXpFill");
  if (fill) fill.style.width = `${pct}%`;
  document.querySelector(".profile-xpbar__bar")?.setAttribute("aria-valuenow", String(pct));

  setText("profGoldToday", fmtNumAbs(state.duel?.dailyGold ?? 0));
  setText("profGoldLimit", fmtNumAbs(state.duel?.dailyGoldLimit ?? 0));

  const league = state.league || null;
  if (league) {
    setText("profLeagueName", league.name);
    setText("profLeagueBaseSilver", fmtNumAbs(league.baseSilver));

    const icon = document.getElementById("profLeagueIcon");
    if (icon) icon.src = getDuelLeagueIconPath(league.id);
  }

  const medals = Array.isArray(state.medals) ? state.medals : [];
  if (!medals.length) {
    setText("profMedals", "—");
  } else {
    const txt = medals
      .slice()
      .sort((a, b) => asInt(a?.level, 0) - asInt(b?.level, 0))
      .map((m) => `${asInt(m?.level, 0)} (${String(m?.kind || "bronze")})`)
      .join(", ");
    setText("profMedals", txt);
  }

  const fields = state.bonuses?.fields || {};
  const titles = window.ProgressionSystem?.titles || {};

  const guildEl = document.getElementById("inpGuildLevel");
  if (guildEl) guildEl.value = String(asInt(state.guildLevel, 0));

  const xpDaily = document.getElementById("inpXpDaily");
  if (xpDaily) xpDaily.value = String(asInt(fields.xpDaily, 0));

  const xpPotion = document.getElementById("inpXpPotion");
  if (xpPotion) xpPotion.checked = asInt(fields.xpPotion, 0) > 0;

  const xpGuildArena = document.getElementById("inpXpGuildArena");
  if (xpGuildArena) xpGuildArena.value = String(asInt(fields.xpGuildArena, 0));

  const xpEvent = document.getElementById("inpXpEvent");
  if (xpEvent) xpEvent.value = String(asInt(fields.xpEvent, 0));

  const sDaily = document.getElementById("inpSilverDaily");
  if (sDaily) sDaily.value = String(asInt(fields.silverDaily, 0));

  const sPotion = document.getElementById("inpSilverPotion");
  if (sPotion) sPotion.checked = asInt(fields.silverPotion, 0) > 0;

  const sGuildArena = document.getElementById("inpSilverGuildArena");
  if (sGuildArena) sGuildArena.value = String(asInt(fields.silverGuildArena, 0));

  const sEvent = document.getElementById("inpSilverEvent");
  if (sEvent) sEvent.value = String(asInt(fields.silverEvent, 0));

  const tTournament = document.getElementById("inpTitleTournament");
  if (tTournament) tTournament.checked = Array.isArray(state.titles) && state.titles.includes(titles.TITLE_TOURNAMENT_CHAMPION);

  const tDuel = document.getElementById("inpTitleDuel");
  if (tDuel) tDuel.checked = Array.isArray(state.titles) && state.titles.includes(titles.TITLE_DUEL_CHAMPION);

  const tAbs = document.getElementById("inpTitleAbsolute");
  if (tAbs) tAbs.checked = Array.isArray(state.titles) && state.titles.includes(titles.TITLE_ABSOLUTE_CHAMPION);

  const sel = document.getElementById("leagueSelect");
  if (sel) sel.value = String(league?.id || "");
}

function bind() {
  const sel = document.getElementById("leagueSelect");
  if (sel && sel.options.length === 0) {
    const leagues = listDuelLeagues();
    for (const l of leagues) {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = `${l.name} • база ${l.baseSilver}`;
      sel.appendChild(opt);
    }
  }

  sel?.addEventListener("change", () => {
    window.ProgressionSystem?.setDuelLeague?.(sel.value);
    render();
  });

  document.getElementById("inpGuildLevel")?.addEventListener("change", (e) => {
    window.ProgressionSystem?.setGuildLevel?.(e.currentTarget.value);
    render();
  });

  const setBonus = (key, value) => {
    window.ProgressionSystem?.setBonuses?.({ [key]: value });
    render();
  };

  document.getElementById("inpXpDaily")?.addEventListener("change", (e) => setBonus("xpDaily", e.currentTarget.value));
  document.getElementById("inpXpPotion")?.addEventListener("change", (e) => setBonus("xpPotion", e.currentTarget.checked ? 100 : 0));
  document.getElementById("inpXpGuildArena")?.addEventListener("change", (e) => setBonus("xpGuildArena", e.currentTarget.value));
  document.getElementById("inpXpEvent")?.addEventListener("change", (e) => setBonus("xpEvent", e.currentTarget.value));

  document.getElementById("inpSilverDaily")?.addEventListener("change", (e) => setBonus("silverDaily", e.currentTarget.value));
  document.getElementById("inpSilverPotion")?.addEventListener("change", (e) => setBonus("silverPotion", e.currentTarget.checked ? 100 : 0));
  document.getElementById("inpSilverGuildArena")?.addEventListener("change", (e) => setBonus("silverGuildArena", e.currentTarget.value));
  document.getElementById("inpSilverEvent")?.addEventListener("change", (e) => setBonus("silverEvent", e.currentTarget.value));

  document.getElementById("inpTitleTournament")?.addEventListener("change", (e) => {
    const titles = window.ProgressionSystem?.titles || {};
    window.ProgressionSystem?.toggleTitle?.(titles.TITLE_TOURNAMENT_CHAMPION, e.currentTarget.checked);
    render();
  });

  document.getElementById("inpTitleDuel")?.addEventListener("change", (e) => {
    const titles = window.ProgressionSystem?.titles || {};
    window.ProgressionSystem?.toggleTitle?.(titles.TITLE_DUEL_CHAMPION, e.currentTarget.checked);
    render();
  });

  document.getElementById("inpTitleAbsolute")?.addEventListener("change", (e) => {
    const titles = window.ProgressionSystem?.titles || {};
    window.ProgressionSystem?.toggleTitle?.(titles.TITLE_ABSOLUTE_CHAMPION, e.currentTarget.checked);
    render();
  });

  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  document.getElementById("saveProfileBtn")?.addEventListener("click", () => {
    try {
      window.AccountSystem?.updateActive?.(() => null);
      emitCampaignEvent("profile_saved");
      showToast("Профіль збережено.");
    } catch (e) {
      console.warn("[profile] save failed", e);
      showToast("Не вдалося зберегти профіль.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bind();
  render();
});
