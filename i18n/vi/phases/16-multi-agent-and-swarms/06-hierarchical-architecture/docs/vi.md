# Kiến trúc hàng đầu  và chế độ thất bại

> Đường bậc là quản lý của một bộ quản lý. Các đại lý quản lý nằm ở phía trên các nhân viên quản lý.`Process.hierarchical`是教科书版本: một `manager_llm`动态委派任务并验证输出──LangGraph 中的等价形式是 `create_supervisor(create_supervisor(...))` Khi nhiệm vụ tự nó là biểu đồ cơ cấu thực tế, đây là mô hình tự nhiên.

**类型：**Học tập + xây dựng
**语言：**Python (stdlib)
**前置要求：**Giai đoạn 16 · 05 (Tình mẫu giám sát viên)
**时间：**~ 60 phút

## 问题

Một khi hiểu được mô hình giám sát, bước tiếp theo của tự nhiên là: Nếu nhân viên tự mình cũng là giám sát viên.

 vấn đề nằm ở: quản lý LLM 和 quản lý nhân loại Không giống nhau. Người quản lý nhân loại đối với những người dưới biết những gì có tiền lệ ổn định.

## 概念

### 形态

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

Mỗi nội bộ sẽ có kế hoạch, đại diện và tổng hợp. Chỉ có các nội bộ thực hiện thực sự.

### 适用场景

- **清晰的 org mapping。**Nếu thực tế nhiệm vụ là của một bộ phận, kiểm tra pháp lý tài liệu, tài chính kiểm tra tài liệu, kỹ thuật kiểm tra tài liệu, sau đó tóm tắt cho exec, hierarchy là rõ ràng.
- **Local summarization。**Mỗi phụ quản lý sẽ gặp quản lý hàng đầu  nhìn trước tổng hợp bản thân nhóm của mình xuất khẩu.

### 失效位置

2026 năm sau khi chết 持续发现三种故障模式:

1. **Task assignment error。**Người quản lý 读取目标,幻觉出一个分解,并委派给错误的副管理者──由于副管理者会顺从地处理收到的任务,错误只会在顶层合成时浮现,距离人类本可发现的位置已经分隔一层──
2. **Output misinterpretation。**Phó quản lý 返回不能验证索赔 X──Top manager 总结为索赔 X未确认──含义在每一层都会漂移──
3. **Consensus loops。**Hai người phụ trách 意见不一致; người quản lý hàng đầu  yêu cầu chúng hòa giải; họ chuyển giao lại; công nhân 重新运行; người phụ trách 返回略有不同的答案;循环开始──CrewAI 的`Process.hierarchical`Sử dụng giới hạn bước  ngăn chặn tình huống này, nhưng giới hạn này hiện đã trở thành siêu tham số.

###  quyết định vấn đề

Đường ống tuyến tính theo trình tự (sequential) vs hierarchical: Your task really has independent sub-teams, is also a fake tree's lineary flow? Nếu là người cuối, sử dụng trình tự. Nếu là người trước, sử dụng trình tự, nhưng phải có các quy tắc hòa giải rõ ràng.

### Thực hiện của CrewAI

`Process.hierarchical`Tổng giám đốc LLM 接在专业人员 之上──

- 接收 nhiệm vụ cấp cao,
- Đưa các nhiệm vụ dưới cho các phi hành đoàn,
-  đánh giá các sản phẩm của phi hành đoàn,
- quyết định chấp nhận, đại diện lại, hay lặp lại.

文档:https://docs.crewai.com/en/introduction（在Các khái niệm cốt lõi 下查找 "Phương trình hàng đầu")

### Thực hiện của LangGraph

LangGraph sử dụng các bộ `create_supervisor`Cố vấn bên trong có biểu đồ riêng của mình; giám sát bên ngoài sẽ xem biểu đồ bên trong như một nút không rõ ràng. Đối với debugging, đây là một cách rõ ràng hơn so với CrewAI.

参考:https://reference.langchain.com/python/langgraph-supervisor。


```figure
swarm-hierarchy-token
```

##  xây dựng nó

`code/main.py`运行一个3 cấp bậc:

- Giám đốc cấp cao:将任务分分为" kỹ thuật"和" pháp lý"分支,
- Phó quản lý kỹ thuật: chia thành "phát" và "phát" công nhân,
- Người quản lý pháp lý: một công nhân.

Demo đối với happy path (của tất cả mọi người) và**perturbed path**: top manager's decomposition 将 "legal" 错标为 "finance",然后观察错误级联:sub-manager 顺从地执行财务 工作,top synthesizer 报告财务发现,原始法律问题 没有得到答应。

运行:

```
python3 code/main.py
```

输见展示两条路径,并清晰并排对比what was asked和what was delivered──

## Sử dụng nó

`outputs/skill-hierarchy-fitness.md`评估给定任务应使用等级,顺序,还是平面监督者――输入:任务描述、org结构、调整预算――输出:模式建议,并包含需要防范的具体故障模式――

##  phát hành nó

Nếu bạn đăng tải hierarchical:

- **将 tree depth 限制在 2。**Ba tầng đã được ẩn trong sự quan sát hầu hết các sai lầm.
- **明确 reconciliation budget。**设置 top manager 必须 commit 前的最大轮子──通常为 2──
- **每次 synthesis 都要有 provenance。**Mỗi đoạn kết luận phải trích dẫn để tạo ra các kết quả của nó.
- **对 decomposition drift 告警。**记录 từng bước quản lý phân hủy; với truy vấn người dùng làm khác biệt. Nếu phân hủy không bao gồm truy vấn,触发 cảnh báo.

## 练习

1. 运行 `code/main.py`Không hạnh phúc hơn so với bị rối loạn. Phải mất bao nhiêu cấp quản lý để giao, đầu ra hàng đầu 才 hoàn toàn rời khỏi người dùng vấn đề?
2. 添加第三层(top → sub → sub → worker) ―― theo chiều sâu 增长, đo đường mòn bị rối loạn 多常会自我修正,以及多常会完全偏离──
3. Trong mỗi phụ quản lý 处实现一个"canary" người lao động, nó luôn nhận được không thay đổi của người dùng nguyên thủy câu hỏi.
4. 阅读 CrewAI của `Process.hierarchical`文档──识别 CrewAI 应用一个具体的 guardrail(步骤限制、管理员_llm hạn chế),并描述它针对的故障模式──
5. So sánh các giám sát viên LangGraph của các bản嵌套 với các trình tự cấp bậc của CrewAI.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | supervisors 位于 supervisors 之上；只有叶子节点执行工作。 |
| Manager LLM | "The boss" | 在内部节点执行 decomposes、assigns 和 validates 的 LLM。 |
| Decomposition drift | "The boss lost the plot" | Top manager 的拆分不再覆盖原始问题。 |
| Reconciliation loop | "Endless meetings" | Sub-managers 意见不一致；top re-delegates；workers re-run；循环直到 budget 耗尽。 |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | 经验性 guardrail：3+ 层会让 observability 坍塌。 |
| Canary question | "Ground truth at every level" | 一个始终收到未改动原始 query 的 worker，用于检测 drift。 |
| Provenance chain | "Who said what" | 从每次 synthesis 回溯到产生它的 leaf outputs 的 trace。 |

## 延伸阅读

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) 带有经理 LLM 的教科书式等级
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) 通过 `create_supervisor`实现嵌套 giám sát viên
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system) Tại sao nhân văn có ý định chọn giám sát viên căn hộ chứ không phải là thứ tự
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST taxonomy; về sự thất bại phối hợp của chương ghi lại sự phân hủy
