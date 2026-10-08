# ReWOO và Kế hoạch và thực hiện:解式规划

> ReAct trong một dòng chảy trong giao lưu suy nghĩ và hành động。ReWOO sẽ phân chia chúng: trước tiên lập ra một kế hoạch lớn hoàn chỉnh, sau đó thực hiện。Token giảm 5x, nâng cao độ chính xác trên HotpotQA lên +4%, và bạn có thể đưa kế hoạch viên phân hủy thành một mô hình 7B。Plan-and-Execute sẽ phổ biến nó;Plan-and-Act sẽ mở rộng nó đến định hướng web。

**类型：**构建
**语言：**Python (stdlib)
**先修要求：**Giai đoạn 14 · 01 (Thử lý vận hành)
**时间：**~ 60 phút

## Học mục tiêu
- 解释 tại sao ReWOO của Planner / Worker / Solver  tách chia相比 ReAct của giao dịch vòng lặp 能省 टोकन并提升强度──
- 实现 một kế hoạch DAG、 một trình thực hiện theo thứ tự, cũng như một bộ giải pháp của sản xuất công nhân  全部 sử dụng stdlib。
- Sử dụng năm 2026 5 quy mô quy trình làm việc 框架(Anthropic), nhiệm vụ phán quyết nên được sử dụng kế hoạch sau đó thực hiện còn là交错式 ReAct。
- 识别什么时候 Plan-and-Act của dữ liệu kế hoạch tổng hợp cho các công việc web hoặc di động dài hạn là cần thiết.

## 问题
ReAct's giao lưu suy nghĩ-giải hành-phát hiện lặp  đơn giản và linh hoạt, nhưng mỗi cuộc gọi công cụ đều phải mang theo hoàn chỉnh bối cảnh trước đó  bao gồm cả mỗi suy nghĩ trước đó. Việc sử dụng token sẽ tăng lên lần thứ hai.

ReWOO(Xu et al., arXiv:2305.18323, May 2023) lưu ý đến điều này,并 thực hiện một取舍:先完整规划,并行 获取证据,最后组合答案──一次 LLM gọi dùng để规划,N次工具调用 用于证据(可以并行),一次 LLM gọi dùng để tìm giải pháp──这个取舍是用更少灵活性(计划是静态的)换取更好的代币效率和更清晰的失败模式──

## 概念
### Ba vai diễn

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planner 生成一个DAG──每个节点都指定一个工具、它的论点,以及它依赖于一些早期的节点(例如`#E1``#E2`Như vậy tham chiếu) ・ Công nhân theo thứ tự topological  thực hiện nút。Solver sẽ tất cả nội dung拼接在一起。

### Tại sao 5x ít hơn các token

ReAct's prompt length 会随步数 线性增长──在第十步,prompt 包含思想 1加行动 1加观察 1加思想 2加行动 2加观察 2,依此类推──每个中间步还会冗余包含原始提示──

ReWOO chỉ thanh toán một lần lập kế hoạch nhanh hơn, mỗi lần chỉ gọi công cụ, không có chuỗi) và một lần giải quyết nhanh hơn.

### Tại sao nó mạnh hơn

Nếu người lao động 3 trong ReAct thất bại,loop phải được định vị trong dòng giữa đường từ lỗi trong ReWOO, người lao động 3 trở lại một chuỗi lỗi; người giải quyết có thể thấy nó trong bối cảnh của kế hoạch ban đầu,并优雅降级──Phục bộ định vị thất bại là mỗi nút, chứ không phải là từng bước.

### Phân lọc máy kế hoạch

Kết quả thứ hai của bài luận: Vì kế hoạch xem không đến quan sát, bạn có thể sử dụng 175B giáo viên kế hoạch đầu ra để điều chỉnh tốt một mô hình 7B. mô hình nhỏ chịu trách nhiệm lập kế hoạch; mô hình lớn trong suy luận không còn cần thiết nữa.

### Kế hoạch và thực hiện (LangChain, 2023)

LangChain 团队 trong bài viết tháng 8 năm 2023 sẽ ReWOO 泛化为一个模式名称:Plan-and-Execute。 Up-front planner 输出一个步骤列表,执行人 执行每个步骤,可选的重组规划员可以在观察结果后进行修改──这比 ReWOO更接近 ReAct(重组规划员会把观察带回规划),但保留了代币节省──

### Kế hoạch và Đạo luật (Erdogan et al., arXiv:2503.09572, ICML 2025)

Plan-and-Act sẽ mở rộng mô hình này đến web và đại lý di động dài hạn. Đó là một đóng góp quan trọng của dữ liệu kế hoạch tổng hợp: một máy phát hành quỹ đạo có nhãn sinh ra hiển nhiên bao gồm dữ liệu đào tạo kế hoạch. Nó được sử dụng cho các mô hình lập kế hoạch tinh chỉnh, làm cho nó vẫn có thể hoạt động bình thường sau hơn 30-50 bước trên WebArena, trong khi một đoạn quỹ đạo ReAct trong các nhiệm vụ này sẽ mất tính nhất quán.

### Khi nào để chọn

| Pattern | When |
|---------|------|
| ReAct | 短任务、未知 environment、需要 reactive exception handling |
| ReWOO | 具备已知 tools 的结构化任务、对 token 敏感、evidence 可 parallelize |
| Plan-and-Execute | 类似 ReWOO，但在 partial execution 后支持 replanning |
| Plan-and-Act | Long-horizon（>30 步）、web/mobile/computer-use |
| Tree of Thoughts | Search 值得付出成本（Lesson 04） |

Giới thiệu về các công cụ của Anthropic năm 2024: bắt đầu bằng cách đơn giản nhất. Nếu nhiệm vụ chỉ là một công cụ gọi thêm một bản tóm tắt, hãy đừng xây dựng ReWOO. Nếu nhiệm vụ là một nhiệm vụ nghiên cứu 40 bước, hãy không chỉ sử dụng ReAct.


```figure
rewoo-plan
```

##  xây dựng nó
`code/main.py`实现一个玩具版 ReWOO:

- `Planner`Một chính sách kịch bản, theo kế hoạch xuất khẩu nhanh chóng DAG
- `Worker`  Thông qua đăng ký phân phát mỗi nút của tool call。
- `Solver` văn bản thành phần, đọc bằng chứng và tạo ra câu trả lời cuối cùng.
- Phân giải phụ thuộc  类似 `#E1`Các tham chiếu sẽ được thay thế cho các sản phẩm lao động sớm hơn.

这个 demo  trả lời  Dân số của thủ đô của Pháp là bao nhiêu, tròn lên hàng triệu?, sử dụng kế hoạch hai bước: 1) Tìm kiếm thủ đô, 2) Tìm kiếm dân số, rồi tìm giải thích。

运行 nó:

```
python3 code/main.py
```

trace 会先显示完整计划,然后显示员工结果,最后显示解决器组成――将符号数量(我们打印了粗略的字符数量) 与 ReAct-style交错运行进行比较  在这种结构化任务上 ReWOO 胜出──

## Sử dụng nó
LangGraph sẽ lập kế hoạch và thực hiện như một công thức`create_react_agent`Sử dụng để ReAct, đồ thị tùy chỉnh sử dụng để thực hiện kế hoạch) ――CrewAI's Flow  trực tiếp lập trình mô hình này: bạn đã xác định trước các nhiệm vụ, sau đó Flow DAG  thực hiện chúng。Phương pháp dữ liệu tổng hợp của Plan-and-Act  phương pháp hiện vẫn thuộc về nghiên cứu; mô hình chạy thời gian (Runtime pattern) ((显式 plan DAG) thông qua LangGraph 和 CrewAI Flow 在生产中提供。

## 交付 nó
`outputs/skill-rewoo-planner.md`Trong trường hợp của một danh mục công cụ nhất định, theo yêu cầu của người dùng 生成 ReWOO kế hoạch DAG── nó sẽ được giao cho trình thực thi kế hoạch trước khi kiểm tra 

## 练习
1. Đối với các nút kế hoạch độc lập  thực hiện hành động công nhân song song  Trong một bao gồm 2 nhóm song song trong DAG 6-nốt, điều này có thể mang lại những lợi ích gì?
2. Thêm một nút tái lập kế hoạch, khi bất kỳ nhân viên nào  trả lại lỗi 时触发── để ReWOO  biến thành thay đổi tối thiểu của kế hoạch và thực hiện là gì?
3. Với một mô hình nhỏ (đại 7B) thay thế`Planner`,并让 `Solver`Sử dụng mô hình biên giới  So sánh chất lượng cuối đến cuối  Việc phân chia này là nơi nào không hiệu quả?
4. 阅读 ReWOO 论文关于计划器蒸的第4部分──从概念上复现 175B -> 7B 的结果: bạn cần dữ liệu đào tạo gì,以及如何评估计划质量?
5. Để thực hiện việc chuyển giao đồ chơi này vào hình dạng quỹ đạo của Plan-and-Act: Plan là chuỗi, chứ không phải DAG.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ReWOO | “Reasoning without observations” | 先 plan，然后 parallel 获取 evidence，最后 solve —— planning prompt 中没有 observations |
| Plan-and-Execute | “LangChain's plan-execute pattern” | ReWOO 加上 execution 后可选的 replanner node |
| Plan-and-Act | “Scaled plan-execute” | 显式 planner/executor 拆分，并用 synthetic plan training data 支持 long-horizon tasks |
| Evidence reference | “#E1, #E2, ...” | plan-node placeholder，在 dispatch 时用先前的 worker output 替换 |
| Planner distillation | “Small planner, big executor” | 用 large teacher 的 planner traces 来 fine-tune small model |
| Token efficiency | “Fewer round trips” | 论文中在 HotpotQA 上相对 ReAct 减少 5x tokens |
| DAG executor | “Topological dispatcher” | 按 dependency order 运行 plan nodes；每一层可 parallel |

## 延伸阅读
- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) 经典论文
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) 带 tổng hợp kế hoạch của quy mô kế hoạch-hành động viên
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) Công thức khung
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 选择能工作的简单模式
