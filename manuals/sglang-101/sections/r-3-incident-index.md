# 事故索引

> 本手册当作故事讲的那些失败，附带症状、原因、修复或状态，以及解释每一条的那一节。

各节用真实事故当证据。每一条都来自 SGLang 或 Miles 的 issue、pull request、现场报告，或我们自己的捕获。本索引按部分列出它们，好让你用自己日志里看到的症状来搜。open 或 closed 的状态是在 2026-10-16 核对的。

## 我们的捕获 {#s-ref-incident-index-our-capture}

| 事件 | 症状 | 原因 | 修复或状态 | 节 |
|---|---|---|---|---|
| 并发 32 时内存不足（[日志](manuals/sglang-101/capture/out/oom-exploratory.log)） | Metal 报告 `Insufficient Memory`，整个服务器进程树退出 | 池占用了启动时看到的空闲内存的 87% | `--mem-fraction-static 0.4` | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| MLX 上的 `--disable-overlap-schedule`（[日志](manuals/sglang-101/capture/out/server-no-overlap.log)） | 第一个真实 batch 上出现 `RuntimeError`，然后服务器经 SIGQUIT 退出并杀掉其进程树 | 无 overlap 的路径仍用两个设备上的张量调用 `FutureMap.stash` | 在 0.5.22 仍 open。保持 overlap 打开 | [2.4](#s-the-overlap-scheduler) |
| 进程组 SIGTERM（[日志](manuals/sglang-101/capture/out/server-default.log)） | 日志在关闭时报告崩溃 | 调度器子进程先死，所以父进程走了无排空的崩溃路径 | 只向主进程发送 SIGTERM | [7.1](#s-operating-sglang) |
| GB10 上的内存守卫（[记录](manuals/sglang-101/capture/gpu/incidents/gb10-memory-guard-pauses.txt)） | 调度器分配 KV 池时启动停下。我们没有保留那些启动的服务器日志 | 机器上的守卫守护进程停掉了调度器，它在 5 s 内长到 36.7 GiB | 为服务器停下或配置该守卫 | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| GB10 上的驱动 `NV_ERR_NO_MEMORY`（[记录](manuals/sglang-101/capture/gpu/incidents/gb10-driver-no-memory.txt)） | 内核日志里成批出现驱动内存不足行 | 这些突发落在 2026-10-16，也就是我们第一次启动的那天。我们没有保留那天的服务器日志，所以无法把每次突发对上某次启动 | 后来的捕获里每个服务器都变健康了。对健康告警，不要对这一行告警 | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| 无 CUDA 工具链的 L4 主机上的 pip install（[记录](manuals/sglang-101/capture/gpu/incidents/l4-toolchain-failures.txt)） | 四次失败启动：`Python.h`、`nvcc`、FlashInfer 头文件，然后 `-lcudart` | 启动时的内核编译器需要完整工具链 | 用镜像，或用带完整 CUDA 工具链的主机 | [7.1](#s-operating-sglang) |
| 带 `HF_HUB_OFFLINE=1` 的基准，日志未保留 | `random` 数据集对磁盘上每个模型都失败 | 该数据集从 Hugging Face Hub 下载 ShareGPT | `--dataset-name random-ids` 或本地 `--dataset-path` | [7.1](#s-operating-sglang) |
| L4 上的 `--chunked-prefill-size 8192`（[记录](manuals/sglang-101/capture/gpu/incidents/l4-chunk-8192-prefill-graph-oom.txt)） | 启动以 PyTorch `INTERNAL ASSERT FAILED` 结束 | 8,192 token 的 prefill 图需要的内存超过了 KV 池留下的 2.33 GB | 在 24 GB 卡上保持默认 chunk 4,096 | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| `--tp-size 2` 且第二块 L4 被共享（[记录](manuals/sglang-101/capture/gpu/incidents/l4-tp-unbalanced-memory.txt)） | 启动时 `RuntimeError: The memory capacity is unbalanced` | 另一用户的两个 pod 占用了第二块 GPU 的 3.5 GB | 用没有别人占用的 GPU，或只用一块 GPU | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| 两块 L4 上经 TCP 的 prefill 与 decode（[记录](manuals/sglang-101/capture/gpu/incidents/l4-pd-mooncake-tcp-queue.txt)，[摘要行](manuals/sglang-101/capture/gpu/incidents/l4-pd-summary-lines.txt)） | 基准把每个请求计为成功，重新分词的输出 token 为 0，平均 TTFT 为 0.00 ms | 通向小 decode 池的传输队列填满，传输会话失败 | 在每一次 disaggregated 基准里读 `Total generated tokens (retokenized)` | [6.3](#s-prefill-decode-disaggregation) |
| L4 上的 vLLM FlashInfer 采样器（[记录](manuals/sglang-101/capture/gpu/incidents/l4-vllm-flashinfer-jit.txt)） | JIT 构建后 `Engine core initialization failed` | 安装里的 CUDA 编译器与 CUDA 工具链头文件不匹配 | 贪婪基准用 `VLLM_USE_FLASHINFER_SAMPLER=0` | [5.3](#s-reading-other-peoples-benchmarks) |
| 带 `--attn-implementation triton` 的 Miles（[日志](manuals/sglang-101/capture/gpu/out-miles/true-on-policy-error.log)） | `ValueError: Specified attn_implementation="triton" is not supported` | 训练侧不接受 Triton 后端 | 用双方都支持的契约 | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| GB10 上的 Miles true on-policy（[日志](manuals/sglang-101/capture/gpu/out-miles/true-on-policy-fa3-error.log)） | SGLang 以 FA3 SM 断言停下，然后作业在 63 分钟里记了约 200,000 次 `503` 错误且从不失败 | FA3 接受 SM 8.0 到 9.0，而 rollout 循环重试一台死掉的引擎 | 看 SGLang 日志，并为你的 GPU 检查契约内核 | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| Miles 负载下的 GB10 关机（[记录](manuals/sglang-101/capture/gpu/incidents/gb10-boot-list.txt)） | 机器在 2026-10-18 关机三次 | 日志没有记录原因 | 脚本在 GPU 达到 84 C 时暂停容器 | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| 面向 Qwen3-30B-A3B 的 EAGLE-3 draft | 启动拒绝：目标上下文长度 262144 大于派生出的 2048 | draft 配置声明 2,048 个位置 | `SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1`，与 SGLang cookbook 的设置相同。Qwen3-8B draft 声明 40,960 个位置，不用它也能启动 | [4.4](#s-speculative-decoding) |
| L4 sweep 中的热降速（[记录](manuals/sglang-101/capture/gpu/incidents/l4-thermal-throttle.txt)） | CUDA graphs 没有增益，同一点的不同种子相差 49% | GPU 0 跑在 87 °C 与 360 MHz（相对 2,040 MHz），热降速已激活 | 每次运行都记录 GPU 时钟与温度 | [5.1](#s-sglang-benchmark-serving) |
| 默认服务器上温度为 0（[日志](manuals/sglang-101/capture/gpu/out-gb10/determinism.txt)） | 在 GB10 上 5 次相同请求里有 2 个不同答案 | 我们的运行没有隔离出原因 | `--enable-deterministic-inference` 给出 5 次里 1 个答案 | [4.6](#s-deterministic-inference-and-logprobs) |

## 第 1 部分与第 2 部分：请求路径 {#s-ref-incident-index-part-1-and-part-2-the-request-path}

| 事件 | 症状 | 原因 | 修复或状态 | 节 |
|---|---|---|---|---|
| LinkedIn field report, 2026-02 | 小排名模型上 P99 延迟到秒级 | 分词、ZMQ 消息、垃圾回收、GIL 与调度器 | 批量分词、打分路径，以及热身后的 `gc.freeze`（pull request 9241） | [1.2](#s-check-that-the-server-is-healthy), [2.1](#s-sglang-serve-and-the-three-processes) |
| [#36889](https://github.com/sgl-project/sglang/issues/36889) | `--max-running-requests 8` 被接受，但吞吐卡在 2 条流 | Mamba 状态缓存把运行中请求上限封到 2 | 只有一行 info 报告该上限 | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| [#8463](https://github.com/sgl-project/sglang/issues/8463) | 反复出现 `KV cache pool is full. Retract requests.`，然后健康检查失败 | 回撤无法释放足够内存并重复 | 未修复即关闭。在 0.5.22 调度器会中止最后一个请求 | [2.3](#s-admission-and-retraction) |
| [#26248](https://github.com/sgl-project/sglang/issues/26248) | 回撤后 decode 从约 429 落到 20 到 38 tokens per second | 未记录 | 因不活跃关闭 | [2.3](#s-admission-and-retraction) |
| [#14972](https://github.com/sgl-project/sglang/issues/14972) | 在 94% 使用率且 overlap 打开时，`KV cache pool is full` 之后分配失败 | 回撤没有计入晚一步结束的请求 | Pull request [#15626](https://github.com/sgl-project/sglang/pull/15626) 未合并即关闭。0.5.22 调度器会处理它 | [2.4](#s-the-overlap-scheduler) |
| [#34740](https://github.com/sgl-project/sglang/issues/34740) | 反分词工作随输出长度的平方增长 | 永远组不成字符的字节 token 从不推进偏移 | Open | [2.5](#s-streaming-stop-strings-and-the-openai-api) |

## 第 3 部分：KV 缓存 {#s-ref-incident-index-part-3-the-kv-cache}

| 事件 | 症状 | 原因 | 修复或状态 | 节 |
|---|---|---|---|---|
| [#39675](https://github.com/sgl-project/sglang/issues/39675) | Apple MPS 上第一次 prefill 内存不足 | 未知容量使分数变成 0.95 | 设置 `--mem-fraction-static` | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| [#42510](https://github.com/sgl-project/sglang/issues/42510) | draft 池分配失败 | 在为目标池定尺寸时 draft 模型副本仍留在内存里 | 已报告 | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| [#6027](https://github.com/sgl-project/sglang/issues/6027) | 64K-token 的 DeepSeek-V3 提示在 attention 里内存不足 | 日志报告有空间容纳 274,934 个 KV token，attention 仍耗尽 | 降低该分数 | [3.2](#s-mem-fraction-static-and-startup-sizing) |
| [#43201](https://github.com/sgl-project/sglang/issues/43201) | 更早的帖子描述一个已不存在的 `ChunkCache` 类 | 该类在 2026-10-08 被删除 | `--disable-radix-cache` 构建一个禁用的 `UnifiedRadixCache` | [3.3](#s-radixcache) |
| [#32459](https://github.com/sgl-project/sglang/issues/32459) | 带 EAGLE 时深提示命中率从 97 落到 40 到 53% | 推测用的额外 KV 迫使树驱逐提示 | 每加一个功能都测量命中率 | [3.3](#s-radixcache) |
| [#35129](https://github.com/sgl-project/sglang/issues/35129) | 命中率 66.8%，且 HiCache 回载驱逐了其他会话 | 系统提示里的随机哈希与轮换消息，以及没有空间的回载 | 提示编辑把命中率移到 94.4% | [3.4](#s-prefix-friendly-prompts), [3.5](#s-eviction-policies-and-hicache) |
| Jarvislabs field report, 2026-08 | 23% 的输入 token 被重新计算 | 请求去了没有其前缀的服务器 | 一个头把每个对话钉到一块 GPU：命中率 64.7 到 92.1% | [3.4](#s-prefix-friendly-prompts), [6.4](#s-sgl-model-gateway) |
| [#30760](https://github.com/sgl-project/sglang/issues/30760) | 一个张量并行 rank 在预取检查里永远等待，而其他 rank 继续前进 | 未记录 | 已报告 | [3.5](#s-eviction-policies-and-hicache) |
| [#42465](https://github.com/sgl-project/sglang/issues/42465) | 打开 HiCache 时，成批 540,000-token 提示让每个 rank 挂起 | 未记录 | 同样的提示在没有 HiCache 时能跑 | [3.5](#s-eviction-policies-and-hicache) |
| [#39830](https://github.com/sgl-project/sglang/issues/39830) | 在 20 次里有 20 次主机层命中时，对另一条提示给出流畅答案 | 混合线性注意力模型上的 HiCache 主机层命中 | 在信任缓存之前先测混合模型 | [3.6](#s-hybrid-models-and-the-cache) |
| [#22935](https://github.com/sgl-project/sglang/issues/22935) | 相同提示没有复用任何 token | 一次节点拆分创建了没有 Mamba 状态的节点 | 对重复提示读 `#cached-token` | [3.6](#s-hybrid-models-and-the-cache) |
| [#37834](https://github.com/sgl-project/sglang/issues/37834) | 命中率从 88.2 落到 65.9%，TTFT 从 226 ms 升到 1,063 ms | 一个选项强制了 `no_buffer` Mamba 策略 | 除非你测出更好，否则保持 `--mamba-radix-cache-strategy auto` | [3.6](#s-hybrid-models-and-the-cache) |
| [#36131](https://github.com/sgl-project/sglang/issues/36131) | 混合 SWA 模型的单流 decode 更低 | 新默认在窗口外释放 SWA 槽 | 已报告 | [3.6](#s-hybrid-models-and-the-cache) |

## 第 4 部分：每一次前向 {#s-ref-incident-index-part-4-each-forward-pass}

| 事件 | 症状 | 原因 | 修复或状态 | 节 |
|---|---|---|---|---|
| [#23769](https://github.com/sgl-project/sglang/issues/23769) | DeepSeek-V4-Pro-FP8 在图捕获期间退出 | 有注意力数据并行时，图 batch size 按 rank 计数 | 更小的图 batch size 或更低的分数 | [4.1](#s-forwardmode-and-cuda-graphs) |
| [#36478](https://github.com/sgl-project/sglang/issues/36478) | `disable_piecewise_cuda_graph=True` 在 Python API 里引发 `TypeError` | Pull request #23906 把该字段移进按阶段的图配置 | `cuda_graph_backend_prefill="disabled"` | [4.1](#s-forwardmode-and-cuda-graphs) |
| joshua8.ai field report, 2026-01 | SGLang 在 SM120 卡上只在 eager 模式跑，且 NVFP4 不跑 | 新架构支持 | 在比较引擎之前先检查捕获与权重格式 | [4.1](#s-forwardmode-and-cuda-graphs), [4.3](#s-quantization) |
| [#17411](https://github.com/sgl-project/sglang/issues/17411) | H20 上中位 ITL 从 39.44 ms 到 283.52 ms | FlashInfer 0.6.1 让 Hopper attention 内核回退 | SGLang 把 `fa3` 做成 Hopper 默认 | [4.2](#s-attention-backend) |
| Cloudflare field report, 2026-08 | BF16 KV 缓存在并发 64 时内存不足 | 缓存装不下 | FP8 KV 缓存持有两倍 token | [3.1](#s-kv-bytes-per-token-and-the-kv-pool), [4.3](#s-quantization) |
| Pivot News summary, 2026-05 | 加入 RTX 4090 卡时混合集群崩溃 | FP4 路径要求计算能力 10.0 | 更旧的卡没有软件路径 | [4.3](#s-quantization), [5.3](#s-reading-other-peoples-benchmarks) |
| [#5274](https://github.com/sgl-project/sglang/issues/5274) | EAGLE-3 在并发 20 时把吞吐从 217.8 降到 164.4 tokens per second | 推测花费了满 batch 需要的算力 | 在小 batch 上跑推测 | [4.4](#s-speculative-decoding) |
| [#6783](https://github.com/sgl-project/sglang/issues/6783) | 在 10K 输入时接受率落到 1.2 token | draft 配置有 2,048 个位置且没有 rope scaling | 给 draft 配置加上 rope scaling 与 131,072 个位置 | [4.4](#s-speculative-decoding) |
| David Noel Ng field report, 2026-08 | DeepSeek-V4-Flash 上接受率 1.3 到 1.8 token | draft 加载器没有映射共享专家权重 | Pull request [#33276](https://github.com/sgl-project/sglang/pull/33276) | [4.4](#s-speculative-decoding) |
| [#37707](https://github.com/sgl-project/sglang/issues/37707) | 字符串字段接受了短于其 `minLength` 的值 | 字段还有 `pattern` 时 xgrammar 丢掉了该规则 | Open | [4.5](#s-structured-outputs-with-xgrammar) |
| [#38863](https://github.com/sgl-project/sglang/issues/38863) | 推测下 bitmask CPU 时间随输出长度增长 | 一个回滚方法在每次调用时复制一份调试列表 | Open | [4.5](#s-structured-outputs-with-xgrammar) |
| [#43055](https://github.com/sgl-project/sglang/issues/43055) | gpt-oss-20b 在前缀模式下给出不同的贪婪输出 | 确定性 Triton 内核把 KV tile 对齐到修剪后的前缀 | Open | [4.6](#s-deterministic-inference-and-logprobs) |
| [#43413](https://github.com/sgl-project/sglang/issues/43413), [#36174](https://github.com/sgl-project/sglang/issues/36174), [#31261](https://github.com/sgl-project/sglang/issues/31261) | 确定性模式不覆盖 Mamba2 混合、DeepSeek-V4 或 Qwen3.5 | 没有批不变内核的架构 | 尚不支持 | [4.6](#s-deterministic-inference-and-logprobs) |
| [#39597](https://github.com/sgl-project/sglang/issues/39597) | 带 DFLASH 重启后贪婪文本变了 | FlashInfer 自动调优选了其他内核策略 | `--disable-flashinfer-autotune` 或确定性模式 | [4.6](#s-deterministic-inference-and-logprobs) |

## 第 5 部分：测量 {#s-ref-incident-index-part-5-measuring}

| 事件 | 症状 | 原因 | 修复或状态 | 节 |
|---|---|---|---|---|
| [#3196](https://github.com/sgl-project/sglang/issues/3196) | 八块 H200 上 DeepSeek V3 只有 13 tokens per second | 脚本按词计数并把 TTFT 算进速率 | 用基准客户端测量 | [5.1](#s-sglang-benchmark-serving) |
| `sglang:utilization` | 繁忙服务器上该 gauge 读数为 0 | 代码注释链到 #22713 的一次回退 | 用队列与延迟序列 | [5.2](#s-the-metrics-endpoint) |
| [#35884](https://github.com/sgl-project/sglang/issues/35884) | 失败的健康探测增加了负载 | 超时的 `/health` 调用没有取消其请求 | 把失败的探测当作一种症状 | [5.2](#s-the-metrics-endpoint), [7.1](#s-operating-sglang) |
| [#22511](https://github.com/sgl-project/sglang/issues/22511) | GLM-5 高负载下出现 "health check failed" | 负载下 20 s 没有输出到达反分词器 | 用 `/ready` 做就绪 | [5.2](#s-the-metrics-endpoint), [7.1](#s-operating-sglang) |
| AIMultiple, 2026-01 | 至少五篇帖子重复 "SGLang 29% faster" | 一次列出 SGLang v0.2.3 的离线测试 | 没有版本的结果忽略 | [1.3](#s-what-the-server-does-with-your-request), [5.3](#s-reading-other-peoples-benchmarks) |
| [vLLM discussion #17221](https://github.com/vllm-project/vllm/discussions/17221) | SGLang 看起来用 7 GB 对上 21 GB | 错误的标志：`--context-length` 对应 `--max-model-len` | 用匹配的标志比较引擎 | [5.3](#s-reading-other-peoples-benchmarks) |

## 第 6 部分与第 7 部分：集群与运维 {#s-ref-incident-index-part-6-and-part-7-fleets-and-operations}

| 事件 | 症状 | 原因 | 修复或状态 | 节 |
|---|---|---|---|---|
| [#19953](https://github.com/sgl-project/sglang/issues/19953) | 跨节点的注意力数据并行在第一条消息上挂起 | ZeroMQ socket 在 IPv6 的 `--dist-init-addr` 上未绑定 IPv6 | 有人提出过修复。我们无法确认是否合并 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| [#9787](https://github.com/sgl-project/sglang/issues/9787) | 一块 prefill GPU 空闲，然后每个 prefill 进程崩溃 | 不平衡路由在 DeepEP dispatch 里给一块 GPU 送了太多 token | 更小的 chunk、调好的专家放置，以及 EPLB | [6.2](#s-moe-serving-deepep-and-eplb) |
| [#12591](https://github.com/sgl-project/sglang/issues/12591) | 带 disaggregation 的 TTFT 高于单机 | 旧的 Mooncake 传输引擎 | 升级 Mooncake | [6.3](#s-prefill-decode-disaggregation) |
| [#9266](https://github.com/sgl-project/sglang/issues/9266) | 64 并发请求时 "Prefill bootstrap failed" | 路由器给 prefill 客户端的超时太短 | Pull request [#9803](https://github.com/sgl-project/sglang/pull/9803) | [6.3](#s-prefill-decode-disaggregation) |
| [#9926](https://github.com/sgl-project/sglang/issues/9926) | "Aborted by AbortReq" 错误 | 客户端或路由器中止 | 在传输之前检查超时 | [6.3](#s-prefill-decode-disaggregation) |
| Novita AI field report, 2026-01 | 带 disaggregation 与 overlap 时 TTFT 差很多 | KV 传输等待下一次内核启动 | 他们的标志不在 0.5.22 代码里 | [6.3](#s-prefill-decode-disaggregation) |
| [#22095](https://github.com/sgl-project/sglang/issues/22095) | GB200 NVL72 上两倍吞吐回退 | SGLang 外的路由器换了版本 | 把路由器与引擎一起钉住并做基准 | [6.4](#s-sgl-model-gateway) |
| [#10608](https://github.com/sgl-project/sglang/issues/10608) | 带 `cache_aware` 时 "Failed to select prefill/decode worker" | 带 disaggregation 与 Kubernetes 发现的路由 | 用户切到 round robin | [6.4](#s-sgl-model-gateway) |
| CERIT-SC field report, 2026-04 | 推理输出里的工具调用、罕见挂起，以及占用 KV 的循环 | 带很长提示的 agent 流量 | 32K 输出上限与 presence penalty | [7.1](#s-operating-sglang) |
| Doubleword field report, 2026-04 | 冷启动 695 s | 531 s 的权重加载与冷内核缓存 | 持久缓存与进程检查点：9.6 s | [7.1](#s-operating-sglang) |
| [radixark/miles#860](https://github.com/radixark/miles/issues/860) | `/release_memory_occupation` 对滑动窗口模型无效 | SWA 池关掉了内存节省器 | Open | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| [radixark/miles#1485](https://github.com/radixark/miles/issues/1485) | 张量并行 2 时 `down_proj` 输出不同 | 两个引擎以不同顺序对 BF16 部分结果求和 | Open | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| [radixark/miles#3714](https://github.com/radixark/miles/issues/3714) | 权重传输以 `Message truncated` 失败 | 确定性服务把 NCCL 通道上限钉到 8，而训练器用 24 | Open | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| [radixark/miles#3277](https://github.com/radixark/miles/issues/3277) | 回撤后新 MoE 路由挨着旧的对数概率 | 在新权重下重新 prefill 覆盖了已记录的路由 | Open | [7.2](#s-sglang-as-an-rl-rollout-engine) |

Sources: the incident paragraphs of every section under sections/; capture/out/oom-exploratory.log, server-no-overlap.log, server-default.log; capture/gpu/incidents/gb10-memory-guard-pauses.txt, gb10-driver-no-memory.txt, l4-toolchain-failures.txt, l4-thermal-throttle.txt; capture/gpu/out-gb10/determinism.txt and deterministic-determinism.txt; docs/cookbook/specbundle/specbundle_usage.mdx at v0.5.22; the GitHub issues and pull requests linked in the tables, capture/gpu/incidents/l4-chunk-8192-prefill-graph-oom.txt, capture/gpu/incidents/l4-tp-unbalanced-memory.txt, capture/gpu/incidents/l4-pd-mooncake-tcp-queue.txt, capture/gpu/incidents/l4-pd-summary-lines.txt, capture/gpu/incidents/l4-vllm-flashinfer-jit.txt, capture/gpu/incidents/gb10-boot-list.txt, capture/gpu/out-miles/true-on-policy-error.log, capture/gpu/out-miles/true-on-policy-fa3-error.log
