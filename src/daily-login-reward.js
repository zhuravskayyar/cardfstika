import { DailyTasksSystem } from "./daily-tasks-system.js";

function showToast(message) {
  const host = document.getElementById("toastHost") || document.body;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = String(message || "");
  host.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function renderBanner(status) {
  const host = document.getElementById("modalHost");
  if (!host) return null;
  const preview = status?.preview || { streak: 1, gold: 25, diamonds: 1, items: 0 };

  host.classList.add("is-open");
  host.setAttribute("aria-hidden", "false");
  host.innerHTML =
    `<section class="daily-login-overlay" role="dialog" aria-modal="true" aria-label="\u0429\u043e\u0434\u0435\u043d\u043d\u0430 \u043d\u0430\u0433\u043e\u0440\u043e\u0434\u0430">` +
      `<article class="daily-login-card">` +
        `<h2 class="daily-login-title">\u0429\u043e\u0434\u0435\u043d\u043d\u0430 \u043d\u0430\u0433\u043e\u0440\u043e\u0434\u0430</h2>` +
        `<p class="daily-login-text">\u0414\u0435\u043d\u044c \u0441\u0435\u0440\u0456\u0457: <b>${preview.streak}</b>. \u0417\u0430\u0431\u0435\u0440\u0456\u0442\u044c \u0431\u043e\u043d\u0443\u0441 \u0437\u0430 \u0432\u0445\u0456\u0434.</p>` +
        `<div class="daily-login-rewards">` +
          `<div class="daily-login-reward"><img src="assets/icons/coin-gold.svg" alt=""> +${preview.gold} \u0437\u043e\u043b\u043e\u0442\u0430</div>` +
          `<div class="daily-login-reward"><img src="assets/icons/diamond.svg" alt=""> +${preview.diamonds} \u0434\u0456\u0430\u043c\u0430\u043d\u0442\u0456\u0432</div>` +
          (preview.items > 0 ? `<div class="daily-login-reward">\uD83C\uDF81 +${preview.items} \u0432\u0438\u043f\u0430\u0434\u043a\u043e\u0432\u0430 \u0440\u0456\u0447</div>` : "") +
        `</div>` +
        `<div class="daily-login-actions">` +
          `<button type="button" class="task-btn task-btn--go daily-login-claim-btn" id="dailyLoginClaimBtn"><span>\u0417\u0430\u0431\u0440\u0430\u0442\u0438 \u043d\u0430\u0433\u043e\u0440\u043e\u0434\u0443</span></button>` +
        `</div>` +
      `</article>` +
    `</section>`;

  return host;
}

function closeBanner() {
  const host = document.getElementById("modalHost");
  if (!host) return;
  host.classList.remove("is-open");
  host.setAttribute("aria-hidden", "true");
  host.innerHTML = "";
}

export async function maybeShowDailyLoginRewardBanner() {
  const status = DailyTasksSystem.getLoginRewardStatus();
  if (!status?.canClaim) return false;

  const host = renderBanner(status);
  if (!host) return false;

  const claimBtn = document.getElementById("dailyLoginClaimBtn");
  claimBtn?.addEventListener("click", async () => {
    if (claimBtn) claimBtn.disabled = true;
    const res = await DailyTasksSystem.claimLoginReward();
    if (!res?.ok) {
      closeBanner();
      return;
    }

    const parts = [`+${res.reward.gold} \u0437\u043e\u043b\u043e\u0442\u0430`, `+${res.reward.diamonds} \u0434\u0456\u0430\u043c\u0430\u043d\u0442\u0456\u0432`];
    if (Array.isArray(res.reward.itemsGranted) && res.reward.itemsGranted.length) {
      parts.push(`+${res.reward.itemsGranted.length} \u0440\u0435\u0447\u0435\u0439`);
    }
    showToast(`\u0429\u043e\u0434\u0435\u043d\u043d\u0430 \u043d\u0430\u0433\u043e\u0440\u043e\u0434\u0430: ${parts.join(", ")}.`);
    closeBanner();
    try {
      window.updateGlobalHUD?.();
    } catch {
      // ignore
    }
  });

  return true;
}
