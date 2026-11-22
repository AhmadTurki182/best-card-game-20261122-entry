// Boot and game loop: title -> player turn -> AI turn -> combat
// -> next turn, until someone's life hits zero. Also the
// ?shot= modes, which stage the game for screenshots.
import { TUNING } from './config.js';
import { newGame, startPlayerTurn, startAiTurn, resolveCombat, checkEnd, makeScriptedMidgame } from './state.js';
import { runAiTurn } from './ai.js';
import { render, showOverlay, hideOverlay, floatText } from './render.js';
import { bindInput } from './input.js';
import { playSound, setMuted, isMuted, primeAudio } from './sound.js';

function collectEls() {
  const q = (id) => document.getElementById(id);
  return {
    turnLabel: q('turn-label'),
    aiLife: q('ai-life'),
    aiMana: q('ai-mana'),
    aiHand: q('ai-hand'),
    playerLife: q('player-life'),
    playerMana: q('player-mana'),
    playerHand: q('player-hand'),
    lanes: [q('lane-0'), q('lane-1'), q('lane-2')],
    endTurn: q('end-turn'),
    restartBtn: q('restart-btn'),
    soundBtn: q('sound-btn'),
    log: q('log'),
    hint: q('hint'),
    overlay: q('overlay'),
    flash: q('flash'),
  };
}

function boot() {
  const els = collectEls();
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '20261123');

  let state;
  if (shot === 'play' || shot === 'win' || shot === 'loss') {
    state = makeScriptedMidgame(seed);
  } else {
    state = newGame(seed);
  }

  const hooks = {
    render: () => render(state, els),
    sound: (name) => playSound(name),
    flash: (msg) => {
      els.flash.textContent = msg;
      els.flash.classList.add('show');
      setTimeout(() => els.flash.classList.remove('show'), 1400);
    },
    start: () => {
      hideOverlay(els);
      state.phase = 'playing';
      startPlayerTurn(state);
      playSound('turn');
      hooks.render();
    },
    restart: () => {
      const fresh = newGame((Math.random() * 1e9) | 0);
      Object.assign(state, fresh);
      state.selected = null;
      hideOverlay(els);
      showOverlay(els, 'title', { onStart: hooks.start });
      hooks.render();
    },
    toggleSound: () => {
      setMuted(!isMuted());
      els.soundBtn.textContent = isMuted() ? '🔇 Sound off' : '🔊 Sound on';
    },
    endTurn: () => {
      if (state.phase !== 'playing') return;
      state.selected = null;
      state.phase = 'combat';
      hooks.render();
      startAiTurn(state);
      runAiTurn(
        state,
        () => hooks.render(),
        () => {
          // Combat: show the blows, then resolve.
          setTimeout(() => {
            const before = { p: state.player.life, a: state.ai.life };
            resolveCombat(state);
            const dealtToAi = before.a - state.ai.life;
            const dealtToPlayer = before.p - state.player.life;
            for (let lane = 0; lane < TUNING.lanes; lane++) {
              if (dealtToAi > 0) floatText(els, lane, 'ai', `-${dealtToAi}`, 'dmg');
              if (dealtToPlayer > 0) floatText(els, lane, 'player', `-${dealtToPlayer}`, 'dmg');
            }
            if (state.phase === 'won') {
              playSound('win');
              showOverlay(els, 'win', { turns: state.turn, lifeLeft: Math.max(0, state.player.life), onRestart: hooks.restart });
            } else if (state.phase === 'lost') {
              playSound('lose');
              showOverlay(els, 'loss', { turns: state.turn, onRestart: hooks.restart });
            } else {
              playSound('hit');
              startPlayerTurn(state);
              playSound('turn');
            }
            hooks.render();
          }, 450);
        },
      );
    },
  };

  bindInput(state, els, hooks);
  document.addEventListener('pointerdown', primeAudio, { once: true });

  if (shot === 'start') {
    showOverlay(els, 'title', { onStart: hooks.start });
    hooks.render();
  } else if (shot === 'play') {
    hooks.render();
  } else if (shot === 'win') {
    state.ai.life = 0;
    state.phase = 'won';
    hooks.render();
    showOverlay(els, 'win', { turns: 6, lifeLeft: 14, onRestart: hooks.restart });
  } else if (shot === 'loss') {
    state.player.life = 0;
    state.phase = 'lost';
    hooks.render();
    showOverlay(els, 'loss', { turns: 6, onRestart: hooks.restart });
  } else {
    showOverlay(els, 'title', { onStart: hooks.start });
    hooks.render();
  }
  // Keep the engine honest: a fresh state must never already be over.
  checkEnd(state);
}

document.addEventListener('DOMContentLoaded', boot);
