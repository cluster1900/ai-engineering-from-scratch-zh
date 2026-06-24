/* figures-transformers.js — Phase 5 (NLP) 与
   Phase 7 (Transformer 深入解析) 的交互式课程图示。在 lesson-figures.js 之后加载，使用
   共享 LF toolkit，并通过 LF.register 注册。无依赖，仅 ES5，通过
   CSS vars 设置主题。编写方式与 docs/en.md 中的 fenced ```figure block 相同。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, clamp = LF.clamp, fmtInt = LF.fmtInt;

  function shell(host, label, hint, grid, outKids, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, outKids)]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }

  // ── attention-heatmap: QK^T scores、softmax rows，opacity = weight ─────────
  function attentionHeatmap(host) {
    var toks = ['The', 'cat', 'sat', 'on', 'the', 'mat'];
    var n = toks.length;
    // 每个 Token 的固定 Q,K Vector（3 维）；确定性，无随机性。
    var Q = [[1.0, 0.2, 0.0], [0.3, 1.0, 0.1], [0.1, 0.4, 0.9], [0.6, 0.1, 0.5], [0.9, 0.3, 0.0], [0.2, 0.5, 0.8]];
    var K = [[0.9, 0.1, 0.0], [0.2, 1.0, 0.2], [0.0, 0.3, 1.0], [0.5, 0.2, 0.4], [0.9, 0.2, 0.1], [0.1, 0.4, 0.9]];
    var state = { T: 1.0 };
    var W = 520, H = 240, PAD = 56, CELL = (W - PAD - 12) / n;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var T = Math.max(0.05, state.T);
      var r, c, x, y;
      for (r = 0; r < n; r++) {
        var scores = [];
        for (c = 0; c < n; c++) { scores.push(dot(Q[r], K[c]) / T); }
        var mx = Math.max.apply(null, scores);
        var ex = scores.map(function (s) { return Math.exp(s - mx); });
        var sum = ex.reduce(function (a, b) { return a + b; }, 0);
        var probs = ex.map(function (e) { return e / sum; });
        for (c = 0; c < n; c++) {
          x = PAD + c * CELL; y = 30 + r * CELL;
          svg.appendChild(svgEl('rect', { x: x.toFixed(1), y: y.toFixed(1), width: (CELL - 2).toFixed(1), height: (CELL - 2).toFixed(1), fill: 'var(--blueprint,#3553ff)', 'fill-opacity': probs[c].toFixed(3), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
        }
        svg.appendChild(svgEl('text', { x: (PAD - 6).toFixed(1), y: (y + CELL / 2).toFixed(1), 'text-anchor': 'end', 'font-size': '10', 'font-family': 'monospace', fill: 'var(--ink-soft,#555)' }, [document.createTextNode(toks[r])]));
      }
      for (c = 0; c < n; c++) {
        x = PAD + c * CELL;
        svg.appendChild(svgEl('text', { x: (x + CELL / 2 - 1).toFixed(1), y: '24', 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'monospace', fill: 'var(--ink-mute,#777)' }, [document.createTextNode(toks[c])]));
      }
      meta.textContent = 'rows = queries, columns = keys  ·  每一行 softmax 后总和为 1  ·  ' + (T < 0.6 ? 'sharp / peaked' : T > 1.6 ? 'diffuse / blurred' : 'balanced');
      formula.textContent = 'A = softmax(QKᵀ / T),  T = ' + T.toFixed(2) + '   ·   cell opacity = attention weight';
    };
    var grid = el('div', {}, [slider(state, 'T', 'temperature', 0.2, 3.0, 0.05)]);
    shell(host, 'ATTENTION HEATMAP', '拖动 T', grid, [svg, meta, formula],
      '每个 query Token 都会通过点积为每个 key Token 打分，除以 temperature，然后对这一行做 softmax，使 weights 总和为 1。更深的单元格获得更多 Attention。更低的 temperature 会锐化到单个 key；更高的 temperature 会分散焦点。');
    state._render();
  }

  // ── multihead-split: 将 d_model 拆分为 num_heads 个大小为 d_model/heads 的部分 ─────
  function multiheadSplit(host) {
    var state = { dModel: 512, heads: 8 };
    var W = 520, H = 200, PAD = 24;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var divisors = [1, 2, 4, 8, 16, 32, 64];
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = state.dModel, h = state.heads;
      var even = d % h === 0;
      var dh = Math.floor(d / h);
      var rowY = 40, barW = W - 2 * PAD, barH = 36;
      svg.appendChild(svgEl('rect', { x: PAD, y: rowY, width: barW, height: barH, fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('text', { x: (PAD + barW / 2).toFixed(1), y: (rowY - 6).toFixed(1), 'text-anchor': 'middle', 'font-size': '11', 'font-family': 'monospace', fill: 'var(--ink-soft,#555)' }, [document.createTextNode('d_model = ' + d)]));
      var splitY = 120;
      if (even) {
        var i;
        for (i = 0; i < h; i++) {
          var x = PAD + i * (barW / h);
          svg.appendChild(svgEl('rect', { x: (x + 1).toFixed(1), y: splitY, width: (barW / h - 2).toFixed(1), height: barH, fill: 'var(--blueprint,#3553ff)', 'fill-opacity': (0.35 + 0.5 * (i % 2)).toFixed(2), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5' }));
          svg.appendChild(svgEl('line', { x1: (PAD + (i + 0.5) * (barW / h)).toFixed(1), y1: (rowY + barH).toFixed(1), x2: (PAD + (i + 0.5) * (barW / h)).toFixed(1), y2: splitY.toFixed(1), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5', 'stroke-dasharray': '2 2' }));
        }
        svg.appendChild(svgEl('text', { x: (PAD + barW / 2).toFixed(1), y: (splitY + barH + 18).toFixed(1), 'text-anchor': 'middle', 'font-size': '11', 'font-family': 'monospace', fill: 'var(--ink-soft,#555)' }, [document.createTextNode(h + ' heads × d_head ' + dh)]));
        meta.textContent = '每个 head 看到一个 ' + dh + ' 维 slice  ·  总 params 不变：' + h + ' × ' + dh + ' = ' + d;
      } else {
        svg.appendChild(svgEl('text', { x: (PAD + barW / 2).toFixed(1), y: (splitY + barH).toFixed(1), 'text-anchor': 'middle', 'font-size': '13', 'font-family': 'monospace', fill: 'var(--warn,#b8870f)' }, [document.createTextNode(d + ' 不能被 ' + h + ' 整除')]));
        meta.textContent = '选择一个能整除 d_model 的 head count：' + divisors.filter(function (x) { return d % x === 0; }).join(', ');
      }
      formula.textContent = 'd_head = d_model / num_heads = ' + d + ' / ' + h + (even ? ' = ' + dh : ' (不是整数)');
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'dModel', 'd_model', 64, 1024, 64),
      slider(state, 'heads', 'num_heads', 1, 32, 1)
    ]);
    shell(host, 'MULTI-HEAD SPLIT', '拖动 dims', grid, [svg, meta, formula],
      'Multi-Head Attention 会把 model dimension 拆分为等大的 slices，每个 head 一个，因此 head count 必须能整除 d_model。每个 head 都在自己的 subspace 中执行 Attention；这些 slices 再拼接回 d_model，所以增加 heads 不会增加总宽度。');
    state._render();
  }

  // ── causal-mask: NxN grid，上三角被 mask（灰显） ──────────────────
  function causalMask(host) {
    var state = { n: 7 };
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var n = state.n;
      var PAD = 30, size = Math.min(W - 2 * PAD, H - 40);
      var cell = size / n;
      var ox = (W - size) / 2, oy = 14;
      var r, c, visible = 0;
      for (r = 0; r < n; r++) {
        for (c = 0; c < n; c++) {
          var masked = c > r;
          if (!masked) { visible++; }
          svg.appendChild(svgEl('rect', {
            x: (ox + c * cell).toFixed(1), y: (oy + r * cell).toFixed(1),
            width: (cell - 1.5).toFixed(1), height: (cell - 1.5).toFixed(1),
            fill: masked ? 'var(--bg-surface,#eee)' : 'var(--blueprint,#3553ff)',
            'fill-opacity': masked ? '0.5' : (c === r ? '0.95' : '0.55'),
            stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '0.5'
          }));
        }
      }
      var total = n * n;
      meta.textContent = visible + ' / ' + total + ' 个位置参与 Attention  ·  ' + (total - visible) + ' 个被 mask  ·  token i 能看到 tokens 0..i';
      formula.textContent = 'mask[i][j] = −∞ when j > i  →  softmax 将未来 weights 变为 0  (lower triangle = causal)';
    };
    var grid = el('div', {}, [slider(state, 'n', 'sequence length N', 2, 14, 1)]);
    shell(host, 'CAUSAL MASK', '拖动 N', grid, [svg, meta, formula],
      'causal mask 会在 softmax 之前把所有未来 score 设为负无穷，因此每个 Token 只能 attend 到自身以及它之前的 Token。灰色上三角是被禁止的未来。正是这个约束让 Transformer 能够从左到右生成，而不会提前看到后文。');
    state._render();
  }

  // ── softmax-attention-scaling: 为什么除以 sqrt(d_k) ─────────────────────
  function softmaxAttentionScaling(host) {
    var state = { dk: 64, scaled: 1 };
    var W = 520, H = 210, PAD = 30;
    var n = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 固定的单位尺度 base logits；原始点积 std 会按 sqrt(d_k) 增长。
    var base = [1.4, 0.9, 0.5, 0.1, -0.2, -0.5, -0.9, -1.3];
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var dk = state.dk;
      // 未缩放的点积幅度约按 sqrt(dk) 缩放；缩放后会除回去。
      var spread = Math.sqrt(dk);
      var logits = base.map(function (b) { return state.scaled ? b * spread / Math.sqrt(dk) : b * spread; });
      var mx = Math.max.apply(null, logits);
      var ex = logits.map(function (z) { return Math.exp(z - mx); });
      var sum = ex.reduce(function (a, b) { return a + b; }, 0);
      var probs = ex.map(function (e) { return e / sum; });
      var pmax = Math.max.apply(null, probs);
      var ent = -probs.reduce(function (a, p) { return a + (p > 0 ? p * Math.log2(p) : 0); }, 0);
      var barW = (W - 2 * PAD) / n;
      probs.forEach(function (p, i) {
        var hh = p * (H - 2 * PAD);
        svg.appendChild(svgEl('rect', { x: (PAD + i * barW + 2).toFixed(1), y: (H - PAD - hh).toFixed(1), width: (barW - 4).toFixed(1), height: hh.toFixed(1), fill: 'var(--blueprint,#3553ff)', 'fill-opacity': '0.75' }));
      });
      svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      status.innerHTML = (pmax * 100).toFixed(0) + '% <small>在 top token 上</small>';
      meta.textContent = (state.scaled ? '按 1/√d_k 缩放：' : '未缩放：') + (pmax > 0.85 ? 'softmax 饱和，gradients 消失' : 'distribution 保持校准') + '  ·  entropy ' + ent.toFixed(2) + ' bits';
      formula.textContent = state.scaled ? 'softmax(QKᵀ / √d_k),  d_k = ' + dk + ',  √d_k = ' + spread.toFixed(1) : 'softmax(QKᵀ),  variance 随 d_k = ' + dk + ' 增长';
    };
    var sel = LF.select(state, 'scaled', 'scaling', [['scaled  (÷ √d_k)', 1], ['unscaled', 0]]);
    // select 会存储 string；在 render 时强制转换
    var origRender = state._render;
    state._render = function () { state.scaled = Number(state.scaled); origRender(); };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'dk', 'head dim d_k', 8, 256, 8),
      sel
    ]);
    shell(host, 'SOFTMAX SCALING', '切换 √d_k 除数', grid, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula],
      '点积会随 head dimension 增长，因此如果不缩放，scores 会变大，softmax 会饱和到某个 Token 上，导致 Gradient 消失。除以 d_k 的平方根会抵消这种增长，并让 Attention distribution 在任意 dimension 下保持校准。');
    state._render();
  }

  // ── word-vector-arithmetic: king - man + woman ≈ queen ─────────────────────
  function wordVectorArithmetic(host) {
    var state = { t: 1.0 };
    var W = 520, H = 260, PAD = 36;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 固定 2D Embedding space。Gender axis 为水平轴，royalty axis 为垂直轴。
    var pts = { man: [1.0, 1.0], woman: [3.0, 1.0], king: [1.0, 4.0], queen: [3.0, 4.0] };
    function px(x) { return PAD + (x + 0.5) / 4.5 * (W - 2 * PAD); }
    function py(y) { return H - PAD - (y) / 5 * (H - 2 * PAD); }
    function dot(label, x, y, color) {
      svg.appendChild(svgEl('circle', { cx: px(x).toFixed(1), cy: py(y).toFixed(1), r: '5', fill: color }));
      svg.appendChild(svgEl('text', { x: (px(x) + 8).toFixed(1), y: (py(y) + 4).toFixed(1), 'font-size': '11', 'font-family': 'monospace', fill: 'var(--ink-soft,#555)' }, [document.createTextNode(label)]));
    }
    function arrow(x1, y1, x2, y2, color, dash) {
      svg.appendChild(svgEl('line', { x1: px(x1).toFixed(1), y1: py(y1).toFixed(1), x2: px(x2).toFixed(1), y2: py(y2).toFixed(1), stroke: color, 'stroke-width': '1.6', 'stroke-dasharray': dash || '' }));
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // result = king - man + woman，沿 t 从 king 动画移动到 result。
      var resX = pts.king[0] - pts.man[0] + pts.woman[0];
      var resY = pts.king[1] - pts.man[1] + pts.woman[1];
      var t = clamp(state.t, 0, 1);
      var curX = pts.king[0] + t * (resX - pts.king[0]);
      var curY = pts.king[1] + t * (resY - pts.king[1]);
      arrow(pts.man[0], pts.man[1], pts.king[0], pts.king[1], 'var(--rule-soft,#ccc)', '3 3');
      arrow(pts.woman[0], pts.woman[1], pts.queen[0], pts.queen[1], 'var(--rule-soft,#ccc)', '3 3');
      arrow(pts.king[0], pts.king[1], curX, curY, 'var(--blueprint,#3553ff)');
      dot('man', pts.man[0], pts.man[1], 'var(--ink-mute,#999)');
      dot('woman', pts.woman[0], pts.woman[1], 'var(--ink-mute,#999)');
      dot('king', pts.king[0], pts.king[1], 'var(--blueprint,#3553ff)');
      dot('queen', pts.queen[0], pts.queen[1], 'var(--warn,#b8870f)');
      svg.appendChild(svgEl('circle', { cx: px(curX).toFixed(1), cy: py(curY).toFixed(1), r: '4', fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
      var dist = Math.sqrt(Math.pow(curX - pts.queen[0], 2) + Math.pow(curY - pts.queen[1], 2));
      meta.textContent = 'result 落在 (' + curX.toFixed(1) + ', ' + curY.toFixed(1) + ')  ·  到 "queen" 的距离 ' + dist.toFixed(2) + (dist < 0.05 ? '  ·  匹配' : '');
      formula.textContent = 'king − man + woman ≈ queen   ·   相同的 offset (man→king) 可迁移 woman→queen';
    };
    var grid = el('div', {}, [slider(state, 't', 'walk the arithmetic', 0, 1, 0.02)]);
    shell(host, 'WORD VECTOR ARITHMETIC', '拖动以相加 Vectors', grid, [svg, meta, formula],
      'Word2Vec 会排列词语，使关系变成方向。从 man 到 king 的 Vector 与从 woman 到 queen 的 Vector 相同，因此从 king 中减去 man 再加上 woman，会几乎正好落在 queen 上。意义变成几何，而类比变成 Vector 加法。');
    state._render();
  }

  // ── bpe-merge: 逐步查看 byte-pair-encoding merges ──────────────────────
  function bpeMerge(host) {
    var state = { step: 0 };
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var rows = el('div', {});
    // 词频 toy corpus（拆成字符，单词以 stop marker _ 结尾）。
    var corpus = [['l o w _', 5], ['l o w e r _', 2], ['n e w e s t _', 6], ['w i d e s t _', 3]];
    // 预先计算确定性的 merge sequence。
    function tokenizeAll(words) { return words.map(function (w) { return [w[0].split(' '), w[1]]; }); }
    function pairCounts(toks) {
      var counts = {}, order = [];
      toks.forEach(function (t) {
        var arr = t[0], cnt = t[1], i;
        for (i = 0; i < arr.length - 1; i++) {
          var key = arr[i] + ' ' + arr[i + 1];
          if (counts[key] === undefined) { counts[key] = 0; order.push(key); }
          counts[key] += cnt;
        }
      });
      return { counts: counts, order: order };
    }
    function bestPair(toks) {
      var pc = pairCounts(toks), best = null, bestN = -1;
      pc.order.forEach(function (k) { if (pc.counts[k] > bestN) { bestN = pc.counts[k]; best = k; } });
      return best === null ? null : { pair: best, count: bestN };
    }
    function applyMerge(toks, pair) {
      var parts = pair.split(' '), a = parts[0], b = parts[1], merged = a + b;
      return toks.map(function (t) {
        var arr = t[0], out = [], i = 0;
        while (i < arr.length) {
          if (i < arr.length - 1 && arr[i] === a && arr[i + 1] === b) { out.push(merged); i += 2; }
          else { out.push(arr[i]); i += 1; }
        }
        return [out, t[1]];
      });
    }
    var merges = [];
    (function () {
      var toks = tokenizeAll(corpus), step;
      for (step = 0; step < 10; step++) {
        var bp = bestPair(toks);
        if (!bp || bp.count < 2) { break; }
        merges.push(bp);
        toks = applyMerge(toks, bp.pair);
      }
    })();
    var MAXSTEP = merges.length;
    function countTokens(toks) { return toks.reduce(function (a, t) { return a + t[0].length; }, 0); }
    function vocabAt(s) {
      var v = {};
      'l o w e r n s t i d _'.split(' ').forEach(function (c) { v[c] = 1; });
      var i; for (i = 0; i < s; i++) { var p = merges[i].pair.split(' '); v[p[0] + p[1]] = 1; }
      return Object.keys(v).length;
    }
    state._render = function () {
      var s = clamp(Math.round(state.step), 0, MAXSTEP);
      var toks = tokenizeAll(corpus), i;
      for (i = 0; i < s; i++) { toks = applyMerge(toks, merges[i].pair); }
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      toks.forEach(function (t) {
        var line = el('div', { class: 'lf-formula', style: 'margin-top:2px' }, [
          t[0].join(' · ') + '   (×' + t[1] + ')'
        ]);
        rows.appendChild(line);
      });
      var tc = countTokens(toks), vc = vocabAt(s);
      var nextStr = s < MAXSTEP ? 'next merge: "' + merges[s].pair.replace(' ', '" + "') + '" (freq ' + merges[s].count + ')' : '没有 pair 出现两次，merge 停止';
      meta.textContent = 'step ' + s + ' / ' + MAXSTEP + '  ·  vocab ' + vc + ' symbols  ·  corpus 中共有 ' + tc + ' tokens';
      formula.textContent = nextStr;
    };
    var grid = el('div', {}, [slider(state, 'step', 'merge step', 0, MAXSTEP, 1)]);
    shell(host, 'BPE MERGE', '逐步查看 merges', grid, [rows, meta, formula],
      'Byte-pair encoding 从字符开始，并反复把最频繁的相邻 pair 合并成一个新 symbol。每次 merge 都会向 vocabulary 添加一个 entry，并缩短 corpus。像 "es" 和 "est" 这样的常见 sequence 会变成单个 Token，因此高频文本会被打包成更少的 Token，而罕见词仍然可以回退为片段。');
    state._render();
  }

  // ── gqa-kv-sharing: query heads 共享 kv heads (MHA / GQA / MQA) ──────────
  function gqaKvSharing(host) {
    var state = { qHeads: 8, kvHeads: 2 };
    var W = 520, H = 220;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var q = state.qHeads;
      var kv = clamp(state.kvHeads, 1, q);
      if (state.kvHeads > q) { state.kvHeads = q; kv = q; }
      // 将 kv 吸附到 q 的一个 divisor，便于干净分组。
      var divs = [], d; for (d = 1; d <= q; d++) { if (q % d === 0) { divs.push(d); } }
      var nearest = divs[0];
      divs.forEach(function (x) { if (Math.abs(x - kv) <= Math.abs(nearest - kv)) { nearest = x; } });
      kv = nearest;
      var perGroup = q / kv;
      var qY = 36, kvY = 168, r = 9;
      var qStep = (W - 60) / q, kvStep = (W - 60) / kv;
      var i;
      for (i = 0; i < kv; i++) {
        var kx = 30 + (i + 0.5) * kvStep;
        svg.appendChild(svgEl('rect', { x: (kx - 14).toFixed(1), y: kvY.toFixed(1), width: '28', height: '20', fill: 'var(--warn,#b8870f)', 'fill-opacity': '0.7' }));
      }
      svg.appendChild(svgEl('text', { x: '30', y: (kvY + 38).toFixed(1), 'font-size': '10', 'font-family': 'monospace', fill: 'var(--ink-mute,#777)' }, [document.createTextNode(kv + ' kv head' + (kv > 1 ? 's' : ''))]));
      for (i = 0; i < q; i++) {
        var qx = 30 + (i + 0.5) * qStep;
        var grp = Math.floor(i / perGroup);
        var kx2 = 30 + (grp + 0.5) * kvStep;
        svg.appendChild(svgEl('line', { x1: qx.toFixed(1), y1: (qY + r).toFixed(1), x2: kx2.toFixed(1), y2: kvY.toFixed(1), stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1' }));
        svg.appendChild(svgEl('circle', { cx: qx.toFixed(1), cy: qY.toFixed(1), r: String(r), fill: 'var(--blueprint,#3553ff)', 'fill-opacity': '0.8' }));
      }
      svg.appendChild(svgEl('text', { x: '30', y: '20', 'font-size': '10', 'font-family': 'monospace', fill: 'var(--ink-mute,#777)' }, [document.createTextNode(q + ' query heads')]));
      var mode = kv === q ? 'MHA (每个 query 一个 kv)' : kv === 1 ? 'MQA (所有 queries 共享一个 kv)' : 'GQA (每个 kv 对应 ' + perGroup + ' 个 queries)';
      var factor = q / kv;
      status.innerHTML = factor.toFixed(factor < 10 ? 1 : 0) + 'x <small>更小的 kv-cache</small>';
      meta.textContent = mode + '  ·  ' + q + ' query heads → ' + kv + ' kv heads';
      formula.textContent = 'kv-cache reduction = query_heads / kv_heads = ' + q + ' / ' + kv + ' = ' + factor.toFixed(2) + 'x';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'qHeads', 'query heads', 1, 16, 1),
      slider(state, 'kvHeads', 'kv heads (groups)', 1, 16, 1)
    ]);
    shell(host, 'GQA KV-SHARING', '拖动 head counts', grid, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula],
      '每个 query head 都保留自己的 projection，但多个 query head 可以共享一个 key-value head。每个 query 一个 kv 是完整的 Multi-Head Attention；所有 query 共用一个 kv 是 multi-query；介于两者之间的若干组就是 grouped-query attention。更少的 kv heads 会按 query heads 与 kv heads 的比例缩小 cache，同时保留大部分质量。');
    state._render();
  }

  // ── transformer-residual: 带 residual skip connections 的一个 block ─────────
  function transformerResidual(host) {
    var state = { skip: 1 };
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function box(x, y, w, h, label, fill) {
      svg.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, rx: '3', fill: fill || 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
      svg.appendChild(svgEl('text', { x: (x + w / 2).toFixed(1), y: (y + h / 2 + 4).toFixed(1), 'text-anchor': 'middle', 'font-size': '11', 'font-family': 'monospace', fill: 'var(--ink-soft,#555)' }, [document.createTextNode(label)]));
    }
    function flow(x1, y1, x2, y2, color) {
      svg.appendChild(svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color || 'var(--ink-mute,#999)', 'stroke-width': '1.6' }));
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cx = W / 2, bw = 150, bh = 30, lx = cx - bw / 2;
      var skip = state.skip ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#eee)';
      // main spine
      flow(cx, 16, cx, 36);
      box(lx, 36, bw, bh, 'self-attention', 'var(--blueprint,#3553ff)');
      var attnAdd = 86;
      flow(cx, 66, cx, attnAdd);
      box(cx - 36, attnAdd, 72, 24, 'add & norm');
      flow(cx, attnAdd + 24, cx, attnAdd + 44);
      box(lx, attnAdd + 44, bw, bh, 'FFN', 'var(--blueprint,#3553ff)');
      var ffnAdd = attnAdd + 78;
      flow(cx, attnAdd + 44 + bh, cx, ffnAdd);
      box(cx - 36, ffnAdd, 72, 24, 'add & norm');
      flow(cx, ffnAdd + 24, cx, ffnAdd + 40);
      // input/output labels
      svg.appendChild(svgEl('text', { x: cx.toFixed(1), y: '12', 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'monospace', fill: 'var(--ink-mute,#777)' }, [document.createTextNode('x in')]));
      svg.appendChild(svgEl('text', { x: cx.toFixed(1), y: (ffnAdd + 38).toFixed(1), 'text-anchor': 'middle', 'font-size': '10', 'font-family': 'monospace', fill: 'var(--ink-mute,#777)' }, [document.createTextNode('x out')]));
      // residual skips（绕过 blocks 的曲线）
      var rx = cx + bw / 2 + 24;
      svg.appendChild(svgEl('path', { d: 'M ' + cx + ' 30 C ' + rx + ' 30, ' + rx + ' ' + attnAdd + ', ' + (cx + 36) + ' ' + (attnAdd + 12), fill: 'none', stroke: skip, 'stroke-width': '2', 'stroke-dasharray': '5 3' }));
      svg.appendChild(svgEl('path', { d: 'M ' + cx + ' ' + (attnAdd + 30) + ' C ' + rx + ' ' + (attnAdd + 30) + ', ' + rx + ' ' + ffnAdd + ', ' + (cx + 36) + ' ' + (ffnAdd + 12), fill: 'none', stroke: skip, 'stroke-width': '2', 'stroke-dasharray': '5 3' }));
      meta.textContent = state.skip ? 'residual on：input 会在每个 sublayer 后加回来，因此 gradients 可以直通流动' : 'residual off：这些 blocks 的深层堆叠会停止训练，因为 gradients 会消失';
      formula.textContent = 'x → x + Attention(Norm(x)) → x + FFN(Norm(x))   ·   这个 + 就是 skip connection';
    };
    var grid = el('div', {}, [LF.select(state, 'skip', 'residual skip', [['on', 1], ['off', 0]])]);
    var orig = state._render;
    state._render = function () { state.skip = Number(state.skip); orig(); };
    shell(host, 'TRANSFORMER BLOCK', '切换 residual', grid, [svg, meta, formula],
      '一个 Transformer block 包含两个 sublayers：先 self-attention，再 feed-forward network，每个 sublayer 都包在 add-and-norm 中。虚线是 residual skips，它们会把 input x 向前传递，并在每个 sublayer 后加回来。正是这些 skips 让数百个 blocks 能够堆叠，而 Gradient 不会在向下传递时消失。');
    state._render();
  }

  // ── flash-attention-memory: O(N^2) standard vs O(N) tiled ──────────────────
  function flashAttentionMemory(host) {
    var state = { logN: 12 };
    var W = 520, H = 220, PAD = 36;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var bytesPerEl = 2; // bf16 score
    function human(x) { var u = ['B', 'KB', 'MB', 'GB', 'TB']; var i = 0; while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; } return x.toFixed(x < 10 ? 1 : 0) + ' ' + u[i]; }
    var NMIN = 9, NMAX = 18; // 2^9 .. 2^18 tokens
    function stdBytes(N) { return N * N * bytesPerEl; }
    function flashBytes(N) { var blk = 128; return N * blk * bytesPerEl; }
    function px(ln) { return PAD + (ln - NMIN) / (NMAX - NMIN) * (W - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var ymax = Math.log2(stdBytes(Math.pow(2, NMAX)));
      var ymin = Math.log2(flashBytes(Math.pow(2, NMIN)));
      function py(bytes) { return H - PAD - (Math.log2(bytes) - ymin) / (ymax - ymin) * (H - 2 * PAD); }
      function curve(fn, color) {
        var d = '', i; for (i = 0; i <= 80; i++) { var ln = NMIN + (NMAX - NMIN) * i / 80; var N = Math.pow(2, ln); d += (i ? 'L' : 'M') + px(ln).toFixed(1) + ' ' + py(fn(N)).toFixed(1) + ' '; }
        svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: color, 'stroke-width': '2' }));
      }
      curve(stdBytes, 'var(--warn,#b8870f)');
      curve(flashBytes, 'var(--blueprint,#3553ff)');
      var ln = state.logN, N = Math.pow(2, ln);
      var sx = px(ln);
      svg.appendChild(svgEl('line', { x1: sx, y1: PAD, x2: sx, y2: H - PAD, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(svgEl('circle', { cx: sx.toFixed(1), cy: py(stdBytes(N)).toFixed(1), r: '4', fill: 'var(--warn,#b8870f)' }));
      svg.appendChild(svgEl('circle', { cx: sx.toFixed(1), cy: py(flashBytes(N)).toFixed(1), r: '4', fill: 'var(--blueprint,#3553ff)' }));
      var sb = stdBytes(N), fb = flashBytes(N), saved = sb / fb;
      num.innerHTML = saved.toFixed(saved < 10 ? 1 : 0) + 'x <small>更少 memory</small>';
      meta.textContent = 'N = ' + fmtInt(N) + '  ·  standard (orange) ' + human(sb) + '  ·  flash (blue) ' + human(fb);
      formula.textContent = 'standard 会 materialize 完整 N×N scores：O(N²)  ·  flash 使用 tiles 且从不存储它：O(N)';
    };
    var grid = el('div', {}, [slider(state, 'logN', 'sequence length (2^x)', NMIN, NMAX, 1, function (v) { return fmtInt(Math.pow(2, v)); })]);
    shell(host, 'FLASH ATTENTION MEMORY', '拖动 sequence length', grid, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula],
      'Standard attention 会把完整的 N×N score Matrix 写入 memory，因此它会随 sequence length 的平方增长，并很快成为主导开销。FlashAttention 以 tiles 计算 Attention，并且从不 materialize 这个 Matrix，因此它的 memory 线性增长。两条曲线会很快分离：在 long context 下，节省量会达到多个数量级。');
    state._render();
  }

  LF.register({
    'attention-heatmap': attentionHeatmap,
    'multihead-split': multiheadSplit,
    'causal-mask': causalMask,
    'softmax-attention-scaling': softmaxAttentionScaling,
    'word-vector-arithmetic': wordVectorArithmetic,
    'bpe-merge': bpeMerge,
    'gqa-kv-sharing': gqaKvSharing,
    'transformer-residual': transformerResidual,
    'flash-attention-memory': flashAttentionMemory
  });
})();
