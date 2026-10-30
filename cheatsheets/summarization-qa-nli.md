---
id: summarization-qa-nli
title: Summarization, QA, NLI and Multilingual NLP
code: SQ
subtitle: 摘要、作答、检查蕴含，并跨语言迁移。模型、指标、默认值与失败模式。
hue: 285
sources: phases/05-nlp-foundations-to-advanced/12-text-summarization, phases/05-nlp-foundations-to-advanced/13-question-answering, phases/05-nlp-foundations-to-advanced/18-multilingual-nlp, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment
source_hash: 452c3d3b36b29868
---

## 带 NLI 门控的有据 QA
type: architecture
from: phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

```arch
node | q | 1,1 | Question | | client
node | retr | 2,1 | Retriever | top-k passages | process
node | read | 3,1 | Reader | span or LLM answer | model
node | nli | 4,1 | NLI check | context entails answer? | model
node | corpus | 2,2 | Corpus | BM25, dense or hybrid | store
node | out | 4,2 | Answer | or "I don't know" | client
edge | q | retr |
edge | corpus | retr | search
edge | retr | read | passages
edge | read | nli | answer
edge | nli | out | entailment
```

## 代码中的任务
type: task-table
span: 2
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/code/main.py, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

| 任务 | 代码 |
|---|---|
| 抽取式摘要 | `textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4)` |
| 生成式摘要 | `pipeline("summarization", model="facebook/bart-large-cnn")` |
| 生成摘要 | `summarizer(article, max_length=120, min_length=60, do_sample=False)` |
| 带词干的 ROUGE | `rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)` |
| 抽取式 QA | `pipeline("question-answering", model="deepset/roberta-base-squad2")` |
| 允许空答案 | 向 pipeline 调用传入 `handle_impossible_answer=True` |
| SQuAD 指标 | `exact_match(pred, gold)` 和 `token_f1(pred, gold)` |
| 零样本主题标签 | `zs(text, candidate_labels=labels)` |

## SQuAD 归一化
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/13-question-answering/code/main.py

```python
def normalize(text):
    text = text.lower()
    text = re.sub(r"\b(a|an|the)\b", " ", text)  # remove articles
    text = re.sub(r"[^\w\s]", " ", text)         # remove punctuation
    return " ".join(text.split())

exact_match("June 29th, 2007", "June 29, 2007")  # 0.0
token_f1("June 29th, 2007", "June 29, 2007")     # 0.67
token_f1("29 June 2007", "June 29, 2007")        # 1.00, EM is 0
refusal_from_score(top_retrieval_score, threshold=0.3)  # True means refuse
```

## TextRank，逐步进行
type: flow
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/code/main.py, phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md

1. **Split**：`sentence_split` 在 `.`、`!` 或 `?` 之后切开。句子很少：全部返回。
2. **Graph**：`similarity` 是词重叠除以两个长度的对数。
3. **Iterate**：每个分数是 `1 - damping` 加上衰减后的邻居分数。
4. **Stop**：变化低于 `epsilon`，或经过 `iterations` 轮。
5. **Output**：按文档顺序取前 `top_k` 个句子。

## 指标
type: concepts
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/code/main.py

- **ROUGE-1、ROUGE-2**：与参考的 unigram 和 bigram 重叠。
- **ROUGE-L**：最长公共子序列。40 算好。50 算出色。
- **EM**：归一化后的精确匹配。否则分数是 0。
- **Token F1**：token 重叠上的 $F_1 = \frac{2PR}{P + R}$。它给出部分分数。
- **BERTScore**：上下文嵌入相似度。与 ROUGE 一起报告。
- **G-Eval**：带思维链的 LLM 评判。与人类一致约 80% 的时间。
- **实体级 F1**：只出现在摘要里的实体值得怀疑。
- **RAGAS**：忠实度、答案相关性、上下文精确率、上下文召回率。

## 问题
type: qa
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

- **抽取式还是生成式？** 新闻、医疗、法律和金融文本用抽取式。生成式需要事实性检查。
- **零样本分类怎么工作？** 每个标签变成一个假设。选蕴含最高的标签。
- **迁移用哪种源语言？** 先试一个接近的高资源亲戚。Indic 目标用 Hindi。
- **为什么要按语言看准确率？** 汇总会掩盖长尾。
- **RAGAS 需要金标答案吗？** 不。它在没有参考的情况下给四个维度打分。

## 提示
type: tips
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

- ROUGE 里始终使用词干。否则 "running" 和 "run" 对不上。
- 报告 ROUGE-L、BERTScore 和 G-Eval。在 50-100 篇人工标注摘要上校准。
- 告诉模型只用上下文，并说 "I don't know."
- 始终检查 QA pipeline 的 `score` 字段。
- 上线零样本分类前，先跑 100 条带标签的健全性检查。
- 输入超过上下文窗口时，用分块 map-reduce，不要截断。

## NLI 与忠实度
type: annotated-code
lang: python
from: phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

```python
nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)                       # return all three labels
result = nli({"text": premise, "text_pair": hypothesis})[0]
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
result = zs(text, candidate_labels=labels)       # labels sorted by score

def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold           # context supports the claim
```

## 排障
type: troubleshooting
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 摘要写成 "John Brown" | 生成式输出里的实体对换 | 标记来源中没有的实体 |
| "25,000" 变成 "25 million" | 数字漂移 | 用抽取式或事实性门控 |
| 对不可回答的问题返回了跨度 | 默认忽略了空答案分数 | 设置 `handle_impossible_answer=True` |
| Reader 看起来很差 | Retriever 漏掉了段落 | 测量 top-`k` 的检索召回率 |
| 仅靠假设就有约 60% | "not"、"never" 泄漏了标签 | 仅假设基线，ANLI |
| 长前提上掉 20+ F1 | 句子级 NLI 模型 | 使用在 DocNLI 上训练的模型 |
| 零样本摆动 10+ 分 | 模板敏感 | 调 `hypothesis_template` |
| Hindi 输出微妙地错了 | 每个词 3-5x tokens | 检查 fertility，`byte_fallback=True` |

## 默认值与数字
type: defaults
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/code/main.py, phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| TextRank `damping` | 0.85 | PageRank 默认值 |
| TextRank `iterations` | 50 | 低于 `epsilon` 1e-4 时提前停止 |
| BART `max_length` | 120 | 配合 `min_length=60` |
| 拒绝 `threshold` | 0.3 | 最高检索分数低于它：拒绝 |
| `is_faithful` 阈值 | 0.5 | 蕴含分数必须高于它 |
| Few-shot 例子 | 100-500 | 目标语言。达到英语的 95-98% |
| `learning_rate` | 2e-5 | 更高的学习率会崩掉对齐 |
| `num_train_epochs` | 5 | 对 100-500 个例子是稳妥的 |

## 缩写
type: glossary
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

- **ROUGE**：Recall-Oriented Understudy for Gisting Evaluation。N-gram 与 LCS 重叠。
- **SQuAD**：Stanford Question Answering Dataset。EM 和 F1 指标。
- **NLI**：自然语言推理。蕴含、矛盾或中立。
- **RTE**：识别文本蕴含。NLI 的旧名。
- **MultiNLI**：跨 10 个体裁的 433k 对。标准 NLI 训练语料。
- **ANLI**：对抗 NLI。人类写了对来击破模型。
- **XLM-R**：CommonCrawl 上的 100 语言 RoBERTa。Base 270M，Large 550M。
- **NLLB**：No Language Left Behind。200 种语言，55 种低资源。

## 选一个模型
type: command-table
from: phases/05-nlp-foundations-to-advanced/12-text-summarization/docs/en.md, phases/05-nlp-foundations-to-advanced/13-question-answering/docs/en.md, phases/05-nlp-foundations-to-advanced/18-multilingual-nlp/docs/en.md, phases/05-nlp-foundations-to-advanced/21-nli-textual-entailment/docs/en.md

| 命令 | 作用 |
|---|---|
| `facebook/bart-large-cnn` | 3 到 5 句的新闻摘要，英语 |
| `google/pegasus-pubmed` | 科学论文摘要 |
| `philschmid/bart-large-cnn-samsum` | 对话摘要 |
| `deepset/roberta-base-squad2` | 从给定段落中取答案跨度 |
| `facebook/bart-large-mnli` | 轻量零样本分类 |
| `cross-encoder/nli-deberta-v3-base` | 边缘侧的快速 NLI |
| `joeddav/xlm-roberta-large-xnli` | 多种语言的零样本分类 |
| `facebook/nllb-200-distilled-600M` | 翻译，200 种语言 |
