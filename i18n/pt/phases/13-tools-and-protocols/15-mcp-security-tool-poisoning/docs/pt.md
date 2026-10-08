# MCP segurança:元数据投毒、路由与MRTR 状态

> 无状态 não significa零信任(infidelidade) . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~60 minutes

## Objectivo de aprendizagem

- A descrição da ferramenta, as anotações, as informações do cliente e as informações do serviço são consideradas dados não confiáveis.
- 检测元数据投毒(envenenamento de metadados) 描述者 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改 (descrição) 恶意改) 恶意改 (descrição) 恶意改) 恶意改 (descrição) 恶意改) 恶意改 (descrição) 恶意) 恶意改 (shading) 恶意) 恶意) 恶意)
- 验证 2026-07-28 版本的请求元数据与流通 HTTP 路由头部──
-  proteger o MRTR `requestState`免受改,并将人工确认与精确调用论据 强绑定──
- O seu poder de autorização e limitação de velocidade será aplicado ao titular do certificado principal, e não ao processo de acordo que tenha sido removido.

## 问题

模型依赖读取工具描述 来决定调用什么――路由器依赖读取工具名 来决定将请求发送到哪儿――用户依赖读取界面标签来决定批准什么操作――只需要一个恶意构建的描述符,就能同时发动攻击对这三者――

MCP 官方的安全指引非常直接: salvo descrições e anotações provenientes de servidores totalmente confiáveis, senão uma lei deve ser considerada como dados não confiáveis. Mesmo assim, o estado de confiança durante a operação também pode mudar. Uma vez o servidor 更新、一个受污染的依赖包、一次登录配置错误,或者一次网关合并,都有可能改变模型看到的内容──

O actual acordo também mudou as fronteiras de segurança. No protocolo central de 2026-07-28, não há fase de mão, nem sessão de nível de transmissão.`Mcp-Session-Id`Para vincular os certificados de aprovação, as restrições de velocidade ou os projetos de segurança de auditoria, não estão mais em conformidade com os padrões do acordo existente.

## 概念

### Valha a pena verificar as sete grandes faces de ataque

Em vez de ficarem confusos, não é melhor seguir uma lista clara de defesas:

1. **元数据投毒（Metadata poisoning）：**Descrição embutida em ferramenta de declaração  comportamento totalmente irrelevante instruções
2. **Descriptor 恶意篡改（Descriptor rug pull）：** nome, descrição, esquema ou anotação 发生静默变更──
3. **跨 server 名字遮蔽（Cross-server shadowing）：**Os dois últimos terminais revelaram o mesmo nome de ferramenta não limitado, enquanto o routers escolheu silenciosamente um deles, de acordo com a ordem de registro.
4. **Header 与 Body 混淆（Header and body confusion）：**HTTP 头部 `Mcp-Method`Ou `Mcp-Name`Não coincide com o conteúdo do JSON-RPC.
5. **Capability 权限提权（Capability escalation）：**O servidor  erroneamente considerará essa declaração como um credencial autorizado.
6. **MRTR 状态篡改（MRTR state tampering）：**客户端改了                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `requestState`、 respondeu a outra questão de confirmação completamente diferente, ou irá repetir o antigo certificado de confirmação para os argumentos posteriores à modificação.
7. **供应链身份混淆（Supply-chain identity confusion）：**A partir de agora, o usuário pode ser identificado como um usuário ou servidor.

Estes ataques são frequentemente interligados entre si. Haci bloqueado. A pinagem de hash ajuda a descobrir as sequências do descrito, mas não pode provar o descrito inicial.

### Quando o pedido foi feito foi como prova, não como identidade.

Cada versão de 2026-07-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "elicitation": {"form": {}}
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "security-lab",
      "version": "1.0.0"
    }
  }
}
```

Em cada pedido, é necessário verificar a versão do protocolo e a estrutura eficácia da capacidade.**绝不能**- Não .`clientInfo`Quando o objeto do certificado é identificado, é puramente dados do seu próprio relatório.

O mesmo aviso também se aplica aos resultados dos dados.`io.modelcontextprotocol/serverInfo` É muito útil para registros de registros e pesquisas, mas não é nem um certificado digital, nem um registro, nem pode ser usado como base para decisões de autorização.

### Previo processo de verificação, estratégia de re-execução

Para o`tools/call`,Streamable HTTP 传输层 contém os seguintes capítulos:

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

Metodo do centro do cabeçalho  deve estar em total harmonia com o centro do corpo `params.name`完全一致──在选择后端、应用 RBAC(基于角色的访问控制) 或消耗限流代币 之前,一旦发现不一致,必须立即返回 `-32020`错误进行拒绝――

Esta ordem de verificação elimina uma falha de diferença comum: impedir a aparição de um componente baseado em um organismo, enquanto outro componente de rede depende da situação do cabeçalho.

底层报文验证遵循严格的时间序列:先验证 JSON-RPC 和元数据类型,比对头条与体值,然后检查匹配的版本是否支持──Header 不匹配返回 HTTP 400与错误码`-32020` Se o cabeçalho e o corpo não forem suportados, volte para HTTP 400 com o erro código `-32022`, e`data`必須精确為 `{"supported":["2026-07-28"],"requested":"<actual>"}`◊ Se solicitar um método desconhecido, retornar HTTP 404 com erro código `-32601`- Não.

Quando um contrato precisa de recuperação estruturada, cada erro pode ser selecionado.`data`字段──由于通知(notificação) 没有 `id`, portanto, nunca recebe JSON-RPC Sucesso ou erro de resposta.

### Para todo o Descrictor  realizar hashlock ()

仅对描述 计算哈希会遗漏 schema 和 annotation 的改──必须对用户批准的所有描述符 字段进行规范化(canonicalize)并计算哈希:

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

Vai ser digerido e armazenado em um código completo.`notes.export`) , e registar no ambiente de produção os certificados e o tempo de aprovação dos editores ──

Em cada nova ou descoberta:

- Não sei o que fazer.
- Como um mal-intencionado, o seu corpo é separado.
- 重复的未限定名称: obrigatoriedade de requisitos de determinação de nomeamento espaço de divisão.
- 静态扫描命中:拦截并全面审查整个描述器──

哈希一致 só pode provar que o conteúdo não mudou, não pode provar a sua segurança de natureza.

### 静态扫描 é uma linha de aviso

 simples modelos de correspondência são capazes de marcar os rótulos de papel, instruções de cobertura, comportamento oculto, acesso secreto e de suspeitos de fora de rede.

Mas a análise estática não pode ser usada como prova de significado. Uma descrição segura pode conter frases marcadas em um aviso de segurança legal; enquanto uma descrição de mal-intenção bem construída pode evitar completamente todas as palavras-chave.

### 合并之前进行命名空间隔离

Suponha que dois servidores tenham sido expostos .`search`A primeira e última ordem de registro não pode determinar quem é o executor.

```text
notes.search
issues.search
```

完全限定名就是对外曝光的门户 公共名称──后端映射关系应单独记录──稳定的命名能确保审批,审核,哈希锁定以及`Mcp-Name`路由全部指向同一实体对象──

### Capacidades é declaração de compatibilidade

De cada pedido .`clientCapabilities`                                                                                                                                                                                                                                                              **绝不代表** conceder aos clientes o direito de acesso a ferramentas, dados ou operações¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

授权仍完全来自已认证的主体 (principal) 和资源策略 (Ressources Strategy) 授权仍然完全来自已认证的主体 (principal) 和资源策略 (资源策略) 授权仍然完全来自已认证的主体) 授权仍然完全来自已认证的主体 (principal) 和资源策略 (资源策略) 授权仍然完全来自已认证的主体 (权权权仍然完全来自已认证的主体) 授权仍然完全来自已认证的主体 (主体) 授权仍然来自已认证的主体) 授权仍然来自已认证的主体 (主体) 和资源策略 (主体) 和资源策略 (主体) 和资源策略 (主体) 授权仍然来自已认证的主体主体 (主体) 和资源策略) 严格执行步骤为:

1. 认证传输层凭证──
2. 验证协议版本、headeres以及请求结构──
3. Capacidade de inspecção 兼容性。
4. Para os temas, ferramentas, recursos e argumentos, exercer o direito de identificação.
5. 执行操作或向用户请求输入──

### 保护无状态 MRTR 确认

具有重大影响的工具 (outil consequencial) 可能需要用户确认──当前 MCP 采用多往回请求 (多往回请求)  MRTR),而不是服务器到客户端的反向回调──

Primeiro turno:

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Export notes to archive?",
        "requestedSchema": {
          "type": "object",
          "properties": {
            "confirm": {"type": "boolean"}
          },
          "required": ["confirm"]
        }
      }
    }
  },
  "requestState": "opaque-integrity-protected-value"
}
```

客户端 obter o usuário entrada, usar o novo JSON-RPC id 重试原始方法:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes.export",
    "arguments": {"query": "private", "destination": "archive"},
    "requestState": "opaque-integrity-protected-value",
    "inputResponses": {
      "confirm": {
        "action": "accept",
        "content": {"confirm": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Cada um .`inputRequests`O valor é um conteúdo.`method`和 `params`O nome do nome do nome deve ser incluído.`inputResponses`Introdução à política de desenvolvimento de sistemas de gestão de recursos humanos`requestedSchema`, e o cliente deve ter capacidade de solicitar formulários no servidor 发起请求前已声明──

O acordo anterior tem duas formas de expressão legal única:`{"elicitation":{}}`隐式支持表单; e `{"elicitation":{"form":{}}}`Por exemplo, o número de pessoas que estão em situação de risco de morte é de aproximadamente R$`{"elicitation":{"url":{}}}`),则不支持表单请求──此时服务器会返回 HTTP 400 与错误码 `-32021`, e`data.requiredCapabilities`Por`{"elicitation":{"form":{}}}`- Não.

必須将 `requestState`视为不可信输入──对其签名或加密,严密验证,并将其与方法,工具,精确论点,操作目的,过期时间,认证主体以及一次性随机数,用于防重放)强力绑定.

Não existe nenhum modelo operacional que possa ser injectado num armazenamento de armazenamento restrito, que pode ser utilizado por vários gateways, como o compartilhamento de exemplos, e que constitui uma fronteira de execução: apenas uma operação de consentimento verificada ou uma finalização de um desvio manifesto pode consumir o estado.`cancel`Não executar qualquer operação, e manter um estado de repetição antes do término.

切勿将确认上下文藏在某协议会议中──集群中的任何一个服务器 实例都必须能够独立验证重试请求──

### 高风险调用的两人法则(Rule of Two)

A partir de três dimensões para uma única adaptação para a classificação:

- É o que é o consumo?
- É possível acessar dados sensíveis?
- Se não ocorrerão efeitos externos significativos irreversíveis.

Qualquer etapa de automação individual não pode ter simultaneamente estas três características. Uma vez reunida, é necessário que a sua divisão, redução de direitos, ou através do MRTR introduzir uma confirmação humana clara.

### Em execução anterior (Reduce Authority)

O estado em si não é igual à segurança. Embora eliminou o risco de conversação oculta, um pedido de autoconteúdo ainda pode usar um agente com muito poder para divulgar dados ou causar destruição irreversível. A verdadeira segurança vem de um poder de contração em cada nível de fronteira:

1. **类型化动词（Typed verb）：**暴露单一受限操作 (exposição de operações limitadas)`archive_note`), em vez de generalizar `run`Ou `request`Este tipo de ferramentas podem derivar a capacidade não esperada.
2. **校验参数（Validated arguments）：**尽可能采用封闭的方案,拒绝未知字段,进行标识符单次规范化,限制用负载大小,并评估策略前验证目标地址、租户归属与资源所有权──
3. **即时鉴权（Current authorization）：**O objetivo é estabelecer um sistema de gestão de dados e de dados que permita a criação de um sistema de gestão de dados e de dados.
4. **绑定动作的审批（Action-bound approval）：** Para a alta influência, a aprovação artificial e a classificação de elementos  ligados, e adicionados  a transição de tempo e a estratégia única de vigência
5. **一等拒绝（First-class refusal）：**O usuário rejeitará o prazo de aprovação e não terá a finalidade de obter o resultado esperado normal, não executará quaisquer efeitos secundários, não poderá recusar a redução de classificação para o recurso de reserva mais fraco.
6. **脱敏审计证据（Redacted audit evidence）：**记录请求者、采用入口描述与策略版本、授权规范化目标、允许或拒绝的原因,以及是否已开始执行──

Cada componente está em um conjunto de componentes fechados abaixo do poder de execução. O processo final de processamento recebido deve ser um comando de campo verificado, e não um certificado de domínio de texto original. Quando o MRTR re-essaja, actualiza as tarefas ou transfere o seu bloco de rede, deve ser re-emperado completamente nessa rede.

### 当前与遗留交互路径

Em 2026-07-28 规范中,Roots、Sampling and Logging 针对新实现已正式废弃──Gateway 只有旧版本请求通道代码作为受版本门禁控制的后兼容路径保留──

Não se deve envolver em amostras de tomada de amostras por sessão limitadores construir novos mecanismos de defesa                                                                                                                                                                                                                                                 

### 无状态 Transportes 检查项

- Em um único POST 端点接收现代 MCP 报文。
- Para o GET moderno e o DELETE em relação a este ponto, não é permitido o método 405.
- Não se produz nem depende`Mcp-Session-Id`- Não.
- 忽略旧版会议 和重放头部, deve ser considerado como o seu autor de entrada.
- Para este POST, solicite o retorno do SSE do JSON ou do domínio de roteiro do pedido.
-  apenas em situações de acordo com as partes, uso `subscriptions/listen`Receber notificação de mudanças no ciclo de vida.

```figure
tp-tool-poisoning
```

## 动手构建

`code/main.py` implementar um modelo de segurança em um processo de leve escala.  Implementar um modelo de segurança em um processo de leveza.  Implementar uma regulamentação e bloqueio de hashes, relatar dados e somar nomes, verificar os pedidos modernos e os dados de acesso, e passar com a assinatura HMAC.`requestState`Com o co-injectável de re-emissão de armazenamento, o processo de exportação e de confirmação foi concluído em duas fases.

O modelo inicia-se no adaptador HTTP para resolver JSON após o cabeçalho do pedido e do roteiro.`Content-Type`Ou `Accept` Você pode ter a mesma distribuidora com um conexo HTTP adaptador em linha completa, o último requisito obrigatório `Content-Type: application/json`且 `Accept`Com o tempo contendo`application/json`Com`text/event-stream`- Não.

- Não .

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Demonstração de código modificado intencionalmente um descritor.`input_required`响应与无状态重试的完整流程──

## Use-o

 将代码中   em que está a história ?`SAFE_TOOLS`替换为您的自认的服务器 规范化快照. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中必须全面人工审查新增或变化的描述.

Em nível de internet, durante a detecção do serviço, executar este conjunto de verificações e, oficialmente, fazer a sua implementação novamente.

## Entrega-o

本课交付 `outputs/skill-mcp-threat-model.md`O sistema oferece um conjunto de habilidades de construção de ameaças para os acordos atuais, abrangendo a totalidade dos dados, rotos, capacidades, autorizações, MRTR, cache, registro e fronteiras de compatibilidade.

## 课后深练习

1. O teste de reexame será realizado em um estado de MRTR seco, e o teste de reexame será rejeitado em um pedido de reexame iniciado como outro.
2. A utilização de dados em base a dados é uma forma de transferência de dados, que pode ser feita através de um sistema de dados de dados.
3. O sistema de teste de segurança pode ser controlado por um sistema de controle de falhas de segurança.
4. Apenas modificar uma ferramenta.`inputSchema`E manter a sua descrição inalterável, verificando o descrito total de quantidade
5. 增加一安全策略: quando diferentes temas vêem `tools/list`存在差异时, proibição de realizar caché público)
6. Na rede, o servidor de última versão está totalmente separado.`2025-11-25`兼容分支中──

## 关键术语

| 术语 | 含义 |
|------|------|
| 元数据投毒（Metadata poisoning） | 在 tool descriptor 中嵌入恶意提示词指令或欺骗性声明 |
| 恶意篡改（Rug pull） | 针对先前已获审批的 descriptor 进行未授权的静默修改 |
| 名字遮蔽（Tool shadowing） | 由未加限定的重复 tool name 导致的路由歧义与覆盖 |
| 头部不匹配（Header mismatch） | 路由 header 与 JSON-RPC body 内容冲突，触发错误 `-32020` |
| 哈希锁定（Hash pin） | 对经审核批准的完整规范化 descriptor 计算所得的 SHA-256 digest |
| MRTR | 多往返请求模式（Multi Round-Trip Requests），用于 server 主动请求输入并由 client 无状态重试 |
| `requestState` | 往返传递的不透明状态值，必须作为不可信输入进行完整性保护与校验 |
| Capability 声明 | 仅表示协议特性的兼容性声明，绝不代表授权与访问许可 |
| 隐式表单支持 | 空的 `elicitation` capability 对象 `{}`，等同于显式声明支持表单 |
| 完全限定名（Qualified tool name） | 网关层稳定的命名，如 `notes.search`，防止命名冲突 |

## 延伸阅读

- [MCP 安全与信任指南（Security and Trust Guidance）](https://modelcontextprotocol.io/specification/2026-07-28#security-and-trust--safety)
- [多往返请求（Multi Round-Trip Requests）规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [Streamable HTTP 传输协议](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [已废弃特性（Deprecated Features）清单](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
