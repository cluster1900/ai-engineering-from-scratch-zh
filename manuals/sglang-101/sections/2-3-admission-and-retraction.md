# 准入与收回

> SGLang 只在对未来 token 的预估塞得进 KV pool 时才准入一条请求，因此满载的服务器会让新用户排队，而不是弄坏正在跑的那些。

仪表盘说 GPU 还有空闲内存，新请求却要等 28 秒才出首 token。什么都没崩，什么都没丢，每 token 速度也正常。用户仍然觉得服务挂了。这就是准入控制在干活时的样子，你需要知道它为什么选择让他们等。

读完本节后，你能解释决定准入的 token 预算，并算出一个 pool 能装多少请求。你也能在日志里分清健康的队列和收回问题。

## 代价：你以后会需要的内存 {#s-admission-and-retraction-the-cost-memory-you-will-need-later}

一条请求现在需要 prompt 的 KV cache，以后生成的每个 token 也需要。调度器不知道一条请求会生成多少 token。它只知道上限 `max_new_tokens`。

有两种显而易见的修法，都会失败。为每个人预留满额的 `max_new_tokens`，pool 的大部分会空着，因为大多数请求在 end-of-sequence token 处早停。什么都不预留，pool 会在 decode 期间填满，服务器就得丢掉已经做的活。

## 预估 {#s-admission-and-retraction-the-forecast}

SGLang 用带校正的预估。两条规则决定准入 {{code}}：

- **新请求** 必须装下它未缓存的 prompt token，外加剩余的 `max_new_tokens`，并由 `SGLANG_CLIP_MAX_NEW_TOKENS_ESTIMATION` 裁到 4,096。
- **每条正在跑的请求** 扣住剩余 `max_new_tokens` 乘以 **new token ratio**。

**New token ratio：** 调度器预期一条正在跑的请求还会用掉的剩余输出占比。它从 0.7 乘以 `--schedule-conservativeness`（默认 1.0）开始。在 600 步 decode 里线性降到起始值的 0.14，默认下就是 0.098 {{code}}。

比率下降，是因为大多数请求早停。事情顺利得越久，调度器就越大胆。设了 `ignore_eos` 的请求不能早停，所以它的比率永远是 1.0。

```figure
id: fig-2-3
kind: comparison
title: why five requests fit in 4,096 tokens and six do not
claim: With ignore_eos, each request reserves its 256 prompt tokens and all 512 output tokens, so five requests use 3,840 tokens and a sixth would need 4,608.
caption: Each bar is the KV pool of --max-total-tokens 4096. Green is reserved prompt KV, amber is reserved future output, grey is free. From capture/out/server-small-pool.log and small-pool-bench-long-output-c16.txt.
```

## 我们用小 pool 测到了什么 {#s-admission-and-retraction-what-we-measured-with-a-small-pool}

我们用 `--max-total-tokens 4096` 启动了一台服务器，pool 远小于我们的 Mac 允许的大小。然后在并发 16 下跑基准，prompt 256 token，输出 512 token。

基准客户端默认把 `ignore_eos` 设为 true，所以每条请求正好生成 512 个 token {{code}}。因此每条请求预留 256 加 512，也就是 768 个 token。五条请求预留 3,840 个 token，第六条会需要 4,608。调度器正好准入了五条。

```listing
title: five running, eleven waiting
source: capture/out/server-small-pool.log
lang: text
note: Lines cut from the first minute of the run. The first line is the cached warm-up prompt.
---
[2026-10-16 14:08:02] Prefill batch, #new-seq: 1, #new-token: 1, #cached-token: 255, token usage: 0.06, #running-req: 0, #queue-req: 15, #pending-token: 0, cuda graph: False, input throughput (token/s): 0.80
[2026-10-16 14:08:02] Prefill batch, #new-seq: 4, #new-token: 896, #cached-token: 0, token usage: 0.28, #running-req: 1, #queue-req: 11, #pending-token: 2808, cuda graph: False, input throughput (token/s): 3889.60
…
[2026-10-16 14:08:14] Decode batch, #running-req: 5, #token: 1517, token usage: 0.37, cuda graph: False, gen throughput (token/s): 170.33, #queue-req: 11
[2026-10-16 14:08:17] Decode batch, #running-req: 5, #token: 2117, token usage: 0.52, cuda graph: False, gen throughput (token/s): 205.04, #queue-req: 11
…
[2026-10-16 14:08:26] Decode batch, #running-req: 5, #token: 3717, token usage: 0.91, cuda graph: False, gen throughput (token/s): 139.02, #queue-req: 11
```

盯着 `token usage`。它从 0.28 爬到 0.91，因为五条请求生成进了预估为它们预留的空间。十一条请求全程在等。五条跑完后，下一批五条开始，日志按波浪重复。

客户端看到了这种顺序的代价：

```listing
title: what the users felt
source: capture/out/small-pool-bench-long-output-c16.txt
lang: text
note: Lines cut from the summary block.
---
Successful requests:                     32        
…
Concurrency:                             13.06     
…
Median TTFT (ms):                        27943.11  
…
Mean TPOT (ms):                          24.26     
```

每条请求都成功了。一旦请求开始，每个 token 要 24 ms。中位用户仍然为了首 token 等了 27.9 秒。`Concurrency` 值 13.06 是客户端平均打开的请求数。任何时刻 GPU 上只有五条。

## 收回：预估错了的时候 {#s-admission-and-retraction-retraction-when-the-forecast-is-wrong}

预估可能过于大胆，因为比率会衰减到 0.098。跑得久的请求随后需要的槽位会超过 pool 所有。每一步 decode 之前，调度器检查每条正在跑的请求能否再拿到一个槽 {{code}}。

**收回：** 把正在跑的请求从 decode batch 里拿掉以释放它们的 KV 槽，并把它们放回等待队列。它们稍后会再次 prefill。

检查失败时，SGLang 记下 `KV cache pool is full. Retract requests.`。它先收回输出 token 最少的请求，在那些里再先收回 prompt 最长的，因为它们丢掉的活最少 {{code}}。它把比率重置为新的估计：到目前为止 decode 的 token 数加上每请求 20，再除以总的 `max_new_tokens`。在 v0.5.22，如果连最后一条请求都装不下，它会用 "Out of memory even after retracting all other requests" 中止那条请求，而不是死循环。

我们的小 pool 运行完全没有收回。它的服务器日志没有 `Retract requests` 行。Metrics 端点也同意，但有一个限制。`num_retracted_reqs` 是一个 gauge，调度器在每个日志间隔后重置。所以读到 0 只覆盖最后一个间隔。计数器 `num_retracted_requests_total` 覆盖整次运行。

```listing
title: zero retractions in the small-pool run
source: capture/out/small-pool-metrics.txt
lang: text
---
sglang:num_retracted_reqs{engine_type="unified",model_name="mlx-community/Qwen3-0.6B-4bit",moe_ep_rank="0",pid="38678",pp_rank="0",tp_rank="0"} 0.0
```

预估没什么要校正的。有了 `ignore_eos`，预留是精确的。真实流量会早停，所以比率会衰减，准入会更大胆，收回也会变得可能。

```figure
id: fig-2-3b
kind: timeline
title: the new token ratio over 600 decode steps
claim: The ratio starts at 0.7, falls to 0.098 after 600 decode steps, and jumps back up after a retraction, so admission grows bolder until it fails.
caption: Read left to right over decode steps. The amber line is the default ratio for requests without ignore_eos. The rose mark is a retraction. Constants from new_token_ratio_tracker.py at v0.5.22.
```

## 事故：收回本身就是问题 {#s-admission-and-retraction-incidents-when-retraction-is-the-problem}

一台在八块 H20 上跑 DeepSeek-R1 的服务器，每个 rank 都反复记下 `KV cache pool is full. Retract requests.`，然后不再回答健康检查 {{issue #8463}}。一位评论者把它追到无法释放足够内存、又永远重复的收回。Issue 在没有修复的情况下关闭了。在 v0.5.22，调度器在收回其他所有请求后仍内存不足时，会中止最后一条请求。这次中止意在结束那个循环。我们没有复现该 issue。

另一位用户在一次收回之后看到 decode 吞吐从大约 429 降到每秒 20 到 38 个 token，并停在那里 {{issue #26248}}。那个 issue 因不活跃关闭，没有记下原因。教训成立：日志里的一次收回就是性能警报。

## 我们的立场 {#s-admission-and-retraction-our-position}

排队是诚实的失败。队列让每条正在跑的请求保持快速，并让过载在 `#queue-req` 和首 token 时间里可见。收回把过载藏成浪费掉的 prefill。

SGLang 调优文档说偶尔一次收回，大约每分钟一次，没问题。把超过那个频率当成配置错误。提高 `--schedule-conservativeness`，例如到 1.3，好让预估起点更高。或者降低 `--max-running-requests`。不要单靠更大的 `--mem-fraction-static` 来修，因为 [第 3.2 节](#s-mem-fraction-static-and-startup-sizing) 展示了那要付的代价。

在客户端设现实的 `max_new_tokens`。一个要 4,096 个 token、却只用 200 的客户端，会让每条新请求的输出预留大约大二十倍。

```takeaways
- 按未缓存 prompt 加 max_new_tokens，对照空闲 pool 计算准入。
- 把「长队列、token 很快」读成准入控制，而不是故障。
- 当 num_retracted_requests_total 的速率高于大约每分钟一次时告警。
- 为了停住收回，先提高 schedule-conservativeness，再加内存。
- 让客户端发送现实的 max_new_tokens，好让准入正确度量请求。
```

Sources: python/sglang/srt/managers/schedule_policy.py (PrefillAdder.add_one_req, _get_running_request_total_token_offset, CLIP_MAX_NEW_TOKENS), python/sglang/srt/managers/scheduler_components/new_token_ratio_tracker.py, python/sglang/srt/managers/schedule_batch.py (check_decode_mem, retract_decode, _get_decode_retraction_order), python/sglang/srt/managers/scheduler.py (update_running_batch), python/sglang/srt/environ.py, python/sglang/benchmark/serving.py (ignore_eos default) at v0.5.22, docs/docs/advanced_features/hyperparameter_tuning.mdx at v0.5.22, capture/out/server-small-pool.command.txt, server-small-pool.log, small-pool-bench-long-output-c16.txt, small-pool-metrics.txt, issues https://github.com/sgl-project/sglang/issues/8463 and https://github.com/sgl-project/sglang/issues/26248.
