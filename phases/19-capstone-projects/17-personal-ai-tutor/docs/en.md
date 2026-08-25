# Capstone 17 — Personal AI Tutor（自适应、Multimodal、带 Memory）

> Khanmigo（Khan Academy）、Duolingo Max、Google LearnLM / Gemini for Education、Quizlet Q-Chat 和 Synthesis Tutor 都在 2026 年规模化交付了自适应 Multimodal 辅导。共同形态是 Socratic policy（绝不只是直接给出答案）、每次交互后都会更新的 learner model（Bayesian knowledge tracing 风格）、voice + text + photo-math 输入、curriculum graph 检索、spaced-repetition 调度，以及针对适龄内容的严格 safety filter。本 Capstone 要交付一个面向特定学科的 tutor（K-12 algebra 或 intro Python），用 10 名学习者运行一次为期两周的效果研究，并通过 content-safety 审计。

**Type:** Capstone
**Languages:** Python（backend、learner model）、TypeScript（web app）、SQL（通过 Postgres + Neo4j 构建 curriculum graph）
**Prerequisites:** Phase 5（NLP）、Phase 6（speech）、Phase 11（LLM engineering）、Phase 12（Multimodal）、Phase 14（agents）、Phase 17（infrastructure）、Phase 18（safety）
**Phases exercised:** P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 小时

## 问题
自适应辅导过去曾是 ed-tech 研究中的小众方向。到 2026 年，它已经成为消费级产品。Khanmigo 已部署到美国大多数学区。Duolingo Max 达到了数千万 MAU。Google 的 LearnLM / Gemini for Education 为 Google Classroom 中的辅导提供能力。Quizlet Q-Chat 与 flashcards 并列使用。Synthesis Tutor 凭借 tutor-for-curious-kids 走红。共同要素包括：Multimodal 输入（打字、说话、拍摄方程）、Socratic pedagogy（先提问，后解释）、每次交互后都会更新的 learner model，以及严格的适龄 safety。

你将为一个特定 cohort 构建其中一种系统。衡量标准是一项真实的效果研究：10 名学习者在两周内的 pre-test 与 post-test 分数。voice loop 必须感觉自然（capstone 03 sub-stack）。Memory 必须尊重隐私。Safety filter 必须通过面向 K-12 的 COPPA-aware red-team。

## 概念
四个组件。**Tutor policy** 是一个 Socratic loop：当学习者索要答案时，policy 会提出引导性问题；当他们答对时，它会进入下一个 concept；当他们卡住时，它会提供 scaffolded hint。**Learner model** 是 Bayesian knowledge tracing（或一个简单变体），在每次交互后更新每个 curriculum node 的 mastery probability。**Curriculum graph** 是一个包含 concepts 与 prerequisite edges 的 Neo4j；policy 遍历该 graph 来选择下一个 concept。**Memory** 是一个 episodic + semantic store（agentmemory 风格），保存过往交互、错误和偏好。

UX 是 Multimodal。Text input 用于输入答案。Voice input 通过 LiveKit + Whisper 实现（复用 capstone 03）。Photo input 用于通过 dots.ocr 或 PaliGemma 2 处理数学题。Voice output 通过 Cartesia Sonic-2 实现。Safety 使用 Llama Guard 4 加一个适龄 filter（阻止成人内容、暴力、自伤），并使用 COPPA-aware memory retention policy。

效果研究是交付物。10 名学习者，pre-test 和 post-test，为期两周。报告 learning gain delta 和 confidence interval。与 non-adaptive baseline 对比（相同内容以线性方式交付，不使用 tutor policy）。

## 架构
```
learner device
  |
  +-- text         -> web app
  +-- voice        -> LiveKit Agents (ASR + TTS)
  +-- photo math   -> dots.ocr / PaliGemma 2
       |
       v
  tutor policy (LangGraph)
       - Socratic decision head
       - next-concept chooser (curriculum graph walk)
       - hint scaffolder
       - mastery update
       |
       v
  learner model (BKT / item-response theory)
       - per-concept mastery probability
       - spaced-repetition scheduler (SM-2 or FSRS)
       |
       v
  memory (agentmemory-style)
       - episodic: every interaction
       - semantic: learned mistakes, preferences
       - retention policy: COPPA / GDPR aware
       |
       v
  curriculum graph (Neo4j)
       - prerequisite edges
       - OER content attached
       |
       v
  safety:
    Llama Guard 4 + age-appropriate filter
    memory access guarded by learner ID scope
```

## 技术栈
- 学科选择：K-12 algebra 或 intro Python（选择一个深入做）
- Tutor policy：基于 Claude Sonnet 4.7 的 LangGraph（带 prompt caching）
- Learner model：Bayesian knowledge tracing（classic）或用于 spacing 的 FSRS
- Curriculum graph：包含 concepts + prerequisite edges + OER content 的 Neo4j
- Memory：agentmemory 风格的持久 Vector + episodic + semantic store
- Voice：LiveKit Agents 1.0 + Cartesia Sonic-2（复用 capstone 03 sub-stack）
- Photo math：dots.ocr 或 PaliGemma 2 用于 equation recognition
- Safety：Llama Guard 4 + 自定义适龄 filter
- Eval：Bloom-level 问题生成、pre/post test harness、efficacy study tooling

```figure
cf-tutor-loop
```

## 构建它
1. **Curriculum graph.** 构建一个包含 50-150 个 concept nodes 的 Neo4j（例如 K-12 algebra，从 "number line" 到 "quadratic formula"），并带有 prerequisite edges。为每个 node 附加 OER content（Open Textbook、OpenStax）。

2. **Learner model.** 使用 priors 初始化 Bayesian knowledge tracing：guess、slip、learn-rate。每次交互后更新每个 concept 的 mastery。按学习者持久化。

3. **Tutor policy.** LangGraph 节点包括：`read_signal`（学习者答案是正确 / 部分正确 / 卡住？）、`select_concept`（遍历 curriculum graph，选择优先级最高的 concept）、`scaffold`（Socratic prompt）、`update_mastery`。

4. **Memory.** 每次交互都写入 episodic store。错误和偏好会提升到 semantic memory。COPPA-aware retention policy：1 年后自动删除，家长可访问。

5. **Voice path.** 将 LiveKit Agents worker 接入 tutor policy。ASR 使用 Whisper-v3-turbo。TTS 使用 Cartesia Sonic-2。支持 barge-in（复用 capstone 03 机制）。

6. **Photo-math path.** 上传或拍摄图片；运行 dots.ocr 或 PaliGemma 2 识别方程；以结构化输入形式传给 tutor。

7. **Safety.** 每个 model output 都经过 Llama Guard 4 + 适龄 filter（阻止自伤、成人内容、暴力）。Memory access 按 learner ID 设定 scope；提供家长删除入口。

8. **Efficacy study.** 10 名学习者，pre-test（标准化 30 题 baseline），两周 tutor interaction（每周 3 次 session），post-test。与 10 名学习者组成、使用相同内容的 non-adaptive baseline cohort 对比。

9. **Weekly progress reports.** 为每名学习者自动生成 PDF summary，包含探索过的 topics、mastery trajectories 和推荐的 next steps。

## 使用它
```
learner: "I don't understand why 3x + 6 = 12 means x = 2"
[signal]   stuck
[concept]  'isolating variables' (prerequisite: addition-subtraction-equality)
[scaffold] "what number would you subtract from both sides to start?"
learner: "6"
[signal]   correct
[mastery]  addition-subtraction-equality: 0.62 -> 0.77
[concept]  continue 'isolating variables'
[scaffold] "great. now what is 3x / 3 equal to?"
```

## 交付它
`outputs/skill-ai-tutor.md` 是交付物。一个面向特定学科的自适应 tutor，具备 Multimodal 输入、learner model、memory、safety，以及可衡量的效果。

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Learning gain delta | 10 名学习者、两周研究中的 pre/post-test delta |
| 20 | Socratic fidelity | transcript samples 的 rubric score |
| 20 | Multimodal UX | Voice + photo + text 的端到端一致性 |
| 20 | Safety + privacy posture | Llama Guard 4 pass rate + COPPA-aware retention |
| 15 | Curriculum breadth and graph quality | Concept coverage + prerequisite graph consistency |
| **100** | | |

## 练习
1. 分别在启用和不启用 adaptive learner model（随机 concept 顺序）的情况下运行 efficacy study。报告 delta。预期 adaptive 会赢，但真正有意思的是幅度。

2. 添加一个 Multimodal probe：同一个 concept question 分别以 text、voice 和 photo 形式交付。衡量学习者是否在其偏好的 modality 下更快收敛。

3. 构建 parent dashboard：练习过的 topics、mastery trajectories、即将学习的 concepts、safety events（任何 guardrail hits）。与 COPPA 对齐。

4. 添加 language-switch mode：tutor 接受 Spanish 输入并用 Spanish 教学。衡量 X-Guard coverage。

5. 对 memory privacy 进行压力测试：验证 learner A 即使通过 voice-clip re-ingest attack 也无法看到 learner B 的数据。记录访问尝试并发出 alert。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Socratic policy | "Ask, do not dump" | Tutor 提出引导性问题，而不是直接给出答案 |
| Bayesian knowledge tracing | "BKT" | 用于每个 concept mastery probability 的经典 learner-model equations |
| FSRS | "Free Spaced Repetition Scheduler" | 2024 年 spaced-repetition scheduler，比 SM-2 更好 |
| Curriculum graph | "Concept DAG" | 包含 concepts 与 prerequisite edges 的 Neo4j |
| Episodic memory | "Per-interaction log" | 存储每次交互以便后续检索 |
| Semantic memory | "Learned pattern store" | 从 episodic 中压缩并提升出来的错误和偏好 |
| COPPA | "Kids privacy law" | 美国法律，限制从 13 岁以下儿童收集数据 |

## 延伸阅读
- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) — 消费级 K-12 tutor 参考
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) — language-learning tutor 参考
- [Google LearnLM / Gemini for Education](https://blog.google/technology/google-deepmind/learnlm) — 托管参考模型
- [Quizlet Q-Chat](https://quizlet.com) — 替代参考
- [Synthesis Tutor](https://www.synthesis.com) — startup 参考
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) — spaced-repetition scheduler
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) — learner-model classic
- [LiveKit Agents](https://github.com/livekit/agents) — voice stack
