# 别让长 prompt 拖住短请求

> batch token 预算在第一个 token 的时间和 token 之间的间隔之间做取舍，所以要按你承诺的延迟来设置它。

长 prompt 到达后，短请求被卡在它们后面。读完本节后，你能为自己的延迟目标选择一个 batch token 预算。

**我们的结果：** 在我们的 DGX Spark 上，低负载时 16,384 token 的预算把 P99 ITL 从 574 ms 提高到了 798 ms。

## 了解这个预算 {#s-keep-long-prompts-from-stalling-short-ones-know-the-budget}

vLLM 总是把长 prompt 切成 chunk。在每一步中，正在运行的流先拿到它们的下一个 token，等待中的 prompt 再填满剩余的预算。`--max-num-batched-tokens` 设置这个预算。[token 预算页](#s-why-one-token-budget-replaces-a-prefill-phase)解释了其中的顺序。

更大的预算让长 prompt 用更少的步完成 prefill，所以它的第一个 token 来得更早。但这些步中的每一步都更长，每个正在运行的流都要等它。所以在低负载时，更大的预算可能带来更快的第一个 token，以及更长的 token 间隔。

## 了解你的默认值 {#s-keep-long-prompts-from-stalling-short-ones-know-your-default}

vLLM 根据它读到的 GPU 显存来设置预算和运行请求的上限。`vllm serve` 和离线的 `LLM` 类的默认值也不同。手册的其他页面会链接到这张表。

| vLLM 读到的 GPU 显存 | 预算，`vllm serve` | 预算，`LLM` 类 | `--max-num-seqs`，两者 |
|---|---|---|---|
| 160 GiB 或以上 | 16,384 | 16,384 | 1,024 |
| 70 GiB 或以上，但不是 A100 | 8,192 | 16,384 | 1,024 |
| 更少，或未知 | 2,048 | 8,192 | 256 |

我们的 DGX Spark 有 121.69 GiB 由 CPU 和 GPU 共享的内存。它的启动日志仍然显示预算为 2,048，也就是小型或未知 GPU 的值。在修改之前，先读出你的服务器正在使用的值。0.31.0 的日志不会以预算自己的名字打印它。在 engine config 那一行里找到 `compile_ranges_endpoints`。那个列表中最大的数就是预算。

## 看看我们的运行结果 {#s-keep-long-prompts-from-stalling-short-ones-see-what-our-runs-show}

**我们测量了** 2026-10-21 在我们的 DGX Spark 上用 `Qwen3-30B-A3B` 时 2,048 和 16,384 token 两种预算。prompt 有 1,024 到 4,096 个 token，每个请求要求生成 64 到 256 个 token。我们以固定速率发送请求，每个点跑三个 seed。

```figure
id: fig-3-3
kind: chart
title: a larger token budget at low load
claim: At 0.5 requests per second, a budget of 16,384 tokens raised the P99 ITL from 574 to 798 ms.
caption: Each bar is the median of three seeds. The first-token times of the two budgets overlapped across seeds. From capture/gpu/summary/gb10.json.
```

| 每秒请求数 | 预算 | TTFT 中位数 | TPOT 中位数 | P99 ITL |
|---|---|---|---|---|
| 0.5 | 2,048 | 1,145 ms | 149.3 ms | 574 ms |
| 0.5 | 16,384 | 906 ms | 139.4 ms | 798 ms |
| 1 | 2,048 | 454 ms | 156.5 ms | 405 ms |
| 1 | 16,384 | 477 ms | 156.9 ms | 395 ms |
| 2 | 2,048 | 560 ms | 205.5 ms | 587 ms |
| 2 | 16,384 | 595 ms | 205.1 ms | 586 ms |

在每秒 0.5 个请求时，更大的预算把 P99 ITL 提高了 39%，且各 seed 的范围没有重叠。第一个 token 来得更早，但第一个 token 在各 seed 间的范围有重叠。所以代价是明确的，收益则未得到确认。

对两种预算来说，每秒 0.5 个请求时第一个 token 的中位数都比每秒 1 个请求时更慢。使用 2,048 预算时，0.5 下的三个 seed 都高于 900 ms，而 1 下的三个都低于 600 ms。所以这不是某一个慢 seed 造成的。我们没有找到原因。

在每秒 1 和 2 个请求时，两种预算在 seed 范围内给出相同的数字。在这些速率下，更多请求共享每一步，所以单个长 prompt 占用的预算更少。

请把我们的结果理解得窄一些：两种预算、三个低速率、一个模型、一台机器。2026 年的论文 "P-PAS: Prefill-Pressure Adaptive Scheduling for Long-Context LLM Serving" 发现，在 vLLM 中没有哪一个固定预算在所有负载下都是最好的。压力低时，大预算延迟更低。当多个 prefill 与正在运行的流竞争时，小预算胜出。我们自己没有测量这个交叉点。

不带预算参数的运行在每个速率下都与 2,048 的运行一致。这与启动日志中的 2,048 相符。所有运行的时钟中位数都保持在 2,398 到 2,411 MHz。

## 调优 {#s-keep-long-prompts-from-stalling-short-ones-tune-it}

1. 读出你的服务器正在使用的预算。
2. 如果 P99 ITL 太高且有长 prompt 到达，就降低预算。如果你的默认值更大，试试 2,048。
3. 如果长 prompt 的第一个 token 太慢而 P99 ITL 还有余量，就提高预算。
4. 在你真实的请求速率下测量，因为在我们的运行中效果随速率而变。
5. 负载变化时重新测量，因为最佳预算会随负载移动。

vLLM 还有 `--long-prefill-token-threshold`。当有其他请求在等待时，它限制一个长 prompt 在一步中能拿到的 token 数。它默认关闭，我们没有测试它。

```takeaways
- 低负载时，更大的预算可能带来更快的第一个 token 和更长的 token 间隔。
- 在我们的 DGX Spark 上，低负载时 16,384 让 P99 ITL 提高了 39%。
- 读出你的服务器使用的预算，因为默认值取决于 vLLM 读到的显存。
- 在真实的请求速率下测量，负载变化时再测一次。
```

Sources: capture/gpu/summary/gb10.json (mixed.vllm, mixed.vllm-mnbt-2048, mixed.vllm-mnbt-16384), capture/gpu/out-gb10/server-load-vllm.log, the vLLM source at v0.31.0 (vllm/engine/arg_utils.py, vllm/config/vllm.py, vllm/config/scheduler.py, vllm/platforms/cuda.py), the paper P-PAS: Prefill-Pressure Adaptive Scheduling for Long-Context LLM Serving (arXiv 2608.15171, 2026).
