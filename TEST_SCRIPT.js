/**
 * TEST_SCRIPT.js
 * 
 * Для тестування синхронізації HP та сили колоди.
 * 
 * Використання:
 * 1. Відкрийте консоль (F12)
 * 2. Скопіюйте весь код цього файлу в консоль
 * 3. Запустіть тесту: runTest('basic') або runTest('advanced')
 */

const TEST = {
  // Тестова колода 1: базова
  basicDeck: [
    { id: 'card1', element: 'fire', power: 30, name: 'Fire Mage' },
    { id: 'card2', element: 'water', power: 28, name: 'Water Mage' },
    { id: 'card3', element: 'earth', power: 35, name: 'Earth Guard' },
    { id: 'card4', element: 'air', power: 25, name: 'Air Scout' },
    { id: 'card5', element: 'fire', power: 32, name: 'Fire Dragon' }
  ],

  // Тестова колода 2: сильна
  strongDeck: [
    { id: 'epic1', element: 'fire', power: 50, name: 'Phoenix' },
    { id: 'epic2', element: 'earth', power: 55, name: 'Earth Titan' },
    { id: 'epic3', element: 'water', power: 48, name: 'Ice Mage' },
    { id: 'epic4', element: 'air', power: 52, name: 'Lightning Warrior' }
  ],

  // Тестова колода 3: слабка
  weakDeck: [
    { id: 'weak1', element: 'fire', power: 10, name: 'Weak Fire' },
    { id: 'weak2', element: 'water', power: 8, name: 'Weak Water' },
    { id: 'weak3', element: 'earth', power: 12, name: 'Weak Earth' }
  ],

  // Утиліти для тестування
  utils: {
    /**
     * Встановлює тестову колоду в localStorage
     */
    setDeck: function(deckArray, key = 'cardastika:deck') {
      localStorage.setItem(key, JSON.stringify(deckArray));
      console.log(`✅ Встановлено колоду "${key}" з ${deckArray.length} карт`);
    },

    /**
     * Розраховує загальну силу колоди
     */
    calcPower: function(deckArray) {
      return deckArray.reduce((sum, card) => {
        const power = Number(card?.power ?? card?.basePower ?? 0);
        return sum + power;
      }, 0);
    },

    /**
     * РозраховуєHP противника на основі сили гравця
     */
    calcEnemyHP: function(playerPower) {
      const minHP = playerPower * 0.8;
      const maxHP = playerPower * 1.4;
      return {
        min: Math.round(minHP),
        max: Math.round(maxHP),
        expected: Math.round((minHP + maxHP) / 2)
      };
    },

    /**
     * Очищає localStorage від тестових даних
     */
    cleanup: function() {
      localStorage.removeItem('cardastika:deck');
      localStorage.removeItem('cardastika:playerProfile');
      sessionStorage.removeItem('cardastika:duelEnemy');
      sessionStorage.removeItem('cardastika:playerProfile');
      console.log('✅ localStorage і sessionStorage очищені');
    },

    /**
     * Виводить звіт про стан
     */
    report: function(title) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 ${title}`);
      console.log(`${'='.repeat(60)}`);

      const deckRaw = localStorage.getItem('cardastika:deck');
      const profileRaw = localStorage.getItem('cardastika:playerProfile');
      const enemyRaw = sessionStorage.getItem('cardastika:duelEnemy');

      if (deckRaw) {
        const deck = JSON.parse(deckRaw);
        const power = this.calcPower(deck);
        console.log(`\n📦 Колода (localStorage):`);
        console.log(`   - Карт у колоді: ${deck.length}`);
        console.log(`   - Загальна сила: ${power}`);
        deck.forEach((card, i) => {
          console.log(`     [${i + 1}] ${card.name} (${card.element}) - ${card.power} hp`);
        });
      } else {
        console.log(`\n❌ Колода НЕ знайдена в localStorage`);
      }

      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        console.log(`\n👤 Профіль гравця (localStorage):`);
        console.log(`   - Сила: ${profile.power}`);
        console.log(`   - Silver: ${profile.silver}`);
        console.log(`   - Gold: ${profile.gold}`);
      } else {
        console.log(`\n❌ Профіль гравця НЕ знайдений`);
      }

      if (enemyRaw) {
        const enemy = JSON.parse(enemyRaw);
        console.log(`\n⚔️ Противник (sessionStorage):`);
        console.log(`   - Ім'я: ${enemy.name}`);
        console.log(`   - Рівень: ${enemy.level}`);
        console.log(`   - HP: ${enemy.hp}`);
        console.log(`   - Сила: ${enemy.power}`);
      } else {
        console.log(`\n❌ Противник НЕ знайдений`);
      }

      console.log(`\n${'='.repeat(60)}\n`);
    }
  },

  /**
   * ТЕСТ 1: Базова колода
   */
  runBasicTest: function() {
    console.clear();
    console.log('🧪 ЗАПУСК: Тест базової колоди');

    this.utils.cleanup();
    this.utils.setDeck(this.basicDeck);

    const playerPower = this.utils.calcPower(this.basicDeck);
    const enemyRange = this.utils.calcEnemyHP(playerPower);

    console.log(`\n📈 Розрахунки:`);
    console.log(`   - Сила гравця: ${playerPower}`);
    console.log(`   - HP ворога повинен бути в діапазоні: ${enemyRange.min} - ${enemyRange.max}`);
    console.log(`   - Очікуване значення HP ворога: ~${enemyRange.expected}`);

    this.utils.report('РЕЗУЛЬТАТ: Базова колода');

    console.log(`\n✅ Тест готов. Теперь:`);
    console.log(`   1. Перейдіть на сторінку duel.html`);
    console.log(`   2. Проверьте консоль для логів завантаження`);
    console.log(`   3. Переконайтесь, що playerProfile.power = ${playerPower}`);
  },

  /**
   * ТЕСТ 2: Сильна колода
   */
  runStrongTest: function() {
    console.clear();
    console.log('🧪 ЗАПУСК: Тест сильної колоди');

    this.utils.cleanup();
    this.utils.setDeck(this.strongDeck);

    const playerPower = this.utils.calcPower(this.strongDeck);
    const enemyRange = this.utils.calcEnemyHP(playerPower);

    console.log(`\n📈 Розрахунки:`);
    console.log(`   - Сила гравця: ${playerPower}`);
    console.log(`   - HP ворога повинен бути в діапазоні: ${enemyRange.min} - ${enemyRange.max}`);
    console.log(`   - Очікуване значення HP ворога: ~${enemyRange.expected}`);

    this.utils.report('РЕЗУЛЬТАТ: Сильна колода');

    console.log(`\n✅ Тест готов. Порівняйте результати з базовим тестом.`);
  },

  /**
   * ТЕСТ 3: Слабка колода
   */
  runWeakTest: function() {
    console.clear();
    console.log('🧪 ЗАПУСК: Тест слабої колоди');

    this.utils.cleanup();
    this.utils.setDeck(this.weakDeck);

    const playerPower = this.utils.calcPower(this.weakDeck);
    const enemyRange = this.utils.calcEnemyHP(playerPower);

    console.log(`\n📈 Розрахунки:`);
    console.log(`   - Сила гравця: ${playerPower}`);
    console.log(`   - HP ворога повинен бути в діапазоні: ${enemyRange.min} - ${enemyRange.max}`);
    console.log(`   - Очікуване значення HP ворога: ~${enemyRange.expected}`);

    this.utils.report('РЕЗУЛЬТАТ: Слабка колода');

    console.log(`\n✅ Тест готов. Переконайтесь, що противник також слабкіший.`);
  },

  /**
   * ТЕСТ 4: Синхронізація між duel.js та battle.js
   */
  runSyncTest: function() {
    console.clear();
    console.log('🧪 ЗАПУСК: Тест синхронізації');

    this.utils.cleanup();
    this.utils.setDeck(this.basicDeck);

    const playerPower = this.utils.calcPower(this.basicDeck);
    const enemyRange = this.utils.calcEnemyHP(playerPower);

    // Імітуємо те, що робить duel.js
    const profile = {
      power: playerPower,
      silver: 300,
      gold: 12
    };
    localStorage.setItem('cardastika:playerProfile', JSON.stringify(profile));

    // Імітуємо те, що робить duel.js при генеруванні противника
    const enemyPower = enemyRange.expected;
    const enemy = {
      name: 'Test Enemy',
      type: 'mage',
      level: 5,
      hp: enemyPower,
      power: enemyPower
    };
    sessionStorage.setItem('cardastika:duelEnemy', JSON.stringify(enemy));

    this.utils.report('РЕЗУЛЬТАТ: Синхронізація');

    console.log(`\n✅ Перевірте:`);
    console.log(`   1. localStorage['cardastika:playerProfile'].power = ${playerPower}`);
    console.log(`   2. sessionStorage['cardastika:duelEnemy'].hp = ${enemyPower}`);
    console.log(`   3. Перейдіть на battle.html`);
    console.log(`   4. Перевірте, що HP гравця = ${playerPower} і противника = ${enemyPower}`);
  },

  /**
   * ТЕСТ 5: Порівняння всіх трьох колод
   */
  runComparison: function() {
    console.clear();
    console.log('🧪 ЗАПУСК: Порівняння колод');

    const decks = [
      { name: 'Слабка', data: this.weakDeck },
      { name: 'Базова', data: this.basicDeck },
      { name: 'Сильна', data: this.strongDeck }
    ];

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 ПОРІВНЯННЯ ТРЬОХ КОЛОД');
    console.log(`${'='.repeat(60)}\n`);

    const results = [];

    decks.forEach((deck) => {
      const power = this.utils.calcPower(deck.data);
      const enemyRange = this.utils.calcEnemyHP(power);

      results.push({
        name: deck.name,
        cards: deck.data.length,
        power: power,
        enemyMin: enemyRange.min,
        enemyMax: enemyRange.max,
        enemyExpected: enemyRange.expected
      });

      console.log(`🎴 ${deck.name.toUpperCase()}`);
      console.log(`   - Карт: ${deck.data.length}`);
      console.log(`   - Сила гравця: ${power}`);
      console.log(`   - HP противника очікується: ${enemyRange.min} - ${enemyRange.max} (≈${enemyRange.expected})\n`);
    });

    console.log(`${'='.repeat(60)}`);
    console.log('📈 СТАТИСТИКА');
    console.log(`${'='.repeat(60)}\n`);

    const minPower = Math.min(...results.map(r => r.power));
    const maxPower = Math.max(...results.map(r => r.power));
    const ratio = (maxPower / minPower).toFixed(2);

    console.log(`- Найслабша колода: ${minPower} (${results.find(r => r.power === minPower).name})`);
    console.log(`- Найсильніша колода: ${maxPower} (${results.find(r => r.power === maxPower).name})`);
    console.log(`- Коефіцієнт різниці: ${ratio}x\n`);

    console.log(`✅ Аналіз готов. Використовуйте эти данные для перевірки логіки гри.\n`);
  }
};

/**
 * Головна функція для запуску тестів
 */
function runTest(testName = 'basic') {
  switch (testName.toLowerCase()) {
    case 'basic':
      TEST.runBasicTest();
      break;
    case 'strong':
      TEST.runStrongTest();
      break;
    case 'weak':
      TEST.runWeakTest();
      break;
    case 'sync':
      TEST.runSyncTest();
      break;
    case 'comparison':
    case 'compare':
      TEST.runComparison();
      break;
    default:
      console.log(`\n❌ Невідомий тест: "${testName}"\n`);
      console.log(`📋 Доступні тесты:`);
      console.log(`   - runTest('basic')        : Базова колода (150 hp)`);
      console.log(`   - runTest('strong')       : Сильна колода (205 hp)`);
      console.log(`   - runTest('weak')         : Слабка колода (30 hp)`);
      console.log(`   - runTest('sync')         : Синхронізація duel↔battle`);
      console.log(`   - runTest('comparison')   : Порівняння всіх колод\n`);
  }
}

// Зручний вивід інформації
console.log(`
╔════════════════════════════════════════════════════════════════╗
║ 🧪 TEST SUITE: HP Synchronization                             ║
╠════════════════════════════════════════════════════════════════╣
║ Используйте runTest() для запуска тестів:                     ║
║                                                                ║
║   runTest('basic')       - Базова колода                      ║
║   runTest('strong')      - Сильна колода                      ║
║   runTest('weak')        - Слабка колода                      ║
║   runTest('sync')        - Синхронізація duel↔battle           ║
║   runTest('comparison')  - Порівняння всіх колод              ║
╚════════════════════════════════════════════════════════════════╝
`);