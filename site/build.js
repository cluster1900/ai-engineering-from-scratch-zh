#!/usr/bin/env node
/**
 * AI Engineering from Scratch 网站的构建脚本。
 * 从 repo root 解析 README.md、ROADMAP.md 和 glossary/terms.md，
 * 并生成包含所有 phase、lesson、glossary 数据的 data.js。
 *
 * 运行：node site/build.js
 * 每次 push 时由 GitHub Actions 自动调用。
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const README_PATH = path.join(REPO_ROOT, 'README.md');
const ROADMAP_PATH = path.join(REPO_ROOT, 'ROADMAP.md');
const GLOSSARY_PATH = path.join(REPO_ROOT, 'glossary', 'terms.md');
const OUTPUT_PATH = path.join(__dirname, 'data.js');

const GITHUB_BASE = 'https://github.com/cluster1900/ai-engineering-from-scratch-zh/tree/main/';
const SITE_ORIGIN = 'https://ai-learn.agent-buy.com';

// GITHUB_BASE lesson URL -> site path "phases/<phase>/<lesson>"
function lessonPath(url) {
  if (!url) return null;
  const m = url.match(/(phases\/[^/]+\/[^/]+)\/?$/);
  return m ? m[1] : null;
}

// ─── 解析 ROADMAP.md 中的 lesson 状态 ────────────────────────────
function parseRoadmap(content) {
  const statuses = {}; // { "Phase 0": { phaseStatus, lessons: { "Dev Environment": "complete" } } }
  let currentPhase = null;
  let currentPhaseStatus = null;

  for (const line of content.split(/\r?\n/)) {
    // 匹配类似这样的 phase 标题：## Phase 0: Setup & Tooling — ✅
    const phaseMatch = line.match(/^##\s+Phase\s+(\d+).*?—\s*(✅|🚧|⬚)/);
    if (phaseMatch) {
      const phaseId = parseInt(phaseMatch[1]);
      const statusEmoji = phaseMatch[2];
      currentPhaseStatus = statusEmoji === '✅' ? 'complete' : statusEmoji === '🚧' ? 'in-progress' : 'planned';
      currentPhase = `Phase ${phaseId}`;
      statuses[currentPhase] = { phaseStatus: currentPhaseStatus, lessons: {} };
      continue;
    }

    // 匹配类似这样的 lesson 行：| 01 | Dev Environment | ✅ |
    if (currentPhase) {
      const lessonMatch = line.match(/^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(✅|🚧|⬚)\s*\|/);
      if (lessonMatch) {
        const lessonName = lessonMatch[1].trim();
        const statusEmoji = lessonMatch[2];
        const status = statusEmoji === '✅' ? 'complete' : statusEmoji === '🚧' ? 'in-progress' : 'planned';
        statuses[currentPhase].lessons[lessonName] = status;
      }
    }
  }

  return statuses;
}

// ─── 解析 README.md 中的 phases 和 lessons ──────────────────────────
function parseReadme(content, roadmapStatuses) {
  const phases = [];

  // 拆分为 phase blocks
  // Phase 0 位于 <table> block 中，phases 1-19 位于 <details> blocks 中
  // 我们将逐行解析，以提取 phase 标题和 lesson 表格

  const lines = content.split(/\r?\n/);
  let currentPhase = null;
  let inLessonTable = false;
  let isCapstoneTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 匹配 Phase 标题 - 支持多种格式：
    // Old: ### Phase 0: Setup & Tooling `12 lessons`
    // Old: <summary><strong>Phase 1: Math Foundations</strong> <code>22 lessons</code> ... <em>Description</em></summary>
    // New: ### ![](https://img.shields.io/badge/Phase_0-Setup_&_Tooling-95A5A6?style=for-the-badge) `12 lessons`
    // New: <summary><b>🟣 Phase 1 — Math Foundations</b> &nbsp;<code>22 lessons</code>&nbsp; <em>Description</em></summary>
    const phaseHeaderMatch =
      line.match(/###\s+Phase\s+(\d+):\s+(.+?)\s*`(\d+)\s+lessons?`/) ||
      line.match(/###\s+!\[\]\([^)]*?Phase[_\s]+(\d+)[-_]([^?)]+?)-[A-F0-9]{6}[^)]*\)\s*`(\d+)\s+lessons?`/i);
    const detailsHeaderMatch =
      line.match(/<summary><strong>Phase\s+(\d+):\s+(.+?)<\/strong>\s*<code>(\d+)\s+(?:lessons?|projects?)<\/code>.*?<em>(.*?)<\/em>/) ||
      line.match(/<summary>\s*<b>\s*(?:[^\w\s]+\s+)?Phase\s+(\d+)\s*[—\-:]\s*(.+?)<\/b>.*?<code>(\d+)\s+(?:lessons?|projects?)<\/code>.*?<em>(.*?)<\/em>/);

    if (phaseHeaderMatch) {
      const [, idStr, rawName] = phaseHeaderMatch;
      const id = parseInt(idStr);
      const name = rawName.replace(/_/g, ' ').trim();
      // 在下一行（blockquote）查找描述
      let desc = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].startsWith('>')) {
          desc = lines[j].replace(/^>\s*/, '').trim();
          break;
        }
      }
      const roadmapKey = `Phase ${id}`;
      const phaseStatus = roadmapStatuses[roadmapKey]?.phaseStatus || 'planned';
      currentPhase = { id, name: name.trim(), status: phaseStatus, desc, lessons: [] };
      phases.push(currentPhase);
      inLessonTable = false;
      continue;
    }

    if (detailsHeaderMatch) {
      const [, idStr, name, , desc] = detailsHeaderMatch;
      const id = parseInt(idStr);
      const roadmapKey = `Phase ${id}`;
      const phaseStatus = roadmapStatuses[roadmapKey]?.phaseStatus || 'planned';
      currentPhase = { id, name: name.trim(), status: phaseStatus, desc: desc?.trim() || '', lessons: [] };
      phases.push(currentPhase);
      inLessonTable = false;
      continue;
    }

    // 检测 lesson 表格开始
    if (currentPhase && line.match(/^\|\s*#\s*\|\s*(Lesson|课程)/i)) {
      inLessonTable = true;
      isCapstoneTable = false;
      continue;
    }

    // 跳过表格分隔行
    if (inLessonTable && line.match(/^\|[\s:|-]+\|$/)) {
      continue;
    }

    // 解析 lesson 行
    if (inLessonTable && currentPhase && line.startsWith('|')) {
      // | 01 | [Dev Environment](phases/00-setup-and-tooling/01-dev-environment/) | Build | Python, Node, Rust |
      // | 02 | Multi-Layer Networks & Forward Pass | Build | Python |
      const cols = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
      if (cols.length >= 4) {
        const lessonCol = cols[1];
        const typeRaw = cols[2];
        const langRaw = cols[3];

        // Type 可能是纯文本（"Build"），也可能是 shield 图片：![Build](https://...)
        const typeBadgeMatch = typeRaw.match(/!\[([^\]]+)\]/);
        const rawType = typeBadgeMatch ? typeBadgeMatch[1] : typeRaw;
        const TYPE_MAP = {
          '构建': 'Build',
          '学习': 'Learn',
          '参考': 'Reference',
          '练习': 'Practice',
        };
        const type = TYPE_MAP[rawType.trim()] || rawType;

        // Lang 可能是纯文本（"Python, Rust"），也可能是 emoji flags（🐍 🟦 🦀 🟣 ⚛️）
        const EMOJI_LANG = {
          '🐍': 'Python',
          '🟦': 'TypeScript',
          '🦀': 'Rust',
          '🟣': 'Julia',
          '⚛️': 'React',
          '⚛': 'React',
        };
        let lang = langRaw;
        if (/[\uD800-\uDBFF\u2600-\u27BF\u1F300-\u1FAFF]/.test(langRaw) || /[🐍🟦🦀🟣⚛]/u.test(langRaw)) {
          const tokens = Array.from(langRaw)
            .map(ch => EMOJI_LANG[ch])
            .filter(Boolean);
          if (tokens.length) lang = [...new Set(tokens)].join(', ');
          else if (langRaw.trim() === '—' || langRaw.trim() === '-') lang = '';
        }
        if (lang === '—' || lang === '-') lang = '';

        // 检查 lesson 是否有链接（表示它已有内容）
        const linkMatch = lessonCol.match(/\[(.+?)\]\((.+?)\)/);
        let lessonName, url;
        if (linkMatch) {
          lessonName = linkMatch[1];
          const relativePath = linkMatch[2];
          url = GITHUB_BASE + relativePath.replace(/^\//, '');
        } else {
          lessonName = lessonCol;
          url = null;
        }

        // 从 roadmap 获取状态
        const roadmapKey = `Phase ${currentPhase.id}`;
        const roadmapPhase = roadmapStatuses[roadmapKey];
        let status = 'planned';
        if (roadmapPhase) {
          // 尝试用 fuzzy match 查找匹配的 lesson
          const lessonNameClean = lessonName.replace(/[-–—:]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
          for (const [rName, rStatus] of Object.entries(roadmapPhase.lessons)) {
            const rNameClean = rName.replace(/[-–—:]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
            if (rNameClean.includes(lessonNameClean) || lessonNameClean.includes(rNameClean) ||
                rNameClean.split(' ').slice(0, 3).join(' ') === lessonNameClean.split(' ').slice(0, 3).join(' ')) {
              status = rStatus;
              break;
            }
          }
        }

        // 如果有链接，它至少是 complete（必要时覆盖 roadmap）
        if (url && status === 'planned') {
          status = 'complete';
        }

        // Capstone 表格使用中间列表示 prerequisite phase tokens
        // （例如 "P11 P13 P14"），而不是 Build/Learn enum。让 `type` 保持在
        // Build/Learn 轴上，以便 CSS selectors（data-type="Build"/"Learn"）
        // 继续有效，并在专用的 `combines` 字段中输出 prereq 字符串。
        const lessonEntry = {
          name: lessonName.trim(),
          status,
          type: isCapstoneTable ? 'Capstone' : type.trim(),
          lang: lang.trim() || '—',
          ...(isCapstoneTable && { combines: type.trim() }),
          ...(url && { url }),
        };
        currentPhase.lessons.push(lessonEntry);
      }
    }

    // 表格结束
    if (inLessonTable && (line.match(/<\/td>/) || line.match(/<\/details>/) || (line.trim() === '' && i + 1 < lines.length && !lines[i + 1].startsWith('|')))) {
      inLessonTable = false;
    }

    // 同时检测 capstone 表格格式（# | Project | Combines | Lang）
    if (currentPhase && line.match(/^\|\s*#\s*\|\s*(Project|项目)/i)) {
      inLessonTable = true;
      isCapstoneTable = true;
      continue;
    }
  }

  return phases;
}

// ─── 从 docs/en.md 提取 lesson summary + keywords ───────────────
/**
 * 对某个 lesson 的 docs/en.md 做单次读取。
 *
 * 返回：
 *   summary  — 第一行 `> blockquote`（lesson 的一句话 motto）。
 *   keywords — 所有 `### H3` 标题文本，用 ' · ' 连接。
 *              H3 标题是 lesson doc 中最密集的词汇集合
 *              （例如 "Scaled dot-product · Causal masking · KV cache"），
 *              因此它们可以在不让 data.js 膨胀的情况下扩展搜索覆盖。
 *
 * 当文件不存在或没有匹配内容时，这两个字段都是空字符串；
 * 对尚无 docs 的 planned lessons 来说，这是预期情况。
 */
function extractLessonMeta(relPath) {
  const docPath = path.join(REPO_ROOT, relPath, 'docs', 'en.md');
  const result = { summary: '', keywords: '' };
  try {
    const lines = fs.readFileSync(docPath, 'utf8').split(/\r?\n/);
    const h3s = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!result.summary && line.startsWith('> ') && line.length > 3) {
        const s = line.slice(2).trim();
        result.summary = s.length > 180 ? s.slice(0, 177) + '…' : s;
      }
      if (line.startsWith('### ')) {
        const heading = line.slice(4).trim();
        if (heading) h3s.push(heading);
      }
    }
    if (h3s.length) result.keywords = h3s.join(' · ');
  } catch (_) {
    // 文件不存在或不可读；对 planned lessons 来说是预期情况。
  }
  return result;
}

// ─── 解析 glossary/terms.md ──────────────────────────────────────────
function parseGlossary(content) {
  const terms = [];
  let currentTerm = null;

  for (const line of content.split(/\r?\n/)) {
    // 匹配 term 标题：### Agent 或 ### Adam (Optimizer)
    const termMatch = line.match(/^###\s+(.+)/);
    if (termMatch) {
      if (currentTerm && currentTerm.says && currentTerm.means) {
        terms.push(currentTerm);
      }
      currentTerm = { term: termMatch[1].trim(), says: '', means: '' };
      continue;
    }

    if (!currentTerm) continue;

    // 匹配 "What people say" 行
    const saysMatch = line.match(/\*\*(?:What people say|人们常说)[:：]?\*\*\s*"?(.+?)"?\s*$/);
    if (saysMatch) {
      currentTerm.says = saysMatch[1].replace(/^"/, '').replace(/"$/, '').trim();
      continue;
    }

    // 匹配 "What it actually means" 行
    const meansMatch = line.match(/\*\*(?:What it actually means|实际含义)[:：]?\*\*\s*(.+)/);
    if (meansMatch) {
      currentTerm.means = meansMatch[1].trim();
      continue;
    }
  }

  // 推入最后一个 term
  if (currentTerm && currentTerm.says && currentTerm.means) {
    terms.push(currentTerm);
  }

  return terms;
}

// ─── 发现 outputs/ artifacts（skills / prompts / agents）──────────
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 4);
  if (end === -1) return null;
  const block = text.slice(4, end);
  const result = {};
  for (const raw of block.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line || line.startsWith('#') || !line.includes(':')) continue;
    const idx = line.indexOf(':');
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      result[key] = inner
        ? inner.split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        : [];
    } else if ((value.startsWith('"') && value.endsWith('"')) ||
               (value.startsWith("'") && value.endsWith("'"))) {
      result[key] = value.slice(1, -1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function discoverArtifacts() {
  const artifacts = [];
  const phasesDir = path.join(REPO_ROOT, 'phases');
  if (!fs.existsSync(phasesDir)) return artifacts;
  const VALID_TYPES = ['skill', 'prompt', 'agent'];
  for (const phaseDirName of fs.readdirSync(phasesDir).sort()) {
    const phaseMatch = phaseDirName.match(/^([0-9]{2})-([a-z0-9-]+)$/);
    if (!phaseMatch) continue;
    const phaseId = parseInt(phaseMatch[1], 10);
    const phaseDir = path.join(phasesDir, phaseDirName);
    for (const lessonDirName of fs.readdirSync(phaseDir).sort()) {
      const lessonMatch = lessonDirName.match(/^([0-9]{2})-([a-z0-9-]+)$/);
      if (!lessonMatch) continue;
      const lessonId = parseInt(lessonMatch[1], 10);
      const lessonRel = `phases/${phaseDirName}/${lessonDirName}`;
      const outputsDir = path.join(phaseDir, lessonDirName, 'outputs');
      if (fs.existsSync(outputsDir)) {
        for (const file of fs.readdirSync(outputsDir).sort()) {
          if (!file.endsWith('.md')) continue;
          const stem = file.replace(/\.md$/, '');
          const type = VALID_TYPES.find(t => stem.startsWith(`${t}-`));
          if (!type) continue;
          let meta = {};
          try {
            meta = parseFrontmatter(fs.readFileSync(path.join(outputsDir, file), 'utf8')) || {};
          } catch (_) {}
          artifacts.push({
            kind: type,
            name: (meta.name || stem).trim(),
            description: (meta.description || '').trim(),
            tags: Array.isArray(meta.tags) ? meta.tags : [],
            phase: phaseId,
            lesson: lessonId,
            lessonPath: lessonRel,
            file: `${lessonRel}/outputs/${file}`,
          });
        }
      }
      const missionPath = path.join(phaseDir, lessonDirName, 'mission.md');
      if (fs.existsSync(missionPath)) {
        let firstLine = '';
        try {
          firstLine = fs.readFileSync(missionPath, 'utf8').split(/\r?\n/)[0].replace(/^#\s+/, '').trim();
        } catch (_) {}
        artifacts.push({
          kind: 'mission',
          name: firstLine || `${lessonDirName} mission`,
          description: '',
          tags: [],
          phase: phaseId,
          lesson: lessonId,
          lessonPath: lessonRel,
          file: `${lessonRel}/mission.md`,
        });
      }
    }
  }
  return artifacts;
}

// ─── 主构建流程 ──────────────────────────────────────────────────────
// 写入本次部署构建所基于的 git ref，以便 lesson.html 从正确分支获取 docs
// （PR previews 会渲染自身 edits，而不是 main）。
function writeBuildMeta() {
  let ref = process.env.VERCEL_GIT_COMMIT_REF || '';
  if (!ref) {
    try {
      ref = require('child_process')
        .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' })
        .trim();
    } catch (e) { ref = ''; }
  }
  if (!ref || ref === 'HEAD') ref = 'main';
  const js = '// 由 build.js 在每次 deploy 时自动生成 — 请勿编辑。\n'
    + 'window.__AIFS_REF = ' + JSON.stringify(ref) + ';\n';
  fs.writeFileSync(path.join(__dirname, 'build-meta.js'), js, 'utf8');
  console.log('   已写入 build-meta.js（ref: ' + ref + '）');
}

function build() {
  console.log('📖 正在读取源文件...');
  writeBuildMeta();

  const readme = fs.readFileSync(README_PATH, 'utf8');
  const roadmap = fs.readFileSync(ROADMAP_PATH, 'utf8');
  const glossary = fs.readFileSync(GLOSSARY_PATH, 'utf8');

  console.log('🔍 正在解析 ROADMAP.md...');
  const roadmapStatuses = parseRoadmap(roadmap);

  console.log('🔍 正在解析 README.md...');
  const phases = parseReadme(readme, roadmapStatuses);

  console.log('🔍 正在解析 glossary/terms.md...');
  const glossaryTerms = parseGlossary(glossary);

  console.log('🔍 正在发现 outputs + Phase 14 missions...');
  const artifacts = discoverArtifacts();

  console.log('📚 正在从 docs/en.md 提取 lesson summaries + keywords...');
  let summarized = 0, withKeywords = 0;
  for (const phase of phases) {
    for (const lesson of phase.lessons) {
      if (lesson.url) {
        const relPath = lesson.url.replace(GITHUB_BASE, '').replace(/\/+$/, '');
        const meta = extractLessonMeta(relPath);
        if (meta.summary)  { lesson.summary  = meta.summary;  summarized++;   }
        if (meta.keywords) { lesson.keywords = meta.keywords; withKeywords++; }
      }
    }
  }

  // 统计信息
  let totalLessons = 0;
  let completeLessons = 0;
  phases.forEach(p => {
    totalLessons += p.lessons.length;
    completeLessons += p.lessons.filter(l => l.status === 'complete').length;
  });

  console.log(`\n📊 统计：`);
  console.log(`   Phases: ${phases.length}`);
  console.log(`   Lessons: ${totalLessons}`);
  console.log(`   Complete: ${completeLessons}`);
  console.log(`   Summaries: ${summarized}, Keywords: ${withKeywords}`);
  console.log(`   术语表条目: ${glossaryTerms.length}`);
  console.log(`   Artifacts: ${artifacts.length}`);

  // 生成 data.js
  const output = `// 由 build.js 自动生成 — 请勿手动编辑。
// Last built: ${new Date().toISOString()}

const PHASES = ${JSON.stringify(phases, null, 2)};

const GLOSSARY = ${JSON.stringify(glossaryTerms, null, 2)};

const ARTIFACTS = ${JSON.stringify(artifacts, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
  console.log(`\n✅ 已生成 ${OUTPUT_PATH}`);

  syncCounts(totalLessons, phases.length, artifacts.length);
  syncReadme(totalLessons);
  writeSitemap(phases, glossaryTerms.length);
  writeLlms(phases, glossaryTerms.length, artifacts.length);
}

// ─── 基于网站渲染所用的同一份 PHASES 生成 sitemap.xml ───────────────────
function writeSitemap(phases, glossaryCount) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/', priority: '1.0', freq: 'weekly' },
    { loc: '/catalog.html', priority: '0.8', freq: 'weekly' },
    { loc: '/prereqs.html', priority: '0.7', freq: 'monthly' },
  ];
  if (glossaryCount > 0) urls.push({ loc: '/glossary.html', priority: '0.6', freq: 'monthly' });
  for (const phase of phases) {
    for (const l of phase.lessons) {
      const p = lessonPath(l.url);
      if (p) urls.push({ loc: '/lesson.html?path=' + p, priority: '0.6', freq: 'monthly' });
    }
  }
  const body = urls.map(u =>
    `  <url>\n    <loc>${SITE_ORIGIN}${u.loc}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n` +
    `    <priority>${u.priority}</priority>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml, 'utf8');
  console.log(`   已写入 sitemap.xml（${urls.length} 个 URLs）`);
}

// ─── llms.txt：为 AI agents 准备的课程链接地图 ───────────
function writeLlms(phases, glossaryCount, artifactCount) {
  let total = 0;
  phases.forEach(p => { total += p.lessons.filter(l => lessonPath(l.url)).length; });
  let out = `# AI Engineering from Scratch\n\n`;
  out += `> 一套免费的开源课程，手写构建每一个核心 AI algorithm — 从 linear algebra 到 autonomous agents，覆盖 ${phases.length} 个 phases、${total} 节 lessons。Python、TypeScript、Rust、Julia。\n\n`;
  out += `Canonical site: ${SITE_ORIGIN}\n`;
  out += `Source: https://github.com/cluster1900/ai-engineering-from-scratch-zh\n`;
  out += `术语表条目: ${glossaryCount} · 可复用输出（prompts/skills/agents）: ${artifactCount}\n\n`;
  for (const phase of phases) {
    out += `## Phase ${phase.id}: ${phase.name}\n`;
    if (phase.desc) out += `${phase.desc}\n`;
    out += `\n`;
    for (const l of phase.lessons) {
      const p = lessonPath(l.url);
      if (!p) continue;
      const note = l.summary ? ` — ${l.summary}` : '';
      out += `- [${l.name}](${SITE_ORIGIN}/lesson.html?path=${p})${note}\n`;
    }
    out += `\n`;
  }
  out += `## Optional\n`;
  out += `- [Catalog](${SITE_ORIGIN}/catalog.html) — 完整的可搜索 lesson 索引\n`;
  out += `- [路线图](${SITE_ORIGIN}/prereqs.html) — 跨 phases 的 prerequisite 顺序\n`;
  if (glossaryCount > 0) out += `- [术语表](${SITE_ORIGIN}/glossary.html) — ${glossaryCount} 个 terms 的通俗定义\n`;
  fs.writeFileSync(path.join(__dirname, 'llms.txt'), out, 'utf8');
  console.log(`   已写入 llms.txt`);
}

// ─── 从源数据重新生成 README stats block + lessons badge ───────────
function syncReadme(lessons) {
  const readmePath = path.join(REPO_ROOT, 'README.md');
  if (!fs.existsSync(readmePath)) return;
  let md = fs.readFileSync(readmePath, 'utf8');
  const before = md;

  // 让 lessons badge 与实时数量保持同步（URL value + alt text）
  md = md.replace(/badge\/lessons-\d+-/g, `badge/lessons-${lessons}-`);
  md = md.replace(/alt="\d+ lessons"/g, `alt="${lessons} lessons"`);

  // 从 site/stats.json 重新生成 traffic proof block
  const statsPath = path.join(__dirname, 'stats.json');
  if (fs.existsSync(statsPath)) {
    try {
      const s = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
      const fmt = n => Number(n).toLocaleString('en-US');
      const block =
        '<!-- STATS:START (generated from site/stats.json by build.js — do not edit by hand) -->\n' +
        `<p align="center"><sub><b>${fmt(s.visitors30d)}</b> readers &nbsp;·&nbsp; ` +
        `<b>${fmt(s.pageViews30d)}</b> page views in the last ${s.period} &nbsp;·&nbsp; ` +
        `as of ${s.updated}</sub></p>\n` +
        '<!-- STATS:END -->';
      const statsRe = /<!-- STATS:START[\s\S]*?<!-- STATS:END -->/;
      if (statsRe.test(md)) {
        md = md.replace(statsRe, block);
      } else {
        // Self-heal：如果 markers 被移除或破坏，则重新插入该 block
        md = md.replace(/\n## How this works/, `\n${block}\n\n## How this works`);
      }
    } catch (err) {
      console.warn(`⚠️  README stats sync 已跳过：${err.message}`);
    }
  }

  if (md !== before) {
    fs.writeFileSync(readmePath, md, 'utf8');
    console.log('   已同步 README stats + lessons badge');
  }
}

// ─── 保持 marketing counts 同步（single source of truth = 本次 build）──
function syncCounts(lessons, phaseCount, outputs) {
  const targets = ['index.html', 'catalog.html', 'lesson.html', 'prereqs.html', 'cmdpalette.js'];
  for (const f of targets) {
    const p = path.join(__dirname, f);
    if (!fs.existsSync(p)) continue;
    const before = fs.readFileSync(p, 'utf8');
    const after = before
      .replace(/\b\d+( AI engineering)? lessons\b/g, `${lessons}$1 lessons`)
      .replace(/\b\d+ phases\b/g, `${phaseCount} phases`)
      .replace(/\b\d+ outputs\b/g, `${outputs} outputs`);
    if (after !== before) {
      fs.writeFileSync(p, after, 'utf8');
      console.log(`   已同步 ${f} 中的 counts`);
    }
  }
}

build();
