# Qwen-VL Family 与 Dynamic-FPS Video

> Qwen-VL family — Qwen-VL (2023)、Qwen2-VL (2024)、Qwen2.5-VL (2025)、Qwen3-VL (2025) — 是 2026 年最有影响力的开放 vision-language model 谱系。每一代都做出了一个决定性的架构押注，并在十二个月内被开放生态的其他项目复制：通过 M-RoPE 实现原生动态分辨率、带绝对时间对齐的 dynamic-FPS sampling、ViT 中的 window attention，以及结构化 agent 输出格式。到 Qwen3-VL 时，这套配方已经稳定下来：一个支持原生宽高比输入的 2D-RoPE-ViT encoder，一个将其接入大型 Qwen3 language base 的 MLP projector，以及把 OCR、grounding 和 agent 行为作为一等目标的训练阶段。本课按时间顺序阅读这个 family，让你理解每个旋钮为什么在那里。

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## 学习目标
- 计算 M-RoPE 的三轴旋转（temporal、height、width），并解释为什么三者都需要。
- 为视频选择 dynamic-FPS sampling 策略，并推理 tokens-per-second 与 event-detection accuracy 之间的取舍。
- 按顺序说出 Qwen-VL 四代升级，以及每一代启用了什么。
- 连接一个 Qwen2.5-VL-style JSON agent 输出格式，并从 VLM 响应中解析结构化 tool call。

## 问题
Qwen-VL 于 2023 年 8 月发布，是对 LLaVA-1.5 和 BLIP-2 的直接回应。Qwen 团队瞄准的差距有三类：分辨率、视频和结构化输出。

分辨率：LLaVA-1.5 运行在 336x336。对照片还可以，但对中文发票或密集的电子表格截图没有用。Qwen-VL 的第一个创新是 448x448 和 grounded bounding-box 输出，让模型能够指向对象。

视频：Video-LLaMA 堆叠逐帧 encoder 并把它们喂给 LLM。它对短片有效，但不适用于多分钟视频，因为这类视频的时间轴才是信号。Qwen 团队想要一个理解时间的单一 encoder。

结构化输出：LLaVA 输出自由格式文本。Agent 需要 JSON。Qwen-VL 使用显式 JSON 输出格式训练，包括把 bounding-box 坐标作为文本。

每一代 Qwen-VL 都扩展这三条轴线之一。

## 概念
### Qwen-VL (August 2023)

第一代：OpenCLIP ViT-bigG/14 作为 encoder（2.5B params）、LLama-compatible Q-Former（1-step with 256 queries）、Qwen-7B base。贡献：

- 448x448 分辨率（当时开放 VLM 的 SOTA）。
- Grounding：使用带显式坐标 Token 输出的 image-text pairs 训练。"The cat is at <box>(112, 204), (280, 344)</box>"。
- 从一开始就进行中文 + 英文多语言训练。

当时的基准：英文上可与 GPT-4V 竞争，中文上占优。Grounding 监督才是真正的亮点。

### Qwen2-VL (September 2024) — M-RoPE 与原生分辨率

Qwen2-VL 用原生动态分辨率 ViT encoder 替换了固定分辨率 + Q-Former stack。关键变化：

- 原生动态分辨率。ViT 接受任何 HxW 可被 28 整除的输入（patch 14 with 2x spatial merge）。1120x672 的图像（40x24 merged patches）会产生 960 个视觉 Token。无需 resize、无需 tiling、无需 thumbnail。
- M-RoPE (Multimodal RoPE)。每个 Token 携带 3D 位置 (t, h, w)，而不是 1D。对于图像 t=0；对于视频 t = frame_index。RoPE 按每个轴的频率旋转 query/key Vector。没有 positional embedding table。
- MLP projector。去掉 Q-Former；在 merged patch tokens 上使用 2-layer MLP。
- 带 dynamic FPS 的视频。默认以 1-2 FPS 采样视频，但模型接受任意帧数。

结果：Qwen2-VL-7B 在多个 Multimodal 基准上追平 GPT-4o，并在 DocVQA 上超过它（94.5 vs 88.4）。架构变化是决定性一步。

### Qwen2.5-VL（2025 年 2 月）— dynamic FPS + absolute time

Qwen2.5-VL 的重大转变是视频。Dynamic FPS 不只是“需要时采样更多帧”。论文形式化了：

- 绝对时间 Token。不使用位置索引（frame 0, 1, 2...），而使用实际时间戳。"At 0:04, the cat jumps." 模型会看到与 frame tokens 交错的 `<time>0.04</time>` tokens。
- Dynamic FPS。慢速素材以 1 FPS 采样，动作场景以 4+ FPS 采样。由用户或训练器选择；M-RoPE 会适配。
- ViT 中的 Window Attention。Spatial attention 采用 windowed（block 内局部）以提升吞吐；每隔几层加入 global attention。
- 显式 JSON 输出格式。使用 tool-call 数据训练："{\"tool\": \"click\", \"coords\": [380, 220]}"。开箱即 agent-ready。
- MRoPE-v2 scaling。位置会随最大输入大小缩放，因此 10 分钟视频不会耗尽频率范围。

基准：Qwen2.5-VL-72B 在多数视频基准上超过 GPT-4o，在文档上追平 Gemini 2.0，并为 GUI grounding 设定开放模型 SOTA（ScreenSpot：84% accuracy vs GPT-4o 的 38%）。

### Qwen3-VL (November 2025)

Qwen3-VL 是一次增量升级，重点是整合而不是重新发明：更大的 LLM backbone（Qwen3-72B）、扩展的训练数据、改进的 OCR，以及通过 Qwen3 “thinking mode” 获得的更强 reasoning。ViT 和 M-RoPE 保持不变。论文关注的是数据和训练改进，而不是架构。

这个谱系的结论：到 2025 年，Qwen-VL 架构已经稳定。后续代际扩展的是 compute 和数据，而不是 primitives。

### M-RoPE mathematically

经典 RoPE 使用成对坐标，按位置 `m` 旋转维度为 `d` 的 query `q`：

```
q_rot[2i]   = q[2i]   * cos(m * theta_i) - q[2i+1] * sin(m * theta_i)
q_rot[2i+1] = q[2i]   * sin(m * theta_i) + q[2i+1] * cos(m * theta_i)
theta_i     = 10000^(-2i/d)
```

M-RoPE 将 hidden dim 切分为三条 band。假设 `d = 96`。分配 32 dims 给 temporal、32 给 height、32 给 width。每条 band 按自己的轴位置旋转。位于 (t=5, h=10, w=20) 的 patch 会在其三条 band 上分别应用旋转 `R_t(5)`、`R_h(10)`、`R_w(20)`。

Text tokens 使用 `t = text_index, h = 0, w = 0`（或一种归一化选择），以保持兼容。视频帧使用 `t = frame_time, h = row, w = col`。单图像使用 `t = 0`。

好处：一个位置编码即可处理文本、图像和视频，无需分支代码或不同的位置表。

### Dynamic-FPS 采样逻辑

给定一个时长为 `T` 秒的视频和目标 Token 预算 `B`：

1. 计算你能承担的最大 FPS：`fps_max = B / (T * tokens_per_frame)`。
2. 从 `{1, 2, 4, 8}` 中选择满足 `fps <= fps_max` 的目标 FPS。
3. 如果运动强（optical-flow heuristic 或明确用户请求），选择更高 FPS。如果运动弱，选择更低 FPS。
4. 按选定 FPS 均匀采样；在帧之间插入 `<time>t</time>` tokens。

Qwen2.5-VL 会隐式训练这种逻辑；推理时用户通过 `fps` 参数控制。一个 60 秒动作序列，以 4 FPS、每帧 81 tokens 计算，等于 19440 tokens，在 32k context 中可管理。

### Structured agent output

Qwen2.5-VL 的 agent 训练显式面向结构化 tool call：

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

解析是确定性的：对模型输出执行 JSON.parse。相比之下，自由格式的 "click at (1024, 512)" 需要 regex 和歧义处理。这个转变解释了为什么 Qwen2.5-VL 的 ScreenSpot 分数从 Qwen2-VL 的 55% 跃升到 84%。

## 使用它
`code/main.py` 实现了：

- 对混合文本、image patches 和 video frames 的 packed sequence 进行 M-RoPE 位置计算。
- Dynamic-FPS sampler：给定 (duration, budget, motion_level)，选择 FPS 并输出 frame timestamps。
- 一个玩具版 Qwen2.5-VL JSON-output parser，用于处理带坐标字段的 tool-call responses。

运行它，然后在一个 5 分钟视频上把 fixed-FPS 换成 dynamic-FPS，感受差异。

## 交付它
本课产出 `outputs/skill-qwen-vl-pipeline-designer.md`。给定一个视频任务（monitoring、agent、action recognition、accessibility），它会输出 Qwen2.5-VL 配置（frame budget、FPS strategy、window-attention flag、agent-output mode）和延迟估算。每当你为视频产品部署 Qwen-VL-family model 时都可以使用它。

## 练习
1. 计算 hidden 48（每条 band 16，base theta 10000）时，位于 (t=3, h=5, w=7) 的 patch 的 M-RoPE 旋转。展示每条 band 中前三对的旋转角度。

2. 一段 10 分钟的安全摄像头录像，以 1 FPS 会产生多少帧？在 384 resolution 且 3x pool 下，总 Token 数是多少？Qwen2.5-VL 默认 32k context 能处理它吗？

3. 为 30 秒网球回合、30 秒食谱演示、30 秒 UI-agent 录屏分别选择 FPS。用 dynamic-FPS logic 说明理由。

4. Qwen2.5-VL 完全去掉了 Q-Former。为什么简单 MLP 在 2025 年可行，但在 2023 年不可行？（提示：data scale 和 encoder quality。）

5. 将三个 Qwen2.5-VL JSON tool-call 输出解析为 Python dict。Malformed JSON 会发生什么失败？Qwen cookbook 推荐什么恢复策略？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | hidden dim 中带 temporal、height 和 width bands 的 3D rotary position embedding |
| Dynamic FPS | "Smart sampling" | 根据运动、时长和 Token 预算为每个视频选择的帧采样率 |
| Absolute time token | "Timestamp token" | 在序列中交错插入的 `<time>t</time>`，让模型看到实际秒数而不是帧索引 |
| Window attention | "Local attention" | 为提速而限制在小窗口内的 spatial self-attention；周期性加入 global attention |
| Structured agent output | "JSON mode" | 通过训练数据监督教 VLM 输出可解析 JSON，其中包含 coords 和 tool names |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的每请求控制项，用来约束总像素数，从而约束 Token 数 |
| Grounding | "Point-at-it" | 将 bounding-box 坐标作为文本 Token 输出；自 Qwen-VL v1 起使用 |

## 延伸阅读
- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
