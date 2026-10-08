# Việc giải mã và Eagle

> frontier LLM 生成一个代币 需要对数十亿参数进行一次完整的前进传递. 配置这个前进传递远超实际需求:大多数时候, một mô hình nhỏ hơn sẽ có thể đoán chính xác 3-5 代币 tiếp theo, trong khi mô hình lớn chỉ cần * xác minh* 猜测.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 问题

Mô hình cấp 70B trên H100 có hiệu suất giải mã thường là 40-80 token/thứ giây. Mỗi token đều cần một lần vượt qua hoàn chỉnh, từ HBM  đọc tất cả trọng lượng của mô hình. Bạn không thể trong tình huống không thay đổi đầu ra mô hình. Bạn cũng không thể tiếp tục tăng kích thước lô bên ngoài bộ nhớ. Bạn đã bị mắc kẹt, trừ khi bạn có thể làm cho mô hình vượt qua hoàn toàn trước.

Thế hệ tự do suy giảm trông tự nhiên là dòng dòng:`x_{t+1} = sample(p(· | x_{1:t}))`Nhưng đây là cơ hội. Nếu bạn có một dự đoán giá rẻ nói rằng 4 token tiếp theo rất có thể là [a, b, c, d], bạn có thể có được trong**大 model 的单次 forward pass**Trong kiểm tra tất cả 5 vị trí,并 chấp nhận

Leviathan、Kalai、Matias(2023,Fast Inference from Transformers via Speculative Decoding) thông qua một quy tắc 巧妙的接受/拒绝精确实现这一点,该规则保留目标模型的样本分布──相同的输出分布,速度提升 2-4x──

## 概念

### 双 Mô hình  thiết lập

- **Target model** `M_p`Bạn thực sự muốn bắt đầu từ mô hình lớn, chậm, chất lượng cao.`p(x)`
- **Draft model** `M_q`:小型、快速、质量较低的模型── phân phối:`q(x)`✿小 5-30x✿

Mỗi bước:

1. Dự thảo mô hình autoregressively 提议 `K`个 Đèn:`x_1, x_2, ..., x_K ~ q`
2. Mô hình mục tiêu đối với tất cả`K+1`个位置并行运行一次前进通,为每个提议代币 生成 `p(x_k)`
3. 按下面修改后的拒绝-样本规则从左到右接受/拒绝 每个代币──接受最长匹配前──
4. Nếu bất kỳ Token nào bị từ chối, thì từ sửa đổi sau phân phối 中采样替换 Token 并停止──否则从 `p(· | x_1...x_K)`采样一个奖金代币――

Nếu dự thảo phù hợp hoàn toàn với mục tiêu, bạn có thể nhận được K + 1 Token. Nếu dự thảo ở vị trí 1 đã sai, bạn chỉ có thể nhận được 1 Token.

### 精确性规则

Việc giải mã giả định **在 distribution 上可证明等价于从 p 采样**❖ Quyết định 规则:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

Trong số đó `(p - q)+`biểu hiện phân biệt điểm của chính phần.`p ≈ q`Khi chúng không phù hợp, phân phối dư sẽ được xây dựng, để toàn bộ mẫu vẫn xác định tuân theo.`p`

**Greedy 情况。**Đối với việc lấy mẫu nhiệt độ = 0, chỉ cần kiểm tra`argmax(p) == x_t`Nếu là, thì chấp nhận; nếu không, thì输出`argmax(p)`Không dừng lại.

### 期望 tăng tốc

Nếu tỷ lệ chấp nhận của mô hình dự thảo của Token là `α`,则每次目标前进通过 生成的期望代币 数为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

Khi đó`α = 0.8, K = 4`- Có thể là:`(1 - 0.8^5)/(1 - 0.8) = 3.36`个 Token Mỗi lần đi trước. Một lần mục tiêu đi trước.`cost_q * K + cost_p`(K 个 dự thảo bước thêm một lần xác minh mục tiêu)`cost_p >> cost_q * K`, tỷ lệ tăng tốc của thông qua là `3.36× / 1 = 3.36×`

Chỉ có một số nguyên tố thực sự là`α`, nó hoàn toàn phụ thuộc vào việc sắp xếp dự thảo- mục tiêu.

### 训练 Dự thảo: Chất cất

随机的小模型会成为非常差的草案――

1. 选择一个小建筑(70B mục tiêu đối với đối tượng 1B,7B mục tiêu đối với đối tượng 500M)
2. Trong quy mô lớn văn bản ngôn ngữ vận hành mô hình mục tiêu; lưu trữ các phân phối mã thông báo tiếp theo của nó.
3. Sử dụng KL divergence 训练 draft, làm cho nó phù hợp với mục tiêu của phân phối (trừ việc phù hợp với các token thực tại)

Kết quả là:`α`Trong việc mã hóa, thường là 0.6-0.8, trong trò chuyện ngôn ngữ tự nhiên, lên là 0.7-0.85── trong sản xuất, tốc độ tăng lên là 2-3x──

### Eagle:Cây vẽ + Feature Reuse

Li、Wei、Zhang、Zhang(2024,EAGLE: Tiêu chuẩn lấy mẫu dự đoán đòi hỏi phải suy nghĩ lại tính năng không chắc chắn) quan sát đến tiêu chuẩn giải mã dự đoán 中的两个低效点:

1. Dự thảo thực hiện K 个串行 bước, mỗi bước đều là đầy đủ. Nhưng dự thảo có thể được sử dụng lần gần đây để xác minh các tính năng của mục tiêu trung gian.
2. Dự thảo 输出一条线性链── nếu dự thảo 能输出一个候选人 *tree*( mỗi节点 có nhiều đoán), mục tiêu của một lần tiến qua được thông qua mặt nạ chú ý cây và xác minh nhiều条 ứng cử viên đường,并 chọn nhánh được chấp nhận dài nhất──

Eagle-1 的变化:
- Draft input = mục tiêu trong tình trạng ẩn cuối cùng của vị trí t, chứ không phải mã thông báo nguyên liệu.
- Thiết kế kiến trúc = 1 lớp decoder biến thể không phải là mô hình nhỏ độc lập)
- Tạo ra = Mỗi chiều sâu có K = 4-8 个候选人, chiều sâu 为 4-6 个树.

EAGLE-2(2024) 加入动态树木拓科: 在草案不确定位置,树变宽; 在草案自信的位置,树保持较窄──在不增加验证成本的情况下提高 `α_effective`

EAGLE-3(Li et al. 2025,EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test) đã loại bỏ sự phụ thuộc thuộc vào tính năng lớp trên cố định,并使用新的test-time simulation loss 训练草案,也就是让在匹配目标试题时间分配的输出上训练,而不是在教师强制训练上训练――接受率从0.75(EAGLE-2)升至0.82(EAGLE-3),平均代币/验证 3.0 从升至4.5:

### Kiểm tra sự chú ý của cây

Khi dự thảo 输出 cây 时, mục tiêu mô hình **tree attention mask**Trong một lần đi trước, kiểm tra nó. Mặt nạ chú ý cây là một loại mặt nạ nhân quả, nó mã hóa topology cây, chứ không phải cấu trúc tự nhiên. Mỗi token chỉ đi đến tổ tiên của nó trong cây.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

Nếu `a, b`là ứng cử viên đầu tiên của cuộc thi,`c, d, e, f`là ứng cử viên mã thông báo thứ hai, thì tất cả sáu vị trí đều có thể được xác minh trong một lần đi trước.

### 什么时候有效,什么时候无效

**有效：**
- Chat / hoàn thành, và文本可预测(code、常见 tiếng Anh、structured output)`α`Cao ơi
- Khóa 阶段有未使用GPU compute 的设置(khúc lưu trữ-bắt buộc giai đoạn) ――Cái cây bản thảo 使用可用FLOPs。

**无效 / 没有收益：**
- Cao随机性输出 (((sự viết sáng tạo nhiệt độ cao) ]]`α`会向 `1/|vocab|`Này, xuống đây.
- 非常高的同步性的批量服务,批量已填满FLOPs,树验证的空间很小──
- 非常小的目标模型,此时草案没有小很多──

Các nhóm sản xuất thường báo cáo trò chuyện lên có 2-3x tốc độ đồng hồ tường, code generation lên có 3-5x, trong khi viết sáng tạo lên gần không.


```figure
speculative-decoding
```

##  xây dựng nó

`code/main.py`- Có thể là:

- Một tham khảo thực hiện`speculative_decode(target, draft, prompt, K, temperature)`, nó thực hiện sự từ chối chính xác 规则,并验证 nó giữ lại phân phối mục tiêu của mình (Empirical KL < 0.01 vs. plain target sampling)
- Một cây vẽ kiểu Eagle, sử dụng các nhánh trên cùng của cây.
- Một nhà xây dựng mặt nạ chú ý cây, để xác minh sinh ra một mẫu nguyên nhân chính xác.
- Một vòng đeo tốc độ chấp nhận, trong LM nhỏ 上运行两者(từ mục tiêu trung bình GPT-2-đơn vị nhỏ GPT-2-)

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## Sử dụng nó

- **vLLM**和 **SGLang**提供一等 支持── cờ:`--speculative_model``--num_speculative_tokens` 2/3 通过 `--spec_decoding_algorithm eagle`cờ 支持。
- **NVIDIA TensorRT-LLM**Động cơ của cây Medusa và cây Eagle.
- **Reference draft models**- Có thể là:`Qwen/Qwen3-0.6B-spec`(được sử dụng trong các bản thảo của Qwen3-32B)`meta-llama/Llama-3.2-1B-Instruct-spec`(được sử dụng cho các bản thảo 70B)
- **Medusa heads**(Cai et al. 2024,Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads): không sử dụng mô hình dự thảo, mà là mục tiêu 自身添加 K 个并行预测头――部署更简单, chấp nhận 略低于EAGLE。

## 交付 nó

本课会产出 `outputs/skill-speculative-tuning.md`, đây là một kỹ năng, để phân tích khối lượng công việc của mô hình mục tiêu,并选择: mô hình sơ đồ K(chu kỳ sơ đồ) √ chiều rộng cây √ nhiệt độ,以及何时 fallback đến giải mã đơn giản.

## 练习

1. 实现精确拒绝 规则并进行实证验证──通过 `speculative_decode`和 đơn giản mục tiêu lấy mẫu 分别运行 10K mẫu; tính toán hai phân phối đầu ra 间 TV khoảng cách──应小于0.01──

2. 计算 tốc độ 公式。给定固定 `α`和 `K`, vẽ mỗi lần mục tiêu-đến trước của kỳ vọng Địa chỉ số.

3. 训练一个小草稿──取一个124M GPT-2目标, và 100M token 上用 KL loss distill一个30M GPT-2草稿──测量 held-out text 上的`α`❖ dự đoán: 0.6-0.7♦

4. 实现EAGLE-style tree drawing──不要使用链,而是让草稿 在每个深度 输出 top-3 ránh──构建树注意面具──验证目标 接受最长正确分支──

5. 测量 failure modes──在温度=1.5(高随机性) 下运行 suy đoán decode──展示 α 崩塌,并且由于草案 overhead,该算法比简单 decode 更慢──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|------------------------|
| Target model | “大 model” | 你想从中采样的缓慢、高质量 model（p distribution） |
| Draft model | “speculator” | 小型、快速 predictor（q distribution）；小 5-30x |
| K / draft length | “Look-ahead” | 每次 verify pass 推测的 Token 数 |
| α / acceptance rate | “Hit rate” | draft 提议被接受的每 Token 概率 |
| Exact rejection rule | “accept test” | 保留 target distribution 的 r < p/q 比较 |
| Residual distribution | “修正后的 p-q” | (p - q)+ / ||(p - q)+||_1，rejection 时要从中采样的 distribution |
| Tree drafting | “Branching speculation” | Draft 输出候选 tree，并用 tree-structured attention mask 在一次 pass 中 verify |
| Tree attention mask | “Topological mask” | 编码 tree topology 的 causal mask，使每个 node 只 attend 到它的 ancestors |
| Medusa heads | “Parallel heads” | target 自身上的 K 个额外 prediction heads；没有独立 draft model |
| EAGLE feature reuse | “Hidden-state draft” | Draft input 是 target 的最后 hidden state，而不是 raw tokens，从而缩小 draft |
| Test-time simulation loss | “EAGLE-3 training” | 在匹配 target test-time distribution 的输出上训练 draft，而不是 teacher forcing |

## 延伸阅读

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) 精确 từ chối 规则和理论加速 分析
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind 的 đồng thời suy đoán-chọn mẫu 论文
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) Dự thảo mô hình của các tiêu đề song song 替方案
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) tính năng tái sử dụng và vẽ cây
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态 Topology cây
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) Thời gian tàu-đào giờ thử nghiệm
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) Đánh mã Jacobi/lookahead, một cách không cần đầu cơ
