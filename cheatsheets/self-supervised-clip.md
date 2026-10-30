---
id: self-supervised-clip
title: Self-Supervised Vision, CLIP and Retrieval
code: SS
subtitle: 无标签预训练，对齐图像与文本，零样本分类，塑造嵌入并检索。PyTorch。
hue: 285
sources: phases/04-computer-vision/17-self-supervised-vision, phases/04-computer-vision/18-open-vocab-clip, phases/04-computer-vision/20-image-retrieval-metric, phases/12-multimodal-ai/02-clip-contrastive-pretraining
source_hash: 7c8ba7f92fca8ec6
---

## 家族与模型
type: concepts
from: phases/04-computer-vision/17-self-supervised-vision/docs/en.md, phases/04-computer-vision/18-open-vocab-clip/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/12-multimodal-ai/02-clip-contrastive-pretraining/docs/en.md

- **对比学习 (SimCLR, MoCo, CLIP)**：把两个视图拉近。把 batch 其余部分推开。
- **教师-学生 (DINO, BYOL, iBOT)**：学生匹配 EMA 教师。没有负样本。
- **掩码 (MAE, BEiT, SimMIM)**：掩掉 75% 的 patch。重建像素。
- **CLIP**：图像塔与文本塔在同一空间。400M 网页对，无标签。
- **SigLIP**：逐对 sigmoid。没有 all-gather。小 batch 上训练更好。
- **线性探针**：冻结的编码器加一层线性层。衡量特征质量。
- **探针 top-1**：SimCLR ~71%，DINO ~77%，MAE ~76%，DINOv2 ~86%。
- **类别或实例检索**：开箱即用的嵌入对类别有效。实例需要度量学习。

## CLIP 双塔
type: architecture
from: phases/04-computer-vision/18-open-vocab-clip/docs/en.md, phases/12-multimodal-ai/02-clip-contrastive-pretraining/docs/en.md

```arch
node | img | 1,1 | Image | batch of N | client
node | ienc | 2,1 | Image encoder | ViT or ResNet | model
node | inorm | 3,1 | L2 normalise | (N, D)
node | txt | 1,2 | Caption | N captions | client
node | tenc | 2,2 | Text encoder | transformer | model
node | tnorm | 3,2 | L2 normalise | (N, D)
node | sim | 4,1 | Similarity S | N x N, over tau
node | loss | 4,2 | Symmetric CE | (i2t + t2i) / 2
edge | img | ienc |
edge | ienc | inorm |
edge | txt | tenc |
edge | tenc | tnorm |
edge | inorm | sim |
edge | tnorm | sim |
edge | sim | loss | diagonal targets
```

## 公式
type: concepts
from: phases/04-computer-vision/17-self-supervised-vision/docs/en.md, phases/04-computer-vision/18-open-vocab-clip/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/12-multimodal-ai/02-clip-contrastive-pretraining/docs/en.md

- **InfoNCE**：$-\log \frac{\exp(\mathrm{sim}(z_i, z_j)/\tau)}{\sum_{k \ne i} \exp(\mathrm{sim}(z_i, z_k)/\tau)}$
- **CLIP 矩阵**：$S_{ij} = \cos(f(x_i), g(y_j)) / \tau$。形状 N x N。
- **CLIP 损失**：对各行做 CE 再对各列做 CE，除以 2。
- **SigLIP**：每对 $\log(1 + \exp(-y_{ij} \, \mathrm{sim}_{ij}))$，其中 $y_{ij} = \pm 1$。
- **DINO EMA**：$\theta_t \leftarrow m \, \theta_t + (1 - m) \, \theta_s$
- **三元组**：$\max(0, \lVert f(a) - f(p) \rVert^2 - \lVert f(a) - f(n) \rVert^2 + \mathrm{margin})$
- **余弦与 L2**：对单位向量 $\lVert a - b \rVert^2 = 2 - 2 \cos(a, b)$。
- **Recall@K**：查询中在 top K 内有一个正确匹配的比例。

## InfoNCE 与 MAE 掩码
type: annotated-code
lang: python
from: phases/04-computer-vision/17-self-supervised-vision/docs/en.md, phases/04-computer-vision/17-self-supervised-vision/code/main.py

```python
def info_nce(z1, z2, tau=0.1):                   # z1, z2 L2-normalised
    N, D = z1.shape
    z = torch.cat([z1, z2], dim=0)               # (2N, D)
    sim = z @ z.T / tau                          # (2N, 2N)
    mask = torch.eye(2 * N, dtype=torch.bool, device=z.device)
    sim = sim.masked_fill(mask, float("-inf"))   # no self match
    targets = torch.cat([torch.arange(N, 2 * N), torch.arange(0, N)]).to(z.device)
    return F.cross_entropy(sim, targets)
num_patches = 196
visible, masked = random_mask_indices(num_patches, mask_ratio=0.75)  # keep 25%
```

## CLIP 损失与零样本
type: annotated-code
lang: python
from: phases/04-computer-vision/18-open-vocab-clip/docs/en.md, phases/04-computer-vision/18-open-vocab-clip/code/main.py

```python
sim = logit_scale * image_emb @ text_emb.T       # (N, N)
targets = torch.arange(N, device=sim.device)     # match on the diagonal
l_i = F.cross_entropy(sim, targets)              # image to text
l_t = F.cross_entropy(sim.T, targets)            # text to image
loss = (l_i + l_t) / 2                           # random init: near log(N)
i = F.normalize(model.image_proj(image_feats), dim=-1)
t = F.normalize(model.text_proj(class_text_feats), dim=-1)
pred = (i @ t.T).argmax(dim=-1)                  # one class per image
```

## 三元组损失与 recall@K
type: annotated-code
lang: python
from: phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/code/main.py

```python
def triplet_loss(anchor, positive, negative, margin=0.2):
    d_ap = F.pairwise_distance(anchor, positive, p=2)
    d_an = F.pairwise_distance(anchor, negative, p=2)
    return F.relu(d_ap - d_an + margin).mean()
pos_idx, neg_idx = semi_hard_negatives(emb, y)   # hardest positive, semi-hard negative
loss = triplet_loss(emb, emb[pos_idx], emb[neg_idx])
sim = query_emb @ gallery_emb.T                  # cosine on unit vectors
_, top_k = sim.topk(k, dim=-1)
matches = (gallery_labels[top_k] == query_labels[:, None]).any(dim=-1)
matches.float().mean().item()                    # recall@K
```

## 零样本分类
type: flow
from: phases/04-computer-vision/18-open-vocab-clip/docs/en.md, phases/12-multimodal-ai/02-clip-contrastive-pretraining/outputs/skill-clip-zero-shot.md

1. **提示**：为每个类别写 "a photo of a {class}"。
2. **集成**：每个类别平均多个模板，top-1 再多 1-3%。
3. **文本塔**：编码这些 prompt。`T` 的形状是 (C, d)。
4. **图像塔**：编码图像。`I` 的形状是 (1, d)。
5. **归一化**：让两侧都是单位长度。
6. **打分**：`I @ T.T` 给出形状 (1, C)。
7. **预测**：argmax 给出类别。top-1 分数低于 0.2 时发出警告。

## 代码中的任务
type: task-table
span: 2
from: phases/04-computer-vision/17-self-supervised-vision/code/main.py, phases/04-computer-vision/18-open-vocab-clip/code/main.py, phases/04-computer-vision/20-image-retrieval-metric/code/main.py, phases/12-multimodal-ai/02-clip-contrastive-pretraining/code/main.py

| 任务 | 代码 |
|---|---|
| 两个视图上的对比损失 | `info_nce(z1, z2, tau=0.1)` |
| 带中心化的 DINO 教师 | `DinoHead().teacher(x, temp=0.04)` |
| CLIP 对称损失 | `clip_loss(i, t, logit_scale)` |
| 零样本标签 | `zero_shot_classify(model, image_feats, class_text_feats, class_names)` |
| 挖掘 semi-hard 负样本 | `semi_hard_negatives(emb, labels, margin=0.2)` |
| K 处的召回 | `recall_at_k(query_emb, gallery_emb, query_labels, gallery_labels, k=1)` |
| 纯 Python 的对称 InfoNCE | `infonce_loss(S)` |
| SigLIP 逐对损失 | `sigmoid_loss(S, bias=0.0)` |

## 默认值与数字
type: defaults
from: phases/04-computer-vision/17-self-supervised-vision/docs/en.md, phases/04-computer-vision/17-self-supervised-vision/code/main.py, phases/04-computer-vision/18-open-vocab-clip/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| SimCLR `tau` | 0.1 | 更低更锐，需要更多负样本 |
| CLIP `tau` 初始值 | 0.07 | 可学习。`logit_scale` 从 ln(1/0.07) 开始 |
| SimCLR batch | 512-8192 | 每个正样本有许多负样本 |
| MAE `mask_ratio` | 0.75 | BERT 掩掉 15% 的 token |
| MAE 解码器 | 8-layer，512-dim | 编码器只看到可见 patch |
| DINO EMA m | 0.996 | 教师是学生的 EMA |
| DINO 教师 `temp` | 0.04 | 学生 `temp` 0.1 |
| 三元组 `margin` | 0.2 | semi-hard 挖掘用同一 margin |

## 选择 FAISS 索引
type: command-table
from: phases/04-computer-vision/20-image-retrieval-metric/docs/en.md

| 命令 | 作用 |
|---|---|
| `IndexFlatIP` | 精确内积。100k 个向量上的余弦 |
| `IndexFlatL2` | 精确 L2，暴力搜索，无需训练 |
| `IndexIVFFlat` | K 个单元，只搜最近的几个。需要训练。10M |
| `IndexHNSW` | 图索引。查询多时最快。索引较大 |
| `IndexIVFPQ` | 加上乘积量化。100M+ 个向量 |
| DINOv2 + FAISS | 通用视觉检索，开箱即用 |
| CLIP + FAISS | 查询是文本 |
| 微调后的 DINOv2 + FAISS | 实例检索、re-ID、电商 |

## 排障
type: troubleshooting
from: phases/04-computer-vision/17-self-supervised-vision/docs/en.md, phases/04-computer-vision/20-image-retrieval-metric/docs/en.md, phases/12-multimodal-ai/02-clip-contrastive-pretraining/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| InfoNCE 在 batch 32 上失败 | 负样本太少 | Batch 512-8192 或动量队列 |
| DINO 给出常数向量 | 表征坍缩 | 对教师做中心化与锐化 |
| 掩码任务太容易 | 掩码比例太低 | 掩掉 75% 的 patch |
| recall@10 高，recall@1 低 | 排序有噪声 | 更长微调或重排 |
| 近邻发生变化 | 混用了余弦和 L2 | 与嵌入训练匹配 |
| 实例搜索漏检 | 开箱即用特征 | 用度量学习微调 |
| 三元组损失接近 0 | 简单三元组 | Semi-hard 挖掘 |
| Softmax 损失在多 GPU 上慢 | 嵌入的 all-gather | 使用 sigmoid 损失 |

## 问题
type: qa
from: phases/04-computer-vision/17-self-supervised-vision/docs/en.md, phases/04-computer-vision/18-open-vocab-clip/docs/en.md, phases/12-multimodal-ai/02-clip-contrastive-pretraining/docs/en.md

- **为什么 MAE 用 75% 而 BERT 用 15%？** 图像 patch 熵低。邻居会把像素泄露出去。
- **随机对上的 InfoNCE？** 约为 log(2N - 1)。16 对时是 3.4。
- **随机初始化时的 CLIP 损失？** 接近 log(N)。N = 8 时是 2.08。
- **线性探针还是微调？** 微调再加 2-5 个点。探针只衡量特征。
- **DINOv2 嵌入？** `outputs.last_hidden_state[:, 0]`，即 CLS token，768-dim。
- **零样本、探针还是微调？** 域内探针胜过零样本。微调可能伤害零样本迁移。
