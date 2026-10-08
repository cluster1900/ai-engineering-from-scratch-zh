# संख्या मूल्य स्थिरता

> फ्लोटिंग प्वाइंट एक लीक का सार है। यह प्रशिक्षण के दौरान आपको एक छेद में काट देगा, और आप इसे पहले से नहीं देख पाएंगे।

**Type:** Build
**Language:**पायथन
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## 学习目标

- अधिकतम-घटाव ट्रिक का उपयोग करें  प्राप्त करने के लिए संख्यात्मक मूल्य स्थिर softmax और लॉग-सumma-exp
- 识别浮点 计算中的溢出、不足和灾难性取消
- प्रयोग केंद्रित अंतहीन अंतर विश्लेषणात्मक ग्रेडिएंट और संख्यात्मक ग्रेडिएंट  परीक्षण करने के लिए
- 解释为什么训练时 bfloat16 优于 float16,以及损失规模化 如何防止渐进下流

## 问题

आपका मॉडल प्रशिक्षण तीन घंटे, फिर हानि  बन गया NaN. . . . आप एक प्रिंट 语句. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .`inf` तक 9,002 步, प्रत्येक ग्रेडिएंट शहर है `nan`, प्रशिक्षण मर चुका है.

अथवा: आपके मॉडल प्रशिक्षण पूरा हो गया है, लेकिन सटीकता पर शोध के दावे के मुकाबले 2% कम है। आप सब कुछ जाँच कर चुके हैं।

याः आप शून्य से क्रॉस-एंट्रोपी हानि को प्राप्त करते हैं. यह छोटे लॉग में है.`inf`✿softmax overflow ✿, क्योंकि ✿`exp(100)`प्रत्येक एमएल फ्रेमवर्क एक दो पंक्ति की चाल से इस समस्या का समाधान करता है।

संख्यात्मक स्थिरता कोई सैद्धांतिक समस्या नहीं है। यह तय करता है कि एक प्रशिक्षण संचालन सफल है या असफल।

## 概念

### आईईईई 754: कंप्यूटर कैसे भंडारण वास्तविक संख्या

计算机根据 IEEE 754 标准将实数存储为浮点值──一个浮点 有三部分:sign bit、exponent 和 mantissa(significantand)──

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

mantissa decide precisity ((有多少有效数字) ――उपलब्धकर्ता निर्णय दायरा ((एक संख्या हो सकती है अधिक या अधिक) ⋅

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32  आपको लगभग 7 位进制精度 देता है। इसका मतलब है कि यह 1.0000001 और 1.0000002 में अंतर कर सकता है, लेकिन 1.00000001 और 1.00000002 में अंतर नहीं कर सकता है।

float16  आपको लगभग 3 बिट्स सटीकता प्रदान करता है― यह अधिकतम संख्या 65,504 ⋅ है। एमएल के लिए, यह दायरा थोड़ा परेशान करने वाला है, क्योंकि लॉजिट्स, ग्रेडिएंट और सक्रियण ⋅ अक्सर इस मूल्य से अधिक होते हैं।

bfloat16 का उत्तर Google द्वारा float16  के लिए दिया गया है। इसमें float32 के समान 8-बिट एक्सपोनेंट है।

### क्यों 0.1 + 0.2 ! = 0.3

संख्या 0.1 无法在二进制浮点中精确表示──在基础 2 में, यह एक चक्र小数 हैः

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

Float32 इसे 23 बिट्स के मानस में काट देगा। भंडारण का मूल्य 0.100000001490116 है। इसी तरह, 0.2 भंडारण 0.200000002980232 है।

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

यह ML के लिए बहुत महत्वपूर्ण है, क्योंकि:

1. 像 `if loss < threshold`इस तरह के नुकसान तुलना गलत उत्तर दे सकता है
2. 累积许多小值 (数千步的渐进更新) सत्य से विचलित होगा
3. यदि उपयोग `==`फ्लोट्स, चेकसम और पुनरुत्पादकता परीक्षणों की तुलना करना असफल होगा

修复方法: कभी उपयोग न करें `==`तुलना करें फ्लोट्स`abs(a - b) < epsilon`या `math.isclose()`

### विनाशकारी रद्द

जब आप दो लगभग समान फ्लोटिंग प्वाइंट को कम करते हैं, तो एक दूसरे को प्रतिरोधी बनाते हैं, शेष उच्च स्थान पर गोल शोर में वृद्धि होती है।

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

इसका मतलब है कि एक बार घटाने पर 19% की सापेक्ष त्रुटि उत्पन्न होती है।

- उपयोग大平均值数据计算方差:当 E[x] 很大时计算 `E[x^2] - E[x]^2`
- तुलनात्मक रूप से दो समान लॉग-संभाव्यताओं के
- प्रयोग过小 epsilon  गणना अंत-विभेदा ग्रेडिएंट

修复方法:重排公式, avoid相减两个很大且几乎相等数――方差, वेल्फोर्ड एल्गोरिथम का उपयोग करना, या पहले डेटाबेस में---लॉग-संभाव्यताओं के लिए, हमेशा लॉग-स्पेस में काम करना।

### ओवरफ्लो और अंडरफ्लो

ओवरफ्लो 发生在结果过大,无法表示时――अंडरफ्लो 发生在结果过小时――比最小可表示正数还接近零)

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`函数是 ML में overflow  मुख्य स्रोत:

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

`log()`函数会碰到另一个方向的问题:

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

एमएल में,`exp()`वर्तमान में सॉफ्टमैक्स, सिग्मोइड तथा प्रोवाटेंसी गणना में`log()`क्रॉस-एंट्रोपी, लॉग-संभाव्यता और केएल विचलन में प्रकट हो रहा है।`log(exp(x))`组合就是雷区──

### लॉग-सम-एक्सप ट्रिक

直接计算 `log(sum(exp(x_i)))`                                                                                                                                                                                                                                                              `x_i` बहुत बड़ा,`exp(x_i)`मैं पानी से भर जाऊँगा.`x_i`बहुत ही नकारात्मक, प्रत्येक `exp(x_i)`शहर शून्य तक नीचे बहता है, और `log(0)``-inf`

यह चालः                                                                                                                                                                                                                                                              

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

क्यों यह प्रभावी हैः घटाने `max(x)`后,最大的指数是 `exp(0) = 1`                                                                                                                                                                                                                                                              `log(1) = 0` संभव नहीं है नीचे प्रवाह तक `-inf`

证明:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

`c = max(x)`, ओवरफ्लो को समाप्त कर दिया गया है.

यह चाल ML में हर जगह दिखाई देती हैः
- सॉफ्टमैक्स सामान्यीकरण
- क्रॉस-एंट्रोपी हानि 计算
- क्रम मॉडल 中的 लॉग-संभाव्यता 求和
- गौसीयन का मिश्रण
- भिन्नता का निष्कर्ष

### क्यों सॉफ्टमैक्स को मैक्स-सब्स्ट्रक्शन ट्रिक की आवश्यकता है

Softmax logits 转换为概率:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

 इस चाल के बिना, लॉग्स के लिए [100, 101, 102] होगा ओवरफ्लो का कारण बनता हैः

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

इस चाल का उपयोग करें, अधिकतम घटाएं x = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

概率 पूरी तरह से समान है 計算是安全的── यह अनुकूलन नहीं है, बल्कि सही आवश्यकता है──

### एनएएन एवं इन्फ: जांच एवं रोकथाम

`nan`(नहीं एक संख्या)`inf`(अनंत)                                                                                                                                                                                                                                                             `nan`                                                                                                                                                                                                                                                              `nan`, ताकि बाद में प्रत्येक आउटपुट में बदल जाए`nan` प्रशिक्षण एक कदम के भीतर मर जाएगा

`inf`如何出现:
- एक बड़ी संख्या में निष्पादन के लिए`exp()`
- शून्य से`1.0 / 0.0`
- संचय 中的 `float32`अतिप्रवाह

`nan`如何出现:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `sqrt()`
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `log()`
-  जो भी `nan`का अंकगणित

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

预防策略:

1. क्लैंप `exp()`का इनपुटः`exp(clamp(x, -80, 80))`
2. 给 संज्ञाकार 加 epsilon:`x / (y + 1e-8)`
3. `log()`内加 epsilon:`log(x + 1e-8)`
4. प्रयोग稳定实现(लॉग-समा-एक्सप स्थिर सॉफ्टमैक्स)
5. उपयोग ग्रेडिएंट क्लिपिंग  वजन को रोकने  विस्फोट
6. 调试时在每次前进通过 后检查 `nan`/`inf`

### संख्यात्मक ग्रेडिएंट जांच

विश्लेषणात्मक ग्रेडिएंट्स (बैकप्रॉग) से आ सकते हैं।

केन्द्रित अंतर 公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

यह O  h ^ 2 精度, आगे की तुलना में बेहतर अंतर `(f(x+h) - f(x)) / h`,后者只有 O  h) 

选择 h:太大则近似不准确──太小则 विनाशकारी रद्द会毁掉结果──`h = 1e-5`तक `1e-7`很常见──

检查方式: गणना विश्लेषणात्मक एवं संख्यात्मक ग्रेडिएंट के बीच सापेक्ष अंतर

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- relative_error < 1e-7:完美,ग्रेडिएंट 正确
- relative_error < 1e-5: स्वीकार्य, बहुत संभव सही
- relative_error > 1e-3: कुछ गलत है
- relative_error > 1:Gradient 完全错误

प्रत्येक बार जब नई परत या हानि फ़ंक्शन को लागू किया जाता है, तो हमें ग्रेडिएंट की जांच करनी चाहिए।`torch.autograd.gradcheck()`

### मिश्रित सटीकता प्रशिक्षण

आधुनिक जीपीयू में विशेष हार्डवेयर हैं, जो फ्लोट 32 快 2-8 倍地计算 फ्लोट 16 मैट्रिक्स गुणनों से तुलना कर सकते हैं।

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

纯浮16 训练问题: gradients 往往非常小(1e-8 或更小) ・浮16 会将低于约6e-8 के किसी भी मूल्य के नीचे प्रवाह 为零。 आपका मॉडल सीखना बंद कर देगा, क्योंकि सभी gradient updates 都是零──

修复方法是 हानि स्केलिंग:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

गतिशील हानि स्केलिंग 会自动调整尺度因子──从一个大值(65536) से शुरू──如果梯度过溢 成 `inf`, हम आधा कर देंगे. अगर N 步 नहीं बढ़ेगा, तो हम इसे दो गुना करेंगे.

### Bfloat16 vs Float16: क्यों Bfloat16 में प्रशिक्षण में जीत

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

फ्लोट16 精度更高(10 mantissa bits vs 7),但范围有限(最大约65,504) ・bfloat16 精度较低,但范围与float32 相同(最大约3.4e38) 👇

对于训练 तंत्रिका नेटवर्क:

- सक्रियण तथा लॉजिट  प्रशिक्षण के दौरान अक्सर 65,504 से अधिक हो जाते हैं।
- float16 ढ़ेर नुकसान के पैमाने की आवश्यकता होती है, लेकिन bfloat16 आमतौर पर आवश्यक नहीं है, क्योंकि इसकी सीमा ग्रेडिएंट ग्रेडिएंट स्पेक्ट्रम को कवर करती है।
- bfloat16 float32 का सरल कटौती हैः खो खो दिया mantissa के निचले 16 位── परिवर्तन बहुत सरल है, और exponent 无损──

फ्लोट16 अधिक उपयुक्त है निष्कर्ष, इस समय संख्यात्मक मूल्य है界且精度更重要── bfloat16 अधिक उपयुक्त है प्रशिक्षण, इस समय दायरा अधिक महत्वपूर्ण── यही कारण है कि टीपीयू और आधुनिक एनवीआईडीआईए जीपीयू(ए100、एच100) मूल रूप से समर्थन bfloat16──

### ग्रेडिएंट क्लिपिंग

विस्फोटक ग्रेडिएंट  ग्रेडिएंट में होता है  कई स्तरों के माध्यम से                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

两种剪辑:

**Clip by value：**独立 क्लैंप प्रत्येक ग्रेडिएंट तत्व

```
grad = clamp(grad, -max_val, max_val)
```

简单,但可能改变渐变向量的方向──

**Clip by norm：**缩放整个渐变向,使其规范不超过值──

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

                                                                                                                                                                                                                                                              `torch.nn.utils.clip_grad_norm_()`जो करना है वो करना है।

典型值:ट्रांसफॉर्मर 使用 `max_norm=1.0`,RL प्रयोग `max_norm=0.5`, अधिक सरल नेटवर्क का उपयोग `max_norm=5.0`

ग्रेडिएंट क्लिपिंग नहीं हैक है। यह एक सुरक्षा तंत्र है। इसके बिना, एक असामान्य बैच पर्याप्त ग्रेडिएंट उत्पन्न कर सकता है।

### सामान्यीकरण परतें  के रूप में संख्यात्मक मूल्य स्थिरकर्ता

बैच नॉर्मलाइजेशन, लेयर नॉर्मलाइजेशन और आरएमएस नॉर्मलाइजेशन आमतौर पर प्रशिक्षण प्राप्त करने में मदद करने के लिए पेश किए जाते हैं।

 बिना सामान्यीकरण, सक्रियण  में वृद्धि या घटती दरें होती हैंः

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

सामान्यीकरण प्रत्येक स्तर में पुनः निवास और पुनः संकुचित सक्रियण में होगाः

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`(आमतौर पर 1e-5) सभी सक्रियणों में एक ही समय में शून्य से हटाने से रोकने के लिए होगा।`gamma`和 `beta`让网络 能恢复它需要的任何规模──

इससे पूरे नेटवर्क के मध्य मूल्य को अंक मूल्य सुरक्षा के दायरे में बनाए रखा जाएगा, जिससे आगे के पास के बीच के ओवरफ्लो को रोका जा सकेगा और पीछे के पास के बीच के ग्रेडिएंट विस्फोट को भी रोका जा सकेगा।

### 常见 ML 数值 बग

**Bug：Loss 在几个 epochs 后变成 NaN。**
原因: लॉग्स 变得太大,软max overflow 了──或学习率 太高,重量 发散了──
修复: उपयोग स्थिर softmax(max घटाने), कम सीखने की दर,加入 ग्रेडिएंट क्लिपिंग。

**Bug：Loss 卡在 log(num_classes)。**
原因: मॉडल आउटपुट लगभग समान संभावनाओं का अर्थ है  आमतौर पर ग्रेडिएंट गायब हो रहा है, या मॉडल पूरी तरह से नहीं सीख रहा है
修复: चेक डेटा लेबल 是否正确,校验 हानि फ़ंक्शन, चेक मृत रिलू

**Bug：Validation accuracy 比预期低 1-3%。**
原因:मिश्रित परिशुद्धता  कोई उचित हानि स्केलिंग नहीं है。 ग्रेडिएंट डाउनफ्लो 会把小 अद्यतन 置零。
修复: गतिशील हानि स्केलिंग सक्षम करें, या bfloat16 पर स्विच करें

**Bug：某些 layers 的 Gradient norms 是 0.0。**
原因: मृत ReLU न्यूरॉन्स ((所有输入为负), या फ्लोट16 डाउनफ्लो
修复: उपयोग लीकरीलू या जीईएलयू, उपयोग ग्रेडिएंट स्केलिंग, जांच वजन आरंभिकरण。

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因:गैर-निर्धारक तैरते बिंदुओं के संचय क्रम。 जीपीयू समानांतर घटावों में विभिन्न हार्डवेयर पर भिन्न क्रम में वृद्धि होती है, जबकि तैरते बिंदुओं का जोड़ नहीं पूरा होता है结合律。
修复: स्वीकार小差异(1e-6), या सेटअप `torch.use_deterministic_algorithms(True)`और गति हानि स्वीकार नहीं किया।

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
原因: कच्चे लॉग्स थेट प्रसारित किए जाते हैं `exp()`, अधिकतम घटाने की चाल का उपयोग नहीं किया गया है
修复: उपयोग `torch.nn.functional.log_softmax()`, यह अंदर लॉग-सumma-exp को लागू किया गया है

**Bug：从 float32 切换到 float16 后训练发散。**
कारणः फ्लोट 16 无法表示低于 6e-8 के ग्रेडिएंट magnitudes,也无法表示高于 65,504 के सक्रियणों。
修复: उपयोग带 हानि स्केलिंग का मिश्रित परिशुद्धता(AMP), या改用 bfloat16。


```figure
logsumexp-stability
```

##  इसे निर्माण

### 步骤 1: प्रदर्शन तैरने बिंदु 精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### 步骤 2: साफ़ साफ़ बनाम स्थिर सॉफ्टमैक्स को प्राप्त करना

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

### 步骤 3: स्थिर लॉग-सम-एक्सप को प्राप्त करना

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

### 步骤 4: स्थिर क्रॉस-एंट्रोपी प्राप्त करना

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

### 步骤 5:ग्रिडिएंट जांच

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

## इसका उपयोग करें

### मिश्रित परिशुद्धता 模拟

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

### ग्रिडिएंट क्लिपिंग

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

### NaN/Inf का पता लगाना

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

完整实现见 `code/numerical.py`, जिसमें सभी किनारे मामलों का प्रदर्शन किया गया है

## 交付 यह

本课会产出:
- `code/numerical.py`, स्थिर सॉफ्टमैक्स, लॉग-समुम-एक्सप, क्रॉस-एंट्रोपी, ग्रेडिएंट जांच और मिश्रित परिशुद्धता सिमुलेशन शामिल है
- `outputs/prompt-numerical-debugger.md`, नैदानिक प्रशिक्षण में NaN/Inf और संख्यात्मक प्रश्न

इन स्थिरताओं का पुनः निर्माण चरण 3 में होगा प्रशिक्षण चक्र के निर्माण में, तथा चरण 4 में ध्यान तंत्र के कार्यान्वयन में।

## अभ्यास

1. **Catastrophic cancellation。**प्रयोग float32 中的天真公式 `E[x^2] - E[x]^2`計算 [1000000.0, 1000001.0, 1000002.0] का फ़ायदा-差── उसके बाद वेल्फोर्ड के ऑनलाइन एल्गोरिथ्म का उपयोग करें 計算──将误差与真实方差──0.6667)

2. **Precision hunt。**पायथन में न्यूनतम सही float32 मूल्य खोजें `x`, इसे बनाने के लिए`1.0 + x == 1.0` यह मशीन इप्सिलन है  यह परीक्षण करें कि यह फिट बैठता है `numpy.finfo(numpy.float32).eps`

3. **Log-sum-exp edge cases。**प्रयोग निम्नलिखित में प्रवेश परीक्षण अपने `logsumexp_stable`函数:((a) 所有值相等,(b) 一个值远大于其他值,(c) 所有值都非常负负(-1000) ――验证它在天真版本 失败的地方给出正确结果──

4. **Gradient checking a Neural Network layer。**् एक एकल-लाइन स्तरीय को प्राप्त करना `y = Wx + b` और उसके विश्लेषणात्मक पीछे की ओर पारित करना──使用 `numerical_gradient`校验 3x2 वजन मैट्रिक्स की सहीियत

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

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 权威参考资料, सामग्री गहन लेकिन पूर्ण
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA  प्रस्तावित float16  प्रशिक्षण मध्य हानि स्केलिंग का निबंध
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch में मिश्रित परिशुद्धता का अभ्यास मार्गदर्शन
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)-- गूगल क्यों TPUs के लिए इस प्रारूप का चयन
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)--  घटाएँ फ्लोटिंग प्वाइंट्स के योग 中 गोल त्रुटि का एल्गोरिथ्म
