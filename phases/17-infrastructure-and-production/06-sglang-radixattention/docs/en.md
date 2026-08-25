# Prefix Cache Serving — RadixAttention 与 KV Reuse

> 将 KV cache 视为存储在 radix tree 中的一等可复用资源，调度方式也会随之改变：cache-aware scheduler 不采用 vLLM 使用的 FCFS（first-come, first-served），而是优先处理共享 prefix 更长的请求。这实际上相当于进行 depth-first radix traversal，使 hot branch 保持驻留在 HBM 中。SGLang 正是围绕这一理念构建 serving 的引擎。在运行 Llama 3.1 8B、处理类似 ShareGPT 的 1K prompt 时，SGLang 可达到约 16,200 tok/s，而 vLLM 约为 12,500 tok/s，领先约 29%。在 prefix-heavy RAG workload 上，优势最高可达 6.4x。在类似 voice cloning 的 workload 上，cache hit rate 超过了 86%。截至 2026 年，它已在 xAI、LinkedIn、Cursor、Oracle、GCP、Azure 和 AWS 的 400,000 多张 GPU 上部署。需要注意的是，如果 prefix ordering 不一致，6.4x 这一数字就会消失。Ordering 是工程师能够控制的关键杠杆。

**Type:** Learn
**Languages:** Python（stdlib，玩具版 radix-tree cache + cache-aware scheduler）
**Prerequisites:** Phase 17 · 04（Serving Engine Internals），Phase 14（Agentic RAG）
**Time:** ~75 分钟

## Learning Objectives

- 绘制 RadixAttention：说明 prefix 如何存储在 radix tree 中，以及源自同一 branch 的 sequence 如何共享 KV block。
- 解释 cache-aware scheduling，以及为什么 FCFS 不适合 prefix-heavy traffic。
- 根据 prefix-cache hit rate 和 prompt length distribution，计算 workload 的预期 speedup。
- 说出让 6.4x 真正成为现实，而不是白白损失的 prompt-ordering discipline。

## The Problem

传统 serving 将每个请求的 prompt 视为不透明内容。即使 5,000 个 RAG 请求都以同一个包含 2,000 个 Token 的 system prompt 和相同 retrieval preamble 开头，vLLM 仍会对这个 2,000-Token prefix 执行 5,000 次 prefill。GPU 会一遍又一遍地执行相同工作。

关键观察是：Agentic 和 RAG workload 中的 prompt 几乎总是共享较长的 prefix。System prompt、Tool schema、few-shot example、retrieval header、conversation history 都会在请求之间重复。如果只存储一次这个 prefix 的 KV cache 并重复使用，就不必再次对其执行 prefill。

RadixAttention 正是这样做的。Token 被索引到 radix tree 中，每个 node 都拥有从 root 到该 node 的路径所对应 Token sequence 的 KV block。新请求会沿 tree 遍历：只要某个 node 的 Token 匹配，就复用该 node 的 KV block。Prefill cost 因而与“新增”suffix 成正比，而不是与完整 prompt 成正比。

挑战在于 scheduling。如果两个请求共享一个包含 2,000 个 Token 的 prefix，而第三个请求只共享同一 prefix 中的 200 个 Token，你会希望把前两个共享较长 prefix 的请求放在一起处理，让较长 prefix 保持驻留在 HBM 中。FCFS 的行为恰恰相反：它会处理最先到达的请求，并可能在下一个长 prefix 请求命中前驱逐 hot branch。

## The Concept

### 将 radix tree 作为 KV index

Radix tree（compact trie）用于存储 Token sequence。每个 node 都拥有一个 Token range，以及为该范围计算出的 KV block。Child 会将 sequence 延长一个或多个 Token。

```
root
 |- "You are a helpful assistant..."  （2,000 个 Token，124 个 KV block）
      |- "Context: <doc A>..."        （500 个 Token，31 个 block）
           |- "Question: Alice..."    （80 个 Token，5 个 block）
           |- "Question: Bob..."      （95 个 Token，6 个 block）
      |- "Context: <doc B>..."        （520 个 Token，33 个 block）
```

一个新请求到达，其内容为 system prompt + `"Context: <doc A>"` + `"Question: Carol"`。Scheduler 沿 tree 遍历：system prefix 匹配（复用 124 个 block），doc-A branch 匹配（复用 31 个 block），然后只为 `"Question: Carol"` 分配新的 block（4 个 block）。Prefill cost 为 4 个 block 的新 Token。不使用该 tree 时则需要 160 个 block。Prefill 成本节省约 40x。

### Cache-aware scheduling

如果 cache 持续 churn，基于 radix tree 的 reuse 就毫无意义。两个关键 policy 是：

1. **Depth-first dispatch**。从 queue 中选择下一个请求时，优先选择与当前 running set 源自同一 branch 的请求。这样可以让 hot branch 保持 pinned。
2. **在 branch 层面使用 LRU，而不是在 block 层面使用**。驱逐完整 branch（从最少使用的 leaf 开始），而不是单个 block，使 cache shape 与 radix shape 保持一致。

FCFS 同时违反了这两项原则。一个共享 2,000 个 Token 的请求排在只共享 50 个 Token 的请求之后，而系统为了接纳这个 50-Token 请求，可能会驱逐 2,000-Token branch。

### 应该记住的 benchmark 数字

- Llama 3.1 8B、H100、ShareGPT 1K prompt：SGLang 约 16,200 tok/s，vLLM 约 12,500 tok/s（领先约 29%）。
- Prefix-heavy RAG（相同 system + 相同文档，不同问题）：SGLang 最高可达 6.4x。
- Voice cloning workload：86.4% 的 prefix-cache hit rate。
- SGLang 客户的生产 hit rate：根据 prompt discipline 不同，范围为 50-99%。
- 截至 2026 年，已部署在 400,000 多张 GPU 上。

### Ordering gotcha

6.4x 这一数字依赖一致的 prompt-template ordering。如果 client 在某些请求中将 prompt 构造为 `[system, tools, context, history, question]`，而在其他请求中构造为 `[system, context, tools, history, question]`，tree 就无法找到共享 prefix。对人类而言看似相同的共享 prefix，对于 radix tree 来说却是两个不同的 sequence。

工程师的杠杆在于：prompt template 就是 cache key。固定顺序。将所有不可变内容（system、tools、schema）放在最前面。接着放 retrieval context。最后放用户问题。不要将 dynamic content 插入 prefix 中。

研究中的真实案例显示：仅通过将 dynamic content 移出可缓存 prefix，就让一个部署环境的 cache hit rate 从 7% 提高到 74%。

### RadixAttention 在哪些场景胜出或失去优势

胜出：

- RAG（相同 retrieval preamble，不同问题）。
- Agent（相同 Tool schema，不同 query）。
- 带有较长 system prompt 的聊天。
- 具有重复 preamble 的语音或视觉 workload。

失去优势（回到 vLLM 级别的 throughput）：

- Prompt 独一无二的 single-shot generation（代码补全、没有 system prompt 的开放式聊天）。
- 每个请求都在 prefix 中混入唯一内容的 dynamic prompt。

### 为什么这是 scheduler 问题，而不仅是 kernel 问题

你可以将 KV reuse 实现为一种 kernel 技巧。SGLang 的洞见在于：只有 scheduler 能让 hot branch 保持驻留，reuse 才能带来收益。在混合负载下，简单的“可复用时就复用”policy 会导致 cache churn。正是使用 radix tree 索引的 scheduler，才将 kernel 技巧转化成了 29% 的生产优势。

### 与 vLLM 的相互关系

这两个系统并非严格意义上的竞争对手。2026 年，vLLM 增加了 prefix caching（`--enable-prefix-caching`）和 cache-aware router（使用 Rust 编写的 vLLM Router）。差距已经缩小，但尚未完全消失，因为 SGLang 的整个 stack 都以 radix 为核心，而 vLLM 是后来才将其接入。对于主要依赖 prefix reuse 的 workload，SGLang 仍然是默认选择。对于不存在明显 prefix pattern 的通用 serving，vLLM 仍然具有相同或更好的表现。

```figure
roofline
```

## Use It

`code/main.py` 实现了一个玩具版 radix-tree KV cache，以及支持两种 policy 的 scheduler：FCFS 和 cache-aware。它会让相同 workload 分别通过两种 scheduler，报告 prefix-cache hit rate 和 throughput delta。随后，它还会运行一个“打乱 ordering”的 workload，以展示 6.4x 优势如何消失。

## Ship It

本课会产出 `outputs/skill-radix-scheduler-advisor.md`。给定一份 workload 描述（prompt-template shape、retrieval pattern、并发 tenant 数量），它会生成 prompt-ordering prescription，并对是否采用 SGLang 给出 go/no-go 建议。

## Exercises

1. 运行 `code/main.py`。在相同 workload 上比较 FCFS 和 cache-aware。差异来自哪里：prefill savings、decode savings，还是 queue delay？
2. 修改 workload，使 prompt 随机排列 `[system, tools, context]`。重新运行。Hit rate 会发生什么变化？为什么？
3. 计算在 Llama 3.1 8B 上，将一个包含 2,000 个 Token 的 system prompt 作为单个 radix branch 保持驻留所需的 HBM。将其与不使用 prefix reuse 的 16-sequence batch 成本进行比较。
4. 阅读 SGLang RadixAttention 论文。用三句话解释为什么在 prefix-heavy load 下，tree-shaped LRU eviction 优于 block-shaped LRU。
5. 某位客户报告 cache hit rate 只有 8%。说出三个可能原因，以及你会针对每个原因运行的 diagnostic。

## Key Terms

| Term | 人们怎么说 | 它实际表示什么 |
|------|----------------|------------------------|
| RadixAttention | “SGLang 的那个机制” | 将 KV cache 索引为 radix tree，使共享 prefix 能够复用 block |
| Radix tree | “compact trie” | 每个 node 都拥有一个 Token range 及其 KV block 的 tree |
| Cache-aware scheduler | “hot-branch-first” | 优先处理共享驻留 branch 的请求的 scheduler |
| Prefix-cache hit rate | “prompt 中有多少内容是免费的” | 通过复用 KV block 提供的 prompt Token 比例 |
| FCFS | “first-come first-served” | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | “驱逐 leaf” | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | “cache key” | Prompt 的 component 顺序决定 tree 可以共享哪些内容 |
| System prompt pinning | “resident prefix” | 保持不可变 system 部分 pinned，以避免 eviction thrash |

## Further Reading

- [SGLang GitHub](https://github.com/sgl-project/sglang) — source 和文档。
- [SGLang 文档](https://sgl-project.github.io/) — RadixAttention 和 scheduling 细节。
- [SGLang 论文 — Efficiently Programming Large Language Models（arXiv:2312.07104）](https://arxiv.org/abs/2312.07104) — 设计参考。
- [LMSYS Blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) — benchmark 数字和 scheduler 设计依据。
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) — vLLM 自身类似 radix 的实现，可用于比较。
