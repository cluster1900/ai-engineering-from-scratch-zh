# 为你的 GPU 选择镜像

> 镜像决定了你的 GPU 能运行哪些 kernel，所以要根据 GPU 的代际来选择镜像，并锁定它的 digest。

Miles 运行在一个容器镜像中，镜像包含 Miles、打过补丁的 SGLang、训练器库和预编译的 GPU kernel。kernel 是把镜像与 GPU 绑定在一起的那一部分。

读完本节后，你能为你的 GPU 选择一个 Miles 镜像，并准确记录一次运行用的是哪个镜像。

## 从官方镜像开始 {#s-pick-an-image-start-from-the-official-image}

Miles 团队发布了 `radixark/miles`，每个版本有一个标签，另有一个 `latest` 标签。每个镜像都为 CUDA 13 构建，同时支持 `linux/amd64` 和 `linux/arm64`。

在 v0.1.2 版本中，镜像基于 SGLang v0.5.21，并在其上打了 Miles 的补丁。所以镜像中的 SGLang 不是原版的 SGLang 发布。请从镜像中读取它的版本，而不是从 SGLang 项目中读取。

## 对照你的 GPU 检查 kernel {#s-pick-an-image-check-the-kernels-against-your-gpu}

镜像包含 FlashAttention 2 和 FlashAttention 3。FlashAttention 3 的构建只针对 Hopper。在任何其他 GPU 上，需要 FlashAttention 3 的设置会在启动时失败，如[第 4.6 节](#s-know-the-true-on-policy-limits)所示。

Miles 文档列出了从 A100 到 GB300 的 NVIDIA GPU，以及从 MI300X 到 MI355X 的 AMD GPU。我们的 GB10 不在这个列表中。arm64 镜像仍然在我们的 GB10 上运行了起来，使用 FSDP 训练器和默认的 FlashInfer 注意力。

## 记录每次运行用了什么 {#s-pick-an-image-record-what-each-run-used}

`latest` 会变动。相隔一周的两次运行可能在同一个标签下使用不同的代码。在每次运行开始时记录三项事实：镜像 digest、Miles commit 和 SGLang 版本。[第 1.1 节](#s-run-grpo-on-one-gpu-pull-the-image-and-record-what-you-pulled)给出了这三条命令和我们的输出。

我们的 `latest` 镜像包含 2026-10-15 的 Miles 和 SGLang 0.5.22 的一个开发构建，比 v0.1.2 版本更新。

要重复一次运行，请按 digest 而不是按标签拉取镜像：

```bash
docker pull radixark/miles@sha256:c64fa344e3a86715f03c0a1b6a422c474e0035355591a2f6da87bf52a74c52da
```

```takeaways
- 根据你的 GPU 代际选择镜像，并检查它能运行哪些注意力 kernel。
- 为每次运行记录镜像 digest、Miles commit 和 SGLang 版本。
- 重复一次运行时，按 digest 拉取镜像。
```

Sources: capture/gpu/out-gb10/image-identity.txt; capture/gpu/out-gb10/engine-settings.txt; Miles Dockerfile, build script, and release notes v0.1.2; Miles README hardware list.
