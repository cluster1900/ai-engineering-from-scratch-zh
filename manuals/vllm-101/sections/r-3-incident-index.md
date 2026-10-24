# 故障索引

> 本页列出本手册引用的每个 issue，以及它在 0.31.0 时的状态。

用本页检查你遇到的问题是否是已知问题。

状态截至 2026-10-22。编号指 vLLM 仓库中的 issue。

## Issue {#s-ref-incident-index-issues}

| Issue | 报告了什么 | 状态 | 页面 |
|---|---|---|---|
| 44740 | 在 GB10 上使用 MTP 投机解码时，CUDA graph 内存估算为负，导致 KV cache 过大 | 未关闭 | [DGX Spark](#s-size-memory-on-a-dgx-spark) |
| 46307 | GB10 上启动 profile 期间内存占用超过 `--gpu-memory-utilization` 比例，导致主机停止 | 2026-10-22 因过期关闭，没有修复 | [DGX Spark](#s-size-memory-on-a-dgx-spark) |
| 52479 | 从 level 2 睡眠中唤醒时不会重新加载投机解码的 draft，所以没有 draft token 被接受 | 未关闭 | [RL rollout](#s-use-vllm-as-an-rl-rollout-engine) |
| 54623 | Qwen3.5 系列从不加载 checkpoint 中的 KV scale，所以 FP8 KV cache 以 scale 1.0 运行 | 未关闭 | [FP8 KV cache](#s-fit-more-users-with-an-fp8-kv-cache) |
| 57853 | 在引擎睡眠时发送权重更新会让 engine core 发生段错误 | 未关闭 | [RL rollout](#s-use-vllm-as-an-rl-rollout-engine) |
| 60333 | 某个 MTP draft 加载器丢弃了 FP8 KV scale，draft 层使用 scale 1.0 | 未关闭 | [FP8 KV cache](#s-fit-more-users-with-an-fp8-kv-cache) |
| 58726 | GB10 上权重加载很慢，原因是逐个 tensor 从文件映射中复制 | 未关闭 | [DGX Spark](#s-size-memory-on-a-dgx-spark) |
| 59770 | 从 0.29.0 起，GB10 上某个模型的 NVFP4 decode 变慢 | 未关闭 | [故障排查](#s-troubleshoot-by-symptom) |
| 60174 | 在 0.30 和 0.31 上使用 DFlash2 或 DSpark 投机解码时，prefix cache 命中后不断重复同一个 token | 2026-10-22 关闭 | [故障排查](#s-troubleshoot-by-symptom) |
| 60262 | FP8 KV cache 选中 FlashInfer、但没有可用的 kernel 构建时，启动时崩溃 | 未关闭 | [故障排查](#s-troubleshoot-by-symptom) |
| 60830 | 在某个模型上使用 MTP 投机解码和 JSON schema 时 JSON 无效 | 已关闭 | [故障排查](#s-troubleshoot-by-symptom) |
| 60838 | 移除 `all` Mamba cache 模式后，`--mamba-block-size` 不再生效 | 未关闭 | [长上下文](#s-serve-long-contexts-and-hybrid-models) |
| 61024 | 项目 2026 年第四季度路线图，其中列出了移除旧 model runner | 未关闭 | [Model Runner V2](#s-what-model-runner-v2-changed) |
| 61886 | 不依赖 tensor-parallel 大小的 KV 卸载 | 未关闭 | [KV connector](#s-how-kv-connectors-move-the-cache) |
| 59538 | 用于 KV 传输和存储的压缩层 | 未关闭 | [KV connector](#s-how-kv-connectors-move-the-cache) |
| 61229 | NIXL connector 中远程读取期间 KV block 被释放 | 未关闭 | [KV connector](#s-how-kv-connectors-move-the-cache) |
| 58253 | 请求设立 reviewer 角色，以提高审查能力 | 未关闭 | [历史](#s-where-vllm-came-from) |
| 61698 | 请求由贡献者在自己的 GPU 上运行可复现的 eval 和基准测试 | 未关闭 | [历史](#s-where-vllm-came-from) |

## 我们自己遇到的故障 {#s-ref-incident-index-our-own-incidents}

| 日期 | 机器 | 发生了什么 | 页面 |
|---|---|---|---|
| 2026-10-22 | L4，共享 GPU | 启动失败，因为一个最大长度为 2,928 token 的请求所需的 KV cache 略多于空闲空间 | [启动](#s-fix-out-of-memory-at-startup) |
| 2026-10-21 | GB10 | 首次加载 56.93 GiB 的权重花了 330 秒 | [DGX Spark](#s-size-memory-on-a-dgx-spark) |

Sources: vLLM issues 44740, 46307, 52479, 54623, 57853, 58253, 58726, 59538, 59770, 60174, 60262, 60333, 60830, 60838, 61024, 61229, 61698, and 61886 (fetched 2026-10-21, and the state of each again on 2026-10-22); capture/gpu/out-gb10/server-load-vllm.log.
