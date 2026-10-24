# 在其他加速器上运行 vLLM

> vLLM 通过插件支持其他加速器，每个插件都有自己的发布节奏。

你的硬件不是 NVIDIA GPU。读完本节后，你能找到适用于你硬件的插件及其版本。

## 了解哪些是内置的、哪些是插件 {#s-run-vllm-on-other-accelerators-know-what-is-built-in-and-what-is-a-plugin}

vLLM 0.31.0 内置支持 NVIDIA GPU、通过 ROCm 支持 AMD GPU，还支持 Intel GPU 和 CPU。其他硬件通过插件运行。插件是一个独立的 Python 包，安装后会向 vLLM 注册一个平台。把它安装在 vLLM 旁边，vLLM 就会找到它。

插件设计来自 2024 年 12 月的一份 RFC。此后，好几个原本在 vLLM 内部的 backend 都移出来成了插件。

## 找到你的插件 {#s-run-vllm-on-other-accelerators-find-your-plugin}

| 硬件 | 插件 | 如何跟进 vLLM |
|---|---|---|
| Google TPU | `tpu-inference`，正在改名为 `vllm-jax` | 每个 vLLM 版本都有对应发布，并有自己的镜像 |
| 华为 Ascend NPU | `vllm-ascend` | 针对较新 vLLM 版本发布候选版，大约每三个月发布一次正式版 |
| Intel Gaudi | `vllm-gaudi` | 基于某个指定 vLLM 版本发布 |
| AWS Trainium 和 Inferentia | `vllm-neuron` | 发布时注明所基于的 vLLM 版本 |
| IBM Spyre | `sendnn-inference` | 使用自己的版本号 |
| Apple silicon GPU | `vllm-metal`，基于 MLX 的社区插件 | 自己发布 |

## 规划前先检查版本 {#s-run-vllm-on-other-accelerators-check-the-version-before-you-plan}

插件支持的 vLLM 往往比最新版本旧。2026 年 10 月，`vllm-ascend` 最新的正式版针对的是 vLLM 0.23.0，而 vLLM 本身已经到了 0.32.0。TPU 插件则在 vLLM 0.31.0 发布后几天内就有了对应版本。

在你的硬件上规划某个功能之前：

1. 找到最新的插件版本，看它针对哪个 vLLM 版本。
2. 阅读那个 vLLM 版本的文档，而不是最新版的。
3. 查看插件的功能表。CUDA 路径上的一些功能，例如某些量化格式和 attention backend，在其他硬件上没有对应实现。

这一点没有在我们的硬件上测量。我们只运行过 NVIDIA GPU。

```takeaways
- 其他硬件通过安装在 vLLM 旁边的插件包来运行 vLLM。
- 插件可能落后最新 vLLM 好几个版本，所以要看它针对的版本。
- 使用那个 vLLM 版本的文档，而不是最新版的。
```

Sources: the vLLM source at v0.31.0 (vllm/platforms/, vllm/plugins/), vLLM documentation at v0.31.0 (docs/design/plugin_system.md, docs/getting_started/installation/), vLLM RFC 11162 (Hardware pluggable, December 2024), the release pages of tpu-inference, vllm-ascend, vllm-gaudi, vllm-neuron, sendnn-inference, and vllm-metal (accessed 2026-10-21).
