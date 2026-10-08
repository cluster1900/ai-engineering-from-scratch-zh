# vLLM Servir à l'intérieur:PageAttention, Batchage continu, Préchargement en morceaux

> Le rôle dominant de vLLM en 2026 dépend de trois paramètres par défaut superposés, et non d'une seule technique. L'attention payée est toujours ouverte. Le batch continu se déroule entre les itérations de décode et la mise en place de nouvelles demandes.`code/main.py`Un jouet en continu en batcher, c'est fini, il va être comme vLLM, comme un pré-remplissage et décodeur.

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**前置要求：**Phase 17 · 01 (service de modèle), phase 11 (ingénierie de l'enseignement supérieur)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- Pour les blocs, les tables de blocs, ainsi que pour les raisons pour lesquelles la fragmentation reste à 4% en charge de production, expliquez:
- Dans l'iteration, le niveau de dessin est de séquences continues: les séquences terminées, comment elles quittent le lot, les nouvelles séquences, comment elles s'ajoutent, sans avoir besoin de se décharger.
- Utilisez un mot pour décrire le pré-remplissage en morceaux, et dites-le: il protège les mesures de latence.
- En 2026 vLLM v0.18.0 sera affecté par ceux qui ont une fois activé tous les équipes d'optimisation.

##  problématique
Une simple PyTorch serve loop une fois exécuté une demande:tokenize、prefill、decode jusqu'à EOS、 retour. Pour un utilisateur, c'est un temps de travail. Pour une centaine d'utilisateurs, c'est une équipe de personnes qui attendent patiemment.

VLLM 同时解决三个问题──PagedAttention 阻止KV cache 碎片化像经典连续分配那样吃掉 60-80% de la mémoire de la GPU──Continuous batching 允许 requêtes dans chaque itération de décoding 之间加入和离开批次,因此批次始终充满真实工作──Chunked prefill 32 将k-token prompt 拆成约512-token 的切片,并与解码交错执行,因此长速不结 GPU 上的每个 decoding token──

La production par défaut de 2026 est un processus complet. Vous devez comprendre le rôle de chaque mécanisme, car le modèle de défaillance est au-dessus du programmeur, et non au-dessus du modèle.

## 概念
### PagedAttention  en tant que système de mémoire virtuelle

Le cache KV pour chaque séquence`num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element`Pour les 8192 jetons, le Llama 3.3 70B, dans BF16 en bas de chaque séquence, est d'environ 1,25 Go. Si vous réservez 8192 slots pour chaque demande, mais en moyenne, vous ne pouvez utiliser que 1500 jetons, alors vous perdrez environ 82% de votre HBM réservé.

PagedAttention  emprunte l'idée de la mémoire virtuelle du système d'exploitation. Le cache KV n'est pas en séquence. Il est fixé en blocs de taille partagée.

碎片化 de 60-80% (traduction classique) à 4% (voir ci-dessous)`--gpu-memory-utilization`(默认 0.9), il dit à VLLM dans la charge des poids et des activations 后, pour les blocs KV 预留多少HBM──

### Iteration de niveau de lotage continu

旧式 dynamic batching 会等一个窗口(比如10 ms) 来填充批量,然后运行预填+解码+解码+解码,直到每个序列 完成──快序列 会提前离开并置,而GPU 继续处理慢序列──

Les séquences en cours de fonctionnement sont appelées collections`RUNNING`Liste:

1. `RUNNING`Toute séquence de jetons atteignant EOS ou max_tokens sera supprimée.
2. Si il y a des blocs KV, il acceptera de nouvelles séquences (pre-remplir ou reprendre)
3. passe en avant dans le moment`RUNNING`Le contenu de chaque séquence est mis en ligne.

La taille du lot ne sera jamais rembourrée à un chiffre fixe.`V1 scheduler`◊ Key invariant:scheduler Chaque itération de décode 运行一次, plutôt que chaque demande 运行一次。

### Pré-remplissage en morceaux  protection de la queue TTFT

Le préfill est un computable de la Llama 3.3 70B du 32k-token prompt en un seul H100 de la Llama 3.3 70B du 32k-token prompt en un seul H100 de la Llama 3.3 70B du 32k-token prompt en 800 ms de pure préfill en un seul H100 de la Llama 3.3 70B du 32k-token prompt en un seul H100 de la Llama 3.3 70B du 30 de la Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3.3 Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3. Llama 3.

Le pré-remplissage par morceaux va pré-remplir en morceaux de taille fixe (en défaut 512 jetons), et le pré-remplissage par morceaux en unité de régulation.

### 3 définitions par défaut

Les trois fonctions sont supposées l'existence de l'autre. L'attention payée pour le planificateur fournit une ressource KV de petite taille pour le poids.`RUNNING`La liste des décisions prises est une autre politique de planification, et non un système indépendant.

Vous n'avez pas besoin de savoir chaque drapeau. Vous avez besoin de savoir le programmeur.

### 2026 v0.18.0 de gotcha

Dans vLLM v0.18.0, vous ne pouvez pas être `--enable-chunked-prefill`Avec le décodage spéculatif du modèle de projet`--speculative-model`L'exception à l'utilisation de la description de documentation est le décoding spéculatif N-gram GPU du planificateur V1. Ceux qui ne lisent pas les notes de sortie de l'équipe de l'ouverture de tous les drapeaux rencontrent une erreur de fonctionnement lors du démarrage, plutôt que de régression de la softeté. Si votre spéculative vaut la peine d'activer le pré-remplissage en morceaux, alors revoir la sélection: la réponse correcte de l'année 2016 est généralement EAGLE-3 et ne pas utiliser le pré-remplissage en morceaux, plutôt que le modèle de projet et le pré-remplissage en morceaux incapable de compilation.

### Tu devrais te rappeler le nombre

- Llama 3.3 70B FP8,H100 SXM5,128 并发,三者全开:2,200-2,400 tok/s
- Comme le modèle,默认 vLLM ((( sans pré-remplissage en morceaux): ~ 1800 tok/s。
- Le même modèle, simple PyTorch boucle avant: ~600 tok/s
- Produit de la production de produits de haute qualité
- 混合负载下 P99 ITL: utiliser préchargement en morceaux 时 ~15 ms,不使用时 ~50 ms。

### modèle de planificateur

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py`C'est la version Python de ce circuit, utilisant de faux nombres de jetons et de faux latences avant.


```figure
tensor-parallel
```

## Utilisez-le
`code/main.py`模拟一个vLLM风格的调节器,并带有可切换功能──运行:

- `NAIVE`Mode: une seule demande, sans lotage.
- `STATIC`Mode: le pâtissage, le classement, le batchage classique.
- `CONTINUOUS`mode:iteration 级别的录取和释放──
- `CONTINUOUS + CHUNKED`mode: pré- remplir 切片与 dekode 交错。

输出会展示总 throughput ((tokens par seconde virtuelle) 、TTFT mean 和 P99 ITL。`CONTINUOUS + CHUNKED`Cette ligne devrait avoir un avantage sur le flux mixte.

## Je le livre.
本课会生成 `outputs/skill-vllm-scheduler-reader.md` donner une configuration de service ((dimension de lot, utilisation de la mémoire KV, taille de pré-remplissage en morceaux, configuration spéculative), elle génère un diagnostic de planificateur, indiquant lequel des trois paramètres est en train de devenir un bouteille, ainsi que devrait être modifié quoi¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## 练习
1. 运行  référencement`code/main.py`◊ contenant des demandes courtes et des demandes longues`STATIC`Avec `CONTINUOUS`◊ débit différence de provenance, est-ce l'efficacité de pré-remplissage ‒ l'efficacité de décode, ou la latence de la queue?
2. Modifier ce jouet de l'échéancier, ajouter `--max-num-batched-tokens`Pour le fonctionnement de Llama 3.3 70B FP8, H100, est-ce que la valeur est exacte?
3. Réfléchissez à la liste des versions de vLLM v0.18.0.
4. 针对 1,000 个请求的追踪 计算 KV cache 碎片化浪费,平均 1,500 sorties de jetons,std 600 jetons,分别在以下条件下:(a) 以 8192 max 进行连续每请求分配,(b) 使用16 token blocks 的 PagedAttention。
5. Utiliser un passage expliquer pourquoi le préchargement en morceaux aide le P99 ITL, mais seul ne fait pas augmenter le débit.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | “KV trick” | 用于 KV cache 的固定大小 block allocator；碎片化 <4% |
| Block table | “page table” | 每个 sequence 从 logical token position 到 physical KV block 的映射 |
| Continuous batching | “dynamic batching, but right” | 每个 decode iteration 都做 admit/release 决策 |
| Chunked prefill | “prefill splitting” | 将长 prefill 拆成 512-token 切片并与 decode 交错 |
| TTFT | “first token time” | Prefill + queue + network；在长 prompts 下由 prefill 主导 |
| ITL | “inter-token latency” | 连续 decode tokens 之间的时间；由 batch size 主导 |
| Goodput | “满足 SLO 的 throughput” | 每个 request 仍命中 TTFT 和 ITL targets 时的 tokens/sec |
| V1 scheduler | “new scheduler” | vLLM 的 2026 scheduler；N-gram spec decode 是与 chunked-prefill 兼容的路径 |
| `--gpu-memory-utilization` | “memory knob” | 在 weights 和 activations 之后为 KV blocks 预留的 HBM 比例 |

## 延伸阅读
- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) 关于 fragmenté-prefill et spéculatif-décodage 兼容性的官方来源──
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) Cadence de sortie de 2026 和 spécifique version comportement。
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) 仍然定义如何理解分配器 的原始文章──
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) 碎片化分析与时间表设计──
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) 带有火焰图的详细 V1 scheduler walkthrough──
