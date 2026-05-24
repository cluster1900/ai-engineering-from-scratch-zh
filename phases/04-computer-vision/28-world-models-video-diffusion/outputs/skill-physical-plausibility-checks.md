---
name: skill-physical-plausibility-checks
description: 在发布前，对任何生成视频自动检查 object permanence、gravity 和 continuity
version: 1.0.0
phase: 4
lesson: 28
tags: [video-generation, quality, physics, evaluation]
---

# Physical Plausibility 检查

生成视频的生产部署需要自动化 guardrails。人工审核无法 scale；physics 检查可以捕捉经典 failure modes。

## 何时使用

- 任何从文本或图像 prompt 生成视频的产品。
- 在 video generation API endpoint 上自动化 QA。
- 在 fine-tuning 或 base-model 更新后，监控 video model 的质量漂移。

## 输入

- `video`：一个 tensor `(T, H, W, 3)`，或一个 mp4 路径。
- 可选 reference info：预期 object 数量、初始 scene description。

## 检查

### 1. Object permanence
使用 SAM 3.1 Object Multiplex 跨 frame 跟踪每个 detection。当一个稳定 track 消失 <=3 frames 后又重新出现时标记：model 暂时丢失了该 object。当 object 在 frame 中心附近消失时 hard fail（不是在边缘）；在边缘则 soft fail。

### 2. Motion smoothness
连续 frames 之间的 Optical flow 应该大体连续。突然的 per-pixel flow spikes 表明 teleportation。用 RAFT 计算 flow；当某些 frames 的第 99 百分位 flow magnitude 超过 median 的 10 倍以上时标记。

### 3. Gravity / support
对于被检测为 solid 的 objects（food、balls、tools），检查在没有 lifting action 的情况下，它们的垂直位置是否没有上升。除非在 object 附近检测到 "grasping hand"，否则标记 upward drift。

### 4. Identity consistency
对于 people 或 characters，跨 frames 使用 face-recognition Embedding。对于 persistent identity，Cosine similarity 在 5-frame windows 内应保持 > 0.8。低于 threshold 表示 character 发生了 morph。

### 5. Hands and limbs
运行 pose estimator（Lesson 21）。标记以下 frames：一只手有 > 5 或 < 4 个可见 fingers；arm length 在 frames 之间翻倍；limbs 穿过 surface 与 body 相交。

### 6. Text rendering（如果 prompt 要求文字）
如果 user prompt 包含引号中的 string，对生成 frames 做 OCR，并计算相对于请求 string 的 CER。标记 > 20% CER。

## 报告
```
[plausibility]
  video frames:           <T>
  permanence violations:  <N>
  smoothness violations:  <N>
  gravity violations:     <N>
  identity drift:         <N of 5-frame windows>
  limb anomalies:         <N>
  OCR CER vs requested:   <float>

[verdict]
  ship | hold | reject

[samples for review]
  frame ranges where each failure occurred
```

## 规则

- 不要因为任何单一检查而 hard-block；聚合 scores，并在 total anomalies 超过 threshold 时将 video hold 以供 review。
- 对 identity drift 和 permanence violations 赋予最高权重，因为 users 最先注意到它们。
- 随时间记录 per-check failure rates；上升趋势通常意味着 base model 被更新，或 prompt distribution 发生了变化。
- 永远不要删除被标记的 video；保留它用于 model debugging 和 post-mortems。
- 对于 sensitive content（people、children、public figures），无论 score 如何，都要求对每个 video 进行人工 review。
