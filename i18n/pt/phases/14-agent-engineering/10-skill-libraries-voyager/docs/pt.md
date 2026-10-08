# Competências e aprendizagem (Voyager)

> Voyager (Wang et al., TMLR 2024) vai executar código como uma habilidade. Habilidade: possui características de nomeamento, pesquisa e combinação, e passa pelo ambiente.

**类型：**Construir
**语言：**Python (stdlib)
**先修：**Fase 14 · 07 (MemGPT), Fase 14 · 08 (Letta Blocks)
**时间：**- 75 minutos.

## Objectivo de aprendizagem

- Explicar os três componentes da Voyager: currículo automático, biblioteca de habilidades, incitação iterativa, e explicar o papel de cada um.
- Explica por que a Voyager vai criar um código de design espacial, e não um comando original.
- Utilize stdlib                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
- Mapear o modelo do Voyager até 2026 Claude Agent habilidades SDK e habilidadeskit

## 问题

Todas as sessões são de um agente capaz de reconstruir tudo, comete três tipos de erros:

1. **浪费 Token。**Cada tarefa será reformulada com a mesma ideia.
2. **丢失进展。**sessão A. A modificação não será transferida para a sessão B.
3. **无法处理长程组合。**As tarefas complexas exigem níveis de capacidade; um tiro rápido não pode realizá-las.

A resposta da Voyager é: considerar cada capacidade de repetição como um bloco de código nomeado armazenado na arquivo, que pode ser pesquisado por semelhança, combinado com outros componentes de habilidades e executado com a melhoria contínua.

## 概念

### Três componentes

Voyager (arXiv:2305.16291) 围绕以下内容组织代理:

1. **Automatic curriculum。**Por curiosidade, o proponente irá basear-se no agente atual.
2. **Skill library。**Cada habilidade é executável. Após o sucesso da tarefa, será adicionado um novo habilidade.
3. **Iterative prompting mechanism。**Quando falhar, o agente vai receber erros de execução, ambiente e auto-avaliação, e depois melhorar a habilidade.

Minecraft 评估(Wang et al., 2024):相比基线,独特物品多 3.3 倍,石工具 快 8.5 倍,铁工具 快 6.4 倍,地图遍历距离长 2.3 倍──这些数字是Minecraft 特定的,但模式可迁移──

### 动作空间 = 代码

输出原始命令──Voyager 输出 JavaScript 函数──一个技能是:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

Porção Skill 组合而成──按描述 和 Embedding 作为关键存储──作为程序被检查,而不是作为提示──

É o que é o 2026 Claude Agent SDK: um código de código, adicionando o agente à sua lista de informações.

### Competências

Novas tarefas são fazer uma picada de diamante.

1. Para a descrição de tarefas  realizar a incorporação 
2. Pergunta-me, "Quando é que você está a fazer isso?"
3. 检索 `craftIronPickaxe`- Não.`mineDiamond`- Não.`placeCraftingTable`E assim...
4. Usando o seu idioma original + nova lógica e novas habilidades.

É o modo de realizar os recursos do MCP (Fase 13) e as habilidades do SDK do Agente: fazer pesquisas na superfície do conhecimento/código, e não limitar-se ao alcance das tarefas atuais.

### 代改进

O ciclo de viagem:

1. Agente, escreve uma habilidade.
2. Habilidade em ambiente de funcionamento.
3. 返回三种信号之一:`success`- Não.`error`(Bota de rastreamento)`self-verification failure`- Não.
4. Agente utiliza este sinal como habilidade de reescrever.
5. Circulação até o sucesso ou alcançar o máximo número de rotas.

É Auto-Refinação (Lessão 05) é utilizada para gerar código, não para implementar o ambiente.

### Currículo e exploração

O módulo de currículo do Voyager irá, de acordo com o agente  já possuído 還沒有做過什麼, propondo uma tarefa similar construir um abrigo perto do lago de tarefas──proponente Uso de estado ambiental + Inventário de habilidades para escolher um pouco superior à tarefa atual, ou seja, explorar melhor área─.

Para o agente de produção, isso se transformará em um operador que está faltando: uma base de habilidades e um domínio, que ainda não cobrimos.

### Este é um lugar fácil de se errar.

- **Skill library rot。**A mesma habilidade é usada com uma descrição diferente. Adicione 10 vezes.
- **Composed-skill drift。**A habilidade do pai depende de uma habilidade de filho melhorada posteriormente.
- **Retrieval quality。**随着技能库增长到几百个以上,基于技能描述的矢量检索 会退化──使用标签过器 和硬约束补充只有技能与 `category=tooling`) 


```figure
voyager-skills
```

## Construí-lo

`code/main.py`实现 um stdlib Skill 库:

- `Skill` nome, descrição, código, versão, tags, dependências.
- `SkillLibrary` registar, procurar, sobreposição de tokens, compor, refinar, actualizar, melhorar, melhorar, melhorar, melhorar, melhorar, melhorar, melhorar, melhorar, melhorar e melhorar.
- Um agente de guião: Registre três habilidades originais, juntar o quarto, encontrar uma vez um fracasso, e depois melhorar.

运行:

```
python3 code/main.py
```

A trace 会展示库写入、检索、组合、一次失败执行, bem como v2 改进, ou seja, o processo de fim a fim do ciclo Voyager.

## Use-o

- **Claude Agent SDK skills**(Antropico)  2026 参考: cada habilidade tem descrição、código 和 instruções;
- **skillkit**(npm: skillkit)  面向 32+ agentes de codificação de IA 跨代理技能管理──
- **Custom skill libraries**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- **OpenAI Agents SDK `tools`** 低配版本; cada ferramenta são lightening Skill。

## Entrega-o

`outputs/skill-skill-library.md`Será gerado um Voyager de forma de Skill 库, para qualquer objetivo runtime 接好注册,检查,版本化和改进──

## 练习

1. - Não .`compose()`Quando a habilidade A depende de B, e B também depende de A, o que acontece?
2. 实现每个技能的版本固定──当父技能 组合子技能 `crafting@1`时,对 `crafting@2`Não podemos melhorar a nossa habilidade.
3. 将 token-overlap retrieval  substituir por embebimentos de transformadores de frases(or BM25 stdlib 实现) ・・・ em uma biblioteca de brinquedos de 50 habilidades 上测量 retrieval@5。
4. Adicionar um agente curricular: fornecer uma descrição de domínio, apresentar 5 habilidades faltantes.
5. 阅读Antropic's Claude Agent SDK skill docs... vai a biblioteca de brinquedos transferir para o esquema de habilidades do SDK...

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Skill | “可复用能力” | 带有 description 的命名代码块，可通过相似度检索 |
| Skill library | “agent 的 how-to 记忆” | Skill 的持久化存储，可搜索、可组合 |
| Curriculum | “任务 proposer” | 由当前能力缺口驱动的自底向上目标生成器 |
| Composition | “Skill DAG” | Skill 调用 Skill；执行时进行拓扑排序 |
| Iterative refinement | “自我修正循环” | Env 反馈 + 错误 + 自验证，会折回到下一个版本中 |
| Action-space-as-code | “程序化动作” | 输出函数，而不是原始命令，用于时间跨度更长的行为 |
| Dedup on write | “Skill collapse” | 近重复 description 会合并为一个 canonical Skill |

## 延伸阅读

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) 原始 Habilidades-Biblioteca 论文
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Formação de produtos para 2026
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) Ciclo de melhoria do Voyager
