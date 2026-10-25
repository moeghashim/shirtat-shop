// Median per page/form/category; compare against targets and baseline.json.
import fs from 'node:fs'; import path from 'node:path';
const [dir, baseFile] = process.argv.slice(2);
const runs = {};
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'summary.json')) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f)));
  const key = f.replace(/-\d\.json$/, '');
  for (const [c, v] of Object.entries(r.categories || {})) ((runs[key] ??= {})[c] ??= []).push(Math.round(v.score * 100));
}
const med = a => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
const base = fs.existsSync(baseFile) ? JSON.parse(fs.readFileSync(baseFile)) : {};
const summary = {}; const fails = [];
for (const [k, cats] of Object.entries(runs)) {
  summary[k] = {};
  for (const [c, a] of Object.entries(cats)) {
    const m = med(a); summary[k][c] = m;
    const mobile = k.startsWith('mobile'); const home = /^mobile_(ar)?$/.test(k);
    let target = c !== 'performance' ? 100 : mobile ? (home ? 85 : 0) : 99;
    const b = base[k]?.[c];
    if (m < target) fails.push(`${k} ${c} ${m} < target ${target}`);
    if (typeof b === 'number' && m < b - 2) fails.push(`${k} ${c} ${m} dropped below baseline ${b}`);
  }
}
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
console.table(summary);
fails.forEach(f => console.log('LH FAIL', f));
process.exit(fails.length ? 1 : 0);
