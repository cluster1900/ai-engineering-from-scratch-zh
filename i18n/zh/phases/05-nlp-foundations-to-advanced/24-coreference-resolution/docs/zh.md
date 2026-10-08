# 核心提议

> 她打电话给他. 他没有接电话.医生在吃午饭.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

## 问题
从一篇300字文章中抽取果公司的每一个提及──文章写 果公司 时很简单──写 公司、the、Cupertino的科技巨头或Jobs公司时就很难──如果这些提及并非被解析到一个实体,你的NER管道会丢失60-80%的提及──

核心解析会把所有指向一个真实世界实体的表达链接到一个集群中. 它是表层NLP (NER,解析) 与下游语义任务 (IE,QA,总结,KG) 之间的合剂.

为什么在2026年重要:

- 总结:首席执行官宣布...vs蒂姆·库克宣布... 总结 应该说出首席执行官的名字──
- 答案:她打电话给谁?
- 信息提取:一个知识图 里同时有 PER1创立了果 和 就业公司创立了果 作为不同条目,这是错的.
- 关于同一事件文章中的提到,就是跨文档核心参考.

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入:一个文件──输出:提到的集,其中每个集指向一个实体──

**Mention types.**

- **Named entity.**蒂姆·库克
- **Nominal.**CEO,公司
- **Pronominal.**他,她,他们,它
- **Appositive.**果公司首席执行官蒂姆·库克

**Architectures.**

1. **Rule-based (Hobbs, 1978).**基于语法树的代词解析度,使用语法规则──很好的基线──在代词上意外地难以超越──
2. **Mention-pair classifier.**对于每一对提到的情况,预测它们是否更重要.
3. **Mention-ranking.**对于每一个提及,排序候选前 (包括没有前) 选择最高分.
4. **Span-based end-to-end (Lee et al., 2017).**变压器编码器――枚举所有长度上限内的候选期――预测提及分数――为每个期 预测前概率――贪心聚类――现代默认方案――
5. **Generative (2024+).**简单案例上效果不错,但在长文档和少见引用者上会吃力.

**The evaluation metrics.**有五个标准标志 (MUC、B3、CEAF、BLANC、LEA),因为没有单个标志能完整地捕捉集群质量――报告前三个的平均值作为CNLL F1──2026年CNLL-2012上市的最新状态:约83 F1──

**Known hard cases.**

- 确定的描述 指向数页之前引入的实体――
- 桥梁轮 → 之前提到的一辆车) 』
- 中文、日文等语言中零的法.
- 章 (章) 出现在引用者 之前):**she**走进,玛丽笑了.


```figure
coref-links
```

## 构建它
### 步骤1:预训练神经核心 (AllenNLP / spaCy-实验)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

在更长的文件上,你会得到类似的结果:
- 集团1: [果,公司,他们]
- 集团2: [新产品]

### 步骤 2:基于规则的代名词解决器 (教学)

查看`code/main.py`中仅使用 stdlib 的实现:

1. 抽取提到:名字实体 (大写 span) 代名词 (直查) 定义描述 (the X) 
2. 对于每个代词,查看前 K 个提及,并按以下因素打分:
   - 性别/数量协议 (理性)
   - 现在,我还在.
   - 语法作用 (优先主题)
3. 链接最高分前──

这与神经模型竞争不起,但它展示了搜索空间,以及结尾到结尾模型必须做出决策.

### 步骤3:使用 LLM 进行共指消解

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

需要注意两种失败模式. 第一,LLMs 会过度合并.

### 步骤4:评估

标准 conll-2012脚本 会计算MUC、B3、CEAF-φ4,并报告平均值──对于内部评估,先在带标注的测试集 上做跨度水平精确和回忆,再加入引用链接 F1──

## 陷
- **Singleton explosion.**一些系统将每个提及都报告为自己的集群.
- **Pronouns in long context.**超过2000个代币的文件 上性能会下降约15 F1――谨慎的部分――
- **Gender assumptions.**硬编码性别规则 会在非二进制参考,组织,动物上失效.
- **LLM drift on long docs.**单次 API 调用可靠地对50+段落中的提到 聚类――使用滑动窗口+ merge――

## 使用它
2026 年的堆:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026年能上线的集成模式:先运行NER,再运行coref,把核心集群合并进NER实体――下游任务看到每个集群是一个实体,而不是每个提到一个实体――

## 交付它
保存为`outputs/skill-coref-picker.md`其他:

```markdown
---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Given a use case (single-doc / multi-doc, domain, language), output:

1. Approach. Rule-based / neural span-based / LLM-prompted / hybrid. One-sentence reason.
2. Model. Named checkpoint if neural.
3. Integration. Order of operations: tokenize → NER → coref → downstream task.
4. Evaluation. CoNLL F1 (MUC + B³ + CEAF-φ4 average) on held-out set + manual cluster review on 20 documents.

Refuse LLM-only coref for documents over 2,000 tokens without sliding-window merge. Refuse any pipeline that runs coref without a mention-level precision-recall report. Flag gender-heuristic systems deployed in demographically diverse text.
```

## 练习
1. **Easy.**在`code/main.py`中对 5 个手写段落运行规则为基础的解决方案――使用基础真理 衡量引用链接的准确性――
2. **Medium.**在一篇新闻文章中使用预先训练的神经核心模型.
3. **Hard.**构建一个核心增强的NER管道:先NER,再通过核心集群 合并──衡量100篇文章上

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mention | 一个 reference | 一段指向某个 entity 的文本（name、pronoun、noun phrase）。 |
| Antecedent | “it” 指向什么 | 后续 mention 与之 corefer 的更早 mention。 |
| Cluster | entity 的 mentions | 全部指向同一个真实世界 entity 的 mention 集合。 |
| Anaphora | 后向 reference | 后续 mention 指向更早内容（“he” → “John”）。 |
| Cataphora | 前向 reference | 更早 mention 指向后续内容（“When he arrived, John...”）。 |
| Bridging | 隐式 reference | “I bought a car. The wheels were bad.”（那辆 car 的 wheels。） |
| CoNLL F1 | leaderboard 上的数字 | MUC、B³、CEAF-φ4 F1 scores 的平均值。 |

## 延伸阅读
- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) 经典教材章节──
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) 基于跨度的端到端.
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进核心的预训练.
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/)基准量
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064)基于规则的经典方法.
