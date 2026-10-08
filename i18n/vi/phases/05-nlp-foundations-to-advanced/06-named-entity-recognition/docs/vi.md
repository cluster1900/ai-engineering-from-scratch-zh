# Định nghĩa của đơn vị

> Hãy lấy tên ra. Có vẻ đơn giản, cho đến khi bạn gặp được mờ giới hạn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 5 · 03 (Word Embeddings)
**Time:** ~75 minutes

## 问题

"Apple kiện Google vì thỏa thuận tìm kiếm iPhone của mình ở Mỹ". 五个实体:Apple (ORG)  Google (ORG)  iPhone (PRODUCT) 搜索协议(也许算) 美国 (GPE) ⋅ một hệ thống NER tốt sẽ提取全部实体,并给出正确类型──一个差的系统会漏掉 iPhone,把水果 Apple和公司 Apple 混,还将"US"标记为 PERSON──

NER là mỗi bài cấu trúc rút đường ống dẫn  tầng dưới chủ lực 简历解析、合规日志扫描、病历匿名化、搜索查询理解、聊天机 回复的 grounding、法律合同抽取──你几乎看不见它;但你一直依赖它──

本课会沿着经典路径 (基于规则的, HMM, CRF)走向现代路径 (BiLSTM-CRF,然后是变压器) ⋅ từng bước đều giải quyết một giới hạn cụ thể của bước trước.

## 概念

**BIO tagging**(hoặc BILOU) 把实体抽取转化为序列标注问题──为每个标注`B-TYPE`(实体开始)`I-TYPE`(trực thể nội bộ) hoặc `O`( bất cứ thể nào bên ngoài)

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

Nhiều token 实体会串联起来:`New B-GPE``York I-GPE``City I-GPE`❖ hiểu mô hình của BIO có thể rút ra bất kỳ khoảng thời gian nào.

架构演进:

- **Rule-based.**Regex + gazetteer 查找── đối với vật thể đã biết chính xác 高, đối với vật thể mới 覆盖 为零──
- **HMM.**Mô hình Markov ẩn── xác định xác suất phát thải token của thẻ, cũng như xác suất chuyển đổi của thẻ đến thẻ── sử dụng mã hóa Viterbi── trên dữ liệu thẻ.
- **CRF.**Chân tình cờ có điều kiện── giống như HMM, nhưng thuộc về mô hình phân biệt đối xử, do đó có thể hỗn hợp bất kỳ đặc điểm nào (từ hình chữ, viết lớn, viết gần) ― cho đến năm 2026, vẫn là lực lượng sản xuất cổ điển trong Bộ Tài nguyên thấp.
- **BiLSTM-CRF.**Utilised Neural Features Alternative Handmade Features──LSTM 双向读取句子,顶部CRF层强制标签 序列一致──
- **Transformer-based.**Sử dụng đầu phân loại token 微调 BERT──准确率最高──计算量最大──


```figure
ner-bio-tagging
```

##  xây dựng nó

### 步骤 1: BIO tagging assistants

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

### 步骤 2: Các tính năng được làm bằng tay

Đối với các loại NER không thần kinh, đặc điểm là cốt lõi.

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

`word_shape("iPhone")` quay lại `xXxxxx``word_shape("USA-2024")` quay lại `XXX-dddd`◊                                                                                                                                                                                                                                                              

### 步骤 3: Một quy tắc đơn giản dựa trên + từ điển cơ sở

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

生产级报纸 有数百万条从维基百科 和 DBpedia 抓取的条目── 覆盖 很好── ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ ︎ 

### 步骤 4: CRF 步骤(草图, không hoàn toàn thực hiện)

Nếu không có cơ sở thuyết xác suất, viết toàn bộ CRF từ 0 với 50 行 không thể mang lại nhiều khởi động.`sklearn-crfsuite`- Có thể là:

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

`c1`和 `c2`là L1 và L2 quy định.`all_possible_transitions=True`让模型学习非法序列 (tức là:`O`后面的 `I-ORG`) tỷ lệ có thể là thấp, đó là cách CRF không cần bạn viết lách.

### Bước 5: BiLSTM-CRF  tăng lên gì

Trẻ biến thành học được của. 输入:token embeddings(GloVe hoặc fastText) ⋅LSTM Từ trái sang phải、 từ phải sang trái读取──拼接后的隐藏状态 进入CRF 输出层──CRF 仍然强制标签 序列一致;LSTM 则用学习得到的特征替代手工特征──

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

CRF 层使用 `torchcrf.CRF`(pip cài đặt pytorch-crf) ⋅ So với CRF thủ công, nâng là có thể đo lường, nhưng trừ khi bạn có hàng ngàn câu đánh dấu, nếu không nâng幅 thường hơn bạn mong đợi nhỏ ⋅

## Sử dụng nó

Space 开箱即带生产级 NER.

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

chú ý`iPhone`Được đánh dấu`ORG`Không phải`PRODUCT`Mô hình nhỏ của không gian đối với sự bao phủ của đơn vị sản phẩm 较弱── mô hình lớn(`en_core_web_lg`(表现更好──transformer model)`en_core_web_trf`(Tại đây sẽ tốt hơn)

NER dựa trên BERT của Hugging Face:

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

`aggregation_strategy="simple"`Sẽ có các token B-X liên tục 合并 thành một span. Nếu không có nó, bạn sẽ nhận được các nhãn cấp token, và phải tự hợp lại.

### NER dựa trên LLM (NER)

NER LLM Zero-shot và ít-shot hiện nay trong nhiều lĩnh vực đã có thể cạnh tranh với mô hình tinh chỉnh; trong thời gian thiếu dữ liệu, hiệu suất rõ ràng tốt hơn.

- **Zero-shot prompting.**给 LLM một nhóm loại vật thể và một mô hình sơ đồ. 要求输出 JSON.
- **ZeroTuneBio-style prompting.**将任务分解为候选人提取 → nghĩa giải thích → phán xét → kiểm tra lại.
- **Dynamic prompting with RAG.**Đối với mỗi cuộc gọi suy luận, từ một tập hợp hạt giống nhãn nhỏ tìm kiếm các mẫu nhãn tương tự nhất; động thái xây dựng các lời nhắc ít lần chụp. Trong điểm chuẩn năm 2026, điều này có thể giúp GPT-4 sinh học NER F1 tương đương với động lực tĩnh tăng 11-12%.
- **Per-entity-type decomposition.**Đối với các tài liệu dài, một lần sử dụng đồng thời rút tất cả các loại vật thể sẽ tăng và giảm hồi tưởng theo chiều dài.

截至2026年的生产建议: 在收集训练数据之前,先做一个LLM零射基线――很多时候F1 已经足够好,你根本不需要细节调――

### 经典 NER 仍然胜出的地方

Ngay cả khi đã có LLM, NER cổ điển trong các tình huống sau đây vẫn thắng:

- Ngân sách thời gian trễ 低于50ms。
- Có hàng ngàn mẫu nhãn hiệu, và cần 98% F1+.
-  lĩnh vực có một hệ thống phân định ổn định, được đào tạo trước CRF hoặc BiLSTM 迁移效果良好──
- 监管约束要求 on-prem、非生成式模型──

### Nó sẽ thất bại ở những nơi nào đó

- **Domain shift.**NER được đào tạo trên CoNLL sử dụng trên hợp đồng pháp lý, biểu hiện hơn báo chí còn khác.
- **Nested entities.**"Bank of America Tower" 同时是 ORG 和 FASILITY──标准BIO 无法表示重叠 span──你需要嵌套的NER(multi-pass或跨度型号)──
- **Long entities.**"Công ty bảo hiểm tiền gửi liên bang Hoa Kỳ".`aggregation_strategy`Hoặc xử lý sau.
- **Sparse types.**医疗 NER 标签包括 DRUG_BRAND、ADVERSE_EVENT、DOSE。

## 交付 nó

保存为 `outputs/skill-ner-picker.md`- Có thể là:

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

1. **Easy.**实现 `bio_to_spans`(`spans_to_bio`Trong 10 câu trên kiểm tra sự nhất quán đi lại và đi lại.
2. **Medium.**Trong tập hợp dữ liệu NER tiếng Anh CoNLL-2003 上训 trên của sklearn-crfsuite CRF。使用 `seqeval` báo cáo cho mỗi đơn vị F1── điển hình kết quả:~84 F1──
3. **Hard.**Trong một lĩnh vực cụ thể của bộ dữ liệu NER (tiếng y tế, pháp lý hoặc tài chính)`distilbert-base-cased`▽ với không gianCơ mô hình nhỏ đối với ⋅ ghi lại kiểm tra rò rỉ dữ liệu,并写下让你意外的发现──

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
- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers](https://arxiv.org/abs/1810.04805) 引入后成为标准的代币分类模式.
- [spaCy linguistic features — named entities](https://spacy.io/usage/linguistic-features#named-entities) `Doc.ents`和 `Span`Trên mỗi thuộc tính có thể dùng để tham khảo.
- [seqeval](https://github.com/chakki-works/seqeval)                                                                                                                                                                                                                                                              
