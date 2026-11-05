---
id: vlm-architectures
title: Vision-Language Model Architectures
code: VL
subtitle: ViT、桥接、LLM。投影器、Q-Former、Perceiver、门控交叉注意力、训练阶段与配方数字。
hue: 265
sources: phases/04-computer-vision/25-vision-language-models, phases/12-multimodal-ai/03-blip2-qformer-bridge, phases/12-multimodal-ai/04-flamingo-gated-cross-attention, phases/12-multimodal-ai/05-llava-visual-instruction-tuning, phases/12-multimodal-ai/07-open-weight-vlm-recipes, phases/19-capstone-projects/60-projection-layer-modality-align, phases/19-capstone-projects/61-cross-attention-fusion
source_hash: b92752a01ece3c9a
---

## ViT-MLP-LLM 模式
type: architecture
from: phases/04-computer-vision/25-vision-language-models/docs/en.md

```arch
node | img | 1,1 | Image | H x W x 3 | client
node | vit | 2,1 | Vision encoder | CLIP-L, SigLIP, DINOv3 | model
node | proj | 3,1 | Projector | 2-4 layer MLP or Q-former | process
node | txt | 1,2 | Text prompt | | client
node | tok | 2,2 | LLM tokenizer | text tokens (M, d_llm) | process
node | cat | 3,2 | Interleave or concat | image tokens in LLM space | process
node | llm | 4,2 | Decoder LLM | generates the text answer | model
edge | img | vit |
edge | vit | proj | (N, d_vit)
edge | proj | cat | (N, d_llm)
edge | txt | tok |
edge | tok | cat |
edge | cat | llm |
```

## 桥接机制
type: concepts
from: phases/04-computer-vision/25-vision-language-models/docs/en.md, phases/12-multimodal-ai/03-blip2-qformer-bridge/docs/en.md, phases/12-multimodal-ai/04-flamingo-gated-cross-attention/docs/en.md, phases/19-capstone-projects/60-projection-layer-modality-align/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md

- **MLP 投影器**：Linear、GELU、Linear。把 `(N_patches, d_vit)` 映射到 `(N_patches, d_llm)`。
- **Q-Former**：32 个可学习的 query 对冻结的 ViT patch 做交叉注意力。输出是 32 个视觉 token。
- **Perceiver resampler**：K = 64 个可学习的隐变量。不管有多少 patch，出来都是 64 个 token。
- **门控交叉注意力**：$y = \tanh(\alpha) \cdot \mathrm{cross} + x$。alpha 从 0 开始。
- **交叉注意力**：Q 来自文本流。K 和 V 来自图像流。
- **余弦对齐损失**：$1 - \cos(\mathrm{image}, \mathrm{text})$。0 是对齐，2 是相反。
- **DeepStack**：把若干个 ViT 深度上的特征叠起来，不只用最后一层。
- **CMER**：文本置信度高、图文相似度低的那些输出所占的比例。

## 三个训练阶段
type: flow
from: phases/04-computer-vision/25-vision-language-models/docs/en.md, phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md

1. **对齐**：冻结 ViT 和 LLM。只在图像-描述配对上训练投影器。
2. **LLaVA 第 1 阶段**：558k 个图像-描述配对，对描述计算 LM 损失，需要几小时。
3. **预训练**：全部解冻。在 500M+ 条交错的图像-文本配对上训练。
4. **指令微调**：在（图像，问题，答案）三元组上做微调。
5. **LLaVA 第 2 阶段**：投影器和 LLM 在 158k 轮视觉指令上训练。

## 代码中的任务
type: task-table
span: 2
from: phases/04-computer-vision/25-vision-language-models/docs/en.md, phases/04-computer-vision/25-vision-language-models/code/main.py, phases/12-multimodal-ai/04-flamingo-gated-cross-attention/code/main.py, phases/12-multimodal-ai/05-llava-visual-instruction-tuning/code/main.py, phases/19-capstone-projects/61-cross-attention-fusion/code/main.py

| 任务 | 代码 |
|---|---|
| 构建一个投影器 | `Projector(vit_dim=768, llm_dim=4096, hidden=4096)` |
| 堆叠 ViT 的各层深度 | `deepstack_features(per_layer_features)` |
| 测量 CMER | `cross_modal_error_rate(image_emb, text_emb, text_confidence)` |
| 把 patch 重采样到固定隐变量 | `perceiver_resampler(patches, num_latents=8, num_blocks=2)` |
| 门控的一步，门是关上的 | `gated_cross_attention_step(text_hidden, visual, alpha=0.0)` |
| 每个文本 token 一张图 | `interleaved_mask(seq)` |
| 带 576 个 token 的 LLaVA 提示 | `build_llava_prompt(system, user, image_tokens=576)` |
| 自注意力掩码 | `causal_mask(length)` |

## 把图像 token 并入文本
type: annotated-code
lang: python
from: phases/04-computer-vision/25-vision-language-models/docs/en.md

```python
vision_tokens = self.vit(image)                 # (B, N_patches, d_vit)
vision_embeds = self.projector(vision_tokens)   # (B, N_patches, d_llm)
text_embeds = self.llm.get_input_embeddings()(input_ids)  # (B, M, d_llm)
out = text_embeds.clone()                       # copy, then fill
for b in range(input_ids.size(0)):              # one sample at a time
    positions = (input_ids[b] == self.image_token_id).nonzero(as_tuple=True)[0]
    out[b, positions] = vision_embeds[b]        # <image> slots get vision
```

## 只训练投影层
type: annotated-code
lang: python
from: phases/19-capstone-projects/60-projection-layer-modality-align/code/main.py

```python
cfg = AlignConfig()                    # 768 -> 1024 -> 512, 200 steps
encoder = VisionEncoder(encoder_cfg).eval()
freeze(encoder)                        # requires_grad_(False)
projector = MLPProjector(cfg.vision_hidden, cfg.projection_hidden, cfg.text_hidden)
with torch.no_grad():
    _, cls = encoder(img)              # CLS pool, no encoder grads
    text_emb = text(ids)               # frozen MockTextEmbedding
image_emb = projector(cls)
loss = cosine_alignment_loss(image_emb, text_emb)
```

## 桥接数字
type: defaults
from: phases/12-multimodal-ai/03-blip2-qformer-bridge/docs/en.md, phases/12-multimodal-ai/04-flamingo-gated-cross-attention/docs/en.md, phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md, phases/12-multimodal-ai/07-open-weight-vlm-recipes/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Q-Former 的 query 数 | 32 | BLIP-2 里训练了 188M 个参数 |
| Perceiver 隐变量 K | 64 | 经过 6 个 resampler 块之后 |
| 每隔 M 层插入一个门控块 | 4 | Flamingo，alpha 的初值是 0 |
| 每张图的 LLaVA token 数 | 576 | 24x24 的网格，MLP 为 `1024 → 4096 → 4096` |
| 每张图的 AnyRes token 数 | 2880 | 336x336 的图块，再加一张缩略图 |
| Token 的最佳区间 | 576-1024 | 64 对 OCR 来说太少 |
| 动态分辨率 | min 256、max 1280 | 长边的像素数 |

## 排障
type: troubleshooting
from: phases/04-computer-vision/25-vision-language-models/docs/en.md, phases/12-multimodal-ai/04-flamingo-gated-cross-attention/docs/en.md, phases/12-multimodal-ai/07-open-weight-vlm-recipes/docs/en.md, phases/12-multimodal-ai/03-blip2-qformer-bridge/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 图像 token 处报 `ValueError` | 占位符的数量和 patch 数不一样 | 先把每个样本填充到相同的数量 |
| 很有把握，但物体认错了 | 爬取的配对里有 12% 没有落到图上 | 跟踪 CMER，把 CMER 高的送去复核 |
| 上下关系、计数都错 | VLM 在空间测试上只有 50-60% | 改用姿态、深度或检测模型 |
| 微调之后文本能力下降 | 门开得太宽，也太快 | alpha 从 0 开始，并检查门控调度 |
| OCR 很弱 | 视觉 token 太少 | 用 576-1024 个 token，或者用 AnyRes |
| 上下文很快被占满 | 每张图 576 个 token，每一帧还要更多 | 改用 32 个 token 的 Q-Former |

## 缩写
type: glossary
from: phases/04-computer-vision/25-vision-language-models/docs/en.md, phases/12-multimodal-ai/03-blip2-qformer-bridge/docs/en.md, phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md

- **VLM**：视觉语言模型。图像编码器，再加上一个完整的语言模型。
- **ITC**：图像-文本对比。对池化后的 query 和文本的 CLS 做 CLIP 式的损失。
- **ITM**：图像-文本匹配。在困难负样本上做二分类。
- **ITG**：以图像为条件的文本生成。在 query 上做因果语言模型损失。
- **CMER**：跨模态错误率。幻觉 KPI。
- **AnyRes**：把高分辨率图像切成 tile，再把每个 tile 的 token 拼起来。

## 问题
type: qa
from: phases/12-multimodal-ai/03-blip2-qformer-bridge/docs/en.md, phases/12-multimodal-ai/04-flamingo-gated-cross-attention/docs/en.md, phases/12-multimodal-ai/07-open-weight-vlm-recipes/docs/en.md, phases/19-capstone-projects/61-cross-attention-fusion/docs/en.md, phases/19-capstone-projects/60-projection-layer-modality-align/docs/en.md

- **用 Q-Former 还是 MLP？** token 预算要紧时用 Q-Former。每个 token 的质量要紧时用 MLP。
- **用 BLIP-2 还是 Flamingo？** 预算有限的单图 VQA 用 BLIP-2。少样本和多张图用 Flamingo。
- **为什么把 alpha 初始成 0？** 第 0 步时，这个模型就是那个只看文本的预训练 LLM。
- **为什么交叉注意力不加掩码？** 在任何文本之前，整张图像都是可见的。
- **为什么是两层，不是一层？** GELU 给出一次非线性的弯曲。单独一个线性层只会旋转和缩放。
- **先消融什么？** 视觉 token 的数量解释大约 60% 的方差。编码器大约 20%。连接器大约 5%。

## 默认的开放权重 VLM 配方
type: tips
from: phases/12-multimodal-ai/07-open-weight-vlm-recipes/docs/en.md

- 编码器：SigLIP 2 SO400m/14。做分割或定位时，再加 DINOv2 ViT-g/14。
- 连接器：在 patch token 上用 2 层 MLP。除非 token 数量受限，否则跳过 Q-Former。
- LLM：要省成本就用 7B，要质量就用 70B。LLM 的大小决定上限。
- 数据：PixMo + ShareGPT4V + Cauldron。稠密的人工描述胜过蒸馏。
- 训练：第 1 阶段用固定的 384。再升到最高 1280 的动态分辨率，用来做 OCR。
- 先换编码器，再换连接器。SigLIP 相比 CLIP，在 MMMU 上多了 3+ 分。
