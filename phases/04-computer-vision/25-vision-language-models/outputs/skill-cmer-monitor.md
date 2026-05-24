---
name: skill-cmer-monitor
description: 为生产 VLM endpoint 接入 Cross-Modal Error Rate 监控、dashboard 和 alert
version: 1.0.0
phase: 4
lesson: 25
tags: [vlm, production, monitoring, hallucination]
---

# CMER Monitor

将 cross-modal alignment 视为一等生产 KPI。

## 何时使用
- 部署任何基于图像生成文本的 VLM endpoint。
- 调查关于幻觉响应的报告。
- 跟踪输入分布漂移是否会降低模型 grounding 能力。

## 输入
- `vlm_output`: 生成的文本。
- `text_confidence`: softmax 后的平均 per-token probability，范围为 `[0, 1]`。计算方式为 `exp(mean(log_probs))`。不要传入 raw logits；raw logits 无界，而 `conf_threshold` 假设输入是概率。
- `image_embedding`: 图像的 CLIP-family Embedding（DINOv3、SigLIP、CLIP）。
- `text_embedding`: 生成文本的 CLIP-family Embedding。
- 可选 `prompt_type`: 用于分组的标签（vqa / ocr / captioning / agent）。

## Per-request computation

```python
import torch

def cmer_flag(image_emb, text_emb, text_conf, sim_thr=0.25, conf_thr=0.8):
    if image_emb.shape != text_emb.shape:
        raise ValueError(f"emb shape mismatch: {image_emb.shape} vs {text_emb.shape}")
    image_emb = image_emb / (image_emb.norm() + 1e-8)
    text_emb = text_emb / (text_emb.norm() + 1e-8)
    sim = float((image_emb * text_emb).sum())
    flagged = (text_conf > conf_thr) and (sim < sim_thr)
    return {"sim": sim, "flagged": flagged}
```

Embeddings 是来自独立 CLIP-family encoder 的 1-D PyTorch tensors（`torch.float32`）。如果使用 NumPy arrays，将 `.norm()` 替换为 `np.linalg.norm(...)`，并相应转换输出。

将 `sim`、`text_conf`、`flagged`、`prompt_type`、`timestamp`、`model_version`、`request_id` 存入你的 monitoring pipeline（Prometheus、DataDog、OpenTelemetry）。

## Aggregate metric

```
CMER = (flagged requests in window) / (total requests in window)
```

按 endpoint、prompt_type、model version 报告。

## Alert thresholds

- Baseline CMER：基于 7 天正常流量建立。
- Warning：CMER >= 1.5x baseline 持续 1 小时。
- Critical：CMER >= 2x baseline 持续 30 分钟，或任意窗口绝对值 > 15%。

## Dashboard panels

1. CMER over time（5-minute bucket，7-day window）。
2. 按 prompt_type 展示 CMER（stacked bar）。
3. 每小时 `sim` 分布（histogram）。
4. Top hallucinated outputs（每天抽样 20 条 flagged responses 供人工审查）。

## Actions when CMER spikes

1. 抽样 flagged requests。
2. 确认 model version 没有被意外更改。
3. 检查输入分布（新的文件格式？新的图像来源？压缩方式不同？）。
4. 在 spike 解决前，将受影响流量路由到人工审查。
5. 如果 spike 持续存在，fine-tune 或替换模型；不要压制 alert。

## 规则
- 永远不要使用 VLM 自身的 Embedding 计算 CMER；使用独立 encoder（DINOv3、SigLIP 或 CLIP-L/14）。否则你测量的是模型的自洽性，而不是 alignment。
- 始终记录原始 `sim` 值，而不只是 `flagged` bit；在 flag rate 变化前，分布漂移会先出现在 lower quartile。
- 不要在没有 CMER monitoring 的情况下发布 VLM endpoint；幻觉是主要的生产 failure mode，没有这个 metric 就是静默的。
- 对于敏感领域（medical、legal、financial），将 `sim_threshold` 提高到 0.35 或更高；flag 条件是 `sim < sim_threshold`，因此更高阈值会捕获更多可能未 grounding 的输出，这是高风险场景下合适的默认设置。
