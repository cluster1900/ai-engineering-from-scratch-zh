# Tool Use 和 Function Calling

> Toolformer (Schick et al., 2023) 开创了 self-supervised tool annotation。Berkeley Function Calling Leaderboard V4 (Patil et al., 2025) 设定了 2026 年标准：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination。Single-turn 已经解决。Memory、dynamic decision-making 和 long-horizon tool chains 还没有解决。

**Type:** Build
**Languages:** Python (stdlib)
**前置要求:** Phase 14 · 01 (Agent Loop), Phase 13 · 01 (Function Calling Deep Dive)
**Time:** ~60 分钟

## 学习目标
- 解释 Toolformer 的 self-supervised training signal：只有当执行能降低 next-Token Loss 时，才保留 tool annotations。
- 说出 BFCL V4 的五个 evaluation categories，以及每一类衡量什么。
- 实现一个 stdlib tool registry，包含 schema validation、argument coercion 和 execution sandboxing。
- 诊断 2026 年的三个 open problems：long-horizon tool chaining、dynamic decision-making 和 memory。

## 问题
早期 tool use 问的是：model 能否预测一个正确的 function call？现代 tool use 问的是：model 能否跨 40 个步骤链式调用 tools，具备 memory，处理 partial observability，从 tool failures 中恢复，并且不 hallucinate 不存在的 tools？

Toolformer 建立了基线：models 可以通过 self-supervision 学会何时调用 tools。BFCL V4 定义了 2026 年的 evaluation target。二者之间的差距，就是 production agents 所处的空间。

## 概念
### Toolformer (Schick et al., NeurIPS 2023)

思路：让 model 用 candidate API calls 标注自己的 pretraining corpus。对每个 candidate 执行它。只有当包含 tool result 能降低下一个 Token 上的 Loss 时，才保留该 annotation。然后在过滤后的 corpus 上 fine-tune。

覆盖的 tools：calculator、QA system、search engines、translator、calendar。self-supervision signal 纯粹关注 tool 是否有助于预测文本，不需要 human labels。

规模结果：tool use 会在规模足够时涌现。较小的 models 会因 tool annotations 受损；较大的 models 会受益。这就是为什么 2026 年的 frontier models 内置了强 tool use 能力，而多数 7B models 需要显式 tool-use fine-tuning 才可靠。

### Berkeley Function Calling Leaderboard V4 (Patil et al., ICML 2025)

BFCL 是 2026 年事实上的 evaluation。V4 构成：

- **Agentic (40%)** — 完整 agent trajectories：memory、multi-turn、dynamic decisions。
- **Multi-Turn (30%)** — 带 tool chains 的交互式 conversations。
- **Live (10%)** — 用户提交的真实 prompts（更难的分布）。
- **Non-Live (10%)** — synthetic test cases。
- **Hallucination (10%)** — 检测何时不应调用 tool。

V3 引入了 state-based evaluation：在 tool sequence 之后，检查 API 的实际状态（例如“文件是否已创建？”），而不是匹配 tool calls 的 AST。V4 增加了 web search、memory 和 format sensitivity categories。

2026 年关键发现：single-turn function calling 基本已经解决。失败集中在 memory（跨 turns 携带 context）、dynamic decision-making（基于先前结果选择 tools）、long-horizon chains（20+ steps 后漂移）和 hallucination detection（没有合适 tool 时拒绝调用）。

### Tool schema

每个 provider 都有一个 schema。细节不同，但共享同一种形状：

```
name: string
description: string (what it does, when to use it)
input_schema: JSON Schema (properties, required, types, enums)
```

Anthropic 直接使用 `input_schema`。OpenAI 使用 `function.parameters`。两者都接受 JSON Schema。Descriptions 承担关键作用，model 会读取它们来选择正确的 tool。糟糕的 tool descriptions 是选错 tool 失败的第一大根因。

### Argument validation

不要信任任何 tool call。验证：

1. **Type coercion.** Model 可能在 schema 要求 int 的地方返回字符串 `"5"`。如果明确无歧义就 coerce；否则 reject。
2. **Enum validation.** 如果 schema 写的是 `status in {"open", "closed"}`，而 model 输出 `"in_progress"`，就用描述性 error reject。
3. **Required fields.** 缺少 required field -> 立即把 error observation 返回给 model，而不是 crash。
4. **Format validation.** Dates、emails、URLs — 用具体 parsers 验证，而不是 regex。

每个 validation failure 都应返回结构化 observation，让 model 能用正确形状重试。

### Parallel tool calls

现代 providers 支持在一个 assistant turn 中并行 tool calls。Loop：

1. Model 发出 3 个 tool calls，每个都有不同的 `tool_use_id`。
2. Runtime 执行它们（如果相互独立则并行）。
3. 每个 result 都作为 `tool_result` block 返回，并通过 `tool_use_id` 关联。

工程规则：把 correlation IDs 当作关键约束。把它们交换，就会导致 wrong-tool-to-wrong-result routing。

### Sandboxing

Tool execution 是 sandbox boundary。详情见 Lesson 09。简短版本：每个 tool 都应指定 read/write surface、network access、timeout、memory cap。通用的 `run_shell(cmd)` 是危险信号；具体的 `git_status()` 更安全。


```figure
tool-routing
```

## 构建它
`code/main.py` 实现了一个 production-shape tool registry：

- JSON Schema subset validator（仅 stdlib）。
- Tool registration，包含 description、input schema、timeout 和 executor。
- Argument coercion 和 enum validation。
- 带 correlation IDs 的 parallel tool dispatch。
- 作为结构化 strings 的 error observations。

运行它：

```
python3 code/main.py
```

Trace 展示了一个 mini agent 在一个 turn 中调用三个 tools，其中一个故意 malformed call 会被拒绝，并返回 model 可以据此行动的描述性 error。

## 使用它
每个 provider 都有自己的 tool schema：Anthropic、OpenAI、Gemini、Bedrock。如果需要 multi-provider，请使用 translation layer（OpenAI Agents SDK、Vercel AI SDK、LangChain tool adapter）。BFCL 是参考 benchmark；如果 tool use 是产品核心，发布前请用它测试你的 agent。

## 交付它
`outputs/skill-tool-registry.md` 会为给定 task domain 生成 tool catalog、schema 和 registry。包含 description-quality checks（每个 tool 的 description 是否告诉 model 何时使用它？）。

## 练习
1. 添加一个 "no-op" tool，让 model 能显式拒绝使用任何其他 tool。在类似 BFCL 的 hallucination test 上测量。
2. 为 int-as-string 和 float-as-string 实现 argument coercion。coercion 从哪里开始会掩盖真实 bugs？
3. 添加 per-tool timeout 和 circuit breaker（连续失败 3 次后，在 60s 内拒绝该 tool）。这会如何改变 model 的恢复方式？
4. 阅读 BFCL V4 description。选择一个 category（例如 "multi-turn"），并让你的 agent 跑 10 个 example prompts。报告 pass rate。
5. 将 stdlib validator 移植到 Pydantic 或 Zod。Pydantic/Zod 捕获了 toy 没捕获到的什么？

## 关键术语
| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Function calling | "Tool use" | 使用 validated schema 的 structured-output tool invocation |
| Toolformer | "Self-supervised tool annotation" | Schick 2023 — 保留那些结果能降低 next-Token Loss 的 tool calls |
| BFCL | "Berkeley Function Calling Leaderboard" | 2026 benchmark：40% agentic、30% multi-turn、10% live、10% non-live、10% hallucination |
| Tool schema | "给 model 的 function signature" | name、description、arguments 的 JSON Schema |
| tool_use_id | "Correlation ID" | 将 tool call 与其 result 绑定；对 parallel dispatch 至关重要 |
| Hallucination detection | "知道何时不调用" | V4 category：没有合适 tool 时拒绝调用 |
| Argument coercion | "String-to-int repair" | 针对可预测 schema mismatch 的窄修复；如果有歧义则 reject |
| Sandboxing | "Tool execution boundary" | 每个 tool 的 read/write surface、network、timeout、memory cap |

## 延伸阅读
- [Schick et al., Toolformer (arXiv:2302.04761)](https://arxiv.org/abs/2302.04761) — self-supervised tool annotation
- [Berkeley Function Calling Leaderboard (V4)](https://gorilla.cs.berkeley.edu/leaderboard.html) — 2026 eval benchmark
- [Anthropic, Tool use documentation](https://platform.claude.com/docs/en/agent-sdk/overview) — Claude Agent SDK 中的 production tool schema
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — function tool type 和 Guardrails
