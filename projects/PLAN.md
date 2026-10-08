# 实战项目架构规划（Projects Section Plan）

实战项目模块将课程中学习到的独立机制串联为实用的工程工具。它是一个独立的阶梯式目录，拥有与整个课程一致的视觉设计语言、交互式 SVG 原理图、AI 导师学习流以及严格显式的自动化验证体系。

## 交付规范（Delivery contract）

每个已就绪项目均包含 4 到 8 个由浅入深的有序阶段、真实完整的参考实现、刻意留空的学习者初始脚手架（starter）、针对学习者工作区的确定性测试套件、原创技术解析、每个阶段配套的机制原理图以及实际运行/输出的动图演示。就绪状态校验会全面检查文件路径、阶段一致性、图示注册和演示多媒体。评测器独立调用对应的语言工具链；空测试套件绝不判定为通过。

- Python 负责数据解析、面向模型的流程协同以及评测逻辑。
- Rust 负责有界解析器、搜索循环、策略工具以及终端交互界面。
- TypeScript 负责类型化契约、浏览器端产物及工作流界面。
- Go 负责高并发 Worker、服务网关、任务队列及面向网络的工具。
- 混合语言项目之间采用显式子进程或换行分隔的 JSON 契约通信。

## 五级进阶阶梯

1. Starter（入门基石）：单个实用的输入/输出工具及其核心输入输出契约。
2. Builder（构建专家）：串联多个机制的核心数据与处理流水线。
3. Engineer（工程攻坚）：状态持久化、预算配额、失败重试与量化评测体系。
4. Systems（系统架构）：协议边界、并发控制、工具安全策略与系统进程监管。
5. Frontier（前沿探索）：可复现的对比实验、分布式评测、浏览器自动化控制及分布式链路追踪诊断。

项目被定位为边界明确的教学与实战工具，而非万能的企业级生产系统。预估时间仅反映完成各阶段所需耗时；生产级加固与真实外部环境对接属于后续扩展范畴。

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

## 规划中的扩展（Planned expansion）

目录现包含 100 个条目：横跨五个等级的 48 个已就绪项目与 52 个规划项目。[ROADMAP.md](ROADMAP.md) 详细列出了每个规划项目的实用产出、先修要求、首个演示原型概念及四个预期里程碑。`roadmap.json` 为网站上的规划卡片提供数据支撑。只有在完全满足代码实现、教学文档、单元测试、机制图和实录动图规范后，规划项目才会转变为就绪状态。

## 旗舰试点项目：深度研究报告 Agent（Research Report Agent）

该试点项目涵盖 7 个阶段与 3 种语言：Rust 负责实现基于换行分隔 JSON 通信的 BM25 搜索；Python 负责精确提取 Unicode 源码跨度、规划切面、编写带引用的断言、校验凭据、施加预算约束并计算评测指标；TypeScript 负责校验研报数据契约，并渲染带悬浮/聚焦引用展示及可展开运行链路追踪的交互式 HTML 报告。

其核心评测器包含原生 Rust 和 TypeScript 测试，以及防注入和缓存边界回归测试套件。评测凭证包含所提供的测试集与细粒度评分组件；所得分数忠实描述在该测试集上的表现，而非未见生产环境的泛化准确度。演示录像展示了初始模板报错、参考答案通过测试，以及在真实浏览器中检查报告证据链的过程。

## 完成认证与社区贡献

进度复选框是存储在本地浏览器中的学习记录。认证证书要求生成一份与项目清单完全匹配、且通过 `--strict` 检查的学习者完整报告，并明确标明为本地社区自证。通过核心阶段不代表默认掌握可选 SDK。贡献者保留原创署名；社区提交的项目遵循完全一致的就绪门禁与评测契约。

## 验证与发布

共享构建流程会将文档与媒体资源打包到站点输出中。CI 自动化校验清单文件、评测契约、证书以及每个参考阶段。浏览器测试覆盖桌面端/移动端、明暗主题、阶段导航、交互图示挂载、演示录像和证书导入。功能 PR 是代码审查的边界；部署与合并保持为独立的操作流程。

## 原创性与参考文献

所有实现与课后练习均为原创。在解析底层机制时，准确引用一手学术论文、官方 API 文档与技术规范。严禁抄袭任何外部课程仓库。第三方框架名称仅在被显式用于实现与测试特定集成时方予提及。
