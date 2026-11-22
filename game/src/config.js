// Emberfall Duel — card pool and tuning constants.
// Three factions, told apart by colour AND shape: Ember (flame, red),
// Tide (droplet, blue), Thorn (leaf, green). Every card is original.

export const FACTIONS = {
  ember: { name: 'Ember', color: '#e2492f', dark: '#8f1f10', glyph: 'flame' },
  tide: { name: 'Tide', color: '#2f7fd0', dark: '#144a7d', glyph: 'drop' },
  thorn: { name: 'Thorn', color: '#3f9e4d', dark: '#1f5c28', glyph: 'leaf' },
};

// Keywords:
//   swift — strikes first in combat; a creature it kills never strikes back.
//   guard — damage dealt to its lane is assigned to Guard creatures first.
//   rally — other friendly creatures in the same lane get +1 attack.
export const KEYWORDS = {
  swift: 'Swift: strikes first.',
  guard: 'Guard: takes lane damage first.',
  rally: 'Rally: neighbours in this lane +1 attack.',
};

// id, name, faction, kind, cost, attack, health, keyword, text
export const CARDS = [
  { id: 'cinder-pup', name: 'Cinder Pup', faction: 'ember', kind: 'creature', cost: 1, attack: 2, health: 1, keyword: null, text: 'A spark with teeth.' },
  { id: 'spark-sprite', name: 'Spark Sprite', faction: 'ember', kind: 'creature', cost: 1, attack: 1, health: 2, keyword: 'swift', text: 'Quick as a spark.' },
  { id: 'tide-wisp', name: 'Tide Wisp', faction: 'tide', kind: 'creature', cost: 2, attack: 2, health: 2, keyword: null, text: 'Calm water, sharp teeth.' },
  { id: 'thorn-sprout', name: 'Thorn Sprout', faction: 'thorn', kind: 'creature', cost: 2, attack: 1, health: 3, keyword: 'rally', text: 'Roots that rally the lane.' },
  { id: 'ember-hound', name: 'Ember Hound', faction: 'ember', kind: 'creature', cost: 2, attack: 3, health: 2, keyword: null, text: 'It hunts in pairs.' },
  { id: 'reef-guard', name: 'Reef Guard', faction: 'tide', kind: 'creature', cost: 3, attack: 2, health: 4, keyword: 'guard', text: 'A wall of water.' },
  { id: 'flame-imp', name: 'Flame Imp', faction: 'ember', kind: 'creature', cost: 3, attack: 4, health: 3, keyword: null, text: 'Small. Loud. On fire.' },
  { id: 'kelp-lurker', name: 'Kelp Lurker', faction: 'tide', kind: 'creature', cost: 3, attack: 3, health: 3, keyword: 'swift', text: 'Strikes from the deep.' },
  { id: 'briar-knight', name: 'Briar Knight', faction: 'thorn', kind: 'creature', cost: 4, attack: 3, health: 5, keyword: 'guard', text: 'Thorns hold the line.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', faction: 'ember', kind: 'creature', cost: 4, attack: 5, health: 4, keyword: 'swift', text: 'Born of cinders.' },
  { id: 'deep-leviathan', name: 'Deep Leviathan', faction: 'tide', kind: 'creature', cost: 5, attack: 5, health: 6, keyword: null, text: 'The tide has a temper.' },
  { id: 'elder-treant', name: 'Elder Treant', faction: 'thorn', kind: 'creature', cost: 5, attack: 4, health: 7, keyword: 'rally', text: 'Old roots, strong lane.' },
  { id: 'storm-drake', name: 'Storm Drake', faction: 'ember', kind: 'creature', cost: 6, attack: 6, health: 6, keyword: 'swift', text: 'Thunder on wings.' },
  { id: 'tidecaller', name: 'Tidecaller', faction: 'tide', kind: 'creature', cost: 2, attack: 1, health: 2, keyword: null, text: 'Draw a card when played.' },
  { id: 'ember-bolt', name: 'Ember Bolt', faction: 'ember', kind: 'spell', cost: 2, attack: 0, health: 0, keyword: null, text: 'Deal 3 damage to a creature.' },
  { id: 'mend', name: 'Mend', faction: 'thorn', kind: 'spell', cost: 2, attack: 0, health: 0, keyword: null, text: 'Restore 5 life.' },
  { id: 'insight', name: 'Insight', faction: 'tide', kind: 'spell', cost: 1, attack: 0, health: 0, keyword: null, text: 'Draw 2 cards.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// Two copies of each of these twelve make a 24-card deck.
export const DECK_LIST = [
  'cinder-pup', 'cinder-pup',
  'spark-sprite', 'spark-sprite',
  'tide-wisp', 'tide-wisp',
  'thorn-sprout', 'thorn-sprout',
  'ember-hound', 'ember-hound',
  'reef-guard', 'reef-guard',
  'flame-imp', 'flame-imp',
  'kelp-lurker', 'kelp-lurker',
  'briar-knight', 'briar-knight',
  'ash-phoenix', 'ash-phoenix',
  'ember-bolt', 'ember-bolt',
  'mend', 'mend',
];

export const TUNING = {
  startLife: 20,
  maxLife: 20,
  startHand: 5,
  maxHand: 9,
  maxMana: 10,
  lanes: 3,
  maxPerLane: 2,
  boltDamage: 3,
  mendHeal: 5,
  insightDraw: 2,
  aiThinkMs: 550,
};
