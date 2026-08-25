/* figures-history.js - 语言 Model 历史脉络的课程图示：prediction-game（Shannon 1951 年的猜测游戏）、chatbot-lineage（脚本式 bot 时间线）、mask-derivation（从前缀平均到 Attention）。使用 SMIL 编写（通过 LF 使用 animate/animateTransform），ES5，无依赖。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function card(host, label, sub, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur + 's', repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function animT(type, vals, dur, extra) {
    var a = { attributeName: 'transform', type: type, values: vals, dur: dur + 's', repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animateTransform', a);
  }
  var INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--ink-soft,#555)', MUTE = 'var(--ink-mute,#999)';
  var BP = 'var(--blueprint,#3553ff)', RULE = 'var(--rule-soft,#ddd)';
  var MONO = 'var(--font-mono,monospace)';
  function txt(x, y, s, attrs) {
    var a = { x: x, y: y, 'font-family': MONO, 'font-size': '12', fill: INK }; if (attrs) for (var k in attrs) a[k] = attrs[k];
    return svgEl('text', a, [document.createTextNode(s)]);
  }
  var POP_SPLINE = '0 0 1 1;0 0 1 1;.2 .9 .3 1;0 0 1 1';
  function revealKT(frac, delta, digits) {
    var d = digits || 3;
    return '0;' + frac.toFixed(d) + ';' + Math.min(frac + delta, 1).toFixed(d) + ';1';
  }
  function fadeIn(node, dur, kt) {
    node.appendChild(anim('opacity', '0;0;1;1', dur, { keyTimes: kt }));
  }

  // ── prediction-game：猜测次数逐步揭示字母，Entropy 条形图缩短 ───────────
  function predictionGame(host) {
    var W = 560, H = 250, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var letters = 'THE·CAT·SAT·ON·THE·MAT'.split('');
    var guesses = [3, 1, 1, 1, 4, 2, 1, 1, 3, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1];
    var DUR = 9, CW = 23, x0 = 27, cy = 96;
    svg.appendChild(txt(x0, 34, '猜下一个字母 · 记录尝试次数', { 'font-size': '10', 'letter-spacing': '.14em', fill: MUTE }));
    letters.forEach(function (ch, i) {
      var x = x0 + i * CW;
      var frac = (0.4 + i * 0.24) / DUR;
      svg.appendChild(svgEl('rect', { x: x, y: cy - 20, width: CW - 2, height: 28, fill: 'none', stroke: RULE, 'stroke-width': '1' }));
      var hidden = txt(x + (CW - 2) / 2, cy, '_', { 'text-anchor': 'middle', fill: MUTE, 'font-size': '13' });
      hidden.appendChild(anim('opacity', '1;1;0;0', DUR, { keyTimes: revealKT(frac, 0.02) }));
      svg.appendChild(hidden);
      var reveal = txt(x + (CW - 2) / 2, cy, ch === '·' ? '·' : ch, { 'text-anchor': 'middle', fill: INK, 'font-size': '13', opacity: '0' });
      fadeIn(reveal, DUR, revealKT(frac, 0.02));
      svg.appendChild(reveal);
      var chip = svgEl('g', { opacity: '0' }, [
        svgEl('rect', { x: x + 1, y: cy - 46, width: CW - 4, height: 16, rx: 2, fill: guesses[i] === 1 ? 'var(--blueprint-tint-strong,#e3e8ff)' : BP }),
        txt(x + (CW - 2) / 2, cy - 34, String(guesses[i]), { 'text-anchor': 'middle', fill: guesses[i] === 1 ? BP : 'var(--bg,#fff)', 'font-size': '10' })
      ]);
      chip.appendChild(anim('opacity', '0;0;1;1', DUR, { begin: '0', keyTimes: revealKT(frac, 0.025) }));
      chip.appendChild(animT('translate', '0 -8;0 -8;0 0;0 0', DUR, { keyTimes: revealKT(frac, 0.03), calcMode: 'spline', keySplines: POP_SPLINE }));
      svg.appendChild(chip);
    });
    var barY = 168, barW = 480;
    svg.appendChild(txt(x0, barY - 10, '每个字母的 BIT 数', { 'font-size': '10', 'letter-spacing': '.14em', fill: MUTE }));
    svg.appendChild(svgEl('rect', { x: x0, y: barY, width: barW, height: 12, fill: 'none', stroke: RULE, 'stroke-width': '1' }));
    var fill = svgEl('rect', { x: x0, y: barY, width: barW, height: 12, fill: BP, opacity: '0.85' });
    fill.appendChild(anim('width', barW + ';' + barW + ';121;121', DUR, { keyTimes: '0;0.05;0.72;1', calcMode: 'spline', keySplines: '0 0 1 1;.4 0 .2 1;0 0 1 1' }));
    svg.appendChild(fill);
    svg.appendChild(txt(x0 + barW, barY + 32, 'log2(27) = 4.75 原始值', { 'text-anchor': 'end', 'font-size': '10', fill: MUTE }));
    var measured = txt(x0 + 121, barY + 32, '猜测值约为 1.2', { 'font-size': '10', fill: BP, opacity: '0' });
    fadeIn(measured, DUR, '0;0.68;0.76;1');
    svg.appendChild(measured);
    svg.appendChild(txt(x0, H - 14, '猜测次数会重新编码文本 · 其平均值限定 Entropy', { 'font-size': '9', 'letter-spacing': '.12em', fill: MUTE }));
    card(host, '预测游戏', '1951 年手工测量 Entropy', svg,
      '人类逐个猜测隐藏字母，直到猜对为止；仅凭猜测次数就能重建文本，因此这些次数的统计特征可以限定每个字母的信息量。包含 27 个符号的字母表理论上每个字母可携带 4.75 bit。利用 Context 猜测的人类只需要接近 1 次。此后的每一种语言 Model 都是这个游戏的机械玩家，而 perplexity 就是它的得分。');
  }

  // ── chatbot-lineage：一条时间线上的五十年脚本式系统 ─────────────────────
  function chatbotLineage(host) {
    var W = 560, H = 240, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var DUR = 10, y = 152;
    var nodes = [
      { x: 70, year: '1950', name: '模仿游戏', detail: '对话 = benchmark' },
      { x: 128, year: '1956', name: '领域命名', detail: '为期 2 个月的猜想' },
      { x: 216, year: '1966', name: 'ELIZA', detail: '约 200 个模式，无状态' },
      { x: 288, year: '1972', name: 'PARRY', detail: '3 个情感变量' },
      { x: 398, year: '1995', name: 'ALICE', detail: '4 万个类别' },
      { x: 472, year: '2001', name: 'SMARTERCHILD', detail: '模板 + API' }
    ];
    var line = svgEl('line', { x1: 32, y1: y, x2: 528, y2: y, stroke: RULE, 'stroke-width': '1.5', 'stroke-dasharray': '496', 'stroke-dashoffset': '496' });
    line.appendChild(anim('stroke-dashoffset', '496;496;0;0', DUR, { keyTimes: '0;0.03;0.62;1' }));
    svg.appendChild(line);
    nodes.forEach(function (n, i) {
      var kt = revealKT(0.06 + i * 0.095, 0.03);
      var up = i % 2 === 0;
      var nameY = up ? 88 : 118, detailY = nameY + 13;
      var dot = svgEl('circle', { cx: n.x, cy: y, r: 5, fill: BP, opacity: '0' });
      fadeIn(dot, DUR, kt);
      svg.appendChild(dot);
      var stem = svgEl('line', { x1: n.x, y1: y - 8, x2: n.x, y2: detailY + 6, stroke: RULE, 'stroke-width': '1', opacity: '0' });
      stem.appendChild(anim('opacity', '0;0;0.7;0.7', DUR, { keyTimes: kt }));
      svg.appendChild(stem);
      [txt(n.x, nameY, n.name, { 'text-anchor': 'middle', 'font-size': '10', fill: INK }),
       txt(n.x, detailY, n.detail, { 'text-anchor': 'middle', 'font-size': '8.5', fill: MUTE }),
       txt(n.x, y + 22, n.year, { 'text-anchor': 'middle', 'font-size': '10', fill: BP })].forEach(function (t) {
        t.setAttribute('opacity', '0');
        fadeIn(t, DUR, kt);
        t.appendChild(animT('translate', '0 5;0 5;0 0;0 0', DUR, { keyTimes: kt, calcMode: 'spline', keySplines: POP_SPLINE }));
        svg.appendChild(t);
      });
    });
    var verdict = txt(W / 2, H - 18, '同一种机器 · 更多规则 · 从未实现通用性', { 'text-anchor': 'middle', 'font-size': '10', 'letter-spacing': '.16em', fill: BP, opacity: '0' });
    fadeIn(verdict, DUR, '0;0.68;0.78;1');
    svg.appendChild(verdict);
    card(host, '脚本式系统的半个世纪', '匹配、响应、重复', svg,
      '这条线上的每个系统都采用同一种机制：匹配输入、输出预制响应，再更新少量状态。PARRY 添加了情感变量，ALICE 添加了四万个类别，SmarterChild 添加了后端查询。覆盖范围随规则数量线性增长，但通用性始终没有出现。正是这个上限催生了接下来的三种范式。');
  }

  // ── mask-derivation：前缀平均 → 学习权重 → Attention ────────────────────
  function maskDerivation(host) {
    var W = 560, H = 260, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var DUR = 10, N = 5, CS = 25;
    var uniform = [], learned = [
      [1.0], [0.7, 0.3], [0.2, 0.55, 0.25], [0.5, 0.1, 0.25, 0.15], [0.1, 0.35, 0.1, 0.15, 0.3]
    ];
    for (var r = 0; r < N; r++) { var row = []; for (var c = 0; c <= r; c++) row.push(1 / (r + 1)); uniform.push(row); }
    var dynamicA = [
      [1.0], [0.15, 0.85], [0.6, 0.1, 0.3], [0.1, 0.5, 0.15, 0.25], [0.3, 0.05, 0.4, 0.05, 0.2]
    ];
    var dynamicB = [
      [1.0], [0.8, 0.2], [0.1, 0.3, 0.6], [0.4, 0.05, 0.15, 0.4], [0.05, 0.45, 0.1, 0.3, 0.1]
    ];
    var panels = [
      { x0: 34, title: '平均', sub: '1/(i+1)', weights: uniform, beg: 0.05 },
      { x0: 218, title: '已学习', sub: 'softmax(S + M)', weights: learned, beg: 0.28 },
      { x0: 402, title: 'ATTENTION', sub: 'softmax(QKᵀ/√d + M)', weights: dynamicA, beg: 0.51, dynamic: dynamicB }
    ];
    panels.forEach(function (p) {
      var g = svgEl('g', { opacity: '0' });
      fadeIn(g, DUR, revealKT(p.beg, 0.05, 2));
      g.appendChild(svgEl('text', { x: p.x0 + (N * CS) / 2, y: 40, 'text-anchor': 'middle', 'font-family': MONO, 'font-size': '10', 'letter-spacing': '.14em', fill: MUTE }, [document.createTextNode(p.title)]));
      for (var i = 0; i < N; i++) {
        for (var j = 0; j < N; j++) {
          var cx = p.x0 + j * CS, cy = 56 + i * CS;
          if (j > i) {
            g.appendChild(svgEl('rect', { x: cx, y: cy, width: CS - 2, height: CS - 2, fill: RULE, opacity: '0.3' }));
          } else {
            var w = p.weights[i][j];
            var cell = svgEl('rect', { x: cx, y: cy, width: CS - 2, height: CS - 2, fill: BP, opacity: (0.12 + w * 0.85).toFixed(2) });
            if (p.dynamic) {
              var w2 = p.dynamic[i][j];
              cell.appendChild(anim('opacity',
                (0.12 + w * 0.85).toFixed(2) + ';' + (0.12 + w * 0.85).toFixed(2) + ';' + (0.12 + w2 * 0.85).toFixed(2) + ';' + (0.12 + w * 0.85).toFixed(2),
                DUR, { keyTimes: '0;0.6;0.8;1', calcMode: 'spline', keySplines: '0 0 1 1;.4 0 .2 1;.4 0 .2 1' }));
            }
            g.appendChild(cell);
          }
        }
      }
      g.appendChild(svgEl('text', { x: p.x0 + (N * CS) / 2, y: 56 + N * CS + 20, 'text-anchor': 'middle', 'font-family': MONO, 'font-size': '9.5', fill: SOFT }, [document.createTextNode(p.sub)]));
      svg.appendChild(g);
    });
    [{ x: 172, beg: 0.24, label: '学习 S' }, { x: 356, beg: 0.47, label: 'S = QKᵀ' }].forEach(function (a) {
      var g = svgEl('g', { opacity: '0' });
      fadeIn(g, DUR, revealKT(a.beg, 0.04, 2));
      g.appendChild(svgEl('path', { d: 'M ' + a.x + ' 118 l 28 0 m -7 -5 l 7 5 l -7 5', fill: 'none', stroke: BP, 'stroke-width': '1.6' }));
      g.appendChild(svgEl('text', { x: a.x + 14, y: 106, 'text-anchor': 'middle', 'font-family': MONO, 'font-size': '9', fill: SOFT }, [document.createTextNode(a.label)]));
      svg.appendChild(g);
    });
    var verdict = txt(W / 2, H - 14, '三角结构不变 · 权重持续演化', { 'text-anchor': 'middle', 'font-size': '10', 'letter-spacing': '.16em', fill: BP, opacity: '0' });
    fadeIn(verdict, DUR, '0;0.58;0.68;1');
    svg.appendChild(verdict);
    card(host, '三角结构从何而来', '同一个 Matrix 的三次改进', svg,
      '三个面板都是与序列相乘的下三角行随机 Matrix。前缀平均将每个权重固定为 1/(i+1)。学习得到的分数使权重变得不均匀，但仍保持静态。Attention 让权重依赖 Token 本身，因此第三个面板会持续变化。mask 从未改变；它就是最初平均运算的循环边界。');
  }

  LF.register({
    'prediction-game': predictionGame,
    'chatbot-lineage': chatbotLineage,
    'mask-derivation': maskDerivation
  });
})();
