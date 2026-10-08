# Pergunta Respostas 系统

> Três tipos de sistemas moldaram a moderna QA. Extrativa encontra espaços. A recuperação aumentou a sua base em documentos.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 11 (Tradutora automática), Fase 5 · 10 (Atento)
**Time:** ~75 minutes

## 问题

Usuário: User输入 "Quando foi lançado o primeiro iPhone?", espera-se obter "29 de junho de 2007." Não é "a história da Apple é longa e variada".

Na década passada, três arquiteturas lideraram a QA.

- **Extractive QA。**给定一个问题 和一个已知含含答的段落, 在段落中找到答案跨度的开始和结尾指数──SQuAD é um ponto de referência canônico──
- **Open-domain QA。**Primeiro, retira o texto, depois extrai ou gera uma resposta.
- **Generative / Closed-book QA。**Um grande modelo de linguagem de sua memória paramétrica.

A tendência de 2026 é híbrida: recuperar as melhores passagens, e depois pedir um modelo gerativo, para que seja baseado nessas passagens.

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**Use transformador ([[Família BERT]]) para codificar a pergunta 和 passage. Trein dois cabeças,分别预测 resposta de início e fim de tokens índices.

**Retrieval-augmented (RAG)。**Primeiro, o recuperador encontra o topo do corpo.`k`Passagens, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, leitores, etc.

**Generative。**Uma única LLM de decodificação (GPT、Claude、Llama) de pesos aprendidos.


```figure
qa-span
```

## Construí-lo

### 步骤 1: Use pre-trained modelo fazer QA extractivo

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

`deepset/roberta-base-squad2`Em SQuAD 2.0 上 training, que contém perguntas sem resposta,`question-answering`pipeline mesmo em um modelo de pontuação nula                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `handle_impossible_answer=True`Quando o resultado é zero, o resultado é superior a todos os resultados, o resultado é o resultado de qualquer tipo de verificação.`score`- Não.

### 步骤 2: Uma rede de transporte aumentada de recuperação (草图)

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

两阶段管eline──Dense retriever(Sentence-BERT) através de semântica semelhança 找到相关段落──Extractive reader(RoBERTa-SQuAD) de 合并后的顶段 中抽取答 span──适用于小型 corpora──对百万文档级 corpus,使用 FAISS或矢量数据库──

### 步骤 3: Utilize RAG fazer gerativo

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

padrão rápido  muito importante。明确告诉模型 基于文本作答,并在文本不足时返回"Eu não sei",相比天真提示,可将幻觉率 降低 40-60%──更复杂的模式 会加入引用、信心分和结构化抽取──

### 步骤 4: Reflectar a avaliação do mundo real

SQUAD **Exact Match (EM)**和 **token-level F1** EM é a normalização 后的严格匹配(minuscript、stripe punctuation、remove articles), 么预测 完全匹配, 么得 0 分──F1 基于预测和参考 之间的代币重叠 计算,并给予部分分数──两者都会低估抛词:"29 de junho de 2007" vs "29 de junho de 2007" normalmente obtém 0 EM(ordinal 打破了正常化), mas ainda porque os tokens se sobrepõem 获得可观的 F1──

Para a produção QA:

- **Answer accuracy**(Judicado pela LM ou por humanos, porque as métricas não conseguem captar a equivalência semântica)
- **Citation accuracy。**引用的 passage 是否真的支持答案? pode ser gerado através de citações e passagens recuperadas  entre a linha de correspondência auto-exame, dificuldade é muito baixa.
- **Refusal calibration。**Quando a resposta não está em passagens recuperadas 中时,系统是否正确说出"Eu não sei"?
- **Retrieval recall。**Antes de avaliar o leitor, primeiro medem se o retriever está a fazer a passagem correta.`k`◊leader 无法修复缺失的段落──

### RAGAS:2026 Framework de avaliação da produção

`RAGAS`É especialmente concebido para sistemas RAG, e é o padrão de transporte de 2026 ano.

- **Faithfulness。**Cada afirmação entre as respostas é ou não proveniente do contexto recuperado?
- **Answer relevance。**A resposta é "ou não?" a resposta é "ou não?" a resposta é "ou não"?
- **Context precision。**Em pedaços recuperados, qual é a proporção de relação real? Baixa precisão = ruído rápido no meio.
- **Context recall。**Set recuperado está contendo todas as informações necessárias?

A pontuação livre de referência 让你在没有策划的黄金答案的情况下评估现场生产流量──对于精确匹配的指标──无用的开放式问题,在上面叠加LLM-as-judge──

`pip install ragas`△ Conectar o seu retriever + leitor。 cada consulta  get 4 escalares。 para regressões  emitir alerta。

## Use-o

A pilha de 2026 anos.

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

A QA extractiva já não é popular em 2026, pois a RAG de LLM pode lidar com mais situações.

## Entrega-o

保存为 `outputs/skill-qa-architect.md`- Não .

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

1. **Easy。**Em cima de 10 passagens da Wikipédia, você deve ver 7-9 个正确──
2. **Medium。**添加一个拒绝分类器──当最高检索分 低于值(比如0.3 cosine)时,返回"I don't know",而不是调用 reader──在在持久的设置上调整门──
3. **Hard。**Em seu corpus de 10.000 documentos selecionado, construam um pipeline RAG. Realizem a recuperação híbrida (BM25 + densa) e a fusão RRF. Veja a lição 14.

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
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) referência 论文。
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR,QA's canônico retriever denso。
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名 RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) Uma pesquisa de RAG completa.
