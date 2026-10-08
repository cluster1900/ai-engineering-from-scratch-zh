# JAX entrada

> PyTorch 会修改 TensorFlow 会构建图表──JAX 会编译纯函数──最后这个点会改变你思考的方法──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## El objetivo del aprendizaje

- Utiliza JAX de la función API ((jax.numpy、jax.grad、jax.jit、jax.vmap)编写纯函数 神经网络代码
-  Explicar la diferencia de diseño entre la mutación ansiosa de PyTorch y el modelo de composición de funciones de JAX
- 应用 jit 编译和 vmap Vectorization,相比简单Python 加速训练循环
- En JAX entrenar una simple red, y comparar el manejo de estados de forma explícita con el método de PyTorch de cara a objetos

##  problemas

Ya sabes cómo construir una red neuronal en PyTorch.`nn.Module`,调用 `.backward()`, haga que el optimizador vaya más lejos. Puede funcionar. Millones de personas lo están usando.

Pero el ADN de PyTorch tiene un límite: se encuentra en Python ansioso por el seguimiento de cada uno.`tensor + tensor`Todo es un lanzamiento del núcleo individual. Cada paso de entrenamiento se reexplicará el mismo segmento de código Python. Cuando necesites pasar por 2.048 TPUs, entrenar un modelo de parámetros de 5400 millones de dólares, eso no es un problema.

Google DeepMind utiliza JAX  entrenamiento Gemini。Antropic utiliza JAX  entrenamiento Claude。 Estos no son operaciones a pequeña escala, sino una de las redes neuronales más grandes de la Tierra  entrenamiento de operaciones。 Ellos eligieron JAX, porque hace de su entrenamiento ciclo como un programa de compilación, en lugar de una serie de Python 调用。

JAX es un sistema de tres supercapacidades numéricas: automático微分、JIT 编译到XLA、自动向量化──编译到XLA、自动向量化──编译到XLA、自动向量化──编译到XLA. JAX te dará una función capaz de procesar un solo muestra. JAX te dará una función capaz de procesar un lote.

## 核心概念 核心概念 核心概念 核心概念

### JAX 哲学

JAX es un marco de funciones.`.backward()`方法──取而代之 es:

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

Esto no es un tipo de preferencia. Esto es un tipo de composición.

### Jax.numpy: familiar de la superficie

JAX ha reimplementado la API NumPy en el acelerador:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

La misma función se encuentra en la GPU/TPU, y cada operación puede ser rastreada por un compilador.

Una diferencia clave: las matrículas de JAX son invariables.`a[0] = 5`而要写:`a = a.at[0].set(5)`Esto se verá diferente en la primera semana, después entenderás: la inmutabilidad es la verdad.`grad`¿Qué es esto?`jit`Y `vmap`Este tipo de transformaciones pueden ser complejadas por razones.

### jax.grad: función de la función Autodiff

PyTorch pone el gradiente  adjunto a los tensores`.grad`) 上。JAX Colocar Gradiente 附附到函数上。

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`接收一个函数,并返回一个计算 Gradient 的新函数──没有 `.backward()`调用── no hay almacenamiento en los tensores.  Gradiente 只是 otro que puedes调用、组合或 JIT 编译的函数──

Puede combinarse de forma arbitraria:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

Dos clases de la enseñanza de la Biblia.`grad`得到──PyTorch también puede hacer esto.`torch.autograd.functional.hessian`), pero eso fue lo que se añadió más tarde. En JAX, es la base.

¿Qué es esto?`grad`Sólo se aplica a funciones puras. No hay una clave clara en el interior de la función. No se genera un número arbitrario.

### JIT:编译到 XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

La primera vez que se utiliza, JAX traza esta función: registra que ocurrieron algunas operaciones, pero no las ejecuta realmente. Luego entrega esta pista a XLA (acelerado álgebra lineal), es decir, Google (facing towards TPUs and GPUs) ⋅ XLA se combina con la operación, elimina las copias de memoria superfluas y genera código de máquina optimizado.

后续调用会完全跳过Python──编译后代码会运行在加速器上以C++ 速度进行.

JIT tiene un escenario útil:
- 訓練步骤(同一樣計算重复数千次)
- Inferencia ((( idéntico modelo, diferente输入)
-  Cualquier función de forma similar

JIT tiene un escenario malo:
- 带有依赖值的Python control flow de las funciones de ejemplos `if x > 0`, de los cuales x es el conjunto rastreado)
- Una vez se calcula la cantidad de tiempo que se calcula
- 调试(tracing 会隐藏真实执行过程)

El flujo de control 限制是真实存在的──`jax.lax.cond`替代   en el`if/else`¿Qué es eso?`jax.lax.scan`替代   en el`for`循环──These no son opciones, sino los costos de la compilación──

### vmap: Vectorization automática

Usted redactó una función de procesar un solo ejemplar:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`Lo mejoraré para procesar una función de lote:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`Quiero decir: no te muevas.`params`hacer lote de la`x`De la primera vez que se hace el lote.`for`循环──没有重塑──没有手动传递批量──JAX 会找出批量 维度,并对整个计算进行矢量化──

Esto no es un lenguaje.`vmap`Se generará un código vectorizado después de la fusión, que se ejecuta a una velocidad de 10-100 veces más rápida que Python.`jit`Y `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

En PyTorch, si no se necesita hackear, es casi imposible hacerlo.

### pmap:跨设备 Paralelamente de datos

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`Se puede copiar la función a todos los dispositivos disponibles (GPUs/TPUs) en el conjunto.`jax.lax.pmean`Y `jax.lax.psum`Mejorar el nivel de la tecnología.

Google utiliza `pmap`(y sus sucesores)`shard_map`) a través de miles de chips TPU v5e  entrenar Gemini。`pmap`包裹,完成.

### Pitrees: estructura de datos generales

JAX opera con los árboles: de listas, tuplos, dictos y matrices, y de la estructura de los mismos.

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

Cada uno de ellos está en el mismo lugar .`grad`¿Qué es esto?`jit`¿Qué es esto?`vmap`, todos saben cómo atravesar los árboles.`jax.tree.map(f, tree)`¿ Qué ?`f` aplicado a cada hoja. Así es como Optimizer una vez actualiza todos los parámetros:

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

No hay .`.parameters()`方法──没有参数注册──树 结构就是模型──

### Función de la función frente a la función de la función

PyTorch Colocar el estado de almacenamiento en el objeto interno:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX utiliza la función pura de estado de expresión:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

Params fueron introducidos. Nada se guardó. Nada se modificó. Esto permite que cada función sea probada, compuesta, compuesta. También significa que debes administrar params por ti mismo, o usar una biblioteca como Flax o Equinox.

### JAX 生态

JAX te da primitivas... te da facilidad de uso.

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

Optax es el estándar de optimización. Se trata de la transformación gradual (Adán, SGD, recorte) con los parámetros de actualización de la separación, hacer que la combinación sea muy simple:

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### ¿Cuándo usar JAX, qué cuando usar PyTorch?

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

诚实的答案是: excepto si tienes razones específicas para usar JAX, o usar PyTorch. Estas razones incluyen:

### Número de oportunidades en JAX

JAX  no tiene un estado de comprobación completo. Cada operación requiere una clave PRNG clara:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

Al principio esto molesta a la gente. Pero garantiza la capacidad de transcripción y transcripción, y es PyTorch.`torch.manual_seed`En la configuración de múltiples GPUs  no se puede garantizar la propiedad


```figure
batchnorm-effect
```

## Construirlo

### Paso 1: Configuración y datos

Usaremos JAX y Optax en MNIST para entrenar una MLP de 3 capas―784 entradas, dos de ellas tienen 256 y 128 capas ocultas de neuronas,10 clases de salida―

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

### Paso 2: Iniciar los parámetros

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

He-inicialización, manu动完成── tres claves PRNG de una semilla entre dividido out── cada peso 都是嵌套 dict 中的不可变阵列──

### Paso 3: Pasado delante

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

纯函数──params 输入, predicción 输出──没有 `self`, no hay estado de almacenamiento.`loss_fn`Desde el cálculo de la entropía cruzada:softmax,log,negativa media,

### Paso 4: JIT-Compilado  entrenamiento Paso

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

`jax.value_and_grad`Recaudación de pérdida y Gradiente`@jax.jit`El decorador pondrá ambas funciones en XLA. Después de la primera configuración, cada paso de entrenamiento no volverá a contactar con Python.

### Paso 5: ciclo de entrenamiento

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

10 épocas── aproximadamente 97% de la precisión de los ensayos── primera época 较慢(JIT 编译)──第 2-10 个 épocas 很快──

No hay nada .`.zero_grad()`, no hay `.backward()`, no hay `.step()`△ Toda la actualización es una vez la función de conjunto de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la función de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuadro de la cuento.`train_step`En el interior.

## Usalo

### Flax: Google 标准

El lino es la red neural JAX más común.`nn.Module`Además de regresar, pero usando la gestión de estado abierto:

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

结构与 PyTorch 相同, pero `params`Se separa de los modelos.`model.init()`Crear params.`model.apply(params, x)`运行前行通行――modelo 对象没有状态――

### Equinoccio:Pitónico 替代方案

Equinox (por Patrick Kidger) se traduce en pytrees:

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

modelo 本身就是一個 pytree──不需要 `.apply()`◊参数就是模型的叶子──这更接近 JAX的思维方式──

### Optax:可组合 Optimizadores

Optax 将 Gradient transformación con actualización 解:

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

El recorte de gradientes, la tasa de aprendizaje, el calentamiento, la pérdida de peso: todo se compone de una transformación, cada transformación ve un gradiente, los modifica y luego se transmite a un siguiente.

##  entregarlo

**安装：**

```bash
pip install jax jaxlib optax flax
```

Utilizado para soporte de GPU:

```bash
pip install jax[cuda12]
```

Utilizado en la nube de Google:

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- La primera vez que JIT 调用很慢 (调用很慢) 编译 (编译) ∼ benchmarking 之前先加热 (加热) ∼
-  evitar en JIT  interno usar los bucles Python  atravesando las matrices JAX― `jax.lax.scan`O `jax.lax.fori_loop`¿Qué es eso?
- `jax.debug.print()`Puede estar en JIT 内部工作──普通 `print()`No me voy.
- Uso `jax.profiler`O TensorBoard hacer perfil.
- JAX 默认会预分配 75% de la memoria de la GPU── configuración `XLA_PYTHON_CLIENT_PREALLOCATE=false`Es posible.

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`: Una para elegir adaptado JAX Optimizer  Configuración de la solicitud
- `outputs/skill-jax-patterns.md`: Una capacidad que cubre JAX en patrones de funciones

##  ejercicios

1. 给 MLP 添加 dropout──在 JAX, dropout 需要一个PRNG key:把 key 穿越前传,并为每一个 dropout layer split──比较使用和不使用 dropup时的测试精度──

2. Uso `jax.vmap`Para un lote que contiene 32 张 MNIST imágenes  calcular por muestra Gradiente― calcular por muestra la norma Gradiente― ¿cuál muestra tiene el Gradiente más grande, por qué?

3. Con un uso común.`mlp_forward(params, x)`替换手动前进函数, hacer que se aplique a cualquier cantidad de capas。使用 `jax.tree.leaves`Autónoma determina la profundidad.

4. Indicador de referencia 使用和不使用 `@jax.jit`¿Cuánto tiempo de aceleración tiene el equipo? ¿Cuánto tiempo de aceleración tiene el equipo?

5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现 Gradiente de recorte,..分别使用和不使用剪裁 进行训练,..

## 关键术语: "El hombre es un hombre"

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

- Documentación JAX: https://jax.readthedocs.io/-- 官方文档,包含关于Graduate,Jit 和 vmap的优秀教程
- JAX: transformaciones composibles de los programas Python+NumPy(Bradbury et al., 2018) -- 解释设计哲学的原始论文
- Documentación de lino: https://flax.readthedocs.io/-- Google de JAX red neuronal de la biblioteca
- Patrick Kidger,Equinox: redes neuronales en JAX a través de PyTrees llamables y transformaciones filtradas(2021)-- Flax's Pythonic 替代方案
- DeepMind,Optax: transformación y optimización de gradientes composibles -- 标准 Optimizer 库
- No sabes JAX(Colin Raffel, 2020) -- Una guía práctica sobre JAX 陷与模式, autor es uno de los autores de T5
