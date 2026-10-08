# Theo dõi tình trạng đối thoại

> 我想要一家北边的便宜餐厅......其实改成中等价位......再加上意大利── 三轮对话,三次状态更新──DST 会让插槽价值 dict 保持同步,这样预订才能正确执行──

**类型：**Xây dựng
**语言：**Python
**先修要求：**Giai đoạn 5 · 17 (Chatbots), Giai đoạn 5 · 20 (Tạo ra cấu trúc)
**时间：**约75分钟

## 问题

Trong hệ thống trò chuyện đối mặt với nhiệm vụ, mục tiêu người dùng sẽ được mã hóa thành một bộ giá trị khe cắm cho:`{cuisine: italian, area: north, price: moderate}` Mỗi vòng phát biểu của người dùng đều có thể gia tăng, sửa đổi hoặc di chuyển một khe cắm.

Chỉ cần một khe cắm xuất hiện, hệ thống就可能订错餐厅, sắp xếp错航班, hoặc扣错卡.

Tại sao ngay cả năm 2026, có LLM, nó vẫn quan trọng:

- Đối với các lĩnh vực nhạy cảm với quy định (Banking, Health, Air Transport) cần các giá trị khe cắm xác định, chứ không phải tự do hình thức tạo ra.
- Các đại lý sử dụng công cụ trong việc điều chỉnh API  trước khi vẫn cần giải pháp khe cắm.
- Nhiều lần sửa chữa hơn trông khó hơn:  thực sự không, làm cho nó thứ Năm.

现代 pipeline:经典 DST 概念 + máy khai thác LLM + dây bảo vệ sản xuất có cấu trúc。

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**Một quy trình định các tên miền (domain) (dài nhà hàng, khách sạn, taxi) và các khe cắm của chúng (cuisine, area, price, people)

**两种 DST 形式。**

- **Classification。**Đối với mỗi (slot, candidate_value) đối với dự đoán có/không.
- **Generation。**给定对话,将插槽值生成为自由文本.

**Metric。**Độ chính xác mục tiêu chung (JGA)  * mỗi khe đều đúng lượt 占比例──全对才算对──MultiWOZ 2.4 bảng xếp hạng trong năm 2026 cao nhất khoảng 83%──

**Architectures。**

1. **Rule-based (slot regex + keyword)。**Đối với lĩnh vực hẹp là cơ sở mạnh.
2. **TripPy / BERT-DST。**Sử dụng bản sao dựa trên thế hệ mã hóa BERT.
3. **LDST (LLaMA + LoRA)。**Sử dụng domain-slot prompting ∞ hướng dẫn-tuned LLM∞ ở MultiWOZ 2.4 上 đạt ChatGPT 级质量∞
4. **Ontology-free (2024–26)。**跳过 schema; trực tiếp tạo tên khe và giá trị.
5. **Prompt + structured output (2024–26)。**Sử dụng Pydantic scheme + decoding bị hạn chế của LLM──5 行代码, có thể sử dụng để sản xuất──

### 经典失败模式

- **跨轮 Co-reference。**Hãy chọn lựa thứ nhất.
- **Overwrite vs append。**Người dùng nói  thêm tiếng Ý. Bạn đang thay thế nhà bếp hay thêm?
- **Implicit confirmations。**OK cool                                                                                                                                                                                                                                                             
- **Correction。**Tất nhiên là 7 giờ tối. 必须更新时间,同时不清空其他 slots。
- **对上一条系统话语的 Coreference。**Đúng, cái đó.       đó?


```figure
n5-slot-tracker
```

##  xây dựng nó

### 步骤 1: 基于规则的插槽提取器

见 `code/main.py`❖ Regex + từ điển đồng nghĩa có thể bao gồm 70% trong lĩnh vực nhỏ:

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

Trong các tiêu chuẩn từ表 ngoài rất yếu đuối.

### 步骤 2: vòng cập nhật trạng thái

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

- 永远不要重置用户没有触碰的槽──
- 显式否定(không quan tâm đến nhà bếp) phải清空。
- Người dùng sửa chữa chính xác... thực sự... phải bao phủ chứ không phải thêm...

### 步骤 3: Sử dụng cấu trúc xuất LLM 驱动 DST

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

Instructor + Pydantic 保证得到有效的状态对象──没有 regex,没有方案不匹配,没有幻觉的插槽──

### Bước 4: Đánh giá JGA

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

校准: hệ thống trong tỷ lệ lượt lên có thể đưa tất cả các khe hoàn toàn để làm đối với? đối với MultiWOZ 2.4,2026 năm hệ thống cấp cao là 80-83%── hệ thống trong lĩnh vực của bạn trong bảng từ hạn của riêng bạn nên vượt qua mức này, nếu không LLM cơ bản sẽ thắng bạn──

### 步骤 5: xử lý sửa đổi

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到修正时,覆盖最后更新的槽,而不是追加. 没有LLM 帮助很难对应.

## 陷

- **Full-history regeneration cost。**让 LLM 每一轮都 tái tạo trạng thái,总 Token 成本是 O(n2)。 giới hạn lịch sử hoặc总结较早转──
- **Schema drift。**Việc sau đó thêm các khe mới sẽ phá hủy dữ liệu đào tạo cũ.
- **Case sensitivity。**Italy Italy Italy Tại khắp mọi nơi đều bình thường hóa
- **Implicit inheritance。**Nếu người dùng đã xác định trước đây để 4 người, yêu cầu khác nhau thời gian mới không nên làm sạch người.
- **Free-form vs closed-set。**名称、时间和地址 cần các khe tự do; nhà bếp và khu vực là đóng cửa.

## Sử dụng nó

2026 năm:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

## 交付 nó

保存为 `outputs/skill-dst-designer.md`- Có thể là:

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

1. **Easy。**Trong `code/main.py`Trung为3 个 slots (nấu ăn, khu vực, giá) xây dựng theo dõi nhà nước dựa trên quy tắc.
2. **Medium。**Trong cùng bộ dữ liệu 上使用 Instructor + Pydantic + 一个小型 LLM──比较 JGA──检查最困难的转──
3. **Hard。**Đồng thời thực hiện hai điều này và làm theo con đường: cơ bản dựa trên quy tắc, khi các khe cắm phát ra dựa trên quy tắc ít hơn 2 và sự tự tin thấp hơn khi sử dụng LLM fallback.

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

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典 tiêu chuẩn:
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) 面向 DST của LLaMA + LoRA hướng dẫn điều chỉnh。
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) DST dựa trên bản sao 主力方法。
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753) 基于 EM của TOD không giám sát.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 经典 DST kết quả。
