import "../../src/account.js";
import { DailyTasksSystem } from "../../src/daily-tasks-system.js";

const tasksListEl = document.getElementById("tasksList");
const tasksCompletedEl = document.getElementById("tasksCompleted");
const currentMulEl = document.getElementById("tasksCurrentMultiplier");
const nextMulEl = document.getElementById("tasksNextMultiplier");
const headerTextEl = document.getElementById("tasksHeaderText");

function showToast(message) {
  const host = document.getElementById("toastHost") || document.body;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = String(message || "");
  host.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function rewardPill(icon, value) {
  return (
    `<span class="task-reward-inline">` +
      `<img src="${icon}" alt="" class="icon icon--gold">` +
      `<span class="task-reward__value">${value}</span>` +
    `</span>`
  );
}

function rewardBadge(label) {
  return `<span class="task-reward-inline--card">${label}</span>`;
}

function taskStatusText(task) {
  if (task.canClaim) return { text: `Готово до отримання: ${task.pendingClaims}`, cls: "is-ready" };
  if (task.claimedToday && task.pendingClaims > 0) return { text: "Отримано сьогодні, новий клейм завтра", cls: "is-locked" };
  if (task.claimedToday) return { text: "Отримано сьогодні", cls: "is-claimed" };
  return { text: `Прогрес: ${task.progressCurrent} з ${task.target}`, cls: "" };
}

function taskRewardsHtml(task) {
  const chunks = [];
  if (task.rewards.diamonds > 0) {
    chunks.push(rewardPill("../../assets/icons/diamond.svg", task.rewards.diamonds));
  }
  if (task.rewards.gold > 0) {
    chunks.push(rewardPill("../../assets/icons/coin-gold.svg", task.rewards.gold));
  }
  if (task.rewards.cards > 0) {
    chunks.push(rewardBadge(`Карта x${task.rewards.cards}`));
  }
  if (task.rewards.items > 0) {
    chunks.push(rewardBadge(`Річ x${task.rewards.items}`));
  }
  return chunks.join("");
}

function renderTasks(snapshot) {
  if (!tasksListEl) return;
  const modeLabel = snapshot.isArenaTasksMode
    ? "Активний режим: задачі з ареною."
    : "До 3-ї епічної ліги дуелей активні задачі «Купіть 5 карт» та «Поглиніть 10 карт».";

  tasksListEl.innerHTML =
    `<section class="tasks-act" data-act-id="daily">` +
      `<div class="tasks-act__head">` +
        `<h2 class="tasks-act__title">Щоденні завдання</h2>` +
        `<p class="tasks-act__intro">8 завдань на день. Кожне можна отримати 1 раз за день, прогрес накопичується.</p>` +
        `<p class="tasks-act__boss">${modeLabel}</p>` +
        `<p class="tasks-act__meta">Тижневий марафон (пн-пт): за тиждень ${snapshot.marathon.weekDiamonds} діамантів.</p>` +
      `</div>` +
      snapshot.tasks.map((task) => {
        const status = taskStatusText(task);
        const canGo = !task.canClaim;
        const claimLabel = task.canClaim
          ? "Забрати нагороду"
          : (task.claimedToday ? (task.pendingClaims > 0 ? "Доступно завтра" : "Отримано") : "Недоступно");
        const itemClass = [
          "task-item",
          task.pendingClaims > 0 ? "is-complete" : "",
          task.claimedToday ? "is-claimed-today" : "",
        ].filter(Boolean).join(" ");
        const extra = Array.isArray(task.extraLines) && task.extraLines.length
          ? (
            `<div class="task-extra">` +
              `<div class="task-extra__title">Бонуси задачі:</div>` +
              task.extraLines.map((line) => `<div class="task-extra__line">${line}</div>`).join("") +
            `</div>`
          )
          : "";

        return (
          `<div class="${itemClass}" data-task-id="${task.id}">` +
            `<div class="task-header">` +
              `<h3 class="task-title">${task.title}</h3>` +
              `<span class="task-mult">x${task.rewards.multiplier}</span>` +
            `</div>` +
            `<div class="task-progress">` +
              `<span class="task-status ${status.cls}">${status.text}</span>` +
              `<span class="task-rewards-wrap">${taskRewardsHtml(task)}</span>` +
            `</div>` +
            `<div class="task-bar"><i style="width:${task.progressPercent}%"></i></div>` +
            extra +
            `<div class="task-actions">` +
              `<button class="task-btn task-btn--go" data-href="${task.href}" ${canGo ? "" : "hidden"}><span>${task.goLabel || "Відкрити"}</span></button>` +
              `<button class="task-btn task-btn--claim" data-task-id="${task.id}" ${task.canClaim ? "" : "disabled"}><span>${claimLabel}</span></button>` +
            `</div>` +
          `</div>`
        );
      }).join("") +
      `<div class="tasks-note">` +
        `Прогрес підсилення карти гільдії: <b>${snapshot.guild.cardBoostProgress}</b>. ` +
        `Бонус HP дракона від покупок золота: <b>+${snapshot.dragonHpBonus}</b>.` +
      `</div>` +
    `</section>`;
}

function updateHeader(snapshot) {
  if (tasksCompletedEl) tasksCompletedEl.textContent = String(snapshot.claimsToday);
  if (currentMulEl) currentMulEl.textContent = `x${snapshot.rewardMultiplier}`;
  if (nextMulEl) {
    const nextMul = snapshot.nextDayMultiplier;
    const toDouble = snapshot.claimsToDouble;
    const toTriple = snapshot.claimsToTriple;
    if (snapshot.claimsToday >= 7) nextMulEl.textContent = `наступний x${nextMul} (готово)`;
    else if (snapshot.claimsToday >= 6) nextMulEl.textContent = `наступний x${nextMul} • до x3: ${toTriple}`;
    else nextMulEl.textContent = `наступний x${nextMul} • до x2: ${toDouble}`;
  }
  if (headerTextEl) {
    const marathonText = snapshot.marathon.isActiveDay
      ? "Сьогодні активний магічний марафон (пн-пт)."
      : "Сьогодні марафон не активний (сб-нд).";
    headerTextEl.innerHTML = `Щоденні завдання: забирайте нагороди в зручний день. <strong>${marathonText}</strong>`;
  }
}

async function refresh() {
  const snapshot = DailyTasksSystem.getSnapshot();
  updateHeader(snapshot);
  renderTasks(snapshot);
  try {
    window.updateGlobalHUD?.();
  } catch {
    // ignore
  }
}

function bindEvents() {
  if (!tasksListEl) return;
  tasksListEl.addEventListener("click", async (e) => {
    const goBtn = e.target.closest(".task-btn--go[data-href]");
    if (goBtn) {
      location.href = goBtn.dataset.href;
      return;
    }

    const claimBtn = e.target.closest(".task-btn--claim[data-task-id]");
    if (!claimBtn) return;
    if (claimBtn.disabled) return;

    claimBtn.disabled = true;
    const taskId = String(claimBtn.dataset.taskId || "");
    const res = await DailyTasksSystem.claimTask(taskId);
    if (!res?.ok) {
      showToast("Завдання ще не готове або вже отримане сьогодні.");
      await refresh();
      return;
    }

    const parts = [];
    if (res.reward?.diamonds > 0) parts.push(`+${res.reward.diamonds} діамантів`);
    if (res.reward?.gold > 0) parts.push(`+${res.reward.gold} золота`);
    if (res.reward?.marathonDiamonds > 0) parts.push(`+${res.reward.marathonDiamonds} марафон-діамантів`);
    if (Array.isArray(res.reward?.cards) && res.reward.cards.length) parts.push(`+${res.reward.cards.length} карт`);
    if (Array.isArray(res.reward?.items) && res.reward.items.length) parts.push(`+${res.reward.items.length} речей`);
    showToast(parts.length ? `Нагорода: ${parts.join(", ")}` : "Нагороду отримано.");
    await refresh();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  refresh();
  setInterval(refresh, 60 * 1000);
});

