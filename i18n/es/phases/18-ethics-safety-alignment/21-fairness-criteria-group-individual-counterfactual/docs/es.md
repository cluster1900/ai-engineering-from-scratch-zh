# 公平性标准  群体、个体、反事实

> Tres familias constituyen la equidad 文献的结构──Grupo equidad:paridad demográfica、cotas igualadas、acurateza de uso condicional igualdad  En un sentido medio, entre grupos protegidos tiene similar tasa de diferencia──Individual equidad(Dwork et al. 2012: similar personalidad obtenida similar decisión;对决策映射施加 Lipschitz condición。Justicia contrafactual(Kusner et al. 2017): Si en contrafacto el cambio de la posición de la tierra en la decisión se mantiene en constante, entonces la decisión sobre el individuo es justo. El resultado teórico del año 2024 es el siguiente: La corrección de la información existente entre la precisión y la corrección de la información. Un método modelo-agnóstico puede convertir el predictor óptimo pero injusto en predictor de la información, y hacer que la precisión pierda un límite.

**类型：**Aprende
**语言：**Python (stdlib, comparación de tres criterios)
**先修：**Fase 18 · 20 ((previación),Fase 02 ((clásico ML)
**时间：** 60 minutos

## El objetivo del aprendizaje

- Expresar tres criterios de equidad de grupo: paridad demográfica, probabilidades igualadas, igualdad de precisión de uso condicional y un resultado imposible.
- 通過 Dwork et al. 2012 de la fórmula de Lipschitz  describir la equidad individual。
-  describir la equidad contrafactual  y su dependencia del gráfico causal 
- explicar las contrafactuales de retroceso y por qué pueden evitar la intervención de atributos protegidos 问题──

##  problemas

Lección 20 Discuta sobre medición de sesgo. Lección 21 Discuta sobre la definición de medición 应服务的公平标准―― estas tres familias han dado diferentes estándares estructurales  Un modelo puede ser justo en grupo pero individual-injusto, también puede ser contrafactualmente justo pero en grupo-injusto― seleccionar algún estándar es una decisión política; no hay ningún estándar que sea el más favorable universal―

## 概念

### Equidad en grupo

- **Demographic parity.**P  Y=1  A=a = P  Y=1  A=a'), para todos los grupos de formación                                                                                                                                                                                                                                                
- **Equalized odds.**P(Y=1\\Y*=y, A=a) = P(Y=1\Y*=y, A=a')\
- **Conditional use accuracy equality.**P  Y * = y  Y = y, A = a) = P  Y * = y  Y = y, A = a')  entre grupos tienen el mismo valor predictivo

Impossibilidad (Chouldechova, Kleinberg-Mullainathan-Raghavan 2017): en las tasas de base 不相等时, 这三者不能同时满足──

### La equidad individual

Dwork et al. 2012──Si para una métrica de similitud específica de la tarea d, mapa de decisión f 满足 f x) - f x') <= L * d x, x'), de los cuales L es una constante de Lipschitz, entonces f n es individualmente justo──相似个体获得相似决策──

Esto exige definir la política, no la estadística.

### La equidad contrafactual

Kusner et al. 2017― Si en el modelo causal de la población, cuando la sensibilidad de un individuo se altera de manera contrafactual, la decisión permanece inalterada, entonces la decisión es contrafactualmente justa para el individuo.

Esto requiere un DAG causal. DAG es una opción de modelado. La justificación de la equidad contrafactual es tan fuerte como la de este DAG.

### Compromiso entre CF y precisión

NeurIPS 2024 teórica:equidad contrafactual y precisión predictiva  exist entre dentro en el trade-off―un método modelo-agnóstico  puede convertir un predictor óptimo pero injusto  en predictor CF,并付出有界的精度成本―.

### Contrarreloj de retroceso

ArXiv:2401.13935(2024 年 1 月)  Contraste tradicional                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Contrarrestar las contrafacturas en la dirección inversa: no se interviene en la naturaleza, sino que se pregunta qué combinación de las características reales de ese individuo producirá un resultado contrafactual.

### Reconciliación filosófica

ICLR Blogposts 2024── en el gráfico causal 时,满足某些群-fairness measures 会含counterfactual fairness── estas tres familias no se relacionan bien entre sí; son diferentes aspectos de la misma estructura causal de nivel inferior──

Esto no puede resolver los teoremas de imposibilidad (la tasa de base no es igual, pero todavía impide la equidad simultánea del grupo) pero indica que entre el grupo y el individuo / contrafacto se parece a la creación, en parte debido a la falta de un modelo causal claro y el artefacto causado.

### Esta clase está en la fase 18

Lección 20 es la medición de sesgos. Lección 21 es la definición de equidad. Lección 22 es la privacidad.


```figure
an-fairness-trilemma
```

## Usalo

`code/main.py`Construir un conjunto de datos de clasificación binaria de juguete, en el que se contiene un atributo sensible 和不相等的基率── en un clasificador simple, calcular la paridad demográfica 上等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-fairness-criterion.md` determinar una afirmación o política de equidad, identificar cuál es el criterio de su afirmación  determinar si el modelo de la afirmación de tasas de base desiguales puede satisfacer los demás criterios, así como si la afirmación depende de la DAG causales 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Reporte de las tres métricas de grupo de los datos de memoria.

2. Utiliza características no sensibles en L2  Implementar Dwork et al. 2012 de la métrica de justicia individual.

3. 阅读 Kusner et al. 2017──为复习得分 构建一个简单的两特性因果 DAG,并识别它含的反事实性公平条件──

4. El artículo 2024 retroactiva contrafactos 论文 evitó la intervención de los atributos protegidos 描述一个

5. La reconciliación del CICLR 2024 considera que la equidad de grupo y la equidad contrafactual son diferentes aspectos de la misma estructura.`code/main.py`Entre los dos criterios, la elección de tres y la explicación de los dos, hacen que sean de la misma naturaleza.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Demographic parity | “equal rates” | P(Y=1 | A=a) 在群体之间相等 |
| Equalized odds | “equal TPR/FPR” | 群体之间相等的 true-positive 和 false-positive rates |
| Conditional use accuracy | “equal PPV/NPV” | 群体之间相等的 predictive values |
| Individual fairness | “Lipschitz condition” | 相似个体获得相似决策 |
| Counterfactual fairness | “causal alteration invariance” | 在 counterfactual attribute alteration 下决策保持不变 |
| Backtracking counterfactual | “explain via actuals” | Counterfactual 是从 outcome 向后推理，而不是从 attribute 向前推理 |
| Impossibility theorem | “the three conflict” | Chouldechova / KMR 2017：在 base rates 不相等时，group criteria 相互排斥 |

## 延伸阅读

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) equidad individual
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) equidad contrafactual
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056) Imposible
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) nuevas modalidades de intervenciones de atributos protegidos
