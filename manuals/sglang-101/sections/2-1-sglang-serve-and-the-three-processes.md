# sglang serve 与三个进程

> SGLang 把一台服务器拆成 tokenizer 进程、scheduler 进程和 detokenizer 进程，因为 Python 的文本工作绝不能拖住喂 GPU 的那个循环。

你启动服务器，发一条请求，它能跑。然后你把真实流量放上去，GPU 停在百分之四十，用户却在等。大多数人先怪 kernel。LinkedIn 做了追查，慢的是 tokenizer、进程间消息、Python 垃圾回收，以及 GIL {{field LinkedIn 2026-02}}。

读完本节后，你能用 `sglang serve` 启动 SGLang，并说出它启动的三个进程。你也能从启动日志里读出决定后面一切的那些数字。

## 代价：一个 Python 线程做不完所有事 {#s-sglang-serve-and-the-three-processes-the-cost-one-python-thread-cannot-do-everything}

语言模型服务器做两类活。GPU 活是前向：每隔几毫秒一次 prefill 或 decode。CPU 活是周围的一切：解析 HTTP、套 chat template、tokenize、把 token id 变回文本，以及检查 stop string。

显而易见的设计是把这些都放进一个 Python 进程。负载一上来，这个设计就会失败。Python 在 GIL 下一次只跑一个线程。一段正在 tokenize 的 3,000 token prompt 占着必须启动下一步 GPU 的解释器。文本工作的每一毫秒，都变成 GPU 空转的一毫秒。

LinkedIn 在 H100 上用小型排序模型测过这个。单是批量 tokenization，就在每秒 500 次查询时把 P99 延迟从 4,583 ms 降到 464 ms {{field LinkedIn 2026-02}}。模型没变。变的只是它周围的 CPU 路径。

## SGLang 启动了什么 {#s-sglang-serve-and-the-three-processes-what-sglang-starts}

**TokenizerManager：** 主进程里接收每条请求、套 chat template、tokenize文本，并等待答案的那个对象。HTTP 服务器和 TokenizerManager 共享一个进程和一个 asyncio 循环。

**Scheduler：** 拥有 GPU 的单独进程。它决定下一步跑哪些 token、组 batch、跑前向并采样。开了 tensor parallelism 时，每块 GPU 一个 scheduler 进程。

**DetokenizerManager：** 第三个进程，把输出 token id 一点点变成文本，再把文本送回 TokenizerManager。

进程之间通过 ZMQ socket 交谈。TokenizerManager 把 `TokenizedGenerateReqInput` 发给 scheduler。Scheduler 把 `BatchTokenIDOutput` 发给 detokenizer。Detokenizer 再把 `BatchStrOutput` 送回来。在 v0.5.22，消息默认用 pickle，因为 `SGLANG_USE_PICKLE_IPC` 为真 {{code}}。

```figure
id: fig-2-1
kind: flow
title: the three processes of one SGLang server
claim: One request crosses three processes over ZMQ, and only the scheduler touches the model, so text work never runs on the thread that launches GPU steps.
caption: Read the numbered arrows in order. Blue boxes are SGLang processes, the olive box is the client. Process ids 5782 and 5909 are from the default server log of our Mac run.
```

开了 tensor parallelism 时，只有 scheduler 的 rank 0 打开 ZMQ socket。它把每条请求广播给其他 rank，好让每块 GPU 组出同一个 batch {{code}}。没有任何 rank 独自做决定。

## 我们跑的命令 {#s-sglang-serve-and-the-three-processes-the-command-we-ran}

我们在一台带 MLX 后端的 Apple silicon Mac 上启动了服务器，模型是 4-bit 的 Qwen3 0.6B。`sglang serve` 是 v0.5.22 的推荐命令。更老的 `python -m sglang.launch_server` 仍可用，并打印一条警告，把 `sglang serve` 点名为推荐入口 {{code}}。

```listing
title: the server command for every default capture
source: capture/out/server-default.command.txt
lang: text
---
SGLANG_USE_MLX=1 sglang serve --model-path mlx-community/Qwen3-0.6B-4bit --disable-cuda-graph --host 127.0.0.1 --port 30000 --enable-cache-report --enable-metrics --mem-fraction-static 0.4
```

有三个旗标不是默认值，而且三个都是故意的。`--enable-cache-report` 把缓存 token 数放进每个 OpenAI 风格响应，好让 [第 2.5 节](#s-streaming-stop-strings-and-the-openai-api) 能展示它。`--enable-metrics` 打开 [第 5.2 节](#s-the-metrics-endpoint) 会读的 `/metrics` 端点。`--mem-fraction-static 0.4` 限制 KV pool，[第 3.2 节](#s-mem-fraction-static-and-startup-sizing) 解释我们没设它时的崩溃。

日志反对其中一个旗标。SGLang 文档的 Apple silicon 页让你传 `--disable-cuda-graph`。我们日志的第二行说这个旗标 "is deprecated and will be removed in a future release"，并点名 `--cuda-graph-backend-{decode,prefill}=disabled` 作为替代。

文档和代码在这里不一致，代码说了算。这个旗标在 v0.5.22 仍可用。计划在下一版删掉它之前换掉它。

## 别的事先读启动日志 {#s-sglang-serve-and-the-three-processes-read-the-startup-log-before-anything-else}

启动日志告诉你 SGLang 替你决定了什么。那些数字大多不是你设的旗标。它们是 SGLang 根据你的内存、模型和硬件算出来的值。

```listing
title: the limits SGLang computed at startup
source: capture/out/server-default.log
lang: text
note: Lines cut from the startup section. The same lines appear in every capture with different memory numbers.
---
[2026-10-16 13:58:05] max_total_num_tokens=181574, chunked_prefill_size=4096, max_prefill_tokens=16384, max_running_requests=4096, context_len=40960, available_gpu_mem=47.96 GB
…
[2026-10-16 13:58:06] Using the Python TreeCore: the Rust TreeCore supports Linux only
[2026-10-16 13:58:06] Tree cache initialized: source=default impl=UnifiedRadixCache hybrid_swa=False hybrid_ssm=False hicache_attached=False
[2026-10-16 13:58:06] Engine startup timings (s): load_weight=0.00, kv_cache_allocation=0.00, scheduler_e2e=7.01, cuda_graph={prefill=0.00, decode=0.00, target_verify=0.00, draft_prefill=0.00, draft_decode=0.00, draft_extend=0.00}, tokenizer_e2e=11.92
```

逐字段读第一行：

- `max_total_num_tokens=181574` 是 KV pool 以 token 计的大小。[第 3 部分](#s-kv-bytes-per-token-and-the-kv-pool) 说明它从哪来。
- `chunked_prefill_size=4096` 是一步里一段 prompt 能跑的最大块。更长的 prompt 会分块跑。
- `max_running_requests=4096` 是能同时 decode 的请求数。它是算出来的值，不是良好延迟的承诺。
- `context_len=40960` 是模型接受的最长序列。

Tree cache 行也重要。从 v0.5.21 起，Linux 上 radix tree 默认跑在 Rust 里。在我们的 Mac 上它跑在 Python 里，日志也这么说。

## Warm-up 与垃圾回收器 {#s-sglang-serve-and-the-three-processes-the-warm-up-and-the-garbage-collector}

在服务器说自己就绪之前，它会给自己发一条请求。然后调用自己的 `/freeze_gc` 端点。

```listing
title: the warm-up request and the frozen garbage collector
source: capture/out/server-default.log
lang: text
---
[2026-10-16 13:58:08] Prefill batch, #new-seq: 1, #new-token: 6, #cached-token: 0, token usage: 0.00, #running-req: 0, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 3.85
[2026-10-16 13:58:08] INFO:     127.0.0.1:63781 - "POST /generate HTTP/1.1" 200 OK
[2026-10-16 13:58:08] INFO:     127.0.0.1:63785 - "POST /freeze_gc HTTP/1.1" 200 OK
[2026-10-16 13:58:08] The server is fired up and ready to roll!
```

那次 `/freeze_gc` 调用有一段历史。LinkedIn 看到每隔几秒就有 100 到 300 ms 的垃圾回收停顿，并用 warm-up 加 `gc.freeze()` 修掉了它们 {{field LinkedIn 2026-02}}。在 v0.5.22，服务器在 warm-up 之后替你做同样的事，scheduler 和 detokenizer 也包括在内 {{code}}。

## 关闭日志里的进程 {#s-sglang-serve-and-the-three-processes-the-processes-in-the-shutdown-log}

进程拆分最清楚的证据出现在服务器停下来时。我们的 capture kit 用 SIGTERM 停掉每台服务器。

```listing
title: shutdown, seen from the main process
source: capture/out/server-default.log
lang: text
---
[2026-10-16 14:01:45] SIGTERM received. signum=None frame=None. Draining requests and shutting down...
[2026-10-16 14:01:45] Subprocess scheduler_0 (pid=5909) crashed with exit code -15. Triggering SIGQUIT for cleanup...
```

主进程是 pid 5782，scheduler 是 pid 5909。退出码 -15 是我们自己的 SIGTERM，所以 "crashed" 这个词有误导性。真正的 scheduler 崩溃看起来不一样。它会打印 traceback，然后是 "SIGQUIT received ... It usually means one child failed"，[第 2.4 节](#s-the-overlap-scheduler) 会展示。

## 我们的立场 {#s-sglang-serve-and-the-three-processes-our-position}

把 CPU 路径当成模型服务器的一部分。当首 token 时间很高而 GPU 并不忙时，先看 tokenizer 进程，再看 kernel。SGLang 给两端都提供了更多 worker：`--tokenizer-worker-num` 和 `--detokenizer-worker-num`，默认都是 1 {{code}}。

不要在启动日志报告的默认值上跑完所有实验。把算出的上限记下来，再决定哪些自己设。[第 7.1 节](#s-operating-sglang) 给出顺序。

```takeaways
- 用 sglang serve 启动服务器，并保留它的启动日志。
- 把启动日志里算出的上限抄进笔记。
- GPU 空闲而延迟很高时，先看 tokenizer 进程。
- 把一次停止叫成崩溃之前，先读关闭行里的退出码。
```

Sources: python/sglang/srt/entrypoints/engine.py (Engine docstring and process launch), python/sglang/srt/managers/io_struct.py, python/sglang/srt/environ.py (SGLANG_USE_PICKLE_IPC), python/sglang/srt/managers/scheduler_components/request_receiver.py, python/sglang/launch_server.py, python/sglang/srt/entrypoints/http_server.py (warm-up and /freeze_gc), python/sglang/srt/arg_groups/fields/serving.py at v0.5.22; docs/docs/hardware-platforms/apple_metal.mdx at v0.5.22; capture/out/server-default.command.txt and capture/out/server-default.log; LinkedIn Engineering, "Scaling LLM-based ranking systems with SGLang at LinkedIn", 2026-02-20, https://www.linkedin.com/blog/engineering/ai/scaling-llm-based-ranking-systems-with-sglang-at-linkedin.
