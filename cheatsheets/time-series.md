---
id: time-series
title: Time Series Fundamentals
code: TS
subtitle: 检查平稳性，构建滞后特征，做 walk-forward 验证，击败朴素基线。随机游走与马尔可夫链。
hue: 170
sources: phases/02-ml-fundamentals/15-time-series, phases/01-math-foundations/22-stochastic-processes, phases/02-ml-fundamentals/16-anomaly-detection
source_hash: 32f26254a2e7a0f0
---

## 从序列到诚实预测
type: architecture
from: phases/02-ml-fundamentals/15-time-series/docs/en.md, phases/02-ml-fundamentals/15-time-series/code/time_series.py

```arch
node | raw | 1,1 | Raw series | plot it first
node | stat | 2,1 | Stationarity check | rolling mean and std
node | diff | 3,1 | Differencing | at most two rounds
node | lags | 4,1 | Lag features | values at t-1 or earlier
node | wf | 4,2 | walk_forward_split | train before test
node | model | 3,2 | Model | Ridge, SimpleAR, ARIMA
node | base | 2,2 | Baselines | persistence, seasonal naive
node | score | 1,2 | Score | MAE, RMSE, MAPE
edge | raw | stat |
edge | stat | diff | drifts
edge | diff | lags |
edge | lags | wf |
edge | wf | model | folds
edge | model | base | must beat
edge | base | score |
```

## Walk-forward 验证
type: flow
from: phases/02-ml-fundamentals/15-time-series/docs/en.md

1. **训练**：在截至时间 t 的数据上拟合。
2. **预测**：预测 t+1，或多步时预测 t+1 到 t+k。
3. **滑动**：把窗口向前移。
4. **重复**：每个测试折都出现在其全部训练数据之后。
5. **Expanding window**：训练集增长。旧数据仍然相关时使用。
6. **Sliding window**：固定大小。世界在变、旧数据有害时使用。

## 代码中的任务
type: task-table
from: phases/02-ml-fundamentals/15-time-series/code/time_series.py

| 任务 | 代码 |
|---|---|
| 去掉趋势 | `difference(series, order=1)` |
| 滚动统计与判定 | `check_stationarity(series, window=50)` |
| 直到某 lag 的 ACF | `autocorrelation(series, max_lag=20)` |
| 序列变成 X 和 y | `make_lag_features(series, n_lags)` |
| 按时间排序的折 | `walk_forward_split(n_samples, n_splits=5, min_train=50)` |
| 在滞后特征上做 AR | `SimpleAR(n_lags=5).fit_series(series)` |
| 递归多步 | `forecast(last_values, n_steps)` |
| 百分比误差，跳过零 | `mape(y_true, y_pred)` |

## 库版本
type: annotated-code
lang: python
from: phases/02-ml-fundamentals/15-time-series/docs/en.md

```python
X, y = make_lag_features(series, n_lags=10)
for train_idx, test_idx in walk_forward_split(len(X)):
    model = Ridge(alpha=1.0)
    model.fit(X[train_idx], y[train_idx])
    predictions = model.predict(X[test_idx])
model = ARIMA(train_series, order=(5, 1, 2))      # p, d, q
fitted = model.fit()
forecast = fitted.forecast(steps=30)            # 30 steps ahead
tscv = TimeSeriesSplit(n_splits=5)                # sklearn walk-forward
scores = cross_val_score(model, X, y, cv=TimeSeriesSplit(n_splits=5))
```

## 核心定义
type: concepts
from: phases/02-ml-fundamentals/15-time-series/docs/en.md

- **分量**：趋势、季节性与残差。残差是白噪声说明拆分成功。
- **平稳**：均值、方差和自相关不随时间变化。
- **差分**：$\text{diff}[t] = \text{value}[t] - \text{value}[t-1]$
- **ACF**：序列与其滞后副本的相关。用到相关变得可忽略的 lag。
- **PACF**：去掉更短 lag 的影响后，lag k 处的自相关。
- **ARIMA(p, d, q)**：p 个过去值，d 轮差分，q 个过去误差。
- **MAE / RMSE / MAPE**：平均绝对误差、平方误差的根、百分比误差。
- **Target 对齐**：target 在 t。每个特征都用 t-1 或更早。

## 选择方法
type: command-table
from: phases/02-ml-fundamentals/15-time-series/docs/en.md

| 命令 | 作用 |
|---|---|
| 滞后特征 + ML | 外部特征很多。用 boosting 做最强起点 |
| ARIMA | 单条单变量序列、短期。季节用 SARIMA |
| Exponential smoothing | 简单趋势 + 季节性，用 Holt-Winters |
| 神经网络 | 长序列、多条序列 |
| Recursive forecast | 把预测喂回模型。用于 1-5 步 |
| Direct forecast | 每个 horizon 一个模型。用于长 horizon |
| Multi-output | 一个模型输出全部 horizon |

## 默认值与数字
type: defaults
from: phases/02-ml-fundamentals/15-time-series/docs/en.md, phases/02-ml-fundamentals/15-time-series/code/time_series.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `check_stationarity` 窗口 | 50 | 滚动窗口大小 |
| 均值偏移上限 | 0.5 | 序列标准差的倍数，前半对后半 |
| 方差比上限 | 2.0 | 超过则标记为非平稳 |
| ADF p-value | 0.05 | 低于它则拒绝非平稳 |
| `max_lag` | 20 | 自相关默认值 |
| `n_splits`, `min_train` | 5 | min_train=50 行后才开始第一次测试 |
| 滚动窗口 | 7 天和 14 天 | 按天的 mean、std、min、max |
| 周季节性 | lag 7 | 也可能包含 14 |

## 错误与修复
type: troubleshooting
from: phases/02-ml-fundamentals/15-time-series/docs/en.md, phases/02-ml-fundamentals/15-time-series/code/time_series.py

| 症状 | 原因 | 修复 |
|---|---|---|
| 随机划分的 MSE 更低 | 未来泄漏 | Walk-forward 或按时间切分 |
| 回测近乎完美 | 包含了时间 t 的特征 | 审计每个特征的对齐 |
| 错过季节性模式 | 测试集短于一个周期 | 留出一个完整季节周期 |
| 收入翻倍，模型滞后 | 绝对尺度变了 | 建模百分比变化 |
| 很多 lag 导致过拟合 | “更多历史更好” | 从 ACF 挑选 lag |
| 线性模型漂移 | 趋势未去掉 | 先差分，再建模 |
| 输给 seasonal naive | 泄漏、评估错误，或序列随机 | 调参前先修 bug |
| 生产中误差上升 | 世界变了 | 用近期数据重训 |

## 代码中的随机过程
type: annotated-code
lang: python
from: phases/01-math-foundations/22-stochastic-processes/code/stochastic.py, phases/01-math-foundations/22-stochastic-processes/docs/en.md

```python
positions = random_walk_1d(n_steps, seed=None)    # std grows as sqrt(n)
mc = MarkovChain(P, state_names=names)            # rows of P sum to 1
pi = mc.stationary_distribution()                 # left eigenvector, eigenvalue 1
states = mc.simulate(start_state=0, n_steps=100000, seed=42)
traj = langevin_dynamics(grad_U, x0, dt, temperature, n_steps)
samples, acc_rate = metropolis_hastings(
    target_log_prob=bimodal_log_prob,
    proposal_std=2.0, x0=np.array([0.0]), n_samples=100000, seed=42)
samples_flat = samples[10000:, 0]                 # burn-in discarded
```

## 随机游走与马尔可夫链
type: concepts
from: phases/01-math-foundations/22-stochastic-processes/docs/en.md

- **随机游走**：均值 0，标准差 $\sqrt{n}$。10000 步大约得到 100。
- **马尔可夫性质**：下一状态只依赖于当前状态。
- **平稳分布**：$\pi P = \pi$。天气链给出 [0.55, 0.18, 0.27]。
- **收敛**：需要不可约且非周期的链。
- **谱间隙**：1 减去第二特征值。间隙为 0.2 时大约 5 步即可混合。
- **布朗步**：$B(t + dt) = B(t) + \sqrt{dt} \, z$
- **Langevin**：$x_{t+1} = x_t - dt \, \nabla U(x_t) + \sqrt{2 T \, dt} \, z_t$
- **Metropolis-Hastings**：以 $\min(1, a)$ 接受。目标约 23% 的接受率。

## 时间中的异常
type: tips
from: phases/02-ml-fundamentals/16-anomaly-detection/docs/en.md

- 90 度在夏天正常，在冬天异常。情境异常需要时间特征。
- 集体异常需要感知序列的方法。连续五十次登录失败是一次攻击。
- 加入滚动统计、比率和距上次事件的时间特征。
- 30 天滚动统计在打分时需要缓冲 30 天历史。
- 跟踪异常分数分布。固定阈值会过时。

## 问题
type: qa
from: phases/02-ml-fundamentals/15-time-series/docs/en.md

- **为什么不用 k-fold？** 样本不独立。随机折会把未来泄漏进训练。
- **差分几次？** 大多数真实序列最多需要两轮。
- **多少个 lag？** 用 ACF。月度数据在 lag 12 出现尖峰意味着年季节性。
- **树模型需要差分吗？** 树模型能处理趋势。线性模型需要平稳性。
- **收入偏斜？** 在 log 空间预测，再取指数。
- **先用哪个基线？** 上一个值，然后 seasonal naive，然后移动平均。
