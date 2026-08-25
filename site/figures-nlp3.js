(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, select = LF.select;

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
  var BP = 'var(--blueprint,#3553ff)', RULE = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)';
  var MONO = 'var(--font-mono,monospace)';
  function txt(x, y, s, attrs) {
    var a = { x: x, y: y, 'font-family': MONO, 'font-size': '12', fill: INK }; if (attrs) for (var k in attrs) a[k] = attrs[k];
    return svgEl('text', a, [document.createTextNode(s)]);
  }

  // ── pos-tagger：语法标签逐个落到 Token 上 ───────────────────────────────────
  function posTagger(host) {
    var W = 520, H = 220, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var toks = ['这只', '猫', '正在', '跑', '很快'];
    var tags = ['DET', 'NOUN', 'AUX', 'VERB', 'ADV'];
    var x0 = 30, gap = 98, ty = 130;
    toks.forEach(function (w, i) {
      var x = x0 + i * gap;
      svg.appendChild(svgEl('rect', { x: x, y: ty - 22, width: 80, height: 30, rx: 3, fill: 'none', stroke: RULE, 'stroke-width': '1.5' }));
      svg.appendChild(txt(x + 40, ty - 2, w, { 'text-anchor': 'middle', fill: INK, 'font-family': 'var(--font-body,serif)', 'font-size': '15' }));
      var tag = svgEl('g', {}, [
        svgEl('rect', { x: x + 10, y: 0, width: 60, height: 22, rx: 3, fill: BP, opacity: '0' }),
        txt(x + 40, 15, tags[i], { 'text-anchor': 'middle', fill: 'var(--bg,#fff)', 'font-size': '11', opacity: '0' })
      ]);
      var beg = (i * 0.55).toFixed(2);
      tag.appendChild(animT('translate', '0 -34;0 -34;0 90;0 86;0 88', 5, { begin: beg, calcMode: 'spline', keyTimes: '0;0.4;0.72;0.85;1', keySplines: '0 0 1 1;.4 0 .2 1;.5 0 .5 1;.5 0 .5 1' }));
      tag.childNodes[0].appendChild(anim('opacity', '0;0;1;1', 5, { begin: beg, keyTimes: '0;0.4;0.72;1' }));
      tag.childNodes[1].appendChild(anim('opacity', '0;0;1;1', 5, { begin: beg, keyTimes: '0;0.4;0.72;1' }));
      svg.appendChild(tag);
    });
    card(host, 'POS TAGGER', '标签逐个落到 Token 上', svg,
      '每个 Token 都会获得一个语法类别。tagger 从左到右扫描句子，为每个词添加标签：限定词、名词、助动词、动词、副词。这些标签随后会由 lemmatizer 和 dependency parser 读取。');
  }

  // ── dependency-arcs：带标签的 head→dependent 弧线自行绘制 ──────────────────
  function depArcs(host) {
    var W = 520, H = 200, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var toks = ['猫', '正在', '奔跑', '在', '黎明'];
    var bx = 28, gap = 96, by = 160, cx = [];
    toks.forEach(function (w, i) { var x = bx + i * gap; cx.push(x + 30); svg.appendChild(txt(x + 30, by, w, { 'text-anchor': 'middle', 'font-family': 'var(--font-body,serif)', 'font-size': '15' })); });
    var arcs = [[2, 0, 'nsubj'], [2, 1, 'aux'], [2, 3, 'prep'], [3, 4, 'pobj']];
    arcs.forEach(function (a, i) {
      var h = cx[a[0]], d = cx[a[1]], top = by - 30 - Math.abs(a[0] - a[1]) * 22;
      var mid = (h + d) / 2;
      var path = 'M ' + h + ' ' + (by - 26) + ' C ' + h + ' ' + top + ' ' + d + ' ' + top + ' ' + d + ' ' + (by - 26);
      var p = svgEl('path', { d: path, fill: 'none', stroke: BP, 'stroke-width': '1.8', 'stroke-dasharray': '300', 'stroke-dashoffset': '300' });
      p.appendChild(anim('stroke-dashoffset', '300;300;0;0', 6, { begin: (i * 0.8).toFixed(2), keyTimes: '0;0.2;0.7;1' }));
      svg.appendChild(p);
      var dir = d > h ? -6 : 6;
      svg.appendChild((function () { var ar = svgEl('path', { d: 'M ' + d + ' ' + (by - 26) + ' l ' + dir + ' -6 l ' + (-dir) + ' 0 z', fill: BP, opacity: '0' }); ar.appendChild(anim('opacity', '0;0;1;1', 6, { begin: (i * 0.8).toFixed(2), keyTimes: '0;0.6;0.72;1' })); return ar; })());
      var lab = txt(mid, top - 4, a[2], { 'text-anchor': 'middle', fill: SOFT, 'font-size': '10', opacity: '0' });
      lab.appendChild(anim('opacity', '0;0;1;1', 6, { begin: (i * 0.8).toFixed(2), keyTimes: '0;0.6;0.74;1' }));
      svg.appendChild(lab);
    });
    card(host, 'DEPENDENCY PARSE', '弧线自行绘制', svg,
      'dependency parsing 会从每个词向它的 head 绘制一条带标签的弧线。动词“奔跑”是 root；“猫”是它的主语，“正在”是它的助动词，而介词短语则依附于它。每条边都是一个 (head, dependent, relation) 三元组。');
  }

  // ── qa-span：答案 span 在段落中扫过并高亮显示 ───────────────────────────────
  function qaSpan(host) {
    var W = 520, H = 210, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(txt(20, 26, '问题：第一代 iPhone 何时发布？', { fill: SOFT, 'font-size': '12' }));
    var lines = ['第一代 iPhone 于 2007 年 1 月发布，', '并于 2007 年 6 月 29 日正式发售，', '现场排起了长队。'];
    var hy = [70, 96, 122];
    lines.forEach(function (l, i) { svg.appendChild(txt(24, hy[i], l, { 'font-family': 'var(--font-body,serif)', 'font-size': '15', fill: INK })); });
    var hl = svgEl('rect', { x: 24, y: hy[2] - 14, width: 0, height: 20, fill: BP, opacity: '0.22', rx: 2 });
    hl.appendChild(anim('x', '120;120;24;24', 5, { keyTimes: '0;0.35;0.6;1', calcMode: 'spline', keySplines: '0 0 1 1;.3 0 .2 1;1 1 1 1' }));
    hl.appendChild(anim('width', '0;0;128;128', 5, { keyTimes: '0;0.35;0.6;1', calcMode: 'spline', keySplines: '0 0 1 1;.3 0 .2 1;1 1 1 1' }));
    svg.appendChild(hl);
    var sx = svgEl('circle', { cx: 24, cy: hy[2] + 14, r: '4', fill: WARN });
    sx.appendChild(anim('cx', '24;24;24;152;152', 5, { keyTimes: '0;0.35;0.5;0.6;1' }));
    sx.appendChild(anim('opacity', '0;0;1;1;1', 5, { keyTimes: '0;0.35;0.5;0.6;1' }));
    svg.appendChild(sx);
    var ans = txt(24, 178, '答案：“2007 年 6 月 29 日”', { fill: BP, 'font-size': '13', opacity: '0' });
    ans.appendChild(anim('opacity', '0;0;1;1', 5, { keyTimes: '0;0.6;0.7;1' }));
    svg.appendChild(ans);
    svg.appendChild(svgEl('line', { x1: 20, y1: 40, x2: 500, y2: 40, stroke: RULE, 'stroke-width': '1' }));
    card(host, 'EXTRACTIVE QA', '段落中的 span 被高亮显示', svg,
      'Extractive QA 从不编造答案。两个 head 分别预测给定段落中某个 span 的起始和结束 Token；Model 扫描文本，并高亮显示二者之间连续的 Token 序列。答案会被逐字提取，因此不会产生 hallucination。');
  }

  // ── summarize-collapse：长条收缩为较短的摘要条 ──────────────────────────────
  function summarizeCollapse(host) {
    var W = 520, H = 220, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(txt(20, 24, '文档', { fill: SOFT, 'font-size': '11' }));
    var dy = 36, lh = 13, full = [];
    for (var i = 0; i < 9; i++) {
      var w = 360 - (i % 3) * 40 - (i % 2) * 30;
      var r = svgEl('rect', { x: 24, y: dy + i * lh, width: w, height: 7, rx: 2, fill: i === 1 || i === 4 || i === 7 ? BP : RULE });
      if (i === 1 || i === 4 || i === 7) full.push(r);
      svg.appendChild(r);
    }
    svg.appendChild(txt(20, 178, '摘要', { fill: SOFT, 'font-size': '11' }));
    var sy = 190;
    [0, 1, 2].forEach(function (j) {
      var src = full[j], y0 = Number(src.getAttribute('y')), w = Number(src.getAttribute('width'));
      var clone = svgEl('rect', { x: 24, y: y0, width: w, height: 7, rx: 2, fill: BP, opacity: '0' });
      var ty = sy + j * 11;
      clone.appendChild(anim('opacity', '0;0;1;1', 5, { begin: (j * 0.4).toFixed(2), keyTimes: '0;0.3;0.45;1' }));
      clone.appendChild(anim('y', y0 + ';' + y0 + ';' + ty + ';' + ty, 5, { begin: (j * 0.4).toFixed(2), keyTimes: '0;0.3;0.7;1', calcMode: 'spline', keySplines: '0 0 1 1;.4 0 .2 1;1 1 1 1' }));
      clone.appendChild(anim('width', w + ';' + w + ';' + (w * 0.55) + ';' + (w * 0.55), 5, { begin: (j * 0.4).toFixed(2), keyTimes: '0;0.3;0.7;1' }));
      svg.appendChild(clone);
    });
    card(host, 'SUMMARIZATION', '长条收缩为短条', svg,
      'Extractive summarization 会对每个句子进行排序，并按原有顺序提取少数最核心的句子。长文档会收缩为几行原文。Abstractive 系统则会改写内容；它们读起来流畅，但可能编造来源中从未陈述的事实。');
  }

  // ── topic-drift：散落的词语漂移到不同颜色的 topic cluster 中 ────────────────
  function topicDrift(host) {
    var W = 520, H = 230, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var clusters = [[130, 150], [300, 90], [410, 175]];
    var labels = ['体育', '金融', '旅行'];
    clusters.forEach(function (c, i) {
      svg.appendChild(svgEl('circle', { cx: c[0], cy: c[1], r: '54', fill: BP, opacity: i === 0 ? '0.06' : '0.06', stroke: RULE, 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var lab = txt(c[0], c[1] - 62, labels[i], { 'text-anchor': 'middle', fill: SOFT, 'font-size': '11', opacity: '0' });
      lab.appendChild(anim('opacity', '0;0;1', 7, { keyTimes: '0;0.6;0.8' }));
      svg.appendChild(lab);
    });
    var words = ['进球', '球队', '比分', '股票', '债券', '收益率', '航班', '酒店', '签证'];
    words.forEach(function (w, i) {
      var c = clusters[Math.floor(i / 3)];
      var ang = (i % 3) / 3 * 6.28, tx = c[0] + Math.cos(ang) * 28, ty = c[1] + Math.sin(ang) * 28;
      var sx = 40 + (i * 53) % 440, sy = 200 + (i % 2) * 14;
      var t = txt(sx, sy, w, { 'font-family': 'var(--font-body,serif)', 'font-size': '13', fill: i % 3 === 0 ? BP : INK });
      t.appendChild(animT('translate', '0 0;0 0;' + (tx - sx) + ' ' + (ty - sy), 7, { begin: ((i % 3) * 0.3).toFixed(2), keyTimes: '0;0.3;0.85', calcMode: 'spline', keySplines: '0 0 1 1;.35 0 .25 1' }));
      svg.appendChild(t);
    });
    card(host, 'TOPIC MODELING', '词语漂移到不同 cluster 中', svg,
      'Unsupervised topic modeling 不需要 Label。散落的词汇会依据共现关系或 Embedding 相似度聚集成少数几个连贯的 group；通过读取每个 cluster 中排名靠前的词，可以识别语料库“讨论”的 latent topic。');
  }

  // ── coref-links：代词 mention 以动画方式链接回同一个 entity ────────────────
  function corefLinks(host) {
    var W = 520, H = 210, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ment = [['Tim Cook', 40, 60, true], ['他', 230, 60, false], ['这位 CEO', 330, 130, false], ['Cook', 130, 150, false]];
    var anchor = ment[0];
    ment.forEach(function (m) {
      var w = m[0].length * 8 + 18;
      svg.appendChild(svgEl('rect', { x: m[1], y: m[2] - 16, width: w, height: 24, rx: 4, fill: m[3] ? BP : 'none', stroke: m[3] ? BP : RULE, 'stroke-width': '1.5' }));
      svg.appendChild(txt(m[1] + w / 2, m[2], m[0], { 'text-anchor': 'middle', 'font-size': '12', fill: m[3] ? 'var(--bg,#fff)' : INK }));
    });
    var ax = anchor[1] + (anchor[0].length * 8 + 18) / 2, ay = anchor[2];
    ment.forEach(function (m, i) {
      if (m[3]) return;
      var w = m[0].length * 8 + 18, mx = m[1] + w / 2, my = m[2];
      var d = 'M ' + mx + ' ' + my + ' Q ' + ((mx + ax) / 2) + ' ' + ((my + ay) / 2 - 36) + ' ' + ax + ' ' + ay;
      var p = svgEl('path', { d: d, fill: 'none', stroke: BP, 'stroke-width': '1.5', 'stroke-dasharray': '260', 'stroke-dashoffset': '260', opacity: '0.8' });
      p.appendChild(anim('stroke-dashoffset', '260;260;0;0', 6, { begin: (i * 0.7).toFixed(2), keyTimes: '0;0.15;0.65;1' }));
      svg.appendChild(p);
    });
    card(host, 'COREFERENCE', '多个 mention 链接到同一个 entity', svg,
      '“他”“这位 CEO”“Cook”这三种表层形式都指向同一个人。Coreference resolution 会从每个 mention 向同一个 cluster 绘制链接，使下游 NER、QA 和 knowledge graph 将它们视为单个 entity。');
  }

  // ── nli-router：premise/hypothesis 对被路由到三个 Label 之一 ────────────────
  function nliRouter(host) {
    var W = 520, H = 230, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(txt(20, 30, 't：猫在垫子上', { 'font-family': 'var(--font-body,serif)', 'font-size': '14', fill: INK }));
    svg.appendChild(txt(20, 54, 'h：有一只猫', { 'font-family': 'var(--font-body,serif)', 'font-size': '14', fill: SOFT }));
    var hub = { x: 150, y: 110 };
    svg.appendChild(svgEl('circle', { cx: hub.x, cy: hub.y, r: '22', fill: 'none', stroke: BP, 'stroke-width': '1.8' }));
    svg.appendChild(txt(hub.x, hub.y + 4, 'NLI', { 'text-anchor': 'middle', fill: BP, 'font-size': '11' }));
    var labs = [['entailment', 70], ['neutral', 130], ['contradiction', 190]];
    labs.forEach(function (l, i) {
      var ex = 420, ey = l[1];
      svg.appendChild(svgEl('path', { d: 'M ' + (hub.x + 22) + ' ' + hub.y + ' L ' + (ex - 8) + ' ' + ey, fill: 'none', stroke: RULE, 'stroke-width': '1' }));
      var box = svgEl('rect', { x: ex - 6, y: ey - 15, width: 96, height: 26, rx: 4, fill: i === 0 ? BP : RULE, stroke: i === 0 ? BP : RULE, 'stroke-width': '1.5' });
      svg.appendChild(box);
      var over = svgEl('rect', { x: ex - 6, y: ey - 15, width: 96, height: 26, rx: 4, fill: i === 0 ? RULE : BP, 'fill-opacity': '0' });
      over.appendChild(anim('fill-opacity', i === 0 ? '0;0;1;1;0' : '0;0;1;0;0', 6, { begin: '0', keyTimes: i === 0 ? '0;0.5;0.55;0.95;1' : '0;' + (0.5 + i * 0.005) + ';0.55;0.6;1' }));
      svg.appendChild(over);
      svg.appendChild(txt(ex + 42, ey + 3, l[0], { 'text-anchor': 'middle', 'font-size': '11', fill: INK }));
    });
    var pulse = svgEl('circle', { cx: hub.x + 22, cy: hub.y, r: '4', fill: WARN });
    pulse.appendChild(anim('cx', (hub.x + 22) + ';420', 1.6, { repeatCount: 'indefinite' }));
    pulse.appendChild(anim('cy', hub.y + ';70', 1.6, { repeatCount: 'indefinite' }));
    pulse.appendChild(anim('opacity', '1;1;0', 1.6, { repeatCount: 'indefinite', keyTimes: '0;0.7;1' }));
    svg.appendChild(pulse);
    card(host, 'NATURAL LANGUAGE INFERENCE', '文本对被路由到一个 Label', svg,
      'NLI 接收一个 premise t 和一个 hypothesis h，并将这对输入准确路由到三个 Label 之一：entailment、neutral 或 contradiction。同一种 classifier 可用于 hallucination 检查、grounded-QA 验证和 zero-shot 标注。');
  }

  // ── relation-triples：文本 span 对齐为 (subject,relation,object) graph ───────
  function relationTriples(host) {
    var W = 520, H = 230, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(txt(20, 28, '“Tim Cook 成为 Apple 的 CEO。”', { 'font-family': 'var(--font-body,serif)', 'font-size': '14', fill: INK }));
    var subj = { x: 70, y: 150, w: 80, s: 'Tim Cook' };
    var obj = { x: 360, y: 150, w: 70, s: 'Apple' };
    [subj, obj].forEach(function (n) {
      svg.appendChild(svgEl('ellipse', { cx: n.x + n.w / 2, cy: n.y, rx: n.w / 2 + 8, ry: 22, fill: 'none', stroke: BP, 'stroke-width': '1.8' }));
      svg.appendChild(txt(n.x + n.w / 2, n.y + 4, n.s, { 'text-anchor': 'middle', 'font-size': '12', fill: INK }));
    });
    var x1 = subj.x + subj.w + 10, x2 = obj.x - 12, my = subj.y;
    var edge = svgEl('line', { x1: x1, y1: my, x2: x1, y2: my, stroke: BP, 'stroke-width': '1.8' });
    edge.appendChild(anim('x2', x1 + ';' + x1 + ';' + x2, 5, { keyTimes: '0;0.3;0.75', calcMode: 'spline', keySplines: '0 0 1 1;.4 0 .2 1' }));
    svg.appendChild(edge);
    var arr = svgEl('path', { d: 'M ' + x2 + ' ' + my + ' l -8 -5 l 0 10 z', fill: BP, opacity: '0' });
    arr.appendChild(anim('opacity', '0;0;1', 5, { keyTimes: '0;0.75;0.82' }));
    svg.appendChild(arr);
    var rel = svgEl('g', {}, [txt((x1 + x2) / 2, my - 14, 'employer', { 'text-anchor': 'middle', fill: SOFT, 'font-size': '11', opacity: '0' })]);
    rel.childNodes[0].appendChild(anim('opacity', '0;0;1', 5, { keyTimes: '0;0.78;0.9' }));
    svg.appendChild(rel);
    [[subj.x + subj.w / 2, 'Tim Cook', 90], [obj.x + obj.w / 2, 'Apple', 380]].forEach(function (m, i) {
      var hl = svgEl('rect', { x: m[2] - 4, y: 16, width: m[1].length * 8 + 8, height: 18, rx: 2, fill: BP, opacity: '0' });
      hl.appendChild(anim('opacity', '0;0;0.2;0.2;0', 5, { begin: (i * 0.5).toFixed(2), keyTimes: '0;0.05;0.2;0.4;0.55' }));
      svg.appendChild(hl);
    });
    card(host, 'RELATION EXTRACTION', '文本 → (subject, relation, object)', svg,
      'Relation extraction 会将文本中的 entity span 作为锚点，然后将它们对齐为带类型的 edge。“Tim Cook”和“Apple”成为 node；动词短语成为二者之间带 Label 的 edge。汇总这些 triple，即可得到 knowledge graph。');
  }

  // ── constrained-decoder：每一步都将无效 Token mask 为 -inf ────────────────
  function constrainedDecoder(host) {
    var W = 520, H = 250, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(txt(20, 26, '已输出：{ "ok":', { 'font-family': MONO, 'font-size': '13', fill: INK }));
    svg.appendChild(txt(20, 50, 'grammar 需要 boolean → mask 其他所有内容', { 'font-size': '10', fill: SOFT }));
    var cand = [['true', true], ['false', true], ['"yes"', false], ['42', false], ['null', false], ['[', false]];
    var bx = 30, by = 80, bw = 70, bh = 22, gap = 8;
    cand.forEach(function (c, i) {
      var x = bx + (i % 3) * (bw + 40), y = by + Math.floor(i / 3) * (bh + 22);
      var bar = svgEl('rect', { x: x, y: y, width: bw, height: bh, rx: 2, fill: c[1] ? BP : MUTE });
      bar.appendChild(anim('opacity', c[1] ? '1' : '1;1;0.18;0.18', 4, c[1] ? {} : { keyTimes: '0;0.3;0.55;1' }));
      bar.appendChild(anim('width', c[1] ? bw + ';' + bw : bw + ';' + bw + ';6;6', 4, c[1] ? {} : { keyTimes: '0;0.3;0.6;1', calcMode: 'spline', keySplines: '0 0 1 1;.4 0 .2 1;1 1 1 1' }));
      svg.appendChild(bar);
      svg.appendChild(txt(x, y - 4, c[0], { 'font-family': MONO, 'font-size': '11', fill: c[1] ? INK : SOFT }));
      if (!c[1]) {
        var m = txt(x + bw / 2, y + 15, '-inf', { 'text-anchor': 'middle', fill: WARN, 'font-size': '10', opacity: '0' });
        m.appendChild(anim('opacity', '0;0;1', 4, { keyTimes: '0;0.6;0.75' }));
        svg.appendChild(m);
      }
    });
    var out = txt(30, 230, '从有效集合中采样 → "true"', { 'font-family': MONO, 'font-size': '12', fill: BP, opacity: '0' });
    out.appendChild(anim('opacity', '0;0;1;1', 4, { keyTimes: '0;0.7;0.85;1' }));
    svg.appendChild(out);
    card(host, 'CONSTRAINED DECODING', '无效 Token 被 mask 为 −∞', svg,
      'logit processor 位于 Model 与 sampler 之间。在每一步中，它都会询问 grammar 哪些 Token 合法，并将每个无效 logit 设置为负无穷。随后 softmax 只会为有效的 continuation 分配概率质量，因此输出在构造时就能保证结构正确。');
  }

  LF.register({
    'pos-tagger': posTagger,
    'dependency-arcs': depArcs,
    'qa-span': qaSpan,
    'summarize-collapse': summarizeCollapse,
    'topic-drift': topicDrift,
    'coref-links': corefLinks,
    'nli-router': nliRouter,
    'relation-triples': relationTriples,
    'constrained-decoder': constrainedDecoder
  });
})();
