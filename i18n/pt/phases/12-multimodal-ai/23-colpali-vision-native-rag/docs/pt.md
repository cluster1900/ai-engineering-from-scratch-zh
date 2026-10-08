# ColPali e o documento RAG Vision-Native

> O tradicional RAG vai colocar PDFs 解析成文本,切成分,Embedding chunks,并存储矢量──每一步都会丢失信号:OCR会丢失图表数据,chunking会断断表行,text embeddings会忽略数字──ColPali(Faysse et al., July 2024) propôs uma questão mais simples: por que é necessário extrair texto?

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**先修要求：**Fase 11 (LLM Engineering  RAG 基础), Fase 12 · 05 (LLaVA)
**Time:** ~180 minutes

## Objectivo de aprendizagem

- 解释 bi-encoder retrieval ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()  ()                                                                                                                                           
- Descreva a operação MaxSim do ColBERT, bem como como como o ColPali o transformou em patches de imagem.
- Construir um índice tipo ColPali:page → patch embedings → query term embedings 上的 MaxSim → top-k pages。
- Comparar facturas / relatórios financeiros caso de uso 中的 ColPali + Qwen2.5-VL gerador com texto-RAG + GPT-4──

## 问题

PDFs de texto-RAG irá perder a maior parte das informações do arquivo. Crescimento de receita do T3 do relatório financeiro geralmente em gráficos.

Text-RAG pipeline:

1. PDF → texto através de OCR / pdftotext。
2. Texto → 300-500 pedaços de tokens
3. Chunk → bi-encoder Embedding(一个矢量)。
4. Pergunta do usuário → Embedding → cosin similarity → top-k chunks。
5. Câncer + consulta → LLM。

五个有损步骤──Chart 捕获不到──Tables 被块 打断──Multi-columns layout 被展平──Figura anotações 消失──

ColPali 的修复方式:跳过 OCR,直接对页面图像做做嵌入──使用ColBERT-style late interaction做检索,让模型在查询时间 关注细粒度补丁──

## 概念

### Colbert (2020)

ColBERT(Khattab & Zaharia, arXiv:2004.12832) é um método de recuperação de texto. Não é para cada documento produzir um vetor, mas para cada token produzir um vetor.

- Pedidos de tokens  obter embutidos respectivos ((N_q vetores) ⋅
- Document tokens  obtêm embutidos ((N_d Vectores, normalmente serão armazenados em cache)
- Score = para os tokens de consulta 求和, cada token de consulta 取所有文件 token 中 cosine similarity 的最大值:Σ_i max_j cos(q_i, d_j) 』

É a operação MaxSim. Cada token de consulta irá selecionar o token de documento mais adequado.

优点:remember 强,能处理 term-level semantics──缺点: cada documento 需要 N_d Vectors, storage 昂贵──

### ColPali

ColPali(Faysse et al., arXiv:2407.01449) vai aplicar o padrão ColBERT às imagens

- Cada página é feita por PaliGemma(ViT + linguagem)编码为补丁嵌入:每页 N_p Vectors──
- Cada consulta de usuário (text) é codificada para embeddings de query-token: N_q Vectors。
- Score = Σ_i max_j cos(q_i, p_j), também é em query-text-tokens 和 page-image-patches 上做 MaxSim。
- 通過總分查取上-k頁面──

Em tempo de ingestão de documentos: usar PaliGemma para fazer embutidos em cada página, armazenar todos os embutidos de parcheiros. Em tempo de consulta: fazer embutidos em tokens de consulta, embutidos em todas as embutidas de páginas já armazenadas.

优点: em documentos visualmente ricos, de ponta a ponta em comparação com o texto-RAG High 20-40%── cada vector de parche 捕获局部布局和内容──

缺点: cada página N_p patches × 4 bytes flutuantes × D-dim Vectors = armazenamento 增长很快──可通过 PQ / OPQ quantização 缓解──

### ColQwen2 和 ColSmol

ColQwen2 (Illinois-tech, 2024-2025) vai substituir o PaliGemma por Qwen2-VL, o codificador base, melhor, recuperação, melhor.

ColSmol é uma variante de menor escala para uso local / de ponta.

### VisRAG

VisRAG(Yu et al., arXiv:2410.10594) é outra variante: não em patches 上 fazer MaxSim, mas com VLM transformar cada página em um vector, então fazer bi-encoder retrieve──indexando 更快, armazenamento 更小, mas lembre 更弱──

Comércio qualidade-custo: qualidade prioritária com ColPali, dimensão prioritária com VisRAG。

### M3DocRAG

M3DocRAG(Cho et al., arXiv:2411.04952) vai expandir a recuperação multimodal para o raciocínio multimodal de várias páginas.

### Indicador de referência ViDoRe 

Comparador de referência do ColPali: Avaliação de recuperação de documentos visuais: tarefas incluem relatórios financeiros: documentos científicos: documentos administrativos: registros médicos: manuais: Metric:nDCG@5。

ColPali-v1 em ViDoRe ≈ 80% nDCG@5; o mesmo lote de documentos ≈ 50-60% ≈ RG

### Gastrodução de GRA de ponta a ponta

 para RAG nativo da visão:

1. 摄取:PDF → 页面图像 → PaliGemma codificação → 存储所有补丁嵌入式──
2. 查询: user文本 → embedments de query-token → 对所有已索引页面执行 MaxSim → top-k 页面──
3. 生成:top-k 页面图像 + query → VLM(Qwen2.5-VL ou Claude)→ 答案。

Não há OCR. Figuras, gráficos, fontes, layout.

### Matemática de armazenamento

Uma parte de relatório financeiro de 50 páginas, por página 729 parches, 128 embutidos:

- ColPali:50 * 729 * 128 * 4 bytes = ~18 MB bruto,PQ 后 ~4 MB。
- Text-RAG:50 pedaços * 768-dim * 4 bytes = ~150 kB。

ColPali Cada documento é armazenado em cerca de 30x. Em cenários de escala, a OPQ / PQ pode ser reduzida para cerca de 5-10x, geralmente aceitável.

### Text-RAG  ainda胜出的场景

- 没有布局信号的纯文本文档(wiki artigos、chat logs) ――Text-RAG 更简单,存储 更便宜──
- Arquivos de vários milhões de páginas de armazenamento
- 严格监管要求在检索旁边保留可提取的OCR文本──

 para outras situações de 2026: relatórios financeiros, artigos científicos, contratos legais, registros médicos, documentação UX, visão nativa RAG 胜出──


```figure
mm-maxsim
```

## Use-o

`code/main.py`- Não .

- Encoder de patch de brinquedo:将一个"page"(小型 feature vectors 网格)映射为 patch embeddings array──
- MaxSim pontuação: calcular encomenda de token de consulta conjunto e página de parche conjunto entre ColBERT-estilo de pontuação。
- Indica 5 páginas de brinquedos,运行 3 consultas,并返回带分的顶点.

## Entrega-o

本课会产出 `outputs/skill-vision-rag-designer.md`△给定一个文件-RAG 项目,选择 ColPali / ColQwen2 / VisRAG / text-RAG,并估算存储──

## 练习

1. Uma parte de 200 páginas de relatório anual, por página 729 parches,128-dim Emb, 4 bytes flutuantes── calcula armazenamento bruto 和 PQ-compressed(8x) armazenamento──

2. MaxSim é Σ_i max_j cos(q_i, p_j) ・・・ esse quer e capture quais simples semelhanças significativas  capture incomplete information?

3. ColPali irá encaminhar páginas para conjuntos de patches. Se mudar para nível de palavras, como ColBERT, que mudanças acontecerão?

4. Para um corpus de 1M de página  desenhar pipeline de ponta a ponta, requerer orçamento de latência 为 500ms──选择 ColQwen2 / VisRAG 并说明理由──

5. 阅读 M3DocRAG(arXiv:2411.04952)。 descrever padrão de atenção de várias páginas, bem como as diferenças entre ele e a recuperação de ColPali de uma única página。

## 关键术语

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
