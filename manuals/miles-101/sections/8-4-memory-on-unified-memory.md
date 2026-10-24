# 统一内存上的内存与权重更新

> 在 GB10 上，CPU 和 GPU 共享同一块内存，所以卸载只是在同一个池子里搬运字节，而权重更新从不离开芯片。

在一块 GPU 上，训练器和 rollout 引擎无法同时持有它们全部的内存。Miles 让它们轮流运行。本页解释每一轮交还了什么、权重更新做了什么，以及为什么 GB10 改变了这两件事。

读完本节后，你能解释卸载和权重更新在共享内存的机器上做了什么。

## 两边轮流运行 {#s-memory-on-unified-memory-two-sides-take-turns}

使用 `--colocate` 时，训练器和引擎共享同一块 GPU。每一步的顺序都相同：

1. 引擎为这一步生成回答。
2. 引擎释放它的内存。
3. 训练器加载它的状态，计算对数概率，然后训练。
4. 训练器释放它的状态。
5. 引擎再次加载，并接收新的权重。

`--colocate` 参数还会为两边都打开卸载。`--offload-rollout-level` 决定引擎交还什么。默认是它的两个内存标签：`kv_cache`，即注意力键和值的缓存；以及 `weight`，即模型权重。

```figure
id: fig-8-4
kind: timeline
title: The engine and the trainer take turns on one memory
claim: Only one side holds the GPU memory at a time, and the timed hand-offs take about 2 s of each step.
caption: Phase medians of 48 steps of a run made before we added the heat guard, drawn to scale.
```

## 普通机器和 GB10 上的卸载 {#s-memory-on-unified-memory-offload-on-a-normal-machine-and-on-a-gb10}

在 GPU 独立的机器上，卸载会通过总线把字节从 GPU 内存复制到 CPU 内存。复制就是代价。

GB10 上没有第二块内存。GPU 内存和 CPU 内存是同一块 128 GB。所以卸载释放的是 GPU 分配，字节仍留在同一个池中。对于 Qwen3-0.6B，在 48 步中，训练器把状态移到主机内存的中位时间是 0.76 s，移回来是 0.87 s。与超过两分钟的一步相比，这很小。

训练之前的引擎释放没有计时器。权重更新之后的引擎恢复记录在 `perf/finalize_and_resume_engines_time` 中。

我们的看法：在 GB10 上，训练器卸载和加载时间中有一部分很可能是准备工作，而不是复制。我们没有测量过这种划分。

## 权重更新留在 GPU 内部 {#s-memory-on-unified-memory-the-weight-update-stays-inside-the-gpu}

训练之后，引擎需要新的权重。在 `--colocate` 下，训练器把它的 GPU 张量句柄共享给引擎，引擎从中复制。字节从不经过网络传输。

训练器按桶发送权重。`--update-weight-buffer-size` 设置桶的大小，我们的运行使用 512 MiB。Qwen3-0.6B 的更新用了 0.64 s，Qwen3-1.7B 用了 0.91 s，都不到一步的百分之一。[第 2.4 节](#s-size-the-weight-update)有这张表。

## 同一个池改变了 Ray 看到的东西 {#s-memory-on-unified-memory-one-pool-changes-what-ray-sees}

共享内存还会改变其他工具看到的东西。Ray 读取整个节点的内存。在 GB10 上，这个数字包括模型权重、优化器状态和 KV cache。所以 Ray 可能在任何单个 GPU 分配失败之前就停止训练器。在 GB10 上，这种停止是一个真实的警告，因为对每个进程来说节点都已接近满载。[第 2.3 节](#s-stop-ray-killing-the-job)展示了这次终止，以及如何降低运行所需的内存。

## 我们还不知道的事 {#s-memory-on-unified-memory-what-we-do-not-know-yet}

在阶段之间保持引擎加载，在我们的 GB10 上只节省了很少的 rollout 时间。我们在同一个种子上跑了一对同一天的运行。在两次运行中都干净的步上，它在约一分钟的 rollout 中节省了 0.6 至 1.8 s。[第 2.2 节](#s-choose-what-to-offload)有这些运行。

```takeaways
- 使用 --colocate 时，引擎和训练器轮流运行，卸载决定每一边交还什么。
- 在 GB10 上，卸载在同一个池内释放内存，而权重更新在 GPU 内部复制。
- 把 GPU 分配计入节点内存，并把 Ray 的内存终止当作真实的短缺。
```

Sources: Miles placement, offload, and weight update code at main 08752a12; capture/gpu/miles_grpo.py; capture/gpu/summary/miles-gb10-lab.json (runs.e4-0.6b, runs.e4-1.7b, runs.plain-48); capture/gpu/out-gb10/ray-oom-4b.log.
