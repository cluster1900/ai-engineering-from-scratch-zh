# Eval 驱动的 Agent 开发

> Anthropic 的指导：“从简单 prompt 开始，用全面评估优化它们，并且只在需要时才添加多步 agentic 系统。”评估不是最后一步。它是驱动 Phase 14 中其他所有选择的外层循环。

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 全部内容。
**Time:** ~60 分钟

## 学习目标
- 说出三个评估层级 — static benchmarks、custom offline、online production — 以及各自用途。
- 解释 evaluator-optimizer 紧密循环。
- 描述 2026 best practice：evals 与代码放在一起，在 CI 中运行，并作为 PR gate。
- 将 Phase 14 的每一课连接到它生成的 eval case。

## 问题
Agents 能通过 demo。它们会在生产中以 demo 无法预测的方式失败。Benchmarks 回答的是“这个模型是否具备广泛能力？”而不是“这个 agent 是否正在为我的产品交付正确 patch？”答案是：在三个层级持续运行评估，并把每个 guardrail 和学到的规则都映射到一个 eval case。

## 概念
### 三个评估层级

1. **Static benchmarks** — 用于代码的 SWE-bench Verified（Lesson 19）、用于浏览 / 桌面的 WebArena/OSWorld（Lesson 20）、用于 generalist 的 GAIA（Lesson 19）、用于 tool use 的 BFCL V4（Lesson 06）。用于跨模型比较和 regression gating。污染是真实存在的：SWE-bench+ 发现 32.67% 的 solution leakage。始终报告 Verified / +-audited 分数。

2. **Custom offline evals** — 你的产品形态：
   - LLM-as-judge（Langfuse、Phoenix、Opik — Lesson 24）。
   - Execution-based（运行 patch，检查测试）。
   - Trajectory-based（将 action sequences 与 gold 对比；OSWorld-Human 显示顶级 agents 是 gold 的 1.4-2.7x）。

3. **Online evals** — 生产：
   - Session replays（Langfuse）。
   - Guardrail 触发的告警（Lesson 16、21）。
   - 单步成本 / 延迟跟踪（Lesson 23 OTel spans）。

### Evaluator-optimizer（Anthropic）

紧密循环：

1. Proposer 生成输出。
2. Evaluator 进行判断。
3. 反复 refine，直到 evaluator 通过。

这是泛化后的 Self-Refine（Lesson 05）。任何你重视的 agent flow 都可以包装进 evaluator-optimizer，以提升可靠性。

### 2026 best practice

- Evals 与代码放在一起。
- 在每个 PR 上通过 CI 运行。
- 根据 eval scores gate merge（例如“相对 main 不允许 regression > 5%”）。
- 每个 guardrail 都映射到一个 eval case。
- 每条学到的规则（Reflexion、pro-workflow learn-rule）都映射到一个 failure case。

### 将 Phase 14 串起来

Phase 14 中的每一课都会生成 eval cases：

| Lesson | 它生成的 Eval case |
|--------|------------------------|
| 01 Agent Loop | Budget-exhausted、infinite-loop guard |
| 02 ReWOO | 当 tool 失败时，Planner 能正确 replans |
| 03 Reflexion | 学到的 reflections 会在 retry 时应用 |
| 05 Self-Refine/CRITIC | Judge 通过 refined output |
| 06 Tool Use | Argument coercion 生效；unknown tools 被拒绝 |
| 07-10 Memory | Retrieval citations 与 sources 匹配；stale facts 失效 |
| 12 Workflow Patterns | 每种 pattern 都产生正确输出 |
| 13 LangGraph | Resume 精确复现 state |
| 14 AutoGen Actors | DLQ 捕获 crashed handlers |
| 16 OpenAI Agents SDK | Guardrail 在正确输入上触发 |
| 17 Claude Agent SDK | Subagent results 返回 orchestrator |
| 19-20 Benchmarks | SWE-bench Verified score、WebArena success rate、OSWorld efficiency |
| 21 Computer Use | Per-step safety 捕获 injected DOM |
| 23 OTel | Spans 发出 required attributes |
| 26 Failure Modes | Detectors 标记 known failures |
| 27 Prompt Injection | PVE 拒绝 poisoned retrievals |
| 28 Orchestration | Supervisor 路由到正确 specialist |
| 29 Runtime Shapes | DLQ 处理 N% failure |

如果你的 eval suite 覆盖了每一项，你就覆盖了 Phase 14。

### Eval 驱动开发会在哪里失败

- **没有 baseline。** 没有 last-known-good 的 evals 无法解读。存储 baselines。
- **LLM-judge 没有 grounding。** Judges 也会 hallucinate。CRITIC pattern（Lesson 05）— judge 基于 external tools grounding。
- **过拟合 evals。** 为 eval 优化会偏离生产实用性。轮换 cases。
- **Flaky evals。** 非确定性 cases 会造成 false alarms。固定 seeds，snapshot state。

## 构建它
`code/main.py` 是一个 stdlib eval harness：

- 带 categories（benchmark、custom、online）的 Case registry。
- 一个 scripted agent under test。
- Evaluator-optimizer loop：propose、judge、refine，直到 pass 或达到 max rounds。
- CI gate：汇总 pass rate + 与 baseline 的 regression。

运行它：

```
python3 code/main.py
```

输出：每个 case 的 pass/fail、regression flag、CI gate verdict。

## 使用它
- 在与 agent code 相同的 repo 中编写 eval cases。
- 通过 CI 在每个 PR 上运行它们。
- 在 regression 时让 build 失败。
- 跟踪 pass rate 随时间的变化。
- 将每个 production failure 绑定到一个新 case。

## 交付它
`outputs/skill-eval-suite.md` 为一个 agent product 构建三层 eval suite，包含 CI gates 和 regression tracking。

## 练习
1. 取一个你的 production failures。编写一个能复现它的 eval case。你的 agent 现在能通过吗？
2. 为你的 domain 构建一个包含三个维度（factual、tone、scope）的 LLM-judge rubric。给 50 个 sessions 打分。
3. 将 eval suite 接入 CI。在 >=5% regression 时让 build 失败。
4. 添加 trajectory-efficiency metric：agent 相比 gold trajectory 走了多少步？
5. 将 Phase 14 的每一课映射到你的 suite 中的一个 eval case。有缺失吗？那就是需要补上的 gap。

## 关键术语
| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Static benchmark | “Off-the-shelf eval” | SWE-bench、GAIA、AgentBench、WebArena、OSWorld |
| Custom offline eval | “Domain eval” | 面向你的产品形态的 LLM-as-judge / exec / trajectory |
| Online eval | “Production eval” | Session replay、guardrail alerts、cost/latency tracking |
| Evaluator-optimizer | “Propose-judge-refine” | 迭代直到 judge 通过 |
| CI gate | “Merge blocker” | 在 eval regression 时让 build 失败 |
| Baseline | “Last-known-good” | 用于检测 regression 的 reference score |
| Trajectory efficiency | “Steps over gold” | Agent step count 除以 human expert minimum |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — “从简单开始，用 evals 优化”
- [OpenAI, SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) — 精选 benchmark
- [Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) — tool-use benchmark
- [Langfuse docs](https://langfuse.com/) — 实践中的 evals + session replay
