# Yapılandırılmış Çıktımlar ve Zorlu Çözümleme

> LLM'ye YSON'u isteyin. Çoğu zaman JSON elde edilir.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

Bir sınıflandırıcı yönü LLM 提示:Return one of {positive, negative, neutral}. 模型返回:Sentimenti is positive  bu inceleme aşırı derecede olumlu çünkü müşteri açıkça belirtti ki ...──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

Özgür bir üretim biçimi bir anlaşma değildir.

2026 yılında üç katlı bir çözüm var.

1. **Prompting。**İyi iyi istek. JSON nesnesini geri gönder. Yukarıdaki sınır modelleri üzerinde %80 oranında etkili, daha küçük modelleri üzerinde ise daha düşük.
2. **原生 structured output APIs。**Açıklama`response_format`、Antropik araç kullanımı、Gemini JSON modı──对支持的方案 很可靠──绑定供应商──
3. **Constrained decoding。**Her bir üretim aşamasında logitleri değiştirmek için, model* mümkün değil* çıkartılsın.

Bu ders, üç kişi için bir intuition oluşturmak için, ve hangi zaman kullanılması gerektiğini açıklamak için olacaktır.

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**LLM, her bir üretim aşamasında, tam bir sözlükte (yaklaşık 100k token) bir logit vektörü üretir. *logit işlemcisi* model ve örnekçi arasında yer alır.

2026 yılındaki gerçekleşme:

- **Outlines。**JSON Şema veya regex 编译为有限状态机──每个代币都能 O(1) 查询 valid-next-token──基于FSM,所以递归式方案需要平坦化──
- **XGrammar / llguidance。**Bağlantısuz dilbilgisi motorları── İşleme rekürsif JSON Şema──解码开销接近零──OpenAI 2025'te yapılandırılmış çıkışında 实现中提到了 llguidance──
- **vLLM guided decoding。**経由概要、XGrammar veya lm biçim uygulayıcı 后端内置 `guided_json`- Evet.`guided_regex`- Evet.`guided_choice`- Evet.`guided_grammar`- Evet.
- **Instructor。**Pydantic'in istedikleri LLM kapsamına dayanıyor.

### Doğrudan karşılama sonucu

Sınırlı çözme genellikle kısıtlı jenerasyona göre * daha hızlı*。 iki neden vardır。 Birincisi, bir sonraki token'ı küçültüyor 搜索空间。 İkincisi,聪明的实现会对强制令子 完全跳过代币生成(像`{"name": "`Bu tür bir heykel, her bayt belirlenmiştir.

### 代价高昂的陷

字段顺序 çok önemli.`answer`- Evet .`reasoning`Önceden, model düşünmeden önce bir cevap söz vermiştir. JSON geçerlidir. Cevap yanlışdır.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

Şema 字段顺序是逻辑,不是形式──


```figure
constrained-decoder
```

## Yapım

### 步骤 1: regex kısıtlı nesil yapmak için sıfırdan başlayın

- Bakın .`code/main.py`, bunlardan biri bağımsız bir FSM 实现──30 行里的核心思想:

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

FSM'nin takip ettiği bu noktada, dilbilgisinin bazı kısımlarını tam olarak kabul etmiştik.`valid_tokens(state, tokenizer)`Sözlük tokenleri FSM'yi geliştirmek için kullanılabilir, aynı zamanda kabul yolu bırakmazlar.

### 步骤 2: Use Outlines  JSON Şeması İşleme

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

零 onay hatası──永远如此──FSM 让无效输出不可达──

### 步骤 3: Kullanıcı-agnostik Pydantic

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

機不同──Instructor 不接触 logits──它把 schema 格式化进快速,解析输出,并验证失败 时重试(默认 3 次)──适用于任何供应商──重试会增加延迟和成本──跨供应商 可移植性是它的卖点──

### 步骤 4: orijinal satıcı API'leri

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

Sunucu tarafı kısıtlı çözme, destekleme şemeleri, güvenilirlik ve çizelgeleri için 相当──不需要管理本地模型──将把你锁定在该供应商上──

## 陷

- **Recursive schemas。**Özetler, geri dönüşü sabit bir derinliğe doğru düzeltir.
- **巨大 enums。**10.000 个选项的编译很慢,或会超时――改用回收器:先预测 top-k adayları,再约束到这些候选人――
- **Grammar 过于严格。**强制 `date: "YYYY-MM-DD"`Regex 时,模型无法为缺失日期输出 `"unknown"` Model bir günlüğü oluşturarak ödeme yapacaktır.`null`Ya da bekçi.
- **过早承诺。**见上段顺序陷──始终把推理放在前面──
- **没有 schema 的 vendor JSON mode。**純 JSON modu 僅保证有效 JSON,不保证对*你的使用例*有效──始终提供完整的方案──

## kullanımı

2026 yılının birimi:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 交付

保存为 `outputs/skill-structured-output-picker.md`- ...

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

1. **Easy。**Bu nedenle, Llama-3.2-3B'nin oluşturulması için, bir küçük açık ağırlıklı model oluşturmak için, bir kısıtlı kodlama kullanmayın.`Review(sentiment, confidence, evidence_span)`◊ 100 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条 条                                                                                                                                                                                                                                                                                                                                                                                                                                                             
2. **Medium。**Uzal JSON modunu özetler.
3. **Hard。**Zaten bir telefon numarası kullanılıyor.`\d{3}-\d{3}-\d{4}`)'in regex kısıtlı dekodörü.

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

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) Özetler 论文。
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) 快速'in CFG'ye dayalı kısıtlı kodlamaları¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成。
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) API referansı + getchas。
- [Instructor library](https://python.useinstructor.com/) 跨供应商的Pydantic + retries──
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) 6 kısıtlı kodlama çerçevesine karşı bir referans değerlendirme yapılması。
