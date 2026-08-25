/* figures-infra2.js：Phase 17（基础设施与生产环境）的动态课程图示——
   serving、routing、caching、autoscaling。在 lesson-figures.js 之后加载，
   并通过 window.LF.register 注册。原生 ES5，无依赖，通过 CSS 变量应用主题。
   动画仅使用 SMIL（animate / animateMotion / animateTransform）。
   编写方式仍使用相同的 fenced block：
       ```figure
       cache-aware-router
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl, select = LF.select;

  var BP = 'var(--blueprint,#3553ff)';
  var SOFT = 'var(--rule-soft,#ccc)';
  var MUTE = 'var(--ink-mute,#999)';
  var WARN = 'var(--warn,#b8870f)';
  var INK = 'var(--ink,#1a1a1a)';
  var BG = 'var(--bg,#fafaf5)';

  function shell(host, label, sub, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [sub])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function motion(path, dur, begin) {
    return svgEl('animateMotion', { path: path, dur: dur, begin: begin || '0s', repeatCount: 'indefinite' });
  }
  function box(x, y, w, h, fill, stroke) {
    return svgEl('rect', { x: x, y: y, width: w, height: h, rx: 4, fill: fill || 'none', stroke: stroke || SOFT, 'stroke-width': 1.4 });
  }
  function txt(x, y, s, size, fill, anchor) {
    return svgEl('text', { x: x, y: y, 'font-family': 'var(--font-mono,monospace)', 'font-size': size || 11, fill: fill || MUTE, 'text-anchor': anchor || 'middle' }, [document.createTextNode(s)]);
  }

  // ── cache-aware-router：round-robin 分散与 prefix-hash routing 对比 ─────────
  // 11-multi-region-kv-locality
  function cacheAwareRouter(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var src = { x: 60, y: 120 };
    var reps = [{ x: 430, y: 50 }, { x: 430, y: 120 }, { x: 430, y: 190 }];
    svg.appendChild(box(30, 100, 60, 40, BG, INK));
    svg.appendChild(txt(60, 124, 'router', 10, INK));
    reps.forEach(function (r, i) {
      svg.appendChild(box(r.x - 38, r.y - 18, 76, 36, BG, i === 1 ? BP : SOFT));
      svg.appendChild(txt(r.x, r.y - 2, 'replica ' + (i + 1), 9, i === 1 ? BP : MUTE));
      svg.appendChild(txt(r.x, r.y + 11, i === 1 ? 'cache: P' : 'cold', 8, MUTE));
    });
    // 通往 replica 2（持有 prefix P）的 hot path——虚线 active link
    var hot = svgEl('path', { d: 'M90 120 L392 120', fill: 'none', stroke: BP, 'stroke-width': 2, 'stroke-dasharray': '6 5' });
    hot.appendChild(anim('stroke-dashoffset', '22;0', '0.9s'));
    svg.appendChild(hot);
    svg.appendChild(svgEl('path', { d: 'M90 110 L392 60', fill: 'none', stroke: SOFT, 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
    svg.appendChild(svgEl('path', { d: 'M90 130 L392 188', fill: 'none', stroke: SOFT, 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
    // 携带 prefix P 的请求流入，并被路由到 hot replica
    var i;
    for (i = 0; i < 3; i++) {
      var g = svgEl('g', {}, [
        svgEl('circle', { cx: 0, cy: 0, r: 6, fill: BP }),
        txt(0, 3, 'P', 8, BG)
      ]);
      g.appendChild(motion('M-30 120 L60 120 L430 120', '2.4s', (i * 0.8) + 's'));
      svg.appendChild(g);
    }
    svg.appendChild(txt(60, 175, '按 prefix-hash 路由', 9, MUTE));
    svg.appendChild(txt(430, 225, 'P 请求复用 warm cache', 9, BP));
    shell(host, 'CACHE-AWARE ROUTER', '将请求路由到持有对应 prefix 的 replica', svg,
      'Round-robin 会盲目分散请求，因此大多数请求都会 cache miss，并承担完整的 prefill 开销。cache-aware router 对 Prompt prefix 执行 hash，并将每个匹配的请求发送到已经持有相应 KV blocks 的 replica——warm path 会持续保持 warm，TTFT 也会从受 prefill 限制骤降至一次 cache hit。');
  }

  // ── cold-start-layers：weights 依次流经 NVMe→DRAM→HBM，replica 进入 warm 状态 ─────
  // 10-cold-start-mitigation
  function coldStartLayers(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var tiers = [
      { x: 30, t: 'NVMe', s: '静态 weights' },
      { x: 180, t: 'DRAM', s: '已暂存' },
      { x: 330, t: 'HBM', s: '位于 GPU' }
    ];
    tiers.forEach(function (ti) {
      svg.appendChild(box(ti.x, 70, 100, 90, BG, MUTE));
      svg.appendChild(txt(ti.x + 50, 60, ti.t, 9, MUTE));
      svg.appendChild(txt(ti.x + 50, 175, ti.s, 8, MUTE));
    });
    // 最右侧从 cold→warm 的 replica
    svg.appendChild(box(450, 90, 60, 50, BG, SOFT));
    var lamp = svgEl('circle', { cx: 480, cy: 115, r: 9, fill: SOFT });
    lamp.appendChild(anim('fill', SOFT + ';' + SOFT + ';' + BP + ';' + BP, '5s'));
    svg.appendChild(lamp);
    var lampTxt = txt(480, 160, 'cold', 8, MUTE);
    svg.appendChild(lampTxt);
    var warmTxt = txt(480, 75, 'serving', 8, BP);
    warmTxt.appendChild(anim('opacity', '0;0;0;1;1', '5s'));
    svg.appendChild(warmTxt);
    // 各层级之间的 active dash link
    [[130, 180], [280, 330], [430, 450]].forEach(function (seg) {
      var p = svgEl('path', { d: 'M' + seg[0] + ' 115 L' + seg[1] + ' 115', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-dasharray': '4 4' });
      p.appendChild(anim('stroke-dashoffset', '16;0', '0.7s'));
      svg.appendChild(p);
    });
    // 通过分层 pipeline 流式传输的 weight blocks
    var i;
    for (i = 0; i < 4; i++) {
      var blk = svgEl('rect', { x: -9, y: -7, width: 18, height: 14, rx: 2, fill: BP, opacity: 0.85 });
      blk.appendChild(motion('M80 115 L130 115 L180 115 L280 115 L330 115 L430 115 L480 115', '5s', (i * 1.0) + 's'));
      svg.appendChild(blk);
    }
    svg.appendChild(txt(255, 215, '分层加载：NVMe → DRAM → HBM，随后 replica 开始 serving', 9, MUTE));
    shell(host, 'COLD-START PIPELINE', 'weights 流经多个层级，直至 cold replica 进入 warm 状态', svg,
      '缩容至零的 replica 必须等到 weights 驻留在 HBM 后才能响应。cold-start 预算是节点配置、weights 下载、加载至 HBM 以及 engine 初始化时间的总和——对于 70B Model，这可能需要数分钟，而 SLA 只有两秒。分层加载通过 NVMe→DRAM→HBM 流式传输 weights，warm pool 则保持 min_workers>0，以空闲 GPU 成本换取消失的 cold-start 长尾。');
  }

  // ── model-cascade-router：优先使用廉价 Model，置信度低时升级 ──────────
  // 16-model-routing
  function modelCascadeRouter(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(box(30, 95, 56, 40, BG, INK));
    svg.appendChild(txt(58, 112, 'broker', 9, INK));
    svg.appendChild(txt(58, 125, '置信度？', 8, MUTE));
    // 廉价 Model（上方，承载大部分流量）和 frontier Model（下方，处理升级请求）
    svg.appendChild(box(380, 40, 110, 44, BG, BP));
    svg.appendChild(txt(435, 58, '廉价 Model', 9, BP));
    svg.appendChild(txt(435, 72, '70% · $0.25/M', 8, MUTE));
    svg.appendChild(box(380, 150, 110, 44, BG, WARN));
    svg.appendChild(txt(435, 168, 'frontier Model', 9, WARN));
    svg.appendChild(txt(435, 182, '30% · $10/M', 8, MUTE));
    svg.appendChild(svgEl('path', { d: 'M86 110 L376 62', fill: 'none', stroke: BP, 'stroke-width': 1.6 }));
    var esc = svgEl('path', { d: 'M86 120 L376 172', fill: 'none', stroke: WARN, 'stroke-width': 1.4, 'stroke-dasharray': '5 4' });
    esc.appendChild(anim('stroke-dashoffset', '18;0', '1s'));
    svg.appendChild(esc);
    // 7 个请求进入，大部分发往廉价 Model（蓝色），少数升级（警示色）
    var i;
    for (i = 0; i < 7; i++) {
      var esc2 = i % 3 === 0;
      var g = svgEl('g', {}, [svgEl('circle', { cx: 0, cy: 0, r: 5, fill: esc2 ? WARN : BP })]);
      var path = esc2 ? 'M-20 115 L58 115 L435 172' : 'M-20 115 L58 115 L435 62';
      g.appendChild(motion(path, '2.6s', (i * 0.34) + 's'));
      svg.appendChild(g);
    }
    svg.appendChild(txt(260, 220, '混合成本 ≈ 0.7·廉价 Model + 0.3·frontier Model', 9, MUTE));
    shell(host, 'MODEL CASCADE ROUTER', '优先使用廉价 Model，将困难请求升级', svg,
      'broker 会为每个请求评分——任务类型、长度、置信度——并将较为简单的大多数请求发送给廉价 Model。只有低置信度请求才会沿虚线路径升级到 frontier Model。大多数流量只需几美分；在质量相同的情况下，混合账单可降低 20-60%。风险在于廉价 Model 可能发生无声漂移，而这只能通过在线 quality gate 发现。');
  }

  // ── prefill-decode-split：两个 pool，通过 NIXL 移交 KV cache ──────────
  // 17-disaggregated-prefill-decode
  function prefillDecodeSplit(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(box(60, 50, 130, 130, BG, BP));
    svg.appendChild(txt(125, 40, 'PREFILL POOL', 9, BP));
    svg.appendChild(txt(125, 70, '受 compute 限制', 8, MUTE));
    svg.appendChild(box(330, 50, 130, 130, BG, WARN));
    svg.appendChild(txt(395, 40, 'DECODE POOL', 9, WARN));
    svg.appendChild(txt(395, 70, '受 memory 限制', 8, MUTE));
    // 执行密集计算的 prefill GPU（fill 脉动）和持续流式处理的 decode GPU
    var i, gx, gy;
    for (i = 0; i < 4; i++) {
      gx = 80 + (i % 2) * 55; gy = 95 + Math.floor(i / 2) * 45;
      var pg = svgEl('rect', { x: gx, y: gy, width: 40, height: 30, rx: 3, fill: BP, opacity: 0.25 });
      pg.appendChild(anim('opacity', '0.2;0.7;0.2', '1.3s', { begin: (i * 0.2) + 's' }));
      svg.appendChild(pg);
    }
    for (i = 0; i < 4; i++) {
      gx = 350 + (i % 2) * 55; gy = 95 + Math.floor(i / 2) * 45;
      svg.appendChild(svgEl('rect', { x: gx, y: gy, width: 40, height: 30, rx: 3, fill: WARN, opacity: 0.22 }));
    }
    // KV cache block 通过 NIXL link 传输
    var link = svgEl('path', { d: 'M190 115 L330 115', fill: 'none', stroke: INK, 'stroke-width': 1.4, 'stroke-dasharray': '4 4' });
    link.appendChild(anim('stroke-dashoffset', '16;0', '0.7s'));
    svg.appendChild(link);
    svg.appendChild(txt(260, 108, 'NIXL', 8, INK));
    for (i = 0; i < 3; i++) {
      var kv = svgEl('rect', { x: -10, y: -7, width: 16, height: 14, rx: 2, fill: INK });
      kv.appendChild(motion('M190 115 L330 115', '1.6s', (i * 0.55) + 's'));
      svg.appendChild(kv);
    }
    svg.appendChild(txt(260, 200, 'KV cache 从 prefill 传输到 decode', 9, INK));
    svg.appendChild(txt(260, 216, '每个 pool 都根据自身瓶颈确定规模', 9, MUTE));
    shell(host, 'PREFILL / DECODE SPLIT', '两个 pool，在它们之间移交 KV cache', svg,
      'prefill 受 compute 限制；decode 受 memory 限制。将两者放在同一块 GPU 上，会浪费当前阶段未使用的那类资源。解耦方案运行独立的 pool，分别根据各自的瓶颈确定规模，并通过高带宽 NIXL link 传输 KV cache。对于长 Prompt，这种方式很划算；对于短 Prompt，传输成本则得不偿失。');
  }

  // ── batch-lane-triage：workload 分入不同 lane，batch 在夜间排空 ──
  // 15-batch-apis
  function batchLaneTriage(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var lanes = [
      { y: 45, t: '交互式', s: '同步 · 全价', c: WARN },
      { y: 110, t: '半交互式', s: '异步队列', c: MUTE },
      { y: 175, t: 'batch', s: '五折 · 约 24 小时', c: BP }
    ];
    lanes.forEach(function (ln) {
      svg.appendChild(svgEl('line', { x1: 150, y1: ln.y, x2: 470, y2: ln.y, stroke: ln.c, 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.6 }));
      svg.appendChild(txt(95, ln.y - 4, ln.t, 9, ln.c));
      svg.appendChild(txt(95, ln.y + 9, ln.s, 7, MUTE));
    });
    svg.appendChild(box(140, 100, 30, 50, BG, INK));
    svg.appendChild(txt(155, 90, '分流', 8, INK));
    // job 进入后，大多数落入 batch lane（蓝色），少数进入交互式 lane（警示色）
    var spec = [
      { c: WARN, y: 45, b: '0s' }, { c: BP, y: 175, b: '0.5s' }, { c: BP, y: 175, b: '1.0s' },
      { c: MUTE, y: 110, b: '1.5s' }, { c: BP, y: 175, b: '2.0s' }, { c: BP, y: 175, b: '2.6s' }
    ];
    spec.forEach(function (s) {
      var g = svgEl('g', {}, [svgEl('rect', { x: -6, y: -6, width: 12, height: 12, rx: 2, fill: s.c })]);
      g.appendChild(motion('M-20 115 L155 115 L155 ' + s.y + ' L460 ' + s.y, '3.4s', s.b));
      svg.appendChild(g);
    });
    // batch lane 在夜间排空：fill bar 向右扫过后重置
    var drain = svgEl('rect', { x: 150, y: 188, width: 0, height: 4, fill: BP, opacity: 0.5 });
    drain.appendChild(anim('width', '0;320;320;0', '5s'));
    svg.appendChild(drain);
    svg.appendChild(txt(310, 215, '如果不需要交互，就应该进入 batch', 9, BP));
    shell(host, 'BATCH LANE TRIAGE', '将 workload 分入不同 lane；batch lane 在夜间排空', svg,
      '每个新的 LLM workload 都会被分流到三条 lane。交互式 workload 保持同步并按全价计费；半交互式 workload 进入异步队列；所有能容忍 24 小时延迟的 workload 都进入五折的 batch lane，再叠加 cached input，成本可降至同步执行的约 10%。大多数自称需要实时处理的 job，其实只需要在第二天早晨前得到答案。');
  }

  // ── semantic-cache-hit：相似 Prompt 由 cache 提供，冷请求则交给 LLM ───────
  // 14-prompt-semantic-caching
  function semanticCacheHit(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(box(150, 95, 70, 44, BG, INK));
    svg.appendChild(txt(185, 113, 'cache', 9, INK));
    svg.appendChild(txt(185, 127, 'Embedding', 8, MUTE));
    svg.appendChild(box(390, 40, 100, 40, BG, WARN));
    svg.appendChild(txt(440, 58, 'LLM（cold）', 9, WARN));
    svg.appendChild(txt(440, 72, '慢 · $$$', 8, MUTE));
    svg.appendChild(box(390, 150, 100, 40, BG, BP));
    svg.appendChild(txt(440, 168, 'cache hit', 9, BP));
    svg.appendChild(txt(440, 182, '快 · 约 $0', 8, MUTE));
    // hit path（近且快）与 miss path（远，通往 LLM）对比
    var hit = svgEl('path', { d: 'M220 120 L388 170', fill: 'none', stroke: BP, 'stroke-width': 2, 'stroke-dasharray': '6 4' });
    hit.appendChild(anim('stroke-dashoffset', '20;0', '0.6s'));
    svg.appendChild(hit);
    svg.appendChild(svgEl('path', { d: 'M220 110 L388 60', fill: 'none', stroke: SOFT, 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }));
    // query 流入；相似 query（蓝色）命中，新的 query（警示色）未命中并前往 LLM
    var spec = [{ c: BP, p: 'M-20 117 L185 117 L440 170', b: '0s' }, { c: BP, p: 'M-20 117 L185 117 L440 170', b: '0.9s' }, { c: WARN, p: 'M-20 117 L185 117 L440 60', b: '1.8s' }, { c: BP, p: 'M-20 117 L185 117 L440 170', b: '2.7s' }];
    spec.forEach(function (s) {
      var g = svgEl('g', {}, [svgEl('circle', { cx: 0, cy: 0, r: 5, fill: s.c })]);
      g.appendChild(motion(s.p, '3.6s', s.b));
      svg.appendChild(g);
    });
    svg.appendChild(txt(260, 215, '相似度 ≥ 阈值 → 由 cache 提供，跳过 LLM', 9, MUTE));
    shell(host, 'SEMANTIC CACHE', '相似 Prompt 由 cache 提供，新的 Prompt 才会到达 LLM', svg,
      'L1 semantic caching 会对每个 Prompt 生成 Embedding，并检查它与历史条目的相似度。近似重复的 query（蓝色）会直接由 cache 提供——速度快且几乎免费。只有真正新的 Prompt（橙色）才会 cache miss，并继续到达 cold LLM。在开放式聊天中，hit rate 约为 10%；在结构化 FAQ 中可达 70%。prefix 中的动态文本会使其骤降至接近零。');
  }

  // ── edge-bandwidth-pipe：Token 通过狭窄的移动端 pipe 与宽阔的 HBM ────
  // 12-edge-inference
  function edgeBandwidthPipe(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    // 数据中心：宽 pipe，大量 Token
    svg.appendChild(txt(120, 36, '数据中心 HBM3 · 约 3 TB/s', 9, BP));
    svg.appendChild(svgEl('rect', { x: 40, y: 50, width: 160, height: 44, rx: 4, fill: 'none', stroke: BP, 'stroke-width': 2 }));
    svg.appendChild(txt(245, 75, '→ 约 830 tok/s', 9, BP, 'start'));
    var i;
    for (i = 0; i < 8; i++) {
      var d = svgEl('circle', { cx: 0, cy: 0, r: 4, fill: BP });
      d.appendChild(motion('M40 72 L200 72', '0.9s', (i * 0.11) + 's'));
      svg.appendChild(d);
    }
    // 边缘端：狭窄 pipe，少量 Token 缓慢流出
    svg.appendChild(txt(120, 130, '移动端 DRAM · 约 50-90 GB/s', 9, WARN));
    svg.appendChild(svgEl('rect', { x: 90, y: 150, width: 60, height: 14, rx: 3, fill: 'none', stroke: WARN, 'stroke-width': 2 }));
    svg.appendChild(txt(245, 162, '→ 约 14-25 tok/s', 9, WARN, 'start'));
    for (i = 0; i < 3; i++) {
      var s = svgEl('circle', { cx: 0, cy: 0, r: 4, fill: WARN });
      s.appendChild(motion('M90 157 L150 157', '1.6s', (i * 0.6) + 's'));
      svg.appendChild(s);
    }
    svg.appendChild(txt(260, 205, 'decode 会为每个 Token 读取所有 weight——带宽决定上限', 9, MUTE));
    svg.appendChild(txt(260, 221, 'compute 次之；pipe 宽度决定 tok/s', 9, MUTE));
    shell(host, 'EDGE BANDWIDTH CEILING', 'Token 分别流经宽阔的数据中心 pipe 和狭窄的移动端 pipe', svg,
      'decode 会为每个 Token 读取完整的 weights，因此上限由 memory bandwidth 决定，而不是 compute。接近 3 TB/s 的数据中心 HBM3 能在约一毫秒内完成 weights 读取，每秒可处理数百个 Token。50-90 GB/s 的移动端 DRAM，其 pipe 要窄 30-50 倍，因此无论有多少 NPU compute 处于空闲状态，同一 Model 都只能以 14-25 tok/s 的速度缓慢输出。');
  }

  // ── load-pattern-waves：steady / ramp / spike / soak 请求波形 ─────────
  // 22-load-testing-llm-apis
  function loadPatternWaves(host) {
    var state = { pat: 'spike' };
    var W = 520, H = 230, PAD = 36;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var dur = 6;
    function shape(pat) {
      // 在整个周期中采样的 bar 高度值（0..1），以及 server 标签
      if (pat === 'steady') return { h: '0.55;0.55;0.55;0.55;0.55', note: '恒定速率——基准吞吐量' };
      if (pat === 'ramp') return { h: '0.1;0.35;0.6;0.85;1', note: '负载攀升——寻找临界点' };
      if (pat === 'spike') return { h: '0.2;0.2;1;1;0.2', note: '突发激增——测试 autoscaling 响应' };
      return { h: '0.6;0.6;0.6;0.6;0.6', note: '持续数小时——暴露 memory leak（soak）' };
    }
    var note = txt(260, 215, '', 9, MUTE);
    var bars = svgEl('g', {});
    var sat = txt(260, 36, '', 10, BP);
    function build() {
      while (bars.firstChild) bars.removeChild(bars.firstChild);
      var sp = shape(state.pat);
      var hv = sp.h.split(';');
      var n = 14, i;
      for (i = 0; i < n; i++) {
        var bx = PAD + i * ((W - 2 * PAD) / n) + 3;
        var bw = (W - 2 * PAD) / n - 6;
        // 为每个 bar 设置 phase offset，使波形从左向右移动
        var off = (i / n) * dur;
        var b = svgEl('rect', { x: bx, y: H - PAD, width: bw, height: 4, fill: i % 2 ? BP : MUTE, opacity: 0.85 });
        // 将高度缩放到像素值（最大约 140）
        var hpx = hv.map(function (v) { return (Number(v) * 140).toFixed(0); }).join(';');
        var ypx = hv.map(function (v) { return (H - PAD - Number(v) * 140).toFixed(0); }).join(';');
        b.appendChild(svgEl('animate', { attributeName: 'height', values: hpx, dur: dur + 's', repeatCount: 'indefinite', begin: (-off) + 's' }));
        b.appendChild(svgEl('animate', { attributeName: 'y', values: ypx, dur: dur + 's', repeatCount: 'indefinite', begin: (-off) + 's' }));
        bars.appendChild(b);
      }
      note.textContent = sp.note;
      sat.textContent = state.pat.toUpperCase() + ' 模式';
    }
    svg.appendChild(svgEl('line', { x1: PAD, y1: H - PAD, x2: W - PAD, y2: H - PAD, stroke: SOFT, 'stroke-width': 1 }));
    svg.appendChild(bars);
    svg.appendChild(sat);
    svg.appendChild(note);
    state._render = build;
    var ctrl = select(state, 'pat', '负载模式', [['spike', 'spike'], ['steady-state', 'steady'], ['ramp', 'ramp'], ['soak', 'soak']]);
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, ['LOAD PATTERNS']), el('span', {}, ['选择一种模式'])]),
      el('div', { class: 'lf-body' }, [el('div', {}, [ctrl]), el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, ['四种负载形态可捕获四类故障。steady-state 用于测量基准吞吐量；ramp 持续攀升直至临界点；spike 突然激增，用于测试 autoscaling 的响应速度；soak 将负载维持数小时，以暴露 memory leak。如果每个请求都完全相同，通用测试工具同样会产生误导——真实流量需要可变的输入长度和多样化的 prefix。'])
    ]));
    build();
  }

  LF.register({
    'cache-aware-router': cacheAwareRouter,
    'cold-start-pipeline': coldStartLayers,
    'model-cascade-router': modelCascadeRouter,
    'prefill-decode-split': prefillDecodeSplit,
    'batch-lane-triage': batchLaneTriage,
    'semantic-cache-hit': semanticCacheHit,
    'edge-bandwidth-pipe': edgeBandwidthPipe,
    'load-pattern-waves': loadPatternWaves
  });
})();
