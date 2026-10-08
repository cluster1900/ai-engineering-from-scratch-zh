# MCP 模型输入:Sampling 迁移与无状态 MRTR

> MCP 2026-07-28 规范弃用面向新设计的样本特性,并移移至服务器向客户端 发送反向请求的通道──若现有工作流仍需使用客户端模型,服务器会返回`input_required` Resultado, por cliente  transportar modelo output  retest original request                                                                                                                                                                                                                                                   

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## Objectivo de aprendizagem

- 解释为什么MCP 2026-07-28 弃用样本,并为新构建的服务器 选用直接集成模型 (integrator direto do modelo) 的默认架构──
- 实现一套兼容工作流, através de多轮往返请求(Multi Round-Trip Requests, MRTR) 承载`sampling/createMessage`- Não.
- Em cada pedido.`_meta`Objecto: Injected protocol version e capacidades do cliente.
-  Retorno `resultType: "input_required"`,并使用全新的 JSON-RPC id 重试原始方法──
- Para o`requestState`• a execução de um processo de proteção da integridade, e a sua fixação no principal (principal) método, parametros e tempo de execução.
-  através da capacidade 校验、人工批准、响应验证和轮次上限, realizar um rigoroso confinamento ao ciclo de auxiliar do modelo.

## Arquitetura de decisão antes do protocolo de design

- Como ?`summarize_repo`As ferramentas geralmente requerem duas categorias de trabalho:

1. 确定性工作:列出文件、读取允许访问的文件、校验路径以及组装内容──
2. 模型工作:挑选代表性文件并综合生成摘要──

Agora, tens duas opções de arquitetura legal.

### Novos servidores: diretamente integrados

Esta é a prática de recomendação padrão atual. O servidor 端自主管理模型选择、凭据配置、调用预算、重试策略以及可观测性.`tools/call`Resultados

Quando o servidor é um serviço administrativo, ou quando o desempenho de um modelo previsível é mais importante do que o modelo de um host emprestado, por favor, use este esquema.

### 现有 Sampling 工作流: migração para o MRTR

Em período de transição abandonado, o amostragem continua a existir.`sampling/createMessage`O que é que se faz é que o requisito seja inserido em`InputRequiredResult`De volta para dentro.

 apenas quando o modelo e o credencial do cliente são utilizados para a precisão de duração do produto, é necessário escolher este caminho de compatibilidade.

## 无状态契约

O protocolo de julho de 2026 foi transferido.`initialize`交互握手,`notifications/initialized`E também`Mcp-Session-Id`                                                                                                                                                                                                                                                              

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

O servidor irá em cada pedido, em que será executado o processo de verificação.`-32602`△ Não suportada versão 字符串返回 `-32022`, e trazem dados precisos , dados .`{"supported":["2026-07-28"],"requested":"<client version>"}` Capacidade de amostragem 则返回 `-32021`,并将 `data.requiredCapabilities`设为 `{"sampling":{}}`- Não.

 sem JSON-RPC `id`O código de acesso é um código de acesso que pode ser processado pelo destinatário, mas não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, não é um código de acesso, é um código de acesso, ou é um código de acesso, ou é um código de acesso, ou é um código de acesso, ou é um código de acesso, ou é um código de acesso ou é um código de acesso.`202 Accepted`- Não.

O servidor ainda tem de ser implementado com precisão .`supportedVersions`- Capacidades`ttlMs`和 `cacheScope`de `server/discover`方法, so that the client in调用 tool 之前能够获知并缓存服务器的契约──由于发现 声明 `tools`O servidor também tem de ser obrigatório.`tools/list` De sua determinação`summarize_repo`描述符包含合法的 objeto 类型 `inputSchema`- Não.`resultType: "complete"`、servidor, dados e dados públicos 缓存提示──

Cada acordo moderno de sucesso contém um marcador:

- `resultType: "complete"`Expressão operação já completa.
- `resultType: "input_required"`Indica que o cliente  deve cumprir o pedido de entrada em seu interno e realizar a reprovação.
-  Expansão de normas pode definir tipos de resultados extras, por exemplo, no capítulo 13 `"task"`- Não.

## 单轮 MRTR 交互流程

O servidor não pode convocar o cliente durante o processamento do pedido.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

O cliente 验证自支持样本,应用其审核批准与模型策略,并获取模型响应.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

Esta reaprobação não é uma continuação da conversa. É uma nova solicitação: métodos e parâmetros de reaprobação, apenas adicionados à rotina anterior.`inputResponses`,并原封不动地逐字节回显 `requestState`- Não.

MRTR  apenas permite aparecer `tools/call`- Não.`prompts/get`和 `resources/read`中──Servidor 绝不能从无关方法中返回 `input_required`- Não.

## Gestão de estado

Este curso requer dois modelos de adaptação:

1. `pick_files`返回一个 JSON 数组──
2. `summary`返回最终的摘要文字──

Como cada reexame apenas transporta a resposta da rodada, o servidor precisa de colocar os dados do estágio actual (fase) e do meio do teste no próximo.`requestState`- Não.

Por favor, considere este valor como dados possíveis controlados pelo atacante. Apenas o nome do estágio é simplesmente assinado.

- 经过鉴权的主体 (principal autenticado), e não declarações autônomas `clientInfo`O artigo 2.o
- 发起调用 método original;
- O que é o "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de um "Definição" de "Definição" de um "Definição" de "Definição" de "Definição" de "Definição" de "Definição" de "Definição" de "Definição" de "Definição" de "D"
- 较短的过期时间;
- O valor médio da fase anterior e da experiência escolar.

Quando o cliente  absolutamente não pode ler o conteúdo do estado, por favor use o credenciamento de credito  autenticado criptografia  Enfrentando um erro de assinatura  estado  período  assunto  mudança de parâmetro  mudança de parâmetro , retorne diretamente `-32602`- Não.

Cliente  absolutamente incapaz de resolver ou 改 `requestState`A única responsabilidade dele é transmitir o código.

## 模型偏好 仅供参考提示

`costPriority`- Não.`speedPriority`Com`intelligencePriority`Não são distribuídas de probabilidade, nem são necessárias uma soma de 1. O cliente tem o controle absoluto sobre a estratégia do modelo, portanto, pode ignorar completamente essas preferências.

Se ainda estiveres a manter o processo de amostragem, por favor,`includeContext`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `"none"` O seu modo de escrever em baixo aumentará o risco de vazamento, e em si mesmo já foi abandonado.

## segurança

Para o pedido de amostragem, o cliente é o único que acredita:

- Quando um estratégia requer aprovação artificial, o servidor está a exibir claramente ao usuário o que o modelo requer para executar.
- limitar o MRTR 轮次上限──否则恶意服务器可能会构建无休止的模型消费循环──
- Antes de utilizar a amostragem como um nome de ficheiro, URL ou ferramenta, é preciso fazer um rigoroso teste.
- Limitar o número de caracteres e símbolos por rodada de volta.
-  rejeitar o pedido de entrada não declarado em capacidades do cliente em curso。
- 避免让模型输出决定授权鉴权逻辑──
- 记录发起的方法及输入请求钥匙, evitando simultaneamente entrar em conteúdo sensível no日志.

`clientInfo`和 `serverInfo`☐ apenas para a apresentação e a diagnóstico dos dados.

```figure
t3-sampling-flip
```

## Handwriting realizado

`code/main.py`Não depende de qualquer terceiro pacote, completa realização de dois rotos de volta e volta:

- `server/discover` Retorno `supportedVersions`, declaração ferramenta 支持,并返回缓存提示。
- `tools/list`返回具有对象输入方案的、确定性且可缓存的 `summarize_repo`Descrição
- `tools/call`校验每个请求的元数据──
- Primeiro resultado em formato de seleção de documentos`sampling/createMessage`- Não.
- Primeiro resultado do modelo de re-experimento e em seguida, o segundo pedido.
- Receber proteção do HMAC`requestState`Em fase de execução entre as solicitações de independência.
- Último resultado Usar`resultType: "complete"`- Não.

模拟的宿主 模型保证了示例的确定性── quando se conecta a um host real 时, apenas é necessário substituir `fake_host_model`❖ O estado do servidor ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼ ∼                  ∼                                                                                                  

## Utilização

Em depósito:

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Descoberta  Retorno `ttlMs`和 `cacheScope`O resultado completo é:
- Descoberta de ferramentas  retornar 排序相同的描述符,带有 `resultType`、servidor 、status e cache 、
-  Falta de capacidade e não suportada versão `-32021`Com`-32022`错误数据――
- 没有 id 的通知 不产生任何 JSON-RPC 响应──
- Por favor , id seguinte`[1, 2, 3]`, provando que cada MRTR é totalmente independente.
- O resultado é o tipo de`input_required`- Não.
- O resultado final é:`complete`,并包含选出的文件以及最终摘要──
- Em re-teste, os elementos originais são alterados, o que leva à falha do requisito-estado.

## 交付产物

`outputs/skill-sampling-loop-designer.md`现已升级为迁移规划器――它首先决定是否应废弃样本化 改用直接模型集成――如果必须保留兼容性,它会产生MRTR 交互轮次、状态绑定、能力 门禁、预算控制、数据校验以及平稳退役方案――

## 课后练习

1. A resposta de seleção de arquivo foi alterada para sem efeito JSON 字符串── confirmar o servidor irá retornar `-32602`Não é um modelo de confiança cego.
2. Em primeira fase de reutilização e reutilização`audience`参数―― explicar por que o estado após o enfeito pode impedir a reutilização de várias solicitações―
3.  aumentar a terceira rodada de intercâmbio, exigir que o anfitrião examine e critique o resumo.
4. 彻底移除 Sampling:将模拟的宿主回调替换为服务器自持的模型适配器──列出此时有哪些批准、计费和可观测性职责转移到服务器端──
5. Adicionar um teste de prazo ultrapassado: Introdução a um valor de estado de 1 segundo que ultrapassou o prazo de prescrição, verificação de que o teste não foi realizado.

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用特性，用于请求 client 端的模型执行文本补全 |
| MRTR | 多轮往返请求（Multi Round-Trip Requests），用于在请求中获取 client 输入的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果对象 |
| `inputRequests` | Server 分配的映射表，包含内嵌的 elicitation、sampling 或 roots 请求 |
| `inputResponses` | Client 在当前轮次提交的响应，键名与 `inputRequests` 一一对应 |
| `requestState` | 不透明的 server 状态字符串，由 client 原样回显并由 server 校验完整性 |
| `resultType` | 现代 MCP 返回结果中必须包含的类型判别器 |
| 直接模型集成（Direct model integration） | 新建 server 需要模型推理时的官方推荐替代方案 |
| Capability 门禁（Capability gate） | 防止向未声明相应支持的 client 发送内嵌请求的安全规则 |
| 循环预算（Loop budget） | 本次操作允许的最大轮次、token 数、字节数、执行时长以及花费上限 |

## 旧版兼容性

Fixa em 2025-11-25 versão cliente pode ainda estar em contato vivo usando o antigo servidor  lançamento `sampling/createMessage`流程── por favor, este comportamento seja estritamente isolado entre os adaptadores de versão especializada── não haverá nenhuma forma de conversar como uma infraestrutura do servidor 2026-07-28.

官方 SDK 可以将现代的 `input_required`处理程序转换为适应旧版对端的通信. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片. 片.

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
