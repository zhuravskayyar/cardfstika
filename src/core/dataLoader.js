// src/core/dataLoader.js
import { validateCardsData, validateCollectionsData } from "./validate.js";

export const GameData = {
  cards: [],
  collections: [],
};

export async function loadGameData() {
  try {
    const [cardsRes, colRes] = await Promise.all([
      fetch(getPath("data/cards.json")),
      fetch(getPath("data/collections.json"))
    ]);

    if (!cardsRes.ok) throw new Error(`cards.json fetch failed: ${cardsRes.status}`);
    if (!colRes.ok) throw new Error(`collections.json fetch failed: ${colRes.status}`);

    const cardsJson = await cardsRes.json();
    const collectionsJson = await colRes.json();

    // DEV-запобіжник
    validateCardsData(cardsJson);
    validateCollectionsData(collectionsJson);

    GameData.cards = cardsJson.cards;
    GameData.collections = collectionsJson.collections;

    console.info("[DATA] Loaded cards:", GameData.cards.length);
    console.info("[DATA] Loaded collections:", GameData.collections.length);

    return GameData;
  } catch (err) {
    console.error("❌ Game data load failed", err);
    throw err;
  }
}

function getPath(path) {
  const isInPages = location.pathname.includes("/pages/");
  return isInPages ? `../../${path}` : `./${path}`;
}
