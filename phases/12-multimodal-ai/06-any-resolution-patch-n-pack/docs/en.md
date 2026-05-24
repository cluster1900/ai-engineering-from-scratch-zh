# 任意分辨率 Vision：Patch-n'-Pack 和 NaFlex

> 真实图像不是 224x224 的正方形。收据是 9:16，图表是 16:9，医学扫描可能是 4096x4096，手机截图是 9:19.5。2024 年之前的 VLM 答案——把所有内容 resize 成固定正方形——丢掉了让 OCR、文档理解和高分辨率场景解析真正可用的信号。NaViT（Google，2023）展示了可以用 block-diagonal masking 将可变分辨率 patches 打包进单个 transformer batch。Qwen2-VL 的 M-RoPE（2024）完全去掉了绝对位置表。LLaVA-NeXT 的 AnyRes 将高分辨率图像切成 base + sub-images。SigLIP 2 的 NaFlex 变体（2025）现在是 open VLM 的默认 encoder，用于让单个 checkpoint 支持所有 aspect ratio。本课端到端实现 patch-n'-pack。

**Type:** Build
**Languages:** Python (stdlib, patch packer + block-diagonal mask)
**Prerequisites:** Phase 12 · 01 (ViT patches), Phase 12 · 05 (LLaVA)
**Time:** ~120 minutes

## 学习目标
- 将一批可变分辨率图像中的 patches 打包成一个 sequence，并构建 block-diagonal attention mask。
- 针对给定任务，在 AnyRes tiling（LLaVA-NeXT）、NaFlex（SigLIP 2）和 M-RoPE（Qwen2-VL）之间做选择。
- 在不 resize 的情况下，为 OCR、图表和摄影计算 Token budgets。
- 说出 square-resize 的三种 failure modes：被挤压的文本、被裁剪的内容、padding 上浪费的 Token。

## 问题
Transformers 需要一个 sequence。一个 batch 是一叠长度相同的 sequences。如果你的图像是 224x224，每次都会得到 196 个 patch Token，不需要 padding，任务完成。用 224 训练，用 224 inference，再也不用思考分辨率。

现实并不配合。文档是竖版（8.5x11 英寸，约 2:3）。图表截图是横版（16:9）。收据又高又窄（1:3）。医学影像通常是 2048x2048 或更大。移动设备截图是 1170x2532（0.46:1）。

2024 年之前的三种选项，以及为什么它们都会失败：

1. Resize 到固定正方形（224x224 或 336x336）。挤压会扭曲文本和人脸。下采样会破坏图表标签和 OCR 内容。在 LLaVA-1.5 之前，这是标准做法。
2. Crop 到固定 aspect ratio。你会丢掉图像的大部分内容，而且选择 crop 位置本身就是一个 vision 问题。
3. Pad 到最长边。解决了失真，但对于竖版图像，50% 以上的 Token 会浪费在 padding 上。所有这些 pad Token 都会产生二次方 Attention 成本。

2024-2025 年的答案：让 transformer 吃下图像原生分辨率的 patches，并弄清楚如何把异构 batch 打包成一个 sequence，同时避免浪费计算。

## 概念
### NaViT and patch-n'-pack

NaViT（Dehghani et al., 2023）是证明这种方法可以规模化工作的论文。思路是机械的：

1. 对 batch 中的每张图像，按选定 patch size（比如 14）计算其原生 patch grid。
2. 将每张图像的 patches flatten 成自己的可变长度 sequence。
3. 将所有图像的 patches concatenate 成 batch 的一个长 sequence。
4. 构建 block-diagonal attention mask，让图像 A 的 patches 只在图像 A 内部 attend。
5. 携带每个 patch 的位置信息（2D RoPE 或 fractional position embeddings）。

三张图像组成的 batch：336x336（576 Token）、224x224（256 Token）和 448x336（768 Token），会变成一个 1600-Token sequence，配一个 1600x1600 的 block-diagonal mask。没有 padding。没有浪费计算。Transformer 可以处理任意 aspect ratio。

NaViT 还在训练中引入了 fractional patch dropping——在整个 batch 中随机丢弃 50% 的 patches——这既能 regularize，也能加速训练。SigLIP 2 继承了这一点。

### AnyRes (LLaVA-NeXT)

LLaVA-NeXT 的 AnyRes 是务实替代方案。给定一张高分辨率图像和一个固定 encoder（CLIP 或 SigLIP at 336），将图像切块：

1. 从预定义集合中选择一个 grid layout——(1x1)、(1x2)、(2x1)、(1x3)、(3x1)、(2x2) 等——使其最匹配图像的 aspect ratio。
2. 将完整图像切成该 grid；每个 tile 变成一个 336x336 crop。
3. 同时生成一个 thumbnail：整张图像 resize 到 336x336，作为 global-context Token。
4. 将每个 tile 都送入 frozen 336-encoder 编码。Concatenate tile Token + thumbnail Token。

对于一张 672x672 图像，使用 2x2 grid 加 thumbnail：4 * 576 + 576 = 2880 个 visual Token。昂贵但有效——LLM 同时看到局部细节和全局上下文。

当你的 encoder 是 frozen 且只支持一种分辨率时，AnyRes 是首选路线。它会让大图像的 Token 数爆炸（一张 1344x1344 图像使用 4x4 grid 时是 9216 + 576 ≈ 9800 Token，会占满 8k LLM context 的大部分）。

### M-RoPE (Qwen2-VL)

Qwen2-VL 引入了 Multimodal Rotary Position Embedding。不同于 NaViT 的 fractional positions 或 AnyRes 的 tile-and-thumbnail，每个 patch 都携带一个 3D 位置（temporal、height、width）。query/key rotations 处理任意 H、W 和 temporal length。

M-RoPE 原生提供 dynamic resolution，无需重新训练。Inference 时输入任意 HxW 图像，patch embedder 生成 H/14 x W/14 个 Token，每个 Token 获得自己的 (t=0, r=row, c=col) 位置，RoPE 用正确频率旋转 Attention，完成。Qwen2.5-VL 和 Qwen3-VL 延续了这一点。InternVL3 的 V2PE 是同一思路，只是按 modality 使用可变编码。

不同于 AnyRes，M-RoPE 在原生分辨率下是 O(H x W / P^2) Token——没有 tile 带来的乘法开销。不同于 NaViT，它仍然期望每次 forward 只处理单张图像。跨分辨率 batching 仍然需要在上层使用 patch-n'-pack。

### NaFlex (SigLIP 2)

NaFlex 是 SigLIP 2 checkpoint 的 native-flex 模式。单个模型在 inference 时支持多种 sequence length（256、729、1024 Token）。内部在训练期间使用 NaViT-style patch-n'-pack，并为每个 patch 使用 absolute fractional positions。卖点是：一个 checkpoint，按任务在 inference 时选择 Token budget。

语义任务（classification、retrieval）用 256 Token。OCR 或图表理解用 1024 Token。无需重新训练。

### The packing mask

block-diagonal mask 是大多数实现容易出错的地方。对于一个长度为 `N_total` 的 packed sequence，覆盖图像 `i=0..B-1`，各自长度为 `n_i`，形状为 `(N_total, N_total)` 的 mask `M` 在两个索引落入同一张图像的 block 时为 1，否则为 0。你可以从 cumulative length list 构建它：

```
offsets = [0, n_0, n_0+n_1, ..., N_total]
M[i, j] = 1 iff there exists b where offsets[b] <= i < offsets[b+1] and offsets[b] <= j < offsets[b+1]
```

在 PyTorch 中，这可以用 `torch.block_diag` 或显式 gather 一行实现。FlashAttention 的 variable-length path（`cu_seqlens`）完全跳过 mask，直接用 cumulative-length tensor 在 sequences 内部 attend——对于典型 batch，比 dense mask 快约 10x。

### Token budgets

按任务选择策略：

- OCR / documents：1024-4096 Token。SigLIP 2 NaFlex at 1024，或 AnyRes 3x3 + thumbnail。
- Charts and UI：384-448 原生分辨率下 729-1024 Token。使用带 max pixels cap 的 Qwen2.5-VL dynamic resolution。
- Natural photos：256-576 Token 就够了。下游 LLM 能看到足够信息。把 Token 花在内容密度高的地方。
- Video：空间 pooling 后每帧 64-128 Token，2-8 FPS。Lesson 12.17 会讲这个。

2026 年的生产规则：选择一个 per-task max-pixels cap，按原生 aspect ratio 编码到该 cap，打包 batch，并跳过 padding。Qwen2.5-VL 暴露了 `min_pixels` 和 `max_pixels`，正是用于这个旋钮。

## 使用它
`code/main.py` 为一批异构图像使用整数像素坐标实现 patch-n'-pack。它会：

- 接收一个 (H, W) 图像尺寸列表。
- 按 patch size 14 计算每张图像的 patch sequence length。
- 将它们打包成一个总长度为 `sum(n_i)` 的 sequence。
- 构建 block-diagonal attention mask（为了清晰起见，使用 dense）。
- 比较 packed cost 与 square-resize 和 AnyRes tiling。
- 为一个混合 batch（receipt、chart、screenshot、photo）打印 Token budget table。

运行它。输出的数字解释了为什么每个 2026 年的 open VLM 都使用 patch-n'-pack。

## 交付它
本课生成 `outputs/skill-resolution-budget-planner.md`。给定一个混合 aspect ratio 工作负载（OCR、charts、photos、video frames）和 total-token budget，它会选择正确策略（NaFlex、AnyRes、M-RoPE 或 fixed-square），并输出 per-request configuration。当你为产品中的 VLM 做 sizing 时使用这个 skill——它能避免静默的 10x Token 膨胀，否则会杀死 latency budgets。

## 练习
1. 一张收据是 600x1500（1:2.5）。patch size 为 14 时，有多少 native-resolution Token？square-resize 到 336 后有多少？实践中哪一种会损失更多 OCR accuracy？

2. 为一个包含四张图像的 batch 构建 block-diagonal mask，它们的长度分别为 256、576、729、1024。验证 Attention Matrix 是 2585x2585，并且恰好有 `256^2 + 576^2 + 729^2 + 1024^2` 个非零条目。

3. 对一张 1792x896 图像，patch 14，比较：(a) square-resize 到 336 后编码，(b) AnyRes 2x1 + thumbnail，(c) M-RoPE at native。哪种使用最少 Token？哪种保留最多细节？

4. 实现 fractional patch dropping：给定一个 packed sequence，uniformly at random 丢弃 50% 的 Token，并相应更新 block-diagonal mask。测量 mask 的 sparsity 变化。

5. 阅读 Qwen2-VL 论文（arXiv:2409.12191）的 Section 3.2。用两句话描述 `min_pixels` 和 `max_pixels` 控制什么，以及为什么两个边界都重要。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Patch-n'-pack | "NaViT-style packing" | 将来自不同图像的可变长度 patch sequences concatenate 到一个 batch dimension 中 |
| Block-diagonal mask | "Packing mask" | Attention mask，将每张图像的 patches 限制为只 attend 自己，而不是 pack 中的相邻图像 |
| AnyRes | "LLaVA-NeXT tiling" | 将高分辨率图像切成固定大小 tiles 的 grid，并加一个全局 thumbnail；用固定 encoder 编码每个 tile |
| NaFlex | "SigLIP 2 native-flex" | 单个 SigLIP 2 checkpoint，可在 inference 时服务 256/729/1024-Token budgets，无需重新训练 |
| M-RoPE | "Multimodal RoPE" | 3D rotary position encoding（time、row、column），无需 position tables 即可处理任意 H、W、T |
| cu_seqlens | "FlashAttention packing" | FlashAttention varlen path 使用的 cumulative-length tensor，用来替代 dense block-diagonal mask |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的 per-request knobs，用于限制非常小或非常大输入上的 Token count |
| Visual token budget | "How many tokens per image" | 每张图像发出的 patch Token 粗略数量；决定 LLM 的 prompt budget 和 Attention cost |

## 延伸阅读
- [Dehghani et al. — Patch n' Pack: NaViT (arXiv:2307.06304)](https://arxiv.org/abs/2307.06304)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Laurençon et al. — What matters when building vision-language models? (Idefics2, arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Tschannen et al. — SigLIP 2 (arXiv:2502.14786)](https://arxiv.org/abs/2502.14786)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
