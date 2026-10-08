# Cây của tư tưởng và LATS: Tìm kiếm chủ động

> 单条 chuỗi tư tưởng quỹ đạo 没有回溯空间──ToT(Yao et al., 2023) sẽ suy luận 变成一棵树, và trên mỗi nút tiến hành tự đánh giá──LATS(Zhou et al., 2024) 在蒙特卡罗树搜索下统一了 ToT、ReAct 和 Reflection──Location of 24 từ 4%(CoT) nâng lên 74%(ToT);LATS 在 HumanEval 上 đạt 92.7% pass@1。

**类型：**Xây dựng
**语言：**Python (stdlib)
**先修：**Giai đoạn 14 · 01 (Thử lý vòng lặp), Giai đoạn 14 · 03 (Tình phản)
**时间：**~ 75 phút

## Học mục tiêu

- Lý luận biểu diễn cho tìm kiếm: nút là ý nghĩ, cạnh là mở rộng, giá trị là có nhiều hy vọng.
- 实现一个stdlib ToT-style BFS tree search,并用自评分点数──
- 扩展为一个玩具 LATS MCTS vòng lặp,包含 chọn / mở rộng / mô phỏng / backpropagate。
- 判断什么时候搜索 值得代币 倍增成本(Lát bài 24、代码),什么时候单条轨迹 就足够(简单 Q&A) 』

## 问题

Dòng tư tưởng là một đường lối đi. Nếu bước đầu tiên sai, mỗi bước tiếp theo sẽ được xây dựng trên một giả định sai. Trong trò chơi 24 (với bốn số và + − × ÷ 得到 24) trong game, tỷ lệ xác thực của GPT-4 CoT là 4%

Lý luận 需要提出多个候选,评估它们,选择有希望的候选,并出现死角时回溯的能力──这就是搜索──Trees of Thoughts 和 LATS là hai định dạng huyền di truyền──

## 概念

### Cây của tư tưởng (Yao et al., NeurIPS 2023)

Mỗi nút là một bước trung gian liên tục (连贯的中间步骤) 一个思想)  每个节点可以扩展为 K个孩子思想 LLM Sử dụng điểm số nhắc cho mỗi nút 进行自我评估 搜索探索这个树,可以是BFS、DFS或束──

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

Thử nghiệm tự đánh giá là một phần nặng.`sure / likely / impossible`phân loại,`1..10`điểm số số, cũng như phiếu bầu giữa các ứng cử viên.

### LATS (Zhou et al., ICML 2024)

LATS trong MCTS 下统一了 ToT, ReAct và Reflection.

- **Policy**:提出候选下一步行动 (ReAct-style)
- **Value function**:为部分轨迹 打分(ToT-style tự-eval)
- **Self-reflector**:失败时写下自然语言反思 (tạm dịch: phản ánh tự nhiên),并用它重新种种未来 rollout──

Phản hồi môi trường (observation) sẽ được kết hợp vào hàm giá trị, do đó tìm kiếm 会由真实工具结果提供信息,而不仅仅提供信息,而不仅仅提供模型意见.

### MCTS, hình thức tối thiểu

Mỗi lần lặp lại có bốn giai đoạn:

1. **Select** 使用 UCT(trị tự tin cao nhất kết nối với cây) từ gốc 走 đến lá
2. **Expand**  thông qua chính sách sinh ra một đứa trẻ K 个.
3. **Simulate** Sử dụng chính sách từ việc triển khai trẻ em đến lá,并用 giá trị chức năng (hoặc môi trường thưởng)为 lá 打分。
4. **Backpropagate** 沿路径向上更新 thăm viếng và ước tính giá trị。

Công thức UCT:`Q(s, a) + c * sqrt(ln N(s) / N(s, a))`❖ thứ nhất là khai thác; thứ hai là khám phá.`c`

### 成本现实

Tìm kiếm 会让 Token 爆炸──Lễ chơi 24 上的 ToT 使用的 Token 是 CoT 的 1001000倍──LATS 类似──这不是免费的;应将搜索留给:

- 单条轨迹 被证明不足的任务
- Đường đồng hồ không giống như sự chính xác  nhiệm vụ quan trọng.
- Có nhiệm vụ của hàm giá trị dễ dàng và đáng tin cậy ((code của đơn vị test ≠ toán học mục tiêu rõ ràng) ⋅

Nếu nhiệm vụ của bạn có một câu trả lời chính xác và đánh giá có tiếng ồn, tìm kiếm thường sẽ làm cho mọi thứ tồi tệ hơn, bởi vì nó sẽ tìm thấy những câu trả lời sai lầm của điểm số cao.

### 2026 定位

Đại đa số đại lý sản xuất không vận hành LATS──它们运行带有工具基基验证的 ReAct(CRITIC,Lesson 05)──Search 出现在专门的位中:

- Sẽ test 作为值函数的编码代理 (HumanEval-style)
- 探索多条 truy vấn đường dẫn của đại lý nghiên cứu sâu.
- LangGraph subgraph 内部 kế hoạch-thường xuyên làm việc.

AlphaEvolve (Lớp 11) là ví dụ cuối cùng của năm 2025: đối với mã  tiến hành tìm kiếm tiến hóa  máy kiểm tra fitness  biên giới tăng trưởng


```figure
tree-of-thoughts
```

##  xây dựng nó

`code/main.py`实现:

- Một trong những nhiệm vụ phong cách hóa t chọn toán học  trên运行的 nhỏ ToT BFS。
- Một trong cùng một nhiệm vụ 上运行的 đồ chơi LATS MCTS vòng lặp(Hãy chọn / mở rộng / mô phỏng / Backpropagate), sử dụng lựa chọn UCT。
- Một组合 biểu tượng điểm và giá trị của tự-tỷ lệ điểm.

运行 nó:

```
python3 code/main.py
```

trace 会显示 ToT dùng BFS Mỗi nút mở rộng ba ứng cử viên,并 với LATS  thông qua MCTS 收 đến rollout tốt nhất  thực hiện đối số.

## Sử dụng nó

LangGraph sẽ sử dụng ToT như một mẫu mẫu phụ tùng 提供;LangChain team 关于 LATS 的 blog(2024 年 5 月) là một tài liệu tham khảo.`TreeOfThoughts`Đối với hầu hết các đại lý sản xuất năm 2026, mô hình này nằm ở`if task_complexity > threshold: use_search()`Gate 后面见 Bài học 05 中的评估者优化器模式──

## 交付 nó

`outputs/skill-search-policy.md`会根据任务形状、预算和评估者忠诚度,在线性 ReAct、ToT、LATS和进化搜索之间进行选择──

## 练习

1. Cần phải làm gì trong khi sử dụng UCT c=0.1 và c=2.0?
2. Để biến giá trị chức năng thành âm thanh lớn hơn ghi điểm hơn ((đã tham gia sự rắc rối ngẫu nhiên) ―― MCTS còn có thể tìm ra lá tốt nhất ư? nó có thể chịu được mức tín hiệu âm thanh tối thiểu là bao nhiêu?
3. 实现beam-search ToT( mỗi tầng giữ top-k)并 đối với BFS.
4. 阅读 LATS Phần 5.1──复现 HumanEval quỹ đạo đếm: cần bao nhiêu triển khai để đạt được báo cáo của pass@1?
5. 阅读 LATS bài báo 中关于when LATS helps less的讨论──写一段决策规则,将任务形状映射到搜索策略──

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tree of Thoughts | “Branching CoT” | Yao et al. — 带有 self-evaluation 的 thought node 树 |
| LATS | “MCTS for LLMs” | Zhou et al. — 在 MCTS 下统一 ToT + ReAct + Reflexion |
| UCT | “Upper confidence bound” | 在 exploitation (Q) 和 exploration (ln N / n) 之间平衡的 select formula |
| Value function | “这个 state 有多好” | Prompted LLM score 或 environment reward；反馈给 backprop |
| Policy | “Action proposer” | ReAct-style generator；发出候选 next thought/action |
| Rollout | “Simulated trajectory” | 使用 policy 从 node 走到 leaf，并用 value 打分 |
| Backpropagate | “更新 ancestors” | 将 leaf 的 reward 沿路径向上推，更新 visit count 和 Q |
| Search cost | “Token explosion” | Game of 24 上是 CoT 的 100-1000 倍；采用前先做 budget |

## 延伸阅读

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) 经典论文
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) 带有反思反的 MCTS
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Sử dụng mẫu phụ hình của tìm kiếm
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 trình độ đánh giá của tìm kiếm tiến hóa
