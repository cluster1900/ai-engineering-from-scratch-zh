# 专家组合 (MoE)

> 一个密集的70B变压器会为每个代币激活所有参数――一个671B MoE 每个代币只激活37B参数,但在所有基准上胜过它――稀疏性是这个十年最重要的规模化思想――

**Type:** Build
**Languages:** Python
**先修要求:**转换器 (全转换器) 阶段7 · 05 (GPT)
**Time:** ~45 minutes

## 问题

密集变压器在推断时的FLOPs等于其参数(前进通过 乘以 2) ;;扩展一个密集模型 时,每个代币都必须支付完整的计算成本――到2024年,边界已经撞击了计算墙:要显著变得更聪明,你需要每个代币指数级更多的FLOPs――

专家组合 打破了这种关联.`E`个独立专家 + 一个为每个代币 选择 `k`个专家的路由器――总参数 = `E × FFN_size`△每个代币的活跃参数数 = `k × FFN_size`△典型的2026年配置:`E=256`没有任何`k=8`│ 存储随`E`扩展,计算随`k`扩展.

2026年边界 几乎全是MoE:DeepSeek-V3(671B总 / 37B活跃) 、混合 8×22B、Qwen2.5-MoE、Llama 4、Kimi K2、gpt-oss──在人工分析的独立排名榜上,排名第 10 的开源模型全是MoE──

## 概念

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### 转换

密集变压器块:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

门:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

每个专家都是一个独立的FFN (通常是SwiGLU) 路由器是一个单线性层.`k`个专家,并获得它们输出的门口混合物.

### 负载平衡问题

如果路由器让90%的代币经过3个专家,其他专家就会饿死.

1. **Auxiliary load-balancing loss**另外,它可以增加一个超参数和第二个分数信号.
2. **Expert capacity + token dropping**对于每一个专家,`C × N/E`个标志;溢出的标志 跳过这个层――会损害质量――
3. **Auxiliary-loss-free balancing**对于2024年,这是一个重要突破.

深度搜索V3的做法:每一个培训阶段后,对每个专家进行检查,`±γ`微调偏见──选择时使用 `scores + bias`△用于关门的专家概率 仍然使用未修改的原始`scores`,这将与表达方式进行路由.

### 共同的专家

通过顶级选项,共享专家获取通用知识,负责专业化,运行1名共享专家,加上256名路由专家中排名第8的专家.

### 精细粮食专家

经典的MOE(GShard、Switch): 每个专家和完整的FFN 一样宽──`E`较小(8-64),`k`较小(1-2) 』

现代细粒度MoE(深度搜索V3、Qwen-MoE):每个专家更窄(1/8FFN大小)`E`很大(256+),`k`更大(8+) △总参数相同,但组合数量扩展快得多。`C(256, 8) = 400 trillion`种可能的每一个代币 专家 质量提升,延迟 保持不变

### 成本图片

每个标志,每一个层:

| Config | Active params / token | Total params |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (dense) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

查V3在几乎所有基准上都胜过Llama370B的密度),同时**每个 Token 使用更少的活跃 FLOPs**更多参数 = 更多知识. 更多活跃FLOP.

### 代价:记忆

无论哪些专家被触发,所有专家都必须留在GPU上. 一个671B模型需要约1.3TB的VRAM来存储fp16重量.


```figure
expert-routing
```

## 构建它

参见`code/main.py`△一个使用纯体质的紧密MoE层,包括:

- `n_experts=8`个近似的SwiGLU的专家 (为了说明,每个只有一个线性)
- 顶级k=2路由
- 软max正常化的门重量
- 通过专家偏见 实现无损补助平衡

### 步骤1:路由器

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

这就是DeepSeek-V3的技巧:在不引导模型预测的情况下修改负载不平衡.

### 步骤 2:让100个代币通过路由器

随着哪些专家被触发以及触发频率.`-γ`没有使用`+γ`后,使用率将在几代人内收到平均分布.

### 步骤3:参数对比

打印一个MoE配置的密度相当──DeepSeek-V3 形状:256路由 + 1共享,8活跃,d_model=7168──总参数非常惊人──活跃参数只有密度Llama 3 70B的七分之一──

## 使用它

拥抱脸 加载:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

2026年生产推断:vLLM 原生支持MoE路由──SGLang 拥有最快的专家平行路径──二者都会自动处理顶级选项和专家平行性──

**何时选择 MoE：**
- 您希望以更低的每代币推断成本获得边界质量.
- 你拥有VRAM/专家并行基础设施.
- 你的工作量是代币重的,而不是文本重的,长文档.

**何时不要选择 MoE：**
- 边缘部署:你会为任何活跃的FLOP支付完整的存储成本.
- 专家路由会增加总费――
- 小模型(<7B):MOE的质量优势只会在超过某个计算门之后出现.

## 交付它

参见`outputs/skill-moe-configurator.md`△该技能会根据参数预算,培训代币和部署目标,为新的MOE 选择E、k 和共享专家布局.

## 练习

1. **Easy.**运行`code/main.py`〔观察辅助免损失偏见更新 如何在50次代中拉平专家使用〕
2. **Medium.**用基于哈希的路由器 (确定性无需学习) 替换学习路由器――比较质量和平衡――为什么学习路由器更好?
3. **Hard.**实现GRPO式推出匹配路由(DeepSeek-V3.2 技巧):记录推断 期间哪些专家被触发,在 Gradient 计算期间强制使用相同的路由──在一个玩具政策-gradient设置 上测量效果──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------|----------|
| Expert | “众多 FFN 中的一个” | 一个独立 feed-forward network；参数专用于 FFN 计算中的一个稀疏切片。 |
| Router | “gate” | 一个很小的 linear layer，用来为每个 Token 对每个 expert 打分；执行 top-k selection。 |
| Top-k routing | “每个 Token 有 k 个 active experts” | 每个 Token 的 FFN 计算恰好经过 k 个 experts，并由 gate 加权。 |
| Auxiliary loss | “Load-balance penalty” | 一个额外 Loss term，用来惩罚偏斜的 expert usage。 |
| Auxiliary-loss-free | “DeepSeek-V3 的技巧” | 只在 router 的 selection 上通过 per-expert bias 实现 balance；没有额外 Gradient。 |
| Shared expert | “Always on” | 每个 Token 都会经过的额外 expert；捕获通用知识。 |
| Expert parallelism | “按 expert 分片” | 将不同 experts 分配到不同 GPUs；通过网络 route tokens。 |
| Sparsity | “active params < total params” | 比率 `k × expert_size / (E × expert_size)`；DeepSeek-V3 为 37/671 ≈ 5.5%。 |

## 延伸阅读

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538)这个思想的来源.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) 换,经典的.
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088)混合物 8×7B。
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) MLA + 无损辅助MoE + MTP──
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664) 基于偏见的平衡论文
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) 本课路由器 使用的细粒度+共享专家分区──
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) 最早的共享专家论文
