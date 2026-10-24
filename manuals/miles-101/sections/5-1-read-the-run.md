# 从信号读懂一次运行

> 日志中的八个信号能在几分钟内告诉你一次运行是否健康。

奖励是每个人最先读的信号，也是最慢告诉你出了问题的信号。另外七个信号会更早暴露一次坏掉的运行。

读完本节后，你能根据日志中的信号判断一次运行是否健康，也能分辨哪些变化需要处理。

## 八个信号 {#s-read-the-run-the-eight-signals}

下面是我们三个基线种子全部 48 步上的范围。这些运行在 GSM8K 上训练 Qwen3-0.6B，每步 32 个提示、每个 8 个回答，上限为 1,024 个 token。

| 信号 | 日志名 | 我们运行中的范围 | 健康的运行 |
|---|---|---|---|
| 奖励 | `rollout/raw_reward` | 每步 0.53 至 0.87 | 在运行中上升，步与步之间有波动 |
| 回答长度 | `rollout/response_lengths` | 396 至 787 个 token | 随着模型学会更短的回答而下降 |
| 截断占比 | `rollout/truncated` | 0.02 至 0.43 | 随长度一起下降 |
| 差距 | `train/train_rollout_logprob_abs_diff` | 0.0136 至 0.0164 | 保持平稳 |
| 与引擎的 KL | `train/train_rollout_kl` | 0.00063 至 0.00076 | 保持平稳 |
| 梯度范数 | `train/grad_norm` | 0.35 至 4.95 | 保持在一个范围内，偶有尖峰 |
| 裁剪比例 | `train/pg_clipfrac` | 0 | 每次 rollout 更新一次时保持为 0 |
| rollout 时间 | `perf/rollout_time` | 随长度和发热变化 | 随长度一起下降 |

**裁剪比例：** 更新触及裁剪上限的 token 所占的比例。我们的运行每次 rollout 只做一次优化器更新。所以训练器的策略仍是给样本打分的那个策略，没有任何 token 被裁剪。

我们的运行在每一步都把 `train/entropy_loss` 记为 0，所以这个设置不会显示模型的熵。

## 读趋势，而不是单步 {#s-read-the-run-read-trends-not-steps}

在我们的运行中，奖励从一步到下一步最多变化 0.21。单独一步说明不了多少。请读五步或更多步的均值。

三个种子都呈现同样的趋势：奖励上升，回答变短。[第 5.3 节](#s-repeat-a-run)给出了每个种子的数字。

## 把信号发送到仪表盘 {#s-read-the-run-send-the-signals-to-a-dashboard}

十步以内，日志就够用。对于长时间的运行，仪表盘更容易读。Miles 可以把同样的 `train/`、`rollout/` 和 `perf/` 指标写到 Weights & Biases 或 TensorBoard。本手册中的每个数字都是我们从日志中读出的。我们在 GB10 上用一次 2 步的运行测试了这两种跟踪器。

如果使用 Weights & Biases 但没有账号或网络，就把运行写到本地文件夹：

```bash
-e MILES_EXTRA_ARGS="--use-wandb --wandb-mode offline --wandb-project miles-lab --wandb-group plain --wandb-dir /root/lab/runs/plain/wandb"
```

保留 `--wandb-group`。没有它，运行会在启动时停止并报错 `TypeError: unsupported operand type(s) for +: 'NoneType' and 'str'`。日志应显示 `W&B offline mode enabled. Data will be saved locally.`，并且 `~/miles-lab/runs/plain/wandb/wandb/` 下会出现一个 `offline-run-` 文件夹。

如果要在线运行，就去掉 `--wandb-mode offline`。不要把密钥放在命令行里，因为命令会进入 shell 历史和进程列表。把 `WANDB_API_KEY=<your key>` 放进一个只有你能读的文件，比如权限为 600 的 `~/miles-lab/wandb.env`，并在 `docker run` 行中加上 `--env-file ~/miles-lab/wandb.env`。不要把密钥放进 `MILES_EXTRA_ARGS`，因为启动器会在日志中打印完整命令。

对于 TensorBoard，给 Miles 一个文件夹并打开写入器：

```bash
-e TENSORBOARD_DIR=/root/lab/runs/plain/tb -e MILES_EXTRA_ARGS="--use-tensorboard"
```

日志应显示 `Saving tensorboard log to /root/lab/runs/plain/tb.` 然后在主机上用 `tensorboard --logdir ~/miles-lab/runs/plain/tb` 打开这个文件夹。

## 针对这些变化采取行动 {#s-read-the-run-act-on-these-changes}

| 变化 | 可能的原因 | 首先检查 |
|---|---|---|
| 差距跳升并一直偏高 | 引擎和训练器不再使用相同的权重 | 权重更新日志，以及[第 5.2 节](#s-check-the-first-step) |
| 梯度范数一步步增大 | 学习率对这个批次来说太高 | 降低学习率并重来 |
| 奖励下降而长度上升 | 模型学会了说得更长，而不是答得更好 | 奖励函数，以及截断占比 |
| 每次 rollout 更新一次时裁剪比例高于 0 | 样本不是来自当前的权重 | 更新间隔和异步设置 |
| 长度平稳时 rollout 时间增长 | 引擎或 GPU 变慢了 | 温度日志和引擎日志 |

保留你自己的范围。这些数字只适用于我们的模型、数据和机器。用你自己的设置跑两到三个种子，改用它们的范围。

```takeaways
- 先读差距、KL 和梯度范数，再读奖励。
- 读五步或更多步的均值，而不是单独一步。
- 用你自己的种子建立健康范围。
- 把长时间的运行发送到 Weights & Biases 或 TensorBoard，同时也保留日志。
```

Sources: capture/gpu/summary/miles-gb10-lab.json (runs.plain-48, runs.plain-48-s2, runs.plain-48-s3); Miles main 08752a12 files miles/backends/training_utils/loss/hub/losses.py, miles/backends/training_utils/metrics/log_utils.py, miles/ray/rollout/metrics.py, miles/utils/arguments.py, miles/utils/tracking_utils/tracking.py, miles/utils/tracking_utils/wandb_utils.py, miles/utils/tracking_utils/tensorboard_utils.py, docs/user-guide/monitoring.md; capture/gpu/out-gb10/tracker-eval-checks.txt (live check, 2026-10-23).
