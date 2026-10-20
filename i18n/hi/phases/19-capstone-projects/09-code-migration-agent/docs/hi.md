# कैपस्टोन 09  कोड माइग्रेशन एजेंट(Repo 级语言 / Runtime 升级)

> अमेज़ॅन के माइग्रेशनबेंच(जावा 8 से 17) और Google के ऐप इंजन Py2-to-Py3 माइग्रेटर ने 2026 के मानक निर्धारित किए हैं। आधुनिक के OpenRewrite ने बड़े पैमाने पर परिदृश्य में निश्चितता को निष्पादित करने में सक्षम होने के लिए AST 重写──ग्रेट का उपयोग करके कोडमॉड के शैली में DSL  समाधान एक ही प्रकार की समस्याएं हैं। उत्पादन मॉडल दोनों को एक साथ लाएगाः निश्चितता के आधार पर सुरक्षित पुनर्लेखन, फिर से एजेंट लेयर प्रसंस्करण模糊 परिदृश्य, सैंडबॉक्स के साथ एक से एक शाखा बनाने के लिए, और परीक्षण हर्न का उपयोग करके।

**Type:** Capstone
**Languages:** Python (agent), Java / Python (targets), TypeScript (dashboard)
**Prerequisites:** Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:**P5 · P7 · P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## 问题
बड़े पैमाने पर कोड माइग्रेशन 2026 साल के कोडिंग एजेंटों में से एक है। ग्राउंड सत्य  बहुत स्पष्ट                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

आप एक एजेंट का निर्माण करेंगे, यह एक जावा 8 रेपो (या पायथन 2 रेपो) प्राप्त करेगा, और एक ग्रीन-सीआई के एक स्थानांतरित शाखा को उत्पन्न करेगा। आप पास दर को मापेंगे, परीक्षण कवरेज संरक्षण, प्रत्येक रेपो की लागत, और एक विफलता श्रेणी प्रणाली का निर्माण करेंगे।

## 概念
पाइपलाइन में दो स्तर हैं।**deterministic substrate**(जावा के साथ OpenRewrite, पायथन के साथ libcst) सुरक्षित रूप से बड़ी संख्या में मशीनों को पुनः लिखनाः आयात, विधि हस्ताक्षर, शून्य सुरक्षा संपादन, संसाधनों के साथ प्रयास, कम एपीआई प्रतिस्थापन।**agent layer**(OpenAI Agents SDK या LangGraph, आधारित क्लाउड ओपस 4.7 और GPT-5.4-Codex) प्रसंस्करण व्यंजनों 无法覆盖的情况:बिल्ड-फाइल अपग्रेड(मावेन/ग्रेडल/पीईप्रोजेक्ट) ]] पारगमन निर्भरता संघर्ष、टेस्ट फ्लेक्स、 कस्टम एनोटेशन]]

प्रत्येक रेपो शहर को एक पूर्व-नियोजित लक्ष्य रनटाइम का डेटाना सैंडबॉक्स प्राप्त होगा। एजेंट 代 निष्पादनः运行构建分类故障、应用修正、重新运行――硬性限制: प्रत्येक रेपो 30 मिनट、 प्रत्येक रेपो $8、20 个代理转── यदि सभी परीक्षण 通过且覆盖率 delta 不为负,就打开PR──如果没有通过,就把该 repo 按失败类归档并附上证据──

失败分类体系是交付物品. 五十个 repo 中, क्या बुरा हुआ? पारगमनशील डिप्स? कस्टम एनोटेशन? उपकरण संस्करण बनाएं? 迁移无关的测试片? प्रत्येक श्रेणी के लिए एक गणना और नमूना अंतर की आवश्यकता है।

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
- 确定性底座: OpenRewrite (जावा) या libcst (पायथन)
- एजेंट: ओपनएआई एजेंट्स एसडीके या क्लाउड ओपस 4.7 + जीपीटी-5.4-कोडेक्स 上的 लैंगग्राफ
- सैंडबॉक्सः डेटोन डेव कंटेनर प्रति शाखा, पूर्व-स्थापित लक्ष्य रनटाइम (जावा 17 / पायथन 3.12)
- निर्माण प्रणालीः मावेन, ग्रेडले, यूवी (पाइटन)
- बेंचमार्कः अमेज़न माइग्रेशनबेंच 50-रिपो उपसमूह(जावा 8 से 17 तक),Google ऐप इंजन Py2-to-Py3 repos
- परीक्षण हर्नसः समानांतर धावक, जैकोको (जावा) या कवरेज के माध्यम से
- अवलोकनशीलताः Langfuse + प्रत्येक repo एक ट्रैक बंडल, प्रत्येक भिन्न टुकड़ा शामिल
- डैशबोर्डः विफलता-टैक्सनोमी डैशबोर्ड, प्रत्येक वर्ग के गणना और नमूना अंतर शामिल


```figure
ce-migration-funnel
```

##  इसे निर्माण
1. **Recipe pass.**先运行 OpenRewrite(Java) या libcst(Python) व्यंजनों──捕获 70-80%的机械迁移──作为" व्यंजनों" commit 提交──

2. **Build trial.**डेटोन सांडबॉक्स: स्थापना लक्ष्य रनटाइम,运行 निर्माण.

3. **Agent loop.**प्रयोग带工具的 LangGraph:`run_build``read_file``edit_file``run_test``git_diff`◊ एजेंट 分类 विफलता(dep、syntax、test、build-tool),并应用定向fix──重新运行──

4. **Budget caps.**प्रत्येक रेपो 30 मिनट दीवार घड़ी ≈ $ 8 成本 ≈ 20 ≈ एजेंटों को बदल देता है ≈ ≈ कोई भी ओवरसीमा ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈

5. **Test + coverage gate.**निर्माण के बाद, परीक्षण सूट को चलाने के बाद, कवर को आधार रेपो के साथ तुलना में कवर किया जाएगा। यदि कवरेज 2% से अधिक हो जाता है, तो इसे "कवरेज_रिग्रेशन" में वर्गीकृत किया जाएगा।

6. **PR open.**सफलता के बाद, धक्का 分支,打开 PR,附上差,以及哪些食谱被应用,哪些承诺由代理编写的摘要──

7. **Failure taxonomy.**प्रत्येक असफल रेपो के लिए, एक श्रेणी को चिह्नित करेंः`dep_upgrade_required``build_tool_drift``custom_annotation``test_flake``syntax_edge_case``budget_exhausted` डैशबोर्ड का निर्माण

8. **50-repo run.**MigrationBench उपसमूह 上执行── प्रति वर्ग उत्तीर्ण दर, प्रति रिपोर्ट लागत, कवरेज संरक्षण,并与只有确定性基线对比──

## इसका उपयोग करें
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

## 交付 यह
`outputs/skill-migration-agent.md`यह एक रेपो को निर्धारित करता है, यह पहले निर्धारक व्यंजनों को निष्पादित करता है, फिर एजेंट लूप को निष्पादित करता है, एक पारित किए गए स्थानांतरित शाखा को उत्पन्न करता है, या उस रेपो को एक वर्गीकरण वर्ग में वर्गीकृत करता है।

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | MigrationBench pass rate | 50-repo subset pass@1 |
| 20 | Test-coverage preservation | Mean coverage delta vs base |
| 20 | Cost per migrated repo | $/repo on passing runs |
| 20 | Agent / deterministic-tool integration | OpenRewrite 处理的 fixes 与 agent 编写的 fixes 的占比 |
| 15 | Failure analysis write-up | 带 exemplars 的 taxonomy 完整性 |
| **100** | | |

## अभ्यास
1. केवल ओपनरवाइट (अजेंट के बिना) के साथ संचालित करें, आप्रवासन पाइपलाइन को पार करने की दर को पूरी पाइपलाइन के साथ तुलना में बढ़ाएं, उन मामलों को ढूंढें, जिनमें केवल एजेंट ही हस्तक्षेप कर परिणाम बदलेंगे।

2. 实现一个"लिंट-क्लीन"检查:迁移后,运行风格linter(Java 用无,Python 用ruff) ⋅ यदि नई लिंट त्रुटियां सामने आती हैं, तो PR 失败

3.  एक "न्यूनतम अंतर" अनुकूलक जोड़ें:एजेंट का分支通过测试 后, Using a second pass 剪剪不必要的变化── रिपोर्ट करें अंतर आकार में कमी──

4. 扩展到第三种迁移:नोड 18到नोड 22──复用沙盒 包装;把 नुस्खा परत 换成自定义代码模式──

5. उपयोगिता मेट्रिक के रूप में समय-से-पहले-हरा-निर्माण (TTFGB) को मापें।

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
- [Amazon MigrationBench](https://aws.amazon.com/blogs/devops/amazon-introduces-two-benchmark-datasets-for-evaluating-ai-agents-ability-on-code-migration/) 2026 साल अधिकार बेंचमार्क
- [Moderne.io OpenRewrite platform](https://www.moderne.io) निर्धारक सब्सट्रेट 参考
- [OpenRewrite documentation](https://docs.openrewrite.org) नुस्खा 编写
- [Grit.io](https://www.grit.io) 替代代代代码模式 DSL
- [OpenAI sandboxed migration cookbook](https://developers.openai.com/cookbook/examples/agents_sdk/sandboxed-code-migration/sandboxed_code_migration_agent) एजेंट एसडीके 参考
- [Google App Engine Py2 to Py3 migrator](https://cloud.google.com/appengine) 替代 प्रवास बेंचमार्क
- [libcst](https://github.com/Instagram/LibCST) पायथन निर्धारक सब्सट्रेट
- [Daytona sandboxes](https://daytona.io) प्रति शाखा रेत बॉक्स 参考
