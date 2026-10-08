# MCP Tasks  Extender: Construir em um núcleo sem estado sobre a tarefa de perpetuidade

> O MCP sem estado não significa que cada operação seja realizada em um único pedido. As tarefas oficiais expandem-se para um longo ciclo de vida.`tools/call`De volta a esta frase, qualquer caso pode responder.`tasks/get`, e o cliente de entrada através de`tasks/update`Não é preciso fazer qualquer acordo.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## Objectivo de aprendizagem

-  estritamente distinguido entre o nível de transmissão de protocolo sem estado e o estado de aplicação de um nível de tarefa de perpétuação
- Em cada pedido de capacidades com`server/discover`中协商 `io.modelcontextprotocol/tasks`扩展──
-  apenas após a conclusão da criação, retornar pelo servidor `resultType: "task"`de `CreateTaskResult`- Não.
- Utilização `tasks/get` fazer inquérito, usar `tasks/update`提交任务输入,并使用 `tasks/cancel`发起协作式取消──
- 彻底弃旧版中关于 `tasks/status`- Não.`tasks/result`和 `tasks/list`De uma antiga hipótese.
- 通过 POST 响应的 SSE 流使用 `subscriptions/listen`订阅可选的任务变更通知──
- O mecanismo de transição de tarefas, reiniciação de recuperação de lógica, entrada de chave, reiniciação e execução de erros de interpretação.

## Porque as tarefas são uma expansão

As tarefas inicialmente como características experimentais do núcleo aparecem em 2025-11-25 规范中.`io.modelcontextprotocol/tasks` Expansão, permitindo que o cliente e o servidor escolham independentemente se entrarem em um ciclo de vida de missão extra, sem necessidade de todos os cenários de inflação MCP 核心协议.

Embora a regulamentação de expansão seja atualmente a atribuição oficial das tarefas, ela ainda está no estado de desenvolvimento do projecto.

Quando uma operação tiver uma ou mais das seguintes características, use a tarefa:

-  Execução de tempo pode exceder o pedido normal        
- 已由工作队列 (de trabalho) ou de execução de sistemas de trabalho externos.
- O cliente precisa ter capacidade de recuperação de inquérito após o seu reinicio.
- O processo de execução da operação precisa de ser suspendido para esperar que o usuário ou modelo forneça mais informações.
- 支持取消操作与持久化结果检索是明确的产品功能需求──

Não procure tarefas de criação de operações por uma certa segurança barata. Introdução de regras, armazenamento de dados, mecanismo de consulta, estratégias de transição e eliminação de fluxos de transferência trazem uma complexidade real.

## 无状态核心,有状态应用

MCP 2026-07-28 移除了 `initialize`- Não.`notifications/initialized`、 acordo de reunião e `Mcp-Session-Id` Não excluem as funções de produtos em estado de construção

O id da tarefa pertence ao estado de aplicação expresso:

- O servidor em volta da tarefa deve ter sido perpetuado antes de ser id.
- O cliente pode manter o seu ID em armazenamento permanente e reiniciar a sua consulta.
- A identificação pode ser encaminhada para qualquer servidor do mesmo banco de dados.
- Cada tarefa de adoção  Related methods 时都必须重新校验鉴权──
- O ciclo de vida é determinado pelo ciclo de vida definido pela tarefa, e não pela ligação da camada de transmissão.

Esta existem diferenças de qualidade no nível de transporte com o estado oculto no contato.

Os seguintes quatro ciclos de vida serão claramente desmontados:

| 状态类别 | 生命周期 | 归属位置 |
|---|---|---|
| 协议元数据 | 单次请求 | `params._meta`，在每次调用中重新校验 |
| 传输层任务 | 单个 stdio 请求或 HTTP 响应 | 具有有界超时期限的正在进行的协调器（in-flight coordinator） |
| MRTR 交互延续 | 单次重试序列 | 受完整性保护的 `requestState`，必要时叠加防重放控制 |
| 持久化任务 | 跨越请求、副本、重启与重连 | 以受权的 `taskId` 为键的共享应用程序存储 |

O MCP não pode ser transformado em protocolo de estado, apenas faz com que o aplicativo se torne extremamente improvável.`tasks/get`É necessário concluir a permanência da escrita antes de retornar a frase, e deixar que cada tarefa seja resolvida no inquilino e no teste do titular.

## Capacidade 协商

Cliente em cada pedido de uso declaração expandir apoio:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

Servidor de `server/discover`- Não , não .`supportedVersions`Capacidades`ttlMs`和 `cacheScope`O programa de desenvolvimento de ferramentas, como o de "Expansão", é também obrigatório.`tools/list` O resultado é de certeza.`generate_report`描述符、合法的 object 类型 `inputSchema`- Não.`resultType: "complete"`、servidor, dados e dados públicos 缓存提示──

Se o cliente não declarou a expansão, mas usou o método de tarefa, o servidor retornará.`-32021`(Falta de Capacidade de Cliente Requirida),并将 `data.requiredCapabilities`设为 `{"extensions":{"io.modelcontextprotocol/tasks":{}}}` Não apoiado `-32022`Não tenho certeza.`supported`Com`requested`Data; falta ou não-filamentos versão de volta `-32602`- Não.

 sem JSON-RPC `id`O envio pertence a notificação. O destinatário pode processá-lo, mas não emite JSON-RPC.`202 Accepted`- Não.

Atualmente, só há`tools/call`支持以任务形式增强执行―― por favor, desenhe razoavelmente o abstracto interno, de modo que o tipo de solicitação no futuro não precise ser reescrito em nível de armazenamento―

## Server 主导的任务创建

旧版的客户端标志 `params._meta.task.required`已完全移除──现在的机制是:client 声明支持该扩张,随后由服务器自行决定某具体的 `tools/call`É ou não transformado em tarefa?

- Não .

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

响应:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

Até que a identidade já pudesse ser usada.`tasks/get`解析读取之前,server 绝不能提前返回这个句柄──在最终一致性存储系统中,必须等待其具有可读可见性 (可读可见性) 阅读可见性 (见见性) 后再做应答──否则, o cliente 收到一个看起来合法的 id 却会立即遭遇未找到的错误──

A resposta à tarefa tem características de solicitação não ativa não solicitada, ou seja, o cliente não é obviamente requerido para entrar no modo de tarefa; mas é absolutamente não negociada.

## Estrutura de tarefas

Cada tarefa para os objetos tem os seguintes segmentos:

- `taskId`: O identificador de estabilidade gerado pelo servidor;
- `status`:取值为 `working`- Não.`input_required`- Não.`completed`- Não.`cancelled`Ou `failed`O artigo 2.o
- `createdAt`Com`lastUpdatedAt`:ISO 8601 时间;
- `ttlMs`: desde a sua criação, o tempo de transcorrência (mm), ou`null`Expressão não declaração no limite;
- - Não .`pollIntervalMs`:servidor quando se recomenda o mínimo de rotulagem;
- - Não .`statusMessage`: Fação usuario ou modelo de sobre o abaixo descrição:

特定状態专用字段只在相关时才出现:

- `input_required`包含 `inputRequests`- Não.
- `completed`包含原始请求的 `result`Estrutura:
- `failed`incluindo JSON-RPC `error`Objeto:

O cliente  deve obedecer `pollIntervalMs`O servidor pode controlar o fluxo de rotas de pesquisa excessivamente activa, e pode ajustar a atividade no ciclo de vida da tarefa.

## Use tarefas/obter  fazer consultas

Cliente solicitação de agora:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

`tasks/get`O presente RPC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `resultType: "complete"` e a tarefa do conjunto interno para os seus`status`Ainda posso.`working`Ou `input_required`- Não.

Esta diferença pode efetivamente evitar bugs de resolução comuns:

```text
result.resultType = complete    表示 tasks/get RPC 本次调用完成
result.status = working        表示其代表的后台作业仍在运行中
```

Quando não existe`tasks/result`方法──当任务 完成时,下一次 `tasks/get`Responderá diretamente`result`字段内嵌原始的  字段内嵌原始的 `CallToolResult`- Não .

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

O exterior `resultType`Indicar`tasks/get`RPC 顺利执行;内层的 `result.resultType`Indicar ferramenta original 调用已执行完成── este nível interno do divisor é obrigatoriamente necessário── nível interno `CallToolResult`Também deve levar o seu próprio.`io.modelcontextprotocol/serverInfo`O presente curso será conservado inteiramente e não armazenado para cargas ordinárias de qualquer tipo.

Quando não existe`tasks/list` Não há nenhuma conexão entre o servidor e o servidor  Não é possível determinar com segurança quais tarefas devem aparecer na lista de um domínio de ligação  As aplicações de registro histórico devem ser expostas por uma ferramenta de domínio de negócios com clara violação das regras de propriedade  Autorizada 

## 任务执行期间输入交互

A entrada interna da tarefa parece semelhante à MRTR do núcleo, mas adotou mecanismos diferentes de prolongamento de processos.

### 任务创建前所需的输入

Desde o início`tools/call`- Não .`resultType: "input_required"` Cliente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

### 任务创建后所需输入

将 tarefa  estado colocado `input_required`❖ através `tasks/get` exposição não definida `inputRequests`, por cliente   `tasks/update`提交响应──Cliente **不需要**重试原始的 `tools/call`- Não.

- Não .

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

更新:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

O sucesso é uma confirmação em vão.`resultType: "complete"` Como o estado de mudança é eventualmente consensual, o cliente deve continuar a fazer consultas ou a monitorar.

Cada um .`inputRequests`A chave é que toda a tarefa no ciclo de vida tem de ser única.`tasks/get`快照可能會顯示相同未決定關鍵;client端應在 UI 層面上進行重複,而伺服器則應忽略對未知已覆蓋或已執行關鍵的反應.`input_required` Estado, até que todas as chaves necessárias  tenham sido respondidas.

## 取消操作 pertence ao 协作式取消

`tasks/cancel`Utilizado para expressar o desejo de desaceleração e retornar a um vácuo completo  confirmação                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Para todas estas três tarefas,`Mcp-Name`Peliculação de um reflexo`params.taskId`, em vez de repetir JSON-RPC 方法名──`code/main.py`Em`make_http_request`O Centro de Estudos de Ciências da Informação (CES)

O trabalhador deste exemplo de classe será imediatamente eliminado, de modo a tornar-se re-reajustado para o mesmo.

Não usem .`notifications/cancelled`Para eliminar a tarefa, o aviso pertence ao nível de eliminação da solicitação, e não ao nível de eliminação da tarefa.

Esta distinção é importante na fronteira do caminho. O pedido de cancelamento é dirigido a operações de JSON-RPC em execução ou a resposta HTTP do domínio de seu pedido.`tools/call`Já voltou .`resultType: "task"`, que a solicitação foi concluída, que a sua transmissão foi encerrada, que não pode ser indicada nem encerrada.`tasks/cancel`É um novo RPC autorizado.`params.taskId`, em `Mcp-Name`O seu ID, que vai até o final da tarefa, registra a colaboração, elimina o plano, e retorna para confirmar a resposta e não afirmar que o trabalhador está parado.

Assim, o net关 deve colocar o coordinador de solicitação (coordenadores de solicitação) e o cronograma do caminho de missão separadamente entre diferentes tabelas de dados.[第 29 课：MCP 可靠性、取消与流控](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md)Será profundizado a construção de regras de competição, super-hora, etc.

## Seleção de notificação

轮询是基准方案――期望推送更新客户可以发送带有任务 id 列表的 `subscriptions/listen`◊ em Streamable HTTP, é um POST Petição, a sua resposta é um pedido de roteiro de roteiro de SSE 流── não há GET 事件流 independente, nem há necessidade de manter vivo de acordo reunião──

Servidor  através `notifications/subscriptions/acknowledged`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `notifications/tasks`Enviar um rápido e completo aviso de confirmação com cada tarefa`_meta`- Não .`io.modelcontextprotocol/subscriptionId`(其值等于 `subscriptions/listen`Por outro lado, cada tarefa 通知都等价于此时调用 `tasks/get`O que é que eu faço?

O cliente  ainda deve declarar tarefas  expansão                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  `Last-Event-ID`- Não.

## 失败语义

Por favor, faça uma distinção entre dois níveis de erro:

### 协议错误

无效方法参数或未知任务 id 会返回 JSON-RPC 错误, normalmente por `-32602`◊ falta de desenvolvimento `-32021`Não é necessário transportar na sua informação a capacidade necessária para os objetos.

### 任务执行结果

- - Não .`isError: true`结果仍然属于 `completed`任务,因为 tool 调用 já produzido fora de sua definição resultado estrutura
- O erro de nível de protocolo JSON-RPC que ocorreu durante a execução atrasada fez com que a missão entrasse .`failed` estado, e `error`字段下记录该 JSON-RPC 错误──
- Usuário rejeitar pode produzir `cancelled`、 um indice de rejeição de resultados concluídos, ou de produtos de segurança específicos de outro domínio.

## 持久化、过期与所有权

▌Deve ao menos perpetuar a tarefa de armazenamento id, status, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo, tempo,

O código de armazenamento deve conter ou poder resolver os inquilinos e sujeitos de autoridade.`tasks/get`- Não.`tasks/update`- Não.`tasks/cancel`及订阅调用中都必核验所有权──

`ttlMs`Quando a missão parar de gerar uma atualização visível, o cliente pode considerá-la como uma base de super-hora de garantia. O servidor pode falhar no marcador de missão expirado e executar uma limpeza física mais tarde. Não divulgue a sua divulgação para manter o resultado concluído após a conclusão da missão.

采用原子写入或事务机制――本课先写入临时文件再执行原子重命名――跨多副本的服务应使用共享的持久化储存,并配合工人租) 租) 或等价的并发控制机制――

```figure
tp-task-lifecycle
```

## Handwriting realizado

`code/main.py`实现一个确定性的任务服务:

- `server/discover` Retorno `supportedVersions`、缓存提示与 Tasks 扩展──
- `tools/list`Return certa­ness `generate_report`描述符,附带合法 input schema──
- `tools/call`Em volta`resultType: "task"`之前完成任务的创建与持久化──
- Um novo exemplo de serviço recarrega a mesma tarefa, demonstrando a capacidade de reinicialização da recuperação.
- `tasks/get`返回完整的任务快照── Não é uma tarefa fácil.
- Trabalhador de`working`status流转至 `input_required`- Não.
- `tasks/update`收表单响应并回归空的完整确认──
- Trabalhador  armazém `CallToolResult`(incluindo o seu próprio `resultType`Com o servidor como), em seguida, o estado é transformado`completed`- Não.
- 本实现中 `tasks/cancel`Tem sexo.
- HTTP  construtor `tasks/get`- Não.`tasks/update`和 `tasks/cancel`de `Mcp-Name`头统一设置为 `params.taskId`- Não.
- 通知助手函数使用 `notifications/subscriptions/acknowledged`Com`notifications/tasks`, , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , , ,
- 无 id 的通知不产生任何 JSON-RPC 响应──

O trabalhador  adota um estado de avanço evidente e não dorme no traço de trás. Isto torna cada estado de transmissão com certeza, e deixa claro o mecanismo de sequência de protocolo e de mensagem.

## Utilização

Em depósito:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

预期结果序列:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

同时验证在现代服务中调用 `tasks/status`- Não.`tasks/result`和 `tasks/list`会返回方法未找到 (Método não encontrado) erro.
验证 `tools/list`具有确定性,且当前所有HTTP task 方法均通过 `Mcp-Name`- Como a sua tarefa.

## 交付产物

`outputs/skill-task-store-designer.md`现已提供适应扩展的设计:包括能力 协商、返回前必须持久化 (consultar 协商・返回前必须持久化) 现代方法集、输入更新流、所有权隔离、过期管理、取消处理、订阅机制以及方案从废弃实验性方法平稳迁移的方案──

## 课后练习

1. 增加第二未决输入键──发送包含部分字段的 `tasks/update`A prova de que, até que as duas principais respostas tenham sido completadas, a missão continua a ser realizada.`input_required`- O estado.
2. Para armazenar a introdução de propriedade do arrendatário, quando o titular do direito identificado erróneamente exprime a tarefa legal, é directamente rejeitado.
3. Introdução de trabalhadores com períodos de trabalho em que não podem realizar a mesma tarefa.
4. Por`subscriptions/listen`实现 POST 响应的 SSE 适配器──切勿引入 GET 端点、`Last-Event-ID`Ou sessão Pléase
5. 增加过期清理逻辑── Precisa distinguir entre tarefas de prazo ultrapassado e tarefas de formato erróneo, sob o pressuposto de não causar uma fuga de existência transnacional.

## 关键术语

| 术语 | 当前扩展中的含义 |
|------|----------------------------------|
| Tasks 扩展 | 用于持久化异步工作的可选 `io.modelcontextprotocol/tasks` capability |
| `CreateTaskResult` | 对符合条件请求返回的、由 server 主导的 `resultType: "task"` 响应 |
| `tasks/get` | 轮询完整的当前任务快照，包含终态结果或未决输入 |
| `tasks/update` | 针对任务当前未决的 `inputRequests` 提交响应 |
| `tasks/cancel` | 确认接收到协作式取消的意图 |
| `input_required` | 表示任务正在等待 client 提供输入的任务状态 |
| `pollIntervalMs` | Server 建议的下次轮询前的最小等待时长 |
| `ttlMs` | 自任务创建起计算的有效时长 |
| 返回前持久化（Durable-before-return） | 必须在 task id 具备可解析可读性之后才能发出其句柄的规则 |
| `notifications/tasks` | 在已订阅的 SSE 响应流上投递的可选完整任务快照 |

## 旧版兼容性

2025-11-25  Programa experimental que adotou requisições de clientes reforçar`tasks/status`- Não.`tasks/result`E as opções.`tasks/list` Por favor, conserve estes nomes em seu dispositivo em que o seu dispositivo está bloqueado.`tasks/get`, através de `tasks/update`提交输入,并从任务快照中读取最终结果──

## 延伸阅读

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
