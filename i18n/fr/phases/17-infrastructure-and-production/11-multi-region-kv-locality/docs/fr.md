# MLL multi-régions servant avec KV cache localité

> Pour les déductions de la gestion de cache, l'équilibrage de charge en roues est nocif. Une demande doit être effectuée si elle n'est pas réalisée sur le point de détenir son préfixe. Une demande doit être effectuée en préfixe complet.

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 解释为什么圆轮负载平衡会破坏缓存式推断,并量化 TTFT 惩罚──
- 画出 cache-conscient routeur:输入(KV-cache événements) 算法(prefix-hash match) ‧tie-breaker(Utilisation de GPU)
- Pour les résultats de la formation, il faut savoir que les résultats de la formation sont très différents.
- 区分商业 trans-régions 产品(Bedrock CRI、GKE Multi-Cluster Gateway) et le routage à la connaissance du KV。

##  problématique
Vous êtes en face de la page de l'entreprise et vous avez mis un ALB,并使用圆.

L'inference de l'LLM est selon le design: KV cache  codé le modèle  déjà vu tout.

En outre, votre équipe a un plan DR. Vous avez mis en place des poids de modèle S3 à travers la région.

Le programme de formation en droit multi-régions est un service de cache 问题、routing 问题和 DR hygiène 问题, pas un équilibreur de charge 问题。

## 概念
### Routage en connaissance de cache

Retour à la réplique: vous avez ce préfixe cache ?── Réplique dans la distribution et la déforestation de blocs 时, via pub/sub canal 发布 KV-cache events── Router 选择匹配的复制品;如果没有匹配,就回落到基于 GPU-util的绑定破解器──

**vLLM Router**(Rust,2026 production-stack): 订阅 `kv.cache.block_added`événements,维护 préfixe-hash → index de réplication, us O(1) recherche 路由──没有匹配时回落到最小队列深度──

**llm-d router**: le même modèle,Kubernetes-native.

**SGLang RadixAttention**(Phase 17 · 06) est l'inter-réplique et les prix.

### Numéros

2K-token prompt 上的 TTFT P50,Llama 3.3 70B FP8,H100:
- Résidence du préfixe: ~80 ms。
- Remplissez le cache à l'avance: ~ 800 ms。

10x différence― Si votre routeur entre les réplices atteint 60-80% du cache préfixe de la vie, vous êtes en N-replica  capacité bas proche de la performance de la seule réplica― si c'est seulement 10%, vous approchez de l'échelle naïve―

### La latence réseau est un nouveau problème.

RTT interrégionale:
- US-Est-1  US-Ouest-2: ~65 ms。
- États-Unis-Est-1  eu-Ouest-1: ~75 ms。
- États-Unis-est-1  ap-sud-est-1: ~ 220 ms。

Si le routage Place une demande de l'est des États-Unis à l'est des États-Unis à l'est des États-Unis, le préfixe de préfixe de l'emplacement de l'emplacement de l'emplacement sera de 440 ms.`prefill_time + network_latency`La réponse est généralement de maintenir le routage régional, sauf si le pré-remplissage occupe la préfixation dominante de plusieurs MB.

###  Commerce "inférence transregionale"

L'inference trans-régionale AWS Bedrock Réagit automatiquement à la demande de route vers d'autres régions pendant la pression de capacité. Elle optimise la disponibilité, ne optimise pas le TTFT, et fait des inférences comme une boîte noire.

Il est également possible de trouver des solutions de gestion de la sécurité et de la sécurité des données.

### DR hygiène: 32% de dossiers manquants  problém

En 2026, 32% des LLM DR ont échoué, parce que l'équipe a enregistré des poids, mais a oublié:

- `tokenizer.json`Ou `tokenizer.model`
- Configuration de la quantification`quantize_config.json`、escales AWQ、point zéro GPTQ)
- Configurations spécifiques au modèle ((RoPE scaling, masques d'attention, modèles de chat)
- Configuration du moteur`vllm_config.yaml`、échantillonnage des défauts 、manifestes de l'adaptateur LoRA)

修复方式是三文件最小DR manifest:

1. HF modèle repo 下所有文件(poids + config + Tokenizer)
2. - Un moteur spécifique à la configuration de service
3. Manifeste de déploiement ((K8s YAML、Dockerfile、blocage de dépendance)

En outre, chaque année, une opération DR est menée. JPMorgan US-East-1 a réalisé un exercice en novembre 2024 pour atteindre 22 minutes de récupération.

### La résidence des données est un problème.

Si votre routeur à connaissance de cache correspond à votre préfixe, envoyez une demande à Paris pour l'arrivée aux États-Unis-est-1, alors quel que soit le bénéfice du TTFT, vous avez déjà violé le RGPD.

### Tu devrais te rappeler le nombre

- Cache hit vs miss TTFT 差距: ~10x(2K prompt 上 80 ms vs 800 ms) ]]>
- RTT interrégional États-Unis-UE: ~75 ms。
- Failure DR: 32% 缺失 Tokenizer/configurations quantiques
- JPMorgan us-east-1 défaillance 2024 年 11 月:22 分钟(30 min SLA) ⋅


```figure
cache-aware-router
```

## Utilisez-le
`code/main.py`Dans la charge de travail multi-régions 上模拟三种路由策略(round-robin、cache-conscious regional、cache-conscious global)

## Je le livre.
本课产 出 `outputs/skill-multi-region-router.md` Régions déterminées, restrictions de résidence, SLA, plan de routage

## 练习
1. 运行  référencement`code/main.py`Dans 75 ms RTT, la longueur rapide jusqu'à combien de temps le routage interrégional va-t-il surpasser le routage local seulement ?
2. Le taux de clics de votre cache est passé de 70% à 12%.
3. Pour un serveur en vLLM, 5 adaptateurs LoRA de 70B AWQ-quantifié modèle design DR manifesto──列出每个文件和配置──
4. 论证 La déduction transrégionale de Bedrock sur la fintech de la TTFT SLO est suffisante.
5. Une requête de Paris correspond au préfixe US-East-1...

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | 基于 prefix-hash match，把请求路由到持有 KV-cache 的 replica |
| KV-cache events | "cache pub-sub" | Replicas 发布 block add/evict；router 建索引 |
| Prefix hash | "cache key" | 前 N tokens 的 hash，用作 router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688；把 network latency 作为显式项 |
| Cross-region inference | "Bedrock CRI" | AWS 产品；availability failover，不感知 TTFT |
| DR manifest | "the backup list" | 恢复所需的每个文件，不只是 weights |
| Data residency | "GDPR boundary" | 关于哪个 region 可以看到 user data 的法律约束 |
| RTT | "round-trip time" | Network latency；75 ms US-EU，220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | 作为产品类别的 cache-aware router |

## 延伸阅读
- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1)Réutilisation de la cache KV entre régions de la latence réseau.
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) documentation de défaillance de disponibilité。
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) source de routeur conscient du cache。
