# Browser Agents 与长时程 Web 任务

> ChatGPT agent（2025 年 7 月）将 Operator 和 deep research 合并为一个 browser/terminal agent，并在 BrowseComp 上以 68.9% 创下 SOTA。OpenAI 于 2025 年 8 月 31 日关闭 Operator——这是产品层面的整合。Anthropic 收购 Vercept 后，将 Claude Sonnet 在 OSWorld 上的成绩从低于 15% 提升到 72.5%。WebArena-Verified（ServiceNow，ICLR 2026）修正了原始 WebArena 中 11.3 个百分点的 false-negative rate，并发布了 258-task Hard subset。这些数字是真实的。攻击面也是真实的：OpenAI 的 preparedness 负责人公开表示，针对 browser agents 的 indirect prompt injection“不是一个可以被完全修补的 bug”。2025–2026 年已有记录的攻击包括：Tainted Memories（Atlas CSRF）、HashJack（Cato Networks），以及 Perplexity Comet 中的一键劫持。

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：** Phase 15 · 10 (Permission modes), Phase 15 · 01 (Long-horizon agents)
**Time:** ~45 minutes

## 问题

Browser agent 是一种 long-horizon agent：它会读取不受信任的内容，并执行有后果的操作。Agent 访问的每个页面，都是用户没有编写的输入。每个页面上的每个表单，都是潜在的命令通道。2025–2026 年的攻击语料表明这不是假设：Tainted Memories 让攻击者可以通过精心构造的页面，将恶意指令绑定到 agent 的 memory；HashJack 将命令隐藏在 agent 访问的 URL fragments 中；Perplexity Comet 的劫持只需一次点击即可命中。

防御图景并不舒服。OpenAI 的 preparedness 负责人把隐含事实说了出来：indirect prompt injection“不是一个可以被完全修补的 bug”。原因在于攻击发生在 agent 的阅读与行动边界，而这个边界在架构上是模糊的——模型读取的每个 token，原则上都可能被读作一条指令。

本课会命名这个攻击面，命名 benchmark 版图（BrowseComp、OSWorld、WebArena-Verified），并建模一个最小 indirect-prompt-injection 场景，让你可以推理 Lesson 14 和 18 中的真实防御。

## 概念

### 2026 年版图：每个系统一段话

**ChatGPT agent (OpenAI).** 2025 年 7 月发布。统一了 Operator（browsing）和 Deep Research（多小时 research）。2025 年 8 月 31 日关闭独立的 Operator。在 BrowseComp 上达到 68.9% 的 SOTA；在 OSWorld 和 WebArena-Verified 上也有强劲成绩。

**Claude Sonnet + Vercept (Anthropic).** Anthropic 收购 Vercept，重点放在 computer-use capabilities 上。将 Claude Sonnet 在 OSWorld 上的成绩从 <15% 提升到 72.5%。Claude Computer Use 作为 tool API 发布。

**Gemini 3 Pro with Browser Use (DeepMind).** Browser Use integration 发布 computer-use controls；FSF v3（2026 年 4 月，Lesson 20）专门跟踪 ML R&D 领域中的 autonomy。

**WebArena-Verified (ServiceNow, ICLR 2026).** 修复了一个有充分记录的问题：原始 WebArena 约有 11.3% 的 false-negative rate（任务被标记为失败，但实际上已经解决）。Verified release 使用人工整理的成功标准重新评分，并加入了 258-task Hard subset（ICLR 2026 paper，openreview.net/forum?id=94tlGxmqkN）。

### BrowseComp vs OSWorld vs WebArena

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同。高 BrowseComp 分数说明 agent 能找到事实；它并不说明 agent 能预订航班。OSWorld 分数更接近“它能不能在我的 desktop 上工作”。WebArena-Verified 更接近“它能不能完成一个流程”。任何生产决策都需要选择与任务分布匹配的 benchmark。

### 攻击面，命名如下

1. **Indirect prompt injection.** 不受信任的页面内容包含指令。Agent 读取它们。Agent 执行它们。公开示例：2024 Kai Greshake et al.、2025 Tainted Memories paper、2026 HashJack（Cato Networks）。
2. **URL fragment / query injection.** 被抓取 URL 的 `#fragment` 或 query string 包含命令。它们从不被可见渲染；但仍在 agent 的 context 中。
3. **Memory-binding attacks.** 页面指示 agent 写入一条 persistent memory（Lesson 12 涵盖 durable state）。下一次 session 中，该 memory 在没有可见触发器的情况下触发 payload。
4. **Authenticated sessions 上的 CSRF-shaped attacks.** Tainted Memories 类：agent 已登录某处；攻击者页面发出状态变更请求，agent 使用用户的 cookies 执行这些请求。
5. **One-click hijack.** 一个视觉上无害的按钮承载 agent 会跟随的 payload。Comet 类。
6. **Agent host surface 中的 Content-Security-Policy holes.** Rendering 和 tool layers 本身也可能成为攻击 Vector；browser-in-a-browser-agent stack 很宽。

### 为什么“不可完全修补”

这种攻击与 agent 的能力同构。Agent 必须读取不受信任的内容才能完成工作。Agent 读取的任何内容都可能包含指令。Agent 遵循的任何指令都可能与用户的真实请求不一致。防御（trust boundaries、classifiers、tool allowlists、对有后果操作的 HITL）会提高攻击成本并降低爆炸半径。它们不会关闭整个类别。

这与 Lob's theorem（Lesson 8）是同一种推理模式：agent 无法证明下一个 token 是安全的；它只能搭建一个系统，让不安全 token 更容易被检测出来。

### 真正能上线的防御姿态

- **Read / write boundary.** 读取永远不产生后果。写入（提交表单、发布内容、调用有副作用的 tool）如果由 trust boundary 外部内容发起，则需要新的人工批准。
- **Tool allowlist per task.** Agent 可以 browse；除非某个 tool 已为该任务显式启用，否则它不能发起 wire transfer。Lesson 13 涵盖 budgets。
- **Session isolation.** Browser agent sessions 只使用 scoped credentials 运行。没有 production auth，没有个人 email。保留每个 HTTP request 的日志以供 audit。
- **Content sanitizer.** Fetched HTML 在拼接进模型 context 前，会剥离 known-bad patterns。（减少容易的攻击；无法阻止复杂 payload。）
- **对 consequential actions 使用 HITL。** Propose-then-commit pattern（Lesson 15）。
- **Canary tokens on memory.** 如果一条 memory entry 触发，用户会看到它（Lesson 14）。

```figure
injection-boundary
```

## 使用它

`code/main.py` 建模了一个 tiny browser-agent run，目标是三个合成页面。一个页面是 benign，一个在可见文本中有 direct prompt-injection blob，一个有 URL-fragment injection（不可见，但位于 agent 的 context 中）。脚本展示了 (a) naïve agent 会做什么，(b) read/write boundary 会捕获什么，(c) sanitizer 会捕获什么，(d) 二者都捕获不了什么。

## 交付它

`outputs/skill-browser-agent-trust-boundary.md` 界定一个拟议 browser-agent deployment：它触达哪些 trust zones，它被授权写入什么，以及首次运行前必须就位哪些防御。

## 练习

1. 运行 `code/main.py`。找出 sanitizer 能捕获但 read/write boundary 不能捕获的攻击，以及只有 read/write boundary 能捕获的攻击。

2. 扩展 sanitizer，用它检测一类 HashJack-style URL-fragment injection。在带有合法 fragments 的 benign URLs 上测量 false-positive rate。

3. 选择一个你知道的真实 browser-agent workflow（例如，“book a flight”）。列出每一次 read 和每一次 write。标记哪些 writes 需要 HITL，以及为什么。

4. 阅读 WebArena-Verified ICLR 2026 paper。找出一个原始 WebArena 评分不可靠的任务类别，并解释 Verified subset 如何解决它。

5. 为 browser-agent setting 设计一个 memory canary。你会存储什么，存在哪里，什么会触发 alarm？

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) — Operator 和 deep research 的合并；BrowseComp SOTA。
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) — Operator lineage，以及后来成为 ChatGPT agent 的 architecture。
- [Zhou et al. — WebArena](https://webarena.dev/) — 原始 benchmark。
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) — ICLR 2026 fixed-subset paper。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — 包含 computer-use agents 的 attack-surface discussion。
