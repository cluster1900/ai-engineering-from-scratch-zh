# --tp-size、--dp-size 与 --attn-dp-size

> 张量并行让模型装得下，数据并行加容量，注意力数据并行去掉张量并行为 MLA 模型制造的那些 KV 副本。

你有八块 GPU 和一个大模型。多数人敲的第一条命令是 `--tp-size 8`，模型就加载了。然后同事问，为什么 DeepSeek 模型在 640 GB 内存上，服务器只持有这么少 token 的 KV 缓存。答案在 SGLang 如何把一个模型拆到多块 GPU 上，以及一个在 v0.5.22 改过含义的标志。

读完本节后，你能为一个模型和一块 GPU 数量选择 `--tp-size`、`--dp-size` 与 `--attn-dp-size`。你也能说出哪些 GPU 分担哪些工作，并读懂仍在用 `--enable-dp-attention` 的旧配方。

## 一个 world，多种拆法 {#s-tp-size-dp-size-and-attn-dp-size-one-world-many-ways-to-split-it}

**Model world：** 一起持有一份模型副本的那一组 GPU。SGLang 只用两个数字构建它。当 world size 不是 `tp_size` 乘以 `pp_size` 时，代码会报错 {{code}}。

**张量并行（TP）：** 每层的权重矩阵切成 `--tp-size` 份，每块 GPU 一份。然后每一层都以一次把切片合起来的集合通信结束。**流水线并行（PP）：** 整层按顺序分到不同 GPU，`--pp-size` 设定阶段数。

其他一切都是在拆同一个 world。注意力数据并行、专家并行与上下文并行都不加 GPU。它们为不同层把 TP 组的 GPU 重新分组。

记住一个心智模型，后面每个标志都更好读。TP size 是一份模型副本里的 GPU 数。其他宽度是切割那一组的方式。

```figure
id: fig-6-1
kind: layers
title: one TP group of eight GPUs, split three ways
claim: With --tp-size 8, --attn-dp-size 4, and --ep-size 8, the same eight GPUs form one TP group, four attention groups, and one expert group.
caption: Read each row as one layer type. Each square is one GPU. Attention groups are contiguous rank ranges, and an expert group equal to the TP group reuses it. From the group construction code at v0.5.22.
```

这些标志每一个的默认都是 1 {{code}}。所以一条普通的 `sglang serve` 用一块 GPU、一个调度器与一份模型。

## 「数据并行」的两种含义 {#s-tp-size-dp-size-and-attn-dp-size-two-meanings-of-data-parallel}

**数据并行（DP）：** 几份完整的模型副本，各自有自己的请求与自己的 KV 缓存。`--dp-size 2` 配 `--tp-size 4` 把八块 GPU 用成两个四人 world。一个数据并行控制器进程把每个新请求交给其中一份副本 {{code}}。其默认方法 `auto` 在 prefill-decode disaggregation 之外解析为 `round_robin`。

```figure
id: fig-6-1b
kind: tree
title: two data parallel copies behind one controller
claim: Round robin sends alternate requests to two worlds that share no KV cache, so a repeated prefix can miss in the other world.
caption: Read top to bottom. The controller is the default round_robin method. Each world is a TP group of four GPUs with its own cache. From the data parallel controller and serving hook code at v0.5.22.
```

**注意力数据并行：** 在同一个 TP 组里，注意力层跑数据并行，而前馈或专家层仍跨全部 GPU 拆分。每个注意力组有自己的调度器、自己的请求与自己的 KV 缓存。`--attn-dp-size 4` 配 `--tp-size 8` 给出四个各两块 GPU 的注意力组。

在 v0.5.22 之前，一个标志承载两种含义。`--dp-size` 计模型副本，除非还设了 `--enable-dp-attention`，那时它计注意力组。Pull request [#41818](https://github.com/sgl-project/sglang/pull/41818) 用一句话给出改动的理由："`--dp-size` means two different things... Every reader has to look at both flags to know which meaning it has." 它于 2026-09-30 合并。

v0.5.22 的代码对旧拼法做三件事 {{code}}：

| 你传入 | SGLang 做 |
|---|---|
| `--dp-size 8 --enable-dp-attention` | 改写为 `--attn-dp-size 8 --dp-size 1` 并打印弃用警告 |
| `--attn-dp-size 8` | 新拼法，同样的布局 |
| `--dp-size 2 --attn-dp-size 4` | 报错：副本与注意力数据并行的组合不受支持 |

警告会点名新标志，代码里的注释说在 2026-12-31 之后去掉旧标志 {{code}}。网上许多 DeepSeek 配方仍用旧拼法。它们今天还能用，在以后的发布里会停。

## 为什么注意力有自己的数据并行模式 {#s-tp-size-dp-size-and-attn-dp-size-why-attention-gets-its-own-data-parallel-mode}

DeepSeek 模型用 multi-head latent attention（MLA）。MLA 为每个 token 与每一层存一个压缩的 latent 向量，也就是一个 KV「头」。[第 3.1 节](#s-kv-bytes-per-token-and-the-kv-pool) 讲过它的大小。张量并行不能把一个头拆到多块 GPU 上，所以带 `--tp-size 8` 时每块 GPU 都为每个 token 存完整的 latent 缓存。八块 GPU 就持有同一份 KV 缓存的八个副本。

SGLang 团队在 v0.4 加入该模式时给出了这个理由 {{team 2024-12}}。有了注意力数据并行，每个注意力组只保留自己的请求。服务器的 KV 容量随组数增长。团队报告 DeepSeek 模型的 decode 吞吐最多升到 1.9 倍，那是他们的说法。

对带 grouped-query attention（GQA）的稠密模型，这个理由不成立。GQA 有多个 KV 头，所以张量并行已经能不复制地把缓存拆开。

## 注意力数据并行会为你改什么 {#s-tp-size-dp-size-and-attn-dp-size-what-attention-data-parallelism-changes-for-you}

打开注意力数据并行会改另外两个没有自己标志的设置 {{code}}：

- `chunked_prefill_size` 除以 `--attn-dp-size`。你在一块 GPU 上调好的 chunk 大小，在每个注意力组上会变小。服务器日志会打印旧值与新值。
- `schedule_conservativeness` 乘以 0.3。调度器随后用更小的未来 token 预留接纳新请求。[第 2.3 节](#s-admission-and-retraction) 解释了那份预留。

第一个改动是让人吃惊的那个。一个用 `--chunked-prefill-size 8192` 测过 TTFT、然后加了 `--attn-dp-size 8` 的团队，现在跑的是 1024 token 的 chunk。长提示要更多调度步才能做完 prefill。

## 我们的立场 {#s-tp-size-dp-size-and-attn-dp-size-our-position}

用张量并行让模型装得下，别多做。用数据并行副本加容量，可以在一台服务器里用 `--dp-size`，也可以作为[第 6.4 节](#s-sgl-model-gateway) 网关后面的分开服务器。给每一份副本差不多同样大的池。我们唯一的一对池大小不等，它在每一种负载下都输了。对 DeepSeek 与 Kimi 这类 MLA 混合专家模型，把 `--attn-dp-size` 设成等于 `--tp-size`，对稠密 GQA 模型则留在 1。

一份现场报告支持这个顺序。一个学生团队在 H100 与 H200 节点上为比赛调 DeepSeek-R1 {{field Lowndes 2025-11}}。普通的 `--tp 16` 离线大约给出 5.9k token/秒。他们最好的布局是一个 H200 节点上的 TP4 配 DP4、PP2 与注意力数据并行，给出 17,417 token/秒。把他们的数字当作一个数据点，因为那篇[写出来的笔记](https://luca.lowndes.net/blog/sglang-optimisations)对 `--mem-fraction-static` 的解释是错的。

蚂蚁集团在生产里做了同类选择。他们的 DeepSeek-R1 decode 跑在两个节点上，带 16 个注意力组与 16 路专家并行 {{field Ant-Group 2025-09}}。

## 多个节点 {#s-tp-size-dp-size-and-attn-dp-size-several-nodes}

一个 model world 可以跨机器。三个标志描述它 {{code}}：

| 旗标 | 默认 | 含义 |
|---|---|---|
| `--nnodes` | 1 | 一个 world 里的机器数 |
| `--node-rank` | 0 | 这台机器的位置，从 0 起 |
| `--dist-init-addr` | none | 所有 rank 会面以构建组的 `host:port` |

只有 node 0 跑分词器与 HTTP API。其他节点跑自己的调度器进程、一个小的健康服务器，别的都不跑 {{code}}。把负载均衡器指向 node 0。也要把相邻 rank 留在同一台机器上，因为 TP 组是连续的 rank 范围，它们的集合通信需要盒子内部的快速链路。

一次真实事故展示了网络细节如何能让这一切停住。一个用户在节点间跑注意力数据并行，并在 `--dist-init-addr` 里放了 IPv6 地址（[issue #19953](https://github.com/sgl-project/sglang/issues/19953)）。服务器挂在发给调度器的第一条消息上，从来没有服务过任何请求。原因是控制器绑定的 ZeroMQ socket 没有打开 IPv6。线程里提出了修复。我们未能确认它已合并。

## 测什么 {#s-tp-size-dp-size-and-attn-dp-size-what-to-measure}

在加 GPU 之前，先用[第 5.1 节](#s-sglang-benchmark-serving) 的基准测一份副本。看[第 5.2 节](#s-the-metrics-endpoint) 的 `sglang:num_queue_reqs` 与 `sglang:token_usage`。队列在增长而 token 使用率仍低，指向算力上限，更多副本有帮助。Token 使用率接近 1.0 指向 KV 内存上限，先减小每个 token 的 KV 缓存更有帮助。

对注意力数据并行，看 `sglang:dp_attention_token_imbalance_ratio`。它报告最忙那一组的 token 数相对平均值，1.0 表示均衡。我们的 `/metrics` 抓取即使在单台 Mac 上也列出它，所以仪表盘可以在你需要它之前就把它放进去。

## 两块 L4 上发生了什么 {#s-tp-size-dp-size-and-attn-dp-size-what-happened-on-two-l4s}

我们在一台机器上有两块 NVIDIA L4，第二块还跑着另一团队的两个小 pod。每个 pod 占 1,746 MiB。我们用 `--tp-size 2` 启动 `Qwen/Qwen3-8B`，服务器在 NCCL 启动两秒后停下。

```listing
title: tensor parallelism refuses an unevenly loaded pair
source: capture/gpu/incidents/l4-tp-unbalanced-memory.txt
lang: text
note: The scheduler exception from the server log, with the other lines cut.
---
RuntimeError: The memory capacity is unbalanced. Some GPUs may be occupied by other processes. pre_model_load_memory=18.28375244140625, local_gpu_memory=21.70391845703125, local_gpu_memory * 0.9=19.533526611328124
```

在加载权重之前，每个 rank 测量自己的空闲内存，组保留最小值。如果那个值小于本地空闲内存的 90%，服务器就停下 {{code}}。第二块卡有 18.28 GB 空闲，对上检查要求的 19.53 GB。在 v0.5.22 没有标志能关掉这项检查。

检查停下来是对的。TP 组的每个 rank 持有同样份额的权重与同样大小的池。最小的那块卡为所有卡设定大小。在共享机器上，给一个 TP 组整块 GPU。`--dp-size 2` 没有这项检查，因为每一份副本自己定池大小，所以它在同一对卡上启动了。

## 同一对卡上的数据并行输了 {#s-tp-size-dp-size-and-attn-dp-size-data-parallelism-on-the-same-pair-lost}

我们预期两份副本大约能服务一份的两倍。它们服务得比一份还少。我们用[第 4.3 节](#s-quantization) 的闭环 sweep，每个点三个种子。每个请求有 512 个输入 token 与 128 个输出 token。第一次跑用一块 L4，第二次在两块上用 `--dp-size 2`。

```listing
title: two copies, two very different pools
source: capture/gpu/out-l4/server-dp2.log
lang: text
note: Startup lines, and four decode lines logged at 64 running requests on 2026-10-17 at 07:26. Timestamps are cut.
---
… DP0] Load weight end. elapsed=3.61 s, type=Qwen3ForCausalLM, avail mem=6.59 GB, mem usage=15.28 GB.
… DP1] Load weight end. elapsed=3.73 s, type=Qwen3ForCausalLM, avail mem=3.17 GB, mem usage=15.28 GB.
… DP0] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 24094, K size: 1.65 GB, V size: 1.65 GB
… DP1] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 2925, K size: 0.20 GB, V size: 0.20 GB
… DP1] Decode batch, #running-req: 4, #token: 2385, token usage: 0.82, cuda graph: True, gen throughput (token/s): 25.48, #queue-req: 59
… DP0] Decode batch, #running-req: 1, #token: 590, token usage: 0.02, cuda graph: True, gen throughput (token/s): 9.67, #queue-req: 0
… DP1] Decode batch, #running-req: 4, #token: 2545, token usage: 0.87, cuda graph: True, gen throughput (token/s): 25.79, #queue-req: 59
… DP0] Decode batch, #running-req: 3, #token: 1665, token usage: 0.07, cuda graph: True, gen throughput (token/s): 9.49, #queue-req: 0
```

第二块卡在权重之后有 3.17 GB 空闲，对上第一块的 6.59 GB，因为那两个 pod 占了其余部分。**我们测到**那份副本的池是 2,925 个 token，是第一份的八分之一。四个各 640 token 的请求就把它填满。

控制器仍把每隔一个请求发给那份副本，因为 `round_robin` 不看池或队列。基准一次保持 64 个请求打开。在并发 64 时，其中 63 个坐在小副本上，4 个在跑、59 个在等。大副本有一到三个请求，只用了池的 2% 到 7%。客户端在小副本交回一个槽之前，不能再给它更多工作。

```figure
id: fig-6-1c
kind: chart
title: Two copies of the model served less than one
claim: One L4 reached 270 tokens per second, and the shared pair with --dp-size 2 peaked at 64 and fell to 42 as its clock fell.
caption: Output throughput against max concurrency, three seeds per point. Plum is one L4 and rose is --dp-size 2 on two L4s with the shared second card. From capture/gpu/summary/l4.json.
```

**我们测到**尾部也有代价。在并发 64 时，三个种子的中位 p99 TTFT 在一块 L4 上是 33.4 秒，两份副本是 391 秒。单卡跑在 2026-10-16，那一对在 2026-10-17。在 32 与 64 个用户时，那一对跑在 765 与 675 MHz，低于我们的时钟下限。单卡跑在 1,320 与 1,080 MHz，所以那部分损失是时钟。

到并发 4，两份副本已经慢了 16% 到 41%，原因我们没有单独拆开。在 1 个用户时，那一对每个 token 要 79.6 ms，对上 60.2 ms，且时钟更高。

[第 5.1 节](#s-sglang-benchmark-serving) 的开环 sweep 也同意。请求以固定速率到达时，两份副本在我们的延迟目标内最多完成每秒 0.21 个请求。一块 L4 单独完成 0.96。

然后我们测了可能有帮助的两种设置之一。`--load-balance-method total_tokens` 把每个请求发给持有最少 token 的那份副本。

```listing
title: the same uneven pair, routed by tokens
source: capture/gpu/out-l4/server-dp2-tokens.log
lang: text
note: The two pools at startup. The second card was still shared, so its copy had an eighth of the pool.
---
[2026-10-19 00:24:05 DP0] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 24094, K size: 1.65 GB, V size: 1.65 GB
[2026-10-19 00:24:06 DP1] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 2925, K size: 0.20 GB, V size: 0.20 GB
```

**我们测到**相对 round robin 有很大增益，相对单卡仍是损失。三次跑分别在 2026-10-19、2026-10-17 与 2026-10-16。

在 64 个用户时，按 token 路由的那一对给出 114.7 tok/s，对上 round robin 的 41.7 与单块 L4 的 250.9。在 8 个用户时给出 92.1，对上 64.2 与 112.6。64 个用户时的中位 TTFT 从 4,763 降到 3,977 ms。64 个用户时的中位时钟是 1,020 MHz，对上 round-robin 跑的 675 MHz。所以部分增益可能是卡本身。

另一种设置是[第 6.4 节](#s-sgl-model-gateway) 网关后面两台分开的服务器，各带一个权重。我们没有测它。我们也没有测池大小相等的一对。在我们不均衡的那一对上，`--dp-size 2` 在每一种负载下都输了。我们预期只有每一份副本有差不多同样大的池时，数据并行才会加容量。在信任总和之前，先检查每个 `DP` rank 的 `#tokens` 行。

```takeaways
- 把 --tp-size 设成装下模型及其 KV 缓存所需的最小 GPU 数。
- 只有每一份副本有差不多同样大的池时，才用 --dp-size 副本或分开的服务器加容量。
- 只对 MLA 混合专家模型把 --attn-dp-size 设成等于 --tp-size。
- 在指望 --dp-size 之前，先检查每个 DP rank 的 #tokens 行。
- 把旧配方从 --dp-size N --enable-dp-attention 改写成 --attn-dp-size N。
- 打开注意力数据并行之后，重新检查你的分块 prefill 大小。
- 把请求发给 node 0，并把每个 TP 组留在一台机器内。
```

Sources: python/sglang/srt/distributed/parallel_state.py (initialize_model_parallel), python/sglang/srt/distributed/bootstrap.py (_check_tp_memory_balance), capture/gpu/incidents/l4-tp-unbalanced-memory.txt, capture/gpu/out-l4/server-dp2.log, capture/gpu/summary/l4.json, python/sglang/srt/arg_groups/fields/parallel.py, python/sglang/srt/arg_groups/parallel_hook.py (handle_deprecated_dp_attention, handle_data_parallelism), python/sglang/srt/server_args.py, python/sglang/srt/entrypoints/engine.py, and python/sglang/srt/managers/data_parallel_controller.py, all at v0.5.22. capture/out/metrics.txt. Pull request #41818, issue #19953. LMSYS, "SGLang v0.4", 2024-12-04. Luca Lowndes, "SGLang optimisations", 2025-11-07. Ant Group on the LMSYS blog, 2025-09-26; capture/gpu/out-l4/server-dp2-tokens.log, capture/gpu/summary/l4.json (load.dp2-tokens).
