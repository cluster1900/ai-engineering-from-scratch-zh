# Async với Hogwild!

> Việc giải mã giả định (Phase 10 · 15) sẽ diễn ra trong một chuỗi đơn lẻ trong các mã thông báo trong các khung đa đại lý sẽ diễn ra trong toàn bộ chuỗi trong các chuỗi, nhưng sẽ bắt buộc sự phối hợp rõ ràng trong việc bỏ phiếu. Inference(Rodionov et al., arXiv:2504.06261) làm một điều khác:并行运行 cùng một LLM N 个实例,并让它们共享一个关键值缓存――每个工人都能立即看到其他工人生成的代币――现代推理模型QwQ、DeepSeek-R1无需任何细节调整,就能通过这个共享缓存自我协调―― phương pháp này vẫn đang ở giai đoạn thử nghiệm, nhưng nó mở ra một chiều dài hoàn toàn mới của sự song song của suy luận, và cũng giải mã chính xác. mô phỏng,并 giải thích tại sao sự hợp tác lưu trữ chung sẽ xuất hiện từ khả năng suy luận của mô hình hiện có.

**类型：**Xây dựng
**语言：**Python (stdlib)
**先修：**Giai đoạn 10 · 12 ((những kết quả tối ưu hóa),Giai đoạn 10 · 15 ((những kết quả dự đoán)
**时间：**~ 60 phút

## Học mục tiêu

- mô tả 3 loại thường见的平行LLM topologies (( bỏ phiếu, phụ trách, Hogwild!), và giải thích từng vấn đề được nhắm đến
- Nói ra thiết lập cốt lõi của Hogwild!: nhiều công nhân, một bộ nhớ KV chung, thông qua tự động hóa, đạt được sự phối hợp mới.
- Theo số lượng người lao động`N`、sự song song cấp nhiệm vụ `p`Và tổng chi phí phối hợp`c`计算 Hogwild! của tường thời gian tăng tốc.
- Trong vấn đề đồ chơi trên thực hiện một mô phỏng Hogwild hai người làm việc,并观察 phát triển phân chia nhiệm vụ.

## 问题

Các LLM hiện đại  thông qua việc tạo ra chuỗi lý luận dài để giải quyết các vấn đề khó khăn Lễ thuật từng bước của 5000 token  rất phổ biến, vấn đề toán học sâu xuất hiện hàng ngàn token cũng không ít thấy.

Việc giải mã định hình (Phase 10 · 15) thông qua trong một chuỗi đơn lẻ trong biến thể, có thể mang lại tốc độ 3-5x hơn.

 rõ ràng câu hỏi là: chúng ta có thể vượt qua các chuỗi và làm việc?

已有工作包括: nhóm bỏ phiếu(运行 N 个模型,选择多数答)  cây tư tưởng (分支出推理路径并重新组合) 以及 đa cơ quan (多代理框架)  chia sẻ phụ nhiệm vụ cho mỗi đại lý,并 sử dụng điều phối viên)  这些都能在特定任务域中提供帮助──但它们也都会引入显式协调机械投票规则、分支和逻辑、代理-to-agent消息传递协议──

Hogwild! Inference  áp dụng phương pháp khác nhau. N 个工共享一个KV cache. Mỗi công nhân sẽ ngay lập tức nhìn thấy các token sinh ra của người lao động khác, giống như những token này đã được xử lý trong bối cảnh của mình.

截至 2026 年 4 月, tốc độ phụ thuộc vào khối lượng công việc, và vẫn còn trong giai đoạn thử nghiệm. Nhưng ý tưởng này đáng để hiểu, vì nó mở ra một chiều dài mới của sự song song song suy luận.

## 概念

### 设置

Đổi lại, tất cả các quy trình của công nhân đều hoạt động cùng một LLM. Không sử dụng bộ nhớ cache KV cho mỗi công nhân, mà duy trì một bộ nhớ cache chia sẻ.`i`生成 token `t_j`时, token này sẽ được viết vào vị trí tiếp theo của shared cache.`k`执行下一步时,它读取缓存的当前状态 (), trong đó có chứa tất cả các N 个工 生成的全部内容) ⋅

Trong thời gian bước, công nhân sẽ cạnh tranh để viết mã thông báo. Không có chỉ số vị trí cho mỗi công nhân.

### Tại sao sự phối hợp sẽ nổi lên

người lao động 共享一个提示──通常类似于: Bạn là một trong số các trường hợp N làm việc cùng nhau trên vấn đề này. Mỗi trường hợp đọc bộ nhớ chia sẻ và có thể xem những trường hợp khác đã viết. Tránh làm việc dư thừa.

Hogwild! paper ((Rodionov et al., 2025) báo cáo như sau:

- Công nhân sẽ lập kế hoạch, và thông qua cache truyền tải cho các công nhân khác.
- Công nhân sẽ nhận thấy những sai lầm trong lý luận của các công nhân khác, và chỉ ra những vấn đề này.
- Công nhân sẽ có kế hoạch 失败时适应情况,并提出替代方案.
- Khi prompt  yêu cầu kiểm tra việc nghỉ ơ, công nhân 会检测到它并转向其他工作.

Những điều này không cần phải được điều chỉnh tốt hơn.

### 命名

Tên của bài viết này đã lấy từ Hogwild! SGD(Recht et al., 2011), một loại tối ưu hóa cập nhật không đồng bộ.

### RoPE  làm cho điều này trở nên khả thi

Rotary Position Embeddings(RoPE, Su et al. 2021) thông qua quay giữa các vector Q và K 编码 thông tin vị trí.`i`写入 chia sẻ cache của vị trí `p`时,读取该职位的其他员工可以直接使用缓存输入不需要重转

Trong mô hình learning-position hoặc absolute-position, Hogwild! 会在每次同时写时都需要缓存无效──RoPE 让缓存 保持稳定──

### Thời gian tường 数学

设 `T_serial`Là một công nhân  đơn độc giải quyết vấn đề cần thời gian.`p`là phân số tương đương ở cấp độ nhiệm vụ.`c`Đó là chi phí phối hợp từng bước, và tôi quyết định viết gì.

Thời gian làm việc đơn:`T_serial`
Nếu sự phối hợp là miễn phí, N-thợ Hogwild! thời gian là:`T_serial * ((1 - p) + p / N)`Đó là câu chuyện cổ điển của Amdahl.
加入 phối hợp tổng lực 后:`T_serial * ((1 - p) + p / N) + c * steps_per_worker`

Để làm cho công nhân có sản phẩm,`c`必须相对于每步解码时间 足够小――对于生成5k+ token的推理模型,工人可以承受数百 token的协调费,并且仍然领先――对于短聊任务,协调会占主导,Hogwild!会比串行更差――

###  Ví dụ cụ thể

Vấn đề lý luận: 10k token của chuỗi suy nghĩ.`p = 0.7`Các nội dung tương đồng được tạo ra (đối với các chiến lược chứng minh khác nhau, phân tích các trường hợp khác nhau) và tổng chi phí phối hợp của mỗi nhân viên`c = 200`token。 sử dụng `N = 4`Công nhân:

- Thời gian hàng: 10000 bước giải mã.
- Hogwild! thời gian: 10000 * (0.3 + 0.7 / 4) + 200 * 4 = 10000 * 0.475 + 800 = 5550 bước giải mã.
- Tốc độ tăng lên: 10000 / 5550 = 1,8x.

Đây chỉ là lợi ích trung bình. Nhưng trong các vấn đề lý luận dài hơn.

### 什么时候使用Hogwild!

- 长 lý luận vấn đề ((1000 token), trong đó nhiệm vụ có thể vượt qua các mục tiêu phụ độc lập并行化。
- 已被训练为步骤步骤思考的推理模型──非推理模型──无法很好地自我协调──
- Việc triển khai node duy nhất, và có đủ VRAM 容纳 bộ nhớ nhớ nhớ chung cộng với các quy trình nhân viên N 个.

### 什么时候不使用

- 短交互聊天──Coordination overhead 会占主导──
- 无法并行化任务(单一线性证明、单一编译) ――N=1 是上限──
- Các mô hình không hợp lý không có sự phối hợp hiện diện.
- Việc triển khai đa nút;. shared cache 需要非常快的跨工同步──Intra-node 可以;cross-node 会成为延迟灾难──

### 实验 trạng thái

截至 2026 年 4 月,Hogwild! là một phương pháp nghiên cứu,并有 open source PyTorch thực hiện.

1. 跨同步进程 管理共享 KV cache là một vấn đề kỹ thuật phi thường.
2. Sự phối hợp khẩn cấp phụ thuộc vào nhiệm vụ; các tiêu chuẩn vẫn đang được xây dựng.
3. So với lợi ích của việc giải mã giả định, tốc độ tăng cao hơn; hai thứ này có thể được kết hợp, nhưng sự phức tạp của công trình sau khi kết hợp là một tầng nữa.

Ưu tiên để biết. Ưu tiên để thử.


```figure
continuous-batching
```

##  xây dựng nó

`code/main.py`实现 một đồ chơi Hogwild! mô phỏng:

- Hai quy trình công nhân, mỗi là xác định của LLM, sẽ có một số loại mã thông báo được biết đến.
- Một cache chia sẻ chỉ là một danh sách mã thông báo, hai công nhân đều đọc và viết vào.
- Một logic phối hợp đơn giản: Khi một công nhân nhìn thấy một công nhân khác đã tạo ra đủ các mã công việc trong một danh mục, nó sẽ chọn một danh mục khác.

mô phỏng sẽ trong ngân sách giai đoạn cố định 下运行,并报告:

- 产生的工作代码 总数──
- 总 tường thời gian(các bước công nhân 数量)。
- Tăng tốc hiệu quả so với công nhân đơn.
- Người lao động nào đã ghi dấu vết của một biểu tượng nào?

### 步骤 1: shared cache

Một hai công nhân thành phố thêm vào danh sách.`threading.Lock`); Ở đây chúng tôi sử dụng máy tính 模拟。

### 步骤 2: vòng lặp người lao động

Mỗi công nhân trong mỗi bước:

- 读取当前 chia sẻ cache。
- 根据已有内容决定要写入哪类代币──
- 写入一个代号――

### 步骤 3: bộ phận phối hợp

Nếu loại X trong cache đã có K 个 token, và người lao động đã viết ra loại X, thì người lao động sẽ chuyển sang loại Y. Đây là một đồ chơi thay thế, để thể hiện hành vi của mô hình lý luận:

### 步骤 4: đo tốc độ

分別使用 N=1 worker 和 N=2 workers 运行模拟器, sử dụng cùng một tổng bước ngân sách──统计产生的工作标志──由于协调驱动任务分区,N=2 应该产生约1.5-1.8x的工作标志──

### Bước 5: đối với sự phối hợp 施压

 giảm độ nhạy của sự phối hợp heuristic.  tái chạy.  quan sát nếu không có sự phối hợp tốt, N=2 sẽ có cơ hội tạo ra các biểu tượng tương tự, tốc độ sẽ giảm xuống dưới 1  Điều này phù hợp với quan sát trên giấy: kỹ thuật này chỉ có hiệu quả trong các công nhân  chỉ có khả năng tư duy tự phối hợp.

## Sử dụng nó

截至 2026 年 4 月, Hoogwild! tích hợp trong sản xuất vẫn là nghiên cứu cấp-Yandex/HSE/IST thực hiện tham chiếu dựa trên PyTorch, mục tiêu là DeepSeek-R1 và QwQ mô hình trên của một nút đa quy trình thiết lập.

务实的采用路径:

1. Profile Bạn của lý luận-phát vụ tải trọng công việc── đo token Trong các chiến lược khám phá, phân tích trường hợp, tìm kiếm) và tỷ lệ của tuyến tính──
2. Nếu khám phá, hãy thử nghiệm Hogwild! hai người lao động.
3. Nếu sự cải thiện thấp hơn 1,3x, cho thấy bạn đang ở trong chế độ phối hợp thống trị.
4. Nếu cải thiện  vượt quá 1,5x, tiến lên N=4 và đo lại.

Với việc giải mã giả định 组合: Mỗi người làm việc Hogwild! đều có thể sử dụng độc lập giải mã đặc trưng.

## 交付 nó

本课会生成 `outputs/skill-parallel-inference-router.md` Định định một hồ sơ tải trọng công việc lý luận (tương tự như: "token budget"",task parallelism profile"",model family"",deployment target"), nó sẽ được thực hiện trong việc bỏ phiếu"",tree-of-thought"",multi-agent"",Hogwild!" và các chiến lược giải mã giả định

## 练习

1. 使用默认设置运行 `code/main.py`▽ xác nhận trong cùng thời gian tường 内,N=2 Hogwild! cấu hình so với N=1 đường cơ sở  tạo ra nhiều công cụ-chỉ số hơn ⋅

2. 降低协调 heuristic 的强度(设置 `coordination_weight=0.1`(■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

3. 计算一个50k-token lý luận nhiệm vụ trong `p=0.8, c=500`且N=4 nhân viên 时的预期 Hogwild! speedup──再对对一个1k-token trò chuyện nhiệm vụ 在 `p=0.3, c=200`Và N=4 khi làm như vậy tính toán... Tại sao một là lợi nhuận, một khác là tổn thất?

4. 阅读 Hogwild! bài báo Phần 4 (đánh giá sơ bộ)  Tìm ra tác giả  báo cáo hai cách thất bại  mô tả một sự phối hợp tốt hơn nhanh chóng có thể làm thế nào để làm giảm bớt mỗi vấn đề

5. Trong game 中将 Hogwild! với mã hóa dự đoán 组合: mỗi công nhân 内部 sử dụng mã hóa mô hình 2 token 报告 tăng tốc nhân số  Khi hai công nhân cố gắng mở rộng cùng một tiền đề cache chia sẻ 时, sẽ xuất hiện vấn đề kế toán gì?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Hogwild! | “Parallel workers, shared cache” | 同一个 LLM 的 N 个 instances 并发运行，并共享一个 KV cache；通过 self-prompting 实现 emergent coordination |
| Shared KV cache | “The coordination medium” | 一个不断增长的 KV buffer，所有 workers 都会读取和写入；让 tokens 能在 workers 之间立即可见 |
| Emergent coordination | “No training needed” | 具备 reasoning 能力的 LLMs 可以读取 shared cache，并在没有任何 fine-tuning 或显式 protocol 的情况下分工 |
| Coordination overhead (c) | “Tokens spent orienting” | 每个 worker 读取扩展后的 cache 并决定下一步做什么的成本；相对于总 decode time 必须保持较小 |
| Parallelizable fraction (p) | “What can run in parallel” | Task-level parallelism：总工作中并非内在 sequential 的比例 |
| RoPE enables Hogwild! | “Rotary positions are shift-invariant” | 因为 positions 是 rotations，写入 shared cache 不需要重新计算之前的 tokens |
| Voting ensemble | “Run N, pick the majority” | 最简单的 parallel inference topology；适用于 classification，对 long-form reasoning 帮助较小 |
| Tree of thought | “Branch and prune” | 探索多个 branches 并进行 pruning 的 reasoning strategy；使用显式 coordination logic |
| Multi-agent framework | “Assign sub-tasks” | 每个 agent 获得一个 role；由 coordinator 编排；protocol overhead 很重 |

## 延伸阅读

- [Rodionov et al. — Hogwild! Inference: Parallel LLM Generation via Concurrent Attention (arXiv:2504.06261)](https://arxiv.org/abs/2504.06261) Hogwild! báo cáo, trong QwQ và DeepSeek-R1 trên đánh giá sơ bộ
- [Recht, Re, Wright, Niu — Hogwild!: A Lock-Free Approach to Parallelizing Stochastic Gradient Descent (arXiv:1106.5730, NeurIPS 2011)](https://arxiv.org/abs/1106.5730) 原始 Hogwild!,名称来源
- [Su et al. — RoFormer: Enhanced Transformer with Rotary Position Embedding (arXiv:2104.09864)](https://arxiv.org/abs/2104.09864) RoPE, làm cho suy luận cache chia sẻ có thể thực hiện được
- [Yao et al. — Tree of Thoughts: Deliberate Problem Solving with Large Language Models (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) Chiến lược lý luận của cây tư tưởng, Hogwild!
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) giải mã giả thuyết, Hogwild! có thể được kết hợp với sự tương đồng trong chuỗi
- [Hogwild! reference PyTorch implementation](https://github.com/eqimp/hogwild_llm) Nguyên nhân duy nhất của sự thật trong các thí nghiệm trên giấy
