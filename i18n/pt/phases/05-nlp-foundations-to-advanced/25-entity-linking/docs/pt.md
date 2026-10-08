# 实体链接与消歧

> NER 找到了 "Paris"──Entidade que liga 必須決定:Paris, França?Paris Hilton?Paris, Texas?Paris(príncipe troiano)?Se não estiver ligando, seu Grafico de Conhecimento 仍然是模糊的──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

## 问题

O que é que é que é isso?

- Michael Jordan?
- Michael B. Jordan?
- Michael I. Jordan ((Berkeley ML 教授                                                                                                                                                                                                                                                          
- Jordânia?
- Jordan (nome hebraico)?

A ligação de entidades (EL) vai colocar cada menção 解析到知识库 中中唯一条目:Wikidata、Wikipedia、DBpedia,或你的域 KB──两个子任务:

1. **Candidate generation。**- É possível. - Não, não é possível.
2. **Disambiguation。**De acordo com o texto, qual dos candidatos é o verdadeiro?

 dois passos podem ser aprendidos dois passos têm um padrão                                                                                                                                                                                                                                                      

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定 mention surface form (("Jordan"), в псевдонимическом индексе 中查找 candidaturas。 Wikipedia psewodicionaries 覆盖大多数命名实体:"JFK" → John F. Kennedy、Jacqueline Kennedy、JFK airport、JFK(movie)。典型 index 会为每个提名 返回 10-30 个候选人──

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`◊ efeito bom ◊ velocidade rápida ◊ não precisa de treino ◊
2. **Embedding-based (ESS / REL / Blink)。**Encode menção + contexto。Encode Descrição de cada candidato。 escolha cosine 最大的。2020-2024 年的默认方法。
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 Token decodificar o nome canônico da entidade── é limitado a um trio de nomes de entidades válidas, portanto, o output garantiu ser válido KB id──

**End-to-end vs pipeline。**Modelos modernos (ELQ、BLINK、ExtEnD、GENRE) em uma única passagem 中运行 NER + candidato geração + desambiguação。 sistemas de pipeline ainda ocupam a liderança na produção, pois você pode substituir componentes。

### 两个指标

- **Mention recall (candidate gen)。**Menções de ouro. Em, correct KB entry.
- **Disambiguation accuracy / F1。**Dados candidatos certos, o primeiro é sempre certo.

始终同时报告两者──一个在80%候选人回忆 上有99%的歧歧的系统,本质上是80%的管道──


```figure
gx-entity-linking
```

## Construí-lo

### 步骤 1: redirecionamento da Wikipédia 构建 alias index

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

Dados do alias da Wikipédia: cerca de 18 milhões de pares (alias, entidade)

### 步骤 2: Desambiguação baseada no contexto

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

O Jaccard superpõe é um brinquedo.`code/main.py`Passo 2):

### 步骤 3: baseado em incorporar (em estilo BLINK)

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

Em tempo de índice, para cada entidade KB incorporando 一次── em tempo de consulta, para menção + conteúdo incorporando 一次, para pool de candidatos fazer ponto-produto, escolher o máximo valor──

### 步骤 4: entidade gerativa ligando ((概念)

GENRE 会逐字符解码实体的维基百科标题──Constrained decoding(见课 20) 确保只能输出有效标题──它与 KB-backed trie 紧密集成──现代后继是 REL-GEN,以及带结构化输出的LLM-prompted EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合 lista branca `choice`), é o oleoduto de energia elétrica mais fácil de 2026 anos.

### 步骤 5: avaliação do AIDA-CoNLL

AIDA-CoNLL é o padrão de referência de EL: 1,393 篇 artigos da Reuters  34k menções  entidades da Wikipedia  relatar a precisão no KB `P@1`) e taxa de detecção de NIL fora do KB。

## 陷

- **NIL handling。**Algumas menções não estão em KB.
- **Mention boundary errors。**上游 NER 漏掉 parcial spans ((("Banco da América" apenas se marca como "Banco")
- **Popularity bias。**Os sistemas de treinamento vão exagerar as previsões de entidades frequentes.
- **Cross-lingual EL。**把中文文本中的提到映射到英语维基百科实体──需要多语言编码或翻译步骤──
- **KB staleness。**Novas empresas, novos eventos, novos indivíduos não estão no lixo da Wikipedia do ano passado.

## Use-o

Estaca de 2026:

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026 年可上线的生产模式:NER → coref → 对每个提及做EL → 将集群 折叠成每个集群 一个可ноническая实体――输出:document 中每个实体 一个 KB id,而不是每个提及 一个――

## Entrega-o
保存为 `outputs/skill-entity-linker.md`- Não .

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

1. **Easy。**Em`code/main.py`Em base em 10 menções ambíguas (Paris, Jordânia, Apple) realizou um desambiguador de contexto anterior.
2. **Medium。**Used sentence transformer encode 50 个 ambiguous menções。Embed Cada candidato                                                                                                                                                                                                                                                    
3. **Hard。**Construir um domínio de 1k-entity KB (por exemplo, empregados + produtos da sua empresa)  implementando端到端 NER + EL── em 100 条

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
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) prioridade fundamental+contexto 方法。
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于 Embedding 的主力方法──
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带                                                                                                                                                                                                                                                                                          
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) referência 论文。
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 开源 produção stack。
