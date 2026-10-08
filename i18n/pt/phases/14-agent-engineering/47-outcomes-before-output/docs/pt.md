# Na escolha de saída antes de definir o resultado

> A capacidade de implementação de código de velocidade aumenta o custo do problema de seleção de erros.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** None
**Time:** ~60 分钟

## Objectivo de aprendizagem

- Em um contexto de não previo à solução concreta, escrever um quadro de resultados.
- 明确目标用户,发生情况,现状及预期改善的标志――
- 显式声明硬性约束 (Constrangimentos)
- Identificação de soluções (Solution Leakage) e prevenção de sua fixação precoce.

## 交付产品不等于实质成效

 Construir um auxiliar de emergência de falhas  Identificar apenas um produto ([[Output]])  Não explica completamente quem precisa dele  Que indicadores serão melhorados, bem como quais são as principais medidas de segurança que devem ser mantidas 

Em comparação, o quadro de resultados (Reflection Framework) é assim descrito:

> Quando o ambiente de produção ocorre, o engenheiro de trabalho pode localizar o serviço de falha em dois minutos e confirmar a operação de segurança seguinte, mantendo o processo de verificação inteiro apenas e tendo o rastreamento completo da auditoria.

O resultado definido nesta frase pode ser alcançado através de um conjunto de software, ou através de optimização de dados, ou de uma transformação de interface de nível mais leve para alcançar. Isso permite que a equipe sempre esteja pronta para resolver o problema, em vez de morrer prematuramente no primeiro conjunto de produtos concretos imaginados por alguém.

## Os seis principais elementos do quadro de

| 构成要素 | 核心问题 |
|---|---|
| 用户（User） | 谁在直接面对并承受该问题？ |
| 情境（Situation） | 该问题何时、何地发生？ |
| 当前现状（Current behavior） | 现状如何运作，包括现有的各种临时变通手段（Workarounds）？ |
| 期望成效（Desired outcome） | 哪些可观测的状态应当得到实质改善？ |
| 约束条件（Constraints） | 哪些安全、策略、成本或兼容性底线是固定的？ |
| 非目标（Non-goals） | 哪些极具诱惑但相关的邻近工作被明确排除在外？ |

```mermaid
flowchart LR
  U[用户与情境] --> C[当前现状]
  C --> O[期望成效]
  O --> K[约束条件]
  K --> N[非目标]
  N --> E[证据探究问题]
```

## Identificação de soluções

Quando a demonstração de resultados traz uma forma de produto, uma interface, um modelo, um quadro técnico ou uma estrutura de nível inferior, ocorre uma fuga de soluções:

-  usuário recebe uma resenha de IA por semana : divulgou  resenha  Esta forma e  por semana  Esta frequência 
-  usuário em aprovação antes de poderão entender de forma precisa o seu perfil:
- 部署向量数据库: vazamento de infraestrutura selecionada
-  O período de auditoria é facilitado para obter os requisitos de conformidade relacionados com a política de auditoria:

Quando o sistema existente e a compatibilidade realmente bloqueiam uma tecnologia, as condições de bloqueio podem nomear essa tecnologia, mas devem documentar claramente os motivos objetivos de sua bloqueia.

## 约束条件守护成效底线

Os requisitos não são simples detalhes de realização, eles são componentes indissociaveis dos objetivos do mundo real:

- Durante o diagnóstico de doença , é proibido a execução de qualquer operação de escrita no ambiente de produção;
- O tempo de resposta deve ser controlado dentro do orçamento de tempo de execução do acidente;
- o registro de eventos de auditoria existente deve continuar a manter a sua autoridade exclusiva;
- Não permitir a introdução de novas bases de dados;
- 无障碍访问(Accessibilidade) O apoio deve ser mantido em perfeito.

Se um sistema, embora superficialmente tenha atingido o objetivo esperado, infringisse qualquer restrição de rigor, então o sistema é um completo fracasso.

## Dependendo do não-objectivo

Não-objectivo capaz de impedir eficazmente uma pequena e prática função de pedaços de expansão em uma plataforma enorme.

- Não fazer reparação de falhas automáticas;
- Não fazer um novo sistema de comunicação;
- Não substituir o comandante de incidente;
- Este pedaço não envolve funções de análise de dados históricos.

## Construí-lo

O programa de experiências deste curso será um teste.`OutcomeFrame`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `outputs/outcome-frame.json`- Não.

运行命令:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

尝试将期望成效修改为使用故障应急助手──校验器应敏地指出: o produto proposto já foi filtrado até à definição de efeito.

## 练习

1. O seu projeto será reeditado para um quadro de resultados de padrão.
2. Adicionar uma nova versão que irá fundamentalmente alterar a rigidez do espaço de soluções disponíveis.
3. Adicionar duas disposições que permitam garantir que os primeiros progressos no desenvolvimento de pedaços permaneçam simples e não-objetivos.
4.  encontrar os indicadores de observação mais rápidos que possam ser verificados.
5. 构想三种完全不同,但都能满足相同的成效定义的产品形式──

## 延伸阅读

- [Nuseibeh and Easterbrook, Requirements Engineering: A Roadmap](https://www.cs.toronto.edu/~sme/papers/2000/ICSE2000.pdf)O objetivo do mundo real é explorar o conceito central do software engineering.
- [Dardenne, van Lamsweerde, and Fickas, Goal-Directed Requirements Acquisition](https://doi.org/10.1016/0167-6423(93)90021-G): Explicar como os objetivos de alta classe serão gradualmente detalhados em funções operacionais e regulamentações específicas.

## 交付物与沉

Por favor, mantenha bem a produção.`outputs/outcome-frame.json` 下一节课将对照人们实际执行工作流程进行对照.
