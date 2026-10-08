# संवाद राज्य ट्रैकिंग

> 我想要一家北边的便宜餐厅......其实改成中等价位......再加上意大利── 三轮对话,三次状态更新──DST 会让插槽-值 dict 保持同步,这样预订才能正确执行──

**类型：**निर्माण
**语言：**पायथन
**先修要求：**चरण 5 · 17 (चैटबॉट), चरण 5 · 20 (संरचित आउटपुट)
**时间：** 75 मिनट

## 问题

मिशन के लिए बातचीत प्रणाली में, उपयोगकर्ता लक्ष्य को एक सेट स्लॉट-मूल्य के रूप में कोडित किया जाता हैः`{cuisine: italian, area: north, price: moderate}`◊ उपयोगकर्ता के प्रत्येक चरण के भाषण में एक स्लॉट को नया किया जा सकता है, संशोधित किया जा सकता है या हटाया जा सकता है।

यदि कोई स्लॉट है तो बाहर जा सकता है, सिस्टम पर एक गलत भोजन व्यवस्था, या एक गलत उड़ान की व्यवस्था करना।

क्यों 2026 तक LLM होने पर भी यह महत्वपूर्ण है:

- नियमों के प्रति संवेदनशील क्षेत्र में (बैंक, चिकित्सा, हवाई सेवा) को स्वतंत्र रूप से उत्पन्न होने के बजाय निश्चित स्लॉट मानों की आवश्यकता होती है।
- उपकरण-उपयोग एजेंटों को एपीआई को अनुकूलित करने से पहले स्लॉट संकल्प की आवश्यकता होती है।
- असली नहीं, इसे गुरुवार बनाओ

现代 पाइपलाइन: क्लासिक डीएसटी 概念 + एलएलएम एक्सट्रैक्टर + संरचित आउटपुट गार्डरेल

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**एक योजना  परिभाषित डोमेन (रेस्टोरेंट, होटल, टैक्सी) तथा उनके स्लॉट (खाना, क्षेत्र, मूल्य, लोग)  प्रत्येक स्लॉट में एक मूल्य हो सकता है, जो कि खाली हो सकता है, जो कि एक संग्रह में एक मूल्य हो सकता है  मूल्यः {सस्ते, मध्यम, महंगे}), या यह भी हो सकता है कि एक मुक्त स्वरूप मूल्य हो।

**两种 DST 形式。**

- **Classification。**प्रति प्रति (slot, candidate_value) प्रति预测 हाँ/नहीं।
- **Generation。**给定对话,将槽值生成为自由文本── खुले वक्सा वाले स्लॉट के लिए उपयुक्त──是现代默认方式──

**Metric。**संयुक्त लक्ष्य सटीकता (JGA)  * प्रत्येक* स्लॉट  सही मोड़                                                                                                                                                                                                                                                     

**Architectures。**

1. **Rule-based (slot regex + keyword)。**संकीर्ण क्षेत्र के लिए मजबूत आधार रेखा है।
2. **TripPy / BERT-DST。**प्रयोग BERT एन्कोडिंग का कॉपी-आधारित पीढ़ी──LLM 之前的标准──
3. **LDST (LLaMA + LoRA)。**उपयोग डोमेन-स्लॉट प्रलोभन का निर्देश-ट्यून LLM──在MultiWOZ 2.4上达到ChatGPT 级质量──
4. **Ontology-free (2024–26)。**跳过 schema; सीधे उत्पन्न स्लॉट नाम 和 मान──可处理开放域──
5. **Prompt + structured output (2024–26)。**प्रयोग पिदान्टिक स्कीमा + सीमित डिकोडिंग का LLM──5 行代码,可用于生产──

### 经典失败模式

- **跨轮 Co-reference。**हम पहले विकल्प के साथ रहने दो. 需要解析是哪一个选择──
- **Overwrite vs append。**उपयोगकर्ता कहते हैं  add Italian. आप बदल रहे हैं रसोई या अतिरिक्त?
- **Implicit confirmations。**OK शांत  क्या यह प्रणाली द्वारा प्रदान किए गए आरक्षण को स्वीकार करने का संकेत है?
- **Correction。**असली में इसे 7 बजे करना है.  必须更新时间,同时不清空其他 slots──
- **对上一条系统话语的 Coreference。**हाँ, यह एक.   कौन   यह?


```figure
n5-slot-tracker
```

##  इसे निर्माण

### 步骤 1: 规则 आधारित स्लॉट एक्सट्रैक्टर

见 `code/main.py`❖Regex + पर्यायवाची शब्दकोशों का 70% संकुचित क्षेत्र में आवरण कर सकते हैंः

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

                                                                                                                                                                                                                                                              

### 步骤 2: राज्य अद्यतन लूप

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

तीन                                                                                                                                                                                                                                                               

- 永远不要重置用户没有触碰的槽──
- 显式否定(निरपेक्ष रसोई) 必须清空──
- उपयोगकर्ता सुधार (अर्थात...) को अतिरिक्त नहीं, बल्कि कवर करना चाहिए।

### 步骤 3: उपयोग संरचनात्मक आउटपुट LLM 驱动 DST

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

प्रशिक्षक + पिडैंटिक सुरक्षा प्राप्त प्रभावी राज्य वस्तु,, कोई रेजेक्स, कोई योजना असंगतता, कोई पगडंडी स्लॉट,,

### 步骤 4: JGA मूल्यांकन

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

校准: सिस्टम में कितने अनुपात में मोड़ ऊपर सभी स्लॉट को कर सकते हैं?

### 步骤 5:处理修正

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到修正时,覆盖最后更新的槽,而不是追加──没有LLM 帮助很难对对──现代模式:始终让LLM 根据历史重新生成整个状态,而不是增量更新 这会自然处理修正──

## 陷

- **Full-history regeneration cost。**让 LLM 每一轮都重生状态,总 Token 成本是 O(n2) ・限制历史 或总结较早转──
- **Schema drift。**नई स्लॉट जोड़ना पुराने प्रशिक्षण डेटा को नष्ट कर देगा।
- **Case sensitivity。** इतालवी  इतालवी  इतालवी  इतालवी                                                                                                                                                                                                                                                     
- **Implicit inheritance。**यदि उपयोगकर्ता पहले 4 लोगों के लिए 指定 किया है, तो नया अलग समय अनुरोध नहीं चाहिए
- **Free-form vs closed-set。**名称、时间和地址 आवश्यक मुक्त-रूप स्लॉट; रसोई और क्षेत्र बंद हैं── योजनाएं मध्य में मिश्रित हैं──

## इसका उपयोग करें

2026 साल स्टैक:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

## 交付 यह

保存为 `outputs/skill-dst-designer.md`:

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

## अभ्यास

1. **Easy。**`code/main.py`中为 3 个 slots(खाद्यपान, क्षेत्र, मूल्य) नियम आधारित राज्य ट्रैकर का निर्माण करें。在 10 个手写对话 上测试──测量 JGA──
2. **Medium。**एक ही डेटासेट में ऊपर उपयोग इंस्ट्रक्टर + पायदानटिक + एक छोटा LLM── तुलना करें JGA── जांच सबसे मुश्किल के मोड़──
3. **Hard。**साथ ही दोनों को लागू करने का मार्गः नियम आधारित प्राथमिक, नियम आधारित िलए स्लॉट कम 2 个 और कम आत्मविश्वास िलएएम वापसी के दौरान कम िलएएम वापसी िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम िलएएम

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

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典 बेंचमार्क──
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) 面向 DST का LLaMA + LoRA निर्देश ट्यूनिंग。
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) कॉपी आधारित डीएसटी 主力方法。
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753)   EM के आधार पर अनियंत्रित TOD──
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 经典 DST परिणामों。
