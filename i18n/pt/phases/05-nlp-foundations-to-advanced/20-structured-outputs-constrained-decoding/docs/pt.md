# Resultados estruturados e decodificação restrita

> Para LLM Peça JSON。 a maioria das vezes vai obter JSON。 em ambiente de produção, a maioria é o problema onde o decodificador restringido 会在采样前编辑逻辑,把 a maioria 变成总是。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## 问题

O sentimento é positivo  Esta revisão é esmagadoramente favorável porque o cliente afirma explicitamente que eles ...── seu parser 崩了──── seu classificador de F1 é 0.0──

A liberdade de forma de gerar não é um acordo. É apenas uma recomendação.

Em 2026 haverá três níveis de solução.

1. **Prompting。**Boa boa solicitação. Retorna apenas o objeto JSON. Em modelos de fronteira acima, cerca de 80% é eficaz, em modelos menores, em modelos menores.
2. **原生 structured output APIs。**OpenAI `response_format`、Uso de ferramentas antropológicas 、Modo JSON Gemini。对支持的方案 很可靠──绑定供应商──
3. **Constrained decoding。**Em cada fase de produção, permita que o modelo* não possa* emitir tokens inefficaces.

Esta aula vai ser para três pessoas para construir um intuito, e explicar quando é que deve ser usado.

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**Em cada fase de geração, LLM irá gerar um vetor de logite em um vocabulário completo (cerca de 100k tokens)  um *processador de logite*  está entre o modelo e o amostragem  ele irá basear-se na gramática-alvo (JSON Schema  regex  gramática livre de contexto)  calcular quais tokens são eficazes,  colocar os logitos de todos os tokens inefficazes  para o infinito negativo  para os logitos restantes  fazer softmax  depois, a probabilidade de qualidade só vai cair no conteúdo posterior válido 

Realização de 2026:

- **Outlines。**将 JSON Schema 或 regex 编译为有限状态机──每个代币都能 O(1) 查询 valid-next-token──基于FSM,所以递归方案需要平坦化──
- **XGrammar / llguidance。**Engenharia de gramática livre de contexto. Tratamento de esquema JSON recorrente.
- **vLLM guided decoding。**通過概要、XGrammar 或 lm-format-enforcer 后端内置 `guided_json`- Não.`guided_regex`- Não.`guided_choice`- Não.`guided_grammar`- Não.
- **Instructor。**Baseado em Pydantic's arbitrária LLM wrapper──验证失败时重试──跨供应商, mas não modificará logits, dependendo de retries + estruturados-output-consciente de prompts──

### Resultados de

A decodificação restrita geralmente é mais rápida do que a geração sem restrições. Há duas razões. Primeiro, ela reduz o next-token. Segundo, inteligência realizações para tokens forçados.`{"name": "`Assim, cada byte está definido.

### 代价高昂的陷

字段顺序 muito importante.`answer`- Não .`reasoning`Antes de pensar, o modelo vai prometer uma resposta. JSON é válido. A resposta é errada.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

Schema 字段顺序是逻辑, não é formato.


```figure
constrained-decoder
```

## Construção

### 步骤 1: desde zero começar a fazer regex-constrain generation

- Não .`code/main.py`, um dos principais pensamentos do FSM é:

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

FSM irá acompanhar até agora já satisfeito com algumas partes da gramática.`valid_tokens(state, tokenizer)`会计算哪些词汇代币可以推进FSM, ao mesmo tempo não deixar qualquer caminho de aceitação.

### 步骤 2: usar Outlines  processar JSON Schema

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

零 erros de validação― sempre assim―FSM 让无效输出不可达──

### 步骤 3: Use Instructor fazer fornecedor-agnóstico Pydantic

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

機機不同──Instructor 不接触 logits──它把方案格式化进快速,解析输出,并在验证失败时重试──默认 3 次)── é aplicável a qualquer fornecedor──重试会增加延迟和成本──跨供应商可移植性是它的卖点──

### 步骤 4: APIs de fornecedores originais

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

Descodificação limitada do lado do servidor.

## 陷

- **Recursive schemas。**Os contornos vão aplanar a recorrência até uma profundidade fixa.
- **巨大 enums。**Enum de 10.000 个选项 编译很慢,或会超时――改用:先预测 top-k candidates,再约束到这些候选人――
- **Grammar 过于严格。**强制 `date: "YYYY-MM-DD"`Regex 时, modelo não pode ser for missing日期 `"unknown"` O modelo irá através de um período de tempo para compensar  Permitir `null`Ou sentinela.
- **过早承诺。**见上一段顺序陷──始终把推理放在前面──
- **没有 schema 的 vendor JSON mode。**純 JSON mode 只保证有效 JSON,不保证对*你的使用例*有效──始终提供完整的方案──

## Utilização

Estaca de 2026:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 交付

保存为 `outputs/skill-structured-output-picker.md`- Não .

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

1. **Easy。**Em caso de não usar decodificação restrita, a Prompt um modelo pequeno de pesos abertos (por exemplo, Llama-3.2-3B) gerar `Review(sentiment, confidence, evidence_span)`◊ em 100 reviews 上测量能解析为有效 JSON 的比例──
2. **Medium。**Use descreve o modo JSON em um mesmo corpo.
3. **Hard。**Desde zero implementar um para usar telefones`\d{3}-\d{3}-\d{4}`O decodificador com restrição de regex.

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

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) Outro esboço 论文。
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) 快速的基于CFG的限制解码──
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成──
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) Referência à API + gotchas。
- [Instructor library](https://python.useinstructor.com/) 跨供应商的Pydantic + retries──
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) Para 6 estruturas de decodificação restritas  realizar uma análise de referência
