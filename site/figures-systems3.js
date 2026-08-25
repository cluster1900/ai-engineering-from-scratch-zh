/* figures-systems3.js — 用于 Phase 6（语音/音频）、Phase 8（生成式 AI）、
   Phase 11（LLM 工程）、Phase 12（Multimodal）和 Phase 13（Tool 与协议）
   的动画课程图示。在 lesson-figures.js 之后加载，使用共享 LF 工具包，
   并通过 LF.register 注册。这些是由 SMIL 驱动的 SVG 动画：
   <animate>/<animateTransform>/<animateMotion>/stroke-dashoffset 负责驱动
   动画，无需 JS 渲染循环。无依赖，仅使用 ES5，通过 CSS 变量适配主题。
   编写方式与 docs/en.md 中 fenced ```figure block 相同。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  // 包含 SVG 和说明文字的卡片外壳。H 是 svg viewBox 的高度。
  function shell(host, label, hint, svg, cap) {
    host.appendChild(el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [cap])
    ]));
  }
  function newSvg(H) { return svgEl('svg', { viewBox: '0 0 520 ' + H }); }
  var BP = 'var(--blueprint,#3553ff)', MUTE = 'var(--ink-mute,#999)', SOFT = 'var(--rule-soft,#ddd)', WARN = 'var(--warn,#b8870f)', INK = 'var(--ink-soft,#555)';
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function aTransform(type, vals, dur, extra) {
    var a = { attributeName: 'transform', type: type, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animateTransform', a);
  }
  function txt(x, y, s, size, fill, anchor) {
    return svgEl('text', { x: x, y: y, 'font-size': size || 10, 'font-family': 'monospace', fill: fill || INK, 'text-anchor': anchor || 'start' }, [document.createTextNode(s)]);
  }

  // ── masked-diffusion-unmask (Show-o)：带 mask 的网格分步骤填充 ───────────
  function maskedDiffusion(host) {
    var svg = newSvg(240);
    var n = 6, cell = 26, ox = 150, oy = 26;
    // 确定性的 mask 移除顺序（置信度式螺旋），36 个单元分 9 波完成
    var order = [14, 15, 20, 21, 13, 16, 19, 22, 8, 9, 10, 11, 26, 27, 28, 29, 7, 12, 25, 30, 2, 3, 4, 5, 1, 6, 24, 31, 0, 17, 18, 23, 32, 33, 34, 35];
    var WAVES = 6, total = n * n, per = total / WAVES, cyc = 6; // 秒
    for (var i = 0; i < total; i++) {
      var r = Math.floor(i / n), c = i % n;
      var wave = Math.floor(order.indexOf(i) / per);
      var begin = (wave / WAVES * cyc).toFixed(2) + 's';
      var g = svgEl('g', {});
      // 带 mask 的 tile（灰色）淡出，内容 tile（蓝色）淡入
      g.appendChild(svgEl('rect', { x: ox + c * cell, y: oy + r * cell, width: cell - 2, height: cell - 2, fill: 'var(--bg-surface,#eee)', stroke: SOFT, 'stroke-width': '0.5' }, [
        anim('fill-opacity', '1;1;0;0', cyc + 's', { keyTimes: '0;' + (wave / WAVES).toFixed(3) + ';' + ((wave + 0.7) / WAVES).toFixed(3) + ';1' })
      ]));
      g.appendChild(svgEl('rect', { x: ox + c * cell, y: oy + r * cell, width: cell - 2, height: cell - 2, fill: BP, 'fill-opacity': '0', stroke: SOFT, 'stroke-width': '0.5' }, [
        anim('fill-opacity', '0;0;' + (0.3 + 0.5 * ((r + c) % 2)).toFixed(2) + ';' + (0.3 + 0.5 * ((r + c) % 2)).toFixed(2), cyc + 's', { keyTimes: '0;' + (wave / WAVES).toFixed(3) + ';' + ((wave + 0.7) / WAVES).toFixed(3) + ';1' })
      ]));
      svg.appendChild(g);
    }
    svg.appendChild(txt(20, 40, '文本：', 11, INK));
    // 左侧的文本 Token 流，以从左到右的方式生成（causal）
    for (var t = 0; t < 5; t++) {
      svg.appendChild(svgEl('rect', { x: 20, y: 56 + t * 26, width: 100, height: 18, rx: 2, fill: BP, 'fill-opacity': '0' }, [
        anim('fill-opacity', '0;0.7;0.7', '6s', { keyTimes: '0;' + (t / 8 + 0.02).toFixed(3) + ';1' })
      ]));
    }
    svg.appendChild(txt(ox, oy - 8, '图像：并行移除 mask', 10, MUTE));
    svg.appendChild(txt(20, 200, 'causal NTP', 10, MUTE));
    shell(host, 'SHOW-O UNIFIED', '文本从左到右 · 图像并行移除 mask', svg,
      '文本 Token 通过 next-token prediction 从左到右逐个生成。图像 Token 起初全部带有 mask，并以并行方式恢复：每一步同时预测所有带 mask 的单元，保留置信度最高的结果，并为其余单元重新添加 mask。经过几轮后，整幅图像便会完成填充，所需步骤远少于 autoregressive 图像解码。');
  }

  // ── any-to-any-stream (MIO)：四种 modality 的 Token 合并为一个流 ────────
  function anyToAny(host) {
    var svg = newSvg(240);
    var mods = [
      { y: 30, label: '文本', col: BP },
      { y: 78, label: '图像', col: WARN },
      { y: 126, label: '语音', col: BP },
      { y: 174, label: '音乐', col: MUTE }
    ];
    var laneX = 24, mergeX = 250, outX = 470;
    // 中间的单个 Transformer block
    svg.appendChild(svgEl('rect', { x: mergeX, y: 60, width: 90, height: 110, rx: 4, fill: 'var(--bg-surface,#eee)', stroke: SOFT, 'stroke-width': '1' }));
    svg.appendChild(txt(mergeX + 45, 122, '单个', 11, INK, 'middle'));
    svg.appendChild(txt(mergeX + 45, 138, 'Transformer', 11, INK, 'middle'));
    mods.forEach(function (m, mi) {
      svg.appendChild(txt(laneX, m.y + 4, m.label, 11, m.col));
      // 四个 Token 方块沿路径流入 Transformer，再从中流出
      var pIn = 'M ' + (laneX + 56) + ' ' + m.y + ' L ' + (mergeX - 6) + ' ' + (m.y < 100 ? 90 : 140);
      for (var k = 0; k < 3; k++) {
        var sq = svgEl('rect', { x: -5, y: -5, width: 10, height: 10, rx: 2, fill: m.col, 'fill-opacity': '0.8' });
        var mo = svgEl('animateMotion', { dur: '3s', repeatCount: 'indefinite', path: pIn, begin: (mi * 0.2 + k * 1).toFixed(2) + 's' });
        sq.appendChild(mo);
        sq.appendChild(anim('fill-opacity', '0;0.85;0', '3s', { begin: (mi * 0.2 + k * 1).toFixed(2) + 's' }));
        svg.appendChild(sq);
      }
    });
    // 输出流：不同 modality 的 Token 在单条通道中交替流出
    var outCols = [BP, WARN, BP, MUTE, BP];
    var pOut = 'M ' + (mergeX + 90) + ' 115 L ' + outX + ' 115';
    for (var o = 0; o < 5; o++) {
      var os = svgEl('rect', { x: -6, y: -6, width: 12, height: 12, rx: 2, fill: outCols[o], 'fill-opacity': '0.85' });
      os.appendChild(svgEl('animateMotion', { dur: '2.5s', repeatCount: 'indefinite', path: pOut, begin: (o * 0.5).toFixed(2) + 's' }));
      os.appendChild(anim('fill-opacity', '0;0.9;0', '2.5s', { begin: (o * 0.5).toFixed(2) + 's' }));
      svg.appendChild(os);
    }
    svg.appendChild(txt(outX - 30, 100, '任意输出', 10, MUTE, 'middle'));
    shell(host, 'ANY-TO-ANY STREAM', '四种 modality → 一个 shared vocabulary', svg,
      '文本、图像、语音和音乐分别被转换为同一个 shared vocabulary 中的 Token，再交错组成一个序列，供单个 causal Transformer 使用。由于每种 modality 都只是 Token，Model 可以输出任意 modality，解码流会交替生成不同类型的 Token，并以足以支持对话的速度流式输出。');
  }

  // ── video-diffusion-denoise (Sora-style)：带噪帧序列逐渐变清晰 ───────────
  function videoDenoise(host) {
    var svg = newSvg(220);
    var fw = 90, fh = 64, gap = 10, oy = 40, ox = 16, frames = 5;
    svg.appendChild(txt(ox, 28, 'spatiotemporal patch 在 T 步中完成去噪', 10, MUTE));
    for (var f = 0; f < frames; f++) {
      var fx = ox + f * (fw + gap);
      var g = svgEl('g', {});
      // 帧边框
      g.appendChild(svgEl('rect', { x: fx, y: oy, width: fw, height: fh, fill: 'none', stroke: SOFT, 'stroke-width': '1' }));
      // 噪声斑点层逐渐淡出
      var noise = svgEl('g', {});
      for (var s = 0; s < 10; s++) {
        var nx = fx + 6 + (s * 17 % (fw - 12));
        var ny = oy + 6 + ((s * 23) % (fh - 12));
        noise.appendChild(svgEl('rect', { x: nx, y: ny, width: 6, height: 6, fill: MUTE, 'fill-opacity': '0.7' }));
      }
      noise.appendChild(anim('opacity', '1;0', '5s', { begin: (f * 0.4).toFixed(2) + 's' }));
      g.appendChild(noise);
      // 清晰形状（移动的小球表示时间一致性）逐渐淡入，并在各帧之间移动
      var cy = oy + fh / 2 + (f - 2) * 4;
      var ball = svgEl('circle', { cx: fx + 20 + f * 12, cy: cy, r: 12, fill: BP, 'fill-opacity': '0' });
      ball.appendChild(anim('fill-opacity', '0;0.8', '5s', { begin: (f * 0.4).toFixed(2) + 's' }));
      g.appendChild(ball);
      svg.appendChild(g);
      if (f < frames - 1) {
        svg.appendChild(svgEl('line', { x1: fx + fw, y1: oy + fh / 2, x2: fx + fw + gap, y2: oy + fh / 2, stroke: SOFT, 'stroke-width': '1', 'stroke-dasharray': '2 2' }));
      }
    }
    svg.appendChild(txt(ox, oy + fh + 24, '第 1 帧', 9, MUTE));
    svg.appendChild(txt(ox + (frames - 1) * (fw + gap), oy + fh + 24, '第 ' + frames + ' 帧', 9, MUTE));
    shell(host, 'VIDEO DIFFUSION', '噪声 → 连贯运动', svg,
      '3-D VAE 将视频片段压缩为 spatiotemporal patch，再由 Diffusion Transformer 对其去噪。灰色斑点是 Model 逐步移除的噪声；蓝色形状逐渐显现并在各帧之间移动，表示网络必须建模的时间一致性，即让同一对象、光照和运动在整个帧序列中保持一致。');
  }

  // ── inpaint-mask-reinject：重新生成 mask 区域，同时固定 Context ──────────
  function inpaint(host) {
    var svg = newSvg(230);
    var ix = 140, iy = 30, iw = 240, ih = 168;
    // 外部图像（保留的 Context）— 使用柔和填充
    svg.appendChild(svgEl('rect', { x: ix, y: iy, width: iw, height: ih, fill: BP, 'fill-opacity': '0.14', stroke: SOFT, 'stroke-width': '1' }));
    svg.appendChild(txt(ix + 8, iy + 18, '保留的 Context（每一步重新注入）', 10, INK));
    // mask 区域
    var mx = ix + 70, my = iy + 56, mw = 100, mh = 84;
    var maskRect = svgEl('rect', { x: mx, y: my, width: mw, height: mh, fill: 'var(--bg-surface,#eee)', stroke: WARN, 'stroke-width': '1.5', 'stroke-dasharray': '5 3' });
    svg.appendChild(maskRect);
    // 虚线沿 mask 边界移动
    svg.appendChild(svgEl('rect', { x: mx, y: my, width: mw, height: mh, fill: 'none', stroke: WARN, 'stroke-width': '1.5', 'stroke-dasharray': '5 3' }, [
      anim('stroke-dashoffset', '0;-16', '1s')
    ]));
    // mask 内重新生成的内容：噪声逐渐变为清晰的蓝色填充
    var noise = svgEl('g', {});
    for (var s = 0; s < 12; s++) {
      noise.appendChild(svgEl('rect', { x: mx + 6 + (s * 13 % (mw - 12)), y: my + 6 + ((s * 19) % (mh - 12)), width: 7, height: 7, fill: MUTE, 'fill-opacity': '0.7' }));
    }
    noise.appendChild(anim('opacity', '1;1;0;0', '4s', { keyTimes: '0;0.15;0.75;1' }));
    svg.appendChild(noise);
    var fill = svgEl('rect', { x: mx + 4, y: my + 4, width: mw - 8, height: mh - 8, fill: BP, 'fill-opacity': '0' }, [
      anim('fill-opacity', '0;0;0.7;0.7', '4s', { keyTimes: '0;0.15;0.75;1' })
    ]);
    svg.appendChild(fill);
    svg.appendChild(txt(mx + mw / 2, my + mh + 18, '仅在此处重新生成', 10, WARN, 'middle'));
    // 侧边标签
    svg.appendChild(txt(18, 110, '仅在', 11, INK));
    svg.appendChild(txt(18, 126, 'mask 内', 11, INK));
    svg.appendChild(txt(18, 142, '去噪', 11, INK));
    shell(host, 'INPAINTING', '在 mask 内去噪，其余部分保持不变', svg,
      'Inpainting 仅对 mask 区域去噪，同时在每一步重新注入已知像素，使边界保持一致。移动的虚线表示 mask 边缘；其中的噪声逐渐变成新内容，而周围的 Context 始终固定，并保持像素级一致。');
  }

  // ── agentic-rag-loop：retrieve → reason → act 循环 ────────────────────────
  function agenticRag(host) {
    var svg = newSvg(240);
    var cx = 260, cy = 128, R = 78;
    var nodes = [
      { a: -90, label: 'retrieve', col: BP },
      { a: 30, label: 'reason', col: WARN },
      { a: 150, label: 'act / refine', col: BP }
    ];
    // 环形箭头轨道
    svg.appendChild(svgEl('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: SOFT, 'stroke-width': '1.5', 'stroke-dasharray': '6 6' }, [
      anim('stroke-dashoffset', '0;-48', '2s')
    ]));
    var pos = [];
    nodes.forEach(function (nd) {
      var rad = nd.a * Math.PI / 180;
      var x = cx + R * Math.cos(rad), y = cy + R * Math.sin(rad);
      pos.push([x, y]);
      svg.appendChild(svgEl('circle', { cx: x, cy: y, r: 30, fill: nd.col, 'fill-opacity': '0.18', stroke: nd.col, 'stroke-width': '1.5' }, [
        anim('stroke-opacity', '0.3;1;0.3', '6s', { begin: (nodes.indexOf(nd) * 2).toFixed(1) + 's' })
      ]));
      svg.appendChild(txt(x, y + 4, nd.label, 10, INK, 'middle'));
    });
    // 一个 query Token 沿循环轨道运行
    var orbit = 'M ' + pos[0][0] + ' ' + pos[0][1] + ' A ' + R + ' ' + R + ' 0 0 1 ' + pos[1][0] + ' ' + pos[1][1] +
      ' A ' + R + ' ' + R + ' 0 0 1 ' + pos[2][0] + ' ' + pos[2][1] +
      ' A ' + R + ' ' + R + ' 0 0 1 ' + pos[0][0] + ' ' + pos[0][1];
    var tok = svgEl('circle', { r: 7, fill: WARN });
    tok.appendChild(svgEl('animateMotion', { dur: '6s', repeatCount: 'indefinite', path: orbit, rotate: 'auto' }));
    svg.appendChild(tok);
    // 左侧 corpus 为 retrieve 提供数据
    svg.appendChild(txt(30, 60, 'corpus', 10, MUTE));
    for (var d = 0; d < 4; d++) {
      svg.appendChild(svgEl('rect', { x: 30, y: 70 + d * 18, width: 60, height: 12, rx: 1, fill: BP, 'fill-opacity': (0.25 + d * 0.12).toFixed(2) }));
    }
    svg.appendChild(txt(cx, 22, 'agentic RAG：循环直至答案有据可依', 10, MUTE, 'middle'));
    shell(host, 'AGENTIC RAG', 'retrieve → reason → act → 重复', svg,
      '基础 RAG 只执行一次 retrieve，然后给出答案。Agentic RAG 会循环执行：retrieve 候选内容，reason 这些内容是否真正回答了 query，然后 act，即重写 query、重新排序或再次 retrieve。沿轨道运行的 Token 表示一个 query 在循环中不断处理，直到 Context 足以支持回答，这正是 multi-hop 问题所需要的过程。');
  }

  // ── mcp-nxm-collapse：N 个 host × M 个 server → 一个协议 hub ─────────────
  function mcpMatrix(host) {
    var svg = newSvg(250);
    var hosts = ['Claude', 'ChatGPT', 'Cursor'];
    var servers = ['db', 'calendar', 'files'];
    var hubX = 260, hubY = 125;
    // hub
    svg.appendChild(svgEl('circle', { cx: hubX, cy: hubY, r: 26, fill: BP, 'fill-opacity': '0.18', stroke: BP, 'stroke-width': '1.5' }));
    svg.appendChild(txt(hubX, hubY + 4, 'MCP', 11, BP, 'middle'));
    var hy = [50, 125, 200], sy = [50, 125, 200];
    hosts.forEach(function (h, i) {
      var hx = 40;
      svg.appendChild(svgEl('rect', { x: hx, y: hy[i] - 14, width: 76, height: 28, rx: 3, fill: 'var(--bg-surface,#eee)', stroke: SOFT, 'stroke-width': '1' }));
      svg.appendChild(txt(hx + 38, hy[i] + 4, h, 10, INK, 'middle'));
      svg.appendChild(svgEl('line', { x1: hx + 76, y1: hy[i], x2: hubX - 26, y2: hubY, stroke: SOFT, 'stroke-width': '1', 'stroke-dasharray': '5 4' }, [
        anim('stroke-dashoffset', '0;-18', '1.2s', { begin: (i * 0.3).toFixed(1) + 's' })
      ]));
      // request packet 从 host → hub
      var pkt = svgEl('circle', { r: 5, fill: BP });
      pkt.appendChild(svgEl('animateMotion', { dur: '2.4s', repeatCount: 'indefinite', path: 'M ' + (hx + 76) + ' ' + hy[i] + ' L ' + (hubX - 26) + ' ' + hubY, begin: (i * 0.4).toFixed(1) + 's' }));
      pkt.appendChild(anim('opacity', '0;1;0', '2.4s', { begin: (i * 0.4).toFixed(1) + 's' }));
      svg.appendChild(pkt);
    });
    servers.forEach(function (sv, i) {
      var sx = 404;
      svg.appendChild(svgEl('rect', { x: sx, y: sy[i] - 14, width: 76, height: 28, rx: 3, fill: 'var(--bg-surface,#eee)', stroke: SOFT, 'stroke-width': '1' }));
      svg.appendChild(txt(sx + 38, sy[i] + 4, sv, 10, INK, 'middle'));
      svg.appendChild(svgEl('line', { x1: hubX + 26, y1: hubY, x2: sx, y2: sy[i], stroke: SOFT, 'stroke-width': '1', 'stroke-dasharray': '5 4' }, [
        anim('stroke-dashoffset', '0;-18', '1.2s', { begin: (i * 0.3 + 0.6).toFixed(1) + 's' })
      ]));
      var pkt2 = svgEl('circle', { r: 5, fill: WARN });
      pkt2.appendChild(svgEl('animateMotion', { dur: '2.4s', repeatCount: 'indefinite', path: 'M ' + (hubX + 26) + ' ' + hubY + ' L ' + sx + ' ' + sy[i], begin: (i * 0.4 + 1).toFixed(1) + 's' }));
      pkt2.appendChild(anim('opacity', '0;1;0', '2.4s', { begin: (i * 0.4 + 1).toFixed(1) + 's' }));
      svg.appendChild(pkt2);
    });
    svg.appendChild(txt(40, 232, 'N 个 host', 10, MUTE));
    svg.appendChild(txt(404, 232, 'M 个 server', 10, MUTE));
    shell(host, 'MCP COLLAPSES N×M', '一个协议，让每个 host ↔ 每个 server', svg,
      '在 MCP 出现之前，每个 host 与每个 server 都使用定制协议通信，从而形成 N×M 的集成 Matrix。MCP 在中间提供统一的 JSON-RPC 规范：只需编写一个 server，任何兼容的 host 都能发现并调用其中的 Tool、resource 和 Prompt。请求流入、结果返回，整个过程只使用一种 wire format。');
  }

  // ── a2a-task-lifecycle：Agent 发送 Task，状态推进并返回 artifact ─────────
  function a2aLifecycle(host) {
    var svg = newSvg(240);
    var states = ['已提交', '处理中', '需要输入', '已完成'];
    var sx = 150, dx = 92, sy = 70;
    // client Agent 和 remote Agent 方框
    svg.appendChild(svgEl('rect', { x: 20, y: 30, width: 90, height: 36, rx: 4, fill: BP, 'fill-opacity': '0.16', stroke: BP, 'stroke-width': '1.5' }));
    svg.appendChild(txt(65, 52, 'client Agent', 10, INK, 'middle'));
    svg.appendChild(svgEl('rect', { x: 410, y: 30, width: 90, height: 36, rx: 4, fill: WARN, 'fill-opacity': '0.16', stroke: WARN, 'stroke-width': '1.5' }));
    svg.appendChild(txt(455, 52, 'remote Agent', 10, INK, 'middle'));
    // Task 消息从 client → remote 飞行
    var task = svgEl('rect', { x: -16, y: -8, width: 32, height: 16, rx: 3, fill: BP });
    task.appendChild(svgEl('animateMotion', { dur: '8s', repeatCount: 'indefinite', path: 'M 110 48 L 410 48', keyTimes: '0;0.12;1', keyPoints: '0;1;1', calcMode: 'linear' }));
    task.appendChild(anim('opacity', '0;1;1;0;0', '8s', { keyTimes: '0;0.02;0.1;0.14;1' }));
    svg.appendChild(task);
    svg.appendChild(svgEl('text', { x: 0, y: 4, 'font-size': 8, 'font-family': 'monospace', fill: 'var(--bg,#fff)', 'text-anchor': 'middle' }, [document.createTextNode('Task'),
      svgEl('animateMotion', { dur: '8s', repeatCount: 'indefinite', path: 'M 110 48 L 410 48', keyTimes: '0;0.12;1', keyPoints: '0;1;1', calcMode: 'linear' }),
      anim('opacity', '0;1;1;0;0', '8s', { keyTimes: '0;0.02;0.1;0.14;1' })]));
    // 状态胶囊按顺序亮起
    states.forEach(function (st, i) {
      var x = sx + i * dx;
      svg.appendChild(svgEl('rect', { x: x - 42, y: 120, width: 84, height: 26, rx: 13, fill: 'var(--bg-surface,#eee)', stroke: SOFT, 'stroke-width': '1' }));
      svg.appendChild(svgEl('rect', { x: x - 42, y: 120, width: 84, height: 26, rx: 13, fill: BP, 'fill-opacity': '0' }, [
        anim('fill-opacity', '0;0.85;0.85;0', '8s', { keyTimes: '0;' + (0.15 + i * 0.2).toFixed(2) + ';' + (0.32 + i * 0.2).toFixed(2) + ';1' })
      ]));
      svg.appendChild(txt(x, 137, st, 9, INK, 'middle'));
      if (i < states.length - 1) {
        svg.appendChild(svgEl('line', { x1: x + 42, y1: 133, x2: x + dx - 42, y2: 133, stroke: SOFT, 'stroke-width': '1' }));
      }
    });
    // 最后，artifact 从 remote → client 返回
    var art = svgEl('rect', { x: -18, y: -9, width: 36, height: 18, rx: 3, fill: WARN });
    art.appendChild(svgEl('animateMotion', { dur: '8s', repeatCount: 'indefinite', path: 'M 410 190 L 110 190', keyTimes: '0;0.86;0.98;1', keyPoints: '0;0;1;1', calcMode: 'linear' }));
    art.appendChild(anim('opacity', '0;0;1;0', '8s', { keyTimes: '0;0.86;0.94;1' }));
    svg.appendChild(art);
    svg.appendChild(txt(260, 215, 'artifact', 9, WARN, 'middle'));
    svg.appendChild(txt(260, 100, 'Task 生命周期（内部状态对调用方保持不透明）', 10, MUTE, 'middle'));
    shell(host, 'A2A TASK LIFECYCLE', '已提交 → 处理中 → 已完成', svg,
      '一个 Agent 向另一个 Agent 发送 Task，并且只观察状态转换：已提交、处理中、有时需要输入，最后是已完成。remote Agent 的内部推理保持不透明，调用方只能看到状态变化，以及最终作为输出返回的 artifact。');
  }

  // ── rvq-codec-cascade：residual Vector quantization，semantic 与 acoustic ──
  function rvqCodec(host) {
    var svg = newSvg(230);
    // 左侧 waveform 输入 encoder
    var wd = 'M 24 120', wx;
    for (wx = 0; wx <= 80; wx++) {
      var xx = 24 + wx, yy = 120 + 26 * Math.sin(wx / 4) * Math.exp(-wx / 120);
      wd += ' L ' + xx + ' ' + yy.toFixed(1);
    }
    svg.appendChild(svgEl('path', { d: wd, fill: 'none', stroke: MUTE, 'stroke-width': '1.5' }));
    svg.appendChild(txt(24, 60, 'waveform', 10, MUTE));
    // encoder block
    svg.appendChild(svgEl('rect', { x: 116, y: 96, width: 30, height: 48, rx: 3, fill: 'var(--bg-surface,#eee)', stroke: SOFT, 'stroke-width': '1' }));
    svg.appendChild(txt(131, 124, 'enc', 9, INK, 'middle'));
    // 级联 codebook；residual 沿堆栈逐渐缩小
    var books = [
      { y: 30, label: 'CB0  semantic', col: BP, amp: 1.0 },
      { y: 78, label: 'CB1  acoustic', col: WARN, amp: 0.55 },
      { y: 126, label: 'CB2  acoustic', col: WARN, amp: 0.32 },
      { y: 174, label: 'CB3  acoustic', col: WARN, amp: 0.18 }
    ];
    books.forEach(function (b, i) {
      var bx = 200;
      svg.appendChild(svgEl('rect', { x: bx, y: b.y, width: 150, height: 30, rx: 3, fill: b.col, 'fill-opacity': '0.12', stroke: b.col, 'stroke-width': '1' }));
      svg.appendChild(txt(bx + 8, b.y + 19, b.label, 10, INK));
      // 逐渐缩小的 residual 条形，通过宽度脉冲动画展示“仍需 quantize 的部分”
      svg.appendChild(svgEl('rect', { x: bx + 100, y: b.y + 8, width: 40 * b.amp, height: 14, rx: 2, fill: b.col, 'fill-opacity': '0.7' }, [
        anim('fill-opacity', '0.3;0.8;0.3', '3s', { begin: (i * 0.4).toFixed(1) + 's' })
      ]));
      // residual packet 从一个 codebook 流向下一个
      if (i < books.length - 1) {
        var pk = svgEl('circle', { r: 4, fill: b.col });
        pk.appendChild(svgEl('animateMotion', { dur: '3s', repeatCount: 'indefinite', path: 'M ' + (bx + 75) + ' ' + (b.y + 30) + ' L ' + (bx + 75) + ' ' + books[i + 1].y, begin: (i * 0.5).toFixed(1) + 's' }));
        pk.appendChild(anim('opacity', '0;1;0', '3s', { begin: (i * 0.5).toFixed(1) + 's' }));
        svg.appendChild(pk);
      }
      // encoder → 第一个 codebook 的连接
      if (i === 0) {
        svg.appendChild(svgEl('line', { x1: 146, y1: 120, x2: bx, y2: b.y + 15, stroke: SOFT, 'stroke-width': '1', 'stroke-dasharray': '4 3' }, [
          anim('stroke-dashoffset', '0;-14', '1s')
        ]));
      }
    });
    svg.appendChild(txt(200, 220, '每个 codebook quantize 上一个 codebook 留下的 residual', 10, MUTE));
    shell(host, 'RVQ AUDIO CODEC', 'semantic codebook 0，acoustic codebook 1..N', svg,
      'Neural audio codec 不使用一个巨大的 codebook，而是级联多个小型 codebook：第一个 quantize encoder 输出，之后每个 codebook 都 quantize 上一步留下的 residual。逐渐缩小的条形表示 residual 沿堆栈不断减小。让 codebook 0 承载语言内容（semantic），其余 codebook 承载 acoustic 细节，正是基于 Token 的语音 Model 能够工作的关键。');
  }

  LF.register({
    'masked-diffusion-unmask': maskedDiffusion,
    'any-to-any-stream': anyToAny,
    'video-diffusion-denoise': videoDenoise,
    'inpaint-mask-reinject': inpaint,
    'agentic-rag-loop': agenticRag,
    'mcp-nxm-collapse': mcpMatrix,
    'a2a-task-lifecycle': a2aLifecycle,
    'rvq-codec-cascade': rvqCodec
  });
})();
