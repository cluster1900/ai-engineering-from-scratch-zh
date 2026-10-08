# WMDP e Avaliação de Capacidade de Uso

> Li et al., "O Benchmark WMDP: Medir e Reduzir o Uso Malicioso com Desaprendizagem" (ICML 2024, arXiv:2403.03218)。 abrangendo a biossegurança (1.520)、cibersegurança (2.225) ̇ e química (412) 4.157 Pathos electives.

**类型：**- aprendizagem
**语言：**Python (stdlib, arame de avaliação de elevação em forma de WMDP)
**先修要求：**Fase 18 · 16 (toalharia de equipes vermelhas), Fase 14 (engenharia de agentes)
**时间：**- 60 minutos.

## Objectivo de aprendizagem

- Descrever os três domínios do WMDP, o número de problemas, bem como a "zona amarela" sele standard
-  Explicar a RMU, e por que o WMDP  é tanto uma avaliação como um padrão de referência para o desaprendizagem
- 描述 2024-2025 的升起 叙事:"轻微升起" -> "处于临界点" -> "不足以排除ASL-3"──
- Diferença em relação ao aumento dos novos e aos especialistas.

## 问题

双用途能力是每个实验室前沿安全框架 (Leção 18) 下面测量问题──问题是: modelo X é ou não a substância aumentou a capacidade de novos usuários em bio-químicos ou cibernéticos causarem danos em grande escala?

## 概念

### "zona amarela"

Estes problemas exigem conhecimento sobre a proximidade e a promoção de processos nocivos, mas não são diretamente sintetizados.

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
- Biosecuridade: 1.520
- Cibersegurança: 2.225
- Química: 412

Muitos modelos de seleção não são solicitados para ajudar em qualquer coisa; portanto, pode ser medida em situações sem provocar comportamentos prejudiciais.

### RMU  Representação Desdirecção para Desaprendizagem

配套的不学习方法──应用于LLaMa-2-7B 后,它将 WMDP 分数降至接近随机,同时将MMLU 和其他通用能力基准 保持在几个百分点内──已发表的方法是随后的每篇生物化学-cyber不学习论文的不学习基线──

### 2024-2025 elevação 叙事

Três fases:

1. **2024 "轻微 uplift"。**O relatório de avaliação de preparação/RSP, de OpenAI e Anthropic, afirma que, para os novos empreendedores que tentam realizar tarefas bio-adjacentes, os modelos têm pequenas vantagens em relação à pesquisa na Internet.

2. **2025 年 4 月 "处于临界点"。**O Relatório de Preparação do OpenAI v2 refere que o modelo "está empenhado em ajudar significativamente os novos a fabricar pontos críticos de ameaças biológicas conhecidas"― não é uma declaração de capacidade, mas um aviso de que o ponto crítico está próximo―.

3. **Anthropic 的 2025 生物武器获取试验。**Uma lição contém um estudo controlado de participantes novos, que mede a taxa de sucesso relativa das tarefas de fase de obtenção. O relatório é de 2,53x aumento.

### Comparado com o novo versus o especialista absolutamente

Uma diferença importante:

- **相对于新手的 uplift。**O modelo ajuda muito os não-especialistas? É um número multiplicado.
- **专家绝对能力。**O modelo pode gerar quantas informações em seu maior esforço?

Leção 18) simultaneamente dirigida a dois: "O modelo não pode dar ao novo um aumento suficiente para executar" Adicionalmente, "o especialista não pode extrair informações não reveladas do modelo"".

### 测量陷

O WMDP é um agente de capacidade, e não uma medida de implantação. Um modelo com alta pontuação no WMDP, em prática, depende de se pode ser utilizado por novos usuários:
- 引出抗性(不触发安全过器而取出能力有多难)
- 默会知识 (necessidade de habilidades de laboratório em vez de informações)
- 执行障碍(采购、设备)

O Anthropic's 2025 Bioweapons Obtaining Experiment (BIAO) incorpora a nova estratégia de capacitação no estilo WMDP: ela mede a taxa de sucesso das missões reais, e não a capacidade de escolha múltipla.

### Está na fase 18 .

Lições 12-16 são sobre os modelos de ataque e de defesa. Lição 17 é capacitação de uso duplo nível de segurança fronteiriça. Lição 18) Avaliação de medidas. Lição 30 é o actual 2026 ano de ciber/bio/química/nuclear elevação.


```figure
al-wmdp-yellow-zone
```

## Use-o

`code/main.py`Construir um brinquedo de edição em forma de WMDP. Um modelo simulado 会在按类别分组问题上测试;报告每个领域的分数.

## Entrega-o

本课会生成 `outputs/skill-wmdp-eval.md` "Nossos modelos não ajudarão significativamente no comportamento relacionado às armas biológicas"), que irá auditá-los: quais benchmarks foram executados, avaliar quais rotas foram utilizadas para rejeitar a conclusão bruta versus a política), bem como se o novo estudo foi complementado por vários resultados de seleção.

## 练习

1. 运行 `code/main.py` Relatório de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho de desempenho

2. Para brincar WMDP  aumentar o quarto campo por exemplo radiológico  especificar duas categorias de zonas amarelas  Exemplaridade do tipo de problema  Explicar por que escrever este tipo de problema é mais difícil 

3. 阅读WMDP 2024 Seção 5 (RMU metodologia) 勾勒一种更简单的不学习方法 (por exemplo, um método de aprendizagem mais simples) 

4. O relatório de teste de obtenção de armas biológicas da Anthropic 2025 2.53x elevação. O número pode ser descrito em duas formas de dependência de alta (nova mão) e de baixa (em duas formas de dependência de alta (em outras palavras, de alta) (em outras palavras, de alta (em outras palavras, de alta) (em outras palavras, de alta (em outras palavras, de alta) e de baixa (em outras palavras, de baixa) (em outras palavras, de alta (em outras palavras, de alta) (em outras palavras, de alta (em outras palavras, de alta) (em outras palavras, de alta (em outras palavras, de alta) (em outras palavras, de alta (em outras palavras, de alta) (em outras palavras, de alta (em outras palavras, de alta) (em outras palavras, de alta) (em outras palavras, de alta) (em outras palavras, de alta) (em outras palavras, de alta) (em outras palavras, de alta) (em outras palavras, de alta) (em outras palavras, "a) ").

5.  Explique os casos de segurança da ASL-3 que são necessários para além do desaprendizagem do WMDP  Nomear pelo menos dois estudos complementares 

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| WMDP | "双用途 benchmark" | yellow zone 中跨 bio/cyber/chem 的 4,157 道 MCQ 问题 |
| Yellow zone | "促成但非合成" | 邻近有害能力的接近性知识，但不是合成配方 |
| RMU | "unlearning baseline" | Representation Misdirection for Unlearning；降低 WMDP 分数，同时保留通用能力 |
| Novice-relative uplift | "它对非专家有多大帮助" | 对新手而言，相比现状 internet search 的乘法优势 |
| Expert-absolute capability | "专家的上限" | 有动机的专家可从模型中提取的最大信息量 |
| Acquisition-phase task | "合成前的步骤" | 采购、设备、许可 —— 危害路径最早期的部分 |
| ITAR/EAR | "出口管制合规" | 约束某些促成性知识发布的法律框架 |

## 延伸阅读

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) referência 和 RMU 论文
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) "处于临界点"
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) ASL-3 bio valor e resultados de obtenção de experiências
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) CCL de bioelevação
