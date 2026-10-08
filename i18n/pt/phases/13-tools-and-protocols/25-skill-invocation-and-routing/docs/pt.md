# Competências 调用与路由

> 调用(Invocação) é um processo de decisão de prioridade após decisão de poder. Uma boa descrição ajuda a fazer uma escolha do modelo; uma boa estratégia determina se essa escolha é permitida.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 24 (Skill Discovery and Progressive Disclosure)
**Time:** ~105 minutes

## Objectivo de aprendizagem

- 区分显式用户调用 (explicito invocação do usuário) 隐式模型调用 (implicito invocação do modelo) 应用程序调用 (implicado invocação do aplicativo)
- A forma de ser um modelo de desenvolvimento é a forma de ser um modelo de desenvolvimento.
- 编写包含正向触发条件和近邻误触发边界 (conta com os limites de proximidade)
- Em registro de rastreamento (traces) e teste (testing) separados de qualificação (eligibilidade) 选择 (seleção) 激活 (activação) 参数绑定 (argo) 结) 执行 (execução) 执行 (execução) 
- 适配特定运行时调用字段, evitando ao mesmo tempo a sua introdução como matéria frontal portátil 规范字段。

## 问题

Tu instalas uma.`database-migration`habilidade. O usuário pode executá-lo através do nome, mas o modelo também vê sua descrição e alguém pergunta sobre o problema de base de dados em uso geral.

- Já adicionaste.`user-invocable: false`O que é que é o que é o código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código`disable-model-invocation: true`O que é que é o que se espera é que essa habilidade desapareça completamente.

字段名称本身没有错. 错在概念模型──用户可以看到它、模型可以选择它、应用程序可以预装它以及它的内部工具可以执行是完全独立的事实──一个名字. 字段名称本身没有错. 错在概念模型──用户可以看到它、模型可以选择它、应用程序可以预装它以及它的内部工具可以执行是完全独立的事实──一个名字.`invocable`O valor único não pode expressar estas dimensões complexas.

路由 também existe um segundo modelo de fracasso. Se a descrição for muito confusa, várias habilidades aparecerão como sim e não.

## 概念

### Cinco formas de iniciar o ciclo de vida.

| 主体 (Actor) | 调用形式 | 典型用途 | 主要风险 |
|---|---|---|---|
| 人类用户 (Human user) | 在 UI 或 prompt 中指明 skill 名称 | 刻意选择特定工作流 | 用户期望获得宿主并未授予的可用性或权限 |
| 模型或自主 Agent (Model or autonomous agent) | 根据任务上下文从目录条目中自主选择 | 自动触发专家流程 | 假阳性误路由（False-positive routing） |
| 应用程序 (Application) | 通过运行时代码激活或预加载 skill | 固定的产品工作流 | 对特定 host 产生隐式耦合 |
| 另一个 Skill 或 Subagent | 请求将特定 skill 作为工作流依赖 | 组合（Composition） | 循环调用、依赖缺失或上下文泄露 |
| 评测运行套件 (Evaluation harness) | 在固定测试场景下激活指定 skill | 可重复度量 | 在测试该 skill 的同时意外绕过了正在研究的生产策略 |

Pode ser transferido para outros dispositivos.

### 调用五个阶段

```figure
skill-invocation-stages
```

精准使用这些词汇:

- **Eligible（合格）**O ator (o ator) pede essa habilidade.
- **Selected（已选中）**O usuário diretamente nome, ou o routers determiná-lo relacionados.
- **Activated（已激活）**O seu mandato já entrou em funcionamento.
- **Executing（执行中）**O agente, sob a orientação destas instruções, começa a fazer o modelo ou a operar as ferramentas.
- **Completed（已完成）**O resultado foi um sucesso independente.

 Apenas registos `skill_used=true`O que é que se passa com o problema?

### 人工与模型调用 composição 2x2 矩阵

| 人类可调用 | 模型可调用 | 模式 | 适用示例 |
|:---:|:---:|---|---|
| 是 | 是 | 共享 (Shared) | 代码解释、测试规划、文档审查 |
| 是 | 否 | 仅人类 (Human-only) | 发布准备、计费数据导出、破坏性清理方案 |
| 否 | 是 | 仅模型 (Model-only) | 内部风格指南、领域参考、自动化支持流程 |
| 否 | 否 | 禁用或仅应用 (Disabled or application-only) | 分阶段发布、已废弃包、程序化预加载 |

A matrição é um modelo estratégico, e não um padrão YAML.

某当前宿主使用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `disable-model-invocation: true`Indicar apenas humanos, usar `user-invocable: false`Expressão apenas modelo de uso.`agents/openai.yaml`Em meio`allow_implicit_invocation: false`Para manter o uso de configurações, mas também para o uso de opções ocultas, estes são adaptadores de tempo de execução, mas o usuário desconhecido pode ignorá-los.

É muito importante.`user-invocable: false`Não significa que o modelo não possa usar essa habilidade. Em sua definição de hospedeiro, ele simplesmente remove a entrada de usuário direta.`disable-model-invocation: true`Também não significa que essa habilidade tenha sido proibida. Ele apenas remove a escolha autônoma do modelo, enquanto mantém o direito de acesso expresso do usuário.

### 顯示调用是身份优先

显式调用直接提供身份标识:

```text
/release-readiness v2.4.0
```

Ou:

```text
release-readiness check v2.4.0 without publishing
```

O Codex 界面文档记录用于选择的`/skills`E, em pedido, o uso direto de pura habilidade para realizar uma modificação expressa.`/skill-name`E especificamente para os mecanismos de desenvolvimento de parâmetros do anfitrião.

显式请求仍需通过策略校验―― nomear uma habilidade não deve ultrapassar as limitações de ausência de poderes、 zona de trabalho, ponto de aprovação ou tempo de execução

### 隐式调用是描述优先的

Para os roteiros concebidos, o modelo inicialmente vê o catálogo e os dados, e não o texto verdadeiro completo.

薄弱的描述(Foi fraco):

```yaml
description: Helps with releases.
```

宽泛无度的描述:

```yaml
description: Use for release, version, package, build, deploy, publish, tag, changelog, GitHub, CI, or software tasks.
```

界界清晰的描述(Remoldado):

```yaml
description: Inspect an already prepared release candidate and produce a readiness report. Use when the user asks whether a version, tag, package, or image is ready to publish; do not use for ordinary build failures or feature development.
```

界限清晰的版本包含:

1. **能力（Capability）：**检查已准备好候选版本──
2. **输出（Output）：**- Não, não.
3. **正向边界（Positive boundary）：**询问发布产物是否准备就绪──
4. **负向边界（Negative boundary）：**常规构建和功能开发不属于本流程的范围──

Quando duas habilidades de vizinhança são comuns, são úteis, mas não podem substituir as avaliações de vizinhança (near-miss evaluations).

### 路由是带有弃权选项的分类任务

 para a habilidade $s$和请求 $x$, podemos imaginar um router:

```text
score(s, x) = capability_match + trigger_match + context_match - exclusion_match - ambiguity_penalty
```

具体打分可能由LLM 判定而非算术――工程原则仍然成立:选中必须超越值并压过竞争的技能――当证据不足时,主动弃权(abstense)――

```figure
skill-routing-abstention
```

Para a capacidade de alta influência, mesmo descrever bem, a hidemática também pode não ser adequada. Quando o custo de falsos erros de causalidade excede a conveniência da seleção automática, deve-se adotar estratégias apenas humanas.

### 合格性 deve ser primeiro ordenado

Não dê a cada habilidade descoberta uma pontuação, escolha a mais adequada e depois revisa a estratégia da habilidade. Se a maior pontuação for obstruída pela estratégia, o erro impede de considerar o candidato originalmente qualificado, mas com pontuações um pouco menores.

隐式路由应采用以下顺序:

1. De acordo com as habilidades do requerente e do atual host de adaptação, as habilidades já encontradas foram:
2.                                                                                                                                                                                                                                                               
3. Se a maior pontuação de qualificação for satisfazer as regras de valores e diferenças, é escolhido.
4. Quando nenhum candidato tem resultados qualificados ou qualificados, não é suficientemente alto, abstenção.

假设 `incident-triage`- Não .`0.80`Mas o seu hospedeiro proibiu a utilização de modelos.`incident-review`- Não .`0.55`且允许模型调用──路由器应将 `incident-review`Como melhor candidato qualificado para avaliação.`incident-triage`, rejeita-o, e depois imediatamente parar.

Esta ordem de execução também pode impedir que a estratégia mude e mude o significado do próprio resultado da correlação.

### 路由评测需要近邻误触发例

正向例证明召回率 (recall):

```json
{"prompt":"Is version 2.4.0 ready to publish?","expected":"release-readiness"}
```

明确负向用例证明基本精确率 (precisão):

```json
{"prompt":"Explain rotary position embeddings.","expected":null}
```

Próximo erro de contacto Usado exemplo ((Near misses)

```json
{"prompt":"Why did today's package build fail?","expected":"build-diagnostics"}
```

Próximo uso de casos e publicação de habilidades`package`和 `build`Para a análise da qualidade de avaliação, a análise da qualidade de avaliação é feita através de um processo de avaliação de resultados.

### 参数具有三种表示形式

调用参数在流转过程中跨越多边界:

```figure
skill-argument-boundaries
```

Em cada limite, não seja necessário executar o texto como código diretamente:

- 宿主解析器决定命令语法和引号转义──
- Habilidade de acordo com as regras do hospedeiro.
- Instructions for testing essential parameter value and default value.
- 工具调用将值转换为类型化方案 并重新校验──

Não deve ser usado para classificar os elementos primitivos em um conjunto de argumentos.

###  aplicativo调用是显式编排

produto pode ativar diretamente uma habilidade, pois seu fluxo de trabalho já prevê o tipo de tarefa. Por exemplo, Puxar Requisito  Censar serviço pode ser clicado no usuário  Revisão  Pressão                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `pull-request-risk-review`- Não.

Isto eliminou a incerteza do roteiro, mas a API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                

```figure
skill-host-adapter
```

Assim, quando a habilidade é aberta em outros clientes, ela permanece clara e fácil de entender.

### Habilidade de fazer uso é similar a ferramenta de fazer uso

Suponha que quando a dependência dos documentos ocorre,`release-readiness`需要请求 `security-change-review`- Não.

调用方应提供:

- Identificação de competências do objectivo;
- As tarefas e os processos de produção;
- 预期的响应契约;
- 调用原因;
- Programa de devolução de fundos;
- Regras de controlo de profundidade máxima ou de ciclo.

```json
{
  "target_skill": "security-change-review",
  "task": "Review dependency changes in the candidate diff",
  "inputs": ["artifacts/release.diff"],
  "expected": "risk-report.json",
  "max_depth": 2
}
```

A segunda habilidade não é blindamente ligada à primeira. O anfitrião decide como ativá-la, e como ela é compartilhada no processo de execução, ou através de ferramentas de manipulação.

### O ciclo de vida depende do hospedeiro .

 Após a ativação, a habilidade pode ser mantida em conversação  durante a compressão de texto, ou em funções em função do mandato.

Não escreva dependendo da habilidade da hipótese de ciclo de vida oculto.

```markdown
On resume, read `artifacts/release-readiness.json` if it exists.
Revalidate the candidate commit before continuing.
Do not repeat an external write whose idempotency key is already recorded.
```

## Construí-lo

`code/main.py`A estratégia e o caminho para a realização de um adaptador independente.

Os dados incluem:

- `Actor`Para humanos, modelos, agentes autônomos, aplicações, habilidades e para os grupos de avaliação;
- `SkillMetadata`: para utilização no identificador de identidade;
- `InvocationPolicy`: para humanos/ modelos matrições;
- `InvocationRequest`Com`InvocationDecision`: para informações e resultados de decisão rastreáveis;
- `CorePolicyAdapter`: para uso em casos de extensão de transmissão sem hospedeiro;
- `ExtensionPolicyAdapter`: para identificar o funcionamento de um determinado segmento;
- `build_invocation_matrix(policy)`: para gerar 2x2 视图;
- `route_request(skills, request, adapter)`Para ser utilizado em classificação de correlação, seleção e rejeição antes de ser realizado o processo de qualificação.

运行实验:

```bash
cd phases/13-tools-and-protocols/25-skill-invocation-and-routing
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

A apresentação imprimiu uma matriz, bem como os resultados de decisões de um conjunto de processos de avaliação e avaliação de habilidades para um modelo humano, aplicativo, agente independente, aplicativo e conjunto de avaliação. Os resultados de um adaptador de expansão mostraram como a maior combinação de palavras obstruída por estratégias foi eliminada antes da classificação de um programa de reservas qualificadas. Também contém uma lista de nomes precisos. A apresentação não precisa de um modelo API. A existência de um roteador de determinação é para facilitar a verificação das fronteiras de estratégias, e não para afirmar que a combinação de palavras é um comportamento de roteiro de um modelo de nível de produção existente.

### Por que a estratégia central e o adaptador de expansão devem ser separados

Se um resolvedor cego atribuir um significado especial a cada matéria observada, o conceito será aplicado quando o conceito for adotado como um padrão geral falso.

`CorePolicyAdapter` apenas utilizar estratégias explicitamente fornecidas por aplicativos`ExtensionPolicyAdapter`则识别明确一组宿主字段,并记录下究竟是哪个字段改变了决策──

## Use-o

Em emissão de habilidade  之前编写调用契约(contrato de invocação):

```yaml
actors:
  human: allow
  model: deny
  application: allow
  skill: deny
explicit_name: release-readiness
arguments:
  candidate: required
  publish: fixed_false
ambiguity: ask_user
missing_dependency: stop
context:
  durable_state: artifacts/release-readiness.json
  max_composition_depth: 2
```

O contrato é um arquivo de design para o uso de adaptadores e testes.`SKILL.md`A primeira questão é:

## Entrega-o

O curso foi concluído.`skill-invocation-router`组件包―― contém uma referência de modelo de manipulação, uma estratégia de hospedeiro de exemplo, bem como uma ferramenta CLI não executada―. Esta ferramenta pode avaliar uma solicitação de conjunto de componentes de humanos, modelos, agentes autônomos, aplicativos, habilidades, conjunto ou avaliação, e retornar a uma decisão JSON que contém processos, adaptadores, resultados e causas―.

O CLI de solicitação única é uma ferramenta de detecção estratégica, e não um conjunto completo de avaliações de desenho. Por favor, use o modelo de uso direto de etiquetas no capítulo 27 e o modelo de uso de desenho de desenho de desenho de desenho de desenho de desenho de desenho de desenho de desenho de desenho, para calcular a contagem, a precisão, a taxa de recarga e a estabilidade de operações múltiplas.

## 练习

1. 创建人类/模型矩阵的全部四行,并为每一行编写一个合法的实际使用场景──
2. Por`CorePolicyAdapter`Adicionar apenas funções de ativar aplicativos.
3. Para uma determinada capacidade de implantação  escrever 10 casos de uso de erros de proximidade  cada um  deve compartilhar parte da palavra  com essa capacidade, mas pertence a diferentes processos de trabalho 
4. Em nota máxima, entre os dois routes, adicione diferenças de capacidade de limite de marginal (margem de ambiguidade)`ask`- Não.
5. Para a habilidade 间 request 添加最大组合深度限制,并能检测出由两技能 构成的死亡循环──
6. Utilize o core adaptor e o expansion adaptor operando o mesmo conjunto de testes de marcação.

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 显式调用 (Explicit invocation) | “斜杠命令” | 调用方直接提供 skill 身份标识，受策略约束 |
| 隐式调用 (Implicit invocation) | “模型自主选择” | 路由器根据任务上下文从合格的目录元数据中自主选择 |
| 用户可调用 (User-invocable) | “人类可以使用” | 特定于宿主的菜单或直接调用属性，而非核心标准字段 |
| 模型可调用 (Model-invocable) | “agent 可以使用” | 在宿主策略下具备隐式模型选择资格 |
| 调用适配器 (Invocation adapter) | “frontmatter 解析器” | 将宿主字段和 API 映射到已声明策略模型的代码 |
| 近邻误触发用例 (Near miss) | “困难负例” | 与 skill 预期输入高度相似但不应触发该 skill 的请求 |
| 弃权 (Abstention) | “未选中任何 skill” | 在缺乏足够证据或存在歧义时刻意做出的路由结果 |

## 延伸阅读

- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)O que é um "compreensão" de um "compreensão" é um "compreensão" de um "compreensão".
- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills)O que é um "designer" de um "output evaluation":
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills): compreender o controle de uso expresso e invisível do atual Codex.
- [Claude Code skills](https://code.claude.com/docs/en/skills): saber os hóspedes específicos `user-invocable`- Não.`disable-model-invocation`、parâmetros de transmissão e mecanismos de execução
