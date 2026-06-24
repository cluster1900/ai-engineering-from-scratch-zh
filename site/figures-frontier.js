/* figures-frontier.js - autonomous systems（Phase 15）和 capstone projects（Phase 19）的交互式课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF 注册。
   无依赖，ES5，通过 CSS vars 使用主题。编写方式：一个 ```figure block，命名下方某个 widget。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function arrowDefs() {
    var marker = svgEl('marker', { id: 'lf-fr-arrow', viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, [
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
    return svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'marker-end': 'url(#lf-fr-arrow)', 'stroke-dasharray': dash || '' });
  }
  function label(x, y, txt, fill) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '10', fill: fill || 'var(--ink-mute,#777)' });
    t.appendChild(document.createTextNode(txt));
    return t;
  }

  // ── task-decomposition: 一个目标展开为多个子任务（planning tree） ────
  function taskDecomposition(host) {
    var state = { branch: 3, depth: 2 };
    var W = 520, H = 250;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var b = state.branch, depth = state.depth;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var top = 30, rowH = (H - 70) / Math.max(1, depth);
      var prev = [{ x: W / 2 }];
      svg.appendChild(box(W / 2 - 32, top - 14, 64, 28, '目标', true));
      var lv;
      for (lv = 1; lv <= depth; lv++) {
        var count = Math.pow(b, lv);
        if (count > 27) { count = 27; }
        var y = top + rowH * lv;
        var cur = [], k;
        for (k = 0; k < count; k++) {
          var x = W * (k + 1) / (count + 1);
          cur.push({ x: x });
          var parent = prev[Math.floor(k / b) % prev.length] || prev[0];
          svg.appendChild(svgEl('line', { x1: parent.x, y1: top + rowH * (lv - 1) + 14, x2: x, y2: y - 7, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
          var leaf = lv === depth;
          svg.appendChild(svgEl('circle', { cx: x, cy: y, r: leaf ? '6' : '8', fill: leaf ? 'var(--bg-surface,#eee)' : 'var(--blueprint,#3553ff)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1' }));
        }
        prev = cur;
      }
      var total = 0;
      for (lv = 0; lv <= depth; lv++) { total += Math.pow(b, lv); }
      var leaves = Math.pow(b, depth);
      meta.textContent = 'branching ' + b + '，深度 ' + depth + '  ->  ' + leaves + ' 个叶子子任务，共 ' + total + ' 个节点（叶子是可执行步骤）';
      formula.textContent = '叶子数 = b^depth；总节点数 = (b^(depth+1) - 1) / (b - 1)';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'branch', 'branching（每个节点的子任务数）', 1, 4, 1),
      LF.slider(state, 'depth', '规划深度', 1, 3, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['任务分解']), el('span', {}, ['拖动 branching 和深度'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['长周期 agent 不会正面硬攻复杂目标。它先把目标分解为子任务，再继续分解这些子任务，直到叶子节点变成它可以直接执行的步骤。更宽的 branching 和更深的树会让计划更周密，但也会成倍增加需要跟踪的工作量，这就是有用计划通常保持较浅的原因。'])
    ]));
    state._render();
  }

  // ── reflection-loop: 执行 -> 评估 -> 批判 -> 修订，质量上升 ──
  function reflectionLoop(host) {
    var state = { iter: 3 };
    var stages = ['执行', '评估', '批判', '修订'];
    var W = 520, H = 170;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    function quality(n) { return 100 * (1 - 0.7 * Math.pow(0.6, n)); }
    state._render = function () {
      var n = state.iter;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      var bw = 104, gap = 14, x0 = 18, y = 60, h = 44, active = (n - 1) % 4;
      var x = x0, i;
      for (i = 0; i < 4; i++) {
        svg.appendChild(box(x, y, bw, h, stages[i], i === active));
        if (i < 3) { svg.appendChild(arrow(x + bw, y + h / 2, x + bw + gap, y + h / 2)); }
        x += bw + gap;
      }
      svg.appendChild(arrow(x0 + bw / 2, y + h, x0 + bw / 2, y + h + 18, '4 4'));
      svg.appendChild(svgEl('path', { d: 'M ' + (x0 + bw / 2) + ' ' + (y + h + 18) + ' L ' + (x - gap - bw / 2) + ' ' + (y + h + 18) + ' L ' + (x - gap - bw / 2) + ' ' + (y + h + 6), fill: 'none', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '4 4', 'marker-end': 'url(#lf-fr-arrow)' }));
      svg.appendChild(label(W / 2, y + h + 34, '修订会反馈到下一次尝试'));
      var q = quality(n);
      status.innerHTML = q.toFixed(1) + ' <small>质量</small>';
      bar.style.width = q.toFixed(1) + '%';
      var gain = quality(n) - quality(n - 1);
      meta.textContent = '第 ' + n + ' 次迭代  ·  本轮增益 +' + gain.toFixed(1) + '  ·  ' + (gain < 2 ? '收益已经趋平：停止反思' : '仍在改进');
    };
    var grid = el('div', {}, [LF.slider(state, 'iter', '反思迭代次数', 1, 8, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['反思循环']), el('span', {}, ['拖动迭代次数'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:12px' }, [status]), barWrap, meta])]),
      el('div', { class: 'lf-cap' }, ['自我改进循环会先行动，评估结果，批判哪里出了问题，然后在下一次尝试前修订。每一轮都会提高质量，但增益会按几何级数缩小，并很快趋平。关键能力在于知道反思什么时候已经不再划算。'])
    ]));
    state._render();
  }

  // ── memory-consolidation: episodic events 压缩成 semantic summary ──
  function memoryConsolidation(host) {
    var state = { events: 24, threshold: 8 };
    var W = 520, H = 150;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var n = state.events, thr = state.threshold;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      var consolidated = n > thr ? n - thr : 0;
      var recent = n - consolidated;
      var dotW = Math.min(11, (W - 200) / Math.max(1, n));
      var x = 14, i;
      for (i = 0; i < n; i++) {
        var old = i < consolidated;
        svg.appendChild(svgEl('rect', { x: x, y: 26, width: Math.max(2, dotW - 2), height: 22, rx: '2', fill: old ? 'var(--rule-soft,#ddd)' : 'var(--blueprint,#3553ff)', opacity: old ? '0.5' : '1' }));
        x += dotW;
      }
      svg.appendChild(label(x / 2 + 7, 18, 'episodic events（蓝色为最近事件）'));
      var summaryX = W - 150, summaryY = 80;
      svg.appendChild(box(summaryX, summaryY, 132, 40, 'semantic memory', consolidated > 0));
      svg.appendChild(arrow(consolidated > 0 ? (14 + consolidated * dotW / 2) : 14, 50, summaryX + 4, summaryY + 6, '4 4'));
      svg.appendChild(label(summaryX + 66, summaryY - 8, consolidated + ' 个事件 -> 1 个摘要'));
      meta.textContent = recent + ' 个最近事件逐字保留  ·  ' + consolidated + ' 个较早事件压缩进长期 memory';
      formula.textContent = '保留最新的 ' + thr + ' 个 episodic；buffer 溢出时，把其余内容整合为 semantic summary';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'events', 'episodic events', 4, 40, 1),
      LF.slider(state, 'threshold', '整合阈值', 2, 20, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['Memory 整合']), el('span', {}, ['拖动阈值'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['最近步骤会以详细的 episodic 记录存在。一旦 buffer 超过阈值，最旧的 episodes 就会被压缩成紧凑的 semantic summary，在释放窗口的同时保留要点。长期运行的 agent 要靠整合生存，而不是永远记住每个 Token。'])
    ]));
    state._render();
  }

  // ── world-model-rollout: 用学得的 model 想象未来状态 ────────
  function worldModelRollout(host) {
    var state = { rollout: 2, branch: 2 };
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var depth = state.rollout, b = state.branch;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var top = 28, rowH = (H - 66) / Math.max(1, depth);
      var prev = [{ x: W / 2 }];
      svg.appendChild(svgEl('circle', { cx: W / 2, cy: top, r: '9', fill: 'var(--blueprint,#3553ff)' }));
      svg.appendChild(label(W / 2, top - 14, '现在'));
      var lv;
      for (lv = 1; lv <= depth; lv++) {
        var count = Math.pow(b, lv);
        if (count > 32) { count = 32; }
        var y = top + rowH * lv;
        var cur = [], k;
        for (k = 0; k < count; k++) {
          var x = W * (k + 1) / (count + 1);
          cur.push({ x: x });
          var parent = prev[Math.floor(k / b) % prev.length] || prev[0];
          svg.appendChild(svgEl('line', { x1: parent.x, y1: top + rowH * (lv - 1) + 9, x2: x, y2: y - 6, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
          svg.appendChild(svgEl('circle', { cx: x, cy: y, r: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1' }));
        }
        prev = cur;
      }
      var imagined = 0;
      for (lv = 1; lv <= depth; lv++) { imagined += Math.pow(b, lv); }
      meta.textContent = '向前看 ' + depth + ' 步，每个状态有 ' + b + ' 个动作  ->  在采取一个真实动作前，先模拟 ' + imagined + ' 个想象中的未来';
      formula.textContent = '想象状态数 = sum b^k for k=1..depth  ·  成本随 rollout depth 指数增长';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'rollout', 'rollout depth（向前看的步数）', 1, 3, 1),
      LF.slider(state, 'branch', '每个状态的动作数', 1, 4, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['World-Model Rollout']), el('span', {}, ['拖动深度和 branching'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['基于 model 的规划会在接触真实世界之前先模拟未来。从当前状态出发，agent 会想象每个候选动作会通向哪些状态，用学得的 model 向前 rollout，然后才提交到最佳的第一步。更深的 rollouts 规划效果更好，但想象树会指数增长。'])
    ]));
    state._render();
  }

  // ── autonomy-oversight: risk dial 将动作路由到自动执行或人工 gate ──
  function autonomyOversight(host) {
    var state = { autonomy: 50 };
    var actions = [
      { name: '读取文件', risk: 10 },
      { name: '运行查询', risk: 30 },
      { name: '写入文件', risk: 55 },
      { name: '运行 shell command', risk: 75 },
      { name: '部署到 production', risk: 92 }
    ];
    var rows = el('div', {});
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    state._render = function () {
      var allow = state.autonomy;
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      var auto = 0;
      actions.forEach(function (a) {
        var ok = a.risk <= allow;
        if (ok) { auto++; }
        var bar = el('i'); bar.style.width = a.risk + '%';
        if (!ok) { bar.style.background = 'var(--warn,#b8870f)'; }
        var lab = el('label', {}, [a.name + '（risk ' + a.risk + '）', el('b', {}, [ok ? '自动批准' : '升级 ->'])]);
        if (!ok) { lab.style.color = 'var(--warn,#b8870f)'; }
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' + (ok ? '' : ' over') }, [bar])]));
      });
      status.innerHTML = auto + ' / ' + actions.length + ' <small>自动批准</small>';
      meta.textContent = 'autonomy ' + allow + '：低于或等于旋钮值的动作可无人值守运行；任何更高风险的动作都会升级到人工 gate';
    };
    var grid = el('div', {}, [LF.slider(state, 'autonomy', 'autonomy / risk 旋钮', 0, 100, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['Autonomy 监督']), el('span', {}, ['拖动旋钮'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, el('div', { style: 'margin-top:12px' }, [status]), meta])]),
      el('div', { class: 'lf-cap' }, ['Human-in-the-loop 是一个旋钮，而不是开关。单一 autonomy 阈值让低风险动作无人值守运行，而任何高于阈值的动作都会停下来等待人工批准。提高旋钮获得速度，降低旋钮获得控制。无论旋钮停在哪里，部署到 production 都应该接近顶部。'])
    ]));
    state._render();
  }

  // ── pass-at-k: pass@k = 1 - (1-p)^k 随 k 增长而趋近 1 ───────────────
  function passAtK(host) {
    var state = { p: 0.3, k: 5 };
    var W = 520, H = 210, PAD = 34, KMAX = 20;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    function passK(p, k) { return 1 - Math.pow(1 - p, k); }
    function px(k) { return PAD + (k - 1) / (KMAX - 1) * (W - 2 * PAD); }
    function py(v) { return H - PAD - v * (H - 2 * PAD); }
    state._render = function () {
      var p = state.p, k = state.k;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(1), x2: W - PAD, y2: py(1), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var d = '', kk;
      for (kk = 1; kk <= KMAX; kk++) { d += (kk === 1 ? 'M' : 'L') + px(kk).toFixed(1) + ' ' + py(passK(p, kk)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('circle', { cx: px(k), cy: py(passK(p, k)), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      var v = passK(p, k);
      num.innerHTML = (v * 100).toFixed(1) + ' <small>% pass@' + k + '</small>';
      meta.textContent = '单个样本成功率为 ' + (p * 100).toFixed(0) + '%  ·  ' + k + ' 次尝试把成功率提升到 ' + (v * 100).toFixed(1) + '%';
      formula.textContent = 'pass@k = 1 - (1 - p)^k,  p = ' + p.toFixed(2) + ', k = ' + k + '   ·   k -> infinity 会把它推向 1';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'p', '单样本成功率 p', 0.02, 0.95, 0.01),
      LF.slider(state, 'k', '样本数 k', 1, KMAX, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['PASS @ K']), el('span', {}, ['拖动 p 和 k'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Pass@k 问的是 k 个独立样本中是否至少有一个解决了任务。如果每次尝试以概率 p 成功，那么 k 次全部失败的概率是 (1-p)^k，因此 pass@k 就是一减去这个值。即使是较弱的 model，也会随着更多样本迅速爬升，这就是 best-of-k 如此便宜有效，以及 pass@1 和 pass@k 讲述不同故事的原因。'])
    ]));
    state._render();
  }

  // ── eval-harness-matrix: tasks x variants 网格，按 variant 聚合 ──────
  function evalHarnessMatrix(host) {
    var state = { variant: '0' };
    var tasks = ['parse-json', 'sort-list', 'sql-join', 'regex-extract', 'recursion', 'edge-cases'];
    // 每个 [variant][task] 的确定性 pass(1)/fail(0)
    var grids = [
      [1, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 0, 0, 1, 0, 0]
    ];
    var names = ['baseline', 'tuned', 'ablation'];
    var W = 520, H = 200;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    state._render = function () {
      var sel = Number(state.variant);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var x0 = 110, y0 = 24, cw = (W - x0 - 20) / tasks.length, ch = 30;
      var v, t;
      tasks.forEach(function (tn, ti) {
        var lx = x0 + cw * ti + cw / 2;
        var t1 = svgEl('text', { x: lx, y: y0 - 6, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '8.5', fill: 'var(--ink-mute,#777)', transform: 'rotate(-18 ' + lx + ' ' + (y0 - 6) + ')' });
        t1.appendChild(document.createTextNode(tn)); svg.appendChild(t1);
      });
      for (v = 0; v < grids.length; v++) {
        var ry = y0 + 8 + v * (ch + 8);
        var on = v === sel;
        var nt = svgEl('text', { x: x0 - 10, y: ry + ch / 2 + 4, 'text-anchor': 'end', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: on ? 'var(--blueprint,#3553ff)' : 'var(--ink-soft,#555)' });
        nt.appendChild(document.createTextNode(names[v])); svg.appendChild(nt);
        for (t = 0; t < tasks.length; t++) {
          var pass = grids[v][t] === 1;
          var cx = x0 + cw * t + 2;
          svg.appendChild(svgEl('rect', { x: cx, y: ry, width: cw - 4, height: ch, rx: '3', fill: pass ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', stroke: pass ? 'var(--blueprint,#3553ff)' : 'var(--warn,#b8870f)', 'stroke-width': pass ? '0' : '1.4', opacity: on ? '1' : '0.4' }));
          var mark = svgEl('text', { x: cx + (cw - 4) / 2, y: ry + ch / 2 + 4, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': '11', fill: pass ? 'var(--bg,#fafaf5)' : 'var(--warn,#b8870f)', opacity: on ? '1' : '0.4' });
          mark.appendChild(document.createTextNode(pass ? 'P' : 'F')); svg.appendChild(mark);
        }
      }
      var passed = 0; for (t = 0; t < tasks.length; t++) { if (grids[sel][t] === 1) { passed++; } }
      status.innerHTML = passed + ' / ' + tasks.length + ' <small>' + names[sel] + '</small>';
      meta.textContent = names[sel] + ' 的聚合分数 = ' + (passed / tasks.length * 100).toFixed(0) + '%  ·  P = pass，F = 每个 fixture task 的 fail';
    };
    var grid = el('div', {}, [LF.select(state, 'variant', 'model variant', [
      ['baseline', '0'], ['tuned', '1'], ['ablation', '2']
    ])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['Eval Harness Matrix']), el('span', {}, ['选择一个 variant'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta])]),
      el('div', { class: 'lf-cap' }, ['eval harness 会让每个任务对每个 model variant 运行，并在网格中记录 pass 或 fail。沿列阅读可以看出哪些任务很难；沿行阅读会得到某个 variant 的聚合分数。这个 Matrix 会把模糊的直觉变成一个可用于 regression-test 的数字。'])
    ]));
    state._render();
  }

  // ── canary-rollout: traffic split、error rate、rollback trigger ────────────
  function canaryRollout(host) {
    var state = { canary: 10 };
    var stableErr = 0.4, canaryErr = 2.6, sla = 1.5;
    var W = 520, H = 120;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var c = state.canary, s = 100 - c;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var x0 = 14, y = 30, h = 44, fullW = W - 28;
      var sw = fullW * s / 100;
      svg.appendChild(svgEl('rect', { x: x0, y: y, width: Math.max(0, sw), height: h, fill: 'var(--blueprint,#3553ff)' }));
      svg.appendChild(svgEl('rect', { x: x0 + sw, y: y, width: Math.max(0, fullW - sw), height: h, fill: 'var(--warn,#b8870f)' }));
      if (s > 6) { svg.appendChild(label(x0 + sw / 2, y + h / 2 + 4, 'stable ' + s + '%', 'var(--bg,#fafaf5)')); }
      if (c > 6) { svg.appendChild(label(x0 + sw + (fullW - sw) / 2, y + h / 2 + 4, 'canary ' + c + '%', 'var(--bg,#fafaf5)')); }
      var blended = (s * stableErr + c * canaryErr) / 100;
      var rollback = canaryErr > sla;
      svg.appendChild(label(W / 2, y + h + 22, 'canary error ' + canaryErr.toFixed(1) + '% vs SLA ' + sla.toFixed(1) + '%' + (rollback ? '  触发 ROLLBACK' : ''), rollback ? 'var(--warn,#b8870f)' : 'var(--ink-mute,#777)'));
      status.innerHTML = blended.toFixed(2) + ' <small>% 混合 error</small>';
      meta.textContent = rollback ? 'canary 违反 SLA：把它的 traffic 排回 stable version' : 'canary 在 SLA 内：可以安全扩大 rollout';
      formula.textContent = '混合 error = (stable% · ' + stableErr + ' + canary% · ' + canaryErr + ') / 100  ·  当 canary error > SLA 时触发 rollback';
    };
    var grid = el('div', {}, [LF.slider(state, 'canary', 'canary traffic %', 0, 100, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['Canary Rollout']), el('span', {}, ['拖动 canary %'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [status]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['canary release 会把一小部分 traffic 路由到新版本，其余 traffic 留在经过验证的版本上。canary 上的 error rate 会对照 SLA 监控；一旦违反，traffic 就会排回 stable。这里 canary 错误偏高，所以扩大 split 会提高混合 error，并让 rollback 保持待触发状态。'])
    ]));
    state._render();
  }

  // ── trace-spans: 时间线上的嵌套 spans，展开一个查看 children ────
  function traceSpans(host) {
    // 每个 span: name, start, dur (ms), depth
    var spans = [
      { name: 'handle_request', start: 0, dur: 1200, depth: 0 },
      { name: 'llm_call (plan)', start: 40, dur: 420, depth: 1 },
      { name: 'retrieval', start: 480, dur: 260, depth: 1 },
      { name: 'vector_search', start: 510, dur: 150, depth: 2 },
      { name: 'rerank', start: 670, dur: 60, depth: 2 },
      { name: 'tool_call (db)', start: 760, dur: 180, depth: 1 },
      { name: 'llm_call (answer)', start: 960, dur: 230, depth: 1 }
    ];
    var state = { expand: 1 };
    var W = 520, total = 1200;
    var status = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    state._render = function () {
      var pad = 14, x0 = 150, rowH = 24, axW = W - x0 - 18;
      var H = pad * 2 + spans.length * rowH + 10;
      var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
      function px(ms) { return x0 + ms / total * axW; }
      var sel = LF.clamp(state.expand, 0, spans.length - 1);
      var i;
      for (i = 0; i <= 4; i++) {
        var gx = px(total * i / 4);
        svg.appendChild(svgEl('line', { x1: gx, y1: pad, x2: gx, y2: H - pad, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '2 4' }));
        svg.appendChild(label(gx, H - 2, (total * i / 4) + 'ms'));
      }
      spans.forEach(function (sp, idx) {
        var y = pad + idx * rowH;
        var on = idx === sel;
        var nt = svgEl('text', { x: 8 + sp.depth * 12, y: y + rowH / 2 + 4, 'font-family': 'var(--font-mono,monospace)', 'font-size': '9.5', fill: on ? 'var(--blueprint,#3553ff)' : 'var(--ink-soft,#555)' });
        nt.appendChild(document.createTextNode(sp.name)); svg.appendChild(nt);
        svg.appendChild(svgEl('rect', { x: px(sp.start), y: y + 4, width: Math.max(2, axW * sp.dur / total), height: rowH - 10, rx: '2', fill: on ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', stroke: on ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
        if (on) { svg.appendChild(label(px(sp.start) + Math.max(2, axW * sp.dur / total) + 22, y + rowH / 2 + 4, sp.dur + 'ms', 'var(--blueprint,#3553ff)')); }
      });
      while (out.firstChild) { out.removeChild(out.firstChild); }
      out.appendChild(svg);
      out.appendChild(el('div', { style: 'margin-top:10px' }, [status]));
      out.appendChild(meta);
      var s = spans[sel];
      status.innerHTML = s.dur + ' <small>ms · ' + s.name + '</small>';
      meta.textContent = 'span 从 ' + s.start + 'ms 开始，运行 ' + s.dur + 'ms，深度 ' + s.depth + '  ·  总 trace ' + total + 'ms（一个 root span，它的 children 按缩进嵌套）';
    };
    var out = el('div', { class: 'lf-out' });
    var grid = el('div', {}, [LF.slider(state, 'expand', '检查 span', 0, spans.length - 1, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['Trace Spans']), el('span', {}, ['拖动以检查'])]),
      el('div', { class: 'lf-body' }, [grid, out]),
      el('div', { class: 'lf-cap' }, ['distributed trace 是一棵 span 树，铺在时间线上。root span 覆盖整个 request；每个 LLM call、retrieval 和 tool call 的 child spans 会根据开始时间和持续时间嵌套其中。阅读 gantt 可以看出 latency 实际花在了哪里，这是每次 production incident 首先要问的问题。'])
    ]));
    state._render();
  }

  LF.register({
    'task-decomposition': taskDecomposition,
    'reflection-loop': reflectionLoop,
    'memory-consolidation': memoryConsolidation,
    'world-model-rollout': worldModelRollout,
    'autonomy-oversight': autonomyOversight,
    'pass-at-k': passAtK,
    'eval-harness-matrix': evalHarnessMatrix,
    'canary-rollout': canaryRollout,
    'trace-spans': traceSpans
  });
})();
