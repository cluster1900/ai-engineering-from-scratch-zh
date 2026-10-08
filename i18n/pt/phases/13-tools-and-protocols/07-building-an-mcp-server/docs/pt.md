# Construir MCP Server: Python e TypeScript

> O MCP Server moderno 绝不记住握手状态―― é um sistema de dados em cada pedido, executando o processador de resposta, e retorna os resultados de um único tipo de identificação――

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13 · 06（MCP 基础）
**Time:** ~85 分钟

## Objectivo de aprendizagem

- Por MCP `2026-07-28`规范实现强制要求的 `server/discover`- É o que é?
- Em cada pedido recebido, a escola apresenta a versão de acordo com a declaração de capacidade do cliente.
- E- Determination 排序暴露 Ferramentas, Recursos e Prompts Lista
- Em resultados corretos, retorno.`resultType`、Servidor Identificação de Servidor)
- Em Python e TypeScript, através de mudanças de padrões de separado de estúdio                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

## 问题背景

O servidor de capacidade do cliente está na memória após a recepção da primeira mensagem, embora seja simples, mas em produção.

MCP `2026-07-28`规范通过使**每个请求自描述**O seu aplicativo ainda pode manter notas de permanência, tarefas de trabalho ou expressos estados de estado. Mas não pode manter o estado oculto do protocolo para alterar o modo de resolução do pedido posterior.

Esta aula irá construir duas vezes um note server: Python e a versão TypeScript utilizam apenas seu original standard library para implementar o protocolo central, ambos expondo o mesmo método de interface e forçando a execução do mesmo protocolo de comunicação.

## 核心概念

### 现代请求分发循环 (O ciclo de envio)

```text
读取一行 JSON-RPC 文本
解析外层 Envelope
若为通知（Notification），则不予响应
针对当前请求校验 params._meta
根据 method 执行路由分发
使用 resultType 与 serverInfo 封装成功结果
写回一行 JSON-RPC 响应文本
立即遗忘当前请求作用域的元数据
```

Em estúdio, há três regras:

-                                                                                                                                                                                                                                                               
- O texto é trocado por um código de segmentação, e depois de cada resposta é executado o flush.
- Quando o processo é recebido, o processo deve ser imediatamente efetuado.

O ciclo de vida do processo representa apenas o período de vida da camada de transmissão física, não é de modo algum uma sessão no sentido do protocolo MCP moderno.

### Peliculando o que fazer

Cada pedido deve incluir:

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

O que é que é isso?`clientInfo`Por recomendação. Se for fornecido dados de identidade, pode-se verificar a sua estrutura de dados, mas não pode ser considerado como um certificado de segurança.

Se a versão não for suportada, retorne o erro código `-32022`Não está com ele.`requested`Com`supported` Se o pedido de falta de dados, pertence a parametros ilegais, retornar erro código `-32602` Não pode ser preenchido nenhum dos dados perdidos da história

### 强制的服务发现 (Descoberta obrigatória)

现代 Server  obrigatório `server/discover`◊ um serviço completo descoberto resultados incluem suportados modern protocol version  Server  capabilities collection  opções de uso 缓存提示以及结果 `_meta`Identificação de Servidor Central:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

Serviço descoberta não é desbloqueio O cliente pode iniciar diretamente em caso de descobrecimento não utilizado`tools/list`Porque ...`tools/list`Ele próprio já carregou os mesmos dados de solicitação.

### Ferramentas (( ferramentas)

`tools/list`返回具有确定性排序工具 描述符列表──稳定排序能提高响应缓存命中率,并保持模型 Prompt 上下文的稳定性──该结果同样要求携带 `ttlMs`和 `cacheScope`- Não.

`tools/call`返回内容块(blocos de conteúdo) 和 `isError`☐ Quando o protocolo é envelhecido ou o método é ilegal, retorne JSON-RPC  erro resposta; quando o instrumento 调用成功触发但在业务执行层面失败时,返回带有 `isError: true`O resultado da normalização.

Ferramenta Notações) apenas para dar um suporte ao anfitrião, não representa a execução obrigatória:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

O servidor deve usá-los para realizar a confirmação de interação e a apresentação de UI, mas o servidor deve forçar a execução de autenticidades autorizadas no nível do negócio.

### Recursos (recurso)

`resources/list`返回稳定 URI 描述符──`resources/read`返回带类型内容──在 `2026-07-28`规范中, ambos são de dados de conservação, devem incluir `ttlMs`和 `cacheScope`- Não.

 para os dados de notas privadas de usuários, deve ser usado `cacheScope: "private"` Compartilhar a sua segurança não pode ser trans-outorizado 

现代数据变更推送 já não é usado `resources/subscribe`◊ Cliente 通过发起 `subscriptions/listen`E declarações`resourceSubscriptions`Ou lista de eventos em curso para receber

### Instruções (s)

`prompts/list`Também pode ser conservado e ter uma ordem de determinação.`prompts/get`染指定的参数名称 染后的 染后的 染后的 染后的 染后的 染后的 结果属于完整的 结果,但不需要如列表或读操作那样附附缓存提示──

### Cada sucesso é um tipo de "Bota"

Em implementar o código, pode-se usar um pacote único para processar todas as respostas bem sucedidas:

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

Lista, leitura e descoberta de serviços`ttlMs`Com`cacheScope`◊ Tratamento centralizado capaz de impedir o tratamento individual 疏漏了现代规范所必需的字段──

### 绝不发起 Server 端请求

现代 Server pode ser enviado com o cliente solicitar notificação direta ou no cliente  aberto `subscriptions/listen`- Não, não. - Não, não.**绝不能**主动发起独立的 JSON-RPC 求求──

Quando o processador precisa de amostragem, solicitação ou raízes, ele retorna a um.`input_required`Resultados: O cliente em sua entrada de pedido de satisfação, usando um novo ID de pedido.

```figure
t3-dispatch-loop
```

## 动手实践

运行 Python Server completa demonstração e teste:

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

Utilize TypeScript 运行器运行 TypeScript 版本:

```bash
npx tsx main.ts --demo
```

演示流程会发送 `server/discover`、 lista todas as linguagens originais 、 ferramentas de utilização, e mostra não suportadas versões de relatório errôneo 、 observa cada pedido moderno são repetidas com dados, e cada resultado de sucesso é carregado com o servidor identificação 、

## 交付物

本课交付 `outputs/skill-mcp-server-scaffolder.md` Pode gerar um plano de design de servidor que atenda às normas modernas, abrangendo um serviço de localização de acordos, de cada pedido de experiência, de uma lista de cache de determinação e de um selecionado legado independente.

##                                                                                                                                                                                                                                                               

1. De um pedido de transferência de capacidades 字段, prova Servidor 绝不会复用前请求中声明的旧能力──
2. 颠倒 `TOOLS`- Não.`PROMPTS`及笔记数据的录入顺序, confirmar que todos os resultados da consulta de listagem ainda mantêm uma ordem alfabética estável.
3. Novos aumentos destrutivos.`notes_delete`工具, e integrar o poder de identificação, verificação, verificação `destructiveHint`                                                                                                                                                                                                                                                              
4. 补充 `resources/templates/list`接口, exigen附带 `ttlMs`- Não.`cacheScope`E a determinação da ordem.
5. Por`2025-11-25`编写一个完全隔离的 Legacy 适配器,并通过测试证明现代请求绝不会错进 Legacy 处理路径──

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态 Server (Stateless server) | 仅从每个请求自身的元数据处理调用，无任何协议 Session 内存记忆 |
| `server/discover` | 强制实现的现代方法，用于向调用方公布支持的版本与功能集 |
| 完整结果 (Complete result) | 携带 `resultType: "complete"` 的成功现代结果 |
| 可缓存结果 (Cacheable result) | 附带强制 `ttlMs` 与 `cacheScope` 提示的发现、列表或只读结果 |
| 确定性列表 (Deterministic list) | 逻辑相同的注册表必须输出完全一致、可复现的条目顺序 |
| Server 身份 (Server identity) | 在结果 `_meta` 中携带的 `io.modelcontextprotocol/serverInfo` 标识 |
| Tool 业务错误 (Tool error) | Tool 调用正常被解析执行，但业务逻辑失败，返回包含 `isError: true` 的 content |
| 协议错误 (Protocol error) | 非法的 JSON-RPC 格式或无效的 MCP 请求参数，直接通过顶层 `error` 报错返回 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
