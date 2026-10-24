# 为什么真正同策略模式是一份契约

> 逐位一致需要两边使用相同的 kernel，所以真正同策略模式只适用于它列出的模型和 GPU。

GRPO 假设引擎给一个 token 的概率，就是训练器为它算出的概率。在我们 GB10 上每次健康的 Qwen3-0.6B 运行中，两边平均每个 token 相差 0.013 至 0.016。本页解释这个差距从何而来，以及为什么消除它需要一份契约而不是一个参数。

读完本节后，你能解释为什么真正同策略模式只覆盖部分模型和 GPU。

## 两个程序计算同一个模型 {#s-why-true-on-policy-is-a-contract-two-programs-compute-the-same-model}

每次更新之后，引擎和训练器持有相同的权重。它们运行的仍是不同的程序。引擎为速度而构建：它把许多请求合成批次，按批次大小选择 kernel，并融合操作。训练器为梯度而构建：它运行不同的注意力 kernel 和不同的运算顺序。

浮点加法按不同顺序进行，结果会略有不同。同一个长求和，按两种顺序相加，最后几位可能不同。经过 28 层和 151,936 个 token 的词表，这些位会累积起来。我们认为这就是我们测到的差距。

所以这个差距不是任何一边的 bug。它是两个各自把本职工作做好的程序所付出的代价。

## 确定性推理修复的是错误的那一半 {#s-why-true-on-policy-is-a-contract-deterministic-inference-fixes-the-wrong-half}

确定性推理让引擎对同一个请求给出相同的结果，无论它周围的批次是什么。这让引擎能重复自己的结果。它并不会让引擎像训练器那样计算。

我们的运行直接显示了这一点。开启确定性推理时，两次运行在第 0 步给出的差距在小数点后六位都相同，而差距保持在 0.015。[第 4.5 节](#s-use-deterministic-inference)给出了这些数字。

```figure
id: fig-8-3
kind: comparison
title: Two fixes for two different halves
claim: Deterministic inference fixes the engine half, and only the true on-policy contract makes both halves the same.
caption: The trainer is on the left and the engine on the right.
```

## 契约锁定了什么 {#s-why-true-on-policy-is-a-contract-what-the-contract-pins}

要得到恰好为 0 的差距，两边必须以相同顺序执行相同的算术。Miles 中的契约为一个模型家族锁定了这些：

- 两边使用同一个注意力 kernel，即 FlashAttention 3。
- 在任何批次大小下都给出相同结果的运算。
- 按引擎计算 prefill 的方式计算对数概率。
- 每个模型一份配置，因为每个模型都有自己需要对齐的层。

每一项都消除一种运算顺序不同的来源。它们合在一起，让两个程序逐位一致。

## 为什么它止步于 Hopper 和 Qwen3 {#s-why-true-on-policy-is-a-contract-why-it-stops-at-hopper-and-at-qwen3}

每一个被锁定的项都是有人在特定硬件上验证过的一段代码。FlashAttention 3 是为 Hopper GPU 构建的。批次不变的运算和模型配置是针对稠密 Qwen3 模型验证的。新的 GPU 或新的模型需要自己的 kernel，并以同样的方式验证。

这就是我们称它为契约而不是设置的原因。设置是让代码去尝试。契约列出代码已被证明可行的情形，并拒绝其余情形。

## 我们的差距是我们设置的下限 {#s-why-true-on-policy-is-a-contract-our-gap-is-the-floor-of-our-setup}

我们约 0.015 的差距是一种设置的下限。这种设置是两边都用 BF16、引擎中用 SGLang kernel、训练器中用 FSDP kernel。它不是 RL 的定律。其他设置会改变它。下面的改变来自已发表的工作，我们只在小规模上验证了第一项：

- **精度。** 一项 2025 年的研究让训练器和引擎都以 FP16 运行，并报告差距几乎消失了。FP16 比 BF16 为每个数保留更多的位，所以每次舍入更小。
- **张量并行规模。** 一篇 2025 年的论文表明，拆分到多块 GPU 上的引擎与单块 GPU 上的训练器做加法的顺序不同。即使使用批次不变的 kernel，这个差距依然存在，所以引擎的张量并行规模本身就是一种来源。
- **逐位一致的 kernel。** 同一篇论文随后用以一种固定树形顺序做加法的 kernel，让一个 vLLM 引擎和一个 FSDP 训练器逐位一致。在他们对 Qwen3-8B 的测试中，推理时间增加了 22% 至 63%。

2026-10-23，我们在 Miles 之外、在我们 L4 节点的第二块 GPU 上验证了精度这一说法。SGLang 0.5.22 以 BF16 或 FP16 服务 `Qwen/Qwen3-0.6B`。它以 top-p 1 为 32 个提示各采样最多 64 个 token，所以没有采样掩码。比较覆盖了来自 32 个提示的 1,961 个采样 token，因为有 3 个回答在 64 个 token 之前就遇到了结束 token。对同样的 token 做一次 Transformers 前向传播，扮演训练器。

```listing
title: median absolute logprob gap per token, engine against trainer
source: capture/gpu/out-l4/logprob-gap-by-dtype.txt
lang: text
note: The full table. The engine dtype comes first, then the trainer dtype.
---
engine   trainer   median    p90      mean     max
BF16     BF16      0.0073    0.087    0.027    0.355
BF16     FP16      0.0079    0.053    0.019    0.279
BF16     FP32      0.0076    0.053    0.019    0.280
FP16     BF16      0.0085    0.061    0.021    0.265
FP16     FP16      0.00094   0.010    0.0032   0.033
FP16     FP32      0.0010    0.0068   0.0024   0.023
```

- 两边都用 FP16 时，中位差距比两边都用 BF16 时缩小了约 7.8 倍。最差的 token 从 0.355 降到 0.033。
- 只有一边用 FP16 没有帮助。差距保持在 0.0079 和 0.0085。
- BF16 引擎即使对上 FP32 训练器也保持在约 0.0076，所以是它自己的舍入决定了这个下限。

这支持了那项研究，但有局限。它只是一个 0.6B 模型，测量的是对数概率差距而不是一次训练运行，也没有使用 Miles 的镜像构建。GPU 是共享的，没有锁定时钟，这不会改变这些数值。

其他团队也公布了他们健康运行的差距。把它们当作一个正常差距大小的参照，而不是你的运行要达到的目标：

| 设置（按报告） | 每个 token 的差距 |
|---|---|
| Qwen3-4B，A100，vLLM 团队的 RL 框架 | 约 0.011 |
| Qwen3-30B-A3B MoE，GB200，同一框架 | 约 0.018 |
| GLM-4.5-Air，GB200，同一框架 | 0.02 至 0.03 |
| DeepSeek-V4.1，BF16，GB300，使用 Miles | 0.019 至 0.023 |
| GLM-5.3-Flash，GB300，使用 Miles 和路由重放 | 0.0068 至 0.0106，见[第 3.4 节](#s-train-a-moe-model) |

我们的看法：在契约之外的 GPU 上，先判断差距对你的运行是否重要。如果重要，精度、张量并行规模和逐位一致的 kernel 就是可用的杠杆，每一种都要付出速度或工作量的代价。如果不重要，就在第 0 步测量差距，并把它保持在你健康运行的范围之内。然后消除采样器带来的那一部分。

```takeaways
- 差距来自两个以不同顺序做加法的程序，而不是来自 bug。
- 确定性推理让引擎能重复自己的结果，而真正同策略模式让两边一致。
- 我们约 0.015 的差距是我们的 BF16 设置和 kernel 的下限，而不是定律。
```

Sources: Miles true on-policy contract, model profiles, and documentation at main 08752a12; capture/gpu/summary/miles-gb10-lab.json (runs.e6a-base, runs.e6b-det-triton, runs.e6c-det-flashinfer, runs.e6d-det-triton-repeat); Qwen3-0.6B model configuration; capture/gpu/out-l4/logprob-gap-by-dtype.txt; Defeating the Training-Inference Mismatch via FP16, arXiv 2510.26788; Deterministic Inference across Tensor Parallel Sizes, arXiv 2511.17826; vime announcement, vLLM blog, 2026-06-09; SGLang pull request 42408; Miles GLM-5.3-Flash model documentation.
