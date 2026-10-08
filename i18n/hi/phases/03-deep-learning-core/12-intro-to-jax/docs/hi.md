# JAX प्रवेश

> PyTorch 会修改テンसर──TensorFlow 会构建图形──JAX 会编译纯函数──最后这个点会改变你思考的方法──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## 学习目标

- JAX का उपयोग करें फ़ंक्शन式 API(jax.numpy、jax.grad、jax.jit、jax.vmap)编写纯函数 神经网络代码
- 解释 PyTorch के उत्सुक उत्परिवर्तन और JAX के फंक्शनल संकलन मॉडल के बीच महत्वपूर्ण डिजाइन अंतर
- 应用 jit 编译和 vmap वेक्टरिज़ेशन,相比朴素Python加快训练循环
- JAX में एक सरल नेटवर्क को प्रशिक्षित करते हुए, यह स्पष्ट स्थिति प्रबंधन और PyTorch के आकस्मिक आइटम विधि के साथ तुलना करेगा

## 问题

आप पहले से ही जानते हैं कि कैसे PyTorch में तंत्रिका नेटवर्क का निर्माण है. आप एक परिभाषित करते हैं।`nn.Module`,调用 `.backward()`, इसे अनुकूलन करने के लिए आगे आगे. यह काम कर सकता है. लाखों लोग इसका उपयोग कर रहे हैं.

लेकिन PyTorch के डीएनए एक बंधन में डाल दिया हैः यह Python में उत्सुक होगा, प्रत्येक के लिए एक-एक ट्रैकिंग ऑपरेशन।`tensor + tensor`यह एक अलग kernel लॉन्च है। प्रत्येक प्रशिक्षण चरण में, आपको 2,048 TPUs के माध्यम से प्रशिक्षण की आवश्यकता होगी।

गूगल डीपमाइंड ने जेएएक्स का इस्तेमाल किया जेमिनी को प्रशिक्षित किया। मानव ने जेएएक्स का इस्तेमाल किया क्लाउड को प्रशिक्षित किया। ये सभी छोटे पैमाने पर ऑपरेशन नहीं हैं, बल्कि पृथ्वी पर सबसे बड़े न्यूरल नेटवर्क में से एक हैं। उन्होंने जेएएक्स का चयन किया, क्योंकि यह आपके प्रशिक्षण चक्र को एक संकलित प्रोग्राम के रूप में रखता है, न कि एक पंक्ति पायथन को।

JAX में तीन प्रकार की सुपरकपैबिलिटी है NumPy: स्वचालित微分、JIT 编译到XLA、 स्वचालित वेक्टरिज़ेशन──आप एक एकल नमूना का संसाधित करने वाले फ़ंक्शन को संपादित करते हैं──JAX आपको एक बैच संसाधित करने योग्य फ़ंक्शन देगा──计算 ग्रेडिएंट、编译为机器码并跨多个设备运行的函数──所有这些都不需要改变原始函数──

## 核心概念

### JAX 哲学

JAX एक फ़ंक्शनल फ्रेमवर्क है।`.backward()`方法──取而代之 यह हैः

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

यह एक ही प्रकार का कार्य है, जिसमें कोई दुष्प्रभाव नहीं है। यह एक ही प्रकार का कार्य है।

### jax.numpy: परिचित के शीर्ष स्तर

JAX ने Accelerator पर NumPy API को पुनः लागू किया हैः

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

समान कार्यनामों में से एक है। समान प्रसारण नियम। समान स्लाइंग का अर्थ है। लेकिन सरणी GPU/TPU पर स्थित है, और प्रत्येक ऑपरेशन को एक संकलक द्वारा ट्रैक किया जा सकता है।

एक महत्वपूर्ण अंतरः जैक्स सरणी अपरिवर्तनीय है।`a[0] = 5`और लिखनाः`a = a.at[0].set(5)` यह पहले सप्ताह में अलग दिखाई देगा, फिर आप समझेंगेः अपरिवर्तनीय सही है `grad``jit`和 `vmap`इस प्रकार के परिवर्तन के कारणों को एक साथ रखा जा सकता है।

### jax.grad: फ़ंक्शन फ़रम ऑटोडिफ़

PyTorch डाल ग्रेडिएंट पेश करने के लिए Tensors`.grad`) ऊपर──JAX डाल ग्रेडिएंट 附附到函数上──

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`接收一个函数,并返回一个计算渐变的新函数──没有 `.backward()`调用──没有存储在 tensors上的计算图──渐变──只是另一个你可以调用、组合或JIT 编译的函数──

यह किसी भी तरह से संयोजन किया जा सकता हैः

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

दो चरणों में से एक है।`grad` Get──PyTorch भी यह कर सकते हैं`torch.autograd.functional.hessian`), लेकिन यह बाद में जोड़ा गया था.

约束是:`grad`केवल शुद्ध फ़ंक्शन के लिए लागू होते हैं। फ़ंक्शन के अंदर कोई प्रिंट नहीं होता है।

### jit:编译到XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

पहली बार प्रयुक्त होने पर,JAX इस फ़ंक्शन का पता लगाएगाः यह रिकॉर्ड करता है कि कौन से ऑपरेशन हुए हैं, लेकिन वास्तव में उन्हें निष्पादित नहीं करता है। इसके बाद यह इस ट्रैक को XLA को सौंप देता है।

后续调用会完全跳过Python──编译后代码会以C++ 速度在加速器上运行──

JIT उपयोगी दृश्यः
- 訓練步骤(相同计算重复数千次)
- इन्फेरेंस ((相同模型,不同输入)
- किसी भी समान रूप से आकार में कई बार इस्तेमाल किया फ़ंक्शन

JIT के हानिकारक दृश्यः
- 带有依赖值的 Python नियंत्रण प्रवाह के फ़ंक्शन(उदाहरण के लिए `if x > 0`, जिसमें से x है पता लगाया सरणी)
- एक बार के लिए गणना (एक बार के लिए गणना)
- 调试(tracing 会隐藏真实执行过程)

नियंत्रण प्रवाह की सीमा वास्तविकता है।`jax.lax.cond`替代 `if/else``jax.lax.scan`替代 `for`循环── ये विकल्प नहीं, बल्कि संकलन की कीमत हैं──

### vmap: स्वचालित वेक्टरिज़ेशन

आप एक एकल नमूना के लिए एक समारोह को संसाधित करने के लिए लिखते हैंः

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`एक बैच के कार्य को संभालने के लिए इसे उन्नत करेगाः

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`इसका मतलब है: मत जाओ`params`                                                                                                                                                                                                                                                              `x`                                                                                                                                                                                                                                                              `for`循环──没有重塑──没有手动传递批量──JAX 会找出批量──维度,并对整个计算进行向量化──

यह भाषा नहीं है।`vmap`वेक्टरकृत कोड के बाद से उत्पन्न होगा, जो पायथन की तुलना में 10-100x तेजी से चल रहा है।`jit`和 `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

逐样本 Gradient──一行代码──在 PyTorch中, यदि हैक की आवश्यकता नहीं है, तो यह लगभग असंभव है──

### pmap:跨设备 डेटा समानांतर

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`समारोह को सभी उपलब्ध उपकरणों (GPU/TPU) पर कॉपी करके, बैच में विभाजित नहीं किया गया है।`jax.lax.pmean`和 `jax.lax.psum`会跨设备同步 ग्रेडिएंट

गूगल उपयोग `pmap`(और इसके उत्तराधिकारी)`shard_map`) हजारों TPU v5e चिप्स  प्रशिक्षण मिथुनों 编程模型是:编写单设备版本,用 `pmap`包裹,完成──

### पाइट्रीः सामान्य डेटा संरचना

JAX 操作是pytrees:由列,tuples,dicts 和 arrays 嵌套组合而成的结构──你的模型参数就是一个 pytree:

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

प्रत्येक JAX 转换:`grad``jit``vmap`, तुम जानते हो कैसे एक प्रश्न के माध्यम से गुजरना है.`jax.tree.map(f, tree)` 会把 `f` प्रत्येक पाना पर लागू करें  यह ऑप्टिमाइज़र एक बार सभी तत्वों को अपडेट करने का तरीका हैः

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

 नहीं `.parameters()`方法──没有参数注册──树 结构就是模型──

### 函数式 vs 面向对象

PyTorch स्थिति को वस्तु के अंदर संग्रहीत करेंः

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX उपयोग स्पष्ट स्थिति के शुद्ध फ़ंक्शनः

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

पैराम्स को प्रेषित किया जाता है। कोई भी चीज़ संग्रहीत नहीं की जाती है। कोई भी चीज़ संशोधित नहीं की जाती है। इससे प्रत्येक फ़ंक्शन को परीक्षण योग्य, संकलित योग्य, संकलित किया जा सकता है। इसका मतलब यह भी है कि आप स्वयं पैराम्स का प्रबंधन करें, या फ्लेक्स या इक्विनोक्स जैसे संग्रह का उपयोग करें।

### जैक्स 生态

JAX  तुम्हें आदिमता देता है ♡库 तुम्हें उपयोग करने की आसानी देता हैः

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

Optax is standard Optimizer 库── यह Gradient transformation (आदम, एसजीडी, क्लिपिंग) के साथ तत्वों को अपडेट करने के लिए बहुत सरल बनाता हैः

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

###  जब मैं जैक्स,  जब मैं PyTorch के साथ

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

诚实的答案是: जब तक आप JAX का उपयोग करने के लिए विशिष्ट कारण नहीं है, या PyTorch का उपयोग करें। इन कारणों में शामिल हैंः TPU का उपयोग करने योग्य, प्रति नमूना ग्रेडिएंट, सुपर बड़े पैमाने पर कई उपकरणों के प्रशिक्षण की आवश्यकता, या Google / डीपमाइंड / मानव कार्य में ⋅

### JAX के बीच के आकस्मिक संख्या

JAX  कोई पूर्ण स्थान के साथ स्थिति नहीं है. प्रत्येक समय के लिए स्पष्ट PRNG कुंजी की आवश्यकता होती हैः

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

यह एक बार में लोगों को परेशान कर देगा. लेकिन यह उपकरण और संकलन के पार की व्यवहार्यता सुनिश्चित करता है, जबकि यह PyTorch की है.`torch.manual_seed`बहु-जीपीयू  सेटिंग में अनिश्चित गुणों


```figure
batchnorm-effect
```

##  इसे निर्माण

### 步骤1:संचलन और डेटा

हम एमएनआईएसटी में JAX और ऑप्टैक्स का उपयोग करेंगे एक 3-परत एमएलपी को प्रशिक्षित करें, 784  इनपुट, दो अलग-अलग 256 और 128  न्यूरॉन्स की छिपी परतें, 10  आउटपुट वर्गों 

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

### 步骤 2: प्रारंभिकरण

没有类──只有一个返回 pytree 的函数:

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

वह-प्रारंभ, हाथ से पूरा करना. तीन PRNG कुंजी एक बीज से बाहर विभाजित. प्रत्येक वजन में सभी में से एक अपरिवर्तनीय सरणी है.

### 步骤 3: फॉरवर्ड पास

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

纯函数── पैरामीटर 输入,预测 输出──没有 `self`, कोई भंडारण स्थिति नहीं है`loss_fn`शून्य गणना क्रॉस-एंट्रोपी: सॉफ्टमैक्स, लॉग, नकारात्मक औसत

### 步骤 4:JIT-संकलित  प्रशिक्षण चरण

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

`jax.value_and_grad`एक बार पास में एक ही समय में हानि मूल्य और ग्रेडिएंट  वापसी`@jax.jit`सजावटकर्ता दो कार्यों को XLA में संकलित करेगा। पहली बार संकलित होने के बाद, प्रत्येक प्रशिक्षण चरण में पाइथन से फिर से संपर्क नहीं होगा।

### 步骤 5: प्रशिक्षण चक्र

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

10 个时代―― लगभग 97% परीक्षण सटीकता――第一个时代 较慢(JIT 编译)――第 2-10 个时代 很快――

ध्यान दें कि क्या गायब हैः कोई नहीं `.zero_grad()`, कोई नहीं `.backward()`, कोई नहीं `.step()` संपूर्ण अद्यतन है एक बार संयोजन फ़ंक्शन调用── ग्रेडिएंट                                                                                                                                                                                                                                                     `train_step`内部──

## इसका उपयोग करें

### गुगल 标准

फ्लेक्स सबसे आम है JAX तंत्रिका नेटवर्क 库── यह `nn.Module`वापस आ गया है, लेकिन स्पष्ट स्थिति प्रबंधन का उपयोगः

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

 संरचना से PyTorch समान, लेकिन `params`मॉडल से अलग हो गया है।`model.init()`创建 params──`model.apply(params, x)`运行前行---model 对象没有状态---

### समोच्चःपाइटोनिक 替代方案

Equinox (पाट्रिक किडर द्वारा बनाया गया)

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

मॉडल 本身就是一个 pytree──不需要 `.apply()`◊参数就是模型 के पत्ते── यह जाक्स के विचार के अधिक निकट है──

### Optax:可组合 अनुकूलक

Optax 将 ग्रेडिएंट परिवर्तन के साथ अद्यतन 解:

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

ग्रेडिएंट क्लिपिंग, सीखने की दर वार्मिंग, वजन घटानेः全部组合成一条变化链── प्रत्येक परिवर्तन शहर ग्रेडिएंट देखेंगे, उन्हें संशोधित करेंगे, फिर इसे अगले को सौंप देंगे──没有单体优化器类──

## 交付 यह

**安装：**

```bash
pip install jax jaxlib optax flax
```

GPU समर्थन के लिए उपयोग किया जाता हैः

```bash
pip install jax[cuda12]
```

TPU में उपयोग किया गया गूगल क्लाउड):

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- प्रथम बार JIT 调用很慢 (慢) 编译) .
- 避免在JIT 内部使用Python लूप 穿越JAX सरणी──使用 `jax.lax.scan`या `jax.lax.fori_loop`
- `jax.debug.print()`जा सकता है जेआईटी 内部工作──普通 `print()`नहीं जाता है
- उपयोग `jax.profiler`या TensorBoard प्रोफ़ाइल बनाना.
- JAX 默认会预分配 75% के GPU स्मृति── सेटिंग `XLA_PYTHON_CLIENT_PREALLOCATE=false`उपयोग करने योग्य

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`: एक के लिए चुना जाता है उपयुक्त जैक्स अनुकूलक  विन्यास के लिए संकेत
- `outputs/skill-jax-patterns.md`: एक JAX में फ़ंक्शनल पैटर्न को कवर करने की क्षमता

## अभ्यास

1. 给 MLP 添加 dropout──在 JAX में,dropout 需要一个PRNG कुंजी:把钥匙 穿越前进通过,并为每个 dropout layer 分裂──比较使用和不使用 dropup 时的测试精度──

2. उपयोग `jax.vmap`32 张 MNIST छवियों के बैच में प्रत्येक नमूना के ग्रेडिएंट का गणना करें।

3. एक सामान्य उपयोग के साथ `mlp_forward(params, x)`替换手动前进 函数, इसे किसी भी संख्या की परतों के लिए उपयुक्त बनाएं。使用 `jax.tree.leaves`स्वतः गहराई निर्धारित करें

4. बेंचमार्क 使用和不使用 `@jax.jit`प्रशिक्षण चरणों में से एक है। 100 चरणों में से एक है। आपके हार्डवेयर पर गति की मात्रा कितनी है? पहली बार प्रयोग करने के लिए कितना है?

5. 通过组合 `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现 ग्रेडिएंट क्लिपिंग──分别使用和不使用剪贴 进行训练──绘制训练过程中的 ग्रेडिएंट मानदंड,观察效果──

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

- JAX प्रलेखन: https://jax.readthedocs.io/-- 官方文档,包含关于grad、jit 和 vmap के优秀教程
- जाक्सः पायथन+नंबरपी कार्यक्रमों के संगत परिवर्तन(ब्राडबरी और अन्य, 2018) -- 解释设计哲学的原始论文
- लिनन प्रलेखन: https://flax.readthedocs.io/-- गूगल के JAX तंत्रिका नेटवर्क 库
- पैट्रिक किडर,इक्विनोक्सः JAX में तंत्रिका नेटवर्क कॉल करने योग्य PyTrees और फ़िल्टर किए गए परिवर्तनों के माध्यम से(2021)-- फ्लेक्स का पायथोनिक 替代方案
- डीपमाइंड,ऑप्टैक्सः कम्पोजिबल ग्रेडिएंट ट्रांसफॉर्मेशन और ऑप्टिमाइज़ेशन -- 标准 Optimizer 库
- आपको जैक्स नहीं पता (कोलिन राफेल, 2020) -- एक लेख JAX के बारे में 陷与模式的实用指南,作者是T5作者之一
