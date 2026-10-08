# A privacidade diferencial dos LLM

> DP-SGD  ainda é uma prática padrão: injecting noise Gradient 更新提供形式化的 (epsilon, delta) 保证──计算、内存和效用方面的开销都很大;参数高效的 DP fine-tuning (LoRA + DP-SGD) 是常见的 2025 配置 (ACM 2025) 两类证据存在张力:基于加拿大的会员推理 (Duan et al., 2024) 报告称对语言模型的成功有限;训练数据提取 (Carlon et al., 2021; Nasr et al., 2025) 恢复大量的字体记忆──大量的方法 (arX:503.808, March 2025):06差证在测量对象不同:插入提前的数据 最容易被取取──即兴兴的方案支持的数据设计与基于数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据的数据是有限的;

**Type:** Build
**Languages:** Python (stdlib, DP-SGD 噪声注入和 ε-δ accountant 演示)
**Prerequisites:** Phase 01 · 09（信息论），Phase 10 · 01（大模型训练）
**Time:** ~60 分钟

## Objectivo de aprendizagem
- 定义 (epsilon, delta) - privacidade diferencial,并说明 DP-SGD 流程──
- Explicação de Zhang力:Canary MIA e extracção de dados de formação
- Descrever PMixED, e por que a previsão privada de tempo de inferência é uma alternativa ao treinamento DP.
- 描述 Diferencial Reversal de Privacidade através de LLM Feedback 攻击。

## 问题
LLMs 会记忆──Carlini et al. 2021 mostram que o modelo de produção de linguagem será baseado na necessidade de texto de treinamento repetido.

## 概念
### (ε, δ) - privacidade diferencial

Se em relação a qualquer dois apenas diferem entre um conjunto de dados de amostra, bem como qualquer evento S, um algoritmo aleatório M 满足:
P(M(D) em S) <= e^ε * P(M(D') em S) + δ。

Explicação: a distribuição de saída é suficientemente próxima (por ε 参数化), para que qualquer contribuição de um único indivíduo não possa ser concluída com confiança, a menos que a probabilidade de δ ocorra uma exceção.

### DP-SGD

Abadi et al. 2016。标准流程:
1. Como um mini-parceito.
2. 计算 por exemplo gradientes。
3. Cortar cada gradiente por exemplo para o valor C.
4. Para os gradientes de corte posterior 求和,并加入 std 为 σ * C de ruído gaussiano。
5. Utilize带噪音和来更新参数──

隐私成本由会计师跟踪(Moments 会计师、Rényi DP会计师)  LLM 文献中报告的 ε 值会因威胁模型、数据敏感性和效用目标而大幅变化; 没有普适的安全默认 ε── já foram emitidos exemplos em alguns LLM 训练设置中大致覆盖 ε ≈ 110, mas estes são apenas exemplos, não são recomendados valores默认──较低的 ε 通常需要更多噪音,并可能增加效用损失──

### LoRA + DP-SGD

Para o modelo de fronteira fazer DP-SGD completo 代价过高──LoRA (Hu et al. 2022) vai Gradient 更新限制在一个小型适配器中,从而减少每例梯梯储──LoRA + DP-SGD 是常见的 2025 配置──DP保证适用于适配器;base model 保持固定──

### A capacidade de produção

两条证据线:

- **Canary MIA (Duan et al. 2024)。**Para a única Canária 插入训练数据, medir a integridade-inferência do atacante 否能识别它们――报告称在语言模型上的成功有限――这表明MIA 很难――
- **Training-data extraction (Carlini 2021, Nasr et al. 2025)。**Use prefixo 提示模型; measure whether it can recover from training 字体文本──报告称存在大量记忆── isso indica que em um sentido relacionado MIA 很容易──

2025 年 3 月的解决方式 (arXiv:2503.06808):二者测量是不同事物──MIA 问的是样本e是否在D 中?对象是插入的Canary──Extraction 问的是我能从D 中恢复什么?对于隐私而言,最容易提取的样本才重要;Canary 会低估这一点,因为它们没有优化为容易提取──

Novo Canary Design, não precisa de modelos de sombra de MIA baseada em perda, primeiro LLM baseado em dados reais, e com DP real, garantia de auditoria de DP extraordinária.

### Programa de formação de DP

- **PMixED (arXiv:2403.15638)。**Previsão privada do tempo de inferência── em seguida, o token distribuído em uso de mistura de especialistas; cada especialista vê um training data shard; aglutinando ao som de ruído para realizar DP── completamente evitar o treinamento DP──
- **DP synthetic data generation (Google Research 2024)。**Utilize DP-SGD  realizar LoRA-fine-tune, recolher dados sintéticos, re-encontrar dados sintéticos 上訓練下游 classificador。

O segundo é o custo de utilização do treinamento completo de DP, mas o custo é a adoção de diferentes modelos de ameaça.

### 通過 LLM Feedback 逆转 Diferencial Privacidade

2025 新兴攻击──将 DP-trained model confidence scores 用作 Oracle 来重新识别个体──即使输出不泄漏,信心分布也可能泄漏──

 modo de defesa: não expor confidências, ou antes de serem exporas, a sua interrupção/ quantificação.

### Está na fase 18 .

Lições 20-21 é preconceito/justiça. Lição 22 é privacidade. Lição 23 é através do marcado de água para a obtenção da procissão. Lição 27 覆盖监管层面的数据-provenance层.


```figure
an-dp-clip-noise
```

## Use-o
`code/main.py`Em um brinquedo de classificação binária, dados de dados em conjunto, em formato DP-SGD. Você pode rastrear o multiplicador de ruído σ e a norma de corte C, e acompanhar (ε, δ) o orçamento e o custo de precisão.

## Entrega-o
本课会产出 `outputs/skill-dp-audit.md` Determinar a alegação de DP de um modelo de linguagem, que irá auditar: ((ε, δ) 值、 o uso do contador、 o protocolo de avaliação da MIA, bem como se já avaliou vetores de confiança-exposição。

## 练习
1. 运行 `code/main.py`◊扫过 σ ∈ {0.5, 1.0, 2.0},并报告 (ε, δ) - precisão 权衡──识别效用崩的临界点──

2. 实现 Canary 插入和日志-loss test──测量在 σ = 1,0 时,DP-SGD 前后的检测率──

3. 阅读Nasr et al. 2025 关于训练数据提取的内容──为什么提取成功不会在中等 ε下崩?

4. Design a utilização de PMixED (arXiv:2403.15638) para que seja executado completamente no tempo de inferência.

5. 概述 DP Reversal via LLM Feedback 攻击──design a restrição de confiança-score 漏漏的对策,并估算其部署成本──

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
- [Abadi et al. — DP-SGD (arXiv:1607.00133)](https://arxiv.org/abs/1607.00133) 标准 DP algoritmo de formação
- [Carlini et al. — Extracting Training Data (arXiv:2012.07805)](https://arxiv.org/abs/2012.07805) 经典 extração 论文
- [Duan et al. — Canary MIA on LLMs (arXiv:2402.07841, 2024)](https://arxiv.org/abs/2402.07841) Success Limited of MIA
- [Kowalczyk et al. — Auditing DP for LLMs (arXiv:2503.06808, March 2025)](https://arxiv.org/abs/2503.06808) para a resolução da
- [PMixED (arXiv:2403.15638)](https://arxiv.org/abs/2403.15638) tempo de inferência 私有预测
