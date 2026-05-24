---
name: radix-scheduler-advisor
description: 为希望利用 RadixAttention cache 复用的 prefix-heavy workload，提供 SGLang 采用建议和 prompt-ordering 规范建议。
version: 1.0.0
phase: 17
lesson: 06
tags: [sglang, radixattention, prefix-caching, scheduler, prompt-ordering]
---

给定一个 workload 描述（prompt-template 形态、retrieval 模式、conversation 长度、并发 tenant 数量、硬件），产出一份 SGLang / RadixAttention 采用建议。

产出：

1. Workload fingerprint。分类为 prefix-heavy（带重复 preamble 的 RAG、带重复 tool schemas 的 agents、带重复 context 的 voice）或 prefix-light（独特的一次性 prompts）。说明 shared prefix 长度和重复率。
2. Prompt-ordering audit。自上而下检查当前 prompt template。标记任何插入 immutable section 中的 dynamic content。推荐 canonical order：system → tools/schemas → retrieval context → conversation history → user input。
3. Expected hit rate。根据 workload fingerprint，估算可达到的 cache hit rate。General chat 为 10-30%。template 一致的 RAG 为 60-85%。带固定 preamble 的 voice/vision 为 80-95%。
4. SGLang vs vLLM 决策。如果 expected hit rate > 40% 且 workload 不是 single-shot，推荐 SGLang。如果 < 30%，使用带 `--enable-prefix-caching` 的 vLLM 更简单。如果为 30-40%，在 sample 上同时运行两者再选择。
5. Rollout plan。在 SGLang 上用当前 prompt template 做 48 小时 shadow benchmark。记录 hit rate。修复 prompt-ordering 问题。重新 benchmark。如果 hit rate 达到 target，则上线。

Hard rejects：
- 未测量 traffic 中实际 prefix sharing 就推荐 SGLang。拒绝。
- 不说明 workload shape 就声称 6.4x 这个数字。该数字是 workload-specific 的。
- 忽略 prompt-ordering 规范。template 就是 cache key；没有它，scheduler 无法提供帮助。

Refusal rules：
- 如果 workload 是 single-shot（没有重复的 system prompt），拒绝 SGLang 并推荐 vLLM。
- 如果团队无法控制 prompt template（third-party consumer），拒绝，并推荐先做 proxy-level template normalization，再重新评估。
- 如果 multi-tenant isolation 要求每个 tenant 使用独立 KV pools，说明 SGLang 支持这一点，但 tree-branch eviction 可能让较小 tenant 挨饿；推荐分配 per-tenant budget。

Output：一页 SGLang advisory，列出 workload fingerprint、prompt-ordering 修复项、expected hit rate、engine choice 和 rollout plan。最后用一个 "what to read next" 段落收尾，根据最大差距指向 SGLang paper、vLLM prefix-caching docs，或本课的 prompt-ordering exercise。
