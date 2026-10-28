# 运维 SGLang

> 这样跑 SGLang，让一次重启只花几秒、不丢掉任何请求：钉死镜像，保留已编译内核，只给主进程发信号，并按测过的顺序调参。

新服务引擎的第一次生产事故很少关乎每秒多少 token。一次滚动更新在答案做到一半时杀掉十条请求。一个新 pod 要四分钟才就绪，所以自动扩缩又再起三个。存活探针在负载下超时，并重启最忙的那个 pod。这些都不出现在基准里，却都比一个慢内核更贵。

读完本节后，你能选一个镜像标签并让启动保持短。你能把健康探针接到正确的端点，并在不丢工作的情况下停掉服务器。你也能按本手册测过的顺序改设置，并读三份生产报告，看每一份教什么。

## 钉死你跑的镜像 {#s-operating-sglang-pin-the-image-you-run}

SGLang 团队在 Docker Hub 上以 `lmsysorg/sglang` 发布镜像。在 v0.5.22，`latest` 标签持有最新稳定发布，`latest-runtime` 持有同一发布的更小镜像 {{docs}}。Nightly 标签跟随 `main`。这些镜像只含 CUDA 13。文档把 `lmsysorg/sglang:v0.5.19-cu129` 点名为最后一个 CUDA 12 标签，所以驱动较旧的主机需要那个标签或升级驱动。

文档里的启动命令给容器一大块共享内存与主机 IPC 命名空间：

```bash
docker run -it --gpus all \
  --shm-size 32g \
  -p 30000:30000 \
  -v "$HF_CACHE_DIR:/root/.cache/huggingface" \
  --ipc=host \
  lmsysorg/sglang:latest bash
```

**我们的立场：** 永远不要部署 `latest`。SGLang 在四周内打了 v0.5.20、v0.5.21 与 v0.5.22，从 2026-09-18 到 2026-10-13，每一次发布都改了本手册测量的那些默认。像 `v0.5.22` 这样钉死的标签，让一次回归成为你做过的选择。标签 `latest` 则让它变成重启时发生在你身上的事。

## pip install 漏掉了什么 {#s-operating-sglang-what-pip-install-leaves-out}

镜像存在的理由，是 pip 安装会藏起来的。**我们测过**这一点：一台主机有两块 NVIDIA L4、Ubuntu 24.04、驱动，没有 CUDA toolkit。`pip install sglang==0.5.22` 没有报错就结束了。第一次 `sglang serve` 随后失败，接下来三次也失败，每一次是新的原因：

```listing
title: four starts, four missing pieces
source: capture/gpu/incidents/l4-toolchain-failures.txt
lang: text
note: The first error line of each attempt. Repeated lines and progress bars are cut.
---
=== attempt: out-l4-nopyheaders/server-default.log
<site-packages>/triton/backends/nvidia/driver.c:9:10: fatal error: Python.h: No such file or directory
…
=== attempt: out-l4-nonvcc/server-default.log
[2026-10-16 14:21:19] RuntimeError: Could not find nvcc and default cuda_home='/usr/local/cuda' doesn't exist
…
=== attempt: out-l4-jitmismatch/server-default.log
…
<site-packages>/flashinfer/data/cccl/libcudacxx/include/cuda/std/__cccl/cuda_toolkit.h:41:8: error: #error "CUDA compiler and CUDA toolkit headers are incompatible, please check your include paths"
…
=== attempt: out-l4-nolibcudart/server-default.log
/usr/bin/ld: cannot find -lcudart: No such file or directory
```

四次失败都来自一个事实。SGLang、Triton 与 FlashInfer 在启动时在目标机器上编译内核，而编译器需要完整的工具链。

1. Triton 对着 Python 头文件编译一个小的 C 助手。Ubuntu 的系统 Python 没有 `Python.h`。我们换成了带头文件的 Python 构建，来自 `uv`。
2. SGLang 在 `/usr/local/cuda` 下找 `nvcc`。pip wheel 在 site-packages 的 `nvidia/cu13` 下含有 `nvcc` 13.4，但没有东西指向它。我们把 `CUDA_HOME` 设成那个目录。
3. FlashInfer 随后用那个 `nvcc` 对着它自带的头文件编译注意力内核，版本不匹配。我们安装了 `flashinfer-jit-cache`，它为 SM 8.9 预先持有已编译内核。
4. SGLang 的 JIT 内核用 `$CUDA_HOME/lib64` 里的 `-lcudart` 链接。wheel 只有 `lib/libcudart.so.13`。我们做了一个带 `lib64` 目录、里面放着 `libcudart.so` 的 `CUDA_HOME`。

第五次启动开始服务请求。我们的 GB10 从未有过这个问题，因为它的 DGX 操作系统在 `/usr/local/cuda` 里有完整 toolkit。

基准客户端还有一个防火墙会暴露的依赖。它的 `random` 数据集从 ShareGPT 取文本，并从 Hugging Face Hub 下载那个文件 {{code}}。开着 `HF_HUB_OFFLINE=1` 时，我们第一次 GPU 基准失败了，尽管每个模型都在磁盘上。我们没有保留那份日志。在没有网络的机器上用 `--dataset-name random-ids`，或用 `--dataset-path` 传本地 ShareGPT 文件。

**我们的立场：** 从钉死的镜像跑 SGLang，或在有完整 CUDA toolkit 的主机上跑。只装了驱动的主机上的 pip 安装，在我们四次修补之后能工作。每一次 SGLang 升级都可能再需要它们。

## 冷启动是权重加编译器 {#s-operating-sglang-cold-start-is-weights-plus-compilers}

一个新的 SGLang 进程加载权重、编译或加载内核、定好 KV 池大小，并捕获 graph。我们的抓取把每个阶段记在一行上。这次跑用的模型已经在磁盘上：

```listing
title: startup phases of the default server
source: capture/out/server-default.log
lang: text
note: One line from the startup log. The CUDA graph fields are all 0.00 because the MLX path captures no CUDA graphs.
---
[2026-10-16 13:58:06] Engine startup timings (s): load_weight=0.00, kv_cache_allocation=0.00, scheduler_e2e=7.01, cuda_graph={prefill=0.00, decode=0.00, target_verify=0.00, draft_prefill=0.00, draft_decode=0.00, draft_extend=0.00}, tokenizer_e2e=11.92
```

**我们测到**从第一条日志行到 "The server is fired up and ready to roll!"，在 Mac 上对一个 0.6B 模型是 18 秒。GPU 上的大模型是另一个问题。**一份现场报告**来自 Doubleword，一篇工程师博客标在 2026-04，给 SGLang v0.5.10 配 Qwen3.5-122B-A10B-FP8、在 8 块 B200 上计时 {{field Doubleword 2026-04}}。冷启动花了 695 秒，其中 531 秒是权重加载。在运行之间保留内核缓存时，热启动花 88 秒。用进程检查点并把权重暂存在主机内存里，花 9.6 秒。

代码帮的是那份工作里便宜的部分。当 Python 导入 `sglang` 时，它把 Triton、TorchInductor、CUDA、TileLang 与 FlashInfer 的缓存指到一个目录 `SGLANG_CACHE_DIR`，默认是 `~/.cache/sglang` {{code}}。把那个目录与 Hugging Face 缓存挂到能活过 pod 的卷上。然后一次重启会复用已编译内核与已下载权重。

同一份现场报告为慢启动辩护。对他们来说，每秒多 10% 的 token 比启动快 10 秒更值钱 {{field Doubleword 2026-04}}。对跑很多天的机群我们同意。对每晚缩到零的机群，启动时间是真实成本，而持久缓存是第一道修复。

## 健康检查：/ready、/health 与 /health_generate {#s-operating-sglang-health-checks-ready-health-and-health-generate}

SGLang 有两类健康端点 {{code}}：

- `/ready` 在分词器管理器就绪时返回 200，在那之前返回 503。
- `/health` 与 `/health_generate` 共用一个处理器。它们在服务器启动与关闭时返回 503。
- 否则处理器发一条 `max_new_tokens` 为 1 的单 token 请求，并等待 detokenizer 的任何输出。
- `SGLANG_ENABLE_HEALTH_ENDPOINT_GENERATION` 默认为 true，所以普通的 `/health` 也会生成那个 token。
- 等待时间是 `SGLANG_HEALTH_CHECK_TIMEOUT`，默认 20 秒。在那段时间里没有输出时，处理器把服务器标为 `UnHealthy` 并返回 503。

文档字符串说，服务器忙时探针请求不花代价，因为调度器的任何输出都算作存活证明。对工作量这是真的，对计时这是假的。**一次真实事故：** issue #22511 报告 GLM-5 在 2 块 H800、高负载、v0.5.10 上出现 `health check failed. server could not get a response from detokenizer for last 20 seconds` {{issue #22511}}。相关的 issue #35884 发现超时的探针把它的请求留在调度器里，所以失败的探针会累积 {{issue #35884}}。

**我们的立场：** 用 `/ready` 做就绪探针。让存活探针不要生成。设 `SGLANG_ENABLE_HEALTH_ENDPOINT_GENERATION=false`，然后 `/health` 在不向调度器发请求的情况下返回 200 {{code}}。用 `/health_generate` 做更慢的深度检查，它提醒人、不重启任何东西。这样忙服务器就不会因为一个在队列里等着的探针而丢掉最忙的那个 pod。

## 优雅关闭：只给主进程发信号 {#s-operating-sglang-graceful-shutdown-signal-the-main-process-only}

收到 SIGTERM 时，HTTP 服务器设置 `gracefully_exit`，`/health` 开始返回 503。分词器管理器里的一个看门狗每 5 秒检查该标志 {{code}}。然后它每 5 秒记下剩余请求，直到一个都不剩。然后它向调度器发 `ShutdownReq`，并在杀掉它们之前给它们 15 秒退出。[图 7.1](#fig-7-1) 展示了这条路径，以及两条跳过排空的路径。

```figure
id: fig-7-1
kind: state
title: three ways an SGLang server stops
claim: Only a SIGTERM to the main process drains running requests, and a forced exit or a signal to the process group stops work in progress.
caption: Read left to right along the top for the graceful path, then down for the two other paths. The numbers match the key. From capture/out/shutdown-exploratory.log, capture/out/server-default.log, and the shutdown code at v0.5.22.
```

**我们测过** Mac 上的两种情况。我们的抓取套件通过向整个进程组发 SIGTERM 停掉每一台服务器。调度器子进程也收到信号并先死：

```listing
title: SIGTERM to the process group
source: capture/out/server-default.log
lang: text
note: Four consecutive lines from the end of the default run.
---
[2026-10-16 14:01:45] SIGTERM received. signum=None frame=None. Draining requests and shutting down...
[2026-10-16 14:01:45] Subprocess scheduler_0 (pid=5909) crashed with exit code -15. Triggering SIGQUIT for cleanup...
[2026-10-16 14:01:45] SIGQUIT received. signum=None, frame=None. It usually means one child failed.
[2026-10-16 14:01:46] Sleeping 5 seconds before crash diagnostics to let GPU activity settle.
```

父进程看到崩溃的子进程，走上崩溃路径，并杀掉进程树。那一刻没有请求在跑，所以什么都没丢。在负载下，每一个在跑的请求都会失败。然后我们启动一台服务器，给它发一条要 3,000 个输出 token 的请求，并只向主进程发 SIGTERM：

```listing
title: SIGTERM to the main process, with one request running
source: capture/out/shutdown-exploratory.log
lang: text
note: Lines cut from the log of a separate run. Decode batch lines between them are cut.
---
[2026-10-16 14:13:54] SIGTERM received. signum=None frame=None. Draining requests and shutting down...
…
[2026-10-16 14:13:55] INFO:     127.0.0.1:53237 - "GET /health HTTP/1.1" 503 Service Unavailable
…
[2026-10-16 14:13:57] Gracefully exiting... Remaining number of requests 1. Remaining requests remaining_rids=['ef12359aaaaf40d78fedb4e7f7aaed25'].
…
[2026-10-16 14:14:04] INFO:     127.0.0.1:53209 - "POST /generate HTTP/1.1" 200 OK
[2026-10-16 14:14:07] Gracefully exiting... Remaining number of requests 0. Remaining requests remaining_rids=[].
…
[2026-10-16 14:14:07] INFO:     Finished server process [53853]
```

```listing
title: what the client saw
source: capture/out/shutdown-exploratory.txt
lang: text
note: The whole output of the probe script.
---
health before SIGTERM: 200
sent SIGTERM to the server process only
health during drain: 503
in-flight request: {"status": 200, "completion_tokens": 3000, "finish_reason": {"type": "length", "length": 3000}, "seconds": 14.2}
server exit code: 0
```

请求带着全部 3,000 个 token 结束，排空期间 `/health` 返回 503。服务器以退出码 0 退出，在信号后十三秒。`docker stop` 与 Kubernetes 向容器的主进程发 SIGTERM。当 `sglang serve` 是主进程时，那就是正确的目标，所以用 `exec` 启动它，或把它当作 entrypoint。上面的交互命令让 `bash` 成为主进程，而 `bash` 不会把信号传下去。一个把信号转发给进程组的包装脚本，或一个杀掉该组的监督器，会给你第一份日志。

代码有两条跳过排空的出口。如果服务器已经是 `UnHealthy`，看门狗立刻退出。如果环境变量 `SGL_FORCE_SHUTDOWN` 为 true，它也立刻退出。在 v0.5.22，看门狗直接读那个旧名字 {{code}}。

环境模块声明新名字 `SGLANG_FORCE_SHUTDOWN`。其兼容代码把 `SGL_` 变量复制到 `SGLANG_` 名字，从不反过来。**代码显示**只设 `SGLANG_FORCE_SHUTDOWN` 到不了看门狗。我们是在代码里读到的，没有跑过，所以我们把它叫作很可能的 bug。如果你需要强制停止，设 `SGL_FORCE_SHUTDOWN=1`。

**我们的立场：** 把终止宽限期设得比你在输出上限下最长的那条请求更长。一条 32K token 的答案、每秒 30 个 token，需要超过 18 分钟。在设宽限期之前先限制 `max_tokens`，否则排空永远赶不上时间。

## 在信任一次测量之前 {#s-operating-sglang-before-you-trust-a-measurement}

三项检查挡住了我们在自己机器上发现的大多数假结果：

1. 在每一次你要比较的跑之前冲洗前缀缓存，并记下缓存的 token，如[第 5.1 节](#s-sglang-benchmark-serving)。在我们的套件里，热缓存会让更高负载的一次跑看起来更快。后来对 `Qwen/Qwen3-0.6B`、上限 16 的测试里，不冲洗的重复把中位 TTFT 读成大约低 4.8 倍。
2. 每一次跑都记下 SM 时钟与温度，如[第 5.1 节](#s-sglang-benchmark-serving)。一块热的 L4 报告吞吐最多少 28%。
3. 在共享的 GB10 上，在带内存上限的容器里跑 SGLang，并在启动期间记下空闲内存，如[第 3.2 节](#s-mem-fraction-static-and-startup-sizing)。

当两次跑之间的贪心输出变化时，先检查缓存。一条在缓存里找到其提示的请求走不同的 prefill 路径，如[第 4.6 节](#s-deterministic-inference-and-logprobs)所示。一次一条请求时，热缓存改了我们 32 条贪心输出里的 21 条，冲洗之后精确重复又回来了。这两次测试跑在一块没有锁时钟的共享 L4 上，所以信任比例与计数，不要信任时间。

## 在重度驱逐下服务器中止或挂起 {#s-operating-sglang-the-server-aborts-or-hangs-under-heavy-eviction}

**症状：** 在多轮负载中间，服务器以 `CUDA error: an illegal memory access was encountered` 停下。或者日志停住、没有错误，而 GPU 停在 100%。

我们在 SGLang 0.5.22 上看到这一点，配 `Qwen/Qwen3-0.6B`、8,192 token 的池，以及[第 3.5 节](#s-eviction-policies-and-hicache) 的那条轨迹。从第四轮起，池几乎在每一步都驱逐前缀。CUDA graph 与 overlap 调度器是开的，那是默认。这些跑在 2026-10-23 我们 L4 节点的第二块 GPU 上，其所有者共享它，且没有锁时钟。

```listing
title: aborts and hangs by variant, same server and trace
source: capture/gpu/out-l4/small-pool-crash.txt
lang: text
note: The tally from the summary. A hang is a log with no new line for 5 minutes, or a run longer than 15 minutes.
---
variant                                          runs   aborts   hangs   clean
lru, CUDA graph and overlap on (default)         6      1        3       2
lru, CUDA_LAUNCH_BLOCKING=1                      3      0        0       3
lru, --disable-cuda-graph                        4      0        0       4
lru, --enable-hierarchical-cache                 3      1        0       2
lru, HiCache, CUDA_LAUNCH_BLOCKING=1             2      0        0       2
```

用默认时，6 次里有 4 次失败。HiCache 没有挡住它，其 3 次里有 1 次中止。中止与每一次挂起都停在同一个地方：调度器在等一次 decode 结果拷贝完成。关掉 CUDA graph 时，4 次里 0 次失败。开着 `CUDA_LAUNCH_BLOCKING=1` 时，3 次里 0 次失败。

我们没有找到出错的那个内核，因为阻塞启动时故障没有发生。上游没有提交任何东西。

**变通办法：** 加上 `--disable-cuda-graph`。在我们的 L4 上配 8B 模型时，graph 大约省下每个 decode 步的 1%，如[第 4.1 节](#s-forwardmode-and-cuda-graphs)所示。小模型把更大份额的每一步花在启动上，所以在你的模型上测代价。`CUDA_LAUNCH_BLOCKING=1` 也藏起了故障，但它让每一次内核启动都等前一次。用它来调试，永远不要拿它来服务。

**也要测：** 更大的池。池有 16,384 个 token 或更多时，同一条轨迹停止 thrashing，如第 3.5 节所示。我们没有在更大的池上统计崩溃，所以这不是已证明的修复。

## 改设置的顺序 {#s-operating-sglang-the-order-to-change-settings}

多数调优建议列标志。顺序比列表更要紧，因为每一步都改了下一步测到的东西。[图 7.1b](#fig-7-1b) 展示本手册用的顺序，每一行链到测量它的那一节。

```figure
id: fig-7-1b
kind: flow
title: the order to change SGLang settings
claim: Measure first, then fix memory, prompts, and concurrency, and only then touch kernels, parallelism, and disaggregation.
caption: Read top to bottom. Each row is one setting or action, with the measurement that justifies it and the section that shows that measurement.
```

1. 用 `sglang.benchmark.serving` 在三个并发级别上测量，如[第 5.1 节](#s-sglang-benchmark-serving)。没有基线，后面的改动就没有数字。
2. 为你共享的那台机器设 `--mem-fraction-static`，如[第 3.2 节](#s-mem-fraction-static-and-startup-sizing)。在我们的 Mac 上，自动值在并发 32 时让服务器崩溃。
3. 把共享文本放在每一条提示的最前面，如[第 3.4 节](#s-prefix-friendly-prompts)。系统提示开头的一个请求 id 让我们的到第一个 token 的时间大约贵 14 倍。
4. 把 `--max-running-requests` 限制在你测到的拐点。在我们的 L4 上过了拐点，吞吐下降而到第一个 token 的时间上升。我们的 GB10 一直升到 64 个用户，我们没有单独测上限本身。
5. 现在才改 CUDA graph 设置与 `--attention-backend`，每次跑改一个，如[第 4.1 节](#s-forwardmode-and-cuda-graphs)与[第 4.2 节](#s-attention-backend)。在 v0.5.22，`--disable-cuda-graph` 已弃用，改用 `--cuda-graph-backend-decode` 与 `--cuda-graph-backend-prefill`。
6. 在一份副本饱和时，再加张量、数据或注意力数据并行，如[第 6.1 节](#s-tp-size-dp-size-and-attn-dp-size)。
7. 最后才拆开 prefill 与 decode，且只有在你测到 prefill 拖延了 decode 之后，如[第 6.3 节](#s-prefill-decode-disaggregation)。

## 生产团队报告了什么 {#s-operating-sglang-what-production-teams-report}

三份来自 SGLang 之外的团队的报告，展示运维精力花在哪里。

**LinkedIn**，一篇独立工程博客标在 2026-02-20，在 H100 上服务 375M 到 0.6B 参数的排序模型 {{field LinkedIn 2026-02}}。工作负载只需要 prefill 与最后一个 token 的 logits。他们的瓶颈是分词器、ZMQ 消息、Python 垃圾回收、GIL 与调度器，没有一个是 GPU 内核。

批量分词把 P99 延迟从 4,583 ms 降到 464 ms。一条跳过 decode 的打分路径把 P99 从 6,220 ms 降到 454 ms。100 到 300 ms 的垃圾回收暂停，用一次预热与 `gc.freeze()` 消失了。375M 排序器从每块 GPU 每秒 750 条升到 2,200 条。LinkedIn 写了其中多数相关的 pull request，所以他们的「之前」是更旧的 SGLang。

**CERIT-SC**，一家捷克学术服务，在 2025 从 vLLM 迁到 SGLang，并报告到 2026-04 已服务 1000 亿 token {{field CERIT-SC 2026-04}}。他们的流量形状是教训。对 Kimi K2.6，中位提示是 2,179 个 token，第 95 百分位是 99,746 个 token，他们归因于智能体编码工具。他们的 SGLang 问题是工具调用漏进推理输出、罕见挂起，以及占住 KV 缓存的模型循环。他们的修复是运维上的：32K token 的输出上限，以及对会循环的工作负载用 presence penalty。他们仍跑两种引擎，按模型选择。

**蚂蚁集团**在 LMSYS 博客上发表了 H20 GPU 上、SGLang v0.5.2 的 DeepSeek-R1 部署，日期 2025-09-26 {{field Ant Group 2025-09}}。他们选专家并行 16 而不是 32，因为在 batch 32 时 EP16 给出每秒 675 个 token，对上 EP32 的 585。更多推测 draft token 在 batch 1 增益 21%，在 batch 32 大约损失 18%。他们卖三个延迟档，最严的一档、低于 30 ms TPOT，跑在 batch 12。测过的档位表是产品决策，这才是重点。

**我们的立场：** 读生产报告要看它的流量形状与修复顺序，永远不要看它的吞吐数字。LinkedIn 在 GPU 工作之前先修 CPU 工作。CERIT-SC 在调任何东西之前先限制输出。蚂蚁集团选更小的专家组，因为故障半径与它卖的 batch 大小比峰值吞吐更要紧。

```takeaways
- 钉死像 `lmsysorg/sglang:v0.5.22` 这样的镜像标签，并有意地升级。
- 只在有完整 CUDA toolkit 的主机上在镜像外跑。
- 把 `~/.cache/sglang` 与 Hugging Face 缓存挂到持久卷上。
- 用 `/ready` 做就绪探针，用关掉生成的 `/health` 做存活探针。
- 只向主进程发 SIGTERM，并在日志里检查排空行。
- 在 v0.5.22 要强制停止时设 `SGL_FORCE_SHUTDOWN`，永远不要只设 `SGLANG_FORCE_SHUTDOWN`。
- 在选终止宽限期之前先限制输出长度。
- 按图 7.1b 的顺序改设置，每次测过的跑只改一个。
- 在每一次你要比较的跑之前冲洗前缀缓存并记下时钟。
- 在重度驱逐下出现非法内存访问时，加大池或加上 --disable-cuda-graph。
```

Sources: python/sglang/srt/entrypoints/http_server.py (ready, health_generate, HEALTH_CHECK_TIMEOUT), python/sglang/srt/managers/tokenizer_manager.py (sigterm_watchdog, _SCHEDULER_EXIT_TIMEOUT_SECS), python/sglang/srt/environ.py (SGLANG_FORCE_SHUTDOWN, SGLANG_ENABLE_HEALTH_ENDPOINT_GENERATION, SGLANG_CACHE_DIR, redirect_third_party_caches, _handle_deprecated_envs) and python/sglang/__init__.py at v0.5.22; docs/docs/get-started/install.mdx at v0.5.22; capture/out/server-default.log, capture/out/server-default.command.txt, capture/out/shutdown-exploratory.log, capture/out/shutdown-exploratory.txt, capture/shutdown_probe.py, capture/gpu/incidents/l4-toolchain-failures.txt; python/sglang/benchmark/datasets/random.py at v0.5.22; issues #22511 and #35884; field reports: Doubleword, fergusfinn.com/blog/fast-sglang-starts (2026-04-06), LinkedIn Engineering, linkedin.com/blog/engineering/ai/scaling-llm-based-ranking-systems-with-sglang-at-linkedin (2026-02-20), CERIT-SC, blog.cerit.io/blog/run-llm2 (2025-10-19) and blog-dev.cerit.io/blog/llm3 (2026-04-27), Ant Group on the LMSYS blog, lmsys.org/blog/2025-09-26-sglang-ant-group (2025-09-26), capture/gpu/out-l4/os-release.txt, sections 3.2, 4.6, and 5.1 of this manual (the cache, clock, and memory checks), capture/gpu/out-l4/prefix-cache-flush.txt, capture/gpu/out-l4/greedy-output-cache-batch-dtype.txt, capture/gpu/out-l4/small-pool-crash.txt, capture/gpu/out-l4/eviction-multiturn.txt, section 4.1 of this manual (the cost of CUDA graphs on the L4).
