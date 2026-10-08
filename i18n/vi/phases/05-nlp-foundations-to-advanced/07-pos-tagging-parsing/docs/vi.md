# POS Tagging và Syntactic Parsing

> ngữ pháp một lần không quá phổ biến. Sau đó mỗi dòng LLM đều cần phải chứng minh cấu trúc rút ra, nó lại trở lại.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 5 · 01 (文本处理), Giai đoạn 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## 问题

Bài học 01  hứa hẹn,  lập trình  cần một phần của bài phát biểu  Nếu không biết`running`Đó là động từ, "những gì không thể làm được"`run`Nếu không biết`better`Đó là từ ngữ, nó đã không thể được tái tạo.`good`

Đây là một phần của việc gắn thẻ bài phát biểu sẽ phân bổ các loại ngữ pháp. Phân tích tổng hợp sẽ khôi phục cấu trúc cây câu:哪个词修饰哪个词,哪个动词 支配哪些论点.

Nhưng cộng đồng ứng dụng không có. Mỗi dòng đường ống khai thác cấu trúc. tầng dưới vẫn đang sử dụng cây POS và cây phụ thuộc. LLM 生成的 JSON 会根据语法限制进行验证.

Ưu điểm để biết:  本课介绍标签, đường cơ bản,以及何时停止从零实现转而调用空间

## 概念

**POS tagging**会为每个符号标注语法类别──**Penn Treebank (PTB)**Tagset là một lựa chọn mặc định của tiếng Anh. Nó có 36 thẻ, phân biệt nhỏ đến người đọc thông thường sẽ cảm thấy chọn:`NN`singular noun,`NNS`số đông từ ,`NNP`proper noun singular,`VBD`động từ quá khứ thời gian,`VBZ`động từ 3rd person singular present, etc.**Universal Dependencies (UD)**Tagset 更粗粒度 (tương tự là "đồ viết lớn hơn"), còn không liên quan đến ngôn ngữ; nó đã trở thành một lựa chọn được chọn trong các tác phẩm đa ngôn ngữ.

```
The/DET cats/NOUN were/AUX running/VERB at/ADP 3pm/NOUN ./PUNCT
```

**Syntactic parsing**Sẽ sinh ra một cây. Có hai kiểu chính:

- **Constituency parsing.**Từ từ, từ từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ, từ từ, từ từ, từ từ, từ từ, từ từ, từ từ từ, từ từ từ, từ từ từ, từ từ từ từ, từ từ từ, từ từ từ, từ từ từ từ, từ từ từ từ, từ từ từ, từ từ từ, từ từ, từ từ từ từ từ, từ từ từ từ từ từ, từ từ từ, từ từ từ, từ từ từ từ từ, từ từ từ từ, từ từ, từ từ từ từ, từ từ từ từ từ, từ, từ từ từ từ, từ, từ từ từ từ, từ từ từ từ, từ từ, từ từ từ, từ, từ từ từ từ, từ, từ từ từ, từ, từ, từ từ, từ, từ từ từ, từ, từ, từ, từ, từ, từ từ, từ, từ từ, từ, từ, từ từ, từ, từ, từ, đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến đến
- **Dependency parsing.**Mỗi từ 都 có một từ đầu phụ thuộc vào nó,并带有语法关系标签──输出是一棵树,其中每条边都是一个 (head, dependent, relation) triple──

Phân tích phụ thuộc trong năm 2010 胜出, vì nó có thể rất tốt trong các ngôn ngữ phổ biến, đặc biệt phù hợp với các ngôn ngữ tự do.

```
running is ROOT
cats is nsubj of running
were is aux of running
at is prep of running
3pm is pobj of at
```


```figure
pos-tagger
```


```figure
dependency-arcs
```

##  xây dựng nó

### 步骤 1: đường gốc thẻ thường xuyên nhất

 Nhưng hiệu quả nhất POS Tagger  đối với mỗi từ, dự đoán nó xuất hiện thường xuyên nhất trong tập luyện 

```python
from collections import Counter, defaultdict


def train_mft(train_examples):
    word_tag_counts = defaultdict(Counter)
    all_tags = Counter()
    for tokens, tags in train_examples:
        for token, tag in zip(tokens, tags):
            word_tag_counts[token.lower()][tag] += 1
            all_tags[tag] += 1
    word_best = {w: c.most_common(1)[0][0] for w, c in word_tag_counts.items()}
    default_tag = all_tags.most_common(1)[0][0]
    return word_best, default_tag


def predict_mft(tokens, word_best, default_tag):
    return [word_best.get(t.lower(), default_tag) for t in tokens]
```

Ở trên cơ thể Brown, đường cơ sở này có thể đạt được độ chính xác khoảng 85%. Không tính tốt, nhưng đây là bất kỳ mô hình nghiêm ngặt nào không nên thấp hơn giới hạn thấp hơn.

### 步骤 2: bigram HMM tagger

Đối với xác suất chung của chuỗi 建模:

```
P(tags, words) = prod P(tag_i | tag_{i-1}) * P(word_i | tag_i)
```

两张表: xác suất chuyển tiếp () và xác suất phát thải ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  () )  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()                                                                                              

```python
import math


def train_hmm(train_examples, alpha=0.01):
    transitions = defaultdict(Counter)
    emissions = defaultdict(Counter)
    tags = set()
    vocab = set()

    for tokens, ts in train_examples:
        prev = "<BOS>"
        for token, tag in zip(tokens, ts):
            transitions[prev][tag] += 1
            emissions[tag][token.lower()] += 1
            tags.add(tag)
            vocab.add(token.lower())
            prev = tag
        transitions[prev]["<EOS>"] += 1

    return transitions, emissions, tags, vocab


def log_prob(table, given, key, smooth_denom, alpha):
    return math.log((table[given].get(key, 0) + alpha) / smooth_denom)


def viterbi(tokens, transitions, emissions, tags, vocab, alpha=0.01):
    tags_list = list(tags)
    n = len(tokens)
    V = [[0.0] * len(tags_list) for _ in range(n)]
    back = [[0] * len(tags_list) for _ in range(n)]

    for j, tag in enumerate(tags_list):
        em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
        tr_denom = sum(transitions["<BOS>"].values()) + alpha * (len(tags_list) + 1)
        tr = log_prob(transitions, "<BOS>", tag, tr_denom, alpha)
        em = log_prob(emissions, tag, tokens[0].lower(), em_denom, alpha)
        V[0][j] = tr + em
        back[0][j] = 0

    for i in range(1, n):
        for j, tag in enumerate(tags_list):
            em_denom = sum(emissions[tag].values()) + alpha * (len(vocab) + 1)
            em = log_prob(emissions, tag, tokens[i].lower(), em_denom, alpha)
            best_prev = 0
            best_score = -1e30
            for k, prev_tag in enumerate(tags_list):
                tr_denom = sum(transitions[prev_tag].values()) + alpha * (len(tags_list) + 1)
                tr = log_prob(transitions, prev_tag, tag, tr_denom, alpha)
                score = V[i - 1][k] + tr + em
                if score > best_score:
                    best_score = score
                    best_prev = k
            V[i][j] = best_score
            back[i][j] = best_prev

    last_best = max(range(len(tags_list)), key=lambda j: V[n - 1][j])
    path = [last_best]
    for i in range(n - 1, 0, -1):
        path.append(back[i][path[-1]])
    return [tags_list[j] for j in reversed(path)]
```

Bigram HMM ở Brown 上能 đạt được độ chính xác khoảng 93%  Từ 85% lên 93% tăng chủ yếu từ xác suất chuyển đổi: mô hình học tập `DET NOUN`很常见,而 `NOUN DET`很少见――

### Bước 3: Tại sao các tagger hiện đại có thể vượt qua nó

Chuyển đổi + khả năng phát thải đều là ở một nơi nào đó. Chúng không thể nắm bắt được.`saw`Trong "Tôi mua một cây cưa" là từ, trong khi trong "Tôi xem phim". trong đó là từ.

Hạn chế trên nhiệm vụ này được quyết định bởi sự bất đồng của nhà ghi chú. Các nhà ghi chú con người trên Penn Treebank trên 97% của thời gian đồng ý.

### 步骤 4: bản phác thảo phân tích phụ thuộc

Từ零完整实现依赖解析 超出本课范围;标准教材讲解见 Jurafsky và Martin──需要了解两个经典家庭:

- **Transition-based**parsers(arc-eager、arc-standard) như shift-reduce parser 一样工作:它们读取代币,将其转到堆上,并应用减少行动 来创建弧──贪码 快快──经典实现是 MaltParser──现代神经版本:Chen and Manning 的转型基于的解析器──
- **Graph-based**parsers(Algorithm của Eisner、Dozat-Manning biaffine) sẽ dành cho mỗi条可能的头依边 打分,并选择最大跨度树──更慢但更准确──

Đối với hầu hết các công việc được áp dụng, điều chỉnh không gian:

```python
import spacy

nlp = spacy.load("en_core_web_sm")
doc = nlp("The cats were running at 3pm.")
for token in doc:
    print(f"{token.text:10s} tag={token.tag_:5s} pos={token.pos_:6s} dep={token.dep_:10s} head={token.head.text}")
```

```
The        tag=DT    pos=DET    dep=det        head=cats
cats       tag=NNS   pos=NOUN   dep=nsubj      head=running
were       tag=VBD   pos=AUX    dep=aux        head=running
running    tag=VBG   pos=VERB   dep=ROOT       head=running
at         tag=IN    pos=ADP    dep=prep       head=running
3pm        tag=NN    pos=NOUN   dep=pobj       head=at
.          tag=.     pos=PUNCT  dep=punct      head=running
```

Từ dưới lên lên đọc `dep`Lưu ý về cấu trúc ngữ pháp của câu sẽ xuất hiện.

## Sử dụng nó

Mỗi thư viện sản xuất NLP đều cung cấp các bộ phân tích POS và phụ thuộc như một phần của đường ống tiêu chuẩn.

- **spaCy**(`en_core_web_sm`- `md`- `lg`- `trf`)──快速、准确,并与代币化 + NER + 集成化`token.tag_`(Penn)`token.pos_`(UD)`token.dep_`(sự tương quan phụ thuộc)
- **Stanford NLP (stanza)**Stanford đối với các nhà kế nhiệm của CoreNLP.
- **trankit** dựa trên Transformer, độ chính xác của U.D.  rất tốt.
- **NLTK**`pos_tag`❖ có thể dùng ❖ chậm hơn ❖ cũ hơn ❖ thích hợp với học.

### Đây là nơi vẫn quan trọng vào năm 2026

- **Lemmatization.**Bài học 01 需要 POS 才能正确 lemmatize──永远如此──
- **Structured extraction from LLM outputs.**验证生成的句子 是否遵守语法约束 (ví dụ: sự đồng thuận từ ngữ-chúng ngữ, cần thiết sửa đổi)
- **Aspect-based sentiment.**Các phân tích phụ thuộc sẽ cho bạn biết từ ngữ nào 修饰哪个名词──
- **Query understanding.**"Những bộ phim do Wes Anderson đạo diễn với Bill Murray" sẽ được phân tích chia thành những hạn chế có cấu trúc.
- **Cross-lingual transfer.**Tags UD và mối quan hệ phụ thuộc với ngôn ngữ không liên quan, hỗ trợ cho các ngôn ngữ mới thực hiện phân tích có cấu trúc không bắn.
- **Low-compute pipelines.**Nếu không thể giao dịch biến đổi, POS + phụ thuộc phân tích + báo chí 能让你走出意料地远.

## 交付 nó

保存为 `outputs/skill-grammar-pipeline.md`- Có thể là:

```markdown
---
name: grammar-pipeline
description: 为下游 NLP task 设计一个 classical POS + dependency pipeline。
version: 1.0.0
phase: 5
lesson: 07
tags: [nlp, pos, parsing]
---

给定一个下游 task（information extraction、rewrite validation、query decomposition、lemmatization），你输出：

1. 要使用的 tagset。English-only legacy pipelines 使用 Penn Treebank，multilingual 或 cross-lingual 使用 Universal Dependencies。
2. Library。大多数 production 使用 spaCy，academic-grade multilingual 使用 stanza，最高 UD accuracy 使用 trankit。写出具体的 model ID。
3. Integration pattern。展示调用 library 并消费所需 attributes（`.pos_`、`.dep_`、`.head`）的 3-5 行代码。
4. 需要测试的 failure mode。Noun-verb ambiguity（`saw`、`book`、`can`）和 PP-attachment ambiguity 是 classical traps。抽样 20 个 outputs 并人工查看。

拒绝建议自己写 parser。Building parsers from scratch 是 research project，不是 application task。标记任何消费 POS tags 却不处理 lowercase/uppercase variants 的 pipeline 为 fragile。
```

## 练习

1. **Easy.**Trong một tập hợp nhỏ được đánh dấu (ví dụ như NLTK's Brown subset) sử dụng đường cơ sở thẻ thường xuyên nhất, đo lường chính xác của các câu được giữ trên.
2. **Medium.**训练上的bigram HMM,并报告每标签精度/回忆──HMM 最容易混哪些标签?
3. **Hard.**Sử dụng phân tích phụ thuộc của không gian, lấy mẫu 1000 câu 中抽取主题-verb-object triples──在 50 个手工标注的三倍上评估──记录提取 失败的位置──通常是动态、协调和被除的主题)──

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| POS tag | Word 的类型 | Grammatical category。PTB 有 36 个；UD 有 17 个。 |
| Penn Treebank | Standard tagset | 针对英语。细粒度区分 verb tenses 和 noun number。 |
| Universal Dependencies | Multilingual tagset | 比 PTB 更粗粒度；language-neutral；cross-lingual work 的默认选择。 |
| Dependency parse | Sentence tree | 每个 word 有一个 head，每条 edge 有一个 grammatical relation。 |
| Viterbi | Dynamic programming | 在给定 emissions 和 transitions 的情况下，找到 probability 最高的 tag sequence。 |

## 延伸阅读

- [Jurafsky and Martin — Speech and Language Processing, chapters 8 and 18](https://web.stanford.edu/~jurafsky/slp3/) POS và phân tích các tiêu chuẩn giảng dạy
- [Universal Dependencies project](https://universaldependencies.org/) Mỗi trình phân tích đa ngôn ngữ sẽ sử dụng các thẻ đa ngôn ngữ và bộ sưu tập Treebank
- [spaCy linguistic features guide](https://spacy.io/usage/linguistic-features) `Token`Ưu điểm thực tế của mỗi thuộc tính trên
- [Chen and Manning (2014). A Fast and Accurate Dependency Parser using Neural Networks](https://nlp.stanford.edu/pubs/emnlp2014-depparser.pdf) đưa các bộ phận thần kinh vào các bài báo chính thống.
