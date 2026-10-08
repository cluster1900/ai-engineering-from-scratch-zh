# Agents multimodels et utilisation informatique (Capstone)

> Le produit frontalier de 2026 est un agent multimodale: il peut lire des captures d'écran, cliquer sur des boutons, parcourir des interfaces Web, remplir des formulaires, et terminer des flux de travail. SeeClick et CogAgent) a prouvé que la première phase de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 12 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de la phase 3 de phase 3 de la phase 3 de phase 3 de la phase 3 de la phase 3 de la phase 3 de

**Type:** Capstone
**语言：**Python(stdlib、action schéma + agent boucle squelette)
**Prerequisites:** Phase 12 · 05（LLaVA）、Phase 12 · 09（Qwen-VL JSON）、Phase 14（Agent Engineering）
**Time:** 约 240 分钟

## Objectif de l'apprentissage
- 设计一个多模特代理循环:percevoir → raison → action → observer → répétition。
- Construire un schéma de sortie de mise à terre de l'interface graphique  cliquez sur les coordonnées  type de texte  défilement  traction), que le VLM  puisse être envoyé en JSON 
- Comparer les agents à capture d'écran seulement, les agents à arbre d'accessibilité et les agents hybrides.
- Dans une petite tranche de VisualWebArena, la mise en place de l'évaluation de référence de l'agent multimodale est suivie:

##  problématique
Un flux de travail sur le site de réservation: " Trouvez-moi un vol pour Tokyo pour le 15 avril, siège d'allée sous 800 $, réservez-le. "

Agents multimodels 需要:

1. 获取浏览器的截图.
2. Pour la première fois, il faut faire une capture d'écran + URL + objectif 解析为计划──
3. 发出结构化action:cliquez sur le bouton "Tokyo" dans l'élément E) ‧roulez vers le bas ‧ sélectionnez le bouton "Radio")
4. L'action sera utilisée dans le navigateur.
5. 观察新状态 (à l'intérieur de la page)
6. 重复 Jusqu'à ce que la tâche soit terminée.

Chaque étape est une appel VLM multimodale. La sortie VLM doit être JSON. Les erreurs se compliquent entre les étapes.

## 概念
### L'interface graphique de la terre  primitive

La mise à terre de l'interface graphique est: donner une capture d'écran et une instruction de langage naturel,输出要点击的 (x, y) coordonnées (( ou autre action) ⋅

VoirClick(arXiv:2401.10935) est le premier résultat ouvert de taille: dans les données GUI synthétiques + réelles, une VLM est mise en fine-tune, avec des jetons de texte clair 输出坐标──有效──

CogAgent ((arXiv:2312.08914) pour les interfaces utilisateurs denses  augmenté le codage haute résolution 1120x1120 ∙:

Ferret-UI(arXiv:2404.05719) est spécialisé dans les interfaces mobiles,并与iOS accessibility data 集成──

Le format de sortie est généralement JSON:

```json
{"action": "click", "x": 384, "y": 220, "element_desc": "Search button"}
```

`element_desc`Aide à la récupération: si les coordonnées se déplacent entre les captures d'écran, l'indice sémantique peut faire revenir le système en arrière.

### Schèmes d'action

Un schéma d'action typique a 6 à 10 types d'action:

- `click`Les points suivants:
- `type`: (texte, x?, y?)
- `scroll`: (direction, montant)
- `drag`Les produits de la production de produits de haute qualité
- `select`: (option_index)
- `hover`Les points suivants:
- `navigate`- Je suis désolé.
- `wait`Les résultats de l'enquête
- `done`: (succès, explication)

agent Chaque étape envoie une action.

### 仅截图 vs 可访问性树

两种输入方式:

- Capture d'écran seulement: image complète, aucune information structurelle.
- Arbre d'accessibilité:domaine structurée/informations d'accessibilité iOS. Pour le grattage, il est très fiable.
- Hybride: les deux ont, utilisant l'arbre comme fondateur fiable des actions atomiques, en utilisant des captures d'écran pour fournir un contexte sémantique.

Les agents de production sont en mesure d'utiliser des applications hybrides.

### Mémoire à long horizon

Un flux de travail en 20 étapes générera 20 张 captures d'écran.

- Chaîne de résumé: à chaque 5 étapes, résumé de ce qui s'est passé, abandonné les anciens captures d'écran.
- Skip-frame: conserver la première, dernière et chaque troisième capture d'écran.
- Log enregistré par l'outil: exécuter des actions, conserver le log de texte du contenu terminé; ne pas revoir les anciens captures d'écran.

L'API d'utilisation informatique de Claude Utilise le modèle de journaux.

### Utilisation d'outils visuels

L'agent peut alors "crop to region (100, 200, 300, 400) puis appeler OCR" comme appel d'outil 输出──tool 返回文本; VLM 继续推理──

Ce modèle peut être généralisé: l'intervention de marque de jeu, l'annotation de la région et les outils de détection externes sont conformes à la même formule d'appel d'outil de sortie, de réponse structurée de réception.

### Les critères de référence de 2026

- ScreenSpot-Pro──environ 1k captures d'écran sur le Web  上的GUI grounding──Open SOTA Qwen2.5-VL-72B 約 85%──Frontier 約 90%──
- VisualWebArena。Tâches web de bout en bout(boutique、forum、annonces)。Open SOTA 约20%──Gemini 3 Pro 约27%──
- Les modèles frontaliers obtiennent 27-40%; les modèles ouverts 10-20%。
- WebArena / WebShop── des références plus anciennes; déjà en bordure 和──

### Pourquoi c'est toujours difficile

Agents de performance:

1. 细粒度 visuel de repérage. "Cliquez le petit X" 经常在移动分辨率下失败.
2. 10 actions 后,agent会偏离目标──
3. Récupération d'erreur── lorsque vous cliquez sur le bouton 失败(错误)
4. Contextes de pages croisées:

Directions de recherche:architectures de mémoire, réaménagement explicite, vérification multimodal, pour une action réussie.

### La pierre angulaire construit-il

Capstone tâche: construire un agent d'utilisation informatique, il peut:

1. 读取 page de mock de site de réservation HTML + capture d'écran.
2. 规划 multistapsequence:recherche → sélection → remplissage du formulaire → soumission。
3. 发发出与行动方案匹配的JSON actions──
4. Dans une tranche de 10 tâches fixe, évaluez-vous.

Cette leçon fournit un code d'échafaudage, facile à étendre pour un navigateur réel.


```figure
mm-agent-loop
```

## Utilisez-le
`code/main.py`Il s'agit d'un échafaudage en pierre de taille:

- Schéma d'action de JSON 定义(10 个 actions)。
- 作为 dict de mock browser state──
- Le schéma de l'agent:recevoir l'état, émettre l'action, appliquer l'état,
- Les pages synthétiques sont utilisées pour mesurer le taux de réussite de bout en bout.
- Quand l'action 失败时的错误-recovery hook──

## Je le livre.
本 lesson 生成 `outputs/skill-multimodal-agent-designer.md` déterminer un produit d'utilisation informatique (domaine, jeu d'action, objectif d'évaluation), concevoir un boucle complet d'agent, stratégie de mémoire, mode de mise en place et score de référence attendu

## 练习
1. Utilisation `screenshot_region`outil ((crop + zoom) étendre le schéma d'action―quelles tâches seront bénéfiques?

2. 阅读 AgentVista(arXiv:2602.23166)。 description de la catégorie de tâches la plus difficile, ainsi que pourquoi les modèles frontaliers still fail­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­

3. Compression de mémoire à long horizon: concevoir une chaîne de synthèse, conserver ≤4 张 captures d'écran en direct, enregistrer 数量不限。

4. Construire un crochet de récupération d'erreur: lorsque l'action échoue, le bouton n'est pas trouvé.

5. Comparer Claude 4.7 avec un écran hybride + un arbre d'accessibilité Qwen2.5 VL dans 10 tâches Web

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GUI grounding | "Click coordinates" | Model 在 screenshot 上针对 instruction 的 target 输出 (x,y) |
| Action schema | "Tool definitions" | 有效 actions（click、type、scroll、drag）的 JSON description |
| Accessibility tree | "Structured DOM" | 来自 browser/iOS APIs 的 machine-readable UI hierarchy |
| Hybrid agent | "Screenshot + tree" | 同时使用 image 和 structured info；比单独使用任一者更可靠 |
| Visual tool use | "Zoom/crop/detect" | Agent 在 plan 中途调用 external vision tools（OCR、detection） |
| Summary-chain | "Memory compression" | 周期性 text summaries 替代很长的 screenshot history |
| VisualWebArena | "E2E web bench" | 2024 benchmark，用于 end-to-end web tasks |
| AgentVista | "2026 hard bench" | 12-domain realistic workflows；即使 Gemini 3 Pro 也只有约 30% |

## 延伸阅读
- [Cheng et al. — SeeClick (arXiv:2401.10935)](https://arxiv.org/abs/2401.10935)
- [Hong et al. — CogAgent (arXiv:2312.08914)](https://arxiv.org/abs/2312.08914)
- [You et al. — Ferret-UI (arXiv:2404.05719)](https://arxiv.org/abs/2404.05719)
- [ChartAgent (arXiv:2510.04514)](https://arxiv.org/abs/2510.04514)
- [Koh et al. — VisualWebArena (arXiv:2401.13649)](https://arxiv.org/abs/2401.13649)
- [AgentVista (arXiv:2602.23166)](https://arxiv.org/abs/2602.23166)
