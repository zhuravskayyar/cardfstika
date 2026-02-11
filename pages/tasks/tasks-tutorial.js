(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  if (params.get("tutorial") !== "complete") return;

  const shownKey = "cardastika:tutorial:tasksWelcomeShown";
  if (sessionStorage.getItem(shownKey) === "1") return;
  sessionStorage.setItem(shownKey, "1");
  localStorage.setItem("cardastika:tutorialCompleted", "1");
  localStorage.setItem("cardastika:tutorialStage", "tasks");

  const host = document.getElementById("modalHost") || document.body;
  if (host.id === "modalHost") {
    host.classList.add("is-open");
    host.setAttribute("aria-hidden", "false");
  }

  host.innerHTML = `
    <section class="tasks-tutorial-wrap" role="dialog" aria-modal="true" aria-label="Завершення туторіалу">
      <article class="tasks-tutorial-modal">
        <div class="tasks-tutorial-confetti" id="tasksTutorialConfetti"></div>
        <h3>Вітаємо з туторіалом!</h3>
        <p>Тепер ти знаєш базу: стихії, дуелі, прокачку карт і покупки в крамниці.</p>
        <button id="tasksTutorialClose" type="button" class="tutorial-btn">Перейти до завдань</button>
      </article>
    </section>
  `;

  const confettiHost = document.getElementById("tasksTutorialConfetti");
  if (confettiHost) {
    const colors = ["#f5cb72", "#71d3a3", "#7db9ff", "#ff8f8f", "#d8a5ff"];
    for (let i = 0; i < 46; i++) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty("--d", `${1600 + Math.random() * 1800}ms`);
      bit.style.setProperty("--delay", `${Math.random() * 420}ms`);
      confettiHost.appendChild(bit);
    }
  }

  document.getElementById("tasksTutorialClose")?.addEventListener("click", () => {
    if (host.id === "modalHost") {
      host.classList.remove("is-open");
      host.setAttribute("aria-hidden", "true");
      host.innerHTML = "";
    } else {
      const wrap = host.querySelector(".tasks-tutorial-wrap");
      wrap?.remove();
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("tutorial");
    window.history.replaceState(null, "", url.toString());
  });
})();
