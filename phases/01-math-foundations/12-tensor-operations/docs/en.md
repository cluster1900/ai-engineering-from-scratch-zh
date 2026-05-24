# Tensor Operations

> Tensors 是数据与 Deep Learning 之间的通用语言。每一张图像、每一个句子、每一个 Gradient 都通过它们流动。

**Type:** Build
**Language:** Python
**前置要求：** Phase 1，Lessons 01 (Linear Algebra Intuition)，02 (Vectors, Matrices & Operations)
**Time:** ~90 分钟

## 学习目标
- 从零实现一个 Tensor class，支持 shape、strides、reshape、transpose 和 element-wise operations
- 应用 broadcasting 规则，在不复制数据的情况下对不同 shape 的 Tensors 进行运算
- 为 dot products、matrix multiplications、outer products 和 batched operations 编写 einsum 表达式
- 追踪 Multi-Head Attention 每一步的精确 Tensor shapes

## 问题
你构建了一个 transformer。forward pass 看起来很干净。运行后却得到：`RuntimeError: mat1 and mat2 shapes cannot be multiplied (32x768 and 512x768)`。你盯着这些 shapes。你尝试 transpose。现在它提示 `Expected 4D input (got 3D input)`。你加了一个 unsqueeze。又有别的地方坏了。

Shape errors 是 Deep Learning 代码中最常见的 bug。它们在概念上并不难 -- 每个 operation 都有一个 shape contract -- 但会迅速叠加。一个 transformer 会把几十个 reshapes、transposes 和 broadcasts 串联起来。一个 axis 错了，错误就会级联。更糟的是，有些 shape mistakes 根本不会抛出错误。它们会沿着错误的 dimension broadcasting，或在错误的 axis 上求和，静默地产生垃圾结果。

Matrices 处理两组事物之间的成对关系。真实数据无法放进两个 dimensions。一个 batch 的 32 张 224x224 RGB images 是一个 4D tensor：`(32, 3, 224, 224)`。带有 12 个 heads 的 Self-Attention 也是 4D：`(batch, heads, seq_len, head_dim)`。你需要一种能泛化到任意 dimensions 数量的数据结构，并且其 operations 能在所有 dimensions 上干净组合。这个结构就是 Tensor。掌握它的 operations，shape errors 就会变得非常容易 debug。

## 概念
### What a tensor is

Tensor 是一个具有统一 data type 的多维数字数组。dimensions 的数量称为 **rank**（或 **order**）。每个 dimension 是一个 **axis**。**shape** 是一个 tuple，列出每个 axis 上的大小。

```mermaid
graph LR
    S["Scalar<br/>rank 0<br/>shape: ()"] --> V["Vector<br/>rank 1<br/>shape: (3,)"]
    V --> M["Matrix<br/>rank 2<br/>shape: (2,3)"]
    M --> T3["3D Tensor<br/>rank 3<br/>shape: (2,2,2)"]
    T3 --> T4["4D Tensor<br/>rank 4<br/>shape: (B,C,H,W)"]
```

总元素数 = 所有 sizes 的乘积。shape `(2, 3, 4)` 包含 `2 * 3 * 4 = 24` 个元素。

### Deep Learning 中的 Tensor shapes

按照惯例，不同 data types 会映射到特定的 Tensor shapes。

```mermaid
graph TD
    subgraph Vision
        V1["(B, C, H, W)<br/>32, 3, 224, 224"]
    end
    subgraph NLP
        N1["(B, T, D)<br/>16, 128, 768"]
    end
    subgraph Attention
        A1["(B, H, T, D)<br/>16, 12, 128, 64"]
    end
    subgraph Weights
        W1["Linear: (out, in)<br/>Conv2D: (out_c, in_c, kH, kW)<br/>Embedding: (vocab, dim)"]
    end
```

PyTorch 使用 NCHW（channels-first）。TensorFlow 默认使用 NHWC（channels-last）。不匹配的 layouts 会导致静默变慢或报错。

### How memory layout works

内存中的 2D array 是一段 1D bytes 序列。**Strides** 告诉你沿每个 axis 前进一步需要跳过多少个元素。

```mermaid
graph LR
    subgraph "Row-major (C order)"
        R["a b c d e f<br/>strides: (3, 1)"]
    end
    subgraph "Column-major (F order)"
        C["a d b e c f<br/>strides: (1, 2)"]
    end
```

Transpose 不移动数据。它交换 strides，使 Tensor 变为 **non-contiguous** -- 一行中的元素在内存中不再相邻。

### Broadcasting rules

Broadcasting 允许你在不复制数据的情况下，对不同 shapes 的 Tensors 进行运算。从右侧对齐 shapes。两个 dimensions 在相等或其中一个为 1 时兼容。dimensions 更少的一方会在左侧用 1 填充。

```
Tensor A:     (8, 1, 6, 1)
Tensor B:        (7, 1, 5)
Padded B:     (1, 7, 1, 5)
Result:       (8, 7, 6, 5)
```

### Einsum：通用 tensor operation

Einstein summation 用字母标记每个 axis。出现在 input 但不出现在 output 中的 axes 会被求和。两边都出现的 axes 会被保留。

```mermaid
graph LR
    subgraph "matmul: ik,kj -> ij"
        A["A(I,K)"] --> |"sum over k"| C["C(I,J)"]
        B["B(K,J)"] --> |"sum over k"| C
    end
```

关键模式：`i,i->`（dot product）、`i,j->ij`（outer product）、`ii->`（trace）、`ij->ji`（transpose）、`bij,bjk->bik`（batch matmul）、`bhtd,bhsd->bhts`（attention scores）。

## 构建它
代码位于 `code/tensors.py`。每一步都会引用其中的实现。

### 步骤 1：Tensor 存储和 strides

Tensor 存储一个扁平的数字列表以及 shape metadata。Strides 告诉 indexing logic 如何把多维 indices 映射到扁平 positions。

```python
class Tensor:
    def __init__(self, data, shape=None):
        if isinstance(data, (list, tuple)):
            self._data, self._shape = self._flatten_nested(data)
        elif isinstance(data, np.ndarray):
            self._data = data.flatten().tolist()
            self._shape = tuple(data.shape)
        else:
            self._data = [data]
            self._shape = ()

        if shape is not None:
            total = reduce(lambda a, b: a * b, shape, 1)
            if total != len(self._data):
                raise ValueError(
                    f"Cannot reshape {len(self._data)} elements into shape {shape}"
                )
            self._shape = tuple(shape)

        self._strides = self._compute_strides(self._shape)

    @staticmethod
    def _compute_strides(shape):
        if len(shape) == 0:
            return ()
        strides = [1] * len(shape)
        for i in range(len(shape) - 2, -1, -1):
            strides[i] = strides[i + 1] * shape[i + 1]
        return tuple(strides)
```

对于 shape `(3, 4)`，strides 是 `(4, 1)` -- 前进一行跳过 4 个元素，前进一列跳过 1 个元素。

### 步骤 2: Reshape, squeeze, unsqueeze

Reshape 改变 shape，但不改变元素顺序。总元素数必须保持不变。使用 `-1` 让某一个 dimension 自动推断其大小。

```python
t = Tensor(list(range(12)), shape=(2, 6))
r = t.reshape((3, 4))
r = t.reshape((-1, 3))
```

Squeeze 会移除大小为 1 的 axes。Unsqueeze 会插入一个。Unsqueezing 对 broadcasting 至关重要 -- 一个 bias vector `(D,)` 加到 batch `(B, T, D)` 上时，需要 unsqueezing 到 `(1, 1, D)`。

```python
t = Tensor(list(range(6)), shape=(1, 3, 1, 2))
s = t.squeeze()
v = Tensor([1, 2, 3])
u = v.unsqueeze(0)
```

### 第 3 步：Transpose 和 permute

Transpose 交换两个 axes。Permute 重新排序所有 axes。这就是在 NCHW 与 NHWC 之间转换的方式。

```python
mat = Tensor(list(range(6)), shape=(2, 3))
tr = mat.transpose(0, 1)

t4d = Tensor(list(range(24)), shape=(1, 2, 3, 4))
perm = t4d.permute((0, 2, 3, 1))
```

Transpose 或 permute 之后，Tensor 在内存中是 non-contiguous 的。在 PyTorch 中，`view` 会在 non-contiguous tensors 上失败 -- 使用 `reshape`，或先调用 `.contiguous()`。

### 步骤 4： Element-wise operations and reductions

Element-wise ops（add、multiply、subtract）会独立应用到每个元素，并保持 shape 不变。Reductions（sum、mean、max）会折叠一个或多个 axes。

```python
a = Tensor([[1, 2], [3, 4]])
b = Tensor([[10, 20], [30, 40]])
c = a + b
d = a * 2
s = a.sum(axis=0)
```

CNN 中的 global average pooling：`(B, C, H, W).mean(axis=[2, 3])` 产生 `(B, C)`。NLP 中的 sequence mean pooling：`(B, T, D).mean(axis=1)` 产生 `(B, D)`。

### 步骤 5： Broadcasting with NumPy

`tensors.py` 中的 `demo_broadcasting_numpy()` function 展示了核心模式。

```python
activations = np.random.randn(4, 3)
bias = np.array([0.1, 0.2, 0.3])
result = activations + bias

images = np.random.randn(2, 3, 4, 4)
scale = np.array([0.5, 1.0, 1.5]).reshape(1, 3, 1, 1)
result = images * scale

a = np.array([1, 2, 3]).reshape(-1, 1)
b = np.array([10, 20, 30, 40]).reshape(1, -1)
outer = a * b
```

通过 broadcasting 计算 pairwise distance：将 `(M, 2)` reshape 为 `(M, 1, 2)`，将 `(N, 2)` reshape 为 `(1, N, 2)`，相减、平方、沿最后一个 axis 求和、取平方根。结果为：`(M, N)`。

### 步骤 6： Einsum operations

`demo_einsum()` 和 `demo_einsum_gallery()` functions 会逐步展示每一种常见模式。

```python
a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])
dot = np.einsum("i,i->", a, b)

A = np.array([[1, 2], [3, 4], [5, 6]], dtype=float)
B = np.array([[7, 8, 9], [10, 11, 12]], dtype=float)
matmul = np.einsum("ik,kj->ij", A, B)

batch_A = np.random.randn(4, 3, 5)
batch_B = np.random.randn(4, 5, 2)
batch_mm = np.einsum("bij,bjk->bik", batch_A, batch_B)
```

一个 contraction 的计算成本是所有 index sizes（保留的和求和的）的乘积。对于 B=32、I=128、J=64、K=128 的 `bij,bjk->bik`：`32 * 128 * 64 * 128 = 33,554,432` 次 multiply-adds。

### 步骤 7： Attention mechanism via einsum

`demo_attention_einsum()` function 端到端实现了 Multi-Head Attention。

```python
B, H, T, D = 2, 4, 8, 16
E = H * D

X = np.random.randn(B, T, E)
W_q = np.random.randn(E, E) * 0.02

Q = np.einsum("bte,ek->btk", X, W_q)
Q = Q.reshape(B, T, H, D).transpose(0, 2, 1, 3)

scores = np.einsum("bhtd,bhsd->bhts", Q, K) / np.sqrt(D)
weights = softmax(scores, axis=-1)
attn_output = np.einsum("bhts,bhsd->bhtd", weights, V)

concat = attn_output.transpose(0, 2, 1, 3).reshape(B, T, E)
output = np.einsum("bte,ek->btk", concat, W_o)
```

每一步都是一个 Tensor operation：projection（通过 einsum 执行 matmul）、head splitting（reshape + transpose）、attention scores（通过 einsum 执行 batch matmul）、weighted sum（通过 einsum 执行 batch matmul）、head merging（transpose + reshape）、output projection（通过 einsum 执行 matmul）。

## 使用它
### Scratch vs NumPy

| Operation | Scratch (Tensor class) | NumPy |
|---|---|---|
| Create | `Tensor([[1,2],[3,4]])` | `np.array([[1,2],[3,4]])` |
| Reshape | `t.reshape((3,4))` | `a.reshape(3,4)` |
| Transpose | `t.transpose(0,1)` | `a.T` or `a.transpose(0,1)` |
| Squeeze | `t.squeeze(0)` | `np.squeeze(a, 0)` |
| Sum | `t.sum(axis=0)` | `a.sum(axis=0)` |
| Einsum | N/A | `np.einsum("ij,jk->ik", a, b)` |

### Scratch vs PyTorch

```python
import torch

t = torch.tensor([[1, 2, 3], [4, 5, 6]], dtype=torch.float32)
t.shape
t.stride()
t.is_contiguous()

t.reshape(3, 2)
t.unsqueeze(0)
t.transpose(0, 1)
t.transpose(0, 1).contiguous()

torch.einsum("ik,kj->ij", A, B)
```

PyTorch 增加了 autograd、GPU support 和优化的 BLAS kernels。Shape semantics 是相同的。如果你理解了 scratch version，PyTorch shape errors 就会变得可读。

### 每个 Neural Network layer 都是一个 Tensor operation

| Operation | Tensor Form | Einsum |
|---|---|---|
| Linear layer | `Y = X @ W.T + b` | `"bd,od->bo"` + bias |
| Attention QKV | `Q = X @ W_q` | `"btd,dh->bth"` |
| Attention scores | `Q @ K.T / sqrt(d)` | `"bhtd,bhsd->bhts"` |
| Attention output | `softmax(scores) @ V` | `"bhts,bhsd->bhtd"` |
| Batch norm | `(X - mu) / sigma * gamma` | element-wise + broadcast |
| Softmax | `exp(x) / sum(exp(x))` | element-wise + reduction |

## 交付它
本课会产出两个可复用 prompts：

1. **`outputs/prompt-tensor-shapes.md`** -- 一个用于 debug Tensor shape mismatches 的系统化 prompt。包含每种常见 operation（matmul、broadcast、cat、Linear、Conv2d、BatchNorm、softmax）的 decision tables，以及一个 fix lookup table。

2. **`outputs/prompt-tensor-debugger.md`** -- 一个逐步 debug prompt，当 shape error 阻塞你时，可以粘贴到任何 AI assistant 中。把 error message 和你的 Tensor shapes 提供给它，它会返回精确修复方案。

## 练习
1. **Easy -- Reshape round-trip.** 取一个 shape 为 `(2, 3, 4)` 的 Tensor。将它 reshape 为 `(6, 4)`，再 reshape 为 `(24,)`，然后再变回 `(2, 3, 4)`。通过打印 flat data 验证每一步的元素顺序都被保留。

2. **Medium -- Implement broadcasting.** 为 `Tensor` class 扩展一个 `broadcast_to(shape)` method，将大小为 1 的 dimensions 扩展到目标 shape。然后修改 `_elementwise_op`，使其在操作前自动 broadcast。使用 shapes `(3, 1)` 和 `(1, 4)` 进行测试，结果应产生 `(3, 4)`。

3. **Hard -- Build einsum from scratch.** 实现一个基础的 `einsum(subscripts, *tensors)` function，至少支持：dot product（`i,i->`）、matrix multiply（`ij,jk->ik`）、outer product（`i,j->ij`）和 transpose（`ij->ji`）。解析 subscript string，识别 contracted indices，并遍历所有 index combinations。将你的结果与 `np.einsum` 对比。

4. **Hard -- Attention shape tracker.** 编写一个 function，输入 `batch_size`、`seq_len`、`embed_dim` 和 `num_heads`，并打印 Multi-Head Attention 每一步的精确 shape：input、Q/K/V projection、head split、attention scores、softmax weights、weighted sum、head merge、output projection。与 `demo_attention_einsum()` output 进行验证。

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Tensor | “一个 Matrix，但有更多 dimensions” | 一个具有统一 type 以及已定义 shape、strides 和 operations 的多维数组 |
| Rank | “dimensions 的数量” | axes 的数量。一个 Matrix 的 rank 是 2，而不是等于它的 matrix rank |
| Shape | “Tensor 的大小” | 一个 tuple，列出每个 axis 上的大小。`(2, 3)` 表示 2 行、3 列 |
| Stride | “内存如何排列” | 沿每个 axis 前进一个位置需要跳过的元素数量 |
| Broadcasting | “shapes 不同时它也能直接工作” | 一组严格规则：从右对齐，dimensions 必须相等，或其中一个必须是 1 |
| Contiguous | “Tensor 是正常的” | 元素在内存中按逻辑 layout 顺序连续存储，没有间隙或重排 |
| Einsum | “一种花哨的 matmul 写法” | 一种通用记法，可以用一行表达任意 Tensor contraction、outer product、trace 或 transpose |
| View | “和 reshape 一样” | 一个共享相同 memory buffer，但具有不同 shape/stride metadata 的 Tensor。会在 non-contiguous data 上失败 |
| Contraction | “对某个 index 求和” | Tensor 之间共享的 index 被相乘并求和，从而产生更低 rank 结果的一般 operation |
| NCHW / NHWC | “PyTorch vs TensorFlow format” | image tensors 的 memory layout conventions。NCHW 把 channels 放在 spatial dims 之前，NHWC 把它们放在之后 |

## 延伸阅读
- [NumPy Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html) -- 带有可视化示例的规范规则
- [PyTorch Tensor Views](https://pytorch.org/docs/stable/tensor_view.html) -- views 何时可用、何时会复制
- [einops](https://github.com/arogozhnikov/einops) -- 一个让 Tensor reshaping 更可读、更安全的库
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) -- 可视化 Attention 中流动的 Tensor shapes
- [Einstein Summation in NumPy](https://numpy.org/doc/stable/reference/generated/numpy.einsum.html) -- 带有示例的完整 einsum documentation
