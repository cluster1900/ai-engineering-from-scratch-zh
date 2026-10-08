# Resolução de Coreferência

>  ela telefonou para ele. Não recebeu.  Médico em almoço.  Três referências, dirigidas a duas pessoas.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

## 问题
De um artigo de 300 palavras, extrair de cada menção da Apple Inc. o artigo escreve que a Apple  时很简单.

Coreference Resolution 会把所有指向同一个真实世界实体的表达链接到一个集群 中――它是表层 NLP (NER, parsing) 和下游语义任务 (IE,QA,总结,KG) 合剂.

Por que é importante em 2026:

- Resumo:O CEO anunciou... vs Tim Cook anunciou...  resumo 应该说出 CEO 的名字──
- Pergunta respondendo: a quem ela ligou?
- Extração de informações: um gráfico de conhecimento 里同时有 PER1 fundado Apple 和 Jobs fundado Apple 作为不同条目,这是错的──
- Multi-document IE:合并多篇关于同一事件文章中的提到,就是跨文档核心参考――

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入: a clustering de um documento, cada um deles orientado para uma entidade.

**Mention types.**

- **Named entity.**Tim Cook
- **Nominal.**O CEO da empresa
- **Pronominal.**Ele, ela, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, eles, e eles, eles, eles, eles, eles, eles, eles, eles, eles, são, e eles, eles, são, são, e eles, eles, são, eles, e eles, são, são, são, e eles, são, e eles, são, e eles, são, são, e eles, e eles, e eles, e eles, são, e eles, são, e, e, e, e, e, e, e, eu, são, são, eu, são, são, e, e, eu, eu, eu, eu, são, eu, são, são, são, e, e, e, e, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu, eu,
- **Appositive.**Tim Cook, CEO da Apple,

**Architectures.**

1. **Rule-based (Hobbs, 1978).**Baseado na resolução do pronome de árvore sintática, use regras gramaticais. Muito boa linha de base.
2. **Mention-pair classifier.**Para cada um dos pontos de referência, a pré-experimentação de se são mais importantes é feita através do fechamento transitivo.
3. **Mention-ranking.**Para cada menção, 排序候选前史 (incluindo 無前史) ︎
4. **Span-based end-to-end (Lee et al., 2017).**Transformador encoder──枚举所有长度上限内的候选 span──预测 menção pontuação──为每 span 预测 antecedent-probability──贪心聚类──现代默认方案──
5. **Generative (2024+).**Prompt 一个 LLM:Lista todos os pronúncios neste texto e seus antecedentes. 在简单案例上效果不错,但在长文档和少见引用上会吃力──

**The evaluation metrics.**Há cinco indicadores padrão ((MUC、B3、CEAF、BLANC、LEA), pois não há um único indicador que possa capturar completamente o aglomerado de qualidade。 relatório de três de média como CoNLL F1。2026 ano CoNLL-2012 superior de estado da arte: cerca de 83 F1。

**Known hard cases.**

- Descrição definida:
- A ponte de anafora das rodas → 之前提到一辆车)。
- China  日文等语言中零 анафора。
- Cataphora ((pronom 出现在引用 之前):When **she**Entrou, a Mary sorriu.


```figure
coref-links
```

## Construí-lo
### 步骤 1: coreferência neural pré-treinada (AllenNLP / spaCy-experimental)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

Em um documento maior, você vai obter um resultado semelhante:
- Cluster 1: [Apple, a empresa, eles]
- Cluster 2: [novos produtos]

### 步骤 2: resolve pronome baseado em regras (ensino)

- Não .`code/main.py`Na prática, apenas usando stdlib:

1. 抽取 menção: entidades denominadas (span)  pronúncios (span)  procura direta (span)  descrições definidas (span) 
2. Para cada pronome, veja antes K 个 menção,并按以下因素打分:
   - acordo de gênero/número (heurística)
   - Recentemente (越近越优)
   - papel sintático (subject prioritário)
3. 链接最高分前史──

Não é possível competir com modelos neurais, mas mostra o espaço de pesquisa, bem como o modelo de ponta a ponta, que é necessário tomar decisões.

### 步 3: Utilização de LLM  realizar um processo de

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

需要注意两种失败模式――第一,LLMs 会过度合并(把指向两个不同人的him和her合并)――第二,LLMs 会在长文档中漏掉提到――始终使用跨度抵消检查验证――

### 步骤 4: avaliação

标准 conll-2012 script 会计算 MUC、B3、CEAF-φ4,并报告平均值──对于内部 eval,先在带标注的测试集 上做跨度级精度和回忆,再加入提到链接 F1──

## 陷
- **Singleton explosion.**Alguns sistemas vão colocar cada menção em seu próprio cluster.
- **Pronouns in long context.**Documentos de mais de 2.000 tokens.
- **Gender assumptions.**硬编码性别规则 会在非二进制引用者、组织、动物 上失效──使用学习模型或中立评分──
- **LLM drift on long docs.**单次 API 调用不可靠地对 50+ 段落中的提到 聚类──使用滑窗+ merge──

## Use-o
Estaca de 2026:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026 年能上线的整合模式:先运行 NER,再运行 coref,把 coref clusters 合并进 NER entities──下游任务看到的是每个 cluster一个实体,而不是每个提到一个实体──

## Entrega-o
保存为 `outputs/skill-coref-picker.md`- Não .

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
1. **Easy.**Em`code/main.py`中对 5 个手写段落运行 resolver baseado em regras.
2. **Medium.**Em um artigo de notícias, usando um modelo de núcleo neural pré-treinado, você vai cluster com sua própria anotação manual em comparação.
3. **Hard.**Construir um pipeline de NER reforçado: primeiro NER, repassando os clusters de núcleo 合并──衡量 100 篇文章上对 NER-only entities-coverage improvement──

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
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045) 基于 span 的端到端──
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进 coref  改进 coref  改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改进 coref 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f 改f
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) referência。
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) regras baseadas 经典方法──
