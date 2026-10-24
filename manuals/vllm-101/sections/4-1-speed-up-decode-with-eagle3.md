# 用 EAGLE3 加速 decode

> EAGLE3 在低并发时有收益，而且共享每一步的用户越多，值得用的 draft 深度就越小。

负载低时，你的用户在等长回答。读完本节后，你能按你的并发量选择 draft 深度。

**我们的结果：** 在我们锁频的 L4 上，用随机 prompt、128 token 输出时，深度 3 的 EAGLE3 在 32 个用户下给出了基线 1.6 倍的输出。

## 打开它 {#s-speed-up-decode-with-eagle3-turn-it-on}

EAGLE3 加入一个小的 draft 模型，它根据目标模型的隐藏状态猜测接下来的 token。目标模型在一次前向中检查这些猜测，[投机解码页](#s-how-speculative-decoding-checks-drafts)解释了这一点。目标模型只保留它自己也会写出的那些猜测。

你需要一个专门为你的目标模型训练过的 draft。对 `Qwen/Qwen3-8B`，我们用的是 `Tengyunw/qwen3_8b_eagle3`：

```bash
vllm serve Qwen/Qwen3-8B \
  --speculative-config '{"method": "eagle3", "model": "Tengyunw/qwen3_8b_eagle3", "num_speculative_tokens": 3}'
```

`num_speculative_tokens` 就是 draft 深度：draft 每一步猜测的 token 数。如果不设，vLLM 会从 draft 的配置里取值（如果配置里有的话）。请自己设置它，这样你知道实际跑的是什么。

EAGLE3 会保持异步调度开启。[异步调度页](#s-leave-async-scheduling-on)列出了会关闭它的方法。

## 理解深度为什么重要 {#s-speed-up-decode-with-eagle3-know-why-the-depth-matters}

更深的 draft 能让目标模型每次前向产出更多 token。但每个猜测在检查时也要花算力。只有一个用户时，GPU 每一步都有富余算力，额外的猜测几乎是免费的。用户多时，每一步本来就满了，猜错的 token 会挤占真实 token 的算力。

## 看我们的运行结果 {#s-speed-up-decode-with-eagle3-see-what-our-runs-show}

**我们测得** 2026-10-22 在我们的 L4 上用 `Qwen/Qwen3-8B`，对比了深度 1、3、5 的 EAGLE3 和不使用投机解码。这是[锁定在 900 MHz 的会话](#l4-sessions)，我们跑了 1 个和 32 个用户，各两个种子。prompt 来自基准测试工具的随机数据集，输入 512 token，输出 128 token。

```figure
id: fig-4-1
kind: chart
title: EAGLE3 output by draft depth
claim: With the clock locked, a draft depth of 3 gave the highest output at 32 users, and depths 3 and 5 tied at one user.
caption: Each bar is the median of two seeds. The run with no speculation at one user is left out, because its clock fell to 210 MHz. From capture/gpu/summary/l4.json.
```

| 用户数，L4 锁频会话 | 配置 | 中位 TPOT | 输出 tok/s | 中位 SM 时钟 |
|---|---|---|---|---|
| 32 | 无投机解码 | 119.9 ms | 208.8 | 881 MHz |
| 32 | 深度 1 | 100.4 ms | 271.1 | 900 MHz |
| 32 | 深度 3 | 77.8 ms | 333.6 | 900 MHz |
| 32 | 深度 5 | 83.7 ms | 289.5 | 885 MHz |
| 1 | 深度 1 | 39.4 ms | 22.4 | 900 MHz |
| 1 | 深度 3 | 27.8 ms | 31.3 | 900 MHz |
| 1 | 深度 5 | 26.2 ms | 31.7 | 900 MHz |

在 32 个用户时，深度 3 的输出是无投机解码的 1.6 倍。它的种子范围与其他任何配置都不重叠。深度 5 的输出比深度 3 少，所以额外的猜测得不偿失。

在一个用户时，与深度 1 相比，深度 3 把每 token 时间从 39.4 ms 降到 27.8 ms。深度 5 与深度 3 差不多，二者的种子范围重叠。

一个用户、无投机解码的那次运行降到了 210 MHz，低于锁定值。锁频设定的是最高时钟，它无法阻止 GPU 降频。所以在一个用户时，我们不拿 EAGLE3 和无投机解码比较。

我们没有从这些运行中收集接受数据，所以这里不给出接受长度。

中位 TPOT 下降了，但 token 组之间的间隔变大了。在 32 个用户时，中位 ITL 从无投机解码的 84 ms 升到深度 3 的 133 ms。现在每一步一次发出几个 token，所以流式输出以更大、更稀疏的组到达。

## 了解我们结果的局限 {#s-speed-up-decode-with-eagle3-know-the-limits-of-our-result}

我们的收益只适用于随机 prompt 和 128 token 的输出。其他团队发现，真实流量的收益可能更小。下面这些效应我们自己没有测量：

- NVIDIA 研究人员 2026 年的论文 "SPEED-Bench: A Unified and Diverse Benchmark for Speculative Decoding" 发现，合成 prompt 会高估真实 prompt 上的投机解码吞吐。它还发现最佳 draft 深度会随 batch size 变化。
- 2026 年的论文 "Test-Time Speculation" 研究了 EAGLE-3 和其他 draft 在长达约 20,000 token 的 MATH 回答上的表现。在这些回答中，接受长度从约 3.7 降到约 1.5。

所以短随机回答上的收益，并不能预测长聊天回答或推理轨迹上的收益。

## 读长回答上的接受长度 {#s-speed-up-decode-with-eagle3-read-the-acceptance-over-a-long-answer}

2026-10-23，我们测量了接受长度随回答中位置的变化。我们在 L4 节点的第二块 GPU 上用 `Qwen/Qwen3-8B-FP8` 加 EAGLE3 draft，3 个投机 token。8 个 prompt 各自在开启 thinking、贪心解码、一个用户的条件下运行，最多 4,096 token。

```listing
title: mean acceptance length by position in the answer
source: capture/gpu/out-l4/eagle3-acceptance-by-position.txt
lang: text
note: The range across prompts, with the number of prompts that reached each segment in brackets. The SGLang column comes from the same prompts on SGLang 0.5.22.
---
segment of the output   SGLang                 vLLM
0 to 256                2.05 to 2.64 (8)       2.14 to 2.51 (8)
256 to 512              1.95 to 2.64 (8)       2.09 to 2.55 (8)
512 to 1,024            2.11 to 2.77 (8)       2.12 to 2.79 (8)
1,024 to 2,048          2.09 to 2.47 (5)       1.72 to 2.66 (5)
2,048 to 4,096          2.33 and 2.48 (2)      2.35 and 2.60 (2)
```

在 4,096 token 以内，接受长度没有持续下降。两个引擎上它都保持在每步约 2.1 到 2.8 个 token。8 个 prompt 中只有 2 个超过了 2,048 token，所以最后一段只基于两个回答。这块 GPU 是共享的，没有锁频，这会改变速度，但不改变接受长度。4,096 token 的上限来自我们在这块 GPU 上能用的内存。所以我们没有达到那篇论文的长度范围。

2026-10-23 的第二次测试在节点的第一块 GPU 上用 BF16 的 `Qwen/Qwen3-8B`。它跑了 8 个用户，回答最长 2,048 token，不用 ignore-eos。回答长度中位数是 1,800 到 2,000 token。vLLM 根据每次运行前后的计数器给出了接受情况：

```listing
title: EAGLE3 acceptance on answers of about 2,000 tokens, 8 users
source: capture/gpu/out-l4/eagle3-long-outputs.txt
lang: text
note: The table of the file. The comparison with short outputs is cut.
---
engine          dataset    mean acceptance length   accepted per draft position 1 / 2 / 3
SGLang EAGLE3   GSM8K      2.68
SGLang EAGLE3   ShareGPT   2.32
vLLM EAGLE3     GSM8K      2.69                     0.77 / 0.54 / 0.38
vLLM EAGLE3     ShareGPT   2.35                     0.67 / 0.42 / 0.26
```

在 GSM8K 上，第一个 draft token 有 77% 的时间被接受，在 ShareGPT 上是 67%，之后每个位置都更低。在同一会话的 128 token 短回答上，SGLang 在 GSM8K 上是 2.69 到 2.78，在 ShareGPT 上是 2.33 到 2.43。它的长回答与这些范围相差不超过 0.01。这个会话里我们没有 vLLM 的短回答接受数据，所以 vLLM 那两行只显示长回答上的水平。

在相信一个收益之前，先读你自己长回答上的接受情况。本页末尾的指标可以给出它。

## 比较之前先锁频 {#s-speed-up-decode-with-eagle3-lock-the-clock-before-you-compare}

我们最初的 EAGLE3 运行没有锁频。在一个用户时，无投机解码的运行跑在 210 MHz，而 EAGLE3 的运行在约 1,400 MHz。这么大的差距会掩盖投机解码的效果，所以我们把这些运行放在一边。

在比较投机解码和无投机解码之前，先锁定时钟，或为每次运行记录时钟。只在相同时钟下比较两次运行。锁频需要 root：

```bash
sudo nvidia-smi -lgc 900,900
sudo nvidia-smi -rgc
```

第一条命令把 SM 时钟锁在 900 MHz，第二条在运行结束后解除锁定。

## 选择深度 {#s-speed-up-decode-with-eagle3-choose-the-depth}

- 对于用这个 draft 的 Qwen3-8B，从深度 3 开始。在我们的 L4 上，它在 32 个用户时输出最好，在一个用户时并列最好。
- 对于繁忙的服务器，在你自己的模型上扫描深度。在我们的 L4 上，深度 5 在 32 个用户时损失了输出。
- 如果你的负载在一天中变化很大，vLLM 可以用 `num_speculative_tokens_per_batch_size` 按 batch size 设定深度。我们没有测试它。

## 在你的 prompt 上检查收益 {#s-speed-up-decode-with-eagle3-check-the-gain-on-your-prompts}

用你自己的一部分流量，分别在有和没有这个配置时运行。保留真实的输出长度，不要用 `--ignore-eos`。比较这些数字：

1. 接受率，来自下面的两个计数器。
2. 中位 TPOT 和输出吞吐。
3. P99 ITL 和 P99 TTFT，因为中位数上的收益可能掩盖尾部的损失。
4. 如果你的回答长达数千 token，单独看最长那些回答的接受率。

从 `/metrics` 读这两个计数器：

```bash
curl -s http://localhost:8000/metrics | grep -E "spec_decode_num_(draft|accepted)_tokens"
```

用被接受的 token 数除以 draft token 数。vLLM 还会在日志里写一行 `SpecDecoding metrics`，其中有平均接受长度。

```takeaways
- 使用为你的目标模型训练的 draft，并从深度 3 开始。
- 在你自己的流量上测量接受率和 P99 延迟。
- 在比较投机解码之前，锁定或记录 GPU 时钟。
```

Sources: capture/gpu/summary/l4.json (load.vllm-lock-b, load.vllm-lock-eagle3-k1, load.vllm-lock-eagle3-k3, load.vllm-lock-eagle3-k5, and the unlocked load.vllm-eagle3 and load.vllm-eagle3-k5), the vLLM source at v0.31.0 (vllm/config/speculative.py, vllm/v1/spec_decode/metrics.py), vLLM documentation at v0.31.0 (docs/features/speculative_decoding/eagle.md, docs/features/speculative_decoding/dynamic_speculative_decoding.md), SPEED-Bench: A Unified and Diverse Benchmark for Speculative Decoding (arXiv 2604.09557, 2026), Test-Time Speculation (arXiv 2605.09329, 2026), capture/gpu/out-l4/eagle3-acceptance-by-position.txt, capture/gpu/out-l4/eagle3-long-outputs.txt.
