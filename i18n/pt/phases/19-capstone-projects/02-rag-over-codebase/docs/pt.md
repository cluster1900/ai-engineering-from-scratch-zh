# Capstone 02  Código de base 上的 RAG(跨 Repo Semantic Search)

> 2026 anos, cada órgão de engenharia rigorosa irá executar uma que compreenda o significado e não apenas a correspondência de uma busca de código interno.

**类型：**Capstone
**语言：**Python(ingestão) 、TypeScript(API + UI)
**前置要求：**Fase 5 (fundamentos da PNL) Fase 7 (transformadores) Fase 11 (engenharia de licenciatura) Fase 13 (ferramentas) Fase 17 (infraestrutura)
**练习到的 Phases：**P5 · P7 · P11 · P13 · P17
**时间：**30 horas

## 问题
Até 2026, cada agente de codificação fronteiriça estará preparado para a recuperação de código base, porque apenas com o conteúdo de janelas  não pode resolver através do repo 问题;; o contexto 1M-Token de Claude tem ajuda; mas não irá eliminar a necessidade de recuperação classificada;; fazer uma simples pesquisa cosínica em trocos brutos, gerar código、monorepo duplicação, bem como muito poucos símbolos importados 长尾上污染结果;; a resposta da classe de produção é: fazer uma busca híbrida em trocos conscientes de AST dense + BM25) , adicionando re-ranqueamento, e por meio de símbolos de referência gráfico 支;;

Você vai passar por uma lista de fichas para aprender isso, em vez de apenas indexar um repo tutorial, e medir a fidelidade MRR@10、 citação e a frescura incremental── modos de falha são de nível infraestrutura: um monorepo de arquivos 100k、 uma vez alterar metade dos arquivos、 um deve atravessar quatro repos  para responder corretamente a pergunta─

## 概念
AST-consciente de ingestão de canais Utilize tree-sitter 解析每个文件,提取 function 和 class nodes, and node boundaries instead of fixed Token windows 上切 chunk。 cada chunk 会得到三种表示:dense Embedding(Voyage-code-3 或 nomic-embed-code)、sparse BM25 terms,以及一句简短的自然语言概要──概要 增加了第三种可检索模态:用户会问 如何是X授权,而概要会提到 authz,即使代码里只有`check_permission`- Não.

Retrieval is hybrid 的──一个 query 会同时触发密集 和 BM25 searches,合并 top-k,并把 union 交给跨编码重排名(Cohere rerank-3 或 bge-reranker-v2-gemma-2b) ─重排名名 会进入长文段合成器(带即时缓存的Claude Sonnet 4.7,或自主主主机Llama 3.3 70B),并要求每个索赔都用 和线域引用──没有引用的答案文件将被后过拒绝──

Frescitude incremental é um problema de infraestrutura. Git push 会触发 diff: quais documentos mudaram, quais símbolos mudaram. Apenas os pedaços afectados serão reincorporados.

## Arquitetura
```
git push --> webhook --> ingest worker (LlamaIndex Workflow)
                           |
                           v
             tree-sitter parse + AST chunk
                           |
            +--------------+----------------+
            v              v                v
          dense        BM25 index       summary (LLM)
        (Voyage / bge)  (Tantivy)        (Haiku 4.5)
            |              |                |
            +------> Qdrant / pgvector <----+
                            |
                            v
                      symbol graph (Neo4j / kuzu)
                            |
  query --> LangGraph agent (retrieve -> rerank -> synth)
                            |
                            v
                 Claude Sonnet 4.7 1M context
                            |
                            v
                 answer + file:line citations
```

## 技术
- Parsing:带 17 种语言语法的树-sitter(Python、TS、Rust、Go、Java、C++ etc)
- Embedings densos: Voyage-code-3(hosted) ou nomic-embed-code-v1.5(self-host),bge-code-v1 fallback
- Indice de escassez:带 BM25F 的 Tantivy(Rust), para nome do símbolo 和 corpo fazer campo-pega
- Vector DB:Qdrant 1.12, apoiar a busca híbrida; ou face a 50M vectores
- Modelo de resumo de pedaços: Claude Haiku 4.5 ou Gemini 2.5 Flash, com cache rápido
- Re-ranking:Ranking-3 de Coherência ou auto-administrador bge-re-ranking-v2-gemma-2b
- Orquestração:LlamaIndex Workflows Used for ingestion,LangGraph Used for query agent
- Sinetizador:Claude Sonnet 4.7 ((1M contexto),带 prompt caching
- Grafico de símbolos:Neo4j(gesturado) ou kuzu(embedded), para importação
- Observabilidade: cada etapa de recuperação + síntese de Langfuse


```figure
ce-hybrid-retrieval
```

## Construí-lo
1. **Ingestion walker。**Em cada agarrador de empurrão 上遍历 git history── recolher arquivos alterados── em cada arquivo, usar árvore-sitter 解析,提取 função 和 classe nodes 及其完整的源跨度──输出分段记录`{repo, path, start_line, end_line, symbol, body}`- Não.

2. **Chunk summarizer。**Para fazer isso, você deve fazer um teste de cache de um sistema de cache de dados.

3. **Embedding pool。**两个并行队列:density(Voyage-code-3 batch 128)和总结(同一个模型,但输入总结字符串) ――将向量 写入 Qdrant,并带上有效载 `{repo, path, start_line, end_line, symbol, kind}`- Não.

4. **BM25 index。**Índice Tantivy ponderado por campo:peso de nome do símbolo 4,peso corporal do símbolo 1,peso resumido 2── já apoiado Encontre a função chamada X 查询, também apoiado Encontre a função que faz X 查询──

5. **Symbol graph。**Para cada pedaço de arquivos: importações, esta função é utilizada através do símbolo de repo Z, chamado Y. Esta função é utilizada através do método M) ̳heritance' (inheritance).

6. **Query agent。**包含三个节点的 LangGraph──`retrieve`并行触发 dense + BM25,按 (repo, caminho, símbolo) 去重──`rerank`Em cima de 50 上运行 cross-encoder,并保留 top-10──`synth`调用 Claude Sonnet 4.7,把重新排名的块 放进文本,缓存系统提示,并要求文件:line citations──

7. **Citation enforcement。**解析 modelo de saída; qualquer `(repo/path:start-end)`A reivindicação do ancoramento será marcada como re-quest ou abandonada.

8. **Incremental re-index。**Cada vez que o webhook 时, calcular símbolo de nível diferença. Apenas re-Integrar 文本发生发生变的块.

9. **Eval。**标注 100 个跨 repo perguntas,并给出金档:line answers──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 anchors的索赔比例) bem como p50/p99 latency──

## Use-o
```
$ code-rag ask "how is S3 multipart abort wired into our retry budget?"
[retrieve]  12 chunks dense + 7 chunks bm25, 16 unique after dedup
[rerank]    top-5 kept (cohere rerank-3)
[synth]     claude-sonnet-4.7, cache hit rate 68%, 2.1s
answer:
  Multipart aborts are triggered by `AbortMultipartOnFail` in
  services/uploader/retry.go:122-148, which decrements the per-bucket
  retry budget defined in config/budgets.yaml:34-51 ...
  citations: [services/uploader/retry.go:122-148, config/budgets.yaml:34-51,
              libs/s3client/multipart.ts:44-61]
```

## Entrega-o
Habilidade de entrega .`outputs/skill-codebase-rag.md`△ fornecer um conjunto de repos 语料, pode iniciar o pipeline de ingestão、 índice híbrido 和 agente de consulta,并为任何跨 repo 问题返回带引用的答案── Rubrica:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## 练习
1. O relatório deve ser publicado em 31 de janeiro de 2015.

2. Para corpus inject 20% de código gerado (LLC-produced boilerplate)并重新评估──观察 recovery poisoning──向 payload 添加一个发射旗,并降低这些击的权重──

3. Em seu corpus tamanho acima de referência Qdrant busca híbrida com pgvector + pgvector escala.

4. Adicionar um teste de deriva baseado em amostragem: cada semana re-lançar a avaliação de 100 perguntas.

5.  expandir para resolução de símbolos de várias línguas: uma função Python  através de gRPC 调用 Go service── usar símbolos gráfico 将它们关联起来──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| AST-aware chunking | “Function-level splits” | 在 tree-sitter node boundaries 而不是固定 Token windows 上切分代码 |
| Hybrid search | “Dense + sparse” | 并行运行 BM25 和 Vector search，合并 top-k，然后 rerank |
| Cross-encoder rerank | “Second-stage rank” | 将每个 (query, candidate) pair 放在一起评分的 model，比 cosine 更准确 |
| Prompt caching | “Cached system prompt” | 2026 年 Claude / OpenAI feature，可将重复 prefix Tokens 最高折扣 90% |
| Symbol graph | “Code graph” | 跨 files 和 repos 的 imports、calls、inheritance edges |
| Citation faithfulness | “Grounded answer rate” | 用户可以通过点击 anchor 并阅读 referenced span 来验证的 claims 比例 |
| Incremental re-index | “Push-to-search time” | 从 git push 到 changed symbols 可被查询的 wall-clock 时间 |

## 延伸阅读
- [Sourcegraph Amp](https://ampcode.com) Informação de código de relações cruzados de nível de produção
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本 capstone 的参考 profunda mergulho
- [Aider repo-map](https://aider.chat/docs/repomap.html) árvore-servidor 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业 símbolo-grafo RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) Implementação de referência
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) Detalhes do código de viagem-3
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) Referência de codificadores cruzados
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) plataforma interna 参考
