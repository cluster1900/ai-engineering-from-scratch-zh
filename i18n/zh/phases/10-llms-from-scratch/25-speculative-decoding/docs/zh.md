# 投机解码和

> 边境 LLM 生成一个代币 需要对数十亿参数进行一次完整的前进通行.这个前进通行的配置远远超实际需求:大多数时候,一个小得多的模型就能正确猜出接下来的3-5个代币,而大模型只需要 *验证*这个猜测.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## 问题

70B级模型 在H100上的解码吞吐量通常是40-80代币/秒──每个代币都需要一次完整的前进通过,从HBM读取所有模型重量──你不能在不改变输出的情况下缩小模型──你也不能在内存之外继续增加批量尺寸──你卡住了,除非能让模型每次前进通过 输出不止一个代币──

那些自动反叛的世代看起来很自然.`x_{t+1} = sample(p(· | x_{1:t}))`,但这里有机会.如果你有一个廉价预测器说接下来的4个代币很可能是[a,b,c,d],你就可以在**大 model 的单次 forward pass**中检查全部 5个位置,并接受最长匹配前──

通过巧妙的接受/拒绝规则精确实现这一点,该规则保留了目标模型的样本分布――相同的输出分布,速度提升 2-4x――

## 概念

### 双 模式 设置

- **Target model** `M_p`您真正想从中采样大型、缓慢、高质量模型――分布:`p(x)`,我知道.
- **Draft model** `M_q`较低质量的模型.`q(x)`小5-30x.

每一步:

1. 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议 提议`K`个标志:`x_1, x_2, ..., x_K ~ q`,我知道.
2. 针对所有`K+1`个位置并行运行一次前进通行,为每提议代币 生成 `p(x_k)`,我知道.
3. 按下面修改后的拒绝-样本规则从左到右接受/拒绝 每个代币.
4. 如果任意的代币被拒绝,则从修改后的分布中采样替换代代币并停止.`p(· | x_1...x_K)`采样一个奖金标志.

如果草案与目标完全匹配,你每次向前目标可获得K+1个代币.

### 精确性规则

投机解码**在 distribution 上可证明等价于从 p 采样**❖ 拒绝 规则:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

其中`(p - q)+`表示逐点差值的正部──当草案和目标 一致`p ≈ q`)时,接受 接近 1.当它们不一致时,残余分布会被构成,使整个样本仍然精确服从`p`,我知道.

**Greedy 情况。**对于温度=0的样本,只需检查`argmax(p) == x_t`如果是,则接受;如果不是,则输出`argmax(p)`并停止.

### 期望 快速

如果草案模型的代币级接受率是`α`则每次目标前进通行 生成的期望代币数为:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

当 当`α = 0.8, K = 4`其他:`(1 - 0.8^5)/(1 - 0.8) = 3.36`个代币 每次前进. 一次目标前进的成本大约是`cost_q * K + cost_p`(K 个草案步骤加一次目标验证)`cost_p >> cost_q * K`产量增速率就是`3.36× / 1 = 3.36×`,我知道.

唯一真正的参数是`α`完全取决于项目目标的配合.

### 训练草案:蒸

随时的小模型会成为非常差的草案.

1. 选择一个小建筑物 (70B目标对应约1B,7B目标对应约500M)
2. 在大规模文本语料上运行目标模型;存储其下一个代币分布.
3. 使用 KL分歧 训练草案,使其匹配目标的分布,而不是匹配地质真相代币)

结果是:`α`在编码上通常为0.6-0.8,在自然语言聊天上为0.7-0.85──在生产中速度为2-3倍──

### :树木设计+重用特征

李

1. 草案执行 K 个串行步骤,每个都是完整的堆.但是草案可以用最近一次验证中目标的特征 (隐藏状态),因为目标已经计算了丰富的表示,而草案正从头上重新推广它们.
2. 如果草案能输出一个候选人 *树*(每个节点有多个猜测),目标的单次前进通过树注意力面具并行证多条候选人路径,并选择最长的接受分支――

-1 的变化:
- 草案输入 =目标 在位置 t 的最终隐藏状态,而不是原始代币.
- 设计架构 = 1 个变压器解码器层 (不是独立的小模型)
- 输出 = 每个深度 有K = 4-8个候选人,深度为 4-6个树.

加入动态树木拓:在草案不确定位置,树变宽;在草案自信的位置,树保持较窄;在不增加验证成本的情况下提高`α_effective`,我知道.

格尔3 (Li et al. 2025,格尔3:通过训练时间测试扩大大大语言模型的推理加速) 移除了固定的顶层功能依赖性,并使用新的格尔3测试时间模拟损失 训练草案,也就是让在匹配目标测试时间分布的输出上训练,而不是在教师强迫训分配上训练.

### 树木注意力检查

当草案 输出树 时,目标模型 使用 **tree attention mask**在单次向前传递中验证它.树注意力面具是一种因果性面具,它编码树顶层,而不是纯线性结构.每个代币只会到达树中的祖先.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

如果`a, b`是竞争的首位标志候选人,`c, d, e, f`是第二代代码的候选人,那么全部六个位置都能在一次前进通过中被验证.

### 什么时候有效,什么时候无效

**有效：**
- 聊/完成,且文本可预测(代码、常见英语、结构化输出)`α`,我很高兴.
- 阶段有未使用GPU计算的设置(内存绑定阶段) ――树草图 使用可用FLOPs──

**无效 / 没有收益：**
- 高随机性输出 (高温的创意写作)`α`往往`1/|vocab|`下降.
- 非常高的同步率,批量服务,批量已经填满了FLOPs,树验证的空间很小.
- 非常小的目标模型,此时的草案没有小很多.

生产团队通常报告聊天 上有2-3倍的墙钟速度,代码生成 上有 3-5倍,而创意写作上接近零.


```figure
speculative-decoding
```

## 构建它

`code/main.py`其他:

- 一个参考实现`speculative_decode(target, draft, prompt, K, temperature)`实现精确拒绝规则并验证它保留了目标的分布 (经验性KL <0.01对平坦目标样本采集)
- 一个格式树草图,使用顶部的分支构建深度K树.
- 一个树木注意力面具制造商,为验证生成正确的因果模式.
- 一个接受率带,在微小的LM 上运行两者(从GPT-2-中期目标蒸一个GPT-2-小) ⋅

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

## 使用它

- **vLLM**和 **SGLang**提供一等投机解码 支持──旗:`--speculative_model`,我知道.`--num_speculative_tokens`子-2/3 通过`--spec_decoding_algorithm eagle`支持旗
- **NVIDIA TensorRT-LLM**原生支持梅杜萨和树.
- **Reference draft models**其他:`Qwen/Qwen3-0.6B-spec`(用于Qwen3-32B的草案)`meta-llama/Llama-3.2-1B-Instruct-spec`(用于70B的草案)
- **Medusa heads**(Cai et al. 2024,Medusa:简单的LLM推理加速框架与多个解码头):不使用草案模型,而是在目标本身添加K个并行预测头部部署更简单,接受略低于EAGLE。

## 交付它

本课会产出 `outputs/skill-speculative-tuning.md`分析目标模型的工作负载,并选择:草案模型,K(草案长度) 树宽度,温度以及何时倒退到简单的解码.

## 练习

1. 实现精确拒绝 规则并进行实验证――通过`speculative_decode`和平面目标样本分别运行10K样本;计算两个输出分布之间的电视距离――应小于0.01――

2. 计算速度公式――给定定 `α`和 `K`图绘制每次目标前进的期望代币 数量――找出 α ∈ {0.5, 0.7, 0.9} 时的最佳 K──

3. 训练一个小的草案──取一个124MGPT-2目标,并使用100M代币上使用KL损失蒸一个30MGPT-2草案──测量持久的文本上的`α`◎预期:0.6-0.7─

4. 实现树式草图――不要使用链,而是让草图在每个深度输出前三个分支――构建树的注意力面具――验证目标 接受最长正确的分支――

5. 测量失败模式──在温度=1.5(高随机性) 下运行推测解码──展示 α 崩,并且由于草案的上费,该算法比简单的解码更慢──

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

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) 精确的拒绝 规则和理论加速 分析
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) DeepMind 的同时投机性采样论文
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774)模拟草案的平行标题 替代方案
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077)重用功能 和树木草图
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) 动态树木拓
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840)火车时间测试时间匹配
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) 雅可比/lookhead解码,一种不需要投机者的替代方案
