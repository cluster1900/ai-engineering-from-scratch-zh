# sayı değer sabitliği

> Dalga noktası, bir sıçanın bir ifadesi. Eğitim sürecinde seni ısırır ve bunu fark etmezsin.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## Öğrenme hedefi

- Maksimum çıkarma hilesini kullanmak  sabit bir sayı değeri gerçekleştirmek softmax 和 log-sum-exp
- 识别浮点 计算中的溢出、不足 和灾难性取消
- Merkezi sınırlı farkları kullanarak analitik gradientleri ve sayısal gradientleri  denemek için
- 解释为什么训练时 bfloat16 优于 float16,以及损失规模化 如何防止渐进下流

## 问题

Senin modelin üç saat boyunca çalıştı, sonra da Kayıp... NaN'e dönüştü.`inf`9.002'ye kadar, her derecede şehir var.`nan`Eğitim bitti.

Ya da: model eğitiminiz tamamlandı, ama doğruluk teorinin iddialarından% 2 azdır. Siz her şeyi kontrol ettiniz. Yapılandırma uyumluluğu. Hyperparametre birliği. Veriler uyumluluğu. Sorun, teorinin float32 kullanımındadır.

Ya da: sen sıfırdan gerçekleştiriyorsun çapraz entropi kaybı.`inf`✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿ ✿`exp(100)`Bu sorunu çözmek için her bir ML çerçevesinde iki satırlık bir numara vardır.

Bilgi sabitliği teorik bir sorun değil. Bir antrenmanın başarılı olup olmadığını veya başarısız olup olmadığını belirler.

## 概念

### IEEE 754: Bilgisayar nasıl gerçek miktarı depolar

计算机根据IEEE 754 标准将实数存储为浮点值──一个浮点 有三部分:sign bit、元和 mantissa(meanand)──

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

mantissa kararlılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılıklılılılılılıklılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılılı

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32 size yaklaşık 7 bit 10 进制精度 sağlar. Bu da 1.0000001 ile 1.0000002 arasında ayrım yapabilir, ancak 1.00000001 ile 1.00000002 arasında ayrım yapamaz.

float16 size yaklaşık 3 bit kesinlik sağlar. Bu ifade edilebilecek en büyük sayı 65.504'dir. ML için bu boyut oldukça rahatsız edici, çünkü mantıklar, gradientler ve aktivasyonlar genellikle bu değeri aşırır.

bfloat16 Google'ın float16  aralığı sorusuna verdiği cevaplardır. Bu da float32 ile aynı 8 bitli bir eksponente sahiptir. Aynı aralığı, en fazla 3.4e38'e kadar, ancak sadece 7 mantissa bitleri vardır.

### Neden 0.1 + 0.2 ! = 0.3

sayı 0.1 无法在二进浮点中精确表示──在基础 2 中,它是一个循环小数:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

Float32 onu 23 bitlik mantissa olarak keser. Depo değeri 0.100000001490116 olarak 0.2 olarak 0.200000002980232 olarak 0.300000004470348 olarak 0.3 olarak 0.2 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.3 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.4 olarak 0.

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

Bu ML için çok önemli çünkü:

1. - Evet .`if loss < threshold`Bu şekilde bir kaybın karşılaştırma yanlış bir cevap verebileceğini
2. 累积许多小值 (数千步的渐进更新) Gerçekten uzaklaşacak
3. Eğer kullanılırsa`==`Karadağlar, çekler ve yeniden üretilebilirlik testleri karşılaştırmak başarısız olur

修复方法: asla kullanma `==`Uçaklara göre kullanımı`abs(a - b) < epsilon`Ya da`math.isclose()`- Evet.

### Fena İptal

Eğer iki farklı dalga noktasının birbiriyle aynı şekilde azalırsa, geçerli sayıların birbirini karşılayacağı zaman, kalanı yüksek konumlara yükseltilmiş yuvarlama gürültüsü olarak görülebilir.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

Bu, bir kere eksik bir oranla %19 oranında bir yanıltıcı oluştuğundan kaynaklanır.

- kullanmak için büyük ortalama değerli veriler hesaplama:当 E[x] 很大时计算 `E[x^2] - E[x]^2`
- İki oranın neredeyse aynı olan log- olasılıkları
- 使用过小 epsilon  hesaplama son fark gradientleri

修复方法:重排公式, avoid相减两个很大且几乎相等的数――对方差,使用威尔福德算法,或先对数据居中――对日记概率,始终在日记空间中工作――

### Üst akış ve Alt akış

Üst akış                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`函数 is ML                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

`log()`函数会碰到另一个方向问题:

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

ML'de,`exp()`Şimdi yumuşaklık maksim,sigmoid ve olasılık hesaplamaları arasında.`log()`Şimdi çapraz entropi, log olasılıkları ve KL farklılıkları arasında.`log(exp(x))`组合就是雷区──

### Log-Sum-Exp Trick

Doğrudan hesaplama`log(sum(exp(x_i)))`Bu çok tehlikeli bir şey.`x_i`Çok büyük.`exp(x_i)`Ben de öyle.`x_i`Çok kötü, her biri.`exp(x_i)`Şehir sıfırdan aşağı akıyor.`log(0)`Evet .`-inf`- Evet.

Bu numara: önce en büyük değerini azaltmak için bir katı değer aramak.

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

Neden işe yarıyor: Kısaltma`max(x)`后,最大的指数是 `exp(0) = 1`△ Yükseliş gerçekleşmez. △ İsteği ve içindeki en az bir element 1'dir, bu yüzden toplam ve en az 1'dir.`log(1) = 0`                                                                                                                                                                                                                                                              `-inf`- Evet.

证明:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

Yapmak`c = max(x)`Üst akış ortadan kaldırıldı.

Bu numara ML'de her yerde görülüyor:
- Softmax normalleşmesi
- Çaplak entropik kaybı 计算
- Sequence modelleri 中的 log-probability 求和
- Gaussiler karışımı
- Değişiklik sonucu

### Neden Softmax Max-Kürtme Trick İhtiyacınız Var ?

Softmax logitleri 转换为概率:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

Bu numara olmazsa, bu numaralar aşırıya kaçacak.

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

Bu numarayı kullanın, eksik en fazla x = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

概率 tamamen aynıdır. 計算是安全的.

### NaN 和 Inf:检测与预防

`nan`(Bir Sayı değil)`inf`(infinity) 会像病毒一样在计算中传播──Gradient update 中的一个 `nan`Ağırlıktan döner.`nan`Böylece her çıkışın dönüşümü olur.`nan`❖ Eğitim bir adım içinde ölür.

`inf`Nasıl ortaya çıkıyor:
- Çok büyük bir doğru sayıya göre.`exp()`
- Üstelik:`1.0 / 0.0`
- Akumulasyonlar 中的 `float32`Aşırı akış

`nan`Nasıl ortaya çıkıyor:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- Negatif sayı`sqrt()`
- Negatif sayı`log()`
- - Ne olursa olsun .`nan`- Evet .

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

预防策略:

1. Çapışık`exp()`Çıkış:`exp(clamp(x, -80, 80))`
2. 给 isimlendiriciler 加 epsilon:`x / (y + 1e-8)`
3. - Evet .`log()`İçeride:`log(x + 1e-8)`
4. Uygulama için kullanılır
5. Gebruik Gradient Klip  Ağırlıkları Önlemek  Eksikliği
6. 调试时在每次前进通过后检查  调试时在每次前进通过后检查 `nan`- Ne ?`inf`

### Sayısal Gradyant Kontrolü

Analizsel gradientler (Backepropagation'dan) olabilir.

Merkezi fark 公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

Bu O'n'un doğrulaması, ileriye doğru farkı.`(f(x+h) - f(x)) / h`,后者只有 O (h) ⋅

选择 h:太大则近似不准确──太小则 felaketli iptal 会毁掉结果──`h = 1e-5`- Ne ?`1e-7`Çok sık görüyorum.

检查方式: hesaplama analitik ve sayısal gradientler arasındaki göreceli farkı。

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- Relative_error < 1e-7: perfect,Gradient 正确
- Relative_error < 1e-5: kabul edilebilir, çok olası doğru
- Relative_error > 1e-3: Something's wrong
- relative_error > 1:Gradient 完全错误

Yeni bir katman veya Kayıp Fonksiyonu gerçekleştirdiğimizde, gradientleri kontrol etmeliyiz.`torch.autograd.gradcheck()`- Evet.

### Karışık Düzgünlük Eğitimleri

现代 GPUs have specialized hardware(Tensor Cores), float32 快 2-8 倍地计算 float16 Matrix çarpmaları。 karışık hassaslık eğitimi bunu kullanıyor:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

純浮遊16 訓練問題:gradyenler 往往非常小(1e-8 或更小) ・・・Float16 会把低于约6e-8 的任何值下流为零──你的模型会停止学习,因为所有 Gradyen更新都是零──

修复方法是 kaybı ölçeklendirme:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

Dinamik kayıp ölçekleme 会自動调整尺度因子──从一个大值(65536)开始──如果梯度过溢 成 `inf`Eğer N'stepler aşırıya kaçmazsa, onu iki katına çıkar.

### Bfloat16 vs. Float16: Neden Bfloat16

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

float16 精度更高(10 mantissa bits vs 7),但范围有限(最大约65,504);;bfloat16 精度较低,但范围与float32 相同(最大约3.4e38);;

对于训练  Neural Network:

- Aktifleştirmeler ve logitler                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- float16  kaybı ölçeklendirme gerektirir, ancak bfloat16 genellikle gerekmez, çünkü boyutları Gradient büyüklük spektrumu kapsamaktadır.
- bfloat16 float32'nin basit kesimi: 丢掉 mantissa'nın düşük 16 位──转换很简单,并且指数无损──

float16 daha uygun sonuçlar, bu zaman sayı değerleri var sınır ve doğruluk daha önemlidir.

### Aralıklı kesim

Patlama gradientleri  gradientlerde gerçekleşir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

两种剪裁:

**Clip by value：**独立 clamp Her Gradient elementı

```
grad = clamp(grad, -max_val, max_val)
```

简单,但可能改变 Gradient Vector'ın yönünü.

**Clip by norm：**缩放整个渐变向,使其规范不超过值──

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

Bu yüzden de bu şekilde devam et.`torch.nn.utils.clip_grad_norm_()`Yapılacak şeyler.

典型值:transformers 使用 `max_norm=1.0`,RL  kullan`max_norm=0.5`, daha basit ağlar kullanmak `max_norm=5.0`- Evet.

Gradyent kesimi değil hack. Bu bir güvenlik mekanizması.

### Normalleşme katmanları  sayı değer sabitleyici olarak

Batch normallendirme √Layer normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendirme √RMS normallendme √REMNormallendirme √REMNormallendme √REMNormallendme √REMNormallendme √REMNormallendme √REMNormallendme √REMNormallendme √RMS

Normalleşme olmadan, etkinleştirmeler, bir dizi seviye artış veya azalışta olacaktır:

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

Normalleşme, her aşamada yeniden yaşama ve yeniden kısaltma etkinleştirmelerinde bulunur:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`(genellikle 1e-5) tüm etkinliklerde aynı anda öğrenilen parametrelerin ortadan kaldırılmasını önler.`gamma`和 `beta`Ağın ihtiyaç duyduğu herhangi bir ölçekte yeniden kurulabilmesini sağla.

Bu, tüm ağın orta değerinin sayısal değer güvenliği sınırında kalmasını sağlar, hem ileri geçişin aşırı akışını hem de geri geçişin dereceli patlamasını önler.

### 常见 ML 数值 Hata

**Bug：Loss 在几个 epochs 后变成 NaN。**
原因:logits 变得太大,softmax overflow 了──或学习率 太高,重量 发散了──
修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修复: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修: 修

**Bug：Loss 卡在 log(num_classes)。**
原因: model output yakın bir olasılıkla  genellikle gradient kaybolmakta anlamına gelir veya model tamamen öğrenmiyor
修复: Check data labels 是否正确,校验 Loss Function, check dead ReLUs──

**Bug：Validation accuracy 比预期低 1-3%。**
原因: karışık hassasiyet  hiçbir uygun kayıp ölçeklendirme olmaması。 Gradient aşağı akış 会把小 updates 置零。
修复: Dinamik kayıp ölçeklemesini etkinleştir, veya bfloat16 olarak değiştirmek.

**Bug：某些 layers 的 Gradient norms 是 0.0。**
原因: ölü ReLU nöronları (((所有输入为负), veya yüzen16 aşağı akışı。
修复:使用 LeakyReLU 或 GELU,使用 Gradient ölçekleme,检查重量初始化──

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因:deterministik olmayan yüzer nokta birikimi sırası。GPU paralel azaltmaları farklı硬件上会以不同顺序求和,而浮点加算 不满足结合律。
修复: accept小差异(1e-6), veya ayar `torch.use_deterministic_algorithms(True)`Hız kaybını kabul etmiyorum.

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
Çeviri: Çömlekler doğrudan aktarılıyor`exp()`, Maksimum çıkarma hilesini kullanmadı.
修复: kullan `torch.nn.functional.log_softmax()`İçinde log-sum-exp gerçekleştirdi.

**Bug：从 float32 切换到 float16 后训练发散。**
原因:float16 无法表示低于 6e-8 的渐进大小,也无法表示高于 65,504 的激活──
修复:使用带损失尺度的混合精度 (AMP),或改用 bfloat16。


```figure
logsumexp-stability
```

## Yapın onu.

### 步骤 1: gösterme yüzen nokta 精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### 步骤 2: Naif vs. istikrarlı softmax

```python
import math

def softmax_naive(logits):
    exps = [math.exp(z) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def softmax_stable(logits):
    max_logit = max(logits)
    exps = [math.exp(z - max_logit) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

safe_logits = [2.0, 1.0, 0.1]
print(f"Naive:  {softmax_naive(safe_logits)}")
print(f"Stable: {softmax_stable(safe_logits)}")

dangerous_logits = [100.0, 101.0, 102.0]
print(f"Stable: {softmax_stable(dangerous_logits)}")
# softmax_naive(dangerous_logits) would return [nan, nan, nan]
```

### 步骤 3: sabit log-sum-exp'i gerçekleştirmek

```python
def logsumexp_naive(values):
    return math.log(sum(math.exp(v) for v in values))

def logsumexp_stable(values):
    c = max(values)
    return c + math.log(sum(math.exp(v - c) for v in values))

safe = [1.0, 2.0, 3.0]
print(f"Naive:  {logsumexp_naive(safe):.6f}")
print(f"Stable: {logsumexp_stable(safe):.6f}")

large = [500.0, 501.0, 502.0]
print(f"Stable: {logsumexp_stable(large):.6f}")
# logsumexp_naive(large) returns inf
```

### 步骤 4: sabit çapraz entropiyi gerçekleştirmek

```python
def cross_entropy_naive(true_class, logits):
    probs = softmax_naive(logits)
    return -math.log(probs[true_class])

def cross_entropy_stable(true_class, logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = math.log(sum(math.exp(s) for s in shifted))
    log_prob = shifted[true_class] - log_sum_exp
    return -log_prob

logits = [2.0, 5.0, 1.0]
true_class = 1
print(f"Naive:  {cross_entropy_naive(true_class, logits):.6f}")
print(f"Stable: {cross_entropy_stable(true_class, logits):.6f}")
```

### 步骤 5: Gradyent kontrolü

```python
def numerical_gradient(f, x, h=1e-5):
    grad = []
    for i in range(len(x)):
        x_plus = x[:]
        x_minus = x[:]
        x_plus[i] += h
        x_minus[i] -= h
        grad.append((f(x_plus) - f(x_minus)) / (2 * h))
    return grad

def check_gradient(analytical, numerical, tolerance=1e-5):
    for i, (a, n) in enumerate(zip(analytical, numerical)):
        denom = max(abs(a), abs(n), 1e-8)
        rel_error = abs(a - n) / denom
        status = "OK" if rel_error < tolerance else "FAIL"
        print(f"  param {i}: analytical={a:.8f} numerical={n:.8f} "
              f"rel_error={rel_error:.2e} [{status}]")

def f(params):
    x, y = params
    return x**2 + 3*x*y + y**3

def f_grad(params):
    x, y = params
    return [2*x + 3*y, 3*x + 3*y**2]

point = [2.0, 1.0]
analytical = f_grad(point)
numerical = numerical_gradient(f, point)
check_gradient(analytical, numerical)
```

## Kullan

### Karışıklık

```python
import struct

def float32_to_float16_round(x):
    packed = struct.pack('f', x)
    f32 = struct.unpack('f', packed)[0]
    packed16 = struct.pack('e', f32)
    return struct.unpack('e', packed16)[0]

def simulate_bfloat16(x):
    packed = struct.pack('f', x)
    as_int = int.from_bytes(packed, 'little')
    truncated = as_int & 0xFFFF0000
    repacked = truncated.to_bytes(4, 'little')
    return struct.unpack('f', repacked)[0]
```

### Sıfırlama

```python
def clip_by_norm(gradients, max_norm):
    total_norm = math.sqrt(sum(g**2 for g in gradients))
    if total_norm > max_norm:
        scale = max_norm / total_norm
        return [g * scale for g in gradients]
    return gradients

grads = [10.0, 20.0, 30.0]
clipped = clip_by_norm(grads, max_norm=5.0)
print(f"Original norm: {math.sqrt(sum(g**2 for g in grads)):.2f}")
print(f"Clipped norm:  {math.sqrt(sum(g**2 for g in clipped)):.2f}")
print(f"Direction preserved: {[c/clipped[0] for c in clipped]} == {[g/grads[0] for g in grads]}")
```

### NaN/Inf tespit

```python
def check_tensor(name, values):
    has_nan = any(math.isnan(v) for v in values)
    has_inf = any(math.isinf(v) for v in values)
    if has_nan or has_inf:
        print(f"WARNING {name}: nan={has_nan} inf={has_inf}")
        return False
    return True

check_tensor("good", [1.0, 2.0, 3.0])
check_tensor("bad",  [1.0, float('nan'), 3.0])
check_tensor("ugly", [1.0, float('inf'), 3.0])
```

完整实现见 `code/numerical.py`Bu da tüm uç durumları gösterdi.

## - Söyle.

Bu ders:
- `code/numerical.py`, sabit yumuşaklık maksı, log-sum-exp, çapraz entropi, gradyent kontrolü ve karışık hassaslık simülasyonu içerir
- `outputs/prompt-numerical-debugger.md`, teşhis eğitiminde kullanılan NaN/Inf ve sayısal değer sorunu

Bu kararlar 3. aşamada eğitim döngüsünü oluştururken ve 4. aşamada dikkat mekanizmaları gerçekleştirirken tekrar ortaya çıkacaktır.

## 练习

1. **Catastrophic cancellation。**Flet32 中的天真公式 使用`E[x^2] - E[x]^2`計算 [1000000.0, 1000001.0, 1000002.0] 方差──然后使用威尔福德的在线算法 计算──将误差与真实方差(0.6667) 比較──

2. **Precision hunt。**Python'da en az doğru float32 değerini bul .`x`- Evet .`1.0 + x == 1.0`Bu makine epsilon.`numpy.finfo(numpy.float32).eps`- Evet.

3. **Log-sum-exp edge cases。**Kullanılanı aşağıda yerleştir.`logsumexp_stable`函数:(a) 所有值相等,(b) 一个值远大于其他值,(c) 所有值都非常负面(-1000) ――验证它在天真版本 失败的地方给出正确结果──

4. **Gradient checking a Neural Network layer。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `y = Wx + b` ve analitik geriye geçişleri。使用 `numerical_gradient`校验 3x2 ağırlık matrisi 的正确性──

5. **Loss scaling experiment。**模拟 float16 训练:创建范围在 [1e-9, 1e-3] 内的随机梯度,转换为 float16,并测量有多少比例变成零――然后应用损失规模(乘以 1024),转换为 float16,再规模回,并再次测量零比例――

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| IEEE 754 | “float 标准” | 定义 binary floating point formats、rounding rules 和 special values（inf、nan）的国际标准。每个现代 CPU 和 GPU 都实现了它。 |
| Machine epsilon | “精度极限” | 在给定 float format 中，使 1.0 + e != 1.0 成立的最小值 e。对于 float32，它约为 1.19e-7。 |
| Catastrophic cancellation | “减法导致的精度损失” | 相减两个几乎相等的 floating point 数时，有效数字相互抵消，rounding noise 主导结果。 |
| Overflow | “数字太大” | 结果超过最大可表示值并变成 inf。exp(89) 会使 float32 overflow。 |
| Underflow | “数字太小” | 结果比最小可表示正数还接近零，并变成 0.0。exp(-104) 会使 float32 underflow。 |
| Log-sum-exp trick | “先减去最大值” | 通过提出 exp(max(x)) 来计算 log(sum(exp(x)))，以防止 overflow 和 underflow。用于 softmax、cross-entropy 和 log-probability math。 |
| Stable softmax | “不会爆炸的 softmax” | 在 exponentiating 之前减去 max(logits)。结果在数值上相同，且不可能 overflow。 |
| Gradient checking | “校验你的 Backpropagation” | 将 Backpropagation 得到的 analytical gradients 与 finite differences 得到的 numerical gradients 比较，以捕获实现 bug。 |
| Mixed precision | “Float16 forward，float32 backward” | 对 speed-critical operations 使用低精度 floats，对 numerically sensitive operations 使用高精度 floats。典型提速为 2-3x。 |
| Loss scaling | “防止 Gradient underflow” | 在 Backpropagation 前将 Loss 乘以一个大常数，使 gradients 保持在 float16 可表示范围内，然后在 weight updates 前除以同一个常数。 |
| bfloat16 | “Brain floating point” | Google 的 16-bit format，包含 8 个 exponent bits（与 float32 范围相同）和 7 个 mantissa bits（精度低于 float16）。训练时更常用。 |
| Gradient clipping | “限制 Gradient norm” | 缩放 Gradient Vector，使其 norm 不超过阈值。防止 exploding gradients 毁掉 weights。 |
| NaN | “Not a Number” | 来自未定义操作（0/0、inf-inf、sqrt(-1)）的特殊 float value。会传播到所有后续 arithmetic。 |
| Inf | “Infinity” | 来自 overflow 或除以零的特殊 float value。可以组合产生 NaN（inf - inf、inf * 0）。 |
| Numerical gradient | “暴力求导” | 通过计算 f(x+h) 和 f(x-h)，再除以 2h 来近似 derivative。很慢，但用于校验时可靠。 |

## 延伸阅读

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 权威参考资料, içeriği yoğun ama tam
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA  float16  training中 loss scaling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch İçin Karışık Presyon
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)- Google neden TPU'lar için bu biçimi seçti
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)-- 減少浮点 sums 中丸化誤的算法
