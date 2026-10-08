# Mô hình tạo  分类法与历史

> Mỗi mô hình hình, mô hình văn bản, mô hình video và mô hình 3D đều thuộc một trong năm loại.

**类型:**Học tập
**语言:**Python
**先修要求:**Giai đoạn 2 (Mối cơ bản ML), Giai đoạn 3 (Thấu trúc học tập sâu), Giai đoạn 7 · 14 (Các biến đổi)
**时间:**~ 45 phút

## 问题

Mô hình tạo tạo làm một điều: được định từ một phân bố không rõ`p_data(x)`抽取的训练样本,输出看起来像来自同一分布的新样本──人脸、句子、MIDI 文件、蛋白质结构如果你眼看,它们都是相同的问题──

难点在于,`p_data`Có một hình ảnh RGB 512x512 có khoảng 786k 维), mô hình nằm trong không gian này là một loạt rất mỏng trên, và bạn có thể chỉ có 10M mô hình.

Trong 12 năm qua, có 5 gia đình sống sót. Nhận thức những gì mỗi gia đình đã làm, sẽ cho bạn biết tại sao nó thành công trong một nhiệm vụ và thất bại trong nhiệm vụ khác.

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**sẽ`log p(x)`写成一个你真的能计算的求和── Autoregressive models (PixelCNN, WaveNet, GPT) sẽ được `p(x) = ∏ p(x_i | x_<i)`因式分解──Tình thường hóa dòng chảy (RealNVP, Glow) sẽ`p(x)`构成一个简单基础 分布的可逆变换――优点:精确概率,干净的训练 Loss──缺点:autoregressive 推理是顺序的(长序列会慢),流动 需要可逆架构(架构限制很强)。

**2. Explicit density, approximate。**Từ bên dưới`log p(x)`(ELBO)并优化这个界限──VAEs (Kingma 2013) 使用带变化后的编码-解码器──Diffusion models (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──Diffusion 是 2026 年图像、视频和 3D 的主导脊柱──

**3. Implicit density。** hoàn toàn nhảy qua mật độ; học một tạo mẫu của máy phát điện `G(z)`, và một người phân biệt đối xử thực sự sai lầm .`D(x)`GAN (Goodfellow 2014) ・推理很快(一次进步通过), nhưng quá trình đào tạo đã xuất hiện khá không ổn định── ngay cả trong năm 2026, StyleGAN 1/2/3 vẫn là hiện đại nhất trong lĩnh vực nhiếp ảnh cố định.

**4. Score-based / continuous-time。**直接学习 log-density 的 Gradient `∇_x log p(x)`(score) ――Song & Ermon (2019)  chỉ ra kết quả phù hợp sẽ phát tán 推广为一个SDE──Flow matching (Lipman 2023) là điểm nóng của năm 2024-2026:无需模拟的训练、更直的路径、比 DDPM 快 4-10倍的采样──Stable Diffusion 3、Flux、AudioCraft 2 都使用流量匹配──

**5. 基于 Token 的离散 codes 上的 autoregressive。**Sử dụng VQ-VAE hoặc lượng tử dư sẽ nén dữ liệu cao về một chuỗi mã thông báo phân tán ngắn hơn, sau đó sử dụng Transformer cho chuỗi mã thông báo 建模.

## 简史

| 年份 | 模型 | 为什么重要 |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | 第一个拥有可用训练 Loss 的 deep generative model。 |
| 2014 | GAN (Goodfellow) | Implicit density，没有 likelihood，却能产生惊人锐利的样本。 |
| 2015 | DRAW, PixelCNN | 顺序图像生成。 |
| 2017 | Glow, RealNVP | 可逆 flows；通过 depth 获得精确 likelihood。 |
| 2017 | Progressive GAN | 第一个 megapixel 人脸。 |
| 2019 | StyleGAN / StyleGAN2 | 在人脸这个单一领域中，photorealistic faces 依然很难被击败。 |
| 2020 | DDPM (Ho) | Diffusion 变得实用。 |
| 2021 | CLIP, DALL-E 1, VQGAN | Text-to-image 进入主流。 |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Latent diffusion + text conditioning = 商品化。 |
| 2022 | ControlNet, LoRA | 对 pretrained diffusion 进行精细控制。 |
| 2023 | SDXL, Midjourney v5, Flow matching | 规模 + 更好的训练动态。 |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Video diffusion；flow matching 胜出。 |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | 生产级视频。 |
| 2026 | Consistency + Rectified Flow | 从 diffusion backbones 进行一步采样。 |

## 五问分诊

Khi một bài viết mô hình tạo mới xuất hiện, trước khi đọc phần phương pháp, trước tiên trả lời năm câu hỏi này.

1. **建模的是什么？**Pixels, latences, token phân tán, Gaussians 3D, lưới, hình dạng sóng?
2. **Density 是 explicit 还是 implicit？**Họ có viết ra không?`log p(x)`- Không .
3. **Sampling：one-shot 还是 iterative？**Iterative có nghĩa là suy nghĩ chậm hơn; một phát thường có nghĩa là đối kháng hoặc chưng cất.
4. **Conditioning：unconditional、class、text、image、pose？**Đó là quyết định của Loss và cấu trúc.
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**Mỗi người đều có các chế độ thất bại đã biết được.

Bạn sẽ trả lời lại 5 câu hỏi này trong mỗi bài học của giai đoạn này. Cuối cùng, chúng sẽ trở thành phản xạ của bạn.


```figure
autoencoder-bottleneck
```

##  xây dựng nó

Mã của bài học này là một hình ảnh có thể nhìn thấy nhẹ: sử dụng ba loại phương pháp chơi game (năm mật độ hạt nhân, biểu đồ histogram phân tán, cũng như mẫu gần nhất GAN-ish máy phát điện) từ mẫu được phù hợp với một hỗn hợp 1-D của Gaussieans, để bạn có thể nhìn thấy sự khác biệt về mật độ rõ ràng so với ngầm trên một câu hỏi có thể in trên một màn hình.

运行 `code/main.py`Nó sẽ lấy từ một hỗn hợp Gaussian hai đỉnh trong 2000 mẫu, rồi in:

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

Lưu ý: hai thứ trước cho phép bạn hỏi: Có nhiều khả năng không?

## Sử dụng nó

Năm 2026, gia đình nào phù hợp với nhiệm vụ nào?

| 任务 | 最佳家族 | 原因 |
|------|-------------|-----|
| Photoreal faces，窄领域 | StyleGAN 2/3 | 仍然最锐利，推理最快。 |
| 通用 text-to-image | Latent diffusion + flow matching | SD3, Flux.1, DALL-E 3。 |
| 快速 text-to-image | Rectified flow + distillation | SDXL-Turbo, SD3-Turbo, LCM。 |
| Text-to-video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling。 |
| Speech + music | Token-based AR (AudioLM, VALL-E, MusicGen) 或 flow matching (AudioCraft 2) | 离散 tokens 扩展成本低。 |
| 3D scenes | Gaussian Splatting fit, diffusion prior | 3D-GS 用于重建，diffusion 用于 novel-view。 |
| Density estimation（不采样） | Flows | 唯一拥有精确 `log p(x)` 的家族。 |
| Simulation / physics | Flow matching, score SDE | 直线路径，平滑 Vector fields。 |

## 交付 nó

保存为 `outputs/skill-model-chooser.md`

Đây là một kỹ năng  nhận một nhiệm vụ mô tả và输出: 1) phải sử dụng cái gì, 2) ba lựa chọn mở và ba lựa chọn được lưu trữ, 3) bạn nên quan tâm đến chế độ thất bại có thể xảy ra, và 4) 计算/ thời gian ngân sách.

## 练习

1. **Easy。**Đối với 5 sản phẩm sau đây, nhận dạng gia đình và xương sống: ChatGPT image、Midjourney v7、Sora、Runway Gen-3、ElevenLabs。 chứng cứ nên được lấy từ công nghệ công cộng báo cáo。
2. **Medium。**Bạn ngày mai cần đọc bài luận tuyên bố 快 100 倍比扩散.
3. **Hard。**选择一个你关心的领域 (例如蛋白质结构,CAD,分子轨迹) ⋅ cho mô hình SOTA hiện tại trong lĩnh vực này trả lời 5 câu hỏi,并勾勒一个更好的模型会改变什么――

## 关键术语

| 术语 | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| Generative model | “它会生成新东西” | 学习 `p_data(x)` 的 sampler，可选地暴露 `log p(x)`。 |
| Explicit density | “你可以计算它” | 模型提供 closed-form 或 tractable 的 `log p(x)`。 |
| Implicit density | “GAN-style” | 只有 sampler——无法计算给定点的 `p(x)`。 |
| ELBO | “Evidence lower bound” | `log p(x)` 的一个 tractable 下界；VAEs 和 diffusion 会优化它。 |
| Score | “log-density 的 Gradient” | `∇_x log p(x)`；diffusion 和 SDE models 学习这个 field。 |
| Manifold hypothesis | “数据存在于一个表面上” | 高维数据集中在低维 manifold 上；这就是 dimensionality reduction 有效的原因。 |
| Autoregressive | “预测下一个片段” | 将 joint 因式分解为 conditionals 的乘积。 |
| Latent | “压缩 code” | 一种低维表示，decoder 可以从中重建输入。 |

## 生产备注: 5 gia đình, 5 hình thức

Mỗi gia đình đều sẽ được hiển thị trên các máy chủ suy luận khác nhau 成本曲线──制作- suy luận 文献将 LLM 推理框定为预填 + giải mã; tương tự phân giải cũng được áp dụng ở đây:

- **Autoregressive（类别 1 和 5）。**顺序 decode 主导 latency;KV-cache、continuous batching 和 speculative decoding 都可以直接应用──
- **VAE / diffusion / flow-matching（类别 2 和 4）。**Đây là không có mã hóa của LLM  nghĩa là:`num_steps × step_cost`, và `step_cost`Trong khi đó, các công cụ này có thể được sử dụng để tạo ra các công cụ khác nhau.
- **GAN（类别 3）。**Một lần đi trước không có lịch trình, không có cache KV, TTFT ≈ thời gian trễ hoàn toàn, đó là lý do tại sao StyleGAN vẫn thắng trong lĩnh vực hạn chế.

Khi bạn thấy trong bản tóm tắt bài luận nhiệm hơn sự phổ biến , hãy dịch nó thành nhiệm nhỏ hơn ×nhiệm tương tự  hoặc nhiệm tương tự  hoặc nhiệm rẻ hơn ── ngoài ra là tiếp thị ──

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN 论文。
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 论文。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM 论文。
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为 SDE's diffusion──
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) dòng chảy phù hợp 论文。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) Sự pha trộn ổn định 3。
