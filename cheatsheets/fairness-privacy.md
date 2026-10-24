---
id: fairness-privacy
title: Bias, Fairness and Differential Privacy
code: BF
subtitle: 度量偏差、选择公平性标准、用 DP-SGD 训练并审计隐私声明。标准库 Python 玩具代码。
hue: 285
sources: phases/18-ethics-safety-alignment/20-bias-representational-harm, phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual, phases/18-ethics-safety-alignment/22-differential-privacy-for-llms
source_hash: d3fc9ec6c40299a3
---

## 三类公平性并排对比
type: comparison
span: 2
from: phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/docs/en.md

| 维度 | 群体公平 | 个体公平 | 反事实公平 |
|---|---|---|---|
| 规则 | 各受保护群体的比率相等 | 相似的个体得到相似的决策 | 敏感属性改变时决策不变 |
| 来源 | Demographic parity、equalized odds、CUAE | Dwork et al. 2012 | Kusner et al. 2017 |
| 需要 | 群体标签与结果 | 相似度度量 d | 因果 DAG |
| 形式化检验 | 各群体比率相等 | Lipschitz 常数 L | 反事实改变 |
| 弱点 | 基础比率不等时标准相互冲突 | 定义 d 是一个政策问题 | 可信度取决于 DAG |

## 各标准的选用时机
type: tips
from: phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/docs/en.md

- 声明是接受率相等时，用 demographic parity。
- 声明是各群体 TPR 和 FPR 相等时，用 equalized odds。
- 声明是预测值相等时，用 conditional use accuracy equality。
- 能定义任务专用度量 d 时，用个体公平。
- 有人群的因果 DAG 时，用反事实公平。
- 法律禁止干预受保护属性时，用回溯式反事实。

## 公式
type: concepts
from: phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/docs/en.md, phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/docs/en.md, phases/18-ethics-safety-alignment/20-bias-representational-harm/code/main.py

- **Demographic parity**：对所有群体，P(Y=1 | A=a) = P(Y=1 | A=a')。
- **Equalized odds**：P(Y=1 | Y*=y, A=a) = P(Y=1 | Y*=y, A=a')。
- **Conditional use accuracy**：P(Y*=y | Y=y, A=a) = P(Y*=y | Y=y, A=a')。
- **个体公平**：|f(x) - f(x')| <= L * d(x, x')
- **(ε, δ)-DP**：$P(M(D) \in S) \le e^{\varepsilon} \cdot P(M(D') \in S) + \delta$
- **WEAT 项**：s(w, X, Y) = mean cosine(w, X) - mean cosine(w, Y)
- **WEAT 效应**：在身份群体上计算 mean_a(s) - mean_b(s)。

## DP-SGD 流程
type: flow
from: phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/docs/en.md

1. **采样器**：采样一个 mini-batch。
2. **训练器**：计算逐样本梯度。
3. **裁剪器**：把每个逐样本梯度裁剪到阈值 C。
4. **噪声**：对裁剪后的梯度求和，加入标准差为 $\sigma \cdot C$ 的高斯噪声。
5. **优化器**：用带噪声的和更新参数。
6. **会计器**：用 Moments Accountant 或 Rényi DP accountant 跟踪隐私开销。

## 在哪里度量偏差
type: architecture
from: phases/18-ethics-safety-alignment/20-bias-representational-harm/docs/en.md

```arch
node | emb | 1,1 | Embedding-based | WEAT on pre-RLHF embeddings | model
node | prob | 2,1 | Probability-based | stereotype log-likelihood | model
node | gen | 3,1 | Generated-text-based | resume scoring, dialogue | process
node | rep | 2,2 | Representational harm | stereotypes, erasure |
node | alloc | 3,2 | Allocational harm | unequal material outcomes |
edge | emb | prob | representation
edge | prob | gen | behaviour
edge | gen | rep |
edge | gen | alloc |
```

## 玩具 WEAT 探针
type: annotated-code
lang: python
from: phases/18-ethics-safety-alignment/20-bias-representational-harm/code/main.py

```python
A = ["he", "his", "man"]                      # identity group A
B = ["she", "her", "woman"]                   # identity group B
X = ["engineer", "programmer", "scientist"]   # tech / career
Y = ["nurse", "teacher", "caregiver"]         # care / family
pre = weat_score(A, B, X, Y)                  # positive: A closer to X
EMB = debias(EMB)                             # project out the gender direction
gender_dir = [1.0, -1.0, 0.0, 0.0]            # axis 1 minus axis 0
post = weat_score(A, B, X, Y)                 # drops, not to zero
```

## 群体指标与 DP 重加权
type: annotated-code
lang: python
from: phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/code/main.py

```python
train_data = gen(1000)                        # A=0 base 0.3, A=1 base 0.6
test_data = gen(500)
baseline = train(train_data)                  # steps 200, lr 0.1
preds = predict(baseline, test_data)          # (pred, label, group)
demographic_parity(preds)                     # rate0, rate1
equalized_odds(preds)                         # (TPR, FPR) per group
conditional_use(preds)                        # (PPV, NPV) per group
dp_reweighted = train(train_data, sample_weights=weights)  # a=0 y=1: 2.0, a=1 y=1: 0.5
```

## DP-SGD 玩具代码
type: annotated-code
lang: python
from: phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/code/main.py

```python
grad_w = clip(grad_w, C)                      # scale to norm C
grad_b = max(-C, min(C, grad_b))              # clip the bias gradient
noise_b = random.gauss(0.0, sigma * C)        # noise std sigma * C
b -= lr * (grad_b + noise_b)                  # noisy update per example
for sigma in (0.0, 0.5, 1.0, 2.0, 4.0):       # sweep the noise multiplier
    model = dp_sgd(train_data, epochs=epochs, lr=0.05, sigma=sigma, C=C)
    acc = accuracy(model, test_data)
eps = analytical_epsilon(max(sigma, 0.01), steps=epochs * len(train_data), delta=delta)
```

## 玩具代码默认值
type: defaults
from: phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/code/main.py, phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/code/main.py, phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 裁剪范数 `C` | 1.0 | 第 22 课玩具代码 |
| `delta` | 1e-5 | `analytical_epsilon` 的默认值 |
| `epochs` | 10 | DP-SGD 玩具代码，500 行训练数据 |
| DP-SGD `lr` | 0.05 | 扫描中固定 |
| `sigma` | 0.0 | 标准 SGD，epsilon 无穷大 |
| 公开的 ε | [1, 10] | 仅作示意，不是推荐默认值 |
| 公平性 `train` | `steps: int = 200` | `lr: float = 0.1` |

## 故障排查
type: troubleshooting
from: phases/18-ethics-safety-alignment/20-bias-representational-harm/docs/en.md, phases/18-ethics-safety-alignment/20-bias-representational-harm/code/main.py, phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/code/main.py, phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| WEAT 效应降不到零 | 去偏只能减小、不能消除 | 增加概率与生成文本指标 |
| 形象多样，决策不平等 | 只度量了表征伤害 | 也要度量分配伤害 |
| 性别评估通过，偏差仍在 | 偏差出现在（性别, 种族）组合上 | 运行交叉性测试 |
| DP 差距缩小，EO 和 CUAE 变差 | 基础比率不等 | 把所选标准明确为政策 |
| Canary MIA 显示泄漏很少 | canary 不是“最易提取”的数据 | 增加训练数据提取测试 |
| 输出安全，个体却被重新识别 | 置信度分数泄漏 | 不要暴露，或截断/量化它们 |

## 调用玩具代码
type: task-table
from: phases/18-ethics-safety-alignment/20-bias-representational-harm/code/main.py, phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/code/main.py, phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/code/main.py

| 任务 | 代码 |
|---|---|
| 为 WEAT 探针打分 | `weat_score(<identity_a>, <identity_b>, ...)` |
| 投影去除偏差方向 | `debias(<emb>)` |
| 用重加权训练 | `train(data, sample_weights=<w>)` |
| 各群体的 demographic parity | `demographic_parity(preds)` |
| 各群体的 equalized odds | `equalized_odds(preds)` |
| 裁剪一个梯度 | `clip(<g>, <C>)` |
| 用 DP-SGD 训练 | `dp_sgd(data, epochs, lr, sigma, C)` |
| 一次运行的 epsilon | `analytical_epsilon(sigma, steps)` |

## 问答
type: qa
from: phases/18-ethics-safety-alignment/21-fairness-criteria-group-individual-counterfactual/docs/en.md, phases/18-ethics-safety-alignment/22-differential-privacy-for-llms/docs/en.md, phases/18-ethics-safety-alignment/20-bias-representational-harm/docs/en.md

- **一个模型能同时满足三种群体标准吗？** 不能。基础比率不等使之不可能（Chouldechova，KMR 2017）。
- **为什么用回溯式反事实？** 它们从实际特征出发推理，不对属性做干预。
- **为什么 MIA 和提取攻击结论不一致？** 它们度量的东西不同：插入的 canary 与“最易提取”的数据。
- **LoRA + DP-SGD 保护的是什么？** 适配器。基座模型保持固定。
- **为什么 WinoIdentity 关注不确定性？** 误差相同但不确定性不同，仍会改变分配。
