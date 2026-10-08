# O quadro de preparação para a OpenAI e o quadro de segurança de fronteira do DeepMind

> O OpenAI Preparedness Framework v2(4月) introduziu Categorias de Pesquisa:Autonomia de longo alcance, Sandbagging, Replicação Autônoma e Adaptação, Submining Safeguards, que são diferentes das Categorias rastreadas. Categorias rastreadas vão provocar Relatórios de Capacidades e Relatórios de Safeguards, e foram examinadas pelo FSF do DeepMind em Setembro de 2025.

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## 问题

Lição 19 仔细阅读了人类的扩展政策──本课通过阅读OpenAI和DeepMind的政策来补充全景──这三份文件是同类产品,处理了同一个问题:边界实验室 什么时候应该暂停或限制一个模型;它们在一小组类别上趋势同,也在一些重要的具体位置分歧──

趋同之处: 三者都把长远自主权 标记为值得追踪的能力类别──三者都承认欺骗行为(alignment faking、sandbagging) é um tipo específico de risco──三者都有内部审查机构──分歧之处:OpenAI 将类别分为Tracked(强制缓解) 和Research(不自动触发)──DeepMind 将自主权 纳入两个领域,而不是单独命名──实验室将使用Tracked Research、Critical vs Moderate、Tier-1 vs Tier-2等名称;能力落在哪个桶里,将在不同的实验室产生不同的操作后果──

Colocá-los juntos é um exercício útil. A mesma capacidade em Antropic pode ser a mitigação obrigatória, em OpenAI pode ser monitorada, mas não desencadeada, em DeepMind pode ser rastreada em um domínio específico.

## 概念

### OpenAI Preparedness Framework v2(2025 年 4 月)

结构:

- **Tracked Categories**• Relatórios de Capacidades (Relatórios de Capacidades) (Modelo pode fazer o quê) (Relatórios de salvaguardas) (Existem medidas de alívio) (dependendo da situação) (dependendo da situação) (Deployment) (dependendo da situação) (Dependendo da situação da situação, o grupo consultivo de segurança (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Advisory Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence Group) (Dependence on the Committee) (Dependence on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the) (De) (De) on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee on the Committee
- **Research Categories**O estudo foi realizado em uma área de investigação e investigação, que incluiu:

O artigo 1.o do artigo 1.o do Regulamento (UE) n.o 1083/2013 do Conselho, de 15 de dezembro de 2013, estabelece um regime de proteção contra a contaminação e a redução das emissões de gases de efeito estufa.

### DeepMind Frontier Safety Framework v3(2025 年 9 月;Tracked Capability Levels 于 2026 年 4 月 17 日加入)

结构:

- **Critical Capability Levels (CCLs)**A capacidade de desenvolvimento de sistemas informáticos é de um nível de desenvolvimento de sistemas informáticos.
- **Tracked Capability Levels**:2026 年 4月加入额外粒度──具体例:ML R&D autonomy level 1 = 以 Comparado com humanos + ferramentas de IA Há custo competitivo, totalmente automatizado AI R&D pipeline──
- **Deceptive alignment monitoring**• "Miniscência de um compromisso com o uso automático de razões instrumentais".

A expressão de autonomia é diferente da OpenAI. O DeepMind não considera a autonomia como um domínio de alto nível; é inserido na autonomia em áreas que podem causar danos.

### 3 - A evolução

- 内部 Segurança Grupo Consultivo(分别命名为人类SAG、OpenAI SAG、DeepMind comité interno)。高能力模型部署前进行审查──
- 明确提到欺骗性配合/配合伪造 是一类风险──
- Em declarações de ritmo produziu um documento persistente:Antropic:Frontier Safety Roadmap,Risk Report,OpenAI:Capacities and Safeguards Reports,DeepMind:FSF update cycle)
- O DeepMind diz claramente: "A monitorização automática não permanecerá suficiente a longo prazo".

### 它们的分歧的分歧

- **Anthropic**A proposta de alteração do programa de investigação e desenvolvimento da IA foi aprovada em 31 de janeiro de 2015.
- **OpenAI**:Tracked vs Research 拆分;Categorias de pesquisa (incluindo autonomia de longo alcance) não serão automáticas.
- **DeepMind**A autonomia foi incluída em outros domínios; os níveis de capacidade rastreados foram incluídos em 2026.[4]

### Sandbagging: uma capacidade específica de tornar os outros complexos

Sandbagging (模型在评估中策略性表现不佳) está localizado em OpenAI's Research Categories。Anthropic's RSP v3.0 通过评估-context gap(Lessão 1) processá-lo。DeepMind 在 FSF v3 中通过欺骗性对齐监测 处理它。

Se um modelo estiver em um saco de areia de avaliação, então a capacidade de cada quadro será subestimada. O quadro só é válido quando a medida é válida. É por isso que, além da avaliação do laboratório, também são necessárias medições externas.

### 政策阅读技能

- 定位: cada um dos recursos que você se preocupa deve ser encontrado na política.
- Categoria: é rastreado ou pesquisa rastreada mas não?
- 节奏: política é a actualização do calendário de declarações, ou apenas após um determinado evento?
- 独立性: Externação de revisão é obrigatória ou opcional?Antropic com Apollo e US AI Safety Institute 合作;OpenAI com METR 合作;DeepMind principalmente depende de SAG interno:


```figure
a5-tracked-vs-research
```

## Use-o

`code/main.py` implementar uma pequena ferramenta de decisão-tabela diferença.  fornecer uma capacidade:  autonomia  alinhamento enganoso  automação de I & D  ciber-elevação etc.  emitir três políticas:

## Entrega-o

`outputs/skill-cross-policy-diff.md`Utilize três estruturas como referência, para a capacidade específica de gerar políticas em relação aos outros.

## 练习

1. 运行 `code/main.py` Verificar a capacidade de verificação de documentos de fontes de informação, pelo menos, para verificar a conformidade com as políticas de produção de diferentes ferramentas.

2. 完整阅读 OpenAI Preparedness Framework v2──识别每个研究类别──对每项,用一句话说明为什么它在研究而不是追踪──

3. 完整阅读DeepMind FSF v3, bem como Níveis de Capacidade de rastreamento de 2026 更新──识别ML R&D autonomy level 1 的具体评估标准──你会如何从外部测量它?

4. Sandbagging  está em OpenAI Categorias de Pesquisa.

5. 针对某项具体能力 (由你选择) 比较三项政策――说明你认为哪些政策的分类最严谨的哪些最不严谨的――用源文本证明──

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Preparedness Framework | “OpenAI 的 scaling policy” | PF v2（2025 年 4 月）；Tracked vs Research categories |
| Tracked Category | “Mandatory mitigation” | 触发 Capabilities + Safeguards Reports；SAG review |
| Research Category | “Monitored only” | 被追踪但没有自动缓解措施；包括 Long-range Autonomy |
| Frontier Safety Framework | “DeepMind 的 scaling policy” | FSF v3（2025 年 9 月）+ Tracked Capability Levels（2026 年 4 月） |
| CCL | “Critical Capability Level” | DeepMind 每个领域的阈值（Cyber、Bio、ML R&D、CBRN） |
| ML R&D autonomy level 1 | “R&D automation” | 以有竞争力的成本完全自动化 AI R&D pipeline |
| Sandbagging | “Strategic underperformance” | 模型在 evals 中表现不佳；位于 OpenAI Research Categories |
| Instrumental reasoning | “Means-ends reasoning” | 关于如何实现目标的推理；DeepMind monitoring 的目标 |

## 延伸阅读

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/)O que é que se passa?
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) 完整文档──
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) FSF v3 公告──
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) Níveis de Capacidade de rastreamento 增补。
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) FSF 形式 Risk Report示例──
