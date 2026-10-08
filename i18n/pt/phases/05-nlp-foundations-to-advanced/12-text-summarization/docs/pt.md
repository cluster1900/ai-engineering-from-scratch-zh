# Resumo do texto

> O sistema extractivo diz-te o que o documento diz. O sistema abstractivo diz-te o autor quer expressar o que.

**类型：**Construir
**语言：**Python
**先修：**Fase 5 · 02 (BoW + TF-IDF), Fase 5 · 11 (Tradutora automática)
**时间：**- 75 minutos.

## 问题

Uma frase de 2.000 palavras de notícias entra em seu feed. Você precisa usar 120 palavras para capturar seu núcleo. Você pode escolher entre as três frases mais importantes do artigo. Você também pode reescrever o seu próprio conteúdo.

Resumo extractivo é um problema de ordem.`k`个──输出总是语法正确, pois é extraído de cada palavra do original──风险 lies in omission scattered throughout the whole text.

A resumidação abstrata é um problema de geração. Um transformador em condições de entrada gera um novo texto.

Este curso irá construir ambas as coisas, e mostrar o modo de falha de cada um deles.

## 概念

![Extractive TextRank vs abstractive transformer](../assets/summarization.svg)

**Extractive。**将文章视为一个图,其中节点是句子,边缘是相似度──在图上运行 PageRank (或类似方法),根据句子与其他所有内容的连接程度给句子打分──得分最高的句子就是总结──经典实现是**TextRank**(Mihalcea e Tarau, 2004):

**Abstractive。**Em pares de resumo de documento 上 fine-tune 一个变体编码码码码器(BART、T5、Pegasus) ⋅在推断时,model 读取文档,并通过横断注意 逐代币 生成总结──Pegasus 尤其使用差句预训目标,使它在不需要太多的细调的情况下非常适合总结──

Utilização **ROUGE**(Recall-Oriented Understudy for Gisting Evaluation) 评估──ROUGE-1 和 ROUGE-2 衡量 unigram 和 bigram overlap──ROUGE-L 衡量最长的常见次序──越高越好,但40 ROUGE-L 算好,50 算例外──每篇论文都会报告这三项──使用 `rouge-score`Pacote:


```figure
summarize-collapse
```

## Construção

### 步骤 1: TextRank(extractivo)

```python
import math
import re
from collections import Counter


def sentence_split(text):
    return re.split(r"(?<=[.!?])\s+", text.strip())


def similarity(s1, s2):
    w1 = Counter(s1.lower().split())
    w2 = Counter(s2.lower().split())
    intersection = sum((w1 & w2).values())
    denom = math.log(len(w1) + 1) + math.log(len(w2) + 1)
    if denom == 0:
        return 0.0
    return intersection / denom


def textrank(text, top_k=3, damping=0.85, iterations=50, epsilon=1e-4):
    sentences = sentence_split(text)
    n = len(sentences)
    if n <= top_k:
        return sentences

    sim = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                sim[i][j] = similarity(sentences[i], sentences[j])

    scores = [1.0] * n
    for _ in range(iterations):
        new_scores = [1 - damping] * n
        for i in range(n):
            total_out = sum(sim[i]) or 1e-9
            for j in range(n):
                if sim[i][j] > 0:
                    new_scores[j] += damping * sim[i][j] / total_out * scores[i]
        if max(abs(s - ns) for s, ns in zip(scores, new_scores)) < epsilon:
            scores = new_scores
            break
        scores = new_scores

    ranked = sorted(range(n), key=lambda k: scores[k], reverse=True)[:top_k]
    ranked.sort()
    return [sentences[i] for i in ranked]
```

Há duas coisas que vale o valor de um ponto de referência. Função de semelhança Utilize log-normalized word overlap, é o cosínio dos vetores de TextRank 变体──TF-IDF. Também pode ser usado.

### 步骤 2: usar BART fazer abstracto

```python
from transformers import pipeline

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

article = """(long news article text)"""

summary = summarizer(article, max_length=120, min_length=60, do_sample=False)
print(summary[0]["summary_text"])
```

BART-large-CNN em CNN/DailyMail corpus 上 精细调──它开箱即可生成新闻风格的摘要──对于其他领域(论文、对话、法律),使用对应的Pegasus checkpoint,或在你的目标数据上精细调──

### 步骤 3: Avaliação ROUGE

```python
from rouge_score import rouge_scorer

scorer = rouge_scorer.RougeScorer(["rouge1", "rouge2", "rougeL"], use_stemmer=True)
scores = scorer.score(reference_summary, generated_summary)
print({k: round(v.fmeasure, 3) for k, v in scores.items()})
```

始终使用 stemming──否则, "running" 和 "run" 会被算作不同词,ROUGE 会低估──

### ROUGE 之外(2026 avaliação de resumo)

Durante vinte anos, ROUGE foi sempre uma métrica de resumo predominante, mas em 2026 já não foi suficiente. Uma meta-análise em grande escala de artigos NLG mostrou:

- **BERTScore**(contextual embedding similarity) em 2023 前後継続獲得採用,現在多数概要論文 会与 ROUGE 一起報告──
- **BARTScore** avaliação 视为世代: Baseada no BART pré-treinado  em uma determinada fonte                                                                                                                                                                                                                                                   
- **MoverScore**(embutidos contextuais de cima da distância do Mover da Terra) alcançou o primeiro lugar entre os benchmarks de resumo em 2025, porque é melhor capturar sobreposição semântica do que o ROUGE.
- **FactCC**和 **QA-based faithfulness**Em 2021-2023 anos muito comum, agora frequentemente **G-Eval**替代(1 GPT-4 chain prompt, através de raciocínio de cadeia de pensamento para a coerência, coerência, fluência, relevância 打分)
- **G-Eval**E assim, no que diz respeito à disciplina de Jurisprudência, a avaliação humana é de aproximadamente 80% igual à da disciplina.

Recomendação de produção: relatório ROUGE-L Utilizado para comparação herdada, BERTScore Utilizado para sobreposição semântica, G-Eval Utilizado para coerência e factualidade.

### 步骤 4: factualidade  problemas

Resumos abstratos  são facilmente alucinantes                                                                                                                                                                                                                                                        

需要点名的幻觉 类型:

- **Entity swap。**Fonte 写 é "John Smith". Resumo 写成 "John Brown".
- **Number drift。**A fonte é "25.000". Resumo é "25 milhões".
- **Polarity flip。**Fonte 写成 é "rejeitou a oferta". Resumo 写成 "aceitou a oferta".
- **Fact invention。**A fonte não menciona o CEO. Resumo diz que o CEO aprovou.

As abordagens de avaliação eficazes:

- **FactCC。**Um classificador binário, treinamento objetivo é a implicação entre a frase fonte e a frase resumida 。预测 factual/non-factual。
- **QA-based factuality。**让QA model 提出答案在源中问题──如果总结 支持不同答案,则标记──
- **Entity-level F1。**Comparar a fonte com a soma das entidades nomeadas no meio.

对于任何面向用户和事实性 重要内容(novações, médicos, legais, financeiros), extractiva é mais segura de默认选择──abstractiva 需要加入在流程中事实性检查──

## Utilização

Estaca 2026:

| Use case | Recommended |
|---------|-------------|
| News, 3-5 sentence summary, English | `facebook/bart-large-cnn` |
| Scientific papers | `google/pegasus-pubmed` or a tuned T5 |
| Multi-document, long-form | Any LLM with 32k+ context, prompted |
| Dialog summarization | `philschmid/bart-large-cnn-samsum` |
| Extractive, low hallucination risk by construction | TextRank or `sumy`'s LSA / LexRank |

Quando a computação não é limitada, os LLM de longo contexto em 2026 geralmente superam os modelos especializados.

## 发布

保存为 `outputs/skill-summary-picker.md`- Não .

```markdown
---
name: summary-picker
description: 选择 extractive 或 abstractive、指定 library、factuality check。
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

给定一个任务（document type、compliance requirement、length、compute budget），输出：

1. Approach。Extractive 或 abstractive。用一句话解释原因。
2. Starting model / library。写出名称。`sumy.TextRankSummarizer`、`facebook/bart-large-cnn`、`google/pegasus-pubmed`，或一个 LLM prompt。
3. Evaluation plan。ROUGE-1、ROUGE-2、ROUGE-L（使用带 stemming 的 rouge-score）。如果是 abstractive，再加 factuality check。
4. 一个需要探查的 failure mode。Entity swap 是 abstractive news summarization 中最常见的问题；标记 source entities 未出现在 summary 中的 samples。

如果没有 factuality gate，则拒绝对 medical、legal、financial 或 regulated content 使用 abstractive summarization。将超过 model context window 的输入标记为需要 chunked map-reduce summarization（而不是简单 truncation）。
```

## 练习

1. **Easy。**Em 5 篇新闻文章上运行 TextRank──将 top-3 句子与参考摘要比较──测量 ROUGE-L──你应该能在CNN/DailyMail-style文章上看 30-45 ROUGE-L──
2. **Medium。**实现实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实实
3. **Hard。**Em 50 artigos da CNN/DailyMail 上比较 BART-big-CNN与一个LLM(Claude或GPT-4)──报告 ROUGE-L、事实性(通过实体F1)和成本每摘要──记录各自胜出的场景──

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Extractive | 选句子 | 从 source 中逐字返回句子。永不 hallucinate。 |
| Abstractive | 重写 | 在 source 条件下生成新文本。可能 hallucinate。 |
| ROUGE | Summary metric | system output 与 reference 之间的 N-gram / LCS overlap。 |
| TextRank | Graph-based extractive | sentence similarity graph 上的 PageRank。 |
| Factuality | 是否正确 | summary claims 是否由 source 支持。 |
| Hallucination | 编造内容 | summary 中 source 不支持的内容。 |

## 延伸阅读

- [Mihalcea and Tarau (2004). TextRank: Bringing Order into Texts](https://aclanthology.org/W04-3252/) extrativo 经典论文──
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training](https://arxiv.org/abs/1910.13461) BART 论文──
- [Zhang et al. (2019). PEGASUS: Pre-training with Extracted Gap-sentences](https://arxiv.org/abs/1912.08777) Pegasus 和 objetivo de frase de diferença
- [Lin (2004). ROUGE: A Package for Automatic Evaluation of Summaries](https://aclanthology.org/W04-1013/)Papel vermelho.
- [Maynez et al. (2020). On Faithfulness and Factuality in Abstractive Summarization](https://arxiv.org/abs/2005.00661) papel de paisagem de facto¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
