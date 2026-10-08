# 调试 Réseaux neuronaux

> Votre réseau a réussi à se débarrasser. Il a fonctionné. Il a généré un chiffre. Ce chiffre est erroné, et rien n'a été cassé.

**类型：**Construire
**语言：**Python, PyTorch
**前置要求：**Phase 03 Leçons 01-10 (en particulier la répartition, les fonctions de perte, les optimisateurs)
**时间：**- 90 minutes

## Objectif de l'apprentissage

- Utilisation de débogage systémique 策略诊断常见 神经网络故障(NaN loss、平坦的 loss curve、overfitting、oscillation)
- 应用 "overfit one batch" 技术,验证模型架构 和培训循环 是否正确
- 检查 Gradient magnitude、Distribution d'activation et norme de poids, pour identifier la disparition/explosion Gradient  problématique
- Construire une liste de contrôle de débogage, couvrir le pipeline de données, l'architecture de modèle, la perte de fonction, l'optimisateur et le taux d'apprentissage  problèmes

##  problématique

传统软件坏掉时会崩──null pointer 会抛出例外──type de déséquilibre 会在编译时间 失败──off-by-one error 会产生明显错误的输出──

Les réseaux neuraux ne vous donneront pas cette facilité.

Un réseau neural raté se déroulera complètement, imprimera une valeur de perte, et sortira des prédictions. Les prédictions pourraient sembler raisonnables. Mais le modèle est en train de se tromper: apprendre des raccourcis, des bruits de mémoire ou de recevoir un minimum local inutile.

Entre un modèle fonctionnel et un modèle cassé, il y a toujours une différence de code:`zero_grad()`、转置的 dimension、偏差 10x 的学习率──经典的"Recipe for Training Neural Networks" (WEB) 开篇就说:"Les erreurs les plus courantes du réseau neural sont les bugs qui ne se crashent pas".

Cette classe t'apprendra à trouver ces insectes.

## 核心概念

### Déformer l'état d'esprit

忘掉print-and-pray 式调试――Neural Network debugging 需要系统化方法,因为反循环 很慢(每次训练运行 需要几分钟到几小时),而症状也很模糊(坏损失可能意味着20种不同的问题)

La loi de l'or:**从简单开始，一次只增加一个复杂度，并独立验证每一部分。**

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

### Symptome 1: Perte 不下降

C'est le plus courant de plaintes. Les époques continuent de progresser, les pertes continuent de s'accélérer.

**错误的 learning rate。**太高:loss oscillate 或跳到NaN──太低:loss 下降得非常慢,看起来像是平的──对亚当,从1e-3 开始──对SGD,从1e-1 或 1e-2 开始──在决定其他地方有问题之前,始终尝试 3 个相差 10x 的学习率(例如1e-2、1e-3、1e-4)──

**Dead ReLUs。**Si un neurone ReLU  reçoit une très grande entrée négative, il sort 0, et son gradient est 0, il ne s'activeront plus.

**Vanishing gradients。**Dans les réseaux profonds d'activations sigmoïdes ou tanh, les gradients sont réduits en arrière-plan.

**Exploding gradients。**Répondre à la question:Gradients Index Grade Growth, fréquemment observé sur les RNN et les réseaux très profonds, Perte de la vitesse de saut à la NaN, modification de la méthode:`torch.nn.utils.clip_grad_norm_`)、 réduire le taux d'apprentissage, ou ajouter une normalisation¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

### Symptome 2: Perte descendante mais le modèle est très mauvais

La perte de la précision de formation a diminué à 99% mais la précision des tests est de 55%.

**Overfitting。**Le modèle 记住了训练数据,而不是学习模式── training loss和 validation loss 间隔 会随时间变大──修复方法:更多数据、降落、体重衰退、早期停止、数据增多──

**Data leakage。**Les données de test 泄漏进了训练──精度 高得可疑──常见原因:split 之前 shuffle、使用完整数据集的统计做做预处理、不同分分 之间存在重复样品──修复方法:先分,再预处理,检查重复──

**Label errors。**La plupart des ensembles de données réelles ont entre 5 et 10% des étiquettes sont erronées. Northcutt et al., 2021 -- "Erres de marque généralisées dans les ensembles de tests")

### Symptome 3: L'apparition de la perte de NaN ou de l'inf

valeur de perte 变成 `nan`Ou `inf`❖ La formation est déjà défaillante

**Learning rate 太高。**Les mises à jour progressives 跨得太远, entraînent une explosion des poids.

**log(0) 或 log(negative)。**Perte de l' entropie croisée 会计算 `log(p)`Si votre modèle 输出精确的 0或负概率, le log 会爆炸──修复方法:`[eps, 1-eps]`, parmi lesquels `eps=1e-7`Il y a une autre.

**除以零。**La normalisation de lot est différente de l'écart standard. Les valeurs constantes sont std = 0.

**Numerical overflow。**Les activations sont activées`exp()`Il est particulièrement facile de trouver ce problème.

### Technique 1: Contrôle des degrés

Comparer vos gradients analytiques avec les gradients numériques si elles ne sont pas conformes.

参数 `w`Le gradient numérique:

```
grad_numerical = (loss(w + eps) - loss(w - eps)) / (2 * eps)
```

Une étiquette de différence relative:

```
rel_diff = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

Si `rel_diff < 1e-5`Si c'est vrai.`rel_diff > 1e-3`Il y a un bug.

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

### Technique 2: Statistiques d'activation

Pendant la formation, surveillez la moyenne et les écarts standards de chaque niveau de l'activation de l'activité (en moyenne, près de 0), ou au moins, gardez une limite.

| Health indicator | Mean | Std | Diagnosis |
|-----------------|------|-----|-----------|
| Healthy | ~0 | ~1 | Network 正常学习 |
| Saturated | >>0 or <<0 | ~0 | Activations 卡在极端值 |
| Dead | 0 | 0 | Neurons 已经 dead（全为零） |
| Exploding | >>10 | >>10 | Activations 无界增长 |

### Technique 3: Gradient 流可视化

绘制每一层的平均渐进大小――在健康的网络中, dans chaque couche de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de la gradiente de gradiente de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient de gradient

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

### Technique 4: Test sur mesure en un seul lot

C'est la technique de débogage la plus importante de Deep Learning.

取一个小批次 (8-32 个样本) ⋅在它上面训练100+iterations──输掉 应该接近零,训练精度 应该达到100%──如果没有,说明你的模型或训练循环有根本性 bug,不要继续进行完整训练──

Cette expérience peut être capturée:
- 损坏的 Loss Functions
- Les passes à l' arrière
- Architecture 太小,无法表示数据
- Optimisateur  pas de connexion aux paramètres du modèle
- Les données et les étiquettes sont incohérentes

Il ne faut que 30 secondes pour fonctionner, mais il peut économiser quelques heures de débogage des exercices de formation complets.

### Technique 5:Rate Finder d'apprentissage

Leslie Smith(2017) a proposé, dans une époque, le taux d'apprentissage intérieur de très petit 1e-7) passe à très grand [10]), en même temps que le taux de perte de données.

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

Le meilleur LR: ~1e-3(point le plus profond 之前一个数量级)

### 常见 Les insectes pyTorch

Ce sont les bugs de la communauté PyTorch.

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

### Tableau de débogage

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

## - Je le construis.

Un outil de diagnostic, utilisé pour surveiller les activations, les gradients et les courbes de perte. Vous allez délibérément détruire un réseau, et utiliser ce outil pour diagnostiquer chaque problème.

### 步骤 1: Classe de débogage réseau

En utilisant le modèle PyTorch, enregistrer l'activation et les statistiques de gradients de chaque niveau.

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

### 步骤 2: Test de sur-fit-un-batch

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

### 步骤 3:Leurneur de taux d'apprentissage

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

### 步骤 4: vérificateur de degrés

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

### 步骤 5: Délibérément détruire les réseaux

Maintenant, le kit d'outils sera appliqué à des réseaux cassés.

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

## Utilisez-le

### Outils intégrés à PyTorch

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

### Poids et préjugés 集成

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

### Tableau de tension

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

### Débug Checklist (en anglais seulement)

1. 运行 Overfit-one-batch test──si vous échouez, arrêtez──
2. 打印 modèle résumé, vérification du nombre de paramètres 合理。
3. Avec des données aléatoires, une fois, passez à l'avant, vérifiez la forme de sortie.
4. 5 époques, perte de certification, déclin.
5. 检查激活统计: pas de couches mortes, pas d'explosions
6. 检查梯度流: pas de disparition, pas d'explosion
7. 验证 data pipeline: imprimer 5 échantillons aléatoires  et leurs étiquettes。

## Je le livre.

Le cours est ouvert à:
- `outputs/prompt-nn-debugger.md`-- Pour diagnostiquer rapidement les défaillances de formation du réseau neuronal
- `outputs/skill-debug-checklist.md`-- Pour débogage des problèmes de formation de la liste de contrôle de l' arbre de décision

Déboguer des schémas de déploiement clés:
- À la production des scripts de formation 添加 les crochets de surveillance
- Chaque N étapes sera l' activation et les statistiques de gradients enregistrées à W & B ou TensorBoard
- Pour la perte de neurones morts > 80% zéro) ou une explosion de gradient
- Chaque modification des architectures ou des pipelines de données 时,始终运行

## 练习

1. **添加 exploding gradient detector。**修改 `NetworkDebugger`, laissez-le tester Gradients quand il dépasse le seuil, et suggère automatiquement la valeur de coupe de gradient.

2. **构建 dead neuron resurrector。**编写一个函数,识别死RLU neurons(始终输出 0),并使用Kaiming initialization 重新初始化它们的进来的重量──展示这能恢复一个>70%的神经元都死的网络──

3. **实现带 plotting 的 learning rate finder。**扩展 `find_learning_rate`, sauvegarder le résultat pour CSV, et rédiger un seul script pour lire CSV, utiliser un matplotlib pour afficher la courbe LR vs perte, identifier la LR optimale de CIFAR-10 et ResNet-18

4. **创建 data pipeline validator。**编写一个函数,检查:train/test split 之间 des échantillons dupliqués、étiquette déséquilibre de distribution(>10:1 ratio)、normalité de l'entrée(méan 接近 0,std 接近 1), ainsi que les valeurs NaN/Inf du milieu des données──在一个故意腐败的数据集 上运行它──

5. **Debug 一个真实 failure。**Utilisez le mini-cadre de la leçon 10, introduisez un bug subtil, par exemple, dans la matrice de poids de transposition en arrière, et utilisez la vérification des gradients.

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

- Smith, "Times d'apprentissage cycliques pour la formation des réseaux neuronaux" (2017) --  proposer test de gamme de taux d'apprentissage (LR finder)
- Northcutt et coll., "Erres de marque généralisées dans les ensembles de tests déstabilisent les critères de référence de l'apprentissage automatique" (2021) -- provable ImageNet、CIFAR-10 和 autres principaux critères de référence parmi lesquels il y a 3-6% des étiquettes sont erronées
- Zhang et coll., "Comprendre l'apprentissage profond nécessite une rééducation générale" (2017) -- This article paper show Neural Networks can remember random labels, this is also overfit-one-batch test 有效的原因
- Documents de PyTorch`torch.autograd.detect_anomaly`et `torch.autograd.set_detect_anomaly`La détection intégrée de NaN/Inf
