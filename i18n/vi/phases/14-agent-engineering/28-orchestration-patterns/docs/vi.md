# 编排模式: Giám sát, Swarm, Đường bậc

> Trong khuôn khổ năm 2026 có 4 kiểu tổ chức: giám sát viên-người làm việc, nhóm người / người đồng nghiệp, phân cấp, tranh luận, triết lý.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Giai đoạn 14 · 12 (Tình mẫu lưu lượng làm việc), Giai đoạn 14 · 25 (Vấn đề đa tác nhân)
**Time:** ~60 分钟

## Học mục tiêu
- Nói về bốn kiểu tổ chức lặp lại, cũng như mỗi cảnh thích hợp.
- mô tả 2026 năm LangChain's khuyến nghị: dựa trên sự giám sát của công cụ-call, chứ không phải các thư viện giám sát.
- 解释 Antropic của  cấu trúc正确系统规则, cũng như làm thế nào nó ràng buộc topology 选择──
- Sử dụng STDlib, dựa trên một văn bản LLM thực hiện tất cả bốn mô hình.

## 问题
Nhóm thường rất mong muốn sử dụng nhiều đại lý trước khi có nhu cầu thực sự. Có bốn mô hình sẽ xuất hiện lặp đi lặp lại trong các khung khác nhau; một khi bạn có thể nói ra chúng, bạn có thể chọn đúng một, hoặc hoàn toàn bỏ qua các topology.

## 概念
### Nhân viên giám sát

- Một trung tâm định tuyến LLM phân bổ nhiệm vụ cho các đặc vụ chuyên nghiệp.
- Các quyết định bao gồm: quay lại vòng lặp của mình, chuyển giao cho chuyên gia, kết thúc.
- Các chuyên gia không giao tiếp với nhau; tất cả các tuyến đường đều qua giám sát.

框架:LangGraph `create_supervisor`、Thông nhân dàn nhạc nhân tạo 、CrewAI Quá trình Trật tự──

**2026 LangChain 建议：**Thông qua các công cụ trực tiếp gọi làm giám sát, thay vì sử dụng`create_supervisor` như vậy bạn có thể có được kỹ thuật ngữ cảnh chi tiết hơn  kiểm soát, bạn có thể xác định chính xác mỗi chuyên gia  xem cái gì 

### Swarm / peer-to-peer

- Các đại lý 通过共享的工具表面 直接交手――
- Không có router trung tâm.
- 延迟低于监督员 hop 更少)
- 更难推理(没有单一控制点)

框架:LangGraph swarm topology、OpenAI Agents SDK handoffs(当所有代理都可以交给所有其他代理时)

### Đường bậc

- Giám sát viên  quản lý phụ giám sát viên, phụ giám sát viên 再管理员工──
- Trong LangGraph thực hiện cho các tiểu hình tổ; trong CrewAI thực hiện cho các phi hành đoàn tổ.
- 能 mở rộng đến đại lý quy mô lớn, nhưng chi phí là vận hành phức tạp hơn.

何時需要:当单个监督人的背景预算 无法容纳所有专家的描述时──

### Cuộc tranh luận

- Và đã đưa ra những đề xuất + 代 phản đối đối nhau (Dân học 25)
- nghắn nói không phải là dàn xếp, hơn như xác minh, nhưng trong khuôn khổ thường xuất hiện như một topology  chọn lựa.

### CrewAI Crew vs Flow

CrewAI đã hình thành hai mô hình triển khai:

- **Flow**Sử dụng cho tự động hóa do sự kiện xác định (động cơ tự động hóa)
- **Crew**Sử dụng sự hợp tác dựa trên vai trò của tự chủ.

Nó tương tự như bốn mô hình trên, nhưng sẽ được phân tích theo topology: Flow thường là giám sát hoặc cấp bậc; Crew thường là giám sát của LLM router.

### Hướng dẫn của Anthropic

Thành công trong lĩnh vực LLM không phải là xây dựng các hệ thống phức tạp nhất, mà là xây dựng các hệ thống đúng cho nhu cầu của bạn.

决策顺序:

1. 单个代理 + quy mô quy trình làm việc (Lớp 12) 从这里开始──
2. Người giám sát làm việc  Khi bạn có 2-4 chuyên gia 时。
3. Swarm  当延迟比推理清晰度更重要时──
4. Các cấp bậc  只有当监管背景预算 不足时。
5. Cuộc tranh luận  Khi tỷ lệ xác thực quan trọng hơn chi phí 

### Mô hình này dễ dàng xuất hiện ở nơi

- **Topology-first thinking.**Trong việc nhận dạng đa đại lý  giải quyết những vấn đề trước, nói rằng chúng ta cần đa đại lý ──
- **Bouncing handoffs in swarm.**A -> B -> A -> B。 sử dụng máy tính đếm hop。
- **Fake hierarchy.**Vì doanh nghiệp có 3 tầng; thực tế chỉ có 2 nhóm.


```figure
orchestration-pattern
```

##  xây dựng nó
`code/main.py`Sử dụng STDlib, dựa trên kịch bản LLM thực hiện tất cả bốn mô hình:

- `Supervisor` Trung tâm router
- `Swarm` 带直接交付的同行对同行──
- `Hierarchical` giám sát viên của giám sát viên
- `Debate` 并行 đề xuất + chỉ trích

Mỗi mô hình xử lý cùng một nhiệm vụ.

运行:

```
python3 code/main.py
```

输出: mỗi loại mô hình theo dõi + op đếm.

## Sử dụng nó
- **LangGraph**用于 giám sát và phân cấp
- **OpenAI Agents SDK**dùng trên hình người giám sát.
- **CrewAI Flow**Sử dụng cho môi trường sản xuất xác định.
- **Custom**Để tranh luận, hoặc khi bạn muốn kiểm soát chính xác.

## 交付 nó
`outputs/skill-orchestration-picker.md` chọn một topology và thực hiện nó.

## 练习
1. Bằng cách di chuyển router, chuyển một người giám sát làm việc thành đám đông...
2. 给群 添加跳计:3 lần giao hàng 后拒绝──它能捕捉 A->B->A 的反复跳转吗?
3. Để xây dựng một lĩnh vực chuyên môn 12 tầng hệ thống phân cấp. Không có tổ, ngân sách ngữ cảnh sẽ thất bại ở đâu?
4. Trong gần sản xuất hình thức tải trọng làm việc trên hồ sơ 四种模式──哪种在什么指标上胜出(延迟,成本,精度,可调试性)?
5. 阅读 Anthropic's Building Effective Agents 文章──把你的每一个生产流流 映射到四种模式之一──有没有不能干净映射的吗?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor-worker | “Router + specialists” | 中心 LLM 分派给 specialists；它们彼此不通信 |
| Swarm | “Peer-to-peer” | 通过共享 tools 直接 handoffs；没有中心 router |
| Hierarchical | “Supervisors of supervisors” | 面向大规模群体的 nested subgraphs |
| Debate | “Proposer + critique” | 并行 proposers，cross-critique（Lesson 25） |
| Tool-call-based supervision | “Supervisor without a library” | 将 supervisor 实现为直接 tool calls，以控制 context |
| Crew | “Autonomous team” | CrewAI 的 role-based collaboration 模式 |
| Flow | “Deterministic workflow” | CrewAI 的 event-driven production 模式 |

## 延伸阅读
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 五种模式 + đại lý đối với dòng chảy công việc
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) giám sát, nhóm, cấp bậc
- [CrewAI docs](https://docs.crewai.com/en/introduction) Đội ngũ nhân viên đối với dòng chảy
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) Mô hình tranh luận
