/**
 * Copies dist/ into site/ (the git repo that GitHub Pages serves),
 * preserving site/.git so the folder can stay a repository.
 * Usage: node tools/sync-pages.mjs   (or: npm run publish)
 */
import { readdir, rm, mkdir, cp, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const site = path.join(root, 'site');

await mkdir(site, { recursive: true });

for (const entry of await readdir(site)) {
  if (entry === '.git' || entry === '.gitattributes') continue;
  await rm(path.join(site, entry), { recursive: true, force: true });
}

for (const entry of await readdir(dist)) {
  await cp(path.join(dist, entry), path.join(site, entry), { recursive: true });
}

// Keep line endings stable for the published repo.
await writeFile(
  path.join(site, '.gitattributes'),
  '* text=auto eol=lf\n*.png binary\n',
  'utf8'
);

console.log('site/ synced from dist/');
