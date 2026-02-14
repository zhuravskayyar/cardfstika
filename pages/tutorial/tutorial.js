import "../../src/account.js";

(() => {
  "use strict";

  const KEYS = {
    authActive: "cardastika:auth:active",
    player: "cardastika:player",
    stage: "cardastika:tutorialStage",
    completed: "cardastika:tutorialCompleted",
    rewardUid: "cardastika:tutorial:rewardUid",
    tasksModalSeen: "cardastika:tutorial:tasksWelcomeShown",
  };

  const STAGE_ELEMENTS = "elements";
  const STAGE_DUEL = "duel";
  const STAGE_UPGRADE = "upgrade";
  const STAGE_BUY = "buy";
  const STAGE_TASKS = "tasks";

  function $(id) {
    return document.getElementById(id);
  }

  function setStage(stage) {
    localStorage.setItem(KEYS.stage, stage);
  }

  function isTutorialCompleted() {
    return localStorage.getItem(KEYS.completed) === "1";
  }

  function ensurePlayerSession() {
    const auth = String(localStorage.getItem(KEYS.authActive) || "").trim();
    if (auth && !localStorage.getItem(KEYS.player)) {
      localStorage.setItem(KEYS.player, auth);
    }
  }

  function ensureStarterBalances() {
    const ensureNum = (key, fallback) => {
      const n = Number(localStorage.getItem(key));
      if (!Number.isFinite(n)) localStorage.setItem(key, String(fallback));
    };
    ensureNum("cardastika:silver", 1500);
    ensureNum("cardastika:gems", Number(localStorage.getItem("cardastika:silver")) || 1500);
    ensureNum("cardastika:diamonds", 0);
    ensureNum("cardastika:gold", 20);
  }

  function removeTutorialReward() {
    const removeFromList = (list) => {
      if (!Array.isArray(list)) return [];
      return list.filter((card) => String(card?.id || "") !== "tutorial_reward_dragon");
    };

    if (window.AccountSystem?.updateActive && window.AccountSystem?.getActive?.()) {
      window.AccountSystem.updateActive((acc) => {
        acc.deck = removeFromList(acc.deck);
        acc.inventory = removeFromList(acc.inventory);
        return null;
      });
      return;
    }

    let deck = [];
    let inventory = [];
    try { deck = JSON.parse(localStorage.getItem("cardastika:deck") || "[]") || []; } catch { deck = []; }
    try { inventory = JSON.parse(localStorage.getItem("cardastika:inventory") || "[]") || []; } catch { inventory = []; }
    localStorage.setItem("cardastika:deck", JSON.stringify(removeFromList(deck)));
    localStorage.setItem("cardastika:inventory", JSON.stringify(removeFromList(inventory)));
  }

  function resetTutorialState() {
    removeTutorialReward();
    localStorage.removeItem(KEYS.completed);
    localStorage.removeItem(KEYS.rewardUid);
    localStorage.removeItem(KEYS.tasksModalSeen);
    try { sessionStorage.removeItem(KEYS.tasksModalSeen); } catch { /* ignore */ }
    localStorage.removeItem("cardastika:tasks:progress");
    localStorage.removeItem("cardastika:tasks:claimed");
    localStorage.removeItem("cardastika:dailyTasks:state");
    localStorage.removeItem("cardastika:dragonHpBonus");
    localStorage.removeItem("cardastika:guild:cardBoostProgress");
    setStage(STAGE_ELEMENTS);
  }

  function routeByStage(stage) {
    if (stage === STAGE_DUEL) {
      window.location.href = "../duel/duel.html?tutorial=1";
      return true;
    }
    if (stage === STAGE_UPGRADE) {
      window.location.href = "../deck/deck.html?tutorial=1";
      return true;
    }
    if (stage === STAGE_BUY) {
      window.location.href = "../shop/shop.html?tutorial=1";
      return true;
    }
    if (stage === STAGE_TASKS) {
      window.location.href = "../tasks/tasks.html?tutorial=complete";
      return true;
    }
    return false;
  }

  function bind() {
    $("toDuelBtn")?.addEventListener("click", () => {
      setStage(STAGE_DUEL);
      window.location.href = "../duel/duel.html?tutorial=1";
    });

    $("restartTutorialBtn")?.addEventListener("click", () => {
      window.location.href = "./tutorial.html?restart=1";
    });
  }

  function init() {
    const params = new URLSearchParams(window.location.search);
    const forceRestart = params.get("restart") === "1";

    const auth = String(localStorage.getItem(KEYS.authActive) || "").trim();
    if (!auth) {
      window.location.href = "./tutorial-auth.html";
      return;
    }

    ensurePlayerSession();
    ensureStarterBalances();

    if (forceRestart) resetTutorialState();

    if (isTutorialCompleted() && !forceRestart) {
      window.location.href = "../tasks/tasks.html";
      return;
    }

    const stage = localStorage.getItem(KEYS.stage) || STAGE_ELEMENTS;
    if (!forceRestart && routeByStage(stage)) return;

    setStage(STAGE_ELEMENTS);
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
