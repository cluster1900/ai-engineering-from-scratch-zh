# 托管 LLM 平台  Bedrock, Vertex AI, Azure OpenAI

> L'AWS Bedrock est un modèle de marché  Claude, Llama, Titan, Stabilité, Cohere  situé dans la même API 之后.Azure OpenAI est une coopération OpenAI exclusive, plus des unités de débit de production (PTU) de capacité spéciale utilisées.

**Type:** Learn
**语言：**Python (stdlib, comparateur de coûts et de latences de jouets)
**前置要求：**Phase 11 (ingénierie de la maîtrise de la technologie) et phase 13 (outils et protocoles)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- Pour les autres, il est important de noter que les produits sont utilisés dans les différents secteurs.
- Expliquer les unités de débit fournies (PTU) dans Azure OpenAI  vous donner ce que vous avez acheté, ainsi que pourquoi Bedrock à la demande en 405B    en taille normale le nombre de lecture se ralentit environ 25 ms。
- 绘制每个平台的 FinOps 归因界面(Bedrock Application Inference Profiles vs Vertex projet par équipe vs Azure scopes + réservations PTU)
- 写下一条二供应商最低策略,并解释为什么单供应商锁定是2026年代高昂的错误――

##  problématique
Vous avez choisi le produit Claude 3.7 Sonnet. Vous avez besoin de fournir un service. Vous pouvez directement utiliser l'API Anthropic, vous pouvez également utiliser AWS Bedrock, ou passer par le gateway.

Si vous avez besoin d'utiliser Claude、Llama 和 Gemini dans le même produit, vous ne pouvez pas les acheter à partir d'un seul endroit, sauf si ce lieu est Bedrock + Vertex + Azure OpenAI.

Le programme de formation est basé sur la formation professionnelle et la formation professionnelle.

## 概念
### 3 stratégies

**AWS Bedrock** marché: Claude (Anthropic)、Llama (Meta)、Titan (AWS première partie)、Stabilité (image)、Cohere (embedding)、Mistral, ainsi que l'image 和 embedding 子目录──un API, un IAM 界面, un CloudWatch export──Bedrock 的押注是,客户想要可选性,胜过想要单一模型──

**Azure OpenAI** partenariat exclusif― vous obtenez GPT-4/4o/5o-série DALL·E、Whisper, ainsi que la mise à jour du modèle OpenAI                                                                                                                                                                                                                                           

**Vertex AI** Gémeaux d'abord,其余第二── Gémeaux 1.5 / 2.0 / 2.5 Flash et Pro,加上 Model Garden(troisième partie)──Vertex 的押注是多型式 长上下文  1M-token Gémeaux contexte 是差异化因素──

### Latéance différence sous la taille

L'analyse artificielle 运行持续 benchmark──在等效的 Llama 3.1 405B 部署上(shared on demand),Azure OpenAI médiane de latence du premier jeton 约为 50 ms;Bedrock 约为 75 ms── cette différence n'est pas AWS 失败 它是容量模型差异──Azure 销售 PTUs (Provisioned Throughput Units),为您的租户 预留 GPU 容量──Bedrock 的等价格──Bedrock 的等价格──也存在,但每单位 起价约$21/小时,大多数共享客户仍然停留在需求──

Si votre produit SLA est TTFT < 100 ms à P99, alors vous devez acheter des PTU sur Azure, acheter un débit fourni par Bedrock, ou accepter un débit accepté.

### Produit fourni 经济性

Pour une charge de travail prévisible, en comparaison à la demande, le coût est d'environ 70%.

Travail fourni par Bedrock: selon le modèle et la région, chaque heure $21-$50― mathématiques similaires à la même éventail.

Capacité fournie par Vertex  selon Gemini SKU  Vente; prix  因模型和地区 而异,公开宣传更少──

### FinOps 界面  Facteurs de différenciation réels

**Bedrock Application Inference Profiles**C'est le marché le plus propre.`team`- Je suis là.`product`- Je suis là.`feature` Marquer le profil; faire passer tous les modèles par le biais de celui-ci; CloudWatch  sans traitement ultérieur  décomposition du profil  coûts de répartition── il est en hausse en 2025, il est toujours le plus petit hyperscaleur de la capacité de vie originale──

**Vertex**归因是项目-per-team加标签-everywhere──你把每个团队建模为一个GCP项目,在每个资源上打标签,并使用BigQuery Billing Export + DataStudio做rollup──工作更多,但BigQuery 让你对成本数据执行任意SQL──

**Azure**Selon les champs d'abonnement/groupe de ressources, les balises, les réservations de PTU sont considérées comme un élément de coût. Les balises sont tirées des groupes de ressources, plutôt que des demandes.

Le modèle est: Bedrock, Vertex, BigQuery, Azure, Intransparente, à moins que vous ne fassiez un instrument.

### Le verrouillage est un risque de 2026

Lorsque un modèle est dominant, l'engagement à un seul hyperescalade est également acceptable. En 2026, la première moitié du mois est en mouvement.

Le modèle d'adoption des équipes est: pour tout produit, utilisez au moins deux fournisseurs de LLM. Le Bedrock plus Azure OpenAI est un ensemble de données communes.

### Résidence des données, BAA et secteur de la surveillance

Bedrock: la plupart des régions fournissent des BAA; des points d'extrémité de la VPC; des gardiens.
Azure OpenAI:HIPAA、SOC 2、ISO 27001; résidence des données de l'UE;
Vertex:HIPAA, RGPD, résidence des données par région, stack de conformité de Google Cloud.

Les différences se situent dans les politiques de conservation des données, les journaux, la manière de traiter et de surveiller les abus.

### Tu devrais te rappeler le nombre

- Azure OpenAI dans Llama 3.1 405B 等效场景 sous la médiane TTFT: ~ 50 ms(Utiliser des PTU)
- TTFT à la demande: ~ 75 ms。
- Travail fourni par la couche: par unité $21-$50/h.
- Régulation de la PTU Azure: utilisation soutenue de 40 à 60%
- Réservation de la consommation à la demande: jusqu'à 70%


```figure
i4-platform-lanes
```

## Utilisez-le
`code/main.py`La mise en œuvre de la technologie de l'information et de l'information est un processus de mise en œuvre de la technologie de l'information et de la communication.

## Je le livre.
本课会生成 `outputs/skill-managed-platform-picker.md` un profil de charge de travail déterminé (en fonction de la taille de la charge de travail), il propose une plateforme primaire, un plan d'instrumentation FinOps,

## 练习
1. 运行  référencement`code/main.py`Pour le modèle de classe 70B, Azure PTU dans quelle utilisation durable est-il supérieur à la demande? calculer la rupture d'équilibre,并与宣称的 40-60% 区间比较──
2. Vos produits ont besoin de Claude 3.7 Sonnet et GPT-4o... concevoir un déploiement de deux fournisseurs... qui met à l'échelle de l'hypercaler, avant de mettre à l'entrée, la politique de défaillance est quoi ?
3. Unité de soins de santé sous surveillance  Client requérant BAAs、residence de données de l'Est des États-Unis 和 sub-100ms P99 TTFT── choisir une plateforme, et utiliser trois fonctions spécifiques pour obtenir des résultats.
4. Vous avez découvert que le nombre de comptes Bedrock a augmenté de 4 fois en cas de changement de trafic.
5. Pour les 100 millions de jetons/mois Claude, qui est le plus rentable  direct API Anthropic、Bedrock sur demande, ou Bedrock Provisioned Throughput?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Bedrock | "AWS LLM service" | 跨 Claude、Llama、Titan、Mistral、Cohere 的模型 marketplace |
| Azure OpenAI | "Azure's ChatGPT" | 位于 Azure datacenters 中、带企业控制能力的独家 OpenAI 模型 |
| Vertex AI | "Google's LLM" | 以 Gemini 为先的平台，Model Garden 用于 third-party models |
| PTU | "dedicated capacity" | Provisioned Throughput Unit — 预留 inference GPUs，按小时定价 |
| Application Inference Profile | "Bedrock tagging" | 带 tags 的 per-product cost/usage profile，CloudWatch-native |
| Model Garden | "Vertex catalog" | Vertex AI 的 third-party model section，独立于 Gemini |
| Two-provider minimum | "LLM redundancy" | 让每条关键 LLM 路径跨 ≥2 个 hyperscaler 运行的策略 |
| BAA | "HIPAA paperwork" | Business Associate Agreement；PHI 所必需；三者均提供 |
| Abuse monitoring | "the log watcher" | provider-side safety scan，作用于 prompts/outputs；enterprise 可 opt-out |

## 延伸阅读
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) 权威 tarifs de carte 和 tarification de la capacité de débit fournie。
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) Économie de la PTU 和 cartes de taux
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) Les niveaux Gémeaux et les frais supplémentaires du modèle jardin
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/)  La latence et le débit réguliers du fournisseur 
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) cadre de décision de l'entreprise¬¬
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) mécanique d'attribution côte à côte.
