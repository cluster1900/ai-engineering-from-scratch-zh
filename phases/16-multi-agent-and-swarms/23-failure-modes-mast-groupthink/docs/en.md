# 失效模式 — MAST、Groupthink、Monoculture、Cascading Errors

> 2026 年的参考 taxonomy 是 **MAST**（Cemri et al., NeurIPS 2025, arXiv:2503.13657），它源自 7 个 state-of-the-art open-source MAS 的 1642 条执行 trace，显示出 **41–86.7% 的失败率**。三个根类别：**Specification Problems**（41.77%）——角色歧义、任务定义不清；**Coordination Failures**（36.94%）——通信中断、状态 desync；**Verification Gaps**（21.30%）——缺少验证、缺少质量检查。**Groupthink** 家族（arXiv:2508.05687）补充了：monoculture collapse（相同 base model → 相关失败）、conformity bias（agents 相互强化彼此的错误）、deficient theory of mind、mixed-motive dynamics、cascading reliability failures。级联示例：retry storms，其中一次 payment failure 触发 order retries，进而触发 inventory retries，最终压垮 inventory service（几秒内 10x load —— 需要 circuit breakers）。Memory poisoning：一个 agent 的 hallucination 进入 shared memory，下游 agents 将其当作事实；准确率逐渐下降，使 root-cause 诊断变得痛苦。**STRATUS**（NeurIPS 2025）报告称，通过专门的 detection / diagnosis / validation agents，mitigation-success 提升 1.5x。本课把 failure modes 视为一等工程目标。

**Type:** 学习
**Languages:** Python (stdlib)
**前置要求:** Phase 16 · 13 (Shared Memory), Phase 16 · 14 (Consensus and BFT), Phase 16 · 15 (Voting and Debate Topology)
**Time:** ~75 分钟

## 问题

Multi-agent systems 在真实任务上的失败率为 41-86.7%（Cemri et al. 2025 在 7 个 open-source MAS 上测得）。这不是靠“just add more agents”就能调试的问题。这些失败有结构性原因。MAST taxonomy 给出了类别。本课把每个类别映射到一个具体的 detection、diagnosis 和 mitigation pattern，让这些数字不再显得任意。

2026 年的生产实践是把 failure modes 当作设计输入。你的 architecture 只有在能指向每个 MAST category 并说出已部署的 mitigation 时，才算“足够好”。

## 概念

### MAST categories

**Specification Problems（41.77% 的失败）。** agent 的任务定义不够严格。示例：

- Role ambiguity：两个 agents 都认为自己是 reviewer。
- Task underspecified：用户想要特定角度，却只说了“summarize this”。
- Success criteria implicit：agent 无法判断自己是否成功。

Mitigations：
- 编写明确的 role contracts。每个 agent 的 prompt 都说明它做什么，*以及不做什么*。
- 每个任务配 acceptance tests。在 agent 开始前，定义“done looks like X”。
- Pre-flight spec check：一个单独的 agent 在 dispatch 前审查任务定义。

**Coordination Failures（36.94%）。** 通信或状态中断。

示例：
- 两个 agents 在没有同步的情况下更新 shared state。
- agents 之间的 message 丢失（queue failure、timeout）。
- State drift：agent A 认为任务已完成；agent B 仍在执行。

Mitigations：
- 带版本的 shared state，使用 optimistic concurrency。
- 对关键 messages 做显式 acknowledgment（retry until acked）。
- 定期 state-sync checkpoints；尽早检测 drift。

**Verification Gaps（21.30%）。** 对输出没有独立检查。

示例：
- 一个 agent 声称成功；无人验证。
- 一串 agents 都信任前一个的输出。
- 对 emergent composed behavior 缺少 test coverage。

Mitigations：
- 独立 verifier agent（Lesson 13）。Read-only，独立 source access。
- 显式 handoff contract：“A 的输出必须通过 checker C，B 才能开始。”
- 为 post-hoc analysis 记录 outcome logging。

### Groupthink family (arXiv:2508.05687)

当 agents 同质化或相互模仿时，会出现五类相关失败：

**Monoculture collapse。** 相同 base model 或 training data → 相关错误。当三个 agents 共享一个 LLM 时，它们也共享它的 hallucinations。

**Conformity bias。** Agents 向最响亮或最自信的 peer 靠拢，即使它是错的。

**Deficient ToM。** Agents 无法建模彼此的 beliefs；coordination 崩溃（Lesson 18）。

**Mixed-motive dynamics。** 具有部分一致 incentives 的 agents 漂移到折中中间态，结果谁都不满足。

**Cascading reliability failures。** 一个组件的 error pattern 触发依赖组件中的 error patterns。

### Cascading example — the retry storm

一个经典的 2026 incident pattern：

```
payment service fails 10% of requests
   ↓
order agent retries payment (exponential backoff but naive)
   ↓
each retry is a new order-inventory check
   ↓
inventory service sees 2x normal load
   ↓
inventory service starts timing out
   ↓
every order retries inventory check
   ↓
inventory service sees 10x normal load
   ↓
cluster goes down
```

修复方式是经典做法：**circuit breakers**。当下游 error rate 超过 threshold 时，用 cached 或 default results 短路。再加上每个 request 的 capped retry budgets。

Circuit breakers 是少数几个可以直接从 distributed systems 借用且无需修改的 multi-agent failure mitigations 之一。

### Memory poisoning（回顾）

来自 Lesson 13：一个 agent 的 hallucination 变成 shared-memory fact；下游 agents 基于被污染的事实进行推理。按 MAST 的说法，这是 shared-memory layer 的 verification gap。

症状是准确率逐渐下降。你不会得到 crash；你得到的是很难 root-cause 的缓慢 drift。

Mitigation：append-only log、provenance、unwritable verifier。Lesson 13 已经覆盖。

### STRATUS — specialized agents for failure detection

STRATUS（NeurIPS 2025）报告称，当你部署以下角色时，mitigation-success 提升 1.5x：

- **Detection agent。** 监视 symptom patterns（高 disagreement、retry spikes、accuracy drift）。
- **Diagnosis agent。** 给定 symptoms，从 MAST taxonomy 推断可能 root cause。
- **Validation agent。** 在 mitigation 应用后，检查 symptoms 是否清除。

这是应用到 agent systems 的 SRE-style incident response。这三个角色都可以是带有专门 prompts 的 LLM agents。

### The failure-mode audit

2026 年的 best practice 是每年（或每次 major release）进行一次 failure-mode audit：

1. **Trace sample。** 收集约 1000 条真实 execution traces。
2. **Categorize。** 对每条 trace 的失败，映射到 MAST + Groupthink categories。
3. **Compute failure-by-category rate。** 哪些 categories 主导你的系统？
4. **Rank mitigations。** 哪个 fix 能消除最多 failures？
5. **Pick 2-3 mitigations。** 实现；下季度重新 audit。

纪律比具体选择更重要。没有 audits，failures 会混入噪声，永远得不到系统性处理。

### When systems fail silently

最危险的 failure category 是 silent correctness failure。一个 loudly 失败的系统（crash、exception、alert）可以被监控。一个产生 plausible-but-wrong outputs 的系统无法通过 exception logs 检测到。这就是为什么 verification gaps 虽然按数量只占 21.30%，但按每次失败的成本来看是最昂贵的类别。

投资于：
- Sample-based human review。
- Golden-dataset regression tests。
- 对重要输出进行 cross-agent cross-checking。

### Failure vs slow failure

有些失败是即时的；有些是缓慢的。即时失败（timeout、schema mismatch、auth error）检测成本低。缓慢失败（memory poisoning、monoculture drift、role ambiguity）检测和预防成本高。

2026 年的工程动作：instrument slow-failure proxies，这样你能在 drift 变成可见错误之前捕获它。Agreement rate、retry rate、output-length distribution，以及连续 agent versions 之间的 edit-distance 都是有用的 proxies。

## 构建它

`code/main.py` 实现：

- `FailureTaxonomy` —— 将模拟 incidents 分类为 MAST + Groupthink categories。
- `CircuitBreaker` —— 经典 pattern；当 error rate 超过 threshold 时打开。
- `RetryStormSimulator` —— 展示 cascading failure；切换 circuit breaker on / off。
- `DetectionAgent` —— scripted STRATUS-style symptom matcher。

运行：

```
python3 code/main.py
```

预期输出：
- 没有 circuit breaker 的 retry storm：inventory errors 爆炸式增长（模拟）。
- 有 circuit breaker：在 threshold 处封顶；提供 degraded-mode responses。
- detection agent 标记该 pattern 并命名 MAST category。

## 使用它

`outputs/skill-mast-auditor.md` 对 multi-agent system 运行 MAST-style failure-mode audit。Traces → categorization → mitigation ranking。

## 发布它

生产中的 failure-mode discipline：

- **每季度 MAST audit。** 不是每年。Categories 会随着系统增长而变化。
- **到处部署 circuit breakers。** 对任何 dependent service 的每个 outbound call。默认 open threshold 为 5-10% error rate。
- **Golden datasets。** 小型、高质量、人工审计。每周对其进行 regression-test。
- **STRATUS trio。** Detection + Diagnosis + Validation agents 监控生产。先只从 detection agent 开始；当 symptoms noisy 时再添加 diagnosis。
- **Failure budget。** 为按 category 统计的 failure rate 设定显式 SLO。超出 budget 会触发 stop-shipping conversation。

## 练习

1. 运行 `code/main.py`。确认 circuit breaker 限制了 retry storm。调整 failure threshold 并观察 tradeoff。
2. 实现一个 **slow-failure proxy**：3 个并行 agents 的 agreement rate。当它急剧下降时触发 alert。通过逐渐关联 agent outputs 来模拟 monoculture drift。
3. 阅读 Cemri et al.（arXiv:2503.13657）。选择他们的 7 个 MAS systems 中的一个，并映射其 top 3 failure categories。它们与 MAST 的预测相比如何？
4. 阅读 Groupthink paper（arXiv:2508.05687）。识别五种 patterns 中哪一种在生产中最难检测。提出一个 proxy metric。
5. 为你了解的某个具体 multi-agent system 设计一个 STRATUS-style detection-diagnosis-validation trio。Detection 监视哪些 symptoms？Diagnosis 推荐什么 mitigations？Validation 如何确认它们有效？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MAST | “2026 taxonomy” | Cemri 2025；3 个根类别 + 14 个 failure sub-types。 |
| Specification Problem | “Role ambiguity” | 任务或角色定义不足；agents 不知道该做什么。 |
| Coordination Failure | “State drift” | agents 之间的通信或同步中断。 |
| Verification Gap | “No one checked” | 输出在没有独立验证的情况下被接受。 |
| Groupthink family | “Homogeneity failures” | Monoculture、conformity、deficient ToM、mixed-motive、cascading。 |
| Monoculture collapse | “Same model, same hallucinations” | 来自共享 base model 或 training data 的相关错误。 |
| Retry storm | “Cascading error amplification” | 一次 failure 触发 retries，进而放大下游 load。 |
| Circuit breaker | “Fail fast on error rate” | 当 error rate 超过 threshold 时打开；用 default 短路。 |
| STRATUS | “Incident response trio” | Detection + diagnosis + validation agents。1.5x mitigation success。 |
| Memory poisoning | “Hallucinations propagate” | Shared-memory fact 被污染；下游 agents 基于 poison 推理。 |

## 延伸阅读
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — MAST taxonomy, NeurIPS 2025
- [Groupthink failures in multi-agent LLMs](https://arxiv.org/abs/2508.05687) — monoculture、conformity，以及 five-family taxonomy
- [STRATUS — specialized agents for MAS incident response](https://neurips.cc/) — NeurIPS 2025 proceedings entry（detection + diagnosis + validation）
- [Release It! — stability patterns (Nygard)](https://pragprog.com/titles/mnee2/release-it-second-edition/) — 经典 circuit-breaker 参考
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — 生产 failure-mode notes
