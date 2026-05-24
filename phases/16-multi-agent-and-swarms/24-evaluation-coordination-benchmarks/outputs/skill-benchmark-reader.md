---
name: benchmark-reader
description: 用怀疑态度阅读 multi-agent benchmark claim。根据 benchmark selection、contamination、baselines、statistical significance、task diversity 和 cost disclosure 对 claim 评分。
version: 1.0.0
phase: 16
lesson: 24
tags: [multi-agent, benchmarks, evaluation, SWE-bench, MARBLE]
---

给定一个已发布或内部的 multi-agent benchmark performance claim，对该 claim 评分并暴露 caveats。

生成：

1. **Benchmark + split identification。** 哪个 benchmark（MARBLE、COMMA、MedAgentBoard、AgentArch、SWE-bench Pro、SWE-bench Verified、custom）？哪个 split（full、held-out、contamination-cleaned）？未知 split 会直接失格。
2. **Contamination status。** 对于被测模型，这个 benchmark 是否在 training cutoff 之后发布？如果 benchmark 早于 training cutoff，标记 contamination risk 并折扣该 claim。
3. **Baseline quality。** 与 single-LLM、random、prior multi-agent work 比较。与 untuned-same-system 比较不算；那是 ablation，不是 baseline。
4. **Statistical significance。** N trials、confidence interval 或 standard error、p-value 或等价指标。对 N < 50 trials 且没有 statistics 的 claims，支撑不足。
5. **Task diversity。** 一个任务、一个 domain，还是多个？Single-task claims 不意味着 generalization。
6. **Cost disclosure。** Tokens per task、wall-clock per task、dollar cost per task。20x 成本的 90% solution 是业务决策；没有 cost，claim 就不完整。
7. **Letter grade + 一句话 verdict。**

   - **A:** 六项检查全部通过；claim 可能稳健。
   - **B:** 一个弱点；claim 在注明 caveats 后可信。
   - **C:** 两个弱点；claim 有启发性，但需要 replication。
   - **D:** 三个或更多弱点；claim 不能作为证据。
   - **F:** 失格问题（未披露 split 上的 contamination、无 statistics、无 baseline）。

Hard rejects：

- 引用 "SWE-bench" 但不说明 Verified 还是 Pro 的 claims。40+ 点差距使这种含糊报告不可接受。
- 没有 baseline comparison 的 claims。"Our system does X%" 是数字，不是结果。
- 基于少于 20 trials 的 multi-agent systems claims。Variance 太高。
- 未报告 cost 的 multi-agent systems claims。Coordination tax 是实质性的。

Refusal rules：

- 如果 benchmark 不是公开可用的，且用户没有 internal audit trail，则无法分配 grade。建议发布 evaluation artifacts。
- 如果 claim 来自当前处于 peer review 的 paper（arXiv preprint、unsubmitted），在 replication 之前谨慎降一级 letter grade。
- 如果用户本人就是 claimant 并要求 audit，直接运行 audit；当 claim 尚未准备好发布时明确标记。

输出：一页 grade card。以一句话 summary 开始（"Grade: C — good benchmark choice, adequate baselines, but no contamination check and no cost disclosure."），然后给出以上七个 sections。最后用一个优先级列表说明 "what to fix to raise the grade"。
