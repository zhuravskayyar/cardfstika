// src/core/constants.js - Константи гри

export const GAME_CONSTANTS = {
  // Часові інтервали
  TRANSITION_DURATION_MS: 180,
  FADE_OUT_DURATION_MS: 220,
  TOAST_DURATION_MS: 3000,

  // Максимальні значення
  MAX_LEVEL: 120,
  MAX_DUELS_PER_DAY: 10,
  MAX_DAILY_GAINS: 120,

  // Інтервали
  GOLD_LEVEL_INTERVAL: 5,

  // Префікси помилок
  ERROR_PREFIXES: {
    VALIDATION: '[VALIDATION]',
    DATA_LOAD: '[DATA]',
    NETWORK: '[NETWORK]',
    ACCOUNT: '[ACCOUNT]'
  },

  // Елементи
  ELEMENTS: ['fire', 'water', 'air', 'earth'],

  // Рідкості
  RARITIES: ['rarity-1', 'rarity-2', 'rarity-3', 'rarity-4', 'rarity-5', 'rarity-6'],

  // Мультиплікатори елементів
  ELEMENT_MULTIPLIERS: {
    fire:  { fire: 1.0, water: 0.5, air: 1.5, earth: 1.0 },
    water: { fire: 1.5, water: 1.0, air: 0.5, earth: 0.5 },
    air:   { fire: 0.5, water: 1.0, air: 1.0, earth: 1.5 },
    earth: { fire: 1.0, water: 1.5, air: 0.5, earth: 1.0 }
  }
};

