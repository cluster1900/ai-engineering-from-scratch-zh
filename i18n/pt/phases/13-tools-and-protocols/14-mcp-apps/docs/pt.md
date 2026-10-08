#  Baseado em protocolo sem estado de MCP Apps

> O resultado da interação continua a ser, em essência, um processo de troca de ferramentas e recursos do MCP.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## Objectivo de aprendizagem

-  através `server/discover`Com cada pedido de expansão de capacidades  declaração e negociação de aplicações MCP。
- Antes de a ferramenta ser utilizada, define a ferramenta em declarações.`ui://`Recursos
- Em 2026-07-28  无状态连线上返回完整的工具与资源 执行结果──
- 将 Apps  especializados `ui/initialize`O MCP 核心握手 (MCP) é um sistema de comunicação social que é muito mais comum.
- 综合应用源验证 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱隔离 (Origin Validation) 沙箱) 沙箱隔离 (Origin Validation) 

## 问题

O resultado do texto puro pode descrever a linha de tempo, mas não pode fornecer ao usuário uma linha de tempo em movimento que possa ser livre para escolher, revisar ou interagir.

MCP Apps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `ui://`recurso──Host pode previamente obter e verificar a segurança do recurso antes de ser executado, transformá-lo em um iframe de caixação, e através de JSON-RPC 桥接协议协调代理所有 app 操作──

O protocolo central em 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

- Não há núcleo.`initialize`Peço ou`notifications/initialized`- Notificação.
- Não existe .`Mcp-Session-Id`Peliculação
- Cada pedido está lá .`params._meta`Na tradução de acordo, as capacidades do cliente são:
- Servidor  deve ser implementado `server/discover`, para que o cliente 审查协议版本、核心能力与扩展支持──
- Cada sucesso traz consigo .`resultType`- Não.
- Streamable HTTP para cada pedido usando POST única.

Aplicativos 桥接通信中仍包含名为 `ui/initialize`O método. É um iframe entre o post e o host.

## 核心概念

### Dois protocolos, uma característica completa

保持清晰的分层视角:

1. MCP 核心协议承载 `server/discover`- Não.`tools/list`- Não.`tools/call`- Não.`resources/list`E também`resources/read`- Não.
2. MCP Apps  Expandir para declarar UI,并定义 iframe到主机的桥接交互──
3. 浏览器沙箱规则严格限制该UI所可触及的边界──

扩展标识符为 `io.modelcontextprotocol/ui`◊ ambos os lados utilizam o mecanismo de selecção de adesão (-opt-in) ◊ O cliente declara o seu apoio à expansão das capacidades de cada pedido:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/ui": {}
        }
      },
      "io.modelcontextprotocol/clientInfo": {
        "name": "timeline-host",
        "version": "1.0.0"
      }
    }
  }
}
```

`clientInfo` Recomendação para diagnóstico . É dados auto-declarados, absolutamente não credenciais de identificação .

### 染前发现声明

Resultados da descoberta do servidor declaram seu apoio à expansão:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {},
    "resources": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {}
    }
  },
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "timeline-app-server",
      "version": "2.0.0"
    }
  }
}
```

O servidor  deve apoiar a descoberta. Mas o cliente não precisa de usar a descoberta antes de cada movimento, pois cada movimento leva as suas próprias capacidades.

### Em ferramenta  define  declarar UI

现代 Apps 契约在 `tools/list`Central UI  ligado a ferramenta específica:

```json
{
  "name": "notes_timeline",
  "description": "Render a timeline of notes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline.html"
    }
  }
}
```

Este foi projetado intencionalmente para exibir dados estáticos antes de ser aplicado. O host pode exibir os resultados de execução de HTML antes de ser aplicado, previamente carregado, armazenado e verificado de forma segura. Embora o código de compatibilidade possa ainda aceitar a chave de dados de uma versão antiga, o servidor de nova construção deve unificar a saída de um conjunto de dados.`_meta.ui.resourceUri`Estrutura:

Em contextos de atualidade`tools/list`É possível conservar o resultado de devida devida a determinação do seu`ttlMs`E também`cacheScope` Quando as ferramentas visíveis diferem de usuário ou de credencial, utilize`private`- Não.

###  retornar dados ,交由 Host 绑定视图

Ferramenta 调用回常规内容与结构化数据:

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "Timeline ready."}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "Discover", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

O anfitrião já confirmou que a ferramenta é para evitar a repetição de declarações URI e para o desenvolvimento de blocos de conteúdo excedentes para os seres humanos.

### 将 App 作为资源 提供服务

O servidor declarou a descoberta .`resources`, portanto, é necessário realizar o obrigatório.`resources/list`操作──其确定性的列表条目包含规范 URI、稳定的名称、描述以及 MIME 类型──列表结果同样包含 `resultType`Servidor, dados, dados.`ttlMs`和 `cacheScope`, como ferramenta de determinação 列表一样.

Anfitrião 发送 `resources/read`在 Streamable HTTP 上, requisito possui a seguinte estrutura:

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

O HTTP 头字段值 deve ser rigorosamente harmonizado com o JSON-RPC.`-32020`- Não.

返回结果包含 HTML resource with cache提示:

```json
{
  "resultType": "complete",
  "contents": [
    {
      "uri": "ui://notes/timeline.html",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>...",
      "_meta": {
        "ui": {
          "csp": {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
            "baseUriDomains": []
          },
          "permissions": {}
        }
      }
    }
  ],
  "ttlMs": 60000,
  "cacheScope": "public"
}
```

### Cachar o conteúdo executável do recurso da interface

O recurso de aplicação e o conteúdo do texto comum existem diferenças de qualidade.`cacheScope`Para o caso privado, o cache-key deve conter regulamentações.`ui://`URI 经准入的服务器 身份与版本 资源 内容摘要以及识权上下文── não é absolutamente necessário duplicar entre os tópicos recursos de aplicativos privados, pois mesmo que URI 完全相同, HTML 内部或其策略元数据也可能存在显著差异──

Em os seguintes casos, é necessário que o arquivo de armazenamento seja desfeito:`ttlMs`Até o fim...`_meta.ui.resourceUri`绑定发生变化、服务器 版本或准入描述符固定指纹变化,或已确认的资源变化订阅中指定该 URI──在重新挂载之前,必须重新拉取并重新进行CSP 和权限审查──过期的iframe 绝不能仅仅因为新版本的资源 尚未加载完成就继续保留更广泛的权限──

### Na avaliação das características estratégias

A lógica de ensaios tem uma sequência anterior rigorosa: primeiro ensaiar o formato JSON-RPC, requerer que os dados do protocolo de filamento sejam mapeados com a capacidade do cliente do tipo objeto; depois, verificar se o título do pedido de ensaios de ensaios de ensaios é compatível com o conteúdo do texto; e depois, determinar se a versão do protocolo correspondente é suportada. Essa sequência pode prevenir eficazmente o intermediário e o servidor final de fazerem diferenças entre as mesmas solicitações.

| 异常情况 | HTTP 状态码 | JSON-RPC 错误 |
|---|---|---|
| 请求头与正文在版本、方法或名称上不一致 | 400 | `-32020` |
| 请求头与正文一致，但版本不受支持 | 400 | `-32022`，且 `data` 准确为 `{"supported":["2026-07-28"],"requested":"<实际版本>"}` |
| `resources/read` 缺少 Apps 扩展 capability | 400 | `-32021`，附带 `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| 请求的方法未知 | 404 | `-32601` |

Notificação JSON-RPC 没有 `id`, portanto, o servidor 绝不能为其生成 JSON-RPC 响应── 已接受的HTTP通知会返回带有空正文的202── Embora o erro possa alterar o código de estado do HTTP, ainda não pode ser produzido em JSON-RPC 错正文──

### O "shako" é a fronteira de defesa, e não a confiança.

O host 牢牢掌控着iframe──App 无法直接读取主机的cookie──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储──本地存储.

Por favor, siga as seguintes regras de segurança:

- Para todos os CSP 域名列表默认置空, apenas adicionar App 真正需要的来源(origin) `connectDomains`Usado para buscar, XHR e WebSocket.`resourceDomains`Usado em guião, estilo, imagem e letra.
- Em caso de possível, incluir código-fonte e dados de recursos.
- A excepção é que as funções visíveis ao utilizador precisam ser especificadas, caso contrário não se pode solicitar o direito de fotografia, de ar condicionado ou de localização geográfica.
- - Não .`postMessage`Estritamente ligado a um determinado ponto de origem, rejeitando qualquer outro ponto de origem.
- O resultado é um resultado de uma análise de dados e de dados.
- O usuário autorizou o consentimento do usuário para manter o seu consentimento no host.

Não vai ser um problema.`sandbox`属性直接照搬到所有宿主 中──Host 必须根据Apps' source model and its own isolation design to cautiously choose sandbox 标志──

允许的域名仍然属于数据外发信.`connectDomains: ["https://api.example.com"]`Significa que qualquer script executado no aplicativo pode ser enviado para esse endereço. A origem precisa pode ser adequada, mas não pode determinar se o conteúdo de carga válido é válido.`resourceDomains`Com`connectDomains`O direito de carregamento de caracteres ou de guiões não deve ser concedido a qualquer pessoa para transmitir dados.

### Aplicativos 桥接通道 têm um ciclo de vida independente

Aplicações 桥接协议 `postMessage`之上 JSON-RPC 方言──它可以交换 `ui/initialize`Com`ui/*`Notificar, também pode ser agido como método de acordo central.`tools/call`)。

View 发送带有 `appInfo`和 `appCapabilities`Objetos`ui/initialize`◦O anfitrião  Retorna às suas capacidades com o anfitrião  Só em receção da resposta  Visto 才会发送 `ui/notifications/initialized` O anfitrião ▌tem de esperar que os aplicativos ▌nos avisem de sua chegada, para poder enviar mensagens ▌

Esta empresa foi criada para um único iframe e uma única janela host. Não é responsável por negociar a versão do protocolo MCP, não cria servidor, nem cria uma conferência de nível de transmissão.`notifications/initialized` já foram removidos, enquanto Apps  expandidos `ui/notifications/initialized`依然保留── através da ponte gerada ferramenta 调用所触发的核心请求, é uma requisição independente que possui um novo ID JSON-RPC e um pedido completo de dados de 、autocontenção──

### Anfitrião 上下文、动作 Agente e revogação de direitos

Após a inicialização do canal de ponte, o Host continua a manter a máxima autoridade. Visualiza apenas a capacidade de solicitar ferramentas através do host.

Para a sua análise, a sua capacidade de acesso é de ser considerada como um host de mudanças de tendência, e não como uma única entrada de dados:

-  aplicativo host  fornecido cor e edição token, e em relação ao tema ou comparação preferência variação em tempo real resposta
- 允许 View 上报其期望的尺寸, mas por host 限制并应用 iframe 尺寸, evitar que o conteúdo se desorganize ou construa uma camada de cobertura fraudulenta.
- Em iframe  interno manter o comando de comando de um sistema de comando ∞
- Em janelas ajustando o tamanho e re-enchendo, re-testear o controle do host e o controle de vista.

Durante a operação do aplicativo, devido à mudança de estratégia de segurança do usuário, ao usuário alterar a sua conta, ao servidor sofrer uma revisão isolada ou ao host reduzir o alcance de autorização, as capacidades relacionadas podem ser retiradas.`ui/initialize`握手时检查── uma vez que o direito for revogado, deve-se imediatamente recusar a utilização de privilégios, terminar de não cumprir a estratégia de atividades de rede, limpar o estado infectado sensível e deixar de ser re-aplicado ou degradado para o recurso da UI em si mesmo quando for introduzido no modelo de texto──View 必须将拒视正常结果妥善处理,不要盲目重复试直至主机 妥协──

### A redução do nível de regresso é parte essencial do contrato.

Possui aplicativos  Percepção de capacidade de servidor  deve ainda ser capaz de servido não declarado  Extenção de usuário:

- Em`tools/list`中返回不带 `_meta.ui`A mesma ferramenta.
- Por`tools/call`Resultados do texto comum de conservação de valor.
- 读取 UI  host de capacidade não declarada`resources/read`时返回缺失能力 错误――
- Quando a ferramenta de julgamento é executada, não se assume que o iframe é definido.

```figure
t3-ui-sandbox
```

## Handwriting realizado

`code/main.py`Não depende do SDK  Construir um modelo de protocolo de processo em linha.`server/discover`声明 Apps 扩展,列出工具与资源,执行工具,并提供自含的HTML resource 服务──

O modelo recebeu o texto e o roteiro completados. Não é um adaptador HTTP completo, não é responsável pelo desenvolvimento.`Content-Type`Ou `Accept`◊ completo Streamable HTTP 适配器 por favor, consulte a secção 09 课, requer `Content-Type: application/json`且 `Accept`Com o tempo contendo`application/json`Com`text/event-stream`- Não.

运行测试:

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

检查输出中五大核心特征:

1. Cada vez que se faz uma mudança é totalmente independente.
2. Cada pedido é feito .`_meta`Capacidades:
3. `resources/list`Em execução de qualquer recurso 读取前均返回稳定的描述符──
4. Cada resultado tem um efeito .`resultType`E o servidor como um servidor.
5. Não existe nenhum protocolo central.

## Utilização

De`server/discover`Começo a confirmar.`io.modelcontextprotocol/ui`Apareceu na expansão do servidor em uma lista de mapas.`tools/list`A primeira resposta é a declaração de recurso                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

读取 `ui://notes/timeline.html`在HTML 中检索 `hostOrigin`E também`event.origin`防护代码── These two lines code are proof bridgeway not adopted通配符目标 (do objetivo de cartão selvagem)

## 交付产物

本课交付 `outputs/skill-mcp-apps-spec.md`Antes de escrever o código-quadro, pode ser usado para revisar o código-quadro do aplicativo. Ele obriga o designer a explicar claramente o actual código-quadro, expandir a negociação, reduzir o regresso, recursos de UI, estratégias de armazenamento, CSP, alcance de competências, métodos de ponte e limites de consenso do usuário.

## 课后练习

1. A capacidade do cliente  modificar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `tools/list`Mantive a ferramenta, mas removeu o recurso de interface ligado.
2. 发送 `Mcp-Name: ui://notes/other.html`Mas, por favor, não me esqueça de ler a linha do tempo.`-32020`- Não.
3. Modificar a atributos de cache do recurso para`cacheScope: private` Descrição das condições de exclusiva do utilizador desta configuração
4. Vai mudar o livro para`https://static.example.com/app.js`将该起源 添加到 `resourceDomains`Em segundo lugar, não se explica o novo tipo de segurança da cadeia de suprimentos que vem a ser provocado.
5. 增加一个 `notes_open`ferramenta não será clicada no host.

## 关键术语

| 术语 | 含义 |
|------|---------|
| MCP Apps | 由 MCP host 渲染交互式 HTML 的可选扩展规范 |
| `io.modelcontextprotocol/ui` | 通信双方声明的扩展标识符 |
| `ui://` | 用于标识 App UI 模板的专用 resource scheme |
| `text/html;profile=mcp-app` | 用于 MCP App HTML 的标准 MIME 类型 |
| `server/discover` | 用于协议与 capability 发现的当前规范 RPC 方法 |
| `resources/list` | 当 server 声明支持 resources 时强制必须实现的资源枚举方法 |
| `resultType` | 现代协议规范中成功的返回结果所必须携带的判别器 |
| `ui/initialize` | Apps 桥接通道的首个请求，与已移除的核心协议握手完全独立 |
| `ui/notifications/initialized` | Apps View 在收到 host 响应后发出的就绪通知 |
| CSP | 用于限制脚本、样式、图片和网络 origin 的浏览器内容安全策略 |
| 文本降级（Text fallback） | 面向不支持 Apps 扩展的 host 所保留的 tool 基础行为 |

## 延伸阅读

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps build guide](https://modelcontextprotocol.io/extensions/apps/build)
- [Official extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
