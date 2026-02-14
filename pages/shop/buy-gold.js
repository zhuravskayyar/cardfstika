import "../../src/account.js";
import { DailyTasksSystem } from "../../src/daily-tasks-system.js";

function showToast(message) {
  const host = document.getElementById("toastHost") || document.body;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = String(message || "");
  host.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function grantGold(amount) {
  const add = Math.max(0, Number(amount) || 0);
  if (add <= 0) return;

  const acc = window.AccountSystem?.getActive?.() || null;
  if (acc && window.AccountSystem?.updateActive) {
    window.AccountSystem.updateActive((a) => {
      a.gold = Math.max(0, Number(a.gold || 0) + add);
      return null;
    });
    return;
  }

  const cur = Math.max(0, Number(localStorage.getItem("cardastika:gold") || 0) || 0);
  localStorage.setItem("cardastika:gold", String(cur + add));
}

function updateDragonBonusHint() {
  const hint = document.getElementById("dragonBonusHint");
  if (!hint) return;
  const hpBonus = Math.max(0, Number(DailyTasksSystem.getDragonHpBonus() || 0));
  hint.textContent = `Бонус HP дракона: +${hpBonus}`;
}

function handleGoldPurchase(amount) {
  const gold = Math.max(0, Number(amount) || 0);
  if (!gold) return;

  grantGold(gold);
  const res = DailyTasksSystem.recordGoldPurchase(gold);

  const parts = [`+${gold} золота`];
  if (res?.bonus?.arenaPlaysAdded) parts.push(`+${res.bonus.arenaPlaysAdded} участей у задачі арени`);
  if (res?.bonus?.arenaWinsAdded) parts.push(`+${res.bonus.arenaWinsAdded} перемог у задачі арени`);
  if (res?.bonus?.hpAdded) parts.push(`HP дракона +${res.bonus.hpAdded}`);

  showToast(`Покупка успішна: ${parts.join(", ")}.`);
  updateDragonBonusHint();
  try {
    window.updateGlobalHUD?.();
  } catch {
    // ignore
  }
}

function bind() {
  document.querySelectorAll(".buy-gold-pack[data-gold-pack]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const amount = Number(btn.getAttribute("data-gold-pack") || 0);
      handleGoldPurchase(amount);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bind();
  updateDragonBonusHint();
  try {
    window.updateGlobalHUD?.();
  } catch {
    // ignore
  }
});

