# Uzun bağlamlı değerlendirme  NIAH, RULER, LongBench, MRCR

> Gemini 3 Pro 宣称拥有10M 代币的背景──在1M 代币下,8-针 MRCR 降至26.3%──宣称 ≠可用──长文文评估 会告诉你正在上线的模型的实际容量──

**类型：**Öğrenme
**语言：**Python
**先修要求：**5 aşama · 13 Soru cevaplamaları)  5 aşama · 23 Sıkıştırma stratejileri)
**时间：**60 dakika kadar .

## 问题

Bir 200 sayfalık sözleşme var. Model 1M-token bağlamı olduğunu iddia ediyor. Sözleşmeyi içine koyup soruyor:

Bu, 2026 yılındaki bağlam-ücret boşluğudır. 1M veya 10M olarak yazılan bir düzenleme.

- **Retrieval（haystack 中的 single needle）：**Sınır modellerinde, duyuruların en yüksek değeri tamamlanmaya yaklaşana kadar.
- **Multi-hop / aggregation：**Çoğu model yaklaşık 128k'den fazla sürede hızla düştü.
- **对分散 facts 的 reasoning：**En başta başarısız olan görev.

Bu ders bu referans değerlerini açıklayacak. Onlar aslında neyi ölçüyor, ve alanınız için nasıl kendi kendini tanımlayan iğne testi oluşturulur.

## 概念

![NIAH baseline, RULER multi-task, LongBench holistic](../assets/long-context-eval.svg)

**Needle-in-a-Haystack（NIAH，2023）。**Bu, uzun bağlamlı başlangıç referansıdır. Bu görev üzerinde artık 和; bu gerekli ama yeterli olmayan bir temel çizgi değildir.

**RULER（Nvidia，2024）。**覆盖 4 个类别的 13 种任务类型:retrieval(single / multi-key / multi-value)、multi-hop tracing(variable tracking)、aggregation(common word frequency)、QA──context length 可配置(4k to 128k+)──NIAH'deki üst   及 multi-hop 上 başarısız olan modelleri ortaya çıkarır.

**LongBench v2（2024）。**503 Çeviri çoklu seçim sorular,8k-2M kelime bağlamları, altı görev sınıfı: tek belgeli QA、çok belgeli QA、 uzun bağlamlı öğrenme、 uzun diyalog、 kod repo、 uzun yapılandırılmış veriler── bu gerçek dünya uzun bağlamlı davranışların üretim sınıfı referansıdır──

**MRCR（Multi-Round Coreference Resolution）。**Büyük ölçekli çok dönüşlü çekirdek referansı── içerir 8-iğne、24-iğne、100-iğne 变体──暴露模型 在 Attention 退化前能同时处理多少事物──

**NoLiMa。**Diksan olmayan iğne──iğne 没有字面重叠; recovery 需要一步语义推理──比 NIAH 更难──

**HELMET。**拼接许多文件,并从任意一个中提问──测试 选择性关注──

**BABILong。**Bu yüzden, bu bir şey değil.

### 实际应该报告什么

- **Advertised context window。**规格表上的数字──
- **Effective retrieval length。**NIAH 某值下通过 (örneğin %90).
- **Effective reasoning length。**Çoklu hop veya birleştirme, 該值下通過──
- **Degradation curve。**Düzgünlük vs. bağlam uzunluğu, görevi tip ayrıntılı çizim olarak

Kişilik, bir kişinin kendini kaybetmesi için bir şey yapması gerekir.


```figure
gx-niah-decay
```

## Yapın onu.

### Adım 1: Alanınız için kendi kendini tanımlayın

Görüyorum .`code/main.py`骨架如下:

```python
def build_haystack(filler_text, needle, depth_ratio, total_tokens):
    if not (0.0 <= depth_ratio <= 1.0):
        raise ValueError(f"depth_ratio must be in [0, 1], got {depth_ratio}")
    if total_tokens <= 0:
        raise ValueError(f"total_tokens must be positive, got {total_tokens}")

    filler_tokens = tokenize(filler_text)
    needle_tokens = tokenize(needle)
    if not filler_tokens:
        raise ValueError("filler_text produced no tokens")

    # Repeat filler until long enough to fill the haystack body.
    body_len = max(total_tokens - len(needle_tokens), 0)
    while len(filler_tokens) < body_len:
        filler_tokens = filler_tokens + filler_tokens
    filler_tokens = filler_tokens[:body_len]

    insert_at = min(int(body_len * depth_ratio), body_len)
    haystack = filler_tokens[:insert_at] + needle_tokens + filler_tokens[insert_at:]
    return " ".join(haystack)


def score_niah(model, haystack, question, expected):
    answer = model.complete(f"Context: {haystack}\nQ: {question}\nA:", max_tokens=50)
    return 1 if expected.lower() in answer.lower() else 0
```

扫描 `depth_ratio`∈ {0, 0.25, 0.5, 0.75, 1.0} × `total_tokens`∈ {1k, 4k, 16k, 64k}── çizim sıcaklık haritası── İşte hedef modelinin NIAH kartı──

### Adım 2: Çoklu iğne 变体

```python
def build_multi_needle(filler, needles, total_tokens):
    depths = [0.1, 0.4, 0.7]
    chunks = [filler[:int(total_tokens * 0.1)]]
    for depth, needle in zip(depths, needles):
        chunks.append(needle)
        next_chunk = filler[int(total_tokens * depth): int(total_tokens * (depth + 0.3))]
        chunks.append(next_chunk)
    return " ".join(chunks)
```

Bu üç sihirli kelime gibi bu soruların hepsini bulmak gerekir.

### Adım 3: Çoklu hop değişken izleme(RULER tarzı)

```python
haystack = """X1 = 42. ... (filler) ... X2 = X1 + 10. ... (filler) ... X3 = X2 * 2."""
question = "What is X3?"
```

答案需要串联三次赋值――边界模型在128k 时,它的精度经常会降至50-70%──

### Adım 4: Yükümde LongBench v2

```python
from datasets import load_dataset
longbench = load_dataset("THUDM/LongBench-v2")

def eval_model_on_longbench(model, subset="single-doc-qa"):
    tasks = [x for x in longbench["test"] if x["task"] == subset]
    correct = 0
    for x in tasks:
        answer = model.complete(x["context"] + "\n\nQ: " + x["question"], max_tokens=20)
        if normalize(answer) == normalize(x["answer"]):
            correct += 1
    return correct / len(tasks)
```

按类别报告精度──总分 会隐藏很大的任务级差──

## 陷

- **仅 NIAH evaluation。**Bu test, bir çok hop testinin bir parçası olarak kullanılır.
- **Uniform depth sampling。**很多实现只测试深=0.5──测试深=0、0.25、0.5、0.75、1.0,中途失效应是真实存在的──
- **与 filler 的 lexical overlap。**Eğer iğne ile doldurmacı ortak anahtar kelimeler, geri almak çok basit olacaktır.
- **忽略 latency。**1M-token isteklerinin önceden doldurulması 30-120 saniye gerektirir.
- **Vendor-self-reported numbers。**OpenAI, Google, Antropik şehirler kendi oranlarını yayınlayacak.

## Kullan

2026 yılının birimi:

| 场景 | Benchmark |
|-----------|-----------|
| 快速 sanity check | 3 个 depths × 3 个 lengths 的自定义 NIAH |
| 生产级 model selection | 目标 length 下的 RULER（13 tasks） |
| 真实世界 QA quality | LongBench v2 single-doc-QA subset |
| Multi-hop reasoning | BABILong 或自定义 variable-tracing |
| Conversational / dialogue | 目标 length 下的 MRCR 8-needle |
| Model upgrade regression | 固定的内部 NIAH + RULER harness，在每个新 model 上运行 |

生产环境经验法则: ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒   ⇒ ⇒     ⇒ ⇒   ⇒ ⇒      ⇒                ⇒                                                                                                                                                                                                                  

## - Söyle.

保存为 `outputs/skill-long-context-eval.md`- ...

```markdown
---
name: long-context-eval
description: Design a long-context evaluation battery for a given model and use case.
version: 1.0.0
phase: 5
lesson: 28
tags: [nlp, long-context, evaluation]
---

Given a target model, target context length, and use case, output:

1. Tests. NIAH depth × length grid; RULER multi-hop; custom domain task.
2. Sampling. Depths 0, 0.25, 0.5, 0.75, 1.0 at each length.
3. Metrics. Retrieval pass rate; reasoning pass rate; time-to-first-token; cost-per-query.
4. Cutoff. Effective retrieval length (90% pass) and effective reasoning length (70% pass). Report both.
5. Regression. Fixed harness, rerun on every model upgrade, surface deltas.

Refuse to trust a context window from the model card alone. Refuse NIAH-only evaluation for any multi-hop workload. Refuse vendor self-reported long-context scores as independent evidence.
```

## 练习

1. **Easy。**构建一个3 个深度(0.25、0.5、0.75) × 3 个长度(1k、4k、16k) 的 NIAH──在任意模型上运行──将通过率 绘制成3×3热图──
2. **Medium。**添加一个3针变体――测量每长 下是否能找到回全部3个――与相同长的单针通过率对比――
3. **Hard。**构建一个变量追踪任务(X1 → X2 → X3,3 hops),Embedding 64k filler 中──测量 3 个边界模型的精度──报告每个模型的有效推理长──

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| NIAH | Needle in haystack | 在 filler 中植入一个 fact，让 model 找回它。 |
| RULER | 加强版 NIAH | 覆盖 retrieval / multi-hop / aggregation / QA 的 13 种任务类型。 |
| Effective context | 真实容量 | accuracy 仍高于阈值的长度。 |
| Lost in the middle | Depth bias | Models 对长输入中间部分的内容关注不足。 |
| Multi-needle | 一次多个 facts | 多个植入项；测试 Attention 的同时处理能力，而不只是 retrieval。 |
| MRCR | Multi-round coref | 8、24 或 100-needle coreference；暴露 Attention 饱和。 |
| NoLiMa | Non-lexical needle | Needle 和 query 没有字面 tokens 重叠；需要 reasoning。 |

## 延伸阅读

- [Kamradt (2023). Needle in a Haystack analysis](https://github.com/gkamradt/LLMTest_NeedleInAHaystack) 原始 NIAH repo。
- [Hsieh et al. (2024). RULER: What's the Real Context Size of Your Long-Context LMs?](https://arxiv.org/abs/2404.06654) Çoklu görev referansı。
- [Bai et al. (2024). LongBench v2](https://arxiv.org/abs/2412.15204) 真实世界 uzun bağlamlı değerlendirme
- [Modarressi et al. (2024). NoLiMa: Non-lexical needles](https://arxiv.org/abs/2404.06666)Daha zorlukla.
- [Kuratov et al. (2024). BABILong](https://arxiv.org/abs/2406.10149) Haystack'ta akıl yürütmek.
- [Liu et al. (2024). Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172) derinlik ayrımcılığı 论文。
