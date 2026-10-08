# 亚格诺和马斯特拉:生产运行时间

> Agno (Python) 和Mastra (TypeScript) 是2026年的生产运行时间组合.Agno 目标是微秒级代理.实例化和无状态的FastAPI后台.Mastra 基于Vercel AI SDK的底层,提供代理,工具,工作流程,统一模型路由和复合存储.

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## 学习目标
- 识别Agno的性能目标以及这些目标在什么场景下重要.
- 讲出Mastra的三个原始因素 代理商,工具,工作流程以及支持的服务器适配器.
- 解释为什么没有状态, 会议范围的FastAPI后台是推的Agno 生产路径.
- 根据给定堆 选择Agnor或Mastra(Python-第一vsTypeScript-第一) 』

## 问题
长图,自动生成,机组都偏偏框架重.只要要代理循环,要快,并且在我的运行时间里运行的团队,会选择Agn (Python) 或Mastra (TypeScript) .

## 概念
### 果

- ,这是一个Python运行时间,前身是Phy-data.
- 没有图,链条或复杂模式 只有纯字符串.
- 据报道,该公司的数据库中性能目标:约2μs 代理实例化,每一个代理约3.75KB内存,约23个模型提供商.
- 生产路径:无状态、会议范围的快API后台──每一个请求都启动一个新的代理;会议状态 存在 DB 中──
- 原生多模特的文字,图像,音频,视频,文件) 和机器人RAG──

当你每秒有数千个短生命周期的代理时,这些速度目标很重要.

### 马斯特拉

- 类型字体,构建在Vercel AI SDK之上.
- 三个原始:**Agents**,我知道.**Tools**它们是的.**Workflows**,我知道.
- 统一型路由器  跨 94 个供应商的 3,300+ 型号(2026 年 3 月) ⋅
- 复合存储:记忆,工作流程,可观测可连接不同后台;规模化可观测 推 ClickHouse。
- 亚帕奇2.0源码中`ee/`目录采用可源的企业许可证.
- 支持Express、Hono、Fastify、Koa的服务器适配器;对Next.js 和 Astro提供一流的集成.
- 提供Mastra Studio (本地主机:4111) 用于调试.
- 版本时(2026年1月) 有22千+ GitHub星星、300千+ 每周每小时下载──

### 定位

两者都不是要成为LangGraph.

- **Language fit.**们的们都在们的们中.
- **Runtime ergonomics.**亚格诺=近乎零的空费;马斯特拉=与维尔塞尔生态系统集成.
- **Observability.**两者都集成 兰格斯/城/奥皮克 (Phoenix/Opik) 课24),但Mastra Studio是第一方.

### 选出每一个

- **Agno** Python 后台,大量短生命周期 代理,强性能要求,快API 团队.
- **Mastra**TypeScript后端、Next.js / Vercel部署、统一多提供商模型路由、Zod类型工具──
- **LangGraph**(课 13) 时长状态和显式图表推理比原始速度更重要时.
- **OpenAI / Claude Agent SDK** 当你想要提供商 产品化后的形态时(1617课)

### 这个模式很容易出错.

- **Perf-for-perf's-sake.**因为2μs听起来不错就选择了Agno,但工作负载是每个请求 一次很慢的代理调用.
- **Ecosystem lock-in.**在Vercel上是加分项,在别处可能是减分项.
- **Enterprise license confusion.**马斯特拉的`ee/`现在的版本是源源可用的,不是Apache 2.0.


```figure
wb-runtime-spawn
```

## 构建它
本课主要是对比性  单一代码文物 不公正呈现两个框架──参见`code/main.py`中的旁边玩具:一个最小的运行 代理 流输出 持续的会议 流程,实现了两次一次Agnō形,一次Mastra形)

运行它:

```
python3 code/main.py
```

看到两个不同的结构,但功能等价的痕迹.

## 使用它
- **Agno** 需要速度和快API 形态的Python后台──
- **Mastra** 拥有多个提供商和工作流原始的TypeScript后台──
- 两者都提供了第一方可观测.

## 交付它
`outputs/skill-runtime-picker.md`根据堆时间预算和运营形状,在Agno、Mastra、LangGraph或供应商SDK中做选择──

## 练习
1. 阅读Agnō的文件.把Stdlib ReAct循环移植到Agnō.
2. 阅读Mastra的文档――把同一个循环移植到Mastra――工具打字中发生了什么变化?
3. 测量您的堆上 Agent 实例化延迟――Agno 的 2μs 对您的工作负载 重要吗?
4. 设计迁移:如果你一直在Python中运行CrewAI,迁移到Agno会破坏什么?
5. 阅读 师父的`ee/`许可条款―― 什么限制会影响开源?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agno | “Fast Python agents” | 无状态、session-scoped 的 Agent Runtime |
| Mastra | “TypeScript agents on Vercel AI SDK” | Agents + Tools + Workflows + Model Router |
| Unified Model Router | “Multi-provider access” | 跨 94 个 providers、面向 3,300+ models 的单一 client |
| Composite storage | “Multiple backends” | Memory/workflows/observability 分别接入不同 store |
| Mastra Studio | “Local debugger” | 用于 introspecting Agents 的 localhost:4111 UI |
| Source-available | “Not OSS” | License 允许阅读 source，但限制 commercial use |

## 延伸阅读
- [Agno Agent Framework docs](https://www.agno.com/agent-framework) 性能目标 快速API集成
- [Mastra docs](https://mastra.ai/docs)原始设备,服务器适配器,路由器模型
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)国家图 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) 马斯特拉集成 引用的可观性比较
