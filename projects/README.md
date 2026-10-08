# 实战项目（Projects）

从零开始构建实用的 AI 工程工具，一步一个阶段进行严格测试。目录包含覆盖 Python、Rust、TypeScript 和 Go 四种语言的 100 个项目：48 个已就绪（Ready）可直接构建，52 个在[规划路线图](ROADMAP.md)中。

每个已就绪项目均包含一套可运行的参考实现、学习者初始脚手架（starter）、渐进式阶段测试、机制原理图、技术解析以及录制的运行/输出 GIF 动图。核心测试全部使用本地 fixture 夹具，无需任何模型 API Key 或凭据。可选的框架对比项目使用真实 SDK 配合确定性的 Mock 模型。规划中的项目已明确预期成果与学习里程碑；其具体实现与验收测试将在后续逐步推出。

## 快速开始

```bash
python3 scripts/project_test.py semantic-notes-search --list
python3 scripts/project_test.py semantic-notes-search --init my-semantic-notes-search
python3 scripts/project_test.py semantic-notes-search --stage 1 --path my-semantic-notes-search
```

环境要求：Python 3.12+、Node 22.18+（用于 TypeScript）、rustc 2021 edition 以及 Go 1.23+。只需安装目标项目语言徽章所需的工具链。参考答案仅供教学与对齐使用：

```bash
python3 scripts/project_test.py research-report-agent --all --solution --strict
python3 scripts/project_test.py --all --solution --strict --report project-results.json
```

网站使用 `node site/build-projects.js --strict` 构建。它会将项目课程和录像打包为静态托管资产，因此预览分支不依赖尚未发布的 GitHub main 分支文件。

## 借助 AI Agent 进行学习

在 Claude Code 中，使用 `/build-project <id>`。在 Codex 或其他兼容的宿主环境中，要求其为指定项目调用 `build-project` skill。Agent 导师会按阶段分步教学：预测行为（predict）、动手构建（build）、运行测试（test）、深入反思（reflect），并在本地的 `PROJECTS-LEARNING.md` 中为你记录学习笔记。

## 完成证明（Completion Evidence）

```bash
python3 scripts/project_test.py semantic-notes-search --all --strict --path my-semantic-notes-search --report completion.json
```

在项目页面导入 `completion.json` 并输入姓名，即可下载可打印的 HTML 认证证书。每个阶段必须全部通过且测试用例数大于零、无跳过项。参考答案、不完整运行以及过期的清单哈希均无法获得有效证书。该证书为本地、自主验证的社区课程记录，非监考或厂商认证凭据。可选的 SDK 验证与核心完成判定独立分离。

## 已就绪项目目录

| 项目 | 等级 | 编程语言 | 阶段数 | 预估耗时 |
|---|---|---|---|---|
| [Dataset Split Auditor (数据集切分审计器)](dataset-split-auditor/) | 1 | Python | 4 | ~8h |
| [JSON Schema Output Guard (输出格式守卫)](json-schema-output-guard/) | 1 | TypeScript | 4 | ~8h |
| [Prompt Regression Tester (Prompt 回归测试器)](prompt-regression-tester/) | 1 | Python | 4 | ~8h |
| [Semantic Notes Search (语义笔记搜索)](semantic-notes-search/) | 1 | Python | 4 | ~8h |
| [SKILL.md Validator and Loader (Skill 校验与加载器)](skill-validator/) | 1 | Rust | 4 | ~8h |
| [Tiny Coding Agent (微型代码 Agent)](tiny-coding-agent/) | 1 | Python | 4 | ~8h |
| [Token Counter and Cost Meter (Token 计数与成本计量器)](token-counter-and-cost-meter/) | 1 | Rust | 4 | ~8h |
| [Calendar Focus Planner (日程专注规划器)](calendar-focus-planner/) | 2 | TypeScript | 4 | ~8h |
| [Changelog Writer From Git (Git 变更日志生成器)](changelog-writer-from-git/) | 2 | Go | 4 | ~8h |
| [CSV Question Workbench (CSV/SQL 问答工作台)](csv-sql-question-workbench/) | 2 | Python | 4 | ~8h |
| [Document Extraction Review Desk (文档抽取评审工作台)](document-extraction-desk/) | 2 | Python | 4 | ~8h |
| [Document QA With Citations and LangChain (带引用的文档问答)](doc-qa-with-citations/) | 2 | Python | 4 | ~8h |
| [Feedback Theme Board (用户反馈主题看板)](feedback-theme-board/) | 2 | TypeScript | 4 | ~8h |
| [Inbox Triage Desk (收件箱分流工作台)](inbox-triage-desk/) | 2 | Python | 4 | ~8h |
| [Incident Postmortem Writer (事故复盘报告生成器)](postmortem-writer/) | 2 | Go | 4 | ~8h |
| [Local Model Evaluation Harness (本地模型评测框架)](local-model-eval-harness/) | 2 | Python | 4 | ~8h |
| [Meeting Notes to Actions (会议纪要转行动项)](meeting-notes-to-actions/) | 2 | Python | 4 | ~8h |
| [PR Review Reporter (PR 评审报告生成器)](pr-review-reporter/) | 2 | Python, TypeScript | 4 | ~8h |
| [Research Report Agent (深度研究报告 Agent)](research-report-agent/) | 2 | Rust, Python, TypeScript | 7 | ~20h |
| [Retrieval Evaluation Lab (检索评测实验台)](retrieval-evaluation-lab/) | 2 | Python | 4 | ~8h |
| [Skill Router (Skill 意图路由器)](skill-router/) | 2 | TypeScript | 4 | ~8h |
| [Source-Grounded Study Coach (基于权威材料的学习教练)](source-grounded-study-coach/) | 2 | TypeScript | 4 | ~8h |
| [Agent Budget Planner (Agent 预算规划器)](agent-budget-planner/) | 3 | Python | 4 | ~8h |
| [Agent Trace Debugger (Agent 追踪调试器)](agent-trace-debugger/) | 3 | TypeScript | 4 | ~8h |
| [Cross-Agent Skill Installer (跨 Agent Skill 安装器)](skill-installer/) | 3 | TypeScript | 4 | ~8h |
| [Harness Bench (评测套件基准测试)](harness-bench/) | 3 | Go | 4 | ~8h |
| [LLM Gateway With Fallbacks (带容灾降级的 LLM 网关)](llm-gateway-with-fallbacks/) | 3 | Go | 4 | ~8h |
| [Multi-Agent Code Review Panel (多 Agent 代码评审委员会)](multi-agent-code-review-panel/) | 3 | TypeScript | 4 | ~8h |
| [Persistent Memory Server (持久化记忆服务器)](memory-server/) | 3 | TypeScript, Rust | 4 | ~8h |
| [RAG Freshness Pipeline (RAG 数据时效流水线)](rag-freshness-pipeline/) | 3 | Python | 4 | ~8h |
| [Report Judge (研报质量裁判)](report-judge/) | 3 | Python | 4 | ~8h |
| [Self-Correcting Workflow Hooks (具备自我修正的工作流 Hooks)](workflow-hooks/) | 3 | TypeScript | 4 | ~8h |
| [Skill Supply-Chain Scanner (Skill 供应链安全扫描器)](skill-scanner/) | 3 | Rust | 4 | ~8h |
| [Support Agent With Google ADK (基于 Google ADK 的客服 Agent)](support-agent-with-google-adk/) | 3 | Python | 4 | ~8h |
| [Typed Workflow Agent with Mastra (基于 Mastra 的类型化工作流 Agent)](typed-workflow-agent-with-mastra/) | 3 | TypeScript | 4 | ~8h |
| [Visual Evidence Library (视觉证据库)](visual-evidence-library/) | 3 | Python | 4 | ~8h |
| [Voice Note Transcriber Pipeline (语音备忘录转写流水线)](voice-note-transcriber-pipeline/) | 3 | Python | 4 | ~8h |
| [Web Change Brief (网页变更简报器)](web-change-brief/) | 3 | Go | 4 | ~8h |
| [Cloud Agent With AWS Strands (基于 AWS Strands 的云资源 Agent)](cloud-agent-with-aws-strands/) | 4 | Python | 4 | ~8h |
| [Desktop Control Backend (桌面控制后端)](desktop-control/) | 4 | Rust | 4 | ~8h |
| [Durable Agent Jobs (持久化 Agent 任务调度器)](durable-agent-jobs/) | 4 | Go | 4 | ~8h |
| [MCP Tool Discovery Workbench (MCP 工具发现工作台)](mcp-at-scale/) | 4 | Python, TypeScript | 5 | ~10h |
| [Sandbox Policy Planner (沙箱策略规划器)](sandbox-ladder/) | 4 | Rust | 4 | ~8h |
| [Streaming Agent Shell in Rust (Rust 流式 Agent Shell)](rust-agent-shell/) | 4 | Rust | 4 | ~8h |
| [Tool Call Firewall (工具调用防火墙)](tool-call-firewall/) | 4 | Rust | 4 | ~8h |
| [Browser Agent (浏览器自主交互 Agent)](browser-agent/) | 5 | TypeScript, Python | 4 | ~8h |
| [Distributed Eval Farm Coordinator (分布式评测集群协调器)](distributed-eval-farm/) | 5 | Go | 4 | ~8h |
| [Self-Improving Skill Loop (自我演进 Skill 闭环)](self-improving-skill-loop/) | 5 | Python | 4 | ~8h |

## 路线图（Roadmap）

[52 个规划项目](ROADMAP.md)覆盖全部五个等级，涵盖实际应用、数据与多模态工作流、开发者工具、DevOps 以及前沿 Agent 架构。每个项目简报均清晰列出交付物、先修条件、首次演示以及四个阶段性里程碑。网站将这些卡片标记为计划中（planned），不计入已完成阶段或证书认证。

## 构建你能真正日常使用的应用程序

应用赛道新增八个实用项目：CSV 问答工作台、文档抽取评审工作台、日程专注规划器、用户反馈主题看板、收件箱分流工作台、基于权威材料的学习教练、视觉证据库以及网页变更简报器。每个项目均能接收你的真实输入，并导出可审查的产物，如 HTML、JSON、iCalendar 或未发送的邮件草稿。

从标明的先修条件开始，运行本地 fixture，修改一项输入并预测结果。随后在自己的工作区中实现各个阶段。可编辑的机制原理图会实时展示中间状态；全绿的测试用例和明确的边界约束，能让其他开发者非常轻松地集成你的产物。

## 框架对比（Framework Comparisons）

文档问答项目使用 LangChain 进行文本切分与模型接口封装；支持路由项目使用 Google ADK 演示真实的专家 Agent 交接；云端巡检项目使用 AWS Strands 配合本地模型，并将实际云调用设为 opt-in 可选；类型化工作流项目将手写执行器与 Mastra 框架进行横向对比。引入第三方框架仅针对上述具体场景；标准库实现全程清晰可见。

所有四个框架对比项目均详述了依赖安装方法，并支持 `--optional --strict`。缺少依赖模块时会输出跳过提示与安装指南；而在严格模式下则必须全部就绪。基于 Mock 模型的测试专注于验证 SDK 集成逻辑，而非依赖外部模型提供商的不可靠网络。

## 边界与证据（Scope and Evidence）

发布的 fixture 夹具均可直接审查，非黑盒秘密。评测分数仅反映在对应 fixture 上的表现，不代表生产环境的全面性能。沙箱规划项目专注于策略规划，不直接提供操作系统层面的内核隔离。桌面控制项目验证 fixture 后端，保持原生系统调用的显式可控。浏览器 Agent 除确定性 fixture 外还包含真实浏览器适配器。语音流水线包含真实 PCM 切片与 HTTP 多部分识别适配器；离线语音 fixture 则使用显式提供的标准参考转录本。

## 参与贡献

请参阅 [AUTHORING.md](AUTHORING.md) 与 [SUBMITTING.md](SUBMITTING.md)。复制 [_template/](_template/) 模板目录，编写原创且实用的成果，并添加能够验证学习者代码的阶段测试。
