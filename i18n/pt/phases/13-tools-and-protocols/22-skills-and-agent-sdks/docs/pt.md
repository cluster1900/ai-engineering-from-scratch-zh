# Competências de agente: transplante de dados

> A habilidade não é apenas uma troca de um nome de documento melhor. É um pacote de programas de detecção que contém instruções, recursos e ferramentas auxiliares executáveis, conforme a definição de funcionamento do agente.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 01 (The Tool Interface), Phase 13 · 05 (Tool Schema Design)
**Time:** ~90 minutes

## Objectivo de aprendizagem

- 明确定义 Agente Habilidade,不将其与 prompt、代码库规范文件(repository instruções) 工具、hook、subbagent或插件 混──
- 研讀可移植的 `SKILL.md`契约,并将其与特定运行时专专有扩展清晰解──
- 将服务发现 (descoberta) 选择 (seleção) 激活 (ativação) 资源加载 (ressource load) 工具调用 (ouvido) 工具使用 (ouvido) 验证 (verificação) 解释为独立的生命周期阶段 (período de vida) 
- Durante a execução, a competência será incluída no catálogo de competências do agente, e a aplicação de um rigoroso teste de estátias para o seu pacote de software.
-  para tarefas específicas de projeto, fazer uma seleção técnica racional entre ferramentas MCP, habilidades, ganchos, sub-códigos ou código comum.

## 十分钟极速初体验

Antes de ler a explicação em profundidade, primeiro complete esta operação. Você vai criar uma habilidade de micro-formação, instalar um pacote completo de revisor no ambiente do agente real, o usuário, verificar o resultado, e descarregar o resultado. Isso permitirá que você passe por um resultado de observação e testar pessoalmente o ciclo de vida inteiro.

### Verdadeiro hospedeiro experiência

O verdadeiro hospedeiro precisa de Node.js.`npx`、Python 3、 um ambiente de hospedeiro de seleção de habilidades de suporte, bem como o direito de escrever sobre o projeto ou domínio de usuário que você escolheu no instalador.

```bash
node --version
npx --version
python3 --version
```

Antes da instalação, primeiro determine o hospedeiro e o domínio de instalação que você vai usar. Se faltarem quaisquer dependências acima, você pode ler esta aula no site, ou realizar diretamente os exercícios de software abaixo.

### 1. Desde o seu currículo de trabalho

Em qualquer uso para armazenamento de aprendizagem

```bash
mkdir -p agent-skills-first-run
cd agent-skills-first-run
TARGET_ROOT="$(pwd -P)"
printf 'TARGET_ROOT=%s\n' "$TARGET_ROOT"
ls -A
```

O último mandamento deve não ter nenhuma saída. Se houver saída, por favor, mude um catálogo em branco, para que esta revisão tenha uma fronteira clara e clara.

Para a sua primeira habilidade  criar catálogo:

```bash
mkdir -p my-first-skill
```

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `my-first-skill/SKILL.md`, conteúdo como:

```markdown
---
name: my-first-skill
description: Turn rough meeting notes into a compact decision record when the user asks to capture a technical decision.
---

# Decision record

Extract the decision, context, alternatives, owner, and next review date.
If the notes do not contain a decision, ask one clarifying question instead
of inventing one.
```

验证该文件是否已成功创建在目标目录中:

```bash
test -f my-first-skill/SKILL.md
```

无任何输出和退出码为 0 表示文件已存在──

### 2. Instalação completa de revisores

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `agent-skills-first-run`Agora, não há nada a fazer.

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-contract-reviewer --full-depth
```

选择你当前正在使用的代理 宿主和作用域──安装器会列出 `skill-contract-reviewer` e a sua posição de objectivo de escrita.`--full-depth`参数, pois a habilidade fornecida nesta aula é um conjunto de programas que contém referências, guiões e ativos estáticos.

- Não .`SKILL_ROOT` Definitivamente, o sistema deve conter o sistema instalado `SKILL.md`O diretório, em vez de diretório de código-fonte do curso, também não é actual working zone:

```bash
# 将占位符替换为安装器打印出的绝对路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-contract-reviewer" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\n' "$SKILL_ROOT"
```

Se a reunião do anfitrião já estiver aberta, por favor, inicie uma nova reunião ou use a habilidade do anfitrião para refazer uma nova ordem de digitalização. Não presume que cada anfitrião vai fazer uma refazagem de lista de habilidades.

### 3. 显然调用 it

Em agente já instalado,`agent-skills-first-run`Para o catálogo de trabalho, use o modo de expressão que o host suportar:

| 宿主 | 显式调用方式 |
|---|---|
| Codex | 输入 `skill-contract-reviewer`，或从 `/skills` 菜单中选择，然后提交审查请求 |
| Claude Code | 输入 `/skill-contract-reviewer` 紧跟审查请求 |
| 通用可移植回退 | `Use skill-contract-reviewer to review the target package.` |

Em pedido usado impressão`SKILL_ROOT`和 `TARGET_ROOT`绝对路径── requer que o anfitrião execute e exprime as ordens completas antes de serem executadas, em vez de depender das ordens confusas do catálogo de trabalho atual:

```text
Use skill-contract-reviewer to review <TARGET_ROOT>/my-first-skill. The installed bundle root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/check_skill.py <TARGET_ROOT>/my-first-skill. Before running it, show the fully resolved argv. Return the validation report, selected primitives, and one sentence for each selection. Include the resolved script path, resolved target path, cwd, argv, and exit code as execution evidence.
```

解析后的命令应呈现如下结构,不留任何未填充的占位符:

```bash
python3 "/absolute/install/path/skill-contract-reviewer/scripts/check_skill.py" \
  "/absolute/workspace/path/agent-skills-first-run/my-first-skill"
```

Os resultados de revisão bem sucedida devem simultaneamente satisfazer as seguintes três características:

1. O hospedeiro pode encontrar o nome`skill-contract-reviewer`- Não.
2. 审查器成功读取程序包契约并运行其附带的验证脚本──
3.  Resposta de retorno contém um relatório de verificação (exemplo inclui erros estruturais) e dá recomendações sobre os componentes básicos de seleção.

 Execução de dados também deve ser explicitamente listado o roteiro do script, o roteiro do objetivo, o actual catálogo de trabalho, o cwd, o parametro de execução e o regresso.

Se o hospedeiro relatar que a habilidade é indispensável, verifique o caminho de instalação do objetivo, reescaneie ou reinicie uma vez o hospedeiro, e tente novamente o pedido de instalação obvio. Não, para esconder a falha da instalação, reescreva arbitrariamente a descrição da habilidade.

### 4. 探查隐式选择(Selecção implícita)

Amarcar um novo agente virar, inserir a mesma missão mas**不提及**O nome da habilidade:

```text
Review <TARGET_ROOT>/my-first-skill as a reusable agent package and tell me whether its package contract is valid.
```

Se o anfitrião mostrar aos usuários as habilidades escolhidas, registre se ele foi escolhido automaticamente.`skill-contract-reviewer` Se o hospedeiro não revelar os detalhes da decisão, então a seleção oculta será marcada como não verificada.

### 5. Limpeza ambiental

仅移除已安装的审查器程序包:

```bash
npx skills remove skill-contract-reviewer
```

选择与安装相同的主人和作用域──在重新扫描或新建会话后,显式请求 `skill-contract-reviewer`Devemos voltar a essa habilidade.`my-first-skill` para uso de cursos posteriores, também pode ser completamente excluído do catálogo de experiências após a conclusão da aprendizagem dessa direção.

## 问题

假设你的团队拥有一个非常可靠的发布上线工作流:查找已合并的改动;查看数据库迁移说明;更新变更记录;执行打包命令;并输出上线审查清单;

Se colocar este conjunto de fluxo de trabalho diretamente dentro de um longo prompt, embora conveniente copiar adesivos, mas em engenharia funcionalidade falhas surgem: este prompt  falta de identificação de identidade estável  falta de regras de serviço de localização  falta de recursos de carga de fronteiras  não há estrutura de pacote testável, e não pode responder a uma série de questões de engenharia básica: quem tem o direito de usá-lo? modelo em que momento deve ser selecionado? que script pode executar? quais documentos são confiáveis? quando o texto acima é comprimido, quais regras centrais podem permanecer?

Em vez disso, o erro extremo é transformar todas as instruções repetíveis em habilidades inteiras.`SKILL.md`O catálogo resultante parece ter uma estrutura geral, na verdade, ligando profundamente o comportamento não aberto de um determinado hospedeiro.

A principal tarefa do software engineering é:**分类**Antes de decidir como encomendar um componente, primeiro pense em saber o que é esse componente.

## 概念

### Competências 封装过程性知识 (Conhecimento procedural)

A Habilidade do Agente é uma.`SKILL.md`Por exemplo, a lista de dados de um documento de entrada é feita em uma página de entrada, que contém dados de dados de YAML, em conformidade com o modelo de gestão de dados.

```figure
skill-package-anatomy
```

- O que é isto ?**目录**O documento de marcação individual, não simples, é a única unidade mínima do Departamento de Relações Exteriores.`SKILL.md`Mas esqueceu o documento de recurso citado, mesmo que a sua linguagem original seja completamente correta, isto é um pacote de programas que está em falta.

### 临近概念辨析

| 构件类型 | 核心职责 | 何时加载或运行 | 不应被冒充为 |
|---|---|---|---|
| Prompt | 塑造单次模型交互 | 由应用或用户内联引入 | 包含丰富资源的带版本软件包 |
| 代码库规范（Repository instructions） | 阐明某特定代码库的固有通用准则 | 编码运行时进入该作用域时载入 | 可复用的具体任务工作流 |
| Agent Skill | 提供可复用的过程性知识 | 显式或隐式激活时载入 | 强安全隔离边界 |
| MCP Tool | 暴露类型化的远程能力 | 由模型或应用程序主动发起调用时 | 复杂详细的端到端操作步骤 |
| Hook（钩子） | 在特定事件发生时执行确定性逻辑 | 当所声明的事件发生时触发 | 具有概率性的模型自主路由 |
| Subagent（子代理） | 委托具有独立上下文和状态的任务 | 由编排器创建或调用时启动 | 静态的只读指令包 |
| Plugin（插件） | 分发更大规模的运行时功能扩展 | 宿主安装或启用它时生效 | 可移植的 skill 契约本身 |
| 习得的 Skill 库（Learned skill library） | 存储通过实践探索习得的行为沉淀 | 策略检索到先验程序或轨迹时 | 基于规范标准的 `SKILL.md` 软件包 |

 publicar habilidade pode orientar agente  como examinar a publicação  MCP servidor pode expor um centro de inscrição  Hook pode proibir a distribuição de código  Subagente pode examinar independentemente a versão candidata  Cada componente é capaz de ter um conjunto, porque eles respeitam as suas diferentes funções 

### Skil  一词指向的两种不同的理念

No campo da pesquisa científica, as habilidades são algumas vezes indicadas em código de programa aprendido, trajetórias de intercâmbio bem-sucedidas ou estratégias para um ambiente específico.

A habilidade do agente nesta série de cursos é muito diferente. É um pacote de software escrito ou selecionado manualmente, com declarações claras de documento, sistemas de acordo, catálogos de habilidades e dados, descreve progressivamente o mecanismo de manipulação, gerenciado pelo tempo de execução, bem como as ferramentas controladas pelo anfitrião. Pode ser gerado ou modificado por um agente, mas o seu formato em si não é obrigatório para a aprendizagem de química ou exploração.

| 评估维度 | Agent Skill 软件包 | 习得的 Skill 库 |
|---|---|---|
| 基本单元 | 包含 `SKILL.md` 的目录 | 程序代码、策略片段、交互轨迹或记忆记录 |
| 创建方式 | 人工编写、生成或精选策划 | 通常由 agent 在环境交互中自主探索习得 |
| 选用机制 | 依赖目录描述（Description）加运行时策略 | 基于任务状态的向量检索或策略匹配 |
| 执行方式 | 模型遵循 Markdown 指令并调用宿主工具 | 环境直接执行存储的行为逻辑或代码产物 |
| 可移植性 | 程序包契约可在所有兼容的宿主间流通 | 通常与特定环境及特定的动作空间深度绑定 |
| 评测标准 | 路由准确率、制品质量、安全及宿主兼容性 | 强化学习奖励值、任务成功率、泛化能力及库规模 |

Os dois conceitos estão em capacidade de ser repetíveis, mas não apenas porque eles têm o mesmo nome, mas também porque se misturam em um projeto de realização.

### Regra central do transplante

Competências de agente 规范在前面中强制要求两个必填字段:

```yaml
---
name: release-readiness
description: Inspect a release candidate when the user asks whether a version is ready to publish.
---
```

`name`É um identificador estável, deve cumprir as normas de nomeamento e deve estar em total conformidade com o nome do catálogo.`description`É um documento que é dado ao homem, mas também um modelo para o processo de linguagem.**能做什么**E também**何时应当选用它**- Não.

核心规范允许的可选字段包括:

| 字段 | 用途 | 可移植性说明 |
|---|---|---|
| `license` | 声明该程序包的开源或商用许可条款 | 核心标准规范 |
| `compatibility` | 声明环境要求（如 Python 3.10+、特定 CLI 工具等） | 核心标准规范 |
| `metadata` | 携带字符串键值的自定义扩展数据 | 核心标准规范 |
| `allowed-tools` | 建议预先批准的工具列表 | 实验性特性；不同宿主支持度不一 |

O Markdown está escrito para suportar a orientação de operação. Deve ser definido claramente o fluxo de trabalho, as principais decisões, as estratégias de tratamento de fracassos, bem como os caminhos relativos dos documentos de recursos de apoio.

```markdown
# Release readiness

Use this workflow for a release candidate, not for ordinary development builds.

1. Read `references/release-policy.md`.
2. Run `python3 scripts/inspect_release.py --format json`.
3. Stop if the report contains a blocking failure.
4. Produce the checklist from `assets/release-checklist.md`.
5. Ask for approval before any publish or tag action.
```

### 运行时扩展(Extensions de tempo de execução) é o segundo nível

部分宿主允许在前材料中写额外字段或关联特定配置文件──这些字段在特定平台上非常有用,但它们不属于通用可移植标准──

| 行为特性 | 宿主扩展示例 | 属于通用核心规范？ |
|---|---|:---:|
| 对模型自主路由隐藏，但保留用户手动直接调用 | `disable-model-invocation` | 否 |
| 对用户的命令菜单隐藏，但允许模型自主路由选用 | `user-invocable` | 否 |
| 在斜杠命令菜单中展示参数使用提示 | `argument-hint` | 否 |
| 在被委托的隔离子上下文中运行该 skill | `context`, `agent` | 否 |
| 固定模型型号或思考计算等级（Reasoning Effort） | `model`, `effort` | 否 |
| 注册生命周期自动化钩子 | `hooks` | 否 |
| 在 Codex 中禁用隐式调用 | `agents/openai.yaml` 策略 | 否 |

应将每项专利扩展视为外接适配器―― assegurar que mesmo quando esses segmentos são desligados, o fluxo de trabalho central ainda é legítimo; escrever descida de documentos de regresso para eles e, de fato, consumir os seus hospedeiros para realizar testes específicos―― não conhecidos pode ser directamente ignorado quando executado, o erro de rejeição, ou apenas ser conservado como original e não executar qualquer ato real―.

### A matéria frontal é executável

Antes que os dados em habilidades sejam leídos pelo modelo, já está a mudar o comportamento de funcionamento do sistema:

- 格式错误的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `name`Vai causar a falha do serviço.
- 含糊不清的  含糊不清的   含糊不清的   含糊不清的  含糊不清的 `description`Vai levar a um erro de intenção.
- O indicador de utilização artificial exclusiva irá excluir completamente essa habilidade do catálogo de habilidades disponíveis do modelo.
- 工具预授权配置会改变宿主是否弹出用户授权确认框──
- A reunião de administração será posteriormente executada e redirecionada para o sub-agente independente.

O sistema de avaliação de dados deve ser examinado de forma rigorosa, como os documentos de configuração e o código de negócios.

### Ciclo de vida da habilidade

```figure
skill-runtime-lifecycle
```

Cada arco no quadro representa uma fronteira com um modelo de fracasso independente:

1. **服务发现（Discovery）：**Processo de verificação disponível no processo de registro de pré-configuração.
2. **静态校验（Validation）：**Antes de ser exposto no catálogo, é preciso interceptar o programa de forma errada ou insegura.
3. **编目索引（Cataloging）：**                                                                                                                                                                                                                                                              `name`Com`description`, absolutamente não é o caso.
4. **决策选择（Selection）：**Por um modelo ou instrução expressa, determina se essa habilidade está relacionada com a tarefa atual.
5. **按需激活（Activation）：**- Não .`SKILL.md`O texto completo contém o modelo visível no texto abaixo.
6. **渐进披露（Disclosure）：** apenas em determinadas fases de execução realmente necessárias, apenas para ler referências ou ativos
7. **执行推进（Execution）：**Em revistas de direitos do hospedeiro e de regras de isolamento de caixas, convocar todos os tipos de ferramentas de hospedeiro.
8. **结果核验（Verification）：**Independente do modelo, a qualidade dos produtos produzidos.

混这些阶段会导致错误的思维模型: a habilidade de ser descoberto não é igual a ser ativado; a habilidade de ser ativada não é igual a obter todos os direitos de operação descritos; a utilização de ferramentas simples é deixada de lado e não é igual ao resultado final do negócio é correto.

### Habilidades e Ferramentas 正交互补

MCP  solução é: quais capacidades externas podem ser usadas pelos aplicativos atuais, o seu esquema de parâmetros é o que? enquanto habilidade  solução é: Como deve o agente  lidar com essa classe de tarefas em seu lugar?

```figure
skill-tool-orthogonality
```

Na escrita de habilidade pode-se mencionar o nome de uma ferramenta, mas a inscrição e o uso de ferramentas reais pertencem totalmente ao usuário do usuário. Se a ferramenta estiver ausente no ambiente de execução, a habilidade deve fornecer uma descrição de redução ou uma clara e clara informação, não se pode errar em pensar que uma habilidade mencionada na escrita irá criar a ferramenta em vão.

### Competências e código-libro de instruções de repositório) pertencem a diferentes domínios de acção

代码库说明文件(如 `AGENTS.md`) para descrever você**当前所处**O ambiente: construir ordens, codificar estilos, gerar regras de arquivo e redlines de segurança.

Quando ambos são aplicados simultaneamente, as instruções instantâneas do usuário e as regras existentes da biblioteca de códigos atuais possuem prioridades mais altas e formam um vínculo para a habilidade. Por exemplo, uma habilidade de reconstrução de uso geral não pode ser superior à biblioteca de códigos local.

### Habilidades 之间不进行代码级 Importação

Uma habilidade pode ser usada em linguagem literal para orientar outro, mas não é código de nível de programação.`import` A segunda habilidade utilizada continua a ser a completa experiência de funcionamento da empresa, a que se deve utilizar a capacidade de reconhecimento de qualificação, atividade, competência e gestão independente.

Quando se escreve sobre competências, deve-se expor como observação os seguintes passos de trabalho:

```markdown
After producing the candidate changelog, invoke the `release-risk-review` skill.
Pass the candidate path and require a blocking or non-blocking verdict.
If that skill is unavailable, stop and report the missing dependency.
```

Esta forma de expressão permite que as relações de dependência sejam testadas claramente, e dá ao hospedeiro a oportunidade de executar estratégias de conformidade durante a operação.

## 动手构建

`code/main.py` Realizar um testador de padrões de nível leve e um selecionador de componentes.

O teste de exibição externa:

- `parse_frontmatter(text)`O que é que se passa?
- `validate_skill_text(text, directory_name, allowed_runtime_extensions=())`A definição de um sistema de transferência de dados é:
- `ValidationIssue`Com`SkillReport`O resultado é um resultado de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de uma análise de resultados de resultados de resultados de uma análise de resultados de resultados de resultados de uma análise de resultados de resultados de resultados de resultados de uma análise de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de uma análise de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de resultados de
- `FrontmatterSyntaxError`Introdução rápida e rápida de um idioma estranho.

选型器对外暴露 `TaskShape`Com`select_primitives(task)` Dependendo das características reais da tarefa, o seu mapa será exibido como um código comum ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ 

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/22-skills-and-agent-sdks
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

O bloco de comando precisa clonar localmente o ambiente, e pode iniciar qualquer registro no armazém, para que`git rev-parse --show-toplevel`解析代码库根路径──

运输见 JSON 格式印一个合规的纯移植能力"",一个包含宿主扩展能力"",一个非法程序包"",以及多任务特征的选型决策结果――仔细观察输出问题代码―― um software package tester de boa qualidade deve indicar claramente como corrigir produtos, em vez de substituir os autores 胡乱猜――

### 验证顺序至关重要

Antes de executar regras de conteúdo de nível profundo, é necessário primeiro verificar as características estruturais de vendas mais baixas:

```figure
skill-validation-order
```

Seguir esta ordem rigorosa, capaz de prevenir eficazmente os erros de ocultação do sistema inicialmente destruído de uma base invariavel.

## Use-o

Antes de escrever uma nova habilidade, preencha seriamente esta carta de decisão:

| 决策问题 | 若答案为“是” | 最匹配的基本构件 |
|---|---|---|
| 该任务是否需要在多个步骤中反复运用模型的主观判断？ | 操作流程基本固定，但具体决策千变万化 | Skill |
| 该操作是否必须在特定事件发生时 100% 强制触发？ | 哪怕遗漏一次执行也是完全不可接受的故障 | Hook 或常规业务代码 |
| 模型是否需要调用具有类型化输入的外部能力？ | 该操作本身存在于模型的思维上下文之外 | Tool 或 MCP Server |
| 该工作是否需要完全隔离的上下文、独立状态或责任归属？ | 由独立的执行单元完成工作并仅返回受限结果 | Subagent |
| 该指南是否仅适用于当前这一个特定的代码库？ | 描述的是本地开发命令、目录规范与约束边界 | 代码库说明（如 AGENTS.md） |
| 单次简短的即时交互是否就足以解决问题？ | 无需任何版本化和包生命周期的管理维护 | Prompt |

Muitos processos de produção de nível complexo são geralmente compostos de vários componentes. Esta decisão pode impedir que o desenvolvedor se enredasse e que todos os recursos sejam inseridos em um único componente.

## Entrega-o

本课在 `outputs/`Já está tudo entregue.`skill-contract-reviewer`程序包──incluirá:

- Uma parte transplantable`SKILL.md`, para a análise e avaliação de competências;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- Um documentário de verificação automática de certeza (Scripts);
- 覆盖 prompt、技能、工具、hook、普通代码和 subagent 的全量任务特征测试具(Assets) 』

Instalação do conjunto inteiro, não apenas o seu ficheiro de entrada:

```bash
cd "$(git rev-parse --show-toplevel)"
python3 scripts/install_skills.py /tmp/aiefs-skills --phase 13 --type skill
```

 curso instalação de script output de cópia de cada Fase 13 habilidade,并生成 `/tmp/aiefs-skills/manifest.json`O catálogo de instalação do sistema é utilizado para a verificação de um pacote de estrutura; enquanto o anterior 10 minutos de experiência inicial provaram a descoberta e execução de serviços no ambiente do verdadeiro hospedeiro.

Os seguintes cursos serão aprofundados gradualmente em cada fase do ciclo de vida: 24o curso de abordagem de serviços e descoberta e divulgação gradual; 25o curso de estratégias e roteiros de significado; 26o curso de resolução rigorosa do controle de direitos e isolamento de caixa; 27o curso de instruções que irão criar todo o processo através de um rigoroso Eval  avaliação de produtos disponíveis para publicação.

## 课后深练习

1. Utilização `TaskShape`Para a sua própria equipe, os 5 fluxos de trabalho de desenvolvimento real diários são realizados por uma estrutura de categorias.
2. 编写边界测试用例:证明刚好 500 个字符的 `compatibility`字段能顺利通过, enquanto 501 字符的值将被视为超越规范标准的误准拦截──
3. Em um novo lançamento da lista branca, um novo lançamento foi publicado em um livro de revisão, que mostra que o documento ainda pode ser identificado com sucesso e que a sua capacidade de transplante é claramente diferenciada.
4. A partir de agora, a sua obra será mais complexa e mais completa.`SKILL.md`、 um documento de referência especial (referência) 、 um contrato de contacto de um livro, bem como um modelo de produção e de produção.
5. Por um lado, citando a capacidade de MCP Tool, que não é útil no ambiente atual, a resolução não permite que o seu uso seja substituído por outros instrumentos de maior alcance.
6.  revisar uma habilidade existente, que irá marcar cada frase de forma individual: 意图路由、操作规则、安全策略、参考资料指针或输出形式契约── decidir eliminar ou transferir qualquer conteúdo excedente que não pertença a essa categoria para o seu documento de resposta──

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|---|---|---|
| Agent Skill | "保存好的 Prompt 模板" | 包含过程性操作指南与可选资源的标准化、可发现文件目录 |
| 可移植核心（Portable Core） | "所有运行时共享的通用字段" | 由 Agent Skills 官方规范所定义的基础契约标准 |
| 运行时扩展（Runtime Extension） | "额外的 Frontmatter 字段" | 平台特定的专有配置，其行为生效需要对应宿主适配器的支持 |
| 激活（Activation） | "Skill 跑起来了" | Skill 的正文指令被完整载入模型可见的上下文，后续执行可能滞后发生 |
| Skill 依赖（Skill Dependency） | "Import 另一个 Skill" | 由运行时负责调度的调用关联步骤，受到环境可用性与权限策略的严密审查 |
| Tool 契约（Tool Contract） | "函数 Schema 声明" | 为某项外部能力所定义的输入、输出、权限、副作用、错误码以及审计证据规范 |

## 延伸阅读

- [Agent Skills 规范官方文档](https://agentskills.io/specification)- 权威的可移植目录与前目 契约标准──
- [Agent Skills 最佳实践指南](https://agentskills.io/skill-creation/best-practices)- 作用域界定、指令撰写及资源编排的最佳范式──
- [OpenAI: 构建 Skills 开发者指南](https://learn.chatgpt.com/docs/build-skills)- Conhecer em profundidade os comportamentos de utilização e descoberta de serviços no âmbito do Codex 环境.
- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)- abrangendo o mecanismo de utilização da plataforma, os parâmetros de sugestões, os instrumentos de pré-autorização e a expansão completa do mandato de execução da presente legislação,
