# Auto-refinamento e crítica:

> Auto-refinamento(Madaan et al., 2023) deixar um LLM desempenhar três papéis no ciclo: gerar feedback、refinar。 average revenue: em 7 个任务绝对提升+20──CRITIC(Gou et al., 2023) através de将验证路由到外部工具来强化反步骤── até 2026 anos, este modelo é chamado de evaluator-optimizer

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~60 分钟

## Objectivo de aprendizagem

- Para explicar o que é o problema do auto-refinamento, é importante que o processo seja feito com o auto-refinamento.
- 解释 CRITIC的关键洞见: não há fundamento externo 时,LLMs 在自我验证上不可靠──
- 实现一个带历史 和可选外部验证器 的 stdlib Auto-Refine loop──
- Mapear este modelo para o fluxo de trabalho do Antropic e para os guardrails de saída do OpenAI Agents SDK.

## 问题

Um agente produz uma resposta quase correta. Talvez alguma linha de código tenha um erro de sintaxe. Talvez um resumo muito longo. Talvez um plano tenha perdido um caso de borda.

Auto-refinar  indicar: usar um único modelo 、 não precisa de dados de treinamento 、 não precisa de RL, também pode fazer isso.

Estes dois artigos definem em conjunto o modelo de "precursão de geração em 2026": gerar, verificar, refinar, parar no verificador.

## 概念

### Auto-refinamento ((Madaan et al., NeurIPS 2023)

Um LLM, três cargos:

```
generate(task)            -> output_0
feedback(task, output_0)  -> critique_0
refine(task, output_0, critique_0, history) -> output_1
feedback(task, output_1)  -> critique_1
refine(task, output_1, critique_1, history) -> output_2
...
stop when feedback says "no issues" or budget exhausted.
```

关键细节:`refine`O papel foi ablacionado: eliminação da história, a qualidade vai cair drasticamente.

核心结果:  7 个任务 (math、code、acronym、dialog)  平均带来 +20 绝对提升, incluindo GPT-4──无需培训、无需外部工具、单个模型──

### CRITA: [Gou et al., arXiv:2305.11738, v4 fevereiro 2024)

A auto-refinagem é uma forma de auto-refinamento, que é uma forma de auto-refinamento.`verify(task, output, tools)`替换 `feedback(task, output)`, entre os `tools`Incluem:

- Utilizando o motor de busca de alegações de fato.
- Utilizando o intérprete de código de corretão de código.
- Utilizando uma calculadora de aritmética.
- 领域 específicos verificadores (unidade de testes, verificadores de tipo, linternas)

Verificador irá gerar uma crítica estruturada baseada nos resultados das ferramentas.

核心结果:CRITIC 在事实性任务上优于自我精炼,因为 crítica tem fundamento.

### 停止条件

两种常见形态:

1. **Verifier 通过。**Exterior test  Retorno de sucesso.
2. **没有发出 feedback。**Modelo diz que a saída está bem.

2026 默认做法:组合二者──如果验证器通过,或模型说好且反复 >= 2,或反复 >= max_iterations,则停止──

### Evaluador-Optimização (Antropic, 2024)

Anthropic em artigo de 12 de dezembro de 2024 o nomeou como um dos cinco padrões de fluxo de trabalho:

- Avalador: Give output打分并生成 crítica。
- Optimizador: baseado na crítica 修订输出。

循环直到 evaluator 通过──这就是Antropic 表述中的自精/CRITIC──Antropic 补充的关键工程细节是:evaluator 和优化器提示 应该有明显不同的结构,这样的模型 才不会只是膠盖──

### Os dispositivos de segurança de saída do SDK OpenAI Agents

O OpenAI Agents SDK vai utilizar este modelo como proteção de saída  提供──guardrail é em agente 终端输出上运行的验证器──如果 guardrail 触发                                                                                                                                                                                                                                       `OutputGuardrailTripwireTriggered`),输遇被拒绝,agente pode tentar novamente. Guardrails pode调用工具 (Critic-style), também pode ser pura função (Self-Refine-style)

### 2026 ano de cano

- **Rubber-stamp loops。**O mesmo modelo, usando o mesmo estilo de rápida geração e crítica, vai receber até me parece bom── usar diferentes instruções na estrutura, ou usar um modelo mais pequeno, mais barato fazer crítica──
- **过度 refine。**Cada passagem de refinamento aumenta a latência e os tokens. O orçamento é de 1 a 3 passagens.
- **在 trivial tasks 上使用 CRITIC。**Se não houver um verificador externo, CRITIC 会退化为自理化; não pague por um verificador de estúdio 延迟──


```figure
self-refine
```

## Construí-lo

`code/main.py`Em uma tarefa de brinquedo 上实现 Self-Refine 和 CRITIC: given topic, generate a brief bullet list──verifier 检查格式──3 balas, cada menos de 60 个字符──CRITIC 增加一个外部 事实验证,用于惩罚已知幻觉──

组件:

- `generate`Produtor de roteiro.
- `feedback` Autocrítica de estilo LLM。
- `verify_external` Verificador baseado em estilo CRITICO
- `refine` 根据历史 改写输出──
- Condição de parada verificador através de ou mais 4 vezes de iteração.

运行:

```
python3 code/main.py
```

Comparar Auto-Refinação e resultados de execução CRITICOS.

## Use-o

O Antropic's evaluator-optimizer é usado para expressar este modelo em linguagem amigável com Claude. Os guardas de saída do OpenAI Agents SDK são CRITIC 形态:

## Entrega-o

`outputs/skill-refine-loop.md`De acordo com a forma da tarefa, a disponibilidade do verificador e o orçamento de iteração, a configuração do loop avaliador-otimizador, a saída do gerador, o avaliador/verificador e o optimizador, bem como a política de parada.

## 练习

1. Usar o máximo de vezes = 1 运行这个玩具――CRITIC 仍然有帮助吗?
2. Colocar o verificador externo  substituir o verificador barulhento                                                                                                                                                                                                                                                       
3. 实现一个 generator-critic on different models 变体:big model 生成,small model critication──它能胜过同一模型吗?
4. 阅读CRITIC Section 3 ((arXiv:2305.11738 v4) ⋅说出三类验证工具类,并为每类给出一个例子──
5. O OpenAI Agents SDK`output_guardrails`O papel de verificador do CRITIC.

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|----------------|------------------------|
| Self-Refine | “会修复自己的 LLM” | 在一个 model 中执行 Generate -> feedback -> refine loop，并带 history |
| CRITIC | “Tool-grounded verification” | 用外部 verifier（search、code、calc、tests）替换 feedback |
| Evaluator-Optimizer | “Anthropic workflow pattern” | 两个角色：evaluator 打分，optimizer 修订，并循环到收敛 |
| Output guardrail | “Post-hoc check” | OpenAI Agents SDK validator，在 agent 生成输出后运行 |
| Verify step | “Critique phase” | 承重决策点：grounded 还是 self-rated |
| Refine history | “Model 已经尝试过的内容” | 先前 outputs + critiques 被前置到 refine prompt；去掉后质量会崩塌 |
| Rubber-stamp loop | “Self-agreement failure” | 相同 prompt 的 critique 返回 “looks good”；用结构上不同的 prompts 修复 |
| Stop condition | “Convergence test” | Verifier 通过，或没有 feedback 且达到 iteration cap；绝不能只有单一条件 |

## 延伸阅读

- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651)Papel clássico
- [Gou et al., CRITIC (arXiv:2305.11738)](https://arxiv.org/abs/2305.11738) Verificação baseada em ferramentas
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) padrão de fluxo de trabalho de avaliador-optimizador
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 作为Critic-shaped verifiers 作为Critic-shaped verifiers 的输出 guardrails
