# Modos de falha: Agentes por que vão falhar

> MASFT (Berkeley, 2025) irá classificar 14 diferentes modos de falha de agentes em 3 categorias. A taxonomia da Microsoft registra os falhas existentes de IA em cenários agenciais.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**先修要求：**Fase 14 · 05 (Auto-refinamento e CRITIC), Fase 14 · 24 (Observabilidade)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Exercer três categorias de falhas do MASFT e, em cada categoria, apresentar pelo menos quatro modelos específicos.
- Explicação de porquê falha agencial 会放大现有AI failure modes (precisão, alucinação)
- Descrição de cinco tipos de modalidades de reaparição e de métodos de sua eliminação:
- 实现 um detector de problemas, usando rótulos de modo de falha 标注代理痕迹──

## 问题
Os agentes de equipe lançados estão em 90% das marcas de trabalho acima de tudo. Os 10% restantes falhas não são ruídos aleatórios, mas caem em uma pequena quantidade de tipos que aparecem repetidamente.

## 概念
### MASFT (Berkeley, arXiv:2503.13657)

Taxonomia de falhas de sistemas multi-agentes. 14 modos de falhas.

核心主张:failures are fundamental design flaw in many Agent 系统, rather than can pass through better base models 修复的 LLM 限制──

### Taxonomia da Microsoft do Modo de Falha em Sistemas de IA Agênticos

- 现有AI失败 (bias, hallucinações, vazamento de dados) 会在代理场景中被放大──
- Novos fracassos da autonomia: ação involuntária em larga escala, o uso indevido de ferramentas, a derivação da missão.
- Este documento branco é um registo de riscos dos produtos agentes.

### Caracterizando falhas na IA Agêntica (arXiv:2603.06847)

- Falhas da orquestração, evolução do estado interno e interação ambiental.
- Não é apenas um mau código ou um mau modelo de saída.

### Estudo de Alucinações de Agentes da LLM (arXiv:2509.18970)

两种主要表现:

1. **Instruction-following Deviation**Agente não segue o sistema de urgência.
2. **Long-range Contextual Misuse** Agente  esquecido ou usado erradamente no contexto anterior 

Erros de sub-intenção: omissão (s) 漏掉步骤 (s)  Redundancia (s) 重复步骤 (s)  Disordem (s) 步骤顺序错误 (s) 

### 五种行业反复出现模式

Arize、Galileo、NimbleBrain 2024-2026 anos de análise de campo recebeu:

1. **Hallucinated actions.**O agente usou uma ferramenta inexistente ou elaborou argumentos.
2. **Scope creep.**O agente vai expandir a sua missão para além das exigências do usuário (crear PR extra ▌enviar e-mails extra) 
3. **Cascading errors.**Uma falha de chamada de um sistema de dados, transformando-se num incidente de vários sistemas.
4. **Context loss.**长周期任务忘记早期轮次的约束──
5. **Tool misuse.**Usar argumentos errados 调用正确 tool, ou diretamente调用错误 tool.

Cascading é o mais mortal. Agentes não conseguem distinguir que a missão não é possível, e frequentemente há 400 erros.

### Mitigation: cada passo todos os portais de configuração

Em cada passo da cadeia de raciocínio, configuração de portas de verificação automática, estado de ambiente de controle de base de fato, especificamente:

- Cada passo de classificação de segurança (Lessão 21)
- Validação de argumentos de chamada de ferramenta (Lessão 06):
- O conteúdo recuperado será comparado com os fatos conhecidos 交叉检查(Lessão 05, CRITIC) ⋅
- 通過重新探测状态 来检测成功幻觉 (até agora, há uma alucinação) 文件真的被创建了吗?)

### Monitoramento de falhas  fácil de sair errônico

- **Tagging only crashes.**A maioria das falhas de agentes irá produzir resultados eficazes.
- **No baseline.**Detecção de deriva  precisa de última-conhecida-bom; sem ele, você já não pode julgar  Isto está mudando 🏼
- **Over-alerting.**Cada falha produz uma página. Deve ser agrupado e limitado.


```figure
failure-cascade
```

## Construí-lo
`code/main.py`实现 um tagger de modo de falha stdlib:

- Um conjunto de dados sintéticos de rastreamento de cinco tipos de padrões.
- Cada tipo de padrão de detecção de funções (designação de padrões de assinatura)
- Uma etiqueta, usada para marcar cada traço e distribuição de modo de relatório.

- Não .

```
python3 code/main.py
```

输出: etiquetas de cada traço + distribuição agregada, é uma espécie de baixo custo de recuperação do conteúdo apresentado no cluster de traços da Phoenix.

## Use-o
- **Phoenix**Utilizado para a produção de agrupamentos de deriva ambiental (Lessão 24)
- **Langfuse**Us 用于 sessão replay + anotação。
- **Custom**Utilizando a plataforma de observabilidade, as assinaturas específicas do domínio não podem ser verificadas.

## Entrega-o
`outputs/skill-failure-detector.md`生成面向您所在域的故障模式探测器,并连接到追踪商店──

## 练习
1. 添加一个 成功幻觉探测器:Agente 返回成功,但目标状态 没有变化──
2. Marque 100 traços reais de um produto que você construiu. Qual é o modelo que domina? Qual é o custo de reparação?
3.  Realizar uma métrica de raio de cascata: dado o fracasso do n° n°, isso afetou o número de passos abaixo?
4. 阅读 MASFT's 14 种故障模式选择──三种适用于您的产品的模式──编写探测器──
5. Para inserir um detector em um trabalho de CI: se >=5% das traças forem marcadas para algum tipo de modelo, então deixe a construção  fracassar.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MASFT | “Multi-agent failure taxonomy” | Berkeley 14-mode categorization |
| Cascading error | “Ripple failure” | 一个早期错误会通过 N 个步骤传播 |
| Context loss | “Forgot the constraint” | 长周期轮次丢失早期轮次事实 |
| Tool misuse | “Wrong tool / wrong args” | 调用有效，但调用方式错误 |
| Success hallucination | “Faked completion” | Agent 在 400 上声称成功；state 未变化 |
| Scope creep | “Overreach” | Agent 做了超出要求的事 |
| Instruction-following deviation | “Disobedience” | 忽略 system prompt 或用户 constraint |
| Sub-intention errors | “Plan bugs” | plan execution 中的 omission、redundancy、disorder |

## 延伸阅读
- [Cemri et al., MASFT (arXiv:2503.13657)](https://arxiv.org/abs/2503.13657) 14 modos de falha,3 个类别
- [Microsoft, Taxonomy of Failure Mode in Agentic AI Systems](https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/final/en-us/microsoft-brand/documents/Taxonomy-of-Failure-Mode-in-Agentic-AI-Systems-Whitepaper.pdf)Registro de riscos
- [Arize Phoenix](https://docs.arize.com/phoenix) 实践中的 drift clustering
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)Padrões mais simples, há que evitar completamente esses padrões.
