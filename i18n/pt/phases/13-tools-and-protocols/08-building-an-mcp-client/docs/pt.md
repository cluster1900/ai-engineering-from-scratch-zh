# Construir MCP Cliente: serviços descoberto 路由与双时代回归

> O cliente MCP moderno, em cada pedido, reproduz completamente o seu contrato de comunicação. É a decisão de compatibilidade mais desafiadora, baseada no julgamento de que o servidor antigo é a verdadeira estrutura do legado, também é um servidor moderno que pode ser corrigido.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（构建 MCP Server）
**Time:** ~85 分钟

## Objectivo de aprendizagem

- Para cada MCP`2026-07-28`Por favor, veja o envelope de dados mais recente do zero.
- Utilização `server/discover`探测 baseado em estúdio Servidor,并协商双方均支持的版本──
-                                                                                                                                                                                                                                                               
-  apenas verificou a versão de apoio válida e correta `initialize`结果后,才接受 Legacy 时代──
- 合并确定性 Instrument 列表, 杜绝静默覆盖重名冲突──
- O seu trabalho é de fazer com que o seu trabalho seja realizado.

## 问题背景

O agente host geralmente precisa de várias MCP Server e comunicação simultânea. Ele deve encontrar cada servidor, juntar-se a um catálogo de ferramentas, resolver conflitos de redes, utilizar métodos de roteiro e recuperar-se de uma interrupção na camada de transmissão.

`2026-07-28`规范 torna o funcionamento estável muito simples, pois cada pedido é totalmente autoconhecido.

- 支持首选版本的现代 Server;
-  Returnar versão reconhecível ou Header  err err err errão do Server moderno;
- Nunca ouvi falar .`server/discover`O antigo servidor;
- Até receber.`initialize`Mantenham-se em silêncio.

Se todos os erros de detecção forem geralmente considerados como servidores legais, são extremamente perigosos.

## 核心概念

### Por isso, não é necessário que o Conselho de Administração do Estado de São Paulo

Para cada processo de servidor ou de rede, mantenha um registro de transferência para o terminal:

- 传输句柄或发送函数;
-  selected agreement时代与具体版本号;
- Recentemente descoberto de Capacidades de servidor;
- Lista de ferramentas de determinação de última vez;
- Está esperando a resposta do pedido ID 映射;
- 传输层的物理健康状态──

Este pertence ao registro administrativo interno do Cliente, não é o chamado protocolo de sessão estado. Em MCP moderno, o servidor ainda recebe independentemente de cada pedido de negócio a versão e capacidade de declaração.

### Desde zero construção para cada pedido moderno

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

Não é necessário apenas adicionar um único valor de dados ao objeto conectado para supor que ele possa chegar à linha da rede.

### 现代服务发现

`server/discover`返回支持的版本、Server 能力、使用说明、缓存提示以及推的 Server 身份──Client 选择双方均支持的最高现代版本──

Para o cliente moderno, o serviço é opcional; mas em estúdio  modo é altamente recomendado o uso.`tools/list`Pode haver um falso sucesso.`server/discover`能够建立分明的时代分界线──

### estdio 兼容性探测流程

双时代(double-era) estúdio Cliente em enviar qualquer outra solicitação antes, prioridade enviar transportar seu primeiro escolha moderno元数据的 `server/discover`❖ pode produzir três tipos de resultados:

1. **DiscoverResult（成功发现）**O servidor é uma estrutura moderna.
2. **Recognized modern error（已识别的现代协议错误）**Servidor ainda está em desenvolvimento.`-32022`, de`data.supported`中选择可用版本并使用新请求 ID 重试;若为 Header 或 Capability 错误,修正请求内容即可──**严禁回退发送 `initialize`。**
3. **Ambiguous signal（歧义信号）**O JSON-RPC não foi identificado 报错、超时、连接关闭或空响应均无法确定协议时代──必须默认按失败关闭(fail closed), exceto se o terminal for transportado e configurado claramente.

已识别的现代协议错误码 Incluem:

- `-32020`HeaderIncorrespondência (request head with request body)
- `-32021`MissãoRequeridoClienteCapacidade ((缺少必要的客户能力)
- `-32022`Não suportadoProtocolVersion(不支持的协议版本)

Mesmo que o terminal tenha sido incluído no listagem do patrimônio, já identificado o erro moderno também provou ser o servidor moderno.`initialize`E assim, a nossa equipa de segurança está a ser atingida.

Não posso .`-32601`(metod não encontrada) como prova completa de entrada no legado.

### White Name: um documento de acordo

Legacy 兼容性 deve ser a característica expressa da configuração do terminal:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

必須将此选项绑定至明确配置的命令或端点──严禁使用通配符让任意未知 Server自动降级为较弱语义──未配置──`allow_legacy=True`O resultado da investigação foi um erro de informação, mas não foi recebido.`initialize`- Não.

O White List apenas concedeu o direito de iniciar a investigação.`initialize`Peço, então rigor exigir satisfazer as seguintes condições:

-  Recebeu o JSON-RPC correspondente à ID da solicitação `2.0`响应;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `result`字段,且无 `error`O artigo 2.o
- `protocolVersion` pertence ao cliente 允许配置的旧版集合;
- incluindo tipos de objetos `capabilities`字段;
- 包含非空字符串 `name`Com`version`de `serverInfo`Objeto:

Qualquer versão super-hora, interrupção, erro, resultado, ID, erro ou não-suportação é um fracasso direto. Somente os resultados de uma estrutura totalmente conforme a lei poderão ser marcados como Legacy.

### 命名空间无冲突合并

Os servidores podem estar a ser expostos .`search`O instrumento deve ser adotado estratégia de declaração clara:

1. **冲突时加前缀（Prefix on collision）**O primeiro nome do instrumento é o seguinte:`<server>/<tool>`- Não.
2. **冲突时拒绝（Reject on collision）**Não é necessário que o seu conteúdo seja de forma clara.
3. **静默覆盖（Silent overwrite）**- Não .**坚决杜绝**❖ Ele oculta o modelo realmente utilizado pelo servidor.

### 调用路由机械

路由是纯粹的映射查找:

```text
规范工具名
  -> 对端名称 + 本地工具名
  -> 生成全新的 JSON-RPC 请求 ID
  -> 现代请求元数据 或 显式 Legacy 结构
  -> 匹配响应 ID 并返回
```

```figure
tp-client-merge
```

## 动手实践

`code/main.py`通过内存对端函数清楚地展示了整个协议决策树──它连接到两个现代对端和一个显然白单单标记的遗产对端,合并并路由它们的工具:

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

单元测试覆盖常规演示易忽视的边界条件:

- 现代请求逐次重复元数据;
- - Eu não sei .`-32022`时重试现代发现, absolutamente não é um processo de recuperação em mãos dadas;
- 已识别的现代错误绝不发生降级;
- 超时、断开与未知错误在无白名单时绝不触发 `initialize`O artigo 2.o
- O número de pessoas que estão em situação de risco é apenas de acordo com a regulamentação.`initialize`响应后才确立为遗产;
-                                                                                                                                                                                                                                                               

## 交付物

本课交付 `outputs/skill-mcp-client-harness.md` Pode ser usado para a solicitação moderna de dados, estúdio, geração de consultas, determinação de espaço de nomeamento, segurança e segurança de fechamento.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 对端 (Peer) | Client 端维护的单个 Server 传输句柄及其发现信息的记录实体 |
| 协议时代 (Protocol era) | 现代逐请求元数据模式，或旧版初始化握手语义 |
| 服务发现探测 (Discovery probe) | 用于识别 stdio 对端时代的初始 `server/discover` 请求 |
| 已识别现代错误 (Recognized modern error) | 证明对端属于现代架构并禁止 Legacy 回退的特定协议错误 |
| Legacy 白名单 (Legacy allowlist) | 运维显式授权对指定对端进行一次受限兼容探测的配置 |
| 正向 Legacy 证据 (Positive legacy evidence) | 针对受支持旧版协议返回的有效、ID 匹配的 `initialize` 结果 |
| 合并命名空间 (Merged namespace) | 跨所有活跃对端规范化后的工具全局名称集合 |
| 冲突策略 (Collision policy) | 处理重名工具的加前缀或报错拒绝规则 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
