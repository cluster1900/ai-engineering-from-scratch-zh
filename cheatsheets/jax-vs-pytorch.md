---
id: jax-vs-pytorch
title: JAX against PyTorch
code: JP
subtitle: 基于 tape 的 eager 自动微分，对比经过追踪与编译的纯函数。同一个 MNIST MLP 的两种写法，附 API 与易错点。
hue: 280
sources: phases/03-deep-learning-core/10-mini-framework, phases/03-deep-learning-core/11-intro-to-pytorch, phases/03-deep-learning-core/12-intro-to-jax
source_hash: 74354f7a9889b59d
---

## 并列对比
type: comparison
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/12-intro-to-jax/docs/en.md

| 因素 | PyTorch | JAX |
|---|---|---|
| 自动微分 | 基于 tape 的 autograd | 函数变换 |
| 执行 | Eager（C++ kernel） | 追踪 + JIT 编译 |
| 模型 | `nn.Module` | 纯函数：`f(params, x) -> y` |
| TPU 支持 | 社区维护（torch_xla） | 一等支持 |
| GPU 支持 | 同类最佳（原生 CUDA） | 良好（经 XLA 的 CUDA） |
| 调试 | 容易（eager，逐行） | 困难（追踪 + 编译） |
| 速度（MNIST MLP） | ~0.5s/epoch | ~0.3s/epoch |
| 多设备 | `FSDP` | `jax.pmap(f)` |

## 同一任务，两套 API
type: comparison
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/12-intro-to-jax/docs/en.md

| 任务 | PyTorch | JAX |
|---|---|---|
| 获取梯度 | `loss.backward()` | `jax.grad(loss_fn)(params, x, y)` |
| 清空梯度 | `optimizer.zero_grad()` | 不需要。梯度是返回值 |
| 更新参数 | `optimizer.step()` | `optax.apply_updates(params, updates)` |
| Adam | `torch.optim.Adam(model.parameters(), lr=1e-3)` | `optax.adam(learning_rate=1e-3)` |
| 对样本批处理 | `for x in batch:` | `jax.vmap(f)` |
| 保存参数 | `model.parameters()` | 不可变的数组 pytree |
| 设置随机种子 | `torch.manual_seed` | `jax.random.PRNGKey(42)` |
| 保存权重 | `torch.save(model.state_dict(), "model.pt")` | `checkpointer.save('/tmp/model', params)` |

## 两种执行模型
type: architecture
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/12-intro-to-jax/docs/en.md

```arch
node | call | 1,1 | model(x) | runs now, eager | process
node | tape | 2,1 | Tape | records each op | store
node | bwd | 3,1 | loss.backward() | replays tape in reverse
node | step | 4,1 | optimizer.step() | mutates params
node | fn | 1,2 | Pure function | f(params, x) -> y
node | grad | 2,2 | jax.grad | returns a grad function
node | jit | 3,2 | jax.jit | traces on first call
node | xla | 4,2 | XLA | fused machine code | gpu
edge | call | tape | ops
edge | tape | bwd |
edge | bwd | step | .grad
edge | fn | grad |
edge | grad | jit |
edge | jit | xla | trace
```

## 一次 JAX 训练步
type: flow
from: phases/03-deep-learning-core/12-intro-to-jax/docs/en.md, phases/03-deep-learning-core/12-intro-to-jax/code/jax_intro.py

1. **init_params**：`random.split(key, 3)` 给出三个 key。He 缩放为 `jnp.sqrt(2.0 / 784)`。
2. **optimizer.init**：`opt_state = optimizer.init(params)` 保存 Adam 状态。
3. **jax.value_and_grad**：一次计算同时返回损失和梯度。
4. **optimizer.update**：把梯度变为更新量和新的 `opt_state`。
5. **optax.apply_updates**：返回新参数，不修改任何东西。
6. **首次调用**：JAX 追踪 `train_step` 并编译为 XLA。第一个 epoch 较慢。
7. **后续调用**：跳过 Python。第 2-10 个 epoch 很快。10 个 epoch 测试准确率约 ~97%。

## PyTorch：MNIST MLP 循环
type: annotated-code
lang: python
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/11-intro-to-pytorch/code/pytorch_intro.py

```python
model = MNISTModel().to(device)                  # 784, 256, 128, 10
criterion = nn.CrossEntropyLoss()                # takes raw logits
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
for epoch in range(10):
    model.train()                                # dropout on
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()                    # grads accumulate
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()                          # replays the tape
        optimizer.step()
torch.save(model.state_dict(), "mnist_mlp.pt")   # ~97.8% test accuracy
```

## JAX：MNIST MLP 循环
type: annotated-code
lang: python
from: phases/03-deep-learning-core/12-intro-to-jax/code/jax_intro.py, phases/03-deep-learning-core/12-intro-to-jax/docs/en.md

```python
optimizer = optax.adam(learning_rate=1e-3)
@jax.jit                                           # compile to XLA
def train_step(params, opt_state, x, y):
    loss, grads = jax.value_and_grad(loss_fn)(params, x, y)
    updates, opt_state = optimizer.update(grads, opt_state, params)
    params = optax.apply_updates(params, updates)
    return params, opt_state, loss                 # new state out
key = random.PRNGKey(0)
params = init_params(key)                          # nested dict pytree
opt_state = optimizer.init(params)
for epoch in range(n_epochs):
    key, subkey = random.split(key)                # new key each epoch
    perm = random.permutation(subkey, len(X_train))
    params, opt_state, loss = train_step(params, opt_state, xb, yb)  # batch_size 128
```

## JAX 变换
type: task-table
span: 2
from: phases/03-deep-learning-core/12-intro-to-jax/docs/en.md

| 任务 | 代码 |
|---|---|
| 对函数求导 | `jax.grad(f)` |
| 二阶导数 | `jax.grad(jax.grad(f))` |
| 批处理单样本函数 | `jax.vmap(predict, in_axes=(None, 0))` |
| 逐样本梯度 | `jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0))` |
| 把 batch 分到多个设备 | `jax.pmap(train_step, axis_name='devices')` |
| 更新每个叶子 | `jax.tree.map(lambda p, g: p - lr * g, params, grads)` |
| 设置单个元素 | `a = a.at[0].set(5)` |
| 先裁剪，再 Adam | `optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))` |

## 安装与运行
type: command-table
from: phases/03-deep-learning-core/12-intro-to-jax/docs/en.md, phases/03-deep-learning-core/12-intro-to-jax/code/jax_intro.py, phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

| 命令 | 作用 |
|---|---|
| `pip install jax jaxlib optax flax` | 安装 JAX、Optax 和 Flax |
| `pip install jax[cuda12]` | 安装支持 GPU 的 JAX |
| `pip install jax[tpu] -f <url>` | 在 Google Cloud 上安装 TPU 版 JAX |
| `XLA_PYTHON_CLIENT_PREALLOCATE=false` | 关闭 75% GPU 显存预分配 |
| `jax.debug.print()` | 在 jit 函数内打印 |
| `fast_fn(x).block_until_ready()` | 停止计时前等待结果 |
| `torch.load("model.pt", weights_only=True)` | 加载保存的 state dict |

## 易错点
type: troubleshooting
from: phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/12-intro-to-jax/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| `Expected all tensors to be on the same device` | 模型和 batch 在不同设备上 | 用 `.to(device)` 把两者移到同一设备 |
| 梯度错误却不报错 | 把 softmax 输出传给 `CrossEntropyLoss` | 传入原始 logits |
| 第一步很慢 | JIT 在首次调用时编译 | 基准测试前先预热 |
| `if x > 0` 在 JIT 内失败 | 控制流依赖被追踪的值 | 使用 `jax.lax.cond` |
| JIT 内的 Python 循环很慢 | 对 JAX 数组做循环 | 使用 `jax.lax.scan` 或 `jax.lax.fori_loop` |
| `a[0] = 5` 失败 | JAX 数组不可变 | 写成 `a = a.at[0].set(5)` |

## 何时选用
type: tips
from: phases/03-deep-learning-core/12-intro-to-jax/docs/en.md, phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md

- 除非有明确理由用 JAX，否则用 PyTorch。
- 需要逐行调试时用 PyTorch。`print()`、`pdb` 和 `breakpoint()` 都能用。
- 快速原型和 HuggingFace 生态用 PyTorch。
- 有 TPU 时用 JAX。
- 需要逐样本梯度时用 JAX。
- 超大规模多设备训练用 JAX。

## 问答
type: qa
from: phases/03-deep-learning-core/10-mini-framework/docs/en.md, phases/03-deep-learning-core/11-intro-to-pytorch/docs/en.md, phases/03-deep-learning-core/12-intro-to-jax/docs/en.md

- **为什么 JAX 需要纯函数？** JIT 编译要求如此。相同输入给出相同输出。
- **为什么 JAX 里没有 `zero_grad`？** `jax.grad` 以返回值的形式给出梯度。张量不保存计算图。
- **为什么保存 `state_dict()` 而不是模型？** 模型对象使用 pickle，重构代码后 pickle 会失效。
- **为什么评估时用 `torch.no_grad()`？** 它关闭 autograd，降低内存占用。
- **迷你框架对应到哪里？** `Sequential`、`Adam`、`zero_grad`、`backward`、`step`、`train`、`eval`。
