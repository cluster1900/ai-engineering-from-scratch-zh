/* figures-misc2.js：跨越 Phase 15（自主系统）、Phase 17（基础设施与生产）
   和 Phase 11（LLM 工程）的动画课程图示。在 lesson-figures.js 之后加载，
   并通过 window.LF.register 注册。原生 ES5、无依赖、通过 CSS 变量适配主题。
   动画仅使用 SMIL（animate / animateMotion / animateTransform）。编写方式与
   以下 fenced block 相同：
       ```figure
       mx-tool-call-loop
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  var BP = 'var(--blueprint,#3553ff)';
  var SOFT = 'var(--rule-soft,#ccc)';
  var MUTE = 'var(--ink-mute,#999)';
  var WARN = 'var(--warn,#b8870f)';
  var INK = 'var(--ink,#1a1a1a)';
  var BG = 'var(--bg,#fafaf5)';

  function shell(host, label, sub, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function motion(path, dur, begin) {
    return svgEl('animateMotion', { path: path, dur: dur, begin: begin || '0s', repeatCount: 'indefinite' });
  }
  function box(x, y, w, h, fill, stroke) {
    return svgEl('rect', { x: x, y: y, width: w, height: h, rx: 4, fill: fill || 'none', stroke: stroke || SOFT, 'stroke-width': 1.4 });
  }
  function txt(x, y, s, size, fill, anchor) {
    return svgEl('text', { x: x, y: y, 'font-family': 'var(--font-mono,monospace)', 'font-size': size || 11, fill: fill || MUTE, 'text-anchor': anchor || 'middle' }, [document.createTextNode(s)]);
  }

  // ── mx-propose-then-commit：持久化记录依次经过提议→审查→提交→验证
  // phases/15-autonomous-systems/15-propose-then-commit
  function proposeThenCommit(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var stages = [
      { x: 40, t: '提议', s: '持久化 + key' },
      { x: 170, t: '审查', s: '意图 · 影响范围' },
      { x: 300, t: '提交', s: '明确确认' },
      { x: 430, t: '验证', s: '产生副作用？' }
    ];
    stages.forEach(function (st, i) {
      svg.appendChild(svgEl('rect', { x: st.x, y: 80, width: 90, height: 50, rx: 4, fill: 'none', stroke: SOFT, 'stroke-width': 1.6 }));
      var active = svgEl('rect', { x: st.x, y: 80, width: 90, height: 50, rx: 4, fill: 'none', stroke: BP, 'stroke-width': 1.6, 'stroke-opacity': 0 });
      active.appendChild(anim('stroke-opacity', '0;1;0', '6.4s', { begin: (i * 1.6) + 's' }));
      svg.appendChild(active);
      svg.appendChild(txt(st.x + 45, 102, st.t, 9, INK));
      svg.appendChild(txt(st.x + 45, 118, st.s, 7.5, MUTE));
      if (i < 3) svg.appendChild(svgEl('path', { d: 'M' + (st.x + 90) + ' 105 L' + (st.x + 130) + ' 105', fill: 'none', stroke: SOFT, 'stroke-width': 1.2 }));
    });
    // 持久化记录 Token 在各阶段之间移动并循环
    var rec = svgEl('g', {}, [svgEl('rect', { x: -11, y: -9, width: 22, height: 18, rx: 3, fill: BP }), txt(0, 4, '记录', 7.5, BG)]);
    rec.appendChild(motion('M85 105 L215 105 L345 105 L475 105', '6.4s', '0s'));
    svg.appendChild(rec);
    // 走过场警告：从审查快速跳过提交，被标记出来
    var stamp = txt(215, 60, '走过场：跳过审查', 8, WARN);
    stamp.appendChild(anim('opacity', '0;0;0;1;1;0', '6.4s', { begin: '1.6s' }));
    svg.appendChild(stamp);
    svg.appendChild(txt(260, 175, 'idempotency key = 重新提交时返回同一条记录', 8.5, MUTE));
    svg.appendChild(txt(260, 192, '仅在明确确认后提交；验证用于确认效果已实际生效', 8.5, MUTE));
    shell(host, '先提议，再提交', '持久化提议依次通过四个设有门控的阶段', svg,
      '2026 年的 HITL 形态并不是同步的“批准”Prompt。系统会使用 idempotency key 持久化拟议操作，连同意图、影响范围和回滚计划一起呈现，仅在收到明确确认后提交，随后通过验证确认副作用确实发生。其失败模式是走过场：未经审查便点击“批准”。有明确检查清单的质询与响应机制是文档所述的缓解措施。');
  }

  // ── mx-priority-tiers：四层优先级解析器，更高层级始终胜出 ──────────
  // phases/15-autonomous-systems/17-constitutional-ai
  function priorityTiers(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var tiers = [
      { y: 40, t: '1 · 安全 + 监督', c: WARN, w: 380, hard: true },
      { y: 88, t: '2 · 伦理', c: BP, w: 300, hard: false },
      { y: 136, t: '3 · ANTHROPIC 指南', c: MUTE, w: 230, hard: false },
      { y: 184, t: '4 · 有用性', c: SOFT, w: 160, hard: false }
    ];
    tiers.forEach(function (ti, i) {
      var x = (W - ti.w) / 2;
      svg.appendChild(svgEl('rect', { x: x, y: ti.y, width: ti.w, height: 36, rx: 4, fill: 'none', stroke: ti.c, 'stroke-width': i === 0 ? 2 : 1.4 }));
      svg.appendChild(txt(W / 2, ti.y + 23, ti.t, 9.5, ti.hard ? WARN : INK));
    });
    // 请求信号逐层上升，并在最高层级得到解析
    var probe = svgEl('circle', { cx: W / 2 + 130, cy: 202, r: 6, fill: BP });
    probe.appendChild(anim('cy', '202;202;154;106;58;58', '5s'));
    probe.appendChild(anim('cx', (W / 2 + 130) + ';' + (W / 2 + 130) + ';' + (W / 2 + 90) + ';' + (W / 2 + 40) + ';' + (W / 2) + ';' + (W / 2), '5s'));
    svg.appendChild(probe);
    var win = txt(W / 2, 30, '冲突 → 更高层级胜出', 9, WARN);
    win.appendChild(anim('opacity', '0;0;0;0;1;1', '5s'));
    svg.appendChild(win);
    svg.appendChild(txt(W / 2, 228, '第 1 层是硬编码的：运维人员和用户均无法覆盖', 8.5, MUTE));
    shell(host, '宪法优先级层次', '四个按优先级排序的层次；冲突向上解析', svg,
      '2026 年版 Claude Constitution 将行为分为四个层级：安全与支持人类监督优先，伦理次之，Anthropic 指南居第三，有用性最后。层级发生冲突时，更高层级胜出，其形态与 Unix 优先级或网络 QoS 相同。硬编码禁令位于整个层次结构之上，无法被覆盖；其余内容则在层次结构中基于推理处理，以审计能力换取对未见场景的泛化能力。');
  }

  // ── mx-research-loop：假设→代码→运行→批判循环，包含 sandbox + 审查
  // phases/15-autonomous-systems/05-ai-scientist-v2
  function researchLoop(host) {
    var W = 520, H = 240, CX = 260, CY = 120, R = 78;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var nodes = [
      { a: -90, t: '想法', c: BP },
      { a: -18, t: '有新意？', c: MUTE },
      { a: 54, t: '实验', c: BP },
      { a: 126, t: 'sandbox 运行', c: WARN },
      { a: 198, t: '图表', c: BP },
      { a: 270, t: '撰写', c: BP }
    ];
    // 虚线循环环
    var ring = svgEl('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: SOFT, 'stroke-width': 1.4, 'stroke-dasharray': '5 5' });
    ring.appendChild(anim('stroke-dashoffset', '40;0', '2.2s'));
    svg.appendChild(ring);
    nodes.forEach(function (n) {
      var rad = n.a * Math.PI / 180;
      var x = CX + R * Math.cos(rad), y = CY + R * Math.sin(rad);
      svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 5, fill: n.c }));
      var lx = CX + (R + 30) * Math.cos(rad), ly = CY + (R + 30) * Math.sin(rad) + 3;
      svg.appendChild(txt(lx, ly, n.t, 8.5, n.c === WARN ? WARN : INK));
    });
    // 循环指针沿圆环运行
    var ptr = svgEl('circle', { cx: 0, cy: 0, r: 7, fill: BP });
    ptr.appendChild(motion('M' + CX + ' ' + (CY - R) + ' A ' + R + ' ' + R + ' 0 1 1 ' + (CX - 0.1) + ' ' + (CY - R) + ' Z', '5s', '0s'));
    svg.appendChild(ptr);
    // 中央批判标签
    svg.appendChild(txt(CX, CY - 4, 'VLM', 9, INK));
    svg.appendChild(txt(CX, CY + 10, '批判', 8, MUTE));
    svg.appendChild(txt(CX, 224, '42% 的运行因代码错误失败；循环从 sandbox 处重新进入', 8.5, WARN));
    shell(host, '自主研究循环', '想法 → 实验 → sandbox → 批判，反复迭代', svg,
      'AI Scientist v2 无需人工模板即可闭合研究循环：它生成想法、检查新颖性、在 sandbox 中起草并运行实验、让 vision-language model 批判图表，再撰写论文，并根据内部审查持续迭代。其中一篇生成的论文通过了 ICLR 2025 workshop 评审。独立 Evaluation 发现，42% 的实验因代码错误失败，新颖性检查也经常将已有方法误标为新方法，因此循环的 sandbox 环节决定了可靠性。');
  }

  // ── mx-speculative-tree：draft 提议 K 个 Token，target 验证并接受/拒绝
  // phases/17-infrastructure-and-production/05-eagle3-speculative-decoding
  function speculativeTree(host) {
    var W = 520, H = 235;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(box(30, 95, 70, 44, BG, BP));
    svg.appendChild(txt(65, 113, 'draft', 9, BP));
    svg.appendChild(txt(65, 127, 'head', 8, MUTE));
    svg.appendChild(box(370, 95, 80, 44, BG, INK));
    svg.appendChild(txt(410, 113, 'target', 9, INK));
    svg.appendChild(txt(410, 127, '1 次 forward', 8, MUTE));
    // draft 与 target 之间排列着 K 个草拟 Token；最后一个被拒绝
    var ks = [{ x: 140, ok: true }, { x: 190, ok: true }, { x: 240, ok: true }, { x: 290, ok: false }];
    ks.forEach(function (k, i) {
      var tok = svgEl('rect', { x: k.x, y: 102, width: 30, height: 28, rx: 3, fill: 'none', stroke: SOFT, 'stroke-width': 1.4 });
      tok.appendChild(anim('stroke', SOFT + ';' + (k.ok ? BP : WARN) + ';' + (k.ok ? BP : WARN), '4s', { begin: (i * 0.4) + 's' }));
      svg.appendChild(tok);
      svg.appendChild(txt(k.x + 15, 120, 't' + (i + 1), 8, MUTE));
      var mark = txt(k.x + 15, 152, k.ok ? '接受' : '拒绝', 7.5, k.ok ? BP : WARN);
      mark.appendChild(anim('opacity', '0;0;1;1', '4s', { begin: (i * 0.4) + 's' }));
      svg.appendChild(mark);
    });
    // draft 提议（Token 向右流动），target 验证（单个脉冲返回）
    var prop = svgEl('circle', { cx: 0, cy: 0, r: 5, fill: BP });
    prop.appendChild(motion('M100 117 L370 117', '4s', '0s'));
    svg.appendChild(prop);
    var verify = svgEl('rect', { x: 365, y: 90, width: 90, height: 54, rx: 4, fill: 'none', stroke: INK, 'stroke-width': 1 });
    verify.appendChild(anim('opacity', '0.2;1;0.2', '4s', { begin: '1.8s' }));
    svg.appendChild(verify);
    svg.appendChild(txt(260, 185, '接受的 Token 不增加成本；一次拒绝会多消耗一次 target pass', 8.5, MUTE));
    svg.appendChild(txt(260, 202, 'alpha < ~0.55 → speculative decoding 产生负收益', 8.5, WARN));
    shell(host, 'SPECULATIVE DECODING', 'draft 提议 K 个 Token，target 在一次 pass 中完成验证', svg,
      'EAGLE-3 使用 target Model 的 hidden states 训练 draft head，因此其分布会跟随 target，在通用聊天场景中，接受率 alpha 可达到 0.6 至 0.8。draft 提议 K 个 Token；target 在一次 forward 中验证全部 K 个 Token；接受的 Token 经摊销后不增加成本。但每个被拒绝的 draft 都会多消耗一次 target pass，因此在高并发下，当 alpha 低于约 0.55 时，该技术会产生负收益。先在真实流量上测量 alpha，再开启相应 flag。');
  }

  // ── mx-gateway-fallback：一个 API 分流至多个提供商，遇到 429 时重新路由 ────────
  // phases/17-infrastructure-and-production/19-ai-gateways
  function gatewayFallback(host) {
    var W = 520, H = 235;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(box(40, 95, 80, 46, BG, INK));
    svg.appendChild(txt(80, 113, 'gateway', 9, INK));
    svg.appendChild(txt(80, 128, '单一 API', 8, MUTE));
    var prov = [
      { y: 45, t: '主要提供商', s: '429 超出配额', c: WARN, down: true },
      { y: 110, t: 'fallback', s: '处理请求', c: BP, down: false },
      { y: 175, t: 'self-host', s: '备用', c: MUTE, down: false }
    ];
    prov.forEach(function (p) {
      svg.appendChild(box(390, p.y - 20, 110, 40, BG, p.c));
      svg.appendChild(txt(445, p.y - 4, p.t, 9, p.c));
      svg.appendChild(txt(445, p.y + 10, p.s, 7.5, MUTE));
    });
    // 主要链路被阻断（警告色），fallback 链路处于活动状态（蓝色虚线）
    svg.appendChild(svgEl('path', { d: 'M120 108 L388 45', fill: 'none', stroke: WARN, 'stroke-width': 1.2, 'stroke-dasharray': '3 5' }));
    var fb = svgEl('path', { d: 'M120 116 L388 110', fill: 'none', stroke: BP, 'stroke-width': 2, 'stroke-dasharray': '6 4' });
    fb.appendChild(anim('stroke-dashoffset', '20;0', '0.8s'));
    svg.appendChild(fb);
    svg.appendChild(svgEl('path', { d: 'M120 124 L388 175', fill: 'none', stroke: SOFT, 'stroke-width': 1, 'stroke-dasharray': '3 5' }));
    // 传入请求：先尝试主要提供商（被退回），随后路由至 fallback
    var i;
    for (i = 0; i < 4; i++) {
      var g = svgEl('g', {}, [svgEl('circle', { cx: 0, cy: 0, r: 5, fill: BP })]);
      g.appendChild(motion('M-20 116 L80 116 L445 110', '3s', (i * 0.55) + 's'));
      svg.appendChild(g);
    }
    var bounce = txt(250, 60, '429 → 重新路由', 8, WARN);
    bounce.appendChild(anim('opacity', '0.3;1;0.3', '1.6s'));
    svg.appendChild(bounce);
    svg.appendChild(txt(260, 212, '路由 · fallback · 重试 · 速率限制 · 密钥 · 可观测性', 8.5, MUTE));
    shell(host, 'AI GATEWAY FALLBACK', '一个 API 分流至多个提供商；遇到 429 时重新路由至下一个提供商', svg,
      'gateway 位于应用与提供商之间，将路由、fallback、重试、速率限制、密钥引用和可观测性整合到一个兼容 OpenAI 的 API 之后。当主要提供商返回 429 或 5xx 时，gateway 会将请求重新路由至 fallback 提供商，使请求仍能完成。2026 年的选型格局为：LiteLLM（MIT、支持 100 多个提供商、接近 2000 RPS 时性能衰退）、Portkey（control-plane、guardrails）、Kong AI（在其自身 benchmark 中速度最快）、Bifrost（自动重试）。数据驻留要求决定选择 self-host 还是托管服务。');
  }

  // ── mx-sequential-test：累积效应越过提前停止边界 ────
  // phases/17-infrastructure-and-production/21-ab-testing-llm-features
  function sequentialTest(host) {
    var W = 520, H = 230, PAD = 36;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var midY = H / 2;
    function px(t) { return PAD + t * (W - 2 * PAD); }
    function py(v) { return midY - v * (midY - PAD); }
    // 漏斗形序贯边界（始终有效）：早期较宽，后期较窄
    function bound(sign) {
      var d = '', i;
      for (i = 0; i <= 40; i++) {
        var t = i / 40;
        var b = 0.95 / Math.sqrt(0.04 + t);
        b = Math.min(b, 1.05);
        d += (i ? 'L' : 'M') + px(t).toFixed(1) + ' ' + py(sign * b).toFixed(1) + ' ';
      }
      return d;
    }
    svg.appendChild(svgEl('path', { d: bound(1), fill: 'none', stroke: SOFT, 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }));
    svg.appendChild(svgEl('path', { d: bound(-1), fill: 'none', stroke: SOFT, 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }));
    svg.appendChild(svgEl('line', { x1: PAD, y1: midY, x2: W - PAD, y2: midY, stroke: MUTE, 'stroke-width': 1, 'stroke-dasharray': '2 4' }));
    svg.appendChild(txt(W - PAD, py(1) - 6, '拒绝 H0（B 胜出）', 8, BP, 'end'));
    svg.appendChild(txt(W - PAD, midY + 14, '无效应', 8, MUTE, 'end'));
    // 累积检验统计量随机上行，并越过上边界
    var walk = 'M' + px(0) + ' ' + py(0) + ' L' + px(0.12) + ' ' + py(0.18) + ' L' + px(0.24) + ' ' + py(0.1) +
      ' L' + px(0.36) + ' ' + py(0.34) + ' L' + px(0.48) + ' ' + py(0.46) + ' L' + px(0.6) + ' ' + py(0.62) +
      ' L' + px(0.7) + ' ' + py(0.78);
    var path = svgEl('path', { d: walk, fill: 'none', stroke: BP, 'stroke-width': 2 });
    var len = 600;
    path.setAttribute('stroke-dasharray', len);
    path.appendChild(anim('stroke-dashoffset', len + ';0', '4s'));
    svg.appendChild(path);
    var hit = svgEl('circle', { cx: px(0.7), cy: py(0.78), r: 6, fill: BP });
    hit.appendChild(anim('opacity', '0;0;0;1;1', '4s'));
    svg.appendChild(hit);
    var stop = txt(px(0.7), py(0.78) - 12, '提前停止', 8, BP);
    stop.appendChild(anim('opacity', '0;0;0;1;1', '4s'));
    svg.appendChild(stop);
    svg.appendChild(txt(W / 2, H - 10, '查看中间结果是安全的：边界已为每次查看计入代价', 8.5, MUTE));
    shell(host, '序贯 A/B TEST', '累积效应越过始终有效的边界', svg,
      'Evals 询问 Model 能否完成任务；A/B tests 询问用户是否在意。固定时间范围的检验会惩罚查看中间结果，因此 2026 年的平台采用带有始终有效边界的序贯检验：边界在早期较宽，随后逐渐收紧。累积统计量进行随机游走，直至越过边界；此时可以停止并发布。若始终位于边界内，则判定结果无显著差异。CUPED 用于降低 Variance，Benjamini-Hochberg 用于校正同时检验多个变体所产生的问题。');
  }

  // ── mx-schema-funnel：自由文本 → constrained decoding → 经过验证的强类型 JSON ──
  // phases/11-llm-engineering/03-structured-outputs
  function schemaFunnel(host) {
    var W = 520, H = 235;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    // 左侧的自由文本
    svg.appendChild(box(28, 70, 120, 90, BG, MUTE));
    svg.appendChild(txt(88, 60, '自由文本', 9, MUTE));
    [82, 100, 118, 136].forEach(function (ly, i) {
      svg.appendChild(svgEl('line', { x1: 40, y1: ly, x2: 40 + [96, 80, 104, 60][i], y2: ly, stroke: SOFT, 'stroke-width': 3 }));
    });
    // 中间的 constrained decoding 语法门
    svg.appendChild(box(210, 80, 100, 70, BG, BP));
    svg.appendChild(txt(260, 70, '语法门', 9, BP));
    svg.appendChild(txt(260, 108, 'FSM / CFG', 8, MUTE));
    svg.appendChild(txt(260, 124, '屏蔽 logits', 8, MUTE));
    // 右侧的有效 JSON
    svg.appendChild(box(372, 70, 120, 90, BG, INK));
    svg.appendChild(txt(432, 60, '强类型 JSON', 9, INK));
    svg.appendChild(txt(432, 95, '{ name, price,', 8, BP, 'middle'));
    svg.appendChild(txt(432, 110, '  in_stock }', 8, BP, 'middle'));
    // 连接线
    svg.appendChild(svgEl('path', { d: 'M148 115 L210 115', fill: 'none', stroke: SOFT, 'stroke-width': 1.4 }));
    var g2 = svgEl('path', { d: 'M310 115 L372 115', fill: 'none', stroke: BP, 'stroke-width': 2, 'stroke-dasharray': '6 4' });
    g2.appendChild(anim('stroke-dashoffset', '20;0', '0.8s'));
    svg.appendChild(g2);
    // Token 通过语法门；无效 Token（警告色）被屏蔽，有效 Token 则通过
    var spec = [{ ok: true, b: '0s' }, { ok: false, b: '0.7s' }, { ok: true, b: '1.4s' }, { ok: true, b: '2.1s' }];
    spec.forEach(function (s) {
      var c = svgEl('circle', { cx: 0, cy: 0, r: 5, fill: s.ok ? BP : WARN });
      if (s.ok) {
        c.appendChild(motion('M150 115 L260 115 L432 115', '3.2s', s.b));
      } else {
        c.appendChild(motion('M150 115 L255 115 L255 175', '3.2s', s.b));
      }
      svg.appendChild(c);
    });
    var drop = txt(255, 195, '无效 Token 在语法门处被屏蔽', 8, WARN);
    svg.appendChild(drop);
    svg.appendChild(txt(260, 218, 'constrained decoding 禁止任何破坏 schema 的 Token', 8.5, MUTE));
    shell(host, '结构化输出漏斗', '自由文本通过语法约束，被强制转换为强类型 JSON', svg,
      'LLM 返回的是字符串，而应用需要强类型 JSON。在 Prompt 中添加“以 JSON 响应”大约 90% 的情况下有效，其余情况则会导致崩溃。constrained decoding 在 Token 层面弥合了这一缺口：finite-state machine 或语法会屏蔽 logits，使任何可能破坏 schema 的 Token 在采样前就被禁止。输出在构造时便是有效 JSON，而非通过后处理得到；Pydantic 层会验证类型，并在极少数失误发生时重试。');
  }

  // ── mx-tool-call-loop：Model 发出调用 JSON → 执行 → 返回结果 → 回答
  // phases/11-llm-engineering/09-function-calling
  function toolCallLoop(host) {
    var W = 520, H = 235;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(box(60, 90, 110, 56, BG, BP));
    svg.appendChild(txt(115, 112, 'Model', 9.5, BP));
    svg.appendChild(txt(115, 128, '大脑', 8, MUTE));
    svg.appendChild(box(350, 90, 110, 56, BG, INK));
    svg.appendChild(txt(405, 112, '你的代码', 9.5, INK));
    svg.appendChild(txt(405, 128, '双手', 8, MUTE));
    // 上方弧线：Model 将调用 JSON 发送给代码
    var out = svgEl('path', { d: 'M170 100 C 240 50, 290 50, 350 100', fill: 'none', stroke: BP, 'stroke-width': 1.8, 'stroke-dasharray': '6 4' });
    out.appendChild(anim('stroke-dashoffset', '20;0', '0.8s'));
    svg.appendChild(out);
    svg.appendChild(txt(260, 56, '调用：get_weather("Tokyo")', 8.5, BP));
    // 下方弧线：代码将结果返回给 Model
    var back = svgEl('path', { d: 'M350 136 C 290 186, 240 186, 170 136', fill: 'none', stroke: INK, 'stroke-width': 1.8, 'stroke-dasharray': '6 4' });
    back.appendChild(anim('stroke-dashoffset', '0;20', '0.8s'));
    svg.appendChild(back);
    svg.appendChild(txt(260, 182, '结果：15°C', 8.5, INK));
    // 一个 Token 沿发送弧线移动，随后一个结果 Token 沿返回弧线移动，如此循环
    var callTok = svgEl('rect', { x: -10, y: -7, width: 20, height: 14, rx: 2, fill: BP });
    callTok.appendChild(motion('M170 100 C 240 50, 290 50, 350 100', '2.8s', '0s'));
    callTok.appendChild(anim('opacity', '1;1;0;0', '2.8s'));
    svg.appendChild(callTok);
    var resTok = svgEl('rect', { x: -10, y: -7, width: 20, height: 14, rx: 2, fill: INK });
    resTok.appendChild(motion('M350 136 C 290 186, 240 186, 170 136', '2.8s', '1.4s'));
    resTok.appendChild(anim('opacity', '0;1;1;0', '2.8s', { begin: '1.4s' }));
    svg.appendChild(resTok);
    svg.appendChild(txt(260, 215, '循环直至 Model 停止请求调用，随后生成回答', 8.5, MUTE));
    shell(host, 'FUNCTION CALLING 循环', 'Model 发出调用 JSON；你的代码执行调用并将结果送回', svg,
      'LLM 只能生成文本，因此无法查询天气或数据库。Function calling 是弥合这一缺口的协议：Model 输出结构化 JSON，指明要调用的函数及其参数；你的代码执行该函数，再将结果送回对话。Model 是大脑，Tool 是双手，而循环则是神经系统。这个过程会反复执行，直至 Model 停止请求调用并生成最终答案，同时使用防护措施避免并行调用和无限 Tool 循环。');
  }

  LF.register({
    'mx-propose-then-commit': proposeThenCommit,
    'mx-priority-tiers': priorityTiers,
    'mx-research-loop': researchLoop,
    'mx-speculative-tree': speculativeTree,
    'mx-gateway-fallback': gatewayFallback,
    'mx-sequential-test': sequentialTest,
    'mx-schema-funnel': schemaFunnel,
    'mx-tool-call-loop': toolCallLoop
  });
})();
