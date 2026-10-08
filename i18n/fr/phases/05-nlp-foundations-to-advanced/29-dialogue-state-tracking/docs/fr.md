# Suivi de l'état du dialogue

> 我想要一家北边的便宜餐厅......其实改成中等价位......再加上意大利── 三轮对话,三次状态更新──DST 会让插槽-value dict 保持同步,这样预订才能正确执行──

**类型：**Construire
**语言：**Python
**先修要求：**La phase 5 · 17 (Chatbots), la phase 5 · 20 (sorties structurées)
**时间：**À environ 75 minutes.

##  problématique

Dans le système de dialogue face à des tâches, les objectifs utilisateur seront codés en un ensemble de valeur de fente pour:`{cuisine: italian, area: north, price: moderate}` Chaque session d'interaction de l'utilisateur peut être modifiée ou supprimée.

Si un slot est en panne, le système peut commander un mauvais restaurant, organiser un mauvais vol, ou un mauvais ticket.

Pourquoi même en 2026, avec des LLM, c'est toujours important:

- Les taux de change sont les plus élevés dans les secteurs de la santé et de la santé.
- Les agents d'utilisation des outils ont encore besoin de résolution de fentes avant de pouvoir utiliser les API.
- Il est plus difficile de le faire que de le faire jeudi.

现代 pipeline: classique DST 概念 + extracteurs LLM + barrières de sortie structurées。

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**Un schéma définit les domaines (restaurant, hôtel, taxi) ainsi que leurs emplacements (cuisine, zone, prix, personnes)

**两种 DST 形式。**

- **Classification。**Pour chaque (slot, candidate_value) pour pré测 oui/non.
- **Generation。**给定对话,将插槽值生成为自由文本.

**Metric。**Accurace de l'objectif commun (JGA)  * chaque * slot sont correctement tournés Sous-proportion proportion proportionnelle── total contre talent contre──MultiWOZ 2.4 leaderboard dans le maximum de 2026 ans environ 83%──

**Architectures。**

1. **Rule-based (slot regex + keyword)。**Pour les domaines restreints, la base est forte.
2. **TripPy / BERT-DST。**Utilisation de la génération basée sur la copie du codage BERT.
3. **LDST (LLaMA + LoRA)。**Utiliser des commandes de domaine-slot ∞ LLM à l'instruction.
4. **Ontology-free (2024–26)。**跳过 schema; directement générer des noms de fentes 和 valeurs──可处理开放域──
5. **Prompt + structured output (2024–26)。**Utilisation de schéma pydantique + décoding restreint de LLM──5 行代码,可用于生产──

### 经典失败模式

- **跨轮 Co-reference。**Restez avec la première option. 需要解析是哪一个选项──
- **Overwrite vs append。**Les utilisateurs disent "add italien". Vous êtes en train de remplacer la cuisine ou encore "add"?
- **Implicit confirmations。**C'est acceptable pour le système ?
- **Correction。**En fait, il est 19h. 必须更新时间,同时不清空其他 slots。
- **对上一条系统话语的 Coreference。**Oui, celui-là.


```figure
n5-slot-tracker
```

## - Je le construis.

### 步骤 1: extracteur de fente basé sur la règle

Je vous en prie .`code/main.py`◊Regex + synonymes dictionnaires peuvent couvrir 70% des domaines restreints:

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

Dans les conditions de la définition, les confirmations de slots sont très fragiles.

### 步骤 2: boucle de mise à jour de l' état

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

Il y a trois changements:

- Ne jamais remettre l'utilisateur sans toucher de la fente.
- Il faut le nettoyer.
- Utilisateur rectifié actuellement...) doit être couvert, et non ajouté

### Étape 3: Utilisation structurée de l'extrait de LLM  DST

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

L'instructeur + Pydantic garantit un objet d'état valide. Il n'y a pas de régex, pas de désaccords de schéma, pas de fentes hallucinées.

### étape 4: évaluation des AGJ

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

Pour le système de haut niveau de MultiWOZ 2.4,2026 ans, il est de 80 à 83%. Votre système de domaine dans votre propre tableau de mots restreint devrait dépasser ce niveau, sinon la ligne de base de LLM vous vaincra.

### 步骤 5: traitement des modifications

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到修正时,覆盖最后更新的槽,而不是追加──没有LLM 帮助很难对对──现代模式:始终让LLM 根据历史重新生成整个状态,而不是增量更新 这会自然处理修正──

## La trappe

- **Full-history regeneration cost。**让 LLM 每一轮都重生状态,总 Token 成本是 O(n2)。限制历史或总结较早转──
- **Schema drift。**Fait après ajouter de nouvelles machines à sous, détruira les données de l'ancienne formation.
- **Case sensitivity。**L'Italie contre l'Italie contre l'Italie est en train de se normaliser.
- **Implicit inheritance。**Si l'utilisateur a déjà désigné pour 4 personnes, la nouvelle différence de temps demande ne devrait pas être nette .
- **Free-form vs closed-set。**名称、时间和地址 nécessitent des espaces de forme libre; cuisines 和 zones sont fermées。schéma 中要混合两者──

## Utilisez-le

2026 année de stack:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

## Je le livre.

保存为 `outputs/skill-dst-designer.md`- Le numéro de la liste:

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

1. **Easy。**Dans le`code/main.py`Le nombre de places disponibles est de 3 places (cuisine, zone, prix)
2. **Medium。**Dans le même ensemble de données, il est possible de faire une comparaison entre les deux types de tests.
3. **Hard。**En même temps, les deux sont réalisés et suivent la même voie: les espaces de mise en œuvre primaires basés sur les règles, les espaces de mise en œuvre basés sur les règles, moins de 2 et moins de confiance en utilisant le LLM.

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

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典 référence。
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) 面向 DST de l'écoute des instructions LLaMA + LoRA。
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) DST basé sur la copie 主力方法。
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753)  sur la base de la mort non supervisée par EM.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 经典 résultats du DST。
