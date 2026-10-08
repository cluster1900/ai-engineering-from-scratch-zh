# 公平性标准  群体、个体、反事实

> Três famílias constituem a equidade 文献的结构──Grupo equidade: paridade demográfica  odds igualadas  condicional utilização precisão igualdade  2012:相似个体获得相似决策;对决策映射施加 Lipschitz condição。Facilidade contrafactual(Kusner et al. 2017): Se em contrafacto o terreno mudar de atributos sensíveis, a decisão manter-se inalterada, então essa decisão é justa para o indivíduo. O resultado teórico é: 2024 (NeurIPS 2024):CF e precisão existem entre dentro e fora; um método modelo-agnóstico pode transformar o preditor ideal, mas injusto, em preditor CF, e fazer a perda de precisão.

**类型：**Aprenda
**语言：**Python (stdlib, comparação de três critérios)
**先修：**Fase 18 · 20 ((precisão),Fase 02 ((clássica ML)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- Exercer três critérios de equidade de grupo: paridade demográfica, probabilidades igualadas, precisão condicional de utilização e um resultado impossível.
- 通過 Dwork et al. 2012 的 Lipschitz formulário 描述个人的公平──
- Descrever a justiça contrafactual e a sua dependência do gráfico causal.
- Explicar as contrafactuais de retrocesso, bem como por que elas podem contornar a intervenção de atributos protegidos 问题──

## 问题

Lição 20  Discutação é a medição de preconceito  Lição 21  Discutação é a definição de medição 应服务的公平标准── estas três famílias forneceram diferentes padrões estruturais  Um modelo pode ser grupo-justo, mas individual-injusto, também pode ser contrafactualmente justo, mas grupo-injusto── escolher um padrão é uma decisão política; não há nenhum padrão é universalmente o melhor──

## 概念

### Equidade de grupo

- **Demographic parity.**P  Y = 1  A = a = P  Y = 1  A = a'), para todos os grupos de formação                                                                                                                                                                                                                                                
- **Equalized odds.**P(Y=1\\Y*=y, A=a) = P(Y=1\Y*=y, A=a')  Grupos entre os quais tem TPR e FPR similares.
- **Conditional use accuracy equality.**P  Y * = y  Y = y, A = a) = P  Y * = y  Y = y, A = a') 

Impossibilidade (Chouldechova, Kleinberg-Mullainathan-Raghavan 2017): em taxas de base 不相等时, 这三者不能同时满足──

### Equidade individual

Dwork et al. 2012── Se, para uma métrica de similaridade específica de uma tarefa, f f f x) - f x') <= L * d d x, x'), em que L é uma constante de Lipschitz, então f é individualmente justo──相似个体获得相似决策──

Esta exigência define d. É uma questão de política, não de estatística.

### A justiça contrafactual

Kusner et al. 2017── Se no modelo causal da população, quando a propriedade sensível do indivíduo é alterada de forma contrafactuada, a decisão permanece inalterada, então a decisão é contrafactualmente justa para o indivíduo.

Isto requer um DAG causal. DAG é uma escolha de modelagem. A justificação da justiça contrafactual é tão forte quanto a justificação desse DAG.

### Comércio de CF/acurateza

NeurIPS 2024 teórico:equidade contrafactual e precisão preditiva  existem dentro de trade-offs. Um método modelo-agnóstico pode transformar um preditor óptimo-mas-injustamente em preditor CF, não pagando um custo de precisão de limites.

### Contradições de retrocesso

ArXiv:2401.13935(2024 年 1 月)  Contradições tradicionais                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

Contradições de retrocesso Contradições de retrocesso: não é sobre a natureza que se interveja, mas sobre a questão de saber qual conjunto das características reais desse indivíduo produzirá resultados contraditórios.

### Reconciliação filosófica

ICLR Blogposts 2024── 时当手中因果图,满足某些群-fairness measures 会含反事实性公平── 这些三家族并非彼此正交;它们是同一层因果结构的不同面──

Isto não pode resolver teoremas de impossibilidade (tasas de base não são iguais, mas ainda impedem a justiça simultânea de grupo) mas indica que o grupo e o individuo parecem contra-estabilizar-se, em parte, devido à falta de um modelo causal e o artefato causado.

### Esta aula está em posição no meio da fase 18

Lição 20 é a medição de preconceito. Lição 21 é a definição de justiça. Lição 22 é privacidade. Lição 23 é marcação de água.


```figure
an-fairness-trilemma
```

## Use-o

`code/main.py`Construir um conjunto de dados de classificação binária de brinquedos, que contém um atributo sensível 和不相等的基率── em um classificador simples, acima calcular a paridade demográfica、quotas igualadas 和 equilíbrio de precisão de uso condicional── observar estas três métricas, cada um de cada um, não coincide── aplicar a re-ponderação da paridade demográfica,并观察它对其他两个指标的成本──

## Entrega-o

本课会生成 `outputs/skill-fairness-criterion.md` determinar uma alegação de equidade ou política, identificar qual é o critério de alegação de taxas de base desiguais de alegação, o modelo seguinte se pode satisfazer os restantes critérios, bem como a alegação depende do DAG causal 

## 练习

1. 运行 `code/main.py` relatar as três métricas de grupo em dados de referência.

2. Utilize não-sensíveis características em L2  realçar Dwork et al. 2012 de métricas de justiça individual.

3. 阅读 Kusner et al. 2017──为复习得分 构建一个简单的两特性因果 DAG,并识别它含的反事实性公平条件──

4. O artigo 204.o do Tratado de Maastricht, que estabelece a segurança dos dados, é um dos principais elementos que contribuem para a segurança dos dados.

5. A reconciliação do ICLR 2024 considera que a equidade de grupo e a equidade contrafactual são diferentes aspectos da mesma estrutura.`code/main.py`Entre os dois, elege-se três critérios, e explica-se que eles fazem a suposição causal de igual preço.

## 关键术语

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

- [Dwork et al. — Fairness through Awareness (arXiv:1104.3913)](https://arxiv.org/abs/1104.3913) Equidade individual
- [Kusner, Loftus, Russell, Silva — Counterfactual Fairness (arXiv:1703.06856)](https://arxiv.org/abs/1703.06856) equidade contrafactual
- [Chouldechova — Fair prediction with disparate impact (arXiv:1703.00056)](https://arxiv.org/abs/1703.00056) Impossibilidade
- [Backtracking Counterfactuals (arXiv:2401.13935)](https://arxiv.org/abs/2401.13935) intervenções de atributo protegido
