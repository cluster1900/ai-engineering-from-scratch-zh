# Capstone 09  Code Migration Agent(Repo 级语言 / Runtime 升级)

> Amazon'un MigrationBench ((Java 8-17), Google'ın App Engine Py2-to-Py3 migrator'u 2026 yılı standartlarını belirledi. Modern OpenRewrite'in büyük ölçekte bir sahneye kararlılık uygulayabilmesi için AST ağır yazması gerekir.

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 问题
Büyük ölçekli kod göçü 2026 yılı kodlama ajanlarının en net üretim aşamasında birimidir. Yeryüzü gerçeği çok net birimdir.

Bir ajan inşa edeceksin, bir Java 8 repoyu alacaksın, bir Java 8 repoyu alacaksın, bir Python 2 repoyu alacaksın, ve yeşil bir CI'nin taşındığı bir bölümü ortaya çıkacak.

## 概念
Bu boru hattı iki katlı.**deterministic substrate**(Java kullanılarak OpenRewrite, Python kullanılarak libcst) güvenli bir şekilde büyük miktarda mekanik yeniden yazılımı: ithalat, yöntem imzaları, sıfır güvenlik düzenlemeleri, kaynaklarla deneme, zayıf API değiştirmeleri, hızla hızlı bir şekilde, ve denetlenebilir farklılıklar üretmektedir.**agent layer**(OpenAI Agents SDK veya LangGraph, Claude Opus 4.7 ve GPT-5.4 Kodeks'e dayalı) Reçepleri işleme imkansız durum: dosya geliştirmelerini yapma Maven/Gradle/pyproject)

Her repo şehri bir ön yükleme hedefi çalışır zamanın Daytona sandbox olarak elde edilir. Ajan 代执行:运行构建分类故障、应用修正、重新运行。硬性限制:每个 repo 30 分钟、每个 repo $8、20 个代理转── eğer tüm testler 通过且覆盖下降不超过2个百分点,就打开PR──如果没有通过,就把该 repo 按失败类档并附上证券──

失败分类体系是交付物──在50个 repo 中,什么坏了?Transitive deps?Custom annotations?Build tool version?与迁移无关的测试片?

## Yapılandırma
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
- 确定性底座: OpenRewrite (Java) veya libcst (Python)
- Agent: OpenAI Agents SDK veya Claude Opus 4.7 + GPT-5.4-Codex 上的 LangGraph
- Kum Kutusu: Daytona devcontainers per branch, ön monte edilmiş hedef çalıştırma süresi (Java 17 / Python 3.12)
- Yapım sistemleri: Maven, Gradle, uv (Python)
- Benchmarks: Amazon MigrationBench 50-repo alt seti(Java 8-17),Google App Engine Py2-to-Py3 repos
- Test harness: paralel koşucusu, Jacoco (Java) veya coverage.py (Python) 统计覆盖
- Gözlem: Langfuse + Her repo, her farklı parçayı içeren bir iz paket
- Dashboard: başarısızlık taksonomi dashboard, her sınıfın sayı ve örnek farklılıklarını içerir


```figure
ce-migration-funnel
```

## Yapın onu.
1. **Recipe pass.**Önceki yazı: OpenRewrite (Java) veya libcst (Python) reçeteler.

2. **Build trial.**Daytona Sandbox: Install Target Runtime,运行构建――如果通过,跳到测试――如果失败,交给代理――

3. **Agent loop.**LangGraph'ın kullanımı:`run_build`- Evet.`read_file`- Evet.`edit_file`- Evet.`run_test`- Evet.`git_diff`◊agent 分类 failure(deep、syntax、test、build-tool),并应用定向修正──重新运行──

4. **Budget caps.**Her repo 30 dakika duvar saati ≈$8 成本、20 代理 döner ≈° herhangi bir aşırı sınır kesilecek, ≈° mevcut fark ≈° " bütçe_ tükeniyor" ≈°

5. **Test + coverage gate.**Bu, bir süre sonra test süiti kullanmak için kullanılacak.

6. **PR open.**Başariden sonra, bölümü dürtü, PR aç, eklemeyi değiştir, ve hangi tarifler uygulanır, hangi görevler üstlenir.

7. **Failure taxonomy.**Her başarısız repo için, bir kategoriye işaret edin:`dep_upgrade_required`- Evet.`build_tool_drift`- Evet.`custom_annotation`- Evet.`test_flake`- Evet.`syntax_edge_case`- Evet.`budget_exhausted`❖ Kullanım tablosu oluşturmak

8. **50-repo run.**MigrationBench alt kümesi 上执行── sınıf başına geçiş oranı, rapor başına maliyet, kapsam koruma,并与决定性基线对比──

## Kullan
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

## - Söyle.
`outputs/skill-migration-agent.md`Bu, önce belirleyici tarifleri uygulayacak, sonra da bir geçişli göçlü bölgeyi oluşturmak için ajan döngüsünü yürütür veya repo'yu bir taksonomi sınıfına kaydeder.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## 练习
1. Sadece OpenRewrite ile (Agentsiz) yürütülür.

2. 实现一个"lint-clean"检查:迁移后,运行风格linter(Java 用无,Python 用ruff) ―― eğer yeni lint hataları ortaya çıkarsa,则让PR 失败―― ölçebilir-sağır-ama-style-regressed oranı──

3. 添加一个"最小差"优化器:经验后,第二次通过 剪剪不必要的变化――报告差小缩――

4. 扩展到第三种迁移:Node 18 到Node 22──复用沙箱 包装;把食谱层 换成自定义代码模式──

5. UX metrik olarak zaman-birinci yeşil-yapma (TTFGB) ı ölçmek için.

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
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) 2026 yıl hakimiyet referansı
- [Moderne.io OpenRewrite platform](https://www.moderne.io) Deterministik altyapı 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) tarif 编写
- [Grit.io](https://www.grit.io) 替代代代代码模式 DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) Ajanlar SDK 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代 göç referansı
- [libcst](https://github.com/Instagram/LibCST) Python belirleyici altyapısı
- [Daytona sandboxes](https://daytona.io) Ürünler arası kum kutuları 参考
