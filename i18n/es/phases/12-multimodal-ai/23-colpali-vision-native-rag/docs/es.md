# ColPali y el documento RAG de visión nativa

> 传统RAG 会将 PDF 解析成文本,切成块,Embedding chunks,并存储矢量──每一步都会丢失信号:OCR 会丢失图表数据,chunking会断断表行,text embeddings会忽略数字──ColPali(Faysse et al., julio 2024) planteó una pregunta más simple: ¿por qué hay que extraer texto? directamente a través de PaliGemma hacer embedimiento a la imagen de página, hacer una retraso de interacción tardía al estilo ColBERT, hacer retorno,并保留 archivos que llevan todos los diseños, figuras, fuentes y señales de formato── publicar puntos de referencia 显示: en documentos visuales ricos, de extremo a extremo, precisión comparable al texto-RAG alta 20-40%──Colwen2S 和 Colwen RRAG 展 展 阅读本本本本本本本本本本本本本本本本, Visum-Colwen-Colwen 并建微分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分,

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**先修要求：**Fase 11 (LLM Engineering  RAG 基础), Fase 12 · 05 (LLaVA)
**Time:** ~180 minutes

## El objetivo del aprendizaje

- 解释双码码检索 (todos los documentos de un vector) y retorno tardío de interacción (todos los documentos de varios vectores) 区别──
- Describa la operación MaxSim de ColBERT, así como cómo ColPali la transformó de fichas de texto en parches de imágenes.
- Construir un índice de tipo ColPali: página → embebedidos de parches → embebedidos de query-term 上的 MaxSim → top-k páginas。
- Comparar facturas / informes financieros caso de uso de ColPali + Qwen2.5-VL generador con texto-RAG + GPT-4。

##  problemas

PDFs en el texto de arriba-RAG 会丢掉文档大部分信息──财报第三季度收入增长通常在图表里;医疗报告的发现在注释图片里;合同的签名区块是布局事实,而不是文本事实──

el texto-registro de gasoducto:

1. PDF → texto a través de OCR / pdftotext。
2. Texto → 300-500 trozos de tokens
3. Chunk → bi-encoder Embedding(一个向量)。
4. Encuesta de usuario → Embedding → cosin similaridad → top-k trozos。
5. Las preguntas + consultas → LLM。

五个有损步骤──图表 捕获不到──tabelas 被块 打断──多列布局 被展平──图形注释 消失──

ColPali 的修复方式:跳过 OCR,直接对页面图像做Embedding。使用ColBERT-style late interaction做检索,让模型在查询时间 关注细粒度补丁──

## 概念

### El proyecto de ley

ColBERT(Khattab & Zaharia, arXiv:2004.12832) es un método de recuperación de texto. No se trata de un vector para cada documento, sino de un vector para cada token.

- Los tokens de consulta  obtengan sus propios embeddings  N_q Vectores)
- Los tokens de documentos  obtengan embebidos(N_d vectores, normalmente se almacenan en caché)
- Score = para los tokens de consulta 求和, cada token de consulta 取所有文件 token 中 cosine similarity 的最大值:Σ_i max_j cos(q_i, d_j) 』

Esta es la operación MaxSim. Cada token de consulta se seleccionará el token de documento más adecuado. El resultado final es la suma de estos valores.

优点:recall 强,能处理术语级语义――缺点: cada documento 需要 N_d vectores, almacenamiento 昂贵――

### ColPali

ColPali(Faysse et al., arXiv:2407.01449) va a aplicar el patrón ColBERT a las imágenes

- Cada página de PaliGemma(ViT + lenguaje)编码为补丁嵌入:每页 N_p Vectors。
- Cada consulta de usuario (text) está codificada para los embeddings de los tokens de consulta: N_q Vectores。
- Score = Σ_i max_j cos(q_i, p_j), también se trata de encuesta-tokens de texto y páginas-imagen-parches 上做 MaxSim。
- 通过 total de puntos de recuperación de las páginas de arriba-k.

En el tiempo de ingestión de documentos: utilizar PaliGemma para hacer embebedidos en cada página, almacenar todos los embebedidos de parches. En el tiempo de consulta: hacer embebedidos en tokens de consulta, enmarcar en todos los embebedidos de páginas almacenados.

优点: 在视觉丰富文档上,端到端比文本RAG高 20-40%──每补丁向量 捕获局部布局和内容──

缺点: cada página N_p parches × 4 bytes flotantes × D-dim Vectores = almacenamiento 增长很快──可通过 PQ / OPQ cuantización 缓解──

### ColQwen2 y ColSmol

ColQwen2 (Illinois-tech, 2024-2025) reemplazará PaliGemma por el codificador base Qwen2-VL, mejor, mejor, mejor.

ColSmol es una variante a menor escala de uso local / extremo.

### VisRAG

VisRAG(Yu et al., arXiv:2410.10594) es otra variante: no en parches 上 hacer MaxSim, sino con VLM convertir cada página en un grupo de vectores, luego hacer bi-encoder recuperar──Indexing 更快, almacenamiento 更小, pero recordar 更弱──

Compromiso calidad-precio: la calidad es prioritaria con ColPali, la escala es prioritaria con VisRAG。

### M3DocRAG

M3DocRAG(Cho et al., arXiv:2411.04952) va a extenderse a la recuperación multimodal  expandirse a la razonamiento multi-documento de varias páginas―.

### VidoRe  índice de referencia

Compañero de referencia de ColPali: Evaluation de la recuperación de documentos visuales: tareas incluyen informes financieros: documentos científicos: documentos administrativos: registros médicos: manuales: Metric:nDCG@5。

ColPali-v1 en ViDoRe sobre un 80% nDCG@5; el mismo lote de documentos sobre el texto-RAG sobre un 50-60%──

### Línea de gasoducto de extremo a extremo

Para el RAG nativo de la visión:

1. 摄取:PDF → 页面图像 → codificación PaliGemma → 存储所有补丁嵌入式──
2. 查询: usuario文本 → embeddings de marcas de consulta → 对所有已索引页面执行 MaxSim → top-k 页面──
3. 生成:top-k 页面图像 + query → VLM(Qwen2.5-VL o Claude)→ 答案。

Todo el mundo no tiene OCR.

### Matemáticas de almacenamiento

Un informe financiero de 50 páginas, por página 729 parches, 128 dimensiones:

- ColPali:50 * 729 * 128 * 4 bytes = ~18 MB crudo,PQ 后 ~4 MB。
- Text-RAG:50 trozos * 768-dim * 4 bytes = ~150 kB。

ColPali Cada archivo de un documento es de aproximadamente 30 veces. En una situación de escala, la OPQ / PQ puede reducirse a aproximadamente 5-10 veces, normalmente aceptable.

### Text-RAG 仍然胜出的场景

- 没有布局信号的纯文本文档(wiki artículos、chat logs) ――Text-RAG 更简单,存储 更便宜──
- 存储主导成本的数百万页的档案──
- 严格监管要求在检索旁边保留可提取的 OCR文本──

 para otras situaciones del año 2026, es decir, informes financieros, documentos científicos, contratos legales, registros médicos, documentación UX, visión-nativa RAG 胜出──


```figure
mm-maxsim
```

## Usalo

`code/main.py`¿Qué es esto ?

- Encodrador de parches de juguete:将一个"page"(小型 feature vectors 网格)映射为 parches embeddings array──
- Punteador MaxSim: calcular el conjunto de embedding de fichas de consulta y el conjunto de parches de página entre puntuaciones de estilo ColBERT。
- Indica 5 páginas de juguete,运行 3 consultas,并返回带分的顶点.

##  entregarlo

本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-vision-rag-designer.md`△给定一个文件-RAG 项目,选择 ColPali / ColQwen2 / VisRAG / text-RAG,并估算存储──

##  ejercicios

1. Un informe anual de 200 páginas, 729 parches por página,128-dimensiones emb, 4 bytes flotantes── calcular almacenamiento en bruto y almacenamiento comprimido en PQ★8x★

2. MaxSim es Σ_i max_j cos(q_i, p_j) ・・・ Ese intento y captura ¿qué similitudes simples de medios captura información?

3. ColPali va a indicar páginas para conjuntos de parches. Si se cambia a nivel de palabra, ¿qué cambios ocurrirán? ¿Qué compensaciones?

4. Para un corpus de 1M páginas  diseño de pipeline de extremo a extremo, presupuesto de latencia de consulta 为 500ms──选择 ColQwen2 / VisRAG 并说明理由──

5. 阅读 M3DocRAG(arXiv:2411.04952)。 describir el patrón de atención de varias páginas, así como su diferencia con la recuperación de ColPali de una sola página。

## 关键术语: "El hombre es un hombre"

| Term | 人们常说 | 它的实际含义 |
|------|-----------------|------------------------|
| Late interaction | "ColBERT-style" | 使用 per-token 或 per-patch embeddings + MaxSim 做 retrieval，而不是 single doc Vector |
| MaxSim | "Max-over-patches" | 对每个 query token，选择 similarity 最高的 document token；跨 query 求和 |
| Bi-encoder | "Single-vector" | 每个 document 一个 Vector；更快，但会丢失粒度 |
| Multi-vector | "Many-vectors-per-doc" | 每个 document / page 存储 N_p Vectors；storage cost 增长，但 recall 提升 |
| Patch embedding | "Page feature" | 来自 VLM encoder 的每个 image patch 的一个 Vector，按页 cached |
| ViDoRe | "Vision doc bench" | ColPali 用于 visual document retrieval 的 benchmark suite |
| PQ quantization | "Product quantization" | 在缩小 storage 约 8x 的同时保持 Vector similarity 的压缩方法 |

## 延伸阅读

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)
