---
name: skill-linear-probe-runner
description: 为任意 frozen encoder 和 labelled dataset 编写完整的 linear-probe evaluation
version: 1.0.0
phase: 4
lesson: 17
tags: [self-supervised, evaluation, linear-probe, pytorch]
---

# Linear Probe Runner

通过在顶部训练一个 single linear classifier 来评估 frozen encoder 的 features。这是每篇 Self-Supervised 论文的标准 evaluation。

## 何时使用
- 比较 Self-Supervised checkpoints。
- 跟踪 pretraining epochs 期间的 feature quality。
- 判断 pretrained encoder 对 downstream task 是否已经足够好，而无需 fine-tuning。

## 输入
- `encoder`: frozen `nn.Module`，为每张 image 返回一个 fixed-dim feature。
- `feature_dim`: encoder output 的 dimensionality。
- `train_dataset`: 带 label 的 dataset (image, class_id)。
- `val_dataset`: held-out set。
- `num_classes`: task classes。
- `epochs`: ImageNet-scale 通常为 100，较小 datasets 通常为 50。

## 步骤
1. 将 encoder 设为 eval mode，并对每个 parameter 设置 `requires_grad=False`。
2. 对 train 和 val sets 各做一次 feature extraction。存为 numpy arrays 或 memory-mapped file。
3. 在 cached features 上用 SGD + cosine schedule 训练一个 `nn.Linear(feature_dim, num_classes)`。
4. 标准 hyperparameters：`lr=0.1`、`momentum=0.9`、`weight_decay=0`、`batch_size=1024`。Linear Probe 对 `lr` 出人意料地敏感，如果 accuracy 较差请 sweep。
5. 在训练结束时报告 val 上的 top-1 accuracy。

## 输出模板
```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torch.optim import SGD
from torch.optim.lr_scheduler import CosineAnnealingLR

def extract(encoder, loader, device="cpu"):
    encoder.eval()
    feats, labels = [], []
    with torch.no_grad():
        for x, y in loader:
            f = encoder(x.to(device)).cpu()
            feats.append(f)
            labels.append(y)
    return torch.cat(feats), torch.cat(labels)


def linear_probe(encoder, feature_dim, train_loader, val_loader,
                 num_classes, epochs=50, lr=0.1, device="cpu"):
    for p in encoder.parameters():
        p.requires_grad = False

    f_train, y_train = extract(encoder, train_loader, device)
    f_val, y_val = extract(encoder, val_loader, device)

    head = nn.Linear(feature_dim, num_classes).to(device)
    opt = SGD(head.parameters(), lr=lr, momentum=0.9, weight_decay=0)
    sched = CosineAnnealingLR(opt, T_max=epochs)

    ds = torch.utils.data.TensorDataset(f_train, y_train)
    train_iter = DataLoader(ds, batch_size=1024, shuffle=True)

    best_val = 0.0
    for ep in range(epochs):
        head.train()
        for x, y in train_iter:
            x, y = x.to(device), y.to(device)
            loss = F.cross_entropy(head(x), y)
            opt.zero_grad(); loss.backward(); opt.step()
        sched.step()

        head.eval()
        with torch.no_grad():
            acc = (head(f_val.to(device)).argmax(-1).cpu() == y_val).float().mean().item()
        best_val = max(best_val, acc)
    return best_val
```

## 报告
```
[linear probe]
  encoder:     <name + pretrain checkpoint>
  feature_dim: <int>
  epochs:      <int>
  best_val_top1: <float>
```

## 规则
- 在 Linear Probe 期间绝不要更新 encoder weights；那会是 fine-tune，而不是 probe。
- 预先计算 features 一次；每个 epoch 都重新运行 encoder 会浪费 100 倍 compute。
- 使用带 cosine schedule 且无 weight decay 的 SGD；Adam 在这里有时表现较差。
- 每个 encoder family 至少 sweep 一次 learning rates；最佳值会因 SSL methods 而异。
