# Şartlı GAN'lar ve Pix2Pix

> 2014-2017 yılının ilk büyük başarısı, GAN'ı kontrol etmekti. Bir etiket, bir resim veya bir cümle ekledi. Pix2Pix, bir resim sürümü yapıyordu.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 8 · 03 (GANs), Phase 4 · 06 (U-Net), Phase 3 · 07 (CNNs)
**Time:** ~75 分钟

## 问题
无条件 GAN 会采样任意人脸──做演示 有用,进生产 没用──你想要的是:*把草图 映射成照片*、*把地图 映射成空照片*、*把白天场景 映射成夜间*、*给灰度图片 上色*──在所有这些任务中,你会得到一个输入图片`x`, ve bir çeşit semantik karşılıklılık ile çıkmak zorunda `y`Herkes.`x`Tüm bunlar mantıklıdır.`y`❖ Ortalama kare hatası onları düzeltir ❖ Düşmanlık kaybı olmaz çünkü ❖ gerçek gibi görünür ❖ ❖ ❖ ❖ ❖ ❖

Şartlı GAN (Mirza & Osindero, 2014) Şartlı `c`作为输入加入 `G`和 `D`❖Pix2Pix (Isola et al., 2017) bunun üzerine özel birleştirme yaptı: koşul tam girme görüntü, jeneratör U-Net, ayrımcı * patch tabanlı* sınıflandırıcı (PatchGAN), Kayıp + L1─2026 yılında bile, bu kitle biçimi kısıtlı görüntü-resim alanında üstü hala sıfır eğitimli metin-resim modeli üzerinde başarmıştır, çünkü * eşleşmiş veriler* üzerinde eğitimlidir  Sahip olduğunuz doğru olan sinyaller 

## 概念
![Pix2Pix: U-Net generator, PatchGAN discriminator](../assets/pix2pix.svg)

**Conditional G.** `G(x, z) → y`Pix2Pix'te,`z`G 内部的落下 (G 内部的落下)  没有输入噪音  孤立 发现显式噪音 会被忽略) 

**Conditional D.** `D(x, y) → [0, 1]`▽输入是 *pair*(condition, output) ー这是关键差异:D 必须判断 `y`Evet veya değil`x`Birliği, sadece yargılamayı gerektirmez.`y`Görünüşe göre gerçek mi?

**U-Net generator.**带有跨瓶跳连接的编码器-decoder──输入和输出共享低级结构的任务至关重要──没有这些跳转,高频细节会消失──

**PatchGAN discriminator.**D Not output single gerçek/sahte puan, ama output one `N×N`Grid, her hücre 判断约70×70 piksel 接收场──然后取平均──这是一个马科夫随机场 假设:真实感是局部的──训练快得多,参数更少,输出更利──

**Loss.**

```
loss_G = -log D(x, G(x)) + λ · ||y - G(x)||_1
loss_D = -log D(x, y) - log (1 - D(x, G(x)))
```

L1 项稳定训练,并推动 G 接近已知目标──L1  L2 产生更利的边缘 (meydanlar, araçlar değil) ⋅`λ = 100`Evet, Pix2Pix 默认值──

## CycleGAN  çift olmadığınızda

Pix2Pix 需要对 `(x, y)`Data──CycleGAN (Zhu et al., 2017) 通过额外的 Loss 放弃这个要求:*tükre tutarlılığı* kaybı── iki jeneratör:`G: X → Y`和 `F: Y → X`Onları eğit, yap.`F(G(x)) ≈ x`Ve`G(F(y)) ≈ y` Bu, çiftli örnekler olmadığı durumlarda atları zebralara çevirmenize olanak sağlar.

2026 yılında, eşleşmemiş görüntü-resim yayımı ile tamamlandı, CycleGAN yerine, ancak döngü tutarlılığı  düşüncesi neredeyse her bir eşleşmemiş alan uyarlaması 论文中──


```figure
gx-patchgan
```

## Yapın onu.
`code/main.py`1-D verilerinde, küçük bir şartlı GAN koşulunu gerçekleştirmek için.`c`: : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : : 

### 步骤1: G 和 D' ın girişlerine koşul ekleyecek

```python
def G(z, c, params):
    return mlp(concat([z, one_hot(c)]), params)

def D(x, c, params):
    return mlp(concat([x, one_hot(c)]), params)
```

Tek sıcak kodlama en basit yöntemdir. Daha büyük modeller öğrenilen yerleşimleri, FiLM modülasyonunu veya çapraz dikkatini kullanır.

### 步骤 2: şartlı tren

```python
for step in range(steps):
    x, c = sample_real_conditional()
    noise = sample_noise()
    update_D(x_real=x, x_fake=G(noise, c), c=c)
    update_G(noise, c)
```

Generatör, sınırlı değil, aşağıdaki gerçek dağılımın * belirlenmiş koşullara uyumlu olması gerekir.

### 步骤 3:验证每个类的输出

```python
for c in [0, 1]:
    samples = [G(noise, c) for noise in batch]
    mean_c = mean(samples)
    assert_near(mean_c, real_mean_for_class_c)
```

## 陷
- **Condition 被忽略。**G 学会 边缘化,D 从不惩罚,因为条件信号 太弱──修复:更强地条件 D( erken katman,而不只是迟), projeksiyon ayrımcılığını kullanmak (Miyato & Koyama 2018)。
- **L1 weight 过低。**G 漂移到任意看起来真实输出,而不是忠实的输出──Pix2Pix-style 任务从 λ≈100 开始──
- **L1 weight 过高。**G  模糊 çıktılar oluşur, çünkü L1  hâlâ L_p normudur.
- **D 中 ground-truth leakage。**- Ben de .`(x, y)`D giriş olarak, sadece`y`◊否则 D 无法检查一致性──
- **每个 class 的 mode collapse。**Her sınıf bağımsız çöküşe neden olabilir. Sınıf koşullarındaki çeşitlilik kontrollerini yaparlar.

## Kullan
2026 yıl resim-resim  görev durumu:

| Task | Best approach |
|------|---------------|
| Sketch → photo, same domain, paired data | Pix2Pix / Pix2PixHD（仍然快，仍然锐利） |
| Sketch → photo, unpaired | 带 Scribble conditioning model 的 ControlNet |
| Semantic seg → photo | SPADE / GauGAN2 或 SD + ControlNet-Seg |
| Style transfer | 带 IP-Adapter 或 LoRA 的 Diffusion；GAN methods 属于 legacy |
| Depth → photo | Stable Diffusion 上的 ControlNet-Depth |
| Super-resolution | Real-ESRGAN (GAN), ESRGAN-Plus, 或 SD-Upscale (diffusion) |
| Colorization | ColTran、diffusion-based colorizers，或 Pix2Pix-color |
| Daytime → nighttime, seasons, weather | CycleGAN 或 ControlNet-based |

Bu nedenle, pixel'in birbiriyle bağlantılı olarak kullanılması ve birbiriyle bağlantılı olarak kullanılması için, pixel'in birbiriyle bağlantılı olarak kullanılması gerekir.

## - Söyle.
保存 `outputs/skill-img2img-chooser.md` Bilik 接收任务描述、数据可用性(paired vs. unpaired、N sample) 和 latency/quality budget,然后输出:approach(Pix2Pix、CycleGAN、ControlNet variant、SDXL + IP-Adapter)、training data requirements、inference cost 和 eval protocol(LPIPS、FID、task-specific)

## 练习
1. **Easy.**修改 `code/main.py`, üçüncü sınıfı katın. G'nin her sınıfın gürültüsünü doğru modaya doğruyu gösterdiğini doğrulayın.
2. **Medium.**1-D ayarında, algısal biçim kaybı kullanın L1 değiştirin. Örneğin, küçük dondurulmuş D özellik çıkarıcı olarak.
3. **Hard.**1-D ayarında 中草拟一个CycleGAN:两个分布、两个发电机、周期损失――展示它能在没有对数据的情况下学会在两者之间映射――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Conditional GAN | “带 labels 的 GAN” | G(z, c), D(x, c)。两个 networks 都看到 condition。 |
| Pix2Pix | “Image-to-image GAN” | 带 U-Net G 和 PatchGAN D + L1 loss 的 paired cGAN。 |
| U-Net | “带 skips 的 encoder-decoder” | 对称 conv network；skips 保留 high-freq。 |
| PatchGAN | “Local-realism classifier” | D 输出 per-patch score，而不是 global score。 |
| CycleGAN | “Unpaired image translation” | 两个 G + cycle-consistency loss；没有 paired data。 |
| SPADE | “GauGAN” | 用 semantic map normalize intermediate activations；segmentation-to-image。 |
| FiLM | “Feature-wise linear modulation” | 来自 condition 的 per-feature affine transform；便宜的 conditioning。 |

## 生产说明: Pix2Pix 作为受延迟约束的基线

Eğer çift verileriniz varsa 和狭窄任务(sketch → render、semantic map → photo、day、night)时,Pix2Pix'in tek çekim sonucu,

| Path | Steps | Typical latency at 512² on a single L4 |
|------|-------|----------------------------------------|
| Pix2Pix (U-Net forward) | 1 | ~30 ms |
| SD-Inpaint or SD-Img2Img | 20 | ~1.2 s |
| SDXL-Turbo Img2Img | 1-4 | ~0.15-0.35 s |
| ControlNet + SDXL base | 20-30 | ~3-5 s |

Pix2Pix statik partilerin ödemesi 上胜出(Her istek 都是相同的FLOPs) ・・・Difusion 在质和通化 上胜出。Modern uygulama genellikle Pix2Pix tarzı destilli modelini,并为尾输入提供扩散倒退──

## 延伸阅读
- [Mirza & Osindero (2014). Conditional Generative Adversarial Nets](https://arxiv.org/abs/1411.1784) cGAN 论文。
- [Isola et al. (2017). Image-to-Image Translation with Conditional Adversarial Networks](https://arxiv.org/abs/1611.07004) Pix2Pix。
- [Zhu et al. (2017). Unpaired Image-to-Image Translation using Cycle-Consistent Adversarial Networks](https://arxiv.org/abs/1703.10593) CycleGAN。
- [Wang et al. (2018). High-Resolution Image Synthesis with Conditional GANs](https://arxiv.org/abs/1711.11585) Pix2PixHD──
- [Park et al. (2019). Semantic Image Synthesis with Spatially-Adaptive Normalization](https://arxiv.org/abs/1903.07291) SPADE / GauGAN。
- [Miyato & Koyama (2018). cGANs with Projection Discriminator](https://arxiv.org/abs/1802.05637) Projection D。
