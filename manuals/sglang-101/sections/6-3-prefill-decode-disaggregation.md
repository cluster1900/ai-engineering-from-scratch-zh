# Prefill-decode disaggregation：--disaggregation-mode

> Disaggregation 把 prefill 挪到自己的服务器上，好让长提示不再拖延其他用户的 token，且只有当那种拖延是你测到的问题时才划算。

你的聊天用户看到流畅的流式输出，直到有人粘贴一份长文档。然后每一条流都暂停，等服务器对该文档做 prefill。Prefill 是对许多 token 一次做的计算工作，decode 是每个请求每步一个 token。在一台服务器上，它们共享同样的 GPU 步，长 prefill 占住那一步。分块 prefill 让暂停更短，但不能去掉它。

读完本节后，你能解释 SGLang 如何把一个请求的 KV 缓存从 prefill 服务器移到 decode 服务器。你也能启动最小的 disaggregated 配置，并从测量决定你是否需要它。

## 两台服务器，一个请求 {#s-prefill-decode-disaggregation-two-servers-one-request}

**Prefill-decode disaggregation (PD)：** 两种 SGLang 服务器，分别以 `--disaggregation-mode prefill` 与 `--disaggregation-mode decode` 启动。默认是 `null`，表示一台服务器两者都做 {{code}}。Prefill 服务器计算提示的 KV 缓存与第一个 token。Decode 服务器接收那份 KV 缓存并生成其余部分。

SGLang 文档给出拆分的两个理由 {{docs}}。Prefill batch 会打断 decode batch。有注意力数据并行时，一组可以做 prefill 而另一组 decode，所以 decode 组在每一步都等最慢的那一组。分开的服务器去掉这两种等待。每个池也可以用自己的并行布局，例如 prefill 用宽 TP，decode 用注意力数据并行。

## KV 缓存如何移动 {#s-prefill-decode-disaggregation-how-the-kv-cache-moves}

[第 6.4 节](#s-sgl-model-gateway) 的网关启动每一次交换。它挑一台 prefill 服务器与一台 decode 服务器。它给请求加上三个字段：prefill 服务器的 bootstrap 主机、其 bootstrap 端口，以及一个叫 bootstrap room 的随机 63 位数字。然后它同时把同一请求发给两台服务器 {{code}}。

**Bootstrap room：** 两台服务器用来找到彼此对同一请求那一半的数字。把它想成预约号：decode 服务器预订 KV 槽，prefill 服务器写入它们。

```figure
id: fig-6-3
kind: sequence
title: one disaggregated request
claim: The decode server reserves KV slots and publishes their addresses, then the prefill server writes the KV pages straight into decode memory.
caption: Read top to bottom. Solid arrows are requests, teal arrows are memory writes, and the dotted arrow is the token stream to the client. From the gateway PD router, the prefill and decode schedulers, and the Mooncake connection code at v0.5.22.
```

1. Decode 服务器创建一个接收端，经 bootstrap 服务器找到 prefill rank，并为提示预订 KV 槽。
2. 它把那些槽的地址发给 prefill 侧。
3. Prefill 服务器对提示跑一次正常的 prefill 前向。
4. 它把 KV 页写入 decode 服务器已预订的槽。用默认 Mooncake 后端时，这是一次单边 RDMA 写。Mooncake 把两侧连续的页打成一次批量传输 {{code}}。
5. Decode 服务器看到传输完成，并把该请求加进其运行中 batch，不再做另一次 prefill。
6. 客户端流来自 decode 服务器。

Bootstrap 服务器跑在 prefill 主机上。其默认端口是 8998 {{code}}。每一侧用五个状态跟踪一次传输：Failed、Bootstrapping、WaitingForInput、Transferring 与 Success {{code}}。

```figure
id: fig-6-3b
kind: state
title: the KVPoll states of one transfer
claim: Every transfer moves forward through bootstrapping, waiting, and transferring to success, and any stage can end in failure.
caption: Read left to right. The numbers are the values of the KVPoll class. Amber arrows are state changes, and rose arrows are failures. From the base connection code at v0.5.22.
```

## 要紧的设置 {#s-prefill-decode-disaggregation-settings-that-matter}

| Setting | Default | Meaning |
|---|---|---|
| `--disaggregation-mode` | `null` | 两种角色用 `prefill` 或 `decode` |
| `--disaggregation-transfer-backend` | `mooncake` | 还有 `mooncake_tcp`、`nixl`、`mori`、`ascend`、`fake` |
| `--disaggregation-bootstrap-port` | 8998 | prefill 主机上的 bootstrap 服务器端口 |
| `--num-reserved-decode-tokens` | 512 | 请求加入运行中 batch 时在内存里预订的 decode token |
| `SGLANG_DISAGGREGATION_BOOTSTRAP_TIMEOUT` | 300 | prefill 等待 decode 侧槽地址的秒数 |
| `SGLANG_DISAGGREGATION_WAITING_TIMEOUT` | 300 | decode 等待 KV 页的秒数 |
| `SGLANG_DISAGGREGATION_QUEUE_SIZE` | 4 | 并行传输队列 |

所有默认都来自 v0.5.22 代码 {{code}}。`mooncake_tcp` 为没有 RDMA 网卡的集群存在。我们没有测它的速度。

不要把请求直接发给 prefill 或 decode 服务器。调度器断言存在 bootstrap room，其错误消息告诉你改把请求发给路由器 {{code}}。

## 我们的立场 {#s-prefill-decode-disaggregation-our-position}

不要从 disaggregation 开始。从一台服务器开始，然后在网关后面加数据并行副本。只有在你测到 prefill 干扰在你服务的并发上伤害了 token 间延迟之后，才把 prefill 与 decode 拆开。Disaggregation 加上第二套失败：bootstrap 步、RDMA 传输、两个超时，以及必须正确配对服务器的路由器。

即便为了尾部，增益也是条件，不是默认。一项 2025 研究比较了拆分服务器与两阶段都跑的服务器。它发现增益不是保证的，且取决于请求负载以及移动 KV 缓存的路径。我们自己没有测这一点。在保留拆分之前，用同样的 GPU 作为普通服务器、在你真实负载下比较。

一次真实事故展示了跳过那次测量的代价。一个用户跑一台 prefill 与一台 decode 服务器，各自带 TP4（[issue #12591](https://github.com/sgl-project/sglang/issues/12591)）。到第一个 token 的时间高于没有 disaggregation 的一台 TP4 服务器。原因是旧的 Mooncake 传输引擎。升级它修好了问题，维护者还建议在没有注意力数据并行时用 `SGLANG_DISAGGREGATION_QUEUE_SIZE=1`。没有单机基线，没人会知道 disaggregation 把事情弄得更糟。

## 另外两起事故，都来自路由器 {#s-prefill-decode-disaggregation-two-more-incidents-both-from-the-router}

在 64 个并发请求时，一套 GLM-4.5 配置在 prefill 侧记下许多 "Prefill bootstrap failed" 与 "Aborted by AbortReq" 错误（[issue #9266](https://github.com/sgl-project/sglang/issues/9266)）。四到七个并发请求能工作。路由器给 prefill 客户端的超时太短，所以路由器中止了仍在跑的请求。Pull request [#9803](https://github.com/sgl-project/sglang/pull/9803) 修了超时。

维护者在相关线程里给出了一般规则（[issue #9926](https://github.com/sgl-project/sglang/issues/9926)）。"Aborted by AbortReq" 表示客户端或路由器中止了。在怀疑传输之前先检查超时。

Novita AI 在 H200 上的 GLM-4.7 发现了另一种延迟 {{field Novita 2026-01}}。带 disaggregation 与 overlap 调度器时，吞吐大约升 10%，但到第一个 token 的时间差很多。在 prefill 上，KV 传输等到下一批的内核启动。没有 CUDA graph 时，对他们的 92 层模型那次启动要几百毫秒。他们的修复加了一个标志 `--disaggregation-async-transfer`。我们在 v0.5.22 代码里找不到那个标志，所以在复制他们的命令之前先检查你的版本。

## 每台 decode 服务器配多少台 prefill 服务器 {#s-prefill-decode-disaggregation-how-many-prefill-servers-for-each-decode-server}

比例取决于你的流量。dstack 在八块 H200 上用 SGLang disaggregation 与仅张量并行测了 gpt-oss-120b {{field dstack 2025-09}}。在高并发时，一台 prefill 对三台 decode 在每个度量上都赢，对偏 prefill、偏 decode 与均衡负载都如此。在低并发时，三对一与二对二给出更好的到第一个 token 的时间。他们的[帖子](https://dstack.ai/blog/benchmarking-pd-ratios/)展示没有绝对数字的图表，所以只用它看方向。

在最大规模上，SGLang 团队在 12 个八块 H100 的节点上跑 DeepSeek {{team 2025-05}}。他们对 2000-token 输入报告每个节点每秒 52.3k 输入与 22.3k 输出 token。他们在分开的运行里在 4 个节点上测 prefill、在 9 个节点上测 decode。Mooncake 团队报告在 128 块 H200 上跑 Kimi K2，带 4 个 prefill 与 12 个 decode 节点 {{team 2025-07}}。他们给 decode 更多节点，好让 KV 池能持有 480 的 batch。两者都是构建该系统的团队的报告。

## 两块 L4 上发生了什么 {#s-prefill-decode-disaggregation-what-happened-on-two-l4s}

我们把 Qwen3-8B 拆成第一块 L4 上的一台 prefill 服务器与第二块上的一台 decode 服务器。我们的两块卡没有 RDMA，所以用了 `--disaggregation-transfer-backend mooncake_tcp`。第二块卡还跑着另一团队的 pod，所以 decode 池持有 2,925 个 token，对上 prefill 上的 24,094。然后我们经路由器跑了[第 5.1 节](#s-sglang-benchmark-serving) 的开环 sweep。

```listing
title: the KV transfer queue fills and the session dies
source: capture/gpu/incidents/l4-pd-mooncake-tcp-queue.txt
lang: text
note: Lines from the prefill and decode logs and from the benchmark result at 8 requests per second. Timestamps are cut.
---
… Decode batch, #running-req: 2, #token: 1206, token usage: 0.41, pre-allocated usage: 0.00, #prealloc-req: 19, #transfer-req: 0, #retracted-req: 0
… TCP lane queue-full rejection count: 4096
… Session 151.242.195.41:15367 failed.
Prefill transfer failed lines: 2902
Successful requests:                     240
Total generated tokens (retokenized):    0
Mean TTFT (ms):                          0.00
```

Decode 一次只能跑两个请求，另外 19 个在等 decode 内存。Prefill 继续为它们产出 KV 缓存，通向 decode 的 TCP 传输队列填满。Sweep 进行三分钟时，传输会话失败，且没有回来。之后每一个请求的传输都失败。

危险的部分接着来了。每个失败的请求经路由器仍计为成功，没有文本。基准在每秒 8 个请求时把 240 个里的 240 计为成功。它打印每秒 751.85 个输出 token，高于同速率下 FP8 服务器的 728.61。只有两个数字露馅：重新分词的输出 token 为零，以及平均 TTFT 为 0.00 ms。

我们没有发布那些吞吐数字。我们的套件现在拒绝每一次请求 TTFT 都为 0 的运行。

然后我们反过来跑拆分。Decode 有完整的 24,094 token 池，prefill 有带 2,925 的共享卡。从 1 到 8 个用户，每个请求都带回文本。在 16 个用户时，8,192 个生成 token 里只有 2,048 个作为文本回来。在 32 个用户时，每个请求都空着回来，套件停下了 sweep。

```listing
title: the swapped split as it failed
source: capture/gpu/out-l4/bench-pd-swap.txt
lang: text
note: Benchmark summary lines at 8, 16, and 32 users. Compare the generated tokens with the retokenized ones.
---
c8: Successful requests: 32 
c8: Total generated tokens: 4096 
c8: Total generated tokens (retokenized): 4096 
c16: Successful requests: 64 
c16: Total generated tokens: 8192 
c16: Total generated tokens (retokenized): 2048 
c32: Successful requests: 128 
c32: Total generated tokens: 16384 
c32: Total generated tokens (retokenized): 0 
```

原来的方向在两次 sweep 里都很早失败。在 2 个用户时 2,048 个生成 token 里只有 512 个作为文本回来，在 4 个用户时一个都没有。固定速率 sweep 从每秒 0.5 个请求起就丢掉了大部分文本。我们没有这对卡在负载下拆分的测得结果，也不声称有。在读吞吐之前，先在每一次 disaggregated 基准里检查 `Total generated tokens (retokenized)`。

## 测什么 {#s-prefill-decode-disaggregation-what-to-measure}

先在一台服务器上用[第 5.1 节](#s-sglang-benchmark-serving) 的基准测 TTFT 与 token 间延迟。如果长提示到达时 token 间延迟上升，disaggregation 可能有帮助。拆分之后，看这些度量 {{code}}：

- `sglang:num_bootstrap_failed_reqs_total` 与 `sglang:num_transfer_failed_reqs_total`，必须保持平坦
- `sglang:kv_transfer_latency_ms` 与 `sglang:kv_transfer_speed_gb_s`，展示每次移动的代价
- `sglang:num_decode_prealloc_queue_reqs` 与 `sglang:num_decode_transfer_queue_reqs`，展示等待内存或传输的请求。

```takeaways
- 在拆分之前，先在一台服务器上测 TTFT 与 token 间延迟。
- 从一台 prefill 与一台 decode 服务器开始，并与一台服务器比较。
- 每个请求都经网关发送，从不直接发到角色服务器。
- Prefill 日志出现 Aborted by AbortReq 时，先检查路由器与客户端超时。
- 在调队列大小之前先升级传输库。
- 在信任一次 disaggregated 基准之前，先检查重新分词的输出 token。
- 从你自己的并发选择 prefill 对 decode 的比例，然后看传输失败。
```

Sources: python/sglang/srt/arg_groups/fields/disagg.py, python/sglang/srt/arg_groups/choices.py, python/sglang/srt/environ.py, python/sglang/srt/disaggregation/prefill.py, python/sglang/srt/disaggregation/decode.py, python/sglang/srt/disaggregation/base/conn.py (KVPoll), python/sglang/srt/disaggregation/common/conn.py, python/sglang/srt/disaggregation/mooncake/conn.py, python/sglang/srt/managers/data_parallel_controller.py, python/sglang/srt/observability/metrics_collector.py, sgl-model-gateway/src/routers/http/pd_router.rs and pd_types.rs, and docs/docs/advanced_features/pd_disaggregation.mdx, all at v0.5.22. capture/gpu/incidents/l4-pd-mooncake-tcp-queue.txt, capture/gpu/out-l4/bench-pd-swap.txt. Issues #12591, #9266, #9926, pull request #9803. Novita AI on Hugging Face, 2026-01-22. dstack, "Benchmarking Prefill-Decode ratios", 2025-09-25. LMSYS, 96 H100 deployment, 2025-05-05. The Mooncake team on the LMSYS blog, 2025-07-20, capture/gpu/incidents/l4-pd-summary-lines.txt, Li and others, Revisiting Disaggregated Large Language Model Serving for Performance and Energy Implications, arXiv 2601.08833 (2025-11).
