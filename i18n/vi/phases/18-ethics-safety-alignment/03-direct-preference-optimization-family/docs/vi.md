# Cấp thích trực tiếp Family

> Rafailov et al. (2023) chứng minh, các giải pháp tối ưu nhất của RLHF có thể được sử dụng dữ liệu ưu tiên 写成闭式形式, do đó bạn có thể nhảy qua mô hình phần thưởng rõ ràng, chính sách tối ưu hóa trực tiếp.

**Type:** Learn
**Languages:** Python (stdlib, 六种 preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## Mục tiêu học tập

- Từ带 KL của RLHF 最优解推导 DPO 闭式形式──
- Giải thích IPO, KTO, Simpo, ORPO, BPO tự sửa chữa các chế độ thất bại trong DPO.
- 区分隐含奖励差和偏好强,并解释 bản đồ danh tính của IPO 为什么重要
- 解释为什么 Rafailov et al. (NeurIPS 2024) 证明 DAAs 即使没有显而易的 RM也会过度优化──

## 问题

Mục tiêu RLHF:

```text
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

Có một giải pháp tốt nhất:

```text
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

Do đó, phần thưởng được định nghĩa bởi chính sách tối ưu và tỷ lệ giá trị tham chiếu:

```text
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

Đưa nó vào khả năng ưu tiên Bradley-Terry sau đó, chức năng phân vùng`Z(x)`Sẽ mất đi, vì nó chỉ phụ thuộc vào`x` còn lại là một sự mất mát chỉ có các tham số chính sách, không còn cần mô hình thưởng  Đó là DPO 

问题在于: 推导假设最优解可达、偏好数据是 in-distribution,并且参考政策是真正的模式──这些条件没有一个完全成立──每个成员都修复一个不同的被违背假设──

## 概念

### DPO (Rafailov et al., 2023)

```text
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

Có thể là một nơi sai lầm:

- khoảng cách phần thưởng ngầm `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)`Một sự thích thích rất nhỏ cũng có thể tạo ra bất kỳ khoảng cách lớn nào.
- Cái mất mát này sẽ được chọn và bị từ chối log-probs 往相反方向推. 只要被拒绝下降得更快,它就可以把选择的绝对 log-prob也往下推. Đây là Phương tượng Phản ứng được chọn xuống cấp.
- Những ưu tiên không phân phối (trong mẫu hiếm đối với mẫu hiếm) sẽ tạo ra những phần thưởng ngầm bất kỳ cách nào.

### IPO (Azar et al., 2024)

Tích thích danh tính Optimization sử dụng xác suất ưu tiên Ước tính bản đồ danh tính  thay thế log-sigmoid。 mất  chuyển thành mục tiêu hạn chế Ước tính lỗi vuông:

```text
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

margin 被 `1/(2 beta)`限定── ưu tiên sức mạnh với sự khác biệt trong phần thưởng ngầm 成比例── sẽ không bị phá vỡ──

### KTO (Ethayarajh et al., 2024)

Kahneman-Tversky Optimization  hoàn toàn bỏ qua cặp 结构。 cho một sản xuất độc lập, cũng như một tín hiệu                                                                                                                                                                                                                                                

```text
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

Không đối với lợi nhuận và tổn thất Sử dụng khác nhau trọng lượng (tránh mất)                                                                                                                                                                     

### SimPO (Meng et al., 2024)

Simple Preference Optimization 让训练信号与生成过程对齐―― hoàn toàn di chuyển chính sách tham chiếu,并按长度归纳日志概率:

```text
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

Sử dụng margin `gamma`Để ổn định tập luyện. Dòng độ chuyển đổi chuyển đổi sử dụng DPO long-bias mode thất bại`y_w`会在构建带来更大的日志-prob gap)

### ORPO (Hong et al., 2024)

Odds-Ratio Preference Optimization trong tiêu chuẩn SFT âm log-choli khả năng 上添加一个偏好术语:

```text
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

Không có chính sách tham chiếu, thuật ngữ SFT là một điều chỉnh. Từ mô hình cơ bản đến mô hình phù hợp chỉ cần một giai đoạn đào tạo.

### BPO (ICLR 2026 đệ trình, OpenReview id=b97EwMUWu7)

识别了                                                                                                                                                                                                                                                             `y_w > y_l`Nhưng`y_w`Trong một nghiên cứu về các vấn đề về toán học của Llama-3.1-8B-Instruct, tỷ lệ xác thực của DPO tăng +10.1%.

### 通用结论: DAAs  vẫn sẽ quá tối ưu hóa

Rafailov et al. Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms (NeurIPS 2024) 在多个数据集和不同 KL budgets 下,使用DPO、IPO、SLiC 训练政策──gold-reward-vs.KL 曲线呈现出与Gao et al. 相同的峰值和崩形状──隐含奖励在训练期间查询出发行样本;KL规范化无法稳定这一点──

DAAs không thoát khỏi Goodhart. Chúng chỉ là làm cho vấn đề bị ăn mòn từ bề mặt của người từ mô hình phần thưởng được tối ưu hóa quá nhiều để biến thành tỷ lệ chính sách tham chiếu được tối ưu hóa quá nhiều.

### 如何选择(2026)

- Nếu bạn có một lượng lớn dữ liệu ưu tiên cặp: sử dụng DPO của conservative beta; nếu sự khác biệt độ dài rõ ràng, thì sử dụng SimPO。
- Nếu có phản hồi nhị phân không cặp: KTO。
- Nếu bạn muốn từ mô hình cơ bản xuất phát của một giai đoạn ống dẫn:ORPO。
- Nếu trong nhật ký DPO thấy các bản kiểm tra được chọn xuống cấp: BPO
- Nếu điểm ưu tiên 差 rất lớn và DPO đang ở:

Mỗi phòng thí nghiệm sẽ chạy hoàn thành 5 phương pháp này trên một nhóm đánh giá, sau đó theo nhiệm vụ chọn người chiến thắng. Không có lý do gì để cho rằng lý thuyết toán học và tính bảo mật tốt nhất là giống nhau.


```figure
dpo-margin
```

## Sử dụng nó

`code/main.py`Trong một bộ dữ liệu sở thích đồ chơi trên so sánh sáu loại lỗ ((DPO、IPO、KTO、SimPO、ORPO、BPO), trong đó sức mạnh sở thích thực sự sẽ thay đổi với cặp ⋅ mỗi lỗ đều trên mẫu 500 cặp trên, sử dụng một chính sách tối đa mềm nhỏ ⋅ tối ưu hóa. Nó sẽ theo cách vẽ tỷ lệ chiến thắng cuối cùng ⋅ chọn-log-prob drift và chênh lệch phần thưởng ngầm ⋅

## Chuyển nó

本课产 出 `outputs/skill-preference-loss-selector.md` Giữ số liệu về bộ dữ liệu (tương đối với không cặp, biến đối với sự phân bố ưu tiên đồng nhất, độ dài) và mục tiêu (tương tự như một giai đoạn hoặc SFT-then-preference), đề xuất một sự mất ưu tiên,并 báo cáo chế độ thất bại bảo vệ nó.

## 练习

1. 运行 `code/main.py` báo cáo DPO và BPO của cuối cùng được chọn-log-prob drop♦ BPO  nên giữ cao hơn của được chọn xác suất tuyệt đối, xin xác minh điều này♦

2.  sửa đổi dữ liệu ưu tiên, để tất cả các cặp đều có sức mạnh tương tự.

3. 让拒绝答案的平均长度变成所选的2倍――在不改变其他任何内容的情况下, sử dụng số值展示 DPO的长度利用以及SimpO的修复――

4. Rafailov et al. (NeurIPS 2024) 声称 DAAs 会过优化──复现一个单点版本: vẽ sự khác biệt KL được chọn-miễn từ chối,并观察大beta 下 DPO's over-optimization──

5. 阅读 BPO bài viết trừu tượng (OpenReview b97EwMUWu7) 👇写下 BPO 添加到 DPO 的那一行修正──对照 👇`code/main.py`Trung thực hiện xác nhận.

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | “没有 reward model 的 RLHF” | 从 RLHF 闭式最优解推导出的 loss；只含 policy parameters |
| Implicit reward | “log-ratio” | `beta * log(pi(y\|x) / pi_ref(y\|x))`，也就是 DPO 隐含的 reward |
| IPO | “bounded DPO” | 用 identity 替换 log-sigmoid；implicit reward gap 被 `1/(2 beta)` 限制 |
| KTO | “unpaired DPO” | 在带有 loss aversion 的单标签上使用 prospect-theory utility |
| SimPO | “reference-free DPO” | 长度归一化 log-likelihood + margin；没有 reference policy |
| ORPO | “one-stage DPO” | NLL + odds-ratio preference term；从 base model 单次训练完成 |
| BPO | “chosen-preserving DPO” | DPO 加上对 chosen response 绝对 log-prob 下降的惩罚 |
| Degraded Chosen | “chosen 下降了” | 只要 rejected 下降得更快，DPO 就会降低 chosen log-prob |
| DAA | “direct alignment algorithm” | 任何跳过显式 RM 的 preference-loss 方法 |

## Đọc thêm

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) IPO
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
