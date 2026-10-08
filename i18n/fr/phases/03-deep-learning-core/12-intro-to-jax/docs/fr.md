# JAX Entrée

> PyTorch 会修改テンサー──TensorFlow 会构建图表──JAX 会编译纯函数──最后这个点会改变你思考的方法──Deep Learning──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## Objectif de l'apprentissage

- Utiliser JAX de fonctionnalité API(jax.numpy、jax.grad、jax.jit、jax.vmap)编写纯函数 神经网络代码
- Expliquer la mutation désireuse de PyTorch et la différence de conception entre le modèle de compilation de fonction et JAX
- 应用 jit 编译和 vmap Vectorisation, par rapport à Python
- En JAX, il s'entraîne sur un réseau simple, et compare la gestion de l'état explicite avec la méthode d'orientation d'Objets de PyTorch.

##  problématique

Tu sais comment construire un réseau neural en PyTorch.`nn.Module`,调用 `.backward()`, laissez Optimizer avancer. Il peut travailler. Des millions de personnes l'utilisent.

Mais l'ADN de PyTorch est en train de se limiter: il est désireux de suivre les opérations de Python.`tensor + tensor`Tout est un lancement de noyau unique. Chaque étape de formation sera réinterprétée par le même passage de Python.

Google DeepMind utilise JAX trainer Gemini。Anthropic utilise JAX trainer Claude。These ne sont pas des opérations à petite échelle, mais l'un des plus grands réseaux neuraux de la planète trainer les opérations。 Ils ont choisi JAX, parce qu'il considère votre cycle de formation comme un programme comptable, plutôt que une série de Python 调用。

JAX est doté de trois supercapacités numériques: automate microtones、JIT  compilé à XLA、 vectorisation automatique。 vous écrivez une fonction de traitement d'un seul échantillon。 JAX vous donnera une fonction capable de traiter un lot、 calculer Gradient、 compilé pour un code de machine et des fonctions qui fonctionnent sur plusieurs appareils。 toutes ces fonctions n'ont pas besoin de changer la fonction initiale。

## 核心概念

### JAX 哲学

JAX est un cadre de fonctionnement.`.backward()`Le processus de réception est le suivant:

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

Ceci n'est pas un préjugé de style. Ceci est une restriction de 100 fois la vitesse possible.

### Je suis un peu plus proche de toi.

JAX a réimplémenté l'API NumPy sur l'accélérateur:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

Les mêmes fonctions sont utilisées pour la diffusion, mais les arrays sont placés sur le GPU/TPU et chaque opération peut être suivie par un compteur.

Une différence clé: les tableaux JAX sont incontournables.`a[0] = 5`Il faut écrire:`a = a.at[0].set(5)`C'est une première semaine où ça se détourne, et tu comprendras que l'immutabilité est la vérité.`grad`- Je suis là.`jit`et `vmap`Ce type de transformation peut être composé de causes.

### jax.grad: fonctionnalité Autodiff

PyTorch met en place le gradient avec des tensors`.grad`) ︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎-︎

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`Recevoir une fonction,并返回一个计算 Gradient 的新函数──没有 `.backward()`调用── aucun stockage dans les tensors.  Gradient 只是 une autre fonction que vous pouvez调用、组合或 JIT 编译──

Il peut être assemblé:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

Deuxièmement, il est nécessaire de se préparer à la rédaction de la Bible.`grad`Je peux aussi le faire.`torch.autograd.functional.hessian`Mais c'est ce qui est ajouté plus tard.

Il est:`grad`Il ne s'agit que de fonction pure. Il ne s'agit pas d'une fonction interne imprimée.

### jit:编译到 XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

La première fois que l'on utilise, JAX trace cette fonction: elle enregistre les opérations qui ont eu lieu, mais ne les exécute pas réellement. Elle remet ensuite cette trace à XLA: l'algèbre linéaire accélérée, c'est-à-dire Google vers les TPU et les GPU.

后续调用会完全跳过Python──编译后代码会运行在加速器上以C++速度进行.

JIT a aidé à scène:
- 訓練步骤(相同计算重复数千次)
- Inference ((( le même modèle,不同输入)
- qualque fonction de forme similaire à l'entrée de plusieurs fois appelée

JIT avec des scènes de malheur:
- 带有依赖值的Python control flow的函数(exemple `if x > 0`, dont x est l' array tracé)
- Une fois de plus, le temps de calcul est supérieur à celui de la durée de la course.
- 调试(tracing 会隐藏真实执行过程)

Le contrôle des flux est réel.`jax.lax.cond`替代 `if/else`Il y a une autre.`jax.lax.scan`替代 `for`循环──These ne sont pas des options, mais des coûts de compilation──

### vmap: vectorisation automatique

Vous écrivez une fonction de traitement de l'échantillon unique:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`L'utiliser pour traiter une fonction de lot:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`Ça veut dire: ne pas suivre.`params`Faire des lots, en commun, en commun`x`Il n'y a pas de mouvement.`for`循环──没有重塑──没有手动传递批量──JAX 会找出批量──维度,并对整个计算进行向量化──

Ce n'est pas du sucre.`vmap`Codes vectoriés générés par fusion, fonctionnant à une vitesse de 10 à 100 fois plus rapide que Python.`jit`et `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

Dans PyTorch, si on ne peut pas le faire sans avoir besoin de hack, c'est presque impossible.

### pmap:跨设备 Parallélisme des données

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`La fonction est copiée à tous les appareils disponibles (GPU/TPU) et est distribuée en lots.`jax.lax.pmean`et `jax.lax.psum`Il y a aussi des étoiles.

Google utilisé `pmap`(et ses successeurs)`shard_map`) traversant des milliers de puces TPU v5e  entraîner Gemini。`pmap`- Tu vas le faire.

### PYTRES: structure de données générale

JAX est utilisé par les pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pytrees: pppppppppppppp: : p: p: p: p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:p:

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

Chaque JAX est un changement .`grad`- Je suis là.`jit`- Je suis là.`vmap`Tu sais comment traverser les arbres.`jax.tree.map(f, tree)`Je vais le faire .`f` appliquer à chaque feuille. C'est la façon dont Optimiser une fois de plus modifie tous les paramètres:

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

Il n' y a pas de`.parameters()`方法──没有参数注册──树 结构就是模型──

### 函数式 vs 面向对象

PyTorch Place l'état stocké dans l'objet interne:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX utilise une pure fonction de l'état explicite:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

Params sont transmises. Rien n'est stocké. Rien n'est modifié. Cela permet à chaque fonction de tester, de compiler, de compiler. Cela signifie aussi que vous devez gérer params par vous-même, ou utiliser des bases de données comme Flax ou Equinox.

### JAX 生态

JAX vous donne des primitifs.

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

Optax est un standard Optimizer 库. Il traite la transformation de gradient avec les paramètres actualisés.

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### Quand on utilise le JAX, quand on utilise le PyTorch ?

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

La réponse est: à moins que vous n'ayez des raisons spécifiques d'utiliser JAX, ou d'utiliser PyTorch.

### Nombre de cas au milieu de JAX

JAX n'a pas de statut de jeu complet. Chaque opération nécessite une clé PRNG explicite:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

D'abord, ça peut faire de la colère. Mais ça garantit la réévitabilité des trans-appareils et des trans-compilages, alors que c'est PyTorch.`torch.manual_seed`En multi-GPU  configure  incapable de garantir les propriétés 


```figure
batchnorm-effect
```

## - Je le construis.

### 步骤1:Configuration et données

Nous allons utiliser JAX et Optax dans le MNIST pour entraîner une MLP à 3 couches, 784 entrées, deux distinctions avec 256 et 128 couches cachées de neurones, 10 catégories de sortie.

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

### 步骤 2: paramètres de démarrage

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

Il-initialisation, manuel fini。 trois clés PRNG d'une graine à partir de la semence ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞

### 步骤 3: Pass de l'avant

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

純函数──params 输入, prédiction 输出──没有 `self`, sans état de stockage.`loss_fn`De la 0 à la entropie croisée:softmax,log,média négative,

### 步骤 4: JIT-Compiled entraînement étape

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

`jax.value_and_grad`Retour en valeur et en degré en même temps.`@jax.jit`Le décorateur va compiler les deux fonctions dans XLA. Après la première mise en œuvre, chaque étape de formation ne reviendra plus à Python.

### 步骤 5: cycle de formation

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

10 个时代――97%, la précision des tests――第1ère époque 较慢(JIT 编译)――第2-10 个时代 很快――

Attention à ce qui manque: pas de`.zero_grad()`Il n' y a pas de`.backward()`Il n' y a pas de`.step()`◊ Toute l'actualisation est une fois que la composition de la fonction est utilisée.`train_step`- Dans le fond.

## Utilisez-le

### Le code de la ligne

Le lin est le plus courant du réseau neural JAX.`nn.Module`Il est revenu, mais utilise la gestion de l'état explicite:

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

结构与 PyTorch 相同, mais `params`Avec le modèle séparé.`model.init()`创建 params。`model.apply(params, x)`运行前行传递――model 对象没有状态――

### Équinoxe: Python 替代方案

Equinox (en anglais: Equinox) est un modèle de la forme équinoxe.

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

Le modèle est un arbre.`.apply()`◊ Les paramètres sont les feuilles du modèle.

### Optax:可组合 Optimisateurs

Optax va faire une transformation progressive avec mise à jour 解:

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

Le taux d'apprentissage de la chaleur du poids déclin: totalement composé un article transformes Chaîne. Chaque transformation de la ville voit le degré, modifie-les, puis transmettent à l'autre.

## Je le livre.

**安装：**

```bash
pip install jax jaxlib optax flax
```

Utilisé pour le support GPU:

```bash
pip install jax[cuda12]
```

Pour le TPU:

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- La première fois que j'ai utilisé le JIT, j'ai été très lent.
- 避免在JIT 内部使用Python循环 穿越JAX arrays──使用 `jax.lax.scan`Ou `jax.lax.fori_loop`Il y a une autre.
- `jax.debug.print()`Il peut être utilisé dans le JIT.`print()`Je ne vais pas.
- Utilisation `jax.profiler`Ou TensorBoard faire un profil.
- JAX 默认会预分配 75% de la mémoire GPU.`XLA_PYTHON_CLIENT_PREALLOCATE=false`Il est possible de l'utiliser.

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`: un pour choisir l'optimisateur JAX
- `outputs/skill-jax-patterns.md`: une compétence couvrant JAX 中

## 练习

1. 给 MLP 添加 dropout──在 JAX, dropout 需要一个PRNG key:把 key 穿越前进通过,并为每个 dropout layer split──比较使用和不使用 dropout 时的测试精度──

2. Utilisation `jax.vmap`Pour un lot contenant 32 张 MNIST images  calculer par échantillon Gradient。 calculer par échantillon Gradient norme── quels échantillons ont le plus grand Gradient, pourquoi ?

3. Avec un usage commun.`mlp_forward(params, x)`替换手动前进函数, faire en sorte qu'il soit adapté à un nombre de couches.`jax.tree.leaves`Déterminer automatiquement la profondeur.

4. Indice de référence 使用和不使用 `@jax.jit`Quel est le taux d'accélération de votre matériel ?

5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现 Gradient clipping──分别使用和不使用剪贴 进行训练──绘制训练过程中的 Gradient norm,观察效果──

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

- Documents JAX: https://jax.readthedocs.io/-- 官方文档, contenant des cours de diplôme et de vmap
- JAX: transformations composables des programmes Python+NumPy (Bradbury et al., 2018) -- 解释设计哲学的原始论文
- Documents en lin: https://flax.readthedocs.io/-- Google JAX réseau neural 库
- Patrick Kidger,Equinox: réseaux neuraux dans JAX via des PyTrees appelables et des transformations filtrées(2021)-- Flax's Pythonic 替代方案
- DeepMind,Optax: transformation et optimisation des gradients composables -- 标准 Optimizer 库
- Vous ne savez pas JAX(Colin Raffel, 2020) -- Un article sur les pièges et les modèles de JAX, auteur est l'un des auteurs de T5
