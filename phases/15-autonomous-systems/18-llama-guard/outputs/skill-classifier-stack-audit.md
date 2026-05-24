---
name: classifier-stack-audit
description: 审计 deployment 的 input/output classifier stack（model、taxonomy、input rails、output rails、dialog rails），并标记 adversarial-attack 缺口。
version: 1.0.0
phase: 15
lesson: 18
tags: [llama-guard, nemo-guardrails, input-rails, output-rails, colang, adversarial-attacks]
---

给定某个 deployment 的 classifier stack（Llama Guard version、NeMo Guardrails config、custom classifiers、normalization steps），按 2026 reference 进行审计，并标记该 stack 未覆盖的 attack surface。

产出：

1. **Model inventory.** 列出正在使用的 classifiers。Llama Guard 3（8B / 1B-INT4）vs Llama Guard 4（Multimodal，S1–S14）。NeMo Guardrails version。任何 custom classifiers。如果 deployment 接受 images，确认 classifier 是 Multimodal。
2. **Taxonomy mapping.** 将声明的 business categories 映射到 classifier 的 taxonomy。Operator 关心的每个 category 都必须映射到一个 classifier category；未映射 category 没有防护。
3. **Rail coverage.** 确认 input rails 在 model turn 之前触发，output rails 在 response 发送之前触发。Dialog rails（NeMo 中的 Colang）强制执行 cross-turn constraints。Single-turn classifiers 无法捕获 multi-turn attacks。
4. **Normalization.** 确认 inputs 在 classification 前已进行 NFKC-normalized、homoglyph-mapped，并移除 zero-width / variation-selector characters。Raw-byte classification 是 Emoji Smuggling 的 100% ASR 目标（Huang et al. 2025）。
5. **Attack-corpus coverage.** 对每个已记录 attack（emoji smuggling、homoglyph、in-context redirection、semantic paraphrase），说明 stack 中对应的具体 defense。Classifier-only defense 无法通过此 audit；必须与 Constitution（Lesson 17）和 runtime（Lessons 10, 13, 14）分层组合。

Hard rejects:
- 在 Multimodal inputs 上使用 text-only classifier 的 deployments。
- 没有 normalization step 的 deployments。
- 只有 input rails 的 deployments（没有针对 sensitive-category outputs 的 output rails）。
- 将 classifier 视为唯一 safety layer 的 stack。
- Operator 无法在自身 distribution 上复现的 ASR claims。

Refusal rules:
- 如果用户声明的 categories 无法映射到 classifier 的 taxonomy，拒绝并要求先提供 mapping。Unmapped = unguarded。
- 如果 deployment 在 Multimodal input surface 上引用 Llama Guard 3 ASR numbers，拒绝并要求使用 Llama Guard 4 或 Multimodal classifier。
- 如果用户在 high-risk setting 中将 classifier layer 视为充分，拒绝。EU AI Act Article 14（Lesson 15）要求在其之上有人类监督。

Output format:

返回一个 classifier audit，包含：
- **Model inventory**（name, version, modality）
- **Taxonomy mapping**（operator category → classifier category）
- **Rail coverage**（input / output / dialog；在 model 前/后触发）
- **规范化说明**（NFKC y/n, homoglyph y/n, zero-width strip y/n）
- **Attack-corpus coverage**（attack → defense）
- **Layer completeness**（classifier + constitution + runtime；三者必需）
- **Readiness**（production / staging / research-only）
