---
name: skill-pytorch-patterns
description: PyTorch 训练、评估和部署的参考模式
version: 1.0.0
phase: 03
lesson: 11
tags: [pytorch, training, deep-learning, gpu, patterns]
---

## 标准训练循环

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = Model().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)

for epoch in range(num_epochs):
    model.train()
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

    model.eval()
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
```

## Mixed Precision 训练

```python
from torch.amp import autocast, GradScaler

scaler = GradScaler()
for inputs, targets in train_loader:
    inputs, targets = inputs.to(device), targets.to(device)
    optimizer.zero_grad()
    with autocast(device_type="cuda"):
        outputs = model(inputs)
        loss = criterion(outputs, targets)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

使用场景：在支持 float16 的 GPU 硬件（V100、A100、H100、RTX 3090+）上训练。预期可获得约 1.5-2x 加速，并减少约 50% 内存占用。

## Gradient Accumulation

```python
accumulation_steps = 4
optimizer.zero_grad()
for i, (inputs, targets) in enumerate(train_loader):
    inputs, targets = inputs.to(device), targets.to(device)
    outputs = model(inputs)
    loss = criterion(outputs, targets) / accumulation_steps
    loss.backward()
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

使用场景：有效 batch size 需要大于 GPU 内存允许的大小。将 loss 除以 accumulation_steps 可以保持 Gradient 尺度一致。

## 保存与加载

```python
torch.save({
    "epoch": epoch,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "loss": loss.item(),
}, "checkpoint.pt")

checkpoint = torch.load("checkpoint.pt", weights_only=True)
model.load_state_dict(checkpoint["model_state_dict"])
optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
```

恢复训练时始终保存 Optimizer 状态。对于仅 inference，保存 `model.state_dict()` 即可。

## 自定义 Dataset

```python
class CustomDataset(torch.utils.data.Dataset):
    def __init__(self, data_dir, transform=None):
        self.samples = self._load_samples(data_dir)
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        x, y = self.samples[idx]
        if self.transform:
            x = self.transform(x)
        return x, y

    def _load_samples(self, data_dir):
        ...
```

## DataLoader 配置

```python
train_loader = torch.utils.data.DataLoader(
    dataset,
    batch_size=64,
    shuffle=True,
    num_workers=4,
    pin_memory=True,
    drop_last=True,
    persistent_workers=True,
)
```

| Parameter | 作用 | 使用场景 |
|-----------|-------------|-------------|
| num_workers=4 | 并行数据加载 | 多核机器上始终使用 |
| pin_memory=True | Page-locked CPU 内存 | 在 GPU 上训练时 |
| drop_last=True | 丢弃不完整的最后一个 batch | 使用 BatchNorm 时 |
| persistent_workers=True | 在 epoch 之间保持 workers 存活 | 当 num_workers > 0 时 |

## Learning Rate 调度

```python
scheduler = torch.optim.lr_scheduler.OneCycleLR(
    optimizer,
    max_lr=1e-3,
    total_steps=num_epochs * len(train_loader),
    pct_start=0.1,
)

for epoch in range(num_epochs):
    for inputs, targets in train_loader:
        ...
        optimizer.step()
        scheduler.step()
```

OneCycleLR：大多数任务的最佳默认选择。先 warm up 到 max_lr，然后进行 cosine decay。每个 batch 后调用 `scheduler.step()`，不要每个 epoch 调用。

## Weight 初始化

```python
def init_weights(module):
    if isinstance(module, nn.Linear):
        nn.init.kaiming_normal_(module.weight, nonlinearity="relu")
        if module.bias is not None:
            nn.init.zeros_(module.bias)
    elif isinstance(module, nn.Conv2d):
        nn.init.kaiming_normal_(module.weight, mode="fan_out", nonlinearity="relu")

model.apply(init_weights)
```

## Inference Mode

```python
model.eval()

with torch.inference_mode():
    outputs = model(inputs)
```

`torch.inference_mode()` 比 `torch.no_grad()` 更快，因为它会完全禁用 autograd，而不只是抑制 Gradient 计算。

## 常见错误 Checklist

1. 在 CrossEntropyLoss 前应用 softmax（它内部已包含 log_softmax）
2. validation 期间忘记调用 model.eval()
3. 忘记将 tensors 移动到与 model 相同的 device
4. 未调用 optimizer.zero_grad()（Gradient 默认会累积）
5. 训练期间使用 torch.no_grad()（会禁用 Gradient 计算）
6. 将 num_workers 设置得过高（生成过多 processes，导致内存抖动）
7. 在 GPU 上训练时未使用 pin_memory=True
8. 保存整个 model object 而不是 state_dict（refactor 后会失效）
