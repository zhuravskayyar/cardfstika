// src/ui-shell.js
// РњС–РЅС–РјР°Р»СЊРЅРёР№ shell: Р°РєС‚РёРІРЅР° РєРЅРѕРїРєР° botbar + РїРµСЂРµС…РѕРґРё РїРѕ СЃС‚РѕСЂС–РЅРєР°С… (MPA).
import "./account.js";
import "./progression-system.js";
import { loadGameData } from "./core/dataLoader.js";
import { GAME_CONSTANTS } from "./core/constants.js";
import { installMojibakeRepairer } from "./core/mojibake.js";

let _mojibakeObserver = null;
function ensureMojibakeRepairer() {
  if (_mojibakeObserver) return;
  try {
    if (document?.body) _mojibakeObserver = installMojibakeRepairer(document.body);
  } catch {
    // ignore
  }
}

// Run as early as possible (script is loaded with defer).
ensureMojibakeRepairer();

function getRoutes() {
  // Compute BASE_PATH for deployments (GitHub Pages uses username.github.io/<repo>/)
  const path = location.pathname.replaceAll("\\", "/");
  const parts = path.split("/").filter(Boolean);
  const isGithub = location.hostname.endsWith("github.io");
  const BASE_PATH = isGithub && parts.length ? `/${parts[0]}/` : "/";

  return {
    home:        `${BASE_PATH}index.html`,
    deck:        `${BASE_PATH}pages/deck/deck.html`,
    guild:       `${BASE_PATH}pages/guild/guild.html`,
    shop:        `${BASE_PATH}pages/shop/shop.html`,
    collections: `${BASE_PATH}pages/collections/collections.html`,
    duel:        `${BASE_PATH}pages/duel/duel.html`,
    profile:     `${BASE_PATH}pages/profile/profile.html`,
  };
}

function setActiveRoute(route) {
  document.querySelectorAll(".botbar__btn").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.route === route);
  });
}

function guessRouteFromPath() {
  const p = location.pathname.replaceAll("\\", "/").toLowerCase();
  if (p.includes("/deck/")) return "deck";
  if (p.includes("/guild/")) return "guild";
  if (p.includes("/shop/")) return "shop";
  if (p.includes("/collections/")) return "collections";
  if (p.includes("/duel/")) return "duel";
  if (p.includes("/profile/")) return "profile";
  return "home";
}

function go(route) {
  const ROUTES = getRoutes();
  const url = ROUTES[route];
  if (!url) return;

  // РџСЂРѕСЃС‚РёР№ fade-out С‰РѕР± РїРµСЂРµС…РѕРґРё Р±СѓР»Рё "С–РіСЂРѕРІС–"
  document.body.style.transition = "opacity .22s ease";
  document.body.style.opacity = "0";

  setTimeout(() => {
    location.href = url;
  }, GAME_CONSTANTS.TRANSITION_DURATION_MS);
}

function assetPrefix() {
  const path = location.pathname.replaceAll("\\", "/");
  const parts = path.split("/").filter(Boolean);
  const isGithub = location.hostname.endsWith("github.io");
  const BASE_PATH = isGithub && parts.length ? `/${parts[0]}/` : "/";
  return BASE_PATH;
}

function fmtK(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "-";
  const abs = Math.abs(v);
  if (abs < 1000) return String(Math.round(v));
  const k = abs / 1000;
  const str = k < 10 ? k.toFixed(1) : k.toFixed(0);
  const cleaned = str.replace(/\.0$/, "");
  return `${v < 0 ? "-" : ""}${cleaned}k`;
}

function ensureHud() {
  const app = document.getElementById("app") || document.querySelector(".app");
  if (!app) return;

  let hud = document.getElementById("hud");
  if (!hud) {
    hud = document.createElement("header");
    hud.id = "hud";
    hud.className = "hud";
    hud.innerHTML = `
      <div class="hud__left">
        <div class="hud__avatar">
          <img id="hudAvatar" alt="Avatar" src="${assetPrefix()}assets/cards/demo/fire_01.jpg">
        </div>
        <span class="hud__icon hud__icon--swords" id="hudSword" aria-hidden="true"></span>
        <span class="hud__value" id="hudPower">-</span>
      </div>
      <div class="hud__right">
        <div class="hud__pill hud__pill--silver" title="Silver"><span class="hud__value" id="hudSilver">-</span><img class="hud__currency-icon" src="${assetPrefix()}assets/icons/coin-silver.svg" alt=""></div>
        <div class="hud__pill hud__pill--diamonds" title="Diamonds" style="display:none"><span class="hud__value" id="hudDiamonds">-</span><img class="hud__currency-icon" src="${assetPrefix()}assets/icons/diamond.svg" alt=""></div>
        <div class="hud__pill hud__pill--gold" title="Gold"><span class="hud__value" id="hudGold">-</span><img class="hud__currency-icon" src="${assetPrefix()}assets/icons/coin-gold.svg" alt=""></div>
      </div>
    `;
 app.prepend(hud);
  }

  const left = hud.querySelector(".hud__left") || hud;

  // Remove any legacy league UI from HUD (should not show in HUD anymore)
  hud.querySelectorAll(
    ".hud__league, .hud__league-badge, .hud__league-icon, #hudLeague, [data-hud-league]"
  ).forEach((el) => el.remove());

  if (!hud.querySelector(".hud__avatar")) {
    const avatar = document.createElement("div");
    avatar.className = "hud__avatar";
    avatar.innerHTML = `<img id="hudAvatar" alt="Avatar" src="${assetPrefix()}assets/cards/demo/fire_01.jpg">`;
    left.prepend(avatar);
  }

  // Ensure avatar is only the image (no extra badges/overlays inside)
  const avatarWrap = hud.querySelector(".hud__avatar");
  if (avatarWrap) {
    avatarWrap.querySelectorAll(":scope > :not(img)").forEach((el) => el.remove());
  }

  // Ensure currency pills are value + svg icon
  const ensurePill = (id, pillClass, iconSrc) => {
    const valueEl = document.getElementById(id);
    const pill = valueEl?.closest?.(".hud__pill") || hud.querySelector(`.hud__pill.${pillClass}`);
    if (!pill) return;
    pill.classList.add(pillClass);
    pill.innerHTML = `<span class="hud__value" id="${id}">-</span><img class="hud__currency-icon" src="${iconSrc}" alt="">`;
  };
  ensurePill("hudSilver", "hud__pill--silver", `${assetPrefix()}assets/icons/coin-silver.svg`);
  ensurePill("hudDiamonds", "hud__pill--diamonds", `${assetPrefix()}assets/icons/diamond.svg`);
  ensurePill("hudGold", "hud__pill--gold", `${assetPrefix()}assets/icons/coin-gold.svg`);

  if (!hud.querySelector(".hud__xpbar")) {
    const xp = document.createElement("div");
    xp.className = "hud__xpbar";
    xp.innerHTML = `<div class="hud__xpbar-fill" id="hudXpFill"></div>`;
    hud.appendChild(xp);
  }

  // Ensure the HUD power icon is the white swords SVG (via CSS mask).
  const powerValue = hud.querySelector("#hudPower");
  let sword = hud.querySelector("#hudSword") || left.querySelector(".hud__icon");

  if (!sword) {
    sword = document.createElement("span");
    sword.className = "hud__icon hud__icon--swords";
    sword.id = "hudSword";
    sword.setAttribute("aria-hidden", "true");
    if (powerValue) powerValue.before(sword);
    else left.appendChild(sword);
  } else if (sword.tagName === "IMG") {
    const replacement = document.createElement("span");
    replacement.className = sword.className;
    replacement.id = sword.id || "hudSword";
    replacement.setAttribute("aria-hidden", "true");
    sword.replaceWith(replacement);
    sword = replacement;
  }

  sword.classList.add("hud__icon", "hud__icon--swords");
  if (!sword.id) sword.id = "hudSword";
  sword.textContent = "";
  sword.setAttribute("aria-hidden", "true");
}

document.addEventListener("DOMContentLoaded", async () => {
  ensureMojibakeRepairer();
  ensureHud();

  try {
    await loadGameData();
  } catch (err) {
    console.warn("[ui-shell] failed to load game data (fetch). Navigation/HUD will still work.", err);
  }

  // Показувати головну сторінку при першому відкритті сайту
  try {
    const FIRST_KEY = "cardastika:firstRunShown";
    if (!localStorage.getItem(FIRST_KEY)) {
      // Встановлюємо прапорець щоб модальне вітання не показувалось повторно
      localStorage.setItem(FIRST_KEY, "1");

      // Показуємо модальне вітання поверх поточної сторінки
      const inPages = location.pathname.toLowerCase().includes("/pages/");
      const authPath = inPages ? "../auth/auth.html" : "./pages/auth/auth.html";

      const overlay = document.createElement("div");
      overlay.className = "welcome-modal";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(0,0,0,0.6)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.zIndex = "9999";

      const card = document.createElement("div");
      card.className = "welcome-card";
      card.style.width = "520px";
      card.style.maxWidth = "92%";
      card.style.background = "linear-gradient(#1b120d, #0f0a08)";
      card.style.border = "1px solid rgba(255,215,130,0.12)";
      card.style.padding = "28px";
      card.style.borderRadius = "12px";
      card.style.boxShadow = "0 6px 30px rgba(0,0,0,0.6)";
      card.style.color = "#f3e7d2";
      card.style.textAlign = "center";

      card.innerHTML = `
        <h1 style="font-family: 'EB Garamond', serif; font-size:48px; margin:0 0 8px;">Cardastika</h1>
        <p style="margin:0 0 20px; font-size:16px; color:#eedfbf">Збери унікальну колоду магічних карт і кинь виклик стихіям.</p>
        <div style="display:flex; gap:12px; justify-content:center; margin-top:18px">
          <button id="welcomeStartBtn" style="background:#8f6f39; color:white; border:none; padding:12px 24px; border-radius:8px; font-size:16px;">Почати гру</button>
          <button id="welcomeLoginBtn" style="background:#1e5e85; color:white; border:none; padding:12px 24px; border-radius:8px; font-size:16px">Вхід для гравців</button>
        </div>
      `;

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      const removeModal = () => {
        try { overlay.remove(); } catch(e) {}
      };

      document.getElementById("welcomeStartBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        removeModal();
      });

      document.getElementById("welcomeLoginBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        // Перехід на сторінку авторизації
        location.href = authPath;
      });
    }
  } catch (e) {
    // ignore
  }

  const route = guessRouteFromPath();
  setActiveRoute(route);
  const diamondsPill = document.getElementById("hudDiamonds")?.closest?.(".hud__pill");
  if (diamondsPill) diamondsPill.style.display = route === "shop" ? "" : "none";

  const botbar = document.getElementById("botbar");
  const wireBotbarButton = (btn) => {
    if (!btn || btn.dataset.boundNav === "1") return;
    btn.dataset.boundNav = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const routeName = String(btn.dataset.route || "").trim();
      if (!routeName) return;
      go(routeName);
    });
  };

  // Primary delegation
  botbar?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-route]");
    if (!btn) return;
    const routeName = String(btn.dataset.route || "").trim();
    if (!routeName) return;
    go(routeName);
  });

  // Fallback direct handlers (resilient when delegation is blocked by other scripts)
  botbar?.querySelectorAll("[data-route]")?.forEach(wireBotbarButton);

  // HUD values from active account / storage
  const hudPower = document.getElementById("hudPower");
  const hudSilver = document.getElementById("hudSilver");
  const hudDiamonds = document.getElementById("hudDiamonds");
  const hudGold = document.getElementById("hudGold");
  const hudAvatar = document.getElementById("hudAvatar");
  const hudXpFill = document.getElementById("hudXpFill");

  const acc = window.AccountSystem?.getActive?.() || null;
  const st = window.ProgressionSystem?.getState?.() || null;

  function readNum(key) {
    const n = Number(localStorage.getItem(key));
    return Number.isFinite(n) ? n : null;
  }

  function deckPower(deck) {
    if (!Array.isArray(deck)) return null;
    const sum = deck.reduce((s, c) => s + Number(c?.power ?? c?.basePower ?? 0), 0);
    return Number.isFinite(sum) && sum > 0 ? Math.round(sum) : null;
  }

  const power =
    deckPower(acc?.deck) ??
    deckPower((() => {
      try {
        return JSON.parse(localStorage.getItem("cardastika:deck") || "null");
      } catch {
        return null;
      }
    })());

  if (hudPower && power != null) hudPower.textContent = fmtK(power);

  // HUD avatar + league + XP bar
  try {
    if (hudAvatar) {
      const fromStorage = String(localStorage.getItem("cardastika:avatarUrl") || "").trim();
      hudAvatar.src = fromStorage || `${assetPrefix()}assets/cards/demo/fire_01.jpg`;
    }

    if (hudXpFill) {
      const level = Number.isFinite(Number(st?.level)) ? Math.round(Number(st.level)) : null;
      const into = Number.isFinite(Number(st?.xpIntoLevel)) ? Math.max(0, Math.round(Number(st.xpIntoLevel))) : 0;
      const nextReq = st?.xpForNextLevel == null ? null : Math.max(1, Math.round(Number(st.xpForNextLevel)));
      const pct = nextReq ? Math.max(0, Math.min(100, Math.round((into / nextReq) * 100))) : 100;
      hudXpFill.style.width = `${pct}%`;
      hudXpFill.parentElement?.setAttribute("title", level != null ? `LVL ${level} • XP ${into}/${nextReq ?? into}` : `XP ${into}`);
    }
  } catch (e) {
    console.warn("[ui-shell] hud avatar/league/xp failed", e);
  }
  // РўР°РєР¶Рµ РѕР±РЅРѕРІР»СЏРµРј РєР°СЂС‚РѕС‡РєСѓ РЅР° РіР»Р°РІРЅРѕР№ (tile) РµСЃР»Рё РѕРЅР° РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚
  const tileDeckPowerEl = document.getElementById("tileDeckPower");
  const tileDeckNameEl = document.getElementById("tileDeckName");
  if (tileDeckPowerEl && power != null) tileDeckPowerEl.textContent = fmtK(power);
  if (tileDeckNameEl) tileDeckNameEl.textContent = "Бойова колода";

  const silver =
    (Number.isFinite(Number(acc?.silver)) ? Number(acc.silver) : null) ??
    readNum("cardastika:silver") ??
    readNum("cardastika:gems") ??
    1500;
  if (hudSilver) hudSilver.textContent = fmtK(Math.max(0, Math.round(silver)));

  const diamonds =
    (Number.isFinite(Number(acc?.diamonds)) ? Number(acc.diamonds) : null) ??
    readNum("cardastika:diamonds") ??
    0;
  if (hudDiamonds && route === "shop") hudDiamonds.textContent = fmtK(Math.max(0, Math.round(diamonds)));

  const gold =
    (Number.isFinite(Number(acc?.gold)) ? Number(acc.gold) : null) ??
    readNum("cardastika:gold") ??
    0;
  if (hudGold) hudGold.textContent = fmtK(Math.max(0, Math.round(gold)));
});

