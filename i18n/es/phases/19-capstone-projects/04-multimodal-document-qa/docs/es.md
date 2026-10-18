# Capstone 04  Documento multimodal QA(Visión-Primera PDF、表格、图表)

> El documento-QA del 2026 años 前沿 ya ha pasado de OCR-then-text 转向视觉-first late interaction──ColPali、ColQwen2.5 和 ColQwen3-omni va a ver cada página PDF como una imagen, con interacción tardía multi-vector para realizarla Embedding,并让查询 直接出席到补丁──En cuanto a las finanzas 10-K、论文科学和手写笔记, este modelo es mucho mejor que OCR-first──por favor, construya un pipeline de 10k páginas de arriba a abajo,并发布与 OCR-then-text的并排对比──

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

##  problemas
企业拥有大量会被OCR管道搞乱的 PDF:带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意图片、手写批注──把这些内容按文字先处理,意味着丢失一半信号──2026 答案是在原页图像上进行后期互动多向量检索──ColPali (Illuin Tech) introdujo este método;ColQwen2.5-v0.2 和ColQwen3-推推确率──在 ViDoRe v3 ,la primera recuperación de visión se ha dividido en un grado significativo en O-then-high text, y también en la tabla Cromi-contenido y la gran diferencia de escritura de gráficos 

代价是存储和延迟──ColQwen Embedding Cada página tiene aproximadamente 2048 补丁矢量, no un solo 1024-dim Vector──原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50%剪裁──你将索引 10k 页面,测量 ViDoRe v3 nDCG@5,在 2 内提供答案,并与OCR-then-text baseline 直接比较──

## 概念
Interacción tardía significa que cada consulta Token ciudadán con cada parche Token 打分, luego para cada consulta Token 取最大分并求和── así no se necesita un solo vector agrupado, también se puede obtener pequeña medida匹配──multi-vector índice((Vespa、Qdrant multi-vector o AstraDB) almacenamiento por parche Embeddings, y en la recuperación 时运行 MaxSim──

El answerer es un modelo de lenguaje de visión, que recibe una consulta y arriba k 检索页面图像,并输出带证据区域(boxes de enlace o referencias de página) de la respuesta.

评估是一个二维矩阵――一个轴是内容类型――纯文本段落、密集表格、柱状/折线图、手写笔记、公式)――另一个轴是检索方法――视觉-first late interaction vs OCR-then-text vs hybrid)――每个单元格得到 nDCG@5 和答案精度――报告就是交付物物――

## 架构
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
- 页面染: PyMuPDF (fitz), 180 DPI, retrato-normalizado
- Modelo de interacción tardía: ColQwen2.5-v0.2 o ColQwen3-omni(Hugging Face 上的 vidore team)
- Indice: 带 multi-vector campo de Vespa, o Qdrant multi-vector, o带 MaxSim de AstraDB
- Triturado: DocPruner 2026 política de retención de parches de alta variación, 50% de compresión y pérdida de precisión < 0,5%)
- OCR fallback (en inglés)
- Responder VLM: auto-hosted Qwen3-VL-30B o alojado Gemini 2.5 Pro;InternVL3  como retroceso
- Evaluación: ViDoRe v3 benchmark,M3DocVQA Usado para el razonamiento de varias páginas
- Interfaz de usuario del visor: Next.js 15, usar capa de tela  mostrar regiones de evidencia


```figure
ce-late-interaction
```

## Construirlo
1. **Ingest.**穿穿穿一个包含10k PDF 页面的语料库,覆盖10k、科学论文和扫描文档──将每页染为1536x2048 PNG──持久化`{doc_id, page_num, image_path}`¿Qué es eso?

2. **Embed.**En cada página de imagen se ejecuta ColQwen2.5-v0.2──输出形状约为 2048 个 dim 128 的补丁嵌入式──应用 DocPruner 保留信号最强的一半──写入Vespa multi-vector field 或 Qdrant multi-vector──

3. **Query.**Para cada entrada de la consulta, utilizar la torre de consulta  realizar la incorporación (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding)  (embedding) )  (embedding)  (embedding)  (embedding)  (embedding) )  (embedding)  (embedding)  (embedding)  (embedding) )  (embedding)  (embedding)  (embedding) )  ()

4. **Synthesize.**Utilice la consulta 和 top-5 页面图像调用 Qwen3-VL-30B──Prompt: "Responda utilizando sólo las páginas suministradas. Cite cada reclamo por (doc_id, página) y nombre la región (figura, tabla, párrafo)."

5. **Evidence regions.**Para la respuesta se realiza un proceso posterior, se extraen las regiones citadas. Si el VLM 输出 bounding boxes (Qwen3-VL 会这样做), se encuentran en el espectador en la que se colocan en superposición.

6. **OCR fallback.**Para las páginas que se identifican como fórmulas densas (en base a la heurística de la diferencia entre imágenes), se puede utilizar Nougat o dots.ocr, y se puede introducir texto OCR como un extra camino junto con imágenes.

7. **Eval.**运行 ViDoRe v3(recuperar nDCG@5) y M3DocVQA(acurateza de QA de varias páginas)。 también debe utilizarse en la misma base de palabras 运行 OCR-then-text pipeline──产出一个内容-type × approach Matrix──

8. **UI.**先做 Streamlit prototipo;再做 Next.js 15 espectador de producción, apoyo por página evidencia-región superposición。

## Usalo
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

##  entregarlo
`outputs/skill-doc-qa.md`描述交付物: un sistema de evaluación de documentos multimodal de primera visión, dirigido a un determinado material de comunicación, y evaluado en ViDoRe v3 上与 OCR-then-text baseline.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

##  ejercicios
1. En la misma base de datos, se mide ColQwen2.5 v0.2 vs ColQwen3-omni. ¿Qué páginas una puede responder y otra puede perderse?

2. 激进地 prune Embeddings(75%、90%)── encontrar acantilado de compresión:ViDoRe nDCG@5 下降到OCR baseline 以下点──

3. 构建混合:并行运行 OCR-then-text 和 ColQwen, con RRF 融合, reutilizar el re-ranqueo de codificadores cruzados―hybrid ¿es o no superior a un método único? ¿en qué lugares ayuda más?

4. Para medir la precisión por dólar, se debe utilizar el método de medición de la precisión.

5. 添加手写笔记支持──染手写体,使用 ColQwen 进行嵌入,测量检索──与手写 OCR管道对比──

## 关键术语: "El hombre es un hombre"
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
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) Interacción tardía 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文  基础方法论文  基础方法论文  基础方法论文  基础方法论文  基础方法论文  基础方法论文 基础方法论文 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) Puntos de control listos para la producción
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) Línea de base de RAG multimodal de varias páginas
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) pila de servicio de referencia
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) índice alternativo
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) índice administrado alternativo
- [Nougat OCR](https://github.com/facebookresearch/nougat) Retrocesión de la OCR con capacidad de ecuación
