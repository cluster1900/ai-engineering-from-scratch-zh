(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  var INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--ink-soft,#555)', MUTE = 'var(--ink-mute,#777)';
  var BP = 'var(--blueprint,#3553ff)', RULE = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)';
  var MONO = 'var(--font-mono,monospace)', BODY = 'var(--font-body,serif)';
  var EASE = '0.23 1 0.32 1', LIN = '0 0 1 1';

  function card(host, label, sub, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function txt(x, y, s, attrs) {
    var a = { x: x, y: y, 'font-family': MONO, 'font-size': '12', fill: INK };
    if (attrs) { for (var k in attrs) { a[k] = attrs[k]; } }
    return svgEl('text', a, [document.createTextNode(s)]);
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur + 's', repeatCount: 'indefinite' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('animate', a);
  }
  function animT(type, vals, dur, extra) {
    var a = { attributeName: 'transform', type: type, values: vals, dur: dur + 's', repeatCount: 'indefinite' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('animateTransform', a);
  }
  function tf(x) { return String(Math.round(x * 1000) / 1000); }
  function fadeIn(node, dur, t0, t1) {
    node.appendChild(anim('opacity', '0;0;1;1', dur, { keyTimes: '0;' + tf(t0) + ';' + tf(t1) + ';1' }));
  }
  function fadeRise(node, dur, t0, t1, dy) {
    var kt = '0;' + tf(t0) + ';' + tf(t1) + ';1';
    node.appendChild(anim('opacity', '0;0;1;1', dur, { keyTimes: kt }));
    node.appendChild(animT('translate', '0 ' + dy + ';0 ' + dy + ';0 0;0 0', dur,
      { keyTimes: kt, calcMode: 'spline', keySplines: LIN + ';' + EASE + ';' + LIN }));
  }
  function draw(node, len, dur, t0, t1) {
    node.setAttribute('stroke-dasharray', len);
    node.setAttribute('stroke-dashoffset', len);
    node.appendChild(anim('stroke-dashoffset', len + ';' + len + ';0;0', dur,
      { keyTimes: '0;' + tf(t0) + ';' + tf(t1) + ';1', calcMode: 'spline', keySplines: LIN + ';' + EASE + ';' + LIN }));
  }

  // ── n5-subword-merge：BPE 网格，高频对向上合并 ───────────────────────────
  function subwordMerge(host) {
    var D = 6, svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(txt(20, 26, '合并队列：(l,o) (e,r) (lo,w) (low,er)', { fill: SOFT, 'font-size': '11' }));
    var chars = ['l', 'o', 'w', 'e', 'r'], cx = [110, 175, 240, 305, 370];
    chars.forEach(function (c, i) {
      svg.appendChild(svgEl('rect', { x: cx[i] - 17, y: 188, width: 34, height: 26, rx: 3, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }));
      svg.appendChild(txt(cx[i], 206, c, { 'text-anchor': 'middle', 'font-size': '13' }));
    });
    var merges = [
      { a: [110, 188], b: [175, 188], x: 142, y: 156, w: 40, s: 'lo', t: 0.06 },
      { a: [305, 188], b: [370, 188], x: 337, y: 156, w: 40, s: 'er', t: 0.22 },
      { a: [142, 144], b: [240, 188], x: 191, y: 110, w: 48, s: 'low', t: 0.38 },
      { a: [191, 98], b: [337, 144], x: 264, y: 62, w: 60, s: 'lower', t: 0.54 }
    ];
    merges.forEach(function (m) {
      [m.a, m.b].forEach(function (p) {
        var ln = svgEl('line', { x1: p[0], y1: p[1], x2: m.x, y2: m.y + 12, stroke: BP, 'stroke-width': '1.5' });
        draw(ln, 110, D, m.t, m.t + 0.08);
        svg.appendChild(ln);
      });
      var g = svgEl('g', {}, [
        svgEl('rect', { x: m.x - m.w / 2, y: m.y - 12, width: m.w, height: 24, rx: 3, fill: BP }),
        txt(m.x, m.y + 4, m.s, { 'text-anchor': 'middle', fill: 'var(--bg,#fafaf5)', 'font-size': '12' })
      ]);
      fadeRise(g, D, m.t + 0.07, m.t + 0.15, 8);
      svg.appendChild(g);
    });
    card(host, 'SUBWORD TOKENIZATION', '字符对合并为 Token', svg,
      'Byte-pair encoding 从字符开始，反复合并最高频的相邻字符对：先合并 (l,o) 和 (e,r)，再合并 (lo,w)，最后合并 (low,er)。高频单词最终成为单个 Token，而低频单词会拆分成常见片段，因此任何输入都不会超出词表。');
  }

  // ── n5-crosslingual-bridge：任务头穿过共享空间桥梁 ────────────────────────
  function crosslingualBridge(host) {
    var D = 5, svg = svgEl('svg', { viewBox: '0 0 520 220' });
    svg.appendChild(txt(260, 20, '经过 Fine-tuning 的任务头', { 'text-anchor': 'middle', fill: SOFT, 'font-size': '10' }));
    [[24, 'English · 已标注', 40, 146, true], [346, 'Urdu · 未标注', 362, 468, false]].forEach(function (side, s) {
      svg.appendChild(svgEl('rect', { x: side[0], y: 56, width: 150, height: 120, rx: 4, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }));
      svg.appendChild(txt(side[0] + 75, 48, side[1], { 'text-anchor': 'middle', fill: SOFT, 'font-size': '10' }));
      [0, 1, 2].forEach(function (i) {
        svg.appendChild(svgEl('rect', { x: side[2], y: 80 + i * 30, width: 86, height: 8, rx: 2, fill: RULE }));
        var ck = txt(side[3], 91 + i * 30, '✓', { fill: BP, 'font-size': '12' });
        if (!side[4]) { fadeIn(ck, D, 0.6 + i * 0.05, 0.66 + i * 0.05); }
        svg.appendChild(ck);
      });
    });
    svg.appendChild(svgEl('circle', { cx: 260, cy: 120, r: 42, fill: 'none', stroke: BP, 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
    svg.appendChild(txt(260, 178, '共享空间', { 'text-anchor': 'middle', fill: SOFT, 'font-size': '10' }));
    var bridge = svgEl('path', { d: 'M 174 78 C 214 26 306 26 346 78', fill: 'none', stroke: BP, 'stroke-width': '1.5' });
    draw(bridge, 200, D, 0.04, 0.14);
    svg.appendChild(bridge);
    var pulse = svgEl('circle', { cx: 0, cy: 0, r: 5, fill: WARN });
    pulse.appendChild(svgEl('animateMotion', { path: 'M 174 78 C 214 26 306 26 346 78', dur: D + 's', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.18;0.55;1' }));
    pulse.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.15;0.2;0.55;0.6;1' }));
    svg.appendChild(pulse);
    svg.appendChild(txt(99, 198, '在此 Fine-tuning', { 'text-anchor': 'middle', fill: MUTE, 'font-size': '10' }));
    svg.appendChild(txt(421, 198, '在此 zero-shot', { 'text-anchor': 'middle', fill: MUTE, 'font-size': '10' }));
    card(host, 'CROSS-LINGUAL TRANSFER', '一个空间，多种语言', svg,
      '一个在上百种语言上进行预训练的 encoder，会把含义相同的句子放在同一个共享空间中的相近位置。在 English 标签上对任务头进行 Fine-tuning，再将其带过这座桥：它无需任何 Urdu 标签即可通过 zero-shot 为 Urdu 文本评分，而几百个目标语言样本就能弥合余下的大部分差距。');
  }

  // ── n5-chunk-cuts：三种切分规则切分同一文档条 ────────────────────────────
  function chunkCuts(host) {
    var D = 5.5, svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(txt(20, 24, '同一文档，三种切分方式', { fill: SOFT, 'font-size': '11' }));
    var rows = [
      { y: 56, lab: '固定 512', note: '等长窗口，切分点落在句子中间', cuts: [206, 303, 400], t: 0.06 },
      { y: 124, lab: '递归切分', note: '先尝试 \\n\\n，再尝试 .、,，最后尝试空格', cuts: [220, 350], t: 0.4 },
      { y: 192, lab: '语义切分', note: '在句子相似度下降处切分', cuts: [280, 430], t: 0.72 }
    ];
    rows.forEach(function (r) {
      svg.appendChild(txt(20, r.y + 13, r.lab, { fill: SOFT, 'font-size': '11' }));
      svg.appendChild(svgEl('rect', { x: 110, y: r.y, width: 386, height: 18, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }));
      [170, 220, 280, 350, 430].forEach(function (x) {
        svg.appendChild(svgEl('line', { x1: x, y1: r.y + 4, x2: x, y2: r.y + 14, stroke: RULE, 'stroke-width': '1', 'stroke-dasharray': '2 2' }));
      });
      r.cuts.forEach(function (x, i) {
        var c = svgEl('line', { x1: x, y1: r.y - 4, x2: x, y2: r.y + 22, stroke: BP, 'stroke-width': '2' });
        draw(c, 26, D, r.t + i * 0.06, r.t + i * 0.06 + 0.05);
        svg.appendChild(c);
      });
      svg.appendChild(txt(110, r.y + 33, r.note, { fill: MUTE, 'font-size': '9' }));
    });
    var dot = svgEl('circle', { cx: 303, cy: 48, r: 3, fill: WARN });
    fadeIn(dot, D, 0.26, 0.3);
    svg.appendChild(dot);
    card(host, 'RAG CHUNKING', '同一文本，三种切分规则', svg,
      '每一行的文档都完全相同，只有切分点不同。固定窗口成本低，但会在句子中间切开（图中标记的切分点）；递归切分会依次从段落分隔退回到句子和空格；语义切分则在相邻句子的相似度下降处切分。递归生成的 512-Token chunk 仍是默认的 benchmark。');
  }

  // ── n5-judge-gauge：(query, context, answer) 输入，指针扫向分数 ────────────
  function judgeGauge(host) {
    var D = 5, svg = svgEl('svg', { viewBox: '0 0 520 200' });
    ['query', 'context', 'answer'].forEach(function (s, i) {
      var y = 58 + i * 36, t0 = 0.05 + i * 0.07;
      var g = svgEl('g', {}, [
        svgEl('rect', { x: 24, y: y, width: 92, height: 26, rx: 3, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }),
        txt(70, y + 17, s, { 'text-anchor': 'middle', 'font-size': '11', fill: SOFT })
      ]);
      g.appendChild(animT('translate', '0 0;0 0;46 0;46 0', D,
        { keyTimes: '0;' + tf(t0) + ';' + tf(t0 + 0.12) + ';1', calcMode: 'spline', keySplines: LIN + ';' + EASE + ';' + LIN }));
      svg.appendChild(g);
    });
    svg.appendChild(svgEl('rect', { x: 180, y: 52, width: 120, height: 112, rx: 4, fill: 'none', stroke: BP, 'stroke-width': '1.8' }));
    svg.appendChild(txt(240, 100, 'LLM judge', { 'text-anchor': 'middle' }));
    svg.appendChild(txt(240, 120, 'rubric：忠实度', { 'text-anchor': 'middle', fill: SOFT, 'font-size': '9' }));
    [0, 1, 2].forEach(function (i) {
      var b = 0.34 + i * 0.05;
      var dot = svgEl('circle', { cx: 222 + i * 16, cy: 142, r: 3, fill: BP });
      dot.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;' + tf(b) + ';' + tf(b + 0.03) + ';' + tf(b + 0.12) + ';' + tf(b + 0.16) + ';1' }));
      svg.appendChild(dot);
    });
    var ar = svgEl('line', { x1: 300, y1: 108, x2: 336, y2: 108, stroke: BP, 'stroke-width': '1.5' });
    draw(ar, 40, D, 0.52, 0.58);
    svg.appendChild(ar);
    var head = svgEl('path', { d: 'M 342 108 l -7 -4 l 0 8 z', fill: BP });
    fadeIn(head, D, 0.56, 0.6);
    svg.appendChild(head);
    svg.appendChild(svgEl('path', { d: 'M 370 150 A 46 46 0 0 1 462 150', fill: 'none', stroke: RULE, 'stroke-width': '8' }));
    var fill = svgEl('path', { d: 'M 370 150 A 46 46 0 0 1 462 150', fill: 'none', stroke: BP, 'stroke-width': '8' });
    fill.setAttribute('stroke-dasharray', '145');
    fill.appendChild(anim('stroke-dashoffset', '145;145;20;20', D, { keyTimes: '0;0.6;0.85;1', calcMode: 'spline', keySplines: LIN + ';' + EASE + ';' + LIN }));
    svg.appendChild(fill);
    var needle = svgEl('line', { x1: 416, y1: 150, x2: 378, y2: 150, stroke: INK, 'stroke-width': '2' });
    needle.appendChild(animT('rotate', '0 416 150;0 416 150;155 416 150;155 416 150', D, { keyTimes: '0;0.6;0.85;1', calcMode: 'spline', keySplines: LIN + ';' + EASE + ';' + LIN }));
    svg.appendChild(needle);
    svg.appendChild(svgEl('circle', { cx: 416, cy: 150, r: 4, fill: INK }));
    var score = txt(416, 132, '0.86', { 'text-anchor': 'middle', fill: BP, 'font-size': '15' });
    fadeIn(score, D, 0.84, 0.9);
    svg.appendChild(score);
    svg.appendChild(txt(370, 172, '0', { 'text-anchor': 'middle', fill: MUTE, 'font-size': '9' }));
    svg.appendChild(txt(462, 172, '1', { 'text-anchor': 'middle', fill: MUTE, 'font-size': '9' }));
    card(host, 'LLM AS JUDGE', '输入 rubric，输出分数', svg,
      'judge Model 读取 query、检索到的 Context 和 answer，应用 rubric，并返回 0 到 1 之间的分数。RAGAS、DeepEval 和 G-Eval 都建立在这一循环之上；建立可信度的关键工作，是固定 judge 版本，并审计它对较长回答的偏差。');
  }

  // ── n5-slot-tracker：对话轮次编辑 slot-value 字典，包括修正 ───────────────
  function slotTracker(host) {
    var D = 6, svg = svgEl('svg', { viewBox: '0 0 520 260' });
    var turns = [
      { y: 64, s: '"北边的便宜地点"', t: 0.04 },
      { y: 124, s: '"其实，改成中等价位"', t: 0.36 },
      { y: 184, s: '"再加上 Italian"', t: 0.66 }
    ];
    turns.forEach(function (u, i) {
      svg.appendChild(txt(24, u.y - 8, '轮次 ' + (i + 1), { fill: MUTE, 'font-size': '9' }));
      var g = svgEl('g', {}, [
        svgEl('rect', { x: 24, y: u.y, width: 206, height: 28, rx: 4, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }),
        txt(34, u.y + 18, u.s, { 'font-family': BODY, 'font-size': '12' })
      ]);
      fadeRise(g, D, u.t, u.t + 0.06, 6);
      svg.appendChild(g);
    });
    svg.appendChild(txt(330, 46, 'dialogue state', { fill: SOFT, 'font-size': '10' }));
    svg.appendChild(svgEl('line', { x1: 330, y1: 54, x2: 496, y2: 54, stroke: RULE, 'stroke-width': '1' }));
    [['price', 86], ['area', 126], ['cuisine', 166]].forEach(function (r) {
      svg.appendChild(txt(330, r[1], r[0], { fill: SOFT, 'font-size': '11' }));
      svg.appendChild(svgEl('rect', { x: 392, y: r[1] - 16, width: 104, height: 24, rx: 3, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }));
    });
    var cheap = txt(444, 86, 'cheap', { 'text-anchor': 'middle', fill: BP, 'font-size': '12' });
    cheap.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.12;0.18;0.44;0.48;1' }));
    svg.appendChild(cheap);
    var mod = txt(444, 86, 'moderate', { 'text-anchor': 'middle', fill: BP, 'font-size': '12' });
    fadeRise(mod, D, 0.48, 0.55, 5);
    svg.appendChild(mod);
    var north = txt(444, 126, 'north', { 'text-anchor': 'middle', fill: BP, 'font-size': '12' });
    fadeIn(north, D, 0.14, 0.2);
    svg.appendChild(north);
    var ital = txt(444, 166, 'italian', { 'text-anchor': 'middle', fill: BP, 'font-size': '12' });
    fadeRise(ital, D, 0.7, 0.77, 5);
    svg.appendChild(ital);
    var arc = svgEl('path', { d: 'M 230 138 C 300 130 340 110 388 88', fill: 'none', stroke: WARN, 'stroke-width': '1.5' });
    draw(arc, 190, D, 0.44, 0.52);
    arc.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.42;0.46;0.62;0.7;1' }));
    svg.appendChild(arc);
    svg.appendChild(txt(24, 240, 'JGA：仅当所有 slot 都正确时，该轮次才计为正确', { fill: MUTE, 'font-size': '10' }));
    card(host, 'DIALOGUE STATE TRACKING', 'state 是一个字典', svg,
      '三个轮次，对一个 slot-value 字典进行三次编辑：先填入 price 和 area，随后用 moderate 覆盖 cheap 完成修正，最后加入 cuisine。Joint goal accuracy 仅在每个 slot 都匹配时才把该轮次计为正确，因此对话过程中的修正是 tracking 最困难的部分。');
  }

  // ── n5-patch-stream：图像网格展开为 Token 序列 ────────────────────────────
  function patchStream(host) {
    var D = 5, svg = svgEl('svg', { viewBox: '0 0 520 260' });
    svg.appendChild(txt(110, 32, '图像，3 x 3 个 patch', { 'text-anchor': 'middle', fill: SOFT, 'font-size': '10' }));
    svg.appendChild(svgEl('rect', { x: 56, y: 44, width: 110, height: 110, fill: 'none', stroke: RULE, 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
    var ops = ['0.15', '0.45', '0.25', '0.6', '0.35', '0.2', '0.5', '0.3', '0.55'];
    ops.forEach(function (op, k) {
      var c = k % 3, r = (k - c) / 3;
      var sx = 60 + c * 36, sy = 48 + r * 36;
      var dx = (110 + k * 36) - sx, dy = 204 - sy;
      var p = svgEl('rect', { x: sx, y: sy, width: 30, height: 30, rx: 2, fill: BP, 'fill-opacity': op, stroke: BP, 'stroke-width': '0.75' });
      var t0 = 0.06 + k * 0.05;
      p.appendChild(animT('translate', '0 0;0 0;' + dx + ' ' + dy + ';' + dx + ' ' + dy, D,
        { keyTimes: '0;' + tf(t0) + ';' + tf(t0 + 0.12) + ';1', calcMode: 'spline', keySplines: LIN + ';' + EASE + ';' + LIN }));
      svg.appendChild(p);
      svg.appendChild(txt(125 + k * 36, 248, String(k + 1), { 'text-anchor': 'middle', fill: MUTE, 'font-size': '8' }));
    });
    var cls = svgEl('g', { transform: 'translate(83 219)' });
    var inner = svgEl('g', {}, [
      svgEl('rect', { x: -15, y: -15, width: 30, height: 30, rx: 2, fill: BP, 'fill-opacity': '0.08', stroke: BP, 'stroke-width': '1.5' }),
      txt(0, 3, '[CLS]', { 'text-anchor': 'middle', fill: BP, 'font-size': '8' })
    ]);
    inner.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;0.56;0.64;1' }));
    inner.appendChild(animT('scale', '0.95;0.95;1;1', D, { keyTimes: '0;0.56;0.66;1', calcMode: 'spline', keySplines: LIN + ';' + EASE + ';' + LIN }));
    cls.appendChild(inner);
    svg.appendChild(cls);
    svg.appendChild(txt(83, 248, '0', { 'text-anchor': 'middle', fill: MUTE, 'font-size': '8' }));
    svg.appendChild(txt(255, 190, '展平并进行线性投影，再添加位置 Embedding', { 'text-anchor': 'middle', fill: SOFT, 'font-size': '10' }));
    card(host, 'VIT PATCHIFY', '图像变成序列', svg,
      'Vision Transformer 从不执行卷积：图像被切分为固定大小的 patch，每个 patch 都会被展平并进行线性投影，随后这些 patch 作为 Token 排列在一个可学习的 [CLS] Token 之后。位置 Embedding 是对原始网格的唯一记忆；从这里开始，后续就是标准的 Transformer encoder。');
  }

  // ── n5-mel-decode：从波形到 mel 列，再到逐字输出的转录文本 ───────────────
  function melDecode(host) {
    var D = 5, svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var pts = [], x;
    for (x = 24; x <= 240; x += 6) {
      var a = 4 + 10 * Math.abs(Math.sin(x * 0.05));
      pts.push(x + ',' + (36 + Math.sin(x * 0.35) * a).toFixed(1));
    }
    svg.appendChild(svgEl('polyline', { points: pts.join(' '), fill: 'none', stroke: SOFT, 'stroke-width': '1' }));
    svg.appendChild(txt(250, 40, '音频 · 16 kHz', { fill: MUTE, 'font-size': '9' }));
    var hs = [34, 52, 40, 64, 48, 70, 44, 58, 38];
    hs.forEach(function (h, c) {
      var r = svgEl('rect', { x: 24 + c * 22, y: 140 - h, width: 16, height: h, rx: 1, fill: BP, 'fill-opacity': '0.8' });
      fadeRise(r, D, 0.05 + c * 0.045, 0.13 + c * 0.045, 4);
      svg.appendChild(r);
    });
    svg.appendChild(txt(24, 156, 'log-mel spectrogram · 80 个频带', { fill: MUTE, 'font-size': '9' }));
    svg.appendChild(svgEl('line', { x1: 208, y1: 118, x2: 246, y2: 92, stroke: RULE, 'stroke-width': '1.5' }));
    svg.appendChild(svgEl('rect', { x: 250, y: 76, width: 100, height: 26, rx: 3, fill: 'none', stroke: BP, 'stroke-width': '1.5' }));
    svg.appendChild(txt(300, 93, 'encoder', { 'text-anchor': 'middle', 'font-size': '11' }));
    svg.appendChild(svgEl('rect', { x: 250, y: 112, width: 100, height: 26, rx: 3, fill: 'none', stroke: BP, 'stroke-width': '1.5' }));
    svg.appendChild(txt(300, 129, 'decoder', { 'text-anchor': 'middle', 'font-size': '11' }));
    svg.appendChild(svgEl('path', { d: 'M 300 138 C 300 170 120 170 90 200', fill: 'none', stroke: RULE, 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
    svg.appendChild(txt(24, 186, 'decoder 输出，每次一个 Token', { fill: MUTE, 'font-size': '9' }));
    var toks = [['<|en|>', 24, WARN], ['<|transcribe|>', 78, WARN], ['The', 186, INK], ['sky', 218, INK], ['is', 248, INK], ['clear.', 268, INK]];
    toks.forEach(function (t, i) {
      var e = txt(t[1], 212, t[0], { fill: t[2], 'font-size': '11' });
      fadeIn(e, D, 0.5 + i * 0.07, 0.56 + i * 0.07);
      svg.appendChild(e);
    });
    card(host, 'WHISPER PIPELINE', '输入 spectrogram，输出文本', svg,
      'Whisper 用眼睛来“听”：波形变成 log-mel spectrogram，encoder 读取 spectrogram 帧的方式就像 ViT 读取 patch，而 decoder 每次输入一个 Token 来生成转录文本，并由选择语言和任务的特殊 Token 引导。');
  }

  // ── n5-block-stack：capstone 自底向上完成组装 ─────────────────────────────
  function blockStack(host) {
    var D = 5, svg = svgEl('svg', { viewBox: '0 0 520 260' });
    svg.appendChild(txt(200, 252, '输入字符 (B, N)', { 'text-anchor': 'middle', fill: MUTE, 'font-size': '9' }));
    var embed = svgEl('g', {}, [
      svgEl('rect', { x: 100, y: 206, width: 200, height: 28, rx: 3, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }),
      txt(200, 224, 'Token + 位置 Embedding', { 'text-anchor': 'middle', 'font-size': '11' })
    ]);
    fadeRise(embed, D, 0.05, 0.13, 10);
    svg.appendChild(embed);
    [[168, 0.18, false], [138, 0.26, true], [108, 0.34, false]].forEach(function (b) {
      var kids = [svgEl('rect', { x: 100, y: b[0], width: 200, height: 26, rx: 3, fill: BP, 'fill-opacity': '0.06', stroke: BP, 'stroke-width': '1.5' })];
      if (b[2]) { kids.push(txt(200, b[0] + 17, 'causal Attention + SwiGLU', { 'text-anchor': 'middle', 'font-size': '11', fill: BP })); }
      var g = svgEl('g', {}, kids);
      fadeRise(g, D, b[1], b[1] + 0.08, 10);
      svg.appendChild(g);
    });
    var xl = txt(90, 155, '× L', { 'text-anchor': 'end', fill: BP, 'font-size': '11' });
    fadeIn(xl, D, 0.42, 0.48);
    svg.appendChild(xl);
    var headG = svgEl('g', {}, [
      svgEl('rect', { x: 100, y: 70, width: 200, height: 26, rx: 3, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }),
      txt(200, 87, 'RMSNorm + LM head', { 'text-anchor': 'middle', 'font-size': '11' })
    ]);
    fadeRise(headG, D, 0.44, 0.52, 10);
    svg.appendChild(headG);
    svg.appendChild(txt(316, 224, '第 04 课', { fill: MUTE, 'font-size': '8' }));
    svg.appendChild(txt(316, 155, '第 03 + 05 + 07 课', { fill: MUTE, 'font-size': '8' }));
    svg.appendChild(txt(316, 87, '第 05 课', { fill: MUTE, 'font-size': '8' }));
    var up = svgEl('line', { x1: 200, y1: 70, x2: 200, y2: 54, stroke: BP, 'stroke-width': '1.5' });
    draw(up, 18, D, 0.54, 0.6);
    svg.appendChild(up);
    [['ROMEO:', 160, BP], ['O,', 230, INK], ['speak!', 258, INK]].forEach(function (t, i) {
      var e = txt(t[1], 44, t[0], { fill: t[2], 'font-size': '13' });
      fadeIn(e, D, 0.62 + i * 0.07, 0.68 + i * 0.07);
      svg.appendChild(e);
    });
    card(host, 'TRANSFORMER CAPSTONE', '十三节课，一个 Model', svg,
      'capstone 将整个阶段堆叠成一个 decoder-only Model：底部是 Embedding，中间是 L 个重复的 causal Attention 和 SwiGLU feed-forward block，最后是 final norm 和 LM head，用于逐字符采样 Shakespeare 文本。它足够小，可以在笔记本电脑上运行；也足够正确，可以继续扩展。');
  }

  LF.register({
    'n5-subword-merge': subwordMerge,
    'n5-crosslingual-bridge': crosslingualBridge,
    'n5-chunk-cuts': chunkCuts,
    'n5-judge-gauge': judgeGauge,
    'n5-slot-tracker': slotTracker,
    'n5-patch-stream': patchStream,
    'n5-mel-decode': melDecode,
    'n5-block-stack': blockStack
  });
})();
