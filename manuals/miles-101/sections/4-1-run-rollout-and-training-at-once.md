# 让 rollout 和训练同时运行

> 异步训练让 rollout 在训练期间运行，但在一块 GPU 上，两个阶段仍然要互相等待。

在普通的 Miles 步中，先跑 rollout，再跑训练，然后再跑 rollout。在多 GPU 上，训练器工作时 rollout GPU 在等，rollout GPU 工作时训练器在等。异步训练去掉了一部分等待，代价是用到来自旧权重的样本。

读完本节后，你能判断异步训练对你的布局是否有帮助，以及哪些设置控制它的代价。

我们还没有在 GB10 上跑过异步训练。本页内容来自 Miles 的源码和文档。

## 两种异步模式 {#s-run-rollout-and-training-at-once-two-async-modes}

两种模式都用 `train_async.py` 而不是 `train.py` 启动：

| 模式 | 如何启动 | 哪些部分重叠 |
|---|---|---|
| 提前一步 | `train_async.py` | 当前步训练时，下一步的 rollout 同时运行 |
| 完全异步 | `train_async.py --fully-async` | 一个 worker 持续生成，训练器从缓冲区取组 |

在第一种模式下，使用默认的更新间隔时，每个样本最多落后一个权重版本。在完全异步模式下，样本的新旧取决于训练器消耗缓冲区的速度。

## 异步在一块 GPU 上能带来什么 {#s-run-rollout-and-training-at-once-what-async-gives-on-one-gpu}

使用 `--colocate` 时，训练器和引擎共享 GPU。Miles 只允许在 `--fully-async` 下共置，所以提前一步的模式需要独立的 GPU。完全异步模式可以用 `--colocate` 在一块 GPU 上运行，但只支持 Megatron 训练器，不支持本手册用的 FSDP 训练器。而且在整个训练窗口内生成都会停止，所以两个阶段仍然轮流进行。

所以在一块 GPU 上，异步训练不会节省时间。它带来了旧样本的代价，却没有任何重叠。在一块 GPU 上用它，只是为了在更大规模运行之前熟悉它的设置。

## 控制样本的新旧 {#s-run-rollout-and-training-at-once-control-the-age-of-the-samples}

在 rollout GPU 独立的布局上，下面这些设置决定样本最多能有多旧：

- `--update-weights-interval` 设定两次向引擎更新权重之间跑多少步。
- `--max-weight-staleness` 丢掉落后超过这么多个权重版本的样本。不设置表示没有限制。
- `--async-unused-samples-handler` 决定被丢掉的样本如何处理：`drop` 或 `retry`。
- `--async-max-concurrent-samples` 限制引擎同时生成的样本数。
- `--pause-generation-mode` 决定权重更新期间正在运行的请求如何处理：`abort`、`retract` 或 `in_place`。默认是 `retract`。完全异步模式拒绝 `abort`，在 `--colocate` 下还拒绝 `in_place`。

`--over-sampling-batch-size` 在 `--fully-async` 下不起作用。

## 样本越旧，学习率越低 {#s-run-rollout-and-training-at-once-lower-the-learning-rate-as-samples-get-older}

样本新旧和学习率是共同起作用的。2026 年一项针对 1B 和 3B 参数 Llama 模型的异步 GRPO 研究同时改变了这两者。[来源](#s-ref-sources)里把它列为异步 GRPO 崩溃的研究。最大的稳定学习率与两次权重更新之间的步数成反比下降。步数加倍时，学习率大约只能取一半。

我们没有测试过这一点。把它当作起步规则：当你调高 `--update-weights-interval` 或新旧限制时，按同样的倍数降低学习率。然后关注差距和奖励。

## 要关注什么 {#s-run-rollout-and-training-at-once-what-to-watch}

- 每个样本的权重版本。rollout 指标会报告样本有多旧。
- 被丢掉或重试的样本占比。占比高说明引擎在做无用功。
- 训练器和引擎之间的差距，见[第 5.2 节](#s-check-the-first-step)。更旧的样本会带来并非由 kernel 造成的差距。

在我们单块 GB10 上，无法测量异步训练带来的重叠，因为没有第二块 GPU 可以与之重叠。

```takeaways
- 只在 rollout 和训练运行在不同 GPU 上时使用异步训练。
- 给样本新旧设一个上限，允许样本更旧时就降低学习率。
- 在一块 GPU 上，用异步模式只是为了熟悉它的设置。
```

Sources: Miles fully async documentation, train_async.py, and async rollout arguments at main 08752a12; Scaling Laws for Collapse in Asynchronous GRPO, arXiv 2607.01083.
