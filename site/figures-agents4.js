/* figures-agents4.js - Agent Engineering 课程的动画图示。
   在 lesson-figures.js 之后加载，通过 window.LF 注册。无依赖，ES5，
   通过 CSS 变量设置主题。仅使用 SMIL 动画：无 JS 渲染循环。编写方式：
   使用 ```figure 代码块，并指定下面的某个组件名称。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function shell(host, label, sub, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur };
    if (extra) for (var k in extra) a[k] = extra[k];
    return LF.smil('animate', a);
  }
  function txt(x, y, s, size, fill, anchor) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': anchor || 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': size || '11', fill: fill || 'var(--ink,#1a1a1a)' });
    t.appendChild(document.createTextNode(s));
    return t;
  }

  // -- ae-memory-fusion：一个查询被拆分到三个存储中，再融合分数 ---
  function memoryFusion(host) {
    var W = 520, H = 250;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var stores = [
      { y: 50, name: 'VECTOR', sub: '语义', w: '0.50' },
      { y: 110, name: 'KV', sub: '事实查找', w: '0.30' },
      { y: 170, name: 'GRAPH', sub: '关系', w: '0.20' }
    ];
    svg.appendChild(svgEl('rect', { x: 24, y: 95, width: 80, height: 40, rx: '5', fill: 'var(--blueprint,#3553ff)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    svg.appendChild(txt(64, 119, '查询', '11', 'var(--bg,#fafaf5)'));
    var i;
    for (i = 0; i < 3; i++) {
      var s = stores[i];
      var b = svgEl('rect', { x: 210, y: s.y, width: 110, height: 40, rx: '5', fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.5' });
      b.appendChild(anim('stroke', 'var(--rule-soft,#ddd);var(--blueprint,#3553ff);var(--rule-soft,#ddd)', '3s', { begin: (i * 0.4) + 's' }));
      svg.appendChild(b);
      svg.appendChild(txt(265, s.y + 17, s.name, '11', 'var(--blueprint,#3553ff)'));
      svg.appendChild(txt(265, s.y + 31, s.sub, '8', 'var(--ink-mute,#777)'));
      var into = svgEl('line', { x1: 104, y1: 115, x2: 210, y2: s.y + 20, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' });
      into.appendChild(anim('stroke-dashoffset', '18;0', '0.8s', { begin: (i * 0.4) + 's' }));
      svg.appendChild(into);
      var out = svgEl('line', { x1: 320, y1: s.y + 20, x2: 420, y2: 115, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' });
      out.appendChild(anim('stroke-dashoffset', '18;0', '0.8s', { begin: (1.4 + i * 0.4) + 's' }));
      svg.appendChild(out);
      var pulse = svgEl('circle', { cx: '0', cy: '0', r: '4', fill: 'var(--warn,#b8870f)', opacity: '0' });
      pulse.appendChild(LF.smil('animateMotion', { dur: '3s', begin: (i * 0.4) + 's', path: 'M320 ' + (s.y + 20) + ' L420 115', keyPoints: '0;0;1;1', keyTimes: '0;0.5;0.85;1', calcMode: 'linear' }));
      pulse.appendChild(anim('opacity', '0;0;1;1', '3s', { begin: (i * 0.4) + 's' }));
      svg.appendChild(pulse);
      svg.appendChild(txt(355, s.y + 17, 'w ' + s.w, '8', 'var(--ink-mute,#777)'));
    }
    var fuse = svgEl('rect', { x: 420, y: 95, width: 76, height: 40, rx: '5', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' });
    fuse.appendChild(anim('fill', 'var(--bg-surface,#eee);var(--blueprint,#3553ff);var(--bg-surface,#eee)', '3s', { begin: '2.2s' }));
    svg.appendChild(fuse);
    svg.appendChild(txt(458, 119, '融合', '11', 'var(--ink,#1a1a1a)'));
    svg.appendChild(txt(260, 232, 'score = 相关性 + 重要性 + 新近性，加权求和', '10', 'var(--ink-mute,#777)'));
    shell(host, '混合 MEMORY', '一个查询，三个存储',
      svg,
      'Mem0 会将每条 memory 同时写入三个存储，并在检索时进行融合。Vector 回答语义相似性问题，KV 回答事实查找问题，graph 回答关系推理问题。基于相关性、重要性和新近性的加权分数会融合三者，因此这个统一的 add/search 接口不会像单一存储那样，对三类查询中的两类始终给出错误结果。');
  }

  // -- ae-crew-vs-flow：自主角色网格与确定性链条的对比 ----
  function crewVsFlow(host) {
    var W = 520, H = 250;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(txt(135, 28, 'CREW', '11', 'var(--blueprint,#3553ff)'));
    svg.appendChild(txt(135, 42, '自主、基于角色', '8', 'var(--ink-mute,#777)'));
    var roles = [[70, 80], [200, 80], [135, 160]];
    var i, j;
    for (i = 0; i < 3; i++) for (j = i + 1; j < 3; j++) {
      var ln = svgEl('line', { x1: roles[i][0], y1: roles[i][1], x2: roles[j][0], y2: roles[j][1], stroke: 'var(--ink-soft,#555)', 'stroke-width': '1', 'stroke-dasharray': '5 4' });
      ln.appendChild(anim('opacity', '0.2;0.8;0.2', '2.4s', { begin: ((i + j) * 0.3) + 's', repeatCount: 'indefinite' }));
      ln.appendChild(anim('stroke-dashoffset', '18;0', '1s', { begin: ((i + j) * 0.3) + 's' }));
      svg.appendChild(ln);
    }
    var names = ['研究', '写作', '编辑'];
    for (i = 0; i < 3; i++) {
      var c = svgEl('circle', { cx: roles[i][0], cy: roles[i][1], r: '20', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' });
      c.appendChild(anim('opacity', '0.65;1;0.65', '2.4s', { begin: (i * 0.5) + 's', repeatCount: 'indefinite' }));
      svg.appendChild(c);
      svg.appendChild(txt(roles[i][0], roles[i][1] + 3, names[i], '8', 'var(--blueprint,#3553ff)'));
    }
    svg.appendChild(svgEl('line', { x1: 290, y1: 30, x2: 290, y2: 210, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
    svg.appendChild(txt(405, 28, 'FLOW', '11', 'var(--blueprint,#3553ff)'));
    svg.appendChild(txt(405, 42, '事件驱动、确定性', '8', 'var(--ink-mute,#777)'));
    var steps = ['获取', '路由', '发出'];
    for (i = 0; i < 3; i++) {
      var y = 70 + i * 50;
      var b = svgEl('rect', { x: 350, y: y, width: 110, height: 34, rx: '4', fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.5' });
      b.appendChild(anim('fill', 'var(--bg-surface,#eee);var(--blueprint,#3553ff);var(--bg-surface,#eee)', '3s', { begin: (i * 0.6) + 's' }));
      svg.appendChild(b);
      svg.appendChild(txt(405, y + 21, steps[i], '10', 'var(--ink,#1a1a1a)'));
      if (i < 2) {
        var ar = svgEl('line', { x1: 405, y1: y + 34, x2: 405, y2: y + 50, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '4 3' });
        ar.appendChild(anim('stroke-dashoffset', '14;0', '0.5s', { begin: (i * 0.6 + 0.3) + 's' }));
        svg.appendChild(ar);
      }
    }
    svg.appendChild(txt(260, 236, '文档建议：生产环境从 Flow 开始', '10', 'var(--ink-mute,#777)'));
    shell(host, 'CREW 与 FLOW', '一个框架，两种形态',
      svg,
      'CrewAI 提供两种顶层形态。Crew 是基于角色的自主协作，Agent 在松散网格中互相评议，适合探索性工作。Flow 是事件驱动的确定性链条，可以重放、审计并计算成本。文档直截了当地指出：对于任何生产就绪的应用，都应从 Flow 开始。');
  }

  // -- ae-agent-handoff：transfer_to Tool 在 Agent 之间移交控制权 ----
  function agentHandoff(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    function agent(x, label) {
      svg.appendChild(svgEl('rect', { x: x, y: 80, width: 120, height: 56, rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
      svg.appendChild(txt(x + 60, 105, label, '11', 'var(--blueprint,#3553ff)'));
      svg.appendChild(txt(x + 60, 122, 'Agent', '8', 'var(--ink-mute,#777)'));
    }
    agent(40, 'triage');
    agent(360, 'refund');
    var path = svgEl('path', { d: 'M160 108 C240 60, 280 60, 360 108', fill: 'none', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.6', 'stroke-dasharray': '6 5' });
    path.appendChild(anim('stroke-dashoffset', '22;0', '1s', {}));
    svg.appendChild(path);
    var tool = svgEl('rect', { x: 195, y: 30, width: 130, height: 26, rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' });
    svg.appendChild(tool);
    var toolt = txt(260, 48, 'transfer_to_refund', '9', 'var(--warn,#b8870f)');
    toolt.appendChild(anim('opacity', '0.4;1;1', '2.4s', {}));
    svg.appendChild(toolt);
    var ctx = svgEl('circle', { cx: '0', cy: '0', r: '6', fill: 'var(--blueprint,#3553ff)' });
    ctx.appendChild(LF.smil('animateMotion', { dur: '2.4s', path: 'M160 108 C240 60, 280 60, 360 108', keyPoints: '0;0;1;1', keyTimes: '0;0.3;0.8;1', calcMode: 'linear' }));
    ctx.appendChild(anim('opacity', '0;1;1;1', '2.4s', {}));
    svg.appendChild(ctx);
    svg.appendChild(txt(260, 170, 'handoff 是 Model 可以调用的 Tool', '11', 'var(--ink,#1a1a1a)'));
    svg.appendChild(txt(260, 200, '对话 Context 随控制权一起移交', '10', 'var(--ink-mute,#777)'));
    shell(host, 'AGENT HANDOFF', '以 Tool 调用实现委派',
      svg,
      '在 OpenAI Agents SDK 中，handoff 只是一个名为 transfer_to_<agent> 的 Tool。当 triage Agent 调用它时，控制权和正在运行的对话 Context 会传递给目标 Agent，由目标 Agent 继续会话。将委派建模为普通 Tool 可以保持循环的一致性：Model 决定进行 handoff 的方式，与决定调用任何函数的方式相同。');
  }

  // -- ae-subagent-isolation：父级使用全新 Context 生成子级 ---
  function subagentIsolation(host) {
    var W = 520, H = 250;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('rect', { x: 200, y: 24, width: 120, height: 46, rx: '6', fill: 'var(--blueprint,#3553ff)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    svg.appendChild(txt(260, 44, 'orchestrator', '11', 'var(--bg,#fafaf5)'));
    svg.appendChild(txt(260, 60, '主 Context', '8', 'var(--bg-surface,#cdd6ff)'));
    var kids = [80, 260, 440];
    var i;
    for (i = 0; i < 3; i++) {
      var x = kids[i];
      var edge = svgEl('line', { x1: 260, y1: 70, x2: x, y2: 130, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '90', 'stroke-dashoffset': '90' });
      edge.appendChild(anim('stroke-dashoffset', '90;0', '0.5s', { begin: (i * 0.5) + 's', fill: 'freeze' }));
      svg.appendChild(edge);
      var ring = svgEl('rect', { x: x - 52, y: 130, width: 104, height: 54, rx: '6', fill: 'none', stroke: 'var(--ink-mute,#777)', 'stroke-width': '1', 'stroke-dasharray': '4 3' });
      svg.appendChild(ring);
      var b = svgEl('rect', { x: x - 46, y: 136, width: 92, height: 42, rx: '5', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5', opacity: '0' });
      b.appendChild(anim('opacity', '0;1', '0.5s', { begin: (0.5 + i * 0.5) + 's', fill: 'freeze' }));
      svg.appendChild(b);
      var t1 = txt(x, 157, 'subagent ' + (i + 1), '9', 'var(--blueprint,#3553ff)');
      t1.setAttribute('opacity', '0');
      t1.appendChild(anim('opacity', '0;1', '0.5s', { begin: (0.5 + i * 0.5) + 's', fill: 'freeze' }));
      svg.appendChild(t1);
      var t2 = txt(x, 171, '独立窗口', '8', 'var(--ink-mute,#777)');
      t2.setAttribute('opacity', '0');
      t2.appendChild(anim('opacity', '0;1', '0.5s', { begin: (0.5 + i * 0.5) + 's', fill: 'freeze' }));
      svg.appendChild(t2);
      var ret = svgEl('circle', { cx: '0', cy: '0', r: '4', fill: 'var(--warn,#b8870f)', opacity: '0' });
      ret.appendChild(LF.smil('animateMotion', { dur: '4s', begin: (i * 0.5) + 's', path: 'M' + x + ' 130 L260 70', keyPoints: '0;0;1;1', keyTimes: '0;0.6;0.9;1', calcMode: 'linear' }));
      ret.appendChild(anim('opacity', '0;0;1;1', '4s', { begin: (i * 0.5) + 's' }));
      svg.appendChild(ret);
    }
    svg.appendChild(txt(260, 218, '每个 subagent 都在隔离的 Context 中运行，并返回摘要', '10', 'var(--ink-mute,#777)'));
    shell(host, 'SUBAGENT 隔离', '扇出执行，汇总返回',
      svg,
      'Claude Agent SDK 会生成多个 subagent，每个 subagent 都在自己的 Context 窗口中运行（虚线边界）。orchestrator 会保持主 Context 整洁：子级并行探索，仅返回精简摘要。这样既能获得并行能力，也能实现 Context 隔离，使噪声较多的搜索不会淹没父级记录。');
  }

  // -- ae-swebench-gate：针对 FAIL_TO_PASS 单元测试运行补丁 ----------
  function swebenchGate(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('rect', { x: 30, y: 95, width: 100, height: 46, rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    svg.appendChild(txt(80, 114, 'Agent', '11', 'var(--blueprint,#3553ff)'));
    svg.appendChild(txt(80, 130, '补丁', '8', 'var(--ink-mute,#777)'));
    var arr = svgEl('line', { x1: 130, y1: 118, x2: 185, y2: 118, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.6', 'stroke-dasharray': '5 4' });
    arr.appendChild(anim('stroke-dashoffset', '18;0', '0.8s', {}));
    svg.appendChild(arr);
    svg.appendChild(svgEl('rect', { x: 185, y: 40, width: 150, height: 156, rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.5' }));
    svg.appendChild(txt(260, 34, '测试工具', '10', 'var(--ink-mute,#777)'));
    var tests = [
      { y: 60, lab: 'FAIL_TO_PASS', begin: '0.8s' },
      { y: 95, lab: 'FAIL_TO_PASS', begin: '1.3s' },
      { y: 130, lab: 'PASS_TO_PASS', begin: '1.8s' },
      { y: 165, lab: 'PASS_TO_PASS', begin: '2.3s' }
    ];
    var i;
    for (i = 0; i < tests.length; i++) {
      var t = tests[i];
      var dot = svgEl('circle', { cx: 205, cy: t.y + 10, r: '6', fill: 'var(--rule-soft,#ddd)', stroke: 'var(--ink-mute,#777)', 'stroke-width': '1' });
      dot.appendChild(anim('fill', 'var(--rule-soft,#ddd);var(--blueprint,#3553ff)', '4s', { begin: t.begin, fill: 'freeze' }));
      svg.appendChild(dot);
      svg.appendChild(txt(222, t.y + 14, t.lab, '9', 'var(--ink-soft,#555)', 'start'));
      var chk = svgEl('path', { d: 'M202 ' + (t.y + 10) + ' l3 3 l5 -6', fill: 'none', stroke: 'var(--bg,#fafaf5)', 'stroke-width': '1.6', opacity: '0' });
      chk.appendChild(anim('opacity', '0;1', '0.3s', { begin: t.begin, fill: 'freeze' }));
      svg.appendChild(chk);
    }
    var gate = svgEl('rect', { x: 390, y: 95, width: 100, height: 46, rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' });
    gate.appendChild(anim('stroke', 'var(--warn,#b8870f);var(--blueprint,#3553ff)', '4s', { begin: '2.6s', fill: 'freeze' }));
    svg.appendChild(gate);
    var res = txt(440, 122, '已解决', '10', 'var(--ink,#1a1a1a)');
    svg.appendChild(res);
    var g2 = svgEl('line', { x1: 335, y1: 118, x2: 390, y2: 118, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.6', 'stroke-dasharray': '5 4' });
    g2.appendChild(anim('stroke-dashoffset', '18;0', '0.8s', { begin: '2.6s' }));
    svg.appendChild(g2);
    svg.appendChild(txt(260, 222, '只有所有门控测试都通过，才算已解决', '10', 'var(--ink-mute,#777)'));
    shell(host, 'SWE-BENCH 门控', '由测试而非主观判断为补丁评分',
      svg,
      'SWE-bench 通过运行 repo 测试套件为补丁评分，而不是询问 Model 它看起来是否正确。只有当 FAIL_TO_PASS 测试现在能够通过，并且 PASS_TO_PASS 测试仍然通过时，任务才算解决。基于执行的评分让该 benchmark 更难被投机利用，这也是 SWE-bench Verified 会剔除测试存在歧义或损坏的任务的原因。');
  }

  // -- ae-agent-human-gap：随着 Agent 曲线上升，两者差距逐渐缩小 ----------
  function agentHumanGap(host) {
    var W = 520, H = 240, PAD = 44, base = 200;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('line', { x1: PAD, y1: base, x2: W - 20, y2: base, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    svg.appendChild(svgEl('line', { x1: PAD, y1: 30, x2: PAD, y2: base, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    var humanY = 50;
    svg.appendChild(svgEl('line', { x1: PAD, y1: humanY, x2: W - 20, y2: humanY, stroke: 'var(--ink-mute,#777)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' }));
    svg.appendChild(txt(W - 24, humanY - 6, '人类约 78%', '9', 'var(--ink-mute,#777)', 'end'));
    var x0 = PAD + 20, x1 = W - 60, y0 = base - 22, y1 = base - 120;
    var line = svgEl('path', { d: 'M' + x0 + ' ' + y0 + ' Q ' + ((x0 + x1) / 2) + ' ' + (y0 - 10) + ' ' + x1 + ' ' + y1, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2.4', 'stroke-dasharray': '320', 'stroke-dashoffset': '320' });
    line.appendChild(anim('stroke-dashoffset', '320;0', '3s', { begin: '0.3s', fill: 'freeze' }));
    svg.appendChild(line);
    var head = svgEl('circle', { cx: x0, cy: y0, r: '5', fill: 'var(--blueprint,#3553ff)' });
    head.appendChild(svgEl('animateMotion', { dur: '3s', begin: '0.3s', fill: 'freeze', repeatCount: '1', path: 'M0 0 Q ' + ((x1 - x0) / 2) + ' ' + ((y1 - y0) / 2 - 10) + ' ' + (x1 - x0) + ' ' + (y1 - y0), keyTimes: '0;1', keyPoints: '0;1', calcMode: 'linear' }));
    svg.appendChild(head);
    svg.appendChild(txt(x0, base + 16, '2023', '9', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(x1, base + 16, '2026', '9', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(x0 + 4, y0 - 10, '14%', '9', 'var(--blueprint,#3553ff)', 'start'));
    svg.appendChild(txt(260, 222, '差距正在缩小，但故障模式未变：grounding 与操作知识', '10', 'var(--ink-mute,#777)'));
    shell(host, 'AGENT 与人类', '差距正在缩小',
      svg,
      'WebArena 和 OSWorld 发布时显示出巨大差距：最佳 Agent 的成绩接近 14%，而人类约为 78%。蓝色曲线逐年上升，但两种故障模式并未改变。Agent 仍然缺乏 GUI grounding（应该点击哪里）和操作知识（任务实际要求什么），因此分数提升速度快于可靠性。');
  }

  // -- ae-genai-span-tree：嵌套 OTel span 按 parent-child 顺序绘制 ----
  function genaiSpanTree(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var spans = [
      { x: 40, w: 440, y: 40, lab: 'invoke_agent  CLIENT', begin: '0s', kind: 'agent' },
      { x: 80, w: 200, y: 80, lab: 'execute_tool  search', begin: '0.6s', kind: 'tool' },
      { x: 120, w: 120, y: 120, lab: 'chat  gpt model', begin: '1.2s', kind: 'model' },
      { x: 80, w: 240, y: 160, lab: 'execute_tool  fetch', begin: '1.8s', kind: 'tool' },
      { x: 120, w: 150, y: 200, lab: 'chat  claude model', begin: '2.4s', kind: 'model' }
    ];
    var i;
    for (i = 0; i < spans.length; i++) {
      var s = spans[i];
      var fill = s.kind === 'agent' ? 'var(--blueprint,#3553ff)' : s.kind === 'tool' ? 'var(--bg-surface,#eee)' : 'var(--bg,#fafaf5)';
      var stroke = s.kind === 'model' ? 'var(--ink-mute,#777)' : 'var(--blueprint,#3553ff)';
      var ink = s.kind === 'agent' ? 'var(--bg,#fafaf5)' : 'var(--ink,#1a1a1a)';
      var bar = svgEl('rect', { x: s.x, y: s.y, width: '0', height: 24, rx: '3', fill: fill, stroke: stroke, 'stroke-width': '1.4' });
      bar.appendChild(anim('width', '0;' + s.w, '0.5s', { begin: s.begin, fill: 'freeze' }));
      svg.appendChild(bar);
      var t = txt(s.x + 8, s.y + 16, s.lab, '9', ink, 'start');
      t.setAttribute('opacity', '0');
      t.appendChild(anim('opacity', '0;1', '0.4s', { begin: s.begin, fill: 'freeze' }));
      svg.appendChild(t);
      if (i > 0) {
        var px = spans[i].x - 18;
        var conn = svgEl('path', { d: 'M' + px + ' ' + (spans[i - (s.kind === 'model' ? 1 : (i === 3 ? 3 : 1))].y + 24) + ' V ' + (s.y + 12) + ' H ' + s.x, fill: 'none', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1', 'stroke-dasharray': '2 2', opacity: '0' });
        conn.appendChild(anim('opacity', '0;0.7', '0.3s', { begin: s.begin, fill: 'freeze' }));
        svg.appendChild(conn);
      }
    }
    svg.appendChild(txt(260, 230, '统一 schema：Agent > Tool > Model，按惯例采用 parent-child 关系', '10', 'var(--ink-mute,#777)'));
    shell(host, 'GENAI SPAN TREE', '标准化的嵌套遥测',
      svg,
      'OpenTelemetry 的 GenAI 约定为每个供应商提供统一 schema。invoke_agent span 是根节点；每个 execute_tool span 都挂在它下面；每个 Model chat span 都挂在调用它的 Tool 下面。由于名称和 parent-child 链接已经标准化，同一个 trace 在 Datadog、Grafana、Jaeger 或 Honeycomb 中的读取方式完全相同。');
  }

  // -- ae-eval-three-layers：Evaluation 循环包围构建过程，形成三层环 ----
  function evalThreeLayers(host) {
    var W = 520, H = 250, cx = 175, cy = 125;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var rings = [
      { r: 96, lab: '在线生产环境', dash: '12 8', dur: '8s', op: '0.45' },
      { r: 70, lab: '自定义离线 Evaluation', dash: '9 7', dur: '6s', op: '0.65' },
      { r: 44, lab: '静态 benchmark', dash: '6 5', dur: '4s', op: '0.85' }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var ring = svgEl('circle', { cx: cx, cy: cy, r: rings[i].r, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6', 'stroke-dasharray': rings[i].dash, opacity: rings[i].op });
      var rot = svgEl('animateTransform', { attributeName: 'transform', type: 'rotate', from: '0 ' + cx + ' ' + cy, to: '360 ' + cx + ' ' + cy, dur: rings[i].dur, repeatCount: 'indefinite' });
      ring.appendChild(rot);
      svg.appendChild(ring);
    }
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '22', fill: 'var(--blueprint,#3553ff)' }));
    svg.appendChild(txt(cx, cy - 1, '构建', '10', 'var(--bg,#fafaf5)'));
    svg.appendChild(txt(cx, cy + 12, 'Agent', '8', 'var(--bg-surface,#cdd6ff)'));
    var labelsX = 300;
    for (i = 0; i < 3; i++) {
      var y = 78 + i * 36;
      svg.appendChild(svgEl('circle', { cx: labelsX, cy: y - 4, r: '5', fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6', 'stroke-dasharray': rings[2 - i].dash }));
      svg.appendChild(txt(labelsX + 14, y, rings[2 - i].lab, '11', 'var(--ink,#1a1a1a)', 'start'));
    }
    var notes = ['SWE-bench、GAIA、BFCL', 'LLM-judge、执行、轨迹', '实时流量、Regression、门控'];
    for (i = 0; i < 3; i++) {
      svg.appendChild(txt(labelsX + 14, 78 + i * 36 + 14, notes[i], '8', 'var(--ink-mute,#777)', 'start'));
    }
    svg.appendChild(txt(260, 236, 'Evaluation 是外层循环，而不是最后一步', '10', 'var(--ink-mute,#777)'));
    shell(host, 'EVALUATION 驱动循环', '围绕构建过程的三个层次',
      svg,
      'Evaluation 不是最后一个检查项，而是驱动每项选择的外层循环。静态 benchmark 固定 Model，自定义离线 Evaluation 衡量产品形态，在线生产 Evaluation 则捕获实时流量中的 Regression。这三个环持续围绕构建过程运转，因此 2026 年的实践会将 Evaluation 与代码放在一起，在 CI 中运行，并为每个 PR 设置门控。');
  }

  LF.register({
    'ae-memory-fusion': memoryFusion,
    'ae-crew-vs-flow': crewVsFlow,
    'ae-agent-handoff': agentHandoff,
    'ae-subagent-isolation': subagentIsolation,
    'ae-swebench-gate': swebenchGate,
    'ae-agent-human-gap': agentHumanGap,
    'ae-genai-span-tree': genaiSpanTree,
    'ae-eval-three-layers': evalThreeLayers
  });
})();
