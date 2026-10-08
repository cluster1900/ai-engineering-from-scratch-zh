# Sự riêng tư khác biệt của LLM

> DP-SGD vẫn là một thực hành tiêu chuẩn: Đánh vào tiếng ồn 更新提供形式化的 (epsilon, delta) 保证──计算、内存和效用方面的开销都很大;参数高效 DP-fine-tuning (LoRA + DP-SGD) là phổ biến trong cấu hình 2025 (ACM 2025)  Có hai loại bằng chứng: dựa trên kết luận thành viên của Canary (Duan et al., 2024)  Báo cáo về thành công của mô hình ngôn ngữ; đào tạo-khiết dữ liệu (Carlon et al., 2021; Nasr et al., 2025)  Khôi phục bộ nhớ từng chữ (arX: 2503.808, tháng 3 năm 2025):06 khoảng cách trong các quy mô đối tượng phân biệt:  dễ dàng nhất để lấy được        Ứng dụng thiết kế dữ liệu cá nhân dựa trên các mô hình cá nhân         Ứng dụng các mô hình cá nhân dựa trên các mô hình cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân cá nhân (MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS: MPS

**Type:** Build
**Languages:** Python (stdlib, DP-SGD 噪声注入和 ε-δ accountant 演示)
**Prerequisites:** Phase 01 · 09（信息论），Phase 10 · 01（大模型训练）
**Time:** ~60 分钟

## Học mục tiêu
- 定义 (epsilon, delta) - sự riêng tư khác biệt,并说明 DP-SGD 流程──
- Giải thích 张力 2024-2025: MIA Canary và khai thác dữ liệu đào tạo  đã cho thấy một khung cảnh khác nhau.
- Mô tả PMixED, và tại sao dự đoán riêng tư thời gian suy luận là một thay thế cho đào tạo DP.
- 描述 Sự đảo ngược quyền riêng tư khác nhau thông qua LLM Feedback 攻击。

## 问题
LLM 会记忆──Carlini et al. 2021 cho thấy, mô hình ngôn ngữ sản xuất sẽ theo yêu cầu từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ từ.

## 概念
### (ε, δ) - sự riêng tư khác biệt

Nếu đối với bất kỳ hai chỉ khác nhau một tập hợp dữ liệu mẫu, cũng như bất kỳ sự kiện S, một thuật toán ngẫu nhiên M 满足:
P(M(D) trong S) <= e^ε * P(M(D') trong S) + δ。

解释:输出分布足够接近 (由 ε 参数化) , vì vậy bất kỳ đóng góp của một cá nhân nào cũng không thể được đưa ra một cách đáng tin cậy trừ khi có ngoại lệ xảy ra với tỷ lệ δ.

### DP-SGD

Abadi et al. 2016。标准流程:
1. 采样一个小批量.
2. 计算 mỗi ví dụ gradient。
3. Để cắt giảm mỗi gradient trên mỗi ví dụ  cắt xuống giá trị C.
4. Đối với các gradient sau cắt 求和,并加入 std 为 σ * C của tiếng ồn Gaussian.
5. Sử dụng ồn ồn và đến cập nhật các tham số.

隐私成本由会计师跟踪(Moments 会计师、Rényi DP会计师)                                                                                                                                                                                                                                                  

### LoRA + DP-SGD

Đối với mô hình biên giới thực hiện hoàn chỉnh DP-SGD 代价过高.LoRA (Hu et al. 2022) sẽ Gradient 更新限制在一个小型适配器中,从而减少每例梯度 存储──LoRA + DP-SGD 是常见的 2025配置──DP 保证适用于适配器;基模型 保持固定──

### Tăng lực trong năm 2024-2025

两条证据线:

- **Canary MIA (Duan et al. 2024)。**Để chỉ có một người Canary 插入训练数据, đo lường thành viên-những kẻ tấn công là có thể nhận ra chúng không.
- **Training-data extraction (Carlini 2021, Nasr et al. 2025)。**Sử dụng tiền tố 提示模型; đo liệu nó có thể phục hồi từ tập luyện theo từng chữ văn bản.

Giải pháp của tháng 3 năm 2025 (arXiv:2503.06808): Các biện pháp đo lường là những điều khác nhau. MIA hỏi là: mẫu e có nằm trong D không? đối tượng là được thấm vào Canary.

MIA dựa trên tổn thất không cần thiết của mô hình bóng tối mới của Canary.

### Chương trình thay thế đào tạo DP

- **PMixED (arXiv:2403.15638)。**dự đoán riêng của thời gian suy luận ⋅ trong các biểu tượng tiếp theo phân bố sử dụng hỗn hợp các chuyên gia; mỗi chuyên gia nhìn thấy một training dữ liệu mảnh; tập hợp khi gia nhập tiếng ồn để thực hiện DP── hoàn toàn tránh đào tạo DP──
- **DP synthetic data generation (Google Research 2024)。**Sử dụng DP-SGD  thực hiện LoRA-fine-tune, lấy dữ liệu tổng hợp, tái trong dữ liệu tổng hợp 上训练下游分类器。

Hai đều đi ngang qua chi phí hiệu quả của đào tạo DP hoàn chỉnh, nhưng chi phí là áp dụng mô hình đe dọa khác nhau.

### Thông qua LLM Feedback 逆转  Differential Privacy

2025 年新兴攻击──将 DP-trained model confidence scores 用作 Oracle 来重新识别个体──即使输出不泄漏,信心分布也可能泄漏──

防守方式: đừng tiết lộ sự tin tưởng, hoặc trước khi được tiết lộ đối với việc cắt/ định lượng.

### Đây là vị trí ở giai đoạn 18.

Bài học 20-21 là thiên vị/ công bằng. Bài học 22 là sự ẩn giấu. Bài học 23 là thông qua đánh dấu nước để thực hiện xuất xứ. Bài học 27 覆盖监管层面的数据来源层.


```figure
an-dp-clip-noise
```

## Sử dụng nó
`code/main.py`Trong một bộ dữ liệu phân loại nhị phân đồ chơi có thể xem số nhân tiếng ồn σ và tiêu chuẩn cắt C, và theo dõi (ε, δ) ngân sách và chi phí chính xác. Một cuộc tấn công có thể được đưa vào một mẫu tập luyện duy nhất, và đo kiểm tra mất tích nhật ký.

## 交付 nó
本课会产出 `outputs/skill-dp-audit.md` Đưa ra một tuyên bố DP của một mô hình ngôn ngữ được triển khai, nó sẽ kiểm tra: ((ε, δ) giá trị, sử dụng kế toán, giao thức đánh giá MIA, cũng như liệu nó đã đánh giá các vector tín dụng-trả nhiễm hay không.

## 练习
1. 运行 `code/main.py`◊扫过 σ ∈ {0.5, 1.0, 2.0},并报告 (ε, δ) - chính xác 权衡──识别效用崩的临界点──

2. 实现 Canary 插入和日志损失测试――测量在 σ = 1.0 时,DP-SGD 前后的检测率──

3. 阅读 Nasr et al. 2025 关于训练数据提取的内容──为什么提取成功不会在中等 ε下崩?

4.  thiết kế một sử dụng PMixED (arXiv:2403.15638) của triển khai, để nó hoàn toàn trong thời gian suy luận 运行.

5. 概述 DP Reversal via LLM Feedback 攻击──设计一个限制信任评分 泄漏的对策,并估算其部署成本──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DP | “(ε, δ)-differential privacy” | 形式化隐私：在相邻数据集变化下，输出分布保持接近 |
| DP-SGD | “noise-injected SGD” | Gradient clipping + Gaussian noise addition；标准 DP training |
| LoRA + DP-SGD | “efficient private fine-tune” | 在 low-rank adapters 上做 DP-SGD；标准 2025 配置 |
| MIA | “membership inference” | 判断某个样本是否出现在训练数据中的攻击 |
| Canary | “inserted watermark example” | 用于测量 DP 泄漏的唯一训练样本 |
| PMixED | “private inference mixture” | 在 inference time 通过 next-token 分布上的 mixture-of-experts 实现 DP |
| DP Reversal | “confidence leakage attack” | 使用模型 confidence 作为 oracle 进行重新识别的攻击 |

## 延伸阅读
- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) 标准 DP thuật toán đào tạo
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) 经典 trích dẫn 论文
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) Thành công hạn chế của MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) đối với các giải pháp
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) thời gian suy luận 私有预测
