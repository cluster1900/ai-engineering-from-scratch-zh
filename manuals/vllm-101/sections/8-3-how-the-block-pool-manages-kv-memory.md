# block 池如何管理 KV 内存

> 本页解释以哈希为键的 block、淘汰，以及混合模型的 KV group。

vLLM 起源于一篇关于一个想法的论文：像操作系统用页来存放内存那样，用固定大小的 block 来存放 KV cache。读完本节后，你能解释 vLLM 如何为重复的前缀再次找到 block。你还能说出哪个 block 最先被淘汰。

## 用 block，而不是每个请求一块缓冲区 {#s-how-the-block-pool-manages-kv-memory-blocks-not-one-buffer-for-each-request}

启动时，vLLM 把 KV cache 分成每块 16 个 token 的 block，并把它们全部放在一个池里。请求随着增长一次拿一个 block。它的 block 在内存中不需要相邻。一张小表把请求的 token 位置映射到 block 编号。

这消除了每个请求一块缓冲区带来的两种浪费。不会有内存为请求永远达不到的长度而预留。不同长度的请求之间也不会形成空隙。原始论文把这称为 PagedAttention。

## 再次找到前缀 {#s-how-the-block-pool-manages-kv-memory-finding-a-prefix-again}

一个 block 填满时，vLLM 会把它的 token 和前一个 block 的哈希一起计算哈希。这条链意味着一个哈希代表整个前缀，而不只是 16 个 token。哈希还涵盖会改变 key 和 value 的其他输入。这些输入是 LoRA adapter、prompt 中的图片，以及每个请求可选的 salt。

新请求会对它的 prompt 计算同样的哈希链。引擎在一个映射表里逐个查找这些哈希，遇到第一个未命中就停止。未命中之前的每个 block 都是命中，它们的 token 不需要计算。只有完整的 block 才会被缓存，所以 prompt 最后不足 16 个 token 的部分总是要计算。

从 0.11 版本起，哈希默认使用 SHA-256。还有一个更快的哈希可选，但文档警告说，哈希碰撞可能返回错误的 cache 条目，或者在租户之间泄露数据。

```figure
id: fig-8-3
kind: structure
title: the block pool
claim: The KV cache is one pool of 16-token blocks that requests take in any order, mapped by a block table for each request.
caption: Coloured blocks belong to the request of the same colour. Dashed blocks are free. From the vLLM source at v0.31.0.
```

## 淘汰 {#s-how-the-block-pool-manages-kv-memory-eviction}

没有请求使用的 block 会进入空闲列表，并保留它的哈希。之后具有相同前缀的请求仍然可以使用它。vLLM 需要新 block 时，会取空闲列表头部的 block，也就是闲置最久的那个。直到这时，旧内容才会消失。

所以 cache 就是这个池。不存在单独的 cache 内存，繁忙的服务器保留的旧前缀比空闲的服务器少。

## 混合模型使用 group {#s-how-the-block-pool-manages-kv-memory-hybrid-models-get-groups}

带有 sliding-window 层或 state-space 层的模型，并不会在每一层都为每个 token 保留一个条目。引擎把每种层放进它自己的 group。每个 group 有自己的页大小和自己的 cache 命中规则。例如，sliding-window 层只需要最后一个窗口内的 block。这些 group 共享一个池。[长上下文页](#s-serve-long-contexts-and-hybrid-models)讲解了这对你的设置意味着什么。

```takeaways
- KV cache 是一个由 16 token block 组成的池，请求随着增长从中取用。
- 一条哈希链逐个 block 地找到重复的前缀。
- 闲置最久的 block 最先被淘汰，而且只在需要新 block 时才淘汰。
```

Sources: the vLLM source at v0.31.0 (vllm/v1/core/kv_cache_manager.py, vllm/v1/core/block_pool.py, vllm/v1/core/kv_cache_utils.py, vllm/config/cache.py), vLLM documentation at v0.31.0 (docs/design/prefix_caching.md, docs/design/hybrid_kv_cache_manager.md), the PagedAttention paper (SOSP 2023).
