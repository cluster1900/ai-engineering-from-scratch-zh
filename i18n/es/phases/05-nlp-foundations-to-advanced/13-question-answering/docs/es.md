# Respuesta a la pregunta 系统

> Tres tipos de sistemas han formado la QA moderna. Extráctivo  encontrar espacios. Recuperación aumentada, basándolos en documentos.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 11 (Traducción automática), Fase 5 · 10 (atención)
**Time:** ~75 minutes

##  problemas

Usuario ingresar "Cuándo se lanzó el primer iPhone?", espera obtener "29 de junio de 2007". No es "la historia de Apple es larga y variada".

En la década pasada, la arquitectura ha sido una de las principales causas de la QA.

- **Extractive QA。**给定一个问题 和一个已知含有答案的段落, 在段落中找到答案跨度的开始和结尾指数──SQuAD es un punto de referencia canónico──
- **Open-domain QA。**Paso 没有给出──先检索 相关 pasaje,然后提取或生成一个答案──这是今天每个RAG管道的基石──
- **Generative / Closed-book QA。**Un modelo de lenguaje grande desde su memoria parámétrica en respuesta.

La tendencia del 2026 es híbrida: recuperar los mejores pasajes, luego pedir un modelo generativo, hacer que se base en estos pasajes.

## 概念

![QA architectures: extractive, retrieval-augmented, generative](../assets/qa.svg)

**Extractive。**Usar el transformador (la familia BERT) para codificar la pregunta y el pasaje. Entrenamiento de dos cabezas, separando los indices de inicio y final de la respuesta.

**Retrieval-augmented (RAG)。**Primero, el recuperador del cuerpo encuentra la parte superior.`k`Los pasajes son extractivos o generativos. Los pasajes son extractivos o generativos. Los pasajes son extractivos o generativos.

**Generative。**Una LLM sólo para decodificadores (GPT、Claude、Llama) de los pesos aprendidos en respuesta. No hay paso de recuperación.


```figure
qa-span
```

## Construirlo

### Paso 1: Utilice un modelo pre-entrenado hacer QA extractivo

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

`deepset/roberta-base-squad2`En el entrenamiento SQuAD 2.0, que contiene preguntas sin respuesta,`question-answering`pipeline incluso en el modelo de puntaje nulo  cuando gana, también regresará a la puntaje máximo span, que no * * automáticamente regresará a la respuesta en el aire.`handle_impossible_answer=True`Solo cuando el puntaje nulo supera todos los puntajes de la línea de conducción, la línea de conducción regresará a la respuesta en blanco.`score`¿Qué es eso?

### Paso 2: Una tubería aumentada de recuperación

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

两阶段管道──Dense retriever(Sentence-BERT) a través de la similitud semántica 找到相关段落──Extractive reader(RoBERTa-SquAD) de los principales pasajes de la combinación 后 中抽取答 span──适用于小型 corpora──对百万文档级 corpus,使用 FAISS或矢量数据库──

### Paso 3: Utiliza RAG hacer generativo

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

En el contexto, no basta tiempo para responder "no sé", en comparación con la motivación ingenua, puede reducir las tasas de alucinación  40-60%―.

### 步骤 4: Reflejar la evaluación del mundo real

SQUAD  uso**Exact Match (EM)**Y **token-level F1** EM es la normalización 后的严格匹配(bajoletra, puntuación de la tira, eliminar artículos), o la predicción 完全匹配, o o 0 分──F1 基于预测和参考 之间的代币重叠 计算,并给予部分分数──两者都会低估抛词:"29 de junio de 2007" vs "29 de junio de 2007" normalmente obtendrá 0 EM(ordenal 打破了正常化), pero todavía debido a la superposición de los tokens 获得可观的 F1──

Para la producción:

- **Answer accuracy**(Judicado por la LM o por el hombre, porque las métricas no pueden captar la equivalencia semántica)
- **Citation accuracy。**引用的 passage 是否真的支持答案? puede ser generado por medio de citas y pasajes recuperados  entre la cadena de coincidencia
- **Refusal calibration。**Cuando la respuesta no está en los pasajes recuperados 中时,系统是否正确说出"no sé"?
- **Retrieval recall。**Antes de evaluar al lector, primero mide si el retriever ha puesto el pasaje correcto en la parte superior.`k`◊lector 无法修复缺失的段落──

### RAGAS:2026 marco de evaluación de la producción

`RAGAS`Es un diseño de sistemas RAG, y es el envío por defecto de 2026 años. En caso de no necesitar referencias de oro, tiene cuatro dimensiones:

- **Faithfulness。**¿Es que cada afirmación de la respuesta es de contexto extraído?
- **Answer relevance。**¿Cómo responder a la pregunta? ¿A través de la respuesta se generan preguntas hipotéticas, y se compara con la pregunta real?
- **Context precision。**En los trozos recuperados, ¿cuál es la proporción de datos reales?
- **Context recall。**¿Contiene todo el contenido que necesita?

Punto libre de referencia 让你可以在没有策划的黄金答案的情况下评估现场生产流量──对于精确匹配的指标──无用的开放式问题,在上面叠加LLM-as-judge──

`pip install ragas`△Enlace tu retriever + lector― cada consulta  get 4 escalares― para regresiones  emitir alerta―

## Usalo

La pila de 2026 años.

| Use case | Recommended |
|---------|-------------|
| 给定 passage，找到 answer span | `deepset/roberta-base-squad2` |
| 在固定 corpus 上，closed-book 不可接受 | RAG: dense retriever + LLM reader |
| 对 document store 做 real-time QA | RAG with hybrid (BM25 + dense) retriever + reranker (lesson 14) |
| Conversational QA（follow-up questions） | LLM with conversation history + RAG on each turn |
| 高度事实性、regulated domains | 对 authoritative corpus 做 Extractive；绝不单独使用 generative |

La QA extractiva ya no es popular en 2026 porque el RAG de LLM puede tratar más situaciones.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-qa-architect.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**En los 10 pasajes de Wikipedia anteriores, se establece un tubo extractivo de SQuAD.
2. **Medium。**Añadir un clasificador de rechazo. Cuando la puntuación de recuperación más alta es baja en el valor (por ejemplo, 0.3 cosinos) cuando regrese "no sé", en lugar de utilizar un lector.
3. **Hard。**En el corpus de 10.000 documentos que elijas, construye un oleoducto RAG. Realice la recuperación híbrida (BM25 + densa) y la fusión de RRF.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Extractive QA | 找到 answer span | 在给定 passage 中预测 answer 的 start 和 end indices。 |
| Open-domain QA | 对 corpus 做 QA | 没有给定 passage；必须先 retrieve，再 answer。 |
| RAG | Retrieve then generate | Retrieval-augmented generation。Retriever + reader pipeline。 |
| SQuAD | Canonical benchmark | Stanford Question Answering Dataset。EM + F1 metrics。 |
| Hallucination | 编造出来的 answer | Reader output 不受 retrieved context 支持。 |
| Refusal calibration | 知道什么时候闭嘴 | 系统在无法回答时正确说出 "I don't know"。 |

## 延伸阅读
- [Rajpurkar et al. (2016). SQuAD: 100,000+ Questions for Machine Comprehension of Text](https://arxiv.org/abs/1606.05250) referencia 论文。
- [Karpukhin et al. (2020). Dense Passage Retrieval for Open-Domain QA](https://arxiv.org/abs/2004.04906) DPR,QA de canónica de la recuperación densa.
- [Lewis et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) 命名 RAG 的论文──
- [Gao et al. (2023). Retrieval-Augmented Generation for Large Language Models: A Survey](https://arxiv.org/abs/2312.10997) Encuesta de RAG de todo el mundo
