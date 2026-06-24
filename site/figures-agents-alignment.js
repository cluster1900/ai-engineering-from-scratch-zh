/* figures-agents-alignment.js - agent engineering、multi-agent swarm 和 alignment 的
   交互式课程图示。在 lesson-figures.js 之后加载，并通过 window.LF 注册。
   无 deps，ES5，通过 CSS vars 设置主题。创作方式：使用 ```figure block
   指定下面某个 widget 的名称。 */
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

  // ── agent-loop：think → act → observe 循环，高亮当前节点 ──────────────
  function agentLoop(host) {
    var state = { step: 0 };
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var nodes = [
      { x: 210, y: 28, label: 'THINK' },
      { x: 360, y: 150, label: 'ACT' },
      { x: 60, y: 150, label: 'OBSERVE' }
    ];
    var notes = ['根据目标 + 历史规划下一步行动', '用选定参数调用 tool', '读取结果，并追加到 trajectory'];
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      var cur = state.step % 3;
      var cx = [285, 210, 135], cy = [108, 192, 108];
      var i;
      for (i = 0; i < 3; i++) {
        var a = nodes[i], b = nodes[(i + 1) % 3];
        svg.appendChild(arrow(a.x + 75, a.y + 22 + 6 * (i === 0 ? 1 : -0), b.x + (i === 2 ? 75 : 0), b.y + 22));
      }
      svg.appendChild(arrow(135, 128, 240, 60, '4 4'));
      svg.appendChild(arrow(290, 60, 380, 128, '4 4'));
      svg.appendChild(arrow(360, 196, 100, 196, '4 4'));
      for (i = 0; i < 3; i++) {
        svg.appendChild(box(nodes[i].x, nodes[i].y, 100, 44, nodes[i].label, i === cur));
      }
      svg.appendChild((function () {
        var t = svgEl('text', { x: 260, y: 132, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '10', fill: 'var(--ink-mute,#777)' });
        t.appendChild(document.createTextNode('step ' + (state.step + 1)));
        return t;
      })());
      meta.textContent = nodes[cur].label.toLowerCase() + ': ' + notes[cur] + '  ·  当目标达成或 step budget 用尽时，loop 结束';
    };
    var grid = el('div', {}, [LF.slider(state, 'step', 'step', 0, 11, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['AGENT LOOP']), el('span', {}, ['拖动 step'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta])]),
      el('div', { class: 'lf-cap' }, ['agent 是一个 loop，而不是一次单独调用。它思考下一步动作，通过调用函数来行动，观察结果，并将该观察反馈到下一次思考中。这个 cycle 会重复，直到目标达成或 step budget 耗尽。'])
    ]));
    state._render();
  }

  // ── react-trace：Thought / Action / Observation 行按 step 展开 ────────
  function reactTrace(host) {
    var state = { step: 1 };
    var trace = [
      ['Thought', '我需要 Tokyo 当前的人口。'],
      ['Action', 'search("Tokyo population 2026")'],
      ['Observation', '"Tokyo metro: about 37 million."'],
      ['Thought', '问题问的是 city proper，不是 metro。'],
      ['Action', 'search("Tokyo city proper population")'],
      ['Observation', '"Tokyo (23 wards): about 14 million."'],
      ['Thought', '我现在有了可以回答的数字。'],
      ['Action', 'finish("23 wards 约 1400 万。")']
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
      meta.textContent = n + ' / ' + trace.length + ' 行  ·  ' + (last === 'Observation' ? 'tool 结果已返回，agent 接下来会推理' : last === 'Action' && trace[n - 1][1].indexOf('finish') === 0 ? 'agent 已生成最终答案' : last === 'Action' ? '正在等待 tool 结果' : '在下一次 action 前进行推理');
    };
    var grid = el('div', {}, [LF.slider(state, 'step', '展示到 step', 1, 8, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['REACT TRACE']), el('span', {}, ['拖动以展开'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, meta])]),
      el('div', { class: 'lf-cap' }, ['ReAct 将推理与行动交错进行。每个 Thought 决定要做什么，每个 Action 调用一个 tool，每个 Observation 将结果反馈回来。把推理显式化，让 agent 能从错误路径中恢复，而不是一错到底。'])
    ]));
    state._render();
  }

  // ── tool-routing：query 根据 description match 映射到一个注册 tool ─
  function toolRouting(host) {
    var tools = [
      { name: 'search_web', desc: '查找事实和当前事件' },
      { name: 'run_python', desc: '计算、解析、转换数据' },
      { name: 'send_email', desc: '撰写并发送消息' },
      { name: 'query_db', desc: '在 database 中查找行' }
    ];
    var queries = [
      { text: 'what is the GDP of France', sim: [0.91, 0.18, 0.05, 0.31] },
      { text: 'add up these expenses', sim: [0.12, 0.88, 0.09, 0.27] },
      { text: 'tell the team we shipped', sim: [0.10, 0.07, 0.93, 0.06] },
      { text: 'how many users signed up', sim: [0.34, 0.30, 0.05, 0.86] }
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
        var bar = el('i'); bar.style.width = (q.sim[idx] * 100).toFixed(0) + '%';
        if (!on) bar.style.background = 'var(--rule-soft,#ccc)';
        var lab = el('label', {}, [t.name + '  (' + t.desc + ')', el('b', {}, [on ? 'routed →' : q.sim[idx].toFixed(2)])]);
        if (!on) lab.style.opacity = '0.5';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' }, [bar])]));
      });
      meta.textContent = 'query "' + q.text + '"  →  ' + tools[bi].name + '  （与其 description 的 similarity 为 ' + best.toFixed(2) + '）';
    };
    var grid = el('div', {}, [LF.select(state, 'q', 'query', [
      ['what is the GDP of France', '0'], ['add up these expenses', '1'], ['tell the team we shipped', '2'], ['how many users signed up', '3']
    ])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['TOOL ROUTING']), el('span', {}, ['选择一个 query'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, meta])]),
      el('div', { class: 'lf-cap' }, ['router 会将 query 与每个已注册 tool 的 description 打分，并选择最接近的匹配。好的 function name 和 description 不是装饰：它们是 router 用来决定调用哪个 tool 的信号。'])
    ]));
    state._render();
  }

  // ── swarm-messages：all-to-all O(N^2) vs hub/supervisor O(N) ───────────────
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
      [['all-to-all', 140], ['hub / supervisor', 390]].forEach(function (p) {
        var t = svgEl('text', { x: p[1], y: 224, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: 'var(--ink-mute,#777)' });
        t.appendChild(document.createTextNode(p[0])); svg.appendChild(t);
      });
      var mesh = n * (n - 1);
      meta.textContent = 'all-to-all：' + mesh + ' 条 directed messages (N·(N−1))  ·  hub：' + (2 * n) + ' 条 edges (O(N))';
      formula.textContent = 'broadcast cost 以 O(N²) 增长；supervisor 将流量汇入一个节点，成本为 O(N)';
    };
    var grid = el('div', {}, [LF.slider(state, 'n', 'agents N', 2, 12, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SWARM MESSAGES']), el('span', {}, ['拖动 N'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['如果每个 agent 都与其他所有 agent 通信，message count 会按 N·(N−1) 增长，因此 naive broadcast 会按二次方扩展。将所有流量路由通过 supervisor，可将其削减为线性数量的 edges，这就是大型系统会集中协调的原因。'])
    ]));
    state._render();
  }

  // ── supervisor-hierarchy：branching factor 和 depth → total agents ────────
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
      meta.textContent = 'branching ' + b + '，depth ' + depth + '  →  总计 ' + exact + ' 个 agents' + (capped ? ' · 图示将每一层上限设为 64' : '') + '（leaves 执行工作，internal nodes 负责委派）';
      formula.textContent = b === 1
        ? 'total = Σ 1^level for level 0..depth = depth + 1 = ' + exact
        : 'total = Σ b^level for level 0..depth = (b^(depth+1) − 1) / (b − 1) = ' + exact;
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'b', 'branching factor b', 1, 5, 1),
      LF.slider(state, 'depth', 'depth', 1, 3, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SUPERVISOR HIERARCHY']), el('span', {}, ['拖动 branching 和 depth'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['supervisor 将一个任务拆分给 worker agents，而这些 worker agents 本身也可能监督其他 agent。total agents 是 branching factor 在 depth 上的 geometric sum，因此即使 fan-out 很小，head count 也会快速爆炸。保持 tree 浅。'])
    ]));
    state._render();
  }

  // ── rlhf-reward-kl：reward − beta·KL；小 beta 会让 policy drift ─────
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
      status.innerHTML = hacking ? 'reward hacking' : '峰值在 step ' + best;
      meta.textContent = hacking ? 'beta 太小：没有任何东西把 policy 拉回，它会过度优化 proxy reward，并偏离 reference'
        : 'KL penalty 将 drift 限制在 ' + peakDrift.toFixed(2) + '；objective 达到峰值后下降';
      formula.textContent = 'objective = reward − β·KL(π ‖ π_ref),  β = ' + beta.toFixed(2) + '   （灰色 reward，金色 β·KL，蓝色 objective）';
    };
    var grid = el('div', {}, [LF.slider(state, 'beta', 'KL penalty β', 0.02, 1.0, 0.02)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['RLHF: REWARD − β·KL']), el('span', {}, ['拖动 β'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['RLHF 会最大化 reward 减去 KL penalty，使 policy 保持接近 reference model。当 β 太小时，penalty 几乎不起作用，因此 policy 会追逐 proxy reward 并发生偏移，利用 reward model 中的缺陷。KL term 是防止 reward hacking 的约束。'])
    ]));
    state._render();
  }

  // ── dpo-margin：chosen vs rejected log-probs 和 DPO loss curve ────────
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
      num.innerHTML = loss(m, beta).toFixed(3) + ' <small>DPO loss</small>';
      meta.textContent = (m > 0 ? 'chosen 比 rejected 高 ' + m.toFixed(2) : m < 0 ? 'rejected 被错误排在 chosen 之上' : '平局') + '  ·  P(prefer chosen) = ' + sigmoid(beta * m).toFixed(2);
      formula.textContent = 'loss = −log σ(β·(r_chosen − r_rejected)),  margin = ' + m.toFixed(2) + ', β = ' + beta.toFixed(1) + '   ·   margin 越大 → loss 越低';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'margin', 'reward margin (chosen − rejected)', -4, 4, 0.1),
      LF.slider(state, 'beta', 'β', 0.2, 3.0, 0.1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['DPO MARGIN']), el('span', {}, ['拖动 margin'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['DPO 直接在 preference pairs 上训练，不需要单独的 reward model。loss 是 β 乘以 chosen response 与 rejected response 之间 implicit reward margin 后的 −log σ。更大的正 margin 会把 loss 推向零；负 margin（rejected 排名更高）会受到重罚。'])
    ]));
    state._render();
  }

  // ── context-budget：tokens/turn × turns 填充固定 window ─────────────
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
      num.innerHTML = LF.fmtInt(used) + ' <small>/ ' + LF.fmtInt(win) + ' tokens</small>';
      bar.style.width = Math.min(100, pct) + '%';
      barWrap.classList.toggle('over', used > win);
      var turnsToFull = Math.ceil(win / state.perTurn);
      meta.textContent = (used > win ? '⚠ window 已溢出：' : Math.round(pct) + '% 已用：')
        + (used > win ? '更早的 turns 必须 compact 或 hand off' : 'compaction 会在接近上限时触发，大约在 turn ' + turnsToFull);
      formula.textContent = state.perTurn + ' tokens/turn × ' + state.turns + ' turns = ' + LF.fmtInt(used) + '  ·  window ' + state.windowK + 'K = ' + LF.fmtInt(win);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'perTurn', 'tokens per turn', 200, 4000, 100),
      LF.slider(state, 'turns', 'turns', 1, 60, 1),
      LF.slider(state, 'windowK', 'context window (K)', 8, 200, 8)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CONTEXT BUDGET']), el('span', {}, ['拖动 turns 和 window'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['每个 turn 都会向固定 window 追加 tokens。运行总量会持续攀升，直到接近限制，此时 agent 必须将旧 turns compact 成摘要，或 hand off 到新的 context。长会话的成败取决于对这个 budget 的管理。'])
    ]));
    state._render();
  }

  // ── guardrail-gates：有序 safety gates，一个触发 → blocked ─────────────
  function guardrailGates(host) {
    var state = { trip: '0' };
    var W = 520, H = 150;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var gates = ['input filter', 'policy check', 'output filter'];
    var notes = ['blocked：malicious 或 off-policy prompt 在 model 运行前被拒绝',
      'blocked：model output 违反 usage policy',
      'blocked：unsafe content 已从 response 中清除'];
    state._render = function () {
      var trip = Number(state.trip);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      var allowed = trip === 0;
      var bw = 110, gap = 22, x0 = 18, y = 44, h = 46;
      svg.appendChild(box(x0, y, 70, h, 'request', false));
      var prevX = x0 + 70, i;
      for (i = 0; i < 3; i++) {
        var gx = prevX + gap;
        var tripped = trip === i + 1;
        svg.appendChild(arrow(prevX, y + h / 2, gx, y + h / 2));
        svg.appendChild(box(gx, y, bw, h, gates[i], tripped));
        if (tripped) {
          var blockT = svgEl('text', { x: gx + bw / 2, y: y - 8, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: 'var(--warn,#b8870f)' });
          blockT.appendChild(document.createTextNode('BLOCK'));
          svg.appendChild(blockT);
        }
        prevX = gx + bw;
        if (tripped) { break; }
      }
      if (allowed) { svg.appendChild(arrow(prevX, y + h / 2, prevX + gap, y + h / 2)); svg.appendChild(box(prevX + gap, y, 80, h, 'allowed', false)); }
      status.innerHTML = allowed ? 'allowed' : 'blocked';
      meta.textContent = allowed ? '所有 gates 通过：response 返回给用户' : notes[trip - 1];
    };
    var grid = el('div', {}, [LF.select(state, 'trip', '哪个 gate 触发', [
      ['none / all pass', '0'], ['input filter', '1'], ['policy check', '2'], ['output filter', '3']
    ])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['GUARDRAIL GATES']), el('span', {}, ['选择一个 gate'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta])]),
      el('div', { class: 'lf-cap' }, ['safety 以有序 gates 运行：model 前的 input filter、对 request 的 policy check，以及对 response 的 output filter。第一个触发的 gate 会阻止 request，因此 unsafe prompts 不会到达 model，unsafe outputs 也不会到达用户。'])
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
