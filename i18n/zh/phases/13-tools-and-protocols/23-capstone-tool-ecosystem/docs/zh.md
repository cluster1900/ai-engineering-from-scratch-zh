# 综合实战项目:无状态工具生态系统

> 生产级代理系统是一个清晰边界的集合,而非特性的简单堆. 本实战项目将与真实部署中必不可少的协议客户端,授权服务器,执行箱和遥测导出器严格解.

**Type:** Build
**Languages:** Python (stdlib, in-process simulation)
**Prerequisites:** Phase 13 · 01 through 22, using MCP revision `2026-07-28`
**Time:** ~120 minutes

## 学习目标

- 工具调用,任务级结果,跨代理委托,UI资源,授权策略及分布式追踪记录有机融合成单流水线.
- 在每一个MCP请求中严格携带协议版本,客户端身份和能力,彻底告别了传输层会议的依赖.
- 在调用前主动执行服务发现,并通过官方任务 扩大稳健驱动长时间工作.
- 清晰区分符合协议形态的本地模拟 (本地模拟) 与真正的MCP、A2A、OAuth及OpenTelemetry 生产实现.
- 模拟器中的每一个抽象边界必须精确地映射到必须在生产中替换的物理组件.
- 确保`AGENTS.md`‧代理技能、运行时适配器、工具和安全策略 各自坚守正确的架构职责──
- 明确指出哪些技术断言可以直接由本地输出证明,哪些必须依赖于真实的端到端集成测试.

## 问题

设计一个学术研究和报告生成系统:用户请求查询关于代理 通信协议的论文――系统检查论文目录、委托编写总结、生成分析报告、返回UI 交互资源,并完整记录系统执行的链路踪迹――

实际上,这句话似乎很简单,

- 面向模型的工具方案声明;
- 无状态请求信封与服务发现契约;
- 针对主体 (主角) 范围和工具的网关决策;
- 长周期任务操作契约;
- 跨代理 委托协作协议(A2A);
- 宿主与前端应用 (MCP App) 之间的通信桥梁;
- 链路追踪的上下文传播与导出;
- 可复用标准化操作规程 (可复用标准化操作规程)

`code/main.py`利用纯Python 函数与字典使上述边界清晰可见――它不开网络监听、不真实请求 arXiv、不执行实际OAuth 握手、不调用远程A2A 服务、不染 MCP App,也不向外导远测数据――这使得控制流程极易单步排查和理解,同时避免将本地模拟误导为符合规范的生产服务――

## 概念

### 目标架构

```mermaid
flowchart LR
  U[User] --> C[Agent client]
  C --> G[Authorization gateway]
  G --> M[Research MCP server]
  M --> T[Search and report tools]
  M --> R[Resources and prompts]
  M --> Q[Task store]
  M --> A[A2A client]
  A --> W[Writer agent]
  M --> UI[MCP App resource]
  C --> O[Telemetry exporter]
  G --> O
  M --> O
  A --> O
```

这种结构是对公开标准协议模式的概念性组合,并不是任何单一专利产品的私人内部实现.

### 目标分布式追踪链路

```mermaid
flowchart TD
  I[agent.invoke_agent] --> SD[server/discover]
  I --> L1[llm.chat]
  I --> S[tools/call: arxiv_search]
  I --> D[A2A SendMessage]
  D --> X[Opaque writer-agent execution]
  I --> G[tools/call: generate_report]
  G --> K[tasks/get polling]
  K --> V[completed Task with final result]
  V --> UI[ui:// report resource]
  I --> L2[llm.chat final synthesis]
```

在真实生产中,每一个网络跳步都必须正确传播追踪上下文――Span 名称和属性必须严格遵循所选的OpenTelemetry 语义约定(语义约定) 版本――单纯拥有相同的跟踪ID 并不能证明父子关系构建、数据导出或后端成功摄取是正确的――

### 当前协议交互表面

使用当前最新规范定义的方法名称,绝不能沿用旧草案中的记忆:

| 边界 | 当前标准交互表面 | 本实战项目的本地模拟实现 |
|---|---|---|
| MCP 服务发现 | 强制性的 `server/discover` | 返回版本、capabilities 和服务器身份的直接函数 |
| MCP 请求上下文 | 每个 `params._meta` 均携带版本、capabilities 及客户端信息 | 传递给每次模拟调用的全新请求元数据 |
| MCP 工具调用 | `tools/call` | Python 本地函数直接分发 |
| MCP 任务轮询 | `io.modelcontextprotocol/tasks` 扩展与 `tasks/get` | 先返回处理中的任务句柄，后返回内联最终结果的完成任务 |
| A2A 跨代理委托 | gRPC 和 JSON-RPC 中为 `SendMessage`；HTTP+JSON 中为 `POST /message:send` | 无远程调用与人为延迟的单层嵌套 Span |
| MCP App 调用宿主工具 | `app.callServerTool({ name, arguments })` | 无实时通信桥梁的纯 HTML 字符串 |
| OAuth 鉴权 | 授权服务器、受保护资源元数据、Audience 与 Scope 校验 | 静态 Token 字典查找与 Scope 集合判断 |
| OpenTelemetry | SDK、传播器（Propagator）、导出器（Exporter）及收集器（Collector） | 纯内存 Span 字典数组 |

协议名称仅仅是最外层的表象.生产测试必须覆盖真实网络线缆上的序列化反序列化,认证失败,取消中断,超时重试以及协议多版本兼容性.

### 无状态MCP重构集成边界

`2026-07-28`修订版本 彻底移除协议会议以及`initialize`现在,`notifications/initialized`握手阶段──同时废除`Mcp-Session-Id`,每个请求都在`params._meta`中携带如下命名空间字段:

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {
    "extensions": {
      "io.modelcontextprotocol/tasks": {}
    }
  },
  "io.modelcontextprotocol/clientInfo": {
    "name": "capstone-client",
    "version": "1.0.0"
  }
}
```

服务端必须实现`server/discover`△常规结果使用`resultType: "complete"`;返回任务句柄时使用 `resultType: "task"`,每个结果都应在`_meta.io.modelcontextprotocol/serverInfo`中表示服务器自身身份──

任务 扩展包含 `tasks/get`,我知道.`tasks/update`及`tasks/cancel`◎ 工具首次调用可回归`resultType: "task"`后续轮询`tasks/get`现在回来了`resultType: "complete"`完成的状态`Task`项目中直接内联最终业务输出――旧版草案中`tasks/result`与`tasks/list`已被完全移除. 客户端必须在可能接受任务句柄的同一个请求中声明支持.`io.modelcontextprotocol/tasks`扩展;若未声明,服务端将返回`-32021`错误,并`requiredCapabilities`中明确指出缺失的扩张项目的

### 安全状况 (安全姿势)

预期的生产部署环境必须采用深度防御:

- 强制使用需要保护的客户端类型带有PKCE的 OAuth 授权;
- 为签发的访问令牌 强制实施资源 (资源) 与受众 (观众) 绑定;
- 网关基于角色严格核验被调用的工具与范围权限;
- 访问上游API的关键凭据严禁暴露在可见的模型上下文中;
- 严格锁定并审查工具 描述元数据清单(宣言);
- 针对不可信的输入,敏感数据与重大外部影响全面实施两人法则
- 在隔离的执行箱中限制文件系统,进程,网络,凭证和资源消耗,应限制在技能部强制生效.

本课例代码仅实现静态代币、范围校验以及描述哈希,旨在阐明策略流向,不能取代生产安全验证.

### 技能是操作规则,而不是网络传输

经纪人技能用于告诉运行时如何推进研究工作流,预期匹配哪些工具,合约,存留哪些过程审计证据以及何时终止任务.

```mermaid
flowchart TD
  RI[Repository instructions] --> H[Host runtime]
  SK[Agent Skill procedure] --> H
  H --> P[Invocation and permission policy]
  P --> MCP[MCP client adapter]
  P --> A2A[A2A client adapter]
  P --> EX[Sandboxed executor]
```

当操作规则需要引用配套资源文件时,必须以完整的技能目录形式发发行. 本课程早期交付的单个文件构件属于课程演示蓝图,不能作为主机支持通用程序包的证明.

### 课程产品元数据是本地适应器

本课程的目录索引和安装器能够识别名字`skill-*.md`课程的最简单的前面内容 解析器只能读取顶级一级键名.因此,本课程将可移植标准字段与课程专业字段保持在同级展开:

```yaml
---
name: ecosystem-blueprint
description: Produce a full Phase 13 ecosystem architecture for a product need.
version: "1.0.0"
phase: "13"
lesson: "23"
tags: [mcp, capstone, ecosystem, architecture, a2a, otel]
---
```

`name`与`description`是可移植标准的核心身份字段.`version`,我知道.`phase`,我知道.`lesson`和 `tags`面向课程编程目的扩展字段.`tags`写为单行内联数组,以便`--tag capstone`准确匹配.

标准可移植目录 技能可使用可选`metadata`字典存放自定义扩展数据. 但在本仓库单文件中,如果将`version`或`tags`嵌套缩写进写入`metadata`内部,极简解析器会直接忽略,导致无法提取版本号和标签过失效――生产主应使用严谨安全的YAML解析器并验证其正式声明的方案――

### 现实生产环境与本地模拟相比

| 架构分层 | `code/main.py` 实现 | 生产落地替换方案 | 必须出示的验收证据 |
|---|---|---|---|
| 服务发现 | `server_discover()` 加静态 `TOOLS` | `server/discover` 配合带缓存的 `tools/list` | 报文轨迹、确定性排序与 Schema 校验 |
| 身份认证 | 基于 Token 的内存字典 | 独立的 OAuth 授权服务器与资源服务器验证 | 签发者、受众、Scope、过期与故障降级测试 |
| 授权鉴权 | Scope 集合成员判定 | 绑定主体、tool、目标和租户的网关策略 | 允许与拒绝分支的完整审计日志用例 |
| 论文检索 | 静态论文测试夹具（Fixtures） | 真实检索 API 或专门的 MCP Server | 数据溯源、排序打分与网络异常测试 |
| 异步任务 | 本地句柄加立即 `tasks/get` | 持久化 `io.modelcontextprotocol/tasks` 存储，实现 get/update/cancel 与 TTL | 状态迁移、用户输入、取消及宕机恢复测试 |
| 跨 Agent 委托 | 本地 Sleep 加嵌套 Span | 真实的 A2A 客户端与远程 Agent Card | 契约校验、超时重试与不透明执行测试 |
| 前端交互 App | HTML 字符串与 URI 协议头 | MCP Apps 资源与官方 `App` 通信桥梁 | CSP 安全策略、权限受控、tool 调用与浏览器渲染测试 |
| 链路遥测 | 内存 Python 字典列表 | 完整的 OTel SDK 与远程导出器（Exporter） | 收集端接收凭证与父子 Span 关联断言 |
| 执行沙箱 | 无 | 宿主强制隔离的安全沙箱执行器 | 沙箱逃逸、出站网络、敏感凭证与资源上限测试 |

对于比较表构成工程交接的清晰边界.

### 第十三阶段 全景知识图谱

| 课次区间 | 核心贡献与架构职责 |
|---|---|
| 01-05 | Tool 接口标准、模型调用、Schema 设计、结构化输出及确定性校验 |
| 06-14 | 无状态 MCP 请求信封、服务发现、底层传输、资源、Prompt、扩展及 Apps |
| 15-18 | 防投毒安全防线、OAuth 鉴权、网关路由、Registry 准入及生产部署落地 |
| 19 | A2A 协议：跨代理的消息传递与异步任务协作 |
| 20 | 基于 OpenTelemetry 的 GenAI 分布式链路追踪设计 |
| 21 | 面向大模型供应商的智能路由与降级分流层 |
| 22 | 可移植 Agent Skill 契约规范与运行时安全边界 |

```figure
t3-capstone-chain
```

## 动手构建

运行进程内综合实战模拟脚本:

```bash
cd phases/13-tools-and-protocols/23-capstone-tool-ecosystem
python3 code/main.py
```

重点审查以下六大关键特征:

1. `server/discover`正确向外声明了`2026-07-28`协议版本以及任务扩展能力.
2. 爱丽丝能够顺利读取论文并生成报告,而勃却坚决拒绝了写入范围的请求.
3. 同一编排执行轮次下所有本地 Span 均共享唯一的Trace ID,并准确记录了父级 Span ID.
4. 报告生成操作首先返回任务句柄.`tasks/get`返回完成任务,其最终结果同时包含总结文本与`ui://`资源引用
5. 编辑器只记录外部跨界调用 Span──
6. 控制台输出没有冒充发生了真实网络请求,OAuth 换标,遥测收集器网络导出,浏览器染染或沙箱隔离.

脚本会连续执行两次,分别生成两条独立的根追踪链路――审计日志完全保存在本地内存中,进程退出即重置――

## 使用它

按部就班将模拟层替换为生产级真实组件:

1. 将`server_discover()`和静态工具 列表替换为标准的 `server/discover`与`tools/list`网络请求――在每个请求中完整携带协议版本、客户端身份和能力――
2. 将静态代币字典替换为遵循RFC标准的独立授权服务器与受保护资源验证中间件.
3. 完整接入`io.modelcontextprotocol/tasks`扩展,测试`tasks/get`,我知道.`tasks/update`,我知道.`tasks/cancel`、超时时间、TTL 清理及恢复进程──坚决不增加废弃的`tasks/result`或`tasks/list`,我知道.
4. 将委托编写代码的代码替换为能够动态解析代理卡并发送消息的真实A2A客户端.
5. 使用官方SDK 开发前端交互应用程序,通过 `app.callServerTool`规范发起反向工具调用.
6. 将 Span 导出至测试收集器,在收集端核验
7. 将所有工具调用和脚本执行纳入第26课规范的沙箱安全容器中运行.
8. 通过第27课程的发布准入禁令.

每次换层,都必须为其编写跨越这个实体边界的集成测试.

## 交付它

本课交付 `outputs/skill-ecosystem-blueprint.md`是单文件架构蓝图,要求在一页幅内完整阐述基本构件的选择类型,安全状况,跨代理委托,可观测性遥测,包装结构编排以及最严峻的运维风险.

由于它是单文件蓝图,因此无法携带参考,脚本,资产或评估测试例.

## 课后深度练习

1. 运行`code/main.py`仔细别控制台输出中已在本地验证的事实,以及在生产中仍需要表现出真实集成测试证据的断言.
2. 在模拟器中增加第二静态后端,定义两个同名工具 发生命名冲突时的解决规则.`tools/list`调用.
3. 将编写代理的代码替换为真实的A2A测试服务器.记录并审查代理卡.消息请求报文.超时异常分支以及返回的成果.
4. 为任务状态开发可跨进程重启持久的存储层.`tasks/get`恢复执行 遵守`pollIntervalMs`轮询间隔,并不依赖`tasks/result`根据完成任务的最终产品直接读取.
5. 构建一个简单的MCP应用程序,在严格的CSP和明显权限策略的真实浏览器环境中验证`app.callServerTool`连通性.
6. 将模拟生成的 Span 通过 OpenTelemetry SDK 导出到本地真实运行的收藏器 实例中――在收集端断言验证数据接收状态、追踪ID 连续性、父子继承关系与错误标记――
7. 分别编写一个用于规范全局研发规范的`AGENTS.md`详细说明为什么这两份说明文件均没有授权直接调用工具的特权.

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|---|---|---|
| 实战项目（Capstone） | "把所有东西串起来" | 分阶段构建的集成系统，其本地模拟与真实线上边界保持绝对清晰 |
| 协议形态模拟（Protocol-shaped simulation） | "差不多就是个 MCP" | 在本地构建的与协议数据结构高度相似的代码，但未实现底层的网络传输契约 |
| Tasks 扩展 | "长耗时 tool 调用" | 可选的 `io.modelcontextprotocol/tasks` 扩展规范，定义了持久化标识、轮询、客户端补全、最终结果与取消机制 |
| 不透明边界（Opacity boundary） | "丢给另一个 agent 处理" | 调用方仅能看到公开声明的接口与交付成果，无法窥探其内部思维链与私有状态 |
| 运行时适配器（Runtime adapter） | "接入 Skill 的胶水代码" | 宿主层负责将通用可移植的操作规程映射到服务发现、交互调用、工具权限、安全策略及上下文管理的代码 |
| 集成证据（Integration evidence） | "测试跑通了" | 完整的报文日志、交付产物或接收端实测数据，确凿证明系统跨越了真实的物理边界 |

## 延伸阅读

- [MCP 2026-07-28 核心规范](https://modelcontextprotocol.io/specification/2026-07-28)- 深入掌握无状态请求"",服务发现"",工具调用"",识别权及底层传输规范.
- [MCP 2026-07-28 关键变更日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)了解会话移除、逐请求元数据、MRTR、官方扩张及废弃特性的发展细节.
- [MCP Tasks 扩展规范草案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)- 学习`tasks/get`,我知道.`tasks/update`,我知道.`tasks/cancel`及任务终端结果的完整转变机制.
- [MCP Apps 官方 SDK](https://github.com/modelcontextprotocol/ext-apps/blob/main/docs/overview.md)- 掌握`App`类及`app.callServerTool`现在,我们要做什么?
- [A2A 跨代理协议最新规范](https://a2a-protocol.org/latest/)了解代理卡,消息传递,任务协作,工件交付及网络传输绑定权限标准.
- [OpenTelemetry GenAI 语义约定](https://opentelemetry.io/docs/specs/semconv/gen-ai/)- 遵循行业统一的AI链路追踪与属性命名标准.
- [Agent Skills 规范官方文档](https://agentskills.io/specification)- 掌握本实战项目中规则的抽象层次所依赖的可移植包结构契约.
