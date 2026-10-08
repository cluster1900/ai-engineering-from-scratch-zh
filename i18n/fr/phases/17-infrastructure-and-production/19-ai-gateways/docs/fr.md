# Les portes d'accès à l'IA  LiteLLM、Portkey、Kong AI Gateway、Bifrost

> Le gateway  se trouve dans votre application et le fournisseur de modèles 之间── la fonction principale est le routage du fournisseur, les retards, les taux de limitation, les références secrètes, l'observabilité, les gardes── 2026**LiteLLM**Il est compatible avec OpenAI, mais il y a environ 2000 RPS 时会崩(8 Go de mémoire, des pannes en cascade ont été publiées dans le benchmark); le mieux adapté à Python、<500 RPS、dev/prototyping。**Portkey**定位为控制平面(guardrails、PII édition、jailbreak detection、audit trails),2026年 3月转为Apache 2.0 open source,latency overhead为 20-40 ms,production tier为$49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $100/modèle/mois(Plus niveau 最多 5 个); si vous utilisez déjà Kong, il convient à l'entreprise。**Bifrost**(Maxim AI)  retries automatiques, support de sauvegarde configurable, OpenAI 429 时 fallback à l'Anthropic**Cloudflare / Vercel AI Gateways** géré 零-op­s 基本重试──Data residence décide d'auto-héberger;Portkey 和 Kong 处于中间位置, fournir OSS + optionnel géré──

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:**Phase 17 · 01 (plateformes de gestion de la gestion des droits de propriété intellectuelle), phase 17 · 16 (routage de modèle)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 列举六个核心 gateway 功能 routeage, retrait, retrait, limite de vitesse, secrets, observabilité, garde-fou)
- Il y aura quatre passerelles de 2026 (LiteLLM, Portkey, Kong AI, Bifrost) qui seront projetées sur les plafonds d'échelle et les cas d'utilisation.
- 引用 Kong benchmark ((相比Portkey 228%,相比LiteLLM 859%),并解释为什么对 >500 RPS 很重要──
- Dans le cas de résidence de données et de budget des opérations, choisissez l'hébergement ou la gestion de données.

##  problématique
Vous avez besoin de failover si OpenAI retourne à 429, alors essayez Anthropic)

Dans la couche d'applications, ces nouvelles fonctionnalités permettront à chaque service de s'intégrer à chaque fournisseur. La couche de passerelle le regroupe dans un processus, fournit une API (généralement OpenAI compatible), et le redistribue à chaque fournisseur.

## 概念
### Six caractéristiques fondamentales

1. **Provider routing** mettre OpenAI, Anthropic, Gemini, auto-hébergé etc. dans une API 
2. **Fallback** 遇到429、5xx或质量故障 时,在别处重试──
3. **Retries** des tentatives de réaction exponentielle,
4. **Rate limits**  selon le locataire l'échantillon 
5. **Secret references** 运行时从库 拉取凭证(绝不放在app中)
6. **Observability** ATRITUTS OTEL + GenAI(Phase 17 · 13)+ attribution des coûts。
7. **Guardrails** Rédition d'informations personnelles, détection de jailbreak, filtres d'objet autorisé

### L'utilisation de l'application est également possible.

- Plus de 100 fournisseurs  Compatibles avec OpenAI  Configuration du routeur  Réciprocité  Observabilité de base 
- Dans le cadre de Kong, environ 2000 RPS 时崩; 8 Go de mémoire, des pannes en cascade se produisent en charge soutenue.
- La mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'application Python, la mise en œuvre de l'expérience, la mise en route.
- Coût: OSS = $0; il existe un niveau gratuit en nuage.

### Portkey  positionnement du plan de contrôle

- 截至 2026 年 3 月为Apache 2.0 OSS──Guardrails、PII édition、jailbreak détection、audit trails──
- Le temps de latence de chaque demande est de 20 à 40 ms.
- Le niveau de production est de 49 $/mo, comprenant la rétention + SLA.
- Les industries réglementées ont besoin de barrières de garde + d'observabilité.

### Kong AI Gateway  le jeu de l'échelle

- 基于 Kong Gateway 构建(成熟的API gateway 产品,lua+OpenResty) ⋅
- Le taux de référence est de 12 CPUs.
- Prix: 100 $ par mois, niveau plus maximum 5 个
- Le plus adapté: déjà en usage Kong;> 1000 RPS;

### Bifrost (AI maximale)

- Réessayements automatiques, support de sauvegarde configurable
- OpenAI 429 时 fallback à Anthropic est une recette canonique.
- 较新参赛者;commercial;;

### Cloudflare AI Gateway / Vercel AI Gateway

- Gestion 、opérations zéro-¬ Réessayer de base 和 observabilité¬
- Le plus adapté: fonctionne sur les applications JavaScript serveur Edge de Cloudflare/Vercel.
- Dans les barrières et les limites de taux, il n'y a pas de Kong/Portkey.

### Autogestion par rapport à gestion

Les données résident sont un facteur déterminant.

### Budget de la latence

- L'expérience de la ligne de conduite est de 5 à 15 ms.
- Porte clé: sur la tête pour 20-40 ms.
- Kong: sur la tête pour 3 à 8 ms.
- Cloudflare/Vercel: surcharge pour 1-3 ms

La latence de la passerelle augmentera directement le TTFT. Pour le TTFT P99 < 100 ms SLA, op Kong ou Cloudflare. Pour le P99 < 500 ms, tout est possible.

### Matériel de la sémantique des limites de taux

简单的代币桶 可支到中度尺度──多租户 需要滑窗 + blast allowance + per tenant tiering──LiteLLM 内置代币桶;Kong 内置滑窗;Portkey 内置层次──

### Gateway + observabilité + routage composé

Phase 17 · 13(observabilité) + 16 ((modèle de routage) + 19 ((portes)) dans la production appartiennent à la même couche。 choisir un couvrir les trois outils, ou仔细把它们串起来:多数 2026 déploiements 会组合 Helicone(observability) ou Portkey(guardrails) avec Kong(scale), pour être utilisé pour les rôles divisés。

### Les chiffres que vous devriez vous rappeler

- LITELLM: environ 2000 RPS 崩,8 Go de mémoire。
- Portkey: 20-40 ms en charge; depuis 2026
- Kong: Pour Portkey 快 228%, pour LiteLLM 快 859%
- Prix Kong: 100 $ par modèle par mois, niveau plus maximum 5 个.
- Cloudflare/Vercel:edge 上 1-3 ms débit de charge.


```figure
mx-gateway-fallback
```

## Utilisez-le
`code/main.py`模拟 3 个供应商 在 429/5xx注射 下的门户路由与倒退――报告延迟、复发率 和倒退撞击率――

## Je le livre.
本课产 出 `outputs/skill-gateway-picker.md` donner une échelle définie, posture de l'opération, conformité, budget de latence, choisir une passerelle.

## 练习
1. 运行  référencement`code/main.py` Configuration OpenAI→Anthropic→auto-hébergé de la chute.
2. Votre SLA est TTFT P99 < 200 ms, la ligne de base est de 300 ms... quels sont les portails qui sont encore dans le budget ?
3. Un client de soins de santé  exige un hébergement autonome + rédaction de données personnelles + audit。 choisi Portkey OSS 还是 Kong。
4. Comparer LiteLLM à Kong: quel plafond RPS devrait déménager la équipe ?
5. Pour les SaaS multi-tenants  politique de limite de tarifs de conception: niveau gratuit, niveau d'essai, niveau payant,

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | “API broker” | 位于 apps 和 providers 之间的 process |
| LiteLLM | “the MIT one” | Python OSS，100+ providers，2K RPS 时崩溃 |
| Portkey | “guardrails gateway” | Control plane + observability，Apache 2.0 |
| Kong AI Gateway | “the scale one” | 基于 Kong Gateway 构建，benchmark leader |
| Bifrost | “Maxim's gateway” | Retries + Anthropic fallback recipe |
| Cloudflare AI Gateway | “edge managed” | Edge-deployed managed gateway，zero-ops |
| PII redaction | “data scrub” | 发送到 model 前进行 Regex + NER mask |
| Jailbreak detection | “prompt injection guard” | 对 user input 的 Classifier |
| Audit trail | “regulated log” | 每次 LLM call 的 immutable record |
| Token-bucket | “simple rate limit” | 基于 refill 的 rate limiter |
| Sliding-window | “precise rate limit” | Time-windowed rate limiter；fairness 更好 |

## 延伸阅读
- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
