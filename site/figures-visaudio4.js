/* figures-visaudio4.js — Phase 4（视觉）、Phase 6（语音与音频）和
   Phase 8（生成式 AI）的第四批 SVG 动画课程图示。
   在 lesson-figures.js 之后加载，并通过 window.LF 注册组件。
   每个图示都是针对单一概念自动运行的 SMIL 动画：没有 JS timer，
   没有计算循环。原生 ES5，无依赖，通过 CSS 变量适配主题。
   编写方式与 docs/en.md 中的 fenced block 相同：
       ```figure
       v4-video-temporal
       ``` */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;

  var BLUE = 'var(--blueprint,#3553ff)', INK = 'var(--ink,#1a1a1a)', SOFT = 'var(--rule-soft,#ddd)',
    WARN = 'var(--warn,#b8870f)', MUTE = 'var(--ink-mute,#777)', BG = 'var(--bg,#fafaf5)', SURF = 'var(--bg-surface,#eee)';
  var EASE = '0.23 1 0.32 1';

  function splines(n) { var a = [], i; for (i = 0; i < n; i++) a.push(EASE); return a.join(';'); }
  function txt(x, y, s, size, anchor, fill) {
    return svgEl('text', { x: x, y: y, fill: fill || MUTE, 'font-size': size || 10, 'font-family': 'monospace', 'text-anchor': anchor || 'start' }, [document.createTextNode(s)]);
  }
  function anim(attr, vals, dur, extra) {
    var a = { attributeName: attr, values: vals, dur: dur, repeatCount: 'indefinite' };
    if (extra) for (var k in extra) a[k] = extra[k];
    return svgEl('animate', a);
  }
  function shell(label, hint, svg, caption) {
    return el('div', { class: 'lf' }, [
      el('div', { class: 'lf-head' }, [el('span', { class: 'lf-label' }, [label]), el('span', {}, [hint])]),
      el('div', { class: 'lf-body' }, [el('div', { class: 'lf-out' }, [svg])]),
      el('div', { class: 'lf-cap' }, [caption])
    ]);
  }
  // 入场辅助函数：以 (cx, cy) 为中心淡入，并从 95% 大小放大，
  // 随后在循环衔接处快速淡出，使退场看起来比入场更快。
  function rise(cx, cy, dur, t0, t1, kids) {
    var inner = svgEl('g', { transform: 'translate(' + (-cx) + ' ' + (-cy) + ')' }, kids);
    var g = svgEl('g', { transform: 'translate(' + cx + ' ' + cy + ')' }, [inner]);
    g.appendChild(svgEl('animateTransform', {
      attributeName: 'transform', type: 'scale', additive: 'sum',
      values: '0.95;0.95;1;1', keyTimes: '0;' + t0 + ';' + t1 + ';1',
      calcMode: 'spline', keySplines: splines(3), dur: dur, repeatCount: 'indefinite'
    }));
    g.appendChild(anim('opacity', '0;0;1;1;0', dur, { keyTimes: '0;' + t0 + ';' + t1 + ';0.97;1', calcMode: 'spline', keySplines: splines(4) }));
    return g;
  }
  function fade(node, dur, t0, t1) {
    node.setAttribute('opacity', '0');
    node.appendChild(anim('opacity', '0;0;1;1', dur, { keyTimes: '0;' + t0 + ';' + t1 + ';1', calcMode: 'spline', keySplines: splines(3) }));
    return node;
  }
  function draw(node, len, dur, t0, t1) {
    node.setAttribute('stroke-dasharray', len);
    node.setAttribute('stroke-dashoffset', len);
    node.appendChild(anim('stroke-dashoffset', len + ';' + len + ';0;0', dur, { keyTimes: '0;' + t0 + ';' + t1 + ';1', calcMode: 'spline', keySplines: splines(3) }));
    return node;
  }

  // ── v4-video-temporal (P4/12)：相同的五帧，两种读取时间的方式 ──
  function videoTemporal(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' }), D = '5s';
    svg.appendChild(txt(14, 16, '相同的五帧，两种读取时间的方式'));
    function strip(y) {
      var kids = [], i;
      for (i = 0; i < 5; i++) kids.push(svgEl('rect', { x: 96 + i * 62, y: y, width: 48, height: 44, fill: BLUE, opacity: (0.1 + 0.05 * (i % 3)).toFixed(2), stroke: SOFT, 'stroke-width': '1' }));
      return kids;
    }
    svg.appendChild(txt(14, 58, '2D + pool', 10, 'start', INK));
    svg.appendChild(rise(244, 54, D, 0.04, 0.16, strip(32)));
    var scan = svgEl('rect', { x: 96, y: 32, width: 48, height: 44, fill: 'none', stroke: WARN, 'stroke-width': '2' });
    scan.appendChild(anim('x', '96;96;158;220;282;344;344', D, { keyTimes: '0;0.18;0.27;0.36;0.45;0.54;1', calcMode: 'spline', keySplines: splines(6) }));
    scan.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.16;0.2;0.56;0.62;1' }));
    svg.appendChild(scan);
    svg.appendChild(rise(458, 54, D, 0.58, 0.7, [
      svgEl('rect', { x: 412, y: 36, width: 92, height: 36, fill: BLUE, opacity: '0.15', stroke: BLUE }),
      txt(458, 58, '沿 T 求平均', 9, 'middle', INK), txt(458, 88, '运动信息丢失', 8, 'middle')
    ]));
    svg.appendChild(txt(14, 158, '3D conv', 10, 'start', INK));
    svg.appendChild(rise(244, 154, D, 0.1, 0.22, strip(132)));
    var win = svgEl('rect', { x: 96, y: 126, width: 172, height: 56, fill: WARN, stroke: WARN, 'stroke-width': '2', opacity: '0' });
    win.appendChild(anim('x', '96;96;96;220;220', D, { keyTimes: '0;0.24;0.36;0.62;1', calcMode: 'spline', keySplines: splines(4) }));
    win.appendChild(anim('opacity', '0;0;0.18;0.18;0;0', D, { keyTimes: '0;0.22;0.28;0.66;0.72;1' }));
    svg.appendChild(win);
    svg.appendChild(rise(458, 154, D, 0.66, 0.78, [
      svgEl('rect', { x: 412, y: 136, width: 92, height: 36, fill: BLUE, opacity: '0.15', stroke: BLUE }),
      txt(458, 158, 'T x H x W', 9, 'middle', INK), txt(458, 188, '运动信息保留', 8, 'middle')
    ]));
    svg.appendChild(fade(txt(14, 226, 'Transformer 更进一步：同时对每个 (t, h, w) Token 执行 Attention', 9), D, 0.8, 0.9));
    host.appendChild(shell('视频 · 时间建模', '什么时候对时间进行建模？', svg,
      '2D+pool Model 对每一帧运行相同的图像 CNN，并沿时间对 Feature 求平均，因此“向左推”和“向右推”会折叠成相同的片段 Vector。3D conv 的 kernel 不仅在空间中滑动，也会沿时间滑动：它一次观察一个较短的帧窗口，因此能够编码方向。时空 Transformer 则通过联合关注每个 (t, h, w) Token 完成这一思路，其成本相对于片段长度呈二次增长。'));
  }

  // ── v4-vision-pipeline (P4/16)：一个请求流经整个检测链 ─────
  function visionPipeline(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 220' }), D = '5s';
    svg.appendChild(txt(14, 16, '一个请求流经整个处理链'));
    svg.appendChild(svgEl('rect', { x: 16, y: 36, width: 120, height: 84, fill: SURF, stroke: SOFT }));
    svg.appendChild(rise(52, 72, D, 0.08, 0.18, [svgEl('rect', { x: 34, y: 58, width: 36, height: 28, fill: 'none', stroke: WARN, 'stroke-width': '1.6' })]));
    svg.appendChild(rise(102, 91, D, 0.14, 0.24, [svgEl('rect', { x: 82, y: 74, width: 40, height: 34, fill: 'none', stroke: WARN, 'stroke-width': '1.6' })]));
    svg.appendChild(txt(16, 134, '解码 + 检测', 9));
    svg.appendChild(draw(svgEl('line', { x1: 122, y1: 91, x2: 170, y2: 77, stroke: MUTE, 'stroke-width': '1.2' }), 50, D, 0.28, 0.36));
    svg.appendChild(rise(187, 75, D, 0.3, 0.4, [
      svgEl('rect', { x: 170, y: 58, width: 34, height: 34, fill: WARN, opacity: '0.2', stroke: WARN })
    ]));
    svg.appendChild(txt(160, 110, '裁剪 + 调整大小', 9));
    svg.appendChild(rise(278, 74, D, 0.42, 0.52, [
      svgEl('rect', { x: 230, y: 52, width: 96, height: 44, fill: BLUE, opacity: '0.15', stroke: BLUE }),
      txt(278, 78, 'ConvNeXt-T', 9, 'middle', INK)
    ]));
    svg.appendChild(fade(txt(278, 114, 'Label：麦片 0.94', 9, 'middle', WARN), D, 0.55, 0.63));
    svg.appendChild(rise(436, 96, D, 0.68, 0.8, [
      svgEl('rect', { x: 368, y: 36, width: 136, height: 120, fill: BG, stroke: SOFT }),
      txt(380, 60, '{', 9, 'start', INK),
      txt(388, 78, '"box": [82,74,..]', 9, 'start', INK),
      txt(388, 96, '"cls": "cereal"', 9, 'start', INK),
      txt(388, 114, '"score": 0.94', 9, 'start', INK),
      txt(380, 132, '}', 9, 'start', INK)
    ]));
    svg.appendChild(txt(368, 172, '输出已验证的 JSON', 9));
    var dot = svgEl('circle', { cx: 0, cy: 0, r: 4, fill: BLUE });
    dot.appendChild(svgEl('animateMotion', { dur: D, repeatCount: 'indefinite', path: 'M 136 78 L 204 75 L 278 74 L 402 96', keyPoints: '0;0;1;1', keyTimes: '0;0.2;0.72;1', calcMode: 'linear' }));
    dot.appendChild(anim('opacity', '0;0;1;1;0;0', D, { keyTimes: '0;0.2;0.24;0.68;0.74;1' }));
    svg.appendChild(dot);
    host.appendChild(shell('视觉综合项目 · PIPELINE', '检测、裁剪、分类、验证', svg,
      '生产级视觉服务是一连串契约：解码字节、检测边界框、裁剪每个边界框、对裁剪结果进行分类，最后组装成一个结构化响应。每个箭头都是一个可能悄无声息地出错的接口（坐标顺序、归一化、调整大小时的插值），因此输出在离开服务前需要通过 Pydantic schema。检测器或分类器都可以自由替换；整体骨架保持不变。'));
  }

  // ── v4-vlm-projector (P4/25)：图像块变成 LLM 在序列中读取的 Token ────
  function vlmProjector(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' }), D = '5.5s';
    svg.appendChild(txt(14, 16, 'ViT-MLP-LLM：图像以 Token 形式进入 LLM'));
    var patches = [svgEl('rect', { x: 16, y: 32, width: 96, height: 96, fill: SURF, stroke: SOFT })], r, c;
    for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) {
      patches.push(svgEl('rect', { x: 21 + c * 31, y: 37 + r * 31, width: 28, height: 28, fill: BLUE, opacity: (0.12 + 0.14 * ((r * 2 + c) % 4)).toFixed(2) }));
    }
    svg.appendChild(rise(64, 80, D, 0.04, 0.14, patches));
    svg.appendChild(txt(16, 142, '图像块', 8));
    svg.appendChild(fade(svgEl('polygon', { points: '116,50 176,72 176,104 116,126', fill: BLUE, opacity: '0.14', stroke: BLUE }), D, 0.18, 0.26));
    svg.appendChild(txt(112, 142, 'ViT + MLP projector', 8));
    var vtoks = [], i;
    for (i = 0; i < 4; i++) vtoks.push(svgEl('rect', { x: 186 + i * 28, y: 82, width: 24, height: 24, fill: BLUE, opacity: '0.7' }));
    svg.appendChild(rise(240, 94, D, 0.3, 0.42, vtoks));
    var words = ['有', '多少', '红色', '汽车'], ttoks = [txt(352, 76, '文本：“有多少辆红色汽车？”', 7, 'middle')];
    for (i = 0; i < 4; i++) {
      ttoks.push(svgEl('rect', { x: 298 + i * 28, y: 82, width: 24, height: 24, fill: WARN, opacity: '0.18', stroke: WARN }));
      ttoks.push(txt(310 + i * 28, 97, words[i], 6.5, 'middle', INK));
    }
    svg.appendChild(rise(352, 94, D, 0.46, 0.58, ttoks));
    svg.appendChild(txt(240, 122, '图像 Token', 8, 'middle'));
    svg.appendChild(rise(460, 94, D, 0.64, 0.74, [
      svgEl('rect', { x: 416, y: 72, width: 88, height: 44, fill: BLUE, opacity: '0.15', stroke: BLUE }),
      txt(460, 98, 'LLM decoder', 8, 'middle', INK)
    ]));
    svg.appendChild(rise(460, 143, D, 0.8, 0.9, [txt(460, 146, '回答：“3”', 10, 'middle', WARN)]));
    svg.appendChild(fade(txt(14, 234, '一个交错序列：[图][图][图][图][有][多少][红色][汽车] -> 下一个 Token 预测', 8), D, 0.6, 0.7));
    host.appendChild(shell('VLM · ViT-MLP-LLM', '图像 Token 加入文本流', svg,
      '每个生产级 VLM 都由相同的三个部分组成。ViT 将图像切分成图像块并对每个图像块进行编码；一个小型 MLP 将这些图像块 Embedding 投影到 LLM Token 空间；随后 decoder 将图像 Token 和文本 Token 作为一个交错序列读取，因此“有多少辆红色汽车？”可通过普通的下一个 Token 预测得到回答。一旦掌握这种模式，替换 ViT、projector 或 LLM 都只是机械操作。'));
  }

  // ── v4-world-rollout (P4/28)：生成的帧重新进入 Context ─────────
  function worldRollout(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' }), D = '5s';
    svg.appendChild(txt(14, 16, 'world Model 根据自身预测逐步展开未来'));
    svg.appendChild(svgEl('rect', { x: 24, y: 50, width: 96, height: 78, fill: BLUE, opacity: '0.16', stroke: SOFT }));
    svg.appendChild(svgEl('line', { x1: 30, y1: 102, x2: 114, y2: 102, stroke: MUTE, 'stroke-width': '1' }));
    svg.appendChild(svgEl('circle', { cx: 92, cy: 88, r: 8, fill: 'none', stroke: INK, 'stroke-width': '1.4' }));
    svg.appendChild(txt(24, 142, '帧 t（Context）', 8));
    svg.appendChild(rise(162, 90, D, 0.12, 0.2, [
      svgEl('rect', { x: 130, y: 80, width: 64, height: 20, fill: WARN, opacity: '0.14', stroke: WARN }),
      txt(162, 93, '向左转', 7, 'middle', INK)
    ]));
    var f2 = svgEl('rect', { x: 204, y: 50, width: 96, height: 78, fill: BLUE, stroke: SOFT, opacity: '0' });
    f2.appendChild(anim('opacity', '0;0;0.16;0.16', D, { keyTimes: '0;0.2;0.38;1', calcMode: 'spline', keySplines: splines(3) }));
    svg.appendChild(f2);
    svg.appendChild(fade(svgEl('line', { x1: 210, y1: 102, x2: 294, y2: 102, stroke: MUTE, 'stroke-width': '1' }), D, 0.3, 0.45));
    svg.appendChild(fade(svgEl('circle', { cx: 244, cy: 88, r: 8, fill: 'none', stroke: INK, 'stroke-width': '1.4' }), D, 0.3, 0.45));
    var dots = [[222, 64], [268, 58], [238, 112], [284, 102], [226, 94], [276, 74]], i;
    for (i = 0; i < dots.length; i++) {
      var nz = svgEl('circle', { cx: dots[i][0], cy: dots[i][1], r: 2.2, fill: MUTE, opacity: '0' });
      nz.appendChild(anim('opacity', '0;0.8;0.8;0;0', D, { keyTimes: '0;' + (0.18 + i * 0.02).toFixed(2) + ';0.3;0.44;1' }));
      svg.appendChild(nz);
    }
    svg.appendChild(txt(204, 142, '帧 t+1，去噪中', 8));
    svg.appendChild(rise(342, 90, D, 0.46, 0.54, [
      svgEl('rect', { x: 310, y: 80, width: 64, height: 20, fill: WARN, opacity: '0.14', stroke: WARN }),
      txt(342, 93, '打开门', 7, 'middle', INK)
    ]));
    svg.appendChild(rise(432, 89, D, 0.56, 0.66, [
      svgEl('rect', { x: 384, y: 50, width: 96, height: 78, fill: 'none', stroke: MUTE, 'stroke-dasharray': '4 3' }),
      txt(432, 94, '?', 12, 'middle', MUTE)
    ]));
    svg.appendChild(txt(384, 142, '帧 t+2', 8));
    svg.appendChild(draw(svgEl('path', { d: 'M 252 132 C 252 186 72 186 72 132', fill: 'none', stroke: BLUE, 'stroke-width': '1.4', 'stroke-dasharray': '4 3' }), 300, D, 0.6, 0.8));
    svg.appendChild(fade(txt(162, 208, '每个生成帧都会重新进入 Context 窗口', 8, 'middle'), D, 0.74, 0.84));
    host.appendChild(shell('WORLD MODELS · 动作条件化 ROLLOUT', '预测、行动、反馈、重复', svg,
      '纯视频生成根据 Prompt 预测帧，然后停止。world Model 则是在循环中运行的同一个视频 DiT：每个完成去噪的片段都会追加到 Context 中，一个动作 Token（向左转、打开门）为下一次预测提供条件，Model 因而成为一个可以操控的学习型模拟器。漂移是主要故障模式，因为每个幻觉像素都会成为未来的输入。'));
  }

  // ── v4-alm-tokens (P6/10)：三个声音事件汇入同一个 Token 流 ────
  function almTokens(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 240' }), D = '5s';
    svg.appendChild(txt(14, 16, '五秒音频、三个事件、一个 Token 流'));
    var w1 = svgEl('polyline', { points: '16,64 22,44 28,86 34,48 40,80 46,42 52,84 58,52 64,76 70,46 76,82 82,56 88,72 94,50 100,78 106,58 112,70 120,60 128,68 136,62 144,66 150,64', fill: 'none', stroke: INK, 'stroke-width': '1.3' });
    var w2 = svgEl('polyline', { points: '150,64 158,56 166,72 174,52 182,76 190,58 198,70 206,54 214,74 222,60 230,68 238,56 246,72 254,62 262,66 270,58 278,70 286,62 294,66 300,64', fill: 'none', stroke: INK, 'stroke-width': '1.3' });
    var w3 = svgEl('polyline', { points: '300,64 316,63 332,65 348,64 364,63 380,65 396,64 412,64 430,64', fill: 'none', stroke: INK, 'stroke-width': '1.3' });
    svg.appendChild(fade(w1, D, 0.03, 0.1)); svg.appendChild(fade(w2, D, 0.05, 0.12)); svg.appendChild(fade(w3, D, 0.07, 0.14));
    svg.appendChild(rise(83, 64, D, 0.14, 0.22, [svgEl('rect', { x: 16, y: 36, width: 134, height: 56, fill: BLUE, opacity: '0.06', stroke: SOFT }), txt(83, 32, '犬吠', 8, 'middle', INK)]));
    svg.appendChild(rise(225, 64, D, 0.2, 0.28, [svgEl('rect', { x: 150, y: 36, width: 150, height: 56, fill: BLUE, opacity: '0.06', stroke: SOFT }), txt(225, 32, '“停下！”', 8, 'middle', INK)]));
    svg.appendChild(rise(365, 64, D, 0.26, 0.34, [svgEl('rect', { x: 300, y: 36, width: 130, height: 56, fill: BLUE, opacity: '0.06', stroke: SOFT }), txt(365, 32, '寂静', 8, 'middle', INK)]));
    var row = [], words = ['有人', '受伤', '了', '吗？'], i;
    for (i = 0; i < 4; i++) {
      row.push(svgEl('rect', { x: 76 + i * 46, y: 142, width: 40, height: 24, fill: WARN, opacity: '0.15', stroke: WARN }));
      row.push(txt(96 + i * 46, 157, words[i], 7, 'middle', INK));
    }
    for (i = 0; i < 3; i++) row.push(svgEl('rect', { x: 260 + i * 46, y: 142, width: 40, height: 24, fill: BLUE, opacity: '0.75' }));
    svg.appendChild(rise(234, 154, D, 0.4, 0.52, row));
    svg.appendChild(draw(svgEl('line', { x1: 83, y1: 92, x2: 280, y2: 142, stroke: MUTE, 'stroke-width': '1' }), 210, D, 0.5, 0.6));
    svg.appendChild(draw(svgEl('line', { x1: 225, y1: 92, x2: 326, y2: 142, stroke: MUTE, 'stroke-width': '1' }), 120, D, 0.55, 0.65));
    svg.appendChild(draw(svgEl('line', { x1: 365, y1: 92, x2: 372, y2: 142, stroke: MUTE, 'stroke-width': '1' }), 55, D, 0.6, 0.7));
    svg.appendChild(rise(458, 154, D, 0.66, 0.76, [
      svgEl('rect', { x: 412, y: 142, width: 92, height: 24, fill: BLUE, opacity: '0.15', stroke: BLUE }),
      txt(458, 157, 'LLM', 8, 'middle', INK)
    ]));
    svg.appendChild(rise(260, 202, D, 0.8, 0.9, [txt(260, 205, '回答：“是的，很可能有危险：犬吠、喊叫，然后陷入寂静”', 8, 'middle', WARN)]));
    host.appendChild(shell('音频语言 MODEL · 单一数据流', '声音事件变成 LLM 读取的 Token', svg,
      '音频语言 Model 保留了由三个部分组成的模板：音频 encoder（Whisper、BEATs）将每段声音转换成 Embedding，projector 将它们映射到 LLM Token 空间，decoder 则将它们与文本 Prompt 一起在序列中读取。回答“有人受伤了吗？”需要同时利用全部三个事件：犬吠、喊叫，以及之后的寂静。这种联合读取能力，正是仅处理转录文本的 ASR Pipeline 所丢弃的内容。'));
  }

  // ── v4-voice-latency (P6/12)：流式阶段在 800ms 界线内重叠执行 ──
  function voiceLatency(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' }), D = '5.5s';
    svg.appendChild(txt(14, 16, '流式阶段相互重叠；回复在预算界线之前开始'));
    svg.appendChild(svgEl('line', { x1: 90, y1: 206, x2: 500, y2: 206, stroke: SOFT, 'stroke-width': '1' }));
    svg.appendChild(txt(90, 222, '0 ms', 8, 'middle'));
    svg.appendChild(txt(223, 222, '400', 8, 'middle'));
    svg.appendChild(txt(356, 222, '800', 8, 'middle'));
    svg.appendChild(txt(490, 222, '1200', 8, 'middle'));
    svg.appendChild(svgEl('line', { x1: 356, y1: 30, x2: 356, y2: 206, stroke: WARN, 'stroke-width': '1.2', 'stroke-dasharray': '4 3', opacity: '0.8' }));
    svg.appendChild(txt(362, 36, '800 ms 预算', 8, 'start', WARN));
    var lanes = [['用户语音', 42], ['STT', 74], ['LLM', 106], ['TTS', 138], ['音频输出', 170]], i;
    for (i = 0; i < lanes.length; i++) svg.appendChild(txt(84, lanes[i][1] + 11, lanes[i][0], 8, 'end'));
    function bar(x, y, w, fill, op, t0, t1) {
      var b = svgEl('rect', { x: x, y: y, width: 0, height: 13, fill: fill, opacity: op });
      b.appendChild(anim('width', '0;0;' + w + ';' + w, D, { keyTimes: '0;' + t0 + ';' + t1 + ';1', calcMode: 'spline', keySplines: splines(3) }));
      return b;
    }
    svg.appendChild(bar(90, 42, 200, MUTE, '0.55', 0.04, 0.28));
    svg.appendChild(bar(140, 74, 185, BLUE, '0.5', 0.1, 0.36));
    svg.appendChild(bar(297, 106, 127, BLUE, '0.7', 0.3, 0.5));
    var tts = bar(330, 138, 143, BLUE, '1', 0.38, 0.6);
    tts.setAttribute('fill', WARN); tts.setAttribute('opacity', '0.55');
    tts.appendChild(anim('opacity', '0.55;0.55;0.12;0.12', D, { keyTimes: '0;0.76;0.8;1' }));
    svg.appendChild(tts);
    var outb = bar(340, 170, 120, WARN, '0.85', 0.52, 0.68);
    outb.appendChild(anim('opacity', '0.85;0.85;0.12;0.12', D, { keyTimes: '0;0.76;0.8;1' }));
    svg.appendChild(outb);
    svg.appendChild(rise(340, 176, D, 0.5, 0.58, [svgEl('circle', { cx: 340, cy: 176, r: 4.4, fill: WARN })]));
    svg.appendChild(fade(txt(340, 164, '首段音频：750 ms', 8, 'middle', WARN), D, 0.56, 0.64));
    var barge = svgEl('rect', { x: 440, y: 42, width: 0, height: 13, fill: MUTE, opacity: '0.55' });
    barge.appendChild(anim('width', '0;0;40;40', D, { keyTimes: '0;0.72;0.78;1', calcMode: 'spline', keySplines: splines(3) }));
    svg.appendChild(barge);
    svg.appendChild(fade(txt(460, 36, '插话：取消 TTS', 7, 'middle'), D, 0.76, 0.82));
    host.appendChild(shell('语音助手 · 延迟泳道', '重叠执行胜过顺序执行', svg,
      '800 ms 的响应体验来自阶段重叠，而不是某个单独组件速度很快。STT 从部分语音开始处理，LLM 从部分转录文本开始处理，TTS 在获得最初几个 Token 后开始处理，首个音频字节会在约 750 ms 时送达，处于预算范围内。当用户插话时，VAD 事件会立即取消 TTS 和播放：Pipeline 中最快的路径，是让它停下来的路径。'));
  }

  // ── v4-audio-watermark (P6/16)：水印经受失真后仍然保留 ───────
  function audioWatermark(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 230' }), D = '5s';
    svg.appendChild(txt(14, 16, '水印隐藏在听觉阈值之下，并经受住整个 Pipeline'));
    svg.appendChild(fade(svgEl('polyline', { points: '16,70 24,56 32,82 40,58 48,78 56,54 64,80 72,60 80,76 88,56 96,78 104,62 112,74 120,58 128,76 136,64 144,70 150,68', fill: 'none', stroke: INK, 'stroke-width': '1.3' }), D, 0.03, 0.1));
    svg.appendChild(fade(svgEl('path', { d: 'M 16 88 Q 26 82 36 88 T 56 88 T 76 88 T 96 88 T 116 88 T 136 88 T 150 88', fill: 'none', stroke: WARN, 'stroke-width': '1.6', 'stroke-dasharray': '3 2' }), D, 0.12, 0.24));
    svg.appendChild(txt(16, 110, '生成的语音', 8));
    svg.appendChild(txt(16, 124, '+ 水印（不可听见）', 8, 'start', WARN));
    svg.appendChild(draw(svgEl('line', { x1: 158, y1: 70, x2: 194, y2: 70, stroke: MUTE, 'stroke-width': '1.2' }), 38, D, 0.26, 0.32));
    svg.appendChild(rise(248, 70, D, 0.3, 0.42, [
      svgEl('rect', { x: 200, y: 48, width: 96, height: 44, fill: SURF, stroke: SOFT }),
      txt(248, 66, 'mp3 · 裁剪', 8, 'middle', INK),
      txt(248, 80, '重采样', 8, 'middle', INK)
    ]));
    svg.appendChild(fade(svgEl('polyline', { points: '306,70 312,52 318,84 324,54 330,82 336,50 342,86 348,56 354,80 360,52 366,84 372,58 378,78 384,56 390,80 396,68', fill: 'none', stroke: INK, 'stroke-width': '1.3' }), D, 0.45, 0.53));
    svg.appendChild(fade(svgEl('path', { d: 'M 306 88 Q 314 82 322 88 T 338 88 T 354 88 T 370 88 T 386 88 T 396 88', fill: 'none', stroke: WARN, 'stroke-width': '1.6', 'stroke-dasharray': '3 2' }), D, 0.5, 0.58));
    svg.appendChild(txt(306, 110, '失真副本', 8));
    svg.appendChild(draw(svgEl('line', { x1: 402, y1: 70, x2: 428, y2: 70, stroke: MUTE, 'stroke-width': '1.2' }), 28, D, 0.56, 0.62));
    svg.appendChild(rise(468, 66, D, 0.6, 0.7, [
      svgEl('rect', { x: 432, y: 48, width: 72, height: 36, fill: BLUE, opacity: '0.15', stroke: BLUE }),
      txt(468, 70, '检测器', 8, 'middle', INK)
    ]));
    var bits = ['1', '0', '1', '1', '0'], kids = [], i;
    for (i = 0; i < 5; i++) {
      kids.push(svgEl('rect', { x: 420 + i * 17, y: 108, width: 14, height: 16, fill: BLUE, opacity: '0.85' }));
      kids.push(txt(427 + i * 17, 120, bits[i], 8, 'middle', BG));
    }
    svg.appendChild(rise(462, 116, D, 0.74, 0.86, kids));
    svg.appendChild(fade(txt(462, 142, '载荷已恢复', 7, 'middle'), D, 0.84, 0.92));
    host.appendChild(shell('音频水印 · 生存能力', '嵌入、失真、仍可检测', svg,
      'AudioSeal 风格的水印会为生成语音的每个采样添加一个学习得到的、不可感知的信号。重点不是保密，而是生存能力：经过 MP3 压缩、裁剪和重采样后，检测器仍能恢复用于标记片段为合成内容的载荷 bit。AASIST 和 RawNet2 等检测 Model 负责应对不配合的攻击者；水印负责标记你自己的输出。发布语音克隆功能时，两者都应部署。'));
  }

  // ── v4-controlnet-zero (P8/08)：可训练的副本引导冻结的 U-Net ─────
  function controlnetZero(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' }), D = '5s';
    svg.appendChild(txt(14, 16, '可训练的副本通过 zero-conv 引导冻结的 U-Net'));
    svg.appendChild(svgEl('rect', { x: 16, y: 44, width: 84, height: 96, fill: SURF, stroke: SOFT }));
    svg.appendChild(svgEl('circle', { cx: 58, cy: 66, r: 7, fill: 'none', stroke: INK, 'stroke-width': '1.6' }));
    svg.appendChild(svgEl('line', { x1: 58, y1: 73, x2: 58, y2: 102, stroke: INK, 'stroke-width': '1.6' }));
    svg.appendChild(svgEl('line', { x1: 40, y1: 86, x2: 76, y2: 86, stroke: INK, 'stroke-width': '1.6' }));
    svg.appendChild(svgEl('line', { x1: 58, y1: 102, x2: 44, y2: 128, stroke: INK, 'stroke-width': '1.6' }));
    svg.appendChild(svgEl('line', { x1: 58, y1: 102, x2: 72, y2: 128, stroke: INK, 'stroke-width': '1.6' }));
    svg.appendChild(txt(16, 154, '姿态图', 8));
    var y = [44, 82, 120], clone = [], i;
    for (i = 0; i < 3; i++) clone.push(svgEl('rect', { x: 116, y: y[i], width: 64, height: 30, fill: WARN, opacity: '0.14', stroke: WARN }));
    svg.appendChild(rise(148, 97, D, 0.16, 0.28, clone));
    svg.appendChild(txt(116, 164, '可训练副本', 8, 'start', WARN));
    svg.appendChild(fade(svgEl('line', { x1: 100, y1: 92, x2: 116, y2: 92, stroke: MUTE, 'stroke-width': '1.2' }), D, 0.14, 0.2));
    for (i = 0; i < 3; i++) {
      svg.appendChild(svgEl('rect', { x: 210, y: y[i], width: 64, height: 30, fill: BLUE, opacity: '0.15', stroke: BLUE }));
      svg.appendChild(svgEl('rect', { x: 330, y: y[i], width: 64, height: 30, fill: BLUE, opacity: '0.15', stroke: BLUE }));
      svg.appendChild(svgEl('line', { x1: 274, y1: y[i] + 15, x2: 330, y2: y[i] + 15, stroke: SOFT, 'stroke-width': '1' }));
    }
    svg.appendChild(txt(302, 36, '冻结的 SD U-Net', 8, 'middle', INK));
    svg.appendChild(txt(242, 164, 'encoder', 8, 'middle'));
    svg.appendChild(txt(362, 164, 'decoder', 8, 'middle'));
    svg.appendChild(draw(svgEl('path', { d: 'M 148 150 C 148 182 362 182 362 150', fill: 'none', stroke: WARN, 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }), 300, D, 0.36, 0.5));
    svg.appendChild(draw(svgEl('path', { d: 'M 148 112 C 148 196 362 196 362 112', fill: 'none', stroke: WARN, 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }), 340, D, 0.42, 0.56));
    svg.appendChild(draw(svgEl('path', { d: 'M 148 74 C 148 210 362 210 362 74', fill: 'none', stroke: WARN, 'stroke-width': '1.5', 'stroke-dasharray': '4 3' }), 390, D, 0.48, 0.62));
    svg.appendChild(fade(txt(255, 228, 'zero-conv 连接：起初不产生作用，随后学习如何施加调整', 8, 'middle', WARN), D, 0.56, 0.66));
    svg.appendChild(draw(svgEl('line', { x1: 394, y1: 102, x2: 418, y2: 102, stroke: MUTE, 'stroke-width': '1.2' }), 26, D, 0.64, 0.7));
    svg.appendChild(rise(462, 102, D, 0.68, 0.8, [
      svgEl('rect', { x: 420, y: 74, width: 84, height: 56, fill: BLUE, opacity: '0.1', stroke: BLUE }),
      svgEl('circle', { cx: 452, cy: 92, r: 5, fill: 'none', stroke: BLUE, 'stroke-width': '1.4' }),
      svgEl('line', { x1: 452, y1: 97, x2: 452, y2: 114, stroke: BLUE, 'stroke-width': '1.4' }),
      svgEl('line', { x1: 444, y1: 104, x2: 460, y2: 104, stroke: BLUE, 'stroke-width': '1.4' })
    ]));
    svg.appendChild(txt(420, 146, '姿态锁定的输出', 7));
    host.appendChild(shell('CONTROLNET · ZERO-CONV 引导', '侧分支起初保持静默', svg,
      'ControlNet 复制预训练 U-Net 的 encoder 半部，将姿态图输入该副本，并通过初始化为零的 1x1 convolution，把它的 Feature 接回冻结的 decoder。在第零步，侧分支完全不产生作用，因此 Training 只能在基础 Model 上带来改进；随着 zero-conv 逐渐起效，姿态开始引导生成。LoRA 对权重本身采用了相同技巧：在冻结的 Attention Matrix 旁添加一个低 Rank 增量。'));
  }

  // ── v4-3d-multiview (P8/12)：一张照片、一圈视图、一团 splat 云 ────
  function multiview3d(host) {
    var svg = svgEl('svg', { viewBox: '0 0 520 250' }), D = '5.5s';
    svg.appendChild(txt(14, 16, '一张照片变成一圈视图，再变成一团 Gaussian'));
    svg.appendChild(svgEl('rect', { x: 16, y: 64, width: 88, height: 70, fill: SURF, stroke: SOFT }));
    svg.appendChild(svgEl('circle', { cx: 60, cy: 94, r: 13, fill: 'none', stroke: INK, 'stroke-width': '1.4' }));
    svg.appendChild(svgEl('line', { x1: 34, y1: 118, x2: 86, y2: 118, stroke: MUTE, 'stroke-width': '1' }));
    svg.appendChild(txt(16, 148, '单张图像', 8));
    svg.appendChild(draw(svgEl('line', { x1: 110, y1: 100, x2: 144, y2: 108, stroke: MUTE, 'stroke-width': '1.2' }), 36, D, 0.1, 0.16));
    svg.appendChild(fade(svgEl('circle', { cx: 238, cy: 130, r: 64, fill: 'none', stroke: SOFT, 'stroke-width': '1.2', 'stroke-dasharray': '4 4' }), D, 0.14, 0.22));
    svg.appendChild(fade(svgEl('ellipse', { cx: 238, cy: 130, rx: 14, ry: 18, fill: BLUE, opacity: '0.3', stroke: BLUE }), D, 0.16, 0.24));
    var cams = [[238, 58, 238, 68, 238, 82], [310, 130, 297, 130, 283, 130], [238, 202, 238, 192, 238, 178], [166, 130, 179, 130, 193, 130]], i;
    for (i = 0; i < 4; i++) {
      var cm = cams[i];
      svg.appendChild(rise(cm[0], cm[1], D, (0.22 + i * 0.07).toFixed(2), (0.32 + i * 0.07).toFixed(2), [
        svgEl('rect', { x: cm[0] - 11, y: cm[1] - 8, width: 22, height: 16, fill: BG, stroke: BLUE, 'stroke-width': '1.4' }),
        svgEl('line', { x1: cm[2], y1: cm[3], x2: cm[4], y2: cm[5], stroke: BLUE, 'stroke-width': '1' })
      ]));
    }
    svg.appendChild(txt(238, 232, '多视图 Diffusion', 8, 'middle'));
    svg.appendChild(draw(svgEl('line', { x1: 326, y1: 130, x2: 352, y2: 130, stroke: MUTE, 'stroke-width': '1.2' }), 28, D, 0.56, 0.62));
    var sp = [[432, 118, 16, 9, -18, BLUE, 0.35], [420, 134, 14, 8, 20, BLUE, 0.3], [446, 136, 15, 8, -8, WARN, 0.3],
      [432, 150, 17, 9, 12, BLUE, 0.28], [424, 104, 10, 6, 30, WARN, 0.35], [444, 112, 11, 6, -25, BLUE, 0.4], [432, 166, 12, 6, 6, BLUE, 0.22]];
    var cloud = [];
    for (i = 0; i < sp.length; i++) {
      var e = svgEl('ellipse', { cx: sp[i][0], cy: sp[i][1], rx: sp[i][2], ry: sp[i][3], transform: 'rotate(' + sp[i][4] + ' ' + sp[i][0] + ' ' + sp[i][1] + ')', fill: sp[i][5], opacity: '0' });
      e.appendChild(anim('opacity', '0;0;' + sp[i][6] + ';' + sp[i][6], D, { keyTimes: '0;' + (0.6 + i * 0.03).toFixed(2) + ';' + (0.68 + i * 0.03).toFixed(2) + ';1', calcMode: 'spline', keySplines: splines(3) }));
      cloud.push(e);
    }
    svg.appendChild(rise(432, 134, D, 0.58, 0.68, cloud));
    svg.appendChild(fade(txt(432, 198, '3D Gaussian splat', 7, 'middle'), D, 0.86, 0.93));
    host.appendChild(shell('3D 生成 · 两阶段技术栈', '先生成视图，再构建几何结构', svg,
      '2026 年的文本到 3D 技术栈将问题拆分为两个阶段。多视图 Diffusion Model（Zero123、MVDream、SV3D）根据一张照片或 Prompt，生成围绕物体的一圈一致视图；随后，重建步骤通过 Gradient Descent，让一团具有方向的 3D Gaussian 拟合这些视图。渲染这些 splat 只需要投影和 alpha compositing，因此结果可以在消费级 GPU 上以实时帧率运行。'));
  }

  LF.register({
    'v4-video-temporal': videoTemporal,
    'v4-vision-pipeline': visionPipeline,
    'v4-vlm-projector': vlmProjector,
    'v4-world-rollout': worldRollout,
    'v4-alm-tokens': almTokens,
    'v4-voice-latency': voiceLatency,
    'v4-audio-watermark': audioWatermark,
    'v4-controlnet-zero': controlnetZero,
    'v4-3d-multiview': multiview3d
  });
})();
