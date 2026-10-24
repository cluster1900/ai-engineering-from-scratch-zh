# 选择阶段之间要卸载什么

> 在一块 GPU 上，训练器和引擎轮流运行，卸载设置决定了每一方交还哪些内存。

读完本节后，你能决定在另一方运行时，每一方交还哪些内存。你还能检查一次卸载改动的效果，而不被过热暂停误导。

**我们的结果：** 让引擎保持加载，在约一分钟的 rollout 中节省了 0.6 到 1.8 s。早先的一组对比显示了 12% 的差距，但那是更短的回答造成的。

## 了解两个开关 {#s-choose-what-to-offload-know-the-two-switches}

`--colocate` 会为双方都打开卸载。两个参数分别关闭一方：

- `--no-offload-rollout` 在训练器工作时把引擎权重和它的 KV cache 留在 GPU 上。引擎启动时不使用其内存节省模式。
- `--no-offload-train` 在引擎工作时把训练器权重和它的优化器状态留在 GPU 上。

`--offload-rollout-level kv_cache` 交还 KV cache 和 CUDA graph 的内存，保留引擎权重。

用 `MILES_EXTRA_ARGS` 给[第 1.1 节](#s-run-grpo-on-one-gpu)的训练加上一个开关：

```bash
-e MILES_EXTRA_ARGS="--no-offload-rollout --sglang-mem-fraction-static 0.25"
```

训练器一方有它自己的计时。`perf/sleep_time` 是训练结束后训练器把状态移到主机内存所用的时间，Miles 会在下一步记录它。`perf/wake_up_time` 是在计算 log probability 之前把状态移回所用的时间。训练前引擎的释放没有计时。权重更新后引擎的恢复记在 `perf/finalize_and_resume_engines_time` 中。

## 一次只比较一项改动，并在相同的步上比较 {#s-choose-what-to-offload-compare-one-change-at-a-time-on-the-same-steps}

我们在同一天跑了一组对比：种子 1，12 步，两次运行的引擎内存比例都是 0.25。唯一的区别是 `--no-offload-rollout`。

| 设置 | 干净的 rollout 步 | 干净 rollout 中位数 | 训练器卸载，所有步 | 训练器加载，所有步 | 权重更新，所有步 |
|---|---|---|---|---|---|
| 默认卸载 | 12 步中 4 步 | 60.7 s | 0.73 s | 0.76 s | 0.62 s |
| 引擎保持加载 | 12 步中 3 步 | 56.7 s | 0.75 s | 0.82 s | 0.64 s |

表格统计的是干净步，定义见[前言](#s-front-how-we-tested-it)。

两个中位数覆盖的是不同的步，而 rollout 时间随回答长度变化。早期的步写出约 800 token 的回答，后期的步约 690。所以要比较在两次运行中都干净的那些步：

```figure
id: fig-2-2
kind: chart
title: Keeping the engine loaded saves one or two seconds
claim: On the steps that were clean in both runs, the engine kept loaded saved 0.6 to 1.8 s of each rollout.
caption: Each pair of bars is one step of the same-day pair, with nearly the same answer length in both runs.
```

**我们测量到**第 0、1、8 步有小幅提升：69.4 对 68.0 s，58.5 对 56.7 s，55.8 对 55.2 s。提升为 1% 到 3%。两次运行中没有任何训练阶段躲过暂停，所以训练阶段没有干净的对比。它在全部 12 步上的中位数分别是 240.3 和 239.1 s，其中包含了暂停。

我们的第一组对比显示了更大的提升，52.0 s 对 59.1 s。那组对比同时改变了内存比例，而且它的干净步是不同的步。[实验笔记](#s-ref-lab-notes-results-from-one-run)解释了为什么这个结果站不住。

一个种子不足以给两种设置排出高下。一两秒的提升处在我们 GB10 在过热暂停下步与步之间的噪声范围内。

## 做出决定 {#s-choose-what-to-offload-decide}

保持默认的卸载设置。只有在内存有富余时才关闭引擎卸载。比例为 0.25 时，引擎在训练器运行期间保留约四分之一的 GPU 内存。在 GB10 上，训练器需要的正是这部分内存。[第 2.1 节](#s-pick-a-model-size)显示了 4B 模型留下的空间有多小。

```takeaways
- 在测量到改动的理由之前，保持默认的卸载设置。
- 在相同的步编号上比较卸载设置，因为 rollout 时间随回答长度变化。
- 测试卸载参数时，保持内存比例不变。
```

Sources: capture/gpu/summary/miles-gb10-lab.json (runs.e3e-base-frac025, runs.e3f-no-offload-rollout-frac025, runs.e6a-base, runs.e3c-no-offload-rollout, runs.e3b-offload-kv, runs.e3d-no-offload-train); capture/gpu/summarize_miles.py; Miles torch_native actor sleep and wake_up at main 08752a12.
