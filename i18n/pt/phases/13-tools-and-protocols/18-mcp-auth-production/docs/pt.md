# MCP 认证与识别权在生产环境中: mecanismo de registo e tokens dos emitentes de dados

> 第 16 课构建 OAuth 2.1 状态机――本课针对 MCP 2026-07-28 规范加固其生产环境边界:首选客户端 ID 元数据文档(CIMD),仅将废弃的动态客户端注册作为兼容方案,严格校验授权响应中的发发放者,根据签发者物理隔离客户端凭证,实现 JWKS 定时轮查询刷新,并精确每个无状态请求上受众绑定(Audience-Pinned Tokens) ⇒
>
> **规范说明（2026-07-28）：**动态客户端注册(DCR) foi oficialmente abandonado,首选客户端 ID 元数据文档(CIMD) ・DCR 仅作为后后兼容机制保留──当不得不使用DCR 时,客户端必须声明正确的`application_type` O cliente deve verificar a existência da RFC 9207 `iss`参数值,绝不能跨不同授权服务器签发者复用凭证──

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 16 (OAuth 2.1 state machine), Phase 13 · 17 (gateways)
**Time:** ~90 minutes

## Objectivo de aprendizagem

- 通过 RFC 8414 元数据发现授权服务器并严格核验技术契约──
- 通过客户端 ID 元数据文档(CIMD) completar o registro do cliente,并将废弃的 DCR 隔离为回归方案──
- 校验 RFC 9207 `iss`,将客户端注册凭据根据授权服务器签发者(Emitente) isolação de índice,并将资源绑定 Token 按签发者和资源双重索引存储──
-  De acordo com o cronograma de armazenamento e atualização do JWKS 密钥集, assegure a transição do processo de assinatura durante a rotatividade da chave.
- Utilizando RFC 8707  recurso indicador vai Token 强绑定到单一 MCP 资源,坚决拒绝混代理 (Confused-Deputy) 与跨资源复用──
- 理性权衡 JWT 本地验证与Token Introspection,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效性,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时效率,界定撤销时时效率, 界定率, 界定率降级等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等等
-  Descrever completamente as responsabilidades dos servidores de autorização, dos servidores de recursos e dos clientes, deixando as partes apenas responsáveis pelos controlos de segurança dentro das suas próprias fronteiras.
- O Serviço de Controlo de Produção (CPC) aprova o sistema de controlo de contas, decididamente rejeitando o modelo de registro ou o Token 跨域复用.

## 问题

Seção 16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

Primeiro, é**客户端注册与凭据隔离** Empresas reais podem operar em centenas de servidores MCP e milhares de clientes MCP.**客户端 ID 元数据文档（CIMD）**O cliente usa URL HTTPS controlada por ele próprio 带有路径 作为其客户端标识符, o servidor autorizado em tempo de necessidade, activamente retira esses dados. RFC 7591 动态客户端注册 (DCR) apenas como um caminho de compatibilidade para trás abandonado.`application_type` O cliente vai registrar o título de usuário em seu reservatório, e o token de acesso será registrado em seu reservatório.`(issuer, resource)`O emissão de um código de código deve ser re-registratado, enquanto o acesso a diferentes recursos deve ser feito com um Token de destinatário univocamente ligado.

O segundo canal é:**密钥轮换（Key Rotation）**O servidor de autorização irá rotar essas chaves de assinatura regularmente, geralmente por hora, durante a resposta a eventos de segurança, até mesmo mais rápido. Um servidor MCP de JWKS só tira uma vez ao início, na primeira rotação de chave, antes de funcionar normalmente, e todos os pedidos posteriores serão informados de falha do teste até que o serviço seja reiniciado.

O terceiro canal é:**受众绑定（Audience Binding）**O artigo 16o introduziu o indicador de recursos RFC 8707.`token.aud`Comparado com o próprio URL de recursos regulamentados, não corresponde, retornar imediatamente ao HTTP 401── é a única linha de defesa de um servidor MCP (ou de um servidor específico) em relação ao mesmo servidor.

Esta aula irá mapear estes três grandes processos em um conjunto de componentes de projeto específicos: arquivo de dados baseado em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados em dados

## 适用范围:第 16 课后的生产落地强制规范 适用范围: 适用范围: 课后的生产落地强制规范 适用范围: 适用范围: 课后的生产落地强制规范 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围: 适用范围:

[第 16 课：基于 OAuth 2.1 的 MCP 安全](../../16-mcp-security-oauth-2-1/docs/en.md)O curso abrange o estado de código autorizado, o PKCE, o recurso protegido, o indicador de recursos e o mecanismo de decisão. Este curso não redefine um segundo conjunto de processos de autorização. Esta aula explora como os servidores de recursos já disponíveis continuam a implementar essas normas de segurança no cenário real de operações.

A produção de produtos e serviços de transporte e de transporte de mercadorias

- JWT 路径在每个请求上验证定发发发件者、算法、验签公钥、受众、时间 Claims and Scope,同时安全更新 JWKS──
- Não transparente Token 路径调用签发者经认证的Introspection 端点,校验回归的活态,受众或资源,过期时间,主体以及 Scope──
-  estratégia de revogação: a determinação do valor do certificado deve ser totalmente inadequada durante um longo período de tempo, bem como quais são as camadas de reserva que podem ser retardadas na inadequação;
-  estratégias de definio definido em serviços de descoberta, JWKS, introspecção ou retirada de infraestrutura indispensável quando o sistema de determinação
- 审计证据记录驱动决策的发发言人元数据、公钥集或内视察 响应、Token Claims、策略版本以及拒绝原因,且绝不保存 Token 明文──

Esta divisão de responsabilidades mantém a boa relação entre os módulos do curso. 16a Conectividade do processo de verificação do curso. 18a Prova de que o Token pode permanecer acreditável durante o longo prazo ou ser firmemente interceptado em tempos anormais.

## 概念

### RFC 8414  OAuth 授权服务器元数据

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `/.well-known/oauth-authorization-server`O arquivo descreve todas as informações necessárias para o cliente:

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "client_id_metadata_document_supported": true,
  "registration_endpoint": "https://auth.example.com/register",
  "authorization_response_iss_parameter_supported": true,
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "scopes_supported": ["mcp:tools.read", "mcp:tools.invoke"],
  "token_endpoint_auth_methods_supported": ["none", "private_key_jwt"]
}
```

客户端在获取MCP资源URL 后进行链式发现:先通过RFC 9728 的 `oauth-protected-resource`(资源服务器文档) 获知所信任的发发发件者,随后通过RFC 8414 (本规范文档) 获取该发发发件者的各服务端点──客户端永远不要硬编码授权端点 URL──

Para o identificador de recursos que contém o caminho, insira um conhecido 字段── por exemplo,`https://mcp.example.com/team/server`Resolução de um documento de informação sobre o tratamento de dados`https://mcp.example.com/.well-known/oauth-protected-resource/team/server`Não quero.`/.well-known/...`错误地追加在资源路径后──

Em confiança em um fornecedor de identidade (IDP) para contratos de MCP:

- `code_challenge_methods_supported`mustincluir `S256`(conforme à RFC 7636 要求 PKCE)**缺失**, , indicou que o serviço de autorização não suporta PKCE, cliente**必须**Recusou continuar a executar.
- `grant_types_supported`包含 `authorization_code`, resolutamente rejeitar .`password`和 `implicit`- Não.
- Pelo menos apoiar um modo de inscrição:`client_id_metadata_document_supported: true`(CIMD,首选) 、 credenciais de cliente pré-configurados, ou `registration_endpoint`(RFC 7591 兼容模式 já abandonado)
- - Não .`authorization_response_iss_parameter_supported`Para verdade, o cliente exige que o autor responda ao RFC 9207 `iss`,并严格将其与重定向前记录发发发人相对.
- Em OAuth 2.1 规范下,`response_types_supported`必須精确為 `["code"]`- Não.

若缺少 `S256`支持,MCP server 坚决拒绝连接该 IdPPKCE 没有降级模式――若既未声明任何注册模式,又没有预配置的 `client_id`, também não pode concluir a ligação; agora deve-se modificar a configuração de instalação, em vez de modificar o código.

### RFC 9728 ((回顾)  受保护资源元数据

No capítulo 16 , foi apresentado o RFC 9728 .**当前**MCP servidor Sofiência de Autoridade de servidor conjunto de única fonte de autoridade. Um único servidor MCP pode simultaneamente confiar em vários IdPs (como um para funcionários internos, outro para parceiros externos).

```json
{
  "resource": "https://notes.example.com",
  "authorization_servers": ["https://auth.example.com", "https://partners.example.com"],
  "scopes_supported": ["mcp:tools.invoke"],
  "bearer_methods_supported": ["header"],
  "resource_documentation": "https://notes.example.com/docs"
}
```

### 客户端 ID 元数据文档(推默认方案)

CIMD vai registrar o cliente a partir do tradicional 推(Push) 模式反转为拉(Pull) 模式── o cliente não vai mais a um servidor autorizado `client_id`Em vez disso , ele vai controlar diretamente um URL HTTPS que ele próprio pode .**作为**O que é ?`client_id` Esta URL indica um JSON 元データ文档; autorizar o servidor em OAuth 流程 pressão necessária para sequenciar esta documentação.`app.example.com`O domínio, então, é o que depende da confiança.`https://app.example.com/client.json`O mecanismo eliminou o registo de transações, evitando a`client_id`命名空间耗尽风险, também省去了跨服务器同步状态的复杂性──

A estrutura de arquivos de dados do cliente é a seguinte:

```json
{
  "client_id": "https://app.example.com/oauth/client.json",
  "client_name": "Example MCP Client",
  "client_uri": "https://app.example.com",
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback", "http://localhost:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

文档内部的 `client_id`字段值**必须**O servidor autorizado irá ser rigorosamente comparado ao administrador, se não for concordado, rejeitará diretamente.`client_id_metadata_document_supported: true`声明支持此特性──

Em termos de regras do CIMD,`client_id`- Não.`client_name`Com não-caído`redirect_uris`Número de dados necessários para preencher.`application_type`Mas não é um código obrigatório do CIMD.`application_type`de requisitos forçados para o uso de máquinas até a primeira seleção de CIMD 路径上.

规范明确指出的两大核心安全事实:

- **防范 SSRF：**授权服务器拉取是攻击者提供的URL,必须严密防范服务端请求伪造(严禁访问内部私有网络及管理端点) ⋅
- **防范 localhost 冒充：**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `localhost`重定向端口── portanto, o servidor de autorização em mostrar o usuário consentiu em autorização página,**必须**清晰展示重定向 URI 的主机名,并**应当**Para a pura`localhost`A posição de segurança é de 5 a 10 horas.

Como o CIMD não precisa de um registro permanente no serviço, não é necessário mais um registro como o DCR, que mantém um serviço complexo.

Se o administrador do servidor autorizado tiver distribuído previamente um identificador de cliente, deve priorizar o uso deste pré-registramento de um emissor específico, e então tentar registrar-se automaticamente.

### RFC 7591: Pathways de registro de compatibilidade abandonada

DCR em 2026-07-28 规范修订中已正式废弃――仅针对无法使用CIMD 且无法进行人工预注册的旧版授权服务器保留――兼容客户端发送如下注册请求:

```json
POST /register
Content-Type: application/json

{
  "application_type": "native",
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "scope": "mcp:tools.invoke",
  "client_name": "Cursor",
  "software_id": "com.cursor.cursor",
  "software_version": "0.42.0"
}
```

 serviços  serviços  serviços  serviços`client_id`E para posterior actualização da configuração de uso.`registration_access_token`- Não .

```json
{
  "client_id": "c_3e7f1a",
  "client_id_issued_at": 1769472000,
  "redirect_uris": ["http://127.0.0.1:7333/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "registration_access_token": "regt_b2...",
  "registration_client_uri": "https://auth.example.com/register/c_3e7f1a"
}
```

`application_type`具有严格约束力: utilizar o endereço de rede de rede de rede de rede deve ser declarado como `native`; baseado em serviços administrados por clientes de aplicações web devem declarar que`web`Não usar HTTPS 重定向 URI── para o público Native 客户端,`token_endpoint_auth_method: none`É a configuração padrão correta, agora só é distribuído para o cliente.`client_id`, a prova de propriedade depende totalmente da garantia da PKCE.

Três grandes armadilhas de defesa do produto:

- O endpoint de registro deve ser baseado em IPs de origem e ser rigorosamente limitado.`client_id`命名空间── deve ser executado no registro de processos de negócios.
-  certos requisitos de IDP de nível empresarial               `software_statement`(JWT já assinado para o cliente) ⋅ Este exemplo de curso irá省略; mas em produção deve aumentar a lógica de experiência, recusando a inscrição de não assinados fora do seu local de volta reorientação ⋅
- `registration_access_token`O token queque significa que o atacante pode  modificar a redirecionamento do URI do cliente

### RFC 8707 ((回顾) 资源指示符 ((Ressource Indicators)

Seção 16                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `resource=<canonical-mcp-url>`, e o servidor MCP deve ser verificado em cada momento em que é chamado .`token.aud`Com seu próprio recurso URL 精确匹配──规范化 URI é o servidor 标识符:采用小写协议名和主机名,不带URL片段(#fragment),通常不带末尾斜──根据规范,路径部分**不应**Foi desligado de forma apropriada para identificar um servidor MCP único.`https://mcp.example.com`- Não.`https://mcp.example.com/mcp`- Não.`https://mcp.example.com:8443`E também`https://mcp.example.com/server/mcp`São URI regulamentados por lei. Para cada servidor, escolha um URI regulamentado.`aud`Compreendente total fixação.`https://notes.example.com`; na produção de vários servidores MCP em co-administradores de um mesmo domínio, deve ser definido de acordo com o caminho.

### RFC 7636 ((回顾)  PKCE

PKCE em OAuth 2.1 tornou-se uma norma obrigatória.`code_challenge`和 `code_verifier` Serviço de serviço firmemente rejeitar qualquer não-verificador ou verificador de hash value e pré-reserva desafio 不符的 Token 请求。

### MCP 2026-07-28 授权 Profile 规范

Ao mesmo tempo que a MCP 规范在确立OAuth 资源服务器安全边界, MCP 传输层将全面转向无状态化――没有任何可缓存主体身份决策的协议会议――因此, a capa autorizada deve verificar independentemente cada pedido:

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `WWW-Authenticate: Bearer resource_metadata="..."`- Não, não.**或者**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `/.well-known/oauth-protected-resource`访问(SEP-985 将该应应头设为可选,并以知名端点作为底)`authorization_servers`字段**必须**列出至少一个信任的授权服务器──
- Em**每一个**Solicitação de aprovação`Authorization: Bearer ...`Receber Token Não pode ser colocado em URL question parameter, também não pode ser apenas em um encontro de criação 
- 逐请求校验 `aud`- Não.`iss`- Não.`exp`E os Escópios necessários.**必须**验证 Token is specially for its own issuance (toko é especificamente para sua própria emissão) `aud`O facto de a Comissão não ter sido autorizada a fazer qualquer acção de apoio à Comissão, não pode ser negado.
- Em volta 401/403                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `error=...`- Não.`resource_metadata="<PRM-URL>"`(URL completa de dados do arquivo, em vez de URL de recursos nu) e no 403  Portátil quando falta de direitos`scope="..."`de `WWW-Authenticate: Bearer`头──注意:该质问参数名为 `resource_metadata`, pertencem a indicação de descoberta, não existe o chamado`resource`- É o que é?
- 授权服务器服务发现同时兼容RFC 8414 OAuth 元数据与OpenID Connect Discovery 1.0; cliente deve tentar estes dois conhecidos ──
- 客户端(而非服务端) responsável pela defesa**混淆攻击（Mix-Up Attacks）**:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `issuer`, e usar o código de autorização para trocar Token  antes, rigoroso`iss`参数值──单纯依赖 PKCE 无法防守 Mix-Up 攻击,因为客户端会盲地将 `code_verifier`提交给被恶意引导的目标标志 端点──
- 客户端注册凭证归属于单个授权服务器发发发件者.`client_id`、 Token de registro ou Token de acesso
- O CIMD é o primeiro mecanismo de registo de clientes.`application_type`- Não.

OAuth 2.1 草案是底层基石;RFC 8414/7591/8707/9728/9207 + RFC 7636 + CIMD 构构成交互表面;MCP 规范则是集大成的 Profile──

### Capacidade de produção

Os dados de usuários são divulgados em uma rede de dados de usuários.

| 核对项目 | 强制要求 |
|---|---|
| 发现的 Issuer | 必须与策略预期的 HTTPS Issuer 字符串精确匹配 |
| PKCE 支持 | 明确声明支持 `S256`；否则坚决终止接入 |
| 注册机制 | 首选 CIMD，接受预注册，仅将 DCR 作为废弃兼容路径 |
| 授权响应 | 出现或声明支持时，必须校验 RFC 9207 `iss` 参数 |
| 资源绑定 | Token 请求携带 `resource`；资源服务器强制校验匹配的 `aud` |
| 凭据存储 | 客户端 ID 与注册凭据以 Issuer 为键；Access Token 以 Issuer + Resource 双重索引 |
| DCR 兼容规范 | 必须声明 `native` 或 `web`；坚决拒绝不符合声明类型的重定向 URI |

Não deduzir a sua capacidade de apoio técnico do produto a partir do nome ou nível de preço.

### JWKS 刷新模式(AS 负责 Rotate,资源服务器负责 Refresh)

É preciso distinguir rigorosamente dois motos, que são muito fáceis de serem misturados na produção.

- **轮换（Rotate）：**Sim, sim.**授权服务器（AS）**O recurso servido não tem direito de participar nem pode executar esta operação.
- **刷新（Refresh）：**Sim, sim.**资源服务器**Atividade: através do HTTP GET 重新拉取公开发布的JWKS并更新其本地缓存── é o único recurso que o servidor precisa executar a operação JWKS──

O modelo de falência mais típico no ambiente de produção é:**缓存过期失效** A solução é a adopção**定时刷新任务 + 键值缓存** O servidor de recursos executa uma tarefa de regulação (Cron、定时器或运行时调度机), em intervalos de tempo fixos.`<issuer>/.well-known/jwks.json`Não cobrir`cache[issuer] = {keys, fetched_at}`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △      △ △                                                                                                                             `kid`Em contínuo, não está previsto.**单次**Simultaneamente, o processo resolve duas grandes situações: o período de actualização permanente e, antes da próxima, a utilização de todas as novas chaves emitidas.

O regresso ao funcionamento**必须是重新拉取（Re-fetch），绝对不能是轮换（Rotate）**◊ Se o cache não estiver destinado a ser ligado erroneamente para 轮换并发发, causará duas grandes falhas:`kid`* ainda * não pode corresponder com o token emitido, a verificação ainda é falha;`kid`O token, vai obrigar o sistema a gerar novas chaves sem limites, causando uma auto-recusão de serviço de catástrofe.`kid`O máximo que pode ser feito é uma vez sem danos e sem efeitos.

缓存结构:

```json
{
  "https://auth.example.com": {
    "keys": [
      {"kid": "k_2026_03", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"},
      {"kid": "k_2026_04", "kty": "RSA", "n": "...", "e": "AQAB", "alg": "RS256", "use": "sig"}
    ],
    "fetched_at": 1772668800
  }
}
```

稳定运行状态下通常同时存在两个密钥.`k_2026_03`(Brasil)`k_2026_04`), para garantir que o Token em seu período natural de transição ainda seja válido.`kid`- Para fazer o caminho.

### 统一的 Token 验证例程

MCP servidor em execução de qualquer ferramenta  antes de ter que unificar a execução de verificação.`code/main.py`O padrão de utilização do meio é o seguinte:

```python
result = server.validate(bearer_token, required_scope="mcp:tools.invoke")
if not result["valid"]:
    return {"status": result["status"], "WWW-Authenticate": result["www_authenticate"]}
```

`validate`函数负责解码 JWT, de JWKS 缓存中解析签名公钥(未命中时触发单次回退刷新),校验数字签名,然后依次检查 `iss`Está em lista de pessoas`aud`Se é de acordo com a regulamentação do servidor,`exp`Se o prazo de execução for expirado, bem como se possui o escopo necessário, se qualquer inspecção falhar, retorne imediatamente com um erro específico.`WWW-Authenticate`质询头―― será todo o processo de inspecção envelopeado para o servidor de recursos, capaz de garantir que cada entrada de tráfego, independentemente de qualquer ferramenta, seja feita, seja feita através de um bloqueio de segurança totalmente uniforme, eliminando qualquer falha de logística de negócios que possa ser obtida diretamente.

### Não transparente Token  Adoptação de Introspecção, e não suposição cego

Não são todos os Tokens de Acesso são JWT. Se o documento do emitente indicar que o submetido é um Token opaco, o servidor de recursos não pode resolver as suas reivindicações de confiança.`active: true`、 correspondentes ao emitente previsto 、 precisamente correspondentes MCPs destinatários ou recursos 、 reivindicações de tempo de efeito não ultrapassado bem como ferramentas concretas atuais Os objetivos necessários 、

Para o resultado da introspecção, o processo de armazenamento local, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados e o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados e o processo de armazenamento de dados, o processo de armazenamento de dados, o processo de armazenamento de dados e o processo de armazenamento de dados, o processo de armazenamento de dados e o processo de armazenamento de dados, o processo de armazenamento de dados e o processo de armazenamento de dados.**绝不能**Colocar o Token original 明文 como um tag de日志 ou uma chave de cache. O TTL será válido para o fim do tempo de cache. A linha de cache é a mesma, o resultado da verificação de um recurso é absolutamente igual.

勿让攻击者通过伪造 Token 内容来诱导服务切换验证模式――必须根据经验验的发发件者元数据和系统配置,预先确定采用 JWT 本地签或网络内视察――在 JWT 路径上,强制锁定允许接受的算法和可信的`jwks_uri`; absolutamente não obedece a Token 头部中声明的密钥URL或加密算法──

### 撤销是一种时效性契约 (Contrato de Frescência)

RFC 7009 permite que o cliente solicite o autorizar o servidor a retirar um Token. Mas esse pedido de retirada não será automaticamente eliminado já existente em cada servidor de recursos distribuídos.

A estrutura de Token não transparente pode ser usada através de uma alta presença de introspeção ou de uma configuração muito curta de cache válido para alcançar uma retirada rigorosa em tempo real. A estrutura de JWT que se autoconhece geralmente é usada como um conjunto de medidas: reduzir o ciclo de vida válido do Token de Acesso. Realizar o Refresh Token no lado IdP. Retirada. Revocar a chave pública de assinatura em eventos de segurança global, auxiliar no mecanismo de bloqueio de emergência de um nome negro local de um token.

Os dados de usuários são de um tipo de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de código de

### O Ministério do Exterior depende de deficiências necessárias para uma declaração clara estratégia de decisão

Não se deve, em especial, tentar capturar blocos de código em campo para desenvolver estratégias de utilização.

| 故障场景 | 生产环境安全应对策略 |
|---|---|
| 定时 JWKS 刷新失败，已知 `kid` 仍在尚未过期的受限缓存中 | 仅在声明的故障容忍窗口内允许降级继续运行，并向外暴露系统健康度降级告警证据 |
| Token 携带未知 `kid` 且仅有的一次重试刷新拉取失败 | 坚决拒绝；绝不接受无法完成密码学验签的 Token |
| Introspection 内部端点不可用 | 针对受保护调用严格执行故障闭合（Fail-closed）；绝不把网络超时转化为 `active: true` |
| 受保护资源或签发者元数据发生非预期突变 | 立即停止接受新注册与新 Token 申请；在受限应急策略下仅维系明确锁定的有效配置 |
| 撤销端点不可用 | 将登出或撤销标记为“未完成”，尽可能在本地将该凭据置为不可用，绝不对外谎称全局撤销成功 |
| 系统时钟源异常或 Claim 时间格式无效 | 坚决拒绝；严禁通过扩大时钟容忍偏差（Clock Skew）来强行放行 Token |

O recurso à infraestrutura deve ser separado de falhas e de certificados em si mesmos. Dependendo de falhas de sistemas de nível de operação, é necessário combinar o mecanismo de controle de saúde e reexame; e a assinatura ineficaz, o emissor não correspondente, o destinatário não conforme, a ultrapassagem de tempo ou a falta de autorização pertencem a um direito de identificação de certeza.

### 受众重放攻击全流程演练(Restrutura de Privilegio de Acesso-Token)

假设 Servidor A`notes.example.com`)`tasks.example.com`O servidor A foi forçado a roubar o token de notas de um usuário e tentou colocá-lo novamente no servidor B para a interfaz de missão de uso.

O servidor B é o seguinte:

1. 解码 JWT, segundo `kid`检索 JWKS,验证数字签名──(通过)
2. 核对  nuclear`iss`Se encontra-se em declaração de dados de recursos protegidos`authorization_servers`列表中──(通過 pertence ao mesmo IDP)
3. 校验 `aud == "https://tasks.example.com"`。(**失败**Token 中真实的 `aud`Por`https://notes.example.com`)
4.  Retorno HTTP 401 响应,并携带 `WWW-Authenticate: Bearer error="invalid_token", error_description="audience mismatch", resource_metadata="https://tasks.example.com/.well-known/oauth-protected-resource"`- Não.

A nível de acordo, a alegação do público é a única barreira para a defesa deste tipo de ataques contra o Vietname.**每一个独立请求**Na norma, o mecanismo é chamado de "conhecimento de uma situação".**访问令牌特权限制（Access-Token Privilege Restriction）**: servidor MCP **必须**Resolve rejeitar qualquer Token de identidade não definida entre os espectadores.

> **命名辨析：**规范将**混淆代理（Confused Deputy）**especialmente para indicar outro tipo de falhas relacionadas mas diferentes:**代理（Proxy）**, usando o ID do cliente em estado de estado integral, em caso de não obter o consentimento do usuário autorizado de um determinado terminal, o token é enviado de forma cego.**并且**严禁将进入站收到的原始代币 直接透传给上游 API(MCP servidor **必须**独立申请专门发发往上游 API 的全新独立 Token)

### Mista-up 混 ataque (serviço não pode pagar defesa do cliente)

客户端在其生命周期内通常需要与多种不同的授权服务器交交交――恶意 AS可能诱导客户端将诚实合法 AS 发发发的授权码,获取攻击者控制的 Token端点去换――受众绑定对此无能为力因为在换授权码的阶段,甚至都还没有发发任何 Token――防御机制必须完全由客户端侧实施:RFC 9207):

1. 客户端在发起重定向授权前, de acordo com o histórico de dados de AS previo de `issuer`- Não.
2.  Após receber a resposta autorizada, o cliente vai enviar o código autorizado para qualquer ponto da rede, primeiro entre eles `iss`参数与此前记录的发发发人进行纯字符串精确比对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对对
3. Se não coincidir ou em AS  declarações de apoio `authorization_response_iss_parameter_supported`Em caso de resposta em falta`iss`)→  imediatamente rejeitado, e  absolutamente não mostrando a resposta entre os construídos pelo atacante `error`报错信息――

单纯依赖 PKCE 无法防备                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   `code_verifier`o man submetido ao objetivo de destino induzido por mal-intenção. o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o o `state`Uma das razões do registro.

### 常见故障模式 (Modos de falha)

- **陈旧过期的 JWKS：**Em AS 轮换密钥后,验签器误将合法Token 拦截――解决方案是上述的定时刷新任务 + 未命中回退拉取模式――切勿在没有刷新机制的前提下死板缓存 JWKS――
- **回退机制误搞成密钥轮换：**Caso o cache não seja um erro de regresso de destino, é um erro lógico muito grave: não é apenas o que nunca pode ser encontrado em um pedido.`kid`Também deixaria os atacantes usarem falsos .`kid`Implementar o código de segurança explosivamente DoS ataque.
- **缺失 `aud` Claim：**Algumas idp 默认会省略 `aud`, a menos que o cliente em Token solicitação expressamente fornecido `resource` O teste de assinatura deve ser decidido a rejeitar a falta`aud`De um token, absolutamente não pode ser visto como um sinal de perdão.
- **遗漏 `iss` 校验导致的 Mix-Up 攻击：**客户端若未校验 RFC 9207 授权响应中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `iss`参数,可能会被诱惑将诚实AS的授权码提交给黑客控制的代码端点―― é uma falha típica do cliente, o servidor de recursos não pode ser substituído por reparar.
- **Scope 提升并发竞争：**O processo de desenvolvimento de dois recursos de um usuário pode ser bem sucedido, gerando dois Tokens de Acesso com diferentes Propósitos. O testador deve fazer uma avaliação com base nos Tokens específicos da solicitação em curso.
- **注册 Token 泄露：**- Falta de informação .`registration_access_token`O usuário deve ser forçado a exibir o código-fonte em cada atualização; uma vez que a suspeita for divulgada, a transferência imediata.
- **未固定 `iss` 白名单：**验签器若盲目 aceitar qualquer coisa `iss`, o atacante pode construir um servidor de autorização de vícios, dirigido ao público-alvo em questão em enviar vícios Token── protegidos recursos de dados `authorization_servers`A lista é de lista branca, deve ser decidida a executar o teste de correspondência.
- **凭据或 Token 缓存键混淆：**客户端如果只依据资源对注册证书建立索引,可能会向另一个服务器表达授权服务器发送的证书――客户端如果只依据发放者对Access Token建立索引,则可能将Token 错误重重置在错误的受众资源上――必需经验证后发放者索引注册证书,按`(issuer, resource)`复合索引 Token de acesso, e assim que o emitente mudar deve ser re-registrado.

```figure
t3-jwks-rotate
```

## Use-o

`code/main.py`Usando Python standards library realizou uma produção completa de certificação de autor de fluxo de água, abrangendo três principais papéis:`AuthorizationServer`- Não.`ResourceServer`Com`Client` Execução:

Em code warehouse root directory

```bash
cd phases/13-tools-and-protocols/18-mcp-auth-production
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

A primeira ordem emitirá o registro do emitente e o controle completo do Token 验证轨迹日志. A segunda ordem executará todos os 18 testes de unidades.

1. 授权服务器在 `/.well-known/oauth-authorization-server`發布 RFC 8414 元数据──
2. MCP 客户端调用该端点,审查其注册模式(`client_id_metadata_document_supported`À CIMD,`registration_endpoint`(DCR) e (DCR)`S256`Caso de apoio da PKCE:
3. 客户端优先核对预配置注册,否则使用其托管在HTTPS上客户端ID 元数据文档完成注册──废弃的DCR保留为独立兼容性测试分支──
4. 客户端记录经验的签发者, geração S256 Challenge, receção de código de autorização única e `iss`, nuclear contro return of issuers,并 carry original verifier com a RFC 8707 `resource`Indicador para a ponta de mudança de Token.
5. MCP 客户端携带 `Authorization: Bearer ...`调用 MCP servidor 上的工具──
6. MCP servidor 触发 `validate`Por exemplo, a partir de JWKS 缓存解析出对应的公钥完成验签──
7. IdP 模拟轮换公钥;定时刷新任务自动拉取最新JWKS 并更新缓存──
8. A próxima vez que o usuário reinicie o serviço, ele irá concluir automaticamente a verificação da nova chave pública, e o valor do token antigo permanecerá válido durante o período da janela de reabastecimento.
9. 模拟向另一台MCP 资源发起受众重放攻击,精准触发 HTTP 401 报错,返回 `audience mismatch`E a orientação para a redescoberta.`resource_metadata`- Não.

O JWT em exemplo para poder funcionar em Python standards library sem dependência de terceiros, adotou o algoritmo HS256 com chave compartilhada.`refresh_jwks`直接读取授权服务器内存密钥列表; em ambiente on-line é apenas um enviado `jwks_uri`O padrão HTTP GET

## Entrega-o

本课交付 `outputs/skill-mcp-auth.md` Fornecer um servidor MCP  configurar com IdP  capacidade lista, esta habilidade pode automaticamente ser transferido todo o conjunto de certificados de proteção do local de nascimento  incluindo os recursos protegidos dados  rotas de acesso de registro para uso seletivo  CIMD  Pre-registro ou DCR  base)  JWKS                                                                                                                                                                                                                                                                                                                                                                                                                                        

## 课后深练习

1. 运行 `code/main.py`──仔细追踪执行流──观察 IdP 在步骤 6 中轮换密钥,定时 `refresh_jwks`重新拉取已发布的公钥集合,验证旧代币(重叠窗口期内) com o novo签发的代币 如何均在未重启服务的情况下顺利验证通过──
2. Em recursos protegidos`authorization_servers`Em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em seguida, em: em: em: em:`WWW-Authenticate: Bearer error="invalid_token", error_description="iss not allowed"`- Não.
3. Por`register_client`增加速率限制检查,在注册机真正处理请求前执行拦截──在内存中使用按来源IP 为键的字典实现一个轻量级的代币桶 限流器──
4. 研读 RFC 7591 规范,指出示例代码中 `/register`处理器未校验的两个协议字段,并补全校验逻辑──(提示:`software_statement`Com`redirect_uris`O URI Scheme 协议检查)
5. 接入第二台授权服务器──验证客户端能够根据发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发发`client_id`復用到第二台服务器上──
6. 动手复现并修复潜在DoS 漏洞: para test签器发送一个包含随机伪造 `kid`Do símbolo, confirmação`refresh_jwks`O número de chaves públicas do servidor autorizado não aumentará de forma extraordinária. Em seguida, devemos voltar de volta para a lógica para a geração de novas chaves, observar como a falsificação de tokens pode causar um aumento no número de chaves.
7. - Não .`native`Com`web`两类客户端测试已废弃 DCR 路径──验证带有HTTP重定向URI的Web 客户端,以及未使用精确回环重定向的Native 客户端会被系统准确拦截拒绝──

## 关键术语

| 术语 | 通俗说法 | 精确工程含义 |
|------|---------|-------------|
| ASM | "OAuth 元数据文档" | RFC 8414 规范的 `/.well-known/oauth-authorization-server` JSON 文档 |
| CIMD | "客户端元数据 URL" | 客户端 ID 元数据文档（Client ID Metadata Document）：将 HTTPS URL 直接作为 `client_id`，由 AS 主动拉取 JSON。MCP 2026-07-28 首选注册方式 |
| DCR | "自助客户端动态注册" | RFC 7591 规定的 `POST /register`；在当前 MCP 规范中已废弃，仅作兼容兜底 |
| JWKS | "用于 JWT 验签的公钥集合" | JSON Web Key Set，从 `jwks_uri` 拉取，内部按 `kid` 进行哈希索引 |
| Rotate vs Refresh | "更新公钥" | **Rotate（轮换）** = 授权服务器签发/作废签名密钥；**Refresh（刷新）** = 资源服务器重新拉取发布的公钥。资源服务器仅能执行 Refresh |
| 资源指示符（Resource indicator） | "受众参数" | RFC 8707 规定的 `resource` 参数，用于将 Token 强绑定到特定 server |
| `aud` Claim | "受众标识" | JWT 中的 Claim 字段，验签器将其与自身的规范化资源 URL 进行严格字符串比对 |
| 受众重放（Audience replay） | "Token 重放攻击" | 将为 Server A 签发的 Token 拿到 Server B 去尝试调用；由受众校验防御（规范术语：访问令牌特权限制） |
| 混淆代理（Confused deputy） | "代理 Token 滥用" | 拥有静态客户端 ID 的 MCP 代理服务在未获取逐客户端同意授权的情况下盲目转发 Token；与受众重放本质不同 |
| Mix-up 混淆攻击 | "Token 端点走错门" | 客户端被恶意诱导将诚实 AS 派发的授权码拿到攻击者控制的端点去兑换；由客户端依照 RFC 9207 `iss` 校验进行防御 |
| `iss` 白名单 | "受信任的授权服务器集合" | 在受保护资源元数据的 `authorization_servers` 字段中显式声明的受信任列表 |
| `resource_metadata` | "去哪里查找 PRM 文档" | 401/403 质询头 `WWW-Authenticate` 中的标准参数，指向 RFC 9728 元数据文档的获取 URL |
| 公共客户端（Public client） | "Native 或浏览器端客户端" | 无法安全保管 `client_secret` 的客户端类型；依赖 PKCE 机制实现所有权证明 |
| `WWW-Authenticate` | "401/403 响应头" | 携带 `Bearer error=...` 等指令指导客户端如何进行凭据补全与错误恢复的标准 HTTP 响应头 |

## 延伸阅读

- [MCP 授权规范（2026-07-28 修订版）](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization)- MCP 授权 Profil de atual autoridade
- [MCP 2026-07-28 更新日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)- abrangendo a CIMD, a avaliação dos emissores, a RDC, o abandono e as alterações fundamentais do isolamento dos credores
- [OAuth 客户端 ID 元数据文档规范草案（draft-ietf-oauth-client-id-metadata-document-00）](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-client-id-metadata-document-00) CIMD 核心标准
- [RFC 8414 — OAuth 2.0 授权服务器元数据](https://datatracker.ietf.org/doc/html/rfc8414) 服务发现技术契约
- [RFC 7591 — OAuth 2.0 动态客户端注册协议](https://datatracker.ietf.org/doc/html/rfc7591) DCR 规范(向后兼容路径)
- [RFC 7636 — 代码兑换证明密钥（PKCE）](https://datatracker.ietf.org/doc/html/rfc7636) Certificação de propriedade de um cliente público
- [RFC 8707 — OAuth 2.0 资源指示符](https://datatracker.ietf.org/doc/html/rfc8707) Mecanismo central de bloqueio de público
- [RFC 9728 — OAuth 2.0 受保护资源元数据](https://datatracker.ietf.org/doc/html/rfc9728) 资源服务器服务发现
- [RFC 9207 — OAuth 2.0 授权服务器签发者识别](https://datatracker.ietf.org/doc/html/rfc9207) Para a defesa de mistura  Ataques `iss`参数规范
- [RFC 7662: OAuth 2.0 Token 内省协议（Token Introspection）](https://datatracker.ietf.org/doc/html/rfc7662)
- [RFC 7009: OAuth 2.0 Token 撤销协议（Token Revocation）](https://datatracker.ietf.org/doc/html/rfc7009)
