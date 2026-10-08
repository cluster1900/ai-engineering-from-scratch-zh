# Capstone 09  Code Migration Agent ((Repo 级语言 / Runtime 升级)

> Amazon's MigrationBench ((Java 8 đến 17) và Google's App Engine Py2-to-Py3 migrator  thiết lập tiêu chuẩn năm 2026。Modern's OpenRewrite 能执行确定性的 AST重写在大规模场景下。Grit sử dụng codemod 风格 DSL 解决相同类问题。 Mô hình sản xuất sẽ kết hợp hai thứ: sử dụng确定性基底完成安全重写, tái sử dụng đại lý 层处理模糊场景, sử dụng sandbox để xây dựng từng phân đoạn,并使用测试套在 PR 开放前将结果运行绿色。本顶石的目标是迁移 50 个真实,并发布通过率与失败分类体系。

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 问题
Kế hoạch chuyển đổi mã hóa quy mô lớn là một trong những ứng dụng sản xuất rõ ràng nhất năm 2026 của các đại lý mã hóa. Sự thật rất rõ ràng.

Bạn sẽ xây dựng một đại lý, nó nhận một Java 8 repo (hoặc Python 2 repo), và sản xuất ra một chi nhánh đã di chuyển của green-CI. Bạn sẽ đo lường tỷ lệ vượt qua, bảo tồn bảo hiểm thử nghiệm, chi phí của mỗi repo, và xây dựng hệ thống phân loại thất bại.

## 概念
Đường ống có hai tầng.**deterministic substrate**(Java dùng OpenRewrite, Python dùng libcst) an toàn thực hiện rất nhiều máy tính: nhập khẩu, ký hiệu phương pháp, chỉnh sửa không an toàn, thử với các nguồn lực, thay thế API bị suy giảm.**agent layer**(OpenAI Agents SDK hoặc LangGraph, dựa trên Claude Opus 4.7 và GPT-5.4-Codex) xử lý công thức 无法覆盖的情况: build-file upgrades(Maven/Gradle/pyproject) ]]

Mỗi repo sẽ nhận được một dự kiến mục tiêu chạy thời gian của Daytona sandbox. Ứng viên 代 thực hiện: chạy build, phân loại thất bại, ứng dụng sửa chữa, tái chạy. Ứng dụng cứng hạn chế: mỗi repo 30 phút, mỗi repo $ 8,20 Ứng viên quay.

失败分类体系是交付物品. Trong 50 repo, có gì xấu? Transitive deps?Custom annotations?Build tool version?与迁移无关的测试片? Mỗi loại đều cần có số và mô hình khác biệt.

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
- 确定性底座: OpenRewrite (Java) hoặc libcst (Python)
- Đại lý: OpenAI Agents SDK hoặc Claude Opus 4.7 + GPT-5.4-Codex 上的 LangGraph
- Sandbox: Daytona devcontainers per branch, thời gian chạy mục tiêu được cài đặt trước (Java 17 / Python 3.12)
- Xây dựng hệ thống: Maven, Gradle, uv (Python)
- Benchmarks: Amazon MigrationBench 50-repo subset(Java 8 đến 17),Google App Engine Py2-to-Py3 repos
- Test harness: runner song song, thông qua Jacoco (Java) hoặc coverage.py (Python) 统计覆盖
- Khả năng quan sát: Langfuse + Mỗi repo một gói theo dõi, chứa mỗi phân đoạn khác nhau
- bảng điều khiển: bảng điều khiển phân loại thất bại, chứa từng lớp của tính toán và các khác biệt mô hình


```figure
ce-migration-funnel
```

##  xây dựng nó
1. **Recipe pass.**先运行 OpenRewrite(Java) hoặc libcst(Python) công thức──捕获 70-80% của机械迁移──作为" công thức" commit 提交──

2. **Build trial.**Daytona Sandbox: Ứng dụng, vận hành, xây dựng... Nếu qua, nhảy vào thử nghiệm... Nếu thất bại, giao cho đại lý...

3. **Agent loop.**Sử dụng dụng cụ của LangGraph:`run_build``read_file``edit_file``run_test``git_diff`◊agent 分类 thất bại(dep、syntax、test、build-tool),并应用定向修正──重新运行──

4. **Budget caps.**Mỗi repo 30 phút tường đồng hồ ≈ $8 成本、20 ≈ đại lý quay ≈ Bất kỳ giới hạn nào đều sẽ dừng lại,并以当前差归档到"预算_尽尽"─

5. **Test + coverage gate.**xây dựng 通過後,运行测试套件──将覆盖与基 repo đối với  Nếu bảo hiểm 下降超过2%,归档到"coverage_regression"──

6. **PR open.**Sau thành công, đẩy 分支,打开 PR,附上不同,以及哪些食谱被应用,哪些承诺由代理编写的摘要──

7. **Failure taxonomy.**Đối với mỗi lần thất bại, ghi một loại:`dep_upgrade_required``build_tool_drift``custom_annotation``test_flake``syntax_edge_case``budget_exhausted`❖ Thiết lập bảng điều khiển ❖

8. **50-repo run.**Trong bộ phận MigrationBench 上执行── báo cáo tỷ lệ vượt qua mỗi lớp、chi phí-per-repo、 bảo tồn bảo hiểm,并 với chỉ xác định-chỉ cơ sở đối với tỷ lệ

## Sử dụng nó
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

## 交付 nó
`outputs/skill-migration-agent.md`Đó là giao hàng. Nó sẽ trước tiên thực hiện các công thức xác định, sau đó vận hành vòng tròn đại lý, để tạo ra một phân đoạn đã di chuyển qua, hoặc sẽ thu nhập repo vào một lớp phân loại nào đó.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## 练习
1. Chỉ sử dụng OpenRewrite (không có đại lý) để vận hành đường ống di chuyển.

2. 实现一个"lint-clean" kiểm tra:迁移后,运行风格linter(Java 用无,Python 用 ruff) ―― Nếu xuất hiện các lỗi lint mới,则让PR 失败――衡覆盖-preserved-but-style-regressed rate。

3. 添加一个"最小差"优化器:经过测试后,通过第二次 剪剪不必要的变化――报告差尺缩――

4. 扩展到第三种迁移:Node 18 đến Node 22──复用沙盒 包装;把食谱层 换成自定义代码模式──

5. Để đo lường thời gian xây dựng xanh (TTFGB) như là métrics UX 来衡量──目标:p50 低于 10 分钟──

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
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) 2026 năm quyền lực chuẩn
- [Moderne.io OpenRewrite platform](https://www.moderne.io) phụ thuộc xác định 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) công thức 编写
- [Grit.io](https://www.grit.io) 替代 mã hóa DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) Cấp SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代 di cư chuẩn
- [libcst](https://github.com/Instagram/LibCST) Python định nghĩa phụ tầng
- [Daytona sandboxes](https://daytona.io) mỗi ngành sandbox 参考
