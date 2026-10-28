---
id: pytorch-essentials
title: PyTorch Essentials
code: PT
subtitle: 张量、autograd、nn.Module、训练循环、DataLoader 与设备，来自课文。
hue: 60
sources: phases/03-deep-learning-core/11-intro-to-pytorch, phases/03-deep-learning-core/13-debugging-neural-networks, phases/00-setup-and-tooling/03-gpu-setup-and-cloud, phases/00-setup-and-tooling/12-debugging-and-profiling
source_hash: 37c75e06555d8bf9
---

## 任务
type: task-table
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/00-setup-and-tooling/03-gpu-setup-and-cloud/docs/en.md

| Task | Code |
|---|---|
| 选设备 | `device = torch.device("cuda" if torch.cuda.is_available() else "cpu")` |
| 在其上建张量 | `x = torch.randn(3, 4, device=device)` |
| 移动模型与批次 | `model = model.to(device)` |
| 统计参数 | `sum(p.numel() for p in model.parameters())` |
| 保存权重 | `torch.save(model.state_dict(), "model.pt")` |
| 加载权重 | `model.load_state_dict(torch.load("model.pt", weights_only=True))` |
| 无图评估 | `model.eval()` 然后 `with torch.no_grad():` |
| 检查 GPU | `torch.cuda.get_device_name(0)` |

## 训练步骤
type: flow
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

1. **DataLoader**：产出一批输入与目标。
2. **设备**：`inputs.to(device), targets.to(device)` 移动该批次。
3. **Optimizer**：`optimizer.zero_grad()` 清掉旧梯度。
4. **Model**：`outputs = model(inputs)` 跑前向传播。
5. **Loss fn**：`criterion(outputs, targets)` 给出一个标量。
6. **Autograd**：`loss.backward()` 反向重放磁带。
7. **Optimizer**：`optimizer.step()` 更新参数。

## 训练流水线
type: architecture
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

```arch
node | ds | 1,1 | Dataset | __len__, __getitem__
node | dl | 2,1 | DataLoader | batch, shuffle, workers
node | model | 3,1 | nn.Module | forward(), parameters()
node | loss | 3,2 | Loss fn | logits and targets
node | tape | 2,2 | Autograd | loss.backward()
node | opt | 1,2 | Optimizer | step(), zero_grad()
edge | ds | dl | samples
edge | dl | model | batch
edge | model | loss | outputs
edge | loss | tape | backward
edge | tape | opt | grads
edge | opt | model | update
```

## 训练与评估
type: annotated-code
lang: python
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

```python
criterion = nn.CrossEntropyLoss()                 # takes raw logits
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
for epoch in range(num_epochs):
    model.train()                                 # dropout and batch norm on
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        optimizer.zero_grad()                     # gradients accumulate
        outputs = model(inputs)                   # forward pass
        loss = criterion(outputs, targets)
        loss.backward()                           # compute gradients
        optimizer.step()                          # update weights
model.eval()                                      # eval mode for test
with torch.no_grad():                             # no graph, less memory
    outputs = model(images)
```

## 数据与混合精度
type: annotated-code
lang: python
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

```python
class MNISTDataset(Dataset):
    def __len__(self):
        return len(self.labels)                   # number of samples
    def __getitem__(self, idx):
        return self.images[idx], self.labels[idx] # one sample
loader = DataLoader(dataset, batch_size=64, shuffle=True, num_workers=4)
scaler = GradScaler()                             # from torch.amp
for inputs, targets in loader:
    with autocast(device_type="cuda"):            # float16 forward
        outputs = model(inputs)
        loss = criterion(outputs, targets)
    scaler.scale(loss).backward()                 # scaled backward
    scaler.step(optimizer)
    scaler.update()
    optimizer.zero_grad()
```

## 张量运算
type: command-table
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

| Command | What it does |
|---|---|
| `x.view(2, 12)` | 变形。张量必须连续 |
| `x.reshape(6, 4)` | 变形。始终可用 |
| `x.permute(2, 0, 1)` | 重排维度 |
| `x.unsqueeze(0)` | 增加一个维度，`(1, 2, 3, 4)` |
| `x.squeeze()` | 去掉大小为 1 的维度 |
| `x.to("cuda")` / `x.cpu()` | 在设备间移动张量 |
| `.detach()` | 把张量从图上切断 |
| `labels.long()` | 为交叉熵转换标签类型 |

## 模块
type: command-table
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

| Command | What it does |
|---|---|
| `nn.Linear(in, out)` | $Wx + b$，in*out + out 个参数 |
| `nn.Conv2d(in_ch, out_ch, k)` | 2D 卷积 |
| `nn.BatchNorm1d(features)` | 规范化激活，2 * features |
| `nn.LayerNorm(dim)` | 按样本规范化，2 * dim |
| `nn.Dropout(p)` | 随机置零，0 个参数 |
| `nn.ReLU()` | $\max(0, x)$ |
| `nn.Embedding(vocab, dim)` | 查找表，vocab * dim |
| `nn.Sequential(...)` | 按顺序跑模块 |

## 默认值与数字
type: defaults
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/00-setup-and-tooling/03-gpu-setup-and-cloud/docs/en.md

| Setting | Default | Note |
|---|---|---|
| 张量 dtype | float32 | 默认训练精度 |
| LLM 训练 dtype | bfloat16 | float32 范围，精度更低 |
| Adam 学习率 | 1e-3 | 默认起点 |
| SGD 起始学习率 | 1e-2 | 或 1e-1，按调试课 |
| DataLoader batch_size | 64 | 课文训练加载器 |
| num_workers | 4 | 并行加载进程 |
| MNIST MLP 里的 Dropout | 0.2 | 每个隐藏 ReLU 之后 |
| 每个参数的 fp16 字节 | 2 | 把 GPU 内存除以 2，并留余量 |

## 关键概念
type: concepts
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

- **张量**：带形状、dtype 与设备的数组。
- **同设备规则**：每一次运算都需要所有张量在同一设备上。
- **Autograd**：在磁带上记录运算，然后反向重放。
- **叶子张量**：只有 `requires_grad=True` 的叶子累积梯度。
- **累积**：梯度默认相加。每一步调用 `zero_grad`。
- **注册**：在 `__init__` 里设置的模块与 `nn.Parameter` 会被 `parameters()` 找到。
- **state_dict**：名字映射到张量。可跨代码改动移植。
- **混合精度**：float16 前向与反向，float32 主权重。

## 排障
type: troubleshooting
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

| Symptom | Cause | Fix |
|---|---|---|
| `RuntimeError: expected CUDA tensor` | 模型与数据在不同设备 | 对模型与数据做 `.to(device)` |
| `RuntimeError: modified by in-place operation` | 原地运算打断 autograd | 用 `x = x + 1` 替换 `x += 1` |
| 损失震荡 | 没有 `optimizer.zero_grad()` | 在 `loss.backward()` 之前调用它 |
| 测试准确率各次运行不同 | 测试时没有 `model.eval()` | 加上 `model.eval()` 与 `torch.no_grad()` |
| 内存不足 | 图未被释放 | `.detach()` 或 `torch.no_grad()` |
| 交叉熵 dtype 错误 | 标签是 Float | 用 `labels.long()` 转换 |
| 错误梯度、无报错 | 把 softmax 输出传给 `CrossEntropyLoss` | 传原始 logits |
| 损失跳到 NaN | 梯度爆炸 | `torch.nn.utils.clip_grad_norm_` 或降低 LR |

## 调试探针
type: task-table
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md

| Task | Code |
|---|---|
| 找到产生 NaN 的运算 | `with torch.autograd.detect_anomaly():` |
| 检查损失是否为 NaN | `torch.isnan(loss)` |
| 读取梯度范数 | `torch.nn.utils.clip_grad_norm_(model.parameters(), float("inf"))` |
| 读取 GPU 内存 | `torch.cuda.memory_allocated() / 1e9` |

## 提示
type: tips
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

- 先跑过拟合一个批次的测试。若失败，设置就坏了。
- 在找其他 bug 之前，先试 3 个相差 10 倍的学习率。
- 在每一次运算后打印形状。广播会隐藏形状 bug。
- 把输入规范化到均值 0、标准差 1。
- 损失卡在 -log(1/num_classes) 表示均匀预测。
- 对磁盘受限的数据使用 `num_workers`。它能把速度加倍。
