# Đơn, Đơn ngoài và các hình ảnh

> Text-to-image 会 create new things──Inpainting 会修复旧事── Trong môi trường sản xuất, 70% có thể tính phí các hình ảnh là edit: thay đổi bối cảnh、 xóa logo、 mở rộng tấm tranh、 tái tạo một tay──Inpainting chính là nơi phân tán 体现价值──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## 问题

客户发来一张完美产品照片, nhưng trong bối cảnh có một biểu tượng chú ý phân tán. Bạn muốn xóa biểu tượng này, và làm cho tất cả các phần khác giữ nguyên lớp hình ảnh phù hợp. Bạn không thể chạy từ đầu đến chuyển đổi văn bản sang hình ảnh, vì kết quả sẽ có màu sắc khác nhau, ánh sáng khác nhau, góc độ sản phẩm khác nhau. Bạn chỉ muốn tái tạo vùng được che phủ, và muốn tái tạo nội dung tôn trọng xung quanh.

Đây là việc vẽ tranh. Các biến thể của nó bao gồm:

- **Inpainting.**Trong khuôn mặt, tái tạo, giữ lại hình ảnh bên ngoài.
- **Outpainting.**Trong khuôn mặt bên ngoài tái tạo (hoặc mở rộng ra ngoài tấm tranh), giữ bên trong.
- **Image editing.**重新生成整张图, nhưng giữ với ngữ nghĩa hoặc cấu trúc phù hợp với bản gốc图 (SDEdit, InstructPix2Pix)

Mỗi dòng ống dẫn phân tán trong năm 2026 đều có màu 模式──Flux.1-Fill、Stable Diffusion Inpaint、SDXL-Inpaint、DALL-E 3 Edit── chúng dựa trên cùng một nguyên tắc──

## 概念

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 朴素方法 (nói đơn giản)

带着面具 运行标准文字-to-image──在每一步采样中未面具的区域被替换为经过前方传播的干净图像──它能工作......但效果很差──边界文物会出,因为模型不知道面具里应该有什么──

### Mô hình vẽ chính xác

训练一个修改的U-Net, để nó nhận được 9 kênh đầu vào, thay vì 4 kênh:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

Các kênh bổ sung là bản sao của hình ảnh nguồn mã hóa VAE, cộng với một mặt nạ kênh đơn. Trong khi tập luyện, bạn có mặt nạ 区域 trong hình ảnh,并 tập luyện mô hình chỉ cho mặt nạ 区域 chỉ định, đồng thời đưa không mặt nạ 区域 như tín hiệu điều kiện trong sạch.

SD-Inpaint、SDXL-Inpaint、Flux-Fill 都 sử dụng loại 9 kênh này(hoặc tương tự)输入──diffuser `StableDiffusionInpaintPipeline``FluxFillPipeline`

### SDEdit (Meng et al., 2022)  免费编辑

Đưa ảnh nguồn lên một cái trung tâm nào đó`t`, sau đó sử dụng một lời nhắc mới từ `t`Trở lại 0── không cần phải luyện tập lại── bắt đầu `t`Sự lựa chọn sẽ cân bằng giữa sự thật và sự tự do sáng tạo:

- `t/T = 0.3`→ 几乎与源图一致, chỉ làm thay đổi phong cách nhỏ
- `t/T = 0.6`→ Trung等编辑, giữ lại cấu trúc粗略
- `t/T = 0.9`→  gần từ tiếng ồn 生成, đối với nguồn 图 giữ ít nhất

### InstructPix2Pix (Brooks et al., 2023)

Trong `(input_image, instruction, output_image)`三元组上细调 一个扩散模型──推理时,同时基于输入图像和文本指令(使它日落、添龙)进行调节──有两个CFG scale:image scale和text scale──

### RePaint (Lugmayr et al., 2022)

保留一个标准无条件扩散模型──在每一步反转,进行重复样本:偶尔跳回更噪的状态并重新生成──这样可以避免边界艺术品──当你没有训练好的涂料模型时使用──


```figure
inpaint-mask-reinject
```

## Hãy xây dựng nó

`code/main.py`Trong 5 维数据 thực hiện một phiên bản đồ chơi 1D vẽ 方案. Chúng tôi trên 5 D hỗn hợp dữ liệu trên đào tạo một DDPM, trong đó mỗi mẫu là từ hai cluster 之一 5 float.

### Bước 1: 5 Dữ liệu DDPM

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### Bước 2: Trong tất cả 5 个维度 trên đào tạo denoiser

标准 DDPM。Net đối với đầu vào tiếng ồn 5D 输出 5D dự đoán tiếng ồn。

### Bước 3: 推理时使用 mặt nạ-thấu thức ngược

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

Đây là một phương pháp đơn giản, và nó có hiệu quả trên các đồ chơi 1-D 数据.

### Bước 4: Bức tranh

Trình vẽ là việc vẽ mặt nạ Trình vẽ: mặt nạ mới của trước không tồn tại của) vùng vẽ, sử dụng bản vẽ để lấp đầy phần còn lại.

## 陷

- **Seams.**朴素方法会留下可见边界,因为 Gradient 信息不会跨面膜 流动──修复方式:把面膜 膨胀 8-16 个像素,或使用正确的涂料模型──
- **Mask leakage.**Nếu chất lượng khu vực của hình ảnh điều hòa không được che ấp thấp hoặc có tiếng ồn, nó sẽ gây ô nhiễm trong mặt nạ.
- **CFG interacts with mask size.**                                                                                                                                                                                                                                                              
- **SDEdit fidelity cliff.**Từ `t/T = 0.5`Đến`t/T = 0.6`Có thể mất danh tính chủ nhân.
- **Prompt mismatch.**Ngay lập tức 应该描述*整张*图,而不只是新内容──用 A cat sitting on a chair, instead of a cat──

## Sử dụng nó

| Task | Pipeline |
|------|----------|
| 移除物体，小 mask | SD-Inpaint 或 Flux-Fill，标准 prompt |
| 替换天空 | SD-Inpaint + "blue sky at sunset" |
| 扩展画布 | SDXL outpaint mode（8px feather）或带 outpaint mask 的 Flux-Fill |
| 重新生成手 / 脸 | SD-Inpaint，prompt 重新描述主体 + ControlNet-Openpose |
| 改变某个区域的风格 | 在 mask 区域上使用 `t/T=0.5` 的 SDEdit |
| "Make it sunset" | InstructPix2Pix 或 Flux-Kontext |
| 背景替换 | SAM mask → SD-Inpaint |
| 超高保真 | 最难场景使用 Flux-Fill 或 GPT-Image（hosted） |

SAM(Meta của Segment Anything,2023) + diffusion inpaint là 2026 年的背景移除管道──SAM 2(2024)适用于视频──

## Chuyển nó

保存 `outputs/skill-editing-pipeline.md` Skil 接收一张原图 + 编辑描述 + 可选面膜(或 SAM prompt),并输出:面膜 生成方法、基模型、CFG scales(图片 + văn bản)、SDEdit-t 或 inpainting mode,以及 QA checklist──

## 练习

1. **Easy.**Trong `code/main.py`Trong đó, tỷ lệ kích thước của mặt nạ bị biến đổi từ 0.2  đổi đến 0.8 ⋅ ở trong tỷ lệ nào, chất lượng sơn (khả năng dư thừa trong mặt nạ) tương đương với việc tạo ra không điều kiện?
2. **Medium.**实现 RePaint: 每到第十个反转步骤,跳回 5 步 (跳回 5 步) 加噪)并重新指责──测量它是否降低面具 边缘的边界残留──
3. **Hard.**Sử dụng Hugging Face Diffusers So sánh:SD 1.5 Inpaint + ControlNet-Openpose 与 Flux.1-Fill, trong 20 个 任务上测试──分别评分

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Inpainting | “填洞” | 在 mask 内重新生成；保留外部像素。 |
| Outpainting | “扩展画布” | 在画布外重新生成；保留内部。 |
| 9-channel U-Net | “正确的 inpainting model” | 输入为 `noisy \| encoded-source \| mask` 的 U-Net。 |
| SDEdit | “带 noise level 的 img2img” | 加噪到时间 `t`，用新 prompt denoise。 |
| InstructPix2Pix | “纯文本编辑” | 在 (image, instruction, output) 三元组上 fine-tuned 的 diffusion。 |
| RePaint | “无需重新训练” | 在 reverse 过程中周期性 re-noise，以减少 seams。 |
| SAM | “Segment Anything” | 通过点击或框生成 mask；与 inpaint 配合使用。 |
| Flux-Kontext | “带上下文编辑” | 接收 reference image + instruction 进行编辑的 Flux 变体。 |

## 生产提示:edit pipelines đối với chậm trễ rất nhạy cảm

Người dùng chỉnh sửa hình ảnh khi, kỳ vọng quay trở lại thấp hơn 5 giây. Ở L4 trên, 10242 của 30-phase SDXL-Inpaint  cần 3-4 giây, thêm lại SAM trang bị tạo ra (~ 200 ms) và VAE mã hóa/phác mã (~ 500 ms) ⋅ Từ góc độ sản xuất, điều này bị TTFT  giới hạn, thay vì nới hạn:

- **SAM-H 是慢的那个。**10242 下 SAM-H 约200 ms; SAM-ViT-B 约40 ms,质量损失很小──SAM 2(video) sẽ tăng thời gian, không dùng cho việc chỉnh sửa đơn sơ──
- **能跳过 encode 就跳过。** `pipe.image_processor.preprocess(img)`会 mã hóa đến latences. Nếu bạn có một lần trên tạo ra latences.`latents=...`传入,跳过一次 VAE mã hóa
- **Mask dilation 也影响吞吐。**小面膜 có nghĩa là phần lớn số lượng U-Net đi trước được lãng phí (không có hình ảnh của mặt nạ được clamp)`diffusers`của `StableDiffusionInpaintPipeline`Dù sao都会运行完整U-Net; chỉ có 9 kênh được vẽ đúng cách 变体能利用掩盖计算──
- **Flux-Kontext 是 2025 年的答案。**Đối với`(source_image, instruction)`Làm một lần đi trước: không có mặt nạ độc lập, không có SDEdit tẩy nhiễu.

## 延伸阅读

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 无需训练的涂料──
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) SDEdit。
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) 文本指令编辑。
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643)SAM, mặt nạ.
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) video SAM。
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) Chú ý 层级编辑。
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) 2024 công cụ
