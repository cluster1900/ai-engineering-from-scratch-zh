# कैपस्टोन 01  终端原生 कोडिंग एजेंट

> 2026 तक,कोडिंग एजेंट का आकार तय हो चुका है। एक TUI हर्नस, एक स्टेटस वाला प्लान, एक सा बॉक्सिंग टूल सरफेस, एक जिम्मेदार प्लान, एक्ट, ऑब्जर्व, रिकवरी लूप। क्लाउड कोड, कोर्सर 3 और ओपनकोड दूर से सब कुछ अलग है।

**类型：**कैपस्टोन
**语言：**टाइपस्क्रिप्ट / बून (हार्नेस), पायथन (एवल स्क्रिप्ट)
**先修要求：**चरण 11 (एलएलएम इंजीनियरिंग), चरण 13 (उपकरण और प्रोटोकॉल), चरण 14 (एजेंट), चरण 15 (स्वायत्त प्रणाली), चरण 17 (संरचना)
**覆盖阶段：**P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**时间：**35 小时

## 问题
2026 तक,कोडिंग एजेंटों ने एक ही संरचना के विभिन्न चर जारी किए हैंः एक टर्मिनल हर्न, एक सीमित उपकरण सतह, एक रेत बॉक्स, और एक सीमा के आसपास का एक योजना-कार्य-निरीक्षण लूप।

आप इन एजेंटों को बाहर से नहीं समझ सकते हैं। आप एक को स्वयं बनाना होगा, और 47 वें दौर में रिपग्रेप के कारण लूप को देखना होगा। 8MB के साथ मेल खाता है और फिर फिर से कटौती को फिर से बनाना होगा।

## 概念
चार सतहों के साथ हार्नेस**Plan**维护一个 TodoWrite 风格的状态对象, द्वारा मॉडल प्रत्येक एक轮重写──**Act**分发 उपकरण कॉल (पढ़ें, संपादित करें, चलाएं, खोजें, git)**Observe**捕获 stdout / stderr / exit codes, संछेप,并把摘要反回去──**Recover**️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️**hooks**`PreToolUse`,`PostToolUse`,`SessionStart`,`SessionEnd`,`UserPromptSubmit`,`Notification`,`Stop`और `PreCompact` ये संचालित विस्तार बिंदु हैं, जिनमें ऑपरेटर नीति, दूरबीन और गार्डरेल्स डाल सकता है

sandbox उपयोग E2B या डेटोनैसॆ प्रत्येक कार्य एक नए डेवकॉन्टेनर में चल रहा है, और एक पठनीय गिट वर्कट्री पर लटकता है।

## 架构
```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## 技术
- हर्नस रनटाइमः Bun 1.2 + Ink 5 (रेक्ट इन टर्मिनल)
- मॉडल 访问:OpenRouter 统一 API, समर्थन क्लाउड सोनेट 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5(का उपयोग सबसे कठिन कार्य)
- उपकरण परिवहनः मॉडल संदर्भ प्रोटोकॉल StreamableHTTP (MCP 2026 संशोधन)
- रेत बॉक्सः E2B रेत बॉक्स (JS SDK) या डेटोन डेव कंटेनर
- कोड खोजः 17 भाषाओं के लिए ripgrep उपप्रक्रिया, पेड़-निवासी पार्सर (पूर्व-संकलित)
- अलगाव: `git worktree add`प्रति कार्य, सफलता/असफलता पर सफाई
- Eval Harness: SWE-bench Pro (verified subset) + Terminal-Bench 2.0 + अपना 30-कार्य होल्डआउट
- अवलोकनशीलताः OpenTelemetry SDK के साथ `gen_ai.*`semconv → स्व-होस्टिंग Langfuse
- पीआर पोस्टिंगः GitHub ऐप का उपयोग करें ठीक-असंत token,scope limit in target repo


```figure
ce-agent-loop
```

##  इसे निर्माण
1. **TUI and command loop.**搭建一个使用墨的 Bun 项目──接收 `agent run <repo> "<task>"`△打印一个分屏视图:计划面板(顶部) 、工具-call stream(中部) 、 टोकन बजट(底部) △添加 Ctrl-C 取消逻辑,在退出前触发 `SessionEnd`हुक

2. **Plan state.**定义一个带类型的 TodoWrite schema(包含 pending / in_progress / done items 和 notes)  मॉडल प्रत्येक दौर के माध्यम से उपकरण कॉल 重写完整状态不要让它增量修改──将计划 持久化到`.agent/state.json`, इस तरह से दुर्घटना के बाद फिर से शुरू कर सकते हैं

3. **Tool surface.**定义六个工具:`read_file`,`edit_file`(带 diff पूर्वावलोकन), `ripgrep`,`tree_sitter_symbols`,`run_shell`(समय के साथ), `git`(status / diff / commit / push) ❖ MCP StreamableHTTP 暴露, make harness और परिवहन 解── प्रत्येक उपकरण 都返回截断后的输出(每次调用最多4k Tokens) ❖

4. **Sandbox wrapping.**प्रत्येक मिशन एक E2B सैंडबॉक्स शुरू होगा।`git worktree add -b agent/$TASK_ID`创建一个新分公司──所有工具调用都在沙盒内执行──主机文件系统不可访问──

5. **Hooks.**实现全部八种 2026 हुक 类型──至少接入四个用户编写的 हुक:(क)`PreToolUse`विनाशकारी-कमान गार्ड, कार्यवृक्ष को रोकने के बाहर `rm -rf`,(ख) `PostToolUse`टोकन लेखांकन, ((ग) `SessionStart`बजट प्रारंभ करना,`Stop`写入 अंतिम निशान बंडल──

6. **Eval loop.**क्लोन एक 30-संस्करण के SWE-बेंच Pro Python 子集── प्रत्येक मुद्दे पर 运行你的 Harness──与迷你-स्व-agent(最小基线) तुलना करें पास@1、टर्न-प्रति-कार्य 和 $-प्रति-कार्य──将结果写入 `eval/results.jsonl`

7. **Cost control.**硬性截断:50 टर्न 200k संदर्भ  प्रति कार्य $ 5 `PreCompact`हुक में 150k 处将较早的转转 摘要为前状态块,为新观测 出空间,同时不丢失计划──

8. **PR posting.**सफलता के बाद, अंतिम कदम है`git push`, फिर GitHub एपीआई का उपयोग करें एक पीआर खोलें, और सही में योजना और विभिन्न सारांश शामिल करें

## इसका उपयोग करें
```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## 交付 यह
उपलब्ध कौशल 位于 `outputs/skill-terminal-coding-agent.md`△ एक रेपो पथ और कार्य विवरण निर्धारित किया गया है, यह sandbox में पूर्ण योजना-कार्य-निरीक्षण लूप चल जाएगा,并返回PR URL 和 ट्रैक बंडल──本 capstone के rubric:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## अभ्यास
1. क्वेन3-कोडर-30B के लिए एक समर्थन मॉडल को क्लाउड सोनेट 4.7 से बदला जाना चाहिए।

2. 添加一个 `reviewer`उप-एजेंट, PR पोस्टिंग में 前读取 diff,并可以请求一个修订循环──衡量错误积极评价是否会让SWE-bench पास दर 低于单代理基线(提示:通常会) 

3. 压测 sandbox:编写一个尝试 `curl`बाहरी URL का कार्य, तथा एक प्रयास लिखने में कामकाजी पेड़ बाहरी विभाग के कार्य── पुष्टीकरण दोहरे सभी द्वारा PreToolUse hook 阻止── रिकॉर्ड इन प्रयासों──

4. प्रयोग较小的模型 (हायकू 4.5) 实现 `PreCompact`सारांश ः माप 3x संपीड़न में नीचे खोया कितना योजना निष्ठा ः

5. MCP StreamableHTTP परिवहन को स्टूडियो के लिए बदलने हेतु बेंचमार्क कोल्ड-स्टार्ट तथा प्रति कॉल लटेंसी हेतु स्थानीय उपयोग के लिए ही उपयोग करें

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Harness | “agent loop” | 围绕 model 的代码，负责分发 tools、维护 plan state，并强制执行 budgets |
| Hook | “Agent event listener” | 由 harness 在八种 lifecycle events 之一上运行的用户编写脚本 |
| Worktree | “Git sandbox” | 位于独立路径的 linked git checkout；可以丢弃而不触碰 main clone |
| TodoWrite | “Plan state” | model 每轮都会重写的 typed list，包含 pending/in-progress/done items |
| StreamableHTTP | “MCP transport” | 2026 MCP revision：具备双向 streaming 的 long-lived HTTP connection；取代 SSE |
| Token ceiling | “Context budget” | 对 input+output Tokens 设置的每轮或每 session 上限；触发 compaction 或 termination |
| pass@1 | “Single-attempt pass rate” | SWE-bench tasks 在第一次运行中解决的比例，不包含 retry 或 test-set peeking |

## 延伸阅读
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) मानव के संदर्भ हर्न से
- [Cursor 3 changelog](https://cursor.com/changelog) एजेंट टैब और कंपोजर 2 उत्पाद नोट्स
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) SWE-बेंच हार्नेस तुलना के साथ न्यूनतम आधार रेखा
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) Opus 4.5 का उपयोग SWE-बेंच पर सत्यापित ऊपर 79.2% तक पहुँच गया
- [OpenCode](https://opencode.ai) खुला हर्नेस,112k सितारे
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本 capstone 面向的评估
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) स्ट्रीम करने योग्यHTTP,सक्षमता मेटाडेटा
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) उपकरण कॉल और टोकन उपयोग की अवधि योजना
