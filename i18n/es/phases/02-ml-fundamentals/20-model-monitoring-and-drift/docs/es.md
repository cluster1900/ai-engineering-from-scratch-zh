# Productos de la industria y la industria

>  El modelo ya implementado puede fallar en caso de falta de información.

**Type:** Build
**Languages:** Python
**Prerequisites:** 阶段 2，第 09 课（模型评估）、第 16 课（异常检测）和第 19 课（ML 系统设计）
**Time:** 约 110 分钟

## El objetivo del aprendizaje

- En sistemas salud,, entrada,, previsión y resultado cuatro niveles de selección de la vigilancia de señales
- Según la parte de la variación en la distribución conjunta, la diferenciación de variación se deriva de la diferenciación de los conceptos.
- Desde el punto de vista de la estabilidad de los grupos de cero, doble muestra de Kolmogorov-Smirnov  estadística y análisis de la cartera
- Comparar ventanas de referencia fijas con las de ruido actuales, explicar cómo el tamaño de la ventana afecta el ruido y la retraso
-  diseño combinado de la cantidad de efectos ▌las pruebas múltiples de corrección y la continuidad de las reglas de la estrategia de aviso, limitación de la información errónea
- ¿Qué tipo de movimiento necesita reentrenamiento? ¿Qué tipo de nuevo etiquetado? ¿Qué tipo de tratamiento?

##  problemas

Un modelo de riesgo de pago con una tasa de precisión del 95% en línea. Dos meses después, la campaña de marketing trajo una mayor cantidad de compras a los usuarios de la aplicación.

Durante todo el proceso, el modelo de servicio para cada solicitud regresó a HTTP 200― retraso normal, 日志 no error―. El primer signo de problema fue un informe de rechazo financiero semanas después, en el que la pérdida ya había ocurrido.

 ¿Se ha respondido el servicio de control de software, si la respuesta de control de modelo sigue siendo correcta, y si los datos siguen siendo similares a los datos durante el entrenamiento―?                                                                                                                                                                                                                                           

## 核心概念 核心概念 核心概念 核心概念

###  monitor qué

Monitoreo de cuatro niveles.  Prós-tres niveles proporcionan alerta temprana, sólo el cuarto nivel mide la corrección, pero llega más tarde.

| 层面 | 信号 | 何时可用 | 回答的问题 |
|---|---|---|---|
| 系统健康 | p50/p99 延迟、错误率、吞吐量、内存 | 立即 | 服务是否响应？ |
| 输入 | 各特征分布、缺失率、模式、新类别 | 立即 | 线上数据是否像训练数据？ |
| 预测 | 分数分布、正预测比例、默认答案占比 | 立即 | 模型行为是否与以前一致？ |
| 结果 | 准确率、精确率、校准度、业务指标 | 标签延迟后 | 模型是否仍然正确？ |

En este curso se habla principalmente de control de entrada, ya que está disponible en el etiquetado hasta el momento de su llegada.

### Tres clases de desplazamiento

输入  `x`Y etiquetas `y`La distribución conjunta puede ser escrita en dos formas:

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

Cada clase de desplazamiento cambia diferentes factores:

| 漂移 | 变化部分 | 保持不变的部分 | 支付示例 | 能观察到的监控器 |
|---|---|---|---|---|
| 协变量漂移 | `P(x)` | `P(y \| x)` | 高购物金额的应用用户变多 | 输入监控 |
| 先验漂移 | `P(y)` | `P(x \| y)` | 攻击期间欺诈率翻倍，但欺诈特征不变 | 预测与结果监控 |
| 概念漂移 | `P(y \| x)` | 输入可以不变 | 相同购物金额对应不同欺诈风险 | 只有结果监控 |

Gama 等人将 `P(y | x)`La variación se llama verdadera concept漂移, no cambiará.`P(y | x)`de la `P(x)` cambios se denominan                                                                                                                                                                                                                                                            

协变量漂移不一定有害──如果模型学好 `P(y | x)`En el caso de las empresas de alta tecnología, la precisión de cada tipo de entrada sigue siendo muy alta.

### 延迟标签

结果出现在预测后──延迟取决于问题:

| 问题 | 标签何时到达 |
|---|---|
| 广告点击 | 数秒后 |
| 未来 30 天流失 | 30 天后 |
| 银行卡欺诈 | 拒付到达时，通常数周后 |
| 贷款违约 | 数月或数年后 |

延迟期间, tienes entradas y previsiones, pero no hay resultados. 首先监控输入与预测,标签到达后进行关联, sólo en la parte de cálculo de resultados de la señal. 延迟标签的演示为500事件,因此结果监控总是观察500事件前的情况.

### referencia ventana

Cada tipo de examen de desplazamiento se compara con dos muestras:

- **参考窗口。**DATA de entrenamiento, o una parte de datos de producción revisada artificialmente―en mantenimiento fijo antes de la reentrenamiento―
- **当前窗口。**El último incidente, puede ser reciente.`N`个事件, también podría ser reciente `T`- ¿Qué pasa?

滑窗每次前进步长小于窗大小,因此连续窗重叠──滚窗每次前进完整窗大小──窗大小是一种取舍:小窗反应快,却容易判断噪音为漂移;大窗稳定,却较晚报告变化──

季节性会破坏简单的窗口方案―― muchos productos fluyen de manera diferente de los del jueves a los del jueves―― hacer referencia a un ciclo completo, o comparar la ventana actual con el del período anterior

### Indicador de estabilidad de grupo

PSI se basa en la evaluación de crédito. Se dividirá el valor de referencia en 10 cajas, normalmente en 10 puntos de referencia, para que cada caja contenga el 10% de la muestra de referencia.

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

                                                                                                                                                                                                                                                              

 En la práctica, el PSI se utiliza con frecuencia en el campo de la observación de la información: menos de 0,1 para estabilizar, 0,1 a 0,25 para desplazamiento medio, más de 0,25 para desplazamiento significativo.

### Colmogorov-Smirnov 统计量

双样本 KS 统计量                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    `D`Es la mayor diferencia vertical entre dos funciones de distribución acumulada de experiencias:

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

样本完全相同时 `D`Por 0, completamente no sobrepuesto en 1― es sin necesidad de la caja.`n * m / (n + m)`Lo tengo.

La cantidad de muestras es muy grande, incluso si la diferencia no tiene sentido real también hará que el p-valor se acerque a cero.`D`En cuanto a la eficacia, sólo`D`Y todos los valores satisfagan sus condiciones de valor en el momento de la declaración.

### 类别 características del examen de la calidad

 para los tipos de pago, así como las características de las líneas, construir dos líneas de la tabla de cada tipo de línea de pago.

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

 para `k`个类别,检验自由度为 `k - 1` Sólo en la ventana actual aparecen grandes elementos de las categorías, por lo que el examen puede responder a los nuevos valores.`chi2 / grand_total`De la raíz cuadrada.

### 告警值与误报

No cambió, cada examen todavía `alpha`La tasa de error de información. La inspección se realiza repetidamente.`alpha = 0.05`Aunque no haya cambios, se espera que haya 60 errores diarios.

Cuatro reglas para que la policía siga siendo útil:

1. **多重检验校正。**Bonferroni 校正将 `alpha`Además de la cantidad de pruebas, la presentación será completa.`alpha`设为0.01, distribuido a dos exámenes, por lo que cada examen utiliza 0.005──
2. **要求足够的效应量。**Sólo el PSI,`D`El V de Cramér también supera la valía de la policía.
3. **要求持续性。**连续 `k`个窗户出现漂移才告警──演示使用 `k = 2`¿Qué es eso?
4. **区分警告与告警。**Advertencia en el equipo, aviso al personal de la policía.

 demostración de la regla 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `alpha`Pero su V de Cramér es inferior a 0.1, por lo que la estrategia sólo registra advertencias, no emite advertencias.

### Conductor de la nueva formación

常见的重新训练触发方式有三种:

- **定期。**Cada semana o cada mes de nuevo entrenamiento.
- **漂移。** Importante características de la entrada de la transmisión de datos
- **性能。**结果指标低于参考值减减宽度范围重训时.

¿Qué puede resolver el cambio de entrenamiento?

| 漂移 | 有用的行动 |
|---|---|
| 协变量漂移，但准确率稳定 | 通常无需处理，继续观察结果指标。 |
| 协变量漂移进入数据稀少区域 | 用覆盖这些区域的近期数据重训 |
| 先验漂移 | 重新校准分数，或调整决策阈值 |
| 概念漂移 | 先收集新标签。用旧标签重训只会再次学到旧概念。 |

Después de la nueva formación, se puede probar un nuevo modelo en los datos marcados recientes.

```figure
mlprod-drift-psi
```

## Desde la construcción

`code/main.py`El código medio sólo utiliza la biblioteca estándar.

### Paso 1: la caja de la información y el PSI

箱边界 proviene de la referencia十分位数.`bisect_right`找到每个值所属的盒子──

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

### Paso 2: KS 统计量 y su p                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

Simultáneamente, se recorre dos ejemplos de ordenamiento. Para cada valor diferente, primero se recorre todos los repeticiones de ese valor entre los ejemplos, se vuelve a comparar la proporción acumulada.

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

P 值使用 Kolmogorov 分布的级数 `2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`, entre ellos `lambda = sqrt(n * m / (n + m)) * D`¿Qué es eso?

### Paso 3: Carga de control

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

### Paso 4: Control de ventanas y desplazamientos

`SlidingWindow`¿ Qué ?`deque`保存最近 `size`¿Qué ocurre?`DriftMonitor`Sólo cuentas una vez en referencia`check`Método para cada valor de la característica de regreso de PSI `D`Y KS p                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

### Sección 5: estrategia de policía

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

`update`En el número de veces consecutivas de alcanzar el requisito de vuelta en la ventana `ALERT`, regreso a la primera ventana de la policía después de la denuncia .`resolved`¿Qué es eso?

### Paso 6: Inserir datos desplazados

Los datos contienen 9000 eventos de pago, cada uno con un`amount`¿Qué es esto?`channel`Y el fraude`label`Se divide en cuatro secciones:

| 事件 | 金额 | 渠道比例（app、store、web） | 标签边界 | 变化 |
|---|---|---|---|---|
| 0 到 2999 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 参考期 |
| 3000 到 4999 | 均值 118，标准差 24 | 60%、10%、30% | 120 | 协变量漂移 |
| 5000 到 6499 | 均值 100，标准差 20 | 35%、15%、50% | 120 | 恢复正常 |
| 6500 到 8999 | 均值 100，标准差 20 | 35%、15%、50% | 105 | 概念漂移 |

模型 fue adaptado a eventos anteriores a 2000  `amount`值──窗口大小为 500 事件,每次移动 250 个──标签延迟 500 事件到达──

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

Se trata de un proyecto de investigación.

- **协变量漂移。**Desde el evento 3000  comenzó,`amount`告警在 3500 出現──由于 las reglas de etiquetado no han cambiado, la tasa de precisión se mantiene en 0.89 a 0.95──
- **恢复。**输入在 5000 恢复正常, dos notificaciones en 5500 解除.
- **概念漂移。**Desde 6500  comenzó, la entrada no cambió, por lo que el monitor de entrada se mantuvo quieto. La tasa de precisión se redujo de 0.946  a 0.76  a 0.79 ⋅ la tasa de precisión se produjo en 7500                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

## Utiliza el instrumento

**scipy。** `scipy.stats`Para realizar estos dos tipos de pruebas, la estadística y el logro de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad de la realidad.

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

Estamos en el mismo tiempo que lo haremos.`ks_statistic`¿Qué es esto?`chi_square_test`Conforme a la muestra de 200 grupos, la diferencia relativa entre el valor de KS y el resultado de la muestra alcanza el 18% del valor de la muestra; la diferencia máxima se encuentra en un punto de p muy pequeño.

差异来自方法──我们的代码使用极限 Kolmogorov 分布──默认情况下, dos grupos de muestras no superan el valor de 10.000 个,`ks_2samp`Utiliza métodos precisos. Su modo de aproximación utiliza una distribución de muestras limitada, y se tomará una cantidad de muestras efectiva en su totalidad.`chi2_contingency`默认采用Yates 连续性校正, por lo tanto, la estadística en este caso también es diferente.

**监控库。**Muchos de los registros de datos disponibles incluyen estos registros y informes:

- **Evidently**按列选择漂移检验──参考数据不超过 1000 行时,数值列用KS,类别列用卡方──数据更大时,使用Wasserstein 距离和Jensen-Shannon 散度,值为0.1──PSI es uno de los otros métodos disponibles──
- **NannyML**En el etiquetado se alcanza la evaluación previa del rendimiento del modelo. Su evaluación de rendimiento basada en la confianza (CBPE) utiliza el modelo de probabilidad de pronóstico, requiere la probabilidad de que haya pasado una buena calificación.
- **TensorFlow Data Validation**Comparación de datos continuos entre los diferentes tipos de datos. Se comparará la información de entrenamiento con la información de servicio, que se analizará en el curso de almacenamiento de datos.

Desde el código de cero se muestra el contenido de estas herramientas de cálculo.

 para la aplicación de LLM, la infraestructura de la fase [LLM 可观测性课](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md)介绍 Seguimiento y evaluación de herramientas.

## 交付成果  交付成果                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

本课产 出  `outputs/skill-drift-monitoring.md` Esta habilidad se aplica a la supervisión de nuevos modelos de planificación y a la evaluación de las autoridades de desplazamiento: qué niveles de desplazamiento provocaron la denuncia, qué tipos de desplazamientos cumplen con la evidencia, y qué tipo de espera, recalificación, recogida de etiquetas o reentrenamiento.

##  ejercicios

1. Usando las ventanas de 200 y 2000  eventos de datos de circulación  Acordar los eventos 3000  anteriores a las advertencias erróneas y la notificación de retraso 
2.  configuración `n_tests=1`¿Qué es esto?`patience=1`¿Qué es esto?`min_cramers_v=0`, estadísticas de 5000 a 6500 de las denuncias de la fase de limpieza.
3. Añadir un valor medio por cada 100 eventos aumenta 0.01 de características, encontrar el PSI y KS 哪哪个先响应──
4. En la misma caja de distribución de 10 puntos, se realiza la distancia Jensen-Shannon, en cada ventana con PSI comparado.
5. Para el modelo de la proporción de pronóstico correcto, añadir control, explicar por qué se mantiene quieto durante el concepto de desplazamiento.

## 关键术语: "El hombre es un hombre"

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

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation)El método de adaptación y la modalidad de movimiento real y virtual
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953): para el análisis de desplazamiento de dos muestras de análisis
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785):漂移检测、理解和适应方法 (en inglés: "Método de evaluación")
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/): muestra y número de cuentas de cómo afectan a la IPS
- [scipy.stats.ks_2samp documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html)Dos ejemplos: método de precisión y de aproximación de la P                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift): por tipo de lista y tamaño de datos seleccionar el control de forma preferente
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html): CBPE  y sus hipótesis
