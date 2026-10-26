---
id: vlm-model-families
title: Open VLM Families: LLaVA, Qwen-VL, InternVL
code: OV
subtitle: LLaVA、LLaVA-OneVision、Qwen-VL 与 InternVL3 并排对比：连接器、分辨率、视频、token 与训练。
hue: 265
sources: phases/12-multimodal-ai/05-llava-visual-instruction-tuning, phases/12-multimodal-ai/06-any-resolution-patch-n-pack, phases/12-multimodal-ai/08-llava-onevision-single-multi-video, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps, phases/12-multimodal-ai/10-internvl3-native-multimodal
source_hash: 854d13f0d4ee45ed
---

## 各家族并排对比
type: comparison
span: 2
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md, phases/12-multimodal-ai/10-internvl3-native-multimodal/docs/en.md, phases/12-multimodal-ai/10-internvl3-native-multimodal/code/main.py

| 因素 | LLaVA-NeXT | LLaVA-OneVision | Qwen-VL 家族 | InternVL3 |
|---|---|---|---|---|
| 视觉到 LLM | 2 层 MLP，GELU | 同样的 MLP 投影器 | Qwen2-VL：在合并后的 patch 上用 2 层 MLP | 原生，无对齐阶段 |
| 配方 | 在文本 LLM 上事后对齐 | 在文本 LLM 上事后对齐 | 在文本 LLM 上事后对齐 | 原生多模态预训练 |
| 高分辨率 | AnyRes：336 的 tile 加缩略图 | AnyRes-9 或 AnyRes-4，384 的 tile | Qwen2-VL：任意能被 28 整除的 H 和 W | ViR 选择低、中或高 |
| 视频 | 逐帧拼接 | 32 帧，每帧 196 个 token | 动态 FPS，绝对时间 M-RoPE | 预训练中 5% 为视频-文本 |
| 视觉 token | 基础 576，AnyRes 2880 | 每个样本 6000-9000，保持均衡 | 随输入缩放 | 通过 ViR 为 256、576 或 2048+ |
| 训练 | 先对齐，再指令微调 | SI、OV、TT 三个阶段 | Qwen3-VL：各阶段侧重 OCR、定位、智能体 | 一个预训练阶段，再指令微调 |
| 更换 LLM | 重训投影器 | 重训投影器 | 重训适配器 | 之后无法更换 |

## LLaVA 前向传播
type: architecture
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md

```arch
node | img | 1,1 | Image | 336x336 | client
node | vit | 2,1 | CLIP ViT-L/14 @ 336 | 576 patches, dim 1024 | model
node | mlp | 3,1 | 2-layer MLP | 1024 → 4096 → 4096, GELU | process
node | prompt | 1,2 | Prompt | system + <image> + user | client
node | splice | 2,2 | Replace <image> | 576 projected tokens | process
node | llm | 3,2 | LLM | Vicuna-13B, later Llama-3.1-8B | model
edge | img | vit |
edge | vit | mlp | patches
edge | mlp | splice | 576 tokens
edge | prompt | splice |
edge | splice | llm | full sequence
```

## Qwen-VL 演进
type: flow
from: phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/code/main.py

1. **Qwen-VL (2023)**：448 分辨率，定位框以文本表示，Q-Former 用 256 个 query。
2. **Qwen2-VL (2024)**：M-RoPE，原生动态分辨率，MLP 投影器。
3. **Qwen2.5-VL (2025)**：动态 FPS，绝对时间 M-RoPE，ViT 中使用窗口注意力。
4. **Qwen2.5-VL 智能体**：JSON 工具调用。ScreenSpot 从 55% 提高到 84%。
5. **Qwen3-VL (2025)**：Qwen3 基座，思考模式，更多 OCR 数据。ViT 和 M-RoPE 保持不变。

## 各家族的适用场景
type: tips
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/code/main.py, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md, phases/12-multimodal-ai/10-internvl3-native-multimodal/docs/en.md

- **LLaVA**：需要便宜、可复现的配方。第 2 阶段在 8xA100 上约需 20 小时。
- **LLaVA-OneVision**：一个模型以可预测的成本服务单图、多图和视频。
- **Qwen2.5-VL**：带时间戳的视频，输出 JSON 的 GUI 智能体，`min_pixels` 和 `max_pixels` 上限。
- **InternVL3**：文本能力不能退化，且付得起原生预训练的成本。
- **事后对齐配方**：之后想换上新的 LLM。对大多数项目来说它仍然更便宜。
- **AnyRes 分块**：编码器固定在 336x336，但你需要细节。

## 各课的玩具代码
type: task-table
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/code/main.py, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/code/main.py, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/code/main.py, phases/12-multimodal-ai/10-internvl3-native-multimodal/code/main.py

| 任务 | 代码 |
|---|---|
| 投影 ViT patch | `MLPProjector(PATCH_DIM, HIDDEN_DIM, LLM_DIM)` |
| 构造 LLaVA 提示 | `build_llava_prompt(system, user, 576)` |
| 打包混合 batch | `pack_batch(images, patch)` |
| 稠密的块对角掩码 | `build_dense_mask(pack)` |
| AnyRes 的 token 开销 | `anyres_cost(img, tile=336, thumb=336)` |
| 正方形缩放的开销 | `square_cost(img, side=336, patch=14)` |
| OneVision 视频规划 | `plan_video(budget)` |
| ViR 平均 token 数 | `vir_sim(tiers)` |

## M-RoPE、动态 FPS、工具调用
type: annotated-code
lang: python
from: phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/code/main.py

```python
cfg = MRoPEConfig(hidden=48, temporal_dim=16, height_dim=16, width_dim=16)
mrope_angles(cfg, 0, 5, 7)      # image patch: t=0, h=row, w=col
mrope_angles(cfg, 3, 5, 7)      # video frame t=3
mrope_rotate(cfg, vec, 3, 5, 7) # rotates each band by its axis
plan = VideoPlan(duration_s=600.0, tokens_per_frame=81,
                 budget=32768, motion="low")
plan.fps()                      # first candidate <= fps_max
plan.frame_times()              # one timestamp per frame
plan.total_tokens()             # frames times tokens_per_frame
parse_tool_call(raw)            # json.loads, then slice { to }
```

## Token 计算
type: concepts
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md

- **LLaVA 基础**：每张图 576 个 token。2048 上下文下，留给文本 1472 个 token。
- **AnyRes 2x2**：4 * 576 + 576 = 2880 个视觉 token。
- **AnyRes 4x4**：1344x1344 的图像得到 9216 + 576，约 9800 个 token。
- **Qwen2-VL 原生**：1120x672 得到 40x24 个合并 patch，960 个 token。
- **OneVision 图像**：AnyRes-9 配 2x2 池化，9 * 182 + 182 = 1820 个 token。
- **OneVision 视频**：32 帧配 2x2 池化，32 * 196 = 6272 个 token。
- **动态 FPS 上限**：$fps_{max} = B / (T \cdot \text{tokens per frame})$
- **Qwen2.5-VL 视频**：60 s、4 FPS、每帧 81 个 token，共 19440 个 token。

## 训练配方
type: comparison
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/docs/en.md, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/code/main.py, phases/12-multimodal-ai/10-internvl3-native-multimodal/docs/en.md

| 步骤 | LLaVA | OneVision | InternVL3 |
|---|---|---|---|
| 第一步 | 只训练 MLP，558k 条 caption | SI：单图，AnyRes | 原生预训练 |
| 第二步 | MLP + LLM，158k 轮 GPT-4 对话 | OV：0.5 / 0.3 / 0.2 的混合 | 指令微调 |
| 第三步 | 无 | TT：目标任务混合 | 无 |
| 冻结 | 第 1 阶段冻结 ViT 和 LLM | 不重置权重 | 没有冻结阶段 |
| 数据 | LAION-CC-SBU, LLaVA-Instruct | LLaVA-NeXT 数据加自有数据 | 40/35/20/5 的文本、交错、caption、视频 |

## 课程中的默认值
type: defaults
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/code/main.py, phases/12-multimodal-ai/06-any-resolution-patch-n-pack/code/main.py, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/code/main.py, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/code/main.py, phases/12-multimodal-ai/10-internvl3-native-multimodal/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `anyres_cost` 的 tile、thumb | 336 | patch 14 时每个 tile 576 个 token |
| `square_cost` 的 side | 336 | 每张图固定 576 个 token |
| LLaVA 提示的 image_tokens | 576 | 替换图像占位符 |
| `MRoPEConfig` 的 base | 10000.0 | 每个频带的 RoPE 频率基数 |
| Qwen2-VL 视频采样 | 1-2 FPS | 接受任意帧数 |
| OneVision 玩具规划器预算 | 4096 | 课程代码中每个样本的视觉 token 数 |
| 动态 FPS 演示预算 | 32768 | 3x 池化后每帧 81 个 token |
| `dvd_throughput` 的 llm_tokens | 128 | 每个请求的输出 token 数 |

## 故障排查
type: troubleshooting
from: phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md, phases/12-multimodal-ai/10-internvl3-native-multimodal/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 文字被压扁，图表标签丢失 | 正方形缩放到 336 | 保持原生宽高比，并设 max-pixels 上限 |
| 大图占满上下文 | AnyRes 4x4 约 9800 个 token | 原生打包或 M-RoPE，没有 tile 开销 |
| patch 跨图像相互注意 | 没有块对角掩码 | 由累计偏移量构造掩码，或走 `cu_seqlens` 路径 |
| 训练后图像能力弱 | 先训视频或先训多图的顺序 | 先 SI，再 OV，再 TT |
| GSM8K 下降 5-10 分 | 事后对齐欠下的债 | 原生预训练，文本占比不低于 40% |
| 长视频超出频率范围 | 位置尺度固定 | 按最大输入尺寸做 MRoPE-v2 缩放 |

## 缩写
type: glossary
from: phases/12-multimodal-ai/06-any-resolution-patch-n-pack/docs/en.md, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md, phases/12-multimodal-ai/10-internvl3-native-multimodal/docs/en.md

- **M-RoPE**：多模态 RoPE。在隐藏维度中划分时间、高度、宽度频带。
- **V2PE**：可变视觉位置编码。按模态学习频带划分。
- **NaFlex**：SigLIP 2 的原生灵活模式。一个 checkpoint 支持 256、729 或 1024 个 token。
- **ViR**：Visual Resolution Router。在编码前选出最低可用分辨率。
- **DvD**：视觉-语言解耦部署。编码器和 LLM 放在不同 GPU 上。
- **SI, OV, TT**：OneVision 的阶段。单图、OneVision 混合、任务迁移。

## 问答
type: qa
from: phases/12-multimodal-ai/05-llava-visual-instruction-tuning/docs/en.md, phases/12-multimodal-ai/08-llava-onevision-single-multi-video/docs/en.md, phases/12-multimodal-ai/09-qwen-vl-family-dynamic-fps/docs/en.md, phases/12-multimodal-ai/10-internvl3-native-multimodal/docs/en.md

- **为什么 MLP 胜过 Q-Former？** 只用 LM 损失，且容易更换 LLM。上下文增长到 32k-128k+，576 个 token 变得便宜。
- **OneVision 和 Qwen2.5-VL 的预算有何不同？** OneVision 固定预算、调整池化。Qwen2.5-VL 的预算随输入缩放。
- **为什么 M-RoPE 不需要位置表？** 每个 token 按其 (t, h, w) 位置旋转。图像使用 t = 0。
- **为什么不总是原生预训练？** 算力与文本 LLM 相当。交错数据稀少。之后也无法更换 LLM。
- **DvD 带来什么？** 对 8B LLM 配 400M 编码器，每节点吞吐约 2x。
