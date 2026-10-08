# Mô hình hóa phần thưởng & RLHF

> Người ta không thể tạo ra một ứng dụng trợ lý tốt, nhưng họ có thể so sánh hai ứng dụng, và chọn một ứng dụng tốt hơn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 05 (Sentiment), Phase 9 · 08 (PPO)
**Time:** ~45 分钟

## 问题

Bạn đã sử dụng mục tiêu dự đoán biểu tượng tiếp theo  đào tạo một mô hình ngôn ngữ  Nó có thể viết ra ngữ pháp chính xác của tiếng Anh  Nó cũng sẽ nói dối , và từ chối từ chối  Bạn không thể vượt qua nhiều hơn đào tạo 修复 điều này  văn bản web là vấn đề, không phải là giải pháp

Bạn muốn một * 标量奖励*, biểu hiện đối với lệnh X, phản ứng A so với phản ứng B 更好── viết tay chức năng thưởng này là không thể.

RLHF(Christiano et al. 2017; Ouyang et al. 2022) đưa các sở thích 转换 thành mô hình phần thưởng, sau đó sử dụng PPO  nhắm vào phần thưởng 优化 LM。分三步:SFT → RM → PPO。 đây là sự phối hợp của ChatGPT、Claude、Gemini 以及所有其他所有的配配方-LLM。

Đến năm 2026, PPO sẽ được DPO thay thế bởi vì nó rẻ hơn, và đối với việc điều chỉnh sắp xếp sẽ gần như tốt hơn. Nhưng * mô hình phần thưởng* vẫn còn hỗ trợ cho mỗi mẫu tốt nhất của N, mỗi RL từ các hệ thống xác minh được, cũng như mô hình lý luận của mỗi mô hình phần thưởng sử dụng quy trình.

## 概念

![Three-stage RLHF: SFT, RM training on pairwise prefs, PPO with KL penalty](../assets/rlhf.svg)

**Stage 1：Supervised Fine-Tuning（SFT）。**Từ mô hình cơ bản được đào tạo trước 开始──在目标行为的人类编写演示 上细调(làm theo hướng dẫn phản ứng、 hữu ích câu trả lời等)`π_SFT`mô hình, nó * hướng đến hành vi tốt*, nhưng vẫn có không gian hành động không giới hạn.

**Stage 2：Reward Model training。**

- 收集对提示 `x`của các cặp phản ứng `(y_+, y_-)`,由人类标注为y_+ 优于 y_-。
- Mô hình phần thưởng tập luyện`R_φ(x, y)`, cho nó đi .`y_+`分配更高分数──
- Lối mất:**Bradley-Terry pairwise logistic**- Có thể là:

  `L(φ) = -E[ log σ(R_φ(x, y_+) - R_φ(x, y_-)) ]`

  σ 是 sigmoid──reward 的差值隐含偏好 的 log-odds──BT kể từ năm 1952 ((Bradley-Terry) kể từ đó luôn là phương pháp tiêu chuẩn, cũng là chủ yếu trong RLHF hiện đại──

- `R_φ`Thông thường bắt đầu từ mô hình SFT, và trên cùng thêm một đầu scalar.

**Stage 3：带 KL penalty、针对 RM 的 PPO。**

- Từ `π_SFT`Chính sách đào tạo bắt đầu`π_θ`                                                                                                                                                                                                                                                              `π_ref = π_SFT`
- Phản ứng `y`Kết thúc của phần thưởng:

  `r_total(x, y) = R_φ(x, y) - β · KL(π_θ(·|x) || π_ref(·|x))`

  KL phạt 防止 `π_θ`任意漂离 `π_SFT` Nó là một *regularizer*, không phải là vùng tin tưởng cứng性。`β`Thường là `0.01`- Tôi không biết.`0.05`
- Sử dụng phần thưởng này 运行 PPO(Dạy 08)。Â Lợi ích trong quỹ đạo cấp token 上计算, nhưng RM chỉ cho câu trả lời hoàn chỉnh 打分。

**为什么需要 KL？**Không có nó, Cục Công an sẽ rất vui khi tìm ra chiến lược tấn công phần thưởng.`π_θ`保持在 RM 训练过的多元 附近──它 là đơn vị quay quan trọng nhất trong RLHF──

**2026 状态：**

- **DPO**(Rafailov 2023): đại số hình thức đóng Đặt giai đoạn 2+3 折叠 thành một dữ liệu ưu tiên 上的监督损失──没有 RM,没有 PPO──只需一小部分计算,就能在配线基准上达到相同质量──Phase 10 · 08 会讲──
- **GRPO**(DeepSeek 20242025):PPO của biến thể, sử dụng cơ sở nhóm tương quan thay vì chỉ trích, phần thưởng từ *verifier*(công trình chạy mã / kết hợp câu trả lời toán học), thay vì RM của người được đào tạo.
- **Process reward models（PRMs）：**给部分解决方案 (GROP) 变体 (GROP) 变体)
- **Constitutional AI / RLAIF：**Sử dụng các ưu tiên LLM sinh ra phù hợp, thay vì sử dụng người.


```figure
reward-model
```

##  xây dựng nó

本课使用微型合成的提示和答案,表示为字符串──RM là một điểm số tuyến tính dựa trên túi mã thông báo──没有真实LLM  重要的是管道的*形状*,不是规模──见 `code/main.py`

### Bước 1:Dữ liệu ưu tiên tổng hợp

```python
PROMPTS = ["help me", "answer me", "explain this"]
GOOD_WORDS = {"clear", "specific", "kind", "thorough"}
BAD_WORDS = {"vague", "rude", "wrong", "short"}

def make_pair(rng):
    x = rng.choice(PROMPTS)
    y_good = rng.choice(list(GOOD_WORDS)) + " " + rng.choice(list(GOOD_WORDS))
    y_bad = rng.choice(list(BAD_WORDS)) + " " + rng.choice(list(BAD_WORDS))
    return (x, y_good, y_bad)
```

Trong thực tế RLHF, đây sẽ được đánh dấu bởi người thay thế.`(prompt, preferred_response, rejected_response)` 完全相同.

### Bước 2: Mô hình phần thưởng Bradley-Terry

Điểm số tuyến tính:`R(x, y) = w · bag(y)`❖ đào tạo để giảm thiểu BT mất tích log đôi:

```python
def rm_train_step(w, x, y_pos, y_neg, lr):
    r_pos = dot(w, bag(y_pos))
    r_neg = dot(w, bag(y_neg))
    p = sigmoid(r_pos - r_neg)
    for tok, cnt in bag(y_pos).items():
        w[tok] += lr * (1 - p) * cnt
    for tok, cnt in bag(y_neg).items():
        w[tok] -= lr * (1 - p) * cnt
```

Sau vài trăm lần cập nhật,`w`Tôi sẽ cho các mã thông báo từ tốt chia sẻ quyền lực chính xác, cho mã thông báo từ xấu chia sẻ quyền lực tiêu cực.

### Bước 3: Chính sách giống như PPO trên RM 之

Chính sách đồ chơi của chúng tôi sẽ tạo ra một token từ từ vựng. Chúng tôi sử dụng RM để cung cấp cho token này.`log π_θ(token | prompt)`, thêm KL-to-reference phạt,并应用 cắt giảm PPO thay thế.

```python
def rlhf_step(theta, ref, w, prompt, rng, eps=0.2, beta=0.1, lr=0.05):
    logits_theta = policy_logits(theta, prompt)
    probs = softmax(logits_theta)
    token = sample(probs, rng)
    logits_ref = policy_logits(ref, prompt)
    probs_ref = softmax(logits_ref)
    reward = dot(w, bag([token])) - beta * kl(probs, probs_ref)
    # 在 theta 上做 ppo-style update，把 reward 当作 return
    ...
```

### Bước 4: Monitor KL

Mỗi lần cập nhật theo dõi nghĩa là`KL(π_θ || π_ref)`Nếu nó trượt qua`~5-10`, chính sách 已漂离 `π_SFT`很远  thấp hơn `β`Có phải sự tấn công phần thưởng đang tăng lên hay bắt đầu không?

### Bước 5: Sử dụng công thức sản xuất của TRL

Nghĩ đường ống đồ chơi 后, 下面是同一循环作为真实图书馆用户的写法──Hugging Face 的 [TRL](https://huggingface.co/docs/trl) Bước 2 用`RewardTrainer`,Gia đoạn 3 dùng`PPOTrainer`(内置 KL- để tham chiếu)

```python
# Stage 2：来自 pairwise preferences 的 reward model
from trl import RewardTrainer, RewardConfig
from transformers import AutoModelForSequenceClassification, AutoTokenizer

tok = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
rm = AutoModelForSequenceClassification.from_pretrained(
    "meta-llama/Llama-3.1-8B-Instruct", num_labels=1
)

# dataset rows: {"prompt", "chosen", "rejected"} — Bradley-Terry format
trainer = RewardTrainer(
    model=rm,
    tokenizer=tok,
    train_dataset=preference_data,
    args=RewardConfig(output_dir="./rm", num_train_epochs=1, learning_rate=1e-5),
)
trainer.train()
```

```python
# Stage 3：针对 RM 的 PPO，并对 SFT reference 加 KL penalty
from trl import PPOTrainer, PPOConfig, AutoModelForCausalLMWithValueHead

policy = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")
ref    = AutoModelForCausalLMWithValueHead.from_pretrained("./sft-checkpoint")  # frozen

ppo = PPOTrainer(
    config=PPOConfig(learning_rate=1.41e-5, batch_size=64, init_kl_coef=0.05,
                     target_kl=6.0, adap_kl_ctrl=True),
    model=policy, ref_model=ref, tokenizer=tok,
)

for batch in dataloader:
    responses = ppo.generate(batch["query_ids"], max_new_tokens=128)
    rewards   = rm(torch.cat([batch["query_ids"], responses], dim=-1)).logits[:, 0]
    stats     = ppo.step(batch["query_ids"], responses, rewards)
    # stats 包含：mean_kl、clip_frac、value_loss — 三个 PPO diagnostics
```

Thư viện sẽ thay cho em làm ba việc.`adap_kl_ctrl=True`实现 adaptive-β schedule: nếu quan sát thấy KL 超过 `target_kl`,β 翻倍; Nếu thấp hơn một nửa,β 减半.`policy`共享参数──Tổng giá trị và chính sách 位于同一个脊柱上(`AutoModelForCausalLMWithValueHead`Ứng viên của TRL sẽ được phân biệt báo cáo`policy/kl`和 `value/loss`

## 陷

- **Over-optimization / reward hacking。**RM không hoàn hảo;`π_θ`Sẽ tìm thấy điểm số cao nhưng chất lượng khác nhau hoàn thành đối thủ.`β`、拓宽 RM dữ liệu đào tạo
- **Length hacking。**Trong các câu trả lời hữu ích 上训练的RMs 往往隐式奖励 长度──Politics 学会填充答案──补救:người trả lời bình thường hóa chiều dài,或使用RLAIF của RMs nhận thức chiều dài──
- **RM 太小。**RM ít nhất cần và chính sách như vậy lớn.
- **KL tuning。**B. quá thấp → drift 和 thưởng hackềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnềnền
- **Preference-data noise。**Khoảng 30% nhãn của con người có tiếng ồn hoặc mờ mờ.
- **Off-policy problems。**Dữ liệu PPO trong thời đại thứ nhất 后会略略脱政策──像课08 那样监控 clip fraction──

## Sử dụng nó

RLHF năm 2026 là:

| Layer | Target | Method |
|-------|--------|--------|
| Instruction following, helpfulness, harmlessness | Alignment | DPO（Phase 10 · 08）优于 RLHF-PPO。 |
| Reasoning correctness（math, code） | Capability | 使用 verifier reward 的 GRPO（Phase 9 · 12）。 |
| Long-horizon multi-step tasks | Agentic | 在 steps 上使用 process reward models 的 PPO / GRPO。 |
| Safety / refusal behavior | Safety | RLHF-PPO with separate safety RM，或 Constitutional AI。 |
| Best-of-N at inference | Fast alignment | 在 decode time 使用 RM；不需要 policy training。 |
| Reward distillation | Inference compute | 在 frozen LM 顶部训练一个小的 “reward head”。 |

RLHF là phương pháp* của năm 20222024 ── đến năm 2026, sản xuất đường ống khớp bằng DPO-đầu tiên, PPO chỉ được sử dụng trong các bước cao RM hoặc quan trọng về an toàn.

## 交付 nó

保存为 `outputs/skill-rlhf-architect.md`- Có thể là:

```markdown
---
name: rlhf-architect
description: 为 language model 设计 RLHF / DPO / GRPO alignment pipeline，包括 RM、KL 和 data strategy。
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

给定一个 base LM、一个目标行为（alignment / reasoning / refusal / agent），以及 preference 或 verifier budget，输出：

1. Stage。SFT？RM？DPO？GRPO？并给出理由。
2. Preference or verifier source。Humans、AI feedback、rule-based、unit-test-pass 或 reward distillation。
3. KL strategy。Fixed β、adaptive β 或 DPO（implicit KL）。
4. Diagnostics。Mean KL、reward stability、over-optimization guard（holdout human eval）。
5. Safety gate。Red-team set、refusal rate、与 helpfulness RM 分开的 safety RM。

拒绝在没有 KL monitor 的情况下交付 RLHF-PPO。拒绝使用小于 target policy 的 RM。拒绝 length-only rewards。把任何没有留出 blind human-eval set 的 pipeline 标记为缺少 over-optimization protection。
```

## 练习

1. **简单。**Trong `code/main.py`Trung sử dụng 500 cặp ưu tiên tổng hợp  luyện tập mô hình thưởng Bradley-Terry ⋅ trong 100 cặp ⋅ trong việc đo lường chính xác cặp ⋅ nên vượt quá 90% ⋅
2. **中等。**Sử dụng `β ∈ {0.0, 0.1, 1.0}`运行 đồ chơi PPO-RLHF vòng. đối với mỗi giá trị, vẽ điểm số RM so với KL-to-reference trên cập nhật.
3. **困难。**Trong cùng một số dữ liệu ưu tiên trên thực hiện DPO (closed-form preference-probability loss),并与RLHF-PPO pipeline 在使用的计算和达到最终RM score 上对比──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| RLHF | "Alignment RL" | 三阶段 SFT + RM + PPO pipeline（Christiano 2017, Ouyang 2022）。 |
| Reward Model (RM) | "The scoring net" | 通过 Bradley-Terry 拟合 pairwise preferences 学到的 scalar function。 |
| Bradley-Terry | "Pairwise logistic loss" | `P(y_+ ≻ y_-) = σ(R(y_+) - R(y_-))`；标准 RM objective。 |
| KL penalty | "Stay near the reference" | reward 中的 `β · KL(π_θ \|\| π_ref)`；anti-reward-hacking regularizer。 |
| Reward hacking | "Goodhart's law" | Policy 利用 RM 缺陷；症状：reward 上升，human eval 持平。 |
| RLAIF | "AI-labeled preferences" | 标签来自另一个 LM 而非人类的 RLHF。 |
| PRM | "Process Reward Model" | 给 partial reasoning steps 打分；用于 reasoning pipelines。 |
| Constitutional AI | "Anthropic's method" | 由显式规则引导的 AI-generated preferences。 |

## 延伸阅读

- [Christiano et al. (2017). Deep Reinforcement Learning from Human Preferences](https://arxiv.org/abs/1706.03741) 开创 RLHF 的论文──
- [Ouyang et al. (2022). InstructGPT — Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155) ChatGPT 背后配方──
- [Stiennon et al. (2020). Learning to summarize with human feedback](https://arxiv.org/abs/2009.01325) 更早用于 tổng kết RLHF。
- [Rafailov et al. (2023). Direct Preference Optimization](https://arxiv.org/abs/2305.18290) DPO;2026 năm sau RLHF 的默认方法──
- [Bai et al. (2022). Constitutional AI: Harmlessness from AI Feedback](https://arxiv.org/abs/2212.08073) RLAIF 和 tự phê bình vòng.
- [Anthropic RLHF paper (Bai et al. 2022). Training a Helpful and Harmless Assistant](https://arxiv.org/abs/2204.05862) HH 论文。
- [Hugging Face TRL library](https://huggingface.co/docs/trl) 生产级 `RewardTrainer`和 `PPOTrainer`❖ đọc nguồn huấn luyện viên, hiểu thích ứng-KL 和 giá trị đầu 细节。
- [Hugging Face — Illustrating Reinforcement Learning from Human Feedback](https://huggingface.co/blog/rlhf)bởi Lambert, Castricato, von Werra, Havrilla  带图解的三阶段管道 经典 walkthrough。
- [von Werra et al. (2020). TRL: Transformer Reinforcement Learning](https://github.com/huggingface/trl) thư viện;`examples/`Có mặt hướng tới Llama、Mistral 和 Qwen của cuối đến cuối RLHF kịch bản.
- [Sutton & Barto (2018). Ch. 17.4 — Designing Reward Signals](http://incompleteideas.net/book/RLbook2020.pdf) giả thuyết phần thưởng 视角;思考 reward hacking 的必要前置知识──
