# 实体链接与消歧

> NER 找到了 "Paris"──Entidad que vincula debe decidir: París, Francia? París Hilton? París, Texas? París(príncipe troyano)? Si no se vincula, tu gráfico de conocimiento  sigue siendo ambigua de──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

##  problemas

¿Y qué es Jordania? ¿Qué es Jordania?

- ¿Michael Jordan? ¿Qué es eso?
- ¿Michael B. Jordan? ¿Qué es eso?
- Michael I. Jordan (Berkeley ML 教授) ¿Es verdad que existe esta mezcla en los documentos de ML?
- ¿Jordania?
- Jordan (nombre hebreo)?

Enlace de entidad (EL) 会把每个提到解析到知识库 中中唯一条目:Wikidata、Wikipedia、DBpedia,或你的域 KB──两个子任务:

1. **Candidate generation。**¿Qué es posible? ¿Qué es posible?
2. **Disambiguation。**¿Cuál de los candidatos es el más correcto?

 Dos pasos pueden aprenderse Dos pasos tienen un punto de referencia                                                                                                                                                                                                                                                       

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定 mention surface form (("Jordania"), в псевдонимическом индексе 中查找 candidates── Wikipedia pсевдонимическими diccionarios 覆盖大多数命名实体:"JFK" → John F. Kennedy、Jacqueline Kennedy、JFK airport、JFK(movie)──典型 index 会为每个提名 返回 10-30 个候选人──

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`◊ Efecto bueno ◊ velocidad rápida ◊ no necesita entrenamiento ◊
2. **Embedding-based (ESS / REL / Blink)。**Encode mención + contexto。Encode descripción de cada candidato。 seleccionar cosino 最大的──2020-2024 年的默认方法──
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 Token decodificar el nombre canónico de la entidad── está limitado a un trie de nombres de entidades válidos, por lo que la salida de seguridad es válida KB id──

**End-to-end vs pipeline。**Modelos modernos (ELQ、BLINK、ExtEnD、GENRE) en un solo paso 中运行 NER + candidato generation + desambiguación。 los sistemas de tuberías siguen dominando la producción, ya que se pueden sustituir componentes。

###  Dos indicadores

- **Mention recall (candidate gen)。**En la lista de candidatos, la proporción es la baja de todo el pipeline.
- **Disambiguation accuracy / F1。**Dados candidatos correctos, el primer número es más que siempre correcto.

始终同时报告两者──一个在80%的候选人回忆上有99%的歧义的系统,本质上是80%的管道──


```figure
gx-entity-linking
```

## Construirlo

### Paso 1: redirecciones desde Wikipedia  construir un alias index

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

Los datos de Wikipedia: aproximadamente 18M 个 (alias, entidad) pares── de los sitios de Wikidata 下载──存为 inversado índice──

### Paso 2: Desambiguación basada en el contexto

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

Jaccard superposición es un juguete. Usando embebidos.`code/main.py`Paso 2):

### 步骤 3: basado en embedding (estilo de BLINK)

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

En el tiempo de índice, para cada entidad KB que incrusta una vez. En el tiempo de consulta, para mencionar + contextualizar una vez.

### 步骤 4: entidad generativa que une conceptos

GENRE 会逐字符解码实体的维基百科标题──Condensed decoding(见课 20) 确保只能输出有效标题──它与 KB-backed trie 紧密集成──现代后继是REL-GEN,以及带结构化输出的LLM-prompted EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合 lista blanca `choice`), es el oleoducto de electricidad más fácil de 2026 años.

### Paso 5: evaluación de la AIDA-CoNLL

AIDA-CoNLL es el estándar de referencia de EL: 1,393 篇 artículos de Reuters  34k menciones  entidades de Wikipedia  report in-KB precisión`P@1`) y la tasa de detección de NIL fuera de KB。

## 陷

- **NIL handling。**Algunas menciones no están en KB.
- **Mention boundary errors。**上游 NER 漏掉 parcial spans("Banco de América" sólo se etiqueta como "Banco")
- **Popularity bias。**Los sistemas entrenados se preparan por exceso de entidades frecuentes.
- **Cross-lingual EL。**把中文文本中的 menciones 映射到英语维基百科实体──需要多语言编码或翻译步骤──
- **KB staleness。**Nueva empresa, nuevos eventos, nuevos personajes no están en el vertedero de Wikipedia del año pasado.

## Usalo

Estaca de 2026 años:

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026 年可上线的生产模式:NER → coref → 对每一个提及做EL → 将集群 折叠成每一个集群 一个定制实体――输出:document 中每一个实体 一个 KB id,而不是每一个提及 一个――

##  entregarlo
保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-entity-linker.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**En el`code/main.py`En el caso de la empresa de la industria de la construcción, la empresa de la construcción de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica de la fábrica
2. **Medium。**Usar un transformador de oraciones para codificar 50 menciones ambigüas. Enmigración de cada candidato.
3. **Hard。**构建一个1k-entity domain KB(例如你公司的员工+产品) ――实现端到端 NER + EL──在100 条中延长的句子上测量精度和回忆──

## 关键术语: "El hombre es un hombre"
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
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) prioridad fundamental+contexto 方法。
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于 Embedding 的主力方法──
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带 de decodificación limitada de EL ⋅ generativo
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) referencia 论文。
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 开源 producción de la pila
