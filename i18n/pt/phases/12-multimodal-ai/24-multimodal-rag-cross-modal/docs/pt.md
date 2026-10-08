# RAG multimodal e recuperação transmodal

> O RAG é um dos mais amplos documentos nativos da visão. O RAG é um dos mais amplos de todos os tipos de RAG. O RAG é um dos mais amplos de todos os tipos de RAG.

**Type:** Build
**语言:**Python (stdlib,带 fusion + gerador em terra de retriever cross-modal)
**先修要求：**Fase 12 · 23 (ColPali), Fase 11 (Bases básicas do RAG)
**Time:** ~180 分钟

## Objectivo de aprendizagem
- design cross-modal retrieval:text → image、image → text、audio → video e assim por diante
- Comparar três estratégias de fusão: fusão de pontuação, fusão baseada na atenção, fusão de MoE,
- Explicação da geração de terra: quando a fonte é uma mistura de várias modalidades, cita as suas fontes
- Explicar a taxa de taxação dos seus filhos em 2025

## 问题
O RAG de modalidade única é um modelo já maduro: consulta integrada, fragmentos integrados, recuperação, inserção em LLM.

1. Muitas cabeças de recuperação (cada modalidade precisa ser incorporada em um espaço de capacidade)
2. 跨 modality 融合 resultados de recuperação.
3. A geração de terra, precisa de referência à modalidade.
4. 覆盖 cross-modal signal's evaluation metrics──

Estas pesquisas de 2025 finalmente deram a mesma taxonomia.

## 概念
### Recuperação transmodal

给定 modalidade A 的查询,retrieve modalidade B 的文件──三种模式:

1. Espaço de inserção compartilhado──CLIP 和 CLAP 在共享空间中生成文字 + image / text + audio Embedding──跨 modality 的 cosine similarity 可以直接使用──受限于CLIP 训过的配对──

2. Encoder de modalidade + tradução。 Encoder de texto + Encoder de imagem + um pequeno módulo de tradução, usado para mapear entre diferentes espaços。 Gupta et al. de Sen2Sen e outros projetos de 2024 pertencem a esta classe。

3. VLM como codificador. Use VLM's hidden states 作为检索表示. VLM 支持的任何方式都可用.质量更高,成本也更高.

选择:text+image 用 CLIP / SigLIP 2;text+audio 用 CLAP;frontier 质量 cross-modal 用 VLM-hidden-states。

### Estratégias de fusão

Você recuperou 10 resultados: 5 imagens, 3 passagens de texto, 2 áudio clips, como fazer?

Fusão de pontuação (πρώτο φ便宜) ∙ Cada modalidade tem seu próprio retriever, cada retriever  επιστρέψει σκορ.

Fusão baseada em atenção, todos os itens recuperados, fazer uma pequena rede de atenção, dar-lhes mais poder, necessitam de treinamento.

MoE fusão── rede de entrada 路由到 modalidade-específica especialistas── diferentes consultas 类型走不同路由, por exemplo, pergunta visual 会给图像 更高权重──

O resultado é o resultado da análise de resultados, que é o resultado da análise de resultados.

### Aterrização de geração

LLM 应该引用是哪个收获项目 支了每个索赔──对于多模式:

- Fonte de texto: Standard citation `[1]`- Não.
- Fonte de imagem:`[img 3]`, com uma legenda curta.
- Áudio:`[audio 2 at 0:34]`- Não.

Utilizando dados de base  訓練生成器:訓練目標 中の各主張 都标注源索引──Inference 时,model 会自然输出引用──

### Os inquéritos de 2025

Abootorabi et al. ((arXiv:2502.08826,Ask in Any Modality):Taxonomia de RAG multimodal──覆盖 retrieval、fusion、generation──覆盖面最广──

Mei et al. ((arXiv:2504.08748,A Survey of Multimodal RAG):重点关注 sub-task benchmarks 和 failure modes──对评估设计 很有用──

Zhao et al. ((arXiv:2503.18016): análise de visão parcial, sobre o trabalho da família ColPali,

读完这三篇,你就能掌握到2025年春季的最新技术状态──大多数子问题仍然开放──

### MuRAG  documento de base

MuRAG(Chen et al., 2022) é a primeira edição Multimodal RAG── é a primeira edição da Multimodal KB que retira imagem + texto,并生成答案── em VLM 浪潮之前证明了可行性──现代系统(REACT、VisRAG、M3DocRAG) todos são construídos sobre ele──

### Um exemplo de planeador de viagens de classe de produção

Pergunta: Ajuda-me a encontrar um brunch vegano tranquilo, com luz natural.

- O canal de condução:

1. 分解 query──quiet → palavra-chave de áudio/revisão;vegan brunch → item do menu;natural light → imagem característica──
2. 按 modalidade retrieve:
   - Para avaliações fazer recuperação de texto: brunch vegano, ambiente tranquilo.
   - Para fotos de restaurantes fazer recuperação de imagem:
   - Para clips de som ambiental fazer recuperação de áudio:  Baixo decibel, sem música.
3. 融合 score── cada restaurante tem uma pontuação composta──
4. Restaurantes de topo → Gerador VLM, transportar todas as evidências → 带引用 输出答案──

Isto já está muito além do texto-RAG. Todas as modalidades incluem apenas o texto.

### Agentes de RAG multimodal

Multi-hop: se a primeira recuperação  não retornar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 

- Retriever top-10 inicial → LLM 询问太噪, filtro para <40 dB → retriever──
- Retrieve images → LLM 发现其中一张有菜单 → retrieve menu text → answer。

Isso aumentará a complexidade, mas pode lidar com a recuperação de um só tiro.

### Avaliação

Avaliação transmodal 仍不成熟──常见代理:

- Cada modalidade de Recall@k。
- Precuração de topo-k fusível
- O processo de avaliação de desempenho é um processo de avaliação de desempenho.
- - tarefas específicas:

没有覆盖所有modality 的标准基准―― a maioria dos artigos está em tarefas específicas de domínio  上评价――


```figure
contrastive-matrix
```

## Use-o
`code/main.py`- Não .

- Três retrievers falsos, em um restaurante compartilhado.
- Ponto de fusão, uso de pesos configuráveis 组合 modalidade pontuações。
- Um botão de gerador, resposta final de citações.
- Um simples ciclo de agência, quando a confiança é menor, reformula a consulta.

## Entrega-o
本课产 出 `outputs/skill-multimodal-rag-designer.md` fornecer um modelo de produto, design de retrievers, fusão, gerador e avaliação de fluxo de consulta multimodal

## 练习
1. propõe um tratamento médico-triado RAG multimodal:query = foto de lesão + sintomas de texto― que modalidade de qual KB recuperar?

2. A fusão de pontuação é uma simples soma ponderada.

3. 阅读 Abootorabi et al. 的 taxonomy(Seção 3)。三个 canônicos sub-problemas 是什么?

4. Para planejador de viagens RAG multimodal  desenhar uma especificação de avaliação.

5. Agente multi-hop RAG Cada rota de ida e volta de cidades tem taxa de latência.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Cross-modal retrieval | “Query 一个 modality，retrieve 另一个” | Text query retrieve images；image query retrieve text；需要 shared space 或 translator |
| Score fusion | “组合 scores” | 对每种 modality 的 retrieval scores 做 weighted sum；最简单的 fusion |
| MoE fusion | “Modality-routed experts” | Gating network 按 query 选择信任哪种 modality 的 scores |
| Grounded generation | “Cite your sources” | 答案中的每个 claim 都标注 source index |
| MuRAG | “第一个 Multimodal RAG” | 2022 年 paper，建立了 Multimodal RAG 模式 |
| Agentic multi-hop | “Reformulate and retry” | 当 first-pass confidence 较低时，LLM 重新 query retrievers |

## 延伸阅读
- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
