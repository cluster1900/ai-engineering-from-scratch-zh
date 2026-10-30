# 术语表

> 下面每个术语在整本手册里只有一个含义，并点名定义它的那一节。

每个术语只定义一次，在最后一列点名的那一节里。含义来自该标签的 SGLang 源码、捕获，以及各节引用的论文。

| 术语 | 本手册中的含义 | 定义于 |
|---|---|---|
| Acceptance length | 每次 verify 提交的 token 数：接受的 draft token 加一个奖励 token | [4.4](#s-speculative-decoding) |
| Attention backend | 为一批在分页 KV cache 上算 attention 的类 | [4.2](#s-attention-backend) |
| Attention data parallelism | 在一个 TP 组内，attention 层跑数据并行，而前馈或专家层仍跨所有 GPU 切开 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| Batch invariance | 一种内核属性：一行的结果不依赖其他行，因为归约顺序固定 | [4.6](#s-deterministic-inference-and-logprobs) |
| Bootstrap room | prefill 服务器和 decode 服务器用来找到彼此半条请求的号码 | [6.3](#s-prefill-decode-disaggregation) |
| Breakable graph | 在每个必须 eager 跑的算子处结束一段、跑那个算子、再开始下一段的捕获 | [4.1](#s-forwardmode-and-cuda-graphs) |
| Capture bucket | SGLang 在启动时为它记录一份 decode graph 的一个批大小 | [4.1](#s-forwardmode-and-cuda-graphs) |
| Concurrency (benchmark) | 每条请求端到端延迟之和除以运行时长 | [5.1](#s-sglang-benchmark-serving) |
| Constrained decoding | 在采样器选之前去掉每一个会破坏语法的 token | [4.5](#s-structured-outputs-with-xgrammar) |
| Counter | 只增不减的 Prometheus 总量，用窗口上的 rate 读 | [5.2](#s-the-metrics-endpoint) |
| CUDA graph | 一份固定形状和地址的内核启动记录，GPU 用一次 CPU 调用回放 | [4.1](#s-forwardmode-and-cuda-graphs) |
| Data parallelism (DP) | 模型的好几份完整副本，各有自己的请求和 KV cache | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| Decode | 产出每个下一个 token 的循环，每条请求每个 token 一次前向 | [1.3](#s-what-the-server-does-with-your-request) |
| DetokenizerManager | 把输出 token id 变成文本并送回 TokenizerManager 的进程 | [2.1](#s-sglang-serve-and-the-three-processes) |
| Draft model | 便宜地提出接下来几个 token 的小模型或小头 | [4.4](#s-speculative-decoding) |
| EPLB | 专家并行负载均衡器，记录专家使用并在 GPU 之间挪专家 | [6.2](#s-moe-serving-deepep-and-eplb) |
| Expert parallelism (EP) | 每层 MoE 的专家分到各 GPU，token 移到专家那里 | [6.2](#s-moe-serving-deepep-and-eplb) |
| ForwardMode | 一批上的标签，告诉模型运行器跑哪种前向 | [4.1](#s-forwardmode-and-cuda-graphs) |
| Gauge | 调度器在每个日志间隔覆盖的值，所以抓取只看到最新值 | [5.2](#s-the-metrics-endpoint) |
| GEMM backend | 乘量化权重的内核库 | [4.3](#s-quantization) |
| Goodput | 同时满足 TTFT 目标和 TPOT 目标的每秒请求数 | [1.3](#s-what-the-server-does-with-your-request) |
| Grammar queue | 语法仍在编译的请求列表 | [4.5](#s-structured-outputs-with-xgrammar) |
| Grouped-query attention | 好几个 query head 共享一个 key 和 value head，所以模型的 KV head 少于 attention head | [3.1](#s-kv-bytes-per-token-and-the-kv-pool) |
| HiCache | 分层缓存，把 radix 树从 GPU 内存延伸到主机内存和存储 | [3.5](#s-eviction-policies-and-hicache) |
| Histogram | 一组按桶的计数器，用窗口上的 rate 读百分位 | [5.2](#s-the-metrics-endpoint) |
| ITL | 两个流式块之间的每一个间隔，跨所有请求汇总 | [5.1](#s-sglang-benchmark-serving) |
| KV cache | 为每一层保存的、更早每个 token 的 key 和 value，好让 decode 不用再算一遍 | [3.1](#s-kv-bytes-per-token-and-the-kv-pool) |
| KV cache dtype | 缓存的 key 和 value 的格式 | [4.3](#s-quantization) |
| KV pool | 持有服务器保留的每个 token 的 key 和 value 的内存 | [1.2](#s-check-that-the-server-is-healthy) |
| L1, L2, L3 | HiCache 各层：GPU pool、钉住的主机内存里的 pool，以及可选的共享存储后端 | [3.5](#s-eviction-policies-and-hicache) |
| Logprob | 服务器采样自的分布下，一个 token 的对数概率 | [4.6](#s-deterministic-inference-and-logprobs) |
| Mamba layer | 为每条序列保留一份固定大小状态的状态空间或线性 attention 层 | [3.6](#s-hybrid-models-and-the-cache) |
| Match rate | 新请求与网关树匹配的字符数，除以请求长度 | [6.4](#s-sgl-model-gateway) |
| Memory release | `POST /release_memory_occupation` 按标签释放 GPU 内存，`POST /resume_memory_occupation` 还回去 | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| Model world | 合在一起持有一份模型副本的那组 GPU | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| Multi-head latent attention (MLA) | DeepSeek attention，每个 token 存一份压缩 latent，代替按 head 的 key 和 value | [3.1](#s-kv-bytes-per-token-and-the-kv-pool) |
| Native API | SGLang 端点，主要是 `POST /generate` | [2.5](#s-streaming-stop-strings-and-the-openai-api) |
| New token ratio | 调度器预期一条正在跑的请求还会用的剩余输出份额 | [2.3](#s-admission-and-retraction) |
| Offline quantization | 检查点已经存低比特权重和它们的 scale | [4.3](#s-quantization) |
| Online quantization | SGLang 在加载时转换全精度权重 | [4.3](#s-quantization) |
| OpenAI API | OpenAI 格式的 `/v1/chat/completions`、`/v1/completions` 和 `/v1/models` 端点 | [2.5](#s-streaming-stop-strings-and-the-openai-api) |
| Overlap scheduling | 一批的 CPU 活与另一批的 GPU 活同时跑 | [2.4](#s-the-overlap-scheduler) |
| 暂停与恢复（Pause and resume） | 带模式的 `POST /pause_generation`，默认 `abort` 结束每条正在跑的请求 | [7.2](#s-sglang-as-an-rl-rollout-engine) |
| Peak concurrent requests | 基准运行一秒内任一时刻活跃请求的最大计数 | [5.1](#s-sglang-benchmark-serving) |
| Pipeline parallelism (PP) | 整层按顺序去不同 GPU，`--pp-size` 设阶段数 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| Prefill | 整段 prompt 上的前向，算出它的 key、value 和第一个输出 token | [1.3](#s-what-the-server-does-with-your-request) |
| Prefill-decode disaggregation (PD) | 两种 SGLang 服务器，一种 prefill、一种 decode，KV 在它们之间移动 | [6.3](#s-prefill-decode-disaggregation) |
| RadixCache | 建在 token 序列上的 radix 树，节点持有边上那些 token 的 KV 槽下标 | [3.3](#s-radixcache) |
| ReqToTokenPool | 每条正在跑的请求一行、每个 token 位置一列的表 | [3.1](#s-kv-bytes-per-token-and-the-kv-pool) |
| Retraction | 从 decode 批里移走正在跑的请求以腾出它们的 KV 槽，并把它们放回队列 | [2.3](#s-admission-and-retraction) |
| Schedule policy | 准入前给等待队列排序的规则，用 `--schedule-policy` 设置 | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| Scheduler | 拥有 GPU、建每批、跑它并采样的单独进程 | [2.1](#s-sglang-serve-and-the-three-processes) |
| Scheduler loop | 在调度器进程里永远跑的函数，每轮一批 | [2.2](#s-the-scheduler-loop-and-schedule-policy) |
| Sliding-window attention (SWA) | 只读最近几千个 token 的 attention | [3.6](#s-hybrid-models-and-the-cache) |
| Stop condition | 结束一条请求的规则：stop token、stop 字符串、正则、长度上限、中止，或语法结束 | [2.5](#s-streaming-stop-strings-and-the-openai-api) |
| Tail-Optimized LRU (tlru) | 只保留下一轮延迟目标需要的那部分对话的逐出策略 | [3.5](#s-eviction-policies-and-hicache) |
| Tensor parallelism (TP) | 每层的权重矩阵切成 `--tp-size` 片，每 GPU 一片 | [6.1](#s-tp-size-dp-size-and-attn-dp-size) |
| Throughput | 跨所有用户的每秒输出 token 数 | [1.3](#s-what-the-server-does-with-your-request) |
| TokenizerManager | 主进程里接收每条请求、套 chat template 并分词的对象 | [2.1](#s-sglang-serve-and-the-three-processes) |
| TokenToKVPoolAllocator | KV 槽的空闲列表 | [3.1](#s-kv-bytes-per-token-and-the-kv-pool) |
| TPOT | 对每条请求，首 token 之后的时间除以剩余输出 token | [5.1](#s-sglang-benchmark-serving) |
| TreeNode | radix 树的一个节点，子节点按第一个 token 作键，边上有 token 行程 | [3.3](#s-radixcache) |
| TTFT | 从发出请求到收到第一个流式块的时间 | [5.1](#s-sglang-benchmark-serving) |
| Two-batch overlap (TBO) | 调度器把一批切成两个微批，好让一个跑 attention、另一个等通信 | [6.2](#s-moe-serving-deepep-and-eplb) |
| Verify pass | 目标模型对所有提出的 token 一次前向，接受最长匹配前缀并加一个 token | [4.4](#s-speculative-decoding) |
| Weight quantization | 用更少比特存模型权重，例如 FP8、FP4 或 INT4 | [4.3](#s-quantization) |
| Weight-update session | `begin_weight_update`，一次或多次 `update_weights_from_*` 调用，然后 `end_weight_update` | [7.2](#s-sglang-as-an-rl-rollout-engine) |

Sources: the term definitions in every file under sections/; front.md.
