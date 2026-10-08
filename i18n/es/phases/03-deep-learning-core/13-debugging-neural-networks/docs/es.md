# 调试 Redes neuronales

> Tu red 编译成功了――它运行了――它产生了一个数字――这个数字是错误的,而且什么都没有崩――欢迎来到最难的类型:没有错误消息的调试――

**类型：**Construir
**语言：**Python, PyTorch
**前置要求：**Fase 03 Lecciones 01-10 (especialmente la retropropagación, las funciones de pérdida, los optimizadores)
**时间：**- 90 minutos

## El objetivo del aprendizaje

- Uso sistemático de descomposición 策略诊断常见 神经网络故障(NaN pérdida、平坦的损失曲线、过配、oscillación)
-  aplicación "overfit one batch" 技术,验证模型架构 和培训循环 是否正确
- 检查 Gradiente magnitud  Distribución de activación y norma de peso, para identificar desaparecimiento/explosión Gradiente 问题
- Construir una lista de verificación de descomposición, cubrir la tubería de datos, arquitectura de modelos, pérdida de función, optimización y tasa de aprendizaje  problemas

##  problemas

传统软件坏掉时会崩──null pointer 会抛出例外──type mismatch 会在编译时间 失败──off-by-one error 会产生明显错误的输出──

Las redes neuronales no te darán esta facilidad.

Una red neuronal que se ha roto se ejecutará completamente, imprimirá un valor de pérdida, y emitirá predicciones. Las predicciones podrían parecer razonables. Pero el modelo está en proceso de error: aprender atajos, ruido de memoria, o recibir un mínimo local inútil.

Entre un modelo que puede funcionar y un modelo que se ha roto, siempre sólo hay una línea diferente de código de error: falta de`zero_grad()`、转置的 dimension、偏差 10x 的学习率──经典的"Recepta para entrenar redes neuronales"(2019)开篇就说:"Los errores de red neuronal más comunes son los errores que no se estrellan".

Esta clase te enseñará a encontrar estos insectos.

## 核心概念 核心概念 核心概念 核心概念

### Deshacerse de la mentalidad

忘掉打印和喷涂 式调试――Neural Network debugging 需要系统化方法,因为反循环 很慢(每次训练运行 需要几分钟到几小时),而症状也很模糊(mala pérdida 可能意味着20种不同的问题)

黄金法则:**从简单开始，一次只增加一个复杂度，并独立验证每一部分。**

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

### Sintoma 1: Pérdida 不下降

Es la queja más común. En el ciclo de entrenamiento, las épocas no se mueven, mientras que las pérdidas se mantienen planas o oscilan intensamente.

**错误的 learning rate。**太高:loss oscillate 或跳到NaN──太低:loss 下降得非常慢,看起来像是平的──对亚当,从1e-3 开始──对SGD,从1e-1 或 1e-2 开始──在决定其他地方有问题之前,始终尝试 3 个相差 10x 的学习率(例如1e-2、1e-3、1e-4)──

**Dead ReLUs。**Si una neurona ReLU  recibe una entrada negativa muy grande, que saque 0, y su Gradiente es 0―, que no se activará más―, si mueren neuronas suficientes, la red no puede aprender―, método de examen: imprimir cada capa ReLU                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

**Vanishing gradients。**En las redes profundas de activaciones sigmoides o tanh, los gradientes en retroceso se reducen en los niveles de distribución. Cuando llegan a la primera capa, casi para ~0── los primeros varios niveles de aprendizaje se detienen.

**Exploding gradients。**相反问题:Gradientes 指数级增长──常见于RNNs 和非常深的网络──Loss 跳到NaN──修复方法:gradient clipping(`torch.nn.utils.clip_grad_norm_`•• disminuir la tasa de aprendizaje o añadir la normalización

### Sinfón 2: pérdida baja pero el modelo es muy malo

La pérdida se redujo. La precisión de entrenamiento alcanzó el 99%. Pero la precisión de los ensayos es del 55%. O el modelo en datos reales produce una salida sin sentido.

**Overfitting。**El modelo 记住了训练数据,而不是学习模式── training loss和 validation loss 间的差距 会随时间变大──修复方法:更多数据、减量、减重、早期停止、数据增量──

**Data leakage。**Los datos de prueba se han filtrado en el entrenamiento. Precisión.

**Label errors。**La mayoría de los conjuntos de datos reales en el mundo tienen entre el 5-10% de etiquetas erradas. Northcutt et al., 2021 -- "Erros de etiqueta generalizados en los conjuntos de prueba")

### Síntoma 3: aparición de pérdida en el interior de la sangre o de la sangre

valor de pérdida 变成 `nan`O `inf`❖ Entrenamiento 已失败──

**Learning rate 太高。**Actualizaciones gradual 跨得太远, provocando que los pesos exploten──修复方法:降低 10x──

**log(0) 或 log(negative)。**pérdida de entropía cruzada 会计算 `log(p)`Si tu modelo 输出精确的 0 o negativa probabilidad, el registro explotará 修复方法:`[eps, 1-eps]`, entre ellos `eps=1e-7`¿Qué es eso?

**除以零。**La normalización de lote 会除以标准偏移──constante de valores de lote 有 std=0──修复方法:在分母中添加epsilon(PyTorch 默认会这样做,但定制实现可能不会)

**Numerical overflow。**Grandes activaciones 输入 `exp()`Se puede encontrar una solución a este problema.

### Técnica 1: Verificación de los gradientes

Comparar los gradientes analíticos de tu sistema de retroceso con los gradientes numéricos de diferencias finitas. Si no coinciden, indicar que hay un error.

参数                      `w`de gradiente numérico:

```
grad_numerical = (loss(w + eps) - loss(w - eps)) / (2 * eps)
```

Una homogeneidad de indicios:

```
rel_diff = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

Si es que`rel_diff < 1e-5`Si es cierto.`rel_diff > 1e-3`Hay un error.

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

### Técnica 2:Estadísticas de activación

Durante el entrenamiento  monitor de medias y desviaciones estándar de cada nivel posterior de activaciones ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞

| Health indicator | Mean | Std | Diagnosis |
|-----------------|------|-----|-----------|
| Healthy | ~0 | ~1 | Network 正常学习 |
| Saturated | >>0 or <<0 | ~0 | Activations 卡在极端值 |
| Dead | 0 | 0 | Neurons 已经 dead（全为零） |
| Exploding | >>10 | >>10 | Activations 无界增长 |

### Técnica 3: Gradiente de la visibilidad

Mágrada de gradiente media de cada capa En la red de salud, las magnitudes de gradiente de cada capa 应大致相近. Si los gradientes de las capas tempranas son menores que los de la última fase, hay gradientes que desaparecen.

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

### Técnica 4: Prueba de sobreajuste en un lote

Es la técnica de depuración más importante del aprendizaje profundo.

取一个小批(8-32个样本) ――在它上面训练100+代谢――损失 应该接近零,训练精度 应该达到100%──如果没有,说明你的模型或训练循环有根本性 bug,不要继续进行完整训练──

Esta prueba puede capturar:
- 损坏的 pérdida funciones
- 损坏的 pase hacia atrás
- Arquitectura 太小,无法表示数据
- Optimizer  no conectado a los parámetros del modelo
- Datos y etiquetas no están en juego

Sólo necesita 30 segundos para funcionar, pero puede ahorrar un par de horas de depuración de las carreras completas de entrenamiento.

### Técnica 5:Finder de tasas de aprendizaje

Leslie Smith(2017) propuso, en una época, que la tasa de aprendizaje dentro de la línea de aprendizaje de muy pequeño a muy grande, a la vez que la tasa de pérdida de aprendizaje en comparación con la tasa de aprendizaje.

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

El mejor LR de este caso: ~1e-3(punto más profundo 之前一个数量级)

### 常见 PyTorch Bugs

Estos son los errores de la comunidad PyTorch:

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

### Mesa de desarreglamiento de la máquina

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

## Construirlo

Una herramienta de diagnóstico, para controlar las activaciones, los gradientes y las curvas de pérdida.

### Paso 1: Red debugger clase

En el modelo PyTorch, registran la activación y las estadísticas de gradientes de cada nivel.

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

### Paso 2: Prueba de sobrevaloración de un lote

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

### Paso 3:Finder de tasas de aprendizaje

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

### 步骤 4: Verificador de gradientes

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

### Paso 5: Desgraciando las redes

Ahora se aplicará el kit de herramientas a las redes rotas, y se diagnosticará cada problema.

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

## Usalo

### Herramientas incorporadas de PyTorch

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

### Pesos y prejuicios 集成

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

### Tensión de la placa

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

### Descargar lista de verificación (la lista de verificación)

1. 运行 Overfit-one-batch test―... si fracasa, para―
2. 打印 modelo resumen, el número de parámetros de verificación 合理。
3. Usando datos aleatorios, un pase hacia adelante, revisando la forma de salida.
4. Entrenamiento 5 épocas, pérdida de pruebas.
5. 检查激活统计: no hay capas muertas, no hay explosiones.
6. 检查梯流: no desaparece, no explotó。
7. 验证 data pipeline: imprimir 5 muestras aleatorias  y sus etiquetas。

##  entregarlo

Encuentro de trabajo:
- `outputs/prompt-nn-debugger.md`-- Usado para diagnosticar fallas de entrenamiento de la red neuronal
- `outputs/skill-debug-checklist.md`-- para deshacerse de los problemas de entrenamiento de la lista de árbol de decisión

Desarrollo de problemas de desarollo de los patrones de despliegue de los componentes:
- A los guiones de formación de producción 添加 ganchos de monitoreo
- Cada N pasos se activará y las estadísticas de gradientes  registrado hasta W & B o TensorBoard
- Por pérdida de neuronas muertas, > 80% cero) o explosión de gradiente, se logran alertas automáticas.
- Cada vez que se modifican las arquitecturas o las tuberías de datos, siempre se realiza una prueba de un lote de sobrante

##  ejercicios

1. **添加 exploding gradient detector。**修改                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `NetworkDebugger`, que lo detecte Gradientes cada vez que exceda el umbral, y automáticamente sugiere el valor de recorte de gradientes.

2. **构建 dead neuron resurrector。**编写一个函数,识别死 ReLU neurones(始终输出 0),并使用Kaiming inicialization 重新初始化它们的输入权力──展示这能恢复一个>70%的神经元都死网──

3. **实现带 plotting 的 learning rate finder。**扩展 `find_learning_rate`, salvará el resultado para CSV, y redactará un guión individual para leer CSV, utilizará un matplotlib para mostrar la curva de pérdida LR en comparación con la CIFAR-10 y la ResNet-18 en una óptima LR.

4. **创建 data pipeline validator。**编写一个函数,检查:train/test split 之间复制样本、标签分布失衡(>10:1 ratio)、输入正常化(mean 接近 0,std 接近 1),以及数据中的 NaN/Inf values──在一个故意腐败的数据集上运行它──

5. **Debug 一个真实 failure。**Utiliza Mini-framework de la Lección 10 Entra, introduce un error sutil, por ejemplo, en la matriz de peso de la vuelta al centro),并 utiliza comprobando el gradiente 精确定位哪个参数的 Gradients 不正确──记录调试过程──

## 关键术语: "El hombre es un hombre"

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

- Smith, "Tas de aprendizaje cíclico para la formación de redes neuronales" (2017) --  proposar el test de rango de tasa de aprendizaje (LR finder) 的论文
- Northcutt et al., "Erros de etiqueta generalizados en los ensayos de prueba desestabilizan los puntos de referencia de aprendizaje automático" (2021) -- prova ImageNet、CIFAR-10 y otros puntos de referencia principales entre los cuales hay etiquetas de 3-6% que son erróneas
- Zhang et al., "Comprender el aprendizaje profundo requiere de repensas generalizaciones" (2017) -- este artículo muestra que las redes neuronales pueden recordar etiquetas aleatorias, esto es también una prueba de overfit-one-batch eficaz
- Documentación PyTorch 中关于 `torch.autograd.detect_anomaly`Y `torch.autograd.set_detect_anomaly`La detección de NaN/Inf
