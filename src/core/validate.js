// src/core/validate.js
import { GAME_CONSTANTS } from "./constants.js";

export function assert(condition, message) {
  if (!condition) {
    throw new Error(GAME_CONSTANTS.ERROR_PREFIXES.VALIDATION + " " + message);
  }
}

/**
 * @typedef {Object} Card
 * @property {string} id
 * @property {string} title
 * @property {number} basePower
 * @property {string} element
 * @property {string} rarity
 */

/**
 * @param {Card} card
 */
export function validateCard(card) {
  assert(card.id, "card.id missing");
  assert(typeof card.title === "string", `card ${card.id} title invalid`);
  assert(typeof card.basePower === "number", `card ${card.id} basePower invalid`);
  assert(typeof card.element === "string", `card ${card.id} element invalid`);
  assert(typeof card.rarity === "string", `card ${card.id} rarity invalid`);
}

export function validateCardsData(json) {
  assert(json && Array.isArray(json.cards), "cards.json: cards[] missing");
  json.cards.forEach(validateCard);
}

export function validateCollectionsData(json) {
  assert(json && Array.isArray(json.collections), "collections.json: collections[] missing");
}
