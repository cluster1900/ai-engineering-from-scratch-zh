# 用 top-p 和 top-k 降低 log 概率差距

> 当你用 top-p 或 top-k 采样时，Miles 会在训练器中重放被采样的 token 集合，两边之间的差距就会变小。

使用 top-p 或 top-k 时，引擎从词表中裁剪后的一个集合里采样每个 token。训练器则在完整词表上给同一个 token 打分。所以两边给出的概率不同，而原因与 kernel 无关。

读完本节后，你能打开采样重放，并检查它是否降低了差距。

**我们的结果：** 在一个种子上，top-p 和 top-k 重放把中位差距从 0.0153 降到 0.0135，降低了 11.5%。

## 为什么引擎的数值更高 {#s-lower-the-logprob-gap-why-the-engine-number-is-higher}

top-p 保留概率之和至少达到 top-p 值的最小 token 集合。然后引擎重新缩放保留下来的概率，让它们的和再次为 1。假设两边在裁剪之前算出的分数相同。那么对于一个被保留的 token，引擎的 log 概率比完整词表上的分数高出负的保留质量的 log。如果保留的 token 占了 0.9 的质量，差值约为 0.105。top-k 以同样的方式裁剪集合，而 kernel 带来的差距还要叠加在这之上。

这个差值不是噪声。它对每个 token 都不同，而且总是把训练器与引擎之间的比值往同一个方向推。2026 年另一个 RL 库的一份 issue 报告描述了它的重要性采样比值中的这种偏差。采样重放能消除它，因为这样训练器就在同一个保留集合上打分。

2026-10-23，我们在 Miles 之外，用一块 L4 GPU 检查了这个公式。我们用了 BF16 的 `Qwen/Qwen3-0.6B`、16 个 48 token 的 prompt、温度 1 和 top-p 0.9。参考值来自一次在完整词表上的 float32 Transformers 前向。这块 GPU 是共享的，没有锁频，这不会改变这些数值。

```listing
title: returned logprob minus the full-vocabulary reference
source: capture/gpu/out-l4/logprobs-top-p.txt
lang: text
note: Three rows of the summary. The second SGLang row, with the variable set to 1, gave the same value.
---
engine and mode                                  returned minus reference, median   median absolute
vLLM --logprobs-mode raw_logprobs                0.0000                             0.005
vLLM --logprobs-mode processed_logprobs          +0.0527
SGLang return_logprob, ORIGINAL_LOGPROB=0        0.0000                             0.0066
```

- vLLM 可以用 `--logprobs-mode processed_logprobs` 返回 top-p 之后的值。这个值比参考值高出负的保留质量的 log，残差为 8e-9。这就是上面的公式。
- 在 top-p 0.9 时，中位偏移约为 0.053，而且大多数被采样 token 的保留质量都低于 0.99。
- SGLang 0.5.22 返回的是 top-p 之前的值。在温度 1 时，`SGLANG_RETURN_ORIGINAL_LOGPROB` 的设置不会改变它。我们的 Miles 镜像运行的是同一版本的开发构建，我们没有在它上面重复这项检查。

所以这个差距有多大，取决于引擎返回的是哪个值。读差距之前，先在你的引擎版本上检查这一点。

## 打开它 {#s-lower-the-logprob-gap-turn-it-on}

用 `MILES_EXTRA_ARGS` 给[第 1.1 节](#s-run-grpo-on-one-gpu)的运行加上采样器设置：

```bash
-e MILES_EXTRA_ARGS="--rollout-top-p 0.95 --rollout-top-k 64"
```

当 `--rollout-top-p` 小于 1 或 `--rollout-top-k` 大于 0 时，Miles 会自动打开采样重放。这时引擎会返回每一步可供采样的 token 集合。训练器只在这个集合上给每个 token 打分。

只要设置了小于 1 的 top-p，就同时设置一个正的 top-k，因为 Miles 的重放要求两者都有。重放与 KL loss 或 on-policy 蒸馏同时开启时，Miles 会拒绝启动。它也拒绝在使用 `--recompute-logprobs-via-prefill` 时重放。

## 检查差距 {#s-lower-the-logprob-gap-check-the-gap}

每一步都读 `train/train_rollout_logprob_abs_diff`。它是训练器与引擎的 log 概率之间的平均绝对差。

```listing
title: the engine settings of the two runs
source: capture/gpu/out-gb10/engine-settings.txt
lang: text
note: Both runs used the same attention backend and sampler. Only the top-p and top-k flags differ.
---
run                    attention_backend  enable_deterministic_inference  sampling_backend  --rollout-top-p  --rollout-top-k
e6a-base               flashinfer         False                           flashinfer        not set          not set
e11-topp-topk          flashinfer         False                           flashinfer        0.95             64
```

| 运行，12 步，种子 1 | 中位差距 | 最低和最高的步 | 中位奖励 |
|---|---|---|---|
| 不用 top-p 或 top-k | 0.0153 | 0.0150 到 0.0159 | 0.66 |
| top-p 0.95，top-k 64 | 0.0135 | 0.0128 到 0.0141 | 0.68 |

**我们测得** 使用重放时差距低 11.5%。重放运行没有任何一步达到不用重放时最低的那一步。奖励保持在同一范围内。

这只是 Qwen3-0.6B 上一个种子的 12 步。两者的步范围不重叠，所以我们报告的是方向。在为你自己的模型报告幅度之前，先跑第二个种子。

```figure
id: fig-4-4
kind: chart
title: Replaying the sampled tokens lowers the gap
claim: With top-p and top-k replay, the gap was lower at every one of the 12 steps.
caption: The logprob gap per step for two 12-step runs with seed 1.
```

## 重放解决不了什么 {#s-lower-the-logprob-gap-what-replay-does-not-fix}

重放消除了差距中来自采样器的那部分。其余部分很可能来自 kernel，因为引擎和训练器以不同的顺序把同样的数相加。[第 4.5 节](#s-use-deterministic-inference)表明确定性推理消除不了这部分。[第 8.3 节](#s-why-true-on-policy-is-a-contract)解释了什么能消除它。

```takeaways
- 同时设置 top-p 和 top-k，Miles 就会在训练器中重放被采样的集合。
- 在相同的步和种子上，比较前后的 train/train_rollout_logprob_abs_diff。
- 预期重放会降低差距，但不会消除它。
```

Sources: capture/gpu/summary/miles-gb10-lab.json (runs.e6a-base, runs.e11-topp-topk); capture/gpu/out-gb10/engine-settings.txt; capture/gpu/out-l4/logprobs-top-p.txt; Miles sampling-support replay documentation and arguments at main 08752a12; TRL issue 6789.
