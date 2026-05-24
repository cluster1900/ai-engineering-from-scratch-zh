# 角色专业化 — Planner, Critic, Executor, Verifier

> 2026 年最常见的 multi-agent decomposition：一个 agent 负责规划，一个执行，一个批评或验证。MetaGPT (arXiv:2308.00352) 将其形式化为编码到 role prompts 中的 SOPs —— Product Manager、Architect、Project Manager、Engineer、QA Engineer —— 遵循 `Code = SOP(Team)`。ChatDev (arXiv:2307.07924) 通过 "chat chain" 串联 designer、programmer、reviewer、tester，并使用 "communicative dehallucination"（agents 明确请求缺失细节）。Verifier 是承重角色：Cemri et al. (MAST, arXiv:2503.13657) 表明，每个 multi-agent 失败都可以追溯到缺失或损坏的 verification。PwC 报告称，在 CrewAI 中使用结构化 validation loops 后，准确率提升了 7×（10% → 70%）。

**类型：** Learn + Build
**语言：** Python (stdlib)
**先修：** Phase 16 · 04 (Primitive Model), Phase 16 · 05 (Supervisor)
**时间：** ~60 分钟

## 问题

通用 multi-agent systems 会产出通用 output。群聊里的三个 coders 会写出三种同样平庸的 code。你可以添加更多 agents、增加更多 rounds，但仍然无法跨过质量门槛。

修复方法不是更多 agents，而是*不同的* agents。分配不同角色。给 Critic 配备 Planner 没有的 tools。给 Verifier 一个客观的 test suite。这样系统就拥有了带有 grounded correction 的内部 disagreement，而不只是并行猜测。

## 概念

### 四个 canonical roles

**Planner.** 阅读目标，产出 step list 或 spec。Tools：knowledge retrieval、docs。Output：structured plan。

**Executor.** 一次读取一个 plan step，产出 artifact。Tools：实际工作 tools（code compiler、shell、API client）。Output：artifact。

**Critic.** 根据 Planner 的意图审阅 Executor 的 output。Tools：对 artifact 的 read-only access、static analysis。Output：accept/reject，并给出原因。

**Verifier.** 读取 artifact 并运行确定性检查。Tools：test runner、type checker、schema validator。Output：pass/fail，并附 evidence。

Critic 是主观的、有观点的，通常基于 LLM。Verifier 是客观的、确定性的，通常基于 code。它们不是同一个角色。

### MetaGPT 的 SOP pattern

MetaGPT (arXiv:2308.00352) 将 software engineering SOPs 编码为 role prompts：

- **Product Manager** 编写 PRD。
- **Architect** 产出 system design。
- **Project Manager** 拆分 tasks。
- **Engineer** 实现。
- **QA Engineer** 运行 tests。

每个 role 都有严格的 input/output schema。Role prompt 说明该 role *是什么*以及它*必须产出什么*。`Code = SOP(Team)` 这一表述意味着：确定性的 SOPs 会把一组 LLMs 变成一个可预测的 pipeline。

### ChatDev 的 communicative dehallucination

ChatDev 增加了一个关键动作：当 Executor 需要 plan 中没有的具体细节时，它会在继续之前明确询问 Designer。这可以防止经典 LLM 失败：看似合理地编造细节。

实现方式：role prompt 包含“当你需要未被提供的具体信息时，在产出 output 之前按名称询问相关 role。”

### 为什么 Verifier 最重要

Cemri et al. (MAST) 追踪了 1642 个 multi-agent execution failures。其中 21.3% 是 verification gaps —— 系统交付了一个没有人检查过的答案。其余 79% 通常也可以追溯到“有一个 check 静默失败或从未运行”。Verification 是承重角色。

PwC 报告称（CrewAI deployments, 2025），加入结构化 validation loop 后，准确率从 10% 提升到 70%。一个 role 带来了 7× 提升。

### Critic vs verifier

- Critic 是审阅 artifact 质量的 LLM。主观。可能被看似合理的 prose 欺骗。
- Verifier 是运行在 artifact 上的确定性程序。客观。给出带 evidence 的 pass/fail。

两者都要用。Critic 能捕捉 Verifier 无法表达的品味问题。Verifier 能捕捉 Critic 看不到的 bug，因为这些 bug 只有在 runtime 才会出现。

### 反模式

系统里的每个 role 都是 LLM，并且每个 role 的 output 都是 "looks good to me." 这是经典 MAST failure mode。至少添加一个 Verifier，其 pass/fail 由 code 决定，而不是由 LLM 决定。

### Framework mappings

- **CrewAI** — `Agent(role, goal, backstory)` 是典型的 specialization surface。
- **LangGraph** — nodes 可以有 specialized prompts；edges 强制执行 pipeline。
- **AutoGen** — 在 GroupChat 中使用带单词名称的 role-specific ConversableAgents。
- **OpenAI Agents SDK** — 在 role-specialized Agents 之间使用 handoff tools。

## 构建

`code/main.py` 实现了一个用于构建简单 Python function 的 4-role pipeline：

- **Planner** 产出 spec。
- **Executor** 生成 code string。
- **Critic**（LLM-simulated）标记明显问题。
- **Verifier** 在 sandbox（`exec`）中对 test case 运行生成的 code。

Demo 运行两次：一次 Executor 产出正确 code（Critic + Verifier 都通过），一次 Executor 产出偏离 spec 的 code（Critic 漏掉 bug，因为它看起来合理；Verifier 捕捉到 bug，因为 test 失败）。

运行：

```
python3 code/main.py
```

## 使用

`outputs/skill-role-designer.md` 接收一个 task，并产出 role roster（3-5 个 roles）、每个 role 的 input/output schema，以及 verifier check。在把 agents 接入 framework 之前使用它。

## 交付

Checklist：

- **至少一个确定性 Verifier。** 绝不要全是 LLM。
- **每个 role 都有明确 I/O schema。** Planner 返回 spec，而不是 prose；Executor 读取该 schema。
- **Communicative dehallucination。** 当信息缺失时，Executor 必须询问 Planner；绝不编造。
- **Critic/verifier 顺序。** 先运行 Critic（便宜，捕捉 design issues），再运行 Verifier（较慢，捕捉 bugs）。
- **Loop budget。** 在升级给 human 之前，最多 2 轮 Critic-Executor revision。

## 练习

1. 运行 `code/main.py`，观察 Verifier 如何捕捉 Critic 漏掉的 bug。添加一个 static-analysis check（统计 `return` 的出现次数）作为额外 Verifier。它能捕捉到 runtime test 漏掉的什么问题？
2. 添加第 5 个 role："requirements analyst"，把用户愿望转换为 Planner-ready spec。哪些 communicative dehallucination requests 应该向上流向它？
3. 阅读 MetaGPT Section 3 ("Agents")。列出 MetaGPT 5 个 roles 中每个 role 的 input/output schema。
4. 阅读 ChatDev 的 chat-chain diagram（arXiv:2307.07924 Figure 3）。识别 communicative dehallucination 在哪里打断了一个本来会无限持续的 loop。
5. PwC 的 7× 准确率提升来自 verification loops。假设三个添加 Verifier 也没有帮助的 tasks —— 这些任务中，对 correctness 做确定性 checking 不可能或成本高到无法接受。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | 针对 Planner/Executor/Critic/Verifier roles 调优的不同 system prompts。 |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT 的 framing：每个 role 的严格 I/O schemas 将 team 转换为 pipeline。 |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern：当细节缺失时，Executor 会询问 Planner，而不是自行编造。 |
| Critic | "LLM reviewer" | 主观、有观点的 reviewer。捕捉品味问题。可能被看似合理的 prose 欺骗。 |
| Verifier | "Deterministic check" | 基于 code 的 pass/fail。Test runner、type checker、schema validator。不会被欺骗。 |
| Verification gap | "No one checked" | MAST failures 的 21.3%。答案在没有能捕捉 bug 的 check 的情况下被交付。 |
| Revision loop | "Critic sends it back" | Critic rejection 会触发 Executor 带 feedback 重新运行。需要 budget。 |
| All-LLM anti-pattern | "Looks good to me" | 每个 role 都是 LLM，没有确定性 check。经典 MAST failure。 |

## 延伸阅读
- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) — SOP-as-role-prompt 参考论文
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) — chat chain + communicative dehallucination
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy；verification gaps 占 failures 的 21.3%
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) — production role specification surface
