# Vision Transformers 与 Patch-Token 原语

> 在任何 Multimodal 处理之前，图像都必须变成 Transformer 可以处理的 Token 序列。2020 年的 ViT 论文用 16x16 像素 patch、线性投影和位置 Embedding 回答了这个问题。五年后，每一个 2026 年 frontier model（Claude Opus 4.7 原生 2576px、Gemini 3.1 Pro、Qwen3.5-Omni）仍然从这里开始 — encoder 从 ViT 变成 DINOv2 再到 SigLIP 2，加入了 register tokens，位置方案变成了 2D-RoPE，但这个原语保留了下来。本课会端到端阅读 patch-token pipeline，并用 stdlib Python 构建它，让 Phase 12 后续内容对“visual Token”有一个具体的心智模型。

**Type:** Learn
**Languages:** Python (stdlib, patch tokenizer + geometry calculator)
**Prerequisites:** Phase 7 (Transformers), Phase 4 (Computer Vision)
**Time:** ~120 分钟

## 学习目标
- 将 HxWx3 图像转换为带有正确位置编码的 patch Token 序列。
- 为给定的 ViT（patch size、resolution、hidden dim、depth）计算 sequence length、parameter count 和 FLOPs。
- 说出把 ViT 从 2020 年研究成果推进到 2026 年生产系统的三项升级：self-supervised pretraining（DINO / MAE）、register tokens，以及 native-resolution packing。
- 为下游任务在 CLS pooling、mean pooling 和 register tokens 之间做选择。

## 问题
Transformer 处理的是 Vector 序列。文本本来就是序列（bytes 或 tokens）。图像是带有三个颜色通道的 2D 像素网格，不是序列。如果你展平每一个像素，一张 224x224 RGB 图像会变成 150,528 个 Token，而这个长度上的 self-attention 完全不可行（相对于 sequence length 是二次复杂度）。

2020 年以前的方法会在前端接上一个 CNN feature extractor：ResNet 产生一个由 2048-dim Vector 组成的 7x7 feature map，再把这 49 个 Token 输入 Transformer。这能工作，但会继承 CNN 的偏置（translation equivariance、local receptive fields），并削弱 Transformer 对规模扩展的适应能力。

Dosovitskiy et al. (2020) 提出了一个直接的问题：如果跳过 CNN 会怎样？把图像切分成固定大小的 patch（比如 16x16 像素），将每个 patch 线性投影成一个 Vector，加入位置 Embedding，然后把序列输入一个 vanilla Transformer。在当时这属于异端做法 — 不用卷积做视觉。只要数据足够多（JFT-300M，之后是 LAION），它就在 ImageNet 上超过了 ResNet，并持续改进。

到 2026 年，ViT 原语已经是毫无争议的基础。每个 open-weights VLM 的 vision tower 都是某种后代（DINOv2、SigLIP 2、CLIP、EVA、InternViT）。问题不再是“我们是否应该使用 patch？”，而是“什么 patch size、什么 resolution schedule、什么 pretraining objective、什么 positional encoding。”

## 概念
### Patches as tokens

给定一个形状为 `(H, W, 3)` 的图像 `x` 和 patch size `P`，你会把图像切成一个 `(H/P) x (W/P)` 的非重叠 patch 网格。每个 patch 都是一个 `P x P x 3` 的像素立方体。将每个立方体展平成一个 `3 P^2` Vector。应用一个形状为 `(3 P^2, D)` 的共享线性投影 `W_E`，把每个 patch 映射到模型的 hidden dimension `D`。

对于 ViT-B/16 这个经典配置：
- Resolution 224，patch size 16 → grid 14x14 → 196 个 patch tokens。
- 每个 patch 是 `16 x 16 x 3 = 768` 个像素值，投影到 `D = 768`。
- 加入一个可学习的 `[CLS]` token → sequence length 197。

patch projection 在数学上等同于 kernel size 为 `P`、stride 为 `P`、输出通道数为 `D` 的 2D convolution。生产代码实际就是这样实现的 — `nn.Conv2d(3, D, kernel_size=P, stride=P)`。“linear projection”的说法是概念表述；kernel 表述更高效。

### Positional embeddings

Patch 没有内在顺序 — Transformer 看到的是一个集合。早期 ViT 加入可学习的 1D 位置 Embedding（每个位置一个 768-dim Vector，总共 197 个）。这可以工作，但会把模型绑定到训练 resolution：如果推理时改变 grid，就必须插值位置表。

现代 vision backbone 使用 2D-RoPE（Qwen2-VL 的 M-RoPE、SigLIP 2 的默认方案）或 factorized 2D positions。2D-RoPE 会根据 patch 的（row, column）索引旋转 query 和 key Vector，因此模型可以从旋转角度中推断相对 2D 位置。不需要位置表。模型在推理时可以处理任意 grid size。

### CLS Token、pooled output 和 register tokens

图像级表示是什么？三种选择并存：

1. `[CLS]` token。把一个可学习 Vector 前置到 patch 序列。经过所有 Transformer blocks 后，CLS token 的 hidden state 就是图像表示。继承自 BERT。原始 ViT、CLIP 使用这种方式。
2. Mean pool。对 patch tokens 的输出 hidden states 取平均。SigLIP、DINOv2 和大多数现代 VLM 使用这种方式。
3. Register tokens。Darcet et al. (2023) 观察到，没有显式 sink token 训练的 ViT 会产生高范数的“artifact” patches，并劫持 self-attention。加入 4–16 个可学习 register tokens 可以吸收这部分负载，并提升 dense-prediction 质量（segmentation、depth）。DINOv2 和 SigLIP 2 都随模型提供 registers。

这个选择会影响下游任务。CLS 适合 classification。对于把 patch tokens 输入 LLM 的 VLM，你会完全跳过 pooling — 每个 patch 都会成为一个 LLM 输入 Token。Registers 会在交接前被丢弃（它们是支架，不是内容）。

### 预训练：监督式、对比式、masked、自蒸馏

2020 年的 ViT 使用 JFT-300M 上的 supervised classification 进行 pretraining。很快被以下方法取代：

- CLIP (2021)：在 400M 对图文数据上做 contrastive image-text。Lesson 12.02。
- MAE (2021, He et al.)：mask 75% 的 patches，重建像素。Self-supervised，适用于纯图像。
- DINO (2021) / DINOv2 (2023)：使用 student-teacher 做 self-distillation，无 labels、无 captions。2023 年的 DINOv2 ViT-g/14 是最强的纯视觉 backbone，也是“dense features”用例的默认选择。
- SigLIP / SigLIP 2 (2023, 2025)：带 sigmoid loss 和 NaFlex 原生宽高比支持的 CLIP。2026 年 open VLMs（Qwen、Idefics2、LLaVA-OneVision）中的主流 vision tower。

你选择的 pretraining 决定了 backbone 擅长什么：CLIP/SigLIP 擅长与文本做语义匹配，DINOv2 擅长 dense visual features，MAE 适合作为下游 finetuning 的起点。

### Scaling laws

ViT scaling（Zhai et al. 2022）表明，ViT 的质量在 model size、data size 和 compute 上遵循可预测规律。在固定 compute 下：
- 更大的模型 + 更多数据 → 更好的质量。
- Patch size 是 sequence length 与 fidelity 之间的调节杠杆。Patch 14（DINOv2/SigLIP SO400m 的典型配置）相比 patch 16 会为每张图像产生更多 Token；更适合 OCR 和 dense tasks，但速度更慢。
- Resolution 是另一个大杠杆。从 224 到 384 再到 512 几乎总是有帮助，但 FLOPs 成本按二次增长。

ViT-g/14（1B params、patch 14、resolution 224 → 256 tokens）和 SigLIP SO400m/14（400M params、patch 14）是 2026 年 open VLMs 的两个主力 encoders。

### Parameter count for a ViT

完整计算位于 `code/main.py`。对于 224 下的 ViT-B/16：

```
patch_embed = 3 * 16 * 16 * 768 + 768  =  591k
cls + pos    = 768 + 197 * 768          =  152k
block        = 4 * 768^2 (QKVO) + 2 * 4 * 768^2 (MLP) + 2 * 2*768 (LN)
             = 12 * 768^2 + 3k          =  7.1M
12 blocks    = 85M
final LN    = 1.5k
total       ≈ 86M
```

在加载 checkpoint 之前，先用这种方式粗略估算每个 ViT。backbone size 会决定任何下游 VLM 的 VRAM 下限。

### 2026 production config

2026 年大多数 open VLMs 随模型提供的 encoder 是原生 resolution（NaFlex）下的 SigLIP 2 SO400m/14。它具有：
- 400M parameters。
- Patch size 14，默认 resolution 384 → 每张图像 729 个 patch tokens。
- 图像级任务使用 mean pool；VQA 中所有 729 个 patches 都流入 LLM。
- 4 个 register tokens，在 LLM handoff 前丢弃。
- 使用 2D-RoPE，并带有面向 native aspect ratio 的 image-level scaling。

这个配置里的每一个决策都可以追溯到一篇你可以阅读的论文。

## 使用它
`code/main.py` 是一个 patch tokenizer 和 geometry calculator。它接收（image H、W、patch P、hidden D、depth L）并报告：

- patching 后的 grid shape 和 sequence length。
- 一个合成 8x8 像素 toy image 的 Token 序列（逐步走过 flatten + project 路径）。
- 按 patch embed、position embed、transformer blocks 和 head 拆分的 parameter count。
- 目标 resolution 下单次 forward pass 的 FLOPs。
- ViT-B/16 @ 224、ViT-L/14 @ 336、DINOv2 ViT-g/14 @ 224、SigLIP SO400m/14 @ 384 的对比表。

运行它。把 parameter counts 和已发布数字对齐。调整 patch size 和 resolution，感受 Token 数量成本。

## 交付它
本课会生成 `outputs/skill-patch-geometry-reader.md`。给定一个 ViT config（patch size、resolution、hidden dim、depth），它会生成带有理由说明的 token-count、parameter-count 和 VRAM estimate。每当你为 VLM 选择 vision backbone 时，都使用这个 skill — 它能避免“Token 爆炸然后把我的 LLM context 填满”的意外。

## 练习
1. 计算 Qwen2.5-VL 在原生 1280x720 输入、patch size 14 下的 patch-token sequence length。它和只使用 CLS 的表示相比如何？

2. 一个 1080p frame（1920x1080）在 patch 14 下会产生多少 Token？30 FPS、5 分钟视频会有多少 total visual tokens？哪种成本削减最有效：pooling、frame sampling，还是 token merging？

3. 用纯 Python 实现 patch tokens 上的 mean pooling。验证对 DINOv2 输出的 196 个 Token 做 mean-pool，与请求 pooled embedding 时模型 `forward` 返回的结果一致。

4. 阅读 "Vision Transformers Need Registers"（arXiv:2309.16588）的 Section 3。用两句话描述 registers 吸收的 artifact 是什么，以及它为什么影响下游 dense prediction。

5. 修改 `code/main.py` 以支持 patch-n'-pack：给定一组不同 resolution 的图像，生成一个 packed sequence 和 block-diagonal attention mask。到达 Lesson 12.06 时再进行验证。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Patch | “16x16 像素方块” | 输入图像中固定大小、非重叠的区域；会变成一个 Token |
| Patch embedding | “Linear projection” | 一个共享的学习 Matrix（或 stride=P 的 Conv2d），将展平后的 patch 像素映射到 D-dim Vector |
| CLS token | “Class token” | 前置的可学习 Vector，其最终 hidden state 表示整张图像；在 2026 年是可选项 |
| Register token | “Sink token” | 额外的可学习 Token，用于吸收 ViT 在 pretraining 期间产生的高范数 Attention artifacts |
| Position embedding | “Positional info” | 每个位置的 Vector 或旋转，使序列具备顺序感知；2D-RoPE 是现代默认方案 |
| Grid | “Patch grid” | 对于给定 resolution 和 patch size，patch 形成的 (H/P) x (W/P) 2D 数组 |
| NaFlex | “Native flexible resolution” | SigLIP 2 特性：单个模型无需重新训练即可服务多种 aspect ratios 和 resolutions |
| Backbone | “Vision tower” | 预训练 image encoder，其 patch-token 输出会在 VLM 中输入 LLM |
| Pooling | “Image-level summary” | 将 patch tokens 转换为一个 Vector 的策略：CLS、mean、attention pool 或 register-based |
| Patch 14 vs 16 | “Finer vs coarser grid” | Patch 14 每张图像产生更多 Token，对 OCR 有更好 fidelity，但更慢；patch 16 是经典默认值 |

## 延伸阅读
- [Dosovitskiy et al. — An Image is Worth 16x16 Words (arXiv:2010.11929)](https://arxiv.org/abs/2010.11929) — 原始 ViT。
- [He et al. — Masked Autoencoders Are Scalable Vision Learners (arXiv:2111.06377)](https://arxiv.org/abs/2111.06377) — MAE，self-supervised pretraining。
- [Oquab et al. — DINOv2 (arXiv:2304.07193)](https://arxiv.org/abs/2304.07193) — 大规模 self-distillation，无 labels。
- [Darcet et al. — Vision Transformers Need Registers (arXiv:2309.16588)](https://arxiv.org/abs/2309.16588) — register tokens 和 artifact 分析。
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786) — 2026 年默认 vision tower。
- [Zhai et al. — Scaling Vision Transformers (arXiv:2106.04560)](https://arxiv.org/abs/2106.04560) — 经验性 scaling laws。
