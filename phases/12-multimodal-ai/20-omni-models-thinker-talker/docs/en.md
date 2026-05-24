# Omni Models：Qwen2.5-Omni 与 Thinker-Talker 拆分

> GPT-4o 在 2024 年 5 月的产品演示之所以具有冲击力，不是因为底层模型，而是因为产品形态：一个语音界面，你说话，模型看到摄像头看到的内容，并在 250ms 内用语音回应。开放生态在 2024 年余下时间和 2025 年持续竞速，试图达到这个产品表面。Qwen2.5-Omni（2025 年 3 月）是参考级开放设计：一个 Thinker（大型文本生成 Transformer）加一个 Talker（并行语音生成 Transformer），通过 streaming 语音 Token 连接。Mini-Omni 简化了它，Moshi 匹配了它的延迟，GLM-4-Voice 将它扩展到中文。本课阅读 Thinker-Talker 架构，以及让 streaming 实时对话可行的延迟预算。

**Type:** Build
**Languages:** Python（stdlib，streaming pipeline 延迟模拟器 + VAD 循环）
**Prerequisites:** Phase 12 · 19（audio-LLMs），Phase 12 · 16（any-to-any）
**Time:** ~180 分钟

## 学习目标
- 将推理 pipeline 拆分为 Thinker（文本推理）和 Talker（语音合成），并解释为什么并行 streaming 能工作。
- 逐组件计算一次对话交互的 time-to-first-audio-byte（TTFAB）预算。
- 描述 TMRoPE 在 Thinker 内部跨视觉、音频和文本的时间对齐位置编码。
- 说出三种实时对话模式：half-duplex、turn-taking、full-duplex。

## 问题
一个实时语音助手必须快速完成很多事：

1. 听见用户。实时语音 Tokenization，voice activity detection（VAD）用于判断用户何时说完。
2. 可选地看见。以 2-4 FPS 输入摄像头画面，与音频一起 streaming 到 Thinker。
3. 思考。基于对话历史组织回应。
4. 说话。合成音频 Token，解码为 waveform，并 streaming 到用户扬声器。

每一步都会增加延迟。对话体感要求总往返时间 < 500ms；低于这个值，用户就不再明显感到滞后。GPT-4o 声称约 250ms。Moshi 约 160ms。Qwen2.5-Omni 约 350-500ms。

每个组件都需要 streaming。不能“把所有东西 batch 起来再 decode”。

## 概念
### Thinker and Talker

Qwen2.5-Omni 的分解：

- Thinker：一个 7B-80B 文本生成 Transformer。消费交错的文本 + 图像 + 音频 Token。输出表示要说什么的文本 Token。
- Talker：一个较小的语音生成 Transformer（200M-1B）。消费 Thinker 的文本输出 Token 加上最近的语音上下文 Token。输出离散语音 Token（residual-VQ 索引）。
- Speech decoder：一个 streaming waveform decoder（SNAC、MoVQGAN family），将语音 Token 实时转换为音频 samples。

这种分离很重要。Thinker 必须足够大，才能有好的推理能力。Talker 可以很小，因为它的任务是局部的：把文本转换为语音 Token。更大的 Talker 并不更有表达力；它只是更慢。

两者并行运行：

1. Thinker 发出文本 Token t_i。
2. Talker 消费 t_i（通过 streaming），并发出语音 Token s_i、s_{i+1}、...、s_{i+k}。
3. Speech decoder 在语音 Token 到达时消费它们，并发出音频 samples。
4. 当 Thinker 到达文本 Token t_{i+3} 时，Talker 已经为 t_0..t_{i+2} streaming 了音频。

### TMRoPE — 时间对齐的 Multimodal 位置

Thinker 需要整合图像帧（比如以 4 FPS 到达）、音频帧（以 50 帧/秒到达）以及来自对话历史的文本。朴素的序列顺序（所有图像，然后所有音频，然后文本）会丢失时间对齐。

TMRoPE 为每个 Token 分配绝对时间戳。t=2.3s 的视觉 Token。t=2.32s 的音频 Token。来自用户的文本 Token “stop” 位于 t=2.35s。RoPE 按时间戳旋转 Attention；模型会把它们看作在时间上同时发生。

这是让“他一边挥手一边说 hello”能够工作的基础设施：模型在同一个概念时刻看到了视频帧和音频。

### Streaming 语音合成

语音 Token 必须 streaming。Mini-Omni（Xie & Wu, 2024）提出“language models can hear, talk while thinking in streaming”：Thinker 输出 Token 和 Talker 输出 Token 在同一个序列中交错。Talker 在 Thinker 确认下一个文本 Token 后立即启动。没有 batch 边界。

Moshi（Défossez et al., 2024 年 10 月）是最快的开放实现。单张 A100 上 TTFAB 为 160ms。架构：单个 7B Transformer，在交替位置上发出文本和语音 Token，并通过“inner monologue”将思考流与说话流分离。这本质上是把 Thinker + Talker 融合成一个模型，并配合精心训练。

### VAD and turn-taking

Voice activity detection 运行在输入侧。两种模式：

- Half-duplex：用户说话，模型听。模型说话，用户听。通过 VAD 静音检测（~200ms）实现清晰交接。
- Full-duplex：双方可以同时说话。模型可以 backchannel（“uh-huh”）或打断。难得多。Moshi 支持这一点。

Qwen2.5-Omni 默认支持 half-duplex，通过静音阈值进行 turn-taking。Full-duplex 需要应用层处理。

### Qwen3-Omni（2025 年 11 月）

后继版本。Qwen3-80B Thinker，更大的 Talker，改进的 TMRoPE-v2。延迟接近 GPT-4o 的 250ms。开放权重。在 OmniBench 上的 benchmark 与 Gemini 2.0 Live 具有竞争力。

### Production latency budget

对于典型 streaming 交互：

- Mic -> 音频 Token：40-80ms。
- Prefill（prompt + history）：7B 上 100-200ms，70B 上高得多。
- 第一个 Thinker 文本 Token：40ms。
- Talker 处理第一个文本 Token：20ms。
- 第一个语音 Token commit：40ms。
- Residual-VQ decode：30ms。
- 语音 waveform decode：50-80ms。

总 TTFAB：7B 上 320-510ms，70B 上 600-900ms。Frontier 质量通常意味着 70B+；这就是 frontier 延迟差距的来源。

### Token-rate math

对于 16kHz 语音和 50 Hz 基础层语音 Token，你每秒输出需要 50 个语音 Token。Talker 必须发出 ≥50 tok/s 才能跟上。在 H100 上，典型 LLM throughput 为 30-80 tok/s，因此小型（200-300M）Talker 足够快；7B Talker 会落后。

这就是为什么会存在小型专用 Talker 模型，而不是“直接使用主模型”。

## 使用它
`code/main.py`：

- 用 mock Token 发射速率模拟 Thinker-Talker pipeline。
- 为可配置的模型尺寸和 mic 采样率计算 TTFAB。
- 用 VAD 静音阈值演示 half-duplex turn-taking。

## 交付它
本课产出 `outputs/skill-omni-streaming-budget.md`。给定一个实时语音产品的目标 TTFAB 和功能集合（vision-in、bilingual、full-duplex），选择 Qwen2.5-Omni、Qwen3-Omni、Moshi 或 Mini-Omni，并确定 Thinker/Talker 的尺寸。

## 练习
1. 你的目标 TTFAB 是 300ms。在 7B Thinker 和 300M Talker 上，写出每个组件的延迟。

2. Qwen2.5-Omni 使用 TMRoPE。描述这样一个 prompt 中模型看到的内容：用户在 t=1s 开始说话，摄像头在 t=1.2s 捕捉到一个手势。

3. Full-duplex 支持要求模型在听的同时发出音频。提出一种训练数据格式来教授这一点。

4. 阅读 Moshi 论文 Section 4。描述“inner monologue”分离，以及它为什么避免了 Thinker-Talker 拆分。

5. 计算 throughput 预算：为了跟上 16kHz 语音和 50 个基础层 Token/秒，Talker 必须以多快速度发出 Token？

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Thinker | “推理大脑” | 生成要说什么的大型文本生成 Transformer |
| Talker | “语音生成嘴巴” | 从 Thinker 文本生成离散语音 Token 的小型 Transformer |
| TTFAB | “延迟预算” | Time-to-first-audio-byte：从用户语音结束到第一个音频 sample 输出 |
| TMRoPE | “时间对齐 RoPE” | 使用跨视觉、音频、文本的绝对时间戳的位置编码 |
| Half-duplex | “Turn-taking” | 用户和模型交替；VAD 静音检测用户已说完 |
| Full-duplex | “同时进行” | 模型可以同时说话和聆听；具备 backchannel 能力 |
| Inner monologue | “Moshi 分离” | 单模型设计，其中思考流和说话流交错 |

## 延伸阅读
- [Xu et al. — Qwen2.5-Omni (arXiv:2503.20215)](https://arxiv.org/abs/2503.20215)
- [Qwen Team — Qwen3-Omni (arXiv:2509.17765)](https://arxiv.org/html/2509.17765v1)
- [Xie & Wu — Mini-Omni (arXiv:2408.16725)](https://arxiv.org/abs/2408.16725)
- [Défossez et al. — Moshi (arXiv:2410.00037)](https://arxiv.org/abs/2410.00037)
- [Zeng et al. — GLM-4-Voice (arXiv:2412.02612)](https://arxiv.org/abs/2412.02612)
