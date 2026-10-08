# Capstone 09  Code Agent de migration (repo 级语言 / runtime 升级)

> Amazon's MigrationBench(Java 8 à 17) et Google's App Engine Py2-to-Py3 migrateur  définissent des normes de 2026 ⋅ Moderne's OpenRewrite ⋅ peut exécuter des résolutions de certitude AST dans des scènes à grande échelle ⋅ Grit en utilisant le style de code DSL ⋅ résoudre le même type de problèmes ⋅ Modèle de production combinera les deux: utiliser la base de certitude pour effectuer une réécriture sécurisée, reutiliser l'agent ⋅ traitement de couche ⋅ confusion ⋅ scène, utiliser la sandbox pour construire des branches, et utiliser le harnais de test ⋅ en PR ⋅ ouvrir le résultat de la première course verte ⋅ Le but de la capstone est de migrer 50 ⋅ réellement, et de publier le taux de passage avec un système de fracas ⋅ class ⋅

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

##  problématique
Les données de base sont les données de base de la base de données de l'application. Les données de base sont les données de base de la base de données de la base de données.

Vous allez construire un agent, il reçoit un Java 8 repo (ou Python 2 repo), et produit une branche déménagée de green-CI. Vous allez mesurer le taux de réussite, la préservation de la couverture de test, le coût de chaque repo, et construire un système de classification défavorable.

## 概念
Le pipeline a deux niveaux.**deterministic substrate**(Java avec OpenRewrite, Python avec libcst) effectuer en toute sécurité une grande quantité de machines à réécrire: importations, signatures de méthode, modifications sans sécurité, essais avec des ressources, remplacements d'API dépréciés, et la rapidité et la différence de contrôle sont produites.**agent layer**(OpenAI Agents SDK ou LangGraph, basé sur Claude Opus 4.7 et GPT-5.4-Codex) traitement des recettes 无法覆盖的情况:build-file upgrades(Maven/Gradle/pyproject) ]]

Chaque repo obtient un pré-installation objectif de l'exécution de Daytona sandbox──agent 代执行:运行构建分类失败、应用修正、重新运行──硬性限制: chaque repo 30 分钟、每个 repo $8、20 个代理转──如果所有测试 通过且覆盖率 delta 不为负,就打开PR──如果没有通过,就把该 repo 按失败类归档并附上证据──

失败分类体系是交付物品. Dans 50 repo, qu'est-ce qui est mal? Depositions transitives? Annotations personnalisées? Construire une version d'outil?

## 架构
```
target repo
      |
      v
OpenRewrite / libcst deterministic recipes
   (safe, fast, auditable, ~70-80% of fixes)
      |
      v
Daytona sandbox per branch
      |
      v
agent loop (Claude Opus 4.7 / GPT-5.4-Codex):
   - run build -> capture failures
   - classify failures (build, test, lint)
   - apply fix (patch or retry recipe)
   - rerun
   - budget: 30 min, $8, 20 turns
      |
      v
test + coverage delta gate
      |
      v (passed)
open PR
      |
      v (failed)
file under failure class + attach repro
```

## 技术
- 确定性底座: OpenRewrite (Java) ou libcst (Python)
- Agents OpenAI SDK ou Claude Opus 4.7 + GPT-5.4-Codex
- Sandbox: décontainers Daytona par branche, temps d'exécution cible préinstallé (Java 17 / Python 3.12)
- Systèmes de construction: Maven, Gradle, uv (Python)
- Benchmarks: Amazon MigrationBench 50 répo sous-ensemble(Java 8 à 17),Google App Engine Py2-to-Py3 repos
- Harness de test: coureur parallèle, via Jacoco (Java) ou couverture.py (Python) 统计覆盖
- Observabilité: Langfuse + chaque repo un paquet de traces, contenant chaque pièce différente
- Tableau de bord: tableau de bord de la taxonomie de défaillance, contenant chaque classe de calcul et différences exemplaires


```figure
ce-migration-funnel
```

## - Je le construis.
1. **Recipe pass.**Avant de commencer à écrire, ou libcst, les recettes de Python, capturez 70 à 80% des machines déplacées, comme "recipe" de l'écriture, soumettez.

2. **Build trial.**Si vous êtes en train de passer, sautez aux tests.

3. **Agent loop.**Utilisation avec des outils LangGraph:`run_build`- Je suis là.`read_file`- Je suis là.`edit_file`- Je suis là.`run_test`- Je suis là.`git_diff`◊ agent 分类 échec ((deep、syntax、test、build-tool),并应用定向修正──重新运行──

4. **Budget caps.**Chaque repo 30 minutes de temps, 8 $, 20 agents se retournent. Toutes les limites sont arrêtées, et sont classées dans le "budget_exhausted".

5. **Test + coverage gate.**Si la couverture dépasse 2%, le dossier est "couverture_régrésion" (en anglais: "coverage_regression").

6. **PR open.**Après succès, poussez, ouvrez les relations publiques, complétez les différences, ainsi que les recettes appliquées, les engagements de l'agent.

7. **Failure taxonomy.**Pour chaque répo raté, marquez une catégorie:`dep_upgrade_required`- Je suis là.`build_tool_drift`- Je suis là.`custom_annotation`- Je suis là.`test_flake`- Je suis là.`syntax_edge_case`- Je suis là.`budget_exhausted`❖ Construire un tableau de bord

8. **50-repo run.**Dans le sous-ensemble de MigrationBench 上执行── rapport sur le taux de réussite par classe, le coût par rapport au rapport, la conservation de la couverture,并与只有确定性基线对比──

## Utilisez-le
```
$ migrate legacy-java-service --target java17
[recipe]   27 rewrites applied (JUnit 4->5, HashMap initializer, try-with-resources)
[build]    FAIL: cannot find symbol sun.misc.BASE64Encoder
[agent]    turn 1 classify: removed_jdk_api
[agent]    turn 2 apply: sun.misc.BASE64Encoder -> java.util.Base64
[build]    OK
[tests]    412/412 passing; coverage 84.1% -> 84.3%
[pr]       opened #1841  cost=$3.20  turns=4
```

## Je le livre.
`outputs/skill-migration-agent.md`Il est livré à un repo, il exécute d'abord des recettes déterministes, puis il exploite un boucle d'agent, pour produire une branche de repo transférée, ou il le regroupe dans une classe de taxonomie.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## 练习
1. Il suffit d'utiliser OpenRewrite (avec un agent) pour effectuer le passage du pipeline.

2. 实现一个"lint-clean"check:迁移后,运行风格linter(Java 用无,Python 用 ruff)。如果出现新的 lint errors,则让PR 失败。衡量覆盖-preserved-but-style-regressed rate。

3. 添加一个"minimal-diff"optimiser:agent's分支通过测试 后, using second pass 剪剪不必要的变化――报告差尺度减少――

4. 扩展到第三种迁移:Node 18到Node 22──复用沙盒 包装;把食谱层 换成自定义代码模式──

5. Pour mesurer la valeur de l'utilisation de la technologie, le temps de construction verte (TTFGB) est utilisé comme mesure UX.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Deterministic substrate | "Recipe engine" | OpenRewrite / libcst：带安全保证的声明式 AST rewrites |
| Codemod | "Code-modifying program" | 一条以机械方式修改 source code 的 rewrite rule |
| Build drift | "Tool version skew" | Maven / Gradle / uv 在 major versions 之间的细微行为变化 |
| Failure class | "Taxonomy bucket" | repo 未能迁移的带标签原因：dep、syntax、test、build-tool、budget |
| Coverage delta | "Coverage preservation" | 从 base 到 migrated branch 的 test coverage % 变化 |
| Agent turn | "Tool-call round" | agent loop 中的一次 plan -> act -> observe cycle |
| Budget exhaustion | "Hit the ceiling" | repo 消耗完 30-min / $8 / 20-turn 限制但仍未通过 |

## 延伸阅读
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) Index de référence de l'autorité de l'État en 2026
- [Moderne.io OpenRewrite platform](https://www.moderne.io) substrat déterministe 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) recette 编写
- [Grit.io](https://www.grit.io) 替代代代代码模式 DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) Agents SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代 migration référence
- [libcst](https://github.com/Instagram/LibCST) Substrate déterministe de Python
- [Daytona sandboxes](https://daytona.io) Sandbox par branche 参考
