# Diffusion Models  DDPM sıfırdan

> Ho、Jain、Abbeel(2020) bu alanda terk edilemez bir yöntem sağladı──buğuşla ızgarayı yok etmek için 1000 adım atıldı── bir sinir ağını eğitmek, ızgarayı tahmin etmek için Bu süreçte geri dönüş yaparak──bu gün, her ana görüntü, video、3D ve müzik modeli bu döngü üzerinde çalışıyor, belki de üzerinde bir akış eşleşmesi veya tutarlılık teknikleri vardır──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 分钟

## Sorun

Bir tane kullanmak istiyorsun.$p_{\text{data}}(x)$Bu yüzden, bu oyun için bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine bir süreliğine kadar bir süreliğine bir süreliğine bir süreliğine kadar bir süreliğine bir süreliğine kadar bir süreliğine bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreliğine kadar bir süreli süreliğine kadar bir süreli süreli süreliğine kadar bir süreli süreli süreli süreli süreli süreli süreliğine kadar bir süreli kadar bir süreli süreli süreli kadar süreli süreli süreli süreli süreli kadar süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli süreli boyunca, bir süreli süreli süreli süreli süreli süreli süreli boyunca, bir süreli süreli süreli süreli süreli süreli süreli boyunca, bir süreli süreli süreli süreli boyunca, bir süreli boyunca, bir süreli boyunca, bir süreli süreli kadar süreli süreli süreli kadar süreli süreli boyunca, bir süreli süreli boyunca, bir süreli kadar süreli boyunca, bir süreli boyunca, bir süreli boyunca, bir süreli boyunca, bir süreli kadar süreli boyunca, bir süreli kadar süreli boyunca, bir süre$\log p(x)$Bu nedenle, olasılıkları vardır) ve (c) 匹配 SOTA kalitesi örnekleri。

Sohl-Dickstein et al. (2015) teorik bir cevap verdi: Gaussian gürültüsünün Markov zincirini aşamalı olarak tanımlamak .$q(x_t \mid x_{t-1})$,并训练一个逆链 $p_\theta(x_{t-1} \mid x_t)$"Ho、Jain、Abbeel(2020) Kayıp'ı basitleştirebilir bir satır  预测 noise  并整理数学──2020 yılında bu bilgiyi meraklılıkla kullanıyor.2021 yılında son teknoloji örnekleri üretmektedir.2022 yılında bu bilgiyi sabit bir yayılım haline getirmiştir.2026 yılında bu bilgiyi temel bir kalitede kullanmaktadır.

## Anlaşım

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Forward process $q$.**- Evet .$T$个小步骤中加入 Gaussian noise──Closed form  数学可处理的原因  是累积步骤 仍然是 Gaussian:

```math
q(x_t \mid x_0) = \mathcal{N}\left( \sqrt{\bar{\alpha}_t} \cdot x_0, (1 - \bar{\alpha}_t) \cdot I \right)
```

İçlerinden $\bar\alpha_t = \prod_{s=1}^{t} (1 - \beta_s)$,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             $\beta_t$Programı...$\beta_t$- Evet .$T=1000$1e-4'den 0.02 linear değişim.$x_T$Yaklaşık olarak$\mathcal{N}(0, I)$- Evet.

**Reverse process $p_\theta$.**Bir sinir ağı öğrenin.$\epsilon_\theta(x_t, t)$,预测被加入的噪音──给定 $x_t$,按下式 denoise:

```math
x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \cdot \left( x_t - \frac{\beta_t}{\sqrt{1 - \bar{\alpha}_t}} \cdot \epsilon_\theta(x_t, t) \right) + \sigma_t \cdot z
```

İçlerinden $\sigma_t$- Evet .$\sqrt{\beta_t}$Bu ifade çok kötü ama sadece bir sayı.$q(x_{t-1} \mid x_t, x_0)$Çözüm istemek$x_{t-1}$,并用 替换                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        $x_0$- Evet.

**Training loss.**

```math
L_{\text{simple}} = \mathbb{E}_{x_0, t, \epsilon} \left[ \left\lVert \epsilon - \epsilon_\theta\left( \sqrt{\bar{\alpha}_t} \cdot x_0 + \sqrt{1 - \bar{\alpha}_t} \cdot \epsilon, t \right) \right\rVert^2 \right]
```

Verilerden örnek$x_0$, bir tane seç .$t$, örnek$\epsilon \sim \mathcal{N}(0, I)$Kapalı bir biçimle bir kez gürültülü hesaplama yapıyorum.$x_t$,并对噪音做回归──一个损失,没有最小x,没有KL,没有重调技──

**Sampling.**- Evet .$x_T \sim \mathcal{N}(0, I)$Başlayın.$t = T$1 代 geri adım.

## Neden işe yarıyor?

Üçüncü görüş:

1. **Denoising is easy; generating is hard.**- Evet .$t=T$Veriler saf bir gürültüdür. Net çözmek için önemsiz bir sorun var.$t=0$Net sadece birkaç piksel temizlemesi gerekiyor.$t$Bu çok zor bir sorun, ama her gürültü seviyesinin aynı ağırlık gruplarından birçok gradient elde edilir.

2. **Score matching in disguise.**Vincent ((2011) kanıt, pré测 gürültü 等价于估计 $\nabla_x \log q(x_t \mid x_0)$,也就是 *score*──reverse SDE kullanın ∆ density gradient 上行  一次被引导的随机走,走向高概率地区──

3. **The ELBO reduces to simple MSE.**完整变化下界在每步都有一个 KL term──使用DDPM的参数化,这些 KL term 会简化为带特定系数的噪音预测 MSE;Ho 去掉系数(称其为 简单损失),质量反而 *提高* 了──


```figure
diffusion-denoise
```

## Yapın

`code/main.py`实现一个1-D DDPM──Data is a two-mode mixture──net is a micro-type MLP,接收 $(x_t, t)$Ve sonucu tahmin edilen gürültü üretmek. Eğitim bir kayıp.

### Adım 1: Önceki program (kapalı form)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### İkinci adım: örnek`x_t`Tek bir atışta

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### Adım 3: Tek eğitim adımı

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### 4. adım: ters örnekleme

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

40 zaman aşaması ve 24 birim MLP'nin 1 boyutlu sorunu için, yaklaşık 200 dönem boyunca iki mod karışımı yapabilmektedir.

## Zaman şartlandırması

Net 需要知道它正在指责哪个时间步骤──两个标准选项:

- **Sinusoidal embedding.**类似 Transformer pozisyon kodlaması。$\text{embed}(t) = [\sin(t/\omega_0), \cos(t/\omega_0), \sin(t/\omega_1), \ldots]$MLP'ye yayımlandı, ağın ortasına yayıldı.
- **Film / group-norm conditioning.**Bu projenin her blokta yerleştirilmesi için bir kanal ölçeği/kıskançlık yapılması gerekiyor.

Bizim oyuncak kodumuz Sinusoidal → Concat.

## Tuzaklar

- **Schedule matters a lot.**Düzsel $\beta$Bu, DDPM'nin varsayılan, ama cosine programı (Nichol & Dhariwal, 2021) aynı hesaplamalarda aşağıda daha iyi bir FID vermiştir.
- **Timestep embedding is fragile.**Çürümeyi$t$作为浮游 传入对玩具 1-D 可行,但对图像会失败;始终使用适当嵌入──
- **V-prediction vs ε-prediction.**Çok küçük veya çok büyük t),$\epsilon$很差──V-bölümleme$v = \alpha \cdot \epsilon - \sigma \cdot x$) daha sabit;SDXL、SD3 和 Flux hepsi kullanıyor.
- **Classifier-free guidance.**İndirim 时,同时计算 şartsız 和 şartsız $\epsilon$Sonra ...$\epsilon_{\text{cfg}} = (1 + w) \cdot \epsilon_{\text{cond}} - w \cdot \epsilon_{\text{uncond}}$, içinden $w \approx 3\text{-}7$❖ Ders 08 会覆盖──
- **1000 steps is a lot.**Üretim DDIM kullanılarak ((20-50 adım) 、DPM-Solver ((10-20 adım)  veya destilasyon ((1-4 adım)  Görüş ders 12。

## Kullan

| Role | Typical stack in 2026 |
|------|-----------------------|
| Image pixel-space diffusion (small, toy) | DDPM + U-Net |
| Image latent diffusion | VAE encoder + U-Net or DiT (Lesson 07) |
| Video latent diffusion | Spatiotemporal DiT (Sora, Veo, WAN) |
| Audio latent diffusion | Encodec + diffusion transformer |
| Science (molecules, proteins, physics) | Equivariant diffusion (EDM, RFdiffusion, AlphaFold3) |

Diffusion ise genel jeneratif omurganıdır. Akış eşleşimi (Düşünme 13) 2024-2026 yılları için yarışanlardır.

## Gönder

保存 `outputs/skill-diffusion-trainer.md`◊Skill 接收数据集 +计算预算,并输出:schedule(linear/cosine/sigmoid)  öngörülme hedefi(ε/v/x)  adım sayısı、guidance scale、sampler ailesi 和 eval protokol¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

## Egzersizler

1. **Easy.**- Evet .`code/main.py`Orta T 40'dan 10'a değişir. Örnek kalitesi (çıkışların görsel histogramı) nasıl geri döner?
2. **Medium.**E-büyüklüğü 切换到 v-büyüklüğü。 yeniden yönlendirme geri adım。
3. **Hard.**添加分类免费指南──以类标签 $c \in \lbrace 0, 1 \rbrace$Şart olarak, eğitim sırasında %10'luk zaman düşer ve örnekleme sırasında kullanılır.$\epsilon = (1+w) \cdot \epsilon_{\text{cond}} - w \cdot \epsilon_{\text{uncond}}$                                                                                                                                                                                                                                                              $w = 0, 1, 3, 7$Şartlı modda vurma oranı

## Anahtar Terimler

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Forward process | “Adding noise” | 固定 Markov chain $q(x_t \mid x_{t-1})$，用于摧毁 data。 |
| Reverse process | “Denoising” | Learned chain $p_\theta(x_{t-1} \mid x_t)$，用于重构 data。 |
| β schedule | “The noise ladder” | Per-step variance；linear、cosine 或 sigmoid。 |
| α̅ | “Alpha bar” | Cumulative product $\prod (1 - \beta)$；给出从 $x_0$ 得到 $x_t$ 的 closed-form。 |
| Simple loss | “MSE on noise” | $\lVert \epsilon - \epsilon_\theta(x_t, t) \rVert^2$；所有 variational derivations 都 collapse 到这里。 |
| ε-prediction | “Predict noise” | 输出是被加入的 noise；standard DDPM。 |
| V-prediction | “Predict velocity” | 输出是 $\alpha \cdot \epsilon - \sigma \cdot x$；在整个 t 上有更好的 conditioning。 |
| DDPM | “The paper” | Ho et al. 2020；linear β、1000 steps、U-Net。 |
| DDIM | “Deterministic sampler” | Non-Markov sampler，20-50 steps，同一个 training objective。 |
| Classifier-free guidance | “CFG” | 混合 conditional 和 unconditional noise predictions 来放大 conditioning。 |

## Üretim Notu: Diffüzyona ilişkin sonuçlar bir adım sayım sorunu

DDPM kağıdı 运行 T=1000 ters adımlar。 hiç kimse onu üretim 交付。 her gerçek sonuç yığınında                                                                                                                                                                                                                                                

1. **Faster sampler, same model.**DDIM(20-50 adım)、DPM-Solver++(10-20)、UniPC(8-16)。Başlangıç döngüsünün düşüşü değiştirilmesi;$\epsilon_\theta$ağırlıklar 不变──将延迟 降低 20-50×──
2. **Distillation.**訓練 student 以更少步骤 匹配 teacher:Progressive Distillation(2 → 1)、Eğitim Modelleri(Özgürlük → 1-4)、LCM、SDXL-Turbo、SD3-Turbo── daha da az gecikme 5-10×, yeniden eğitime ihtiyaç vardır。
3. **Caching and compilation.** `torch.compile(unet, mode="reduce-overhead")`TensorRT-LLM'in yayılma arka planları`xformers`/SDPA dikkat、bf16 ağırlıklar── olacak adımlık gecikme 降低约2×──可与 (1) 和 (2) 叠加──

 Üretim yayım sunucuları, bütçe konuşmaları ve üretim literatürü için LLM'lerin açıklaması aynı: gecikme`num_steps × step_cost + VAE_decode`,sürüklenme `batch_size × (num_steps × step_cost)^-1`△TTFT 很小(bir adım);TPOT- eşdeğer tam yanıt süresi, çünkü kullanıcı perspektifinden bakınca, görüntü üretimi all-at-one──

## Daha Fazla Okumak

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) yayılma kağıdı,超前于时代。
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) DDPM。
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) DDIM, daha az adım.
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) cosine programı, öğrenilmiş değişim.
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) sınıflandırıcı rehberliği。
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598)CFG
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) birleşik notasyon, en net reçete
