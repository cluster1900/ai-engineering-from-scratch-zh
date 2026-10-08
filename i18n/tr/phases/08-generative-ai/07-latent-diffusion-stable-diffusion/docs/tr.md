# Latent ve sabit difüzyon

> Rombach et al. (2022) Not, bir resim oluşturmak tüm 786k boyut gerektirmez, senedi yapısının boyutlarını yakalamak için yeterli gerekir, yanı sıra kalan kısmını işlemek için tek bir dekodör.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## 问题

5122'nin piksel-uzayda yayılması U-Net'in şeklinde olması anlamına geliyor.`[B, 3, 512, 512]`Bu nedenle, bu işlemler, bir bilgisayarın bir bilgisayarın bir bilgisayarı oluşturduğu için yapılır.

Bu FLOPs, ağ üzerinde yayılan anlamlı olmayan ayrıntıları, yani VAE'nin sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık sık

Bu sabit difüzyon 配方──SD 1.x / 2.x bir 860M U-Net  işlemini kullanmak `64×64×4`- Bu bir şey. - Bu bir şey.`128×128×4`,SD3 UTM (Black Forest Labs, 2024)  U-Net-Flux.1-dev'i değiştirdi. 12B-param DiT-MMDiT-leri aynı iki aşamada çalışmaktadır.

## 概念

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**两个阶段，分别训练。**

1. **Stage 1 — VAE.**Kodlayıcı`E(x) → z`, dekodör`D(z) → x` hedef basınç oranı: her boşluk轴下采样 8×,再调整频道,使总潜尺寸 约为像素数的1/16──Loss = rekonstruksi (L1 + LPIPS algılama) + KL(权重很小,使 `z`Çok fazla Gaussian'a zorlanmayacağız çünkü bizden hiç bir şey istemeyiz.`z`Yapma kesin örnek)  genellikle de rakip kaybı  antrenman,  dekode  çıkmış resim daha     

2. **Stage 2 — 在 `z` 上做 diffusion。**- Ne ?`z = E(x_real)`- Evet. - Evet. - Evet.`z_t`◊推理时: 采样 通过传播 采样 `z_0`Sonra ...`x = D(z_0)`- Evet.

**文本 conditioning。**Ayrıca iki ekstra bileşeme vardır. Bir 结的文本编码器(SD 1.x 用CLIP-L,SD 2/XL 用CLIP-L+OpenCLIP-G,SD3 和流x 用T5-XXL) `[Q = image features, K = V = text tokens]`Ve onları karıştırmak. Tokenler, metin görüntüleri etkilemenin tek yoludur.

**Loss Function 与 Lesson 06 完全相同。**Aynı şekilde gürültü üzerinde DDPM / akış eşleşen MSE yapıyorum.

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

趋势是: DiT (DT) 作用于潜伏补丁的变压器) U-Net'i değiştirmek, metin kodlayıcısını genişletmek, T5 (快速遵守上胜过CLIP), T4 带来更多细节余量) 


```figure
noise-schedule
```

## Yapın onu.

`code/main.py`Bir oyuncak 1-D VAE(tıpkı gösterim için kullanılan kimlik kodlayıcı + dekodör; gerçek VAE 会是 conv net) üzerinde Kursu 06'nın DDPM 之上,并通过类型-free guidance 加入类条件化──它显示了同一个扩散损失 无论运行在原始 1-D 值上,还是运行在编码的值上都有效,这就是关键洞见──

### 步骤 1: kodlayıcı/dekoder

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

Öğretim amacıyla, bu linear haritalama yayımı açıklamak için yeterli olabilir.`z`Ün Operasyon, Önemli olmayan orijinal veri alanı

### 2 adım:`z`- uzay içi yapma yayılması

DDPM'nin 6. Ders ile aynı olduğu net görsel veri`z = E(x)`                                                                                                                                                                                                                                                              `z_0`后,用 `D(z_0)`Çıkarmak.

### 步骤 3: sınıflandırıcı dışı rehberlik

訓練期間,10% 的時間丢弃类标签(替换为零代币)`ε_cond`和 `ε_uncond`Sonra:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0`= 无指导(完全多样性),`w = 3`= 默认值,`w = 7+`= 和 / 过化。

### 步骤 4: 文本 koşullama (概念,不是代码)

Klas etiketini 替换为结 metin kodlayıcı 的输出──通过横断注意 把文本嵌入 输入 U-Net:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

Bu sınıf koşullı difüzyon modeli ile sabit difüzyon arasındaki tek gerçek farkı.

## 陷

- **VAE-scale mismatch。**SD 1.x VAEs 后会应用一个缩放常数`scaling_factor ≈ 0.18215`Bu noktayı unutmak U-Net'in ciddi hataların farkında olmasına neden olur.
- **Text encoder silently wrong。**SD3 需要带 >=128 tokens of T5-XXL,fallback until only CLIP 会有损──始终检查 `use_t5=True`Eğer öyleyse, hemen sadık kalırız.
- **混用 latent spaces。**SDXL、SD3、Flux hepsi farklı VAE kullanıyor. SDXL latenlerinde LoRA'nın kullanımı mümkün değil.
- **CFG too high。** `w > 10`Bu nedenle, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan dolayı, bir çok farklılıktan da çok farklılıktan ortaya çıkmıştır.`w = 3-7`- Evet.
- **Negative prompts leaking。**Boş negatif istek sıfır bir simgeye dönüşecek . Dolandırılmış negatif istek ise sıfır bir simgeye dönüşecek .`ε_uncond`Bu ikisi aynı değil; bazı boru hattları, boş kullanılır.

## Kullan

2026 yılının üretiminde:

| Target | Recommended backbone |
|--------|----------------------|
| 窄领域、配对数据、从零训练模型 | SDXL fine-tune (LoRA / full) — 最快交付 |
| 开放域 text-to-image，开放权重 | Flux.1-dev (12B, Apache / non-commercial) 或 SD3.5-Large |
| 最快推理，开放权重 | Flux.1-schnell (1-4 step, Apache) 或 SDXL-Lightning |
| 最佳 prompt adherence，托管服务 | GPT-Image / DALL-E 3 (still), Midjourney v7, Imagen 4 |
| 编辑工作流 | Flux.1-Kontext (Dec 2024) — 原生接受 image + text |
| 研究、baseline | SD 1.5 — 古老但研究充分 |

## - Söyle.

保存 `outputs/skill-sd-prompter.md` Bilik 接收一个文本提示 + 目标风格,并输出:model + checkpoint、CFG ölçeği、sampler、negative prompt、resolution、可选的 ControlNet/IP-Adapter 组合,以及一个逐步的QA 清单──

## 练习

1. **Easy.**Kullanım rehberliği`w ∈ {0, 1, 3, 7, 15}`运行  İşlem`code/main.py`                                                                                                                                                                                                                                                              `w`Sınıf gerçek verilerin ortalama değerinden uzak mı?
2. **Medium.**Oyuncak 線性エンコーダー 換為 tanh-MLPエンコーダー/デコーダー 对,并加入重建損失──在新潜中上再训练拡散──サンプル品質 会变吗?
3. **Hard.**Kullanın                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `sdxl-base`, CFG=7 ile 30 Euler adımını yürütmek,并计时――然后切换到 `sdxl-turbo`, 4 adım ile 和 CFG=0── aynı konu, farklı kalite, neler olduğunu ve nedenlerini açıklamak.

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

## Üretim açıklaması: 8GB 消費級 GPU üzerinde çalıştırılır Flux-12B

参考流集成是经典的我有一张消费级GPU,能交付吗?配方──技巧就是把生产推理文献列出的同一个三旋配方应用到扩散 DiT:

1. **Staggered loading。**Fluks var üç ihtiyaç yok aynı zamanda var VRAM içindeki ağ:T5-XXL metin kodlayıcı(fp32 下約 10 GB)、CLIP-L(小)、12B MMDiT, yanı sıra VAE。先编码 prompt*,delete* encoders,加载 DiT,denoise,*delete* DiT,加载 VAE,decode──消费级 8GB GPUs 一次只能容纳一个阶段──
2. **通过 bitsandbytes 做 4-bit quantization。**T5 kodlayıcı ve DiT 上都使用 `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)`❖内存 azalmış 8×, Aritra'nın referanslarına göre, not defterinde bağlantılar var), metin-resim kalitesi neredeyse fark edilemez olarak azalmıştır.
3. **CPU offload。** `pipe.enable_model_cpu_offload()`Önceki gelişme sırasında otomatik olarak CPU ve GPU arasında değişim modülleri olacaktır.

Kayıt:`10 GB T5 / 8 = 1.25 GB`kuantitasyonlu,`12 B params × 0.5 bytes = ~6 GB`Kvantizasyonlu DiT, tekrar ekleme, stas00'ün diğeriyle, TP=1 sonuçlarının son kesiminde durum: model paralelliği yok, maksimum kuantitasyon.

## 延伸阅读

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Dönüştürülme 
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) SDXL。
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748)- DiT.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) SD3, MMDiT。
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598)CFG
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) Flux.1 系列。
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) Üstde belirtilen her kontrol noktasının referansı gerçekleştirilmiştir.
