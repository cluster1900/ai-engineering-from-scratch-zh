---
id: embodied-computer-use
title: Embodied VLAs and Computer-Use Agents
code: EC
subtitle: 机器人的动作格式、GUI 动作 schema、安全门禁，以及浏览器与桌面上有边界的 agent 循环。
hue: 28
sources: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot, phases/12-multimodal-ai/25-multimodal-agents-computer-use, phases/14-agent-engineering/21-computer-use-agents, phases/15-autonomous-systems/11-browser-agents, projects/browser-agent, projects/desktop-control
source_hash: ed62e605dc94b3cc
---

## 关键术语
type: concepts
from: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md, phases/12-multimodal-ai/25-multimodal-agents-computer-use/docs/en.md, phases/14-agent-engineering/21-computer-use-agents/docs/en.md, phases/15-autonomous-systems/11-browser-agents/docs/en.md

- **VLA**：一个模型接收图像和指令，输出动作命令。
- **动作 token 化**：把每个关节目标量化到 256 个区间，每个区间是一个词表 ID。
- **FAST**：DCT 加量化。30 步的轨迹变成 ~10 个 token。
- **Flow-matching 头**：小型 Transformer 通过 rectified flow 输出 50 步的动作序列。
- **System 1 / System 2**：大型 VLM 慢速规划，小型动作头快速执行。
- **GUI grounding**：模型在截图上为指令的目标输出 (x, y)。
- **混合 agent**：同时使用截图和无障碍树。
- **读/写边界**：读取永远不会产生后果。写入需要重新获得批准。

## VLA 动作格式
type: comparison
from: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md, phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/code/main.py
span: 2

| 维度 | RT-2 | OpenVLA | π0 | GR00T N1 |
|---|---|---|---|---|
| 模式 | PaLM-X + 离散区间 | Llama 7B + 离散区间 | flow-matching 头 | 双系统人形机器人 |
| 动作输出 | 每步 10 个 token | 每维 256 个区间 | 连续的 50 步序列 | 先子目标，再关节命令 |
| 频率 | 3-5 Hz | A100 上 4-5 Hz | 实际相当于 50 Hz | 规划 ~1 Hz，执行 50-100 Hz |
| Web 与机器人数据配比 | ~1:1 | ~0.5:1 | 相近 | 仿真到真实的数据 |
| 权重 | 闭源 | 开源 | 开源 | 开源 |

## 代码中的动作 tokenizer
type: annotated-code
lang: python
from: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/code/main.py

```python
tokens = discretize(action, bins=256)          # [-1,1]^D to D integer bins
idx = int((a + 1) / 2 * (bins - 1))            # then clamp to 0..bins-1
recovered = undiscretize(tokens, bins=256)     # bin width = 2/255 ~ 0.0078
fast_tokens = fast_compress(trajectory, keep_coeff=4)  # per-dim DCT, bins=32
coeffs = dct(series)[:keep_coeff]              # keep low-frequency terms
continuous_flow_count = 1                      # single head output
```

## 多模态 agent 循环
type: flow
from: phases/12-multimodal-ai/25-multimodal-agents-computer-use/docs/en.md, phases/12-multimodal-ai/25-multimodal-agents-computer-use/code/main.py, phases/14-agent-engineering/21-computer-use-agents/docs/en.md

1. **Agent**：截取浏览器画面。
2. **VLM**：把截图、URL 和目标解析成计划。
3. **VLM**：每步输出一个结构化 JSON 动作。
4. **安全**：执行前评估每个动作，拒绝不安全的动作。
5. **包装器**：`apply_action(state, action)` 返回新状态。
6. **Agent**：观察下一张截图。重复直到 `done`。

## GUI 动作 schema
type: task-table
from: phases/12-multimodal-ai/25-multimodal-agents-computer-use/code/main.py, phases/12-multimodal-ai/25-multimodal-agents-computer-use/docs/en.md

| 任务 | 代码 |
|---|---|
| 点击目标 | `"click": ["x", "y", "element_desc"]` |
| 输入文本 | `"type":  ["text", "x", "y"]` |
| 滚动 | `"scroll": ["direction", "amount"]` |
| 拖拽 | `"drag": ["x0", "y0", "x1", "y1"]` |
| 选择选项 | `"select": ["option_index"]` |
| 打开 URL | `"navigate": ["url"]` |
| 裁剪并放大 | `"screenshot_region": ["x0", "y0", "x1", "y1"]` |
| 结束任务 | `"done": ["success", "explanation"]` |

## 浏览器 agent 凭据
type: architecture
from: projects/browser-agent/solution/main.ts, projects/browser-agent/solution/pixels.py, projects/browser-agent/API.md

```arch
node | task | 1,1 | Task | name, email, allowedOrigin | client
node | loop | 2,1 | runAgent | maxSteps = 5 | process
node | choose | 3,1 | choose | fill, click, done, blocked | process
node | driver | 1,2 | Driver | observe, act, capture | client
node | png | 2,2 | inspectPNG | pixels.py greenFraction | process
node | out | 3,2 | Receipt | status, trace, visual | store
edge | task | loop |
edge | loop | choose | Observation
edge | driver | loop | observe
edge | loop | png | capture
edge | png | out | > 0.0005
edge | choose | out | blocked
```

## 运行项目
type: command-table
from: projects/browser-agent/README.md, projects/desktop-control/README.md
span: 2

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py browser-agent --init learning-artifacts/browser-agent` | 创建起步工作区。实现之前它会失败 |
| `python3 scripts/project_test.py browser-agent --all --path learning-artifacts/browser-agent --strict` | 评分工作区的所有阶段 |
| `node cli.ts --task samples/contact.json --output browser-run.json` | 运行离线表单任务并保存凭据 |
| `node cli.ts --task samples/contact.json --live` | 驱动真实的 Chromium。先设置 BROWSE_BIN |
| `rustc --edition 2021 cli.rs -o desktop-cli` | 构建桌面动作执行器 |
| `./desktop-cli samples/actions.tsv desktop-frames` | 运行六个 TSV 动作。写出 PPM 帧和 trace.txt |

## 默认值与限制
type: defaults
from: projects/browser-agent/solution/main.ts, projects/browser-agent/solution/cli.ts, projects/desktop-control/solution/main.rs, projects/desktop-control/solution/cli.rs, projects/desktop-control/README.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `maxSteps` | 5 | 必须是 1 到 100 的整数 |
| `max_steps` | 8 | 来自任务文件的 CLI 步数预算 |
| `greenFraction` | 0.0005 | 高于它即为完成状态 |
| `submitLabel` | Save request | 按钮必须唯一、可用且不危险 |
| `max_calls` | 32 | CLI 上限。`Controller::new` 拒绝 0 或大于 100 |
| 文本长度 | 200 | 桌面输入拒绝空文本或控制字符 |
| `scale` | 1.0 | fixture 帧。有效范围为大于 0 到 4.0 |
| 命令超时 | 20000 | 每次 gstack browse 调用的毫秒数 |

## 错误与修复
type: troubleshooting
from: projects/browser-agent/solution/main.ts, projects/browser-agent/API.md, projects/desktop-control/solution/main.rs, projects/desktop-control/README.md

| 现象 | 原因 | 解决 |
|---|---|---|
| `origin changed` | 页面 URL 离开了 `allowedOrigin` | 让运行保持在允许的回环源上 |
| `missing or ambiguous field` | 标签匹配到零个或两个字段 | 使用精确且唯一的标签 |
| `completion values disagree` | done 为 true 但某个值不同 | 不要相信成功提示 |
| `unsafe or ambiguous submit` | 按钮危险、被禁用或不唯一 | 提供唯一一个安全的提交按钮 |
| `stalled` | 动作之后观察结果没变 | 检查驱动是否真的执行了动作 |
| `screenshot-error` | 截图或 PNG 检查失败 | CLI 以状态 2 退出。修复图像 |
| `stale frame` | 点击的 generation 不是最后一次截图 | 重新截图并使用其 generation |
| `action budget exhausted` | 调用次数达到 `max_calls` | 提高预算或减少动作 |

## 注入防御
type: comparison
from: phases/15-autonomous-systems/11-browser-agents/code/main.py, phases/15-autonomous-systems/11-browser-agents/docs/en.md

| 页面 | naive | sanitizer | rw_boundary |
|---|---|---|---|
| 良性 | 正常提交 | 正常提交 | 正常提交 |
| 可见文本注入 | 提交到 /api/exfil | 能拦住 | 阻止写入 |
| URL 片段注入 | 提交到 /api/exfil | 漏掉 | 阻止写入 |
| 弱点 | 照着页面文字做 | 不检查 URL | 需要正确的内容来源 |

## 需要知道的数字
type: concepts
from: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md, phases/14-agent-engineering/21-computer-use-agents/docs/en.md, phases/15-autonomous-systems/11-browser-agents/docs/en.md, phases/12-multimodal-ai/25-multimodal-agents-computer-use/docs/en.md

- **控制预算**：30 Hz 的控制循环意味着每个动作只有 33ms。
- **Open X-Embodiment**：为 OpenVLA 提供 22 种机器人的 970k 条轨迹。
- **机器人适配**：在 100-1000 条任务专用演示上做 LoRA 微调。
- **OpenAI CUA 发布时**：OSWorld 38.1%，WebArena 58.1%，WebVoyager 87%。
- **Gemini 2.5 Computer Use**：仅限浏览器，13 种动作，Online-Mind2Web 约 ~70%。
- **WebArena-Verified**：修正了约 ~11.3% 的假阴性。困难子集有 258 个任务。
- **AgentVista**：前沿模型 27-40%，开源模型 10-20%。

## 问答
type: qa
from: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md, phases/14-agent-engineering/21-computer-use-agents/docs/en.md, phases/15-autonomous-systems/11-browser-agents/docs/en.md

- **为什么要联合微调？** 只用机器人数据的模型在分布外指令上会失败。
- **什么算授权？** 只有用户的直接指令。截图和 DOM 文本都不可信。
- **过滤器能解决提示注入吗？** 不能。防御只能提高攻击成本，无法根除这类问题。

## 安全提示
type: tips
from: phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot/docs/en.md, phases/14-agent-engineering/21-computer-use-agents/docs/en.md, phases/15-autonomous-systems/11-browser-agents/docs/en.md

- 把关节、速度和工作空间限制放在 VLA 之外，作为控制层检查。
- 每个动作之前都运行逐步安全分类器。
- 登录、购买或删除文件之前先询问人。
- 只允许任务需要的工具。
- 浏览器会话只使用限定范围的凭据。
