# Genereatif Modeller  分类法与历史

> Her bir resim modeli, metin modeli, video modeli ve 3D modeli beş sınıfın birindedir. Seçim sınıfı, matematikle karşılaştırıldığında birkaç hafta geçer.

**类型:**Öğrenme
**语言:**Python
**先修要求:**2. aşama (ML Temellikleri), 3. aşama (Depth Learning Core), 7. aşama · 14. aşama (Transformers)
**时间:**~ 45 dakika

## 问题

Genreatif model bir şey yaparak belli olmayan bir dağılımdan belirlenir.`p_data(x)`抽取的训练样本,输出看起来像来自同一分布的新样本──人脸、句子、MIDI 文件、蛋白结构 Eğer gözle baktığınızda, hepsi aynı soru¬

Zorluklar var.`p_data`Bir 512x512 RGB görüntü yaklaşık 786k 维) içinde bulunan bir örnek bu uzay içindeki çok zayıf bir çeşitlilik üzerinde, ve siz sadece 10M 个样本―― şiddetli çözüme yoğunluğu hiçbir umut yok―― her jeneratif model bir zorluğun başka bir biraz daha zorluğun bir sorun haline getirmek için vardır――

Son 12 yılda beş aile hayatta kaldı. Her aileyi anlamak, neden bazı görevlerde başarılı olduğunu ve neden diğer görevlerde çöktüğünü anlatacaktır.

## 概念

![Generative models 的五个家族 — 按它们建模的对象分类](../assets/taxonomy.svg)

**1. Explicit density, tractable。**- Ben de .`log p(x)`写成一个你真的能计算的求和──Autoregressive modeller (PixelCNN, WaveNet, GPT) `p(x) = ∏ p(x_i | x_<i)`因式分解──Normalleştirme akışları (RealNVP, Glow) `p(x)`构建一个简单基础 分布的可逆变换――优点:精确概率,干净的训练 Loss──缺点:autoregressive 推理是顺序的(长序列会慢),流 需要可逆架构(架构限制很强)。

**2. Explicit density, approximate。**Aşağıdaki tanımlama`log p(x)`(ELBO)并优化这个界限──VAEs (Kingma 2013) 使用带变化后的的编码-解码器──Diffusion models (DDPM, Ho 2020) 训练一个指标,它隐式优化加权 ELBO──Diffusion 是 2026年图像、视频和 3D 的主导脊柱──

**3. Implicit density。** tamamen yoğunluktan atlamak; öğrenmek bir üretim örneği jeneratörü `G(z)`Ve bir de gerçek ve yanlış yargılamacı .`D(x)`❖GANlar (Goodfellow 2014) ・推理很快(1 kez ileri geçiş), ancak eğitim süreci belirgin bir şekilde belirdi.

**4. Score-based / continuous-time。**直接学习 log-density 的 Gradient `∇_x log p(x)`(score) ――Song & Ermon (2019)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

**5. 基于 Token 的离散 codes 上的 autoregressive。**VQ-VAE veya kalan kuantitör kullanın yüksek düzeyde veriyi daha kısa bir ayrıntılı token dizisi olarak basın ve ardından Transformer kullanarak token dizisi için oluşturun. Parti、MuseNet、AudioLM、VALL-E、Sora'nın patch tokenizerleri bu şekilde kullanılır.

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

Yeni bir jeneratif model ortaya çıktığında, ilk olarak bu beş soruya cevap vermeden önce,

1. **建模的是什么？**Pixel, laten, dağılım işaretleri, 3 boyutlu Gaussians, ağlar, dalga şekilleri?
2. **Density 是 explicit 还是 implicit？**Yazdılar mı ?`log p(x)`- Ne ?
3. **Sampling：one-shot 还是 iterative？**İteratif, daha yavaş bir şekilde kullanılır; tek bir atış genellikle karşıtlık veya distillenmiş anlamına gelir.
4. **Conditioning：unconditional、class、text、image、pose？**Bu, Kayıp ve Yapımcılık Kararını vermiştir.
5. **Evaluation：FID、CLIP score、IS、human preference、task accuracy？**Her birinin bilinen başarısızlık modları vardır.

Bu aşamada her dersinizde bu beş soruya tekrar cevap vereceksiniz. Sonunda, bu soruların bir yansıması olacak.


```figure
autoencoder-bottleneck
```

## Yapın onu.

Bu dersin kodu bir hafiflik derecesinde görülebilir: üç oyuncak yöntemi kullanın: çekirdek yoğunluğu 离散 histogram, ve en yakın örnek GAN-ish jeneratörü) örnekler arasında bir 1-D Gausssian karışımı için uygun, böylece bir ekranın üzerinde yazdırılabilir bir sorunda açık vs. içsel yoğunluk farkını görebilirsiniz.

运行  İşlem`code/main.py`İki peşelik Gaussian karışımından 2000 numune çıkarıp basar:

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

Dikkat: İlk iki soru sormanıza izin verir. Bu nokta daha fazla mümkün mü?

## Kullan

2026 yılında hangi aile hangi göreve uygun olacak?

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

## - Söyle.

保存为 `outputs/skill-model-chooser.md`- Evet.

Bu beceri  al bir görev açıklaması并输出:(1) hangi aileyi kullanmak için,(2) üç açık seçeneği ve üç barındırılmış seçeneğin sıralama listesi,(3) Muhtemelen başarısızlık modunun farkında olmalısınız, ve (4) 计算/时间预算──

## 练习

1. **Easy。**Aşağıdaki beş ürün için, tanımlayın ailesini ve omurgasını:ChatGPT görüntü、Midjourney v7、Sora、Runway Gen-3、ElevenLabs。 kanıtlar açık teknoloji raporundan alınmıştır。
2. **Medium。**Bu hızlanma ile koşullandırma ve yüksek çözünürlükte devam etmesinin kontrol edilmesi için üç soruyu yazıyorum.
3. **Hard。**选择一个你关心的领域 (例如蛋白结构,CAD,分子轨迹) ◊ 对于该领域当前的SOTA 模型回答五问分诊,并勾勒一个更好的模型会改变什么――) 选择一个你关心的领域 (例如蛋白结构,CAD,分子轨迹) ◊ 选择一个领域 (例如蛋白结构,CAD,分子轨迹) ◊ 选择一个领域 (例如蛋白结构,CAD,分子轨迹) ◊ 选择一个你关心的领域 (例如蛋白结构,CAD,分子轨迹) ◊ 选择一个领域的SOTA 模型对该领域的当前SOTA 模型回答五个问题分诊,并勾勒一个更好的模型会改变什么――)

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

## 生产备注:五个家族,五种推理形态

Her aile farklı sonuç sunucularına yerleştirilmiştir 成本曲線──制作-推理框定为预填 +解码;同样分解也适用于这里:

- **Autoregressive（类别 1 和 5）。**顺序 decode 主导 latency;KV-cache、 sürekli parti ve spekülatif dekode edilmek doğrudan uygulanabilir。
- **VAE / diffusion / flow-matching（类别 2 和 4）。**Bu, LLM anlamında bir kodlama değil.`num_steps × step_cost`... ve ...`step_cost`Bu, bir dönüştürücü veya U-Net ileriye doğru üretimi için bir adım sayımıdır.
- **GAN（类别 3）。**Bir kez ileriye geçmek yok, zaman çizelgesi yok, KV-cache yok, TTFT ≈ toplam gecikme yok, bu yüzden StyleGAN'ın daha da yenilmesinin nedeni budur.

Eğer bir makale özetinde yayılmaktan daha hızlı bir şekilde gördüğünüzde, onu daha az adımlara çevirin × Aynı adım maliyeti × Daha ucuz adım maliyeti ×                                                                                                                                                                                                                                             

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) GAN 论文。
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE 论文。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM 论文。
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) 作为 SDE'nin yayılması──
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) akış eşleşimi 论文。
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) Dönüştürülme 3。
