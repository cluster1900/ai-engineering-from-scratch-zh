# طرق أخذ العينات

> العينات هي طريقة للاكتشاف من الممكنة

**Type:** Build
**Language:**بايثون
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## 學习目标
- استعمال أرقام عشوائية متساوية فقط، من صفر تحقيق الانسداد CDF ‧رفض و أهمية العينات
- نموذج اللغة الـ Token 生成 تشكيل درجة الحرارة 、top-k 和 top-p (النواة)
- شرح خدعة إعادة التأثير ، وكذلك لماذا يمكن أن يجعل العينات في VAEs  دعم التنشر الخلفي
- 运行 ميتروبوليس-هاستينغز MCMC, 从未归归一化的目标分布中采样

## 问题
نموذج لغة  إنجاز معالجة طلبك، سوف تنتج متجه يحتوي على 50،000 لوجيتس  كل رمز في المفردات  واحد  الآن يجب أن تختار واحد  كيف تختار؟

إذا كان دائماً يختار الاحتمال أعلى الوهم، فإن كل رد فعل سيكون تماماً نفسها.

العينات لا تستخدم فقط لتوليد المقالة. تعزيز التعلم من خلال مسارات العينات لتقييم تراجعات السياسة. VAEs من خلال العينات من خلال التعلم إلى التوزيع.

كل نظام إصدار الذكاء الاصطناعي هو نظام عينة. استراتيجية عينة تحدد الناتج جودة، تنوع، و قابلية التحكم.

## 概念
### لماذا مهمة الاختبار

أخذ العينات في الذكاء الاصطناعي والتعلم الآلي يتحمل أربعة أساسيات:

**Generation.**نموذجات اللغة، نموذجات الانتشار و GANs تمت من خلال العينات  توليد النتائج.

**Training.**استوديوستيكا دراديفينت هبوط معينة عينة المجموعات الصغيرة. تدريب معينة يجب أن توقف استخدام الخلايا العصبية. زيادة البيانات عينة عينة التحولات العشوائية.

**Estimation.**لا يوجد الكثير من الكميات في ML حل مغلق على شكل. المتوقع على توزيع البيانات الخسارة. وظيفة القسم القائمة على الطاقة. الاستنتاج البايسي.

**Exploration.**خوارزميات MCMC في استنتاج بايزيوني 中探索 posterior distributions。 استراتيجيات تطورية 会 sampling parameter perturbations。 تمسسون sampling 在 بانديتس 中平衡 استكشاف ومستغلال。

التحدي الأساسي هو: يمكنك فقط أن تأخذ عينات مباشرة من التوزيع البسيط (الموحد) ، والمعايير الطبيعية.

### عينة عشوائية موحدة

كل طريقة العينات تمتد من هنا. مولد عدد عشوائي موحد يتمثل في [0, 1) تتمثل في قيمة عددية، حيث أن أي من أشكال العينات لديها احتمالات مماثلة.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

يجب أن يكون من n 个 عنصر من مجموعة الانفصال عينة موحدة، تولد U 并返回 floor(n * U) ―― يجب أن يكون من连续区间 [a, b] في العينة، حساب a + (b - a) * U。

关键洞察: عدد عشوائي موحد واحد يحتوي على إنتاج عينة من التوزيعات المتعددة.

### طريقة CDF العكسية (تقاط عينات من التحول العكسي)

وظيفة التوزيع التراكمية (CDF) 会把数值映射到概率:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

CDF العكسية 会把概率映射回数值──如果 U ~ موحدة(0, 1), ثم X = F_inverse(U) 服从目标分布──

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

عندما يمكنك كتابة F_inverse 时، هذه الطريقة效果完美── بالنسبة للتوزيع الطبيعي، لا يوجد CDF المعاكس المغلقة، لذلك نستخدم طريقة أخرى ((Box-Muller، أو التقريب الرقمي)──

**离散版本：**بالنسبة للتوزيعات المفصلة، قم بتكوين CDF لتكون جمع جمعي، وتوليد U، ثم العثور على المجموع التراكمي 超过 U من المؤشر الأول.`sample_categorical`طريقة العمل

### الرفض عن عينات

عندما لا يمكنك أن ترجع CDF، ولكن يمكن أن تقيم في حالة مختلفة من العدد المعتاد الهدف PDF، الرفض العينات أصبح ممكنة.

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

في المرحلة العالية، انخفض معدل قبول، حيث أن معدل قبول سيتم رفض معدل قبول، وهذا هو لعنة الامتثال.

**示例：从 truncated normal 中 sampling。**في النطاق المقصور 上 استخدام اقتراح موحد.

**示例：从 semicircle 中 sampling。**في مستطيل المحدود المقترح الموحد. إذا سقطت النقطة في نصف دائرة داخل، فإنها تقبل. هذا هو طريقة مونت كارلو الحساب ب.

### أهمية أخذ العينات

بعض الأحيان لا تحتاج إلى عينات من التوزيع الهدف p(x)  تحتاج إلى تقدير p(x)  توقعات، و لديك عينات من التوزيع الآخر q(x) 

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

هذا في تعزيز التعلم في مركز الحفاظ على السياسة الحاسمة. في PPO (تحسين السياسة القريبة) ، أنت في سياسة قديمة.

يعتمد اختلاف مقياس الأهمية على مدى شباهة q و p. إذا كان q مختلفا جدا عن p، فإن عدد قليل من العينات سوف تحصل على أوزان كبيرة ويمتلك تقديرات.

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### تقدير مونتي كارلو

تقدير مونت كارلو 通過 على عينات عشوائية 求平均来近似积分──قانون الأعداد الكبيرة 保证其收──

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

عدد الخلل لا علاقة له بالقياس‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

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

### سلسلة ماركوف مونتي كارلو (MCMC):متروبوليس-هستنغز

MCMC 构建一个马尔科夫链,使其静止分布是目标分布 p(x) ――经过足够多步后,chain 中的样本就像) 是来自p(x) 的样本──

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

بالنسبة للمقترحات التناظرية ((((x'x)) = q(x'x') ، فإن النسبة سوف تتبقى إلى p(x') / p(x)── هذا هو خوارزمية "المدن" الأصلية──

**为什么有效。**قاعدة القبول ضمان التوازن التفصيلي: في x وليس يتحرك إلى x' احتمالية، يساوي في x' وليس يتحرك إلى x' احتمالية.

**实践注意事项：**
- الحرق: في سلسلة  التوصل إلى التوازن  قبل التخلص من العينات المبكرة
- التخفيف: لكل عينة حافظ عليها واحدة، لتقليل التواصل الذاتي
- نطاق المقترحات:太小会让链 移动缓慢(قبول مرتفع، استكشاف بطيء);太大会让大多数 المقترحات 被拒绝(قبول منخفض، عالق في مكانها)
- 高维中 أفضل معدل قبول اقتراح غوسيان  0.234

### عينة غيبز

عينة غيبز هي نوع خاص من MCMC لتوزيعات المتغيرات متعددة. إنها لا تقدم تحركًا مرة واحدة في جميع الدرجات ، بل تطور متغيرًا في كل مرة من التوزيع المشروط.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

عينة غيبز تطلب أن تكون قادرة على أخذ العينات من كل توزيع مشروط
- شبكات بايزية: الشروط من هيكل الرسم البياني
- خليط غوسيان: الشروط هو غوسيان
- نموذجات التجاوز: كل دورة مشروطة فقط يعتمد على جيرانها

معدل قبول 总是 1 ((كل اقتراح تم قبوله) ، لأن من العينات المشروطة دقيقة سوف تلبي توازن مفصل تلقائيا ً

**局限。**عندما تتعلق المتغيرات بالارتفاع، فإن خليط عينة جيبس بطيء جداً، لأن تحديث متغير واحد لا يمكن القيام به في التحركات المتحركة الكبيرة في التوزيع.

### عينة درجة الحرارة (للمس)

نموذجات اللغة 会为词典 中每个代号 输出 Logits z_1, ..., z_V──Softmax 会把它们转换成概率──温度 会在软max 前重新缩放 Logits:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**مع T < 1 خارج المناسبات سوف تكبير الفرق بين المناسبات. إذا z_1 = 2 و z_2 = 1, مع T = 0.5 خارج بعد الحصول على z_1/T = 4 و z_2/T = 2, جعل الفرق يتغير كبير.

**实践中：**
- T = 0.0:تشفير طموح، أفضل تناسب الفحوصات نوع Q&A
- T = 0.3-0.7: قليلاً مبتكر، مناسبة لتوليد الرمز
- T = 0.7-1.0: توازن,适合一般对话
- T = 1.0-1.5: الكتابة الإبداعية
- ت > 1.5:越来越随机، عادة ما يكون مفيدًا قليلاً

درجة الحرارة لا تغير أي رمز ممكنة. تغير تخصيصه لكل رمز.

### عينة من أعلى

سيتم تعيين مجموعة المرشحين لتحديد حدة لحد أقصى احتمال لـ k 个 Token ، ثم إعادة التأليف ، ومع ذلك ، من خلال عينة المجموعة المحدودة.

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

المشكلة هي: مهما كان كيفية التوزيع، ك كان ثابتة. عندما يكون نموذج لديه 95% من احتمالات) ، ك = 40  سيظل يسمح 39 ٪ بديلة.

### عينة من أعلى (النواة)

العينات العليا p الحجم الكبير. انها لا تحتفظ بكمية ثابتة من الوهم، ولكن تحتفظ على احتمالات التراكمية تتجاوز p من الحد الأدنى من الوهم.

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

عندما يكون النموذج واضحاً، فإن أخذ العينات النووية سوف يحافظ على عدد قليل من الرموز ((ربما 2-3) .

**常见组合：**
- درجة الحرارة 0.7 + أعلى-p 0.9: إعداد عام جيد
- درجة الحرارة 0.0 (طموح):最适合确定性任务
- درجة الحرارة 1.0 + أعلى-ك 50:Fan et al. (2018)

يمكن تطبيق top-k 和 top-p

### خدعة إعادة التأهيل (مع استخدام الـ VAEs)

طريقة تعلم المرموزات الذاتية المتغيرة (VAEs) هي: وضع المدخلات 编码 into a distribution in latent space، من هذه التوزيعات أخذ العينات، ثم وضع العينات 解码回来―― المشكلة هي: لا يمكنك عبور عملية أخذ العينات  إجراء التنفيذ الاحتياطي 

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

خدعة إعادة التقييم سوف تفرق بين العشوائية والعشوائية:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

هذا هو السبب وراء فعالية، هو لأن N  mu، sigma^2) مع mu + sigma * N  0, 1) 具有相同分布──关键洞察是:把随机性移动到一个无参数源 epsilon) ، ثم把表示样本为参数可微转化──

**在 VAE training loop 中：**
1. رمز لكل مدخل 输出 mu 和 log(sigma^2)
2. عينة إيبسيلون ~ N(0, 1)
3. 计算 z = mu + sigma * epsilon
4. إعادة تشكيل إدخال
5. 穿过步骤 4、3、2、1  إجراء الترويج الخلفي ((可行، لأن الخطوة 3 هي可微的)

بدون خدعة إعادة التقييم، لا يمكن استخدام القياسات الترويجية التدريبية.

### Gumbel-Softmax ((可微的 عينات فصلية)

خدعة إعادة التقييم  تطبق على التوزيع المتواصل  غوسيان)  بالنسبة للتوزيعات الفئوية المتفرقة، نحتاج إلى طريقة أخرى‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

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

غومبل-سوفتماكس سوف تنتج عينة منفصلة من سلسلة التسهيل 🏼输出是 احتمالية المتجهة 软 one-hot) ، وليس صعبة one-hot。Gradients 会穿过软max 流动。 في الممر المباشر للتدريب، يمكنك استخدام "مباشر عبر" تقدير:ممر إلى الأمام استخدام argmax صعب، ولكن المرور إلى الوراء استخدام الممرات الرقيقة غومبل-سوفتماكس。

**应用：**
- المتغيرات الخفية المفصلة بين VAEs
- البحث في الهندسة المعمارية العصبية (اختيار عمليات الانفصال)
- آليات الاهتمام الصلبة
- 带 منفصلة الإجراءات لتعزيز التعلم

### الاختيار الطبقي

標準 مونت كارلو العينات قد تكون بسبب الاختلافات في مساحة العينات.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

مقارنة مع المعايير مونت كارلو، فإن الفرق بين العينات المجهزة للطرازات هو دائما أقل أو أقل:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- التكامل الرقمي ((قريبا من مونتي كارلو)
- تقسيم بيانات التدريب ((ضمان كل طائرة وسط توازن الفئة)
- 带 stratification                                                                                                                                                                                                                                                             
- نيرف (حقول الإشعاع العصبي) بجانب أشعة الكاميرا استخدام العينات الطبقة

### الاتصال مع نماذج التوزيع

نموذجات الانتشار 通過 عملية العينات 生成图像── العملية الأمامية 会在 T 步中向图像添加高斯的噪音,直到它变成纯噪音── العملية العكسية 学习指代,逐步恢复原始图像──

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

الاتصال مع هذا المنهج:
- كل خطوة إخبارية تم استخدام خدعة إعادة التقييم
- جدول الضوضاء {الف_ت}  التحكم في طريقة حدوث حدوث درجة حرارة
- تدريب استخدام تقدير مونت كارلو 来近似 ELBO (دليل الحد السفلي)
- نموذج الانتشار في وسط العينات الأجدادية هي سلسلة ماركوف ((كل خطوة تعتمد فقط على الحالة الحالية)

عملية إنتاج الصور بأكملها هي أخذ العينات التكرارية: بدءاً من الضوضاء، في كل خطوة، بناءً على نموذج التخفيض المتعلم، عينة من الضوضاء أصغر قليلاً.


```figure
monte-carlo-pi
```

## بناءها
### الخطوة 1: أخذ عينات CDF موحدة وعكسية

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10,000 个指数样本并验证平均值为1/lambda。

### الخطوة الثانية: أخذ العينات

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

استخدام الرفض العينات من التوزيع الطبيعي المقطوع 中抽样──通过对样品 绘制 histogram 来验证形状──

### الخطوة الثالثة: أخذ العينات من الأهمية

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

استخدام اقتراح موحد  تقدير التوزيع الطبيعي 下的 E[X^2]。与已知答案(mu^2 + sigma^2)比较。

### 步骤 4: تقدير مونت كارلو ل pi

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

### الخطوة 5: ميتروبوليس-هستنغز MCMC

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

من التوزيع الثنائي الموديل (((خليط من غوسيان) في أخذ العينات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### الخطوة 6: أخذ عينات غيبز

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

### الخطوة 7: أخذ العينات من درجة الحرارة

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

展示 如何改变一组 علامات الوصول إلى الموقع

### 步骤 8: أخذ العينات من الأعلى و الأعلى

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

### 步骤 9: خدعة إعادة التأهيل

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

يمكن أن يمر المعدلات عبر العينة المعدلة بشكل مباشر، ولكن لا يمكن أن يمر عبر العينة المباشرة.

### الخطوة 10: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

ظهور انخفاض درجة الحرارة  كيف جعل الخروج يقترب من متجه واحد ساخن 

التنفيذ الكامل وكل التصورات موجودة`code/sampling.py`في الوسط

## استخدمها
استخدام NumPy و SciPy 时,إنتاج 版本如下:

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

 للمركبات المختلفة المختلفة على نطاق واسع، استخدام المكتبات الخاصة:
- PyMC: استخدام NUTS (HMC تكييفي)
- المجموعة: عينة MCMC
- NumPyro/JAX: MCMC المتسارع من GPU

لقد قمت ببناء هذه الطرق من الصفر... الآن تعرف هذه المكتبات التي تدعو إلى العمل

## التدريب
1. لتوزيع شاذ 实现逆 CDF sampling──CDF هو F(x) = 0.5 + arctan(x) / pi── توليد 10,000 个样本,并把 histogram 与真实 PDF 画在一起──注意重尾(远离中心的极端值)──

2. استخدام الرفض العينات، من خلال الموحدة ((0, 1) اقتراح من بيتا ((2, 5) التوزيع 生成 عينات。把 المقبولة العينات مع الفحايية بيتا PDF 画在一起。 معدل قبول النظرية هو كم؟

3. استخدام مونت كارلو، باستخدام 1,000、10,000 和 100,000 个样本 估计 sin(x) من 0 إلى pi 的积分──比较每个级别的误差──验证误差按 O(1/sqrt(N)) 缩放──

4. 实现 Metropolis-Hastings, من توزيع ثنائي الأبعاد في أخذ العينات, من بينها p(x, y) متناسبة مع exp(-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2)。 رسم العينات 和 السلسلة المسار‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

5. 构建一个完整的文本生成演示:给定一个包含10 个词及logits的词汇,使用 (أ) طموح、(ب) درجة حرارة=0.7、(ج) أعلى-k=3、((د) أعلى-p=0.9 生成长度为 20 Token 的序列──比较 5 次运行中输出多样性──

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
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)- حول التدريس التفصيلي على أساس MCMC
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- 原始 غومبل-Softmax 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- أخذ العينات من النواة (أعلى-ص)
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍 خدعة إعادة التقييم
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- DDPM سوف يربط العينات مع إنتاج الصور
