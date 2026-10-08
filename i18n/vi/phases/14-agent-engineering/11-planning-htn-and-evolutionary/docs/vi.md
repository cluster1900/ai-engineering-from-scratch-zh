# Sử dụng HTN và Tìm kiếm tiến hóa

> Kế hoạch biểu tượng  kế hoạch xử lý 可证明正确的场景──Evolutionary code search 处理健身功能 可由机器检查的场景──ChatHTN (2025) 和 AlphaEvolve (2025) 展示了二者与LLM 结合后分别能解锁什么能力──

**类型:**构建
**语言:**Python (stdlib)
**先修要求:**Giai đoạn 14 · 02 (ReWOO và kế hoạch và thực hiện)
**时间:**~ 75 phút

## Học mục tiêu

- Giải thích Các mạng nhiệm vụ cấp bậc: nhiệm vụ, phương pháp, nhà điều hành, điều kiện trước, hiệu ứng.
- 描述 ChatHTN's hybrid loop  tìm kiếm biểu tượng 加 LLM fallback phân hủy。
- Giải thích vòng lặp tiến hóa của AlphaEvolve, và tại sao nó chỉ phù hợp với trình đánh giá chương trình.
- Sử dụng stdlib 实现一个玩具 HTN lập kế hoạch và một trò chơi tìm kiếm tiến hóa.

## 问题

ReWOO (Dạy học 02) ✓ Kế hoạch và thực hiện và ReAct 覆盖大多数agent planning──它们不太擅长覆盖两个场景:

1. **可证明正确的 plans。**Lập kế hoạch, đường bay, quy trình làm việc tuân thủ kế hoạch phải được xây dựng là âm thanh.
2. **带有机器可检查 fitness function 的优化。**Matrix multiplication, scheduling heuristics, compiler passes  目标 không phải là một kế hoạch chính xác, mà là kế hoạch tốt nhất.

HTN kế hoạch và AlphaEvolve  giải quyết là hai vấn đề khác nhau.

## 概念

### Các mạng lưới nhiệm vụ cấp bậc

HTN 包含:

- **Tasks** hợp chất (( chờ phân hủy) và nguyên thủy ((可直接执行)
- **Methods** phân chia nhiệm vụ hợp chất thành các nhiệm vụ phụ theo cách, với những điều kiện tiên quyết.
- **Operators** 带有前条件和效果的原始行动──
- **State** 一组事实──

Kế hoạch: cho định một nhiệm vụ mục tiêu và trạng thái ban đầu, tìm một phân giải, làm cho nó trở thành điều kiện tiên quyết 按顺序满足的原始运算者──

HTN sớm xuất hiện LLM, và vẫn là phương pháp tham khảo cho chứng minh các kế hoạch chính xác.

### ChatHTN (Gopalakrishnan et al., 2025)

ChatHTN (arXiv:2505.11814) sẽ biểu tượng HTN với LLM truy vấn 交错执行:

1. 尝试使用现有方法 分解当前复合任务──
2. Nếu không có phương pháp  áp dụng, hãy hỏi LLM:`s`Trung, anh sẽ làm thế nào để phân hủy `task`?
3. 将 LLM phản ứng 转换 thành ứng viên phụ trách.
4. 根据运营商方案做验证; từ chối phân hủy vô hiệu quả.
5. 递归――

论文的核心主张:生成的每一个计划都可证明声音,因为 LLM đề xuất chỉ như ứng viên phân hủy 进入,永远不会直接编辑计划──象征层 负责正确性;LLM 扩展方法库──

Học phương pháp trực tuyến(OpenReview `gwYEDY9j2x`,2025 theo dõi) gia nhập một học sinh, thông qua sự lùi lại 泛化 LLM 生成的分解  tối đa có thể giảm 75% của LLM truy vấn 频率──

### AlphaEvolve (Novikov et al., 2025)

AlphaEvolve (arXiv:2506.13131, DeepMind, tháng 6 năm 2025) là một loại thứ khác: bởi bộ sưu tập Flash / Pro của Gemini 2.0 编排的进化代码搜索──

Lúp:

1. Từ chương trình hạt giống + đánh giá chương trình 开始(返回 fitness score)。
2. LLM Ensemble  đề xuất đột biến
3. 将 đột biến 交给评估员 运行――
4. 保留最好的; tiếp tục biến đổi.

已发表成果:

- 56 năm qua lần đầu tiên cải tiến 4x4 phức tạp của Strassen lần nhân số số (tăng số)
- Thông qua lập trình Borg heuristic  khôi phục 0.7% của Google tính toán.
- Trong khối lượng công việc biên giới đạt 32% tốc độ FlashAttention.

硬性约束: chức năng phù hợp 必须可由机器检查── đối với câu trả lời bằng văn bản thực hiện tìm kiếm tiến hóa 不会收──

### 何時使用何时使用何时使用何时使用何时使用何时使用何时使用何时使用何时使用何时使用何时使用何时使用何时使用何时

| 问题类别 | 使用 | 原因 |
|---------------|-----|-----|
| 带硬约束的 Scheduling | HTN + ChatHTN | 可证明的 soundness |
| Compiler optimization | AlphaEvolve | 机器可检查的 fitness |
| Multi-step task execution | ReAct / ReWOO | LLM in the loop，没有 formal guarantees |
| 带 tests 的 Code improvement | AlphaEvolve | Tests 就是 evaluator |
| Policy-bound automation | HTN | Preconditions 编码 policy |

### Phương pháp này dễ dàng sai

- **没有 operators 的 HTN。**Không có quy trình dự đoán/sự ảnh hưởng, sự hợp lý 主张就会崩塌──ChatHTN 的LLM gợi ý phân hủy yêu cầu quy trình 能拒绝无效动作──
- **没有真实 evaluator 的 AlphaEvolve。** hỏi LLM 代码 liệu tốt hơn không là chức năng fitness.
- **过度工程化。**Hầu hết các nhiệm vụ của đại lý đều không cần cả hai.


```figure
htn-tree-expand
```

##  xây dựng nó

`code/main.py`实现了两个玩具例:

- Một kế hoạch HTN rảnh rỗi, bao gồm các nhà điều hành, phương pháp, điều kiện trước, hiệu ứng, cũng như khi không có phương pháp 匹配 hợp tác vụ 时触发 `LLMFallback`LLM là một trình phân hủy kịch bản, do đó lập kế hoạch có thể hoạt động trên mạng.
- Một tìm kiếm tiến hóa của các chương trình toán học nhắm vào: tăng trưởng biểu hiện, làm cho nó xuất trong tập hợp thử nghiệm 上 tối thiểu hóa`|f(x) - target|`❖ Người đánh giá là người xác định

运行:

```
python3 code/main.py
```

Trace 会展示 HTN Planner phân giải một nhiệm vụ phức tạp (中途带一次 LLM fallback), cũng như vòng tiến hóa 收到一个目标表达──

## Sử dụng nó

- **HTN planners** `pyhop``SHOP3`, hoặc để thực thi chính sách cụ thể về lĩnh vực xây dựng riêng mình.
- **ChatHTN** mã nghiên cứu; 这个模式(symbolic + LLM fallback) có thể được thực hiện trong bất kỳ máy tính kế hoạch HTN nào.
- **AlphaEvolve** DeepMind bài báo; 这个模式(ensemble + evaluator)可复现──OpenEvolve 和类似开源叉 正在出现──
- **Agent frameworks**Hiện chưa có HTN hoặc AlphaEvolve hạng nhất.

## 交付 nó

`outputs/skill-hybrid-planner.md`生成一个混合规划器架架 (HTN 或进化),并明确限定 LLM vai trò.

## 练习

1. 用后续追踪 扩展 HTN Planner:当某运营商的后条件 在运行时间 失败时,回滚并尝试下一个方法──
2. 给 ChatHTN 添加 LLM- phương pháp cache:当 LLM 在状态模式 `P`中分解 nhiệm vụ `T`时,存储结果──下一次调用时先重新检查方法库──
3. Để thay thế cho thực tế thử nghiệm bộ                                                                                                                                                                                                                                                                                                            
4. 阅读 AlphaEvolve's evaluator design notes──为你关心的域名 设计一个评价器(SQL truy vấn tối ưu hóa、测试套件最小化、部署 YAML)──
5. 组合使用: sử dụng HTN sẽ phân chia nhiệm vụ hợp chất thành các phụ trách, sau đó trên mỗi phụ trách của các nhà điều hành nguyên thủy sử dụng tìm kiếm tiến hóa. Nó xuất hiện trong màu sắc nào, trong đó thuộc về quá kỹ thuật?

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| HTN | “Hierarchical planner” | 带有 operators、preconditions、effects 的 task decomposition |
| Method | “Decomposition rule” | 将 compound task 拆分为 subtasks 的方式 |
| Operator | “Primitive action” | 带有 precondition 和 effect 的具体步骤 |
| ChatHTN | “LLM + HTN” | 当没有 method 匹配时，symbolic planner 询问 LLM |
| AlphaEvolve | “Evolutionary code search” | Ensemble LLMs mutate code；deterministic evaluator 负责选择 |
| Fitness function | “Evaluator” | 针对 outputs 的 deterministic、机器可检查 score |
| Online method learning | “Cached LLM decomposition” | 存储并泛化 LLM plans，以降低 query cost |

## 延伸阅读

- [Gopalakrishnan et al., ChatHTN (arXiv:2505.11814)](https://arxiv.org/abs/2505.11814) biểu tượng + LLM 混合 lập kế hoạch
- [Novikov et al., AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) 带 LLM đột biến của tìm kiếm mã tiến hóa
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 何时选择规划器,何时选择 đơn giản vòng lặp
