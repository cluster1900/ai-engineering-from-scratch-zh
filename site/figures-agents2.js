/* figures-agents2.js - 用于高级 Agent 工程和 multi-agent 协调的交互式课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF 注册。无依赖，ES5，
   主题通过 CSS 变量设置。编写方式：使用一个 ```figure 块，并指定下方某个 widget。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  function arrowDefs() {
    var marker = svgEl('marker', { id: 'lf-a2-arrow', viewBox: '0 0 8 8', refX: '7', refY: '4', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, [
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
    return svgEl('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'marker-end': 'url(#lf-a2-arrow)', 'stroke-dasharray': dash || '' });
  }
  function label(x, y, txt, fill, size) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': size || '10', fill: fill || 'var(--ink-mute,#777)' });
    t.appendChild(document.createTextNode(txt));
    return t;
  }

  // -- rewoo-plan：预先规划所有 Tool 调用，然后执行，与 ReAct 对比 -------
  function rewooPlan(host) {
    var state = { steps: 4 };
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var n = state.steps;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      var i;
      // ReWOO 行：一个规划器，随后由一个 worker 执行整个计划
      svg.appendChild(label(W / 2, 16, 'ReWOO：一次规划，然后执行', 'var(--blueprint,#3553ff)', '11'));
      svg.appendChild(box(18, 30, 90, 34, '规划器', true));
      var plX = 130;
      for (i = 0; i < n; i++) {
        var bx = plX + i * ((W - plX - 18) / n);
        svg.appendChild(box(bx, 30, (W - plX - 18) / n - 8, 34, '调用 ' + (i + 1), false));
        if (i === 0) { svg.appendChild(arrow(108, 47, bx, 47)); }
        else { svg.appendChild(arrow(bx - 8, 47, bx, 47)); }
      }
      // ReAct 行：交错进行思考/行动/观察，每次行动调用一次 LLM
      svg.appendChild(label(W / 2, 120, 'ReAct：每一步交错调用一次 Model', 'var(--warn,#b8870f)', '11'));
      var rx = 18, ry = 134;
      for (i = 0; i < n; i++) {
        svg.appendChild(box(rx, ry, 58, 30, 'LLM', false));
        svg.appendChild(arrow(rx + 58, ry + 15, rx + 78, ry + 15));
        svg.appendChild(box(rx + 78, ry, 42, 30, '行动', false));
        if (i < n - 1) { svg.appendChild(arrow(rx + 120, ry + 15, rx + 138, ry + 15)); }
        rx += 138;
        if (rx > W - 120) { rx = 18; ry += 40; }
      }
      var rewooCalls = 1;
      var reactCalls = n;
      meta.textContent = 'ReWOO 为 ' + n + ' 个 Tool 使用 ' + rewooCalls + ' 次规划调用；ReAct 使用 ' + reactCalls + ' 次 Model 调用，每个 Tool 前调用一次';
      formula.textContent = 'ReWOO Model 调用次数 = 1（规划）+ 1（求解）= 2  对比  ReAct Model 调用次数 = ' + n + '  ->  总计 2 次对比 ' + n + ' 次，但 ReWOO 只在开始时加载一次 Context';
    };
    var grid = el('div', {}, [LF.slider(state, 'steps', '计划中的 Tool 调用次数', 2, 6, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['REWOO 规划-执行']), el('span', {}, ['拖动以调整计划规模'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['ReWOO 将推理与观察分离。规划器一次性写出完整的 Tool 调用链，随后 worker 执行这些调用，在步骤之间不再调用 Model。相比之下，ReAct 会在每次行动前调用 Model，并且每次都重新读取不断增长的完整轨迹，因此随着运行时间变长，会消耗更多 Token。'])
    ]));
    state._render();
  }

  // -- tree-of-thoughts：分支推理树，beam 保留最佳路径 ---
  function treeOfThoughts(host) {
    var state = { breadth: 3, depth: 3, beam: 2 };
    var W = 520, H = 250, PAD = 22;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 根据层级和索引生成确定性的伪分数
    function score(level, idx) {
      var v = Math.sin((level + 1) * 12.9898 + (idx + 1) * 78.233) * 43758.5453;
      return v - Math.floor(v);
    }
    state._render = function () {
      var b = state.breadth, depth = state.depth, beam = Math.min(state.beam, b);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var rowH = (H - 2 * PAD) / depth;
      var level, kept = [{ x: W / 2, idx: 0 }];
      svg.appendChild(svgEl('circle', { cx: W / 2, cy: PAD, r: '6', fill: 'var(--blueprint,#3553ff)' }));
      var lastBest = null, totalNodes = 1;
      for (level = 1; level <= depth; level++) {
        var children = [], parentRow = kept, y = PAD + rowH * level;
        var slot = 0, totalSlots = parentRow.length * b;
        parentRow.forEach(function (p, pi) {
          var k;
          for (k = 0; k < b; k++) {
            var x = (W) * (slot + 1) / (totalSlots + 1);
            var s = score(level, slot);
            children.push({ x: x, y: y, idx: slot, s: s, px: p.x });
            slot++;
            totalNodes++;
          }
        });
        // 按分数选出 beam 个最佳子节点
        var ranked = children.slice().sort(function (a, c) { return c.s - a.s; });
        var keepSet = {};
        var m; for (m = 0; m < beam && m < ranked.length; m++) { keepSet[ranked[m].idx] = true; }
        children.forEach(function (c) {
          var on = !!keepSet[c.idx];
          svg.appendChild(svgEl('line', { x1: c.px, y1: PAD + rowH * (level - 1) + 6, x2: c.x, y2: c.y - 6, stroke: on ? 'var(--blueprint,#3553ff)' : 'var(--rule-soft,#ddd)', 'stroke-width': on ? '1.4' : '0.8', opacity: on ? '0.9' : '0.5' }));
          svg.appendChild(svgEl('circle', { cx: c.x, cy: c.y, r: on ? '6' : '4', fill: on ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1' }));
        });
        kept = children.filter(function (c) { return keepSet[c.idx]; }).map(function (c) { return { x: c.x, idx: c.idx }; });
        lastBest = ranked[0];
      }
      var explored = totalNodes - 1;
      meta.textContent = '在 ' + depth + ' 层中探索了 ' + explored + ' 个思路  ·  beam 在每层保留排名前 ' + Math.min(state.beam, b) + ' 的思路（蓝色），其余剪枝';
      formula.textContent = '广度 ' + b + ' x 深度 ' + depth + ' = 最多 ' + Math.pow(b, depth) + ' 个叶节点；beam search 将搜索前沿限制为 ' + Math.min(state.beam, b) + '，从而保持计算可行';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      LF.slider(state, 'breadth', '广度（每个节点的思路数）', 2, 4, 1),
      LF.slider(state, 'depth', '深度（推理步骤数）', 1, 4, 1),
      LF.slider(state, 'beam', '保留的 beam 宽度', 1, 4, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['TREE OF THOUGHTS']), el('span', {}, ['拖动以调整广度和深度'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Tree of Thoughts 将单一推理链转化为搜索过程。在每一步中，Model 提出多个候选思路；评分器对它们排序，beam 只保留其中最佳的少数思路继续扩展。对较弱分支进行剪枝，使指数级增长的树仍能以可承受的成本运行，同时允许 Agent 从错误的推理路线中回溯。'])
    ]));
    state._render();
  }

  // -- self-refine：批评并修订的循环，质量先提升后趋于平台期 ----
  function selfRefine(host) {
    var state = { iters: 3 };
    var W = 520, H = 210, PAD = 34, IMAX = 8;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // quality(0)=52，增益以几何级数缩小并趋近 94 的上限
    function quality(k) { return 94 - 42 * Math.pow(0.62, k); }
    function px(k) { return PAD + k / IMAX * (W - 2 * PAD); }
    function py(q) { return H - PAD - (q - 40) / 60 * (H - 2 * PAD); }
    state._render = function () {
      var n = state.iters;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(94), x2: W - PAD, y2: py(94), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(label(W - PAD - 30, py(94) - 6, '上限', 'var(--ink-mute,#777)', '9'));
      var d = '', k;
      for (k = 0; k <= IMAX; k++) { d += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(quality(k)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }));
      for (k = 0; k <= n; k++) {
        svg.appendChild(svgEl('circle', { cx: px(k), cy: py(quality(k)), r: k === n ? '5' : '3.5', fill: 'var(--blueprint,#3553ff)' }));
      }
      var q = quality(n), gain = quality(n) - quality(n - 1 < 0 ? 0 : n - 1);
      num.innerHTML = q.toFixed(1) + ' <small>/ 100 质量分</small>';
      meta.textContent = n === 0 ? '初稿，尚未进行自我批评'
        : '第 ' + n + ' 次迭代提升了 +' + (n >= 1 ? (quality(n) - quality(n - 1)).toFixed(1) : '0') + ' 分  ·  ' + (n >= 4 ? '收益已趋于平缓，应停止改进' : '仍在改进');
      formula.textContent = '每一轮：批评自己的输出 -> 修订。gain_k = 上限 - 初稿，按几何级数缩小，因此质量会进入平台期';
    };
    var grid = el('div', {}, [LF.slider(state, 'iters', '改进迭代次数', 0, IMAX, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SELF-REFINE']), el('span', {}, ['拖动以调整迭代次数'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Self-Refine 让一个 Model 编写答案、批评自己的工作并进行修订，再将输出作为输入循环处理。最初几轮可以发现明显缺陷，并带来最大的提升；后续轮次能够修正的问题越来越少，因此质量逐渐接近上限并趋于平缓。关键能力在于判断额外迭代何时不再值得消耗 Token。'])
    ]));
    state._render();
  }

  // -- memory-blocks：固定的核心记忆 + 无界归档，换入/换出 ---
  function memoryBlocks(host) {
    var state = { paged: 3 };
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var CORE = 4; // 固定的核心槽位
    var archival = ['项目规范', 'API key 备注', '用户偏好', '历史 bug', '设计文档', '会议记录', 'schema v2', '待办清单'];
    state._render = function () {
      var paged = state.paged;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      // Context window 列（核心记忆，固定）
      svg.appendChild(label(110, 18, 'Context window', 'var(--blueprint,#3553ff)', '11'));
      var cy = 30, slot;
      for (slot = 0; slot < CORE; slot++) {
        var filled = slot < paged;
        svg.appendChild(box(40, cy, 140, 38, filled ? archival[slot] : '空闲槽位', filled));
        cy += 46;
      }
      // 归档存储（无界）
      svg.appendChild(label(400, 18, '归档存储（无界）', 'var(--ink-mute,#777)', '11'));
      var ax = 320, ay = 30, j;
      for (j = 0; j < archival.length; j++) {
        var inCtx = j < paged;
        var col = j % 2, row = Math.floor(j / 2);
        svg.appendChild(box(ax + col * 100, ay + row * 46, 92, 38, archival[j].split(' ')[0], false));
        if (inCtx) {
          svg.appendChild(svgEl('rect', { x: ax + col * 100, y: ay + row * 46, width: 92, height: 38, rx: '4', fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5', 'stroke-dasharray': '3 2' }));
        }
      }
      svg.appendChild(arrow(186, 120, 314, 120, '5 4'));
      svg.appendChild(label(250, 112, '换入 / 换出', 'var(--ink-soft,#555)', '9'));
      meta.textContent = CORE + ' 个核心槽位中已填充 ' + paged + ' 个  ·  ' + (archival.length - paged) + ' 个条目会留在归档中，直到被检索（带轮廓 = 当前已换入）';
      formula.textContent = '核心记忆容量固定，并且始终位于 Context 中；归档在磁盘上没有容量上限。Agent 换入相关条目并逐出过时条目，以遵守窗口限制';
    };
    var grid = el('div', {}, [LF.slider(state, 'paged', '换入核心记忆的条目数', 0, 4, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MEMORY BLOCKS']), el('span', {}, ['拖动以调整换入内容'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['结构化 Agent 记忆将始终位于 Context window 中的固定核心块，与磁盘上的无界归档存储分开。Agent 会读写自己的记忆：核心记忆填满时，它会总结最不相关的条目或将其逐出到归档中，并在需要时换回其他条目。这使 Agent 能在有限窗口内保留实际上近乎无限的历史记录。'])
    ]));
    state._render();
  }

  // -- voyager-skills：Skill 库持续增长，后续任务组合旧 Skill ----
  function voyagerSkills(host) {
    var state = { episodes: 4 };
    var W = 520, H = 230, PAD = 22;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 每个 episode 都会添加 Skill；后续 episode 会复用一些已有 Skill
    var newPerEp = [2, 2, 1, 2, 1, 1, 1, 1];
    var reusePerEp = [0, 1, 2, 2, 3, 3, 4, 4];
    state._render = function () {
      var ep = state.episodes;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var libSize = 0, reusedTotal = 0, i;
      for (i = 0; i < ep; i++) { libSize += newPerEp[i]; reusedTotal += reusePerEp[i]; }
      // 增长柱状图：每个 episode 之后的 Skill 库大小
      var maxLib = 0, cum = 0, sizes = [];
      for (i = 0; i < 8; i++) { cum += newPerEp[i]; sizes.push(cum); if (cum > maxLib) maxLib = cum; }
      var bw = (W - 2 * PAD) / 8;
      for (i = 0; i < 8; i++) {
        var active = i < ep;
        var h = sizes[i] / maxLib * (H - 2 * PAD - 30);
        svg.appendChild(svgEl('rect', { x: PAD + i * bw + 4, y: H - PAD - h, width: bw - 8, height: h, fill: active ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
        if (active) { svg.appendChild(label(PAD + i * bw + bw / 2, H - PAD - h - 5, String(sizes[i]), 'var(--blueprint,#3553ff)', '10')); }
        svg.appendChild(label(PAD + i * bw + bw / 2, H - PAD + 14, 'ep' + (i + 1), 'var(--ink-mute,#777)', '9'));
      }
      svg.appendChild(label(W / 2, 16, '每个 episode 后 Skill 库中的 Skill 数量', 'var(--ink-soft,#555)', '11'));
      meta.textContent = 'episode ' + ep + '：Skill 库包含 ' + libSize + ' 个可复用 Skill  ·  本次运行在编写新 Skill 前复用了 ' + reusePerEp[ep - 1] + ' 个现有 Skill';
      formula.textContent = '每个已解决的任务都会被提炼为一个具名、可复用的 Skill。后续任务通过组合库中的已有 Skill 来解决，因此增长曲线会产生复利效应';
    };
    var grid = el('div', {}, [LF.slider(state, 'episodes', '已完成的 episode 数', 1, 8, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['VOYAGER SKILL 库']), el('span', {}, ['拖动以调整 episode 数'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['持续学习的 Agent 会将每个已解决的任务转化为一个具名、可复用的 Skill 并存储起来。随着 episode 不断累积，Skill 库持续增长，后续任务可以组合现成 Skill，更快地得到解决，而不必从头开始。这种能力会产生复利效应：每一次成功都会降低解决下一个问题的成本。'])
    ]));
    state._render();
  }

  // -- langgraph-state：节点 State Machine、条件边，逐步执行
  function langgraphState(host) {
    var state = { step: 0 };
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var stateOut = el('div', { class: 'lf-formula' });
    // 布局节点；一次确定性执行会访问它们，并更新状态对象
    var nodes = [
      { x: 210, y: 24, w: 100, label: '开始' },
      { x: 70, y: 96, w: 110, label: '检索' },
      { x: 340, y: 96, w: 110, label: '生成' },
      { x: 210, y: 168, w: 120, label: '评分' },
      { x: 40, y: 168, w: 90, label: '重写' }
    ];
    // 执行路径：开始 -> 检索 -> 生成 -> 评分 ->（重写）-> 生成 -> 评分 -> 结束
    var walk = [0, 1, 2, 3, 4, 2, 3];
    var updates = [
      { key: 'query', val: '"如何部署"' },
      { key: 'docs', val: '[d1, d2, d3]' },
      { key: 'draft', val: '"运行 iii ..."' },
      { key: 'grade', val: '失败（偏题）' },
      { key: 'query', val: '"部署 iii engine"' },
      { key: 'draft', val: '"iii cloud 部署"' },
      { key: 'grade', val: '通过' }
    ];
    state._render = function () {
      var s = Math.min(state.step, walk.length - 1);
      var cur = walk[s];
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(arrowDefs());
      // 静态边
      function center(i) { return { x: nodes[i].x + nodes[i].w / 2, y: nodes[i].y + 22 }; }
      var edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 2]];
      edges.forEach(function (e) {
        var a = center(e[0]), b = center(e[1]);
        svg.appendChild(arrow(a.x, a.y + 18, b.x, b.y - 18, e[0] === 3 ? '4 3' : ''));
      });
      var i;
      for (i = 0; i < nodes.length; i++) {
        svg.appendChild(box(nodes[i].x, nodes[i].y, nodes[i].w, 44, nodes[i].label, i === cur));
      }
      svg.appendChild(label(120, 168 - 8, '评分=失败', 'var(--warn,#b8870f)', '9'));
      // 渲染目前累积的状态对象
      var st = {}, j;
      for (j = 0; j <= s; j++) { st[updates[j].key] = updates[j].val; }
      while (stateOut.firstChild) stateOut.removeChild(stateOut.firstChild);
      var keys = ['query', 'docs', 'draft', 'grade'], lines = [];
      keys.forEach(function (k) { if (st[k] !== undefined) lines.push(k + ': ' + st[k]); });
      stateOut.appendChild(document.createTextNode('state = { ' + lines.join(',  ') + ' }'));
      meta.textContent = '第 ' + (s + 1) + ' 步，共 ' + walk.length + ' 步：节点 "' + nodes[cur].label + '" 已运行  ·  ' + (walk[s] === 4 ? '评分失败，条件边循环返回重写节点' : nodes[cur].label === '评分' ? '条件边根据评分进行分支' : '状态对象已更新并传递给下一个节点');
    };
    var grid = el('div', {}, [LF.slider(state, 'step', '逐步执行图', 0, 6, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['有状态图']), el('span', {}, ['拖动以逐步执行'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [stateOut]), meta])]),
      el('div', { class: 'lf-cap' }, ['有状态图将 Agent 建模为由边连接的节点，并让一个共享状态对象依次经过每个节点。每个节点读取状态、完成自己的工作，然后写回状态。条件边根据状态进行分支，因此评分失败时可以循环返回重写节点，而不是直接结束。图结构使控制流清晰明确，并且每一步的状态都可检查。'])
    ]));
    state._render();
  }

  // -- multi-agent-debate：两个 Agent 在多轮中收敛，准确率与轮数的关系
  function multiAgentDebate(host) {
    var state = { rounds: 3 };
    var W = 520, H = 240, PAD = 30;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var RMAX = 6;
    // 两个答案估计值起初相距较远，并逐渐趋近一个共享答案（0.5）
    var TRUTH = 0.5;
    function posA(r) { return TRUTH + (0.28) * Math.pow(0.55, r); }
    function posB(r) { return TRUTH - (0.34) * Math.pow(0.55, r); }
    // 随着差距缩小，准确率提高，但收益递减
    function acc(r) { return 62 + 32 * (1 - Math.pow(0.55, r)); }
    function px(r) { return PAD + r / RMAX * (W - 2 * PAD - 40); }
    function py(p) { return PAD + (1 - p) * (H - 2 * PAD); }
    state._render = function () {
      var n = state.rounds;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      // 共享答案线
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(TRUTH), x2: W - PAD - 40, y2: py(TRUTH), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      svg.appendChild(label(W - PAD - 18, py(TRUTH) + 3, '答案', 'var(--ink-mute,#777)', '9'));
      function track(fn, st) {
        var d = '', r; for (r = 0; r <= RMAX; r++) { d += (r ? 'L' : 'M') + px(r).toFixed(1) + ' ' + py(fn(r)).toFixed(1) + ' '; }
        svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: st, 'stroke-width': '1.4', 'stroke-dasharray': '4 3', opacity: '0.5' }));
      }
      track(posA, 'var(--blueprint,#3553ff)');
      track(posB, 'var(--warn,#b8870f)');
      var r;
      for (r = 0; r <= n; r++) {
        svg.appendChild(svgEl('circle', { cx: px(r), cy: py(posA(r)), r: r === n ? '5' : '3', fill: 'var(--blueprint,#3553ff)' }));
        svg.appendChild(svgEl('circle', { cx: px(r), cy: py(posB(r)), r: r === n ? '5' : '3', fill: 'var(--warn,#b8870f)' }));
      }
      svg.appendChild(label(PAD + 20, py(posA(0)) - 8, 'Agent A', 'var(--blueprint,#3553ff)', '9'));
      svg.appendChild(label(PAD + 20, py(posB(0)) + 14, 'Agent B', 'var(--warn,#b8870f)', '9'));
      var gap = Math.abs(posA(n) - posB(n));
      num.innerHTML = acc(n).toFixed(0) + ' <small>% 准确率</small>';
      meta.textContent = '第 ' + n + ' 轮：观点相差 ' + (gap * 100).toFixed(0) + ' 个百分点  ·  ' + (gap < 0.06 ? 'Agent 已经收敛' : n >= 4 ? '收益已趋于平缓，增加轮次通常无济于事' : '仍在收敛');
      formula.textContent = '每一轮中，Agent 都会阅读另一个 Agent 的记录并更新答案。收敛过程呈几何级数，因此准确率提升的同时收益会逐渐递减';
    };
    var grid = el('div', {}, [LF.slider(state, 'rounds', '辩论轮数', 0, RMAX, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['MULTI-AGENT 辩论']), el('span', {}, ['拖动以调整轮数'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['在辩论中，多个 Agent 先独立回答，然后在多轮过程中阅读彼此的记录并修订答案。分歧会迫使每个 Agent 为自己的推理辩护或纠正推理，而各方观点通常会朝更好的共同答案收敛。最初一两轮带来绝大部分准确率提升；在此之后，Agent 已达成一致，额外轮次大多只会消耗 Token。'])
    ]));
    state._render();
  }

  // -- orchestration-pattern：supervisor | swarm | hierarchical 拓扑 ----
  function orchestrationPattern(host) {
    var state = { pat: 'supervisor' };
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var N = 5;
    function dot(x, y, on) { return svgEl('circle', { cx: x, cy: y, r: on ? '10' : '8', fill: on ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var edges = 0, i, j;
      if (state.pat === 'supervisor') {
        var sx = W / 2, sy = 40;
        var workers = [], k;
        for (k = 0; k < N; k++) { workers.push({ x: (W) * (k + 1) / (N + 1), y: 170 }); }
        for (k = 0; k < N; k++) {
          svg.appendChild(svgEl('line', { x1: sx, y1: sy + 10, x2: workers[k].x, y2: workers[k].y - 10, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.2' }));
          edges++;
        }
        svg.appendChild(dot(sx, sy, true));
        for (k = 0; k < N; k++) { svg.appendChild(dot(workers[k].x, workers[k].y, false)); }
        svg.appendChild(label(sx, sy - 16, 'supervisor', 'var(--blueprint,#3553ff)', '10'));
        formula.textContent = '一个 supervisor 将任务路由给 N 个 worker：' + N + ' 条边，O(N)。集中式规划，单一控制点和故障点';
      } else if (state.pat === 'swarm') {
        var pts = [], a;
        for (i = 0; i < N; i++) { a = -Math.PI / 2 + 2 * Math.PI * i / N; pts.push({ x: W / 2 + 80 * Math.cos(a), y: 110 + 70 * Math.sin(a) }); }
        for (i = 0; i < N; i++) { for (j = i + 1; j < N; j++) {
          svg.appendChild(svgEl('line', { x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y, stroke: 'var(--warn,#b8870f)', 'stroke-width': '0.8', opacity: '0.55' }));
          edges++;
        } }
        for (i = 0; i < N; i++) { svg.appendChild(dot(pts[i].x, pts[i].y, false)); }
        formula.textContent = '对等节点直接交接：' + edges + ' 条边，O(N^2)。没有中心瓶颈，但协调成本增长很快';
      } else {
        // hierarchical：根节点 -> 2 个中间节点 -> 叶节点
        var rootX = W / 2, rootY = 30;
        var mids = [{ x: W / 3, y: 110 }, { x: 2 * W / 3, y: 110 }];
        svg.appendChild(dot(rootX, rootY, true));
        mids.forEach(function (m, mi) {
          svg.appendChild(svgEl('line', { x1: rootX, y1: rootY + 10, x2: m.x, y2: m.y - 10, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.2' }));
          edges++;
          var li;
          for (li = 0; li < 2; li++) {
            var lx = m.x - 40 + li * 80, ly = 190;
            svg.appendChild(svgEl('line', { x1: m.x, y1: m.y + 10, x2: lx, y2: ly - 10, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1' }));
            edges++;
            svg.appendChild(dot(lx, ly, false));
          }
          svg.appendChild(dot(m.x, m.y, false));
        });
        svg.appendChild(label(rootX, rootY - 14, '根节点', 'var(--blueprint,#3553ff)', '10'));
        formula.textContent = 'supervisor 树：' + edges + ' 条边，按深度限制扇出。委派机制可扩展，但每增加一层都会增加延迟';
      }
      meta.textContent = '模式 "' + state.pat + '"  ·  ' + (state.pat === 'hierarchical' ? '7' : N) + ' 个 Agent 之间有 ' + edges + ' 条协调边';
    };
    var grid = el('div', {}, [LF.select(state, 'pat', '编排模式', [
      ['supervisor', 'supervisor'], ['swarm（点对点）', 'swarm'], ['hierarchical', 'hierarchical']
    ])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['编排模式']), el('span', {}, ['选择一种拓扑'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['三种常见的 multi-agent 拓扑需要在控制能力与韧性之间进行权衡。supervisor 使用 O(N) 条边集中处理路由，但会成为单一故障点。点对点 swarm 没有瓶颈，但需要承担 O(N²) 的协调成本。hierarchical 结构通过多层 supervisor 进行委派，以每层增加延迟为代价扩展扇出能力。正确选择取决于 Agent 之间需要进行多少通信。'])
    ]));
    state._render();
  }

  LF.register({
    'rewoo-plan': rewooPlan,
    'tree-of-thoughts': treeOfThoughts,
    'self-refine': selfRefine,
    'memory-blocks': memoryBlocks,
    'voyager-skills': voyagerSkills,
    'langgraph-state': langgraphState,
    'multi-agent-debate': multiAgentDebate,
    'orchestration-pattern': orchestrationPattern
  });
})();
