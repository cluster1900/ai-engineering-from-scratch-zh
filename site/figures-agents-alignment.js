/* figures-agents-alignment.js - 用于 Agent engineering、multi-Agent swarm
   和对齐的交互式课程图示。在 lesson-figures.js 之后加载，并通过
   window.LF 注册。无依赖，ES5，通过 CSS 变量设置主题。
   编写方式：使用一个 ```figure 块，并指定下方某个 widget 的名称。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function arrowDefs() {
    var marker = svgEl('marker', { id: 'lf-aa-arrow', viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, [
      svgEl('path', { d: 'M0 0 L8 4 L0 8 z', fill: 'var(--ink-soft,#555)' })
    ]);
    return svgEl('defs', {}, [marker]);
  }
  function box(x, y, w, h, label, on) {
    var r = svgEl('rect', { x: x, y: y, width: w, height: h, rx: '4', fill: on ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', stroke: on ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)', 'stroke-width': '1.5' });
    var t = svgEl('text', { x: x + w / 2, y: y + h / 2 + 4, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: on ? 'var(--bg,#fafaf5)' : 'var(--ink,#1a1a1a)' });
    t.appendChild(document.createTextNode(label));
    return svgEl('g', {}, [r, t]);
  }
  function arrow(x1, y1, x2, y2, dash) {
    return svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'marker-end': 'url(#lf-aa-arrow)', 'stroke-dasharray': dash || '' });
  }

  // ── agent-loop：持久因果轨迹，证据持续流入 Context ─────────────────────
  function agentLoop(host) {
    var state = { step: 0 };
    var W = 620, H = 330;
    var markerId = LF.uid('lf-agent-loop-arrow');
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    var title = svgEl('title', { id: LF.uid('lf-agent-loop-title') });
    title.appendChild(document.createTextNode('十二步 Agent loop 因果轨迹'));
    var desc = svgEl('desc', { id: LF.uid('lf-agent-loop-desc') });
    desc.appendChild(document.createTextNode('一个持久运行的 Think、Act、Tool、Observe 和 Context 循环。选中的步骤会突出显示当前活动节点、因果边以及已累积的证据。'));
    svg.setAttribute('aria-labelledby', title.id + ' ' + desc.id);
    svg.appendChild(title);
    svg.appendChild(desc);
    svg.appendChild(svgEl('defs', {}, [
      svgEl('marker', { id: markerId, viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, [
        svgEl('path', { d: 'M0 0 L8 4 L0 8 z', fill: 'context-stroke' })
      ])
    ]));
    var meta = el('div', { class: 'lf-meta', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    var nodes = [
      { id: 'think', x: 28, y: 34, w: 112, label: 'THINK' },
      { id: 'act', x: 188, y: 34, w: 112, label: 'ACT' },
      { id: 'tool', x: 348, y: 34, w: 112, label: 'TOOL' },
      { id: 'observe', x: 444, y: 146, w: 132, label: 'OBSERVE' },
      { id: 'context', x: 204, y: 146, w: 132, label: 'CONTEXT' }
    ];
    var edgeSpecs = [
      { id: 'think-act', d: 'M140 56 H178' },
      { id: 'act-tool', d: 'M300 56 H338' },
      { id: 'tool-observe', d: 'M460 56 C528 56 548 102 510 136' },
      { id: 'observe-context', d: 'M444 168 H346' },
      { id: 'context-think', d: 'M204 168 C92 168 74 106 84 86' }
    ];
    var steps = [
      { node: 0, edge: -1, phase: '思考', note: '读取目标和轨迹，然后制定计划。', evidence: 0, value: '查找城市人口' },
      { node: 1, edge: 0, phase: '已选操作', note: '由于当前缺少证据，选择 search_web。', evidence: 1, value: 'search_web' },
      { node: 2, edge: 1, phase: 'Tool 调用', note: '将明确的查询参数发送给所选 Tool。', evidence: 1, value: 'query: Tokyo' },
      { node: 2, edge: 2, phase: 'Tool 结果', note: 'Tool 返回都市圈人口结果。', evidence: 2, value: '都市圈 3700 万' },
      { node: 3, edge: 2, phase: '观察', note: '注意都市圈人口并不能回答城市本体的人口。', evidence: 3, value: '范围不匹配' },
      { node: 4, edge: 3, phase: 'Context 更新', note: '将结果和范围不匹配信息追加到轨迹。', evidence: 4, value: '已添加证据' },
      { node: 0, edge: 4, phase: '再次思考', note: '使用更新后的 Context 完善下一步计划。', evidence: 0, value: '核实 23 个区' },
      { node: 1, edge: 0, phase: '已选操作', note: '在修正范围后选择更精确的搜索。', evidence: 1, value: 'search_web' },
      { node: 2, edge: 1, phase: 'Tool 调用', note: '请求 Tokyo 城市本体的人口。', evidence: 1, value: 'query: 23 wards' },
      { node: 2, edge: 2, phase: 'Tool 结果', note: 'Tool 返回符合范围的人口证据。', evidence: 2, value: '23 区 1400 万' },
      { node: 3, edge: 2, phase: '观察', note: '确认此结果与请求的范围相符。', evidence: 3, value: '范围匹配' },
      { node: 4, edge: 3, phase: 'Context 更新', note: '存储有证据支持的答案，使下一次思考能够完成任务。', evidence: 4, value: '可以回答' }
    ];
    var evidenceSpecs = [
      { label: '计划', x: 18 },
      { label: '操作', x: 138 },
      { label: '结果', x: 258 },
      { label: '观察', x: 378 },
      { label: 'CONTEXT', x: 498 }
    ];
    var edgeEls = [];
    var nodeEls = [];
    var evidenceEls = [];
    var stepText = svgEl('text', {
      x: '310', y: '124', 'text-anchor': 'middle',
      'font-family': 'var(--font-mono,monospace)', 'font-size': '10',
      fill: 'var(--ink-mute,#777)'
    });

    edgeSpecs.forEach(function (edge) {
      var path = svgEl('path', {
        d: edge.d, fill: 'none', stroke: 'var(--rule-soft,#c9c9c2)', 'stroke-width': '2',
        'marker-end': 'url(#' + markerId + ')', 'data-part': 'edge-' + edge.id,
        style: 'transition:stroke 180ms var(--ease-out,cubic-bezier(.23,1,.32,1)),opacity 180ms var(--ease-out,cubic-bezier(.23,1,.32,1))'
      });
      edgeEls.push(path);
      svg.appendChild(path);
    });

    nodes.forEach(function (node) {
      var inner = svgEl('g', {
        'data-part': 'node-' + node.id,
        style: 'transform-box:fill-box;transform-origin:center;transition:transform 220ms var(--ease-out,cubic-bezier(.23,1,.32,1)),opacity 220ms var(--ease-out,cubic-bezier(.23,1,.32,1))'
      });
      var rect = svgEl('rect', {
        width: node.w, height: '44', rx: '4', fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.5',
        style: 'transition:fill 180ms var(--ease-out,cubic-bezier(.23,1,.32,1)),stroke 180ms var(--ease-out,cubic-bezier(.23,1,.32,1))'
      });
      var text = svgEl('text', {
        x: node.w / 2, y: '26', 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: 'var(--ink,#1a1a1a)',
        style: 'transition:fill 180ms var(--ease-out,cubic-bezier(.23,1,.32,1))'
      });
      text.appendChild(document.createTextNode(node.label));
      inner.appendChild(rect);
      inner.appendChild(text);
      svg.appendChild(svgEl('g', { transform: 'translate(' + node.x + ' ' + node.y + ')' }, [inner]));
      nodeEls.push({ group: inner, rect: rect, text: text });
    });

    svg.appendChild(stepText);
    svg.appendChild(svgEl('line', { x1: '18', y1: '218', x2: '602', y2: '218', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 4' }));
    var laneLabel = svgEl('text', { x: '18', y: '209', 'font-family': 'var(--font-mono,monospace)', 'font-size': '9', fill: 'var(--ink-mute,#777)', 'letter-spacing': '1.4' });
    laneLabel.appendChild(document.createTextNode('进入下一次思考的证据'));
    svg.appendChild(laneLabel);

    evidenceSpecs.forEach(function (item, index) {
      var inner = svgEl('g', {
        'data-part': 'evidence-' + index, opacity: '0.24',
        style: 'transform-box:fill-box;transform-origin:center;transition:opacity 220ms var(--ease-out,cubic-bezier(.23,1,.32,1)),transform 220ms var(--ease-out,cubic-bezier(.23,1,.32,1))'
      });
      var rect = svgEl('rect', { width: '104', height: '62', rx: '3', fill: 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' });
      var label = svgEl('text', { x: '8', y: '17', 'font-family': 'var(--font-mono,monospace)', 'font-size': '8.5', fill: 'var(--blueprint,#3553ff)', 'letter-spacing': '1' });
      label.appendChild(document.createTextNode(item.label));
      var value = svgEl('text', { x: '8', y: '39', 'font-family': 'var(--font-mono,monospace)', 'font-size': '9.5', fill: 'var(--ink-soft,#555)' });
      value.appendChild(document.createTextNode('等待中'));
      inner.appendChild(rect);
      inner.appendChild(label);
      inner.appendChild(value);
      svg.appendChild(svgEl('g', { transform: 'translate(' + item.x + ' 236)' }, [inner]));
      evidenceEls.push({ group: inner, rect: rect, value: value });
    });

    state._render = function () {
      var current = steps[state.step];
      var i;
      for (i = 0; i < nodeEls.length; i++) {
        var activeNode = i === current.node;
        nodeEls[i].group.style.transform = activeNode ? 'translateY(-3px)' : 'translateY(0)';
        nodeEls[i].group.style.opacity = activeNode ? '1' : '0.72';
        nodeEls[i].rect.setAttribute('fill', activeNode ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)');
        nodeEls[i].rect.setAttribute('stroke', activeNode ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)');
        nodeEls[i].text.setAttribute('fill', activeNode ? 'var(--bg,#fafaf5)' : 'var(--ink,#1a1a1a)');
      }
      for (i = 0; i < edgeEls.length; i++) {
        var activeEdge = i === current.edge;
        edgeEls[i].setAttribute('stroke', activeEdge ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#c9c9c2)');
        edgeEls[i].setAttribute('opacity', activeEdge ? '1' : '0.58');
      }
      var accumulated = {};
      for (i = 0; i <= state.step; i++) accumulated[steps[i].evidence] = steps[i].value;
      for (i = 0; i < evidenceEls.length; i++) {
        var visible = Object.prototype.hasOwnProperty.call(accumulated, i);
        var activeEvidence = i === current.evidence;
        evidenceEls[i].group.setAttribute('opacity', visible ? (activeEvidence ? '1' : '0.72') : '0.24');
        evidenceEls[i].group.style.transform = activeEvidence ? 'translateY(-4px)' : 'translateY(0)';
        evidenceEls[i].rect.setAttribute('stroke', activeEvidence ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)');
        evidenceEls[i].value.textContent = visible ? accumulated[i] : '等待中';
      }
      stepText.textContent = '第 ' + (state.step + 1) + ' 步，共 12 步  ·  ' + current.phase.toUpperCase();
      meta.textContent = current.phase + '：' + current.note + ' 只有在目标达成或步骤预算耗尽时，循环才会停止。';
    };
    var grid = el('div', {}, [LF.slider(state, 'step', '因果步骤', 0, 11, 1, function (value) { return (value + 1) + ' / 12'; })]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['AGENT LOOP']), el('span', {}, ['拖动步骤'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta])]),
      el('div', { class: 'lf-cap' }, ['Agent loop 是一条因果轨迹，而不是三个轮流突出显示的方框。每次思考都会选择一个操作，Tool 调用会产生证据，观察会更新 Context，而新的 Context 会改变下一次思考。'])
    ]));
    state._render();
  }

  // ── react-trace：Thought / Action / Observation 行随步骤逐步展开 ──────────
  function reactTrace(host) {
    var state = { step: 1 };
    var trace = [
      ['Thought', '我需要 Tokyo 当前的人口。'],
      ['Action', 'search("Tokyo population 2026")'],
      ['Observation', '"Tokyo 都市圈：约 3700 万人。"'],
      ['Thought', '问题问的是城市本体，而不是都市圈。'],
      ['Action', 'search("Tokyo city proper population")'],
      ['Observation', '"Tokyo（23 个区）：约 1400 万人。"'],
      ['Thought', '我现在已经获得回答所需的数据。'],
      ['Action', 'finish("23 个区约有 1400 万人。")']
    ];
    var rows = el('div', {});
    var meta = el('div', { class: 'lf-meta' });
    function color(kind) { return kind === 'Thought' ? 'var(--warn,#b8870f)' : kind === 'Action' ? 'var(--blueprint,#3553ff)' : 'var(--ink-soft,#555)'; }
    state._render = function () {
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      var n = state.step, i;
      for (i = 0; i < n; i++) {
        var k = trace[i][0], v = trace[i][1];
        var tag = el('b', { style: 'color:' + color(k) + ';min-width:90px;display:inline-block' }, [k]);
        rows.appendChild(el('div', {
          class: 'lf-formula',
          style: 'padding:5px 8px;border-left:2px solid ' + color(k) + ';margin-top:4px;background:var(--bg-surface,#eee)'
        }, [tag, document.createTextNode(' ' + v)]));
      }
      var last = trace[n - 1][0];
      meta.textContent = n + ' / ' + trace.length + ' 行  ·  ' + (last === 'Observation' ? 'Tool 结果已返回，Agent 接下来将进行推理' : last === 'Action' && trace[n - 1][1].indexOf('finish') === 0 ? 'Agent 已生成最终答案' : last === 'Action' ? '正在等待 Tool 结果' : '在下一次操作前进行推理');
    };
    var grid = el('div', {}, [LF.slider(state, 'step', '显示到该步骤', 1, 8, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['REACT TRACE']), el('span', {}, ['拖动以展开'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, meta])]),
      el('div', { class: 'lf-cap' }, ['ReAct 将推理与操作交错进行。每个 Thought 决定要做什么，每个 Action 调用一个 Tool，每个 Observation 将结果反馈回来。明确展示推理过程，可以让 Agent 从错误转向中恢复，而不是沿着错误继续执行。'])
    ]));
    state._render();
  }

  // ── tool-routing：根据描述匹配，将查询映射到一个已注册 Tool ─────────────
  function toolRouting(host) {
    var tools = [
      { name: 'search_web', desc: '查找事实和时事' },
      { name: 'run_python', desc: '计算、解析和转换数据' },
      { name: 'send_email', desc: '撰写并发送消息' },
      { name: 'query_db', desc: '在数据库中查询记录' }
    ];
    var queries = [
      { text: 'France 的 GDP 是多少', sim: [0.91, 0.18, 0.05, 0.31] },
      { text: '把这些费用加起来', sim: [0.12, 0.88, 0.09, 0.27] },
      { text: '告诉团队我们已经发布了', sim: [0.10, 0.07, 0.93, 0.06] },
      { text: '有多少用户完成了注册', sim: [0.34, 0.30, 0.05, 0.86] }
    ];
    var state = { q: '0' };
    var rows = el('div', {});
    var meta = el('div', { class: 'lf-meta' });
    state._render = function () {
      var q = queries[Number(state.q)];
      var best = 0, bi = 0, i;
      for (i = 0; i < q.sim.length; i++) { if (q.sim[i] > best) { best = q.sim[i]; bi = i; } }
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      tools.forEach(function (t, idx) {
        var on = idx === bi;
        var bar = el('i'); bar.style.transform = 'scaleX(' + q.sim[idx].toFixed(3) + ')';
        if (!on) bar.style.background = 'var(--rule-soft,#ccc)';
        var lab = el('label', {}, [t.name + '  (' + t.desc + ')', el('b', {}, [on ? '路由至 →' : q.sim[idx].toFixed(2)])]);
        if (!on) lab.style.opacity = '0.5';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' }, [bar])]));
      });
      meta.textContent = '查询“' + q.text + '”  →  ' + tools[bi].name + '  （与其描述的相似度为 ' + best.toFixed(2) + '）';
    };
    var grid = el('div', {}, [LF.select(state, 'q', '查询', [
      ['France 的 GDP 是多少', '0'], ['把这些费用加起来', '1'], ['告诉团队我们已经发布了', '2'], ['有多少用户完成了注册', '3']
    ])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['TOOL ROUTING']), el('span', {}, ['选择一个查询'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, meta])]),
      el('div', { class: 'lf-cap' }, ['路由器会根据每个已注册 Tool 的描述对查询进行评分，并选择最匹配的 Tool。好的函数名称和描述并非装饰：它们是路由器决定调用哪个 Tool 时使用的信号。'])
    ]));
    state._render();
  }

  // ── swarm-messages：全互连 O(N^2) 与 hub/supervisor O(N) 对比 ────────────
  function swarmMessages(host) {
    var state = { n: 6 };
    var W = 520, H = 240, R = 78;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function ring(cx, cy, n, drawHub) {
      var pts = [], i;
      for (i = 0; i < n; i++) {
        var a = -Math.PI / 2 + 2 * Math.PI * i / n;
        pts.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
      }
      var g = svgEl('g', {});
      if (drawHub) {
        for (i = 0; i < n; i++) {
          g.appendChild(svgEl('line', { x1: cx, y1: cy, x2: pts[i].x, y2: pts[i].y, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1', opacity: '0.8' }));
        }
        g.appendChild(svgEl('circle', { cx: cx, cy: cy, r: '11', fill: 'var(--blueprint,#3553ff)' }));
      } else {
        for (i = 0; i < n; i++) {
          for (var j = i + 1; j < n; j++) {
            g.appendChild(svgEl('line', { x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y, stroke: 'var(--warn,#b8870f)', 'stroke-width': '0.8', opacity: '0.5' }));
          }
        }
      }
      for (i = 0; i < n; i++) {
        g.appendChild(svgEl('circle', { cx: pts[i].x, cy: pts[i].y, r: '7', fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      }
      return g;
    }
    state._render = function () {
      var n = state.n;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(ring(140, 120, n, false));
      svg.appendChild(ring(390, 120, n, true));
      [['全互连', 140], ['hub / supervisor', 390]].forEach(function (p) {
        var t = svgEl('text', { x: p[1], y: 224, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: 'var(--ink-mute,#777)' });
        t.appendChild(document.createTextNode(p[0])); svg.appendChild(t);
      });
      var mesh = n * (n - 1);
      meta.textContent = '全互连：' + mesh + ' 条有向消息（N·(N−1)）  ·  hub：' + (2 * n) + ' 条边（O(N)）';
      formula.textContent = '广播成本按 O(N²) 增长；supervisor 将流量汇集到一个节点，使成本降至 O(N)';
    };
    var grid = el('div', {}, [LF.slider(state, 'n', 'Agent 数量 N', 2, 12, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SWARM MESSAGES']), el('span', {}, ['拖动 N'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['如果每个 Agent 都与其他所有 Agent 通信，消息数量会按 N·(N−1) 增长，因此朴素广播会以平方级扩展。通过 supervisor 路由所有流量，可将其减少为线性数量的边，这正是大型系统集中协调的原因。'])
    ]));
    state._render();
  }

  // ── supervisor-hierarchy：分支因子和深度 → Agent 总数 ───────────────────
  function supervisorHierarchy(host) {
    var state = { b: 3, depth: 2 };
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var b = state.b, depth = state.depth;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      var level, levelTop = 28, rowH = (H - 56) / Math.max(1, depth), capped = false;
      var prev = [{ x: W / 2 }];
      svg.appendChild(svgEl('circle', { cx: W / 2, cy: levelTop, r: '10', fill: 'var(--blueprint,#3553ff)' }));
      for (level = 1; level <= depth; level++) {
        var count = Math.pow(b, level);
        if (count > 64) { count = 64; capped = true; }
        var y = levelTop + rowH * level;
        var cur = [];
        var k;
        for (k = 0; k < count; k++) {
          var x = (W) * (k + 1) / (count + 1);
          cur.push({ x: x });
          var parent = prev[Math.floor(k / b) % prev.length] || prev[0];
          svg.appendChild(svgEl('line', { x1: parent.x, y1: levelTop + rowH * (level - 1) + 8, x2: x, y2: y - 7, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
          svg.appendChild(svgEl('circle', { cx: x, cy: y, r: level === depth ? '6' : '8', fill: level === depth ? 'var(--bg-surface,#eee)' : 'var(--blueprint,#3553ff)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1' }));
        }
        prev = cur;
      }
      var exact = 0, lv; for (lv = 0; lv <= depth; lv++) { exact += Math.pow(b, lv); }
      meta.textContent = '分支因子 ' + b + '，深度 ' + depth + '  →  共 ' + exact + ' 个 Agent' + (capped ? ' · 图示将每层限制为最多 64 个' : '') + '（叶节点执行工作，内部节点负责委派）';
      formula.textContent = b === 1
        ? '总数 = 对层级 0..depth 求和 Σ 1^level = depth + 1 = ' + exact
        : '总数 = 对层级 0..depth 求和 Σ b^level = (b^(depth+1) − 1) / (b − 1) = ' + exact;
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'b', '分支因子 b', 1, 5, 1),
      LF.slider(state, 'depth', '深度', 1, 3, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SUPERVISOR HIERARCHY']), el('span', {}, ['拖动分支因子和深度'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['supervisor 会将任务拆分给多个 worker Agent，而这些 Agent 自身也可能继续负责监督。Agent 总数是分支因子在各层深度上的等比数列之和，因此即使扇出很小，Agent 数量也会迅速膨胀。应保持树结构较浅。'])
    ]));
    state._render();
  }

  // ── rlhf-reward-kl：reward − beta·KL；较小的 beta 会使 policy 漂移 ──────
  function rlhfRewardKL(host) {
    var state = { beta: 0.2 };
    var W = 520, H = 220, PAD = 34, SMAX = 200;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function px(s) { return PAD + s / SMAX * (W - 2 * PAD); }
    var YMAX = 1.15;
    function py(v) { return H - PAD - (v / YMAX) * (H - 2 * PAD); }
    function rawReward(s) { return 1 - Math.exp(-s / 40); }
    function kl(s) { return Math.pow(s / SMAX, 2) * 1.6; }
    state._render = function () {
      var beta = state.beta;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(0), x2: W - PAD, y2: py(0), stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1' }));
      function curve(fn, st, dash) {
        var d = '', i; for (i = 0; i <= 120; i++) { var s = SMAX * i / 120; d += (i ? 'L' : 'M') + px(s).toFixed(1) + ' ' + py(fn(s)).toFixed(1) + ' '; }
        svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: st, 'stroke-width': '1.8', 'stroke-dasharray': dash || '' }));
      }
      curve(rawReward, 'var(--ink-mute,#999)', '4 3');
      curve(function (s) { return beta * kl(s); }, 'var(--warn,#b8870f)', '2 3');
      var obj = function (s) { return rawReward(s) - beta * kl(s); };
      curve(obj, 'var(--blueprint,#3553ff)');
      var best = 0, bv = -1e9, peakDrift, sStep;
      for (sStep = 0; sStep <= SMAX; sStep += 2) { var v = obj(sStep); if (v > bv) { bv = v; best = sStep; } }
      svg.appendChild(svgEl('circle', { cx: px(best), cy: py(obj(best)), r: '4.5', fill: 'var(--blueprint,#3553ff)' }));
      peakDrift = kl(best);
      var hacking = best >= SMAX - 4 && beta < 0.15;
      status.innerHTML = hacking ? 'reward hacking' : '峰值位于第 ' + best + ' 步';
      meta.textContent = hacking ? 'beta 过小：没有足够的约束将 policy 拉回，它会对代理 reward 进行过度优化并偏离参考'
        : 'KL 惩罚将漂移限制在 ' + peakDrift.toFixed(2) + '；目标函数达到峰值后开始下降';
      formula.textContent = '目标函数 = reward − β·KL(π ‖ π_ref)，β = ' + beta.toFixed(2) + '   （灰色为 reward，金色为 β·KL，蓝色为目标函数）';
    };
    var grid = el('div', {}, [LF.slider(state, 'beta', 'KL 惩罚 β', 0.02, 1.0, 0.02)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['RLHF: REWARD − β·KL']), el('span', {}, ['拖动 β'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['RLHF 最大化 reward 减去 KL 惩罚，以使 policy 保持接近参考 Model。当 β 过小时，惩罚几乎不起作用，因此 policy 会追逐代理 reward 并逐渐偏离，利用 reward model 中的缺陷。KL 项是防止 reward hacking 的约束。'])
    ]));
    state._render();
  }

  // ── dpo-margin：chosen 与 rejected 的 log-prob 以及 DPO Loss 曲线 ───────
  function dpoMargin(host) {
    var state = { margin: 1.0, beta: 1.0 };
    var W = 520, H = 200, PAD = 34, MMAX = 6;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
    function loss(m, beta) { return -Math.log(sigmoid(beta * m)); }
    function px(m) { return PAD + (m + MMAX) / (2 * MMAX) * (W - 2 * PAD); }
    var LMAX = loss(-MMAX, 1.0);
    function py(l) { return H - PAD - Math.min(l, LMAX) / LMAX * (H - 2 * PAD); }
    state._render = function () {
      var m = state.margin, beta = state.beta;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: px(0), y1: PAD, x2: px(0), y2: H - PAD, stroke: 'var(--rule-soft,#eee)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var d = '', i; for (i = 0; i <= 120; i++) { var mm = -MMAX + 2 * MMAX * i / 120; d += (i ? 'L' : 'M') + px(mm).toFixed(1) + ' ' + py(loss(mm, beta)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('circle', { cx: px(m), cy: py(loss(m, beta)), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      num.innerHTML = loss(m, beta).toFixed(3) + ' <small>DPO Loss</small>';
      meta.textContent = (m > 0 ? 'chosen 比 rejected 高 ' + m.toFixed(2) : m < 0 ? 'rejected 被错误地排在 chosen 之上' : '平局') + '  ·  P(偏好 chosen) = ' + sigmoid(beta * m).toFixed(2);
      formula.textContent = 'Loss = −log σ(β·(r_chosen − r_rejected))，margin = ' + m.toFixed(2) + '，β = ' + beta.toFixed(1) + '   ·   margin 越大 → Loss 越低';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'margin', 'reward margin（chosen − rejected）', -4, 4, 0.1),
      LF.slider(state, 'beta', 'β', 0.2, 3.0, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DPO MARGIN']), el('span', {}, ['拖动 margin'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['DPO 直接使用偏好对进行 Training，无需单独的 reward model。Loss 是 β 乘以 chosen 与 rejected 响应之间隐式 reward margin 后，其 σ 值的负对数。较大的正 margin 会推动 Loss 趋近于零；负 margin（rejected 排名更高）则会受到严重惩罚。'])
    ]));
    state._render();
  }

  // ── context-budget：tokens/turn × turns 填充固定窗口 ─────────────────────
  function contextBudget(host) {
    var state = { perTurn: 1200, turns: 14, windowK: 32 };
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var win = state.windowK * 1024;
      var used = state.perTurn * state.turns;
      var pct = used / win * 100;
      num.innerHTML = LF.fmtInt(used) + ' <small>/ ' + LF.fmtInt(win) + ' Token</small>';
      bar.style.transform = 'scaleX(' + Math.min(1, pct / 100) + ')';
      barWrap.classList.toggle('over', used > win);
      var turnsToFull = Math.ceil(win / state.perTurn);
      meta.textContent = (used > win ? '⚠ 窗口已溢出：' : Math.round(pct) + '% 已使用：')
        + (used > win ? '必须压缩较早的轮次或将任务移交出去' : '接近上限时会触发压缩，大约在第 ' + turnsToFull + ' 轮');
      formula.textContent = state.perTurn + ' Token/轮 × ' + state.turns + ' 轮 = ' + LF.fmtInt(used) + '  ·  窗口 ' + state.windowK + 'K = ' + LF.fmtInt(win);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'perTurn', '每轮 Token 数', 200, 4000, 100),
      LF.slider(state, 'turns', '轮数', 1, 60, 1),
      LF.slider(state, 'windowK', 'Context 窗口（K）', 8, 200, 8)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CONTEXT BUDGET']), el('span', {}, ['拖动轮数和窗口'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每一轮都会向固定窗口追加 Token。累计总量会不断上升，直到接近上限，此时 Agent 必须将较早的轮次压缩成摘要，或移交给新的 Context。长时间会话的成败取决于如何管理这项预算。'])
    ]));
    state._render();
  }

  // ── guardrail-gates：有序安全关卡，一个触发 → 阻止执行 ──────────────────
  function guardrailGates(host) {
    var state = { trip: '0' };
    var W = 520, H = 150;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var gates = ['输入过滤器', '策略检查', '输出过滤器'];
    var notes = ['已阻止：恶意或违反策略的 Prompt 在 Model 运行前被拒绝',
      '已阻止：Model 输出违反使用策略',
      '已阻止：响应中的不安全内容已被清除'];
    state._render = function () {
      var trip = Number(state.trip);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      var allowed = trip === 0;
      var bw = 110, gap = 22, x0 = 18, y = 44, h = 46;
      svg.appendChild(box(x0, y, 70, h, '请求', false));
      var prevX = x0 + 70, i;
      for (i = 0; i < 3; i++) {
        var gx = prevX + gap;
        var tripped = trip === i + 1;
        svg.appendChild(arrow(prevX, y + h / 2, gx, y + h / 2));
        svg.appendChild(box(gx, y, bw, h, gates[i], tripped));
        if (tripped) {
          var blockT = svgEl('text', { x: gx + bw / 2, y: y - 8, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: 'var(--warn,#b8870f)' });
          blockT.appendChild(document.createTextNode('阻止'));
          svg.appendChild(blockT);
        }
        prevX = gx + bw;
        if (tripped) { break; }
      }
      if (allowed) { svg.appendChild(arrow(prevX, y + h / 2, prevX + gap, y + h / 2)); svg.appendChild(box(prevX + gap, y, 80, h, '允许', false)); }
      status.innerHTML = allowed ? '已允许' : '已阻止';
      meta.textContent = allowed ? '所有关卡均通过：响应将返回给用户' : notes[trip - 1];
    };
    var grid = el('div', {}, [LF.select(state, 'trip', '触发哪个关卡', [
      ['无 / 全部通过', '0'], ['输入过滤器', '1'], ['策略检查', '2'], ['输出过滤器', '3']
    ])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['GUARDRAIL GATES']), el('span', {}, ['选择一个关卡'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta])]),
      el('div', { class: 'lf-cap' }, ['安全机制以有序关卡的形式运行：Model 之前的输入过滤器、针对请求的策略检查，以及针对响应的输出过滤器。第一个触发的关卡会阻止请求，因此不安全的 Prompt 永远不会到达 Model，不安全的输出也永远不会到达用户。'])
    ]));
    state._render();
  }

  LF.register({
    'agent-loop': agentLoop,
    'react-trace': reactTrace,
    'tool-routing': toolRouting,
    'swarm-messages': swarmMessages,
    'supervisor-hierarchy': supervisorHierarchy,
    'rlhf-reward-kl': rlhfRewardKL,
    'dpo-margin': dpoMargin,
    'context-budget': contextBudget,
    'guardrail-gates': guardrailGates
  });
})();
