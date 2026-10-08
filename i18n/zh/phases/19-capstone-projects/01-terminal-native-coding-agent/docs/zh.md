# 卡普斯通 01  终端原生编码代理

> 到2026年,编码代理的形态已经定型了. 一个 TUI 带,一个现状的计划,一个沙箱化工具表面,一个负责的计划,行动,观察,恢复循环.

**类型：**石头
**语言：**类型字体 / Bun (),Python (原始脚本)
**先修要求：**项目项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目: 项目:
**覆盖阶段：**子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子
**时间：**35 小时

## 问题
到2026年,编码代理已经成为主导 AI 应用类别的类型. Claude Code (Anthropic) 带 Composer 2 和 Agent Tabs 的Cursor 3 (Cursor) 带Amp (Sourcegraph) 带OpenCode (112k星) 带Factory Droids 和 Google Jules 都发布了相同架构的不同变体:一个终端带,一个带权的工具表面,一个沙盒,以及一个围绕边境模型构建的计划行为观察循环. 前沿非常窄的 Opus 4.5 在 SWE 台上验证了79.2%但工艺很宽. 大多数失败模式不是错误. 它们是工具循环不稳定的失败,无毒的信息,控制和破坏的文件系统.

你不能从外部理解这些代理. 你必须亲手构建一个,观察循环在第47轮因为破裂,返回8MB匹配,然后重建截层.

## 概念
带有四个表面.**Plan**维护一个全写风格状态对象,由模型 每一轮重写.**Act**分发工具调用 (阅读,编辑,运行,搜索, git)**Observe**捕获/转移/出口代码,进行截断,并把摘要反回去──**Recover**处理工具错误,同时避免爆文本窗口或无限循环.**hooks**,我知道.`PreToolUse`现在`PostToolUse`现在`SessionStart`现在`SessionEnd`现在`UserPromptSubmit`现在`Notification`现在`Stop`其他`PreCompact`它们是可配置的扩展点,操作员可以注入其中的政策,远程和防护.

运行在一个全新的开发容器中,并挂载可读的 git 工作树. 木永远不会触摸主机文件系统. 在成功或失败后,都会被销毁. 成本控制在三层强制执行:每轮代币上限,每次会议美元预算,以及硬性转换限制. 通常为50次.

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
- 带运行时间: Bun 1.2 + Ink 5 (终端反应)
- 访问:OpenRouter 统一 API,支持Claude Sonnet 4.7、GPT-5.4-Codex、Gemini 3 Pro、Opus 4.5(用于最难任务)
- 工具运输:模式语境协议 StreamableHTTP (MCP 2026修订)
- 沙箱:E2B沙箱 (JS SDK) 或戴顿纳开发集装箱
- 代码搜索: ripgrep子工艺,17种语言的树守护器 (预编译)
- 隔离:`git worktree add`按任务,成功/失败的清理
- 杆:SWE-bench Pro (验证子集) +终端-Bench 2.0 +您自己的30任务持有
- 可观察性: 开放Telemetry SDK`gen_ai.*`semconv → 自主主办的Langfuse
- 广告发布:GitHub应用程序使用细粒度的代币,范围 限制在目标 repo


```figure
ce-agent-loop
```

## 构建它
1. **TUI and command loop.**搭建一个使用墨水的子项目.`agent run <repo> "<task>"`△打印一个分屏视图:计划表面顶部) ‧工具调用流中部) ‧ 标签预算底部) △加 Ctrl-C 取消逻辑,在退出前触发 `SessionEnd`子,我知道.

2. **Plan state.**定义一个带类型的 TodoWrite 方案(包含待定/在_进展/完成项目和笔记) ・模型 每一轮通过工具调重写完整状态不要让它增加修改――将计划 持久化到`.agent/state.json`崩后可以继续.

3. **Tool surface.**定义六个工具:`read_file`现在`edit_file`其他地方的信息`ripgrep`现在`tree_sitter_symbols`现在`run_shell`,我没有什么可做.`git`通过MCP StreamableHTTP 暴露,使利用与运输 解──每个工具都回归截断后的输出(每次调用最多的4k代币)

4. **Sandbox wrapping.**每个任务都会启动一个E2B沙箱.`git worktree add -b agent/$TASK_ID`创建一个新分支机构. 所有工具通话都在沙箱内执行.

5. **Hooks.**实现全部八种2026子类型――至少连接四个用户编写的子:(a)`PreToolUse`破坏指挥,阻止工作树外的`rm -rf`,,`PostToolUse`代币会计,`SessionStart`预算初始化,`Stop`写入最后的痕迹包.

6. **Eval loop.**克隆一个30期的SWE-bench Pro Python 子集──对每个问题 运行你的套装──与迷你Swe-agent(最小的基线) 比较通过@1、转换每任务 和 $-每任务──将结果写入`eval/results.jsonl`,我知道.

7. **Cost control.**硬性截断:50轮,200万语境,每任务5美元`PreCompact`为了新的观测,同时不丢失计划.

8. **PR posting.**成功后,最后一步是`git push`之后调用 GitHub API 打开一个 PR,并正文包含计划和不同的摘要.

## 使用它
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

## 交付它
交付能力 位于`outputs/skill-terminal-coding-agent.md`△给定一个回复路和任务描述,它将在沙盒中运行完整的计划-行为-观察循环,并返回 PR URL 和跟踪捆绑.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 vs baseline | 你的 harness 与 mini-swe-agent 在 30 个匹配 Python tasks 上对比 |
| 20 | Architecture clarity | Plan/act/observe 分离、hook surface、tool schema——对照 Live-SWE-agent layout 评审 |
| 20 | Safety | Sandbox escape tests、permission prompts、destructive-command guard 通过 red-team |
| 20 | Observability | Trace completeness（100% 的 tool calls 都有 span）、每轮 Token accounting |
| 15 | Developer UX | Cold-start < 2s，crash recovery resumes plan，Ctrl-C 能干净地取消 mid-tool |
| **100** | | |

## 练习
1. 将支持模型从Claude Sonnet 4.7 切换为运行在vLLM 上的Qwen3-Coder-30B──比较pass@1 和 $-per-task──报告开放模型表现较差的地方──

2. 添加一个`reviewer`根据"中文网"的数据, 已有了一个新的数据库, 已有了一个新的数据库.

3. 压测沙盒:编写一个尝试`curl`外部URL的任务,以及一个尝试写入工作树的任务.

4. 使用较小的模型 (海库4.5) 实现`PreCompact`总结: 衡量在3x紧缩下损失了多少计划忠诚度.

5. 将MCP StreamableHTTP 运输 替换为工作室──基准冷启动 和每次通话延迟──为本地使用的选择胜者──

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
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) 来自人类的参考带
- [Cursor 3 changelog](https://cursor.com/changelog) 代理 图表 和 组合器 2 产品说明
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) 根据SWE-板结比较的最低基线
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent)使用Opus 4.5 在SWE-台验证上达到79.2%
- [OpenCode](https://opencode.ai)开放的,112万颗星星
- [SWE-bench Pro leaderboard](https://www.swebench.com) 本终点石面向的评估
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)可流动HTTP,能力的元数据
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)工具调用和使用代币的跨度方案
