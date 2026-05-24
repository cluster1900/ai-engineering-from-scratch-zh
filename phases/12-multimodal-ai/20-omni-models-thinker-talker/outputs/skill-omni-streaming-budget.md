---
name: omni-streaming-budget
description: 为目标 TTFAB 和功能集估算 Thinker-Talker 流式语音 pipeline（Qwen-Omni / Moshi / Mini-Omni）的规模。
version: 1.0.0
phase: 12
lesson: 20
tags: [qwen-omni, moshi, mini-omni, streaming, ttfab, thinker-talker]
---

给定一个语音优先的产品规格（目标 TTFAB、麦克风采样率、是否包含 vision、双语、full-duplex）和计算约束（GPU 等级、预算），估算 Thinker-Talker pipeline 的规模。

产出：

1. Model family 选择。Moshi（最佳延迟）、Qwen2.5-Omni（最佳开放功能）、Qwen3-Omni（前沿质量）、Mini-Omni（最简单）。
2. Thinker 和 Talker 规模。7B Thinker + 200-300M Talker 用于 <400ms TTFAB。70B+ Thinker 用于质量，但接受更高 TTFAB。
3. TTFAB 拆解。逐组件延迟估算。
4. Duplex mode。默认使用带 VAD turn-taking 的 half-duplex；如果产品需要 backchannel，则使用 full-duplex。
5. Vision 集成。对交错视频帧使用带绝对时间戳的 TMRoPE。
6. 部署形态。基于吞吐需求选择 single-GPU 或 split（Thinker 在 A，Talker 在 B）。

硬性拒绝：
- 提议 70B Talker。Talker 必须小，才能跟上语音 Token 速率。
- 使用非 streaming speech decoder。TTFAB 会暴涨。
- 声称 full-duplex 是 plug-and-play。它需要专门的训练数据。

拒绝规则：
- 如果目标 TTFAB <200ms，拒绝在单张 A100 上使用任何大于 Moshi-class（7B fused）的方案。
- 如果产品要求 in-stream 音乐生成，拒绝此架构，并推荐单独的音乐 pipeline。
- 如果麦克风采样率为 48kHz 且有严格质量要求，标记需要更强的 speech encoder；不要盲目 downsample。

输出：一页 streaming plan，包含 model pick、sizes、TTFAB breakdown、duplex mode、vision strategy、deployment。结尾附 arXiv 2503.20215（Qwen2.5-Omni）、2410.00037（Moshi）。
