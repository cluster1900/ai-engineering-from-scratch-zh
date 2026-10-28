# 旗标与默认

> 本手册改过或解释过的旗标，以及代码设的默认、我们 Mac 解析出的值，和何时改它。

`sglang serve --help` 在 0.5.22 列出 535 个选项（[捕获的帮助输出](manuals/sglang-101/capture/out/serve-help.txt)）。多数对你永远不重要。下表收着本手册用到的主要那些。各节在用到的地方还会点名另一些旗标。

代码里很多默认是 `None`。启动钩子用取决于 GPU、模型和空闲内存的值替换它们。「在我们的 Mac 上」列展示那个解析后的值，来自[默认服务器日志](manuals/sglang-101/capture/out/server-default.log)的 `server_args` 行。

## 内存与准入 {#s-ref-flags-and-defaults-memory-and-admission}

| 旗标 | 代码中的默认 | 在我们的 Mac 上 | 何时改 | 节 |
|---|---|---|---|---|
| `--mem-fraction-static` | `None`，启动时由 GPU 大小推导 | `0.4`，由套件设定 | 机器还跑别的程序，或大批次时服务器崩溃 | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| `--max-total-tokens` | `None`，由内存预算推导 | 池中 181,574 个 token | 你想为测试固定池大小 | [2.3](#s-admission-and-retraction) |
| `--max-running-requests` | `None`，由池与上下文长度推导 | 4,096 | 你知道并发上限，或打开推测解码 | [2.3](#s-admission-and-retraction) |
| `--chunked-prefill-size` | `None`，由 GPU 内存推导 | 4,096 | 长提示拖住 decode，或 prefill 太慢 | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| `--max-prefill-tokens` | 16,384 | 16,384 | rarely | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| `--schedule-conservativeness` | 1.0 | 1.0 | 日志里看到 retraction 时调高 | [2.3](#s-admission-and-retraction) |
| `--page-size` | `None`，按注意力后端推导 | 1 | 注意力后端需要 page | [3.1](#s-kv-bytes-per-token-and-the-kv-pool) |

## 调度 {#s-ref-flags-and-defaults-scheduling}

| 旗标 | 代码中的默认 | 在我们的 Mac 上 | 何时改 | 节 |
|---|---|---|---|---|
| `--schedule-policy` | `fcfs` | `fcfs` | 许多排队请求共享长前缀时，试试 `lpm` | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| `--disable-overlap-schedule` | `False` | `False` | 仅用于调试，且切勿在 0.5.22 的 MLX 上（会崩溃） | [2.4](#s-the-overlap-scheduler) |
| `--stream-interval` | 1 | 1 | 向许多客户端流式输出且想减少消息时 | [2.5](#s-streaming-stop-strings-and-the-openai-api) |

## 缓存 {#s-ref-flags-and-defaults-cache}

| 旗标 | 代码中的默认 | 在我们的 Mac 上 | 何时改 | 节 |
|---|---|---|---|---|
| `--disable-radix-cache` | `False` | `False` | 仅用于测量缓存，如我们的套件所做 | [3.3](#s-radixcache) |
| `--radix-eviction-policy` | `lru` | `lru` | 少数前缀很热、多数很冷时 | [3.5](#s-eviction-policies-and-hicache) |
| `--enable-hierarchical-cache` | off | off | 前缀工作集大于 GPU 内存时 | [3.5](#s-eviction-policies-and-hicache) |
| `--kv-cache-dtype` | `auto` | `auto` | 每块 GPU 需要更多上下文且能测试质量时 | [4.3](#s-quantization) |
| `--enable-cache-report` | `False` | `True`，由套件设定 | 始终打开，好让客户端看到 `cached_tokens` | [3.4](#s-prefix-friendly-prompts) |

## 执行 {#s-ref-flags-and-defaults-execution}

| 旗标 | 代码中的默认 | 在我们的 Mac 上 | 何时改 | 节 |
|---|---|---|---|---|
| `--attention-backend` | `None`，按 GPU 与模型选定 | `torch_native`，MLX 并不使用它 | 你测到对模型更好的后端时 | [4.2](#s-attention-backend) |
| `--grammar-backend` | `None`，解析为 `xgrammar` | `xgrammar` | 某条 grammar 编译失败时 | [4.5](#s-structured-outputs-with-xgrammar) |
| `--disable-cuda-graph`, deprecated | `False` | `True`，按 Apple 说明 | 在 Apple silicon 上，那里没有 CUDA graph。优先用 `--cuda-graph-backend-decode disabled` 与 `--cuda-graph-backend-prefill disabled` | [4.1](#s-forwardmode-and-cuda-graphs) |
| `--speculative-algorithm` | `None` | `None` | 低并发下 decode 延迟最要紧时 | [4.4](#s-speculative-decoding) |
| `--enable-deterministic-inference` | `False` | `False` | 任意 batch 下同一输入需要同一输出时 | [4.6](#s-deterministic-inference-and-logprobs) |

`--disable-cuda-graph` 在 0.5.22 仍可用，按阶段的旗标 `--cuda-graph-backend-decode` 和 `--cuda-graph-backend-prefill` 替换它。

## 并行与运维 {#s-ref-flags-and-defaults-parallelism-and-operations}

| 旗标 | 代码中的默认 | 在我们的 Mac 上 | 何时改 | 节 |
|---|---|---|---|---|
| `--tp-size` | 1 | 1 | 一块 GPU 装不下权重时 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| `--dp-size` | 1 | 1 | 一份模型副本已饱和且你还有 GPU 可开另一份时 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| `--attn-dp-size` | 1 | 1 | 你在许多 GPU 上服务 DeepSeek 这类 MLA 模型时 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| `--ep-size` | 1 | 1 | 你服务大型 MoE 模型时 | [6.2](#s-moe-serving-deepep-and-eplb) |
| `--enable-metrics` | `False` | `True`，由套件设定 | 生产环境始终打开 | [5.2](#s-the-metrics-endpoint) |
| `--watchdog-timeout` | 300 s | 300 s | 单次前向可能超过五分钟时 | [7.1](#s-operating-sglang) |

Sources: python/sglang/srt/arg_groups/fields/schedule.py, memory.py, exec_.py, model.py, parallel.py, spec.py, serving.py, observability.py, device.py at v0.5.22; capture/out/serve-help.txt, server-default.log, server-small-pool.log.
