# 数值稳定性

> 浮点是漏洞的抽象. 它会在训练过程中咬你一口,

**Type:** Build
**Language:**字符串
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## 学习目标

- 使用最大减法技巧 实现数值稳定软max 和日志总和exp
- 识别浮点 计算中的溢出,低流量和灾难性取消
- 使用中心的有限差异将分析梯度与数量梯度进行校验
- 解释为什么训练时bfloat16 优于float16以及损失扩展 如何防止渐进低流

## 问题

你的模型训练了三个小时,然后输了变成了NN. 你加了一个印记语句.`inf`到了第九百零二步,每个级别都是`nan`训练已经死了.

或者:你的模型训练完成了,但准确度比论文声称的低2%──你检查了一切──架构一致──超参数 一致──数据一致──问题在于论文使用 float32,而你在没有正确的扩展的情况下使用 float16──三十二位的累积圆圈错误吞掉了你的准确度──

或:你从零实现跨缩损失. 它在小逻辑上能正常工作. 当逻辑超过100时,它回归.`inf`,因为,因为.`exp(100)`每个ML框架都用一个两行技巧来处理这个问题.

数值稳定性不是理论问题. 它决定了训练运行是成功的,还是无声无息地失败的.

## 概念

### 电脑如何存储实数

计算机根据IEEE 754标准将实数存储为浮点值――一个浮点 有三部分:标志位、元和 mantissa(含义和) ――

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

定精度 (有多少有效数字) ‧ 函数决定范围 (一个数可以有多大或多小) ‧

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

浮动32 给你大约7位进制精度――这意味着它可以区分1.0000001和1.0000002,但不能区分1.00000001和1.00000002――超过7位之后,一切都是圆噪声――

对于ML来说,这个范围很令人不安,因为逻辑,梯度和激活率经常超过这个值.

bfloat16 是谷歌对 float16 范围问题的答案. 它具有与 float32 相等的8位指数.

### 为什么0.1加 0.2=0.3?

数字 0.1 无法在二进制浮点中精确表示──在基 2 中,它是一个循环小数:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

存储值为0.100000001490116──同样,0.2 存储值为0.200000002980232──它们的和是0.300000004470348,而不是0.3──

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

这对 ML 很重要,因为:

1. 像`if loss < threshold`这样的损失比较可能给出错误的答案
2. 累积许多小值 (数千步的渐进更新) 将偏离真相和
3. 如果用`==`测试和复制性测试会失败

修复方法:永远不要使用`==`比较浮动的.`abs(a - b) < epsilon`或`math.isclose()`,我知道.

### 灾难性的取消

当你减轻两个几乎相等的浮点数时,有效数字会抵消对方,剩下的是升级到高位的圆圈噪声.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

这意味着,在减法中,产生了19%的相对错误.

- 使用大平均值数据计算方差:当 E[x] 很大时计算 `E[x^2] - E[x]^2`
- 相减两种几乎相等的日志概率
- 使用过小epsilon 计算有限差异梯度

修复方法:重排公式,避免相减两个很大且几乎相等的数量.

### 过流和下流

过度流量 发生在结果过大,无法表示的时候――过小时时发生过度流量 比最小可表示正数还接近零时――

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`函数是ML中溢出的主要来源:

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

`log()`函数会碰到另一个方向的问题:

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

在ML中,`exp()`现在软max,sigmoid和概率计算中.`log()`现在出现了跨, 逻辑概率和KL差异中.`log(exp(x))`组合就是雷区.

### 记录和计量技巧

直接计算`log(sum(exp(x_i)))`在数值上很危险.`x_i`很大,`exp(x_i)`如果所有人都会过.`x_i`非常负,每个人都`exp(x_i)`城市下流到零,而`log(0)`是 `-inf`,我知道.

这个技巧:在求指数之前先减去最大值.

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

为什么它有效:减去`max(x)`后,最大的指数是`exp(0) = 1`△不可能发生过度. 求和中至少有一个是 1,所以总和至少是 1,而`log(1) = 0`,不可能下流到`-inf`,我知道.

证明:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

让`c = max(x)`过度流量就被消除了.

这招在ML中可以看到的:
- 软max正常化
- 计算 交叉缩损失
- 序列模型 中的日志概率 求和
- 甘混合物
- 变化推断

### 为什么软max需要最大减法技巧

软max 将 logits 转换为概率:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

没有这个技巧, 引发过剩:

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

减去最大的数量,

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

概率完全相同.计算是安全的.

### 检测与预防

`nan`没有数字`inf`由于它是微生物的,它可以被视为微生物的.`nan`让体重变得重`nan`让每一个输出都变成了`nan`训练会在一步之内死掉.

`inf`如何出现:
- 执行一个很大的正数`exp()`
- 除以零:`1.0 / 0.0`
- 积累中的`float32`过度流动

`nan`如何出现:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- 对负数执行`sqrt()`
- 对负数执行`log()`
- 任何涉及的`nan`的算法

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

预防策略:

1. 头`exp()`的输入:`exp(clamp(x, -80, 80))`
2. 给命名器加epsilon:`x / (y + 1e-8)`
3. 在`log()`加入:`log(x + 1e-8)`
4. 使用稳定实现 (值-值-值)
5. 使用 梯度剪切 防止重量 爆炸
6. 调试时在每次前进通过后检查`nan`现在,我们要去.`inf`

### 数字渐进检查

分析梯度 (来自后传) 可能有错误――通过有限差异计算梯度来验证它们――

中心差异公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

这是O  精度,远好于前进差距`(f(x+h) - f(x)) / h`后者只有O (H) 

选择 h:太大则近似不准确――太小则灾难性取消会毁掉结果――`h = 1e-5`到了`1e-7`很常见.

检查方式:计算分析和数值梯度之间的相对差异.

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- 错误的相对性 < 1e-7:完美,渐进 正确
-  relative_error < 1e-5:可接受,很可能正确
-  relative_error > 1e-3:有什么错误了
- 相对_错误 > 1: 级 完全错误

每当实现新的层或损失函数时,必须检查梯度.`torch.autograd.gradcheck()`,我知道.

### 混合精准训练

现代GPU 有专用硬件(光芯),可以比 float32 快 2-8 倍地计算 float16矩阵乘法──混合精度训练利用这一点:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

纯浮16 训练问题:渐变 往往非常小(1e-8 或更小) ・浮16 会将任何值的下流降低于约6e-8 为零. 你的模型会停止学习,因为所有渐变更新都是零.

修复方法是损失规模化:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

动态损失扩展 会自动调整规模因子――从一个大值 ((65536) 开始――如果梯度过量 成 `inf`如果没有过度,就加倍.

### 16vs16:为什么16在训练中胜出

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

精度更高 (但范围有限) 最大约65,504) △bfloat16 精度较低,但范围与 float32 相同 (但范围最大约3.4e38) △

对于训练神经网络:

- 在训练期间,激活和登录频繁超过65,504──float16 会溢出;bfloat16可处理──
- 波浪16 需要损失的扩展,但波浪16 通常不需要,因为它的范围覆盖了渐进大小谱.
- bfloat16 是 float32 的简单截分:丢掉 mantissa 的低16位──转换很简单,并且指数无损──

现在的数值有界且精度更重要. bfloat16 更适合训练,现在的范围更重要.

### 渐进式剪切

爆炸梯度发生在梯度中 穿过许多层时指数级增长(常见于RNN、深度网络和变压器) ⋅一个很大的梯度就能在一步内破坏所有重量──

两种剪辑:

**Clip by value：**独立每个渐变元素.

```
grad = clamp(grad, -max_val, max_val)
```

简单,但可能改变渐变向量的方向.

**Clip by norm：**缩放整个渐变向量,使其规范不超过值.

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

保持渐进的方向.`torch.nn.utils.clip_grad_norm_()`现在,我们必须做什么.

典型值:变压器 使用 `max_norm=1.0`RL 使用 `max_norm=0.5`简单的网络使用`max_norm=5.0`,我知道.

没有它,一个异常的批量可能产生足够大的梯度,破坏了几周的训练.

### 规范化层 作为数值稳定器

批量正常化,层正常化和RMS正常化通常被介绍为帮助训练收收收的调节器.

没有正常化,激活会在层间指数级增长或缩小:

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

正常化会在每层重新存在并重新缩放激活:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`它们在所有激活中同时防止除以零.`gamma`和 `beta`让网络能够恢复任何需要的规模.

这将使整个网络中值保持在数值安全范围内,既防止前进通道中过,也防止后退通道中渐进式爆炸.

### 常见 ML 数值 错误

**Bug：Loss 在几个 epochs 后变成 NaN。**
原因: 流量变得太大,软max溢出了. 或者学习率太高,体重发散了.
修复:使用稳定的软max(最大减法),降低学习速度,加入渐进剪辑──

**Bug：Loss 卡在 log(num_classes)。**
原因:模型输出接近均概率――通常意味着梯度正在消失,或者模型完全没有学习――
修复:检查数据标签 是否正确,校验损失函数,检查死RELU──

**Bug：Validation accuracy 比预期低 1-3%。**
原因:混合精度 没有适当的损失规模化――渐进的下流 会把小更新 置零――
修复:启用动态损失扩展,或切换到bfloat16。

**Bug：某些 layers 的 Gradient norms 是 0.0。**
原因:死于RLU神经元,或者浮16下流.
修复:使用LeakyReLU或GELU,使用渐进式缩放,检查重量初始化──

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因:非确定性浮点积累顺序――GPU平行减少在不同硬件上会以不同的顺序求和,而浮点加算不满足结合律――
修复:接受小差异 ((1e-6),或设置`torch.use_deterministic_algorithms(True)`没有接受速度损失.

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
原因:原材料被直接传递给`exp()`没有使用最大减法技巧.
修复:使用`torch.nn.functional.log_softmax()`它们内部实现了日志和总数的解释.

**Bug：从 float32 切换到 float16 后训练发散。**
原因:float16 无法表示低于 6e-8 的渐进大小,也无法表示高于 65,504 的激活.
修复:使用带损失尺度的混合精度 (AMP),或改用 bfloat16。


```figure
logsumexp-stability
```

## 构建它

### 步骤1:演示浮点精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### 步骤2:实现天真与稳定的软max

```python
import math

def softmax_naive(logits):
    exps = [math.exp(z) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def softmax_stable(logits):
    max_logit = max(logits)
    exps = [math.exp(z - max_logit) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

safe_logits = [2.0, 1.0, 0.1]
print(f"Naive:  {softmax_naive(safe_logits)}")
print(f"Stable: {softmax_stable(safe_logits)}")

dangerous_logits = [100.0, 101.0, 102.0]
print(f"Stable: {softmax_stable(dangerous_logits)}")
# softmax_naive(dangerous_logits) would return [nan, nan, nan]
```

### 步骤3:实现稳定的日志和总体

```python
def logsumexp_naive(values):
    return math.log(sum(math.exp(v) for v in values))

def logsumexp_stable(values):
    c = max(values)
    return c + math.log(sum(math.exp(v - c) for v in values))

safe = [1.0, 2.0, 3.0]
print(f"Naive:  {logsumexp_naive(safe):.6f}")
print(f"Stable: {logsumexp_stable(safe):.6f}")

large = [500.0, 501.0, 502.0]
print(f"Stable: {logsumexp_stable(large):.6f}")
# logsumexp_naive(large) returns inf
```

### 步骤4:实现稳定的交叉化

```python
def cross_entropy_naive(true_class, logits):
    probs = softmax_naive(logits)
    return -math.log(probs[true_class])

def cross_entropy_stable(true_class, logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = math.log(sum(math.exp(s) for s in shifted))
    log_prob = shifted[true_class] - log_sum_exp
    return -log_prob

logits = [2.0, 5.0, 1.0]
true_class = 1
print(f"Naive:  {cross_entropy_naive(true_class, logits):.6f}")
print(f"Stable: {cross_entropy_stable(true_class, logits):.6f}")
```

### 步骤5:渐进检查

```python
def numerical_gradient(f, x, h=1e-5):
    grad = []
    for i in range(len(x)):
        x_plus = x[:]
        x_minus = x[:]
        x_plus[i] += h
        x_minus[i] -= h
        grad.append((f(x_plus) - f(x_minus)) / (2 * h))
    return grad

def check_gradient(analytical, numerical, tolerance=1e-5):
    for i, (a, n) in enumerate(zip(analytical, numerical)):
        denom = max(abs(a), abs(n), 1e-8)
        rel_error = abs(a - n) / denom
        status = "OK" if rel_error < tolerance else "FAIL"
        print(f"  param {i}: analytical={a:.8f} numerical={n:.8f} "
              f"rel_error={rel_error:.2e} [{status}]")

def f(params):
    x, y = params
    return x**2 + 3*x*y + y**3

def f_grad(params):
    x, y = params
    return [2*x + 3*y, 3*x + 3*y**2]

point = [2.0, 1.0]
analytical = f_grad(point)
numerical = numerical_gradient(f, point)
check_gradient(analytical, numerical)
```

## 使用它

### 混合精度模拟

```python
import struct

def float32_to_float16_round(x):
    packed = struct.pack('f', x)
    f32 = struct.unpack('f', packed)[0]
    packed16 = struct.pack('e', f32)
    return struct.unpack('e', packed16)[0]

def simulate_bfloat16(x):
    packed = struct.pack('f', x)
    as_int = int.from_bytes(packed, 'little')
    truncated = as_int & 0xFFFF0000
    repacked = truncated.to_bytes(4, 'little')
    return struct.unpack('f', repacked)[0]
```

### 渐进式剪切

```python
def clip_by_norm(gradients, max_norm):
    total_norm = math.sqrt(sum(g**2 for g in gradients))
    if total_norm > max_norm:
        scale = max_norm / total_norm
        return [g * scale for g in gradients]
    return gradients

grads = [10.0, 20.0, 30.0]
clipped = clip_by_norm(grads, max_norm=5.0)
print(f"Original norm: {math.sqrt(sum(g**2 for g in grads)):.2f}")
print(f"Clipped norm:  {math.sqrt(sum(g**2 for g in clipped)):.2f}")
print(f"Direction preserved: {[c/clipped[0] for c in clipped]} == {[g/grads[0] for g in grads]}")
```

### 检测NAN/inf

```python
def check_tensor(name, values):
    has_nan = any(math.isnan(v) for v in values)
    has_inf = any(math.isinf(v) for v in values)
    if has_nan or has_inf:
        print(f"WARNING {name}: nan={has_nan} inf={has_inf}")
        return False
    return True

check_tensor("good", [1.0, 2.0, 3.0])
check_tensor("bad",  [1.0, float('nan'), 3.0])
check_tensor("ugly", [1.0, float('inf'), 3.0])
```

完整实现见`code/numerical.py`它们都显示了所有边缘案例.

## 交付它

本课会产出:
- `code/numerical.py`包含稳定的软max,log-sum-exp,跨进化,渐进检查和混合精度模拟
- `outputs/prompt-numerical-debugger.md`用于诊断训练中的NAN/Inf和数值问题

这些稳定实现将在3期建设培训循环时,以及4期实现注意力机制时再次出现.

## 练习

1. **Catastrophic cancellation。**使用float32 中的天真公式`E[x^2] - E[x]^2`计算 [1000000.0, 1000001.0, 1000002.0] 的差距――然后使用威尔福德的在线算法计算――将差距与真实差距――0.6667) 比较――

2. **Precision hunt。**在Python中找到最小正值 float32 值`x`让它`1.0 + x == 1.0`这就是机器的电子书.`numpy.finfo(numpy.float32).eps`,我知道.

3. **Log-sum-exp edge cases。**用以下输入测试你的`logsumexp_stable`函数:((a) 所有值相等,(b) 一个值远大于其他值,(c) 所有值都非常负面(-1000) △验证它在天真版本 失败的地方给出正确的结果──

4. **Gradient checking a Neural Network layer。**实现单线性层`y = Wx + b`及其分析反向通过──使用`numerical_gradient`校验3×2重矩阵的正确性.

5. **Loss scaling experiment。**模拟浮动16 训练:创建范围在 [1e-9, 1e-3] 内的随机梯度,转换为浮动16,并测量有多少比例变成零――然后应用损失规模(乘以 1024),转换为浮动16,再缩小回,并再次测量零比例――

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|----------------------|
| IEEE 754 | “float 标准” | 定义 binary floating point formats、rounding rules 和 special values（inf、nan）的国际标准。每个现代 CPU 和 GPU 都实现了它。 |
| Machine epsilon | “精度极限” | 在给定 float format 中，使 1.0 + e != 1.0 成立的最小值 e。对于 float32，它约为 1.19e-7。 |
| Catastrophic cancellation | “减法导致的精度损失” | 相减两个几乎相等的 floating point 数时，有效数字相互抵消，rounding noise 主导结果。 |
| Overflow | “数字太大” | 结果超过最大可表示值并变成 inf。exp(89) 会使 float32 overflow。 |
| Underflow | “数字太小” | 结果比最小可表示正数还接近零，并变成 0.0。exp(-104) 会使 float32 underflow。 |
| Log-sum-exp trick | “先减去最大值” | 通过提出 exp(max(x)) 来计算 log(sum(exp(x)))，以防止 overflow 和 underflow。用于 softmax、cross-entropy 和 log-probability math。 |
| Stable softmax | “不会爆炸的 softmax” | 在 exponentiating 之前减去 max(logits)。结果在数值上相同，且不可能 overflow。 |
| Gradient checking | “校验你的 Backpropagation” | 将 Backpropagation 得到的 analytical gradients 与 finite differences 得到的 numerical gradients 比较，以捕获实现 bug。 |
| Mixed precision | “Float16 forward，float32 backward” | 对 speed-critical operations 使用低精度 floats，对 numerically sensitive operations 使用高精度 floats。典型提速为 2-3x。 |
| Loss scaling | “防止 Gradient underflow” | 在 Backpropagation 前将 Loss 乘以一个大常数，使 gradients 保持在 float16 可表示范围内，然后在 weight updates 前除以同一个常数。 |
| bfloat16 | “Brain floating point” | Google 的 16-bit format，包含 8 个 exponent bits（与 float32 范围相同）和 7 个 mantissa bits（精度低于 float16）。训练时更常用。 |
| Gradient clipping | “限制 Gradient norm” | 缩放 Gradient Vector，使其 norm 不超过阈值。防止 exploding gradients 毁掉 weights。 |
| NaN | “Not a Number” | 来自未定义操作（0/0、inf-inf、sqrt(-1)）的特殊 float value。会传播到所有后续 arithmetic。 |
| Inf | “Infinity” | 来自 overflow 或除以零的特殊 float value。可以组合产生 NaN（inf - inf、inf * 0）。 |
| Numerical gradient | “暴力求导” | 通过计算 f(x+h) 和 f(x-h)，再除以 2h 来近似 derivative。很慢，但用于校验时可靠。 |

## 延伸阅读

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)权威参考资料,内容密集但完整
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA 提出 float16 训练中损失扩展的论文
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch 中混合精度的实践指南
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)谷歌为什么要选择这种格式
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)-- 减少浮点总和 中圆形错误的算法
