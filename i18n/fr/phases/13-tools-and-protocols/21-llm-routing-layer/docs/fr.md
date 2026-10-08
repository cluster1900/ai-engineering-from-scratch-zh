# L'équipement de routage de la ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de ligne de

> Le fournisseur de services de connexion 代价高昂―― différents outils-appels 工作负载适合不同模型――routage gateway 提供统一的API 表面、重试、failover、成本跟踪和 guardrails──2026年有三种主流形态:LiteLLM(开源、自托管)、OpenRouter(托管 SaaS)、Portkey(生产级,2026年 3月开源)──本课会说明决策标准,并演示了一个 stdlib routing gateway──

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## Objectif de l'apprentissage
- 区分自托管、托管和生产级路由选项──
- 实现 une chaîne de rechute, en fournissant 失败时按定义好的优先级顺序重试――
- Suivre le fournisseur de coûts de demande et de la consommation de jetons.
- Pour une certaine production, on fait un choix entre LiteLLM, OpenRouter et Portkey.

##  problématique
Envoyer des services  important场景:

1. **成本。**Le coût de Claude Sonnet est 3 fois celui de Haiku. Pour le triage, Haiku est suffisant. Pour la synthèse, Sonnet est utile.

2. **Failover。**OpenAI apparaît un petit défaut. Toutes les demandes sont ratées.

3. **延迟。**实时聊天 UI 需要快速的时间到第一代标语――批量摘要器不需要――按延迟SLA 路由――

4. **合规。**Les utilisateurs de l'UE doivent rester dans la région de l'UE.

5. **实验。**On fait A/B à deux modèles sur la même charge de travail.

Pour chaque intégré, écrire ces logiques est très répété.

## 概念
### Proxy compatible avec OpenAI 形态

Tout le monde utilise OpenAI-Form.`/v1/chat/completions`Il est également un agent de l'entreprise, qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche et de recherche, et qui a été créé par le groupe de recherche, et qui a été créé par le groupe de recherche, et qui a été créé par le groupe de recherche et de recherche.

### Les pseudonymes de modèle

Tu n' as pas écrit`claude-3-5-sonnet-20251022`Mais plutôt écrire.`our_smart_model` Gateway va utiliser un alias 映射到真实模型──当Anthropic 发布Claude 4 时,你在服务端修改 alias;

### Chaînes de renversement

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

Les coûts de gestion des ressources humaines sont les coûts de gestion des ressources humaines.

### Cachage sémantique

Les mêmes ou presque identiques instantanés de cache, plutôt que les serveurs de visite.

### Rennes de garde

网关级:

- **PII redaction.**Envoi rapide de traitement de régex ou basé sur ML.
- **Policy violations.**拒绝包含禁止内容的提示──
- **Output filters.**L'élimination des fuites de contenu

Portkey et Kong sont installés avec des barreaux de protection définis.

### Limits de taux par clé

Un API clé = un groupe. Un budget par clé empêche un groupe de consommer des quotas partagés. La plupart des portails le soutiennent.

### Autogestion et gestion des services

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

Lorsque vous avez une équipe SRE et que vous voulez avoir le droit de propriétaire de données, LittleLLM 胜出. Lorsque vous voulez un seul abonnement et ne voulez pas maintenir l'infrastructure, OpenRouter 胜出.

### Tracking des coûts

Chaque requête est portée .`provider`- Je suis là.`model`- Je suis là.`input_tokens`- Je suis là.`output_tokens` par modèle  par prix des jetons  par gateway  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par groupe  par par par par par par groupe  par par par par par par par par par par par par groupe  par par par par par par par par par par par par par par par par par par par par par par par par par par par par par par par par par par

### MCP plus routage

La passerelle peut être en même temps par la demande d'échantillonnage LLM 调用和MCP.

### Stratégies de routage

- **Static priority.**La première dans la liste;
- **Load balancing.**Ronde-robin ou accès à l'équipement
- **Cost-aware.**选择满足延迟 / 质量要求的最低成本模型──
- **Latency-aware.**选择过去 N 分钟内最快的模型──
- **Task-aware.**Le classifiateur rapide va coder 路由到一个模型, va résumer 路由到另一个模型――


```figure
tp-router-failover
```

## Utilisez-le
`code/main.py`Utilisation d'une passerelle de routage: accepter une demande en forme d'OpenAI, transférer à chaque fournisseur de services, utiliser la chaîne de rétroaction prioritaire, suivre le coût de la demande unique, et utiliser le passe de rédaction de PII.

需要关注:

- `ROUTES`dict:alias -> 按优先排序的具体供应商列表
- La boucle de retour sera à 5xx.
- Le coût tracker va utiliser le jeton multiplié par le coût de chaque modèle.
- Le rédacteur en chef des PII 会在转发前清理形状类似SSN的模式.

## Je le livre.
本课会产出 `outputs/skill-routing-config-designer.md` donner un profil de charge de travail (延迟、成本、合规), cette compétence 会選 LiteLLM / OpenRouter / Portkey,并生成路由配置──

## 练习
1. 运行  référencement`code/main.py` déclencher une panne de service; confirmer le retour à l'emploi à un autre fournisseur, et le coût est correctement attribué.

2. 添加语义缓存:prompt 的 SHA256 作为搜索键;缓存击立即返回──测量重复调用成本节省──

3. 添加一个快速分类器,将 `"code ..."`Rapidement, vous allez voir le nom de l'intelligence.`"summarize ..."`rapidement 路由到偏向速度 的别名──

4. conception par équipe: chaque équipe a une limite de dépenses mensuelles; atteindre cette limite, passerelle  rejeter la demande, choisir une granularité de mise en œuvre, soit par demande, soit par fenêtre)

5. Il est également possible de lire la liste des produits proposés et de les utiliser.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/) Autotéléchargement de la passerelle de routage
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 托管 routing SaaS
- [Portkey — docs](https://portkey.ai/docs) 带有护的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) fournisseur 调研
