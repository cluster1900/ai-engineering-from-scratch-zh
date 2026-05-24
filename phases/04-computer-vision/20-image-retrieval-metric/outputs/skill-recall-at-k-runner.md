---
name: skill-recall-at-k-runner
description: 为 recall@K 编写一个清晰的 evaluation harness，包含 train/val/gallery splits 和合适的 data contract
version: 1.0.0
phase: 4
lesson: 20
tags: [retrieval, evaluation, recall, faiss]
---

# Recall@K Runner

将一个包含 query 和 gallery images 以及 labels 的文件夹转换为可复现的 recall@K 数值。

## 何时使用

- 为新的 backbone 做第一个 retrieval benchmark。
- 跨 fine-tune epochs 跟踪 Embedding 质量。
- 在同一 dataset 上比较两个 retrieval systems。

## 输入

- `query_images`: paths 列表。
- `gallery_images`: paths 列表（query 可能与之重叠，也可能不重叠）。
- `query_labels`, `gallery_labels`: class 或 instance IDs。
- `encoder_fn`: callable `image -> embedding`（precomputed 或 live）。
- `ks`: 类似 `[1, 5, 10]` 的列表。

## 步骤

1. 对每张 gallery image 编码一次。保存为 numpy array。
2. 对每张 query image 编码。
3. 对两组 Embeddings 都做 L2-normalise。
4. 对每个 query，计算它与所有 gallery items 的 similarity。
5. 按降序排序，取 top max(ks)。
6. 对每个 K，检查 top-K gallery items 中是否有任何一个与 query 的 label 相同。
7. 报告 `recall@K = fraction of queries that had at least one correct neighbour in top K`。

## 输出模板

```python
import numpy as np
from sklearn.preprocessing import normalize

def encode_all(images, encoder_fn, batch=32):
    out = []
    for i in range(0, len(images), batch):
        embs = encoder_fn(images[i:i + batch])
        out.append(embs)
    return np.concatenate(out)


def recall_at_k(query_emb, gallery_emb, q_labels, g_labels,
                ks=(1, 5, 10), query_ids=None, gallery_ids=None):
    if len(query_emb) == 0 or len(gallery_emb) == 0:
        return {f"recall@{k}": 0.0 for k in ks}

    g_label_set = set(g_labels.tolist())
    keep = np.array([lbl in g_label_set for lbl in q_labels])
    if not keep.any():
        return {f"recall@{k}": 0.0 for k in ks}

    q_emb_f = query_emb[keep]
    q_lab_f = q_labels[keep]
    q_id_f = query_ids[keep] if query_ids is not None else None

    q = normalize(q_emb_f)
    g = normalize(gallery_emb)
    sims = q @ g.T

    if q_id_f is not None and gallery_ids is not None:
        self_mask = q_id_f[:, None] == gallery_ids[None, :]
        sims = np.where(self_mask, -np.inf, sims)

    top_k_max = min(max(ks), g.shape[0])
    if top_k_max <= 0:
        return {f"recall@{k}": 0.0 for k in ks}

    top = np.argpartition(-sims, top_k_max - 1, axis=1)[:, :top_k_max]
    sorted_top = np.take_along_axis(
        top, np.argsort(-sims[np.arange(len(q))[:, None], top], axis=1), axis=1
    )
    out = {}
    for k in ks:
        k_eff = min(k, top_k_max)
        hits = np.any(g_labels[sorted_top[:, :k_eff]] == q_lab_f[:, None], axis=1)
        out[f"recall@{k}"] = float(hits.mean())
    return out


def evaluate(query_images, query_labels, gallery_images, gallery_labels, encoder_fn, ks=(1, 5, 10)):
    q_emb = encode_all(query_images, encoder_fn)
    g_emb = encode_all(gallery_images, encoder_fn)
    return recall_at_k(q_emb, g_emb, np.array(query_labels), np.array(gallery_labels), ks)
```

## 报告

```
[evaluation]
  num queries:   <int>
  num gallery:   <int>
  embedding_dim: <int>

[recall]
  recall@1:  <float>
  recall@5:  <float>
  recall@10: <float>
```

## 规则

- 计算 similarity 前先 normalise Embeddings；对 normalised vectors 使用 FAISS IndexFlatIP 等同于 cosine。
- 当 query 的 ground-truth label 不在 gallery 中时，将它排除；否则 recall 会被平凡地限制在 1 以下。
- 如果 query 和 gallery 重叠，要从它自己的 top-K 中排除 query 本身，否则你测量的是 self-similarity，而不是 retrieval。
- 对于 `num_queries > 10,000`，分 batch 做 similarity matmul 以避免 OOM。
