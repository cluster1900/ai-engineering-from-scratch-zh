# FinOps des LLM   unité économique et multi-locataire  attribution

> Les coûts sont des transactions de jetons, et non des ressources en ligne. Les étiquettes ne peuvent pas être affichées, une appel d'API est une transaction, pas un actif.`user_id`) pour la fixation des prix des sièges, et pour l'expansion, par tâche`task_id`+ `route`) pour le coût et la priorité des produits en surface, par locataire`tenant_id`L'échelle d'application du produit: selon le taux de limitation du loyer: 2-3x de la valeur maximale prévue, une clarté de 429 + retrait après); dépense quotidienne: 1,5 à 3x de la limite de contrat; taux de rebond; taux d'alerte; dépense de z-score > 4 heures en activation:

**类型：**Apprenez à le faire
**语言：**Python(stdlib, avec commutateur de tuerie de jouets simulateur d'attribution des coûts)
**先修：**La phase 17 · 13(Observabilité), la phase 17 · 14 ((Cachage)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- 解释为什么传统FinOps (tags + tiers) dans les dépenses de LLM 会失效,并说出三个新归因维度──
- 枚举四个代币层(prompte、tool、memory、response),并说明为什么单桶发票会隐藏成本──
- Pour les locataires multiples 产品设计执法梯子(rate → spend cap → kill switch)
- 选择单位指标(coût par requête / artefact résolu), plutôt que $/M Token。

##  problématique

Votre compte indique 40 000 $.
- Quel locataire a perdu cet argent ?
- Le produit qui a favorisé ces dépenses.
- Y a-t-il un utilisateur individuel en usage ?
- Il y a aussi des appels à l'outil, ou une amplification de la mémoire.

Les étiquettes et les agrégats du fournisseur pour les ressources cloud (EC2、S3) sont valides, car les étiquettes se propagent jusqu'aux éléments de ligne. Les appels de l'API LLM ne seront pas automatiquement associés à des étiquettes, vous devez être sur le site d'appel 打上用户/task/tenant,并一路传递──事后归因总会漏掉边缘案──

## 概念

### 3 dimensions de la résistance

**Per-user**(le secteur de l'énergie)`user_id`): qui a généré des coûts;. conduit à des prix de sièges, à des discussions d'expansion, à une identification des utilisateurs d'électricité;.

**Per-task**(le secteur de l'énergie)`task_id`+ `route`): la décision de déterminer quelle surface de produit a généré le coût et la priorité des caractéristiques et si elles sont coûteuses.

**Per-tenant**(le secteur de l'énergie)`tenant_id`): quel client est rentable ∙ unité économique ∙ prix de renouvellement ∙ seuils de niveau ∙

Depuis le premier jour, le site d'appel est en train de se dérouler.

### Quatre couches de jetons

| Layer | Example | Typical % of total |
|-------|---------|---------------------|
| Prompt | system + user input | 40-60% |
| Tool | tool-call results fed back | 20-40%（agent workloads） |
| Memory | prior conversation / retrieved docs | 10-30% |
| Response | model output | 10-30% |

Mettez les quatre couches dans un seau, ça va vous faire perdre de l'optimisation.

### L'échelle d'exécution

1. **Rate limit**按租客 设置──预期峰值的2-3x──返回带 `Retry-After`Le logement est bloqué, il n'y aura pas de factures imprévues.

2. **Daily spend cap**按租客 设置──合同上限的1.5-3x──触发: limite de taux de réception + alerte du succès du client──

3. **Kill switch**基于相对于租客基线的支出 z-score > 4──auto-pause租客;pagina on-call;升级给 ops + CS──

### 归因模式

- **Tag-and-aggregate**:打 metadata header;稍后聚合──简单;粗略──
- **Telemetry joiner**: À travers les identifiants de trace Placez les traces connectez à la facturation。
- **Sampling + extrapolation**Le coût de l'échantillon est de 5 à 10%, le coût de l'échantillon est de 5 à 10%, le coût de l'échantillon est de 5 à 10%, le coût de l'échantillon est de 5 à 10%, le coût de l'échantillon est de 5 à 10%.
- **Model-based allocation**: utilisez la régression 推断 cost driver。 applicable aux données héréditaires sans étiquettes。
- **Event-sourced**Les événements dans le flux Kafka / Kinésis
- **Real-time streaming**Le tableau de bord est mis à jour.

### Le coût par X est un indicateur unitaire

$/M Token est le fournisseur 语言──产品指标是:

- Chaque coût de l'œuvre a été résolu.
- Le coût de chaque article de production.
- Le coût de chaque tâche d'agent de succès.
- Chaque utilisateur se retrouve à un moment donné.

Pour les produits, il n'y a pas de limite de prix.

### 成本归因 结构

```
trace_id: abc123
  user_id: u_42
  tenant_id: t_7
  task_id: task_classify_doc
  route: model_haiku
  layers:
    prompt_tokens: 1800
    tool_tokens: 600
    memory_tokens: 400
    response_tokens: 150
  cost_usd: 0.0135
  cached_input: true
  batch: false
```

Chaque appel emite un lac de données.

### 复合节省 

Stack: cache + lot + route + passerelle。
- Cache L2(Phase 17 · 14):entrée 约便宜 10x。
- Partie: la phase 17 · 15): 50% de réduction
- Route à un modèle bon marché (Phase 17 · 16): coûts réduits de 60%
- Efficience de la passerelle (Phase 17 · 19):rédondance + retraitement de la tentative).

La situation est la meilleure: environ 5 à 10% de la base naïve. La plupart des équipes ont activé 2 à 3 leviers.

### Tu devrais te rappeler le nombre

- 归因维度: par utilisateur, par tâche, par locataire
- Quatre couches de jetons: prompt, outil, mémoire, réponse.
- - Le commutateur de commutation: dépenser un score z > 4
- 单位指标:coût par requête résolue, plutôt que $/M Token。
- Optimisations en pile: il est possible d'atteindre la limite de référence d'environ 5 à 10%*.


```figure
i4-spend-ladder
```

## Utilisez-le

`code/main.py`模拟一个多租户LLM服务,带三层执法梯子──注入一个虐待租户,并演示杀开关 触发──

## Je le livre.

本课会生成 `outputs/skill-finops-plan.md` donner un produit et une échelle, un schéma d'attribution de conception et une échelle d'application.

## 练习

1. 运行  référencement`code/main.py`Tu sais comment choisir la valeur ?
2. Vous allez construire quelles 5 vidéos ?
3. Le plus grand locataire est unité-économie-négatif.
4. Pour le produit de support  calculer le coût par billet résolu:3M Token/billet, environ 800 billets/jour, taux de mise en cache GPT-5
5. Le marquage rétroactif est-il possible ou non ?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Per-user attribution | “user-level cost” | 每次 call 都打上 `user_id` |
| Per-task attribution | “feature cost” | `task_id` + `route` 识别 product surface |
| Per-tenant attribution | “customer cost” | `tenant_id`；驱动单位经济性 |
| Four token layers | “cost layers” | prompt + tool + memory + response |
| Rate limit | “429 guard” | 在 gateway 强制执行的 per-tenant ceiling |
| Daily spend cap | “daily ceiling” | Tenant-scoped budget，带 alert |
| Kill switch | “auto-pause” | Spend z-score > 4 触发 auto-suspension |
| Cost per resolved | “product unit metric” | 成本绑定到产品结果，而不是 Token |
| Telemetry joiner | “trace-to-billing” | 准确性最高的归因模式 |
| Stacked optimization | “cache+batch+route+gateway” | 复合节省到约 5-10% baseline |

## 延伸阅读

- [FinOps Foundation — AI FinOps Overview](https://www.finops.org/wg/finops-for-ai-overview/)
- [FinOps School — Cost per Unit 2026 Guide](https://finopsschool.com/blog/cost-per-unit/)
- [Digital Applied — LLM Agent Cost Attribution 2026](https://www.digitalapplied.com/blog/llm-agent-cost-attribution-guide-production-2026)
- [PointFive — Azure OpenAI 中的 Managed LLMs](https://www.pointfive.co/blog/finops-for-ai-economics-of-managed-llms-in-azure-open-ai)
