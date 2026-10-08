# Adlı Entite Tanınması

> Bu çok basit bir şey. Bir çelişkiyle karşılaşana kadar.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 问题

"Apple, Google'ı ABD'deki iPhone arama anlaşması için dava etti". 五个实体:Apple (ORG) 、Google (ORG) 、iPhone (PRODUCT) 、 arama anlaşması(也许算) 、US (GPE) ⋅

NER her yapılandırılmış çekim borusunun temel gücüdür.

Bu ders klasik yollar üzerinde olacaktır. Bu gelişme biçimi kendiliğinden bu dersin temel noktasıdır.

## 概念

**BIO tagging**(BILOU)                                                                                                                                                                                                                                                             `B-TYPE`(实体开始)`I-TYPE`(beden içi) veya `O`(herhangi bir vücut dışında)

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

Çoklu bir 实体会串联起来:`New B-GPE`- Evet.`York I-GPE`- Evet.`City I-GPE`❖ Biyo'nun modelini anlamak istediği süreyi çekmek mümkündür.

架构演进:

- **Rule-based.**Regex + gazetteer 查找──对已知实体精度 高,对新实体覆盖 为零──
- **HMM.**Gizli Markov Modelı── belirlenmiş etiketlerin simge emisyon olasılığı, ayrıca etiketlere geçiş olasılığı── Viterbi dekodeyi kullanarak── etiket verileri üzerinde eğitim──
- **CRF.**Şartlı Rastgele Alanı── HMM'ye benzer, ancak ayrımcı  modelden oluşur, bu nedenle herhangi bir özellikleri bir araya getirebilir.
- **BiLSTM-CRF.**Nöral Özellikler Alternative Handcraft Özellikleri. LSTM 双向读取句子,顶部CRF 层强制标签 序列一致──
- **Transformer-based.**Token sınıflandırma başlığı 微调 BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

## Yapın onu.

### 步骤 1: BIO etiketleme yardımcıları

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

### 步骤 2: El yapımı özellikler

经典 (非神经) NER için,特征就是核心──实用特征包括:

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

`word_shape("iPhone")`Geri dön .`xXxxxx`- Evet.`word_shape("USA-2024")`Geri dön .`XXX-dddd`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊    ◊     ◊        ◊                                                                                                                                                                                    

### 步骤 3: A simple rule-based + dictionary baseline

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

Üretim sınıfı gazeter, Wikipediyadan ve DBpedia'dan birkaç milyon yazı var 抓取的条目──Coverage 很好──Disambiguation(公司果 vs 水果果) 很糟──这就是统计模型胜出的原因──

### 步骤 4: CRF 步骤(草图, tamamıyla gerçekleşmedi)

Eğer olasılık teorisi temelinde değilse, sıfırdan 50 satırda tamamı yazmak için bir CRF getiremez.`sklearn-crfsuite`- ...

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

`c1`和 `c2`L1 ile L2 düzenlenmesi.`all_possible_transitions=True`让模型学习非法序列 (yani yasa dışı bir süreç öğrenmek)`O`- Evet .`I-ORG`) olasılık çok düşük, bu CRF'nin sizin el yazmanız gerekmeden BIO'yu zorla birleştirme şekli.

### Adım 5: BiLSTM-CRF                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

Özellikler öğrenilmeye dönüştürülmüştür. Giriş: belirti yerleştirmeleri(GloVe veya fastText) ――LSTM Soldan sağğa、 sağdan solya okuyun。 İpuşturma sonrası gizli durumlar  CRF 输出层。CRF 仍然强制标签 序列一致;LSTM 则用学习得到的特征替代手工特征。

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

CRF 层使用 `torchcrf.CRF`(Pip yükle pytorch-crf) ⋅ El yapımı CRF'ye kıyasla, yükseltme ölçülebilir, ancak binlerce işaretleme cümlesi yoksa yükseltme oranı genellikle beklediğinizden küçük olacaktır.

## Kullan

Bu, bir üretim sınıfı olan NER'in bir kapsamlılık kapsamıdır.

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

Dikkat et .`iPhone`Üzerine`ORG`Hayır.`PRODUCT`,spaCy'nin küçük modeli ürün birimi kapsamına göre 弱──大型`en_core_web_lg`)表现更好──transformer modeli(`en_core_web_trf`Daha iyi olacak.

Kucaklanmak Yüzü'nün BERT tabanlı NER:

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

`aggregation_strategy="simple"`B-X ∞ I-X token ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ 

### LLM tabanlı NER(2026 yılın seçimi)

Zero-shot ve birkaç-shot LLM NER'ler artık birçok alanda ince ayarlanmış model yarışması ile karşı karşıya kalıyor; etiketleme verileri eksik olduğu zaman, performans belirgin olarak daha iyi olmuştur.

- **Zero-shot prompting.**LLM'ye bir grup fiziksel tip ve örnek şema verilmiştir.
- **ZeroTuneBio-style prompting.**Bu görevler, aday çıkarımı için ayrılır. Bu yöntemin aynı şekilde hukuk, finans ve bilim alanlarında da uygulanabilir.
- **Dynamic prompting with RAG.**Her bir sonuç çağrısı için, küçük bir etiket tohum seti içinden en benzer etiket örneklerini aramak; hareketli birkaç atışlı uyarı oluşturmak. 2026 yılına denk bir çağrıda, bu GPT-4 biyomedikal NER F1 oranında statik uyarı % 11-12 artar.
- **Per-entity-type decomposition.**Uzun dosya için, bir kez kullanılarak tüm fiziksel tiplerin aynı anda çekilmesi uzunluğu arttıkça hatırlanmayı azaltır.

2026 yılına kadar üretim önerisi: önce bir LLM sıfır çekim temelini oluşturun.

### 经典 NER 仍然胜出的地方

Hatta zaten LLM'ler var, klasik NER aşağıdaki durumlarda hala kazanıyor:

- Gecikme bütçesi 50 ms'ten aşağıdır.
- Binlerce etiket örneği var ve %98+ F1 gerekiyor.
-  alanında sabit ontoloji, CRF veya BiLSTM eğitimi  迁移效果良好。
- 监管约束 on-prem ̳非生成式模型』

### Nerede olursa olsun işe yaramaz.

- **Domain shift.**CoNLL'de eğitim aldığı NER'in yasal anlaşmalarda kullanılması gazeterden daha farklıdır.
- **Nested entities.**"Bank of America Tower" 同时是 ORG 和 FASILITY──标准 BIO 无法表示重叠 span──你需要嵌套的NER(多通过或跨度型号)──
- **Long entities.**"United States Federal Deposit Insurance Corporation". Token seviyesindeki model zaman zaman açılır.`aggregation_strategy`Ya da son işleme.
- **Sparse types.**医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE。通用模型完全不了解这些──Scispacy 和 BioBERT 是此的起点──

## - Söyle.

保存为 `outputs/skill-ner-picker.md`- ...

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

## 练习

1. **Easy.** gerçekleştirmek `bio_to_spans`(`spans_to_bio`Bu, bir diğer yolcuyu etkilemesini sağlayan bir yöntemdir.
2. **Medium.**Bu nedenle, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temelinde, bu programın temel olarak, bu programın temelinde,`seqeval`報告/entity F1──典型結果:~84 F1──
3. **Hard.**Bir alanın belirli bir NER veri kümesi üzerinde ince ayarlama yaparak (dokunmatik, hukuki veya finansal)`distilbert-base-cased`▽ SpaceCy küçük modeli karşılaştırma ⋅ kayıt veriler sızdırma kontrol,并写下让你意外的发现──

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

- [Lample et al. (2016). Neural Architectures for Named Entity Recognition](https://arxiv.org/abs/1603.01360) BiLSTM-CRF 论文。经典。
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805)   introduced later became standard of token-classification 模式──
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) `Doc.ents`和 `Span`Üstteki her özellikten geçerli bir referans.
- [seqeval](https://github.com/chakki-works/seqeval) 正确的计量库──始终使用它──
