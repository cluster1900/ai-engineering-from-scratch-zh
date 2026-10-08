# PyTorch entrada

> Já criaste um motor com o pó e o tecido. Agora vamos aprender a que todos vamos realmente abrir.

**Type:** Build
**Languages:** Python
**Prerequisites:** Lesson 03.10 (Build Your Own Mini Framework)
**Time:** ~75 minutes

## Objectivo de aprendizagem
- Utilize PyTorch's nn.Module、nn.Sequencial 和 autograd 构建并训练 Neural Network
- Utilize PyTorch Tensor、GPU 加速,以及标准训练循环(zero_grad、forward、loss、backward、step)
- Transformar os componentes do mini framework de realização de zero em PyTorch de resposta
- Comparar o seu quadro Python puro com a velocidade de treinamento do PyTorch

## 问题
Você já tem uma mini-marca de trabalho. Layeres lineares, ReLU, drop-out, batch norm, Adam, DataLoader, um ciclo de treinamento. Pode usar Python em questão de Classificação de círculo para treinar uma rede de quatro camadas.

Mas no mesmo problema, também é mais lento que o PyTorch 500 vezes.

Seu mini framework utiliza um framework Python  ciclo uma vez para processar uma amostra. PyTorch vai distribuir a mesma operação para kernels C++/CUDA optimizados e executar em GPU. Em um único bloco NVIDIA A100, PyTorch treina uma ResNet-50 ((25.6M parâmetros) processar ImageNet ((1.28M imagens) requer cerca de 6 horas.

速度不是唯一差距──你的框架 没有 GPU 支持──没有自动区分你为每一个模块写回来了()──没有序列化──没有分布式训练──没有混合精度──除了打印 语句,没有办法调整 Gradient flow──

PyTorch  preencheu todas essas lacunas. Mas também mantém o mesmo modelo de mente que você já construiu: módulo, avanço, parâmetros, retrospectiva, otimização, passo, conceito de um mesmo.

## 概念
### Por que PyTorch venceu

2015 , TensorFlow  requer que você esteja em funcionamento qualquer conteúdo antes de definir um gráfico de computação estática. Você construiu um gráfico, o compiliu, então enviou dados para lá.

PyTorch em 2017 lançado, adotou diferentes ideias: execução ansiosa.`y = model(x)`会真的立刻计算 y, em vez de 给稍后才会计算 y 的图 添加一个节点──这意味着标准Python调试工具都能工作──print() 能工作──pdb 能工作──前进通过 里 if/else 能工作──

Até 2020, o mercado já deu a resposta. A participação do PyTorch em trabalhos de pesquisa em ML aumentou de 7% em 2017 para mais de 75% em 2022.

O que é importante é que a experiência do desenvolvedor vai aumentar.

### Tensores

Tensor é um número de dimensões, com três atributos principais: forma, tipo e dispositivo.

```python
import torch

x = torch.zeros(3, 4)           # shape: (3, 4), dtype: float32, device: cpu
x = torch.randn(2, 3, 224, 224) # batch of 2 RGB images, 224x224
x = torch.tensor([1, 2, 3])     # from a Python list
```

**Shape**Indica a forma do formato escaler é (), vetor é (n), matriz é (m, n), kit de imagens é (batch, canais, altura, largura)

**Dtype**Controle de precisão e memória.

| dtype | Bits | Range | Use case |
|-------|------|-------|----------|
| float32 | 32 | ~7 位十进制数字 | 默认训练 |
| float16 | 16 | ~3.3 位十进制数字 | Mixed precision |
| bfloat16 | 16 | 与 float32 相同的范围，精度更低 | LLM 训练 |
| int8 | 8 | -128 到 127 | Quantized inference |

**Device**Decidir o que acontecerá.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
x = torch.randn(3, 4, device=device)
x = x.to("cuda")
x = x.cpu()
```

Cada operação requer todos os tensores localizados no mesmo dispositivo. Este é o erro mais comum dos iniciantes.`RuntimeError: Expected all tensors to be on the same device`◊ Método de reparação é calcular antes de mover todo o conteúdo para o mesmo dispositivo.

**Reshaping**É uma operação de tempo normal que altera os metadados, não os dados.

```python
x = torch.randn(2, 3, 4)
x.view(2, 12)      # reshape to (2, 12) -- must be contiguous
x.reshape(6, 4)    # reshape to (6, 4) -- works always
x.permute(2, 0, 1) # reorder dimensions
x.unsqueeze(0)     # add dimension: (1, 2, 3, 4)
x.squeeze()        # remove size-1 dimensions
```

### Autograd

Seu mini framework  requer que você para cada módulo  implementar para trás ) ・PyTorch não precisa。 ele coloca o Tensor  上                                                                                                                                                                                                                                             

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

Com o seu framework, a Key Difference é: Use tape-based autodiff── cada operação é adicionada durante o passagem avançada ‖`.backward()`Vou voltar a colocar esta fita.

```python
x = torch.randn(3, requires_grad=True)
y = x ** 2 + 3 * x
z = y.sum()
z.backward()
print(x.grad)  # dz/dx = 2x + 3
```

Autograd 的三条规则:

1. Só com um .`requires_grad=True`Tensor de folha 会累积 Gradiente
2. Gradiente 默认会累积                                                                                                                                                                                                                                                          `optimizer.zero_grad()`
3. `torch.no_grad()`会禁用 Gradiente de rastreamento (User durante a avaliação)

### Modulo nn

`nn.Module`É a base de cada componente da rede neural no PyTorch. Você já construiu este abstracto na lição 10. A versão do PyTorch adicionou o registro automático de parâmetros, a descoberta de módulos recorrentes, a gestão de dispositivos e a serialização de ditos de estado.

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

Quando estás em`__init__`- Não .`nn.Module`Ou `nn.Parameter`Quando o atributo é atribuído, a PyTorch vai automaticamente registrá-lo.`model.parameters()`Vai recolher cada parâmetro registrado. É por isso que não precisa de recolher pesos como no mini-quadro.

核心 building blocks:

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

### Funções de perda e Otimizadores

PyTorch já está pronto para produção de tudo o que você já construiu.

**Loss functions**(Via de`torch.nn`):

| Loss | Task | Input |
|------|------|-------|
| nn.MSELoss() | Regression | 任意 shape |
| nn.CrossEntropyLoss() | Multi-class classification | Logits（不是 softmax） |
| nn.BCEWithLogitsLoss() | Binary classification | Logits（不是 sigmoid） |
| nn.L1Loss() | Regression（robust） | 任意 shape |
| nn.CTCLoss() | Sequence alignment | Log probabilities |

Nota:`CrossEntropyLoss`内部组合了                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `LogSoftmax`+ `NLLLoss`传入原始ログ,而不是软max output──这是一个常见错误,会产生错误 Gradient──

**Optimizers**(Via de`torch.optim`):

| Optimizer | When to use | Typical LR |
|-----------|-------------|-----------|
| SGD(params, lr, momentum) | CNNs、调优良好的 pipelines | 0.01--0.1 |
| Adam(params, lr) | 默认起点 | 1e-3 |
| AdamW(params, lr, weight_decay) | Transformers、fine-tuning | 1e-4--1e-3 |
| LBFGS(params) | Small-scale、second-order | 1.0 |

### O ciclo de treinamento

Cada ciclo de treinamento PyTorch segue o mesmo padrão de 5 passos. Já estás na lição 10.

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

规范模式:

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

Loop de lote 内部五行── treinamento GPT-4、Stable Diffusion 和 LLaMA 的也是这五行──arquitetura 会变──data 会变──这五行不会变──

### Set de dados e DataLoader

PyTorch `Dataset`É uma classe abstrata com dois métodos:`__len__`和 `__getitem__`- Não.`DataLoader`Em seu uso, embaixar batches, misturar e carregar dados em vários processos.

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

`num_workers=4`Será iniciado 4 processos e será carregado dados, enquanto o GPU                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

### Formação de GPU

Mover o modelo para a GPU:

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)
```

Isto vai retornar para cada parâmetro e buffer mover para a GPU... e depois durante o treinamento mover cada lote:

```python
inputs, targets = inputs.to(device), targets.to(device)
```

**Mixed precision**会在现代 GPU(A100、H100、RTX 4090) 上把内存使用减半、吞吐量翻倍:forward/backward 使用 float16 运行,同时 master weights 保持在 float32:

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

### Paralelamente: Mini Framework vs PyTorch vs JAX

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

## Construí-lo
Um só utilizou primitivos PyTorch em MNIST treinamento de 3 camadas MLP... sem envolventes de alto nível... sem`torchvision.datasets`◊ Nós mesmos baixamos e analisamos dados brutos

### 步骤 1: do arquivo original

MNIST 以 4 个 gziped dossiers 发布: training images(60.000 x 28 x 28) ‧ training labels、test images(10.000 x 28 x 28) ‧test labels──我们下载它们并解析二进制形式──

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

### 步骤 2: Defina o Modelo

Uma MLP de 3 camadas: 784 -> 256 -> 128 -> 10。Ativações RELU。 Usado para descartar fazer regularização。

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

camada de saída  produzir 10 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个 个) ⋅ não usar softmax`CrossEntropyLoss`Vai ser tratado internamente.

Contagem de parâmetros: 784*256 + 256 + 256*128 + 128 + 128*10 + 10 = 235.146。 em padrões modernos para ver muito pequeno。 GPT-2 pequeno Há 124M。 este modelo em poucos segundos já pode completar o treinamento。

### 步骤 3: Loop de treinamento

规范的前进损失后退步模式 ⋅

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

Atenção avaliação 期间 `torch.no_grad()` Ele vai desativar o autogrado, reduzir o uso de memória e acelerar a inferência.

### 步骤 4: colocar todas as partes conectadas

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

10 个时代 后的预期输出:~97.8% de exame de precisão。CPU 上训练时间:~30 秒──GPU 上:~5 秒──Use the same architecture of your mini framework:~45 分钟──

## Use-o
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

A interface é quase a mesma. A diferença está no nível inferior.

### Modelos de armazenamento e carregamento

```python
torch.save(model.state_dict(), "model.pt")

model = MNISTModel()
model.load_state_dict(torch.load("model.pt", weights_only=True))
model.eval()
```

始终保存 `state_dict()`(parameter dictionary), em vez de objeto modelo.

### Programação de Taxas de Aprendizagem

```python
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer, T_max=10
)
for epoch in range(10):
    train_one_epoch(model, train_loader, criterion, optimizer, device)
    scheduler.step()
```

PyTorch 自带15+ agendadores:StepLR、ExponentialLR、CosineAnnealingLR、OneCycleLR、ReduceLROnPlateau── todos eles podem conectar-se a uma interface de otimização──

## Entrega-o
本课会产 são dois artefatos:

- `outputs/prompt-pytorch-debugger.md` Para diagnóstico habitual PyTorch  treinamento de falha rápido
- `outputs/skill-pytorch-patterns.md`Referência de habilidades do modelo de treinamento de PyTorch

## 练习
1. **添加 batch normalization。**Depois de cada camada linear , a ativação é interrompida .`nn.BatchNorm1d` Comparar a precisão dos testes e a velocidade de treinamento com a versão de abandono de uso único.

2. **实现 learning rate finder。**Usar índice de aumento da taxa de aprendizagem ((( de 1e-7 a 1.0) treinar uma época― desenhar perda vs LR― o melhor LR   está na perda  começar a subir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

3. **迁移到 GPU 并使用 mixed precision。**Em um ciclo de treinamento`torch.amp.autocast`和 `GradScaler` em GPU 上测量使用和不使用混合精度 时的吞吐量(samples/second) ・ em A100 上,预期约2x speedup。

4. **构建 custom Dataset。**Descarga: Modem-MNIST (Mode-MNIST)`__getitem__`和 `__len__`de `FashionMNISTDataset(Dataset)`A classe ○ treinamento igual MLP não comparar precisão── Moda-MNIST 更難预期约 ~88%,而不是 ~98%──

5. **用 SGD + momentum 替换 Adam。**Utilização `SGD(params, lr=0.01, momentum=0.9)`訓練── comparar curvas de convergência── apoiar `CosineAnnealingLR`O programa, veja se o SGD vai conseguir seguir o Adam na época 10.

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
- Paszke et al., PyTorch: Um estilo imperativo, High-Performance Deep Learning Library (2019)解释 PyTorch 设计权衡的原始论文
- Tutoriais de PyTorch: Aprender PyTorch com exemplos (https://pytorch.org/tutorials/beginner/pytorch_with_examples.html) do Tensor ao Módulo nn.
- Guia de sintonização de desempenho PyTorch (https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html)precisão misturada Trabalhadores do DataLoader  memória empinada
- Horace He, "Fazer o Aprendizagem Profunda Ir Brrrr"https://horace.io/brrr_intro.html) Por que o treinamento de GPU                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
