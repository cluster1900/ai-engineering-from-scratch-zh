#!/usr/bin/env node
'use strict';
// Structure, fact-grounding and evidence audit for the zh cheat sheets.
// The parser, fact tokens and evidence rules are copied unchanged from upstream
// rohitg00/ai-engineering-from-scratch site/build-cheatsheets.js and
// site/cheatsheet-evidence.js @ d9e56c57f. The poster layout, HTML build and the
// English quality rubric are left out: they do not apply to translated prose.
// Extra zh checks: every sheet has an evidence file, code fences are balanced,
// relative links resolve, and topic ids / codes are unique.
// Translation rule: keep the machine-read lines in English: the evidence title
// "# Evidence: cheatsheets/<id>.md", the "Abbreviations: K = path, ..." line
// (ASCII , and :), front matter keys, block meta lines and all code / facts.
// Usage: node scripts/audit_cheatsheets.js [--json]

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const evidenceCheck = require('../site/cheatsheet-evidence');

const REPO_ROOT = path.resolve(__dirname, '..');
const TOPIC_DIR = 'cheatsheets';
const COLUMNS = 4;
const MAX_SUBTITLE = 120;
const markdown = { splitTableRow };

function splitTableRow(line) {
  var cells = [];
  var cur = '';
  var inCode = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line.charAt(i);
    if (ch === '\\' && line.charAt(i + 1) === '|') {
      cur += '|';
      i++;
      continue;
    }
    if (ch === '`') {
      inCode = !inCode;
      cur += ch;
      continue;
    }
    if (ch === '|' && !inCode) {
      cells.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  if (cells.length && cells[0].trim() === '') cells.shift();
  if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
  return cells.map(function (c) { return c.trim(); });
}

const TYPES = {
  concepts: { group: 'know', label: 'Know' },
  glossary: { group: 'know', label: 'Know' },
  'task-table': { group: 'do', label: 'Do' },
  'command-table': { group: 'do', label: 'Do' },
  'annotated-code': { group: 'code', label: 'Code' },
  flow: { group: 'see', label: 'See' },
  architecture: { group: 'see', label: 'See' },
  defaults: { group: 'numbers', label: 'Numbers' },
  comparison: { group: 'compare', label: 'Compare' },
  troubleshooting: { group: 'fix', label: 'Fix' },
  qa: { group: 'recall', label: 'Recall' },
  tips: { group: 'recall', label: 'Recall' },
};
const TABLE_SHAPES = {
  'task-table': 2,
  'command-table': 2,
  defaults: 3,
  troubleshooting: 3,
  comparison: 'header',
};
const SOURCE_EXTENSIONS = /\.(?:md|py|ts|js|mjs|rs|jl|go|sh|txt|log|json|jsonl|yaml|yml|toml|csv)$/;
const COMMENT = { bash: /\s{2,}#\s/, sh: /\s{2,}#\s/, python: /\s{2,}#\s/, py: /\s{2,}#\s/, yaml: /\s{2,}#\s/, text: /\s{2,}#\s/, typescript: /\s{2,}\/\/\s/, ts: /\s{2,}\/\/\s/, javascript: /\s{2,}\/\/\s/, js: /\s{2,}\/\/\s/, rust: /\s{2,}\/\/\s/, go: /\s{2,}\/\/\s/, tsx: /\s{2,}\/\/\s/ };
const FULL_COMMENT = /^\s*(?:#|\/\/)\s?/;

function sha(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function slugOf(text) {
  return String(text).toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'block';
}

function parseFrontMatter(lines, errors) {
  const meta = {};
  if (lines[0] !== '---') {
    errors.push('the file must start with a front matter block');
    return { meta, end: 0 };
  }
  let end = 1;
  for (; end < lines.length && lines[end] !== '---'; end++) {
    const match = /^([a-z_]+):\s*(.*)$/.exec(lines[end]);
    if (match) meta[match[1]] = match[2].trim();
    else if (lines[end].trim()) errors.push(`front matter line ${end + 1} is not "key: value"`);
  }
  return { meta, end: end + 1 };
}

function splitList(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

function parseTable(lines) {
  const rows = [];
  for (const line of lines) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = markdown.splitTableRow(line.trim());
    if (cells.every(cell => /^:?-{2,}:?$/.test(cell))) continue;
    rows.push(cells);
  }
  return { header: rows[0] || [], rows: rows.slice(1) };
}

function parseBullets(lines) {
  const items = [];
  for (const line of lines) {
    const match = /^(?:[-*]|\d+[.)])\s+(.+)$/.exec(line);
    if (match) items.push(match[1].trim());
    else if (items.length && /^\s{2,}\S/.test(line)) items[items.length - 1] += ` ${line.trim()}`;
  }
  return items.map(item => {
    const lead = /^\*\*(.+?)\*\*\s*:?\s*(.*)$/.exec(item);
    return lead ? { lead: lead[1].replace(/:$/, ''), text: lead[2] } : { lead: '', text: item };
  });
}

function parseFence(lines) {
  const start = lines.findIndex(line => /^\s*(?:`{3,}|~{3,})/.test(line));
  if (start < 0) return null;
  const open = /^\s*(`{3,}|~{3,})\s*(.*)$/.exec(lines[start]);
  const marker = open[1];
  const lang = open[2].trim().toLowerCase();
  const end = lines.findIndex((line, index) => {
    if (index <= start) return false;
    const close = /^\s*(`{3,}|~{3,})\s*$/.exec(line);
    return Boolean(close) && close[1][0] === marker[0] && close[1].length >= marker.length;
  });
  return { lang, code: lines.slice(start + 1, end < 0 ? undefined : end) };
}

const NODE_KINDS = {
  client: 'M1,1 h12 v8 h-12 z M5,12 h4 M7,9 v3',
  process: 'M1,2 h12 v10 h-12 z M1,5 h12 M3,3.5 h1 M5,3.5 h1',
  store: 'M1,3 a6,2 0 1,0 12,0 a6,2 0 1,0 -12,0 v8 a6,2 0 0,0 12,0 v-8',
  queue: 'M1,2 h12 v3 h-12 z M1,6 h12 v3 h-12 z M1,10 h12 v3 h-12 z',
  gpu: 'M3,3 h8 v8 h-8 z M5,5 h4 v4 h-4 z M5,1 v2 M9,1 v2 M5,11 v2 M9,11 v2 M1,5 h2 M1,9 h2 M11,5 h2 M11,9 h2',
  model: 'M7,1 l6,3.5 v6 l-6,3.5 l-6,-3.5 v-6 z M7,1 v13 M1,4.5 l6,3.5 l6,-3.5',
};

function parseArchitecture(lines, errors, where) {
  const fence = parseFence(lines);
  const nodes = [];
  const edges = [];
  if (!fence || fence.lang !== 'arch') {
    errors.push(`${where}: an architecture block needs a fenced arch block`);
    return { nodes, edges };
  }
  for (const line of fence.code) {
    if (!line.trim()) continue;
    const parts = line.split('|').map(part => part.trim());
    if (parts[0] === 'node') {
      const at = /^(\d+),(\d+)$/.exec(parts[2] || '');
      if (!parts[1] || !at || !parts[3]) errors.push(`${where}: bad node line "${line.trim()}"`);
      else if (parts[5] && !NODE_KINDS[parts[5]]) errors.push(`${where}: node kind "${parts[5]}" must be one of ${Object.keys(NODE_KINDS).join(', ')}`);
      else nodes.push({ id: parts[1], col: Number(at[1]), row: Number(at[2]), label: parts[3], sub: parts[4] || '', kind: parts[5] || '' });
    } else if (parts[0] === 'edge') {
      if (!parts[1] || !parts[2]) errors.push(`${where}: bad edge line "${line.trim()}"`);
      else edges.push({ from: parts[1], to: parts[2], label: parts[3] || '' });
    } else {
      errors.push(`${where}: unknown arch line "${line.trim()}"`);
    }
  }
  const ids = new Set(nodes.map(node => node.id));
  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) errors.push(`${where}: edge ${edge.from} -> ${edge.to} names a missing node`);
  }
  const cells = new Set();
  for (const node of nodes) {
    const key = `${node.col},${node.row}`;
    if (cells.has(key)) errors.push(`${where}: two nodes share cell ${key}`);
    cells.add(key);
  }
  return { nodes, edges };
}

function parseTopic(text, file = '') {
  const errors = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const { meta, end } = parseFrontMatter(lines, errors);
  for (const key of ['id', 'title', 'subtitle', 'hue', 'sources']) {
    if (!meta[key]) errors.push(`front matter needs "${key}"`);
  }
  if (meta.id && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.id)) errors.push(`id "${meta.id}" must be lower case with hyphens`);
  if (file && meta.id && path.basename(file, '.md') !== meta.id) errors.push(`id "${meta.id}" must match the file name`);
  const hue = Number(meta.hue);
  if (!(hue >= 0 && hue < 360)) errors.push('hue must be a number from 0 to 359');
  const blocks = [];
  let current = null;
  for (let i = end; i < lines.length; i++) {
    const heading = /^##\s+(.+?)\s*$/.exec(lines[i]);
    if (heading) {
      current = { title: heading[1], meta: {}, body: [], line: i + 1 };
      blocks.push(current);
      let j = i + 1;
      for (; j < lines.length && lines[j].trim(); j++) {
        const match = /^([a-z]+):\s*(.*)$/.exec(lines[j]);
        if (!match) break;
        current.meta[match[1]] = match[2].trim();
      }
      i = j - 1;
      continue;
    }
    if (current) current.body.push(lines[i]);
  }
  const ids = new Set();
  const parsed = blocks.map(block => {
    const where = `block "${block.title}" (line ${block.line})`;
    const type = block.meta.type;
    if (!TYPES[type]) errors.push(`${where}: unknown type "${type}"`);
    const from = splitList(block.meta.from);
    if (!from.length) errors.push(`${where}: needs a from line`);
    let id = slugOf(block.title);
    while (ids.has(id)) id += '-2';
    ids.add(id);
    const col = block.meta.col ? Number(block.meta.col) : 0;
    if (block.meta.col && !(col >= 1 && col <= COLUMNS)) errors.push(`${where}: col must be 1 to ${COLUMNS}`);
    const defaultSpan = ['annotated-code', 'architecture', 'troubleshooting', 'defaults', 'comparison'].includes(type) ? 2 : 1;
    const span = block.meta.span ? Number(block.meta.span) : defaultSpan;
    if (!(span >= 1 && span <= COLUMNS)) errors.push(`${where}: span must be 1 to ${COLUMNS}`);
    if (col && col + span - 1 > COLUMNS) errors.push(`${where}: col ${col} with span ${span} runs past column ${COLUMNS}`);
    const out = { id, title: block.title, type, from, col, span, lang: block.meta.lang || '', line: block.line };
    if (TABLE_SHAPES[type]) {
      const table = parseTable(block.body);
      if (!table.rows.length) errors.push(`${where}: the table has no rows`);
      const width = TABLE_SHAPES[type] === 'header' ? table.header.length : TABLE_SHAPES[type];
      if (TABLE_SHAPES[type] === 'header' && !(width >= 3 && width <= 5)) errors.push(`${where}: a comparison table needs 3 to 5 columns`);
      for (const row of table.rows) {
        if (row.length !== width) errors.push(`${where}: row "${row.join(' | ')}" needs ${width} cells`);
      }
      out.header = table.header;
      out.rows = table.rows;
    } else if (type === 'annotated-code') {
      const fence = parseFence(block.body);
      if (!fence) errors.push(`${where}: needs one fenced code block`);
      out.lang = (fence && fence.lang) || out.lang || 'text';
      out.code = fence ? fence.code : [];
    } else if (type === 'architecture') {
      Object.assign(out, parseArchitecture(block.body, errors, where));
    } else if (type === 'flow') {
      out.items = parseBullets(block.body);
      if (!out.items.length) errors.push(`${where}: the flow has no steps`);
    } else if (TYPES[type]) {
      out.items = parseBullets(block.body);
      if (!out.items.length) errors.push(`${where}: no bullets`);
    }
    return out;
  });
  if (!parsed.length) errors.push('the topic has no blocks');
  return {
    id: meta.id || '',
    title: meta.title || '',
    subtitle: meta.subtitle || '',
    hue: Number.isFinite(hue) ? hue : 222,
    code: meta.code || initials(meta.title || ''),
    sources: splitList(meta.sources),
    sourceHash: meta.source_hash || '',
    blocks: parsed,
    errors,
    hash: sha(text).slice(0, 12),
  };
}

function initials(title) {
  const words = title.replace(/[^A-Za-z0-9 ]+/g, ' ').split(/\s+/).filter(word => word && !/^(?:and|with|the|of|for|to|a)$/i.test(word));
  return ((words[0] || 'X')[0] + ((words[1] || words[0] || 'X')[words[1] ? 0 : 1] || 'X')).toUpperCase();
}

function readSources(sources, root, cache) {
  return sources.map(source => {
    if (cache.has(source)) return cache.get(source);
    const full = path.join(root, source);
    let text = '';
    const walk = target => {
      const stat = fs.statSync(target);
      if (stat.isDirectory()) {
        for (const name of fs.readdirSync(target).sort()) {
          if (name.startsWith('.') || name === 'node_modules' || name === '__pycache__') continue;
          walk(path.join(target, name));
        }
      } else if (SOURCE_EXTENSIONS.test(target) && stat.size < 2000000) {
        text += `\n${fs.readFileSync(target, 'utf8')}`;
      }
    };
    if (fs.existsSync(full)) walk(full);
    cache.set(source, text);
    return text;
  }).join('\n');
}

function factTokens(text) {
  const cleaned = String(text).replace(/<[a-z][a-z0-9_ -]*>/gi, ' ');
  const tokens = new Set();
  for (const match of cleaned.matchAll(/(?:^|[\s`(=])(--[a-z][a-z0-9-]*)/g)) tokens.add(match[1]);
  for (const match of cleaned.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+\b/g)) {
    if (!/^(?:e\.g|i\.e)$/i.test(match[0]) && !/\.(?:md|py|ts|js|json|txt|log|yaml|sh)$/.test(match[0])) tokens.add(match[0]);
  }
  for (const match of cleaned.matchAll(/\b[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+\b/g)) tokens.add(match[0]);
  for (const match of cleaned.matchAll(/\b([A-Za-z_][A-Za-z0-9_]{2,})\(/g)) tokens.add(match[1]);
  return Array.from(tokens);
}

function blockFacts(block) {
  const facts = [];
  if (TABLE_SHAPES[block.type]) {
    for (const row of block.rows) {
      const codeCells = row.filter(cell => /`/.test(cell)).map(cell => (cell.match(/`([^`]+)`/g) || []).map(span => span.slice(1, -1)).join(' '));
      for (const token of factTokens(codeCells.join(' '))) facts.push(token);
      if (block.type === 'defaults') {
        const value = row[1].replace(/`/g, '').trim();
        if (value && !/^(?:none|off|on|yes|no|true|false)$/i.test(value)) facts.push(value);
      }
    }
  } else if (block.type === 'annotated-code') {
    const pattern = COMMENT[block.lang] || COMMENT.bash;
    for (const line of block.code) {
      if (FULL_COMMENT.test(line)) continue;
      const match = pattern.exec(line);
      for (const token of factTokens(match ? line.slice(0, match.index) : line)) facts.push(token);
    }
  } else if (block.type === 'architecture') {
    for (const node of block.nodes) for (const token of factTokens(`${node.label} ${node.sub}`)) facts.push(token);
  } else if (block.items) {
    for (const item of block.items) {
      const spans = (`${item.lead} ${item.text}`.match(/`([^`]+)`/g) || []).map(span => span.slice(1, -1)).join(' ');
      for (const token of factTokens(spans)) facts.push(token);
    }
  }
  return Array.from(new Set(facts));
}

function checkTopic(topic, root, cache) {
  const problems = topic.errors.map(error => `${topic.file}: ${error}`);
  if (problems.length) return problems;
  for (const source of topic.sources) {
    if (!fs.existsSync(path.join(root, source))) problems.push(`${topic.file}: source ${source} does not exist`);
  }
  for (const block of topic.blocks) {
    for (const source of block.from) {
      if (path.posix.normalize(source) !== source || source.split('/').includes('..') || path.isAbsolute(source)) problems.push(`${topic.file}: block "${block.title}" names ${source}, which is not a plain repository path`);
      else if (!topic.sources.some(allowed => source === allowed || source.startsWith(`${allowed.replace(/\/+$/, '')}/`))) problems.push(`${topic.file}: block "${block.title}" names ${source}, which is not a source of this topic`);
    }
    const missing = block.from.filter(source => !fs.existsSync(path.join(root, source)));
    for (const source of missing) problems.push(`${topic.file}: block "${block.title}" names ${source}, which does not exist`);
    if (missing.length) continue;
    const text = readSources(block.from, root, cache);
    for (const fact of blockFacts(block)) {
      if (!text.includes(fact)) problems.push(`${topic.file}: block "${block.title}": "${fact}" is not in its from files`);
    }
  }
  if (topic.subtitle.length > MAX_SUBTITLE) problems.push(`${topic.file}: the subtitle has ${topic.subtitle.length} characters, the limit is ${MAX_SUBTITLE}`);
  return problems;
}

function fenceProblems(text, file) {
  let open = null;
  const problems = [];
  text.split('\n').forEach((line, index) => {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (!m) return;
    if (!open) open = { marker: m[1], line: index + 1 };
    else if (m[1][0] === open.marker[0] && m[1].length >= open.marker.length && /^\s*(`{3,}|~{3,})\s*$/.test(line)) open = null;
  });
  if (open) problems.push(`${file}: code fence opened at line ${open.line} is never closed`);
  return problems;
}

function linkProblems(text, file, root) {
  const problems = [];
  const stripped = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of stripped.matchAll(/\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(?:[a-z]+:|#|\/)/i.test(href)) continue;
    const target = path.join(root, path.dirname(file), decodeURIComponent(href.split('#')[0]));
    if (!fs.existsSync(target)) problems.push(`${file}: relative link ${href} does not resolve`);
  }
  return problems;
}

function main(argv) {
  const dir = path.join(REPO_ROOT, TOPIC_DIR);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('.md') && n !== 'AUTHORING.md' && n !== 'README.md').sort() : [];
  const cache = new Map();
  const lineCache = new Map();
  const problems = [];
  const ids = new Map();
  const codes = new Map();
  let blocks = 0;
  let refs = 0;
  for (const name of files) {
    const file = `${TOPIC_DIR}/${name}`;
    const text = fs.readFileSync(path.join(dir, name), 'utf8');
    const topic = { ...parseTopic(text, file), file };
    blocks += topic.blocks.length;
    problems.push(...fenceProblems(text, file), ...linkProblems(text, file, REPO_ROOT));
    problems.push(...checkTopic(topic, REPO_ROOT, cache));
    if (ids.has(topic.id)) problems.push(`${file}: id ${topic.id} is also used by ${ids.get(topic.id)}`);
    ids.set(topic.id, file);
    if (codes.has(topic.code)) problems.push(`${file}: code ${topic.code} is also used by ${codes.get(topic.code)}`);
    codes.set(topic.code, file);
    const evFile = evidenceCheck.evidenceFile(topic.id || name.replace(/\.md$/, ''));
    const evFull = path.join(REPO_ROOT, evFile);
    if (!fs.existsSync(evFull)) { problems.push(`${evFile}: the evidence file is missing`); continue; }
    const evText = fs.readFileSync(evFull, 'utf8');
    problems.push(...fenceProblems(evText, evFile));
    refs += evidenceCheck.parseEvidence(evText).sections.reduce((sum, s) => sum + s.refs.length, 0);
    // zh: upstream falls back to an ASCII-only title key, which is empty for a
    // Chinese title and would match any section. Require the literal title.
    const evTitles = evidenceCheck.parseEvidence(evText).sections.map(s => s.title);
    for (const block of topic.blocks) if (!evTitles.some(t => t.includes(block.title))) problems.push(`${evFile}: no section heading contains the block title "${block.title}"`);
    if (!topic.errors.length) for (const p of evidenceCheck.evidenceProblems(evText, { id: topic.id, sources: topic.sources }, topic.blocks, REPO_ROOT, lineCache)) problems.push(`${evFile}: ${p}`);
  }
  const evDir = path.join(REPO_ROOT, evidenceCheck.EVIDENCE_DIR);
  if (fs.existsSync(evDir)) for (const name of fs.readdirSync(evDir).filter(n => n.endsWith('.md'))) {
    if (!files.includes(name)) problems.push(`${evidenceCheck.EVIDENCE_DIR}/${name}: no matching cheat sheet`);
  }
  if (argv.includes('--json')) console.log(JSON.stringify({ sheets: files.length, blocks, refs, problems }, null, 2));
  else {
    console.log(`Checked ${files.length} cheat sheets (${blocks} blocks), resolved ${refs} evidence references.`);
    for (const p of problems) console.error(`  ${p}`);
    console.log(problems.length ? `${problems.length} problems.` : 'No problems.');
  }
  return problems.length ? 1 : 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));
module.exports = { parseTopic, checkTopic, blockFacts, factTokens };
