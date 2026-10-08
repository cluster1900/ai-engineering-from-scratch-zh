# Utilisation de l'écran de production de l'écran de téléchargement de l'écran de téléchargement

> La production-stack de vLLM est une référence à Kubernetes 部署,把路由器、引擎和可观性 连接在一起──LMCache est KV-offloading layer, il extrait le cache KV de la mémoire de la GPU, et il est utilisé entre les requêtes et les moteurs ̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇̇

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**前置要求：**La phase 17 · 04 (VLLM Serving Internals), la phase 17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 図出 vLLM production-stack différents niveaux: routeur, moteurs, déchargement de véhicules électriques, observabilité
- 解释 KV Offloading Connector API ((v0.9.0+), ainsi que le chemin asynchrone 0.11.0 如何隐藏脱载延迟──
- 量化 LMCache CPU-DRAM 何時有幫助 (KV > HBM), ainsi que何時只增加上市 (KV 小到足以放入HBM)
- 根据部署限制,在本土 vLLM CPU脱载和LMCache连接器 之间做选择──

##  problématique
Vos vLLM serveurs en concurrence Upgrade Time montre GPU HBM atteint 100%, ne pas apparaître d'événements de préemption. Les demandes sont expulsées, requiérées, puis avec un prompt 2K-token en une minute sont réapprovisionnées en 4 fois.

增加更多GPU的成本是线性的──增加更多HBM 不可能──但CPU DRAM 很便宜,一个插座就像有512GB+ ,延迟比HBM 差几数级,但对临时保温的KV缓存来说足够──

LMCache va mettre le cache KV extracted into CPU DRAM, faire des requêtes préemptées 快速恢复,并让引擎 之间的 répétées préfixes 共享缓存,而不需要每个引擎都重新预填──

## 概念
### vLLM série de production

`github.com/vllm-project/production-stack`Pour la première fois, le gouvernement a décidé de mettre fin à la crise.

- **Router** cache-conscient(Phase 17 · 11)。消费 KV événements。
- **Engines** travailleurs vLLM── chaque GPU, ou chaque groupe TP/PP, un──
- **KV cache offload** déploiement de LMCache ou connecteur natif。
- **Observability** Prometheus scrape, Grafana des tableaux de bord, traces de l'OTel,
- **Control plane** Découverte de service configuration  mise à jour de roulement

以 Helm chart + opérateur 形式交付。

### L'interface de connecteur de déchargement KV (v0.9.0+)

vLLM 0.9.0 introduit l'API Connector, pour les backends de cache KV branchables. Votre moteur déchargera les blocs vers le connecteur.

vLLM 0.11.0(2026 年 1 月) a augmenté le parcours de déchargement asynchrone: dans la normale situation, le déchargement peut se produire à l'arrière, de sorte que le moteur ne sera pas bloqué. La latence de bout en bout et le débit restent dépendants de la forme de la charge de travail, du taux de déchargement du cache KV et de la pression du système.

### Déchargement du processeur natif par rapport à LMCache

**Native vLLM CPU offload**:moteur-local──把 KV blocs 存储在主机RAM中──实现快,零网络 hop──不能跨发动机──

**LMCache connector**:Cluster-scale──把 blocs 存储在共享 LMCache server(CPU DRAM + Ceph/S3 tier) 中──任何引擎都可以访问区块──已有16x H100 benchmarks 发布──

Lorsque un seul moteur a une pression HBM 时选择 native──当多个发动机 共享前置 时选择 LMCache(带共同系统提示的RAG、带共享模板的多租户)──

### Comportement de référence

Répartition dans 4 台 a3-highgpu-4g 上的16x H100(80 GB HBM)测试:

- Faible empreinte KV ((brèves demandes  faible concurrence): toutes les configurations sont comparables à la ligne de base, LMCache  augmentation d'environ 3-5% des frais généraux。
- Modérée empreinte:LMCache 开始在引擎 之间的 préfixe réutilisation 上带来帮助。
- KV supérieur à HBM: déchargement de CPU natif et LMCache ont considérablement augmenté le débit; LMCache augmenté plus, car il y a un partage entre moteurs.

### Lorsque la LMCache est décisive

- │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
- Les pièces de document dans les requêtes 之间重复的RAG──
- Comme la base de la version supérieure de la LoRA, la base du modèle KV sera réutilisée à la fois.
- Charges de travail lourdes: à partir de la restauration du processeur, le remplissage de nouveau est plus facile.

### Lorsque N' activer pas

- La pression de la HBM est très faible.
- Contexts courts ((< 1K tokens): temps de transfert > 重新 pré-remplissage。
- Charge de travail unique et unique pour un locataire: aucune réutilisation capturable.

### Intégration avec une portion décomposée

Phase 17 · 17 décomposé de service + LMCache 会叠加增益: de pré-remplissage pool à décodage pool de KV transferts Si pas utilisé, va tomber dans LMCache; ultérieures requêtes 会从 LMCache 拉取──Phase 17 · 11 cache-conscient routeur peut être envoyé à cache local ou LMCache-shared cache 匹配的引擎──

### Les chiffres que vous devriez vous rappeler

- vLLM 0.9.0:API du connecteur 发布──
- vLLM 0.11.0(2026 年 1 月):route de déchargement asynchrone; impact de latence de bout en bout 取决于工作负荷、KV hit rate 和系统压力(不是绝对保证)
- 16x H100: lorsque l'empreinte KV dépasse HBM, LMCache est utile.
- Petite pression HBM: avec un coût de 3 à 5% et sans bénéfice.


```figure
zero-sharding
```

## Utilisez-le
`code/main.py`Réponse: Le rapport évitant les re-remplissages, le gain de rendement et l'utilisation de HBM en équilibre.

## Je le livre.
本课会产出 `outputs/skill-vllm-stack-decider.md` donner une forme de charge de travail et le déploiement de vLLM, juger de choisir natif, LMCache, ou bien les deux sont tous deux non choisis.

## 练习
1. 运行  référencement`code/main.py`LMCache à partir de quoi utilisation HBM ?
2. 某租客 每小时 200 查询 共享一个 6K-token系统提示──计算每个租客 预期的LMCache节省──
3. LMCache serveur est un point unique d'échec.
4. LMCache en disque tournant 上存到 Ceph. Pour 70B FP8 下 4K-token KV(500 MB), le temps de lecture 相比重填 如何?
5. 论证 vLLM 0.11.0 chemin asynchrone Yabo免费: surhead 藏在哪里?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | “参考部署” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的 pluggable KV store interface |
| Native CPU offload | “engine-local spill” | 把 KV 存到同一 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | CPU DRAM + disk 上的 cross-engine KV cache server |
| 0.11.0 async | “non-blocking offload” | 隐藏在 engine stream 后面的 offload |
| Preemption | “evict to make room” | HBM 满时的 KV cache shuffle |
| Prefix reuse | “same system prompt” | 多个 queries 共享开头；cache hit |
| Ceph tier | “disk tier” | cache hierarchy 中 DRAM 下方的 durable storage |

## 延伸阅读
- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) Charte du casque + opérateur。
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) Implementation du connecteur。
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) détails du parcours asynchrone。
