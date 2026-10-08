# Renkleme, Renkleme ve resim editörlüğü

> Metin-yazar yeni şeyler yaratır. İnceleme, eski şeyleri yeniden oluşturur.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## 问题

Müşteriler mükemmel bir ürün fotoğrafı gönderir, ancak arka planda bir dağılmış dikkat işaretleri vardır. Bu işaretleri silmek ve diğer tüm bölümlerin bir tablo seviyesine sahip olmasını sağlamak için. Sonuçta farklı renk, farklı ışık, farklı ürün açıları olacaktır.

Bu resimlerin farklılıkları şunlardır:

- **Inpainting.**Maske içinde yeniden üretilir, dış görünümleri korur.
- **Outpainting.**Çekilen maske dışı yeniden üretilmektedir, veya resim dışına yayılır, içeride kalır.
- **Image editing.**Yeniden oluşturulmuş tüm resim, ama orijinal resim ile aynı yapı veya yapı tutarlılığını korumak için

2026 yılının her 条 difüzyon borusu 模式──Flux.1-Fill、Stable Diffusion Inpaint、SDXL-Inpaint、DALL-E 3 Edit── bunlar aynı prensibe dayanmaktadır──

## 概念

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### 朴素方法 (öntemli yöntem) ve neden yanlış olduğunu.

Maske ile 运行标准文字-to-image── her örnekleme aşamasında gürültülü gizli iç iç maskelerin bölgesi ileriye yayılmış net görüntüler için değiştirilmiştir── bu işlevleri başarmıştır── ama sonuçlar çok kötü olmuştur── sınır eserleri ortaya çıkmıştır, çünkü model maske bölgesi içinde ne olması gerektiğini bilmiyor──

### Doğrudan boyalama modeli

Düzeltilmiş bir U-Net'i eğit, 4 değil, 9 giriş kanalı almasına izin ver:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

Ekstra kanallar, VAE kodlanmış kaynak görüntülerinin bir kopyasıdır, bir tek kanal maskesi eklenir.

SD-Inpaint、SDXL-Inpaint、Flux-Fill  9 kanallı  veya benzer  输入──diffuser `StableDiffusionInpaintPipeline`- Evet.`FluxFillPipeline`- Evet.

### SDEdit (Meng et al., 2022)  免费编辑

Bir görüntü kaynağı, bir ortağa ses çıkar.`t`Sonra yeni bir istek kullanın.`t`0'ya doğru ilerlemiş olmalısın.`t`Seçim, gerçeklik ve yaratma özgürlüğü arasında bir tartışma:

- `t/T = 0.3`→                                                                                                                                                                                                                                                               
- `t/T = 0.6`→ 中等编辑,保留粗略结构
- `t/T = 0.9`→  yakınlık gürültü  生成,对源图保留最小

### InstructPix2Pix (Brooks et al., 2023)

- Evet .`(input_image, instruction, output_image)`Üç元组上精细调 一个扩散模型──推理时,同时基于输入图像和文本指令(使它日落、添加一个龙) 进行调节──有两个CFG ölçekleri:图像 ölçek 和文本 ölçek──

### RePaint (Lugmayr et al., 2022)

保留一个标准无条件扩散模型──在每一步,进行再样本:偶尔跳回更噪的状态并重新生成──这样可以避免边界艺术品──当你没有训练好的涂料模型时使用──


```figure
inpaint-mask-reinject
```

## Yapın

`code/main.py`5 维数据 üzerinde bir oyuncak sürümü 1D boyanma 方案ı gerçekleştirdi. 5 维 mix data üzerinde bir DDPM'yi eğittik, her örnek iki küme 之一'dan 5 浮遊的模型.

### Adım 1: 5 - DDPM verileri

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### Adım 2: Tüm 5 boyutlarda eğitim denoiser

標準 DDPM。Net için 5D gürültülü giriş 输出 5D gürültü öngörü。

### Adım 3: Maskeyi kullanmak

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

Bu basit bir yöntemdir ve oyuncaklarda 1-D sayılarda geçerlidir. Gerçek görüntü boyaması 9 kanallı 输入 kullanmak, çünkü yapı uyumluluğu daha önemlidir.

### Adım 4: Çizgi

Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çizgi: Çiz

## 陷

- **Seams.**朴素方法会留下可见边界,因为 Gradient 信息不会跨面膜 流动──修复方式:把面膜 膨胀 8-16 个像素,或使用正确的涂料模型──
- **Mask leakage.**Eğer bir maske yapılmamış görüntüde 区域质量低或有噪声, maske içindeki 污染生成──先 denoise 或轻微模糊──
- **CFG interacts with mask size.**Küçük maske 上使用高CFG 会得到过和补丁──小编辑应降低CFG──
- **SDEdit fidelity cliff.**- Evet .`t/T = 0.5`- Ne ?`t/T = 0.6`Başlık kimliğini kaybedebilirim.
- **Prompt mismatch.**Hemen 应该描述*整张*图,而不只是新内容──用 A cat sitting on a chair, instead of a cat──

## Kullan

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

SAM(Meta'nın Segment Anything,2023) + difüzyon boya is 2026 yılın背景移除管eline。SAM 2(2024)适用于视频。

## Gönder

保存 `outputs/skill-editing-pipeline.md` Yeteneklilik 接收一张原图 + 编辑描述 + 可选面具(或 SAM prompt),并输出:面具 生成方法、基模型、CFG ölçekleri(resim + metin)、SDEdit-t veya boyanma modusu, yanı sıra QA kontrol listesi──

## 练习

1. **Easy.**- Evet .`code/main.py`Orta,                                                                                                                                                                                                                                                              
2. **Medium.**RePaint: 每到第十个反转步骤,跳回 5 步(加噪)并重新指明──测量它是否降低面具 边缘的边界残留──
3. **Hard.**kullan Hugging Face Diffusers салыштырма:SD 1.5 Inpaint + ControlNet-Openpose 与 Flux.1-Fill, в 20 个 yüz-yenilenme 任务上测试──分别评分 pose adherence 和 kimlik koruma──

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

## 生产提示: geçiş için çok hassas olan boru hattlarını düzenle

Kullanıcı düzenleme görüntü zaman, beklenti dönüşü 5 saniyeden düşük. L4 yukarı 10242'nin 30 adım SDXL-Inpaint  3-4 saniyeden sonra SAM maskisi jenerasyonu tekrar eklenir.

- **SAM-H 是慢的那个。**10242 下 SAM-H 约200 ms;SAM-ViT-B 约40 ms,质量损失很小──SAM 2(video) will increase time dimension开销; don't use it for single picture edit──
- **能跳过 encode 就跳过。** `pipe.image_processor.preprocess(img)`Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: Hedefler: hedefler: hedefler: hedefler: hedeflerler: hedeflerlerlerler: hedeflerlerlerlerler: hedeflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerflerfler`latents=...`Bir kere atlayarak VAE koduna girdim.
- **Mask dilation 也影响吞吐。**Küçük maske U-Net ileri geçişinin büyük kısmı harcanmıştır.`diffusers``StableDiffusionInpaintPipeline`Nasıl olursa olsun tüm U-Net'i çalıştırır; sadece 9 kanalın düzgün bir şekilde boyanması 变体能利用掩面计算──
- **Flux-Kontext 是 2025 年的答案。**- Evet .`(source_image, instruction)`Yapma tek sefer ileri geçiş: hiç tek maske, hiç SDEdit gürültü süpürme yok. H100'de yaklaşık 1.5 saniye boyunca bir düzenleme tamamlayın.

## 延伸阅读

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) 无需训练的涂料──
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) SDEdit。
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) 文本指令编辑。
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643)SAM, maske.
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) video SAM。
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) Dikkat 层级编辑。
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/)2024 araçları
