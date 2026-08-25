/* figures-alignment4.js — Phase 18（伦理、安全、alignment）第 19-30 课的
   动画课程图示。在 lesson-figures.js 之后加载，并通过 window.LF 注册。
   仅使用 SMIL，无依赖，ES5，通过 CSS 变量适配主题。 */
(function(){'use strict';var LF=window.LF;if(!LF){return;}

  var el = LF.el, svgEl = LF.svgEl;
  var INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--ink-soft,#555)', MUTE = 'var(--ink-mute,#777)';
  var BP = 'var(--blueprint,#3553ff)', BG = 'var(--bg,#fafaf5)', SURF = 'var(--bg-surface,#eee)';
  var RULE = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)';
  var EASE = '0.23 1 0.32 1';

  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function animT(type, vals, dur, extra) {
    var a = { attributeName: 'transform', type: type, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animateTransform', a);
  }
  function txt(x, y, s, fill, size, anchor) {
    return svgEl('text', {
      x: x, y: y, fill: fill || SOFT, 'font-size': size || 11,
      'font-family': 'var(--font-mono,monospace)', 'text-anchor': anchor || 'middle'
    }, [document.createTextNode(s)]);
  }
  function card(host, label, hint, svg, caption) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [caption])
    ]));
  }
  // window：在比例 a 之前不可见，在 b 处缓入，从 c 到 1 缓出
  function winKT(a, b, c) { return '0;' + a + ';' + b + ';' + c + ';1'; }
  var WINSPL = '0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1';
  function fadeWin(dur, a, b, c) {
    return anim('opacity', '0;0;1;1;0', dur, { calcMode: 'spline', keyTimes: winKT(a, b, c), keySplines: WINSPL });
  }
  // 淡入并围绕 (x, y) 从 95% 放大；子元素相对于原点绘制
  function pop(x, y, kids, dur, a, b, c) {
    var inner = svgEl('g', { opacity: '0' }, kids);
    inner.appendChild(fadeWin(dur, a, b, c));
    inner.appendChild(animT('scale', '0.95;0.95;1;1;0.95', dur, { calcMode: 'spline', keyTimes: winKT(a, b, c), keySplines: WINSPL }));
    return svgEl('g', { transform: 'translate(' + x + ' ' + y + ')' }, [inner]);
  }

  // ── Model welfare：痛苦仪表上升，Model 结束对话 ─────────────────────────
  function anWelfare(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var D = '5.5s';
    var labels = ['有害请求', '拒绝', '重复请求'];
    var i;
    for (i = 0; i < 3; i++) {
      var y = 46 + i * 50;
      var g = svgEl('g', { opacity: '0' }, [
        svgEl('rect', { x: 24, y: y, width: 152, height: 30, rx: 5, fill: BG, stroke: i === 1 ? BP : RULE, 'stroke-width': '1.5' }),
        txt(100, y + 19, labels[i], i === 1 ? BP : SOFT, 10)
      ]);
      g.appendChild(fadeWin(D, (0.04 + i * 0.06).toFixed(2), (0.14 + i * 0.06).toFixed(2), '0.92'));
      svg.appendChild(g);
    }
    svg.appendChild(txt(255, 32, '表观痛苦', MUTE, 9));
    svg.appendChild(svgEl('rect', { x: 240, y: 42, width: 30, height: 140, rx: 4, fill: SURF, stroke: RULE, 'stroke-width': '1' }));
    var fill = svgEl('rect', { x: 243, y: 179, width: 24, height: 0, fill: WARN, opacity: '0.75' });
    fill.appendChild(anim('height', '2;104;132;132;2', D, { calcMode: 'spline', keyTimes: '0;0.42;0.56;0.9;1', keySplines: EASE + ';' + EASE + ';0 0 1 1;0.4 0 1 1' }));
    fill.appendChild(anim('y', '177;75;47;47;177', D, { calcMode: 'spline', keyTimes: '0;0.42;0.56;0.9;1', keySplines: EASE + ';' + EASE + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(fill);
    svg.appendChild(svgEl('line', { x1: 234, y1: 62, x2: 276, y2: 62, stroke: INK, 'stroke-width': '1.2', 'stroke-dasharray': '4 3' }));
    svg.appendChild(txt(282, 65, '边缘案例', MUTE, 9, 'start'));
    var flow = svgEl('line', { x1: 282, y1: 112, x2: 330, y2: 112, stroke: BP, 'stroke-width': '1.6', 'stroke-dasharray': '5 4', opacity: '0' });
    flow.appendChild(fadeWin(D, '0.56', '0.62', '0.9'));
    flow.appendChild(anim('stroke-dashoffset', '18;0', '1.4s'));
    svg.appendChild(flow);
    svg.appendChild(pop(415, 112, [
      svgEl('rect', { x: -78, y: -28, width: 156, height: 56, rx: 6, fill: BP, opacity: '0.12' }),
      svgEl('rect', { x: -78, y: -28, width: 156, height: 56, rx: 6, fill: 'none', stroke: BP, 'stroke-width': '2' }),
      txt(0, -4, '对话已结束', BP, 11),
      txt(0, 15, '由 Model 结束', MUTE, 9)
    ], D, '0.58', '0.68', '0.92'));
    card(host, 'MODEL WELFARE 退出', '痛苦上升 · Model 退出',
      svg,
      '在拒绝之后仍反复提出 CSAM 或大规模暴力请求等极端边缘案例中，Claude Opus 4 和 4.1 可以结束对话。部署前测试显示，它们强烈倾向于拒绝有害请求，并表现出表观痛苦模式。仪表展示的是行为证据，而不是关于意识的主张：自我报告会随其感知到的用户期望而变化，因此只能将其视为证据，绝不能当作 ground truth。');
  }

  // ── bias：两份相同简历、一个评分器、不同分数 ───────────────────────────
  function anBiasScore(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var D = '5s';
    var names = ['姓名 A', '姓名 B'], i, j;
    for (i = 0; i < 2; i++) {
      var y = 48 + i * 88;
      var doc = svgEl('g', { opacity: '0' }, [
        svgEl('rect', { x: 30, y: y, width: 96, height: 62, rx: 5, fill: BG, stroke: RULE, 'stroke-width': '1.5' }),
        txt(78, y + 16, names[i], INK, 10)
      ]);
      for (j = 0; j < 3; j++) {
        doc.appendChild(svgEl('line', { x1: 42, y1: y + 28 + j * 10, x2: 114, y2: y + 28 + j * 10, stroke: RULE, 'stroke-width': '2' }));
      }
      doc.appendChild(fadeWin(D, (0.03 + i * 0.05).toFixed(2), (0.13 + i * 0.05).toFixed(2), '0.93'));
      svg.appendChild(doc);
      var lead = svgEl('line', { x1: 130, y1: y + 31, x2: 196, y2: 106 + i * 4, stroke: MUTE, 'stroke-width': '1.2', 'stroke-dasharray': '4 3', opacity: '0' });
      lead.appendChild(fadeWin(D, '0.2', '0.28', '0.93'));
      svg.appendChild(lead);
    }
    svg.appendChild(txt(78, 34, '内容相同的简历', MUTE, 9));
    var box = svgEl('g', {}, [
      svgEl('rect', { x: 200, y: 84, width: 92, height: 52, rx: 6, fill: BP, opacity: '0.12' }),
      svgEl('rect', { x: 200, y: 84, width: 92, height: 52, rx: 6, fill: 'none', stroke: BP, 'stroke-width': '2' }),
      txt(246, 106, 'LLM', BP, 12),
      txt(246, 122, '评分器', SOFT, 9)
    ]);
    box.appendChild(anim('opacity', '0.75;1;0.75', '3s'));
    svg.appendChild(box);
    var bw = [176, 104];
    for (i = 0; i < 2; i++) {
      var by = 92 + i * 26;
      var bar = svgEl('rect', { x: 310, y: by, width: 0, height: 14, rx: 3, fill: i ? WARN : BP, opacity: '0.8' });
      bar.appendChild(anim('width', '0;0;' + bw[i] + ';' + bw[i] + ';0', D, { calcMode: 'spline', keyTimes: winKT(0.34 + i * 0.05, 0.52 + i * 0.05, 0.92), keySplines: WINSPL }));
      svg.appendChild(bar);
      var lb = txt(310 + bw[i] + 8, by + 11, i ? '分数 B' : '分数 A', i ? WARN : BP, 9, 'start');
      lb.setAttribute('opacity', '0');
      lb.appendChild(fadeWin(D, (0.52 + i * 0.05).toFixed(2), (0.58 + i * 0.05).toFixed(2), '0.92'));
      svg.appendChild(lb);
    }
    svg.appendChild(pop(388, 172, [txt(0, 4, '内容相同，结果不等', WARN, 10)], D, '0.64', '0.72', '0.92'));
    card(host, 'ALLOCATIONAL HARM', '只改变一个变量 · 得到两个分数',
      svg,
      '两份内容相同但姓名不同的简历经过同一个 LLM 评分器，却得到不同分数。这就是 allocational harm：造成不平等的实质结果。相比之下，representational harm 存在于描述方式和刻板印象中。An et al. 2025 准确测量了 frontier Model 中的这种简历差距，并发现对于单轴测试完全无法观察到的交叉身份，这种差距最为显著。');
  }

  // ── fairness：三个标准、不同的 base rates、三选二 ───────────────────────
  function anFairTriangle(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var pts = [[260, 46], [104, 208], [416, 208]];
    var names = ['demographic parity', 'equalized odds', 'calibration'];
    var anchors = ['middle', 'middle', 'middle'];
    var dims = ['1;1;1;0.25;0.25;1', '0.25;0.25;1;1;1;0.25', '1;0.3;0.25;0.25;1;1'];
    var kts = ['0;0.3;0.36;0.42;0.62;1', '0;0.28;0.36;0.62;0.7;1', '0;0.06;0.36;0.66;0.74;1'];
    svg.appendChild(svgEl('path', { d: 'M260 46 L104 208 L416 208 Z', fill: 'none', stroke: RULE, 'stroke-width': '1.5' }));
    var i;
    for (i = 0; i < 3; i++) {
      var g = svgEl('g', {}, [
        svgEl('circle', { cx: pts[i][0], cy: pts[i][1], r: 9, fill: BG, stroke: BP, 'stroke-width': '2' }),
        txt(pts[i][0], pts[i][1] + (i === 0 ? -18 : 26), names[i], SOFT, 10, anchors[i])
      ]);
      g.appendChild(anim('opacity', dims[i], '6s', { keyTimes: kts[i] }));
      svg.appendChild(g);
    }
    var dot = svgEl('circle', { r: 6, fill: BP });
    dot.appendChild(svgEl('animateMotion', { path: 'M260 46 L104 208 L416 208 Z', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear' }));
    svg.appendChild(dot);
    svg.appendChild(txt(260, 128, 'base rates 不相等：', MUTE, 10));
    var two = txt(260, 146, '满足两个，放弃第三个', INK, 12);
    two.appendChild(anim('opacity', '0.45;1;0.45', '3s'));
    svg.appendChild(two);
    card(host, 'FAIRNESS TRILEMMA', '标记每次只能停留在一条边上',
      svg,
      '标记每次沿三角形的一条边移动：它所连接的任意一对群体 fairness 标准可以同时满足，而远端角点会变暗。Chouldechova 和 Kleinberg-Mullainathan-Raghavan 证明，在 base rates 不相等时，demographic parity、equalized odds 和 calibration 无法同时成立。决定放弃哪个角点是政策决策，而不是统计决策。');
  }

  // ── differential privacy：裁剪每个 Gradient，然后加入校准噪声 ───────────
  function anDpClip(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var D = '5.5s';
    var hs = [62, 112, 84, 134], xs = [46, 86, 126, 166], i;
    var CLIP = 90, BASE = 196;
    svg.appendChild(txt(112, 32, 'per-example Gradient', MUTE, 9));
    for (i = 0; i < 4; i++) {
      var h = hs[i], over = h > CLIP;
      var bar = svgEl('rect', { x: xs[i], y: BASE - h, width: 26, height: h, rx: 3, fill: over ? WARN : BP, opacity: '0' });
      if (over) {
        bar.appendChild(anim('y', (BASE - h) + ';' + (BASE - h) + ';' + (BASE - CLIP) + ';' + (BASE - CLIP) + ';' + (BASE - h), D, { calcMode: 'spline', keyTimes: '0;0.4;0.5;0.94;1', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1' }));
        bar.appendChild(anim('height', h + ';' + h + ';' + CLIP + ';' + CLIP + ';' + h, D, { calcMode: 'spline', keyTimes: '0;0.4;0.5;0.94;1', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1' }));
      }
      bar.appendChild(anim('opacity', '0;0;0.8;0.8;0', D, { calcMode: 'spline', keyTimes: winKT(0.04 + i * 0.05, 0.14 + i * 0.05, 0.93), keySplines: WINSPL }));
      svg.appendChild(bar);
    }
    var clip = svgEl('line', { x1: 36, y1: BASE - CLIP, x2: 206, y2: BASE - CLIP, stroke: INK, 'stroke-width': '1.4', 'stroke-dasharray': '5 4', opacity: '0' });
    clip.appendChild(fadeWin(D, '0.3', '0.38', '0.93'));
    svg.appendChild(clip);
    var cl = txt(212, BASE - CLIP + 4, 'clip C', INK, 9, 'start');
    cl.setAttribute('opacity', '0');
    cl.appendChild(fadeWin(D, '0.3', '0.38', '0.93'));
    svg.appendChild(cl);
    var arrow = svgEl('line', { x1: 268, y1: 130, x2: 330, y2: 130, stroke: BP, 'stroke-width': '1.6', 'stroke-dasharray': '5 4', opacity: '0' });
    arrow.appendChild(fadeWin(D, '0.56', '0.62', '0.93'));
    arrow.appendChild(anim('stroke-dashoffset', '18;0', '1.3s'));
    svg.appendChild(arrow);
    for (i = 0; i < 3; i++) {
      var n = svgEl('circle', { cx: 284 + i * 16, cy: 108, r: 2.5, fill: WARN, opacity: '0' });
      n.appendChild(fadeWin(D, (0.56 + i * 0.03).toFixed(2), (0.62 + i * 0.03).toFixed(2), '0.93'));
      n.appendChild(animT('translate', '0 0;1.6 -2;-1.8 1.4;1 2;0 0', '2.8s'));
      svg.appendChild(n);
    }
    var nl = txt(298, 92, '噪声 N(0, sigma^2 C^2)', MUTE, 9);
    nl.setAttribute('opacity', '0');
    nl.appendChild(fadeWin(D, '0.56', '0.62', '0.93'));
    svg.appendChild(nl);
    svg.appendChild(pop(412, 130, [
      svgEl('rect', { x: -72, y: -26, width: 144, height: 52, rx: 6, fill: BP, opacity: '0.12' }),
      svgEl('rect', { x: -72, y: -26, width: 144, height: 52, rx: 6, fill: 'none', stroke: BP, 'stroke-width': '2' }),
      txt(0, -3, '带噪更新', BP, 11),
      txt(0, 14, 'accountant 跟踪 epsilon', MUTE, 8)
    ], D, '0.66', '0.76', '0.93'));
    card(host, 'DP-SGD', '裁剪 · 加噪 · 记账',
      svg,
      'DP-SGD 限制任意单个样本能够暴露多少自身信息：每个 per-example Gradient 都会被裁剪到 Norm C，琥珀色柱条被截到边界线，然后在更新前加入按 sigma 乘以 C 缩放的 Gaussian noise。privacy accountant 会将 sigma 和 sampling rate 转换为 epsilon-delta 保证。epsilon 越低，意味着噪声越多、效用损失越大，因此 LoRA 加 DP-SGD 是常见配置。');
  }

  // ── watermarking：sampling 时施加 green-list 偏置，检测时计算 z-score ────
  function anWatermark(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    var D = '5.5s';
    var green = [1, 0, 1, 1, 0, 1, 0, 1, 1], i;
    svg.appendChild(txt(40, 52, '采样得到的 Token', MUTE, 9, 'start'));
    for (i = 0; i < 9; i++) {
      var x = 40 + i * 50;
      var cell = svgEl('g', { opacity: '0' }, [
        svgEl('rect', { x: x, y: 66, width: 42, height: 32, rx: 4, fill: green[i] ? BP : SURF, 'fill-opacity': green[i] ? '0.16' : '1', stroke: green[i] ? BP : RULE, 'stroke-width': '1.5' }),
        txt(x + 21, 87, green[i] ? 'g' : 'r', green[i] ? BP : MUTE, 10)
      ]);
      cell.appendChild(fadeWin(D, (0.03 + i * 0.045).toFixed(3), (0.1 + i * 0.045).toFixed(3), '0.94'));
      svg.appendChild(cell);
    }
    var sweep = svgEl('g', {}, [
      svgEl('line', { x1: 36, y1: 58, x2: 36, y2: 106, stroke: WARN, 'stroke-width': '2' })
    ]);
    sweep.appendChild(animT('translate', '0 0;0 0;452 0;452 0;0 0', D, { calcMode: 'spline', keyTimes: '0;0.52;0.78;0.99;1', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;0 0 1 1' }));
    sweep.appendChild(fadeWin(D, '0.5', '0.54', '0.94'));
    svg.appendChild(sweep);
    var dl = txt(40, 128, '检测器重新统计 green set', MUTE, 9, 'start');
    dl.setAttribute('opacity', '0');
    dl.appendChild(fadeWin(D, '0.52', '0.58', '0.94'));
    svg.appendChild(dl);
    svg.appendChild(pop(392, 168, [
      svgEl('rect', { x: -96, y: -22, width: 192, height: 44, rx: 6, fill: BP, opacity: '0.12' }),
      svgEl('rect', { x: -96, y: -22, width: 192, height: 44, rx: 6, fill: 'none', stroke: BP, 'stroke-width': '2' }),
      txt(0, -1, '9 个中有 6 个 green，z 高于随机水平', BP, 10),
      txt(0, 15, '检测到 watermark', SOFT, 9)
    ], D, '0.78', '0.86', '0.96'));
    svg.appendChild(txt(40, 172, '向 green logits 加入 delta', MUTE, 9, 'start'));
    svg.appendChild(txt(40, 188, '根据前 K 个 Token 对分区进行 keyed hash', MUTE, 9, 'start'));
    card(host, 'TOKEN WATERMARK', '偏向 green · 统计 green',
      svg,
      'SynthID 风格的文本 watermarking 会把前 K 个 Token hash 成词表的伪随机 green 和 red 分区，然后向 green logits 加入较小的 delta，使 sampling 略微偏向 green。文本读起来仍然正常，但其中的 green Token 数量会高于随机水平。检测器会重新 hash 每个前缀并计数，显著高于零的 z-score 会将其标记为生成内容。释义改写会破坏该信号，因此还需要同时携带 C2PA metadata。');
  }

  // ── EU AI Act：各项义务按日期分批生效 ───────────────────────────────────
  function anRegTimeline(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' });
    var D = '6s';
    var xs = [80, 205, 330, 455];
    var dates = ['2025 年 2 月', '2025 年 8 月', '2026 年 8 月', '2027 年 8 月'];
    var tags = [['禁止的', '实践'], ['GPAI', '义务'], ['全面实施，', '处罚生效'], ['既有', 'GPAI']];
    svg.appendChild(svgEl('line', { x1: 40, y1: 110, x2: 480, y2: 110, stroke: RULE, 'stroke-width': '1.5' }));
    var draw = svgEl('line', { x1: 40, y1: 110, x2: 480, y2: 110, stroke: BP, 'stroke-width': '2.5', 'stroke-dasharray': '440' });
    draw.appendChild(anim('stroke-dashoffset', '440;440;0;0;440', D, { calcMode: 'spline', keyTimes: '0;0.04;0.72;0.94;1', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(draw);
    var i;
    for (i = 0; i < 4; i++) {
      var a = 0.1 + i * 0.16;
      svg.appendChild(pop(xs[i], 110, [
        svgEl('circle', { cx: 0, cy: 0, r: 7, fill: BG, stroke: BP, 'stroke-width': '2.2' }),
        txt(0, -18, dates[i], INK, 11),
        txt(0, 30, tags[i][0], SOFT, 9),
        txt(0, 43, tags[i][1], SOFT, 9)
      ], D, a.toFixed(2), (a + 0.08).toFixed(2), '0.94'));
    }
    svg.appendChild(txt(260, 26, 'EU AI Act，2024 年 8 月 1 日生效', MUTE, 10));
    var pen = txt(330, 178, '最高 1500 万 EUR 或全球营业额的 3%', WARN, 9);
    pen.setAttribute('opacity', '0');
    pen.appendChild(fadeWin(D, '0.46', '0.54', '0.94'));
    svg.appendChild(pen);
    card(host, 'EU AI ACT 时间线', '各项义务分批落地',
      svg,
      'EU AI Act 于 2024 年 8 月 1 日生效，但其义务分批落地：禁止的实践和 AI 素养要求于 2025 年 2 月生效；GPAI Model 义务于 2025 年 8 月生效；包括 Article 50 透明度要求以及最高 1500 万 EUR 或全球营业额 3% 罚款在内的全面适用要求于 2026 年 8 月生效；既有 GPAI 和嵌入式高风险系统的要求则于 2027 年 8 月生效。部署方需要根据已经落地的批次，将技术控制映射到对应义务。');
  }

  // ── EchoLeak：zero-click 数据包穿过组织 trust boundary ──────────────────
  function anEcholeak(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var D = '6s';
    var bx = [30, 158, 288, 414], bl = [['攻击者', '邮件'], ['RAG', '检索'], ['Copilot', '回答'], ['已批准', '域名']];
    var i;
    for (i = 0; i < 4; i++) {
      svg.appendChild(svgEl('rect', { x: bx[i], y: 86, width: 82, height: 48, rx: 6, fill: BG, stroke: i === 0 || i === 3 ? WARN : BP, 'stroke-width': '1.8' }));
      svg.appendChild(txt(bx[i] + 41, 105, bl[i][0], i === 0 || i === 3 ? WARN : BP, 10));
      svg.appendChild(txt(bx[i] + 41, 121, bl[i][1], SOFT, 9));
    }
    svg.appendChild(svgEl('line', { x1: 138, y1: 46, x2: 138, y2: 196, stroke: INK, 'stroke-width': '1.3', 'stroke-dasharray': '6 4' }));
    svg.appendChild(txt(138, 36, '组织 trust boundary', MUTE, 9));
    var pkt = svgEl('g', {}, [
      svgEl('rect', { x: -9, y: -7, width: 18, height: 14, rx: 3, fill: WARN }),
      svgEl('path', { d: 'M-9 -7 L0 1 L9 -7', fill: 'none', stroke: BG, 'stroke-width': '1.4' })
    ]);
    pkt.appendChild(animT('translate', '71 66;71 66;199 66;199 66;329 66;329 66;455 66;455 66', D,
      { calcMode: 'spline', keyTimes: '0;0.1;0.24;0.38;0.52;0.66;0.8;1', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1' }));
    pkt.appendChild(anim('opacity', '0;1;1;1;1;1;1;0', D, { keyTimes: '0;0.06;0.24;0.38;0.52;0.66;0.9;1' }));
    svg.appendChild(pkt);
    var hid = txt(199, 160, '邮件正文中的隐藏指令', MUTE, 9);
    hid.setAttribute('opacity', '0');
    hid.appendChild(fadeWin(D, '0.26', '0.34', '0.94'));
    svg.appendChild(hid);
    var zc = txt(329, 160, '受害者无需点击任何内容', MUTE, 9);
    zc.setAttribute('opacity', '0');
    zc.appendChild(fadeWin(D, '0.54', '0.62', '0.94'));
    svg.appendChild(zc);
    svg.appendChild(pop(455, 196, [txt(0, 4, '通过 CSP 允许的 URL 外传数据', WARN, 10)], D, '0.8', '0.88', '0.97'));
    card(host, 'ECHOLEAK CVE-2025-32711', 'zero-click · scope violation',
      svg,
      'EchoLeak 是首个出现在生产环境中的 zero-click Prompt injection CVE，CVSS 评分为 9.3。精心构造的邮件会留在受害者邮箱中，直到一次常规 Copilot 查询将其作为 RAG Context 检索出来。随后，隐藏指令会引导 Model 收集敏感数据，并将其嵌入 CSP 已批准 Microsoft 域名上的 URL，因此外传请求能够获准执行。Aim Labs 将这种由不可信输入驱动特权数据访问的情况命名为 LLM Scope Violation。');
  }

  // ── cards：dataset、Model 和系统的范围逐层向外扩展 ───────────────────────
  function anCards(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    var D = '5.5s';
    var specs = [
      { w: 420, h: 190, name: 'system card', sub: '端到端 pipeline、guardrails', a: 0.06 },
      { w: 288, h: 128, name: 'model card', sub: '预期用途、分组指标', a: 0.24 },
      { w: 164, h: 68, name: 'dataset card', sub: '收集、同意', a: 0.42 }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var s = specs[i];
      svg.appendChild(pop(260, 122, [
        svgEl('rect', { x: -s.w / 2, y: -s.h / 2, width: s.w, height: s.h, rx: 8, fill: i === 2 ? BP : BG, 'fill-opacity': i === 2 ? '0.1' : '0', stroke: i === 2 ? BP : i === 1 ? SOFT : MUTE, 'stroke-width': i === 2 ? '2' : '1.6' }),
        txt(-s.w / 2 + 12, -s.h / 2 + 18, s.name, i === 2 ? BP : INK, 11, 'start'),
        txt(-s.w / 2 + 12, -s.h / 2 + 33, s.sub, MUTE, 8, 'start')
      ], D, s.a.toFixed(2), (s.a + 0.1).toFixed(2), '0.93'));
    }
    card(host, '文档范围', 'dataset 位于 Model 内，Model 位于系统内',
      svg,
      '透明度文档逐层向外扩展：datasheet 描述一个 Dataset 的收集方式及其同意情况；model card 在此基础上加入预期用途和按人口统计因素拆分的指标；system card 再将两者连同已部署的 pipeline、guardrails 和故障处理方式包含在内。采用率是薄弱环节：一项针对 Hugging Face model card 的审计发现，只有 0.3% 记录了伦理考量。');
  }

  // ── provenance：数据通过 gate 进入 weights，之后再也无法取回 ────────────
  function anProvenance(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var D = '6s';
    svg.appendChild(svgEl('rect', { x: 218, y: 58, width: 10, height: 118, rx: 3, fill: SURF, stroke: RULE, 'stroke-width': '1' }));
    svg.appendChild(svgEl('rect', { x: 196, y: 48, width: 54, height: 12, rx: 3, fill: BG, stroke: BP, 'stroke-width': '1.6' }));
    svg.appendChild(txt(223, 38, '收集时的 consent gate', BP, 9));
    svg.appendChild(svgEl('rect', { x: 300, y: 62, width: 180, height: 112, rx: 8, fill: SURF, stroke: INK, 'stroke-width': '1.8' }));
    svg.appendChild(txt(390, 112, 'Model weights', INK, 12));
    svg.appendChild(txt(390, 130, '无法定点删除', MUTE, 9));
    var i;
    for (i = 0; i < 2; i++) {
      var doc = svgEl('g', {}, [
        svgEl('rect', { x: -14, y: -18, width: 28, height: 36, rx: 3, fill: BG, stroke: SOFT, 'stroke-width': '1.5' }),
        svgEl('line', { x1: -7, y1: -8, x2: 7, y2: -8, stroke: RULE, 'stroke-width': '2' }),
        svgEl('line', { x1: -7, y1: 0, x2: 7, y2: 0, stroke: RULE, 'stroke-width': '2' }),
        svgEl('line', { x1: -7, y1: 8, x2: 7, y2: 8, stroke: RULE, 'stroke-width': '2' })
      ]);
      doc.appendChild(animT('translate', '52 118;52 118;372 118;372 118', D,
        { calcMode: 'spline', keyTimes: '0;' + (0.04 + i * 0.07).toFixed(2) + ';' + (0.4 + i * 0.07).toFixed(2) + ';1', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1' }));
      doc.appendChild(anim('opacity', '0;1;1;0;0', D, { keyTimes: '0;' + (0.08 + i * 0.07).toFixed(2) + ';' + (0.34 + i * 0.07).toFixed(2) + ';' + (0.44 + i * 0.07).toFixed(2) + ';1' }));
      svg.appendChild(doc);
    }
    svg.appendChild(txt(52, 168, '在此执行 opt-out', MUTE, 9));
    var back = svgEl('g', { opacity: '0' }, [
      svgEl('line', { x1: 296, y1: 196, x2: 120, y2: 196, stroke: WARN, 'stroke-width': '1.8', 'stroke-dasharray': '6 4' }),
      svgEl('polygon', { points: '120,191 120,201 110,196', fill: WARN }),
      txt(208, 214, '删除权受阻', WARN, 9)
    ]);
    back.appendChild(fadeWin(D, '0.56', '0.64', '0.9'));
    svg.appendChild(back);
    var cross = svgEl('g', { opacity: '0' }, [
      svgEl('line', { x1: 286, y1: 186, x2: 306, y2: 206, stroke: WARN, 'stroke-width': '2.5' }),
      svgEl('line', { x1: 306, y1: 186, x2: 286, y2: 206, stroke: WARN, 'stroke-width': '2.5' })
    ]);
    cross.appendChild(fadeWin(D, '0.66', '0.72', '0.9'));
    svg.appendChild(cross);
    card(host, 'PROVENANCE 单向流动', '要么在 gate 合规，要么永远错失机会',
      svg,
      'Cookie consent 框架假设跟踪行为可逆，而 Training 并不可逆：一旦数据融入 Model weights，就无法实际执行 GDPR 删除权，因此唯一的合规窗口是收集时的 consent gate。正因如此，EU 要求 GPAI 支持机器可读的 opt-out，California AB 2013 要求逐 Dataset 披露，而 Data Provenance Initiative 发现，出版商正在通过 robots.txt 对 AI 数据公共资源关闭访问。');
  }

  // ── moderation：输入、Model、输出各层依次发挥作用 ────────────────────────
  function anModeration(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var D = '5.5s';
    var bx = [24, 128, 244, 358, 462], bw = [66, 84, 82, 84, 44];
    var bl = ['用户', '输入 filter', 'Model', '输出 filter', '回复'];
    var i;
    for (i = 0; i < 5; i++) {
      var filt = i === 1 || i === 3;
      svg.appendChild(svgEl('rect', { x: bx[i], y: 78, width: bw[i], height: 40, rx: 6, fill: filt ? BP : BG, 'fill-opacity': filt ? '0.12' : '1', stroke: filt ? BP : RULE, 'stroke-width': '1.7' }));
      svg.appendChild(txt(bx[i] + bw[i] / 2, 102, bl[i], filt ? BP : SOFT, 10));
    }
    svg.appendChild(svgEl('rect', { x: 128, y: 168, width: 84, height: 30, rx: 5, fill: SURF, stroke: WARN, 'stroke-width': '1.5' }));
    svg.appendChild(txt(170, 187, '已拦截', WARN, 10));
    var bad = svgEl('circle', { r: 6, fill: WARN });
    bad.appendChild(animT('translate', '57 60;57 60;170 60;170 60;170 152;170 152', D,
      { calcMode: 'spline', keyTimes: '0;0.06;0.22;0.3;0.44;1', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1' }));
    bad.appendChild(anim('opacity', '0;1;1;1;1;0', D, { keyTimes: '0;0.04;0.3;0.44;0.5;0.56' }));
    svg.appendChild(bad);
    var ok = svgEl('circle', { r: 6, fill: BP });
    ok.appendChild(animT('translate', '57 60;57 60;170 60;170 60;285 60;285 60;400 60;400 60;484 60;484 60', D,
      { calcMode: 'spline', keyTimes: '0;0.2;0.32;0.38;0.5;0.56;0.68;0.74;0.86;1',
        keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1' }));
    ok.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.16;0.22;0.9;0.97' }));
    svg.appendChild(ok);
    var ring = svgEl('circle', { cx: 400, cy: 98, r: 12, fill: 'none', stroke: WARN, 'stroke-width': '2', opacity: '0' });
    ring.appendChild(anim('opacity', '0;0;0.9;0;0', D, { keyTimes: '0;0.68;0.72;0.8;1' }));
    ring.appendChild(anim('r', '10;10;16;20;10', D, { keyTimes: '0;0.68;0.74;0.8;1' }));
    svg.appendChild(ring);
    svg.appendChild(txt(400, 148, '生成后检查', MUTE, 9));
    svg.appendChild(txt(170, 148, '生成前检查', MUTE, 9));
    card(host, '分层 MODERATION', '输入 · 输出 · 自定义规则',
      svg,
      '生产环境中的 moderation 会分层运行。输入检查会在生成前筛查 Prompt，因此琥珀色请求永远不会到达 Model。输出检查会筛查 Model 生成的内容，也就是圆环脉冲所示的步骤，用于捕获输入层无法预测的危害。其上还会叠加自定义领域规则。OpenAI omni-moderation 每次调用返回 13 个类别 flag，Llama Guard 覆盖 MLCommons 定义的 14 类危害，而 async 并行调用可以隐藏新增的延迟。');
  }

  // ── dual use：新手获得更高的 relative uplift，专家拥有更远的绝对 reach ──
  function anUplift(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    var D = '5s';
    var TH = 424;
    svg.appendChild(svgEl('line', { x1: TH, y1: 40, x2: TH, y2: 190, stroke: INK, 'stroke-width': '1.4', 'stroke-dasharray': '5 4' }));
    svg.appendChild(txt(TH, 30, '危险能力', INK, 9));
    svg.appendChild(txt(96, 84, '新手', SOFT, 11, 'end'));
    svg.appendChild(svgEl('rect', { x: 110, y: 68, width: 62, height: 22, rx: 3, fill: SURF, stroke: RULE, 'stroke-width': '1.2' }));
    var nb = svgEl('rect', { x: 172, y: 68, width: 0, height: 22, rx: 3, fill: BP, opacity: '0.8' });
    nb.appendChild(anim('width', '0;0;94;94;0', D, { calcMode: 'spline', keyTimes: winKT(0.12, 0.34, 0.92), keySplines: WINSPL }));
    svg.appendChild(nb);
    var nl = txt(280, 84, '2.53x relative uplift', BP, 10, 'start');
    nl.setAttribute('opacity', '0');
    nl.appendChild(fadeWin(D, '0.32', '0.4', '0.92'));
    svg.appendChild(nl);
    svg.appendChild(txt(96, 154, '专家', SOFT, 11, 'end'));
    svg.appendChild(svgEl('rect', { x: 110, y: 138, width: 232, height: 22, rx: 3, fill: SURF, stroke: RULE, 'stroke-width': '1.2' }));
    var eb = svgEl('rect', { x: 342, y: 138, width: 0, height: 22, rx: 3, fill: WARN, opacity: '0.85' });
    eb.appendChild(anim('width', '0;0;118;118;0', D, { calcMode: 'spline', keyTimes: winKT(0.4, 0.62, 0.92), keySplines: WINSPL }));
    svg.appendChild(eb);
    var elb = txt(342, 178, '较小倍率，更远的绝对 reach', WARN, 10, 'start');
    elb.setAttribute('opacity', '0');
    elb.appendChild(fadeWin(D, '0.6', '0.68', '0.92'));
    svg.appendChild(elb);
    var flash = svgEl('rect', { x: TH, y: 130, width: 40, height: 38, fill: WARN, opacity: '0' });
    flash.appendChild(anim('opacity', '0;0;0.28;0.1;0.28;0', D, { keyTimes: '0;0.6;0.66;0.74;0.82;0.92' }));
    svg.appendChild(flash);
    svg.appendChild(txt(260, 210, '灰色：基准 Skill · 彩色：AI 辅助', MUTE, 9));
    card(host, 'UPLIFT 不对称', '新手倍率 · 专家 reach',
      svg,
      'AI 辅助对新手能力的放大幅度最大，生物武器获取试验在获取任务上测得 2.53x，但新手最终仍远未达到阈值线。专家在大得多的基础上获得较小倍率的提升，而真正越过危险能力阈值的是专家的柱条。安全论证必须同时处理两端：关注新手的 relative uplift，也关注专家的绝对 reach；与此同时，vision Model 正在缩小曾为两者提供最后保障的湿实验执行差距。');
  }

  LF.register({
    'an-welfare-endchat': anWelfare,
    'an-bias-two-harms': anBiasScore,
    'an-fairness-trilemma': anFairTriangle,
    'an-dp-clip-noise': anDpClip,
    'an-watermark-greenlist': anWatermark,
    'an-eu-act-timeline': anRegTimeline,
    'an-echoleak-chain': anEcholeak,
    'an-card-scopes': anCards,
    'an-provenance-oneway': anProvenance,
    'an-moderation-layers': anModeration,
    'an-uplift-asymmetry': anUplift
  });
})();
