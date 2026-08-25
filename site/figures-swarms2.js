/* figures-swarms2.js - Phase 16 的动画式主题感知图示
   （multi-agent 与 swarms）。在 lesson-figures.js 之后加载，通过
   window.LF 注册。无依赖，仅限 ES5，使用 SMIL 动画，通过 CSS 变量适配主题。
   编写方式：使用一个 ```figure 块，并指定下方某个 widget 的名称。 */
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
  function anim(attr, vals, dur, opts) {
    var a = { attributeName: attr, values: vals, dur: dur + 's', repeatCount: 'indefinite' };
    if (opts) for (var k in opts) a[k] = opts[k];
    return svgEl('animate', a);
  }

  var BP = 'var(--blueprint,#3553ff)';
  var WARN = 'var(--warn,#b8870f)';
  var SOFT = 'var(--rule-soft,#ddd)';
  var SURF = 'var(--bg-surface,#eee)';
  var BG = 'var(--bg,#fafaf5)';
  var MUTE = 'var(--ink-mute,#777)';

  // ── swarm-consensus-wave：一圈 Agent 以波浪形式切换为同一种共享颜色；
  //    一个 byzantine 节点保持异色，永不收敛 ──────────────────────────────
  function consensusWave(host) {
    var W = 520, H = 250, CX = 260, CY = 120, R = 90, N = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var byz = 5, period = 8, i;
    var px = [], py = [];
    for (i = 0; i < N; i++) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / N;
      px.push(CX + R * Math.cos(ang)); py.push(CY + R * Math.sin(ang));
    }
    for (i = 0; i < N; i++) {
      svg.appendChild(svgEl('line', { x1: px[i], y1: py[i], x2: px[(i + 1) % N], y2: py[(i + 1) % N], stroke: SOFT, 'stroke-width': '1.2' }));
    }
    for (i = 0; i < N; i++) {
      var isByz = (i === byz);
      var g = svgEl('g', {});
      var c = svgEl('circle', { cx: px[i], cy: py[i], r: '15', stroke: isByz ? WARN : BP, 'stroke-width': '2', fill: SURF });
      if (isByz) {
        c.setAttribute('fill', WARN);
      } else {
        // 以交错的波浪形式切换为共识颜色，然后保持不变
        var begin = (i * (period / N)).toFixed(2);
        c.appendChild(svgEl('animate', { attributeName: 'fill', values: SURF + ';' + SURF + ';' + BP + ';' + BP, keyTimes: '0;0.12;0.2;1', dur: period + 's', begin: begin + 's', repeatCount: 'indefinite' }));
      }
      g.appendChild(c);
      g.appendChild(txt(px[i], py[i] + 4, isByz ? 'X' : String(i), '11', isByz ? BG : BP));
      svg.appendChild(g);
    }
    svg.appendChild(txt(CX, CY + 4, '达成一致？', '11', MUTE));
    svg.appendChild(txt(CX, H - 16, '一致意见的波浪沿环传播  ·  节点 X（byzantine）始终不加入', '10', MUTE));
    shell(host, 'CONSENSUS WAVE', '传播一个值', svg,
      '随着决策沿环传播，诚实的 Agent 会收敛到一个共享值。单个 byzantine 节点（X）拒绝切换，因此朴素多数机制仍可能被操控。经典 BFT 能容忍 f < n/3 个此类节点；对于 LLM Agent，尚待解决的问题是相关故障，而非任意故障。');
  }

  // ── swarm-auction：竞标者的柱状条随时间升高；获胜者被突出显示，
  //    并支付第二高的价格（Vickrey）────────────────────────────────────
  function auction(host) {
    var W = 520, H = 250, N = 5, base = 60, bw = 54, gap = 36, x0 = 70, period = 7;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var bids = [42, 88, 61, 30, 73];
    var winner = 1, second = 4; // 最高报价与第二高报价的索引
    var floorY = H - 50, maxH = 130, maxBid = 100, i;
    svg.appendChild(svgEl('line', { x1: 40, y1: floorY, x2: W - 30, y2: floorY, stroke: SOFT, 'stroke-width': '1.4' }));
    for (i = 0; i < N; i++) {
      var x = x0 + i * (bw + gap);
      var h = bids[i] / maxBid * maxH;
      var isWin = (i === winner);
      var bar = svgEl('rect', { x: x, y: floorY, width: bw, height: 0, fill: isWin ? BP : SURF, stroke: isWin ? BP : SOFT, 'stroke-width': '1.5' });
      var beg = (i * 0.5).toFixed(2);
      // 从底线增长到最终高度，然后保持不变
      bar.appendChild(svgEl('animate', { attributeName: 'height', values: '0;' + h.toFixed(0) + ';' + h.toFixed(0), keyTimes: '0;0.45;1', dur: period + 's', begin: beg + 's', repeatCount: 'indefinite' }));
      bar.appendChild(svgEl('animate', { attributeName: 'y', values: floorY + ';' + (floorY - h).toFixed(0) + ';' + (floorY - h).toFixed(0), keyTimes: '0;0.45;1', dur: period + 's', begin: beg + 's', repeatCount: 'indefinite' }));
      svg.appendChild(bar);
      svg.appendChild(txt(x + bw / 2, floorY + 18, 'a' + i, '10', isWin ? BP : MUTE));
      svg.appendChild(txt(x + bw / 2, floorY - h - 8, '$' + bids[i], '11', isWin ? BP : MUTE));
      if (i === second) {
        // 结算线：获胜者支付第二高报价
        var sy = floorY - bids[second] / maxBid * maxH;
        var pay = svgEl('line', { x1: 40, y1: sy, x2: W - 30, y2: sy, stroke: WARN, 'stroke-width': '1.4', 'stroke-dasharray': '5 4', opacity: '0' });
        pay.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;0.9;0.9', keyTimes: '0;0.55;0.7;1', dur: period + 's', repeatCount: 'indefinite' }));
        svg.appendChild(pay);
        svg.appendChild(txt(W - 36, sy - 6, '支付第二高价格', '10', WARN, 'end'));
      }
    }
    svg.appendChild(txt(W / 2, 28, '第二价格（Vickrey）拍卖', '11', MUTE));
    shell(host, 'TOKEN AUCTION', '最高报价获胜', svg,
      'Agent 为任务竞标；报价会随着轮次推进而升高。最高报价者（a1）获胜，但支付第二高的价格，也就是虚线所在位置。在第二价格机制下，如实报价是占优策略，因此机制设计偏好使用它在 Agent 之间分配工作和 Token。');
  }

  // ── swarm-stigmergy：蚂蚁在巢穴与食物之间的边上留下信息素；
  //    随着流量集中，最短的边会变亮，其他边则逐渐消退 ──────────────────
  function stigmergy(host) {
    var W = 520, H = 250, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var nest = { x: 60, y: 125 }, food = { x: 460, y: 125 };
    // 三条路线：一条较短的直达路线，以及两条较长的绕行路线
    var paths = [
      'M60 125 L260 125 L460 125',          // 短，强
      'M60 125 Q260 40 460 125',            // 中等
      'M60 125 Q260 215 460 125'            // 长，弱
    ];
    var strength = [1, 0.45, 0.2], dur = [2.0, 2.9, 3.6];
    var i;
    for (i = 0; i < paths.length; i++) {
      // 基础轨迹：通过不透明度振荡表现沉积与挥发
      var base = svgEl('path', { id: 'lf-st-p' + i, d: paths[i], fill: 'none', stroke: BP, 'stroke-width': (1 + strength[i] * 3).toFixed(1), 'stroke-linecap': 'round' });
      base.appendChild(anim('opacity', (0.15 * strength[i]).toFixed(2) + ';' + (0.9 * strength[i] + 0.1).toFixed(2) + ';' + (0.15 * strength[i]).toFixed(2), 3 + i, {}));
      svg.appendChild(base);
      // 通过 animateMotion 沿轨迹移动的蚂蚁
      var nAnts = i === 0 ? 4 : 2, j;
      for (j = 0; j < nAnts; j++) {
        var ant = svgEl('circle', { r: '4', fill: i === 0 ? BP : MUTE });
        var mp = svgEl('animateMotion', { dur: dur[i] + 's', repeatCount: 'indefinite', begin: (j * dur[i] / nAnts).toFixed(2) + 's', rotate: 'auto' });
        mp.appendChild(svgEl('mpath', { href: '#lf-st-p' + i }));
        ant.appendChild(mp);
        svg.appendChild(ant);
      }
    }
    [[nest, 'nest'], [food, 'food']].forEach(function (n) {
      svg.appendChild(svgEl('circle', { cx: n[0].x, cy: n[0].y, r: '16', fill: SURF, stroke: BP, 'stroke-width': '2' }));
      svg.appendChild(txt(n[0].x, n[0].y + 4, n[1] === 'nest' ? 'N' : 'F', '11', BP));
      svg.appendChild(txt(n[0].x, n[0].y + 30, n[1], '10', MUTE));
    });
    svg.appendChild(txt(W / 2, H - 14, '信息素集中在较短路线  ·  较弱的轨迹逐渐挥发', '10', MUTE));
    shell(host, 'STIGMERGY', '蚂蚁强化轨迹', svg,
      '没有任何 Agent 规划路线。每只蚂蚁在移动时沉积信息素，并偏好更强的轨迹，因此最短路径会积累流量，而绕行路线逐渐挥发。ACO 将这一机制转化为 Agent 路由：轨迹记录哪个 Agent 处理过哪种任务，衰减则允许系统重新发现更优路线。');
  }

  // ── swarm-hierarchy-token：一个委派 Token 沿管理者树向下流动
  //    到达工作者，随后结果沿相同的边向上回传 ──────────────────────────
  function hierarchyToken(host) {
    var W = 520, H = 260, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var mgr = { x: 260, y: 36, l: 'MGR' };
    var sub = [{ x: 150, y: 120, l: 'A' }, { x: 370, y: 120, l: 'B' }];
    var wrk = [{ x: 90, y: 210 }, { x: 210, y: 210 }, { x: 330, y: 210 }, { x: 430, y: 210 }];
    var edges = [
      'M260 50 L150 106', 'M260 50 L370 106',
      'M150 134 L90 196', 'M150 134 L210 196',
      'M370 134 L330 196', 'M370 134 L430 196'
    ];
    var i, period = 6;
    for (i = 0; i < edges.length; i++) {
      svg.appendChild(svgEl('path', { id: 'lf-hi-e' + i, d: edges[i], fill: 'none', stroke: SOFT, 'stroke-width': '1.4' }));
    }
    // 委派 Token：前半程向下传递，后半程由结果向上回传
    for (i = 0; i < edges.length; i++) {
      var down = svgEl('circle', { r: '5', fill: BP });
      var dm = svgEl('animateMotion', { dur: period + 's', repeatCount: 'indefinite', begin: (i < 2 ? 0 : 0.9) + 's', keyPoints: '0;1;1;1', keyTimes: '0;0.3;0.5;1', calcMode: 'linear' });
      dm.appendChild(svgEl('mpath', { href: '#lf-hi-e' + i }));
      down.appendChild(dm);
      down.appendChild(svgEl('animate', { attributeName: 'opacity', values: '1;1;0;0', keyTimes: '0;0.3;0.31;1', dur: period + 's', begin: (i < 2 ? 0 : 0.9) + 's', repeatCount: 'indefinite' }));
      svg.appendChild(down);
      var up = svgEl('circle', { r: '5', fill: WARN });
      var um = svgEl('animateMotion', { dur: period + 's', repeatCount: 'indefinite', begin: (i < 2 ? 2.4 : 1.5) + 's', keyPoints: '1;0;0;0', keyTimes: '0;0.3;0.5;1', calcMode: 'linear' });
      um.appendChild(svgEl('mpath', { href: '#lf-hi-e' + i }));
      up.appendChild(um);
      up.appendChild(svgEl('animate', { attributeName: 'opacity', values: '1;1;0;0', keyTimes: '0;0.3;0.31;1', dur: period + 's', begin: (i < 2 ? 2.4 : 1.5) + 's', repeatCount: 'indefinite' }));
      svg.appendChild(up);
    }
    function node(n, on) {
      svg.appendChild(svgEl('rect', { x: n.x - 28, y: n.y, width: 56, height: 28, rx: '4', fill: on ? BP : SURF, stroke: on ? BP : SOFT, 'stroke-width': '1.5' }));
      svg.appendChild(txt(n.x, n.y + 18, n.l, '11', on ? BG : BP));
    }
    node(mgr, true);
    sub.forEach(function (s) { node(s, false); });
    wrk.forEach(function (w, k) { node({ x: w.x, y: w.y, l: 'w' + k }, false); });
    svg.appendChild(txt(W / 2, H - 6, '蓝色 = 向下委派  ·  金色 = 结果向上回传', '10', MUTE));
    shell(host, 'HIERARCHY', '向下委派，向上返回', svg,
      '管理者拆分目标，通过子管理者向下委派给工作者；结果沿相同的边返回。风险在于：LLM 管理者会在每一轮重新推理整棵树，因此细微的 Context 漂移就会错误分配工作，并使结构陷入循环。简单的扁平序列通常更有效。');
  }

  // ── swarm-message-bus：类型化数据包沿共享主干传输；MCP 与
  //    A2A 通道通过 animateMotion 承载不同类型的消息 ──────────────────
  function messageBus(host) {
    var W = 520, H = 250, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var lanes = [
      { y: 80, l: 'MCP · Tool 调用', d: 'M70 80 L450 80', col: BP },
      { y: 130, l: 'A2A · 任务', d: 'M70 130 L450 130', col: WARN },
      { y: 180, l: 'ANP · 身份', d: 'M70 180 L450 180', col: MUTE }
    ];
    var i, j;
    // 端点
    [70, 450].forEach(function (x, e) {
      svg.appendChild(svgEl('rect', { x: x - 26, y: 60, width: 52, height: 140, rx: '5', fill: SURF, stroke: SOFT, 'stroke-width': '1.5' }));
      svg.appendChild(txt(x, 52, e === 0 ? 'Agent A' : 'Agent B', '10', MUTE));
    });
    for (i = 0; i < lanes.length; i++) {
      var ln = lanes[i];
      svg.appendChild(svgEl('path', { id: 'lf-bus-l' + i, d: ln.d, fill: 'none', stroke: SOFT, 'stroke-width': '1.2', 'stroke-dasharray': '4 4' }));
      svg.appendChild(txt(W - 60, ln.y - 8, ln.l, '9', ln.col, 'end'));
      var nP = 3, dur = 3 + i * 0.6;
      for (j = 0; j < nP; j++) {
        var dir = (i === 1) ? 1 : 0; // A2A 偶尔从 B->A 反向传输
        var pkt = svgEl('rect', { x: -5, y: -5, width: 10, height: 10, rx: '2', fill: ln.col });
        var mm = svgEl('animateMotion', { dur: dur + 's', repeatCount: 'indefinite', begin: (j * dur / nP).toFixed(2) + 's', rotate: '0' });
        if (dir) { mm.setAttribute('keyPoints', '1;0'); mm.setAttribute('keyTimes', '0;1'); }
        mm.appendChild(svgEl('mpath', { href: '#lf-bus-l' + i }));
        pkt.appendChild(mm);
        svg.appendChild(pkt);
      }
    }
    svg.appendChild(txt(W / 2, H - 14, '一条共享主干，多个类型化通道  ·  每种协议承载自己的消息类型', '10', MUTE));
    shell(host, 'MESSAGE BUS', '共享主干上的数据包', svg,
      'Agent 不再传递原始字符串，而是通过共享总线使用类型化协议通信。MCP 承载 Tool 调用，A2A 承载委派任务（以及回复），ANP 承载身份。分离这些通道能让 multi-agent 系统具备可审计性，并使不同团队构建的 Agent 实现互操作。');
  }

  // ── swarm-roles：Agent 采用不同的形状和角色，产物依次经过
  //    规划 → 执行 → 评审 → 验证，并在拒绝时返回循环 ──────────────────
  function roles(host) {
    var W = 520, H = 250, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var R = [
      { x: 70, l: '规划', shape: 'rect' },
      { x: 200, l: '执行', shape: 'circle' },
      { x: 330, l: '评审', shape: 'diamond' },
      { x: 450, l: '验证', shape: 'hex' }
    ];
    var y = 110, i;
    // 连接主干
    var spine = 'M' + R[0].x + ' ' + y;
    for (i = 1; i < R.length; i++) spine += ' L' + R[i].x + ' ' + y;
    svg.appendChild(svgEl('path', { id: 'lf-rl-spine', d: spine, fill: 'none', stroke: SOFT, 'stroke-width': '1.4' }));
    // 从评审者返回规划者的拒绝循环
    svg.appendChild(svgEl('path', { d: 'M330 ' + (y + 24) + ' Q200 ' + (y + 90) + ' 70 ' + (y + 24), fill: 'none', stroke: WARN, 'stroke-width': '1.3', 'stroke-dasharray': '5 4' }));
    svg.appendChild(txt(200, y + 86, '拒绝 → 重新规划', '10', WARN));
    function drawRole(r, idx) {
      var on = (idx === 1);
      if (r.shape === 'rect') svg.appendChild(svgEl('rect', { x: r.x - 26, y: y - 20, width: 52, height: 40, rx: '4', fill: SURF, stroke: BP, 'stroke-width': '1.8' }));
      else if (r.shape === 'circle') svg.appendChild(svgEl('circle', { cx: r.x, cy: y, r: '23', fill: SURF, stroke: BP, 'stroke-width': '1.8' }));
      else if (r.shape === 'diamond') svg.appendChild(svgEl('polygon', { points: r.x + ',' + (y - 26) + ' ' + (r.x + 26) + ',' + y + ' ' + r.x + ',' + (y + 26) + ' ' + (r.x - 26) + ',' + y, fill: SURF, stroke: WARN, 'stroke-width': '1.8' }));
      else svg.appendChild(svgEl('polygon', { points: (r.x - 14) + ',' + (y - 22) + ' ' + (r.x + 14) + ',' + (y - 22) + ' ' + (r.x + 26) + ',' + y + ' ' + (r.x + 14) + ',' + (y + 22) + ' ' + (r.x - 14) + ',' + (y + 22) + ' ' + (r.x - 26) + ',' + y, fill: SURF, stroke: BP, 'stroke-width': '1.8' }));
      svg.appendChild(txt(r.x, y + 4, r.l, '9', BP));
    }
    R.forEach(drawRole);
    // 产物 Token 沿主干移动，每次到达一个角色时都会脉动
    var art = svgEl('circle', { r: '6', fill: BP });
    var am = svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', keyPoints: '0;0.33;0.66;1;1', keyTimes: '0;0.3;0.6;0.85;1', calcMode: 'linear' });
    am.appendChild(svgEl('mpath', { href: '#lf-rl-spine' }));
    art.appendChild(am);
    art.appendChild(anim('r', '6;9;6', 1.2, {}));
    svg.appendChild(art);
    svg.appendChild(txt(W / 2, 40, '产物流经不同角色', '11', MUTE));
    svg.appendChild(txt(W / 2, H - 14, '规划者（□）· 执行者（○）· 评审者（◇，主观）· 验证者（⬡，确定性）', '10', MUTE));
    shell(host, 'ROLE SPECIALIZATION', '一个产物，四种角色', svg,
      '更多 Agent 并不会带来帮助；不同的 Agent 才会。规划、产物、主观评审和确定性检查是彼此分离的角色，并各自使用不同的 Tool。验证者是关键支柱：MAST 将几乎每一次 multi-agent 故障都追溯到验证缺失或失效。拒绝会将产物送回重新规划。');
  }

  // ── swarm-blackboard：写入者向中央黑板发布内容，读取者进行订阅；
  //    一条被污染的事实向外传播给读取者（gossip ripple）────────────────
  function blackboard(host) {
    var W = 520, H = 260, CX = 260, CY = 130, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    // 中央黑板
    svg.appendChild(svgEl('rect', { x: CX - 70, y: CY - 38, width: 140, height: 76, rx: '6', fill: SURF, stroke: BP, 'stroke-width': '2' }));
    svg.appendChild(txt(CX, CY - 14, 'BLACKBOARD', '10', BP));
    // 一条事实记录，从蓝色（已验证）变为金色（已污染），然后再恢复
    var fact = svgEl('rect', { x: CX - 54, y: CY, width: 108, height: 16, rx: '3', fill: BP });
    fact.appendChild(anim('fill', BP + ';' + BP + ';' + WARN + ';' + WARN + ';' + BP, 8, { keyTimes: '0;0.25;0.35;0.8;1' }));
    svg.appendChild(fact);
    var agents = [
      { x: 70, y: 50, w: 1 }, { x: 70, y: 210, w: 1 },
      { x: 160, y: 30, w: 0 }, { x: 360, y: 30, w: 0 },
      { x: 450, y: 50, w: 0 }, { x: 450, y: 210, w: 0 }, { x: 160, y: 230, w: 0 }
    ];
    var i, poisonReader = 4;
    for (i = 0; i < agents.length; i++) {
      var a = agents[i];
      var isW = a.w === 1;
      // Agent 与黑板之间的边
      var ex = CX + (a.x < CX ? -70 : 70), ey = CY;
      svg.appendChild(svgEl('path', { id: 'lf-bb-e' + i, d: 'M' + a.x + ' ' + a.y + ' L' + ex + ' ' + ey, fill: 'none', stroke: SOFT, 'stroke-width': '1.2' }));
      svg.appendChild(svgEl('circle', { cx: a.x, cy: a.y, r: '14', fill: SURF, stroke: isW ? WARN : BP, 'stroke-width': '1.8' }));
      svg.appendChild(txt(a.x, a.y + 4, isW ? 'W' : 'R', '10', isW ? WARN : BP));
      // 数据包：写入者推送到黑板；读取者从黑板拉取
      var pkt = svgEl('circle', { r: '4', fill: isW ? WARN : BP });
      var rev = !isW; // 读取者的数据包从黑板流向 Agent
      var mm = svgEl('animateMotion', { dur: (isW ? 4 : 4.5) + 's', repeatCount: 'indefinite', begin: (i * 0.4).toFixed(2) + 's' });
      if (rev) { mm.setAttribute('keyPoints', '1;0'); mm.setAttribute('keyTimes', '0;1'); }
      mm.appendChild(svgEl('mpath', { href: '#lf-bb-e' + i }));
      pkt.appendChild(mm);
      // 被污染读取者的数据包闪烁金色，表示它采用了该事实
      if (i === poisonReader) pkt.appendChild(anim('fill', BP + ';' + WARN + ';' + WARN + ';' + BP, 4.5, { keyTimes: '0;0.4;0.7;1' }));
      svg.appendChild(pkt);
    }
    svg.appendChild(txt(W / 2, H - 12, 'W 写入，R 读取  ·  被污染的事实（金色）传播给每个读取者', '10', MUTE));
    shell(host, 'BLACKBOARD', '共享状态，共享风险', svg,
      'Agent 通过中央黑板共享事实，而不是复制消息。危险在于记忆污染：一个 Agent 写入 hallucination，所有下游读取者都会将其视为已验证信息而采纳，准确率则在无声中下降。来源追踪、不可写入的验证者以及每个 Agent 的独立视图，是能够有效缓解这一问题的措施。');
  }

  // ── swarm-speaker：选择器 Token 在围绕共享池的聊天 Agent 之间跳转，
  //    最终停在下一位发言者上（类似 leader-election）──────────────────
  function speaker(host) {
    var W = 520, H = 260, CX = 260, CY = 135, R = 88, N = 5, svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var px = [], py = [], i;
    for (i = 0; i < N; i++) {
      var ang = -Math.PI / 2 + i * 2 * Math.PI / N;
      px.push(CX + R * Math.cos(ang)); py.push(CY + R * Math.sin(ang));
    }
    // 中央共享池
    svg.appendChild(svgEl('circle', { cx: CX, cy: CY, r: '30', fill: SURF, stroke: SOFT, 'stroke-width': '1.4' }));
    svg.appendChild(txt(CX, CY - 2, '共享', '9', MUTE));
    svg.appendChild(txt(CX, CY + 10, '池', '9', MUTE));
    // 从共享池连接到每个 Agent 的辐条
    for (i = 0; i < N; i++) {
      svg.appendChild(svgEl('line', { x1: CX, y1: CY, x2: px[i], y2: py[i], stroke: SOFT, 'stroke-width': '1' }));
    }
    var period = 7.5, settle = N; // 依次跳过所有候选者，然后停在其中一个上
    for (i = 0; i < N; i++) {
      var on = svgEl('circle', { cx: px[i], cy: py[i], r: '17', fill: SURF, stroke: BP, 'stroke-width': '2' });
      // Token 访问时每个 Agent 依次亮起，最后一个（索引 2）保持亮起
      var lit = (i === 2);
      var k0 = (i / N).toFixed(3), k1 = ((i + 0.5) / N).toFixed(3);
      var vals = lit
        ? SURF + ';' + SURF + ';' + BP + ';' + BP
        : SURF + ';' + SURF + ';' + BP + ';' + SURF + ';' + SURF;
      var kt = lit ? ('0;' + k0 + ';' + k1 + ';1') : ('0;' + k0 + ';' + k1 + ';' + ((i + 1) / N).toFixed(3) + ';1');
      on.appendChild(svgEl('animate', { attributeName: 'fill', values: vals, keyTimes: kt, dur: period + 's', repeatCount: 'indefinite' }));
      svg.appendChild(on);
      svg.appendChild(txt(px[i], py[i] + 4, String.fromCharCode(65 + i), '11', BP));
    }
    // 选择器 Token 在 Agent 之间跳转，然后停在选中者（索引 2）上
    var order = [0, 1, 2, 3, 4, 2], motVals = '', j;
    for (j = 0; j < order.length; j++) {
      motVals += px[order[j]] + ',' + (py[order[j]] - 26) + (j < order.length - 1 ? ';' : '');
    }
    var crownG = svgEl('g', {}, [svgEl('polygon', { points: '-8,4 -8,-4 -3,0 0,-7 3,0 8,-4 8,4', fill: WARN })]);
    crownG.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', values: motVals, dur: period + 's', repeatCount: 'indefinite', calcMode: 'discrete' }));
    svg.appendChild(crownG);
    svg.appendChild(txt(W / 2, 30, '选择器挑选下一位发言者', '11', MUTE));
    svg.appendChild(txt(W / 2, H - 12, 'Token 依次跳过 A→B→C→D→E，最终停在选中的发言者上', '10', MUTE));
    shell(host, 'SPEAKER SELECTION', '下一位由谁发言', svg,
      'Agent 对同一个共享池作出反应，而非依赖固定图结构。选择器可以是 round-robin、LLM 或自定义规则，它决定下一位发言者，因此 Token 会在候选者之间跳转，并最终停在其中一个上。这避免了对 N 个 Agent 之间每一种可能的 handoff 进行硬编码所导致的边数量爆炸。');
  }

  LF.register({
    'swarm-consensus-wave': consensusWave,
    'swarm-auction': auction,
    'swarm-stigmergy': stigmergy,
    'swarm-hierarchy-token': hierarchyToken,
    'swarm-message-bus': messageBus,
    'swarm-roles': roles,
    'swarm-blackboard': blackboard,
    'swarm-speaker': speaker
  });
})();
