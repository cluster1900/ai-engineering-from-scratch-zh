# تحويل فوريه

> كل إشارة هي تعليقات موجات الصناعي.

**Type:** Build
**Language:**بايثون
**Prerequisites:** Phase 1, Lessons 01-04, 19 (complex numbers)
**Time:** ~90 分钟

## 學习目标
- من التحقق من DFT،并用 $O(N \log N)$من كولي-توكي FFT 验证它
- فهم معايير التردد: من الإشارة إلى النطاق النطاق والمرحلة و الطيف الكهربائي
- تطبيق نظرية التخزين، من خلال مضاعفة FFT  تنفيذ التخزين
- سوف تتميز تدمير تردد فوريير مع ترانسفورمات التشفير الموضعي و CNN طبقات التحول

## 问题
段音频录音 هو سلسلة من القيم القياسية للضغط المتغيرة مع الوقت. الأسعار هي سلسلة من القيم القياسية حسب الترتيب السماوي. الصورة هي شبكة كثافة البيكسل في الفضاء.

ولكن العديد من الأنماط في مجال الزمن غير مرئية. هل هذه الإشارة الصوتية هي النغمة النقية أو التوت؟ هل يوجد دورة أسبوعية؟ هل هذه الصورة لها نسيج متكرر؟

تحويل فوريه سوف تحويل البيانات من مجال الزمن  إلى مجال الترددات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

هذا بالنسبة إلى ML  مهم جداً ، لأن التفكير في مجال التردد 隨處可见。 الشبكات العصبية التطورية  تنفيذ التحول ، بينما التحول في مجال التردد هو النتيجة。 تحويل التشفيرات الموضعية استخدام التفكك التردد ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬

## 概念
### تعريف DFT

- نعم$N$عينة$x[0], x[1], \ldots, x[N-1]$, تحويل فوريه متخفف$N$معايير التردد$X[0], X[1], \ldots, X[N-1]$:

```math
X[k] = \sum_{n=0}^{N-1} x[n] \, e^{-2\pi i k n/N} \qquad \text{其中 } k = 0, 1, \ldots, N-1
```

كل واحد$X[k]$إنها رقم معقد$\lvert X[k] \rvert$مع التردد$k$نسبة النمو المعدل$A$و هو في الواقع في الحلبة$k$الصور الحقيقية$\lvert X[k] \rvert = AN/2$، لذلك يجب أن تُفصل$N/2$才能读出 amplitude.$\angle X[k]$تعبر عن تعويضات مرحلة في التردد

关键洞见:$e^{-2\pi i k n/N}$هو واحد في التردد$k$旋转的phasor──DFT 计算是信号与 $N$个等间隔频率 中每一个的相关性.$k$على المحتويات الطاقة، والارتباط على حد كبير.

### معنى كل عدد

**$X[0]$: DC component。**هذا هو مجموع جميع العينات، مع متوسط النسبة 成比例── يعبر عن ثابتة الإشارة ((صفر التردد) المُعاقبة──

```math
X[0] = \sum_{n=0}^{N-1} x[n] \, e^0 = \text{全部 samples 之和}
```

**$X[k]$ for $1 \le k \le N/2$: positive frequencies。** $X[k]$表示每 $N$个 عينات 中 $k$تكرار الدورات$k$越大,تردد 越高(التذبذب 越快)

**$X[N/2]$: Nyquist frequency。**هذا هو$N$个样本 能表示的最高频率──超过 هذا التردد، فستظهر الاسم الأدنى،也就是 ارتفاع الترددات 伪装成低频──

**$X[k]$ for $N/2 < k < N$: negative frequencies。**بالنسبة للإشارات ذات القيمة الحقيقية$X[N-k] = \overline{X[k]}$الترددات السلبية هي مرآة للاتجاهات الإيجابية، وهذا هو السبب في وجود المعلومات المفيدة.$N/2 + 1$معايير 中。

### الـ DFT العكس

عكس DFT تجمع من معايير التردد 重建原始信号:

```math
x[n] = \frac{1}{N} \sum_{k=0}^{N-1} X[k] \, e^{2\pi i k n/N} \qquad \text{其中 } n = 0, 1, \ldots, N-1
```

هو الفرق الوحيد بين DFT إلى الأمام هو: العضو وسط رمز لل正(ليس منخفضة) ، و هناك واحد $1/N$عامل التطبيع

إن DFT العكسية هي إعادة بناء مثالية، ولا تفقد أي معلومات، يمكنك التحول من نطاق الزمن إلى نطاق التردد، والعودة مرة أخرى، دون أي خطأ.

### الـ (ف.إف.تي): جعل الأمر سريعاً

كما هو محدد في أعلاه$O(N^2)$:对 $N$معايير الناتج في كل واحد من بينهم، يجب أن نضعها على$N$عينة دخول 求和──当 $N$= 1 مليون 时، هذا هو$10^{12}$عمليات أخرى

تحويل فوريه سريع (FFT) 会以$O(N \log N)$计算同样结果──当 $N$= 1 مليون 时، هذا حوالي 20 مليون عملية، وليس مليون مرة.

خوارزمية كولي-توكي ((أسوأ شيوع في FFT) استخدام تقسيم والغزو:

1. سوف تفرق الإشارة إلى عينات متصفحة مساوية ومعينة متصفحة غير مساوية
2. 递归计算每一半的DFT──
3. استخدام "عوامل المزدوجة" $e^{-2\pi i k/N}$合并两个 DFT نصف حجمها

```math
\begin{aligned}
X[k] &= E[k] + e^{-2\pi i k/N} \, O[k] && \text{其中 } k = 0, \ldots, N/2 - 1 \\
X[k + N/2] &= E[k] - e^{-2\pi i k/N} \, O[k] && \text{其中 } k = 0, \ldots, N/2 - 1 \\[6pt]
\text{其中 } E &= \text{偶数索引 samples 的 DFT} \\
O &= \text{奇数索引 samples 的 DFT}
\end{aligned}
```

هذه التناظرة تعني أن كل طبقة من التنفيذ المتردد$O(N)$العمل، و هناك$\log_2(N)$層──總计:$O(N \log N)$.

```mermaid
graph TD
    subgraph "8-point FFT (Cooley-Tukey)"
        X["x[0..7]<br/>8 samples"] -->|"split even/odd"| E["Even: x[0,2,4,6]"]
        X -->|"split even/odd"| O["Odd: x[1,3,5,7]"]
        E -->|"4-pt FFT"| EK["E[0..3]"]
        O -->|"4-pt FFT"| OK["O[0..3]"]
        EK -->|"combine with twiddle factors"| XK["X[0..7]"]
        OK -->|"combine with twiddle factors"| XK
    end
    subgraph "Complexity"
        C1["DFT: O(N^2) = 64 multiplications"]
        C2["FFT: O(N log N) = 24 multiplications"]
    end
```

هذا النوع من المشكلة هو: إذا كان طول المشكلة هو عدد غريب، فستعود إلى العادة.`dft`لذا، من أجل السرعة، الإشارات عادة ما تكون صفر-باد إلى التالي 2 من 🏼`numpy.fft`FFT في المكتبة استخدام مخلوط الجذور الالجيومات يمكن معالجة أي طول، ولكن في الطول فقط يحتوي على عنصر الصغرى عندما أسرع.

### تحليل الطيف

**power spectrum**نعم$\lvert X[k] \rvert^2$، وذلك هو الكبيرة المربعة لكل معدل تردد.

**phase spectrum**نعم$\angle X[k]$،也就是 كل التردد من مرحلة التكفيف. بالنسبة لمعظم مهام التحليل، أنت مهتمة بقطاع الطاقة، و سوف تتجاهل المرحلة.

```math
\begin{aligned}
\text{频率 } k \text{ 处的 Power：} \quad P[k] &= |X[k]|^2 = \mathop{\mathrm{Re}}(X[k])^2 + \mathop{\mathrm{Im}}(X[k])^2 \\
\text{频率 } k \text{ 处的 Phase：} \quad \phi[k] &= \mathop{\mathrm{atan2}}(\mathop{\mathrm{Im}}(X[k]), \mathop{\mathrm{Re}}(X[k]))
\end{aligned}
```

### تحديد التردد

قرار تردد DFT  يعتمد على عينات عدد $N$و معدل أخذ العينات$f_s$.

```math
\begin{aligned}
\text{bin } k \text{ 对应的频率：} \quad & f_k = k \cdot f_s / N \\
\text{频率分辨率：} \quad & \Delta f = f_s / N \\
\text{最高频率：} \quad & f_{\max} = f_s / 2 \quad \text{(Nyquist)}
\end{aligned}
```

لتحديد ترددات قريبة جداً، تحتاج إلى المزيد من العينات، لتمسيق ترددات عالية، تحتاج إلى معدل أعلى من العينات.

### نظرية التخزين

هذه واحدة من أهم نتائج معالجة الإشارات، ويرتبط مباشرة مع سي أن إن.

**time domain 中的 convolution 等于 frequency domain 中的 pointwise multiplication。**

```math
\begin{aligned}
& x * h = \text{IFFT}(\text{FFT}(x) \cdot \text{FFT}(h)) \\[4pt]
& \text{其中 } * \text{ 表示 convolution，} \cdot \text{ 表示 element-wise multiplication}
\end{aligned}
```

لماذا هذا مهم:

- 两个长度为 $N$和 $M$إشارات  تحويل مباشر  تحتاج $O(NM)$العمليات
-  على أساس FFT  ضرورت$O(N \log N)$:تحول 两者、乘 、تحول مرة أخرى‬
- بالنسبة للجذور الكبيرة، سوف تكون صيغة FFT سريعة.
- هذا ما يحدث في الطبقات المتحركة التي لديها مجالات استقبلية كبيرة

انتباه:DFT  حساب هو التخلب الدائري ((إشارة 会 لف حول) ・・・ بالنسبة للتخلب الخطية ((( بدون لف) ، يرجى في حساب قبل سوف تكون الإشارات صفر-باد إلى طول$N + M - 1$.

```mermaid
graph LR
    subgraph "Time Domain"
        TA["Signal x[n]"] -->|"convolve (slow: O(NM))"| TC["Output y[n]"]
        TB["Filter h[n]"] -->|"convolve"| TC
    end
    subgraph "Frequency Domain"
        FA["FFT(x)"] -->|"multiply (fast: O(N))"| FC["FFT(x) * FFT(h)"]
        FB["FFT(h)"] -->|"multiply"| FC
        FC -->|"IFFT"| FD["y[n]"]
    end
    TA -.->|"FFT"| FA
    TB -.->|"FFT"| FB
    FD -.->|"same result"| TC
```

### النوافذ

إشارة DFT 假设 是周期的,也就是把 $N$个样本 视为一个无限重复信号的周期──如果 starting point 和终点的信号不是相同的值,就会产生不连续性在边界,并表现为虚假的高频内容──这被称为光谱泄漏──

في حسابات النوافذ، سوف يقلل الإشارة من النقطة إلى الصفر، مما يقلل من التسرب.

常见 نوافذ:

| Window | Shape | Main lobe width | Side lobe level | Use case |
|--------|-------|----------------|-----------------|----------|
| Rectangular | 平坦（无 window） | 最窄 | 最高 (-13 dB) | 当 signal 在 N 个 samples 中正好 periodic 时 |
| Hann | Raised cosine | 中等 | 低 (-31 dB) | 通用 spectral analysis |
| Hamming | Modified cosine | 中等 | 更低 (-42 dB) | Audio processing、speech analysis |
| Blackman | Triple cosine | 宽 | 非常低 (-58 dB) | 当 side lobe suppression 至关重要时 |

```math
\begin{aligned}
\text{Hann window:} \quad & w[n] = 0.5 \left(1 - \cos\frac{2\pi n}{N-1}\right) \\
\text{Hamming window:} \quad & w[n] = 0.54 - 0.46 \cos\frac{2\pi n}{N-1}
\end{aligned}
```

قبل DFT ، سوف نستخدم نافذة مع إشارة جعل مضاعفة العنصر الحكيمة لنفذة:`X = DFT(x * w)`.

### خصائص DFT

| Property | Time Domain | Frequency Domain |
|----------|-------------|-----------------|
| Linearity | $ax + by$ | $aX + bY$ |
| Time shift | $x[n - k]$ | $X[f] e^{-2\pi i f k/N}$ |
| Frequency shift | $x[n] e^{2\pi i f_0 n/N}$ | $X[f - f_0]$ |
| Convolution | $x * h$ | $X \cdot H$ (pointwise) |
| Multiplication | $x \cdot h$ (pointwise) | $X * H$ (circular convolution, scaled by $1/N$) |
| Parseval's theorem | $\sum \lvert x[n] \rvert^2$ | $\frac{1}{N} \sum \lvert X[k] \rvert^2$ |
| Conjugate symmetry (real input) | $x[n]$ real | $X[k] = \overline{X[N-k]}$ |

نظرية بارسيفال تعبر عن الطاقة الإجمالية في مجالاتين متشابهة. الطاقة في عملية التحول.

### الاتصال مع التشفيرات الموضعية

المصدر الأصلي استخدام تشفيرات المواقع السينوسيدالية:

```math
\begin{aligned}
PE(pos, 2i) &= \sin\left(pos / 10000^{2i/d_{\text{model}}}\right) \\
PE(pos, 2i+1) &= \cos\left(pos / 10000^{2i/d_{\text{model}}}\right)
\end{aligned}
```

كل واحد من الأبعاد$(2i, 2i+1)$تتذبذب ترددات مختلفة. ترددات من ارتفاع (أبعاد 0.1) إلى أدنى (أبعاد) حسب المسافة الهندسية.

وهي توفر خصائص رئيسية:

- **Uniqueness:**أي موقعين لن يكون لديهم نفس التشفير.
- **Bounded values:**وكل شيء في نهاية المطاف$[-1, 1]$...
- **Relative position:**الموقف$p+k$يمكن أن يعبر عن موقع$p$处 تشفير وظيفة خطية──نموذج يمكن تعلم التركيز على المواقع النسبية──

### اتصال مع قنوات سي إن إن

طبقة التحويل 通过在信号或图像 上滑动一个学习过器(核心),将将其应用到输入──数学上,这就是 التحويل العملية──

وفقاً لنظرية التخفيف، هذا يساوي:
1. لإنتاج المدخلات
2. لـ " النواة "
3. في مجال التردد مضاعفة
4. لنتائج تنفيذ IFFT

标准 CNN 实现使用直接 convolution(对小型3x3 kernels 更快)  ولكن بالنسبة للنواة الكبيرة أو التحويل العالمي، فإن طريقة FFT القائمة على FFT سوف تكون بشكل ملحوظ أسرع.$O(N \log N)$و لا$O(N^2)$التعقيد، والحصول على دقة من النفس.

### الطيفيات و تحويل فوريه قصير الوقت

فقط FFT سوف تعطى محتوى تردد الإشارة بأكملها، ولكن لا يمكن أن تخبرك هذه الترددات متى تظهر.‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

تحويل فوريه في الوقت القصير (STFT) 通過 فانسترات التداخل في الإشارة 上 حساب FFT لتحل هذه المشكلة. النتيجة هي عرضية: تمثيل ثنائي الأبعاد، أحد المحورات هو الوقت، والمحور الآخر هو التردد.

```
STFT procedure:
1. Choose a window size (e.g., 1024 samples)
2. Choose a hop size (e.g., 256 samples -- 75% overlap)
3. For each window position:
   a. Extract the windowed segment
   b. Apply a Hann/Hamming window
   c. Compute FFT
   d. Store the magnitude spectrum as one column of the spectrogram
```

المجموعات هي تقديم المدخلات القياسية لنماذج ML الصوتية. نماذج التعرف على الكلام.

### التعبير

إذا الإشارة 包含高于 $f_s/2$(ترددات النيوكست) ، في المعدل$f_s$العينات ستنتج نسخة مستعارة. إشارة 90 هرتز من العينات 100 هرتز تبدو تماما نفسها مع إشارة 10 هرتز.

```
Example:
  True signal: 90 Hz sine wave
  Sampling rate: 100 Hz
  Apparent frequency: 100 - 90 = 10 Hz

  The samples from the 90 Hz signal at 100 Hz sampling rate
  are identical to the samples from a 10 Hz signal.
  No amount of math can recover the original 90 Hz.
```

هذا هو السبب في أن محولات التناظر إلى الرقمي سوف تحتوي على مرشحات مكافحة التحالف ، في الاختبار قبل نقل عالية إلى ترددات Nyquist. في ML ، عندما لا يكون هناك تصفية منخفضة المدى المناسبة في خرائط الميزات عندما يتم خفض الاختبار ، ستظهر التحالف ؛ بعض الهندسة المعمارية تستخدم طبقات تجمع مكافحة التحالف لمعالجة هذه المشكلة.

### الصفر لا يزيد من التوصل إلى القرار

واحد من الأسوأ المعروف هو: في FFT قبل إشارة  إجراء إضافة الصفرة 会提升 تردد القرارات── انها لن تكون── صفر إضافة  مجرد بين القمامة الموجودة تردد  القيمة، جعل الطيف تبدو أكثر سلاسة── ولكن لا يمكن أن تكشف التفاصيل المترددة التي لا توجد في عينات الأصل──

إنّ تحديد تردد حقيقي يعتمد فقط على وقت المراقبة$T = N / f_s$ يجب أن تفهم الفارق $\Delta f$من ترددات، أنت على الأقل تحتاج $T = 1 / \Delta f$秒的数据── مهما كان عدد المكملات الصفرية، لا يمكن تغيير هذا الحد الأساسي──


```figure
fourier-synthesis
```

## بناءها
### الخطوة 1: DFT من الصفر

$O(N^2)$DFT 直接来自定义──

```python
import math

class Complex:
    ...

def dft(x):
    N = len(x)
    result = []
    for k in range(N):
        total = Complex(0, 0)
        for n in range(N):
            angle = -2 * math.pi * k * n / N
            w = Complex(math.cos(angle), math.sin(angle))
            xn = x[n] if isinstance(x[n], Complex) else Complex(x[n])
            total = total + xn * w
        result.append(total)
    return result
```

### 步骤 2: DFT العكسية

结构相同,المجرد 为正,并除以 $N$.

```python
def idft(X):
    N = len(X)
    result = []
    for n in range(N):
        total = Complex(0, 0)
        for k in range(N):
            angle = 2 * math.pi * k * n / N
            w = Complex(math.cos(angle), math.sin(angle))
            total = total + X[k] * w
        result.append(Complex(total.real / N, total.imag / N))
    return result
```

### 步骤 3: FFT (كولي-توكي)

التكرارية FFT 要求长度为 2 的──拆分为 even 和 odd,递归, ثم باستخدام عوامل الدوج 合并──

```python
def fft(x):
    N = len(x)
    if N <= 1:
        return [x[0] if isinstance(x[0], Complex) else Complex(x[0])]
    if N % 2 != 0:
        return dft(x)

    even = fft([x[i] for i in range(0, N, 2)])
    odd = fft([x[i] for i in range(1, N, 2)])

    result = [Complex(0)] * N
    for k in range(N // 2):
        angle = -2 * math.pi * k / N
        twiddle = Complex(math.cos(angle), math.sin(angle))
        t = twiddle * odd[k]
        result[k] = even[k] + t
        result[k + N // 2] = even[k] - t
    return result
```

### الخطوة 4: مساعدي تحليل الطيف

```python
def power_spectrum(X):
    return [xk.real ** 2 + xk.imag ** 2 for xk in X]

def convolve_fft(x, h):
    N = len(x) + len(h) - 1
    padded_N = 1
    while padded_N < N:
        padded_N *= 2

    x_padded = x + [0.0] * (padded_N - len(x))
    h_padded = h + [0.0] * (padded_N - len(h))

    X = fft(x_padded)
    H = fft(h_padded)

    Y = [xk * hk for xk, hk in zip(X, H)]

    y = idft(Y)
    return [y[n].real for n in range(N)]
```

## استخدمها
في العمل الحقيقي، باستخدام FFT من numpy، انها من قبل المكتبات C عاليا المثلى 支持──

```python
import numpy as np

signal = np.sin(2 * np.pi * 5 * np.arange(256) / 256)
spectrum = np.fft.fft(signal)
freqs = np.fft.fftfreq(256, d=1/256)

power = np.abs(spectrum) ** 2

positive_freqs = freqs[:len(freqs)//2]
positive_power = power[:len(power)//2]
```

لتحليل الطيف المتقدم للنوافذ:

```python
from scipy.signal import windows, stft

window = windows.hann(256)
windowed = signal * window
spectrum = np.fft.fft(windowed)
```

 بالنسبة للقلب:

```python
from scipy.signal import fftconvolve

result = fftconvolve(signal, kernel, mode='full')
```

بالنسبة للفئات الطيفية:

```python
from scipy.signal import stft

frequencies, times, Zxx = stft(signal, fs=sample_rate, nperseg=256)
spectrogram = np.abs(Zxx) ** 2
```

شكل المصفوفة المصفوفة هو (n_frequencies, n_time_frames)。 كل صف هو نافذة وقت واحدة فوق الطيف الطاقة。 هذا هو النماذج الصوتية ML 作为输入 消费的内容。

## 交付 it
运行 `code/fourier.py`生成 `outputs/prompt-spectral-analyzer.md`.

## التدريب
1. **Pure tone identification。**创建信号,其中包含单个阴影波 (不知频率(1到50Hz 之间) ,以128Hz采样1秒──使用你的DFT 识别频率──验证答案是否匹配──现在加入标准偏差为0.5的高斯噪音,并重复──噪音 如何影响频谱?

2. **FFT vs DFT verification。**生成一个长度为 64 的随机信号──同时计算DFT($O(N^2){}$) و FFT── تثبيت جميع المعاملات في 1e-10 以内匹配── في طول إشارات 256、512、1024 و 2048 上分別计时两个函数── رسم DFT وقت ونسبة FFT وقت──

3. **Convolution theorem proof by example。**创建信号 x = [1, 2, 3, 4, 0, 0, 0, 0] 和过 h = [1, 1, 1, 0, 0, 0, 0, 0]──直接计算它们的圆形卷曲 (圈圈)──然后通过FFT 计算(转换、乘、逆转转)──验证结果匹配──现在通过适当的零 执行线性卷曲──

4. **Windowing effects。**إنشاء إشارة، إنها 10 هرتز و 12 هرتز ((قريب جداً) موجات الصناعيين و ‬‬بإستعراض 128 هرتز 1 ثانية‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

5. **Positional encoding analysis。**为 d_model = 128 和 max_pos = 512 生成 سينوسوايدل وضعية التشفيرات$(p_1, p_2)$، حسابها تشفيرات نقطة المنتج$\lvert p_1 - p_2 \rvert$، لا تعتمد على المواقع المطلقة. مع زيادة المسافة، النقطة المنتجة سوف يحدث؟

### 提示

**练习 1。**في 1 ثانية من خلال 128 مرة$k$على$k$لذلك، بالنسبة لمعدل عدد كامل، فإن أكبر قيمة بين الحلبات 1 إلى 63 هي هذه التردد.`generate_signal`和 `magnitude_spectrum` بعد إضافة الضجيج، تحقق ما إذا كان القيمة القصوى لا تزال في نفس القمامة، بينما ارتفع قيمة القمامة الأخرى بشكل كبير.

**练习 2。**استخدام 2 次长度, لأن `fft`سوف يتم إشارة إلى نصف التفريق.`max(abs(a - b))`◊ استهلاك الوقت مقارنة$N / \log_2 N$增长‬

**练习 3。**لتحويل دائري، الحساب$n$= 0 、1 、2 时的$y[n] = \sum_k h[k] x[(n-k) \bmod 8]$,并比较 `convolve_direct`和 `convolve_fft`√ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √  √                                                                 

**练习 4。**استخدام `hann_window`.`hamming_window`.`apply_window`和 `power_spectrum`، ومحتوى أن هناك عدد من التفاصيل بين 9 إلى 13 هرتز. 10 هرتز و 12 هرتز في 1 ثانية تماماً لإكمال عدد كامل من الدورات، لذلك لا تضيف نافذة قد تبدو أفضل.

**练习 5。**استخدام `positional_encoding(pos, 128)`计算每个编码──比较位置 (0, 10) 的点产量 和位置 (100, 110) 的点产量: 差别必须在约1e-10 以内──然后固定一个 $p_1$, رسم نقطة المنتج$\lvert p_1 - p_2 \rvert$变化的曲线──

## 关键术语
| Term | What it means |
|------|---------------|
| DFT (Discrete Fourier Transform) | 将 $N$ 个 time-domain samples 转换为 $N$ 个 frequency-domain coefficients。每个 coefficient 都是与该 frequency 上 complex sinusoid 的 correlation |
| FFT (Fast Fourier Transform) | 用于计算 DFT 的 $O(N \log N)$ algorithm。Cooley-Tukey algorithm 递归拆分 even/odd indices |
| Inverse DFT | 从 frequency coefficients 重建 time-domain signal。公式与 DFT 相同，但 exponent sign 相反，并带有 $1/N$ scaling |
| Frequency bin | DFT output 中的每个 index $k$ 表示 frequency $k f_s/N$ Hz。"bin" 是离散的 frequency slot |
| DC component | $X[0]$，zero-frequency coefficient。与 signal mean 成比例 |
| Nyquist frequency | $f_s/2$，在 sampling rate $f_s$ 下可表示的最大 frequency。高于它的 frequencies 会 alias |
| Power spectrum | $\lvert X[k] \rvert^2$，每个 frequency coefficient 的 squared magnitude。显示 energy 在 frequencies 上的分布 |
| Phase spectrum | $\angle X[k]$，每个 frequency component 的 phase offset。在 analysis 中通常会忽略 |
| Spectral leakage | 将 non-periodic signal 当作 periodic 处理导致的虚假 frequency content。可通过 windowing 减少 |
| Window function | 在 DFT 前应用的 tapering function（Hann、Hamming、Blackman），用于减少 spectral leakage |
| Twiddle factor | FFT butterfly computation 中用于合并 sub-DFTs 的 complex exponential $e^{-2\pi i k/N}$ |
| Convolution theorem | time domain 中的 convolution 等于 frequency domain 中的 pointwise multiplication。它是 signal processing 和 CNNs 的基础 |
| Circular convolution | signal 会 wrap around 的 convolution。这是 DFT 自然计算的内容 |
| Linear convolution | 没有 wraparound 的标准 convolution。通过在 DFT 前 zero-padding 实现 |
| Parseval's theorem | 总 energy 在 Fourier transform 中保持不变。$\sum \lvert x[n] \rvert^2 = \frac{1}{N} \sum \lvert X[k] \rvert^2$ |
| Aliasing | 当 sampling rate 不足时，高于 Nyquist 的 frequencies 表现为较低 frequencies |

## 延伸阅读
- [Cooley & Tukey: An Algorithm for the Machine Calculation of Complex Fourier Series (1965)](https://www.ams.org/journals/mcom/1965-19-090/S0025-5718-1965-0178586-1/)-  تغيير الحوسبة 论文
- [3Blue1Brown: But what is the Fourier Transform?](https://www.youtube.com/watch?v=spUNpyF58BY)- حول أفضل طريقة للتصور في تحويلات فوري
- [Lee-Thorp et al.: FNet: Mixing Tokens with Fourier Transforms (2021)](https://arxiv.org/abs/2105.03824)- في المحولات 中用 FFT بدل الاهتمام الذاتي
- [Smith: The Scientist and Engineer's Guide to Digital Signal Processing](http://www.dspguide.com/)- 免费在线教材,深入覆盖 FFT,窗户和光谱分析
- [Vaswani et al.: Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762)- من تشريحات التشغيل الموضعي السينوسيدال من تكوين تردد فوريير
- [Radford et al.: Whisper (2022)](https://arxiv.org/abs/2212.04356)- استخدام الميل-متفرقات  كتمثيل المدخلات التعرف على الكلام
