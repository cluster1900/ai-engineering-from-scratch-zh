# Question répondant 系统

> Les trois types de systèmes ont façonné la QA moderne. L'extraction trouve des espaces. La récupération accrue les amène à s'appuyer sur des documents.

**Type:** Build
**Languages:** Python
**先修要求：**La phase 5 · 11 (traduction automatique), la phase 5 · 10 (attention)
**Time:** ~75 minutes

##  problématique

User输入 "Quand a été lancé le premier iPhone?", 期望得到 "June 29, 2007." 不是 "l'histoire d'Apple est longue et variée. " 也不是孤零零的"2007",没有句承载──需要一个直接的,根基的,正确的答案──

Au cours de la dernière décennie, trois architectures ont dirigé l'AQ.

- **Extractive QA。**给定一个问题 和一个已知含有答案的段落, 在段落中找到答案跨度的开始和结尾指数──SQuAD est un point de référence canonique──
- **Open-domain QA。**Pas de passage 没有给出──先检索 相关段,然后提取或生成一个答案──这是今天每个RAG管道的基石──
- **Generative / Closed-book QA。**Un modèle de langage grand à partir de sa mémoire paramétrique.

La tendance de 2026 est hybride: récupérer les meilleurs passages, puis demander un modèle génératif, en le basant sur ces passages.

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**Avec le transformateur (Familie BERT) avec le code de la question et le passage.

**Retrieval-augmented (RAG)。**Deux étapes. Tout d'abord, le récupérateur du corps trouve le haut...`k`Les deux sont souvent réunis en tant que références de la classe RAG moderne.

**Generative。**Une étude de la science de l'illumination (LLM) à partir de poids appris (GPT、Claude、Llama) répond à la question.


```figure
qa-span
```

## - Je le construis.

### 步骤 1: Utiliser un modèle prétrainé faire une QA extractive

```python
from transformers import pipeline

qa = pipeline("question-answering", model="deepset/roberta-base-squad2")

passage = (
    "Apple Inc. released the first iPhone on June 29, 2007. "
    "The device was announced by Steve Jobs at Macworld in January 2007."
)
question = "When was the first iPhone released?"

answer = qa(question=question, context=passage)
print(answer)
```

```python
{'score': 0.98, 'start': 57, 'end': 70, 'answer': 'June 29, 2007'}
```

`deepset/roberta-base-squad2`Dans le cadre de l'entraînement SQuAD 2.0, qui contient des questions sans réponse,`question-answering`Le pipeline même en cas de nul de la note du modèle  quand il gagne, il reviendra aussi à la score maximale, il* ne reviendra pas* automatiquement à la réponse vide`handle_impossible_answer=True`: Alors seulement quand le score nul dépasse tous les scores de l'espace, la ligne de tuyau ne reviendra pas à l'air.`score`Je suis en train de vous dire:

### 步骤 2: Un pipeline augmenté de récupération

```python
from sentence_transformers import SentenceTransformer
import numpy as np

encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

corpus = [
    "Apple Inc. released the first iPhone on June 29, 2007.",
    "Macworld 2007 featured the iPhone announcement by Steve Jobs.",
    "Android launched in 2008 as Google's mobile operating system.",
    "The first iPod was released in 2001.",
]
corpus_embeddings = encoder.encode(corpus, normalize_embeddings=True)


def retrieve(question, top_k=2):
    q_emb = encoder.encode([question], normalize_embeddings=True)
    sims = (corpus_embeddings @ q_emb.T).squeeze()
    order = np.argsort(-sims)[:top_k]
    return [corpus[i] for i in order]


def answer(question):
    passages = retrieve(question, top_k=2)
    combined = " ".join(passages)
    return qa(question=question, context=combined)


print(answer("When was the first iPhone released?"))
```

两阶段管道──Dense retriever(Sentence-BERT) par la similitude sémantique 找到相关段落──Extractive reader(RoBERTa-SQuAD) de la même suite de passages.

### 步骤 3: Utiliser RAG faire génératif

```python
def rag_generate(question, llm):
    passages = retrieve(question, top_k=3)
    prompt = f"""Context:
{chr(10).join('- ' + p for p in passages)}

Question: {question}

Answer using only the context above. If the context does not contain the answer, say "I don't know."
"""
    return llm(prompt)
```

Rappelez-vous que le modèle est un modèle de référence, en fonction du contexte, et que vous répondez à ce que vous dites, en termes de "je ne sais pas", par rapport à la simple "pente", vous pouvez réduire les taux d'hallucinations de 40 à 60%.

### 步骤 4: reflecter l'évaluation du monde réel

SQUAD  utilisateur**Exact Match (EM)**et **token-level F1** EM est une norme 后的严格匹配(minuscale、条点、删除文章), soit une prédiction 完全匹配, soit 0 分──F1 基于 prédiction 和 référence 之间的 token overlap 计算,并给予部分分数──两者都会低估抛句:"29 juin 2007" vs "29 juin 2007" "通常会得到 0 EM(ordinal 打破了正常化), mais encore parce que les jetons se chevauchent 获得可观的 F1──

pour la production QA:

- **Answer accuracy**(Juge par la LLM ou par l'homme, parce que les mesures ne peuvent pas saisir l'équivalence sémantique)
- **Citation accuracy。**引用的 passage 是否真的支持答案? 引用的引用与回收的段落 之间的字符串匹配自动检查,难度很低──
- **Refusal calibration。**Quand la réponse n'est pas dans les passages récupérés 中时,系统是否正确说出"I don't know"? Mesurer le taux de confiance fausse.
- **Retrieval recall。**Avant d'évaluer le lecteur, il faut d'abord mesurer si le retriever a mis le passage correct dans le top.`k`Le lecteur ne peut pas réparer le passage manqué.

### RAGAS:2026 cadre d'évaluation de la production

`RAGAS`Il est spécialisé dans les systèmes RAG, et est le défaut de l'expédition de 2026 en l'absence de référence en or, pour quatre dimensions:

- **Faithfulness。**Chaque affirmation de l'intermédiaire est-elle provenant du contexte retenu ?
- **Answer relevance。**La réponse est oui ou non ?
- **Context precision。**Dans les morceaux récupérés, quelle est la proportion de rapport réel ?
- **Context recall。**L'ensemble récupéré est-il contenu de toutes les informations dont vous avez besoin?

Scoring sans référence 让你在没有策划的黄金答案的情况下评估现场生产流量──对于精确匹配的指标──无用的开放式问题,它上叠加了LLM-as-judge──

`pip install ragas`◊ Connecter votre retriever + lecteur ◊ chaque requête ◊ obtenir quatre échelles ◊ contre les régressions ⋅ émettre un avertissement ◊

## Utilisez-le

La pile de 2026

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

L'AQ extractive n'est plus populaire en 2026 car les RAG de LLM peuvent traiter davantage de situations.

## Je le livre.

保存为 `outputs/skill-qa-architect.md`- Le numéro de la liste:

```markdown
---
name: qa-architect
description: Choose QA architecture, retrieval strategy, and evaluation plan.
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

Given requirements (corpus size, question type, factuality constraint, latency budget), output:

1. Architecture. Extractive, RAG with extractive reader, RAG with generative reader, or closed-book LLM. One-sentence reason.
2. Retriever. None, BM25, dense (name the encoder), or hybrid.
3. Reader. SQuAD-tuned model, LLM by name, or "domain-fine-tuned DistilBERT."
4. Evaluation. EM + F1 for extractive benchmarks; answer accuracy + citation accuracy + refusal calibration for production. Name what you are measuring and how you are measuring it.

Refuse closed-book LLM answers for regulatory or compliance-sensitive questions. Refuse any QA system without a retrieval-recall baseline (you cannot evaluate the reader without knowing the retriever surfaced the right passage). Flag questions that require multi-hop reasoning as needing specialized multi-hop retrievers like HotpotQA-trained systems.
```

## 练习

1. **Easy。**Dans les 10 passages de Wikipedia ci-dessus, vous verrez 7 à 9 questions correctes.
2. **Medium。**添加一个拒绝分类器──当最高检索分 低于值(比如0.3 cosine)时,返回"I don't know",而不是调用读者──在持久的设置上调整门──
3. **Hard。**Dans le corpus de 10 000 documents que vous avez choisi, construisez un pipeline RAG. Réalisez la récupération hybride (BM25 + dense) et la fusion RRF. Voir leçon 14.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Extractive QA | 找到 answer span | 在给定 passage 中预测 answer 的 start 和 end indices。 |
| Open-domain QA | 对 corpus 做 QA | 没有给定 passage；必须先 retrieve，再 answer。 |
| RAG | Retrieve then generate | Retrieval-augmented generation。Retriever + reader pipeline。 |
| SQuAD | Canonical benchmark | Stanford Question Answering Dataset。EM + F1 metrics。 |
| Hallucination | 编造出来的 answer | Reader output 不受 retrieved context 支持。 |
| Refusal calibration | 知道什么时候闭嘴 | 系统在无法回答时正确说出 "I don't know"。 |

## 延伸阅读
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) référence 论文。
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR,QA's canonique détenteur de récupération détenteur de données 
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名 RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) Enquête de l'ensemble du RAG
