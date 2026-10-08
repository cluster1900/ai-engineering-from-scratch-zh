# Koreferans Kararı

>  ona telefon eder. O, hiç cevap vermez. Doktor öğle yemeğinde.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 5 · 06 (NER), Phase 5 · 07 (POS & Parsing)
**Time:** ~60 分钟

## 问题
Bir 300 kelime makalesinden Apple Inc.'in her bir anılmasını çekmek çok zor bir durumdur.

Coreference Resolution, tümünü aynı gerçek dünya varlığının ifade bağlantısını bir kümeye yönlendirecek.

Neden 2026 yılında önemli:

- Özet: CEO ilan etti... vs Tim Cook ilan etti...  özet 应该说出 CEO's名字──
- Soruya cevap: Kimdi aradı?
- Bilgi çıkarımı: bir bilgi grafiği 里同时有 PER1 kurucu Apple 和 Jobs kurucu Apple 作为不同条目,这是错的──
- Çok belgeli IE:合并多篇关于同一事件文章中的提到,就是跨文档核心参考──

## 概念
![Coreference clustering: mentions → entities](../assets/coref.svg)

**The task.**输入:一个文件──输出:mention(span) 之集群, bunların her biri bir kuruluş yönündedir──

**Mention types.**

- **Named entity.**Tim Cook
- **Nominal.**CEO'nun şirketin
- **Pronominal.**O, o, onlar, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o, o,
- **Appositive.**Apple'ın CEO'su Tim Cook,

**Architectures.**

1. **Rule-based (Hobbs, 1978).**基于语法树的代词解析,使用语法规则──很好的基线──在代词上意外地难以超越──
2. **Mention-pair classifier.**Her bir referans için, bunların daha önemli olup olmadığını tahmin etmek için geçici kapanış yoluyla 聚类──2016年前的标准做法──
3. **Mention-ranking.**Her bir anket için, 排序候选前史 (→ 無前史) ︎) ︎
4. **Span-based end-to-end (Lee et al., 2017).**Transformer encoder──枚举所有长度上限内的候选 span──预测提到得点──为每个 span 预测前兆-概率──贪心聚类──现代默认方案──
5. **Generative (2024+).**Bir LLM:Bu metindeki her isim ve öncesini listele. 在简单案例上效果不错,但在长文档和少见引用上会吃力──

**The evaluation metrics.**5 standart göstergesi vardır. Çünkü hiçbir tek gösterge kümelemeyi tam olarak yakalayabilir.

**Known hard cases.**

- kesin açıklama Indirect number pages sebelum indeksiyon entite¬si
- Anaphora köprüleri  tekerlekleri  → 之前提到的一辆车)。
- Çinçe 日文等 dillerinde sıfır anafora。
- Kataphora (İşçi adı) When **she**İçeri girdi, Mary gülümsedi.


```figure
coref-links
```

## Yapın onu.
### 步骤 1: önceden eğitilmiş sinir korferansı (AllenNLP / spaCy-eksperimantal)

```python
import spacy
nlp = spacy.load("en_coreference_web_trf")   # experimental model
doc = nlp("Apple announced new products. The company said they would ship soon.")
for cluster in doc._.coref_clusters:
    print(cluster, "->", [m.text for m in cluster])
```

Daha uzun bir belgeye göre, benzer sonuçlar elde edeceksiniz:
- Cluster 1: [Apple, Şirket, onlar]
- Grup 2: [yeni ürünler]

### 步骤 2: Kurallara dayalı isim çözücü (öğretim)

- Bakın .`code/main.py`Sadece stdlib kullanımı ile gerçekleştirilen:

1. 抽取 mention:nameed entities (nameed entities) 大写 span) 代名 (pronouns) dict search (dict search) definite descriptions (definite descriptions) the X) 
2. Her isim için, önce K 个 bahset,并按以下因素打分:
   - Cinsiyet/sayı anlaşması(heuristik)
   - (Büyük bir şey)
   - Sintiksel rol (() öncelikli konu)
3. En yüksek geçmişte olan...

Bu, sinirsel modeller ile yarışamaz. Ama arama alanını ve sonundan sonuna kadarki modelleri gösterir.

### 3 adım: LLM kullanmak  ortak bir çözüm

```python
prompt = f"""Text: {text}

List every pronoun and noun phrase that refers to a person or company.
Cluster them by what they refer to. Output JSON:
[{{"entity": "Apple", "mentions": ["Apple", "the company", "it"]}}, ...]
"""
```

需要注意两种失败模式──第一,LLMs 会过度合并(把指向两个不同人的him和her合并)──第二,LLMs 会在长文档中漏掉提到──始终使用跨额支付检验──

### 4 adım: değerlendirme

標準 conll-2012 script 会計算 MUC、B3、CEAF-φ4,并報告平均值──内部 eval,先在带标注的测试集合 上做跨度级精度 和回忆,再加入引用链接 F1──

## 陷
- **Singleton explosion.**Bazı sistemler her bir anıyı kendi klüsterine rapor eder. B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B3 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B4 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B5 B
- **Pronouns in long context.**2000'den fazla token'ın belgesi.
- **Gender assumptions.**硬编码性别规则 会在非二进制参照、组织、动物 上失效──使用学会模型或中立评分──
- **LLM drift on long docs.**单次 API 调用可靠地对50+ 段落中的提到 聚类──使用滑窗+ merge──

## Kullan
2026 yılının birimi:

| Situation | Pick |
|-----------|------|
| English, single document | `en_coreference_web_trf` (spaCy-experimental) 或 AllenNLP neural coref |
| Multilingual | 在 OntoNotes 或 Multilingual CoNLL 上训练的 SpanBERT / XLM-R |
| Cross-document event coref | 专门的 end-to-end models（2025–26 SOTA） |
| Quick LLM baseline | 带 structured-output coref prompt 的 GPT-4o / Claude |
| Production dialog systems | Rule-based fallback + neural primary + critical slots 的 manual review |

2026 yıl enerjinin üst çizgisi: önce NER'yi yürüt, yeniden yürüt, çekirdekleri NER'deki kurumlara birleştir.

## - Söyle.
保存为 `outputs/skill-coref-picker.md`- ...

```markdown
---
name: coref-picker
description: Pick a coreference approach, evaluation plan, and integration strategy.
version: 1.0.0
phase: 5
lesson: 24
tags: [nlp, coref, information-extraction]
---

Given a use case (single-doc / multi-doc, domain, language), output:

1. Approach. Rule-based / neural span-based / LLM-prompted / hybrid. One-sentence reason.
2. Model. Named checkpoint if neural.
3. Integration. Order of operations: tokenize → NER → coref → downstream task.
4. Evaluation. CoNLL F1 (MUC + B³ + CEAF-φ4 average) on held-out set + manual cluster review on 20 documents.

Refuse LLM-only coref for documents over 2,000 tokens without sliding-window merge. Refuse any pipeline that runs coref without a mention-level precision-recall report. Flag gender-heuristic systems deployed in demographically diverse text.
```

## 练习
1. **Easy.**- Evet .`code/main.py`中对 5 个手写段落运行 kural tabanlı çözücü―― ground truth 测量mention-link accuracy―
2. **Medium.**Bir haber makalesinde önceden eğitilmiş sinir merkezi modeli kullanmakla... kendi el yazma ile karşılaştırıldığında...
3. **Hard.**建設一本核心的改善NER管道:先 NER,再通过核心的集群 合并──衡量 100 篇文章上 NER'den sadece NER'e göre kuruluş kapsamının iyileştirilmesi──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mention | 一个 reference | 一段指向某个 entity 的文本（name、pronoun、noun phrase）。 |
| Antecedent | “it” 指向什么 | 后续 mention 与之 corefer 的更早 mention。 |
| Cluster | entity 的 mentions | 全部指向同一个真实世界 entity 的 mention 集合。 |
| Anaphora | 后向 reference | 后续 mention 指向更早内容（“he” → “John”）。 |
| Cataphora | 前向 reference | 更早 mention 指向后续内容（“When he arrived, John...”）。 |
| Bridging | 隐式 reference | “I bought a car. The wheels were bad.”（那辆 car 的 wheels。） |
| CoNLL F1 | leaderboard 上的数字 | MUC、B³、CEAF-φ4 F1 scores 的平均值。 |

## 延伸阅读
- [Jurafsky & Martin, SLP3 Ch. 26 — Coreference Resolution and Entity Linking](https://web.stanford.edu/~jurafsky/slp3/26.pdf) 经典教材章节。
- [Lee et al. (2017). End-to-end Neural Coreference Resolution](https://arxiv.org/abs/1707.07045)  基于 span 的端到端──
- [Joshi et al. (2020). SpanBERT](https://arxiv.org/abs/1907.10529) 改进 coref'ın öncesi eğitimleri
- [Pradhan et al. (2012). CoNLL-2012 Shared Task](https://aclanthology.org/W12-4501/) referans göstergesi。
- [Hobbs (1978). Resolving Pronoun References](https://www.sciencedirect.com/science/article/pii/0024384178900064) kurallara dayalı 经典方法──
