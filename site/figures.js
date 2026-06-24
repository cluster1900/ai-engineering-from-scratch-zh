/* figures.js — makingsoftware.com 风格的大规模动画 SVG 讲解图。
   自动挂载: <div data-figure="tokenizer-bpe"></div>
   目录:
     tokenizer-bpe        — text → words → BPE merges，实时观察 learned merges
     ngram-machine        — sliding window 构建 prob table，并 sample 新 text
     attention-matrix     — 完整 N×N attention grid 点亮，value blend
     embedding-arithmetic — king − man + woman → queen，Vectors 在 2D 中飞行
     transformer-block    — data 流经 residual + MHA + FFN layers
     attention-lookup     — 紧凑版（legacy）softmax-of-scores
     token-strip          — 紧凑版（legacy）text vs words vs BPE
     loss-curve           — 紧凑版（legacy）training curve
     embedding-projection — 紧凑版（legacy）cluster jitter
     kv-cache             — 紧凑版（legacy）growing cache
   无依赖。Hover 暂停。大图支持 step controls。Reduced-motion = 良好的静态图。
*/
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs = {}, kids = []) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    (Array.isArray(kids) ? kids : [kids]).filter(Boolean).forEach(c => e.appendChild(c));
    return e;
  }
  const txt = (s) => document.createTextNode(s);

  // 带 hover 暂停与可选 step control 的 host loop
  function loop(host, fn, period = 6000, opts = {}) {
    let raf, paused = false, t0 = performance.now(), localT = 0;
    const onTick = (now) => {
      if (!paused) localT = ((now - t0) % period) / period;
      fn(localT);
      raf = requestAnimationFrame(onTick);
    };
    host.addEventListener('mouseenter', () => paused = true);
    host.addEventListener('mouseleave', () => paused = false);
    if (reduced) { fn(opts.staticT ?? 0.62); return () => {}; }
    raf = requestAnimationFrame(onTick);
    return () => cancelAnimationFrame(raf);
  }

  function softmax(xs, t = 1) {
    const m = Math.max(...xs), e = xs.map(x => Math.exp((x - m) / t));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map(v => v / s);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeIO(t) { return t < .5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2) / 2; }

  /* ───────────────────────── 大型图示 ───────────────────────── */

  /* tokenizer-bpe ── 720x520
     一个长字符串依次经过三条“轨道”:
       1. raw chars       （逐像素）
       2. byte-pair scan  （高亮连续 pair，增加 count）
       3. merged tokens   （新学到的 merges 替换 pairs）
     右侧自上而下显示正在学习的 merge rules。
  */
  function tokenizerBPE(host) {
    const W = 760, H = 540;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'BPE Tokenizer 训练' });
    host.appendChild(svg);

    // 标题行
    svg.appendChild(el('text', { x: 18, y: 22, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('语料')]));
    svg.appendChild(el('text', { x: 18, y: 162, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('扫描 PAIRS')]));
    svg.appendChild(el('text', { x: 18, y: 322, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('MERGED TOKENS')]));
    svg.appendChild(el('text', { x: W - 18, y: 22, 'text-anchor':'end', 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.16em', fill:'var(--blueprint)' }, [txt('LEARNED MERGES')]));

    // 小语料 — cells 中的 chars
    const corpus = "the_cat_sat_on_the_mat_the_cat_ate";
    const chars = corpus.split('');
    const CW = 18, CH = 28, X0 = 18, Y_RAW = 36, Y_SCAN = 176, Y_MERGE = 336;

    // Raw 行
    const rawCells = chars.map((c, i) => {
      const x = X0 + i * CW;
      const g = el('g', {});
      g.appendChild(el('rect', { x, y: Y_RAW, width: CW - 1, height: CH, fill: 'transparent', stroke:'var(--rule-soft)', 'stroke-width': 1 }));
      g.appendChild(el('text', { x: x + (CW-1)/2, y: Y_RAW + CH/2 + 4, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 13, fill:'var(--ink)' }, [txt(c === '_' ? '·' : c)]));
      svg.appendChild(g);
      return g;
    });

    // Scan 行 — 同样的 chars，带一个滑动 pair 高亮和一个 “count++” 弹出层
    const scanCells = chars.map((c, i) => {
      const x = X0 + i * CW;
      const g = el('g', {});
      g.appendChild(el('rect', { x, y: Y_SCAN, width: CW - 1, height: CH, fill: 'transparent', stroke:'var(--rule-soft)', 'stroke-width': 1 }));
      g.appendChild(el('text', { x: x + (CW-1)/2, y: Y_SCAN + CH/2 + 4, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 13, fill:'var(--ink)' }, [txt(c === '_' ? '·' : c)]));
      svg.appendChild(g);
      return g;
    });
    const scanBracket = el('rect', { y: Y_SCAN - 4, height: CH + 8, width: CW * 2 + 2, fill:'transparent', stroke:'var(--blueprint)', 'stroke-width': 2 });
    svg.appendChild(scanBracket);

    // pair-counter 浮层
    const counter = el('g', {});
    const counterBg = el('rect', { x: 0, y: 0, width: 84, height: 24, fill:'var(--blueprint-tint-strong)', stroke:'var(--blueprint)', 'stroke-width': 1 });
    const counterTx = el('text', { x: 42, y: 16, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 12, fill:'var(--ink)' });
    counter.appendChild(counterBg); counter.appendChild(counterTx);
    counter.setAttribute('opacity', '0');
    svg.appendChild(counter);

    // Merge 行 — 从 chars 开始，随运行推进累积 merges
    // 规划 merge schedule: 每个“step”在所有出现位置合并一个 pair。
    const mergeSchedule = [
      { pair: ['t','h'], joined: 'th' },
      { pair: ['th','e'], joined: 'the' },
      { pair: ['the','·'], joined: 'the·' },
      { pair: ['c','a'], joined: 'ca' },
      { pair: ['ca','t'], joined: 'cat' }
    ];
    const STEPS = mergeSchedule.length + 1;

    function tokensAt(step) {
      // 从 chars 开始（用 · 表示空格）。
      let toks = chars.map(c => c === '_' ? '·' : c);
      const lastStep = Math.min(step, mergeSchedule.length);
      for (let s = 0; s < lastStep; s++) {
        const { pair, joined } = mergeSchedule[s];
        const out = [];
        for (let i = 0; i < toks.length; i++) {
          if (toks[i] === pair[0] && toks[i+1] === pair[1]) {
            out.push(joined); i++;
          } else out.push(toks[i]);
        }
        toks = out;
      }
      return toks;
    }

    // 我们将 merge 行渲染为弹性序列；在 step 变化时重绘
    const mergeRowG = el('g', {});
    svg.appendChild(mergeRowG);
    function drawMergeRow(step, justMerged) {
      while (mergeRowG.firstChild) mergeRowG.removeChild(mergeRowG.firstChild);
      const toks = tokensAt(step);
      let x = X0;
      toks.forEach(tok => {
        const w = Math.max(CW, tok.length * 9 + 10);
        const isJustMerged = justMerged && tok === justMerged;
        const fill = isJustMerged ? 'var(--blueprint)' : (tok.length > 1 ? 'var(--blueprint-tint-strong)' : 'transparent');
        const stroke = tok.length > 1 ? 'var(--blueprint)' : 'var(--rule-soft)';
        mergeRowG.appendChild(el('rect', { x, y: Y_MERGE, width: w - 2, height: CH, fill, stroke, 'stroke-width': 1 }));
        mergeRowG.appendChild(el('text', {
          x: x + (w - 2)/2, y: Y_MERGE + CH/2 + 4, 'text-anchor':'middle',
          'font-family':'var(--font-mono)', 'font-size': 12,
          fill: isJustMerged ? 'var(--bg)' : 'var(--ink)'
        }, [txt(tok)]));
        x += w;
      });
    }
    drawMergeRow(0, null);

    // Learned-merges 侧栏（右侧）
    const SBX = W - 240;
    svg.appendChild(el('rect', { x: SBX, y: 36, width: 220, height: 360, fill:'transparent', stroke:'var(--rule-soft)', 'stroke-width': 1 }));
    const merges = mergeSchedule.map((m, i) => {
      const y = 60 + i * 30;
      const g = el('g', { opacity: 0 });
      g.appendChild(el('text', { x: SBX + 12, y, 'font-family':'var(--font-mono)', 'font-size': 12, fill:'var(--ink-mute)' }, [txt(String(i+1).padStart(2,'0'))]));
      g.appendChild(el('text', { x: SBX + 40, y, 'font-family':'var(--font-mono)', 'font-size': 12, fill:'var(--ink)' },
        [txt(m.pair.join(' + ') + ' → ')]));
      g.appendChild(el('text', { x: SBX + 156, y, 'font-family':'var(--font-mono)', 'font-size': 12, 'font-weight': 700, fill:'var(--blueprint)' }, [txt(m.joined)]));
      svg.appendChild(g);
      return g;
    });
    // vocab-size 读数
    const vocabReadout = el('text', { x: W - 18, y: H - 18, 'text-anchor':'end', 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.12em', fill:'var(--ink-mute)' });
    svg.appendChild(vocabReadout);

    // 状态说明
    const status = el('text', { x: 18, y: H - 18, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.12em', fill:'var(--blueprint)' });
    svg.appendChild(status);

    // 动画: 每个“stage”先滑动 scan window 经过文本，再提交一次 merge。
    const PAIR_SCAN_FRAC = 0.65; // stage 的 65% 用于 scanning，35% 用于 applying merge
    let lastStage = -1;
    loop(host, (t) => {
      const stage = Math.floor(t * STEPS);
      const tInStage = (t * STEPS) - stage;
      const m = mergeSchedule[stage];

      // Scan bracket 位置 — 扫过整个语料
      const scanIdx = Math.floor(tInStage / PAIR_SCAN_FRAC * (chars.length - 1));
      const clamped = Math.min(Math.max(scanIdx, 0), chars.length - 2);
      scanBracket.setAttribute('x', X0 + clamped * CW - 1);

      // 给 scan cells 着色: 高亮当前 pair
      scanCells.forEach((g, i) => {
        const r = g.firstChild;
        r.setAttribute('fill', (i === clamped || i === clamped + 1) ? 'var(--blueprint-tint-strong)' : 'transparent');
      });

      // scan bracket 旁边的浮动 count
      if (m && tInStage < PAIR_SCAN_FRAC) {
        const a = chars[clamped] === '_' ? '·' : chars[clamped];
        const b = chars[clamped+1] === '_' ? '·' : chars[clamped+1];
        const looksLikePair = (a === m.pair[0] && b === m.pair[1]) ||
                              (m.pair[0].length > 1 && a + b === m.pair[0] + m.pair[1]);
        counter.setAttribute('opacity', looksLikePair ? '1' : '0.35');
        counterTx.textContent = `${a}${b}  ×${looksLikePair ? Math.max(1, Math.floor(tInStage * 8)) : 1}`;
        counter.setAttribute('transform', `translate(${X0 + clamped * CW - 12}, ${Y_SCAN - 36})`);
      } else {
        counter.setAttribute('opacity', '0');
      }

      // 跨过 PAIR_SCAN_FRAC 后应用 merge
      const applied = tInStage >= PAIR_SCAN_FRAC ? stage + 1 : stage;
      if (applied !== lastStage) {
        drawMergeRow(applied, m && tInStage >= PAIR_SCAN_FRAC ? m.joined : null);
        lastStage = applied;
      }

      // 显示侧栏 entries
      merges.forEach((g, i) => {
        const visible = applied > i ? 1 : (applied === i && tInStage >= PAIR_SCAN_FRAC ? 1 : 0);
        g.setAttribute('opacity', visible);
      });

      // status + vocab
      const baseVocab = 28; // 类似 alphabet
      vocabReadout.textContent = 'VOCAB · ' + (baseVocab + applied);
      if (!m) {
        status.textContent = 'TOKENIZER 已学习 · LOOPING';
      } else if (tInStage < PAIR_SCAN_FRAC) {
        status.textContent = '正在统计 PAIRS  ·  step ' + (stage+1) + '/' + mergeSchedule.length;
      } else {
        status.textContent = '已 MERGE  ' + m.pair.join(' + ') + '  →  ' + m.joined;
      }
    }, 14000);
  }

  /* ngram-machine ── 720x420
     Sliding bigram window 在句子上移动，在右侧构建 probability table。
     table “预热”后，在下方 sample 一个新句子。
  */
  function ngramMachine(host) {
    const W = 760, H = 460;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'N-gram Language Model' });
    host.appendChild(svg);

    svg.appendChild(el('text', { x: 18, y: 22, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('语料 · BIGRAM WINDOW')]));
    svg.appendChild(el('text', { x: 18, y: 248, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.16em', fill:'var(--blueprint)' }, [txt('从 P(next | current) SAMPLE')]));
    svg.appendChild(el('text', { x: W - 18, y: 22, 'text-anchor':'end', 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('TRANSITION TABLE')]));

    const tokens = ['the','cat','sat','on','the','mat','the','dog','sat','on','the','log','the','cat','ate'];
    // chip layout
    const Y_CORPUS = 56;
    const chipW = 56, chipH = 30, chipGap = 6;
    const chips = tokens.map((tok, i) => {
      const x = 18 + i * (chipW + chipGap);
      const g = el('g', {});
      g.appendChild(el('rect', { x, y: Y_CORPUS, width: chipW, height: chipH, fill:'transparent', stroke:'var(--rule-soft)', 'stroke-width':1 }));
      g.appendChild(el('text', { x: x + chipW/2, y: Y_CORPUS + 20, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size':12, fill:'var(--ink)' }, [txt(tok)]));
      svg.appendChild(g);
      return { g, x, tok };
    });
    // window bracket
    const winRect = el('rect', { y: Y_CORPUS - 4, height: chipH + 8, width: chipW * 2 + chipGap, fill:'transparent', stroke:'var(--blueprint)', 'stroke-width': 2 });
    svg.appendChild(winRect);

    // 构建实际的 transition table（counts → probs），稍后用动画填充
    const transitions = {};
    for (let i = 0; i < tokens.length - 1; i++) {
      const a = tokens[i], b = tokens[i+1];
      transitions[a] = transitions[a] || {};
      transitions[a][b] = (transitions[a][b] || 0) + 1;
    }
    // 侧栏: 展示 table 中的几行
    const SBX = W - 280, SBY = 50;
    svg.appendChild(el('rect', { x: SBX, y: SBY, width: 264, height: 180, fill:'transparent', stroke:'var(--rule-soft)', 'stroke-width': 1 }));

    const rowsToShow = ['the','cat','sat','on','dog'];
    const rowEls = {};
    rowsToShow.forEach((src, i) => {
      const y = SBY + 20 + i * 32;
      const head = el('text', { x: SBX + 12, y, 'font-family':'var(--font-mono)', 'font-size': 12, fill:'var(--ink)' }, [txt(src + ' →')]);
      svg.appendChild(head);
      rowEls[src] = { y, bars: [] };
    });

    // 每个 (src,dst) bar 都有一个 placeholder，稍后填充
    function ensureBar(src, dst) {
      const row = rowEls[src]; if (!row) return null;
      let b = row.bars.find(b => b.dst === dst);
      if (b) return b;
      const idx = row.bars.length;
      const x = SBX + 70 + idx * 40;
      const wid = 36;
      const labelTx = el('text', { x: x + wid/2, y: row.y - 16, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 9, fill:'var(--ink-mute)' }, [txt(dst)]);
      const bg = el('rect', { x, y: row.y - 12, width: wid, height: 12, fill: 'var(--rule-soft)' });
      const fg = el('rect', { x, y: row.y - 12, width: 0, height: 12, fill: 'var(--blueprint)' });
      svg.appendChild(labelTx); svg.appendChild(bg); svg.appendChild(fg);
      b = { dst, fg, count: 0, max: 1 };
      row.bars.push(b);
      return b;
    }

    // sampling lane（底部）
    const sampleY = 300;
    const sampleChipsG = el('g', {});
    svg.appendChild(sampleChipsG);

    // status
    const status = el('text', { x: 18, y: H - 18, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.12em', fill:'var(--blueprint)' });
    svg.appendChild(status);
    const phaseTx = el('text', { x: W - 18, y: H - 18, 'text-anchor':'end', 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.12em', fill:'var(--ink-mute)' });
    svg.appendChild(phaseTx);

    // 动画: phase A — window 滑过语料并填充 table；phase B — 生成新 tokens
    const PHASE_A = 0.6; // 60% counting，40% generating
    const totalPairs = tokens.length - 1;
    let lastSampleStep = -1, sampleHistory = [];

    function rebuildSample() {
      while (sampleChipsG.firstChild) sampleChipsG.removeChild(sampleChipsG.firstChild);
      let x = 18;
      sampleHistory.forEach((tok, i) => {
        const wid = 56;
        const fresh = (i === sampleHistory.length - 1);
        sampleChipsG.appendChild(el('rect', { x, y: sampleY, width: wid, height: chipH, fill: fresh ? 'var(--blueprint)' : 'var(--blueprint-tint-strong)', stroke:'var(--blueprint)', 'stroke-width': 1 }));
        sampleChipsG.appendChild(el('text', { x: x + wid/2, y: sampleY + 20, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 12, fill: fresh ? 'var(--bg)' : 'var(--ink)' }, [txt(tok)]));
        x += wid + chipGap;
      });
    }

    function pickNext(cur) {
      const row = transitions[cur]; if (!row) return tokens[0];
      const entries = Object.entries(row);
      const total = entries.reduce((a, [, c]) => a + c, 0);
      let r = Math.random() * total;
      for (const [k, c] of entries) { r -= c; if (r <= 0) return k; }
      return entries[entries.length-1][0];
    }

    loop(host, (t) => {
      if (t < PHASE_A) {
        const localT = t / PHASE_A;
        const i = Math.min(Math.floor(localT * totalPairs), totalPairs - 1);
        winRect.setAttribute('x', chips[i].x - 1);
        chips.forEach((c, k) => c.g.firstChild.setAttribute('fill', (k === i || k === i+1) ? 'var(--blueprint-tint-strong)' : 'transparent'));

        // 累积截至 index i 的 counts
        // （每帧确定性重算，以保持视觉一致）
        const counts = {};
        for (let p = 0; p <= i; p++) {
          const a = tokens[p], b = tokens[p+1];
          counts[a] = counts[a] || {};
          counts[a][b] = (counts[a][b] || 0) + 1;
        }
        Object.keys(rowEls).forEach(src => {
          if (!counts[src]) return;
          const total = Object.values(counts[src]).reduce((a, b) => a + b, 0);
          Object.entries(counts[src]).forEach(([dst, c]) => {
            const bar = ensureBar(src, dst);
            if (!bar) return;
            const prob = c / total;
            bar.fg.setAttribute('width', prob * 36);
          });
        });
        status.textContent = '正在统计 BIGRAMS  ·  ' + (i+1) + ' / ' + totalPairs;
        phaseTx.textContent = 'PHASE 1';
        // reset sample
        sampleHistory = []; lastSampleStep = -1;
        rebuildSample();
      } else {
        const localT = (t - PHASE_A) / (1 - PHASE_A);
        // fade out window
        winRect.setAttribute('x', -50);
        chips.forEach(c => c.g.firstChild.setAttribute('fill', 'transparent'));

        const N = 9;
        const step = Math.min(N, Math.floor(localT * N));
        if (step !== lastSampleStep) {
          if (step === 0) sampleHistory = ['the'];
          else if (step > sampleHistory.length - 1) {
            const cur = sampleHistory[sampleHistory.length - 1];
            sampleHistory.push(pickNext(cur));
          }
          rebuildSample();
          lastSampleStep = step;
        }
        status.textContent = 'SAMPLING  ·  ' + sampleHistory.join(' ');
        phaseTx.textContent = 'PHASE 2';
      }
    }, 12000);
  }

  /* attention-matrix ── 720x520
     12-token 句子，完整 N×N attention grid 点亮。
     query head 逐行扫过；cells 根据 softmax weight 点亮。
     下方一个小 “value blend” panel 显示得到的 context vector。
  */
  function attentionMatrix(host) {
    const W = 760, H = 540;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Self-Attention Matrix' });
    host.appendChild(svg);

    const TOKENS = ['the','cat','sat','on','the','mat','because','it','was','warm','and','sunny'];
    const N = TOKENS.length;
    const M = 384; // matrix size
    const MX = 110, MY = 70;
    const cell = M / N;

    svg.appendChild(el('text', { x: 18, y: 22, 'font-family':'var(--font-mono)', 'font-size':11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('SELF-ATTENTION  ·  Q · Kᵀ → SOFTMAX → · V')]));
    svg.appendChild(el('text', { x: MX + M + 18, y: MY + 14, 'font-family':'var(--font-mono)', 'font-size': 10, 'letter-spacing':'.14em', fill:'var(--ink-mute)' }, [txt('KEYS →')]));
    svg.appendChild(el('text', { x: MX - 8, y: MY - 12, 'font-family':'var(--font-mono)', 'font-size': 10, 'letter-spacing':'.14em', fill:'var(--ink-mute)', 'text-anchor':'end' }, [txt('QUERIES ↓')]));

    // top labels
    TOKENS.forEach((t, i) => {
      svg.appendChild(el('text', { x: MX + i*cell + cell/2, y: MY - 8, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 10, fill:'var(--ink-soft)' }, [txt(t)]));
    });
    // left labels
    TOKENS.forEach((t, i) => {
      svg.appendChild(el('text', { x: MX - 8, y: MY + i*cell + cell/2 + 4, 'text-anchor':'end', 'font-family':'var(--font-mono)', 'font-size': 10, fill:'var(--ink-soft)' }, [txt(t)]));
    });

    // grid cells
    const cells = [];
    for (let i = 0; i < N; i++) {
      cells.push([]);
      for (let j = 0; j < N; j++) {
        const r = el('rect', {
          x: MX + j*cell, y: MY + i*cell, width: cell - 1, height: cell - 1,
          fill:'var(--blueprint-tint)', stroke:'var(--rule-soft)', 'stroke-width': .5
        });
        svg.appendChild(r);
        cells[i].push(r);
      }
    }
    // 当前行高亮
    const rowHi = el('rect', { x: MX - 4, y: MY, width: M + 8, height: cell, fill:'transparent', stroke:'var(--blueprint)', 'stroke-width': 1.5 });
    svg.appendChild(rowHi);

    // value blend bar — 在底部显示 weighted blend
    const VY = MY + M + 32;
    svg.appendChild(el('text', { x: MX, y: VY - 8, 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.14em', fill:'var(--blueprint)' }, [txt('CONTEXT VECTOR  =  Σ αⱼ · vⱼ')]));
    const valBars = [];
    const VBW = M / N;
    for (let j = 0; j < N; j++) {
      const x = MX + j * VBW;
      svg.appendChild(el('rect', { x, y: VY, width: VBW - 2, height: 60, fill: 'var(--rule-soft)' }));
      const fg = el('rect', { x, y: VY + 60, width: VBW - 2, height: 0, fill: 'var(--blueprint)' });
      svg.appendChild(fg);
      svg.appendChild(el('text', { x: x + (VBW-2)/2, y: VY + 78, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 9, fill: 'var(--ink-mute)' }, [txt(TOKENS[j])]));
      valBars.push(fg);
    }

    // status
    const status = el('text', { x: 18, y: H - 18, 'font-family':'var(--font-mono)', 'font-size': 11, 'letter-spacing':'.12em', fill:'var(--blueprint)' });
    svg.appendChild(status);

    // synthetic affinity: 每个 query 都“寻找”语义相关的 keys。
    // 我们硬编码一个有意思的例子: "it" (idx 7) 以 soft 方式 attends to "cat" (1)。
    function affinityRow(qi) {
      // Base: noise；为选定 target 添加 bonus
      const targets = { 6: [3,4,5], 7: [1, 0], 9: [3,4,5], 10:[6], 11:[6] };
      const tArr = targets[qi];
      return Array.from({length: N}, (_, kj) => {
        let s = -Math.pow(qi - kj, 2) * 0.15;
        if (tArr && tArr.includes(kj)) s += 2.4;
        if (kj === qi) s += 1.0;
        return s;
      });
    }

    loop(host, (t) => {
      const qF = t * N;
      const qi = Math.min(N - 1, Math.floor(qF));
      const sub = qF - qi;
      rowHi.setAttribute('y', MY + qi * cell);

      // 填充 row weights
      const w = softmax(affinityRow(qi), 0.7);
      for (let j = 0; j < N; j++) {
        const a = w[j];
        cells[qi][j].setAttribute('fill', `color-mix(in srgb, var(--blueprint) ${Math.round(a*100*1.4)}%, var(--blueprint-tint))`);
      }
      // 将其他行重置为 soft default（轻微 decay）
      for (let i = 0; i < N; i++) {
        if (i === qi) continue;
        for (let j = 0; j < N; j++) {
          cells[i][j].setAttribute('fill', i === j ? 'var(--blueprint-tint-strong)' : 'var(--blueprint-tint)');
        }
      }
      // value blend
      for (let j = 0; j < N; j++) {
        valBars[j].setAttribute('y', VY + 60 - w[j] * 60);
        valBars[j].setAttribute('height', w[j] * 60);
      }
      status.textContent = 'QUERY: "' + TOKENS[qi] + '"  ·  TOP KEY: "' + TOKENS[w.indexOf(Math.max(...w))] + '"';
    }, 11000);
  }

  /* embedding-arithmetic ── 760x440
     Words 绘制在 2D Embedding space 中。Vectors 动画展示:
       king − man + woman ≈ queen
  */
  function embeddingArithmetic(host) {
    const W = 760, H = 460, P = 60;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Word Vector arithmetic' });
    host.appendChild(svg);

    svg.appendChild(el('text', { x: 18, y: 22, 'font-family':'var(--font-mono)', 'font-size':11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('EMBEDDING SPACE  ·  PCA(2) PROJECTION')]));
    svg.appendChild(el('text', { x: W - 18, y: 22, 'text-anchor':'end', 'font-family':'var(--font-mono)', 'font-size':11, 'letter-spacing':'.16em', fill:'var(--blueprint)' }, [txt('king − man + woman ≈ queen')]));

    // grid
    for (let i = 0; i <= 8; i++) {
      const x = P + (i / 8) * (W - 2*P);
      const y = P + (i / 8) * (H - 2*P - 40);
      svg.appendChild(el('line', { x1: x, y1: P, x2: x, y2: H - P - 40, stroke:'var(--rule-soft)', 'stroke-width': .6 }));
      svg.appendChild(el('line', { x1: P, y1: y, x2: W - P, y2: y, stroke:'var(--rule-soft)', 'stroke-width': .6 }));
    }

    // ambient cloud（灰色 words）
    const cloud = ['cat','dog','run','sit','apple','car','river','code','book','sky','fire','river'];
    cloud.forEach((wd, i) => {
      const cx = P + ((Math.sin(i*1.7)+1)/2) * (W - 2*P);
      const cy = P + ((Math.cos(i*1.3)+1)/2) * (H - 2*P - 40);
      svg.appendChild(el('circle', { cx, cy, r: 2, fill:'var(--ink-mute)', opacity: .35 }));
      svg.appendChild(el('text', { x: cx + 6, y: cy + 4, 'font-family':'var(--font-mono)', 'font-size': 10, fill:'var(--ink-mute)', opacity: .5 }, [txt(wd)]));
    });

    // anchored points（单位方块 0..1）
    const pts = {
      king:  { x: 0.30, y: 0.34 },
      man:   { x: 0.30, y: 0.62 },
      queen: { x: 0.62, y: 0.34 },
      woman: { x: 0.62, y: 0.62 }
    };
    function px(p) { return { x: P + p.x * (W - 2*P), y: P + p.y * (H - 2*P - 40) }; }

    const dots = {};
    Object.entries(pts).forEach(([name, p]) => {
      const { x, y } = px(p);
      const g = el('g', {});
      g.appendChild(el('circle', { cx: x, cy: y, r: 5, fill:'var(--blueprint)' }));
      g.appendChild(el('text', { x: x + 10, y: y + 5, 'font-family':'var(--font-mono)', 'font-size': 13, 'font-weight': 700, fill:'var(--ink)' }, [txt(name)]));
      svg.appendChild(g);
      dots[name] = { x, y };
    });

    // arrow defs
    const defs = el('defs', {});
    const mk = (id, color) => {
      const m = el('marker', { id, viewBox:'0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' });
      m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 Z', fill: color }));
      defs.appendChild(m);
    };
    mk('arr-blue', 'var(--blueprint)');
    mk('arr-warn', 'var(--warn)');
    mk('arr-soft', 'var(--ink-mute)');
    svg.appendChild(defs);

    // moving traveller dot + trail line + result dot
    const trail = el('path', { fill:'none', stroke:'var(--blueprint)', 'stroke-width': 2, 'stroke-dasharray':'4 4' });
    svg.appendChild(trail);
    const trav = el('circle', { r: 6, fill:'var(--warn)', stroke:'var(--bg)', 'stroke-width': 2 });
    svg.appendChild(trav);
    const result = el('g', { opacity: 0 });
    result.appendChild(el('circle', { cx: dots.queen.x, cy: dots.queen.y, r: 14, fill:'transparent', stroke:'var(--warn)', 'stroke-width': 2, 'stroke-dasharray':'3 3' }));
    result.appendChild(el('text', { x: dots.queen.x + 22, y: dots.queen.y - 12, 'font-family':'var(--font-mono)', 'font-size': 11, fill:'var(--warn)' }, [txt('= QUEEN ✓')]));
    svg.appendChild(result);

    const eqn = el('text', { x: W/2, y: H - 28, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 13, 'letter-spacing':'.06em', fill:'var(--ink)' }, [txt('king')]);
    svg.appendChild(eqn);

    // 四个 phases: 展示 king → subtract man → add woman → land near queen
    loop(host, (t) => {
      // path waypoints
      const start = dots.king;
      const afterMinusMan = { x: start.x + (start.x - dots.man.x), y: start.y + (start.y - dots.man.y) };
      const afterPlusWoman = { x: afterMinusMan.x + (dots.woman.x - dots.king.x), y: afterMinusMan.y + (dots.woman.y - dots.king.y) };
      // ↑ 这就是 "king + (woman - man)"，会落到 queen 上。
      const wp = [start, afterMinusMan, afterPlusWoman];

      let pos = start, segIdx = 0, segT = 0;
      if (t < 0.33) { segIdx = 0; segT = t / 0.33; }
      else if (t < 0.66) { segIdx = 1; segT = (t - 0.33) / 0.33; }
      else { segIdx = 2; segT = (t - 0.66) / 0.34; }

      const a = wp[segIdx], b = wp[Math.min(segIdx+1, wp.length-1)];
      const e = easeIO(segT);
      pos = { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) };
      trav.setAttribute('cx', pos.x); trav.setAttribute('cy', pos.y);

      // trail = 当前已经走过的 path
      let d = `M ${start.x} ${start.y} `;
      for (let i = 0; i < segIdx; i++) d += `L ${wp[i+1].x} ${wp[i+1].y} `;
      d += `L ${pos.x} ${pos.y}`;
      trail.setAttribute('d', d);

      // equation status
      if (t < 0.05) eqn.textContent = 'king';
      else if (t < 0.33) eqn.textContent = 'king';
      else if (t < 0.66) eqn.textContent = 'king − man';
      else if (t < 0.95) eqn.textContent = 'king − man + woman';
      else eqn.textContent = 'king − man + woman  ≈  queen';

      result.setAttribute('opacity', t > 0.93 ? 1 : 0);
    }, 9000);
  }

  /* transformer-block ── 760x540
     Token Vectors 流经: + pos enc → MHA → residual → norm → FFN → residual → norm
     光束从左向右移动；residual arcs 在到达时发光。
  */
  function transformerBlock(host) {
    const W = 820, H = 620;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': 'Transformer block data flow' });
    host.appendChild(svg);

    svg.appendChild(el('text', { x: 18, y: 22, 'font-family':'var(--font-mono)', 'font-size':11, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('ONE TRANSFORMER BLOCK  ·  EMBED · MHA · NORM · FFN · NORM')]));

    // input column（左侧）: 6 个堆叠的 token “vectors”
    const colX = [70, 220, 380, 540, 720];
    const yTop = 70, vH = 26, vW = 78, gap = 7, NTOK = 6;
    function drawColumn(x, label) {
      svg.appendChild(el('text', { x, y: yTop - 12, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.14em', fill:'var(--ink-mute)' }, [txt(label)]));
      const arr = [];
      for (let i = 0; i < NTOK; i++) {
        const y = yTop + i * (vH + gap);
        const r = el('rect', { x: x - vW/2, y, width: vW, height: vH, fill:'var(--blueprint-tint)', stroke:'var(--rule-soft)', 'stroke-width': 1 });
        svg.appendChild(r);
        // 里面的小条纹看起来像一个 Vector
        for (let k = 0; k < 5; k++) {
          svg.appendChild(el('rect', { x: x - vW/2 + 6 + k*14, y: y + 8, width: 10, height: 12, fill:'var(--blueprint-tint-strong)' }));
        }
        arr.push({ r, x, y, cy: y + vH/2 });
      }
      return arr;
    }
    const colInput = drawColumn(colX[0], 'EMBED + POS');
    const colMHA   = drawColumn(colX[1], 'AFTER MHA');
    const colResA  = drawColumn(colX[2], '+ RESIDUAL · NORM');
    const colFFN   = drawColumn(colX[3], 'AFTER FFN');
    const colResB  = drawColumn(colX[4], '+ RESIDUAL · NORM');

    // op boxes 与 residual arcs 位于 column block 下方，因此不会重叠
    const colsBottom = yTop + NTOK*(vH+gap);   // ≈ 268
    const OP_Y = colsBottom + 50;              // op-box top
    const ARC_Y = OP_Y + 110;                  // residual arc baseline

    // residual arcs（skip lines），在 op row 下方弯曲
    function arc(x1, x2, y) {
      return el('path', {
        d: `M ${x1} ${y - 80} C ${(x1+x2)/2} ${y + 30}, ${(x1+x2)/2} ${y + 30}, ${x2} ${y - 80}`,
        fill:'none', stroke:'var(--ink-mute)', 'stroke-width': 1.2,
        'stroke-dasharray':'4 4', opacity: .5
      });
    }
    const resA = arc(colX[0], colX[2], ARC_Y);
    const resB = arc(colX[2], colX[4], ARC_Y);
    svg.appendChild(resA); svg.appendChild(resB);
    svg.appendChild(el('text', { x: (colX[0]+colX[2])/2, y: ARC_Y + 50, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 10, fill:'var(--ink-mute)' }, [txt('residual')]));
    svg.appendChild(el('text', { x: (colX[2]+colX[4])/2, y: ARC_Y + 50, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 10, fill:'var(--ink-mute)' }, [txt('residual')]));

    // op boxes between columns
    function opBox(x, label, sub) {
      const w = 110, h = 50, y = OP_Y;
      const g = el('g', {});
      g.appendChild(el('rect', { x: x - w/2, y, width: w, height: h, fill:'var(--bg)', stroke:'var(--blueprint)', 'stroke-width': 1.4 }));
      g.appendChild(el('text', { x, y: y + 21, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 13, 'font-weight': 700, fill:'var(--blueprint)' }, [txt(label)]));
      g.appendChild(el('text', { x, y: y + 37, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size': 8.5, fill:'var(--ink-mute)' }, [txt(sub)]));
      svg.appendChild(g);
      return { x, y, w, h, box: g };
    }
    const op1 = opBox((colX[0]+colX[1])/2, 'MHA', 'multi-head attn');
    const op2 = opBox((colX[1]+colX[2])/2, '+', 'residual + norm');
    const op3 = opBox((colX[2]+colX[3])/2, 'FFN', 'feed-forward');
    const op4 = opBox((colX[3]+colX[4])/2, '+', 'residual + norm');

    // beam particles
    const beam = el('circle', { r: 5, fill:'var(--warn)' });
    svg.appendChild(beam);
    // op 上的 pulse glow circle
    const pulse = el('circle', { r: 0, fill:'transparent', stroke:'var(--warn)', 'stroke-width': 2, opacity: 0 });
    svg.appendChild(pulse);

    // status
    const status = el('text', { x: 18, y: H - 18, 'font-family':'var(--font-mono)', 'font-size':11, 'letter-spacing':'.12em', fill:'var(--blueprint)' });
    svg.appendChild(status);

    const stations = [
      { from: colX[0], to: colX[1], op: op1, label: 'tokens query each other', color: 'var(--blueprint)' },
      { from: colX[1], to: colX[2], op: op2, label: 'add residual, normalize',  color: 'var(--ink)' },
      { from: colX[2], to: colX[3], op: op3, label: 'per-token MLP transform',  color: 'var(--blueprint)' },
      { from: colX[3], to: colX[4], op: op4, label: 'add residual, normalize',  color: 'var(--ink)' }
    ];

    loop(host, (t) => {
      const stage = Math.min(stations.length - 1, Math.floor(t * stations.length));
      const sT = (t * stations.length) - stage;
      const s = stations[stage];

      // beam travels through op
      let bx, by = OP_Y + 25;
      if (sT < 0.4) {
        bx = lerp(s.from, s.op.x, sT / 0.4);
      } else if (sT < 0.6) {
        bx = s.op.x;
        // pulse
        const p = (sT - 0.4) / 0.2;
        pulse.setAttribute('cx', s.op.x); pulse.setAttribute('cy', s.op.y + s.op.h/2);
        pulse.setAttribute('r', p * 60);
        pulse.setAttribute('opacity', 1 - p);
      } else {
        bx = lerp(s.op.x, s.to, (sT - 0.6) / 0.4);
        pulse.setAttribute('opacity', 0);
      }
      beam.setAttribute('cx', bx); beam.setAttribute('cy', by);

      // 给 beam 已经经过的 columns 着色
      [colInput, colMHA, colResA, colFFN, colResB].forEach((col, i) => {
        const reached = i <= stage + (sT > 0.6 ? 1 : 0);
        col.forEach(c => c.r.setAttribute('fill', reached ? 'var(--blueprint-tint-strong)' : 'var(--blueprint-tint)'));
      });

      // residual arc highlight
      resA.setAttribute('opacity', stage >= 1 ? 1 : 0.5);
      resA.setAttribute('stroke', stage >= 1 && sT < 0.6 ? 'var(--warn)' : 'var(--ink-mute)');
      resB.setAttribute('opacity', stage >= 3 ? 1 : 0.5);
      resB.setAttribute('stroke', stage >= 3 && sT < 0.6 ? 'var(--warn)' : 'var(--ink-mute)');

      status.textContent = 'STAGE ' + (stage+1) + ' / 4  ·  ' + s.label;
    }, 12000);
  }

  /* ───── compact / legacy figures（保留） ───── */

  function attentionLookup(host) {
    const W = 720, H = 280;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%' });
    host.appendChild(svg);
    const KEYS = 8;
    const qx = 60, qy = H/2;
    svg.appendChild(el('rect', { x: qx-26, y: qy-22, width: 52, height: 44, fill:'var(--blueprint)' }));
    svg.appendChild(el('text', { x: qx, y: qy+5, 'text-anchor':'middle', fill:'var(--bg)', 'font-family':'var(--font-mono)', 'font-size':14, 'font-weight':500 }, [txt('q')]));
    svg.appendChild(el('text', { x: qx, y: qy+44, 'text-anchor':'middle', fill:'var(--ink-mute)', 'font-family':'var(--font-mono)', 'font-size':9, 'letter-spacing':'.16em' }, [txt('QUERY')]));
    const kx0 = 200, kgap = 60, kw = 36, kh = 44;
    const ks = [], scoreLines = [], bars = [];
    for (let i = 0; i < KEYS; i++) {
      const x = kx0 + i*kgap;
      const k = el('rect', { x: x-kw/2, y: 30, width: kw, height: kh, fill:'var(--blueprint-tint-strong)', stroke:'var(--blueprint)', 'stroke-width':1 });
      svg.appendChild(k); ks.push(k);
      svg.appendChild(el('text', { x, y: 55, 'text-anchor':'middle', fill:'var(--ink)', 'font-family':'var(--font-mono)', 'font-size':12 }, [txt('k'+(i+1))]));
      const ln = el('line', { x1: qx+26, y1: qy, x2: x, y2: 74, stroke:'var(--rule-soft)', 'stroke-width':1, 'stroke-dasharray':'2 4' });
      svg.appendChild(ln); scoreLines.push(ln);
      svg.appendChild(el('rect', { x: x-kw/2, y: 158, width: kw, height: 80, fill:'var(--rule-soft)' }));
      const fg = el('rect', { x: x-kw/2, y: 238, width: kw, height: 0, fill:'var(--blueprint)' });
      svg.appendChild(fg); bars.push(fg);
      svg.appendChild(el('text', { x, y: 254, 'text-anchor':'middle', fill:'var(--ink-mute)', 'font-family':'var(--font-mono)', 'font-size':10 }, [txt('α'+(i+1))]));
    }
    svg.appendChild(el('text', { x: W-20, y: 22, 'text-anchor':'end', fill:'var(--ink-mute)', 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.16em' }, [txt('SOFTMAX(qK⊤/√d)')]));
    loop(host, (t) => {
      const center = t * (KEYS - 1);
      const raw = Array.from({length: KEYS}, (_, i) => -Math.pow(i - center, 2) * 0.7);
      const w = softmax(raw, 0.4);
      for (let i = 0; i < KEYS; i++) {
        const a = w[i];
        bars[i].setAttribute('y', 238 - a * 78);
        bars[i].setAttribute('height', a * 78);
        ks[i].setAttribute('fill', `color-mix(in srgb, var(--blueprint) ${Math.round(a*100)}%, var(--blueprint-tint-strong))`);
        scoreLines[i].setAttribute('stroke', a > 0.18 ? 'var(--blueprint)' : 'var(--rule-soft)');
        scoreLines[i].setAttribute('stroke-dasharray', a > 0.18 ? '4 0' : '2 4');
      }
    }, 6200);
  }

  function tokenStrip(host) {
    const W = 720, H = 140;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%' });
    host.appendChild(svg);
    const text = "the cat sat on the mat";
    const tokens = text.split(' ');
    const subwords = ["the", " cat", " sat", " on", " the", " m", "at"];
    const rows = [
      { y: 28, items: [text], label: 'TEXT' },
      { y: 68, items: tokens, label: 'WORDS' },
      { y: 108, items: subwords, label: 'BPE' }
    ];
    rows.forEach((row, ri) => {
      svg.appendChild(el('text', { x: 8, y: row.y+4, fill:'var(--ink-mute)', 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.16em' }, [txt(row.label)]));
      let x = 88;
      row.items.forEach((tok) => {
        const tx = tok.replace(/^ /, '·');
        const w = Math.max(36, tx.length * 9 + 12);
        const g = el('g', {});
        g.appendChild(el('rect', { x, y: row.y-14, width: w, height: 24,
          fill: ri === 2 ? 'var(--blueprint-tint)' : 'transparent',
          stroke: ri === 0 ? 'var(--rule-soft)' : 'var(--blueprint)', 'stroke-width': 1 }));
        g.appendChild(el('text', { x: x+w/2, y: row.y+2, 'text-anchor':'middle', 'font-family':'var(--font-mono)', 'font-size':12, fill:'var(--ink)' }, [txt(tx)]));
        if (ri === 2) g.setAttribute('opacity', '0');
        svg.appendChild(g);
        if (ri === 2) row._gs = (row._gs || []).concat(g);
        x += w + 6;
      });
    });
    loop(host, (t) => {
      const gs = rows[2]._gs || [];
      const visible = Math.floor(t * (gs.length + 2));
      gs.forEach((g, i) => g.setAttribute('opacity', i < visible ? '1' : '0'));
    }, 5200);
  }

  function lossCurve(host) {
    const W = 720, H = 240, P = 36;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width:'100%' });
    host.appendChild(svg);
    for (let i = 0; i <= 4; i++) {
      const y = P + i * ((H - 2*P) / 4);
      svg.appendChild(el('line', { x1: P, y1: y, x2: W-P, y2: y, stroke:'var(--rule-soft)', 'stroke-width': 1 }));
    }
    svg.appendChild(el('line', { x1: P, y1: P, x2: P, y2: H-P, stroke:'var(--ink)', 'stroke-width': 1 }));
    svg.appendChild(el('line', { x1: P, y1: H-P, x2: W-P, y2: H-P, stroke:'var(--ink)', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: P, y: 18, 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.14em', fill:'var(--ink-mute)' }, [txt('LOSS')]));
    svg.appendChild(el('text', { x: W-P, y: H-8, 'text-anchor':'end', 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.14em', fill:'var(--ink-mute)' }, [txt('STEP →')]));
    const N = 240;
    const path = el('path', { fill:'none', stroke:'var(--blueprint)', 'stroke-width':1.6 });
    svg.appendChild(path);
    const dot = el('circle', { r: 4, fill:'var(--blueprint)', cx: P, cy: P });
    svg.appendChild(dot);
    const lbl = el('text', { 'font-family':'var(--font-mono)', 'font-size':10, fill:'var(--blueprint)' });
    svg.appendChild(lbl);
    function lossFn(i) { return 0.06 + 0.9 * Math.exp(-i / 70) + 0.025 * Math.sin(i * 0.5) * Math.exp(-i/120); }
    loop(host, (t) => {
      const upto = Math.floor(t * N) + 1;
      let d = '';
      for (let i = 0; i < upto; i++) {
        const x = P + (i / (N-1)) * (W - 2*P);
        const y = P + (1 - lossFn(i)) * (H - 2*P);
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      path.setAttribute('d', d);
      const lx = P + ((upto-1) / (N-1)) * (W - 2*P);
      const ly = P + (1 - lossFn(upto-1)) * (H - 2*P);
      dot.setAttribute('cx', lx); dot.setAttribute('cy', ly);
      lbl.setAttribute('x', lx + 8); lbl.setAttribute('y', ly - 6);
      lbl.textContent = 'loss=' + lossFn(upto-1).toFixed(3);
    }, 5400);
  }

  function embeddingProjection(host) {
    const W = 720, H = 280;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%' });
    host.appendChild(svg);
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * W;
      const y = (i / 8) * H;
      svg.appendChild(el('line', { x1: x, y1: 0, x2: x, y2: H, stroke:'var(--rule-soft)', 'stroke-width':.6 }));
      svg.appendChild(el('line', { x1: 0, y1: y, x2: W, y2: y, stroke:'var(--rule-soft)', 'stroke-width':.6 }));
    }
    const clusters = [
      { x: 0.22, y: 0.30, words: ['king','queen','prince','duke'] },
      { x: 0.74, y: 0.36, words: ['apple','banana','peach','grape'] },
      { x: 0.42, y: 0.78, words: ['run','walk','jump','sit'] }
    ];
    const all = [];
    clusters.forEach((c, ci) => c.words.forEach((w, wi) => {
      const node = el('g', {});
      const cx = c.x*W + (Math.cos(wi)*22), cy = c.y*H + (Math.sin(wi*1.3)*22);
      node.appendChild(el('circle', { cx, cy, r: 4, fill:'var(--blueprint)' }));
      node.appendChild(el('text', { x: cx+8, y: cy+4, 'font-family':'var(--font-mono)', 'font-size':11, fill:'var(--ink)' }, [txt(w)]));
      svg.appendChild(node);
      all.push({ node, ci, wi });
    }));
    loop(host, (t) => {
      all.forEach(o => {
        const dx = Math.sin((t * Math.PI*2) + o.ci + o.wi) * 2;
        const dy = Math.cos((t * Math.PI*2) + o.ci - o.wi) * 2;
        o.node.setAttribute('transform', `translate(${dx} ${dy})`);
      });
    }, 7000);
    svg.appendChild(el('text', { x: 12, y: 22, 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('EMBEDDING SPACE · 2D PROJECTION')]));
  }

  function kvCache(host) {
    const W = 720, H = 220, P = 32, COLS = 12;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width:'100%' });
    host.appendChild(svg);
    const cw = (W - 2*P) / COLS;
    const cells = [];
    for (let r = 0; r < 2; r++) {
      const label = r === 0 ? 'K' : 'V';
      svg.appendChild(el('text', { x: 12, y: P+30 + r*70, 'font-family':'var(--font-mono)', 'font-size':14, fill:'var(--ink)' }, [txt(label)]));
      for (let c = 0; c < COLS; c++) {
        const x = P + c*cw, y = P + r*70;
        const cell = el('rect', { x, y, width: cw - 4, height: 50, fill:'transparent', stroke:'var(--rule-soft)', 'stroke-width':1 });
        svg.appendChild(cell);
        cells.push({ cell, c, r });
      }
    }
    svg.appendChild(el('text', { x: P, y: H-10, 'font-family':'var(--font-mono)', 'font-size':10, 'letter-spacing':'.16em', fill:'var(--ink-mute)' }, [txt('CACHE 从左向右增长 · NEW TOKEN 高亮')]));
    loop(host, (t) => {
      const head = Math.floor(t * COLS);
      cells.forEach(({ cell, c }) => {
        if (c < head) cell.setAttribute('fill', 'var(--blueprint-tint-strong)');
        else if (c === head) cell.setAttribute('fill', 'var(--blueprint)');
        else cell.setAttribute('fill', 'transparent');
      });
    }, 6000);
  }

  const FIGURES = {
    'tokenizer-bpe':         tokenizerBPE,
    'ngram-machine':         ngramMachine,
    'attention-matrix':      attentionMatrix,
    'embedding-arithmetic':  embeddingArithmetic,
    'transformer-block':     transformerBlock,
    'attention-lookup':      attentionLookup,
    'token-strip':           tokenStrip,
    'loss-curve':            lossCurve,
    'embedding-projection':  embeddingProjection,
    'kv-cache':              kvCache
  };

  function mount(root = document) {
    root.querySelectorAll('[data-figure]').forEach(host => {
      if (host.dataset.figureMounted) return;
      const fn = FIGURES[host.dataset.figure];
      if (!fn) return;
      try {
        fn(host);
        host.dataset.figureMounted = '1';
      } catch (err) {
        console.warn(`figure "${host.dataset.figure}" 渲染失败:`, err);
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mount());
  else mount();
  window.AIFS_FIGURES = FIGURES;
  window.AIFS_mountFigures = mount;
})();
