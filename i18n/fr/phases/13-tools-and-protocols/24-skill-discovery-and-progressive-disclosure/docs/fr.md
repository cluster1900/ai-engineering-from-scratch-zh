# Découverte des compétences et dévoilée progressive

> Une compétence a déjà joué un rôle avant que son texte soit chargé. Son nom et sa description gagnent une place dans le répertoire; tandis que les documents de niveau plus profond ne sont admissibles à l'entrée que lorsque les tâches les touchent réellement.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22 (Agent Skills: Portable Contract and Runtime Boundary)
**Time:** ~105 minutes

## Objectif de l'apprentissage

-  Construire un domaine de travail                                                                                                                                                                                                                                                           
- 解释三种渐进式披露级别(trois niveaux de divulgation):目录元数据(catalogue de métadonnées)、激活指令(instructions actives)和特定任务资源(任务特定资源)。
- 设计引用 (en anglais seulement), permettant à l'agent de pouvoir obtenir directement les détails nécessaires sans avoir à charger l'ensemble du paquet.
- Le budget de l'espace et de la capacité d'activation
- Dans la connaissance de l'apprentissage, il faut refuser de traverser le chemin et de s'échapper.

##  problématique

Ton agent a mis en place 200 compétences.`SKILL.md`、 référence du fichier de référence) 、 scénario et modèle, les tâches actuelles seront inondées dans des détails de processus sans rapport.

Le schéma de décomposition habituel est le catalogue: il est possible de présenter à chaque modèle les caractéristiques et les caractéristiques de chaque compétence qualifiée, mais seulement après avoir été sélectionné, le texte complet est chargé.

首先, la découverte (découverte) n'est pas seulement une recherche de fichiers. Les compétences peuvent être présentes dans le domaine de travail du projet.

En revanche, la divulgation progressive peut se transformer en un désordre progressif.`SKILL.md`写着阅读相关指南,而包内包含12指南,模型就只能靠猜猜.

Un bon temps de fonctionnement permet de rendre le processus de découverte plus précis et de faire connaître les informations.

## 概念

### 发现是一个编译器流水线

Le système de fichiers est considéré comme une entrée de source.

```figure
skill-discovery-pipeline
```

Chaque étape devrait générer des données structurées et des erreurs structurées.

- - Vous avez cherché quel catalogue ?
- Vous avez trouvé des candidats ?
- Pourquoi tu as refusé de faire partie des candidats ?
- Dans le conflit de nom, quel est le meilleur gagnant ?
- En raison des limites budgétaires, quels sont les éléments de liste qui sont raccourcis ou omis?

Sans ces preuves, il est presque impossible de comprendre pourquoi le modèle n'utilise pas mes compétences.

### 作用域是运行时策略

La norme de transfert définit la structure du paquet de compétences, mais ne définit pas un seul chemin d'installation ou un ordre de priorité.

Un usage général peut être utilisé dans les domaines suivants:

| 作用域 (Scope) | 示例根目录 | 预期所有者 |
|---|---|---|
| Workspace (工作区) | `<repo>/.agents/skills/` | 项目维护者 |
| User (用户) | `<user-data>/skills/` | 单个开发者 |
| Administrator (管理员) | `<system>/skills/` | 机器或组织策略 |
| Plugin (插件) | 已签名的插件包 | 插件发布者与安装者 |
| Built-in (内置) | 运行时自带包 | 运行时提供商 |

截至2026年8月,Codex 文档规定项目级发现会从 `$CWD/.agents/skills`开始上升遍历祖先目录直至代码仓库根目录,外加、用户管理员和内置位置──它支持符号链接的技能 目录──同名技能可能同时出现,而不是被合并──这些是Codex's具体行为,并非`SKILL.md` exigences obligatoires de la réglementation; lorsque vous écrivez un adaptateur, veuillez consulter les dernières [Codex skill 文档](https://learn.chatgpt.com/docs/build-skills)Il y a une autre.

绝不要凭空从目录名称推断优先级――应将其声明为明确的策略并进行测试――本课实验为每一个课程`Scope`Utilisation de la priorité des nombres entiers apparents, pour assurer que le même ensemble de candidats résulte toujours le même résultat.

### 冲突需要超越 `name`La seule identification

- Je suis là .`release-readiness`Le contenu peut être légal. L'un peut être le couverture de la classe de projet, l'autre le dépassage de l'espace de travail.

```json
{
  "name": "release-readiness",
  "description": "Inspect a release candidate for this repository.",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

常见冲突策略 comprennent:

| 策略 | 优势 | 风险 |
|---|---|---|
| 保留所有候选包 | 不会隐藏任何内容 | 模型会看到歧义的名称 |
| 最高优先级作用域胜出 | 调用简单直接 | 本地包可能会遮蔽（shadow）受信任的包 |
| 拒绝重复项 | 无隐式遮蔽 | 合法的覆盖机制将失效 |
| 按来源限定名称（命名空间化） | 身份明确 | 面向用户的名称变长 |

Pour l'hôte, choisir une stratégie. Même si certains candidats ne figurent pas dans le catalogue de modèle, les informations des candidats rejetées ou cachées doivent être conservées dans le journal de diagnostic.

### 3 catégories

Les compétences des agents 规范 ont décrit la mise en charge en plusieurs étapes.

```figure
skill-disclosure-levels
```

#### Niveau 1: 目录元数据 (méta-données du catalogue)

Le modèle nécessite suffisamment d'informations pour distinguer cette compétence des compétences adjacentes. La norme estime que chaque élément de l'annuaire occupe environ 100 jetons, mais la séquestration et la tokenization réelles sont décidées par l'hôte.

Une description utile contient deux phrases:

```yaml
description: Validate a release candidate and produce a readiness report. Use when the user asks whether a version, tag, or package is ready to publish.
```

La première phrase explique la capacité de l'expérience (capacité) (2). La deuxième phrase explique la limite de déclenchement.

#### Niveau 2: 激活指令 (instructions actives)

 activation ,  devrait jouer un rôle de routeur et de processus de travail `SKILL.md`Restez à l'intérieur de 500 行. C'est un signal de conception, et non pas un objectif à remplir.

Il doit contenir:

- 任务边界;
- 默认工作流;
- 分支条件;
- Cité directe de documents de plus en plus profondeur;
- 工具和脚本契约(contrat);
- comportement de décès et de cessation;
- 预期输出 et ses méthodes de vérification

Ne vous contentez pas de faire court le fichier d'entrée, mais de transférer le flux de travail central au centre de référence.

#### Niveau 3: 支资源 (Réserves de soutien)

Les références fournissent des détails ou des données. Les scripts fournissent des calculs de détermination. Les actifs sont utilisés comme matériau de copie, de remplissage ou de transformation en matière de livraison finale, et non comme ordonnance elle-même.

| 目录 | 模型是否读取？ | 模型是否执行？ | 典型内容 |
|---|:---:|:---:|---|
| `references/` | 是，在需要时 | 否 | schemas、策略、领域指南 |
| `scripts/` | 可以视情况检视 | 通过被允许的工具 | 验证器、转换器、数据收集器 |
| `assets/` | 仅在有用时 | 否 | 模板、fixtures、图像、起始文件 |

Ces répertoires sont seulement des références, pas des capacités magiques fixes.

### 面向分支的具体参考优于粗暴的专题倾倒

Écrire le dossier d'entrée en figure de décision:

```markdown
## Choose the path

- For a Python package, read `references/python-release.md`.
- For a container image, read `references/container-release.md`.
- For a documentation-only release, read `references/docs-release.md`.
- If the release combines artifact types, read only the guides for those artifacts.
```

Il y a une condition de charge observable pour chaque référence.`references/` Get more information

保持引用图(reference graph) 平浅显──官方指南建议从 `SKILL.md`直接链接, éviter le lien de mise en service à niveau.

```figure
skill-reference-map
```

### Le budget actuel et le budget actif sont deux types de budgets indépendants.

设 $c_i$Pour la compétence $i$Le répertoire de la séquence après la séquence est ouvert,$B_c$Pour le budget,$b_j$Pour activer la vraie vente,$r_k$Pour la charge réelle des ressources

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

 Réduire un budget ne réduit pas automatiquement un autre budget                                                                                                                                                                                                                                                       

Dans le cas actuel, le codex contrôle le budget de la liste des compétences initiale dans la fenêtre des compétences de base de 2%[6]. Les limites de caractères 8,000 sont uniquement imposées dans la fenêtre des compétences de base de base de la fenêtre des compétences de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de base de

### Le chemin des ressources est la confiance

Une compétence  devrait seulement pouvoir lire les documents de son propre emballage ⋅ 字面字符串前检查是远远不够的:

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

Utilisation du système de fichiers pour résoudre les liens de code et les chemins de candidature, refuser absolument les chemins d'entrée, et vérifier si les chemins de candidature après le résultat sont toujours sous le registre de code.

```figure
skill-resource-containment
```

Le contenu de la communication est un contenu qui ne peut être utilisé que par les utilisateurs.

### Le processus de chargement doit être observé

记录披露事件, tout en évitant de consigner des informations confidentielles:

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate contains pyproject.toml",
  "bytes": 2840
}
```

`reason`Le passage sera une fois le texte choisi pour être traduit en preuve de contrôle disponible. Il aide également à identifier les mauvaises instructions qui conduisent l'agent à se protéger de tout le monde et à charger tous les documents.

## - Je le construis.

`code/main.py`Œuvre d'un moteur de découverte et de divulgation de la certitude 

发现模块的接口包括:

- `Scope`: pour les données de source et de priorité;
- `SkillCandidate`: indiquer un dossier système de candidature non éprouvé;
- `discover_scope(scope)`: mise en place de compétences directes de niveau inférieur;
- `resolve_collisions(candidates, precedence)`: appliquer des déclarations de conflit;
- `CatalogEntry`Avec `build_catalog(...)`: publier des données de valeur;
- `CatalogBudget`: la séquence de calcul nucléaire à des fins de prise d'espace, éviter le nombre de caractères supposés égal au nombre de jetons généraux

披露模块的接口包括:

- `load_skill_body(entry, ...)`: pour le niveau 2 de activation;
- `validate_reference(skill_dir, reference)`: pour les contrôles de limitation de route;
- `load_reference(...)`: pour les niveaux 3

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Le bloc de commande doit cloner son environnement et peut être défini à partir du répertoire de travail de l'intérieur du clone.

La présentation créera un domaine de travail temporaire et un domaine d'utilisation, introduira des conflits, construira des catalogues dans un budget très réduit, activera une compétence, et tentera séparément de faire référence à la loi 阅读和目录遍历逃逸──la présentation n'installera aucun document permanent──

### Pourquoi trouver des couches basses

`discover_scope`仅检查直接子目录下 `SKILL.md`Il ne reviendra pas à chaque emplacement.`SKILL.md`视为独立包── ceci protège les frontières du包, évitant ainsi l'accident de la publication de compétences déjà installées 内部 des exemples ou des dispositifs de test──

### Pourquoi l'expérimentation ne résolve pas YAML

实验仅支持其目录所需标量前材料――生产运行时应使用安全的YAML 解析器,配备显式 schema、大小限制,并禁用自定义对象构建――仅使用标准库(Stdlib-only)是一个教学约束,而不是默许随意发明不完整的YAML 方言借口――

## Utilisez-le

Ce tableau de contrôle est appliqué à tout appareil de détection:

1. Listes de tous les répertoires et de tous les titulaires de droits d'écriture
2. 明确说明是否允许符号链接包──
3. 校验包名、目录名、必需元数据和入口正文大小。
4. Dans le cadre de la politique de sécurité, la politique de sécurité et de sécurité des travailleurs est une priorité.
5. 声明并测试同名重复行为。
6. 精确测量发送给模型的序列化目录大小──
7. - Je suis un homme de bien.
8. Les ressources de lecture seront strictement limitées dans le catalogue de contenu de la résolution.
9. Lorsque le dossier de référence est manqué, il est clair que le rapport a été défait.
10. Lorsque l'état ou la stratégie de l'installation change, il est nécessaire de réorganiser le répertoire.

## Je le livre.

Le cours est terminé.`skill-catalog-builder`组件包── il est utilisé selon un ordre clairement défini pour analyser le répertoire de racines, rejeter les documents d'entrée et les noms-répertoires non correspondants des liens de symboles, résoudre les conflits entre les domaines de travail, rejeter les répétitions de la même priorité et insérer les données de base dans le budget des caractères de la déclaration.

Le rapport JSON contient des articles sélectionnés, des paquets de candidatures cachés, des articles omis, des erreurs de test, des priorités et des utilisations budgétaires. Le chargement des documents de référence et de texte reste indépendant, le constructeur de liste n'exécute donc pas le script et ne met pas l'ensemble du paquet directement dans le texte ci-dessous.

## 练习

1. Ajouter un plugin 作用域, en prioriser entre l'utilisateur et le test intégré ⋅ éditer test prouver ses résultats de résolution de conflit⋅
2. Pour ce qui est de la stratégie de conflit, la mise en place de la stratégie de conflit est une priorité absolue.
3. Pour`load_reference`添加字节大小限制──测试一个恰好等于限制文件和一个超出一字节的文件──
4. Œuvres de rédaction de deux descriptions qui semblent presque identiques Œuvres de rédaction, qui permettent de faire passer les limites de leur étiquette Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œuvres de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ de rédaction Œ d'œ d'œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ œ
5. Ajouter un manifeste contenant chaque référence et script 哈希值的宣言──在加载前检测出被改的资源──
6. Pour démontrer les points de dépôt, séparément rapport le niveau 1 ∼Level 2 和Level 3 ∞

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| Skill 发现 (Skill discovery) | “找到所有 SKILL.md” | 搜索配置的作用域，校验包，附加来源溯源信息，并应用策略 |
| Skill 目录 (Skill catalog) | “已安装 skills 列表” | 面向合格包的、模型可见的紧凑路由元数据 |
| 冲突策略 (Collision policy) | “哪个重复项胜出” | 针对来自不同来源的同名候选包所声明的处理规则 |
| 渐进式披露 (Progressive disclosure) | “懒加载” | 从目录到正文再到特定分支资源的分阶段上下文引入 |
| 引用图 (Reference graph) | “skill 链接的文件” | 可达的资源结构及其加载条件 |
| 路径限制 (Path containment) | “留在文件夹内” | 验证解析后的资源目标路径始终位于解析后的包根目录下 |

## 延伸阅读

- [Agent Skills 规范](https://agentskills.io/specification): comprendre la structure du projet et les niveaux de présentation progressive
- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions): connaître la rédaction du catalogue
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices)Il est également possible de faire une analyse de la situation.
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): connaître le champ d'action et les limites de l'enregistrement du Codex actuel
