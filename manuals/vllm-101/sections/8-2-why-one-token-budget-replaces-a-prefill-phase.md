# 为什么一个 token 预算取代了 prefill 阶段

> 本页解释 scheduler 循环、decode 优先，以及通过重新计算实现的抢占。

大多数关于 LLM 推理服务的讲解都会描述一个 prefill 阶段和一个 decode 阶段。vLLM 的 scheduler 两者都没有。读完本节后，你能解释 scheduler 在一个 step 里做什么，以及为什么这种设计让 chunked prefill 成为默认。

## 对每个请求问同一个问题 {#s-why-one-token-budget-replaces-a-prefill-phase-one-question-for-every-request}

scheduler 对每个请求都问同一个问题：这个请求还需要计算多少个 token？新请求需要计算它全部的 prompt token。运行中的请求需要一个 token，使用投机解码时更多。scheduler 源码里的一条注释用自己的话说了同样的意思。没有 decode 阶段，也没有 prefill 阶段，只有还要计算的 token 数。

在每个 step 里，scheduler 有一个由 `--max-num-batched-tokens` 设定的 token 预算。在显存小于 70 GiB 的 GPU 上（例如 L4）运行 `vllm serve` 时，默认值是 2,048。它按这个顺序花掉预算：

1. 给每个运行中的请求分配它需要的 token，直到用完预算。
2. 在预算和运行中请求的名额都还有剩余时，接纳等待中的请求。`--max-num-seqs` 限制运行中的请求数。对 `vllm serve`，显存小于 70 GiB 的 GPU 上默认值是 256，更大的 GPU（A100 除外）上是 1,024。

放不进剩余预算的长 prompt，现在先得到一部分预算，其余的在之后的 step 里得到。这就是 chunked prefill。它默认开启，因为预算设计不需要任何额外的东西来支持它。

```figure
id: fig-8-2
kind: timeline
title: one token budget
claim: Each step spends 2,048 tokens: running requests get a decode token first, and a new prompt fills the rest in chunks.
caption: Each row is one scheduler step. Prompt chunks are drawn to scale, and decode blocks are widened so you can see them. Dashed space is unused budget. From the vLLM source at v0.31.0.
```

## 为什么 decode 优先 {#s-why-one-token-budget-replaces-a-prefill-phase-why-decode-goes-first}

运行中的请求排在前面，所以已经看到流式输出的用户会继续看到它。新 prompt 等待剩下的预算。vLLM 文档说明了其中的取舍。预算越小，流式输出越平稳；预算越大，长 prompt 的首 token 越快。2,048 这个较小的默认值是为流式输出做的选择。显存 70 GiB 及以上的 GPU 默认是 8,192，[长 prompt 页](#s-keep-long-prompts-from-stalling-short-ones)列出了这条规则。

## 内存用完时会发生什么 {#s-why-one-token-budget-replaces-a-prefill-phase-what-happens-when-memory-runs-out}

运行中的请求每 16 个 token 就需要一个新的 KV block。如果没有空闲 block，scheduler 就会抢占一个请求。在默认的先到先服务策略下，它会选最新的那个运行中请求。它释放这个请求的全部 block，并把请求放回等待队列的队首。这个请求再次运行时，vLLM 会从头重新计算它的 token。

较旧的 vLLM 版本还可以把 block 复制到 CPU 内存再复制回来。现在的引擎只做重新计算，因为文档认为在这个架构下重新计算更便宜。代价表现为被抢占请求的耗时更长，以及 `vllm:num_preemptions` 计数器。

## 为什么只用一个预算 {#s-why-one-token-budget-replaces-a-prefill-phase-why-one-budget}

所有类型的工作共用一个预算，让 scheduler 保持简单。prefix caching 只是降低要计算的 token 数。投机解码只是提高运行中请求的 token 数。同一个循环服务所有这些情况。代价是由一个数字决定首 token 和流式输出之间的平衡。这个数字没有哪个值能适合所有负载。

```takeaways
- scheduler 从每个 step 的一个预算里，给每个请求分配它还需要的 token。
- 运行中的请求先拿到预算，所以流式输出保持平稳。
- 内存用完时，vLLM 会释放一个请求，稍后重新计算它。
```

Sources: the vLLM source at v0.31.0 (vllm/v1/core/sched/scheduler.py, vllm/config/scheduler.py), vLLM documentation at v0.31.0 (docs/configuration/optimization.md).
