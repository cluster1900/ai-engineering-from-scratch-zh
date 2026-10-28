# 混合模型与缓存

> Sliding-window 和 Mamba 层保存的状态，token 级的树无法在任意位置切开，所以在 v0.5.22，很多报告的缓存失败都落在混合模型上。

一个团队服务混合了 linear-attention 层与 full-attention 层的模型。他们打开 HiCache，跑二十条打中 host 层的请求。二十条答案都流畅、切题，却是针对另一个 prompt。Usage 块报告完整的缓存 token，日志里没有任何警告。

读完本节后，你能说出混合模型为什么打破 [radix tree](#s-radixcache) 的简单图景。你也能在用户替你测之前，先在自己的模型上测缓存。

## 三种层状态 {#s-hybrid-models-and-the-cache-three-kinds-of-layer-state}

[第 3.3 节](#s-radixcache) 的 radix tree 能工作，是因为 full attention 每个 token 存一个 key 和一个 value。任意长度的缓存前缀都有效，所以树可以在任意 token 处切开节点。另外两种层打破这条规则。

**Sliding-window attention (SWA)：** 只读最近几千个 token 的 attention。SWA 层只需要窗口，所以 SGLang 给 SWA 层留更小的 pool，并丢掉离开窗口的 KV。只有窗口的 KV 还在时，缓存前缀才有用。

**Mamba 层：** 状态空间或 linear-attention 层，每条序列保存一份固定大小的循环状态，按 token 更新。Token 2,000 处的状态总结了全部 2,000 个 token。它不能裁回 token 1,500。前缀只能在 SGLang 保存了状态快照的地方恢复。

我们的 capture 模型两种都没有。启动日志这么说。

```listing
title: a model with only full-attention layers
source: capture/out/server-default.log
lang: text
note: Two lines from the startup log of the default configuration.
---
[2026-10-16 13:58:06] Tree cache initialized: source=default impl=UnifiedRadixCache hybrid_swa=False hybrid_ssm=False hicache_attached=False
…
[2026-10-16 13:58:08] Attention KV pool initialized: pool_size=181574 (buffer size 181575 incl. padding slot 0), 28 full-attention layers (0 sliding-window layers stay per-request), 8 kv_heads, 128 head_dim
```

先在自己的模型上读这两行。`hybrid_swa=True` 或 `hybrid_ssm=True` 说明本节全部内容都适用于你。

## SGLang 如何处理每一种 {#s-hybrid-models-and-the-cache-how-sglang-handles-each-kind}

`UnifiedRadixCache` 保持一棵树，并为每种状态准备一个组件 {{code}}。每个节点持有 full-attention 组件的数据，需要时还有 SWA 和 Mamba 组件。匹配只有在每个组件都同意该位置状态有效时才前进。

对 SWA，树在窗口 KV 被丢掉的地方保留标记，匹配停在标记处。`--swa-full-tokens-ratio` 设定 SWA pool 相对 full pool 的大小。它默认是 `None`，由模型特定覆盖来设。DeepSeek-V4 的覆盖把它设成 0.1 {{code}}。

对 Mamba，树在某些节点上存状态快照，请求复用时复制一份。`--mamba-radix-cache-strategy` 选择 SGLang 如何保存快照：默认 `auto`，还有 `no_buffer`、`extra_buffer` 或 `extra_buffer_lazy` {{code}}。`--mamba-track-interval` 设定 decode 多久保存一次快照，默认每 256 个 token。

```figure
id: fig-3-6
kind: tree
title: a Mamba prefix resumes only at a snapshot
claim: A new request that matches 1,800 tokens of a Mamba model resumes from the last snapshot at 1,792 tokens, and prefills 8 tokens.
caption: Read from the root down. Snapshots every 256 decode tokens follow the --mamba-track-interval default. The token counts are an example, not a capture.
```

## 会出什么问题，在 issue 里 {#s-hybrid-models-and-the-cache-what-goes-wrong-in-the-issues}

v0.5.22 许多报告的缓存 bug 都涉及混合模型。我们自己没有跑混合模型。下面四个 issue 展示范围。

1. **Host 层命中给出错误答案。** Issue #39830 就是本节开头的故事 {{issue #39830}}。带 HiCache 的混合 linear-attention 模型，在 20 次 host 层命中里有 20 次给出针对另一个 prompt 的流畅答案。冷请求和 GPU 命中是对的。
2. **相同 prompt 零复用。** 在 issue #22935 里，重复 prompt 的匹配停在一条边内部，节点切开造出没有 Mamba 状态的节点 {{issue #22935}}。匹配停在最后一个有状态的节点，所以相同 prompt 什么都不复用。
3. **让首 token 慢 4.7 倍的策略。** 在 issue #37834 里，一个选项强制了 `no_buffer` 策略 {{issue #37834}}。快照落在后来请求够不到的深度。在检索工作负载上，命中率从 88.2% 降到 65.9%。平均首 token 时间从 226 ms 升到 1,063 ms。
4. **拖慢 decode 的默认。** Issue #36131 报告一个新默认会释放窗口外的 SWA 槽 {{issue #36131}}。它降低了 DGX Spark 和 Thor 上混合 SWA 模型的单流 decode 吞吐。

## 我们的立场：在混合模型上先测缓存，再信任它 {#s-hybrid-models-and-the-cache-our-position-test-the-cache-on-a-hybrid-model-before-you-trust-i}

在 full-attention 模型上，错误的缓存命中足够少见，我们保持缓存开着就继续。在混合模型上，投产前跑三项检查。每项只要几分钟。

1. **正确性。** 冷启动、GPU 命中，以及如果你用 HiCache 还有 host 层命中，发送同样的 prompt。在 temperature 0 下对比输出。测试期间跑 `--kv-canary log`，它检查 KV 槽是否损坏并让服务器继续跑 {{code}}。
2. **复用。** 重复一条 prompt，读 `#cached-token`。相同 prompt 显示很小的计数，就撞上了 issue #22935 的切开问题。
3. **延迟。** 用 `--mamba-radix-cache-strategy auto` 和你的部署指南推荐的策略测首 token 时间。只有命中率站得住时才保留更快的那个。

然后每次升级前读你模型家族的未关闭 issue。在 2026-09-01 到 v0.5.22 标签之间，大约 330 个提交动过 `python/sglang/srt/mem_cache` 里的缓存代码。在混合模型上，一次新发行可能修掉其中一个 bug，又加上另一个。

```takeaways
- 对每个新模型读启动日志里的 hybrid_swa 和 hybrid_ssm。
- 投产前在 temperature 0 下对比冷、GPU 命中和 host 命中的输出。
- 在混合模型的缓存测试期间跑 --kv-canary log。
- 检查相同 prompt 是否显示很高的 cached-token 计数。
- 每次升级前读你模型家族的未关闭缓存 issue。
```

Sources: python/sglang/srt/mem_cache/unified_radix_cache.py, python/sglang/srt/mem_cache/unified_cache/components/README.md, python/sglang/srt/arg_groups/fields/exec_.py (mamba_radix_cache_strategy, mamba_track_interval), python/sglang/srt/arg_groups/fields/schedule.py (swa_full_tokens_ratio), python/sglang/srt/arg_groups/model_overrides/deepseek_v4.py, python/sglang/srt/arg_groups/fields/observability.py (kv_canary) at v0.5.22, capture/out/server-default.log, issues #39830, #22935, #37834, and #36131; the GitHub commit list for path python/sglang/srt/mem_cache since 2026-09-01 at tag v0.5.22 (333 commits, counted 2026-10-22)
