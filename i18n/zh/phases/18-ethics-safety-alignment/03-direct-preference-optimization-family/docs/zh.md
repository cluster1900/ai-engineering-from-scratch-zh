# 直接偏好优化 家族

> 拉斐洛夫等人 (2023) 证明,RLHF的最佳优化可以使用偏好数据写成闭式形式,因此你可以跳过显式奖励模型,直接优化政策.这个洞见催生了一个家族:IPO、KTO、SimPO、ORPO、BPO,每个方法都修复了DPO的失败模式. 到2026年,直线配列算法在边境后培训运行中已经被使用到PPO.

**Type:** Learn
**Languages:** Python (stdlib, 六种 preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## 学习目标

- 从带 KL 的 RLHF 最优解推导 DPO 闭式形式──
- 解释IPO、KTO、SimPO、ORPO、BPO 各自修复了DPO中哪种失败模式──
- 区分隐含的奖励差距和优先级强度,并解释IPO的身份映射为什么重要
- 解释为什么Rafailov等 (NeurIPS 2024) 证明DAA 即使没有显而易见的RM也会过度优化──

## 问题

利计划目标:

```text
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

有一个已知最优解:

```text
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

因此,最佳政策和参考的比值隐式定义了奖励:

```text
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

把它代入布拉德利-特利偏好概率后,分区函数`Z(x)`会抵消,因为它只依赖`x`剩下的只是一个仅包含政策参数的损失,不再需要奖励模式.

问题在于:这个推导假设最优解可达的偏好数据是分布式的,并且参考政策是真正的模式杆.

## 概念

### 果 (Rafailov等, 2023)

```text
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

可能出错的地方:

- 隐含的奖励差距`beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)`是无限的. 一个很小的偏好也可能产生任何大的差距.
- 这种损失会把选用和拒绝的日志问题往相反方向推. 只要被拒绝下降更快,它就可以把选用的绝对日志问题也往下推.
- 稀有样本对稀有样本的偏好将产生任意的隐含回报.

### 投资者:

身份偏好优化 用偏好概率 上的身份映射 替换日志-标志性――损失 变成有限的目标 上的平方错误:

```text
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

边缘被`1/(2 beta)`限制――偏好强度与隐含奖励差距 成比例――不会爆掉――

### 技术技术技术 (Ethayarajh等,2024年)

卡内曼-特弗斯基优化 完全消除对式结构――给定一个单独标记的输出,以及一个二元的 望或 不望信号,它将映射到前景理论的实用性:

```text
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

没有对收益和损失的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同权重的不同

### 博 (Meng等, 2024)

让训练信号与生成过程对齐――完全移除参考政策,并按长度归纳到日志概率:

```text
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

使用率`gamma`为了稳定训练――长度归结移除利用DPO长度偏差失败模式的激励`y_w`由于这些问题,我们可以在建筑中发现更大的日志问题差距.

### 欧罗波 (Hong等, 2024)

在标准 SFT 负账概率上添加一个优先术语:

```text
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

没有参考政策,SFT术语就是调节剂. 从基模型到配线模型,只需要单阶段的训练.

### 报告的内容:

识别了被评级的选择答案 问题:DPO 会保持排序`y_w > y_l`虽然`y_w`根据Llama-3.1-8B-Instruct的数学推理任务,相比DPO准确率提高了+10.1%──

### 通用结论:DAA 仍然会过度优化

拉斐洛夫等人  直接调整算法中奖励模型过度优化的规模定律 (NeurIPS 2024) 在多个数据集和不同KL预算下,使用DPO、IPO、SLiC 训练政策──黄金奖励vsKL曲线呈现出与高等人 相似的峰值和崩形状──隐含奖励在训练期间查询出流量样本;KL规范化无法稳定这一点──

它们只是把问题从人表面奖励模型上,被过于优化转化参考政策比率,被过于优化.通用修复方法,也就是更好的数据,集群,早期停止,对两者都适用.

### 如何选择(2026)

- 如果有大量的对对偏好数据:使用保守的beta的DPO;如果长度偏差明显,则使用SimpO。
- 如果有没有双重反:KTO──
- 如果您想从基本模型中发出单阶段的管道:ORPO──
- 如果在DPO日志中看到被淘汰的日志探测器:BPO.
- 如果偏好强度差异很大,DPO正在和IPO.

每个实验室都会在一组评测中完成这五种方法,然后按任务选择赢家.


```figure
dpo-margin
```

## 用它

`code/main.py`在一个玩具偏好数据集上比较六种损失 (DPO、IPO、KTO、SimPO、ORPO、BPO),其中真正的偏好强度会随对变化.每个损失都在相同的500对样本上,使用一个小型软最大政策优化.

## 运送它

本课产出发 `outputs/skill-preference-loss-selector.md`△给定数据集统计数据 (对与未对的变量对均的偏好强度,长度分布) 和目标 (单阶段或SFT-然后偏好),推一个偏好损失,并报告它防护的故障模式――

## 练习

1. 运行`code/main.py`△报告DPO和BPO的最终选择日志测试下降──BPO应保留更高的选择绝对概率,请验证这一点──

2. 修改偏好数据,让所有对都有相同的强度.

3. 让拒绝的答案的平均长度变成所选的2倍. 在不改变其他内容的情况下,使用数值展示DPO的长度利用以及SimpO的修复.

4. 拉斐洛夫等人 (NeurIPS 2024) 声称DAAs 会过度优化──复现一个单点版本:绘制选项-减排-拒绝的KL分歧,并观察大beta 下 DPO的过度优化──

5. 阅读BPO论文摘要 (OpenReview b97EwMUWu7) 』写下BPO 添加到DPO的那一行修正──对照`code/main.py`中实现确认.

## 关键词

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DPO | “没有 reward model 的 RLHF” | 从 RLHF 闭式最优解推导出的 loss；只含 policy parameters |
| Implicit reward | “log-ratio” | `beta * log(pi(y\|x) / pi_ref(y\|x))`，也就是 DPO 隐含的 reward |
| IPO | “bounded DPO” | 用 identity 替换 log-sigmoid；implicit reward gap 被 `1/(2 beta)` 限制 |
| KTO | “unpaired DPO” | 在带有 loss aversion 的单标签上使用 prospect-theory utility |
| SimPO | “reference-free DPO” | 长度归一化 log-likelihood + margin；没有 reference policy |
| ORPO | “one-stage DPO” | NLL + odds-ratio preference term；从 base model 单次训练完成 |
| BPO | “chosen-preserving DPO” | DPO 加上对 chosen response 绝对 log-prob 下降的惩罚 |
| Degraded Chosen | “chosen 下降了” | 只要 rejected 下降得更快，DPO 就会降低 chosen log-prob |
| DAA | “direct alignment algorithm” | 任何跳过显式 RM 的 preference-loss 方法 |

## 进一步阅读

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036)IPO
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
