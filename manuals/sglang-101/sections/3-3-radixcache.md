# RadixCache

> RadixCache 把每一段缓存的 token 行程索引成一棵树，所以新请求复用最长匹配前缀，只 prefill 它后面的 token。

一个聊天产品每次提问都带同一段 2,000 token 的 system prompt。没有前缀复用的服务器会对每条请求都算那 2,000 个 token，每个用户都为同一份活再等一遍。在我们的 Mac 上，那份重复的活让共享前缀基准跑了 129.7 秒。打开 radix cache 后，同一基准只要 48.8 秒。

读完本节后，你能解释树如何找到前缀，以及为什么正在跑的请求会保住自己的前缀。你也能说出逐出如何删掉缓存的 token。你还能读证明命中的调度器日志行。

## 有树和没有树的同一工作负载 {#s-radixcache-the-same-workload-with-and-without-the-tree}

Capture kit 把 SGLang 自己的共享前缀基准跑两遍。四组各 16 条 prompt，每组共享一段 2,048 token 的 system prompt，每条再加 128 token 的问题。第二台服务器用 `--disable-radix-cache` 启动。

| 结果 | radix 缓存开 | `--disable-radix-cache` |
|---|---|---|
| Benchmark duration | 48.81 s | 129.68 s |
| 中位首 token 时间 | 1,358 ms | 7,222 ms |
| P99 首 token 时间 | 3,277 ms | 13,548 ms |
| 每秒输出 token | 83.91 | 31.59 |

我们测到运行短了 2.7 倍，等首 token 的中位时间短了 5.3 倍。调度器日志说明时间花在哪里。

```listing
title: one prefill batch with the radix cache
source: capture/out/server-default.log
lang: text
note: One line from the shared-prefix benchmark in the default configuration.
---
[2026-10-16 14:01:00] Prefill batch, #new-seq: 7, #new-token: 955, #cached-token: 15102, token usage: 0.05, #running-req: 1, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 1472.94
```

```listing
title: prefill batches without the radix cache
source: capture/out/server-no-radix-cache.log
lang: text
note: Three consecutive lines from the same benchmark with --disable-radix-cache.
---
[2026-10-16 14:02:34] Prefill batch, #new-seq: 3, #new-token: 4096, #cached-token: 0, token usage: 0.06, #running-req: 2, #queue-req: 3, #pending-token: 7883, cuda graph: False, input throughput (token/s): 2261.21
[2026-10-16 14:02:36] Prefill batch, #new-seq: 3, #new-token: 4096, #cached-token: 0, token usage: 0.08, #running-req: 4, #queue-req: 1, #pending-token: 3787, cuda graph: False, input throughput (token/s): 2245.89
[2026-10-16 14:02:38] Prefill batch, #new-seq: 2, #new-token: 3787, #cached-token: 0, token usage: 0.10, #running-req: 6, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 1626.02
```

有树时，七条新请求需要 955 个新 token，15,102 个 token 来自缓存。没有树时，调度器为八条请求填了三批最多 4,096 个 token，全部从零算起。那个 4,096 就是 [第 2.2 节](#s-the-scheduler-loop-and-schedule-policy) 的分块 prefill 大小。

```figure
id: fig-3-3
kind: comparison
title: one benchmark, two cache settings
claim: The radix cache cut the shared-prefix benchmark from 129.7 to 48.8 seconds and the median first-token wait from 7,222 to 1,358 ms.
caption: Read each pair of bars left to right. Both runs used the same 64 prompts on the same Mac. From capture/out/bench-shared-prefix.txt and capture/out/no-radix-cache-bench-shared-prefix.txt.
```

## 在 24 GB L4 上的同一测试 {#s-radixcache-the-same-test-on-a-24-gb-l4}

Mac 会让每次 prefill 都慢，所以我们在一块 NVIDIA L4 上用 `Qwen/Qwen3-8B` 重跑了测试。这次我们把共享 system prompt 的长度从 0 变到 4,096 个 token。每次运行有四组各 16 条 prompt、128 token 的问题、64 个输出 token，以及最多八条并发请求。每个长度跑三个种子。

```listing
title: prefill on the L4 with the radix cache
source: capture/gpu/out-l4/server-prefix-default.log
lang: text
note: Two lines from the run with a 2,048-token shared prompt. Timestamps are cut.
---
… Prefill batch, #new-seq: 3, #new-token: 405, #cached-token: 12952, token usage: 0.58, #running-req: 1, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 1452.28
… Prefill batch, #new-seq: 4, #new-token: 546, #cached-token: 17269, token usage: 0.58, #running-req: 4, #queue-req: 0, #pending-token: 0, cuda graph: True, input throughput (token/s): 2532.09
```

```listing
title: prefill on the L4 without the radix cache
source: capture/gpu/out-l4/server-prefix-no-radix-cache.log
lang: text
note: Two lines from the run with a 4,096-token shared prompt. Timestamps are cut.
---
… Prefill batch, #new-seq: 2, #new-token: 4096, #cached-token: 0, token usage: 0.68, #running-req: 1, #queue-req: 0, #pending-token: 5527, cuda graph: True, input throughput (token/s): 1632.42
… Prefill batch, #new-seq: 2, #new-token: 4096, #cached-token: 0, token usage: 0.74, #running-req: 2, #queue-req: 0, #pending-token: 1431, cuda graph: True, input throughput (token/s): 1634.70
```

有树时，L4 大约每秒 prefill 1,600 个 token，卡还在节流。每批 4,096 token 大约要 2.5 秒，没有树时每条请求都要为整段 prompt 付钱。

```figure
id: fig-3-3c
kind: chart
title: The longer the shared prompt, the more the tree saves
claim: With a 4,096-token shared prompt on the L4, the radix cache cut the median TTFT from 14,706 to 479 ms.
caption: Median TTFT against the shared prompt length, three seeds per point, on a log scale. Green is the default and rose is --disable-radix-cache. From capture/gpu/summary/l4.json.
```

| 共享提示 | 中位 TTFT，缓存开 | 中位 TTFT，缓存关 | 输出 tok/s，缓存开 | 输出 tok/s，缓存关 |
|---|---|---|---|---|
| 0 | 349 ms | 379 ms | 113.56 | 113.33 |
| 1,024 | 462 ms | 2,202 ms | 105.76 | 70.15 |
| 4,096 | 479 ms | 14,706 ms | 88.87 | 20.80 |

有缓存时中位 SM 时钟是 1,440 MHz，没有缓存、共享 4,096 token 时是 930 MHz。没有缓存的运行每个种子都停在我们 1,000 MHz 的地板之下。

**我们测到** 在 4,096 共享 token 时，中位等待短了 30.7 倍，吞吐是 4.3 倍。把两个倍数都当成上界。没有缓存的运行有 62% 的样本带热节流旗标，时钟低 35%。凉快的卡会缩小倍数，但 35% 的时钟差距解释不了 30 倍。没有共享 prompt 时，中位 TTFT 差 8%，在种子散布内，吞吐相同。

在 GB10 上用 `Qwen/Qwen3-30B-A3B-Instruct-2507` 做同样的扫描，倍数更小。在 4,096 共享 token 时，有树的中位 TTFT 是 589 ms，没有是 5,208 ms，8.8 倍。输出速率是 120.66 对 49.73 tok/s。没有树的服务器比另一台晚一天跑。它的中位时钟是 2,376 MHz，37% 的样本有节流旗标。有树的服务器跑在 2,496 MHz。

我们对这两块卡的假设是：GB10 上 prefill 更便宜。那个模型每个 token 大约激活 30 亿参数，所以每条重复的 prompt 再算一遍代价更小。还有两个混淆：没有缓存时被节流的 L4 运行抬高了 L4 的倍数，GB10 那一对在两天、不同时钟上跑。

## 树 {#s-radixcache-the-tree}

**RadixCache：** 建在 token 序列上的 radix tree，节点持有边上那些 token 的 KV 槽下标。设计来自 SGLang 论文，它把机制叫 RadixAttention {{paper}}。Radix tree 把 token 行程存在边上，所以一个节点可以装下整段 system prompt。

**TreeNode：** 树上的一个节点。它持有子节点（按第一个 token 作键）、以及边上的 token 行程 {{code}}。它还持有那些 token 的 KV 槽下标、锁计数、上次访问时间和命中计数。

四项操作做完所有活。

1. **match_prefix** 从根走起，跟着第一个 token 匹配的子节点。如果匹配停在一条边内部，就切开那个节点，好让边界精确。路径上每个节点都得到新的访问时间。
2. **insert** 同样走一遍，并为未匹配的 token 加一片叶子。如果另一条请求已经插入了同样的 token，SGLang 释放重复的槽，并把请求指到树上的那份。
3. **inc_lock_ref** 和 **dec_lock_ref** 计使用某个节点的正在跑的请求。计数大于零时保护到根的整条路径。
4. **evict** 释放没有请求锁住的叶子，最老的先，叶子消失后再往上走。

有一条规则让人吃惊。一次匹配最多覆盖 prompt 长度减一 {{code}}。最后一个 prompt token 永远走 prefill，因为模型需要它的 logits 来采样第一个输出 token。我们的缓存实验展示了这条规则：2,999 token 的 prompt 报告 2,998 个缓存 token 和 1 个新 token。

```figure
id: fig-3-3b
kind: tree
title: two groups of the shared-prefix benchmark in one tree
claim: Two running requests share one system-prompt node, and the tree splits exactly where their questions start.
caption: Read from the root down. Numbers on nodes are lock counts while two requests of group 1 run. Mechanism from RadixCache at v0.5.22, token counts from the settings of our shared-prefix benchmark.
```

## 在 v0.5.22 你拿到哪棵树 {#s-radixcache-which-tree-you-get-at-v0-5-22}

旧博客和 issue 里的类名是 `RadixCache`。在 v0.5.22 默认是 `UnifiedRadixCache`，一棵也处理 sliding-window 和 Mamba 状态的树 {{code}}。从 v0.5.21 起，树的行走默认在 Rust 核心里跑。我们 Mac 上的日志展示了例外。

```listing
title: the tree on the capture Mac
source: capture/out/server-default.log
lang: text
note: Three lines from the startup log of the default configuration.
---
[2026-10-16 13:58:06] Using the Python TreeCore: the Rust TreeCore supports Linux only
[2026-10-16 13:58:06] Init Unified Radix Cache. Components: (<ComponentType.FULL: 0>,). Tree Core: UnifiedTreeCore
[2026-10-16 13:58:06] Tree cache initialized: source=default impl=UnifiedRadixCache hybrid_swa=False hybrid_ssm=False hicache_attached=False
```

没有缓存的服务器打出同样三行。`--disable-radix-cache` 仍然建 `UnifiedRadixCache`，只是处于什么都不匹配、什么都不插入的禁用模式。更老的帖子描述的单独 `ChunkCache` 类在 2026-10-08 被删掉了 {{issue #43201}}。

## 调度器如何用树 {#s-radixcache-how-the-scheduler-uses-the-tree}

默认的 `--schedule-policy` 是 `fcfs`，先到先服务 {{code}}。论文里的 longest-prefix-match 顺序 `lpm` 是你自己的选择。代码只在等待请求不超过 128 时按前缀长度排序，因为匹配每条等待请求都要花时间 {{code}}。超过那个数，`lpm` 就用 FCFS 顺序。

调度器还避免一圈里的浪费。当好几条等待请求共享一段尚未缓存的前缀时，它让其中一条先 prefill 共享部分。其他的在下一圈复用。[第 2.2 节](#s-the-scheduler-loop-and-schedule-policy) 完整覆盖这些策略。

## 我们的立场：保持 radix cache 开着 {#s-radixcache-our-position-leave-the-radix-cache-on}

在我们没有共享 prompt 的运行里，在 L4 和 GB10 上，缓存测不到代价。我们没有在重度逐出下测它的代价。缓存的 token 和正在跑的请求住在同一个 pool 里，逐出按需释放它们。我们知道一个关掉它的理由：测试错误答案是不是来自复用的 KV。即便那时，也先试 `--kv-canary log`，它在缓存开着时检查 KV 槽是否损坏 {{code}}。

然后每加一个功能都一起测命中率。Issue #32459 就是警告 {{issue #32459}}。一个团队回放多轮智能体流量时，没有 speculative decoding 的深 prompt 命中率是 97%，开了 EAGLE 是 40% 到 53%。输入吞吐从每秒 43,981 降到 12,881 个 token，日志里没有错误。候选原因是 speculative decoding 预留的额外 KV，迫使树逐出已缓存的 prompt。

现场报告把传说放进比例。vLLM 也复用前缀，所以引擎对比测的是两套缓存互相比较。一次在 A10G 上对 16 个模型的独立测试发现，SGLang 在重复前缀上领先 {{field Varad More 2026-04}}。收益是 7B 到 9B 上首 token 时间少 20 到 40 ms。RunPod 对带缓存的 7,000 token 上下文的 70B 模型测到每流每秒 35.0 对 32.8 个 token {{field RunPod 2025-06}}。SGLang 论文报告吞吐最高高 6.4 倍 {{paper}}，那是作者相对 2024 年那些系统的最佳情况。

```takeaways
- 保持 radix cache 开着，只有为了隔离 KV bug 时才关掉。
- 预期收益随共享 prompt 的长度增长。
- 读 prefill 行里的 #cached-token 和 #new-token 来证明命中。
- 预期最后一个 prompt token 会 prefill，即便是完整命中。
- 只在有共享前缀、队列短的离线批上选 lpm。
- 加了 speculative decoding 之后再测一次命中率。
```

Sources: python/sglang/srt/mem_cache/radix_cache.py (TreeNode, match_prefix, insert, evict, inc_lock_ref), python/sglang/srt/mem_cache/unified_radix_cache.py, python/sglang/srt/mem_cache/unified_cache/tree_core_registry.py, python/sglang/srt/mem_cache/registry.py, python/sglang/srt/managers/schedule_batch.py (_compute_max_prefix_len), python/sglang/srt/managers/schedule_policy.py, python/sglang/srt/arg_groups/fields/schedule.py at v0.5.22, capture/out/bench-shared-prefix.txt, capture/out/no-radix-cache-bench-shared-prefix.txt, capture/out/server-default.log, capture/out/server-no-radix-cache.log, capture/out/cache-experiment.txt, the SGLang paper (arXiv 2312.07104), issues #32459 and #43201, the RunPod report of 2025-06-15, the Varad More benchmark of 2026-04-22. capture/gpu/out-l4/server-prefix-default.log, capture/gpu/out-l4/server-prefix-no-radix-cache.log, capture/gpu/summary/l4.json. capture/gpu/summary/gb10.json.
