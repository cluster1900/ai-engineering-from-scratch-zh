# 逐出策略与 HiCache

> 当 GPU pool 满了，SGLang 默认逐出最近最少使用的前缀，HiCache 把被逐出的前缀保存在主机内存和可选的存储里。

一个编码智能体持有八轮会话，历史涨过 25,000 个 token。GPU pool 装得下九十个这样的会话。第九十一个用户到来，SGLang 必须逐出一个缓存前缀腾地方。第一个用户回来时，他们的历史没了，服务器又把 25,000 个 token 全算一遍。

读完本节后，你能按测到的命中率选逐出策略。你也能决定分层缓存何时值得付代价，以及先改它的哪项设置。

## 逐出删掉什么 {#s-eviction-policies-and-hicache-what-eviction-removes}

逐出只删没有正在跑的请求锁住的缓存 token，也就是 [radix 树](#s-radixcache) 的叶子。它从不删正在跑的请求的 KV。那种情况是回退，[第 2.3 节](#s-admission-and-retraction) 覆盖它。逐出从分数最低的叶子开始，朝根走。

`--radix-eviction-policy` 决定分数 {{code}}。默认是 `lru`。

| Policy | Evicts first | When it helps |
|---|---|---|
| `lru` | the prefix with the oldest last access | most workloads, the default |
| `lfu` | the prefix with the fewest hits, then the oldest | a hot set of prompts that stays stable for hours |
| `slru` | prefixes with fewer than 2 hits, then the oldest | a stable hot set with a stream of one-time prompts |
| `priority` | prefixes of lower-priority requests | mixed traffic with request priorities |
| `tlru` | history that cannot change the next turn's prefill time | multi-turn agents with a tail-latency target |

**Tail-Optimized LRU (tlru)：** 一种策略，只保留下一轮延迟目标需要的那部分对话，并先逐出其余部分。它来自代码点名的一篇论文，arXiv 2510.15152。SGLang 团队报告在并发 32 的 DeepSeek-V4-Pro 上，p99 逐 token 延迟低了 43.9% {{team 2026-10}}。那个数字来自 v0.5.21 的发布说明，我们没找到对它的独立测试。

没有 `--radix-eviction-policy-config`，`tlru` 不会启动。那份配置需要 `threshold` 大于它的 `next_prompt_estimate`。我们用 `{"threshold": 512, "next_prompt_estimate": 256}` 启动了它。

## 我们的立场：在测到理由之前保持 lru {#s-eviction-policies-and-hicache-our-position-keep-lru-until-you-have-measured-a-reason}

SGLang 文档给了同样的建议：从 `lru` 开始，只对照测到的命中率再改 {{docs}}。基于频率的策略在热度转移时会伤人，因为昨天的热门 prompt 还占着内存，今天的 prompt 要为它付钱。只有当你能点名新策略服务的工作负载，并在改前改后量命中率时，才改策略。

一项 2026 年对两家公司生产轨迹的研究支持这个默认。它测了 14 种逐出策略，为其他缓存造的策略相对 LRU 收益很小。在那些轨迹里，活跃会话按规律节奏发下一轮，所以近因很好地预测了复用。

研究在两个狭窄情形里找到了收益。一个是快速逐出只用一次的前缀，当这种 prompt 塞满缓存时。另一个是按 miss 再算一遍的代价加权的逐出。我们自己没复现这些结果。在 SGLang 的策略里，`slru` 最接近第一种情形。

## 我们用多轮轨迹测到的 {#s-eviction-policies-and-hicache-what-we-measured-with-a-multi-turn-trace}

我们在 2026-10-23 用 `Qwen/Qwen3-0.6B` 跑了 24 个聊天会话的轨迹。每个会话有自己的 system prompt 和 6 轮 ShareGPT 问题，回答 64 个 token。会话在并发 8 下轮流，每轮再发整段历史。命中率是缓存的 prompt token 除以 prompt token。这是在我们 L4 节点的第二块 GPU 上，主人共享它，没有锁时钟。时钟不改变命中率，所以读命中率，不要读时间。

```listing
title: hit rate by pool size and policy, over the whole trace and per turn
source: capture/gpu/out-l4/eviction-multiturn.txt
lang: text
note: Four rows of the summary. The run with CUDA graphs off, the 16,384-token LFU run, and the default pool are cut.
---
pool, policy                 whole trace   hit rate per turn 1 to 6                        median SM clock
8,192 tokens, lru            0.19, 0.19    0.11, 0.31, 0.58, 0.39, 0.016, 0.013            615 MHz
…
8,192 tokens, lfu            0.375         0.11, 0.31, 0.58, 0.53, 0.34, 0.25              1,140 MHz
8,192 tokens, slru           0.367         0.11, 0.31, 0.58, 0.53, 0.31, 0.26              960 MHz
16,384 tokens, lru           0.685         rises to 0.83 at turn 6                         810 MHz
```

- **小 pool 让 LRU 抖动。** 在 8,192 个 token 时，24 个会话的循环比 pool 大。LRU 刚好在下一轮之前逐出每个会话的前缀，第 5、6 轮命中率降到大约 1.5%。
- **LFU 和 SLRU 只在那里帮了忙。** 同一份 pool 上，它们在第 5、6 轮保持 25% 到 34%。整条轨迹上，大约是 LRU 命中率的两倍。
- **更大的 pool 修好了它。** 在 16,384 个 token 和默认 pool 上，我们跑过的每种策略整条轨迹大约都到 0.69。

所以只有当 pool 对会回来的会话太小时，换策略才有帮助。先用 `--mem-fraction-static` 或 FP8 KV cache 把 pool 做大，然后再量一次策略。在这个 pool 大小上，服务器有几次运行也崩了。[第 7.1 节](#s-operating-sglang) 描述症状。

## HiCache：一棵树的三层 {#s-eviction-policies-and-hicache-hicache-three-tiers-for-one-tree}

**HiCache：** SGLang 的分层缓存，把 radix 树从 GPU 内存延伸到主机内存和存储后端。`--enable-hierarchical-cache` 打开它，默认关 {{code}}。各层在代码和文档里有名字。

- **L1：** [第 3.1 节](#s-kv-bytes-per-token-and-the-kv-pool) 的 GPU pool。
- **L2：** 钉住的主机内存里的 pool，私有于一个服务器实例。
- **L3：** 跨实例共享的可选存储后端，用 `--hicache-storage-backend` 设置。选项包括 `file`、`mooncake`、`hf3fs` 和 `nixl`。

树记录每个节点的 KV 住在哪里。一次匹配返回 GPU 命中长度和主机命中长度。SGLang 然后把主机部分装回新的 GPU 槽，比需要它的计算提前一层 {{docs}}。

`--hicache-write-policy` 决定节点何时在主机内存里得到一份拷贝。默认是 `write_through`。代码给 `write_through` 设命中阈值 1，给 `write_through_selective` 设 2 {{code}}。所以 `write_through` 在第一次命中时拷贝前缀，`write_through_selective` 等到第二次命中。`write_back` 只在 GPU 逐出节点时才拷贝。

```figure
id: fig-3-5
kind: flow
title: one prefix through the three HiCache tiers
claim: Under write_through, a prefix gets a host copy on its first hit, so GPU eviction no longer forces a full prefill.
caption: Read left to right for writes and right to left for load-back. Thresholds and defaults from UnifiedRadixCache at v0.5.22.
```

## 决定它是否有用的设置 {#s-eviction-policies-and-hicache-the-settings-that-decide-whether-it-helps}

L3 预取有自己的规则。存储命中短于 256 个 token 时，SGLang 跳过存储预取 {{code}}。默认预取策略是 `timeout`，在一段随 prompt 增长的时间后停止等存储。

文档和代码在那段时间上不一致。文档给基数 2 秒、每 1,024 个 token 0.1 秒、最大 30 秒 {{docs}}。v0.5.22 的代码用基数 1.0 秒、每 1,024 个 token 0.25 秒 {{code}}。我们在缓存代码里没找到最大值。代码说了算。一段 100,000 token 的 prompt 可以等存储大约 25 秒，然后 SGLang 再算一遍。

主机 pool 大小来自 `--hicache-ratio` 或 `--hicache-size`。两者都没有时，SGLang 最多取 `--hicache-host-memory-fraction`，默认是可用主机内存的 0.8 {{code}}。

## 其他团队测到的 {#s-eviction-policies-and-hicache-what-other-teams-measured}

我们没法在 capture Mac 上跑 HiCache，现场证据也薄。下一节有我们在 L4 上自己的测试。我们找到的数字来自 SGLang 团队及其合作方。

- SGLang RBG 团队和 Mooncake 团队在 Kubernetes 上跑了多轮基准 {{field Alibaba Cloud 2026-03}}。只有 GPU 内存时，平均首 token 时间是 5.91 秒。L2 层把它降到 3.77 秒，Mooncake L3 降到 2.58 秒。
- SGLang HiCache 帖引用了 Novita {{team 2025-09}}。Novita 报告平均首 token 时间低了 56%，命中率从 40% 升到 80%。

失败报告比成功记录得更好。在 issue #35129 里，找不到空间的装回逐出了其他会话的 GPU 前缀，25 万次逐出调用对 376 次完成的装回 {{issue #35129}}。Issue #30760 展示一个张量并行 rank 在预取检查里永远等待，而其他 rank 已经往前走 {{issue #30760}}。Issue #42465 展示 540,000 token prompt 的突发，开着 HiCache 时每个 rank 都挂住，关掉就能跑 {{issue #42465}}。

## 我们在 L4 上测到的 {#s-eviction-policies-and-hicache-what-we-measured-on-an-l4}

我们在一块 24 GB L4 上用 `Qwen/Qwen3-8B` 测了 L2。每组 8 条请求共享一段 2,048 token 的 system prompt，再加 64 token 的问题。我们把组数从 4 变到 64，保持最多 8 条并发请求，每个点三个种子。第二台服务器加了 `--enable-hierarchical-cache --hicache-ratio 4`。

GPU pool 持有 24,094 个 token，大约 11 段 system prompt。所以在 16 组或更多时，默认服务器必须逐出它还会再需要的 prompt。

```listing
title: the host tier on the L4
source: capture/gpu/out-l4/server-working-set-hicache.log
lang: text
note: The host pool at startup, then two prefill lines from the 64-group run.
---
[2026-10-17 17:35:15] Allocating kv hierarchical KV host pool: 96377 tokens, 14.21 GB host memory.
[2026-10-17 18:19:03] Prefill batch, #new-seq: 4, #new-token: 4096, #cached-token: 2196, token usage: 0.65, #running-req: 2, #queue-req: 0, #pending-token: 5234, cuda graph: True, input throughput (token/s): 1431.87
[2026-10-17 18:19:03] Prefill batch, #new-seq: 3, #new-token: 953, #cached-token: 4281, token usage: 0.65, #running-req: 5, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 1251.76
```

```listing
title: the same workload with the GPU pool only
source: capture/gpu/out-l4/server-working-set-default.log
lang: text
note: Two prefill lines from the 64-group run of the default server.
---
[2026-10-17 17:34:02] Prefill batch, #new-seq: 3, #new-token: 4096, #cached-token: 0, token usage: 0.65, #running-req: 5, #queue-req: 0, #pending-token: 1138, cuda graph: True, input throughput (token/s): 1573.58
[2026-10-17 17:34:03] Prefill batch, #new-seq: 1, #new-token: 1138, #cached-token: 0, token usage: 0.65, #running-req: 7, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 1347.58
```

```figure
id: fig-3-5c
kind: chart
title: HiCache held the prompts that the GPU pool evicted
claim: At 32 distinct system prompts on the L4, HiCache cut the median TTFT from 5,449 to 817 ms.
caption: Median TTFT against the number of distinct system prompts, three seeds per point, on a log scale. Rose is the GPU pool only and green adds the host tier. From capture/gpu/summary/l4.json.
```

| Groups | Prompt tokens to keep | Median TTFT, GPU only / HiCache | Output tok/s, GPU only / HiCache | Median SM clock, GPU only / HiCache |
|---|---|---|---|---|
| 4 | 8,192 | 360 / 361 ms | 82.39 / 81.64 | 1,455 / 1,440 MHz |
| 16 | 32,768 | 3,259 / 553 ms | 37.95 / 74.75 | 788 / 1,223 MHz |
| 32 | 65,536 | 5,449 / 817 ms | 25.72 / 69.29 | 465 / 765 MHz |
| 64 | 131,072 | 6,821 / 3,610 ms | 21.37 / 35.93 | 450 / 450 MHz |

**我们测到** 在 4 组时没有代价，那时每段 prompt 都装得进 GPU。在 32 组时，主机层把中位等待缩短了 6.7 倍，吞吐是 2.7 倍。两台服务器在那里都远低于我们 1,000 MHz 的时钟地板。HiCache 服务器跑在默认服务器时钟的 1.65 倍。所以 6.7 倍混进了缓存效果和时钟差距。

在 64 组时，prompt 需要的比 GPU 加主机 pool 合起来还多，大约 120,000 个 token。HiCache 仍把等待缩短了 1.9 倍，但已经不再接近 4 组的结果。

这些运行里卡很热。从 16 组起，52% 到 95% 的样本在两台服务器上都有热节流旗标。默认服务器重算更多、跑得更热，所以它损失的一部分是时钟。上面的缓存命中行不依赖时钟，那是更强的证据。

GB10 用不同模型 `Qwen/Qwen3-30B-A3B-Instruct-2507`、不开 HiCache 跑了同一工作负载作对照。我们在那里关掉主机层。GB10 的 CPU 和 GPU 共用一块内存，主机拷贝会从和 pool 同一个地方拿内存。

```listing
title: the GB10 pool and two prefill lines from the 64-group run
source: capture/gpu/out-gb10/server-working-set-default.log
lang: text
note: The pool at startup, then two consecutive prefill lines. Long lines are cut.
---
[2026-10-17 19:33:31] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 260013, K size: 11.90 GB, V size: 11.90 GB
[2026-10-17 19:52:36] Prefill batch, #new-seq: 1, #new-token: 67, #cached-token: 2196, token usage: 0.01, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 29.36
[2026-10-17 19:52:36] Prefill batch, #new-seq: 7, #new-token: 476, #cached-token: 15146, token usage: 0.06, #running-req: 1, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 1605.53
```

它的 pool 持有 260,013 个 token，一次装得下全部 64 段 system prompt。第二条 prefill 行为 7 条新请求在缓存里找到 15,146 个 token。中位 TTFT 从 4 组到 64 组都停在 448 到 460 ms。什么都没被逐出，所以主机层没什么可装回的。

我们的测试指向一条规则：你的工作集大小。把用户几分钟内会回来找的那些不同前缀加起来。在我们的测试里，当那个和大于 GPU pool、又小于 GPU 加主机 pool 时，主机层付得起。当它小于 GPU pool 时，主机层什么也没加。

## 我们的立场：为长会话加 HiCache，并且分步加 {#s-eviction-policies-and-hicache-our-position-add-hicache-for-long-sessions-and-add-it-in-steps}

HiCache 在会话活得比 GPU pool 久时付得起自己：多轮聊天、编码智能体，以及被问好几次的长文档。对短的一次性 prompt，它加上拷贝和装回，却没什么可复用。按这个顺序加，并在每一步量命中率和 p99 首 token 时间。

1. 先让 prompt 前缀稳定，像 [第 3.4 节](#s-prefix-friendly-prompts)。
2. 只开 L2，用默认的 `write_through`。
3. 如果主机拷贝吃太多 PCIe 带宽，切到 `write_through_selective`。
4. 当好几个实例应共享前缀时，加 L3 后端。
5. 最后再改逐出策略。

```takeaways
- 当你的重复前缀大于 GPU pool 时加主机层，并在你的卡上量它。
- 在测到的命中率给出理由之前保持 lru。
- 后面几轮命中率下降时，先把 pool 做大，再改策略。
- 为长的多轮会话打开 HiCache，不要为一次性 prompt 打开。
- 先只用主机内存开 HiCache，量过之后再加存储。
- 在 v0.5.22 上，信任代码的预取超时，而不是文档。
- 部署 HiCache 之前，在 issue 里留意逐出风暴和 rank 挂住。
```

Sources: python/sglang/srt/mem_cache/evict_policy.py, python/sglang/srt/mem_cache/unified_radix_cache.py (write_through_threshold, prefetch_timeout_base), python/sglang/srt/mem_cache/hybrid_cache/hybrid_pool_assembler.py (prefetch_threshold), python/sglang/srt/arg_groups/fields/memory.py at v0.5.22, docs/docs/advanced_features/hicache_design.mdx and radix_eviction_policy.mdx at v0.5.22, the v0.5.21 release notes, Liu, Yu, and Yang, When Fancy Eviction Fails: Rethinking Cache Replacement For LLM Prefix Reuse, arXiv 2609.28870 (2026-09), the SGLang HiCache post of 2025-09-10, the RBG and Mooncake post on the Alibaba Cloud blog of 2026-03-10, issues #35129, #30760, and #42465, arXiv 2510.15152. capture/gpu/out-l4/server-working-set-hicache.log, capture/gpu/out-l4/server-working-set-default.log, capture/gpu/summary/l4.json. capture/gpu/summary/gb10.json. capture/gpu/out-gb10/server-working-set-default.log. capture/gpu/out-l4/eviction-multiturn.txt, capture/gpu/out-l4/small-pool-crash.txt.
