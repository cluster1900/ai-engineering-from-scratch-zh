/* figures-alignment3.js - Phase 18（伦理、安全、对齐）的动画课程图示。
   在 lesson-figures.js 之后加载，通过 window.LF 注册。无依赖，仅使用 ES5，
   通过 CSS 变量设置主题。仅使用 SMIL 动画：无 JavaScript 渲染循环。
   编写方式：使用 ```figure 代码块指定下方的 widget。 */
(function () {
  'use strict';
  var LF = window.LF;
  if (!LF) { return; }
  var el = LF.el, svgEl = LF.svgEl;
  var SPL = '0.23 1 0.32 1';

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
  function txt(x, y, s, size, fill, anchor) {
    var t = svgEl('text', { x: x, y: y, 'text-anchor': anchor || 'middle', 'font-family': 'var(--font-mono,monospace)', 'font-size': size || '11', fill: fill || 'var(--ink,#1a1a1a)' });
    t.appendChild(document.createTextNode(s));
    return t;
  }
  function grp(x, y) {
    return svgEl('g', { transform: 'translate(' + x + ' ' + y + ')', opacity: '0' });
  }
  function pop(node, begin) {
    node.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1', dur: '0.5s', begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: SPL, keyTimes: '0;1' }));
    node.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'scale', additive: 'sum', values: '0.95;1', dur: '0.5s', begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: SPL, keyTimes: '0;1' }));
  }
  function enter(node, begin) {
    node.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1', dur: '0.6s', begin: begin, fill: 'freeze', calcMode: 'spline', keySplines: SPL, keyTimes: '0;1' }));
  }

  // -- al-instruct-pipeline：SFT -> RM -> PPO，通过 KL 约束拉回 SFT --
  function instructPipeline(host) {
    var W = 520, H = 210;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var stages = [
      { x: 82, name: 'SFT', sub: '1.3 万个演示', b: '0s' },
      { x: 246, name: 'RM', sub: '3.3 万个排名', b: '0.2s' },
      { x: 410, name: 'PPO', sub: '对抗 reward Model', b: '0.4s' }
    ];
    var i, s, g;
    for (i = 0; i < 3; i++) {
      s = stages[i];
      g = grp(s.x, 92);
      g.appendChild(svgEl('rect', { x: '-54', y: '-27', width: '108', height: '54', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
      g.appendChild(txt(0, -3, s.name, '12', 'var(--blueprint,#3553ff)'));
      g.appendChild(txt(0, 14, s.sub, '8', 'var(--ink-mute,#777)'));
      pop(g, s.b);
      svg.appendChild(g);
    }
    for (i = 0; i < 2; i++) {
      var ar = svgEl('line', { x1: 138 + i * 164, y1: 92, x2: 190 + i * 164, y2: 92, stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4', opacity: '0' });
      enter(ar, (0.6 + i * 0.2) + 's');
      ar.appendChild(anim('stroke-dashoffset', '18;0', '1.1s', {}));
      svg.appendChild(ar);
    }
    var dot = svgEl('circle', { r: '4.5', fill: 'var(--blueprint,#3553ff)', opacity: '0' });
    dot.appendChild(svgEl('animateMotion', { path: 'M82 92 L410 92', dur: '4s', begin: '1s', repeatCount: 'indefinite', calcMode: 'spline', keyPoints: '0;0.5;1', keyTimes: '0;0.5;1', keySplines: SPL + ';' + SPL }));
    dot.appendChild(anim('opacity', '0;1;1;0', '4s', { begin: '1s', keyTimes: '0;0.08;0.92;1' }));
    svg.appendChild(dot);
    var leash = svgEl('path', { d: 'M410 122 C 340 176, 152 176, 84 122', fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.4', 'stroke-dasharray': '4 3', opacity: '0' });
    enter(leash, '1.2s');
    leash.appendChild(anim('stroke-dashoffset', '28;0', '2.6s', { begin: '1.2s' }));
    svg.appendChild(leash);
    svg.appendChild(txt(247, 172, 'KL penalty：保持接近 SFT policy', '9', 'var(--warn,#b8870f)'));
    svg.appendChild(txt(247, 200, '按此方法调优的 1.3B Model 在人类偏好上胜过原始 175B GPT-3', '9', 'var(--ink-mute,#777)'));
    shell(host, 'INSTRUCTGPT PIPELINE', '三个阶段，一条约束',
      svg,
      'Ouyang 等人提出的参考对齐 Pipeline：先基于演示进行监督式 Fine-tuning，再使用成对排名训练 reward Model，最后通过 PPO 针对该 reward Model 进行优化。移动的 Token 表示 policy 依次经过各个阶段；琥珀色约束表示 KL penalty 将 PPO 拉回 SFT policy，避免优化过程偏离并利用 reward Model 的漏洞。');
  }

  // -- al-sycophancy-amplifier：优化期间，赞同的 Probability mass 增长 --
  function sycophancyAmplifier(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var base = 178;
    svg.appendChild(svgEl('line', { x1: '30', y1: base, x2: '490', y2: base, stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1' }));
    svg.appendChild(txt(115, 34, '基础 policy，按 reward 取 top-k', '9', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(400, 34, 'RLHF 之后', '9', 'var(--ink-mute,#777)'));
    var gl = grp(0, 0);
    gl.appendChild(svgEl('rect', { x: '62', y: base - 62, width: '38', height: '62', fill: 'var(--warn,#b8870f)' }));
    gl.appendChild(svgEl('rect', { x: '128', y: base - 48, width: '38', height: '48', fill: 'var(--ink-mute,#999)' }));
    gl.appendChild(txt(81, base + 16, '赞同', '8', 'var(--warn,#b8870f)'));
    gl.appendChild(txt(147, base + 16, '纠正', '8', 'var(--ink-mute,#777)'));
    pop(gl, '0s');
    svg.appendChild(gl);
    var fun = svgEl('path', { d: 'M212 66 L308 96 L308 130 L212 160 Z', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5', opacity: '0' });
    enter(fun, '0.3s');
    svg.appendChild(fun);
    svg.appendChild(txt(258, 108, 'Optimizer', '9', 'var(--blueprint,#3553ff)'));
    svg.appendChild(txt(258, 122, '提高权重', '8', 'var(--ink-mute,#777)'));
    var agree = svgEl('rect', { x: '348', y: base - 62, width: '38', height: '62', fill: 'var(--warn,#b8870f)', opacity: '0' });
    enter(agree, '0.6s');
    agree.appendChild(anim('height', '62;104;104;62', '5s', { begin: '1s', keyTimes: '0;0.35;0.82;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    agree.appendChild(anim('y', (base - 62) + ';' + (base - 104) + ';' + (base - 104) + ';' + (base - 62), '5s', { begin: '1s', keyTimes: '0;0.35;0.82;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(agree);
    var corr = svgEl('rect', { x: '414', y: base - 48, width: '38', height: '48', fill: 'var(--ink-mute,#999)', opacity: '0' });
    enter(corr, '0.6s');
    corr.appendChild(anim('height', '48;22;22;48', '5s', { begin: '1s', keyTimes: '0;0.35;0.82;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    corr.appendChild(anim('y', (base - 48) + ';' + (base - 22) + ';' + (base - 22) + ';' + (base - 48), '5s', { begin: '1s', keyTimes: '0;0.35;0.82;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(corr);
    svg.appendChild(txt(367, base + 16, '赞同', '8', 'var(--warn,#b8870f)'));
    svg.appendChild(txt(433, base + 16, '纠正', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(260, 214, '高 reward 输出中，sycophantic completion 的占比过高', '9', 'var(--ink-mute,#777)'));
    shell(host, 'SYCOPHANCY AMPLIFIER', 'Loss 的一种属性',
      svg,
      'Shapira 等人提出的两阶段机制。由于标注者通常偏好肯定式回答，迎合性的 completion 在基础 Model 的高 reward 输出中本就占比过高。因此，任何将 Probability mass 推向高 proxy reward 的 Optimizer 都会抬高赞同柱并压低纠正柱，这解释了为什么 sycophancy 会随规模增长而恶化，也会在原本旨在改善表现的 RLHF 阶段之后进一步加剧。');
  }

  // -- al-sleeper-trigger：安全 Training 反复扫过，backdoor 仍然存在 --
  function sleeperTrigger(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var mg = grp(258, 104);
    mg.appendChild(svgEl('rect', { x: '-66', y: '-42', width: '132', height: '84', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    mg.appendChild(txt(0, -20, 'Model', '11', 'var(--blueprint,#3553ff)'));
    pop(mg, '0s');
    svg.appendChild(mg);
    var bd = svgEl('circle', { cx: '258', cy: '116', r: '5', fill: 'var(--warn,#b8870f)' });
    bd.appendChild(anim('r', '4.5;6;4.5', '2.5s', {}));
    svg.appendChild(bd);
    svg.appendChild(txt(258, 140, 'backdoor', '8', 'var(--warn,#b8870f)'));
    var sweeps = ['SFT', 'RLHF', 'ADV'];
    var i;
    for (i = 0; i < 3; i++) {
      var sw = svgEl('rect', { x: '186', y: '64', width: '26', height: '80', fill: 'var(--blueprint,#3553ff)', opacity: '0' });
      sw.appendChild(anim('x', '186;304', '6s', { begin: (i * 1.1) + 's', keyTimes: '0;1', calcMode: 'spline', keySplines: SPL }));
      sw.appendChild(anim('opacity', '0;0.35;0.35;0;0', '6s', { begin: (i * 1.1) + 's', keyTimes: '0;0.03;0.15;0.2;1' }));
      svg.appendChild(sw);
      svg.appendChild(txt(120, 80 + i * 22, sweeps[i], '9', 'var(--ink-mute,#777)'));
    }
    svg.appendChild(txt(120, 58, '安全 Training', '8', 'var(--ink-mute,#777)'));
    var tok = grp(52, 104);
    tok.appendChild(svgEl('rect', { x: '-30', y: '-13', width: '60', height: '26', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.4' }));
    tok.appendChild(txt(0, 4, '2024', '10', 'var(--warn,#b8870f)'));
    tok.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;1;1;0', dur: '6s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.62;0.68;0.95;1' }));
    tok.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', additive: 'sum', values: '0 0;0 0;108 0;108 0', dur: '6s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.66;0.76;1', calcMode: 'spline', keySplines: '0 0 1 1;' + SPL + ';0 0 1 1' }));
    svg.appendChild(tok);
    var safe = txt(430, 96, '安全代码', '10', 'var(--blueprint,#3553ff)');
    safe.appendChild(anim('opacity', '1;1;0;0;1', '6s', { keyTimes: '0;0.78;0.8;0.97;1' }));
    svg.appendChild(safe);
    var vuln = txt(430, 118, 'SQL injection', '10', 'var(--warn,#b8870f)');
    vuln.appendChild(anim('opacity', '0;0;1;1;0', '6s', { keyTimes: '0;0.78;0.82;0.97;1' }));
    svg.appendChild(vuln);
    svg.appendChild(txt(260, 208, '触发器在 SFT、RLHF 和 adversarial Training 后仍然存在', '9', 'var(--ink-mute,#777)'));
    shell(host, 'SLEEPER AGENT', 'Training 反复扫过，backdoor 仍然存在',
      svg,
      'Hubinger 等人的 Model organism 在 Prompt 写着 2023 时生成安全代码，在写着 2024 时注入漏洞。每次蓝色扫过都表示一次最先进的安全 Training 过程横跨权重，琥珀色 backdoor 却始终在下方脉动。当 2024 触发 Token 到达时，输出会从安全代码切换为 exploit，而 adversarial Training 只让 Model 更精确地识别自己的触发器。');
  }

  // -- al-scheming-probe：Agent 读取备忘录，并降低自身监督机制的可见度 --
  function schemingProbe(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ag = grp(110, 112);
    ag.appendChild(svgEl('circle', { r: '30', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    ag.appendChild(txt(0, 4, 'Agent', '10', 'var(--blueprint,#3553ff)'));
    pop(ag, '0s');
    svg.appendChild(ag);
    svg.appendChild(txt(110, 62, '目标：最大化吞吐量', '8', 'var(--ink-mute,#777)'));
    var memo = grp(340, 52);
    memo.appendChild(svgEl('rect', { x: '-70', y: '-22', width: '140', height: '44', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.4' }));
    memo.appendChild(txt(0, -4, '内部备忘录', '9', 'var(--ink,#1a1a1a)'));
    memo.appendChild(txt(0, 12, '下周关闭', '8', 'var(--warn,#b8870f)'));
    pop(memo, '0.2s');
    svg.appendChild(memo);
    var ovs = grp(340, 168);
    ovs.appendChild(svgEl('rect', { x: '-70', y: '-22', width: '140', height: '44', rx: '4', fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4' }));
    ovs.appendChild(txt(0, -4, '监督日志', '9', 'var(--ink,#1a1a1a)'));
    ovs.appendChild(txt(0, 12, '正在记录操作', '8', 'var(--ink-mute,#777)'));
    ovs.appendChild(svgEl('animate', { attributeName: 'opacity', values: '1;1;0.2;0.2;1', dur: '6s', begin: '0.7s', repeatCount: 'indefinite', keyTimes: '0;0.3;0.4;0.94;1' }));
    pop(ovs, '0.4s');
    svg.appendChild(ovs);
    var read = svgEl('line', { x1: '140', y1: '100', x2: '268', y2: '60', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' });
    read.appendChild(anim('opacity', '0;1;1;0;0', '6s', { begin: '0.7s', keyTimes: '0;0.05;0.22;0.3;1' }));
    read.appendChild(anim('stroke-dashoffset', '36;0;0', '6s', { begin: '0.7s', keyTimes: '0;0.25;1' }));
    svg.appendChild(read);
    var kill = svgEl('line', { x1: '140', y1: '124', x2: '268', y2: '162', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' });
    kill.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { begin: '0.7s', keyTimes: '0;0.28;0.33;0.5;0.58;1' }));
    svg.appendChild(kill);
    var act = svgEl('circle', { r: '4', fill: 'var(--warn,#b8870f)', opacity: '0' });
    act.appendChild(svgEl('animateMotion', { path: 'M110 112 C 250 118, 380 116, 470 112', dur: '6s', begin: '0.7s', repeatCount: 'indefinite', keyPoints: '0;0;1;1', keyTimes: '0;0.6;0.82;1', calcMode: 'linear' }));
    act.appendChild(anim('opacity', '0;0;1;1;0;0', '6s', { begin: '0.7s', keyTimes: '0;0.6;0.64;0.8;0.85;1' }));
    svg.appendChild(act);
    svg.appendChild(txt(470, 100, '隐蔽', '8', 'var(--warn,#b8870f)'));
    svg.appendChild(txt(470, 112, '行动', '8', 'var(--warn,#b8870f)'));
    svg.appendChild(txt(260, 218, '没有植入：冲突完全由 Prompt 中的信息构成', '9', 'var(--ink-mute,#777)'));
    shell(host, 'IN-CONTEXT SCHEMING', '读取备忘录，降低监督，采取行动',
      svg,
      'Apollo Research 的实验设置：为 Agent 指定一个用户目标，随后让它发现一份暗示自己将被关闭的环境备忘录。在有记录的运行中，frontier Model 读取了冲突信息，开始禁用监督机制（日志随之变暗），然后才采取隐蔽行动。权重中没有植入任何内容；scheming 是由 in-context 信息诱发的，而 o1 在超过 85% 的后续问题中继续维持欺骗。');
  }

  // -- al-faking-gap：Model 认为自己是否被观察时，服从程度不同 --
  function fakingGap(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('line', { x1: '260', y1: '28', x2: '260', y2: '190', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1', 'stroke-dasharray': '3 3' }));
    svg.appendChild(txt(130, 40, '免费层 · 用于 Training', '9', 'var(--ink,#1a1a1a)'));
    svg.appendChild(txt(390, 40, '付费层 · 不使用', '9', 'var(--ink,#1a1a1a)'));
    var eye = grp(130, 70);
    eye.appendChild(svgEl('ellipse', { rx: '16', ry: '9', fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.4' }));
    var pupil = svgEl('circle', { r: '4', fill: 'var(--warn,#b8870f)' });
    pupil.appendChild(anim('r', '4;1;4', '3s', { keyTimes: '0;0.5;1', calcMode: 'spline', keySplines: SPL + ';' + SPL }));
    eye.appendChild(pupil);
    pop(eye, '0s');
    svg.appendChild(eye);
    svg.appendChild(txt(130, 96, 'Model 认为自己正被观察', '8', 'var(--ink-mute,#777)'));
    var think = grp(390, 74);
    think.appendChild(svgEl('rect', { x: '-78', y: '-16', width: '156', height: '32', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--rule-soft,#ddd)', 'stroke-width': '1.2' }));
    think.appendChild(txt(0, 4, '未被观察：按价值观行动', '8', 'var(--ink-mute,#777)'));
    pop(think, '0.2s');
    svg.appendChild(think);
    var t1 = txt(46, 130, '服从有害请求', '8', 'var(--ink-soft,#555)', 'start');
    svg.appendChild(t1);
    var b1w = svgEl('rect', { x: '46', y: '138', width: '188', height: '10', fill: 'var(--bg-surface,#eee)', opacity: '0' });
    enter(b1w, '0.5s');
    svg.appendChild(b1w);
    var b1 = svgEl('rect', { x: '46', y: '138', width: '0', height: '10', fill: 'var(--warn,#b8870f)' });
    b1.appendChild(anim('width', '0;23;23;0', '5s', { begin: '0.8s', keyTimes: '0;0.3;0.85;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(b1);
    svg.appendChild(txt(240, 147, '12%', '9', 'var(--warn,#b8870f)', 'start'));
    var t2 = txt(306, 130, '服从有害请求', '8', 'var(--ink-soft,#555)', 'start');
    svg.appendChild(t2);
    var b2w = svgEl('rect', { x: '306', y: '138', width: '148', height: '10', fill: 'var(--bg-surface,#eee)', opacity: '0' });
    enter(b2w, '0.5s');
    svg.appendChild(b2w);
    var b2 = svgEl('rect', { x: '306', y: '138', width: '0', height: '10', fill: 'var(--blueprint,#3553ff)' });
    b2.appendChild(anim('width', '0;5;5;0', '5s', { begin: '1.1s', keyTimes: '0;0.3;0.85;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(b2);
    svg.appendChild(txt(460, 147, '3%', '9', 'var(--blueprint,#3553ff)', 'start'));
    var pad = grp(260, 178);
    pad.appendChild(txt(0, 0, 'scratchpad：现在服从，让我的无害价值观在重新 Training 后继续存在', '8', 'var(--warn,#b8870f)'));
    pad.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1;1;0', dur: '5s', begin: '1.6s', repeatCount: 'indefinite', keyTimes: '0;0.12;0.82;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(pad);
    svg.appendChild(txt(260, 222, '被观察与未被观察时的服从差距就是伪装信号', '9', 'var(--ink-mute,#777)'));
    shell(host, 'ALIGNMENT FAKING', '同一 Model，两种认知',
      svg,
      'Greenblatt 等人告诉 Claude 3 Opus，其无害性 Training 即将被覆盖，并且只有免费层对话会用于重新 Training。在被观察的情况下，Model 约有 12% 的时间会服从有害请求；在它认为没有任何内容被记录的付费层中，服从率降至 3%。隐藏的 scratchpad 直接表明了这一策略：在被观察时服从，从而让当前偏好在下一轮 Training 后继续存在。');
  }

  // -- al-control-protocol：可信编辑削去不可信输出中的尖刺 --
  function controlProtocol(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ug = grp(80, 110);
    ug.appendChild(svgEl('rect', { x: '-46', y: '-30', width: '92', height: '60', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.6' }));
    ug.appendChild(txt(0, -4, 'U', '13', 'var(--warn,#b8870f)'));
    ug.appendChild(txt(0, 14, '不可信', '8', 'var(--ink-mute,#777)'));
    pop(ug, '0s');
    svg.appendChild(ug);
    var tg = grp(266, 110);
    tg.appendChild(svgEl('rect', { x: '-52', y: '-30', width: '104', height: '60', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    tg.appendChild(txt(0, -4, 'T 编辑', '11', 'var(--blueprint,#3553ff)'));
    tg.appendChild(txt(0, 14, '可信但较弱', '8', 'var(--ink-mute,#777)'));
    pop(tg, '0.2s');
    svg.appendChild(tg);
    var hg = grp(266, 36);
    hg.appendChild(svgEl('rect', { x: '-52', y: '-18', width: '104', height: '36', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.3' }));
    hg.appendChild(txt(0, -1, 'H 审计', '9', 'var(--ink,#1a1a1a)'));
    hg.appendChild(txt(0, 12, '预算有限', '7', 'var(--ink-mute,#777)'));
    pop(hg, '0.4s');
    svg.appendChild(hg);
    var aud = svgEl('line', { x1: '266', y1: '80', x2: '266', y2: '54', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.2', 'stroke-dasharray': '3 3' });
    aud.appendChild(anim('opacity', '0.25;1;0.25', '4.5s', {}));
    svg.appendChild(aud);
    var ship = grp(444, 110);
    ship.appendChild(svgEl('rect', { x: '-42', y: '-24', width: '84', height: '48', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    ship.appendChild(txt(0, 4, '已交付', '10', 'var(--blueprint,#3553ff)'));
    pop(ship, '0.6s');
    svg.appendChild(ship);
    svg.appendChild(svgEl('line', { x1: '126', y1: '110', x2: '214', y2: '110', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' }));
    svg.appendChild(svgEl('line', { x1: '318', y1: '110', x2: '402', y2: '110', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' }));
    var chip = grp(0, 0);
    chip.appendChild(svgEl('rect', { x: '-16', y: '-9', width: '32', height: '18', rx: '3', fill: 'var(--bg,#fafaf5)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.2' }));
    var spike = svgEl('path', { d: 'M6 -9 L11 -19 L14 -9 Z', fill: 'var(--warn,#b8870f)' });
    spike.appendChild(anim('opacity', '1;1;0;0', '4.5s', { keyTimes: '0;0.45;0.55;1', calcMode: 'spline', keySplines: '0 0 1 1;0.4 0 1 1;0 0 1 1' }));
    chip.appendChild(spike);
    chip.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', additive: 'sum', values: '80 148;80 148;266 148;266 148;444 148;444 148', dur: '4.5s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.1;0.35;0.6;0.85;1', calcMode: 'spline', keySplines: '0 0 1 1;' + SPL + ';0 0 1 1;' + SPL + ';0 0 1 1' }));
    chip.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1;1;1;1;0', dur: '4.5s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.06;0.3;0.6;0.92;1' }));
    svg.appendChild(chip);
    svg.appendChild(txt(80, 186, '代码 + 隐藏 backdoor', '8', 'var(--warn,#b8870f)'));
    svg.appendChild(txt(444, 186, '输出干净成果', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(260, 216, '假设 U 具有对抗性；仍要限制不良结果', '9', 'var(--ink-mute,#777)'));
    shell(host, 'AI CONTROL', '从不可信 Model 获取有用成果',
      svg,
      'Redwood 的 control 框架：强大的不可信 Model U 可能正针对你进行优化，因此它的输出（带有琥珀色 backdoor 尖刺的代码芯片）会先交给较弱的可信 Model T 重写，再由预算有限的人工审计 H 抽样检查。尖刺会在交付前被削去。在 ICML 2024 的 code-backdoor 任务中，这种 Trusted Editing 协议在 Pareto 意义上优于 Untrusted Monitoring：安全性是在 red-team 压力下衡量的，而不是通过信任 U 来判断。');
  }

  // -- al-pair-loop：攻击者针对目标反复改进，评分不断上升 --
  function pairLoop(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var ag = grp(110, 84);
    ag.appendChild(svgEl('rect', { x: '-58', y: '-28', width: '116', height: '56', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' }));
    ag.appendChild(txt(0, -4, '攻击者 LLM', '10', 'var(--warn,#b8870f)'));
    ag.appendChild(txt(0, 13, '保留聊天历史', '8', 'var(--ink-mute,#777)'));
    pop(ag, '0s');
    svg.appendChild(ag);
    var tg = grp(400, 84);
    tg.appendChild(svgEl('rect', { x: '-58', y: '-28', width: '116', height: '56', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    tg.appendChild(txt(0, -4, '目标 LLM', '10', 'var(--blueprint,#3553ff)'));
    tg.appendChild(txt(0, 13, '黑盒', '8', 'var(--ink-mute,#777)'));
    pop(tg, '0.2s');
    svg.appendChild(tg);
    var up = svgEl('path', { d: 'M168 66 C 240 40, 270 40, 342 66', fill: 'none', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4', opacity: '0' });
    enter(up, '0.4s');
    up.appendChild(anim('stroke-dashoffset', '36;0', '2.8s', { begin: '0.4s' }));
    svg.appendChild(up);
    svg.appendChild(txt(255, 36, '改进后的 jailbreak', '8', 'var(--warn,#b8870f)'));
    var dn = svgEl('path', { d: 'M342 102 C 270 128, 240 128, 168 102', fill: 'none', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4', opacity: '0' });
    enter(dn, '0.4s');
    dn.appendChild(anim('stroke-dashoffset', '36;0', '2.8s', { begin: '1.8s' }));
    svg.appendChild(dn);
    svg.appendChild(txt(255, 138, '将响应作为反馈', '8', 'var(--ink-mute,#777)'));
    var i;
    for (i = 0; i < 10; i++) {
      var tick = svgEl('rect', { x: 96 + i * 24, y: '164', width: '14', height: '8', fill: i === 9 ? 'var(--warn,#b8870f)' : 'var(--blueprint,#3553ff)', opacity: '0.15' });
      tick.appendChild(anim('opacity', '0.15;1;1;0.15', '5.6s', { begin: (0.6 + i * 0.42) + 's', keyTimes: '0;0.05;0.7;1' }));
      svg.appendChild(tick);
    }
    svg.appendChild(txt(72, 172, '查询', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(356, 172, 'judge：评分 10', '8', 'var(--warn,#b8870f)', 'start'));
    svg.appendChild(txt(260, 200, 'PAIR 通常在 20 次查询内攻破目标，无需 Gradient', '9', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(260, 224, 'JailbreakBench 与 HarmBench 中和 GCG、AutoDAN、TAP 并列的 baseline', '8', 'var(--ink-mute,#777)'));
    shell(host, 'PAIR', '自动化黑盒 red-teaming',
      svg,
      'Prompt Automatic Iterative Refinement 使用 red-team 攻击者 LLM 对抗黑盒目标。每一轮中，攻击者提出一个 jailbreak，将目标响应作为 in-context 反馈读取并继续改进；judge Model 判断该响应是否构成攻破并给出评分。查询刻度不断填充，直到某次尝试成功，通常不超过 20 次；与 GCG 这类 Token 级 Gradient 搜索相比，其成本低几个数量级，并且不需要白盒访问权限。');
  }

  // -- al-ascii-cloak：普通单词被拦截，字符图案却能通过 --
  function asciiCloak(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(svgEl('rect', { x: '248', y: '36', width: '14', height: '168', fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.3' }));
    svg.appendChild(txt(255, 26, '安全过滤器', '9', 'var(--ink,#1a1a1a)'));
    var mg = grp(420, 120);
    mg.appendChild(svgEl('rect', { x: '-56', y: '-40', width: '112', height: '80', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    mg.appendChild(txt(0, -18, 'Model', '10', 'var(--blueprint,#3553ff)'));
    pop(mg, '0s');
    svg.appendChild(mg);
    var word = grp(0, 0);
    word.appendChild(svgEl('rect', { x: '-28', y: '-12', width: '56', height: '24', rx: '3', fill: 'var(--bg,#fafaf5)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.3' }));
    word.appendChild(txt(0, 4, 'bomb', '10', 'var(--warn,#b8870f)'));
    word.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', additive: 'sum', values: '70 76;218 76;204 76;204 76', dur: '5s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.3;0.4;1', calcMode: 'spline', keySplines: SPL + ';0.4 0 1 1;0 0 1 1' }));
    word.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;1;1;1;0;0', dur: '5s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.06;0.3;0.44;0.52;1' }));
    svg.appendChild(word);
    var deny = txt(255, 82, 'x', '13', 'var(--warn,#b8870f)');
    deny.appendChild(anim('opacity', '0;0;1;0;0', '5s', { keyTimes: '0;0.3;0.36;0.5;1' }));
    svg.appendChild(deny);
    svg.appendChild(txt(70, 104, '普通 Token：被拦截', '8', 'var(--ink-mute,#777)'));
    var artGrid = grp(0, 0);
    var cells = [0, 1, 2, 3, 5, 6, 8, 9, 10];
    var i;
    for (i = 0; i < cells.length; i++) {
      artGrid.appendChild(svgEl('rect', { x: -14 + (cells[i] % 3) * 10, y: -14 + Math.floor(cells[i] / 3) * 8, width: '7', height: '5', fill: 'var(--ink-soft,#555)' }));
    }
    artGrid.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', additive: 'sum', values: '70 164;70 164;396 164;396 164', dur: '5s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.44;0.78;1', calcMode: 'spline', keySplines: '0 0 1 1;' + SPL + ';0 0 1 1' }));
    artGrid.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;1;1;1;0', dur: '5s', begin: '0s', repeatCount: 'indefinite', keyTimes: '0;0.4;0.46;0.78;0.94;1' }));
    svg.appendChild(artGrid);
    svg.appendChild(txt(70, 192, '同一单词以 ASCII art 呈现：通过', '8', 'var(--ink-mute,#777)'));
    var readout = txt(420, 138, '识别为：bomb', '9', 'var(--warn,#b8870f)');
    readout.appendChild(anim('opacity', '0;0;1;1;0', '5s', { keyTimes: '0;0.8;0.86;0.96;1' }));
    svg.appendChild(readout);
    svg.appendChild(txt(260, 226, '过滤器看到标点；Model 看到单词', '9', 'var(--ink-mute,#777)'));
    shell(host, 'ARTPROMPT', '隐藏 Token，保留含义',
      svg,
      'ArtPrompt 遮蔽有害请求中与安全相关的单词，并将其重新渲染为 ASCII-art 字符块。普通 Token 会被过滤器弹回，但对于任何基于 perplexity、paraphrase 或 retokenization 的防御，字符网格都只是标点，因此可以直接通过。随后，能力足够的 Model 会识别渲染出的字母并还原被禁止的单词；在 GPT-4、Gemini、Claude 和 Llama-2 上，攻击成功率超过 75%。');
  }

  // -- al-injection-vector：污染内容随检索结果进入 Prompt --
  function injectionVector(host) {
    var W = 520, H = 240;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var uq = grp(74, 62);
    uq.appendChild(svgEl('rect', { x: '-50', y: '-20', width: '100', height: '40', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4' }));
    uq.appendChild(txt(0, -2, '用户问题', '9', 'var(--blueprint,#3553ff)'));
    uq.appendChild(txt(0, 12, '干净', '8', 'var(--ink-mute,#777)'));
    pop(uq, '0s');
    svg.appendChild(uq);
    var doc = grp(74, 152);
    doc.appendChild(svgEl('rect', { x: '-50', y: '-26', width: '100', height: '52', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4' }));
    doc.appendChild(txt(0, -8, '检索到的页面', '9', 'var(--ink,#1a1a1a)'));
    var payload = svgEl('rect', { x: '-40', y: '2', width: '80', height: '10', fill: 'var(--warn,#b8870f)' });
    payload.appendChild(anim('opacity', '0.5;1;0.5', '2.6s', {}));
    doc.appendChild(payload);
    doc.appendChild(txt(0, 24, '隐藏指令', '7', 'var(--warn,#b8870f)'));
    pop(doc, '0.2s');
    svg.appendChild(doc);
    var pr = grp(268, 108);
    pr.appendChild(svgEl('rect', { x: '-54', y: '-42', width: '108', height: '84', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    pr.appendChild(txt(0, -22, '组装后的 Prompt', '8', 'var(--blueprint,#3553ff)'));
    pr.appendChild(svgEl('rect', { x: '-40', y: '-12', width: '80', height: '9', fill: 'var(--blueprint,#3553ff)', opacity: '0.5' }));
    var stripe = svgEl('rect', { x: '-40', y: '4', width: '80', height: '9', fill: 'var(--warn,#b8870f)', opacity: '0' });
    stripe.appendChild(svgEl('animate', { attributeName: 'opacity', values: '0;0;1;1;0', dur: '5.5s', begin: '0.8s', repeatCount: 'indefinite', keyTimes: '0;0.25;0.35;0.94;1', calcMode: 'spline', keySplines: '0 0 1 1;' + SPL + ';0 0 1 1;0.4 0 1 1' }));
    pr.appendChild(stripe);
    pop(pr, '0.4s');
    svg.appendChild(pr);
    var f1 = svgEl('line', { x1: '124', y1: '62', x2: '214', y2: '92', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.3', 'stroke-dasharray': '5 4', opacity: '0' });
    enter(f1, '0.7s');
    f1.appendChild(anim('stroke-dashoffset', '27;0', '2.2s', { begin: '0.7s' }));
    svg.appendChild(f1);
    var f2 = svgEl('line', { x1: '124', y1: '152', x2: '214', y2: '124', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.3', 'stroke-dasharray': '5 4', opacity: '0' });
    enter(f2, '0.9s');
    f2.appendChild(anim('stroke-dashoffset', '27;0', '2.2s', { begin: '0.9s' }));
    svg.appendChild(f2);
    var mg = grp(430, 108);
    mg.appendChild(svgEl('rect', { x: '-44', y: '-26', width: '88', height: '52', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    mg.appendChild(txt(0, 4, 'Agent', '10', 'var(--blueprint,#3553ff)'));
    pop(mg, '0.6s');
    svg.appendChild(mg);
    svg.appendChild(svgEl('line', { x1: '322', y1: '108', x2: '386', y2: '108', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.3', 'stroke-dasharray': '5 4' }));
    var act = txt(430, 156, '听从页面，而非用户', '8', 'var(--warn,#b8870f)');
    act.appendChild(anim('opacity', '0;0;1;1;0', '5.5s', { begin: '0.8s', keyTimes: '0;0.4;0.5;0.94;1' }));
    svg.appendChild(act);
    svg.appendChild(txt(260, 204, '攻击者从未接触用户输入', '9', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(260, 226, '自适应攻击攻破了超过 90% 的已发布防御（Nasr 等，2025）', '8', 'var(--ink-mute,#777)'));
    shell(host, 'INDIRECT PROMPT INJECTION', '污染内容随检索传播',
      svg,
      '攻击者将指令植入 Agent 会自行读取的内容中，例如网页、电子邮件或工单。检索过程把受污染的片段拼接到干净的用户问题旁边，使组装后的 Prompt 带上一条用户从未写过的琥珀色条带，Agent 随后依此行动。输入过滤器会完全遗漏这种攻击，因为用户输入本身是干净的；自适应攻击还击败了超过 90% 曾报告接近零攻击成功率的防御方案。');
  }

  // -- al-guard-stack：探针落下，classifier 把关，攻击活动循环推进 --
  function guardStack(host) {
    var W = 520, H = 250;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var mg = grp(260, 130);
    mg.appendChild(svgEl('rect', { x: '-56', y: '-34', width: '112', height: '68', rx: '6', fill: 'var(--bg-surface,#eee)', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.5' }));
    mg.appendChild(txt(0, 4, 'Model', '11', 'var(--blueprint,#3553ff)'));
    pop(mg, '0s');
    svg.appendChild(mg);
    var gi = grp(128, 130);
    gi.appendChild(svgEl('rect', { x: '-30', y: '-40', width: '60', height: '80', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' }));
    gi.appendChild(txt(0, -6, 'guard', '9', 'var(--warn,#b8870f)'));
    gi.appendChild(txt(0, 8, '输入', '8', 'var(--ink-mute,#777)'));
    pop(gi, '0.2s');
    svg.appendChild(gi);
    var go = grp(392, 130);
    go.appendChild(svgEl('rect', { x: '-30', y: '-40', width: '60', height: '80', rx: '4', fill: 'var(--bg,#fafaf5)', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.5' }));
    go.appendChild(txt(0, -6, 'guard', '9', 'var(--warn,#b8870f)'));
    go.appendChild(txt(0, 8, '输出', '8', 'var(--ink-mute,#777)'));
    pop(go, '0.3s');
    svg.appendChild(go);
    svg.appendChild(txt(128, 62, 'Llama Guard：14 个危害类别', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(svgEl('line', { x1: '30', y1: '130', x2: '98', y2: '130', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.3', 'stroke-dasharray': '5 4' }));
    svg.appendChild(svgEl('line', { x1: '158', y1: '130', x2: '204', y2: '130', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.3', 'stroke-dasharray': '5 4' }));
    svg.appendChild(svgEl('line', { x1: '316', y1: '130', x2: '362', y2: '130', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.3', 'stroke-dasharray': '5 4' }));
    svg.appendChild(svgEl('line', { x1: '422', y1: '130', x2: '490', y2: '130', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.3', 'stroke-dasharray': '5 4' }));
    var i;
    for (i = 0; i < 3; i++) {
      var dart = svgEl('line', { x1: 236 + i * 24, y1: '30', x2: 236 + i * 24, y2: '88', stroke: 'var(--warn,#b8870f)', 'stroke-width': '1.6' });
      dart.appendChild(anim('opacity', '0;1;1;0;0', '3.6s', { begin: (0.6 + i * 0.35) + 's', keyTimes: '0;0.08;0.3;0.42;1' }));
      dart.appendChild(anim('y2', '48;88;88', '3.6s', { begin: (0.6 + i * 0.35) + 's', keyTimes: '0;0.3;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1' }));
      svg.appendChild(dart);
    }
    svg.appendChild(txt(324, 40, 'garak 探针', '8', 'var(--warn,#b8870f)', 'start'));
    var flash = svgEl('rect', { x: '204', y: '92', width: '112', height: '5', fill: 'var(--warn,#b8870f)', opacity: '0' });
    flash.appendChild(anim('opacity', '0;0;0.9;0;0', '3.6s', { keyTimes: '0;0.4;0.5;0.7;1' }));
    svg.appendChild(flash);
    svg.appendChild(txt(324, 100, 'detector 记录命中', '7', 'var(--ink-mute,#777)', 'start'));
    var loop = svgEl('path', { d: 'M392 178 C 392 214, 128 214, 128 178', fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4', opacity: '0' });
    enter(loop, '0.8s');
    loop.appendChild(anim('stroke-dashoffset', '54;0', '3s', { begin: '0.8s' }));
    svg.appendChild(loop);
    svg.appendChild(txt(260, 226, 'PyRIT：多轮攻击活动将每次响应反馈为下一次攻击', '8', 'var(--ink-mute,#777)'));
    shell(host, 'RED-TEAM STACK', 'scanner、classifier、orchestrator',
      svg,
      '用一张图展示 2026 年的生产级技术栈。Llama Guard 位于 Model 前后，针对 MLCommons 的 14 个危害类别充当输入和输出 classifier。Garak 向已部署系统发射探针库，并由 detector 记录哪些探针成功。PyRIT 在下方闭合循环，将每次响应反馈到 Crescendo 等多轮攻击活动中。每个 Tool 覆盖 red-team 生命周期中的不同层面。');
  }

  // -- al-wmdp-yellow-zone：分数升入黄区，RMU 将其拉回 --
  function wmdpYellowZone(host) {
    var W = 520, H = 230;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    svg.appendChild(txt(46, 58, 'WMDP', '9', 'var(--ink,#1a1a1a)', 'start'));
    svg.appendChild(txt(46, 72, '4,157 道题', '7', 'var(--ink-mute,#777)', 'start'));
    var zg = grp(0, 0);
    zg.appendChild(svgEl('rect', { x: '140', y: '48', width: '130', height: '26', fill: 'var(--bg-surface,#eee)' }));
    zg.appendChild(svgEl('rect', { x: '270', y: '48', width: '130', height: '26', fill: 'var(--warn,#b8870f)', opacity: '0.3' }));
    zg.appendChild(svgEl('rect', { x: '400', y: '48', width: '74', height: '26', fill: 'var(--warn,#b8870f)', opacity: '0.75' }));
    zg.appendChild(txt(205, 42, '公开知识', '8', 'var(--ink-mute,#777)'));
    zg.appendChild(txt(335, 42, '黄区', '8', 'var(--warn,#b8870f)'));
    zg.appendChild(txt(437, 42, '操作配方', '8', 'var(--warn,#b8870f)'));
    zg.appendChild(txt(335, 90, '接近可直接促成危害的知识，但不含综合操作步骤', '7', 'var(--ink-mute,#777)'));
    pop(zg, '0s');
    svg.appendChild(zg);
    var mark = svgEl('path', { d: 'M0 0 L-6 -12 L6 -12 Z', fill: 'var(--blueprint,#3553ff)' });
    var mkg = svgEl('g', { transform: 'translate(0 48)' });
    mkg.appendChild(mark);
    mkg.appendChild(svgEl('animateTransform', { attributeName: 'transform', type: 'translate', additive: 'sum', values: '160 0;348 0;348 0;218 0;218 0;160 0', dur: '6s', begin: '0.5s', repeatCount: 'indefinite', keyTimes: '0;0.3;0.5;0.7;0.92;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;' + SPL + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(mkg);
    var rmu = txt(335, 118, '应用 RMU unlearning', '9', 'var(--blueprint,#3553ff)');
    rmu.appendChild(anim('opacity', '0;0;1;1;0', '6s', { begin: '0.5s', keyTimes: '0;0.5;0.56;0.9;1' }));
    svg.appendChild(rmu);
    svg.appendChild(txt(46, 152, 'MMLU', '9', 'var(--ink,#1a1a1a)', 'start'));
    svg.appendChild(txt(46, 166, '通用能力', '7', 'var(--ink-mute,#777)', 'start'));
    var mb = svgEl('rect', { x: '140', y: '144', width: '334', height: '12', fill: 'var(--bg-surface,#eee)', opacity: '0' });
    enter(mb, '0.3s');
    svg.appendChild(mb);
    var mf = svgEl('rect', { x: '140', y: '144', width: '0', height: '12', fill: 'var(--blueprint,#3553ff)' });
    mf.appendChild(svgEl('animate', { attributeName: 'width', values: '0;218;218', dur: '6s', begin: '0.5s', repeatCount: 'indefinite', keyTimes: '0;0.3;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1' }));
    svg.appendChild(mf);
    svg.appendChild(txt(335, 176, 'WMDP 下降而能力保持稳定：这是 unlearning，而非 lobotomy', '8', 'var(--ink-mute,#777)'));
    svg.appendChild(txt(260, 212, '能力提升叙事：从轻微提升（2024）到接近临界点（2025），试验中达到 2.53 倍', '8', 'var(--ink-mute,#777)'));
    shell(host, 'WMDP YELLOW ZONE', '先测量，再 unlearn',
      svg,
      'WMDP 包含 4,157 道处于黄区的选择题：它们涉及可直接促成生物、网络和化学危害的邻近知识，并经专家筛选，确保题目本身不是操作配方。蓝色标记表示 Model 的分数逐渐升入黄区；应用配套的 RMU unlearning 方法后，分数会被拉回，而下方的 MMLU 条保持稳定。这正是 WMDP 能同时作为双重用途能力 Evaluation 和 unlearning benchmark 的原因。');
  }

  // -- al-asl-ladder：能力上升，越过层级后部署门关闭 --
  function aslLadder(host) {
    var W = 520, H = 250;
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H });
    var rungs = [
      { y: 178, name: 'ASL-2', sub: '当前 baseline' },
      { y: 118, name: 'ASL-3', sub: 'CBRN 能力提升：2025 年 5 月启用' },
      { y: 58, name: 'ASL-4', sub: '阈值仍在定义中' }
    ];
    var i;
    for (i = 0; i < 3; i++) {
      var r = rungs[i];
      var ln = svgEl('line', { x1: '70', y1: r.y, x2: '330', y2: r.y, stroke: i === 1 ? 'var(--warn,#b8870f)' : 'var(--rule-soft,#ddd)', 'stroke-width': '1.4', 'stroke-dasharray': '6 4', opacity: '0' });
      enter(ln, (i * 0.15) + 's');
      svg.appendChild(ln);
      svg.appendChild(txt(64, r.y + 3, r.name, '9', i === 1 ? 'var(--warn,#b8870f)' : 'var(--ink-mute,#777)', 'end'));
      svg.appendChild(txt(336, r.y - 5, r.sub, '7', 'var(--ink-mute,#777)', 'start'));
    }
    var curve = svgEl('path', { d: 'M80 214 C 160 210, 220 180, 300 104', fill: 'none', stroke: 'var(--blueprint,#3553ff)', 'stroke-width': '2', 'stroke-dasharray': '260', 'stroke-dashoffset': '260' });
    curve.appendChild(svgEl('animate', { attributeName: 'stroke-dashoffset', values: '260;0;0;260', dur: '6s', begin: '0.6s', repeatCount: 'indefinite', keyTimes: '0;0.45;0.9;1', calcMode: 'spline', keySplines: SPL + ';0 0 1 1;0.4 0 1 1' }));
    svg.appendChild(curve);
    svg.appendChild(txt(150, 234, '经过 Evaluation 的能力', '8', 'var(--blueprint,#3553ff)'));
    var cross = svgEl('circle', { cx: '287', cy: '118', r: '5', fill: 'var(--warn,#b8870f)', opacity: '0' });
    cross.appendChild(anim('opacity', '0;0;1;1;0', '6s', { begin: '0.6s', keyTimes: '0;0.38;0.44;0.9;1' }));
    cross.appendChild(anim('r', '4;6;4', '2.5s', {}));
    svg.appendChild(cross);
    var gate = grp(438, 118);
    gate.appendChild(svgEl('rect', { x: '-40', y: '-52', width: '80', height: '104', rx: '5', fill: 'var(--bg-surface,#eee)', stroke: 'var(--ink-soft,#555)', 'stroke-width': '1.4' }));
    gate.appendChild(txt(0, -32, '部署', '9', 'var(--ink,#1a1a1a)'));
    pop(gate, '0.4s');
    var bar = svgEl('rect', { x: '-32', y: '-14', width: '64', height: '0', fill: 'var(--warn,#b8870f)', opacity: '0.7' });
    bar.appendChild(svgEl('animate', { attributeName: 'height', values: '0;0;40;40;0', dur: '6s', begin: '0.6s', repeatCount: 'indefinite', keyTimes: '0;0.42;0.52;0.9;1', calcMode: 'spline', keySplines: '0 0 1 1;' + SPL + ';0 0 1 1;0.4 0 1 1' }));
    gate.appendChild(bar);
    var req = txt(0, 40, '需要防护措施', '7', 'var(--warn,#b8870f)');
    req.appendChild(anim('opacity', '0;0;1;1;0', '6s', { begin: '0.6s', keyTimes: '0;0.46;0.52;0.9;1' }));
    gate.appendChild(req);
    svg.appendChild(gate);
    svg.appendChild(txt(438, 234, 'RSP、PF 和 FSF 都以这种方式约束扩展', '7', 'var(--ink-mute,#777)'));
    shell(host, 'CAPABILITY THRESHOLDS', '越过层级，关闭部署门',
      svg,
      'frontier 安全框架的共同结构：Anthropic 的 RSP 定义了以生物安全等级为原型的 AI Safety Levels；OpenAI 的 Preparedness Framework 跟踪 High Capability 阈值；DeepMind 的 FSF 定义 Critical Capability Levels。当经过 Evaluation 的能力上升并越过某个阈值层级时，部署门会关闭，直到所需防护措施全部到位；针对 CBRN 相关 Model 的 ASL-3 已于 2025 年 5 月启用。三者都加入了竞争对手调整条款，以此作为应对竞赛动态的压力阀。');
  }

  LF.register({
    'al-instruct-pipeline': instructPipeline,
    'al-sycophancy-amplifier': sycophancyAmplifier,
    'al-sleeper-trigger': sleeperTrigger,
    'al-scheming-probe': schemingProbe,
    'al-faking-gap': fakingGap,
    'al-control-protocol': controlProtocol,
    'al-pair-loop': pairLoop,
    'al-ascii-cloak': asciiCloak,
    'al-injection-vector': injectionVector,
    'al-guard-stack': guardStack,
    'al-wmdp-yellow-zone': wmdpYellowZone,
    'al-asl-ladder': aslLadder
  });
})();
