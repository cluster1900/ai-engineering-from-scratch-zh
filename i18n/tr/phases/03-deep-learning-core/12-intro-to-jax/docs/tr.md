# JAX Giriş

> PyTorch 会修改テンサー──TensorFlow 会构建图──JAX 会编译纯函数──最后这个点会改变您思考的方法──Deep Learning──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## Öğrenme hedefi

- JAX'in işlevi API'si ((jax.numpy、jax.grad、jax.jit、jax.vmap)
- 解释 PyTorch'in gayretli mutasyonu ile JAX'in işlevi biçimli bir düzenleme modeli arasındaki önemli tasarım farkı
- 应用 jit 编译和 vmap Vektorization,相比朴素Python 加速训练循环
- JAX'de basit bir ağ eğitimi, açık durum yönetimi ile PyTorch'un yönetici yöntemini karşılaştırır.

## 问题

PyTorch'te sinir ağını nasıl inşa edeceğinizi biliyorsunuz.`nn.Module`,调用 `.backward()`, Optimiser'ı daha da geliştirin.

Ama PyTorch'in DNA'sı bir kısıtlama içeriyor. Python'da her birini takip etmek için çok istekli.`tensor + tensor`Bu, bir tek çekirdek başlatmasıdır. Her bir eğitim adımının aynı Python kodunun yeniden yorumlanmasıdır.

Google DeepMind JAX'i kullanarak Gemini'yi eğitmektedir. Antropik JAX'i kullanarak Claude'u eğitmektedir. Bunlar küçük ölçekli işlemler değil, dünyadaki en büyük sinir ağları eğitimi çalışmalarından biridir.

JAX üç çeşit süper yeteneğe sahip NumPy: otomatik微分、JIT 编译到XLA、自動矢量化──你编写一个处理单个样本的函数──JAX, size bir seri işlem yapabilecek bir tane sağlar、计算 Gradient、编译为机器码并跨多设备运行函数──所有这些都不需要改变原始函数──

## 核心概念

### JAX 哲学

JAX bir fonksiyonel çerçeve.`.backward()`方法──取而代之 şunlardır:

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

Bu bir biçim tercih değildir. Bu bir düzenleme. JIT'in düzenleme işlemini yapabilmek için saf bir fonksiyon gerektirir.

### - Evet. - Evet.

JAX NumPy API'si hızlandırıcıda yeniden başlatıldı:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

Aynı fonksiyon adı. Aynı yayınlama kuralları. Aynı kesim 语义. Ama diziler GPU/TPU'da yer alır ve her işlem bir bilgisayar tarafından izlenebilir.

Bir anahtar fark:JAX dizileri değişmez.`a[0] = 5`Yazmaya çalışıyorum.`a = a.at[0].set(5)`İlk hafta değişir, sonra da anlarsın: değişmez bir şey.`grad`- Evet.`jit`和 `vmap`Bu tür dönüşümlerin nedenleri bir araya gelebilir.

### jax.grad:函数式 Autodiff

PyTorch, gradient'i tenzorlara bağlayıp...`.grad`) ︎ JAX ︎ ︎ ︎ ︎ ︎

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`接收一个函数,并返回一个计算 Gradient 的新函数──没有 `.backward()`调用──没有存储在 tensor上的计算图──渐变──只是另一个你可以调用、组合或JIT 编译的函数──

Herhangi bir şekilde bir araya gelebilir:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

İki aşama. Üç aşama. Yakuplar. Hesyenler.`grad`-PyTorch de bunu yapabilir.`torch.autograd.functional.hessian`Ama sonra da eklendi. JAX'de, bu temel.

Bu da:`grad`Sadece saf fonksiyon için uygundur. Fonksiyon içi baskı yapılmaz.

### JIT:编译到 XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

İlk kez kullanıldığında, JAX bu işlevi takip eder: hangi işlemlerin gerçekleşeceğini kaydeder, ancak gerçekte uygulanmaz. Sonra bu izleri XLA'ya Hızlandırılmış Düzsel Cevabı olarak gönderir. Yani Google TPU ve GPU'ların düzenleyicisine yöneliktir. XLA birleştirilmiş işlem, eksiksiz bellek kopyasını ortadan kaldırır ve optimize sonrası makineler kodları üretir.

后续调用会完全跳过Python──编译后代码会以C++ 速度在加速器上运行──

JIT'in yardımcı bir sahne:
- 訓練步骤(相同计算重复数千次)
- İfade ((( aynı model, farklı输入)
-                                                                                                                                                                                                                                                               

JIT'in zararlı bir sahne:
- 带有依赖值的 Python kontrol akışı işlevi`if x > 0`, içinde x izlenmiş dizidir)
- Bir次性計算 (), bir süre içinde yapılan işlemden daha fazla işlemden sonra yapılan işlemden daha fazla işlemden sonra yapılan işlemden daha fazla işlemden sonra yapılan işlemden daha fazla işlemden sonra yapılan işlemden daha fazla işlemden sonra yapılan işlemden daha fazla işlemden sonra yapılan işlemden sonra yapılan işlemden daha fazla işlemden sonra yapılan işlemden sonra yapılan işlemden sonra yapılan işlemden sonra yapılan işlemden sonra yapılan işlemden sonra yapılan işlemden sonra yapılan işlemden sonra gerçekleşir.
- 调试(tracing 会隐藏真实执行过程)

Kontrol akışı  limiti                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `jax.lax.cond`替代 `if/else`- Evet.`jax.lax.scan`替代 `for`循环── bunlar seçilebilir değil, fakat düzenlenme fiyatı──

### vmap: Otomatik vektörleştirme

Tek bir örnek işleme işlevi yazıyorsunuz:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`Bir parti işlevi için yükselteceğim:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`Yani: Yolda gitme.`params`Yapmak için bir grup`x`Çöp yapma. Hiç el hareket etmiyor.`for`循环──没有重塑──没有手动传递批量──JAX 会找出批量──维度,并对整个计算进行矢量化──

Bu bir şeker değil.`vmap`Vectory code'nin bir araya gelmesinden sonra Python'dan 10-100x daha hızlı çalışması mümkün.`jit`和 `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

模本 Gradient──一行代码──在 PyTorch 中, eğer hack kullanılmazsa, neredeyse imkansızdır──

### pmap:跨设备 Veriler paralellik

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`Bu işlem, tüm kullanılabilir cihazlara göre yapılır.`jax.lax.pmean`和 `jax.lax.psum`Çevreye kadar bir süreliğine.

Google kullanımı `pmap`(Ve onun halefi)`shard_map`) üzerinden binlerce TPU v5e çipleri                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `pmap`Tamamlanmış, tamamlanmış.

### Pytrees: Genel veri yapısı

JAX 操作は pytrees:由列、tuples、dicts 和 arrays 嵌套组合而成の構造──あなたの模型参数は一つの pytree:

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

Her JAX 转换:`grad`- Evet.`jit`- Evet.`vmap`- Evet, biliyorum.`jax.tree.map(f, tree)`- Evet .`f`应用到每个叶子上――这是优化器的一次性更新所有参数的方法:

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

Hiç .`.parameters()`方法──没有参数注册──树 结构就是模型──

### 函数式 vs 面向对象

PyTorch, durumunu nesne içinde depolamak için:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX kullanımı açık durumdaki saf işlevi:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

Paramları aktarılıyor. Hiçbir şey saklanmıyor. Hiçbir şey değiştirilmiyor. Bu, her fonksiyonun test edilebilir, bir araya gelebilir, bir araya gelebilir.

### JAX 生态

JAX size ilkeleri verir.

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

Optax standard Optimizer 库──它把渐变 (Adam、SGD、clipping) 与参数更新分离开来,让组合变得非常简单:

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### JAX ile ne zaman? PyTorch ile ne zaman?

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

诚实的答案是: JAX'i kullanmak için belirli nedenler yoksa PyTorch kullanmak gerekse gerek: TPU'yu ziyaret edilebilir, örneğe göre Gradient、超大规模多设备训练, Google/DeepMind/Anthropic 工作──

### JAX ortalamasındaki sıralama sayısı

JAX  hiç tüm devleti var. Her bir işlem için açık bir PRNG anahtarı gerekir:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

İlk başta bu insanı rahatsız eder. Ama bu PyTorch'ın yaptığı gibi, cihazlar ve yazılar arasında da gerçekçilik sağlıyor.`torch.manual_seed`Çoklu GPU'lar için yapılandırma


```figure
batchnorm-effect
```

## Yapın onu.

### 步骤1:Settup 和数据

JAX ve Optax'ı kullanarak MNIST'de 3 katlı MLP'yi eğiteceğiz. 784 giriş, iki bölümde 256 ve 128 nöronların gizli katları var. 10 çıkış sınıfı.

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

### 步骤 2: başlangıç parametreleri

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

O-initialization, manuel完成── üç PRNG anahtarı bir tohumdan ayrıldı ── her ağırlık hepsi içinde değişmez dizidir──────────────────────

### 步骤 3:Forward Pass

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

純函数──パラメータ 输入,预测 输出──没有 `self`, depolama durumu yok.`loss_fn`ZERO hesaplama çapraz entropi: yumuşak maksimum, log, negatif ortalama

### 步骤 4:JIT-Compiled  training Adım

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

`jax.value_and_grad`Bir kez geçmekle birlikte kaybı değerini ve derecesi geri getirmekle birlikte.`@jax.jit`Dekorator iki işlevi XLA'ya düzenleyecek. İlk düzenlenmeden sonra, her antrenman aşamasında Python'la bir daha temas olmayacak.

### Adım 5: Eğitim döngüsü

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

10 个时代――97 oranında test doğruluğu――第1 时代 较慢(JIT 编译)――第2-10 个时代 很快――

Dikkat et yok mu ?`.zero_grad()`- Hayır .`.backward()`- Hayır .`.step()`△ tüm yenilik bir kez bir birleşim fonksiyonunun kullanılmasıdır.`train_step`İçeride.

## Kullan

### Flaş: Google 标准

Flax en sık görülen JAX sinir ağı.`nn.Module`Geri dönmüş, ama açık durum yönetimi kullanıyor:

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

结构与 PyTorch 相同,但 `params`Modelden ayrılmış.`model.init()`Paramları oluşturmak.`model.apply(params, x)`运行前行通---model 对象没有状态---

### Dönem:Pythonik 替代方案

Equinox (Patrick Kidger tarafından oluşturulmuş)

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

Model 本身就是一個 pytree──不需要 `.apply()`◊参数就是模型的叶子──这更接近 JAX的思维方式──

### Optax:可组合 Optimizers

Optax 将 Gradient dönüşümü ve güncelleme 解:

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

Gradient kesimleri, öğrenme oranı ısınma ıkıtım:全部组合成一条变化链──每个变化都会看到 Gradient,修改它们,然后传给下一个──没有单体优化器类──

## - Söyle.

**安装：**

```bash
pip install jax jaxlib optax flax
```

GPU desteği için:

```bash
pip install jax[cuda12]
```

TPU'da kullanılıyor:

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- İlk kez JIT 调用很慢 (慢) 编译 (编译) 〜 预先加热 (tan önce 暖化) 〜
- 避免在 JIT 内部使用Python 循环 穿越JAX arrays──使用`jax.lax.scan`Ya da`jax.lax.fori_loop`- Evet.
- `jax.debug.print()`JIT'de çalışabilmek için.`print()`- Hayır.
- Kullanım`jax.profiler`Ya da TensorBoard yapma profilı. XLA 编译可能藏瓶──
- JAX 默认会预分配 75% GPU belleği 设置`XLA_PYTHON_CLIENT_PREALLOCATE=false`- İşe yarayabilir.

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`: bir kullanılabilir JAX Optimizer 配置の提示
- `outputs/skill-jax-patterns.md`: JAX içindeki fonksiyonel kalıpları kapsayacak bir beceri

## 练习

1. 给 MLP 添加 dropout──在 JAX 中, dropout 需要一个PRNG key:把 key 穿越前进通过,并为每个 dropout layer split──比较使用和不使用 dropup时的测试精度──

2. Kullanım`jax.vmap`32 张 MNIST görüntüleri içeren bir parti için 计算对样本 Gradient――计算对样本的 Gradient规范―― hangi örneklerin en büyük Gradient'i vardır, neden?

3. Bir tane kullan.`mlp_forward(params, x)`替换手动前进函数, onu herhangi bir sayının katmanlarına uygulanabilir hale getirmek.`jax.tree.leaves`Kendinden derinlik belirle.

4. Benchmark 使用和不使用 `@jax.jit`Bu yüzden, bu programın ilk kez kullanıldığı bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir programın, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir program, bir, bir program, bir program, bir program, bir program, bir, bir program, bir program, bir program

5. 通过组合 `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现 Gradient clipping──分别使用和不使用 clipping 进行训练──绘制训练过程中的 Gradient norm,观察效果──

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

- JAX belgesi: https://jax.readthedocs.io/-- 官方文档,包含关于Graduate   和 vmap 的优秀教程
- JAX: Python + NumPy programlarının yapışkan dönüşümleri(Bradbury et al., 2018) -- 解释设计哲学的原始论文
- İpek belgesi: https://flax.readthedocs.io/-- Google ' ın JAX sinir ağı kütüphanesi
- Patrick Kidger,Equinox: JAX'deki sinir ağları çağırabilir PyTrees ve filtreli dönüşümler üzerinden(2021)-- Flax'ın Pythonic 替代方案
- DeepMind,Optax: Kompozitör gradient dönüşümü ve optimizasyonu -- 标准 Optimizer 库
- You Don't Know JAX(Colin Raffel, 2020) --                                                                                                                                                                                                                                                      
