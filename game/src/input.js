// Pointer and keyboard input: pick a card from the hand, then a
// lane (creature) or a target (Ember Bolt). Number keys pick cards,
// 1-3 pick lanes, Enter ends the turn, Esc cancels a selection.
import { canPlay, playCreature, playSpell, playableLanes } from './state.js';

export function bindInput(state, els, hooks) {
  state.onCardClick = (handIndex) => {
    if (state.phase !== 'playing') return;
    const card = state.player.hand[handIndex];
    if (!card) return;
    if (state.selected && state.selected.handIndex === handIndex) {
      state.selected = null;
      hooks.render();
      return;
    }
    if (!canPlay(state, card)) {
      hooks.flash(`Not enough ember for ${card.name}.`);
      return;
    }
    state.selected = { handIndex, card };
    hooks.sound('select');
    hooks.render();
  };

  state.onLaneClick = (laneIndex) => {
    if (state.phase !== 'playing' || !state.selected) return;
    const { handIndex, card } = state.selected;
    if (card.kind === 'spell') return;
    if (!playableLanes(state).includes(laneIndex)) {
      hooks.flash('That lane is full.');
      return;
    }
    if (playCreature(state, handIndex, laneIndex)) {
      state.selected = null;
      hooks.sound('play');
      hooks.render();
    }
  };

  state.onEnemyClick = (laneIndex, creatureIndex) => {
    if (state.phase !== 'playing' || !state.selected) return;
    const { handIndex, card } = state.selected;
    if (card.kind !== 'spell' || card.defId !== 'ember-bolt') return;
    if (playSpell(state, handIndex, { who: 'ai', lane: laneIndex, creature: creatureIndex })) {
      state.selected = null;
      hooks.sound('bolt');
      hooks.render();
    }
  };

  els.endTurn.addEventListener('click', () => hooks.endTurn());

  document.addEventListener('keydown', (e) => {
    if (state.phase !== 'playing') {
      if (e.key === 'Enter' && state.phase === 'title') hooks.start();
      return;
    }
    if (e.key === 'Escape') {
      state.selected = null;
      hooks.render();
      return;
    }
    if (e.key === 'Enter') {
      hooks.endTurn();
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      hooks.endTurn();
      return;
    }
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= 9) {
      if (state.selected && state.selected.card.kind === 'creature' && n <= 3) {
        state.onLaneClick(n - 1);
      } else if (!state.selected && n <= state.player.hand.length) {
        state.onCardClick(n - 1);
      }
    }
  });

  els.restartBtn.addEventListener('click', () => hooks.restart());
  els.soundBtn.addEventListener('click', () => hooks.toggleSound());
}
