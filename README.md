# best-card-game-20261122-entry

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/AhmadTurki182/best-card-game-20261122-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/AhmadTurki182/best-card-game-20261122-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Emberfall Duel** — a duel of cunning cards across three lanes. You face the Warden, an AI opponent, with a 24-card deck of Ember, Tide and Thorn cards. Each turn you gain ember and draw a card; play creatures into the three lanes, then end your turn and watch them fight. Swift creatures strike first, Guard creatures take lane damage first, Rally creatures buff their lane. Reduce the Warden from 20 life to 0 to win.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — no build step, no network, plain static files.

Screenshot modes (used for the entry's screenshots): `?shot=start`, `?shot=play`, `?shot=win`, `?shot=loss`, each with `&seed=7` for a fixed table.

## How it plays

- **Turns:** mana ramps 1 → 10, one card drawn per turn, hand of 5 to start.
- **Lanes:** up to 2 creatures per side per lane. An open lane leaks its attack straight into life.
- **Spells:** Ember Bolt (3 damage to a creature), Mend (restore 5 life), Insight (draw 2).
- **The Warden:** a heuristic AI that trades up, fills empty lanes, removes big threats, heals when hurt, and takes lethal when it sees it.
- **Controls:** mouse or keyboard — 1–7 pick a card, 1–3 pick a lane, Enter ends the turn, Esc cancels.

## Layout

- `game/index.html` + `game/styles.css` — the table.
- `game/src/config.js` — the card pool and tuning.
- `game/src/random.js`, `game/src/deck.js` — seeded RNG, decks and draws.
- `game/src/state.js` — turns, playing cards, lane combat.
- `game/src/ai.js` — the Warden.
- `game/src/render.js` — the board, cards, overlays.
- `game/src/input.js` — mouse and keyboard.
- `game/src/sound.js` — synthesized WebAudio effects.
- `game/src/main.js` — boot, game loop, screenshot modes (`?shot=start|play|win|loss`).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=dlaw06&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
