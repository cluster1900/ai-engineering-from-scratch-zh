# Model Runner V2 改变了什么

> 本页解释新的 model runner，以及异步调度为什么需要它。

在 0.31.0 中，vLLM 有两个 model runner，你用的是哪一个取决于你的参数。读完本节后，你能说出你的服务器用的是哪个 runner，以及为什么某种投机解码方法会改变它。

## model runner 做什么 {#s-what-model-runner-v2-changed-what-a-model-runner-does}

model runner 位于每个 GPU worker 中。它接收 scheduler 选出的 batch，构建输入 tensor，运行前向计算，并采样下一批 token。它还负责加载权重、运行启动时的 profile，以及捕获 CUDA graph。

V1 引擎的第一个 runner 增长到了 7,500 多行。vLLM 团队的设计笔记说，第一个版本有设计错误和技术债。于是团队从第一性原理出发构建了 Model Runner V2。新 runner 的规模大约是原来的三分之一。

## 两个想法 {#s-what-model-runner-v2-changed-two-ideas}

**固定的请求行表。** Model Runner V2 保留一个持久的 batch，每个 `--max-num-seqs` 名额对应一行，在我们的 GPU 上是 256 行。每个请求在整个生命周期内占有一行。被抢占的请求会离开它的行，和已完成的请求一样。runner 在每个 step 只更新变化的部分，而不是重新构建 batch。

**不等待 CPU。** runner 把它的工作放在一个 CUDA stream 上，并避免 CPU 必须等待 GPU 的点。这让 scheduler 能在 GPU 还在运行当前 step 时规划下一个 step。这就叫异步调度，对大多数生成模型默认开启。

## 什么时候你会用到旧 runner {#s-what-model-runner-v2-changed-when-you-get-the-old-runner}

安装了 Triton 时，Model Runner V2 是 CUDA 上的默认选项。在以下这些情况（以及其他情况）下，vLLM 0.31.0 会改用旧 runner：

- n-gram、suffix、Medusa 或 MLP speculator 方法。
- Mamba cache 模式 `all`，0.32 版本已将其移除。
- 原生 torch.compile 模式，以及某些并行功能，例如与 tensor parallelism 一起使用的 sequence parallelism。

`VLLM_USE_V2_MODEL_RUNNER=0` 或 `=1` 可以锁定选择。

这对投机解码影响最大。EAGLE3 保留新 runner 和异步调度。N-gram 投机解码会把你切到旧 runner，并关闭异步调度。于是对这两种方法的比较，同时也是对两个 runner 的比较。

## 接下来的方向 {#s-what-model-runner-v2-changed-where-it-goes-next}

vLLM 2026 年第四季度的路线图列出了彻底移除旧 runner。从 0.30 起，每个版本都把更多功能移到了新 runner 上。如果某个参数让你用上了旧 runner，在基于这个组合做开发之前，先看看下一个版本。

```takeaways
- Model Runner V2 为每个请求保留固定的一行，并避免等待 CPU。
- 它是 CUDA 上的默认选项，而某些投机解码方法会让你退回旧 runner。
- 比较两种方法时，用 VLLM_USE_V2_MODEL_RUNNER 锁定 runner。
```

Sources: the vLLM source at v0.31.0 (vllm/config/vllm.py, vllm/v1/worker/gpu_model_runner.py, vllm/v1/worker/gpu/model_runner.py, vllm/envs.py), vLLM documentation at v0.31.0 (docs/design/model_runner_v2.md), the vLLM roadmap for Q4 2026 (issue 61024), the release notes for v0.30.0 and v0.32.0.
