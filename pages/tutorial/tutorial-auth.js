import "../../src/account.js";

(() => {
  "use strict";

  const AUTH_DB_KEY = "cardastika:auth:users";
  const AUTH_ACTIVE_KEY = "cardastika:auth:active";
  const AUTH_REMEMBER_KEY = "cardastika:auth:remember";
  const PLAYER_KEY = "cardastika:player";

  const TUTORIAL_STAGE_KEY = "cardastika:tutorialStage";
  const TUTORIAL_COMPLETED_KEY = "cardastika:tutorialCompleted";
  const TUTORIAL_REWARD_UID_KEY = "cardastika:tutorial:rewardUid";

  const STARTER_DECK_SIZE = 9;
  const STARTER_CARD_POWER = 12;
  const STARTER_SILVER = 1500;
  const STARTER_DIAMONDS = 0;
  const STARTER_GOLD = 20;

  const RARITY_TO_NUM = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
    mythic: 6,
    "rarity-1": 1,
    "rarity-2": 2,
    "rarity-3": 3,
    "rarity-4": 4,
    "rarity-5": 5,
    "rarity-6": 6,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function newUid() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  async function sha256(text) {
    const enc = new TextEncoder().encode(String(text || ""));
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function validAuthName(name) {
    const n = String(name || "").trim();
    if (n.length < 3 || n.length > 24) return false;
    return /^[a-zA-Z0-9._\-А-Яа-яІіЇїЄєҐґ]+$/.test(n);
  }

  function validAuthPass(pass) {
    const p = String(pass || "");
    return p.length >= 6 && p.length <= 64;
  }

  function loadAuthUsers() {
    try {
      const raw = localStorage.getItem(AUTH_DB_KEY);
      const users = raw ? JSON.parse(raw) : {};
      return users && typeof users === "object" ? users : {};
    } catch {
      return {};
    }
  }

  function saveAuthUsers(users) {
    localStorage.setItem(AUTH_DB_KEY, JSON.stringify(users || {}));
  }

  function normalizeElement(raw) {
    const s = String(raw || "").toLowerCase().trim();
    if (["fire", "water", "air", "earth"].includes(s)) return s;
    if (s === "wind") return "air";
    return "earth";
  }

  function rarityToNumber(raw) {
    if (typeof raw === "number" && Number.isFinite(raw)) return clamp(Math.round(raw), 1, 6);
    const s = String(raw || "").toLowerCase().trim();
    if (RARITY_TO_NUM[s]) return RARITY_TO_NUM[s];
    const m = s.match(/^rarity-([1-6])$/);
    if (m) return Number(m[1]);
    return 1;
  }

  function buildStarterCard(base, idx) {
    const num = String(idx + 1).padStart(2, "0");
    const id = String(base?.id || `starter_${num}`);
    const title = String(base?.title || base?.name || id);
    const art = String(base?.art || "");
    return {
      uid: newUid(),
      id,
      name: title,
      title,
      element: normalizeElement(base?.element),
      power: STARTER_CARD_POWER,
      basePower: STARTER_CARD_POWER,
      bonusFixed: 0,
      rarity: rarityToNumber(base?.rarity),
      level: 1,
      elementsStored: 0.02,
      protected: false,
      inDeck: true,
      art,
    };
  }

  async function createStarterDeck() {
    const out = [];

    try {
      const r = await fetch("../../data/cards.json", { cache: "no-store" });
      if (r.ok) {
        const json = await r.json();
        const cards = Array.isArray(json?.cards) ? json.cards : [];
        const starters = cards.filter((c) => c && typeof c === "object" && String(c.id || "").startsWith("starter_"));
        for (let i = 0; i < Math.min(STARTER_DECK_SIZE, starters.length); i++) out.push(buildStarterCard(starters[i], i));
      }
    } catch {
      // ignore
    }

    if (out.length < STARTER_DECK_SIZE) {
      try {
        const r = await fetch("../../assets/data/cards.base.json", { cache: "no-store" });
        if (r.ok) {
          const pool = await r.json();
          if (Array.isArray(pool)) {
            for (let i = out.length; i < Math.min(STARTER_DECK_SIZE, pool.length); i++) out.push(buildStarterCard(pool[i], i));
          }
        }
      } catch {
        // ignore
      }
    }

    for (let i = out.length; i < STARTER_DECK_SIZE; i++) out.push(buildStarterCard(null, i));
    return out.slice(0, STARTER_DECK_SIZE);
  }

  async function ensureGameAccount(name) {
    const starterDeck = await createStarterDeck();
    const starterInventory = starterDeck.map((c) => ({ ...c }));

    if (window.AccountSystem?.create && window.AccountSystem?.exists && window.AccountSystem?.setActive) {
      if (!window.AccountSystem.exists(name)) {
        window.AccountSystem.create(name, starterDeck, {
          starterInventory,
          silver: STARTER_SILVER,
          diamonds: STARTER_DIAMONDS,
          gold: STARTER_GOLD,
        });
      }
      window.AccountSystem.setActive(name);
      return;
    }

    localStorage.setItem("cardastika:deck", JSON.stringify(starterDeck));
    localStorage.setItem("cardastika:inventory", JSON.stringify(starterInventory));
    localStorage.setItem("cardastika:silver", String(STARTER_SILVER));
    localStorage.setItem("cardastika:gems", String(STARTER_SILVER));
    localStorage.setItem("cardastika:diamonds", String(STARTER_DIAMONDS));
    localStorage.setItem("cardastika:gold", String(STARTER_GOLD));
  }

  function showError(text) {
    const errorEl = $("regError");
    if (!errorEl) return;
    errorEl.textContent = String(text || "");
    errorEl.hidden = !text;
  }

  async function handleRegister() {
    const nameEl = $("regName");
    const passEl = $("regPass");
    const btn = $("regBtn");

    const name = String(nameEl?.value || "").trim();
    const pass = String(passEl?.value || "");

    if (!validAuthName(name)) {
      showError("Ім'я: 3-24 символи, тільки літери, цифри, _, -, .");
      return;
    }
    if (!validAuthPass(pass)) {
      showError("Пароль: мінімум 6 символів.");
      return;
    }

    const users = loadAuthUsers();
    if (users[name]) {
      showError("Ім'я вже зайняте.");
      return;
    }

    if (btn) btn.disabled = true;
    showError("");

    try {
      const passHash = await sha256(pass);
      users[name] = { passHash, created: Date.now() };
      saveAuthUsers(users);

      await ensureGameAccount(name);

      localStorage.setItem(AUTH_ACTIVE_KEY, name);
      localStorage.setItem(AUTH_REMEMBER_KEY, "1");
      localStorage.setItem(PLAYER_KEY, name);

      localStorage.setItem(TUTORIAL_STAGE_KEY, "elements");
      localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
      localStorage.removeItem(TUTORIAL_REWARD_UID_KEY);
      localStorage.removeItem("cardastika:tutorial:tasksWelcomeShown");
      localStorage.removeItem("cardastika:tasks:progress");
      localStorage.removeItem("cardastika:tasks:claimed");
      localStorage.removeItem("cardastika:dailyTasks:state");
      localStorage.removeItem("cardastika:dragonHpBonus");
      localStorage.removeItem("cardastika:guild:cardBoostProgress");

      window.location.href = "./tutorial.html";
    } catch {
      showError("Помилка реєстрації. Спробуй ще раз.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function bind() {
    const form = $("tutorialAuthForm");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleRegister();
    });

    $("regName")?.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
