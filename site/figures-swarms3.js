/* figures-swarms3.js - Phase 16 的动画式、主题感知图示
   （multi-agent 与 swarms），第三个模块。在 lesson-figures.js 之后加载，
   通过 window.LF 注册。无依赖，仅使用 ES5、SMIL 动画，并通过
   CSS 变量适配主题。编写方式：使用一个 ```figure 块，并指定下方某个 widget 的名称。 */
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
  function motion(path, kt, kp, dur, begin) {
    return svgEl('animateMotion', { path: path, keyTimes: kt, keyPoints: kp, dur: dur + 's', begin: (begin || 0) + 's', repeatCount: 'indefinite', calcMode: 'linear' });
  }

  var BP = 'var(--blueprint,#3553ff)';
  var WARN = 'var(--warn,#b8870f)';
  var SOFT = 'var(--rule-soft,#ddd)';
  var SURF = 'var(--bg-surface,#eee)';
  var BG = 'var(--bg,#fafaf5)';
  var MUTE = 'var(--ink-mute,#777)';

  // ── sw-contract-net：manager 发布任务，三个竞标者闪烁显示报价
  //    并返回，最低报价者获得合同（FIPA contract-net）──────────────────
  function contractNet(host) {
    var W = 520, H = 250, mx = 70, my = 125, period = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var bx = 410, bys = [60, 125, 190], win = 2; // 获胜（报价最低）的竞标者索引
    var i;
    for (i = 0; i < 3; i++) {
      svg.appendChild(svgEl('line', { x1: mx, y1: my, x2: bx, y2: bys[i], stroke: SOFT, 'stroke-width': '1.2' }));
    }
    // 公告脉冲向外传播，随后各个报价错峰返回
    for (i = 0; i < 3; i++) {
      var fwd = 'M' + mx + ',' + my + ' L' + bx + ',' + bys[i];
      var pkt = svgEl('circle', { r: '4', fill: BP });
      pkt.appendChild(anim('opacity', '0;1;1;0;0', '0;0.02;0.2;0.24;1', period));
      pkt.appendChild(motion(fwd, '0;0.2;1', '0;1;1', period));
      svg.appendChild(pkt);
      var back = 'M' + bx + ',' + bys[i] + ' L' + mx + ',' + my;
      var bid = svgEl('circle', { r: '4', fill: (i === win ? WARN : MUTE) });
      bid.appendChild(anim('opacity', '0;0;1;1;0;0', '0;0.3;0.34;0.55;0.6;1', period));
      bid.appendChild(motion(back, '0;0.34;0.6;1', '0;0;1;1', period));
      svg.appendChild(bid);
    }
    var mgr = svgEl('circle', { cx: mx, cy: my, r: '20', stroke: BP, 'stroke-width': '2', fill: SURF });
    svg.appendChild(mgr);
    svg.appendChild(txt(mx, my + 4, 'mgr', '10', BP));
    var labels = ['$9', '$7', '$4'];
    for (i = 0; i < 3; i++) {
      var c = svgEl('circle', { cx: bx, cy: bys[i], r: '16', stroke: (i === win ? WARN : MUTE), 'stroke-width': '2', fill: SURF });
      if (i === win) c.appendChild(anim('fill', SURF + ';' + SURF + ';' + WARN + ';' + WARN + ';' + SURF, '0;0.6;0.66;0.9;1', period));
      svg.appendChild(c);
      svg.appendChild(txt(bx, bys[i] + 4, labels[i], '10', (i === win ? WARN : MUTE)));
    }
    svg.appendChild(txt(W / 2, H - 14, '发布公告  ->  报价返回  ->  最低报价赢得合同', '10', MUTE));
    shell(host, 'CONTRACT NET', '发布、报价、授予', svg,
      'FIPA contract-net 协议将任务分配转化为密封拍卖。manager 广播征求提案，空闲 Agent 以报价响应，随后 manager 将合同授予最佳报价者。MCP tools/call 和现代任务市场，都是以 JSON 原生方式对这一 1980 年机制的重新表述。');
  }

  // ── sw-work-stealing：任务进入共享队列；三个 worker 以异步方式
  //    主动拉取任务，不使用中央 dispatcher ─────────────────────────────
  function workStealing(host) {
    var W = 520, H = 250, qx = 60, qy = 50, qw = 400, period = 6;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('rect', { x: qx, y: qy, width: qw, height: 30, fill: SURF, stroke: SOFT, 'stroke-width': '1.2', rx: '3' }));
    svg.appendChild(txt(qx + qw + 6, qy + 20, '队列', '9', MUTE, 'start'));
    var wx = [120, 260, 400], wy = 190, i, j;
    for (i = 0; i < 3; i++) {
      svg.appendChild(svgEl('rect', { x: wx[i] - 26, y: wy - 22, width: 52, height: 44, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' }));
      svg.appendChild(txt(wx[i], wy + 4, 'w' + i, '11', BP));
    }
    // 六个任务 Token 先进入队列，然后被拉取到某个 worker
    var slots = [90, 150, 210, 270, 330, 390];
    for (j = 0; j < 6; j++) {
      var tgt = j % 3;
      var begin = (j * (period / 6)).toFixed(2);
      var path = 'M' + slots[j] + ',' + (qy + 15) + ' L' + slots[j] + ',' + (qy + 15) + ' L' + wx[tgt] + ',' + (wy - 30);
      var g = svgEl('g', {});
      var sq = svgEl('rect', { x: -5, y: -5, width: 10, height: 10, fill: BP, rx: '2' });
      g.appendChild(sq);
      g.appendChild(anim('opacity', '0;1;1;1;0;0', '0;0.05;0.4;0.7;0.78;1', period, { begin: begin + 's' }));
      g.appendChild(motion(path, '0;0.35;1', '0;0;1', period, begin));
      svg.appendChild(g);
    }
    svg.appendChild(txt(W / 2, H - 14, 'worker 从共享队列拉取任务  ·  没有 orchestrator 决定谁做什么', '10', MUTE));
    shell(host, 'WORK STEALING', '拉取，而非推送', svg,
      'swarm 没有中央 dispatcher。任务进入共享队列，空闲 worker 自行拉取下一个工作单元。协调逻辑存在于队列语义中，因此系统可以持续扩展，直到队列达到极限。代价是确定性：你用单一连贯的计划换取了吞吐量。');
  }

  // ── sw-handoff-routing：对话 Token 在 Agent 之间传递，每次
  //    handoff 都是一次返回下一个 Agent 的 Tool 调用（OpenAI Swarm）──────
  function handoffRouting(host) {
    var W = 520, H = 240, period = 9;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ax = [90, 260, 430], ay = [120, 70, 160], names = ['分流', '账单', '退款'];
    // 链路：分流 -> 账单 -> 退款 -> 分流
    var order = [0, 1, 2, 0];
    var i;
    for (i = 0; i < 3; i++) {
      var nxt = order[i + 1];
      svg.appendChild(svgEl('line', { x1: ax[order[i]], y1: ay[order[i]], x2: ax[nxt], y2: ay[nxt], stroke: SOFT, 'stroke-width': '1.2', 'stroke-dasharray': '4 3' }));
    }
    // 移动中的对话 Token 沿链路传递
    var tok = svgEl('circle', { r: '7', fill: WARN });
    var mpath = 'M' + ax[0] + ',' + ay[0] + ' L' + ax[1] + ',' + ay[1] + ' L' + ax[2] + ',' + ay[2] + ' L' + ax[0] + ',' + ay[0];
    tok.appendChild(motion(mpath, '0;0.33;0.66;1', '0;0.249;0.519;1', period));
    for (i = 0; i < 3; i++) {
      var lit = i === 0 ? '0;0.05;0.28;0.33' : (i === 1 ? '0.33;0.38;0.61;0.66' : '0.66;0.71;0.94;1');
      var kt = i === 0 ? '0;0.05;0.28;0.33;1' : (i === 1 ? '0;0.33;0.38;0.61;0.66;1' : '0;0.66;0.71;0.94;1');
      var vals = i === 0 ? (SURF + ';' + BP + ';' + BP + ';' + SURF + ';' + SURF)
        : i === 1 ? (SURF + ';' + SURF + ';' + BP + ';' + BP + ';' + SURF + ';' + SURF)
          : (SURF + ';' + SURF + ';' + BP + ';' + BP + ';' + SURF);
      var c = svgEl('circle', { cx: ax[i], cy: ay[i], r: '24', stroke: BP, 'stroke-width': '2', fill: SURF });
      c.appendChild(anim('fill', vals, kt, period));
      svg.appendChild(c);
      svg.appendChild(txt(ax[i], ay[i] + 4, names[i], '9', BP));
    }
    svg.appendChild(tok);
    svg.appendChild(txt(W / 2, H - 14, 'handoff = 返回下一个 Agent 的 Tool 调用  ·  谁持有 Token，谁就是 orchestrator', '10', MUTE));
    shell(host, 'HANDOFF ROUTING', '传递对话', svg,
      'OpenAI Swarm 将 orchestration 简化为两个原语：routine（Prompt 加 Tools）和 handoff（返回下一个 Agent 的 Tool）。这里没有状态机。Model 通过调用正确的 handoff 进行路由，而当前持有对话的 Agent 就是负责人。');
  }

  // ── sw-agent-card-discovery：client 读取 Agent Card，然后驱动任务
  //    完成其生命周期状态流转（A2A）────────────────────────────────────
  function agentCard(host) {
    var W = 520, H = 250, period = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var cx = 80, cy = 120;
    svg.appendChild(svgEl('rect', { x: cx - 36, y: cy - 26, width: 72, height: 52, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '4' }));
    svg.appendChild(txt(cx, cy - 4, 'client', '10', BP));
    svg.appendChild(txt(cx, cy + 12, '读取 Card', '7', MUTE));
    // 带有 Agent Card 的远程 Agent
    var rx = 250, ry = 60;
    svg.appendChild(svgEl('rect', { x: rx - 40, y: ry - 22, width: 80, height: 44, fill: SURF, stroke: MUTE, 'stroke-width': '2', rx: '4' }));
    svg.appendChild(txt(rx, ry - 2, 'Agent Card', '9', MUTE));
    svg.appendChild(txt(rx, ry + 12, '/.well-known', '7', MUTE));
    // discovery 数据包：client -> Card
    var disc = svgEl('circle', { r: '4', fill: BP });
    disc.appendChild(anim('opacity', '0;1;1;0;0', '0;0.04;0.16;0.2;1', period));
    disc.appendChild(motion('M' + cx + ',' + (cy - 20) + ' L' + rx + ',' + (ry + 14), '0;0.18;1', '0;1;1', period));
    svg.appendChild(disc);
    // 任务生命周期：已提交 -> 工作中 -> 已完成
    var states = ['已提交', '工作中', '已完成'];
    var sx = [330, 410, 480], sy = 175;
    for (var i = 0; i < 3; i++) {
      var on = i === 0 ? '0;0.2;0.45;0.5' : i === 1 ? '0.5;0.55;0.78;0.8' : '0.8;0.85;0.98;1';
      var kt = i === 0 ? '0;0.2;0.45;0.5;1' : i === 1 ? '0;0.5;0.55;0.78;0.8;1' : '0;0.8;0.85;0.98;1';
      var vals = i === 0 ? (SURF + ';' + WARN + ';' + WARN + ';' + SURF + ';' + SURF)
        : i === 1 ? (SURF + ';' + SURF + ';' + WARN + ';' + WARN + ';' + SURF + ';' + SURF)
          : (SURF + ';' + SURF + ';' + WARN + ';' + WARN + ';' + WARN);
      if (i < 2) svg.appendChild(svgEl('line', { x1: sx[i] + 14, y1: sy, x2: sx[i + 1] - 14, y2: sy, stroke: SOFT, 'stroke-width': '1.2' }));
      var c = svgEl('circle', { cx: sx[i], cy: sy, r: '13', stroke: WARN, 'stroke-width': '1.8', fill: SURF });
      c.appendChild(anim('fill', vals, kt, period));
      svg.appendChild(c);
      svg.appendChild(txt(sx[i], sy + 27, states[i], '7', MUTE));
    }
    svg.appendChild(txt(W / 2, H - 12, '通过 Agent Card 发现能力  ->  提交任务  ->  不透明生命周期返回产物', '9', MUTE));
    shell(host, 'A2A DISCOVERY', '先读取 Card，再执行任务', svg,
      'A2A 是 Agent 之间的横向 wire protocol。client 首先从 well-known URL 获取 Agent Card，了解远程 Agent 能做什么，然后提交任务。该任务会经历一个不透明的生命周期（已提交、工作中、已完成），并返回产物。它本质上是 HTTP 加 REST，只是重新将 Agent 定义为一等对等方。');
  }

  // ── sw-debate-topology：同样的五个 Agent 在 star、chain、
  //    tree 和 graph 之间重新连接；各阶段的边会淡入和淡出 ───────────────
  function debateTopology(host) {
    var W = 520, H = 250, period = 12;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var nx = [260, 130, 390, 175, 345], ny = [70, 140, 140, 210, 210];
    // 四种拓扑，每种都是由 5 个节点间的 [a,b] 边组成的列表
    var topos = [
      [[0, 1], [0, 2], [0, 3], [0, 4]],            // star
      [[0, 1], [1, 3], [3, 4], [4, 2]],            // chain
      [[0, 1], [0, 2], [1, 3], [1, 4]],            // tree
      [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4], [0, 4]] // graph
    ];
    var labels = ['STAR', 'CHAIN', 'TREE', 'GRAPH'];
    // 每个阶段占整个周期的四分之一；为各阶段构建边组
    var p, e;
    for (p = 0; p < 4; p++) {
      var lo = (p / 4), hi = ((p + 1) / 4);
      var edges = topos[p];
      for (e = 0; e < edges.length; e++) {
        var a = edges[e][0], b = edges[e][1];
        var ln = svgEl('line', { x1: nx[a], y1: ny[a], x2: nx[b], y2: ny[b], stroke: BP, 'stroke-width': '1.6', opacity: '0' });
        var kt = '0;' + lo.toFixed(3) + ';' + (lo + 0.03).toFixed(3) + ';' + (hi - 0.03).toFixed(3) + ';' + hi.toFixed(3) + ';1';
        ln.appendChild(anim('opacity', '0;0;1;1;0;0', kt, period));
        svg.appendChild(ln);
      }
      // 阶段标签
      var lt = txt(W / 2, H - 30, labels[p], '11', BP);
      lt.setAttribute('opacity', '0');
      var ktl = '0;' + lo.toFixed(3) + ';' + (lo + 0.02).toFixed(3) + ';' + (hi - 0.02).toFixed(3) + ';' + hi.toFixed(3) + ';1';
      lt.appendChild(anim('opacity', '0;0;1;1;0;0', ktl, period));
      svg.appendChild(lt);
    }
    var i;
    for (i = 0; i < 5; i++) {
      svg.appendChild(svgEl('circle', { cx: nx[i], cy: ny[i], r: '15', stroke: BP, 'stroke-width': '2', fill: SURF }));
      svg.appendChild(txt(nx[i], ny[i] + 4, String(i), '11', BP));
    }
    svg.appendChild(txt(W / 2, H - 12, '相同的 Agent，不同的连接方式  ·  graph 最适合研究，超过约 4 个 Agent 后协调成本上升', '9', MUTE));
    shell(host, 'DEBATE TOPOLOGY', '谁与谁交流', svg,
      '聚合 N 个 Agent 不只是多数投票，连接方式同样重要。star 将一切路由到中心节点，chain 逐个传递接力棒，tree 产生分支，graph 则允许所有 Agent 相互争论。MultiAgentBench 发现 graph 最适合研究任务，但 Agent 数量超过约四个后，协调成本会随之攀升。');
  }

  // ── sw-theory-of-mind：嵌套的信念气泡，Agent A 对 B 关于 C 的信念
  //    建模，并通过脉冲展示递归深度 ────────────────────────────────────
  function theoryOfMind(host) {
    var W = 520, H = 250, period = 9;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ax = 130, ay = 130;
    // Agent A
    svg.appendChild(svgEl('circle', { cx: ax, cy: ay, r: '26', stroke: BP, 'stroke-width': '2.5', fill: SURF }));
    svg.appendChild(txt(ax, ay + 4, 'A', '13', BP));
    // 右侧嵌套的思维气泡：A 对 B 的 Model，以及 B 对 C 的 Model
    var b1x = 300, b1y = 95, b2x = 430, b2y = 130, b3x = 380, b3y = 195;
    // 从 A 头部延伸出的小气泡
    svg.appendChild(svgEl('circle', { cx: ax + 30, cy: ay - 22, r: '3', fill: SOFT }));
    svg.appendChild(svgEl('circle', { cx: ax + 46, cy: ay - 36, r: '4', fill: SOFT }));
    // 第 1 层：A 认为 B 相信……
    var l1 = svgEl('ellipse', { cx: b1x, cy: b1y, rx: '56', ry: '34', stroke: BP, 'stroke-width': '1.8', fill: 'none' });
    l1.appendChild(anim('opacity', '0.25;1;1;0.25;0.25', '0;0.15;0.55;0.7;1', period));
    svg.appendChild(l1);
    svg.appendChild(txt(b1x, b1y - 14, "A 认为", '8', MUTE));
    svg.appendChild(txt(b1x, b1y + 4, 'B', '12', BP));
    // 第 2 层嵌套：B 相信 C
    var l2 = svgEl('ellipse', { cx: b2x, cy: b2y, rx: '40', ry: '26', stroke: WARN, 'stroke-width': '1.8', fill: 'none' });
    l2.appendChild(anim('opacity', '0.15;0.15;1;1;0.15;0.15', '0;0.3;0.45;0.62;0.72;1', period));
    svg.appendChild(l2);
    svg.appendChild(txt(b2x, b2y - 10, 'B 认为', '8', MUTE));
    svg.appendChild(txt(b2x, b2y + 8, 'C', '12', WARN));
    // 最深的第 3 层：C 的目标
    var l3 = svgEl('circle', { cx: b3x, cy: b3y, r: '18', stroke: MUTE, 'stroke-width': '1.6', fill: 'none' });
    l3.appendChild(anim('opacity', '0.1;0.1;0.1;1;1;0.1', '0;0.45;0.55;0.62;0.78;1', period));
    svg.appendChild(l3);
    svg.appendChild(txt(b3x, b3y + 4, '目标', '8', MUTE));
    svg.appendChild(txt(W / 2, H - 12, 'A 推理 B 对 C 的信念  ·  高阶 Theory of Mind 依赖特定 Prompt', '9', MUTE));
    shell(host, 'THEORY OF MIND', '关于信念的信念', svg,
      '真正的协调需要 Agent 对彼此进行建模。高阶 Theory of Mind 是推理一个 Agent 对第三个 Agent 所持有的信念。Riedl 2025 发现，只有在 Theory of Mind Prompt 下，这才会产生真实且由目标驱动的差异化；移除该 Prompt 后，表面上的协调无法通过统计控制检验。');
  }

  // ── sw-ctde：Training 期间 centralized critic 能看到所有 Agent，
  //    随后连接断开，decentralized actor 根据本地视图运行（MARL CTDE）──
  function ctde(host) {
    var W = 520, H = 250, period = 10;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ax = [110, 260, 410], ay = 175;
    var crx = 260, cry = 60;
    // critic 框（仅在 Training 的前半段显示并高亮）
    var critic = svgEl('rect', { x: crx - 50, y: cry - 22, width: 100, height: 44, fill: SURF, stroke: WARN, 'stroke-width': '2', rx: '4' });
    critic.appendChild(anim('opacity', '1;1;0.15;0.15;1', '0;0.45;0.52;0.95;1', period));
    svg.appendChild(critic);
    var ctxt = txt(crx, cry - 2, 'central critic', '9', WARN);
    ctxt.appendChild(anim('opacity', '1;1;0.2;0.2;1', '0;0.45;0.52;0.95;1', period));
    svg.appendChild(ctxt);
    var ptxt = txt(crx, cry + 13, '查看全部信息', '7', MUTE);
    ptxt.appendChild(anim('opacity', '1;1;0;0;1', '0;0.45;0.52;0.95;1', period));
    svg.appendChild(ptxt);
    var i;
    for (i = 0; i < 3; i++) {
      // critic 到 actor 的连接，仅在 Training 的前半段可见
      var ln = svgEl('line', { x1: crx, y1: cry + 22, x2: ax[i], y2: ay - 22, stroke: WARN, 'stroke-width': '1.4', 'stroke-dasharray': '4 3' });
      ln.appendChild(anim('opacity', '1;1;0;0;1', '0;0.45;0.52;0.95;1', period));
      svg.appendChild(ln);
      // actor
      svg.appendChild(svgEl('rect', { x: ax[i] - 28, y: ay - 22, width: 56, height: 44, fill: SURF, stroke: BP, 'stroke-width': '2', rx: '3' }));
      svg.appendChild(txt(ax[i], ay + 2, 'actor ' + i, '8', BP));
      svg.appendChild(txt(ax[i], ay + 15, '本地观测', '7', MUTE));
    }
    // 阶段标签在 Training / Execution 之间切换
    var tl = txt(W / 2, H - 30, 'TRAIN：critic 查看全部信息', '10', WARN);
    tl.appendChild(anim('opacity', '1;1;0;0;1', '0;0.45;0.5;0.95;1', period));
    svg.appendChild(tl);
    var el2 = txt(W / 2, H - 30, 'EXECUTE：actor 独立运行', '10', BP);
    el2.setAttribute('opacity', '0');
    el2.appendChild(anim('opacity', '0;0;1;1;0', '0;0.5;0.55;0.92;1', period));
    svg.appendChild(el2);
    svg.appendChild(txt(W / 2, H - 12, 'centralized Training、decentralized Execution  ·  Training 使用全局信息，测试使用本地 policy', '9', MUTE));
    shell(host, 'CTDE', '全局 Training，本地运行', svg,
      'Centralized Training, Decentralized Execution 是协作式 MARL 的主干。Training 期间，critic 能看到每个 Agent 的状态和动作，从而解决困扰独立学习者的非平稳性问题。测试时 critic 被移除，每个 actor 只根据自己的本地观测运行。MADDPG、QMIX 和 MAPPO 是对同一种拆分方式的三种实现。');
  }

  // ── sw-checkpoint-replay：worker 推进任务后崩溃，lease 被释放，
  //    新 worker 从最后一个 Checkpoint 恢复执行 ───────────────────────
  function checkpointReplay(host) {
    var W = 520, H = 250, period = 10;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    // Checkpoint 日志：一条线上的四个步骤
    var stx = [110, 210, 310, 410], sty = 80;
    var i;
    svg.appendChild(svgEl('line', { x1: 80, y1: sty, x2: 440, y2: sty, stroke: SOFT, 'stroke-width': '1.4' }));
    for (i = 0; i < 4; i++) {
      var lit = i === 0 ? '0;0.05;1' : i === 1 ? '0;0.2;0.25;1' : i === 2 ? '0;0.35;0.4;1' : '0;0.78;0.83;1';
      var vals = i === 0 ? (SURF + ';' + BP + ';' + BP) : i === 1 ? (SURF + ';' + SURF + ';' + BP + ';' + BP) : i === 2 ? (SURF + ';' + SURF + ';' + BP + ';' + BP) : (SURF + ';' + SURF + ';' + BP + ';' + BP);
      var c = svgEl('rect', { x: stx[i] - 11, y: sty - 11, width: 22, height: 22, rx: '3', stroke: BP, 'stroke-width': '1.8', fill: SURF });
      c.appendChild(anim('fill', vals, lit, period));
      svg.appendChild(c);
      svg.appendChild(txt(stx[i], sty + 26, 'ckpt ' + i, '7', MUTE));
    }
    // worker A：运行到 ckpt2，然后崩溃（变为警告色并淡出）
    var wa = svgEl('g', {});
    wa.appendChild(svgEl('rect', { x: -26, y: -20, width: 52, height: 40, rx: '3', stroke: BP, 'stroke-width': '2', fill: SURF }));
    wa.appendChild(txt(0, 5, 'worker A', '8', BP));
    var waPath = 'M' + stx[0] + ',150 L' + stx[2] + ',150 L' + stx[2] + ',150';
    wa.appendChild(svgEl('animateMotion', { path: waPath, keyTimes: '0;0.4;1', keyPoints: '0;1;1', dur: period + 's', repeatCount: 'indefinite', calcMode: 'linear' }));
    wa.appendChild(anim('opacity', '1;1;1;0.15;0.15', '0;0.4;0.45;0.5;1', period));
    svg.appendChild(wa);
    // ckpt2 处的崩溃标记
    var crash = txt(stx[2], 135, '崩溃', '9', WARN);
    crash.appendChild(anim('opacity', '0;0;1;1;0;0', '0;0.42;0.46;0.55;0.6;1', period));
    svg.appendChild(crash);
    // worker B：出现并从 ckpt2 恢复，继续运行到 ckpt3
    var wb = svgEl('g', {});
    wb.appendChild(svgEl('rect', { x: -26, y: -20, width: 52, height: 40, rx: '3', stroke: WARN, 'stroke-width': '2', fill: SURF }));
    wb.appendChild(txt(0, 5, 'worker B', '8', WARN));
    var wbPath = 'M' + stx[2] + ',200 L' + stx[2] + ',200 L' + stx[3] + ',200';
    wb.appendChild(svgEl('animateMotion', { path: wbPath, keyTimes: '0;0.55;1', keyPoints: '0;0;1', dur: period + 's', repeatCount: 'indefinite', calcMode: 'linear' }));
    wb.appendChild(anim('opacity', '0;0;1;1;1', '0;0.5;0.55;0.95;1', period));
    svg.appendChild(wb);
    svg.appendChild(txt(W / 2, H - 12, '崩溃会释放 lease  ·  worker B 从最后一个持久化 Checkpoint 恢复', '9', MUTE));
    shell(host, 'CHECKPOINT REPLAY', '崩溃后恢复', svg,
      '持久化执行让 multi-agent 系统能够扩展到单台笔记本电脑之外。runtime 会在每一步之后写入一个以 thread id 为 key 的 Checkpoint。当 worker 在运行途中崩溃时，其 lease 会被释放，另一个 worker 会接手任务，并从最后一个已提交的 Checkpoint 恢复，而不是从头开始。');
  }

  LF.register({
    'sw-contract-net': contractNet,
    'sw-work-stealing': workStealing,
    'sw-handoff-routing': handoffRouting,
    'sw-agent-card-discovery': agentCard,
    'sw-debate-topology': debateTopology,
    'sw-theory-of-mind': theoryOfMind,
    'sw-ctde': ctde,
    'sw-checkpoint-replay': checkpointReplay
  });
})();
