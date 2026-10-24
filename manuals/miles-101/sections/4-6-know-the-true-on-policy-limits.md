# 检查你的 GPU 能否运行 true on-policy 模式

> true on-policy 模式让训练器和引擎逐位一致，但只适用于它的契约覆盖的模型和 GPU。

true on-policy 模式承诺训练器与引擎之间的差距恰好为 0。在我们的 GB10 上，它没能启动，而运行也没有告诉我们这一点。

读完本节后，你能在规划 true on-policy 运行之前检查你的 GPU 和模型。

## 开始之前先检查契约 {#s-know-the-true-on-policy-limits-check-the-contract-before-you-start}

我们检查过的 Miles 版本只有一个 true on-policy 契约。它覆盖稠密的 Qwen3 模型：Qwen3-0.6B 和三个 Qwen3-4B 变体。两边都必须运行 FlashAttention 3：引擎把它作为 attention backend，训练器把它作为 attention 实现。

FlashAttention 3 是为 Hopper GPU 构建的。引擎的检查接受计算能力 8.0 到 9.0，拒绝更新的 GPU。所以在规划运行之前检查两件事：

1. 你的 GPU 是 Hopper GPU，例如 H100 或 H200。
2. 你的模型在契约之内。

只要有一个答案是否定的，true on-policy 模式就无法启动。

## 在其他 GPU 上会发生什么 {#s-know-the-true-on-policy-limits-what-happens-on-another-gpu}

我们的 GB10 是计算能力 12.1 的 Blackwell GPU。引擎在启动时停了下来：

```listing
title: FlashAttention 3 refuses the GB10
source: capture/gpu/out-gb10/engine-died-503.log
lang: text
note: The first engine lines of the true on-policy run.
---
[2026-10-17 21:03:03] Enable deterministic inference because of legacy rl_on_policy_target.
AssertionError: FlashAttention v3 Backend requires SM>=80 and SM<=90. Please use `--attention-backend flashinfer`.
```

训练器继续运行，并在一小时内不断向已经挂掉的引擎发送请求。[第 1.2 节](#s-add-a-watchdog)展示了这部分，以及能停掉它的 watchdog。

错误信息建议使用 FlashInfer。在 true on-policy 模式下不要采纳这个建议，因为契约规定两边都用 FlashAttention 3。用 FlashInfer 得到的是一次普通运行，而不是逐位精确的运行。

## 改用什么 {#s-know-the-true-on-policy-limits-what-to-use-instead}

在契约之外，关注差距，并在能降低的地方降低它：

- [第 4.4 节](#s-lower-the-logprob-gap)降低了来自 top-p 和 top-k 采样的那部分。
- [第 4.5 节](#s-use-deterministic-inference)让引擎能重复自己，这有助于你重复实验。
- [第 5.2 节](#s-check-the-first-step)检查第 0 步的差距是否在健康范围内。

在我们的 GB10 上，所有不用 top-p 或 top-k 且跑完的 Qwen3-0.6B 运行，每一步的差距都在 0.0136 到 0.0164 之间。在这个配置上，这就是要对照的范围。

```takeaways
- 规划 true on-policy 模式之前，检查 GPU 代际和模型列表。
- 加上 watchdog，因为引擎启动失败并不会让运行停下。
- 在契约之外，关注差距，并降低其中来自采样器的部分。
```

Sources: capture/gpu/out-gb10/engine-died-503.log; capture/gpu/summary/miles-gb10-lab.json (logprob_abs_diff per run); Miles true on-policy contract and model profiles at main 08752a12.
