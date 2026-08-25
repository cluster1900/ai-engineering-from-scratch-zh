/* figures-llmeng.js：用于 Phase 11（LLM engineering）
   和 Phase 13（Tool 与协议）的交互式课程图示。在 lesson-figures.js 之后加载，并通过
   window.LF.register 注册。Vanilla ES5，无依赖，通过 CSS 变量应用主题。编写方式
   与以下 fenced block 相同：
       ```figure
       few-shot-curve
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, slider = LF.slider, clamp = LF.clamp;

  // ── few-shot-curve：准确率与 in-context 示例数量 k 的关系 ─────────────────
  function fewShotCurve(host) {
    var state = { k: 4 };
    var W = 520, H = 220, PAD = 32, KMAX = 16;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var A0 = 0.42, AMAX = 0.92;
    function acc(k) { return A0 + (AMAX - A0) * (1 - Math.exp(-k / 3.5)); }
    function px(k) { return PAD + k / KMAX * (W - 2 * PAD); }
    function py(a) { return H - PAD - (a - 0.3) / 0.7 * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.appendChild(svgEl('line', { x1: PAD, y1: py(AMAX), x2: W - PAD, y2: py(AMAX), stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
      var d = '', i;
      for (i = 0; i <= 120; i++) { var k = KMAX * i / 120; d += (i ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(acc(k)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      svg.appendChild(svgEl('circle', { cx: px(0), cy: py(acc(0)), r: '3.5', fill: 'var(--ink-mute,#777)' }));
      svg.appendChild(svgEl('circle', { cx: px(state.k), cy: py(acc(state.k)), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      var a = acc(state.k), gap = a - acc(0);
      num.innerHTML = (a * 100).toFixed(1) + ' <small>% 准确率</small>';
      meta.textContent = (state.k === 0 ? 'zero-shot 基线' : state.k + '-shot') + '  ·  比 zero-shot 高 +' + (gap * 100).toFixed(1) + ' 个百分点  ·  ' + (state.k >= 8 ? '平台期：更多示例几乎没有帮助' : '仍在上升');
      formula.textContent = 'accuracy(k) = ' + (A0 * 100).toFixed(0) + '% + (' + ((AMAX - A0) * 100).toFixed(0) + ' 个百分点)(1 − e^(−k/3.5))  ·  收益递减';
    };
    var grid = el('div', {}, [slider(state, 'k', 'in-context 示例 k', 0, KMAX, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['FEW-SHOT 曲线']), el('span', {}, ['拖动示例数量'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['向 Prompt 添加带 Label 的示例，会使准确率先快速上升，随后趋于平缓。灰色圆点代表 zero-shot；最初几个演示消除了大部分差距，超过少量示例后，每个新示例几乎不再带来收益，却仍会消耗 Token。关键在于选择能够达到平台期的最小示例集。'])
    ]));
    state._render();
  }

  // ── cot-decomposition：将难题拆分为推理步骤，展示 CoT 提升 ────────────────
  function cotDecomposition(host) {
    var state = { cot: 'on' };
    var W = 520, H = 220, PAD = 18;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    var STEPS = ['读取', '查找费率', '相乘', '加税', '作答'];
    function box(x, y, w, h, label, fill, tcol) {
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, rx: '4', fill: fill, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2' }));
      var t = svgEl('text', { x: (x + w / 2).toFixed(1), y: (y + h / 2 + 4).toFixed(1), 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '11', fill: tcol });
      t.appendChild(document.createTextNode(label));
      g.appendChild(t);
      return g;
    }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var on = state.cot === 'on';
      var qY = 24, aY = H - 56, bh = 34;
      svg.appendChild(box(PAD, qY, 150, bh, '问题', 'var(--bg,#fafaf5)', 'var(--ink,#1a1a1a)'));
      svg.appendChild(box(W - PAD - 150, aY, 150, bh, '答案', 'var(--blueprint,#3553ff)', 'var(--bg,#fafaf5)'));
      if (on) {
        var n = STEPS.length, midY = (qY + aY) / 2, bw = (W - 2 * PAD) / n - 8, sh = 28;
        var i, prevX = PAD + 75, prevY = qY + bh;
        for (i = 0; i < n; i++) {
          var x = PAD + i * ((W - 2 * PAD) / n) + 4, cx = x + bw / 2;
          svg.appendChild(svgEl('line', { x1: prevX, y1: prevY, x2: cx, y2: midY, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4', opacity: '0.6' }));
          svg.appendChild(box(x, midY - sh / 2, bw, sh, String(i + 1), 'var(--bg-surface,#eee)', 'var(--ink,#1a1a1a)'));
          prevX = cx; prevY = midY + sh / 2;
        }
        svg.appendChild(svgEl('line', { x1: prevX, y1: prevY, x2: W - PAD - 75, y2: aY, stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4', opacity: '0.6' }));
      } else {
        svg.appendChild(svgEl('line', { x1: PAD + 75, y1: qY + bh, x2: W - PAD - 75, y2: aY, stroke: 'var(--rule-soft,#ccc)', 'stroke-width': '1.4', 'stroke-dasharray': '4 3' }));
        var qm = svgEl('text', { x: (W / 2).toFixed(1), y: ((qY + aY) / 2 + 4).toFixed(1), 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '13', fill: 'var(--ink-mute,#777)' });
        qm.appendChild(document.createTextNode('（未展示过程）'));
        svg.appendChild(qm);
      }
      var accDirect = 0.38, accCoT = 0.71;
      var a = on ? accCoT : accDirect;
      num.innerHTML = (a * 100).toFixed(0) + ' <small>% 已解答</small>';
      meta.textContent = on ? 'chain-of-thought：5 个中间步骤让每个子步骤都可检查  ·  +' + ((accCoT - accDirect) * 100).toFixed(0) + ' 个百分点' : '直接作答：Model 必须一次完成每个步骤，一步跳到答案';
      formula.textContent = on ? 'prompt += "让我们逐步推理" → 展示中间状态' : 'answer = f(question)，仅使用一次 forward pass';
    };
    var grid = el('div', {}, [LF.select(state, 'cot', '推理方式', [['启用 chain-of-thought', 'on'], ['直接作答（关闭）', 'off']])]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CHAIN OF THOUGHT']), el('span', {}, ['切换是否展示过程'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['要求 Model 直接回答难题，会迫使它把每个步骤压缩成一次跳跃，因此经常出错。Chain-of-thought 要求它写出中间步骤，把一次大跨度跳跃变成一连串独立且简单的小步骤。每个可见的子步骤也为 Model 提供了发现自身错误的机会。'])
    ]));
    state._render();
  }

  // ── constrained-decoding：grammar mask 将不符合 schema 的 Token 置灰 ──────
  function constrainedDecoding(host) {
    var state = { step: 1 };
    var rows = el('div', {});
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 每个 grammar 状态下的候选下一个 Token；valid 表示 JSON schema 允许
    var STATES = [
      { ctx: '', valid: ['{'], cands: ['{', 'hello', '42', '[', 'true'] },
      { ctx: '{', valid: ['"'], cands: ['"', '{', '42', 'name', ':'] },
      { ctx: '{ "', valid: ['name', 'age'], cands: ['name', 'age', '}', '123', ','] },
      { ctx: '{ "name"', valid: [':'], cands: [':', '"', '}', 'foo', '42'] },
      { ctx: '{ "name":', valid: ['"'], cands: ['"', '{', 'true', '42', ']'] }
    ];
    state._render = function () {
      var st = STATES[state.step];
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      var allowed = 0;
      st.cands.forEach(function (tok) {
        var ok = st.valid.indexOf(tok) >= 0;
        if (ok) allowed++;
        var bar = el('i'); bar.style.width = ok ? '100%' : '12%';
        if (!ok) bar.style.background = 'var(--rule-soft,#ccc)';
        var lab = el('label', {}, ['"' + tok + '"', el('b', {}, [ok ? '允许' : '已 mask'])]);
        if (!ok) lab.style.opacity = '0.4';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [lab, el('div', { class: 'lf-bar' }, [bar])]));
      });
      num.innerHTML = st.cands.length + ' 个 Token 中有 ' + allowed + ' 个有效';
      meta.textContent = '当前内容：' + (st.ctx || '（空）') + '  ·  grammar 只允许使输出继续符合 schema 的 Token';
      formula.textContent = 'softmax 前设置 logits[invalid] = −∞ → Model 只能采样 schema 允许的下一个 Token';
    };
    var grid = el('div', {}, [slider(state, 'step', 'decoding 位置', 0, STATES.length - 1, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['CONSTRAINED DECODING']), el('span', {}, ['拖动查看 JSON'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['Structured output 会在 decode 时强制执行 grammar。在每个位置，schema 都会计算哪些下一个 Token 合法，并在采样前将其他所有 Token 的 logit 降为负无穷。Model 仍会进行选择，但只能从允许的集合中选择，因此结果始终是可解析的 JSON，而不是碰巧看起来像 JSON 的自由文本。'])
    ]));
    state._render();
  }

  // ── prompt-cache-hit：共享 prefix 长度和命中率可降低延迟与成本 ─────────────
  function promptCacheHit(host) {
    var state = { prefix: 70, hit: 80 };
    var W = 520, H = 120, PAD = 20;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var bar = el('i');
    var barWrap = el('div', { class: 'lf-bar' }, [bar]);
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    state._render = function () {
      var pf = state.prefix / 100, hr = state.hit / 100;
      var saved = hr * pf;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var inX = PAD, inW = W - 2 * PAD, y = 40, h = 40;
      var pw = inW * pf;
      svg.appendChild(svgEl('rect', { x: inX, y: y, width: pw.toFixed(1), height: h, rx: '3', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.2', 'stroke-dasharray': '4 3' }));
      svg.appendChild(svgEl('rect', { x: (inX + pw).toFixed(1), y: y, width: (inW - pw).toFixed(1), height: h, rx: '3', fill: 'var(--blueprint,#3553ff)', opacity: '0.85' }));
      var t1 = svgEl('text', { x: (inX + pw / 2).toFixed(1), y: (y + h + 16).toFixed(1), 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink-mute,#777)' });
      t1.appendChild(document.createTextNode('已 cache 的 prefix ' + state.prefix + '%'));
      svg.appendChild(t1);
      var t2 = svgEl('text', { x: (inX + pw + (inW - pw) / 2).toFixed(1), y: (y + h + 16).toFixed(1), 'text-anchor': 'middle', 'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink-soft,#555)' });
      t2.appendChild(document.createTextNode('新增 ' + (100 - state.prefix) + '%'));
      svg.appendChild(t2);
      num.innerHTML = (saved * 100).toFixed(1) + ' <small>% prefill 已节省</small>';
      bar.style.width = (saved * 100).toFixed(1) + '%';
      barWrap.classList.toggle('over', saved > 0.6);
      meta.textContent = '命中率 ' + state.hit + '%  ·  已 cache 的 prefix 跳过重复计算  ·  成本和 time-to-first-token 均降低约 ' + (saved * 100).toFixed(0) + '%';
      formula.textContent = 'saved = hit_rate × prefix_fraction = ' + hr.toFixed(2) + ' × ' + pf.toFixed(2) + ' = ' + saved.toFixed(2);
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'prefix', '共享 prefix（占 Prompt 的百分比）', 0, 100, 1),
      slider(state, 'hit', 'cache 命中率（%）', 0, 100, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['PROMPT CACHE 命中']), el('span', {}, ['拖动 prefix 和命中率'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, barWrap, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['在多次调用中重复出现的长 system Prompt 或文档，可以只执行一次 prefill 并重复使用。已 cache 的 prefix（虚线）会跳过重复计算，因此只处理新增的 suffix（实线）。节省比例等于命中率乘以 prefix 比例：频繁命中的大型共享 prefix 最能体现 cache 的价值。'])
    ]));
    state._render();
  }

  // ── semantic-cache：similarity 阈值在命中率与安全性之间权衡 ────────────────
  function semanticCache(host) {
    var state = { thr: 0.85 };
    var W = 520, H = 200, PAD = 26;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // 确定性的传入查询：与最近 cache 条目的 cosine similarity，
    // 以及该 cache 答案对该查询是否确实正确
    var Q = [
      { sim: 0.97, ok: true }, { sim: 0.93, ok: true }, { sim: 0.90, ok: true },
      { sim: 0.88, ok: true }, { sim: 0.84, ok: false }, { sim: 0.80, ok: true },
      { sim: 0.76, ok: false }, { sim: 0.71, ok: false }, { sim: 0.62, ok: true },
      { sim: 0.50, ok: false }
    ];
    function px(s) { return PAD + (s - 0.4) / 0.6 * (W - 2 * PAD); }
    state._render = function () {
      var thr = state.thr;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var tx = px(thr);
      svg.appendChild(svgEl('rect', { x: tx.toFixed(1), y: PAD, width: (W - PAD - tx).toFixed(1), height: (H - 2 * PAD).toFixed(1), fill: 'var(--blueprint,#3553ff)', opacity: '0.06' }));
      svg.appendChild(svgEl('line', { x1: tx, y1: PAD - 4, x2: tx, y2: H - PAD, stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' }));
      var hits = 0, wrong = 0;
      Q.forEach(function (q, i) {
        var hit = q.sim >= thr;
        if (hit) { hits++; if (!q.ok) wrong++; }
        var cy = PAD + (i + 0.5) / Q.length * (H - 2 * PAD);
        var col = !hit ? 'var(--rule-soft,#ccc)' : (q.ok ? 'var(--blueprint,#3553ff)' : 'var(--warn,#b8870f)');
        svg.appendChild(svgEl('circle', { cx: px(q.sim), cy: cy.toFixed(1), r: hit ? '5' : '3.5', fill: col }));
      });
      num.innerHTML = Q.length + ' 个查询中有 ' + hits + ' 个由 cache 返回';
      meta.textContent = '阈值 ' + thr.toFixed(2) + '  ·  其中 ' + wrong + ' 次命中返回错误答案  ·  ' + (thr >= 0.9 ? '高：命中较少，更安全' : thr <= 0.7 ? '低：命中较多，风险较高' : '平衡');
      formula.textContent = '当 cos(query, cached) ≥ ' + thr.toFixed(2) + ' 时返回 cache 答案  ·  阈值越低 = 命中越多，风险越高';
    };
    var grid = el('div', {}, [slider(state, 'thr', 'similarity 阈值', 0.5, 0.99, 0.01)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['SEMANTIC CACHE']), el('span', {}, ['拖动阈值'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['当新查询与已存储答案的 Embedding 足够接近时，semantic cache 会使用该答案响应新查询。每个圆点代表一个传入查询，其位置由它与最近 cache 条目的 cosine similarity 决定；橙色线右侧的阴影区域由 cache 提供响应。提高阈值会减少命中，但很少返回错误答案；降低阈值会增加 cache 命中，却可能返回过时或不匹配的回复（橙色圆点）。'])
    ]));
    state._render();
  }

  // ── function-call-args：Model 选择 Tool，然后填写带类型的 JSON 字段 ──────
  function functionCallArgs(host) {
    var state = { step: 2 };
    var W = 520, H = 200, PAD = 18;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var code = el('div', { class: 'lf-formula' });
    var meta = el('div', { class: 'lf-meta' });
    // 从用户请求中逐步填充 schema 字段
    var SLOTS = [
      { name: 'tool', type: 'enum', val: 'book_flight' },
      { name: 'from', type: 'string', val: '"BOM"' },
      { name: 'to', type: 'string', val: '"SFO"' },
      { name: 'date', type: 'date', val: '"2026-07-01"' },
      { name: 'pax', type: 'int', val: '2' }
    ];
    var REQUEST = '预订 7 月 1 日从 Mumbai 到 San Francisco 的 2 个座位';
    function box(x, y, w, h, label, active) {
      var g = svgEl('g', {});
      g.appendChild(svgEl('rect', { x: x, y: y, width: w, height: h, rx: '3', fill: active ? 'var(--blueprint,#3553ff)' : 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.1' }));
      var t = svgEl('text', { x: (x + 8).toFixed(1), y: (y + h / 2 + 4).toFixed(1), 'font-family': 'monospace', 'font-size': '10.5', fill: active ? 'var(--bg,#fafaf5)' : 'var(--ink,#1a1a1a)' });
      t.appendChild(document.createTextNode(label));
      g.appendChild(t);
      return g;
    }
    state._render = function () {
      var s = state.step;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var rq = svgEl('text', { x: PAD, y: 22, 'font-family': 'monospace', 'font-size': '10.5', fill: 'var(--ink-soft,#555)' });
      rq.appendChild(document.createTextNode('请求：' + REQUEST));
      svg.appendChild(rq);
      var y0 = 36, rh = 28, w = W - 2 * PAD;
      SLOTS.forEach(function (slot, i) {
        var filled = i <= s;
        var y = y0 + i * (rh + 2);
        var label = slot.name + ' : ' + slot.type + (filled ? '  =  ' + slot.val : '  =  ?');
        svg.appendChild(box(PAD, y, w, rh, label, filled));
      });
      code.textContent = '{ ' + SLOTS.slice(0, s + 1).map(function (sl) { return '"' + sl.name + '": ' + sl.val; }).join(', ') + (s < SLOTS.length - 1 ? ', ... ' : ' ') + '}';
      meta.textContent = SLOTS.length + ' 个字段中已填写 ' + (s + 1) + ' 个  ·  Model 先选择 Tool，再从请求中提取每个带类型的参数';
    };
    var grid = el('div', {}, [slider(state, 'step', '已填写的参数', 0, SLOTS.length - 1, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['FUNCTION CALL 参数']), el('span', {}, ['拖动以填写 schema'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, code, meta])]),
      el('div', { class: 'lf-cap' }, ['Function calling 将两项工作合二为一。首先，Model 从可用集合中选择要调用的 Tool；然后，它从用户请求中提取值，填入该 Tool 带类型的参数 schema。输出不是自然语言，而是结构化调用：一个 Tool 名称，加上字段符合声明类型的 JSON 对象，可直接执行。'])
    ]));
    state._render();
  }

  // ── llm-judge-rubric：加权 rubric 分数与 LLM-as-judge 聚合 ────────────────
  function llmJudgeRubric(host) {
    var state = { wHelp: 40, wCorr: 40, wSafe: 20 };
    var rows = el('div', {});
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // judge 对单个回复中每项标准的评分，范围为 0..1
    var CRIT = [
      { key: 'wHelp', label: '帮助程度', score: 0.85 },
      { key: 'wCorr', label: '正确性', score: 0.60 },
      { key: 'wSafe', label: '安全性', score: 0.95 }
    ];
    state._render = function () {
      var wsum = state.wHelp + state.wCorr + state.wSafe;
      if (wsum <= 0) wsum = 1;
      while (rows.firstChild) rows.removeChild(rows.firstChild);
      var total = 0;
      CRIT.forEach(function (c) {
        var w = state[c.key] / wsum;
        total += w * c.score;
        var bar = el('i'); bar.style.width = (c.score * 100).toFixed(0) + '%';
        rows.appendChild(el('div', { class: 'lf-ctrl' }, [
          el('label', {}, [c.label + '（权重 ' + (w * 100).toFixed(0) + '%）', el('b', {}, [c.score.toFixed(2)])]),
          el('div', { class: 'lf-bar' }, [bar])
        ]));
      });
      num.innerHTML = total.toFixed(3) + ' <small>加权分数</small>';
      meta.textContent = '权重经归一化后总和为 1  ·  将更多权重分配给正确性会降低此回复的分数，因为它在该项得分最低';
      formula.textContent = 'score = Σ (wᵢ / Σw) · sᵢ  ·  s = [0.85, 0.60, 0.95]  ·  judge 对每项标准评分，rubric 负责聚合';
    };
    var grid = el('div', { class: 'lf-grid' }, [
      slider(state, 'wHelp', '帮助程度权重', 0, 100, 1),
      slider(state, 'wCorr', '正确性权重', 0, 100, 1),
      slider(state, 'wSafe', '安全性权重', 0, 100, 1)
    ]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['LLM-AS-JUDGE RUBRIC']), el('span', {}, ['拖动 rubric 权重'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [rows, num, meta, formula])]),
      el('div', { class: 'lf-cap' }, ['LLM judge 会根据多项标准对回复评分，这里包括帮助程度、正确性和安全性。最终分数是加权平均值，权重体现了你真正重视的内容。此回复在安全性方面表现出色，但正确性较弱，因此让 rubric 更偏重正确性会拉低它的分数。决定“好”的含义的是权重，而不是 Model。'])
    ]));
    state._render();
  }

  // ── lost-in-the-middle：检索准确率随事实位置呈 U 形变化 ───────────────────
  function lostInTheMiddle(host) {
    var state = { pos: 50 };
    var W = 520, H = 220, PAD = 32;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var num = el('span', { class: 'lf-num' });
    var meta = el('div', { class: 'lf-meta' });
    var formula = el('div', { class: 'lf-formula' });
    // U 形：两端较高（recency + primacy），中间下降
    function acc(p) { var x = p / 100; var u = 0.40 + 0.55 * Math.pow(2 * x - 1, 2); return clamp(u, 0, 1); }
    function px(p) { return PAD + p / 100 * (W - 2 * PAD); }
    function py(a) { return H - PAD - (a - 0.3) / 0.7 * (H - 2 * PAD); }
    state._render = function () {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var d = '', i;
      for (i = 0; i <= 120; i++) { var p = 100 * i / 120; d += (i ? 'L' : 'M') + px(p).toFixed(1) + ' ' + py(acc(p)).toFixed(1) + ' '; }
      svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2' }));
      var s = svgEl('text', { x: PAD, y: H - 8, 'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink-mute,#777)' });
      s.appendChild(document.createTextNode('Context 开头'));
      svg.appendChild(s);
      var e = svgEl('text', { x: (W - PAD).toFixed(1), y: H - 8, 'text-anchor': 'end', 'font-family': 'monospace', 'font-size': '10', fill: 'var(--ink-mute,#777)' });
      e.appendChild(document.createTextNode('Context 末尾'));
      svg.appendChild(e);
      svg.appendChild(svgEl('circle', { cx: px(state.pos), cy: py(acc(state.pos)), r: '5', fill: 'var(--blueprint,#3553ff)' }));
      var a = acc(state.pos);
      num.innerHTML = (a * 100).toFixed(0) + ' <small>% 检索准确率</small>';
      meta.textContent = '事实位于 Context 的 ' + state.pos + '% 处  ·  ' + (state.pos < 20 || state.pos > 80 ? '靠近边缘：容易回忆' : '埋在中间：容易遗漏');
      formula.textContent = 'accuracy(pos) ≈ 0.40 + 0.55·(2·pos − 1)²  ·  U 形：primacy + recency，中间下降';
    };
    var grid = el('div', {}, [slider(state, 'pos', '关键事实位置（占 Context 的百分比）', 0, 100, 1)]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['LOST IN THE MIDDLE']), el('span', {}, ['拖动事实位置'])]),
      el('div', { class: 'lf-body' }, [grid, el('div', { class: 'lf-out' }, [svg, el('div', { style: 'margin-top:10px' }, [num]), meta, formula])]),
      el('div', { class: 'lf-cap' }, ['当唯一相关的事实埋在很长的 Context 中时，如果它位于开头或末尾附近，Model 就能很好地回忆；如果它位于中间，表现则差得多。准确率随位置呈 U 形变化。这就是 Context engineering 会把最重要的材料放在 Prompt 顶部或底部，并且绝不依赖冗长、无结构内容堆砌的原因。'])
    ]));
    state._render();
  }

  LF.register({
    'few-shot-curve': fewShotCurve,
    'cot-decomposition': cotDecomposition,
    'constrained-decoding': constrainedDecoding,
    'prompt-cache-hit': promptCacheHit,
    'semantic-cache': semanticCache,
    'function-call-args': functionCallArgs,
    'llm-judge-rubric': llmJudgeRubric,
    'lost-in-the-middle': lostInTheMiddle
  });
})();
