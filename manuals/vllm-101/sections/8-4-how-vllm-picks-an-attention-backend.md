# vLLM 如何选择 attention backend

> 本页解释每类 GPU 的选择顺序，以及首选项无法运行时 vLLM 会选什么。

attention kernel 是前向计算中在不同 GPU 之间变化最大的部分。读完本节后，你能预测 vLLM 在你的 GPU 上会选哪个 backend，并解释为什么改一个参数就可能换掉它。

## 每类 GPU 一张列表 {#s-how-vllm-picks-an-attention-backend-a-list-for-each-gpu-class}

vLLM 0.31.0 有 30 多个 attention backend。在 CUDA GPU 上，它遍历一张有序列表，选出第一个能以你的设置运行该模型的 backend。对于使用标准 attention 的模型，列表如下：

| GPU | 顺序 |
|---|---|
| Blackwell 数据中心 GPU，例如 B200 | FlashInfer、FlashAttention、Triton、FlexAttention、TurboQuant |
| 其他所有 CUDA GPU，包括 L4 和 GB10 | FlashAttention、FlashInfer、Triton、FlexAttention、TurboQuant |

使用 multi-head latent attention 的模型，例如 DeepSeek 系列，有它们自己的列表。

FlashAttention 本身也有版本。vLLM 在 Hopper GPU 上使用版本 3，在支持的 Blackwell 数据中心 GPU 上使用版本 4。其他所有 GPU 都用版本 2，所以我们的 L4 和 GB10 运行的都是 FlashAttention 2。我们的 GB10 日志写出了这个选择和列表：

```listing
title: the backend line from a GB10 start
source: capture/gpu/out-gb10/server-load-vllm.log
lang: text
note: vLLM took the first entry of the list.
---
(EngineCore pid=143) INFO 10-21 10:53:17 [cuda.py:526] Using FLASH_ATTN attention backend out of potential backends: ['FLASH_ATTN', 'FLASHINFER', 'TRITON_ATTN', 'FLEX_ATTENTION'].
```

## 为什么一个参数会改变 backend {#s-how-vllm-picks-an-attention-backend-why-a-flag-changes-the-backend}

每个 backend 都声明了它支持什么：KV cache 的数据类型、head 大小、block 大小，以及 CUDA graph 模式。如果你的设置要求的东西第一个 backend 做不到，vLLM 就会转向下一个。

FP8 KV cache 是常见的情况。在 L4 上，FlashAttention 2 无法读取 FP8 cache。使用 `--kv-cache-dtype fp8` 时，vLLM 会跳过它，如果装了 FlashInfer 就选 FlashInfer，没装就选 Triton。于是你的 FP8 结果同时测量了新的数据类型和新的 kernel。在我们的 L4 上 FlashInfer 构建失败了，如 [FP8 KV cache 页](#s-fit-more-users-with-an-fp8-kv-cache)所示。

## 为什么顺序不同 {#s-how-vllm-picks-an-attention-backend-why-the-order-differs}

我们的解读：这个顺序反映了编写列表时，每类 GPU 上哪些 kernel 最快、测试最充分。FlashInfer 有为 Blackwell 数据中心 GPU 调优的 kernel，所以在那里排第一。在较旧的 GPU 上，FlashAttention 的记录更长。这张列表是一种会随版本变化的判断，而不是定律。

这就是为什么本手册要你在每次启动后、每次改参数后都读 backend 那一行。如果两次运行用了不同的 backend，你比较的是 kernel，而不是设置。`--attention-backend` 用枚举名锁定一个 backend，例如 `TRITON_ATTN`。

```takeaways
- vLLM 从你的 GPU 类别对应的列表里，选第一个支持你设置的 backend。
- 在 L4 上使用 FP8 KV cache，会把 FlashAttention 2 换成 FlashInfer 或 Triton。
- 每次启动后都读 backend 那一行，比较设置时要锁定 backend。
```

Sources: the vLLM source at v0.31.0 (vllm/platforms/cuda.py, vllm/v1/attention/backends/registry.py, vllm/v1/attention/backends/fa_utils.py), vLLM documentation at v0.31.0 (docs/design/attention_backends.md), vLLM issue 60262, capture/gpu/out-gb10/server-load-vllm.log.
