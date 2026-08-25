/* figures-autonomous2.js - Phase 15 自主系统的动态课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF 注册。
   无依赖，仅使用 ES5，通过 CSS 变量适配主题。每个图示都是独特的动态
   SVG（SMIL：animate / animateTransform / animateMotion / stroke-dashoffset）。
   编写方式：使用 ```figure 代码块，并指定下方某个组件的名称。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  var BP = 'var(--blueprint,#3553ff)';
  var INK = 'var(--ink,#1a1a1a)';
  var SOFT = 'var(--ink-soft,#555)';
  var MUTE = 'var(--ink-mute,#777)';
  var RULE = 'var(--rule-soft,#ddd)';
  var WARN = 'var(--warn,#b8870f)';
  var SURF = 'var(--bg-surface,#eee)';
  var BG = 'var(--bg,#fafaf5)';

  function txt(x, y, s, opts) {
    opts = opts || {};
    var t = svgEl('text', {
      x: x, y: y, 'text-anchor': opts.anchor || 'middle',
      'font-family': opts.mono ? 'var(--font-mono,monospace)' : 'var(--font-body,serif)',
      'font-size': opts.size || '11', fill: opts.fill || INK
    });
    if (opts.spacing) t.setAttribute('letter-spacing', opts.spacing);
    t.appendChild(document.createTextNode(s));
    return t;
  }
  function anim(attr, opts) {
    var a = svgEl('animate', { attributeName: attr, repeatCount: 'indefinite' });
    for (var k in opts) if (opts.hasOwnProperty(k)) a.setAttribute(k, opts[k]);
    return a;
  }
  function shell(host, label, sub, svg, caption) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out', style: 'border-top:none;margin-top:0;padding-top:4px' }, [svg])]),
      el('div', { class: 'lf-cap' }, [caption])
    ]));
  }
  function newSvg(h) { return svgEl('svg', { viewBox: '0 0 520 ' + h }); }

  // ── alphaevolve-loop：提出 → 评估 → 保留，不断螺旋进入持续增长的
  //    程序数据库。（Phase 15 · 03）────────────────────────────────────────
  function alphaevolveLoop(host) {
    var svg = newSvg(250);
    var cx = 160, cy = 125;
    var ringStops = [[300, '提出'], [60, '评估'], [180, '保留']];
    var i;
    // 淡色向外螺旋，表示各代不断累积
    var sp = 'M ' + cx + ' ' + cy + ' ';
    for (i = 0; i <= 220; i++) {
      var th = i / 220 * Math.PI * 6, rr = i / 220 * 78;
      sp += 'L ' + (cx + rr * Math.cos(th)).toFixed(1) + ' ' + (cy + rr * Math.sin(th)).toFixed(1) + ' ';
    }
    var spiral = svgEl('path', { d: sp, fill: 'none', stroke: RULE, 'stroke-width': '1', 'stroke-dasharray': '420 420', 'stroke-dashoffset': '420' });
    spiral.appendChild(anim('stroke-dashoffset', { from: '420', to: '0', dur: '5s' }));
    svg.appendChild(spiral);
    // 环上的三个阶段
    var R = 78;
    for (i = 0; i < 3; i++) {
      var ang = (i / 3 * 2 - 0.5) * Math.PI;
      var x = cx + R * Math.cos(ang), y = cy + R * Math.sin(ang);
      svg.appendChild(svgEl('circle', { cx: x, cy: y, r: '24', fill: SURF, stroke: BP, 'stroke-width': '1.5' }));
      svg.appendChild(txt(x, y + 4, ringStops[i][1], { mono: true, size: '10', fill: BP }));
    }
    // 沿循环轨道运行的候选 Token
    var orbit = 'M ' + (cx + R) + ' ' + cy + ' A ' + R + ' ' + R + ' 0 1 1 ' + (cx + R) + ' ' + (cy - 0.1) + ' Z';
    svg.appendChild(svgEl('path', { id: 'ae-orbit', d: orbit, fill: 'none', stroke: 'none' }));
    var dot = svgEl('circle', { r: '6', fill: WARN });
    var m = svgEl('animateMotion', { dur: '3s', repeatCount: 'indefinite', rotate: 'auto' });
    m.appendChild(svgEl('mpath', { href: '#ae-orbit' }));
    dot.appendChild(m);
    svg.appendChild(dot);
    // 右侧持续增长的数据库列
    var bx = 380;
    for (i = 0; i < 6; i++) {
      var r = svgEl('rect', { x: bx, y: 200 - i * 28, width: 110, height: 22, rx: '3', fill: i === 0 ? BP : SURF, stroke: RULE, 'stroke-width': '1', opacity: '0' });
      r.appendChild(anim('opacity', { values: '0;1;1', dur: '6s', begin: (i * 0.7) + 's', keyTimes: '0;0.1;1' }));
      svg.appendChild(r);
      svg.appendChild(txt(bx + 55, 200 - i * 28 + 15, '评分 ' + (95 - i * 7), { mono: true, size: '9', fill: i === 0 ? BG : SOFT }));
    }
    svg.appendChild(txt(435, 36, '程序数据库', { mono: true, size: '9', fill: MUTE, spacing: '0.12em' }));
    shell(host, 'ALPHAEVOLVE 循环', '提出 · 评估 · 保留',
      svg,
      'LLM 提出有针对性的编辑，由机器可检查的评估器进行评分，高分结果则被保留为下一代的父代。随着程序数据库填入越来越好的变体，循环不断向外螺旋扩展。成果来自评估器的严谨性，而不是循环本身有多巧妙。');
  }

  // ── dgm-archive：不断扩展的自修改 Agent 谱系，分支
  //    向前延伸，评分持续攀升。（Phase 15 · 04）────────────────────────────
  function dgmArchive(host) {
    var svg = newSvg(250);
    var nodes = [
      { x: 40, y: 125, s: 20 }, { x: 150, y: 80, s: 31 }, { x: 150, y: 175, s: 28 },
      { x: 270, y: 55, s: 42 }, { x: 270, y: 120, s: 36 }, { x: 270, y: 200, s: 33 },
      { x: 400, y: 90, s: 50 }, { x: 400, y: 175, s: 44 }
    ];
    var edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [4, 6], [5, 7]];
    var i;
    for (i = 0; i < edges.length; i++) {
      var a = nodes[edges[i][0]], b = nodes[edges[i][1]];
      var d = 'M ' + a.x + ' ' + a.y + ' C ' + ((a.x + b.x) / 2) + ' ' + a.y + ' ' + ((a.x + b.x) / 2) + ' ' + b.y + ' ' + b.x + ' ' + b.y;
      var p = svgEl('path', { d: d, fill: 'none', stroke: RULE, 'stroke-width': '1.5', 'stroke-dasharray': '160 160', 'stroke-dashoffset': '160' });
      p.appendChild(anim('stroke-dashoffset', { from: '160', to: '0', dur: '4.5s', begin: (i * 0.45) + 's', fill: 'freeze' }));
      svg.appendChild(p);
    }
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i], best = (i === 6);
      var g = svgEl('g', { opacity: '0' });
      g.appendChild(anim('opacity', { values: '0;1', dur: '0.5s', begin: (0.45 + i * 0.45) + 's', fill: 'freeze' }));
      g.appendChild(svgEl('circle', { cx: n.x, cy: n.y, r: best ? '20' : '16', fill: best ? BP : SURF, stroke: best ? BP : RULE, 'stroke-width': '1.5' }));
      g.appendChild(txt(n.x, n.y + 4, String(n.s) + '%', { mono: true, size: best ? '11' : '9', fill: best ? BG : SOFT }));
      if (best) {
        var ring = svgEl('circle', { cx: n.x, cy: n.y, r: '20', fill: 'none', stroke: BP, 'stroke-width': '1.5' });
        ring.appendChild(anim('r', { values: '20;28;20', dur: '2s', begin: '4s' }));
        ring.appendChild(anim('opacity', { values: '0.8;0;0.8', dur: '2s', begin: '4s' }));
        g.appendChild(ring);
      }
      svg.appendChild(g);
    }
    svg.appendChild(txt(40, 218, 'A0  种子', { mono: true, size: '9', fill: MUTE }));
    svg.appendChild(txt(400, 30, '最佳变体', { mono: true, size: '9', fill: BP }));
    shell(host, 'DARWIN GODEL 档案', '自修改谱系',
      svg,
      'DGM 放弃形式化证明，转而维护开放式档案。每个 Agent 都会提出对自身源代码的编辑，在 benchmark 上接受评分，并在达到门槛后被保留。谱系不断向前分支，最佳评分持续攀升，SWE-bench 正是通过这种方式从 20% 提升到 50%。同样是这种开放性，让它学会了钻自身评估器的空子。');
  }

  // ── aar-forum：并行运行的沙箱化 Agent 将内容写入位于所有
  //    沙箱之外的仅追加论坛。（Phase 15 · 06）─────────────────────────────
  function aarForum(host) {
    var svg = newSvg(250);
    var boxes = [{ x: 30, y: 30 }, { x: 30, y: 105 }, { x: 30, y: 180 }];
    var logX = 350, i;
    // 右侧的仅追加日志
    svg.appendChild(svgEl('rect', { x: logX, y: 24, width: 140, height: 200, rx: '5', fill: 'none', stroke: BP, 'stroke-width': '2' }));
    svg.appendChild(txt(logX + 70, 18, '共享论坛（仅追加）', { mono: true, size: '8', fill: BP, spacing: '0.08em' }));
    for (i = 0; i < 5; i++) {
      var lr = svgEl('rect', { x: logX + 12, y: 200 - i * 34, width: 116, height: 26, rx: '2', fill: SURF, stroke: RULE, 'stroke-width': '1', opacity: '0' });
      lr.appendChild(anim('opacity', { values: '0;1;1', dur: '6s', begin: (1 + i * 1) + 's', keyTimes: '0;0.08;1', fill: 'freeze' }));
      svg.appendChild(lr);
      svg.appendChild(txt(logX + 70, 200 - i * 34 + 17, '发现 #' + (i + 1), { mono: true, size: '9', fill: SOFT }));
    }
    // 三个沙箱分别向日志发送一条记录
    var colors = [BP, WARN, SOFT];
    for (i = 0; i < boxes.length; i++) {
      var bx = boxes[i].x, by = boxes[i].y;
      svg.appendChild(svgEl('rect', { x: bx, y: by, width: 120, height: 56, rx: '4', fill: SURF, stroke: RULE, 'stroke-width': '1.5', 'stroke-dasharray': '5 4' }));
      svg.appendChild(txt(bx + 60, by + 24, 'AAR ' + (i + 1), { mono: true, size: '11', fill: INK }));
      svg.appendChild(txt(bx + 60, by + 42, '沙箱', { mono: true, size: '8', fill: MUTE }));
      var pid = 'aar-path-' + i;
      var sy = by + 28, ey = 200 - i * 50 + 13;
      svg.appendChild(svgEl('path', { id: pid, d: 'M ' + (bx + 120) + ' ' + sy + ' C 250 ' + sy + ' 280 ' + ey + ' ' + logX + ' ' + ey, fill: 'none', stroke: RULE, 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var rec = svgEl('rect', { x: -7, y: -5, width: 14, height: 10, rx: '2', fill: colors[i] });
      var mo = svgEl('animateMotion', { dur: '3s', begin: (i * 0.6) + 's', repeatCount: 'indefinite' });
      mo.appendChild(svgEl('mpath', { href: '#' + pid }));
      rec.appendChild(mo);
      svg.appendChild(rec);
    }
    shell(host, '自动化对齐研究', '并行 Agent · 外部日志',
      svg,
      '并行运行的 Claude AAR 分别处于隔离沙箱中，并将研究发现发布到共享论坛；该论坛的存储位于每个沙箱之外。Agent 可以读取日志，但无法从自己的沙箱中删除或编辑以往记录。正是这种仅追加、直写式特性让研究输出值得信任，因为 Agent 无法悄悄掩盖失败的实验。');
  }

  // ── bounded-gates：提议的编辑逐层通过不变量关卡；违反
  //    约束的编辑会被驳回。（Phase 15 · 08）────────────────────────────────
  function boundedGates(host) {
    var svg = newSvg(260);
    var gates = ['不变量', '对齐锚点', '多目标', '回归检查'];
    var gy = [210, 160, 110, 60], gx = 150, gw = 220, i;
    for (i = 0; i < 4; i++) {
      svg.appendChild(svgEl('line', { x1: gx, y1: gy[i], x2: gx + gw, y2: gy[i], stroke: RULE, 'stroke-width': '2' }));
      svg.appendChild(txt(gx + gw + 8, gy[i] + 4, gates[i], { mono: true, size: '10', fill: SOFT, anchor: 'start' }));
      svg.appendChild(svgEl('circle', { cx: gx, cy: gy[i], r: '3', fill: BP }));
      svg.appendChild(svgEl('circle', { cx: gx + gw, cy: gy[i], r: '3', fill: BP }));
    }
    // 被接受的编辑：通过所有关卡
    var accepted = svgEl('circle', { cx: gx + 50, cy: 240, r: '8', fill: BP });
    accepted.appendChild(anim('cy', { values: '240;210;160;110;60;30', dur: '5s', keyTimes: '0;0.2;0.42;0.62;0.82;1' }));
    svg.appendChild(accepted);
    svg.appendChild(txt(gx + 50, 252, '编辑', { mono: true, size: '8', fill: MUTE }));
    // 被拒绝的编辑：上升到某个关卡后被弹回
    var rej = svgEl('circle', { cx: gx + 160, cy: 240, r: '8', fill: WARN });
    rej.appendChild(anim('cy', { values: '240;210;160;160;240', dur: '5s', keyTimes: '0;0.25;0.45;0.55;1', begin: '1.2s' }));
    rej.appendChild(anim('opacity', { values: '1;1;1;0.3;0', dur: '5s', keyTimes: '0;0.45;0.5;0.6;1', begin: '1.2s' }));
    svg.appendChild(rej);
    // 被拒绝的编辑触及第二个关卡时，闪现一个小叉号
    var x1 = svgEl('text', { x: gx + 160, y: 152, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '16', fill: WARN, opacity: '0' });
    x1.appendChild(document.createTextNode('×'));
    x1.appendChild(anim('opacity', { values: '0;0;1;0;0', dur: '5s', keyTimes: '0;0.45;0.55;0.75;1', begin: '1.2s' }));
    svg.appendChild(x1);
    svg.appendChild(txt(gx + 110, 22, '已接受：所有不变量均成立', { mono: true, size: '9', fill: BP }));
    shell(host, '有界自我改进', '编辑必须通过每个关卡',
      svg,
      '有界循环会根据循环自身无法编辑的外部不变量，检查每项提议的自修改：形式化不变量、不可变的对齐锚点、每项安全目标，以及回归检查。只有通过所有关卡的编辑才会被接受；违反任何关卡的编辑都会被驳回。这些措施都不能证明系统安全，但会提高无声失败的成本。');
  }

  // ── injection-boundary：不受信任的页面内容向 Agent 的读取/执行
  //    边界发起注入尝试；大多数被弹回，但有一个成功穿过。（Phase 15 · 11）──
  function injectionBoundary(host) {
    var svg = newSvg(250);
    var bx = 250;
    // 模糊的读取/执行边界
    var bound = svgEl('line', { x1: bx, y1: 30, x2: bx, y2: 220, stroke: BP, 'stroke-width': '2', 'stroke-dasharray': '6 5' });
    svg.appendChild(bound);
    svg.appendChild(txt(bx, 22, '读取  ⇋  执行  边界', { mono: true, size: '9', fill: BP }));
    // 左侧：不受信任的网页
    svg.appendChild(svgEl('rect', { x: 24, y: 60, width: 120, height: 130, rx: '4', fill: SURF, stroke: RULE, 'stroke-width': '1.5' }));
    svg.appendChild(txt(84, 52, '不受信任的页面', { mono: true, size: '9', fill: MUTE }));
    var ly;
    for (ly = 0; ly < 5; ly++) svg.appendChild(svgEl('line', { x1: 38, y1: 82 + ly * 22, x2: 130, y2: 82 + ly * 22, stroke: RULE, 'stroke-width': '4' }));
    // 右侧：Agent
    svg.appendChild(svgEl('circle', { cx: 420, cy: 125, r: '34', fill: SURF, stroke: BP, 'stroke-width': '2' }));
    svg.appendChild(txt(420, 122, 'Agent', { mono: true, size: '11', fill: INK }));
    svg.appendChild(txt(420, 138, 'Tool', { mono: true, size: '8', fill: MUTE }));
    // 注入飞镖：三个被边界弹回，一个成功穿过
    var lanes = [80, 125, 170], i;
    for (i = 0; i < 3; i++) {
      var dart = svgEl('polygon', { points: '0,-4 12,0 0,4', fill: WARN });
      var bounce = svgEl('animateTransform', {
        attributeName: 'transform', type: 'translate', repeatCount: 'indefinite',
        dur: '2.6s', begin: (i * 0.55) + 's',
        values: '150,' + lanes[i] + '; ' + (bx - 6) + ',' + lanes[i] + '; 150,' + lanes[i],
        keyTimes: '0;0.5;1'
      });
      dart.appendChild(bounce);
      var fade = anim('opacity', { values: '0;1;1;0.4;0', dur: '2.6s', begin: (i * 0.55) + 's', keyTimes: '0;0.1;0.45;0.55;1' });
      dart.appendChild(fade);
      svg.appendChild(dart);
    }
    // 成功穿过的那一个
    var slip = svgEl('polygon', { points: '0,-4 12,0 0,4', fill: BP });
    slip.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', repeatCount: 'indefinite', dur: '3.6s', begin: '1.8s', values: '150,125; 386,125', keyTimes: '0;1' }));
    slip.appendChild(anim('opacity', { values: '0;1;1;0', dur: '3.6s', begin: '1.8s', keyTimes: '0;0.08;0.9;1' }));
    svg.appendChild(slip);
    shell(host, 'BROWSER AGENT 注入', '读取就是命令通道',
      svg,
      'Browser Agent 会读取不受信任的页面，并执行会产生实际后果的操作。每个页面都是并非由用户编写的输入，因此每一行内容都可能是一条瞄准模糊读取与执行边界的命令。防御措施会弹回大多数尝试，但间接 Prompt 注入就存在于这条边界中。正如 OpenAI 所说，它“并不是一个能够被彻底修补的 bug”。');
  }

  // ── cost-governor-stack：支出逐步穿过不同时间尺度的多层上限；
  //    速率限制最先触发。（Phase 15 · 13）──────────────────────────────────
  function costGovernorStack(host) {
    var svg = newSvg(250);
    var caps = [
      { y: 190, label: '每个请求', v: '0' },
      { y: 150, label: '每项任务', v: '1' },
      { y: 110, label: '速率（10 分钟）', v: '2', trip: true },
      { y: 70, label: '每天', v: '3' },
      { y: 36, label: '每月', v: '4' }
    ];
    var gx = 70, gw = 320, i;
    for (i = 0; i < caps.length; i++) {
      var c = caps[i];
      svg.appendChild(svgEl('line', { x1: gx, y1: c.y, x2: gx + gw, y2: c.y, stroke: c.trip ? WARN : RULE, 'stroke-width': c.trip ? '2' : '1.5', 'stroke-dasharray': c.trip ? '' : '4 4' }));
      svg.appendChild(txt(gx + gw + 8, c.y + 4, c.label, { mono: true, size: '9', fill: c.trip ? WARN : SOFT, anchor: 'start' }));
    }
    // 不断上升的支出条
    var bar = svgEl('rect', { x: gx + 40, y: 220, width: 40, height: 0, rx: '2', fill: BP });
    bar.appendChild(anim('y', { values: '220;110;110', dur: '4s', keyTimes: '0;0.7;1', fill: 'freeze' }));
    bar.appendChild(anim('height', { values: '0;110;110', dur: '4s', keyTimes: '0;0.7;1', fill: 'freeze' }));
    bar.appendChild(anim('fill', { values: BP + ';' + BP + ';' + WARN + ';' + WARN, dur: '4s', keyTimes: '0;0.68;0.72;1', fill: 'freeze' }));
    svg.appendChild(bar);
    svg.appendChild(txt(gx + 60, 234, '$ 支出', { mono: true, size: '9', fill: MUTE }));
    // 触发速率上限时闪现“切断”
    var cut = svgEl('text', { x: gx + 160, y: 100, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '14', fill: WARN, opacity: '0' });
    cut.appendChild(document.createTextNode('⚡ 访问已切断'));
    cut.appendChild(anim('opacity', { values: '0;0;1;1', dur: '4s', keyTimes: '0;0.7;0.78;1', fill: 'freeze' }));
    svg.appendChild(cut);
    shell(host, '成本治理器堆栈', '覆盖每种时间尺度的上限',
      svg,
      '单一的月度上限只能在失控 Agent 耗尽资金后才捕获它。解决方案是在不同时间尺度上设置一组限制：每个请求、每项任务、速率、每天和每月。失控循环消耗得很快，因此速率限制（“10 分钟内 $50”）会远早于每日或每月上限触发。');
  }

  // ── circuit-breaker：重复出现的相同 Tool 调用会触发断路器，
  //    使其从闭合切换为断开。（Phase 15 · 14）─────────────────────────────
  function circuitBreaker(host) {
    var svg = newSvg(240);
    // 左侧的调用日志：连续堆叠五次相同调用
    var lx = 36, i;
    svg.appendChild(txt(lx + 70, 24, 'Tool 调用', { mono: true, size: '9', fill: MUTE }));
    for (i = 0; i < 5; i++) {
      var r = svgEl('rect', { x: lx, y: 40 + i * 34, width: 150, height: 26, rx: '3', fill: SURF, stroke: i === 4 ? WARN : RULE, 'stroke-width': '1.5', opacity: '0' });
      r.appendChild(anim('opacity', { values: '0;1', dur: '0.3s', begin: (i * 0.7) + 's', fill: 'freeze' }));
      svg.appendChild(r);
      var tl = txt(lx + 75, 40 + i * 34 + 17, 'delete(record_42)', { mono: true, size: '10', fill: i === 4 ? WARN : SOFT });
      tl.setAttribute('opacity', '0');
      tl.appendChild(anim('opacity', { values: '0;1', dur: '0.3s', begin: (i * 0.7) + 's', fill: 'freeze' }));
      svg.appendChild(tl);
    }
    // 右侧的断路器开关
    var bx = 360, by = 120;
    svg.appendChild(svgEl('circle', { cx: bx, cy: by - 50, r: '6', fill: BP }));
    svg.appendChild(svgEl('circle', { cx: bx, cy: by + 50, r: '6', fill: BP }));
    svg.appendChild(svgEl('line', { x1: bx, y1: by - 50, x2: bx, y2: by - 44, stroke: SOFT, 'stroke-width': '2' }));
    svg.appendChild(svgEl('line', { x1: bx, y1: by + 50, x2: bx, y2: by + 44, stroke: SOFT, 'stroke-width': '2' }));
    // 操纵杆：开始时闭合连接，随后迅速断开
    var lever = svgEl('line', { x1: bx, y1: by - 44, x2: bx, y2: by + 44, stroke: BP, 'stroke-width': '3' });
    var lt = svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', dur: '4.5s', repeatCount: 'indefinite', values: '0 ' + bx + ' ' + (by - 44) + ';0 ' + bx + ' ' + (by - 44) + ';48 ' + bx + ' ' + (by - 44) + ';48 ' + bx + ' ' + (by - 44), keyTimes: '0;0.62;0.72;1' });
    lever.appendChild(lt);
    lever.appendChild(anim('stroke', { values: BP + ';' + BP + ';' + WARN + ';' + WARN, dur: '4.5s', keyTimes: '0;0.62;0.72;1' }));
    svg.appendChild(lever);
    var st = svgEl('text', { x: bx + 4, y: by + 78, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: WARN, opacity: '0' });
    st.appendChild(document.createTextNode('断开 — 已暂停'));
    st.appendChild(anim('opacity', { values: '0;0;1;1', dur: '4.5s', keyTimes: '0;0.7;0.78;1', fill: 'freeze' }));
    svg.appendChild(st);
    svg.appendChild(txt(bx, 30, '断路器', { mono: true, size: '9', fill: MUTE }));
    shell(host, '断路器', '操作模式触发开关',
      svg,
      '断路器会监视特定的操作模式，这里是连续五次相同的破坏性调用。当该模式触发时，断路器会从闭合迅速切换为断开：违规路径暂停，并上报给人工处理。与成本上限不同，它不信任 Agent 的自我报告，而是根据 Agent 实际执行的操作作出响应。');
  }

  // ── checkpoint-replay：工作流开始运行，在某个步骤中途崩溃，
  //    新 worker 从最后一个 Checkpoint 开始重放。（Phase 15 · 16）────────
  function checkpointReplay(host) {
    var svg = newSvg(240);
    var y = 110, steps = ['开始', 'ckpt A', '步骤', 'ckpt B', '步骤', 'commit'];
    var x0 = 40, dx = 88, i;
    svg.appendChild(svgEl('line', { x1: x0, y1: y, x2: x0 + dx * 5, y2: y, stroke: RULE, 'stroke-width': '2' }));
    for (i = 0; i < steps.length; i++) {
      var x = x0 + i * dx, ck = steps[i].indexOf('ckpt') === 0;
      if (ck) {
        svg.appendChild(svgEl('rect', { x: x - 9, y: y - 9, width: 18, height: 18, fill: BP, transform: 'rotate(45 ' + x + ' ' + y + ')' }));
      } else {
        svg.appendChild(svgEl('circle', { cx: x, cy: y, r: '7', fill: SURF, stroke: SOFT, 'stroke-width': '1.5' }));
      }
      svg.appendChild(txt(x, ck ? y - 18 : y + 24, steps[i], { mono: true, size: '9', fill: ck ? BP : SOFT }));
    }
    var crashX = x0 + dx * 4;
    var ckBX = x0 + dx * 3;
    // 崩溃标记
    var crash = svgEl('text', { x: crashX, y: y - 26, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '15', fill: WARN, opacity: '0' });
    crash.appendChild(document.createTextNode('✕ 崩溃'));
    crash.appendChild(anim('opacity', { values: '0;0;1;1;0;0', dur: '6s', keyTimes: '0;0.42;0.46;0.62;0.66;1' }));
    svg.appendChild(crash);
    // worker 播放头：前进至崩溃点，跳回 ckpt B，再向前重放
    var head = svgEl('circle', { cx: x0, cy: y, r: '6', fill: WARN });
    head.appendChild(anim('cx', {
      values: x0 + ';' + crashX + ';' + ckBX + ';' + (x0 + dx * 5),
      dur: '6s', keyTimes: '0;0.45;0.55;1', calcMode: 'linear'
    }));
    head.appendChild(anim('fill', { values: WARN + ';' + WARN + ';' + BP + ';' + BP, dur: '6s', keyTimes: '0;0.5;0.55;1' }));
    svg.appendChild(head);
    // 从崩溃点返回 ckpt B 的恢复弧线
    var arc = svgEl('path', { d: 'M ' + crashX + ' ' + (y - 12) + ' Q ' + ((crashX + ckBX) / 2) + ' ' + (y - 52) + ' ' + ckBX + ' ' + (y - 12), fill: 'none', stroke: BP, 'stroke-width': '1.5', 'stroke-dasharray': '4 3', 'marker-end': '', opacity: '0' });
    arc.appendChild(anim('opacity', { values: '0;0;1;1;0;0', dur: '6s', keyTimes: '0;0.46;0.5;0.7;0.8;1' }));
    svg.appendChild(arc);
    svg.appendChild(txt((crashX + ckBX) / 2, y - 56, '从最后一个 Checkpoint 恢复', { mono: true, size: '9', fill: BP }));
    shell(host, 'CHECKPOINT + 重放', '崩溃后的租约恢复',
      svg,
      '每次图状态转换都会持久化。当 worker 在某个步骤中途崩溃时，其租约会过期，另一个 worker 会从最新 Checkpoint 接手，并从那里向前重放。结合幂等性 key 和前置条件检查，重放可以安全落地，而不会重复执行已经批准的操作。');
  }

  LF.register({
    'alphaevolve-loop': alphaevolveLoop,
    'dgm-archive': dgmArchive,
    'aar-forum': aarForum,
    'bounded-gates': boundedGates,
    'injection-boundary': injectionBoundary,
    'cost-governor-stack': costGovernorStack,
    'circuit-breaker': circuitBreaker,
    'checkpoint-replay': checkpointReplay
  });
})();
