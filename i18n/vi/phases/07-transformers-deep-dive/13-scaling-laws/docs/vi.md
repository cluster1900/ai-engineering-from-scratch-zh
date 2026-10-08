# Luật quy mô

> Năm 2020 Kaplan 论文说:模型越大,Loss越低──2022年 Hoffmann 论文说:你们训练不足──计算会进入两个桶:参数和代币,而两者的分配不显而易见──

**Type:** Learn
**Languages:** Python
**先修要求:**Giai đoạn 7 · 05 (Tổng biến đổi), Giai đoạn 7 · 07 (GPT)
**Time:** ~45 分钟

## 问题

Khi bạn có các bài tập về tính toán C FLOPs, và muốn có được mô hình tốt nhất, bạn phải đối mặt với hai vòng xoay:

1. **多少参数 (N)？**Mô hình càng lớn, dung lượng càng cao.
2. **多少训练 Token (D)？**Số liệu càng nhiều, dung lượng sử dụng càng đầy đủ.

FLOPs gần似按 `6 × N × D`缩放―― bạn có thể nâng cao N ̊ giảm D, cũng có thể nâng cao D ̊ giảm N ̊ loại nào tốt hơn?

Trước năm 2022, câu trả lời là 尽量推高 N── GPT-3 (2020) là 175B 参数, trong khoảng 300B Token 上训── tỷ lệ khoảng 1.7 参数 Token── Kaplan Scaling Laws 支持这一点──

Hoffmann et al. (2022)  đào tạo một nhóm có tên là Chichilla's小型模型家族, phát hiện ra kết luận khác nhau:**每个参数 20 个 Token**GPT-3 训练不足 10×──Chinchilla(70B 参数,1.4T Token) trong trường hợp tính toán chi phí thấp 2,5×, trong tất cả các điểm chuẩn 上都 đánh bại GPT-3(175B,300B Token)

Năm 2026 là thế giới của Chinchilla, nhưng có một bước ngoặt quan trọng. Llama 3 8B trên 15 tỷ token trên đào tạo, tỷ lệ là mỗi tham số 1,875 token.

## 概念

![Chinchilla 曲线：不同 N/D 比例下的 Loss vs compute](../assets/scaling-laws.svg)

### Luật Hoffmann

Từ Chinchilla, Loss:

```
L(N, D) = A / N^α + B / D^β + E
```

- `N`= 参数(非 Nhập vào)
- `D`= 训练 Token。
- `α ≈ 0.34`- `β ≈ 0.28`(大致对称)
- `E ≈ 1.69`, không thể mất đi giới hạn trên.
- `A ≈ 406`- `B ≈ 411`

随着扩展, hai项会彼此权衡──在固定计算中 ((C = 6ND) 下对 `N`求导并求解:

```
N_opt ≈ 0.6 × (C/6)^0.5
D_opt ≈ 0.6 × (C/6)^0.5
D_opt / N_opt ≈ 20
```

Tính tối ưu tính toán: mỗi参数 20 Token.

### Tại sao vẫn phải tập quá nhiều?

Chinchilla- tối ưu tối thiểu là mỗi tập FLOP đối với việc đối phó với việc tập Loss.

Đối với dịch vụ hàng tháng của một tỷ token, các phương pháp của Llama là: mô hình nhỏ hơn, đào tạo lâu hơn.

- Có thể đưa vào GPU tiêu dùng cấp.
- 延迟只是70B Chinchilla-optimal 的一小部分──
- Đối với hầu hết các nhiệm vụ, chất lượng đủ gần.

DeepMind 2024 年论文 (("Thiết đào tạo là tối ưu mới") sẽ hình thành điểm này.

### 涌现 vs 平滑性

主张: Một số khả năng (算术,多步推理, theo chuỗi suy nghĩ) sẽ xuất hiện đột ngột ở một số quy mô.

Schaeffer et al. (2023) 认为这是测量伪影:涌现指标使用不连续评分(lòng phù hợp chính xác、值精度),会隐藏底层logits的平滑改进──连续指标(cross-entropy) hiển thị là平滑曲线──

Đến năm 2026, đồng ý là: thông qua Loss liên tục  tiến hành dự đoán là đáng tin cậy.

### 2026 年图景

Các quy định quy mô vẫn còn hiệu lực, nhưng:

| 因素 | 如何变化 |
|--------|-------------|
| 数据质量 | 筛选“好”Token（Phi-style）可使曲线移动，相当于 >2× effective compute |
| MoE | 总参数与 active FLOPs 解耦；Scaling Laws 按 per-active-FLOP 计算 |
| 后训练 | 某些能力（指令遵循、代码）受 SFT+RLHF 的影响比 pretraining 更大 |
| Multimodal | 图像 + 文本 Token 一起缩放；每种模态有单独曲线 |
| 合成数据 | 模型生成训练数据；effective compute 可以复合增长 |

Muon Optimizer (Kimi Moonlight, 2024) cho thấy, trong quy mô dữ liệu phù hợp, so với AdamW có khoảng 2x lợi ích tính toán hiệu quả. Một số bài tập năm 2026 được thực hiện theo định nghĩa sử dụng Muon. Nó thay đổi các thường xuyên tuyệt đối trong Luật quy mô, chứ không phải hình dạng.


```figure
scaling-laws
```

##  xây dựng nó

见 `code/main.py` Chúng tôi thực hiện phương pháp mất mát Chinchilla, và tính toán một số 预算 dưới tìm kiếm giải pháp tính toán tối ưu `(N, D)`

### 步骤 1: mất Chinchilla

```python
def chinchilla_loss(N, D, A=406.4, B=410.7, alpha=0.34, beta=0.28, E=1.69):
    return A / N ** alpha + B / D ** beta + E
```

Ở cố định `C = 6ND`下,将 `L`绘制为`(N, D)`Ưu điểm cao hơn. Tìm giá trị tối thiểu.

### 步骤 2: 计算优优边界

Đối với`1e17`Đến`1e25`FLOPs của tính toán  ngân sách, tìm thấy trong khoảng thời gian `6ND = C`下 tối thiểu hóa Loss của `(N, D)`❖ tỷ lệ chứng minh`D/N ≈ 20`

### 步骤 3: quá mức chi phí đào tạo

计算训练一个小10×的模型(最优 N 的 1/10,最优 D 的 10×) 所支付额外损失──报告换来的推理 FLOP 节省(与 N 成正比)──

### Bước 4: So sánh với mô hình thực tế

填入 GPT-3、Chinchilla、Llama 3 8B、DeepSeek-V3(active params) của đã biết `(N, D)`Đối với,并 so sánh dự báo Loss với báo cáo Loss

## Sử dụng nó

Bạn không quá có thể tự tập biên giới 模型...... nhưng quy mô luật có thể nói với bạn:

1. **你的 fine-tune 是否有足够数据。**Nếu nhiệm vụ cụ thể dữ liệu thấp hơn mô hình cơ bản Mỗi tham số 20 token, dự kiến sẽ ở một số Loss floor 处和。
2. **是否选择更大的 base model。**Nếu toàn bộ ngân sách của bạn dành cho suy nghĩ, ưu tiên chọn mô hình nhỏ hơn, tập luyện lâu hơn.
3. **收益在哪里递减。**n hơn 1000 lần n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n n

**2026 年的研究轨迹：**

- **数据受限状态。**Web 上高质量 Token 数量有限 (过后约5-10亿亿英语) ――Border pretraining 正接近这个上限――合成数据多语言多模态,以及RLHF-scale fine-tuning 是下一批杆──
- **Compute-multiplier 技巧。**Muon Optimizer, MoE, better data 选, mỗi mô hình sẽ di chuyển với số thường tuyệt đối, thay vì đường gần.
- **RL 的 Scaling Laws。**开放问题──证据早期表明 RL mẫu có quyền lực trong luật, nhưng chỉ số và trước đào tạo  rất khác nhau──

## 交付 nó

见 `outputs/skill-training-budget-estimator.md` Kỹ năng này sẽ được sử dụng trong một số tính toán 预算  triển khai  hạn chế và mục tiêu Loss, để một lần nữa đào tạo mới`(N, D, hours, GPU)`

## 练习

1. **Easy.**运行 `code/main.py`△打印 tính toán 预算 `1e20``1e22``1e24`下的Chinchilla-optimal `(N, D)`                                                                                                                                                                                                                                                              
2. **Medium.**实现 Hoffmann Loss-as-function-of-computing 曲线──为 compute-optimal frontier 绘制 Loss vs `log10(C)`❖ nhận ra luật pháp 预测 我们何时需要 `>10^28`FLOPs 才能让交叉entropy 再降低 0.1──
3. **Hard.**Trong cùng bộ dữ liệu trên tập luyện 5 mô hình nhỏ ((100K đến 10M 参数), phù hợp với quy mô của riêng bạn Luật ước tính `α`和 `E`◊ Chỉ số của bạn phù hợp với kết quả đã được xuất bản như thế nào?

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Parameters (N) | “模型大小” | 非 Embedding 权重数量；决定容量。 |
| Tokens (D) | “训练数据” | 见过的训练 Token 数；决定参数被利用得有多充分。 |
| Compute (C) | “花费的 FLOPs” | 对标准 Transformer 来说，约为 `6 × N × D`。 |
| Chinchilla-optimal | “D/N ≈ 20” | 最小化 pretraining 每 FLOP Loss 的比例。 |
| Over-training | “超过 Chinchilla” | 花费额外训练 FLOPs 来节省推理 FLOPs；D/N >> 20。 |
| Irreducible loss | “底部” | Scaling Law 中的 `E` 项；数据本身的熵。 |
| Emergent capability | “规模上的突然跳变” | 通常是评分器伪影；连续 Loss 是平滑的。 |
| Effective compute | “训练效率倍增器” | 更好的数据 / Optimizer / 架构会倍增每个 FLOP 的作用距离。 |

## 延伸阅读

- [Kaplan et al. (2020). Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) 第一篇 Luật quy mô 论文; training不足──
- [Hoffmann et al. (2022). Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556) Chinchilla。
- [Schaeffer et al. (2023). Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) 涌现作为测量伪影──
- [Sardana, Frankle (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448) Tại sao quá trình đào tạo của Llama 适应其工作负载.
- [Jordan et al. (2024). Muon: An optimizer for hidden layers in neural networks](https://kellerjordan.github.io/posts/muon/) 2x nhân tính toán
