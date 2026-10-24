# 按症状排查故障

> 大多数故障都有已知的原因，一行日志或一个指标就能看出来。

出了问题，你知道看到了什么，却不知道为什么。读完本节后，你能把症状对应到原因，运行一项检查，并应用一个修复。

在列表里找到你的症状。每个条目给出可能的原因、确认它的检查和修复方法。issue 编号指 vLLM 仓库中的 issue，状态以 0.31.0 版本时为准。标注“来自 vLLM 文档”的条目取自 0.31.0 的 vLLM 故障排查指南，我们没有复现过。

```figure
id: fig-7-1
kind: decision
title: symptom to page
claim: Start from the symptom, check one number or log line, and then go to the page that fixes it.
caption: Each row is one entry below, in the same order. Read the symptom, the first check, and where the fix is. From our runs, the vLLM issues, and the vLLM documentation.
```

## 服务器无法启动 {#s-troubleshoot-by-symptom-the-server-does-not-start}

### 启动在下载模型时卡住 {#s-troubleshoot-by-symptom-the-start-hangs-while-it-downloads-the-model}

- **原因：** 下载很慢，或者模型需要 Hugging Face token。来自 vLLM 文档。
- **检查：** 日志停在 `Model loading took` 这一行之前，并且 Hugging Face cache 文件夹增长缓慢或完全不增长。
- **修复：** 先用 `hf download` 命令下载模型，对访问受限的模型设置 `HF_TOKEN`。然后设置 `HF_HUB_OFFLINE=1`，让 vLLM 只使用本地副本。

### 启动时报错说模型不受支持 {#s-troubleshoot-by-symptom-the-start-stops-with-a-message-that-the-model-is-not-supported}

- **原因：** vLLM 0.31.0 不包含这个模型架构，或者缺少某个包导致 vLLM 无法导入模型代码。来自 vLLM 文档。
- **检查：** 错误信息列出失败的架构，例如 `Model architectures [...] are not supported for now` 或 `failed to be inspected`。
- **修复：** 查看你所用版本的支持模型列表。如果模型在列表里，就在错误上方的日志里找导入失败的信息。

### 启动时报错提到驱动或 PTX 工具链 {#s-troubleshoot-by-symptom-the-start-stops-with-a-message-about-the-driver-or-the-ptx-toolchain}

- **原因：** vLLM 的 CUDA 构建比你的 NVIDIA 驱动所支持的更新。来自 vLLM 文档。
- **检查：** 错误信息是 `The NVIDIA driver on your system is too old`，或者说 PTX 是用不受支持的工具链编译的。
- **修复：** 更新驱动。在官方镜像中，对某些数据中心 GPU，`-e VLLM_ENABLE_CUDA_COMPATIBILITY=1` 会启用 CUDA 兼容库。

### 启动时报错提到 KV cache 和最大长度 {#s-troubleshoot-by-symptom-the-start-stops-with-a-message-about-the-kv-cache-and-the-maximum-length}

- **原因：** 一个长度为 `--max-model-len` 的请求所需的 KV cache，超过了权重之后剩下的空间。
- **检查：** 错误信息给出能放下的最大长度。
- **修复：** 把 `--max-model-len` 设为你最长的请求。[启动页](#s-fix-out-of-memory-at-startup)有详细说明。

### 启动时报错提到空闲内存和内存比例 {#s-troubleshoot-by-symptom-the-start-stops-with-a-message-about-free-memory-and-the-memory-fraction}

- **原因：** 另一个进程占用了 GPU 内存，所以你要求的那部分并不空闲。
- **检查：** 运行 `nvidia-smi`，查看 GPU 上的进程。
- **修复：** 把 `--gpu-memory-utilization` 降到空闲比例以下，或者停掉另一个进程。

### 设置 FP8 KV cache 后服务器在启动时崩溃 {#s-troubleshoot-by-symptom-the-server-crashes-at-start-after-you-set-an-fp8-kv-cache}

- **原因：** FP8 cache 让 vLLM 切换到 FlashInfer backend，而 FlashInfer 无法编译它的 kernel。issue 60262 跟踪这个问题，目前仍未关闭。
- **检查：** 找到指明 attention backend 的那一行，以及它之后的 FlashInfer 错误。
- **修复：** 加上 `--attention-backend TRITON_ATTN`。[FP8 KV cache 页](#s-fit-more-users-with-an-fp8-kv-cache)展示了我们的情况。

### 首次启动时报错说缺少 nvcc {#s-troubleshoot-by-symptom-the-first-start-stops-with-a-message-that-nvcc-is-missing}

- **原因：** FlashInfer 在首次启动时编译它的 kernel，而主机有驱动却没有 CUDA toolkit。我们在 L4 节点上用 uv 全新安装 0.31.0 时遇到过。
- **检查：** 错误来自 `flashinfer/jit/cpp_ext.py`，内容是 `Could not find nvcc and default cuda_home='/usr/local/cuda' doesn't exist`。
- **修复：** 安装 CUDA toolkit，把 `CUDA_HOME` 指向它，再重新启动。或者使用自带 toolkit 的官方镜像。

### 设置 CUDA_HOME 后 sampler 编译失败 {#s-troubleshoot-by-symptom-the-sampler-fails-to-compile-after-you-set-cuda-home}

- **原因：** 主机上的 toolkit 与 PyTorch 的 CUDA 构建不匹配，所以 FlashInfer sampler 无法编译。主机 toolkit 为 nvcc 13.4 时，我们在 L4 节点上遇到过。
- **检查：** 错误信息是 `CUDA compiler and CUDA toolkit headers are incompatible`。
- **修复：** 安装与你的 PyTorch 构建匹配的 toolkit 版本。或者像 [FP8 KV cache 页](#s-fit-more-users-with-an-fp8-kv-cache)那样，用 `VLLM_USE_FLASHINFER_SAMPLER=0` 启动。

### DGX Spark 内存不足，尽管内存比例留有余量 {#s-troubleshoot-by-symptom-a-dgx-spark-runs-out-of-memory-although-the-fraction-leaves-room}

- **原因：** 在统一内存上，`--gpu-memory-utilization` 并不总能限制 vLLM 占用的内存。issue 46307 报告比例为 0.70 时占用了约 112 GiB，它因过期被关闭，没有修复。issue 44740 报告在 GB10 上使用 MTP 投机解码时 KV cache 过大，目前仍未关闭。
- **检查：** 把 `Available KV cache memory` 这一行与你预期的比例比较，并在启动期间观察 `free -g`。
- **修复：** 用 `--kv-cache-memory-bytes` 以字节为单位设置 cache 大小。[DGX Spark 页](#s-size-memory-on-a-dgx-spark)有详细说明。

### DGX Spark 首次启动要花很多分钟 {#s-troubleshoot-by-symptom-the-first-start-on-a-dgx-spark-takes-many-minutes}

- **原因：** 权重加载会把每个 tensor 从文件映射中复制出来，而这个复制在 GB10 上很慢。issue 58726 跟踪这个问题，目前仍未关闭。
- **检查：** 读 `Model loading took` 这一行。我们 57 GiB 的加载花了 330 秒。
- **修复：** 把权重放在本地硬盘上，并让服务器保持运行。[DGX Spark 页](#s-size-memory-on-a-dgx-spark)有详细说明。

### 启动在编译步骤失败 {#s-troubleshoot-by-symptom-the-start-fails-in-the-compile-step}

- **原因：** 编译 cache 损坏，或者 Triton 库与你的 PyTorch 不匹配。来自 vLLM 文档。
- **检查：** 错误来自 `torch.compile` 或 `torch/_inductor` 文件夹。
- **修复：** 用 `VLLM_DISABLE_COMPILE_CACHE=1` 启动一次。如果这样能行，就删除 `~/.cache/vllm/torch_compile_cache`。调试期间用 `-O0` 跳过编译启动。

### 多 GPU 服务器在启动时卡住 {#s-troubleshoot-by-symptom-a-server-on-several-gpus-hangs-at-start}

- **原因：** 由于网络、驱动或缺少共享内存挂载，GPU 之间无法通过 NCCL 互相访问。来自 vLLM 文档。
- **检查：** 用 `NCCL_DEBUG=TRACE` 重新启动，看日志停在哪里。运行[并行页](#s-choose-tensor-pipeline-or-data-parallelism)介绍的 NCCL 测试。
- **修复：** 给容器加上 `--ipc=host` 或一个足够大的 `/dev/shm`。在 PCIe 机器上遇到 peer access 错误时，vLLM 指南建议设置 `NCCL_CUMEM_HOST_ENABLE=0` 或更新驱动。

### 升级后最大长度变短了 {#s-troubleshoot-by-symptom-the-maximum-length-is-shorter-after-an-upgrade}

- **原因：** 0.30.0 版本改变了 vLLM 读取 YaRN 等上下文缩放的方式，一些模型现在推导出的长度更短。
- **检查：** 把启动日志里推导出的长度和旧的长度比较。
- **修复：** 在确认模型支持该长度之后，自己设置 `--max-model-len`。

## 服务器运行期间请求失败 {#s-troubleshoot-by-symptom-requests-fail-while-the-server-runs}

### 请求返回 HTTP 400，提示最大上下文长度 {#s-troubleshoot-by-symptom-a-request-returns-http-400-about-the-maximum-context-length}

- **原因：** prompt token 数加上 `max_tokens` 超过了 `--max-model-len`。
- **检查：** 错误信息是 `This model's maximum context length is`，并给出具体数量。当仅 `max_tokens` 就超过上限时，错误信息会说 `max_tokens` 不能大于 `max_model_len`，我们在 L4 上就遇到过。
- **修复：** 发送更短的 prompt 或更小的 `max_tokens`；如果池允许，也可以用更大的最大长度启动服务器。

### 引擎出错后每个请求都失败 {#s-troubleshoot-by-symptom-every-request-fails-after-an-error-in-the-engine}

- **原因：** engine core 进程停止了，例如在 GPU 错误之后。API 服务器仍在运行，但无法提供服务。来自 vLLM 源码。
- **检查：** 日志显示 `EngineCore encountered an issue`，真正的错误在它上方的几行里。
- **修复：** 根据前面几行修复原因，然后重启服务器。让你的编排器去重启它，因为服务器不会自行恢复。

## 服务器很慢 {#s-troubleshoot-by-symptom-the-server-is-slow}

### 首 token 要好几秒，但之后的流式输出很快 {#s-troubleshoot-by-symptom-the-first-token-takes-seconds-but-the-stream-is-fast-after-it}

- **原因：** 池或 batch 满了，请求在队列里等待。
- **检查：** `vllm:num_requests_waiting` 大于 0，并且 `vllm:kv_cache_usage_perc` 接近 1。
- **修复：** 在这块 GPU 上服务更少的用户，或者用 FP8 KV cache 或更短的最大长度给池腾出空间。

### 用户多时流式输出出现长间隔 {#s-troubleshoot-by-symptom-the-stream-has-long-gaps-when-many-users-are-active}

- **原因：** 新 prompt 和正在运行的请求共享 decode step，而长 prompt 占用了每个 step 的很大一部分。
- **检查：** 比较 P99 ITL 和中位 ITL。差距大说明是停顿，而不是 GPU 慢。
- **修复：** 降低 token 预算，如 [token 预算页](#s-keep-long-prompts-from-stalling-short-ones)所示。在我们的机器上，间隔还取决于 prompt 长度和引擎，如[引擎页](#s-decide-between-vllm-and-sglang)所示。

### 抢占计数在上升 {#s-troubleshoot-by-symptom-the-preemption-counter-rises}

- **原因：** 一个运行中的请求需要新的 block，却没有空闲的。vLLM 会停下这个请求，稍后重新计算。
- **检查：** `vllm:num_preemptions_total` 上升，周期性日志行里显示抢占次数。
- **修复：** 提高 `--gpu-memory-utilization`，或者降低 `--max-num-seqs` 或 `--max-num-batched-tokens`。

### N-gram 投机解码的收益低于预期 {#s-troubleshoot-by-symptom-n-gram-speculation-gives-less-than-you-expected}

- **原因：** 在 0.31.0 中，n-gram 方法会让 vLLM 使用较旧的 model runner，并关闭异步调度。
- **检查：** 启动日志中有一条异步调度已关闭的警告。
- **修复：** 在你的流量上把它和不使用投机解码的情况比较，两边使用相同的 model runner。

### 以 eager 模式启动后的头几个请求很慢 {#s-troubleshoot-by-symptom-the-first-requests-after-a-start-in-eager-mode-are-slow}

- **原因：** 从 0.31.0 起，`--enforce-eager` 也会关闭启动时编译 kernel 的预热，所以头几个请求要去编译它们。
- **检查：** 头几个请求比其余的慢。
- **修复：** 在承接流量之前先发几个预热请求，或者改用 `-O0`。

### DGX Spark 上的 NVFP4 decode 比旧版本慢 {#s-troubleshoot-by-symptom-nvfp4-decode-is-slower-on-a-dgx-spark-than-on-older-releases}

- **原因：** issue 59770 报告从 0.29.0 起，GB10 上某个 NVFP4 模型的 decode 变慢了。目前仍未关闭。
- **检查：** 比较你所用版本和 0.28 上每个 token 的时间。
- **修复：** 在 issue 关闭之前，为该模型锁定更快的那个版本。

## 输出不对 {#s-troubleshoot-by-symptom-the-output-is-wrong}

### 回答以一大段思考内容开头 {#s-troubleshoot-by-symptom-the-answer-starts-with-a-long-thinking-block}

- **原因：** Qwen3 这样的推理模型在没有 reasoning parser 的情况下运行。
- **检查：** `content` 字段以 `<think>` 开头。
- **修复：** 用该模型对应的 parser 启动服务器，例如 `--reasoning-parser qwen3`。[推理模型页](#s-serve-reasoning-models)有详细说明。

### prefix cache 命中后模型不断重复同一个 token {#s-troubleshoot-by-symptom-the-model-repeats-one-token-after-a-prefix-cache-hit}

- **原因：** issue 60174 报告在 0.30 和 0.31 上，DFlash2 或 DSpark 投机解码与 prefix cache 一起运行时输出损坏。从第三个请求起，每个从缓存 block 开始的回答都是同一个 token 反复出现。它在 0.31.0 之后的 2026-10-22 关闭，所以要确认你的版本包含修复。
- **检查：** 问题只在 cache 命中后出现，并且用 `--no-enable-prefix-caching` 后消失。
- **修复：** 对该模型关闭 prefix cache 或这种投机解码方法。

### 开启投机解码时 JSON 输出无效 {#s-troubleshoot-by-symptom-json-output-is-invalid-with-speculative-decoding-on}

- **原因：** JSON schema 和投机解码方法可能在下一个 token 上产生分歧。issue 60830 在一个模型上展示了 MTP 的这个问题，它已关闭。
- **检查：** 不带 `--speculative-config` 运行相同的请求。
- **修复：** 升级，或者对 JSON 流量关闭投机解码。

### 输出每次运行都不一样 {#s-troubleshoot-by-symptom-the-output-changes-from-run-to-run}

- **原因：** vLLM 默认不保证输出相同。请求加入的 batch 会改变求和的顺序。prefix cache 命中也可能改变 greedy 输出。在我们用 Qwen3-0.6B、单用户的运行中，热 cache 改变了 32 个 greedy 输出中的 11 个。那块 GPU 是一块没有锁定时钟的共享 L4。改变 dtype，例如从 BF16 改为 FP16，也会改变大多数输出。
- **检查：** 单独发送同一个请求两次。如果回答一致，就是 batch 造成了变化。如果不一致，第二个请求可能命中了 prefix cache。用 `--no-enable-prefix-caching` 重复这个测试。如果这时回答一致，就是 cache 造成了变化。
- **修复：** 离线时设置 `VLLM_ENABLE_V1_MULTIPROCESSING=0`。在线时，batch-invariant 模式有帮助，但在 0.31.0 中它并不覆盖所有路径。在你要比较的几次运行之间重置 prefix cache。[可复现页](#s-get-reproducible-outputs)有相关说明。

## 基准测试不对 {#s-troubleshoot-by-symptom-the-benchmark-is-wrong}

### 第二次基准测试比第一次快 {#s-troubleshoot-by-symptom-the-second-benchmark-run-is-faster-than-the-first}

- **原因：** 使用固定种子时，random 数据集会再次发送相同的 prompt，于是由 prefix cache 来服务它们。在我们用 Qwen3-0.6B、16 个用户的测试中，不重置就重复运行，测得的中位 TTFT 约低 6 倍。那块 GPU 是一块没有锁定时钟的共享 L4。
- **检查：** 第二次运行期间 `vllm:prefix_cache_hits_total` 上升。
- **修复：** 每次运行前重置 prefix cache，使用新的种子，并记录被缓存的 token 数。[基准测试页](#s-benchmark-your-server-in-15-minutes)给出了流程。`POST /reset_prefix_cache` 路由只在 `VLLM_SERVER_DEV_MODE=1` 时存在，所以只在没有对外暴露的服务器上使用它。

```takeaways
- 在改动参数之前，先读最后几行日志以及等待数和 cache 指标。
- 在怪罪你的配置之前，先查看与你的模型、GPU 和版本相关的未关闭 issue。
- 一次只测试一个改动，使用相同的基准测试和时钟。
```

Sources: vLLM issues 44740, 46307, 58726, 59770, 60174, 60262, and 60830; the release notes for v0.30.0, v0.31.0, and v0.32.0; vLLM documentation at v0.31.0 (docs/usage/troubleshooting.md, docs/design/torch_compile.md, docs/configuration/optimization.md, docs/usage/reproducibility.md, docs/benchmarking/cli.md, docs/features/reasoning_outputs.md); the vLLM source at v0.31.0 (vllm/config/vllm.py, vllm/config/model.py, vllm/renderers/params.py, vllm/v1/engine/exceptions.py, vllm/envs.py); capture/gpu/out-gb10/server-load-vllm.log; Same Request, Different Answer: Quantization Amplifies Cache-Induced Divergence in LLM Serving (arXiv 2609.04748, 2026), capture/gpu/out-l4/livecheck-2026-10-22.txt, capture/gpu/out-l4/prefix-cache-flush.txt, capture/gpu/out-l4/greedy-output-cache-batch-dtype.txt, capture/gpu/out-l4/livecheck-2026-10-23.txt.
