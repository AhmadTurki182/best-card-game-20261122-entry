// Game state and rules: turns, mana, playing cards, spells,
// lane combat (Swift pre-strike, Guard-first damage, Rally buffs,
// spillover into an empty lane) and the win/loss checks.
import { CARD_BY_ID, TUNING } from './config.js';
import { buildDeck, drawCards, makeInstance } from './deck.js';
import { makeRng } from './random.js';

export function newSide(rng) {
  return {
    rng,
    life: TUNING.startLife,
    mana: 0,
    manaMax: 0,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
    lanes: Array.from({ length: TUNING.lanes }, () => []),
  };
}

export function newGame(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    phase: 'title', // title | playing | combat | won | lost
    turn: 0,
    player: newSide(makeRng(seed ^ 0x9e37)),
    ai: newSide(makeRng(seed ^ 0x51f7)),
    log: ['Welcome to Emberfall Duel.'],
    lastEvents: [],
    winner: null,
  };
  drawCards(state.player, TUNING.startHand, state.log);
  drawCards(state.ai, TUNING.startHand, state.log);
  return state;
}

export function startPlayerTurn(state) {
  state.turn += 1;
  const p = state.player;
  p.manaMax = Math.min(TUNING.maxMana, state.turn);
  p.mana = p.manaMax;
  drawCards(p, 1, state.log);
  state.log.push(`Turn ${state.turn} — you have ${p.mana} ember.`);
}

export function startAiTurn(state) {
  const a = state.ai;
  a.manaMax = Math.min(TUNING.maxMana, state.turn);
  a.mana = a.manaMax;
  drawCards(a, 1, state.log);
}

// Effective attack: base attack plus +1 for each other friendly
// Rally creature sharing the lane.
export function effectiveAttack(side, laneIndex, creature) {
  const lane = side.lanes[laneIndex];
  let bonus = 0;
  for (const other of lane) {
    if (other !== creature && other.keyword === 'rally') bonus += 1;
  }
  return creature.attack + bonus;
}

export function laneTotalAttack(side, laneIndex) {
  return side.lanes[laneIndex].reduce(
    (sum, c) => sum + effectiveAttack(side, laneIndex, c),
    0,
  );
}

export function canPlay(state, card) {
  return state.phase === 'playing' && card.cost <= state.player.mana;
}

export function playableLanes(state) {
  const lanes = [];
  for (let i = 0; i < TUNING.lanes; i++) {
    if (state.player.lanes[i].length < TUNING.maxPerLane) lanes.push(i);
  }
  return lanes;
}

export function playCreature(state, handIndex, laneIndex) {
  const p = state.player;
  const card = p.hand[handIndex];
  if (!card || card.kind !== 'creature') return false;
  if (card.cost > p.mana) return false;
  if (p.lanes[laneIndex].length >= TUNING.maxPerLane) return false;
  p.mana -= card.cost;
  p.hand.splice(handIndex, 1);
  p.lanes[laneIndex].push(card);
  state.log.push(`You play ${card.name} in lane ${laneIndex + 1}.`);
  state.lastEvents.push({ type: 'play', lane: laneIndex, name: card.name, who: 'player' });
  if (card.defId === 'tidecaller') {
    drawCards(p, 1, state.log);
    state.log.push('Tidecaller draws you a card.');
  }
  return true;
}

export function playSpell(state, handIndex, target) {
  const p = state.player;
  const card = p.hand[handIndex];
  if (!card || card.kind !== 'spell') return false;
  if (card.cost > p.mana) return false;
  if (card.defId === 'ember-bolt') {
    if (!target || target.who !== 'ai' || target.creature == null) return false;
    const lane = state.ai.lanes[target.lane];
    const victim = lane[target.creature];
    if (!victim) return false;
    p.mana -= card.cost;
    p.hand.splice(handIndex, 1);
    victim.damage += TUNING.boltDamage;
    state.log.push(`Ember Bolt hits ${victim.name} for ${TUNING.boltDamage}.`);
    state.lastEvents.push({ type: 'bolt', lane: target.lane, name: victim.name, who: 'ai' });
    if (victim.damage >= victim.health) {
      lane.splice(target.creature, 1);
      state.ai.discard.push(victim);
      state.log.push(`${victim.name} burns away.`);
    }
    return true;
  }
  if (card.defId === 'mend') {
    p.mana -= card.cost;
    p.hand.splice(handIndex, 1);
    const healed = Math.min(TUNING.mendHeal, TUNING.maxLife - p.life);
    p.life += healed;
    state.log.push(`Mend restores ${healed} life.`);
    state.lastEvents.push({ type: 'heal', who: 'player', amount: healed });
    return true;
  }
  if (card.defId === 'insight') {
    p.mana -= card.cost;
    p.hand.splice(handIndex, 1);
    drawCards(p, TUNING.insightDraw, state.log);
    state.log.push('Insight draws 2 cards.');
    return true;
  }
  return false;
}

// AI plays a creature from its hand (same rules, other side).
export function aiPlayCreature(state, handIndex, laneIndex) {
  const a = state.ai;
  const card = a.hand[handIndex];
  if (!card || card.kind !== 'creature') return false;
  if (card.cost > a.mana) return false;
  if (a.lanes[laneIndex].length >= TUNING.maxPerLane) return false;
  a.mana -= card.cost;
  a.hand.splice(handIndex, 1);
  a.lanes[laneIndex].push(card);
  state.log.push(`The Warden plays ${card.name} in lane ${laneIndex + 1}.`);
  state.lastEvents.push({ type: 'play', lane: laneIndex, name: card.name, who: 'ai' });
  if (card.defId === 'tidecaller') drawCards(a, 1, state.log);
  return true;
}

export function aiPlaySpell(state, handIndex, target) {
  const a = state.ai;
  const card = a.hand[handIndex];
  if (!card || card.kind !== 'spell') return false;
  if (card.cost > a.mana) return false;
  if (card.defId === 'ember-bolt') {
    if (!target || target.who !== 'player' || target.creature == null) return false;
    const lane = state.player.lanes[target.lane];
    const victim = lane[target.creature];
    if (!victim) return false;
    a.mana -= card.cost;
    a.hand.splice(handIndex, 1);
    victim.damage += TUNING.boltDamage;
    state.log.push(`The Warden's Ember Bolt hits ${victim.name}.`);
    state.lastEvents.push({ type: 'bolt', lane: target.lane, name: victim.name, who: 'player' });
    if (victim.damage >= victim.health) {
      lane.splice(target.creature, 1);
      state.player.discard.push(victim);
      state.log.push(`${victim.name} burns away.`);
    }
    return true;
  }
  if (card.defId === 'mend') {
    a.mana -= card.cost;
    a.hand.splice(handIndex, 1);
    const healed = Math.min(TUNING.mendHeal, TUNING.maxLife - a.life);
    a.life += healed;
    state.log.push(`The Warden mends ${healed} life.`);
    return true;
  }
  if (card.defId === 'insight') {
    a.mana -= card.cost;
    a.hand.splice(handIndex, 1);
    drawCards(a, TUNING.insightDraw, state.log);
    return true;
  }
  return false;
}

// Assign an attack pool to defending creatures, Guard first,
// then lowest health. Mutates defender damage. Returns deaths.
function assignDamage(attackPool, defenders, side, log, whoLabel) {
  let pool = attackPool;
  const order = defenders
    .map((c, i) => ({ c, i }))
    .sort((x, y) => {
      const gx = x.c.keyword === 'guard' ? 0 : 1;
      const gy = y.c.keyword === 'guard' ? 0 : 1;
      if (gx !== gy) return gx - gy;
      return x.c.health - x.c.damage - (y.c.health - y.c.damage);
    });
  const deaths = [];
  for (const { c, i } of order) {
    if (pool <= 0) break;
    const remaining = c.health - c.damage;
    const dealt = Math.min(pool, remaining);
    c.damage += dealt;
    pool -= dealt;
    log.push(`${whoLabel} deals ${dealt} to ${c.name}.`);
    if (c.damage >= c.health) deaths.push(i);
  }
  return { deaths, leftover: pool };
}

function sweepLane(state, laneIndex) {
  for (const who of ['player', 'ai']) {
    const side = state[who];
    const dead = [];
    side.lanes[laneIndex].forEach((c, i) => {
      if (c.damage >= c.health) dead.push(i);
    });
    for (let k = dead.length - 1; k >= 0; k--) {
      const gone = side.lanes[laneIndex].splice(dead[k], 1)[0];
      side.discard.push(gone);
      state.log.push(`${gone.name} falls in lane ${laneIndex + 1}.`);
    }
  }
}

// One combat step for a single lane. Swift creatures strike first;
// anything they kill never strikes back. Then the rest trade blows.
// An empty lane leaks the attacker's whole attack into life.
export function resolveLaneCombat(state, laneIndex) {
  const pLane = state.player.lanes[laneIndex];
  const aLane = state.ai.lanes[laneIndex];
  if (pLane.length === 0 && aLane.length === 0) return;

  if (pLane.length === 0) {
    const dmg = laneTotalAttack(state.ai, laneIndex);
    state.player.life -= dmg;
    state.log.push(`Lane ${laneIndex + 1} is open — the Warden hits you for ${dmg}.`);
    state.lastEvents.push({ type: 'face', lane: laneIndex, who: 'player', amount: dmg });
    return;
  }
  if (aLane.length === 0) {
    const dmg = laneTotalAttack(state.player, laneIndex);
    state.ai.life -= dmg;
    state.log.push(`Lane ${laneIndex + 1} is open — you hit the Warden for ${dmg}.`);
    state.lastEvents.push({ type: 'face', lane: laneIndex, who: 'ai', amount: dmg });
    return;
  }

  // Swift pre-strike: each side's Swift creatures hit first.
  const pSwift = pLane.filter((c) => c.keyword === 'swift')
    .reduce((s, c) => s + effectiveAttack(state.player, laneIndex, c), 0);
  const aSwift = aLane.filter((c) => c.keyword === 'swift')
    .reduce((s, c) => s + effectiveAttack(state.ai, laneIndex, c), 0);
  if (pSwift > 0) {
    assignDamage(pSwift, aLane, state.ai, state.log, 'Your Swift');
    sweepLane(state, laneIndex);
  }
  if (aSwift > 0 && state.ai.lanes[laneIndex].length > 0) {
    assignDamage(aSwift, state.player.lanes[laneIndex], state.player, state.log, 'Warden Swift');
    sweepLane(state, laneIndex);
  }

  // Main strike: surviving creatures trade blows at once.
  const pLeft = state.player.lanes[laneIndex];
  const aLeft = state.ai.lanes[laneIndex];
  if (pLeft.length > 0 && aLeft.length > 0) {
    const pAtk = laneTotalAttack(state.player, laneIndex);
    const aAtk = laneTotalAttack(state.ai, laneIndex);
    assignDamage(pAtk, aLeft, state.ai, state.log, 'You');
    assignDamage(aAtk, pLeft, state.player, state.log, 'The Warden');
    sweepLane(state, laneIndex);
  }
}

export function resolveCombat(state) {
  state.phase = 'combat';
  for (let lane = 0; lane < TUNING.lanes; lane++) {
    resolveLaneCombat(state, lane);
  }
  state.phase = 'playing';
  checkEnd(state);
}

export function isGameOver(state) {
  return state.phase === 'won' || state.phase === 'lost';
}

export function checkEnd(state) {
  if (state.ai.life <= 0 && state.player.life <= 0) {
    state.phase = 'lost';
    state.winner = 'draw';
    state.log.push('Both fall at once — a draw, but the Warden keeps the crown.');
  } else if (state.ai.life <= 0) {
    state.phase = 'won';
    state.winner = 'player';
    state.log.push('The Warden falls. You win the duel!');
  } else if (state.player.life <= 0) {
    state.phase = 'lost';
    state.winner = 'ai';
    state.log.push('Your life is spent. The Warden wins this duel.');
  }
}

export function cardDef(card) {
  return CARD_BY_ID[card.defId];
}

export function makeScriptedMidgame(seed) {
  // A rich mid-game table for the play screenshot: both sides have
  // creatures in the lanes, full hands, and life totals that tell a story.
  const state = newGame(seed);
  state.phase = 'playing';
  state.turn = 6;
  state.player.manaMax = 6;
  state.player.mana = 3;
  state.player.life = 14;
  state.ai.life = 17;
  state.ai.manaMax = 6;
  state.ai.mana = 2;
  const put = (who, lane, defId) => {
    state[who].lanes[lane].push(makeInstance(defId));
  };
  put('player', 0, 'briar-knight');
  put('player', 0, 'cinder-pup');
  put('player', 1, 'flame-imp');
  put('player', 2, 'reef-guard');
  put('ai', 0, 'ember-hound');
  put('ai', 1, 'ash-phoenix');
  put('ai', 1, 'spark-sprite');
  put('ai', 2, 'deep-leviathan');
  state.player.hand = ['kelp-lurker', 'ember-bolt', 'tidecaller', 'thorn-sprout', 'mend'].map(makeInstance);
  state.ai.hand = ['cinder-pup', 'spark-sprite', 'tide-wisp', 'ember-hound', 'insight'].map(makeInstance);
  state.log.push('Turn 6 — the board is crowded and the ember is high.');
  return state;
}
