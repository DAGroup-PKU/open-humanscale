// Read-only inventory of the current site's static and generated media paths.
// Update the dynamic path rules when changing app.js's media rendering scheme.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const json = name => JSON.parse(read(name));
const used = new Set();
const add = name => used.add(name.split(/[?#]/)[0]);
const assetsIn = text => {
  for (const match of text.matchAll(/assets\/[\w./-]+\.(?:webp|png|jpg|svg|mp4|json|csv|woff2)/g)) add(match[0]);
};
const stringsIn = value => {
  if (typeof value === 'string') assetsIn(value);
  else if (value && typeof value === 'object') Object.values(value).forEach(stringsIn);
};

// HTML, loaded scripts and styles (including the benchmark SVG plates).
const html = read('index.html');
assetsIn(html);
for (const [, name] of html.matchAll(/(?:src|href)="([^"?]+\.(?:js|css))(?:\?[^\"]*)?"/g)) assetsIn(read(name));

// app.js assembles these paths from the media tables and camera selectors.
const app = read('app.js');
const literal = pattern => {
  const match = app.match(pattern);
  if (!match) throw Error('Media declarations changed; update the audit rules before pruning.');
  return vm.runInNewContext(`(${match[1]})`, Object.create(null), {timeout: 1000});
};
const media = literal(/const media = (\{[\s\S]*?\n\});/);
const multiView = new Set(literal(/const multiView = new Set\((\[[^;]+\])\);/));
const longTasks = literal(/const longTasks=(\{[\s\S]*?\n\});/);
const clip = (name, folder, poster = 'webp') => {
  add(`assets/videos/${folder}/${name}.mp4`);
  add(`assets/posters/${folder}/${name}.${poster}`);
};
for (const [type, groups] of Object.entries(media)) {
  for (const items of Object.values(groups)) for (const [name, , , editName = name] of items) {
    if (type === 'zero') {
      clip(name, 'presentation');
      if (multiView.has(name)) clip(`${name}-ego`, 'presentation');
    } else {
      add(`assets/goals/${name}.webp`);
      clip(editName, 'clean-goals');
      if (multiView.has(editName)) clip(`${editName}-ego`, 'clean-goals');
    }
  }
}
for (const task of Object.values(longTasks)) for (const [name] of task.views) {
  clip(name, 'presentation', /v2[45]$/.test(name) ? 'jpg' : 'webp');
}
stringsIn(json('assets/zero-shot-gallery.json'));

// Retain provenance, figure data, licenses, and inputs required to regenerate media.
for (const name of [
  'additional-demos-v24.json', 'clean-goal-manifest.json', 'goal-edit-manifest.json',
  'continuous-follow-v9.json', 'hero-highlight-v11.json', 'presentation-manifest.json',
  'project-film.json', 'scaling-results.csv', 'hybrid-scaling-results.csv',
  'figures/paper-current-manifest.json', 'figures/ego-study-v25/sources.json',
  'fonts/OFL.txt', 'fonts/SOURCE.txt'
]) add(`assets/${name}`);
for (const entry of json('assets/goal-edit-manifest.json').clips) {
  if (entry.source_base === 'dist') add(entry.source);
}
const walk = dir => fs.readdirSync(path.join(root, dir), {withFileTypes: true})
  .flatMap(entry => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
const all = walk('assets').filter(name => !name.endsWith('/.DS_Store'));
const unused = all.filter(name => !used.has(name)).sort();
const missing = [...used].filter(name => !fs.existsSync(path.join(root, name))).sort();
const bytes = names => names.reduce((sum, name) => sum + fs.statSync(path.join(root, name)).size, 0);
console.log(JSON.stringify({assets: all.length, retained: used.size, unusedBytes: bytes(unused), missing, unused}, null, 2));
if (missing.length) process.exitCode = 1;
