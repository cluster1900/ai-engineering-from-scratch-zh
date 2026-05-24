---
name: ai-tutor
description: 为特定学科交付一个自适应 Multimodal personal tutor，具备 Bayesian knowledge tracing、curriculum graph、safety filters，以及一次经过衡量的两周效果研究。
version: 1.0.0
phase: 19
lesson: 17
tags: [capstone, tutor, adaptive, bkt, fsrs, livekit, multimodal, coppa]
---

给定一个学科（K-12 algebra 或 intro Python），构建一个具备 text + voice + photo-math 输入、Bayesian knowledge tracing learner model、由 curriculum graph 驱动的 concept selection、COPPA-aware memory 和 safety filters 的 personal tutor。用 10 名学习者运行一次为期两周的效果研究。

Build plan:

1. Neo4j 中的 Curriculum graph：50-150 个 concept nodes，带 prerequisite edges，并附加 OER content（OpenStax、Open Textbook）。
2. Learner model：Bayesian knowledge tracing，为每个 concept 设置 guess/slip/learn-rate priors；按学习者持久化状态。
3. Tutor policy（基于 Claude Sonnet 4.7 且带 prompt caching 的 LangGraph）：read_signal -> select_concept（graph walk）-> scaffold（Socratic）-> update_mastery。
4. Memory：agentmemory 风格的持久 episodic + semantic store；COPPA-aware，1 年后自动删除；家长可访问删除。
5. Voice：LiveKit Agents worker，使用 Whisper-v3-turbo ASR 和 Cartesia Sonic-2 TTS；复用 capstone 03 pipeline。
6. Photo math：使用 dots.ocr 或 PaliGemma 2 进行 equation recognition；将结构化输入送入 tutor。
7. Safety：Llama Guard 4 input/output；适龄 filter 阻止 self-harm/adult/violence；按学习者 scope 隔离 memory。
8. 每名学习者的 weekly PDF progress reports。
9. Efficacy study：10 名学习者，pre-test（标准化 30 题 baseline），2 周 sessions（每周 3 次），post-test；与 non-adaptive linear cohort 对比。

Assessment rubric:

| Weight | Criterion | Measurement |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、2 周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention + cross-learner isolation |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |

Hard rejects:

- 直接 answer-dump 而不是提出下一个问题的 tutor policies。Socratic 是硬性要求。
- 不按每次交互更新的 learner models。BKT 是最低标准。
- 没有 COPPA-aware retention 的 memory。对 K-12 受众不可接受。
- 没有 non-adaptive baseline cohort 的效果声明。

Refusal rules:

- 如果 input 和 output 上都没有 Llama Guard 4，拒绝部署。
- 如果没有家长可访问的删除入口，拒绝持久化 learner data。
- 如果没有同时运行 non-adaptive baseline，拒绝声称 "adaptive"。

Output：一个 repo，包含 curriculum graph、BKT learner model、LangGraph tutor policy、Multimodal input handlers、LiveKit voice pipeline、safety pipeline、parental dashboard、efficacy-study runner、pre/post test harness，以及一份 write-up，记录相对于 linear baseline 的 learning gain delta 和 confidence intervals。
