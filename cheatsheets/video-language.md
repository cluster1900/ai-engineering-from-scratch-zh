---
id: video-language
title: Video-Language Models and Long Video
code: VV
subtitle: 采样帧、规划 token 预算、编码时间、定位事件，并为长视频建索引，给出带时间戳的回答。
hue: 320
sources: phases/12-multimodal-ai/17-video-language-temporal-grounding, phases/12-multimodal-ai/18-long-video-million-token, phases/04-computer-vision/12-video-understanding, phases/19-capstone-projects/12-video-understanding-pipeline
source_hash: 196574547a8febbc
---

## 场景索引流水线（毕业项目）
type: architecture
from: phases/19-capstone-projects/12-video-understanding-pipeline/docs/en.md

```arch
node | video | 1,1 | Video file | YouTube URL or local MP4 | client
node | scene | 2,1 | Scene segmentation | TransNetV2 or PySceneDetect | process
node | cap | 3,1 | VLM caption | caption + frame embedding | model
node | index | 4,1 | Multi-vector Qdrant | three named vectors | store
node | asr | 3,2 | ASR pass | Whisper-v3-turbo, word timestamps | model
node | query | 1,3 | Question | natural language | client
node | rrf | 2,3 | RRF merge | top-k=5 scenes | process
node | ground | 3,3 | Temporal grounding | refine start, end in scene | process
node | synth | 4,3 | VLM synth | answer + timestamps | model
edge | video | scene |
edge | scene | cap | keyframe
edge | scene | asr | audio
edge | cap | index |
edge | asr | index |
edge | query | rrf |
edge | index | rrf | three queries
edge | rrf | ground | top scene
edge | ground | synth | window
```

## 视频 VLM 设计
type: comparison
span: 2
from: phases/12-multimodal-ai/17-video-language-temporal-grounding/docs/en.md, phases/12-multimodal-ai/17-video-language-temporal-grounding/code/main.py

| 因素 | Video-LLaMA | Video-LLaVA | Qwen2.5-VL |
|---|---|---|---|
| 帧 | 2 FPS 下的 16 帧片段 | 8 帧 | 动态 FPS |
| 压缩器 | 视频 Q-former，32 个 query | MLP | 逐 token 的时间对齐 M-RoPE |
| 时间位置 | 1D 时间 RoPE | 可学习的时间嵌入 | 绝对时间戳 (t, h, w) |
| 备注 | 音频分支，ImageBind | 图像与视频共享编码器 | 2025 年最好的开源模型 |
| 对“何时”的回答 | "early in the clip" | 8-16 帧的系统 | "at 4.2 seconds" |
| 弱点 | 片段长度固定 | 不支持长视频 | 未说明 |

## 长视频：四条路径
type: comparison
span: 2
from: phases/12-multimodal-ai/18-long-video-million-token/docs/en.md, phases/12-multimodal-ai/18-long-video-million-token/code/main.py

| 因素 | 硬塞上下文 | Ring attention | Token 压缩 | 智能体式检索 |
|---|---|---|---|---|
| 示例 | Gemini 1.5, Gemini 2.5 Pro | LWM, LongVILA | Video-XL, LongVA | VideoAgent |
| 机制 | 一次前向放入全部 token | 分块在设备间轮转 | 每个片段一个摘要 token | LLM 调用片段检索工具 |
| 成本 | 数百万 token | 与上下文成线性 | 上下文小 | 只处理相关片段 |
| 弱点 | 闭源 | 要分布到多台设备 | 会漏掉精确帧 | 依赖检索质量 |
| 适合 | >1h 的通用问答 | 15-60 分钟 | 15-60 分钟 | >1h 的具体查询 |

## VideoAgent 循环
type: flow
from: phases/12-multimodal-ai/18-long-video-million-token/docs/en.md, phases/12-multimodal-ai/18-long-video-million-token/code/main.py

1. **LLM**：读问题。
2. **LLM**：调用 `find_clips(keyword='<word>')` 找相关片段。
3. **工具**：返回匹配片段的时间戳。
4. **VLM**：编码 3 个 30s 片段（共约 7290 个 token）。
5. **LLM**：组织回答，或者继续追问。

## Token 计算
type: concepts
from: phases/12-multimodal-ai/17-video-language-temporal-grounding/docs/en.md, phases/12-multimodal-ai/18-long-video-million-token/docs/en.md, phases/12-multimodal-ai/18-long-video-million-token/code/main.py

- **预算**：`tokens(duration_s, fps, per_frame)` 等于时长乘以 FPS 再乘以每帧 token 数。
- **原始**：1 分钟、30 FPS、每帧 196 个 token，共 352k 个 token。
- **3x3 池化**：每帧 64 个 token。5 分钟、1 FPS 为 19,200 个 token。
- **384 原生分辨率**：每帧约 729 个 token。3x3 池化后为 81 个。
- **30 分钟**：1 FPS、每帧 81 个 token 为 145,800 个 token。2 FPS 为 291,600 个。
- **2 小时**：1 FPS、每帧 81 个 token 为 583k 个 token。
- **检索**：3 个片段用 `3 * 30 * 81 + 200` 个 token。便宜 99%。

## 视频模型家族（视觉）
type: concepts
from: phases/04-computer-vision/12-video-understanding/docs/en.md

- **2D + 池化**：每帧用 2D CNN，再在时间上取平均。无法建模运动。
- **3D 卷积**：卷积核覆盖 (T, H, W)。C3D、I3D、SlowFast。
- **I3D 膨胀**：沿时间轴复制 2D 卷积核。3x3 变成 3x3x3。
- **(2+1)D**：先 2D 空间卷积，再 1D 时间卷积。参数更少。
- **联合注意力**：在 (t, h, w) 上做一次注意力。复杂度是 `T*H*W` 的平方。
- **分离注意力**：每个块里一次时间注意力、一次空间注意力。
- **分解注意力**：时间注意力和空间注意力在块之间交替。

## 代码中的函数
type: task-table
span: 2
from: phases/12-multimodal-ai/17-video-language-temporal-grounding/code/main.py, phases/04-computer-vision/12-video-understanding/code/main.py, phases/19-capstone-projects/12-video-understanding-pipeline/code/main.py

| 任务 | 代码 |
|---|---|
| 均匀时间戳 | `uniform_sample(duration, n)` |
| 感知运动的时间戳 | `dynamic_sample(motion, fps_cap=4, total_budget=32)` |
| 给定位结果打分 | `evaluate_grounding(predictions, ground_truth, tol_iou=0.3)` |
| 区间重叠 | `iou(a_start, a_end, b_start, b_end)` |
| 均匀帧索引 | `sample_uniform(num_frames_total, T)` |
| 随机连续窗口 | `sample_dense(num_frames_total, T, rng=None)` |
| 把 2D 卷积提升为 3D | `inflate_2d_to_3d(conv2d, time_kernel=3)` |
| 用三个向量搜索 | `multi_vector_search(query, scenes, k=5)` |

## 采样、定位、膨胀
type: annotated-code
lang: python
span: 2
from: phases/12-multimodal-ai/17-video-language-temporal-grounding/code/main.py, phases/04-computer-vision/12-video-understanding/code/main.py

```python
uni = uniform_sample(duration, 8)                          # step * (i + 0.5)
dyn = dynamic_sample(motion, fps_cap=4, total_budget=12)   # 1 to fps_cap per second
result = evaluate_grounding(predictions, ground)           # hit when IoU >= tol_iou
result["recall"]                                           # hits over ground truth events
model = FramePool(num_classes=10, pretrained=False)        # ResNet-18 per frame, mean over T
c3d = inflate_2d_to_3d(c2d, time_kernel=3)                 # repeat on time, divide by time_kernel
c21 = Conv2Plus1D(3, 16)                                   # spatial, BN, ReLU, temporal
```

## 运行毕业项目
type: command-table
from: phases/19-capstone-projects/12-video-understanding-pipeline/code/main.py, phases/19-capstone-projects/12-video-understanding-pipeline/code/ts/README.md, phases/19-capstone-projects/12-video-understanding-pipeline/code/ts/src/server.ts, phases/19-capstone-projects/12-video-understanding-pipeline/code/ts/src/types.ts

| 命令 | 作用 |
|---|---|
| `python main.py` | 索引演示：RRF 搜索，定位窗口 |
| `npm run typecheck` | 对 UI 部分做类型检查 |
| `npm test` | 任务状态与存储测试 |
| `npm start` | 自动结束的演示 |
| `npm run serve` | 在 :8123 上启动 HTTP 服务 |
| `GET /jobs` | 以 JSON 返回任务摘要 |
| `GET /job/:id` | 阶段时间线，未知 id 返回 404 |
| 阶段 | chunk, embed, index, qa |

## 默认值
type: defaults
span: 1
from: phases/12-multimodal-ai/17-video-language-temporal-grounding/code/main.py, phases/12-multimodal-ai/17-video-language-temporal-grounding/docs/en.md, phases/04-computer-vision/12-video-understanding/code/main.py, phases/04-computer-vision/12-video-understanding/docs/en.md, phases/19-capstone-projects/12-video-understanding-pipeline/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `fps_cap` | 4 | 每秒最多采样数 |
| `total_budget` | 32 | 动态采样总数 |
| `tol_iou` | 0.3 | 算作定位命中的 IoU |
| `time_kernel` | 3 | 膨胀的时间深度 |
| RRF 常数 | 60 | 累加 `1.0 / (60 + rank + 1)` |
| 搜索中的 `k` | 5 | 融合后的 top 场景 |
| 片段长度 T | 8 | 也可以是 16、32 或 64 |

## 故障排查
type: troubleshooting
span: 2
from: phases/04-computer-vision/12-video-understanding/docs/en.md, phases/12-multimodal-ai/17-video-language-temporal-grounding/docs/en.md, phases/12-multimodal-ai/18-long-video-million-token/docs/en.md, phases/19-capstone-projects/12-video-understanding-pipeline/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| "open door" 等同于 "close door" | 时间池化与顺序无关 | 使用 3D 卷积或 transformer |
| 运动类别接近随机水平 | 只靠外观不够 | 训练 R(2+1)D，不要用 FramePool |
| 膨胀后的模型破坏了 batch norm | 激活值尺度变大 | 除以 `time_kernel` |
| 联合注意力的运行时间暴涨 | 复杂度是 `T*H*W` 的平方 | 使用分离注意力 |
| 均匀采样漏掉了动作 | 丢失运动峰值 | 使用带最大帧数上限的动态 FPS |
| 回答说 "early in the clip" | 没有绝对时间位置 | 使用时间对齐的 M-RoPE 和 JSON 输出 |
| 2h 视频上下文溢出 | 1 FPS 下 583k 个 token | 加大池化或使用 VideoAgent |
| 数错“有多少个 X” | 计数幻觉 | 单独报告计数准确率 |

## 问答
type: qa
from: phases/12-multimodal-ai/17-video-language-temporal-grounding/docs/en.md, phases/12-multimodal-ai/18-long-video-million-token/docs/en.md, phases/04-computer-vision/12-video-understanding/docs/en.md, phases/19-capstone-projects/12-video-understanding-pipeline/docs/en.md

- **时间对齐的 M-RoPE 增加了什么？** 每个 token 的绝对时间。它能处理动态 FPS 带来的不均匀间隔。
- **用什么输出格式？** 带时间和事件字段的结构化 JSON。
- **用哪种池化？** 大多数任务用 3x3 双线性。智能体工作流用 6x6。
- **15 分钟的片段走哪条路径？** 使用原生上下文的开源 72B 模型。
- **2 小时以上走哪条路径？** VideoAgent 或分层摘要。
- **片段级 78%，视频级 82%？** 模型依赖测试时的平均。
- **为什么每个场景三个向量？** 只用一个池化向量会让检索效果退化。

## 基准
type: concepts
from: phases/12-multimodal-ai/17-video-language-temporal-grounding/docs/en.md, phases/12-multimodal-ai/18-long-video-million-token/docs/en.md

- **VideoMME**：短、中、长视频。2500+ 个样本。
- **TempCompass**：“before” / “after” 的顺序问题。
- **EgoSchema**：长时程的第一人称视频。
- **Needle-in-a-haystack**：在随机位置藏一个标记。按 Recall@k 打分。
