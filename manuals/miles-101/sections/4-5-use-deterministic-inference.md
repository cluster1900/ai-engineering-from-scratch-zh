# 了解确定性推理能修好什么

> 确定性推理让引擎能重复自己的结果，但不会让引擎与训练器一致。

我们打开确定性推理，想消除训练器与引擎之间的差距。差距纹丝不动。变化的是，同一种子的两次运行现在在第 0 步给出了相同的 rollout。

读完本节后，你能判断什么时候确定性推理值得它的代价。

**我们的结果：** 无论是否使用确定性推理，中位差距都保持在 0.0151 到 0.0153 之间。两次确定性运行精确地重复了第 0 步的 rollout。

## 打开它 {#s-use-deterministic-inference-turn-it-on}

通过 `MILES_EXTRA_ARGS`，给[第 1.1 节](#s-run-grpo-on-one-gpu)的运行加上引擎参数和一个支持它的 attention backend：

```bash
-e MILES_EXTRA_ARGS="--sglang-enable-deterministic-inference --sglang-attention-backend triton"
```

启动脚本也会读取 `MILES_SGLANG_ATTENTION`，但只在 `MILES_TRUE_ON_POLICY=1` 的 true on-policy 模式下。在普通运行中，这个变量不起任何作用。

在我们的 GB10 上，`triton` 和 `flashinfer` 加上这个参数都能启动。引擎还会切换它的采样器，日志里也会写明：

```listing
title: the engine changes its sampler for deterministic mode
source: capture/gpu/out-gb10/deterministic-sampler.log
lang: text
note: One line from the Triton run and one from the FlashInfer run.
---
[2026-10-21 13:45:36] Sampling backend is set to pytorch for deterministic inference.
[2026-10-21 14:55:18] Sampling backend is set to pytorch for deterministic inference.
```

## 差距保持不变 {#s-use-deterministic-inference-the-gap-stays-the-same}

我们在 Qwen3-0.6B 上用种子 1 跑了四次 12 步的运行：

| 运行 | 中位差距 | 第 0 步的差距 |
|---|---|---|
| 默认引擎 | 0.01526 | 0.015271 |
| 确定性，Triton | 0.01518 | 0.015404 |
| 确定性，FlashInfer | 0.01520 | 0.015320 |
| 确定性，Triton，第二次运行 | 0.01515 | 0.015404 |

**我们测得** 有无确定性推理时差距相同。四个中位数彼此相差不超过 0.0002。

这说明原因在 kernel：两边用不同的 kernel 计算。确定性推理让引擎对相同的输入给出相同的结果，不管周围的 batch 是什么。它不会让引擎像训练器那样计算。

## 第一步可以重复 {#s-use-deterministic-inference-the-first-step-repeats}

两次 Triton 运行在第 0 步给出了相同的差距，精确到小数点后六位：0.015404。从第 1 步开始，它们就分开了。

引擎重复了自己，而训练器很可能没有。这些运行没有设置训练器的确定性模式，所以第一次更新后的权重在两次运行之间可能不同。我们没有在打开训练器参数的情况下测试这一点。

所以当你需要重复一个实验时，例如在相同的样本上测试奖励函数，就用确定性推理。不要用它来降低差距。

```figure
id: fig-4-5
kind: chart
title: Deterministic inference repeats, and the gap stays
claim: The two deterministic Triton runs gave the same gap at step 0, and all four runs kept a gap near 0.015.
caption: The logprob gap per step for four 12-step runs with seed 1.
```

## 代价 {#s-use-deterministic-inference-the-cost}

确定性 kernel 更慢。有四步在全部四次运行中都没有碰上温度保护暂停：第 0、1、4 和 10 步。在这四步上，默认引擎的 rollout 中位数是 56.5 s。[第 5.3 节](#s-repeat-a-run)的 59.1 s 是同一次默认运行在它 6 个干净步上的结果。在三次确定性运行中，rollout 用了 79.1 到 82.0 s，回答长度大致相同。

也就是多出 40% 到 45% 的 rollout 时间，这来自每种设置各一次、在有温度暂停的 GPU 上的运行。请把它看作未确认的结果。在长时间运行中一直开着这个参数之前，先在你自己的 GPU 上测量代价。

```takeaways
- 用确定性推理来重复实验。
- 不要用确定性推理来消除与训练器之间的差距。
- 长时间运行之前，先在你的 GPU 上测量 rollout 的代价。
```

Sources: capture/gpu/miles_grpo.py; capture/gpu/summary/miles-gb10-lab.json (runs.e6a-base, runs.e6b-det-triton, runs.e6c-det-flashinfer, runs.e6d-det-triton-repeat, median_unpaused); capture/gpu/out-gb10/deterministic-sampler.log; capture/gpu/out-gb10/engine-settings.txt; capture/gpu/out-gb10/unpaused-timing.txt.
