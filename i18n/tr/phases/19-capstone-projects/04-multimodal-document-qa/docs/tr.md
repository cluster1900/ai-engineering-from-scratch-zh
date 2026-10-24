# Capstone 04  Multimodal Belge QA(Vision-First PDF、表格、图表)

> 2026 yılının belgesi-QA ön kenarı OCR-den sonra metin  dönüşüm vizyon-birinci geç etkileşime olacaktır KolPali、ColQwen2.5 和 ColQwen3-omni her PDF sayfasını görüntü olarak görüyor, ona çok vektör geç etkileşimle ekliyor, sorguyu doğrudan patchlere katılıyor, finansal 10-K için, bilim makale ve el yazısı notları, bu model OCR-birinci için çok daha iyidir.

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题
企业拥有大量会被OCR管线搞乱的 PDF:带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意图片、手写批注―― bunları metin önce 处理,意味着丢失半信号──2026 yılındaki cevap, orijinal sayfa görüntülerinde geç etkileşimlü çok vektör geri alımı yapmaktır──ColPali (Illuin Tech) bu yöntemi tanıttı ColQwen2.5-v0.2 和 ColQwen3- 推推确率──高 ViDoRe v3 üzerinde, görüş-önün geri alımı, anlamlı derecede O-then-high-text'e ayrılmış ve aynı zamanda tablolarda CR                                                                                                                                                                             

代价是存储和延迟──ColQwen Embedding Her sayfa yaklaşık 2048 补丁 vektörü var, tek 1024 boyutlu vektör değil──原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50%剪裁──你将索引 10k 页面,测量 ViDoRe v3 nDCG@5,在2s内提供答案,并与OCR-then-text基线直接比较──

## 概念
Geç etkileşim anlamı her sorgu Token şehirler ile her yama Token 打分, sonra her sorgu Token 取最大分并求和。 böylece 无需单个聚合向量,也能获得细粒度匹配──多向量索引(Vespa、Qdrant多向量或AstraDB) depolama parç Embeddings, ve geri çekim 时运行 MaxSim。

cevapçı bir vizyon dili modeli, soruyu alır, ve üst-k 检索页面图像,并输出带证据区域 (doxonu veya sayfa referansları ile) 答案──Qwen3-VL-30B、Gemini 2.5 Pro 和 InternVL3 ⇒ 2026 yılının önde gelen seçimi──公式和科学记号, OCR fallback (OCR) olarak görecektir.

评估 is a two-dimensional Matrix── one axis is content type──纯文本段落、密集表格、柱状/折线图、手写笔记、公式)──另一个轴是检索方法──视觉-first late interaction vs OCR-then-text vs hybrid)──每个单元格得到 nDCG@5 和答准确性──报告就是交付物──

## Yapılandırma
```
PDFs -> page renderer (PyMuPDF, 180 DPI)
           |
           v
  ColQwen2.5-v0.2 embed (multi-vector per page, ~2048 patches)
           |
           +------> DocPruner 50% compression
           |
           v
   multi-vector index (Vespa or Qdrant multi-vector)
           |
query ----+----> retrieve top-k pages (MaxSim)
           |
           v
  VLM answerer: Qwen3-VL-30B | Gemini 2.5 Pro | InternVL3
    inputs: query + top-k page images + optional OCR text
           |
           v
  answer with cited page numbers + evidence regions
           |
           v
  Streamlit / Next.js viewer: highlighted boxes on source page
```

## 技术
- 页面染: PyMuPDF (fitz),180 DPI,portret-normalize
- Geç etkileşim modeli: ColQwen2.5-v0.2 veya ColQwen3-omni(Hugging Face 上的 vidore ekibi)
- Endeks: 带 çok vektörlü alanı  Vespa,  Qdrant çok vektörlü alanı,  MaxSim  AstraDB
- Kesim: DocPruner 2026 politikası( yüksek değişkenlik patçlarını korumak,% 50 sıkıştırma ve doğruluk kaybı < 0,5%)
- OCR geri dönüşü (公式 / 密集表格):dots.ocr 或 Nougat
- VLM cevaplayıcı: kendi kendine konutlanan Qwen3-VL-30B veya konutlanan Gemini 2.5 Pro;InternVL3  fallback olarak
- Değerlendirme: ViDoRe v3 referans,M3DocVQA
- Görüntüleyici UI: Next.js 15, kullan obez üstlenmesi  göster kanıt bölgeleri


```figure
ce-late-interaction
```

## Yapın onu.
1. **Ingest.**10K PDF sayfaları içeren bir dil kütlesine, 10K bilim makale ve tarama dosyası kapsamına.`{doc_id, page_num, image_path}`- Evet.

2. **Embed.**Bu sayfa görüntüsüne göre, ColQwen2.5 v0.2 olarak kullanılır.

3. **Query.**Her bir giriş sorgu için, sorgu kulesini kullanın  Embedding yapın ((token-level embeddings)  Index için 运行 MaxSim:

4. **Synthesize.**Uzd sorgu 和 top-5 页面图像调用 Qwen3-VL-30B。Prompt: "Sadece sağlanan sayfaları kullanarak cevap verin. Her iddiayı (doc_id, sayfa) ile belirtin ve bölgeyi (sişim, tablo, paragraf) adlandırın".

5. **Evidence regions.**Bu nedenle, bu soruların cevaplarını bir sonraki süreçte ele almak için alıntılanan bölgelere başvurmak gerekir.

6. **OCR fallback.**Bilgi farkı heuristikasına dayanan, tanımlanmış formül yoğunluklu sayfalar için, Nougat veya dots.ocr uygulaması, OCR metnini bir ekstra yol olarak görüntü ile birlikte aktarır.

7. **Eval.**运行 ViDoRe v3(kıplama nDCG@5)和 M3DocVQA(çok sayfalı QA doğruluğu)。 ayrıca aynı dil kütlesinde aynı sentezör kullanmak 运行 OCR-then-text pipeline──产出一个内容类型 ×方法矩阵──

8. **UI.**Önceden yapım Streamlit prototipi; tekrar yapım Next.js 15 üretim izleyicisi, destekleyen her sayfa kanıt bölgesi üstlenmesi。

## Kullan
```
$ doc-qa ask "what was the 2024 operating margin change for segment EMEA?"
[retrieve]   top-5 pages in 320ms (ColQwen2.5, MaxSim, Vespa)
[synth]      qwen3-vl-30b, 1.4s, cited (form-10k-2024, p. 88) + (..., p. 92)
answer:
  EMEA operating margin moved from 18.2% to 16.8%, a 140bp decline.
  cited: 10-K-2024.pdf p.88 (Table 4, Segment Operating Margin)
         10-K-2024.pdf p.92 (MD&A, Operating Performance)
[viewer]     open with highlighted bounding boxes overlaid on p.88 Table 4
```

## - Söyle.
`outputs/skill-doc-qa.md`描述交付物: Bir vizyon-birincisi multimodal belge QA sistemi, belirli bir dil kütlesinin düzenlenmesi ve ViDoRe v3 上与OCR-then-text baseline 进行评估──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## 练习
1. Aynı dil kütüphanesinde ColQwen2.5 v0.2 vs ColQwen3-omni¬ hangi sayfalar bir cevap verebilir ve diğerleri kaybolabilir?

2. 激进地 prune Embeddings(75%、90%) ―― compression cliff:ViDoRe nDCG@5 下降到OCR基线 以下点──

3. 构建混合:并行运行 OCR-then-text 和 ColQwen, RRF 融合,再使用跨码码重排──混合 是否优于单独任一方法?

4. Qwen3-VL-30B'yi daha küçük VLM'e değiştirmek için Qwen2.5-VL-7B'yi kullanmak.

5. 添加手写笔记支持──染手写体, ColQwen ile 进行嵌入,测量检索──与手写 OCR管道对比──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Late interaction | "ColPali-style retrieval" | Query tokens 独立地与页面 patches 打分；MaxSim 聚合 |
| Multi-vector | "Per-patch embedding" | 每个文档有多个 Vector，而不是一个 pooled Vector |
| MaxSim | "Late-interaction scoring" | 对每个 query Token，在 document vectors 上取最大相似度；求和 |
| DocPruner | "Patch compression" | 2026 年的 pruning 方法，保留 50% patches 且 accuracy loss 可忽略 |
| ViDoRe v3 | "Document-retrieval benchmark" | 2026 年衡量 visual-document retrieval 的标准 |
| Evidence region | "Cited bounding box" | source page 上定位 answer span 的 bbox |
| OCR fallback | "Equation channel" | 与 vision 一起用于公式密集或表格密集页面的 text pipeline |

## 延伸阅读
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) Geç etkileşim 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) Üretime hazır kontrol noktaları
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) Çok sayfalık multimodal RAG tabanı
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) Referans servis yığın
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) alternatif indeks
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) alternatif yönetilen indeks
- [Nougat OCR](https://github.com/facebookresearch/nougat) Eşitliklere sahip OCR geri dönüşü
