# Produção de modelos de monitorização: dados漂移与概念漂移

> O modelo já implantado pode falhar em caso de falta de informação. Na realidade, o modelo continua a retornar ao número de pontos, apenas a monitorização pode revelar essa diferença.

**Type:** Build
**Languages:** Python
**Prerequisites:** 阶段 2，第 09 课（模型评估）、第 16 课（异常检测）和第 19 课（ML 系统设计）
**Time:** 约 110 分钟

## Objectivo de aprendizagem

- Em sistemas saúde ∞ entrada ∞ previsão e resultado ∞ quatro níveis de seleção de sinais de monitoramento
- De acordo com a divisão de variação entre a distribuição conjunta, a diferença entre a variação de variação e a diferença de conceito
- Do zero realçar índice de estabilidade de grupos, duplo exemplo Kolmogorov-Smirnov  Estatística e análise de caráter
- Comparar a janela de referência fixa com a janela atual de deslizamento, explicar como o tamanho da janela afeta o ruído e o atraso
- design combinado com a quantidade de efeitos ▌verificação múltipla de correcção e regulamentação de continuidade estratégias de aviso, limitação de erro de comunicação
- 判断哪种漂移需要重新训练 哪种需要新标签 哪种无需处理

## 问题

Um modelo de risco de pagamento com 95% de precisão. Dois meses depois, a campanha de marketing trouxe uma quantidade de compras mais alta para os usuários da aplicação.

Durante todo o processo, o modelo de serviço para cada pedido retornou HTTP 200── atraso normal, 日志 não errores── o primeiro sinal de problema foi um relatório de rejeição financeira semanas depois, quando a perda já ocorreu─

 Serviço de verificação de monitoramento de software se respondeu, resposta de verificação de modelo se continua correta, bem como dados se ainda são como os de treinamento.  Este curso é dedicado a construção de estatísticas, janelas e estratégias de aviso. Você vai injetar artificialmente dois fluxos de síntese de variantes para executá-los, observe quais monitores responderão a quais variantes

## 核心概念

###  monitor que

 Monitoramento em quatro níveis.  Primeiro três fornecem antecedência precoce, apenas o quarto nível de medição é correto, mas chega mais tarde.

| 层面 | 信号 | 何时可用 | 回答的问题 |
|---|---|---|---|
| 系统健康 | p50/p99 延迟、错误率、吞吐量、内存 | 立即 | 服务是否响应？ |
| 输入 | 各特征分布、缺失率、模式、新类别 | 立即 | 线上数据是否像训练数据？ |
| 预测 | 分数分布、正预测比例、默认答案占比 | 立即 | 模型行为是否与以前一致？ |
| 结果 | 准确率、精确率、校准度、业务指标 | 标签延迟后 | 模型是否仍然正确？ |

Esta aula discute principalmente a monitorização de entrada, pois ela está disponível antes de ser etiquetada.

### Três tipos de mudanças

输入 `x`和标签 `y`A distribuição conjunta pode ser escrita em duas formas:

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

Cada classe de mudanças varia por diferentes fatores:

| 漂移 | 变化部分 | 保持不变的部分 | 支付示例 | 能观察到的监控器 |
|---|---|---|---|---|
| 协变量漂移 | `P(x)` | `P(y \| x)` | 高购物金额的应用用户变多 | 输入监控 |
| 先验漂移 | `P(y)` | `P(x \| y)` | 攻击期间欺诈率翻倍，但欺诈特征不变 | 预测与结果监控 |
| 概念漂移 | `P(y \| x)` | 输入可以不变 | 相同购物金额对应不同欺诈风险 | 只有结果监控 |

Gama 等人将 `P(y | x)`O que se chama de mudança é o verdadeiro conceito de mudança, não vai mudar.`P(y | x)`de `P(x)`变化称为虚拟漂移―― sua composição também se divide em突发、增量、渐进和概念复现――

协变量漂移不一定有害──如果模型学好 `P(y | x)`A taxa de precisão pode ainda diminuir quando o fluxo se move para a formação de um padrão raro ou perto da fronteira de decisão.

### 延迟标签

结果出现在预测后──延迟取决于问题:

| 问题 | 标签何时到达 |
|---|---|
| 广告点击 | 数秒后 |
| 未来 30 天流失 | 30 天后 |
| 银行卡欺诈 | 拒付到达时，通常数周后 |
| 贷款违约 | 数月或数年后 |

Durante o período de atraso, você tem entrada e previsão, mas não tem resultados. Antes de monitorar a entrada e previsão, o rótulo é conectado após a chegada, apenas em parte de dados de resultados marcados.

### referência de janela

Cada tipo de exame de deslocamento é comparado a duas amostras:

- **参考窗口。**DATA de treinamento, ou um fragmento de dados de produção verificado artificialmente.
- **当前窗口。**O último incidente, pode ser recente.`N`O que aconteceu foi recente.`T`- Não.

A janela de rolagem é uma forma de trocar: a janela de rolagem é rápida, mas fácil de distinguir o ruído como deslocação; a janela está estável, mas é mais tarde de relatar mudanças.

季节性会破坏简单的窗口方案―― muitos produtos são diferentes de circulação de um dia a outro.

### Indicador de estabilidade do grupo

O PSI é baseado em avaliações de crédito. O valor de referência dividido em 10 caixas, normalmente dividido em 10 de referência, fazendo com que cada caixas contêm 10% da amostra de referência.

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

Uma caixa de proporção é zero, o que faz com que o número seja infinito, portanto, cada proporção é cortada para 0,0001 e assim para um número justo menor.

 na prática, o uso habitual de zonas fixas explica a PSI: inferior a 0,1 para estabilizar, 0,1 para 0,25 para desvio médio, superior a 0,25 para desvio significativo.  Estes são práticas experienciais, não são testes estatísticos.  PSI                                                                                                                                                                                                                                                                                                                                                                                                                                                            

### Kolmogorov-Smirnov 统计量

双样本 KS 统计量 `D`É a maior diferença vertical entre duas funções de acumulação de experiências:

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

样本完全相同时 `D`Por 0, totalmente não sobreposto quando é 1. Não é necessário fazer uma caixa.`n * m / (n + m)`- Não.

A quantidade de amostras é muito grande, mesmo que a diferença sem sentido real também faça o p-valor se aproximar de zero.`D`Como efeito, apenas`D`E todos os valores satisfazem as suas condições de valor.

### 类别 Características do teste de caráter

Para os tipos de pagamento, como os padrões, construção de duas linhas de referência, presente e presente, para cada categoria de linha de pagamento, o número de expectativas de cada unidade de linha é determinado pelo número total de linhas e pelo número total de linhas:

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

Para o`k`个类别,检验自由度为 `k - 1` As categorias que aparecem na janela atual contribuem com grandes quantidades, portanto, o teste pode responder ao novo valor.`chi2 / grand_total`De raízes quadradas.

### 告警值与误报

Não há mudanças, cada teste ainda está.`alpha` Rate de erro de informação:  Monitoring will repeat many inspections:  If per hour check 50 个特征, use `alpha = 0.05`Mesmo sem mudanças, espera-se que haja cerca de 60 erros diários. Até chegar a esse número, as pessoas vão parar de ler os avisos.

4 regras para manter a polícia útil:

1. **多重检验校正。**Bonferroni 校正将 `alpha`Além de um número de exames, a demonstração será completa.`alpha`Se for 0.01, distribuir para dois exames, por isso cada teste usa 0.005―.
2. **要求足够的效应量。**Só o PSI,`D`Ou o V de Cramér também excede o valor de apenas dizer a polícia.
3. **要求持续性。**连续 `k`个窗户出现漂移才告警──演示使用 `k = 2`- Não.
4. **区分警告与告警。**Aviso para entrar no painel, aviso para o pessoal de notificação.

 demonstração de regra 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `alpha`Mas o seu V de Cramér é inferior a 0,1, por isso a estratégia só registra advertências, não divulga advertências.

### 重新训练的触发条件

Há três formas de reabilitação:

- **定期。**Semanal ou mensal re-trainamento. Simples, mas sem mudança, também re-trainamento.
- **漂移。** Importantes características de entrada e deslocamento continuam a superar o valor de tempo de re-tração
- **性能。**Resultados indicadores inferiores a valores de referência redução do alcance de tolerância

漂移类型决定重新训练能解决什么:

| 漂移 | 有用的行动 |
|---|---|
| 协变量漂移，但准确率稳定 | 通常无需处理，继续观察结果指标。 |
| 协变量漂移进入数据稀少区域 | 用覆盖这些区域的近期数据重训 |
| 先验漂移 | 重新校准分数，或调整决策阈值 |
| 概念漂移 | 先收集新标签。用旧标签重训只会再次学到旧概念。 |

Após o novo treino, testar novos modelos em dados marcados recentes, adotando as sombras do curso de design do sistema e publicando a fase de pinça de arroz, e depois repostar a janela de referência para os novos dados do treinamento.

```figure
mlprod-drift-psi
```

## Desde zero construção

`code/main.py`O código do meio é apenas usado em uma biblioteca de padrões.

### Primeiro passo:

O "box border" vem de uma referência de 10 lugares.`bisect_right`Encontrar cada valor que pertence à caixa.

```python
def quantile_edges(reference: list[float], bins: int = 10) -> list[float]:
    ordered = sorted(reference)
    n = len(ordered)
    edges = [ordered[min(n - 1, (n * i) // bins)] for i in range(1, bins)]
    return sorted(set(edges))


def psi_from_fractions(expected: list[float], actual: list[float], eps: float = 1e-4) -> float:
    total = 0.0
    for e, a in zip(expected, actual):
        e, a = max(e, eps), max(a, eps)
        total += (a - e) * math.log(a / e)
    return total
```

### 第 2 步:KS 统计量及其 p 值

Ao mesmo tempo, atravessamos duas amostras de ordem. Para cada valor diferente, primeiro os dois grupos de amostras que atravessaram esse valor, re-comparar a proporção acumulada.

```python
def ks_statistic(sample_a: list[float], sample_b: list[float]) -> float:
    a, b = sorted(sample_a), sorted(sample_b)
    n, m = len(a), len(b)
    i = j = 0
    d = 0.0
    while i < n and j < m:
        x = min(a[i], b[j])
        while i < n and a[i] <= x:
            i += 1
        while j < m and b[j] <= x:
            j += 1
        d = max(d, abs(i / n - j / m))
    return d
```

P 值使用 Kolmogorov 分布 的级别数 `2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`, entre os `lambda = sqrt(n * m / (n + m)) * D`- Não.

### 第3 步: Cará-

`chi2_sf`通过正则化上不完全马函数计算卡方生存函数,小参数使用级数,大参数使用连分式──`chi_square_test`构建两行表、计算统计量,并返回 p 值和 Cramér's V──

```python
def chi_square_test(reference_counts: dict[str, int], current_counts: dict[str, int]) -> ChiSquareResult:
    categories = [c for c in sorted(set(reference_counts) | set(current_counts))
                  if reference_counts.get(c, 0) + current_counts.get(c, 0) > 0]
    rows = [[reference_counts.get(c, 0) for c in categories], [current_counts.get(c, 0) for c in categories]]
    row_totals = [sum(r) for r in rows]
    grand = sum(row_totals)
    if len(categories) < 2 or 0 in row_totals:
        return ChiSquareResult(0.0, 0, 1.0, 0.0)
    statistic = 0.0
    for col, _ in enumerate(categories):
        col_total = rows[0][col] + rows[1][col]
        for r in range(2):
            expected = row_totals[r] * col_total / grand
            statistic += (rows[r][col] - expected) ** 2 / expected
    dof = len(categories) - 1
    return ChiSquareResult(statistic, dof, chi2_sf(statistic, dof), math.sqrt(statistic / grand))
```

### § 4o Passo: Janela e monitor de deslocamento

`SlidingWindow`- Não .`deque`保存最近 `size`- O que aconteceu?`DriftMonitor`Apenas calcular uma vez referência`check`Método para cada característica de valor retornar PSI,`D`和 KS p  值,并为每个类特征返回卡方检查结果──

### 第5 步: estratégia de informação

策略将每组指标转为等级,并逐信号统计连续漂移窗口数:

```python
def level(self, metrics: dict[str, float]) -> str:
    if "psi" in metrics:
        if metrics["psi"] >= self.psi_drift or (metrics["ks"] >= self.ks_drift and metrics["ks_p"] < self.alpha):
            return "drift"
        return "warn" if metrics["psi"] >= self.psi_warn else "ok"
    if metrics["p"] < self.alpha and metrics["v"] >= self.min_cramers_v:
        return "drift"
    return "warn" if metrics["p"] < self.alpha else "ok"
```

`update`Retorno da janela de espera`ALERT`, em primeiro plano , depois da polícia voltar .`resolved`- Não.

### § 6o Passo: Inserir fluxos de dados

Os dados contêm 9000 eventos de pagamento, cada um com um`amount`- Não.`channel`E fraude .`label`- É dividido em quatro partes.

| 事件 | 金额 | 渠道比例（app、store、web） | 标签边界 | 变化 |
|---|---|---|---|---|
| 0 到 2999 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 参考期 |
| 3000 到 4999 | 均值 118，标准差 24 | 60%、10%、30% | 120 | 协变量漂移 |
| 5000 到 6499 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 恢复正常 |
| 6500 到 8999 | 均值 100，标准差 20 | 35%、15%、50% | 105 | 概念漂移 |

O modelo foi adaptado a eventos anteriores a 2000 .`amount`值──窗口大小为 500 事件,每次移动 250 个──标签延迟 500 事件到达──

```bash
python3 code/main.py
```

```console
  end    PSI   KS D   chi2 p    acc  levels (amount/channel/accuracy)  events
 3000  0.010  0.041  3.0e-01  0.932  ok/ok/ok
 3250  0.152  0.163  7.6e-06  0.924  drift/warn/ok
 3500  0.463  0.298  2.8e-26  0.936  drift/drift/ok                     ALERT amount
 3750  0.609  0.343  3.5e-35  0.942  drift/drift/ok                     ALERT channel
 ...
 5500  0.026  0.044  2.6e-01  0.898  ok/ok/ok                           resolved amount, resolved channel
 ...
 7250  0.040  0.048  7.1e-01  0.848  ok/ok/drift
 7500  0.022  0.039  6.1e-01  0.778  ok/ok/drift                        ALERT accuracy
```

分三部分理解结果:

- **协变量漂移。**Desde o evento 3000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `amount`A taxa de precisão permanece entre 0,89 e 0,95
- **恢复。**输入在 5000 恢复正常, dois notificações foram levantadas em 5500 .
- **概念漂移。**A partir de 6500 , a entrada não mudou, portanto, o monitor de entrada permaneceu quieto. A taxa de precisão desceu de 0,946  para 0,76  para 0,79 ⋅ a taxa de precisão de aviso apareceu em 7500 ⋅ 1000 eventos, dos quais 500 foram causados pelo atraso de etiquetas.

## Utilize já usado

**scipy。** `scipy.stats`Para realizar estes dois tipos de verificação, a estatística é de zero em zero.

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

Nós vamos ser em um momento de prova.`ks_statistic`- Não.`chi_square_test`Compatível com o Scipy 1.18.1 Controle. KS 统计量、卡方统计量和卡方 p 值在浮点精度内一致──. Em 200 组随机样本对, KS p 值与 scipy 结果的相对差最大达到 scipy 值的18%.

差异来自方法──我们的代码使用极限 Kolmogorov 分布──默认情况下,两组样本都不超过10,000 个值时,`ks_2samp`Utilize métodos precisos. Seu modo de aproximação usa distribuição de amostras limitada, e vai tomar uma quantidade de amostras válida.`chi2_contingency`默认采用Yates 连续性校正, portanto, a estatística também é diferente neste caso.

**监控库。**Muitos bancos abertos incluem estes exames e relatórios.

- **Evidently**按列选择漂移检验──参考数据不超过 1000 行时,数值列用 KS,类别列用卡方──数据更大时,使用Wasserstein 距离和Jensen-Shannon 散度,值为0.1──PSI é um dos outros métodos de seleção──
- **NannyML**Em seu primeiro trabalho, o professor de Ciências da Informação (EIT) disse que o estudo foi feito em uma área de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de pesquisa de
- **TensorFlow Data Validation**Comparar dados de treinamento com dados de serviço, que será abordado em curso.

A partir do código zero, os instrumentos de cálculo são apresentados.

 para a aplicação do LLM, fase infraestrutura [LLM 可观测性课](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md)Introdução de ferramentas de rastreamento e avaliação.

## 交付成果

本课产 出 `outputs/skill-drift-monitoring.md` Esta habilidade é utilizada para o novo modelo de planejamento e monitoramento, e para o diagnóstico de polícias de deslocamento: quais são as camadas que provocaram a deslocamento, quais são as que correspondem às provas, bem como a espera, a reclassificação, a recolha de etiquetas ou a reformulação.

## 练习

1. Usando a janela de 200 e 2000  eventos de operação de dados.
2.  configuração `n_tests=1`- Não.`patience=1`- Não.`min_cramers_v=0`, estatisticas de 5000 a 6500
3. Adicione um valor médio por 100 eventos aumentando 0,01 de características, para descobrir qual é a primeira resposta do PSI e do KS.
4. Em 10 pontos diferentes, a Jensen-Shannon Distância é realizada em cada janela com a PSI.
5. Para a taxa de previsão correta do modelo, adicione a monitorização, explicando por que ele permanece quieto durante o movimento do conceito.

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|----------------|----------------------|
| 数据漂移 | “数据变了” | 相较参考窗口，输入、预测或标签分布发生变化 |
| 协变量漂移 | “出现新类型用户” | `P(x)` 变化，而 `P(y \| x)` 不变 |
| 先验漂移 | “正样本更多了” | `P(y)` 变化，而 `P(x \| y)` 不变，也称标签偏移 |
| 概念漂移 | “游戏规则变了” | `P(y \| x)` 变化，相同输入对应不同正确答案 |
| 参考窗口 | “基准数据” | 与每个当前窗口比较的固定样本，通常是训练数据 |
| PSI | “稳定性分数” | 对各箱的“当前占比减参考占比”乘两者比值的对数求和，具有对称性 |
| KS 统计量 | “KS 检验” | 两个经验累积分布函数之间的最大差距 |
| Cramér's V | “类别效应量” | 将卡方统计量缩放到 0 到 1 范围的量 |
| 标签延迟 | “真实答案晚些到” | 从预测到真实结果到达之间的时间 |
| 告警疲劳 | “通知太多” | 大多数告警都是误报，导致人们忽略告警 |

## 延伸阅读

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation): real e virtual, modo e método de adaptação
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953): para o controlo de deslocamento
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785)O método de aplicação da lei de aplicação
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/): quantidade de amostras e número de unidades de produção
- [scipy.stats.ks_2samp documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html): Duas amostras KS 检验的精确与渐近 p 值方法
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift): por categoria tipo e tamanho de dados seleção de verificação
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html): CBPE  e suas hipóteses
