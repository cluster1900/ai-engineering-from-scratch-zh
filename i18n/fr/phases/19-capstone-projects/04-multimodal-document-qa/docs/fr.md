# Capstone 04  Document multimodale QA(Vision-First PDF、表格、图表)

> Le document-QA avant-coût de 2026 est passé de l'OCR-then-text  à la vision-first late interaction。ColPali、ColQwen2.5 和 ColQwen3-omni va créer chaque page PDF en image, en utilisant une interaction tardive multi-vectorielle pour y intégrer, et faire en sorte que la requête soit directement consultée jusqu'aux patches。 Pour les finances 10-K、论文科学和手写笔记, ce modèle est nettement meilleur que l'OCR-first。

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

##  problématique
Les entreprises possèdent une grande quantité de contenus qui seront traités par le pipeline OCR 搞乱的 PDF:带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意图片、手写批注──把这些内容按文字先处理,意味着丢失一半信号──2026 ans, la réponse est de faire une récupération multi-vectorielle tardive d'interaction sur l'image de page d'origine──ColPali (Illuin Tech) introduit cette méthode;ColQwen2.5-v0.2 和 ColQwen3- 推推确率──在 ViDoRe v3 ,vision-first retrieval a permis de séparer les différences significatives de contenu en O-then-high-text, et aussi dans la présentation de la présentation CR 格和图片手写大差距──

代价是存储和延迟──ColQwen Embedding 个页面有2048 补丁向量,而不是单个1024-dim Vector──原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50%裁剪──你将索引 10k 页面,测量 ViDoRe v3 nDCG@5,在2内提供答案,并与OCR-then-text baseline 直接比较──

## 概念
Interaction tardive signifie chaque requête Token ville avec chaque patch Token 打分, puis pour chaque requête Token 取最大分并求和──这样无需单个聚合向量,也能获得细粒度匹配──多向量指数(Vespa、Qdrant multi-vecteur 或 AstraDB) stockage par patch Embeddings, et lors de la récupération 运行 MaxSim──

Le répondant est un modèle de langage de vision, il reçoit une requête et une image de page, et en sort avec des régions de preuve (boxes liant ou références de page).

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
- 页面染: PyMuPDF (fitz), 180 DPI, portrait normalisé
- Modèle d'interaction tardive: ColQwen2.5-v0.2 ou ColQwen3-omni (Hugging Face 上的 vidore team)
- Index: 带 multi-vecteur champs de Vespa, ou Qdrant multi-vecteur, ou带 MaxSim de AstraDB
- Élagage: politique DocPruner 2026  conservation des patchs à haute variance, 50% de compression  et perte de précision < 0,5%)
- Retour de la RCA (Résumé)
- Répondeur VLM: auto-hébergé Qwen3-VL-30B ou hébergé Gemini 2.5 Pro;InternVL3  en tant que rétroaction
- Évaluation: V3V3VQV3DocVQA utilisé pour le raisonnement multi-pages
- Interface utilisateur du spectateur: Next.js 15, utiliser la couche de toile  montrer les régions de preuve


```figure
ce-late-interaction
```

## - Je le construis.
1. **Ingest.**遍历一个包含10k PDF 页面的语料库,覆盖10K、科学论文和扫描文档──将每页染为1536x2048 PNG──持久化`{doc_id, page_num, image_path}`Il y a une autre.

2. **Embed.**Dans chaque page, l'image est en ColQwen2.5-v0.2── sortie de forme approximative de 2048 个 dim 128 de patch Embeddings──应用 DocPruner 保留信号最强的一半──写入Vespa multi-vector field 或 Qdrant multi-vector──

3. **Query.**Pour chaque entrée en requête, utilisez la tour de requête  effectuer l'intégration (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement) )  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement)  (enregistrement) )  (enregistrement)  (enregistrement)  (en)  (en) )  (en)  (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en

4. **Synthesize.**Utilisez la requête et le top-5 de la page.

5. **Evidence regions.**Pour les réponses à effectuer un post-processus,提取被引用的地区──如果VLM 输出界框 ((Qwen3-VL 会这样做),就在观众中把它们染为叠加──

6. **OCR fallback.**Pour les pages qui sont identifiées comme formelles denses (en fonction de l'héuristique des différences d'image), la fonction Nougat ou dots.ocr, et le texte OCR seront introduits en tant que canal supplémentaire avec l'image.

7. **Eval.**运行 ViDoRe v3(retrieval nDCG@5)和 M3DocVQA(multi-page QA accuracy)。 également à utiliser dans le même langage 运行 OCR-then-text pipeline──产出一个内容类型 × approche Matrix──

8. **UI.**Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent

## Utilisez-le
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

## Je le livre.
`outputs/skill-doc-qa.md`描述交付物: un système de QA multimodale de document de vision, axé sur une base de données spécifiques, et évalué par ViDoRe v3 上与 OCR-then-text baseline 进行评估──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## 练习
1. Dans la même bibliothèque de textes, mesurer ColQwen2.5 v0.2 vs ColQwen3-omni── quelles pages une réponse à et l'autre va se perdre? à l'index  Ajouter une balise "Classe de contenu", pour être utilisée selon le type de route──

2. 激进地 prune Embeddings(75%、90%)── trouver le cliff de compression:ViDoRe nDCG@5 下降到OCR baseline 以下点──

3. 构建混合:并行运行 OCR-then-text 和 ColQwen, avec RRF 融合, reutiliser le réencodeur croisé.

4. Pour la mesure de la précision par dollar, il faut prendre en compte la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de

5. 添加手写笔记支持──染手写体, ColQwen 进行嵌入,测量检索──与手写 OCR管道对比──

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
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) Interaction tardive 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) points de contrôle prêts à la production
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) L'indice de base de RAG multimodal de plusieurs pages
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) pile de service de référence
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) indice de remplacement
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) indice géré alternatif
- [Nougat OCR](https://github.com/facebookresearch/nougat) Retour en arrière des RCR à équation
