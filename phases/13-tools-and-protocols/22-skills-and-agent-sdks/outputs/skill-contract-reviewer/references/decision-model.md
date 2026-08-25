# 原语决策模型

根据职责进行选择。可能有多个原语都是正确的。

| 需求 | 原语 | 边界 |
|---|---|---|
| 一次性指令 | Prompt | 仅存在于当前交互中 |
| repository 范围的默认设置 | AGENTS.md | 在该 repository 范围内工作时适用 |
| 可复用的任务方法 | Agent Skill | 为任务加载流程性知识 |
| 外部操作或数据 | MCP Tool | 公开具有输入契约的可调用能力 |
| 响应运行时事件 | Hook | 在 host 定义的生命周期节点运行 |
| 确定性转换 | 普通代码 | 无需 Model 判断即可生成可重复的输出 |
| 隔离或并行 Context | Subagent | 将有明确边界的任务委派到独立的 Context window 中 |

查询远程服务的发布审查方法可以同时使用 Agent Skill 和 MCP Tool。Repository 测试约定可以添加到 AGENTS.md。Tool 调用后的审计可以添加 Hook。稳定的解析逻辑应放在普通代码中。能够从 Context 隔离中获益的独立研究可以使用 Subagent。
