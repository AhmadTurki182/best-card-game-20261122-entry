// The Warden — a heuristic opponent that reads the board:
// it trades up, fills empty lanes, removes big threats, heals
// when hurt, and takes lethal when it sees it.
import { TUNING } from './config.js';
import { aiPlayCreature, aiPlaySpell, laneTotalAttack } from './state.js';

// How much face damage the AI would deal this combat if it stopped now.
function faceDamageNow(state) {
  let dmg = 0;
  for (let lane = 0; lane < TUNING.lanes; lane++) {
    if (state.player.lanes[lane].length === 0 && state.ai.lanes[lane].length > 0) {
      dmg += laneTotalAttack(state.ai, lane);
    }
  }
  return dmg;
}

// Score playing a creature into a lane. Higher is better.
function scoreCreaturePlay(state, card, lane) {
  const enemy = state.player.lanes[lane];
  const mine = state.ai.lanes[lane];
  let score = card.attack + card.health * 0.5;
  if (card.keyword === 'swift') score += 1.5;
  if (card.keyword === 'guard') score += 1;
  if (card.keyword === 'rally') score += 1.5;
  if (card.defId === 'tidecaller') score += 1; // its draw replaces itself
  if (mine.length === 0 && enemy.length === 0) score += 1; // claim an empty lane
  if (mine.length === 0 && enemy.length > 0) score += 1.5; // answer a threat
  if (enemy.length > 0) {
    // Trading up: my creature survives their hit and kills one of theirs.
    const enemyAtk = laneTotalAttack(state.player, lane);
    const enemyHp = enemy.reduce((s, c) => s + (c.health - c.damage), 0);
    if (card.health > enemyAtk) score += 2;
    if (card.attack >= enemyHp) score += 2.5;
  }
  if (mine.length >= TUNING.maxPerLane) return -999;
  // Lethal: this play opens (or widens) a lane that kills the player.
  const after = faceDamageNow(state) + (enemy.length === 0 ? card.attack : 0);
  if (after >= state.player.life) score += 100;
  score -= card.cost * 0.35; // prefer cheap plays when equal
  return score;
}

function bestBoltTarget(state) {
  let best = null;
  for (let lane = 0; lane < TUNING.lanes; lane++) {
    state.player.lanes[lane].forEach((c, i) => {
      const hpLeft = c.health - c.damage;
      if (hpLeft <= TUNING.boltDamage) {
        const value = c.attack * 2 + hpLeft + (c.keyword === 'rally' ? 2 : 0);
        if (!best || value > best.value) best = { lane, creature: i, value };
      }
    });
  }
  return best;
}

// One AI "move": play the single best affordable action, or null.
function bestAction(state) {
  const a = state.ai;
  let best = null;
  const consider = (value, run) => {
    if (value > 0 && (!best || value > best.value)) best = { value, run };
  };

  a.hand.forEach((card, i) => {
    if (card.cost > a.mana) return;
    if (card.kind === 'creature') {
      for (let lane = 0; lane < TUNING.lanes; lane++) {
        consider(scoreCreaturePlay(state, card, lane), () => aiPlayCreature(state, i, lane));
      }
    } else if (card.defId === 'ember-bolt') {
      const target = bestBoltTarget(state);
      if (target) {
        consider(target.value, () =>
          aiPlaySpell(state, i, { who: 'player', lane: target.lane, creature: target.creature }));
      }
    } else if (card.defId === 'mend') {
      if (a.life <= 11) consider(4 + (11 - a.life) * 0.3, () => aiPlaySpell(state, i, null));
    } else if (card.defId === 'insight') {
      if (a.hand.length <= 3) consider(2.5, () => aiPlaySpell(state, i, null));
    }
  });
  return best;
}

// Play actions one at a time with a pause between them so the
// player can follow. Calls done() when the AI ends its turn.
export function runAiTurn(state, onStep, done) {
  const step = () => {
    const action = bestAction(state);
    if (!action) {
      done();
      return;
    }
    action.run();
    onStep();
    setTimeout(step, TUNING.aiThinkMs);
  };
  setTimeout(step, TUNING.aiThinkMs);
}
