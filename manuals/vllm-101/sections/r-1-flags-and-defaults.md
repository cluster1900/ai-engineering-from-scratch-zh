# 参数与默认值

> 本页按用户任务分组列出本手册用到的参数，以及它们在 0.31.0 中的默认值。

用本页查找某一节提到的参数。

默认值针对 0.31.0 在 CUDA GPU 上运行的 `vllm serve`，取自源码中的配置类。

## 服务器 {#s-ref-flags-and-defaults-server}

| 参数 | 默认值 | 设置什么 | 页面 |
|---|---|---|---|
| `--host` | 未设置，即所有网络接口 | 服务器监听的地址 | [服务器选项](#s-set-the-server-options-every-deployment-needs) |
| `--port` | 8000 | HTTP 端口 | [服务器选项](#s-set-the-server-options-every-deployment-needs) |
| `--served-model-name` | 模型名称 | 客户端在 `model` 中发送的名称 | [服务器选项](#s-set-the-server-options-every-deployment-needs) |
| `--api-key` | 未设置 | `/v1` 路由要求的 key | [服务器选项](#s-set-the-server-options-every-deployment-needs) |
| `--chat-template` | 模型自带的模板 | chat 模板，可以是文件或文本 | [服务器选项](#s-set-the-server-options-every-deployment-needs) |
| `--default-chat-template-kwargs` | 未设置 | 每个请求都使用的模板值 | [推理模型](#s-serve-reasoning-models) |
| `--reasoning-parser` | 未设置 | 把思考内容从回答中移出的 parser | [推理模型](#s-serve-reasoning-models) |
| `--enable-log-requests` | 关 | 每个请求一行日志 | [服务器选项](#s-set-the-server-options-every-deployment-needs) |

## 内存与长度 {#s-ref-flags-and-defaults-memory-and-length}

| 参数 | 默认值 | 设置什么 | 页面 |
|---|---|---|---|
| `--gpu-memory-utilization` | 0.92 | 一个实例占 GPU 总内存的比例 | [启动](#s-fix-out-of-memory-at-startup) |
| `--kv-cache-memory-bytes` | 未设置 | 以字节计的 KV cache 大小，会覆盖 cache 所占的比例 | [启动](#s-fix-out-of-memory-at-startup) |
| `--max-model-len` | 模型配置 | 一个请求的最长 prompt 加回答长度 | [长上下文](#s-serve-long-contexts-and-hybrid-models) |
| `--block-size` | 16 | 一个 KV block 中的 token 数，或 attention backend 偏好的值 | [block 池](#s-how-the-block-pool-manages-kv-memory) |
| `--kv-cache-dtype` | `auto` | KV cache 的数据类型，例如 `fp8` | [attention backend](#s-how-vllm-picks-an-attention-backend) |
| `--num-gpu-blocks-override` | 未设置 | 固定的 KV block 数，用于测试 | [启动](#s-fix-out-of-memory-at-startup) |

## 调度 {#s-ref-flags-and-defaults-scheduling}

| 参数 | 默认值 | 设置什么 | 页面 |
|---|---|---|---|
| `--max-num-batched-tokens` | 对 `vllm serve`，小于 70 GiB 的 GPU 或 A100 上为 2048，70 GiB 起为 8192，160 GiB 起为 16384 | 一个 step 的 token 预算 | [token 预算](#s-why-one-token-budget-replaces-a-prefill-phase) |
| `--max-num-seqs` | 小于 70 GiB 的 GPU 或 A100 上为 256，70 GiB 起为 1024 | 同时运行的最大请求数 | [token 预算](#s-why-one-token-budget-replaces-a-prefill-phase) |
| `--enable-chunked-prefill` | 开 | 把长 prompt 拆到多个 step 中 | [token 预算](#s-why-one-token-budget-replaces-a-prefill-phase) |
| `--async-scheduling` | 对大多数生成模型开启 | 在 GPU 运行时规划下一个 step | [Model Runner V2](#s-what-model-runner-v2-changed) |
| `--scheduling-policy` | `fcfs` | 先到先服务，或 `priority` | [token 预算](#s-why-one-token-budget-replaces-a-prefill-phase) |
| `--long-prefill-token-threshold` | 未设置 | 一个 step 中单个 prefill 的 token 上限 | [token 预算](#s-why-one-token-budget-replaces-a-prefill-phase) |

## Cache {#s-ref-flags-and-defaults-cache}

| 参数 | 默认值 | 设置什么 | 页面 |
|---|---|---|---|
| `--enable-prefix-caching` | 开 | 复用已缓存的前缀 block | [block 池](#s-how-the-block-pool-manages-kv-memory) |
| `--prefix-caching-hash-algo` | `sha256` | 每个 block 的哈希 | [block 池](#s-how-the-block-pool-manages-kv-memory) |
| `--disable-hybrid-kv-cache-manager` | 关 | 所有层类型共用一个 group | [长上下文](#s-serve-long-contexts-and-hybrid-models) |
| `--kv-transfer-config` | 未设置 | KV connector 及其角色 | [KV connector](#s-how-kv-connectors-move-the-cache) |

## 执行 {#s-ref-flags-and-defaults-execution}

| 参数 | 默认值 | 设置什么 | 页面 |
|---|---|---|---|
| `-O0` 到 `-O3` | `-O2` | 编译和 CUDA graph 级别 | [编译与 graph](#s-how-compile-and-cuda-graphs-are-captured) |
| `--enforce-eager` | 关 | 不编译、不用 CUDA graph，也不做 kernel 预热 | [编译与 graph](#s-how-compile-and-cuda-graphs-are-captured) |
| `--max-cudagraph-capture-size` | 由级别决定 | 捕获了 graph 的最大 batch | [编译与 graph](#s-how-compile-and-cuda-graphs-are-captured) |
| `--attention-backend` | 从列表中选出 | attention kernel，按枚举名指定 | [attention backend](#s-how-vllm-picks-an-attention-backend) |
| `--speculative-config` | 未设置 | 投机解码方法及其选项，以 JSON 给出 | [投机解码](#s-how-speculative-decoding-checks-drafts) |

## 并行 {#s-ref-flags-and-defaults-parallelism}

| 参数 | 默认值 | 设置什么 |
|---|---|---|
| `--tensor-parallel-size`, `-tp` | 1 | 拆分每一层的 GPU 数 |
| `--pipeline-parallel-size`, `-pp` | 1 | 把各层拆成 stage 的 GPU 数 |
| `--data-parallel-size`, `-dp` | 1 | 模型的完整副本数 |
| `--enable-expert-parallel` | 关 | 把 mixture-of-experts 模型的 expert 分散到多块 GPU 上 |

## 环境变量 {#s-ref-flags-and-defaults-environment-variables}

| 变量 | 默认值 | 设置什么 |
|---|---|---|
| `VLLM_ENABLE_V1_MULTIPROCESSING` | `1` | 让 engine core 运行在自己的进程中 |
| `VLLM_USE_V2_MODEL_RUNNER` | 未设置 | 锁定 model runner 的选择 |
| `VLLM_BATCH_INVARIANT` | `0` | 设为 `1` 时启用 batch-invariant 模式 |
| `VLLM_API_KEY` | 未设置 | API key，与 `--api-key` 的设置相同 |
| `VLLM_LOGGING_LEVEL` | `INFO` | vLLM 日志级别 |
| `VLLM_NO_USAGE_STATS` | `0` | 设为 `1` 时不收集使用统计 |

Sources: the vLLM source at v0.31.0 (vllm/config/cache.py, vllm/config/scheduler.py, vllm/config/compilation.py, vllm/config/model.py, vllm/config/parallel.py, vllm/engine/arg_utils.py, vllm/envs.py, vllm/entrypoints/launchers/cli_args.py, vllm/config/structured_outputs.py).
