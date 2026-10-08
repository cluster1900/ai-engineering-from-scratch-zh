# Jamba  SSM-Transformer Hybrid

> Mô hình không gian nhà nước (SSM) và Transformer  muốn gì khác nhau. Transformer  thông qua Attention 换取质量, nhưng giá cả là sự phức tạp thứ hai. SSM  thông qua chuyển tiếp chuyển đổi định tuyến thời gian suy luận và lượng thường trong bộ nhớ, nhưng chất lượng落后. Jamba của AI21 (March 2024) và Jamba 1.5 (August 2024) đưa chúng vào cùng một mô hình: mỗi 7 Mamba layer配 1 layer Transformer, mỗi khối sử dụng MoE,并 cung cấp có thể hoạt động trong một đơn vị 80GB GPU trên khung hình 256k khung hình. Mamba-3 (ICLR 2026) thông qua các dự đoán không gian số và MIMO tăng cường SSM 侧.

**Type:** Learn
**Languages:** Python (stdlib, layer-mix calculator)
**前置要求:**Giai đoạn 10 · 14 (nền kiến trúc mô hình mở), Giai đoạn 10 · 17 (tránh chú ý ít bản địa)
**Time:** ~60 minutes

## Học mục tiêu
- 解释 Jamba block 中的三个原始:Tranformers layers、Mamba layers、MoE,以及1:7:even 的交错配方──
- Từ một chi tiết cao về hình thức tiếp tục của SSM, và tại sao nó có thể thực hiện các quy định trong bộ nhớ thường xuyên.
- 计算 Jamba 模型 trong bối cảnh 256k 下的 KV cache 占用并与纯变压器 模型所需内存进行比较──
- Nói ra ba sáng kiến của Mamba-3 (xác định phân khúc trapezoidal tăng trưởng, cập nhật trạng thái có giá trị phức tạp, MIMO) và các vấn đề về mỗi sáng kiến.

## 问题
Cảnh sát về độ dài của chuỗi là độ phức tạp thứ hai. Mô hình không gian trạng thái là tuyến tính. Sự khác biệt này được tăng lên liên tục: trên 256k token.

Mẫu Pure-SSM (Mamba、Mamba-2) ở quy mô nhỏ có thể phù hợp với biến thể phức tạp, nhưng trong nhiệm vụ theo dõi trạng thái 落后, và trong một số loại truy xuất trong ngữ cảnh  thất bại.

显而易见的修复方法:两者都用──在需要精确召回的地方放变压器层──其他地方使用SSM层──调节比例──Jamba là mô hình cấp sản xuất đầu tiên được giao theo cách quy mô lớn như vậy 配方的生产级模型(总计 52B、激活 12B、256k context、单张 80GB GPU)──Jamba 1.5 将该系列扩展到总计 398B / 激活 94B──Mamba-3(ICLR 2026) là hiện tại tốt nhất nguyên chất-SSM cơ sở, hybrid có thể được xây dựng lại xung quanh nó──

Bài học này sẽ đọc được 3 bài viết này, và hình thành lựa chọn đúng tỷ lệ của mô hình tư duy.

## 概念
### Một SSM trong một trang

Mô hình không gian nhà nước  thông qua trạng thái cố định`h`处理序列 `x_1, ..., x_N`- Có thể là:

```
h_t = A h_{t-1} + B x_t
y_t = C h_t
```

Mỗi bước, trạng thái qua đường dây động lực học`A`演化,接收输入 `B x_t`,并输出 `C h_t``A, B, C`Tất cả chúng ta có thể học.`y_t`Chỉ cần `h_{t-1}`和 `x_t`, không cần bất cứ điều gì sớm hơn `x`内存是常量推理是每个符号 O(1)

建模质量 关键 là `A`Trong quá trình tập luyện, có thể được sử dụng một matrix cấu trúc cao, có thể được sử dụng như một sự biến chuyển dài cao hiệu quả.`A, B, C`替换为依赖数据的形式 (也就是 选择性) 部分 (Mamba-2(2024) tiếp tục đơn giản hóa cấu trúc.

关键性质是: Đối với decoder LLM, lớp SSM có thể được sử dụng như là một thay thế trực tiếp cho lớp chú ý, thay thế cho cache KV đang phát triển liên tục bằng trạng thái từng tầng cố định.

### Khu phố Jamba

Khóa Jamba theo hai tầng số:

- `l`: Tín đối với người dùng của bạn`l = 8`, biểu thị mỗi 7 Mamba 层配 1 层 Transformer 层(7 Mamba + 1 Attention = 每组 8 层) ;;
- `e`: MoE tần số。 Jamba 使用 `e = 2`, cho thấy mỗi tầng ứng dụng MoE

khối 內层序列:

```
M  M  M  M  M  M  M  A    (7 Mamba + 1 Attention)
|  M  |  M  |  M  |  M    (where | marks MoE applied)
```

Mỗi khối Jamba là 8 tầng. Độ sâu là 4 khối.

### Tại sao tỷ lệ 1:7

AI21 đã thực hiện các sự trừu tượng: What kind of attention-to-Mamba example can in their long-context evaluations 上 get the best perplexity-per-parameter 和 in-context recall?

- Chú ý 太多(1:1): chất lượng tăng lên, nhưng bộ nhớ và tốc độ thay đổi.
- Cảnh sát 太少(1:15):内存 rất tốt, nhưng trong ngữ cảnh lấy lại 失败。
- Điểm tốt nhất là 1: 7 hoặc 1: 8

直觉是:Tầng biến đổi xử lý xác định gọi lại và theo dõi trạng thái.

### Mã hóa vị trí

Mamba layer 本身具有位置感知能力(通过递推) ―― nguyên thủy Mamba dựa trên lai 介中的注意层 没有使用 RoPE,因为 SSM layer 提供位置信息。Jamba 1.5 为注意层 添加 RoPE,以增强长文本概括;这是基于经验长文本评价的后进──

### Ngân sách bộ nhớ

对于 Jamba-1 形状(32层:28 Mamba + 4 Sự chú ý, ẩn 4096,32 đầu chú ý):

- KV cache( chỉ chú ý các lớp): trong 256k BF16 下为 `2 * 4 * 32 * 128 * 256k * 2 = 8.4 GB`Chỉ có 4 lớp chú ý  đóng góp KV cache 👍
- SSM trạng thái: mỗi token tiền tố 为 `28 * hidden * state_size`, nhưng đây là từng tầng cố định, không theo chuỗi dài mở rộng.`28 * 4096 * 16 * 2 = 3.7 MB`

Tương tự như 32 tầng 32 đầu đầy MHA của biến thể tinh khiết 相比: trong 256k BF16 下为`2 * 32 * 32 * 128 * 256k * 2 = 128 GB` KV cache  giảm 8x── ngay cả đối với hầu hết các 2024 模型使用的 GQA(8) cơ sở(`2 * 32 * 8 * 128 * 256k * 2 = 32 GB`),Jamba's 1:7 hybrid ở 16 GB dưới vẫn nhỏ 2x.

Đó là những gì AI21 nói về  đơn张 80GB GPU trên 256k ngữ cảnh──full-MHA pure Transformer's KV cache 放不下; ngay cả khi GQA cơ sở cũng hầu như không cung cấp trọng lượng và kích hoạt 留空间; còn Jamba 可以──

### Mamba-3: 2026 năm của tinh khiết-SSM cơ sở

Mamba-3(ICLR 2026, arXiv:2603.15569) trong Pure-SSM 侧 đã đưa ra ba sáng kiến:

1. **Exponential-trapezoidal discretization.**Sử dụng nhiều hơn để thay thế chuyển tiếp trong Mamba-2 trong phương pháp Euler.`x_t`Ưu độ bên ngoài 

2. **Complex-valued state update.**之前的Mamba 将状态矩阵从复杂(S4)降低为真实横向(Mamba),再降低为规模身份(Mamba-2) ・・・Mamba-3 重新加入复杂值,相当于对状态进行数据依赖的旋转嵌入──这恢复了之前的真实值 简化所牺牲的状态跟踪能力──

3. **Multi-input multi-output (MIMO) projections.**Không sử dụng dự đoán kích thước tính năng, mà sử dụng dự đoán giá trị matrix. Trong trường hợp không tăng độ trễ giải mã, nâng cao khả năng xây dựng và tính toán.

Trong 1,5B 参数 quy mô,Mamba-3 tương đương với Gated DeltaNet sẽ tăng độ chính xác trung bình dòng chảy xuống 0.6 个点; biến thể MIMO tăng thêm 1.2 个点, tổng cộng tăng 1.8 个点.

Mamba-3 chưa được sản xuất trong sản xuất lai quy mô lớn, nhưng rõ ràng là một ứng cử viên của hệ thống SSM lớp Jamba thế hệ sau.

### 何時使用 lai

Hybrid 适合:

- Context 足足长, đến khi bộ nhớ KV Transformer nguyên chất 变得痛苦(64k+)。
- 任务混合了短距结构 (适合SSM) và nhớ dài (需要变压器)
- Bạn muốn được triển khai trên ngân sách lưu trữ GPU đơn, trong khi bộ nhớ cache KV của Transformer đang ở trong đó.

Hybrid không phù hợp với các tình huống sau:

- Context 很短(低于16k) ・SSM Overhead 被浪费;纯变压器 足够好。
- 任务需要在任何地方注意----深度推理、多文档交叉引用) ――Hybrid 中 注意层的稀疏性会伤害效果──
- Bạn đang mở rộng đến các mô hình biên giới hàng nghìn tỷ tham số.

### Vị cảnh cạnh tranh

| Model | Family | Scale | Unique claim |
|-------|--------|------|-------------|
| Mamba-2 | pure SSM | 3B | linear time, constant memory |
| Jamba | hybrid | 52B/12B | 256k on 80GB |
| Jamba 1.5 Large | hybrid | 398B/94B | enterprise-grade long-context |
| Mamba-3 | pure SSM | 1.5B (paper) | state-tracking restored |
| DeepSeek-V3 | pure Transformer + MoE | 671B/37B | frontier capability |

Khả năng tăng trưởng của các công ty công nghệ và công nghệ công nghệ trong lĩnh vực công nghệ công nghệ và công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ công nghệ


```figure
swiglu-ffn
```

## Sử dụng nó
`code/main.py`là một bộ tính trong cấu trúc lai. Với tỷ lệ SSM-Transformer và cấu hình kích thước ẩn / lượng lớp, nó sẽ tính:

- 目标 context 下的 KV cache──
- SSM trạng thái bộ nhớ.
- Một loạt hình dạng mô hình trong bối cảnh N 下 的总内存──

Các máy tính hỗ trợ:

- Định nghĩa cơ sở của Pure-Transformer (KV cache)
- Phép hợp 1: 7 kiểu Jamba.
- Pure-SSM( hoàn toàn không có cache KV)。

Đối với hình dạng đã được phát hành, số trực tiếp từ Jamba-1 và Jamba-1.5 bài luận; đối với giả định biến thể, thì là ngoại推得到──

Thực sự triển khai của Bộ Tư pháp:

- 大多数生产推理服务器 (vLLM、SGLang) hỗ trợ Jamba 和 Mamba。检查具体版本──
- Trong bối cảnh 256k, Jamba có ưu điểm trong bộ nhớ hiện đang có dung lượng yêu cầu đồng thời trên. Trong cùng VRAM, bạn có thể chứa nhiều chuỗi Jamba hơn so với chuỗi Transformer.
- Mamba-3 như một mô hình độc lập chưa được sản xuất, chỉ là bản xem trước nghiên cứu của 1.5B.

## 交付 nó
本课会产出 `outputs/skill-hybrid-picker.md` Đưa ra đặc điểm tải trọng công việc ((định hướng chiều dài ngữ cảnh, hỗn hợp nhiệm vụ, ngân sách bộ nhớ), nó sẽ đưa ra khuyến nghị giữa Transformer tinh khiết, hybrid kiểu Jamba và SSM tinh khiết, và xác định rõ ràng trong bộ nhớ và trọng lượng chất lượng.

## 练习
1. 运行 `code/main.py`,计算 32 层 Pure Transformer ((đỏ 4096,32 đầu) và giống nhau hình dạng Jamba-1 hybrid trong bối cảnh 256k 下的 KV cache──验证 AI21 论文声称的约8x内存降低──

2. 修改计算器,建模 1:3 hybrid(4 Mamba: 1 Attention) và 1:15 hybrid(14 Mamba: 1 Attention) ―― vẽ KV cache vs ratio──在哪个比例 下 KV cache等于SSM状态内存?

3. 阅读 Jamba 论文(arXiv:2403.19887) 的第 3 节──解释为什么AI21 sử dụng Mamba-1 chứ không phải Mamba-2, mặc dù Mamba-2 更快──提示:Hybrid ablation section 记录这一点──

4. 计算 Jamba 1.5 Lớn 中 MoE-tất cả các tầng khác của các tham số trênhead( tổng计 398B, kích hoạt 94B) ・・・ sẽ hoạt động tỷ lệ với DeepSeek-V3(37B/671B) So sánh,并 giải thích tại sao Jamba của cấu trúc sẽ đưa hoạt động tỷ lệ 推得更高──

5. 阅读 Mamba-3 论文(arXiv:2603.15569) 的第 3 节──用三句话解释为什么复杂-valued state update 等价于数据依赖的旋转嵌入──把答案关联到阶段 7 · Bài học 04 的 RoPE 推导──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| State space model (SSM) | “带固定状态的递推” | 具有学习到的递推 `h_t = A h_{t-1} + B x_t` 的层；每个 token 使用常量内存 |
| Selective SSM | “Mamba 的技巧” | 依赖数据的 A、B、C 参数，使模型在线性时间下获得类似 gating 的选择性 |
| Attention-to-Mamba ratio | “多少个 Attention layers” | 在 Jamba 中，`l = 8` 表示每 7 个 Mamba layers 配 1 个 Attention layer |
| Jamba block | “8 层一组” | 一个 Attention + 七个 Mamba + 在交替位置使用 MoE |
| SSM state | “隐藏缓冲区” | 固定大小的逐层状态，用于替代 Mamba layers 的 KV cache |
| 256k context | “Jamba 的旗舰数字” | Jamba-1 可在单张 80GB GPU 上容纳的序列长度；pure Transformer 在该大小下无法做到 |
| Mamba-3 | “2026 pure SSM” | 当前最佳 pure-SSM architecture，具有 complex state + MIMO；是 hybrid 重新构建时围绕的 baseline |
| MIMO | “Multi-input multi-output” | Mamba-3 的创新，使用 matrix-valued projections 而不是逐 feature 标量 |
| Exponential-trapezoidal discretization | “Mamba-3 的递推” | 更有表达力的递推，包含 Mamba-2 的 Euler-method discretization |
| Hybrid architecture | “混合 Attention 和 SSM” | 任何交错 Transformer 和 SSM layers 的模型；Jamba 是生产级原型 |

## 延伸阅读
- [Lieber et al. — Jamba: A Hybrid Transformer-Mamba Language Model (arXiv:2403.19887)](https://arxiv.org/abs/2403.19887) 原始 Jamba 论文, tỷ lệ trừu tượng,256k ngữ cảnh 声明
- [AI21 — Jamba 1.5: Hybrid Transformer-Mamba at Scale (arXiv:2408.12570)](https://arxiv.org/abs/2408.12570) 扩展后的系列,398B/94B 和 12B/52B 公开发布
- [Gu, Dao — Mamba: Linear-Time Sequence Modeling with Selective State Spaces (arXiv:2312.00752)](https://arxiv.org/abs/2312.00752) Jamba 构建所 dựa trên SSM chọn lọc 论文
- [Dao, Gu — Mamba-2 (arXiv:2405.21060)](https://arxiv.org/abs/2405.21060)  đơn giản hóa không gian nhà nước cấu trúc 后继者
- [Lahoti et al. — Mamba-3 (arXiv:2603.15569, ICLR 2026)](https://arxiv.org/abs/2603.15569) trạng thái có giá trị phức tạp  MIMO  2026 biên giới SSM thuần túy
- [Gu et al. — Efficiently Modeling Long Sequences with Structured State Spaces (arXiv:2111.00396)](https://arxiv.org/abs/2111.00396) S4 论文,面向LLMs của SSM 谱系起点
