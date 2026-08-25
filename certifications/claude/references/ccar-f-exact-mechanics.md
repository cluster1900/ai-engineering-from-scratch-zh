# CCAR-F 精确机制复习

> 理解架构后，将本文用作带日期的查阅练习。它不能替代亲自构建工作流。

**指南：** Claude Certified Architect - Foundations，版本 1.0
**指南生效时间：** 2026 年 7 月
**核验日期：** 2026-08-09

公开的 CCAR-F 指南考查持久有效的判断能力和精确的操作机制。
本复习资料汇总了指南中明确命名的接口，帮助你区分正确设计与看似合理的命令、
路径或字段。发布前，请根据当前官方指南和文档重新核验每一项。

## Agent 循环与 Session 状态

| 机制 | 需要记住的内容 | 决策边界 |
|---|---|---|
| `stop_reason: "tool_use"` | 执行请求的 Tool，追加与之匹配的结果，然后继续 | 不要根据自然语言短语推断循环状态 |
| `stop_reason: "end_turn"` | Model 已到达正常的终止轮次 | 在生产环境中还要处理错误、限制、取消及其他终止状态 |
| Tool 结果标识 | 根据发起调用的 Tool Use 标识符返回每个结果 | 绝不能按数组位置合并并发结果 |
| 对话状态 | 保留下一个请求所需的 content blocks | 在有损摘要之外提取需要持久保存的事实 |
| `--resume <session-name>` | 继续指定名称的先前 Session | 当旧的 Tool 观察结果已经过时时，应通过显式摘要重新开始 |
| `fork_session` | 从共享基线分支出独立的探索过程 | 当不同方法不应相互干扰时，使用单独的分支 |

## Tool 选择与 Structured Output

| 机制 | 含义 |
|---|---|
| `tool_choice: "auto"` | Model 可以调用 Tool，也可以返回文本 |
| `tool_choice: "any"` | Model 必须调用所提供 Tools 中的一个 |
| `tool_choice: {"type":"tool","name":"..."}` | 必须选择指定名称的 Tool |
| 严格 JSON Schema | 减少语法和结构错误；仍然需要语义验证 |
| Pydantic 验证 | Python 中用于结构和领域检查的一种实现选项，并不能证明提取出的事实真实无误 |

仅当工作流确实要求首先执行该类型化操作时，才使用强制选择。
它不能普遍替代编排、授权或语义验证。

## MCP 配置

| 作用域或行为 | 公开指南中的机制 |
|---|---|
| 共享项目 Server | 将 `.mcp.json` 纳入版本控制 |
| 个人或实验性 Server | `~/.claude.json` |
| Secrets | 使用 `${GITHUB_TOKEN}` 等环境变量展开方式；绝不能提交其值 |
| Discovery | 在连接时发现已配置 Servers 提供的 Tools |
| Resources | 当通过重复 Tool 调用浏览内容目录和 Schema 会造成浪费时，将其公开为 Resources |

当前 MCP Transport 和部署细节见第 11 课。应将 stdio 和
Streamable HTTP 视为当前 Transport，并将旧版 HTTP+SSE 视为已弃用。

## Claude Code 团队界面

| 界面 | 精确复习要点 |
|---|---|
| 项目 Command | `.claude/commands/` |
| 个人 Command | `~/.claude/commands/` |
| Skill | `.claude/skills/<skill-name>/SKILL.md` |
| Skill frontmatter | 指南明确列出了 `context: fork`、`allowed-tools` 和 `argument-hint` |
| 条件 Rule | `.claude/rules/` 下的 Markdown，并在 YAML frontmatter 中包含 `paths` glob |
| 非交互式运行 | `-p` 或 `--print` |
| 机器可读的 CI | `--output-format json` 与 `--json-schema` |

作用域也是答案的一部分。即使指令本身有用，如果被放在错误的用户级、项目级
或路径专属位置，仍然属于配置失败。

## Message Batches

2026 年 7 月版指南列出了以下考试参考事实：

- 与标准处理相比，成本节省 50%。
- 处理窗口最长可达 24 小时，且不提供有保证的延迟 SLA。
- 使用 `custom_id` 对请求与结果进行核对。
- 单个 Batch 请求内部不支持多轮 Tool 执行。
- 对失败进行分类后，只重新提交可以安全重试的失败项。

这些是带日期的产品事实。在依据它们作出实际成本或 SLA 决策之前，
请查阅当前的 Message Batches 文档。

## 内置 Tool 选择

指南明确列出了 Read、Write、Edit、Bash、Grep 和 Glob。应复习它们的
使用边界，而不是死记流行度顺序：

- 修改尚未检查的内容之前，先使用 Read。
- Edit 要求存在可靠的匹配；只有在受控替换更安全时，才使用整文件 Write。
- Grep 搜索内容；Glob 按模式查找路径。
- Bash 会跨越强大的执行边界，因此需要更严格的权限、验证和 Sandbox 控制。

## 闭卷练习

针对上面的每一行：

1. 凭记忆写出准确的路径、Flag、字段或状态。
2. 给出一个适合使用它的场景。
3. 给出一个看似合理的替代方案，以及该方案违反的约束。
4. 在官方来源中核验该机制的精确含义。
5. 构建或运行能够实际练习该决策的关联课程产物。

只有当你能够解释一个字符串的作用域、失败模式和更安全的替代方案时，
才应将对它的记忆视为真正掌握。

## 官方来源

- [CCAR-F 考试指南](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Claude Code 文档](https://code.claude.com/docs/en/overview)
- [Claude Agent SDK 文档](https://code.claude.com/docs/en/agent-sdk/overview)
- [Tool Use 文档](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- [Structured Output 文档](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Message Batches 文档](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [MCP 文档](https://modelcontextprotocol.io/docs/getting-started/intro)
