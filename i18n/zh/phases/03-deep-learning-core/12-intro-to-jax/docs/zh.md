# 进入

> 鱼会修改子――子流会构建图表――JAX会编译纯函数――最后,这将改变你思考深度学习的方式――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## 学习目标

- 使用JAX的函数式API(jax.numpy、jax.grad、jax.jit、jax.vmap)编写纯函数神经网络代码
- 解释 PyTorch 的急动突变与 JAX 的函数式编译模型之间的关键设计差异
- 应用 jit 编译和 vmap 矢量化相比简单的Python 加速训练循环
- 在JAX中训练一个简单的网络,将对比显式状态管理与PyTorch的面对象方法

## 问题

你已经知道如何在 PyTorch 中构建神经网络.`nn.Module`调用`.backward()`让优化器继续前进. 它能工作.

但PyTorch的DNA内置了一个约束:它会在Python中渴望地逐个追踪操作.`tensor + tensor`每个训练步骤都将重新解释同一段Python代码. 你需要跨2,048个TPU训练一个5400亿参数模型之前,这没问题.

谷歌深度思维使用JAX训练双胞胎.人类使用JAX训练克劳德. 这些不是小规模操作,而是地球上最大的神经网络训练运行之一. 他们选择JAX,因为它把你的训练循环作为编译程序,而不是一串的Python调用.

JAX 是带有三种超能力的NumPy:自动微分、JIT 编译到XLA、自动向量化──你编写一个处理单个样本的函数──JAX会给你一个能够处理批量、计算级别、编译为机器码并跨多个设备运行的函数──所有这些都不需要改变原始函数──

## 核心概念

### 杰克斯哲学

JAX 是一个函数式框架.`.backward()`方法──取而代之之是:

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

这不是风格偏好. 这就是编译器约束. 编译要求纯函数:相同输入总是产生相同输出,没有副作用.

### 简单的表层

在加速器上,JAX重新实现了NumPy API:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

相同的函数名──相同的广播规则──相同的切割语义──但数组位于GPU/TPU上,并且每个操作都可以由编译器追踪──

一关键差异:JAX阵列是不可变的.`a[0] = 5`,我写下来:`a = a.at[0].set(5)`,这在第一周会变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变得变`grad`,我知道.`jit`和 `vmap`这类转换的原因可以组合.

### jax.grad:函数式自动调整

火把渐变 附加到子`.grad`) 上――JAX 把渐变 附着到函数上――

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`接收一个函数,并返回一个计算梯度的新函数──没有`.backward()`调用――没有存储在子上的计算图――渐变只是你可以调用的另一个组合或JIT编译的函数――

它可以任意组合:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

二阶导数――三阶导数――雅可比亚人――赫西亚人――全部通过组合 `grad`得到. 皮托奇也能做到这一点.`torch.autograd.functional.hessian`),但这是后来附加的. 在JAX中,它是基础.

约束是:`grad`函数内部不要有打印语句,它们会在追踪时运行,而不是执行时运行.

### 编译到XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

首次调用时,JAX 会追踪这个函数:它记录发生了一些操作,但并没有真正执行它们.然后它把这个痕迹交给XLA (加速线性代数),也就是谷歌面向TPU和GPU的编译器.

后续调用会完全跳过Python──编译后代码会在C++速度上运行──

让我们有帮助的场景:
- 训练步骤(同样的计算重复数千次)
- 推理 (相同模型,不同输入)
- 任何类似形状输入多次调用函数

,我知道你有什么问题.
- 带有依赖值的 Python 控制流的函数(例如 `if x > 0`它们中的x 是被追踪的数组)
- 一次性计算 (编译开销超过运行时间)
- 调试(追踪 会隐藏真实执行过程)

控制流量限制是真的存在的.`jax.lax.cond`替代`if/else`,我知道.`jax.lax.scan`替代`for`循环──这些不是可选项,而是编译的代价──

### 动向量化

你编写一个处理单个样本的函数:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`将把它升级为处理一批函数:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`的意思是:不要沿着`params`通过"共享"`x`没有手动`for`循环――没有转型――没有手动传递批量――JAX 会找到批量――维度,并对整个计算进行向量化――

这不是语法糖.`vmap`通过向量化代码生成后,运行速度比Python循环快10-100x.`jit`和 `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

在 PyTorch 中,如果没有黑客,几乎不可能做到.

### 跨设备数据平行

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`会把函数复制到所有可用的设备上,并切分批量.`jax.lax.pmean`和 `jax.lax.psum`通过设备同步的渐进.

谷歌使用`pmap`(以及其继任者)`shard_map`)跨数千个TPU v5e芯片 训练双子.`pmap`包裹,完成.

### 字符号:通用数据结构

JAX 操作是pytrees:由列表,tuples,dicts 和 array 嵌套组合而成的结构.

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

每个 JAX 转换:`grad`,我知道.`jit`,我知道.`vmap`知道如何穿过这个问题.`jax.tree.map(f, tree)`会把`f`应用到每个叶子上. 这就是优化器一次性更新所有参数的方式:

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

没有`.parameters()`方法──没有参数注册──树木结构就是模型──

### 函数式对象面向

 PyTorch 将状态存储在对象内部:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX 使用显式状态的纯函数:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

没有任何东西被存储.没有任何东西被修改. 这让每个函数都可测试,组合,编译.

### 简体中文绿色

简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单的简单

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

优化是标准优化库. 它把渐进变化 (Adam,SGD,clipping) 与参数更新分离开来,让组合变得非常简单:

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### 什么时候用JAX,什么时候用PyTorch

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

诚实的答案是:除非你有使用JAX的具体原因,否则使用PyTorch. 这些原因包括:可访问TPU.需要样本逐个进行渐进的超大规模多设备训练,或者在Google/DeepMind/Anthropic工作.

### JAX 中的随机数

没有全局随机状态. 每个随机操作都需要显然的PRNG键:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

首先,这会让人感到不安. 但它保证了跨设备和跨编译的可复性,而这是PyTorch的.`torch.manual_seed`在多GPU设置下无法保证的属性.


```figure
batchnorm-effect
```

## 构建它

### 步骤1:设置和数据

我们将使用JAX和Optax在MNIST上训练一个3层MLP──784个输入,两个分别有256个和128个神经元的隐藏层,10个输出类别──

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

### 步骤 2:初始化参数

没有类,只有一个返回字符的函数:

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

开始,手动完成──三个PRNG键从一个种子中分开──每个重量都是嵌套命令中不可变的阵列──

### 步骤3:前进通行

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

纯函数――参数输入,预测输出――没有`self`没有存储状态.`loss_fn`从零计算:软max、log、负值中──

### 步骤4:JIT编译 训练步骤

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

`jax.value_and_grad`通过一次,同时返回损失值和渐进值.`@jax.jit`装饰师将把两个函数都编译成XLA.

### 步骤5:训练循环

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

时代――约97%的测试精度――第一个时代 较慢――第2-10个时代 很快――

注意缺失了什么:没有`.zero_grad()`没有`.backward()`没有`.step()`△整整更新就是一次组合函数调用──渐变被计算出来,经过亚当转换,并应用到参数上,全部发生在`train_step`内部

## 使用它

### :谷歌标准

是最常见的JAX神经网络库.`nn.Module`通过使用显式状态管理:

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

结构与 PyTorch 相同,但`params`与模型分离.`model.init()`创建一个项目.`model.apply(params, x)`运行前行通行.模型对象没有状态.

### 方程:字thon 替代方案

方位 () 由Patrick Kidger创建) 把模型表示为 pytrees:

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

模型本身就是一个木.`.apply()`参数就是模型的叶子.

### 优化器

优化将渐进变化与更新 解:

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

渐进式剪辑,学习率升温,体重衰减:全部组合成一条变化链.每个变化都会看到渐进式,修改它们,然后传给下一个.

## 交付它

**安装：**

```bash
pip install jax jaxlib optax flax
```

用于GPU支持:

```bash
pip install jax[cuda12]
```

为了使用Google云:

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- 第一次JIT调用很慢了.
- 避免在JIT内部使用Python循环穿越JAX阵列──使用`jax.lax.scan`或`jax.lax.fori_loop`,我知道.
- `jax.debug.print()`可以在JIT内部工作──普通`print()`没有.
- 使用 `jax.profiler`或机板做个性.
- 预定分配75%的GPU内存设置`XLA_PYTHON_CLIENT_PREALLOCATE=false`可禁使用.

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`:一个用于选择合适的JAX优化器配置提示
- `outputs/skill-jax-patterns.md`:一个涵盖JAX 中函数式模式的技能

## 练习

1. 给MLP 添加落──在JAX中,落需要一个PRNG键:把键 穿过前进通过,并为每个落层分化──比较使用和不使用落时的测试精度──

2. 使用 `jax.vmap`为包含32张MNIST图像的批量 计算样本分数――计算样本分数规则――哪些样本具有最大分数,为什么?

3. 用一个通用的`mlp_forward(params, x)`替换手动前进函数,使其适用于任意数量的层次.`jax.tree.leaves`自动确定深度.

4. 基准使用和不使用 `@jax.jit`训练步骤――分别计时100步―― 在你的硬件上有多少加速幅度?第一次调用编译开销是多少?

5. 通过组合`optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现渐进剪辑──分别使用和不使用剪辑──进行训练──绘制训练过程中的渐进规范,观察效果──

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

-  JAX 文件: https://jax.readthedocs.io/官方文档,包含有关研究生和Vmap的优秀教程
- JAX:Python+NumPy程序的可组合转换(布拉德伯里等, 2018) -- 解释设计哲学的原始论文
- 料文件: https://flax.readthedocs.io/谷歌的JAX神经网络库
- 通过可调用的PyTrees和过转换的JAX的神经网络2021--
- Optax:可构成梯度转换和优化 -- 标准优化库
- 你不知道JAX(Colin Raffel,2020) -- 一份关于JAX陷与模式的实用指南,作者是T5作者之一
