// DOM rendering: the table, hands, lanes, life and mana, the
// title/win/loss overlays, and floating damage numbers.
// Cards are plain DOM so they stay sharp at thumbnail size.
import { FACTIONS, KEYWORDS, TUNING } from './config.js';
import { effectiveAttack } from './state.js';

const GLYPHS = {
  flame:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C9 6 5.5 8.5 5.5 13a6.5 6.5 0 0 0 13 0c0-1.8-.8-3-1.9-4.1-.4 1.3-1.2 2.1-2.4 2.3C14.6 8.6 13.4 5.4 12 2z"/><path d="M12 21a3.2 3.2 0 0 1-3.2-3.2c0-1.9 1.4-3.2 3.2-4.8 1.8 1.6 3.2 2.9 3.2 4.8A3.2 3.2 0 0 1 12 21z" fill="rgba(255,255,255,.55)"/></svg>',
  drop:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2S5 11.2 5 15.2a7 7 0 0 0 14 0C19 11.2 12 2 12 2z"/><circle cx="9.4" cy="15.4" r="1.6" fill="rgba(255,255,255,.6)"/></svg>',
  leaf:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.5 5.5 4 11 5 20c8.5 1 14-4.5 15-13 .3-2.6-4-5-8-5z"/><path d="M7 19C10 13 13 9.5 17.5 7" stroke="rgba(255,255,255,.55)" stroke-width="1.4" fill="none"/></svg>',
};

function glyph(faction) {
  return GLYPHS[FACTIONS[faction].glyph] || '';
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

export function cardEl(card, opts = {}) {
  const def = card;
  const node = el('div', `card faction-${def.faction}${opts.selectable ? ' selectable' : ''}${opts.selected ? ' selected' : ''}${opts.fresh ? ' fresh' : ''}`);
  node.dataset.uid = card.uid;
  node.dataset.defId = card.defId;
  const cost = el('div', 'card-cost', String(def.cost));
  node.appendChild(cost);
  const art = el('div', 'card-art');
  art.innerHTML = glyph(def.faction);
  node.appendChild(art);
  node.appendChild(el('div', 'card-name', def.name));
  if (def.keyword) {
    const kw = el('div', 'card-keyword', def.keyword.toUpperCase());
    kw.title = KEYWORDS[def.keyword] || '';
    node.appendChild(kw);
  }
  node.appendChild(el('div', 'card-text', def.text));
  if (def.kind === 'creature') {
    const stats = el('div', 'card-stats');
    const atk = def.attack;
    const hp = def.health - (def.damage || 0);
    stats.appendChild(el('span', 'stat-atk', `⚔ ${atk}`));
    stats.appendChild(el('span', 'stat-hp', `♥ ${hp}`));
    node.appendChild(stats);
  } else {
    const stats = el('div', 'card-stats');
    stats.appendChild(el('span', 'stat-spell', 'SPELL'));
    node.appendChild(stats);
  }
  if (opts.onClick) node.addEventListener('click', (e) => { e.stopPropagation(); opts.onClick(); });
  return node;
}

function lifeEl(life, max) {
  const wrap = el('div', 'life');
  wrap.appendChild(el('span', 'life-heart', '♥'));
  wrap.appendChild(el('span', 'life-num', `${Math.max(0, life)}`));
  wrap.appendChild(el('span', 'life-max', `/ ${max}`));
  const bar = el('div', 'life-bar');
  const fill = el('div', 'life-fill');
  fill.style.width = `${Math.max(0, Math.min(100, (life / max) * 100))}%`;
  bar.appendChild(fill);
  wrap.appendChild(bar);
  return wrap;
}

function manaEl(mana, manaMax) {
  const wrap = el('div', 'mana');
  for (let i = 0; i < TUNING.maxMana; i++) {
    const dot = el('span', `mana-dot${i < mana ? ' full' : ''}${i < manaMax ? '' : ' locked'}`);
    dot.textContent = '◆';
    wrap.appendChild(dot);
  }
  wrap.appendChild(el('span', 'mana-num', `${mana}/${manaMax}`));
  return wrap;
}

function renderSideHand(root, state, side, faceDown) {
  root.textContent = '';
  const hand = state[side].hand;
  hand.forEach((card, i) => {
    if (faceDown) {
      const back = el('div', 'card card-back');
      back.appendChild(el('div', 'card-back-glyph', '✦'));
      root.appendChild(back);
    } else {
      const playable = state.phase === 'playing' && card.cost <= state.player.mana;
      const selected = state.selected && state.selected.handIndex === i;
      root.appendChild(cardEl(card, {
        selectable: playable,
        selected,
        onClick: () => state.onCardClick && state.onCardClick(i),
      }));
    }
  });
  if (hand.length === 0) root.appendChild(el('div', 'hand-empty', 'No cards in hand'));
}

function renderLane(root, state, laneIndex) {
  root.textContent = '';
  const aiLane = state.ai.lanes[laneIndex];
  const pLane = state.player.lanes[laneIndex];
  const top = el('div', 'lane-side lane-ai');
  aiLane.forEach((card) => {
    const fresh = state.lastEvents.some((e) => e.type === 'play' && e.who === 'ai' && e.lane === laneIndex && e.name === card.name);
    top.appendChild(cardEl(card, { fresh, onClick: () => state.onEnemyClick && state.onEnemyClick(laneIndex, aiLane.indexOf(card)) }));
  });
  const mid = el('div', 'lane-mid', `LANE ${laneIndex + 1}`);
  const bottom = el('div', 'lane-side lane-player');
  pLane.forEach((card) => {
    const fresh = state.lastEvents.some((e) => e.type === 'play' && e.who === 'player' && e.lane === laneIndex && e.name === card.name);
    bottom.appendChild(cardEl(card, { fresh }));
  });
  root.appendChild(top);
  root.appendChild(mid);
  root.appendChild(bottom);
  const targetable = state.selected && state.selected.card && state.selected.card.kind === 'creature';
  if (targetable) root.classList.add('lane-targetable');
  else root.classList.remove('lane-targetable');
  root.addEventListener('click', () => state.onLaneClick && state.onLaneClick(laneIndex));
}

export function render(state, els) {
  els.turnLabel.textContent = state.phase === 'title' ? 'Ready' : `Turn ${state.turn}`;
  els.aiLife.replaceChildren(lifeEl(state.ai.life, TUNING.maxLife));
  els.playerLife.replaceChildren(lifeEl(state.player.life, TUNING.maxLife));
  els.aiMana.replaceChildren(manaEl(state.ai.mana, state.ai.manaMax));
  els.playerMana.replaceChildren(manaEl(state.player.mana, state.player.manaMax));
  renderSideHand(els.aiHand, state, 'ai', true);
  renderSideHand(els.playerHand, state, 'player', false);
  els.lanes.forEach((laneEl, i) => renderLane(laneEl, state, i));
  els.endTurn.disabled = state.phase !== 'playing';
  els.endTurn.textContent = state.phase === 'playing' ? 'End Turn ⏎' : '…';
  const log = state.log.slice(-3);
  els.log.textContent = '';
  log.forEach((line) => els.log.appendChild(el('div', 'log-line', line)));
  const sel = state.selected;
  els.hint.textContent = sel
    ? (sel.card.kind === 'spell' && sel.card.defId === 'ember-bolt'
      ? 'Ember Bolt: click an enemy creature to burn it.'
      : `Playing ${sel.card.name} — click a lane to place it, or press Esc to cancel.`)
    : 'Click a card, then a lane. Spells: click the card, then its target.';
  state.lastEvents = [];
}

export function floatText(els, laneIndex, who, text, kind) {
  const laneEl = els.lanes[laneIndex];
  if (!laneEl) return;
  const floater = el('div', `floater ${kind}`, text);
  floater.style.top = who === 'player' ? '62%' : '30%';
  laneEl.appendChild(floater);
  setTimeout(() => floater.remove(), 950);
}

export function showOverlay(els, kind, stats) {
  const ov = els.overlay;
  ov.textContent = '';
  ov.className = `overlay overlay-${kind}`;
  if (kind === 'title') {
    ov.appendChild(el('h1', 'game-title', 'EMBERFALL DUEL'));
    ov.appendChild(el('p', 'game-sub', 'A duel of cunning cards across three lanes.'));
    const rules = el('div', 'game-rules');
    rules.innerHTML =
      '<b>How to play</b><br>· Each turn you gain ember and draw a card.<br>' +
      '· Play creatures into the three lanes, then end your turn.<br>' +
      '· Creatures fight lane by lane; an open lane hits life.<br>' +
      '· <b>Swift</b> strikes first · <b>Guard</b> takes damage first · <b>Rally</b> buffs its lane.<br>' +
      '· Reduce the Warden from 20 life to 0 to win.';
    ov.appendChild(rules);
    const btn = el('button', 'big-btn', '⚔ Begin the Duel');
    btn.addEventListener('click', () => stats.onStart());
    ov.appendChild(btn);
    ov.appendChild(el('p', 'game-note', 'Mouse or keyboard: 1–7 pick a card, 1–3 pick a lane, Enter ends the turn.'));
  } else if (kind === 'win') {
    ov.appendChild(el('div', 'end-emblem', '👑'));
    ov.appendChild(el('h1', 'end-title win', 'VICTORY'));
    ov.appendChild(el('p', 'end-sub', `The Warden falls in ${stats.turns} turns — ${stats.lifeLeft} life to spare.`));
    const btn = el('button', 'big-btn', '↻ Play Again');
    btn.addEventListener('click', () => stats.onRestart());
    ov.appendChild(btn);
  } else if (kind === 'loss') {
    ov.appendChild(el('div', 'end-emblem', '🥀'));
    ov.appendChild(el('h1', 'end-title loss', 'DEFEAT'));
    ov.appendChild(el('p', 'end-sub', `The Warden prevails on turn ${stats.turns}. Your ember is spent — for now.`));
    const btn = el('button', 'big-btn', '↻ Try Again');
    btn.addEventListener('click', () => stats.onRestart());
    ov.appendChild(btn);
  }
  ov.classList.add('visible');
}

export function hideOverlay(els) {
  els.overlay.classList.remove('visible');
  els.overlay.textContent = '';
}
