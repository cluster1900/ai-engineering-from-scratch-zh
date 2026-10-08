# Theo hướng dẫn 作为调整信号

> Sau đó, mỗi người chỉ trích RLHF đều phản đối dòng này. Trong khi nghiên cứu áp lực tối ưu hóa làm thế nào để biến dạng một proxy, bạn phải xem trước khi giải quyết dòng này. InstructGPT(Ouyang et al., 2022) đã xác định kiến trúc tham chiếu: trên các cặp lệnh phản ứng trên làm điều chỉnh tinh tế giám sát; trên các bảng xếp hạng ưu tiên trên mô hình thưởng đào tạo; sau đó sử dụng PPO với hình phạt KL đối với mô hình thưởng  tối ưu hóa,并 ràng buộc với chính sách SFT. Một 1.3B InstructGPT được ưa chuộng hơn 175B GPT-3 năm.

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 分钟

## Mục tiêu học tập

- Nói về ba giai đoạn của đường ống GPT của Instruct, cũng như mất mát sử dụng mỗi giai đoạn.
- 解释 tại sao 1.3B mô hình theo hướng dẫn trong việc đánh giá ưu tiên của con người trong cuộc đánh bại 175B GPT-3
- Giải thích giai đoạn 3 trong KL hình phạt trong ngăn chặn những gì, và tại sao việc di chuyển nó sẽ giảm xuống vào hành vi tìm kiếm chế độ.
- Mô tả thuế sắp xếp, cũng như Ouyang et al.

## Vấn đề

Các mô hình ngôn ngữ được đào tạo trước sẽ bổ sung toàn văn bản. Chúng sẽ không trả lời câu hỏi. GPT-3 Thiết một hàm Python đảo ngược một danh sách. Bạn thường sẽ nhận được một lời nhắc khác, vì hầu hết các bài tập phân phối sẽ tiếp tục tiếp nhận nhiều văn bản web hơn.

Mỗi phòng thí nghiệm nghiêm túc dùng để sửa chữa vấn đề này là sự thích của con người. Hai hoàn thành  giao cho rater;rater  chọn một tốt hơn; mô hình phần thưởng học bài đánh giá này.

## Khái niệm

### Giai đoạn 1: điều chỉnh tinh tế được giám sát (SFT)

收集快速响应对, trong đó phản ứng là một người có ý nghĩa tốt đã viết cho mình.

SFT đưa cho bạn thứ gì đó: mô hình bây giờ sẽ trả lời câu hỏi, thay vì tiếp tục bổ sung toàn bộ câu hỏi. Nó không cho bạn thứ gì đó: khi nhiều câu trả lời đều hợp lý, tỷ lệ cao hơn là tín hiệu của câu trả lời nào.

### Giai đoạn 2: Mô hình phần thưởng (RM)

Đối với mỗi prompt, từ SFT model 采样 K 个完成──Labeler đối với chúng排序──训练一个奖励模型,为任意快速响应对 打分,使 đối với `y_w`Được đánh bại`y_l`Các cặp:

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

Đây là mất ưu tiên cặp Bradley-Terry. RM thường từ mô hình SFT bắt đầu, đưa đầu LM thay thế thành đầu scalar.

Mô hình phần thưởng 很小:6B 足够服务 175B InstructGPT──它们 cũng rất yếu, bài luận第 5 节 chủ yếu thảo luận về hành vi tấn công phần thưởng xuất hiện ở quy mô nhỏ──

### Giai đoạn 3: PPO với hình phạt KL

 định nghĩa mục tiêu:

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

用 PPO tối đa hóa. KL thuật ngữ 让 `pi`Không có nó, Optimizer sẽ tìm thấy các ví dụ đối nghịch, đó là ở RM thấp điểm rất cao, lý do không phải là con người thực sự thích chúng, mà là RM từ không thấy chúng.

Tỷ lệ KL `beta`RLHF là một siêu số liệu quan trọng nhất.

### Thuế sắp xếp

Sau đó, mô hình được người thích hơn, nhưng trong các tiêu chuẩn chuẩn tiêu chuẩn (SquAD、HellaSwag、DROP) trên退步。Ouyang et al. sẽ gọi nó là thuế sắp xếp, không sử dụng PPO-ptx 修复: đưa gradient trước đào tạo 混入 RL mục tiêu, vì vậy mô hình sẽ không quên làm thế nào để hoàn thành những nhiệm vụ tiếp theo chưa bao giờ được thưởng。

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

PPO-ptx  trở thành một cách làm tiêu chuẩn.

### Kết quả

Một 1.3B InstructGPT(SFT + RM + PPO-ptx) được các nhà nhãn 偏好胜胜于 175B cơ sở GPT-3, tỷ lệ khoảng 70%── trên các yêu cầu thử nghiệm ẩn của lưu lượng sản xuất trên, khoảng cách này sẽ mở rộng── từ số này có thể đọc hai điều:

1. Sự sắp xếp là với khả năng không giống với trục. Mô hình 175B có khả năng mạnh hơn; Mô hình 1.3B có sự sắp xếp nhiều hơn; nhãn hiệu là tốt hơn so với những người sắp xếp.
2. Capacity floor bởi mô hình cơ bản quyết định. Bạn không thể thông qua RLHF.

### Tại sao đây là giai đoạn 18 điểm tham khảo

Mỗi lời chỉ trích trong chương trình 后续课程:truyền hack ((Lớp 2)、DPO(Lớp 3)、 tâm lý học ((Lớp 4)、CAI(Lớp 5)、acents sleeper ((Lớp 7)、alignment faking(Lớp 9),都在反对这一条线的某部分──Reward hacking 攻击阶段 2──DPO 把阶段 2 和 3 合并──CAI 替代人类标签──Sycophancy 表明标签是个偏见的信号──Alignment faking 表明政策可以完全绕过阶段 3──如果你没有这个线路,就无法理解这些批评──


```figure
al-instruct-pipeline
```

## Sử dụng nó

`code/main.py`Trong dữ liệu sở thích đồ chơi 上模拟三个阶段。Base policy là một đồng xu thiên vị trên các hành động {A, B, C}。Stage 1 SFT trong 200 yêu cầu 上模拟标签 hành động。Stage 2 từ 500 个 cặp xếp hạng 适合Bradley-Terry reward model。Stage 3 运行 một bản cập nhật PPO đơn giản hóa,并带有到 SFT chính sách phần thưởng KL phạt── bạn có thể quan sát sự khác biệt KL tăng lên 变大、 chính sách dẫn dắt, cũng có thể đóng KL thuật ngữ, xem hack trong 50 bước cập nhật phần thưởng trong xuất hiện──

Để quan sát nội dung:

- `beta = 0.1`Với`beta = 0.0`Đường đua thưởng dưới đây.
- Các bước tập trung 中的 KL pi pi SFT)
- Sự phân phối hành động cuối cùng so với ưu tiên của nhãn hiệu

## Chuyển nó

本课产 出 `outputs/skill-instructgpt-explainer.md` Đưa ra một mô tả đường ống RLHF hoặc bản tóm tắt giấy, nó sẽ xác định trong ba giai đoạn nào được sửa đổi, mỗi giai đoạn sử dụng những tổn thất nào, cũng như liệu có hình phạt KL hay một chất điều chỉnh tương đương không.

## Các bài tập

1. 运行 `code/main.py`❖ thiết lập`beta = 0.0`, báo cáo 200 bước PPO 后续 phân phối hành động──用一段话解释 tìm cách hành vi──

2. 修改 reward model,让action B có +0.5 bias(模拟 reward bug) ・・・用 `beta = 0.1`运行 PPO──KL hình phạt có ngăn chặn chính sách sử dụng sự thiên vị này không?`beta`- Bắt đầu khai thác?

3. 阅读 Ouyang et al.(arXiv:2203.02155) Hình 1── thông qua运行 PPO 1、5、20、100 bước,并测量相对 SFT mô hình 偏好,复现标签者偏好曲线──

4. Bài luận Phần 4.3  báo cáo 1.3B InstructGPT  đánh bại 175B GPT-3 tỷ lệ khoảng 70%── Tại sao tỷ lệ này trong các yêu cầu sản xuất ẩn 上会高于标签  yêu cầu của riêng bạn?

5. Trong dữ liệu ưu tiên tương tự trên, hãy chuyển mất PPO thành DPO (Phase 10 · 08) ――Bước 2:

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | “instruction tuning” | Stage 1：在 prompt-response pairs 上用 cross-entropy fine-tune |
| Reward model | “the RM” | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | “pairwise preference loss” | -log sigmoid(r_w - r_l)；把 pairwise ranking 约简为 binary classification |
| KL penalty | “the regularizer” | `beta * KL(pi \|\| pi_SFT)` — 让 RL policy 保持接近 SFT anchor |
| PPO-ptx | “PPO with pretraining mix” | 向 PPO objective 加入一部分 pre-training log-likelihood，用来抵消 alignment tax |
| Alignment tax | “the RLHF regression” | RLHF 之后，在 RLHF 未针对的标准 benchmarks 上下降 |
| Labeler preference | “the ground truth” | human rankings 的样本；RM 是它的 statistical proxy，而不是 “human values” 的 proxy |

## Đọc thêm

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) Giấy GPT hướng dẫn, cũng là nền tảng của mỗi dòng đường ống RLHF
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) RLHF-for-summary 的前身
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) Sản phẩm RL dựa trên ưu tiên
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) Phân tích HH của đường ống dẫn đường HH đối với InstructGPT
