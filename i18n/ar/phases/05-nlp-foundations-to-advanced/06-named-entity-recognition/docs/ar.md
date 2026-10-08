# الاعتراف بالكيان المسمى

> أنطلق اسمك. يبدو الأمر بسيطاً حتى تلتقي بالظروف المظلمة.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 问题

"أبل دعمت جوجل على صفقة بحثها عن iPhone في الولايات المتحدة". 五个实体:Apple (ORG) 、Google (ORG) 、iPhone (PRODUCT) 、بحث صفقة(也许算) 、US (GPE) ✿

NER هو كل مادة مهيكلية استخراج خط الأنابيب  القوة الرئيسية للطابق السفلي 简历解析、合规日志扫描、病历匿名化、搜索查询理解、聊天机 回复的 grounding、法律合同抽取──你几乎看不见它; لكنك دائما تعتمد عليها──

هذا الدرس يتبع الطريق الكلاسيكي (الذي يعتمد على القواعد) (هـ HMM、CRF) و يتوجه إلى الطريق الحديث (BiLSTM-CRF) ، ثم المحولات)

## 概念

**BIO tagging**(أو بيلو) تُعدّم الفضائل إلى سلسلة علامات`B-TYPE`(实体开始)`I-TYPE`(في الواقع) أو`O`(أيّ جسم خارج)

```
Apple    B-ORG
sued     O
Google   B-ORG
over     O
its      O
iPhone   B-PRODUCT
search   O
deal     O
in       O
the      O
US       B-GPE
.        O
```

العديد من الادلة`New B-GPE`.`York I-GPE`.`City I-GPE` فهم نموذج البيولوجي يمكن استخراج أي فترة

架构演进:

- **Rule-based.**Regex + gazetteer 查找──对已知实体精度 高,对新实体覆盖 为零──
- **HMM.**نموذج ماركوف المخفي. احتمال إصدار الرمز المحدد للشخصيات، وكذلك احتمال انتقال الشخصيات إلى الشخصيات.
- **CRF.**الحقل العشوائي المشروط‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬
- **BiLSTM-CRF.**استخدام خصائص عصبية بديلة عن خصائص اليد.
- **Transformer-based.**استخدم رأس تصنيف الرمز 微调 BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

## بناءها

### الخطوة 1: مساعدي التسمية البيولوجية

```python
def spans_to_bio(tokens, spans):
    labels = ["O"] * len(tokens)
    for start, end, label in spans:
        labels[start] = f"B-{label}"
        for i in range(start + 1, end):
            labels[i] = f"I-{label}"
    return labels


def bio_to_spans(tokens, labels):
    spans = []
    current = None
    for i, label in enumerate(labels):
        if label.startswith("B-"):
            if current:
                spans.append(current)
            current = (i, i + 1, label[2:])
        elif label.startswith("I-") and current and current[2] == label[2:]:
            current = (current[0], i + 1, current[2])
        else:
            if current:
                spans.append(current)
                current = None
    if current:
        spans.append(current)
    return spans
```

```python
>>> tokens = ["Apple", "sued", "Google", "over", "iPhone", "sales", "."]
>>> labels = ["B-ORG", "O", "B-ORG", "O", "B-PRODUCT", "O", "O"]
>>> bio_to_spans(tokens, labels)
[(0, 1, 'ORG'), (2, 3, 'ORG'), (4, 5, 'PRODUCT')]
```

### 步骤 2:الميزات المصنوعة يدوياً

بالنسبة للطبيعية غير العصبية، خصائص هي الأساس.

```python
def token_features(token, prev_token, next_token):
    return {
        "lower": token.lower(),
        "is_upper": token.isupper(),
        "is_title": token.istitle(),
        "has_digit": any(c.isdigit() for c in token),
        "suffix_3": token[-3:].lower(),
        "shape": word_shape(token),
        "prev_lower": prev_token.lower() if prev_token else "<BOS>",
        "next_lower": next_token.lower() if next_token else "<EOS>",
    }


def word_shape(word):
    out = []
    for c in word:
        if c.isupper():
            out.append("X")
        elif c.islower():
            out.append("x")
        elif c.isdigit():
            out.append("d")
        else:
            out.append(c)
    return "".join(out)
```

`word_shape("iPhone")`عودتي`xXxxxx`.`word_shape("USA-2024")`عودتي`XXX-dddd`◊ نمط الكتابة على المميزات هي علامات عالية

### الخطوة الثالثة: خطة أساسية بسيطة + قاموس

```python
ORG_GAZETTEER = {"Apple", "Google", "Microsoft", "OpenAI", "Meta", "Amazon", "Netflix"}
GPE_GAZETTEER = {"US", "USA", "UK", "India", "Germany", "France"}
PRODUCT_GAZETTEER = {"iPhone", "Android", "Windows", "ChatGPT", "Claude"}


def rule_based_ner(tokens):
    labels = []
    for token in tokens:
        if token in ORG_GAZETTEER:
            labels.append("B-ORG")
        elif token in GPE_GAZETTEER:
            labels.append("B-GPE")
        elif token in PRODUCT_GAZETTEER:
            labels.append("B-PRODUCT")
        else:
            labels.append("O")
    return labels
```

生产级报纸 有数百万条从维基百科 和 DBpedia 抓取的条目──覆盖 很好──歧义(公司果 VS 水果果) 很糟糕──这就是统计模型胜出的原因──

### الخطوة 4: CRF الخطوة ((خطوة، ليست كاملة)

إذا لم يكن هناك أساس للاحتماليات، فإن كتابة كاملة من صفر إلى 50 صفات لا يمكن أن تجلب الكثير من التشغيلات.`sklearn-crfsuite`:

```python
import sklearn_crfsuite

def to_features(tokens):
    out = []
    for i, tok in enumerate(tokens):
        prev = tokens[i - 1] if i > 0 else ""
        nxt = tokens[i + 1] if i + 1 < len(tokens) else ""
        out.append({
            "word.lower()": tok.lower(),
            "word.isupper()": tok.isupper(),
            "word.istitle()": tok.istitle(),
            "word.isdigit()": tok.isdigit(),
            "word.suffix3": tok[-3:].lower(),
            "word.shape": word_shape(tok),
            "prev.word.lower()": prev.lower(),
            "next.word.lower()": nxt.lower(),
            "BOS": i == 0,
            "EOS": i == len(tokens) - 1,
        })
    return out


crf = sklearn_crfsuite.CRF(algorithm="lbfgs", c1=0.1, c2=0.1, max_iterations=100, all_possible_transitions=True)
X_train = [to_features(s) for s in sentences_tokenized]
crf.fit(X_train, bio_labels_train)
```

`c1`和 `c2`هو L1 و L2 التنظيم`all_possible_transitions=True`让模型学习非法序列 (على سبيل المثال)`O`في الخلف`I-ORG`) احتمالات منخفضة، وهذا هو CRF في حالة عدم الحاجة إلى كتابة يدك حزم إضطرار بييو واحد الوسائل الجنسية.

### الخطوة 5: BiLSTM-CRF  زيادة ماذا

خصائص تحول إلى تعلم الحصول على. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

```python
import torch
import torch.nn as nn


class BiLSTM_CRF_Head(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_labels):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, n_labels)

    def forward(self, token_ids):
        e = self.embed(token_ids)
        h, _ = self.lstm(e)
        emissions = self.fc(h)
        return emissions
```

CRF 层使用 `torchcrf.CRF`(تثبيت الجهاز اليدوي) ، والتحسين هو قياسية، ولكن ما لم يكن لديك عدة آلاف من العلامات، وإلا فإن ارتفاع الارتفاع عادة ما يكون أقل من المتوقع.

## استخدمها

المجال المفتوحة مع درجة الإنتاج NER

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("Apple sued Google over its iPhone search deal in the US.")
for ent in doc.ents:
    print(f"{ent.text:20s} {ent.label_}")
```

```
Apple                ORG
Google               ORG
iPhone               ORG
US                   GPE
```

انتباه`iPhone`تم تعيينها`ORG`بدلاً من ذلك`PRODUCT`النموذج الصغير من الفضاء على تغطية الكيان المنتج 较弱──النموذج الكبير`en_core_web_lg`(表现更好──صيغة المحول)`en_core_web_trf`) سوف يكون أفضل.

" " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " "

```python
from transformers import pipeline

ner = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
print(ner("Apple sued Google over its iPhone in the US."))
```

```
[{'entity_group': 'ORG', 'word': 'Apple', ...},
 {'entity_group': 'ORG', 'word': 'Google', ...},
 {'entity_group': 'MISC', 'word': 'iPhone', ...},
 {'entity_group': 'LOC', 'word': 'US', ...}]
```

`aggregation_strategy="simple"`سوف تتمكن من إضافة علامات B-X ∞ X إلى فترة واحدة. بدونها، ستحصل على علامات على مستوى علامات، و يجب أن تكون نفسك مشتركة.

### نير القائمة على القانون العلمي (NER)

الآن في العديد من المجالات أصبحت نطاقات الامتحانات المعدلة للصفر والقليل من الامتحانات القانونية في نير قادرة على المنافسة على النموذج المعدل بشكل جيد.

- **Zero-shot prompting.**给LLM 一组实体类型和一个示例方案――要求输出 JSON――开箱可用; 在新领域准确率中等――
- **ZeroTuneBio-style prompting.**将任务分解为候选提取 → 意思解释 → 判断 → 重审.多阶段提示(不是一枪)能显著提升生物医学 NER 的准确率──同样模式也适用于法律、金融和科学领域──
- **Dynamic prompting with RAG.**في كل مكالمة استنتاجية، من مجموعة صغيرة من العلامات التجارية، فحص أكثر نموذج العلامات التجارية مماثلة؛ متحرك بناء عرضة القليل من الأطلاق. في معدل 2026، هذا يمكن أن يجعل GPT-4 الطبية الحيوية NER F1 مقارنة بتحقيق التحفيز ثابتة 11-12٪.
- **Per-entity-type decomposition.**بالنسبة إلى المستندات الطويلة، فإن الاستخدام الواحد في نفس الوقت لجميع أنواع الكائنات سوف يزداد طولها ويقلل من التذكر.

截至 2026 年的生产建议: قبل جمع بيانات التدريب، قم أولاً بإعداد خطة أساسية لمدرسة العلوم الجامعية الصفرة.

### 经典 NER 仍然胜出的地方

حتى لو كان هناك بالفعل LLM، فإن NER الكلاسيكية في الحالات التالية لا تزال تنتصر:

- ميزانية التأخير أقل من 50ms
- لديك آلاف النماذج المُعروضة، وتحتاج إلى 98٪+ F1
-  المجال المتميز للاستقرار في علم التنمية، والتي تم تدريبها على CRF أو BiLSTM 迁移效果良好
- 监管约束要求 on-prem、非生成式模型──

### سوف يفشل في أي مكان

- **Domain shift.**في كونيل على تدريب NER يستخدم على عقد القانون، أداء أكثر من الجريدة أيضا.
- **Nested entities.**"بنك أوف أمريكا برج" 同时是 ORG 和 FASILITY──标准BIO 无法表示重叠跨度──你需要嵌套的NER(多通行或跨度型号)──
- **Long entities.**"شركة تأمين الودائع الاتحادية في الولايات المتحدة".`aggregation_strategy`أو بعد معالجة
- **Sparse types.**医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE。通用模型完全不了解这些──Scispacy 和 BioBERT 是此的起点──

## 交付 it

保存为 `outputs/skill-ner-picker.md`:

```markdown
---
name: ner-picker
description: 为给定抽取任务选择合适的 NER 方法。
version: 1.0.0
phase: 5
lesson: 06
tags: [nlp, ner, extraction]
---

给定一个任务描述（领域、标签集、语言、延迟、数据量），输出：

1. 方法。Rule-based + gazetteer、CRF、BiLSTM-CRF，或 transformer fine-tune。
2. 起始模型。命名它（spaCy model ID、Hugging Face checkpoint ID，或 "custom, trained from scratch"）。
3. 标注策略。BIO、BILOU，或 span-based。用一句话说明理由。
4. 评估。使用 `seqeval`。始终报告 entity-level F1（不是 token-level）。

除非用户已经有 pretrained domain model，否则拒绝建议在少于 500 个标注样例上 fine-tuning transformer。如果存在 nested entities，标记为需要 span-based 或 multi-pass models。如果用户提到 "production scale"，且标签与 CoNLL-2003 相同，则要求进行 gazetteer audit。
```

## التدريب

1. **Easy.** تحقيق `bio_to_spans`(`spans_to_bio`(أعكس التشغيل) ، و 10 个句子上验证回回回一致性.
2. **Medium.**في مجموعة بيانات NER الإنجليزية في CoNLL-2003 上訓練上的 sklearn-crfsuite CRF──使用 `seqeval` 报告 per entity F1──典型结果:~84 F1──
3. **Hard.**في مجال محدد مجموعة بيانات NER (طبية، قانونية أو مالية)`distilbert-base-cased` مع نموذج spaCy صغير مقابل مقابل  سجل التحققات من تسرب البيانات،并写下让你意外的发现‬

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| NER | 提取名称 | 给 token spans 标注类型（PERSON、ORG、GPE、DATE，...）。 |
| BIO | Tagging scheme | `B-X` 表示开始，`I-X` 表示继续，`O` 表示外部。 |
| BILOU | 更好的 BIO | 增加 `L-X`（last）、`U-X`（unit），让边界更清晰。 |
| CRF | 结构化 classifier | 对 labels 之间的 transitions 建模，而不只是 emissions。强制有效序列。 |
| Nested NER | 重叠实体 | 一个 span 是与其子 span 不同的实体。BIO 无法表达这一点。 |
| Entity-level F1 | 正确的 NER metric | 预测 span 必须与真实 span 完全匹配。Token-level F1 会高估准确率。 |

## 延伸阅读

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) BiLSTM-CRF 论文──经典──
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805)  أدخل في وقت لاحق أصبح معيار الوضع التصنيف الرمزي 
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) `Doc.ents`和 `Span`المعلومات المستخدمة في كل صفة
- [seqeval](https://github.com/chakki-works/seqeval)مكتبة المقاييس الصحيحة
