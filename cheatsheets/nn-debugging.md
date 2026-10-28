---
id: nn-debugging
title: Debugging Neural Network Training
code: DN
subtitle: 从症状找静默训练 bug。检查项、阈值、初始化规则、裁剪与 AMP 顺序、性能分析器。
hue: 12
sources: phases/03-deep-learning-core/08-weight-initialization, phases/03-deep-learning-core/13-debugging-neural-networks, phases/00-setup-and-tooling/12-debugging-and-profiling, phases/19-capstone-projects/45-gradient-clipping-amp
source_hash: af3f0a481904da40
---

## 症状、原因、首选修复
type: troubleshooting
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 损失停在 -log(1/num_classes) | 模型预测均匀分布 | 检查数据管线与标签 |
| 几步后损失变成 NaN | 学习率过高 | 把 LR 降 10 倍 |
| 损失立刻变成 NaN | log(0) 或除以零 | 给 log 和除法加 epsilon |
| 损失剧烈振荡 | LR 过高或 batch 过小 | 降低 LR，增大 batch size |
| 损失下降后平台期 | 微调阶段 LR 过高 | 加 cosine 或 step decay 调度 |
| 训练准确率高、测试准确率低 | 过拟合 | 加 dropout、权重衰减、更多数据 |
| 训练准确率 = 测试准确率 = 随机水平 | 模型什么都没学到 | 跑 overfit-one-batch 测试 |
| 梯度全为零 | 死亡 ReLU 或图被断开 | 改用 LeakyReLU，检查 `.requires_grad` |

## 常见 PyTorch bug
type: troubleshooting
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 损失振荡，梯度在累积 | 没有 `optimizer.zero_grad()` | 在 `loss.backward()` 之前调用它 |
| 测试准确率每次都变 | 测试时没有 `model.eval()` | 加上 `model.eval()` 和 `torch.no_grad()` |
| 结果错误，没有报错 | 形状静默广播 | 每次运算后打印形状 |
| `RuntimeError: expected CUDA tensor` | CPU 与 GPU 不匹配 | 模型和数据都用 `.to(device)` |
| 图无限增长，OOM | 张量没有 detach | 用 `.detach()` 或 `with torch.no_grad()` |
| `RuntimeError: modified by in-place operation` | 原地运算破坏了 autograd | 把 `x += 1` 换成 `x = x + 1` |
| 损失停在随机猜测水平 | 输入未归一化 | 把输入归一化到 mean=0, std=1 |
| Cross-entropy 期望 `Long`，得到 `Float` | 标签 dtype 错误 | 转换标签：`labels.long()` |

## 损失不下降：按此顺序检查
type: flow
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

1. **学习率**：过高时损失振荡或爆炸。过低时损失几乎不动。
2. **学习率**：试 3 个相差 10 倍的率，例如 1e-2、1e-3、1e-4。
3. **梯度**：全为零意味着死亡 ReLU 或梯度消失。
4. **梯度**：NaN 或 Inf 意味着梯度爆炸。
5. **数据管线**：打乱的标签会给出随机猜测准确率。
6. **数据管线**：预处理 bug 会让模型学噪声。
7. **架构**：太小会欠拟合。太深难以优化。

## 诊断函数
type: task-table
from: phases/00-setup-and-tooling/12-debugging-and-profiling/code/debug_tools.py, phases/03-deep-learning-core/13-debugging-neural-networks/code/debug_neural_nets.py

| 任务 | 代码 |
|---|---|
| 张量的形状、dtype、设备、NaN | `debug_print(name, tensor)` |
| 映射每层形状 | `check_shapes(model, sample_input)` |
| 找 NaN 或 Inf 梯度 | `detect_nan(model, loss, step)` |
| 找落在其他设备上的张量 | `check_devices(model, *tensors)` |
| 总范数、过大或为零的梯度 | `check_gradient_health(model)` |
| 证明循环能学习 | `overfit_one_batch(model, x_batch, y_batch, criterion)` |
| 扫描学习率 | `find_learning_rate(model, x_data, y_data, criterion)` |
| 用有限差分对照反向传播 | `gradient_check(model, x, y, criterion, eps=1e-4)` |

## 把调试器挂进模型
type: annotated-code
lang: python
from: phases/03-deep-learning-core/13-debugging-neural-networks/code/debug_neural_nets.py, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

```python
debugger1 = NetworkDebugger(model1)        # hooks Linear, Conv2d, ReLU, LeakyReLU
debugger1.record_loss(loss.item())          # call once per step
debugger1.print_report()                    # loss, activation, gradient checks
debugger1.remove_hooks()
with torch.autograd.detect_anomaly():       # built-in NaN and Inf detection
    loss.backward()
```

## 检查项使用的阈值
type: defaults
from: phases/03-deep-learning-core/13-debugging-neural-networks/code/debug_neural_nets.py, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/00-setup-and-tooling/12-debugging-and-profiling/code/debug_tools.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `fraction_zero` | > 0.5 | 死亡神经元。用 LeakyReLU 或更低 LR |
| 激活 `std` | < 1e-6 | 激活塌缩 |
| 梯度 `abs_mean` | < 1e-7 | 该层梯度消失 |
| 梯度 `abs_mean` | > 100 | 该层梯度爆炸 |
| 首层 / 末层梯度比 | > 100 | 沿深度梯度消失 |
| `rel_diff` | < 1e-5 | 梯度检查通过。> 1e-3 是 bug |
| Overfit `final_loss` | > 0.1 | FAIL：模型或循环坏了 |
| `start_lr` | 1e-7 | LR finder 扫到 `end_lr=10` |

## 按激活函数初始化
type: concepts
from: phases/03-deep-learning-core/08-weight-initialization/docs/en.md, phases/03-deep-learning-core/08-weight-initialization/code/main.py

- **零初始化**：所有神经元保持相同。任意宽度只有一个有效神经元。
- **方差规则**：$\mathrm{Var}(z) = \text{fan}_{\text{in}} \cdot \mathrm{Var}(w) \cdot \mathrm{Var}(x)$
- **Xavier**：$\mathrm{Var}(w) = 2/(\text{fan}_{\text{in}} + \text{fan}_{\text{out}})$，用于 sigmoid 和 tanh。
- **Kaiming**：$\mathrm{Var}(w) = 2/\text{fan}_{\text{in}}$，用于 ReLU、Leaky ReLU、GELU 和 Swish。
- **残差缩放**：对 $N$ 层，残差层按 $1/\sqrt{2N}$ 缩放。
- **随机 N(0,1)**：到第 5 层爆炸。**N(0,0.01)**：到第 10 层消失。
- **检查**：各层激活幅度保持在 0.5 到 2.0 之间。
- **PyTorch**：`nn.Linear(512, 256)` 默认是 Kaiming uniform。

## 裁剪与缩放的步骤顺序
type: architecture
from: phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md

```arch
node | fwd | 1,1 | Forward in autocast | loss in FP32 | process
node | fin | 2,1 | isfinite loss? | no: skip step | process
node | bwd | 3,1 | scale(loss).backward | FP16 grads | gpu
node | uns | 4,1 | unscale_ optimizer | true gradients | process
node | nan | 4,2 | NaN or Inf grad? | yes: skip, update halves | process
node | clip | 3,2 | clip_grad_norm_ | max_norm 1.0 | process
node | step | 2,2 | scaler.step | optimizer step | process
node | upd | 1,2 | scaler.update | doubles or halves | store
edge | fwd | fin |
edge | fin | bwd | finite
edge | bwd | uns |
edge | uns | nan |
edge | nan | clip | clean
edge | clip | step |
edge | step | upd |
```

## 一次 AMP 训练步骤
type: annotated-code
lang: python
from: phases/19-capstone-projects/45-gradient-clipping-amp/code/main.py, phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md

```python
self.optimizer.zero_grad(set_to_none=True)
with torch.amp.autocast(device_type=self.device_type, dtype=self.amp_dtype):
    loss = self._loss_fn(self.model(inputs), targets)
if not torch.isfinite(loss).all().item():   # skip, no scaler.update()
    ...
self.scaler.scale(loss).backward()
self.scaler.unscale_(self.optimizer)        # before the clip
if has_non_finite_grad(self.model.parameters()):
    self.scaler.update()                    # halves the scale
pre_clip, post_clip = clip_global_l2_norm(list(self.model.parameters()), self.max_norm)
self.scaler.step(self.optimizer)
self.scaler.update()                        # every step
scale = self.scaler.get_scale()             # log next to lr and norm
```

## 分析与检查
type: command-table
from: phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md, phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md

| 命令 | 作用 |
|---|---|
| `python -m cProfile -s cumtime train.py` | 每个函数调用，按累计时间排序 |
| `kernprof -l -v train.py` | 对 `@profile` 函数做逐行计时 |
| `python -m memory_profiler your_script.py` | 逐行内存占用 |
| `tracemalloc.take_snapshot()` | `tracemalloc.start()` 后按行看 CPU 内存 |
| `torch.cuda.memory_summary()` | 已分配与缓存的 GPU 内存 |
| `tensorboard --logdir=runs` | 损失曲线、权重与梯度直方图 |
| `breakpoint()` | 停在 pdb。`p outputs.shape`，`c` 继续，`q` 退出 |
| `python3 code/main.py` | 裁剪与 AMP 演示。至少一行是 `SKIP` |

## 要盯住的数字
type: qa
from: phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md, phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md

- **健康的 GradScaler scale 会怎样？** 按 2 的幂升到接近 `2^17` 或 `2^18`。
- **跳过率何时告警？** 在 1000 步滚动窗口上超过 5%。
- **scale 从不变化？** 跳过路径忘了 `scaler.update()`。
- **数据加载占了 60% 时间？** 在 DataLoader 里设 `num_workers > 0`。
- **内存不足？** 先减小 batch size。再用 `torch.cuda.empty_cache()`。
- **测试准确率 99%？** 检查数据泄漏。先划分，再预处理。
- **训练损失下降而验证损失上升？** 模型过拟合。

## 全量训练前的检查清单
type: tips
from: phases/03-deep-learning-core/13-debugging-neural-networks/docs/en.md, phases/00-setup-and-tooling/12-debugging-and-profiling/docs/en.md

- 跑 overfit-one-batch 测试。失败就停。
- 打印模型摘要。核对参数量。
- 用随机数据跑一次前向。检查输出形状。
- 训练 5 个 epoch。确认损失在下降。
- 检查激活统计和梯度流。
- 打印 5 个带标签的随机样本。
- 训练中记录损失、学习率和梯度范数。
