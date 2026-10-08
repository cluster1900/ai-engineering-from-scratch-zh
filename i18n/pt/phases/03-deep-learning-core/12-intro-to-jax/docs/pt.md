# JAX entrada

> PyTorch 会修改テンサー──TensorFlow 会构建图表──JAX 会编译纯函数──最后这个点会改变你思考的方法──Deep Learning──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## Objectivo de aprendizagem

- Utilize JAX's Functional式 API(jax.numpy、jax.grad、jax.jit、jax.vmap)编写纯函数 神经网络代码
- Explicar a mudança ansiosa de PyTorch e a diferença de design entre o modelo de composição de funções de JAX
-  aplicativo 编译和 vmap Vectorization,相比朴素Python 加速训练循环
- No JAX, treinando uma rede simples, será comparado o gerenciamento de estado expresso com o método de visão de objetos do PyTorch

## 问题

Já sabes como construir uma rede neural no PyTorch.`nn.Module`,调用 `.backward()`, deixe o Optimizer avançar. Pode funcionar. Milhões de pessoas estão usando.

Mas o DNA do PyTorch está em um limite: ele vai estar ansioso em Python para localizar cada um.`tensor + tensor`Todo é um lançamento de kernel único. Cada passo de treinamento será reexplicado com o mesmo código Python. Se você precisar de 2.048 TPUs, antes de treinar um modelo de parâmetros de 5400 bilhões, isso não é problema. Até então, o processo de expansão vai arrastar você.

Google DeepMind usa JAX  treinar Gemini。 Antropic usa JAX  treinar Claude。 estes não são operações de pequena escala, mas uma das maiores redes neurais da Terra  treinar operações。 Eles escolheram JAX, porque ele considera seu ciclo de treinamento como um programa de compilação, em vez de uma série de Python 调用。

JAX é com três supercapacidades NumPy: automática微分、JIT 编译到XLA、自動矢量化── você escreve uma função de processamento de uma única amostra──JAX vai dar-lhe uma que pode processar batch、计算 Gradient、编译为机器码并跨多设备运行函数── tudo isso não precisa mudar a função original──

## 核心概念

### JAX 哲学

JAX é um quadro de funções.`.backward()`方法──取而代之 é:

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

Não é um preconceito de estilo. É um limite de 100x de aceleração.

### Jax.numpy: familiar de nível superior

JAX reimplemente a API NumPy no acelerador:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

O mesmo número de funções é igual à mesma de transmissão, mas as matrículas estão localizadas na GPU/TPU e cada operação pode ser rastreada pelo compilador.

Uma diferença importante: Arrays de JAX são imutáveis.`a[0] = 5`E escrever:`a = a.at[0].set(5)`Isto vai parecer diferente na primeira semana, depois perceberás:`grad`- Não.`jit`和 `vmap`Esta espécie de transformação pode ser composta por razões.

### jax.grad: função num formato Autodiff

PyTorch Colocar Gradiente Proposão a tensores`.grad`) 上。JAX Colocar Gradiente 附附到函数上。

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`接收一个函数,并返回一个计算 Gradient 的新函数──没有 `.backward()`调用── não há armazenamento em tensores  上的计算图── Gradiente 只是另一个你可以调用、组合或JIT 编译的函数──

Pode ser combinado:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

O que é o "caso de vida" de um homem?`grad`- Sim. - Sim. - Sim. - Sim.`torch.autograd.functional.hessian`Mas foi depois que foi adicionado.

O que é que é?`grad`Apenas aplicável a funções puras. Funções internas não têm impressão.

### JIT:编译到 XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

A primeira vez que a Java usa, a JAX vai rastrear esta função: ela registra algumas operações, mas não as executa realmente. Depois, ela entrega essa traçação a XLA (acelerada álgebra linear), ou seja, o Google está voltado para TPUs e GPUs.

后续调用会完全跳过Python──编译后代码会运行在加速器上以C++ 速度进行.

JIT tem uma cena útil:
- 訓練步骤(相同计算重复数千次)
- Inferência ((( mesma modelo, diferentes输入)
-  qualquer função de forma semelhante

JIT tem cenários prejudiciais:
- 带有依赖值的Python control flow的函数(por exemplo `if x > 0`, entre eles x é o rastreado array)
- Uma vez, a produção de um produto é muito mais que o tempo de produção.
- 调试(tracing 会隐藏真实执行过程)

O fluxo de controlo é real.`jax.lax.cond`替代   substituir`if/else`- Não.`jax.lax.scan`替代   substituir`for`循环── estes não são opções, mas os custos da composição──

### vmap: Vectorization automática

Você escreveu uma função de tratamento de um único modelo:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`Vai elevar-se para processar uma função de lote:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`Não se esqueça.`params`Fazer lote (s)`x`Não há movimentos.`for`循环──没有重塑──没有手动传递批量──JAX 会找出批量──维度,并对整个计算进行矢量化──

Não é um açúcar.`vmap`O código vectorizado será gerado após a fusão, executando uma velocidade de 10-100x mais rápida do que o Python.`jit`和 `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

Em PyTorch, se não for necessário hackear, é quase impossível fazê-lo.

### pmap:跨设备 Parallelismo de dados

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`会把函数复制到所有可用设备 (GPUs/TPUs) 上,并切分批──在函数内部,`jax.lax.pmean`和 `jax.lax.psum`会跨设备同步 Gradient。

Google utiliza `pmap`(e seus sucessores)`shard_map`) através de milhares de chips TPU v5e  treinamento Gemini。编程模型是:编写单设备版本,用 `pmap`- Encomendado, feito.

### Pitrees: estrutura de dados geral

JAX opera com as plantas: por listas, duplas, ditos e matrizes, em conjunto e em conjunto.

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

Cada JAX 转换:`grad`- Não.`jit`- Não.`vmap`Todos sabem como atravessar os montes.`jax.tree.map(f, tree)`- Não .`f` aplicado a cada folha. É assim que o Optimizer uma vez actualiza todos os parâmetros:

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

Não há nada .`.parameters()`方法──没有参数注册──tree 结构就是模型──

### Função de um objeto

PyTorch Colocar o estado armazenado em objetos interiores:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX utilização de uma função pura de estado expresso:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

Params são transferidos. Nada é armazenado. Nada é modificado. Isso permite que cada função seja testável, coletada, composta. Também significa que você deve administrar os params por si mesmo, ou usar folhas ou equinox como uma biblioteca.

### JAX 生态

JAX  dá-te primitivas...

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

Optax é o padrão de otimização 库.

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### Quando usar JAX, quando usar PyTorch?

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

诚实的答案是:除非你有使用JAX的具体理由,否则使用PyTorch──这些理由包括:可访问TPU、需要每样本 Gradient、超大规模多设备培训,或者在Google/DeepMind/Anthropic工作──

### Número de cadências no JAX

JAX  não tem estado de funcionamento completo. Cada operação precisa de uma chave PRNG:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

Primeiro, isso pode irritar. Mas garante a reprodutividade de trans-equipamentos e trans-compilagens, enquanto é o PyTorch.`torch.manual_seed`Em configuração de multi-GPU não pode ser garantida a sua propriedade.


```figure
batchnorm-effect
```

## Construí-lo

### 步骤1:Construção e dados

Usaremos JAX e Optax no MNIST para treinar uma MLP de 3 camadas, 784 entradas, duas divisões com 256 e 128 camadas ocultas de neurônios, 10 categorias de saída.

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

### 步骤 2: Inicializar parâmetros

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

Ele-inicialização, manu动完成── três chaves PRNG de uma semente dividido out── cada peso são todos em conjunto.

### 步骤 3: Passagem Avançada

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

纯函数──params 输入,预测 输出──没有 `self`Não há estado de armazenamento.`loss_fn`Desde zero, entropia cruzada:softmax, log, média negativa.

### 步骤 4: JIT-Compilado  treino Passo

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

`jax.value_and_grad`O valor da perda e o gradiente retornam simultaneamente.`@jax.jit`O decorador irá colocar as duas funções em XLA. Depois da primeira adoção, cada passo de treinamento não voltará a entrar em contato com Python.

### 步骤 5: ciclo de treinamento

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

10 个时代――大约 97% de exatidão de teste――第一个时代 较慢(JIT 编译)――第 2-10 个时代 很快――

Não há nada .`.zero_grad()`Não há nada .`.backward()`Não há nada .`.step()`△ toda a actualização é uma vez a função de conjunto é utilizada.`train_step`- A minha mãe.

## Use-o

### Linha: Google 标准

O linho é o mais comum da rede neural JAX.`nn.Module`Adiós, mas usando o controle de estado expresso:

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

结构与 PyTorch 相同, mas `params`Com o modelo separado.`model.init()`创建 params──`model.apply(params, x)`运行前行通行――model 对象没有状态――

### Equinoxo: Python 替代方案

Equinox (por Patrick Kidger 创建) 把模型表示为 pytrees:

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

Modelo 本身就是一個 pytree──不需要 `.apply()`◊ É o que faz com que o modelo seja mais leve.

### Optax:可组合 Optimizadores

Optax 将 Gradient transformação com atualização 解:

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

Clip de gradiente, taxa de aprendizagem aquecimento, perda de peso: tota组合成一条 transformes 链── cada transformação cidade vai ver o gradiente, modificá-los, então transmite-los para o próximo──

## Entrega-o

**安装：**

```bash
pip install jax jaxlib optax flax
```

Utilizando o suporte de GPU:

```bash
pip install jax[cuda12]
```

Utilizado em TPU ((Google Cloud):

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- Primeiro JIT 调用很慢 (慢) 编译 (编译)                                                                                                                                                                                                                                                      
-  evitar em JIT  interno usar Python loops  através de matrizes JAX。 usar `jax.lax.scan`Ou `jax.lax.fori_loop`- Não.
- `jax.debug.print()`Pode-se trabalhar no JIT.`print()`Não vai.
- Utilização `jax.profiler`Ou TensorBoard fazer perfil.
- JAX 默认会预分配 75% de memória de GPU── configuração `XLA_PYTHON_CLIENT_PREALLOCATE=false`- Não.

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`: um para escolher adaptado JAX Optimizer  Configuração de prompt
- `outputs/skill-jax-patterns.md`: um abrangendo JAX 中 função padrões de habilidade

## 练习

1. 给 MLP 添加 dropout──在 JAX, dropout 需要一个PRNG key:把键 穿越前进通过,并为每个 dropout layer split──比较使用和不使用 dropup时的测试精度──

2. Utilização `jax.vmap`Para um lote que contém 32 张 MNIST imagens  calcular por amostra Gradiente。 calcular por amostra a norma de Gradiente。 quais amostra têm o maior Gradiente, por quê?

3. Usar um uso comum.`mlp_forward(params, x)`替换手动前进函数, fazê-lo ser adequado para qualquer número de camadas.`jax.tree.leaves`Automaticamente determinar a profundidade.

4. Indicador de referência 使用和不使用 `@jax.jit`O que é o tempo de aceleração do seu hardware?

5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现 Gradient clipping──分别使用和不使用 clipping 进行训练──绘制训练过程中的 Gradient norma,观察效果──

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

- Documentação JAX: https://jax.readthedocs.io/-- 官方文档,包含关于 Graduate   和 vmap 的优秀教程
- JAX: transformações compostas de programas Python+NumPy(Bradbury et al., 2018) -- 解释设计哲学的原始论文
- Documentação de linho: https://flax.readthedocs.io/-- Google JAX Neural Network 库
- Patrick Kidger,Equinox: redes neurais no JAX através de PyTrees chamáveis e transformações filtradas(2021)-- Flax's Pythonic 替代方案
- DeepMind,Optax: transformação e otimização de gradientes compostos -- 标准 Optimizer 库
- You Don't Know JAX(Colin Raffel, 2020) -- Uma parte sobre JAX 陷与模式的实用指南, autor é um dos autores do T5
