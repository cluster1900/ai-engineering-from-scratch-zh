# 卡普斯顿 09 代码迁移代理 (Repo 级语言 / 运行时间 升级)

> 亚马逊的迁移银行(Java 8 到 17) 和谷歌的应用引擎Py2-to-Py3迁移器 设定了2026年的标准.现代的OpenRewrite 能够在大规模场景下执行确定性的AST重写.使用代码模式的DSL 解决相同类型的问题.生产模式将两者结合在一起:使用确定性基底完成安全重写,再使用代理层处理模糊场景,使用沙盒做分支构建,并使用测试套在 PR 开放前将结果运行绿色.本顶石的目标是迁移50个真实,并发布通过率与失败分类体系.

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 30 hours

## 问题
大规模代码迁移是2026年编码代理 最清晰的生产级应用之一. 地面真相很明确.迁移后测试套件是否通过?),收益是真实的.Java-8舰队迁移是需要按人力规模投入的项目.

你会构建一个代理,它接收一个Java 8 repo (或Python 2 repo),并产生一个绿色CI的已迁移分支. 你会衡量通过率,测试覆盖的保存,每个 repo 的成本,并构建失败分类体系. 与确定性仅的基线的排行量相比,会告诉你代理的实际价值在哪里.

## 概念
管道有两个层.**deterministic substrate**(Java 用OpenRewrite,Python 用libcst) 安全执行大量机械重写:进口、方法签名、零安全编辑、试用资源、退化API替代──它速度快,并产出可审计的差异──**agent layer**处理食谱 无法覆盖的情况:构建文件升级文/格雷德/皮项目) 过渡性依赖冲突测试片段 定制注释

每个 repo 都会获得预装目标运行时间的Daytona沙盒──代理 代执行:运行构建、分类失败、应用修正、重新运行──硬性限制:每一个 repo 30 分钟、每一个 repo $8、20 个代理转换──如果所有测试通过并且覆盖率达尔塔不负,就打开 PR──如果没有通过,就把该 repo 按失败类归档并附上证据──

失败分类体系是交付物品. 在50个备忘录中,什么坏了?过渡式代码?定制注释?构建工具版本?与迁移无关的测试片?每个类别都需要有数和模范差异.未来的食谱作者可以优先处理前三类.

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
- 确定性底座:开启重写 (Java) 或libcst (Python)
- 代理:OpenAI代理SDK或Claude Opus 4.7 + GPT-5.4-Codex 上的LangGraph
- 沙箱:每分支的Daytona开发容器,预装目标运行时间 (Java 17 / Python 3.12)
- 构建系统:马文,格拉德,UV (字thon)
- 基准:亚马逊迁移基准50个基准小组(Java 8到17个),谷歌应用程序引擎Py2-to-Py3存储
- 测试:平行跑步者,通过Jacoco (Java) 或覆盖.py (Python) 统计覆盖
- 观察性:长+每一个回复 一个追踪捆绑,包含每个不同的部分
- 仪表板:失败类别仪表板,包含每个类的计数和示例差异


```figure
ce-migration-funnel
```

## 构建它
1. **Recipe pass.**先运行 开放写作 (Java) 或 libcst (Python) 配方――捕获 70-80% 的机械迁移――作为"配方"提交――

2. **Build trial.**戴顿娜沙箱:安装目标运行时间,运行建设.

3. **Agent loop.**使用工具的长度图:`run_build`,我知道.`read_file`,我知道.`edit_file`,我知道.`run_test`,我知道.`git_diff`△代理 分类失败(深度、语法、测试、构建工具),并应用定向修复──重新运行──

4. **Budget caps.**每个回复30分钟的墙钟,8美元 成本,20个代理转...任何超限都会停止,并以当前差异归档到"预算_耗尽"

5. **Test + coverage gate.**通过建设,运行测试套件,将覆盖与基准备对比.

6. **PR open.**经过成功,推分支,打开 PR,附上差异,以及哪些食谱被应用,哪些承诺由代理编写的摘要.

7. **Failure taxonomy.**对于每一个失败的回复,标记一个类别:`dep_upgrade_required`,我知道.`build_tool_drift`,我知道.`custom_annotation`,我知道.`test_flake`,我知道.`syntax_edge_case`,我知道.`budget_exhausted`构建仪表板

8. **50-repo run.**在"迁移银行"子组上执行――报告每类通过率"",每次报价"",覆盖保全",并与只有确定性基线对比――

## 使用它
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

## 交付它
`outputs/skill-migration-agent.md`是交付物质.给定一个 repo,它先执行确定性食谱,然后运行代理循环,产生一个经过的已迁移分支,或将该 repo归档到某种类别下.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## 练习
1. 只有使用OpenRewrite (无代理) 运行迁移管道――将通过率与完整管道对比――找到那些只有代理介入才会改变结果的案例――

2. 实现一个" lint-clean"检查:迁移后,运行风格linter(Java 用无,Python 用 ruff) ・如果出现新的 lint 错误,则让 PR 失败――衡量覆盖-保存-但风格-回归率――

3. 添加一个"最小差异"优化器:经过测试后,使用第二次通过 剪切不必要的变化.

4. 扩展到第三种迁移:节点 18 到节点 22──复用沙盒包装;把食谱层换成自定义代码模式──

5. 将时间到第一绿色构建 (TTFGB) 作为UX指标来衡量.

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
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) 2026 年权威基准
- [Moderne.io OpenRewrite platform](https://www.moderne.io)确定性基板 参考
- [OpenRewrite documentation](https://docs.openrewrite.org)食谱编写
- [Grit.io](https://www.grit.io) 替代代代码模式DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) 代理人 SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代迁移基准
- [libcst](https://github.com/Instagram/LibCST) Python 确定性基板
- [Daytona sandboxes](https://daytona.io)每分支的沙箱 参考
