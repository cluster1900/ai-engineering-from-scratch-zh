# 读懂前十步

> 只要读五个数字而不只是 reward，十步就足以区分健康的 GRPO 训练和出了问题的训练。

reward 在前几步里上下波动，很容易对某一步过度解读。日志中的五个数字能告诉你更多。在这套配置上，每个数字都有一个健康范围，并且各自以不同的方式出问题。

读完本节后，你能从训练日志中取出五个数字。然后你能把它们与我们的范围比较，判断训练是否健康。

**我们的结果：** 在三个随机种子的前十步中，每步 reward 为 0.53 到 0.74。log probability 差距为 0.0141 到 0.0164。

## 从日志中取出数字 {#s-read-your-first-ten-steps-pull-the-numbers-out-of-the-log}

每一步把它的数字写在两行上：样本的 `rollout N` 行，以及训练更新的 `step N` 行。用 `cd ~/miles-lab/runs` 进入[第 1.1 节](#s-run-grpo-on-one-gpu)中日志所在的文件夹。然后用 `grep` 读取某个数字在各步中的值：

```listing
title: two numbers over the first ten steps
source: capture/gpu/out-gb10/read-steps.txt
lang: text
note: The reward and the log probability gap from our 12-step run. One line is one step.
---
$ grep -o "'rollout/raw_reward': [0-9.]*" plain.log | head -10
'rollout/raw_reward': 0.62890625
'rollout/raw_reward': 0.59375
'rollout/raw_reward': 0.7578125
…
$ grep -o "'train/train_rollout_logprob_abs_diff': [0-9.]*" plain.log | head -10
'train/train_rollout_logprob_abs_diff': 0.015336457639932632
'train/train_rollout_logprob_abs_diff': 0.01610221341252327
'train/train_rollout_logprob_abs_diff': 0.014312651939690113
…
```

把模式中的指标名换掉，就能读取任何其他数字。

## 与健康范围比较 {#s-read-your-first-ten-steps-compare-with-the-healthy-ranges}

**KL：** Kullback-Leibler 散度，两个概率分布之间的距离。两个分布相同时它为 0。

我们用三个随机种子运行了同一个 48 步任务。下面是三次训练前十步的取值：

| 指标 | 日志名 | 第 0 到 9 步的健康范围 | 它告诉你什么 |
|---|---|---|---|
| reward | `rollout/raw_reward` | 0.53 到 0.74，每个种子的均值为 0.62 到 0.65 | 正确回答的比例 |
| 回答长度 | `rollout/response_lengths` | 626 到 787 token | 模型说了多长 |
| 截断比例 | `rollout/truncated` | 0.19 到 0.43 | 达到 1,024 token 上限的回答比例 |
| log probability 差距 | `train/train_rollout_logprob_abs_diff` | 0.0141 到 0.0164 | 训练器和引擎在相同 token 上的分歧有多大 |
| 训练器与引擎之间的 KL | `train/train_rollout_kl` | 0.00063 到 0.00075 | 同样的分歧，以两个概率分布之间的距离表示 |

**Log probability 差距：** 引擎给每个采样 token 的 log probability 与训练器计算出的 log probability 之间的平均绝对差。它永远不为零，因为两边运行的是不同的 kernel。

在前十步中，reward 从一步到下一步的变化最多为 0.14。在 48 步中，变化最多为 0.21。要读五步或更多步的均值，而不是某一步。

## 读完整训练的趋势 {#s-read-your-first-ten-steps-read-the-trend-over-the-full-run}

在 48 步中，三个种子的变化方向相同。reward 上升，回答变短，达到长度上限的回答变少，log probability 差距保持平稳。[第 5.3 节](#s-repeat-a-run)给出每个种子的数字。

```figure
id: fig-1-3
kind: chart
title: Reward over 48 steps, three seeds
claim: The reward of one step jumps around, and the trend over 48 steps goes up for every seed.
caption: Mean reward per step for three seeds of the same run.
```

```figure
id: fig-1-3b
kind: chart
title: Answers get shorter as the model learns
claim: The mean answer length falls from about 720 to about 460 tokens, so fewer answers hit the 1,024-token cap.
caption: Mean answer length per step for the same three seeds.
```

## 认出训练出问题的迹象 {#s-read-your-first-ten-steps-know-the-signs-of-a-broken-run}

| 你看到的现象 | 它意味着什么 | 去哪里看 |
|---|---|---|
| 十分钟后仍没有 step 行 | 引擎或训练器没有启动 | [第 7.1 节](#s-troubleshoot-by-symptom) |
| `503 Service Unavailable` 行持续数分钟不停 | rollout 引擎挂掉了。一分钟或更短的短暂批次可能来自健康的引擎 | [第 1.2 节](#s-add-a-watchdog) |
| log probability 差距一步比一步大 | 训练器和引擎持有不同的权重 | [第 5.2 节](#s-check-the-first-step) |
| reward 保持平稳，且许多组的得分都相同 | 大多数组没有提供学习信号 | [第 3.1 节](#s-train-math-on-gsm8k) |

最后一行还需要一个数字。rollout 端为每一步写一行 `perf N`，它统计每个回答都得到相同 reward 的组。在我们的第一步中，`rollout/zero_std/count_1` 为 7，`rollout/zero_std/count_0` 为 3。所以 32 个组中有 10 个组的回答全对或全错，GRPO 从这些组中什么也学不到。

```takeaways
- 把 reward 当作五步或更多步的均值来读。
- 每次训练都在 reward 旁边检查 log probability 差距和 KL。
- 统计每个回答 reward 都相同的组，因为它们什么也教不了。
- 把每次新训练与你自己的种子得出的范围比较。
```

Sources: capture/gpu/out-gb10/read-steps.txt; capture/gpu/out-gb10/plain-first-step.log; capture/gpu/summary/miles-gb10-lab.json (runs.plain-48, runs.plain-48-s2, runs.plain-48-s3); Miles rollout metrics at main 08752a12.
