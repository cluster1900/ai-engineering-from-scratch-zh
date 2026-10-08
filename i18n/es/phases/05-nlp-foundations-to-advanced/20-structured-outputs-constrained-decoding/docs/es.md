# Resultados estructurados y decodificación limitada

> En el entorno de producción, la mayoría de los sistemas de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

##  problemas

Una clasificación hacia LLM 提示:Return one of {positive, negative, neutral}. 模型返回:The sentiment is positive  esta revisión es abrumadoramente favorable porque el cliente declara explícitamente que ...──Your parser 崩了──Your clasificador de F1 es 0.0──

La libertad de forma de generación no es un acuerdo.

En 2026 habrá tres niveles de soluciones.

1. **Prompting。**Buena buena solicitud.  Retorna sólo el objeto JSON. En los modelos fronterizos arriba aproximadamente el 80% es efectivo, en los modelos más pequeños más bajo.
2. **原生 structured output APIs。**OpenAI `response_format`、Uso de herramientas antropicas 、Modo JSON Gemini ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼   ∼ ∼     ∼     ∼                                                                                                                                                
3. **Constrained decoding。**En cada paso de generación de cambios logitos, hacer que el modelo* no pueda* salir tokens ineficaces.

Esta clase se dedicará a tres personas para construir la percepción, y explicar cuándo usar cual.

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**En cada paso de generación, LLM se genera en un vocabulario completo (unos 100k tokens) en un vector de logit. Un procesador de logit se encuentra entre el modelo y el muestreo.

Realización del año 2026:

- **Outlines。**将 JSON Schema 或 regex 编译为有限状态机──每个代币都能 O(1) 查询 valid-next-token──基于FSM,因此递归的代码需要平坦化──
- **XGrammar / llguidance。**Los motores de gramática sin contexto── procesar esquemas JSON recursivos──解码开销接近零──OpenAI en su producción estructurada 2025 实现中提到了 llguidance──
- **vLLM guided decoding。**通过概要、XGrammar o lm-format-enforcer 后端内置 `guided_json`¿Qué es esto?`guided_regex`¿Qué es esto?`guided_choice`¿Qué es esto?`guided_grammar`¿Qué es eso?
- **Instructor。**基于 Pydantic's arbitrario LLM wrapper──验证失败时重试──跨供应商, pero no modificará logits, dependiendo de retries + estructurados-output-consciente de las instrucciones──

### Resultados de la intuición

El decodificación restringida suele ser más rápida que la generación no restringida. Hay dos razones. Primero, se reduce a la siguiente generación de tokens.`{"name": "`Este tipo de andamios, cada byte ya está determinado)

### 代价高昂的陷

字段顺序 es muy importante.`answer` en su lugar `reasoning`Antes de pensar, el modelo se compromete a una respuesta. JSON es válido. La respuesta es errónea.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

El esquema 字段顺序是逻辑, no es formato.


```figure
constrained-decoder
```

## Construcción

### Paso 1: desde cero empezar a hacer regex generación limitada

¿ Qué pasa ?`code/main.py`, de los cuales hay una idea central de la realización independiente del FSM:

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

FSM se seguirá hasta ahora hemos satisfecho con algunas partes de la gramática.`valid_tokens(state, tokenizer)`会计算哪些词汇代币可以推进FSM,同时不离开任何接受路径──

### 步骤 2: usar esquemas  procesar esquema JSON

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

零 errores de validación― siempre así―FSM 让无效输出不可达―

### Paso 3: con el instructor hacer proveedor-agnóstico Pydantic

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

机械不同──Instructor 不接触 logits──它把 schema 格式化进快速,解析输出,并验证失败 时重试(默认 3 次)── se aplica a cualquier proveedor──重试会增加延迟和成本──跨供应商可移植性是它的卖点──

### 步骤 4: API de proveedor original

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

Descodación limitada del lado del servidor.

## 陷

- **Recursive schemas。**Los esquemas se aplanarán hasta la profundidad fija.
- **巨大 enums。**Enum de 10,000 个选项 编译很慢,或会超时――改用:先预测 top-k candidates,再约束到这些候选人――
- **Grammar 过于严格。**                       `date: "YYYY-MM-DD"`Regex 时, modelo no puede ser de falta de fecha de salida `"unknown"` El modelo se va a través de la elaboración de un día para la compensación.`null`O un centinela.
- **过早承诺。**见上段顺序陷──始终把推理 放在前面──
- **没有 schema 的 vendor JSON mode。**純 JSON mode 只保证有效 JSON,不保证对*你的使用例*有效──始终提供完整的方案──

## Uso

Estaca de 2026 años:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 交付

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-structured-output-picker.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**En caso de no usar decodificación limitada, se puede generar un pequeño modelo de peso abierto (por ejemplo, Llama-3.2-3B).`Review(sentiment, confidence, evidence_span)`◊ en 100 comentarios  上测量能解析为有效 JSON 的比例──
2. **Medium。**Us describe el modo JSON en el mismo corpus.
3. **Hard。**Desde el 0 realizando una para el número de teléfono`\d{3}-\d{3}-\d{4}`En 1000 muestras, el descifrador de regex restringido fue evaluado en un estudio de la investigación.

## 关键术语: "El hombre es un hombre"

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

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) Descripciones 论文。
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) 快速的基于CFG的限制解码──
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成──
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) Referencia de la API + gotchas。
- [Instructor library](https://python.useinstructor.com/) 跨供应商的Pydantic + retries──
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) Se realizó un análisis de referencia de 6 marcos de decodificación restringidos 
