# 用 FP8 权重放下更大的模型

> FP8 权重能为 KV cache 腾出显存，速度如何变化则取决于你的 GPU 支持什么。

你的模型放得下，但 KV 池很小。读完本节后，你能在相同的显存预算下，在 BF16 和 FP8 checkpoint 之间做出选择。

**我们的结果：** 在锁定时钟的 L4 上，32 个用户时，相同的池下 FP8 checkpoint 的输出比 BF16 多 36%。

## 选择 checkpoint {#s-fit-a-bigger-model-with-fp8-weights-pick-a-checkpoint}

FP8 checkpoint 把大多数权重存为 1 字节而不是 2 字节。很多模型厂商会在 BF16 模型旁边发布一个 FP8 版本。`Qwen/Qwen3-8B` 的 FP8 checkpoint 是 `Qwen/Qwen3-8B-FP8`，你可以像服务其他模型一样服务它：

```bash
vllm serve Qwen/Qwen3-8B-FP8
```

vLLM 从 checkpoint 配置中读取量化方式，所以你不需要设置额外的参数。如果没有 FP8 checkpoint，vLLM 可以在加载 BF16 模型时用 `--quantization fp8_per_tensor` 对它进行量化。这条路径我们没有测试。

## 了解你的 GPU 运行的是什么 {#s-fit-a-bigger-model-with-fp8-weights-know-what-your-gpu-runs}

L4 是 Ada GPU，SM 8.9，支持 FP8 运算。所以 vLLM 以 FP8 运行模型的矩阵运算，除了空闲显存增加，速度也可能提升。

Ada 之前的 GPU，例如 A100，不支持 FP8 运算。在这些 GPU 上，vLLM 把权重保持为 FP8，并运行只量化权重的 kernel。你仍能节省显存，但速度提升预计会更小。我们没有测试这类 GPU。

## 算出它腾出的显存 {#s-fit-a-bigger-model-with-fp8-weights-count-the-memory-it-frees}

在 FP8 下，权重占用的显存接近减半。vLLM 把腾出的显存交给 KV 池。对于 `Qwen/Qwen3-8B`，每 GiB KV 池在 BF16 下约容纳 7,300 个 token，如 [FP8 KV cache 页](#s-fit-more-users-with-an-fp8-kv-cache)所示。

在我们的运行中，我们把池固定在 24,096 token，作为[固定池](#s-count-the-memory-before-you-pick-a-gpu)，好让两次运行有相同的空间。所以我们没有测量更大的池。空间上的收益来自字节数，而不是来自运行。

## 看我们的运行结果 {#s-fit-a-bigger-model-with-fp8-weights-see-what-our-runs-show}

**我们在 2026-10-22 实测了**在我们的 L4 上 `Qwen/Qwen3-8B-FP8` 与 `Qwen/Qwen3-8B` 的对比，运行在[锁定在 900 MHz 的会话](#l4-sessions)中。我们分别运行了 1 个和 32 个用户，各用两个种子。

```figure
id: fig-2-5
kind: chart
title: FP8 weights against BF16 at 32 users
claim: With the clock locked and the same KV pool, FP8 weights gave 284.7 against 208.8 output tokens per second at 32 users.
caption: Each bar is the median of two seeds. The BF16 run had a median clock of 881 MHz and the FP8 run 900 MHz. From capture/gpu/summary/l4.json.
```

| 用户数，L4 锁频会话 | TPOT 中位数，BF16 / FP8 | 输出 tok/s，BF16 / FP8 | SM 时钟中位数，BF16 / FP8 |
|---|---|---|---|
| 32 | 119.9 / 83.8 ms | 208.8 / 284.7 | 881 / 900 MHz |
| 1 | 未比较 / 35.3 ms | 未比较 / 25.4 | 210 / 900 MHz |

32 个用户时，FP8 的输出多 36%，每 token 时间减少 30%。两个数字的种子范围都没有重叠。BF16 的时钟低约 2%，远小于这个差距。

单用户时，BF16 那次运行因 GPU 降频而跌到 210 MHz，低于锁定值。所以我们不比较单用户时的两者。

## 使用 4-bit 或 8-bit 整数 checkpoint {#s-fit-a-bigger-model-with-fp8-weights-use-a-4-bit-or-8-bit-integer-checkpoint}

FP8 让权重减半。4-bit checkpoint 把大多数权重存为约半个字节，所以参数量翻倍的模型也可能放得下。在 L4 这类 24 GB 的 GPU 上，4-bit checkpoint 是服务 14B 模型的常见方式。

vLLM 0.31.0 从 checkpoint 配置中读取这些格式，所以对已发布的 checkpoint 不需要设置参数：

| 格式 | 存储内容 | 0.31.0 下的说明 |
|---|---|---|
| AWQ 和 GPTQ | 4-bit 权重，16-bit 运算 | 从 Turing GPU 起可运行，在 Ampere、Ada 和 Hopper 上使用快速的 Marlin kernel |
| compressed-tensors W4A16 或 W8A8 | 4-bit 或 8-bit 权重，用 LLM Compressor 库制作 | vLLM 项目建议用这个库制作你自己的 checkpoint |
| bitsandbytes | 4-bit 权重，在服务器加载模型时生成 | 需要单独的 `vllm-bnb-plugin` 包，然后对未量化的模型设置 `--quantization bitsandbytes` |
| GGUF | llama.cpp 的文件格式 | 需要单独的 `vllm-gguf-plugin` 包，vLLM 文档称其为实验性功能 |

例如，Qwen 发布了 Qwen3-14B 的 4-bit AWQ checkpoint：

```bash
vllm serve Qwen/Qwen3-14B-AWQ --max-model-len 8192
```

我们在一块 L4 上启动过一次这个 AWQ checkpoint，没有加 `--quantization` 参数。日志显示 `quantization=auto_awq` 和 Marlin kernel。权重占 9.44 GiB，池容纳 36,272 个 token。我们没有测量它的速度和准确率。

2026-10-23，我们还在 L4 节点上共享的第二块 GPU 上启动了另外两种格式。那块 GPU 处于降频状态，所以我们不给出速度。

- **bitsandbytes。** 没有插件时，`--quantization bitsandbytes` 会在启动时以 `Unknown quantization method: bitsandbytes` 停止。先安装插件：`uv pip install vllm-bnb-plugin`，pip 方式则是 `pip install vllm-bnb-plugin`。装上插件后，`Qwen/Qwen3-1.7B` 加载后占 1.33 GiB，而 BF16 下占 3.22 GiB，即 41%。池从 92,960 增长到 108,512 个 token。
- **GGUF。** 安装插件后，`vllm serve unsloth/Qwen3-0.6B-GGUF:Q4_K_M --tokenizer Qwen/Qwen3-0.6B` 加载了 0.55 GiB 的权重，一个 chat 请求返回了 HTTP 200。

这个 41% 只针对一个小模型。它包含 embedding 和输出层，这两部分保持 16-bit，所以在更大的模型上比例可能不同。我们没有测量这两种格式的准确率。

4-bit 模型可能比 FP8 模型损失更多准确率，损失多少取决于模型和方法。请在你自己的 prompt 上测试这两种格式。

## 检查准确率 {#s-fit-a-bigger-model-with-fp8-weights-check-the-accuracy}

2026-10-23，我们在 L4 上运行了前 500 道 GSM8K 题目，8-shot、贪心解码，对比 `Qwen/Qwen3-8B` 与 `Qwen/Qwen3-8B-FP8`：

```listing
title: GSM8K accuracy, 500 questions, 8-shot, Qwen3-8B on vLLM 0.31.0
source: capture/gpu/out-l4/gsm8k-fp8-accuracy.txt
lang: text
note: The vLLM rows. The SGLang rows of the same file are cut.
---
engine   config                     correct   accuracy   Wilson 95% interval
…
vLLM     BF16                       459/500   91.8%      89.1 to 93.9
vLLM     FP8 weights                453/500   90.6%      87.7 to 92.9
vLLM     FP8 KV cache               454/500   90.8%      87.9 to 93.0
vLLM     FP8 weights + FP8 KV       453/500   90.6%      87.7 to 92.9
```

FP8 权重的得分低 1.2 个百分点，两个区间有重叠。所以这次运行没有显示出差异，也无法排除几个百分点的损失。这只是一个模型和一个基准。在上生产之前，用你自己的 prompt 在两个 checkpoint 上运行并比较答案。我们没有对 4-bit 格式做这项检查。

```takeaways
- 服务已发布的 FP8 checkpoint，不需要设置额外参数。
- 模型在 FP8 下放不下时，使用 4-bit checkpoint。
- 上生产之前，用你自己的 prompt 检查输出质量。
```

Sources: capture/gpu/summary/l4.json (load.vllm-lock-b, load.vllm-lock-fp8), the vLLM source at v0.31.0 (vllm/model_executor/layers/quantization/fp8.py), vLLM documentation at v0.31.0 (docs/features/quantization/online.md, docs/features/quantization/README.md, docs/features/quantization/auto_awq.md, docs/features/quantization/gptqmodel.md, docs/features/quantization/bnb.md, docs/features/quantization/gguf.md, docs/features/quantization/llm_compressor/), capture/gpu/out-l4/livecheck-2026-10-22.txt, capture/gpu/out-l4/livecheck-2026-10-23.txt, vLLM documentation at v0.31.0 (docs/features/quantization/bnb.md), capture/gpu/out-l4/gsm8k-fp8-accuracy.txt.
