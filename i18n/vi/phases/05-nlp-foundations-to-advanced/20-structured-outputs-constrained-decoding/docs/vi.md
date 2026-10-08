# Các sản phẩm có cấu trúc và mã hóa bị hạn chế

> Trong môi trường sản xuất, 大多数就是问题所在──Cần hạn chế giải mã 会在采样前编辑 logic,把大多数变成总是──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

Một phân loại hướng LLM 提示:Tại lại một trong { tích cực, tiêu cực, trung lập}. 模型返回: Tin tức là tích cực  đánh giá này là cực kỳ thuận lợi bởi vì khách hàng rõ ràng tuyên bố rằng họ ...──你的解析器 崩了──你的分类器的 F1 是 0.0──

Tự do hình thức tạo ra không phải là một điều ước. Nó chỉ là một đề xuất.

Năm 2026 có 3 kế hoạch:

1. **Prompting。**                                                                                                                                                                                                                                                              
2. **原生 structured output APIs。**OpenAI `response_format`、Anthropic tool use、Gemini JSON mode──对支持的方案 很可靠──绑定供应商──
3. **Constrained decoding。**Trong mỗi bước tạo sửa đổi logits,让模型*无法*输出无效代币――按构造保证100% 有效――适用于任何本地模型――

Bài này sẽ dành cho ba người để xây dựng trực giác, và giải thích khi nào nên sử dụng loại nào.

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**Trong mỗi bước tạo, LLM sẽ được tạo ra trong một tệp từ vựng hoàn chỉnh (khoảng 100k token) trên một vector logit. Một *logit processor* nằm giữa mô hình và mẫu. Nó sẽ dựa trên vị trí hiện tại trong ngữ pháp mục tiêu.

Thành tựu năm 2026:

- **Outlines。**将 JSON Schema 或 regex 编译为有限状态机──每个代币都能 O(1) 查询 valid-next-token──基于FSM,所以复制式方案需要平坦化──
- **XGrammar / llguidance。**Các công cụ ngữ pháp không liên quan. xử lý quy trình JSON tái tạo.
- **vLLM guided decoding。**通过概要、XGrammar hoặc lm-format-enforcer 后端内置 `guided_json``guided_regex``guided_choice``guided_grammar`
- **Instructor。**基于 Pydantic's arbitrary LLM wrapper──验证失败时重试──跨供应商, nhưng sẽ không sửa đổi logits, dựa vào các thử nghiệm lại + các yêu cầu có cấu trúc-output-awareness──

### Kết quả phản trực giác

Việc mã hóa hạn chế thường nhanh hơn thế hệ không hạn chế *更快*── có hai lý do. Thứ nhất, nó đã thu hẹp các mã thông báo tiếp theo 搜索空间── thứ hai,聪明的实现会对强制代币 完全跳过代币生成(像`{"name": "`Như vậy, mỗi byte đã được xác định.

### 代价高昂的陷

字段顺序 rất quan trọng.`answer` đặt `reasoning`Trước mặt, mô hình sẽ trong suy nghĩ trước khi hứa hẹn một câu trả lời. JSON là hiệu quả.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

Schema 字段顺序 là logic, không phải hình thức.


```figure
constrained-decoder
```

## 构建

### 步骤 1: từ zero bắt đầu làm regex giới hạn thế hệ

查看 `code/main.py`, trong đó có một ý tưởng trung tâm của FSM 实现:

```python
def mask_logits(logits, valid_token_ids):
    mask = [float("-inf")] * len(logits)
    for tid in valid_token_ids:
        mask[tid] = logits[tid]
    return mask


def generate_constrained(model, tokenizer, prompt, fsm):
    ids = tokenizer.encode(prompt)
    state = fsm.initial_state
    while not fsm.is_accept(state):
        logits = model.next_token_logits(ids)
        valid = fsm.valid_tokens(state, tokenizer)
        logits = mask_logits(logits, valid)
        tok = sample(logits)
        ids.append(tok)
        state = fsm.transition(state, tok)
    return tokenizer.decode(ids)
```

FSM sẽ theo dõi cho đến nay chúng ta đã thỏa mãn một số phần của ngữ pháp.`valid_tokens(state, tokenizer)`会计算哪些词汇代码可以推进FSM,同时不离开任何接受路径──

### 步骤 2: dùng Kế hoạch  xử lý JSON Schema

```python
from pydantic import BaseModel
from typing import Literal
import outlines


class Review(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    confidence: float
    evidence_span: str


model = outlines.models.transformers("meta-llama/Llama-3.2-3B-Instruct")
generator = outlines.generate.json(model, Review)

result = generator("Classify: 'The wait staff was attentive and the food arrived hot.'")
print(result)
# Review(sentiment='positive', confidence=0.93, evidence_span='attentive ... hot')
```

零 lỗi xác thực. 永远如此. FSM 让无效输出不可达.

### 步骤 3: sử dụng hướng dẫn viên làm nhà cung cấp-chống chán Pydantic

```python
import instructor
from anthropic import Anthropic
from pydantic import BaseModel, Field


class Invoice(BaseModel):
    vendor: str
    total_usd: float = Field(ge=0)
    line_items: list[str]


client = instructor.from_anthropic(Anthropic())
invoice = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=1024,
    response_model=Invoice,
    messages=[{"role": "user", "content": "Extract from: 'Acme Corp $420. Widget, Gizmo.'"}],
)
```

机械不同──Instructor 不接触 logits──它把方案格式化进快速,解析输出,并在验证失败时重试──默认 3次) ⋅适用于任何提供商──重试会增加延迟和成本──跨提供商 可移植性是它的卖点──

### 步骤 4: API nhà cung cấp gốc

```python
from openai import OpenAI

client = OpenAI()
response = client.responses.create(
    model="gpt-5",
    input=[{"role": "user", "content": "Classify: 'The food was cold.'"}],
    text={"format": {"type": "json_schema", "name": "sentiment",
          "schema": {"type": "object", "required": ["sentiment"],
                     "properties": {"sentiment": {"type": "string",
                                                  "enum": ["positive", "negative", "neutral"]}}}}},
)
print(response.output_parsed)
```

Các hệ thống giải mã bên máy chủ bị hạn chế.

## 陷

- **Recursive schemas。**Các phác thảo sẽ làm cho sự tái diễn phẳng lên độ sâu cố định.
- **巨大 enums。**10.000 个选项的编译很慢,或会超时――改用:先预测 top-k candidates,再约束到这些候选人――
- **Grammar 过于严格。**强制 `date: "YYYY-MM-DD"`Regex 时,模型无法为缺失日期输出 `"unknown"` Mô hình sẽ được tạo ra một ngày để đền bù  cho phép `null`Hoặc là một lính canh.
- **过早承诺。**见上段顺序陷──始终把推理放在前面──
- **没有 schema 的 vendor JSON mode。**纯 JSON模式只保证有效 JSON,不保证对*你的使用例*有效──始终提供完整的方案──

## 使用

2026 năm:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 交付

保存为 `outputs/skill-structured-output-picker.md`- Có thể là:

```markdown
---
name: structured-output-picker
description: 选择 structured output 方法、schema 设计和 validation plan。
version: 1.0.0
phase: 5
lesson: 20
tags: [nlp, llm, structured-output]
---

给定一个 use case（provider、latency budget、schema complexity、failure tolerance），输出：

1. Mechanism。Native vendor structured output、Instructor retries、Outlines FSM 或 XGrammar CFG。用一句话说明原因。
2. Schema design。字段顺序（reasoning first, answer last）、用于 "unknown" 的 nullable fields、enum vs regex、required fields。
3. Failure strategy。Max retries、fallback model、优雅的 `null` handling、out-of-distribution refusal。
4. Validation plan。Schema compliance rate（目标 100%）、semantic validity（LLM-judge）、field-coverage rate、latency p50/p99。

拒绝任何把 `answer` 或 `decision` 放在 reasoning fields 之前的设计。拒绝使用没有 schema 的 bare JSON mode。标记使用仅支持 FSM 的库处理 recursive schemas 的风险。
```

## 练习

1. **Easy。**Trong trường hợp không sử dụng mã hóa hạn chế, lập tức tạo ra một mô hình trọng lượng mở nhỏ (ví dụ như Llama-3.2-3B)`Review(sentiment, confidence, evidence_span)`◊ trong 100 bài đánh giá 上测量能解析为有效 JSON 的比例──
2. **Medium。**用 outlines JSON mode trong cùng một corpus 上实验──比较 tuân thủ tỷ lệ、延迟和语义精度──
3. **Hard。**Từ零实现一个用于电话号码(`\d{3}-\d{3}-\d{4}`(với các mẫu trên 1000)

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Constrained decoding | 强制有效输出 | 在每个生成步骤 mask invalid-token logits。 |
| Logit processor | 执行约束的东西 | 函数：`(logits, state) -> masked_logits`。 |
| FSM | Finite-state machine | 编译后的 grammar 表示；O(1) valid-next-token 查询。 |
| CFG | Context-free grammar | 能处理 recursion 的 grammar；比 FSM 更慢但表达力更强。 |
| Schema field order | 它重要吗？ | 重要，first field 会形成承诺；始终把 reasoning 放在 answer 之前。 |
| Guided decoding | vLLM 对它的称呼 | 同一概念，集成进 inference server。 |
| JSON mode | OpenAI 的早期版本 | 保证 JSON syntax；不保证 schema match。 |

## 延伸阅读

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) Khía họa 论文。
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) 快速 dựa trên CFG của mã hóa hạn chế.
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成。
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) Khán giả API + gotchas。
- [Instructor library](https://python.useinstructor.com/) 跨 nhà cung cấp của Pydantic + thử nghiệm lại。
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) đối với 6 khung giải mã bị hạn chế  thực hiện đánh giá so sánh。
