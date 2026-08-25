/* figures-infra4.js - Phase 17（基础设施与生产环境）的动画课程图示：
   托管平台、可观测性连接、canary 发布、AI SRE、混沌防护栏、
   密钥轮换、合规映射、FinOps。
   在 lesson-figures.js 之后加载，通过 window.LF 注册。仅使用 SMIL 动画，
   无 JS 循环，无 rAF。ES5，无依赖，通过 CSS 变量适配主题。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  var BP = 'var(--blueprint,#3553ff)';
  var SOFT = 'var(--rule-soft,#ddd)';
  var MUTE = 'var(--ink-mute,#777)';
  var INKS = 'var(--ink-soft,#555)';
  var WARN = 'var(--warn,#b8870f)';
  var INK = 'var(--ink,#1a1a1a)';
  var BG = 'var(--bg,#fafaf5)';
  var SURF = 'var(--bg-surface,#eee)';
  var EASE = '0.23 1 0.32 1';
  var SPL4 = '0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1';

  function svg(h) { return svgEl('svg', { viewBox: '0 0 520 ' + h }); }
  function shell(host, label, sub, node, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [node])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function txt(x, y, s, size, fill, anchor) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': anchor || 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': size || '10', fill: fill || INK });
    t.appendChild(document.createTextNode(s));
    return t;
  }
  function rect(x, y, w, h, fill, stroke) {
    return svgEl('rect', { x: x, y: y, width: w, height: h, rx: '4', fill: fill || BG, stroke: stroke || SOFT, 'stroke-width': '1.4' });
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('animate', a);
  }
  function motion(path, dur, begin) {
    return svgEl('animateMotion', { path: path, dur: dur, begin: begin || '0s', repeatCount: 'indefinite' });
  }
  // 淡入并放大：在 a..b 阶段窗口内，透明度从 0、尺寸从 95% 开始变化，
  // 在 0.94..1 区间更快退出。内容相对于 (cx, cy) 绘制。
  function entry(cx, cy, dur, begin, a, b) {
    a = a || 0.02; b = b || 0.12;
    var kt = '0;' + a + ';' + b + ';0.94;1';
    var g = svgEl('g', { transform: 'translate(' + cx + ' ' + cy + ')', opacity: '0' });
    g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'scale', additive: 'sum', values: '0.95;0.95;1;1;0.97', keyTimes: kt, calcMode: 'spline', keySplines: SPL4, dur: dur, begin: begin || '0s', repeatCount: 'indefinite' }));
    g.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;1;1;0', keyTimes: kt, calcMode: 'spline', keySplines: SPL4, dur: dur, begin: begin || '0s', repeatCount: 'indefinite' }));
    return g;
  }

  // ── i4-platform-lanes：PTU 预留通道与共享按需通道 ────────────────────────
  // 01-managed-llm-platforms
  function platformLanes(host) {
    var s = svg(230);
    s.appendChild(txt(40, 40, 'PTU 预留通道', '9', BP, 'start'));
    s.appendChild(svgEl('rect', { x: 40, y: 50, width: 330, height: 34, rx: '4', fill: 'none', stroke: BP, 'stroke-width': '1.6' }));
    s.appendChild(rect(390, 44, 100, 46, BG, BP));
    s.appendChild(txt(440, 63, '专用', '9', BP));
    s.appendChild(txt(440, 77, '中位数约 50 ms', '8', MUTE));
    var i;
    for (i = 0; i < 4; i++) {
      var d = svgEl('circle', { cx: 0, cy: 0, r: 5, fill: BP });
      d.appendChild(motion('M20 67 L440 67', '1.6s', (i * 0.4) + 's'));
      s.appendChild(d);
    }
    s.appendChild(txt(40, 128, '共享按需通道', '9', WARN, 'start'));
    s.appendChild(svgEl('rect', { x: 40, y: 138, width: 330, height: 34, rx: '4', fill: 'none', stroke: WARN, 'stroke-width': '1.6' }));
    s.appendChild(rect(390, 132, 100, 46, BG, WARN));
    s.appendChild(txt(440, 151, '共享资源池', '9', WARN));
    s.appendChild(txt(440, 165, '中位数约 75 ms', '8', MUTE));
    // 共享通道：其他租户的灰色流量挤占管道，我们的请求只能等待
    for (i = 0; i < 3; i++) {
      var o = svgEl('rect', { x: -5, y: -5, width: 10, height: 10, rx: '2', fill: MUTE, opacity: '0.5' });
      o.appendChild(motion('M60 155 L440 155', '2.6s', (i * 0.85) + 's'));
      s.appendChild(o);
    }
    for (i = 0; i < 2; i++) {
      var m = svgEl('circle', { cx: 0, cy: 0, r: 5, fill: WARN });
      m.appendChild(motion('M20 155 L120 155 L120 155 L440 155', '3.2s', (i * 1.6) + 's'));
      s.appendChild(m);
    }
    var q = entry(150, 155, '3.2s', '0.3s', 0.05, 0.2);
    q.appendChild(txt(0, -16, '排在相邻租户之后', '8', MUTE));
    s.appendChild(q);
    s.appendChild(txt(260, 208, '相同 Model，不同容量契约：预留通道快约 25 ms', '9', MUTE));
    shell(host, '平台通道', '预留 PTU 容量与共享按需容量', s,
      'Hyperscaler 之间的延迟差距源于容量，而非 Model。Azure PTU 会预留吞吐量，因此请求在专用通道上运行时的中位延迟约为 50 ms。Bedrock 按需容量与其他所有租户共享资源池，同等规模的 Model 延迟约为 75 ms，因为你的 Token 要排在其他租户之后。先根据平台的目录与 FinOps 能力选择平台，再决定哪些工作负载值得使用预留通道。');
  }

  // ── i4-otel-glue：Gateway span 通过 OTel 分流到两个后端 ──────────────────
  // 13-llm-observability
  function otelGlue(host) {
    var s = svg(240);
    s.appendChild(rect(30, 96, 74, 44, BG, INK));
    s.appendChild(txt(67, 114, '应用', '10', INK));
    s.appendChild(txt(67, 128, 'LLM 调用', '8', MUTE));
    s.appendChild(rect(170, 96, 84, 44, BG, INKS));
    s.appendChild(txt(212, 114, 'Gateway', '10', INKS));
    s.appendChild(txt(212, 128, 'Helicone', '8', MUTE));
    s.appendChild(rect(300, 96, 70, 44, SURF, BP));
    s.appendChild(txt(335, 114, 'OTel', '10', BP));
    s.appendChild(txt(335, 128, 'Collector', '8', MUTE));
    s.appendChild(rect(410, 34, 96, 44, BG, BP));
    s.appendChild(txt(458, 52, '遥测', '9', BP));
    s.appendChild(txt(458, 66, 'Trace + 成本', '8', MUTE));
    s.appendChild(rect(410, 158, 96, 44, BG, WARN));
    s.appendChild(txt(458, 176, 'Evaluation 平台', '9', WARN));
    s.appendChild(txt(458, 190, '漂移 + RAG', '8', MUTE));
    s.appendChild(svgEl('path', { d: 'M104 118 L170 118', fill: 'none', stroke: SOFT, 'stroke-width': '1.2' }));
    s.appendChild(svgEl('path', { d: 'M254 118 L300 118', fill: 'none', stroke: SOFT, 'stroke-width': '1.2' }));
    var up = svgEl('path', { d: 'M370 108 L408 62', fill: 'none', stroke: BP, 'stroke-width': '1.4', 'stroke-dasharray': '4 4' });
    up.appendChild(anim('stroke-dashoffset', '16;0', '0.8s'));
    s.appendChild(up);
    var dn = svgEl('path', { d: 'M370 128 L408 174', fill: 'none', stroke: WARN, 'stroke-width': '1.4', 'stroke-dasharray': '4 4' });
    dn.appendChild(anim('stroke-dashoffset', '16;0', '0.8s'));
    s.appendChild(dn);
    // 一个请求变为一个 span；Collector 将其复制到两个接收端
    var i;
    for (i = 0; i < 3; i++) {
      var b = (i * 1.4) + 's';
      var c = svgEl('circle', { cx: 0, cy: 0, r: 5, fill: INKS });
      c.appendChild(motion('M0 118 L67 118 L212 118 L335 118', '4.2s', b));
      c.appendChild(anim('opacity', '1;1;0;0', '4.2s', { keyTimes: '0;0.6;0.62;1', begin: b }));
      s.appendChild(c);
      var t1 = svgEl('rect', { x: -5, y: -4, width: 10, height: 8, rx: '2', fill: BP });
      t1.appendChild(motion('M335 118 L335 118 L458 56', '4.2s', b));
      t1.appendChild(anim('opacity', '0;0;1;1;0', '4.2s', { keyTimes: '0;0.6;0.66;0.9;1', begin: b }));
      s.appendChild(t1);
      var t2 = svgEl('rect', { x: -5, y: -4, width: 10, height: 8, rx: '2', fill: WARN });
      t2.appendChild(motion('M335 118 L335 118 L458 180', '4.2s', b));
      t2.appendChild(anim('opacity', '0;0;1;1;0', '4.2s', { keyTimes: '0;0.6;0.66;0.9;1', begin: b }));
      s.appendChild(t2);
    }
    s.appendChild(txt(260, 228, '一个 span，两个接收端：无需任何 Tool 同时承担两项工作', '9', MUTE));
    shell(host, 'OTEL 连接模式', '将 Gateway 遥测复制到指标接收端和 Evaluation 接收端', s,
      '没有任何单一可观测性 Tool 能同时胜任这两项工作，因此生产模式会将它们拆分。Gateway 将每次 LLM 调用捕获为 OpenTelemetry span；Collector 把每个 span 复制到两个接收端：遥测后端负责 Trace、延迟和成本，Evaluation 平台负责漂移与 RAG 质量。以后替换任意一端都只需修改配置，无需重新埋点。');
  }

  // ── i4-canary-ramp：先进行 shadow 镜像，再执行带门控的流量阶梯 ───────────
  // 20-shadow-canary-progressive
  function canaryRamp(host) {
    var s = svg(250);
    s.appendChild(rect(30, 30, 70, 40, BG, INK));
    s.appendChild(txt(65, 47, '流量', '9', INK));
    s.appendChild(txt(65, 61, '分流器', '8', MUTE));
    s.appendChild(rect(150, 20, 90, 36, BG, INKS));
    s.appendChild(txt(195, 35, '生产 Model', '9', INKS));
    s.appendChild(txt(195, 48, '服务用户', '7.5', MUTE));
    s.appendChild(rect(150, 74, 90, 36, BG, BP));
    s.appendChild(txt(195, 89, '候选 Model', '9', BP));
    s.appendChild(txt(195, 102, 'shadow：仅记录', '7.5', MUTE));
    s.appendChild(svgEl('path', { d: 'M100 42 L150 38', fill: 'none', stroke: SOFT, 'stroke-width': '1.2' }));
    var mir = svgEl('path', { d: 'M100 56 L150 88', fill: 'none', stroke: BP, 'stroke-width': '1.2', 'stroke-dasharray': '3 4' });
    mir.appendChild(anim('stroke-dashoffset', '14;0', '0.9s'));
    s.appendChild(mir);
    var i;
    for (i = 0; i < 3; i++) {
      var r1 = svgEl('circle', { cx: 0, cy: 0, r: 4, fill: INKS });
      r1.appendChild(motion('M10 50 L65 50 L195 38', '2s', (i * 0.7) + 's'));
      s.appendChild(r1);
      var r2 = svgEl('circle', { cx: 0, cy: 0, r: 4, fill: BP, opacity: '0.55' });
      r2.appendChild(motion('M10 50 L65 50 L195 92', '2s', (i * 0.7) + 's'));
      s.appendChild(r2);
    }
    s.appendChild(txt(120, 128, '镜像副本会被丢弃，绝不返回给用户', '8', MUTE, 'start'));
    // canary 份额仪表：按 10 -> 25 -> 50 -> 100 递增，阶段之间设置门控
    var mx = 300, mw = 190, my = 40, mh = 130;
    s.appendChild(txt(mx + mw / 2, 28, 'canary 实时流量占比', '9', INKS));
    s.appendChild(svgEl('rect', { x: mx, y: my, width: mw, height: mh, rx: '3', fill: 'none', stroke: SOFT, 'stroke-width': '1.2' }));
    var fill = svgEl('rect', { x: mx, y: my + mh, width: mw, height: 0, fill: BP, opacity: '0.3' });
    fill.appendChild(anim('height', '13;13;33;33;65;65;130;130;13', '6s', { keyTimes: '0;0.16;0.24;0.4;0.48;0.64;0.72;0.94;1', calcMode: 'spline', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1' }));
    fill.appendChild(anim('y', (my + mh - 13) + ';' + (my + mh - 13) + ';' + (my + mh - 33) + ';' + (my + mh - 33) + ';' + (my + mh - 65) + ';' + (my + mh - 65) + ';' + (my + mh - 130) + ';' + (my + mh - 130) + ';' + (my + mh - 13), '6s', { keyTimes: '0;0.16;0.24;0.4;0.48;0.64;0.72;0.94;1', calcMode: 'spline', keySplines: '0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1' }));
    s.appendChild(fill);
    var steps = [[13, '10%'], [33, '25%'], [65, '50%'], [130, '100%']];
    for (i = 0; i < steps.length; i++) {
      s.appendChild(svgEl('line', { x1: mx, y1: my + mh - steps[i][0], x2: mx + mw, y2: my + mh - steps[i][0], stroke: SOFT, 'stroke-width': '0.7', 'stroke-dasharray': '2 3' }));
      s.appendChild(txt(mx + mw + 6, my + mh - steps[i][0] + 3, steps[i][1], '8', MUTE, 'start'));
    }
    var gate = entry(mx + mw / 2, my + mh + 20, '6s', '0s', 0.16, 0.22);
    gate.appendChild(txt(0, 3, '门控：延迟、成本、拒绝、长度、反馈', '8', WARN));
    s.appendChild(gate);
    s.appendChild(txt(260, 238, '每一步都会等待指标门控通过；回滚只需切换策略', '9', MUTE));
    shell(host, '先 SHADOW，再 CANARY', '先镜像，再让实时流量逐级通过指标门控', s,
      'Shadow 模式会把生产请求复制给候选 Model，并丢弃其回答，从而在用户风险为零的情况下发现成本激增和分布漂移。之后才启动 canary 递增：10%、25%、50%、100%，每一步都由延迟百分位数、单次请求成本、拒绝率、输出长度分布和用户反馈进行门控。回滚只需切换策略，耗时以秒计，绝不需要重新部署。');
  }

  // ── i4-incident-agents：Supervisor 分流给多个 Agent，由人工门控执行操作 ─
  // 23-sre-for-ai
  function incidentAgents(host) {
    var s = svg(250);
    var agents = [[52, '日志'], [118, '指标'], [184, 'runbook']];
    s.appendChild(rect(30, 96, 80, 44, BG, INK));
    s.appendChild(txt(70, 114, 'Supervisor', '9', INK));
    s.appendChild(txt(70, 128, '分诊', '8', MUTE));
    var alert = svgEl('g', {}, [svgEl('circle', { cx: 0, cy: 0, r: 6, fill: WARN }), txt(0, 3, '!', '9', BG)]);
    alert.appendChild(motion('M-20 118 L30 118', '5.4s', '0s'));
    alert.appendChild(anim('opacity', '1;1;0;0', '5.4s', { keyTimes: '0;0.09;0.11;1' }));
    s.appendChild(alert);
    var i;
    for (i = 0; i < agents.length; i++) {
      var ax = 220, ay = agents[i][0];
      s.appendChild(rect(ax, ay - 16, 86, 34, BG, BP));
      s.appendChild(txt(ax + 43, ay + 4, agents[i][1] + ' Agent', '8.5', BP));
      s.appendChild(svgEl('path', { d: 'M110 112 L' + ax + ' ' + ay, fill: 'none', stroke: SOFT, 'stroke-width': '1', 'stroke-dasharray': '3 4' }));
      // 发出查询，返回证据
      var qd = svgEl('circle', { cx: 0, cy: 0, r: 4, fill: BP });
      qd.appendChild(motion('M70 118 L' + (ax + 43) + ' ' + ay + ' L70 118', '5.4s', (0.6 + i * 0.25) + 's'));
      qd.appendChild(anim('opacity', '0;1;1;0;0', '5.4s', { keyTimes: '0;0.12;0.5;0.55;1', begin: (0.6 + i * 0.25) + 's' }));
      s.appendChild(qd);
    }
    var hyp = entry(70, 178, '5.4s', '0s', 0.55, 0.64);
    hyp.appendChild(svgEl('rect', { x: -55, y: -14, width: 110, height: 28, rx: '4', fill: SURF, stroke: BP, 'stroke-width': '1.2' }));
    hyp.appendChild(txt(0, -1, '假设：', '8', BP));
    hyp.appendChild(txt(0, 10, 'vLLM OOM，KV 激增', '8', INKS));
    s.appendChild(hyp);
    s.appendChild(rect(350, 96, 66, 44, BG, WARN));
    s.appendChild(txt(383, 114, '人工', '9', WARN));
    s.appendChild(txt(383, 128, '批准？', '8', MUTE));
    s.appendChild(rect(440, 96, 66, 44, BG, INKS));
    s.appendChild(txt(473, 114, '操作', '9', INKS));
    s.appendChild(txt(473, 128, '重启 pod', '7.5', MUTE));
    var toGate = svgEl('circle', { cx: 0, cy: 0, r: 4.5, fill: BP });
    toGate.appendChild(motion('M125 178 L383 178 L383 118 L383 118 L473 118', '5.4s', '0s'));
    toGate.appendChild(anim('opacity', '0;0;1;1;1;0', '5.4s', { keyTimes: '0;0.66;0.7;0.82;0.95;1' }));
    s.appendChild(toGate);
    var ok = entry(383, 78, '5.4s', '0s', 0.8, 0.86);
    ok.appendChild(txt(0, 3, '已批准', '8', WARN));
    s.appendChild(ok);
    s.appendChild(txt(260, 238, 'Agent 并行收集证据；判断仍由人工完成', '9', MUTE));
    shell(host, 'AI SRE 分诊', 'Supervisor 分流，证据汇聚，由人工为修复操作把关', s,
      '告警首先到达 Supervisor Agent，由它把查询分流给多个专家：一个检索日志，一个将指标与部署关联，一个匹配 runbook。在任何人打开 Dashboard 之前，它们的证据会先汇聚成一个假设。修复操作仍须通过人工审批门控，而自主操作范围保持狭窄：重启 pod、回滚部署，但绝不会在凌晨 3 点重新设计服务架构。');
  }

  // ── i4-chaos-guard：故障持续注入，直到消耗率防护栏中止实验 ─────────────
  // 24-chaos-engineering-llm
  function chaosGuard(host) {
    var s = svg(240);
    s.appendChild(rect(40, 40, 110, 44, BG, INKS));
    s.appendChild(txt(95, 58, '控制平面', '9', INKS));
    s.appendChild(txt(95, 72, '调度器', '8', MUTE));
    s.appendChild(rect(230, 90, 130, 60, BG, INK));
    s.appendChild(txt(295, 112, '目标：LLM 服务', '9', INK));
    s.appendChild(txt(295, 128, 'KV cache、Gateway', '8', MUTE));
    // 向目标触发三个故障：前两个生效，第三个被中止
    var faults = [['429 风暴', '0s', BP], ['KV 驱逐', '1.8s', BP], ['网络丢包', '3.6s', WARN]];
    var i;
    for (i = 0; i < faults.length; i++) {
      var g = svgEl('g', {}, [
        svgEl('rect', { x: -26, y: -9, width: 52, height: 18, rx: '3', fill: BG, stroke: faults[i][2], 'stroke-width': '1.2' }),
        txt(0, 3, faults[i][0], '7.5', faults[i][2])
      ]);
      var land = i < 2;
      g.appendChild(motion(land ? 'M95 84 L95 120 L226 120' : 'M95 84 L95 120 L180 120 L180 120', '5.4s', faults[i][1]));
      g.appendChild(anim('opacity', land ? '0;1;1;0;0' : '0;1;1;1;0;0', '5.4s',
        { keyTimes: land ? '0;0.05;0.3;0.34;1' : '0;0.05;0.28;0.32;0.36;1', begin: faults[i][1] }));
      s.appendChild(g);
    }
    // 安全平面：错误预算消耗仪表上升，超过 2x 后触发中止
    var bx = 410, by = 40, bh = 110;
    s.appendChild(txt(bx + 20, 30, '预算消耗', '8.5', INKS));
    s.appendChild(svgEl('rect', { x: bx, y: by, width: 40, height: bh, rx: '3', fill: 'none', stroke: SOFT, 'stroke-width': '1.2' }));
    s.appendChild(svgEl('line', { x1: bx - 4, y1: by + 36, x2: bx + 44, y2: by + 36, stroke: WARN, 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
    s.appendChild(txt(bx + 58, by + 39, '2x', '8', WARN, 'start'));
    var burn = svgEl('rect', { x: bx + 3, y: by + bh - 3, width: 34, height: 0, fill: BP, opacity: '0.45' });
    burn.appendChild(anim('height', '0;20;44;80;80;0', '5.4s', { keyTimes: '0;0.2;0.45;0.68;0.94;1', calcMode: 'spline', keySplines: EASE + ';' + EASE + ';' + EASE + ';0 0 1 1;0.4 0 1 1' }));
    burn.appendChild(anim('y', (by + bh - 3) + ';' + (by + bh - 23) + ';' + (by + bh - 47) + ';' + (by + bh - 83) + ';' + (by + bh - 83) + ';' + (by + bh - 3), '5.4s', { keyTimes: '0;0.2;0.45;0.68;0.94;1', calcMode: 'spline', keySplines: EASE + ';' + EASE + ';' + EASE + ';0 0 1 1;0.4 0 1 1' }));
    burn.appendChild(anim('fill', BP + ';' + BP + ';' + BP + ';' + WARN + ';' + WARN + ';' + BP, '5.4s', { keyTimes: '0;0.2;0.45;0.68;0.94;1' }));
    s.appendChild(burn);
    var abort = entry(260, 190, '5.4s', '0s', 0.66, 0.72);
    abort.appendChild(svgEl('rect', { x: -92, y: -13, width: 184, height: 26, rx: '4', fill: SURF, stroke: WARN, 'stroke-width': '1.4' }));
    abort.appendChild(txt(0, 4, '防护栏：消耗 > 2x，实验暂停', '8.5', WARN));
    s.appendChild(abort);
    s.appendChild(txt(260, 228, '故障必须按计划注入，绝不能失控：安全平面始终可以中止实验', '9', MUTE));
    shell(host, '带约束的混沌实验', '注入的故障持续运行，直到消耗率防护栏中止实验', s,
      '控制平面安排针对目标的故障：429 风暴、KV cache 驱逐、网络中断。安全平面会全程监控错误预算消耗仪表。当每日消耗超过预期速率的两倍时，防护栏会在实验进行期间将其中止，最后一个故障不会生效。没有这种约束的混沌实验，只是一次你主动报名参加的宕机。');
  }

  // ── i4-vault-rotation：密钥在 vault 中轮换，Gateway 实时获取新密钥 ────
  // 25-security-secrets-audit
  function vaultRotation(host) {
    var s = svg(240);
    s.appendChild(rect(40, 80, 90, 70, BG, INK));
    s.appendChild(txt(85, 72, 'vault', '9', INK));
    // 存储的密钥芯片：旧密钥淡出，新密钥在原位放大进入
    var oldKey = svgEl('g', { transform: 'translate(85 115)' }, [
      svgEl('rect', { x: -30, y: -10, width: 60, height: 20, rx: '3', fill: WARN, opacity: '0.8' }),
      txt(0, 4, '密钥 v1', '8.5', BG)
    ]);
    oldKey.appendChild(anim('opacity', '1;1;0;0;1', '5.6s', { keyTimes: '0;0.3;0.36;0.96;1' }));
    s.appendChild(oldKey);
    var newKey = entry(85, 115, '5.6s', '0s', 0.36, 0.46);
    newKey.appendChild(svgEl('rect', { x: -30, y: -10, width: 60, height: 20, rx: '3', fill: BP }));
    newKey.appendChild(txt(0, 4, '密钥 v2', '8.5', BG));
    s.appendChild(newKey);
    var rot = entry(85, 166, '5.6s', '0s', 0.3, 0.38);
    rot.appendChild(txt(0, 3, '已轮换，<=90 天', '8', MUTE));
    s.appendChild(rot);
    s.appendChild(rect(220, 85, 100, 60, BG, INKS));
    s.appendChild(txt(270, 107, 'AI Gateway', '9', INKS));
    s.appendChild(txt(270, 122, '运行时拉取', '7.5', MUTE));
    var pull = svgEl('path', { d: 'M130 115 L220 115', fill: 'none', stroke: BP, 'stroke-width': '1.4', 'stroke-dasharray': '4 4' });
    pull.appendChild(anim('stroke-dashoffset', '16;0', '0.8s'));
    s.appendChild(pull);
    // 密钥材料仅从 vault 传往 Gateway；轮换后颜色发生变化
    var kd = svgEl('rect', { x: -7, y: -5, width: 14, height: 10, rx: '2', fill: WARN });
    kd.appendChild(motion('M115 115 L215 115', '2.8s', '0s'));
    kd.appendChild(anim('fill', WARN + ';' + WARN + ';' + BP + ';' + BP, '5.6s', { keyTimes: '0;0.35;0.44;1' }));
    s.appendChild(kd);
    // 应用通过 Gateway 发起调用，绝不持有凭据
    var apps = [[55, '应用 A'], [115, '应用 B'], [175, '应用 C']];
    var i;
    for (i = 0; i < apps.length; i++) {
      s.appendChild(rect(400, apps[i][0] - 14, 76, 30, BG, SOFT));
      s.appendChild(txt(438, apps[i][0] + 5, apps[i][1], '8.5', MUTE));
      s.appendChild(svgEl('path', { d: 'M400 ' + apps[i][0] + ' L324 ' + (100 + i * 12), fill: 'none', stroke: SOFT, 'stroke-width': '1' }));
      var rq = svgEl('circle', { cx: 0, cy: 0, r: 3.5, fill: INKS });
      rq.appendChild(motion('M438 ' + (apps[i][0] + 12) + ' L270 130', '2.2s', (i * 0.7) + 's'));
      s.appendChild(rq);
    }
    s.appendChild(txt(438, 190, 'env 文件或 VCS 中没有密钥', '8', MUTE));
    s.appendChild(txt(260, 228, '只在 vault 中轮换一次；所有应用数分钟内更新，无需重新部署', '9', MUTE));
    shell(host, '基于 VAULT 的轮换', '密钥只在一个位置变更，Gateway 会实时获取新密钥', s,
      '凭据仅存放在 vault 中。应用调用 AI Gateway，由它在运行时拉取当前密钥，因此任何服务都不会持有静态密钥。当密钥 v1 轮换为 v2 时，只需在一个位置完成替换，所有调用方都能在数分钟内更新：无需重新部署，无需修改 40 个配置文件，也不会再有人发消息询问谁拿到了新密钥。90 天轮换策略不再是一场迁移，而会变成一件平淡无奇的例行操作。');
  }

  // ── i4-control-matrix：一个控制措施点亮多个框架行中的单元格 ──────────
  // 26-compliance-frameworks
  function controlMatrix(host) {
    var s = svg(250);
    var rows = [['SOC 2 II', 1], ['GDPR', 1], ['HIPAA', 1], ['EU AI Act', 0], ['ISO 42001', 0]];
    var cols = [['访问控制', 140], ['PII 脱敏', 250], ['审计日志', 360]];
    // 各控制措施满足哪些框架（1 = 点亮单元格）
    var map = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [0, 1, 1], [1, 0, 1]];
    var i, j;
    for (j = 0; j < cols.length; j++) { s.appendChild(txt(cols[j][1] + 40, 38, cols[j][0], '8.5', INKS)); }
    for (i = 0; i < rows.length; i++) {
      var ry = 54 + i * 34;
      s.appendChild(txt(126, ry + 15, rows[i][0], '8.5', MUTE, 'end'));
      for (j = 0; j < cols.length; j++) {
        s.appendChild(svgEl('rect', { x: cols[j][1], y: ry, width: 80, height: 24, rx: '2', fill: 'none', stroke: SOFT, 'stroke-width': '1' }));
        if (map[i][j]) {
          var c = svgEl('rect', { x: cols[j][1] + 2, y: ry + 2, width: 76, height: 20, rx: '2', fill: BP, opacity: '0' });
          c.appendChild(anim('opacity', '0;0;0.35;0.35;0', '5.2s', { keyTimes: '0;' + (0.1 + j * 0.22).toFixed(2) + ';' + (0.16 + j * 0.22).toFixed(2) + ';0.94;1', calcMode: 'spline', keySplines: SPL4, begin: (i * 0.05).toFixed(2) + 's' }));
          s.appendChild(c);
        }
      }
    }
    // 一项已实施的控制措施扫过其列，点亮映射到的每一行
    var chip = svgEl('g', {}, [
      svgEl('rect', { x: -38, y: -10, width: 76, height: 20, rx: '3', fill: BG, stroke: BP, 'stroke-width': '1.4' }),
      txt(0, 4, '只构建一次', '8', BP)
    ]);
    chip.appendChild(motion('M180 24 L180 24 L290 24 L290 24 L400 24 L400 24', '5.2s', '0s'));
    s.appendChild(chip);
    s.appendChild(txt(260, 238, '一个控制措施，多个单元格：Matrix 填充速度快于框架数量增长速度', '9', MUTE));
    shell(host, '控制措施交叉映射', '每项控制措施都会点亮其满足的所有框架单元格', s,
      '采购团队需要一张每个框架占一行的 Matrix，而应对它的方法是交叉映射。一项访问控制实现可以同时点亮 SOC 2、GDPR Article 32、HIPAA 164.312(a) 和 ISO 的单元格；PII 脱敏和审计日志则分别扫过各自的列。每项控制措施只构建一次，却可以重复用于多项声明，因此五个框架的成本远低于五次审计，而剩余缺口也会清楚地显示为某个框架特有的问题，而非无处不在的问题。');
  }

  // ── i4-spend-ladder：租户仪表上升，其中一个触发上限和终止开关 ────────
  // 27-finops-llms
  function spendLadder(host) {
    var s = svg(250);
    s.appendChild(txt(40, 34, 'Token 进入，在调用点标记 tenant_id', '9', INKS, 'start'));
    var tens = [
      { x: 70, name: '租户 A', fills: '0;44;56;62;62;0', ok: true },
      { x: 220, name: '租户 B', fills: '0;30;38;44;44;0', ok: true },
      { x: 370, name: '租户 C', fills: '0;60;104;118;118;0', ok: false }
    ];
    var by = 60, bh = 120, i;
    for (i = 0; i < tens.length; i++) {
      var t = tens[i];
      s.appendChild(svgEl('rect', { x: t.x, y: by, width: 56, height: bh, rx: '3', fill: 'none', stroke: t.ok ? SOFT : WARN, 'stroke-width': '1.2' }));
      s.appendChild(svgEl('line', { x1: t.x - 4, y1: by + 24, x2: t.x + 60, y2: by + 24, stroke: WARN, 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      s.appendChild(txt(t.x + 28, by + bh + 16, t.name, '8.5', t.ok ? MUTE : WARN));
      var kt = '0;0.25;0.5;0.72;0.94;1';
      var f = svgEl('rect', { x: t.x + 3, y: by + bh - 3, width: 50, height: 0, fill: t.ok ? BP : WARN, opacity: '0.45' });
      f.appendChild(anim('height', t.fills, '5.6s', { keyTimes: kt, calcMode: 'spline', keySplines: EASE + ';' + EASE + ';' + EASE + ';0 0 1 1;0.4 0 1 1' }));
      f.appendChild(anim('y', t.fills.split(';').map(function (v) { return by + bh - 3 - Number(v); }).join(';'), '5.6s', { keyTimes: kt, calcMode: 'spline', keySplines: EASE + ';' + EASE + ';' + EASE + ';0 0 1 1;0.4 0 1 1' }));
      s.appendChild(f);
      // Token 落入每个仪表
      var d = svgEl('circle', { cx: 0, cy: 0, r: 3.5, fill: t.ok ? BP : WARN });
      d.appendChild(motion('M' + (t.x + 28) + ' 40 L' + (t.x + 28) + ' ' + (by + 20), '1.1s', (i * 0.3) + 's'));
      s.appendChild(d);
    }
    s.appendChild(txt(36, by + 27, '上限', '8', WARN, 'start'));
    // 租户 C 超过每日上限：终止开关触发，输入被切断
    var kill = entry(398, 44, '5.6s', '0s', 0.52, 0.6);
    kill.appendChild(svgEl('rect', { x: -62, y: -12, width: 124, height: 24, rx: '4', fill: SURF, stroke: WARN, 'stroke-width': '1.4' }));
    kill.appendChild(txt(0, 4, 'z > 4：终止开关，429', '8', WARN));
    s.appendChild(kill);
    s.appendChild(txt(260, 238, '先限速，再设支出上限，最后触发终止开关：A 和 B 不受 C 影响', '9', MUTE));
    shell(host, '租户支出仪表', '每租户仪表持续上升，直到其中一个触发执行阶梯', s,
      '每次调用在创建时都会标记 tenant_id，因此支出会实时落入正确的仪表，而不是依赖事后的标签补录。租户 A 和 B 在各自的每日上限内正常增长。租户 C 的支出激增并越过上限线，其支出 z-score 超过 4，终止开关开始返回 429，同时通知 on-call 人员。执行阶梯依次采用限速、支出上限和终止开关，将影响范围限制在单个仪表内。');
  }

  LF.register({
    'i4-platform-lanes': platformLanes,
    'i4-otel-glue': otelGlue,
    'i4-canary-ramp': canaryRamp,
    'i4-incident-agents': incidentAgents,
    'i4-chaos-guard': chaosGuard,
    'i4-vault-rotation': vaultRotation,
    'i4-control-matrix': controlMatrix,
    'i4-spend-ladder': spendLadder
  });
})();
