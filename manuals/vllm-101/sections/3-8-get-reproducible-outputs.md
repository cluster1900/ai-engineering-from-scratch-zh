# 获得可复现的输出

> 在繁忙的 batch 中，光靠 seed 得不到相同的输出，而 batch invariance 要付出速度的代价。

你在跑评测，分数在不同运行之间会变。读完本节后，你能让同一个请求得到相同的输出。

## 了解输出为什么会变 {#s-get-reproducible-outputs-know-why-outputs-change}

vLLM 文档说明，出于速度考虑，vLLM 默认不保证相同的输出。有三件事会改变一个请求的结果：

- **batch。** kernel 按 batch 大小切分求和。同一个请求在 3 个请求的 batch 和 30 个请求的 batch 中，累加数字的顺序不同。浮点求和依赖顺序。一个 logit 上的微小差异就可能改变一个采样出的 token，之后的每个 token 都会随之不同。
- **调度。** 在默认的多进程服务器中，请求到达的时机决定了每个请求加入哪个 batch。
- **prefix cache。** 复用缓存 block 的请求，计算其 prompt 的方式与没有命中 cache 的请求不同。在我们基于 0.31.0 的运行中，热 cache 改变了 32 个 prompt 中 11 个的 greedy 输出。2026 年的论文 "Same Request, Different Answer" 在 vLLM 0.11 上发现了同样的效应。
- **dtype。** BF16 和 FP16 对每个数的舍入方式不同，所以同一个模型在这两种 dtype 下写出的文本不同。

在当前引擎中，seed 默认为 0，而且你无法取消它。Speculative decoding 需要每个 worker 采样出相同的 token。所以 seed 总是存在，但单靠它是不够的。

## 为你的场景选择修复方法 {#s-get-reproducible-outputs-pick-the-fix-for-your-case}

| 场景 | 修复方法 | 代价 |
|---|---|---|
| 用 `LLM` 类做离线评测 | 设置 `VLLM_ENABLE_V1_MULTIPROCESSING=0`，使用相同的 seed，并以相同的顺序发送相同的 prompt | 引擎在你的进程中运行，所以调度会重复 |
| 有线上流量的服务器 | 开启 batch-invariant 模式，如下一节所示 | 每个请求的 kernel 都更慢 |
| 必须完全一致的 greedy 评测 | 把 greedy 采样与上面两种修复之一结合 | 同上 |

每种修复还都需要相同的硬件、相同的 vLLM 版本和相同的设置。新版本或新 GPU 会改变 kernel，输出也会随之改变。

## 开启 batch-invariant 模式 {#s-get-reproducible-outputs-turn-on-the-batch-invariant-mode}

启动服务器时设置一个环境变量：

```bash
VLLM_BATCH_INVARIANT=1 vllm serve Qwen/Qwen3-8B 2>&1 | tee server.log
```

这个模式需要计算能力 8.0 或更高的 NVIDIA GPU，L4 和 GB10 都包括在内。vLLM 文档把 Qwen3-8B 列为在该模式下测试过的模型之一。这个模式会关闭一些会改变求和顺序的加速特性，例如张量并行下的 custom all-reduce。

我们在一块 L4 上用小模型 Qwen3-0.6B 做了一次探测。开启该模式时，一个 greedy prompt 单独运行和在 32 个请求的 batch 中运行给出了相同的文本。关闭该模式时，两段文本不同。一个小模型上的一个 prompt 对你的模型说明不了什么，所以请在你自己的模型上运行本页末尾的测试。

## 看看在我们的运行中是什么改变了输出 {#s-get-reproducible-outputs-see-what-changed-the-output-in-our-runs}

我们在一段约 170 token 的共享 system prompt 之后发送 ShareGPT 的问题，使用 greedy，输出 128 个 token，关闭思考。我们把每个输出与第二次运行的输出逐 token 比较。这是 2026-10-22 和 2026-10-23 在我们 L4 节点的第二块 GPU 上用 `Qwen/Qwen3-0.6B` 进行的。那块 GPU 与其所有者共用，没有锁定时钟。

时钟会改变运行的速度，但不会改变 greedy 的 token。每个计数仍然只是一块 GPU 上的一次会话。

```listing
title: outputs that differ at one user, out of 32
source: capture/gpu/out-l4/greedy-output-cache-batch-dtype.txt
lang: text
note: The table for concurrency 1. The number in brackets is the median position of the first token that differs. The SGLang column comes from the same probe on SGLang 0.5.22.
---
comparison                     SGLang 0.6B   vLLM 0.6B
flushed repeat against fresh   0 of 32       0 of 32
cache off against cache off    0 of 32       0 of 32
fresh against warm cache       21 of 32 (45) 11 of 32 (57)
cache on against cache off     25 of 32 (26) 21 of 32 (48)
```

- **一个用户，相同的 cache 状态。** 重置 cache 后重复运行，或关闭 cache 重复运行，32 个 prompt 都给出了相同的文本。
- **一个用户，热 cache。** 相同的 prompt 在热 cache 下改变了 32 个输出中的 11 个。开启 cache 对比关闭 cache 改变了 32 个中的 21 个。
- **多个用户。** 同时发送 64 个用户时，两次关闭 cache 的运行在 64 个输出中有 50 个不同。仅 batch 本身就改变了大多数输出，所以在这个负载下无法分离出 cache 的影响。
- **dtype。** 我们在一个用户、关闭 cache 的情况下发送了 64 个问题。BF16 对比 FP16，Qwen3-0.6B 改变了 64 个输出中的 48 个，Qwen3-1.7B 改变了 64 个中的 56 个。第一个不同 token 的位置中位数分别是 51 和 56。相同 dtype 下的重复运行一个也没有改变。

所以在一个用户时，重置 cache 就足以精确地重复一个 greedy 输出。在有负载时，我们的运行中重置并不够。对于线上服务器，batch-invariant 模式是本页介绍的修复方法，而我们没有在那个负载下测试它。我们的计数来自小模型和一块 GPU，所以请测试你自己的模型。

## 了解 batch-invariant 模式覆盖不到什么 {#s-get-reproducible-outputs-know-what-the-batch-invariant-mode-does-not-cover}

在 0.31.0 中，这个模式处于 beta 阶段。其他团队的工作显示了三个局限。我们自己没有测量它们：

- **速度代价。** 在 2025 年 9 月的文章 "Defeating Nondeterminism in LLM Inference" 中，Thinking Machines Lab 在 vLLM 上运行了 1,000 个 Qwen3-8B 请求。默认情况下用时 26 s，使用 batch-invariant kernel 时用时 55 s，换用更好的 attention kernel 后为 42 s。2026 年的 CoRun 论文报告称，batch-invariant kernel 让延迟增加一倍以上，吞吐量最多下降 74%。
- **执行中的其他变化。** 2026 年的论文 "Vosti: Specifying, Implementing, and Verifying Deterministic LLM Inference" 测试了 prompt 分块和 KV cache 复用等变化。vLLM 的 batch-invariant 模式在其中一些变化下给出了不同的 logit。
- **某些模型路径。** 在 0.31.0 中，自己选择 attention 后端的模型会跳过对该模式的检查，所以它的输出仍可能依赖 batch。0.32.0 版本会检查每个 attention 层的后端。针对在 torch.compile 下使用数据、张量和专家并行的 MoE 模型的修复不在 0.32.0 中。

所以要测试你实际服务的配置：模型、并行布局、prefix cache 设置和 token 预算。

## 检查结果 {#s-get-reproducible-outputs-check-the-result}

把同一个评测运行两次，逐 token 比较输出，而不只是比较分数。在两次运行之间，重置 prefix cache 或重启服务器，如[基准测试页](#s-benchmark-your-server-in-15-minutes)所示。如果输出不同，把一个出问题的 prompt 单独发送两次。如果单独发送时两个回答一致，差异就是 batch 造成的。

## 了解在我们 L4 上的速度代价 {#s-get-reproducible-outputs-know-the-speed-cost-on-our-l4}

2026-10-23 我们在 L4 上测量了这个代价，时钟锁定在 900 MHz。运行顺序是默认、batch-invariant、再默认，每次两个 seed，每次运行前重置 cache。

```listing
title: the batch-invariant mode against the default, Qwen3-0.6B on vLLM 0.31.0
source: capture/gpu/out-l4/batch-invariant-cost.txt
lang: text
note: The Qwen3-0.6B rows, where every run had a median clock of 900 MHz. The setup lines before them and the Qwen3-8B rows after them are cut.
---
…
users   median TPOT default / batch-invariant   output tok/s default / batch-invariant
1       6.9 / 16.9 ms (2.4x)                    140.6 / 58.7 (58% lower)
8       9.9 / 18.2 ms (1.8x)                    755 / 420 (44% lower)
32      18.8 / 25.9 ms (1.4x)                   1,565 / 1,154 (26% lower)
…
```

在 `Qwen/Qwen3-8B` 上，8 个用户时每 token 时间长了 1.4 倍，输出 tok/s 低了 27%。32 个用户时分别长了 1.3 倍、低了 23%。8B 模型的 1 用户运行跑在锁定频率以下，所以我们没有列出。随着更多用户共享每一步，相对代价下降，而在小模型上代价更大。在为线上服务器开启该模式之前，先在你的模型上测量它。

```takeaways
- seed 不够，因为 batch 会改变求和的顺序。
- 离线时，在一个进程中用相同的 seed 和顺序运行引擎。
- 在线时，batch-invariant 模式是主要的修复方法，但它有速度代价，并且覆盖不到某些路径。
- 在要比较的两次运行之间重置 prefix cache。
- 在要比较的两次运行之间保持 dtype 相同。
```

Sources: vLLM documentation at v0.31.0 (docs/usage/reproducibility.md, docs/features/batch_invariance.md), the vLLM source at v0.31.0 (vllm/envs.py), Same Request, Different Answer: Quantization Amplifies Cache-Induced Divergence in LLM Serving (arXiv 2609.04748, 2026), Defeating Nondeterminism in LLM Inference by Horace He and Thinking Machines Lab (2025-09-10), CoRun: Padding is Simple and Efficient for Deterministic LLM Inference (arXiv 2608.14376, 2026), Vosti: Specifying, Implementing, and Verifying Deterministic LLM Inference (arXiv 2609.38981, 2026), the release notes for v0.32.0 (attention backend check for the batch-invariant mode), vLLM pull request 61118 (inductor batch-invariant mode, merged on 2026-10-17 and not in v0.32.0), capture/gpu/out-l4/livecheck-2026-10-22.txt, capture/gpu/out-l4/greedy-output-cache-batch-dtype.txt, capture/gpu/out-l4/batch-invariant-cost.txt.
