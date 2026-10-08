# 对话状态跟踪

> 我想要一个北边的便宜餐厅......其实改成中等价位......再加上意大利语―― 三轮对话,三次状态更新――DST 会让插槽价值指令保持同步,这样预订才能正确执行――

**类型：**建立
**语言：**字符串
**先修要求：**阶段5·17 (聊天机器人),阶段5·20 (结构化输出)
**时间：**约75分钟

## 问题

在面向任务的对话系统中,用户目标将编码为一个组插槽值:`{cuisine: italian, area: north, price: moderate}`△用户每次发言都可能增加,修改或移除一个插槽.系统必须读取整个对话段,并正确输出当前状态.

只要有一个插槽出错,系统就可能订错餐厅,安排错航班,或扣错卡.

尽管到2026年,拥有法学学位,

- 对于合规敏感领域 (银行,医疗,航空预订) 需要确定的插槽值,而不是自由形式生成.
- 在调用API之前,仍然需要插槽分辨率.
- 实际上不是,让它成为周四.

现代管道:经典 DST 概念 + LLM提取器 +结构化输出防护子──

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**一个方案 定义域名 (餐厅,酒店,出租车) 以及它们的机场 (厨房,区域,价格,人) △每个机场可以为空,可以填入封闭集合中的一个值 (价格: {廉价,中等,昂贵}),也可以是自由形式值 (名称: "铜") △

**两种 DST 形式。**

- **Classification。**对每个 (slot, candidate_value) 对预测是/否.
- **Generation。**给定对话,将插槽值生成为自由文本.

**Metric。**合同目标准确性 (JGA)  *每一个*槽都正确的转折 所占比例──全对才算对──MultiWOZ 2.4排名榜 在 2026 年最高约83%──

**Architectures。**

1. **Rule-based (slot regex + keyword)。**对于狭领域是强基线.
2. **TripPy / BERT-DST。**使用BERT编码的基于副本的生成――LLM 之前的标准――
3. **LDST (LLaMA + LoRA)。**使用域名插槽提示的指示调整的LLM──在MultiWOZ 2.4上达到ChatGPT级质量──
4. **Ontology-free (2024–26)。**跳过方案;直接生成插槽名称和值──可处理开放域名──
5. **Prompt + structured output (2024–26)。**使用Pydantic方案 +限制解码的LLM──5 行代码,可用于生产──

### 经典失败模式

- **跨轮 Co-reference。**让我们留下第一种选择.
- **Overwrite vs append。**用户说 添加意大利菜. 你是替换厨房还是添加?
- **Implicit confirmations。**OK很酷 这是否表示接受系统提供的预订?
- **Correction。**实际上是7点. 必须更新时间,同时不清空其他场所.
- **对上一条系统话语的 Coreference。**是的,那个.


```figure
n5-slot-tracker
```

## 构建它

### 步骤1: 基于规则的插槽提取器

见`code/main.py`△Regex +同义词词典可以覆盖70%的狭领域:

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

在标准词表之外很脆弱.

### 步骤2:状态更新循环

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

三个不变量:

- 永远不要重置用户没有触碰的插槽.
- 显式否定(不管厨房) 必须清空──
- 用户纠正实际上...) 必须覆盖,而不是添加

### 步骤3: 使用结构化输出LLM 驱动DST

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

导师+Pydantic保证得到有效的状态对象──没有regex,没有方案不匹配,没有幻觉的插槽──

### 步骤4:JGA评估

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

校准:系统在多少个转换比例上能把所有的机场全部做对?对于MultiWOZ 2.4,2026年顶级系统为80-83%──你的内域系统在自己的狭窄词表上应该超过这个水平,否则LLM基础线会胜过你──

### 步骤 5:处理修正

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到修正时,覆盖最后更新的插槽,而不是增加.没有LLM帮助很难对应.现代模式:始终让LLM根据历史重新生成整个状态,而不是增量更新.

## 陷

- **Full-history regeneration cost。**让LLM 每一轮都重新生成状态,总代币 成本是O(n2);;限制历史或总结较早转──
- **Schema drift。**后添加新机场会破坏旧训练数据.
- **Case sensitivity。**意大利人 vs 意大利人 总是要正常化.
- **Implicit inheritance。**如果用户之前指定了4人,新不同时间请求不应该清空的人──始终传入完整历史──
- **Free-form vs closed-set。**名称、时间和地址需要自由形式的插槽;厨房和区域是关闭的.

## 使用它

2026 年:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

## 交付它

保存为`outputs/skill-dst-designer.md`其他:

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

1. **Easy。**在`code/main.py`中为3个插槽 (厨房,区域,价格) 构建基于规则的状态跟踪器.
2. **Medium。**在同一数据集上使用 导师 + 皮达尼克 + 一个小 LLM──比较 JGA──检查最困难的转──
3. **Hard。**同时实现两者并做路线:基于规则的初级,基于规则的发射时空隙少于2个,并且信心较低,使用LLM倒退.

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

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典的基准.
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970)面向 DST 的LLaMA + LoRA指示调整──
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877)基于复制的DST 主力方法──
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753)基于EM的无监督死亡.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 经典的DST结果──
