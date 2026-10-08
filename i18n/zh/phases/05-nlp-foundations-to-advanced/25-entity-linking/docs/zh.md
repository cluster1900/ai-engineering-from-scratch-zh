# 实体链接与消歧

> 没有链接,你的知识图仍然是模糊的.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

## 问题

句子写道:"约旦击败了媒体. " 你的NER把"约旦"标记为个体.

- 马克尔·乔丹?
- 迈克尔·B.乔丹?
- 伯克利的 ML 教授是的,这种混在 ML 论文里真的存在吗?
- 约旦?
- 乔丹 (希伯来语) 是什么?

实体链接 (EL) 会把每个提及解析到知识库 中的唯一条目:维基数据、维基百科、DBpedia,或你的域名 KB──两个子任务:

1. **Candidate generation。**给定"约旦",哪些 KB 条目是可能的?
2. **Disambiguation。**给定下文,哪个候选人才是正确的?

两步可以学习. 两步都有基准. 组合后的管道已经稳定了十年.

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定提到表面形式 (("约旦"),在称索引中查找候选人──维基百科称词典 覆盖大多数命名实体:"JFK" →约翰·F·肯尼迪、杰克林·肯尼迪、JFK机场、JFK(电影) ─典型索引 会为每个提到 返回 10-30个候选人──

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`◎ 效果好,速度快,不需要训练.
2. **Embedding-based (ESS / REL / Blink)。**编码说明 + 文本――编码每个候选人的描述――选择最大的――2020-2024年默认方法――
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 Token 解码实体的正规名称──被限制在一个有效的实体名称的试验,因此输出保证是有效的 KB id──

**End-to-end vs pipeline。**现代模型 (ELQ、BLINK、ExtEnD、GENRE) 在一次通过中运行NER +候选生成 + 曖昧化――管道系统在生产中仍然占主导地位,因为你可以替换组件――

### 两个指标

- **Mention recall (candidate gen)。**现在的候选人名单中的比例.
- **Disambiguation accuracy / F1。**给定正确的候选人,前一有很多正确的.

始终同时报告两者――一个在80%的候选人回忆上有99%的置疑的系统,本质上是80%的管道――


```figure
gx-entity-linking
```

## 构建它

### 步骤1:从维基百科转向 构建称索引

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

维基百科的号数据:约18M个 (号,实体) 双子.

### 步骤2:基于文本的置歧义

```python
def disambiguate(mention, context, alias_index, entity_desc):
    candidates = alias_index.get(mention.lower(), [])
    if not candidates:
        return None, 0.0
    context_words = set(tokenize(context))
    best, best_score = None, -1
    for entity_id in candidates:
        desc_words = set(tokenize(entity_desc[entity_id]))
        union = len(context_words | desc_words)
        score = len(context_words & desc_words) / union if union else 0.0
        if score > best_score:
            best, best_score = entity_id, score
    return best, best_score
```

杰卡德重叠是一个玩具. 用嵌入式上方的宇宙相似性.`code/main.py`步骤2:

### 步骤3:基于嵌入式的模

```python
from sentence_transformers import SentenceTransformer
encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_mention(text, mention_span):
    start, end = mention_span
    marked = f"{text[:start]} [MENTION] {text[start:end]} [/MENTION] {text[end:]}"
    return encoder.encode([marked], normalize_embeddings=True)[0]

def embed_entity(entity_id, description):
    return encoder.encode([f"{entity_id}: {description}"], normalize_embeddings=True)[0]
```

在索引时间,对每个 KB实体嵌入一次――在查询时间,对提到+文本嵌入一次,对候选人群做点产品,选择最大值――

### 步骤 4:生成性实体链接

GENRE 会逐字符解码实体的维基百科标题──限制解码──见第20课) 确保只能输出有效标题──它与 KB 支持的试验密集成──现代后继是REL-GEN,以及带有结构化输出的LLM 促成的EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合白名单`choice`),这是2026年最容易上线的电气管道.

### 步骤5:在AIDA-CoNLL上评估

据悉,在"中国"中,美国的"中国"的数据量是"中国"的.`P@1`)和KB以外的NIL检测率──

## 陷

- **NIL handling。**系统必须预测NIL,而不是猜错实体――单独衡量――
- **Mention boundary errors。**美国银行"只标志为"银行")
- **Popularity bias。**训练出来的系统会过度预测频繁的实体――ML论文中文"迈克尔I.乔丹"往往会链接到篮球乔丹――
- **Cross-lingual EL。**把中文文本中的提及映射到英语维基百科实体――需要多语言编码或翻译步骤――
- **KB staleness。**新公司、新事件、新人物不在去年的维基百科垃圾库里──生产管道需要更新循环──

## 使用它

2026 年的堆:

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026年可上线的生产模式:NER → coref → 对每个提到做EL → 将集群折叠成每个集群一个定律实体――输出:文件 中每个实体一个 KB id,而不是每个提到一个――

## 交付它
保存为`outputs/skill-entity-linker.md`其他:

```markdown
---
name: entity-linker
description: Design an entity linking pipeline — KB, candidate generator, disambiguator, evaluation.
version: 1.0.0
phase: 5
lesson: 25
tags: [nlp, entity-linking, knowledge-graph]
---

Given a use case (domain KB, language, volume, latency budget), output:

1. Knowledge base. Wikidata / Wikipedia / custom KB. Version date. Refresh cadence.
2. Candidate generator. Alias-index, embedding, or hybrid. Target mention recall @ K.
3. Disambiguator. Prior + context, embedding-based, generative, or LLM-prompted.
4. NIL strategy. Threshold on top score, classifier, or explicit NIL candidate.
5. Evaluation. Mention recall @ 30, top-1 accuracy, NIL-detection F1 on held-out set.

Refuse any EL pipeline without a mention-recall baseline (you cannot evaluate a disambiguator without knowing candidate gen surfaced the right entity). Refuse any pipeline using LLM-prompted EL without constrained output to valid KB ids. Flag systems where popularity bias affects minority entities (e.g. name-clashes) without domain fine-tuning.
```

## 练习

1. **Easy。**在`code/main.py`中,基于10个模糊的提及 (巴黎,约旦,果) 实现先前+文本分歧者――手动标注正确实体――测量精度――
2. **Medium。**用语句变压器编码50个模糊的提及──Embed 每个候选人的描述──比较基于嵌入的模糊和Jaccard的背景重叠──
3. **Hard。**构建一个1k实体域 KB(例如你公司的员工+产品) ――实现端到端 NER + EL──在100条中延续的句子上测量精度和回忆──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Entity linking (EL) | Link 到 Wikipedia | 将 mention 映射到唯一 KB entry。 |
| Candidate generation | 它可能是谁？ | 为 mention 返回一个 plausible KB entries 的 shortlist。 |
| Disambiguation | 选对的那个 | 使用 context 为 candidates 打分，选择 winner。 |
| Alias index | Lookup table | 从 surface form → candidate entities 的映射。 |
| NIL | 不在 KB 中 | 明确预测没有匹配的 KB entry。 |
| KB | Knowledge base | Wikidata、Wikipedia、DBpedia，或你的 domain KB。 |
| AIDA-CoNLL | Benchmark | 带 gold entity links 的 1,393 篇 Reuters articles。 |

## 延伸阅读
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf)基本的先+文本 方法──
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于嵌入主力方法.
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带限制解码的生成EL──
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf)基准论文──
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969)开源生产堆
