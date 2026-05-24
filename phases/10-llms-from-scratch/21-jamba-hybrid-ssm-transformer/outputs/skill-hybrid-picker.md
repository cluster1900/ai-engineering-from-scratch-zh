---
name: hybrid-picker
description: 针对给定 workload，在 pure Transformer、Jamba-style hybrid 和 pure SSM 之间做选择。
version: 1.0.0
phase: 10
lesson: 21
tags: [jamba, mamba, ssm, hybrid, long-context, memory-budget, architecture]
---

给定一个 workload specification（context length profile p50/p99、task mix、memory budget per GPU、target throughput、quality-vs-speed priority），在 pure Transformer（+MoE +MLA）、Jamba-style hybrid 和 pure Mamba model 之间给出推荐。

生成：

1. 上下文长度分桶。Short（16k 以下）、medium（16k-64k）、long（64k-256k）或 ultra-long（256k 以上）。这驱动第一轮决策。
2. 架构推荐。从 pure Transformer、1:7 hybrid、1:3 hybrid、1:15 hybrid 或 pure Mamba 中选择一个。结合 context bucket 与任务的 in-context-recall demands 进行论证。
3. 内存预算检查。计算目标上下文下的 KV cache + SSM state。在计入 weights 和 activation memory（通常在 weights 与 KV cache 之上再加 10-20 GB）后，确认它能放进目标 accelerator。
4. 质量权衡披露。记录所选 sparsity level 的质量成本。低于 1:7 ratio 的 hybrid 在 in-context retrieval 上会出现可测量的退化；pure Mamba 在某些 state-tracking tasks 上会失败。
5. 推理栈兼容性。确认目标 stack（vLLM、TensorRT-LLM、SGLang、llama.cpp）支持所选架构。相比 pure Transformers，hybrid 的 tooling 覆盖更薄。

硬性拒绝：
- 对 16k 以下上下文使用 Jamba-style hybrid。架构开销不值得。
- 对 reasoning-heavy 或 multi-document cross-reference tasks 使用 pure Mamba。State-tracking 限制会造成影响。
- 低于 1:15 的 hybrid ratios。低于这个比例时，in-context recall 不可靠。
- 任何无法在指定 accelerator 上满足计算后内存预算的推荐。

拒绝规则：
- 如果 workload 确实混合了短上下文和长上下文，拒绝 hybrid recommendation，并推荐 pure Transformer（如果可能，带 MLA），因为 hybrid 专门适合 long-context workloads。
- 如果 accelerator 是 consumer-grade（24GB 或更低），拒绝 hybrid-size models，并推荐 distilled small hybrid 或 quantized pure Transformer。
- 如果 workload 是 latency-sensitive batch-1 generation，且模型较新（没有现成部署路径），拒绝并推荐带 speculative decoding（Phase 10 · 15）的 well-supported pure Transformer，作为更简单的路径。

输出：一页推荐，列出 context bucket、architecture choice、目标上下文下的 KV cache、质量权衡披露和推理栈兼容性。最后用一段“要监控什么”收尾，点名具体的 long-context evaluation（RULER、LongBench、needle-in-haystack），用于在前 10k 个生产请求中确认该推荐。
