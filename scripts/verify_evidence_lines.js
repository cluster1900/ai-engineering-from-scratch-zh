#!/usr/bin/env node
// Print the zh line content for every docs/*.md evidence reference, and flag
// references whose bullet shares no identifier/number/backtick token with the
// cited lines. The flag is a lexical HEURISTIC, not an error: Chinese bullets
// and lines often share no Latin word or number even when the ref is correct,
// so '??' only marks a candidate for manual review.
// Usage: node scripts/verify_evidence_lines.js <sheet>...
'use strict';
const fs = require('fs');
const path = require('path');
const ev = require('../site/cheatsheet-evidence');
const ROOT = path.join(__dirname, '..');
const END = '(?![\\d:/A-Za-z_-]|\\.[\\dA-Za-z])';
const REF = new RegExp(`([A-Za-z0-9_][A-Za-z0-9_.\\-/]*):(\\d+(?:-\\d+)?(?:,\\s*\\d+(?:-\\d+)?${END})*)${END}`, 'g');
function expand(token, keys, seen = new Set()) {
  const parts = token.split('/');
  const pair = parts.slice(0, 2).join('/');
  if (parts.length > 1 && keys.has(pair) && !seen.has(pair)) return expand([keys.get(pair), ...parts.slice(2)].join('/'), keys, new Set([...seen, pair]));
  return parts.map(p => (!keys.has(p) || seen.has(p)) ? p : expand(keys.get(p), keys, new Set([...seen, p]))).join('/');
}
const toks = s => new Set((s.match(/`[^`]+`|[A-Za-z_][A-Za-z0-9_.]{2,}|\d+(?:\.\d+)?/g) || []).map(t => t.replace(/`/g, '').toLowerCase()));
let total = 0, flagged = 0;
const SHEETS = process.argv.slice(2);
if (SHEETS.length === 0) {
  console.error('Usage: node scripts/verify_evidence_lines.js <sheet>...\n  e.g. node scripts/verify_evidence_lines.js math-for-ml lora-fine-tuning');
  process.exit(2);
}
for (const name of SHEETS) {
  const file = path.join(ROOT, 'cheatsheets/evidence', name + '.md');
  const text = fs.readFileSync(file, 'utf8');
  const keys = ev.parseEvidence(text).keys;
  const lines = text.split('\n');
  const first = lines.findIndex(l => l.startsWith('## '));
  let n = 0, f = 0;
  console.log(`### ${name}`);
  lines.forEach((line, i) => {
    if (i < first || !/^\s*(?:[-*]|\d+\.)\s/.test(line)) return;
    const claim = line.replace(REF, '');
    for (const m of line.matchAll(REF)) {
      const token = m[1].replace(/^[.\-/]+/, '');
      if (!(token.includes('/') || keys.has(token))) continue;
      const rel = path.posix.normalize(expand(token, keys));
      if (!/\/docs\/[^/]+\.md$/.test(rel)) continue;
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n');
      for (const span of m[2].split(/,\s*/)) {
        const [a, b = a] = span.split('-').map(Number);
        const cited = src.slice(a - 1, b).join(' ⏎ ');
        const ct = toks(claim), lt = toks(cited);
        const hit = [...ct].some(t => lt.has(t));
        n++; if (!hit) f++;
        console.log(`${hit ? 'ok ' : '?? '}${name}:${i + 1} ${token}:${span} | ${cited.trim().slice(0, 110)}`);
      }
    }
  });
  total += n; flagged += f;
  console.log(`# ${name}: ${n} docs refs, ${f} without shared token (heuristic, review manually)\n`);
}
console.log(`TOTAL ${total} docs refs, ${flagged} without shared token (heuristic: '??' is a review candidate, not a broken ref)`);
