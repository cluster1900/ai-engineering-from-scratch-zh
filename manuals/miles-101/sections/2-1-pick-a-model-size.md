# 为一块 GPU 选择模型大小

> 一块 GPU 上能训练的最大模型，是训练器副本和引擎副本能同时放下的那个模型。

读完本节后，你能在开始训练之前估算它的内存，并选出能放下的最大模型。

**我们的结果：** 在一块有 128 GB 共享内存的 GB10 上，回答截断在 256 token 时，Qwen3-1.7B 能放下并跑完 4 个短步。即使回答这么短，Qwen3-4B 也放不下。我们没有用 1,024 token 的配方训练 1.7B。

## 先算训练器的内存 {#s-pick-a-model-size-count-the-trainer-memory-first}

在共置训练中，训练器是占用最大的部分。用 Adam 做全量微调时，要保存模型权重、梯度，以及每个权重的两个优化器值。在混合精度下，这大约是每个参数 16 字节，还不算激活。引擎还要在此之上加上它自己的一份权重和它的 KV cache。

| 模型 | 训练器状态，估算 | 在我们 GB10 上的结果 |
|---|---|---|
| Qwen3-0.6B | 约 10 GB | 能训练 |
| Qwen3-1.7B | 约 27 GB | 在 256 token 下能跑 4 步 |
| Qwen3-4B | 约 64 GB | 在 256 token 下第一步就被 Ray 停掉，两次都是 |
| Qwen3-8B | 约 128 GB | 未尝试，比整台机器还大 |

这个估算是下限。激活、引擎和进程开销还要另算，下面实测的节点内存显示了这部分开销有多大。

```figure
id: fig-2-1
kind: chart
title: 1.7B fits for short steps, and 4B does not
claim: The estimated trainer state of a 4B model is about half the machine, and both 4B runs reached the Ray limit.
caption: Blue bars are estimates at 16 bytes for each parameter. Rose bars are the node memory that Ray read when it stopped each 4B run.
```

## 4B 发生了什么 {#s-pick-a-model-size-what-happened-with-4b}

Ray 在第一步的训练阶段停掉了我们的两次 4B 训练，当时内存分别为 121.69 GB 中的 115.86 GB 和 119.18 GB。第二次训练把引擎内存比例从 0.4 降到了 0.2，但仍被停掉。[第 2.3 节](#s-stop-ray-killing-the-job)给出了停止信息、它在 GB10 上发生的原因以及该改什么。

## 选择大小 {#s-pick-a-model-size-choose-the-size}

1. 从能完成你的任务的最小模型开始。
2. 把参数量乘以 16 字节。在我们 128 GB 的 GB10 上，上限落在这个估算的 27 GB 到 64 GB 之间。先用你 GPU 内存的一半作为初步估计。
3. 用你真实的回答长度跑 4 步。在主机上用 `free -g` 读节点内存，或者从 Ray 的停止信息那一行读。在 GB10 上，`nvidia-smi` 不报告内存大小。
4. 只有当短训练还有余量时，才升一档大小。

要训练 4B 或更大的模型，你需要更多 GPU（[第 6 部分](#s-split-rollout-and-training)），或者一个保存更少优化器状态的配方。

## 用 LoRA 训练更大的模型 {#s-pick-a-model-size-train-a-larger-model-with-lora}

**LoRA：** 低秩适配（low-rank adaptation）。训练器冻结模型权重，在部分层旁边训练两个小矩阵。只有这些小矩阵有梯度和优化器状态。

当完整的训练器状态放不下时，LoRA 是常用的训练方式。在我们运行的 Miles 版本中，只有 Megatron 训练器支持它。本手册使用的 FSDP 训练器在启动时会拒绝 LoRA。要尝试它：

1. 切换到 Megatron 训练器，如[第 6.1 节](#s-split-rollout-and-training-choose-the-trainer)所示。
2. 加上 `--lora-rank 16`，或其他大于 0 的 rank。默认 rank 为 0，表示关闭 LoRA。
3. 只用一个 adapter。在 `--colocate` 下，Miles 只训练一个 adapter，多个 adapter 需要分离布局。

引擎服务的是训练器正在更新的同一个 adapter。我们没有在 GB10 上运行过 LoRA 或 Megatron 训练器，所以不知道 4B 模型能否以这种方式在 128 GB 上放下。

```takeaways
- 开始之前，按每个参数 16 字节估算训练器状态。
- 在一块 128 GB 的 GB10 上，最多规划 1.7B，并用你的回答长度测试。
- Ray 因内存停掉训练后，按第 2.3 节的方法把训练缩小。
- 为更大的模型租更多 GPU 之前，先在 Megatron 训练器上试试 LoRA。
```

Sources: capture/gpu/out-gb10/ray-oom-4b.log; capture/gpu/out-gb10/ray-oom-4b-lowmem.log; capture/gpu/out-gb10/gpu-check.txt; Miles LoRA arguments and LoRA documentation at main 08752a12; capture/gpu/summary/miles-gb10-lab.json (runs.e4-0.6b, runs.e4-1.7b, excluded.e4-4b, excluded.e4-4b-lowmem).
