const KEY = "cardastika:campaign_state_v1";
const VERSION = 1;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadCampaignState() {
  const raw = localStorage.getItem(KEY);
  const st = raw ? safeParse(raw) : null;
  if (!st || typeof st !== "object") return { v: VERSION, progress: {}, claimed: {}, bosses: {} };
  if (!st.v) st.v = VERSION;
  if (!st.progress || typeof st.progress !== "object") st.progress = {};
  if (!st.claimed || typeof st.claimed !== "object") st.claimed = {};
  if (!st.bosses || typeof st.bosses !== "object") st.bosses = {};
  return st;
}

export function saveCampaignState(state) {
  const st = state && typeof state === "object" ? state : { v: VERSION, progress: {}, claimed: {}, bosses: {} };
  if (!st.v) st.v = VERSION;
  if (!st.progress || typeof st.progress !== "object") st.progress = {};
  if (!st.claimed || typeof st.claimed !== "object") st.claimed = {};
  if (!st.bosses || typeof st.bosses !== "object") st.bosses = {};
  localStorage.setItem(KEY, JSON.stringify(st));
}

export function getQuestProgress(state, questId) {
  const id = String(questId || "");
  if (!id) return 0;
  const v = Number(state?.progress?.[id] ?? 0);
  return Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
}

export function addQuestProgress(state, questId, amount = 1) {
  const id = String(questId || "");
  if (!id) return;
  const inc = Number(amount);
  const a = Number.isFinite(inc) ? Math.max(0, Math.round(inc)) : 0;
  if (a <= 0) return;

  state.progress ||= {};
  const cur = Number(state.progress[id] ?? 0);
  const c = Number.isFinite(cur) ? Math.max(0, Math.round(cur)) : 0;
  state.progress[id] = c + a;
}

export function setQuestProgress(state, questId, value) {
  const id = String(questId || "");
  if (!id) return;
  const v = Number(value);
  state.progress ||= {};
  state.progress[id] = Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
}

export function isQuestClaimed(state, questId) {
  const id = String(questId || "");
  if (!id) return false;
  return Boolean(state?.claimed?.[id]);
}

export function setQuestClaimed(state, questId, claimed = true) {
  const id = String(questId || "");
  if (!id) return;
  state.claimed ||= {};
  state.claimed[id] = Boolean(claimed);
}

export function isBossDefeated(state, actId) {
  const id = String(actId || "");
  if (!id) return false;
  return Boolean(state?.bosses?.[id]);
}

export function setBossDefeated(state, actId, defeated = true) {
  const id = String(actId || "");
  if (!id) return;
  state.bosses ||= {};
  state.bosses[id] = Boolean(defeated);
}
