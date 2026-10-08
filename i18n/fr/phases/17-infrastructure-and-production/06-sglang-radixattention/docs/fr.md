# 面向 Préfixe-Travail lourd de SGLang avec RadixAttention

> SGLang va utiliser le cache KV comme un même 、 ressources réutilisables, et stocker dans le réseau de radix ∼ vLLM ∼ FCFS ⋅ premier venu, premier servi) requête de régulation, tandis que le planificateur de cache SGLang va prioriser la gestion des requêtes avec des préfixes partagés plus longs, en substance, la profondeur de premier traversage radix, laisser les branches chaudes ∼ rester dans le HBM ⋅ Dans le domaine de Llama 3.1 8B ⋅ avec des GPU GPT-like 1K prompts partagés, SGLang ⋅ atteint environ 16.200 tok/s, tandis que vLLM ⋅ 12.500, avantage d'environ 29% ⋅ Sur les charges de travail RAG préfixes lourdes, cet avantage atteint 6.4x⋅ en cas de clonage de voix ⋅ surcharges de travail, le taux de chargement dépasse 86% ⋅ 20 ⋅ 20 ⋅ 20 ⋅ 20 ⋅ 20 ⋅ 20 ⋅ 40 ⋅ 40 ⋅ 400 000 ⋅ 40 ⋅ 40 ⋅ 40 ⋅ 40 ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ 

**Type:** Learn
**Languages:** Python (stdlib, toy radix-tree cache + cache-aware scheduler)
**前置要求：**La phase 17 · 04 (service interne vLLM), la phase 14 (RAG agentique)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- 画出 RadixAttention: préfixes 如何存储在radix tree, ainsi que les blocs KV 如何在根根于同一分支的序列 之间共享──
- Expliquer la planification de cache-conscient, ainsi que pourquoi le FCFS ne convient pas au trafic lourd de préfixes.
- 给定 préfixe-cache taux de succès 和 distribution de longueur rapide, calculer une certaine charge de travail de la vitesse prévue.
- Pour dire que 6.4x ce chiffre est réel apparaît, et non pas la discipline de la commande rapide de l'erreur de bénéfice.

##  problématique
经典服务 会把每个请求的提示 当作不透明──即使5000 RAG 请求都用同一个2000-Token系统提示加同一个检索序言 开头,vLLM也会对这个2000-Token预写填5000次──GPU 一次又一次地做同工作──

观察结论是:agentic 和 RAG workloads 中的提示 几乎总是共享长的预写.──System prompt、工具 schemes、少数截图示例、检索头条、对话历史,全都会在请求之间重复──如果你把这个预写的KV缓存存一次并复用它,就不需要再预写──

RadixAttention est en train de le faire. Les jetons sont indexés dans l'arbre radix; chaque nœud possède une séquence de jetons sur le chemin de la racine à ce nœud pour les blocs KV correspondants. Une nouvelle demande se répand à travers cet arbre: tout nœud correspondant à un jeton sera utilisé à nouveau pour les blocs KV du nœud. Le coût de préemption se transforme en un nouveau suffixe correspondant au juste rapport, plutôt qu'en un prompt complet correspondant au juste rapport.

Le défi consiste à planifier. Si deux demandes partagent le préfixe de 2,000 Tokens, tandis que la troisième demande partage seulement les mêmes 200 Tokens, vous voudrez mettre deux demandes de partage en commun ensemble, faire en sorte que le préfixe reste dans le HBM.

## 概念
### 作为 KV index de radix arbre

radix tree(compact trie) stockage Sequences de jetons。 chaque nœud  possède une gamme de jetons, ainsi que des blocs KV calculés pour cette gamme。Les enfants 会把 séquence 扩展一个或多个 Token。

```
root
 |- "You are a helpful assistant..."  (2,000 tokens, 124 KV blocks)
      |- "Context: <doc A>..."        (500 tokens, 31 blocks)
           |- "Question: Alice..."    (80 tokens, 5 blocks)
           |- "Question: Bob..."      (95 tokens, 6 blocks)
      |- "Context: <doc B>..."        (520 tokens, 33 blocks)
```

Une nouvelle demande est accompagnée d'un prompt système + "Context: <doc A>" + "Question: Carol" 进来──调度器遍历:system prefix 匹配(复用124 blocs),doc-A branche 匹配(复用31 blocs), puis uniquement pour "Question: Carol"

### Calendrier en cache

Si le cache ne cesse pas de se dérouler, la répétition basée sur le radix-tree n'a aucun sens.

1. **Depth-first dispatch**◊ Choisir la requête suivante dans la file d'attente, prioriser la sélection avec le jeu de fonctionnement actuel  rooting à la même branche de la requête── ce qui permettra à la branche chaude  de rester coincée──
2. **Branch level 的 LRU，而不是 block level 的 LRU**◊驱逐整条分类 (~) 从最短的叶片开始), et non des blocs séparés, de sorte que la forme du cache 才与基因形 匹配──

FCFS a violé ces deux points. Il a partagé la demande de 2000 Tokens.

### Vous devriez vous rappeler le nombre de référence

- Llama 3.1 8B、H100、ShareGPT 1K demande:SGLang ~16,200 tok/s, contre par rapport à vLLM ~12,500(environ 29% 优势)
- RAG préfixe lourd ((same system + 相同 doc,变化 question):SGLang 上最高可达 6.4x。
- Charges de travail de clonage vocale: 86,4% taux de succès préfixe-cache
- Les taux de production de clients SGLang: dépendent de la discipline rapide, pour 50-99%
- 2026: déployée sur plus de 400 000 GPU.

### commander 陷

6.4x Ce chiffre dépend de la commande de modèle de prompt cohérente. Si votre client a effectué certaines demandes, il peut créer des commandes.`[system, tools, context, history, question]`, entre autres requêtes`[system, context, tools, history, question]`,arbre ne peut pas trouver de préfixe partagé. Pour l'homme, il ressemble à un préfixe partagé. Pour l'arbre radix, il y a deux séquences différentes.

工程师的杆: Votre modèle de prompt est la clé de cache.

Dans le cas réel de cette étude, le taux de succès de la mise en cache est passé d'un taux de conversion à 74% en passant par un taux de conversion à partir de 7% en passant par un préfixe cacheable.

### Radix Attention Win où,输 où

Les gagnants:
- RAG ((le même préambule de récupération, la question de la modification)
- Les agents (les mêmes schémas d'outils, la requête de modification)
- Le système de chat est rapide.
- 具有重复 préambules   Voix / vision des charges de travail

Perte de rendement à niveau VLLM:
- Utilisez des commandes uniques de génération à coup unique de code complet, pas de système de commandes de chat ouvert)
- Chaque requête met en avant des instructions dynamiques de contenu unique.

### Pourquoi c'est un scheduler  problème, pas juste un noyau  problème

Vous pouvez réutiliser KV en tant que truc du noyau. Le SGLang de l'inconvénient est que lorsque le régulateur permet à la branche de rester résidente, la réutilisation ne sera pas rentable.

### Interaction avec le VLLM

Ces deux systèmes ne sont pas strictement compétitifs.`--enable-prefix-caching`La différence s'est réduite, mais n'a pas complètement disparu, l'ensemble de la pile de SGLang est radix-first; la VLLM est la dernière à refaire. Pour les charges de travail principalement dirigées par les préfixes, la SGLang est toujours une option par défaut.


```figure
roofline
```

## Utilisez-le
`code/main.py`实现 un cache KV de jouet radix-tree, ainsi qu'un planificateur avec deux stratégies:FCFS et cache-conscient.  Il permettra à la même charge de travail de se séparer par deux opérations, rapportant le taux de succès du préfixe-cache et le delta de débit.

## Je le livre.
本课会生成 `outputs/skill-radix-scheduler-advisor.md` donner une description de la charge de travail (formate-template, retrieval pattern, tenants concurrents, nombre de locataires), elle génère une prescription de commande rapide, ainsi que le choix de la décision de la mise en service de SGLang.

## 练习
1. 运行  référencement`code/main.py`◊ Dans la même charge de travail 上比较FCFS 和 cache-aware──delta De qui vient, est-ce que l'épargne de pré-remplissage, décode de l'épargne, ou de retard de file d'attente?
2. Modifier la charge de travail, faire des commentaires`[system, tools, context]`- Pourquoi ? - Je ne sais pas.
3. 计算在 Llama 3.1 8B 上,作为一条 radix branch 保持一个2000-Token系统提示居民的HBM成本──与没有预写的重复使用的16序列批次成本做比较──
4. 阅读 SGLang RadixAttention paper。用三句话解释为什么在前兆重负载下,LRU en forme d'arbre éviction 优于LRU en forme de bloc。
5. 某客户报告缓存击率 只有8%──说出三个可能原因,以及你会为每一个原因运行的诊断──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| RadixAttention | "SGLang 那个东西" | KV cache 以 radix tree 索引，使 shared prefixes 能复用 blocks |
| Radix tree | "compact trie" | 每个 node 拥有一个 Token range 及其 KV blocks 的 tree |
| Cache-aware scheduler | "hot-branch-first" | 优先处理共享 resident branch 的请求的调度器 |
| Prefix-cache hit rate | "你的 prompt 有多少是免费的" | 从复用 KV blocks 服务的 prompt Tokens 比例 |
| FCFS | "first-come first-served" | 会破坏 prefix locality 的默认 scheduling |
| Branch-level LRU | "驱逐 leaf" | 与 radix shape 匹配的 eviction policy |
| Prompt template ordering | "cache key" | prompt 的 component order 决定 tree 能共享什么 |
| System prompt pinning | "resident prefix" | 保持 immutable system portion pinned，以避免 eviction thrash |

## 延伸阅读
- [SGLang GitHub](https://github.com/sgl-project/sglang) source 和 docs。
- [SGLang documentation](https://sgl-project.github.io/) RadixAttention 和 planification 细节──
- [SGLang paper — 高效编程 Large Language Models (arXiv:2312.07104)](https://arxiv.org/abs/2312.07104) 设计参考──
- [LMSYS blog — SGLang with RadixAttention](https://www.lmsys.org/blog/2024-01-17-sglang/) référence numérique et raison de planification
- [vLLM — Prefix Caching](https://docs.vllm.ai/en/latest/features/prefix_caching.html) vLLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
