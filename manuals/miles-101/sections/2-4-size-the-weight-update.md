# 估算权重更新的开销

> 在一块 GPU 上，权重更新是一项很小的固定开销，所以它不是首先要调的那一步。

每个训练阶段结束后，训练器把新权重复制到 rollout 引擎。在一块 GPU 上，这次复制不离开 GPU，对我们运行的模型来说用时不到一秒。

读完本节后，你能测量权重更新的时间，并判断它对你的训练是否重要。

**我们的结果：** 权重更新对 Qwen3-0.6B 用时 0.64 s，对 Qwen3-1.7B 用时 0.91 s，不到一步时间的 1%。

## 读更新时间 {#s-size-the-weight-update-read-the-update-time}

每一步都会以秒为单位记录 `perf/update_weights_time`。把它和 `perf/step_time` 放在一起读。我们为两种模型大小各跑了 4 个短步，回答截断在 256 token：

| 模型 | 权重更新，4 步 | 训练器卸载，第 2 和第 3 步 | 训练器加载，第 2 和第 3 步 |
|---|---|---|---|
| Qwen3-0.6B | 0.63 到 0.66 s | 1.08 到 1.20 s | 0.77 到 0.86 s |
| Qwen3-1.7B | 0.89 到 0.95 s | 2.63 到 3.20 s | 1.42 到 1.45 s |

第 0 和第 1 步是预热步。在这些 4 步的运行中，它们的训练器卸载对 0.6B 最多用了 4.1 s，对 1.7B 最多用了 11.8 s。表格没有包含它们。

**训练器卸载：** 训练结束后训练器把权重和优化器状态移到主机内存所用的时间，记录为 `perf/sleep_time`。**训练器加载：** 在下一次计算 log probability 之前把它们移回所用的时间，记录为 `perf/wake_up_time`。

更大的模型约为 2.8 倍大，它的更新用时约为 1.4 倍。训练器卸载和加载的增长比更新更快。一个可能的原因是，更新只发送权重，而卸载还要移动梯度和优化器状态。

过短的回答几乎截断了每一条回复，所以这些运行中的 reward 一直接近 0。这些运行测量的是复制，而不是训练。

```figure
id: fig-2-4
kind: chart
title: A larger model costs more to offload than to update
claim: From 0.6B to 1.7B, the weight update grew 1.4 times, and the trainer offload grew 2.6 times.
caption: Mean seconds of steps 2 and 3, after two warm-up steps, for each model.
```

## 与一步的时间比较 {#s-size-the-weight-update-compare-it-with-the-step}

在我们用 Qwen3-0.6B 跑的 48 步训练中，一个完整步的中位数为 152.6 s，更新用时 0.64 s，不到一步的 0.5%。1.7B 模型的占比与此相近。

所以先调 rollout 和训练阶段。只有当更新超过一步时间的几个百分点时，再回来处理它。

## 只有在有理由时才改 bucket 大小 {#s-size-the-weight-update-change-the-bucket-size-only-with-a-reason}

训练器分 bucket 发送权重。`--update-weight-buffer-size` 以字节为单位设定 bucket 大小。我们的运行使用 536870912，即 512 MiB。

更大的 bucket 意味着更少的传输次数，以及更新期间更高的内存峰值。在一块 GPU 上，更新用时不到一秒，所以我们保持 512 MiB 不变。

```takeaways
- 对每种模型大小，把 perf/update_weights_time 和 perf/step_time 放在一起读。
- 先调 rollout 和训练阶段，再调权重更新。
- 同时留意训练器卸载和加载，因为它们的增长比更新更快。
```

Sources: capture/gpu/summary/miles-gb10-lab.json (runs.e4-0.6b, runs.e4-1.7b, runs.plain-48); capture/gpu/miles_grpo.py.
