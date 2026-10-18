# Capstone 09  Código Agente de Migración(Repo 级语言 / Runtime 升级)

> Amazon's MigrationBench(Java 8 to 17) y Google's App Engine Py2-to-Py3 migrator  establecieron los estándares de 2026 ⋅ Moderne's OpenRewrite ⋅ puede ejecutar determinación AST en escenarios a gran escala ⋅ Grit con un estilo de código ⋅ DSL ⋅ resolver el mismo tipo de problemas ⋅ Producción modelo combinará los dos: con la base de determinación para completar la seguridad de la reescritura, reutilizar el agente ⋅ capa de procesamiento ⋅ m m m m m m ⋅ escenario, con sandbox para hacer la construcción de cada uno de los ramos, y usar el arnés de prueba en PR ⋅ abrir el repo para ejecutar los resultados en verde ⋅ El objetivo de este capstone es la migración 50 ⋅ real, y publicar la tasa de pasaje con el sistema de fracasos ⋅ ⋅

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

##  problemas
La verdad es muy clara, ¿no es así?), los beneficios son reales, la flota de Java-8 迁移 es un proyecto que necesita una inversión de gran escala humana, el punto de referencia también es público, el subconjunto de MigrationBench 50 repo)

Usted construirá un agente, que recibe un repo Java 8 (o Python 2 repo), y producirá una división de CI verde ya desplazada. Usted medirá la tasa de paso, la preservación de la cobertura de pruebas, el costo de cada repo, y construirá un sistema de clasificación de fracaso. En comparación con la línea de base de la línea de base determinista, le dirá el valor real del agente.

## 概念
El oleoducto tiene dos niveles.**deterministic substrate**(Java con OpenRewrite, Python con libcst) seguridad ejecutar una gran cantidad de máquinas reescribir: importaciones, firmas de método, modificaciones de seguridad cero, intentos de recursos, reemplazos de API degradados.**agent layer**(OpenAI Agents SDK o LangGraph, basado en Claude Opus 4.7 y GPT-5.4-Codex) procesar recetas 无法覆盖的情况:build-file upgrades(Maven/Gradle/pyproject) 过渡的依赖冲突、测试片、定制注释──

Cada repo obtendrá una caja de arena de Daytona de tiempo de ejecución de un objetivo de preinscripción. Agente 代执行:运行构建分类失败、应用修正、重新运行.

失败分类体系是交付物品. En 50 repos, ¿qué está mal? Depositivos transitivos? Anotations personalizadas?Construir una versión de herramienta? Flascas de prueba relacionadas con la migración? Cada clase necesita tener un conteo y ejemplos de diferencia.

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
- 确定性底座: OpenRewrite (Java) o libcst (Python)
- Agente: OpenAI Agents SDK o Claude Opus 4.7 + GPT-5.4-Codex 上的 LangGraph
- Sandbox: Daytona devcontainers por rama, tiempo de ejecución de objetivo preinstalado (Java 17 / Python 3.12)
- Construir sistemas: Maven, Gradle, uv (Python)
- Benchmarks: Amazon MigrationBench 50 repo subconjunto(Java 8 hasta 17),Google App Engine Py2-to-Py3 repos
- Arnés de prueba: corredor paralelo, a través de Jacoco (Java) o cobertura.py (Python) 统计覆盖
- Observabilidad: Langfuse + cada repo un paquete de rastro, contiene cada pieza diferente
- Tabla de control: tabla de control de fallas-taxonomía, contiene cada clase de cuentas y diferencias ejemplares


```figure
ce-migration-funnel
```

## Construirlo
1. **Recipe pass.**Antes de empezar, el programa de trabajo de la empresa de la industria de la información (PYTON) se ha desarrollado en el campo de la información y de la información.

2. **Build trial.**Sandbox Daytona: instalación de ejecutivo del objetivo, ejecución de la construcción.

3. **Agent loop.**Uso de herramientas de LangGraph:`run_build`¿Qué es esto?`read_file`¿Qué es esto?`edit_file`¿Qué es esto?`run_test`¿Qué es esto?`git_diff`◊ agente 分类 fracaso(dep、syntax、test、build-tool),并应用定向修正──重新运行──

4. **Budget caps.**Cada repo 30 minutos de reloj de pared ≈ $8 成本、20 ≈ agentes se vuelven ≈ cualquier super límite todo se detendrá, y se clasificará como "ordenado" ≈ "ordenado" ≈

5. **Test + coverage gate.**Si la cobertura baja más del 2%, se clasifica en "cubrición_regressión" (coverage_regression).

6. **PR open.**Después del éxito, empuje, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, abre, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re, y que re,

7. **Failure taxonomy.**Para cada repudio que no se cumpla, marque una categoría:`dep_upgrade_required`¿Qué es esto?`build_tool_drift`¿Qué es esto?`custom_annotation`¿Qué es esto?`test_flake`¿Qué es esto?`syntax_edge_case`¿Qué es esto?`budget_exhausted`❖ Construir un tablero de control

8. **50-repo run.**En el subconjunto de MigrationBench 上执行── report per class pass rate、cost-per-repo、coverage-preservation,并与只有确定性基线对比──

## Usalo
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

##  entregarlo
`outputs/skill-migration-agent.md`Es un objeto entregado. Se le da un repo, primero ejecuta recetas deterministas, luego ejecuta un bucle de agentes, para producir una rama de transferencia pasada, o se regroupará el repo en una clase de taxonomía.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

##  ejercicios
1. Sólo con OpenRewrite (no hay agente) se ejecuta la migración de la tubería.

2. 实现 una verificación "linto limpia":迁移后,运行风格linter(Java 用无,Python 用ruff) ―― si aparecen nuevos errores de lint,则让PR 失败── medir la cobertura-preservada-pero-estilo-regresada tasa──

3. 添加一个"minimal-diff"optimizer:agent的分支通过测试 后,使用第二次通过 剪剪不必要的变化――报告差尺度减少――

4. 扩展到第三种迁移:Nodo 18 hasta Nodo 22──复用沙盒 包装;把食谱层 换成自定义代码模式──

5. La medida de tiempo a primera construcción verde (TTFGB) como métrica de UX para medir.

## 关键术语: "El hombre es un hombre"
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
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) 2026 años de autoridad referencia
- [Moderne.io OpenRewrite platform](https://www.moderne.io) sustrato determinista 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) receta 编写
- [Grit.io](https://www.grit.io) 替代代代代码模式 DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) Agentes SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代 referencia de migración
- [libcst](https://github.com/Instagram/LibCST) Substrato determinista de Python
- [Daytona sandboxes](https://daytona.io) por rama de arena 参考
