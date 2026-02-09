// src/card-nav.js
(function () {
  function pickCardPayload(el) {
    return {
      uid: el.dataset.cardUid || "",
      id: el.dataset.cardId || "",
      title: el.dataset.cardTitle || "Невідома карта",
      power: Number(el.dataset.cardPower || 0),
      level: Number(el.dataset.cardLevel || 1),
      element: el.dataset.cardElement || "earth",
      rarity: (el.className.match(/rarity-\\d/) || [])[0] || "rarity-1",
      inDeck: el.dataset.cardInDeck === "1",
      protected: el.dataset.cardProtected === "1",
      art: el.dataset.cardArt || "",
    };
  }

  const grid = document.querySelector(".deck-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".ref-card");
    if (!card) return;

    if (!card.dataset.cardTitle && !card.dataset.cardId) return;

    const payload = pickCardPayload(card);
    sessionStorage.setItem("openCard", JSON.stringify(payload));

    const isInPages = location.pathname.includes("/pages/");
    const url = isInPages ? "../card/card.html" : "./pages/card/card.html";
    const inTutorialUpgrade =
      new URLSearchParams(location.search).get("tutorial") === "1" ||
      localStorage.getItem("cardastika:tutorialStage") === "upgrade";
    const nextUrl = inTutorialUpgrade ? `${url}?tutorial=1` : url;
    window.location.href = nextUrl;
  });
})();
