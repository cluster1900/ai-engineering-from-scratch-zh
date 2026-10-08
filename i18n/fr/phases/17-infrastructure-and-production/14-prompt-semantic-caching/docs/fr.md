# Cachage rapide et cachage sémantique 经济学

> **Pricing snapshot 日期为 2026-04。**Les déclarations de valeur suivantes reflètent les cartes de taux des fournisseurs collectées lors de la publication de ce cours; avant de les citer, veuillez d'abord examiner le lien de l'examen du dossier.

> Le caching se produit à deux niveaux. L2(niveau fournisseur) Prompte/préfixe caching 会为重复 préfixe 复用注意 KV  Anthropic's prompt-caching docs 宣称,在长时间的提示上最高可降低90% 成本、降低85%延迟;对于Claude 3.5 Sonnet,cache se lit为$0.30/M，而 fresh 为 $3.00/M,TTL pour 5 minutes,1h TTL 选项有2x write premium(docs.anthropic.com,2026-04)。OpenAI prompt caching 会自动应用于 ≥1024 tokens的提示,并将缓存输入 定价相对新鲜约90%折扣(platform.openai.com,2026-04); précises pour chaque modèle caché rate 取决于现金率卡──L1app-level) 语义缓存 会在嵌入式相似性命中完全跳过LLM──Vendor 95% précision指的是匹配正确度,而不是  报告的击率  报告的击率不是从10%开封聊) 升级到结构化FAQ) 不等;(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**前置要求：**La phase 17 · 04 (VLLM Serving Internals), la phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 分钟

## Objectif de l'apprentissage
- 区分 L2 prompt/prefix caching(provider side KV 复用) avec L1 semantique caching(对相似提示 绕过LLM)。
- 解释 Antropic 的 `cache_control`显式标记, ainsi que deux options TTL ((5 min et 1 heure) et ses multiplicateurs de prix
- 根据 hit rate、prompt/response mix 和 Token prices,计算预期月度节省。
- Il y a aussi un modèle anti-parallélisation de 5 à 10 fois plus de taux de rebond.

##  problématique
Vous avez donné votre propre service RAG avec un cache rapide. Vous avez mesuré le taux de succès; seulement 7%. Vos requêtes semblent statiques, mais en réalité ce n'est pas le cas.

En outre, votre agent répondra à chaque question de l'utilisateur et exécutera 10 appels à l'outil. 10 demandes seront écrites dans le cache pour la première fois avant de se rendre au fournisseur.

Le caching est un protocole, pas un drapeau.

## 概念
### L2  mise en cache des prompts/préfixes du fournisseur

Provocateur  stockage cacheable préfixe attention KV, et ensuite une correspondance du préfixe demande de l'utiliser. Vous ne payez qu'une seule fois le coût d'écriture, lit presque gratuitement.

**Anthropic (Claude 3.5 / 3.7 / 4 series)**: demande 中的显式 `cache_control`Marqueur──你标记哪些块可缓存──TTL:5-minute(écriture coûte pour 1,25x base) ou 1 heure(écriture coûte pour 2x base)──Cache lit:Claude 3.5 Sonnet 上为$0.30/M，而 fresh 为 $3.00/M  便宜 10x(docs.anthropic.com,截至2026-04)。不同型号的价格 不同(Opus/Haiku 分别发布);始终交叉核对现场价格页面──

**OpenAI**Pour les instructions de 1024 jetons: Automatic caching(platform.openai.com,2026-04)。 pas de flag flag flag.`usage.cached_tokens`Pour mesurer votre situation.

**Google (Gemini)**: par API explicite faire le caching de contexte; 1M-token context signifie "caching"

**Self-hosted (vLLM, SGLang)**:Phase 17 · 06 介绍 RadixAttention  Dans votre propre calcul 上采用相同模式──

### L1  app 级 cache sémantique

En utilisant LLM 之前,先 hash prompt、对其做 Embedding,并查找相似的缓存请求(cousin similarity 高于门值,通常为0.95+)

Le code de la ligne de référence est le code de la ligne de référence.

Les revendications de précision du fournisseur désignent la réponse cache du retour dans le sens du terme, plutôt que la fréquence de production.

- Un chat sans fin: 10 à 15%
- Questions fréquentes structurées / soutien: 40 à 70%
- Les questions de code: 20 à 30%
- Agents de voix répétant des instructions:50-80%

### Le modèle anti-parallélisation

Votre agent n'a pas lancé 10 appels d'outils. Tous les 10 ont le même système de 4K-token prompt. Cache anthropique écrit est par demande. Première cache-écriture dans le fournisseur voir le prompt.

修复:batch avec séquentiel-first  单独发起请求 1, puis dans le cache de 1 已填充 后再触发 2-10──给第一工具调用 增加300 ms;节省 5-10x 账单──

### Le modèle anti-contenu dynamique

Votre système de prompt ressemble à:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

Chaque requête est unique. Chaque requête est écrite.

修复: 把所有真正静态的内容移动到缓存前;把动态内容 添加到缓存界限 之后:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery a ainsi augmenté le taux de cache de 7% à 74%, et a publié cette anatomie.

### Charge de pile + cache pour les charges de travail de nuit

Les API de lot ((Phase 17 · 15) dans le tour de 24 heures 下 fournir 50% de réduction。Entrée caché 叠加后又能获得约10x──Classification, étiquetage, et génération de rapports de travail peuvent être supprimés à environ 10% de la production synchrone-non-chassée──

### Les chiffres que vous devriez vous rappeler

Les prix sont les données collectées dans les documents fournisseurs des liens de 2026 à 2024 et changent chaque mois.

- Lire l'article en cache: Claude 3.5 Sonnet 上 $0.30/M, environ par rapport à l'entrée fraîche 便宜 10x(docs.anthropic.com)
- Prémium d'écriture en cache anthropic:1.25x(5 min TTL) ou 2x(1 heure TTL)。
- OpenAI auto-cache: applicable pour les demandes de 1024 jetons; dans les cartes de taux actuels, l'entrée en cache 定价约为 10% de l'entrée fraîche de la plateforme.openai.com) 👇
- Taux de succès du cache sémantique (reporté par la communauté):chat ouvert 约 ~10%; FAQ structurée 最高约 ~70%── pas baseline documentée par le fournisseur。
- ProjetDiscovery: à travers le projet de blogue de projet, en 2025, le taux de succès est de 7% à 74%.
- Anti-pattern de parallélisation: rapport typique montre que lorsque N 个 requêtes parallèles 错过第一次 cache write 时,账单会膨胀 510x。


```figure
semantic-cache-hit
```

## Utilisez-le
`code/main.py`模拟混合工作负载 上的 L1 + L2 caching──报告 hit rates、billet,并显示并行处罚──

## Je le livre.
本课产 出 `outputs/skill-cache-auditor.md` Donner un modèle rapide et le trafic, il vérifiera la cachéabilité et recommandera une restructuration.

## 练习
1. 运行  référencement`code/main.py`◊ changer de drapeau de parallélisation ◊ combien de changements ?
2. Votre système est prompt, il y a des dates.
3. Dans le cas d'un taux d'arrivée de demande déterminé, calculer le break-even de 1 heure TTL ((2 fois écrit) avec 5 minutes TTL ((1.25 fois écrit)
4. Le cache sémantique est à 0,95, le seuil est à 20%... mais vous voyez des erreurs dans les réponses cachées...
5. Vous pouvez utiliser 10 requêtes parallèles pour chaque requête utilisateur.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| L2 prompt cache | "prefix cache" | Provider 存储重复 prefix 的 KV |
| `cache_control` | "Anthropic cache marker" | 标记 cacheable blocks 的显式 attribute |
| Cache write premium | "write tax" | 从首次 miss 到 cache 的额外成本（1.25x 或 2x） |
| L1 semantic cache | "embedding cache" | 调用 LLM 前在 app-level 进行 hash-and-embed |
| GPTCache | "LLM caching lib" | 流行的 OSS L1 cache library |
| Cache hit rate | "hits / total" | 从 cache 服务的 requests 占比 |
| Parallelization anti-pattern | "the N-write trap" | N 个 parallel requests 会 N 次 miss cache |
| Dynamic content trap | "the time-in-prompt trap" | prefix 中的 dynamic bytes 会破坏 hit rate |
| RadixAttention | "intra-replica cache" | SGLang 的 prefix-cache implementation |

## 延伸阅读
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) officiel `cache_control`La sémantique et les TTL
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) comportement de mise en cache automatique et admissibilité。
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
