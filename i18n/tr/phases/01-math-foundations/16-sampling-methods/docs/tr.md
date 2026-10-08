# Örnekleme yöntemleri

> Örnekleme, AI'nin olasılık alanını keşfetme şeklidir.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## Öğrenme hedefi
-  Sadece benzer rastgele sayılar kullanmak, sıfırdan geri CDF ‒ reddetme ve önem örneklemesini gerçekleştirmek
- Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Ç Ç Çeviri: Çeviri: Ç Ç Çeviri: Çeviri: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- 运行 Metropolis-Hastings MCMC, ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒   ⇒ ⇒ ⇒   ⇒ ⇒    ⇒ ⇒    ⇒ ⇒     ⇒       ⇒ ⇒      ⇒      ⇒      ⇒                                                                                                                                                                                                                                          

## 问题
Bir dil modeli  tamamlanınca, sizin isteklerinizi işlemeyi tamamladıktan sonra, 50.000 logit içeren bir vektör oluşur. Sözlük içindeki her bir simge birine karşılık bir tane seçmeli.

Eğer her zaman en yüksek olasılık seçimi Token ise, her tepki tamamen aynı olacaktır.

Örnekleme sadece metin üretimi için kullanılmaz。Yüksetme Öğrenme  örnekleme yolları ile politika gradientlerini tahmin etmek için。VAE'ler  örnekleme öğrenilmeden dağılım içindeki örnekleme ve rastlantı yoluyla geri yayılma yaparak, gizli temsilleri öğrenmek için。Difüzyon modelleri  örnekleme gürültüsü ile                                                                                                                                                                                                                                                                                                                                                                                                                                             

Her jeneratif AI sistemi bir örnekleme sistemi olacaktır. Örnekleme stratejisi, çıkışın kalitesini, çeşitliliğini ve kontrol edilebilirliğini belirler. Bu ders, her ana örnekleme yönteminin sıfırdan inşa edilmesinden, benzer rastgele sayılardan başlayarak modern LLM'lerin ve jeneratif modellerin teknolojisine kadar devam eder.

## 概念
### Örnek Almanın Önemli Olduğu Nedeni

Örnekleme, AI ve Makine Öğrenimi'nde dört temel rolü üstlenmektedir:

**Generation.**Dil modelleri, yayılma modelleri ve GAN'lar örnekleme yoluyla  üretim çıkışı oluşturur. Örnekleme algoritması, yaratıcılığı, bağlantılılığı ve çeşitliliği doğrudan kontrol eder.

**Training.**Stochastic Gradient Descent 会 sampling mini-batch­­­­s¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

**Estimation.**ML'de birçok miktar kapalı biçim çözümü yok. Veri dağılımında beklentiler Kayıp, enerji tabanlı model bölünme fonksiyonu, Bayesian sonuçları, içerideki kanıtlar.

**Exploration.**MCMC algoritmaları, Bayesian sonuçları içinde arka dağılımları keşfetmek için kullanılır. Evolyasyon stratejileri, örnekleme parametresi bozuklukları, Thompson örneklemesi, kazıklar arasında keşif ve sömürü dengesini oluşturur.

核心挑战是:You can only directly from simple distribution sample (((uniform、normal) ⋅) ⋅ Diğer tüm dağılımlar için, you'd need a method, to transform simple samples into samples from target distribution ⋅

### Eşsiz Rastgele Örnekleme

Her örnekleme yöntemi buradan başlar. Birbirli rastgele sayı jeneratörü, herhangi bir eşit çocuk bölgesi arasında benzer olasılıklara sahip olan [0, 1) arasında bir sayı değerini oluşturuyor.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

N 个 öğenin ayrıntılı toplamı içinde birer örnekleme yaparak U üretmek ve tekrar katı yaparak U üretmek için

关键洞察: 恰好包含单单统一随机数 恰好包含从任意分布中生成一个样本的随机性――技巧在找到正确的转变――

### Ters CDF Yöntem (Dönüştürülmüş Değişiklik Örnekleme)

Kumulatif dağılım fonksiyonu (CDF) sayı değerini概率'a haritalama:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

Ters CDF 会把概率映射回数值──如果 U ~ Uniform(0, 1),那么 X = F_inverse(U) 服从目标分布──

```
Algorithm:
  1. Generate u ~ Uniform(0, 1)
  2. Return F_inverse(u)

Why it works:
  P(X <= x) = P(F_inverse(U) <= x) = P(U <= F(x)) = F(x)
```

**Exponential distribution 示例：**

```
PDF: f(x) = lambda * exp(-lambda * x),   x >= 0
CDF: F(x) = 1 - exp(-lambda * x)

Solve F(x) = u for x:
  u = 1 - exp(-lambda * x)
  exp(-lambda * x) = 1 - u
  x = -ln(1 - u) / lambda

Since (1 - U) and U have the same distribution:
  x = -ln(u) / lambda
```

Eğer bir kısım olarak F_inverse 时 yazmak mümkünse, bu yöntemin etkisi mükemmel olacaktır. Normal dağılım için, kapalı biçimdeki ters CDF yoktur, bu nedenle biz diğer yöntemleri kullanırız.

**离散版本：** Diskret dağılımlar için, CDF'yi kumületif toplam olarak oluşturun, U üretin, sonra kumületif toplamı bulur  U'nun ilk indeksi aşın.`sample_categorical`Yapım biçimi:

### Reddetme Örnekleme

CDF'yi geri çeviremezsen, ama hedef PDF'yi değerlendirebilirsin.

```
Target distribution: p(x)  (can evaluate, possibly unnormalized)
Proposal distribution: q(x)  (can sample from)
Bound: M such that p(x) <= M * q(x) for all x

Algorithm:
  1. Sample x ~ q(x)
  2. Sample u ~ Uniform(0, 1)
  3. If u < p(x) / (M * q(x)), accept x
  4. Otherwise, reject and go to step 1

Acceptance rate = 1/M
```

Bağlı M 越紧, kabul oranı 越高──在低维(1-3) 中, reddedilen örnekleme 效果很好──在高维中, kabul oranı 会指数级下降,因为提案量的大多数都会被拒绝──这是拒绝样本的诅咒的维度──

**示例：从 truncated normal 中 sampling。**Çekilmiş aralığında üst üniform önerisi kullanmak. M zarfı, bu bölgede normal PDF'in en büyük değeri.

**示例：从 semicircle 中 sampling。**Sınırlama tamdörtgeninde bir teker teker öneride bulunur. Eğer nokta yarım döngü içinde düşerse kabul edilir.

### Önemlilik Örnekleme

Bazen hedef dağılım p(x) örneklerine ihtiyacınız yok.

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

Bu, güçlendirme öğreniminde çok önemli. PPO'da, eski politikalar üzerinde çalışarak, yeni politikaları iyileştirmeyi umuyor.

Önemlilik örnekleme tahmincisi arasındaki fark q ile p arasındaki benzerlik derecesine bağlıdır. Eğer q ile p çok farklıysa, az sayıda örnek büyük ağırlıklar elde eder ve değerlendirmeyi yönlendirir.

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### Monte Carlo Tahmini

Monte Carlo tahminleri                                                                                                                                                                                                                                                             

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

Bu nedenle, Monte Carlo yöntemleri, şebeke tabanlı entegrasyonun gerçekleşmesi mümkün olmayan yüksek seviyede bir ortamda baskın konumdadır.

**估计 pi：**

```
Sample (x, y) uniformly from [-1, 1] x [-1, 1]
Count how many fall inside the unit circle: x^2 + y^2 <= 1
pi ~ 4 * (count inside) / (total count)
```

**估计期望：**

```
E[f(X)] ~ (1/N) * sum(f(x_i))    where x_i ~ p(x)

The sample mean converges to the true expectation.
Variance of the estimator = Var(f(X)) / N
```

### Markov Chain Monte Carlo (MCMC):Metropolis-Hastings

MCMC, Markov zincirini oluşturur ve sabit dağılımını hedef dağıtım p(x)。 geçtikten sonra, zincir içindeki örnekler p(x) örneklerinden oluşur.

```
Target: p(x)  (known up to a normalizing constant)
Proposal: q(x'|x)  (how to propose the next state given the current state)

Metropolis-Hastings algorithm:
  1. Start at some x_0
  2. For t = 1, 2, ..., T:
     a. Propose x' ~ q(x'|x_t)
     b. Compute acceptance ratio:
        alpha = [p(x') * q(x_t|x')] / [p(x_t) * q(x'|x_t)]
     c. Accept with probability min(1, alpha):
        - If u < alpha (u ~ Uniform(0,1)): x_{t+1} = x'
        - Otherwise: x_{t+1} = x_t
  3. Discard first B samples (burn-in)
  4. Return remaining samples
```

 (q) = (q) = (x) = (x) = (x) = (q) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = (x) = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =

**为什么有效。**Kabul kuralı Detaylı dengenizi garanti eder: x'de bulunurken x'ye kadar hareket etme olasılığı, x'de bulunurken x'ye kadar hareket etme olasılığı eyleme getirir. Detaylı dengenin anlamı p(x) bu zincirin sabit dağılımıdır.

**实践注意事项：**
- Yanma: zincirde  dengeye ulaşmak  önce erken örnekler bırakılmak
- İnceleme: kendi kendine ilişkiyi azaltmak için, örneği bir kenara bırakın.
- Teklif ölçeği: 太小会让链 移动缓慢(yüksek kabul, yavaş araştırmalar); 太大会让大多数 proposals被拒绝(low acceptance, stuck in place)
- 高维中 Gaussian önerisinin en iyi kabul oranı yaklaşık 0.234

### Gibbs Örnekleme

Gibbs örneklemesi, çok değişken dağılımların özel bir MCMC'sidir. Tüm boyutlarda bir kez değil, her seferinde koşullu dağılımdan bir değişkenyi yenilemektedir.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

Gibbs örneği, her koşullu dağılımdan örnek alabilmenizi gerektirir.
- Bayesian ağlar:graf yapısından koşullar
- Gaussian karışımları: şartlar is Gaussian
- İzleme modelleri: Her spin'in koşullu sadece komşusuna bağlı

Kabul oranı 总是 1 ((her önerme kabul edildi), çünkü kesin şartlı örneklemeden ayrıntılı dengeleri otomatik olarak karşılayacaktır.

**局限。**Değişkenler yüksek seviyeye ilişkin olduğunda, Gibbs örnekleme karışımı  çok yavaş, çünkü bir değişken bir kez yenilenir  dağılım içinde büyük diyagonal hareketler yapamaz 

### Temperatür örneği (LLM'ler için)

Dil modelleri Sözlük için Çekilme İçin Her Token 输出 logits z_1, ..., z_V──Softmax 会将它们转换成概率──Temperature 会在软max 前重新缩放 logits:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**Eğer z_1 = 2 ve z_2 = 1, eğer T = 0.5 olursa, sonra z_1/T = 4 ve z_2/T = 2, fark büyüktür.

**实践中：**
- T = 0.0: açgözlü çözme, en uygun faktör tip S&A
- T = 0.3-0.7: Kodu oluşturmaya uygun yarattığı küçük bir şey
- T = 0.7-1.0:平衡,适合一般对话
- T = 1.0-1.5:Yaratıcı yazma, beyin fırtınası
- T > 1.5: Önemli olmayan bir şekilde kullanılır.

Temperatür hangi simgeyi değiştirir, değişebilir.

### Top-k Örnekleme

Top-k örnekleme, aday topluluğunu en yüksek olasılıkla k 个 Token'e sınırlayacak, sonra yeniden birleştirilmiş ve bu sınırlı topluluktan örnekleme yapılmıştır.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Keep only the top k tokens
  4. Renormalize: p_i' = p_i / sum(p_j for j in top-k)
  5. Sample from the renormalized distribution

k = 1:  greedy decoding
k = V:  no filtering (standard sampling)
k = 40: typical setting, removes long tail of unlikely tokens
```

Top-k 会防止模型选择极低概率的Token (Token) 拼写错误、无意义内容), 这些Token (Token) 存在于词汇分布的长尾中. Sual şu: k 都是固定的如何, k 都是固定的.

### Üst-p (Nucleus) Örnekleme

Top-p örnekleme 会动态调整候选选集合大小──, sabit miktarda Token tutmak değil, p'nin en küçük Token 集合'ından daha fazla toplam olasılık korumak.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Find smallest k such that sum of top-k probabilities >= p
  4. Keep only those k tokens
  5. Renormalize and sample

p = 0.9:  keeps tokens covering 90% of probability mass
p = 1.0:  no filtering
p = 0.1:  very restrictive, nearly greedy
```

Model çok iyi bildiğinde, çekirdek örneklemesi çok az bir Token tutar. Model belirsiz olduğunda, çok fazla bir şey tutar.

**常见组合：**
- Sıcaklık 0.7 + üst-p 0.9: İyi genel ayar
- Sıcaklık 0.0 (cinsel açgözlülük):最适合确定性任务
- Sıcaklık 1.0 + üst-k 50:Fan et al. (2018) 原论文设置

Top-k 和 top-p 组合──先应用 top-k,再在剩余集合上应用 top-p──

### Düzeltme hilesi (AVE'ler için kullanılır)

Variasyonel otomotik kodlayıcıların (VAEs) öğrenme tarzı: girişleri 编码 into latent space (gönülden kodlanmış) bir dağılım, bu dağılımdan örnekleme, sonra örnek 解码回来 (önülden kodlanmış) yapmaktır.

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

Reparametreleme hilesi:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

Bu nedenle geçerli, çünkü N(mu, sigma^2) ile mu + sigma * N(0, 1)  aynı dağılımlıdır.

**在 VAE training loop 中：**
1. Her giriş için kodlayıcı 输出 mu 和 log(sigma^2)
2. Örnek epsilon ~ N(0, 1)
3. 计算 z = mu + sigma * epsilon
4. Z'yi yeniden oluşturma girişini çöz
5. 穿越步骤 4、3、2、1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

 Reparameterizasyon hilesi olmadan, VAE'ler standart geri yayılma eğitimi kullanamazlar.

### Gumbel-Softmax ((可微的 Kategoriel Örnekleme)

Reparametreleme hilesi 连续分布 (Gaussian)  Ayrı kategorik dağılımlar için, başka bir yöntem gerektirir.

**Gumbel-Max trick（不可微）：**

```
To sample from a categorical distribution with log-probabilities log(p_1), ..., log(p_k):
  1. Sample g_i ~ Gumbel(0, 1) for each category
     (g = -log(-log(u)), where u ~ Uniform(0, 1))
  2. Return argmax(log(p_i) + g_i)

This produces exact categorical samples.
```

**Gumbel-Softmax（可微近似）：**

```
Replace the hard argmax with a soft softmax:
  y_i = exp((log(p_i) + g_i) / tau) / sum(exp((log(p_j) + g_j) / tau))

tau (temperature) controls the approximation:
  tau -> 0:  approaches a one-hot vector (hard categorical)
  tau -> inf: approaches uniform (1/k, 1/k, ..., 1/k)
  tau = 1.0: soft approximation
```

Gumbel-Softmax 会产生 дискрет örnek 连续松──输出是概率向量(soft one-hot),而不是 hard one-hot──Gradients 会穿越 softmax 流动──在训练的前进通过中, "直通"估算器:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进通过:前进:前进通过:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:前进:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

**应用：**
- VAEs arasında gizli değişkenler
- Nöral mimarlık araması (选择离散 operations)
- Zor dikkat mekanizmaları
- 带 discrete actions of Reinforcement Learning (Dikre Aksiyonlar)

### Katmanlı Örnekleme

標準Monte Carlo örneklemesi, örnek alanında boşluktan kaynaklanan bir durum olabilir.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

Standart Monte Carlo'ya kıyasla, Stratified sampling'in farklılığı her zaman daha düşük veya benzer:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- Sayı entegrasyonu ((quasi-Monte Carlo)
- Eğitim verileri bölünmüştür.
- 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification 带 stratification  带 stratification  带 stratification   带 stratification                                                                                                                                                                                                                                                                                                                                                                         
- Neural Radiance Fields (Neural Radiance Fields) Kamera ışınları  Uygulayan örnekleme

### Diffüzyon Modelleri ile Bağlantı

Diffusion modelleri  örnekleme süreci ile 生成图像──Forward process 会在 T 步中向图像添加高斯的噪音,直到它变成纯噪音──反流过程 学习指责,逐步恢复原始图像──

```
Forward process (known):
  x_t = sqrt(alpha_t) * x_{t-1} + sqrt(1 - alpha_t) * epsilon
  where epsilon ~ N(0, I)

  After T steps: x_T ~ N(0, I)  (pure noise)

Reverse process (learned):
  x_{t-1} = (1/sqrt(alpha_t)) * (x_t - (1 - alpha_t)/sqrt(1 - alpha_bar_t) * epsilon_theta(x_t, t)) + sigma_t * z
  where z ~ N(0, I)

  Each denoising step is a sampling step.
```

Bu ders yöntemine bağlanın:
- Her denetleme adımı, reparametreleme hilesini kullanır.
- Gürültü programı {alpha_t}  kontrol bir sıcaklık kaydırma
- Eğitim Monte Carlo tahmininden yakın ELBO (gösteriler alt sınır)
- Diffusion modelleri arasında ata örneklemesi bir Markov zinciriydi.

Tüm görüntü üretimi süreci tekrarlayıcı örnekleme: gürültüden başlayarak, her aşamada, öğrenilen tanımlama modeli üzerine kurulmuş, örnek bir gürültü biraz daha az versiyonu vardır.


```figure
monte-carlo-pi
```

## Yapın onu.
### 步骤 1: Teker teker ve ters CDF örneklemesi

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10,000 个指数样本并验证均值为1/lambda──

### 步骤 2: Reddedilme örneği

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

Kullanım reddetme örneklemesi kesilmiş normal dağılımdan 中抽样──通过对样品绘制 histogram 来验证形──

### 步骤 3: Önemlilik örneği

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

Używa jednolite önerisi   szacuje normal rozporı 下的 E[X^2]。

### 步骤 4: Monte Carlo tahmin pi

```python
def monte_carlo_pi(n):
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x*x + y*y <= 1:
            inside += 1
    return 4 * inside / n
```

### 步骤 5: Metropolis-Hastings MCMC

```python
def metropolis_hastings(target_log_pdf, proposal_sample, proposal_log_pdf, x0, n_samples, burn_in):
    samples = []
    x = x0
    for i in range(n_samples + burn_in):
        x_new = proposal_sample(x)
        log_alpha = (target_log_pdf(x_new) + proposal_log_pdf(x, x_new)
                     - target_log_pdf(x) - proposal_log_pdf(x_new, x))
        if math.log(random.random()) < log_alpha:
            x = x_new
        if i >= burn_in:
            samples.append(x)
    return samples
```

İki Gauss'ın karışımı) arasında örnekleme­den.

### 步骤 6: Gibbs örneği

```python
def gibbs_sampling_2d(conditional_x_given_y, conditional_y_given_x, x0, y0, n_samples, burn_in):
    x, y = x0, y0
    samples = []
    for i in range(n_samples + burn_in):
        x = conditional_x_given_y(y)
        y = conditional_y_given_x(x)
        if i >= burn_in:
            samples.append((x, y))
    return samples
```

### 步骤 7: Temperatür örneği

```python
def softmax(logits):
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def temperature_sample(logits, temperature):
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)
```

展示 temperature 如何改变一组 Token logits 的输出分布──

### 步骤 8: Top-k ve top-p örnekleme

```python
def top_k_sample(logits, k):
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]

def top_p_sample(logits, p):
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]
```

### 步骤 9: Reparameterizasyon hilesi

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

演示 Gradientler yeniden ölçülü örnekler 流通, ancak doğrudan örnekler 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通 流通

### 步骤 10: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

展示降低温度 如何让输出接近一热向量──

Tüm gerçekleştirici ve görülebilir şeyler var.`code/sampling.py`İçeride.

## Kullan
NumPy ve SciPy 时,production 版本如下:

```python
import numpy as np

rng = np.random.default_rng(42)

exponential_samples = rng.exponential(scale=2.0, size=10000)
print(f"Exponential mean: {exponential_samples.mean():.4f} (expected 2.0)")

from scipy import stats
normal = stats.norm(loc=0, scale=1)
print(f"CDF at 1.96: {normal.cdf(1.96):.4f}")
print(f"Inverse CDF at 0.975: {normal.ppf(0.975):.4f}")

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])
temperature = 0.7
scaled = logits / temperature
probs = np.exp(scaled - scaled.max()) / np.exp(scaled - scaled.max()).sum()
token = rng.choice(len(logits), p=probs)
print(f"Sampled token index: {token}")
```

Büyük MCMC için özel bir kitle kullanın:
- PyMC: NUTS (adaptif HMC) kullanın
- emcee:ensemble MCMC örnekleme cihazı
- NumPyro/JAX:GPU hızlandırılmış MCMC

Bu yöntemleri sıfırdan inşa ettin. Şimdi bu kitaplık çağrılarını ne yapıldığını biliyorsun.

## 练习
1. Çabuk dağıtım için CDF örneklemesini gerçekleştirmek──CDF F(x) = 0.5 + arctan(x) / pi── 10.000 个 örnek üretmek,并把 histogram与真实 PDF 画在一起──注意重尾(远离中心的极端值)──

2. Uygulamada bir örnekleme yapıldı. Ünlü bir örnekleme yapıldı.

3. Monte Carlo kullanın, 1.000、10,000 和 100,000 个样本 估算 sin(x) 0'dan pi'ye kadar 积分──比较各级的误差──验证误差按 O(1/sqrt(N)) 缩放──

4. Metropolis-Hastings, bir 2 boyutlu dağılımdan örnekleme, içinde p(x, y) esp(-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2);; örnekleri çizmek 和 zincir yörüngesi──尝试不同的 proposition standard deviations──

5. 构建一个完整的文本生成演示:给定一个包含10个词及 logits的词汇,使用 (a) açgözlülük、(b) sıcaklık=0.7、(c) üst-k=3、((d) üst-p=0.9 生成长度为 20 Token 的序列──比较 5 次运行中输出的多样性──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Sampling | “抽取随机值” | 按照 probability distribution 生成数值。所有 generative AI 背后的机制 |
| Uniform distribution | “所有值同等可能” | [a, b] 中每个值都有相同 probability density 1/(b-a)。所有 sampling methods 的起点 |
| Inverse CDF | “概率变换” | F_inverse(U) 会把 uniform sample 转换成来自任意已知 CDF 分布的 sample。精确且高效 |
| Rejection sampling | “提出并接受/拒绝” | 从简单 proposal 中生成，按 target/proposal ratio 成比例的概率接受。精确但浪费 samples |
| Importance sampling | “重新加权 samples” | 使用来自 q(x) 的 samples，通过用 p(x)/q(x) 加权每个 sample，估计 p(x) 下的期望。RL 中 PPO 的核心 |
| Monte Carlo | “平均 random samples” | 将积分近似为 sample averages。误差 O(1/sqrt(N))，与维度无关 |
| MCMC | “会收敛的 random walk” | 构造一个 Markov chain，使其 stationary distribution 是目标分布。Metropolis-Hastings 是基础算法 |
| Metropolis-Hastings | “接受上坡，有时接受下坡” | 提出 moves，基于 density ratio 接受。Detailed balance 确保收敛到目标分布 |
| Gibbs sampling | “一次一个 variable” | 在固定其他 variables 的情况下，从每个 variable 的 conditional distribution 中更新。Acceptance rate 为 100% |
| Temperature | “置信度旋钮” | 在 softmax 前用 T 除以 logits。T<1 使分布更尖锐（更自信），T>1 使分布更平坦（更多样） |
| Top-k sampling | “保留最好的 k 个” | 除概率最高的 k 个 Token 外全部置零，重新归一化，然后 sampling。候选集合大小固定 |
| Nucleus sampling (top-p) | “保留可能性高的那些” | 保留累计概率超过 p 的最小 Token 集合。候选集合大小自适应 |
| Reparameterization trick | “把随机性移到外部” | 写成 z = mu + sigma * epsilon，其中 epsilon ~ N(0,1)。让 sampling 可微。VAE training 的关键 |
| Gumbel-Softmax | “软 categorical sampling” | 使用 Gumbel noise + 带 temperature 的 softmax，对 categorical sampling 做可微近似 |
| Stratified sampling | “强制覆盖” | 把 sample space 分成 strata，并从每个 stratum 中 sampling。方差总是低于 naive Monte Carlo |
| Burn-in | “预热期” | 在 chain 达到其 stationary distribution 之前丢弃的初始 MCMC samples |
| Detailed balance | “可逆性条件” | p(x) * T(x->y) = p(y) * T(y->x)。这是 p 成为 Markov chain stationary distribution 的充分条件 |
| Diffusion sampling | “迭代 denoising” | 从 noise 开始，并应用学到的 denoising steps 来生成数据。每一步都是 conditional sampling operation |

## 延伸阅读
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)- MCMC'nin temelinin ayrıntılı öğretim programı hakkında
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- 原始 Gumbel-Softmax 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- çekirdek (top-p) örnekleme
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍 reparameterization hilesi of VAE 论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- DDPM örneklemeyi görüntü üretimi ile bağlayacaktır
