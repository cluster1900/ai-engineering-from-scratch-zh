# Capstone 04  Documentos multimodal QA(Visão-Primeira PDF、表格、图表)

> O documento-QA de 2026 já passou de OCR-then-text  para visão-first late interaction──ColPali、ColQwen2.5 和 ColQwen3-omni irá criar cada página PDF como imagem, com interação tardia multi-vector para implementá-la, e deixar que a consulta compareça diretamente aos patches──para o financeiro 10-K、论文科学和手写笔记, este modelo é muito melhor do que OCR-first── por favor, construam um pipeline em 10k páginas de ponta a ponta, e publiquem em comparação com OCR-then-text 并排排对比──

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题
As empresas têm uma grande quantidade de dados que serão manipulados pelo pipeline OCR 乱乱的 PDF:带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意图片、手写批注──把这些内容按文先处理,意味着丢失一半信号──2026 答案是对原页图像进行迟交互多向量检索──ColPali (Illuin Tech) introduziu este método;ColQwen2.5-v0.2 和ColQwen3-推推确率──在ViDoRe v3 上,视觉第一检索分分分准了有意度到O-then-hightext,并在表表表表表表表表表表表表表格和图片幅度差扩大──

代价是存储和延迟──ColQwen Embedding Cada página tem cerca de 2048 补丁矢量, não um único 1024-dim Vector──原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50%裁剪──你将索引 10k 页面,测量 ViDoRe v3 nDCG@5,在2s内提供答案,并与OCR-then-text baseline 直接比较──

## 概念
Interação tardia significa que cada consulta Token cidade vai com cada parche Token 打分, então para cada consulta Token 取最大分并求和── assim não é necessário um único vector em conjunto, também pode obter uma pequena quantidade de correspondência──multi-vector índice((Vespa、Qdrant multi-vector ou AstraDB) armazenamento por parche Embeddings, e em recuperação 时运行 MaxSim──

Responder é um modelo de linguagem de visão, que recebe consulta e top-k 检索页面图像,并输出带证据区域(boxes bounding 或 page references) 答案──Qwen3-VL-30B、Gemini 2.5 Pro 和 InternVL3 是 2026 年的前沿选择──对于公式和科学记号,将将将OCR fallback(Nougat、dots.ocr) 作为可选文本通道拼接进来──

评估是一个二维矩阵――一个轴是内容类型(纯文本段落、密集表格、柱状/折线图、手写笔记、公式) ――另一个轴是检索方法(视觉-first late interaction vs OCR-then-text vs hybrid) ―― cada单元格得到 nDCG@5 和答案精度――报告就是交付物物――

## Arquitetura
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
- Modelo de interação tardia: ColQwen2.5-v0.2 ou ColQwen3-omni(Hugging Face 上的vidore team)
- Índice: 带 multi-vector campo de Vespa, ou Qdrant multi-vector, ou带 MaxSim de AstraDB
- Trituramento: Política DocPruner 2026 ((Restaurar os patches de alta variação, 50% de compressão                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
- OCR fallback(公式 / 密集表格):dots.ocr 或 Nougat
- Responsador VLM: auto-host Qwen3-VL-30B ou gerenciado Gemini 2.5 Pro;InternVL3  como fallback
- Avaliação: ViDoRe v3 benchmark,M3DocVQA Usado para raciocínio de várias páginas
- Interfaça de visualização: Next.js 15, usar tela de sobreposição  mostrar regiões de evidências


```figure
ce-late-interaction
```

## Construí-lo
1. **Ingest.**穿穿越一个包含10k PDF 页面的语料库,覆盖10K、科学论文和扫描文档──将每页染为1536x2048 PNG──持久化`{doc_id, page_num, image_path}`- Não.

2. **Embed.**Em cada página imagem em que se executa ColQwen2.5-v0.2──输出形状约为 2048 个 dim 128 的补丁嵌入式──应用 DocPruner 保留信号最强的一半──写入Vespa multi-vector field或Qdrant multi-vector──

3. **Query.**Para cada entrada de consulta, use query tower  carry Embedding (embutidas em nível de tokens) ⋅ para index 运行 MaxSim: para cada consulta Token, em página patch Embeddings 上取最大 dot-product 并求和──返回 top-k 页面──

4. **Synthesize.**Use query 和 top-5 页面图像调用 Qwen3-VL-30B──Prompt: "Responde usando apenas as páginas fornecidas. Cite cada reivindicação por (doc_id, página) e nome a região (figura, tabela, parágrafo). "

5. **Evidence regions.**Para responder a um processo pós-processo, é necessário que as regiões citadas sejam processadas.

6. **OCR fallback.**Para a página de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações de formações

7. **Eval.**运行 ViDoRe v3(retrieval nDCG@5)和 M3DocVQA(multi-page QA accuracy)。 também deve ser usado no mesmo linguagem 运行 OCR-then-text pipeline──产出一个内容类型 ×方法矩阵──

8. **UI.**Primeiro fazer Protótipo Streamlit;再做 Next.js 15 espectador de produção, apoiar por página evidência-região sobrelaje。

## Use-o
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

## Entrega-o
`outputs/skill-doc-qa.md`描述交付物: um sistema de QA multimodais de primeiro plano, orientado para uma determinada linguagem, e avaliado em ViDoRe v3 上与 OCR-then-text baseline.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## 练习
1. Em uma mesma linguagem, a pesquisa ColQwen2.5 v0.2 vs ColQwen3-omni.

2. 激进地 prune Embeddings(75%、90%)。 encontrar o penhasco de compressão:ViDoRe nDCG@5 下降到OCR baseline 以下点。

3. 构建混合:并行运行 OCR-then-text 和 ColQwen, usando RRF 融合, reutilizar re-ranking cross-encoder── híbrido 是否优于单独任一方法?

4. Qwen3-VL-30B 替换为更小的VLM(Qwen2.5-VL-7B) ⋅ Messação de precisão por dólar 曲线──

5. 添加手写笔记支持──染手写体,使用 ColQwen 进行嵌入,测量检索──与手写 OCR管道对比──

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
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) Interação tardia 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) Pontos de controlo prontos para produção
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) Linha de base do RAG multimodal de várias páginas
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) Estaca de serviço de referência
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors)Indice alternativo
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) índice administrado alternativo
- [Nougat OCR](https://github.com/facebookresearch/nougat) Redução de RCO com capacidade de equação
