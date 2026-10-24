# Otomatik kodlayıcılar ve Variasyonel Otomatik kodlayıcılar (VAE)

> Normal Autoencoder önceden basınç yeniden yapılandırılması. O zaman hatırlayacaktır.$z = \mu + \sigma \cdot \epsilon$2026 yılında kullanılacak her gizli yayılma ve akış eşleşen görüntü modeli için giriş ucunda bir VAE vardır.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 分钟

## Sorun

784 piksellik bir MNIST rakamını 16 rakamlı kod olarak sıkıştırıp yeniden yapılandırın. Normal Otomocikodör MSE'nin yeniden yapılandırılmasında çok iyi performans gösterir. Ancak kod alanı bir 凸不平的混乱だ.

Gerçekten istediğin şey: a) kod alanı, örneğin izotropik Gaussian gibi, örneğin örneğin örneğin örneğin, temiz, düz ve temiz bir dağılımdır.$\mathcal{N}(0, I)$,(b) herhangi bir örnek çözmek için makul bir rakam oluşturabilir, c) kodlayıcı ve dekodör hala çok iyi bir şekilde sıkıştırılabilir.

Kingma'nın 2013 VAE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       $q(z \mid x) = \mathcal{N}(\mu(x), \sigma(x)^2)$Sorunu çözmek için, KL cezasını kullanın.$\mathcal{N}(0, I)$Sonra da dekode edersin.$q(z \mid x)$örnek$z$- Anlamda, kodlayıcıyı kaybettim.$z \sim \mathcal{N}(0, I)$KL cezası, kod alanını zorla yapılandırma mekanizmasıdır.

2026 yılında, VAE 很少单独交付  原始画像品質上上它们已经被扩散超越  ,但它们是每个潜散播模型的首选编码器 (SD 1/2/XL/3、Flux、AudioCraft) ∙

## Anlaşım

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** $z = \text{encoder}(x)$- Evet .$\hat{x} = \text{decoder}(z)$, kayıp = $\lVert x - \hat{x} \rVert^2$◊Kod alanı 无结构。

**VAE encoder.**输出 iki vektör:$\mu(x)$和 $\log \sigma^2(x)$- Definiyorlar.$q(z \mid x) = \mathcal{N}(\mu, \mathop{\mathrm{diag}}(\sigma^2))$- Evet.

**Reparameterization trick.**- Evet .$q(z \mid x)$Örnek küçük değil.$z = \mu + \sigma \cdot \epsilon$, içinden $\epsilon \sim \mathcal{N}(0, I)$Şimdi.$z$Evet .$(\mu, \sigma)$                                                                                                                                                                                                                                                              `μ`和 $\sigma$- Evet.

**Loss.**Kanıt Alt Bağlantısı (ELBO), iki bölüm:

```math
\begin{aligned}
\text{loss} &= \text{重建误差} + \beta \cdot \mathrm{KL}[q(z \mid x) \,\Vert\, \mathcal{N}(0, I)] \\
&= \lVert x - \hat{x} \rVert^2 + \beta \cdot \sum_i \frac{\sigma_i^2 + \mu_i^2 - \log \sigma_i^2 - 1}{2}
\end{aligned}
```

Yeniden inşaat$\hat{x}$推向 $x$- KL Onu$q(z \mid x)$推向前──它们相互权衡──小 $\beta$($<1$) = daha fazla 利 örnekleri, kod alanı 不那么高斯人──大$\beta$($>1$) = 更干净的代码空间,更模糊的样本──β-VAE(Higgins 2017) bu dönemi ünlü kılmak için, ayrıştırma araştırmasını başlattı──

**Sampling.**İndirim: 抽取 $z \sim \mathcal{N}(0, I)$,decode üzerinden ileriye geçmek için bir kez ileriye geçmek için  不像拡散 那样需要反复采样──


```figure
vae-latent-grid
```

## Yapın

`code/main.py`实现一个不使用 numpy或火的微型 VAE──输入是从8D 中的2组件高斯混合 抽取的8维合成数据──编码和解码都是单个隐藏层 MLP──我们实现 tanh激活、前传、损失,以及手写后传──不是生产是教学──

### Adım 1: Kodlayıcı ileriye

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

Kullanım$\log \sigma^2$Hayır.$\sigma$, bu şekilde ağ çıkışı kısıtlı değil$\sigma \approx 0$时 gradients 会消失) 』

### Adım 2: yeniden ölçümleme ve çözme

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### Adım 3: ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

精确的闭式 KL,因为两个分布都是高斯的──不要数值积分──2026年仍有人交付带蒙特卡洛 KL估算的代码  无理由地慢3x──

### Dördüncü adım: oluştur

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

İşte jeneratif model.

## Tuzaklar

- **Posterior collapse.**KL terimi 过于激进地驱动 $q(z \mid x) \to \mathcal{N}(0, I)$, neden oluyor$z$- Hayır.$x$Bu yüzden de bu konuda bir şey yapmamalıyız.$\beta=0$開始, adım adım 1) ̳free bits'e yükselmek veya aktif olmayan boyutlarda KL'den atlamak.
- **Blurry samples.**Gaussian dekoder olasılığı, MSE yeniden yapılandırması anlamına gelir, L2 ile karşılaştırıldığında Bayes-optimaldır (mean)                                                                                                                                                                                                                                              
- **β too large, too early.**见后倒塌──从 $\beta \approx 0.01$開始并逐步 ramp──
- **Latent dim too small.**16-D  MNIST için uygundur,256-D  ImageNet için uygundur 2562,2048-D  ImageNet 10242 için uygundur.

## Kullan

2026 VAE yığın:

| Situation | Pick |
|-----------|------|
| Image-latent encoder for diffusion | Stable Diffusion VAE (`sd-vae-ft-ema`) or Flux VAE |
| Audio-latent encoder | Encodec (Meta), SoundStream, or DAC (Descript) |
| Video latents | Sora's spatiotemporal patches, Latte VAE, WAN VAE |
| Disentangled representation learning | β-VAE, FactorVAE, TCVAE |
| Discrete latents (for transformer modelling) | VQ-VAE, RVQ (ResidualVQ) |
| Continuous latents for generation | Plain VAE, then condition a flow/diffusion model in that latent space |

gizli yayılma modeli ise bir VAE, ortasında bir yayılma modeli bulunmaktadır, kodlayıcı ve dekodör arasında bulunmaktadır.

## Gönder

保存 `outputs/skill-vae-trainer.md`- Evet.

Yetenek 接收:dataset profil + laten-dim hedef + aşağı akıntılı kullanımı(rekonstrüksiyon、sampling veya laten-diffusion giriş),并输出:architektür seçimi(sırın/β/VQ/RVQ)、β çizelge、latent dim、decoder olasılığı(Gaussian vs kategorik), ve değerlendirme planı(dim başına MSE、KL tanımlamak、$q(z \mid x)$和 $\mathcal{N}(0, I)$之间的 Fréchet mesafe)

## Egzersizler

1. **Easy.**- Ne ?`code/main.py`Orta $\beta$改为 `0.01`- Evet.`0.1`- Evet.`1.0`- Evet.`5.0` Kayıt: MSE ve KL: Son Yenilenme$\beta$Pareto-en iyisi mi?
2. **Medium.**Bernoulli olasılığı ile (cross-entropy loss) Gaussian decoder olasılığını değiştirmek.
3. **Hard.**- Ben de .`code/main.py`扩展成一个 mini VQ-VAE:用 K=32 girişleri 的代码簿 中的近邻搜索 替换连续 $z$❖ MSE'nin yeniden inşası ile karşılaştırıldığında,并 rapor kod defteri girişlerinin sayısı kullanılıyor.

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Autoencoder | Encode-decode network | $x \to z \to \hat{x}$，学习 MSE。不是 generative。 |
| VAE | 带 sampler 的 AE | Encoder 输出一个 distribution，KL penalty 塑造 code space。 |
| ELBO | Evidence lower bound | $\log p(x) \ge \text{recon} - \mathrm{KL}[q(z \mid x) \Vert p(z)]$；当 $q = p(z \mid x)$ 时 tight。 |
| Reparameterization | $z = \mu + \sigma \cdot \epsilon$ | 将 stochastic node 重写为 deterministic + pure noise。使 sampling 可参与 backprop。 |
| Prior | $p(z)$ | latent 的目标 distribution，通常是 $\mathcal{N}(0, I)$。 |
| Posterior collapse | “KL term wins” | Encoder 忽略 $x$，输出 prior；decoder 必须 hallucinate。 |
| β-VAE | 可调 KL weight | $\text{loss} = \text{recon} + \beta \cdot \mathrm{KL}$。更高 $\beta$ = 更 disentangled 但更模糊。 |
| VQ-VAE | Discrete latent | 用 nearest codebook vector 替换 continuous $z$；支持 transformer modelling。 |

## 生产提示:VAE yayılma sunucusu 中最热的路径

Stable Diffusion / Flux / SD3 borusunda,VAE Her istek iki kez  bir kez kodlanmak için kullanılır, eğer img2img / boyanmak yapılırsa), bir kez dekode etmek için kullanılır.`128×128×16`gizli örnek 回 `1024×1024×3`❖ İki gerçek sonuç:

- **对 decode 做 slicing 或 tiling。** `diffusers` exposition `pipe.vae.enable_slicing()`和 `pipe.vae.enable_tiling()`❖ Tiling 用少量 縫製器具 换取 $O(\text{tile}^2)$- Anımsamaya çalışıyorum.$O(H \cdot W)$◊ tüketicilerin GPU'ları için ⇒ 10242+ 至关重要──
- **bf16 decoder，最终 resize 使用 fp32 numerics。**SD 1.x VAE 以 fp32 发布,并在10242+ 被 cast到fp16 时会 *静默产生 NaNs*──SDXL 提供 `madebyollin/sdxl-vae-fp16-fix` 总是优先使用 fp16-fix variant,或使用 bf16──

## Daha Fazla Okumak

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) VAE kağıdı
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) çözülmüş β-VAE。
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) VQ-VAE。
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) En son görüntü VAE。
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) Dönüştürme; kodlayıcı olarak VAE
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) Encodec, VAE standartı
