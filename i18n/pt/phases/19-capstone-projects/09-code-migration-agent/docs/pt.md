# Capstone 09  Code Migration Agent ((Repo 级语言 / Runtime 升级)

> O MigrationBench da Amazon ((Java 8 a 17) e o MigrationMigrationPy2 toPy3 do Google estabeleceram os padrões de 2026: A OpenRewrite da Amazon pode executar determinação em grande escala. O modelo de produção combina as duas coisas: reescrever com base em determinação, reutilizar a situação de confusão de nível de agente, construir em sandbox, e usar o arsenal de teste para abrir o repo PR.

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 问题
Masselha código migração é um dos agentes de codificação de 2026 anos. A verdade é muito clara. A suíte de teste de migração é aprovada?), os benefícios são reais. A frota de Java-8 é necessária para um investimento de mão-de-obra.

Você vai construir um agente, ele recebe um repo Java 8 (((ou Python 2 repo), e produz um verde-CI já mudou-se brancheiro. Você vai medir a taxa de passagem, testes-preservação de cobertura, custo de cada repo, e construir um sistema de classificação fracassado. Comparativamente com a linha de base determinista apenas, vai dizer-lhe o valor real do agente está em onde.

## 概念
O oleoduto tem dois níveis.**deterministic substrate**(Java us OpenRewrite, Python us libcst) segurança executar um grande número de máquinas reescrever: importações, assinaturas de método, edições de segurança nula, tentativa de recursos, substituição de API depreciadas.**agent layer**(OpenAI Agents SDK ou LangGraph, baseado no Claude Opus 4.7 e GPT-5.4-Codex) processar receitas 无法覆盖的情况:build-file upgrades(Maven/Gradle/pyproject) 过渡性依存性冲突、测试片、定制注释──

Cada repo recebe uma pré-construção de um objetivo de execução Daytona sandbox. Agente 代执行:运行构建分类失败,应用修正,重新运行.

失败分类体系是交付物品. Em 50 repo, que mal aconteceu? Depositivos transitivos? Anotativas personalizadas?Construir versão de ferramenta? Flascas de teste sem relação com migração? Cada classe precisa ter conta e exemplar diferença.

## Arquitetura
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
- Agente: OpenAI Agents SDK ou Claude Opus 4.7 + GPT-5.4-Codex 上的 LangGraph
- Sandbox: Daytona devcontainers por ramo, pré-instalado tempo de execução de destino (Java 17 / Python 3.12)
- Sistemas de construção: Maven, Gradle, uv (Python)
- Benchmarks: Amazon MigrationBench 50-repo subconjunto(Java 8 a 17),Google App Engine Py2-to-Py3 repos
- Arnes de teste: corredor paralelo, através de Jacoco (Java) ou cobertura.py (Python) 统计覆盖
- Observabilidade: Langfuse + Cada repo, um pacote de rastreamento, contendo cada peça diferente
- Painel de controle: painel de taxação de falhas, contendo diferenças de cálculo e exemplares de cada classe


```figure
ce-migration-funnel
```

## Construí-lo
1. **Recipe pass.**先运行 OpenRewrite(Java) ou libcst(Python) receitas── capturar 70-80% das máquinas de mudança── como "receita" cometer 提交──

2. **Build trial.**Daytona Sandbox: Instalação de tempo de execução do objetivo, execução da construção.

3. **Agent loop.**Utilize带工具的 LangGraph:`run_build`- Não.`read_file`- Não.`edit_file`- Não.`run_test`- Não.`git_diff` agente 分类 failure (deep·syntax、test、build-tool),并应用定向修正──重新运行──

4. **Budget caps.**Cada repo 30 minutos de relógio de parede ≈ $8 成本、20 代理转──任何超限都会停止,并以当前差 归档到"预算_尽尽"──

5. **Test + coverage gate.**Se a cobertura baixar acima de 2%, é regressão.

6. **PR open.**Depois de sucesso, empurrar, abrir relações públicas, juntar, além de quais receitas são aplicadas, quais compromissos são feitos por um agente.

7. **Failure taxonomy.**Para cada repo que falha, marque uma categoria:`dep_upgrade_required`- Não.`build_tool_drift`- Não.`custom_annotation`- Não.`test_flake`- Não.`syntax_edge_case`- Não.`budget_exhausted`❖ Construir painel de instrumentos―

8. **50-repo run.**Em MigrationBench subconjunto 上执行── relatório por classe taxa de passagem、 custo por relatório、 cobertura-conservação,并与只确定性基线对比──

## Use-o
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

## Entrega-o
`outputs/skill-migration-agent.md`É um objeto de entrega. É dado um repo, ele primeiro executará receitas deterministas, depois executará um ciclo de agente, para produzir um ramo de transferência já passado, ou o repo será registo para uma classe de taxonomia abaixo.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## 练习
1. Apenas com OpenRewrite (sem agente) operar migrar o pipeline, o ritmo de passagem será comparado com o pipeline completo, encontrando os casos em que apenas o agente intervenha e altera os resultados.

2. 实现一个"lint-clean"check:迁移后,运行风格linter(Java 用无,Python 用ruff) ―― Se surgirem novos erros de lint,则让PR 失败――衡量覆盖-preserved-but-style-regressed rate──

3. Adicionar um "minimal-diff" optimizer:agente de分支通过测试 后, use a segunda passagem 剪剪不必要的变化――报告差尺度减少――

4. 扩展到第三种迁移:Node 18到Node 22──复用沙箱 包装;把食谱层 换成自定义代码模式──

5. Use o tempo para a primeira construção verde (TTFGB) como métrica de UX para medir.

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
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) Referência de 2026
- [Moderne.io OpenRewrite platform](https://www.moderne.io) substrato determinista 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) receita 编写
- [Grit.io](https://www.grit.io) 替代代代代码模式 DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) Agentes SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代 migração referência
- [libcst](https://github.com/Instagram/LibCST) Substrato determinista Python
- [Daytona sandboxes](https://daytona.io) Caixa de areia por ramo 参考
