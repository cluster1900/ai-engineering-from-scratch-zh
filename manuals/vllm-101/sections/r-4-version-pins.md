# 版本锁定

> 本页列出我们的运行所用的 vLLM、PyTorch、CUDA 和镜像版本。

在比较某个数字之前，用本页把你的环境和我们的对齐。

## vLLM {#s-ref-version-pins-vllm}

| 项目 | 值 |
|---|---|
| 版本 | 0.31.0 |
| Tag commit | `db9527a46873454610df6dbedf79a36d6bf1a7f6`，日期为 2026-10-02 |
| GitHub release | 发布于 2026-10-05 |
| CUDA wheel 要求的 PyTorch | 2.13.0 |
| 默认镜像的 CUDA | 13.0 |
| 默认镜像的 Python | 3.12 |

## 机器 {#s-ref-version-pins-the-machines}

| 项目 | NVIDIA L4 | DGX Spark |
|---|---|---|
| GPU | NVIDIA L4，compute capability 8.9 | NVIDIA GB10，compute capability 12.1 |
| 内存 | 24 GB GDDR6，可见 22.1 GiB | 统一 LPDDR5x，标称 128 GB，GPU 可见 121.69 GiB |
| CPU 架构 | x86_64 | aarch64 |
| 驱动 | 615.71.09 | 580.159.03 |
| vLLM 的运行方式 | 虚拟环境中的 pip wheel | 镜像 `vllm/vllm-openai:v0.31.0` |
| Attention backend | FlashAttention 2，按这块 GPU 的选择规则 | FlashAttention 2，启动日志中名为 `FLASH_ATTN` |

## 模型 {#s-ref-version-pins-models}

| 模型 | 机器 | 用途 |
|---|---|---|
| `Qwen/Qwen3-8B` | L4 | 除 FP8 权重运行外的所有 L4 运行 |
| `Qwen/Qwen3-8B-FP8` | L4 | FP8 权重运行 |
| `Tengyunw/qwen3_8b_eagle3` | L4 | EAGLE3 draft |
| `Qwen/Qwen3-30B-A3B-Instruct-2507` | DGX Spark | 所有 GB10 运行 |

## 对比引擎与客户端 {#s-ref-version-pins-the-comparison-engine-and-the-client}

| 项目 | 值 |
|---|---|
| SGLang | 0.5.22，用于正面对比运行 |
| 基准测试客户端 | SGLang 0.5.22 中的 `sglang.benchmark.serving`，vLLM 运行时使用 `--backend vllm` |
| 客户端环境的 PyTorch | 2.14.1，CUDA 13.0 |

Sources: the vLLM source at v0.31.0 (requirements/cuda.txt, docker/Dockerfile), the GitHub release list of vllm-project/vllm (fetched 2026-10-21), capture/gpu/summary/l4.json and gb10.json (environment), capture/gpu/out-gb10/server-load-vllm.log.
