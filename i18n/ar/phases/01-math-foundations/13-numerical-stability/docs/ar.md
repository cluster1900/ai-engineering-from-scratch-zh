# عدد القيمة استقرار

> نقطة العبور هي مجرد إختراق. سوف تلمسك أثناء التدريب.

**Type:** Build
**Language:**بايثون
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## 學习目标

- استخدام حيلة الحد الأقصى من الخفض  تحقيق قيمة عدد ثابتة softmax و log-sum-exp
- 识别浮点 计算中的溢出、低流和灾难性取消
- استخدام الاختلافات المحدودة المركزية سوف تحليل التدرج مع التدرج الرقمية
-  شرح لماذا تدريب  bfloat16 优于 float16 ، وكذلك تنقيد الخسائر  كيفية منع تدفق التدفق

## 问题

تم تدريب نموذجك لمدة 3 ساعات ثم فقدتها أصبحت ن ن...`inf`✿ إلى # 9,002 步, كل درجة مدينة ✿`nan`، التدريب قد مات

أو: تمت تدريب نموذجك ، ولكن الدقة أقل من 2% من ادعاءات المقالة. لقد تحققت من كل شيء.

أو: أنت من الصفر تحقق خسارة الانتروبيا المتقاطعة. انها في اللوجات الصغيرة.`inf`✿غالبية التدفقات المُنحرفة ✿`exp(100)`كل إطار ML يستخدم خدعة خطين لتعامل هذه المشكلة

الثبات العددي ليس مشكلة نظرية. إنه يقرر إذا كان عملية التدريب ناجحة، أم أنها فشلت.

## 概念

### IEEE 754: كيفية تخزين الحسابات

计算机 مطابق IEEE 754 标准将实数存储为浮点值 ∼一个浮点 有三部分:sign bit、元和 mantissa(significand) ・・・

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

mantissa decide precisity (((有多少有效数字) ――المتعامل يقرر نطاق ((عدد واحد يمكن أن يكون أكثر أو أكثر من صغير) 』

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

يُعطيكِ 7 نقاط تقريباً من الدقة. وهذا يعني أنه يمكن أن يُميز بين 1.0000001 و 1.0000002، ولكن لا يمكن أن يُميز بين 1.00000001 و 1.00000002. بعد ذلك، كل شيء هو ضجيج مستديرة.

يقدم لك فلوات 16 حوالي 3 نقاط دقة. يُمكن أن يعبر عن أكبر عدد من 65,504 نقطة. بالنسبة إلى ML، فإن هذا النطاق يُعد مُقلقًا، لأن المنطقات والجريديات والتنشيطات غالباً ما تتجاوز هذه القيمة.

bfloat16 هو إجابة جوجل على السؤال على نطاق float16 ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### لماذا 0.1 + 0.2 ! = 0.3

عدد 0.1 无法在二进制浮点中精确表示──在基础 2中,它是一个循环小数:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

سيقسم Float32 إلى 23 بت من القشرة. قيمة الاحتفاظ هي 0.100000001490116 .

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

هذا مهم جداً بالنسبة لـ ML، لأن:

1. 像 `if loss < threshold`مثل هذه الخسارة المقارنة قد تعطى إجابة خاطئة
2. 累积许多小值(数千步的渐进更新) سوف تتحرك عن الحقيقة و
3. إذا كان ذلك`==`مقارنة اختبارات العائمة والتحقق والإعادة التأهيل سوف تفشل

修复方法: لا تستخدم أبداً `==`مقارنة مع العائدات.`abs(a - b) < epsilon`أو`math.isclose()`.

### إلغاء كارثي

عندما تقلل الصف عن نقطة عائمة متوازنة تقريبا في عدد من الأوقات، فإن الرقمية الفعالة ستعاقب بعضها البعض، والباقي يتم رفعها إلى ضجيج التجويب عالية المرتبة.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

هذا يعني أنّه في حالة تخفيض واحد، فإنّها تنتج خطأ نسبيّ بنسبة 19%.

- استخدام 很大时计算 `E[x^2] - E[x]^2`
- مقارنة مع احتمالات التسجيل
- استخدام过小 epsilon  حساب تراجع الفرق المحدودة

修复方法:重排公式,避免相减两个很大且几乎相等的数量──对于方差,使用威尔福德算法,或先对数据居中──对于日志-احتماليات,始终在日志-空间中工作──

### التدفقات العالية و التدفقات السفلية

التدفقات الزائدة  تحدث في النتائج كبيرة جدا، لا يمكن أن تعبر عن ذلك عندما.

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`函数是 ML 中溢出  المصدره الرئيسيه:

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

في المرحلة الأولى`exp()`ظهرت الآن في الحسابات المرجعية`log()`في ظل الاندروبيات المتقاطعة والاحتمالات المرجحة و الاختلافات بين الكليات`log(exp(x))`组合就是雷区──

### خدعة التسجيلات

直接计算 `log(sum(exp(x_i)))`في العدد من الخطر`x_i`عظيم جداً`exp(x_i)`سأفيض كل شيء`x_i`كل شخص كان سلبياً جداً`exp(x_i)`مدينة تدفق إلى الصفر`log(0)`نعم`-inf`.

هذه الخدعة: في طلب المعبر  قبل أولاً خفض القيمة القصوى

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

لماذا هو فعال: خفض`max(x)`بعد، أكبر معبر هو`exp(0) = 1` لا يمكن أن يحدث تجاوزات  لا يقل عن واحد من الطلبات و الاختيارات هو 1 ، لذلك مجموعات و الاختيارات على الأقل هي 1`log(1) = 0`لا يمكن أن تدفق إلى`-inf`.

دليل:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

جعل`c = max(x)`،الانتشار تم إزالة

هذه الحيلة في كل مكان
- التطبيع المضمن
- الخسارة المتقاطعة للاندروبي 计算
- نماذج تسلسل 中的 求和
- خليط من غوسيان
- استنتاجات التباين

### لماذا Softmax  بحاجة إلى محاولة Max-سحب

سوف سوف سوف سوف تسجل 转换为概率:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

لا يوجد خدعة، التخفيف سيؤدي إلى الإفراط

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

استخدم هذه الخدعة، خفض ماكسيما ((x) = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

الاحتمالات هي نفسها تماما. الحساب آمن.

### NaN 和 Inf: الاختبار والوقاية

`nan`(ليس عددا) و `inf`(اللامتناهي) سوف مثل الفيروس مثل في حسابات الوسائل التنشر.`nan`سأجعلك تُثقل`nan`، حتى يتحول كل تصدير لاحقاً`nan`التدريب سوف يموت في خطوة واحدة

`inf`كيفية ظهورها:
- لعدد كبير من الأساسيات`exp()`
- من الصفر:`1.0 / 0.0`
- التراكمات 中的 `float32`التدفق

`nan`كيفية ظهورها:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- لـ " نسبة إنجاز`sqrt()`
- لـ " نسبة إنجاز`log()`
- أي شيء يتعلق`nan`أرقامية

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

策略 الوقاية:

1. - أغلقت`exp()`的输入:`exp(clamp(x, -80, 80))`
2. 给分号加 epsilon:`x / (y + 1e-8)`
3. في`log()`إضافة إكسيلون:`log(x + 1e-8)`
4. استخدام ثابت تحقيق ((سجل-جمعة-exp、ثابتة softmax)
5. استخدام القطع الدرجية  منع الوزن  انفجار
6. 调试时在每次前进通过 后检查 `nan`-أجل`inf`

### التحقق من الدرجات العددية

التدرج التحليلي ((من التدفق الخلفي) قد يكون هناك خطأ.

الفرق المركزية 公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

هذا هو O  h^2) 精度, أفضل من الفرق إلى الأمام `(f(x+h) - f(x)) / h`, وآخر فقط O  ه

选择 h:太大则近似不准确──太小则 فسخ كارثية 会毁掉结果──`h = 1e-5`إلى`1e-7`很常见──

طريقة الاختبار: الفرق النسبي بين التراجع التحليلي والرقمي

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- خطأ نسبي < 1e-7:完美,Gradient 正确
- خطأ نسبي < 1e-5: مقبول، جدا قد يكون صحيح
- 0_error = 1e-3: هناك شيء خاطئ
- relative_error > 1:Gradient 完全错误

كلما تحقق طبقة جديدة أو وظيفة الخسارة، يجب أن تحقق التدرجات.`torch.autograd.gradcheck()`.

### تدريبات دقيقة مختلطة

معظم أجهزة التشغيل الجرافيكية الحديثة لديها أجهزة خاصة (تنسور كورز) ، يمكن مقارنة مع المياه32 快 2-8 倍地计算 float16 مضاعفات المصفوفة。 التدريب الدقيق المختلط يستفيد من هذا النقطة:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

純浮16 訓練問題: 往往非常小(1e-8 或更小) ―― Float16 会把低于约 6e-8 أي قيمة من التدفق أسفل 为零。

修复方法是 تخسير النطاق:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

تحديد النطاقات الديناميكية للخسائر 会自动调整尺度因素──从一个大值(65536) بدأ──如果梯度过溢 成 `inf`،就减半. إذا لم يكن هناك إفراط،就加倍.

### بفلوت16 مقابل بفلوت16: لماذا بفلوت16 فى التدريب

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

تحليق16 精度更高(10 mantissa bits vs 7), ولكن المدى محدود(最大约65,504)。bfloat16 精度较低,但范围与 float32 相同(最大约3.4e38)。

对于训练 عصبية الشبكة:

- التشغيلات و التسجيلات في أعلى مستويات التدريب  خلال فترة التدريب تزيد كثيراً عن 65504 ∙ طائرات 16
- float16  بحاجة إلى تخفيض النطاق، ولكن bfloat16 عادة لا تحتاج، لأن نطاقها يغطي طيف الكبيرة الدرجة
- bfloat16 هو قصف بسيط لـ float32: فقدان mantissa من 16 位.

فلوات16 更适合推断,此时数值有界且精度更重要──bfloat16 更适合训练,此时范围更重要──这就是TPUs 和现代NVIDIA GPUs(A100、H100) 原生支持bfloat16的原因──

### التقطيع المتدريج

التنقلات المتفجرة تحدث في التنقلات عبر العديد من المستويات 

两种剪辑:

**Clip by value：**-مصممة مستقلة لكل عنصر درجي

```
grad = clamp(grad, -max_val, max_val)
```

简单,但可能改变渐变向量的方向──

**Clip by norm：**缩放整个 المتجهة الدرجة، بحيث يكون طبيعته لا تتجاوز 值.

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

حافظ على اتجاه الدرجة`torch.nn.utils.clip_grad_norm_()`ما يجب القيام به هو اختيار المعيار

典型值:تحولات 使用 `max_norm=1.0`,RL استخدام `max_norm=0.5`, أكثر بساطة من الشبكات استخدام `max_norm=5.0`.

قطع الدرجات ليس اختراقاً. إنه آلية أمن.

### الطبقات التطبيعية  كمثبتة قيمة

عادة ما يتم تعريفها لمساعدة تدريب وصول المُتَقَيِّدين.

 بدون تطبيع، التفعيلات ستعمل على زيادة أو تقليل درجة المؤشر

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

التطبيع سوف يكون في كل طبقة من التنشيطات:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`(عادةً على 1e-5) سوف تكون في جميع التفعيلات في نفس الوقت لمنع التخلص من صفر.`gamma`和 `beta`让网络 能恢复它需要任何规模──

هذا سيسمح للشبكة بأكملها بقيمة وسطها في حدود أمان القيمة العددية، ويحول دون إفراط الممر الأمامي، ويحول دون انفجار التدريجي في الممر الخلفي.

### 常见 ML عدد القيمة حشرة

**Bug：Loss 在几个 epochs 后变成 NaN。**
السبب: التسجيلات أصبحت كبيرة جداً، ويتجاوز الدرجة الرفيعة
修复: استخدام مستقر softmax ((حد أقصى) ، انخفاض معدل التعلم،加入 Gradient clipping。

**Bug：Loss 卡在 log(num_classes)。**
السبب: النموذج ينبع نحو احتمالات متساوية. عادة ما يعني أن التدرج يختفي أو أن النموذج لا يتعلم تماما.
修复: فحص علامات البيانات نعم أم لا صحيحة، فحص وظيفة الخسارة، فحص الميتة الوصفات المتحركة.

**Bug：Validation accuracy 比预期低 1-3%。**
原因:مختلطة الدقة  بدون قياس مناسب للخسائر.
修复: تشغيل تحديد حجم الخسارة الديناميكية، أو تحويل إلى bfloat16。

**Bug：某些 layers 的 Gradient norms 是 0.0。**
السبب: الخلايا العصبية الميتة لـ (ريلو) ، أو تتدفق تحت التدفق
修复: استخدام LeakyReLU أو GELU, استخدام مقياس درجي, تحقق تشغيل الوزن

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因: غير تحديدية ترتيب تراكم نقطة عائمة.
修复: قبول小差异(1e-6) ، أو إعداد `torch.use_deterministic_algorithms(True)`و لا تقبل خسارة السرعة

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
السبب: المعلومات الخام تم إرسالها مباشرة`exp()`، لا تستخدم خدعة الحد الأقصى
修复: استخدام `torch.nn.functional.log_softmax()`، لقد تم تحقيق التفسيرات المادية

**Bug：从 float32 切换到 float16 后训练发散。**
原因:float16 无法表示低于 6e-8 的渐进大小,也无法表示高于 65,504 的激活.
修复: استخدام معدل الدقة المختلطة من قياس الخسارة ((AMP) ، أو改用 bfloat16。


```figure
logsumexp-stability
```

## بناءها

### الخطوة 1: عرض نقطة عائمة 精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### الخطوة 2: تحقيق البراغي مقابل الثابتة softmax

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

### الخطوة الثالثة: تحقيق سجل سجل المجموع

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

### الخطوة الرابعة: تحقيق استقرار الانتروبيا المتقاطعة

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

### الخطوة 5:تحقق من التدريج

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

## استخدمها

### دقة مختلطة 模拟

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

### التقطيع المتدريج

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

### الكشف عن NaN/Inf

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

完整实现见 `code/numerical.py`، من بينها عرضت جميع الحالات الحافة

## 交付 it

本课会产出:
- `code/numerical.py`، يحتوي على مستقرة softmax ✓ سجل الجملة-exp ✓ عبورية الانتروبيا ✓ التحقق من درجات و محاكاة الدقة المختلطة
- `outputs/prompt-numerical-debugger.md`, للمسألة النسبية/المعلومات والقيمة العددية في التدريب التشخيصي

هذه التطبيقات ستظهر مرة أخرى في المرحلة 3 في عملية بناء حلقة التدريب، وكذلك في المرحلة 4 في عملية تنفيذ آليات الاهتمام.

## التدريب

1. **Catastrophic cancellation。**استخدام فلوات32 中的 ساذجة الصيغة `E[x^2] - E[x]^2`計算 [1000000.0, 1000001.0, 1000002.0] 的方差──然后使用威尔福德的在线算法 计算──将误差与真实方差(0.6667) 比较──

2. **Precision hunt。**في Python إيجاد أدنى قيمة صحيحة`x`, جعل ذلك`1.0 + x == 1.0`هذا هو الآلة الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول إلى الوصول`numpy.finfo(numpy.float32).eps`.

3. **Log-sum-exp edge cases。**用以下输入测试你的 `logsumexp_stable`函数:(( (a) 所有值相等,( (b) 一个值远大于其他值,( (ج) 所有值都非常负) -1000) ――验证它在天真版本 失败的地方给出正确结果──

4. **Gradient checking a Neural Network layer。**تحقيق طبقة واحدة`y = Wx + b` وتحليلها للخلف  استخدام `numerical_gradient`校验 3x2 المصفوفة الوزن

5. **Loss scaling experiment。**模拟 float16 训练:创建范围在 [1e-9, 1e-3] 内的随机梯度,转换为 float16,并测量有多少比例变成零――然后应用损失规模(乘以 1024),转换为 float16,再扩展回,并再次测量零比例――

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

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 权威参考资料, محتويات كثيفة ولكن كاملة
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA  طرحت طائرة16  تدريب وسط تخفيضات مقياس
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch 中 مخلوط دقة
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)-- جوجل لماذا تبتو  اختيار هذا النموذج
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)--  تقلل من مجموعات نقاط العبور 中 إخطاء التجول
