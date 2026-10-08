# التحسين

> تدريب شبكة عصبية، في الأساس هو البحث عن نقطة أدنى في وادي

**Type:** Build
**Language:**بايثون
**Prerequisites:** Phase 1, Lessons 04-05 (Derivatives, Gradients)
**Time:** ~75 minutes

## 學习目标
- من صفر تحقيق انخفاض نطاق الفانيليا ٬带 momentum SGD، وكذلك آدم
- مقارنة وظيفة روزنبروك أعلى من التحسين 收表现,并解释为什么 آدم سوف يؤخذ لكل وزن
- 区分 مخروط مع غير مخروط خسارة المشهد ،并解释 مقعد نقطة في高维空间中的作用
- تخصيص جدولات معدل التعلم ((مرحلة التدهور  تغيير التخفيف  تثبيت) لتحسين التدريب

## 问题
لديك وظيفة الخسارة. انها تخبرك أن النموذج الخطأ لديه الكثير من النسب. لديك درجات. انها تخبرك في أي اتجاه سوف تجعل الخسارة تصبح أسوأ.

الطريقة البسيطة جدا: تحرك في الاتجاه المعاكس من الجدارة إلى جانبها. استخدام عدد من تدريبات تدريبية لتخفيض الدرجة.

كل محفز في مجال التعلم العميق، يجيب على نفس السؤال: كيف يمكن أن تصل بشكل أسرع أو أكثر موثوقية إلى أسفل الوادي؟

## 概念
### ما تعنيه التحسين

التحسين هو البحث عن قيمة الدخول التي يمكن أن تجعل وظيفة تحددها أو تحددها. في التعلم الآلي، هذه الوظيفة هي الخسارة.

```
minimize L(w) where:
  L = loss function
  w = model weights (could be millions of parameters)
```

### التراجع المتسارع (فانيلا)

أسهل طريقة للتحسين. حساب الخسارة مقارنة مع كل خطوة من الوزن.

```
w = w - lr * gradient
```

هذا هو الحساب الكامل

```mermaid
graph TD
    A["* Starting point (high loss)"] --> B["Moving downhill along gradient"]
    B --> C["Approaching minimum"]
    C --> D["o Minimum (low loss)"]
```

### معدل التعلم: أهم معايير

معدل التعلم 控制步长──.

```mermaid
graph LR
    subgraph TooLarge["Too Large (lr = 1.0)"]
        A1["Step 1"] -->|overshoot| A2["Step 2"]
        A2 -->|overshoot| A3["Step 3"]
        A3 -->|diverging| A4["..."]
    end
    subgraph TooSmall["Too Small (lr = 0.0001)"]
        B1["Step 1"] -->|tiny step| B2["Step 2"]
        B2 -->|tiny step| B3["Step 3"]
        B3 -->|10,000 steps later| B4["Minimum"]
    end
    subgraph JustRight["Just Right (lr = 0.01)"]
        C1["Start"] --> C2["..."] --> C3["Converged in ~100 steps"]
    end
```

لا يوجد عبارة يمكن أن تعطى مباشرة معدل التعلم الصحيح. تحتاج من خلال التجربة للعثور عليه.

### الجدول المالي مقابل اللحظة مقابل اللحظة الصغيرة

انخفاض تراجع فانيلا في المخطوة قبل ذلك، سوف يكون في مجموعة البيانات بأكملها 上计算 gradient.

تراجع تراجع المرجع السطويه ((SGD) في نموذج واحد随机 على حساب المرجع،并立即更新──它噪声大,但快──

تخفيض تراجع تراجع المجموعة الصغيرة 折中处理──先在一个小批量(32、64、128、256 个样本) على حساب تراجع، ثم تحديث──这是实际中大家真正使用的方法──

| Variant | Batch size | Gradient quality | Speed per step | Noise |
|---------|-----------|-----------------|---------------|-------|
| Batch GD | 整个 dataset | 精确 | 慢 | 无 |
| SGD | 1 个样本 | 噪声很大 | 快 | 高 |
| Mini-batch | 32-256 | 良好估计 | 均衡 | 中等 |

الصوت في الجمعيات المختلفة من المجموعات الصغيرة ليس ضبابا. يساعد على الهروب من الحد الأدنى المحلي من الصفوف المرتفعة من نقاط القيادة.

### الزخم: كرة صغيرة تتدفق إلى الجبل

إن كان التراجع في نسبة الفانيليا متواضعًا في المدار الحالي، فإن النسبة تتحرك بشكل عام في الوادي الضيق، فإن التقدم سيكون بطيء.

```
v = beta * v + gradient
w = w - lr * v
```

类比是: كرة تتدفق نحو الجبل. لا تتوقف في كل صعوبة وتبدأ مرة أخرى.

```mermaid
graph TD
    subgraph Without["Without Momentum (zigzag, slow)"]
        W1["Start"] -->|left| W2[" "]
        W2 -->|right| W3[" "]
        W3 -->|left| W4[" "]
        W4 -->|right| W5[" "]
        W5 -->|left| W6[" "]
        W6 --> W7["Minimum"]
    end
    subgraph With["With Momentum (smooth, fast)"]
        M1["Start"] --> M2[" "] --> M3[" "] --> M4["Minimum"]
    end
```

`beta`(عادةً 0.9) التحكم في الحفاظ على الكثير من المعلومات التاريخية.

### آدم: معدلات التعلم المتكافئة

الوزن المختلف يحتاج إلى معدلات تعلم مختلفة. بعضها يحصل على وزن كبير في الدرجة الثانية، في النهاية يحصل على الدرجة الثانية يجب أن يمضي قدما أكبر.

(آدم) تقدير اللحظة التكيفية) سيكون لكل وزن و بعد ذلك أمرين:

1. اللحظة الأولى ((م): المتوسط الجاري للدرجات ((شبه الزخم)
2. اللحظة الثانية ((v):معدل تدريجية مربع

```
m = beta1 * m + (1 - beta1) * gradient
v = beta2 * v + (1 - beta2) * gradient^2

m_hat = m / (1 - beta1^t)    bias correction
v_hat = v / (1 - beta2^t)    bias correction

w = w - lr * m_hat / (sqrt(v_hat) + epsilon)
```

إضافة إلى`sqrt(v_hat)`يُعرف أنّ الوزن الذي يُعَدّهُ كبيراً من الدرجات سيتمّ تعزيزه بعددٍ كبيرٍ (فعالٍ) ، و يُعَدّ الوزن الذي يُعَدّهُ كبيراً من الدرجات الصغيرة سيتمّ تعزيزه بعددٍ صغيرٍ (فعالٍ) ، و يُعَدّ كلّ وزن يُحصل على معدل التعلم التكيفيّ الخاصّ به.

المعلمات المضادة:`lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8` هذه القيم المتخفية لا تؤثر على معظم المشاكل

### جدول مواعيد التعلم

معدل التعلم المحدد هو نوع من التدريب في وقت مبكر، تريد أن تكون أكبر، حتى تتمكن من التقدم بسرعة.

المواعيد المعتادة:

| Schedule | Formula | Use case |
|----------|---------|----------|
| Step decay | lr = lr * factor every N epochs | 简单，手动控制 |
| Exponential decay | lr = lr_0 * decay^t | 平滑降低 |
| Cosine annealing | lr = lr_min + 0.5 * (lr_max - lr_min) * (1 + cos(pi * t / T)) | Transformers，现代训练 |
| Warmup + decay | 线性上升，然后 decay | 大模型，防止早期不稳定 |

### الملتوية مقابل غير الملتوية

وظيفة مخروطة 只有حد أدنى  التنزل التدريجي 总能找到它‬ ‬`f(x) = x^2`مثل هذا التربيعي هو متواصل

وظائف فقدان الشبكة العصبية غير متواصلة.

```mermaid
graph LR
    subgraph Convex["Convex: One valley, one answer"]
        direction TB
        CV1["High loss"] --> CV2["Global minimum"]
    end
    subgraph NonConvex["Non-convex: Multiple valleys, saddle points"]
        direction TB
        NC1["Start"] --> NC2["Local minimum"]
        NC1 --> NC3["Saddle point"]
        NC1 --> NC4["Global minimum"]
    end
```

في الواقع، الحد الأدنى المحلي في الشبكات العصبية عالية الارتفاع 很少是真正的问题── معظم الحد الأدنى المحلي 值 الخسارة 值都接近全球最低── نقطة الساحل ((بعض الاتجاهات平坦、其他方向曲) فقط هو العائق الحقيقي── الحزم والضوضاء الذي يجلبها يساعد على الهروب منها──

### تصور المشهد الخسائر

الخسارة هي وظيفة لكل الوزن. بالنسبة لنموذج لديه 100 مليون وزن، فإن المشهد الخساري موجود في 1,000،001 维空间.

```mermaid
graph TD
    HL["High loss region"] --> SP["Saddle point"]
    HL --> LM["Local minimum"]
    SP --> LM
    SP --> GM["Global minimum"]
    LM -.->|"shallow barrier"| GM
    style HL fill:#ff6666,color:#000
    style SP fill:#ffcc66,color:#000
    style LM fill:#66ccff,color:#000
    style GM fill:#66ff66,color:#000
```

الحد الأدنى الحاد 泛化较差── الحد الأدنى السطح 泛化较好── هذا هو أيضا مع الزخم SGD في الدقة الاختبار النهائي 上经常优于亚当的原因之一:


```figure
gradient-descent
```

## بناءها
### الخطوة 1: تحديد وظيفة اختبار

وظيفة روزنبروك هي معيار التحسين الكلاسيكي. يقع الحد الأدنى له (1, 1), يقع في وادي صغير من الجبال.

```
f(x, y) = (1 - x)^2 + 100 * (y - x^2)^2
```

```python
def rosenbrock(params):
    x, y = params
    return (1 - x) ** 2 + 100 * (y - x ** 2) ** 2

def rosenbrock_gradient(params):
    x, y = params
    df_dx = -2 * (1 - x) + 200 * (y - x ** 2) * (-2 * x)
    df_dy = 200 * (y - x ** 2)
    return [df_dx, df_dy]
```

### 步骤 2: انخفاض نسبة الفانيليا

```python
class GradientDescent:
    def __init__(self, lr=0.001):
        self.lr = lr

    def step(self, params, grads):
        return [p - self.lr * g for p, g in zip(params, grads)]
```

### 步骤 3: الدفع المالي مع الزخم

```python
class SGDMomentum:
    def __init__(self, lr=0.001, momentum=0.9):
        self.lr = lr
        self.momentum = momentum
        self.velocity = None

    def step(self, params, grads):
        if self.velocity is None:
            self.velocity = [0.0] * len(params)
        self.velocity = [
            self.momentum * v + g
            for v, g in zip(self.velocity, grads)
        ]
        return [p - self.lr * v for p, v in zip(params, self.velocity)]
```

### 步骤 4: آدم

```python
class Adam:
    def __init__(self, lr=0.001, beta1=0.9, beta2=0.999, epsilon=1e-8):
        self.lr = lr
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.m = None
        self.v = None
        self.t = 0

    def step(self, params, grads):
        if self.m is None:
            self.m = [0.0] * len(params)
            self.v = [0.0] * len(params)

        self.t += 1

        self.m = [
            self.beta1 * m + (1 - self.beta1) * g
            for m, g in zip(self.m, grads)
        ]
        self.v = [
            self.beta2 * v + (1 - self.beta2) * g ** 2
            for v, g in zip(self.v, grads)
        ]

        m_hat = [m / (1 - self.beta1 ** self.t) for m in self.m]
        v_hat = [v / (1 - self.beta2 ** self.t) for v in self.v]

        return [
            p - self.lr * mh / (vh ** 0.5 + self.epsilon)
            for p, mh, vh in zip(params, m_hat, v_hat)
        ]
```

### 步骤 5: تشغيل ومقارنة

```python
def optimize(optimizer, func, grad_func, start, steps=5000):
    params = list(start)
    history = [params[:]]
    for _ in range(steps):
        grads = grad_func(params)
        params = optimizer.step(params, grads)
        history.append(params[:])
    return history

start = [-1.0, 1.0]

gd_history = optimize(GradientDescent(lr=0.0005), rosenbrock, rosenbrock_gradient, start)
sgd_history = optimize(SGDMomentum(lr=0.0001, momentum=0.9), rosenbrock, rosenbrock_gradient, start)
adam_history = optimize(Adam(lr=0.01), rosenbrock, rosenbrock_gradient, start)

for name, history in [("GD", gd_history), ("SGD+M", sgd_history), ("Adam", adam_history)]:
    final = history[-1]
    loss = rosenbrock(final)
    print(f"{name:6s} -> x={final[0]:.6f}, y={final[1]:.6f}, loss={loss:.8f}")
```

预期输出:آدم 收最快──带动力 的 SGD 路径更平滑──瓦尼拉 GD 在狭窄山谷中进展缓慢──

## استخدمها
في الممارسة، باستخدام PyTorch أو JAX Optimizers.

```python
import torch

model = torch.nn.Linear(784, 10)

sgd = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
adam = torch.optim.Adam(model.parameters(), lr=0.001)
adamw = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)

scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(adam, T_max=100)
```

经验法则:

- من آدم (لر=0.001) بدأ.
- عندما تحتاج إلى أفضل دقة نهائية، وتكون قادرة على تحمل المزيد من التكاليف التجهيزية، التحول إلى تحمل الزخم SGD ((lr=0.01, الزخم=0.9)。
- على المحولات استخدام آدمW(带 منفصلة الوزن الانحلال
- على مدار عدة فترات من التدريب، دائماً استخدام جدول معدل التعلم
- إذا كان التدريب غير مستقرة، انخفض معدل التعلم... إذا كان التدريب بطيء جدا، تحسينه...

## 交付 it
本课会产出一个用于选择合适优化器的提示──见 `outputs/prompt-optimizer-guide.md`.

سوف تظهر فصول التكيف المُبنيّة هنا مرة أخرى في المرحلة الثالثة، حينها سنقوم بتدريب شبكة عصبية من الصفر.

## التدريب
1. **Learning rate sweep.**في وظيفة روزنبروك 上 استخدام معدلات التعلم [0.0001, 0.0005, 0.001, 0.005, 0.01] 运行 نسبة تراجع نسبة الفانيليا。 لجميع معدلات التعلم، في 5000 步后绘图或印印最终 Loss──找出仍能收的最大学习率──

2. **Momentum comparison.**في وظيفة روزنبروك 上 استخدام قيم الزخم [0.0, 0.5, 0.9, 0.99] 运行带动力 的 SGD──跟踪每一步的损失──哪个动力值 收最快?哪个会超越?

3. **Saddle point escape.**定义函数 `f(x, y) = x^2 - y^2`(أصل نقطة واحدة نقطة السرير) ∼ (0.01, 0.01) 开始── Comparar vanilla GD、带 momentum 的 SGD 和 Adam 的行为──哪个能逃离 Saddle Point?

4. **Implement learning rate decay.**لصف GradientDescent اضافة جدول التدهور المتفاضل:`lr = lr_0 * 0.999^step` مقارنة في وظيفة روزنبروك 上 استخدام التهالك مع عدم استخدام التهالك

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Gradient descent | “Go downhill” | 通过减去按 learning rate 缩放后的 Gradient 来更新 weights。最基础的 Optimizer。 |
| Learning rate | “Step size” | 控制每次更新让 weights 移动多远的标量。太大会导致发散。太小会浪费计算。 |
| Momentum | “Keep rolling” | 将过去的 Gradients 累积到一个 velocity Vector 中。抑制震荡，并加速沿一致方向的移动。 |
| SGD | “Random sampling” | Stochastic gradient descent。用随机子集而不是完整 dataset 计算 Gradient。实践中几乎总是指 mini-batch SGD。 |
| Mini-batch | “A chunk of data” | 用于估计 Gradient 的一小部分训练数据（32-256 个样本）。平衡速度与 Gradient 准确性。 |
| Adam | “The default optimizer” | Adaptive Moment Estimation。跟踪每个 weight 的 Gradients 和 squared gradients 的 running averages，从而为每个 weight 提供自己的 learning rate。 |
| Bias correction | “Fix the cold start” | Adam 的 first 和 second moments 初始化为零。Bias correction 在早期步骤中通过除以 (1 - beta^t) 进行补偿。 |
| Learning rate schedule | “Change lr over time” | 在训练过程中调整 learning rate 的函数。早期大步，后期小步。 |
| Convex function | “One valley” | 任意 local minimum 都是 global minimum 的函数。Gradient descent 总能找到它。Neural Network losses 不是 convex。 |
| Saddle point | “Flat but not a minimum” | Gradient 为零，但在某些方向上是 minimum、在另一些方向上是 maximum 的点。高维空间中很常见。 |
| Loss landscape | “The terrain” | 在 weight space 上绘制出的 Loss function。通过沿两个随机方向切片来可视化。 |
| Convergence | “Getting there” | Optimizer 已到达一个继续更新也无法显著降低 Loss 的点。 |

## 延伸阅读
- [Sebastian Ruder: An overview of gradient descent optimization algorithms](https://ruder.io/optimizing-gradient-descent/)- لمحة شاملة عن جميع المُحفّسين الرئيسيين
- [Why Momentum Really Works (Distill)](https://distill.pub/2017/momentum/)- تعريف ديناميكية الزخم
- [Adam: A Method for Stochastic Optimization (Kingma & Ba, 2014)](https://arxiv.org/abs/1412.6980)- أوراق آدم الأصلية، سهلة القراءة و قصيرة
- [Visualizing the Loss Landscape of Neural Nets (Li et al., 2018)](https://arxiv.org/abs/1712.09913)-  عرض ورقة حادة مقابل الحد الأدنى
