# GAN  Generatör vs. Ayrımcı

> Goodfellow 2014'te teknikler tamamen yoğunluğu atladı. İki ağ. Birinde sahtelik yapıldı. Birinde onları yakaladı. Sahtelik ile gerçek örnekleri ayırt edemeyecek kadar birbirlerine karşı karşı koydular.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## 问题

VAE'ler bulanık örnekler üretecek, çünkü MSE dekodör kaybı Bayes'in en iyi görüntülerinden biridir, çok mantıklı sayılar ise mantıklı bir rakamdır.

İyi arkadaşın fikri: bir sınıflandırıcıyı eğit `D(x)`Gerçek görüntü ile sahte arasındaki farkı öğrenmek için bir jeneratör eğitimi`G(z)`Yalancılık yapalım .`D`- Evet.`G`Kayıp sinyalini...`D`Bir şeyin gerçek gibi görünmesini sağlayan bir şey var.`G`改进, bu sinyal de yenilenecek, bir hareketli hedefi takip eder.`G`Asla yazılmamış gibi.`log p(x)`Bu durumun bir parçası olarak,

İşte bu bir karşılaşma eğitimi. Matematikte bir minimum oyun.

```
min_G max_D  E_real[log D(x)] + E_fake[log(1 - D(G(z)))]
```

2026 yılına kadar, GANlar artık SOTA jeneratörü olmayacaklar. Ancak StyleGAN 2/3'ü hala yayınlanan en iyi yüz modelleri, GAN ayrımcıları yaygınlaştırma eğitimi olarak kullanılır. * algı kaybı* arasında, karşılaşma eğitimi hızlı 1 adımlı distillasyonlara dayanır.

## 概念

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Generator `G(z)`。**Gürültü vektörü`z ~ N(0, I)`映射到样本 `x̂`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ 

**Discriminator `D(x)`。**Örnek 映射为 skalar olasılık (或分) ・・・真实 → 1,fake → 0。

**Loss。**两个交替更新:

- **训练 `D`：** `loss_D = -[ log D(x) + log(1 - D(G(z))) ]`◊ real=1, fake=0 için ikili çapraz entropi yapın.
- **训练 `G`：** `loss_G = -log D(G(z))`Bu iyi arkadaş kullanımı *yetmeyen* 形式(原始的 `log(1 - D(G(z)))`- O da...`D`Çok güvenli.

**Training loop。**Bir adım`D`, bir adım `G`- Evet.

**为什么它能工作。**Eğer `G`完美匹配 `p_data`- Öyleyse .`D`Yapmak için daha iyi tahmin yapıyorum.`G`Daha sonra bir derecede yükselmek için dengelemeye başlamak için.

**为什么它会失效。**Mod çöküşü`G`找到一个 `D`无法分类的模式,然后永远造它) 消失的梯度(`D`Çok hızlı öğrendi.`log D`Yıkıntılı) ̳öğrenme dengesizliği ̳öğrenme oranları ̳batch boyutları ̳ herhangi bir şey) ̳

## 让 GANs kullanılabilir Variantlar

| Year | Innovation | Fix |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv、batch norm、LeakyReLU —— 第一个稳定 architecture。 |
| 2017 | WGAN, WGAN-GP | 用 Wasserstein distance + gradient penalty 替换 BCE。修复 vanishing gradient。 |
| 2017 | Spectral normalization | 对 discriminator 做 Lipschitz-bound。2026 年的 discriminators 中仍在使用。 |
| 2018 | Progressive GAN | 先训练低分辨率，再添加 layers。首次达到 megapixel results。 |
| 2019 | StyleGAN / StyleGAN2 | Mapping network + adaptive instance norm。固定领域 photorealism 的 state of the art。 |
| 2021 | StyleGAN3 | Alias-free、translation-equivariant —— 2026 年仍然是 face gold standard。 |
| 2022 | StyleGAN-XL | Conditional、class-aware、更大 scale。 |
| 2024 | R3GAN | 以更强 regularization 重新包装；无需 tricks 即可在 1024² 上工作。 |


```figure
gan-minimax
```

## Yapın onu.

`code/main.py`1-D verilerde 上训练一个小型GAN:两个高西亚的混合──生成器和歧视器 都是单层隐藏MLPs──我们手写实现前进、后进和最小x循环──目标是看到两个关键失败模式(模式崩 +消失梯度)

### 步骤 1: Doymayan kayıp

Vanilla Goodfellow kaybı`log(1 - D(G(z)))`D'nin yüksek güvenle değiştirilmesi G'nin sahte olarak sınıflandırılması 时趋近0──此时 G'nin eğilimi 基本为零,G 无法改进──非和式 形式`-log D(G(z))`具有相反的表情: D'ye çok güvenince, G'ye güçlü bir sinyal ver.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### 2 adım: Her jeneratör adım bir ayrımcı adım karşı karşıya

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

Yeni sahte bilgiler kullanın yoksa gradientler geçerli olacak.

### 步骤 3: 观察 modunun çöküşü

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

Klasik belirti: İki gerçek modun arasında bir durduruldu.

## 陷

- **Discriminator 太强。**D'nin öğrenme oranını 2-5 kat daha düşük veya örnek/katman gürültüsü ekleyebilirsiniz. D'nin %95'lik doğruluğa ulaştığı takdirde G ölür.
- **Generator 记住了一个 mode。**D girişleri, gürültü, minibatch-dizginasyon katmanı kullanmak veya WGAN-GP'ye geçiş yapmak
- **Batch norm 泄漏 statistics。**Gerçek parti + sahte parti 流经同一个BN层 会混合它们的统计――改用实例规范或光谱规范――
- **Inception-score gaming。**FID 和 IS düşük örnek sayımlarında Aşağı gürültü çok büyük。eval 时使用 ≥10k örnekler。
- **对于 conditional tasks，one-shot sampling 是谎言。**CFG ölçekleri, kesim hileleri ve tekrar örnekleme yapman gerekiyor.

## Kullan

2026 yılının GAN yığın:

| Situation | Pick |
|-----------|------|
| Photoreal human faces, fixed pose | StyleGAN3（最锐利、最小） |
| Anime / stylized faces | StyleGAN-XL 或 Stable Diffusion LoRA |
| Image-to-image translation | Pix2Pix / CycleGAN（Phase 8 · 04）或 ControlNet（Phase 8 · 08） |
| Fast 1-step text-to-image | diffusion 的 adversarial distillation（SDXL-Turbo, SD3-Turbo） |
| Perceptual loss inside a diffusion trainer | image crops 上的小型 GAN discriminator |
| Anything multi-modal, open-ended | 不要用 —— 使用 diffusion 或 flow matching |

GAN'lar 利但狭窄── once your domain 打开, e.g. photos、任意 text prompt、video,就切换到 diffusion──adversarial trick 作为组件继续存在(perceptual losses、distillation),而不是独立生成器──

## - Söyle.

保存 `outputs/skill-gan-debugger.md`◊Skill 接收一次失败的GAN run(loss curves、sample grid、dataset size),并输出按可能性排序的原因、one-line fixes 和 rerun protokol¬¬

## 练习

1. **Easy。**使用默认设置运行 `code/main.py`Sonra ayarlayın.`D_LR = 5 * G_LR`G'nin kaybı, normal değere kadar çöküş.
2. **Medium。**WGAN kaybı yerine Goodfellow BCE kaybı:`loss_D = E[D(fake)] - E[D(real)]`- Evet .`loss_G = -E[D(fake)]`, D'nin ağırlıklarını clip `[-0.01, 0.01]`❖ Eğitim daha sabit mi?
3. **Hard。**1-D örneklerini 2-D verilerine yaymak için: • Çemberdeki 8 Gaussian karışımı: • Takip jeneratörü: • 1k,5k,10k adımlarda: • 8 modun içinden kaçını yakalamak: • minibatch ayrımcılığını gerçekleştirmek ve yeniden ölçmek: •

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Generator | "G" | noise-to-sample network，`G: z → x̂`。 |
| Discriminator | "D" | Classifier `D: x → [0, 1]`，real vs fake。 |
| Minimax | "The game" | joint objective 的 `min_G max_D`。 |
| Non-saturating loss | "The fix" | 对 G 使用 `-log D(G(z))`，而不是 `log(1 - D(G(z)))`。 |
| Mode collapse | "G memorized one thing" | 尽管 data 多样，Generator 只产生少量不同 outputs。 |
| WGAN | "Wasserstein" | 用 Earth-Mover distance + gradient penalty 替换 BCE；gradient 更平滑。 |
| Spectral norm | "Lipschitz trick" | 约束 D 的 weight norms 来 bound 它的 slope；稳定 training。 |
| StyleGAN | "The one that works" | Mapping network + AdaIN；faces 领域 best-in-class，2026 年仍然如此。 |

## Üretim Notu: Tek çekim sonucu GAN'ın süren avantajı

GAN'lar açık alan üretiminde örnek kalitesi 上不再获胜, ancak onlar hala çıkarma maliyetinde 上获胜.

- **没有 prefill，没有 decode stages。**Bir kere .`G(z)`Önceki geçiş---TTFT ≈ toplam gecikme---
- **没有 KV-cache pressure。**唯一状态是重量──Batch size 受激活内存 限制,而不是缓存──
- **Trivial continuous batching。**Her istek aynı sabit FLOP'ları tükettiğinden, sunucu  hedef işgal oranının altındaki statik parti genellikle en iyidir.

İşte bu yüzden GAN destillasyonu (SDXL-Turbo, SD3-Turbo, ADD, LCM) 2026 yılında hızlı metin-resim 的主导技术: 20-50 adımlı difüzyon borusunu 1-4 kez GAN tarzı ileri geçişlere sıkıştırır, aynı zamanda difüzyon tabanının dağılmasını korur.

## 延伸阅读

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) 原始 GAN kağıdı。
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434)İlk sabit mimarlık.
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) WGAN。
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) SN。
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) StyleGAN2。
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) StyleGAN3。
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) SDXL-Turbo。
