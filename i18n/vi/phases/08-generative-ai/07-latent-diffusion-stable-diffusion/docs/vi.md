# Sự pha trộn ẩn và sự pha trộn ổn định

> Trong 512×512 hình ảnh làm pha trộn không gian pixel, trong toán học là tội chiến tranh. Rombach et al. (2022) lưu ý, để tạo một hình ảnh không cần toàn bộ 786k chiều kích, bạn cần đủ để nắm bắt chiều kích của cấu trúc ngữ nghĩa, cũng như một bộ giải mã độc lập để xử lý phần còn lại.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## 问题

5122 của phixel-không gian phân tán có nghĩa là U-Net phải được hình thành`[B, 3, 512, 512]`Với một mạng U-Net có độ cao 500M, mỗi bước lấy khoảng 100 GFLOPS.

Những FLOP này rất nhiều được sử dụng để đưa ra các chi tiết không quan trọng trên mạng, đó là những VAE có thể được nén lại trong các cấu trúc cao tần số.

Đó là sự phân tán ổn định 配方.SD 1.x / 2.x Sử dụng một 860M U-Net  xử lý `64×64×4`Lưu ý:`128×128×4`,SD3 dùng để phù hợp dòng chảy của Diffusion Transformer (DiT) thay thế U-Net──Flux.1-dev (Black Forest Labs, 2024)  phát hành một DiT-MMDiT-12B-param── chúng đều hoạt động trên cùng một hai giai đoạn.

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**Mã hóa `E(x) → z`, decoder `D(z) → x` mục tiêu giảm áp suất: mỗi không gian轴下采样 8×, tái điều chỉnh kênh, làm cho tổng kích thước ẩn 约为 pixel count 的 1/16──Loss = tái tạo (L1 + LPIPS nhận thức) + KL(权重很小,使 `z`Không được ép buộc phải làm quá Gaussian, vì chúng ta không cần phải làm gì.`z`Làm một mẫu chính xác)  thường cũng sẽ đi kèm với thua đối thủ  tập, để giải mã  hình ảnh xuất hiện  hơn lợi

2. **Stage 2 — 在 `z` 上做 diffusion。**- Đưa đi.`z = E(x_real)`Khi đó, chúng tôi sẽ bắt đầu một cuộc chiến tranh.`z_t`◊推理时: thông qua sự pha trộn 采样 `z_0`, rồi rồi`x = D(z_0)`

**文本 conditioning。**Ngoài ra còn có hai phần phụ hơn. Một phần kết thúc của mã hóa văn bản.`[Q = image features, K = V = text tokens]`Và kết hợp chúng vào. Các mã thông báo là cách duy nhất để văn bản ảnh hưởng đến hình ảnh.

**Loss Function 与 Lesson 06 完全相同。**Cũng như trên tiếng ồn lên làm DDPM / dòng chảy phù hợp MSE. Bạn chỉ thay đổi dữ liệu miền.

## 架构变体

| Model | Year | Backbone | Latent shape | Text encoder | Params |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 tokens) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + refiner | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Distilled | 128×128×4 | same | 1-4 step sampling |
| SD3 | 2024 | MMDiT (multimodal DiT) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT distilled | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 step |

趋势是: sử dụng DiT(作用于潜伏补丁的变压器) thay thế U-Net, mở rộng mã hóa văn bản(T5 在快速遵守上胜过CLIP),增加潜伏频道(4 → 16 带来更多细节余量)


```figure
noise-schedule
```

##  xây dựng nó

`code/main.py`Đặt một đồ chơi 1-D VAE(tài mã dạng + mã hóa, chỉ dùng để trình bày; thực sự VAE 会是 conv net) nằm trên DDPM của Bài học 06 ,并 thông qua hướng dẫn không có phân loại 加入类条件.

### 步骤 1: mã hóa/bản giải mã

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

VAE thực sự có quyền được đào tạo.`z`上操作, không quan tâm đến không gian dữ liệu nguyên thủy.

### Bước 2:`z`- không gian trong làm pha trộn

DDPM: tương tự như bài học 06`z = E(x)`     `z_0`后,用 `D(z_0)`giải mã.

### 步骤 3: hướng dẫn không có phân loại

Trong thời gian tập luyện, 10% thời gian bỏ đi nhãn lớp học (trong đó thay thế thành token không có giá trị)`ε_cond`和 `ε_uncond`, rồi:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`= 无指导(完全多样性),`w = 3`= 默认值,`w = 7+`= 和 / 过化。

### 步骤 4: 文本 điều kiện ((概念,不是代码)

把 class label 替换为结 văn bản mã hóa 的输出──通过跨重视 把 văn bản nhúng 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

Đây là sự khác biệt duy nhất về chất lượng giữa mô hình phân tán theo điều kiện lớp học và phân tán ổn định.

## 陷

- **VAE-scale mismatch。**SD 1.x VAEs trong mã hóa 后会应用一个缩放常数(`scaling_factor ≈ 0.18215`❖ Lưu ý rằng điều này sẽ khiến U-Net trong khoảng cách khác biệt nghiêm trọng của lỗi ẩn trên tập luyện ❖ Mỗi điểm kiểm soát đều có giá trị này ❖
- **Text encoder silently wrong。**SD3 需要带 >=128 token của T5-XXL,fallback đến chỉ CLIP 会有损──始终检查 `use_t5=True`Nếu không thì nhanh chóng thành tín sẽ sụp đổ.
- **混用 latent spaces。**SDXL、SD3、Flux đều sử dụng các VAE khác nhau. Trong các trần SDXL trên tập luyện LoRA không thể sử dụng SD3。 Hugging Face diffusers 0.30+ 会拒绝加载不匹配的检查点。
- **CFG too high。** `w > 10`Sẽ tạo ra hình ảnh và các hình ảnh, và hy sinh sự đa dạng để chi phí quá phù hợp.`w = 3-7`
- **Negative prompts leaking。**Không tính tiêu cực sẽ biến thành mã thông báo không; đầy tiêu cực sẽ biến thành`ε_uncond` Hai thứ này không giống nhau; một số đường ống sẽ được sử dụng không.

## Sử dụng nó

2026 năm sản xuất:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

## 交付 nó

保存 `outputs/skill-sd-prompter.md` Khả năng nhận một văn bản prompt + 目标风格,并输出:model + checkpoint、CFG scale、sampler、negative prompt、resolution、可选的 ControlNet/IP-Adapter组合, cũng như một danh sách kiểm tra QA từng bước──

## 练习

1. **Easy.**Sử dụng hướng dẫn `w ∈ {0, 1, 3, 7, 15}`运行 `code/main.py` ghi mẫu trung bình của mỗi lớp `w`Này, lớp có nghĩa là sẽ bị phân biệt với giá trị trung bình dữ liệu thực?
2. **Medium.**Để thay đổi cho tanh-MLP encoder/decoder đối với,并加入重建损失──在新的潜藏上重新训练扩散──样品质量 会变吗?
3. **Hard.**Sử dụng các chất pha trộn  xây dựng một sự pha trộn ổn định thực sự                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `sdxl-base`, sử dụng CFG=7 运行 30 bước của Euler,并计时――然后切换到 `sdxl-turbo`, sử dụng 4 bước 和 CFG=0── cùng một chủ đề, chất lượng khác nhau, mô tả những thay đổi đã xảy ra và nguyên nhân──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| First stage | “The VAE” | 训练好的 encoder/decoder 对；把 512² 压缩到 64²。 |
| Second stage | “The U-Net” | latent space 上的 diffusion model。 |
| CFG | “Guidance scale” | `(1+w)·ε_cond - w·ε_uncond`；调节 conditioning strength。 |
| Null token | “Empty prompt embed” | 用于 `ε_uncond` 的 unconditional embed。 |
| Cross-attention | “How text gets in” | 每个 U-Net block 都以 text tokens 作为 K 和 V 进行 attention。 |
| DiT | “Diffusion Transformer” | 用作用于 latent patches 的 transformer 替换 U-Net；扩展性更好。 |
| MMDiT | “Multi-modal DiT” | SD3 的架构：带 joint attention 的文本与图像流。 |
| VAE scaling factor | “Magic number” | 将 latents 除以约 5.4，使 diffusion 在 unit-variance 空间中运行。 |

## Biểu sử sản xuất: trên GPU tiêu thụ 8GB hoạt động Flux-12B

参考流体集成是经典的我有一个消费级GPU,能交付吗?配方──技巧就是把生产推理文献列出的同一个三旋配方应用到扩散 DiT:

1. **Staggered loading。**Flux có ba không cần thiết đồng thời tồn tại trong mạng trong VRAM:T5-XXL mã hóa văn bản ((fp32 下约 10 GB) 、CLIP-L(小)、12B MMDiT, cũng như VAE。先 mã hóa prompt,*delete* encoders, tải DiT,denoise,*delete* DiT, tải VAE,decode。消费级 8GB GPUs 一次只能容纳一个阶段。
2. **通过 bitsandbytes 做 4-bit quantization。**Trong T5 mã hóa và DiT 上都使用 `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)`内存 giảm 8x, theo các tiêu chuẩn của Aritra (đồng sách ghi chép có liên kết), chất lượng văn bản-đối với hình ảnh giảm gần như không thể nhận thấy.
3. **CPU offload。** `pipe.enable_model_cpu_offload()`会在每次前进时自动交换模块之间 CPU和 GPU.

Trong sổ ghi là:`10 GB T5 / 8 = 1.25 GB`được định lượng,`12 B params × 0.5 bytes = ~6 GB`Quantized DiT,再加上激活──用 stas00 的说法,这是 TP=1 suy luận的极端情况:没有模型平行,最大化量化──生产环境中你会在H100 上跑 TP=2或 TP=4; đối với đơn台开发笔记本,这就是配方──

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Sự pha trộn ổn định。
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL。
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748) DiT¬¬¬
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, MMDiT。
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) CFG。
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) Flux.1 系列。
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index)                                                                                                                                                                                                                                                              
