# 在统一内存上阻止 Ray 停掉训练

> 在 GB10 上，GPU 分配和主机共用同一块内存，所以那里出现 Ray 内存停止，意味着机器确实快满了。

我们的 Qwen3-4B 训练跑完了第一次 rollout，然后在那一步的训练阶段停了下来，此时距启动 15 分钟。日志里没有 CUDA 显存不足错误。是 Ray 因为节点快满了而停掉了训练器。

读完本节后，你能认出 Ray 内存停止，并降低训练所需的内存。

**我们的结果：** Ray 两次停掉了我们的 4B 训练器，当时节点内存分别为 121.69 GB 中的 115.86 GB 和 119.18 GB。两次停止都是真实的内存压力。

## 读停止信息 {#s-stop-ray-killing-the-job-read-the-kill-message}

在改动任何东西之前，先在日志中搜索 `OutOfMemoryError`。Ray 内存停止点名的是节点，而不是某块 GPU：

```listing
title: Ray stops the trainer of a Qwen3-4B run
source: capture/gpu/out-gb10/ray-oom-4b.log
lang: text
note: The first line gives the share of node memory in use. The table lists the largest processes. The last line names the two settings that control the kill.
---
(TrainerController pid=2656) ray.exceptions.OutOfMemoryError: 1 worker(s) were killed due to the node running low on memory. Memory on the node (IP: 172.17.0.3, ID: 08904870a17c5413c623abfc21db2e7fcfdc39d5be90e997b2391f37) was 115.86GB / 121.69GB (0.952127)
(TrainerController pid=2656) Top 10 memory users: PID	MEM(GB)	COMMAND
(TrainerController pid=2656) 2657	36.77	ray::FSDPTrainRayActor.train
(TrainerController pid=2656) 3402	2.73	sglang::scheduler
(TrainerController pid=2656) 2650	1.33	ray::RolloutExecutor
To adjust the kill threshold, set the environment variable `RAY_memory_usage_threshold` when starting Ray. To disable worker killing, set the environment variable `RAY_memory_monitor_refresh_ms` to zero.
```

节点占用了 121.69 GB 中的 115.86 GB，即 95.2%。仅训练器进程就占了 36.77 GB。其余已用内存不在进程列表中。

## 为什么这会发生在 GB10 上 {#s-stop-ray-killing-the-job-why-this-happens-on-a-gb10}

在 GB10 上，CPU 和 GPU 使用同一个内存池。Ray 读取的是整个节点的内存，所以 GPU 分配也计入 Ray 监视的数字，包括模型权重、优化器状态和 KV cache。这是我们对进程列表中看不到的那部分内存的解释。我们没有测量其中的划分。

这个数字是真实的。当它达到 100% 时，机器上就没有任何内存可用了。所以在 95% 时被 Ray 停掉，是训练放不下的警告，而不是误报。

```figure
id: fig-2-3
kind: layers
title: Ray reads one memory for the whole GB10
claim: On a GB10, Ray reads one memory for the whole node, so its kill means the machine is close to full.
caption: The memory Ray read when it stopped the first 4B run, drawn as one bar.
```

## 降低训练所需的内存 {#s-stop-ray-killing-the-job-lower-the-memory-the-run-needs}

改动训练，而不是改动监视器：

1. 使用更小的模型。在我们的 GB10 上，只有更小的模型越过了停止。
2. 降低每步的工作量。使用更少的 prompt、每个 prompt 更少的回答，或者更短的回答。我们没有在 4B 上测试这一点。
3. 降低引擎内存。`--sglang-mem-fraction-static` 设定 rollout 引擎占用的 GPU 内存份额。在我们的 4B 测试中，用 0.2 代替 0.4 并没有阻止停止。

日志里还提到了 `RAY_memory_usage_threshold`。在统一内存上不要调高它。更高的阈值会让节点更接近占满。如果节点真的耗尽内存，操作系统可能会停掉机器上的任意进程，而这种停止不会留下任何 Ray 信息可读。

我们用 `--sglang-mem-fraction-static 0.2` 和默认的 Ray 阈值再次运行了同一个 Qwen3-4B 任务。Ray 又一次停掉了它，这次是在 119.18 GB。训练器进程占了 36.75 GB，与第一次几乎相同，所以更小的引擎份额并没有腾出空间。[第 2.1 节](#s-pick-a-model-size)说明了如何选择能放下的模型大小。

```takeaways
- 在改动任何东西之前，先读 Ray 的 OutOfMemoryError 那一行。
- 在统一内存上，把 Ray 内存停止当作真实的内存不足。
- 使用更小的模型或更少的每步工作量，并让 Ray 阈值保持默认。
```

Sources: capture/gpu/out-gb10/ray-oom-4b.log; capture/gpu/out-gb10/ray-oom-4b-timing.txt; capture/gpu/out-gb10/ray-oom-4b-lowmem.log; capture/gpu/summary/miles-gb10-lab.json (excluded.e4-4b); Ray memory monitor message in the e4-4b run log.
