// Emberfall Duel — the entry program (Node 22, standard library only).
// It hands the game in: copies game/ and screenshots/ beside this file
// into /output and writes /output/dossier.json with the kit's vendored
// buildDossier, so the sealed scorer can check the hand-in byte for byte.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyIfPresent(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
if (!existsSync(join(repoRoot, 'game'))) {
  throw new Error('game/ is missing from the repository — nothing to hand in.');
}
copyIfPresent('game');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyIfPresent('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
