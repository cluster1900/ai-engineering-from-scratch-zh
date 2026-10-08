# 克劳德代理 SDK:Subagents 和会议商店

> 克劳德代理SDK是克劳德代码利用的库形态――内置工具、用于文本隔离的子器、子、W3C痕迹传播、会议存储平率――克劳德管理代理是用于长期的异步工作的托管替代方案――

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## 学习目标
- 解释人类客户端SDK(原料API) 和Claude代理SDK(带形状) 之间的区别.
- 描述子物:并行和背景隔离以及何时使用它们.
- 说出Python SDK的会话存储面面(`append`现在`load`现在`list_sessions`现在`delete`现在`list_subkeys`) 以及`--session-mirror`作用的作用.
- 实现一个无限的束,包含内置的工具,带隔离的背景,

## 问题
的LLMAPI只给你一次回路. 制作代理需要工具执行,MCP服务器,生命周期,子生殖,会议持续性,踪迹传播.

## 概念
### 客户端 SDK VS 代理 SDK

- **Client SDK (`anthropic`).**您自己负责循环,工具和状态.
- **Agent SDK (`claude-agent-sdk`).**作为库提供的Claude Code循环.

### 嵌入式工具

开箱附10多个工具:文件阅读/写, shell,grep,glob,web搜索等.

### 子

人类学记录了两个用途:

1. **Parallelization.**并发运行独立工作.  找出这些20个模块中的每个模块的测试文件.
2. **Context isolation.**们使用自己的背景窗口;只有结果返回管家.

 Python SDK 的近期新增项:`list_subagents()`,我知道.`get_subagent_messages()`用于读取副本转录.

### 会议商店

与TypeScript的协议平衡:

- `append(session_id, message)` 添加一个转.
- `load(session_id)` 恢复对话.
- `list_sessions()` 枚举──
- `delete(session_id)`带有对子弹的场会议.
- `list_subkeys(session_id)`列出了副键.

`--session-mirror`转录流时将其镜像放到外部文件中,以便调试.

### 子

您可以注册生命周期:

- `PreToolUse`现在`PostToolUse`门或审计工具的呼叫――
- `SessionStart`现在`SessionEnd`设置和拆除.
- `UserPromptSubmit` 在模型中 看到用户的输入 之前采取行动.
- `PreCompact` 在文本紧缩之前运行.
- `Stop`代理出口 时清理
- `Notification`侧通道警报

子是支持工作流程的方法 (Phase 14课程参考) 和类似系统加上跨界行为方式.

###  W3C 追踪环境

调用方上活跃的OTel跨度 会通过W3C追踪文本标题传播到CLI子进程──整个多进程追踪 会在你的后台中显示为一个追踪──

### 克劳德管理了代理人

托管的替代方案`managed-agents-2026-04-01`◎●长期的异步工作、内置快速缓存、内置紧缩──用控制 换取管理基础设施──

### 这个模式很容易出错.

- **Subagent over-spawn.**为100个小任务产生100个子弹.
- **Hook creep.**每个团队都会增加子; 开始时间膨胀――每季度审查子――
- **Session bloat.**持续累积;规模 增长.`list_sessions`+ 过期政策


```figure
ae-subagent-isolation
```

## 构建它
`code/main.py`用dlib 实现SDK形状:

- `Tool`现在`ToolRegistry`包含内置`read_file`现在`write_file`现在`list_dir`,我知道.
- `Subagent`私人背景,隔离运行,返回结果.
- `SessionStore`添加,加载,列表,删除,列表_子键.
- `Hooks` `pre_tool_use`现在`post_tool_use`现在`session_start`现在`session_end`,我知道.
- 一个演示:主要代理并行产出3个子组,每个都分离,总结结果,并持续会议.

运行:

```
python3 code/main.py
```

追踪 会展示子语境隔离(乐队演员语境大小 保持有限) 执行 和会议持续性。

## 使用它
- **Claude Agent SDK**为了想要克劳德代码的第一产品.
- **Claude Managed Agents**用于主机长期的异步工作.
- **OpenAI Agents SDK**(课 16) 用于OpenAI第一对手──
- **LangGraph + custom tools**如果您想要图形状态机.

## 交付它
`outputs/skill-claude-agent-scaffold.md`会议架子一个Cloade Agent SDK应用程序,包含子件,子,会议商店,MCP服务器附件和W3C痕迹传播.

## 练习
1. 添加一个子弹生殖器,把20个任务批成每组5个平行子弹.
2. 实现一个`PreToolUse`子,对`write_file`调用 进行速度限制 每个会议 每分钟 5 次)  追踪该行为
3. 连接`list_subkeys`染了树. 息的树.
4. 将这个玩具移植到真实.`claude-agent-sdk`字符串包. 工具注册会发生什么变化?
5. 阅读Claude管理代理博士. 你什么时候会从自主主办的转换到管理的?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) 克劳德代码的库形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 生产模式
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)主办的替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)对应
