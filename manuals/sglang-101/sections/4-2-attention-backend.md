# --attention-backend

> SGLang 有很多 attention 内核，因为没有一个在每块 GPU 和每个模型上都赢，它的默认选择记下了别人已经付过的回退。

2026 年 1 月，一位用户升级了 FlashInfer，并在 H20 GPU 上服务 Qwen3-235B。中位逐 token 延迟从 39.44 ms 变成 283.52 ms，慢了七倍，设置里别的什么都没变。同一次运行里 FA3 内核给了 56.73 ms。那份报告是 issue #17411，v0.5.22 里选你 attention 后端的代码仍引用它。

读完本节后，你能点名 SGLang 为你的 GPU 和模型选的后端，并解释原因。你也能把 prefill 和 decode 分到两个后端，并决定何时覆盖默认。

## 什么是 attention 后端 {#s-attention-backend-what-an-attention-backend-is}

**Attention backend：** 为一批请求在分页 KV cache 上算 attention 的类。每个后端实现同一接口。它建每批的元数据，例如页表和索引缓冲。它为 CUDA graph 捕获和回放准备状态。它为 prefill 跑 `forward_extend`，为 decode 跑 `forward_decode`。

模型代码从不按名字调用内核。每个 attention 层调用模型运行器在启动时装上的那个后端。所以一个旗标换掉每个模型每一层的内核。

在 v0.5.22，该旗标接受 25 个名字。两个是别名（`nsa` 对 `dsa`，`compressed` 对 `dsv4`），所以有 23 个后端。

| 后端 | 用途 |
|---|---|
| `flashinfer` | 分页 MHA 与 MLA。支持 speculative topk 大于 1 以及 page size 大于 1。通用默认。 |
| `fa3` | 面向 Hopper 的 FlashAttention 3。Hopper 默认。 |
| `fa4` | FlashAttention 4，面向 Blackwell。模型的 K 与 V head 宽度不同时选用。 |
| `trtllm_mha`, `trtllm_mla` | 经 FlashInfer 的 TensorRT-LLM 内核，面向 Blackwell SM100 与 SM103。 |
| `flashmla`, `cutedsl_mla`, `tokenspeed_mla` | 面向 DeepSeek 这类 MLA 模型的 decode 内核。 |
| `dsa`, `dsv4`, `qsa`, `minicpm_*` | 各自面向一个模型族的稀疏注意力。 |
| `triton` | 可移植的 Triton 内核。FlashInfer 跑不了该模型时的默认。 |
| `torch_native`, `flex_attention` | PyTorch 参考路径。`torch_native` 是 Apple MPS 与 ARM64 CPU 上的默认。 |
| `aiter`, `wave` | AMD ROCm 内核。`aiter` 是 AMD 上 MHA 的默认。 |
| `intel_amx`, `intel_xpu`, `ascend`, `hpc_ops` | 带 AMX 的 x86 CPU、Intel GPU、华为 NPU，以及面向 SM90 的腾讯内核。 |
| `llada2_cfg_flashinfer` | 扩散语言模型变体。 |

## 显而易见的修法，以及它为何失败 {#s-attention-backend-the-obvious-fix-and-why-it-fails}

显而易见的修法是读一份基准，找最快的内核，并在每台服务器上传它。那会失败，因为每个后端都有基准展示不出的限制。

`trtllm_mha` 拒绝 topk 大于 1 的 speculative decoding，也不在 SM120 上跑。FlashInfer 跑不了用 attention sinks 的模型。`fa4` 的原生页大小是 128。有些后端接受 FP8 KV cache，有些不接受。在一个模型和 GPU 上赢的内核，可能在下一个上拒绝启动。

## SGLang 如何选默认 {#s-attention-backend-how-sglang-picks-a-default}

你不传 `--attention-backend` 时，启动调用一个函数，读你的 GPU、模型的 attention 类型，以及你的 speculative decoding 设置。

```figure
id: fig-4-3
kind: decision
title: the default attention backend at v0.5.22
claim: SGLang picks the attention backend from the GPU generation and the attention type of the model, and each branch records a measured limit.
caption: Read top to bottom. MHA models follow the left path and MLA models the right. Hopper means CUDA 12.3 or later. From get_default_attn_backend at v0.5.22.
```

对 MHA 模型，例如 Llama 和 Qwen，顺序是这样：

1. 在带 CUDA 12.3 或更新的 Hopper 上，且没有大于 1 的 speculative topk 时，默认是 `fa3`。代码注释引用 issue #17411。
2. 在 Blackwell SM100 或 SM103 上，默认是 `trtllm_mha`，或在 K 和 V 宽度不同时是 `fa4`。
3. 在 AMD 上默认是 `aiter`，在 Apple MPS 上是 `torch_native`。
4. 其他每种情况，已安装且模型没有 attention sinks 时默认是 `flashinfer`，否则是 `triton`。

对 MLA 模型，例如 DeepSeek V3，Hopper 得到 `fa3`，Blackwell 得到 `flashinfer`。每个 rank 有 16 或 128 个 KV head 时，AMD 得到 `aiter`。然后一个模型覆盖把 SM100 上的 DeepSeek V3 挪到 `trtllm_mla`。

同一函数的文档字符串说页大小大于 1 时避开 FA3。代码并不检查页大小。注释和代码不一致时，跑的是代码。

## 一台服务器里的两个后端 {#s-attention-backend-two-backends-in-one-server}

Prefill 和 decode 压的东西不同。Prefill 读长的 query 块，decode 用一个 query 对上长缓存。`--prefill-attention-backend` 和 `--decode-attention-backend` 分别设置每个阶段。它们不同时，SGLang 把两者包进一个按 `ForwardMode` 分发的混合后端。有 speculative decoding 时，`--speculative-attention-mode` 决定两者里谁跑 verify 遍。默认是 `prefill`。

## 文档和代码不一致 {#s-attention-backend-docs-and-code-disagree}

v0.5.22 文档里的 attention 后端页仍列出 Cutlass MLA 和 Dual Chunk FlashAttention。PR #32114 在 2026-09-10 删掉了两者，两个名字在该标签上都不是合法选择。同一页说 Blackwell MHA 用 `trtllm_mha`。代码对非对称 K 和 V 宽度的模型选 `fa4`。两种情况都是代码说了算，本手册跟代码走。

## 要量什么 {#s-attention-backend-what-to-measure}

在基准任何东西之前，先在启动日志里读解析后的后端。然后改一个旗标，在你真实并发下重跑同一基准，并对比 p50 和 p99 的逐 token 延迟。Attention 只是一步 decode 的一部分，所以更快的内核对端到端数字的推动，可能小于它自己的基准所暗示的。

在我们的 Mac 捕获上，SGLang 经 MLX 运行时跑。服务器参数解析成 `torch_native`，但 MLX 跑自己的 attention 路径，所以这些后端在那里一个都没跑。

## 我们在 L4 上测到的 {#s-attention-backend-what-we-measured-on-an-l4}

我们在一块 L4 上用 `Qwen/Qwen3-8B` 跑了 [第 5.1 节](#s-sglang-benchmark-serving) 的负载扫描，每个点三个种子。默认服务器把后端解析成 `flashinfer`，跑在 2026-10-16。第二台服务器设 `--attention-backend triton`，跑在 2026-10-18。两者都有同一份 24,094 token 的 pool，并回放最多 48 条正在跑请求的 decode graphs。每次运行的中位 SM 时钟都是 1,000 MHz 或更高。

```listing
title: the Triton server under load
source: capture/gpu/out-l4/server-load-triton.log
lang: text
note: The pool at startup, and one decode line at 33 running requests.
---
[2026-10-18 14:28:40] KV Cache is allocated. dtype: torch.bfloat16, #tokens: 24094, K size: 1.65 GB, V size: 1.65 GB
[2026-10-18 16:11:42] Decode batch, #running-req: 33, #token: 20422, token usage: 0.85, cuda graph: True, gen throughput (token/s): 311.50, #queue-req: 0
```

| 并发 | 输出 tok/s，flashinfer / triton | 中位 TPOT，flashinfer / triton | 中位 TTFT，flashinfer / triton |
|---|---|---|---|
| 1 | 13.42 / 13.94 | 60.16 / 59.98 ms | 189 / 183 ms |
| 8 | 112.62 / 112.90 | 66.01 / 65.83 ms | 170 / 187 ms |
| 32 | 270.11 / 270.91 | 96.18 / 96.99 ms | 2,970 / 2,833 ms |
| 64 | 250.85 / 257.29 | 107.42 / 107.76 ms | 18,349 / 18,260 ms |

**我们测到** 吞吐和每 token 时间打平。吞吐在 4% 以内，中位每 token 时间在每个并发下都在 1 ms 以内。中位 TTFT 差到 9%，两个方向都有，在 2、16 和 32 用户处超出种子散布。两台服务器隔两天跑。我们的读法：在上下文不到 1,000 token 的稠密 8B 模型上，attention 内核是每一步的一小部分。权重读取定了节奏。

## 我们的立场 {#s-attention-backend-our-position}

除非你有自己流量上的基准，否则不要设 `--attention-backend`。默认编码了其他用户发现的回退，例如 #17411，以及模型覆盖，例如 SM100 上的 DeepSeek V3。同一 issue 也是例外：能量的用户可以打败被库升级打断的默认。先量，再覆盖，并把理由写在旗标旁边。

宁可要支持你需要的每个功能的后端，也不要赢微基准的那个。页大小大于 1 时，topk 大于 1 的 speculative decoding 需要 `flashinfer`、`fa3` 或 `triton`。

## 事故 {#s-attention-backend-incidents}

**一次库升级让 Hopper 慢了七倍。** Issue #17411（2026-01-20）：FlashInfer 0.6.1 让 Hopper attention 内核回退。H20 上中位逐 token 延迟从 39.44 ms 变成 283.52 ms。两天后 SGLang 把 `fa3` 做成 Hopper MHA 默认。

**另一个引擎丢了它的 graphs。** Varad More 的现场报告 {{field Varad More 2026-04}} 在一块 A10G 上量到 Gemma 3 4B：SGLang 149 tok/s，vLLM 84 tok/s。原因在 attention 速度之外。vLLM 因交错的 sliding-window attention，用 `--enforce-eager`、不带 CUDA graphs 跑那个模型。只有两边服务器都回放 graphs 时，后端对比才公平。

```takeaways
- 每次基准之前，在启动日志里读解析后的 attention 后端。
- 在你流量上的基准给出更好选择之前，不要设 --attention-backend。
- 选后端之前检查功能限制，例如 speculative topk 和页大小。
- 钉住你的内核库版本，每次升级后重跑延迟测试。
```

Sources: python/sglang/srt/arg_groups/model_override_base.py (get_default_attn_backend), arg_groups/choices.py (ATTENTION_BACKEND_CHOICES), layers/attention/base_attn_backend.py, layers/attention/attention_registry.py, model_executor/model_runner_components/attention_backend_setup.py, arg_groups/fields/spec.py, and docs/docs/advanced_features/attention_backend.mdx at v0.5.22; PR #32114; issue #17411; field report by Varad More (2026-04-22); capture/gpu/out-l4/server-load-triton.log, capture/gpu/summary/l4.json (load.default, load.triton).
