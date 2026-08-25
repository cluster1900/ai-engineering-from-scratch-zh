# 阶段 13：Tool 与 Protocol

> AI 与现实世界之间的接口。

本阶段从 function call 和 Tool schema 逐步深入到可互操作的 protocol、Agent Skills、安全和生产治理。数字顺序便于浏览。下面的专门路线才是可靠的学习顺序。

## 在 GitHub 上开始本阶段

**先修课程：**阶段 11 的 LLM completion API。对于 MCP 或 Agent Skills，请使用下方的专门路线，不要假定应按课程编号顺序学习。

**本阶段第一节完整课程：**[Tool 接口](01-the-tool-interface/)

从 repository 根目录运行以下命令：

```bash
python3 phases/13-tools-and-protocols/01-the-tool-interface/code/main.py
```

保留命令、exit code、describe-decide-execute-observe trace、输入被拒绝的证据，以及一句解释 turn 限制的话。

**下一步操作：**继续学习 [Function Calling 深入解析](02-function-calling-deep-dive/)，或选择下方的 Model Context Protocol (MCP) 或 Agent Skills 路线。

浏览[阶段 13 的完整课程列表](../../README.md#phase-13)或[跨阶段 ROADMAP](../../ROADMAP.md)。

## Model Context Protocol (MCP) 路线

MCP 专门路线包含 17 节课，约需 23 小时 15 分钟。它遵循 MCP `2026-07-28`，从一个自描述 JSON-RPC 请求开始，一直学习到可投入运维的一致性 gate。

| 阶段 | 课程 | 你将证明的内容 | 时间 |
|---|---|---|---:|
| 核心 | [06](06-mcp-fundamentals/)、[07](07-building-an-mcp-server/)、[08](08-building-an-mcp-client/)、[09](09-mcp-transports/)、[10](10-mcp-resources-and-prompts/) | Envelope、discovery、client 与 server 行为、transport、resource 和 Prompt。 | 5 小时 50 分钟 |
| 双向交互 | [11](11-mcp-sampling/)、[12](12-mcp-roots-and-elicitation/)、[13](13-mcp-async-tasks/)、[14](14-mcp-apps/) | 在没有 server-initiated request 的情况下实现 MRTR 输入、显式 scope、持久 task 和 app 边界。 | 5 小时 |
| 安全 | [15](15-mcp-security-tool-poisoning/)、[16](16-mcp-security-oauth-2-1/)、[18](18-mcp-auth-production/)、[17](17-mcp-gateways-and-registries/) | 投毒防御、授权、生产 Token、gateway 路由和 registry 准入。 | 5 小时 15 分钟 |
| 高级 | [28](28-mcp-tool-contracts-and-content/)、[29](29-mcp-reliability-cancellation-and-flow-control/)、[30](30-mcp-registry-supply-chain-and-drift/)、[31](31-mcp-conformance-versioning-and-operations/) | 契约保真度、取消竞态、供应链漂移和发布证据。 | 7 小时 10 分钟 |

确切顺序为 06、07、08、09、10、11、12、13、14、15、16、18、17、28、29、30、31。该顺序定义于
[`learning-paths/model-context-protocol.json`](../../learning-paths/model-context-protocol.json)。
导师会创建 `MCP-LEARNING.md`，每次调用教授一节课，并记录每个检查点要求的请求、响应、命令、工作目录、exit code 和已脱敏的边界证据。

使用你的 host 所支持的调用方式开始：

| Host | 调用方式 |
|---|---|
| Codex | `learn-mcp`，或从 `/skills` 中选择 |
| Claude Code | `/learn-mcp` |
| 其他兼容 host | `使用 learn-mcp 开始或继续 Model Context Protocol (MCP) 路线。` |

### 最初十分钟

在 repository 根目录运行课程 06 的 stateless transcript：

```bash
python3 phases/13-tools-and-protocols/06-mcp-fundamentals/code/main.py
```

在输出中找到四项内容：重复的请求 metadata、完整的 `server/discover` 结果、不支持版本对应的 error `-32022`，以及一个不会创建或终止 MCP protocol session 的 transport close。该 transcript 是第一个检查点，而不只是 demo。

如果无法使用 repository 或 Python 3，请阅读[课程 06](06-mcp-fundamentals/)，并手动跟踪一个请求和响应。将检查点标记为概念性完成，并将 runtime、transport、授权和部署证据保留为待完成状态。

在进行任何非 loopback bind、共享 ingress、托管 endpoint 或 registry 发布之前，完成课程 15 的可执行安全检查点。审查外部目标和请求的权限，然后显式确认部署操作。完成教程并不代表获得部署权限。

旧版 `initialize`、`Mcp-Session-Id`、独立 SSE `GET`、session `DELETE` 和 server-initiated request 流程仅出现在明确的兼容性说明中。现代请求在 `params._meta` 中声明协议版本和 client capability，使用 `server/discover`，并携带足够的信息，使其能够被独立验证、授权、路由和重试。

[课程 23](23-capstone-tool-ecosystem/)是 MCP 路线中唯一的可选 capstone。请先完成 17 节必修课程以及[课程 19](19-a2a-protocol/)和[课程 20](20-opentelemetry-genai/)，再开始该课程。

## Agent Skills 快速路线

专门路线包含五节课，约需 9 小时 30 分钟：

| 步骤 | 课程 | 成果 | 时间 |
|---:|---|---|---:|
| 1 | [22：可移植契约与 Runtime 边界](22-skills-and-agent-sdks/) | 创建、安装、调用、验证并移除一个完整的 Skill bundle。 | 90 分钟 |
| 2 | [24：发现与渐进式披露](24-skill-discovery-and-progressive-disclosure/) | 跟踪发现、编目、激活和 resource 加载。 | 105 分钟 |
| 3 | [25：调用与路由](25-skill-invocation-and-routing/) | 控制显式、隐式、人工、Model 和弃权路径。 | 105 分钟 |
| 4 | [26：权限、Sandbox 与信任](26-skill-permissions-sandboxes-and-trust/) | 区分指令、权限、隔离和验证。 | 120 分钟 |
| 5 | [27：Eval、打包与可移植性](27-skill-evals-packaging-and-portability/) | 构建 release gate，并在真实 host 中证明行为。 | 150 分钟 |

使用你的 host 所支持的调用方式开始：

| Host | 调用方式 |
|---|---|
| Codex | `learn-agent-skills`，或从 `/skills` 中选择 |
| Claude Code | `/learn-agent-skills` |
| 其他兼容 host | `使用 learn-agent-skills 开始或继续 Agent Skills Engineering 路线。` |

导师会创建或继续使用 `AGENT-SKILLS-LEARNING.md`，每次调用教授一节课，并记录每个检查点要求的证据。该路线定义于
[`learning-paths/agent-skills.json`](../../learning-paths/agent-skills.json)。

如果你希望先阅读，请从[课程 22](22-skills-and-agent-sdks/)开始。其第一个 lab 可让你在大约十分钟内将 Skill 安装到真实 host 中。

### 先修快速通道

- 要完成真实 lab，你需要 `node`、`npx`、`python3`、一个选定且支持 Skill 的 host，以及对所选 project 或 user Skill scope 的写入权限。安装前，请使用 `node --version`、`npx --version` 和 `python3 --version` 验证这三个命令。
- 如果无法执行上述 preflight，请使用网站或手动阅读每节课的 `docs/en.md`。你可以完成概念性学习，但应将 discovery、调用、script、更新和卸载证据标记为待完成。
- 如果你还不熟悉 Tool 契约，请浏览[课程 01](01-the-tool-interface/)和[课程 05](05-tool-schema-design/)。
- 在开始课程 26 前，请确认你能够解释 Tool 投毒和不可信指令。[课程 15](15-mcp-security-tool-poisoning/)是该 preflight 的可选复习材料，并不是这条路线的第六节必修课。
- [课程 23](23-capstone-tool-ecosystem/)是可选的系统 capstone，并不是课程 22 之后的下一节 Agent Skills 课程。请先完成课程 06 至 20，再学习该课程。

## 完整阶段

完整课程计划参见 [ROADMAP.md](../../ROADMAP.md)。
