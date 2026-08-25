# LLaVA-OneVision：一个模型中的单图像、多图像与视频

> 在 LLaVA-OneVision（Li et al., 2024 年 8 月）之前，开放 VLM 世界有着彼此分离的谱系：用于单图像的 LLaVA-1.5，像 Mantis 和 VILA 这样的多图像模型，以及像 Video-LLaVA 和 Video-LLaMA 这样的视频模型。每一种都赢得了自己的 benchmark，却在其他场景上失败。LLaVA-OneVision 主张，一个单一 curriculum 可以训练一个模型同时主导这三种场景，并且 emergent task-transfer 效应（单图像技能迁移到视频，多图像推理迁移到单图像）胜过多个专家模型之和。这个配方看起来简单得有些迷惑性：一个在不同场景中保持恒定的视觉 Token 预算，加上一个明确的 curriculum，从单图像推进到 OneVision（多图像）再到视频。本课会解读这个预算、curriculum，以及 emergent behaviors。

**Type:** Build
**Languages:** Python (stdlib, token budget solver + curriculum planner)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 12 · 06 (any-resolution)
**Time:** ~180 minutes

## 学习目标
- 设计一个在单图像、多图像和视频输入之间保持恒定的视觉 Token 预算。
- 排列一个训练 curriculum，使技能从单图像迁移到视频，同时避免 catastrophic forgetting。
- 解释为什么在相同参数规模下，如果 curriculum 做得正确，单一模型会胜过专家模型。
- 说出 LLaVA-OneVision 报告的三种 emergent capabilities：multi-camera reasoning、set-of-mark prompting、iPhone-screenshot agent。

## 问题
图像、多图像和视频会以不同方式给模型施压。

单图像需要高分辨率 Token（AnyRes，约 2880 个视觉 Token）来捕捉 OCR 和细节。每个样本的预算：1 张图像，2880 个 Token。

多图像需要多张中等分辨率图像（每张约 576 个 Token），这样跨图像推理才能放进 context。每个样本的预算：4-8 张图像，每张 576 个 Token，总计 2300-4600 个 Token。

视频需要许多低分辨率帧（pooling 后每帧约 196 个 Token）来捕捉时间动态。每个样本的预算：8-32 帧，每帧 196 个 Token，总计 1600-6200 个 Token。

如果你训练多个独立模型，你会为每个模型选择一个预算。如果你训练一个模型，你需要让预算在不同场景之间合理缩放，同时不能撑爆 context。

在 OneVision 之前，默认答案是“训练一个场景，忽略其他场景”。Video-LLaVA 通过额外训练阶段把视频能力改装到图像模型上。LLaVA-NeXT 通过 tiling 增加了多图像支持。没有一个能干净地处理三者。

## 概念
### OneVision Token 预算

LLaVA-OneVision 选择了一个统一的视觉 Token 预算，每个样本约 3000-4000 个 Token，并按场景不同分配：

- 单图像：AnyRes-9（3x3 tiles + thumbnail），每个 tile 为 384，包含 729 个 patch，使用激进的 2x2 bilinear pooling → 每个 tile 182 个 Token。总计：9 * 182 + 182 = 1820 个 Token。或 AnyRes-4，每个 tile 729 个 Token = 2916 + 729。
- 多图像：每张图像使用中等分辨率（384，不 tiling），729 个 Token，不 pooling。预算为 6 张图像 → 4374 个 Token。
- 视频：32 帧，384 分辨率，使用激进的 3x3 bilinear pool → 每帧 81 个 Token。总计：32 * 81 = 2592 个 Token。

这种分配让总 Token 数大致保持恒定。LLM 永远不会看到会撑爆 context 的 batch。Encoder 在不同场景中产生不同的几何结构，但 LLM 消耗的是同一套预算。

### 三阶段 curriculum

LLaVA-OneVision 分三个阶段训练：

1. 单图像 SFT（stage SI）。所有数据都是 single-image-plus-text。使用高分辨率 AnyRes 输入训练。这会教会模型感知、OCR 和细粒度理解。使用 LLaVA-NeXT 数据加上 OneVision-specific 单图像数据。
2. OneVision SFT（stage OV）。混合单图像 + 多图像 + 视频（均匀采样帧）。在统一 Token 预算上训练。这会教会模型处理异构 batch shape。不重置权重，而是从 stage SI 继续。
3. Task transfer（stage TT）。继续使用目标任务组合，通常根据产品需要偏重多图像或视频。可选地为部署进行 fine-tune。

关键点：curriculum 顺序很重要。即使使用相同数据，先训练视频或先训练多图像，也会比先训练单图像得到更差的图像性能。论文明确做了这一消融。

### 为什么 curriculum 有效

单图像训练建立感知基础。Patch Token 携带细粒度视觉特征；LLM 学会把它们与文本整合。多图像和视频引入结构性挑战（哪张图像是哪张，什么先发生），如果没有强感知基础，这些挑战很难学会。

如果你从零开始把所有场景混在一起训练，模型会欠拟合感知（每个 batch 中单图像数据有限），并过拟合结构（大量多图像/视频数据）。结果是一个能遵循跨图像推理模式、但视觉理解浅的模型。

Curriculum 排序让你从 stage SI 获得感知强度，再从 stage OV 获得组合/时间推理能力，同时不丢失任何一边。

### 跨场景 emergent skills

LLaVA-OneVision 论文报告了三种 emergent capabilities：

1. Multi-camera reasoning。分别在多图像 + 视频上训练；推理时，被要求理解一个多摄像头驾驶场景。尽管训练中从未见过这种确切格式，模型仍能正确整合多个视角。
2. Set-of-mark prompting。用户用编号标记注释图像中的对象；模型推理“mark 3 相对于 mark 7 在做什么”。既没有在 marks 上训练，也没有在 annotation 上训练；它是从 spatial grounding + multi-image reference 的组合中学到的。
3. iPhone-screenshot agent。用户提供一张 iPhone 屏幕截图，并要求规划下一次点击。模型训练过 UI screenshots、用户工作流视频，以及多图像 before/after pairs。它泛化到了 agent 用例。

这些不是训练任务；它们从 curriculum 的组合结构中涌现出来。

### 视觉 Token pooling

Token 预算需要 pooling。OneVision 在 2D patch grid 上使用 bilinear interpolation：24x24 = 576 个 patch 变成 12x12 = 144（2x factor）或 8x8 = 64（3x factor）。Pooling 在 patch-grid 空间中完成，而不是在 Token 空间中完成，以保留局部性。

每个场景的 pooling factor 选择本身就是一个 hyperparameter。更少 pooling = 更多 Token = 更丰富的表示。更多 pooling = 更少 Token = 能放入更多帧/图像。

### LLaVA-OneVision-1.5

2025 年后续版本（LLaVA-OneVision-1.5，arXiv 2509.23661）在训练数据、模型权重和代码上都是“fully open”。它在一些 benchmark 上缩小了与 proprietary 模型的差距，并让这个配方更民主化。相同 curriculum，更多数据，更好的 base LLM。没有架构变化。

### 与 Qwen2.5-VL 对比

Qwen2.5-VL（Lesson 12.09）做出了不同选择。它使用 M-RoPE 和 dynamic FPS，而不是固定 pooling。它的预算会随输入缩放：1 分钟视频使用的 Token 比 5 秒视频更多。LLaVA-OneVision 固定预算并缩放 pooling。两者都有效；它们在可配置性和可预测性之间做了取舍。

```figure
l5-onevision-budget
```

## 使用它
`code/main.py` 是一个用于 OneVision-style VLM 的 curriculum 和预算规划器。给定每个样本的 Token 预算，以及一个目标场景组合（比如 40% 单图像、30% 多图像、30% 视频），它会：

- 为每个场景分配 resolution、pooling factor 和 frames。
- 检查每个场景是否都落在共享预算内。
- 报告预期 Token 数量、LLM FLOPs，以及哪些场景 under-tokenized。
- 打印逐阶段训练计划。

用它来规划 OneVision fine-tune，或对 VLM 部署的每请求成本做 sanity-check。

## 交付它
本课会产出 `outputs/skill-onevision-budget-planner.md`。给定目标任务分布和每样本预算，它会输出 AnyRes factor、per-frame pooling、视频帧数和 curriculum stage weights。每当你训练或 fine-tune 一个 unified-scenario VLM 时，都使用它。

## 练习
1. 你的产品支持 80% 单图像、10% 多图像（2-4 张图像）、10% 视频（8-16 帧）。设计 Token 预算。由于不做重度多图像而省下的额外预算，你会放在哪里？

2. 阅读 LLaVA-OneVision Section 4.3（emergent capabilities）。提出一种 curriculum 可能解锁、但论文没有报告的第四种 emergent skill。

3. 交换 curriculum 顺序：先训练多图像，再训练单图像，最后训练视频。预测哪些 benchmark 会下降，以及原因。

4. 论文报告的视频 benchmark 每个样本只用 8 帧训练。这能泛化到推理时的 30 秒视频吗？最先出问题的是 Token 预算，还是时间推理？

5. 将 24x24 patch 做 bilinear pooling 到 12x12，在每个维度上是 4x reduction。用 stdlib Python 实现 pooling，并验证每个 2x2 block 的均值与 bilinear 输出匹配。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OneVision scenario | “单图像、多图像，或视频” | 统一 VLM 处理的三种输入 shape 之一；预算在三者之间保持恒定 |
| Token budget | “每个样本多少 Token” | LLM 在每个训练/推理样本中看到的视觉 Token 总数，通常为 3000-4000 |
| Curriculum | “训练顺序” | 为了 emergent transfer 而选择的阶段排序（单图像 → 多图像 → 视频） |
| Bilinear pooling | “Token 缩减” | 对 patch grid（2D）应用 bilinear interpolation，以在保留局部性的同时减少 Token 数量 |
| Emergent skill | “没训练过，但仍然能用” | 由于 curriculum composition，在没有匹配训练数据的情况下于推理时出现的能力 |
| AnyRes-k | “k-tile setup” | k 个固定分辨率子 tile 加一个 thumbnail，典型 k ∈ {4, 9} |
| Task transfer | “跨场景泛化” | 在单图像上学到的技能，通过共享 backbone 应用于视频（反之亦然） |

## 延伸阅读
- [Li et al. — LLaVA-OneVision (arXiv:2408.03326)](https://arxiv.org/abs/2408.03326)
- [LLaVA-OneVision-1.5: Fully Open Framework (arXiv:2509.23661)](https://arxiv.org/abs/2509.23661)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Lin et al. — VILA (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
