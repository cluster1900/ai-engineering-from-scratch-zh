# Otimizar preferências diretas Familia

> Rafailov et al. (2023) provam que o melhor melhor de RLHF pode ser usado com dados de preferência  escrever em formato fechado, de modo que você pode saltar o modelo de recompensa evidente, política de otimização direta.

**Type:** Learn
**Languages:** Python (stdlib, 六种 preference-loss comparator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 18 · 02 (Reward hacking), Phase 10 · 08 (DPO basics)
**Time:** ~75 分钟

## Objetivos de aprendizagem

- Desde o RLHF de KL 带 KL 最优解推导 DPO 闭式形式──
- Explicação do IPO, KTO, Simpo, ORPO, BPO, que modificou automaticamente o modo de falha do DPO.
- 区分implicit reward gap和preference strength,并解释O mapa de identidade da IPO 为什么重要──
- 解释为什么 Rafailov et al. (NeurIPS 2024) 证明 DAAs 即使没有显式 RM也会过度优化──

## 问题

Objectivo do RLHF:

```text
max_pi E_{x,y~pi} [ r(x, y) ] - beta * KL(pi || pi_ref)
```

Há uma melhor solução:

```text
pi*(y|x) = (1/Z(x)) * pi_ref(y|x) * exp(r(x, y) / beta)
```

Assim, a recompensa é definida como a política ideal e o comparativo de referência:

```text
r(x, y) = beta * log(pi*(y|x) / pi_ref(y|x)) + beta * log Z(x)
```

Colocá-lo na probabilidade de preferência Bradley-Terry, depois, na função de partição.`Z(x)`Vai desaparecer, porque depende de ti.`x`O que resta é uma perda que só contém parâmetros de política, não é mais necessário um modelo de recompensa.

O problema consiste em: este teor de preferência é distribuído e a política de referência é a verdadeira âncora de modo.

## 概念

### DPO (Rafailov et al., 2023)

```text
L_DPO = -log sigmoid(
  beta * log(pi(y_w | x) / pi_ref(y_w | x))
  - beta * log(pi(y_l | x) / pi_ref(y_l | x))
)
```

Pode estar errado:

- diferença de recompensa implícita `beta * (log(pi/pi_ref)_w - log(pi/pi_ref)_l)`É um pouco mais fácil de usar.
- Esta perda vai ser escolhida e rejeitada de log-probos 往相反方向推.
- As preferências fora da distribuição (exceto em espécies raras) geram recompensas implícitas arbitrárias.

### O IPO (Azar et al., 2024)

Optimização de preferências de identidade Usar probabilidade de preferências                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

```text
L_IPO = (log(pi(y_w | x) / pi_ref(y_w | x)) - log(pi(y_l | x) / pi_ref(y_l | x)) - 1/(2 beta))^2
```

margem `1/(2 beta)`限定──preferência de força com diferença implícita-recompensa 成比例── não vai explodir──

### O TCO (Ethayarajh et al., 2024)

A otimização de Kahneman-Tversky  completamente elimina o conjunto de estruturas ⋅ dá-se uma saída de marcação única, bem como um sinal de desejável ou indesejável de 2元, que será mapeado para a utilidade da teoria prospectiva:

```text
v(x, y) = sigma(beta * log(pi(y|x) / pi_ref(y|x)) - z_ref)
```

Não há ganhos e perdas usando diferentes peso (aversion loss) ∼ vantagem é: você pode usar dados não emparejados, enquanto esse tipo de dados deve ser muito rico ∼

### SimPO (Meng et al., 2024)

Simples Optimização de Preferências 让训练信号与生成过程对齐―― completamente remover política de referência,并按长度归归化日志-概率:

```text
L_SimPO = -log sigmoid(
  (beta / |y_w|) * log pi(y_w | x)
  - (beta / |y_l|) * log pi(y_l | x)
  - gamma
)
```

Margem de utilização `gamma`Para estabilizar o treinamento, a longitude regeneração é transferida para o uso do modo de falha de longitude-bias DPO.`y_w`O processo de construção da empresa tem como objetivo aumentar a capacidade de produção de produtos.

### ORPO (Hong et al., 2024)

Odds-Ratio Optimização de Preferências em SFT padrão probabilidade de log negativo 上添加一个偏好术语:

```text
L_ORPO = L_NLL(y_w) + lambda * L_OR
L_OR = -log sigmoid(log(odds(y_w) / odds(y_l)))
```

Não há política de referência, o termo SFT é regularizer.

### BPO (submissão ICLR 2026, OpenReview id=b97EwMUWu7)

Identificar as respostas degradadas  problema: DPO 会保持排序 `y_w > y_l`Mas ...`y_w`O BPO aumentou uma única correção, a resposta escolhida aumentou a sua taxa de deslocamento.

### O DAAs  ainda                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Rafailov et al. Lei de Escalagem para a Optimização Excessiva do Modelo de Recompensa em Algoritmos de Alinhamento Direto (NeurIPS 2024) 在多个数据集和不同 KL orçamentos 下, usando políticas de treinamento DPO、IPO、SLiC。 ouro-recompensa-vs. KL 曲线呈现出与Gao et al. 相同的峰值-和崩形──implicit reward在训练期间查询出发散样;KL regularização 无法稳定这一点──

DAAs não escaparam de Goodhart. Eles simplesmente transformaram o problema de um modelo de recompensa na superfície da pessoa.

### 如何选择(2026)

- Se você tiver um grande número de dados de preferências em par: use DPO de conservado beta; se a diferença de comprimento é evidente, use SimPO。
- Se tiverem feedback binário não pareado: KTO。
- Se quiserem sair do modelo base do pipeline de uma fase:
- Se você ver em registros de DPO em registros degradados de registros escolhidos:
- Se as forças de preferência diferem muito e o DPO está em vigor e:IPO:

Cada laboratório vai executar estes cinco métodos em um grupo de avaliações, e depois selecionar o vencedor de acordo com a tarefa. Não há razão para pensar que a melhor solução de raciocínio matemático e segurança são as mesmas.


```figure
dpo-margin
```

## Usá-lo

`code/main.py`Em um conjunto de dados de preferências de brinquedos, comparar seis tipos de perdas (DPO, IPO, KTO, SimPO, ORPO, BPO), em que a verdadeira força de preferência irá variar com o par. Cada perda está na mesma amostra de 500 pares, usando uma pequena política de softmax.

## Envia-o

本课产 出 `outputs/skill-preference-loss-selector.md` dados dados dados definidos (parados versus não-parados, variáveis versus uniformes) e objetivos (singular-fase ou SFT-then-preferência),

## 练习

1. 运行 `code/main.py` Relatório DPO 和 BPO 末期选号-log-prob drop──BPO 应保留更高的选号绝对概率,请验证这一点──

2. Modificar os dados de preferência, fazer com que todos os pares tenham a mesma força.

3. 让拒绝答案的平均长度变成所选的2倍――在不改变其他任何内容的情况下, use a数值显示 DPO的长度利用以及 SimPO的修复――

4. Rafailov et al. (NeurIPS 2024) 声称 DAAs 会 oversoptimize──复现一个单点版本:绘制选选-mínus-rejected KL divergence,并观察大beta 下 DPO的过优化──

5. 阅读 BPO paper abstract (OpenReview b97EwMUWu7) 』写下 BPO 添加到 DPO 的那一行修正──对照 `code/main.py`Confirmação de implementação.

## Termos-chave

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

## Mais leitura

- [Rafailov et al. — Direct Preference Optimization (NeurIPS 2023, arXiv:2305.18290)](https://arxiv.org/abs/2305.18290)
- [Azar et al. — A General Theoretical Paradigm to Understand Learning from Human Preferences (AISTATS 2024, arXiv:2310.12036)](https://arxiv.org/abs/2310.12036) OPI
- [Ethayarajh et al. — KTO: Model Alignment as Prospect Theoretic Optimization (arXiv:2402.01306)](https://arxiv.org/abs/2402.01306)
- [Meng, Xia, Chen — SimPO (NeurIPS 2024, arXiv:2405.14734)](https://arxiv.org/abs/2405.14734)
- [Hong, Lee, Thorne — ORPO (EMNLP 2024, arXiv:2403.07691)](https://arxiv.org/abs/2403.07691)
- [BPO — Behavior Preservation Optimization (ICLR 2026 OpenReview b97EwMUWu7)](https://openreview.net/forum?id=b97EwMUWu7)
- [Rafailov et al. — Scaling Laws for RM Overoptimization in DAAs (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)
