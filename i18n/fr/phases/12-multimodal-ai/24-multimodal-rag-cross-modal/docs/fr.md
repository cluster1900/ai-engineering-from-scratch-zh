# RAG multimodale et récupération croisée

> Le document RAG n'est qu'un morceau. La production de RAG multimodale est plus large: récupération entre textes, images, audio et vidéo, pour la planification de voyages.

**Type:** Build
**语言:**Python (stdlib,带 fusion + générateur à terre de récupérateur cross-modal)
**先修要求：**Phase 12 · 23 (ColPali), phase 11 (bases du RAC)
**Time:** ~180 分钟

## Objectif de l'apprentissage
- 设计 cross-modal retrieval: texte → image、image → texte、audio → vidéo et ainsi de suite
- Comparer trois stratégies de fusion: fusion de score, fusion axée sur l'attention, fusion MoE,
- Expliquer la génération de la terre: lorsque la source est une variété de modalités de mélange, citons vos sources
- Il est également possible de décrire les résultats de l'enquête canonique multimodale RAG de 2025 ainsi que la taxonomie des sub-problèmes de ces dernières.

##  problématique
Le RAG de mode unique est un modèle déjà mature: requête intégrée, pièces intégrées, récupération, intégration dans le programme de formation professionnelle.

1. Il y a plusieurs têtes de récupération (à chaque mode, il faut intégrer dans l'espace de capacité).
2. 跨 modalité 融合 résultats de récupération。
3. La génération de la terre, besoin de référence à la modalité.
4. 覆盖 cross-modal signal de l'évaluation des mesures

Ces enquêtes de 2025 ont finalement donné la même taxonomie.

## 概念
### Récupération croisée

给定 modality A 的查询,retrieve modality B 的文件──三种模式:

1. L'emplacement de mise en place partagé──CLIP 和 CLAP 在共享空间中生成文字 + image / text + audio Embedding──跨 modality 的共弦相似性 可以直接使用──受限于CLIP 训练过的配对──

2. Encodeur de modalité + traduction。Encodeur de texte + encodeur d'image + un petit module de traducteur, utilisé pour cartographier entre différents espaces。Gupta et al. de Sen2Sen ainsi que d'autres conceptions de 2024 appartiennent à ce genre。

3. VLM comme encodeur. Utiliser les états cachés de VLM  comme représentation de récupération.

选择:text+image 用Clip / SigLIP 2;text+audio 用CLAP;frontier 质量跨模式 用VLM-hidden-states。

### Stratégies de fusion

Vous avez récupéré 10 个结果:5 张图片、3 段文字段、2 个音频片──如何合并?

La fusion de scores (pièces de prix) ⋅ chaque modalité a son propre retriever, chaque retriever ⋅ retour à ses propres scores ⋅ précédemment dans la modalité de normalisation des scores, requiert et ⋅ simple, habituellement efficace ⋅

Fusion basée sur l'attention, tous les objets récupérés, faire un réseau d'attention de petite taille, leur donner plus de pouvoir, besoin de formation.

MoE fusion―réseau de portes 路由到modalité-specific experts―不同查询 类型走不同路由,例如视觉问题 会给图像更高权重―

Si A/B montre des bénéfices évidents dans votre domaine, rééduquez à MoE.

### Le rajeunissement de la génération

LLM  devrait citer 哪个收获项目 支了每个索赔── Pour les multiples modaux:

- Source de texte: référence standard `[1]`Il y a une autre.
- Source d'image:`[img 3]`Avec une légende.
- - Je suis en train de parler.`[audio 2 at 0:34]`Il y a une autre.

Utilisation de données de base entraînement générateur: cible de formation 中的每一个索赔都标注来源索引──Inference 时,model 会自然输出引用──

### Les enquêtes de 2025

Abootorabi et al. ((arXiv:2502.08826,Ask in Any Modality):Taxonomie du RAG multimodale―覆盖retrieval、fusion、generation―覆盖面最广──

Mei et al. ((arXiv:2504.08748,A Survey of Multimodal RAG):重点关注 sous-tâche de référence 和 modes d'échec。 Pour la conception de l'évaluation 很有用──

Zhao et al. ((arXiv:2503.18016): enquête sur la vision de la famille ColPali

读完这三篇,你就能掌握到2025年春季的最新状态──大多子问题仍开放──

### Le document de fondation de MuRAG

MuRAG(Chen et al., 2022) est la première partie du RAG multimodale. Il récupère une image + texte dans le KB multimodale,并生成答案.

### Un exemple de planificateur de voyage de classe de production

Je veux que tu me fasses une idée.

L'équipement de transport:

1. 分解 query──quiet → mot clé audio/review;vegan brunch → élément du menu;natural light → image feature
2. 按 modalité récupérer:
   - Pour les commentaires faire la récupération de texte:
   - Pour les photos de restaurant faire la récupération d'images:
   - Pour les clips de son ambiant, faire une récupération audio: faible décibels, pas de musique.
3. Les scores de fusion. Chaque restaurant a un score composé.
4. Les meilleurs restaurants → Générateur VLM, portent toutes les preuves → 带引用 输出答案。

C'est déjà bien au-delà du texte-RAG. Chaque modalité a inclus le texte seul.

### RG multimodaux agencés

Multi-hop: si la première récupération                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

- Retriever le top 10 initial → LLM 询问太噪音, filtre pour <40 dB → retriever。
- Retriever des images → LLM 发现其中一张有菜单 → récupérer du texte du menu → réponse。

Cela augmentera la complexité, mais peut traiter la récupération à un seul coup  Impossible de résoudre la requête 

### Évaluation

Évaluation intermodale 仍不成熟──常见代理:

- Chaque mode de réception
- Accuracité de fusion de haut en bas.
- Les résultats de l'enquête sont satisfaits.
- Réservation de réservations, achats réalisés

没有覆盖所有modality 的标准基准―― la plupart des documents sont consacrés à des tâches spécifiques à un domaine.


```figure
contrastive-matrix
```

## Utilisez-le
`code/main.py`- Le numéro de la liste:

- Trois faux retrievers, qui fonctionnent dans un corpus de restaurant commun.
- Les scores de fusion, utilisation de poids configurables
- Une réponse finale à la question de la production de citations.
- Une simple boucle d'agencement, lorsque la confiance est faible, réformula la requête.

## Je le livre.
本课产 出 `outputs/skill-multimodal-rag-designer.md` donner une définition de la spécification du produit, des retrievers de conception, de la fusion, du générateur et de l'évaluation du flux de requêtes multimodal

## 练习
1.  proposer un traitement médical Multimodal RAG: requête = photo blessure + symptômes de texte― quelle modalité de récupérer de quel KB?

2. La fusion de scores est une simple somme pondérée.

3. 阅读 Abootorabi et al. 的类别(Section 3)。三个 sous-problèmes canoniques sont-ils ? Comment se reflètent-ils dans le produit que vous choisissez ?

4. Pour le planificateur de voyage RAG multimodale  concevoir une spécification d'évaluation  Quelles mesures  couvrir le rappel d'image  le rappel audio et la précision composite ?

5. R.A.G. multi-hop agentique Chaque tour de retour et de retour dans les villes ont une taxe de latence.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Cross-modal retrieval | “Query 一个 modality，retrieve 另一个” | Text query retrieve images；image query retrieve text；需要 shared space 或 translator |
| Score fusion | “组合 scores” | 对每种 modality 的 retrieval scores 做 weighted sum；最简单的 fusion |
| MoE fusion | “Modality-routed experts” | Gating network 按 query 选择信任哪种 modality 的 scores |
| Grounded generation | “Cite your sources” | 答案中的每个 claim 都标注 source index |
| MuRAG | “第一个 Multimodal RAG” | 2022 年 paper，建立了 Multimodal RAG 模式 |
| Agentic multi-hop | “Reformulate and retry” | 当 first-pass confidence 较低时，LLM 重新 query retrievers |

## 延伸阅读
- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
