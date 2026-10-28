---
id: optimizers-schedules
title: Optimizers and Learning Rate Schedules
code: OL
subtitle: 选择 SGD、Adam 或 AdamW，塑造学习率，再安全地裁剪、缩放与累积梯度。
hue: 28
sources: phases/03-deep-learning-core/06-optimizers, phases/03-deep-learning-core/09-learning-rate-schedules, phases/19-capstone-projects/44-cosine-lr-warmup, phases/19-capstone-projects/45-gradient-clipping-amp, phases/19-capstone-projects/46-gradient-accumulation
source_hash: 6af6a467fef2cb6e
---

## 优化器并排对比
type: comparison
span: 2
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/06-optimizers/code/main.py

| 优化器 | 默认值 | 行为 |
|---|---|---|
| `SGD` | `lr=0.01` | 所有权重同一学习率。在山谷两侧振荡 |
| `SGDMomentum` | `lr=0.01, beta=0.9` | 大约保留最近 10 个梯度。3000-5000 步，而不是 10000 |
| RMSProp | `epsilon=1e-8` | 每个梯度除以运行 RMS |
| `Adam` | `lr=0.001, beta1=0.9, beta2=0.999` | Momentum 加 RMSProp 再加偏置校正 |
| `AdamW` | `weight_decay=0.01` | 与 Adam 相同。衰减不被自适应因子缩放 |

## 更新规则
type: concepts
from: phases/03-deep-learning-core/06-optimizers/docs/en.md

- **SGD**：$w = w - \text{lr} \cdot g$
- **Momentum**：$m_t = \beta m_{t-1} + g$，然后 $w = w - \text{lr} \cdot m_t$
- **RMSProp**：$s_t = \beta s_{t-1} + (1 - \beta) g^2$，步长 $\text{lr} \cdot g / (\sqrt{s_t} + \epsilon)$
- **Adam 矩**：$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g$ 与 $v_t = \beta_2 v_{t-1} + (1 - \beta_2) g^2$
- **偏置校正**：$\hat{m} = m_t / (1 - \beta_1^t)$。前约 10 步很重要。
- **Adam 步**：$w = w - \text{lr} \cdot \hat{m} / (\sqrt{\hat{v}} + \epsilon)$
- **AdamW 步**：Adam 步，再对权重做 $- \text{lr} \cdot \lambda w$。

## 何时用各优化器
type: tips
from: phases/03-deep-learning-core/06-optimizers/docs/en.md

- Transformer 或 LLM 用 AdamW：lr=1e-4，wd=0.01-0.1。
- CNN 或 ResNet 用 SGD + Momentum：lr=0.1，momentum=0.9，weight_decay=1e-4。
- GAN 用 Adam：lr=2e-4，beta1=0.5。
- 微调用 AdamW：lr=2e-5，wd=0.01。
- 还不确定时用 AdamW，lr=3e-4，wd=0.01。
- 默认值失败时，先改 lr。再改 $\beta_2$。几乎从不改 $\beta_1$ 或 $\epsilon$。

## 调度并排对比
type: command-table
span: 2
from: phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/code/main.py, phases/19-capstone-projects/44-cosine-lr-warmup/code/main.py

| 命令 | 作用 |
|---|---|
| `constant_schedule(step, lr=0.01)` | 每步同一学习率。用于小模型和调试 |
| `step_decay_schedule(step, lr=0.1, step_size=100, gamma=0.1)` | 固定步数按 gamma 削减 lr。突变可能让损失尖峰 |
| `cosine_schedule(step, lr=0.01, total_steps=1000, lr_min=1e-5)` | 从 lr 余弦到 lr_min。中等预算的安全默认 |
| `warmup_cosine_schedule(step, lr=0.01, total_steps=1000, warmup_steps=100, lr_min=1e-5)` | 线性升温，再余弦。用于大预算 |
| `one_cycle_schedule(step, lr=0.01, total_steps=1000)` | 从 lr/25 升，再降到 lr/10000。用于小预算 |
| `CosineWithWarmup(warmup_steps, total_steps, lr_max, lr_min)` | 带边界检查的升温加余弦。钉在 `lr_min` |
| `InverseSqrtWarmup(warmup_steps, lr_max)` | 线性升温，然后 `lr_max * sqrt(warmup_steps / step)` |
| `LinearWarmupConstant(warmup_steps, lr_max)` | 线性升温，然后平坦的 `lr_max`。消融基线 |

## 选调度
type: flow
from: phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md

1. **总步数未知**：用恒定 LR，手动衰减。
2. **大预算，数天或数周**：用升温加余弦衰减。升温 = 步数的 1-5%。
3. **中等预算**：用余弦退火。设 lr_min = lr_max / 10。
4. **小预算，数小时**：用 1cycle。用 LR range test 找 lr_max。
5. **微调 Llama 或 GPT 模型**：用 `get_cosine_schedule_with_warmup`，升温 = 总步数的 3-5%。

## 带线性升温的余弦
type: annotated-code
lang: python
from: phases/19-capstone-projects/44-cosine-lr-warmup/code/main.py

```python
def lr(self, step: int) -> float:
    if step < 0:
        raise ValueError(f"step must be non-negative, got {step}")
    if self.warmup_steps > 0 and step <= self.warmup_steps:
        return self.lr_max * (step / self.warmup_steps)   # 0 at step 0
    if step >= self.total_steps:
        return self.lr_min                                 # floor, no extrapolation
    decay_span = max(1, self.total_steps - self.warmup_steps)
    progress = (step - self.warmup_steps) / decay_span
    cosine = 0.5 * (1.0 + math.cos(math.pi * progress))
    return self.lr_min + (self.lr_max - self.lr_min) * cosine
```

## 一步内裁剪与缩放
type: annotated-code
lang: python
from: phases/19-capstone-projects/45-gradient-clipping-amp/code/main.py, phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md

```python
self.optimizer.zero_grad(set_to_none=True)
with torch.amp.autocast(device_type=self.device_type, dtype=self.amp_dtype):
    predictions = self.model(inputs)
    loss = self._loss_fn(predictions, targets)
if not torch.isfinite(loss).all().item():   # skip, do not call update()
    return self._record_skip(...)
self.scaler.scale(loss).backward()
self.scaler.unscale_(self.optimizer)        # clip after unscale
if has_non_finite_grad(self.model.parameters()):
    self.scaler.update()                     # skip, the scaler halves
pre_clip, post_clip = clip_global_l2_norm(list(self.model.parameters()), self.max_norm)
self.scaler.step(self.optimizer)
self.scaler.update()                         # doubles or halves the factor
```

## 累积梯度
type: annotated-code
lang: python
from: phases/19-capstone-projects/46-gradient-accumulation/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/code/main.py

```python
accumulation_steps = effective_batch // (micro_batch * world_size)
for x, y in chunks(x_full, y_full, n):    # n micro-batches
    scaled = criterion(model(x), y) / n     # divide before backward
    scaled.backward()                       # grads sum in param.grad
opt.step()                                  # once per effective batch
with no_sync_context(model):                # all micro-batches but the last
    loss.backward()
```

## 要知道的数字
type: defaults
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/19-capstone-projects/44-cosine-lr-warmup/docs/en.md, phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| Adam/AdamW lr | 1e-4 to 3e-4 | 微调用 1e-5 to 5e-5 |
| Warmup | 1-5% | 第 44 课写总步数的 1-3% |
| `lr_min` | 10 percent | 相对 `lr_max`。零会让训练未完成 |
| Step decay | $\gamma = 0.1$ | step_size = 30 每 30 个 epoch 把 lr 降 10 倍 |
| `max_norm` | 1.0 | 语言模型训练的默认值 |
| Scaling factor | `2^17` | 健康运行饱和在 `2^17` 或 `2^18` 附近 |
| Skip rate alert | 5 percent | 在 1000 步滚动窗口上 |
| Accumulation check | `max_abs_diff < 1e-4` | 整批对照微批 |

## 故障排查
type: troubleshooting
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/19-capstone-projects/44-cosine-lr-warmup/docs/en.md, phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 损失爆炸，权重变成 NaN | lr 过高（lr > 0.01） | 降低 lr。加升温 |
| 损失下降很慢 | lr 过低（lr < 0.00001） | 提高 lr。先扫 `lr_max` |
| 损失在最小值附近振荡 | 后期恒定 lr 过大 | 用余弦或阶梯衰减 |
| 单批损失竖直冲上 | 梯度范数尖峰 | 把全局 L2 范数裁到 1.0 |
| 缩放因子从不变化 | 跳过路径没有 `update()` | 每步调用 `scaler.update()` |
| 优化器步大了 16 倍 | 微批上对损失求和 | 每个损失除以 `accum_steps` |
| 微妙的调度 bug | 先调了 `scheduler.step()` | 先调 `optimizer.step()` |
| 长升温不随规模变 | 升温设成了绝对步数 | 把升温设成总步数的比例 |

## 问答
type: qa
from: phases/03-deep-learning-core/06-optimizers/docs/en.md, phases/03-deep-learning-core/09-learning-rate-schedules/docs/en.md, phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md

- **Adam 为什么要升温？** 它的矩估计从零开始。早期步骤用的是坏统计量。
- **为什么 AdamW 优于 Adam 加 L2？** 每个参数得到相同比例的收缩。
- **CNN 为什么用 SGD？** SGD 找到更平坦的最小值。它们往往泛化更好。
- **1cycle 需要什么？** 事先知道总步数。
- **累积能省时间吗？** 不能。把 `accum_steps` 加倍，每个优化器步的墙钟时间也加倍。
- **CPU autocast 需要损失缩放吗？** 不需要。CPU autocast 默认用 BF16。
