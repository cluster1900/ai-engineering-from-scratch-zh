# 面向 Prefix-Heavy Workloads 的 SGLang 与 RadixAttention

> SGLang 将 KV cache 视为一等、可复用资源，并存储在 radix tree 中。vLLM 按 FCFS（first-come, first-served）调度请求，而 SGLang 的 cache-aware scheduler 会优先处理具有更长 shared prefixes 的请求，本质上是 depth-first radix traversal，让 hot branches 保持驻留在 HBM 中。在 Llama 3.1 8B 搭配 ShareGPT-like 1K prompts 的场景下，SGLang 达到约 16,200 tok/s，而 vLLM 约为 12,500，优势约 29%。在 prefix-heavy RAG workloads 上，这一优势可达 6.4x。在 voice-cloning-shaped workloads 上，cache hit rate 超过 86%。2026 年已部署在 xAI、LinkedIn、Cursor、Oracle、GCP、Azure、AWS 的 400,000+ GPUs 上。陷阱在于，当 prefix ordering 不一致时，6.4x 这个数字会消失，ordering 是工程师的杠杆。

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**前置要求：** Phase 17 · 04 (vLLM Serving Internals), Phase 14 (Agentic RAG)
**Time:** ~75 minutes

## 学习目标
- 画出 RadixAttention：prefixes 如何存储在 radix tree 中，以及 KV blocks 如何在扎根于同一 branch 的 sequences 之间共享。
- 解释 cache-aware scheduling，以及为什么 FCFS 不适合 prefix-heavy traffic。
- 给定 prefix-cache hit rate 和 prompt length distribution，计算某个 workload 的预期 speedup。
- 说出让 6.4x 这个数字真实出现、而不是错失收益的 prompt-ordering discipline。

## 问题
经典 serving 会把每个请求的 prompt 当作 opaque。即使 5,000 个 RAG 请求都以同一个 2,000-Token system prompt 加同一个 retrieval preamble 开头，vLLM 也会对这个 2,000-Token prefix prefill 5,000 次。GPU 一遍又一遍地做相同工作。

观察结论是：agentic 和 RAG workloads 中的 prompts 几乎总是共享很长的 prefixes。System prompt、tool schemas、few-shot examples、retrieval headers、conversation history，全都会在请求之间重复。如果你把该 prefix 的 KV cache 存一次并复用它，就不需要再次 prefill。

RadixAttention 正是这样做的。Tokens 被索引到 radix tree 中；每个 node 拥有从 root 到该 node 路径上的 Token sequence 对应的 KV blocks。新请求会遍历这棵 tree：任何 Token 匹配的 node 都会复用该 node 的 KV blocks。Prefill cost 变成与“新的”suffix 成正比，而不是与完整 prompt 成正比。

挑战在于 scheduling。如果两个请求共享 2,000-Token prefix，而第三个请求只共享同一 prefix 中的 200 个 Token，你会希望把两个长共享请求放在一起服务，让长 prefix 留在 HBM 中。FCFS 做的正相反，它服务最先到达的请求，可能在下一个 long-prefix 请求命中之前就把 hot branch 驱逐掉。

## 概念
### 作为 KV index 的 radix tree

radix tree（compact trie）存储 Token sequences。每个 node 拥有一个 Token range，以及为该 range 计算出的 KV blocks。Children 会把 sequence 扩展一个或多个 Token。

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

一个新请求带着 system prompt + "Context: <doc A>" + "Question: Carol" 进来。调度器遍历：system prefix 匹配（复用 124 blocks），doc-A branch 匹配（复用 31 blocks），然后只为 "Question: Carol" 分配 fresh blocks（4 blocks）。Prefill cost：4 blocks 的新 Token。没有这棵 tree：160 blocks。prefill 节省约 ~40x。

### Cache-aware scheduling

如果 cache 不断 churn，基于 radix-tree 的复用就没有意义。两个关键策略：

1. **Depth-first dispatch**。从 queue 中选择下一个请求时，优先选择与当前 running set 扎根于同一 branch 的请求。这会让 hot branch 保持 pinned。
2. **Branch level 的 LRU，而不是 block level 的 LRU**。驱逐整条 branches（从 shortest-used leaves 开始），而不是单独的 blocks，这样 cache shape 才与 radix shape 匹配。

FCFS 违反了这两点。共享 2,000 个 Token 的请求排在共享 50 个 Token 的请求后面，然后 2,000-Token branch 被驱逐，以便容纳 50-Token 那个请求。

### 你应该记住的 benchmark 数字

- Llama 3.1 8B、H100、ShareGPT 1K prompts：SGLang ~16,200 tok/s，对比 vLLM ~12,500（约 29% 优势）。
- Prefix-heavy RAG（相同 system + 相同 doc，变化 question）：SGLang 上最高可达 6.4x。
- Voice cloning workloads：86.4% prefix-cache hit rate。
- SGLang customers 的生产 hit rates：取决于 prompt discipline，为 50-99%。
- 2026 年已部署在 400,000+ GPUs 上。

### ordering 陷阱

6.4x 这个数字依赖一致的 prompt-template ordering。如果你的 client 在某些请求中把 prompts 构造成 `[system, tools, context, history, question]`，在另一些请求中构造成 `[system, context, tools, history, question]`，tree 就无法找到 shared prefix。对人类看起来像 shared prefix 的东西，对 radix tree 来说是两个不同的 sequences。

工程师的杠杆：你的 prompt template 就是 cache key。固定顺序。把所有 immutable 内容（system、tools、schemas）放在前面。然后放 retrieval context。最后放 user question。不要把 dynamic content 交错插入 prefix。

研究中的真实案例：把 dynamic content 移出 cacheable prefix，让一次部署的 cache hit rate 通过一次改动从 7% 提升到 74%。

### RadixAttention 赢在哪里，输在哪里

Wins:
- RAG（相同 retrieval preamble，变化 question）。
- Agents（相同 tool schemas，变化 query）。
- 带长 system prompt 的 chat。
- 具有重复 preambles 的 voice / vision workloads。

Loses（回到 vLLM-level throughput）:
- 使用 unique prompts 的 single-shot generation（code completion、没有 system prompt 的 open-ended chat）。
- 每个请求都把 unique content 交错插入 prefix 的 dynamic prompts。

### 为什么这是 scheduler 问题，而不只是 kernel 问题

你可以把 KV reuse 实现成一个 kernel trick。SGLang 的洞见是，只有当调度器让 hot branch 保持 resident 时，reuse 才会有收益。一个朴素的“可用就复用”策略会在 mixed load 下让 cache churn。radix-tree-indexed scheduler 才是把 kernel trick 变成 29% 生产优势的关键。

### 与 vLLM 的相互作用

这两个系统并不是严格竞争关系。2026 年，vLLM 增加了 prefix caching（`--enable-prefix-caching`）和 cache-aware router（Rust 实现的 vLLM Router）。差距缩小了，但没有完全消失，SGLang 的整个 stack 是 radix-first；vLLM 是后接上去的。对于由 prefix reuse 主导的 workloads，SGLang 仍然是默认选择。对于没有强 prefix patterns 的 general-purpose serving，vLLM 仍然相当或更好。


```figure
roofline
```

## 使用它
`code/main.py` 实现了一个 toy radix-tree KV cache，以及一个带有两种策略的 scheduler：FCFS 和 cache-aware。它会让同一个 workload 分别通过两者运行，报告 prefix-cache hit rate 和 throughput delta。然后运行一个“scrambled ordering” workload，展示 6.4x 如何崩塌。

## 交付它
本课会生成 `outputs/skill-radix-scheduler-advisor.md`。给定一个 workload description（prompt-template shape、retrieval pattern、concurrent tenants 数量），它会生成一份 prompt-ordering prescription，以及是否采用 SGLang 的 go/no-go 判断。

## 练习
1. 运行 `code/main.py`。在同一个 workload 上比较 FCFS 和 cache-aware。delta 来自哪里，是 prefill savings、decode savings，还是 queue delay？
2. 修改 workload，让 prompts 随机排列 `[system, tools, context]`。重新运行。hit rate 会发生什么？为什么？
3. 计算在 Llama 3.1 8B 上，作为一条 radix branch 保持一个 2,000-Token system prompt resident 的 HBM cost。与没有 prefix reuse 的 16-sequence batch cost 做比较。
4. 阅读 SGLang RadixAttention paper。用三句话解释为什么在 prefix-heavy load 下，tree-shaped LRU eviction 优于 block-shaped LRU。
5. 某客户报告 cache hit rate 只有 8%。说出三个可能原因，以及你会为每个原因运行的 diagnostic。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "SGLang 那个东西" | KV cache 以 radix tree 索引，使 shared prefixes 能复用 blocks |
| Radix tree | "compact trie" | 每个 node 拥有一个 Token range 及其 KV blocks 的 tree |
| Cache-aware scheduler | "hot-branch-first" | 优先处理共享 resident branch 的请求的调度器 |
| Prefix-cache hit rate | "你的 prompt 有多少是免费的" | 从复用 KV blocks 服务的 prompt Tokens 比例 |
| FCFS | "first-come first-served" | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | "驱逐 leaf" | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | "cache key" | prompt 的 component order 决定 tree 能共享什么 |
| System prompt pinning | "resident prefix" | 保持 immutable system portion pinned，以避免 eviction thrash |

## 延伸阅读
- [SGLang GitHub](https://github.com/sgl-project/sglang) — source 和 docs。
- [SGLang documentation](https://sgl-project.github.io/) — RadixAttention 和 scheduling 细节。
- [SGLang paper — 高效编程 Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) — 设计 reference。
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) — benchmark 数字和 scheduler rationale。
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) — vLLM 自己的 radix-like 实现，用于比较。
