# MCP 一致性工程: edição controle, evidência e transporte

> 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规;; 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规;; 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规;; 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规;; 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规;; 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规;; 服务端碰巧跑通就称一致合性现在存在原始线路上;; 版本边界间间间间间间间间间间间间间间代理时时,以及面临回滚的时刻;;

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 17 (gateways), Phase 13 · 30 (registry admission)
**Time:** ~100 minutes

## Objectivo de aprendizagem

- O MCP 协议规则将规范性的转化为黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金记录) 黄金记录) 黄金记录 (黄金记录) 黄金) 黄金记录
- Estar rigoroso`2026-07-28`行为与受约束的旧版回退 (o antigo sistema de regressão)
- 精确区分附加性未知字段与非法的未知 `resultType`- Não.
- A partir de agora, o JSON-RPC está sendo comparado com o SDK.
- Na fronteira real, a verificação da conformidade e integridade do HTTP 标标与请求体.
-  através de registros de interacção  de saúde e de credenciais de regresso  de construção  de publicação

## 核心问题

Seu cliente através do SDK conseguiu o seu sucesso .`tools/list`Não conseguiu a lista de ferramentas.

Mas isso deixa muitas questões-chave sem resposta:

- O documento de solicitação realmente traz dados do protocolo de separação moderno?
- `MCP-Protocol-Version`- Não.`Mcp-Method`和 `Mcp-Name`É totalmente em conformidade com a solicitação JSON-RPC?
- 响应报文在线路是否合法 `resultType`Ou foi o SDK que decidiu por si mesmo?
- 客户端能否无损保留未来前向附加字段?
- Quando recebemos o código de erro do protocolo moderno, será que haverá erros de redução do sistema de manuseio da versão anterior?
- O agente está completamente transmissão do código de estado HTTP da base de dados com JSON-RPC  errôneo?
- O procedimentador de notificação individual em causa emitiu uma comunicação de resposta?
- O que é que a empresa pode fazer para provar que uma versão é promovida ou executada?

O protocolar é um conjunto de invariações que podem ser observadas pelo público. Antes de pisar o verdadeiro fluxo no ambiente de produção, é necessário construir um conjunto de ferramentas de teste automático capazes de capturar essas invariações.

```figure
mcp-conformance-operations
```

## Desde a versão de "Versão Eras"

MCP `2026-07-28`规范采用了完全自包含的按请求元数据(per-request metadata)`params._meta.io.modelcontextprotocol/protocolVersion`和 `params._meta.io.modelcontextprotocol/clientCapabilities`                                                                                                                                                                                                                                                              `protocolVersion`Ou `clientCapabilities`裸键均属于格式变──当 HTTP 边界存在镜像路由标题时,其数值必须与 JSON-RPC 请求体严格一致──现代规范下所有成功响应结果都必须携带──`resultType`- Não.

E até agora.`2025-11-25`A versão antiga é adotada em uma primeira edição do primeiro ciclo da ligação.`resultType`O resultado da versão antiga só será explicado como completo após a consulta e seleção do cliente.

Não é preciso escrever um ensaio de dois formatos de forma simultânea.

| 分支 | 准入凭证 | 缺少 `resultType` 的处理 | 初始化握手 |
|---|---|---|---|
| 现代纪元（Modern） | 成功的 `server/discover` 或已识别的现代响应 | 判定为非法（Invalid） | 不再作为默认建立连接路径 |
| 旧版纪元（Legacy） | 现代探测无果后，目标命中白名单且返回合法的旧版 `initialize` 响应 | 解释为 complete | 该纪元所必需的强制步骤 |

Esta rigorosa separação impediu o erro de formato dos pontos modernos devido à facilidade do teste e às dificuldades de testes.

### 严格模式

严格模式 (Strict mode) Requisitos para o terminal devem demonstrar a existência de um acordo de comportamento.`server/discover`即可确立现代分支── Recebeu um erro já identificado moderno JSON-RPC 错误(如`-32020`- Não.`-32021`Ou `-32022`) também pode estabelecer a modernos departamentos que devem agora modificar o pedido ou encerrar o processo,**绝不能**降级回退到旧版协议──

### Retorno

O modo de regresso (Fallback mode) permite executar uma única exploração moderna com limitações de fronteira. Se for encontrada uma super-hora, resposta em vão, interrupção de ligação ou resposta incompreensível, estas pertencem a  sem conclusão. Não são concluídas, não podem provar diretamente que o terminal é o antigo.`initialize`结果及协商版本通过验证后,才能正式切换到旧版分支──

O regresso absolutamente não é igual a  uma vez que o jornal erro em tentar a versão antiga ── um erro moderno já identificado contém em si mesmo um erro de grande valor ── em seguida, oculta a redução de tais erros, mas apenas oculta a verdadeira falha de configuração, tais como a declaração de incompetência ou a incompatibilidade de versões de protocolo ──.

Este design pode prevenir os atacantes, falhas de rede ou demais agentes por deliberado abandonar a resposta moderna para o sistema de redução de forças.

Em cada registro de interação, deve ser claramente identificado o ano selecionado. Se se separar do ano seguinte, um segmento de falta parece legal numa rodada de teste, na outra rodada será considerado uma violação fatal.

## 构建交互记录语料库(Transcript Corpus)

Uma parte da regulamentação de registro de interação (Fixture) registra o texto real da real atravessamento da fronteira, e não apenas a adoção da camada SDK:

```json
{
  "name": "golden-modern-list",
  "era": "modern",
  "headers": {
    "MCP-Protocol-Version": "2026-07-28",
    "Mcp-Method": "tools/list"
  },
  "request": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  },
  "responseStatus": 200,
  "responseBody": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "resultType": "complete",
      "tools": []
    }
  }
}
```

测试语料库 deve manter duas grandes classes de registros:

### 黄金记录(Golden Transcripts)

 Recordes de ouro utilizados para provar que os comportamentos conformes foram corretamente aceitos:

-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- 携带必需字段的完整结果(`complete`);
- Quando os métodos precisam de mais comunicação.`input_required`结果;
-  só se permitem retornar os resultados da ampliação da capacidade de resposta após a declaração prévia;
- Em "Minifestamente Selecionado"`resultType`O resultado da versão anterior;
- Não retornar qualquer JSON-RPC 响应的通知 处理过程──

O registro do ouro deve ser preciso e rigoroso.

### 负面记录(Transcrições negativas)

负面记录用于证明违规行为被坚决拒绝:

- 标头与请求体不一致;
- A declaração de capacidade de falta de resposta para cada pedido;
- 协商版本 não é apoiada;
- 现代请求下缺失 `resultType`O artigo 2.o
- Desconhecido ou não comunicado.`resultType`O artigo 2.o
- 响应中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `jsonrpc`Não é por`2.0`, ou não coincide com o tipo de ID de devolução numérico ou JSON;
- Com o tempo contendo`result`和 `error`, ou ambas as alterações de resposta;
- 缺少整数 `code`Ou o que é?`message`O que é que é errado?
- O protocolo está em erro de mapeamento de código de estado HTTP;
- Para notificação  err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err
- 变的 JSON-RPC 信封格式;
- Interveniente para o acordo de erro ocorrido

Para cada caso negativo, é necessário afirmar que a sua rejeição é de uma precisão de fronteira com um erro de código estável.`-32020`No entanto, as informações que transmitem aos operadores são totalmente incompatíveis.

O teste de teste não correspondente deve ser forçado a dizer que o servidor realmente retornou HTTP 400, e que o ID de solicitação corresponde ao código de erro.`-32020`❖ Cada vez que um testeiro local observe`HeaderMismatch`Quando o teste é executado, o teste é executado, mas não pode ser selecionado como um sinal. Se o código de rejeição for rejeitado, mesmo que o teste seja errado, o teste também é um erro.

O MCP oficial é um valioso padrão externo e uma versão referente. Mas é necessário manter o seu próprio conjunto de registros de intercâmbio, pois o conjunto de testes públicos não pode abranger seus agentes específicos, SDKs específicos, linhas de acesso e distribuição de produção.

## 标标值必须与RPC 要求体匹配

No protocolo HTTP Streamable moderno, um agente intermediário pode usar o IPI para implementar um caminho ou executar uma estratégia de segurança. Mas o JSON-RPC sempre é a única fonte de verdade do protocolo.

▌Deve ser executado em conformidade com o seguinte rigor:

1. 解析并校验 JSON-RPC 信封及元数据字段的类型;
2. Por isso , não .`MCP-Protocol-Version`Com`params._meta.io.modelcontextprotocol/protocolVersion`O artigo 2.o
3. Por isso , não .`Mcp-Method`Com`method`O artigo 2.o
4. Quando este método tem um nome de rota específico, em comparação com `Mcp-Name`Com relação ao seu pedido;
5. Após a conclusão da concordança total, deve-se determinar se a versão do protocolo e o conjunto de capacidades correspondentes são suportados.

Esta sequência anterior vai marcar um erro de não-conformidade .`-32020`Com acordo versão não suporta erro `-32022`清晰区分开来──它也可以从根本上防止网关校验并批准标题中的安全工具,而源站实际执行请求体中恶意工具的欺骗攻击──

HTTP 字段名不区分大小写,但其字段值严格区分大小写.`Mcp-Name`, deve-se primeiro precisar de recuperá-lo`=?base64?{Base64EncodedValue}?=`UTF-8 哨兵编码,再与请求体比对──未完成哨兵、无效 Base64、非法 UTF-8 或未编码的不安全字符,一律以`-32020`拒绝──未编码的原始首尾空白即便是与请求体字符完全相同的也属于非法,因为 as normas de transmissão exigem que esse tipo de valor seja adquirido antes da transmissão.

O agente intermediário pode rejeitar diretamente o HTTP                                                                                                                                                                                                                                                          

## O resultado não é igual ao resultado não conhecido

A realização de um desenvolvimento de sistemas de gestão de dados e de dados deve ser feita através de duas regras distintas:

### 附加未知字段

结果对象(Objetos de resultado)`_meta`O testador deve, de acordo com sua posição de responsabilidade, escolher sem perda de transferência, reter ou ignorar essas passagens adicionais, a menos que esse passagem seja diretamente contrário ao contrato de reter as palavras-chave.`futureHint`De um ponto de vista adicional.

Se você é um agente transparente, manter um segmento desconhecido geralmente é mais seguro do que o cego; se você é um cliente de aplicação terminal, ignorá-lo é legal. Mas, de qualquer forma, os conjuntos de teste de diferença devem revelar que o SDK foi ou não abandonado no período de antisserificação, garantindo que esse comportamento é uma decisão de engenharia ponderada, e não uma omissão acidental.

### Não sei.`resultType`

`resultType`属于核心生命周期判别器 ()                                                                                                                                                                                                                                                          `complete`Com`input_required` O acordo de ampliação só pode ser previamente declarado e, após a negociação, só ser permitido a introdução de novos valores.`task`)。

Para o determinador de resultados de declarações não conhecidas ou não declaradas, não pode ser automaticamente apresentado como resultado.`complete`O cliente não consegue compreender o que é o estado de ciclo de vida que ele está a deixar de lado.

Em um relatório original, o relatório pode, ao mesmo tempo, incluir o segmento de expansão ilegal ilegal e o tipo de resultado ilegal fatal.

O dispositivo de determinação é apenas a primeira porta da experiência, depois também deve ser verificado de acordo com o método específico.`tools/list`Os resultados completos devem incluir`tools`Numero, e seu descriptor possuem um único nome não vazio, uma descrição clara e um ponto de raiz do objeto.`inputSchema`O artigo 2.o`task`Resultados apenas em possuir tarefas  capacidade de legitimidade `tools/call`中有效,且强制要求包含 `taskId`、 já conhecido estado 、 criação e atualização 、`ttlMs`E também a interrogação legal;`completion/complete`O resultado completo deve conter não mais de 100 caracteres.`completion`Objectivos e números não negativos selecionáveis`total`E valor seletivo`hasMore`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`resultType`Não pode ser concedida isenção para cargas de forma residual.

## Número de variações de notificação

JSON-RPC Notificação 消息没有 `id`❖ Receber**绝不能**Para enviar qualquer sucesso ou erro de JSON-RPC 响应报文。

 Para o HTTP de notificação de sucesso de recepção, test suites esperado de serviço de volta a um HTTP com um requisito em branco `202 Accepted` MCP `2026-07-28`规范并未在 Streamable HTTP 上定义核心的客户端到服务端通知──本课例只使用一个带有命名空间的课程扩展通知,专门用于验证传输层序列化器是否满足绝不回复任何JSON-RPC 报文的不变量──请勿误认为它是新的核心协议方法──

测试时必须覆盖最外层的序列化器,而不能仅仅测试处理函数本身──因为 é muito provável que a função de processamento retorne internamente `None`Mas os componentes do interior são automaticamente envasados.`{result: null}`O JSON é um sucesso.

## Introdução de KDD 差异对比 (Deférencial de KDD)

Os diferentes tipos de SDK normalmente transformam o pacote de objetos de linha de nível inferior em tipos de dados fáceis incorporados em linguagens altas. Isso aumenta a experiência de desenvolvimento, mas também leva à normalização de objetos que não podem retornar o que realmente recebeu para as linhas de rede.

 para cada caso de teste de risco, deve capturar simultaneamente quatro níveis de visão:

1. SDK 解码前的原始 HTTP 状态码、响应标标标与响应体;
2. Objecto de devolução ou exemplo anormal de valor de devolução emitido após a transformação do KDD;
3. 针对当前选定版本纪元的预期语义映射投影;
4. O SDK é um sistema de desenvolvimento de dados e de dados.

Demonstrar código permitindo SDK                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `resultType`- Não.`_meta`- Não.`ttlMs`和 `cacheScope`), ao mesmo tempo em relação ao peso dos negócios do nível mais baixo.`futureHint`, test sujets will be used as diferenças de informação policial explicitamente sobre o relatório.

Não basta simplesmente supor que cada diferença seja um bug do SDK. O objetivo central é fazer este tipo de transformação oculta totalmente evidente.

Antes de ser publicado, é necessário executar testes de diferença para cada SDK que você mantém e suas versões de objetivos. Se dois SDK diferentes produzem diferentes resultados de regulamentação para um registro de interação completamente igual, a estratégia de publicação deve determinar claramente qual comportamento é regulamentar, absolutamente impossível e raramente.

## Captura de provas de agência

A maioria dos problemas de MCP no ambiente de produção ocorrem no transcurso ou na fronteira da rede de agentes de transmissão.

| 视角 | 最小必要凭据 |
|---|---|
| 入口（Ingress） | 客户端原始请求头、JSON-RPC 请求体、Content-Type、已认证路由、接收时间戳 |
| 源站（Origin） | 代理转发出的标头与请求体哈希、源站 HTTP 状态、源站响应头与响应体 |
| 出口（Egress） | 客户端最终可见的 HTTP 状态、响应头、最终响应体、发送时间戳 |

O código de exemplo foi desenvolvido para avaliar os dois comportamentos mais comuns:

- 源站原本规范返回的 HTTP 400 或 404 JSON-RPC 协议错误, foi simplesmente grosso modo transformado em HTTP 500 de uso geral;
- O conteúdo de retorno de pedidos de corpo e de origem para o final de entrega do cliente é alterado em termos de qualidade.

De acordo com a actual estrutura da implementação, também pode ser expandido para o tipo de conteúdo,`Accept`、 Transmissão de compressões、 para uma única solicitação de SSE、 cache tags e rastreamento de links distribuídos, bem como as afirmações da seguinte forma.

## 证据离开内存前 fazer desagrecimento

A desacimilação pertence a um passo central de construção do sistema de coordenação, e não ao trabalho de revitalização de fatos. Antes de ser feita a sequenciatura de credenciais, o cálculo de hash, a inscrição em diários, o registo de testes ou o relatório de errores, a desacimilação deve ser concluída na memória.

exemplo código em execução antes de executar o correspondência primeiro será o nome do código unificado para pequeno escrever e eliminar todos os ligados, e depois retornar para o tipo de eliminação.`Authorization`- Não.`Cookie`- Não.`Set-Cookie`- Não.`X-Api-Key`- Não.`accessToken`- Não.`clientSecret`- Não.`registrationAccessToken`- Não.`token`- Não.`password`- Não.`secret`E também`api_key`Para que o sistema de classificação seja mais eficaz, a definição de um sistema de classificação deve ser feita de forma a que o sistema de classificação seja mais eficaz.`query`Assim, parece-se um nome de código aberto, também pode conter dados de privacidade pessoal ou de regulação de conformidade.

計算哈希时基于已脱敏的证据捆绑包进行计算. Os dados do pacote de capturas de primeira instância de não-dessensão são apenas levados em inquéritos de acidentes específicos, por pessoas aprovadas em sistemas de restrição de ciclo de vida extremamente curto.

## A Comissão de Saúde e de Registro de Saúde

A concessão de um acordo é uma condição necessária para a publicação, mas não é condição suficiente. Uma versão candidata totalmente conforme à norma do acordo, ainda pode ocorrer em tempo extremo, vazamento de memória ou dependência de pressão.

Antes de deixar o fluxo oficial, deve-se definir claramente a janela de observação de saúde:

- Máxima capacidade de amostragem;
- Maximum permissible error ratevalue;
- 延迟分位数(P95/P99) 上限;
- 资源和度与算力限制;
- 持续观测的时间跨度;
- Com relação à direcção transversal do indicador de base de linha de base.

Da mesma forma, o certificado de regresso também deve estar em linha pré-pre-pre-pre-pre-pre-pre-pre-pre-pre-pre-pre-pre-pre-pre-pre-pre:

- 精确的前序版本标识;
- Precedente de qualificação de admissão
- A descrição de um elemento de trabalho SHA-256 e um anel fixo de um descrito;
- 当前最新的 Registro 官方状态;
- Relatório de avaliação de exames de saúde;
- 经过过过练的路由恢复标准作业程序;
- Por via de um autor de um documento de certificação (http://www.youtube.com/watch?v=UvQvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYvYv

O objetivo de este regresso é que a versão candidata esteja em estado saudável e comprovado antes de ser aprovada, em vez de esperar que a versão candidata explode online e depois a mão temporária esteja ocupada em busca de um caminho de saída.

Se a versão candidata falhar, e o objetivo de rolamento atualmente definido não tiver suporte completo de acesso, o sistema deve decidir optar por interromper o tempo todo, não se pode confiar na sensação de rolamento até que a versão pareça normal para encontrar o ar.

Não se deve classificar o seu sistema de controle em um código não-voio.`healthy: "yes"`O código de exemplo exige rigorosamente a correspondência de um tipo específico de estado ativo, três elementos essenciais SHA-256 resumo, um sujeito de assinatura de confiança e um legítimo HMAC-SHA-256 assinatura calculado com base na carga total. A chave de determinação no exemplo pertence a testes não secretos; no ambiente de produção, deve ser inserida na fronteira de distribuição em um código de segurança de segurança.

发布门禁还会坚决拒绝空白的内容交互记录、SDK 差异凭证或代理层证――每个证据源都必须提供有效摘要指针―― 一段看似全绿的健康曲线,绝不能用来掩盖一个从未真正被测过的系统边界――

## Handwriting realizado

运行基于标准库实现的一致性工程框架:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
```

O programa de demonstração irá funcionar em todo 15 grupos de registros de interação com o ouro e os negativos (incluindo casos de complemento automático de conformidade com as alterações) ✓ comparar as diferenças entre os dados originais e os vídeos do SDK ✓ verificar um agente intermediário alterado do código de origem da estação de erro ✓ avaliar indicadores de janela de saúde ✓ verificar a assinatura digital do certificado de rollback, e finalmente escolher o objetivo de rollback de segurança ✓

预期输出结构:

```json
{
  "transcriptsPassed": 15,
  "transcriptsTotal": 15,
  "sdkDroppedFields": ["futureHint"],
  "proxyIssues": [
    "proxy collapsed a protocol error into HTTP 500",
    "proxy changed the origin JSON-RPC body"
  ],
  "releaseAction": "rollback",
  "evidenceDigest": "..."
}
```

建议按以下顺序阅读 `code/main.py`O código-fonte é:

1. `validate_request()`: Força execução das regras de conformidade com as solicitações de uma determinada versão;
2. `validate_result()`:精确分旧版缺失判别器、现代合法取值、扩展类型及未知类型;
3. `select_era()`• a realização de estratégias de regresso de regime rigoroso e de restrições;
4. `run_transcript()`A avaliação dos registos de ouro e a rejeição negativa;
5. `compare_sdk_view()`: revelação dos segmentos diferenciados no processo de regulamentação do KSD;
6. `inspect_proxy()`: total-cadença em relação à entrada, fonte e saída;
7. `redact()`A produção de resumos de provas é feita antes de eliminar completamente os segredos sensíveis evidentes;
8. `rollback_evidence_ready()`O processo de seleção de dados é realizado através de um processo de seleção de dados.
9. `ReleaseGate.evaluate()`A decisão final foi tomada por todos os elementos não vazio:

## 运行与使用

Em software R&D entrega quatro pontos-chave de execução da linha de teste de concordança:

1. Cada vez que o código muda, através do processo de teste adaptador rápido de funcionamento;
2.  para os produtos de segunda fabricação dos clientes e serviços construídos, operando em camadas de transmissão físicas reais;
3. Em pré-publicação (Staging) ambiente, através de um agente ou operador de rede de operações de implementação real;
4. Durante a publicação, o Instituto de Ciências da Saúde (IEA) realizou um estudo sobre a evolução da saúde e da saúde dos animais.

Em todos os níveis de teste, manter a identificação de uso de casos de conformidade de todo o sistema.`negative-header-body-mismatch`No teste de unidade, teste de fim a fim, teste de agente e relatório de pinceladas, deve ser representado rigorosamente pela mesma quantidade de variação. Embora as diferentes bordas de cada nível possam causar mudanças na síntese de evidências, a quantidade de variação de nível inferior é delimitada.

O teste de equipamentos será inserido no controle de versão. O certificado de execução de equipamentos será preservado no sistema de gestão de publicações.

## 交互式实验

### 实验 A:验证版本纪元边界

Entrar`code`Agora não inicia Python:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code
python3 -q
```

运行如下代码:

```python
from main import *
validate_result({"tools": []}, "legacy")
validate_result({"tools": []}, "modern")
```

A antiga edição do Jornal de História disse que`complete`E o moderno é o que se faz.`ProtocolViolation`异常──接下来测试回退逻辑:

```python
select_era({"kind": "timeout"}, "fallback")
select_era(
    {"kind": "timeout"},
    "fallback",
    legacy_allowed=True,
    legacy_evidence={"kind": "initialize_success", "protocolVersion": LEGACY_VERSION},
)
select_era({"kind": "jsonrpc_error", "code": -32021}, "fallback")
```

A primeira super-hora de segurança falhou, porque o silêncio em relação ao extremo não constituiva a prova legal do protocolo da versão antiga. A segunda convocação de sucesso selecionou a versão antiga, porque a configuração abriu claramente os direitos e observou o antigo certificado de mão legal.

### 实验 B: 附加字段与判辨器对比

```python
validate_result({"resultType": "complete", "tools": [], "futureHint": True}, "modern")
validate_result({"resultType": "future_mode", "tools": []}, "modern")
```

Primeiro resultado completo reservado`futureHint`扩展字段;第二条结果则被坚决拦截,因为其生命周期判定器完全未知──

### 实验 C:检查 SDK 转换

```python
compare_sdk_view(
    {"resultType": "complete", "tools": [], "futureHint": {"mode": "new"}},
    {"tools": []},
)
```

结合你的组件定位评估: current system permitir o abandono `futureHint`O que é necessário para que a decisão de projeto seja explicitamente inscrita no regulamento de publicação da equipa, é que as diferenças são silenciosamente eliminadas.

### 实验 D:修复代理层问题

调整演示程序中的交互报文,使出口处能够忠实通过传源站的原生状态与请求体――重新执行 调整演示程序中的交互报文,使出口处能够忠实通过传源站的原生状态与请求体――重新执行 调整演示程序中的交互报文,使出口处能够忠实通过传源站的原生状态与请求体――重新执行 调整演示程序中的交互报文,使出处能够忠实通过传输站的原生状态与请求体――重新执行 调整演示程序中的交互报文,使出处能够忠实通过传输站的原生状态和请求体――重新执行 调整出处置的原生状态与请求体――重新执行 调整出口处置的原生状态与请求体`python3 main.py` A polícia agência de notícias desapareceu, mas, como o SDK ainda abandonou o segmento, a sua saída foi interrompida.`futureHint`A observação é feita através de um processo de avaliação de todas as dimensões.`promote`- Não.

## 动手实践

Por exemplo, a rede de testes de ferramentas de teste foi criada em um contexto de intercâmbio de testes de dados.

需求规范:

- Captar o código de estado de resposta HTTP, o tipo de conteúdo, a sequência de eventos SSE e o sinal de terminação da ligação;
- provar que cada evento JSON-RPC emitido através da SSE tem resultados ou erros de conexão com a sua versão;
-  redação de casos de teste negativo: simulação de um agente intermediário em completo缓冲 de todos os eventos após apenas uma transmissão de irregularidades;
-  redigir casos de teste negativo: capturar o ID JSON-RPC de um evento SSE  com o ID de erro que não corresponde ao pedido inicialmente emitido;
- Durante a perpétuação do evento, a execução total da falta de sensibilidade é feita em conformidade com as provas;
- O número total de eventos incluídos na janela de avaliação de saúde;
-  assegurar que quando o fluxo de eventos ocorrer de forma anormal, emitir 

验收标准: o mesmo caso de uso pode executar directamente e atravessar o operado do agente, e o relatório de avaliação gerado pode determinar o que é o que a rede de bordas de salto provocou comportamentos diferentes.

## 交付产物

本课程交付 `outputs/skill-mcp-conformance-release-gate.md` Usá-lo para transformar qualquer versão de servidor, cliente, rede ou SDK em uma versão de adaptação de padrão de matriz de conformidade com a decisão de publicação. O produto é obrigatório para fornecer um certificado de linha original, resultados de teste negativos, registros de negociação de dados, diferença entre o SDK e o projeto de controle de controle de controle de controle de controle de dados, evidências de segurança, indicadores de saúde, bem como um certificado de regresso completo.

## 验证标准

运行演示程序与全套确定性测试套件:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试应严格证明:

- Todos os 15 grupos de ouro e registos negativos que contêm alcançam os resultados previstos;
- 现代请求强制要求使用带精确命名空间的元数据键;
- HTTP 标标题名称比对不区分大小写,且编码后的 `Mcp-Name`值被无损精准回原;
- 标头与请求体不一致时准确返回现代错误码  标头与请求体不一致时准确返回现代错误码  标头与请求体不一致时准确返回现代错误码 `-32020`O artigo 2.o
- 响应版本、ID 一致性、 resultados e erros de interesposição、 erros de estrutura de objeto e de mapeamento HTTP são rigorosamente verificados;
- 强制执行针对 `tools/list`、Tasks  expansion and complementar method of specialized load regulations;
- Só para aparecer.`HeaderMismatch`, é necessário capturar de facto até HTTP 400 com JSON-RPC `-32020`响应;
- Não codificado`Mcp-Name`首尾空白被拒绝,而使用哨兵编码的空白字符能精准往返原;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `resultType`                                                                                                                                                                                                                                                              
- Os tipos de resultados do ciclo de vida desconhecido serão definitivamente rejeitados;
-  O tipo de expansão dos resultados só deve ser autorizado sob pressuposto de capacidade de resposta;
-  Receber um erro de acordo moderno reconhecido que não tenha sido repassado ao protocolo de versão anterior;
- Notificação  absolutamente não produz qualquer forma de resposta JSON-RPC 
- Claramente identificar o SDK para a separação normal dos segmentos de protocolos e a perda acidental dos segmentos de negócios;
- 精准检查出代理层对错误码的吞没变化,且在小驼峰和带连符等多种风格变体下均可归归脱敏证据;
- 晋级放行必须同时拥有空空的交互记录"",SDK差异"",代理审计"",以及在健康区的运维证书";
- Seja em marcha ou em rotação, é exigido que exista uma certificação de assinatura, um sinal fixo, um estado ativo e um objetivo de rotação saudável.

## O sistema de produção

| 故障现象 | 浅层粗糙测试的假象报告 | 测试工具链必须证明的实质 |
|---|---|---|
| SDK 擅自补全了缺失的判别器 | “tools/list 运行通过” | 原始线路上缺失现代 `resultType`，属于非法响应 |
| 收到 `-32021` 后客户端自行降级 | “旧版重试成功” | 收到已识别的现代错误绝不允许降级回退 |
| 未知结果类型被当成 complete | “响应成功解析” | 未经能力通告的生命周期判别器必须被坚决拒绝 |
| 代理批准了 A 工具而源站执行了 B 工具 | “请求成功抵达服务端” | 确保每一跳的 `Mcp-Name` 均与请求体中的路由名称严格一致 |
| 测试在读取服务端响应前自行报错终止 | “标头不匹配测试通过” | 必须真实捕获并验证 HTTP 400 及 JSON-RPC `-32020` 响应体 |
| 代理将源站 400 转换为通用的 500 | “上游服务端报错” | 源站与出口两端的 HTTP 状态及错误体必须原样保留 |
| Notification 中间件强行输出 `{result: null}` | “处理函数正常返回了 None” | 最终网络出口的请求体必须为空，且不存在任何 JSON-RPC 报文 |
| SDK 擅自剥离了前向附加字段 | “强类型对象转换一致” | 原始视图与规范化视图清晰指出具体哪一个字段被丢弃 |
| 事故排查工件泄露了 Bearer Token | “已成功上传调试数据包” | 在计算哈希、写入日志或上传网络之前已彻底完成脱敏 |
| 命名风格变体绕过了脱敏拦截 | “黑名单中已包含 api_key” | 小驼峰、中划线等所有变体在脱敏前均统一规范化为规范形式 |
| 金丝雀发布在毫无流量时显示指标全绿 | “零错误率” | 强制校验最小请求样本容量门槛 |
| 故障回滚切到了一个未经测试的未知构建 | “已恢复先前部署” | 回滚目标、准入摘要、固定指纹、状态与健康凭据必须全部完备 |

## 运维守则

Para testar cada real-metragem emitida, testar cada real-metragem transmitida por um agente intermediário, testar cada SDK com a sua própria linguagem externa, bem como as provas de diagnóstico que a equipe de desenvolvimento deve depender sob pressão de emergência.

## 延伸阅读

- [MCP 2026-07-28 基础协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP 版本协商机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Streamable HTTP 规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [官方 MCP 一致性测试工程仓库](https://github.com/modelcontextprotocol/conformance)
