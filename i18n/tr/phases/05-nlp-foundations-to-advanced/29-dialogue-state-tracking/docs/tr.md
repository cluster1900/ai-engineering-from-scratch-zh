# Diyalog Durum Takip

> I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city. I want a house on the northern side of the city.  I want to keep the city.  I want to keep the order so that the order is true.

**类型：**Yapım
**语言：**Python
**先修要求：**5 · 17 aşaması (Chatbots), 5 · 20 aşaması (Strukturlandırılmış çıkışlar)
**时间：**75 dakika kadar .

## 问题

Görevli bir iletişim sisteminde, kullanıcı hedefi bir dizi slot değeri olarak kodlanır:`{cuisine: italian, area: north, price: moderate}`◊ Kullanıcının her konuşması yeni bir yuva ekleyebilir, değiştirilebilir veya kaldırılabilir. Sistem tüm sohbet bölümünü okumalı ve mevcut durumunu doğru olarak çıkartmalıdır.

Sadece bir slot çıkmak, sistem üzerinde yanlış yemek düzenlemek, yanlış uçuş düzenlemek veya hata kartı.

2026'da bile, LLM'ler olsa bile, bu hala önemli:

- Bankalar, sağlık ve hava hizmetleri için düzenleme hassas alanlar için, serbest biçim üretmek yerine belirlenmiş slot değerleri gerekmektedir.
- Araç kullanımı ajanları API'leri kullanmadan önce hala slot çözümü gerektirir.
- Daha zor görünmekten daha çok düzeltme: aslında hayır, Perşembe yapın.

现代 boru hattı: klasik DST 概念 + LLM çıkarıcıları + yapılandırılmış çıkış koruyucuları。

## 概念

![DST: dialog history → slot-value state](../assets/dst.svg)

**任务结构。**Bir schema  define domains(restaurant, otel, taksi) ve onların slotları(mutfak, alan, fiyat, insanlar)。 her slotı, "Koper Kettle")。

**两种 DST 形式。**

- **Classification。**"Everybody" (slot, candidate_value) "Evet/Hayır" (evet/hayır) "Everybody" (slot, candidate_value) "Everybody" (evlenme) "Evet/hayır" (yes/no) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Everybody" (evlenme) "Ever) "Ever" (Ever) "Ever) "Ever" (Ever) "Ever" (Ever) "Ever) "Ever" (Ever) "E" (Ever) "E" (E) "E" (E) "E" (E) "E" (E) "E" (E) "E" (E) "E) "E" (E) "E" (E) "E" (E) "E" (E) "E" (E) "E"
- **Generation。**给定对话,将槽值生成为自由文本──适用于开口语句槽──是现代默认方式──

**Metric。**Ortak Hedef Kesinliği (JGA)  * Her bir* slot                                                                                                                                                                                                                                                      

**Architectures。**

1. **Rule-based (slot regex + keyword)。**Sıkıntısı için güçlü bir temel vardır.
2. **TripPy / BERT-DST。**BERT kodlamasını kullanmak için kopya tabanlı nesil.
3. **LDST (LLaMA + LoRA)。**Kullanın alan-slot teşvik ̆ ̆ talimat ayarlanmış LLM。
4. **Ontology-free (2024–26)。**跳过 schema; doğrudan oluşturmak slot isimleri 和 değerleri──可处理开放域──
5. **Prompt + structured output (2024–26)。**Pydantik şema kullan + kısıtlı çözme ∞ LLM∞5 行代码,可用于生产∞

### 经典失败模式

- **跨轮 Co-reference。**İlk seçeneği seçelim.
- **Overwrite vs append。**Kullanıcı, "İtalyanca ekle". "Seni mutfağı mı değiştirdim yoksa ekle mi?"
- **Implicit confirmations。**Bu sistemin verdiği siparişi kabul ettiğini gösteriyor mu?
- **Correction。**Aslında saat 7'de olmalısın. 必須更新時間,同时不清空其他 slots。
- **对上一条系统话语的 Coreference。**Evet, o. Hangi o?


```figure
n5-slot-tracker
```

## Yapın onu.

### 步骤 1: 规则的插槽提取器

Görüyorum .`code/main.py`❖Regex + eşya sözlükleri kısaltılmış alanlarda %70'i kapsayabilir:

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

Standart kelimelerden çok kırılganlıklı.

### 步骤 2: Durum güncelleme döngüsü

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

Üç değişmezlik:

- 永远不要重置用户没有触碰的槽──
- 显式否定(never mind the kitchen) 必須清空──
- Uzuor rectification (( aslında...) eklemek yerine örtmek zorunda.

### 3 adım: Kullanım yapılandırılmış çıkış LLM  DST

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

Eğitmen + Pydantic Güvence geçerli bir durum nesnesi elde edilmiştir.

### 4 adım: JGA değerlendirme

```python
def joint_goal_accuracy(predicted_states, gold_states):
    correct = sum(1 for p, g in zip(predicted_states, gold_states) if p == g)
    return correct / len(predicted_states)
```

校准: sistem in how many proportions of turns 上能把所有 slots 全部做对? MultiWOZ 2.4,2026 için 2026 yılının en üst düzey sistemi %80-83% ⋅

### Adım 5: İşlem düzeltmeleri

```python
CORRECTION_CUES = {"actually", "no wait", "on second thought", "change that to"}


def is_correction(utterance):
    return any(cue in utterance.lower() for cue in CORRECTION_CUES)
```

检测到修正时,覆盖最后更新的槽,而不是追加──没有LLM 帮助很难对对──现代模式:始终让LLM 根据历史重新生成整个状态,而不是增量更新 这会自然处理修正──

## 陷

- **Full-history regeneration cost。**让 LLM 每一轮都重生状态,总 Token 成本是 O(n2);;限制历史或总结较早转点;;
- **Schema drift。**Yeni yuvalar eklenir. Eski eğitim verilerini bozacak.
- **Case sensitivity。**İtalyan vs İtalyan vs İtalyan                                                                                                                                                                                                                                                           
- **Implicit inheritance。**Eğer kullanıcı önceden 4 kişi için  belirlemişse, yeni farklı zaman istekleri boş insanlar için  yapılmamalıdır.
- **Free-form vs closed-set。**名称、时间和地址 needs free-form slots; yemekhaneler 和 alanlar ise kapatılmıştır.

## Kullan

2026 yıl:

| Situation | Approach |
|-----------|----------|
| 窄领域（一个或两个 intents） | Rule-based + regex |
| 宽领域，有 labeled data | LDST（在 MultiWOZ-style data 上使用 LLaMA + LoRA） |
| 宽领域，无 labels，prod-ready | LLM + Instructor + Pydantic schema |
| Spoken / voice | ASR + normalizer + LLM-DST |
| Multi-domain booking flow | 带 per-domain Pydantic models 的 Schema-guided LLM |
| 合规敏感 | Rule-based primary，带确认流程的 LLM fallback |

## - Söyle.

保存为 `outputs/skill-dst-designer.md`- ...

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

1. **Easy。**- Evet .`code/main.py`Ortalama: 3 slot (mutfak, alan, fiyat) Kurallara dayalı devlet izleyicisini oluşturun.
2. **Medium。**Aynı veri kümesi içinde Ünlü Kullanıcı + Pydantic + Bir Küçük LLM── JGA── kontrol en zor dönüşleri──
3. **Hard。**Aynı zamanda iki yöntemi de gerçekleştirmek: kural tabanlı ilk, kural tabanlı ısıtıcı boşluklar 2'den az ve güven daha düşük olarak LLM geri dönüşü kullanırken.

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

- [Budzianowski et al. (2018). MultiWOZ — A Large-Scale Multi-Domain Wizard-of-Oz](https://arxiv.org/abs/1810.00278) 经典 referansı¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- [Feng et al. (2023). Towards LLM-driven Dialogue State Tracking (LDST)](https://arxiv.org/abs/2310.14970) DST'nin LLaMA + LoRA talimatları ayarlaması
- [Heck et al. (2020). TripPy — A Triple Copy Strategy for Value Independent Neural Dialog State Tracking](https://arxiv.org/abs/2005.02877) Kopyalı DST 主力方法。
- [King, Flanigan (2024). Unsupervised End-to-End Task-Oriented Dialogue with LLMs](https://arxiv.org/abs/2404.10753)  EM'ye dayalı denetimsiz ölümler.
- [MultiWOZ leaderboard](https://github.com/budzianowski/multiwoz) 经典 DST sonuçları。
