# 无状态 MCP 网关与 Registro 准入

> 网关应让每条路由都清晰明确――2026-07-28 规范赋予它方法,名称,版本,capacidade,身份识别,缓存和跟踪边界,而无需依赖任何传输层会议――

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15 (security), Phase 13 · 16 (authorization)
**Time:** ~75 minutes

## Objectivo de aprendizagem

- A partir de 2026-07-28, não dependem de uma conversação pessoal.
- Antes de aplicar estratégias ou transformações, primeiro verificam cada pedido de dados e de roteiros.
- Baseado em: RBAC e Cachem de Reserva Privada
- O registro  registar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
- O SSE do domínio de roteiro do pedido`subscriptions/listen`、MRTR 重试以及 Tasks 扩展调用──
- 支持与现代代码路径进行物理隔离──

## 问题

Conectar um único cliente diretamente a um único servidor é muito simples. Mas, à medida que a escala se amplia, o ambiente de produção mais complexo precisa dar uma resposta única aos seguintes problemas:

- Permitir-me ligar a quais servidores?
- Qual é o objeto capaz de ver e ajustar uma ferramenta específica?
- Como é que se trata quando os dois últimos são expostos com o mesmo nome?
- Como examinar a evolução do descrito?
- Onde devem ser executados os eventos de limitação de taxa e auditoria?
- Qualquer instante no grupo pode tratar a próxima solicitação?

网关(Gateway) carga em um cliente e um servidor MCP de cada terminal 介介──.

旧版网关设计往往将一个客户端会议多路复用多后端会议 中,并对 `Mcp-Session-Id`进行重写──这纯粹属于旧版兼容设计──2026-07-28 核心协议中已经没有任何协议会议的概念──

## 概念

### 现代网关请求路径

 para cada pedido de entrada:

1. Desde o poder de transferência de dados
2. 验证 `MCP-Protocol-Version`- Não.`Mcp-Method`- Não.`Mcp-Name`E também`params._meta`- Não.
3. Autorizar os temas, os recursos, os métodos, as ferramentas e os argumentos.
4.  aplicativo descrito  estratégia registro 准入策略 限流策略和数据合规策略──
5. Para a seleção posterior, construir um novo e completo, autoconhecido,
6. Resultados de retorno do endereço de teste, e resultados de processamento do nível de rede de retorno do cliente.
7. - Não há nenhuma informação sobre o caso.

O processo inteiro não requer nenhuma sessão de protocolo oculta. O estado do nível de aplicação ainda pode ser bem mantido em base de dados, em termos de expressão, em tarefas de expansão ou em um estado de MRTR com proteção completa.

### 运行时策略 é a primeira decisão da rede

O mecanismo de acesso determina qual versão posterior pode acessar o gateway, mas não representa a aprovação de um determinado tipo de configuração em tempo real. Para cada solicitação, o gateway deve ser baseado em um sujeito certificado, emitente e recurso, alugador, método e nome correspondente, parametros regulamentados, descrição de acesso, credenciais de bloqueio, estado de saúde em tempo real, capacidade, distribuição, classificação de dados, estado de fluxo e qualquer ação de aprovação de ligação, estratégia de segurança recalculada.

Esta ordem de prioridade é essencial: Registro  registro  registro  pode ainda estar em estado válido, mas o papel do usuário pode ter sido cancelado; hash de um descritivo  bloqueio  de um descritivo pode ainda ser combinado, mas o objetivo pode ter sido cruzado a fronteira do alugador; serviço de suporte pode estar em conformidade com a regulamentação, mas a estratégia de emergência de eventos de segurança pode estar em curso para implementar a mudança de estado  isolação geral.

Quando a estratégia de avaliação de serviço não for utilizada, deve-se seguir, por categoria de operação, estratégias de tratamento de falhas definidas: a prática padrão de segurança é a de modificar o estado e de tomar decisões sensíveis sobre a operação de fechamento de falhas (Fal-closed, direct rejeição); e, em relação a um caminho de leitura pública explicitamente aprovado, só quando o modelo de risco permite a redução de tempo de utilização de uma estratégia de conhecimento curto.

### 单一 POST 端点

现代 Streamable HTTP vai enviar cada JSON-RPC 报文均均通过 HTTP POST:

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

对于该 POST请求,网关可以返回 JSON响应,或者返回仅限于该请求作用域的 SSE流――现代请求针对 GET 和 DELETE 均返回 HTTP 405 Method Not Allowed――`Mcp-Session-Id`Com`Last-Event-ID`Não há qualquer autoridade, capacidade de relações pessoais ou de reabertura.

O cabeçalho HTTP e o valor do corpo JSON-RPC devem ser totalmente iguais.`-32020`错误进行拒绝── assim, o equilíbrio de carga, o sistema de ligação e o sistema de limite de fluxo são necessários para a resolução completa do corpo, e assim, o caminho pode ser concluído rapidamente, garantindo a integridade do ponto a ponto.

底层报文校验遵循严格时序:JSON-RPC 及元数据类型有效性、header 与 body 一致性,然后检查匹配的版本是否支持──不匹配返回HTTP 400 与错误码`-32020` Se cabeçalho e corpo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `-32022`, e`data`精确为 `{"supported":["2026-07-28"],"requested":"<actual>"}`◊ Desconhecido como voltar HTTP 404 com erro código `-32601`- Não.

`ProtocolError`Portagem de escolha`data`, 网关会将其序列化 into JSON-RPC 错误对象中──通知(Notificação) 由于没有 `id`, por isso nunca receberá JSON-RPC Sucesso ou erro de resposta.

### Em cada nível, a missão é a descoberta.

网关面向客户端实现 `server/discover`◊ simultaneamente, a rede também irá identificar os serviços de execução de cada terminal, para obter as versões de acordo de apoio do terminal e as capacidades e extensões) ◊

网关返回的发现结果示例:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": true}
  },
  "ttlMs": 30000,
  "cacheScope": "private",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "enterprise-gateway",
      "version": "2.0.0"
    }
  }
}
```

                                                                                                                                                                                                                                                              

`serverInfo` são puramente dados de demonstração e de análise de um relatório, não sejam considerados como registros ou como justificativos de autenticidade do editor

### Capacidades de cliente de cada pedido

Cada pedido de transferência para o outro lado precisa de ter o mais recente.`_meta`- Não .

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    "name": "enterprise-gateway",
    "version": "1.0.0"
  }
}
```

Não considere cegamente as capacidades do cliente externo original e copiado para o outro.

### 确定性的命名空间隔离

Para cada ferramenta de final de linha, juntar e estabelecer o espaço de nomeação pública:

```text
notes.search
notes.create
issues.list
issues.open
```

维护从公共名称到后端实例及原始工具 名称的映射表――绝不能按发现先后顺序随意处理重名碰撞――公共名称构成审批与审审审契约的一部分,变更公共名称属于 Breaking Migration――

`tools/list`Quando existem diferenças na lista de ferramentas visíveis de diferentes sujeitos, é necessário retornar.`cacheScope: private`◊ Setting razoável `ttlMs`A limitação pode ser reduzida ao longo do tempo, evitando a fuga de informações de terceiros.

Cada descrição de ferramentas expostas ao exterior deve conter um nome, descrição e um ponto de origem de objeto.`inputSchema`△ nomeação espaço transformar ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`resultType`、 servidor ID: dados e cache-guidão

### 锁定已批准的描述符 (Descrição)

Na fase de preparação, o descriptor completo é regulamentado e processado e calculado, mantendo-se sob um nome público totalmente limitado.

Uma vez que o teste mudou:

-  Imediatamente `tools/list`- Não.
- 坚决拒绝直接调用──
- 触发安全审计事件──
- Antes de ser aprovada, a nova política deve ser reforçada através de estratégias ou revisões artificiais.

O 网关 é um forte ponto de controle central, mas não pode fazer um descrito inicialmente visto 凭空变得安全.

### Registro  Auxiliar serviços de detecção, e não de segurança

Registro de`server.json` forneceu dados de publicação de software. Um registro baseado em software gerenciamento geralmente é o seguinte:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "com.example/notes",
  "description": "Example notes MCP server.",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@example/notes-mcp",
      "version": "1.0.0",
      "transport": {"type": "stdio"}
    }
  ]
}
```

A publicação de dados em si não representa a segurança de acesso à rede.

```json
{
  "registryName": "com.example/notes",
  "registryVersion": "1.0.0",
  "publisher": {"namespace": "com.example", "status": "verified"},
  "provenance": {
    "source": "registry.modelcontextprotocol.io",
    "recordId": "com.example/notes@1.0.0"
  },
  "admission": {"status": "approved", "reviewedBy": "gateway-policy"}
}
```

网关负责校验 `server.json`A estrutura, e estabelecer uma ligação com o estado de entrada externa, ainda precisa executar estratégias de entrada independentes.

Para cada final de acesso, registos completos:

- 精确的注册表 及记录标识符──
- 经验证的发行者命名空间或域名凭据──
- 允许使用的传输协议与端点地址──
- 锁定版本号或已批准升级策略──
- 软件制品或描述的哈希 digest──
- 授权服务器签发者 (emissor)
- 审查人员、审批时间及过期时间──

Não deixe o Registo existir como um registro já aprovado por uma revisão de segurança. Mesmo que alguns servidores privados nunca apareçam no Registo Público, eles também podem ser completados através do mesmo modelo de acesso.

Esta aula realizou a ligação de dados de nível de internet: antes que o final se torne disponível, será publicado o credencial com o estado de acesso local para ser combinado.[第 30 课：MCP Registry 供应链、准入、漂移与回滚](../../30-mcp-registry-supply-chain-and-drift/docs/en.md)Construir um plano de controle completo, cobrir a evidência de espaço de nomeamento preciso, a origem dos produtos de software, a traçabilidade, a fixação de dados, o descriptório de tempo real, a verificação de mudanças, o registro, o estado de execução, a prevenção de alterações e o mecanismo de rolagem baseado em evidências, e a aplicação de cada pedido.

### 凭据中介机制(Medicação de credenciais)

网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网关 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址 网址

保持以下映射绑定关系显式清晰:

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

Não se pode transferir um token externo de um terminal de internet para outro terminal. Se uma ferramenta necessitar de representar a execução do usuário final, deve ser feita através de uma troca de tokens ou de um modelo de transferência de dados, não se deve usar o título de conta de serviço compartilhado para encharcar o usuário.

### Não depende de Sessão de velocidade limite

De acordo com o autor/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executivo/executive/e/executive/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/e/

Antes de executar a lógica de negócios de alta despesa, primeiro executar a verificação de legalidade de baixa despesa.

### Auditoria de toda a cadeia de decisão

记录足以完整复现一次调用全套审计要素:

- Pedimos ID e ID de rastreamento de links.
- 已认证的主体与签发者──
- 公共工具 名称与最终后端路由──
- Descrição 哈希锁定版本──
-  Resultados de decisão estratégica e causas de determinação.
- 响应耗时与结果类别──
- MRTR 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往返轮次或任务标识符 (MRTR) 往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往往)

Para os Tokens do Portador, o código de autorização, os Tokens de refresco, as palavras-chave originais e os parâmetros sensíveis não necessários, executar a desaceleração forçada.

### O SSE do domínio de acção de pedido

Quando uma solicitação é executada, a solicitação POST pode ser enviada diretamente para o domínio de resposta de nível de solicitação.

Não creem GET fluentes independentes, nem dependem de base.`Last-Event-ID`De re-posição mecanismo. Todos eles pertencem às premissas da primeira versão antiga do protocolo de transmissão.

### 长生命周期的变更通知 (notificação de mudanças no ciclo de vida)

 Para notificação de mudanças de lista e recursos, modern cliente via POST 发送 `subscriptions/listen`Não recebe SSE 响应── notificar 器使用平字段:`toolsListChanged`- Não.`promptsListChanged`- Não.`resourcesListChanged`E também`resourceSubscriptions`- Não .

```json
{
  "jsonrpc": "2.0",
  "id": "listen-tools",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

首个事件用于确认所支持的通知子集──其订阅标识符即为开启该连接流的请求所携带的JSON-RPC id:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": "listen-tools"
    },
    "notifications": {
      "toolsListChanged": true
    }
  }
}
```

网关 后仅转发已确认变更类型── 后仅转发已确认变更类型── 后后仅转发已确认变更类型── 后后后只转发已确认变更类型── 后后后只转发已确认变更类型── 后后后只转发已确认变更类型── 后后后只转发已确认变变类型── 后后后只转发已确认变类型── 后后后后只转发已确认变类型── 后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后后`params._meta`Entre os portadores é o mesmo.`io.modelcontextprotocol/subscriptionId` Não há mecanismo de reinscrição automática ou reinscrição automática. Após a religação, o cliente deve reabrir a subscrição e ativamente recuperar os dados da lista de dependência.

O modernismo mudou-se completamente.`resources/subscribe`- Não.`resources/unsubscribe`E também não solicitadas GET independentes 流. Estas características antigas são apenas como um antigo caminho de versão com controle de versão.

### 穿透网关的MRTR 交互

Quando voltaremos`resultType: input_required`, somente sob a premissa de que o comunicado de cliente externo apoie a solicitação de entrada necessária, o net-关 pode transferir o resultado para baixo.`requestState`- Não.

客户端 use totalmente novo ID JSON-RPC com `inputResponses`O teste original de ferramenta pública. O teste original de recurso foi re-identificado, o mesmo caminho público foi testado, e depois construído um novo pedido de transferência para baixo.

### As tarefas Extensão 路由

As tarefas são um oficial expansão, identificador para`io.modelcontextprotocol/tasks`Não é um substituto da sessão do protocolo central.

客户端在逐个请求的客户端Capacidades 声明支持该扩展,而网关只能在端到端保证该任务生命周期时,才在发现中向外声明支持.`tools/call`E depois decidiu que era normal voltar a fazer o que era normal .`resultType: task` Os resultados das tarefas incluem-se diretamente`taskId`- Não.`status`Tempo.`ttlMs`E as opções.`pollIntervalMs` Antes de ser enviado o resultado, o estado da missão deve ter sido duradouro e levável.

网关针对这个不透明的任务 标识符记录已认证主体与后端路由──随后 `tasks/get`- Não.`tasks/update`E também`tasks/cancel`调用均使用 `params.taskId` como `Mcp-Name`, que fornece uma rotatividade natural para todos os tipos de intermediários.`tasks/get` Retorno com status de missão em curso `resultType: complete`, e entrar em finaldo tempo dentro do resultado final ou acordo erro.`tasks/update`发送带键名 的 `inputResponses`Para fornecer a entrada indefinida necessária da missão, e retornar ao espaço completo de confirmação da resposta.`tasks/cancel`Expressar a cooperação, eliminar o plano, retornar ao espaço completo, confirmar o resposta, mas não garantir que a tarefa posterior pare imediatamente.

Não faça o novo.`tasks/list`Ou `tasks/result`方法, they belong to old version experimental models.  Requer inserir tarefas através `tasks/get`Exposição completa de instintos requisitados; cliente através de`tasks/update` realizar a resposta, em vez de re-tentar a chamada inicial de ferramenta.

O estado de rotação de missões de perpétuação pertence ao índice de aplicações de negócios de dados de missões, absolutamente não sessão de acordo.

### Para trás

Se a rede deve ser compatível com a versão anterior do cliente ou do terminal posterior:

- 显式探测协议所处的时代版本──
- Será iniciada a sessão de transferência de mão, GET 流, recursos e tarefas de versão anterior, linguagem completamente isolada no interno do adaptador.
- Não pode ser divulgado até hoje.
-  prioritarizar a utilização de serviços restritos de detecção e estratégias de regresso evidentes, evitando a ocorrência de uma redução do silêncio:

```figure
t3-gateway-funnel
```

## 动手构建

`code/main.py` implementar um protocolo dentro de um processo, um modelo de rede e dois servidores de terminação posterior.  Cada terminal posterior recebe uma nova estrutura completa de acordo com o pedido do protocolo anterior.  O sistema de rede completo fornece a determinação da descoberta do serviço e da utilização do usuário.`tools/list`、 Baseado em espaços de nome 、Registro `server.json`Com o estado de acesso externo, o descrevedor conjunto é bloqueado, o RBAC é definido, segundo os limites do índice de sujeito, as decisões de auditoria e os simuladores são realizados.`subscriptions/listen`SSE 确认流程──

O modelo recebe requisições resolvidas pelo corpo, pelo caminho, pelo cabeçalho e pelo portador identificado.`Content-Type`Ou completo.`Accept`规范──你将其连接到第09 课的 Streamable HTTP 适配器,后者强制要求 `Content-Type: application/json`E também`application/json`和 `text/event-stream`de `Accept`- Não.

- Não .

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

O programa de demonstração imprime o id do pedido externo com o id do pedido de pós-gerenciamento de novo gerado, para que o processo de transmissão seja exibido diretamente.

## Use-o

Para substituir o objeto de final de processo para o real moderno protocolo clientele.

- 连接前检查准入记录──
- Capacidade de exposição                                                                                                                                                                                                                                                            
- 鉴权前先完成公共名称限定──
- Lista ou调用前先核对描述器 哈希锁定──
- 转发前 Reconstruir cada pedido de dados.
- 返回前校验后端执行结果──

## Entrega-o

本课交付 `outputs/skill-gateway-bootstrap.md` Oferece um conjunto completo de modernos sistemas de gerenciamento de dados, que abrange o acesso ao tráfego, acesso ao serviço, controle de acesso, nomeação, armazenamento, transferência, registro, monitoramento, MRTR, tarefas, observação e separação da versão anterior.

## 课后深练习

1. Em externe solicitações e transferência de solicitações de dados de dados, entre eles, a participação em links distribuídos no rastreamento de links, e o registro de relações relacionadas no evento de auditoria.
2.  Conectar-se a um equipado  capacitação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                `Mcp-Name`中根据 tarefa id 完成 `tasks/get`É um caminho de preparação.
3.                                                                                                                                                                                                                                                               
4. Para um determinado objeto adicionar capacidade de servidor especializado,并深入论证为什么此时服务发现结果必须保持私有缓存 (caché privado) 
5. 编写一个遗产 适配器接口,要求在不向现代 `Gateway`类中添加任何遗留状态的前提下完成兼容接入──

## 关键术语

| 术语 | 含义 |
|------|------|
| MCP 网关 | 位于客户端与后端 MCP server 之间的安全策略与路由中心 |
| 准入记录（Admission record） | 允许特定后端接入网关的完整安全证据与审批策略决策 |
| 完全限定 tool 名称 | 稳定的对外公共路由名称，如 `notes.search` |
| Descriptor 锁定（Pin） | 在服务发现和请求分发期间严格比对校验的已批准哈希 digest |
| 私有缓存作用域（Private cache） | 缓存结果严格受限于单一授权主体与上下文，禁止跨用户共享 |
| 请求级作用域 SSE | 直接挂载在单次 POST 请求上的流式响应，连接关闭即取消请求 |
| `subscriptions/listen` | 客户端通过 POST 打开的 SSE 长连接，用于监听特定的列表变更通知 |
| 任务路由（Task route） | 将不透明的 taskId 映射到具体后端的应用层状态映射 |
| Legacy 适配器 | 带有明确版本门禁的隔离层，用于兼容旧版握手与 session 机制 |

## 延伸阅读

- [Streamable HTTP 传输协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [服务发现（Server Discovery）规范](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [官方 Registry server.json 规范与要求](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks 扩展规范草案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
