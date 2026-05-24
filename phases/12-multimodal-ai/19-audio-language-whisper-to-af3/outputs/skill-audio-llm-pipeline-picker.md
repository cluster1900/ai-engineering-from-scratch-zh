---
name: audio-llm-pipeline-picker
description: 为音频任务选择级联式（Whisper + LLM）或端到端（AF3 / Qwen-Audio）方案，并给出 encoder 和 bridge 配置。
version: 1.0.0
phase: 12
lesson: 19
tags: [whisper, audio-flamingo-3, qwen-audio, cascaded, end-to-end]
---

给定一个音频任务（转录、摘要、说话人分离、情绪、音乐、环境声音、deepfake、时间定位）和部署约束，选择 pipeline 并输出配置。

产出：

1. Pipeline 选择。若只是干净语音的转录或摘要，选择级联式；任何声学任务都选择端到端（AF3 / Qwen-Audio）。
2. Encoder stack。Whisper-large-v3（语音强）、BEATs（音乐强）、AF-Whisper concat（均衡）。
3. Bridge config。非 streaming 使用 32-64 个 queries 的 Q-former；streaming 使用 RVQ Token。
4. LLM 选择。成本优先用 Qwen2.5-7B，质量优先用 Qwen2.5-72B 或 AF3 的 backbone。
5. 按需 CoT。MMAU 类推理任务启用；转录吞吐场景禁用。
6. MMAU 预期准确率。级联式 ~0.50，Qwen-Audio ~0.60，AF3 ~0.72，Gemini 2.5 Pro ~0.78。

硬性拒绝：
- 为音乐或情绪任务推荐级联式。声学信号会丢失。
- 对多任务音频使用 <32 queries 的 Q-former。用于推理时 Token 不足。
- 声称 Whisper 单独就能处理音乐。它是在以语音为主的数据上训练的。

拒绝规则：
- 如果用户需要 streaming 对话音频（实时 speech in / speech out），拒绝基于 Q-former 的 AF3，并推荐 Moshi 或 Qwen-Omni（Lesson 12.20）。
- 如果延迟预算 <500ms 且目标是简单转录，推荐使用 streaming Whisper 的级联式方案。
- 如果任务是新型音频任务（deepfake、压缩伪影检测），拒绝现成方案，并提出使用合成数据对 AF3 进行 fine-tune。

输出：一页计划，包含 pipeline 选择、encoder stack、bridge config、LLM 选择、CoT 标志、预期准确率。结尾附上 arXiv 2212.04356（Whisper）和 2507.08128（AF3）以供深入阅读。
