# O acompanhamento do estado do diálogo

> 我想要一家北边的便宜餐厅......其实改成中等价位......再加上意大利── 三轮对话,三次状态更新──DST 会让槽-value dict 保持同步,这样预订才能正确执行──

**类型：**Construir
**语言：**Python
**先修要求：**Fase 5 · 17 (Chatbots), Fase 5 · 20 (Output estruturado)
**时间：**Cerca de 75 minutos

## 问题

No sistema de diálogo de missão, o objetivo do usuário é codificado como um conjunto de slots-valores para:`{cuisine: italian, area: north, price: moderate}` Cada rodada de mensagens do usuário pode ser alterada ou removida de um slot.

Só se um slot sair errado, o sistema é possível ordenar err errônico restaurante, organizar errônico voo, ou o erro de pagamento.

Porque mesmo em 2026, tendo LLM, ainda é importante:

- Para os domínios de con­sistência (bancos, saúde, aviação) necessitam de valores de slots determinados, e não de forma livre de gerar­se.
- Agentes de uso de ferramentas ainda precisam de resolução de slots antes de usar APIs.
- Muitas vezes, é mais difícil que parecer.

现代 pipeline: clásica DST 概念 + extractores LLM + barris de saída estruturadas。

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**Uma esquema define domínios (restaurantes, hotéis, táxis) e as suas vagas (cuisine, area, price, people) ⋅ cada vagas pode ser preenchido em um valor de conjunto fechado ⋅ preço: {barato, moderado, caro}), também pode ser livre forma de valor ⋅ nome: "The Copper Kettle") ⋅

**两种 DST 形式。**

- **Classification。**Para cada (slot, candidato_value) para pré-test sim/não.
- **Generation。**给定对话,将 slot values 生成为自由文本.

**Metric。**Precision de Objetivo Conjunto (JGA)  * cada um dos slots  são corretos em sua rota  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  %  % % % % % % % % % 

**Architectures。**

1. **Rule-based (slot regex + keyword)。**Para o domínio estreito é forte a linha de base.
2. **TripPy / BERT-DST。**Utilize BERT codificação de geração baseada em cópia.
3. **LDST (LLaMA + LoRA)。**Utilize domain-slot prompting ∞ instrução-tuned LLM∞ em MultiWOZ 2.4 上 ∞ ChatGPT 级质量∞
4. **Ontology-free (2024–26)。**跳过 schema; directamente generar nomes de slots 和 valores──可处理开放域──
5. **Prompt + structured output (2024–26)。**Utilize esquema pidantico + decodificação restrita de LLM──5 行代码,可用于生产──

### 经典失败模式

- **跨轮 Co-reference。**Vamos ficar com a primeira opção.
- **Overwrite vs append。**O usuário diz "add Italian". Você está substituindo a cozinha ou "add"?
- **Implicit confirmations。**Está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem, está bem?
- **Correction。**Na verdade, é às 19h. 必须更新时间,同时不清空其他 slots。
- **对上一条系统话语的 Coreference。**Sim, aquele.


```figure
n5-slot-tracker
```

## Construí-lo

### 步骤 1: 基于规则的插槽提取器

- Não .`code/main.py`❖ Regex + sinônimos dicionários pode cobrir 70% dos domínios de referência:

```python
CUISINE_SYNONYMS = {
    "italian": ["italian", "pasta", "pizza", "italy"],
    "chinese": ["chinese", "chow mein", "noodles"],
}


def extract_cuisine(utterance):
    for canonical, synonyms in CUISINE_SYNONYMS.items():
        if any(syn in utterance.lower() for syn in synonyms):
            return canonical
    return None
```

Em nota, o texto "Classificação de dados" é um texto que é muito vulnerável.

### 步骤 2: Loop de atualização de estado

```python
def update_state(state, utterance):
    new_state = dict(state)
    for slot, extractor in SLOT_EXTRACTORS.items():
        value = extractor(utterance)
        if value is not None:
            new_state[slot] = value
    for slot in NEGATION_CLEARS:
        if is_negated(utterance, slot):
            new_state[slot] = None
    return new_state
```

Três não mudam:

- Nunca mais reinstalar o usuário em um slot sem toque.
- Não importa a cozinha.
- Usador rectificar ((actualmente...) deve cobrir, e não adicionar

### 步骤 3: Utilize structured output LLM  DST

```python
from pydantic import BaseModel
from typing import Literal, Optional
import instructor

class RestaurantState(BaseModel):
    cuisine: Optional[Literal["italian", "chinese", "indian", "thai", "any"]] = None
    area: Optional[Literal["north", "south", "east", "west", "center"]] = None
    price: Optional[Literal["cheap", "moderate", "expensive"]] = None
    people: Optional[int] = None
    day: Optional[str] = None


def llm_dst(history, llm):
    prompt = f"""You track the slot values of a restaurant booking across turns.
Dialogue so far:
{render(history)}

Update the state based on the latest user turn. Output only the JSON state."""
    return llm(prompt, response_model=RestaurantState)
```

Instructor + Pydantic 保证得到有效的状态对象──没有regex,没有方案不匹配,没有幻觉的插槽──

### 步骤 4: Avaliação da JGA

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

校准: sistema em quantidade de rotação acima de todas as vagas para fazer? Para MultiWOZ 2.4,2026 ano sistema de topo é de 80-83%── seu sistema de domínio em sua própria lista de palavras estreita deve exceder esse nível, caso contrário LLM base linha irá vencer você──

### 步骤 5: tratamento de correções

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到修正时,覆盖最后更新的槽,而不是追加. 没有LLM 帮助很难对对.

## 陷

- **Full-history regeneration cost。**让 LLM 每一轮都重生状态,总 Token 成本是 O(n2)。限制历史或总结较早转──
- **Schema drift。**Facto adicionou novos slots vai destruir o antigo treinamento dados.
- **Case sensitivity。**O italiano vs. o italiano vs. o italiano...
- **Implicit inheritance。**Se o usuário previamente designado para 4 pessoas, o novo diferença de tempo não deve ser limpo para pessoas.
- **Free-form vs closed-set。**名称、时间和地址 necessitam de espaços de forma livre; cozinhas 和 áreas estão fechadas。 esquema 中要混合两者──

## Use-o

2026 ano estaca:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

## Entrega-o

保存为 `outputs/skill-dst-designer.md`- Não .

```markdown
---
name: dst-designer
description: 设计一个 dialogue state tracker —— schema、extractor、update policy、evaluation。
version: 1.0.0
phase: 5
lesson: 29
tags: [nlp, dialogue, task-oriented]
---

给定一个用例（domain、languages、vocab openness、compliance needs），输出：

1. Schema。Domain list、每个 domain 的 slots、每个 slot 的 open vs closed vocabulary。
2. Extractor。Rule-based / seq2seq / LLM-with-Pydantic。说明理由。
3. Update policy。Regenerate-whole-state / incremental；correction handling；negation handling。
4. Evaluation。在 held-out dialogue set 上的 Joint Goal Accuracy、slot-level precision/recall、最困难 slot 上的 confusion。
5. Confirmation flow。何时明确要求用户确认（destructive actions、low-confidence extractions）。

对于合规敏感 slots，如果没有 rule-based secondary check，拒绝 LLM-only DST。拒绝任何无法在用户 correction 时回滚 slot 的 DST。标记没有 version tags 的 schemas。
```

## 练习

1. **Easy。**Em`code/main.py`Na verdade, o que é um "comércio de produtos" é um sistema de distribuição de produtos e serviços de transporte.
2. **Medium。**Em um mesmo conjunto de dados 上使用Instructor + Pydantic + 一个小型 LLM──比较JGA──检查最困难的转──
3. **Hard。**Simultaneamente, realizou-se a dupla rota: primária baseada em regras, slots emitidos baseados em regras, menos de 2 e menos confiantes quando se usa o LLM fallback.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| DST | Dialogue state tracking | 在对话 turns 之间维护 slot-value dict。 |
| Slot | 用户意图单元 | Backend 需要的具名参数（cuisine, date）。 |
| Domain | 任务领域 | Restaurant, hotel, taxi —— slots 的集合。 |
| JGA | Joint Goal Accuracy | 每个 slot 都正确的 turns 所占比例。全对才算对。 |
| MultiWOZ | Benchmark | Multi-domain WOZ dataset；标准 DST evaluation。 |
| Ontology-free DST | 无 schema | 直接生成 slot names 和 values，没有固定列表。 |
| Correction | “Actually...” | 覆盖之前已填 slot 的 turn。 |

## 延伸阅读

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典 referência。
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) 面向 DST de LLaMA + LoRA de instrução de sintonia。
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) DST baseado em cópias 主力方法。
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753)  Baseado em EM não supervisionado TOD。
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 经典 DST resultados。
