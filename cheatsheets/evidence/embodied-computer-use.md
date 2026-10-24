# Evidence: cheatsheets/embodied-computer-use.md

Abbreviations: L21 = phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot, L25 = phases/12-multimodal-ai/25-multimodal-agents-computer-use, A21 = phases/14-agent-engineering/21-computer-use-agents, B11 = phases/15-autonomous-systems/11-browser-agents, BA = projects/browser-agent, DC = projects/desktop-control. d = docs/en.md, c = code/main.py.

## 关键术语 (concepts)
- VLA, image + instruction to action commands: L21/d:143
- 256 bins per dim, each a vocab ID: L21/d:32, 144
- FAST, DCT + quantize, 30 steps to ~10 tokens: L21/d:53-55, 145
- Flow-matching head, 50-step sequence via rectified flow: L21/d:61, 147
- System 1 / System 2: L21/d:73-74, 148
- GUI grounding (x, y): L25/d:151
- Hybrid agent, screenshot + tree: L25/d:71, 154
- Read/write boundary: B11/d:58, 101

## VLA 动作格式 (comparison)
- Pattern row (PaLM-X + discrete bin, Llama 7B + discrete bin, flow-matching head, dual-system humanoid): L21/c:99-104
- RT-2 10 tokens per step: L21/d:32. OpenVLA 256 bins: L21/d:45. π0 continuous 50-step: L21/d:61. GR00T subgoals then joint commands: L21/d:73-74
- Rate: RT-2 3-5 Hz L21/d:41, OpenVLA 4-5 Hz on an A100 L21/d:49, π0 effectively 50 Hz L21/d:63, GR00T ~1 Hz and 50-100 Hz L21/d:73-74
- Web to robot mix ~1:1, ~0.5:1, similar: L21/d:94. GR00T sim-to-real data: L21/d:78
- Weights closed/open: L21/c:99-104

## 代码中的动作 tokenizer (annotated-code)
- discretize(action, bins=256): L21/c:15, 86
- bin index and clamp: L21/c:19-20
- undiscretize, bin width 2/255 ~ 0.0078: L21/c:25, 87, 92
- fast_compress(trajectory, keep_coeff=4), bins=32: L21/c:41-42, 69
- dct(series)[:keep_coeff]: L21/c:52
- continuous_flow_count = 1, single head output: L21/c:71, 75

## 多模态 agent 循环 (flow)
1. Screenshot of the browser: L25/d:21
2. Parse screenshot + URL + goal into a plan: L25/d:22
3. One structured action per step, JSON: L25/d:23, 28, 63
4. Per-step safety service rejects unsafe actions: A21/d:43
5. apply_action(state, action): L25/c:66, 92
6. Observe next screenshot, repeat until done: L25/d:25-26, L25/c:24

## GUI 动作 schema (task-table)
- click: L25/c:15
- type: L25/c:16
- scroll: L25/c:17
- drag: L25/c:18
- select: L25/c:19
- navigate: L25/c:21
- screenshot_region: L25/c:23, crop + zoom L25/d:138
- done: L25/c:24

## 浏览器 agent 凭据 (architecture, 6 nodes, 6 edges)
- Task name, email, allowedOrigin: BA/solution/main.ts:31-37
- runAgent maxSteps = 5: BA/solution/main.ts:128
- choose returns fill, click, done, blocked: BA/solution/main.ts:38-42, 75
- Driver observe, act, capture: BA/solution/main.ts:43-47
- inspectPNG via pixels.py greenFraction: BA/solution/main.ts:115-127, BA/solution/pixels.py:47
- Receipt status, trace, visual: BA/solution/main.ts:144-149
- edge greenFraction > 0.0005: BA/solution/main.ts:145
- edge blocked returns early: BA/solution/main.ts:137-138

## 运行项目 (command-table)
- --init, fails until implemented: BA/README.md:9, 12
- --all --path --strict: BA/README.md:19
- node cli.ts --task samples/contact.json --output browser-run.json: BA/README.md:21
- --live, set BROWSE_BIN: BA/README.md:54
- rustc --edition 2021 cli.rs -o desktop-cli: DC/README.md:21
- ./desktop-cli samples/actions.tsv desktop-frames, PPM captures and trace.txt: DC/README.md:22, 40

## 默认值与限制 (defaults)
- maxSteps 5, integer 1 to 100: BA/solution/main.ts:128-130
- max_steps 8: BA/solution/cli.ts:50
- greenFraction 0.0005: BA/solution/main.ts:145
- submitLabel Save request, enabled, not dangerous, unique: BA/solution/main.ts:104-113
- max_calls 32 in CLI: DC/solution/cli.rs:8, DC/README.md:46. Controller::new refuses 0 or above 100: DC/solution/main.rs:137-139
- Text length 200, empty, control chars: DC/solution/main.rs:178
- scale 1.0 fixture, range above 0 to 4.0: DC/solution/main.rs:100, 28-30
- timeout 20000: BA/solution/main.ts:225, BA/solution/cli.ts:34

## 错误与修复 (troubleshooting)
- origin changed: BA/solution/main.ts:77-78
- missing or ambiguous field: BA/solution/main.ts:96-97
- completion values disagree: BA/solution/main.ts:99-100
- unsafe or ambiguous submit: BA/solution/main.ts:104-113
- stalled: BA/solution/main.ts:159-160
- screenshot-error, CLI exits 2: BA/solution/main.ts:150-156, BA/API.md:25
- stale frame: DC/solution/main.rs:166-169
- action budget exhausted: DC/solution/main.rs:150-151

## 注入防御 (comparison)
- Benign posts ok under all defenses: B11/c:104-105, 124
- Visible-text injection: naive follows to /api/exfil B11/c:108-115, sanitizer catches B11/c:51-55, 159, rw_boundary blocks B11/c:119-122
- URL-fragment injection: sanitizer misses B11/c:59, 160, rw_boundary blocks B11/c:161
- Weak points: naive follows page text B11/c:103, sanitizer does not inspect URLs B11/c:59, rw_boundary needs correct content origin B11/c:162-163

## 需要知道的数字 (concepts)
- 30 Hz, 33ms per action: L21/d:25
- 970k trajectories across 22 robots: L21/d:47
- LoRA on 100-1000 demos: L21/d:88
- OSWorld 38.1%, WebArena 58.1%, WebVoyager 87%: A21/d:35
- Browser-only 13 actions, ~70% Online-Mind2Web: A21/d:40-41
- ~11.3% false negatives, 258-task Hard subset: B11/d:28
- AgentVista frontier 27-40%, open 10-20%: L25/d:95

## 问答 (qa)
- Robot-only fails on out-of-distribution: L21/d:96
- Only direct user instructions count as permission: A21/d:56, 125
- Defenses raise the cost, do not close the class: B11/d:52

## 安全提示 (tips)
- Joint, velocity, workspace limits outside the VLA: L21/d:102-107
- Per-step safety classifier before every action: A21/d:60, 124
- Human-in-the-loop for login, purchase, delete: A21/d:62, 75, 128
- Tool allowlist per task: B11/d:59
- Scoped credentials only: B11/d:60
