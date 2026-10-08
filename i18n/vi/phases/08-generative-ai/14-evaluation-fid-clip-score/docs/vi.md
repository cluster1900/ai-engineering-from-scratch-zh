# 评估  FID、CLIP Score、 người

> Mỗi bảng xếp hạng mô hình được tạo ra đều trích dẫn điểm số FID, CLIP, cũng như tỷ lệ chiến thắng từ các sân vận động ưu tiên của con người. Mỗi số đều có một mô hình thất bại được các nhà nghiên cứu sử dụng. Nếu bạn không hiểu những mô hình thất bại này, bạn sẽ không thể phân biệt được sự cải tiến thực sự và hoạt động phân tích.

**类型:**Xây dựng
**语言:**Python
**先修:**Giai đoạn 8 · 01 (Taxonomy), Giai đoạn 2 · 04 (Tỷ lệ đánh giá)
**时间:**~ 45 phút

## 问题

Các mô hình được tạo ra thường được đánh giá dựa trên * chất lượng mẫu * và * điều kiện theo dõi * để đánh giá. Cả hai đều không có quy mô đóng cửa. Mô hình của bạn phải có khoảng 10.000 hình ảnh; phải có một cái gì đó để phân chia chúng; bạn cũng phải tin rằng các số này có thể vượt qua các hệ thống mô hình, phân giải, cấu trúc.

- **FID (Fréchet Inception Distance)。**Trong không gian đặc trưng của mạng khởi đầu, khoảng cách giữa phân bố thực tế và phân bố sản xuất.
- **CLIP score。**生成图像的 CLIP-image Embedding 与 prompt 的 CLIP-text Embedding 之间的共数相似性──越高越好──衡快点 遵循度──
- **人类偏好。**Trong cùng một thời điểm 上让两个模型正面对决,让人类 (GPT-4) chọn một tốt hơn, tái tập hợp Elo điểm số.

Bạn cũng sẽ thấy:IS(số khởi điểm, cơ bản đã bị loại bỏ) ✓KID、CMMD、ImageReward、PickScore、HPSv2、MJHQ-30k── mỗi loại đều sửa đổi một số điểm thất bại của một chỉ số trước đây──

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  样本质量

Heusel et al. (2017)。步骤:

1. 为 N 张真实图像和 N 张生成图像提取 Lập đầu v3 tính năng (2048-D) ⋅
2. Đối với mỗi nhóm có thể được một Gaussian: tính trung bình`μ_r, μ_g`和 sự đồng hóa `Σ_r, Σ_g`
3. FID = `||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`

解释: đặc điểm không gian trong hai biến số Gaussian  giữa khoảng cách Frechet。越低 = 分布越相似。

失效模式:
- **小 N 时有偏。**FID là đối với phân bố đặc điểm làm trung bình vuông 计算,小 N 会低估共差,给出虚假的低 FID──始终使用 N ≥ 10,000──
- **依赖 Inception。**Inception-v3 训练于 ImageNet──远离 ImageNet领域 ([[人脸、艺术、文字图像) ]] sẽ tạo ra FID không có ý nghĩa── sử dụng bộ thu thập tính năng trong lĩnh vực cụ thể──
- **刷分。**过拟 启动前可在没有视觉质量提升的情况下得到低FID──使用CMMD(见下文)来对抗它──

### Điểm CLIP  prompt 遵循度

Radford et al. (2021) ・ đối với một张生成图像 + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

Đối với 30k 张 tạo hình ảnh lấy trung bình →  nhận được một lượng mô hình có thể so sánh trong mô hình.

失效模式:
- **CLIP 自身的盲点。**CLIP 组合推理较弱("một khối đỏ trên một quả cầu xanh" 经常失败) ――模型可以在 CLIP score上排名很好,但并没有真正遵循复杂提示──
- **短 prompt 偏差。**短 prompt 在野外有更多 CLIP-image 匹配──长 prompt 的 CLIP score 会机械性降低──
- **prompt 刷分。**Trong khi đó, bạn sẽ có thể thêm vào "đáng chất cao, 4k, tác phẩm xuất sắc" sẽ nâng điểm CLIP cao hơn, nhưng sẽ không cải thiện kết quả.

CMMD (Jayasumana et al., 2024) đã sửa chữa một số vấn đề: sử dụng các tính năng CLIP thay vì Inception, sử dụng sự khác biệt trung bình tối đa thay vì Fréchet.

### Nhân loại  sự thật căn bản

选择一组 prompt──用模型 A 和模型 B 生成──把成对结果展示给人类 (或强 LLM judge)──将胜负聚合成 Elo 或 Bradley-Terry score──Bênchmark:

- **PartiPrompts (Google)**:1,600 个多样化 prompt,12 个类别──
- **HPSv2**:107k 个人类标注, sử dụng rộng rãi như đại lý tự động hóa
- **ImageReward**Thử hình ảnh nhanh hơn 37k 偏好对, MIT-licensed.
- **PickScore**: dựa trên sở thích Pick-a-Pic 2.6M 训练。
- **Chatbot-Arena-style image arenas**- Có thể là:https://imagearena.ai/Và các nền tảng khác.

失效模式:
- **judge 方差。**Những người không chuyên gia và chuyên gia có những sở thích khác nhau.
- **prompt 分布。**精挑细选的快速会偏向某一家──始终记录清楚──
- **LLM-judge reward hacking。**GPT-4- thẩm phán sẽ được đẹp trai nhưng sai lầm của xuất phát lừa dối.

## 组合使用

Báo cáo đánh giá cấp sinh sản 应包含:

1. Trong 10-30k 个样本, đối với thực tế phân bố tính toán FID (样本质量) ⋅
2. Trong cùng một số mẫu và nhanh chóng lên tính điểm CLIP / CMMD (đối với các mẫu)
3. Trong số các bài viết trên, người dùng có thể xem xét tỷ lệ thắng trong bài viết này.
4. 失效模式分析:随机抽取 50 输出,标记已知问题(手部结构、文字染、对象数量一致性)

Bất kỳ chỉ số đơn lẻ nào đều là dối trá.


```figure
gx-fid-distributions
```

## 动手构建

`code/main.py`Trong tổng hợp "luôn vector tính năng" trên thực hiện FID、类 CLIP-score 和 Elo 聚合(Chúng tôi sử dụng 4D Vector như là sự thay thế cho tính năng khởi đầu)。 bạn sẽ thấy:

- 小 N 和 大 N 上的 FID 计算,也就是偏差──
- sẽ tính năng tương đồng cosine giữa 池 作为"CLIP điểm số"
- Từ quy tắc cập nhật Elo của dòng chuyển biến.

### 步骤 1: 四行实现 FID

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 步骤 2: CLIP 风格 của cosine-similarity

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### 步骤 3: Elo 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**Trong N=10k dưới đây, việc khởi động này không đáng tin cậy.
- **跨分辨率比较 FID。**Sự khởi đầu của 299×299 kích thước sẽ thay đổi phân bố đặc điểm.
- **只报告一个 seed。**Ít nhất 3 hạt giống được vận hành.
- **通过 negative prompts 抬高 CLIP score。**Một số đường ống sẽ thông qua quá trình chuẩn bị để nâng cao CLIP.
- **prompt 重叠导致 Elo 偏差。**Nếu hai mô hình trong tập đều thấy điểm chuẩn nhanh, Elo 就没有意义――使用延续的提示集合――
- **人类 eval 的付费众包偏斜。**Prolific、MTurk 标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## Sử dụng nó

Nghị định giá sản xuất năm 2026:

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

4 trụ cột trong cùng một báo cáo = 主张──任何单独一个 = 营销──

## 交付

保存 `outputs/skill-eval-report.md` Khả năng nhận điểm kiểm soát mô hình mới + đường cơ sở,并输出 kế hoạch đánh giá đầy đủ: mẫu quy mô, chỉ số, quy mô thất bại, tiêu chuẩn hạt nhân.

## 练习

1. **Easy.**运行 `code/main.py` Trong phân bố tổng hợp tương tự so sánh N=100 với FID của N=1000 .
2. **Medium.**基于合成 CLIP-style features 实现 CMMD(公式见 Jayasumana et al., 2024)  So sánh nó với FID đối với độ nhạy cảm của sự khác biệt chất lượng 
3. **Hard.**复现 HPSv2 设置: từ Pick-a-Pic's一个子集中取 1000 个图像-prompt cặp, dựa trên sự lựa chọn tinh tế-tune, một điểm số nhỏ dựa trên CLIP,并测量它 với sự phù hợp của tập hợp được giữ ra.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FID | "Fréchet Inception Distance" | 对真实与生成 Inception features 拟合 Gaussian 后的 Fréchet distance。 |
| CLIP score | "Text-image similarity" | CLIP image 与 text Embeddings 之间的 cosine similarity。 |
| CMMD | "FID's replacement" | CLIP-feature MMD；偏差更小，无 Gaussian assumption。 |
| IS | "Inception score" | Exp KL(p(y|x) || p(y))；在现代模型上相关性差，已退役。 |
| HPSv2 / ImageReward / PickScore | "Learned preference proxies" | 在人类偏好上训练的小模型；用作自动 judge。 |
| Elo | "Chess rating" | 成对胜负的 Bradley-Terry 聚合。 |
| PartiPrompts | "The benchmark prompt set" | Google 策划的 1,600 个 prompt，覆盖 12 个类别。 |
| FD-DINO | "Self-sup replacement" | 使用 DINOv2 features 的 FD；更适合 ImageNet 之外的领域。 |

## 生产注记: đánh giá cũng là tải trọng công việc suy luận

Trong 10k mẫu chạy FID có nghĩa là tạo ra 10k 张图像. Đối với đơn张 L4 trên 10242 cơ sở SDXL 50 bước, đây là khoảng 11 giờ suy luận đơn yêu cầu.

- **尽力 batch，忘掉 latency。**Offline eval = Trong bộ nhớ có dung lượng lớn nhất thực hiện phân tích tĩnh. Trong 80GB H100 上用`num_images_per_prompt=8`调用 `pipe(...).images`, đồng hồ tường hơn đơn yêu cầu 快 4-6x.
- **缓存真实 features。**Đối với thực tế tập hợp thực hiện của Inception (FID) hoặc CLIP (CLIP-score, CMMD) tính năng khai thác chỉ运行* một lần*,并存储为`.npz`Không cần phải đánh giá lại mỗi lần.

Đối với CI / cổng hồi quy: mỗi PR trong 500 mẫu 子集上运行 FID + CLIP điểm số(~ 30 phút); mỗi đêm运行完整 10k FID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 论文。
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD。
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020) CLIP。
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2。
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) ImageReward。
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) PartiPrompts。
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) khảo sát chế độ thất bại
