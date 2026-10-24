# 用 FP8 KV cache 容纳更多用户

> FP8 KV cache 能让可容纳的 token 数翻倍；在 L4 上，它还会在没有任何警告的情况下改变 attention 后端。

你的服务器因为 KV cache 已满而让请求排队。读完本节后，你能把 KV 池翻倍，并检查它在速度和准确率上的代价。

**我们的结果：** 在我们的 L4 上，第一次 FP8 启动失败了，换成 Triton 后端后得到修复。在池大小固定的情况下，单用户每 token 快了 2.3%。

## 打开它 {#s-fit-more-users-with-an-fp8-kv-cache-turn-it-on}

KV cache 为每一层、每个 head、每个 token 存两个值。默认情况下，vLLM 以模型的数据类型存储它们，`Qwen/Qwen3-8B` 是 BF16，每个值 2 字节。FP8 每个值只用 1 字节：

```bash
vllm serve Qwen/Qwen3-8B --kv-cache-dtype fp8
```

权重仍是 BF16，只有 KV cache 改变。

## 算出它带来的收益 {#s-fit-more-users-with-an-fp8-kv-cache-count-what-it-gives-you}

用[显存页](#s-count-the-memory-before-you-pick-a-gpu)里的公式，按每个值 1 字节计算。对于 `Qwen/Qwen3-8B`，一个 token 在 BF16 下需要 144 KiB，在 FP8 下需要 72 KiB。

```figure
id: fig-2-4
kind: chart
title: the KV tokens in one GiB
claim: For Qwen3-8B, one GiB of KV cache holds about 7,300 tokens in BF16 and about 14,600 tokens in FP8.
caption: The numbers come from the bytes per token, not from a run. From the model config of Qwen/Qwen3-8B.
```

同样的显存能容纳两倍的 token。所以在相同长度下能容纳两倍的用户，或者每个用户的上下文可以长一倍。

## 修复在 L4 上的启动 {#s-fit-more-users-with-an-fp8-kv-cache-fix-the-start-on-an-l4}

在我们的 L4 上，第一次用 `--kv-cache-dtype fp8` 启动失败了。原因在于 attention 后端：

1. 在 L4 上，vLLM 首先尝试 FlashAttention。
2. vLLM 0.31.0 中的 FlashAttention 只在 Hopper 和 Blackwell 数据中心 GPU 上读取 FP8 KV cache。L4 是 Ada GPU，SM 8.9。
3. vLLM 转向其列表中的下一个后端 FlashInfer。
4. FlashInfer 在第一次启动时构建它的 kernel。在我们的节点上，这次构建失败了。

```listing
title: the FlashInfer build error on our L4
source: capture/gpu/incidents/l4-vllm-kv-fp8-flashinfer-attention-jit.txt
lang: text
note: Our FP8 start on 2026-10-22. vLLM picked FlashInfer from two valid backends. The build of its FP8 prefill kernel failed, because the CUDA compiler and the CUDA headers came from different releases.
---
(EngineCore pid=814129) INFO 10-22 09:11:03 [cuda.py:526] Using FLASHINFER attention backend out of potential backends: ['FLASHINFER', 'TRITON_ATTN'].
(EngineCore pid=814129) ERROR 10-22 09:11:53 [core.py:1433] /data/vllm/.venv/lib/python3.12/site-packages/flashinfer/data/cccl/libcudacxx/include/cuda/std/__cccl/cuda_toolkit.h:41:8: error: #error "CUDA compiler and CUDA toolkit headers are incompatible, please check your include paths"
RuntimeError: Engine core initialization failed. See root cause above. Failed core proc(s): {}
```

FlashInfer sampler 在这个节点上也以同样的方式构建失败。所以我们的扫测工具用 `VLLM_USE_FLASHINFER_SAMPLER=0` 启动 vLLM。

选用 Triton 后端。它能读取 FP8 KV cache，而且不使用 FlashInfer 的构建。同时像我们的扫测工具那样关闭 FlashInfer sampler：

```bash
VLLM_USE_FLASHINFER_SAMPLER=0 vllm serve Qwen/Qwen3-8B --kv-cache-dtype fp8 --attention-backend TRITON_ATTN
```

[attention 后端页](#s-change-the-attention-backend-only-for-a-reason)说明了 vLLM 如何选择后端。

## 看我们的运行结果 {#s-fit-more-users-with-an-fp8-kv-cache-see-what-our-run-shows}

**我们在 2026-10-22 实测了**在我们的 L4 上用 `Qwen/Qwen3-8B` 时，使用 Triton 后端的 FP8 KV cache 与默认 BF16 的对比。两者都在[降频会话](#l4-sessions)中运行，分别为 1 个和 32 个用户。

两次运行中我们都把池固定在 24,096 token，作为[固定池](#s-count-the-memory-before-you-pick-a-gpu)。所以这次运行没有体现更大的池，只体现了速度的变化。

| 用户数，L4 降频会话 | TPOT 中位数，BF16 / FP8 | 输出 tok/s，BF16 / FP8 | SM 时钟中位数，BF16 / FP8 | 种子数，BF16 / FP8 |
|---|---|---|---|---|
| 1 | 104.1 / 101.8 ms | 10.59 / 10.75 | 210 / 210 MHz | 3 / 2 |
| 32 | 142.7 / 138.0 ms | 186.68 / 192.00 | 450 / 480 MHz | 3 / 2 |

单用户时，FP8 每 token 快了 2.3%，时钟相同，且各种子的范围没有重叠。32 个用户时，各种子的范围有重叠，而且 FP8 那次运行的时钟更高。所以我们不声称在 32 个用户时有提升。

有两样东西同时改变了：KV 数据类型和后端。表格无法说明提升来自哪一个。两次运行时 GPU 都处于降频状态，所以要看比值，而不是时间。

## 检查准确率 {#s-fit-more-users-with-an-fp8-kv-cache-check-the-accuracy}

2026-10-23，我们在 L4 上运行了前 500 道 GSM8K 题目，8-shot、贪心解码。Qwen3-8B 没有 KV scale，所以 FP8 KV 的运行使用的 scale 是 1.0。FP8 KV 的运行与上文一样使用 Triton 后端。

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

每个区间都与 BF16 的区间重叠，所以这次运行没有显示出差异。只有 500 道题，它无法排除几个百分点的损失。这只是一个模型和一个基准，所以请在你的模型和你的任务上做同样的检查。attention 结构不同的模型可能损失更多。

vLLM 博客 2026 年 4 月的文章“The State of FP8 KV-Cache and Attention Quantization in vLLM”测试了未校准的 FP8 KV cache，作者来自 AWS 和 Red Hat。在他们的测试中，大多数模型与 BF16 很接近，但也有例外。他们点名 Kimi-K2.5（使用 FlashMLA 后端）在未校准的 scale 下效果不好。这些结果我们没有亲自测量。

### 检查你的 scale 是否被加载 {#s-fit-more-users-with-an-fp8-kv-cache-check-that-your-scales-load}

带有校准 scale 的 checkpoint 并不总会用上它们。在 0.31.0 中，issue 54623 报告 Qwen3.5 模型系列从不加载它的 KV scale，issue 60333 报告某个 MTP draft 加载器也有同样的问题。两个 issue 都未关闭。

首先，在 checkpoint 中查找 scale。在 Hugging Face 缓存的权重索引里搜索以 `k_scale` 或 `v_scale` 结尾的 tensor 名。把模型文件夹名换成你的模型：

```bash
grep -oE '"[^"]*(k|v)_scale"' ~/.cache/huggingface/hub/models--Qwen--Qwen3-8B/snapshots/*/model.safetensors.index.json | head
```

没有输出说明这个 checkpoint 没有 scale。

只有一个权重文件的 checkpoint 没有索引。对于这种情况，用 `safetensors` Python 包列出 tensor 名。

然后读启动日志。警告 `Using KV cache scaling factor 1.0` 表示 vLLM 使用的 scale 是 1.0。如果 checkpoint 有 scale，而日志仍显示这条警告，说明加载器丢掉了它们。

最后，在上生产之前，用你自己的 prompt 分别在开启和关闭 FP8 时运行，并比较答案。

## 了解 0.31.0 之后的变化 {#s-fit-more-users-with-an-fp8-kv-cache-know-what-changed-after-0-31-0}

0.32.0 版本在 SM 8.x 和 SM 12.x GPU（包括 L4 和 GB10）上增加了 NVFP4 KV cache。它每 token 存储的字节比 FP8 更少。我们没有测试它。

```takeaways
- 改变 KV 数据类型后，读一下 attention 后端那一行。
- 如果 FlashInfer 构建失败，用 --attention-backend TRITON_ATTN 启动。
- 检查是否出现 scale 1.0 警告，并用你自己的 prompt 测试质量。
```

Sources: capture/gpu/summary/l4.json (load.vllm-fast-b, load.vllm-kv-fp8-triton), capture/gpu/incidents/l4-vllm-kv-fp8-flashinfer-attention-jit.txt, capture/gpu/incidents/l4-vllm-flashinfer-jit.txt, the vLLM source at v0.31.0 (vllm/platforms/cuda.py, vllm/v1/attention/backends/fa_utils.py, vllm/v1/attention/backends/triton_attn.py), vLLM documentation at v0.31.0 (docs/features/quantization/quantized_kvcache.md), the vLLM blog post The State of FP8 KV-Cache and Attention Quantization in vLLM (2026-04-22), vLLM issues 54623 and 60333, the release notes for v0.32.0 (NVFP4 KV cache), capture/gpu/out-l4/gsm8k-fp8-accuracy.txt.
