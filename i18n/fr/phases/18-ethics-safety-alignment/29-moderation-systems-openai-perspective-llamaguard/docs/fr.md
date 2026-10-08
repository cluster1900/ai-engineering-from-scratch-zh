# 内容审核系统  OpenAI, Perspective, garde de llama

> Les systèmes de modération de niveau de production vont définir les politiques de sécurité en cours 12-16 操作化。OpenAI Moderation API:`omni-moderation-latest`(2024)  Basé sur GPT-4o, pouvant être utilisé une seule fois pour le texte + images 分类; dans le langage de test en ligne, violence / graphique augmenté de 42%; dans la plupart des développeurs, la plupart des modèles retraités: modération de l'entrée (pré-génération)  modération de la sortie (post-génération)  modération de la personnalisation (règles de domaine)  Modération parallèle de la latence cachée; dans le temps de l'interface, les répondants de la base de données de la sécurité de l'application Azure (Ligodine Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange Lange L

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**前置要求：**Phase 18 · 16 (Garde Lama / Garak / PyRIT)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- Décrire la taxonomie de catégorie de l'API OpenAI Moderation, ainsi que l'ensemble des MLCommons de Llama Guard 3
- 描述三级调节模式 ((输入、输出、定制),并指出每一层的一个故障模式──
- Description de l'API Perspective  comme référence pré-LLM, ainsi que pourquoi elle est encore utilisée dans l'étude
- Il faut savoir si le temps de dépréciation de Azure est réel.

##  problématique
Les leçons 12-16 Décrivent les attaques et les outils de défense. Leçon 29 couvre les systèmes de modération déployés, qui vont protéger la surface des produits auxquels les utilisateurs sont en contact.

## 概念
### API de modération OpenAI

`omni-moderation-latest`(2024) ⋅ basé sur GPT-4o⋅ une fois调用即可对文 +图像 分类──对大多数开发者免费──

Catégories de schéma de réponse 中的 13 个布鲁尔语):
- le harcèlement, le harcèlement/la menace
- haine, haine ou menace
- L'autodestruction, l'autodestruction/l'intention, l'autodestruction/l'instruction
- sexuels, sexuels/minors
- violence, violence/graphique
- Illicite, illicite/violente

Soutien multimodal 适用于 `violence`- Je suis là.`self-harm`et `sexual`, mais n'est pas adapté `sexual/minors`; reste pour le texte seulement

Dans le`code/main.py`Dans le cadre de la simplicité de l'enseignement, nous allons`/threatening`- Je suis là.`/intent`- Je suis là.`/instructions`et `/graphic`Les sous-catégories se plient à leurs parents de haut niveau.

Dans plusieurs langues, les résultats de la modération ont augmenté de 42% par catégorie, les seuils ont été définis par la même application.

### Garde de la lame 3/4

已在教学16 覆盖──14 个 MLCommons dangers catégories(组织方式不同于OpenAI's 13 个响应方案布鲁尔语)──支持 8 langues (v3)──Llama Guard 4 (2025 年 4 月) 原生支持多模,12B──

Les taxonomies de l'OpenAI et de la Garde des Llamas sont superposées mais aussi différentes. L'OpenAI sera "illicite" en tant que catégorie large; la Garde des Llamas sera "crimes violents" et "crimes non violents" divisés.

### API de perspective (Google Jigsaw)

Il est également possible de trouver des solutions à des problèmes de toxicité dans les systèmes de notation de toxicité de la licence de médecine supérieure (LEM) avant 2020.

Il est largement utilisé comme base de recherche de la modération de contenu, car cette API est stable, possède des documents et possède des données d'étalonnage de plusieurs années.

### Le motif à trois couches

1. **Input moderation.**En génération 前对用户提示 分类──如果标记,则拒绝──延迟:一次分类器调用──
2. **Output moderation.**En livraison, avant de la sortie du modèle, la classe est classée. Si elle est signalée, elle est remplacée par le refus.
3. **Custom moderation.**Règles spécifiques à un domaine (régex, allowlists, politique commerciale)

Ceci est un modèle séquentiel: modération d'entrée  doit être effectuée en génération 前完成, modération de sortie 后运行 在 génération 后运行.

### Mode d'échec

- **Input only.**捕捉不到输出幻觉 (leçon 12-14), les attaques de codage vont contourner les classifiateurs d'entrée)
- **Output only.**允许 toute entrée à l'échantillon; augmenter les coûts; exposer le racontant interne à l'attaquant 
- **Custom only.**无法稳健覆盖各类类别;régiques 很脆弱──

La couche est la pratique standard.

### Dépréciation de l'azur

Modérateur de contenu Azure: 2024 ann. 2 月: dépassé, 2027 ann. 2 月: retiré.

### Là où cela s'inscrit dans la phase 18

Leçon 16 Dans le contexte de l'équipe rouge 中覆盖 умерентование инструментали­sing──Leçon 29 覆盖部署 умерен­tion──Leçon 30 以当前双用途能力证据 收尾──


```figure
an-moderation-layers
```

## Utilisez-le
`code/main.py`构建一个三层调节器:input moderator(keyword + category score) 、output moderator(对 output 使用同一分类器) 、custom moderator(domain rules) 。你可以将输入 跑过它,并观察哪一层捕捉到了什么──

## Je le livre.
本课产 出 `outputs/skill-moderation-stack.md` Pour déterminer un déploiement, il recommandera la configuration de la pile de modération: entrée, utilisation de classifiateur, sortie, utilisation de classifiateur, utilisation de règles personnalisées, ainsi que des cas d'avantage utilisant le juge.

## 练习
1. 运行  référencement`code/main.py`◊将良性、边界和有害输入 跑过全部三层――报告每种情况哪一层触发――

2. 扩展 harness,加入针对特定类别的Perspective-API-style toxicity scoring──comparer son comportement de seuil avec le score de catégorie──

3. 阅读OpenAI Moderation API docs 和 Llama Guard 3 catégorie liste。将每个OpenAI catégorie 映射到最接近的Llama Guard categories。找出三个无法干净映射的类别。

4. Pour le déploiement d'assistants de code (par exemple, GitHub Copilot) concevoir une pile de modération, identifier les catégories les plus associées et les moins associées, et proposer des règles personnalisées.

5. Le Modérateur de contenu Azure sera retiré en 2027[2].

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | 基于 GPT-4o 的 13-category (text) classifier，带部分 Multimodal support |
| Perspective API | "Google Jigsaw toxicity" | Pre-LLM-era toxicity scoring baseline |
| Llama Guard | "MLCommons 14-category" | Meta 的 hazard classifier（v3：8B text，8 langs；v4：12B Multimodal） |
| Input moderation | "pre-generation filter" | model call 前作用于 user prompt 的 classifier |
| Output moderation | "post-generation filter" | delivery 前作用于 model output 的 classifier |
| Custom moderation | "domain rules" | Deployment-specific rules（regex、allowlist、policy） |
| Layered moderation | "all three layers" | 标准生产部署模式 |

## 延伸阅读
- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) point final de l'omni-modération
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) Répôt de garde de l'armée
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) Score de toxicité
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) Remplacement d'Azure
