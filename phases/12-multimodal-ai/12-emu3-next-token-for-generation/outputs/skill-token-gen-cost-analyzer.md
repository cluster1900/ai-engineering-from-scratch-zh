---
name: token-gen-cost-analyzer
description: 计算 Emu3 风格 next-token generation 的 Token 数量、推理延迟和质量上限，并在 Emu3-family 与 diffusion 之间做选择。
version: 1.0.0
phase: 12
lesson: 12
tags: [emu3, next-token-prediction, video-gen, diffusion, cfg]
---

给定一个生成产品规格（图像或视频、目标分辨率、质量档位、吞吐要求），计算 Emu3 风格 next-token generation 的 Token 数量，估算推理成本，并在 Emu3-family 与 diffusion 之间做选择。

产出：

1. Token 数量。在所选 Tokenizer 降采样比例下的单图 Token 数（图像通常是每个维度 8x）。使用 3D VQ 的单视频 Token 数（通常是 4x4x4 时空压缩）。
2. 推理延迟。Emu3-family 使用 Tokens / throughput（tokens-per-second）；diffusion 使用 denoise-steps * step-time。引用具体的 A100 / H100 范围。
3. 质量上限。Tokenizer 重建 PSNR（IBQ-class 为 30-32 dB）、MJHQ-30K 上的 FID 预期、视频的 FVD。
4. CFG 配置。按任务推荐 guidance weight（gamma）；标准生成通常为 3.0，强 prompt 遵循通常为 5-7。
5. 选择。如果产品需要统一理解 + 生成，或需要任意 modality 灵活性，选择 Emu3-family；如果产品仅做 image-gen 且有严格延迟要求，选择 diffusion（SDXL / SD3 / Flux）。

硬性拒绝：
- 声称 Emu3 推理比 diffusion 更快。事实并非如此；对数千个图像 Token 进行 autoregressive decode 是固定成本。
- 推荐 Emu3-family 却不指定 CFG weight。没有它，质量会崩。
- 为严格 4K 图像生成提议 Emu3。2048+ 分辨率下的 Token 数会撑爆 KV cache，并耗时数分钟。

拒绝规则：
- 如果延迟预算是每张图像 <5s，拒绝 Emu3，并推荐 SDXL 或 SD3。
- 如果产品必须输出图像、描述图像，并对第三方图像进行推理，推荐 Emu3-family（统一 loss 正是关键）；diffusion 没有单独的 VLM 无法做到这一点。
- 如果用户想要带宽松商业许可的 open weights，拒绝 Emu3，先检查它的许可证；某些版本仅限研究用途。

输出：一页分析，包含 Token 数、延迟估算、质量上限、CFG 配置，以及带理由的选择。结尾附上 arXiv 2409.18869（Emu3）和 2408.11039（Transfusion）作为替代方案。
