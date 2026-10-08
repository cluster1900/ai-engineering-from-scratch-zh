# 自然语言推理  文本含

> "t entails h" 的意思是,读者读 t后会得出 h 为真实的结论.

**类型：**学习 课程
**语言：**字符串
**先修：**五期05期 (情感分析),五期13期 (回答问题)
**时间：**时间60分钟

## 问题

你构建了一个总结器. 它生成了一个总结. 你怎么知道这个总结没有幻觉?

你建立了一个聊天机器人. 它回答说"是的".你怎么知道这个答案?

你需要按主题分类10,000篇新闻文章. 你没有训练标签.

这三个问题都可以归结为自然语言推理.`t`和一个假设`h`没有任何`h`是由`t`涉及到,矛盾,还是中立?

- **Hallucination check:** `t`= 源文件,`h`没有结论 =幻觉――
- **Grounded QA:** `t`= 获取的通道,`h`没有结论 = 捏造――
- **Zero-shot classification:** `t`=文件,`h`包含 =预测标签──

这就是为什么每个RAG评估框架都会带上一个NLI模型.

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t`其他`h`"猫在床上"意味着"有猫".
- **Contradiction.** `t``h`"猫在床上"与"没有猫"相矛盾.
- **Neutral.**双向都无法推断:"猫在床上"对"猫饿了"是中立的.

**不是逻辑 entailment。**简单的说法是"自然"的,也就是典型的人文读者会推断的内容,而不是严格的逻辑.

**Datasets。**

- **SNLI**(2015)──570k 人工标注对,以图像标题 作为前提──领域较窄──
- **MultiNLI**通过10个类型的433k对子.
- **ANLI**(2019) ・ 针对性的NLI──人类专门编写用于击中现有模型的例子──更难──
- **DocNLI, ConTRoL**文件长度的前提――测试多跳和长距离推断――

**架构。**一个变压器编码器 (BERT,ROBERTA,DEBERT) 读取`[CLS] premise [SEP] hypothesis [SEP]`,我知道.`[CLS]`在MNLI上训练,在持久的基准上评估,在在分发对上获得90%+的准确性.

**通过 NLI 做 zero-shot。**给定一个文件和候选标签,把每个标签转化为一个假设:"这篇文章是关于体育")`zero-shot-classification`管道后的机制――


```figure
nli-router
```

## 构建它

### 步骤1:运行一个预训练的NLI模型

```python
from transformers import pipeline

nli = pipeline("text-classification",
               model="facebook/bart-large-mnli",
               top_k=None)  # return all labels; replaces deprecated return_all_scores=True

premise = "The cat is sleeping on the couch."
hypothesis = "There is a cat in the room."

result = nli({"text": premise, "text_pair": hypothesis})[0]
print(result)
# [{'label': 'entailment', 'score': 0.97},
#  {'label': 'neutral', 'score': 0.02},
#  {'label': 'contradiction', 'score': 0.01}]
```

对于生产级的NLI,`facebook/bart-large-mnli`和 `microsoft/deberta-v3-large-mnli`是开源默认选择――DeBERTa-v3 位居排行榜前列――

### 步骤2:零射击分类

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认模板是"这个例子是关于 {标签}."──可用`hypothesis_template`自定义──不需要训练数据──不需要细节调整──开箱即用──

### 步骤3: RAG 的忠诚度检查

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

这是RAGAS忠诚度的核心. 得到的答案将分成原子索赔.

### 步骤 4: 手写 NLI分类器 (概念版)

查看`code/main.py`中仅使用stdlib的玩具:前提和假设 通过词汇重叠 +否定检测 进行比较――它无法与变压器模型竞争,但显示任务的形状:输入两段文本,输出三向标签,损失 = `{entail, contradict, neutral}`它们是的.

## 陷

- **Hypothesis-only shortcuts.**模型只看假设就能在SNLI上以60%的准确率预测标签,因为"没有""",没有人""",从来没有"与矛盾相关.
- **Lexical overlap heuristic.**后续的论 每次都被带来的) 能通过SNLI,但会在HANS/ANLI上失败使用对抗性基准──
- **Document-length degradation.**单句NLI模型在文档长度的场所上会下降 20+F1──长上下文应使用 DocNLI训练模型──
- **Zero-shot template sensitivity.**"这个例子是关于 {标签}"、"{标签}"、"主题是 {标签}" 之间可能导致准确性 波动 10+点──需要调优模板──
- **Domain mismatch.**法律、医疗和科学文本需要专业的NLI模型 (例如SciNLI,MedNLI) 

## 使用它

根据第1个单元的规定,

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

2026年的超级模式:NLI是文本理解的万能──只要你需要判断A是否支持B?或A是否与B?相矛盾在发起另一个LLM电话之前,先考虑NLI──

## 交付它

保存为`outputs/skill-nli-picker.md`其他:

```markdown
---
name: nli-picker
description: Pick an NLI model, label template, and evaluation setup for a classification / faithfulness / zero-shot task.
version: 1.0.0
phase: 5
lesson: 21
tags: [nlp, nli, zero-shot]
---

Given a use case (faithfulness check, zero-shot classification, document-level inference), output:

1. Model. Named NLI checkpoint. Reason tied to domain, length, language.
2. Template (if zero-shot). Verbalization pattern. Example.
3. Threshold. Entailment cutoff for the decision rule. Reason based on calibration.
4. Evaluation. Accuracy on held-out labeled set, hypothesis-only baseline, adversarial subset.

Refuse to ship zero-shot classification without a 100-example labeled sanity check. Refuse to use a sentence-level NLI model on document-length premises. Flag any claim that NLI solves hallucination — it reduces it; it does not eliminate it.
```

## 练习

1. **Easy.**在20个手写的前提,假设,标签)三倍上运行`facebook/bart-large-mnli`加入反向的"次序"陷 (反过来是"我吃了蛋糕"),看看它会否失效.
2. **Medium.**在 100 条 AG新闻头条上比较零射击模板`"This text is about {label}"`,我知道.`"The topic is {label}"`和 `"{label}"`△报告精度波动――
3. **Hard.**构建一个RAG忠诚度检查器:原子声称分解+每一个声称做NLI──在50个带金语境内的RAG生成的答案上评估──测量对人工标签的错误积极和错误负面率──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| NLI | Natural Language Inference | premise-hypothesis 关系的 3-way classification。 |
| RTE | Recognizing Textual Entailment | NLI 的旧名称；同一任务。 |
| Entailment | "t implies h" | 给定 t，典型读者会得出 h 为真的结论。 |
| Contradiction | "t rules out h" | 给定 t，典型读者会得出 h 为假的结论。 |
| Neutral | "undecided" | 从 t 到 h 双向都无法推断。 |
| Zero-shot classification | NLI as classifier | 把 labels verbalize 成 hypotheses，选择最大 entailment。 |
| Faithfulness | 答案是否有支持？ | 在（retrieved context, generated answer）上做 NLI。 |

## 延伸阅读
- [Bowman et al. (2015). A large annotated corpus for learning natural language inference](https://arxiv.org/abs/1508.05326) SNLI。
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) 多种子
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) ANLI基准点――
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classifier──
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) 2026 年的NLI 主力──
