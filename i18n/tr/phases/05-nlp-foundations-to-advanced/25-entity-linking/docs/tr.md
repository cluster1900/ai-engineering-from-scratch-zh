# 实体链接与消歧

> NER 找到了 "Paris"──Bütün bağlantı kuruluşu, karar vermek zorunda: Paris, Fransa?Paris Hilton?Paris, Texas?Paris(Trojan prens)?

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

## 问题

"Jordan basını dövdü". "Jordan"ı kişi olarak mı belirler?

- Michael Jordan?
- Michael B. Jordan mı?
- Michael I. Jordan, Berkeley ML Profesörü, bu karışıklık gerçekten var mı?
- Ürdün'de mi?
- Jordan (İbranice ilk isim)?

Entite linking (EL) 会把每个提及解析到知识库 中中唯一条目:Wikidata、Wikipedia、DBpedia,或你的域 KB──两个子任务:

1. **Candidate generation。**"Jordan"a verdiğin KB girişleri mümkün mü?
2. **Disambiguation。**Hangi aday doğruydu?

İki adımdan her şey öğrenilmektedir. İki adımdan her şey bir referans noktasına sahiptir.

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定 mention surface form (("Jordan"),在 alias index 中查找候选人──Wikipedia alias sözlükleri 覆盖大多数命名的实体:"JFK" → John F. Kennedy、Jacqueline Kennedy、JFK havaalanı、JFK(film)──典型 index 会为每个提名 返回 10-30 个候选人──

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊ ◊   ◊    ◊ ◊      ◊       ◊               ◊                                                                                              
2. **Embedding-based (ESS / REL / Blink)。**Encode adı + bağlamı。Encode Her adayın açıklaması。 seçkin coşine 最大──2020-2024 yılının默认方法。
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 Token dekode birimi'nin kanonik adı── geçerli bir birimi isimlerinin denemesine sınırlıdır, bu nedenle输出保证是有效 KB id──

**End-to-end vs pipeline。**现代 modeller ((ELQ、BLINK、ExtEnD、GENRE) bir kez geçmek 中运行 NER + aday jenerasyonu + anlaşılmazlık。Pipeline sistemleri, üretim sırasında hâlâ baskınlıkta, çünkü bileşenleri değiştirebilirsiniz。

### 两个指标

- **Mention recall (candidate gen)。**Altın sözcükler İçinde,正确 KB giriş 现候选人名单中的比例──这是整个管道的下限──
- **Disambiguation accuracy / F1。**Doğru adaylar belirlenince, en üst 1'de çok doğru aday var.

始终同时报告两者──一个在80%候选人回忆上有99%曖昧的系统,本质上是80%管道──


```figure
gx-entity-linking
```

## Yapın onu.

### 步骤 1: Wikipedia'dan yönlendirmeler 构建 alias index

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

Wikipedia alias verileri: yaklaşık 18M 个 (alias, entite) çiftleri。 from Wikidata dumps 下载。存为 inverted index。

### 步骤 2: bağlam tabanlı belirsizlik

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

Jackard örtüşmesi bir oyuncak. Yukarıdaki kosin benzerliği.`code/main.py`Adım 2.

### 步骤 3:Embedding tabanlı(BLINK tarzı)

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

Bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez, bir kez,

### 步骤 4: generatif birim bağlantılandırma

GENRE 会逐字符解码实体的维基百科标题──限定的解码──见课 20) 确保只能输出有效标题──它与 KB-backed trie 紧密集成──现代后继是 REL-GEN,以及带结构化输出的LLM-prompted EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `choice`), 2026 yılının en kolay açık EL boru hattı.

### Adım 5: AIDA-CoNLL'de değerlendirme yapılır

AIDA-CoNLL is standard EL benchmark:1,393 篇 Reuters makaleleri、34k bahsedilmeleri、Wikipedia kurumları── raporlar KB doğruluğu(`P@1`) ve KB dışındaki NIL tespit oranı。

## 陷

- **NIL handling。**Bazı isimler KB'de yer almaktadır. Yeni gelişen kuruluşlar, soğuk karakterler, sistemler, tahmin yanlış kuruluşlar değil, NIL'yi tahmin etmeleri gerekir.
- **Mention boundary errors。**NER'in kısmi devreye girdiği sürece "Bank of America" sadece "Bank" olarak belirtildi.
- **Popularity bias。**訓練されたシステム 会過度预测 frekanslı varlıklar。ML paper 中の"Michael I. Jordan" 往往会リンク到篮球 佐丹。
- **Cross-lingual EL。**Çinçecece yazılı olan sözcüklerin İngilizce Wikipedia'da yer aldığı bir bölümde yer alması için çok dilli kodlama veya tercüme adımları gerekir.
- **KB staleness。**Yeni şirket, yeni olay, yeni kişi, geçen yılın Wikipedia'sını terk etmiyor.

## Kullan

2026 yılının birimi:

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026 yıl可上線的生产模式:NER → coref → 对每一个提到做EL → 将集群 折叠成每一个集群 一个可统的实体――输出:document 中每一个实体 一个 KB id,而不是每一个提到 一个――

## - Söyle.
保存为 `outputs/skill-entity-linker.md`- ...

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

1. **Easy。**- Evet .`code/main.py`Orta, 10  belirsiz bahsedilenlere dayanarak, ön + bağlam belirtilmesini gerçekleştirmek için  Paris  Jordan  Apple 
2. **Medium。**Uzd cümle transformörü kod 50 个 belirgin bahsedilenleri kullanmaktadır.
3. **Hard。**构建一个1k-entity域 KB(例如你公司的员工+产品) ――实现端到端 NER + EL──在100 条中延句上测量精度 和回召──

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
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) temel ön + bağlam 方法。
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于 Embedding 的主力方法──
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带 带   带 带     带                                                                                                                                                              
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) referans 论文。
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 开源 üretim yığını。
