# PyTorch 入门

> 你已经用活塞和曲轴造出了引擎。现在来学习大家真正会开的那一台。

**Type:** Build
**Languages:** Python
**Prerequisites:** Lesson 03.10 (Build Your Own Mini Framework)
**Time:** ~75 minutes

## 学习目标
- 使用 PyTorch 的 nn.Module、nn.Sequential 和 autograd 构建并训练 Neural Network
- 使用 PyTorch Tensor、GPU 加速，以及标准训练循环（zero_grad、forward、loss、backward、step）
- 将你从零实现的 mini framework 组件转换为对应的 PyTorch 等价实现
- 在同一任务上 profile 并比较你的纯 Python framework 与 PyTorch 的训练速度

## 问题
你已经有了一个可工作的 mini framework。Linear layers、ReLU、dropout、batch norm、Adam、一个 DataLoader、一个训练循环。它能用纯 Python 在圆形 Classification 问题上训练一个 4-layer network。

但在同一个问题上，它也比 PyTorch 慢 500 倍。

你的 mini framework 使用嵌套 Python 循环一次处理一个样本。PyTorch 会把相同操作分派给经过优化的 C++/CUDA kernels，并在 GPU 上运行。在单块 NVIDIA A100 上，PyTorch 训练一个 ResNet-50（25.6M parameters）处理 ImageNet（1.28M images）大约需要 6 小时。你的 framework 在同一任务上大约需要 3,000 小时——前提是它没有先耗尽内存。

速度不是唯一差距。你的 framework 没有 GPU 支持。没有 automatic differentiation——你为每个 module 手写了 backward()。没有 serialization。没有 distributed training。没有 mixed precision。除了 print 语句，没有办法 debug Gradient flow。

PyTorch 补齐了所有这些缺口。而且它保留了你已经建立起来的完全相同的心智模型：Module、forward()、parameters()、backward()、optimizer.step()。概念是一一对应的。语法几乎相同。区别在于，PyTorch 把十年的系统工程封装在了你从零设计出的同一个 interface 后面。

## 概念
### Why PyTorch Won

2015 年，TensorFlow 要求你在运行任何内容之前先定义一个 static computation graph。你构建 graph，编译它，然后把数据送进去。debug 意味着盯着 graph visualizations。修改 architecture 意味着从零重建 graph。

PyTorch 在 2017 年发布，采用了不同理念：eager execution。你写 Python。它立即运行。`y = model(x)` 会真的立刻计算 y，而不是“给稍后才会计算 y 的 graph 添加一个 node”。这意味着标准 Python debugging 工具都能工作。print() 能工作。pdb 能工作。forward pass 里的 if/else 能工作。

到 2020 年，市场已经给出了答案。PyTorch 在 ML research papers 中的占比从 7%（2017）增长到超过 75%（2022）。Meta、Google DeepMind、OpenAI、Anthropic 和 Hugging Face 都把 PyTorch 作为主要 framework。TensorFlow 2.x 也采用了 eager execution 作为回应——这相当于默认承认 PyTorch 的设计是正确的。

这节课的要点：developer experience 会复利增长。一个慢 10%、但 debug 快 50% 的 framework，每次都会赢。

### Tensors

Tensor 是一个多维数组，具有三个关键属性：shape、dtype 和 device。

```python
import torch

x = torch.zeros(3, 4)           # shape: (3, 4), dtype: float32, device: cpu
x = torch.randn(2, 3, 224, 224) # batch of 2 RGB images, 224x224
x = torch.tensor([1, 2, 3])     # from a Python list
```

**Shape** 表示维度。scalar 的 shape 是 ()，Vector 是 (n,)，Matrix 是 (m, n)，一批 images 是 (batch, channels, height, width)。

**Dtype** 控制精度和内存。

| dtype | Bits | Range | Use case |
|-------|------|-------|----------|
| float32 | 32 | ~7 位十进制数字 | 默认训练 |
| float16 | 16 | ~3.3 位十进制数字 | Mixed precision |
| bfloat16 | 16 | 与 float32 相同的范围，精度更低 | LLM 训练 |
| int8 | 8 | -128 到 127 | Quantized inference |

**Device** 决定计算发生在哪里。

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
x = torch.randn(3, 4, device=device)
x = x.to("cuda")
x = x.cpu()
```

每个操作都要求所有 Tensor 位于同一个 device 上。这是初学者最常遇到的 PyTorch 错误：`RuntimeError: Expected all tensors to be on the same device`。修复方法是在计算前把所有内容移动到同一个 device。

**Reshaping** 是常数时间操作——它改变的是 metadata，而不是 data。

```python
x = torch.randn(2, 3, 4)
x.view(2, 12)      # reshape to (2, 12) -- must be contiguous
x.reshape(6, 4)    # reshape to (6, 4) -- works always
x.permute(2, 0, 1) # reorder dimensions
x.unsqueeze(0)     # add dimension: (1, 2, 3, 4)
x.squeeze()        # remove size-1 dimensions
```

### Autograd

你的 mini framework 要求你为每个 module 实现 backward()。PyTorch 不需要。它会把 Tensor 上的每个操作记录到一个 directed acyclic graph（computational graph）中，然后反向遍历这个 graph，自动计算 Gradient。

```mermaid
graph LR
    x["x (leaf)"] --> mul["*"]
    w["w (leaf, requires_grad)"] --> mul
    mul --> add["+"]
    b["b (leaf, requires_grad)"] --> add
    add --> loss["loss"]
    loss --> |".backward()"| add
    add --> |"grad"| b
    add --> |"grad"| mul
    mul --> |"grad"| w
```

与你的 framework 的关键区别：PyTorch 使用 tape-based autodiff。每个操作都会在 forward pass 期间追加到一条“tape”上。调用 `.backward()` 会反向重放这条 tape。

```python
x = torch.randn(3, requires_grad=True)
y = x ** 2 + 3 * x
z = y.sum()
z.backward()
print(x.grad)  # dz/dx = 2x + 3
```

autograd 的三条规则：

1. 只有带有 `requires_grad=True` 的 leaf Tensor 会累积 Gradient
2. Gradient 默认会累积——每次 backward pass 前调用 `optimizer.zero_grad()`
3. `torch.no_grad()` 会禁用 Gradient tracking（在 evaluation 期间使用）

### nn.Module

`nn.Module` 是 PyTorch 中每个 Neural Network 组件的基类。你已经在 Lesson 10 中构建过这个抽象。PyTorch 的版本增加了 automatic parameter registration、recursive module discovery、device management 和 state dict serialization。

```python
import torch.nn as nn

class MLP(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.layer1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.layer2 = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        x = self.layer1(x)
        x = self.relu(x)
        x = self.layer2(x)
        return x
```

当你在 `__init__` 中把一个 `nn.Module` 或 `nn.Parameter` 赋值为 attribute 时，PyTorch 会自动注册它。`model.parameters()` 会递归收集每个已注册 parameter。这就是为什么你再也不需要像在 mini framework 里那样手动收集 weights。

核心 building blocks：

| Module | What it does | Parameters |
|--------|-------------|------------|
| nn.Linear(in, out) | Wx + b | in*out + out |
| nn.Conv2d(in_ch, out_ch, k) | 2D convolution | in_ch*out_ch*k*k + out_ch |
| nn.BatchNorm1d(features) | Normalize activations | 2 * features |
| nn.Dropout(p) | Random zeroing | 0 |
| nn.ReLU() | max(0, x) | 0 |
| nn.GELU() | Gaussian error linear | 0 |
| nn.Embedding(vocab, dim) | Lookup table | vocab * dim |
| nn.LayerNorm(dim) | Per-sample normalization | 2 * dim |

### Loss Functions 与 Optimizers

PyTorch 自带你构建过的所有内容的 production-ready 版本。

**Loss functions**（来自 `torch.nn`）：

| Loss | Task | Input |
|------|------|-------|
| nn.MSELoss() | Regression | 任意 shape |
| nn.CrossEntropyLoss() | Multi-class classification | Logits（不是 softmax） |
| nn.BCEWithLogitsLoss() | Binary classification | Logits（不是 sigmoid） |
| nn.L1Loss() | Regression（robust） | 任意 shape |
| nn.CTCLoss() | Sequence alignment | Log probabilities |

注意：`CrossEntropyLoss` 内部组合了 `LogSoftmax` + `NLLLoss`。传入 raw logits，而不是 softmax outputs。这是一个常见错误，会悄悄产生错误 Gradient。

**Optimizers**（来自 `torch.optim`）：

| Optimizer | When to use | Typical LR |
|-----------|-------------|-----------|
| SGD(params, lr, momentum) | CNNs、调优良好的 pipelines | 0.01--0.1 |
| Adam(params, lr) | 默认起点 | 1e-3 |
| AdamW(params, lr, weight_decay) | Transformers、fine-tuning | 1e-4--1e-3 |
| LBFGS(params) | Small-scale、second-order | 1.0 |

### The Training Loop

每个 PyTorch training loop 都遵循同一个 5 步模式。你已经在 Lesson 10 中学过。

```mermaid
sequenceDiagram
    participant D as DataLoader
    participant M as Model
    participant L as Loss fn
    participant O as Optimizer

    loop Each Epoch
        D->>M: batch = next(dataloader)
        M->>L: predictions = model(batch)
        L->>L: loss = criterion(predictions, targets)
        L->>M: loss.backward()
        O->>M: optimizer.step()
        O->>O: optimizer.zero_grad()
    end
```

规范模式：

```python
for epoch in range(num_epochs):
    model.train()
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
```

batch loop 内部五行。训练出 GPT-4、Stable Diffusion 和 LLaMA 的也是这五行。architecture 会变。data 会变。这五行不会变。

### Dataset and DataLoader

PyTorch 的 `Dataset` 是一个带有两个方法的 abstract class：`__len__` 和 `__getitem__`。`DataLoader` 在它之上封装 batching、shuffling 和 multi-process data loading。

```python
from torch.utils.data import Dataset, DataLoader

class MNISTDataset(Dataset):
    def __init__(self, images, labels):
        self.images = images
        self.labels = labels

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.images[idx], self.labels[idx]

loader = DataLoader(dataset, batch_size=64, shuffle=True, num_workers=4)
```

`num_workers=4` 会启动 4 个进程并行加载数据，同时 GPU 训练当前 batch。在 disk-bound workloads（large images、audio）上，仅这一项就可能让训练速度翻倍。

### GPU Training

把 model 移动到 GPU：

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
```

这会递归地把每个 parameter 和 buffer 移动到 GPU。然后在训练期间移动每个 batch：

```python
inputs, targets = inputs.to(device), targets.to(device)
```

**Mixed precision** 会在现代 GPU（A100、H100、RTX 4090）上把内存使用减半、吞吐量翻倍：forward/backward 使用 float16 运行，同时 master weights 保持在 float32：

```python
from torch.amp import autocast, GradScaler

scaler = GradScaler()
for inputs, targets in loader:
    with autocast(device_type="cuda"):
        outputs = model(inputs)
        loss = criterion(outputs, targets)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad()
```

### 对比：Mini Framework vs PyTorch vs JAX

| Feature | Mini Framework (L10) | PyTorch | JAX |
|---------|---------------------|---------|-----|
| Autodiff | Manual backward() | Tape-based autograd | Functional transforms |
| Execution | Eager（Python loops） | Eager（C++ kernels） | Traced + JIT compiled |
| GPU support | 无 | 有（CUDA、ROCm、MPS） | 有（CUDA、TPU） |
| Speed (MNIST MLP) | ~300s/epoch | ~0.5s/epoch | ~0.3s/epoch |
| Module system | Custom Module class | nn.Module | Stateless functions（Flax/Equinox） |
| Debugging | print() | print()、pdb、breakpoint() | 更难（JIT tracing 会破坏 print） |
| Ecosystem | 无 | Hugging Face、Lightning、timm | Flax、Optax、Orbax |
| Learning curve | 你已经构建过它 | 中等 | 陡峭（functional paradigm） |
| Production use | Toy problems | Meta、OpenAI、Anthropic、HF | Google DeepMind、Midjourney |


```figure
dropout-mask
```

## 构建它
一个只使用 PyTorch primitives 在 MNIST 上训练的 3-layer MLP。没有 high-level wrappers。没有 `torchvision.datasets`。我们自己下载并解析 raw data。

### 步骤 1：从原始文件加载 MNIST

MNIST 以 4 个 gzipped files 发布：training images（60,000 x 28 x 28）、training labels、test images（10,000 x 28 x 28）、test labels。我们下载它们并解析 binary format。

```python
import torch
import torch.nn as nn
import struct
import gzip
import urllib.request
import os

def download_mnist(path="./mnist_data"):
    base_url = "https://storage.googleapis.com/cvdf-datasets/mnist/"
    files = [
        "train-images-idx3-ubyte.gz",
        "train-labels-idx1-ubyte.gz",
        "t10k-images-idx3-ubyte.gz",
        "t10k-labels-idx1-ubyte.gz",
    ]
    os.makedirs(path, exist_ok=True)
    for f in files:
        filepath = os.path.join(path, f)
        if not os.path.exists(filepath):
            urllib.request.urlretrieve(base_url + f, filepath)

def load_images(filepath):
    with gzip.open(filepath, "rb") as f:
        magic, num, rows, cols = struct.unpack(">IIII", f.read(16))
        data = f.read()
        images = torch.frombuffer(bytearray(data), dtype=torch.uint8)
        images = images.reshape(num, rows * cols).float() / 255.0
    return images

def load_labels(filepath):
    with gzip.open(filepath, "rb") as f:
        magic, num = struct.unpack(">II", f.read(8))
        data = f.read()
        labels = torch.frombuffer(bytearray(data), dtype=torch.uint8).long()
    return labels
```

### 步骤 2： Define the Model

一个 3-layer MLP：784 -> 256 -> 128 -> 10。ReLU activations。用 Dropout 做 regularization。为了保持简单，不使用 batch norm。

```python
class MNISTModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(784, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 10),
        )

    def forward(self, x):
        return self.net(x)
```

output layer 产生 10 个 raw logits（每个 digit 一个）。不使用 softmax——`CrossEntropyLoss` 会在内部处理。

Parameter count：784*256 + 256 + 256*128 + 128 + 128*10 + 10 = 235,146。以现代标准来看非常小。GPT-2 small 有 124M。这个模型几秒内就能完成训练。

### 步骤 3： Training Loop

规范的 forward-loss-backward-step 模式。

```python
def train_one_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * images.size(0)
        _, predicted = outputs.max(1)
        correct += predicted.eq(labels).sum().item()
        total += labels.size(0)
    return total_loss / total, correct / total


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            correct += predicted.eq(labels).sum().item()
            total += labels.size(0)
    return total_loss / total, correct / total
```

注意 evaluation 期间的 `torch.no_grad()`。它会禁用 autograd，降低内存使用并加速 inference。没有它，PyTorch 会构建一个你根本不会使用的 computational graph。

### 步骤 4：把所有部分连接起来

```python
def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    download_mnist()
    train_images = load_images("./mnist_data/train-images-idx3-ubyte.gz")
    train_labels = load_labels("./mnist_data/train-labels-idx1-ubyte.gz")
    test_images = load_images("./mnist_data/t10k-images-idx3-ubyte.gz")
    test_labels = load_labels("./mnist_data/t10k-labels-idx1-ubyte.gz")

    train_dataset = torch.utils.data.TensorDataset(train_images, train_labels)
    test_dataset = torch.utils.data.TensorDataset(test_images, test_labels)
    train_loader = torch.utils.data.DataLoader(
        train_dataset, batch_size=64, shuffle=True
    )
    test_loader = torch.utils.data.DataLoader(
        test_dataset, batch_size=256, shuffle=False
    )

    model = MNISTModel().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    num_params = sum(p.numel() for p in model.parameters())
    print(f"Device: {device}")
    print(f"Parameters: {num_params:,}")
    print(f"Train samples: {len(train_dataset):,}")
    print(f"Test samples: {len(test_dataset):,}")
    print()

    for epoch in range(10):
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device
        )
        test_loss, test_acc = evaluate(
            model, test_loader, criterion, device
        )
        print(
            f"Epoch {epoch+1:2d} | "
            f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f} | "
            f"Test Loss: {test_loss:.4f} | Test Acc: {test_acc:.4f}"
        )

    torch.save(model.state_dict(), "mnist_mlp.pt")
    print(f"\nModel saved to mnist_mlp.pt")
    print(f"Final test accuracy: {test_acc:.4f}")
```

10 个 epochs 后的预期输出：~97.8% test accuracy。CPU 上训练时间：~30 秒。GPU 上：~5 秒。使用相同 architecture 的你的 mini framework：~45 分钟。

## 使用它
### 快速对比: Mini Framework vs PyTorch

| Mini Framework (Lesson 10) | PyTorch |
|---------------------------|---------|
| `model = Sequential(Linear(784, 256), ReLU(), ...)` | `model = nn.Sequential(nn.Linear(784, 256), nn.ReLU(), ...)` |
| `pred = model.forward(x)` | `pred = model(x)` |
| `optimizer.zero_grad()` | `optimizer.zero_grad()` |
| `grad = criterion.backward()` then `model.backward(grad)` | `loss.backward()` |
| `optimizer.step()` | `optimizer.step()` |
| 无 GPU | `model.to("cuda")` |
| 每个 module 都要手写 backward | Autograd 处理所有内容 |

interface 几乎完全相同。区别在于底层的一切。

### Saving and Loading Models

```python
torch.save(model.state_dict(), "model.pt")

model = MNISTModel()
model.load_state_dict(torch.load("model.pt", weights_only=True))
model.eval()
```

始终保存 `state_dict()`（parameter dictionary），而不是 model object。保存 model object 会使用 pickle，在你重构代码时会失效。State dicts 是可移植的。

### Learning Rate Scheduling

```python
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer, T_max=10
)
for epoch in range(10):
    train_one_epoch(model, train_loader, criterion, optimizer, device)
    scheduler.step()
```

PyTorch 自带 15+ schedulers：StepLR、ExponentialLR、CosineAnnealingLR、OneCycleLR、ReduceLROnPlateau。它们都能接入同一个 optimizer interface。

## 交付它
本课会产出两个 artifacts：

- `outputs/prompt-pytorch-debugger.md`——用于诊断常见 PyTorch 训练失败的 prompt
- `outputs/skill-pytorch-patterns.md`——PyTorch 训练模式的 skill reference

## 练习
1. **添加 batch normalization。** 在每个 linear layer 之后（activation 之前）插入 `nn.BatchNorm1d`。比较 test accuracy 和 training speed，与只使用 dropout 的版本对照。Batch norm 应该能在更少 epochs 内达到 98%+。

2. **实现 learning rate finder。** 用指数递增的 learning rate（从 1e-7 到 1.0）训练一个 epoch。绘制 loss vs LR。最佳 LR 位于 loss 开始上升之前。用它为 MNIST model 选择更好的 LR。

3. **迁移到 GPU 并使用 mixed precision。** 在 training loop 中加入 `torch.amp.autocast` 和 `GradScaler`。在 GPU 上测量使用和不使用 mixed precision 时的 throughput（samples/second）。在 A100 上，预期约 2x speedup。

4. **构建 custom Dataset。** 下载 Fashion-MNIST（格式与 MNIST 相同，但内容是 clothing items）。实现一个带有 `__getitem__` 和 `__len__` 的 `FashionMNISTDataset(Dataset)` class。训练相同的 MLP 并比较 accuracy。Fashion-MNIST 更难——预期约 ~88%，而不是 ~98%。

5. **用 SGD + momentum 替换 Adam。** 使用 `SGD(params, lr=0.01, momentum=0.9)` 训练。比较 convergence curves。然后加入 `CosineAnnealingLR` scheduler，看看 SGD 是否能在 epoch 10 时追上 Adam。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Tensor | “一个多维数组” | 一个有类型、device-aware 的数组，每个操作都内置 automatic differentiation 支持 |
| Autograd | “Automatic backprop” | 一个 tape-based 系统，在 forward pass 期间记录操作，然后反向重放它们以计算精确 Gradient |
| nn.Module | “一个 layer” | 任意 differentiable computation block 的基类——注册 parameters、支持 nesting、处理 train/eval modes |
| state_dict | “model weights” | 一个把 parameter names 映射到 Tensor 的 OrderedDict——trained model 的可移植、可序列化表示 |
| .backward() | “计算 Gradient” | 反向遍历 computational graph，为每个带有 requires_grad=True 的 leaf Tensor 计算并累积 Gradient |
| .to(device) | “移动到 GPU” | 递归地把所有 parameters 和 buffers 转移到指定 device（CPU、CUDA、MPS） |
| DataLoader | “data pipeline” | 一个 iterator，会对来自 Dataset 的数据执行 batching、shuffling，并可选地并行化 data loading |
| Mixed precision | “使用 float16” | 使用 float16 forward/backward 提升速度，同时保留 float32 master weights 以保证 numerical stability |
| Eager execution | “立即运行” | 操作在被调用时立即执行，而不是推迟到之后的 compilation step——这是区分 PyTorch 与 TF 1.x 的核心设计选择 |
| zero_grad | “重置 Gradient” | 在下一次 backward pass 前把所有 parameter gradients 置零，因为 PyTorch 默认会累积 Gradient |

## 延伸阅读
- Paszke et al., “PyTorch: An Imperative Style, High-Performance Deep Learning Library” (2019)——解释 PyTorch 设计权衡的原始论文
- PyTorch Tutorials: “Learning PyTorch with Examples” (https://pytorch.org/tutorials/beginner/pytorch_with_examples.html)——从 Tensor 到 nn.Module 的官方路径
- PyTorch Performance Tuning Guide (https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html)——mixed precision、DataLoader workers、pinned memory 和其他 production optimizations
- Horace He, “Making Deep Learning Go Brrrr” (https://horace.io/brrr_intro.html)——为什么 GPU training 很快，以及 PyTorch-specific optimization strategies
