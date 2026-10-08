# Atténuation du début à froid des LLM sans serveur

> Une image de modèle de 20 Go du froid au serveur 需要 5-10 分钟(7B) jusqu'à 20+ 分钟(70B)。在真正的无服务器世界里,这不是加热,而是停机──Mitigations 作用在五层:pre-seeded node images(AWS 上的瓶块、双体积弧)、模型流程(NVIDIA Run:ai Model Streamer,vLLM 原生支持)、GPU mémoire snapshots(Modal checkpoints,restart 最多快 10x)、热池(`min_workers=1`• Chargement à plusieurs niveaux • NVMe de l'HBM sans serveur • DRAM de l'HBM de l'oléoduc, latence • 10-200x) • Migration en direct des fichiers de transmission • KB de la cache KV de la mise en cache de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en ligne de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：**Phase 17 · 02 (économie des plateformes d'inférence), phase 17 · 03 (auto-estimation des GPU)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 列举五层缓解冷启动, et dans chaque layer, décrire un outil ou un modèle.
- 将 70B modèle du temps total de démarrage à froid 计算为 (provision de noeuds) + (poids téléchargement) + (poids de charge dans HBM) + (initiation du moteur) 之和。
- 解释为什么直播迁移 传输输输入 Token(KB) plutôt que KV cache(GB),以及代价是什么(recomputation)
- Pour une GPU inutile, ou accepter une queue à démarrage froid), ainsi que `min_workers > 0` devenir un seuil de SLA indispensable

##  problématique
Votre point final de LLM sans serveur dans l'échelle nocturne à zéro.

1. La fourniture de Karpenter un nœud GPU:45-60s.
2. Le conteneur tire un un avec des poids de 30 Go image: 120-300s.
3. Le moteur va charger les poids à HBM:45-120s, dépend de la taille du modèle et de la vitesse de stockage.
4. VLLM ou TRT-LLM initiale CUDA graphiques ∼KV cache pool ∼ Tokenizer:10-30s。

总计:220-510s(大约 3-8 分钟) 后才会返回一个代币──你的SLA是2s──你发行一个热池──`min_workers=1`), le problème semble avoir disparu, mais maintenant vous devez payer pour un GPU 24x7 inactif. Si votre service a 5 produits, chacun avec une réplique chaude, c'est 5 × 24 × 30 = 3 600 GPU-heures / mois, peu importe si un utilisateur a été utilisé.

L'atténuation du démarrage à froid est une méthode qui permet de maintenir l'économie sans serveur tout en restant proche de la latence toujours active.

## 概念
### Couche 1  预置节点镜像(Bottlerocket)

Sur AWS, l'architecture à double volume de Bottlerocket va séparer le système d'exploitation des données.`EC2NodeClass`Le modèle de chargement de l'appareil est un modèle de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de chargement de

GCP 上的等价方案:带有预备包装层的自定义VM images──Azure 上:采用相同模式的管理磁盘快照──

### Couche 2  Modèle de diffusion (Run:ai Modèle Streamer)

Non seulement la charge de fichier complète est complète, mais la première demande est répondue à la suite, et les poids seront ensuite transmis à la mémoire du GPU, puis le premier bloc de transformateur sera immédiatement traité.

### Couche 3  Snapshots de mémoire GPU (Modal)

Modal dans la première charge 后对 GPU state(poids、CUDA graphs、KV cache region) faire un point de contrôle。后续 restarts 直接 déserialize jusqu'à HBM,比重新初始化快 10x。这最接近在 2秒内启动 一个热的 GPU──Trade-off:快照 绑定 per GPU-topology,所以如果Karpenter将你迁移到不同 SKU,你需要重新检查点──

### Couche 4  piscines chaudes (min_travailleurs=1)

La réduction la plus simple: garder une réplique toujours prête. Le coût est le taux horaire d'une GPU 24x7.$0.85-$1,50 pour éviter le début froid des années 30), pour les grands modèles 则更友好(每小时支付 $4 pour éviter le début froid de 5 minutes) ・pools chauds 变得必需 SLA threshold: habituellement 70B+ modèle 上 TTFT P99 < 60s。

### Couche 5  Chargement à plusieurs niveaux (LLM sans serveur)

Le système de stockage sans serveurLLM se définira comme une hiérarchie:NVMe(快但大)、DRAM(中等但可分层)、HBM(小但即时)。Pesoirs 预先 load到DRAM;按需 load到HBM。Paper 报告,相比天真盘到HBM,冷负载的延迟降低10-200x。Production adoption 仍处于早期阶段,但已经存在与vLLM的整合──

### Couche 6  migration en direct (moteur bonus)

Lorsqu'un nœud est indispensable, le modèle traditionnel est le démarrage à froid, une autre réplication et le démarrage de la file d'attente. La migration en direct mettra le jeton dans le nœud.

### Le calcul de la piscine chaude

Pour le service de P99 TTFT SLA en 2s, le problème n'est pas de ne pas avoir de piscine chaude, mais de ne pas avoir de réplices chaudes, ainsi que les chemins pour les obtenir.

- Voyageurs interactives à haute valeur (chats en direct, agents de voix):`min_workers=1-2`Il y a une autre.
- Parcours de lot de fond: acceptation de l'échelle à zéro, tolérance à 5 à 10 minutes de démarrage à froid.
- Niveau de prime: pour chaque locataire`min_workers`Et une capacité dédiée.

### Mesurer avant d'optimiser

L'anatomie du début à froid du nouveau nœud 上 70B modèle:

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### Les chiffres que vous devriez vous rappeler

- Début à froid modal: 2 à 4 secondes
- Baseten 默认 cold start:5-10s; utiliser pré-réchauffement 时 sub-seconde。
- 70B début à froid: 3 à 8 minutes.
- Retour:ai Modèle Streamer: ~ 2x accélération de charge par poids
- Chargement en niveaux sans serveurLLM: latence 降低 10-200x


```figure
cold-start-pipeline
```

## Utilisez-le
`code/main.py`Pour les différents types d'atténuations, le temps de démarrage à froid est calculé, le coût total du démarrage à froid est calculé, ainsi que le coût de la mise à niveau de la mise à niveau de la mise à froid.

## Je le livre.
本课会产出 `outputs/skill-cold-start-planner.md` déterminer la taille du modèle SLA, la forme du trafic, choisir les mesures d'atténuation à appliquer.

## 练习
1. 运行  référencement`code/main.py` calculer le taux de demande de rupture d'équilibre: après avoir dépassé ce taux, la réplique chaude 会比因 SLO 下额外要求下降而支付冷开始税 更便宜──
2. Vous déployez un modèle 13B, P99 TTFT SLA pour 3s.
3. La pré-semission des bouteilles a éliminé la traction de l'image, mais les poids restent nécessaires de la charge de l'imagerie à HBM. Si la vitesse de lecture de NVMe supportée par l'imagerie est de 7 Go/s, calculer le mur-horloge du modèle 70B.
4. Votre fournisseur sans serveur  fournit des instantanés GPU(Modal), mais votre équipe refuse, raison est snapshots 会泄露 PII──论证 Opinion des deux parties:现实风险是什么, mitigation 是什么(ephémères instantanés、encodage、isolation de l'espace de noms)?
5. Design a une politique de piscine chaude triée: utilisateurs payés ≈ utilisateurs expérimentaux et charges de travail de lot 分别需要多少热复制?展示计算过程──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) Modal 发布的基准和检查点架构──
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) modèle d'imagerie du volume de données pré-sémenté。
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) Va charger les poids avec la configuration du calcul 重叠。
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/) Livre de jeu préchauffement。
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) conception de chargement à plusieurs niveaux。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) déploiements décomposés de migration en direct。
