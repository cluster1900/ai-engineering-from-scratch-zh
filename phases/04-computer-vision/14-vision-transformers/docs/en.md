# Vision Transformers (ViT)

> 将图像切成 patches，把每个 patch 当作一个 word，运行标准 transformer。不要回头看。

**类型：** 构建
**语言：** Python
**前置要求：** Phase 7 Lesson 02 (Self-Attention), Phase 4 Lesson 04 (Image Classification)
**时间：** ~45 分钟

## 学习目标

- 从零实现 patch embedding、learned positional embedding、class token 和 transformer encoder blocks，构建一个最小 ViT
- 解释为什么 ViT 曾被认为需要海量预训练数据，直到 DeiT 和 MAE 证明并非如此
- 从架构先验角度比较 ViT、Swin 和 ConvNeXt（无先验、local window attention、conv backbone）
- 使用 `timm` 和标准 linear-probe / fine-tune 流程，在小数据集上 fine-tune 预训练 ViT

## 问题

十年来，convolution 几乎就是 computer vision 的同义词。CNN 具有很强的 inductive biases，包括 locality、translation equivariance，没人认为你能替代它们。随后 Dosovitskiy et al. (2020) 证明，一个直接应用于展平图像 patches 的普通 transformer，完全不使用 convolutional 机制，也能在规模足够大时匹配甚至超过最好的 CNN。

关键在于“规模足够大”。在 ImageNet-1k 上，ViT 输给了 ResNet。先在 ImageNet-21k 或 JFT-300M 上预训练，再在 ImageNet-1k 上 fine-tune 的 ViT 则超过了它。当时的结论是：transformers 缺少有用先验，但可以从足够多的数据中学习这些先验。后续工作（DeiT、MAE、DINO）表明，只要训练配方正确，例如强 augmentation、self-supervised pretraining、distillation，ViT 在小数据上也能训练得很好。

到 2026 年，纯 CNN 在 edge devices 上仍然有竞争力（ConvNeXt 是最强的），但 transformers 主导了其他几乎所有方向：segmentation（Mask2Former、SegFormer）、detection（DETR、RT-DETR）、multimodal（CLIP、SigLIP）、video（VideoMAE、VJEPA）。ViT block 结构是必须掌握的内容。

## 核心概念

### 流程

```mermaid
flowchart LR
    IMG["Image<br/>(3, 224, 224)"] --> PATCH["Patch embedding<br/>conv 16x16 s=16<br/>-> (768, 14, 14)"]
    PATCH --> FLAT["Flatten to<br/>(196, 768) tokens"]
    FLAT --> CAT["Prepend<br/>[CLS] token"]
    CAT --> POS["Add learned<br/>positional embed"]
    POS --> ENC["N transformer<br/>encoder blocks"]
    ENC --> CLS["Take [CLS]<br/>token output"]
    CLS --> HEAD["MLP classifier"]

    style PATCH fill:#dbeafe,stroke:#2563eb
    style ENC fill:#fef3c7,stroke:#d97706
    style HEAD fill:#dcfce7,stroke:#16a34a
```

七个步骤。Patches -> tokens -> attention -> classifier。每个变体（DeiT、Swin、ConvNeXt、MAE pretraining）都只改变这七步中的一两个，其余保持不变。

### Patch embedding

第一个 conv 是关键。Kernel size 16，stride 16，因此一张 224x224 图像会变成 14x14 的网格，由 16x16 patches 组成，每个 patch 被投影为 768-dim embedding。这个单独的 conv 同时完成 patchify 和 linear projection。

```
Input:  (3, 224, 224)
Conv (3 -> 768, k=16, s=16, no padding):
Output: (768, 14, 14)
Flatten spatial: (196, 768)
```

196 patches = 196 tokens。每个 token 的 feature dimension 是 768（ViT-B）、1024（ViT-L）或 1280（ViT-H）。

### Class token

在序列前加上一个 learned vector：

```
tokens = [CLS; patch_1; patch_2; ...; patch_196]   shape (197, 768)
```

经过 N 个 transformer blocks 后，`[CLS]` output 就是全局图像表示。Classification head 只读取这一个 vector。

### Positional embedding

Transformers 没有内置的空间位置概念。为每个 token 加上一个 learned vector：

```
tokens = tokens + learned_pos_embedding   (also shape (197, 768))
```

这个 embedding 是模型的一个 parameter；基于 gradient 的训练会让它适配 2D 图像结构。也存在 sinusoidal 2D 替代方案，但实践中很少使用。

### Transformer encoder block

标准结构。Multi-head self-attention、MLP、residual connections、pre-LayerNorm。

```
x = x + MSA(LN(x))
x = x + MLP(LN(x))

MLP is two-layer with GELU: Linear(d -> 4d) -> GELU -> Linear(4d -> d)
```

ViT-B/16 堆叠 12 个这样的 blocks，每个 block 有 12 个 attention heads，总计 86M parameters。

### 为什么使用 pre-LN

早期 transformers 使用 post-LN（`x = LN(x + sublayer(x))`），在没有 warmup 的情况下，训练超过 6-8 层就很困难。Pre-LN（`x = x + sublayer(LN(x))`）可以在没有 warmup 的情况下稳定训练更深的 networks。每个 ViT 和每个现代 LLM 都使用 pre-LN。

### Patch size 权衡

- 16x16 patches -> 196 tokens，标准设置。
- 32x32 patches -> 49 tokens，更快但分辨率更低。
- 8x8 patches -> 784 tokens，更精细，但 O(n^2) attention cost 扩展性很差。

更大的 patches = 更少的 tokens = 更快但空间细节更少。SwinV2 在 hierarchical windows 中使用 4x4 patches。

### DeiT 在 ImageNet-1k 上训练 ViT 的配方

原始 ViT 需要 JFT-300M 才能超过 CNN。DeiT（Touvron et al., 2020）只用 ImageNet-1k，就通过四项改动把 ViT-B 训练到 81.8% top-1：

1. Heavy augmentation：RandAugment、Mixup、CutMix、Random Erasing。
2. Stochastic depth（训练时随机丢弃整个 blocks）。
3. Repeated augmentation（同一张图像在每个 batch 中采样 3 次）。
4. 从 CNN teacher 进行 Distillation（可选，会进一步提升 accuracy）。

每个现代 ViT 训练配方都源自 DeiT。

### Swin vs ConvNeXt

- **Swin**（Liu et al., 2021）— 基于 window 的 attention。每个 block 只在 local window 内进行 attention；交替 blocks 会移动 window，以便跨 windows 混合信息。在保留 attention operator 的同时，重新引入类似 CNN 的 locality prior。
- **ConvNeXt**（Liu et al., 2022）— 重新设计的 CNN，匹配 Swin 的架构选择（depthwise convs、LayerNorm、GELU、inverted bottleneck）。它表明差距并不是“attention vs convolution”，而是“现代训练配方 + 架构”。

在 2026 年，ConvNeXt-V2 和 Swin-V2 都是生产级选择；正确选择取决于你的 inference stack（ConvNeXt 更适合 edge 编译）和 pretraining corpus。

### MAE pretraining

Masked Autoencoder（He et al., 2022）：随机 mask 75% 的 patches，训练 encoder 只处理可见的 25%，再训练一个小 decoder，根据 encoder output 重建被 mask 的 patches。预训练完成后，丢弃 decoder 并 fine-tune encoder。

MAE 让 ViT 只用 ImageNet-1k 也可训练，达到 SOTA，并且是当前默认的 self-supervised 配方。

## 构建它

### 步骤 1： Patch embedding

```python
import torch
import torch.nn as nn

class PatchEmbedding(nn.Module):
    def __init__(self, in_channels=3, patch_size=16, dim=192, image_size=64):
        super().__init__()
        assert image_size % patch_size == 0
        self.proj = nn.Conv2d(in_channels, dim, kernel_size=patch_size, stride=patch_size)
        num_patches = (image_size // patch_size) ** 2
        self.num_patches = num_patches

    def forward(self, x):
        x = self.proj(x)
        return x.flatten(2).transpose(1, 2)
```

一个 conv，一个 flatten，一个 transpose。这就是完整的 image-to-tokens 步骤。

### 步骤 2： Transformer block

Pre-LN、multi-head self-attention、带 GELU 的 MLP、residual connections。

```python
class Block(nn.Module):
    def __init__(self, dim, num_heads, mlp_ratio=4, dropout=0.0):
        super().__init__()
        self.ln1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, num_heads, dropout=dropout, batch_first=True)
        self.ln2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * mlp_ratio),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(dim * mlp_ratio, dim),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        a, _ = self.attn(self.ln1(x), self.ln1(x), self.ln1(x), need_weights=False)
        x = x + a
        x = x + self.mlp(self.ln2(x))
        return x
```

`nn.MultiheadAttention` 负责拆分 heads、scaled dot-product 和 output projection。`batch_first=True`，因此 shapes 是 `(N, seq, dim)`。

### 步骤 3： ViT

```python
class ViT(nn.Module):
    def __init__(self, image_size=64, patch_size=16, in_channels=3,
                 num_classes=10, dim=192, depth=6, num_heads=3, mlp_ratio=4):
        super().__init__()
        self.patch = PatchEmbedding(in_channels, patch_size, dim, image_size)
        num_patches = self.patch.num_patches
        self.cls_token = nn.Parameter(torch.zeros(1, 1, dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, dim))
        self.blocks = nn.ModuleList([
            Block(dim, num_heads, mlp_ratio) for _ in range(depth)
        ])
        self.ln = nn.LayerNorm(dim)
        self.head = nn.Linear(dim, num_classes)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)

    def forward(self, x):
        x = self.patch(x)
        cls = self.cls_token.expand(x.size(0), -1, -1)
        x = torch.cat([cls, x], dim=1)
        x = x + self.pos_embed
        for blk in self.blocks:
            x = blk(x)
        x = self.ln(x[:, 0])
        return self.head(x)

vit = ViT(image_size=64, patch_size=16, num_classes=10, dim=192, depth=6, num_heads=3)
x = torch.randn(2, 3, 64, 64)
print(f"output: {vit(x).shape}")
print(f"params: {sum(p.numel() for p in vit.parameters()):,}")
```

大约 2.8M parameters，一个可以在 CPU 上处理的小型 ViT。真正的 ViT-B 是 86M；使用同一个 class definition，并设置 `dim=768, depth=12, num_heads=12`。

### 步骤 4： Sanity check — 单图像 inference

```python
logits = vit(torch.randn(1, 3, 64, 64))
print(f"logits: {logits}")
print(f"probs:  {logits.softmax(-1)}")
```

应该能无错误运行。Probabilities 总和为 1。

## 使用它

`timm` 提供了所有 ViT 变体及其 ImageNet pretrained weights。一行代码：

```python
import timm

model = timm.create_model("vit_base_patch16_224", pretrained=True, num_classes=10)
```

`timm` 是 2026 年 vision transformers 的生产默认选择。它在同一个 API 下支持 ViT、DeiT、Swin、Swin-V2、ConvNeXt、ConvNeXt-V2、MaxViT、MViT、EfficientFormer 以及数十种其他模型。

对于 multi-modal 工作（image + text），`transformers` 提供 CLIP、SigLIP、BLIP-2、LLaVA。这些模型中的 image encoder 都是某种 ViT 变体。

## 交付它

本课会产出：

- `outputs/prompt-vit-vs-cnn-picker.md` — 一个 prompt，根据 dataset size、compute 和 inference stack，在 ViT、ConvNeXt 或 Swin 之间做选择。
- `outputs/skill-vit-patch-and-pos-embed-inspector.md` — 一个 skill，用于验证 ViT 的 patch embedding 和 positional embedding shapes 是否匹配模型期望的 sequence length，捕获最常见的移植 bug。

## 练习

1. **（Easy）** 打印上面小型 ViT 中一次 forward pass 的每个中间 tensor shape。确认：input `(N, 3, 64, 64)` -> patches `(N, 16, 192)` -> with CLS `(N, 17, 192)` -> classifier input `(N, 192)` -> output `(N, num_classes)`。
2. **（Medium）** 在 Lesson 4 的 synthetic-CIFAR 数据集上 fine-tune 一个预训练 `timm` ViT-S/16。与同一数据上的 ResNet-18 fine-tuning 做比较。报告 training time 和 final accuracy。
3. **（Hard）** 为小型 ViT 实现 MAE pretraining：mask 75% 的 patches，训练 encoder + 一个小 decoder 来重建被 mask 的 patches。比较 pretraining 前后在 synthetic data 上的 linear-probe accuracy。

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| Patch embedding | “第一个 conv” | kernel size = stride = patch size 的 conv；将图像转换为 token embeddings 的网格 |
| Class token | “[CLS]” | 加在 token sequence 前面的 learned vector；它的最终 output 是全局图像表示 |
| Positional embedding | “Learned pos” | 添加到每个 token 上的 learned vector，让 transformer 知道每个 patch 来自哪里 |
| Pre-LN | “LayerNorm before sublayer” | 稳定的 transformer 变体：使用 `x + sublayer(LN(x))`，而不是 `LN(x + sublayer(x))` |
| Multi-head attention | “Parallel attention” | 标准 transformer attention，被拆分为 num_heads 个独立子空间，之后再 concatenated |
| ViT-B/16 | “Base, patch 16” | 规范尺寸：dim=768、depth=12、heads=12、patch_size=16、image=224；约 86M params |
| DeiT | “Data-efficient ViT” | 只用 ImageNet-1k 并配合强 augmentation 训练的 ViT；证明大型 pretraining datasets 并非绝对必要 |
| MAE | “Masked autoencoder” | Self-supervised pretraining：mask 75% 的 patches 并重建；主流 ViT pretraining 配方 |

## 延伸阅读

- [An Image is Worth 16x16 Words (Dosovitskiy et al., 2020)](https://arxiv.org/abs/2010.11929) — ViT 论文
- [DeiT: Data-efficient Image Transformers (Touvron et al., 2020)](https://arxiv.org/abs/2012.12877) — 如何只用 ImageNet-1k 训练 ViT
- [Masked Autoencoders are Scalable Vision Learners (He et al., 2022)](https://arxiv.org/abs/2111.06377) — MAE 预训练
- [timm documentation](https://huggingface.co/docs/timm) — 你在生产中会使用的每一种 vision transformer 的参考文档
