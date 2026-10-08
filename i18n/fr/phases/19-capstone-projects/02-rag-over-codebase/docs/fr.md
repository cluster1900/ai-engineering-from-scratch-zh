# Capstone 02  Codebase 上的 RAG(跨 Repo Recherche sémantique)

> En 2026, chaque organisation d'ingénierie de grande envergure va gérer une recherche de code interne qui comprendra le sens et ne correspond pas à la recherche de code interne. Source Graph Amp、Cursor répond à la base de code. Augmentation de l'entreprise Graph、Aider repomap、Pinterest interne MCP, forme tout comme elle.

**类型：**Capstone
**语言：**Python (engestion) 、TypeScript (API + interface utilisateur)
**前置要求：**La phase 5 (fondations de la PNL) La phase 7 (transformateurs) La phase 11 (ingénierie de la LLL) La phase 13 (outils) La phase 17 (infrastructure)
**练习到的 Phases：**P5 · P7 · P11 · P13 · P17
**时间：**30 heures

##  problématique
D'ici 2026, chaque agent de codage frontalier sera prêt à récupérer des codes, car il ne peut être résolu que par des fenêtres contextuelles 跨 repo 问题;; le contexte 1M-Token de Claude est utile; mais il n'éliminera pas la demande de récupération classée;; pour les morceaux bruts faire une simple recherche cosine, va être généré du code、 monorepo duplication, ainsi que très peu d'importés des symboles 长尾上污染结果;; la réponse de la classe de production est: faire des hybrides dense + BM25) recherche, ajouter à re-ranquer, et par des symboles de référence graphique 支;;

Vous allez passer par l'indexation d'un groupe de vrais flottes pour apprendre cela, au lieu de simplement l'indexation d'un référentiel tutoriel, et mesurer la fidélité MRR@10、citation et la fraîcheur accrue── les modes d'échec sont au niveau de l'infrastructure: un monorepo de fichiers 100k、 une fois modifier la moitié des fichiers, une fois pousser, il faut passer par quatre repos  pour répondre correctement à la requête──

## 概念
L'utilisation de pipeline d'ingestion consciente de l'AST utilise le sit-sitter de l'arbre pour résoudre chaque document, la fonction de récupération et les nœuds de classe, et les limites des nœuds plutôt que de fixer les fenêtres de jetons.`check_permission`Il y a une autre.

Retrieval est hybride de. Une requête 会同時触发密集 和 BM25 searches,合并 top-k,并把 union 交给交叉编码重排器(Cohere rerank-3 或 bge-reranker-v2-gemma-2b) ⋅re-ranked list 会进入长文段合成器(带即时缓存的Claude Sonnet 4.7,或自主主主机Llama 3.3 70B),并要求每个索赔都用 和线程范围 引用──没有引用的答案文件会被后过拒绝──

La fraîcheur accrue est un problème d'infrastructure. Il faut pousser les documents à changer, les symboles à changer. Seuls les morceaux affectés seront réintégrés.

## 架构
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
- Embeddings denses: Voyage-code-3(hébergé) ou nomic-embedded-code-v1.5(auto-hébergé),bge-code-v1
- Indice de la paresse:带 BM25F 的 Tantivy(Rust), à titre de nom de symbole 和 corps faire pondéré par champ
- Vecteur DB:Qdrant 1.12, support de recherche hybride; ou face à 50M vecteurs
- Modèle de résumé de la pièce: Claude Haiku 4.5 ou Gemini 2.5 Flash, avec mise en cache rapide
- Rencontre avec le groupe de travail
- Orchestration:LlamaIndex Workflows utilisé pour l'ingestion,LangGraph utilisé pour l'agent de requête
- Synthétiseur:Claude Sonnet 4.7 ((1M contexte), avec mise en cache rapide
- Graphique de symbole:Neo4j(gestion) ou kuzu(embedded), utilisé pour l'importation et les bordures d'appel
- Observabilité: chaque étape de récupération + synthèse de Langfuse


```figure
ce-hybrid-retrieval
```

## - Je le construis.
1. **Ingestion walker。**Dans chaque boussole, il y a une collecte de fichiers modifiés pour chaque fichier, avec la fonction de résolution, de répartition et de classement des nœuds et de leur durée de source complète.`{repo, path, start_line, end_line, symbol, body}`Il y a une autre.

2. **Chunk summarizer。**Pour les fractions, il faut mettre en cache le code de la fonctionnalité et les effets secondaires.

3. **Embedding pool。**两个并行队列:density(Voyage-code-3 lot 128)和总结(同一个模型,但输入总结字符串)`{repo, path, start_line, end_line, symbol, kind}`Il y a une autre.

4. **BM25 index。**Indice Tantivy pondéré par champ:poids du nom du symbole 4,poids du symbole 1,poids du corps,poids de résumé 2──它既支持 t trouver la fonction nommée X 查询,也支持 t trouver la fonction qui fait X 查询──

5. **Symbol graph。**Pour chaque pièce  enregistrement des bords:importations(le fichier utilise le symbole de repo Z Y) ‧appels( Cette fonction 调用了类 C 上的方法 M) ‧inheritance──存入 kuzu──在查询时间用它跨 repo boundaries 扩展检索──

6. **Query agent。**包含三个节点的LangGraph──`retrieve`Il est également utilisé pour la communication de données.`rerank`Dans le top-50 上运行 cross-encoder,并保留 top-10──`synth`调用 Claude Sonnet 4.7,把重排块 放进文本,缓存系统提示,并要求文件:line citations。

7. **Citation enforcement。**解析 mode de sortie;任何没有 `(repo/path:start-end)`Les revendications de l'ancrage seront marquées comme une re-interrogation ou abandonnées.

8. **Incremental re-index。**Chaque fois que vous faites une connexion Web, le niveau des symboles de calcul diffère. Il suffit de réintégrer des morceaux de texte qui changent.

9. **Eval。**标注 100 个跨 repo questions,并给出金档:line answers──衡量MRR@10、nDCG@10、引用忠诚度(带可验证 anchors的索赔比例) ainsi que la latence p50/p99──

## Utilisez-le
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

## Je le livre.
Des compétences délivrables `outputs/skill-codebase-rag.md`△ donner un ensemble de repos 语料, il peut lancer le pipeline d'ingestion、index hybride 和 agent de requête,并为任何跨 repo 问题返回带引用的答案──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Retrieval quality | 在 100-question held-out set 上的 MRR@10 和 nDCG@10 |
| 20 | Citation faithfulness | answer claims 中带可验证 file:line anchors 的比例 |
| 20 | Latency and scale | 在 indexed corpus size 上 10k QPS 时的 p95 query latency |
| 20 | Incremental indexing correctness | 从 git push 到可被搜索的时间，在 50-file commit 上衡量 |
| 15 | UX and answer formatting | Citation 可点击性、snippet previews、follow-up affordance |
| **100** | | |

## 练习
1. Pour ce faire, il est nécessaire de modifier le code de Voyage-3 en remplaçant le code nomic-embed auto-hébergé.

2. Pour les autres, il est nécessaire de modifier la couleur de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière de la chaudière.

3. Dans votre taille de corpus, le point de référence est la recherche hybride Qdrant avec pgvector + pgvectorescale.

4. 添加一个样本基漂移检查:每周重新运行100问题 eval──当 MRR@10 下降 > 5% 时告警──

5.  étendre à la résolution des symboles multilingues: une fonction Python  via gRPC 调用 Go service。 utiliser le graphique des symboles 将它们关联起来。

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
- [Sourcegraph Amp](https://ampcode.com) Intelligence de code de référencement croisé de classe de production
- [Sourcegraph Cody RAG architecture](https://sourcegraph.com/blog/how-cody-understands-your-codebase) 本 capstone 参考 de plongée profonde
- [Aider repo-map](https://aider.chat/docs/repomap.html) arbre-sitter 排序的 repo 视图
- [Augment Code enterprise graph](https://www.augmentcode.com) 商业 symbole-graphe RAG
- [Qdrant hybrid search docs](https://qdrant.tech/documentation/concepts/hybrid-queries/) mise en œuvre de référence
- [Voyage AI code embeddings](https://docs.voyageai.com/docs/embeddings) Détails du code de voyage-3
- [Cohere rerank-3](https://docs.cohere.com/reference/rerank) référence à l'encodeur croisé
- [Pinterest MCP internal search](https://medium.com/pinterest-engineering) plateforme interne 参考
