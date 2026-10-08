# 预测解码 草案、验证、重复

> 推断解码是串行的. 每个代币都需要等待前一个代币. 推测解码打破了这个链条:一个便宜的模型先起草N个代币,昂贵的模型在一次前进通行中验证全部N个代币. 当起草正确时,你用一次大前进就完成了N次生成.

**Type:** Build
**Languages:** Python
**先修要求:**阶段 7 · 07 (GPT因果性LM),阶段 7 · 12 (KV缓存和闪光注意力)
**Time:** ~60 minutes

## 问题

一个70B LLM 在H100上采用一个代币需要约30ms──一个3B草案模型需要约3ms──如果让3B草案提前生成5个代币,然后让70B*只运行一次*来验证这5个代币,总耗时就是`5×3 + 30 = 45 ms`需要最多可接受5个代币;`5×30 = 150 ms`,这是一个投机解码的完整卖点:使用少量额外的GPU内存 (图案模型) 换取24×更低的解码延迟.

关键在于必须保留分布――Leviathan等 (2023) 以及陈等 同期提出的投机样本保证输出序列与大模型单独生成时的分布**完全相同**没有质量折中.

到2026年,四类的草案验证器组合主导推断:

1. **Vanilla speculative (Leviathan 2023)。**独立草案模型 (例如Llama 3 1B) +验证器 (例如Llama 3 70B) 👇
2. **Medusa (Cai 2024)。**在验证器上添加多个解码头,并行预测位置 `t+1..t+k`△不需要独立的草案模型──
3. **EAGLE family (Li 2024, 2025)。**复用验证器隐藏状态的轻量草案;接受率比尼拉更接近;典型为34×。
4. **Lookahead decoding (Fu 2024)。**完全不需要草案模型――自主推测――小众但没有依赖――

2026年每一个生产级推断堆都默认提供了投机解码──vLLM、TensorRT-LLM、SGLang 和 llama.cpp 至少都支持尼拉+EGLE-2──

## 核心概念

### 核心算法

给定一个验证器`M_q`和一个更便宜的草案`M_p`其他:

1. 让`x_1..x_k`为已经解码的前──
2. **Draft**使用`M_p`提议 `d_{k+1}, d_{k+2}, ..., d_{k+N}`应对概率草案为`p_1..p_N`,我知道.
3. **并行 verify**在`x_1..x_k, d_{k+1}, ..., d_{k+N}`上运行一次`M_q`得到位置`k+1..k+N+1`的验证器概率`q_1..q_{N+1}`,我知道.
4. **从左到右 accept/reject 每个 draft token**对于每个人都`i`概率`min(1, q_i(d_i) / p_i(d_i))`接受
5. 在位置`j`第一次拒绝时:从归化后的"残余"分布`(q_j - p_j)_+`中采样 `t_j`,我知道.`j`之后所有的草案都被丢弃了.
6. 如果全部`N`个都被接受:从 `q_{N+1}`采样一个额外的标志`t_{N+1}`没有任何其他奖金.

剩余分布 这个技巧是让输出分布与`M_q`从头样式完全一致的数学洞见.

### 什么决定加速

让`α`= 每个项目代币的预期接受率――令`c`= 草案与验证人成本比率──每一步中:

- 每个代币都需要一个大型号的电话.
- 当 当`α`很高时,每一个推测`(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)`个代币需要一个大型号的电话.

在`α = 0.75`且`N = 5`时,典型的经验法则是:大型调用 减少3×──草案成本是5×便宜──总体墙钟 约下降2.5×──

**α 取决于：**

- 根据研究人员的数据, 调查人员的近似性将显著提高.
- 解码策略――贪的草案对贪的验证器:α 高――温度采样:更难匹配;接受 下降――
- 任务类型──代码和结构化输出 接受更多(更可预测);自由形式创意写作接受更少──

### 梅杜萨  没有草案模型的草案

梅杜萨 用验证器 上的额外输出头 替代草案模型.`t`其他:

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

每个头发输出自己的逻辑. 推理时,你从每个头发采样得到候选序列,然后使用一次前进通过和树注意方案 同时考虑所有候选人继续来验证.

优点:没有第二个模型――缺点:增加可训练的参数;需要一个监督的细节调整阶段(约1B代币);接受率比使用优秀草案的尼拉投机略低――

###  通过复用隐藏状态获得更好的草案

 EAGLE-1/2/3 (Li等, 20242025) 将草案模型设计为一个很小的变压器 (通常是1层),输入验证器的最后层隐藏状态.

-3 (2025) 加入了候选人继续的树搜索.

### 曲舞蹈

验证会将`N`个草案代币在一次前进通行中给验证器. 这将把验证器的KV缓存扩展.`N`项──如果某些草案被拒绝,你必须把缓存回滚到已接受的前的长度──

生产实现`--speculative-model`、TensorRT-LLM的LookaheadDecoder) 通过划开KV缓冲器处理这个事物──先写入,接受时再提交──概念上不难,但细节很繁──


```figure
draft-verify-tokens
```

## 构建它

见`code/main.py`我们使用以下组件实现核心投机性采样算法:

- 一个"大模型",它是在手写分布上的确定性-软max (这样可以解析验证接受数学的) .
- 它们是个"草稿模型",它是大模型的动作版本.
- 一个接受/拒绝循环,产生与直接采样相等的边际分布.

### 步骤1:拒绝步骤

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u`是一个统一的随机数字.`q_prob`是对起草的代币的概率的验证者.`p_prob`是草案模型的概率――利维雅坦定理指出,这个伯努利决定加上拒绝时从残余采样,可以严格保留验证器的分布――

### 步骤2:残余分配

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

个元素从`q`中减去`p`任何拒绝都从这里采样.

### 步骤3:一个投机步骤

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

### 步骤4:测量接受率

在不同质量的草案中 水平下运行 10,000 个投机步骤――绘制接受率与草案和验证器之间的分布 KL差异关系――你应该看到清晰的单调关系――

### 步骤5:验证分布等价性

经验证:投机循环 生成的标志直方图应直接与验证器采样得到的直方图相匹配.

## 使用它

产量:

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

截至2026年中,TensorRT-LLM拥有最快的梅杜萨路径──`faster-whisper`为语大封装了带小草图的猜测解码.

**选择 draft：**

| Strategy | 何时选择 | Speedup |
|----------|--------------|---------|
| Vanilla draft (1B/3B Llama family) | 快速 prototype，无需 training | 1.8–2.3× |
| Medusa heads | 你可以 fine-tune verifier | 2–3× |
| EAGLE-2 / 3 | Production，最高速度 | 3–4× |
| Lookahead | 无 draft、无 training、无额外 params | 1.3–1.6× |

**什么时候不要 spec-decode：**

- 仅生成15个代币的单次序列生成.
- 极具创意 / 高温采样 (α 会下降) ⋅
- 基于存储量限制的部署 (图案模型 会增加VRAM)

## 交付它

见`outputs/skill-spec-decode-picker.md`△这个技能 会为新的推断工作负载 选择一种投机解码策略 (尼拉/梅杜萨/鱼/头) 以及调节参数 (N、草稿温度) △

## 练习

1. **Easy。**运行`code/main.py`△确认在50,000个代币上,投机代币分布与验证器的直接样本分布匹配,且图为p >0.05──
2. **Medium。**对于`α = 0.5, 0.7, 0.85`绘制速度 随着每次大模型的前进的代币数量`N`变化,找出每个 α 的优势`N`〔(提示:每次验证电话的期望`(1 - α^{N+1}) / (1 - α)`〔一〕
3. **Hard。**实现一个小梅杜萨:取14课的结石GPT,添加3个额外的LM头,分别预测位置 t+2、t+3、t+4──在小小片上使用联合多头损失训练──与通过截断同一个模型得到的尼拉草稿比较接受率──
4. **Hard。**实现滚动:从一个10代标前KV缓存 开始,入5个草案代标,模拟在位置3拒绝――验证下一轮代时你的缓存 读取结果正确匹配"前+第一两个被接受的草案"――

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

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) 核心算法与等效定理
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) 同期提出;清晰的伯诺利拒绝证明.
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774)梅杜萨论文;树注意验证.
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077)-1;基于隐藏状态条件的草案
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858)-2;动态树深度
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840)3
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057)看头,无草案方法.
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html) 连接了所有四种策略的标准生产参考.
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE)                     
