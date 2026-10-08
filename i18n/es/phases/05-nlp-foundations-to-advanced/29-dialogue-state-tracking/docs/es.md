# El seguimiento del estado del diálogo

> 我想要一家北边的便宜餐厅......其实改成中等价位......再加上意大利── 三轮对话,三次状态更新──DST 会让插槽-value dict 保持同步,这样预订才能正确执行──

**类型：**Construir
**语言：**Python
**先修要求：**Fase 5 · 17 (Chatbots), Fase 5 · 20 (Output estructurado)
**时间：**75 minutos

##  problemas

En el sistema de conversación de frente a tareas, los objetivos del usuario se codifican en un conjunto de valores de ranura para:`{cuisine: italian, area: north, price: moderate}` Cada ronda de palabras del usuario puede ser renovada, modificada o eliminada de una ranura.

Si hay un espacio fuera de error, el sistema es posible ordenar errores de comida, organizar errores de vuelo, o hacer errores de viaje.

Por qué incluso hasta el año 2026, con LLM, sigue siendo importante:

- En el ámbito de la regulación, los bancos, la salud y la aviación necesitan valores de ranura determinados, no de forma libre de generación.
- Los agentes de uso de herramientas todavía necesitan resolución de ranuras antes de que se pongan en práctica las APIs.
- Más que parecer más difícil: Realmente no, hazlo el jueves.

现代 pipeline: clásico DST 概念 + extractores LLM + barandillas de salida estructuradas。

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**Un esquema define dominios (restaurantes, hoteles, taxis) y sus espacios de juego (cucina, área, precio, gente)

**两种 DST 形式。**

- **Classification。**Para cada uno (flip, candidate_value) para el pronóstico sí/no.
- **Generation。**给定对话,将插槽值生成为自由文本.

**Metric。**Precisión de Objetivo Conjunto (JGA)  * cada uno de los slots están en el mismo rango de la posición.

**Architectures。**

1. **Rule-based (slot regex + keyword)。**Para el campo estrecho es fuerte la línea de base.
2. **TripPy / BERT-DST。**Utiliza la generación basada en copias de codificación BERT.
3. **LDST (LLaMA + LoRA)。**Utiliza la instrucción de la aplicación de dominio de la ranura de la LLM. en MultiWOZ 2.4 arriba alcanzar el ChatGPT 级质量.
4. **Ontology-free (2024–26)。**跳过 schema; directamente generar nombres de ranuras 和 valores──可处理开放域──
5. **Prompt + structured output (2024–26)。**Utiliza esquema pidantico + decodificación limitada de LLM──5 行代码,可用于生产──

### 经典失败模式 经典失败模式 经典失败模式 经典失败模式

- **跨轮 Co-reference。**Vamos a quedar con la primera opción. 需要解析是哪一个选项──
- **Overwrite vs append。**El usuario dice add italiano. ¿Estás reemplazando la cocina o es adicional?
- **Implicit confirmations。**¿Acaso esto significa que aceptó el pedido del sistema?
- **Correction。**De hecho, es hora de las 7 p.m.  必须更新时间,同时不清空其他 slots。
- **对上一条系统话语的 Coreference。**Sí, ese. ¿Qué es eso?


```figure
n5-slot-tracker
```

## Construirlo

### Paso 1: Extractor de ranura basado en reglas

¿ Qué ?`code/main.py`❖Diccionarios de regex + sinónimos pueden cubrir un 70% de los sectores más estrechos:

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

En la norma de la palabra fuera de la palabra es muy vulnerable.

### 步骤 2: ciclo de actualización del estado

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

Tres cambios:

- Nunca vuelvas a poner a los usuarios en un espacio sin contacto.
- 显式否定(no importa la cocina) tiene que estar limpio.
- Usuario rectificar actualmente...) debe cubrir, no añadir

### Paso 3: Utilizaciones estructuradas de LLM  DST

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

Instructor + Pydantic garantiza obtener un objeto de estado válido... sin regex, sin desajustes de esquemas, sin ranuras alucinadas...

### 步骤 4: Evaluación de las JGA

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

校准: sistema en cuánto porcentaje de vueltas puede hacer todas las ranuras? Para MultiWOZ 2.4,2026 años de sistema de nivel superior es de 80-83%―Su sistema en dominio en su propio cuadro de palabras estrecho debería superar este nivel, de lo contrario LLM base irá ganar sobre usted―

### Paso 5: tratamiento de la corrección

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到修正时,覆盖最后更新的槽,而不是追加. 没有LLM 帮助很难对对.

## 陷

- **Full-history regeneration cost。**让 LLM 每一轮都重生状态,总 Token 成本是 O(n2)。限制历史或总结较早转──
- **Schema drift。**Añadir nuevas ranuras destruirá el viejo entrenamiento de datos.
- **Case sensitivity。**Italiano Italiano Italiano Italiano   hasta donde todo debe normalizarse
- **Implicit inheritance。**Si el usuario previamente ha especificado  para 4 personas, nuevo diferente tiempo de solicitud no debería limpiar personas.
- **Free-form vs closed-set。**名称、时间和地址 necesitan espacios de forma libre; cocinas 和 áreas están cerradas.

## Usalo

2026 año de pila:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-dst-designer.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**En el`code/main.py`En el caso de los grupos de trabajo, el programa de trabajo de la empresa es el siguiente:
2. **Medium。**En el mismo conjunto de datos 上使用Instructor + Pydantic + 一个小型 LLM──比较JGA──检查最困难的转──
3. **Hard。**Con el mismo tiempo, se logran dos factores: las rutas primarias basadas en reglas, las rutas emitidas basadas en reglas, menos de 2 y menos de confianza en el uso de LLM.

## 关键术语: "El hombre es un hombre"

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

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典 referencia。
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) 面向 DST de LLaMA + LoRA de la instrucción de ajuste。
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) DST basado en copias 主力方法。
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753)   basado en EM de TOD sin supervisión.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 经典 resultados de DST。
