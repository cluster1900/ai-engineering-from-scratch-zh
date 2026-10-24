# 只在有理由时才更换 attention backend

> vLLM 会为你的 GPU 选择 attention backend，而你只有两个理由去覆盖它。

一篇论坛帖子说另一个 attention backend 更快。读完本节后，你能读出 vLLM 选了哪个 backend，并判断何时覆盖它。

**我们的结果：** 在我们的 L4 上，vLLM 选中的 backend 启动失败，强制使用 Triton backend 后修好了。

## 读出 vLLM 选的 backend {#s-change-the-attention-backend-only-for-a-reason-read-the-backend-vllm-picked}

vLLM 启动时会写一行日志，写明所用的 backend 以及其他可以运行的 backend。在日志里搜索它：

```bash
grep "attention backend" server.log
```

在我们的 DGX Spark 上，用 `Qwen3-30B-A3B` 和默认设置时，这一行是：

```listing
title: the attention backend line on our DGX Spark
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: The list holds only the backends that can run with this model and these settings, in the order vLLM tries them.
---
(EngineCore pid=143) INFO 10-21 10:53:17 [cuda.py:526] Using FLASH_ATTN attention backend out of potential backends: ['FLASH_ATTN', 'FLASHINFER', 'TRITON_ATTN', 'FLEX_ATTENTION'].
```

## 了解 vLLM 尝试的顺序 {#s-change-the-attention-backend-only-for-a-reason-know-the-order-vllm-tries}

vLLM 为每类 GPU 准备了一个 backend 列表。它去掉无法在你的模型和设置下运行的 backend，再选剩下的第一个。对于 vLLM 0.31.0 中的标准模型，顺序是：

| GPU | 例子 | 顺序 |
|---|---|---|
| SM 10.x | B200、GB200 | FlashInfer、FlashAttention、Triton、FlexAttention、TurboQuant |
| 其他 NVIDIA GPU | L4（SM 8.9）、H100（SM 9.0）、DGX Spark（SM 12.1） | FlashAttention、FlashInfer、Triton、FlexAttention、TurboQuant |

每次去掉的原因写在 debug 日志里，而不是 info 日志里。要看出来，就把启动行里的列表和这张表比较。列表里缺少的 backend 就是被去掉的。

## 了解 FP8 KV cache 带来的切换 {#s-change-the-attention-backend-only-for-a-reason-know-the-switch-that-an-fp8-kv-cache-makes}

在 vLLM 0.31.0 中，FlashAttention 只在 SM 9.0 和 SM 10.x 系列上读取 FP8 KV cache。所以在 L4 或 DGX Spark 上，`--kv-cache-dtype fp8` 会在没有警告的情况下更换 backend。[FP8 KV cache 页](#s-fit-more-users-with-an-fp8-kv-cache)讲了在我们 L4 上发生的情况。

## 强制指定 backend {#s-change-the-attention-backend-only-for-a-reason-force-a-backend}

用 `--attention-backend` 设置 backend：

```bash
vllm serve Qwen/Qwen3-8B --kv-cache-dtype fp8 --attention-backend TRITON_ATTN
```

如果你指定的 backend 无法在你的模型和设置下运行，vLLM 会在启动时停下，并报出原因。它不会换到另一个 backend。所以强制指定 backend 可以放心尝试：要么能运行，要么立刻失败。

`--block-size` 也会去掉一些 backend。如果它去掉了列表中更靠前的 backend，vLLM 会写一条点名它的警告。

## 看我们的运行结果 {#s-change-the-attention-backend-only-for-a-reason-see-what-our-run-shows}

我们唯一一次强制指定 backend 的运行，同时改变了 backend 和 KV 数据类型，所以[它的结果](#s-fit-more-users-with-an-fp8-kv-cache)看不出哪个 backend 更快。我们还没有在任何 GPU 上用同一种 KV 数据类型比较过不同的 backend。

## 做出决定 {#s-change-the-attention-backend-only-for-a-reason-decide}

把 backend 交给 vLLM。只为以下两个理由之一覆盖它：

- vLLM 选中的 backend 启动失败，就像 FlashInfer 在我们 L4 上那样。
- 你在自己的负载上测到了变慢，而另一个 backend 在同样负载上修好了它。

说某个 backend 更快的论坛帖子，测的是另一种 GPU、模型或负载。更换之前，先在你自己的环境上测量。

```takeaways
- 更换之前，先读启动日志里的 attention backend 那一行。
- 只为修复启动失败或测到的变慢而覆盖 backend。
- 无法运行的强制 backend 会让启动停下并给出原因。
```

Sources: capture/gpu/out-gb10/server-load-vllm.log, capture/gpu/incidents/l4-vllm-kv-fp8-flashinfer-attention-jit.txt, capture/gpu/summary/l4.json (load.vllm-fast-b, load.vllm-kv-fp8-triton), the vLLM source at v0.31.0 (vllm/platforms/cuda.py, vllm/v1/attention/backends/fa_utils.py, vllm/v1/attention/backends/flash_attn.py).
