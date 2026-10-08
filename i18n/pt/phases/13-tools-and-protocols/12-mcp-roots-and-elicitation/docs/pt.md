# 显式权限范围与无状态 Elicitação

> Roots em MCP 2026-07-28 规范中已被弃用,且它从来不是安全沙箱. Por favor, coloque o alcance do domínio em ferramentas visíveis 参数或资源URI, por servidor 进行权限, e em ferramentas 真正需要用户输入时使用MRTR.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## Objectivo de aprendizagem

- Utilize aparente work area parameters、ressource URI ou servidor 静态配置替代已弃用 Roots。
- O sistema operacional de segurança e segurança é um sistema de segurança e segurança para os usuários.
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `input_required`结果交付表单模式(forma-modo) `elicitation/create`- Não.
- Em cada pedido de capacidade do cliente, declaração de elicitação  suportar并拒绝不支持模式──
-  rigor `accept`- Não.`decline`和 `cancel`Três resultados de intercâmbio muito diferentes.
- O que é um problema de identificação?

## Duas questões parecidas

Uma ferramenta de notas 收到了如下请求:删除旧TPS 报告──

O servidor tem de responder a duas questões diferentes:

1. Esta operação permite tocar em que área de trabalho?
2. Em três notas correspondentes, qual é o número de usuários?

Primeiro problema depende do alcance (escopo) e da identificação (autoridade) de um cliente. Segundo problema pertence à interação (interação) de um cliente.

## Raízes  apenas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

As primeiras regras do MCP permitiram que o cliente declarasse as raízes e notifique o servidor quando as listas mudaram. No entanto, as raízes eram apenas informações de orientação informativa.

MCP 2026-07-28  para o novo design totalmente abandonado `roots/list`Com`notifications/roots/list_changed` Recomendação de utilização dos seguintes métodos de expressão como substituto:

- Quando o alcance de cada chamada mudar, usar `workspaceUri`Ou `directory`ferramenta 参数。
- Quando a operação em si é dirigida a um recurso específico, use o recurso URI.
- Quando um determinado depósito ocupa uma área de trabalho fixa, use um servidor 配置文件。
- Quando é necessário impedir o código através da tecnologia, use process沙箱 (process sandbox) ou isolação do sistema de arquivos (jailed file system) ⋅

Se o actual programa de adesão de 2026-07-28 estiver abandonado durante o período de transição ainda for necessário`roots/list`O servidor deve estar embuxado no MRTR.`inputRequests`Em meio, não pode enviar o pedido de reversão real-time. É apenas uma forma de adaptador de mudança.

O modelo pode ver e repetir expressos em termos de manipulação, mas o escopo oculto no âmbito das conversas de transmissão é mais difícil de avaliar, reinstalar, revisar e percorrer.

### 3 Princípios de Defesa

O URI não é um documento de legitimidade.

1. **鉴权（Authorization）：**O titular do direito de identificação é autorizado a utilizar esta área de trabalho?
2. **路径限制（Containment）：**O objetivo da regulamentação posterior é que a URI permaneça rigorosamente dentro das fronteiras das áreas de trabalho autorizadas?
3. **沙箱隔离（Sandbox）：**Se o servidor for invadido, o sistema operacional poderá impedir a sua fuga?

Servidor operacional 会维护一个信任工作区 URI 白名单,规范化处理百分号编码的路径,校验真实的路径组件边界,并执行物理删除前即刻重新检查路径限制──

O pre-exame de caracteres do filho é um erro grave:

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

Estes dois percurso mal intencionados são todos em linha de princípio de lei. Primeiro é necessário regularizar, depois re-classificar em relação aos componentes do percurso.

## A elicitação ainda existe, mas o modo de interagir mudou.

Elicitação é moderna normativa 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中 中`tools/call`- Não.`prompts/get`Ou `resources/read`                                                                                                                                                                                                                                                              `elicitation/create`                                                                                                                                                                                                                                                              

O servidor de 2026-07-28 não vai enviar contra JSON-RPC`InputRequiredResult`- Não .

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

Host 负责染表单──user can choose to submit 接受 (acceptar) 显式拒绝 (declinar) 或直接取消 (cancelar) .`tools/call`- Não .

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Entre as duas convocações não há qualquer acordo. O servidor verifica o estado de resposta, de acordo com o esquema esperado, confirma que a nota selecionada está incluída no conjunto de candidatos assinados, re-identifica o direito de área de trabalho, re-verifica o limite de caminho, e finalmente, executa a remoção.

##  Capacidade de negociação para cada pedido 

支持表单模式 elicitation 的客户 会声明:

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

空的 capacidade de elicitação`"elicitation": {}`) para considerar a compatibilidade é igual a apenas apoiar um único modelo.`"elicitation": {"form": {}}`Assim como apoiar um único modelo.`"elicitation": {"url": {}}`O servidor 绝不能内嵌当前请求的功能 中所缺失的模式,甚至前者请求曾声明过该模式──

Cada pedido também tem de ser levado .`io.modelcontextprotocol/protocolVersion`△ versão falta ou não tipo de caracteres retornar `-32602`△不支持的版本字符串返回 `-32022`Não tenho certeza.`supported`Com`requested`Dados: falta ou apenas apoio de URLs elicitação 会返回 `-32021`,并将 `data.requiredCapabilities`设为 `{"elicitation":{"form":{}}}`- Não.

 sem JSON-RPC `id`O envio pertence a notificação.`202 Accepted`- Não.

`clientInfo` deve ser incluído para uso de diagnóstico, mas é auto-declarado, e não pode ser utilizado para identificar o direito de identificação de usuário.

O servidor está pronto .`server/discover`Não voltar contendo`resultType: "complete"`de `supportedVersions`Capacidades`ttlMs`E também`cacheScope` Para este design moderno, não se declara externamente raízes.`tools/list` O resultado é de certeza.`notes_delete`描述符、合法的 object 类型 `inputSchema`、servidor, dados e dados públicos 缓存提示──

## 表单模式(Modo de formulário)

O modelo expresso usa um esquema JSON limitado de design de quadros de diálogo exclusivamente disponíveis. O esquema JSON deve ser objeto, suas propriedades devem ser limitadas apenas aos quadros primitivos do plano.

Modelo individual aplicável:

- Selecionar um dos vários projectos candidatos;
- 确认某项破坏性操作;
- Preferências de configuração de informação não sensível;
- A recolha de menor quantidade deve ser feita pelo homem e não pelo modelo.

Não use um modelo de lista para coletar senhas, chaves API, cartões de visita ou credenciais de pagamento.

O servidor deve testar novamente o conteúdo de transmissão.

## URL 模式(Modo de URL)

URL 模式发送一个安全的 Web URL 以进行带外(out-of-band)交互:

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

Quando informações sensíveis devem ser inseridas diretamente no Web 流程 controlado pelo servidor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

`accept` Response apenas indica que o usuário concorda em abrir o URL, não prova que a transação externa foi concluída com sucesso.`input_required`Resultados

A elicitação de URL  absolutamente não pode substituir o mecanismo de identificação entre o cliente MCP e o servidor MCP― é para que o servidor MCP represente o usuário executando uma interação externa e projetada―Server  deve ligar o usuário do terminal do navegador com o mesmo sujeito de identificação que inicia a operação MCP    

## 响应分支与处理分支

Por favor, dê as seguintes medidas:

| 动作 | 含义 | 安全的 Server 处理行为 |
|---|---|---|
| `accept` | 用户提交了交互内容 | 校验内容并继续执行 |
| `decline` | 用户明确表示拒绝 | 返回一个执行完成且非错误的拒绝结果 |
| `cancel` | 用户关闭对话框或未能完成交互 | 安全停止并允许稍后重试 |

绝不要将缺失内容解读为默许同意. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要将衰退. 绝不要转换为重复追问的死循环.

##  proteger destrutivo MRTR  estado

A lista de candidatos não pode existir apenas no valor base64 de imediato ou não assinado. O cliente tem controle sobre tudo o que ele retransmite.

Esta aula foi realizada em nome do Estado, contendo:

- 经过鉴权的主体;
- 发起调用 método original;
- `workspaceUri`Com`title`O resumo:
- Lista de notas legais de demonstração;
- 操作执行阶段;
- 较短的过期时间──

Antes da alteração de execução, o servidor também verifica os últimos registros de notas vivas. Isso é capaz de prevenir a eliminação das condições de operação, bem como a situação em que as notas-alvo foram transferidas para fora da fronteira da área de trabalho após a exibição do formulário.

 Para transações financeiras ou operações irreversíveis de uma única vez, apenas com o HMAC  não pode impedir que o estado legal seja reimposado durante o seu período de vigência  deve ser rigorosamente gerado e consumido em operações atômicas, em um armazém de reimposão compartilhado por todos os operadores  não)  Este curso é inserido em um armazém de limpeza automática  com TTL, e mantém em sua declaração atômica durante a remoção de memória  A base de dados de classe de produção deve ser escrita simultaneamente em condições de transação ou de preço semelhantes em fronteiras  Declaração e mudança de dados 

Antes de declarar, é necessário verificar a legalidade da comunicação.`cancel`Não executará qualquer alteração, e permitirá que o estado seja reprovado durante o período anterior.`decline`属于终态, portanto,本课会消费该 nonce 且不执行任何删除──

```figure
t3-roots-boundary
```

## Handwriting realizado

`code/main.py`- É um filme moderno .`notes_delete`Ferramenta:

- `tools/list`返回确定性、可缓存的描述符, contendo o espaço de trabalho necessário e o esquema de título。
-  O alcance do poder através de expressão `workspaceUri`参数传递。
- Configuração do servidor para o tema do curso em curso que concede o direito de acesso à área de trabalho.
- URI 规范化有效拒绝前混与编码后的目录遍历攻击──
- Propriedades destrutivas de eliminação e exibição de um único modo de elicitação.
- Elicitação 封装在 `resultType: "input_required"`Transporte de informação.
- 签名  assinatura`requestState` ligado a lista de candidatos precisa com os parâmetros originais
- O armazenamento de resignação de entrada pode ser reutilizado em vários servidores, por exemplo, em um estado de aceitação ou declínio.
- 重试调用采用全新请求 id 并返回 `resultType: "complete"`- Não.

O armazém de dados adota a memória, a fim de realizar um acordo de revisão clara.

## Utilização

Em depósito:

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Discovery declaration tools 且不包含 Roots──
- Descoberta de ferramentas 返回 `notes_delete`, acompanhado`resultType`、servidor 、status e cache 、
- Peço o meu nome .`1`Em`inputRequests.delete_choice`- Não, não.
- Peço o meu nome .`2`回显签名状态并完成删除──
- Antes de tudo, o sistema de informação é um sistema de informação que permite a informação e a informação.
- 改 title 无法复用先前的确认状态──
- Execução de recusa 会保留笔记完好无损――
- Compartilhar notas e re-recarregá-las em dois servidores, o objeto não pode ser re-executado e confirmado uma vez.
- A configuração e a declaração de um só exibição são normais, e apenas declaração de URL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `-32021`O que é que se passa?
- Não suportada versão de erro resposta usando exacto `-32022`Data Structure:
- 没有 id 的通知 不产生任何 JSON-RPC 响应──

## 交付产物

`outputs/skill-elicitation-form-designer.md`能够辅助设计显式范围、识别权检查、MRTR表单、响应分支与状态绑定──it proíbe estritamente o uso de raízes já abandonadas quando utilizadas em caixas, ou proíbe também a recolha de informações sensíveis através de um modelo de exibição.

## 课后练习

1. Em casos individuais, não é possível eliminar notas, provando que dois processos não podem ser submetidos simultaneamente com sucesso.
2. 增加 `url`Capacidade de negociação e de negociação de estrangeiros.`inputResponses`- Não.
3. O seu uso é limitado a partir de um ponto de vista de forma a que o seu uso seja limitado.
4. Por que apenas com URI 词法包含检查无法阻止符号链接逃逸──
5. Design a 2025-11-25 适配器,将现代MRTR handler 输出映射为旧式服务器 发发起的发动,并保持其与当前处理器的代码隔离──

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Roots | 已弃用的提示性工作区指引，不具备鉴权或沙箱隔离能力 |
| 显式权限范围（Explicit scope） | 在请求参数中清晰可见的工作区、目录或 resource 句柄 |
| 路径限制（Containment） | 规范化路径组件校验，确保目标严格限制在受控边界之内 |
| Elicitation | 在 MCP 操作执行期间用于获取用户输入的 client 特性 |
| 表单模式（Form mode） | 使用受限扁平 schema 的带内（in-band）结构化用户输入 |
| URL 模式（URL mode） | 针对敏感或外部工作流的带外（out-of-band）Web 交互 |
| MRTR | 多轮往返请求，返回 input-required 结果后由 client 发起全新重试 |
| `requestState` | 不透明的状态凭证，由 client 原样回显并由 server 进行完整性校验 |
| Decline（拒绝） | 用户明确作出的拒绝操作 |
| Cancel（取消） | 用户主动关闭界面或在未获批准的情况下中断交互 |

## 旧版兼容性

 para os limites fixados em 2025-11-25  versões,`roots/list`- Não.`notifications/roots/list_changed`E o servidor em tempo real`elicitation/create`Pode ainda existir. Por favor, marque o adaptador como legado. Não pode permitir que a versão antiga da Root List passe pelo servidor.

## 延伸阅读

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
