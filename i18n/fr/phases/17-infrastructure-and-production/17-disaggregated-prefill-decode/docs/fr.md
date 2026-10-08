# Décomposition pré-remplissage / décode  NVIDIA Dynamo 和 llm-d

> Le préfil est calculé; le décode est mémoire-lié. Sur le même bloc de GPU, le Planner Change + SLA Planner va gérer automatiquement un des deux par un débit de préfil: la désagrégation les séparera en un ensemble de ressources indépendants, et les séparera par NIXL. RDMA/InfiniBand ou TCP fallback) entre eux pour le transfert de KV cache. Nvidia Dynamo. GTC 2025: 1.0 GA) se trouve sur vLLM/SGLang/TRT-LLM. Son Planner Change + SLA Planner va donc passer automatiquement par un débit de préfil: le décode par exemple pour répondre à SLO.$2M 级别推理支出上节省 30–40%（即 $600-800K/an); ce qui est spécifique.$2M→$600-800K numéros sont composés internes, pas un seul cas d'étude publié, devrait être considéré comme un point de classe numérique, plutôt que de référence.

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## Objectif de l'apprentissage

- Expliquez pourquoi le pré-remplissage et le décodeur ont différents GPUs de distribution, de co-codage et de co-codage.
- draw out disaggregated architecture: pré-remplir pool ‒ décoder pool ‒ via NIXL de transfert KV ‒ routeur‬
- Pour les résultats de la recherche, il faut savoir que les résultats sont différents.
- 区分 NVIDIA Dynamo (en haut de gamme) et Ilm-d (en bas de gamme) Kubernetes (en anglais),并把它们匹配对应的运维场景──

##  problématique

Vous êtes en train de faire des commentaires sur les données de l'application. Vous êtes en train de faire des commentaires sur les données de l'application.

 Budget impact: 20-40% du temps de GPU  Time waste on err err err err resources ⋅ vous achetez un H100 pour décoder en fonction de la mémoire ou de la bande passante H100 HBM pour effectuer un pré-remplissage en fonction du calcul ⋅ les deux sont des gaspillings coûteux.

Disagrégation 会把 préfill 和 decode 拆分到独立资源池,并按各自瓶进行尺寸化──KV cache 通过高带宽互连从prefill pool 传输到decode pool──

## 概念

### Pourquoi une bouteille différente ?

**Prefill** Pour une mise à jour complète  Exécuter une fois le transformateur en avant  Multiplication de matrice  dominant; lié à l'ordinateur  H100 FP8 可提供约2000 TFLOPS的有效吞吐量──Batch efficiency 很好,一次前可处理许多代币──

**Decode** 一次生成一个代币,每次代都读取完整重量──memory-bandwidth-bound──HBM3 提供约3TB/s──Batch efficiency 只有在高 concurrency下才好,因为重量读会在批上分摊──

Les utiliser avec des GPU optimisées. H100 sont tous deux bons, mais peu importe le coût de leur utilisation.

### 架构

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL est le transport inter-node de NVIDIA. Il est possible d'utiliser RDMA/InfiniBand, sinon en utilisant TCP fallback.

### Dynamo contre Illm-d

**NVIDIA Dynamo**(CTC 2025 发布,1.0 GA):
- En tant qu'orchestre, il est à la tête de la série.
- Planner Profiler 测量工作负载,SLA Planner Automatique de configuration pré-remplir: décode 比例。
- Le noyau de rouille, l'extensibilité de Python.
- 吞吐提升:NVIDIA 报告称,在 GB200 NVL72 + Dynamo 上,DeepSeek-R1 MoE 在中等延迟区间达到6x(developer.nvidia.com,2025-06);社区关于全布莱克韦尔 + 迪纳莫 + DeepSeek-R1 stacks 多达30x 的报告缺少单一主要来源,应视为方向性信息──
- GB300 NVL72 + Dynamo: selon Dynamo 产品页面(developer.nvidia.com,未注明期),相比霍珀,MoE 吞吐最高可可达50x。

**llm-d**(Red Hat + AWS, natif de Kubernetes):
- Remplissez / décodez / routeur 作为独立 Kubernetes Services。
- Pour chaque rôle, HPA utiliser la profondeur de file d'attente (prefill) / utilisation de KV (decode)
- `topologyConstraint packDomain: rack`Les cliques de pré-remplissage+décodage seront placées sur le même rack pour obtenir un transfert de KV à haute bande passante.
- Ilm-d 0.5(2026): déchargement hiérarchique de KV, routage LoRA conscient du cache, réseautage UCCL, échelle à zéro,

Si vous voulez gérer un orchestrateur de pile-supérieur, utilisez Dynamo. Si vous voulez des primitifs natifs Kubernetes, et avez déjà mis en mode CNCF, utilisez llm-d.

### 经济性

内部 composite (non seulement une étude de cas publiée, mais uniquement en tant que nombre de points):

- Les dépenses de service de rangement sont de 2 M$/an¬¬¬.
- 切换到使用 Dynamo's partage décomposé de portions
- La même quantité de requête, la même latence P99 SLA.
- 报告节省:$600K–$800K/année (réduction de 30 à 40%)
- 无新增硬件──

Nous obtenons ce chiffre de plusieurs clients, et non d'une seule étude de cas; le point de données le plus proche est le routage Dynamo KV de Baseten qui a généré un débit TTFT 2x plus rapide / 61% plus élevé de base.co (2025-10), ainsi que VAST + CoreWeave en 4060% KV taux de succès.

### Ne vous décomposez pas

- Les instructions < 512 jetons 且输出 < 200 jetons:传输税主导收益。
- 小型集群 ((< 4 GPU): pas assez de diversité de piscine。
- 团队 ne peut pas utiliser deux pools GPU et effectuer une mise à l'échelle par rôle:
- 没有 RDMA fabric:TCP transfert tax 更重──

### Routeur et phase 17 · 11 集成

Les routeurs désagrégés sont KV-cache-conscient(Phase 17 · 11)。 la requête se retrouve dans le pool de décoding de son préfixe; si elle ne correspond pas, on va pré-remplir → décoder。 le taux de succès et la désagrégation 会叠加收益, le routeur conscient du cache décide si même besoin de nouveau pré-remplir。

### Le MoE de Blackwell est le seul endroit où il y a vraiment des chiffres.

GB300 NVL72 + Dynamo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

### Tu devrais te rappeler le nombre

Les résultats de chaque année sont publiés.

- GB200 NVL72 + Dynamo 上的DeepSeek-R1:中等延迟区间相相比基线约 ~6x 吞吐(developer.nvidia.com,2025-06);社区关于全黑威尔 + 迪纳莫堆高达30x的说法是方向性聚合,没有单一的首要来源──
- GB300 NVL72 + Dynamo:相比 Hopper,MoE 吞吐最高可达 50x(developer.nvidia.com,未注明期)
- 节省点(内部 composite, pas une étude de cas unique):$2M 年度支出中节省 $600 à 800 K/an.
- Térubin de désagrégation:expérience > 512 jetons + sortie > 200 jetons。
- À travers le transfert de KV de NIXL: 70B FP8 sur KV 4K-prompt  nécessite 20 à 80 ms ⋅


```figure
prefill-decode-split
```

## Utilisez-le

`code/main.py`模拟 colocated versus disaggregated serving── rapport de débit, coûts par demande, ainsi que de longueur rapide crossover──

## Je le livre.

本课会产出 `outputs/skill-disaggregation-decider.md` la charge de travail et le cluster déterminés, pour déterminer si elles doivent être décomposées.

## 练习

1. 运行  référencement`code/main.py`Dans quelle mesure la décomposition est-elle meilleure que la colocation ?
2. Pour un P99 longueur préfixe pour 8K, sortie pour 300 de service RAG  conception de préfill pool 和 décode pool。
3. Dynamo vs llm-d: pour une boutique Kubernetes pure  choisir un schéma, sans temps d'exécution Python  préférence。
4. 计算 KV transfer cost:70B FP8 上 4K prefill = ~500 MB KV──在 RDMA 100 GB/s 下,transfer = 5 ms──在 TCP 10 GB/s 下 = 50 ms──哪个会影响你的SLA?
5. Le routage des experts du MoE Modifie les modes d'accès au KV.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “split prefill/decode” | 为每个阶段使用独立 GPU pools |
| NIXL | “NVIDIA transport” | Dynamo 的 inter-node KV transfer（RDMA/TCP） |
| NVIDIA Dynamo | “the orchestrator” | vLLM/SGLang/TRT-LLM 的 stack-above coordinator |
| llm-d | “Kubernetes native” | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | “Dynamo auto-config” | 测量工作负载，配置 pool ratios |
| SLA Planner | “Dynamo policy” | 自动按速率匹配 prefill:decode 以满足 SLOs |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放在同一 rack 上以实现快速 KV |
| UCCL | “unified collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “expert per token” | DeepSeek-V3 pattern；disaggregation 有帮助 |

## 延伸阅读

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
