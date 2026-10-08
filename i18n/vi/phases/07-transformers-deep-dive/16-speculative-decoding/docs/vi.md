# Tự đoán giải mã  Dự thảo  Định xác định  Lặp lại

> Autoregressive decoding is a series of lines. Mỗi token đều phải chờ đợi trước một token. Spekulative decoding  phá vỡ chuỗi này: một mô hình rẻ tiền trước một dự thảo N 个 token, mô hình đắt tiền trong một lần đi trước kiểm tra tất cả các N 个 token.

**Type:** Build
**Languages:** Python
**先修要求:**GV: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT: GPT:
**Time:** ~60 minutes

## 问题

Một chương trình 70B LLM trong H100 上采采样一个代币 需要约30 ms.――一个3B草案模型 需要约3 ms.――如果让3B草案提前生成5代币,然后让70B *只运行一次*来验证这5代币,总耗时就是`5×3 + 30 = 45 ms`, tối đa có thể chấp nhận 5 token; và trực tiếp tạo cần thiết `5×30 = 150 ms` Đó là điểm bán hoàn toàn của giải mã dự đoán: sử dụng ít lượng lưu trữ GPU bổ sung (Draft Model) để thay đổi 24× hơn là độ trễ giải mã thấp hơn

关键 là phải giữ phân phối. Leviathan et al. (2023) và Chen et al. cùng kỳ đề xuất Tiến pháp lấy mẫu dự đoán đảm bảo phân phối chuỗi xuất với mô hình lớn khi tạo ra độc lập**完全相同**Không có chất lượng. Chỉ nhanh hơn.

Đến năm 2026, bốn loại dự thảo-điểm tra viên 组合主导 suy luận:

1. **Vanilla speculative (Leviathan 2023)。**独立草案模型 (ví dụ: Llama 3 1B) + xác minh (ví dụ: Llama 3 70B)
2. **Medusa (Cai 2024)。**Trong xác minh trên thêm nhiều đầu mã hóa,并行预测位置 `t+1..t+k`Không cần mô hình dự thảo độc lập
3. **EAGLE family (Li 2024, 2025)。**复用验证器 隐藏状态 的轻量草案; 接受率比 vanila 更接近;典型为34×。
4. **Lookahead decoding (Fu 2024)。**Sự lặp lại Jacobi; hoàn toàn không cần mô hình dự thảo.

Mỗi sản xuất cấp độ suy luận hàng năm 2026 đều默认 cung cấp định nghĩa định nghĩa.

## 核心概念

### 核心算法

给定一个验证器 `M_q`Và một bản thảo rẻ hơn `M_p`- Có thể là:

1. Làm cho`x_1..x_k`为已经解码的前音:
2. **Draft**: sử dụng `M_p`autoregressively 提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`, đối phó với dự thảo xác suất`p_1..p_N`
3. **并行 verify**: trong `x_1..x_k, d_{k+1}, ..., d_{k+N}`上运行 một lần `M_q`, lấy vị trí`k+1..k+N+1` của xác minh xác suất `q_1..q_{N+1}`
4. **从左到右 accept/reject 每个 draft token**: đối với mỗi người`i`, theo tỷ lệ`min(1, q_i(d_i) / p_i(d_i))`接受──
5. Ở vị trí `j`Lần đầu tiên bị từ chối: phân phối "đáng sót" sau khi tái sinh`(q_j - p_j)_+`Trung采样 `t_j``j`Sau đó tất cả các dự thảo đều bị bỏ rơi.
6. Nếu tất cả`N`个都被接受: từ `q_{N+1}`采样一个额外Token `t_{N+1}`(tài báo tiền thưởng miễn phí)

Phân bố dư thừa kỹ thuật này là để phân phối xuất và phân phối`M_q`Từ đầu theo kiểu hoàn toàn phù hợp trong toán học.

### 什么决定加速

Làm cho`α`= Tỷ lệ chấp nhận dự kiến của mỗi dự án token `c`= tỷ lệ chi phí dự thảo đối với kiểm tra viên── mỗi bước trong:

- Thế hệ ngây thơ Mỗi token cần 1 lần gọi mô hình lớn.
- Khi đó`α`很高时, n định mỗi ngày`(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`个Token 需要1次大型号调用──

Trong `α = 0.75`且 `N = 5`时,典型经验法则是: big-model call 减少 3×──Draft cost is 5× cheap──总体墙-clock 约下降 2.5×──

**α 取决于：**

- Mức độ gần gũi của dự thảo đối với người xác minh.
- Chiến lược giải mã. Đề xuất tham lam đối với xác minh tham lam:α 高。 Tiêu chuẩn lấy mẫu:更难匹配; chấp nhận 下降。
- Tiểu nhiệm vụ──Code 和 cấu trúc đầu ra 接受更多(更可预测);自由形式创意写作接受更少──

### Medusa  没有草案模型 的草案

Medusa dùng xác minh trên của đầu sản xuất bổ sung thay thế mô hình dự thảo.`t`- Có thể là:

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

Mỗi đầu 输出 logits của riêng mình                                                                                                                                                                                                                                                          

优点:没有第二个模型──缺点: tăng các tham số có thể đào tạo; cần một giai đoạn điều chỉnh tinh tế được giám sát 阶段(约 1B Token); tỷ lệ chấp nhận 比使用优秀草案的 vanila投机略低──

### Eagle  通过复用隐藏状态 获得更好的草案

EAGLE-1/2/3 (Li et al., 20242025) sẽ thiết kế mô hình dự thảo được thiết kế cho một biến thể rất nhỏ (đường là 1 tầng), nhập vào trạng thái ẩn lớp cuối cùng của trình xác minh. Vì dự thảo có thể thấy đại diện tính năng của trình xác minh, dự đoán của nó và phân bố đầu ra của trình xác minh có liên quan cao.

EAGLE-3 (2025)  đã gia nhập tìm kiếm cây đối với sự tiếp tục của ứng cử viên.

### KV cache dance

Việc kiểm tra sẽ được thực hiện`N`个草案 token trong một lần chuyển tiếp trung  cho xác minh.`N`项── Nếu một số dự thảo bị từ chối, bạn phải đặt cache quay lại để có được longitude của tiền tố đã chấp nhận──

生产实现(vLLM của `--speculative-model`、TensorRT-LLM's LookaheadDecoder) thông qua việc cạo KV buffers  xử lý việc này──先写入,接受时再 commit──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

##  xây dựng nó

见 `code/main.py`Chúng tôi sử dụng các bộ phận sau để thực hiện các cơ sở đầu cơ-chọn mẫu 算法 (đang từ chối + phân phối dư):

- Một "chương trình lớn", nó là xác định-mềmmax trên phân bố viết tay (để phân tích toán học chấp nhận)
- Một "mô hình bản thảo", đó là phiên bản rối loạn của mô hình lớn.
- Một vòng chấp nhận / từ chối, tạo ra phân phối biên tương tự với lấy mẫu trực tiếp.

### 步骤 1: bước từ chối

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`Đó là một số ngẫu nhiên đồng nhất.`q_prob`là xác minh cho xác suất của token được soạn thảo.`p_prob` Dự thảo mô hình  Thiết lý Leviathan  Chứng minh, quyết định Bernoulli này cộng với việc từ chối  từ các mẫu dư thừa, có thể nghiêm ngặt giữ phân bố của xác minh 

### 步骤 2: phân phối dư thừa

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

个元素 từ `q`中减去 `p`, sẽ clamp giá trị tiêu cực đến 0, sau đó tái归归化.

### Bước 3: Một bước đầu cơ

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

接受五个 → 一个奖金 → 一次验证通过 生成六个代币――

### 步骤 4: đo lường tỷ lệ chấp nhận

Trong các dự thảo khác nhau chất lượng 水平下运行 10,000 个投机步骤―― vẽ tỷ lệ chấp nhận với dự thảo 和 xác minh phân chia giữa KL sự khác biệt―― bạn nên thấy rõ ràng các mối quan hệ đơn调――

### Bước 5: Thử nghiệm phân phối giá bình đẳng

经验证:sự phỏng đoán vòng 生成的代币直方图应匹配直接从验证器采样得到的直方图――这是实践中的利维亚坦定理――Chi-quad test 会确认差异在样本错误范围内――

## Sử dụng nó

Sản xuất:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model /models/llama-3.1-eagle-70b \
    --speculative-draft-tensor-parallel-size 1 \
    --num-speculative-tokens 5

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-model meta-llama/Llama-3.2-1B-Instruct \
    --num-speculative-tokens 5
```

截至 2026年中, TensorRT-LLM 拥有最快的梅杜萨路径──`faster-whisper`Để bí mật lớn 封装了带小草案的 

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- Chỉ tạo ra 15 个 Token của một chuỗi thế hệ.
- 极具创意 / Tiêu chuẩn nhiệt độ cao (α 会下降)
- Việc triển khai có hạn chế bộ nhớ (Draft Model 会增加 VRAM)

## 交付 nó

见 `outputs/skill-spec-decode-picker.md`◊This skill 会为新推断工作负载 选择一种 ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

## 练习

1. **Easy。**运行 `code/main.py` xác nhận trên 50.000 Token 上, phân phối token đầu cơ phù hợp với phân phối mẫu trực tiếp của xác minh, và chi-quad p > 0.05。
2. **Medium。**Đối với`α = 0.5, 0.7, 0.85`, vẽ tốc độ lên ((( mỗi lần lớn mô hình tiến của Token số) theo`N`                                                                                                                                                                                                                                                              `N`▽(Công báo: mỗi lần xác minh cuộc gọi ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽ ▽`(1 - α^{N+1}) / (1 - α)`◊)
3. **Hard。**实现一个小 Medusa:取课14的结石 GPT,添加3个额外LM头,分别预测位置 t+2、t+3、t+4──在小小shakespeare 上用联合多头损失训练──与通过截断同一个模型得到的 vanila草案比较接受率──
4. **Hard。**实现 rollback: từ một 10 token prefix KV cache 开始,入 5 个草案代币,模拟在位置 3拒绝――验证下一轮代时你的缓存 读取结果正确匹配 "prefix + 2 đầu tiên được chấp nhận bản thảo"――

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| Draft model | “便宜的那个” | 一个更小的模型，用于提出候选 Token；通常比 verifier 便宜 10–50×。 |
| Verifier | “大的那个” | 我们要保留其分布的目标模型；每个 speculative step 运行一次。 |
| Acceptance rate (α) | “draft 有多常对” | verifier 接受 draft 的 per-token probability。典型为 0.7–0.9。 |
| Residual distribution | “rejection fallback” | 归一化后的 `(q - p)_+`；rejection 时从这里采样可保留 verifier 的分布。 |
| Bonus token | “免费的那个” | 当全部 N 个 draft 被接受时，从 verifier 的 next-step distribution 再采样一个。 |
| Medusa | “Draft-less speculative” | verifier 上的多个 LM heads 并行预测位置 t+1..t+k。 |
| EAGLE | “Hidden-state draft” | 以 verifier last-layer hidden states 为条件的 tiny transformer draft。 |
| Lookahead decoding | “Jacobi iteration” | 使用 fixed-point iteration 的 self-speculation；没有 draft model。 |
| Tree attention | “一次 verify 多个候选” | 同时考虑多个 draft continuations 的 branching verification。 |
| KV rollback | “撤销 rejected drafts” | Scratch KV buffer；接受时 commit，reject 时 discard。 |

## 延伸阅读

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等式定理──
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出;清晰的 Bernoulli-rejection 证明──
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) Medusa 论文;tree-attention 验证。
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) EAGLE-1; dựa trên điều kiện tình trạng ẩn ở dự thảo
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) Eagle-2; độ sâu động của cây
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) Eagle-3:
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057) nhìn, không có dự thảo 方法。
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html)                                                                                                                                                                                                                                                              
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE)                                                                                                                                                                                                                                                              
