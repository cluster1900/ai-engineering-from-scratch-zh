# Naturalidade linguística  文本含

> "t implica h" significa que, quando alguém lê t 后会得出 h 为真实的结论──NLI é uma tarefa de previsão de envolvimento / contradição / neutralidade── aparentemente seca, mas desempenha um papel fundamental na produção──

**类型：**- aprendizagem
**语言：**Python
**先修：**Fase 5 · 05 (Análise do Sentimento), Fase 5 · 13 (Resposta à Pergunta)
**时间：**- 60 minutos.

## 问题

Você construiu um resumo. Ele gerou um resumo. Como sabe que este resumo não contém alucinações?

Você construiu um chatbot. Ele respondeu "sim". Como é que sabe a resposta?

Você precisa de 10 mil artigos de notícias por tópico. Não tem etiquetas de treinamento.

Estes três problemas podem ser redigidos para a Inferência da Língua Natural.`t`E uma hipótese.`h`- Não .`h`É por isso .`t`"Contra-contraditório" ou "neutral"

- **Hallucination check:** `t`= documento de origem,`h`= afirmação resumida── não implicação = alucinação──
- **Grounded QA:** `t`= passagem recuperada,`h`= resposta gerada. Não implicação = fabricação.
- **Zero-shot classification:** `t`= documento,`h`= etiqueta verbal ("É sobre esportes")―Integração = etiqueta prevista―

Uma tarefa, três usos de produção. É por isso que cada quadro de avaliação RAG está na base de um modelo NLI.

## 概念

![NLI: three-way classification, premise vs hypothesis](../assets/nli.svg)

**三个 labels。**

- **Entailment.** `t`→ `h`"O gato está no tapete" implica "Há um gato".
- **Contradiction.** `t`→`h`"O gato está no tapete" contradiz "Não há gato".
- **Neutral.**O gato está no tapete, o gato está com fome, é neutro.

**不是逻辑 entailment。**NLI é uma inferência de linguagem natural, é o que o típico humano leitor irá deduzir, e não uma lógica rigorosa.

**Datasets。**

- **SNLI**(2015)──570k 人工标注对,以图片标题 作为前提──领域较窄──
- **MultiNLI**(2017)──跨 10 个类的 433k pairs──2026 年的标准培训 corpus──
- **ANLI**(2019) ――NLI adversários― humanos especialmente redigidos para atirar exemplos de modelos existentes―
- **DocNLI, ConTRoL**(202021) ・Premisões de longo prazo do documento。测试 multi-hop 和 inferência de longo alcance。

**架构。**Um codificador de transformador (BERT, RoBERTA, DeBERTA) 读取`[CLS] premise [SEP] hypothesis [SEP]`- Não.`[CLS]`representação 输入到三道软max──在 MNLI 上训练,在持久的基准上评估,在分销对上获得90%+精度──

**通过 NLI 做 zero-shot。**给定一个文件 和候选标签,把每个标签 转成一个假设("Este texto é sobre esportes")`zero-shot-classification`O mecanismo de condução


```figure
nli-router
```

## Construí-lo

### 步骤 1: 运行一个预训练的NLI modelo

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

 para as NLI de nível de produção,`facebook/bart-large-mnli`和 `microsoft/deberta-v3-large-mnli`É uma boa opção para fazer isso.

### 步骤 2: Classificação de tiro zero

```python
zs = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

text = "The stock market rallied after the central bank cut interest rates."
labels = ["finance", "sports", "politics", "technology"]

result = zs(text, candidate_labels=labels)
print(result)
# {'labels': ['finance', 'politics', 'technology', 'sports'],
#  'scores': [0.92, 0.05, 0.02, 0.01]}
```

默认 template is "Este exemplo é sobre {etiqueta}."―可用 `hypothesis_template`Não precisa de dados de treinamento, não precisa de ajustes.

### 步骤 3: Verificação de fidelidade do RAG

```python
def is_faithful(answer, context, threshold=0.5):
    result = nli({"text": context, "text_pair": answer})[0]
    entail = next(s for s in result if s["label"] == "entailment")
    return entail["score"] > threshold
```

É o núcleo da fidelidade do RAGAS. A resposta gerada será dividida em alegações atômicas.

### 步骤 4: 手写 NLI classifier (concept version)

- Não .`code/main.py`中 Apenas usando o brinquedo stdlib:premise 和 hipotese  através de sobreposição léxica + detecção de negação  fazer comparação。 não pode ser comparado com modelos Transformer  competição, mas mostra a forma da tarefa:输入两段文本,输出三道标签,loss = `{entail, contradict, neutral}`A entropia cruzada de cima.

## 陷

- **Hypothesis-only shortcuts.**Os modelos apenas veem a hipótese de que a etiqueta de previsão de taxa de precisão pode ser de cerca de 60% no SNLI, porque "não""",ninguém""",nunca" está relacionada com a contradição.
- **Lexical overlap heuristic.**A subsequência heurística () de cada subsequência são implicadas () pode passar pela SNLI, mas vai ser derrotada () em HANS/ANLI.
- **Document-length degradation.**Modelos de NLI de uma única frase em instalações de comprimento de documento 上会下降 20+ F1──长上下文应使用 DocNLI-trained models──
- **Zero-shot template sensitivity.**"Este exemplo é sobre {etiqueta}"、"{etiqueta}"、"O tópico é {etiqueta}" 之间可能导致精度 波动 10+ points──需要调优模板──
- **Domain mismatch.**MNLI em geral Inglês sobre treinamento.

## Use-o

Estaca 2026:

| Use case | Model |
|---------|-------|
| 通用 NLI | `microsoft/deberta-v3-large-mnli` |
| 快速 / edge | `cross-encoder/nli-deberta-v3-base` |
| Zero-shot classification（轻量） | `facebook/bart-large-mnli` |
| Document-level NLI | `MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli` |
| Multilingual | `MoritzLaurer/multilingual-MiniLMv2-L6-mnli-xnli` |
| RAG 中的 hallucination detection | RAGAS / DeepEval 内部的 NLI layer |

O meta-patrão de 2026: NLI é o texto compreendido de万能── basta que você precise julgar se A apoia B? ou A se contradiz B? antes de lançar outra chamada de LLM , primeiro considere NLI──

## Entrega-o

保存为 `outputs/skill-nli-picker.md`- Não .

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

1. **Easy.**Em 20 个手写的(premis, hipótese, rótulo)`facebook/bart-large-mnli`,覆盖所有三类──测量精度──加入逆境的"subsequence heuristic" traps("Eu não comi o bolo" vs "Eu comi o bolo"),看看它是否会失效──
2. **Medium.**Em 100 条 AG Notícias cabeçalhos 上比较零射模板 `"This text is about {label}"`- Não.`"The topic is {label}"`和 `"{label}"` Relatório de balanço de precisão 
3. **Hard.**Construir um verificador de fidelidade RAG: decomposição de reivindicações atômicas + cada reivindicação fazer NLI。 em 50 个带金背景的RAG-generat answers 上评估──测量对人工标签的错正和错负率──

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
- [Williams, Nangia, Bowman (2017). A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) MultiNLI。
- [Nie et al. (2019). Adversarial NLI](https://arxiv.org/abs/1910.14599) Referência ANLI。
- [Yin, Hay, Roth (2019). Benchmarking Zero-shot Text Classification](https://arxiv.org/abs/1909.00161) NLI-as-classificador。
- [He et al. (2021). DeBERTa: Decoding-enhanced BERT with Disentangled Attention](https://arxiv.org/abs/2006.03654) 2026                                                                                                                                                                                                                                                             
