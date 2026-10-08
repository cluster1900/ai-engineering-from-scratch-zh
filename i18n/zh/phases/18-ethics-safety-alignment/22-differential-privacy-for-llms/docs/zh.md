# 法律法学专业的不同隐私

> 由于这种情况,DPGD仍然是标准做法:注入噪音的渐进更新提供形式化 (epsilon, delta) 保证――计算,内存和效用方面的开销都很大;参数高效的DPGD细节调整 (LoRA + DP-SGD) 是常见的2025配置 (ACM 2025) 两类证据存在张力:基于加拿大成员制推断 (Duan et al., 2024) 报告称对语言模型的成功有限;培训数据提取 (Carlon et al., 2021;Nasr et al., 2025) 恢复大量的字体内存方式 (arX:2503.808 于2025年3月得到了信任):06差距在测量中是不同:插入提议的对象 最容易被取取的数据.

**Type:** Build
**Languages:** Python (stdlib, DP-SGD 噪声注入和 ε-δ accountant 演示)
**Prerequisites:** Phase 01 · 09（信息论），Phase 10 · 01（大模型训练）
**Time:** ~60 分钟

## 学习目标
- 定义 (epsilon,delta) - 差异性隐私,并说明 DP-SGD 流程──
- 解释2024-2025年张力:加拿大海内外情调查与培训数据采集 给出不同视图
- 描述PMixED以及为什么推断时间私人预测是 DP培训的替代方案.
- 描述通过LLM反方式对不同隐私的反

## 问题
士会记忆──卡尔尼等人2021年表明,生产语言模型会按需要逐字复现训练文本──DP是形式化防御:训练模型,使其输出在可证明意义上对任何单个训练样本不敏感──2024-2025年的证据显示,DP-SGD是必要的,但已部署的 ε 值可能不匹配威胁模型──

## 概念
### 区别隐私

如果对任意两个只相差的一个样本数据集,以及任意事件S,一个随机算法M 满足:
在S (<=e^ε * P(M(D') 中

解释:输出分布足够接近 (由 ε 参数化) ),使任何单个个体的贡献都不能可靠推断,除非以 δ 的概率发生例外.

### 其他类型

亚巴迪等人 2016 年:
1. 采样一个小批量.
2. 计算每例梯度――
3. 将每一个例子梯度切割到值C.
4. 求和并加入为 σ * C 的高斯噪音.
5. 使用带噪音和来更新参数.

隐私成本由会计跟踪(时刻会计,Rényi DP会计) ⋅LLM 文献中报告的 ε 值会因威胁模型,数据敏感性和效果目标而大幅变化;不存在普适的安全默认 ε──已发出表示例在某些 LLM 训练设置中大致覆盖 ε ≈ 110,但这些只是示例,并非推默认值.

### 洛拉+DP-SGD

对边界模型做完整的DP-SGD 代价过高.LoRA (Hu et al. 2022) 将Gadient 更新限制在一个小型适配器中,从而减少每例梯度存储.LoRA +DP-SGD 是常见的2025年配置.

### 2024-2025 年的张力

两条证据线:

- **Canary MIA (Duan et al. 2024)。**报告称在语言模型上的成功有限――这表明MIA很难――
- **Training-data extraction (Carlini 2021, Nasr et al. 2025)。**用前提示模型;测量它是否能从训练中恢复逐字文本――报告称存在大量的记忆――这表明在相关意义上,MIA很容易――

2025 年 3 月的解决方式 (arXiv:2503.06808):二者测量是不同事物.MIA 问的是样本是不是在D 中?对象是插入的加拿大.

新的加拿大海设计――无需影子模型的亏损基础MIA――首个针对真实数据的LLM――且具有现实DP保证的非凡DP审计――

### 培训的替代方案

- **PMixED (arXiv:2403.15638)。**预测时间的私人预测――在下一个标志分布上使用专家的混合;每个专家看到一个训练数据片段;聚合时加入噪音实现DP──完全避免DP训练──
- **DP synthetic data generation (Google Research 2024)。**使用DP-SGD 进行LoRA细调,采集合成数据,再在合成数据上训练下游分类器.

其他方面,完全绕开了DP培训的效用成本,但成本是采用不同的威胁模型.

### 通过LLM反 逆转差异性隐私

2025年新兴攻击――将DP训练模型的信心分数 用作预言来重新识别个体――即使输出不泄漏,信心分布也可能泄漏――

防护方式:不要暴露自信,或在暴露前对其断断/量化.

### 这是在18期中位置.

课时20-21是偏见/公平――课时22是隐私――课时23是通过水标实现来源――课时27 覆盖监管层面的数据来源层――


```figure
an-dp-clip-noise
```

## 使用它
`code/main.py`在一个玩具二进制分类数据集上模拟DP-SGD──你可以扫过噪音乘法 σ 和剪切规范C,并跟踪 (ε, δ) 预算与准确性成本──一个卡纳攻击 会插入一个唯一的训练样本,并测量日志损失测试在DP前后是否能检查到它──

## 交付它
本课会产出 `outputs/skill-dp-audit.md`△给定某种语言模型部署的DP索赔,它会审计: ((ε, δ) 值、使用的会计者、MIA评估协议,以及是否已经评估了信任暴露向量──

## 练习
1. 运行`code/main.py`△扫过 σ ∈ {0.5, 1.0, 2.0},并报告 (ε, δ) - 精度权衡──识别效用崩的临界点──

2. 实现加拿大插入和日志损失测试――测量在 σ = 1.0 时,DP-SGD 前后的检测率――

3. 阅读Nasr et al. 2025 关于训练数据提取内容――为什么提取成功不会在中等 ε下崩?

4. 设计一个使用PMixED的部署 (arXiv:2403.15638) 让它完全在推断时间运行.

5. 概述 DP 通过LLM反 攻击――设计一个限制信任评分 泄漏的对策,并估计其部署成本――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| DP | “(ε, δ)-differential privacy” | 形式化隐私：在相邻数据集变化下，输出分布保持接近 |
| DP-SGD | “noise-injected SGD” | Gradient clipping + Gaussian noise addition；标准 DP training |
| LoRA + DP-SGD | “efficient private fine-tune” | 在 low-rank adapters 上做 DP-SGD；标准 2025 配置 |
| MIA | “membership inference” | 判断某个样本是否出现在训练数据中的攻击 |
| Canary | “inserted watermark example” | 用于测量 DP 泄漏的唯一训练样本 |
| PMixED | “private inference mixture” | 在 inference time 通过 next-token 分布上的 mixture-of-experts 实现 DP |
| DP Reversal | “confidence leakage attack” | 使用模型 confidence 作为 oracle 进行重新识别的攻击 |

## 延伸阅读
- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) 标准DP培训算法
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) 经典提取论文
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841)成功有限的MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808)对该张力的解决
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638)推断时间 私有预测
