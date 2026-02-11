import { CAMPAIGN } from "./campaign-data.js";
import { addQuestProgress, getQuestProgress, isBossDefeated, isQuestClaimed, loadCampaignState, saveCampaignState, setQuestProgress } from "./campaign-state.js";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function listActQuests(act) {
  const qs = Array.isArray(act?.quests) ? act.quests : [];
  return qs.filter((q) => q && typeof q === "object" && q.id);
}

function isActCompleted(state, act) {
  const qs = listActQuests(act);
  return qs.length > 0 && qs.every((q) => isQuestClaimed(state, q.id)) && isBossDefeated(state, act?.id);
}

export function getActiveAct(state = loadCampaignState()) {
  for (const act of CAMPAIGN.acts) {
    if (!isActCompleted(state, act)) return act;
  }
  return CAMPAIGN.acts[CAMPAIGN.acts.length - 1] || null;
}

export function emitCampaignEvent(type, payload = {}) {
  const evtType = String(type || "").trim();
  if (!evtType) return;

  const state = loadCampaignState();
  const act = getActiveAct(state);
  if (!act) return;

  const sourceQuestId = String(payload?.sourceQuestId || "").trim();
  const count = Number(payload?.count);
  const incCount = Number.isFinite(count) ? Math.max(1, Math.round(count)) : 1;

  for (const q of listActQuests(act)) {
    if (q.type !== evtType) continue;
    if (isQuestClaimed(state, q.id)) continue;
    if (evtType === "reward_claimed" && sourceQuestId && sourceQuestId === String(q.id)) continue;

    const target = Math.max(1, Math.round(Number(q.target || 1)));
    const cur = getQuestProgress(state, q.id);
    if (cur >= target) continue;

    const inc = (evtType === "shop_purchase" || evtType === "card_upgraded") ? incCount : 1;
    addQuestProgress(state, q.id, inc);

    const next = clamp(getQuestProgress(state, q.id), 0, target);
    setQuestProgress(state, q.id, next);
  }

  saveCampaignState(state);
  try {
    window.dispatchEvent(new CustomEvent("campaign:updated", { detail: { type: evtType } }));
  } catch {
    // ignore
  }
}
