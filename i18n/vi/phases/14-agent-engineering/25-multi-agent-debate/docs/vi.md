# Các đại lý đa đối thoại và cộng tác

> Du et al. (ICML 2024,Society of Minds)运行 N 个模型实例, những thí dụ này trước tiên đưa ra câu trả lời độc lập, sau đó trong R 轮中相互代批判, để thực hiện收──它能提升事实性、规则遵循和推理──Sparse topology 在 Token 成本上优于全网──

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12（Workflow Patterns），Phase 14 · 05（Self-Refine and CRITIC）
**Time:** ~60 分钟

## Học mục tiêu
- Giải thích giao thức tranh luận:N 个 đề xuất ̇R 轮,并收到一个共享答案──
- 描述为什么辩论 能提升事实性、遵循规则和推理──
- Giải thích topology hiếm: không phải mỗi người tranh luận đều cần nhìn thấy tất cả các nhà tranh luận khác.
- Trong kịch bản LLM 上实现一个 stdlib tranh luận,包含全网和稀少变体;衡量代币 成本与精度──

## 问题
Bản thân tinh chỉnh (第 05 课) là một mô hình phê bình bản thân, có tư tưởng nhóm 风险――CRITIC (第 05 课) đưa phê bình vào các công cụ bên ngoài, nhưng những công cụ này không luôn có sẵn.

## 概念
### Hiệp hội tâm trí (Du et al., ICML 2024)

- N 个模型例 đối với cùng một vấn đề tự do đưa ra câu trả lời.
- Trong R 轮, mỗi mô hình đọc các đề xuất của mô hình khác và chỉ trích chúng.
- 模型根据批评 更新自己的答案──
- R 轮后, trả lại 收回后的答案──

Các thí nghiệm ban đầu dựa trên việc tính toán chi phí sử dụng N=3、R=2── trên các vấn đề khó khăn (MMLU、GSM8K、Chess Move Validity、biography generation), nhiều đại lý và nhiều hơn lần tăng độ chính xác──

Các mô hình chéo 组合优于单模型辩论:ChatGPT + Bard 组合 > 任一单独模型。

### Topology Sparse

Cải thiện Vấn đề đa đại lý với Topology Truyền thông Sparse(arXiv:2406.11776,2024-2025) cho thấy, cuộc tranh luận toàn bộ không phải là tốt nhất.

 ảnh hưởng:

- N=5,R=3 = 5 × 3 = 15 đề xuất, mỗi người đọc 4 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个
- Star N=5,R=3 ((1 hub + 4 个口) = 15 个 đề xuất, nói chỉ读取 hub = 12 lần phê bình ops。

### Khi tranh luận giúp ích

- **Factuality。**N 个 个 độc lập đề xuất, kiểm tra chéo  giảm ảo giác.
- **Rule-following。**Chess move validity Trong khi một mô hình bỏ qua quy tắc, mô hình khác sẽ nắm bắt ra.
- **Open-ended reasoning。**Nhiều hình thức sẽ dần thu hẹp đến đúng câu trả lời.

### Khi tranh luận đau đớn

- **Latency-sensitive UX。**N × R 个串行轮次会产生你可能无法承受的延迟.
- **Cost-sensitive scale。**Mỗi vấn đề cần N × R Token.
- **Simple factual lookups。**Một lần tìm kiếm hơn 5 cuộc tranh luận hơn là rẻ hơn.

### 2026 các trường hợp thực tế

- **Anthropic orchestrator-workers**(第 12 课)  带 tổng hợp bước một loại tranh luận 变体。
- **LangGraph supervisor**(第 13 课)  bộ định tuyến trung ương + các đại lý chuyên gia có thể thực hiện cuộc tranh luận thành một nút.
- **OpenAI Agents SDK**(第 16 课)  đại lý 通过交付来回进行反复批评──
- **Multi-agent evals** sẽ thảo luận + đánh giá-optimizer 配对, được sử dụng cho tín hiệu đánh giá.

### Mô hình này dễ dàng xuất hiện ở nơi

- **Convergence collapse。**Tất cả các đại lý đều nhận được câu trả lời sai lầm đầu tiên.
- **Hub failure。**Trong topology sao, một trung tâm xấu sẽ làm ô nhiễm tất cả mọi người.
- **Prompt homogenization。**Tất cả các đại lý sử dụng cùng một prompt; chúng sẽ tạo ra cùng một câu trả lời.


```figure
debate-converge
```

##  xây dựng nó
`code/main.py`实现了 stdlib tranh luận:

- `Debater`lớp ((带有每个辩论者的意见漂移的剧本 LLM)
- `FullMeshDebate`和 `SparseDebate`Những người chạy bộ.
- 三个问题: một thực tế, một quy tắc, một lý luận.
- Các số liệu: đáp án tương ứng, vòng về tương ứng, tổng quan điểm.

运行:

```
python3 code/main.py
```

输出: độ chính xác và chi phí của mỗi giao thức;sparse trong 2/3 问题以较低成本匹配全网――

## Sử dụng nó
- **Anthropic orchestrator-workers**Sử dụng các cuộc tranh luận đơn giản của 2-3 công nhân.
- **LangGraph**Sử dụng để mang đến cuộc tranh luận đa vòng của kiểm soát.
- **Custom**Sử dụng cho nghiên cứu hoặc đặc biệt đảm bảo sự chính xác.

## 交付 nó
`outputs/skill-debate.md`Lập ra một cuộc tranh luận đa tác nhân, có thể cấu hình được topology, N, R và quy tắc hội tụ.

## 练习
1. Thực hiện một sự bất đồng buộc quy tắc: trong vòng 1, mỗi người tranh luận phải đưa ra một đề xuất khác nhau.
2. 添加信心重量聚合:debaters 返回 ( trả lời, tin tưởng); 聚合器 按信心 加权──它有助吗?
3. Để thay thế một đại lý với một LLM khác có ý kiến khác.
4. Trong 3 vấn đề của bạn, đo lường lưới đầy đủ với các token hiếm có.
5. 阅读 Society of Mind paper... đưa đồ chơi của bạn 移植 đến N=5 R=3...

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Debate | “Multi-agent critique” | N 个 proposers，R 轮 cross-critique，并收敛 |
| Full mesh | “Everyone reads everyone” | 每个 debater 每轮读取每个 peer |
| Sparse topology | “Limited peer view” | Debaters 只读取 peers 的一个子集 |
| Hub-and-spoke | “Star topology” | 一个 central debater，N-1 个 spokes 只读取 hub |
| Convergence | “Agreement” | Debaters 收敛到一个共享答案 |
| Society of Minds | “Du et al. debate paper” | ICML 2024 multi-agent debate method |

## 延伸阅读
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) 经典 tranh luận đa đại lý
- [Sparse Communication Topology (arXiv:2406.11776)](https://arxiv.org/abs/2406.11776) topology hiếm 结果
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) nhạc sĩ-người làm việc 作为一种辩论 变体
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) Phương pháp tự phê bình đối phó mô hình đơn
