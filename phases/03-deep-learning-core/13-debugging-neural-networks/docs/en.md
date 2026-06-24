# 调试 Neural Networks

> 你的 network 编译成功了。它运行了。它产生了一个数字。这个数字是错的，而且什么都没有崩溃。欢迎来到最难的一类 debugging：没有错误消息的 debugging。

**类型：** Build
**语言：** Python, PyTorch
**前置要求：** Phase 03 Lessons 01-10（尤其是 backpropagation, loss functions, optimizers）
**时间：** ~90 分钟

## 学习目标

- 使用系统化 debugging 策略诊断常见 Neural Network 故障（NaN loss、平坦的 loss curve、overfitting、oscillation）
- 应用 "overfit one batch" 技术，验证 model architecture 和 training loop 是否正确
- 检查 Gradient magnitude、Activation distribution 和 weight norm，以识别 vanishing/exploding Gradient 问题
- 构建一个 debugging checklist，覆盖 data pipeline、model architecture、Loss Function、Optimizer 和 learning rate 问题

## 问题

传统软件坏掉时会崩溃。null pointer 会抛出 exception。type mismatch 会在 compile time 失败。off-by-one error 会产生明显错误的输出。

Neural Networks 不会给你这种便利。

一个坏掉的 Neural Network 会完整运行，打印一个 loss value，并输出 predictions。loss 可能会下降。predictions 可能看起来合理。但 model 正在悄悄犯错：学习 shortcuts、记忆 noise，或者收敛到无用的 local minimum。Google researchers 估计，60-70% 的 ML debugging 时间花在 "silent" bugs 上：它们不会产生错误，却会降低 model quality。

一个可工作的 model 和一个坏掉的 model 之间，常常只差一行放错位置的代码：缺失的 `zero_grad()`、转置的 dimension、偏差 10x 的 learning rate。经典的 "Recipe for Training Neural Networks"（2019）开篇就说："The most common neural net mistakes are bugs that don't crash."

本课会教你找到这些 bugs。

## 核心概念

### Debugging Mindset

忘掉 print-and-pray 式 debugging。Neural Network debugging 需要系统化方法，因为 feedback loop 很慢（每次 training run 需要几分钟到几小时），而 symptoms 又很模糊（bad loss 可能意味着 20 种不同问题）。

黄金法则：**从简单开始，一次只增加一个复杂度，并独立验证每一部分。**

```mermaid
flowchart TD
    A["Loss not decreasing"] --> B{"Check learning rate"}
    B -->|"Too high"| C["Loss oscillates or explodes"]
    B -->|"Too low"| D["Loss barely moves"]
    B -->|"Reasonable"| E{"Check gradients"}
    E -->|"All zeros"| F["Dead ReLUs or vanishing gradients"]
    E -->|"NaN/Inf"| G["Exploding gradients"]
    E -->|"Normal"| H{"Check data pipeline"}
    H -->|"Labels shuffled"| I["Random-chance accuracy"]
    H -->|"Preprocessing bug"| J["Model learns noise"]
    H -->|"Data is fine"| K{"Check architecture"}
    K -->|"Too small"| L["Underfitting"]
    K -->|"Too deep"| M["Optimization difficulty"]
```

### Symptom 1：Loss 不下降

这是最常见的抱怨。training loop 在运行，epochs 不断推进，而 loss 保持平坦或剧烈 oscillate。

**错误的 learning rate。** 太高：loss oscillate 或跳到 NaN。太低：loss 下降得非常慢，看起来像是平的。对于 Adam，从 1e-3 开始。对于 SGD，从 1e-1 或 1e-2 开始。在断定其他地方有问题之前，始终尝试 3 个相差 10x 的 learning rates（例如 1e-2、1e-3、1e-4）。

**Dead ReLUs。** 如果一个 ReLU neuron 收到很大的负输入，它输出 0，且它的 Gradient 为 0。它再也不会 activate。如果足够多的 neurons 死掉，network 就无法学习。检查方法：打印每个 ReLU layer 后 Activation 精确等于 0 的比例。如果 >50% 都 dead，切换到 LeakyReLU 或降低 learning rate。

**Vanishing gradients。** 在使用 sigmoid 或 tanh activations 的 deep networks 中，Gradients 在 backward 传播时会指数级缩小。当它们到达第一层时，几乎为 ~0。前几层停止学习。修复方法：使用 ReLU/GELU，添加 residual connections，或使用 batch normalization。

**Exploding gradients。** 相反的问题：Gradients 指数级增长。常见于 RNNs 和 very deep networks。Loss 跳到 NaN。修复方法：gradient clipping（`torch.nn.utils.clip_grad_norm_`）、降低 learning rate，或添加 normalization。

### Symptom 2：Loss 下降但 Model 很差

loss 下降了。training accuracy 达到 99%。但 test accuracy 是 55%。或者 model 在真实数据上产生毫无意义的输出。

**Overfitting。** model 记住了 training data，而不是学习 patterns。training loss 和 validation loss 之间的 gap 会随时间变大。修复方法：更多数据、dropout、weight decay、early stopping、data augmentation。

**Data leakage。** Test data 泄漏进了 training。Accuracy 高得可疑。常见原因：split 之前 shuffle、使用完整 dataset 的 statistics 做 preprocessing、不同 splits 之间存在 duplicate samples。修复方法：先 split，再 preprocess，检查 duplicates。

**Label errors。** 大多数真实 datasets 中有 5-10% 的 labels 是错的（Northcutt et al., 2021 -- "Pervasive Label Errors in Test Sets"）。model 学到了 noise。修复方法：使用 confident learning 找出并修复 mislabeled examples，或使用 loss truncation 忽略 high-loss samples。

### Symptom 3：Loss 中出现 NaN 或 Inf

loss value 变成 `nan` 或 `inf`。Training 已经失败。

**Learning rate 太高。** Gradient updates 跨得太远，导致 weights explode。修复方法：降低 10x。

**log(0) 或 log(negative)。** Cross-entropy loss 会计算 `log(p)`。如果你的 model 输出精确的 0 或负 probability，log 会 explode。修复方法：将 predictions clamp 到 `[eps, 1-eps]`，其中 `eps=1e-7`。

**除以零。** Batch normalization 会除以 standard deviation。constant values 的 batch 有 std=0。修复方法：在 denominator 中添加 epsilon（PyTorch 默认会这样做，但 custom implementations 可能不会）。

**Numerical overflow。** 大的 activations 输入 `exp()` 会产生 Inf。Softmax 尤其容易出现这种问题。修复方法：在 exponentiating 之前减去 max（log-sum-exp trick）。

### Technique 1：Gradient Checking

将你的 analytical gradients（来自 backprop）与 numerical gradients（来自 finite differences）进行比较。如果它们不一致，说明 backward pass 有 bug。

参数 `w` 的 numerical gradient：

```
grad_numerical = (loss(w + eps) - loss(w - eps)) / (2 * eps)
```

一致性指标（relative difference）：

```
rel_diff = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

如果 `rel_diff < 1e-5`：正确。如果 `rel_diff > 1e-3`：几乎一定有 bug。

```mermaid
flowchart LR
    A["Parameter w"] --> B["w + eps"]
    A --> C["w - eps"]
    B --> D["Forward pass"]
    C --> E["Forward pass"]
    D --> F["loss+"]
    E --> G["loss-"]
    F --> H["(loss+ - loss-) / 2eps"]
    G --> H
    H --> I["Compare to backprop gradient"]
```

### Technique 2：Activation Statistics

在 training 期间监控每一层后 activations 的 mean 和 standard deviation。健康的 networks 会保持 mean 接近 0、std 接近 1（在 normalization 后），或者至少保持有界。

| Health indicator | Mean | Std | Diagnosis |
|-----------------|------|-----|-----------|
| Healthy | ~0 | ~1 | Network 正常学习 |
| Saturated | >>0 or <<0 | ~0 | Activations 卡在极端值 |
| Dead | 0 | 0 | Neurons 已经 dead（全为零） |
| Exploding | >>10 | >>10 | Activations 无界增长 |

### Technique 3：Gradient 流可视化

绘制每一层的平均 Gradient magnitude。在健康的 network 中，各层的 Gradient magnitudes 应大致相近。如果早期 layers 的 Gradients 比后期 layers 小 1000x，就存在 vanishing gradients。

```mermaid
graph LR
    subgraph "Healthy Gradient Flow"
        L1["Layer 1<br/>grad: 0.05"] --- L2["Layer 2<br/>grad: 0.04"] --- L3["Layer 3<br/>grad: 0.06"] --- L4["Layer 4<br/>grad: 0.05"]
    end
```

```mermaid
graph LR
    subgraph "Vanishing Gradient Flow"
        V1["Layer 1<br/>grad: 0.0001"] --- V2["Layer 2<br/>grad: 0.003"] --- V3["Layer 3<br/>grad: 0.02"] --- V4["Layer 4<br/>grad: 0.08"]
    end
```

### Technique 4：Overfit-One-Batch Test

这是 Deep Learning 中最重要的单个 debugging 技术。

取一个小 batch（8-32 个 samples）。在它上面训练 100+ iterations。loss 应该接近零，training accuracy 应该达到 100%。如果没有，说明你的 model 或 training loop 有根本性 bug，不要继续进行完整 training。

这个测试能捕获：
- 损坏的 Loss Functions
- 损坏的 backward passes
- Architecture 太小，无法表示数据
- Optimizer 没有连接到 model parameters
- Data 和 labels 未对齐

它只需要 30 秒运行，却能节省数小时完整 training runs 的 debugging 时间。

### Technique 5：Learning Rate Finder

Leslie Smith（2017）提出，在一个 epoch 内将 learning rate 从很小（1e-7）sweep 到很大（10），同时记录 loss。绘制 loss vs learning rate。最优 learning rate 大约是 loss 开始最快下降处再小 10x 的 rate。

```mermaid
graph TD
    subgraph "LR Finder Plot"
        direction LR
        A["1e-7: loss=2.3"] --> B["1e-5: loss=2.3"]
        B --> C["1e-3: loss=1.8"]
        C --> D["1e-2: loss=0.9 -- steepest"]
        D --> E["1e-1: loss=0.5"]
        E --> F["1.0: loss=NaN -- too high"]
    end
```

此例中的最佳 LR：~1e-3（steepest point 之前一个数量级）。

### 常见 PyTorch Bugs

这些是 PyTorch community 中最浪费集体时间的 bugs：

| Bug | Symptom | Fix |
|-----|---------|-----|
| 忘记 `optimizer.zero_grad()` | Gradients 在 batches 之间累积，loss oscillates | 在 `loss.backward()` 之前添加 `optimizer.zero_grad()` |
| test time 忘记 `model.eval()` | Dropout 和 batch norm 行为不同，test accuracy 在不同 runs 之间变化 | 添加 `model.eval()` 和 `torch.no_grad()` |
| 错误的 tensor shapes | Silent broadcasting 产生错误结果，没有报错 | debugging 期间在每个 operation 后打印 shapes |
| CPU/GPU mismatch | `RuntimeError: expected CUDA tensor` | 对 model 和 data 都使用 `.to(device)` |
| 没有 detach tensors | Computation graph 不断增长，OOM | 使用 `.detach()` 或 `with torch.no_grad()` |
| In-place operations 破坏 autograd | `RuntimeError: modified by in-place operation` | 将 `x += 1` 替换为 `x = x + 1` |
| Data 未 normalized | Loss 卡在 random-chance 水平 | 将 inputs normalize 到 mean=0, std=1 |
| Labels dtype 错误 | Cross-entropy 期望 `Long`，却得到 `Float` | 转换 labels：`labels.long()` |

### Master Debugging Table

| Symptom | Likely cause | First thing to try |
|---------|-------------|-------------------|
| Loss 卡在 -log(1/num_classes) | Model 正在预测 uniform distribution | 检查 data pipeline，验证 labels 匹配 inputs |
| 几步后 Loss NaN | Learning rate 太高 | 将 LR 降低 10x |
| Loss 立即 NaN | log(0) 或除以零 | 在 log/division operations 中添加 epsilon |
| Loss 剧烈 oscillating | LR 太高或 batch size 太小 | 降低 LR，增大 batch size |
| Loss 下降后 plateau | LR 对 fine-tuning phase 来说太高 | 添加 LR schedule（cosine 或 step decay） |
| Training acc 高，test acc 低 | Overfitting | 添加 dropout、weight decay、更多数据 |
| Training acc = test acc = chance | Model 没有学到任何东西 | 运行 overfit-one-batch test |
| Training acc = test acc 但都很低 | Underfitting | 更大的 model、更多 layers、更多 features |
| Gradients 全为零 | Dead ReLUs 或 detached computation graph | 切换到 LeakyReLU，检查 `.requires_grad` |
| Training 期间 out of memory | Batch 太大或 graph 未释放 | 降低 batch size，在 eval 使用 `torch.no_grad()` |


```figure
learning-curves
```

## 构建它

一个诊断工具包，用于监控 activations、gradients 和 loss curves。你将故意破坏一个 network，并使用该工具包诊断每个问题。

### 步骤 1：NetworkDebugger Class

Hook 到 PyTorch model 中，记录每层的 activation 和 gradient statistics。

```python
import torch
import torch.nn as nn
import math


class NetworkDebugger:
    def __init__(self, model):
        self.model = model
        self.activation_stats = {}
        self.gradient_stats = {}
        self.loss_history = []
        self.lr_losses = []
        self.hooks = []
        self._register_hooks()

    def _register_hooks(self):
        for name, module in self.model.named_modules():
            if isinstance(module, (nn.Linear, nn.Conv2d, nn.ReLU, nn.LeakyReLU)):
                hook = module.register_forward_hook(self._make_activation_hook(name))
                self.hooks.append(hook)
                hook = module.register_full_backward_hook(self._make_gradient_hook(name))
                self.hooks.append(hook)

    def _make_activation_hook(self, name):
        def hook(module, input, output):
            with torch.no_grad():
                out = output.detach().float()
                self.activation_stats[name] = {
                    "mean": out.mean().item(),
                    "std": out.std().item(),
                    "fraction_zero": (out == 0).float().mean().item(),
                    "min": out.min().item(),
                    "max": out.max().item(),
                }
        return hook

    def _make_gradient_hook(self, name):
        def hook(module, grad_input, grad_output):
            if grad_output[0] is not None:
                with torch.no_grad():
                    grad = grad_output[0].detach().float()
                    self.gradient_stats[name] = {
                        "mean": grad.mean().item(),
                        "std": grad.std().item(),
                        "abs_mean": grad.abs().mean().item(),
                        "max": grad.abs().max().item(),
                    }
        return hook

    def record_loss(self, loss_value):
        self.loss_history.append(loss_value)

    def check_loss_health(self):
        if len(self.loss_history) < 2:
            return "NOT_ENOUGH_DATA"
        recent = self.loss_history[-10:]
        if any(math.isnan(v) or math.isinf(v) for v in recent):
            return "NAN_OR_INF"
        if len(self.loss_history) >= 20:
            first_half = sum(self.loss_history[:10]) / 10
            second_half = sum(self.loss_history[-10:]) / 10
            if second_half >= first_half * 0.99:
                return "NOT_DECREASING"
        if len(recent) >= 5:
            diffs = [recent[i+1] - recent[i] for i in range(len(recent)-1)]
            if max(diffs) - min(diffs) > 2 * abs(sum(diffs) / len(diffs)):
                return "OSCILLATING"
        return "HEALTHY"

    def check_activations(self):
        issues = []
        for name, stats in self.activation_stats.items():
            if stats["fraction_zero"] > 0.5:
                issues.append(f"DEAD_NEURONS: {name} has {stats['fraction_zero']:.0%} zero activations")
            if abs(stats["mean"]) > 10:
                issues.append(f"EXPLODING_ACTIVATIONS: {name} mean={stats['mean']:.2f}")
            if stats["std"] < 1e-6:
                issues.append(f"COLLAPSED_ACTIVATIONS: {name} std={stats['std']:.2e}")
        return issues if issues else ["HEALTHY"]

    def check_gradients(self):
        issues = []
        grad_magnitudes = []
        for name, stats in self.gradient_stats.items():
            grad_magnitudes.append((name, stats["abs_mean"]))
            if stats["abs_mean"] < 1e-7:
                issues.append(f"VANISHING_GRADIENT: {name} abs_mean={stats['abs_mean']:.2e}")
            if stats["abs_mean"] > 100:
                issues.append(f"EXPLODING_GRADIENT: {name} abs_mean={stats['abs_mean']:.2e}")
        if len(grad_magnitudes) >= 2:
            first_mag = grad_magnitudes[0][1]
            last_mag = grad_magnitudes[-1][1]
            if last_mag > 0 and first_mag / last_mag > 100:
                issues.append(f"GRADIENT_RATIO: first/last = {first_mag/last_mag:.0f}x (vanishing)")
        return issues if issues else ["HEALTHY"]

    def print_report(self):
        print("\n=== NETWORK DEBUGGER REPORT ===")
        print(f"\nLoss health: {self.check_loss_health()}")
        if self.loss_history:
            print(f"  Last 5 losses: {[f'{v:.4f}' for v in self.loss_history[-5:]]}")
        print("\nActivation diagnostics:")
        for item in self.check_activations():
            print(f"  {item}")
        print("\nGradient diagnostics:")
        for item in self.check_gradients():
            print(f"  {item}")
        print("\nPer-layer activation stats:")
        for name, stats in self.activation_stats.items():
            print(f"  {name}: mean={stats['mean']:.4f} std={stats['std']:.4f} zero={stats['fraction_zero']:.1%}")
        print("\nPer-layer gradient stats:")
        for name, stats in self.gradient_stats.items():
            print(f"  {name}: abs_mean={stats['abs_mean']:.2e} max={stats['max']:.2e}")

    def remove_hooks(self):
        for hook in self.hooks:
            hook.remove()
        self.hooks.clear()
```

### 步骤 2：Overfit-One-Batch Test

```python
def overfit_one_batch(model, x_batch, y_batch, criterion, lr=0.01, steps=200):
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    model.train()
    print("\n=== OVERFIT ONE BATCH TEST ===")
    print(f"Batch size: {x_batch.shape[0]}, Steps: {steps}")

    for step in range(steps):
        optimizer.zero_grad()
        output = model(x_batch)
        loss = criterion(output, y_batch)
        loss.backward()
        optimizer.step()

        if step % 50 == 0 or step == steps - 1:
            with torch.no_grad():
                preds = (output > 0).float() if output.shape[-1] == 1 else output.argmax(dim=1)
                targets = y_batch if y_batch.dim() == 1 else y_batch.squeeze()
                acc = (preds.squeeze() == targets).float().mean().item()
            print(f"  Step {step:3d} | Loss: {loss.item():.6f} | Accuracy: {acc:.1%}")

    final_loss = loss.item()
    if final_loss > 0.1:
        print(f"\n  FAIL: Loss did not converge ({final_loss:.4f}). Model or training loop is broken.")
        return False
    print(f"\n  PASS: Loss converged to {final_loss:.6f}")
    return True
```

### 步骤 3：Learning Rate Finder

```python
def find_learning_rate(model, x_data, y_data, criterion, start_lr=1e-7, end_lr=10, steps=100):
    import copy
    original_state = copy.deepcopy(model.state_dict())
    optimizer = torch.optim.SGD(model.parameters(), lr=start_lr)
    lr_mult = (end_lr / start_lr) ** (1 / steps)

    model.train()
    results = []
    best_loss = float("inf")
    current_lr = start_lr

    print("\n=== LEARNING RATE FINDER ===")

    for step in range(steps):
        optimizer.zero_grad()
        output = model(x_data)
        loss = criterion(output, y_data)

        if math.isnan(loss.item()) or loss.item() > best_loss * 10:
            break

        best_loss = min(best_loss, loss.item())
        results.append((current_lr, loss.item()))

        loss.backward()
        optimizer.step()

        current_lr *= lr_mult
        for param_group in optimizer.param_groups:
            param_group["lr"] = current_lr

    model.load_state_dict(original_state)

    if len(results) < 10:
        print("  Could not complete LR sweep -- loss diverged too quickly")
        return results

    min_loss_idx = min(range(len(results)), key=lambda i: results[i][1])
    suggested_lr = results[max(0, min_loss_idx - 10)][0]

    print(f"  Swept {len(results)} steps from {start_lr:.0e} to {results[-1][0]:.0e}")
    print(f"  Minimum loss {results[min_loss_idx][1]:.4f} at lr={results[min_loss_idx][0]:.2e}")
    print(f"  Suggested learning rate: {suggested_lr:.2e}")

    return results
```

### 步骤 4：Gradient Checker

```python
def _flat_to_multi_index(flat_idx, shape):
    multi_idx = []
    remaining = flat_idx
    for dim in reversed(shape):
        multi_idx.insert(0, remaining % dim)
        remaining //= dim
    return tuple(multi_idx)


def gradient_check(model, x, y, criterion, eps=1e-4):
    model.train()
    x_double = x.double()
    y_double = y.double()
    model_double = model.double()

    print("\n=== GRADIENT CHECK ===")
    overall_max_diff = 0
    checked = 0

    for name, param in model_double.named_parameters():
        if not param.requires_grad:
            continue

        layer_max_diff = 0

        model_double.zero_grad()
        output = model_double(x_double)
        loss = criterion(output, y_double)
        loss.backward()
        analytical_grad = param.grad.clone()

        num_checks = min(5, param.numel())
        for i in range(num_checks):
            idx = _flat_to_multi_index(i, param.shape)
            original = param.data[idx].item()

            param.data[idx] = original + eps
            with torch.no_grad():
                loss_plus = criterion(model_double(x_double), y_double).item()

            param.data[idx] = original - eps
            with torch.no_grad():
                loss_minus = criterion(model_double(x_double), y_double).item()

            param.data[idx] = original

            numerical = (loss_plus - loss_minus) / (2 * eps)
            analytical = analytical_grad[idx].item()

            denom = max(abs(numerical), abs(analytical), 1e-8)
            rel_diff = abs(numerical - analytical) / denom

            layer_max_diff = max(layer_max_diff, rel_diff)
            checked += 1

        overall_max_diff = max(overall_max_diff, layer_max_diff)
        status = "OK" if layer_max_diff < 1e-5 else "MISMATCH"
        print(f"  {name}: max_rel_diff={layer_max_diff:.2e} [{status}]")

    model.float()

    print(f"\n  Checked {checked} parameters")
    if overall_max_diff < 1e-5:
        print("  PASS: Gradients match (rel_diff < 1e-5)")
    elif overall_max_diff < 1e-3:
        print("  WARN: Small differences (1e-5 < rel_diff < 1e-3)")
    else:
        print("  FAIL: Gradient mismatch detected (rel_diff > 1e-3)")
    return overall_max_diff
```

### 步骤 5：故意破坏的 Networks

现在将工具包应用到 broken networks 上，并诊断每一个问题。

```python
def demo_broken_networks():
    torch.manual_seed(42)
    x = torch.randn(64, 10)
    y = (x[:, 0] > 0).long()

    print("\n" + "=" * 60)
    print("BUG 1: Learning rate too high (lr=10)")
    print("=" * 60)
    model1 = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 2))
    debugger1 = NetworkDebugger(model1)
    optimizer1 = torch.optim.SGD(model1.parameters(), lr=10.0)
    criterion = nn.CrossEntropyLoss()
    for step in range(20):
        optimizer1.zero_grad()
        out = model1(x)
        loss = criterion(out, y)
        debugger1.record_loss(loss.item())
        loss.backward()
        optimizer1.step()
    debugger1.print_report()
    debugger1.remove_hooks()

    print("\n" + "=" * 60)
    print("BUG 2: Dead ReLUs from bad initialization")
    print("=" * 60)
    model2 = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 32), nn.ReLU(), nn.Linear(32, 2))
    with torch.no_grad():
        for m in model2.modules():
            if isinstance(m, nn.Linear):
                m.weight.fill_(-1.0)
                m.bias.fill_(-5.0)
    debugger2 = NetworkDebugger(model2)
    optimizer2 = torch.optim.Adam(model2.parameters(), lr=1e-3)
    for step in range(50):
        optimizer2.zero_grad()
        out = model2(x)
        loss = criterion(out, y)
        debugger2.record_loss(loss.item())
        loss.backward()
        optimizer2.step()
    debugger2.print_report()
    debugger2.remove_hooks()

    print("\n" + "=" * 60)
    print("BUG 3: Missing zero_grad (gradients accumulate)")
    print("=" * 60)
    model3 = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 2))
    debugger3 = NetworkDebugger(model3)
    optimizer3 = torch.optim.SGD(model3.parameters(), lr=0.01)
    for step in range(50):
        out = model3(x)
        loss = criterion(out, y)
        debugger3.record_loss(loss.item())
        loss.backward()
        optimizer3.step()
    debugger3.print_report()
    debugger3.remove_hooks()

    print("\n" + "=" * 60)
    print("HEALTHY NETWORK: Correct setup for comparison")
    print("=" * 60)
    model_good = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 2))
    debugger_good = NetworkDebugger(model_good)
    optimizer_good = torch.optim.Adam(model_good.parameters(), lr=1e-3)
    for step in range(50):
        optimizer_good.zero_grad()
        out = model_good(x)
        loss = criterion(out, y)
        debugger_good.record_loss(loss.item())
        loss.backward()
        optimizer_good.step()
    debugger_good.print_report()
    debugger_good.remove_hooks()

    print("\n" + "=" * 60)
    print("OVERFIT-ONE-BATCH TEST (healthy model)")
    print("=" * 60)
    model_test = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 2))
    overfit_one_batch(model_test, x[:8], y[:8], criterion)

    print("\n" + "=" * 60)
    print("LEARNING RATE FINDER")
    print("=" * 60)
    model_lr = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 2))
    find_learning_rate(model_lr, x, y, criterion)

    print("\n" + "=" * 60)
    print("GRADIENT CHECK")
    print("=" * 60)
    model_grad = nn.Sequential(nn.Linear(10, 8), nn.ReLU(), nn.Linear(8, 2))
    gradient_check(model_grad, x[:4], y[:4], criterion)
```

## 使用它

### PyTorch Built-in Tools

```python
import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(768, 256),
    nn.ReLU(),
    nn.Linear(256, 10),
)

with torch.autograd.detect_anomaly():
    output = model(input_tensor)
    loss = criterion(output, target)
    loss.backward()

for name, param in model.named_parameters():
    if param.grad is not None:
        print(f"{name}: grad_mean={param.grad.abs().mean():.2e}")
```

### Weights & Biases 集成

```python
import wandb

wandb.init(project="debug-training")

for epoch in range(100):
    loss = train_one_epoch()
    wandb.log({
        "loss": loss,
        "lr": optimizer.param_groups[0]["lr"],
        "grad_norm": torch.nn.utils.clip_grad_norm_(model.parameters(), float("inf")),
    })

    for name, param in model.named_parameters():
        if param.grad is not None:
            wandb.log({f"grad/{name}": wandb.Histogram(param.grad.cpu().numpy())})
```

### TensorBoard

```python
from torch.utils.tensorboard import SummaryWriter

writer = SummaryWriter("runs/debug_experiment")

for epoch in range(100):
    loss = train_one_epoch()
    writer.add_scalar("Loss/train", loss, epoch)

    for name, param in model.named_parameters():
        writer.add_histogram(f"weights/{name}", param, epoch)
        if param.grad is not None:
            writer.add_histogram(f"gradients/{name}", param.grad, epoch)
```

### Debug Checklist（完整 Training 之前）

1. 运行 overfit-one-batch test。如果失败，停止。
2. 打印 model summary，验证 parameter count 合理。
3. 用 random data 运行一次 forward pass，检查 output shape。
4. 训练 5 个 epochs，验证 loss 下降。
5. 检查 activation statistics：没有 dead layers，没有 explosions。
6. 检查 gradient flow：没有 vanishing，没有 exploding。
7. 验证 data pipeline：打印 5 个 random samples 及其 labels。

## 交付它

本课会产出：
- `outputs/prompt-nn-debugger.md` -- 用于诊断 Neural Network training failures 的 prompt
- `outputs/skill-debug-checklist.md` -- 用于 debugging training issues 的 decision-tree checklist

debugging 的关键 deployment patterns：
- 向 production training scripts 添加 monitoring hooks
- 每 N steps 将 activation 和 gradient statistics 记录到 W&B 或 TensorBoard
- 为 NaN loss、dead neurons（>80% zero）或 gradient explosion 实现 automatic alerts
- 每次修改 architectures 或 data pipelines 时，始终运行 overfit-one-batch test

## 练习

1. **添加 exploding gradient detector。** 修改 `NetworkDebugger`，让它检测 Gradients 何时超过 threshold，并自动建议 gradient clipping value。在一个没有 normalization 的 20-layer network 上测试它。

2. **构建 dead neuron resurrector。** 编写一个函数，识别 dead ReLU neurons（始终输出 0），并使用 Kaiming initialization 重新初始化它们的 incoming weights。展示这能恢复一个 >70% neurons 都 dead 的 network。

3. **实现带 plotting 的 learning rate finder。** 扩展 `find_learning_rate`，将结果保存为 CSV，并编写一个单独脚本读取 CSV、使用 matplotlib 显示 LR vs loss curve。识别 CIFAR-10 上 ResNet-18 的 optimal LR。

4. **创建 data pipeline validator。** 编写一个函数，检查：train/test splits 之间的 duplicate samples、label distribution imbalance（>10:1 ratio）、input normalization（mean 接近 0，std 接近 1），以及 data 中的 NaN/Inf values。在一个故意 corrupt 的 dataset 上运行它。

5. **Debug 一个真实 failure。** 使用 Lesson 10 中的 mini-framework，引入一个 subtle bug（例如，在 backward 中转置 weight matrix），并使用 gradient checking 精确定位哪个 parameter 的 Gradients 不正确。记录 debugging process。

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Silent bug | "它能运行，但结果很差" | 不产生错误但降低 model quality 的 bug，是 ML 中占主导的 failure mode |
| Dead ReLU | "neurons 死了" | 输入始终为负的 ReLU neuron，因此它输出 0，并永久接收 0 Gradient |
| Vanishing gradients | "Early layers 停止学习" | Gradients 在 layers 中指数级缩小，使 early layers 的 weights 实际上被冻结 |
| Exploding gradients | "Loss 变成了 NaN" | Gradients 在 layers 中指数级增长，导致 weight updates 大到 overflow |
| Gradient checking | "验证 backprop 是否正确" | 将 backprop 得到的 analytical gradients 与 finite differences 得到的 numerical gradients 比较 |
| Overfit-one-batch | "最重要的 debug test" | 在单个小 batch 上训练，以验证 model 是否能学习；如果不能，说明存在根本性问题 |
| LR finder | "Sweep 以找到正确的 learning rate" | 在一个 epoch 内指数级增大 learning rate，并选择 loss diverge 前的 rate |
| Data leakage | "Test data 泄漏进 training" | test set 的信息污染了 training，产生人为偏高的 accuracy |
| Activation statistics | "监控 layer health" | 跟踪每层 output 的 mean、std 和 zero-fraction，以检测 dead、saturated 或 exploding neurons |
| Gradient clipping | "限制 Gradient magnitude" | 当 Gradients 的 norm 超过 threshold 时将其缩小，防止 exploding gradient updates |

## 延伸阅读

- Smith, "Cyclical Learning Rates for Training Neural Networks" (2017) -- 提出 learning rate range test（LR finder）的论文
- Northcutt et al., "Pervasive Label Errors in Test Sets Destabilize Machine Learning Benchmarks" (2021) -- 证明 ImageNet、CIFAR-10 和其他主要 benchmarks 中有 3-6% 的 labels 是错误的
- Zhang et al., "Understanding Deep Learning Requires Rethinking Generalization" (2017) -- 这篇论文展示 Neural Networks 可以记住 random labels，这也是 overfit-one-batch test 有效的原因
- PyTorch documentation 中关于 `torch.autograd.detect_anomaly` 和 `torch.autograd.set_detect_anomaly` 的 built-in NaN/Inf detection
