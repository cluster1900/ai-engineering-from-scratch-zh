# Registro de MCPs  cadeia de fornecimento:准入、漂移与回滚

> Registro 条目只能说明发行人声明的什么―― 生产级入门控制则必须证明你拿取了什么―― observado什么――批准了什么――以及你能安全恢复什么――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 17 (gateways and registries), Phase 13 · 18 (production authentication)
**Time:** ~90 minutes

## Objectivo de aprendizagem

- 明确切分 Registro 发布、软件包出处 (来源) 运行时发现与本地审批等不同边界──
- Em desconfiança MCP 服务端记录自声明的前提下,独立验证其命名空间──
- Para a publicação de registros, fontes de execução, embalagens de software e descrição de ferramentas em tempo real
- Depois de entrar, o Registo de Registo de Revisão de Estado mudou com o comportamento de execução.
- Em um pré-revisto de registros históricos, será rodado de forma segura até a versão previamente aprovada.
- 维护一个防改的准入账本 (Legisário de Admissão), para cada decisão, fornecer uma explicação auditoria.

## 核心问题

Encontraste-o no Registro.`com.example/inventory`◊ A sua descrição parece estar totalmente em conformidade com as necessidades.`server/discover`- Não.

Não é um fato isolado, mas um artigo escrito por diferentes autoridades:

1. Um editor que passou por esta certificação de identidade espacial enviou um registro.
2. Um centro de registro de embalagens distribuiu um trabalho com uma identificação específica e um resumo de hash.
3. Um ponto de partida de um sistema operacional real informa a versão do protocolo, a capacidade de suporte, os instrumentos disponíveis e a informação do terminal de serviço de diagnóstico.
4. A sua organização determinou que este conjunto de componentes definidos em estratégia é regulamentado e permitido para ser executado.

Se se misturar estas camadas, simplesmente pensar que, já que está no Registro, podemos confiar diretamente, ficará em uma enorme área cega na segurança da cadeia de fornecimento. Uma versão de publicação legal pode ser abandonada em qualquer momento. Se não tiver um resumo de material fixo, a tag do pacote de software pode ser substituída no futuro por um sistema secundário imprevisto.

之道是建立一个准入控制器 (Admission Controller), em cada uma das fronteiras, é obrigatório a recolha e a obtenção de certificados de admissão.

## O Registro é um índice, não o teu sistema de aprovação.

官方 MCP Registry Used for storage service端元数据──其`server.json`记录声明一个服务版本,并列出一个或多个软件包或远端点――o código de publicação contém nomes de nomes de espaço de certificação、 o código de publicação de verificação de direitos de propriedade、 o código de registro restrito e a posição de armazenamento de dados do editor estritamente limitada―

Estas medidas de controlo responderam:**发布层面**Mas a sua estratégia de segurança ambiental ainda tem de ser respondida.**部署层面**É um problema.

| 边界 | 核心问题 | 证据所有者 |
|---|---|---|
| 命名空间 | 该发布者是否有权使用此名称？ | Registry 认证凭证 + 本地验证过的命名空间输入 |
| 发布记录 | 发布者针对该版本具体声明了什么？ | 不可变的 `server.json` 内容摘要 |
| 执行源 | 最终执行的是哪个软件包或远程端点？ | 已声明的源字段、已验证的所有权结果、传输协议以及可信内容摘要 |
| 运行时 | 该端点当前实际暴露了什么能力？ | 实时 `server/discover` 结果与工具描述符 |
| 准入决策 | 本地安全策略是否批准了这套确切的组合？ | 本地固定的指纹（Pin）与账本记录项 |
| 运维治理 | 当前服务是否依然安全？故障时何者可替代？ | 漂移检测、状态同步、健康检查与备用回滚路由 |

Registro Schema  versão com MCP  acordo versão são independentes uns dos outros.`2025-12-11` serviços de gestão, enquanto os serviços de gestão de gestão de gestão de dados são apoiados por MCP `2026-07-28`Não podemos decidir de uma versão para outra.

```figure
mcp-registry-admission
```

## 单次准进决策中的七重控制

### 1. 命名空间验证

官方 Registry's naming adoption via身份认证的命名空间── um nome de domínio experimental pode ser mapeado como um pré── de um formato de nome de domínio reverso.`example.com`O controlo pode ser estabelecido.`com.example/*`A legalidade.

绝对不能使用简单的字符串前检查:

```python
server_name.startswith("com.example")
```

Porque esse julgamento também pode ser errado.`com.exampleevil/tool`- Não , não .`/`切分名称, exige que contenha um fragmento de arma não-caído,并精确比对命名空间这一段.

O controle de acesso deve unificar os dois caminhos para o mesmo parâmetro de entrada: uma cadeia de nomes de espaço totalmente correspondente e verificada.

### 2. 出处关联(Provenance Join)

Para registos de tipos de software, os dados da declaração devem estar estritamente ligados aos elementos de trabalho realmente extraídos nos seguintes parágrafos:

- 软件包注册中心类型(como PyPI、npm)
- 软件包标识符 (em inglês)
- 软件包版本号
- 已验证 de propriedade
- 实际下载工件的内容哈希摘要

Ao mesmo tempo, também é necessário um protocolo de transmissão de declarações de experiência. Se um artigo do registro apenas declara o ponto de extremo remoto, também é totalmente compatível, não pode ser rejeitado por falta de software. Para a fonte de experiência, é necessário que a URL e o tipo de transmissão da declaração sejam associados à propriedade do ponto de extremo verificado independentemente, bem como a cópia de hash de prova de conexão ou implantação.

Este código de exemplo de aula, ao mesmo tempo que suporta esses dois tipos de fontes, e será selecionado fonte com Registro 源、服务端名称、Registro 版本、记录摘要以及凭证摘要共同计算出一个哈希──生成的出处摘要(provenence digest) é um indicador de estreita relação com a cadeia completa de provas, mas não pode substituir a permanência permanente da prova original completa.

 Não pode ser aceito diretamente resumos fornecidos por um único aspecto do próprio processo de verificação

### 3. Decisições fixas, e não apenas versões fixas

Registro  versão é o único identificador de publicação. Os dados já publicados são imutáveis. Qualquer modificação de registro deve ser publicada para uma nova versão. Embora o uso de versão em linguagem oficial seja recomendado, o Registro não é obrigatório e não aceita um código de distribuição de versões semelhantes.

Isso significa algo parecido.`^1.4`O que é chamado de "Pin" é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é um "pin" que é "pin" ou "pin" que "pin" é "pin" que "pin" é "pin" ou "pin" que "pin" é " "pin " " " " " " " "pin " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " " "

```json
{
  "server": "com.example/inventory",
  "version": "1.0.0",
  "recordDigest": "...",
  "source": {"kind": "package", "registryType": "pypi"},
  "sourceDigest": "...",
  "toolsetDigest": "...",
  "provenanceDigest": "...",
  "registryStatus": "active"
}
```

Para vários níveis diferentes, fazer o arranjo de dentes ao mesmo tempo, pode permitir que você localize rapidamente a fronteira que ocorreu quando surgiu uma anomalia: em um mesmo Registro  versão abaixo do registro resumo mudou, pertence ao Registro dados integridade danificada; em um mesmo software packagem坐标或远程部署下源 resumé mudou, pertence ao execução fonte改; enquanto que o conjunto de ferramentas resumo 工具集摘要 (outilset digest) mudou, pertence ao funcionamento comportamento漂移.

### 4. 实时运行时漂移检测

准入流程必须主动观测实际接收业务流量的服务端实例──通过信任通道调用 `server/discover`, lista ou obtenção de descrição de ferramentas expostas, e verifica:

- `supportedVersions`Contém`2026-07-28`O artigo 2.o
- Todos os requisitos de estratégia no local já estão em vigor;
- Cada instrumento descrito tem uma identificação de identidade e um esquema definido;
-                                                                                                                                                                                                                                                               

Resultados entre escolhidos`_meta["io.modelcontextprotocol/serverInfo"]`O diagnóstico pode ser registrado como informação de diagnóstico, mas não é um problema de saúde.**绝不能**Como base de qualquer decisão de segurança, o software deve ser utilizado como base de avaliação de nomeamento de espaço, de propriedade de software, de endpoint de pertencimento, de acesso ou de qualquer decisão de segurança.`_meta`Direito do Ministério`serverInfo`别名更不属于官方契约字段, absolutamente indispensável que seja elevado para o certificado de diagnóstico legal.

Apenas se pode classificar os segmentos que não têm significado em si mesmos. Este exemplo é utilizado para calcular hash antes de classificar a lista de ferramentas de acordo com o nome do instrumento, de modo que a mudança de ordem de retorno pura não será errada como漂移. Mas nunca será abandonada qualquer segmento do descritivo.

O código de exemplo irá transformar qualquer descrição de erro de formato em um descrito ou resumo de descrição em um comportamento desviado, imediatamente separando o dedo, retirando o seu caminho ativo e bloqueando a sua qualificação como objetivo de retorno. Em um ambiente de produção, mesmo que seja insignificante, a alteração da descrição também deve ser totalmente nova, pois o modelo grande deve ser baseado na descrição da ferramenta para decidir se a modificação do texto na superfície da ferramenta é suficiente para mudar radicalmente o comportamento de execução do Agente.

### 5. Registro  estado é real时动态 estado

A API de registro irá adicionar uma classe de resposta a cada serviço junto ao registro.`_meta`Objecto: ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐`_meta["io.modelcontextprotocol.registry/official"]`路径下──准入控制器需解析该响应并读取 `_meta["io.modelcontextprotocol.registry/official"].status` diretamente localizado no ponto de origem `_meta.status`Não está em conformidade com o formato oficial de transmissão. Não confundir dados de resposta externos com dados de transmissão de registros internos.

- `active`: "Devolver-se como indicado, tendo o direito de candidato a candidatura local;
- `deprecated`O programa de seleção automática não é mais adequado para a cooperação, embora possa ainda ser examinado, mas seja acompanhado de notificações;
- `deleted`O arquivo histórico foi consultado em uma entrevista com o editor de Notas:

准入完成后必须持续同步状态―― uma vez que a versão ativa original foi marcada como abandonada ou excluída, deve imediatamente ser separada de suas impressões digitais e parar de dar-lhe novos tráfego de rotas―― ao mesmo tempo, deve ser preservado todo o histórico de certificados de exclusão na lista de preferências, absolutamente não significa que você pode excluir o registro de rastreamento de auditores em local――

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `_meta.io.modelcontextprotocol.registry/publisher-provided` Os dados responsáveis pelo registro são totalmente independentes.

### 6. Volta significa caminho de recuperação

O processo de re-roll não será alterado. O chamado re-roll, que é selecionado entre os dedos fixos que já foram aprovados e ainda estão em conformidade com as condições, e que mudam os objetivos do caminho ativo.

Um objetivo de segurança deve ser simultaneamente cumprido:

1.  ter um registo de acesso completo e legal;
2. Em termos de estratégia local actual, o seu Registo continua a ser ativo;
3. Não identificado como estado de isolamento por qualquer aviso de segurança ou certificado de segurança em circulação;
4. 依然能精确解析到已固定的软件包和线上描述符集合;
5. 通過當前最新健康檢查──

Este exemplo de aula é o primeiro e o segundo ponto de avaliação.

### 7. 追加准入账本 (aleguação de contas)

准入数据库只能说明目前活跃的是什么,而准入账本 (admission ledger) 记录为什么是它──

Cada item do livro de estudos contém o número, o tempo, o tipo de evento, o tipo de serviço, a identificação, a versão, o resultado da decisão, as razões, o conjunto de evidências, o primeiro e o segundo episódio, o que pode causar a falha total do registro e da avaliação do episódio de todas as cadeias subsequentes.

Este é um mecanismo com capacidade de revisão de modificações ([[evidente]]), mas não é mágico e inviolável.

## Handwriting realizado

Código de comando de operação direta está localizado em`code/main.py`中, tudo baseado em Python 標準庫实现──

首先运行有限状态演示:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
```

A demonstração segue a execução de cinco operações centrais:

1. 准入 `1.0.0`, nuclear验匹配的命名空间、包出处、协议版本、能力及工具集;
2. 准入 `1.1.0`E transformá-lo em um caminho ativo;
3. Durante a execução, observe um instrumento de remoção inesperado;
4. 观测到 `1.1.0`O estado oficial do Registro é alterado.`deprecated`O artigo 2.o
5. O caminho vai ser planejado e recuperado até ao seu cumprimento.`1.0.0`- O que é isso?

预期输出结构:

```json
{
  "admitted": [true, true],
  "driftAllowed": false,
  "rollbackAllowed": true,
  "activeVersion": "1.0.0",
  "ledgerValid": true
}
```

建议按以下顺序研读实现代码:

1. `namespace_for_domain()`Com`namespace_matches()`Estabelecer limites de direitos de nomeamento;
2. `digest()`Com`normalized_tools()`: resumo de credenciais de determinação;
3. `RegistryAdmissionController.admit()`: agrupar a publicação de registos, a publicação de credenciais, a observação de operações e a estratégia local;
4. `check_live()`: em relação aos dados de observação mais recentes e a impressão de dedos já definida;
5. `observe_registry_status()`: executar o isolamento de versões de registos  estado de transição;
6. `rollback()`: só activar o objetivo de regresso legal previamente aprovado e em conformidade com as condições;
7. `AdmissionLedger.verify()`O que é que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é o que é?

## 运行与使用

O controlador de entrada está localizado entre o detector e o roteiro:

```text
Registry sync -> artifact verifier -> live discovery -> admission controller -> route table
                                                |                 |
                                                v                 v
                                           evidence store    admission ledger
```

Para as tarefas acima, a distribuição de poderes mínimos é separada: Registro e tarefas de processamento necessitam de apenas leitura de dados; tarefas de processamento de componentes necessitam de acesso ao pacote de software; routes de regulação e controladores necessitam de ativar o direito de obter a impressão digital de aprovação.

明确划分版本的状态模型:Approvado( já aprovado) significa que o título de licença passou pela revisão estratégica;Activo( ativo) representa o actual caminho que está a ser escolhido;Quaranteado( já separado) significa proibição de receber novas solicitações de negócios;Superseded( já substituído) explica que outra versão já aprovada está realmente em estado ativo;.

 deve estar em direcção `tools/list`O cliente pode, por acaso, encontrar e utilizar ferramentas não confiáveis durante a janela de tempo de publicação e avaliação de estratégias de segurança.

## 交互式实验

Você vai ver os limites de cada um de nós.

### 实验 A: nome空间冲突

进入代码目录并打开 Python 交互环境:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/code
python3 -q
```

执行如下命令:

```python
from main import namespace_matches
namespace_matches("com.example/inventory", "com.example")
namespace_matches("com.exampleevil/inventory", "com.example")
```

O primeiro resultado é:`True`O segundo resultado é:`False`                                                                                                                                                                                                                                                              `startswith`, observe por que o segundo mal-intencionado se rompe a fronteira.

### 实验 B: descrição

```python
from main import *
times = iter(f"2026-08-21T12:00:{n:02d}+00:00" for n in range(10))
c = RegistryAdmissionController(clock=lambda: next(times))
meta = {OFFICIAL_META_KEY: {"status": "active"}}
c.admit(sample_record("1.0.0"), meta, "com.example", evidence_for("1.0.0"), sample_live("1.0.0"))
c.check_live("com.example/inventory", "1.0.0", sample_live("1.0.0", True))
```

 Recausações e estado de rotação de revisão  Software packaging e Registry  registros  registros  nada mudou, mas devido a mudanças na superfície da ferramenta durante a operação, o dispositivo de controle imediatamente se isolar e parar de usar essa linha fixa  É por isso que o controle de segurança da cadeia de fornecimento deve atravessar todo o ciclo de vida após a instalação

### 实验 C: estado com rolamento

准入 `1.1.0`, marcando-o como abandonado, e tentando re-envolver separadamente para estes dois objetivos:

```python
c.admit(sample_record("1.1.0"), meta, "com.example", evidence_for("1.1.0"), sample_live("1.1.0"))
c.observe_registry_status("com.example/inventory", "1.1.0", "deprecated")
c.rollback("com.example/inventory", "1.1.0", "unsafe retry")
c.rollback("com.example/inventory", "1.0.0", "restore known release")
c.ledger.verify()
```

O objetivo de isolamento será claramente rejeitado, enquanto o anterior conforme a regulamentação.`1.0.0`O número de dados que você tem no seu site é de apenas um minuto.

## 动手实践

Por controlador ampliar 双人审批门禁 双人审批门禁 双人审批门)

需求规范:

-  A aprovação da informação deve ser armazenada como referência à prova de assinatura digital, e deve ser conservada como um símbolo de variação nas impressões digitais;
- Quando os instrumentos estão concentrados ,`destructiveHint: true`No caso de um instrumento de risco elevado, é necessário exigir duas assinaturas de censores diferentes;
- Recusar a aprovação do recomposto;
- Quando a aprovação não está pronta, ainda há registros completos no livro de conta do seu primeiro intento de entrada;
-  redacção de testes, que abrangem 0 pessoas, 1 pessoa, reapreciação e 2 diferentes cenários de aprovação de legitimidade;
- O jornal não tem de imprimir assinaturas digitais, chaves de credencial ou parâmetros de ferramentas privadas completas.

验收标准: sempre que faltem dois revisores independentes para a aprovação assinada de resumos de registros totalmente concordantes 软件包摘要和工具集摘要, ferramentas destrutivas são absolutamente incapazes de entrar em estado de via ativa.

## 交付产物

本课程交付 `outputs/skill-mcp-registry-admission.md` Em revisão de novos registros  versões ou em emissão de dados, quando se deslocam, pode ser considerado como um código de dados de cópia direta.

## 验证标准

运行演示程序与全套确定性单元测试:

```bash
cd phases/13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试套件 deve ser rigorosamente comprovado:

- 精确的命名空间边界能成功拦截形似前的恶意名称;
- 只有官方命名空间所附附的登记处 状态才能决定版本是否有候选资格;
- Os pacotes de software não experimentados ou não correspondentes ao conteúdo e os credenciamentos de ponto de partida remoto serão decididamente rejeitados;
- 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管元数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据 官方托管数据
- A classificação da lista de ferramentas foi regulamentada, sem ocultar a alteração substancial do descrito;
-  estrutura  mudança de software e ferramentas que podem provocar falhas de segurança;
- `serverInfo` não lhe é concedido qualquer direito de acesso,
- Quando o descrito ocorre, o sistema executará imediatamente o segregamento e a retirada do rotor, bloqueando o rolamento do dedo;
- O estado de alta variação pode impulsionar a separação das dentes ativas;
- Não é possível selecionar versões isoladas ou desconhecidas;
- Qualquer alteração no registro histórico do livro pode ser imediatamente verificada.

## O sistema de produção

| 故障现象 | 发生原因 | 必须采取的应对措施 |
|---|---|---|
| 名称看似合法但命名空间从未经验证 | 准入策略轻信了记录内部的自述文本 | 严格拒绝，直到可信命名空间验证方提供精确前缀 |
| 相同软件包坐标拉取到了全新的二进制内容 | 上游版本被覆盖或分发源遭受投毒篡改 | 立即终止激活，保留两份摘要，调查拉取网络边界 |
| “latest”版本在未经人工审查的情况下发生漂移 | 浮动版本选择绕过了固定指纹机制 | 始终只解析和激活完全精确的已准入版本与摘要 |
| 安全审查通过后线上悄然出现新工具 | 发生了运行时行为漂移，或部署了不同镜像 | 隔离该路由，重新采集最新的实时描述符快照 |
| 已废弃的版本依然在线上持续运行 | 状态同步机制缺失或同步存在严重延迟 | 建立定时状态调和机制，并在每次路由激活前复核 |
| 已删除记录在默认同步中彻底消失 | 客户端只向 Registry 增量请求活跃记录 | 采用增量式或感知删除事件的调和机制，并在本地归档历史 |
| 回滚的目标版本根本从未通过准入审查 | 路由切换与准入审批状态彼此脱节 | 坚决拒绝回滚，强制对该目标走全新的准入流程 |
| 攻击者重写全部账本后本地依然校验通过 | 哈希链缺乏外部信任根的约束锚定 | 定期将带签名的账本头发布到独立的外部信任域 |
| 留存的凭据中泄露了 Bearer Token 或参数 | 日志和证据记录盲目复制了完整请求 | 在采集入口处执行脱敏，仅持久化留存最小必要凭据 |

## 运维守则

O processo de publicação responde que a pessoa tem o direito de publicar esse nome? O processo de entrada responde que temos certeza de executar esse trabalho específico e de expor esse comportamento específico ao grande modelo?

## 延伸阅读

- [官方 Registry server.json 规范要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [官方 Registry OpenAPI 接口定义](https://registry.modelcontextprotocol.io/openapi.yaml)
- [MCP 2026-07-28 服务端发现规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
