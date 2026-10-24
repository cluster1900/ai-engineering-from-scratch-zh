# 把 vLLM 用作 RL rollout 引擎

> RL trainer 在各步之间借用服务器，而 vLLM 为它提供了休眠、唤醒和加载新权重的路由。

你的 RL trainer 必须先生成 rollout，再更新权重。读完本节后，你能说出 RL 框架会调用的那些控制路由。

## 循环 {#s-use-vllm-as-an-rl-rollout-engine-the-loop}

一个 RL 步分两半。rollout 这一半用当前权重生成回答。训练这一半计算 loss 并更新权重。然后生成器在下一次 rollout 之前需要拿到新权重。

在同一组 GPU 上，这两半轮流使用同一块显存。生成器必须在训练期间交还它的显存，之后再拿回来。vLLM 服务器为此提供了相应的组件，很多 RL 框架都会调用它们。vLLM 文档列出的使用者包括 verl、OpenRLHF、TRL、NeMo-RL、SkyRL、Prime-RL 等。

## 组件 {#s-use-vllm-as-an-rl-rollout-engine-the-pieces}

下面的路由只有在用 `VLLM_SERVER_DEV_MODE=1` 启动服务器时才存在。它们会释放显存、替换权重，并在每个 worker 上执行方法。绝不要把这种模式下的服务器暴露到 trainer 所在网络之外。

**休眠模式。** 用 `--enable-sleep-mode` 启动服务器。调用 `/sleep` 会释放 GPU 显存，`/wake_up` 会把它拿回来。在两个级别中较深的那个级别，休眠还会丢弃权重，这适合 trainer 反正要发送新权重的那一步。`--sleep-preserve-parameter-names` 让冻结的权重留在 GPU 上，这样它们不必每一步都搬动。

**暂停与恢复。** `/pause` 停止新的生成，`/resume` 重新开始。暂停可以中止正在运行的请求、等待它们完成，或者保留它们。

**权重更新。** trainer 用 `/init_weight_transfer_engine` 开始一次传输，然后调用 `/start_weight_update`，发送权重，再调用 `/finish_weight_update`。传输可以通过 GPU 之间的 NCCL 进行，也可以在一台机器上通过 CUDA 内存句柄进行。`/update_weight_version` 记录接下来的 rollout 使用哪个版本。

**集合调用。** `/collective_rpc` 在每个 worker 上执行一个方法。框架用它来做 vLLM 没有覆盖的初始化工作。

**外部启动。** 使用 `--distributed-executor-backend external_launcher` 时，像 `torchrun` 这样的启动器会在 trainer 的进程内启动 vLLM worker。一些共置部署的框架走的就是这条路。

## 手动试一试休眠和唤醒 {#s-use-vllm-as-an-rl-rollout-engine-try-sleep-and-wake-by-hand}

以开发模式启动服务器，并开启休眠模式。`--host 127.0.0.1` 让控制路由只在你自己的机器上可用：

```bash
VLLM_SERVER_DEV_MODE=1 vllm serve Qwen/Qwen3-8B --enable-sleep-mode --host 127.0.0.1 2>&1 | tee server.log
```

在第二个终端里，让服务器休眠、检查它，再唤醒它：

```bash
curl -X POST 'http://localhost:8000/sleep?level=1'
curl http://localhost:8000/is_sleeping
curl -X POST 'http://localhost:8000/wake_up'
curl http://localhost:8000/is_sleeping
```

两个 POST 路由返回 HTTP 200 和空的响应体。第一次 `/is_sleeping` 调用返回 `{"is_sleeping":true}`，第二次返回 `{"is_sleeping":false}`。在调用之间运行 `nvidia-smi`，可以看到 GPU 显存在休眠期间下降，在唤醒后回升。

我们在一块 L4 上用小模型 Qwen3-0.6B 以级别 1 执行了这些调用。每个 POST 都返回 200 和空响应体，休眠用时 1.9 s。GPU 显存从 14,861 MiB 降到 4,245 MiB，唤醒后恢复。日志行 `Sleep mode freed 10.37 GiB memory` 确认了这次休眠。

## 了解 0.31.0 中休眠模式的问题 {#s-use-vllm-as-an-rl-rollout-engine-know-the-sleep-mode-problems-at-0-31-0}

在 0.31.0 中，休眠模式有三个已知问题。我们自己没有复现它们：

- **级别 2 唤醒不会重新加载 speculative draft。** Issue 52479 报告说，权重重新加载只覆盖目标模型。目标模型随后拒绝每一个 draft token，于是 decode 降到大约没有 speculation 时的速度。输出仍然正确，也不会出现错误。这个 issue 仍未关闭。
- **级别 2 休眠会清除校准过的 KV scale。** 在使用 FP8 KV cache 的 compressed-tensors checkpoint 上，重新加载权重后的第一个请求返回了 NaN 的 logprob 和错误的第一个 token。0.32.0 版本修复了这个问题。
- **休眠期间更新权重会让引擎停止。** Issue 57853 报告说，当 trainer 在 `/sleep` 之后、`/wake_up` 之前发送权重时会出现 segfault。API 服务器仍在运行，但之后的每个请求都会失败。这个 issue 仍未关闭。

所以每次级别 2 唤醒之后，都要重新加载权重、重置 prefix cache，并读取 speculative 接受计数器。总是在 trainer 发送权重之前唤醒服务器。

## 检查 rollout 的 logprob {#s-use-vllm-as-an-rl-rollout-engine-check-the-rollout-logprobs}

trainer 经常把 vLLM 返回的 logprob 与它自己计算的 logprob 做比较。两者永远不会完全一致，因为 kernel 不同。一个小而稳定的差距是正常的。差距不断扩大，说明权重没有到达生成器。每一步都要跟踪这个差距。[可复现性页](#s-get-reproducible-outputs)解释了为什么相同的权重仍会给出不同的数字。

在读这个差距之前，先确认 vLLM 返回的是哪种 logprob。使用 top-p 或 top-k 时，对大多数 token 来说这两个值是不同的。

**Logprobs 模式：** 服务器选项 `--logprobs-mode`，它决定 vLLM 为每个 token 返回什么值。默认值是 `raw_logprobs`，即在整个词表上的 logprob。`processed_logprobs` 给出采样设置改变分布之后的 logprob。另外两种模式 `raw_logits` 和 `processed_logits` 返回 logit。

2026-10-23 我们在 L4 节点的第二块 GPU 上检查了两种 logprob 模式。我们使用 BF16 的 `Qwen/Qwen3-0.6B`、16 个 48 token 的 prompt、temperature 1 和 top-p 0.9。在相同 token 上做一次 float32 的 Transformers 前向计算作为参考。那块 GPU 是共用的，没有锁定时钟，但时钟不会改变这些值。

```listing
title: returned logprob minus the full-vocabulary reference
source: capture/gpu/out-l4/logprobs-top-p.txt
lang: text
note: The two vLLM rows. The SGLang rows are cut.
---
engine and mode                                  returned minus reference, median   median absolute
vLLM --logprobs-mode raw_logprobs                0.0000                             0.005
vLLM --logprobs-mode processed_logprobs          +0.0527
```

- `raw_logprobs` 与整个词表上的 logprob 一致，来自 kernel 的绝对差距中位数为 0.005。
- `processed_logprobs` 高出的量等于 top-p 保留的概率质量取对数后的相反数。相对于这个公式的残差中位数为 8e-9。
- 在 top-p 0.9 下，大多数被采样的 token 保留的质量低于 0.99，偏移的中位数约为 0.053。

所以，如果 trainer 在整个词表上打分，就与 `raw_logprobs` 比较。只有当 trainer 在同样保留下来的集合上打分时，才与 `processed_logprobs` 比较。

未在我们的硬件上测量。我们只运行了那一次级别 1 的检查和 logprob 检查，两者都用的是小模型。我们没有测量级别 2 休眠或权重更新的时间。我们的 Miles 101 手册用 SGLang 作为生成器测量了同样的循环。

```takeaways
- 休眠为训练释放 GPU 显存，唤醒再把它拿回来。
- 权重更新是一次由 trainer 通过服务器路由开始和完成的传输。
- 每一步都跟踪生成器与 trainer 的 logprob 之间的差距。
- 让 --logprobs-mode 与你的 trainer 给 token 打分的方式相匹配。
- 在 0.31.0 中，级别 2 唤醒后要读 draft 接受率，并在权重更新之前唤醒服务器。
```

Sources: the vLLM source at v0.31.0 (vllm/config/model.py, vllm/config/parallel.py, vllm/entrypoints/serve/dev/sleep/api_router.py, vllm/entrypoints/serve/dev/rlhf/api_router.py, vllm/entrypoints/serve/dev/rpc/api_router.py, vllm/distributed/weight_transfer/base.py, vllm/distributed/weight_transfer/factory.py, vllm/distributed/weight_transfer/nccl_engine.py, vllm/distributed/weight_transfer/ipc_engine.py), vLLM documentation at v0.31.0 (docs/training/rlhf.md, docs/training/async_rl.md, docs/features/sleep_mode.md, docs/training/weight_transfer/), the release notes for v0.31.0 and v0.32.0, vLLM issues 52479 and 57853, the release notes for v0.32.0 (level 2 sleep and calibrated KV scales), capture/gpu/out-l4/livecheck-2026-10-22.txt, capture/gpu/out-l4/logprobs-top-p.txt.
