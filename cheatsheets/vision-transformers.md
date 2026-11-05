---
id: vision-transformers
title: Vision Transformers and Patch Tokens
code: VT
subtitle: 切 patch、嵌入，加上 CLS 和位置，跑 pre-LN 块。Token 数、参数量，以及任意分辨率打包。
hue: 220
sources: phases/04-computer-vision/14-vision-transformers, phases/07-transformers-deep-dive/09-vision-transformers, phases/12-multimodal-ai/01-vision-transformer-patch-tokens, phases/12-multimodal-ai/06-any-resolution-patch-n-pack, phases/19-capstone-projects/58-vision-encoder-patches, phases/19-capstone-projects/59-vit-transformer
source_hash: 75419a9d2b4e8c01
---

## ViT 流水线
type: architecture
from: phases/04-computer-vision/14-vision-transformers/docs/en.md

```arch
node | img | 1,1 | Image | (3, 224, 224) | client
node | patch | 2,1 | Patch embedding | conv 16x16 s=16 | process
node | flat | 3,1 | Flatten | (196, 768) tokens | process
node | cls | 4,1 | Prepend [CLS] | 197 tokens | store
node | pos | 4,2 | Add learned position | (197, 768) | store
node | enc | 3,2 | N encoder blocks | pre-LN | gpu
node | take | 2,2 | Take [CLS] output | | process
node | head | 1,2 | MLP classifier | | model
edge | img | patch |
edge | patch | flat |
edge | flat | cls |
edge | cls | pos |
edge | pos | enc |
edge | enc | take |
edge | take | head |
```

## 形状与开销计算
type: concepts
from: phases/12-multimodal-ai/01-vision-transformer-patch-tokens/docs/en.md, phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md, phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/04-computer-vision/14-vision-transformers/docs/en.md

- **网格**：$(H/P) \times (W/P)$ 个 patch。224、patch 为 16 时，得到 14x14 = 196 个 token。
- **Patch 向量**：$3P^2$ 个值。P = 16 时是 768。
- **投影**：`nn.Conv2d(3, D, kernel_size=P, stride=P)` 等于先 unfold，再做线性层。
- **序列**：patch，加上 1 个 CLS，再加上 register。224 上的 ViT-B/16 是 197。
- **注意力开销**：$n^2$。196 个 token 得到 38,416 个分数。150,528 个像素得到 22.6 × 10^9。
- **头的维度**：`head_dim = hidden / num_heads`。768 / 12 = 64。
- **块的参数量**：$12 D^2$ + 3k。D = 768 时大约 7.1M。12 个块是 85M。
- **Patch 嵌入的参数量**：`3 * P * P * hidden + hidden`。ViT-Base/16 是 590,592。

## 微型 ViT 前向
type: annotated-code
lang: python
from: phases/04-computer-vision/14-vision-transformers/code/main.py, phases/04-computer-vision/14-vision-transformers/docs/en.md

```python
vit = ViT(image_size=64, patch_size=16, num_classes=10, dim=192, depth=6, num_heads=3)
x = self.patch(x)                                 # (N, 16, 192)
cls = self.cls_token.expand(x.size(0), -1, -1)
x = torch.cat([cls, x], dim=1)                    # (N, 17, 192)
x = x + self.pos_embed                            # learned, trunc_normal std=0.02
for blk in self.blocks:
    x = blk(x)                                    # pre-LN attention, then MLP
return self.head(self.ln(x[:, 0]))                # classify from [CLS] only
```

## ViT-B 规模的 pre-LN 块
type: annotated-code
lang: python
from: phases/19-capstone-projects/59-vit-transformer/code/main.py, phases/19-capstone-projects/59-vit-transformer/docs/en.md

```python
cfg = ViTConfig()                                 # 224, 16, hidden 768, depth 12, heads 12
qkv = self.qkv(x).reshape(b, n, 3, h, hd).permute(2, 0, 3, 1, 4)
q, k, v = qkv[0], qkv[1], qkv[2]
scores = (q @ k.transpose(-2, -1)) * self.scale   # scale = 1 / sqrt(head_dim)
attn = F.softmax(scores, dim=-1)                  # no mask. Encoder is bidirectional
x = x + self.attn(self.ln1(x), store_attn=store_attn)
x = x + self.ffn(self.ln2(x))                     # hidden to 4 * hidden to hidden
tokens, cls = encoder(img)                        # (1, 197, 768) and (1, 768)
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/14-vision-transformers/docs/en.md, phases/19-capstone-projects/58-vision-encoder-patches/code/main.py, phases/12-multimodal-ai/01-vision-transformer-patch-tokens/code/main.py, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/code/main.py, phases/07-transformers-deep-dive/09-vision-transformers/code/main.py

| 任务 | 代码 |
|---|---|
| 预训练的 ViT-B/16 | `timm.create_model("vit_base_patch16_224")` |
| 展平 patch，只用标准库 | `patchify(image, patch_size)` |
| 固定的 2D 位置表 | `sinusoidal_2d(grid_h, grid_w, dim)` |
| 核对 Conv2d 的计算 | `unfold_then_linear(x, weight, bias, patch_size)` |
| 序列长度 | `seq_length(cfg)` |
| 一次前向的 FLOPs | `flops_per_forward(cfg)` |
| 打包混合尺寸 | `pack_batch(images, patch)` |
| 块对角掩码 | `build_dense_mask(pack)` |

## 命令
type: command-table
from: phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md, phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/12-multimodal-ai/01-vision-transformer-patch-tokens/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py`（19.58） | 前端给出 (1, 197, 768) |
| `python3 code/main.py`（19.59） | 完整编码器。大约 86M 个参数 |
| `python3 -m unittest code/test_main.py` | 跑形状测试和等价性测试 |
| `code/main.py`（12.01） | patch 分词器，以及几何计算器 |

## 模型规模
type: defaults
from: phases/04-computer-vision/14-vision-transformers/docs/en.md, phases/07-transformers-deep-dive/09-vision-transformers/docs/en.md, phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/12-multimodal-ai/01-vision-transformer-patch-tokens/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| ViT-B/16 | 86M | dim=768，depth=12，heads=12 |
| ViT-Large | ~307M | hidden=1024，depth=24，heads=16 |
| ViT-Huge | ~632M | 特征维度 1280 |
| SigLIP So400M | 400M | hidden=1152，depth=27，heads=16 |
| 微型 ViT（第 4.14 课） | 2.8M | dim=192，depth=6，CPU |
| MLP 扩展 | 4 倍 | 2 倍会欠拟合，8 倍会过拟合 |
| Register token | 4 | DINOv2 和 SigLIP 2 |
| MAE 掩码 | 75% | 编码器只看可见的那 25% |

## patch 大小与 token 数
type: defaults
from: phases/04-computer-vision/14-vision-transformers/docs/en.md, phases/12-multimodal-ai/01-vision-transformer-patch-tokens/docs/en.md, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 224，patch 16 | 196 tokens | 标准 |
| 224，patch 32 | 49 tokens | 更快，分辨率更低 |
| 224，patch 8 | 784 tokens | 更细，开销随平方增长 |
| 384 上的 SigLIP 2 SO400m/14 | 729 个 patch tokens | 2026 年默认的 VLM 塔 |
| NaFlex 的预算 | 256、729、1024 | 一个 checkpoint，推理时再选 |
| AnyRes 672x672，2x2 再加缩略图 | 2880 | 4 * 576 + 576 |
| OCR 和文档 | 1024-4096 Token | 自然照片需要 256-576 |

## 用 patch-n'-pack 打包混合 batch
type: flow
from: phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/code/main.py

1. **网格**：按 patch 大小 14，计算每张图自己的原生 patch 网格。
2. **展平**：每张图变成自己的一条变长序列。
3. **拼接**：把所有序列接成一条。偏移量给出 `cu_seqlens`。
4. **掩码**：建一个块对角掩码。patch 只在自己那张图的内部做注意力。
5. **位置**：给每个 patch 2D RoPE，或者分数位置。
6. **结果**：576 + 256 + 768 个 token 变成一条 1600 个 token 的序列。没有填充。

## 池化与位置的选择
type: concepts
from: phases/12-multimodal-ai/01-vision-transformer-patch-tokens/docs/en.md, phases/07-transformers-deep-dive/09-vision-transformers/docs/en.md, phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md

- **[CLS] token**：它最终的隐藏状态就是这张图。最初的 ViT 和 CLIP 用它。
- **平均池化**：对 patch 的输出取平均。SigLIP 和 DINOv2 用它。
- **Register token**：额外的 4 到 16 个 token 吸收高范数伪影。交给 LLM 之前把它们丢掉。
- **学到的 1D 位置**：把模型绑在训练时的分辨率上。
- **2D 正弦**：固定的，0 个参数。维度的一半是行，一半是列。
- **2D-RoPE、M-RoPE**：按 (row, col) 旋转 q 和 k。没有位置表。
- **交给 VLM**：跳过池化。每个 patch 都变成 LLM 的一个输入 token。

## 排障
type: troubleshooting
from: phases/04-computer-vision/14-vision-transformers/docs/en.md, phases/12-multimodal-ai/01-vision-transformer-patch-tokens/docs/en.md, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md, phases/19-capstone-projects/58-vision-encoder-patches/code/main.py, phases/19-capstone-projects/59-vit-transformer/code/main.py

| 症状 | 原因 | 修复 |
|---|---|---|
| ImageNet-1k 上 ViT 输给 ResNet | 没有 CNN 的先验，数据也太少 | 用 DeiT 的配方，或者 MAE 预训练 |
| 很深的堆叠训不起来 | 过了 6-8 层还在用 post-LN | 改用 pre-LN |
| 换了分辨率，位置就坏了 | 用的是学到的 1D 位置表 | 做插值，或者改用 2D-RoPE |
| 文字被压扁，图表标签丢了 | 缩成了正方形 | 按原生分辨率来编码 |
| 50%+ 的 token 是填充 | 填充到了最长的一边 | 用带掩码的 patch-n'-pack |
| 出现高范数的伪影 patch | 没有 sink token | 加上 register token |
| 网格上抛出 ValueError | `patch_size` 不能整除 `image_size` | 换一个能整除的 patch 大小 |
| `sinusoidal_2d` 报错 | dim 不能被 4 整除 | 把 dim 选成 4 的倍数 |

## 问题
type: qa
from: phases/04-computer-vision/14-vision-transformers/docs/en.md, phases/07-transformers-deep-dive/09-vision-transformers/docs/en.md, phases/12-multimodal-ai/01-vision-transformer-patch-tokens/docs/en.md, phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md

- **为什么用 patch，不用像素？** 一张 224x224 的图有 150,528 个像素 token。注意力的开销是平方的。
- **为什么用 pre-LN？** 它能稳定地训练很深的堆叠，而且不需要预热。
- **patch 用 14 还是 16？** patch 14 的 token 更多。做 OCR 和稠密任务更好，但是更慢。
- **稠密特征用哪个 backbone？** 用 DINOv2。要和文本对齐，就用 CLIP 或 SigLIP。
- **位置用学到的，还是正弦的？** 分辨率固定时，学到的更好。分辨率会变时，正弦的更好。
