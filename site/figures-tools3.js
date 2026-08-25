/* figures-tools3.js - Phase 13 tools 与 protocols 的动画课程图示，
   第三批。在 lesson-figures.js 之后加载，并通过 window.LF 注册。
   无依赖，仅支持 ES5，通过 CSS vars 设置主题，仅使用 SMIL。
   编写方式：使用 ```figure block，并指定下方某个 t3- widget。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;
  var EASE = '0.23 1 0.32 1';

  function out(svg) { return el('div', { class: 'lf-out' }, [svg]); }
  function cap(text) { return el('div', { class: 'lf-cap' }, [text]); }
  function head(label, hint) {
    return el('div', { class: 'lf-head' }, [
      el('span', { class: 'lf-label' }, [label]),
      el('span', {}, [hint])
    ]);
  }
  function txt(x, y, s, size, fill, anchor) {
    var t = svgEl('text', {
      x: x, y: y, 'text-anchor': anchor || 'middle',
      'font-family': 'var(--font-mono,monospace)', 'font-size': size || '11',
      fill: fill || 'var(--ink-soft,#555)'
    });
    t.appendChild(document.createTextNode(s));
    return t;
  }
  function box(x, y, w, h, stroke) {
    return svgEl('rect', {
      x: x, y: y, width: w, height: h, rx: '4',
      fill: 'var(--bg-surface,#eee)',
      stroke: stroke || 'var(--rule-soft,#ddd)', 'stroke-width': '1.4'
    });
  }
  function anim(attr, vals, keyTimes, dur, extra) {
    var a = { attributeName: attr, values: vals, keyTimes: keyTimes, dur: dur, repeatCount: 'indefinite' };
    if (extra) { for (var k in extra) { a[k] = extra[k]; } }
    return svgEl('animate', a);
  }
  // packet：沿路径移动的 group，通过 keyPoints 停在两端，
  // 仅在其 keyTimes 窗口内可见，使循环保持同步
  function packet(kids, path, dur, moveTimes, opVals, opTimes) {
    var g = svgEl('g', { opacity: '0' }, kids);
    g.appendChild(svgEl('animateMotion', {
      path: path, dur: dur, repeatCount: 'indefinite', calcMode: 'linear',
      keyPoints: '0;0;1;1', keyTimes: moveTimes
    }));
    g.appendChild(anim('opacity', opVals, opTimes, dur));
    return g;
  }
  // entry：从 opacity 0、95% 大小开始淡入，使用缓动，完成后冻结
  function enter(x, y, begin, kids) {
    var inner = svgEl('g', { opacity: '0' }, kids);
    inner.appendChild(svgEl('animate', {
      attributeName: 'opacity', values: '0;1', keyTimes: '0;1', dur: '0.55s',
      begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: EASE
    }));
    inner.appendChild(svgEl('animateTransform', {
      attributeName: 'transform', type: 'scale', values: '0.95;1', keyTimes: '0;1',
      dur: '0.55s', begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: EASE
    }));
    return svgEl('g', { transform: 'translate(' + x + ' ' + y + ')' }, [inner]);
  }
  function chip(w, label) {
    return [
      svgEl('rect', { x: -w / 2, y: -10, width: w, height: 20, rx: '3', fill: 'var(--blueprint,#3553ff)' }),
      txt(0, 4, label, '9', 'var(--bg,#fafaf5)')
    ];
  }

  // t3-dispatch-loop：从 stdin 输入 JSON-RPC 行，在 stdout 输出匹配的响应
  function dispatchLoop(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(svgEl('line', { x1: 20, y1: 80, x2: 188, y2: 80, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.4' }));
    svg.appendChild(svgEl('line', { x1: 332, y1: 80, x2: 500, y2: 80, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.4' }));
    svg.appendChild(svgEl('line', { x1: 20, y1: 180, x2: 188, y2: 180, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.4' }));
    svg.appendChild(svgEl('line', { x1: 332, y1: 180, x2: 500, y2: 180, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.4', 'stroke-dasharray': '3 5' }));
    svg.appendChild(txt(20, 66, 'stdin', '9', 'var(--ink-mute,#777)', 'start'));
    svg.appendChild(txt(500, 66, 'stdout', '9', 'var(--ink-mute,#777)', 'end'));
    svg.appendChild(txt(500, 168, '无写入内容', '8', 'var(--ink-mute,#777)', 'end'));
    svg.appendChild(enter(260, 130, '0.1s', [
      box(-72, -60, 144, 120),
      txt(0, -34, 'dispatch', '11', 'var(--ink,#1a1a1a)'),
      txt(0, -16, '有 id：响应', '8', 'var(--ink-mute,#777)'),
      txt(0, 0, '无 id：消费', '8', 'var(--ink-mute,#777)'),
      txt(0, 42, '日志写入 stderr', '8', 'var(--warn,#b8870f)')
    ]));
    svg.appendChild(packet(chip(66, 'req id:7'), 'M46 80 L186 80', '6s',
      '0;0.04;0.3;1', '0;1;1;0;0', '0;0.05;0.28;0.33;1'));
    svg.appendChild(packet(chip(70, 'resp id:7'), 'M336 80 L474 80', '6s',
      '0;0.42;0.62;1', '0;0;1;1;0;0', '0;0.42;0.44;0.6;0.64;1'));
    svg.appendChild(packet(chip(84, 'notification'), 'M48 180 L230 180', '6s',
      '0;0.55;0.8;1', '0;0;1;1;0;0', '0;0.55;0.57;0.8;0.88;1'));
    host.appendChild(el('div', { class: 'lf' }, [
      head('DISPATCH LOOP', '输入一行 JSON，输出一行匹配结果'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('server 从 stdin 逐行读取 JSON object。带有 id 的 message 是 request，必须在 stdout 上产生恰好一个携带相同 id 的 response。notification 没有 id，也不会产生任何输出。向 stdout 打印任何其他内容都会破坏通信线路，因此 debug 输出应写入 stderr。')
    ]));
  }

  // t3-primitive-sort：将 Capability 路由到 Tool、resource 或 Prompt
  function primitiveSort(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    svg.appendChild(txt(260, 20, 'capability', '9', 'var(--ink-mute,#777)'));
    svg.appendChild(enter(260, 110, '0.1s', [
      svgEl('polygon', { points: '0,-28 46,0 0,28 -46,0', fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.4' }),
      txt(0, 4, '哪种单元？', '10', 'var(--ink,#1a1a1a)')
    ]));
    var bins = [
      { x: 90, t: 'tool', s: '修改或搜索', d: '0.2s' },
      { x: 260, t: 'resource', s: '作为 Context 附加', d: '0.32s' },
      { x: 430, t: 'prompt', s: '重新运行工作流', d: '0.44s' }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      svg.appendChild(enter(bins[i].x, 208, bins[i].d, [
        box(-62, -24, 124, 48),
        txt(0, -3, bins[i].t, '11', 'var(--blueprint,#3553ff)'),
        txt(0, 13, bins[i].s, '8', 'var(--ink-mute,#777)')
      ]));
    }
    svg.appendChild(packet(chip(94, 'notes_search'), 'M260 34 L260 100 C260 152 90 140 90 178', '6s',
      '0;0.03;0.29;1', '0;1;1;0;0', '0;0.04;0.28;0.32;1'));
    svg.appendChild(packet(chip(78, 'notes://42'), 'M260 34 L260 178', '6s',
      '0;0.36;0.62;1', '0;0;1;1;0;0', '0;0.36;0.38;0.61;0.65;1'));
    svg.appendChild(packet(chip(94, '/review_note'), 'M260 34 L260 100 C260 152 430 140 430 178', '6s',
      '0;0.69;0.95;1', '0;0;1;1;0;0', '0;0.69;0.71;0.94;0.98;1'));
    host.appendChild(el('div', { class: 'lf' }, [
      head('PRIMITIVE SORT', 'Tool、resource 或 Prompt'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('并非所有内容都是 Tool。如果 Model 应该根据每次 query 决定是否调用它，它就是 Tool。如果由用户将其作为 Context 附加，它就是 resource。如果可复用单元是一个完整工作流，它就是 Prompt。以这种方式整理 notes server，可以减少普通读取操作的 Model 往返，并让每项 Capability 使用 host 已经为其构建的 UX 界面。')
    ]));
  }

  // t3-sampling-flip：通过当前 MRTR 表达已弃用的 Sampling
  function samplingFlip(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' });
    svg.appendChild(enter(105, 115, '0.1s', [
      box(-80, -55, 160, 110),
      txt(0, -32, 'client', '11', 'var(--ink,#1a1a1a)'),
      txt(0, -16, 'LLM + 计费', '8', 'var(--ink-mute,#777)'),
      txt(12, 38, 'API key', '8', 'var(--warn,#b8870f)', 'start')
    ]));
    svg.appendChild(enter(415, 115, '0.25s', [
      box(-80, -55, 160, 110),
      txt(0, -32, 'server', '11', 'var(--ink,#1a1a1a)'),
      txt(0, -16, '负责管理循环', '8', 'var(--ink-mute,#777)'),
      txt(0, 38, '无凭据', '8', 'var(--ink-mute,#777)')
    ]));
    var key = svgEl('circle', { cx: 98, cy: 150, r: 5, fill: 'var(--warn,#b8870f)' });
    key.appendChild(anim('opacity', '0.45;1;0.45', '0;0.5;1', '3s'));
    svg.appendChild(key);
    svg.appendChild(txt(260, 74, 'tools/call + request meta', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(260, 116, 'input_required + sampling inputRequest', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(260, 158, 'retry + inputResponses', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(packet(chip(46, 'call'), 'M187 86 L333 86', '5.5s',
      '0;0.02;0.24;1', '0;1;1;0;0', '0;0.03;0.23;0.27;1'));
    svg.appendChild(packet(chip(46, 'ask'), 'M333 128 L187 128', '5.5s',
      '0;0.34;0.56;1', '0;0;1;1;0;0', '0;0.34;0.36;0.55;0.59;1'));
    svg.appendChild(packet(chip(56, 'answer'), 'M187 170 L333 170', '5.5s',
      '0;0.66;0.88;1', '0;0;1;1;0;0', '0;0.66;0.68;0.87;0.92;1'));
    host.appendChild(el('div', { class: 'lf' }, [
      head('通过 MRTR 使用已弃用的 SAMPLING', '不发送未经请求的反向 request'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('新 MCP 设计已弃用 Sampling；应改为直接调用 Model provider。兼容性 server 不会在当前 protocol 中发送反向 request。它会返回 resultType input_required 和一个 Sampling inputRequest；client 根据自己的策略获取 completion，然后使用 inputResponses 和完全一致的 requestState 重试原始 method。')
    ]));
  }

  // t3-roots-boundary：新设计使用显式 resource scope 取代 Roots
  function rootsBoundary(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(enter(80, 108, '0.1s', [
      box(-58, -30, 116, 60),
      txt(0, -4, 'notes server', '10', 'var(--ink,#1a1a1a)'),
      txt(0, 13, '验证 scope', '8', 'var(--ink-mute,#777)')
    ]));
    svg.appendChild(enter(375, 92, '0.25s', [
      svgEl('rect', { x: -125, y: -66, width: 250, height: 132, rx: '5', fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6', 'stroke-dasharray': '6 5' }),
      txt(0, -50, 'tool arg: scope=file:///project/Notes', '9', 'var(--blueprint,#3553ff)'),
      box(-52, -16, 104, 34),
      txt(0, 5, 'meeting.md', '9', 'var(--ink,#1a1a1a)')
    ]));
    svg.appendChild(enter(375, 210, '0.4s', [
      txt(0, 0, '~/.ssh/id_rsa', '9', 'var(--ink-mute,#777)')
    ]));
    svg.appendChild(packet(chip(46, 'read'), 'M140 96 C220 96 240 93 318 93', '5s',
      '0;0.04;0.3;1', '0;1;1;0;0', '0;0.05;0.29;0.34;1'));
    var ok = svgEl('circle', { cx: 322, cy: 93, r: 6, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6', opacity: '0' });
    ok.appendChild(anim('r', '6;16;6', '0;0.5;1', '5s'));
    ok.appendChild(anim('opacity', '0;0;0.9;0;0', '0;0.3;0.36;0.44;1', '5s'));
    svg.appendChild(ok);
    svg.appendChild(packet(chip(46, 'read'), 'M140 124 C220 160 240 200 302 207', '5s',
      '0;0.52;0.78;1', '0;0;1;1;0;0', '0;0.52;0.54;0.78;0.86;1'));
    var rej = txt(375, 232, '位于 root 外：已拒绝', '9', 'var(--warn,#b8870f)');
    rej.setAttribute('opacity', '0');
    rej.appendChild(anim('opacity', '0;0;1;1;0', '0;0.78;0.82;0.94;1', '5s'));
    svg.appendChild(rej);
    host.appendChild(el('div', { class: 'lf' }, [
      head('显式 RESOURCE SCOPE', '新设计已弃用 Roots'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('将已授权的目录或 resource URI 作为显式 Tool argument、resource reference 或 server configuration 传入。server 会在访问前解析每条路径，并确保它位于允许范围内，因此内部读取成功，而外部路径被拒绝。MCP Roots 仅在其弃用窗口期间继续可用，并且绝不能取代 authorization 或 OS sandbox。')
    ]));
  }

  // t3-ui-sandbox：ui:// payload 在 iframe 中渲染，通过 postMessage 向外通信
  function uiSandbox(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    svg.appendChild(enter(85, 125, '0.1s', [
      box(-60, -34, 120, 68),
      txt(0, -8, 'MCP server', '10', 'var(--ink,#1a1a1a)'),
      txt(0, 10, 'ui://notes/timeline', '8', 'var(--blueprint,#3553ff)')
    ]));
    svg.appendChild(enter(370, 125, '0.25s', [
      box(-125, -95, 250, 190),
      txt(0, -78, 'host window', '9', 'var(--ink-mute,#777)'),
      txt(0, 82, '除非授权，否则无网络访问', '8', 'var(--ink-mute,#777)')
    ]));
    svg.appendChild(enter(370, 115, '0.9s', [
      svgEl('rect', { x: -100, y: -55, width: 200, height: 110, rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.6' }),
      txt(0, -38, 'sandboxed iframe', '9', 'var(--blueprint,#3553ff)'),
      svgEl('rect', { x: -80, y: -22, width: 160, height: 12, rx: '2', fill: 'var(--bg-surface,#eee)' }),
      svgEl('rect', { x: -80, y: -2, width: 118, height: 12, rx: '2', fill: 'var(--bg-surface,#eee)' }),
      svgEl('rect', { x: -80, y: 18, width: 140, height: 12, rx: '2', fill: 'var(--bg-surface,#eee)' }),
      txt(0, 47, 'CSP 已锁定', '8', 'var(--warn,#b8870f)')
    ]));
    svg.appendChild(packet(chip(46, 'html'), 'M147 125 L266 125', '5s',
      '0;0.03;0.27;1', '0;1;1;0;0', '0;0.04;0.26;0.31;1'));
    var hop1 = svgEl('circle', { r: 4, fill: 'var(--blueprint,#3553ff)', opacity: '0' }, []);
    hop1.appendChild(svgEl('animateMotion', { path: 'M340 170 C340 196 340 196 340 212', dur: '5s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.45;0.6;1' }));
    hop1.appendChild(anim('opacity', '0;0;1;1;0;0', '0;0.45;0.47;0.58;0.62;1', '5s'));
    svg.appendChild(hop1);
    var hop2 = svgEl('circle', { r: 4, fill: 'var(--ink-soft,#555)', opacity: '0' }, []);
    hop2.appendChild(svgEl('animateMotion', { path: 'M400 212 C400 196 400 196 400 170', dur: '5s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.68;0.83;1' }));
    hop2.appendChild(anim('opacity', '0;0;1;1;0;0', '0;0.68;0.7;0.81;0.85;1', '5s'));
    svg.appendChild(hop2);
    svg.appendChild(txt(485, 196, 'postMessage', '8', 'var(--ink-mute,#777)', 'end'));
    host.appendChild(el('div', { class: 'lf' }, [
      head('MCP APPS SANDBOX', '将 ui:// 放入 iframe，通过 sandbox 边界传递 message'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('Tool result 指定一个 ui:// resource，host 会在 sandboxed iframe 内渲染其 HTML。frame 使用严格锁定的 CSP，并且除非 metadata 授权，否则不能访问网络，因此进出的唯一方式是通过 sandbox 边界传递精简版 postMessage JSON-RPC dialect。同一个 HTML bundle 在每个兼容 client 中都能得到相同的渲染结果。')
    ]));
  }

  // t3-scope-stepup：返回带 WWW-Authenticate 的 403、征得同意，并使用更多 scope 重试
  function scopeStepup(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    svg.appendChild(enter(70, 90, '0.1s', [
      box(-50, -30, 100, 60),
      txt(0, 5, 'client', '11', 'var(--ink,#1a1a1a)')
    ]));
    svg.appendChild(enter(450, 90, '0.25s', [
      box(-50, -30, 100, 60),
      txt(0, -3, 'server', '11', 'var(--ink,#1a1a1a)'),
      txt(0, 14, '需要写入权限', '8', 'var(--ink-mute,#777)')
    ]));
    svg.appendChild(enter(260, 208, '0.4s', [
      box(-70, -24, 140, 48),
      txt(0, -2, '用户同意', '10', 'var(--ink,#1a1a1a)'),
      txt(0, 14, '授予 notes:write？', '8', 'var(--ink-mute,#777)')
    ]));
    svg.appendChild(packet(chip(84, 'notes:read'), 'M122 72 L398 72', '6s',
      '0;0.02;0.2;1', '0;1;1;0;0', '0;0.03;0.19;0.23;1'));
    var deny = svgEl('g', { opacity: '0' }, chip(102, '403 step-up'));
    deny.appendChild(svgEl('animateMotion', { path: 'M398 108 L122 108', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.24;0.42;1' }));
    deny.appendChild(anim('opacity', '0;0;1;1;0;0', '0;0.24;0.26;0.41;0.45;1', '6s'));
    deny.firstChild.setAttribute('fill', 'var(--warn,#b8870f)');
    svg.appendChild(deny);
    svg.appendChild(txt(260, 128, 'WWW-Authenticate: scope=notes:write', '8', 'var(--warn,#b8870f)'));
    svg.appendChild(packet(chip(46, 'ask'), 'M84 120 C84 184 130 202 186 206', '6s',
      '0;0.46;0.6;1', '0;0;1;1;0;0', '0;0.46;0.48;0.59;0.63;1'));
    svg.appendChild(packet(chip(52, 'grant'), 'M334 206 C390 202 436 184 436 120', '6s',
      '0;0.62;0.76;1', '0;0;1;1;0;0', '0;0.62;0.64;0.75;0.79;1'));
    var retry = svgEl('g', { opacity: '0' }, chip(140, 'notes:read+write'));
    retry.appendChild(svgEl('animateMotion', { path: 'M122 40 L398 40', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;0.8;0.96;1' }));
    retry.appendChild(anim('opacity', '0;0;1;1;0', '0;0.8;0.82;0.97;1', '6s'));
    svg.appendChild(retry);
    host.appendChild(el('div', { class: 'lf' }, [
      head('SCOPE STEP-UP', '只提升一个 scope，而不是重走整个流程'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('scope 为 notes:read 的 Token 遇到了需要 notes:write 的操作。server 不会直接失败或重新执行整个 OAuth 流程，而是返回 403，并通过 WWW-Authenticate header 指明缺失的 scope。client 仅请求用户同意这项增量权限，然后使用升级后的 Token 重试。由于提升权限的成本很低，最小权限原则可以继续作为默认策略。')
    ]));
  }

  // t3-gateway-funnel：众多开发者、一个策略执行点、多个 backend
  function gatewayFunnel(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var dy = [45, 125, 205], i;
    for (i = 0; i < 3; i++) {
      svg.appendChild(enter(58, dy[i], (0.1 + i * 0.12) + 's', [
        box(-38, -18, 76, 36),
        txt(0, 4, '开发者 ' + (i + 1), '10', 'var(--ink,#1a1a1a)')
      ]));
      svg.appendChild(enter(462, dy[i], (0.5 + i * 0.12) + 's', [
        box(-38, -18, 76, 36),
        txt(0, 4, ['notes', 'github', 'postgres'][i], '9', 'var(--ink,#1a1a1a)')
      ]));
      svg.appendChild(svgEl('path', { d: 'M96 ' + dy[i] + ' C160 ' + dy[i] + ' 160 125 200 125', fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.3' }));
      svg.appendChild(svgEl('path', { d: 'M320 125 C360 125 360 ' + dy[i] + ' 424 ' + dy[i], fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.3' }));
    }
    svg.appendChild(enter(260, 125, '0.35s', [
      box(-60, -62, 120, 124, 'var(--blueprint,#3553ff)'),
      txt(0, -42, 'gateway', '11', 'var(--blueprint,#3553ff)'),
      txt(0, -22, 'auth', '8', 'var(--ink-soft,#555)'),
      txt(0, -7, 'rbac', '8', 'var(--ink-soft,#555)'),
      txt(0, 8, 'rate limit', '8', 'var(--ink-soft,#555)'),
      txt(0, 23, 'pinned hashes', '8', 'var(--ink-soft,#555)'),
      txt(0, 38, 'audit log', '8', 'var(--ink-soft,#555)')
    ]));
    var starts = [0.02, 0.35, 0.68];
    for (i = 0; i < 3; i++) {
      var s = starts[i];
      var d1 = svgEl('circle', { r: 5, fill: 'var(--blueprint,#3553ff)', opacity: '0' }, []);
      d1.appendChild(svgEl('animateMotion', { path: 'M96 ' + dy[i] + ' C160 ' + dy[i] + ' 160 125 200 125', dur: '6s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;' + s + ';' + (s + 0.12) + ';1' }));
      d1.appendChild(anim('opacity', '0;0;1;1;0;0', '0;' + s + ';' + (s + 0.01) + ';' + (s + 0.11) + ';' + (s + 0.13) + ';1', '6s'));
      svg.appendChild(d1);
      var d2 = svgEl('circle', { r: 5, fill: 'var(--blueprint,#3553ff)', opacity: '0' }, []);
      d2.appendChild(svgEl('animateMotion', { path: 'M320 125 C360 125 360 ' + dy[i] + ' 424 ' + dy[i], dur: '6s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;' + (s + 0.16) + ';' + (s + 0.28) + ';1' }));
      d2.appendChild(anim('opacity', '0;0;1;1;0;0', '0;' + (s + 0.16) + ';' + (s + 0.17) + ';' + (s + 0.27) + ';' + (s + 0.29) + ';1', '6s'));
      svg.appendChild(d2);
    }
    host.appendChild(el('div', { class: 'lf' }, [
      head('GATEWAY FUNNEL', '一个 endpoint，五项职责'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('对于每位开发者，gateway 看起来都像一台独立的 MCP server。在内部，每次调用都会经过身份验证、按用户执行 RBAC 检查、rate limit、与固定的 Tool hash manifest 比对，并写入 audit log，之后才会路由到拥有该 Tool 的 backend。策略集中在一处，而不是分散在五千份 IDE configuration 中。')
    ]));
  }

  // t3-jwks-rotate：auth server 轮换 key，cache 提前刷新
  function jwksRotate(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' });
    svg.appendChild(enter(105, 70, '0.1s', [
      box(-80, -42, 160, 84),
      txt(0, -22, 'authorization server', '9', 'var(--ink,#1a1a1a)'),
      txt(0, 26, '/.well-known/jwks.json', '8', 'var(--ink-mute,#777)')
    ]));
    var kidA = txt(105, 72, 'signing key kid:A', '10', 'var(--blueprint,#3553ff)');
    kidA.appendChild(anim('opacity', '1;1;0;0;1', '0;0.42;0.5;0.92;1', '6s'));
    svg.appendChild(kidA);
    var kidB = txt(105, 72, 'signing key kid:B', '10', 'var(--warn,#b8870f)');
    kidB.setAttribute('opacity', '0');
    kidB.appendChild(anim('opacity', '0;0;1;1;0', '0;0.42;0.5;0.92;1', '6s'));
    svg.appendChild(kidB);
    svg.appendChild(enter(415, 70, '0.25s', [
      box(-80, -42, 160, 84),
      txt(0, -22, 'MCP resource server', '9', 'var(--ink,#1a1a1a)'),
      txt(0, 26, '在过期前刷新', '8', 'var(--ink-mute,#777)')
    ]));
    var cacheA = txt(415, 72, 'JWKS cache: A', '10', 'var(--blueprint,#3553ff)');
    cacheA.appendChild(anim('opacity', '1;1;0;0;1', '0;0.6;0.68;0.92;1', '6s'));
    svg.appendChild(cacheA);
    var cacheB = txt(415, 72, 'JWKS cache: A+B', '10', 'var(--warn,#b8870f)');
    cacheB.setAttribute('opacity', '0');
    cacheB.appendChild(anim('opacity', '0;0;1;1;0', '0;0.6;0.68;0.92;1', '6s'));
    svg.appendChild(cacheB);
    svg.appendChild(packet(chip(62, 'fetch'), 'M187 90 L333 90', '6s',
      '0;0.5;0.62;1', '0;0;1;1;0;0', '0;0.5;0.52;0.6;0.64;1'));
    svg.appendChild(packet(chip(84, 'token kid:A'), 'M260 210 C300 210 340 180 400 120', '6s',
      '0;0.06;0.26;1', '0;1;1;0;0', '0;0.07;0.25;0.3;1'));
    svg.appendChild(packet(chip(84, 'token kid:B'), 'M260 210 C300 210 340 180 400 120', '6s',
      '0;0.72;0.9;1', '0;0;1;1;0;0', '0;0.72;0.74;0.89;0.94;1'));
    svg.appendChild(txt(180, 214, 'client requests', '8', 'var(--ink-mute,#777)', 'end'));
    var ok = txt(475, 122, '有效', '9', 'var(--blueprint,#3553ff)');
    ok.setAttribute('opacity', '0');
    ok.appendChild(anim('opacity', '0;0;1;0;0;1;0', '0;0.26;0.31;0.4;0.9;0.95;1', '6s'));
    svg.appendChild(ok);
    host.appendChild(el('div', { class: 'lf' }, [
      head('JWKS ROTATION', '在 key 过期前完成刷新'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('authorization server 按计划将 signing key 从 kid A 轮换为 kid B。只在启动时获取过一次 JWKS 的 resource server 会在轮换发生时开始拒绝所有 Token。生产级方案应使用缓存的 key set，并通过刷新任务在旧 key 过期前覆盖 cache；同时在 cache miss 时执行备用 fetch。这样，由新 key 签名的 Token 即使在凌晨 3 点也能通过验证，无需重启。')
    ]));
  }

  // t3-span-waterfall：一条 trace，嵌套 span 以 waterfall 形式逐步展开
  function spanWaterfall(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 260' });
    svg.appendChild(txt(20, 26, '一个 trace id', '9', 'var(--blueprint,#3553ff)', 'start'));
    svg.appendChild(txt(500, 26, '时间', '9', 'var(--ink-mute,#777)', 'end'));
    svg.appendChild(svgEl('line', { x1: 20, y1: 34, x2: 500, y2: 34, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1' }));
    var rows = [
      { label: 'invoke_agent', ind: 0, x0: 40, w: 440, t0: 0.04, t1: 0.86 },
      { label: 'llm.chat', ind: 1, x0: 60, w: 120, t0: 0.1, t1: 0.3 },
      { label: 'tool.execute', ind: 1, x0: 195, w: 150, t0: 0.34, t1: 0.58 },
      { label: 'mcp.call', ind: 2, x0: 215, w: 110, t0: 0.38, t1: 0.54 },
      { label: 'llm.chat', ind: 1, x0: 360, w: 110, t0: 0.62, t1: 0.8 }
    ];
    var i;
    for (i = 0; i < rows.length; i++) {
      var r = rows[i], y = 52 + i * 40;
      var fill = r.ind === 2 ? 'var(--warn,#b8870f)' : (r.ind === 0 ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)');
      var bar = svgEl('rect', { x: r.x0, y: y, width: 0, height: 16, rx: '2', fill: fill, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': r.ind === 1 ? '1.2' : '0' });
      bar.appendChild(svgEl('animate', {
        attributeName: 'width', values: '0;0;' + r.w + ';' + r.w + ';0',
        keyTimes: '0;' + r.t0 + ';' + r.t1 + ';0.92;1', dur: '6s',
        repeatCount: 'indefinite', calcMode: 'spline',
        keySplines: EASE + ';' + EASE + ';' + EASE + ';' + EASE
      }));
      svg.appendChild(bar);
      var lbl = txt(r.x0 + 6, y + 12, r.label, '9', r.ind === 0 ? 'var(--bg,#fafaf5)' : 'var(--ink-soft,#555)', 'start');
      lbl.setAttribute('opacity', '0');
      lbl.appendChild(anim('opacity', '0;0;1;1;0', '0;' + (r.t0 + 0.03) + ';' + (r.t0 + 0.08) + ';0.92;1', '6s'));
      svg.appendChild(lbl);
    }
    svg.appendChild(txt(20, 252, '每个 span 上的 gen_ai.operation.name 将各层关联起来', '8', 'var(--ink-mute,#777)', 'start'));
    host.appendChild(el('div', { class: 'lf' }, [
      head('SPAN WATERFALL', '在一条 trace 中串联 Agent、LLM、Tool、MCP'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('一个 trace id 覆盖整个 turn。Agent span 最先打开、最后关闭；其内部的 LLM call、Tool execution，以及它所封装的 MCP dispatch 都各自拥有带 gen_ai attribute 的 span。当某个 backend cold-start 时，拉长的会是 mcp.call bar，而这正是仅靠日志无法回答的问题。')
    ]));
  }

  // t3-skill-layers：三层 Context、一个 bundle、适用于任意 Agent
  function skillLayers(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' });
    var layers = [
      { y: 60, t: 'AGENTS.md', s: '项目约定，启动时读取', d: '0.1s' },
      { y: 125, t: 'SKILL.md', s: '任务知识，按需加载', d: '0.28s' },
      { y: 190, t: 'MCP', s: 'Skill 调用的 Tool', d: '0.46s' }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      svg.appendChild(enter(140, layers[i].y, layers[i].d, [
        box(-115, -26, 230, 52, i === 1 ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)'),
        txt(0, -4, layers[i].t, '11', i === 1 ? 'var(--blueprint,#3553ff)' : 'var(--ink,#1a1a1a)'),
        txt(0, 13, layers[i].s, '8', 'var(--ink-mute,#777)')
      ]));
    }
    var agents = [
      { y: 55, t: 'Claude Code' },
      { y: 125, t: 'Cursor' },
      { y: 195, t: 'Codex' }
    ];
    for (i = 0; i < 3; i++) {
      svg.appendChild(enter(445, agents[i].y, (0.64 + i * 0.12) + 's', [
        box(-55, -20, 110, 40),
        txt(0, 5, agents[i].t, '10', 'var(--ink,#1a1a1a)')
      ]));
      svg.appendChild(svgEl('path', { d: 'M258 125 C330 125 330 ' + agents[i].y + ' 388 ' + agents[i].y, fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.3' }));
      var s = 0.08 + i * 0.3;
      var dot = svgEl('g', { opacity: '0' }, chip(66, 'bundle'));
      dot.appendChild(svgEl('animateMotion', { path: 'M258 125 C330 125 330 ' + agents[i].y + ' 388 ' + agents[i].y, dur: '5.5s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;' + s + ';' + (s + 0.2) + ';1' }));
      dot.appendChild(anim('opacity', '0;0;1;1;0;0', '0;' + s + ';' + (s + 0.02) + ';' + (s + 0.18) + ';' + (s + 0.22) + ';1', '5.5s'));
      svg.appendChild(dot);
    }
    host.appendChild(el('div', { class: 'lf' }, [
      head('三层结构', 'Context、知识、Tool'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('AGENTS.md 告诉任意 Agent 项目如何运作。SKILL.md 使用 frontmatter 加正文封装一个工作流，并由 runtime 渐进式披露。MCP 提供该 Skill 调用的 Tool。由于每一层都是采用开放格式的普通文件，同一个 bundle 可以直接放入 Claude Code、Cursor 和 Codex，而不必复制三份并逐渐产生差异。')
    ]));
  }

  // t3-capstone-chain：一个 request 穿过 Phase 13 的所有组成部分
  function capstoneChain(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 270' });
    var stops = [
      { x: 55, y: 60, w: 80, t: '用户', s: '提出请求', d: '0.1s' },
      { x: 195, y: 60, w: 96, t: 'gateway', s: 'OAuth + RBAC', d: '0.22s' },
      { x: 350, y: 60, w: 120, t: 'MCP server', s: 'discover + tools + task ext', d: '0.34s' },
      { x: 350, y: 165, w: 120, t: 'writer agent', s: 'A2A，不透明', d: '0.46s' }
    ];
    var i;
    for (i = 0; i < 4; i++) {
      var st = stops[i];
      svg.appendChild(enter(st.x, st.y, st.d, [
        box(-st.w / 2, -28, st.w, 56),
        txt(0, -6, st.t, '10', 'var(--ink,#1a1a1a)'),
        txt(0, 11, st.s, '8', 'var(--ink-mute,#777)')
      ]));
    }
    svg.appendChild(enter(120, 165, '0.58s', [
      box(-70, -24, 140, 48),
      txt(0, -2, 'ui:// report', '10', 'var(--blueprint,#3553ff)'),
      txt(0, 14, '内联渲染', '8', 'var(--ink-mute,#777)')
    ]));
    svg.appendChild(svgEl('line', { x1: 30, y1: 236, x2: 490, y2: 236, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1' }));
    svg.appendChild(txt(30, 226, 'OTel trace', '8', 'var(--ink-mute,#777)', 'start'));
    var hops = [
      { p: 'M95 52 L147 52', s: 0.02, tick: 120 },
      { p: 'M243 52 L290 52', s: 0.18, tick: 265 },
      { p: 'M350 88 L350 137', s: 0.34, tick: 350 },
      { p: 'M290 175 C230 180 210 180 190 172', s: 0.52, tick: 420 },
      { p: 'M60 88 C60 120 80 132 100 140', s: 0.72, tick: 470 }
    ];
    for (i = 0; i < hops.length; i++) {
      var h = hops[i];
      var dot = svgEl('circle', { r: 5, fill: 'var(--blueprint,#3553ff)', opacity: '0' }, []);
      dot.appendChild(svgEl('animateMotion', { path: h.p, dur: '6s', repeatCount: 'indefinite', calcMode: 'linear', keyPoints: '0;0;1;1', keyTimes: '0;' + h.s + ';' + (h.s + 0.14) + ';1' }));
      dot.appendChild(anim('opacity', '0;0;1;1;0;0', '0;' + h.s + ';' + (h.s + 0.01) + ';' + (h.s + 0.13) + ';' + (h.s + 0.15) + ';1', '6s'));
      svg.appendChild(dot);
      var tick = svgEl('rect', { x: h.tick, y: 231, width: 3, height: 10, fill: 'var(--warn,#b8870f)', opacity: '0' });
      tick.appendChild(anim('opacity', '0;0;1;1;0', '0;' + (h.s + 0.12) + ';' + (h.s + 0.16) + ';0.94;1', '6s'));
      svg.appendChild(tick);
    }
    svg.appendChild(txt(255, 152, 'A2A SendMessage', '8', 'var(--ink-mute,#777)'));
    host.appendChild(el('div', { class: 'lf' }, [
      head('CAPSTONE CHAIN', '一个 request 串联 Phase 13 的所有组成部分'),
      el('div', { class: 'lf-body' }, [out(svg)]),
      cap('每个无状态 MCP request 都携带 version 和 Capability。gateway 执行身份验证并应用策略；server 可以返回官方 task-extension handle，client 使用 tasks/get 轮询该 handle；独立工作则通过 A2A SendMessage 委派。最终的 ui:// report 和每个边界 span 都会保持关联，无需依赖 protocol session。')
    ]));
  }

  LF.register({
    't3-dispatch-loop': dispatchLoop,
    't3-primitive-sort': primitiveSort,
    't3-sampling-flip': samplingFlip,
    't3-roots-boundary': rootsBoundary,
    't3-ui-sandbox': uiSandbox,
    't3-scope-stepup': scopeStepup,
    't3-gateway-funnel': gatewayFunnel,
    't3-jwks-rotate': jwksRotate,
    't3-span-waterfall': spanWaterfall,
    't3-skill-layers': skillLayers,
    't3-capstone-chain': capstoneChain
  });
})();
