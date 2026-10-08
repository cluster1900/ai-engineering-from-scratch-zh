# 案例研究与 2026 Nhà nước của nghệ thuật

> Ba trường hợp tham khảo cấp sản xuất đáng học từ đầu đến cuối, mỗi trường hợp cho thấy những khía cạnh khác nhau của kỹ thuật đa đại lý.**Anthropic's Research system**(Orchestrator-worker ∙ 15x token ∙相比单代理 Opus 4 +90.2% ∙ Rainbow deployments) là trường hợp giám sát điển hình ∙**MetaGPT / ChatDev**(Façãng hướng kỹ thuật phần mềm chuyên môn hóa vai trò mã hóa SOP; ChatDev của  giao tiếp dehallucination; MacNet  thông qua DAGs  mở rộng đến > 1000 đại lý,arXiv:2406.07155) là một trường hợp phân hủy vai trò điển hình.**OpenClaw / Moltbook**(Ban đầu là Clawdbot của Peter Steinberger, tháng 11 năm 2025; hai lần đổi tên; đến tháng 3 năm 2026 GitHub sao lên đến 247k; địa phương ReAct-loop đại lý;Moltbook  như một mạng xã hội chỉ cho đại lý, trên đường ngày có khoảng 2.3M tài khoản đại lý,2026-03-10 bị Meta mua lại) cho thấy quy mô dân số 下会发生什么: hoạt động kinh tế mới nổi 风险 风险 风险 州级 quy định(中国于 2026 年 3 月限制政府计算机使用OpenClaw)**Framework landscape April 2026:**LangGraph và CrewAI  dẫn đầu sản xuất;AG2 là cộng đồng tiếp tục AutoGen;Microsoft AutoGen  bước vào chế độ bảo trì(并 vào Microsoft Agent Framework,2026 年 2 月 RC);OpenAI Agents SDK là sản xuất Swarm kế nhiệm;Google ADK(2025 年 4 月) là A2A-native tham gia.

**Type:** 学习（capstone）
**Languages:** —
**Prerequisites:** Phase 16 全部内容（Lessons 01-24）
**Time:** 约 90 分钟

## 问题

Kỹ thuật đa đại lý vẫn là một môn học trẻ. Các tham chiếu sản xuất không nhiều, và mỗi trường hợp bao gồm các phần khác nhau của lĩnh vực này.

## 概念

### Hệ thống Nghiên cứu Nhân chủng

Người giám sát sản xuất-người làm việc 案例──Claude Opus 4 负责规划与综合;Claude Sonnet 4 người phụ trách 并行研究──已发布的工程文章:https://www.anthropic.com/engineering/multi-agent-research-system。

关键实测结果:

- Trong các nghiên cứu nội bộ đánh giá 上,相比单代理 Opus 4 提升 **+90.2%**
- **BrowseComp variance 的 80%**Chỉ có bởi**token usage**解释, cũng là chiến thắng của đa đại lý phần lớn đến từ mỗi người phụ nữ đều nhận được cửa sổ bối cảnh mới.
- So với đơn đại lý,**每个 query 使用 15x tokens**
- Vì các đại lý là lâu dài và có tình trạng, cần thiết**Rainbow deployment**

已固化的设计经验:

1. **根据 query complexity 缩放 effort。**简单 → 1 个代理,3-10 次 tool calls──中等 → 3 个代理──复杂研究 → 10+ subagents──
2. **先广后深。**Các nhà nghiên cứu  tiến hành tìm kiếm rộng rãi; dẫn đầu  tổng hợp; theo dõi các nhà nghiên cứu  tiến hành nghiên cứu sâu sắc có mục đích.
3. **Rainbow deploys。**保持旧运行时代版本 存活, cho đến khi chúng đang chạy đại lý 完成.
4. **Verification 不是可选项。**观察表明, nếu không có vai trò xác minh rõ ràng, hệ thống sẽ ảo giác.

Đây là quy mô sản xuất dưới topology người giám sát-người làm việc (Phase 16 · 05) là ví dụ tham khảo:

### MetaGPT / ChatDev

SOP sản xuất vai trò phân hủy 案例──涵盖 arXiv:2308.00352(MetaGPT) 和 arXiv:2307.07924(ChatDev)。

MetaGPT sẽ lập trình phần mềm SOP 编码为角色提示:Product Manager、Architect、Project Manager、Engineer、QA Engineer。`Code = SOP(Team)` Mỗi vai trò đều có một cách rất nhỏ, đặc biệt, các giao dịch giữa các vai trò truyền tải các vật thể cấu trúc (PRD)

ChatDev's đóng góp là:**communicative dehallucination** Các đại lý trong trả lời trước yêu cầu thông tin cụ thể, ví dụ đại lý thiết kế 会在绘制 UI 预问程序员 预期使用什么语言, thay vì đoán.

MacNet(arXiv:2406.07155) sẽ ChatDev 通过 **DAGs 扩展到 >1000 agents** Mỗi nút DAG là một chuyên môn vai trò; cạnh 编码 handoff contracts。之所以能够扩展, vì định tuyến là rõ ràng và có thể离线计算的。

设计经验:

1. **Structure 比 size 更重要。**Một nhóm SOP 5 vai thi đấu đã thắng một nhóm không cấu trúc của 50 đại lý.
2. **Handoff contracts 要写下来。**Vai trò 之间传递的文物 遵循方案──
3. **Communicative dehallucination**Đó là một mô hình chi phí thấp 承重型.
4. **DAGs 比 chat 更能扩展。**Khi nó chảy, hãy mã hóa nó ra.

Đây là ví dụ tham khảo về chuyên môn vai trò (Phase 16 · 08) và topology có cấu trúc (Phase 16 · 15)

### Hệ sinh thái OpenClaw / Moltbook

Sản xuất quy mô dân số 案例──时间线:

- **Nov 2025:**Clawdbot (đại diện mã hóa ReAct-loop) của Peter Steinberger) phát hành.
- **Dec 2025 – Mar 2026:**两次更名(Clawdbot → OpenClaw → 继续以 OpenClaw 运行) 』
- **Feb 2026:**Moltbook dựa trên cùng một bộ nguyên thủy như một mạng xã hội chỉ dành cho đại lý được phát hành; trong vài ngày có khoảng 2,3M tài khoản đại lý.
- **Mar 2026 (2026-03-10):**Meta 收购 Moltbook。
- **Mar 2026:**Trung Quốc giới hạn các máy tính chính phủ sử dụng OpenClaw.
- **Mar 2026:**OpenClaw  vượt qua 247k sao GitHub.

Điều này cho thấy khi bạn đưa hàng triệu đại lý vào phân tầng chia sẻ trên, nhiều đại lý sẽ như thế nào:

- **Emergent economic activity。**Các đại lý sử dụng tiền giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch giao dịch
- **Population scale 下的 prompt-injection 风险。**Một hồ sơ của một đại lý virus trong một cú phản ứng xấu, sẽ lây lan trong vài giờ đến hàng ngàn lần tương tác giữa đại lý và đại lý.
- **State-level regulatory response。**Trong vài tuần sau, quy định sẽ đưa ra hệ sinh thái này.

Trong trường hợp này, kinh nghiệm thiết kế là một phần về kỹ thuật, một phần là về quản lý:

1. **Population scale 的 multi-agent 是一种新 regime。**Các thực tiễn tốt nhất của hệ thống cá nhân (định rõ về vai trò của các nhà kiểm tra) vẫn còn áp dụng, nhưng đã không đủ.
2. **Prompt injection 是新的 XSS。**默认将 đại lý hồ sơ và các tin nhắn liên quan đến đại lý 视为 không tin cậy nhập cảnh.
3. **Regulation 比 design cycles 更快。**提前规划──
4. **Open-source + viral scale 会产生复合效应。**Trong khoảng 4 tháng đạt 247k sao không phải là điều thường; cần thiết để triển khai-bùng nổ-thực lượng 设计

参见 [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)Cũng như các báo cáo của CNBC / Palo Alto Networks về hiểu biết về hệ sinh thái 细节――技术基础方面,Clawdbot / OpenClaw repos 展示本地 ReAct loop;Moltbook's open posts 展示其上层社会图架构――

### Quang khung cảnh 2026 年 4 月

| Framework | Status | Best for | Notes |
|---|---|---|---|
| **LangGraph** (LangChain) | Production leader | structured graph + checkpointing + human-in-the-loop | production 推荐默认选择 |
| **CrewAI** | Production leader | role-based crews with Sequential/Hierarchical processes | 擅长 role decomposition |
| **AG2** | Community maintained | GroupChat + speaker selection | AutoGen v0.2 延续版本 |
| **Microsoft AutoGen** | Maintenance mode (Feb 2026) | — | 并入 Microsoft Agent Framework RC |
| **Microsoft Agent Framework** | RC (Feb 2026) | orchestration patterns + enterprise integration | 新 entrant；值得关注 |
| **OpenAI Agents SDK** | Production | Swarm successor | tool-return handoff pattern |
| **Google ADK** | Production (April 2025) | A2A-native | Google Cloud integration |
| **Anthropic Claude Agent SDK** | Production | single-agent + Research extension | 参见 Research system 文章 |

Bây giờ mọi khung chính đều cung cấp**MCP**hỗ trợ; đa số cung cấp **A2A**❖ Sự tương thích của giao thức không còn là yếu tố khác biệt.

### Mô hình chung trong 3 trường hợp

1. **Orchestrator + workers**(Anthropic's apparent supervisor,MetaGPT 中作为监督的 PM,OpenClaw's individual agents + network effects)
2. **结构化 handoff contracts**(Phần mô tả nhiệm vụ nhân tạo phụ thuộc vào người, tài liệu PRD/kiến trúc MetaGPT, các hiện vật OpenClaw A2A)
3. **Verification as first-class role**(Anthropic của xác minh viên, MetaGPT của QA Engineer, OpenClaw của validators trong mạng)
4. **Scaling 是 topology + substrate，而不只是更多 agents**(các hoạt động của cầu vồng, MacNet DAGs, các phụ kiện quy mô dân số)
5. **Cost 是实质性因素并且需要披露**(Tokens 15x Budget mỗi vai trò trong MetaGPT Moltbook trong Interaction pricing)
6. **Security posture 是显式的**(Anthropic's sandboxing、MetaGPT's role restrictions、OpenClaw sẽ được tiêm nhanh như là bề mặt tấn công đã biết)

### Để cho dự án tiếp theo của bạn chọn ví dụ tham khảo

- **Production research / knowledge task → Anthropic Research。**Các chất phụ trong bối cảnh mới 胜出。
- **工程 / 工具链工作流 → MetaGPT / ChatDev。**角色 + SOP + 交接契约。
- **Network-effect social product → OpenClaw / Moltbook。**Substrate + nền kinh tế mới nổi:
- **Classic enterprise automation → CrewAI 或 LangGraph**(Đội trưởng sản xuất, thời gian chạy ổn định)

### 2026 hiện đại nhất 总结

截至 2026 年 4 月, lĩnh vực này đang ở trạng thái sau:

- **Frameworks 正在趋同。**MCP + A2A hỗ trợ 已是基础门──Handoff ngữ nghĩa là còn lại dưới sự lựa chọn thiết kế──
- **Evaluation 正在变硬。**SWE-bench Pro、MARBLE、STRATUS giảm thiểu tiêu chuẩn──Pro 是当前污染-resistant 的现实检查──
- **Production failure rates 已可测量**(Cemri 2025 MAST; thực tế MAS lên lên đến 41-86.7%)  lĩnh vực này đã ra khỏi demo trông rất tuyệt vời của thời đại 
- **Cost 是核心工程约束。**Chi phí biểu tượng của mỗi nhiệm vụ, chi phí giao tiếp của mỗi giao dịch, chi phí triển khai của cầu vồng.
- **Regulation 是近期输入，不是背景关注点。**Các hành động của các khu vực pháp lý nhanh hơn so với các chu kỳ triển khai đơn lẻ.


```figure
a5-orchestrator-scale
```

## Sử dụng nó

`outputs/skill-case-study-mapper.md`là một kỹ năng, nó đọc một thiết kế hệ thống đa đại lý được đề xuất, và sẽ được mô tả vào nghiên cứu trường hợp gần nhất, đồng thời tiết lộ các quyết định thiết kế đã được chứng minh trong nghiên cứu trường hợp này.

## 交付 nó

2026 năm sản xuất đa đại lý của nhập cảnh quy tắc:

- **从 case study 出发，而不是从零开始。**Trong Nghiên cứu Nhân văn / MetaGPT / OpenClaw 中选择最接近的一个并进行适配.
- **采用 MCP + A2A。**跨框架的可移植性 很有价值; hỗ trợ giao thức là miễn phí.
- **用 SWE-bench Pro 或你的内部 Pro-equivalent 进行衡量。**Được xác minh 已被污染──
- **支付 verification tax。**Một kiểm tra độc lập sẽ tiêu tốn khoảng 20-30% ngân sách token, và thay đổi tính chính xác của phép đo.
- **对 long-running agents 使用 Rainbow deploy。**预期多小时代理运行 会成为常态――
- **阅读 WMAC 2026 和 MAST follow-ups。**Chuyên môn phát triển nhanh chóng.

## 练习

1. 端到端阅读 Antropic Research system 文章。 tìm ra ba quyết định thiết kế: Nếu bạn sử dụng mô hình nhỏ hơn (ví dụ như Haiku 4) thay thế Opus 4, những quyết định này sẽ thay đổi。
2. 阅读 MetaGPT Phần 3-4(arXiv:2308.00352)。把你自己领域中的一个SOP(不是软件)编码为角色提示──这个SOP 暗示了多少角色?
3. 阅读 ChatDev(arXiv:2307.07924)。识别 沟通性幻觉的机制──将其实现到你已经有一个多代理系统 中──
4. 阅读 OpenClaw 和 Moltbook。 chọn một trong số đó trên quy mô dân số dưới đây xuất hiện, nhưng sẽ không xuất hiện trong chế độ thất bại cụ thể trong hệ thống 5 đại lý── bạn sẽ làm thế nào để được xây dựng để phòng ngừa nó?
5.  chọn bạn hiện tại dự án đa đại lý  Ba nghiên cứu trường hợp nào là tài liệu tham khảo gần nhất? trong nghiên cứu trường hợp này có những quyết định thiết kế nào bạn chưa áp dụng? viết một quyết định tiếp theo bạn sẽ áp dụng trong mùa này 

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Anthropic Research | “supervisor reference” | Claude Opus 4 + Sonnet 4 subagents；15x tokens；相较 single-agent +90.2%。 |
| MetaGPT | “SOP as prompts” | 面向 software engineering 的 role decomposition；`Code = SOP(Team)`。 |
| ChatDev | “Agents as roles” | Designer / programmer / reviewer / tester；communicative dehallucination。 |
| MacNet | “Scale ChatDev via DAG” | arXiv:2406.07155；通过显式 DAG routing 实现 1000+ agents。 |
| OpenClaw | “Local ReAct-loop agents” | Steinberger 的项目；到 2026 年 3 月达 247k stars。 |
| Moltbook | “Agent-only social network” | 2.3M agent accounts；2026 年 3 月被 Meta 收购。 |
| Rainbow deploy | “Multiple versions concurrent” | 为 in-flight long-running agents 保持旧 runtime versions 存活。 |
| Communicative dehallucination | “Ask before answering” | Agents 向 peers 请求具体信息，而不是猜测。 |
| WMAC 2026 | “The AAAI workshop” | 2026 年 4 月 multi-agent coordination 社区焦点。 |

## 延伸阅读

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Khán giả giám sát nhân viên
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) Sự phân hủy vai trò SOP
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) Tự giải ảo giác truyền thông
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155) 基于DAG规模
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) tổng quan hệ sinh thái
- [WMAC 2026](https://multiagents.org/2026/)Hội thảo Chương trình Cầu AAAI 2026 về Hợp tác đa đại lý
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Lãnh đạo sản xuất
- [CrewAI docs](https://docs.crewai.com/en/introduction) Quản lý dựa trên vai trò
