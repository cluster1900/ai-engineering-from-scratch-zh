# 结构化输出与限制式解码

> 在生产环境中,大多数就是问题所在.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

一个分类器向LLM提示:返回一个 {正面,负面,中立}. 模型返回: 情绪是正面的  这项评论是绝对有利的,因为客户明确表示他们 ...──你的解析器 崩了──你的分类器的 F1 是 0.0──

生产的自由形式不是契约.

2026年有三层方案.

1. **Prompting。**好好请求.  返回只有JSON对象.  在边界模型上约80%有效,在更小的模型上更低.
2. **原生 structured output APIs。**开放AI`response_format`‧人类工具使用‧双子JSON模式──对支持的方案很可靠──绑定供应商──
3. **Constrained decoding。**在每个生成步骤修改登录,让模型*无法*输出无效代币――按构造保证100% 有效――适用于任何本地模型――

这课将为三个人建立直觉,并说明什么时候使用哪种.

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**在每个生成步骤中,LLM 会在完整的词汇库中生成一个逻辑向量.一个 *逻辑处理器* 位于模型和样本之间.它会根据目标语法中当前位置计算哪些符号有效,并把所有无效符号的逻辑设置为负无限.对剩余的逻辑做软max 之后,概率质量只会落在有效的后续内容上.

2026年实现:

- **Outlines。**将 JSON Schema 或 regex 编译为有限状态机.每个代币都能 O(1) 查询有效下一个代币.基于FSM,所以复制性方案需要平坦化.
- **XGrammar / llguidance。**无文本语法引擎──处理复制 JSON 方案──解码开销接近零──OpenAI在其2025年结构化输出中实现提到了指导性──
- **vLLM guided decoding。**通过轮、X文法或lm格式执行器 后端内置 `guided_json`,我知道.`guided_regex`,我知道.`guided_choice`,我知道.`guided_grammar`,我知道.
- **Instructor。**基于Pydantic的任意LLM包装──验证失败时重试──跨供应商,但不会修改记录,依赖重试+结构化输出意识提示──

### 反直觉的结果

限制式解码通常比无限制式代码更快.有两个原因.`{"name": "`这样的架子,每个字节都确定了)

### 价格高昂的陷

字段顺序很重要.`answer`放在一个地方`reasoning`模型会在思考之前承诺一个答案.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

方案 字段顺序是逻辑,不是格式.


```figure
constrained-decoder
```

## 构建

### 步骤1:从零开始做重复复复制的代

查看`code/main.py`实现了30行核心思想:

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

现在我们已经满足了语法的部分.`valid_tokens(state, tokenizer)`会计算哪些词汇代币可以推进FSM,同时不离开任何接受的道路.

### 步骤2:用轮处理JSON方案

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

零验证错误――永远如此――FSM 让无效输出不可达――

### 步骤3:用教师做提供商-无知 Pydantic

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

机器不同. 导师不接触逻辑. 它把方案格式化成提示,解析输出,并验证失败.

### 步骤 4:原生供应商API

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

服务器侧限制解码――对支持的方案,可靠性和概述相当――不需要管理本地模型――将把你锁定在该供应商上――

## 陷

- **Recursive schemas。**概要将将复 recursion 平坦到固定深度.
- **巨大 enums。**编译很慢,或会超时――改用回收器:先预测前候选人,再约束到这些候选人――
- **Grammar 过于严格。**强制`date: "YYYY-MM-DD"`模型无法为缺失日期输出`"unknown"`模型会通过编制一个日期来补偿.`null`或是守护者.
- **过早承诺。**见上述字段顺序陷──始终把推理放在前面──
- **没有 schema 的 vendor JSON mode。**纯JSON模式只保证有效JSON,不保证对*你的使用例*有效──始终提供完整的方案──

## 使用

2026 年的堆:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 交付

保存为`outputs/skill-structured-output-picker.md`其他:

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

1. **Easy。**在不使用限制式解码的情况下,即便生成一个小型的开放重量模型 (例如Llama-3.2-3B)`Review(sentiment, confidence, evidence_span)`△在100条评论上测量能解析为有效的JSON的比例──
2. **Medium。**用概述JSON模式在同一体上实验――比较合规率、延迟和语义精度――
3. **Hard。**从零实现一个用于电话号码(`\d{3}-\d{3}-\d{4}`在1000个样本上验证0个无效输出

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

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702)概述论文──
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) 快速基于CFG的限制解码──
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成──
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) API 参考+获取信息──
- [Instructor library](https://python.useinstructor.com/)跨供应商的Pydantic+重试――
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868)对6个限制式解码框架进行基准评估.
