# 用 DAPO 过滤器训练

> DAPO 过滤器丢掉每个回答得分都相同的组，这样每一步只在能教会模型东西的组上训练。

在一个普通的 GRPO 步里，我们大约一半的组要么全部答对，要么全部答错。这些组不提供学习信号。过滤器丢掉它们，并向引擎要更多 prompt，直到这一步有足够多有信号的组。

读完本节后，你能打开零方差过滤器并检查它丢掉了多少组。你还能测出额外 prompt 的代价。

**我们的结果：** 过滤器每步丢掉 16 到 48 组，其中大多数是全部答对的组。rollout 的耗时变成原来的 1.5 到 2.8 倍。在一个种子的 12 步里，过滤前统计的奖励比不加过滤器的运行更高。我们把这看作指标的偏差，而不是学习的结果。

## 打开过滤器 {#s-train-with-the-dapo-filter-turn-it-on}

用 `MILES_EXTRA_ARGS` 给[第 1.1 节](#s-run-grpo-on-one-gpu)的运行加上两个参数：

```bash
-e MILES_EXTRA_ARGS="--dynamic-sampling-filter-path miles.rollout.filter_hub.common_filters.apply_reward_nonzero_std_filter --over-sampling-batch-size 48"
```

我们的实验运行用的是同一个过滤器的旧路径，Miles 已把它标为弃用。在我们运行的版本里，旧路径调用的就是这里给出的过滤器，所以结果相同。

**Over-sampling batch：** rollout 每次发给引擎的 prompt 数。它必须不小于 `--rollout-batch-size`。

rollout 发出 48 个 prompt。每当一组完成，过滤器就决定保留或丢掉它。当已保留的组加上还在等待的组凑不够 32 组时，rollout 再发 48 个 prompt。保留满 32 组后，它停掉其余请求。被停掉的请求的回答不会被使用。

## 统计被丢掉的组 {#s-train-with-the-dapo-filter-count-the-dropped-groups}

rollout 在它的 `perf N` 行里为过滤器写出三个数：

| 日志名 | 统计的内容 |
|---|---|
| `rollout/dynamic_filter/drop_zero_std_0` | 被丢掉的、每个回答都错的组 |
| `rollout/dynamic_filter/drop_zero_std_1` | 被丢掉的、每个回答都对的组 |
| `rollout/raw_reward_unfiltered` | 过滤之前，所有已完成回答的平均奖励 |

没有过滤器时，这些组会留在 batch 里。读 `rollout/zero_std/count_0` 和 `rollout/zero_std/count_1` 就能看到有多少。

**我们测得** 在种子 1 的 12 步里，有无过滤器时的这些计数如下：

| 运行 | 每个回答奖励都相同的组 | 其中每个回答都对的 |
|---|---|---|
| 无过滤器，参与训练 | 384 组中的 191 组 | 142 |
| DAPO 过滤器，被丢掉 | 399 组，另有 384 组被保留 | 306 |

没有过滤器时，训练器用到的组有一半什么也没教。有过滤器时，每步丢掉 16 到 48 组，中位数是 36。被丢掉的组大多是简单的 prompt，模型每次都已经答对。

## 测量过采样的代价 {#s-train-with-the-dapo-filter-measure-the-over-sampling-cost}

过滤器运行的每次 rollout 都碰上了一次温度保护暂停，所以这次运行没有干净步。为了比较 rollout 时间，我们从每次 rollout 中扣掉了暂停时间。不加过滤器的运行是我们种子 1 的 12 步运行。扣掉暂停时间后，它的中位数是 58.0 s，接近它 6 个干净步的 59.1 s。

```figure
id: fig-3-2
kind: chart
title: The filter costs one or two extra batches of prompts
claim: A step that dropped 16 groups or fewer needed one batch of 48 prompts, and a step that dropped more needed two.
caption: Rollout seconds per step with the pause time taken out, 12 steps with seed 1.
```

有三步丢掉的组不超过 16 个，所以一批 48 个 prompt 就够了。它们的 rollout 中位数是 88.7 s，是无过滤器时 58.0 s 的 1.5 倍。其余九步需要第二批，中位数是 164.4 s，是原来的 2.8 倍。

一批 48 个 prompt 的工作量是 32 个 prompt 的 1.5 倍，这与第一个倍数吻合。第二批会增加更多工作，而且这一步必须等它保留的最慢的组。12 步的总耗时，有过滤器时是 113 分钟，没有时是 60 分钟，两者都包含温度暂停。

## 比较奖励 {#s-train-with-the-dapo-filter-compare-the-reward}

过滤器改变了 `rollout/raw_reward` 的含义，因为被丢掉的组不在其中。要比较两次运行，对过滤器运行请读 `rollout/raw_reward_unfiltered`。

```figure
id: fig-3-2b
kind: chart
title: The reward before the filter read higher
claim: Over 12 steps on one seed, the reward counted before the filter was higher in 8 of the 12 steps.
caption: Mean reward per step over every finished answer, 12 steps with seed 1.
```

12 步的平均值，有过滤器时是 0.686，没有时是 0.657。我们五次基线运行的 12 步平均值是 0.638 到 0.660，所以 0.686 高于所有基线。前四步的平均值也更高，0.672 对 0.625，而那时过滤器还不太可能明显改变模型。

我们认为原因在于这个数统计了什么。过滤前的奖励只统计在 rollout 停止前完成的组。被停掉的请求是最慢的，回答也最长。在长度上限处被截断的回答通常得 0 分，[第 4.2 节](#s-handle-long-responses)展示了这一点。所以这个数可能偏高，我们把更高的平均值看作这种偏差，而不是学习效果。

这只是一个种子的 12 步。过滤器运行跑完了全部 12 步。之后我们运行队列的时间限制在容器关闭时把它停掉了。要看出奖励上的效果，就多跑一些步和第二个种子，并和你基线种子之间的差距比较。

## 做出决定 {#s-train-with-the-dapo-filter-decide}

当很多组的每个回答得分都相同，而且你能承受更长的 rollout 时，就用这个过滤器。按你的丢弃率设置过采样 batch。一半的组被丢掉时，用 48 个 prompt 去凑 32 个保留组，对我们大多数步来说都太少了。

```takeaways
- 当很多组的每个回答得分都相同时，打开过滤器。
- 每一步都统计被丢掉的组，并把它们分成全对和全错。
- 每多一批 prompt，rollout 时间都会增加。
- 比较过滤前的奖励，并在报告提升之前跑第二个种子。
```

Sources: Miles filter hub, common_filters and dynamic_sampling_filters, at main 08752a12; capture/gpu/summary/miles-gb10-lab.json (runs.e2b-dapo-filter, runs.e6a-base, runs.plain, runs.plain-48, runs.plain-48-s2, runs.plain-48-s3); capture/gpu/summarize_miles.py; Miles rollout loop and filter metrics at main 08752a12.
