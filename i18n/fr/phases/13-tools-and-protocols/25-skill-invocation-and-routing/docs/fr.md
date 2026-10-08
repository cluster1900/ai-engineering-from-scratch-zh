# Apprendre à utiliser et à utiliser

> 调用(Invocation) est un processus de décision de priorité après la prise de décision de la relation. Une bonne description aide le modèle à faire le choix.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## Objectif de l'apprentissage

- 区分显式用户调用 (explicite invocation de l'utilisateur) 隐式模型调用 (implicite model invocation) 应用程序调用 (applications invocation)
- La visibilité humaine et la qualification du modèle
- 编写包含正向触发条件和近邻误触发边界 (near-miss boundaries) 编写包含正向触发条件和近邻误触发边界 (near-miss boundaries) 编写包含正向触发条件和近邻误触发边界 (near-miss boundaries) 编写包含正向触发条件和近邻误触发边界) 编写包含正向触发条件和近邻误触发边界 (near-miss boundaries) 编写路由描述
- Dans le cadre de la formation, le personnel de la formation doit être informé de la manière dont il est possible de suivre les résultats de l'étude.
- 适配特定运行时调用字段, tout en évitant de les utiliser comme matière première portable 规范字段

##  problématique

Tu as installé un.`database-migration`Les utilisateurs peuvent le faire en utilisant un nom, mais le modèle voit également sa description et demande à quelqu'un de le choisir.

Tu as ajouté`user-invocable: false`, espérant empêcher l'utilisateur manuellement de le faire fonctionner. Mais pendant une autre fonctionnement, ce passage a été directement ignoré.`disable-model-invocation: true`L'expérience est en train de disparaître, mais pendant la mise en œuvre de ce segment, l'utilisateur peut encore l'utiliser explicitement.

字段名称本身没有错. 错在概念模型──用户可以看到它、模型可以选择它、应用程序可以预装它以及它的内部工具可以执行是完全独立的事实──一个名字.`invocable`La valeur d'une seule valeur ne peut pas exprimer ces dimensions complexes.

路由还存在第二种失败模式――如果描述过模糊,多技能都会显得似而非――如果描述堆了大量关键词,无关键任务也会触发它们――目录本质上是一个概率接口:

## 概念

### Il y a cinq façons de commencer le cycle de vie.

| 主体 (Actor) | 调用形式 | 典型用途 | 主要风险 |
|---|---|---|---|
| 人类用户 (Human user) | 在 UI 或 prompt 中指明 skill 名称 | 刻意选择特定工作流 | 用户期望获得宿主并未授予的可用性或权限 |
| 模型或自主 Agent (Model or autonomous agent) | 根据任务上下文从目录条目中自主选择 | 自动触发专家流程 | 假阳性误路由（False-positive routing） |
| 应用程序 (Application) | 通过运行时代码激活或预加载 skill | 固定的产品工作流 | 对特定 host 产生隐式耦合 |
| 另一个 Skill 或 Subagent | 请求将特定 skill 作为工作流依赖 | 组合（Composition） | 循环调用、依赖缺失或上下文泄露 |
| 评测运行套件 (Evaluation harness) | 在固定测试场景下激活指定 skill | 可重复度量 | 在测试该 skill 的同时意外绕过了正在研究的生产策略 |

Les compétences des agents peuvent être portées. La norme définit le paquet de composants. Il n'y a pas de norme générale de l'interface utilisateur.

### 调用五个阶段

```figure
skill-invocation-stages
```

精准使用这些词汇:

- **Eligible（合格）**Le rôle de l'acteur est de demander cette compétence.
- **Selected（已选中）**: utilisateur direct nom, ou le routeur déterminer sa relation.
- **Activated（已激活）**Leur ordre est entré dans le travail.
- **Executing（执行中）**L'agent commence à faire des modèles ou à utiliser des outils sous la direction de ces instructions.
- **Completed（已完成）**Le projet a été lancé par le gouvernement de la République de Moldova.

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `skill_used=true`Les traces de la mort sont en train de couvrir les limites de la phase de décès.

### 人工与模型调用 composition 2x2 矩阵

| 人类可调用 | 模型可调用 | 模式 | 适用示例 |
|:---:|:---:|---|---|
| 是 | 是 | 共享 (Shared) | 代码解释、测试规划、文档审查 |
| 是 | 否 | 仅人类 (Human-only) | 发布准备、计费数据导出、破坏性清理方案 |
| 否 | 是 | 仅模型 (Model-only) | 内部风格指南、领域参考、自动化支持流程 |
| 否 | 否 | 禁用或仅应用 (Disabled or application-only) | 分阶段发布、已废弃包、程序化预加载 |

La matrice est un modèle stratégique, et non un YAML standard.

某当前宿主使用 `disable-model-invocation: true`Prononcer seulement "human"`user-invocable: false`Indiquer que le modèle est utilisé.`agents/openai.yaml`Le centre`allow_implicit_invocation: false`Pour conserver une utilisation évidente, il faut aussi mettre en place des adaptateurs de temps de fonctionnement.

Les détails sont très importants:`user-invocable: false`Cela ne signifie pas que le modèle ne peut pas utiliser cette compétence. Dans sa définition de l'hôte, il ne fait que déplacer l'entrée de l'utilisateur direct.`disable-model-invocation: true`Cela ne signifie pas non plus que cette compétence a été interdite. Elle a simplement supprimé le choix autonome du modèle, tout en conservant le droit d'accès explicite de l'utilisateur.

### L'utilisation est clairement prioritaire

显式调用直接提供身份标识:

```text
/release-readiness v2.4.0
```

Ou bien:

```text
release-readiness check v2.4.0 without publishing
```

Les documents précédents du Codex interfaces ont été enregistrés pour la sélection.`/skills`Et dans la demande, l'utilisation directe de la compétence pure pour effectuer une modification évidente.`/skill-name`Les règles de référence et les évolutions de variables sont attribuées à l'accomplissement de l'hôte.

La demande est encore à faire en application de la stratégie de test.

### 隐式调用是描述优先的

Pour les routes de la compétence, le modèle voit d'abord le répertoire des données et non le texte réel.

薄弱的描述: faible

```yaml
description: Helps with releases.
```

宽泛无度的描述:

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

界界清晰的描述(Réglementé):

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

界界清晰的版本 contient:

1. **能力（Capability）：**检查已准备好的候选版本──
2. **输出（Output）：**Il y a aussi des rapports.
3. **正向边界（Positive boundary）：**询问发布产物是否准备就绪──
4. **负向边界（Negative boundary）：**La construction et le développement de fonctionnalités habituelles ne sont pas dans le cadre de ce processus.

Lorsque deux compétences de voisinage sont communes, les négatives vers la frontière sont particulièrement utiles.

### 路由是 avec des choix d'absence

Pour les compétences$s$和 requête $x$On peut imaginer un routeur.

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

具体打分可能由LLM 判定而非算术──工程原则仍然成立: sélection doit dépasser值并压过竞争的技能──当证据不足时,主动弃权(abstinence)──

```figure
skill-routing-abstention
```

Pour les compétences de haute influence, même une description écrite de nouveau peut ne pas être adaptée.

### La qualification doit être préalable à la répartition

Ne donnez pas à chaque compétence découverte une part de la compétence, choisissez la plus adaptée et vérifiez la stratégie de cette compétence. Si la meilleure correspondance est bloquée par la stratégie, vous risquez de vous tromper en empêchant de considérer les candidats qui ont été qualifiés mais qui ont obtenu des scores légèrement inférieurs.

隐式路由应采用以下顺序:

1.  compétences découvertes en fonction du sujet de la demande et de l'hôte actuellement actif 
2.                                                                                                                                                                                                                                                               
3. Si le plus haut score de qualification correspond à la règle de la valeur et du différentiel, il est choisi.
4. Lorsque aucun candidat n'a obtenu un score de qualification ou de qualification, il est abandonné.

假设 `incident-triage`Vous avez raison .`0.80`, mais son hôte a interdit l'expansion de la mode.`incident-review`Vous avez raison .`0.55`且允许模型调用──路由器应将 `incident-review` comme meilleur candidat qualifié à évaluer`incident-triage`Je ne veux pas de toi.

Ce type d'exécution peut également empêcher la stratégie de changer et de modifier le sens du score de la correspondance en soi.

### 路由评测 nécessite des erreurs de proximité

À titre d'exemple, le taux de réaction (recalculation):

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

明确负向使用例证明基本精确率( précision):

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Précédent: Prédent: Précédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Prédent: Pr

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

Les cas de proximité et les compétences de diffusion`package`et `build`La qualité de l'évaluation est une qualité de l'évaluation de la qualité de l'utilisation.

### 参数具有三种表示形式

调用参数 dans le processus de transition à travers plusieurs frontières:

```figure
skill-argument-boundaries
```

Dans chaque bord, gardez à l'esprit le texte en tant que code exécuté:

- L'hôte résolveur decide ordonnance
- Les compétences selon les règles du propriétaire de l'hôtel
- Les paramètres et la valeur par défaut sont nécessaires à l'épreuve des instructions.
- 工具调用将值转换为类型化方案 并重新校验──

Ne pas mettre les paramètres originaux directement dans la shell 命令中。 prioriser le mode de réception des paramètres 组 (argument vecteur) du script ou du type de MCP 工具。

###  applications sont clairement conçues

produit peut directement activer une compétence, car son flux de travail a déjà prédit le type de tâche .`pull-request-risk-review`Il y a une autre.

Cela a éliminé l'incertitude du routeur, mais l'API a été dépendante au moment de son fonctionnement.

```figure
skill-host-adapter
```

Ainsi, lorsqu'il est ouvert dans d'autres clients compatibles, il reste clair et facile à comprendre.

### La compétence est une forme de manipulation

 supposer que lorsque la dépendance des documents se produit,`release-readiness`需要请求 `security-change-review`Il y a une autre.

调用方应提供:

- Identification de l'objectif de compétence;
- Les tâches et les processus de construction sont définis en fonction des limites;
- 预期的响应契约;
- 调用原因;
- Retour à l'emploi;
- Règles de contrôle de la profondeur maximale ou de la circulation.

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

La deuxième compétence n'est pas directement liée à la première. Le propriétaire décide de comment l'activer, de la partager sur le bas de page, de la faire fonctionner dans le processus de la fourchette indépendante ou de la rendre par l'outil.

### Le cycle de vie dépend du propriétaire .

 Après activation, la compétence officielle peut être conservée dans le dialogue  pendant la compression de la phrase ci-dessus, ou dans la mise en œuvre de la phrase ci-dessous  sur le mandat. Les droits d'outil ne peuvent durer qu'un seul tour, tandis que les instructions durent plus longtemps. Le subagent peut recevoir cette compétence, mais ne contient pas l'histoire complète de l'agent.

Ne pas écrire en fonction de l'hypothèse de cycle de vie caché.

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

## - Je le construis.

`code/main.py`La stratégie et le cheminement seront mis en œuvre en tant qu'adaptateur indépendant.

Les données incluent:

- `Actor`: pour les humains, les modèles, les agents autonomes, les applications, les compétences et les systèmes d'évaluation;
- `SkillMetadata`: pour le routeur d'identification;
- `InvocationPolicy`: pour les humains/modèles matrices;
- `InvocationRequest`Avec `InvocationDecision`: pour les informations et les résultats des décisions à tracer;
- `CorePolicyAdapter`: pour le comportement portable de l'expansion sans hôte;
- `ExtensionPolicyAdapter`: pour identifier les opérations en temps de référence;
- `build_invocation_matrix(policy)`: pour générer des images 2x2;
- `route_request(skills, request, adapter)`Pour être utilisé dans la sélection et le rejet avant de passer par la qualification.

运行实验:

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

La présentation imprime une matrice, ainsi que des résultats de décision sur des sujets de référencement humains, de modèles invisibles, d'agents autonomes, d'applications, de combinaisons de compétences et d'études. Les résultats de son adaptateur d'expansion montrent comment les correspondances maximales de mots bloquées par la stratégie sont éliminées avant le classement des séries de séries de séries de qualifications. Elle contient également une liste blanche de noms précises. La présentation ne nécessite pas d'API de modèle. L'existence de routeurs de détermination vise à rendre les limites de stratégie faciles à vérifier, et non à déclarer que la correspondance des mots est un comportement de routage du modèle de production réelle.

### Pourquoi la stratégie centrale et l'adaptateur de développement doivent être séparés

Si un résolveur donne aveuglément un sens particulier à chaque élément de la première partie de l'observation, il sera alors utilisé pour définir un standard général de fausse adaptation.

`CorePolicyAdapter`Utiliser uniquement des stratégies explicitement fournies par les applications`ExtensionPolicyAdapter`则识别明确一组主持人字段,并记录下究竟是哪个字段改变了决策的.

## Utilisez-le

Dans le cadre de la procédure de réception, le contrat d'invocation est rédigé:

```yaml
actors:
  human: allow
  model: deny
  application: allow
  skill: deny
explicit_name: release-readiness
arguments:
  candidate: required
  publish: fixed_false
ambiguity: ask_user
missing_dependency: stop
context:
  durable_state: artifacts/release-readiness.json
  max_composition_depth: 2
```

Le contrat est un document de conception pour l'utilisation de l'adaptateur et du test.`SKILL.md`Le premier élément de la question

## Je le livre.

Le cours est terminé.`skill-invocation-router`组件包──il contient une référence de modèle de modification, une stratégie d'hôte d'exemple, ainsi qu'un outil de CLI non exécuté── cet outil peut évaluer une requête de ensemble de systèmes humains, de modèles, d'agents autonomes, d'applications, de compétences ou d'évaluations, et retourner à la décision JSON contenant des méthodes, des adaptateurs, des scores et des causes──

Le CLI de requête unique est un outil de détection stratégique, et non un ensemble d'évaluation de la réaction complète.

## 练习

1. 创建人类/模型矩阵的全部四行,并为每一行编写一个合法的实际使用场景――
2. Pour`CorePolicyAdapter` Ajouter uniquement des fonctionnalités activées de l'application                                                                                                                                                                                                                                                       
3. Pour un déploiement de compétences, écrivez 10 cas d'erreur de travail de proximité.
4. Dans les deux routes les plus élevées, la différence entre les deux points est augmentée.`ask`Il y a une autre.
5. Pour une compétence 间 request ajouter la plus grande limitation de profondeur de composition,并能检测出由两个 compétence 构成的死亡循环──
6. Utilisation de l'adaptateur central et de l'adaptateur de développement fonctionnent les mêmes ensembles de tests de marque.

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 显式调用 (Explicit invocation) | “斜杠命令” | 调用方直接提供 skill 身份标识，受策略约束 |
| 隐式调用 (Implicit invocation) | “模型自主选择” | 路由器根据任务上下文从合格的目录元数据中自主选择 |
| 用户可调用 (User-invocable) | “人类可以使用” | 特定于宿主的菜单或直接调用属性，而非核心标准字段 |
| 模型可调用 (Model-invocable) | “agent 可以使用” | 在宿主策略下具备隐式模型选择资格 |
| 调用适配器 (Invocation adapter) | “frontmatter 解析器” | 将宿主字段和 API 映射到已声明策略模型的代码 |
| 近邻误触发用例 (Near miss) | “困难负例” | 与 skill 预期输入高度相似但不应触发该 skill 的请求 |
| 弃权 (Abstention) | “未选中任何 skill” | 在缺乏足够证据或存在歧义时刻意做出的路由结果 |

## 延伸阅读

- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)Les résultats de la recherche ont été analysés en profondeur.
- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills): comprendre le design de l'évaluation et de la production
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): Comprendre le contrôle de la rédaction du Codex
- [Claude Code skills](https://code.claude.com/docs/en/skills): connaître les hôtes spécifiques `user-invocable`- Je suis là.`disable-model-invocation`、 les paramètres de transmission ainsi que le mécanisme de mise en œuvre des données suivantes:
