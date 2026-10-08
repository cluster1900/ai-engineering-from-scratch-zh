# संरचित आउटपुट और प्रतिबंधित डिकोडिंग

> LLM को JSON का अनुरोध करें। ज्यादातर समय JSON प्राप्त होता है। उत्पादन वातावरण में, अधिकांश यही समस्या है।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

एक वर्गीकरणकर्ता ओर LLM 提示:Return one of {positive, negative, neutral}. 模型返回:The sentiment is positive  यह समीक्षा जबरदस्त रूप से अनुकूल है क्योंकि ग्राहक स्पष्ट रूप से कहता है कि वे ...──आपका पार्सर 崩了──आपके वर्गीकरण का F1 है 0.0──

उत्पादन के लिए स्वतंत्रता एक अनुबंध नहीं है। यह केवल एक सुझाव है।

2026 में तीन स्तरीय योजनाएं हैं।

1. **Prompting。**अच्छा अच्छा अनुरोध── केवल JSON ऑब्जेक्ट को लौटाएं. सीमा मॉडल में ऊपर 80% प्रभावी, छोटे मॉडल पर कम।
2. **原生 structured output APIs。**ओपनएआई `response_format`、Anthropic tool use、Gemini JSON mode──对支持的方案 很可靠──绑定供应商──
3. **Constrained decoding。**प्रत्येक उत्पादन चरण में लॉग्स में संशोधन करें, make मॉडल* unable* output ineffective tokens── बनावट के अनुसार 100% प्रभावी── किसी भी स्थानीय मॉडल हेतु लागू

इस कक्षा में तीनों के लिए सीधा ज्ञान का निर्माण किया जाएगा, और यह समझाया जाएगा कि किस प्रकार का उपयोग करना है।

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**प्रत्येक उत्पादन चरण में, LLM एक पूर्ण शब्दावली में होगा (लगभग 100k टोकन) पर एक लॉजिट वेक्टर उत्पन्न करेगा। एक *लॉजिट प्रोसेसर* मॉडल और नमूना के बीच स्थित है। यह लक्ष्य व्याकरण के बीच वर्तमान स्थान के आधार पर होगा। JSON योजना, रेजेक्स, संदर्भ मुक्त व्याकरण) गणना करता है कि कौन से टोकन प्रभावी हैं, और सभी अप्रभावी टोकन के लॉजिट को नकारात्मक अनंत के लिए निर्धारित करता है। शेष लॉजिट के लिए सॉफ्टमैक्स के बाद, संभावना की गुणवत्ता केवल प्रभावी बाद की सामग्री पर ही गिर जाएगी।

2026 वर्ष की उपलब्धि:

- **Outlines。**将 JSON Schema 或 regex 编译为有限状态机──每个代币都能 O(1) 查询 valid-next-token──基于FSM,所以递归式方案 需要平坦化──
- **XGrammar / llguidance。**संदर्भ मुक्त व्याकरण इंजनों── प्रसंस्करण पुनरावर्ती JSON योजना──解码开销接近零──OpenAI में अपने 2025 संरचित आउटपुट 实现中提到了 दिशा-निर्देश──
- **vLLM guided decoding。**通过概要、XGrammar या lm-format-enforcer 后端内置 `guided_json``guided_regex``guided_choice``guided_grammar`
- **Instructor。**基于Pydantic के किसी भी LLM wrapper──验证失败时重试──跨 प्रदाता, लेकिन लॉजिट्स में संशोधन नहीं करेगा, पुनः प्रयासों + संरचित-आउटपुट-जागरूक संकेतों पर निर्भर करेगा──

### विपरीत प्रत्यक्ष परिणाम

प्रतिबंधित डिकोडिंग आमतौर पर बिना प्रतिबंधित पीढ़ी की तुलना में *更快*──有两个原因──第一,它缩小了下一个代码 搜索空间──第二,聪明的实现会对强制代码 完全跳过代码生成(像`{"name": "`इस तरह के एक मंच, प्रत्येक बाइट तय कर दिया गया है)

### 代价高昂的陷

字段顺序 बहुत महत्वपूर्ण है---把 `answer`      `reasoning`पहले, मॉडल एक उत्तर का वादा करेगा पहले कि वह सोचता है।

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

स्कीमा 字段顺序 逻辑, नहीं स्वरूप 


```figure
constrained-decoder
```

## 构建

### 步骤 1: से零 से शुरू करें रीजेक्स-सीमित पीढ़ी

查看 `code/main.py`, जिसमें से एक स्वतंत्र एफएसएम 实现 ∙30 लाइनों में केंद्रीय विचार हैः

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

एफएसएम का कहना है कि अब तक हम व्याकरण के कुछ हिस्सों को पूरा कर चुके हैं।`valid_tokens(state, tokenizer)`会计算哪些词汇代币可以推进FSM,同时不离开任何接受路径──

### 步骤 2: Using Outlines  JSON योजना को संसाधित करना

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

零 सत्यापन त्रुटियाँ― सदा如此―FSM 让无效输出不可达──

### 步骤 3: प्रशिक्षक के साथ प्रदाता-अज्ञानी Pydantic

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

機不同──インストラクター 不接触 logits──它把方案格式化进快速,解析输出,并验证失败 时重试(默认 3 次)──适用于任何供应商──重试会增加延迟和成本──跨供应商可移植性是它的卖点──

### 步骤 4: मूल उत्पादक एपीआई

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

सर्वर-साइड प्रतिबंधित डिकोडिंग── समर्थित योजनाओं, विश्वसनीयता और रूपरेखा 相当──不需要管理本地模型──将把你锁定在该供应商上──

## 陷

- **Recursive schemas。**रेखाचित्रों को पुनरावृत्ति को स्थिर गहराई तक समतल करने की आवश्यकता होगी।
- **巨大 enums。**10,000 个选项的编译很慢,或会超时――改用回收器:先预测 top-k उम्मीदवार,再约束到这些候选人――
- **Grammar 过于严格。**强制 `date: "YYYY-MM-DD"`时,模型无法为缺失日期输出 `"unknown"`模型会通过编制一个日期来补偿――允许 `null`या प्रहरी
- **过早承诺。**见上段序陷──始终把推理放在前面──
- **没有 schema 的 vendor JSON mode。**純 JSON मोड 僅保证有效 JSON,不保证对*आपके उपयोग के मामले*有效──始终提供完整方案──

## उपयोग

2026 वर्ष का स्टैकः

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

## अभ्यास

1. **Easy。**में उपयोग नहीं किया गया प्रतिबंधित डिकोडिंग के मामले में, शीघ्र एक छोटे से खुला-वजन मॉडल (जैसे Llama-3.2-3B) उत्पन्न `Review(sentiment, confidence, evidence_span)`                                                                                                                                                                                                                                                              
2. **Medium。**उपयोग JSON मोड को रेखांकित करता है, एक ही शरीर में ऊपर प्रयोगों में।
3. **Hard。**से零实现 एक के लिए प्रयोग किया जाता है टेलीफोन नंबर (((`\d{3}-\d{3}-\d{4}`) का रेजेक्स-सीमित डिकोडर── में 1000 ऩे नमूने 上验证 0 ऩे निष्प्रभावी आउटपुट──

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

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) परिदृश्य 论文──
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) 快速 आधारित CFG का प्रतिबंधित डिकोडिंग──
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成──
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) एपीआई संदर्भ + गॉचस。
- [Instructor library](https://python.useinstructor.com/) 跨 प्रदाताओं के Pydantic + पुनः प्रयासों。
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) 6  सीमित डिकोडिंग फ्रेमवर्क पर बेंचमार्किंग की गई।
