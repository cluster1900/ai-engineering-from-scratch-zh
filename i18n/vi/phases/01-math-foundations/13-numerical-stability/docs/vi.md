# Số giá trị ổn định

> Điểm nổi là một sự trừu tượng bị rò rỉ. Nó sẽ cắn bạn trong quá trình tập luyện, và bạn sẽ không nhận ra trước.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 分钟

## Học mục tiêu

- Sử dụng thủ thuật trừ tối đa  để đạt được giá trị số ổn định Softmax và log-sum-exp
- 识别 điểm nổi 计算中的溢出、不足和灾难性取消
- Sử dụng sự khác biệt hữu hạn tập trung sẽ phân tích gradient với gradient số  tiến hành thử nghiệm
- 解释 tại sao tập luyện bfloat16 优于 float16, cũng như giảm lỗ quy mô  làm thế nào để ngăn chặn dòng chảy thấp

## 问题

Mô hình của bạn được luyện tập trong 3 giờ, sau đó Loss biến thành NaN. Bạn đã thêm một bài báo 语句.`inf`Đến 9,002 bước, mỗi thành phố đều là`nan`, tập luyện đã chết.

Hoặc: Tập luyện mô hình của bạn đã hoàn thành, nhưng độ chính xác so với tuyên bố của bài luận thấp hơn 2%── bạn đã kiểm tra mọi thứ── cấu trúc phù hợp── siêu tham số 一致── dữ liệu phù hợp── vấn đề nằm trong bài luận sử dụng float32, trong khi bạn sử dụng float16── trong trường hợp không có quy mô chính xác 三十二位 tích lũy vòng tròn 吞掉 sự chính xác của bạn──

Hoặc: bạn từ không thực hiện mất đi nhiệt độ chéo. Nó ở các log nhỏ 上能正常工作.`inf`✿softmax tràn ✿, vì ✿`exp(100)`Toàn bộ hệ thống ML đều sử dụng một trò chơi hai dòng để xử lý vấn đề này.

Định vị số không phải là vấn đề lý thuyết. Nó quyết định một cuộc tập luyện chạy là thành công, hay là thất bại.

## 概念

### IEEE 754: máy tính làm thế nào để lưu trữ số thực

计算机 theo IEEE 754 标准将实数存储为浮点值──一个浮点 有三部分:sign bit、元和 mantissa(significand)──

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

mantissa quyết định độ chính xác (có số hiệu quả)

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32  cho bạn khoảng 7 điểm trong quá trình xác định. Điều này có nghĩa là nó có thể phân biệt 1.0000001 và 1.0000002, nhưng không thể phân biệt 1.00000001 và 1.00000002.

float16  đưa cho bạn khoảng 3 điểm chính xác. Số lượng lớn nhất nó có thể biểu thị là 65,504. Đối với ML, phạm vi này nhỏ đáng lo ngại, bởi vì các logic, gradient và kích hoạt thường vượt quá giá trị này.

bfloat16 là câu trả lời của Google cho câu hỏi về dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải dải d dải dải d d dải d dải d d d d d dải d dải d d d d dải d d d d d d d dải d d d d d d d d d d d d d d dải d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d d

### Tại sao 0.1 + 0.2 ! = 0.3

Số 0.1 không thể trong điểm nổi nhị phân 中精确表示── ở cơ sở 2, nó là một vòng nhỏ:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

Float32 sẽ cắt nó thành 23 bit của mantissa. Giá trị lưu trữ là khoảng 0.100000001490116.

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

Điều này rất quan trọng đối với ML, bởi:

1. 像 `if loss < threshold`Như vậy Loss so sánh có thể đưa ra một câu trả lời sai
2. 累积许多小值(数千步的渐进更新) sẽ chuyển hướng từ thực tế và
3. Nếu dùng `==`So sánh các thử nghiệm lơ lửng, kiểm tra và khả năng tái tạo sẽ thất bại

修复方法: Không bao giờ sử dụng `==`So sánh với các loại nước nổi.`abs(a - b) < epsilon`Hoặc`math.isclose()`

### Sự hủy bỏ thảm khốc

Khi bạn giảm hai điểm nổi gần như nhau trong vài giờ, số hiệu quả sẽ chống lại nhau, còn lại là được nâng lên tiếng ồn tròn cao.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

Điều này có nghĩa là một lần giảm tính tạo ra lỗi tương đối 19%. Trong ML, tình huống này xuất hiện:

- Sử dụng DATA Gần Cỡ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `E[x^2] - E[x]^2`
- tương đối với hai khả năng log gần như tương tự
- Sử dụng过小 epsilon  tính toán gradient khác biệt hữu hạn

修复方法:重排公式, tránh pha giảm hai số rất lớn và gần giống nhau. Đối với pha khác nhau, sử dụng thuật toán Welford, hoặc trước tiên đối với dữ liệu. Đối với log-chỉ có thể, luôn luôn trong log-space.

### Overflow và Underflow

Overflow 发生在结果过大,无法表示时――Underflow 发生在结果过小时――比最小可表示正数还接近零)

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

`exp()`函数 là nguồn chính của quá tải trong ML:

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

Trong ML,`exp()`Hiện tại, tính toán mềmmax,sigmoid và tỷ lệ dự đoán`log()`Hiện nay có sự tương tự giữa các log và sự khác biệt giữa KL. Không có thủ thuật chính xác nào.`log(exp(x))`组合就是雷区──

### Trù Log-Sum-Exp

trực tiếp tính toán`log(sum(exp(x_i)))`Trong số giá trị rất nguy hiểm... Nếu bất cứ điều gì.`x_i`n rất lớn,`exp(x_i)`Sẽ tràn qua... Nếu tất cả.`x_i`Tốt lắm, mọi người.`exp(x_i)`Thành phố sẽ chảy xuống 0`log(0)` `-inf`

Trik này: trong tìm kiếm nhân tố trước tiên giảm giá trị tối đa.

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

Tại sao nó hiệu quả: giảm đi`max(x)`后,最大的指数 là `exp(0) = 1`△ không thể xảy ra quá tải. △ trong số các yêu cầu và yêu cầu ít nhất có một mục là 1, vì vậy tổng cộng ít nhất là 1, và`log(1) = 0`Không thể chảy xuống.`-inf`

 chứng minh:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

Làm cho`c = max(x)`, quá tải sẽ bị loại bỏ.

Trù này ở khắp mọi nơi trong ML:
- Tự bình thường hóa Softmax
- Khối thâm nhập chéo 计算
- Các mô hình chuỗi 中的 log-probability 求和
- Trộn hợp Gaussians
- Kết luận biến thể

### Tại sao Softmax cần Trick Max-Subtraction

Softmax sẽ logits 转换为概率:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

Không có thủ thuật này, những con số này sẽ dẫn đến sự tràn ngập:

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

Sử dụng thủ thuật này, giảm trừ tối đa x = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

概率 hoàn toàn giống nhau. 计算是安全的.

### NaN 和 Inf: kiểm tra và phòng ngừa

`nan`(Không có một con số)`inf`(Infinity) sẽ giống như virus như trong tính toán truyền tải.`nan`Để trọng lượng biến thành`nan`, để làm cho mỗi lần ra hàng trở thành`nan` tập luyện sẽ chết trong một bước.

`inf`如何出现:
- Để một số lượng chính xác lớn thực hiện`exp()`
- Ngoài từ:`1.0 / 0.0`
- Nồng độ trung `float32`tràn

`nan`如何出现:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- đối với số lượng`sqrt()`
- đối với số lượng`log()`
- Bất cứ điều gì liên quan đến đã có`nan`của toán học

检测:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

策略 phòng ngừa:

1. Clamp `exp()`                                                                                                                                                                                                                                                              `exp(clamp(x, -80, 80))`
2. 给 mệnh danh 加 epsilon:`x / (y + 1e-8)`
3. Trong `log()`Nên thêm bài viết:`log(x + 1e-8)`
4. Sử dụng ổn định thực hiện (log-sum-exp, softmax ổn định)
5. 使用 Gradient cắt  ngăn chặn trọng lượng  nổ
6. 调试时在每次前进通过后检查 `nan`- Không.`inf`

### Kiểm tra số lượng

Các gradient phân tích (được phát triển từ Backpropagation) có thể có lỗi.

Sự khác biệt trung tâm 公式:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

Đó là độ chính xác, tốt hơn so với sự khác biệt về phía trước.`(f(x+h) - f(x)) / h`,后者只有O (h) ⋅

选择 h:太大则近似不准确──太小则 thảm họa hủy bỏ 会毁结果──`h = 1e-5`Đến`1e-7`很常见──

检查方式: tính toán sự khác biệt tương đối giữa phân tích và gradient số 

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

经验规则:
- relative_error < 1e-7:完美,Gradient 正确
- relative_error < 1e-5: có thể chấp nhận, rất có thể đúng
- relative_error > 1e-3: Có gì đó sai
- relative_error > 1:Gradient 完全错误

Mỗi khi thực hiện một lớp mới hoặc Loss Function, chúng ta phải kiểm tra gradients.`torch.autograd.gradcheck()`

### Việc đào tạo chính xác hỗn hợp

现代 GPU có phần cứng chuyên dụng (Tensor Cores), có thể so sánh với float32 快 2-8 倍地计算 float16 Matrix multiplications。 Tập luyện chính xác hỗn hợp đã sử dụng điều này:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

纯浮16 训练问题:gradients 往往非常小(1e-8 或更小) ――Float16 会将低于约6e-8的任何值下流为零――你的模型会停止学习,因为所有 Gradient updates 都是零――

修复方法是 mất quy mô:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

Phân tích mất mát động 会自动调整规模因子──从一个大值(65536) bắt đầu──如果梯度过溢 成 `inf`,就减半. Nếu N 步 không tràn,就加倍.

### Bfloat16 vs Bfloat16: Tại sao Bfloat16 trong tập luyện

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

float16 精度更高(10 mantissa bits vs 7), nhưng phạm vi hạn hạn chế(最大约65,504);;bfloat16 精度较低,但范围与 float32 相同(最大约3.4e38);;

对于训练 Neural Network:

- Các hoạt động và logits trong thời gian tập luyện thường xuyên vượt quá 65,504──float16 会 tràn;bfloat16 có thể xử lý──
- float16  cần giảm quy mô, nhưng bfloat16 thường không cần thiết, vì phạm vi của nó bao gồm quang phổ độ Gradient.
- bfloat16 là đoạn đơn giản của float32: mất mất mantissa của thấp 16 位;; chuyển đổi rất đơn giản, và biểu tượng 无损;;

float16 更适合推断,此时数值有界且精度更重要──bfloat16 更适合训练,此时范围更重要──这就是TPUs 和现代NVIDIA GPUs(A100、H100) nguyên nhân hỗ trợ bfloat16的原因──

### Tắt dần

Các gradient nổ xảy ra trong gradient  xuyên qua nhiều tầng  tăng trưởng chỉ số 

两种剪辑:

**Clip by value：**独立 clamp Mỗi yếu tố Gradient

```
grad = clamp(grad, -max_val, max_val)
```

 đơn giản, nhưng có thể thay đổi hướng của Dầu Dầu.

**Clip by norm：**缩放 toàn bộ Dầu tử, làm cho chuẩn của nó không vượt quá giá trị.

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

Bảo trì hướng của Gradient.`torch.nn.utils.clip_grad_norm_()`Những gì phải làm. Đó là một lựa chọn tiêu chuẩn.

典型值:transformers 使用 `max_norm=1.0`,RL sử dụng `max_norm=0.5`, đơn giản hơn mạng sử dụng `max_norm=5.0`

Trẻ cắt gradient không phải hack. Nó là một cơ chế an ninh. Không có nó, một loạt bất thường có thể tạo ra một gradient đủ lớn, phá hủy một vài tuần tập.

### Lớp bình thường hóa  như số giá trị ổn định

Batch normalization, layer normalization và RMS normalization thường được giới thiệu để giúp huấn luyện các nhà điều chỉnh.

Không có bình thường hóa, hoạt động sẽ ở mức độ tăng hoặc giảm:

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

Tiêu chuẩn hóa sẽ được kích hoạt trong mỗi tầng tái sinh và tái thu nhỏ:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon`(thường là 1e-5) sẽ trong tất cả các hoạt động đều cùng lúc ngăn chặn phân loại từ 0.`gamma`和 `beta`Hãy để mạng lưới có thể phục hồi được bất kỳ quy mô nào mà nó cần.

Điều này sẽ giúp toàn bộ giá trị trung bình mạng được giữ trong phạm vi an toàn của giá trị số, ngăn chặn quá trình vượt qua phía trước, cũng như ngăn chặn vụ nổ gradient ở phía sau.

### 常见 ML số giá trị Bug

**Bug：Loss 在几个 epochs 后变成 NaN。**
原因:logits 变得太大,softmax tràn 了──或学习率 太高,重量发散了──
修复: sử dụng ổn định softmax(max trừ), giảm tốc độ học tập,加入 Gradient clipping。

**Bug：Loss 卡在 log(num_classes)。**
原因: mô hình xuất hiện gần xác suất đồng nhất.
修复: kiểm tra nhãn dữ liệu 是否正确,校验 Loss Function, kiểm tra các ReLU chết

**Bug：Validation accuracy 比预期低 1-3%。**
原因: độ chính xác hỗn hợp  không có quy mô mất tích thích hợp.
修复: bật quy mô mất mát động, hoặc chuyển đổi sang bfloat16。

**Bug：某些 layers 的 Gradient norms 是 0.0。**
原因: chết Neuron ReLU ((所有输入为负), hoặc float16 dưới dòng chảy。
修复: sử dụng LeakyReLU hoặc GELU, sử dụng quy mô gradient, kiểm tra trọng lượng khởi tạo

**Bug：模型在一张 GPU 上正常，但在另一张 GPU 上给出不同结果。**
原因: không xác định quy trình tích lũy điểm nổi không xác định. GPU giảm song song trên các thiết bị khác nhau sẽ được yêu cầu theo thứ tự khác nhau, trong khi việc bổ sung điểm nổi không đáp ứng được quy luật kết hợp.
修复: 接受小差异(1e-6), hoặc đặt `torch.use_deterministic_algorithms(True)`Và chấp nhận mất tốc độ.

**Bug：`exp()` 在 Loss 计算中返回 `inf`。**
原因: log raw được truyền trực tiếp`exp()`, không sử dụng thủ thuật trừ tối đa.
修复: sử dụng `torch.nn.functional.log_softmax()`, nó thực hiện log-sum-exp trong bên trong.

**Bug：从 float32 切换到 float16 后训练发散。**
原因:float16 无法表示低于 6e-8 的 Gradient magnitudes,也无法表示高于 65,504 的激活.
修复: sử dụng độ chính xác hỗn hợp của việc quy mô mất mát (AMP), hoặc改用 bfloat16。


```figure
logsumexp-stability
```

##  xây dựng nó

### 步骤 1: trình bày điểm nổi 精度限制

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### 步骤 2: đạt được ngây thơ vs ổn định softmax

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

### 步骤 3: thực hiện log-sum-exp ổn định

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

### Bước 4: đạt được sự hòa trôi ổn định

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

### 步骤 5:Việc kiểm tra độ

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

## Sử dụng nó

### Độ chính xác hỗn hợp 模拟

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

### Trình cắt gradient

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

### Khám phá NaN/Inf

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

完整实现见 `code/numerical.py`, trong đó đã trình bày tất cả các trường hợp cạnh.

## 交付 nó

本课会产出:
- `code/numerical.py`, chứa softmax ổn định, log-sum-exp, cross-entropy, kiểm tra gradient và mô phỏng chính xác hỗn hợp
- `outputs/prompt-numerical-debugger.md`, để sử dụng trong đào tạo chẩn đoán vấn đề NaN/Inf và số lượng

Những sự cố này sẽ được thực hiện trong giai đoạn 3  xây dựng vòng đào tạo, cũng như giai đoạn 4  thực hiện các cơ chế chú ý  xuất hiện một lần nữa.

## 练习

1. **Catastrophic cancellation。**Sử dụng công thức ngây thơ `E[x^2] - E[x]^2`計算 [1000000.0, 1000001.0, 1000002.0] 的方差──然后使用Welford's online algorithm 计算──将误差与真实方差──0.6667) 比较──

2. **Precision hunt。**Trong Python tìm ra giá trị float32 chính tối thiểu `x`, làm cho nó`1.0 + x == 1.0`Đó là máy epsilon.`numpy.finfo(numpy.float32).eps`

3. **Log-sum-exp edge cases。**用以下输入测试 của bạn `logsumexp_stable`函数:((a) 所有值相等,(b) 一个值远大于其他值,(c) 所有值都非常负负(-1000) ――验证它在天真版本 失败的地方给出正确结果──

4. **Gradient checking a Neural Network layer。**实现 một tầng đơn tuyến `y = Wx + b` và phân tích ngược lại  sử dụng`numerical_gradient`校验 3x2 trọng lượng tử hình của chính xác性──

5. **Loss scaling experiment。**模拟 float16 训练: tạo phạm vi ở các gradient随机 trong [1e-9, 1e-3], chuyển đổi thành float16,并测量有多少比例变成零──然后应用损失规模(乘以 1024), chuyển đổi thành float16, tái quy mô lại,并再次测量零比例──

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

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)-- 权威参考资料, nội dung dày đặc nhưng đầy đủ
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740)-- NVIDIA  đề xuất float16  tập trung quy mô mất mát
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html)-- PyTorch Trung hỗn hợp độ chính xác
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16)- Google tại sao cho TPU  chọn kiểu này
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm)--  giảm số tiền điểm nổi 中 vòng tròn lỗi của thuật toán
