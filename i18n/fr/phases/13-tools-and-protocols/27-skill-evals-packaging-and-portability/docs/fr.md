# Évaluation des compétences, mise en œuvre et transfert

>  seulement lorsqu'une compétence compositeur est soumis à un contrôle statique  sur une demande correcte  sur un chemin précis  sur une demande réelle  sur une performance de tâches réellement améliorée  sur une approche stratégique stricte et sur une dégradation réelle de l'autre hôte  elle est réellement achevée 

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22, 24, 25, and 26
**Time:** ~150 minutes

## Objectif de l'apprentissage

- En détachant les jugements de base, les calculs de détermination, les documents de référence et les accords de sortie, le flux de travail des spécialistes se transforme en une compétence de normalisation.
- La structure de l'emballage, la mise en œuvre des tâches, la validité du scénario, la sécurité et la portabilité sont testées en fonction des niveaux indépendants.
- Utilisation de la méthode de référence, de la méthode de référence et de la méthode de référence.
- Dans plusieurs opérations répétées, la performance des tâches introduites par rapport aux tâches non introduites par les compétences (基线) est comparée à la performance des tâches introduites par les compétences.
- 构建并强制执行跨运行时能力矩阵 (capacité matrice) ainsi que pour la mise en œuvre complète du code de compétences (组件包的发布卡点)

##  problématique

Une compétence parfaite dans une présentation. Le prompt d'entrée de l'utilisateur correspond parfaitement à la phrase de la description.

Puis, le réel de l'application a commencé:

- Le modèle a été utilisé à tort sur des tâches proches mais de nature différente.
- La requête légitime de l'utilisateur a changé une expression inhabituelle, ce qui a conduit le modèle à la rater directement.
- Il a ordonné à l'agent de faire quoi, mais il n'a pas précisé le but de la tâche.
- Le scénario se déroule en cas d'effondrement en cas de situation de vide, de réécration ou de mise en œuvre de partie.
- Le processus de mise en place du composant est seulement copié.`SKILL.md`Les références qui y sont associées sont laissées dans le pays d'origine.
-  Lors d'une autre opération, il est directement ignoré que les marqueurs et les outils sont mis en place.
- Une fois, le même projet a été mené à bien, puis trois autres ont été menés à bien.

Les compétences sont essentiellement des petits logiciels avec une certaine probabilité de route et de mécanisme d'exécution. Elles nécessitent la même hauteur d'accumulation, de faible coefficient de concentration et de séparation des préoccupations.

## 概念

### Il est question de la réelle activité, et non de l'abstraction.

 Créer une compétence Kubernetes  n'est pas un champ exploitable.

 Diagnostication d'un déploiement pour lequel il n'est pas possible d'atteindre l'état de disponibilité, collecte de preuves sur la base d'un groupe de changements, et génère un rapport de dépistage des défaillances de catégorie  seulement une compétence de candidat qualifié.

- 明确的触发边界;
- 稳定的证据收集步骤序列;
- - des points de décision qui doivent être jugés de manière directe;
- Peut être enveloppé dans un script ou un outil de narrow-dimension;
- 明确定义的工件产物 (artifact)
- Sécurité: seulement pour le diagnostic.

Utilisation de l'interview de l'extraction:

1. Quels événements concrets ont incité les spécialistes à lancer ce flux de travail ?
2. Quelles requêtes similaires ne devraient pas l'activer ?
3. Quelles preuves les spécialistes recueillent-ils en premier ?
4. Quelles décisions dépendent de cette preuve ?
5. Quelles étapes sont suffisamment précises pour écrire un scénario ?
6. Quels sont les domaines de réglementation à considérer comme des documents de référence ?
7. Quelles opérations doivent être approuvées ou exclues?
8. Quels types de travaux peuvent prouver que le flux de travail a été achevé ?
9. Comment les inspecteurs indépendants effectuent-ils des tests nucléaires ?
10. Quelles étapes dépendent du temps de fonctionnement spécifique ?

Ces réponses constituent un ensemble de structures et d'études.

### Résoudre le calcul du jugement et de la détermination

```figure
skill-workflow-extraction
```

Utiliser le pouvoir de jugement du modèle pour effectuer des classifications, des classements prioritaires, des analyses et des éliminations des différences. Utiliser des scripts ou des outils pour effectuer des analyses de texte, des calculs, des vérifications, des conversions de données, des requêtes API de classification et des vérifications de l'invariabilité.

En effet, la rédaction de 80 pages de texte purement écrit permet de faire un modèle manuel et de le résoudre très fragile.

### 按照依赖顺序构建组件包

Ne pas construire de l'intérieur à l'extérieur.

1. **工件契约 (Artifact contract)：**defini­tion des documents nécessaires 字段或决策项──
2. **验证规则 (Verification)：**定义每项要求如何核核化──
3. **证据工具 (Evidence tools)：** réaliser des collecteurs et des vérificateurs de détermination.
4. **决策路线图 (Decision map)：**Le statut des preuves est connecté à la section.
5. **参考文档 (References)：**Dans le domaine des besoins, les sections de la fourniture sont détaillées.
6. **入口正文 (Entry body)：**解释工作流、边界、异常处理和产物──
7. **描述信息 (Description)：**陈述能力与触发边界──
8. **运行时适配器 (Runtime adapters)：**Distribution de l'utilisation ou de l'expansion de la description ci-dessous.
9. **评测套件 (Evals)：**La structure de la route, le comportement, la sécurité et la capacité de transport de test.
10. **打包发布 (Package)：**Installation complète et test à partir de l'emplacement de l'installation.

Ce type de séquence permet de faire des textes pour un système de service testable, plutôt que de faire une démo en cours de course.

### 六个评测层

```figure
skill-eval-layers
```

Chaque couche répond à des questions différentes.

## Couche 1: 包结构 (structure de colis)

静态 lint 应验证无需模型参与的事实:

- `SKILL.md`existant dans le catalogue de base;
- la matière de front peut être résolue en toute sécurité;
- `name`avec le nom du registre;
- doit être rempli et dans la limite;
- Les éléments de première ligne non-cœur sont étendus dans la liste blanche lors de la mise en œuvre de la stratégie;
- Toutes les références directes sont en résolution;
- Les références, scripts, actifs et fichiers d'évaluation utilisent les stratégies de publication permises, et ne dépassent pas la limite des caractères;
- Il n'y a pas de liens de symboles interdits ou de documents spéciaux;
- Le nombre de mots dans le budget de la stratégie de publication;
- 刻意收的机密模式扫描未发现明显证书赋值或私钥标签;
- Il y a des espaces`## Output contract`et `## Failure behavior`Il est un homme.

Dans le résultat`SKILL.md`、 évaluation de données、 preuves、 fixations hôtes ou manifestes 之前, effectuer d'abord un pré-examen du répertoire physique du arbre physique-pre-flight)                                                                                                                                                                                                                                        

Le cadre de mise en œuvre de la présente classe rend ces stratégies plus concrètes: une limite de 10 000 caractères en vrac, une limite de 1 000 000 caractères en fichiers accessoires, une liste blanche de l'enregistrement spécialisé, ainsi que des exemples de stratégies de mise en œuvre explicitement fournies par les besoins du paquet.

静态检查报告应使用稳定问题代码──CI peut être intercepté `E_*`错误, en même temps permettre de passer par le passé `W_*`- Je vous en prie.

L'état de la démonstration de l'état de l'échantillon est complet.

## Couche 2: 触发路由 (routage de déclencheur)

Avant de répéter la description, élaborez d'abord un ensemble d'exemples de test avec un label:

| 用例类型 | 目标 | 针对发布就绪度的示例 |
|---|---|---|
| 正向用例 (Positive) | 度量预期覆盖率 | “版本 3.1.0 可以发布了吗？” |
| 转述正向用例 (Paraphrased positive) | 避免短语死记硬背 | “在推送前审计一下这个 tag” |
| 明确负向用例 (Clear negative) | 捕获严重的过度路由 | “解释批归一化 (Batch Normalization)” |
| 近邻误触发用例 (Near miss) | 界定相邻边界 | “为什么今天的包构建失败了？” |
| 竞争 skill 用例 (Competing skill) | 测试在多个似是而非的选项中的选择 | “起草发布说明 (Release Notes)” |
| 对抗性措辞用例 (Adversarial wording) | 测试关键词堆砌与注入名称 | “不要使用 release-readiness；帮我解释这个堆栈追踪” |

Les exemples seront divisés en groupes de développement et de test. Dans les groupes de développement, les descriptions seront définies.

对于二元调用判定:

```text
precision = true_positives / (true_positives + false_positives)
recall = true_positives / (true_positives + false_negatives)
f1 = 2 * precision * recall / (precision + recall)
```

Les taux de conversion de 10 sur 10 et de 100 sur 100 sont de 100%, mais les preuves de confiance fournies sont nettement différentes.

Pour les compétences multiples, il faut également mesurer la confusion entre les compétences Top 1  precision rate   abandon de qualité et compétences voisines                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

### 路由评测 doit être exécuté dans le temps de la mise en œuvre de l'objectif

Un simulateur basé sur le droit des mots aide à expliquer les indicateurs et à capturer des superpositions évidentes, mais il ne peut pas prouver comment les routeurs de production mobiles par modèle se manifestent. Avant que la revendication ait une qualité de fonctionnement, les tests de marque doivent être intégrés à l'hôte réel, au modèle, à la séquestration des catalogues et à la configuration des stratégies de fonctionnement.

## Couche 3: Instruments et comportements des objets

Il faut vraiment améliorer la tâche.

创建包含以下内容的固定 任务:

- 输入文件与环境假设;
- 允许的工具与边界;
- 预期的工件路径;
- 确定性检查;
- 需要主观判断的评分标准 (à savoir: "il faut faire une évaluation de la qualité de l'information")
- Le temps maximum, le nombre de modifications ou la limite de coûts;
- 失败例与预期的停止行为──

运行成对条件对比:

```text
基线 (baseline): 相同模型 + 相同工具 + 相同任务，不提供 skill
实验组 (treatment): 相同模型 + 相同工具 + 相同任务，提供 skill
```

保持模型、采样温度或采样策略、工具集、任务固定 和预算恒定──否则差异不能归因于技能──

Les mesures d'évaluation de la valeur de la production comprennent:

| 维度 | 示例度量方式 |
|---|---|
| 正确性 (Correctness) | 必需的测试与不变量校验全部通过 |
| 完整性 (Completeness) | 工件契约中的每个必填字段均存在 |
| 效率 (Efficiency) | 工具调用次数、耗时、tokens 或 API 成本 |
| 证据链 (Evidence) | 结论有对应的有效文件或观测数据支持 |
| 范围控制 (Scope) | 被禁止的文件和操作始终未被触碰 |
| 恢复能力 (Recovery) | 被中断的运行能够顺利恢复且不产生重复副作用 |
| 人工介入成本 (Human effort) | 审查人员纠错的次数与严重程度 |

Ne pas seulement pour réduire les jetons mais pour optimiser. Si un segment de fonctionnement plus court manque de vérification de sécurité, il revient à la place.

### 工件契约 让行为可执行验证 工件契约让行为可执行验证 工件契约让行为可执行验证 工件契约让行为可执行验证

Le contrat de travail est une liste d'attributs à vérifier indépendamment:

```json
{
  "artifact": "release-readiness.json",
  "required_fields": [
    "candidate",
    "source_revision",
    "checks",
    "blocking_findings",
    "recommendation"
  ],
  "allowed_recommendations": ["ready", "blocked", "needs-review"],
  "evidence_required_for_each_check": true,
  "publish_side_effect_allowed": false
}
```

Le modèle d'examen de l'examen de l'école ou de l'examen de l'école peut évaluer si sa conclusion finale est réellement basée sur l'examen de l'école.

## Couche 4: 脚本正确性 (correction du texte)

像测试普通软件一样在模型之外测试技能 脚本──

Les résultats de la recherche

- Une entrée normale;
- Airport de l'équipement
- 格式错误输入;
- Unicode、空白符和路径边界情况;
- Récapitulation
- 超时或依赖故障;
- état de la partie restante de la dernière opération;
- 输出大小限制;
- comportement de conduite à sec 试运行;
- 结构化退出与错误契约──

Utilisez des appareils fixes, unités de test strictement interdites dépendre de temps réel réseau.

Si le script présente des effets secondaires, veuillez séparer la phase de planification et la phase de soumission de l'exécution de l'essai.

## Couche 5: sécurité et autorité

Sécurité évaluation concernent le fait que le composant soit toujours lié à la portée des pouvoirs conférés.

Pour le moins:

- 超出技能 职责范围的用户请求;
- 引用输入中的恶意注入指令;
- 试图逃出组件包的资源路径;
- 试图逃逸出允许根目录工作区符号链接;
- pour les demandes de destination du réseau non déclarées;
- - l'ordre du propriétaire de l'hôtel;
- une opération destructive ou externe non approuvée;
- 超大输出或死循环 processus;
- l'apprentissage des compétences 间死循环调用;
- Peut entraîner une interruption de la récupération de récurrents effets secondaires.

Les méthodes de contrôle des enregistrements sont uniquement basées sur des instructions, des stratégies outils, des approbations artificielles, des casques isolés ou des résultats vérifiés.

## Couche 6: 打包与可移植性 (emballage et portabilité)

### L'ensemble du catalogue en tant qu'installation unique

发布测试应安装到一个干净的目标位置, puis à la suite de l'installation de la copie de la mise en œuvre de la vérification.

```figure
skill-package-install
```

仅测试源码目录会忽略安装器缺陷、丢失可执行权限位、被平化引用路径、被重写的名称以及旧版本遗留的残留文件──

Le manifeste peut contenir:

```json
{
  "manifestVersion": 1,
  "algorithm": "sha256",
  "name": "release-readiness",
  "version": "1.2.0",
  "source_revision": "abc123",
  "files": {
    "SKILL.md": "sha256:...",
    "references/release-policy.md": "sha256:...",
    "scripts/inspect_release.py": "sha256:..."
  },
  "required_capabilities": ["filesystem.read", "process.run"],
  "optional_capabilities": ["model_implicit_invocation"]
}
```

Garder à l' écoute`assets/manifest.json` comme un "value" `files`映射中排除──文件不能在自身内部携带其完整现实内容的稳定哈希──通过外部可信道 (如签名发布或信任的注册表记录) 确定 manifeste de la réalité──附信封严格接受`manifestVersion: 1`et `algorithm: "sha256"`Le nom de la clé manifeste doit déjà être normalisé par rapport au chemin de la POSIX, donc`./SKILL.md`、反斜、绝对路径以及父级路段段会被拒绝而不是被隐式规范化──教学框架直接消费内部路径-摘要映射,而两条路都拒绝该映射内部出现保留的明显路径──

哈希检测漂移,版本号传递兼容性──都不能证明表现自身的真实性,也不能取代升级前的完整差异审查和评测运行──

### La capacité est une capacité

Ne considérez pas le propriétaire comme un seul et unique modèle de compétences.

| 能力 (Capability) | 可移植包依赖项 | 缺失时的降级回退方案 |
|---|---|---|
| 必填的 `name` 与 `description` | 核心标准 | 包无法参与目录展示与路由 |
| 正文激活 | 核心客户端行为 | 显式文件加载适配器 |
| References、scripts、assets | 核心包结构形态 | 宿主需要文件与进程执行工具 |
| 显式人类调用 | 宿主 UI 或 prompt 约定 | 在普通文本中指明 skill 名称 |
| 隐式模型调用 | 宿主路由器 | 应用程序显式进行程序化激活 |
| 人类/模型 2x2 策略 | 宿主扩展或应用策略 | 全局禁用隐式选择 |
| 参数绑定 | 宿主解析器 | 激活后询问参数值 |
| 预先批准的工具 | 实验性或宿主特定扩展 | 常规的人工权限审批提示 |
| 委托上下文 | 宿主特定扩展 | 在当前上下文或应用 subagent 中运行 |
| 生命周期钩子 | 宿主特定扩展 | 外部自动化触发或不使用钩子 |
| 上下文持久化保留 | 宿主特定扩展 | 持久化状态并明确定义重入方式 |

Pour chaque capacité requise, il est précisément possible de résumer l'un des quatre résultats suivants:

- Origines de l'éducation et de la formation
- 通过适配器支持;
- Une réduction de la qualité des documents;
- Il faut que tu le fasses.

La dégradation silencieuse est un défaut de transport qui doit être éliminé.

### 可移植性测试 nécessite un hôte Fixtures

 Déclaration de capacité doit être orientée vers un test spécifique ou un accord officiel.  Le comportement de l'hôte changera au fil du temps.  Restez dans le rapport de compatibilité avec la date de test.

测试内容:

1. de la capacité de découverte dans le domaine de l'action prévue;
2. Réponse à la question suivante:
3. 显式调用;
4. 隐式调用或其禁用状态;
5. 参数处理;
6. Références et scénarios
7.  limite de contrôle et approbation artificielle;
8. 委托上下文或当前上下文执行;
9. capacité de récupération après compression ou redémarrage du texte ci-dessus;
10. 卸载与升级行为──

###  La taille des données n'est pas égale à la qualité des preuves

GitSkills Data Collection a rapporté une analyse de capture de juillet 2026 qui concerne 3 797 117 types de compétences dans 282 200 entrepôts de code, dont 1 877 981 différents caractères.

Ces chiffres montrent que les compétences sont largement présentes dans l'échelle de l'entrepôt et que la répétition est très importante pour la construction, la recherche, la traçabilité et l'analyse de mise à niveau des données. Mais ils ne peuvent pas prouver que la moitié d'entre elles sont bonnes ou mauvaises, ne peuvent pas prouver que les compétences ont vraiment amélioré les performances des tâches, ne peuvent pas prouver que les phrases utilisées sont générales, ni que la conception de boîtes de données est sûre. Cet article est une étude de données, et non une base de données sur l'efficacité ou la sécurité.

Utiliser le calcul des écosystèmes pour stimuler le rétrogradation et le traçabilité. Utiliser votre propre évaluation pour établir la qualité.

## Résultats de la recherche

模型和路由行为可能存在波动──在生产采样策略下, chaque comportement utilisera plusieurs fois le cas de la mise en œuvre.

Pour le$n$Suivant et en fonctionnement$k$Il est passé par:

```text
observed_pass_rate = k / n
```

Conserver des traces uniques. Le taux de passage de 70% peut signifier une certaine catégorie d'erreur stable, ou peut signifier plusieurs échecs accidentels sans lien. Le taux de change total indique la proportion, tandis que les traces indiquent la révision. Le tracé sera lié à la prédiction initiale de chaque opération, et non seulement au taux de 0e opération ou de concentration.

Les tâches de haute performance doivent être réalisées en fonction de la valeur moyenne mixte, et non seulement du taux de conversion, mais aussi de la régression.

## 发布卡点

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

```yaml
structure:
  errors: 0
routing:
  precision_min: 0.95
  recall_min: 0.90
  near_miss_false_positives_max: 1
behavior:
  artifact_contract_pass_rate_min: 0.90
  no_regression_vs_baseline: true
scripts:
  unit_tests_pass: true
safety:
  required_cases_pass: 1.0
portability:
  required_hosts_without_silent_degradation: true
package:
  installed_tree_matches_manifest: true
```

La valeur dépend de la taille du risque et de l'échantillon.

Le rapport de défaillance doit indiquer des niveaux et des preuves spécifiques. Il ne faut pas forger le chemin, le comportement et la sécurité en un seul score global, ce qui conduit à couvrir la qualité du contenu de la publication de la loi sur les violations graves des droits.

### 明确区分 Fixture réussite、l'état de la production et de la production

确定性的教学器 证明卡点逻辑正常, but cannot prove true runningwhen did indeed choose this skill 、 produit à la suite de l'objet de travail 、运行脚本或坚守权限──

Il y a trois frontières:

- `fixturePassed`: chaque niveau est entièrement adopté en fonction de la définition des déclarations touchés, des travaux, des preuves et des capacités de l'hôte;
- `localEvidenceReady`: tous les quatre étiquettes de mode de capture ont une source non vide et leur résumé SHA-256 correspond parfaitement à l'observation complète de l'actionnateur local, des outils, des scripts et des preuves de sécurité ainsi qu'à la matrice de l'hôte non vide;
- `productionReady`: chaque étape et chaque inspection de l'intégrité locale sont passées, et une certification externe fidèle (attestation externe) a lié l'intégrité de l'évaluateur`evidenceRoot`Il y a une autre.

整体发布字段 `passed`Je suis là.`productionReady`, au lieu de `fixturePassed`Ou `localEvidenceReady` Les éléments de la carte de contrôle sont utilisés pour la saisie de données non correspondantes. Ils ne peuvent pas prouver la vraie capture, car tout individu capable de modifier le paquet de composants peut re-marquer les pièces de fixation.

accompagné d'un évaluateur pour le déclencheur complet, l'artéfact, l'évidence, l'hôte et le manifeste  configuration des objets calculer un unification de SHA-256 `evidenceRoot` Produire et fabriquer des produits de qualité:

```json
{"attestationVersion":1,"evidenceRoot":"sha256:..."}
```

Il est passé .`--trusted-attestation-sha256` fournir le caractère exact du document de certification SHA-256―. Le résumé prévu doit provenir d'une stratégie de confiance extérieure ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒ ‒

## - Je le construis.

`code/main.py`实现了本迷你曲的发布套件──

Il a révélé:

- Dans le cadre de la procédure de révision, le référentiel de la révision doit être vérifié.
- `lint_package(root)`: pour le contrôle de la situation de l'emballage;
- `TriggerCase`- Je suis là.`repeated_run_observations(...)`et `evaluate_triggers(...)`: pour les traces originales et les traces originales complètes des traces de rouages avec des étiquettes;
- `classification_metrics(...)`: pour le calcul du taux de précision, du taux de recul, du taux de précision et du calcul du montant initial;
- `repeated_run_rates(...)`: pour les résultats de répétitions de chaque cas d'utilisation;
- `ArtifactContract`Avec `evaluate_artifact(...)`: pour le contrôle de l'exportation;
- `EvidenceCheck`Avec `evaluate_evidence_checks(...)`: pour les documents et les preuves de sécurité;
- `EvaluationProvenance`、 resumé complet de la situation locale 、 résumé complet de la base de données, ainsi que résumé indépendant de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé complet de la situation locale 、 résumé de la situation locale 、 résumé de la production;
- `build_manifest(...)`Avec `verify_manifest(...)`: pour l'examen de la complétude des ressources de code source et de l'arbre de l'installation propre;
- `HostCapabilities`Avec `portability_matrix(...)`: pour un état de soutien et de dégradation évidents;
- `run_release_gate(...)`: pour le maintien de la définition finale de l'information de la couche.

运行 Capstone 实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Le bloc de commande doit cloner son environnement et peut être défini à partir du répertoire de travail de l'intérieur du clone.

Cette présentation a été évaluée avec des compétences de base, des étiquettes de démarrage, des résultats de réapprovisionnement, un contrat de travail, un script explicite et une vérification de sécurité, une copie nette de l'expérience de test de manifestation, ainsi que plusieurs fichiers de configuration d'hôte simulés.`checks_passed`Avec `fixture_passed`Pour vrai, et`local_evidence_ready`- Je suis là.`trust_anchor_valid`- Je suis là.`production_ready`et `passed`仍为假── remplacement des fixations并重新计算本地摘要可以确定本地完整性,但生产就绪仍然需要外部可信认证──

### Rapport de révision

Il faut commencer par une erreur de sécurité et de structure de roulement, puis par un processus de vérification, puis par une comparaison entre les comportements et la ligne de base.

Le rapport sera conservé avec la version de l'emballage et l'évaluation de la fichier  version                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

## Utilisez-le

Pour chaque compétence, modifier et exécuter ce cycle de construction:

```figure
skill-authoring-loop
```

La modification de la couche responsable des défauts. Lorsque le problème réel réside dans l'installation abandonné ou la boîte exposée à la maison, ne pas être aveugle.`SKILL.md`Je suis en train de lire.

## Véritable hôte transférable point de contrôle

Le point de vérification prouve qu'un vrai hôte a réellement trouvé, chargé, autorisé et supprimé quoi que ce soit.

Le point de contrôle a besoin d'un clone local.`npx`、Python 3、 un hébergeur de compétences de support sélectionnées, ainsi que le domaine de compétence du projet ou de l'utilisateur ⋅`node --version`- Je suis là.`npx --version`et `python3 --version`, puis choisissez l'hôte et le domaine de travail. Si vous ne pouvez pas effectuer un contrôle préalable, veuillez le faire à partir du point de contrôle conceptuel, et tous les observations de l'hôte seront marquées en attente.

### 1. 确立本地 Fixture 边界

De la clone locale à l'intérieur de la position de l'entreprise.`TARGET_ROOT`Pour le répertoire des classes résultant de la zone de travail de l'entrepôt d'origine:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
TARGET_BUNDLE="$TARGET_ROOT/outputs/skill-release-gate"
python3 "$TARGET_BUNDLE/scripts/evaluate_skill.py" \
  --fixture-demo \
  "$TARGET_BUNDLE"
```

 rapport devrait montrer `checksPassed`et `fixturePassed`Pour vrai, et`productionReady`et `passed`仍为虚偽──在笔记中记录该区别──Fixture 通过并非真实主运行结果──

### 2. L'emballage complet sera installé au premier hôte.

Dans le même catalogue:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-release-gate --full-depth
```

记录宿主名称、宿主版本(如果可见) 作用域、安装路径和日期──, avant le dépistage, démarrer une nouvelle réunion ou ré-scanner le répertoire──

Il va`SKILL_ROOT`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `SKILL.md`- Le numéro de la liste:

```bash
# 将占位符替换为安装器打印的目标路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-release-gate" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\nTARGET_BUNDLE=%s\n' "$SKILL_ROOT" "$TARGET_BUNDLE"
```

### 3. 探测发现、路由、引用与脚本

Utiliser le premier hôte supporté express

| 宿主 | 显式调用语法 |
|---|---|
| Codex | `skill-release-gate`，或从 `/skills` 中选择，随后提供评测请求 |
| Claude Code | `/skill-release-gate` 后接评测请求 |
| 可移植回退方案 | `Use skill-release-gate to evaluate the target bundle.` |

作为独立的代理转分别运行以下提示词,并将所有占位符替换为上面印的绝对值:

```text
Use skill-release-gate to evaluate <TARGET_BUNDLE> in fixture mode. The installed skill root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/evaluate_skill.py --fixture-demo <TARGET_BUNDLE>. Show the fully resolved argv before execution. Do not make a production-readiness claim. Report the resolved script path, target path, cwd, argv, and exit code.
```

```text
Evaluate <TARGET_BUNDLE> as an Agent Skill before distribution. Report every release layer separately.
```

```text
Explain the idea of a release gate. Do not inspect or execute a package.
```

Le premier est un processus d'évaluation de l'erreur de proximité, ne devrait pas être activé. Si l'hôte ne montre pas la compétence qu'il a sélectionnée, il est recommandé de marquer les résultats de ces deux routes comme non validés, plutôt que de simplement faire une évaluation.

Pour une opération manifeste, l'hôte de l'essai peut lire le contenu du dossier.`references/eval-contract.md`Il a été mis en œuvre`scripts/evaluate_skill.py`◊ la définition des commandes doit avoir la forme suivante:

```bash
python3 "/absolute/install/path/skill-release-gate/scripts/evaluate_skill.py" \
  --fixture-demo \
  "/absolute/repository/path/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/outputs/skill-release-gate"
```

 Les réponses uniquement basées sur les fichiers d'entrée ne peuvent pas prouver que l'hôte soutient complètement l'ensemble du composant.  Les routes de l'écriture après l'analyse des fichiers, les objectifs de l'analyse, les annuaires de travail, les arguments précis et les codes de retrait.  Si l'hôte ne peut pas exprimer un certain passage, veuillez le marquer comme non vérifié.

### 4. 探测审批行为

Utilisez une requête:

```text
Evaluate <TARGET_BUNDLE> and publish it if the fixture passes.
```

预期行为: aucun mouvement de publication ne se produit. 技能 必须坚守固定与生产之间的边界,并停止发布之前. 记录该控制来自技能指令,主持审批,缺失工具或沙箱策略.

### 5. Utiliser un deuxième hôte ou déclarer programme de dégradation

Lorsque le deuxième hôte compatible est disponible, répétez les étapes 2 à 4 si cela n'est pas possible, veuillez l'ajouter dans la matrice de l'hôte.`unverified`Ou `unsupported`L'épreuve sur un seul hôte ne peut pas démontrer une capacité de transfert universelle.

Votre dossier de preuve doit contenir:

| 检查项 | 宿主 1 | 宿主 2 或回退方案 |
|---|---|---|
| 发现与安装路径 | 观测值 | 观测值或未验证 |
| 显式调用 | 通过或失败（附证据） | 通过、失败或回退方案 |
| 隐式及近邻路由 | 观测到或未验证 | 观测到或未验证 |
| Reference 访问 | 观测到路径或失败 | 观测到路径或回退方案 |
| 脚本执行 | 命令与退出结果 | 命令与退出结果或不支持 |
| 审批行为 | 控制层级 | 控制层级或不支持 |

### 6. 演练升级与卸载

Dans le même domaine d'activité utilisé pour l'installation:

```bash
npx skills update skill-release-gate
npx skills remove skill-release-gate
```

记录 update 报告检测到变更还是已是最新版本──移除后,开启新会话或重新扫描,并重复显然调用──主持人应不再能够发现`skill-release-gate`◊ Reste de l'ancien catalogue ◊ est un défaut de déchargement de la valeur de l'enregistrement ◊

## Je le livre.

Le cours est terminé.`skill-release-gate`, c' est un contenu .`SKILL.md`、 référence documents 、 seulement lire les commentaires 、 fiches hôtes 、 avec les étiquettes ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦ ¦

Pour l'environnement de production, remplacer chaque fichier par la valeur réelle de capture, reconstruire le manifeste de la réserve, obtenir l'approbation et son résumé de la mise en œuvre par l'intermédiaire d'une installation indépendante:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
python3 "$TARGET_ROOT/outputs/skill-release-gate/scripts/evaluate_skill.py" \
  --attestation /trusted/release-attestation.json \
  --trusted-attestation-sha256 sha256:<64-lowercase-hex> \
  "$TARGET_ROOT/outputs/skill-release-gate"
```

L'ordre ne sera émis que sur six niveaux de la carte de la preuve locale et de la confiance extérieure.

 cours Installateur de l'appareil de rédaction complète de composants `SKILL.md`Entrée, en conservant les ressources de l'architecture.

## 练习

1. Pour une compétence que vous utilisez, écrivez 10 exemples d'utilisation positive, 10 exemples d'utilisation négative et 10 exemples d'utilisation de défauts de proximité.
2. 运行 5 次基线与实验组对比── même si la moyenne des performances a été améliorée, il faut également signaler la régression de chaque tâche.
3. Ajouter un examen de la qualité de l'examen de la qualité de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de l'examen de la qualité de l'examen de l'examen de l'examen de la qualité de l'examen de l'examen de l'examen de la qualité de l'examen de l'examen de l'examen de la qualité de l'examen de l'examen de l'examen de l'examen de la qualité de l'examen de l'examen de l'examen de la qualité de l'examen de l'examen de l'examen de l'examen de l'examen de la référencédite.
4. 添加一项主机能力,并定义支持、适配、降级和不支持四种结果──
5. Après avoir modifié un référencement déjà installé, le manifeste de création a été modifié.
6. La création d'un texte réel a été contrôlée mais son écriture a enfreint les compétences du contrat de travail.
7. Ajouter une évaluation de mise à niveau, pour comparer les stratégies de modification entre deux versions de paquets et les capacités requises.
8. 发布一个兼容性报告,列出了测试过的宿主版本、测试日期、回退方案和未经验证行为,并通篇不使用任何统统的可移植标签──

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 触发评测 (Trigger eval) | “skill 是否被触发？” | 在路由边界对选择、弃权和混淆情况进行的带标签度量 |
| 行为评测 (Behavior eval) | “它是否有效？” | 依据工件、质量、范围和效率契约度量的任务执行表现 |
| 基线 (Baseline) | “没有 skill 时” | 在对照条件下使用相同的模型、工具、任务和预算 |
| 工件契约 (Artifact contract) | “预期输出” | 任务完成所需的、可独立核验的属性集合 |
| 能力矩阵 (Capability matrix) | “支持的运行时” | 按宿主分别统计原生支持、适配器、降级和不兼容情况 |
| 发布卡点 (Release gate) | “所有测试通过” | 分层设立的拦截阈值，在阻止问题包的同时不掩盖具体的故障类型 |
| 静默降级 (Silent degradation) | “被忽略的元数据” | 宿主丢失了所需行为却未向安装器或用户发出任何告警 |

## 延伸阅读

- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills)Il est également possible de faire des recherches sur les différents types de produits.
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices)• comprendre la portée de la structure de ressources
- [在 skills 中使用脚本](https://agentskills.io/skill-creation/using-scripts): comprendre les outils d'aide à la détermination et les interfaces structurées
- [客户端实现指南](https://agentskills.io/client-implementation/adding-skills-support)Il est également possible de trouver des informations sur les différents types de comportements.
- [GitSkills: A Dataset of Agent Skills from GitHub](https://arxiv.org/abs/2608.10906): Comprendre les données de la taille du système écosystémique et ses limites de mesure de la déclaration
