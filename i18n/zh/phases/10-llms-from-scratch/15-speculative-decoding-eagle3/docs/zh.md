# 预测解码和3

> 第7阶段 · 第16课证明了数学:Leviathan 拒绝规则会精确确保留验证器的分布. 本课从训练视角审视 2026年生产级 投机解码.EAGLE-3将从廉价近似变成专门设计的微型网络,它基于验证器本身的隐藏状态进行训练,并加入训练时间测试循环,使训练分布和推理分布对齐.结果:端到端速度提高3×到6.5×,聊天场景中每个代币接受率超过0.9,并且没有分布层取舍.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 7 · 16（speculative decoding math），Phase 10 · 12（inference optimization）
**Time:** ~75 minutes

## 学习目标
- 用一句话表述利维亚坦定理,并证明投机循环 生成的样本与验证器分布完全一致.
- 理从尼拉特征解码 (Leviathan 2023) 到Eagle、Eagle-2 和Eagle-3的两年发展,并指出移除每一步的确切限制.
- 根据接受率`α`和 草案到验证人 成本比 `c`计算期望加速,并为每种制度 选择最优的草案 长度 `N`,我知道.
- 从零实现完整的投机循环:从草案,验证,从残余中拒绝样本,在拒绝时回滚KV缓存,在完全接受时输出奖金代币.

## 问题
在70B模型上进行自动降解码,在H100上可能只有每秒35个代币――GPU 远未和―― 存储带宽才是上限:每个代币都需要从HBM加载70B权重,执行一步算术,然后生成一个浮游.计算单元大部分时间都处于空状态――

投机解码将会转化为一个真正可解的吞吐问题.`N`下一篇: 提出的`N`个标志――验证器在前加上所有`N`个草案 上运行一次. 如果验证器在位置.`i`分布与草案 一致 (以我们将精确确定义的统计意义),就接受;否则拒绝,并从残余分布中采用一个修正.`N+1`个被接受的标志,而不是一个.

关键定理来自Leviathan,Kalman,Matias (ICML 2023):输出分布与直接从验证器采样得到的分布完全一致──不是近似一致──是完全一致──这是投机解码在生产中被接受的全部原因:它是纯延迟优化,没有质量取舍──

阶段 7 · 第16课给你是数学――本课给你是训练――一个好的草案 带来的加速价值比廉价的草案 高2×──EAGLE、EAGLE-2 和EAGLE-3 (Li等, 20242025) 将草案 = 同一模型的小版本转化为一门精确的工程学科――2026年的生产推理服务器默认使用EAGLE-3──

## 概念
### 不变量: 利维亚坦排放样本

让`p(t)`表示在某个前下草图对下一个标志的分布,`q(t)`表示验证器的分布.`d ~ p`△以概率`min(1, q(d) / p(d))`接受.若拒绝,则从残余分布中`(q - p)_+ / ||(q - p)_+||_1`结果,我们会看到一个问题.`q`无论如何`p`多差,这都成立;越差就越常拒绝,但输出仍然精确.

让我`N`接下来,使用一次验证器进行处理`prefix + d_1 + ... + d_N`△验证器会同时回归`q_1, q_2, ..., q_{N+1}`从左到右遍历.`j`第一次拒绝时,从`residual(q_j, p_j)`采样并停止.`q_{N+1}`作为一个奖金代币.

### 什么决定了加速

让`α`为每一个草案的代币的预期接受率.`c = cost(draft) / cost(verifier)`为成本比比. 每次验证器前期的期望接受代币 数为:

```
E[accepted] = (1 - α^(N+1)) / (1 - α)
```

每个接受代币的期望总墙时间是`(N * c + 1) / E[accepted]`相对于`N`最小的,就能得到最好的点.`α = 0.8, c = 0.05`最优的`N`速度大约是57,加速为3.2×.`α = 0.95, c = 0.02`最优的`N`速度大约是810个,加速接近5x.

最大的杆是`α`在固定`N = 5`时,从`α = 0.6`提升到`α = 0.9`通过使用同一个验证器,吞吐几乎翻了一番.

### 两年来的进展

**Vanilla speculative (Leviathan, 2023).**简单的模拟是同一家庭独立训练的较小的LLM.`α ≈ 0.6`现在,最好只有2倍加快.

**EAGLE-1 (Li et al., 2024).**草案是一个微型变压器,通常为一到两层,它以验证器的最后层隐藏状态作为输入并直接预测下一个代币.`α`升到0.70.8

**EAGLE-2 (Li et al., 2024).**加入动态草案树:不是提出单条包含 `N`个标志的序列,而是提出一个小候选树,用一次验证器向前注) 树注意) 为每个候选人打分,然后沿最高概率路径前进.`α`升至0.85以上.

**EAGLE-3 (Li et al., 2025, NeurIPS).**另外做了两项改动.第一,完全消除了功能预测损失:EAGLE-1/2 训练草案 去匹配验证器的隐藏状态,这限制了更多数据能带来的收益.第二,基于代币预测的直接测试 (TTT):在草案训练期间,将自前预测作为输入反到后续多个步骤,与推测时运行方式一致.

### 转换KV缓存

验证会在一次通过中将验证器的KV缓存扩展`N`个条目――如果在位置`j`发生拒绝,那么位置`j-1`后的缓存内容就是错误的.常见实现有两种:写入划分缓冲并在接受时提交.

对于EAGLE-2树搜索,验证器会使用尊重树拓的非因果化面具 运行 注意.工程上细节繁,但计算本质上是一次带着定制面具的标准闪光注意.调用.

### 2026年建筑草案

| Strategy | Draft type | `α` | Speedup | Training cost |
|----------|-----------|-----|---------|---------------|
| Vanilla | 独立小型 LLM | 0.55-0.70 | 1.8-2.3× | 无（复用现有小模型） |
| Medusa | 验证器上的额外 LM heads | 0.65-0.75 | 2-3× | ~1B SFT tokens |
| EAGLE-1 | hidden states 上的 1-layer transformer | 0.70-0.80 | 2.5-3× | ~60B tokens |
| EAGLE-2 | EAGLE-1 + dynamic draft tree | 0.80-0.88 | 3-4× | ~60B tokens |
| EAGLE-3 | Multi-layer feature fusion + TTT | 0.88-0.92 | 3.5-6.5× | ~60-200B tokens |
| Lookahead | 无 draft（Jacobi iteration） | N/A | 1.3-1.6× | 无 |

2026年生产环境:vLLM 和 SGLang 在可用时默认使用EAGLE-3,否则使用EAGLE-2──TensorRT-LLM 为 Meta 和 NVIDIA 公开模型提供最快的梅杜萨路径──llama.cpp 为 CPU 部署提供尼拉草案──


```figure
l5-spec-decode-eagle
```

## 构建它
见`code/main.py`△这是一个完整的利维亚坦投机循环,包含所有组成部分:N的草案,验证器并行通过,`q`采样一致的经验检查

### 步骤1:拒绝规则

```python
def accept(q_prob, p_prob, u):
    if p_prob <= 0:
        return True
    return u < min(1.0, q_prob / p_prob)
```

### 步骤2:残余分布

```python
def residual(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    if s == 0:
        return list(q)
    return [r / s for r in raw]
```

### 步骤3:一个完全的投机步骤

`spec_step`函数从`p`草案`N`个标志,然后在一次并行`q`评估中验证它们──它将对每一个草案的代币 应用拒绝规则,并在第一次拒绝时从残余中采样修改──如果全部接受,则从`q_{N+1}`输出一个奖金代币.

### 步骤4:KV回转账

模拟器会为每个工人跟踪逻辑`kv_length`接受`k`个草案 时,`kv_length += k`在位置`j`拒绝发生时,缓存已经写了`j`虽然,但逻辑长度会被设置为`prefix_length + j + 1`后续读取将截至逻辑长度.

### 步骤5: 利维亚坦检查

运行50,000个投机步骤――统计被接受的代币的经验分布――与从`q`直接采样50,000次进行比较.

### 步骤 6: 加速与 α

通过不同幅度的扰动`p`让其偏离`q`扫描草案质量,测量`α`然后画不同.`α`和 `N`下每次验证器调用期望代码会印一张表,展示EAGLE-3级的草案质量(`α ≈ 0.9`) 如何解锁每次验证器调用45个代币.

## 使用它
使用Eagle-3的生产级`vllm serve`其他:

```bash
vllm serve meta-llama/Llama-3.3-70B-Instruct \
  --speculative-config '{
    "model": "yuhuili/EAGLE3-LLaMA3.3-Instruct-70B",
    "num_speculative_tokens": 5,
    "method": "eagle3"
  }'
```

在H100上 64批使用EAGLE-3的SGLang:根据EAGLE-3纸,相比64批的尼拉解码,吞吐大约提升1.38×──

适合使用推测解码的场景:

- 任何p50延迟比峰值吞吐更重要交互式聊天工作负载.
- 代码生成和结构化输出 (JSON、SQL) ⋅因为目标分布高度可预测,`α`超过0.9个.
- 长文本生成 ((数千个代币) 摊销后的加速会持续收益.

不适合的场景:

- 很小的模型(<3B) ――草案并不比验证器便宜太多──
- 极小批量-1 CPU部署――草案模型的内存开销可能不值得――
- 非常高温的创意采样,此时`α`会崩.

## 交付它
本课会生成`outputs/skill-eagle3-tuner.md`△给定一个推理工作负载模型,批量大小,目标延迟,任务配置文件),它会推投机式解码策略和调优参数`N`、树深、温度意识的切换) ⋅

## 练习
1. 运行`code/main.py`确认在5万个样本中,检查中的基平方数量保持低于95%的关键值.

2. 在`α`固定为0.9`c`固定为0.04 时,将`N`从 1 扫描到 10 绘制每次验证器调用期望 标志数和每个标志的实际墙时间`N`△解释曲线形状──

3. 修改代码以模拟EAGLE-2树搜索:每一步中,草案提出形状为`[2, 2, 2]`树 八条候选路径) 验证器运行一次,最高概率的接受路径胜出.计算每一张的 `α`以及每次验证器调用的总代币数量与等价计算量下线性链规格解码对比.

4. 为两个并发序列实现批量KV滚动器模拟器――A序列的所有草案都被接受;B序列在位置2 拒绝――展示每个序列的正确`kv_length`没有浪费工作.

5. 阅读EAGLE-3论文第4节 (训练时间测试) 两句解释为什么没有TTT的天真草案训练会受到暴露偏见,以及为什么在训练中把自己的预测反给它能修复这个问题.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Leviathan rule | “min(1, q 除以 p)” | 以概率 `min(1, q(d)/p(d))` 进行 Bernoulli accept/reject；当 rejection 时从 residual 中采样，可精确保留验证器分布 |
| Residual distribution | “(q 减 p) 的正部，归一化” | `(q - p)_+` 在零处截断并重新归一化，是 rejection 时应采样的正确分布 |
| Acceptance rate α | “draft 对的频率” | 在拒绝规则下，每个 Token 的期望 Bernoulli 成功概率；支配所有加速数学 |
| EAGLE-1 | “hidden-state draft” | 条件化于验证器 last-layer hidden state 的微型 Transformer draft（Li et al., 2024） |
| EAGLE-2 | “dynamic draft tree” | EAGLE-1 加上一棵候选 continuation 树，并在一次验证器 pass 中用 tree attention 打分 |
| EAGLE-3 | “training-time test” | 去掉 feature-prediction loss，基于直接 Token prediction 训练，并在训练时把 draft 自己的输出反馈给它 |
| Training-time test (TTT) | “exposure bias 修复” | 训练时以 autoregressive 方式运行 draft，使训练和测试输入分布匹配，是 scheduled sampling 的直接类比 |
| KV rollback | “撤销被拒绝的 draft” | rejection 后将验证器 KV cache 重置到已接受 prefix 长度的 bookkeeping |
| Bonus token | “免费的那个” | 当全部 `N` 个 draft 都被接受时，以零额外验证器成本从 `q_{N+1}` 额外采样一个 Token |
| Tree attention | “一次验证许多候选” | 使用尊重 draft tree 拓扑的 non-causal mask 的 Attention；在一次 forward pass 中为树中的每个节点计算 `q_i` |

## 延伸阅读
- [Leviathan, Kalman, Matias — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192, ICML 2023)](https://arxiv.org/abs/2211.17192) 基础论文与等价性定理
- [Chen et al. — Accelerating Large Language Model Decoding with Speculative Sampling (arXiv:2302.01318)](https://arxiv.org/abs/2302.01318) 同期独立提出的方法,证明清晰
- [Li et al. — EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty (arXiv:2401.15077)](https://arxiv.org/abs/2401.15077)EAGLE-1,基于隐藏状态条件的草案
- [Li et al. — EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees (arXiv:2406.16858)](https://arxiv.org/abs/2406.16858)动态树木搜索
- [Li et al. — EAGLE-3: Scaling up Inference Acceleration via Training-Time Test (arXiv:2503.01840, NeurIPS 2025)](https://arxiv.org/abs/2503.01840) 2026年生产默认方案
- [Cai et al. — Medusa: Multiple Decoding Heads (arXiv:2401.10774)](https://arxiv.org/abs/2401.10774) 另一种无草案方法
- [vLLM Speculative Decoding documentation](https://docs.vllm.ai/en/latest/features/spec_decode.html) 覆盖所有策略 连接权力生产参考
