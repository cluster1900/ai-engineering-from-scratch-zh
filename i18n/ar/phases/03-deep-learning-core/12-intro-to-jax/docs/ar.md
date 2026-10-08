# JAX دخول

> سيتم تعديل الجهاز التنسيري. سيتم بناء الرسوم البيانية. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري. سيتم تعديل الجهاز التنسيري.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## 學习目标

- استخدام JAX's وظيفة مثل API(jax.numpy、jax.grad、jax.jit、jax.vmap)编写纯函数 神经网络代码
-  شرح التحول السريع في PyTorch و JAX
- 应用 jit 编译和 vmap متجهة,相比 بسيطة Python 加速训练循环
- في JAX تدريب شبكة بسيطة، وسوف يتم مقارنة إدارة الحالة الواضحة مع طريقة PyTorch المواجهة للموضوع

## 问题

أنت تعرف كيفية بناء شبكة عصبية في PyTorch.`nn.Module`,调用 `.backward()`، دعم التحسينات قبل ذلك أكثر.

لكن حمض النووي لـ (بيتورش) يضع حزمة: إنه يتواجد في (بيتورش) متحمساً للعمل على التتبع`tensor + tensor`كل خطوة تدريبية ستعيد تفسير نفس المقطع من كود بايثون. إذا كنت بحاجة إلى 2048 TPU لتدريب نموذج معين 5400 مليار، هذا ليس مشكلة.

Google DeepMind يستخدم JAX  تدريب Gemini。 Anthropic يستخدم JAX  تدريب كلود。 هذه ليست عمليات صغيرة الحجم، ولكن واحدة من أكبر شبكات عصبية على الأرض  تدريب عمليات‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

JAX هو مع ثلاثة نوع من السلطة العالية NumPy: تلقائي الخصائص التفاصيل، JIT  مرتبة إلى XLA  التنقل التفاصيل المعتادة. أنت تكتب عمل معالجة نموذج واحد. JAX سوف تعطيك عمل معالجة مجموعة، الحساب درجيات، تدوين لجهاز كود وتعمل على العديد من الأجهزة. كل هذا لا يحتاج إلى تغيير الوظيفة الأساسية.

## مفهوم الأساسي

### JAX 哲学

JAX هو إطار عمل.`.backward()`方法──取而代之 هي:

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

هذا ليس من المفضلات الرائعة. هذا هو الحد من 100x السرعة المحتملة.

### (جاكس) ، (نومبي)

JAX إعادة تنفيذ NumPy API على المسرع:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

اسم وظيفة مماثلة. نفس قواعد الإذاعة. نفس القسمة. ولكن المجموعات تقع على GPU / TPU ، ويمكن تعقب كل عملية بواسطة المُعدل.

واحد فرق مهم: صفوف JAX هي غير قابلة للتغيير.`a[0] = 5`وكتب:`a = a.at[0].set(5)`هذا في الأسبوع الأول سوف يبدو مختلفاً، بعد ذلك ستفهم: لا يمكن أن يتغير`grad`.`jit`和 `vmap`هذه النوعية من التحويلات يمكن أن تكون سببها.

### jax.grad: فعل فصيلة Autodiff

بيتورش وضع درجة مع الجهاز التنسوري`.grad`) 上。JAX ضع الدرجة 附附到函数上。

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`接收一个函数,并返回一个计算 Gradient 的新函数──没有 `.backward()`调用──没有存储在 tensor 上的计算图──渐变──只是另一个你可以调用、组合或JIT 编译的函数──

يمكن أن تكون أي مجموعة:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات: ثانيهات:`grad`حصلت على: بايتورش أيضا يمكن أن تفعل ذلك`torch.autograd.functional.hessian`لكن ذلك كان بعد ذلك في الجاكس

约束是:`grad`لا تطبق فقط للعمل الباهر. لا يوجد مفتاح واضح في الموقع. لا يوجد مفتاح واضح في الموقع. لا يوجد مفتاح واضح في الموقع.

### (تدوين)

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

في أول مرة تستخدمها، سوف تتبع JAX هذه الوظيفة: إنها تسجل أي عمليات حدثت، ولكن لا تنفذها حقا.

后续调用会完全跳过Python──编译后代码会以C++ 速度运行在加速器上──

المشهد المفيد:
- 訓練步骤(相同计算重复数千次)
- الإستعراض ((المثل, مختلف输入)
- أي وظيفة ذات شكل مشابهة

المشهد المضايق:
- 带有依赖值 Python تحكم تدفق وظيفة `if x > 0`، من بينها x هو تعقب المجموعة)
- أحداث التسجيلات
- 调试(التعقب 会隐藏真实执行过程)

تدفق التحكم الحد من وجود حقيقي`jax.lax.cond`替代 `if/else`.`jax.lax.scan`替代 `for`循环── هذه ليست خيارات، بل تكلفة المجموعة──

### vmap: التنقل الذاتي

أنت تكتب عمل معالجة نموذج واحد:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`سوف تصلحه لتعامل وظيفة مجموعة:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`لا تتحرك`params`عمل مجموعة ((共享) ، على طول`x`‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬ ‬`for`循环──没有重塑──没有手动传递批量──JAX 会找到出批量 维度,并对整个计算进行矢量化──

هذا ليس لغة "سكر"`vmap`سوف يتم إنتاج كود متجه بعد التدمير، وتشغيل أسرع من بيثون 10-100x.`jit`和 `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

في بيتورش، إذا لم يكن هناك هيك، فإنه من المستحيل تقريباً أن يتم ذلك.

### pmap:跨设备 الموازية البيانات

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`سوف نقوم بتكرار الوظيفة إلى جميع الأجهزة المتاحة (GPUs / TPUs) ، ومقطوعة في المجموعة.`jax.lax.pmean`和 `jax.lax.psum`会跨设备同步 دراجينت

استخدام جوجل`pmap`(ومتحلفيه)`shard_map`) عبر آلاف رقائق TPU v5e  تدريب جيمينى。`pmap`-تُغلف، تُنجز

### الأقسام: هيكل البيانات العام

JAX 操作是 pytrees:由列表、tuples、dicts 和 arrays 嵌套组合而成的结构──你的模型参数就是一个 pytree:

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

كلّ JAX 转换:`grad`.`jit`.`vmap`, تو يَعْرفُ كيف يَجْرُو بِالتّسْوَرِ:`jax.tree.map(f, tree)`سأقوم بذلك`f`تطبيق على كل ورقة. هذا هو طريقة تحسين

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

لا يوجد`.parameters()`方法──没有参数注册──树 结构就是模型──

### 函数式 vs 面向对象

PyTorch وضع وضع مخزن في داخل العينة:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX استخدام وظيفة خالصة مع حالة واضحة:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

المعلمات تم إدخالها. لا شيء يتم تخزينها. لا شيء يتم تعديله. هذا يجعل كل وظيفة قابلة للاختبار.

### JAX 生态

JAX  أعطيك البدائيات ‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

أوتتاكس هو معيار تحسين 库.

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### ماذا عن الـ (جاكس) ، ماذا عن (بيتورش) ؟

| Factor | JAX | PyTorch |
|--------|-----|---------|
| TPU support | 一等支持（Google 同时构建了两者） | 社区维护（torch_xla） |
| GPU support | 良好（通过 XLA 使用 CUDA） | 同类最佳（原生 CUDA） |
| Debugging | 困难（tracing + compilation） | 简单（eager，逐行） |
| Ecosystem | 偏研究（Flax、Equinox） | 庞大（HuggingFace、torchvision 等） |
| Hiring | 小众（Google/DeepMind/Anthropic） | 主流（到处都是） |
| Large-scale training | 更优（XLA、pmap、mesh） | 良好（FSDP、DeepSpeed） |
| Prototyping speed | 较慢（函数式开销） | 较快（修改然后运行） |
| Production inference | TensorFlow Serving、Vertex AI | TorchServe、Triton、ONNX |
| Who uses it | DeepMind (Gemini)、Anthropic (Claude) | Meta (Llama)、OpenAI (GPT)、Stability AI |

الجواب الحقيقي هو: ما لم يكن لديك سبب محدد لاستخدام JAX، أو استخدام PyTorch.

### عدد المتفردين في JAX

JAX  ليس لها حالة كلية كليا ً كل عملية كلية تحتاج إلى مفتاح PRNG واضح:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

في البداية هذا سيثير غضب الناس ولكن يضمن قابلية التكامل عبر الأجهزة و عبر المعدات، وهو ما هو PyTorch`torch.manual_seed`في مجموعة متعددة من أجهزة البيانات النووية


```figure
batchnorm-effect
```

## بناءها

### الخطوة 1: إعداد و بيانات

سنستخدم JAX و Optax في MNIST لتدريب 3 طبقات MLP―784 دخول، اثنين من التفاصيل لديها 256 و 128 طبقة مخفية من الخلايا العصبية,10 طبقات الخروج

```python
import jax
import jax.numpy as jnp
from jax import random
import optax

def get_mnist_data():
    from sklearn.datasets import fetch_openml
    mnist = fetch_openml('mnist_784', version=1, as_frame=False, parser='auto')
    X = mnist.data.astype('float32') / 255.0
    y = mnist.target.astype('int')
    X_train, X_test = X[:60000], X[60000:]
    y_train, y_test = y[:60000], y[60000:]
    return X_train, y_train, X_test, y_test
```

### الخطوة 2: إعدادات البداية

لا يوجد فئة. فقط وظيفة واحدة للعودة إلى الثلاثة:

```python
def init_params(key):
    k1, k2, k3 = random.split(key, 3)
    scale1 = jnp.sqrt(2.0 / 784)
    scale2 = jnp.sqrt(2.0 / 256)
    scale3 = jnp.sqrt(2.0 / 128)
    params = {
        'layer1': {
            'w': scale1 * random.normal(k1, (784, 256)),
            'b': jnp.zeros(256),
        },
        'layer2': {
            'w': scale2 * random.normal(k2, (256, 128)),
            'b': jnp.zeros(128),
        },
        'layer3': {
            'w': scale3 * random.normal(k3, (128, 10)),
            'b': jnp.zeros(10),
        },
    }
    return params
```

يبدأ، يدفع لإنجازها. ثلاثة مفاتيح PRNG من بذرة واحدة تفرق بينها. كل وزن هو تعريف في المجموعة.

### 步骤 3: التسلل المباشر

```python
def forward(params, x):
    x = jnp.dot(x, params['layer1']['w']) + params['layer1']['b']
    x = jax.nn.relu(x)
    x = jnp.dot(x, params['layer2']['w']) + params['layer2']['b']
    x = jax.nn.relu(x)
    x = jnp.dot(x, params['layer3']['w']) + params['layer3']['b']
    return x

def loss_fn(params, x, y):
    logits = forward(params, x)
    one_hot = jax.nn.one_hot(y, 10)
    return -jnp.mean(jnp.sum(jax.nn.log_softmax(logits) * one_hot, axis=-1))
```

純函数──パラامات 输入,预测 输出──没有 `self`لا يوجد حالة تخزين`loss_fn`من صفر حسابات التقاطع:softmax、log、منفي المتوسط

### الخطوة 4: خطوة التدريب

```python
@jax.jit
def train_step(params, opt_state, x, y):
    loss, grads = jax.value_and_grad(loss_fn)(params, x, y)
    updates, opt_state = optimizer.update(grads, opt_state, params)
    params = optax.apply_updates(params, updates)
    return params, opt_state, loss

@jax.jit
def accuracy(params, x, y):
    logits = forward(params, x)
    preds = jnp.argmax(logits, axis=-1)
    return jnp.mean(preds == y)
```

`jax.value_and_grad`سوف نعود في نفس الوقت إلى القيمة والمرحلة`@jax.jit`سوف يقوم المُزيّف بتعدّد كلّ وظيفتين إلى XLA. بعد أول تدوين، لن يتواصل كلّ خطوة تدريبية مع Python.

### الخطوة 5: دورة التدريب

```python
optimizer = optax.adam(learning_rate=1e-3)

X_train, y_train, X_test, y_test = get_mnist_data()
X_train, X_test = jnp.array(X_train), jnp.array(X_test)
y_train, y_test = jnp.array(y_train), jnp.array(y_test)

key = random.PRNGKey(0)
params = init_params(key)
opt_state = optimizer.init(params)

batch_size = 128
n_epochs = 10

for epoch in range(n_epochs):
    key, subkey = random.split(key)
    perm = random.permutation(subkey, len(X_train))
    X_shuffled = X_train[perm]
    y_shuffled = y_train[perm]

    epoch_loss = 0.0
    n_batches = len(X_train) // batch_size
    for i in range(n_batches):
        start = i * batch_size
        xb = X_shuffled[start:start + batch_size]
        yb = y_shuffled[start:start + batch_size]
        params, opt_state, loss = train_step(params, opt_state, xb, yb)
        epoch_loss += loss

    train_acc = accuracy(params, X_train[:5000], y_train[:5000])
    test_acc = accuracy(params, X_test, y_test)
    print(f"Epoch {epoch + 1:2d} | Loss: {epoch_loss / n_batches:.4f} | "
          f"Train Acc: {train_acc:.4f} | Test Acc: {test_acc:.4f}")
```

10 个时代──大约 97% دقة الاختبار──第一个时代 较慢(JIT 编译)──第 2-10 个时代 很快──

انتبه إلى ما فات`.zero_grad()`لا يوجد`.backward()`لا يوجد`.step()` الإصلاح كله هو استخدام وظيفة مجموعة واحدة.`train_step`الداخلية

## استخدمها

### اللون: Google 标准

الفني هو الأكثر شيوعا في شبكة JAX العصبية`nn.Module`إضافة إلى العودة، ولكن باستخدام إدارة الحالة الواضحة:

```python
import flax.linen as nn

class MLP(nn.Module):
    @nn.compact
    def __call__(self, x):
        x = nn.Dense(256)(x)
        x = nn.relu(x)
        x = nn.Dense(128)(x)
        x = nn.relu(x)
        x = nn.Dense(10)(x)
        return x

model = MLP()
params = model.init(jax.random.PRNGKey(0), jnp.ones((1, 784)))
logits = model.apply(params, x_batch)
```

结构与 PyTorch 相同,但 `params`مع النموذج`model.init()`创建params‬`model.apply(params, x)`运行前行通行――模型对象没有状态――

### الإستقبال: البيتونية 替代方案

الإيكنوكس (بالإنجليزية: Equinox)

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

النموذج 本身就是一個 pytree──不需要 `.apply()`◊ العيار هو أوراق النموذج.

### أوتتاكس:可组合 محفزات

Optax 将 تحويل تدريجي مع تحديث 解:

```python
schedule = optax.warmup_cosine_decay_schedule(
    init_value=0.0, peak_value=1e-3,
    warmup_steps=1000, decay_steps=50000
)

optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adamw(learning_rate=schedule, weight_decay=0.01),
)
```

التقطيع التدريجي ‧تعلم معدل تسخين ‧انحدار الوزن:全部组合成一条 تحولات 链── كل تحول مدينة ترى التدريجي، تعديلها، ثم تمر إلى التالي──没有单体优化器类──

## 交付 it

**安装：**

```bash
pip install jax jaxlib optax flax
```

باستخدام دعم GPU:

```bash
pip install jax[cuda12]
```

تستخدم TPU ((غوجل سحاب):

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- أول مرة في التطبيقات التجهيزية
- 避免在JIT 内部使用Python循环 穿越JAX arrays──使用 `jax.lax.scan`أو`jax.lax.fori_loop`.
- `jax.debug.print()`يمكن أن يكون في JIT 内部工作──普通 `print()`لا تذهب
- استخدام `jax.profiler`أو TensorBoard صنع ملف تعريفها.
- JAX 默认会预分配 75% من ذاكرة GPU── الإعداد `XLA_PYTHON_CLIENT_PREALLOCATE=false`لا يمكن استخدامها

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`: واحد للاختيار مناسب JAX محفز  تخصيص الإرشاد
- `outputs/skill-jax-patterns.md`: a تغطي JAX 中 وظائف النمط مهارة

## التدريب

1. 给 MLP 添加 dropout──在 JAX,dropout 需要一个PRNG key:把 key 穿越前进通过,并为每个 dropout layer 分裂──比较使用和不使用 dropup 时的测试精度──

2. استخدام `jax.vmap`لتحديد مجموعة من الصور من 32 张 MNIST  حساباً عن نموذج درجيئنتها  حساباً عن نموذج درجيئنتها  أي نموذج لديه أكبر درجيئنته، ولماذا؟

3. مع واحد عام`mlp_forward(params, x)`替换手动前进 函数,使其适用任意数量的层――使用 `jax.tree.leaves`تحديد عمق الذاتية

4. مقياس استخدام و عدم استخدام `@jax.jit`تدريب الخطوات.                                                                                                                                                                                                                                                             

5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现 Gradient clipping──分别使用和不使用剪辑 进行训练── رسم المعيار الدرجي في عملية التدريب، observar效果──

## 关键术语

| Term | 人们通常怎么说 | 它实际上的意思 |
|------|----------------|----------------------|
| XLA | “让 JAX 变快的东西” | Accelerated Linear Algebra：一个编译器，会融合操作，并从计算图生成优化后的 GPU/TPU kernels |
| JIT | “Just-in-time compilation” | JAX 在第一次调用时 trace 函数，编译到 XLA，然后在后续调用中运行编译后的版本 |
| Pure function | “没有副作用” | 输出只依赖输入的函数：没有全局状态，没有 mutation，没有显式 keys 时没有 randomness |
| vmap | “Auto-batching” | 将处理单个样本的函数转换为处理 batch 的函数，无需重写 |
| pmap | “Auto-parallelism” | 将函数复制到多个设备上，并切分输入 batch |
| Pytree | “arrays 的嵌套 dict” | 任何由 lists、tuples、dicts 和 arrays 组成、JAX 可以遍历和转换的嵌套结构 |
| Tracing | “记录计算” | JAX 用抽象值执行函数来构建计算图，而不计算真实结果 |
| Functional autodiff | “函数的 grad” | 通过转换函数来计算导数，而不是把 Gradient 存储附着到 tensors 上 |
| Optax | “JAX 的 Optimizer 库” | 一个可组合的 Gradient transformations 库：Adam、SGD、clipping、scheduling，可以串联在一起 |
| Flax | “JAX 的 nn.Module” | Google 的 JAX Neural Network 库，在保持状态显式的同时添加 layer 抽象 |

## 延伸阅读

- وثائق JAX: https://jax.readthedocs.io/-- 官方文档,包含关于 Graduate   和 vmap 的优秀教程
- JAX: تحويلات قابلة للتكوين من برامج Python+NumPy(برادبري وآخرون، 2018) -- 解释设计哲学的原始论文
- وثائق من الكتان: https://flax.readthedocs.io/-- مخزن شبكة JAX العصبية في جوجل
- باتريك كيدجر،إيكوينوكس: شبكات عصبية في JAX عبر PyTrees قابلة للتصوير والتحولات المصفاة(2021)-- فلانس Pythonic 替代方案
- DeepMind,Optax: تحويل وتحسين التراجع المكونات -- 标准 Optimizer 库
- أنت لا تعرف JAX(كولين رافيل، 2020) ---- مقالة عن JAX 陷与模式的实用指南,作者是T5 作者之一
