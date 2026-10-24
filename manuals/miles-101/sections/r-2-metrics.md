# 指标

> 本手册读取的指标，以及它们在我们设置上的范围。

这些范围来自我们的实验运行：在一块 GB10 上用 GSM8K 训练 Qwen3-0.6B，32 个提示、每个 8 个回答，上限 1,024 个 token。它们只适用于这个设置。请用你自己的两到三个种子建立你自己的范围。

## Rollout {#s-ref-metrics-rollout}

| 指标 | 含义 | 我们的范围 |
|---|---|---|
| `rollout/raw_reward` | 这一步的平均奖励 | 48 步中每步 0.53 至 0.87 |
| `rollout/response_lengths` | 以 token 计的平均回答长度 | 396 至 787 |
| `rollout/truncated` | 达到长度上限的回答所占的比例 | 0.02 至 0.43 |

## 训练 {#s-ref-metrics-training}

| 指标 | 含义 | 我们的范围 |
|---|---|---|
| `train/train_rollout_logprob_abs_diff` | 训练器与引擎对数概率之间每个 token 的平均绝对差距 | 普通采样下 0.0136 至 0.0164 |
| `train/train_rollout_kl` | 在采样 token 上引擎分布与训练器分布之间的 KL | 0.00063 至 0.00076 |
| `train/grad_norm` | 梯度范数 | 0.35 至 4.95 |
| `train/pg_clipfrac` | 更新触及裁剪上限的 token 所占的比例 | 每一步都为 0 |
| `train/ppo_kl` | 训练器新旧概率之间的 KL | 健康运行中第 0 步为 0 |
| `train/entropy_loss` | 损失中的熵项 | 我们的运行中为 0 |

## 时间 {#s-ref-metrics-time}

| 指标 | 含义 | 我们的取值 |
|---|---|---|
| `perf/step_time` | 完整的一步 | 48 步的中位数 152.6 s，来自温度保护之前的一次运行 |
| `perf/rollout_time` | rollout 阶段 | 48 步的中位数 47.5 s，来自温度保护之前的一次运行 |
| `perf/log_probs_time` | 训练器为样本打分 | 48 步的中位数 23.4 s，来自温度保护之前的一次运行 |
| `perf/train_time` | 训练阶段，包括打分 | 48 步的中位数 100.3 s，来自温度保护之前的一次运行 |
| `perf/update_weights_time` | 把新权重复制进引擎 | Qwen3-0.6B 为 0.63 至 0.65 s |
| `perf/sleep_time` | 训练后训练器把状态移到主机内存 | Qwen3-0.6B 在 48 步中的中位数为 0.76 s，同一次 48 步运行的前两步为 1.9 至 3.7 s |
| `perf/wake_up_time` | 计算对数概率之前训练器把状态移回来 | Qwen3-0.6B 在 48 步中的中位数为 0.87 s |
| `perf/train_wait_time` | 训练器等待样本的时间 | 每一步都有记录 |

时间数值只适用于没有被温度保护暂停影响的步。[实验笔记](#s-ref-lab-notes)给出了这条规则。

## 评估和异步 {#s-ref-metrics-evaluation-and-async}

| 指标 | 含义 |
|---|---|
| `eval/lag_steps` | 专用集群上的评估晚了多少步完成 |
| rollout 指标中的权重版本统计 | 异步运行的样本有多旧 |

我们没有运行评估或异步训练，所以这张表没有范围。

Sources: capture/gpu/summary/miles-gb10-lab.json (runs.plain-48, runs.plain-48-s2, runs.plain-48-s3, runs.e4-0.6b); capture/gpu/out-gb10/thermostat.log; Miles loss, metric, and evaluation code at main 08752a12.
