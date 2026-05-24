---
name: llm-pipeline-reviewer
description: 在一次数百万美元级运行前 review 端到端 LLM training pipeline manifest。
version: 1.0.0
phase: 10
lesson: 13
tags: [pipeline, training, manifest, eval-gate, cost, rollback]
---

给定一个拟议的 training pipeline manifest（用 YAML 或 JSON 描述 tokenizer、data、pre-training、SFT、alignment、eval、quantization 和 serving 阶段），生成一份 review，覆盖：

1. 阶段图。确认每个阶段都有带类型的输入和输出。指出缺失的依赖、隐式状态，或任何使用裸目录而不是命名 artifact hash 的阶段。
2. Hash chain。验证阶段 N 的 output_hash 等于每个 downstream 阶段的 input_hashes 之一。任何不匹配都意味着 manifest 不一致，pipeline 不得启动。
3. Eval gate。gate 列表中的每个 metric 都必须是数值型，具有 operator、threshold 和 measurement source。拒绝任何主观（"looks good"）、无边界（没有 threshold）或在 training data 上测量的 gate。
4. Regression guard。新模型的核心 benchmark（MMLU、MATH、HumanEval+、GPQA，或领域特定等价项）必须附带 baseline 数字。没有 baseline 的运行就是没有 regression detection 的运行。
5. KL budget。Alignment 阶段（RLHF、DPO、CAI、GRPO）必须声明相对于 reference 的累计 KL cap。无边界的 KL 就是无边界的 drift。
6. 污染检查。Training data shards 和 eval sets 必须有记录在案的 overlap check（exact match 或 13-gram）。要求的通过 threshold：<0.1%。
7. 成本估算。每个阶段以及总计都需要 pre-run estimate，并与 budget gate 对比。如果 estimate > budget，pipeline 拒绝启动。
8. Rollback plan。对每个阶段，失败时必须有命名 action：re-run、回退到 previous artifact、修改输入并 re-run downstream。昂贵阶段（pre-training）必须有 warm checkpoint strategy。
9. Artifact store。Checkpoints、datasets、tokenizers、eval reports 必须是 content-addressed（SHA-256）。Filename-addressed artifact（"latest.pt"）必须硬性拒绝。
10. 可观测性。每个阶段都必须发出 structured logs，包含 trace ID、stage name、input hashes、output hash、wall clock 和 cost。缺失 trace ID 意味着运行结束后无法 debug。

会中止 review 的 red flags：
- gate 缺失 measurement source（某个 metric 上的 gate 没有任何阶段会计算）
- 某个阶段与 downstream 阶段共享 checkpoint（缺少 concerns 分离）
- alignment 阶段没有 reference model（没有 KL anchor）
- LLM-as-judge eval 中，judge 与 policy 属于同一模型 family（contamination）
- cost estimate 超出 budget 20% 以上
- rollback plan 仅由 "re-run from scratch" 组成

输出：一份两页 review，对每个 gate 给出 PASS/HOLD，写明产生每个 verdict 的确切 manifest 字段或缺失字段，以及将 HOLD 变为 PASS 所需的最小变更。
