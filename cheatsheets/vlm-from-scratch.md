---
id: vlm-from-scratch
title: Build a VLM from Scratch
code: BV
subtitle: patch 嵌入、ViT 编码器、MLP 投影器、交叉注意力解码器、InfoNCE 加 LM 预训练、R@K、EM 和 BLEU-4。
hue: 25
sources: phases/19-capstone-projects/58-vision-encoder-patches, phases/19-capstone-projects/59-vit-transformer, phases/19-capstone-projects/60-projection-layer-modality-align, phases/19-capstone-projects/61-cross-attention-fusion, phases/19-capstone-projects/62-vision-language-pretraining, phases/19-capstone-projects/63-multimodal-eval
source_hash: 70009b06f92fcb5f
---

## VLM 栈
type: architecture
from: phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md, phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/19-capstone-projects/60-projection-layer-modality-align/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md, phases/19-capstone-projects/62-vision-language-pretraining/docs/en.md

```arch
node | img | 1,1 | Image | 224x224x3 | client
node | patch | 2,1 | PatchEmbed | Conv2d, 196 tokens + CLS | process
node | vit | 3,1 | ViT | 12 blocks, 12 heads, pre-LN | model
node | proj | 4,1 | MLPProjector | linear, GELU, linear | process
node | text | 1,2 | Caption ids | mean-pooled text table | client
node | dec | 3,2 | Decoder | causal self + cross-attention | model
node | loss | 4,2 | Losses | InfoNCE + LM | process
edge | img | patch |
edge | patch | vit | 197 tokens
edge | vit | proj | CLS
edge | vit | dec | memory K, V
edge | text | dec | queries
edge | proj | loss | image_emb
edge | dec | loss | logits
```

## 运行每课
type: command-table
span: 2
from: phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md, phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/19-capstone-projects/60-projection-layer-modality-align/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md, phases/19-capstone-projects/62-vision-language-pretraining/docs/en.md, phases/19-capstone-projects/63-multimodal-eval/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py`（58） | 形状为 `(1, 197, 768)` 的 token。Unfold 与 Conv2d 匹配 |
| `python3 code/main.py`（59） | 编码为 `(1, 197, 768)`。约 86M 参数 |
| `python3 code/main.py`（60） | 200 步。损失从约 1.07 到约 0.80 |
| `python3 code/main.py`（61） | Logits `(2, 10, text_vocab)`，掩码 `(10, 10)`，缓存检查 |
| `python3 code/main.py`（62） | 50 步。对比损失接近 2.77 到 2.4。LM 从 6.24 到 4.7 |
| `python3 code/main.py`（63） | 50 个训练步前后的指标 |
| `python3 -m unittest code/test_main.py` | 运行一课的测试 |

## 构建与编码
type: annotated-code
lang: python
from: phases/19-capstone-projects/58-vision-encoder-patches/code/main.py, phases/19-capstone-projects/59-vit-transformer/code/main.py

```python
cfg = ViTConfig()                         # 224, 16, 768, depth 12, heads 12
encoder = VisionEncoder(cfg).eval()       # front end plus ViT stack
img = synthesize_image(seed=0)            # (1, 3, 224, 224) in [0, 1]
tokens, cls = encoder(img)                # (1, 197, 768) and (1, 768)
pos = sinusoidal_2d(grid_h, grid_w, dim)  # dim divisible by 4
ref = unfold_then_linear(img, weight, bias, cfg.patch_size)
nn.Conv2d(cfg.in_channels, cfg.hidden,
          kernel_size=cfg.patch_size, stride=cfg.patch_size)
x = x + self.attn(self.ln1(x))            # pre-LN residual
x = x + self.ffn(self.ln2(x))             # GELU MLP, 4x wide
```

## 对齐、融合与预训练
type: annotated-code
lang: python
from: phases/19-capstone-projects/60-projection-layer-modality-align/code/main.py, phases/19-capstone-projects/61-cross-attention-fusion/code/main.py, phases/19-capstone-projects/62-vision-language-pretraining/code/main.py

```python
projector = MLPProjector(cfg.vision_hidden, cfg.projection_hidden, cfg.text_hidden)
freeze(encoder)                                     # requires_grad_(False)
loss = cosine_alignment_loss(image_emb, text_emb)   # mean of 1 - cos
mask = causal_mask(10)                              # (10, 10) lower triangle
logits = decoder(text_ids, memory, use_cache=True)  # image K, V cached
contrast, sim = info_nce_loss(image_emb, text_emb, self.log_tau)
lm = lm_loss(logits, targets, padding_id=PAD_ID)    # PAD_ID is 0
total = contrast + cfg.lm_weight * lm
```

## VLM 中的注意力
type: comparison
from: phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md

| 因素 | ViT 自注意力 | 解码器自注意力 | 交叉注意力 |
|---|---|---|---|
| 查询 | 图像 token | 文本 token | 文本 token |
| 键和值 | 图像 token | 文本 token | 图像 memory token |
| 掩码 | 无掩码 | 因果 `(Nt, Nt)` | 无掩码 |
| 输出形状 | `(B, 197, 768)` | `(B, Nt, hidden)` | `(B, Nt, hidden)` |
| 原因 | 仅编码器且双向 | 自回归中不能超前看 | 整张图可见 |
| 缓存 | 不使用 | 不使用 | 每张图一次计算图像 K, V |

## 一次预训练步骤
type: flow
from: phases/19-capstone-projects/62-vision-language-pretraining/code/main.py, phases/19-capstone-projects/62-vision-language-pretraining/docs/en.md

1. **采样器**：从 200 对语料中无放回地抽取 16 对。
2. **编码器**：返回 memory token 和投影后的图像嵌入。
3. **文本侧**：对嵌入后的 caption id 做均值池化得到 `text_emb`。
4. **InfoNCE**：对两者做 L2 归一化。对行和列做交叉熵，再取均值。
5. **解码器**：读取 `text_ids[:, :-1]`，预测 `text_ids[:, 1:]`。
6. **LM 损失**：忽略 padding id 0 的交叉熵。
7. **Adam**：在 `contrast + lm_weight * lm` 上迈一步。每 5 步打印一次。

## 形状与数字
type: concepts
from: phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md, phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/19-capstone-projects/60-projection-layer-modality-align/docs/en.md, phases/19-capstone-projects/63-multimodal-eval/docs/en.md

- **patch**：224 / 16 得到 14x14 网格，196 个 patch，每个 768 个值。
- **注意力代价**：196 个 token 每层每头给出 38,416 个分数。
- **投影**：ViT-Base/16 有 590,592 个参数。CLS 再加 768。
- **头维度**：768 / 12 个头得到 64。
- **每块**：约 7.1M。12 块约 85M。编码器约 86M。
- **投影器**：`768 -> 1024 -> 512` 头约 1.3M。
- **余弦损失**：对齐时为 0，相反时为 2。
- **随机 R@K，N=50**：R@1 0.02，R@5 0.10，R@10 0.20。

## 评估模型
type: task-table
span: 2
from: phases/19-capstone-projects/63-multimodal-eval/code/main.py

| 任务 | 代码 |
|---|---|
| 构建评估套件 | `build_eval_suite(seed, n_samples, vocab_size, max_len)` |
| 图像与文本召回 | `i2t, t2i = recall_at_k(sim, k)` |
| VQA 准确率 | `vqa_exact_match(predictions, references)` |
| 描述分数 | `bleu4(generated, references, smoothing=True)` |
| 全部三项指标 | `evaluate(model, suite)` |
| 在评估之间训练 | `contrast, lm, _ = model(imgs, ids)` |

## 配置默认值
type: defaults
from: phases/19-capstone-projects/58-vision-encoder-patches/code/main.py, phases/19-capstone-projects/59-vit-transformer/code/main.py, phases/19-capstone-projects/60-projection-layer-modality-align/code/main.py, phases/19-capstone-projects/61-cross-attention-fusion/code/main.py, phases/19-capstone-projects/62-vision-language-pretraining/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `image_size`，`patch_size` | 224 | patch 16，隐藏维度 768 |
| `depth`，`heads` | 12 | `mlp_ratio` 4.0，LayerNorm eps 1e-6 |
| 对齐 `steps` | 200 | 32 对，lr 3e-4 |
| `projection_hidden` | 1024 | `text_hidden` 512 |
| 解码器 `hidden` | 256 | 8 个头，深度 4，197 个视觉 token |
| 预训练 `batch_size` | 16 | 50 步，lr 5e-4 |
| `lm_weight` | 1.0 | LM 损失的权重 |
| `init_log_tau` | math.log(1.0 / 0.07) | 缩放夹到 1e-3 和 100.0 |

## 错误与修复
type: troubleshooting
from: phases/19-capstone-projects/58-vision-encoder-patches/code/main.py, phases/19-capstone-projects/59-vit-transformer/code/main.py, phases/19-capstone-projects/60-projection-layer-modality-align/code/main.py, phases/19-capstone-projects/61-cross-attention-fusion/code/main.py, phases/19-capstone-projects/62-vision-language-pretraining/code/main.py, phases/19-capstone-projects/63-multimodal-eval/code/main.py

| 症状 | 原因 | 修复 |
|---|---|---|
| `patch_size ... must divide image_size` | 网格不是整数 | 选一个能整除图像的patch 大小 |
| `spatial mismatch` 来自 `PatchEmbed` | 输入尺寸与配置不同 | 缩放到 `image_size` |
| `sinusoidal_2d dim must be divisible by 4` | 隐藏尺寸不是 4 的倍数 | 使用能被 4 整除的隐藏尺寸 |
| `hidden ... not divisible by heads` | 头维度不是整数 | 选能整除 hidden 的头数 |
| `could not load lesson 58 main.py` | 课程文件夹被挪走 | 保持相邻课程文件夹在原位 |
| `causal mask shape ... does not match` | 掩码不是 `(Nt, Nt)` | 用 `causal_mask(nt)` 构建它 |
| `batch_size ... cannot exceed corpus size` | 无放回采样 | 降低 batch size 或增加配对 |
| `k ... not in [1, N]` | K 大于池子 | 把 k 保持在 N 及以下 |

## 问题
type: qa
from: phases/19-capstone-projects/58-vision-encoder-patches/docs/en.md, phases/19-capstone-projects/59-vit-transformer/docs/en.md, phases/19-capstone-projects/60-projection-layer-modality-align/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md, phases/19-capstone-projects/62-vision-language-pretraining/docs/en.md

- **为什么用 patch，不用像素？** 150,528 个像素 token 让注意力无法承受。
- **对齐时为什么冻结编码器？** 只有 1.3M 的投影器需要学习。
- **为什么用后期融合？** 文本保持干净。图像 K, V 每张图只算一次。
- **为什么要学习温度？** 太小会噪声大。太大会把 softmax 压平。
