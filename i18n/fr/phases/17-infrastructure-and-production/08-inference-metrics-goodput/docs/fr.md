# Les données de référence sont les données de référence de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse de l'analyse.

> Le déploiement d'une seule démarche d'inférence détermine si c'est normal. Le TTFT est le pré-remplissage 加队加网络──TPOT(prix ITL) est le décodeur relié à la mémoire de chaque jeton 成本──端到端延迟是 TTFT加 TPOT 乘输出长度──Throughput est l'ensemble de la flotte 聚焦每秒的标号──mais le produit est vraiment important: bonput: simultanément répondre à chaque demande de SLO.

**Type:** 学习
**Languages:** Python（stdlib，玩具版 percentile calculator 和 goodput reporter）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 60 分钟

## Objectif de l'apprentissage
- 精确定义 TTFT、TPOT、ITL、E2E、throughput 和 goodput,并指出每个指标测量的组件──
- Expliquer pourquoi le service de LLM est une statistique erronée, ainsi que comment lire P50/P90/P99
- 构建一个SLO multi-constraint (tftt<500 ms ET TPOT<15 ms ET E2E<2 s),并根据此计算 goodput──
- Pour ce qui est des deux outils de référence qui ne sont pas compatibles avec le TPOT lors d'une même opération, expliquez les raisons:

##  problématique
 Notre débit est de 15 000 Tokens par seconde. Alors comment ? Si 40% des demandes de terminaison dépassent 2 secondes, l'utilisateur a abandonné la session. Seulement avec le débit, il ne peut pas vous dire si le produit fonctionne normalement.

L'inference a plusieurs latences 轴, chaque axe de défaillance est différent. Le préfixe est calculé,并随即长度 扩展. Le décode est mémoire,并随批量 扩展. Le retard de file d'attente est un problème opérationnel.

## 概念
### TTFT  temps pour le premier jeton

`TTFT = queue_time + network_request + prefill_time`

Lorsqu'il est demandé de remplir des requêtes, il est nécessaire de pré-remplir des requêtes en temps réel. Dans le cadre du traitement de la demande, il est nécessaire de remplir des requêtes en temps réel.

### TPOT / ITL  latence entre les jetons

Il y a beaucoup de noms.`TPOT`(temps par jeton de sortie)`ITL`(la latence entre les jetons)`decode latency per token`Tout est le même. C'est le premier jeton.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

Dans le même ensemble avec préchargement en morceaux de la pile Llama-3.3-70B H100, la moyenne de TPOT est d'environ 7 ms, sans préchargement en morceaux, la séquence adjacente est en train d'exécuter la longue préchargement, la moyenne de TPOT peut atteindre 50 ms, et attention au P99, plutôt que au moyenne.

### La latence E2E

`E2E = TTFT + TPOT * output_tokens + network_response`

Pour le long terme, le TTFT a publié un rapport sur le long terme.

### Résultats

`throughput = total_output_tokens / elapsed_time`

Il ne peut pas vous dire la santé d'une seule requête.

### Bon courage, vous êtes vraiment inquiet.

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO est une contrainte multi-constance. Une seule contrainte est satisfaite. Une seule demande est satisfaite.

D'ici 2026, Goodput est devenu un indicateur utilisé par les fournisseurs de plateformes d'IA et de suivi interne de SLA.

### Pourquoi signifie est une statistique erronée

Dans un lot de décoding, si une requête de remplissage de longue durée est faite, il peut y avoir 500 Tokens TPOT d'environ 7 ms, tandis que 20 Tokens TPOT d'environ 60 ms.

Pour l'expérience utilisateur, P99 est le seul indicateur d'optimisation à utiliser.

### Numéros de référence  TRT-LLM 上的 Llama-3.1-8B-Instruction, 2026

- TTFT moyen: 162 ms
- TPOT moyen: 7,33 ms
- moyenne E2E: 1 093 ms
- P99 TPOT: 取决于分断预填配置, généralement entre 10-25 ms 变化.

Ces sont des points de référence publiés par NVIDIA. Ils varient selon la taille du modèle.

### Le piège de mesure

Les deux outils de référence les plus couramment utilisés de l'année 2026 seront utilisés en même temps pour donner des résultats différents à l'égard du TPOT:

- **NVIDIA GenAI-Perf**: dans ITL 计算中排除 TTFT──ITL 从 Token 2 开始──
- **LLMPerf**: contenant TTFT──ITL depuis le jeton 1 开始──

Pour une TTFT de 500 ms, 100 tokens de sortie, décode total de 700 ms, GenAI-Perf  rapport `ITL = 700/99 = 7.07 ms`,LLMPerf  rapport `ITL = 1200/100 = 12.00 ms`◊ outils de sélection pour changer le nombre.

始终说明使用了哪个工具──始终发布定义──

### Construire un SLO

Le modèle de chat 70B de 2026 face à la consommation:

- TTFT P99 <= 800 ms¬
- TPOT P99 <= 25 ms。
- Pour <300-Token 输出,E2E P99 <= 3 s
- Objectif de rendement >= 99%:

Les SLO d'entreprise vont accélérer le TTFT (environ 200-400 ms) et élargir le E2E.

### Comment mesurer

- 运行真流量或逼真合成(LLMPerf 使用 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`)。
- L'objectif de la course de référence est de 2 fois la concurrence maximale.
- 运行 30-50 fois l'itération, pour le même modèle de prendre des percentiles.
- 发布时包含工具名,工具版本,模型,硬件,竞争,快速分发.


```figure
throughput-latency
```

## Utilisez-le
`code/main.py`Il est également utilisé pour la production de la même quantité de données.

## Je le livre.
本课会生成 `outputs/skill-slo-goodput-gate.md` Donner une charge de travail et SLO, il générera une recette de référence utilisable pour CI/CD, avec un goodput et non pas un throughput pour les déploiements de passerelle.

## 练习
1. 运行  référencement`code/main.py` générer avec une distribution de 1% de pointe de queue  Lorsque vous changez P99 TPOT de 30 ms  resserré à 15 ms 时, comment le rendement  modifier ?
2. Un fournisseur cite Llama 3.3 70B H100 上 15,000 tok/s──在相信它之前,应提出哪三个问题?
3. Pourquoi le préchargement en morceaux peut-il protéger le P99 TPOT, mais ne peut pas protéger le TPOT moyen ?
4. Pour l'assistant vocal  Construire un SLO de consommation  Le premier jeton est entendu, et non lu.
5. 阅读LLMPerf README 和 GenAI-Perf docs──找到另外三个这些工具定义不一致的指标──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；在长 prompts 下由 prefill 主导 |
| TPOT | “time per output token” | 首个 Token 之后每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在大多数工具中与 TPOT 相同（不是全部，见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上 response-side network |
| Throughput | “tok/s” | Fleet efficiency；没有 latency percentiles 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足每个 SLO constraint 的请求比例 |
| P99 | “tail” | 百分之一最差情形 latency；用户体验指标 |
| SLO multi-constraint | “the joint” | 三个 latency bounds 的 AND；只要违反任意一个，请求就失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 工具对 ITL 是否包含 TTFT 的定义不一致 |

## 延伸阅读
- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) Définition du pouvoir de TTFT、ITL、TPOT
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) 替代定义与测量配方──
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) Réellement déploiements                                                                                                                                                                                                                                                           
- [LLMPerf](https://github.com/ray-project/llmperf) Basé sur le référentiel open source de Ray.
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html) L'outil de référence de NVIDIA
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) l'industrie accepte  basé sur un point de référence de bonne performance 
