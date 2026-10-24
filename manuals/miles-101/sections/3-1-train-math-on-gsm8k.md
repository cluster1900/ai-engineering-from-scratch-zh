# 在 GSM8K 上训练数学推理

> 用二元奖励训练 GSM8K，是能看出 GRPO 在学习的最小配方，而组大小决定了每一步能学到多少。

读完本节后，你能在 GSM8K 上训练一个小模型，并选出每个 prompt 要采样多少个回答。

**我们的结果：** 在 24 步内，每个 prompt 4 个、8 个和 16 个回答带来的奖励提升都落在同一个范围内。回答越多，每次 rollout 越长。

## 运行配方 {#s-train-math-on-gsm8k-run-the-recipe}

[第 1.1 节](#s-run-grpo-on-one-gpu)里的启动脚本就是这个配方。下面这些参数决定每一步的形状：

```bash
--rollout-batch-size 32 --n-samples-per-prompt 8 --global-batch-size 256 --rm-type math
```

**组：** 引擎为同一个 prompt 写出的那些回答。GRPO 把每个回答和同组的其他回答比较，所以如果一组里每个回答拿到的奖励都一样，这一组就什么也教不了。

让 `--global-batch-size` 等于 prompt 数乘以回答数，这里是 32 乘 8。这样每次 rollout 恰好对应一个优化器步。

## 选择组大小 {#s-train-math-on-gsm8k-choose-the-group-size}

我们只改了 `--n-samples-per-prompt`，并让 `--global-batch-size` 与之匹配。对于 4 个回答，[第 1.1 节](#s-run-grpo-on-one-gpu)的运行加上这一行：

```bash
-e MILES_NUM_ROLLOUT=24 -e MILES_EXTRA_ARGS="--n-samples-per-prompt 4 --global-batch-size 128"
```

 下表比较了每次运行的前 24 步。提升是第 16 到 23 步的平均奖励减去第 0 到 7 步的平均奖励。

| 每个 prompt 的回答数 | 运行次数 | 奖励提升 | 回答长度，前 8 步到后 8 步 | 每步 rollout 时间 |
|---|---|---|---|---|
| 4 | 1 个种子 | +0.053 | 735 到 673 token | 14 个干净步上 32.5 s |
| 8 | 3 个种子 | +0.038 到 +0.098 | 712 到 734，然后 580 到 637 | 同样 14 步上 59.1 s，默认种子的 48 步运行 |
| 16 | 1 个种子 | +0.097 | 728 到 591 token | 188.2 s，没有干净步 |

```figure
id: fig-3-1
kind: chart
title: More answers per prompt, same learning in 24 steps
claim: The reward gain with 4 and with 16 answers per prompt fell inside the range of three seeds with 8.
caption: Reward gain over the first 24 steps for each run. The three green bars are the same recipe with three seeds.
```

**我们测得** 在 24 步内，组大小对奖励没有明显影响。16 个回答的运行提升了 +0.097，而 8 个回答的三个种子之一提升了 +0.098。8 个回答时种子之间的差距是 0.038 到 0.098，覆盖了所有运行。

代价则很明确。回答越多，每一步要写的 token 就越多。4 个回答的 rollout 在它的 14 个干净步上用了 32.5 s。我们用 8 个回答、默认种子的 48 步运行是在另一天跑的，那时还没加温度保护，所以没有任何暂停影响它。在同样的 14 个步号上，它用了 59.1 s。

16 个回答的运行每一步都碰上了一次温度暂停，所以它没有干净的时间。它 188.2 s 的中位数包含了这些暂停。

16 个回答的运行还记录了 22,357 行 `503 Service Unavailable`，成批出现，每批最长 60 s。客户端重试了每个请求，运行也继续了下去。有 512 个未完成请求时，router 很可能短时间内找不到空闲的引擎。我们没有确认这个原因。[第 1.2 节](#s-add-a-watchdog)用 watchdog 重放了这些突发。

解读这个结果时要注意它的局限。4 个和 16 个回答的运行各只有一个种子。16 个回答的运行跑完了全部 24 步。之后我们运行队列的时间限制在容器关闭时把它停掉了，[实验笔记](#s-ref-lab-notes)里有说明。

## 我们没有跑的部分 {#s-train-math-on-gsm8k-what-we-did-not-run}

我们没有跑每步 16 个和 64 个 prompt 的 rollout batch size 扫描。为了让实验不超出时间限制，我们停掉了它。

```takeaways
- 从 32 个 prompt、每个 prompt 8 个回答开始。
- 让全局 batch size 等于 prompt 数乘以回答数。
- 只有在跑了第二个种子时才改组大小，因为单次运行落在种子差距之内。
```

Sources: capture/gpu/miles_grpo.py; capture/gpu/out-gb10/503-bursts.txt; capture/gpu/summary/miles-gb10-lab.json (runs.e2-n4, runs.e2-n16, runs.plain-48, runs.plain-48-s2, runs.plain-48-s3, partial).
