/* figures-autoswarm5.js - 为 Phase 15（自主系统）和 Phase 16
   （多 Agent 与群体）提供支持主题切换的动画图示，第五个模块。
   在 lesson-figures.js 之后加载，通过 window.LF 注册。无依赖，
   仅使用 ES5、SMIL 动画，并通过 CSS 变量适配主题。编写方式：使用一个 ```figure
   块，并指定下方某个组件的名称。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function shell(host, label, hint, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function txt(x, y, s, size, fill, anchor) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': anchor || 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': size || '10', fill: fill || 'var(--ink-mute,#777)' });
    t.appendChild(document.createTextNode(s));
    return t;
  }
  function anim(attr, vals, kt, dur, opts) {
    var a = { attributeName: attr, values: vals, keyTimes: kt, dur: dur + 's', repeatCount: 'indefinite' };
    if (opts) for (var k in opts) a[k] = opts[k];
    return svgEl('animate', a);
  }
  function motion(path, kp, kt, dur, begin) {
    return svgEl('animateMotion', { path: path, keyPoints: kp, keyTimes: kt, dur: dur + 's', begin: (begin || 0) + 's', repeatCount: 'indefinite', calcMode: 'linear' });
  }
  function f2(x) { return x.toFixed(3); }
  var EASE = '0.23 1 0.32 1';
  var LIN = '0 0 1 1';
  // 进入：在 lo 之前保持隐藏，通过样条缓动在 lo+rise 时完全显示，保持到 hi，
  // 在 hi+drop 时退出（让 drop < rise，使退出效果比进入更快）
  function appear(node, lo, rise, hi, drop, period) {
    var kt = '0;' + f2(lo) + ';' + f2(lo + rise) + ';' + f2(hi) + ';' + f2(hi + drop) + ';1';
    node.appendChild(svgEl('animate', {
      attributeName: 'opacity', values: '0;0;1;1;0;0', keyTimes: kt, dur: period + 's',
      repeatCount: 'indefinite', calcMode: 'spline',
      keySplines: LIN + ';' + EASE + ';' + LIN + ';' + LIN + ';' + LIN
    }));
  }
  // 标量属性在循环内使用相同缓动从 from 增长到 to
  function grow(node, attr, from, to, lo, rise, period) {
    var kt = '0;' + f2(lo) + ';' + f2(lo + rise) + ';1';
    node.appendChild(svgEl('animate', {
      attributeName: attr, values: from + ';' + from + ';' + to + ';' + to, keyTimes: kt,
      dur: period + 's', repeatCount: 'indefinite', calcMode: 'spline',
      keySplines: LIN + ';' + EASE + ';' + LIN
    }));
  }

  var BP = 'var(--blueprint,#3553ff)';
  var WARN = 'var(--warn,#b8870f)';
  var SOFT = 'var(--rule-soft,#ddd)';
  var SURF = 'var(--bg-surface,#eee)';
  var MUTE = 'var(--ink-mute,#777)';

  // ── a5-scaffold-delta：一个 Model 接入两个 scaffold；在权重相同的情况下，
  //    得分条最终相差 16.6 分 ──────────────────────────────────────────────
  function scaffoldDelta(host) {
    var W = 520, H = 250, period = 6;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var mx = 62, my = 122, sx = 205, sy = [72, 172], i;
    var names = ['SWE-agent v1', 'Cline autonomous'];
    var pct = ['43.2%', '59.8%'];
    var bw = [78, 108];
    for (i = 0; i < 2; i++) {
      svg.appendChild(svgEl('line', { x1: mx + 24, y1: my, x2: sx - 52, y2: sy[i], stroke: SOFT, 'stroke-width': '1.2' }));
    }
    for (i = 0; i < 2; i++) {
      var pkt = svgEl('circle', { r: '4', fill: BP });
      appear(pkt, 0.02 + i * 0.05, 0.04, 0.2 + i * 0.05, 0.03, period);
      pkt.appendChild(motion('M' + (mx + 24) + ',' + my + ' L' + (sx - 52) + ',' + sy[i], '0;0;1;1', '0;' + f2(0.02 + i * 0.05) + ';' + f2(0.24 + i * 0.05) + ';1', period));
      svg.appendChild(pkt);
    }
    svg.appendChild(svgEl('circle', { cx: mx, cy: my, r: '24', stroke: BP, 'stroke-width': '2', fill: SURF }));
    svg.appendChild(txt(mx, my - 2, '同一', '8', BP));
    svg.appendChild(txt(mx, my + 10, 'Model', '8', BP));
    for (i = 0; i < 2; i++) {
      svg.appendChild(svgEl('rect', { x: sx - 52, y: sy[i] - 18, width: 104, height: 36, fill: SURF, stroke: (i ? WARN : MUTE), 'stroke-width': '2', rx: '3' }));
      svg.appendChild(txt(sx, sy[i] + 3, names[i], '8', i ? WARN : MUTE));
      svg.appendChild(svgEl('rect', { x: 290, y: sy[i] - 6, width: 180, height: 12, fill: SURF, stroke: SOFT, 'stroke-width': '1' }));
      var fill = svgEl('rect', { x: 290, y: sy[i] - 6, width: 0, height: 12, fill: i ? WARN : MUTE });
      grow(fill, 'width', 0, bw[i], 0.3 + i * 0.1, 0.2, period);
      svg.appendChild(fill);
      var lab = txt(290 + bw[i] + 6, sy[i] + 3, pct[i], '9', i ? WARN : MUTE, 'start');
      appear(lab, 0.5 + i * 0.1, 0.08, 0.94, 0.04, period);
      svg.appendChild(lab);
    }
    var delta = txt(380, 126, '+16.6 分，权重相同', '9', BP);
    appear(delta, 0.7, 0.1, 0.93, 0.05, period);
    svg.appendChild(delta);
    svg.appendChild(txt(W / 2, H - 12, '一个 Model，两个 scaffold  ·  Model 周围的循环承担着关键作用', '9', MUTE));
    shell(host, 'SCAFFOLD 差异', '权重相同，循环不同', svg,
      'Claude Sonnet 4.5 在 SWE-agent v1 内部的 SWE-bench Verified 得分为 43.2%，在 Cline autonomous scaffold 内部则为 59.8%。权重相同，得分相差 16.6 分。围绕 Model 的检索层、规划器、sandbox 和编辑-验证循环，如今与 Model 本身同等重要。');
  }

  // ── a5-guard-sieve：Prompt 通过输入分类器，响应通过输出分类器；
  //    一次攻击被拦截，而一次利用 emoji 夹带的攻击成功溜过 ──
  function guardSieve(host) {
    var W = 520, H = 230, period = 7, y = 100;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('line', { x1: 30, y1: y, x2: 490, y2: y, stroke: SOFT, 'stroke-width': '1.2' }));
    svg.appendChild(svgEl('rect', { x: 235, y: y - 24, width: 76, height: 48, fill: SURF, stroke: MUTE, 'stroke-width': '2', rx: '3' }));
    svg.appendChild(txt(273, y + 4, 'Model', '10', MUTE));
    var gx = [160, 372], glab = ['输入 guard', '输出 guard'], i;
    for (i = 0; i < 2; i++) {
      var g = svgEl('rect', { x: gx[i] - 9, y: y - 38, width: 18, height: 76, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' });
      if (i === 0) g.appendChild(anim('stroke', BP + ';' + BP + ';' + WARN + ';' + WARN + ';' + BP + ';' + BP, '0;0.4;0.43;0.52;0.56;1', period));
      svg.appendChild(g);
      svg.appendChild(txt(gx[i], y - 46, glab[i], '8', BP));
      svg.appendChild(txt(gx[i], y + 52, 'S1-S14', '7', MUTE));
    }
    var safe = svgEl('circle', { r: '4.5', fill: BP });
    appear(safe, 0.02, 0.04, 0.3, 0.03, period);
    safe.appendChild(motion('M38,' + y + ' L482,' + y, '0;0;1;1', '0;0.02;0.32;1', period));
    svg.appendChild(safe);
    var bad = svgEl('rect', { x: -4.5, y: -4.5, width: 9, height: 9, fill: WARN, rx: '2' });
    var bg = svgEl('g', {});
    bg.appendChild(bad);
    appear(bg, 0.36, 0.03, 0.5, 0.03, period);
    bg.appendChild(motion('M38,' + y + ' L' + gx[0] + ',' + y + ' L' + gx[0] + ',' + (y + 58), '0;0;0.65;1;1', '0;0.36;0.44;0.52;1', period));
    svg.appendChild(bg);
    var blocked = txt(gx[0] + 34, y + 62, '已拦截', '8', WARN, 'start');
    appear(blocked, 0.45, 0.05, 0.56, 0.03, period);
    svg.appendChild(blocked);
    var smug = svgEl('circle', { r: '4.5', fill: 'none', stroke: MUTE, 'stroke-width': '1.6', 'stroke-dasharray': '2 2' });
    appear(smug, 0.6, 0.04, 0.93, 0.03, period);
    smug.appendChild(motion('M38,' + y + ' L482,' + y, '0;0;1;1', '0;0.6;0.94;1', period));
    svg.appendChild(smug);
    var slip = txt(440, y - 18, '夹带通过', '8', MUTE);
    appear(slip, 0.82, 0.06, 0.93, 0.03, period);
    svg.appendChild(slip);
    svg.appendChild(txt(W / 2, H - 12, '对输入分类，对输出分类  ·  字符级攻击仍能穿透', '9', MUTE));
    shell(host, 'GUARD 筛网', '输入分类，输出分类', svg,
      'Llama Guard 位于 Model 两侧，依据 MLCommons S1-S14 危害分类体系对输入和输出进行分类。明显的滥用行为可以低成本拦截。但 Huang 等人在 2025 年测得，emoji smuggling 对六种 guard 系统的攻击成功率均为 100%：分类器只是防护中的一层，而不是完整解决方案。');
  }

  // ── a5-rsp-ladder：能力仪表向 AI R&D-4 阈值上升，
  //    同时 v3.0 政策将承诺拆分为两个层级 ───────────────
  function rspLadder(host) {
    var W = 520, H = 250, period = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var gx = 100, top = 50, bot = 205;
    svg.appendChild(svgEl('rect', { x: gx - 17, y: top, width: 34, height: bot - top, fill: SURF, stroke: SOFT, 'stroke-width': '1.2' }));
    var fill = svgEl('rect', { x: gx - 17, y: bot, width: 34, height: 0, fill: BP, opacity: '0.55' });
    grow(fill, 'height', 0, 108, 0.05, 0.35, period);
    grow(fill, 'y', bot, bot - 108, 0.05, 0.35, period);
    svg.appendChild(fill);
    var th = svgEl('line', { x1: gx - 26, y1: 74, x2: gx + 26, y2: 74, stroke: WARN, 'stroke-width': '2', 'stroke-dasharray': '5 3' });
    th.appendChild(anim('opacity', '1;1;0.35;1;0.35;1;1', '0;0.45;0.52;0.6;0.68;0.76;1', period));
    svg.appendChild(th);
    svg.appendChild(txt(gx + 32, 78, 'AI R&D-4', '9', WARN, 'start'));
    var mark = txt(gx + 32, 101, '当前的 Opus 4.6', '8', BP, 'start');
    appear(mark, 0.42, 0.08, 0.95, 0.04, period);
    svg.appendChild(mark);
    svg.appendChild(txt(gx, bot + 16, '能力', '8', MUTE));
    var cx = 330;
    svg.appendChild(svgEl('rect', { x: cx - 80, y: 58, width: 160, height: 52, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' }));
    svg.appendChild(txt(cx, 78, '单方面行动', '9', BP));
    svg.appendChild(txt(cx, 94, 'Training + 部署门槛', '7', MUTE));
    svg.appendChild(svgEl('rect', { x: cx - 80, y: 122, width: 160, height: 52, fill: 'none', stroke: MUTE, 'stroke-width': '1.6', 'stroke-dasharray': '5 3', rx: '3' }));
    svg.appendChild(txt(cx, 142, '行业建议', '8', MUTE));
    svg.appendChild(txt(cx, 158, 'RAND SL-4 安全', '7', MUTE));
    var pg = svgEl('g', {});
    pg.appendChild(svgEl('rect', { x: cx - 58, y: 186, width: 116, height: 24, fill: SURF, stroke: MUTE, 'stroke-width': '1.4', rx: '3' }));
    pg.appendChild(txt(cx, 202, '暂停条款（v2）', '8', MUTE));
    pg.appendChild(svgEl('line', { x1: cx - 52, y1: 198, x2: cx + 52, y2: 198, stroke: WARN, 'stroke-width': '1.8' }));
    appear(pg, 0.55, 0.08, 0.82, 0.04, period);
    svg.appendChild(pg);
    var drop = txt(cx, 226, '已从 v3.0 中移除', '8', WARN);
    appear(drop, 0.66, 0.06, 0.94, 0.03, period);
    svg.appendChild(drop);
    svg.appendChild(txt(gx, 40, '仪表', '8', MUTE));
    svg.appendChild(txt(cx, 46, '双层承诺', '8', MUTE));
    shell(host, 'RSP v3.0', '仪表与阈值', svg,
      'RSP v3.0 将 AI R&D-4 定为下一个阈值：达到这一水平的 Model 能以有竞争力的成本自动化相当一部分 AI 研究。Claude Opus 4.6 目前仍低于该阈值，但 Anthropic 承认，要有把握地排除其达到该阈值的可能性正变得越来越困难。如今，承诺被拆分为单方面行动和行业建议，2023 年的暂停条款也已取消；SaferAI 将该政策的评分从 2.2 下调至 1.9。');
  }

  // ── a5-tracked-vs-research：同一种能力对应两条通道；Tracked
  //    通道要经过报告和审查门槛，而 Research 通道只受到监测 ─
  function trackedVsResearch(host) {
    var W = 520, H = 250, period = 7;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ty = 82, ry = 178;
    svg.appendChild(svgEl('line', { x1: 40, y1: ty, x2: 480, y2: ty, stroke: SOFT, 'stroke-width': '1.2' }));
    svg.appendChild(svgEl('line', { x1: 40, y1: ry, x2: 480, y2: ry, stroke: SOFT, 'stroke-width': '1.2' }));
    svg.appendChild(txt(42, ty - 30, 'TRACKED', '9', BP, 'start'));
    svg.appendChild(txt(42, ry - 30, 'RESEARCH', '9', MUTE, 'start'));
    svg.appendChild(svgEl('rect', { x: 162, y: ty - 20, width: 92, height: 40, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' }));
    svg.appendChild(txt(208, ty - 2, '能力 +', '8', BP));
    svg.appendChild(txt(208, ty + 10, '安全保障报告', '7', MUTE));
    svg.appendChild(svgEl('rect', { x: 292, y: ty - 20, width: 56, height: 40, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' }));
    svg.appendChild(txt(320, ty + 4, 'SAG', '9', BP));
    var gate = svgEl('line', { x1: 388, y1: ty - 18, x2: 388, y2: ty + 18, stroke: WARN, 'stroke-width': '3' });
    gate.appendChild(anim('opacity', '1;1;0;0;1', '0;0.5;0.56;0.94;1', period));
    svg.appendChild(gate);
    var open = txt(388, ty - 26, '门槛开放', '7', WARN);
    appear(open, 0.52, 0.05, 0.9, 0.04, period);
    svg.appendChild(open);
    var tc = svgEl('circle', { r: '5', fill: BP });
    appear(tc, 0.02, 0.04, 0.9, 0.04, period);
    tc.appendChild(motion('M48,' + ty + ' L472,' + ty, '0;0;0.34;0.34;0.6;0.6;1;1', '0;0.02;0.2;0.32;0.42;0.55;0.88;1', period));
    svg.appendChild(tc);
    svg.appendChild(svgEl('circle', { cx: 300, cy: ry, r: '13', fill: 'none', stroke: MUTE, 'stroke-width': '1.6' }));
    var eye = svgEl('circle', { cx: 300, cy: ry, r: '4', fill: MUTE });
    eye.appendChild(anim('r', '4;4;5.5;4;4', '0;0.5;0.58;0.66;1', period));
    svg.appendChild(eye);
    svg.appendChild(txt(300, ry + 28, '受监测', '7', MUTE));
    var rc = svgEl('circle', { r: '5', fill: MUTE });
    appear(rc, 0.38, 0.04, 0.9, 0.04, period);
    rc.appendChild(motion('M48,' + ry + ' L472,' + ry, '0;0;1;1', '0;0.38;0.88;1', period));
    svg.appendChild(rc);
    var nt = txt(420, ry - 12, '无自动触发', '7', MUTE);
    appear(nt, 0.72, 0.06, 0.92, 0.04, period);
    svg.appendChild(nt);
    svg.appendChild(txt(W / 2, H - 12, '同一种能力，两个类别  ·  所属通道决定它受门槛约束还是仅被监测', '8.5', MUTE));
    shell(host, 'TRACKED 与 RESEARCH', '门槛约束或监测', svg,
      'OpenAI Preparedness v2 将类别一分为二。Tracked Categories 会触发 Capabilities and Safeguards Reports，并在部署前由 Safety Advisory Group 审查。Research Categories 包括 Long-range Autonomy 和 Sandbagging，仅接受监测，并可能采用缓解措施。DeepMind FSF v3 也采取了同样的方法，将自主能力纳入其 ML R&D 和 Cyber 领域。');
  }

  // ── a5-horizon-fit：任务点分散在对数时间轴上，一条 logistic 曲线
  //    穿过这些点，50% 的交点标定时间范围 ─────────────────────────────
  function horizonFit(host) {
    var W = 520, H = 250, period = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('line', { x1: 70, y1: 195, x2: 470, y2: 195, stroke: MUTE, 'stroke-width': '1.4' }));
    svg.appendChild(svgEl('line', { x1: 70, y1: 195, x2: 70, y2: 40, stroke: MUTE, 'stroke-width': '1.4' }));
    svg.appendChild(txt(70, 212, '1 分钟', '8', MUTE));
    svg.appendChild(txt(270, 212, '1 小时', '8', MUTE));
    svg.appendChild(txt(455, 212, '8 小时以上', '8', MUTE));
    svg.appendChild(txt(58, 58, '1.0', '8', MUTE, 'end'));
    svg.appendChild(txt(58, 125, '0.5', '8', MUTE, 'end'));
    svg.appendChild(txt(58, 196, '0.0', '8', MUTE, 'end'));
    svg.appendChild(txt(40, 32, 'P(成功)', '8', MUTE, 'start'));
    var dx = [95, 140, 185, 240, 300, 360, 430];
    var dy = [60, 66, 80, 108, 152, 172, 182];
    var ok = [1, 1, 1, 1, 0, 0, 0], i;
    for (i = 0; i < 7; i++) {
      var d = svgEl('circle', { cx: dx[i], cy: dy[i], r: '4.5', fill: ok[i] ? BP : 'none', stroke: ok[i] ? 'none' : MUTE, 'stroke-width': '1.6' });
      appear(d, 0.03 + i * 0.03, 0.04, 0.95, 0.04, period);
      d.appendChild(anim('r', '4.3;4.3;4.8;4.5;4.5', '0;' + f2(0.03 + i * 0.03) + ';' + f2(0.08 + i * 0.03) + ';' + f2(0.12 + i * 0.03) + ';1', period));
      svg.appendChild(d);
    }
    var curve = svgEl('path', {
      d: 'M80,56 C170,58 210,74 268,120 C320,162 380,180 460,184',
      fill: 'none', stroke: BP, 'stroke-width': '2', pathLength: '100',
      'stroke-dasharray': '100', 'stroke-dashoffset': '100'
    });
    curve.appendChild(svgEl('animate', {
      attributeName: 'stroke-dashoffset', values: '100;100;0;0', keyTimes: '0;0.28;0.55;1',
      dur: period + 's', repeatCount: 'indefinite', calcMode: 'spline',
      keySplines: LIN + ';' + EASE + ';' + LIN
    }));
    svg.appendChild(curve);
    var hl = svgEl('line', { x1: 70, y1: 121, x2: 270, y2: 121, stroke: WARN, 'stroke-width': '1.4', 'stroke-dasharray': '4 3' });
    appear(hl, 0.58, 0.06, 0.95, 0.04, period);
    svg.appendChild(hl);
    var vl = svgEl('line', { x1: 270, y1: 121, x2: 270, y2: 195, stroke: WARN, 'stroke-width': '1.4', 'stroke-dasharray': '4 3' });
    appear(vl, 0.64, 0.06, 0.95, 0.04, period);
    svg.appendChild(vl);
    var hp = svgEl('circle', { cx: 270, cy: 121, r: '5.5', fill: WARN });
    appear(hp, 0.62, 0.05, 0.95, 0.04, period);
    hp.appendChild(anim('r', '5.2;5.2;6;5.5;5.5', '0;0.62;0.68;0.74;1', period));
    svg.appendChild(hp);
    var lab = txt(282, 140, '时间范围', '9', WARN, 'start');
    appear(lab, 0.7, 0.06, 0.95, 0.04, period);
    svg.appendChild(lab);
    shell(host, '时间范围拟合', '穿过任务点的 logistic 曲线', svg,
      'METR 让一个 Model 执行 HCAST、RE-Bench 和 SWAA 中跨越专家数分钟至数小时工作量的任务，然后针对成功 Probability 与专家完成时间对数之间的关系拟合 logistic 曲线。50% 的交点就是时间范围。它是在没有现实后果的条件下测得的理想化上限，而不是部署预测。');
  }

  // ── a5-four-risks：CAIS 的四个象限依次亮起；组织风险持续高亮，
  //    因为这是从业者能够控制的风险 ───────────────────────────────────
  function fourRisks(host) {
    var W = 520, H = 250, period = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var qx = [113, 293], qy = [46, 128], names = ['恶意使用', 'AI 竞赛', '组织风险', '失控 AI'];
    var i;
    for (i = 0; i < 4; i++) {
      var x = qx[i % 2], y = qy[i < 2 ? 0 : 1];
      svg.appendChild(svgEl('rect', { x: x, y: y, width: 164, height: 70, fill: SURF, stroke: SOFT, 'stroke-width': '1.4', rx: '3' }));
      svg.appendChild(txt(x + 82, y + (i === 2 ? 22 : 40), names[i], '9', i === 2 ? WARN : 'var(--ink-soft,#555)'));
      var hi = svgEl('rect', { x: x, y: y, width: 164, height: 70, fill: 'none', stroke: i === 2 ? WARN : BP, 'stroke-width': '2.5', rx: '3' });
      if (i === 2) appear(hi, 0.28, 0.06, 0.94, 0.04, period);
      else appear(hi, 0.04 + i * 0.12, 0.05, 0.14 + i * 0.12, 0.03, period);
      svg.appendChild(hi);
    }
    var chips = ['安全文化', '严格审计', '信息安全'];
    for (i = 0; i < 3; i++) {
      var c = txt(qx[0] + 82, qy[1] + 38 + i * 13, chips[i], '7.5', MUTE);
      appear(c, 0.48 + i * 0.05, 0.06, 0.93, 0.04, period);
      svg.appendChild(c);
    }
    svg.appendChild(txt(W / 2, H - 24, '四类社会规模风险  ·  其中一类处于你的控制之下', '9', MUTE));
    shell(host, '四类风险', 'CAIS 分类体系', svg,
      'CAIS 框架将灾难性 AI 风险分为恶意使用、AI 竞赛、组织风险和失控 AI。这些类别彼此重叠：如果一家实验室在竞赛中为追求速度而牺牲审计，并发布了失控 AI，那么它会同时属于全部四类。组织风险是从业者真正能够采取行动的象限，因此它会持续高亮。');
  }

  // ── a5-primitive-radar：Agent、handoff、shared state、orchestrator 构成四条
  //    轴线；每个框架都在同一雷达图上形成不同形状 ───────────────────────
  function primitiveRadar(host) {
    var W = 520, H = 260, period = 9;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var cx = 260, cy = 122;
    svg.appendChild(svgEl('line', { x1: cx, y1: cy - 82, x2: cx, y2: cy + 82, stroke: SOFT, 'stroke-width': '1.2' }));
    svg.appendChild(svgEl('line', { x1: cx - 145, y1: cy, x2: cx + 145, y2: cy, stroke: SOFT, 'stroke-width': '1.2' }));
    svg.appendChild(txt(cx, cy - 90, 'Agent', '9', MUTE));
    svg.appendChild(txt(cx + 152, cy + 3, 'handoff', '9', MUTE, 'start'));
    svg.appendChild(txt(cx, cy + 98, 'shared state', '9', MUTE));
    svg.appendChild(txt(cx - 152, cy + 3, 'orchestrator', '9', MUTE, 'end'));
    function pts(t) {
      return cx + ',' + (cy - 82 * t[0]) + ' ' + (cx + 145 * t[1]) + ',' + cy + ' ' +
        cx + ',' + (cy + 82 * t[2]) + ' ' + (cx - 145 * t[3]) + ',' + cy;
    }
    var shapes = [
      { n: 'OpenAI Swarm', t: [0.9, 0.9, 0.22, 0.18], c: BP },
      { n: 'LangGraph', t: [0.5, 0.6, 0.9, 0.95], c: WARN },
      { n: 'CrewAI', t: [0.85, 0.4, 0.5, 0.75], c: MUTE }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var poly = svgEl('polygon', { points: pts(shapes[i].t), fill: 'none', stroke: shapes[i].c, 'stroke-width': '2' });
      appear(poly, 0.02 + i * 0.33, 0.06, 0.27 + i * 0.33, 0.03, period);
      svg.appendChild(poly);
      var nm = txt(cx, H - 22, shapes[i].n, '10', shapes[i].c);
      appear(nm, 0.02 + i * 0.33, 0.06, 0.27 + i * 0.33, 0.03, period);
      svg.appendChild(nm);
    }
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '3.5', fill: 'var(--ink,#1a1a1a)' }));
    shell(host, '原语雷达图', '每个框架，共用四条轴线', svg,
      'Agent、handoff、shared state、orchestrator：四种原语覆盖了整个设计空间。OpenAI Swarm 侧重 Agent 与 handoff，并将状态交给调用方管理。LangGraph 将重点放在 StateGraph 和确定性图 orchestrator 上。CrewAI 侧重角色定义丰富的 Agent，并配合 manager process。每次发布新框架，都只是在同一张雷达图上增加一种新形状。');
  }

  // ── a5-og-narrator：单独使用 LLM 时只能达成少量交易；将确定性的
  //    报价生成器与 LLM 叙述器分离后，交易达成率提升到三倍以上 ─────────
  function ogNarrator(host) {
    var W = 520, H = 250, period = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var y1 = 70, y2 = 165;
    svg.appendChild(txt(42, y1 - 32, '仅使用 LLM', '8', MUTE, 'start'));
    svg.appendChild(svgEl('line', { x1: 40, y1: y1, x2: 330, y2: y1, stroke: SOFT, 'stroke-width': '1.2' }));
    svg.appendChild(svgEl('rect', { x: 140, y: y1 - 18, width: 100, height: 36, fill: SURF, stroke: MUTE, 'stroke-width': '2', rx: '3' }));
    svg.appendChild(txt(190, y1 - 2, 'LLM 决策', '8', MUTE));
    svg.appendChild(txt(190, y1 + 10, '并进行叙述', '7', MUTE));
    var p1 = svgEl('circle', { r: '4.5', fill: MUTE });
    appear(p1, 0.02, 0.04, 0.32, 0.03, period);
    p1.appendChild(motion('M46,' + y1 + ' L324,' + y1, '0;0;1;1', '0;0.02;0.33;1', period));
    svg.appendChild(p1);
    svg.appendChild(txt(42, y2 - 32, 'OG-NARRATOR', '8', BP, 'start'));
    svg.appendChild(svgEl('line', { x1: 40, y1: y2, x2: 330, y2: y2, stroke: SOFT, 'stroke-width': '1.2' }));
    svg.appendChild(svgEl('rect', { x: 96, y: y2 - 18, width: 88, height: 36, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' }));
    svg.appendChild(txt(140, y2 - 2, '报价生成器', '7.5', BP));
    svg.appendChild(txt(140, y2 + 10, '确定性', '7', MUTE));
    svg.appendChild(svgEl('rect', { x: 208, y: y2 - 18, width: 88, height: 36, fill: SURF, stroke: WARN, 'stroke-width': '2', rx: '3' }));
    svg.appendChild(txt(252, y2 - 2, 'LLM 叙述器', '7.5', WARN));
    svg.appendChild(txt(252, y2 + 10, '仅负责措辞', '7', MUTE));
    var p2 = svgEl('circle', { r: '4.5', fill: BP });
    appear(p2, 0.4, 0.04, 0.78, 0.03, period);
    p2.appendChild(motion('M46,' + y2 + ' L324,' + y2, '0;0;0.33;0.33;0.72;0.72;1;1', '0;0.4;0.5;0.55;0.62;0.67;0.76;1', period));
    svg.appendChild(p2);
    svg.appendChild(svgEl('rect', { x: 360, y: y1 - 7, width: 110, height: 14, fill: SURF, stroke: SOFT, 'stroke-width': '1' }));
    var b1 = svgEl('rect', { x: 360, y: y1 - 7, width: 0, height: 14, fill: MUTE });
    grow(b1, 'width', 0, 29, 0.3, 0.14, period);
    svg.appendChild(b1);
    svg.appendChild(txt(415, y1 + 24, '26.7% 达成', '8', MUTE));
    svg.appendChild(svgEl('rect', { x: 360, y: y2 - 7, width: 110, height: 14, fill: SURF, stroke: SOFT, 'stroke-width': '1' }));
    var b2 = svgEl('rect', { x: 360, y: y2 - 7, width: 0, height: 14, fill: BP });
    grow(b2, 'width', 0, 98, 0.76, 0.16, period);
    svg.appendChild(b2);
    svg.appendChild(txt(415, y2 + 24, '88.9% 达成', '8', BP));
    svg.appendChild(txt(W / 2, H - 12, '先决定数字，再进行叙述  ·  将机制与语言解耦即可胜出', '8.5', MUTE));
    shell(host, 'OG-NARRATOR', '先数字，后措辞', svg,
      'LLMs 会将决定报价与叙述报价混为一体，在参数严格限定的议价中只能达成 26.7% 的交易；扩大规模也无法解决这一问题。OG-Narrator 将两者拆分：确定性的报价生成器计算每一次数值变动，LLM 只负责撰写配套消息。交易达成率跃升至 88.9%，这与 Contract Net 相呼应：让机制与通信层保持分离。');
  }

  // ── a5-memory-reflection：观察结果堆叠成信息流，一次 reflection
  //    从中综合信息，并作为一条可再次检索的新记忆回写到信息流中 ───────
  function memoryReflection(host) {
    var W = 520, H = 250, period = 9;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var sx = 70, ey = [196, 170, 144, 118, 92], i;
    svg.appendChild(txt(sx + 60, 44, '记忆流', '8', MUTE));
    for (i = 0; i < 5; i++) {
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: sx, y: ey[i], width: 120, height: 20, fill: SURF, stroke: SOFT, 'stroke-width': '1.2', rx: '2' }));
      g.appendChild(txt(sx + 60, ey[i] + 13, '观察结果', '7.5', 'var(--ink-soft,#555)'));
      appear(g, 0.03 + i * 0.055, 0.05, 0.96, 0.03, period);
      svg.appendChild(g);
    }
    var rx = 350, ry = 105;
    for (i = 2; i < 5; i++) {
      var ln = svgEl('line', { x1: sx + 120, y1: ey[i] + 10, x2: rx - 56, y2: ry, stroke: BP, 'stroke-width': '1.2', 'stroke-dasharray': '3 3' });
      appear(ln, 0.38 + (i - 2) * 0.03, 0.05, 0.62, 0.03, period);
      svg.appendChild(ln);
    }
    var refl = svgEl('g', {});
    var ell = svgEl('ellipse', { cx: rx, cy: ry, rx: '56', ry: '30', fill: SURF, stroke: WARN, 'stroke-width': '2' });
    refl.appendChild(ell);
    refl.appendChild(txt(rx, ry - 2, 'reflection', '9', WARN));
    refl.appendChild(txt(rx, ry + 12, '高阶综合', '6.5', MUTE));
    appear(refl, 0.46, 0.06, 0.96, 0.03, period);
    ell.appendChild(anim('rx', '53;53;57;56;56', '0;0.46;0.52;0.58;1', period));
    svg.appendChild(refl);
    var back = svgEl('path', { d: 'M' + (rx - 50) + ',' + (ry - 22) + ' Q250,40 ' + (sx + 120) + ',62', fill: 'none', stroke: WARN, 'stroke-width': '1.4', 'stroke-dasharray': '4 3' });
    appear(back, 0.6, 0.05, 0.96, 0.03, period);
    svg.appendChild(back);
    var ne = svgEl('g', {});
    ne.appendChild(svgEl('rect', { x: sx, y: 56, width: 120, height: 20, fill: SURF, stroke: WARN, 'stroke-width': '1.6', rx: '2' }));
    ne.appendChild(txt(sx + 60, 69, 'reflection', '7.5', WARN));
    appear(ne, 0.66, 0.06, 0.96, 0.03, period);
    svg.appendChild(ne);
    var pl = svgEl('g', {});
    pl.appendChild(svgEl('rect', { x: rx - 46, y: 172, width: 92, height: 34, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' }));
    pl.appendChild(txt(rx, 186, '计划', '9', BP));
    pl.appendChild(txt(rx, 199, '天、小时、行动', '6.5', MUTE));
    appear(pl, 0.78, 0.06, 0.96, 0.03, period);
    svg.appendChild(pl);
    var pln = svgEl('line', { x1: rx, y1: ry + 32, x2: rx, y2: 170, stroke: BP, 'stroke-width': '1.4' });
    appear(pln, 0.74, 0.05, 0.96, 0.03, period);
    svg.appendChild(pln);
    svg.appendChild(txt(W / 2, H - 12, '观察、reflection、计划  ·  reflection 会重新进入信息流，并像其他记忆一样被检索', '8.5', MUTE));
    shell(host, 'GENERATIVE AGENT 循环', '信息流、reflection、计划', svg,
      'Smallville Agent 维护一条仅追加的记忆流，并根据新近性、重要性和相关性评分。Agent 会定期将近期记忆综合为一次 reflection，再把它放回信息流，并据此生成从日级别到行动级别的自上而下计划。移除这三个部分中的任何一个，可信度都会下降：正是这个循环，让一个预先植入的派对想法能够在 24 个无脚本 Agent 之间传播。');
  }

  // ── a5-retry-cascade：一次支付失败向外扩散，导致下游重试成倍增加，
  //    直到 circuit breaker 切断这场风暴 ─────────────────────────────────
  function retryCascade(host) {
    var W = 520, H = 250, period = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var bx = [90, 250, 410], by = 100, names = ['支付', '订单', '库存'], i;
    svg.appendChild(svgEl('line', { x1: bx[0], y1: by, x2: bx[2], y2: by, stroke: SOFT, 'stroke-width': '1.2' }));
    for (i = 0; i < 3; i++) {
      svg.appendChild(svgEl('rect', { x: bx[i] - 40, y: by - 20, width: 80, height: 40, fill: SURF, stroke: i === 0 ? WARN : BP, 'stroke-width': '2', rx: '3' }));
      svg.appendChild(txt(bx[i], by + 4, names[i], '9', i === 0 ? WARN : BP));
    }
    var fail = txt(bx[0], by - 30, '失败', '9', WARN);
    appear(fail, 0.03, 0.04, 0.5, 0.03, period);
    svg.appendChild(fail);
    for (i = 0; i < 2; i++) {
      var r1 = svgEl('circle', { r: '4', fill: WARN });
      appear(r1, 0.08 + i * 0.04, 0.03, 0.24 + i * 0.04, 0.03, period);
      r1.appendChild(motion('M' + (bx[0] + 42) + ',' + by + ' L' + (bx[1] - 42) + ',' + by, '0;0;1;1', '0;' + f2(0.08 + i * 0.04) + ';' + f2(0.26 + i * 0.04) + ';1', period));
      svg.appendChild(r1);
    }
    for (i = 0; i < 4; i++) {
      var r2 = svgEl('circle', { r: '4', fill: WARN });
      appear(r2, 0.24 + i * 0.035, 0.03, 0.42 + i * 0.035, 0.03, period);
      r2.appendChild(motion('M' + (bx[1] + 42) + ',' + by + ' L' + (bx[2] - 42) + ',' + by, '0;0;1;1', '0;' + f2(0.24 + i * 0.035) + ';' + f2(0.44 + i * 0.035) + ';1', period));
      svg.appendChild(r2);
    }
    svg.appendChild(svgEl('rect', { x: bx[2] - 40, y: 140, width: 80, height: 10, fill: SURF, stroke: SOFT, 'stroke-width': '1' }));
    var load = svgEl('rect', { x: bx[2] - 40, y: 140, width: 6, height: 10, fill: WARN });
    grow(load, 'width', 6, 80, 0.28, 0.24, period);
    svg.appendChild(load);
    var tenx = txt(bx[2], 168, '10 倍负载', '8', WARN);
    appear(tenx, 0.46, 0.05, 0.94, 0.03, period);
    svg.appendChild(tenx);
    var brk = svgEl('line', { x1: 330, y1: by - 26, x2: 330, y2: by + 26, stroke: WARN, 'stroke-width': '3' });
    appear(brk, 0.56, 0.05, 0.96, 0.03, period);
    svg.appendChild(brk);
    var bl = txt(330, by - 34, 'circuit breaker', '8', WARN);
    appear(bl, 0.6, 0.05, 0.94, 0.03, period);
    svg.appendChild(bl);
    var late = svgEl('circle', { r: '4', fill: MUTE });
    appear(late, 0.68, 0.03, 0.8, 0.02, period);
    late.appendChild(motion('M' + (bx[1] + 42) + ',' + by + ' L326,' + by, '0;0;1;1', '0;0.68;0.8;1', period));
    svg.appendChild(late);
    svg.appendChild(txt(W / 2, H - 12, '1 次失败、2 次重试、4 次重试  ·  协调失败占 MAST trace 的 36.9%', '8.5', MUTE));
    shell(host, '重试级联', '风暴与 circuit breaker', svg,
      '在 1642 条多 Agent 执行 trace 中，MAST 统计的协调失败占 36.94%，重试风暴则是典型的级联：一次支付失败触发订单重试，每次订单重试又触发库存重试，库存服务在数秒内承受 10 倍负载。在不同层级之间加入 circuit breaker，可以把不断放大的链式故障重新收束为一次受控故障。');
  }

  // ── a5-bench-gap：同一个前沿 Model 以两列呈现，在 Verified 上很高，
  //    在 Pro 上很低；虚线让差距清晰可见 ────────────────────────────────
  function benchGap(host) {
    var W = 520, H = 260, period = 7;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var base = 200;
    svg.appendChild(svgEl('line', { x1: 90, y1: base, x2: 430, y2: base, stroke: MUTE, 'stroke-width': '1.4' }));
    var vh = 127, ph = 39, vx = 150, px = 320, cw = 70;
    svg.appendChild(svgEl('rect', { x: vx, y: base - vh, width: cw, height: vh, fill: 'none', stroke: SOFT, 'stroke-width': '1' }));
    var vc = svgEl('rect', { x: vx, y: base, width: cw, height: 0, fill: BP });
    grow(vc, 'height', 0, vh, 0.05, 0.22, period);
    grow(vc, 'y', base, base - vh, 0.05, 0.22, period);
    svg.appendChild(vc);
    var vl = txt(vx + cw / 2, base - vh - 10, '70-80%', '10', BP);
    appear(vl, 0.24, 0.06, 0.95, 0.04, period);
    svg.appendChild(vl);
    svg.appendChild(svgEl('rect', { x: px, y: base - ph, width: cw, height: ph, fill: 'none', stroke: SOFT, 'stroke-width': '1' }));
    var pc = svgEl('rect', { x: px, y: base, width: cw, height: 0, fill: WARN });
    grow(pc, 'height', 0, ph, 0.35, 0.18, period);
    grow(pc, 'y', base, base - ph, 0.35, 0.18, period);
    svg.appendChild(pc);
    var pl = txt(px + cw / 2, base - ph - 10, '~23%', '10', WARN);
    appear(pl, 0.5, 0.06, 0.95, 0.04, period);
    svg.appendChild(pl);
    svg.appendChild(txt(vx + cw / 2, base + 16, 'SWE-bench Verified', '8', MUTE));
    svg.appendChild(txt(px + cw / 2, base + 16, 'SWE-bench Pro', '8', MUTE));
    svg.appendChild(txt(px + cw / 2, base + 29, '修改 10 行以上的任务', '7', MUTE));
    var dash = svgEl('line', { x1: vx + cw, y1: base - vh, x2: px + cw, y2: base - vh, stroke: BP, 'stroke-width': '1.2', 'stroke-dasharray': '4 3' });
    appear(dash, 0.56, 0.06, 0.95, 0.04, period);
    svg.appendChild(dash);
    var gap = svgEl('line', { x1: px + cw + 12, y1: base - vh, x2: px + cw + 12, y2: base - ph, stroke: WARN, 'stroke-width': '1.4' });
    appear(gap, 0.62, 0.06, 0.95, 0.04, period);
    svg.appendChild(gap);
    var gl = txt(px + cw + 20, base - (vh + ph) / 2, '泛化差距', '8', WARN, 'start');
    appear(gl, 0.68, 0.06, 0.95, 0.04, period);
    svg.appendChild(gl);
    svg.appendChild(txt(W / 2, H - 12, '同一个 Model，两种任务分布  ·  通过 Verified 并不能证明具备泛化能力', '8.5', MUTE));
    shell(host, 'BENCHMARK 差距', 'Verified 与 Pro', svg,
      '前沿 Model 在 SWE-bench Verified 上的得分超过 70%，但在 SWE-bench Pro 上约为 23%；后者包含来自 41 个 repo、需要修改 10 行以上代码的 1865 个问题。Verified 已接近饱和、存在部分污染，而且包含大量只需修改一两行的简单长尾任务。Pro 是无污染的现实检验：解读任何排行榜声明时，都要同时对照这两列。');
  }

  // ── a5-orchestrator-scale：随着查询复杂度上升，一个 lead Agent 依次生成
  //    1 个、3 个、10 个以上 subagent，Token 计量器则反映相应成本 ─────────
  function orchestratorScale(host) {
    var W = 520, H = 260, period = 9;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var cx = 260, cy = 110, i;
    var win = [[0.02, 0.3], [0.35, 0.63], [0.68, 0.96]];
    var phases = ['简单查询：1 个 subagent', '中等查询：3 个 subagent', '复杂研究：10 个以上 subagent'];
    function dot(ang, r, w, stag) {
      var x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
      var d = svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: '6', fill: SURF, stroke: BP, 'stroke-width': '1.8' });
      appear(d, w[0] + stag, 0.04, w[1], 0.025, period);
      d.appendChild(anim('r', '5.7;5.7;6.3;6;6', '0;' + f2(w[0] + stag) + ';' + f2(w[0] + stag + 0.05) + ';' + f2(w[0] + stag + 0.09) + ';1', period));
      svg.appendChild(d);
    }
    dot(-Math.PI / 2, 55, win[0], 0);
    for (i = 0; i < 3; i++) dot(-Math.PI / 2 + i * 2.09, 68, win[1], i * 0.025);
    for (i = 0; i < 8; i++) dot(i * Math.PI / 4, 88, win[2], i * 0.02);
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '26', fill: SURF, stroke: BP, 'stroke-width': '2.5' }));
    svg.appendChild(txt(cx, cy - 2, 'lead', '9', BP));
    svg.appendChild(txt(cx, cy + 10, '规划 + 综合', '5.8', MUTE));
    for (i = 0; i < 3; i++) {
      var pt = txt(cx, 226, phases[i], '9', i === 2 ? WARN : BP);
      appear(pt, win[i][0], 0.05, win[i][1], 0.025, period);
      svg.appendChild(pt);
    }
    svg.appendChild(svgEl('rect', { x: 400, y: 46, width: 80, height: 10, fill: SURF, stroke: SOFT, 'stroke-width': '1' }));
    var tk = svgEl('rect', { x: 400, y: 46, width: 5, height: 10, fill: WARN });
    tk.appendChild(anim('width', '5;5;14;14;32;32;80;80', '0;0.05;0.28;0.38;0.6;0.7;0.94;1', period));
    svg.appendChild(tk);
    svg.appendChild(txt(440, 70, '15 倍 Token', '8', WARN));
    svg.appendChild(txt(W / 2, H - 12, '让投入随查询复杂度扩展  ·  每个 subagent 都能获得一个新的 Context window', '8.5', MUTE));
    shell(host, 'ORCHESTRATOR 扩展', '根据查询规模生成 subagent', svg,
      'Anthropic 的 Research 系统会根据查询复杂度调整投入：简单查询使用一个 Agent 和少量 Tool call，中等查询使用三个 Agent，复杂研究则使用十个或更多并行 subagent。它的表现比单 Agent Opus 4 高出 90.2%，仅 Token 使用量就解释了 BrowseComp 方差的 80%；代价是每次查询消耗 15 倍 Token，还要为长期运行的 Agent 采用 rainbow deploy。');
  }

  LF.register({
    'a5-scaffold-delta': scaffoldDelta,
    'a5-guard-sieve': guardSieve,
    'a5-rsp-ladder': rspLadder,
    'a5-tracked-vs-research': trackedVsResearch,
    'a5-horizon-fit': horizonFit,
    'a5-four-risks': fourRisks,
    'a5-primitive-radar': primitiveRadar,
    'a5-og-narrator': ogNarrator,
    'a5-memory-reflection': memoryReflection,
    'a5-retry-cascade': retryCascade,
    'a5-bench-gap': benchGap,
    'a5-orchestrator-scale': orchestratorScale
  });
})();
