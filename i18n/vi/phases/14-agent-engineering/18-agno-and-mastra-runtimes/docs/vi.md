# Agno và Mastra:生产 Runtime

> Agno (Python) 和 Mastra (TypeScript) là sản xuất năm 2026 Runtime 组合。Agno 目标是微秒级 Agent 实例化和无状态 FastAPI backend。Mastra 基于Vercel AI SDK 底层,提供 Agents、tools、workflows、统一模型路由和复合存储。

**Type:** Learn
**Languages:** Python, TypeScript
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 13 (LangGraph)
**Time:** ~45 minutes

## Học mục tiêu
- 识别 Agno's performance goals, cũng như những mục tiêu này quan trọng trong tình huống nào.
- Nói ra ba nguyên thủy của Mastra  Đại lý, Công cụ, dòng công việc  và các bộ chuyển đổi máy chủ hỗ trợ.
- 解释 tại sao không trạng thái n phiên Scope của FastAPI backend là n đề xuất Agno 生产路径
- 根据给定堆 选择 Agno 或 Mastra(Python-first vs TypeScript-first)。

## 问题
LangGraph、AutoGen、CrewAI đều có tính chất framework-heavy── muốn chỉ cần Agent loop, phải nhanh, và trong Runtime 里运行 của tôi 团队, sẽ chọn Agno (Python) hoặc Mastra (TypeScript)── cả hai đều sử dụng một phần của các nguyên thủy thuộc sở hữu framework để thay đổi tốc độ nguyên thủy, cũng như hợp tác chặt chẽ hơn với các đống xung quanh──

## 概念
### Agno

- Python Runtime, trước đây là Phi-data.
- Không có biểu đồ, chuỗi hoặc mô hình phức tạp. Chỉ có Python.
- Mục tiêu hiệu suất trong các tài liệu: khoảng 2μs Agent 实例化、 mỗi Agent 约 3.75 KiB bộ nhớ、 khoảng 23 nhà cung cấp mô hình。
- 生产路径:无状态、session-scoped 的 FastAPI backend── mỗi yêu cầu đều khởi động một Agent mới;session state 存在 DB 中──
- 原生 đa mô hình (text,image,audio,video,file) và RAG đại lý

Khi bạn có hàng ngàn vòng đời ngắn mỗi giây (chỉ hàng ngàn vòng đời ngắn của một đại lý, những mục tiêu này rất quan trọng.

### Mastra

- TypeScript, được xây dựng trên Vercel AI SDK
- Ba nguyên thủy:**Agents****Tools**(Tý dạng vùng)**Workflows**
- Mô hình thống nhất Router  跨 94 个供应商的 3,300+ mô hình(2026 年 3 月) ⋅
- Thiết lập lưu trữ: bộ nhớ, dòng công việc, khả năng quan sát có thể kết nối với các nền khác nhau; khả năng quan sát quy mô 推 ClickHouse。
- Apache 2.0, nguồn gốc trong `ee/`Hiện nay sử dụng giấy phép doanh nghiệp có sẵn từ nguồn.
- 支持 Express、Hono、Fastify、Koa của máy chủ điều chỉnh; đối với Next.js 和 Astro 提供一流集成──
- 提供 Mastra Studio(localhost:4111) được sử dụng để debugging。
- 1.0 版本时(2026 年 1 月) có 22k+ GitHub sao 、300k+ mỗi tuần npm tải xuống。

### Định vị

两者都不是要成为 LangGraph──它们竞争的是:

- **Language fit.**Agno 面向 Python-first 团队;Mastra 面向 TypeScript-first。
- **Runtime ergonomics.**Agno = gần như không có chi phí trên;Mastra = 与 Vercel hệ sinh thái 集成──
- **Observability.**两者都集成 Langfuse/Phoenix/Opik(Lớp 24), nhưng Mastra Studio là bên đầu tiên。

### Khi nào để chọn mỗi

- **Agno** Python backend 大量短生命周期 Agent 强性能要求 FastAPI 团队
- **Mastra** TypeScript backend、Next.js / Vercel triển khai、统一 đa nhà cung cấp định tuyến mô hình、Zod-typed tools。
- **LangGraph**(Dạy 13) Khi trạng thái bền và lý luận biểu đồ rõ ràng quan trọng hơn tốc độ ban đầu.
- **OpenAI / Claude Agent SDK** Khi bạn muốn cung cấp 产品化后的形态时(Lớp 1617)。

### Mô hình này dễ dàng xuất hiện

- **Perf-for-perf's-sake.**Vì 2μs nghe có vẻ không sai khi chọn Agno, nhưng khối lượng công việc là mỗi yêu cầu một lần rất chậm gọi của đại lý.
- **Ecosystem lock-in.**Sự tích hợp hương vị Vercel của Mastra trong Vercel trên là phần chia, ở nơi khác có thể là phần chia giảm.
- **Enterprise license confusion.**Mastra của `ee/`目录 là nguồn sẵn có, không phải Apache 2.0... Nếu bạn có kế hoạch fork, xin hãy đọc giấy phép...


```figure
wb-runtime-spawn
```

##  xây dựng nó
Bài học này chủ yếu là đối chiếu  单一代码文物 无法公正呈现两个框架──参见`code/main.py`Trung's side-by-side toy: một最小的运行 Agent、stream output、persist session流程,实现了两次(一次Agnō形,一次Mastra形)

运行 nó:

```
python3 code/main.py
```

Tôi sẽ thấy 2 cấu trúc khác nhau nhưng các dấu vết của chức năng tương đương.

## Sử dụng nó
- **Agno** 需要速度和 FastAPI 形态的 Python backend──
- **Mastra** 拥有多个供应商和工作流原始的TypeScript backend──
- 两者都提供第一方可观看──两者都集成 Langfuse──

## 交付 nó
`outputs/skill-runtime-picker.md`会根据堆积,延迟预算和运营形状,在 Agno、Mastra、LangGraph或供应商 SDK中做选择──

## 练习
1. 阅读 Agno's docs──把 stdlib ReAct loop(Lesson 01) được chuyển đến Agno──What's disappeared?
2. 阅读 Mastra's docs──把同一个循环 移植到Mastra──工具打字中发生了什么变化(Zod vs. nothing)?
3. Định hướng: đo lường bạn xếp hàng trên của Agent  thí dụ hóa độ trễ.
4. 设计迁移: Nếu bạn đang hoạt động trong Python CrewAI, chuyển đến Agno 会破坏什么?
5. 阅读 Mastra của `ee/`Điều khoản giấy phép... Những hạn chế nào sẽ ảnh hưởng đến nguồn mở fork?

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
- [Agno Agent Framework docs](https://www.agno.com/agent-framework) 性能目标、FastAPI tích hợp
- [Mastra docs](https://mastra.ai/docs) nguyên thủy  máy chủ chuyển đổi  Mô hình Router
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Stateful-graph 替代方案
- [Comet Opik](https://www.comet.com/site/products/opik/) Mastra tích hợp 引用的可观性比较
