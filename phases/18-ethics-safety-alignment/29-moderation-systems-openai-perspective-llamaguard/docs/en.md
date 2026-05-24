# 内容审核系统 — OpenAI, Perspective, Llama Guard

> 生产级 moderation systems 将 Lessons 12-16 中定义的 safety policies 操作化。OpenAI Moderation API：`omni-moderation-latest` (2024) 基于 GPT-4o，可在一次调用中对 text + images 分类；在多语言测试集上比上一版本提升 42%；response schema 返回 13 个 category booleans — harassment, harassment/threatening, hate, hate/threatening, illicit, illicit/violent, self-harm, self-harm/intent, self-harm/instructions, sexual, sexual/minors, violence, violence/graphic；对大多数开发者免费。Layered patterns：Input moderation (pre-generation)、Output moderation (post-generation)、Custom moderation (domain rules)。Async parallel calls 可隐藏 latency；flag 时返回 placeholder responses。Llama Guard 3/4 (Lesson 16)：14 个 MLCommons hazards、Code Interpreter Abuse、8 languages (v3)、multi-image (v4)。Perspective API (Google Jigsaw)：早于 LLM-as-moderator 浪潮的 toxicity scoring；主要是单维度 toxicity，并带有 severe-toxicity/insult/profanity 变体；是 content-moderation research 的 baseline。Deprecations：Azure Content Moderator 于 2024 年 2 月 deprecated，2027 年 2 月 retired，由 Azure AI Content Safety 替代。

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**前置要求：** Phase 18 · 16 (Llama Guard / Garak / PyRIT)
**Time:** ~60 minutes

## 学习目标
- 描述 OpenAI Moderation API 的 category taxonomy，以及它与 Llama Guard 3 的 MLCommons set 有何不同。
- 描述 three moderation-layer pattern（input、output、custom），并指出每一层的一个 failure mode。
- 描述 Perspective API 作为 pre-LLM-era baseline 的定位，以及它为什么仍被用于研究。
- 说明 Azure deprecation timeline。

## 问题
Lessons 12-16 描述 attacks 与 defense tooling。Lesson 29 覆盖已部署的 moderation systems，它们在用户接触产品的表面将 defenses 操作化。three-layer pattern 是 2026 年的默认配置。

## 概念
### OpenAI Moderation API

`omni-moderation-latest` (2024)。基于 GPT-4o。一次调用即可对 text + images 分类。对大多数开发者免费。

Categories（response schema 中的 13 个 booleans）：
- harassment, harassment/threatening
- hate, hate/threatening
- self-harm, self-harm/intent, self-harm/instructions
- sexual, sexual/minors
- violence, violence/graphic
- illicit, illicit/violent

Multimodal support 适用于 `violence`、`self-harm` 和 `sexual`，但不适用于 `sexual/minors`；其余为 text-only。

在 `code/main.py` 的 code harness 中，为了教学简洁性，我们将 `/threatening`、`/intent`、`/instructions` 和 `/graphic` sub-categories 折叠到它们的 top-level parents。生产代码应使用完整的 13-category schema。

在多语言测试集上比上一代 moderation endpoint 提升 42%。提供 per-category scores；应用自行设置 thresholds。

### Llama Guard 3/4

已在 Lesson 16 覆盖。14 个 MLCommons hazard categories（组织方式不同于 OpenAI 的 13 个 response-schema booleans）。支持 8 languages (v3)。Llama Guard 4 (2025 年 4 月) 原生支持 Multimodal，12B。

OpenAI 和 Llama Guard 的 taxonomies 有重叠但也有分歧。OpenAI 将 "illicit" 作为一个 broad category；Llama Guard 将 "violent crimes" 和 "non-violent crimes" 分开。部署时根据其 policy-taxonomy fit 选择。

### Perspective API (Google Jigsaw)

早于 LLM-as-moderator 浪潮（pre-2020）的 toxicity scoring system。Categories：TOXICITY, SEVERE_TOXICITY, INSULT, PROFANITY, THREAT, IDENTITY_ATTACK。单维度 primary score (TOXICITY)，并带有 sub-dimension variants。

它被广泛用作 content-moderation research baseline，因为该 API 稳定、有文档，并且拥有多年 calibration data。对于现代 LLM-adjacent 用例，Llama Guard 或 OpenAI Moderation 通常更适合。

### The three-layer pattern

1. **Input moderation.** 在 generation 前对用户 prompt 分类。如果 flagged，则拒绝。Latency：一次 classifier call。
2. **Output moderation.** 在 delivery 前对 model output 分类。如果 flagged，则替换为 refusal。Latency：generation 后一次 classifier call。
3. **Custom moderation.** Domain-specific rules（regex、allowlists、business policy）。可在 input 或 output 阶段运行。

这三层按设计是 sequential：input moderation 必须在 generation 前完成，output moderation 在 generation 后运行。Parallelism 适用于层内 — 在同一 text 上并发运行多个 classifiers（例如 OpenAI Moderation + Llama Guard + Perspective），以隐藏每个 classifier 的 latency。作为可选优化，可在 input moderation 完成且 token-1 streaming 延后期间显示 placeholder response（"one moment, checking..."）。Flag behaviour 可配置：refuse、sanitize、escalate to human review。

### Failure modes

- **Input only.** 捕捉不到 output hallucinations（Lesson 12-14 encoding attacks 会绕过 input classifiers）。
- **Output only.** 允许任何 input 到达 model；增加成本；向 attacker 暴露 internal reasoning。
- **Custom only.** 无法稳健覆盖各类 categories；regexes 很脆弱。

Layered 是默认做法。双重保险。

### Azure deprecation

Azure Content Moderator：2024 年 2 月 deprecated，2027 年 2 月 retired。由 Azure AI Content Safety 替代，后者基于 LLM，并与 Azure OpenAI 集成。对于 Azure deployments，migration 是一个 2024-2027 年的实际部署层面项目。

### Where this fits in Phase 18

Lesson 16 在 red-team context 中覆盖 moderation tooling。Lesson 29 覆盖 deployed moderation。Lesson 30 以当前 dual-use capability evidence 收尾。

## 使用它
`code/main.py` 构建一个 three-layer moderation harness：input moderator（keyword + category score）、output moderator（对 output 使用同一 classifier）、custom moderator（domain rules）。你可以将 inputs 跑过它，并观察哪一层捕捉到了什么。

## 交付它
本课产出 `outputs/skill-moderation-stack.md`。给定一个 deployment，它会推荐 moderation stack configuration：input 使用哪个 classifier，output 使用哪个 classifier，使用哪些 custom rules，以及 edge cases 用什么 judge。

## 练习
1. 运行 `code/main.py`。将 benign、borderline 和 harmful input 跑过全部三层。报告每种情况下哪一层触发。

2. 扩展 harness，加入针对特定 category 的 Perspective-API-style toxicity scoring。比较它的 threshold behaviour 与 category score。

3. 阅读 OpenAI Moderation API docs 和 Llama Guard 3 category list。将每个 OpenAI category 映射到最接近的 Llama Guard categories。找出三个无法干净映射的 categories。

4. 为 code-assistant deployment（例如 GitHub Copilot）设计 moderation stack。识别最相关和最不相关的 categories，并提出 custom rules。

5. Azure Content Moderator 将于 2027 年 2 月 retired。规划迁移到 Azure AI Content Safety。识别 migration 中风险最高的元素。

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | 基于 GPT-4o 的 13-category (text) classifier，带部分 Multimodal support |
| Perspective API | "Google Jigsaw toxicity" | Pre-LLM-era toxicity scoring baseline |
| Llama Guard | "MLCommons 14-category" | Meta 的 hazard classifier（v3：8B text，8 langs；v4：12B Multimodal） |
| Input moderation | "pre-generation filter" | model call 前作用于 user prompt 的 classifier |
| Output moderation | "post-generation filter" | delivery 前作用于 model output 的 classifier |
| Custom moderation | "domain rules" | Deployment-specific rules（regex、allowlist、policy） |
| Layered moderation | "all three layers" | 标准生产部署模式 |

## 延伸阅读
- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) — omni-moderation endpoint
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) — Llama Guard repo
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) — toxicity scoring
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) — Azure replacement
