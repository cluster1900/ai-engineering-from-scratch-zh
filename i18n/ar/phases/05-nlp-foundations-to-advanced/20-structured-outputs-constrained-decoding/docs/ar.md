# المخرجات المهيكلة والتشفير المقيّد

> إلى LLM طلب JSON。 أغلب الوقت سوف تحصل على JSON。 في بيئة الإنتاج،غالبية就是 المشكلة所在──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

واحد من المصفوفات إلى LLM 提示:رجع واحد من {إيجابي، سلبي، محايد}. 模型返回:الرؤية إيجابية  هذا المراجعة هو من المفيد بشكل ساحق لأن العميل يعلن صراحة أنهم ...── your parser 崩了── ف1 من المصفوف الخاص بك هو 0.0──

الحرية في النمو ليست تشيئاً. إنها مجرد اقتراح.

في عام 2026 سيكون هناك خطة ثلاثية

1. **Prompting。**حسناً الطلب. رجع فقط جسم JSON. في نماذج الحدود أعلى حوالي 80% فعالة، في نماذج أصغر أقل.
2. **原生 structured output APIs。**افتتاح`response_format`استخدام أدوات الأنثروبية وضع جيمين جي إس اون
3. **Constrained decoding。**في كل خطوة تغيير التسجيلات، جعل النموذج* لا يمكن* إصدار رموز غير فعالة.

هذا الدروس سوف يُساعد على بناء الحس البسيط، ويشرح متى يجب استخدام أي نوع

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**في كل خطوة إنتاج، LLM سوف تنتج متجهة منطقية كاملة على كل لغة ((حوالي 100 ألف رمز) . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

إنجاز عام 2026:

- **Outlines。**将 JSON Schema 或 regex 编译为有限状态机──每个代币都能 O(1) 查询 valid-next-token──基于FSM,所以 recursive schemes 需要平坦化──
- **XGrammar / llguidance。**محركات اللغة الخالية من السياقات. تعالج مخطط JSON التكراري.
- **vLLM guided decoding。**通過 الخطوط المخططات XGrammar أو lm-format-enforcer 后端内置 `guided_json`.`guided_regex`.`guided_choice`.`guided_grammar`.
- **Instructor。**على أساس Pydantic من أي LLM لفافاتها‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### نتائج المعلومات

عادة ما يكون التشفير المقيود أسرع من التوليد غير المقيود. هناك سببين.`{"name": "`مثل هذا الرفوفد، كل بايت تم تحديد)

### 代价高昂的陷

字段顺序 جداً`answer` وضعه `reasoning`قبل أن تفكر، فإن النموذج سوف يعد جواباً.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

المخططات هي منطقية وليس صيغة


```figure
constrained-decoder
```

## الإنشاء

### الخطوة الأولى: من الصفر تبدأ في إعداد التوليد المحدود

查看 `code/main.py`، من بينها واحد مستقل من إنجازات منظمة التعاون الدولي:

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

سوف تتبع FSM حتى الآن نحن قد قُنا بعض أجزاء اللغة.`valid_tokens(state, tokenizer)`会计算哪些词汇代币可以推进FSM,同时不离开任何接受路径──

### 步骤 2: استخدام الخطوط المخططة  معالجة مخطط JSON

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

零 أخطاء التحقق من الصحة.

### 步骤 3: مع المعلم جعل مزود-جدانتيك

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

機機不同──Instructor 不接触 Logits──它把方案 格式化进提示,解析输出,并在验证失败时重试(默认 3 次)──适用于任何提供商──重试会增加延迟和成本──跨提供可移植性是它的卖点──

### 步骤 4: APIs البائع الأصلي

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

إعادة تشفير المستخدمين على جانب الخادم.

## فخ

- **Recursive schemas。**الخطوط المخططة ستضع التكرار مسطحًا إلى عمق ثابت.
- **巨大 enums。**10,000 个选项的编译很慢,或会超时――改用:先预测 top-k candidates,再约束到这些候选人――
- **Grammar 过于严格。**الإجبار`date: "YYYY-MM-DD"`في غضون ذلك ، لا يمكن أن تكون النموذج غائبة`"unknown"` الموديل سيتم من خلال إعداد يوم لتحقيق المكافأة`null`أو حارس
- **过早承诺。**见上段序陷──始终把推理 放在前面──
- **没有 schema 的 vendor JSON mode。**純 JSON وضع فقط ضمان فعال JSON,不保证对*你的用例*有效──始终提供完整方案──

## استخدام

2026 سنة:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 交付

保存为 `outputs/skill-structured-output-picker.md`:

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

## التدريب

1. **Easy。**في حالة عدم استخدام تشفير مقيد، فاستعرض نموذج صغير مفتوح الوزن (مثل Llama-3.2-3B)`Review(sentiment, confidence, evidence_span)` في 100 条 条 评论 上测量能解析为有效 JSON 的比例──
2. **Medium。**استخدام الخطوط الجدلية وضع JSON في نفس الجسم 上 تجربة.
3. **Hard。**من صفر لتحقيق واحد للاستخدام`\d{3}-\d{3}-\d{4}`) من إعادة تشغيل القيود المحدود.

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

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) المخططات 论文。
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) 快速 基于 CFG 的限制解码──
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成。
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) إشارة إطار الإستراتيجية الإلكترونية + إشارة إشارة إلكترونية
- [Instructor library](https://python.useinstructor.com/) 跨供应商的Pydantic + retries──
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) على 6 إطارات تشفير القيود المحدودة  إجراء تقييم مقارنة‬
