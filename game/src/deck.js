// Deck building and drawing. A deck is a shuffled list of card ids;
// the discard pile is reshuffled back in when the deck runs dry,
// so a long game never ends on an empty draw.
import { CARD_BY_ID, DECK_LIST, TUNING } from './config.js';
import { shuffle } from './random.js';

let nextInstance = 1;

export function buildDeck(rng) {
  return shuffle(DECK_LIST, rng).map((id) => makeInstance(id));
}

export function makeInstance(cardId) {
  const def = CARD_BY_ID[cardId];
  if (!def) throw new Error(`Unknown card id: ${cardId}`);
  return {
    uid: nextInstance++,
    defId: cardId,
    name: def.name,
    faction: def.faction,
    kind: def.kind,
    cost: def.cost,
    attack: def.attack,
    health: def.health,
    maxHealth: def.health,
    keyword: def.keyword,
    text: def.text,
    damage: 0,
  };
}

export function drawCards(side, count, log) {
  for (let i = 0; i < count; i++) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = shuffle(side.discard, side.rng);
      side.discard = [];
      log.push('The discard pile is shuffled back into the deck.');
    }
    if (side.hand.length >= TUNING.maxHand) {
      side.discard.push(side.deck.pop());
      log.push('Hand is full — a drawn card is discarded.');
      continue;
    }
    side.hand.push(side.deck.pop());
  }
}
