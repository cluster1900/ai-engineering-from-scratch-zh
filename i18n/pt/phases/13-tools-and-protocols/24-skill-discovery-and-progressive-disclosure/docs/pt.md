# Descoberta de competências e divulgação progressiva

> Uma habilidade já desempenhou um papel antes de sua escrita ser carregada. Seu nome e descrição ganham um lugar no catálogo; enquanto documentos de nível mais profundo só são qualificados para entrar no seguinte quando as tarefas realmente as tocam.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22 (Agent Skills: Portable Contract and Runtime Boundary)
**Time:** ~105 minutes

## Objectivo de aprendizagem

- Construir um                                                                                                                                                                                                                                                             
- 解释三种渐进式披露级别(três níveis de divulgação):目录元数据(catálogo de metadados)、激活指令(instruções ativas)和特定任务资源(任务特定资源)。
- design referências (referências), permitindo que o agente possa obter diretamente os detalhes necessários, sem precisar carregar todo o pacote.
- O orçamento do catálogo (Budget do catálogo) e a capacidade de ativar a atividade da atividade
- Em habilidade 读取自身资源时,拒绝路径穿越 (route atravessada) 和符号链接逃逸 (symlink escape)

## 问题

O teu agente instalou 200 habilidades. Se a conversa começar, carrega cada uma.`SKILL.md`、 Referência de arquivo (referência de arquivo) 、脚本和模板, tarefas atuais serão inundadas em detalhes de processo irrelevantes.

常见的折中方案是目录(catalog): para mostrar o modelo de cada habilidade qualificada, apenas depois de ser selecionado para carregar o texto completo.

Primeiro, encontrar (descoberta) não é apenas uma recorrência de documentos.

Em segundo lugar, revelação progressiva) pode se transformar em confusão progressiva.`SKILL.md`写着阅读相关指南,而包内包含12指南,模型就只能靠猜猜.

O tempo de execução (runtime) pode tornar o processo de descoberta determinante, e fazer com que a informação seja divulgada profundamente.

## 概念

### 发现是一个编译器流水线

O sistema de arquivos é visto como entrada de código-fonte. Não seja diretamente publicado o caminho original para o modelo.

```figure
skill-discovery-pipeline
```

Cada fase deve gerar dados estruturados e erros estruturados.

- - Procurava o que quer que fosse?
- - Encontraste alguma candidatura?
- Rejeitou qualquer candidatura, porquê?
- Qual é o melhor resultado do conflito?
- Devido às limitações orçamentais, quais dos itens são cortados ou omitidos?

Se não houvesse estas evidências, era quase impossível diagnosticar por que o modelo não usasse a minha habilidade.

### 作用域是运行时策略

A normativa de transferência define a estrutura do pacote de habilidades, mas não define um único caminho de instalação ou ordem de prioridade para uso geral.

Uma operação geral pode utilizar os seguintes domínios de atuação:

| 作用域 (Scope) | 示例根目录 | 预期所有者 |
|---|---|---|
| Workspace (工作区) | `<repo>/.agents/skills/` | 项目维护者 |
| User (用户) | `<user-data>/skills/` | 单个开发者 |
| Administrator (管理员) | `<system>/skills/` | 机器或组织策略 |
| Plugin (插件) | 已签名的插件包 | 插件发布者与安装者 |
| Built-in (内置) | 运行时自带包 | 运行时提供商 |

截至2026年8月,Codex 文档规定项目级发现会从 `$CWD/.agents/skills`开始上升遍历祖先目录直至代码仓库根目录,外加、用户管理员和内置位置──它支持符号链接的技能 目录──同名技能可能同时出现,而不是被合并──这些是Codex's具体行为,并非`SKILL.md`                                                                                                                                                                                                                                                              [Codex skill 文档](https://learn.chatgpt.com/docs/build-skills)- Não.

绝不要凭空从目录名称推断优先级――应将其声明为明确策略并进行测试――本课实验为每一个课程.`Scope`Utilizando uma prioridade de números inteiros (Rank inteiro), garantir que o mesmo conjunto de candidatos sempre resolva o mesmo resultado.

###  konflikt需要超越 `name`O único identidade

- Não .`release-readiness`O pacote pode ser legal. Um pode ser o nível de cobertura do projeto, o outro é o de configuração por defeito do usuário.

```json
{
  "name": "release-readiness",
  "description": "Inspect a release candidate for this repository.",
  "scope": "workspace",
  "source": "/repo/.agents/skills/release-readiness",
  "selected": true
}
```

常见冲突策略包括:

| 策略 | 优势 | 风险 |
|---|---|---|
| 保留所有候选包 | 不会隐藏任何内容 | 模型会看到歧义的名称 |
| 最高优先级作用域胜出 | 调用简单直接 | 本地包可能会遮蔽（shadow）受信任的包 |
| 拒绝重复项 | 无隐式遮蔽 | 合法的覆盖机制将失效 |
| 按来源限定名称（命名空间化） | 身份明确 | 面向用户的名称变长 |

Para acolher  escolher uma estratégia. Mesmo que alguns pacotes não apareçam no catálogo do modelo, devem ser conservados no diário de diagnóstico para os pacotes de candidatos que foram rejeitados ou ocultados.

### Três categorias

A Agência de Habilidades 规范 descreveu分阶段加载(fase de carga) ⋅ Its key lies in each grade has different purposes──

```figure
skill-disclosure-levels
```

#### Nível 1: 目录元数据 (Catálogo de Metadados)

O modelo requer informações suficientes para distinguir essa habilidade de habilidades próximas. As estimativas de regulamentação de cada item do catálogo ocupam cerca de 100 tokens, mas a sequenciação e tokenização reais são decididas pelo anfitrião.

Uma descrição útil contém duas frases:

```yaml
description: Validate a release candidate and produce a readiness report. Use when the user asks whether a version, tag, or package is ready to publish.
```

Primeiro, a capacidade de expressão (capacidade) e segundo, a limitação (trigger boundary) do teste (exemplo: "exame de experiência") e segundo, a probabilidade (exemplo: "exame de experiência") de expressão (exemplo: "exame de experiência") são as seguintes instruções:

#### Nível 2: 激活指令 (Instruções ativas)

                                                                                                                                                                                                                                                              `SKILL.md`保持在500 行内内── é um sinal de orientação de design, não um objetivo a preencher──

O texto deve incluir:

- 任务边界;
- 默认工作流;
- Condições de funcionamento;
- Referências directas a documentos de nível mais profundo;
- 工具和脚本契约(contrato);
- O comportamento de perda de vida;
- 预期输出及其验证方法──

Não apenas para fazer o documento de entrada ser curto, vamos transferir o fluxo de trabalho central para o centro de referência.

#### Nível 3: 支资源 (Ressursos de apoio)

Referências  fornecer detalhes ou dados. Scripts  fornecer determinação de cálculo.

| 目录 | 模型是否读取？ | 模型是否执行？ | 典型内容 |
|---|:---:|:---:|---|
| `references/` | 是，在需要时 | 否 | schemas、策略、领域指南 |
| `scripts/` | 可以视情况检视 | 通过被允许的工具 | 验证器、转换器、数据收集器 |
| `assets/` | 仅在有用时 | 否 | 模板、fixtures、图像、起始文件 |

Estes catálogos são apenas um tipo de registo, não tem capacidade mágica.

### 面向分支的具体参考优于粗暴专题倾倒

O documento de entrada será elaborado em quadro de decisão:

```markdown
## Choose the path

- For a Python package, read `references/python-release.md`.
- For a container image, read `references/container-release.md`.
- For a documentation-only release, read `references/docs-release.md`.
- If the release combines artifact types, read only the guides for those artifacts.
```

Isto dá a cada referência uma condição de carga observável.`references/` Get more information

保持引用图(referência gráfico) 平浅显──官方指南建议从 `SKILL.md`直接链接, evitar profundos nível de调用链──单跳(one hop) faz com que a disponibilidade seja fácil de testar,并降低所需约束条件从未进入上下文的风险──

```figure
skill-reference-map
```

### O orçamento actual e o orçamento ativo são dois tipos independentes de orçamentos.

设 $c_i$Para a habilidade$i$O processo de sequenciação de registos$B_c$Para o orçamento,$b_j$Para ativar a venda de produtos,$r_k$Por causa do actual carregamento de recursos.

```text
catalog_cost = sum(c_i for every published skill)
active_cost = sum(b_j for every activated skill) + sum(r_k for every disclosed resource)
```

 Reduzir um orçamento não reduzirá automaticamente outro orçamento                                                                                                                                                                                                                                                       

O Codex atualmente, no caso de uma grandeza de janela de texto conhecida, controla o orçamento da lista de habilidades iniciais em 2% da janela de texto conhecido. O limite de 8.000 caracteres é apenas no caso de uma grandeza desconhecida na janela de texto conhecido; não é o segundo limite superior de 2% sobreposto em regras. Quando o catálogo excede o orçamento adequado, a descrição pode ser encurtada ou omitida. Por favor, considere estes números como estratégias específicas do Codex em questão, e não como uma propriedade universal do padrão de habilidades de agente.

### 资源路径是信任边界

Uma habilidade  deveria apenas poder ler os documentos do seu próprio pacote.

```text
references/../../../../.ssh/config
references/external-link -> /private/company-secrets
```

Utilize file system linguística para resolver o catálogo raiz e o caminho dos candidatos, rejeitar absolutamente o caminho de entrada, e verificar se o caminho dos candidatos após o cálculo ainda está sob o registro raiz do cálculo.

```figure
skill-resource-containment
```

O método de restrição não pode criar confiança em conteúdo. Uma referência interna válida ainda pode conter instruções de mal-intenção.

### O processo de carga deve ser observado

记录披露事件, ao mesmo tempo evitar registar informações confidenciais:

```json
{
  "event": "skill.resource.loaded",
  "skill": "release-readiness",
  "resource": "references/python-release.md",
  "reason": "candidate contains pyproject.toml",
  "bytes": 2840
}
```

`reason`字段将一次上下文选择转化为可供审查证据―― também ajuda a identificar as instruções ruins que levam o agente a evitar a carga de todos os documentos

## Construí-lo

`code/main.py`Construir um motor de descoberta e divulgação de certeza.

发现模块的接口包括:

- `Scope`: para fontes e dados prioritários;
- `SkillCandidate`Indicar o número de candidatos de um sistema de documentos não verificados;
- `discover_scope(scope)`O que é o "Caso de Formação"
- `resolve_collisions(candidates, precedence)`Aplicação de estratégias de conflito;
- `CatalogEntry`Com`build_catalog(...)`: publicar os dados de valor;
- `CatalogBudget`O número de caracteres é igual ao número de tokens comuns.

披露模块的接口包括:

- `load_skill_body(entry, ...)`Para uso no Nível 2 de atividade;
- `validate_reference(skill_dir, reference)`: para controlo de restrições de rotação;
- `load_reference(...)`Para uso no nível 3

运行实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/24-skill-discovery-and-progressive-disclosure
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

O bloco de comando precisa clonar localmente o ambiente, e pode ser resolvido através do código de trabalho arbitrário do clone.

A apresentação criará um domínio de trabalho temporário e um domínio de usuário, introduzirá conflitos, construirá um catálogo sob um orçamento muito pequeno, ativará uma habilidade, e tentará, de forma distinta, referências legais  leitura e o catálogo através de fuga.

### Por que é que a descoberta é de baixo nível

`discover_scope`仅检查直接子目录下 `SKILL.md`Não vai voltar para cada um dos seus conjuntos.`SKILL.md`视为独立包── protege as fronteiras do pacote, evitando a publicação incidental de habilidades instaladas 内部 de exemplos ou de testes fixes──

### Por que o experimento não resolve arbitrariamente YAML

实验仅支持其目录所需标量前材料――生产运行时应使用安全的YAML 解析器,备式显式 schema、大小限制,并禁用自定义对象构建――仅使用标准库(Stdlib-only) é um conjunto de ensino, e não um empréstimo de um desenvolvimento arbitrário incompleto de YAML 方言――

## Use-o

Esta lista de verificação pode ser aplicada a qualquer adaptador encontrado:

1. Lista de todos os registos de funções e de todos os titulares dos direitos de inscrição
2. 明确说明是否允许符号链接包──
3. 校验包名、目录名、必需元数据和入口正文大小──
4. O que é o "reservado" de um "reservado" de identidade interna?
5. 声明并测试同名重复行为。
6. 精确测量发送给模型的序列化目录大小──
7. Record Load de um texto ou recurso de causa.
8. O recurso será lido com restrições estritas no catálogo de encomendas de análise posterior.
9. Quando o documento citado está faltando, o documento está perdido.
10. Quando o estado de instalação ou estratégia mudarem, reedificar o catálogo.

## Entrega-o

O curso foi concluído.`skill-catalog-builder`组件包── é executado em conformidade com o código-fonte de código-fonte, rejeita o código-fonte de código-fonte, resolve conflitos entre domínios de função, rejeita o código-fonte de código-fonte de código-fonte de código-fonte, rejeita o código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte de código-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-fonte-conte-fonte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-conte-con-conte-con-

O relatório JSON contém artigos selecionados, pacotes de candidatos obstruídos, pacotes ignorados, erros de avaliação, prioridades e uso do orçamento. O carregamento de documentos de referência e de texto permanece como operação independente, portanto, o construtor de catálogos não executará o script, nem colocará o pacote inteiro diretamente no texto abaixo.

## 练习

1. Adicione um plugin 作用域, colocando a sua prioridade entre o usuário e o incorporado ⋅ edit test prov its conflict-solving results⋅
2. O processo de desenvolvimento de estratégias de conflito foi transformado em um processo de desenvolvimento de estratégias de conflito.
3. Por`load_reference`Adicionar um grande limite. Teste um perfeito equivalente a um documento de limite e um documento de maior número de caracteres.
4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
5. Adicionar um que contenha cada referência e script 哈希值的表文──在加载前检测出被改的资源──
6. Para demonstrar os pontos de adição, separadamente relatar Nível 1、 Nível 2 e Nível 3 de caracteres.

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| Skill 发现 (Skill discovery) | “找到所有 SKILL.md” | 搜索配置的作用域，校验包，附加来源溯源信息，并应用策略 |
| Skill 目录 (Skill catalog) | “已安装 skills 列表” | 面向合格包的、模型可见的紧凑路由元数据 |
| 冲突策略 (Collision policy) | “哪个重复项胜出” | 针对来自不同来源的同名候选包所声明的处理规则 |
| 渐进式披露 (Progressive disclosure) | “懒加载” | 从目录到正文再到特定分支资源的分阶段上下文引入 |
| 引用图 (Reference graph) | “skill 链接的文件” | 可达的资源结构及其加载条件 |
| 路径限制 (Path containment) | “留在文件夹内” | 验证解析后的资源目标路径始终位于解析后的包根目录下 |

## 延伸阅读

- [Agent Skills 规范](https://agentskills.io/specification)O que é um dos principais aspectos da política de desenvolvimento?
- [优化 skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions): Conheça o código do catálogo
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices)O que é um "controle" de um documento de entrada?
- [OpenAI: Build skills](https://learn.chatgpt.com/docs/build-skills)O código de código é um código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de
