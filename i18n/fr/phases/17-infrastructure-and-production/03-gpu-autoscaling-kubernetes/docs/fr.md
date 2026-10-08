# Kubernetes 上的 GPU Autoscaling  Karpenter, KAI Scheduler, Scheduling Gang

> Il peut éviter les pièges de distribution de 7 à 8 points en raison de l'absence d'un GPU et d'attendre et de brûler de l'argent. Application de l'autoscaler de NVIDIA Dynamo Planner, llm-d Workload Variant Autoscaler) basé sur la spécialité de la séquence de la séquence de la séquence de la profondeur de la séquence de la cache, la vitesse d'utilisation de la cache de la cache  plutôt que le cycle de travail du CPU / DCGM.`DCGM_FI_DEV_GPU_UTIL`C'est la mesure du cycle de tâche: 100% Peut être 10 requêtes, peut être aussi 100 个.`WhenEmptyOrUnderutilized`策略, car il mettra fin au travail de la GPU en cours de fonctionnement pendant le processus de dépistage.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：**Phase 17 · 02 (économie des plateformes d'inférence), phase 17 · 04 (vLLM Serving Internals)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- 画出三层自动规模化 架构 节点供给、帮规划、应用层),并说出每层使用的工具──
- Pourquoi ?`DCGM_FI_DEV_GPU_UTIL`Il y a deux signaux alternatifs:
- 描述团队规划以及 KAI Scheduler 防止的部分分配失败模式(8 GPUs en moyenne ont 7 个空等待)
- Ditent rencontrer terminer le travail de la GPU de Karpenter consolidation 策略(`WhenEmptyOrUnderutilized`),并说明2026年的安全替代方案──

##  problématique
Votre équipe a publié un service de Master en médecine supérieure.`DCGM_FI_DEV_GPU_UTIL`作为信号――业务时间内服务一直卡在100%利用率――HPA 从不扩大  它已经认为你满载了――你手动增加一副本;TTFT 降落来了――HPA 仍然不扩容――这个信号在骗你――

En outre, vous utilisez le Cluster Autoscaler 管理节点──凌晨2点来一个1M-Token prompt; cluster花了3分钟供给节点,请求超时──

En outre, vous déployez un module qui doit être déployé à travers 2 nœuds en utilisant 8 GPUs de modèle 70B. Le cluster a 7 GPUs vides, il y a encore 1 GPU répartis sur 3 nœuds.

Trois niveaux, trois modes différents de défaillance. L'autoscalage GPU-conscient de 2026 n'est pas un outil HPA.

## 概念
### Couche 1  节点供给 (carpenter)

Carpenter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `NodePool`约束动态选择实例类型  Si votre pod 需要8 H100, alors que le cluster n'a pas de nœud de correspondance, le Carpenter fournira directement un nœud, plutôt que de développer un groupe existant。

**consolidation 陷阱**Carpenter est un homme.`consolidationPolicy: WhenEmptyOrUnderutilized`Pour le pool de GPU 很危险――它会终止正在运行的 GPU 节点,把 pod 迁移到更便宜且更合适尺寸的实例――对于推理工作负载, this means to drive the running request, and reload the 70B model onto the new node――损失是数分钟容量外加请求失败――

Configuration de sécurité du bassin de GPU:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

Il a permis à Karpenter de se réunir un peu plus tard, mais il ne l'a pas fait.

### Couche 2  planification des gangs

KAI Scheduler(项目原名 "Karp",后改名)处理默认 kube-scheduler 不处理的事情:

**Gang scheduling** Réduction totale ou totale sans zone                                                                                                                                                                                                                                                          

**拓扑感知** 知道哪些GPU共享 NVLink、哪些位于同一架、哪些之间有InfiniBand──并据此放置 pod──DeepSeek-V3 67B tensor-parallel workload 必须留在一个NVLink域内;KAI Scheduler将遵守这一点──

**分层队列** Plusieurs équipes en priorité et en quota  compétition avec un seul pool de GPU  Les besoins urgents de production de l'équipe A ne sont autorisés que dans les règles de priorité, et ne seront pas occupés par l'équipe B pour le travail de formation 抢占;;

KAI 作为二级调度器与 kube-调度器 一起部署;你通过注释 让工作负载 使用它──Ray 和 vLLM production-stack 都有集成──

### Couche 3  应用层信号

**HPA 陷阱**- Le numéro de la liste:`DCGM_FI_DEV_GPU_UTIL`Il mesure si la GPU est en train de travailler à chaque intervalle. Le taux d'utilisation de 100% peut signifier 10 demandes et 100 demandes; peu importe quelle est la taille de la GPU.

Pire encore, VLLM et les moteurs similaires vont pré-distributer KV cache mémoire`--gpu-memory-utilization`Même si une seule demande, l'utilisation de la mémoire reste proche de 90%.

**2026 年替代信号**- Le numéro de la liste:

- 队列深度(attendre le nombre de demandes de remplissage préalable)
- Rate d'utilisation du cache KV (%) attribué à la séquence active de blocs (par exemple)
- Chaque réplique de P99 TTFT est votre SLA 信号)
- Bon produit ((( chaque seconde pour satisfaire le nombre de demandes de SLO)

NVIDIA Dynamo Planner 和 llm-d Workload Variant Autoscaler 会消费这些信号并扩缩复лика──它们将完全取代用于LLM服务的HPA──

### - Pourquoi ?

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### Décomposition pré-remplissage/décodage désagrégée

Si vous utilisez des précharges/décodes décomposées (Phase 17 · 17), vous aurez deux types de pods, et ils ont des déclencheurs d'échelle différents: précharges basées sur la profondeur de la file d'attente, décodez des pods basés sur la pression de cache KV, expansion de la capacité.`Services`Ne pas essayer de mettre un HPA unique devant les deux.

### Le début froid est aussi important .

L'atténuation du démarrage à froid (Phase 17 · 10) est un point de temps de fourniture pour devenir un utilisateur visible dans un lieu de retard.`min_workers=1`), ou dans l'application de la mise en place de points de contrôle modal.

### Tu devrais te rappeler le nombre

- Carpenter 节点供应: environ 45-60s, contre Cluster Autoscaler 约 90-120s(GPU 节点)
- Résultats de la planification de l'emploi
- `DCGM_FI_DEV_GPU_UTIL`作为 HPA 信号:坏掉的; utiliser la profondeur de la ligne de bord ou le taux d'utilisation de la VK。
- Carpenter `WhenEmptyOrUnderutilized`Le travail de la GPU en cours de fonctionnement.`WhenEmpty + consolidateAfter: 1h`Il y a une autre.


```figure
autoscaling
```

## Utilisez-le
`code/main.py`En cours de travail sur la GPU, vous pouvez utiliser une gamme de gammes de données de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme de gamme.

## Je le livre.
本课会生成 `outputs/skill-gpu-autoscaler-plan.md` Donner une topologie de cluster, une forme de charge de travail et un SLO, il concevra un système d'auto-échelle à trois niveaux.

## 练习
1. 运行  référencement`code/main.py`Dans la charge de travail débordante, le cycle de travail naïf HPA perdrait combien de requêtes de hauteur de file d'attente HPA peut-il recevoir?
2. Pour un groupe de H100 SXM5 en service Llama 3.3 70B FP8  Design Carpenter NodePool。 spécifié `capacity-type`- Je suis là.`disruption.consolidationPolicy`- Je suis là.`consolidateAfter`, ainsi qu'une charge de travail non GPU  incapable de réguler à ces nœuds taches 
3. Votre équipe de rapport de déploiement est en attente, car GPU est disponible mais le pod 无法调度── diagnostique                                                                                                                                                                                                                                               
4. Pour décomposer le pré-remplissage du module  选择一个自动扩展 信号,并为解码组 选择另一个不同信号――说明两者理由――
5. 计算 `WhenEmptyOrUnderutilized`Le coût de la production de services 24x7: ce service a en moyenne 60 fois par jour un événement de chute de demande, et P99 TTFT > 10s:

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes 节点 autoscaler；亚分钟级供给 |
| Cluster Autoscaler | "the old scaler" | Kubernetes 节点 autoscaler 的前身；更慢，基于 group |
| KAI Scheduler | "the GPU scheduler" | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | "all or nothing" | 原子化调度 N 个 pod，或全部延后 |
| Topology awareness | "rack-aware" | 基于 NVLink/IB/rack placement 放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric；不是 LLM 的 scaling signal |
| Queue depth | "waiting requests" | 对 prefill-bound scaling 正确的 HPA 信号 |
| KV cache utilization | "memory pressure" | 对 decode-bound scaling 正确的 HPA 信号 |
| Consolidation | "Karpenter consolidation" | 终止节点以迁移到更便宜的 instance type |
| `WhenEmpty + 1h` | "safe consolidation" | 不驱逐正在运行 GPU job 的策略 |

## 延伸阅读
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 设计文档和配置示例──
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) politique de consolidation 语义和 GPU-safe 默认值──
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) Dynamo Planner étalonnage des signaux
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html)Ray est un modèle.
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) orientation spécifique à la gestion de Kubernetes。
- [llm-d GitHub](https://github.com/llm-d/llm-d) Variante de charge de travail Autoscaler 设计。
