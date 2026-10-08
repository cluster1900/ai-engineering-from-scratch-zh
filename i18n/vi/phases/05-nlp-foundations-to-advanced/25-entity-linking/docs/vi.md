# 实体链接与消歧

> NER 找到了 "Paris"──entity linking 要决定:Paris, France?Paris Hilton?Paris, Texas?Paris(Trojan prince)? Nếu không có liên kết, Your Knowledge Graph  vẫn là mơ hồ của──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 24 (Coreference Resolution)
**Time:** ~60 分钟

## 问题

句子写道:"Jordan đánh bại báo chí". NER của bạn Đặt "Jordan" 标记为 PERSON.

- Michael Jordan?
- Michael B. Jordan?
- Michael I. Jordan ((Berkeley ML 教授  是的,这种混在ML论文里真的存在吗?)
- Jordan (tiếng Anh)
- Jordan (tên đầu tiên tiếng Hy Lạp)?

Liên kết thực thể (EL) sẽ đưa mọi đề cập 解析到知识库 中的唯一条目:Wikidata、Wikipedia、DBpedia,或你的域 KB──两个子任务:

1. **Candidate generation。**给定 "Jordan", những mục KB nào là có thể?
2. **Disambiguation。**được đưa ra, ứng cử viên nào là đúng?

Hai bước có thể học được. Hai bước có điểm chuẩn.

## 概念

![Entity linking pipeline: mention → candidates → disambiguated entity](../assets/entity-linking.svg)

**Candidate generation。**给定 mention surface form (("Jordan"), trong danh nghĩa danh nghĩa 中查找候选人── Wikipedia danh nghĩa từ điển 覆盖大多数命名实体:"JFK" → John F. Kennedy、Jacqueline Kennedy、JFK sân bay、JFK(movie)──典型索引 会为每个提名 返回 10-30 个候选人──

**Disambiguation：三种方法。**

1. **Prior + context (Milne & Witten, 2008)。** `P(entity | mention) × context-similarity(entity, text)`◊ hiệu quả tốt ◊ tốc độ nhanh ◊ không cần phải tập luyện ◊
2. **Embedding-based (ESS / REL / Blink)。**Mã đề cập + ngữ cảnh. Mã đề mô tả của mỗi ứng cử viên.
3. **Generative (GENRE, 2021; LLM-based, 2023+)。**逐 Token decode entity's canonical name── được giới hạn trong một tray của các tên thực thể hợp lệ, do đó输出保证是有效 KB id──

**End-to-end vs pipeline。**现代 models (ELQ、BLINK、ExtEnD、GENRE) trong một lần đi 中运行 NER + ứng cử viên thế hệ + sự phân biệt đối xử。 Hệ thống đường ống vẫn chiếm ưu thế trong sản xuất, vì bạn có thể thay thế các thành phần。

### 两个指标

- **Mention recall (candidate gen)。**Trong danh sách ứng cử viên hiện tại, tỷ lệ ︎ là giới hạn thấp nhất của toàn bộ đường ống.
- **Disambiguation accuracy / F1。**Cho những ứng cử viên đúng, số 1 hàng đầu có nhiều người đúng.

始终同时报告两者──一个在80%候选人回忆 上有99%歧义的系统,本质上是80%管道──


```figure
gx-entity-linking
```

##  xây dựng nó

### 步骤 1: chuyển hướng từ Wikipedia  cấu trúc danh mục

```python
alias_to_entities = {
    "jordan": ["Q41421 (Michael Jordan)", "Q810 (Jordan, country)", "Q254110 (Michael B. Jordan)"],
    "paris":  ["Q90 (Paris, France)", "Q663094 (Paris, Texas)", "Q55411 (Paris Hilton)"],
    "apple":  ["Q312 (Apple Inc.)", "Q89 (apple, fruit)"],
}
```

Wikipedia alias data:约 18M 个 (alias, entity) cặp。 từ Wikipedia dumps 下载。存为 đảo ngược chỉ số。

### 步骤 2: Sự phân biệt rõ ràng dựa trên bối cảnh

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

Jackard chồng chéo là một đồ chơi. Với nhúng trên cùng giống với cosine.`code/main.py`bước 2):

### 步骤 3:những hình thức dựa trên nội dung

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

Trong thời gian chỉ mục, đối với mỗi KB thực thể nhúng một lần. Trong thời gian truy vấn, đối với đề cập + ngữ cảnh nhúng một lần. đối với nhóm ứng viên làm điểm-sản phẩm, chọn giá trị tối đa.

### 步骤 4: tạo ra các liên kết

GENRE 会逐字符解码实体的维基百科标题──Cở Ứng dụng giải mã hạn chế (见课 20) 确保只能输出有效标题──它与 KB hỗ trợ trie 紧密集成──现代后继是 REL-GEN,以及带结构化输出的 LLM-prompted EL──

```python
prompt = f"""Text: {text}
Mention: {mention}
List the best Wikipedia title for this mention.
Respond with JSON: {{"title": "..."}}"""
```

结合 danh sách trắng `choice`), đây là đường ống dẫn điện dễ nhất trên đường năm 2026:

### Bước 5: Đánh giá trên AIDA-CoNLL

AIDA-CoNLL là tiêu chuẩn EL điểm chuẩn:1,393 篇 Reuters bài báo、34k đề cập、 các tổ chức Wikipedia。 báo cáo chính xác trong KB(`P@1`) và tỷ lệ phát hiện NIL ngoài KB。

## 陷

- **NIL handling。**Một số đề cập không trong KB 中(新兴实体、冷门人物) ・ Hệ thống 必须预测 NIL, chứ không phải là đoán错实体──单独衡量──
- **Mention boundary errors。**上游 NER 漏掉部分跨度("Bank of America" chỉ标成"Bank")
- **Popularity bias。**Các hệ thống được đào tạo sẽ dự đoán quá nhiều các thực thể thường xuyên.
- **Cross-lingual EL。**把中文文本中的 đề cập 映射到英语维基百科实体──需要多语言编码或翻译步骤──
- **KB staleness。**新公司、新事件、新人物 không có Wikipedia dump năm ngoái 里──Production pipelines 需要刷新循环──

## Sử dụng nó

2026 năm:

| Situation | Pick |
|-----------|------|
| 通用 English + Wikipedia | BLINK or REL |
| Cross-lingual, KB = Wikipedia | mGENRE |
| LLM-friendly, 少量 mentions/day | Prompt Claude/GPT-4 with candidate list + constrained JSON |
| Domain-specific KB（medical, legal） | Custom BERT with KB-aware retrieval + fine-tune on domain AIDA-style set |
| 极低 latency | Exact-match prior only (Milne-Witten baseline) |
| Research SOTA | GENRE / ExtEnD / generative LLM-EL |

2026 年可上线的生产模式:NER → coref → đối với mỗi đề cập làm EL → sẽ cluster 折叠 thành mỗi cluster một thực thể theo quy luật──输出:document 中每个实体一个 KB id,而不是每个提到一个──

## 交付 nó
保存为 `outputs/skill-entity-linker.md`- Có thể là:

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

1. **Easy。**Trong `code/main.py`Trung, dựa trên 10 đề cập mơ hồ (Paris, Jordan, Apple) thực hiện trước + ngữ cảnh phân biệt đối xử.
2. **Medium。**用句变化器 mã hóa 50 个 个 个 模糊 đề cập. Embed 个候选人的描述.
3. **Hard。**构建一个1k-entity domain KB(例如你公司的员工+产品) ――实现端到端 NER + EL──在100条中延续的句子上测量精度和回召──

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
- [Milne, Witten (2008). Learning to Link with Wikipedia](https://www.cs.waikato.ac.nz/~ihw/papers/08-DM-IHW-LearningToLinkWithWikipedia.pdf) cơ bản trước + ngữ cảnh 方法。
- [Wu et al. (2020). Zero-shot Entity Linking with Dense Entity Retrieval (BLINK)](https://arxiv.org/abs/1911.03814) 基于嵌入 的主力方法──
- [De Cao et al. (2021). Autoregressive Entity Retrieval (GENRE)](https://arxiv.org/abs/2010.00904) 带 hạn chế giải mã của tạo EL。
- [Hoffart et al. (2011). Robust Disambiguation of Named Entities in Text (AIDA)](https://www.aclweb.org/anthology/D11-1072.pdf) điểm chuẩn 论文。
- [REL: An Entity Linker Standing on the Shoulders of Giants (2020)](https://arxiv.org/abs/2006.01969) 开源 sản xuất hàng loạt
