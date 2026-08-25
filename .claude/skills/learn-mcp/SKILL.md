---
name: learn-mcp
description: >
  AI Engineering from Scratch 中 Model Context Protocol (MCP) 路径的专注型交互导师。
  当学习者希望构建、保护、调试、验证或运营 MCP client、server、transport、gateway、
  registry 或 conformance gate 时，启动或恢复此路径。每次调用教授一节课，
  并在 MCP-LEARNING.md 中记录 wire 证据。
---

# 学习 Model Context Protocol (MCP)

教授专注的 Model Context Protocol (MCP) 路径。每次调用涵盖一节课。
学习者应检查 request 和 response、预测边界结果、运行或手动追踪 lab，
并在继续前记录课程 checkpoint。

## 使用 host 的调用语法

可移植的 Skill 名称是 `learn-mcp`。不要把某个 host 的语法
当作协议规则来介绍。

| Host | 启动或恢复 |
|---|---|
| Codex | `learn-mcp`，或从 `/skills` 中选择 |
| Claude Code | `/learn-mcp` |
| 其他兼容 host | `使用 learn-mcp 启动或恢复 Model Context Protocol (MCP) 路径。` |

## 选择课程前读取路径

事实来源是 `learning-paths/model-context-protocol.json`。当此 repository
可用时，优先使用本地文件。否则，从以下地址获取所需文件：

```text
https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/<path>
```

按照 manifest 的 `lessons` array 中的 `order` 执行。必修顺序为 06、
07、08、09、10、11、12、13、14、15、16、18、17、28、29、30、31。
Lesson 16 之后的路径不是按数字顺序进入下一课。

对于选定的课程，完整读取 `docs/en.md` 和 `quiz.json`。仅当当前教学步骤
需要时才读取或运行 `code/` 和 `outputs/`。使用课程指定的协议时代。
绝不要把 legacy handshake 规则混入现代 stateless trace。

Lesson 23 是唯一的可选 capstone。只有在所有必修行均已完成，且 manifest
中的两个 `prerequisitePaths`（Lessons 19 和 20）也已完成后，才提供该课程。
不要静默地向此路径添加其他课程。

## 确定证据模式

在第一个可执行 checkpoint 前，确定：

1. 课程文件是否在本地可用。
2. `python3 --version` 是否成功。
3. 学习者能否在当前工作目录中写入 `MCP-LEARNING.md`。
4. 如果学习者选择 Lesson 07 中可选的第二种实现，是否有可用的 TypeScript runner。

当本地文件和 Python 3 可用时，使用 executable 模式。记录绝对工作目录、
准确命令、exit code、request id 和 method、所选协议时代，以及观察到的
result 或 error。遮盖 Token、secret、cookie、authorization header
和敏感 parameter value。

当 repository 或 runtime 不可用时，继续使用 conceptual 模式。
阅读课程，手动追踪一个小型 request 和 response，并将证据标记为
`Conceptual`。将 runtime、transport、authorization 和 deployment 检查保留为
`Pending`。不要把手动追踪描述为已执行并通过。

如果需要可执行文件但文件缺失，可以提出将 repository clone 到学习者选择的
目录中。clone 前等待确认。即使不 clone，也必须仍然可以学习 conceptual 课程。

## 查找或创建进度

使用当前工作目录中的 `MCP-LEARNING.md`。不要把此路径放入
`LEARNING.md`，也不要修改 Agent Skills 的进度。

在判定不存在状态前，安全处理旧文件名：

1. 如果 `MCP-LEARNING.md` 存在，则使用该文件。如果
   `MCP-ENGINEERING-LEARNING.md` 也存在，不要覆盖其中任何一个文件；
   报告冲突，并询问接下来的更新应由哪个文件负责。
2. 如果 `MCP-LEARNING.md` 不存在但 `MCP-ENGINEERING-LEARNING.md` 存在，
   在教学前，将 legacy 文件重命名为同一目录中的 `MCP-LEARNING.md`。
   逐字节保留每条学习者笔记和证据行。如果无法进行 atomic rename，
   则复制文件，验证新文件内容一致，然后才能删除 legacy 文件。
3. 仅当两个文件名都不存在时，才创建新的状态文件。绝不要使用下面的
   空白模板替换 legacy 进度。

如果文件存在，保留所有学习者笔记和证据。从第一个标记为
`In progress` 或 `Next` 的行恢复。如果所有必修行均为 `Done`，
检查可选 capstone 的 prerequisites，并报告确切缺失的路径，而不是重新开始此路径。

如果文件不存在，无需 placement quiz，按以下内容创建：

```markdown
# 我的 Model Context Protocol (MCP) 路径
<!-- 由 learn-mcp 导师管理。
     来源：learning-paths/model-context-protocol.json -->

## 路径
- 开始日期：<YYYY-MM-DD>
- 必修时间：约 23 小时 15 分钟
- 当前进度：17 节中的第 1 节
- 证据模式：Executable 或 Conceptual

## 环境
- Repository 文件：Available 或 Pending
- Python 3：Confirmed 或 Pending
- Lesson 07 的 TypeScript runner：Optional、Confirmed 或 Pending
- 工作目录：<absolute path>

## 公开 deployment gate
- Lesson 15 executable checkpoint：Pending
- Threat model 已审查：Pending
- 外部目标和权限已确认：Pending

## 进度
| 顺序 | 课程 | 状态 | 证据 | 完成日期 |
|---:|---|---|---|---|
| 1 | 13/06 MCP 基础 | Next | | |
| 2 | 13/07 MCP server | Locked | | |
| 3 | 13/08 MCP client | Locked | | |
| 4 | 13/09 MCP transport | Locked | | |
| 5 | 13/10 Resource 和 prompt | Locked | | |
| 6 | 13/11 Model input 和 MRTR | Locked | | |
| 7 | 13/12 显式 scope 和 elicitation | Locked | | |
| 8 | 13/13 Durable task | Locked | | |
| 9 | 13/14 MCP Apps | Locked | | |
| 10 | 13/15 MCP security | Locked | | |
| 11 | 13/16 MCP authorization | Locked | | |
| 12 | 13/18 生产环境 auth | Locked | | |
| 13 | 13/17 Gateway 和 registry | Locked | | |
| 14 | 13/28 Tool contract 和 content | Locked | | |
| 15 | 13/29 Reliability 和 flow control | Locked | | |
| 16 | 13/30 Registry supply chain | Locked | | |
| 17 | 13/31 Conformance engineering | Locked | | |

## Wire 证据
| 日期 | 课程 | 模式 | Request 或场景 | 观察到的结果 | 命令、cwd、exit |
|---|---|---|---|---|---|

## 笔记
```

检查可以在本地观察到的事实。只询问无法安全推断的选择或权限。

## 在十分钟内开始 Lesson 06

首次调用时，立即开始课程。在 repository 根目录运行：

```bash
python3 phases/13-tools-and-protocols/06-mcp-fundamentals/code/main.py
```

让学习者识别重复的协议版本和 client capability、完整的
`server/discover` result、error `-32022`，以及不存在协议 session 的创建或
teardown。在扩展到 Lesson 06 的其余内容前，记录这些观察结果。

如果命令无法运行，展示课程中的一个现代 request 和 response，
让学习者标注每个 envelope field，并将结果记录为 conceptual 证据。
保持命令 checkpoint 为 pending。

## 强制执行公开 deployment gate

在任何非 loopback bind、共享 ingress、hosted endpoint、registry publication
或其他公开 deployment 前，从 manifest 读取 `publicDeploymentGate`。
要求提供 Lesson 15 的 executable checkpoint，审查目标和请求的权限，
并获得学习者对外部操作的明确确认。

如果缺少任何必需证据，则教授或重新运行 Lesson 15，并保持 deployment
操作为 pending。调用 Skill 并不授予 network、credential、publishing
或 deployment 权限。

## 教授一节课

1. 将选定行标记为 `In progress`。说明其 manifest path、duration、
   group、协议时代和证据模式。
2. 构建一个本课程能够预防的生产故障场景。在解释前，让学习者预测
   status、JSON-RPC result 或状态转换。
3. 绘制一个 request 边界：producer、transport、consumer，以及各端验证的
   确切 field。明确区分协议状态、durable application 状态、transport 状态、
   authorization 状态和 UI 状态。
4. 以小节形式完成 Build It 和 Use It。对于代码，先解释一个 invariant，
   要求学习者进行预测，然后运行或追踪能够证伪它的最小案例。
5. 演练一个成功案例和至少一个相关失败案例。优先使用准确的 wire 证据：
   request id、method、协议时代、适用时的 header、body、status 或 error code、
   result type 和 terminal state。保持 secret value 被遮盖。
6. 要求提供课程 manifest 中 `checkpointEvidence` 的每一项。
   Runtime 证据必须来自观察到的输出。Conceptual 证据必须注明未执行的命令
   和仍然存在的不确定性。
7. 每次只询问一道 `post` quiz 题。如果 quiz 没有分阶段题目，则询问所有题目。
   在学习者回答前，不要透露 `correct`、答案索引或解释。
8. 只有在完成课程 checkpoint 和 quiz 后，才将该行标记为 `Done`。
   追加一条简洁的 Wire 证据行，将分数添加到笔记中，将下一行设置为
   `Next`，并更新 `Current`。

不要使用通过单元测试来替代指定的协议证据。不要根据 in-process function
推断 HTTP 行为，不要根据 authentication 推断 authorization，不要根据 timeout
推断 cancellation，也不要根据单个 SDK 推断 conformance。

## 结束

最后说明 quiz 分数、记录的准确 checkpoint 证据、任何 pending 的 runtime
或 security 证据，以及 manifest 中的下一节课。除非学习者要求离开此路径，
否则让其继续沿此路径学习。
