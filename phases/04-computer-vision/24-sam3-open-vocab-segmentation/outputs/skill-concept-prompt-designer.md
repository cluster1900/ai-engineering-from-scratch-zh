---
name: skill-concept-prompt-designer
description: 将用户话语转换为格式良好的 SAM 3 concept prompt，并处理拆分、消歧和 fallback
version: 1.0.0
phase: 4
lesson: 24
tags: [sam3, open-vocab, prompt-engineering, segmentation]
---

# Concept Prompt 设计器

SAM 3 的准确率很大程度上取决于 concept prompt 的表述方式。这个 skill 会将自由形式的用户话语规范化为 SAM 3 更容易处理的 prompt。

## 何时使用

- 构建接受自然语言对象查询的 UI。
- 通过 API 暴露 SAM 3，而上游调用方会发送句子。
- Debug SAM 3 匹配效果差的问题 — 通常是 prompt 格式不佳，而不是 model 问题。

## 输入

- `utterance`: 原始用户字符串。
- `context`: 可选的领域提示（例如 "surveillance"、"medical"、"retail"）。
- `max_concepts`: 每条话语最多提取的 concept 数；默认 5。

## SAM 3 偏好的规则

- **短名词短语，而不是句子。** `"cat"` 优于 `"there is a cat"`。
- **具象名词。** `"skateboard"` 优于 `"thing to ride on"`。
- **修饰语紧挨在名词前。** `"red car"` 优于 `"car that is red"`。
- **小写。** SAM 3 很稳健，但经验上小写输入略好。
- **单数或复数。** 两者都可用；当预期有多个实例时，复数会有帮助。

## 步骤

1. **按常见分隔符切分** — 逗号、分号、"and"、"or"、"&"。
2. **丢弃填充前缀** — "find"、"show me"、"segment"、"detect"、"locate"、"a"、"an"、"the"。
3. **只保留视觉性的介词修饰语** — `"striped red umbrella"` 可以，`"umbrella from yesterday"` 不可以（`"from yesterday"` 不在图像中）。
4. **使用可选的 `context` 处理歧义冲突**：
   - surveillance context 中的 `"window"` -> `"building window"`。
   - medical context 中的 `"window"` -> 通常是错误；建议用户澄清。
5. **Fallback** 到原始精确字符串，条件是拆分得到零个 concept *且* 话语中至少包含一个具象名词。如果无法提取具象名词，不要输出 concept — 只返回 warnings 并要求用户澄清（见 Rules）。
6. **限制在 `max_concepts`。** 如果提取的 concept 数超过调用方要求的数量，则按话语顺序保留前 `max_concepts` 个，并将其余项放入 `dropped`，reason 为 `"exceeded max_concepts"`。这样可以在用户粘贴很长枚举时限制 latency。

## 输出格式

```
[设计后的 prompts]
  utterance:    <original>
  concepts:     ["concept_1", "concept_2", ...]
  dropped:      ["filler_1", ...]
  warnings:     ["concept too abstract", "may match many classes", ...]

[sam3 calls]
  对每个 concept 运行: sam3.detect(image, concept)
  合并输出，并为每个 detection 保留不同的 concept tag。
```

## 示例

```
in:  "can you find me a cat or two dogs?"
out: ["cat", "dogs"]
dropped: ["can you find me", "a", "or two", "?"]
note: "dogs" 保留复数，因为话语中说的是 "two dogs" — 保留了复数提示。

in:  "segment the big red truck and the blue sedan"
out: ["big red truck", "blue sedan"]
dropped: ["segment", "the", "and"]

in:  "thing near the door"
out: ["door"]
warnings: ["'thing' 对 SAM 3 来说过于抽象；已 fallback 到 'door'"]

in:  "striped red umbrella, green hat, pink balloon"
out: ["striped red umbrella", "green hat", "pink balloon"]
```

## 规则

- 永远不要向 SAM 3 传入超过 8 个词的句子 — 超过后准确率会下降。
- 当话语中没有可提取的具象名词时，不要运行 SAM 3；返回 warnings 并请求澄清。
- 不要按引号内字符串里的标点拆分；如果 `"black and white cat"` 被引用，则保留为一个 concept。
- 始终记录原始话语和派生出的 concept，用于生产环境 debugging。
