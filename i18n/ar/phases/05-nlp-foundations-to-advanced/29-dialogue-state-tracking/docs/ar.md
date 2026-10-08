# تحديد حالة الحوار

> 我想要一家北边的便宜餐厅......其实改成中等价位......再加上意大利── 三轮对话,三次状态更新──DST 会让插槽价值 dict 保持同步,这样预订才能正确执行──

**类型：**بناء
**语言：**بايثون
**先修要求：**المرحلة 5 · 17 (مواقع الدردشة) ، المرحلة 5 · 20 (المخرجات المهيكلة)
**时间：**حوالي 75 دقيقة

## 问题

في نظام حوار المهام المجهولة، يتم ترميز أهداف المستخدم إلى مجموعة من القيم المفتوحة ل:`{cuisine: italian, area: north, price: moderate}` كل دورة من المستخدمين من المحادثات يمكن أن يجدد أو يغير أو يزيل فتحة.

إذا كان هناك فتحة خارج الخطأ، نظام على الأرجح ترتيب الخطأ المطعم، ترتيب الخطأ الطيران، أو إيقاف الخطأ.

لماذا حتى في عام 2026، مع ماجستير في العلوم العليا، لا يزال مهم:

- على المجال الحساس للموافقة (مصارف طب  طيران) تحتاج إلى قيم فتحات محددة، وليس في شكل حري
- وكلاء استخدام الأدوات في تعديل APIs  قبل لا تزال بحاجة إلى حل فتحات ‬
- أكثر صعوبة من أن تبدو أكثر صعوبة.

现代 خط الأنابيب: Classic DST 概念 + مستخرجات LLM + حواجز إنتاج مهيكلة。

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**واحد من النظام المحدد المجالات ((مطعم ، فندق ، سيارة أجرة) فضلا عن فتحاتهم ((طعام ، منطقة ، سعر ، الناس) ・・・ كل فتحة يمكن أن تكون فارغة ، يمكن أن تملأ في مقفل مجموعة واحدة قيمة ((السعر: {رخيص ، متوسط ، مكلفة}) ، ويمكن أيضا أن يكون إعتمادها في النظام الحر ((اسم: "مخزن النحاس") ").

**两种 DST 形式。**

- **Classification。**على كل (سلاوت، مرشح_قيمة) على预测 نعم/لا.
- **Generation。**给定对话,将插槽值生成为自由文本.

**Metric。**دقة الهدف المشترك (JGA)  * كل * فتحة كانت صائبة في المديرات  % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %

**Architectures。**

1. **Rule-based (slot regex + keyword)。**بالنسبة للمجال الضيق هو القوة الأساسية.
2. **TripPy / BERT-DST。**استخدام برت تشفير نسخة القائمة على التوليد.
3. **LDST (LLaMA + LoRA)。**استخدام الدوائر المنزلية-حلقة استفسار ‬التعليمات المنسقة LLM‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
4. **Ontology-free (2024–26)。**跳过 schema; مباشرة توليد أسماء الفواكه 和 قيمها──可處理开放域──
5. **Prompt + structured output (2024–26)。**استخدام مخطط بيدانتيك + تشفير مقيد LLM──5 行代码,可用于生产──

### 经典失败模式

- **跨轮 Co-reference。**دعونا نبقى مع الخيار الأول.
- **Overwrite vs append。**المستخدم يقول إضافة الإيطالية. هل أنت تبدل المطبخ أو إضافة؟
- **Implicit confirmations。**هل هذا يعني قبول النظام المقدمة؟
- **Correction。**أحقاً، اجعل الساعة السابعة مساءً. 必须更新时间,同时不清空其他 slots。
- **对上一条系统话语的 Coreference。**نعم، هذا واحد.


```figure
n5-slot-tracker
```

## بناءها

### الخطوة 1: محرك استخراج فتحة بناء على القاعدة

见 `code/main.py` قواعد الإجراءات المختلفة يمكن تغطية 70% من المجالات المختلفة:

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

في حد ما تعتبر الكلمات غير قابلة للتأكيد.

### الخطوة 2: حلقة تحديث الحالة

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

ثلاثة غير متغيرات:

- لا تعيد تعيين المستخدم بدون لمس فتحة.
- لا يهم المطبخ يجب أن تكون واضحة
- يجب أن تغطي المستخدم بدلاً من إضافة

### الخطوة 3: استخدام المخرجات المهنية

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

لا يوجد أي إختلافات في النظام، لا توجد فتحات الهلوسة

### الخطوة 4: تقييم الجمعيات العامة

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

校准: النظام في عدد النسبة من المفاتيح 上能把所有 slots 全部做对? بالنسبة لمليتو ووز 2.4,2026 سنة النظام الرفيع 80-83%── نظامك في المجال في جدول الكلمات الخاصة بك الضيق يجب أن يتجاوز هذا المستوى، وإلا فإن خطة الجامعة الأساسية سوف تفوز بك──

### الخطوة 5: إصلاحات

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到校正时,覆盖最后更新的槽,而不是增加. 没有LLM 帮助很难对.

## فخ

- **Full-history regeneration cost。**让 LLM 每一轮都重生状态,总 Token 成本是 O(n2)。限制历史或总结较早转──
- **Schema drift。**بعد إضافة فتحات جديدة سوف تدمير البيانات التدريبية القديمة.
- **Case sensitivity。**الإيطاليين ضد الإيطاليين ضد الإيطاليين يجب أن يتعادلو
- **Implicit inheritance。**إذا كان المستخدم قد حدد قبل لـ 4 أشخاص، طلب مختلف الوقت الجديد لا ينبغي أن يُنظف الناس────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
- **Free-form vs closed-set。**名称、时间和地址 مطلوب فتحات شكل حر; المطبخات و المناطق مغلقة.

## استخدمها

2026 سنة:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

## 交付 it

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

## التدريب

1. **Easy。**في`code/main.py`中为 3 个 slots(طبخ، منطقة، سعر) بناء متابعة الدولة القائمة على القواعد.
2. **Medium。**في نفس مجموعة البيانات 上 استخدام مدرب + Pydantic + 一个小型 LLM──比较 JGA──检查最困难的转──
3. **Hard。**مع الوقت تحقيق المجموعتين: القاعدة الأساسية، عندما القاعدة الإصدارات الفوائد أقل من 2 个且信心较低 عند استخدام LLM fallback.

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

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典 مقياس
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) 面向 DST  LLaMA + LoRA إرشادات ضبط
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) النسخة القائمة على DST 主力方法。
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753)على أساس الـ "إم" غير المشرف عليها
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz)نتائج الـ DST الكلاسيكية
