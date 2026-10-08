# Produits structurés et décoding restreint

> Pour le LLM, demandez JSON. La plupart des fois, vous obtenez JSON. Dans l'environnement de production, la plupart des fois, le décodage est un problème.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 17 (Chatbots), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

##  problématique

Un classifiant vers LLM 提示:Retourner un de {positif, négatif, neutre}. 模型返回: Le sentiment est positif  cette critique est extrêmement favorable parce que le client déclare explicitement qu'il ...──vont le parser 崩了──vont le classifiant de F1 ≠ 0.0──

La liberté de la forme de la production n'est pas un contrat.

En 2026, il y aura trois niveaux de solution.

1. **Prompting。**Bon bon demande. Retournez seulement l'objet JSON. Dans les modèles frontaliers, environ 80% sont efficaces, dans les modèles plus petits, plus bas.
2. **原生 structured output APIs。**OpenAI `response_format`、Utilisation d'outils anthropiques、Mode JSON Gémeaux―对支持的方案 很可靠―绑定供应商―
3. **Constrained decoding。**Dans chaque étape de production, modifier les logits, faire en sorte que le modèle ne puisse pas produire de jetons inefficaces.

Ce cours sera pour les trois personnes à construire un intuition, et expliquer quand utiliser quel type.

## 概念

![Constrained decoding masking invalid tokens at each step](../assets/constrained-decoding.svg)

**Constrained decoding 如何工作。**Dans chaque étape de production, LLM va générer un vecteur logite sur un vocabulaire complet (environ 100 000 jetons). Un *processeur logite* se trouve entre le modèle et le échantillon.

Réalisation de l'année 2026:

- **Outlines。**Pour chaque jeton, il est possible de modifier le code JSON ou de modifier le code JSON.
- **XGrammar / llguidance。**Les moteurs de grammaire sans contexte, le traitement de JSON récursif, le traitement de JSON, le traitement de JSON récursif, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de JSON, le traitement de la version de JSON, le développement de JSON, en direct de JSON. OpenAI, en 2025.
- **vLLM guided decoding。**通过概要、XGrammar ou lm-format-enforcer 后端内置 `guided_json`- Je suis là.`guided_regex`- Je suis là.`guided_choice`- Je suis là.`guided_grammar`Il y a une autre.
- **Instructor。**基于 Pydantic's arbitrary LLM wrapper──验证失败时重试──跨供应商,但不会修改 logits,依赖重试+structured-output-aware prompts──

### Réponse de l'auteur

Le décoding restreint est généralement plus rapide que la génération non restreinte. Il y a deux raisons. Premièrement, il réduit le prochain jeton.`{"name": "`Comme un échafaudage, chaque octet est déterminé.

### 代价高昂的陷

Le nombre de personnes concernées est important.`answer`- Je ne sais pas .`reasoning`Avant de réfléchir, le modèle va promettre une réponse. JSON est valide. La réponse est erronée.

```json
// BAD
{"answer": "yes", "reasoning": "because ..."}

// GOOD
{"reasoning": "... therefore ...", "answer": "yes"}
```

Le schéma 字段顺序是逻辑, pas le format──


```figure
constrained-decoder
```

## Construction

### 步骤 1: de zéro à zéro à génération régex-restricted

Regardez !`code/main.py`Il existe une idée centrale de la réalisation indépendante du SMF:

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

FSM suivra jusqu'à présent nous avons satisfait à quelles parties de la grammaire.`valid_tokens(state, tokenizer)`会计算哪些词汇代币可以推进FSM,同时不离开任何接受路

### 步骤 2: utiliser les contours  traiter le schéma JSON

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

零 erreurs de validation ― toujours ainsi ― FSM 让无效输出不可达──

### 步骤 3: faire un instructeur avec un fournisseur-agnostique Pydantic

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

機不同──Instructor 不接触 logits──它把 schema 格式化进快速,解析输出,并在验证失败时重试(默认 3 次)──适用于任何供应商──重试会增加延迟和成本──跨供应商 可移植性是它的卖点──

### 步骤 4: API du fournisseur d'origine

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

Décodage limité du côté du serveur. Pour les schémas, la fiabilité et les contours supportés.

## La trappe

- **Recursive schemas。**Les contours vont aplanir la récursion à une profondeur fixe.
- **巨大 enums。**Enum de 10 000 个选项 编译很慢,或会超时――改用:先预测 top-k candidates,再约束到这些候选人――
- **Grammar 过于严格。** imposer`date: "YYYY-MM-DD"`Regex 时, modèle ne peut pas être porté à défaut`"unknown"` Le modèle sera élaboré par un calendrier pour la compensation  permis `null`Ou un sentinel.
- **过早承诺。**见上段序陷──始终把推理放在前面──
- **没有 schema 的 vendor JSON mode。**純 JSON mode 僅保證有效 JSON,不保證对*你的使用例*有效──始终提供完整的方案──

## Utilisation

Stack de l'année 2026:

| Situation | Pick |
|-----------|------|
| OpenAI/Anthropic/Google model, simple schema | Native vendor structured output |
| Any provider, Pydantic workflow, can tolerate retries | Instructor |
| Local model, need 100% validity, flat schema | Outlines (FSM) |
| Local model, recursive schema | XGrammar or llguidance |
| Self-hosted inference server | vLLM guided decoding |
| Batch processing with retries acceptable | Instructor + cheapest model |

## 交付

保存为 `outputs/skill-structured-output-picker.md`- Le numéro de la liste:

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

1. **Easy。**Dans le cas où vous n'utilisez pas de décoding restreint, promptez un petit modèle à poids ouvert (par exemple Llama-3.2-3B) générer`Review(sentiment, confidence, evidence_span)`◊ dans 100 条 条 条 条 上测量能解析为有效 JSON 的比例──
2. **Medium。**Utilisez le mode JSON dans le même corpus.
3. **Hard。**De la réalisation d'un numéro de téléphone utilisé`\d{3}-\d{3}-\d{4}`) de régex-décoeur restreint.

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

- [Willard, Louf (2023). Efficient Guided Generation for LLMs](https://arxiv.org/abs/2307.09702) Des lignes directrices 论文。
- [XGrammar paper (2024)](https://arxiv.org/abs/2411.15100) Décodage restreint basé sur CFG de rapidité 
- [vLLM — Structured Outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html) 推理服务器集成。
- [OpenAI — Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs) référence à l'API + gotchas¬
- [Instructor library](https://python.useinstructor.com/) 跨供应商的Pydantic + retries──
- [JSONSchemaBench (2025)](https://arxiv.org/abs/2501.10868) Pour 6 cadres de décoding restreints  effectuer une analyse comparative 
