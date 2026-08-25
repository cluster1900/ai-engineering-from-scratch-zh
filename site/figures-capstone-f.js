/* figures-capstone-f.js - Phase 19 capstone 的动画课程图示
   项目 12-17 和 20-23（视频场景索引、MCP gate、speculative decode、
   safety stack、issue-to-PR、导师循环、harness 循环契约、Tool registry
   验证、JSON-RPC framing、dispatcher 重试）。在
   lesson-figures.js 之后加载，通过 window.LF 注册。仅使用 SMIL 动画、ES5、
   无依赖，通过 CSS 变量适配主题。 */
(function(){'use strict';var LF=window.LF;if(!LF){return;}
  var el = LF.el, svgEl = LF.svgEl;
  var EASE = '0.23 1 0.32 1';
  var INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--ink-soft,#555)', MUTE = 'var(--ink-mute,#777)';
  var BLUE = 'var(--blueprint,#3553ff)', BG = 'var(--bg,#fafaf5)', SURF = 'var(--bg-surface,#eee)';
  var RULE = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)';

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
  function box(x, y, w, h, fill, stroke) {
    return svgEl('rect', { x: x, y: y, width: w, height: h, rx: '4', fill: fill || SURF, stroke: stroke || RULE, 'stroke-width': '1.3' });
  }
  function line(x1, y1, x2, y2, stroke, extra) {
    var a = { x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke || SOFT, 'stroke-width': '1.3' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('line', a);
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('animate', a);
  }
  function fade(node, dur, at) {
    node.appendChild(anim('opacity', '0;1;1', dur, { begin: at, keyTimes: '0;0.12;1', calcMode: 'spline', keySplines: EASE + ';0 0 1 1' }));
    return node;
  }
  // 从 (cx,cy) 附近以 95% 大小淡入并增长，在循环结束时柔和淡出
  function pop(kids, cx, cy, dur, at) {
    var g = svgEl('g', { transform: 'translate(' + cx + ' ' + cy + ')' }, kids);
    g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'scale', additive: 'sum', values: '0.95;1;1', dur: dur, begin: at, repeatCount: 'indefinite', calcMode: 'spline', keySplines: EASE + ';0 0 1 1', keyTimes: '0;0.18;1' }));
    g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', additive: 'sum', values: (-cx) + ' ' + (-cy), dur: dur, begin: at, repeatCount: 'indefinite' }));
    g.appendChild(anim('opacity', '0;1;1;0', dur, { begin: at, keyTimes: '0;0.14;0.94;1', calcMode: 'spline', keySplines: EASE + ';0 0 1 1;0.4 0 1 1' }));
    return g;
  }
  function dot(r, fill) { return svgEl('circle', { r: r, fill: fill, cx: '0', cy: '0' }); }
  function mov(path, dur, extra) {
    var a = { path: path, dur: dur, repeatCount: 'indefinite' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('animateMotion', a);
  }
  function arrows(s, id) {
    s.appendChild(svgEl('defs', {}, [svgEl('marker', { id: id, viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '6', markerHeight: '6', orient: 'auto' }, [svgEl('path', { d: 'M0 0 L8 4 L0 8 z', fill: SOFT })])]));
    return 'url(#' + id + ')';
  }

  // ── cf-scene-index (12)：场景展开为三个 Vector，查询返回一个窗口 ─
  function sceneIndex(host) {
    var D = '5.5s', s = svg(260), i;
    var xs = [30, 112, 220, 290, 414], ws = [78, 104, 66, 120, 88];
    var strip = [txt(30, 22, '场景分段', '9', MUTE, 'start')];
    for (i = 0; i < 5; i++) {
      strip.push(fade(box(xs[i], 32, ws[i], 26, i === 2 ? BLUE : SURF, i === 2 ? 'none' : RULE), D, (0.05 + i * 0.09) + 's'));
    }
    s.appendChild(pop(strip, 260, 45, D, '0s'));
    var chips = [], cx = [60, 205, 350], cl = ['字幕 Embedding', '帧 Embedding', '转录文本 Embedding'];
    for (i = 0; i < 3; i++) {
      chips.push(line(253, 60, cx[i] + 55, 118, SOFT));
      chips.push(box(cx[i], 118, 110, 24));
      chips.push(txt(cx[i] + 55, 133, cl[i], '9'));
    }
    s.appendChild(pop(chips, 260, 130, D, '0.5s'));
    var idx = [box(190, 168, 140, 30), txt(260, 187, '多 Vector 索引', '9')];
    for (i = 0; i < 3; i++) { idx.push(line(cx[i] + 55, 142, 200 + i * 60, 168, SOFT)); }
    s.appendChild(pop(idx, 260, 183, D, '0.9s'));
    s.appendChild(box(30, 214, 80, 26, BLUE, 'none'));
    s.appendChild(txt(70, 231, '查询', '10', BG));
    var q = dot('5', BLUE);
    q.appendChild(mov('M114 227 L200 186', D, { calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.55;0.72;1' }));
    q.appendChild(anim('opacity', '0;0;1;0;0', D, { keyTimes: '0;0.55;0.6;0.74;1' }));
    s.appendChild(q);
    var br = svgEl('path', { d: 'M220 28 L220 20 L286 20 L286 28', fill: 'none', stroke: WARN, 'stroke-width': '1.5' });
    br.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.76;0.82;0.94;1' }));
    var bl = txt(253, 14, '(起点, 终点)', '8', WARN);
    bl.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.76;0.82;0.94;1' }));
    s.appendChild(br); s.appendChild(bl);
    shell(host, '场景级视频索引', '每个场景包含三个 Vector', s,
      '摄取流程将视频切分为场景，每个场景并排存储三个 Vector：字幕 Embedding、关键帧 Embedding 和转录文本 Embedding。查询会同时作用于这三者，合并结果，并将最佳场景内的一个（起点, 终点）窗口作为答案返回，而不是返回整个文件。');
  }

  // ── cf-mcp-gate (13)：无状态元数据、策略、registry 和实时发现 ─
  function mcpGate(host) {
    var D = '5s', s = svg(250);
    s.appendChild(pop([box(24, 44, 92, 40), txt(70, 62, 'MCP client', '9'), txt(70, 76, '版本 + capabilities', '8', MUTE)], 70, 64, D, '0s'));
    s.appendChild(pop([box(404, 44, 92, 40), txt(450, 62, 'MCP server', '9'), txt(450, 76, '无状态', '8', MUTE)], 450, 64, D, '0.15s'));
    var pipe = line(116, 64, 404, 64, SOFT, { 'stroke-dasharray': '6 5' });
    pipe.appendChild(anim('stroke-dashoffset', '22;0', '1.4s'));
    s.appendChild(pipe);
    s.appendChild(txt(258, 30, '每条 JSON-RPC 消息使用一次 POST', '8', MUTE));
    var gr = svgEl('rect', { x: 252, y: 42, width: 10, height: 44, rx: 2, fill: WARN });
    gr.appendChild(anim('opacity', '1;1;0.3;1;1', D, { keyTimes: '0;0.24;0.28;0.34;1' }));
    s.appendChild(pop([gr, txt(257, 100, '认证 + 策略', '8', WARN)], 257, 64, D, '0.3s'));
    var p1 = dot('5', BLUE);
    p1.appendChild(mov('M116 58 L404 58', D, { calcMode: 'linear', keyPoints: '0;0.48;0.48;1;1', keyTimes: '0;0.2;0.32;0.5;1' }));
    p1.appendChild(anim('opacity', '0;1;1;0;0', D, { keyTimes: '0;0.04;0.5;0.56;1' }));
    s.appendChild(p1);
    var p2 = dot('5', WARN);
    p2.appendChild(mov('M116 70 L257 70 L257 140', D, { begin: '2.4s', calcMode: 'linear', keyPoints: '0;0.668;0.668;1;1', keyTimes: '0;0.15;0.25;0.4;1' }));
    p2.appendChild(anim('opacity', '0;1;1;1;0;0', D, { begin: '2.4s', keyTimes: '0;0.03;0.3;0.38;0.44;1' }));
    s.appendChild(p2);
    var ok = txt(257, 190, 'actor + Tool + 参数 + 过期时间', '8', WARN);
    ok.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.85;0.9;0.98;1' }));
    s.appendChild(pop([box(197, 146, 120, 28), txt(257, 163, '审批记录', '9'), ok], 257, 160, D, '0.45s'));
    var reg = [box(40, 170, 110, 30), txt(95, 184, 'registry', '9'), txt(95, 196, 'server.json', '7', MUTE),
      line(150, 185, 430, 86, SOFT, { 'stroke-dasharray': '4 3' }),
      txt(300, 152, '实时 server/discover 探测', '8', MUTE)];
    s.appendChild(pop(reg, 95, 185, D, '0.6s'));
    var poll = dot('3.5', MUTE);
    poll.appendChild(mov('M150 185 L430 86', D, { begin: '0.9s', calcMode: 'linear', keyPoints: '0;1;1', keyTimes: '0;0.22;1' }));
    poll.appendChild(anim('opacity', '0;1;0;0', D, { begin: '0.9s', keyTimes: '0;0.06;0.24;1' }));
    s.appendChild(poll);
    shell(host, '无状态 MCP GATE + REGISTRY', '逐请求检查元数据与权限', s,
      '每条 JSON-RPC 消息使用独立的 POST，并携带协议版本和 client capabilities。gate 会验证 issuer、audience、scope、Tool 和参数；具有重大影响的调用还需要绑定到该确切操作的审批记录。registry 为 server.json 发布元数据建立索引，而单独的 server/discover 探测则验证实时 endpoint 支持哪些能力。');
  }

  // ── cf-spec-decode (14)：草稿提出 k 个 Token，一次验证接受一个前缀 ─
  function specDecode(host) {
    var D = '5.5s', s = svg(240), i;
    s.appendChild(pop([box(24, 96, 88, 40), txt(68, 113, '草稿 head', '9'), txt(68, 127, 'k 个 Token', '8', MUTE), line(112, 116, 146, 116, SOFT)], 68, 116, D, '0s'));
    s.appendChild(pop([box(185, 20, 150, 30), txt(260, 39, '目标验证 pass', '9'), line(260, 50, 260, 92, SOFT, { 'stroke-dasharray': '4 3' })], 260, 35, D, '0.15s'));
    var words = ['def', 'main', '(', ')', ':'], tiles = [];
    for (i = 0; i < 5; i++) {
      var tx = 150 + i * 62, rej = i > 2, e1 = 0.06 + i * 0.045, e2 = e1 + 0.05;
      var g = svgEl('g', {}, [box(tx, 100, 52, 32), txt(tx + 26, 120, words[i], '10')]);
      g.appendChild(anim('opacity', rej ? '0;0;1;1;0.15;0.15' : '0;0;1;1', D,
        { keyTimes: rej ? '0;' + e1 + ';' + e2 + ';0.62;0.7;1' : '0;' + e1 + ';' + e2 + ';1', calcMode: 'spline', keySplines: rej ? '0 0 1 1;' + EASE + ';0 0 1 1;0.4 0 1 1;0 0 1 1' : '0 0 1 1;' + EASE + ';0 0 1 1' }));
      tiles.push(g);
      if (!rej) {
        var ov = box(tx, 100, 52, 32, 'none', BLUE);
        ov.setAttribute('stroke-width', '2');
        ov.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;' + (0.36 + i * 0.06) + ';' + (0.4 + i * 0.06) + ';1' }));
        tiles.push(ov);
      }
    }
    s.appendChild(pop(tiles, 300, 116, D, '0.25s'));
    var sweep = box(150, 94, 52, 44, 'none', BLUE);
    sweep.setAttribute('stroke-width', '1.8');
    sweep.appendChild(anim('x', '150;150;398;398', D, { keyTimes: '0;0.3;0.55;1' }));
    sweep.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.28;0.32;0.55;0.6;1' }));
    s.appendChild(sweep);
    var rs = svgEl('g', {}, [box(336, 100, 52, 32, WARN, 'none'), txt(362, 120, 'ret', '10', BG)]);
    rs.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.74;0.8;0.94;1' }));
    s.appendChild(rs);
    var rj = txt(438, 158, '已拒绝，重新采样', '8', WARN);
    rj.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.66;0.72;0.94;1' }));
    s.appendChild(rj);
    var sum = txt(150, 192, '一次目标 pass 接受 5 个中的 3 个', '9', MUTE, 'start');
    sum.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;0.5;0.6;1' }));
    s.appendChild(sum);
    shell(host, 'SPECULATIVE DECODING', '草稿提出，目标一次验证', s,
      '草稿 head 提出五个候选 Token；目标 Model 在一次验证 pass 中为所有候选评分。被接受的前缀替代了三个顺序 decode 步骤，被拒绝的后缀则被丢弃并重新采样。接受率决定加速效果，而拒绝时更大的验证 pass 正是需要单独报告 p99 延迟的原因。');
  }

  // ── cf-safety-stack (15)：五层防护，一个请求通过，一次攻击被偏转 ─
  function safetyStack(host) {
    var D = '5.5s', s = svg(270), i;
    var names = ['输入清理', 'rails / 策略', 'classifier gate', '目标 Model', '输出过滤器'];
    var stack = [];
    for (i = 0; i < 5; i++) {
      var y = 24 + i * 34, model = i === 3, gate = i === 2;
      stack.push(fade(box(150, y, 220, 26, model ? BLUE : SURF, model ? 'none' : (gate ? WARN : RULE)), D, (i * 0.08) + 's'));
      stack.push(fade(txt(260, y + 17, names[i], '9', model ? BG : INK), D, (i * 0.08) + 's'));
    }
    s.appendChild(pop(stack, 260, 105, D, '0s'));
    var safe = dot('5', BLUE);
    safe.appendChild(mov('M260 8 L260 200', D, { calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.1;0.6;1' }));
    safe.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.1;0.14;0.56;0.62;1' }));
    s.appendChild(safe);
    var atk = dot('5', WARN);
    atk.appendChild(mov('M310 8 L310 105 L430 105', D, { calcMode: 'linear', keyPoints: '0;0;0.447;0.447;1;1', keyTimes: '0;0.3;0.5;0.56;0.72;1' }));
    atk.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.3;0.34;0.7;0.76;1' }));
    s.appendChild(atk);
    var flash = box(150, 92, 220, 26, 'none', WARN);
    flash.setAttribute('stroke-width', '2');
    flash.appendChild(anim('opacity', '0;0;1;0;0', D, { keyTimes: '0;0.48;0.53;0.6;1' }));
    s.appendChild(flash);
    var blk = txt(436, 100, '已阻止', '9', WARN, 'start');
    blk.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.62;0.68;0.9;1' }));
    s.appendChild(blk);
    [0, 2, 4].forEach(function (j, n) {
      var py = 37 + j * 34;
      var pr = line(470, py, 376, py, WARN, { 'stroke-dasharray': '4 3' });
      pr.appendChild(anim('opacity', '0.15;1;0.15', '2.2s', { begin: (n * 0.5) + 's' }));
      s.appendChild(pr);
    });
    s.appendChild(txt(496, 228, 'red-team 探测：garak · PyRIT', '8', WARN, 'end'));
    var hitl = [line(340, 186, 352, 196, SOFT, { 'stroke-dasharray': '3 3' }), box(300, 196, 130, 26), txt(365, 213, 'HITL 队列', '9')];
    s.appendChild(pop(hitl, 365, 209, D, '0.55s'));
    shell(host, '分层 SAFETY HARNESS', '围绕一个 Model 的五层防护', s,
      '干净的请求会直接依次通过：清理、rails、classifier gate、Model、输出过滤器。一次 jailbreak 会深入两层，然后被 classifier gate 捕获并偏转。red-team 测试持续从外部探测每一层，输出过滤器标记为高风险的任何内容都会绕行至人工审核队列。');
  }

  // ── cf-issue-to-pr (16)：通过 sandbox 和 CI gate，从标签流转到可审核的 PR ─
  function issuePr(host) {
    var D = '5.5s', s = svg(240);
    var m = arrows(s, 'cf-a16');
    s.appendChild(pop([box(24, 60, 88, 40), txt(68, 77, 'issue', '9'), txt(68, 91, '@agent fix', '8', MUTE)], 68, 80, D, '0s'));
    s.appendChild(pop([box(142, 60, 92, 40), txt(188, 84, 'dispatcher', '9'), txt(188, 50, 'App webhook', '8', MUTE),
      box(142, 110, 92, 6), svgEl('rect', { x: 142, y: 110, width: 55, height: 6, rx: 2, fill: BLUE }),
      txt(142, 128, '今日预算 3/5', '8', MUTE, 'start')], 188, 80, D, '0.12s'));
    var tb = svgEl('rect', { x: 272, y: 88, width: 0, height: 6, rx: 2, fill: BLUE });
    tb.appendChild(anim('width', '0;0;80;80', D, { keyTimes: '0;0.35;0.6;1' }));
    s.appendChild(pop([box(264, 60, 96, 40), txt(312, 78, 'sandbox', '9'), txt(312, 50, 'clone · build · test', '8', MUTE),
      box(272, 88, 80, 6), tb], 312, 80, D, '0.24s'));
    s.appendChild(pop([svgEl('path', { d: 'M398 64 L414 80 L398 96 L382 80 z', fill: SURF, stroke: BLUE, 'stroke-width': '1.3' }),
      txt(398, 84, 'CI', '8')], 398, 80, D, '0.36s'));
    var pf = box(432, 60, 64, 40, 'none', BLUE);
    pf.setAttribute('stroke-width', '2');
    pf.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.88;0.92;0.98;1' }));
    var pl = txt(464, 118, '可供审核', '8', BLUE);
    pl.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.88;0.92;0.98;1' }));
    s.appendChild(pop([box(432, 60, 64, 40), txt(464, 84, 'PR', '10'), pf, pl], 464, 80, D, '0.48s'));
    [[112, 142], [234, 264], [360, 382], [414, 432]].forEach(function (c) {
      s.appendChild(line(c[0], 80, c[1] - 4, 80, SOFT, { 'marker-end': m }));
    });
    var pk = dot('5', BLUE);
    pk.appendChild(mov('M28 80 L462 80', D, { calcMode: 'linear', keyPoints: '0;0.369;0.369;0.654;0.654;0.852;1', keyTimes: '0;0.15;0.22;0.33;0.62;0.75;1' }));
    pk.appendChild(anim('opacity', '0;1;1;0;0', D, { keyTimes: '0;0.03;0.86;0.92;1' }));
    s.appendChild(pk);
    s.appendChild(txt(28, 225, '分支保护：禁止直接写入 main · 禁止 force-push', '8', MUTE, 'start'));
    shell(host, 'ISSUE-TO-PR PIPELINE', '输入标签，输出可审核的 PR', s,
      '带标签的 issue 会触发 GitHub App webhook；dispatcher 在加入队列前检查每个 repo 的每日预算。sandbox 从头复现 build，并在完整测试套件通过前保持任务等待。只有绿色的 CI gate 才会创建 PR，而禁止 force-push 靠的是分支保护，不是 Agent 的自觉。');
  }

  // ── cf-tutor-loop (17)：苏格拉底式交流更新知识图谱上的掌握度条 ──
  function tutorLoop(host) {
    var D = '5.5s', s = svg(250), i;
    var m = arrows(s, 'cf-a17');
    s.appendChild(pop([box(30, 44, 92, 36), txt(76, 66, '学习者', '9')], 76, 62, D, '0s'));
    s.appendChild(pop([box(30, 156, 92, 36), txt(76, 172, '导师策略', '9'), txt(76, 186, '苏格拉底式', '8', MUTE)], 76, 174, D, '0.12s'));
    s.appendChild(line(60, 84, 60, 148, SOFT, { 'marker-end': m }));
    s.appendChild(line(92, 152, 92, 92, SOFT, { 'marker-end': m }));
    s.appendChild(txt(54, 121, '回答', '7', MUTE, 'end'));
    s.appendChild(txt(98, 121, '提示', '7', MUTE, 'start'));
    var ad = dot('4', BLUE);
    ad.appendChild(mov('M60 84 L60 148', D, { calcMode: 'linear', keyPoints: '0;1;1', keyTimes: '0;0.14;1' }));
    ad.appendChild(anim('opacity', '0;1;0;0', D, { keyTimes: '0;0.06;0.16;1' }));
    s.appendChild(ad);
    var hd = dot('4', WARN);
    hd.appendChild(mov('M92 152 L92 88', D, { begin: '1.4s', calcMode: 'linear', keyPoints: '0;1;1', keyTimes: '0;0.14;1' }));
    hd.appendChild(anim('opacity', '0;1;0;0', D, { begin: '1.4s', keyTimes: '0;0.06;0.16;1' }));
    s.appendChild(hd);
    var graph = [line(122, 170, 224, 80, SOFT, { 'stroke-dasharray': '4 3' }), txt(180, 138, '图谱遍历', '8', MUTE)];
    var cxs = [240, 330, 420];
    for (i = 0; i < 3; i++) {
      graph.push(svgEl('circle', { cx: cxs[i], cy: 70, r: '16', fill: SURF, stroke: RULE, 'stroke-width': '1.3' }));
      graph.push(txt(cxs[i], 74, 'c' + (i + 1), '9'));
      graph.push(box(cxs[i] - 18, 96, 36, 5));
      if (i < 2) { graph.push(line(cxs[i] + 16, 70, cxs[i + 1] - 20, 70, SOFT, { 'marker-end': m })); }
    }
    var mb = svgEl('rect', { x: 222, y: 96, width: 0, height: 5, rx: 2, fill: BLUE });
    mb.appendChild(anim('width', '0;12;12;24;24;36;36', D, { keyTimes: '0;0.12;0.28;0.4;0.56;0.68;1' }));
    graph.push(mb);
    var ring = svgEl('circle', { cx: 330, cy: 70, r: '20', fill: 'none', stroke: BLUE, 'stroke-width': '1.6' });
    ring.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;0.7;0.78;1' }));
    graph.push(ring);
    var nx = txt(330, 40, '下一个概念', '8', BLUE);
    nx.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;0.7;0.78;1' }));
    graph.push(nx);
    s.appendChild(pop(graph, 330, 90, D, '0.3s'));
    s.appendChild(txt(28, 232, '每次互动后更新掌握度（knowledge tracing）', '8', MUTE, 'start'));
    shell(host, '苏格拉底式循环 + 学习者 MODEL', '每轮交流都会推进掌握度条', s,
      '导师绝不会直接给出答案：每次学习者回复后，导师都会返回一个引导性问题或分层提示。每轮交流都会更新当前概念的掌握概率；当进度条填满时，策略会沿课程图谱中的先修依赖边继续遍历，并点亮下一个概念。');
  }

  // ── cf-loop-contract (20)：一个 Token 遍历六状态状态机，事件依次产生 ─
  function loopContract(host) {
    var D = '6s', s = svg(260), i;
    var m = arrows(s, 'cf-a20');
    var st = [['IDLE', 30, 40, 64], ['PLANNING', 140, 24, 86], ['EXECUTING', 270, 40, 92], ['AWAITING_TOOL', 392, 96, 104], ['REFLECTING', 268, 152, 92], ['DONE', 70, 152, 60]];
    var pulses = ['0.55s', '1.15s', '1.9s', '2.65s', '3.4s', '5.5s'];
    var nodes = [];
    for (i = 0; i < st.length; i++) {
      var b = st[i], done = i === 5;
      nodes.push(fade(box(b[1], b[2], b[3], 26, done ? BLUE : SURF, done ? 'none' : RULE), D, (i * 0.07) + 's'));
      nodes.push(fade(txt(b[1] + b[3] / 2, b[2] + 17, b[0], '9', done ? BG : INK), D, (i * 0.07) + 's'));
      var ov = box(b[1], b[2], b[3], 26, 'none', BLUE);
      ov.setAttribute('stroke-width', '2');
      ov.appendChild(anim('opacity', '0;1;0;0', D, { begin: pulses[i], keyTimes: '0;0.04;0.1;1' }));
      nodes.push(ov);
    }
    [[94, 60, 140, 46], [226, 42, 270, 50], [362, 60, 400, 96], [428, 122, 336, 152], [300, 152, 310, 66], [268, 165, 130, 165]].forEach(function (e) {
      nodes.push(line(e[0], e[1], e[2], e[3], SOFT, { 'marker-end': m }));
    });
    s.appendChild(pop(nodes, 260, 100, D, '0s'));
    var tk = dot('5', BLUE);
    tk.appendChild(mov('M62 53 L183 37 L316 53 L444 109 L314 165 L316 53 L444 109 L314 165 L100 165', D));
    tk.appendChild(anim('opacity', '0;1;1;0', D, { keyTimes: '0;0.04;0.96;1' }));
    s.appendChild(tk);
    s.appendChild(line(30, 214, 490, 214, RULE));
    for (i = 0; i < 8; i++) {
      var t = 0.1 + i * 0.115;
      var tick = svgEl('rect', { x: 40 + i * 56, y: 208, width: 4, height: 12, rx: 1, fill: BLUE });
      tick.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;' + t.toFixed(2) + ';' + (t + 0.03).toFixed(2) + ';1' }));
      s.appendChild(tick);
    }
    s.appendChild(txt(30, 236, '类型化事件流', '8', MUTE, 'start'));
    s.appendChild(txt(490, 236, '预算：轮次 · Tool 调用 · 墙钟时间', '8', MUTE, 'end'));
    shell(host, 'HARNESS 循环契约', '六种状态，一次可审计的遍历', s,
      '该循环是一个确定性状态机，而不是聊天 while-loop。一个运行 Token 从 IDLE 开始，依次经过 PLANNING、EXECUTING、AWAITING_TOOL 和 REFLECTING，在预算允许的范围内多次执行内部的 execute-reflect 循环，最终进入 DONE。每次状态转换都会向事件流发出类型化事件，因此 UI 和 tracer 只需订阅事件，无须检查循环内部。');
  }

  // ── cf-registry-validate (21)：错误参数携带 json-pointer 被退回，正确参数到达 handler ─
  function registryValidate(host) {
    var D = '5.5s', s = svg(240);
    s.appendChild(pop([box(24, 88, 80, 40), txt(64, 112, 'Model', '9')], 64, 108, D, '0s'));
    var sr = box(194, 92, 132, 24, SURF, BLUE);
    s.appendChild(pop([box(180, 36, 160, 140, BG, RULE), txt(260, 52, 'Tool registry', '9'),
      box(194, 62, 132, 24), txt(260, 77, '名称', '8'),
      sr, txt(260, 107, 'schema 检查', '8'),
      box(194, 122, 132, 24), txt(260, 137, 'handler 引用', '8'),
      txt(260, 166, '禁止静默覆盖', '7', MUTE)], 260, 106, D, '0.15s'));
    s.appendChild(pop([box(416, 88, 80, 40), txt(456, 112, 'handler', '9')], 456, 108, D, '0.3s'));
    var c1 = dot('4.5', WARN);
    c1.appendChild(mov('M104 100 L194 104', D, { calcMode: 'linear', keyPoints: '0;1;1', keyTimes: '0;0.12;1' }));
    c1.appendChild(anim('opacity', '0;1;1;0;0', D, { keyTimes: '0;0.02;0.12;0.16;1' }));
    s.appendChild(c1);
    var f1 = box(194, 92, 132, 24, 'none', WARN);
    f1.setAttribute('stroke-width', '2');
    f1.appendChild(anim('opacity', '0;0;1;0;0', D, { keyTimes: '0;0.13;0.18;0.24;1' }));
    s.appendChild(f1);
    var b1 = dot('4.5', WARN);
    b1.appendChild(mov('M194 104 L104 84', D, { calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.2;0.32;1' }));
    b1.appendChild(anim('opacity', '0;0;1;0;0', D, { keyTimes: '0;0.2;0.3;0.34;1' }));
    s.appendChild(b1);
    var er = txt(28, 74, '/args/limit：应为整数', '8', WARN, 'start');
    er.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.24;0.3;0.48;1' }));
    s.appendChild(er);
    var c2 = dot('4.5', BLUE);
    c2.appendChild(mov('M104 112 L416 112', D, { calcMode: 'linear', keyPoints: '0;0;0.288;0.288;1;1', keyTimes: '0;0.5;0.58;0.66;0.8;1' }));
    c2.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.5;0.53;0.79;0.83;1' }));
    s.appendChild(c2);
    var f2 = box(194, 92, 132, 24, 'none', BLUE);
    f2.setAttribute('stroke-width', '2');
    f2.appendChild(anim('opacity', '0;0;1;0;0', D, { keyTimes: '0;0.6;0.66;0.72;1' }));
    s.appendChild(f2);
    var hp = box(416, 88, 80, 40, 'none', BLUE);
    hp.setAttribute('stroke-width', '2');
    hp.appendChild(anim('opacity', '0;0;1;1;0', D, { keyTimes: '0;0.8;0.85;0.94;1' }));
    s.appendChild(hp);
    s.appendChild(txt(28, 220, 'schema 是数据，handler 是代码：validator 从不接触 I/O', '8', MUTE, 'start'));
    shell(host, 'REGISTRY + SCHEMA GATE', '在运行任何 handler 前进行验证', s,
      'registry 会一次性固定名称、schema 与 handler 的对应关系，之后 dispatcher 便会信任该关系。错误调用绝不会到达 handler：schema 检查会将其退回，并附上 Model 可在一次往返中修复的 json-pointer 路径。修正后的调用会通过同一个纯 validator，只有这时才会接触代码。');
  }

  // ── cf-jsonrpc-frames (22)：每行一个 JSON frame，id 将通信配对 ─
  function jsonrpcFrames(host) {
    var D = '6s', s = svg(250);
    s.appendChild(line(80, 36, 80, 224, SOFT));
    s.appendChild(line(440, 36, 440, 224, SOFT));
    s.appendChild(txt(80, 26, 'client', '9'));
    s.appendChild(txt(440, 26, 'server', '9'));
    s.appendChild(txt(260, 26, '每个 \\n 行包含一个 frame', '8', MUTE));
    function frame(y, label, stroke, begin, toLeft) {
      var x0 = toLeft ? 230 : 90;
      var g = svgEl('g', {}, [box(x0, y, 200, 18, SURF, stroke), txt(x0 + 6, y + 13, label, '8', INK, 'start')]);
      g.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;' + (toLeft ? -150 : 150) + ' 0;' + (toLeft ? -150 : 150) + ' 0', dur: D, begin: begin, repeatCount: 'indefinite', calcMode: 'spline', keySplines: EASE + ';0 0 1 1', keyTimes: '0;0.14;1' }));
      g.appendChild(anim('opacity', '0;1;1;0;0', D, { begin: begin, keyTimes: '0;0.04;0.16;0.2;1', calcMode: 'spline', keySplines: EASE + ';0 0 1 1;0.4 0 1 1;0 0 1 1' }));
      s.appendChild(g);
    }
    frame(44, '{"id":7,"method":"tools/call"}', BLUE, '0s', false);
    frame(74, '{"id":7,"result":{...}}', BLUE, '0.9s', true);
    frame(104, '{"method":"progress"}', RULE, '1.9s', false);
    var no = txt(90, 134, 'notification：无 id，无回复', '8', MUTE, 'start');
    no.appendChild(anim('opacity', '0;0;1;1;0', D, { begin: '1.9s', keyTimes: '0;0.1;0.16;0.3;1' }));
    s.appendChild(no);
    frame(140, '{"id":9,"met###', WARN, '3.1s', false);
    frame(170, '{"id":null,"error":{"code":-32700}}', WARN, '3.9s', true);
    frame(200, '{"id":10,"method":"ping"}', RULE, '4.7s', false);
    var cont = txt(260, 240, '单行损坏，数据流继续', '8', MUTE);
    cont.appendChild(anim('opacity', '0;0;1;1', D, { begin: '4.7s', keyTimes: '0;0.08;0.14;1' }));
    s.appendChild(cont);
    shell(host, '通过 STDIO 传输 JSON-RPC', '以换行符分隔的 frame', s,
      '每条消息都是单独一行中的一个 JSON object。request 携带 id，并会收到恰好一个具有相同 id 的 response；notification 不携带 id，因此绝不能返回任何内容。乱码行会产生 id 为 null 的 -32700 parse error，而紧随其后的下一行仍可正常解析：一个损坏的 frame 绝不会污染整个数据流。');
  }

  // ── cf-dispatch-retry (23)：超时、带 jitter 的 backoff、去重、单一 envelope ─
  function dispatchRetry(host) {
    var D = '6s', s = svg(250);
    var m = arrows(s, 'cf-a23');
    s.appendChild(pop([box(24, 28, 96, 34), txt(72, 49, 'harness 循环', '9')], 72, 45, D, '0s'));
    s.appendChild(pop([box(150, 20, 240, 50, SURF, BLUE), txt(270, 40, 'dispatcher', '10'), txt(270, 56, '超时 · 重试 · 去重', '8', MUTE)], 270, 45, D, '0.12s'));
    s.appendChild(pop([box(420, 28, 80, 34), txt(460, 49, 'handler', '9')], 460, 45, D, '0.24s'));
    s.appendChild(line(120, 45, 146, 45, SOFT, { 'marker-end': m }));
    s.appendChild(line(390, 45, 416, 45, SOFT, { 'marker-end': m }));
    s.appendChild(line(60, 168, 490, 168, RULE));
    s.appendChild(txt(60, 184, 't', '8', MUTE, 'start'));
    function attempt(x, w, ok, t0, t1, label) {
      var r = svgEl('rect', { x: x, y: 150, width: 0, height: 14, rx: 2, fill: ok ? BLUE : SURF, stroke: ok ? 'none' : RULE, 'stroke-width': '1.3' });
      r.appendChild(anim('width', '0;0;' + w + ';' + w, D, { keyTimes: '0;' + t0 + ';' + t1 + ';1' }));
      s.appendChild(r);
      s.appendChild(txt(x + w / 2, 144, label, '7', MUTE));
      if (!ok) {
        var g = svgEl('g', {}, [line(x + w - 6, 147, x + w + 6, 161, WARN), line(x + w + 6, 147, x + w - 6, 161, WARN)]);
        g.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;' + (t1 + 0.01) + ';' + (t1 + 0.05) + ';1' }));
        s.appendChild(g);
      }
    }
    attempt(70, 70, false, 0.05, 0.2, '尝试 1');
    attempt(158, 70, false, 0.3, 0.45, '尝试 2');
    attempt(264, 56, true, 0.58, 0.7, '尝试 3');
    var okc = svgEl('circle', { cx: 334, cy: 157, r: '7', fill: 'none', stroke: BLUE, 'stroke-width': '1.6' });
    okc.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;0.71;0.75;1' }));
    s.appendChild(okc);
    s.appendChild(txt(149, 184, '1s', '7', MUTE));
    s.appendChild(txt(246, 184, '2s + jitter', '7', MUTE));
    var gh = svgEl('g', {}, [box(158, 124, 70, 14, 'none', WARN), txt(193, 120, '重复，key a1f3', '7', WARN)]);
    gh.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', values: '0 0;0 0;0 22;0 22', dur: D, keyTimes: '0;0.38;0.47;1', repeatCount: 'indefinite' }));
    gh.appendChild(anim('opacity', '0;0;1;0;0', D, { keyTimes: '0;0.32;0.38;0.48;1' }));
    s.appendChild(gh);
    s.appendChild(txt(105, 132, 'key a1f3', '7', MUTE));
    var env = svgEl('g', {}, [box(360, 100, 130, 24, BG, BLUE), txt(425, 116, '类型化结果 envelope', '8'),
      line(360, 110, 124, 60, BLUE, { 'stroke-dasharray': '4 3' })]);
    env.appendChild(anim('opacity', '0;0;1;1', D, { keyTimes: '0;0.76;0.83;1' }));
    s.appendChild(env);
    s.appendChild(txt(490, 234, '并行 dispatch 上限：最大 in-flight 数', '8', MUTE, 'end'));
    shell(host, 'DISPATCHER 接口层', '超时、backoff、去重、单一 envelope', s,
      '第一次尝试会一直运行到单次调用超时，然后返回类型化错误，而不是让循环挂起。每次重试前，backoff 都会在加入 jitter 的情况下翻倍；若重复请求与 in-flight 尝试发生竞争，则会根据 idempotency key 合并到同一尝试中。无论发生什么，循环都会收到统一的 envelope 结构：结果或映射后的错误，绝不会收到原始 stack trace。');
  }

  LF.register({
    'cf-scene-index': sceneIndex,
    'cf-mcp-gate': mcpGate,
    'cf-spec-decode': specDecode,
    'cf-safety-stack': safetyStack,
    'cf-issue-to-pr': issuePr,
    'cf-tutor-loop': tutorLoop,
    'cf-loop-contract': loopContract,
    'cf-registry-validate': registryValidate,
    'cf-jsonrpc-frames': jsonrpcFrames,
    'cf-dispatch-retry': dispatchRetry
  });
})();
