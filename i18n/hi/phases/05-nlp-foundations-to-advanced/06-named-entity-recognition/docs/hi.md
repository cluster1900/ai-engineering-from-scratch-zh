# नामित इकाई पहचान

> इसे नाम से निकालें। यह बहुत सरल लगता है, जब तक आप एक अमूर्त सीमा का सामना नहीं करते।

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 问题

"Apple ने Google को अपने iPhone खोज सौदे पर अमेरिका में मुकदमा दायर किया।" 五个实体:Apple (ORG) 、Google (ORG) 、iPhone (PRODUCT) 、 खोज सौदा(也许算) 、US (GPE) ⋅ एक अच्छा NER 系统会提取全部实体,并给出正确类型──一个差的系统会漏掉iPhone,把水果 Apple和公司 Apple 混,还将"US"标记为个体──

NER प्रत्येक संरचनात्मक निकासी पाइपलाइन की मुख्य शक्ति है। सरल विश्लेषण, अनुसूची का पता लगाना, रोग का पता लगाना, अननामकरण, खोज प्रश्न समझ, चैटबॉट, आधार का पता लगाना, कानूनी अनुबंध निकासी।

इस वर्ग में शास्त्रीय मार्गों के साथ चलना है। यह विकासशील मोड स्वयं इस वर्ग का मुख्य बिंदु है।

## 概念

**BIO tagging**(या BILOU)                                                                                                                                                                                                                                                            `B-TYPE`(实体开始)`I-TYPE`(实体内部) या `O`(किसी भी वस्तु के बाहर)

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

कई टोकन 实体会串联起来:`New B-GPE``York I-GPE``City I-GPE` BIO के मॉडल को समझने के लिए किसी भी अवधि को खींच सकते हैं

架构演进:

- **Rule-based.**रेगएक्स + गजटेर 查找──对已知实体精度 高,对新实体覆盖 为零──
- **HMM.**छिपे हुए मार्कोव मॉडल── दिए गए टैग के टोकन उत्सर्जन की संभावना, साथ ही टैग तक टैग की संक्रमण की संभावना── विटरबी डिकोड── में टैग डेटा पर प्रशिक्षण──
- **CRF.**सशर्त यादृच्छिक क्षेत्र── एचएमएम की तरह, लेकिन भेदभावपूर्ण 模型 में से एक है, इसलिए किसी भी विशेषता को मिश्रित किया जा सकता है।
- **BiLSTM-CRF.**प्रयोग न्यूरल विशेषताएं बदलकर हस्त-विशेषणों。LSTM 双向读取句子,顶部CRF 层强制标签 序列一致。
- **Transformer-based.**उपयोग टोकन-वर्गीकरण प्रमुख 微调 BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

##  इसे निर्माण

### 步骤 1: बायो टैगिंग सहायकों

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

### 步骤 2: हस्तनिर्मित विशेषताएं

经典 (非神经) NER के लिए, विशेषताएँ ही मूल हैं।

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

`word_shape("iPhone")` लौटें `xXxxxx``word_shape("USA-2024")` लौटें `XXX-dddd`                                                                                                                                                                                                                                                              

### 步骤 3: एक सरल नियम आधारित + शब्दकोश आधार

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

生产级报纸有数百万条从维基百科 和 DBpedia 抓取的条目──覆盖 很好──曖昧性(公司果 VS 水果果) 很糟糕──这就是统计模型胜出的原因──

### 步骤 4: CRF 步骤(草图, पूर्ण रूप से पूरा नहीं हुआ)

यदि संभावना सिद्धांत का आधार नहीं है, तो शून्य से 50 लाइनों के साथ पूर्ण सीआरएफ लिखने में कोई कमी नहीं है।`sklearn-crfsuite`:

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

`c1`和 `c2`L1 और L2 नियमितता है`all_possible_transitions=True`让模型学习非法序列 (जैसे)`O`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `I-ORG`) संभावना बहुत कम है, यही कारण है कि सीआरएफ ने बिना आपके हाथ के लेखन के बंधन के एक ही प्रकार का तरीका अनिवार्य किया है।

### 步骤 5: BiLSTM-CRF 增加了什么

विशेषताएं बदलकर सीखने में मिलें──输入: टोकन एम्बेडिंग्स(GloVe या fastText)──LSTM Left to Right、 From Right to Left Reading──拼接后的隐藏状态 进入CRF 输出层──CRF 仍然强制标签 序列一致;LSTM 则用学习得到的特征替代手工特征──

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

सीआरएफ 层使用 `torchcrf.CRF`(पिप इंस्टॉल पिटॉर्च-क्रफ) ⋅ हाथ से बने सीआरएफ के मुकाबले, वृद्धि मापने योग्य है, लेकिन जब तक आपके पास हजारों अंकन वाक्य नहीं हैं, तब तक वृद्धि दर आमतौर पर आपके अपेक्षित से कम है ⋅

## इसका उपयोग करें

स्पेस 开箱即带生产级 NER

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

ध्यान दें`iPhone`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `ORG`नहीं `PRODUCT`,स्पेसी का छोटा मॉडल उत्पाद इकाई के कवरेज के लिए 较弱──大型模型(`en_core_web_lg`)表现更好──ट्रांसफॉर्मर मॉडल(`en_core_web_trf`) फिर से बेहतर होगा.

गर्लिंग फेस का BERT आधारित NER:

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

`aggregation_strategy="simple"`एक अवधि में एक साथ एक B-X  I-X टोकन                                                                                                                                                                                                                                                       

### LLM आधारित NER(2026 साल के चुनाव)

शून्य-शॉट तथा कुछ-शॉट एलएलएम एनईआर अब कई क्षेत्रों में ठीक-ठीक 模型 प्रतिस्पर्धा के साथ सक्षम है;

- **Zero-shot prompting.**LLM को एक समूह भौतिक प्रकार और एक उदाहरण योजना  प्रदान करना  JSON आउटपुट की आवश्यकता  खुला बॉक्स उपलब्ध; नए क्षेत्र में सटीकता दर मध्य 
- **ZeroTuneBio-style prompting.**将任务分解为候选人提取 → अर्थ व्याख्या →判断 → पुन-检查──多阶段 शीघ्र (多阶段 prompt) ️ एक शॉट नहीं) ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️
- **Dynamic prompting with RAG.**प्रत्येक निष्कर्ष कॉल के लिए, एक छोटे से लेबल बीज सेट से सबसे समान लेबल उदाहरणों का परीक्षण करें; गतिशीलता निर्माण कुछ-शॉट प्रॉम्प्ट। 2026 के बेंचमार्क में, यह जीपीटी-4 बायोमेडिकल एनईआर एफ 1 की तुलना में स्थिर प्रॉम्प्टिंग में 11-12% की वृद्धि कर सकता है।
- **Per-entity-type decomposition.**दीर्घलेख के लिए, एक बार उपयोग के साथ सभी भौतिक प्रकारों को एक साथ निकाला जाएगा लंबाई के साथ-साथ याददाश्त में वृद्धि होगी। प्रत्येक भौतिक प्रकार पर एक बार निकाला जाएगा।

截至2026年的生产建议: 收集训练数据之前, पहले एक LLM शून्य-शॉट बेसलाइन बनाएं──很多时候F1 已经足够好,你根本不需要细节调──

### 经典 NER 仍然胜出的地方

यहां तक कि एलएलएम भी हैं, क्लासिक एनईआर में निम्नलिखित परिस्थितियां अभी भी सामने आई हैंः

- लटेंसी बजट 50ms से कम है।
- आप हजारों लेबल नमूने हैं, और 98% F1 के लिए आवश्यक है।
- क्षेत्र में स्थिर ओंटोलॉजी, पूर्व प्रशिक्षित सीआरएफ या बीएलएसटीएम 迁移效果良好──
- 监管约束 on-premis ̳非生成式模型──

### यह कहीं पर विफल हो जाएगा

- **Domain shift.**कॉनलल में प्रशिक्षण के लिए एनईआर का उपयोग कानूनी अनुबंध पर किया जाता है, प्रदर्शन गजटियर से भी कम है.
- **Nested entities.**"बैंक ऑफ अमेरिका टॉवर" 同时是 ORG 和 FASILITY──标准 BIO 无法表示重叠 span──你需要嵌套的NER(बहु-पास या स्पैन-आधारित मॉडल)──
- **Long entities.**"संयुक्त राज्य अमेरिका संघीय जमा बीमा निगम. " टोकन स्तर  मॉडल कभी कभी इसे तोड़ने के लिए उपयोग `aggregation_strategy`या बाद में संसाधित किया गया।
- **Sparse types.**医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE──通用模型完全不了解这些──Scispacy 和 BioBERT是此处起点──

## 交付 यह

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

## अभ्यास

1. **Easy.**实现 `bio_to_spans`(`spans_to_bio`) और 10 个句子上验证回路一致性──
2. **Medium.**में CoNLL-2003 अंग्रेजी NER डेटासेट 上 प्रशिक्षण ऊपर के sklearn-crfsuite CRF`seqeval` प्रति इकाई F1 ∙ 典型结果:~84 F1 ∙
3. **Hard.**एक क्षेत्र में विशिष्ट एनईआर डेटासेट (औषधीय, कानूनी या वित्तीय) पर ठीक-ठीक`distilbert-base-cased`◊ स्पेस के साथ छोटे मॉडल के लिए तुलना ◊ डेटा लीक की जांच दर्ज करें,并写下让你意外的发现──

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
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805)                                                                                                                                                                                                                                                              
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) `Doc.ents`和 `Span`उपरोक्त प्रत्येक विशेषता का व्यावहारिक संदर्भ
- [seqeval](https://github.com/chakki-works/seqeval) सही मेट्रिक लाइब्रेरी──始终使用它──
