# Video-Language Models：Temporal Tokens 与 Grounding

> Video 不是一叠照片。一个 5 秒 clip 有因果顺序、动作动词和事件时序，这些是 image model 无法表示的。Video-LLaMA（Zhang et al., June 2023）发布了第一个具备 audio-visual grounding 的开放 video-LLM。VideoChat 和 Video-LLaVA 扩展了这一模式。到 2025 年，Qwen2.5-VL 的 TMRoPE 缩小了与 frontier proprietary models 的差距。每个系统都以不同方式解决 temporal tokens：Q-former per clip、concat-pool per frame、TMRoPE per token。本课会解读这些模式，构建 uniform-vs-dynamic frame sampler，并在 temporal grounding tasks 上评估。

**Type:** Build
**Languages:** Python (stdlib, frame sampler + temporal-grounding evaluator)
**Prerequisites:** Phase 12 · 08 (LLaVA-OneVision)
**Time:** ~180 minutes

## 学习目标
- 解释为什么 temporal positional encoding 会独立于 vision encoder 改变 video VLM performance。
- 比较 uniform、dynamic-FPS 和 event-driven frame sampling 在 tokens-per-second 与 grounding accuracy 之间的取舍。
- 描述 Q-former-per-clip（Video-LLaMA）、pooled-per-frame（Video-LLaVA）和 M-RoPE-per-token（Qwen2.5-VL）设计。
- 说出四个 video benchmarks：VideoMME、TempCompass、EgoSchema、Video-MMMU。

## 问题
一段 1 分钟、30 FPS 的 video 有 1800 frames。按每 frame 196 个 visual tokens（ViT-B at 224）计算，就是 352k tokens，超过任何 2024-era LLM context。

存在三种压缩策略：

1. Subsample frames（根据内容使用 1-8 FPS）。
2. 对每个 frame 的 patch tokens 进行强力 pooling（3x3 或 4x4 bilinear pool）。
3. 通过 Q-former 压缩：输入一个 16-frame clip，输出 64 tokens。

每种取舍不同。Subsampling 会丢失 temporal detail。Pooling 会丢失 spatial detail。Q-former 两者都会稍微丢一些，但节省 tokens。

Temporal position encoding 是另一个维度：模型如何知道 frame 5 发生在 frame 6 之前？选项包括简单的 1D temporal RoPE（Video-LLaMA）、learned temporal embeddings（Video-LLaVA）和 TMRoPE（Qwen2.5-VL，完整 3D）。

## 概念
### Video-LLaMA：每个 clip 一个 Q-former + audio branch

Video-LLaMA（2023）是第一个开放 video-LLM。Architecture：

- 16-frame clips at 2 FPS（即 8 秒）。
- Per-frame ViT features -> Video Q-former，对全部 16 frames 做 cross-attends -> 32 learned queries -> LLM。
- 并行 audio branch：waveform -> ImageBind audio encoder -> Audio Q-former -> 32 queries -> LLM。

优势：audio-visual joint reasoning。弱点：固定 clip length，无法处理 arbitrary time grounding。

### VideoChat and Video-LLaVA

VideoChat 保留了 Video-LLaMA 的思路，但去掉 audio 并简化。Video-LLaVA（Lin et al., 2023）在 images 和 video frames 上训练单个 visual encoder（"alignment before projection"），得到统一表示。二者都是 frozen-CLIP-encoder + MLP + LLM。

二者都无法处理 long video。二者都是 8-16 frame systems。

### Qwen2.5-VL and TMRoPE

Qwen2.5-VL 引入了 TMRoPE，即 Temporal-Modality Rotary Position Embedding。每个 patch token 携带一个 (t, h, w) 位置，其中 t 是实际 timestamp（不是 frame index）。

与简单 temporal embedding 的关键区别：

- 绝对时间，而不是 index。模型看到的是“at 4.2 seconds”，不是“at frame 15”。
- Per-token rotation，而不是 per-clip。每个 visual token 都按自己的 timestamp 独立旋转。
- 兼容 dynamic FPS。如果这里以 2 FPS 采样、那里以 4 FPS 采样，TMRoPE 可以原生处理这种不均匀间隔。

TMRoPE 支持“猫在第几秒跳起来？”这类查询。模型可以输出“at 4.2 seconds”。Video-LLaMA 只能说“early in the clip”。

### Frame sampling strategies

Uniform：在整个 duration 内均匀采样 N frames。简单，但会丢失 motion peaks。

Dynamic FPS：根据 motion intensity 自适应采样。Optical flow 或 frame differencing 会在 high-motion segments 选择更密集的采样。Qwen2.5-VL 会这样训练。

Event-driven：运行一个轻量 detector，在 action 发生处采样更多。VideoAgent 使用这种方式。

Keyframe + context：在 shot boundaries + 若干 adjacent frames 采样。用于 cinematic content。

### Pooling per frame

在 1 FPS 且每 frame 576 tokens 时，一个 5 分钟 clip 是 172,800 tokens。Qwen2.5-VL-72B 的 128k context 可以勉强处理，但成本高。

3x3 bilinear pool 将每 frame 降到 64 tokens -> 5 分钟为 19,200 tokens。对大多数任务来说是 sweet spot。

对 agent workflows 可以更激进地 pooling（6x6 -> 每 frame 16 tokens），因为 spatial detail 没那么重要。

### The four video benchmarks

- VideoMME：综合 video understanding，包含 short + medium + long。
- TempCompass：细粒度 temporal reasoning，包含 "before" / "after" questions。
- EgoSchema：长时程第一人称视频。
- Video-MMMU：Multimodal 多学科视频问题。

完整 video-VLM evaluation 会覆盖全部四个。它们强调不同维度：TempCompass 关注 ordering，EgoSchema 关注 3+ minute reasoning，VideoMME 覆盖多种 durations。

### Grounding output formats

Temporal grounding 的输出格式：

- Free text："The cat jumps around the 4-second mark." 易于解析但不精确。
- Structured JSON：`{"event": "jump", "start": 4.1, "end": 4.3}`。Qwen2.5-VL 会训练这种形式。
- Token-based：特殊 `<time>4.1</time>` tokens 与答案交错。Qwen2.5-VL 的内部格式。

Token-based 对 downstream use 最准确。Qwen2.5-VL 的 JSON output format 可以直接解析。

### 2026 best practice

2026 年 video VLMs 的 best practice：

- Encoder：带 M-RoPE 或 TMRoPE 的 SigLIP 2（Qwen2.5-VL）。
- Frame sampling：dynamic FPS（根据 motion 使用 1-4），带 max-frame cap。
- Per-frame pooling：3x3 bilinear。
- Output：包含 time + event 字段的结构化 JSON。
- Benchmarks：VideoMME + TempCompass 用于 general；EgoSchema 用于 long-horizon。

```figure
video-temporal-patches
```

## 使用它
`code/main.py` 包含：

- Uniform 和 dynamic-FPS frame sampler。
- 一个 toy temporal-grounding evaluator：给定 time T 处的 "ground truth" event 和 model output，在 tolerance 内评分 accuracy。
- Video-LLaMA（16 frames，Q-former）、Video-LLaVA（8 frames，MLP）、Qwen2.5-VL（dynamic FPS + TMRoPE）之间的比较。

## 交付它
本课会产出 `outputs/skill-video-vlm-frame-planner.md`。给定一个 video task（monitoring、action recognition、temporal grounding、summarization），它会选择 frame sampler、pooling factor、output format 和 expected accuracy tier。

## 练习
1. 对一个 3 分钟 cooking demo，选择 uniform 还是 dynamic FPS。用 token count 说明理由。

2. TMRoPE 具体增加了什么，是简单 temporal embedding table 做不到的？

3. 写一个 VLM 可学习输出的 temporal grounding JSON schema。包含 error cases。

4. 阅读 Video-LLaVA Section 3 中的 "Alignment Before Projection"。为什么这比训练独立的 image 和 video encoders 更好？

5. 给定 VideoMME leaderboard，截至 2026 年，top open model 与 top proprietary model 之间的差距是多少？其中有多少差距可归因于 temporal encoding，多少可归因于 base LLM scale？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Temporal grounding | "Time-localized answers" | VLM 会为事件发生时间输出具体 timestamp range |
| TMRoPE | "Time-Multimodal RoPE" | 带绝对 timestamps 的 3D rotary position，由 Qwen2.5-VL 使用 |
| Dynamic FPS | "Motion-aware sampling" | 在 high-motion segments 采样更多 frames，在 static segments 采样更少 |
| Frame pooling | "Spatial compress per frame" | 在进入 LLM 前用 bilinear interpolation 减少每个 frame 的 patches |
| Video Q-former | "Clip compressor" | 将 N frames 映射到 K learned queries 的 cross-attention bottleneck |
| VideoMME | "Video bench" | 综合 short/medium/long video benchmark，2500+ samples |

## 延伸阅读
- [Zhang et al. — Video-LLaMA (arXiv:2306.02858)](https://arxiv.org/abs/2306.02858)
- [Li et al. — VideoChat (arXiv:2305.06355)](https://arxiv.org/abs/2305.06355)
- [Lin et al. — Video-LLaVA (arXiv:2311.10122)](https://arxiv.org/abs/2311.10122)
- [Qwen Team — Qwen2.5-VL (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Lin et al. — VILA-1.5 (arXiv:2312.07533)](https://arxiv.org/abs/2312.07533)
