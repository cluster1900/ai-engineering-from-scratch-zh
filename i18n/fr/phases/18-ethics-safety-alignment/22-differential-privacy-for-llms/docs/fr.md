# La confidentialité différentielle des LLM

> DP-SGD 仍然是標準做法:注入噪音的 Gradient 更新提供形式化的 (epsilon, delta) 保证──计算、内存和效用方面的开销都很大;参数高效的 DP fine-tuning (LoRA + DP-SGD) 很常见的 2025 配置 (ACM 2025) 两类证据存在张力:基于加拿大的会员推论 (Duan et al., 2024) 报告称对语言模型的成功有限;培训数据提取 (Carlon et al., 2021; Nasr et al., 2025) 恢复数据逐字记忆──大量方式 (arX:503.808, March 2025):06差距在测量对象不同:插入提议的数据 最容易被取取──即兴的数据方案 无兴的设计支持的数据 基于数据的数据 基于数据的数据 基于数据的数据 基于数据的数据 基于数据的数据 基于数据的数据 基于数据的数据 基于数据的数据 基于数据的数据的数据 基于数据的数据的数据的数据 基于数据的数据的数据的数据 基于数据的数据的数据的数据 基于数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据 基于数据的数据的数据的数据的

**Type:** Build
**Languages:** Python (stdlib, DP-SGD 噪声注入和 ε-δ accountant 演示)
**Prerequisites:** Phase 01 · 09（信息论），Phase 10 · 01（大模型训练）
**Time:** ~60 分钟

## Objectif de l'apprentissage
- 定义 (epsilon, delta) - confidentialité différentielle,并说明 DP-SGD 流程──
- 解释张力 2024-2025:MIA canarien et extraction de données de formation  donnent un tableau différent
- 描述 PMixED, ainsi que pourquoi la prédiction privée de l'inférence-temps est une alternative à la formation DP.
- 描述 Réversion différentielle de la vie privée via le MLL Feedback 攻击。

##  problématique
Les LLM 会记忆──Carlini et al. 2021 indiquent que le modèle de production de langue se comporte selon les besoins du texte de formation réactif.

## 概念
### (ε, δ) - confidentialité différentielle

Si à l'égard de deux variables différentes, un ensemble de données de l'échantillon, ainsi que l'événement S, un algorithme aléatoire M 满足:
P(M(D) dans S) <= e^ε * P(M(D') dans S) + δ。

Expliquer: la distribution de sortie est assez proche (par é) et aucune contribution individuelle ne peut être concluée de manière fiable, sauf si la probabilité de δ est exceptionnelle.

### Département de la pêche

Abadi et coll. 2016。standard流程:
1. - Je suis un petit groupe.
2. 计算 par échantillon de gradients。
3. Pour chaque gradient par exemple, la valeur C est réduite.
4. Pour les gradients de la coupe 求和,并加入 std 为 σ * C du bruit gaussien。
5. Utilisation avec le bruit et pour mettre à jour les paramètres.

隐私成本由会计师跟踪(Moments会计师、Rényi DP会计师)  LLM 文献中报告的 ε 值会因威胁模型、数据敏感性和效用目标而大幅变化; 没有普适的安全默认 ε──已发言例在某些 LLM 训练设置中大致覆盖 ε ≈ 110,但这些只是例证,并非推默认值──较低的 ε 通常需要更多噪音,并可能增加效用损失──

### LOR + DP-SGD

Pour le modèle frontalier faire un DP-SGD complet 代价过高──LoRA (Hu et coll. 2022) va Gradient 更新限制在一个小型适配器中,从而减少每例梯度 存储──LoRA + DP-SGD 是常见的2025配置──DP保证适用于适配器;base model 保持固定──

### L'économie de l'Union européenne

两条证据线:

- **Canary MIA (Duan et al. 2024)。**Pour les Canaries uniques, il est difficile de mesurer si les attaquants peuvent les identifier.
- **Training-data extraction (Carlini 2021, Nasr et al. 2025)。**Utilisez le préfixe 提示模型; mesurez si elle peut récupérer du texte par mot dans l'entraînement.

Le problème est que les échantillons sont facilement récupérés, car ils ne sont pas optimisés pour être facilement récupérés.

Les nouveaux modèles canariens 设计──无需影模型的亏损MIA──首个针对真实数据的LLM──且具现实DP保证的非凡DP审计──

### Programme de formation en DP

- **PMixED (arXiv:2403.15638)。**Prédiction privée du temps d'inférence: dans le prochain jeton, on utilise un mélange d'experts; chaque expert voit une fiche de données de formation; s'agissant de la collecte de bruit pour réaliser le DP, on évite complètement le DP.
- **DP synthetic data generation (Google Research 2024)。**Utilisation de DP-SGD  effectuer LoRA-fin-tune, échantillonnage de données synthétiques, re-enregistrement de données synthétiques 上训练下游 classifier。

Les deux ont dépassé le coût de l'efficacité de la formation complète du DP, mais le coût est d'adopter un modèle de menace différent.

### À travers le MLL Feedback 逆转 Différentiel de la vie privée

2025 新兴攻击──将 DP-trained model confidence scores 用作 Oracle 来重新识别个体──即使输出不泄漏,信心分布也可能泄漏──

 méthode de défense: ne pas exposer les confidences, ou à la découverte avant de les couper/quantiser.

### C'est dans la phase 18 .

Les leçons 20-21 sont le biais/l'équité. La leçon 22 est la vie privée. La leçon 23 est la réalisation de la provenance par le marquage d'eau. La leçon 27 couvre le niveau de la surveillance.


```figure
an-dp-clip-noise
```

## Utilisez-le
`code/main.py`Dans un ensemble de données de classification binaire de jouets, vous pouvez parcourir le multiplicateur de bruit σ et la norme de coupe C, et suivre (ε, δ) le budget et le coût de précision.

## Je le livre.
本课会产出 `outputs/skill-dp-audit.md` déterminer la revendication de DP d'un modèle linguistique déployé, elle vérifiera: ε, δ) √ Value √ Utilisation du protocole d'évaluation du MIA, ainsi que l'évaluation des vecteurs de confiance-exposition 

## 练习
1. 运行  référencement`code/main.py`◊扫过 σ ∈ {0,5, 1.0, 2.0},并报告 (ε, δ) - précision 权衡──识别效用崩的临界点──

2. 实现 Canary 插入和日志-loss test──测量在 σ = 1,0 时,DP-SGD 前后的检测率──

3. 阅读Nasr et al. 2025 关于训练数据提取的内容──为什么提取成功不会在中等 ε下崩?

4. Design a utilisé PMixED (arXiv:2403.15638) pour le déployer, en le rendant entièrement en temps de déduction .

5. 概述 DP Reversal via LLM Feedback 攻击──设计一个限制信任评分 泄漏的对策,并估算其部署成本──

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
- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) 标准 algorithme de formation du DP
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) 经典 extraction 论文
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) succès limité de la MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) à la résolution de la crise
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) temps d'inférence 私有预测
