# JAX vào

> PyTorch 会修改 tensor──TensorFlow 会构建图表──JAX 会编译纯函数──最后这个点会改变你思考的方法──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 03 Lessons 01-10，基础 NumPy
**Time:** ~90 分钟

## Học mục tiêu

- Sử dụng JAX của hàm式 API(jax.numpy、jax.grad、jax.jit、jax.vmap)编写纯函数 Neural Network 代码
- Giải thích Sự khác biệt thiết kế quan trọng giữa đột biến nhiệt tình của PyTorch và mô hình biên dịch hàm của JAX
- 应用 jit 编译和 vmap Vectorization,相比简单Python 加速训练循环
- Trong JAX, đào tạo một mạng đơn giản, sẽ được thực hiện để đối chiếu với phương pháp quản lý trạng thái rõ ràng của PyTorch đối tượng đối diện

## 问题

Bạn đã biết làm thế nào để xây dựng mạng thần kinh trong PyTorch. Bạn đã định nghĩa một .`nn.Module`,调用 `.backward()`, để Optimizer đi tiếp. Nó có thể làm việc. Hàng triệu người đang sử dụng nó.

Nhưng DNA của PyTorch đặt một ràng buộc: nó sẽ rất thèm muốn theo dõi hoạt động của mỗi người trong Python.`tensor + tensor`Tất cả là một lần ra mắt hạt nhân độc lập. Mỗi bước đào tạo sẽ được giải thích lại cùng một phần mã Python. Nếu bạn cần vượt qua 2.048 TPU.

Google DeepMind sử dụng JAX  đào tạo Gemini。Anthropic sử dụng JAX  đào tạo Claude。These are not small scale operations, but one of the largest Neural Network  training operations on Earth。 Họ chọn JAX, vì nó đưa vòng đào tạo của bạn như một chương trình biên dịch, chứ không phải là một chuỗi Python 调用。

JAX là với ba loại siêu năng lực NumPy: tự động微分、JIT  biên dịch thành XLA、 tự động Vectorization。 bạn biên dịch một hàm xử lý một mẫu đơn lẻ。 JAX sẽ cung cấp cho bạn một hàm có thể xử lý lô、 tính toán Gradient、 biên dịch thành mã máy và trên nhiều thiết bị hoạt động。 tất cả những điều này không cần phải thay đổi hàm gốc。

## 核心概念

### JAX 哲学

JAX là một khung hàm. Không có loại, không có trạng thái biến đổi, không có.`.backward()`方法──取而代之 là:

| PyTorch | JAX |
|---------|-----|
| 带状态的 `nn.Module` 类 | 纯函数：`f(params, x) -> y` |
| `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| Eager execution | 通过 XLA 进行 JIT 编译 |
| `for x in batch:` 手动循环 | `jax.vmap(f)` 自动 Vectorization |
| `DataParallel` / `FSDP` | `jax.pmap(f)` 自动并行 |
| 可变的 `model.parameters()` | arrays 组成的不可变 pytree |

Đây không phải là một lựa chọn kiểu chữ. Đây là một quy tắc của một bộ máy biên dịch.

### Jax.numpy: quen quen thuộc của tầng trên

JAX đã tái triển khai NumPy API trên bộ tăng tốc:

```python
import jax.numpy as jnp

a = jnp.array([1.0, 2.0, 3.0])
b = jnp.array([4.0, 5.0, 6.0])
c = jnp.dot(a, b)
```

相同的函数名──相同的广播规则──相同的切割语义──但 arrays 位于 GPU/TPU 上,并且每个操作都可以由编译器追踪──

Một sự khác biệt quan trọng: Dòng JAX là không thể thay đổi. Không thể viết.`a[0] = 5`                                                                                                                                                                                                                                                              `a = a.at[0].set(5)`n tuần đầu tiên sẽ thấy sự biến đổi khác, sau đó bạn sẽ hiểu:`grad``jit`和 `vmap`Những biến đổi này có thể được kết hợp với các nguyên nhân.

### jax.grad: hàm tự động

PyTorch đưa Gradient được gắn vào các tensor`.grad`) 上。JAX Đặt Gradient 附附到函数上。

```python
import jax

def f(x):
    return x ** 2

df = jax.grad(f)
df(3.0)
```

`jax.grad`接收一个函数,并返回一个计算 Gradient 的新函数──没有`.backward()`调用── không lưu trữ trên các tensor trên của tính toán图── Gradient  chỉ là một hàm khác bạn có thể调用、组合或 JIT 编译的函数──

Nó có thể được kết hợp tùy chọn:

```python
d2f = jax.grad(jax.grad(f))
d2f(3.0)
```

二阶导数──三阶导数── Giacobia── Hessians──全部通过组合 `grad`得到──PyTorch cũng có thể làm được điều này.`torch.autograd.functional.hessian`Nhưng đó là những gì được thêm vào sau đó. Trong JAX, nó là cơ sở.

约束是:`grad`Chỉ áp dụng cho hàm đơn giản. Không cần in 语句.

### jit:编译到 XLA

```python
@jax.jit
def train_step(params, x, y):
    loss = loss_fn(params, x, y)
    return loss

fast_step = jax.jit(train_step)
```

Lần đầu tiên được sử dụng, JAX sẽ theo dõi chức năng này: nó ghi lại những hoạt động xảy ra, nhưng không thực sự thực hiện chúng. Sau đó nó chuyển giao các hoạt động này cho XLA (Accelerated Linear Algebra), tức là Google đối mặt với các TPU và GPU của biên tập viên. XLA sẽ kết hợp các hoạt động, loại bỏ quá nhiều kho lưu trữ, và tạo ra mã máy được tối ưu hóa.

后续调用会完全跳过Python──编译后代码会运行在加速器上以C++ 速度──

JIT có giúp đỡ cảnh:
- 训练步骤(相同计算重复数千次)
- Inference(相同模型,不同输入)
- Bất kỳ hàm nào được nhập nhiều lần trong hình dạng tương tự

JIT có cảnh sát:
- 带有依赖值 Python control flow 的函数(ví dụ `if x > 0`, trong đó x là trượt array)
- Một lần tính toán (编译开销超过运行时间)
- 调试(tracing 会隐藏真实执行过程)

Control flow 限制 là thực sự tồn tại của...`jax.lax.cond`替代 `if/else``jax.lax.scan`替代 `for`循环──These are not choosibles, but the cost of compiling──These are not choosibles, but the cost of compiling──These are not choosibles, but the cost of compiling──These are not choosibles, but the cost of compiling──These are not choosibles, but the cost of compiling──These are not choosibles, but the cost of compiling──These are not choosibles, but the cost of compiling──These are not choosibles, but are the cost of compiling──These are not choosives.

### vmap: tự động Vectorization

Bạn viết một hàm xử lý đơn mô hình:

```python
def predict(params, x):
    return jnp.dot(params['w'], x) + params['b']
```

`vmap`Sẽ nâng cấp nó để xử lý một hàm của một loạt:

```python
batch_predict = jax.vmap(predict, in_axes=(None, 0))
```

`in_axes=(None, 0)`Ý nghĩa là: đừng đi theo `params`Làm hàng loạt (共享), dọc theo`x`Ước gì tôi có thể làm một loạt.`for`Không chuyển đổi hình dạng, không chuyển giao hàng loạt, không tìm thấy kích thước, và thực hiện vectorization cho toàn bộ tính toán.

Đó không phải là một đường.`vmap`Sẽ tạo ra các mã hóa vector hóa sau khi kết hợp, chạy nhanh hơn Python 循环快 10-100x.`jit`和 `grad`组合:

```python
per_example_grads = jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))
```

Trong PyTorch, nếu không cần hack, hầu như không thể làm được.

### pmap:跨设备 Dữ liệu Phòng song

```python
parallel_step = jax.pmap(train_step, axis_name='devices')
```

`pmap`会把函数复制到所有可用设备 (GPU/TPU) trên,并切分批──在函数内部,`jax.lax.pmean`和 `jax.lax.psum`会跨设备同步 Gradient。

Google sử dụng `pmap`(và người kế nhiệm của nó)`shard_map`) xuyên qua hàng ngàn chip TPU v5e  huấn luyện Gemini。编程模型是:编写单设备版本,用 `pmap`包裹, hoàn thành.

### Phytrees: cấu trúc dữ liệu chung

JAX hoạt động là các cây: từ danh sách, gấp đôi, lệnh và mảng 嵌套组合而成的结构.

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 128)), 'b': jnp.zeros(128)},
    'layer3': {'w': jnp.zeros((128, 10)),  'b': jnp.zeros(10)},
}
```

Mỗi JAX 转换:`grad``jit``vmap`, Tớ biết cách đi qua các khu vực khác.`jax.tree.map(f, tree)`- Tôi sẽ...`f` áp dụng lên mỗi lá. Đây là cách Optimizer một lần cập nhật tất cả các tham số:

```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

Không có gì`.parameters()`方法──没有参数注册──树 结构就是模型──

### 函数式 vs 面向对象

PyTorch đặt trạng thái lưu trữ trong đối tượng bên trong:

```python
class Model(nn.Module):
    def __init__(self):
        self.linear = nn.Linear(784, 10)

    def forward(self, x):
        return self.linear(x)
```

JAX sử dụng hàm đơn của trạng thái hiển nhiên:

```python
def predict(params, x):
    return jnp.dot(x, params['w']) + params['b']
```

Params được truyền vào. Không có gì được lưu trữ. Không có gì được sửa đổi. Điều này cho phép mỗi hàm được kiểm tra, kết hợp, biên dịch. Nó cũng có nghĩa là bạn tự quản lý Params, hoặc sử dụng Thạch hoặc Tương dương như vậy.

### JAX 生态

JAX 给你原始性.

| Library | Role | Style |
|---------|------|-------|
| **Flax** (Google) | Neural Network layers | 带显式状态的 `nn.Module` |
| **Equinox** (Patrick Kidger) | Neural Network layers | 基于 Pytree，Pythonic |
| **Optax** (DeepMind) | Optimizers + LR schedules | 可组合的 Gradient transforms |
| **Orbax** (Google) | Checkpointing | 保存/恢复 pytrees |
| **CLU** (Google) | Metrics + logging | 训练循环工具 |

Optax là tiêu chuẩn Optimizer 库. Nó đưa chuyển đổi cấp độ (Adam, SGD, clip) với các tham số để chia cắt, để làm cho bộ kết trở nên rất đơn giản:

```python
optimizer = optax.chain(
    optax.clip_by_global_norm(1.0),
    optax.adam(learning_rate=1e-3),
)
```

### n khi nào dùng JAX, khi nào dùng PyTorch

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

诚实的答案是: trừ khi bạn có lý do cụ thể sử dụng JAX, hoặc sử dụng PyTorch.

### Số tùy chọn trong JAX

JAX không có trạng thái bất động toàn bộ. Mỗi hoạt động bất động đều cần một khóa PRNG rõ ràng:

```python
key = jax.random.PRNGKey(42)
key1, key2 = jax.random.split(key)
w = jax.random.normal(key1, shape=(784, 256))
```

Một lần đầu tiên nó sẽ làm cho mọi người khó chịu. Nhưng nó đảm bảo khả năng tái tạo của các thiết bị và các biên dịch khác nhau, và đó là của PyTorch.`torch.manual_seed`Trong nhiều GPU  cài đặt không thể đảm bảo thuộc tính


```figure
batchnorm-effect
```

##  xây dựng nó

### 步骤 1:Setting 和数据

Chúng tôi sẽ sử dụng JAX và Optax trên MNIST để đào tạo một MLP 3 tầng. 784 đầu vào, hai phần có 256 và 128 lớp thần kinh ẩn,10 loại đầu ra.

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

### 步骤 2: khởi tạo các tham số

Không có lớp, chỉ có một hàm của Pytree:

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

He-initialization,手动完成──三个 PRNG từ một hạt giống chia ra ‖ mỗi trọng lượng đều là嵌套 dict trong các mảng không thể thay đổi‖

### 步骤 3: Forward Pass

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

纯函数── Params 输入, dự đoán 输出──没有 `self`, không có trạng thái lưu trữ.`loss_fn`Từ zero tính toán cross-entropy:softmax、log、 âm trung bình。

### 步骤 4:JIT-Compiled 训练 bước

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

`jax.value_and_grad`会在一次通过中同时返回损失值和 Gradient──`@jax.jit`Decorator sẽ biên dịch cả hai hàm thành XLA. Sau khi lần đầu tiên được调用, mỗi bước tập luyện sẽ không tiếp xúc với Python nữa.

### Bước 5: vòng tròn tập luyện

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

10 个时代――约 97% độ chính xác thử nghiệm――第一个时代 较慢(JIT 编译)――第 2-10 个时代 很快――

chú ý thiếu gì: không có gì`.zero_grad()`, không có `.backward()`, không có `.step()`△ toàn bộ update là một lần tập hợp hàm调用──Gradient được tính ra, thông qua Adam 转换,并 áp dụng đến các parameter, tất cả xảy ra `train_step`内部──

## Sử dụng nó

### Lựa: Google 标准

Lạt là phổ biến nhất của mạng thần kinh JAX.`nn.Module`+ đã trở lại, nhưng sử dụng quản lý trạng thái rõ ràng:

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

结构与 PyTorch 相同, nhưng `params`Với mô hình phân biệt.`model.init()`创建 params。`model.apply(params, x)`运行 forward pass──model 对象没有状态──

### Equinox: Pythonic 替代方案

Equinox (được tạo bởi Patrick Kidger)

```python
import equinox as eqx

model = eqx.nn.MLP(
    in_size=784, out_size=10, width_size=256, depth=2,
    activation=jax.nn.relu, key=jax.random.PRNGKey(0)
)
logits = model(x)
```

mô hình 本身就是一个字树──不需要`.apply()`◊参数就是模型的叶子――这更接近 JAX的思维方式――

### Optax:可组合 Optimizers

Optax sẽ chuyển đổi Gradient với update 解:

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

Trình cắt gradient, tốc độ học tập nóng lên, giảm cân:全部组合成一条变化链――每个变化都会看到 gradient,修改它们,然后传给下一个――没有单体优化器类――

## 交付 nó

**安装：**

```bash
pip install jax jaxlib optax flax
```

Sử dụng hỗ trợ GPU:

```bash
pip install jax[cuda12]
```

dùng dùng TPU(Google Cloud):

```bash
pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html
```

**性能陷阱：**

- Lần đầu tiên JIT 调用很慢 (慢) 编译 (慢)                                                                                                                                                                                                                                                     
- 避免在JIT 内部使用Python loop 穿越JAX array──使用`jax.lax.scan`Hoặc`jax.lax.fori_loop`
- `jax.debug.print()`Có thể trong JIT 内部工作──普通 `print()`Không đi đâu.
- Sử dụng `jax.profiler`Hoặc TensorBoard làm hồ sơ.
- JAX 默认会预分配 75% bộ nhớ GPU 设置`XLA_PYTHON_CLIENT_PREALLOCATE=false`Có thể sử dụng.

**Checkpointing：**

```python
import orbax.checkpoint as ocp
checkpointer = ocp.PyTreeCheckpointer()
checkpointer.save('/tmp/model', params)
restored = checkpointer.restore('/tmp/model')
```

**本课会产出：**
- `outputs/prompt-jax-optimizer.md`: Một để chọn thích hợp JAX Optimizer  cấu hình prompt
- `outputs/skill-jax-patterns.md`: một bao gồm JAX 中 hàm mô hình kỹ năng

## 练习

1. 给 MLP 添加 dropout──在 JAX,dropout 需要一个PRNG key:把键 穿越前传,并为每个 dropout layer chia sẻ──比较使用和不使用 dropup时的测试精度──

2. Sử dụng `jax.vmap`Để một bao gồm 32 张 MNIST hình ảnh lô  tính từng mẫu Gradient  tính từng mẫu Gradient chuẩn 📌 mẫu nào có Gradient lớn nhất, vì sao?

3. dùng một cái dùng chung`mlp_forward(params, x)`替换手动前进函数, biến nó thích hợp cho bất kỳ số lượng lớp nào.`jax.tree.leaves`tự xác định độ sâu.

4. Benchmark 使用和不使用 `@jax.jit`Các bước tập luyện.  100 bước.  Số lượng sao vội của các máy tính của bạn là bao nhiêu?

5. 通过组合 `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))`实现 Gradient clipping──分别使用和不使用剪贴 进行训练──绘制训练过程中的 Gradient norm,观察效果──

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

- Tài liệu JAX: https://jax.readthedocs.io/- 官方文档,包含关于Graduate,Jit 和 vmap 的优秀教程
- JAX: biến đổi hợp nhất của các chương trình Python+NumPy(Bradbury et al., 2018) -- 解释设计哲学的原始论文
- Tài liệu bằng len: https://flax.readthedocs.io/-- Google của JAX Neural Network 库
- Patrick Kidger,Equinox: mạng thần kinh trong JAX thông qua các PyTrees có thể gọi và chuyển đổi lọc(2021)-- Phân Pythonic 替代方案 của Flax
- DeepMind,Optax: chuyển đổi và tối ưu hóa gradient hợp nhất
- You Don't Know JAX(Colin Raffel, 2020) -- Một phần về JAX 陷与模式的实用指南,作者是T5作者之一
