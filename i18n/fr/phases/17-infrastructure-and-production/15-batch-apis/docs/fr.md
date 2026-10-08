# Les API de lot  50% déconte devenir un standard de l'industrie

> Chaque fournisseur principal offre une API de lot asynchrone, avec 50% de réduction et environ 24 heures de redressement. OpenAI, Anthropic, Google, ainsi que la plupart des plateformes d'inférence (Fireworks batch tier, Ensemble batch) ont réalisé le même modèle. Le coût des pipelines de nuit va diminuer d'environ 10% du coût de la mise en cache. La règle est très simple: si elle n'est pas interactive, elle devrait être mise en lot. Les lignes de production de contenu, la classification des documents, les données, les rapports, l'étiquetage de masse, l'étiquetage de catalogues, tout ce qui peut tolérer 24 heures de retard de travail, avant le transfert de lot, mais avant la mise en cache, tout l'argent reste sur la table. Le nouveau modèle de production de 2026 ans est de mettre en ligne chaque nouvelle entrée de travail de la LMM à trois phases interactives: les files d'attente, les coordonnées de travail, les coordonnées de travail, les coordonnées, les coordonnées, les coordonnées, les coordonnées, les coordonnées, les coordonnées, les coordonnées, les coordonnées, les coordonnées, les coordonnées, les coordonnées, etc.

**Type:** Learn
**Languages:** Python (stdlib, toy batch-vs-sync cost simulator)
**前置要求：**Phase 17 · 14 (Cachage rapide et sémantique)
**Time:** ~45 minutes

## Objectif de l'apprentissage
- Il y a trois fournisseurs de lot d'API (OpenAI, Anthropic, Google) ainsi que 50% de réduction + 24h de retour de garantie.
- 计算 overnight Classification de la charge de travail 中叠加批量 + coût des entrées cachées,并与同步-未存基线对比──
- Pour les besoins de la formation, il est nécessaire de définir les conditions de formation et de formation des stages de formation.
- Il y a deux pièges: l'interactivité partielle (les attentes des utilisateurs sont plus rapides que les 24h) et la dérive du schéma de sortie (le format de fichier de lot) du fournisseur et de l'autre fournisseur.

##  problématique
Votre équipe a publié un pipeline de génération de rapports nocturne, 50 000 documents, résumés individuels, résumés de cluster, réélaboration de l'exécutif brief,

Le lot peut vous donner 50% de réduction. Vous êtes encore dans le système prompt. Tous les appels de 50k sont partagés.

Le lot est le plus abordable de LLM, mais très peu de gens utilisent le dessus. La raison principale est au niveau de l'organisation: les équipes pensaient que c'était en temps réel, mais le SLA est en fait le matin.

## 概念
### 3 API de lot

**OpenAI Batch API**Le nombre de fichiers JSONL de la liste des demandes est de 24 heures de retour.`/v1/batches`Les entrées correspondant aux conditions de cache peuvent également être évaluées en fonction de ces conditions.

**Anthropic Message Batches**JSONL téléchargement: 24 heures de retour: 50% de réduction:`cache_control`Le cache écrit est évident, il lit que ça se produit automatiquement.

**Google Vertex AI Batch Prediction**Les produits de la société ont été vendus à la société de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise de l'entreprise.

### Sémantique: asynchrone, pas lent

Le lot est promis dans 24 heures                                                                                                                                                                                                                                                            

### Avec le caching

Une résumé de document 50K, en utilisant le même système de jetons 4K:

- Les données de l'équipe de surveillance sont définies dans le tableau 5.$input × 4000 + $Les résultats sont obtenus par le système de production de l'énergie.
- Synchronous caché: système prompt 在首次写后被缓存; restant 49999 fois obtenir便宜 10x de l'entrée。
- Partie caché:以上全部,再加上阅读 和写 两者的50% de réduction。

叠加效果:batch + cache = 约为同步未缓存账单的10%──任何一夜运行且拥有共享系统提示的工作负载都应该使用它──

### Triation de la charge de travail

**Interactive** Utilisateur attendre réponse。TTFT 很重要。使用带快速缓存的同步调用──不能批量──

**Semi-interactive** Utilisateur soumettre des tâches, quelques minutes après revenir et voir.

**Batch** Utilisateur attend le résultat dans la matinée ou à l'heure suivante──Pipelines de contenu、Classification à grande échelle、Analyse hors ligne──始终批,始终叠加缓存──

常见错误: Parce que le pipeline est la production, on classifie tout comme interactif.

### Interactivité partielle 陷

Certaines fonctionnalités semblent interactives, mais peuvent tolérer 5 à 10 minutes. Par exemple: avec un rapport de santé du client le soir de la presse.

La question est: que signifie 24 heures pour cet utilisateur ? Si la réponse est qu'ils ne le remarqueront pas, on le battra.

### - le schéma de sortie

Format de fichier de lot en cause

- JSONL, chaque requête.
- En anglais: JSONL, chaque message; format de réponse 内嵌。
- Vertex:BigQuery table ou avec préfixe GCS de TFRecord

跨 provider 编写 one batch client Signifie que chaque fournisseur a besoin de code adaptateur。宣传多供应商批发的门口(Portkey、LiteLLM的某些层)

### Tu devrais te rappeler le nombre

- Réduction de lot du fournisseur: entrée + sortie 统一 50%。
- SLA de retour: garantie 24 heures, P50 typique 为 2-6 小时──
- 叠加 batch + entrée en cache: environ 10% du coût non caché synchronisé.
- Règles de triation de la charge de travail: si la latence de 24h est acceptable,始终批量──


```figure
batch-lane-triage
```

## Utilisez-le
`code/main.py`Pour un travail de 50 000 documents  calculer le coût de la synchronisation, synchronisation + cache, lot, lot + cache ⋅ rapport en $ 和 % des économies de données ⋅

## Je le livre.
本课会产出 `outputs/skill-batch-triager.md` déterminer les caractéristiques de la charge de travail, séparer les flux vers l'interaction/semi/batch, et estimer les économies 

## 练习
1. 运行  référencement`code/main.py`Pour un pipeline de 100k-doc, utilisez un système de 3K-token prompt et 500-token output, calculer la pile complète de la série de données par caché) par rapport à la ligne de base de synchronisation de l'épargne-enregistrement.
2. 选择一个你熟悉的真实产品中的三个特点――将每个特点分流到互动/semi/batch――
3. Les utilisateurs se plaignent que leur rapport a passé 3 heures. C'est un mauvais tri, ou est-il légal ?
4. Votre retour de lot API SLA est de 24h, mais P99 est de 20h. Comment vous communiquez-vous avec les utilisateurs dans ce cas de bord?
5. Compte-break-even: longueur partagée-prefix  atteindre combien de temps, lot + cache 会比你自己的GPU réservé sur la nuit 运行更便宜?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Batch API | “async discount” | 50% off，24h turnaround |
| JSONL | “batch format” | 每行一个 JSON request；OpenAI/Anthropic standard |
| Message Batches | “Anthropic batch” | Anthropic 的 batch API product name |
| Batch prediction | “Vertex batch” | Vertex AI 的 batch API product |
| Turnaround SLA | “24h promise” | 保证，不是典型值；典型是 2-6h |
| Workload triage | “interactivity decision” | Interactive / semi / batch routing decision |
| Output schema | “response format” | 每个 provider 的 JSONL layout；不可移植 |
| Stacked discount | “batch + cache” | 两者都适用时，约为 uncached sync bill 的 10% |

## 延伸阅读
- [OpenAI Batch API](https://platform.openai.com/docs/guides/batch) Format JSONL 和 `/v1/batches`La sémantique
- [Anthropic Message Batches](https://docs.anthropic.com/en/docs/build-with-claude/batch-processing) format de lot 和 `cache_control`Les interactions
- [Vertex AI Batch Prediction](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/batch-prediction) Jeunesse de Gémeaux 语义。
- [Finout — OpenAI vs Anthropic API Pricing 2026](https://www.finout.io/blog/openai-vs-anthropic-api-pricing-comparison)
- [Zen Van Riel — LLM API Cost Comparison 2026](https://zenvanriel.com/ai-engineer-blog/llm-api-cost-comparison-2026/)
