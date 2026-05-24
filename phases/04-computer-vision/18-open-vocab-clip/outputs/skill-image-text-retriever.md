---
name: skill-image-text-retriever
description: 使用任意 CLIP checkpoint 构建图像 Embedding 索引；支持 query-by-text 和 query-by-image
version: 1.0.0
phase: 4
lesson: 18
tags: [clip, retrieval, faiss, zero-shot]
---

# Image-Text Retriever

使用 CLIP embeddings 将一个图像文件夹转换为可搜索索引。

## 何时使用

- 在内部目录上构建 zero-shot 图像搜索。
- 通过 Embedding 距离对近乎相同的图像进行去重。
- 在没有标注数据集的情况下，快速构建“find similar”组件。

## 输入

- `image_folder`: 图像文件目录。
- `clip_model`: HuggingFace id，例如 `openai/clip-vit-base-patch32` 或 `google/siglip-base-patch16-224`。
- `index_type`: flat | IVF | HNSW。
- `embedding_dim`: 从模型推断。

## 步骤

1. 加载 CLIP 模型和 preprocessor。
2. 对文件夹中的每张图像进行 batch 编码。将 embeddings 保存为 (N, D) float32 + 文件名列表。
3. 在 embeddings 上构建 FAISS 索引。对 L2-normalised vectors 使用 inner-product 来得到 cosine similarity。
4. 暴露两个查询接口：
   - `search_by_text(text, k)` — embed 文本并搜索。
   - `search_by_image(image_path, k)` — embed 图像并搜索。

## 输出模板

```python
import os
import glob
import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
import faiss


class ImageTextRetriever:
    def __init__(self, model_name="openai/clip-vit-base-patch32"):
        self.model = CLIPModel.from_pretrained(model_name).eval()
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.dim = self.model.config.projection_dim
        self.index = None
        self.filenames = []

    @torch.no_grad()
    def _encode_images(self, paths, batch=16):
        embs = []
        for i in range(0, len(paths), batch):
            imgs = [Image.open(p).convert("RGB") for p in paths[i:i + batch]]
            inputs = self.processor(images=imgs, return_tensors="pt")
            out = self.model.get_image_features(**inputs)
            out = out / out.norm(dim=-1, keepdim=True)
            embs.append(out.cpu().numpy())
        return np.concatenate(embs).astype(np.float32)

    @torch.no_grad()
    def _encode_text(self, texts):
        inputs = self.processor(text=texts, return_tensors="pt", padding=True)
        out = self.model.get_text_features(**inputs)
        out = out / out.norm(dim=-1, keepdim=True)
        return out.cpu().numpy().astype(np.float32)

    def build_index(self, folder, index_type="flat"):
        exts = ("*.jpg", "*.jpeg", "*.png", "*.webp", "*.bmp")
        files = []
        for ext in exts:
            files.extend(glob.glob(os.path.join(folder, ext)))
        self.filenames = sorted(files)
        embs = self._encode_images(self.filenames)
        if index_type == "IVF":
            quantizer = faiss.IndexFlatIP(self.dim)
            nlist = min(256, max(4, len(embs) // 32))
            self.index = faiss.IndexIVFFlat(quantizer, self.dim, nlist)
            self.index.train(embs)
        elif index_type == "HNSW":
            self.index = faiss.IndexHNSWFlat(self.dim, 32, faiss.METRIC_INNER_PRODUCT)
        else:
            self.index = faiss.IndexFlatIP(self.dim)
        self.index.add(embs)

    def search_by_text(self, text, k=5):
        q = self._encode_text([text])
        dist, idx = self.index.search(q, k)
        return [(self.filenames[i], float(d)) for d, i in zip(dist[0], idx[0])]

    def search_by_image(self, image_path, k=5):
        q = self._encode_images([image_path])
        dist, idx = self.index.search(q, k)
        return [(self.filenames[i], float(d)) for d, i in zip(dist[0], idx[0])]
```

## 报告

```
[retriever]
  model:          <name>
  num_images:     <int>
  dim:            <int>
  index_type:     flat | IVF | HNSW
  index_size_mb:  <float>
```

## 规则

- 建索引前始终对 embeddings 做 L2-normalise；FAISS 在 normalised vectors 上的 inner product 等于 cosine similarity。
- 对于 < 100k 张图像，`IndexFlatIP`（exact）最简单且最快。
- 对于 100k-10M，`IndexIVFFlat` 是标准折中方案。
- 对于 > 10M，使用 HNSW 或 product-quantised 变体。
- 不要在每次查询时重建索引；embed 一次，搜索多次。
