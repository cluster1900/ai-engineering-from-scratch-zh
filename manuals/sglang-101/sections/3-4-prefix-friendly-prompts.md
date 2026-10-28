# 对前缀友好的 prompt

> 前缀缓存从第一个 token 起匹配，所以 prompt 开头附近一个会变的 token，代价可以大过服务器调优能挽回的。

一个团队在八块 GPU 上用 DeepSeek-V4 跑长智能体会话，并开了分层缓存。仪表盘显示那些重复 100,000 token 历史的请求 `#cached-token: 0`。他们调缓存层级和写入策略。命中率几乎不动。然后他们发现中继在每条请求的 system prompt 里塞了一个随机 hash。

读完本节后，你能在发出之前预测哪些 prompt 会打中前缀缓存。你也能用 `cached_tokens`、调度器日志和 `/metrics` 证明命中率。

## 实验：一个标识符，三个位置 {#s-prefix-friendly-prompts-the-experiment-one-identifier-three-places}

Capture kit 发送一段 2,999 token 的 system prompt 和一个短问题，三种形式各五次。服务器带着 `--enable-cache-report` 跑，所以每个响应向客户端报告缓存的 token。Kit 先发两条 warm-up 请求。

- **稳定：** 每次同样的 system prompt。
- **ID 在开头：** system prompt 以 `Request id <random hex>.` 开头，每条请求一个新值。
- **ID 在结尾：** 同一个随机 ID 放在 system prompt 末尾。

```listing
title: the summary of the cache experiment
source: capture/out/cache-experiment.txt
lang: json
note: The three summary lines. The fifteen per-request lines above them are cut. The stable case drops its first round, which filled the cache.
---
…
{"summary": "stable-system-prompt", "median_ttft_ms": 45.1, "min_ttft_ms": 34.0, "max_ttft_ms": 62.5, "median_cached_tokens": 2998.0, "prompt_tokens": 2999}
{"summary": "id-at-start", "median_ttft_ms": 1255.3, "min_ttft_ms": 1102.6, "max_ttft_ms": 2197.3, "median_cached_tokens": 5, "prompt_tokens": 3034}
{"summary": "id-at-end", "median_ttft_ms": 88.2, "min_ttft_ms": 83.7, "max_ttft_ms": 118.1, "median_cached_tokens": 2985, "prompt_tokens": 3028}
```

我们测到 ID 在开头时，等首 token 要长 28 倍：1,255 ms 对 45 ms。这次运行用的是我们的 Mac，Qwen3-0.6B 的 4-bit MLX。倍数取决于卡的 prefill 速度。未命中的 token 数不取决于它。

同一个 ID 在结尾只比稳定 prompt 多花 43 ms。三种情况下 token 几乎一样。只有顺序不同。

缓存 token 计数解释了时间。稳定 prompt 复用了 2,999 里的 2,998 个，是 [第 3.3 节](#s-radixcache) 的最大值。ID 在开头只匹配了前 5 个 token，也就是随机十六进制数字之前的那些。改动之后的每个 token 都是树的另一条分支，即便 prompt 其余部分完全一样。

```figure
id: fig-3-4
kind: comparison
title: the same tokens in three orders
claim: A random ID at the start of the prompt made about 3,027 tokens miss the cache, and the same ID at the end cost about 45 tokens.
caption: Read each ribbon left to right as the prompt's tokens. Green is reused from the cache, and plum is computed in prefill. From capture/out/cache-experiment.txt.
```

## 为什么顺序重要 {#s-prefix-friendly-prompts-why-the-order-matters}

Radix tree 从第一个 token 起比较，并在第一次差异处停下。差异之后的任何东西都匹配不上，因为后面每个 token 的 attention 值都依赖前面每一个 token。复用后面 token 的缓存会给出错误答案。所以前缀缓存按设计是精确的，也按同一设计是不留情的。

同样的规则适用于聊天请求的每一部分。Chat template 按固定顺序把消息变成一条 token 序列：system prompt、工具列表、更早的轮次、新消息。System prompt 一变，后面全失效。最新消息一变，只失效那条消息。

## 事故 {#s-prefix-friendly-prompts-the-incident}

Issue #35129 就是本节开头的故事 {{issue #35129}}。报告者发现三个原因叠在一起。

1. 中继在每条请求里塞了按会话随机的 `cch=` hash，以及一条轮换的系统消息。去掉它们之后，引擎命中率从 66.8% 升到 94.4%。
2. 客户端把任务列表快照写在 system prompt 末尾。每次任务更新都改了 system prompt，于是它后面超过 100,000 token 的历史全部失效。
3. 分层缓存回载找不到空间时，会逐出其他会话的前缀。报告者数到 250,000 次 evict 调用，对上 376 次完成的回载。

第一个修法是改 prompt。[第 3.5 节](#s-eviction-policies-and-hicache) 里没有任何服务器旗标能挽回那个 hash 花掉的 27.6 个百分点。

## 我们的立场：先修 prompt，再调服务器 {#s-prefix-friendly-prompts-our-position-fix-prompts-before-you-tune-the-server}

把 prompt 布局当成服务系统的一部分。改任何缓存旗标之前，先用这些规则对照你的真实请求。

- 永不变化的内容放最前：system prompt，然后是固定顺序的工具列表。
- 按会话变化的内容放在后面，按请求变化的内容放最后。
- 永远不要把时间戳、请求 ID、会话 hash 或随机采样种子放进 system prompt。把它们当请求元数据发送，或放在末尾。
- 保持工具和函数定义顺序稳定。键顺序会变的 JSON 对象是另一条 token 序列。
- 追加对话。不要改写更早的轮次，例如为了摘要，除非你接受整段 prefill。

有两个服务器侧设置会以看起来像 prompt 问题的方式打断复用。从位置 `k` 要 prompt log probability 的请求只能复用前 `k` 个 token {{code}}。不同的 LoRA adapter 永远不共享树节点，即便 token 相同，因为 adapter 是树键的一部分 {{code}}。

路由也会打断复用。有好几台服务器时，请求去到没有它前缀的那台就会未命中，无论 prompt 长什么样。Jarvislabs 报告说，把每段对话路由到同一台服务器后，命中率从 64.7% 升到 92.1% {{field Jarvislabs 2026-08}}。[第 6.4 节](#s-sgl-model-gateway) 展示网关如何按前缀路由。

## 如何证明命中 {#s-prefix-friendly-prompts-how-to-prove-a-hit}

用三种测量，从最贴近请求的到最概括的。

1. **在响应里。** 用 `--enable-cache-report` 启动服务器，它默认关着 {{code}}。然后 usage 块会报告 `cached_tokens`。原生 `/generate` API 不需要旗标就在 `meta_info` 里返回 `cached_tokens`。
2. **在调度器日志里。** 每一行 `Prefill batch` 都报告 `#new-token` 和 `#cached-token`。
3. **在指标里。** `/metrics` 导出 `sglang:cache_hit_rate`，一个近期 prefill batch 的 gauge。[第 3.3 节](#s-radixcache) 的共享前缀基准之后，我们的服务器报告 0.94。带着 `--disable-radix-cache` 的服务器报告 0.0。

```listing
title: the scheduler's view of the three prompt forms
source: capture/out/server-default.log
lang: text
note: One line for each form, in the order the kit sent them. The other twelve lines are cut.
---
[2026-10-16 13:58:12] Prefill batch, #new-seq: 1, #new-token: 1, #cached-token: 2998, token usage: 0.02, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 7.09
…
[2026-10-16 13:58:14] Prefill batch, #new-seq: 1, #new-token: 3031, #cached-token: 3, token usage: 0.02, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 1937.91
…
[2026-10-16 13:58:20] Prefill batch, #new-seq: 1, #new-token: 45, #cached-token: 2983, token usage: 0.02, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 225.19
```

[prompt caching](phases/11-llm-engineering/15-prompt-caching) 和 [缓存与成本](phases/11-llm-engineering/11-caching-cost) 那两课对托管模型 API 展示了同一条规则。那些 API 对缓存的输入 token 按更低价格计费。

```takeaways
- 在每条 prompt 里把固定内容放最前，按请求变化的内容放最后。
- 把 ID、时间戳和 hash 留在 system prompt 外面。
- 保持工具定义和 JSON 键的固定顺序。
- 打开 --enable-cache-report，并读响应里的 cached_tokens。
- 当 prompt 稳定但命中率仍低时，检查路由。
```

Sources: python/sglang/srt/mem_cache/radix_cache.py (RadixKey, match_prefix), python/sglang/srt/managers/schedule_batch.py (_compute_max_prefix_len), python/sglang/srt/arg_groups/fields/serving.py (enable_cache_report), python/sglang/srt/entrypoints/openai/serving_chat.py at v0.5.22, capture/out/cache-experiment.txt, capture/out/server-default.log, capture/out/generate.txt, capture/out/metrics.txt, capture/out/no-radix-cache-metrics.txt, issue #35129, the Jarvislabs report of 2026-08-26.
