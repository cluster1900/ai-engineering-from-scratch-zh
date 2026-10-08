# Quan hệ khai thác với kiến thức Hình đồ xây dựng

> NER 找到了实体――entity linking 定定了它们──relation extraction 找到它们之间的边缘──Knowledge Graph 是节点、边和其来源的总和──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 25 (Entity Linking)
**Time:** ~60 分钟

## 问题

分析师读到:"Tim Cook trở thành CEO của Apple vào năm 2011. "

- `(Tim Cook, role, CEO)`
- `(Tim Cook, employer, Apple)`
- `(Tim Cook, start_date, 2011)`
- `(Apple, type, Organization)`

Tín kết hợp (RE) 将自由文本转成结构化三倍 `(subject, relation, object)` Sau khi tích hợp các ngôn ngữ, bạn đã có Knowledge Graph.

Câu hỏi năm 2026: LLM sẽ rất tích cực thu hút các mối quan hệ.

## 概念

![Text → triples → knowledge graph](../assets/relation-extraction.svg)

**Triple 形式。** `(subject_entity, relation_type, object_entity)` Quan hệ từ khóa ontology (nhiên tính của WikiData, FIBO, UMLS) hoặc mở tập hợp (OpenIE, Anything Anything Can)

**三种抽取方法。**

1. **Rule / pattern-based。**Các mẫu Hearst:"X như Y" → `(Y, isA, X)`再加手写regex脆弱精确可解释
2. **Supervised classifier。**给定一个句子中的两个实体提到, từ cố định集合中预测关系──训练到 TACRED、ACE、KBP──2015-2022 年的标准方法──
3. **Generative LLM。**Mô hình nhanh 输出 triples──开箱即用──需要来源,否则会幻觉看似合理的垃圾内容──

**AEVS (Anchor-Extraction-Verification-Supplement, 2026)。**当前的幻觉缓解框架:

- **Anchor。**Sử dụng xác định vị trí nhận dạng từng thực thể span và mối quan hệ-phrase span.
- **Extract。**生成链接到杆跨度的三倍──
- **Verify。**Đưa mỗi phần tử ba phù hợp với văn bản nguồn; từ chối bất kỳ nội dung không được hỗ trợ nào.
- **Supplement。**Pass bảo hiểm  đảm bảo không có khoảng thời gian được neo bị bỏ qua.

Sự ảo giác sẽ giảm đáng kể.

**open-vs-closed 取舍。**

- **Closed ontology。** danh sách tài sản cố định (ví dụ: 11,000+ tài sản của Wikidata) 可预测──可查询──难以凭空编造──
- **Open IE。**Bất cứ động từ ngắn gọn nào có thể trở thành mối quan hệ.

生产级 KGs thường sử dụng hỗn hợp: sử dụng Open IE để tìm thấy, sau đó trong hợp并进主图 之前将关系 canonicalize đến closed ontology。


```figure
relation-triples
```

## 构建

### 步骤 1: 基于模式的抽取

```python
PATTERNS = [
    (r"(?P<s>[A-Z]\w+) (?:is|was) (?:a|an|the) (?P<o>[A-Z]?\w+)", "isA"),
    (r"(?P<s>[A-Z]\w+) (?:is|was) born in (?P<o>\w+)", "bornIn"),
    (r"(?P<s>[A-Z]\w+) works? (?:at|for) (?P<o>[A-Z]\w+)", "worksAt"),
    (r"(?P<s>[A-Z]\w+) founded (?P<o>[A-Z]\w+)", "founded"),
]
```

查看 `code/main.py`Trong bộ máy thu thập đồ chơi hoàn chỉnh. Các mô hình nghe vẫn xuất hiện trong các đường ống cụ thể về lĩnh vực, vì chúng có thể được điều chỉnh.

### 步骤 2: Có quan sát quan hệ

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification

tok = AutoTokenizer.from_pretrained("Babelscape/rebel-large")
model = AutoModelForSequenceClassification.from_pretrained("Babelscape/rebel-large")

text = "Tim Cook was born in Alabama. He later became CEO of Apple."
encoded = tok(text, return_tensors="pt", truncation=True)
output = model.generate(**encoded, max_length=200)
triples = tok.batch_decode(output, skip_special_tokens=False)
```

REBEL là một bộ thu thập liên quan theo dõi:输入 văn bản,输出 triples,并且已经使用Wikidata property ids──它在远程监督数据上精细调──标准开权基线──

### Bước 3: Phân xuất bằng LLM của việc neo

```python
prompt = f"""Extract (subject, relation, object) triples from the text.
For each triple, include the exact character span in the source text.

Text: {text}

Output JSON:
[{{"subject": {{"text": "...", "span": [start, end]}},
   "relation": "...",
   "object": {{"text": "...", "span": [start, end]}}}}, ...]

Only include triples fully supported by the text. No inference beyond what is stated.
"""
```

Để mỗi lần trả lại với nguồn 核对―― từ chối bất cứ điều gì `text[start:end] != triple_entity`Kết quả: Đây là bước "thêm nhận" AEVS dạng tối thiểu.

### 步骤 4: canonicalize đến ontology đóng

```python
RELATION_MAP = {
    "is the CEO of": "P169",       # "chief executive officer"
    "was born in":   "P19",         # "place of birth"
    "founded":        "P112",       # "founded by" (inverted subject/object)
    "works at":       "P108",       # "employer"
}


def canonicalize(relation):
    rel_low = relation.lower().strip()
    if rel_low in RELATION_MAP:
        return RELATION_MAP[rel_low]
    return None   # drop unmapped open relations or route to manual review
```

Canonicalization thường chiếm 60-80% công việc xây dựng.

### 步骤 5: 构建一个小图并查询

```python
triples = extract(text)
graph = {}
for s, r, o in triples:
    graph.setdefault(s, []).append((r, o))


def neighbors(node, relation=None):
    return [(r, o) for r, o in graph.get(node, []) if relation is None or r == relation]


print(neighbors("Tim Cook", relation="P108"))    # -> [(P108, Apple)]
```

Đây là mỗi đơn vị nguyên tử của hệ thống RAG-over-KG.

## 常见陷

- **RE 前先做 coreference。**"Ông ấy đã thành lập Apple"  RE 需要知道 "Ông ấy" 是谁──先运行核心f (đọc 24)──
- **Entity canonicalization。**"Apple Inc" và "Apple" phải được giải quyết đến cùng một nút.
- **Hallucinated triples。**LLM 会输出文本不支持的三倍――强制跨度验证――
- **Relation canonicalization drift。**Open IE relations 不一致("đã sinh ra trong," "đã đến từ," "đã là một người bản địa của")。折叠到法典 ids,否则图图 无法查询。
- **Temporal errors。**"Tim Cook là CEO của Apple"  现在为真,2005年为假。许多关系 有时间边界──使用资格(Wikidata 中的 `P580`giờ bắt đầu`P582`Thời gian kết thúc) 💚
- **Domain mismatch。**REBEL trên Wikipedia 上训练──法律、医学和科学文本 thường yêu cầu các mô hình RE được điều chỉnh tốt.

## 使用

2026 năm:

| Situation | Pick |
|-----------|------|
| 快速生产、通用 domain | REBEL 或 LlamaPred，并进行 Wikidata canonicalization |
| Domain-specific（biomed、legal） | SciREX-style domain fine-tune + custom ontology |
| LLM-prompted、已审计输出 | AEVS pipeline：anchor → extract → verify → supplement |
| 高容量 news IE | Pattern-based + supervised hybrid |
| 从零构建 KG | Open IE + manual canonicalization pass |
| Temporal KG | 使用 qualifiers 抽取（start/end time、point in time） |

集成模式:NER → coref → liên kết thực thể → khai thác mối quan hệ → bản đồ ontology → tải đồ họa── mỗi giai đoạn đều là tiềm năng质量门──

## 交付

保存为 `outputs/skill-re-designer.md`- Có thể là:

```markdown
---
name: re-designer
description: Design a relation extraction pipeline with provenance and canonicalization.
version: 1.0.0
phase: 5
lesson: 26
tags: [nlp, relation-extraction, knowledge-graph]
---

Given a corpus (domain, language, volume) and downstream use (KG-RAG, analytics, compliance), output:

1. Extractor. Pattern-based / supervised / LLM / AEVS hybrid. Reason tied to precision vs recall target.
2. Ontology. Closed property list (Wikidata / domain) or open IE with canonicalization pass.
3. Provenance. Every triple carries source char-span + doc id. Non-negotiable for audit.
4. Merge strategy. Canonical entity id + relation id + temporal qualifiers; dedup policy.
5. Evaluation. Precision / recall on 200 hand-labelled triples + hallucination-rate on LLM-extracted sample.

Refuse any LLM-based RE pipeline without span verification (source provenance). Refuse open-IE output flowing into a production graph without canonicalization. Flag pipelines with no temporal qualifier on time-bounded relations (employer, spouse, position).
```

## 练习

1. **Easy。**Trong 5 câu bài báo tin tức 上运行 `code/main.py`Trung tâm máy lấy mẫu.
2. **Medium。**Trong cùng một câu sử dụng REBEL (hoặc LLM nhỏ) ⋅Triple (so sánh) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (trước) ⋅Triple (traduct) ⋅Triple (traduct) ⋅Triple (traduct) ⋅Triple (traduct) ⋅Triple (traduct)
3. **Hard。**构建 AEVS pipeline: sử dụng trích dẫn LLM + đối với nguồn kiểm tra xác minh khoảng thời gian.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Triple | Subject-relation-object | `(s, r, o)` tuple，是 KG 的原子单元。 |
| Open IE | Extract anything | 开放词汇 relation phrases；高 recall，低 precision。 |
| Closed ontology | Fixed schema | 有边界的 relation types 集合（Wikidata、UMLS、FIBO）。 |
| Canonicalization | Normalize everything | 将表层名称 / relations 映射到 canonical ids。 |
| AEVS | Grounded extraction | Anchor-Extraction-Verification-Supplement pipeline (2026)。 |
| Provenance | Source-of-truth link | 每个 triple 都携带指向其 source 的 doc id + char-span。 |
| Distant supervision | Cheap labels | 将 text 与现有 KG 对齐，以创建 training data。 |

## 延伸阅读

- [Mintz et al. (2009). Distant supervision for relation extraction without labeled data](https://www.aclweb.org/anthology/P09-1113.pdf) giám sát từ xa 论文。
- [Huguet Cabot, Navigli (2021). REBEL: Relation Extraction By End-to-end Language generation](https://aclanthology.org/2021.findings-emnlp.204.pdf) tiếp theo tiếp theo RE 主力方案
- [Wadden et al. (2019). Entity, Relation, and Event Extraction with Contextualized Span Representations (DyGIE++)](https://arxiv.org/abs/1909.03546) 联合 IE。
- [AEVS — Anchor-Extraction-Verification-Supplement framework](https://www.mdpi.com/2073-431X/15/3/178) 2026 ảo giác giảm 设计。
- [Wikidata SPARQL tutorial](https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial) các truy vấn biểu đồ theo quy luật。
