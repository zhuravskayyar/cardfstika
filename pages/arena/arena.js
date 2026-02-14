/**
 * Arena Main Screen Logic
 * Екран арени: черга, рейтинг, завдання, чат
 */

import "../../src/account.js";
import "../../src/progression-system.js";
import { 
  canAccessArena, 
  getArenaLeagueByRating,
  getArenaState,
  getArenaLeagueIconPath,
  ARENA_MIN_DUEL_RATING 
} from "../../src/core/arena-leagues.js";

// ==========================================
// CONSTANTS
// ==========================================

const QUEUE_TIME = 25; // секунди
const CHAT_SERVER_URL = "https://cardastica-server.onrender.com";
const CHAT_ROOM_ID = "global";
const CHAT_MESSAGES_LIMIT = 50;
const CHAT_PING_INTERVAL_MS = 20_000;

// ==========================================
// UTILITIES
// ==========================================

const q = (s) => document.querySelector(s);
const safeJSON = (raw) => { try { return JSON.parse(raw); } catch { return null; } };

function fmtNum(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
}

// ==========================================
// ARENA STATE
// ==========================================

function loadArenaState() {
  const raw = localStorage.getItem('cardastika:arena');
  const state = safeJSON(raw) || {};
  return {
    rating: state.rating || 0,
    tasksPlay: state.tasksPlay ?? 10,
    tasksWin: state.tasksWin ?? 5,
    totalBattles: state.totalBattles || 0,
    totalWins: state.totalWins || 0,
    ...state
  };
}

function saveArenaState(state) {
  localStorage.setItem('cardastika:arena', JSON.stringify(state));
}

// ==========================================
// UI UPDATES
// ==========================================

function updateHUD() {
  // Використовуємо глобальну функцію з ui-shell.js
  if (typeof window.updateGlobalHUD === "function") {
    window.updateGlobalHUD();
  }
}

function updateArenaUI() {
  const arenaState = getArenaState();
  const state = loadArenaState();
  
  // Використовуємо рейтинг з arenaState (нова система ліг)
  const rating = arenaState.rating || state.rating || 1400;
  const league = getArenaLeagueByRating(rating, arenaState.leagueId);
  
  q('#arenaRating').textContent = fmtNum(rating);
  q('#tasksPlay').textContent = state.tasksPlay;
  q('#tasksWin').textContent = state.tasksWin;
  q('#queueTime').textContent = QUEUE_TIME;
  
  // Оновлення ліги
  const leagueIcon = q('#arenaLeagueIcon');
  const leagueName = q('#arenaLeagueName');
  if (leagueIcon && league) {
    leagueIcon.src = getArenaLeagueIconPath(league.id);
  }
  if (leagueName && league) {
    leagueName.textContent = league.name;
  }
}

// ==========================================
// CHAT
// ==========================================

let chatSocket = null;
let chatMessages = [];
let chatPingTimer = null;

function getChatPlayerId() {
  let id = localStorage.getItem("cardastika:playerId") || localStorage.getItem("playerId");
  if (!id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else {
      id = `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    localStorage.setItem("cardastika:playerId", id);
    localStorage.setItem("playerId", id);
  }
  return id;
}

function getChatPlayerName() {
  const fromStorage = String(localStorage.getItem("playerName") || "").trim();
  if (fromStorage) return fromStorage.slice(0, 48);

  const acc = window.AccountSystem?.getActive?.();
  const fromAccount = String(acc?.name || "").trim();
  return (fromAccount || "Player").slice(0, 48);
}

function getChatDeckPower() {
  const acc = window.AccountSystem?.getActive?.();
  const fromAccDeck = Array.isArray(acc?.deck)
    ? acc.deck.reduce((sum, card) => sum + Number(card?.power ?? card?.basePower ?? 0), 0)
    : NaN;

  if (Number.isFinite(fromAccDeck) && fromAccDeck > 0) {
    return Math.round(fromAccDeck);
  }

  const deckFromStorage = safeJSON(localStorage.getItem("cardastika:deck"));
  const fromStorageDeck = Array.isArray(deckFromStorage)
    ? deckFromStorage.reduce((sum, card) => sum + Number(card?.power ?? card?.basePower ?? 0), 0)
    : NaN;

  if (Number.isFinite(fromStorageDeck) && fromStorageDeck > 0) {
    return Math.round(fromStorageDeck);
  }

  const fallback = Number(localStorage.getItem("deckPower") || 0);
  return Number.isFinite(fallback) ? Math.max(0, Math.round(fallback)) : 0;
}

function getChatLeague() {
  const raw = localStorage.getItem("league") || localStorage.getItem("cardastika:league") || "";
  return String(raw).trim();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function setOnlineCount(value) {
  const el = q("#onlineCount");
  if (!el) return;

  const n = Number(value);
  el.textContent = Number.isFinite(n) ? String(Math.max(0, Math.round(n))) : "0";
}

function renderChatMessages() {
  const chatLog = q("#chatLog");
  if (!chatLog) return;

  const rows = chatMessages.slice(-CHAT_MESSAGES_LIMIT);
  if (!rows.length) {
    chatLog.innerHTML = '<div class="ccg-chat__empty">Поки що тиша в чаті.</div>';
    return;
  }

  chatLog.innerHTML = rows.map((m) => {
    const ts = Number(m?.ts);
    const time = Number.isFinite(ts)
      ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";
    return `
      <div class="ccg-chat__msg">
        <div class="ccg-chat__name">${escapeHtml(m?.name || "Player")}</div>
        <div class="ccg-chat__text">${escapeHtml(m?.text || "")}</div>
        <div class="ccg-chat__time">${time}</div>
      </div>
    `;
  }).join("");

  chatLog.scrollTop = chatLog.scrollHeight;
}

function ensureSocketClient() {
  if (typeof window.io === "function") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="socket.io.min.js"]');
    if (existing) {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (typeof window.io === "function") {
          clearInterval(timer);
          resolve();
          return;
        }

        if (Date.now() - startedAt > 6000) {
          clearInterval(timer);
          reject(new Error("socket.io load timeout"));
        }
      }, 60);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

function bindChatSocket() {
  if (!chatSocket || chatSocket.__arenaChatBound === true) return;
  chatSocket.__arenaChatBound = true;

  chatSocket.on("connect", () => {
    const playerId = getChatPlayerId();
    const name = getChatPlayerName();

    chatSocket.emit("presence:hello", {
      playerId,
      name,
      power: getChatDeckPower(),
      league: getChatLeague(),
      profile: { name, level: 1, avatar: "" }
    });

    if (chatPingTimer) {
      clearInterval(chatPingTimer);
    }
    chatPingTimer = setInterval(() => {
      chatSocket?.emit("presence:ping", { playerId });
    }, CHAT_PING_INTERVAL_MS);

    chatSocket.emit("chat:join", { roomId: CHAT_ROOM_ID });
  });

  chatSocket.on("disconnect", () => {
    if (chatPingTimer) {
      clearInterval(chatPingTimer);
      chatPingTimer = null;
    }
  });

  chatSocket.on("presence:update", (snapshot) => {
    setOnlineCount(snapshot?.count ?? 0);
  });

  chatSocket.on("chat:history", (history) => {
    chatMessages = Array.isArray(history) ? history.slice(-CHAT_MESSAGES_LIMIT) : [];
    renderChatMessages();
  });

  chatSocket.on("chat:msg", (msg) => {
    if (!msg || !String(msg.text || "").trim()) return;
    chatMessages.push(msg);
    if (chatMessages.length > CHAT_MESSAGES_LIMIT) {
      chatMessages = chatMessages.slice(-CHAT_MESSAGES_LIMIT);
    }
    renderChatMessages();
  });
}

function sendChatMessage() {
  const input = q("#chatInput");
  if (!input || !chatSocket || !chatSocket.connected) return;

  const text = String(input.value || "").trim();
  if (!text) return;

  chatSocket.emit("chat:msg", {
    roomId: CHAT_ROOM_ID,
    playerId: getChatPlayerId(),
    text: text.slice(0, 240)
  });

  input.value = "";
}

function initArenaChat() {
  const chatForm = q("#chatForm");
  if (!chatForm) return;

  renderChatMessages();
  setOnlineCount(0);

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendChatMessage();
  });

  ensureSocketClient()
    .then(() => {
      if (chatSocket) return;
      chatSocket = window.io(CHAT_SERVER_URL, { transports: ["websocket", "polling"] });
      bindChatSocket();
    })
    .catch((err) => {
      console.warn("[arena-chat] socket init failed", err);
    });

  window.addEventListener("beforeunload", () => {
    if (chatPingTimer) {
      clearInterval(chatPingTimer);
      chatPingTimer = null;
    }
    if (chatSocket) {
      chatSocket.disconnect();
      chatSocket = null;
    }
  }, { once: true });
}

// ==========================================
// QUEUE
// ==========================================

let queueTimer = null;
let queueTime = 0;

function joinQueue() {
  queueTime = QUEUE_TIME;
  
  // Показати модалку черги або перейти на бій
  // Поки що просто переходимо на бій через 2 секунди (демо)
  const btn = q('#joinQueueBtn');
  if (btn) {
    btn.textContent = 'Пошук...';
    btn.disabled = true;
  }
  
  queueTimer = setTimeout(() => {
    // Перехід на бій
    location.href = 'arena-battle.html';
  }, 2000);
}

function cancelQueue() {
  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
  
  const btn = q('#joinQueueBtn');
  if (btn) {
    btn.textContent = 'Записатися';
    btn.disabled = false;
  }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
  // Записатися в чергу
  q('#joinQueueBtn')?.addEventListener('click', () => {
    joinQueue();
  });
  
  // Оновити
  q('#refreshBtn')?.addEventListener('click', () => {
    updateHUD();
    updateArenaUI();
    renderChatMessages();
    if (chatSocket?.connected) {
      chatSocket.emit("chat:join", { roomId: CHAT_ROOM_ID });
    }
  });
}

// ==========================================
// INIT
// ==========================================

function checkArenaAccess() {
  const acc = window.AccountSystem?.getActive?.();
  const duelRating = acc?.duel?.rating ?? 0;
  
  if (!canAccessArena(duelRating)) {
    // Показуємо повідомлення про блокування
    const main = document.querySelector('.arena-screen');
    if (main) {
      main.innerHTML = `
        <div class="arena-locked">
          <div class="arena-locked__header">АРЕНА</div>
          
          <div class="arena-locked__info">
            <p class="arena-locked__desc">Мінімальний рейтинг дуелей, який ви повинні досягти, щоб отримати доступ на арену:</p>
            
            <div class="arena-locked__rating-box">
              <img class="arena-locked__league-icon" src="../../assets/icons/leagues/league-purple-3.svg" alt="Ліга">
              <span class="arena-locked__rating-value">${ARENA_MIN_DUEL_RATING}</span>
            </div>
            
            <p class="arena-locked__tagline">Тільки найсильніші отримують право змагатися на арені!</p>
            
            <a href="arena-rules.html" class="arena-locked__rules-link">» Правила арени «</a>
          </div>
          
          <div class="arena-locked__menu">
            <a href="../tournament/tournament.html" class="arena-menu-btn">
              <span class="arena-menu-btn__icon">🏆</span>
              <span class="arena-menu-btn__text">Турнір</span>
            </a>
            <a href="arena.html" class="arena-menu-btn arena-menu-btn--disabled">
              <span class="arena-menu-btn__icon">📊</span>
              <span class="arena-menu-btn__text">Рейтинг арени</span>
            </a>
            <a href="../tasks/tasks.html" class="arena-menu-btn">
              <span class="arena-menu-btn__icon">📋</span>
              <span class="arena-menu-btn__text">Завдання</span>
            </a>
            <a href="../shop/shop.html" class="arena-menu-btn">
              <span class="arena-menu-btn__icon">🛒</span>
              <span class="arena-menu-btn__text">Крамниця</span>
            </a>
          </div>
        </div>
      `;
      
      // Додаємо стилі для locked екрану
      const style = document.createElement('style');
      style.textContent = `
        .arena-locked {
          display: flex;
          flex-direction: column;
          min-height: 100%;
          gap: 1rem;
        }
        .arena-locked__header {
          background: linear-gradient(90deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.15));
          border: 1px solid rgba(255, 215, 0, 0.5);
          border-radius: 4px;
          padding: 0.75rem 1rem;
          text-align: center;
          font-family: 'Forum', serif;
          font-size: 1.5rem;
          font-weight: 400;
          color: #ffd700;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          letter-spacing: 0.1em;
        }
        .arena-locked__info {
          background: linear-gradient(180deg, rgba(80, 40, 60, 0.6) 0%, rgba(60, 30, 50, 0.8) 100%);
          border: 1px solid rgba(180, 100, 140, 0.4);
          border-radius: 8px;
          padding: 1.5rem 1rem;
          text-align: center;
        }
        .arena-locked__desc {
          font-family: 'EB Garamond', serif;
          font-size: 1rem;
          color: #d4a5c0;
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }
        .arena-locked__rating-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: rgba(30, 30, 50, 0.8);
          border: 2px solid rgba(100, 140, 200, 0.5);
          border-radius: 8px;
          padding: 0.75rem 2rem;
          margin: 0 auto 1rem auto;
          width: fit-content;
        }
        .arena-locked__league-icon {
          width: 32px;
          height: 32px;
        }
        .arena-locked__rating-value {
          font-family: 'Forum', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #60a5fa;
        }
        .arena-locked__tagline {
          font-family: 'EB Garamond', serif;
          font-size: 0.95rem;
          font-style: italic;
          color: #c4a080;
          margin: 0 0 1rem 0;
        }
        .arena-locked__rules-link {
          display: inline-block;
          font-family: 'EB Garamond', serif;
          font-size: 1rem;
          color: #60a5fa;
          text-decoration: none;
          transition: color 0.2s;
        }
        .arena-locked__rules-link:hover {
          color: #93c5fd;
          text-decoration: underline;
        }
        .arena-locked__menu {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: auto;
        }
        .arena-menu-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: url('../../assets/textures/btnwood.png') center/cover;
          border: 1px solid rgba(180, 140, 60, 0.5);
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .arena-menu-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .arena-menu-btn--disabled {
          opacity: 0.5;
          pointer-events: none;
        }
        .arena-menu-btn__icon {
          font-size: 1.5rem;
        }
        .arena-menu-btn__text {
          font-family: 'EB Garamond', serif;
          font-size: 1.1rem;
          color: #e0d0b0;
        }
      `;
      document.head.appendChild(style);
    }
    return false;
  }
  return true;
}

function updateArenaLeagueUI() {
  const state = getArenaState();
  const league = getArenaLeagueByRating(state.rating, state.leagueId, state.highestGlobalLeagueId);
  
  // Оновлюємо рейтинг
  const ratingEl = q('#arenaRating');
  if (ratingEl) ratingEl.textContent = fmtNum(state.rating);
  
  // Показуємо іконку ліги якщо є елемент
  const leagueIcon = q('#arenaLeagueIcon');
  if (leagueIcon && league) {
    leagueIcon.src = getArenaLeagueIconPath(league.id);
    leagueIcon.alt = league.name;
  }
  
  // Показуємо назву ліги
  const leagueName = q('#arenaLeagueName');
  if (leagueName && league) {
    leagueName.textContent = league.name;
  }
}

function init() {
  // Перевіряємо доступ до арени
  if (!checkArenaAccess()) return;
  
  updateHUD();
  updateArenaUI();
  updateArenaLeagueUI();
  initArenaChat();
  setupEventListeners();
}

document.addEventListener('DOMContentLoaded', init);
