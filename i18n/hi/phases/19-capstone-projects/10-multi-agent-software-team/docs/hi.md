# कैपस्टोन 10  मल्टी-एजेंट सॉफ्टवेयर इंजीनियरिंग टीम

> SWE-AF के कारखाने 架构、MetaGPT के भूमिका आधारित प्रलोभन、AutoGen 0.4 के टाइप किए गए अभिनेता ग्राफ、Cognition के Devin, साथ ही कारखाने के ड्रोइड्स, सभी ने 2026 में एक ही रूप प्राप्त कियाःआर्किटेक्ट 负责规划,N 个编码者在并行工作树中工作, समीक्षक 负责门,测试者 负责验证──并行工作树把墙-钟转换为吞吐量共享状态和交付协议 成为失败表面── इस कीपिंगस्टोन का लक्ष्य इस टीम का निर्माण करना है, SWE-bench Pro 上评估,并报告哪些交付会失败率以及失败率──

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:**P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 小时

## 问题
单代理编码利用在大型任务上会碰到上限──原因不是任何单个代理 很弱,而是200k-Token context 无法同时容纳建筑计划、四个并行代码基础片、评论员评论和测试输出──多代理工厂 会拆分问题:建筑师 负责计划,编码员 在并行工作树中负责实现,评论员 负责门,测试员 负责验证──SWE-AF के "工厂" वास्तुकला、MetaGPT के भूमिकाएँ、AutoGen के टाइप किए गए अभिनेता ग्राफ, ये तीन प्रकार के ढांचे एक ही रूप को दर्शाते हैं──

विफलता सतह है हस्तान्तरण──आर्किटेक्ट  ने कोडर्स  ने नियोजित किया  सामग्री को प्राप्त नहीं किया जा सकता है──कोडर  ने एक दूसरे के साथ संघर्ष का उत्पन्न किया  रिव्यूअर  ने एक भ्रमपूर्ण समाधान को मंजूरी दी──टेस्टर के साथ अभी भी लिखित कोडर्स  ने एक दौड़ का आयोजन किया──आप इस तरह की एक टीम का निर्माण करेंगे, 50 SWE-बेंच प्रो मुद्दों में इसे अपलोड करें, प्रत्येक हस्तान्तरण का पालन करें, पोस्ट-मार्टम जारी करें──

## 概念
भूमिकाएँ हैं टाइप एजेंटों**Architect**(क्लाउड ओपस 4.7) 读取 issue,编写计划,并将其分为带有显式界面的子任务──**Coders**(क्लाउड सोनेट 4.7, N 个并行实例, प्रत्येक उदाहरण में एक `git worktree`+ डेटोन सैंडबॉक्स 中) 独立实现 उपकार्य──**Reviewer**(GPT-5.4) 读取合并后的差异,并批准或请求具体修改──**Tester**(Gemini 2.5 Pro) 报告 पास/फेल

通信通過共享任务板 (~ फ़ाइल समर्थित या Redis) 完成── प्रत्येक भूमिका 消费它被允许处理的任务──Handoffs 是 A2A-प्रोटोकॉल-प्रकार के संदेश──协调问题包括: विलय-संघर्ष समाधान(संयोजक भूमिका या स्वचालित तीन-तरफा विलय) 、 साझा-राज्य सिंक्रनाइज़ेशन(कोडर 开始后计划 被结;replans 是独立事件),以及 समीक्षक गेटकीपिंग( समीक्षक 不能批准它自己做出的变更或它提出的变更) ‖

टोकन प्रवर्धन है छिपे हुए लागतों। प्रत्येक भूमिका सीमा में संक्षेप में संकेतों और प्रदत्त संदर्भों में वृद्धि होगी। एक 40 वक्र एकल-एजेंट रन चार भूमिकाओं के बीच 160 कुल वक्रों में बदल जाएगा।

## 架构
```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## 技术
- ऑर्केस्ट्रेशनः साझा राज्य + प्रति एजेंट उप-ग्राफ के साथ लैंगग्राफ
- संदेशः टाइप किए गए इंटरएजेंट संदेशों के लिए A2A प्रोटोकॉल (Google 2025)
- मॉडल: ओपस 4.7 (आर्किटेक्ट), सोनेट 4.7 (कोडर), जीपीटी-5.4 (रिव्यूर), जेमिनी 2.5 प्रो (टेस्टर)
- कार्यवृक्ष अलगाव: `git worktree add`प्रति कोड + डेटोन सैंडबॉक्स
- विलय समन्वयक: कस्टम थ्री-वे विलय + एलएलएम-मध्यस्थ संघर्ष समाधान
- Eval: SWE-bench Pro (50 issues), SWE-AF scenarios, HumanEval++ यूनिट टेस्ट के लिए
- अवलोकनशीलताः रोल-टैग किए गए स्पैन के साथ लैंगफ्यूज, प्रति एजेंट टोकन लेखांकन
- तैनातीः K8s, प्रत्येक भूमिका एक स्वतंत्र तैनाती,并 आधारित बैकलॉग 配置 HPA


```figure
ce-team-handoff
```

##  इसे निर्माण
1. **Task board.**फ़ाइल समर्थित JSONL, टाइप संदेशों को शामिलः`plan_request``subtask``diff_ready``review_needed``test_needed``approved``rejected``replan_needed`एजेंट 订阅 टैग──

2. **Architect.**读取 GitHub issue, using带有计划模板的 Opus 4.7, आवश्यकता स्पष्ट उपकार्य इंटरफ़ेस(触及的文件、公共功能、测试影响)`plan_request`

3. **Coders.**N 个并行工人, प्रत्येक कार्यकर्ता बोर्ड से मध्य दावा एक उपकार्य── प्रत्येक कार्यकर्ता 启动一个新的 `git worktree add`शाखा 和 एक डेटोन सैंडबॉक्स── पूरा उपकार्य──发出带有补丁 + परीक्षण डेल्टा के `diff_ready`

4. **Merge coordinator.**जब सभी कोडर 完成后,将 N 个 शाखा 通过三向合并 合并到阶段分支――只有存在文件级重叠 时,才使用LLM-中介冲突解决――

5. **Reviewer.**GPT-5.4 读取合并后的差异──不能批准它自己编写的差异──发出 `approved`(नो-ओप) या विशिष्ट परिवर्तन अनुरोध के साथ`review_feedback`,并路由回相关编码器──

6. **Tester.**Gemini 2.5 Pro में प्रयोग किया जाता है परीक्षण सूट`test_passed`या `test_failed`◊ असफल परीक्षण लूप वापस करने के लिए ◊ असफल उपकार्य के कोडर के पास

7. **Handoff accounting.**प्रत्येक पंक्ति के पार भूमिका सीमा का संदेश शहर में Langfuse में एक अवधि प्राप्त, रिकॉर्ड उपयोग भार आकार 和 उपयोग के मॉडल── गणना प्रत्येक उपकार्य के टोकन प्रवर्धन(कोडर_टोकन + समीक्षक_टोकन + परीक्षक_टोकन + वास्तुकार_शेयर / कोडर_टोकन) 

8. **Eval.** 50  SWE-बेंच प्रो मुद्दों 上运行──将通过@1 和 $-प्रति-समाधान-प्रसोधन के साथ एकल-एजेंट बेसलाइन एक सोनट 4.7,  एकल कार्यवृक्ष में) तुलना

9. **Post-mortem.**प्रत्येक असफलता के लिए, असफलता के हस्तांतरण की पहचान करें।

## इसका उपयोग करें
```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## 交付 यह
`outputs/skill-multi-agent-team.md`यह वितरित किया जा सकता है। एक समस्या URL और समानांतरता स्तर को निर्धारित करने के लिए, यह टीम एक विलय-तैयार पीआर उत्पन्न करेगी, और प्रति भूमिका टोकन लेखांकन प्रदान करेगी।

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | 匹配的 50-issue subset，pass@1 |
| 20 | Parallel speedup | Wall-clock vs single-agent baseline |
| 20 | Review quality | injected-bug probe 上的 false-approval rate |
| 20 | Token efficiency | 每个 solved issue 的 total tokens vs single-agent |
| 15 | Coordination engineering | Merge-conflict resolution、handoff-failure histogram |
| **100** | | |

## अभ्यास
1. एक स्पष्ट बग में प्रवेश करते समय, मुख्य शरीर में एक अतिरिक्त जोड़ दिया गया।`return None`)― माप समीक्षक की झूठी स्वीकृति दर―调优 समीक्षक शीघ्र, जब तक झूठी स्वीकृति 5% से कम नहीं हो जाती।

2. 减少到两个编码器 (आर्किटेक्ट + 两个编码器 + समीक्षक + परीक्षक, प्रत्येक编码器 顺序运行两个子任务) ⋅ तुलना दीवार घड़ी 和 पास दर

3. एकल लेखक प्रतिबंध 替换 merge coordinator  subtasks 触及不相交的 फ़ाइल सेट) 测量 आर्किटेक्ट का नियोजन भार 

4. जीपीटी-5.4 से क्लाउड ओपस 4.7 में बदला जाएगा।

5. 添加第五个角色:documenter (Haiku 4.5) ∙ समीक्षा  इसके बाद, यह चेंजलॉग प्रविष्टि उत्पन्न करेगा ∙ दस्तावेज की गुणवत्ता को मापने के लिए

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Parallel worktree | "隔离分支" | `git worktree add` 为每个 coder 生成一个新的 working tree |
| Task board | "共享 message bus" | 存储 typed messages 的 File 或 Redis store，agents 会订阅它 |
| Handoff | "Role boundary" | 从一个 role 的 context 跨到另一个 role 的任何 message |
| Token amplification | "Multi-agent overhead" | 同一任务下跨 roles 的 total tokens / single-agent tokens |
| A2A protocol | "Agent-to-agent" | Google 2025 年用于 typed inter-agent messages 的 spec |
| Merge coordinator | "Integrator" | 运行 three-way merge 并调解 conflicts 的组件 |
| False approval | "Reviewer hallucination" | Reviewer 批准带有已知 bugs 的 diff |

## 延伸阅读
- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) 2026 मल्टी-एजेंट फैक्ट्री के संदर्भ में प्राप्ति
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT)  भूमिका आधारित बहु-एजेंट ढांचा
- [AutoGen v0.4](https://github.com/microsoft/autogen) Microsoft के टाइप अभिनेता फ्रेमवर्क
- [Cognition AI (Devin)](https://cognition.ai) 参考产品
- [Factory Droids](https://www.factory.ai)  अन्य संदर्भ उत्पाद
- [Google A2A protocol](https://developers.google.com/agent-to-agent) अंतर एजेंट संदेश विनिर्देश
- [git worktree documentation](https://git-scm.com/docs/git-worktree) अलगाव सब्सट्रेट
- [SWE-bench Pro](https://www.swebench.com) मूल्यांकन लक्ष्य
