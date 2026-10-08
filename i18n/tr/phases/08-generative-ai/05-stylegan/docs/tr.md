# StyleGAN

> Çoğu jeneratör bunu yapar.`z`Aynı zamanda her katına girerken StyleGAN'ı çıkarıp açarken:`z`映射到中间表示 `w`Sonra AdaIN'den her çözünürlük seviyesine* enjekte* yap.`w`Bu değişim gizli alanı açtı ve fotoğrafların gerçek yüzüyle ilgili sorunların çözülmesine neden oldu.

**类型：**Yapım
**语言：**Python
**前置要求：**8 · 03 aşaması (GAN), 4 · 08 aşaması (Normalizasyon), 3 · 07 aşaması (CNN)
**时间：**~ 45 dakika

## 问题

DCGAN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `z`映射成一张图像── soru şu:`z` kontrol her şeyi,                                                                                                                                                                                                                                                            `z`Bu dört kişi değişir. Aynı kişiyi, farklı bir duruştan istemezsin. Çünkü bu ifade öyle parçalanmamıştır.

Karras et al. (2019, NVIDIA) 提出:停止把 `z`直接送入conv katmanları---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`4×4×512`Tensor 作为网络输入──学习一个8层 MLP,把 `z ∈ Z → w ∈ W`❖ * Adaptive instance normalization* (AdaIN) ile her çözünürlükte `w`Önce her bir konfor özellik haritasını normalleştir, sonra kullan `w`Sıcaklık ve değişim.

Sonuç şu:`W` Yüksek seviye stili(gestory、身份)   微粒度 stili(光照、颜色)                                                                                                                                                                                                                                              `w`低分辨率层级的风格,并使用图像B 的 `w`Yüksek çözünürlüklü bir seviye stili olarak, böylece iki resim arasında değişim biçimleri vardır. Bu, editörlük, çapraz alan stilleşmesini ve tüm yazıları çözüyor.

## 概念

![StyleGAN: mapping network + AdaIN + per-layer noise](../assets/stylegan.svg)

**Mapping network。** `f: Z → W`, bir 8 katlı MLP`Z = N(0, I)^512`- Evet.`W`Gaussian olarak zorlanmak değil, aynı zamanda uygun verilerin biçimlerini öğrenmek için.

**Synthesis network。**Bir öğrenme süreci.`4×4×512`開始── her çözünürlük blok:`upsample → conv → AdaIN(w_i) → noise → conv → AdaIN(w_i) → noise`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △

**AdaIN。**

```
AdaIN(x, y) = y_scale · (x - mean(x)) / std(x) + y_bias
```

İçlerinden `y_scale`和 `y_bias`- Evet .`w`Bu Style                                                                                                                                                                                                                                                            

**逐层 noise。**Her özellik haritasına ısıtılan tek geçiş yolu Gaussian gürültüsü, ve öğrenilen her geçiş faktörü tarafından küçültülür.

**Truncation trick。**sonuçlar 时,采样 `z`,计算 `w = mapping(z)`Sonra ...`w' = ŵ + ψ·(w - ŵ)`, içinden `ŵ`Evet, birçok örneğin ortalaması.`w`- Evet.`ψ < 1`Çok farklılık var. Neredeyse her StyleGAN demo kullanılıyor.`ψ ≈ 0.7`- Evet.

## StyleGAN 1 → 2 → 3

| 版本 | 年份 | 创新 |
|---------|------|------------|
| StyleGAN | 2019 | Mapping network + AdaIN + noise + progressive growing。 |
| StyleGAN2 | 2020 | Weight demodulation 替代 AdaIN（修复 droplet artifacts）；skip/residual architecture；path-length regularization。 |
| StyleGAN3 | 2021 | Alias-free convolution + equivariant kernels；消除 texture 粘在 pixel grid 上的问题。 |
| StyleGAN-XL | 2022 | Class-conditional, 1024², ImageNet。 |
| R3GAN | 2024 | 以更强的 reg 重新包装；在 FFHQ-1024 上用少 20 倍的 params 缩小与 diffusion 的差距。 |

2026 yılına kadar, StyleGAN3  hala aşağıdaki durumların belirtilmiş seçeneği: a) Yüksek FPS'in dar alanındaki fotoğraflar gerçek gelişim, b) birkaç çekim alanı uyarlaması, c) dönüşüm tabanlı editör, c) yeni verilerde 100 张图像在新数据集上训练,结映射, c) yeniden inşa gerçek fotoğrafları bul`w`, yeniden edit `w`Açık alanlarda metin-resim için uygun bir araç değil, yayım 才是.


```figure
gx-stylegan-mapping
```

## Yapın onu.

`code/main.py`实现一个1-D的玩具版 style-GAN lite:一个映射 MLP,一个合成函数,它接收学到的常量向量,并用从 `w`派生的尺度/bias 进行调制,还有层次噪声──它显示通过 affine-modulation 注入 `w`, ulaşmak veya aşmak `z`拼接进生成器输入方式──

### 步骤 1: haritalama ağı

```python
def mapping(z, M):
    h = z
    for i in range(num_layers):
        h = leaky_relu(add(matmul(M[f"W{i}"], h), M[f"b{i}"]))
    return h
```

### 步骤 2: Adaptif durum normallaştırma

```python
def adain(x, w_scale, w_bias):
    mu = mean(x)
    sd = std(x)
    x_norm = [(xi - mu) / (sd + 1e-8) for xi in x]
    return [w_scale * xi + w_bias for xi in x_norm]
```

Her özellik haritası ve tarafsızlığı , çizgi projeksiyon yoluyla`w`Alıyorum.

### 步骤 3: katmanlık gürültü

```python
def add_noise(x, sigma, rng):
    return [xi + sigma * rng.gauss(0, 1) for xi in x]
```

Her yolun Sigma'sı öğrenilmektedir.

## 陷

- **Droplet artifacts。**StyleGAN 1 özellik haritalarında oluşur blok şekilli damla, çünkü AdaIN ≠ 归零了── StyleGAN 2 ağırlık demodülasyonu 通过缩放卷积重量来修复它──
- **Texture sticking。**StyleGAN 1 ve 2'nin dokuları nesne koordinatları yerine piksel koordinatlarına uyar.
- **Mode coverage。**Çarpışma`ψ < 0.7`Karanlık gibi görünüyor, ama sadece çok dar bir  şekilli bölge örneğinden; Eğer çeşitlilik gerekiyorsa, kullanın `ψ = 1.0`- Evet.
- **Inversion 有损。**Gerçek fotoğrafı tersine çevir .`W`Genellikle optimizasyon veya kodlama yoluyla tamamlanır.

## Kullan

| 使用场景 | 方法 |
|----------|----------|
| 照片级真实人脸（anime、product、窄领域） | StyleGAN3 FFHQ / custom fine-tune |
| 从照片进行人脸编辑 | e4e inversion + StyleSpace / InterFaceGAN directions |
| Face swap / reenactment | StyleGAN + encoder + blending |
| Avatar pipelines | StyleGAN3 w/ ADA for low-data fine-tune |
| 从少量图像做 domain adaptation | 冻结 mapping network，fine-tune synthesis |
| Multimodal 或 text-conditioned generation | 不要用它，使用 diffusion |

对于答案是一个人的脸部照片的产品级演示,StyleGAN在推断成本,在4090 上 <10ms) 上和相同质量门下敏度 上胜过传播

## - Söyle.

保存 `outputs/skill-stylegan-inversion.md`◊Skill 接收一张真实照片并输出:inversion method (e4e / ReStyle / HyperStyle) 、预期潜伏损失、编辑预算(在出现文物 之前你能在`W`Middle移动多远), ve bilinen geçerli düzenleme yönleri ([[年龄、表情、姿态]]) listesi

## 练习

1. **简单。**Ayrılıklı kullan`adain_on=True`和 `adain_on=False`运行  İşlem`code/main.py`❖ Sıkıntılı latente olan sabit latente olan perturbasyonla karşılaştırın.
2. **中等。**实现 mixing regularisation: için bir eğitim parti,计算 `w_a`- Evet.`w_b`, ve sentezin ilk yarısında uygulanmıştır.`w_a`Son yarı aşama`w_b`❖ dekodör 是否学到了 çözülmüş stiller?
3. **困难。**取一个预训练的StyleGAN3 FFHQ modeli(ffhq-1024.pkl) ⋅通过在带标签样本上训练 SVM,找到控制 smile 的 `w`Yön; raporların daha da ilerleyebileceği bir yer.

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Mapping network | “那个 MLP” | `f: Z → W`，8 层，把 latent geometry 与数据统计解耦。 |
| W space | “Style space” | Mapping network 的输出；大致 disentangled。 |
| AdaIN | “Adaptive instance norm” | Normalize feature map，然后由 `w`-projection 做 scale + shift。 |
| Truncation trick | “Psi” | `w = mean + ψ·(w - mean)`，ψ<1 用多样性换质量。 |
| Path-length regularization | “PL reg” | 惩罚 `w` 中单位变化导致的图像大幅变化；让 `W` 更平滑。 |
| Weight demodulation | “StyleGAN2 的修复” | Normalize conv weights 而不是 activations；消除 droplet artifacts。 |
| Alias-free | “StyleGAN3 的技巧” | Windowed sinc filters；消除 texture 粘在 pixel grid 上的问题。 |
| Inversion | “为真实图像找到 w” | Optimize 或 encode `x → w`，使 `G(w) ≈ x`。 |

## Üretim açıklaması: Neden StyleGAN 2026 yılında hâlâ çevrimiçi olabilir

4090 Üst StyleGAN3 能在 10 ms内生成一张 10242 FFHQ 人脸:`num_steps = 1`, VAE çözünürlüğü yok, çapraz dikkat geçiş yok. Production terminology kullanılarak, bu herhangi bir görüntü üreticisinin gecikme sınırıdır.**300× 差距**, geride kalan ürünler için, avatar hizmetleri, kimlik belgeleri boru hattı, stok yüzü üretimi, TCO 上胜出。

İki tane sonuç:

- **没有 scheduler，没有 batcher。**E hedef işgal yapma statik parti en iyisi. Sürekli partileşme (LLM ve yayım için vazgeçilmez) hiçbir kazanç elde etmiyor, çünkü her talebi aynı FLOP tüketmektedir.
- **Truncation `ψ` 是安全旋钮。** `ψ < 0.7`Haritalama ağının ırkında bir dar 形区域采样── bu örnek değişkenliği 杆──峰 değer yükleme zaman düşürmek için servis katmanı 杆──`ψ`, Premium kullanıcılar için  geliştirmek için.

## 延伸阅读

- [Karras et al. (2019). A Style-Based Generator Architecture for GANs](https://arxiv.org/abs/1812.04948) StyleGAN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Tov et al. (2021). Designing an Encoder for StyleGAN Image Manipulation](https://arxiv.org/abs/2102.02766) e4e tersine geçişi。
- [Sauer et al. (2022). StyleGAN-XL: Scaling StyleGAN to Large Diverse Datasets](https://arxiv.org/abs/2202.00273) StyleGAN-XL。
- [Huang et al. (2024). R3GAN: The GAN is dead; long live the GAN!](https://arxiv.org/abs/2501.05441) 现代最小化 GAN reçeti。
