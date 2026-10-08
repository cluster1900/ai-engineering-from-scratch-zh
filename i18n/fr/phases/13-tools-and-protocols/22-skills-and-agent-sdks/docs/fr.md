# Les compétences des agents: transférer des données et des compétences

> La compétence n'est pas seulement un changement de nom de fichier plus efficace. Elle est un ensemble de programmes de découverte contenant des instructions, des ressources et des outils d'assistance exécutables, conformément à la description de l'agent.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## Objectif de l'apprentissage

- 明确定义 Agent Skill,不将其与 prompt、代码库规范文件(référentiel des instructions) 、outil、hook、subbagent ou plugin 混──
- 研讀可移植的 `SKILL.md`契约,并将其与特定运行时专专专扩展清晰解──
- Pour les personnes âgées, la formation est une activité de formation professionnelle.
- En cours de fonctionnement, les compétences seront intégrées au répertoire des compétences de l'agent, et le logiciel sera soumis à une vérification stricte de la situation.
-  Pour des tâches de construction spécifiques, faire un choix technique raisonnable entre les outils mcp, crochet, sous-code ou code ordinaire 

## 10 minutes de première expérience

Avant de lire la description en profondeur, vous allez d'abord terminer cette opération. Vous allez créer une compétence de type micro, installer un programme complet d'examen dans un environnement d'agent hôte, l'utiliser, vérifier les résultats, et le décharger. Cela vous permettra de passer par des résultats observables et de les vérifier personnellement tout au long du cycle de vie.

### En fait, j'ai été choquée.

Le point de contrôle du vrai hôte nécessite Node.js`npx`、Python 3、 un environnement hôte de compétence de support sélectionné, ainsi que des droits d'écriture sur le projet ou le domaine de rôle utilisateur que vous choisissez dans l'installateur.

```bash
node --version
npx --version
python3 --version
```

Avant l'installation, vous devez d'abord déterminer l'hôte et le domaine d'installation que vous voulez utiliser. Si vous manquez de toute dépendance mentionnée ci-dessus, vous pouvez lire ce cours sur le site Web ou effectuer directement les exercices manuels du logiciel ci-dessous.

### 1. From空工作目录开始

Dans le cadre du projet de recherche, il est possible de réaliser:

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

La dernière règle est de ne pas avoir de sortie. Si elle existe, veuillez modifier un répertoire vide afin que cette revue ait une limite nette et claire.

Pour votre première compétence  Créer un catalogue:

```bash
mkdir -p my-first-skill
```

 Création `my-first-skill/SKILL.md`, contenu comme suit:

```markdown
---
name: my-first-skill
description: Turn rough meeting notes into a compact decision record when the user asks to capture a technical decision.
---

# Decision record

Extract the decision, context, alternatives, owner, and next review date.
If the notes do not contain a decision, ask one clarifying question instead
of inventing one.
```

验证该文件是否已成功创建目标目录:

```bash
test -f my-first-skill/SKILL.md
```

无任何输出和退出码为 0 表示文件已经存在──

### 2. Installation complète du kit d'examen

Restez à l' écoute`agent-skills-first-run`Actuellement, il n'y a pas de service:

```bash
npx skills add cluster1900/ai-engineering-from-scratch-zh --skill skill-contract-reviewer --full-depth
```

选择你当前正在使用的代理 宿主和作用域──安装器会列出 `skill-contract-reviewer` et de son écriture `--full-depth`Les compétences fournies par ce cours sont un ensemble de programmes contenant des références, des scénarios et des actifs statiques.

Il va`SKILL_ROOT` définir un mode de transport absolu                                                                                                                                                                                                                                                           `SKILL.md`Le répertoire, plutôt que le répertoire source de cours, n'est pas non plus le répertoire de travail actuel:

```bash
# 将占位符替换为安装器打印出的绝对路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

Si la session de l'hôte est ouverte, veuillez démarrer une nouvelle session ou utiliser les compétences de l'hôte pour refaire un scan. Ne supposez pas que chaque hôte soit chargé de la liste des compétences.

### 3. 显然调用

Dans l'agent installé,`agent-skills-first-run`Pour le catalogue de travail, utilisez le langage explicite supporté par l'hôte:

| 宿主 | 显式调用方式 |
|---|---|
| Codex | 输入 `skill-contract-reviewer`，或从 `/skills` 菜单中选择，然后提交审查请求 |
| Claude Code | 输入 `/skill-contract-reviewer` 紧跟审查请求 |
| 通用可移植回退 | `Use skill-contract-reviewer to review the target package.` |

Dans la demande utilisée imprimée `SKILL_ROOT`et `TARGET_ROOT`绝对路径── exige que l'hôte déploie et montre ses commandes complètement résolues avant l'exécution, plutôt que de dépendre des ordres floues du catalogue de travail actuel:

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

L'ordre de résolution doit être présenté comme suit, sans laisser aucun élément de position non rempli:

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

Les résultats de l'examen réussie doivent satisfaire simultanément aux trois caractéristiques suivantes:

1. 宿主能按名称准确找到 `skill-contract-reviewer`Il y a une autre.
2. 审查器成功读取程序包契约并运行其附带的验证脚本──
3. La réponse de retour contient un rapport de vérification (exemple comprenant des erreurs structurelles) et donne des recommandations fondées sur les éléments de base pour le choix de la structure.

执行证据中还必须明确列出脚本路径、目标路径、当前工作目录(cwd)、精确参数数组(argv)以及退出码──一个缺乏这些段流报告并不能证明附带的配套脚本确实执行了──

Si le propriétaire de l'hôte rapporte que cette compétence est inutile, veuillez vérifier le chemin de l'installation cible, le scan ou le redémarrage d'une fois pour l'hôte, puis réessayez une demande évidente.

### 4. 探查隐式选择(Sélection implicite)

Offrez un nouveau tour d'agent, saisissez la même mission mais**不提及**Nom de la compétence:

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

Si l'hôte montre à l'utilisateur les compétences choisies, il doit enregistrer si elles ont été choisies automatiquement.`skill-contract-reviewer` Si l'hôte ne révèle pas les détails du processus de décision, il sera alors indiqué comme non vérifié

### 5. L'environnement de nettoyage

仅移除已安装的审查器程序包:

```bash
npx skills remove skill-contract-reviewer
```

选择与安装时相同的主机和作用域──在重新扫描或新建会话后,显式请求 `skill-contract-reviewer`Il faut revenir à cette compétence.`my-first-skill` pour l'utilisation de cours ultérieurs, il est également possible de supprimer complètement le répertoire des expériences après avoir terminé l'apprentissage de cette direction.

##  problématique

 présumez que votre équipe dispose d'un ensemble de flux de travail de publication très fiable: trouver les modifications déjà accomplies  inspecter les instructions de migration de la base de données  mettre à jour le changelog  exécuter des ordres de commande et faire des sorties 

Si on met ce flux de travail directement dans un long prompt, bien que facile à copier, mais il y a des lacunes dans le développement de l'ingénierie: ce prompt manque d'identité stable, manque de règles de service, manque de ressources chargées, de bordures de chargement, et ne peut pas répondre à une série de questions de base: qui a le droit de le modifier?

Au contraire, l'erreur extrême consiste à transformer toutes les instructions réutilisables en une compétence entière du cerveau.`SKILL.md`Le répertoire qui en résulte semble avoir une structure commune, en fait, il est profondément lié aux comportements non publiques d'un propriétaire spécifique.

La première tâche de l'ingénierie logicielle est**分类**Avant de décider comment emballer un composant, réfléchissez à ce qu'est le composant.

## 概念

### Les compétences 封装过程性知识 (connaissance procédurale)

L' agent Skill est un`SKILL.md`Pour le dossier d'entrée, le dossier de référence contient les données de base de YAML, et est en phase avec le modèle d'exploitation de Markdown.

```figure
skill-package-anatomy
```

C' est ça .**目录**Le document de marquage unique, et non le seul, est la seule unité minimale du déploiement de paiement étranger.`SKILL.md`Il a laissé tomber le document de référence, même si son texte est parfaitement correct, c'est aussi un programme de défaut.

### 临近概念辨析

| 构件类型 | 核心职责 | 何时加载或运行 | 不应被冒充为 |
|---|---|---|---|
| Prompt | 塑造单次模型交互 | 由应用或用户内联引入 | 包含丰富资源的带版本软件包 |
| 代码库规范（Repository instructions） | 阐明某特定代码库的固有通用准则 | 编码运行时进入该作用域时载入 | 可复用的具体任务工作流 |
| Agent Skill | 提供可复用的过程性知识 | 显式或隐式激活时载入 | 强安全隔离边界 |
| MCP Tool | 暴露类型化的远程能力 | 由模型或应用程序主动发起调用时 | 复杂详细的端到端操作步骤 |
| Hook（钩子） | 在特定事件发生时执行确定性逻辑 | 当所声明的事件发生时触发 | 具有概率性的模型自主路由 |
| Subagent（子代理） | 委托具有独立上下文和状态的任务 | 由编排器创建或调用时启动 | 静态的只读指令包 |
| Plugin（插件） | 分发更大规模的运行时功能扩展 | 宿主安装或启用它时生效 | 可移植的 skill 契约本身 |
| 习得的 Skill 库（Learned skill library） | 存储通过实践探索习得的行为沉淀 | 策略检索到先验程序或轨迹时 | 基于规范标准的 `SKILL.md` 软件包 |

 édition de compétences  guider l'agent  comment examiner la publication  MCP serveur  exposer le centre d'inscription  Hook  interdiction de l'écriture  codes    Subagent  independent review candidate version      Les composants 之所以能够有机组组合, c'est parce qu'ils respectent leurs différentes limites de responsabilités 

### Skill                                                                                                                                                                                                                                                             

Dans le domaine de la recherche scientifique, les compétences sont parfois définies par des codes de processus apprises, des traces d'interaction réussis ou des stratégies ciblées sur un environnement spécifique.

L'agent Skill dans cette série de cours est nettement différent. Il s'agit d'un logiciel de programmation manuellement écrit ou sélectionné, avec une déclaration claire de fichier système de contrat, de l'enregistrement des compétences et des données, de la divulgation progressive, du mécanisme de rédaction guidé par la mise en œuvre, ainsi que des droits d'outil strictement contrôlés par l'hôte. Il peut être généré ou modifié par l'agent, mais son format lui-même ne s'appuie pas sur des exercices de force chimique ou d'exploration.

| 评估维度 | Agent Skill 软件包 | 习得的 Skill 库 |
|---|---|---|
| 基本单元 | 包含 `SKILL.md` 的目录 | 程序代码、策略片段、交互轨迹或记忆记录 |
| 创建方式 | 人工编写、生成或精选策划 | 通常由 agent 在环境交互中自主探索习得 |
| 选用机制 | 依赖目录描述（Description）加运行时策略 | 基于任务状态的向量检索或策略匹配 |
| 执行方式 | 模型遵循 Markdown 指令并调用宿主工具 | 环境直接执行存储的行为逻辑或代码产物 |
| 可移植性 | 程序包契约可在所有兼容的宿主间流通 | 通常与特定环境及特定的动作空间深度绑定 |
| 评测标准 | 路由准确率、制品质量、安全及宿主兼容性 | 强化学习奖励值、任务成功率、泛化能力及库规模 |

Ces deux concepts sont tous deux en mesure de se répliquer, mais ne se réalisent pas uniquement parce qu'ils ont le même nom.

### Règlement de base

Les compétences des agents 规范在前面中强制要求两个必填字段:

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name`Il doit être conforme à la norme et être entièrement conforme au nom du parent.`description`Il s'agit à la fois d'un document donné à l'homme, et d'un modèle pour effectuer des routes linguistiques.**能做什么**et ainsi de suite**何时应当选用它**Il y a une autre.

Les critères de base de la procédure sont les suivants:

| 字段 | 用途 | 可移植性说明 |
|---|---|---|
| `license` | 声明该程序包的开源或商用许可条款 | 核心标准规范 |
| `compatibility` | 声明环境要求（如 Python 3.10+、特定 CLI 工具等） | 核心标准规范 |
| `metadata` | 携带字符串键值的自定义扩展数据 | 核心标准规范 |
| `allowed-tools` | 建议预先批准的工具列表 | 实验性特性；不同宿主支持度不一 |

Markdown est une méthode de gestion des ressources. Elle doit définir clairement le flux de travail, les stratégies de traitement des défaillances et les approches relatives des documents de ressources.

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### 运行时扩展(Extensions de fonctionnement) est le deuxième niveau

部分主管允许在前材料中写额外字段或关联特定配置文件──这些字段在特定平台上非常有用,但它们不属于通用可移植标准──

| 行为特性 | 宿主扩展示例 | 属于通用核心规范？ |
|---|---|:---:|
| 对模型自主路由隐藏，但保留用户手动直接调用 | `disable-model-invocation` | 否 |
| 对用户的命令菜单隐藏，但允许模型自主路由选用 | `user-invocable` | 否 |
| 在斜杠命令菜单中展示参数使用提示 | `argument-hint` | 否 |
| 在被委托的隔离子上下文中运行该 skill | `context`, `agent` | 否 |
| 固定模型型号或思考计算等级（Reasoning Effort） | `model`, `effort` | 否 |
| 注册生命周期自动化钩子 | `hooks` | 否 |
| 在 Codex 中禁用隐式调用 | `agents/openai.yaml` 策略 | 否 |

应视每项专利扩展为外接适配器――assurer que même lorsque ces segments sont déconnectés, le flux de travail central reste légitimement disponible; écrire des documents de dégradation et de retour pour eux, et effectuer des tests ciblés sur leur hôte, en les consommant réellement―― un domaine de propriété inconnu peut être directement ignoré, refusé ou simplement conservé comme d'habitude sans exécuter aucun acte réel lorsqu'il est utilisé.

### La première matière est exécutable

Avant que les données soient lues par le modèle, le système changeait déjà son comportement de fonctionnement:

- 格式错误的 `name`L'échec du service sera directement causé.
- 含糊不清的 `description`Ça va conduire à une erreur.
- Le seul indicateur de qualification artificielle exclurait cette compétence du répertoire des compétences disponibles du modèle.
- 工具预授权配置会改变宿主是否弹出用户授权确认框──
- La mise en place du comité de direction sera ensuite exécutée à nouveau en direction d'un sous-agent indépendant.

Il est nécessaire de revoir le frontmatter de manière aussi rigoureuse que les documents de config et le code d'entreprise. Il est nécessaire de le contrôler en mode statique, de le contrôler en version et de le faire intégrer dans le système d'évaluation Eval.

### Cycle de vie de la compétence

```figure
skill-runtime-lifecycle
```

Chaque flèche dans le tableau représente une frontière avec un mode de défaite indépendant:

1. **服务发现（Discovery）：**Enregistreur de données à l'aide de l'application
2. **静态校验（Validation）：**Avant que le dossier ne soit exposé, il est nécessaire de bloquer fermement les procédures de format erroné ou non sécurisé.
3. **编目索引（Cataloging）：**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `name`Avec `description`, Absolument tout est chargé.
4. **决策选择（Selection）：**Il est possible de déterminer par un modèle ou une instruction explicite si cette compétence est liée à une tâche actuelle.
5. **按需激活（Activation）：**Il va`SKILL.md`L'article complet est inséré dans le texte ci-dessus.
6. **渐进披露（Disclosure）：**≈ seulement dans des étapes spécifiques vraiment nécessaires, ≈ seulement lire les références ou les actifs ≈
7. **执行推进（Execution）：**Dans le cadre de la réglementation relative aux droits de l'hôte et à la réglementation relative à l'isolement des boîtes, il est nécessaire de mettre en œuvre toutes sortes d'outils de l'hôte.
8. **结果核验（Verification）：**独立于模型的自述表态,客观核验最终产品质量──

混这些阶段会导致错误的思维模型: la compétence découverte n'est pas égale à celle qui a été activée; la compétence activée n'est pas égale à celle qui a obtenu tous les droits d'exploitation qu'elle décrit; la simple utilisation d'un outil est laissée en place n'est pas égale au résultat final de l'entreprise est correct.

### Les compétences et les outils

Le MCP résoud: Quelles capacités externes les applications actuelles peuvent utiliser, quel est leur schéma de paramètres?

```figure
skill-tool-orthogonality
```

La compétence peut être mentionnée dans le texte comme le nom d'un outil, mais les droits d'enregistrement et de référencement des outils sont entièrement attribués à l'exploitation de l'hôte. Si l'outil est manquant dans l'environnement de fonctionnement, la compétence doit fournir une description de dégradation ou une explication directe de l'erreur, il ne faut pas se tromper de penser que l'outil est mentionné dans le texte comme étant un outil créé à vide.

### Les compétences et les code-books

代码库说明文件(如 `AGENTS.md`) pour décrire**当前所处**Environnement: construire des commandes, coder des styles, générer des règles de fichier et des lignes de sécurité.

Lorsque les deux sont utilisés simultanément, les instructions instantanées de l'utilisateur et les règles existantes de la base de code actuelle ont une priorité plus élevée et forment un lien vers les compétences. Par exemple, une compétence de reconstruction commune ne peut absolument pas être supérieure à la base de code locale.

### Les compétences 之间不进行代码级 Importer

Une compétence peut être utilisée en langage officiel pour utiliser une autre compétence, mais ce n'est pas un code de programmation.`import` La deuxième compétence à utiliser est encore nécessaire pour la découverte complète de l'expérience de fonctionnement du service, de l'entrée en examen des qualifications, de l'activation des activités, de l'examen des compétences et de la gestion indépendante des ressources humaines.

Lorsqu'on écrive des compétences, elles doivent être décrites comme des étapes de travail observables:

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

Cette façon d'exprimer permet de tester clairement les relations de dépendance et donne à l'hôte la possibilité d'exécuter des stratégies de conformité lors de son fonctionnement.

## 动手构建

`code/main.py` réaliser un testateur standard et un sélecteur de composants de qualité légère. Le processus entier dépend uniquement de Python standard library, assurant une transparence totale de chaque règle.

验证器对外暴露:

- `parse_frontmatter(text)`Il est clair que les données sont différentes de celles de Markdown.
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`: strictement éprouvées, obligatoires, nomenclature, non déclaré, extension, existence et limite de longueur de transfert
- `ValidationIssue`Avec `SkillReport`Le rapport de la Commission sur les résultats de l'enquête a été publié en décembre.
- `FrontmatterSyntaxError`: pour les langues illégales qui ne peuvent être résolues en toute sécurité

选型器对外曝光 `TaskShape`Avec `select_primitives(task)` Il est basé sur les caractéristiques réelles de la tâche, le faire bien cartographier en ordinar code ̊ code description ̊ skill ̊ hook ̊ subagent ou MCP tool ̊

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Le bloc de commande doit être cloné en local, et peut être activé à partir de tout répertoire dans cet entrepôt, afin de`git rev-parse --show-toplevel`解析代码库根路径──

运输见到 JSON 格式打印一个合规的纯移植能力"",一个包含主机扩展的技能"",一个非法程序包,以及多任务特征的选项决策结果――仔细观察输出问题代码――一个优秀的软件包验证器应明确指出如何修改产品,而不是替代作者胡乱猜测――

### 验证顺序至关重要

Avant d'exécuter des règles de contenu de niveau profond, il est essentiel de vérifier les caractéristiques structurelles de la distribution inférieure:

```figure
skill-validation-order
```

En suivant ce strict ordre, il est possible d'éviter efficacement les erreurs de mise en cache de la classe supérieure du système qui a été détruit au départ.

## Utilisez-le

Avant d'écrire une nouvelle compétence, veuillez bien remplir cette carte de décision:

| 决策问题 | 若答案为“是” | 最匹配的基本构件 |
|---|---|---|
| 该任务是否需要在多个步骤中反复运用模型的主观判断？ | 操作流程基本固定，但具体决策千变万化 | Skill |
| 该操作是否必须在特定事件发生时 100% 强制触发？ | 哪怕遗漏一次执行也是完全不可接受的故障 | Hook 或常规业务代码 |
| 模型是否需要调用具有类型化输入的外部能力？ | 该操作本身存在于模型的思维上下文之外 | Tool 或 MCP Server |
| 该工作是否需要完全隔离的上下文、独立状态或责任归属？ | 由独立的执行单元完成工作并仅返回受限结果 | Subagent |
| 该指南是否仅适用于当前这一个特定的代码库？ | 描述的是本地开发命令、目录规范与约束边界 | 代码库说明（如 AGENTS.md） |
| 单次简短的即时交互是否就足以解决问题？ | 无需任何版本化和包生命周期的管理维护 | Prompt |

De nombreux processus de production complexes sont souvent constitués de plusieurs composants. Cette décision peut empêcher le développeur de s'enfoncer dans une zone d'erreur structurelle où toutes les fonctions sont intégrées à un seul composant.

## Je le livre.

Le cours est en cours`outputs/`Le dossier est livré.`skill-contract-reviewer`Il contient:

- Une partie transplantable`SKILL.md`, pour le contrôle des compétences à évaluer;
- pour les normes et les types de composants de base à transporter;
- Un éditorial de l'écriture de la série
- 覆盖 prompt、skill、tool、hook、普通代码和 subagent 的全量任务特征测试具(Assets)

Installez l'ensemble du matériel, pas seulement son dossier d'entrée:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

 cours d'installation de script de production de chaque phase 13 de la compétence,并生成 `/tmp/aiefs-skills/manifest.json`◊ Le répertoire d'installation de ce produit est utilisé pour la vérification de la structure du paquet; tandis que l'expérience initiale de 10 minutes précédente a permis de vérifier la découverte et l'exécution des services dans l'environnement du véritable hôte.

Les cours suivants seront progressivement approfondis à chaque étape du cycle de vie: 24e cours d'approche de la découverte et de la divulgation progressive des services; 25e cours d'approfondissement des stratégies et des routes de signification; 26e cours de démêlage strict des limites de contrôle et de l'isolement des boîtes; 27e cours de préparation de l'ensemble du processus à travers des évaluations évaluables et des produits disponibles à la distribution.

## 课后深练习

1. Utilisation `TaskShape`Pour chaque catégorie de travail, il est possible d'écrire un argument technique de sélection de plusieurs composants.
2. 编写边界测试用例:证明刚好 500 个字符的 `compatibility`Le code peut être bien adopté, et la valeur de 501 caractères est considérée comme une interception d'erreur de précision au-delà de la norme.
3. En lisant la liste blanche, un nouveau projet est mis en œuvre et est élaboré pour démontrer que le document est reconnu avec succès et qu'il est toujours capable de se distinguer clairement des compétences purement transférables.
4. Une grande et simple machine à écrire à 400 pages`SKILL.md`、 un dossier de référence spécial (reference) 、 un contrat d'interaction, ainsi qu'un modèle de production et de sortie de produits.
5. Pour certains citant l'outil MCP inutilisé dans l'environnement actuel, les compétences de conception de la réduction de la réaction sont déterminées à ne pas permettre à l'ombre de le remplacer par d'autres outils plus larges en termes de pouvoir.
6. 审查 une compétence existante, qui sera chaque phrase de chaque catégorie: intention de route, procédures d'exploitation, stratégies de sécurité, indices de référence ou accords de format de sortie ;

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|---|---|---|
| Agent Skill | "保存好的 Prompt 模板" | 包含过程性操作指南与可选资源的标准化、可发现文件目录 |
| 可移植核心（Portable Core） | "所有运行时共享的通用字段" | 由 Agent Skills 官方规范所定义的基础契约标准 |
| 运行时扩展（Runtime Extension） | "额外的 Frontmatter 字段" | 平台特定的专有配置，其行为生效需要对应宿主适配器的支持 |
| 激活（Activation） | "Skill 跑起来了" | Skill 的正文指令被完整载入模型可见的上下文，后续执行可能滞后发生 |
| Skill 依赖（Skill Dependency） | "Import 另一个 Skill" | 由运行时负责调度的调用关联步骤，受到环境可用性与权限策略的严密审查 |
| Tool 契约（Tool Contract） | "函数 Schema 声明" | 为某项外部能力所定义的输入、输出、权限、副作用、错误码以及审计证据规范 |

## 延伸阅读

- [Agent Skills 规范官方文档](https://agentskills.io/specification)- 权威的可移植目录与前面材料 契约标准──
- [Agent Skills 最佳实践指南](https://agentskills.io/skill-creation/best-practices)- 作用域界定、指令撰写及资源编排的最佳范式──
- [OpenAI: 构建 Skills 开发者指南](https://learn.chatgpt.com/docs/build-skills)- une connaissance approfondie des pratiques de recherche et de réadaptation des services dans le cadre du Codex
- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)- couvrant le mécanisme de mise en œuvre de la plateforme, les paramètres de suggestion, les outils de pré-autorisation et la mise en œuvre complète de la mise en œuvre de la mise en œuvre de la présente loi,
