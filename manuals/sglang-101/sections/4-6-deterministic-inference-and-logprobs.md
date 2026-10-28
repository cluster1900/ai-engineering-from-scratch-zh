# --enable-deterministic-inference 与 logprobs

> 同一条 prompt 在周围的批变了时可以给出不同的 token，SGLang 为它测过的每个模型和后端固定归约顺序。

你在温度 0 下把评估跑两遍，分数却不同。你单独发一条 prompt，再放进忙碌的批里发，第二个答案在四十个 token 之后分叉。你的请求里什么都没变。服务器改了你的请求跑在哪一批，批改了算术。

读完本节后，你能解释为什么批处理改变输出，以及确定性模式切换了什么。你也能读 SGLang 返回的 logprobs，并测试你的模型是否确定。

## 代价：加法顺序取决于批 {#s-deterministic-inference-and-logprobs-the-cost-addition-order-depends-on-the-batch}

浮点加法不结合。同一组数用不同顺序求和，可以改结果的最后几位。矩阵乘、softmax 或 norm 把求和拆成块，很多内核从批大小选块切分。批大小 1 里的一条请求，和批大小 37 里的同一条请求，走不同的切分。

最后一位的差别可以改哪个 token 有最高 logit。一个不同的 token 之后，后面每个 token 都以不同的文本为条件。Thinking Machines 在 2025 年关于推理非确定性的帖子里描述了这个效应 {{field Thinking Machines 2025-09}}，SGLang 的确定性模式建在同一思路上。

**Batch invariance：** 一种内核属性。一行的结果不依赖批里其他行，因为归约顺序是固定的。

## 旗标切换什么 {#s-deterministic-inference-and-logprobs-what-the-flag-switches}

`--enable-deterministic-inference` 默认关。`--rl-on-policy-target fsdp` 也会打开它。打开时，启动做这些事：

1. 它用批不变内核替换 PyTorch 算子 `aten::mm`、`addmm`、`_log_softmax`、`mean.dim`、`rms_norm` 和 `bmm`。
2. 它强制 `pytorch` 采样后端。
3. 在 CUDA 上有张量并行时，它设 `NCCL_ALGO=allreduce:tree`，好让 all-reduce 按固定顺序求和。在 AMD 上它用一级 all-reduce。
4. 它只接受 attention 后端 `ascend`、`fa3`、`fa4`、`flashinfer`、`intel_xpu` 和 `triton`。
5. 除非 attention 后端是 `ascend`、`fa3`、`fa4` 或 `triton`，否则关掉 radix cache。
6. 它给每条没有 `sampling_seed` 的请求种子 42。

```figure
id: fig-4-9
kind: comparison
title: one row reduced in two batches
claim: A default kernel splits the same row differently in two batches, and a batch-invariant kernel uses one split for every batch.
caption: Read each column top to bottom. The row is one request, and the tiles are partial sums. From the batch-invariant operator overrides at v0.5.22.
```

第五点对服务器最要紧。用 `flashinfer` 时，确定性模式关掉前缀缓存。每个重复前缀再付一整次 prefill。[第 3.3 节](#s-radixcache) 解释那个缓存省了什么。

## Logprobs 按温度缩放 {#s-deterministic-inference-and-logprobs-logprobs-are-temperature-scaled}

**Logprob：** 服务器采样自的分布下，一个 token 的对数概率。请求设了 `return_logprob` 或 OpenAI 的 `logprobs` 字段时，SGLang 返回它。

当批不是全 greedy 时，采样器用 `log_softmax(logits / temperature)` 算返回的 logprobs。只有全 greedy 批，或设了环境变量 `SGLANG_RETURN_ORIGINAL_LOGPROB` 时，才返回不带温度的 `log_softmax(logits)`。温度为 0.7 的请求得到锐化分布的 logprobs。

在我们的测试里，top-p 没有改返回值。测试在温度 1、top-p 0.9 下用 `return_logprob`。我们在 2026-10-23 在 L4 节点第二块 GPU 上跑，`Qwen/Qwen3-0.6B` 用 BF16。我们发了 16 条各 48 token 的 prompt。我们把每个返回的 logprob 与 float32 Transformers 对整词表的一遍比较。

```listing
title: returned logprob minus the full-vocabulary reference
source: capture/gpu/out-l4/logprobs-top-p.txt
lang: text
note: The two SGLang rows. The vLLM rows are cut. ORIGINAL_LOGPROB is short for SGLANG_RETURN_ORIGINAL_LOGPROB.
---
engine and mode                                  returned minus reference, median   median absolute
…
SGLang return_logprob, ORIGINAL_LOGPROB=0        0.0000                             0.0066
SGLang return_logprob, ORIGINAL_LOGPROB=1        0.0000                             0.0066
```

环境变量是 0 或 1 时，SGLang 都返回 top-p 之前的 logprob。在温度 1 时两个设置算出同一个值。在同一批 prompt 上，top-p 之后的 logprob 高了减去保留质量的对数，中位大约 0.053。所以在保留 token 上再归一化的训练器，不能直接和这个值比。GPU 是共享的、没有锁时钟，那不改这些值。

在温度不是 1 时，缩放后的值对采样是对的。它会让任何拿那些数字和温度 1 的模型运行比较的人吃惊。从原始 logits 算 logprobs 的强化学习训练器，在每个 token 上都看到不匹配，不匹配看起来像数值 bug。[第 7.2 节](#s-sglang-as-an-rl-rollout-engine) 展示那对训练为什么要紧。

## 在 Apple silicon 上 {#s-deterministic-inference-and-logprobs-on-apple-silicon}

我们的捕获跑在 MLX 运行时上，MLX 对采样的处理不同。`--mlx-enable-sampling` 的帮助文本说明了变化。

```listing
title: the MLX sampling flag in sglang serve --help
source: capture/out/serve-help.txt
lang: text
note: Cut from the flag list. Three lines about the overlap scheduler are cut.
---
  --mlx-enable-sampling
                        MLX backend only: sample decode tokens (temperature /
                        top-k / top-p / min-p) instead of greedy argmax.
…
                        exact argmax behavior. Also enables on the MLX path:
                        grammar vocab masks and custom logit processors (these
                        break decode chaining per step; custom processors run
                        on pure-decode steps only), logit_bias, output
                        logprobs (sampled token / top-k / token_ids; prompt
                        input logprobs are not computed), NaN sanitization
                        (SGLANG_SANITIZE_NAN_LOGITS), and per-request
                        sampling_seed under --enable-deterministic-inference
                        (deterministic within MLX only). Penalties are not
                        applied.
```

没有那个旗标，MLX 上每一步 decode 都取最高 logit 的 token，不管请求要什么温度。语法掩码和输出 logprobs 也需要那个旗标，惩罚在 MLX 上从不应用。我们的 capture kit 发温度 0，所以结果不依赖这个旗标。

## 要量什么 {#s-deterministic-inference-and-logprobs-what-to-measure}

SGLang 带一个测试：把一条 prompt 放进随机批大小里发，并数不同的输出。它有三种模式：`single`、共享前缀的 `prefix`，以及缓存对未缓存 prefill 的 `radix_cache`。

```bash
python3 -m sglang.test.test_deterministic --n-trials 50 --test-mode single
python3 -m sglang.test.test_deterministic --n-start 1 --n-trials 50 --test-mode prefix
```

对你的模型、你的 attention 后端和你的并行布局跑它。每条 prompt 一个不同输出是通过条件。然后有旗标和没有旗标都量吞吐，因为批不变内核让出一些速度。

## 我们在 GB10 上测到的 {#s-deterministic-inference-and-logprobs-what-we-measured-on-a-gb10}

我们的探测在温度 0 下发一条要 128 个新 token 的 prompt。它单独发五次，再放进一批 16、带另外 15 条 prompt 里发五次。我们在一块 NVIDIA GB10 上对 `Qwen/Qwen3-30B-A3B-Instruct-2507` 跑，先对默认服务器，再带 `--enable-deterministic-inference`。

**我们测到** 默认服务器给出两个不同答案。单独的第一条和全部五条成批的请求写了同一段文本。后面四条单独的请求写了另一段文本，在 238 个字符之后离开第一条。那些运行之间请求里什么都没变。

我们的读法是，第一条请求从零算它的 prompt。后面四条在 radix cache 里找到了那个 prompt，跑了不同的 prefill 路径。上面测试的 `radix_cache` 模式检查那种情形。

开着旗标时，全部十条请求写了同一段文本。启动日志展示了上面列表里的那些切换：

```listing
title: what deterministic mode switched on the GB10
source: capture/gpu/out-gb10/server-deterministic.log
lang: text
note: Three lines from the startup log. Timestamps and the end of the second line are cut.
---
… Sampling backend is set to pytorch for deterministic inference.
… Attention backend not specified. Falling back to 'flashinfer' for deterministic inference. You can explicitly set --attention-backend to one of ['ascend', 'fa3', 'fa4', 'flashinfer', 'intel_xpu', 'tri…
… Currently radix cache is not compatible with flashinfer attention backend for deterministic inference. It will be supported in the future.
```

在每台服务器一次运行里，并发 8 时的代价是吞吐的 18%。输出从 78.92 降到 64.83 tok/s，中位每 token 时间从 97.30 升到 117.43 ms。radix cache 是关的，所以有共享前缀的工作负载付的比这个测试展示的更多。

## 我们在 L4 上测到的 {#s-deterministic-inference-and-logprobs-what-we-measured-on-an-l4}

在 L4 上用 BF16 的 `Qwen/Qwen3-8B`，后面四条单独请求也彼此匹配、不匹配第一条。那里的成批请求写了另外两段文本，所以默认服务器对一条 prompt 给出四个不同答案。开着旗标时，L4 上全部十条也匹配。

后来的检查在同一 L4 节点第二块 GPU 上用了 `Qwen/Qwen3-8B-FP8`。单独的第一条再次不同于后面四条。这次批又加了一段文本，不是两段。开着旗标时，全部十条再次匹配。

那次检查还展示了后端变化。开着旗标、不设 `--attention-backend` 时，SGLang 在 L4（SM 8.9）上选了 `fa3`。同一块 GPU 上的默认服务器用 `flashinfer`。

```listing
title: the attention backend that deterministic mode chose on the L4
source: capture/gpu/out-l4/livecheck-2026-10-23.txt
lang: text
note: One line from the startup log, and the note under it.
---
Attention backend not specified. Falling back to 'fa3' for deterministic inference
The server ran on fa3 on SM 8.9 with no error. The default server on this GPU uses flashinfer.
```

所以在这块 GPU 上，旗标也改了 attention 后端。用 `fa3` 时，上面列表的第五点保持 radix cache 开着。

## 缓存、批和 dtype 改了什么 {#s-deterministic-inference-and-logprobs-what-the-cache-the-batch-and-the-dtype-changed}

我们数了两次运行之间有多少 greedy 输出变了。prompt 是一段大约 170 token 的共享 system prompt 之后的 ShareGPT 问题，128 个输出 token，thinking 关着。这是在我们 L4 节点第二块 GPU 上用 `Qwen/Qwen3-0.6B`，主人共享它，没有锁时钟。时钟改速度，不改 greedy token。

```listing
title: outputs that differ at a concurrency of 1, out of 32
source: capture/gpu/out-l4/greedy-output-cache-batch-dtype.txt
lang: text
note: The number in brackets is the median position of the first token that differs. The vLLM column comes from the same probe on vLLM 0.31.0.
---
comparison                     SGLang 0.6B   vLLM 0.6B
flushed repeat against fresh   0 of 32       0 of 32
cache off against cache off    0 of 32       0 of 32
fresh against warm cache       21 of 32 (45) 11 of 32 (57)
cache on against cache off     25 of 32 (26) 21 of 32 (48)
```

- **一次一条请求，同一缓存状态。** flush 之后的重复，或 radix cache 关掉时的重复，对全部 32 条 prompt 给出同一段文本。
- **一次一条请求，热缓存。** 同一批 prompt 对热缓存改了 32 里的 21 个输出。缓存开对缓存关改了 32 里的 25 个。
- **一次 64 条请求。** 两次缓存关掉的运行在 64 个输出里差了 27 个。批单独就改了很多输出，所以在那个负载下分不开缓存效应。
- **dtype。** 我们在并发 1、缓存关掉时发了 64 个问题。BF16 对 FP16 对 Qwen3-0.6B 改了 64 里的 51 个输出，对 Qwen3-1.7B 改了 57 个。第一个不同 token 的中位位置是 41 和 54。同一 dtype 里的重复一个都没改。

一项 2026 年对两个服务引擎的研究找到了同样的缓存分裂。我们的计数来自一块 GPU 上的小模型，所以用同样的方式测你自己的模型。

## 知道我们结果的限制 {#s-deterministic-inference-and-logprobs-know-the-limits-of-our-result}

我们的 18% 是一个模型、一个并发上的一次运行。其他团队量过确定性模式的代价和缺口。我们自己没复现这些结果：

- **速度代价。** Thinking Machines Lab 默认在 26 s 内跑完 1,000 条 Qwen3-8B 请求，用批不变内核是 55 s。更好的 attention 内核把它带到 42 s。
- **负载下更大的代价。** 一项 2026 研究 CoRun 量到批不变内核延迟超过两倍，吞吐最多少 74%。
- **执行里的其他变化。** 一项 2026 核验研究 Vosti 测了 prompt 分块和 KV cache 复用等变化。SGLang 的确定性模式在其中一些下给出了不同的 logits。

所以在你服务的并发下量代价。测精确的设置：模型、attention 后端、并行布局、分块大小和缓存设置。

## 我们的立场 {#s-deterministic-inference-and-logprobs-our-position}

把 `--enable-deterministic-inference` 当成一个模型和一个后端上的承诺，并测试那个承诺。为强化学习 rollout 和你想复现的评估打开它。为生产流量关掉它，那里前缀缓存和更快的内核比相同的比特更值钱。不要假设温度 0 单独就给出相同文本。在 GB10 上它没有。

给每条必须复现的请求设 `sampling_seed`。人人都用种子 42，会让每条采样请求抽同一串随机数。

把同一评估跑两遍，并按 token 比输出，不要只比分数。两次运行之间调用 `POST /flush_cache` 或重启服务器，像 [第 5.1 节](#s-sglang-benchmark-serving) 展示的那样。把缓存设置和缓存的 token 写在结果旁边。

## 事故 {#s-deterministic-inference-and-logprobs-incidents}

**旗标被接受了，输出仍在变。** Issue #43055（2026-10-08）：gpt-oss-20b 在 prefix 模式下对一条 prompt 给出好几个不同的 greedy 输出。评论把它追到 sliding-window 层上确定性 Triton extend 内核。它把 KV 块对齐到裁过的前缀，而不是绝对位置。本手册核验时该 issue 仍开着。

**有些架构还没覆盖。** Issue #43413 报告一个 Mamba2 混合模型不是批不变的。Issue #36174 和 #31261 列出 DeepSeek-V4 和 Qwen3.5 在确定性模式里尚未支持。

**一次重启改了 greedy 输出。** Issue #39597（2026-09-15）：用 DFLASH speculative 算法时，同一条 prompt 在重启后给出不同文本。FlashInfer 自动调参在每次启动上选了不同的内核战术。变通是 `--disable-flashinfer-autotune` 或确定性模式。

```takeaways
- 在依赖可复现输出之前，在你的模型和后端上跑 sglang.test.test_deterministic。
- 预期确定性模式在 flashinfer 上关掉前缀缓存。选 triton，或你的 GPU 支持时选 fa3 和 fa4。
- 在信任温度 0 之前，单独和成批各发一条 prompt，并数不同输出。
- 在你比较的两次评估运行之间 flush 缓存，并记录缓存的 token。
- 在你服务的并发下量确定性模式的代价，不要只在一个点上量。
- 当你在温度不是 1 时采样、训练器在温度 1 打分时，设 SGLANG_RETURN_ORIGINAL_LOGPROB。
- 在你比较的两次运行之间保持 dtype 相同。
- 在 Apple silicon 上，当请求需要温度或 logprobs 时传 --mlx-enable-sampling。
```

Sources: capture/gpu/out-gb10/determinism.txt, deterministic-determinism.txt, server-deterministic.log, bench-random-c8.txt, deterministic-bench-random-c8.txt, capture/gpu/out-l4/determinism.txt, deterministic-determinism.txt, capture/gpu/out-l4/livecheck-2026-10-23.txt, capture/gpu/out-l4/greedy-output-cache-batch-dtype.txt, capture/gpu/out-l4/logprobs-top-p.txt, capture/gpu/determinism_probe.py, python/sglang/srt/batch_invariant_ops/batch_invariant_ops.py (enable_batch_invariant_mode), arg_groups/attention_hook.py (handle_deterministic_inference), arg_groups/choices.py (DETERMINISTIC_ATTENTION_BACKEND_CHOICES, RADIX_SUPPORTED_DETERMINISTIC_ATTENTION_BACKEND), sampling/sampling_batch_info.py, layers/sampler.py, and python/sglang/test/test_deterministic.py at v0.5.22; capture/out/serve-help.txt; issues #43055, #43413, #36174, #31261, and #39597; Thinking Machines, Defeating Nondeterminism in LLM Inference (2025-09), the 1,000 Qwen3-8B requests on vLLM; python/sglang/srt/entrypoints/http_server.py (flush_cache) at v0.5.22; Patodiya, Same Request, Different Answer: Quantization Amplifies Cache-Induced Divergence in LLM Serving, arXiv 2609.04748 (2026-09, revised 2026-10); Zhao and others, CoRun: Padding is Simple and Efficient for Deterministic LLM Inference, arXiv 2608.14376 (2026-08); Qin and others, Vosti: Specifying, Implementing, and Verifying Deterministic LLM Inference, arXiv 2609.38981 (2026-09).
