---
name: skill-jax-patterns
description: JAX 中的函数式编程模式 -- 何时以及如何使用 grad、jit、vmap 和 pmap
version: 1.0.0
phase: 3
lesson: 12
tags: [jax, functional-programming, autodiff, compilation, vectorization]
---

# JAX 函数式模式

JAX transforms 纯函数。下面每个模式都遵循一条规则：编写一个接收 inputs 并返回 outputs、没有副作用的函数。然后 transform 它。

## 四种 Transforms

### grad -- 对函数求导

```python
grads = jax.grad(loss_fn)(params, x, y)
loss, grads = jax.value_and_grad(loss_fn)(params, x, y)
```

使用场景：你需要用于 optimization 的 Gradients。
约束：函数必须返回 scalar。对于非 scalar outputs，使用 `jax.jacobian`。

### jit -- 编译函数

```python
fast_fn = jax.jit(f)
```

使用场景：函数会被多次调用，且 inputs shape 相同。
约束：不能有依赖 traced values 的 Python control flow。条件分支使用 `jax.lax.cond`，循环使用 `jax.lax.scan`。

### vmap -- Vectorize 函数

```python
batch_fn = jax.vmap(f, in_axes=(None, 0))
```

使用场景：你为单个 example 编写了函数，但需要它作用于 batches。
`in_axes` 指定对哪个 argument axis 做 batch。`None` 表示不做 batch（broadcast）。

### pmap -- 跨 devices 并行化

```python
parallel_fn = jax.pmap(f, axis_name='devices')
```

使用场景：你有多个 GPUs/TPUs，并且想要 data parallelism。
在函数内部，`jax.lax.pmean(x, 'devices')` 会在 devices 间取平均。

## 组合规则

Transforms 可以组合。顺序很重要：

```python
per_example_grads = jax.jit(jax.vmap(jax.grad(loss_fn), in_axes=(None, 0, 0)))
```

从右到左阅读：对 loss_fn 取 Gradient，在 examples 上 vectorize，编译结果。

有效组合：
- `jit(grad(f))` -- 编译后的 Gradient 计算
- `jit(vmap(f))` -- 编译后的 batched 计算
- `vmap(grad(f))` -- per-example Gradients
- `pmap(jit(f))` -- 并行编译计算
- `grad(jit(f))` -- 编译函数的 Gradient（与 jit(grad(f)) 相同）

## 参数管理模式

JAX 参数是 pytrees（arrays 的嵌套 dicts）：

```python
params = {
    'layer1': {'w': jnp.zeros((784, 256)), 'b': jnp.zeros(256)},
    'layer2': {'w': jnp.zeros((256, 10)),  'b': jnp.zeros(10)},
}
```

一次性更新所有参数：
```python
params = jax.tree.map(lambda p, g: p - lr * g, params, grads)
```

计算参数数量：
```python
n_params = sum(p.size for p in jax.tree.leaves(params))
```

## PRNG Key 管理

JAX 需要显式 random keys：

```python
key = jax.random.PRNGKey(0)
key, subkey = jax.random.split(key)
noise = jax.random.normal(subkey, shape)
```

对于多个 random operations，先 split 一次：
```python
keys = jax.random.split(key, n)
```

绝不要重复使用 key。使用前始终先 split。

## 常见错误

1. **在 jit 内部 mutate arrays**：JAX arrays 是 immutable 的。使用 `x.at[i].set(v)`，而不是 `x[i] = v`。

2. **在 jit 内部使用 Python print**：`print` 在 tracing 期间运行，而不是在执行期间运行。使用 `jax.debug.print("{}", x)`。

3. **在 jit 内部对 traced values 使用 Python if/for**：使用 `jax.lax.cond`、`jax.lax.switch`、`jax.lax.scan`、`jax.lax.fori_loop`。

4. **忘记 `.block_until_ready()`**：JAX 使用 async dispatch。做 benchmarking 时，调用 `.block_until_ready()` 等待实际完成。

5. **重复使用 PRNG keys**：使用相同 key 的两个 operations 会产生相同的“random” values。始终 split。

6. **jitted functions 中的 global state**：Global variables 会在 trace time 被捕获。Tracing 之后的变化不可见。把所有内容作为 arguments 传入。

## 决策清单

1. 函数是否会被多次调用？添加 `@jax.jit`。
2. 是否需要 Gradients？用 `jax.grad` 或 `jax.value_and_grad` 包装。
3. 它是否处理单个 example，但你有一个 batch？用 `jax.vmap` 包装。
4. 你是否有多个 devices？用 `jax.pmap` 包装。
5. 是否使用 randomness？显式传递 PRNG keys。
6. 是否对 array values 使用 Python control flow？替换为 `jax.lax` primitives。

## 何时使用 JAX

使用 JAX 的场景：
- 你需要 per-example Gradients（differential privacy、Fisher information）
- 你在 TPUs 上训练（JAX 是 native framework）
- 你需要高阶导数（Hessians、Jacobians）
- 你想把整个 training step 编译成单个 kernel
- 你的团队在 Google DeepMind 或 Anthropic

使用 PyTorch 的场景：
- 你想要最大的生态系统（HuggingFace、torchvision、Lightning）
- 你更重视调试便利性，而不是 raw speed
- 你要使用 TorchServe/Triton 部署到 NVIDIA GPUs
- 你在招聘（PyTorch developers 更多）
- 你想快速迭代新架构
