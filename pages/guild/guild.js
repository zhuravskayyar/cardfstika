const REQUIRED_LEVEL = 10;

function asLevel(v, fallback = 1) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.round(n));
}

function resolvePlayerLevel() {
  try {
    const progression = window.ProgressionSystem?.getState?.();
    if (progression && Number.isFinite(Number(progression.level))) {
      return asLevel(progression.level, 1);
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem("cardastika:xpTotal");
    const xpTotal = Number(raw);
    if (Number.isFinite(xpTotal) && xpTotal > 0) {
      // Conservative fallback when progression state is unavailable.
      return 1;
    }
  } catch {
    // ignore
  }

  return 1;
}

function applyGateState(level) {
  const gate = document.getElementById("guildGate");
  const levelEl = document.getElementById("guildCurrentLevel");
  const warningEl = document.getElementById("guildGateWarning");
  const hintEl = document.getElementById("guildGateHint");
  const tipEl = document.getElementById("guildTip");

  if (levelEl) levelEl.textContent = String(level);

  if (!gate || !warningEl || !hintEl || !tipEl) return;

  if (level >= REQUIRED_LEVEL) {
    gate.classList.add("is-unlocked");
    warningEl.textContent = "Доступ до гільдії відкрито! Ви можете вступити або створити власну.";
    hintEl.textContent = "Перейдіть до меню гільдії, щоб обрати активність і команду.";
    tipEl.textContent = "Готово: відкривайте рейди, масові бої та бонуси гільдії.";
    return;
  }

  gate.classList.remove("is-unlocked");
  warningEl.textContent = "Щоб вступити в гільдію або створити нову, потрібен 10 рівень!";
  hintEl.textContent = "Рівень вказано у Профілі біля імені.";
  tipEl.textContent = "Перемагайте в Дуелях, отримуйте досвід, підвищуйте рівень.";
}

function setupBenefitsToggle() {
  const btn = document.getElementById("guildBenefitsToggle");
  const panel = document.getElementById("guildBenefits");
  if (!btn || !panel) return;

  btn.addEventListener("click", () => {
    const shouldOpen = panel.hasAttribute("hidden");
    if (shouldOpen) panel.removeAttribute("hidden");
    else panel.setAttribute("hidden", "");
    btn.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupBenefitsToggle();
  const level = resolvePlayerLevel();
  applyGateState(level);
  window.updateGlobalHUD?.();
});
