# 旗标与默认

> 本手册改过或解释过的旗标，以及代码设的默认、我们 Mac 解析出的值，和何时改它。

`sglang serve --help` 在 0.5.22 列出 535 个选项（[捕获的帮助输出](manuals/sglang-101/capture/out/serve-help.txt)）。多数对你永远不重要。下表收着本手册用到的主要那些。各节在用到的地方还会点名另一些旗标。

代码里很多默认是 `None`。启动钩子用取决于 GPU、模型和空闲内存的值替换它们。"On our Mac" 列展示那个解析后的值，来自[默认服务器日志](manuals/sglang-101/capture/out/server-default.log)的 `server_args` 行。

## 内存与准入 {#s-ref-flags-and-defaults-memory-and-admission}

| Flag | Default in the code | On our Mac | Change it when | Section |
|---|---|---|---|---|
| `--mem-fraction-static` | `None`, derived from GPU size at startup | `0.4`, set by the kit | the machine runs other programs, or the server crashes on large batches | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| `--max-total-tokens` | `None`, derived from the memory budget | 181,574 tokens in the pool | you want a fixed pool size for a test | [2.3](#s-admission-and-retraction) |
| `--max-running-requests` | `None`, derived from the pool and the context length | 4,096 | you know your concurrency limit, or you turn on speculative decoding | [2.3](#s-admission-and-retraction) |
| `--chunked-prefill-size` | `None`, derived from GPU memory | 4,096 | long prompts stall decode, or prefill is too slow | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| `--max-prefill-tokens` | 16,384 | 16,384 | rarely | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| `--schedule-conservativeness` | 1.0 | 1.0 | you see retractions in the log, raise it | [2.3](#s-admission-and-retraction) |
| `--page-size` | `None`, derived per attention backend | 1 | the attention backend needs pages | [3.1](#s-kv-bytes-per-token-and-the-kv-pool) |

## 调度 {#s-ref-flags-and-defaults-scheduling}

| Flag | Default in the code | On our Mac | Change it when | Section |
|---|---|---|---|---|
| `--schedule-policy` | `fcfs` | `fcfs` | many queued requests share long prefixes, try `lpm` | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| `--disable-overlap-schedule` | `False` | `False` | only to debug, and never on MLX at 0.5.22, where it crashed | [2.4](#s-the-overlap-scheduler) |
| `--stream-interval` | 1 | 1 | you stream to many clients and want fewer messages | [2.5](#s-streaming-stop-strings-and-the-openai-api) |

## 缓存 {#s-ref-flags-and-defaults-cache}

| Flag | Default in the code | On our Mac | Change it when | Section |
|---|---|---|---|---|
| `--disable-radix-cache` | `False` | `False` | only to measure the cache, as our kit does | [3.3](#s-radixcache) |
| `--radix-eviction-policy` | `lru` | `lru` | a few prefixes are hot and many are cold | [3.5](#s-eviction-policies-and-hicache) |
| `--enable-hierarchical-cache` | off | off | the working set of prefixes is larger than GPU memory | [3.5](#s-eviction-policies-and-hicache) |
| `--kv-cache-dtype` | `auto` | `auto` | you need more context per GPU and can test the quality | [4.3](#s-quantization) |
| `--enable-cache-report` | `False` | `True`, set by the kit | always, so clients see `cached_tokens` | [3.4](#s-prefix-friendly-prompts) |

## 执行 {#s-ref-flags-and-defaults-execution}

| Flag | Default in the code | On our Mac | Change it when | Section |
|---|---|---|---|---|
| `--attention-backend` | `None`, chosen per GPU and model | `torch_native`, which MLX does not use | you measured a better backend for your model | [4.2](#s-attention-backend) |
| `--grammar-backend` | `None`, which resolves to `xgrammar` | `xgrammar` | a grammar fails to compile | [4.5](#s-structured-outputs-with-xgrammar) |
| `--disable-cuda-graph`, deprecated | `False` | `True`, as the Apple instructions say | on Apple silicon, where CUDA graphs do not exist. Prefer `--cuda-graph-backend-decode disabled` and `--cuda-graph-backend-prefill disabled` | [4.1](#s-forwardmode-and-cuda-graphs) |
| `--speculative-algorithm` | `None` | `None` | decode latency at low concurrency matters most | [4.4](#s-speculative-decoding) |
| `--enable-deterministic-inference` | `False` | `False` | you need the same output for the same input in any batch | [4.6](#s-deterministic-inference-and-logprobs) |

`--disable-cuda-graph` 在 0.5.22 仍可用，按阶段的旗标 `--cuda-graph-backend-decode` 和 `--cuda-graph-backend-prefill` 替换它。

## 并行与运维 {#s-ref-flags-and-defaults-parallelism-and-operations}

| Flag | Default in the code | On our Mac | Change it when | Section |
|---|---|---|---|---|
| `--tp-size` | 1 | 1 | one GPU cannot hold the weights | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| `--dp-size` | 1 | 1 | one copy of the model is saturated and you have GPUs for another | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| `--attn-dp-size` | 1 | 1 | you serve an MLA model such as DeepSeek on many GPUs | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| `--ep-size` | 1 | 1 | you serve a large MoE model | [6.2](#s-moe-serving-deepep-and-eplb) |
| `--enable-metrics` | `False` | `True`, set by the kit | always in production | [5.2](#s-the-metrics-endpoint) |
| `--watchdog-timeout` | 300 s | 300 s | a single forward pass can take longer than five minutes | [7.1](#s-operating-sglang) |

Sources: python/sglang/srt/arg_groups/fields/schedule.py, memory.py, exec_.py, model.py, parallel.py, spec.py, serving.py, observability.py, device.py at v0.5.22; capture/out/serve-help.txt, server-default.log, server-small-pool.log.
