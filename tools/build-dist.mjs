/**
 * Builds dist/ — the exact folder you upload to a static host.
 * Usage: npm run build
 */
import { rm, mkdir, cp, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const entries = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons'];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of entries) {
  await cp(path.join(root, entry), path.join(dist, entry), { recursive: true });
}

// Netlify / Cloudflare Pages: never cache the service worker, so updates land.
await writeFile(
  path.join(dist, '_headers'),
  '# Netlify / Cloudflare Pages headers\n/sw.js\n  Cache-Control: no-cache\n\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n',
  'utf8'
);

// GitHub Pages: skip Jekyll processing of the uploaded folder.
await writeFile(path.join(dist, '.nojekyll'), '', 'utf8');

console.log('dist/ rebuilt ->', dist);
