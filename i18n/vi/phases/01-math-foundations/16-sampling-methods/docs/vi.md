# Phương pháp lấy mẫu

> Tiêu mẫu là một cách để khám phá khả năng không gian AI.

**Type:** Build
**Language:**Python
**Prerequisites:** Phase 1, Lessons 06-07 (Probability, Bayes' Theorem)
**Time:** ~120 minutes

## Học mục tiêu
- Chỉ sử dụng số ngẫu nhiên đồng nhất, từ zero thực hiện ngược CDF, từ chối và quan trọng lấy mẫu
- Đối với mô hình ngôn ngữ Token 生成 cấu trúc nhiệt độ, top-k 和 top-p (tâm) lấy mẫu
- Giải thích thủ thuật tái định dạng, cũng như lý do tại sao nó có thể cho phép lấy mẫu trong VAEs  hỗ trợ Backpropagation
- 运行 Metropolis-Hastings MCMC, từ chưa được phân phối mục tiêu phân bố

## 问题
Một mô hình ngôn ngữ  hoàn thành để xử lý yêu cầu của bạn, sẽ tạo ra một chứa 50.000 logits của vector── từ vựng trong mỗi token đối với một── bây giờ nó phải chọn một── làm thế nào để chọn?

Nếu nó luôn luôn chọn Token có tỷ lệ xác suất cao nhất, mỗi lần phản ứng đều hoàn toàn giống nhau. Nếu nó hoàn toàn đồng đều chọn tùy chọn, output sẽ trở thành乱码.

Phân tích không chỉ được sử dụng để tạo văn bản. Phân tích Học tập  thông qua các quỹ đạo lấy mẫu để ước tính các gradient chính sách.

Mỗi hệ thống AI tạo đều là một hệ thống lấy mẫu. Chiến lược lấy mẫu quyết định chất lượng, đa dạng và khả kiểm soát được sản xuất.

## 概念
### Tại sao việc lấy mẫu là quan trọng

Tiêu chuẩn trong AI và Machine Learning có bốn vai trò cơ bản:

**Generation.**Các mô hình ngôn ngữ, mô hình phân tán và GAN đều thông qua lấy mẫu  tạo ra đầu ra.

**Training.**Stochastic Gradient Descent 会 sampling mini-batches──Dropout 会 sampling n phải ngừng sử dụng các neuron──Data augmentation 会 sampling ngẫu nhiên biến đổi──Importance sampling 会对样本重新加权,以降低强化学习 (PPO, TRPO) 中的 Gradient 方差──

**Estimation.**Trong ML rất nhiều lượng không có giải pháp hình thức đóng cửa. Ước tính phân bố dữ liệu Loss.

**Exploration.**Các thuật toán MCMC trong suy luận Bayesian 中探索后续 phân bố.

核心挑战是: bạn chỉ có thể trực tiếp lấy mẫu từ đơn giản phân bố trong đơn giản phân bố (uniform ≠ normal)  Đối với tất cả các phân bố khác, bạn cần một cách, chuyển các mẫu đơn giản thành các mẫu từ phân bố mục tiêu 

### Phân tích ngẫu nhiên thống nhất

Mỗi phương pháp lấy mẫu đều bắt đầu từ đây.

```
U ~ Uniform(0, 1)

P(a <= U <= b) = b - a    for 0 <= a <= b <= 1

Properties:
  E[U] = 0.5
  Var(U) = 1/12
```

Để từ n 个 mục của phân tán tập hợp mẫu đồng nhất, tạo U và quay lại sàn(n * U) ―― để từ连续区间 [a, b] trong mẫu, tính toán a + (b - a) * U。

关键洞察: Một số ngẫu nhiên đơn lẻ 恰好包含从任意分布中生成一个样本的随机性――技巧在于找到正确的转换――

### Phương pháp CDF ngược (Thiết mẫu biến ngược)

Chức năng phân phối tích lũy (CDF) 会把数值映射到概率:

```
F(x) = P(X <= x)

Properties:
  F is non-decreasing
  F(-inf) = 0
  F(+inf) = 1
  F maps the real line to [0, 1]
```

CDF ngược 会把概率映射回数值──若 U ~ Đồng dạng(0, 1), thì X = F_inverse(U) 服从目标分布──

```
Algorithm:
  1. Generate u ~ Uniform(0, 1)
  2. Return F_inverse(u)

Why it works:
  P(X <= x) = P(F_inverse(U) <= x) = P(U <= F(x)) = F(x)
```

**Exponential distribution 示例：**

```
PDF: f(x) = lambda * exp(-lambda * x),   x >= 0
CDF: F(x) = 1 - exp(-lambda * x)

Solve F(x) = u for x:
  u = 1 - exp(-lambda * x)
  exp(-lambda * x) = 1 - u
  x = -ln(1 - u) / lambda

Since (1 - U) and U have the same distribution:
  x = -ln(u) / lambda
```

Khi bạn có thể viết ra hình thức đóng F_inverse 时, phương pháp này hiệu quả hoàn hảo. Đối với phân bố bình thường, không có CDF ngược hình thức đóng, vì vậy chúng tôi sử dụng các phương pháp khác.

**离散版本：**Đối với phân bố phân định, hãy xây dựng CDF thành tổng tích lũy, tạo U, sau đó tìm tổng tích lũy vượt quá chỉ số thứ nhất của U. Đó là bài học 06 中`sample_categorical`

### Phân tích mẫu từ chối

Khi bạn không thể chuyển đổi CDF, nhưng có thể đánh giá mục tiêu trong một số thường xuyên khác nhau, việc lấy mẫu từ chối là có thể.

```
Target distribution: p(x)  (can evaluate, possibly unnormalized)
Proposal distribution: q(x)  (can sample from)
Bound: M such that p(x) <= M * q(x) for all x

Algorithm:
  1. Sample x ~ q(x)
  2. Sample u ~ Uniform(0, 1)
  3. If u < p(x) / (M * q(x)), accept x
  4. Otherwise, reject and go to step 1

Acceptance rate = 1/M
```

Trong m 越紧, tỷ lệ chấp nhận 越高──在低维(1-3) 中, việc lấy mẫu từ chối 效果 rất tốt──在高维中, tỷ lệ chấp nhận 会指数级下降, vì phần lớn khối lượng đề xuất sẽ bị từ chối── đây là lời nguyền rủa tính chiều kích của việc lấy mẫu từ chối──

**示例：从 truncated normal 中 sampling。**Trong phạm vi cắt giảm 上 sử dụng đề xuất đồng nhất.

**示例：从 semicircle 中 sampling。**Trong hình chữ nhật giới hạn, đề xuất đồng nhất. Nếu điểm rơi trong một vòng bán cầu, thì chấp nhận.

### Việc lấy mẫu quan trọng

Có lúc bạn không cần lấy mẫu phân bố mục tiêu p(x) ⋅ bạn cần ước tính kỳ vọng của p(x) ⋅ và bạn có mẫu phân bố khác q(x) ⋅

```
Goal: estimate E_p[f(x)] = integral of f(x) * p(x) dx

Rewrite:
  E_p[f(x)] = integral of f(x) * (p(x)/q(x)) * q(x) dx
            = E_q[f(x) * w(x)]

where w(x) = p(x) / q(x)  are the importance weights.

Estimator:
  E_p[f(x)] ~ (1/N) * sum(f(x_i) * w(x_i))    where x_i ~ q(x)
```

Đây là một trong những điều rất quan trọng trong việc học tập tăng cường. Trong PPO (Proposal Policy Optimization), bạn đang trong chính sách cũ, nhưng hy vọng tối ưu hóa chính sách mới.

Sự khác biệt giữa các mô hình đo lường tầm quan trọng phụ thuộc vào mức độ tương tự của q và p. Nếu q và p rất khác nhau, một số ít các mẫu sẽ có trọng lượng lớn và có thể được ước tính.

```
E_p[f(x)] ~ sum(w_i * f(x_i)) / sum(w_i)
```

### Đánh giá Monte Carlo

Phân tích Monte Carlo 通过对随机样本 求平均来近似积分── Luật số lớn 保证其收──

```
Goal: estimate I = integral of g(x) dx over domain D

Method:
  1. Sample x_1, ..., x_N uniformly from D
  2. I ~ (Volume of D / N) * sum(g(x_i))

Error: O(1 / sqrt(N))   regardless of dimension
```

误差率 không liên quan đến chiều kích. Đó là lý do tại sao trong trường hợp không thể thực hiện kết hợp dựa trên lưới, phương pháp Monte Carlo chiếm ưu thế.

**估计 pi：**

```
Sample (x, y) uniformly from [-1, 1] x [-1, 1]
Count how many fall inside the unit circle: x^2 + y^2 <= 1
pi ~ 4 * (count inside) / (total count)
```

**估计期望：**

```
E[f(X)] ~ (1/N) * sum(f(x_i))    where x_i ~ p(x)

The sample mean converges to the true expectation.
Variance of the estimator = Var(f(X)) / N
```

### Markov Chain Monte Carlo (MCMC): Metropolis-Hastings

MCMC xây dựng một chuỗi Markov, làm cho phân phối tĩnh của nó là mục tiêu phân phối p(x)。 sau đó, các mẫu trong chuỗi 就(近似) là các mẫu từ p(x)。

```
Target: p(x)  (known up to a normalizing constant)
Proposal: q(x'|x)  (how to propose the next state given the current state)

Metropolis-Hastings algorithm:
  1. Start at some x_0
  2. For t = 1, 2, ..., T:
     a. Propose x' ~ q(x'|x_t)
     b. Compute acceptance ratio:
        alpha = [p(x') * q(x_t|x')] / [p(x_t) * q(x'|x_t)]
     c. Accept with probability min(1, alpha):
        - If u < alpha (u ~ Uniform(0,1)): x_{t+1} = x'
        - Otherwise: x_{t+1} = x_t
  3. Discard first B samples (burn-in)
  4. Return remaining samples
```

Đối với các đề xuất đối xứng (q((x'x khi) = q(x khi)), tỷ lệ 会简化为 p(x')/p(x) 

**为什么有效。**Quy tắc chấp nhận bảo đảm cân bằng chi tiết: ở x không di chuyển đến x' tỷ lệ, tương đương với ở x' không di chuyển đến x tỷ lệ.

**实践注意事项：**
- Burn-in: trong chuỗi  đạt được cân bằng  trước khi bỏ ra các mẫu sớm
- Mỏng: mỗi phân đoạn mẫu giữ một, để giảm sự tương quan tự
- Skala đề xuất:太小会让链 移动缓慢(tự chấp nhận cao, khám phá chậm);太大会让大多数 đề xuất bị từ chối(tự chấp thấp, bị giữ vững)
- Cao维中 Gào thi đề xuất Ưu điểm chấp nhận tốt nhất là khoảng 0,234

### Gibbs Sampling

Phân tích Gibbs là một loại MCMC đặc biệt của phân bố đa biến. Nó không phải là một lần đưa ra động thái trên tất cả các chiều kích, mà là mỗi lần từ phân bố điều kiện  cập nhật một biến.

```
Target: p(x_1, x_2, ..., x_d)

Algorithm:
  For each iteration t:
    Sample x_1^{t+1} ~ p(x_1 | x_2^t, x_3^t, ..., x_d^t)
    Sample x_2^{t+1} ~ p(x_2 | x_1^{t+1}, x_3^t, ..., x_d^t)
    ...
    Sample x_d^{t+1} ~ p(x_d | x_1^{t+1}, x_2^{t+1}, ..., x_{d-1}^{t+1})
```

Gibbs lấy mẫu yêu cầu bạn có thể lấy mẫu từ mỗi phân phối điều kiện p ((x_i ∈ x_i ∈) ∈ X. Đối với nhiều mô hình, điều này rất trực tiếp:
- Các mạng Bayesian: điều kiện từ cấu trúc đồ thị
- Các hỗn hợp Gaussian:conditionals 是 Gaussian
- Mô hình Ising: mỗi spin của điều kiện chỉ phụ thuộc vào hàng xóm của nó

Tỷ lệ chấp nhận 总是 1 ((mỗi đề xuất đều được chấp nhận), vì từ việc lấy mẫu có điều kiện chính xác sẽ tự động đáp ứng cân bằng chi tiết.

**局限。**Khi các biến có độ cao liên quan, việc trộn mẫu của Gibbs là chậm, vì một lần cập nhật một biến không thể thực hiện các chuyển động đường viền lớn trong phân bố.

### Tiêu chuẩn nhiệt độ (được sử dụng cho LLM)

Các mô hình ngôn ngữ 会为 từ vựng 中每个代号 输出 logits z_1, ..., z_V──Softmax 会将它们转换成概率──Temperature 会在软max 前重新缩放 logits:

```
p_i = exp(z_i / T) / sum(exp(z_j / T))

T = 1.0: standard softmax (original distribution)
T -> 0:  argmax (deterministic, always picks highest logit)
T -> inf: uniform (all tokens equally likely)
T < 1.0: sharpens the distribution (more confident, less diverse)
T > 1.0: flattens the distribution (less confident, more diverse)
```

**为什么有效。**Nếu z_1 = 2 và z_2 = 1, nếu T = 0.5 trừ sau khi có z_1/T = 4 và z_2/T = 2, làm cho sự khác biệt lớn hơn.

**实践中：**
- T = 0,0:Cái mã tham lam, thích hợp nhất với thực tế kiểu Q&A
- T = 0,3-0,7: Có chút sáng tạo, phù hợp với việc tạo ra mã
- T = 0,7-1,0:平衡,适合一般对话
- T = 1.0-1.5:Thiết sáng tạo, tranh luận
- T > 1,5:越来越随机, thường rất ít hữu ích

Nhiệt độ sẽ không thay đổi bất kỳ token nào là có thể. Nó thay đổi phân bổ khối lượng xác suất của mỗi token.

### Top-k Sampling

Top-k sampling sẽ giới hạn tập hợp ứng cử viên cho tỷ lệ cao nhất của k 个 token, sau đó tái hợp lại,并 lấy mẫu từ tập hợp được giới hạn này.

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Keep only the top k tokens
  4. Renormalize: p_i' = p_i / sum(p_j for j in top-k)
  5. Sample from the renormalized distribution

k = 1:  greedy decoding
k = V:  no filtering (standard sampling)
k = 40: typical setting, removes long tail of unlikely tokens
```

Top-k 会防止模型选择极低概率的代币(拼写错误、无意义内容), những代币 này tồn tại trong长尾 của phân bố từ vựng. Vấn đề là: bất kể trên dưới đây như thế nào, k 都是固定的.

### Top-p (Nucleus) lấy mẫu

Top-p sampling 会动态调整候选集合大小──它 không giữ được số lượng mã thông báo cố định, mà giữ lại tỷ lệ tích lũy hơn 集合 mã thông báo tối thiểu của p──

```
Algorithm:
  1. Compute softmax probabilities for all V tokens
  2. Sort tokens by probability (descending)
  3. Find smallest k such that sum of top-k probabilities >= p
  4. Keep only those k tokens
  5. Renormalize and sample

p = 0.9:  keeps tokens covering 90% of probability mass
p = 1.0:  no filtering
p = 0.1:  very restrictive, nearly greedy
```

Khi mô hình rất rõ ràng, lấy mẫu hạt nhân sẽ giữ rất ít Token (có thể 2-3) ⋅ Khi mô hình không chắc chắn, nó sẽ giữ rất nhiều (có thể 200) ⋅

**常见组合：**
- Nhiệt độ 0,7 + top-p 0,9: Good chung thiết lập
- Nhiệt độ 0.0 (cười tham): nhất phù hợp với nhiệm vụ xác định
- Nhiệt độ 1.0 + top-k 50:Fan et al. (2018) 原论文设置

Top-k 和 top-p có thể được组合──先应用 top-k,再在剩余集合上应用 top-p──

### Trik sửa chữa (được sử dụng cho VAE)

Cách học của các mã hóa tự động biến thể (VAEs) là: đưa đầu vào mã hóa thành một phân bố trong không gian ẩn, lấy mẫu từ phân bố này, sau đó lấy mẫu mã hóa trở lại. Vấn đề là: bạn không thể vượt qua một hoạt động lấy mẫu.

```
Standard sampling (not differentiable):
  z ~ N(mu, sigma^2)

  The randomness blocks gradient flow.
  d/d_mu [sample from N(mu, sigma^2)] = ???
```

Trik tái định vị sẽ phân chia tính tự nhiên với các tham số:

```
Reparameterized sampling:
  epsilon ~ N(0, 1)          (fixed random noise, no parameters)
  z = mu + sigma * epsilon   (deterministic function of parameters)

  Now z is a deterministic, differentiable function of mu and sigma.
  d(z)/d(mu) = 1
  d(z)/d(sigma) = epsilon

  Gradients flow through mu and sigma.
```

Đây là lý do tại sao có hiệu quả, là vì N(mu, sigma^2) với mu + sigma * N(0, 1) có phân bố tương tự.

**在 VAE training loop 中：**
1. Mã hóa cho mỗi đầu vào 输出 mu 和 log(sigma^2)
2. mẫu epsilon ~ N(0, 1)
3. 计算 z = mu + sigma * epsilon
4. Khóa z 以重建 input
5. 穿过步骤 4、3、2、1  tiến hành Backpropagation(可行, vì bước 3 là可微的)

Không có thủ thuật tái định vị, VAE không thể sử dụng tiêu chuẩn Backpropagation  luyện tập.

### Gumbel-Softmax(可微的 Category Sampling)

Trù sửa đổi các phân bố khác nhau, chúng ta cần một cách khác. Gumbel-Softmax cho việc lấy mẫu phân loại cung cấp sự gần gũi nhỏ.

**Gumbel-Max trick（不可微）：**

```
To sample from a categorical distribution with log-probabilities log(p_1), ..., log(p_k):
  1. Sample g_i ~ Gumbel(0, 1) for each category
     (g = -log(-log(u)), where u ~ Uniform(0, 1))
  2. Return argmax(log(p_i) + g_i)

This produces exact categorical samples.
```

**Gumbel-Softmax（可微近似）：**

```
Replace the hard argmax with a soft softmax:
  y_i = exp((log(p_i) + g_i) / tau) / sum(exp((log(p_j) + g_j) / tau))

tau (temperature) controls the approximation:
  tau -> 0:  approaches a one-hot vector (hard categorical)
  tau -> inf: approaches uniform (1/k, 1/k, ..., 1/k)
  tau = 1.0: soft approximation
```

Gumbel-Softmax 会产生分分样的连续松──输出是概率向量(软 one-hot),而不是硬 one-hot──Gradients 会穿过软max 流动──在训练的前进通过中, bạn có thể sử dụng ước tính "lần thẳng":前进通过使用硬 argmax,但倒进通过使用软 Gumbel-Softmax梯度──

**应用：**
- Các biến ẩn riêng biệt trong VAEs
- Tìm kiếm kiến trúc thần kinh (选择离散 operations)
- Cơ chế chú ý cứng
- 带 discrete actions of Reinforcement Learning

### Tiêu chuẩn lấy mẫu

标准 Monte Carlo lấy mẫu có thể do sự tự nhiên trong không gian lấy mẫu trong đó còn trống.

```
Standard Monte Carlo:
  Sample N points uniformly from [0, 1]
  Some regions may have clusters, others gaps

Stratified sampling:
  Divide [0, 1] into N equal strata: [0, 1/N), [1/N, 2/N), ..., [(N-1)/N, 1)
  Sample one point uniformly within each stratum
  x_i = (i + u_i) / N   where u_i ~ Uniform(0, 1),  i = 0, ..., N-1
```

So với tiêu chuẩn Monte Carlo, sự khác biệt về mẫu được phân phối theo các quy định này thường thấp hơn hoặc tương tự:

```
Var(stratified) <= Var(standard Monte Carlo)

The improvement is largest when f(x) varies smoothly.
For piecewise-constant functions, stratified sampling is exact.
```

**应用：**
- Kết hợp số (quasi-Monte Carlo)
- Các dữ liệu đào tạo chia sẻ (đảm bảo mỗi gấp trung bình của lớp học)
- 带 stratification quan trọng lấy mẫu (组合两种技术)
- NeRF (Neural Radiance Fields) 沿着摄像头射线 使用采样层

### Kết nối với các mô hình phân phối

Các mô hình phân tán thông qua quá trình lấy mẫu 生成图像── tiến hành 会在 T 步中向图像添加高斯噪音,直到它变成纯噪音── ngược quá trình 学习谴责,逐步恢复原始图像──

```
Forward process (known):
  x_t = sqrt(alpha_t) * x_{t-1} + sqrt(1 - alpha_t) * epsilon
  where epsilon ~ N(0, I)

  After T steps: x_T ~ N(0, I)  (pure noise)

Reverse process (learned):
  x_{t-1} = (1/sqrt(alpha_t)) * (x_t - (1 - alpha_t)/sqrt(1 - alpha_bar_t) * epsilon_theta(x_t, t)) + sigma_t * z
  where z ~ N(0, I)

  Each denoising step is a sampling step.
```

Liên hệ với phương pháp này:
- Mỗi bước từ chối đều sử dụng thủ thuật tái định đo lường (sample noise, apply deterministic transform)
- Chương trình âm thanh {alpha_t}  kiểm soát một loại nhiệt độ
- Căn cứ sử dụng ước tính Monte Carlo 来近似 ELBO (bằng chứng bên dưới)
- Mô hình phân phối giữa mẫu tổ tiên là một chuỗi Markov (mỗi bước chỉ phụ thuộc vào trạng thái hiện tại)

Toàn bộ quá trình tạo hình ảnh là lấy mẫu lặp lại: từ tiếng ồn bắt đầu, trong mỗi bước, dựa trên mô hình từ chối được học, mẫu một phiên bản tiếng ồn ít hơn chút.


```figure
monte-carlo-pi
```

##  xây dựng nó
### 步骤 1: lấy mẫu CDF đồng nhất và ngược

```python
import math
import random

def sample_uniform(a, b):
    return a + (b - a) * random.random()

def sample_exponential_inverse_cdf(lam):
    u = random.random()
    return -math.log(u) / lam
```

生成 10.000 mẫu biểu diễn,并验证平均值为1/lambda。

### 步骤 2: Quyết định lấy mẫu

```python
def rejection_sample(target_pdf, proposal_sample, proposal_pdf, M):
    while True:
        x = proposal_sample()
        u = random.random()
        if u < target_pdf(x) / (M * proposal_pdf(x)):
            return x
```

Sử dụng lấy mẫu từ phân bố bình thường bị cắt giảm 中抽样──通过对样品 绘制 histogram 来验证形状──

### 步骤 3: Tiêu mẫu tầm quan trọng

```python
def importance_sampling_estimate(f, target_pdf, proposal_pdf, proposal_sample, n):
    total = 0
    for _ in range(n):
        x = proposal_sample()
        w = target_pdf(x) / proposal_pdf(x)
        total += f(x) * w
    return total / n
```

Sử dụng đề xuất đồng nhất  ước tính phân bố bình thường 下的 E[X^2]。与已知答案(mu^2 + sigma^2)比较。

### 步骤 4: ước tính Monte Carlo của pi

```python
def monte_carlo_pi(n):
    inside = 0
    for _ in range(n):
        x = random.uniform(-1, 1)
        y = random.uniform(-1, 1)
        if x*x + y*y <= 1:
            inside += 1
    return 4 * inside / n
```

### 步骤 5: Metropolis-Hastings MCMC

```python
def metropolis_hastings(target_log_pdf, proposal_sample, proposal_log_pdf, x0, n_samples, burn_in):
    samples = []
    x = x0
    for i in range(n_samples + burn_in):
        x_new = proposal_sample(x)
        log_alpha = (target_log_pdf(x_new) + proposal_log_pdf(x, x_new)
                     - target_log_pdf(x) - proposal_log_pdf(x_new, x))
        if math.log(random.random()) < log_alpha:
            x = x_new
        if i >= burn_in:
            samples.append(x)
    return samples
```

Từ phân bố hình thái hai Gaussia hỗn hợp) trong việc lấy mẫu.

### Bước 6: lấy mẫu Gibbs

```python
def gibbs_sampling_2d(conditional_x_given_y, conditional_y_given_x, x0, y0, n_samples, burn_in):
    x, y = x0, y0
    samples = []
    for i in range(n_samples + burn_in):
        x = conditional_x_given_y(y)
        y = conditional_y_given_x(x)
        if i >= burn_in:
            samples.append((x, y))
    return samples
```

### 步骤 7: Tiêu chuẩn nhiệt độ

```python
def softmax(logits):
    max_l = max(logits)
    exps = [math.exp(z - max_l) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def temperature_sample(logits, temperature):
    scaled = [z / temperature for z in logits]
    probs = softmax(scaled)
    return sample_from_probs(probs)
```

展示 nhiệt độ 如何改变一组 Đơn vị logits 的输出分布──

### 步骤 8: lấy mẫu top-k và top-p

```python
def top_k_sample(logits, k):
    indexed = sorted(enumerate(logits), key=lambda x: -x[1])
    top = indexed[:k]
    top_logits = [l for _, l in top]
    probs = softmax(top_logits)
    idx = sample_from_probs(probs)
    return top[idx][0]

def top_p_sample(logits, p):
    probs = softmax(logits)
    indexed = sorted(enumerate(probs), key=lambda x: -x[1])
    cumsum = 0
    selected = []
    for token_idx, prob in indexed:
        cumsum += prob
        selected.append((token_idx, prob))
        if cumsum >= p:
            break
    sel_probs = [pr for _, pr in selected]
    total = sum(sel_probs)
    sel_probs = [pr / total for pr in sel_probs]
    idx = sample_from_probs(sel_probs)
    return selected[idx][0]
```

### 步骤 9: Tránh sửa chữa

```python
def reparam_sample(mu, sigma):
    epsilon = random.gauss(0, 1)
    return mu + sigma * epsilon

def reparam_gradient(mu, sigma, epsilon):
    dz_dmu = 1.0
    dz_dsigma = epsilon
    return dz_dmu, dz_dsigma
```

演示 Gradient có thể đi qua mẫu tái định dạng 流动, nhưng không thể đi qua mẫu trực tiếp 流动.

### 步骤 10: Gumbel-Softmax

```python
def gumbel_sample():
    u = random.random()
    return -math.log(-math.log(u))

def gumbel_softmax(logits, temperature):
    gumbels = [math.log(p) + gumbel_sample() for p in logits]
    return softmax([g / temperature for g in gumbels])
```

展示降低温度 如何让输出接近一个热向量──

 hoàn toàn thực hiện và tất cả những khả thi đều trong `code/sampling.py`Ở giữa.

## Sử dụng nó
Sử dụng NumPy và SciPy 时, sản xuất  phiên bản như sau:

```python
import numpy as np

rng = np.random.default_rng(42)

exponential_samples = rng.exponential(scale=2.0, size=10000)
print(f"Exponential mean: {exponential_samples.mean():.4f} (expected 2.0)")

from scipy import stats
normal = stats.norm(loc=0, scale=1)
print(f"CDF at 1.96: {normal.cdf(1.96):.4f}")
print(f"Inverse CDF at 0.975: {normal.ppf(0.975):.4f}")

logits = np.array([2.0, 1.0, 0.5, 0.1, -1.0])
temperature = 0.7
scaled = logits / temperature
probs = np.exp(scaled - scaled.max()) / np.exp(scaled - scaled.max()).sum()
token = rng.choice(len(logits), p=probs)
print(f"Sampled token index: {token}")
```

 Đối với MCMC quy mô lớn, sử dụng thư viện đặc biệt:
- PyMC: sử dụng mô hình hóa Bayesian hoàn chỉnh của NUTS (HMC thích nghi)
- emcee:ensemble MCMC mẫu
- NumPyro/JAX: MCMC tăng tốc GPU

Bạn đã xây dựng những phương pháp này từ không. Bây giờ bạn biết những cuộc gọi thư viện này là gì.

## 练习
1. Để phân phối nhanh chóng 实现 ngược lấy mẫu CDF。 CDF là F(x) = 0.5 + arctan(x) / pi。 tạo ra 10.000 mẫu,并把 histogram với thực PDF 画在一起。 chú ý đuôi nặng(远离中心的极端值)。

2. Sử dụng mẫu từ chối, thông qua Uniform(0, 1) đề xuất từ Beta(2, 5) phân phối 生成 mẫu──把 được chấp nhận mẫu với thực tế Beta PDF 画在一起── tỷ lệ chấp nhận lý thuyết là bao nhiêu?

3. Sử dụng Monte Carlo, sử dụng 1.000、10,000 和 100.000 个样本 估计 sin(x) từ 0 đến pi của积分──比较每个级别的误差──验证误差按 O(1/sqrt(N)) 缩放──

4. 实现 Metropolis-Hastings, từ một phân phối 2D trong đó p(x, y) tương xứng với exp(-(x^2 * y^2 + x^2 + y^2 - 8*x - 8*y) / 2);; vẽ mẫu 和 chuỗi quỹ đạo;;尝试不同的提案标准偏差;;

5. 构建一个完整的文本生成演示:给定一个包含10个词及 logits的词汇,使用 (a) tham lam、(b) nhiệt độ=0.7、((c) top-k=3、((d) top-p=0.9 生成长度为20 Token 的序列──比较 5 次运行中输出的多样性──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Sampling | “抽取随机值” | 按照 probability distribution 生成数值。所有 generative AI 背后的机制 |
| Uniform distribution | “所有值同等可能” | [a, b] 中每个值都有相同 probability density 1/(b-a)。所有 sampling methods 的起点 |
| Inverse CDF | “概率变换” | F_inverse(U) 会把 uniform sample 转换成来自任意已知 CDF 分布的 sample。精确且高效 |
| Rejection sampling | “提出并接受/拒绝” | 从简单 proposal 中生成，按 target/proposal ratio 成比例的概率接受。精确但浪费 samples |
| Importance sampling | “重新加权 samples” | 使用来自 q(x) 的 samples，通过用 p(x)/q(x) 加权每个 sample，估计 p(x) 下的期望。RL 中 PPO 的核心 |
| Monte Carlo | “平均 random samples” | 将积分近似为 sample averages。误差 O(1/sqrt(N))，与维度无关 |
| MCMC | “会收敛的 random walk” | 构造一个 Markov chain，使其 stationary distribution 是目标分布。Metropolis-Hastings 是基础算法 |
| Metropolis-Hastings | “接受上坡，有时接受下坡” | 提出 moves，基于 density ratio 接受。Detailed balance 确保收敛到目标分布 |
| Gibbs sampling | “一次一个 variable” | 在固定其他 variables 的情况下，从每个 variable 的 conditional distribution 中更新。Acceptance rate 为 100% |
| Temperature | “置信度旋钮” | 在 softmax 前用 T 除以 logits。T<1 使分布更尖锐（更自信），T>1 使分布更平坦（更多样） |
| Top-k sampling | “保留最好的 k 个” | 除概率最高的 k 个 Token 外全部置零，重新归一化，然后 sampling。候选集合大小固定 |
| Nucleus sampling (top-p) | “保留可能性高的那些” | 保留累计概率超过 p 的最小 Token 集合。候选集合大小自适应 |
| Reparameterization trick | “把随机性移到外部” | 写成 z = mu + sigma * epsilon，其中 epsilon ~ N(0,1)。让 sampling 可微。VAE training 的关键 |
| Gumbel-Softmax | “软 categorical sampling” | 使用 Gumbel noise + 带 temperature 的 softmax，对 categorical sampling 做可微近似 |
| Stratified sampling | “强制覆盖” | 把 sample space 分成 strata，并从每个 stratum 中 sampling。方差总是低于 naive Monte Carlo |
| Burn-in | “预热期” | 在 chain 达到其 stationary distribution 之前丢弃的初始 MCMC samples |
| Detailed balance | “可逆性条件” | p(x) * T(x->y) = p(y) * T(y->x)。这是 p 成为 Markov chain stationary distribution 的充分条件 |
| Diffusion sampling | “迭代 denoising” | 从 noise 开始，并应用学到的 denoising steps 来生成数据。每一步都是 conditional sampling operation |

## 延伸阅读
- [Holbrook (2023): The Metropolis-Hastings Algorithm](https://arxiv.org/abs/2304.07010)-  Về cơ sở MCMC
- [Jang, Gu, Poole (2017): Categorical Reparameterization with Gumbel-Softmax](https://arxiv.org/abs/1611.01144)- 原始 Gumbel-Softmax 论文
- [Holtzman et al. (2020): The Curious Case of Neural Text Degeneration](https://arxiv.org/abs/1904.09751)- lấy mẫu hạt nhân (top-p) 论文
- [Kingma & Welling (2014): Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)- 介绍 thủ thuật tái định đo lường của VAE 论文
- [Ho, Jain, Abbeel (2020): Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)- DDPM sẽ liên kết lấy mẫu với hình ảnh tạo
