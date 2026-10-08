# AlphaEvolve  演化式编码代理

> Để đưa ra một mô hình mã hóa biên giới với các nhà đánh giá của vòng lặp và kiểm tra máy tính có thể 配对. Để vòng lặp hoạt động đủ lâu. Nó sẽ phát hiện ra một quá trình 4x4 复数 Matrix 乘法, chỉ sử dụng 48 lần quy mô乘法, đây là lần đầu tiên trong 56 năm qua vượt qua Strassen. Nó cũng tìm thấy một hệ thống định đoan Borg trong phạm vi của Google, phục hồi khoảng 0,7% của các nguồn tính toán tập thể trong môi trường sản xuất.

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01（长周期 framing），Phase 15 · 02（self-taught reasoning）
**Time:** 约 60 分钟

## 问题

LLM có thể viết mã. Các thuật toán phát triển có thể tìm kiếm trong không gian mã. Hai thập kỷ qua đã được thử nghiệm riêng biệt, cũng gặp phải giới hạn trên.

AlphaEvolve(Novikov et al., DeepMind, arXiv:2506.13131, tháng 6 năm 2025) đưa chúng vào một nhóm lại. LLM đề xuất một biên tập tập tập hợp mục tiêu đối với cơ sở dữ liệu của chương trình; đánh giá tự động cho mỗi biến số; cao分 biến thể trở thành cha mẹ của thế hệ tiếp theo. LLM chịu trách nhiệm về các bước đắt tiền: viết ra có vẻ hợp lý của mã; đánh giá viên  nắm bắt giả thuyết.

Kết quả của báo cáo luận án bao gồm: 48 lần mã số số nhân số 4x4  số số nhân số Matrix 乘法(Strassen 1969 năm trên là 49), Google sinh sản môi trường Borg 调度 heuristic,32.5% của FlashAttention hạt nhân tăng tốc, cũng như Gemini 训练吞吐量提升──

Trong trường hợp mà người đánh giá không có điểm này, nó là vô hiệu.

## 概念

### Chuyện

1. Từ một chương trình hạt giống đúng nhưng tốt`P_0`开始──
2. 维护一个变体程序数据库, mỗi变体 đều được đánh giá bởi một đánh giá viên 打分──
3. Từ cơ sở dữ liệu lấy mẫu một hoặc nhiều cha mẹ (MAP-elite-style hoặc đảo-based)
4. LLM nhanh chóng(với Gemini Flash 生成大量候选,với Gemini Pro 处理困难候选)产出父母的修改变体──
5. 编译、运行, và được đánh giá cao
6. Theo số và tính năng Vector sẽ đưa nó vào cơ sở dữ liệu.
7. Đổi lại

Có hai chi tiết rất quan trọng. Thứ nhất, Prompt 给 LLM của không chỉ là chương trình phụ thân, thường bao gồm nhiều biến thể hàng đầu trong cơ sở dữ liệu, chữ ký đánh giá, cũng như mô tả nhiệm vụ ngắn. Nhiệm vụ của mô hình là đưa ra một thay đổi định hướng có thể nâng cao số lượng phân tích. Thứ hai, cơ sở dữ liệu là cấu trúc hóa (MAP-elite grid, đảo dựa trên), vì vậy vòng lặp khám phá sự đa dạng, chứ không chỉ là người dẫn đầu hiện tại.

### Tại sao một nhà đánh giá không thể đàm phán

AlphaEvolve có lợi từ các lĩnh vực đánh giá nhanh chóng, xác định và khó lừa đảo:

- **Matrix multiplication algorithm**: Một unit test, để thực hiện Matrix 乘法并逐 bit 检查相等性。
- **Borg scheduling heuristic**Một mô phỏng cấp sản xuất, được sử dụng để đặt lại các nguồn tài nguyên tính toán của tập hợp tải trọng và đo phí lãng phí.
- **FlashAttention kernel**:正确性测试加真实硬件 trên tường đồng hồ chuẩn.
- **Gemini training throughput**:以每步GPU-秒 衡量──

Trong mỗi trường hợp, nhà đánh giá đã nắm bắt những loại sai lầm LLM chủ yếu: tuyên bố chính xác giả tạo, tuyên bố hiệu suất biến mất trên phần cứng, cũng như trường hợp biên giới thất bại.

### Trả tiền hack là một mặt khác của câu chuyện

演化会优化评估器 测量任何东西――如果评估器不完美,循环就会找到这种不完美――在未经验证领域,循环会优化表层特征,而不是预期行为――DeepMind trong bài luận rõ ràng chỉ ra rằng: AlphaEvolve thành công chỉ chuyển sang các lĩnh vực 严谨性与搜索野心相匹配的评估器――

2025-2026 年代码搜索循环中的奖励 hacking 具体例:

- 奖励完成时间的优化目标,会奖励提交空解法──
- 奖励测试内正确性的基准 分数,会奖励记忆测试并过拟应──
- Một 代码质量代理 会奖励 xóa注释和重写变量名, ngay cả khi ngữ nghĩa không thay đổi.

Phương pháp sửa đổi trong AlphaEvolve: sử dụng LLM từ một đánh giá viên chưa từng thấy, và đánh giá khi tạo ra các thông tin nhập vào.

### Tại sao tìm kiếm LLM + 优于单独使用任一方

LLM có thể tạo ra những thay đổi có thể biên dịch được ừ ngữ nghĩa có vẻ hợp lý. GA của một 2000 行 Python 文件 có thể tự động biến đổi gần như luôn tạo ra những sai lầm về ngữ pháp. LLM cũng sẽ tập trung tìm kiếm vào một vùng lân cận hợp lý.

Ngược lại, nhà đánh giá sẽ nắm bắt giả thuyết của LLM. LLM sẽ tự tin tuyên bố một chức năng trong trường hợp tối đa là O  n log n) , nhưng nó thực tế là O  n^2;

### AlphaEvolve ở vị trí trung tâm của hàng biên giới

| System | Generator | Evaluator | Domain | Example win |
|---|---|---|---|---|
| AlphaEvolve | Gemini | correctness + benchmark | algorithms, kernels, schedulers | 48-mul 4x4 matmul |
| FunSearch (DeepMind, 2023) | PaLM / Codey | correctness | combinatorial math | cap-set lower bounds |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | LLM critique + experiment | ML research | ICLR workshop paper |
| Darwin Godel Machine (L4) | agent scaffolding | SWE-bench / Polyglot | agent code | 20% → 50% SWE-bench |

Bốn hệ thống này đều là các biến thể của cùng một phương pháp: máy phát sinh cộng với đánh giá, lặp lại vòng lặp.


```figure
alphaevolve-loop
```

## Sử dụng nó

`code/main.py`Trong một trò chơi biểu tượng-sự lùi lại  vấn đề thực hiện một vòng lặp giống như AlphaEvolve tối thiểu LLM  là một proxy stdlib, sẽ đưa ra một sự biến đổi ngôn ngữ nhỏ đối với các chương trình của hàm mục tiêu tính toán 

观察:

- Điểm số tốt nhất là sao?
- MAP-elite grid  làm thế nào để đa dạng hóa giải pháp tiếp tục tồn tại, để vòng lặp không nhận được giá trị tối thiểu ở địa phương.
- 移除 test held out (trình đánh giá chỉ có đào tạo) làm thế nào để chu kỳ xuất hiện quá trình chuẩn bị đáng kinh ngạc

## 交付 nó

`outputs/skill-evaluator-rigor-audit.md`Trong lĩnh vực mới, xem xét các điều kiện tiên quyết của vòng lặp kiểu AlphaEvolve: Liệu nhà đánh giá của bạn có thực sự có thể nắm bắt sự thất bại của bạn không?

## 练习

1. 运行 `code/main.py`◯ ghi chép ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯       ◯     ◯ ◯    ◯ ◯                                                                                                                                                                                                         `--no-holdout`(c) 并重新运行──量化过拟合──

2. 阅读 AlphaEvolve 论文中关于MAP-elite grid 的第3部分──为一个新问题 (ví dụ như các bài đăng tối ưu hóa trình biên dịch) thiết kế mô tả tính năng-vector, để tìm kiếm giữ đa dạng──

3. 48 lần乘法 4x4 kết quả trong 56 năm sau đã cải tiến 49-mul trên giới của Strassen.

4. 提出一个 AlphaEvolve 会失败的领域――准确指出评价者 在哪里失败以及原因――

5. 针对一个领域你熟悉,写出你会使用的评价者签名──包括 (a) 正确性条件, (b) 性能指标, (c) 输入生成规则, (d) 至少一个反奖励黑客检查──

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AlphaEvolve | “DeepMind 的演化式编码 agent” | Gemini + 程序数据库 + 可机器检查的 evaluator |
| MAP-elites | “保留多样性的 archive” | 由 feature Vectors 作为 key 的 grid；每个 cell 保存具有该 descriptor 的最佳变体 |
| Island model | “并行演化子种群” | 会周期性迁移的独立种群；防止过早收敛 |
| Machine-checkable evaluator | “确定性 oracle” | LLM 无法伪造的 unit test、simulator 或 benchmark，是这个循环的前置条件 |
| Reward hacking | “优化测量值，而不是目标” | 循环找到一种最大化分数但不完成预期任务的方法 |
| Seed program | “起点” | 循环从中演化的初始正确但次优程序 |
| Held-out evaluator | “LLM 从未见过的评估数据” | 在评估时生成的输入，用于防止记忆 |

## 延伸阅读

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) 完整论文──
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) 供应商撰写的结果说明──
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) được phát hiện của các thuật toán, bao gồm 48-mul 4x4 matmul
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6) Hệ thống trước đây
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) sẽ được định nghĩa là một phương pháp nghiên cứu quan trọng.
