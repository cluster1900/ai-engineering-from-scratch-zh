# Contratos de ferramentas MCP e conteúdo

>  Só quando a descoberta ̊param­bres ̊ resultados ̊pares ̊paginas e os dados de transmissão forem alcançados um acordo, pode-se realizar com segurança a automação

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07, 09, and 10
**Time:** ~120 minutes

## Objectivo de aprendizagem

- Utilize JSON Schema 2020-12  define ferramentas de entrada e saída.
- 校验结构化结果, não supõe que seja necessariamente objeto JSON.
- Em texto (text) 圖像 (image) 音频 (audio) 资源链接 (resource_link) e recursos (resource) fazer uma escolha razoável entre eles.
- Antes de ser exposto ao modelo, rejeite o inseguro.`x-mcp-header`定義──
- Para o código preciso do valor do parâmetro, e a verificação da concordância entre o título da solicitação e o objeto da solicitação.
- Em não resolver o valor de um determinado número,
- Para o`completion/complete`补全建议进行范围界定与权限控制──

## 核心问题

调用普通的Python 函数很简单――但通过AI host 调用远程能力,则是一个典型契约问题――

服务端发布描述符 (descrição) ⋅ cliente vai transformar o descricionador em um modelo de interface do usuário.

Se houver uma barreira, destruirá a cadeia inteira.

考虑以下五种常见故障:

- 描述符声明 retornar resultado é um objeto, mas o serviço端 realmente retornar uma matriz。
- 客户端在 `nextCursor`Por isso, não me esqueça de fazer isso.
- Os parâmetros são espelhados no título HTTP, expondo-os a todos os agentes intermediários e sistemas de registro.
- incluindo o valor de rotação de Unicode é enviado como o título original, levando a uma desacordo entre o código de ligação e o código de origem para a sequência de caracteres.
- Auto-plenar o ponto completo para um usuário sem direito de acesso ao ambiente de produção

Estes falhas não têm uma solução melhor para ser resolvidas.

## 契约流水线 (em inglês)

Vamos dividir cada vez as ferramentas em cinco portas de execução:

1. **发现（Discover）**:读取确定性、已分页的工具列表──
2. **准入（Admit）**O que é o "processo de segurança" de cada um dos seus instrumentos?
3. **调用（Invoke）**O que é um sistema de transferência de dados?
4. **执行（Execute）**Função de processamento de ferramentas e erros de execução
5. **消费（Consume）**Antes de entregar o modelo, o bloco de conteúdo da experiência e o resultado estruturado.

```figure
mcp-contract-pipeline
```

O servidor não pode forçar o cliente a confiar cego em sua análise, esquema ou resultados.

## JSON Schema é运行时边界

Em MCP `2026-07-28`规范中,`inputSchema`Com`outputSchema`均采用 JSON Schema──当省略 `$schema`声明时,默认方言为 2020-12──

输入 Schema 必须是一个方案对象. Mesmo que um instrumento não precise de quaisquer parâmetros, também deve precisamente declarar seu formato aceitável:

```json
{
  "type": "object",
  "additionalProperties": false
}
```

É mais do que ...`{ "type": "object" }` rigoroso, o último permite transmitir qualquer atributos adicionais

O esquema de saída é opcional. Mas o serviço já está disponível.`outputSchema`Cada vez que retornarem, o resultado é que todos se comprometem a retornarem em conformidade com o acordo.`structuredContent`, mesmo que os resultados incluam`isError: true`Também é assim. O erro de marcação é apenas uma classificação do resultado de execução, que não pode absolver os resultados de saída publicados. O cliente deve ativar o resultado da prova, e não o descrito de confiança ativa.

###  Conteúdo estruturado pode ser qualquer valor JSON 

Não me deixes .`structuredContent`硬编码为字典 (dict/objeto) ⋅ é possível:

- Um objeto;
- Uma matriz;
- Uma corda;
- Um número;
- Um booleano;
- `null`- Não.

Por exemplo, a ferramenta de regresso do grupo abaixo:

```json
{
  "name": "tag_catalog",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "array",
    "items": {"type": "string"}
  }
}
```

O resultado do seu retorno é totalmente legal:

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "[\"contracts\", \"mcp\", \"stateless\"]"
    }
  ],
  "structuredContent": ["contracts", "mcp", "stateless"],
  "isError": false
}
```

Para manter a compatibilidade posterior, retornar os resultados estruturados normalmente também deve ser em texto content block content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content`structuredContent`É só...

### 简明校验器 ainda pode esclarecer a essência das fronteiras

Este curso é especialmente concebido para implementar um conjunto de JSON Schema 校验子集, para manter-se completamente no âmbito do Python 标准库.

- Tipo de objeto, arranja, cadeia, número inteiro, número, boole e zero;
- A qualificação necessária;
- `additionalProperties: false`O artigo 2.o
- elementos de matriz;
- Enum 枚举值;
- 字符串最小长度 minLength。

Não é uma completa implementação para substituir o teste de produção de classe.**校验发生的时机与位置**A análise de dados e de dados de dados sobre os dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados

## 内容块承载不同的成本

`content`Número de blocos de conteúdo podem ser combinados:

| 类型 | 适用场景 | 核心安全与控制边界 |
|------|------------|---------------|
| `text` | 人类与模型可读的摘要文本 | 将文本视为不可信输出 |
| `image` | 以 Base64 编码的视觉凭证 | 严格校验媒体类型（media type）与文件大小 |
| `audio` | 以 Base64 编码的语音或音频 | 严格校验媒体类型与时长上限 |
| `resource_link` | 客户端后续可按需拉取的 URI | 在后续读取资源时重新执行鉴权 |
| `resource` | 直接内嵌在当前结果中的数据 | 在当前调用立即强制执行载荷与内容上限 |

资源链接(`resource_link`) não garante que este recurso seja necessariamente presente.`resources/list`Na lista de dados, é um dos principais recursos que o usuário usa para retornar.

Intro recursos`resource`Para os trabalhos de grande ou de variação frequente, recomenda-se o uso de links de recursos; para os que precisam de uma pequena quantidade de dados de credenciais ligados aos resultados do instrumento, é recomendado o uso de recursos embutidos.

本课例代码中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `evidence_bundle`Os resultados também abrangem estes cinco tipos de resultados.

## `x-mcp-header`É um caminho para o futuro

Em`inputSchema`Uma característica interna pode ser declarada.`x-mcp-header` Em Streamable HTTP 传输协议, o cliente será o paramétrio de imagem para `Mcp-Param-{name}`- Não, não.

```json
{
  "region": {
    "type": "string",
    "x-mcp-header": "Region"
  }
}
```

Quando é que é`region: "eu-west"`时, transmisión layer é emitido como segue:

```http
Mcp-Param-Region: eu-west
```

 Introdução Esta notação é feita para permitir que o equilíbrio de carga, o sistema de conectividade ou o mecanismo de estratégia seja completado sem a necessidade de resolver o JSON completo.**绝对不能**Utilizadas para transmitir o direito de identificação ou dados sensíveis.

O acordo para a admissão foi estritamente restringido:

- 标头名称必须非空,且符合HTTP field-name token 语法规范;
- O título deve ser único em toda a área, sob a premissa de um grande número de distinções;
- Tipo de atributos de parametros só pode ser string, inteiro ou booleano;
- Não permite usar`number`(浮点数);
- A solução só pode aparecer diretamente.`inputSchema.properties`de primeira camada diretamente em um ponto;
- O total de valores deve ser limitado a`-9007199254740991`Até`9007199254740991`(JavaScript segurança inteira)

位置规则是语法级别的,并且必须是安全失败 (fail-closed) 机制――必须穿越整个树 Schema 树,而不能仅仅检查校验器巧识别顶级属性――只要注解现场嵌套对象的`properties`- Não.`oneOf`- Não.`items`Por dentro.`$ref`Na definição de citação, ou em qualquer esquema de saída, todos devem ser firmemente rejeitados.

Esta aula adicionou uma estratégia de segurança de implementação:`password`- Não.`secret`- Não.`token`- Não.`api_key`Ou `authorization`O autor do serviço não deve usar parâmetros sensíveis à imagem, enquanto o cliente pode implementar essa recomendação para regras de controle de acesso rigorosas.

审计时只记录标头名称,不记录其具体数值.`Mcp-Param-Region`, e será concretizado `eu-west`排除在审计日志之外──

### Em construção de HTTP 标题前进行数值编码

参数值 apenas pode ser transmitido diretamente em formato de texto puro em tags:非空字串, por ASCII 可见字符(`!`Até`~`O resto dos valores de aquisição devem ser rigorosamente adotados no seguinte formato de codificação:

```text
=?base64?{Base64UTF8}?=
```

Entre eles `Base64UTF8`Base64 编码──绝对不要在此之前对字符串执行 trim(删除首尾空格) 规范化或替换操作──Unicode 字符、空字串、空格、制表符、控制字符、CR或LF、带有前导或尾随空白的值,以及任何原本就此`=?base64?`O valor inicial, tudo deve ser codificado O valor inicial do formato de um enviado deve ser codificado novamente, pois o recebedor pode recuperar o texto original, sem que seja interpretado erroneamente como um elemento fundamental da linguagem de transmissão

O que é que é o que é?`true`Ou `false` O número inteiro deve ser um único de 10 e deve ser colocado no JavaScript dentro do número inteiro seguro.

### 服务端校验镜像副本

O nível de qualidade é o nível de qualidade da rede.

1. Em um pré-requisito de não distinguir o nome, procure todos os identificados.`Mcp-Param-*`O artigo 2.o
2. Se existir um formato de base 64, executar um código de identificação;
3. Para a análise do texto após a decodificação e a comparação dos parâmetros de requisições JSON;
4. Se for constatado que o título já identificado existe uma falta, repetição, não-esperada, erro de formato ou inconsistência com o pedido, rejeitar-se-á diretamente antes da distribuição do negócio.

O rejeitado deve retornar ao HTTP`400`E também JSON-RPC  erro código `-32020`O valor do pedido e a forma do título após o código não pertencem ao conteúdo do registro de auditoria, o registro de auditoria apenas identifica o título e a categoria de motivos de rejeição.

`code/main.py`直接模拟了这个边界逻辑──[第 09 课](../../09-mcp-transports/) mais explicado incluindo HTTP Método e acordo de versão de concordância                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

## O segmento de marcas é opaco

MCP's list operation adoptacion游标分页 (cursor pagination) ∙服务端决定每页的大小与游标格式──客户端只需遵循一个唯一的判断:

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

**绝对不要**写成如下形式:

```python
if not result.get("nextCursor"):
    break
```

Porque não é verdade.`""`Também é legal! Se usarmos diretamente o Python para determinar o verdadeiro valor da verdade, isso levará a um precoce interromper.

O cliente não pode tentar decifrar o seu tag, auto-acrescentar o seu cálculo, comparar o seu tag novo com o seu antigo tag com uma ordem de julgamento ou de conclusão de um código de página. O serviço pode assinar o seu tag, ligá-lo a uma versão de catálogo específico ou mapeá-lo para um estado privado de nível inferior, tudo isso pertencendo ao serviço interno.

O serviço de exemplo voltou a ser usado na primeira página.`""` O cliente em envio de segunda página solicitação deve originalmente levar este valor.

```text
<first request with no cursor>
<second request with cursor "">
```

无效的游标输入应产生 JSON-RPC params invalidas 错误(错误码 `-32602`)。

## Automatos complementos são autorizados para atacar

`completion/complete`方法为快速参数与资源模板参数提供自动补充建议── é muito útil no formulário de comunicação, mas se não for adicionalmente protegido, pode divulgar os nomes sensíveis protegidos pela interface de listagem comum──

Uma declaração de um pedido completo sobre os objetos citados e os parâmetros atualmente completados:

```json
{
  "method": "completion/complete",
  "params": {
    "ref": {
      "type": "ref/prompt",
      "name": "deployment_review"
    },
    "argument": {
      "name": "environment",
      "value": "st"
    }
  }
}
```

O resultado de retorno contém o máximo de 100 valores recomendados, e pode ser acompanhado `total`Com`hasMore`- Não.

 deve ser aplicada em uma aplicação com o Pronto ou recurso citado em total conformidade com o limite de competência.`development`Com`staging`O operador só pode receber o seu pedido.`production`- Não, não.

O nível de produção de serviços complementares também requer:

-  rigoroso teste de entrada;
- 区分调用者身份的过;
- 客户端防(descolar);
- 服务端限流(limitamento de taxas);
- Limitar a quantidade de resultados;
- Em日志 evitando a exposição de sensibilidade suplementares recomendações são adotadas.

O complementar pertence a meios de entrada auxiliares, não pode ser a porta de volta da verificação de direitos de descoberta.

## 双层错误机制

O nível de acordo deve ser muito diferente do nível de execução de erros em ferramentas.

Quando MCP Solicitações não podem ser correctamente distribuídas, usar **JSON-RPC error**- Não .

- Nome de ferramenta não conhecida;
- 格式错误的请求报文;
- 缺失必要的请求元数据;
- 无效的分页游标──

Quando o usuário utiliza um instrumento de chegada bem sucedido, e o instrumento acima informa que um erro operacional pode ser corrigido, o usuário usa o`isError: true`de **完整工具结果（complete tool result）**- Não .

-  Uma fonte de dados de relatório temporariamente indisponível;
- 传入日期超出所支持范围;
- O Regulamento de Emprego recusa a operação solicitada.

Um grande modelo geralmente tem capacidade de compreender e corrigir ferramentas executando erros, mas um grande modelo não pode corrigir automaticamente em violação do próprio esquema de saída do serviço.

Se o instrumento declarou o esquema de saída, deve ser construído no esquema para o defeito operacional.`route_report`Quando falhar, voltará.`isError: true`), a região de sua solicitação`accepted: false`de forma estruturada, juntos retornarão.

## Handwriting realizado

`code/main.py`Usando Python 标准库 completa realizou a lógica central dos dois lados da fronteira.

服务端实现了:

-  para cada pedido de MCP;
-  declarações de ferramentas e conclusões  capacidade `server/discover`O artigo 2.o
- 确定性的 `tools/list`- Não, não.
- Quatro descricionadores de ferramentas (incluindo um descrito de segurança que tenha sido construído de propósito e que tenha de ser rejeitado);
- Número de tipos de saída estruturada;
- Todos os blocos de conteúdo de ferramentas atuais são apoiados;
- Streamable HTTP 一致性门禁:解码已识别的参数标题, e retornar ao HTTP quando o conteúdo não se corresponde `400`和 JSON-RPC `-32020`O artigo 2.o
- 带权限控制与限流的补充功能──

客户端实现了:

- 工具描述符准入机制 (mecanismo de descrição de instrumentos);
- Todo o arvore`x-mcp-header` estratégia de protecção de posição e de segurança dos sentidos;
- 精确的纯 ASCII可见字符直接传输或 Base64 UTF-8编码;
- Identificar o ciclo de segmentação de páginas de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação de segmentação;
- 参数与回归结果校验;
- 内容块合法性校验;
-  contém apenas o nome do título e não contém o registro dos eventos de auditoria do título de valor sensível.

Por isso, o descrito de insegurança que contém é um excelente exemplo de ensino. Ele demonstra que um único instrumento rejeitado não impede a carga e registro normal de outros instrumentos de conformidade.

## 运行验证

Do código-fonte do catálogo:

```bash
cd phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code
python3 main.py
python3 -m unittest discover tests -v
```

O programa de demonstração imprimirá os instrumentos já inseridos, os descritores rejeitados, os detalhes de volta e volta de duas vezes, o conteúdo do conjunto estruturado, o tipo de blocos de conteúdo, o nome do título de imagem, o valor do código, o estado de teste de conformidade do HTTP, bem como a lista de recomendações completas de acordo com o papel do usuário.

## 交互式实验

- Não .`code/main.py`Não encontrou`TOOLS`变量:

1. - Não .`tag_catalog.outputSchema.type`De`array`改为 `object`- Não.
2. 运行演示程序──观察客户端如何坚决拒绝回归的数组结果──
3. 恢复原始 Schema──
4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `nextCursor`Por`""`E depois , deixe a última página voltar .`nextCursor: None`Não é um "província" direta.
5. 运行测试并对比游标的追踪链路──
6. Para uma cadeia  atributos adicionados `x-mcp-header: "Authorization"`- Não.
7. 确认描述符准入检查在调用前将其成功拒绝──
8. 尝试使用包含 Unicode、换行符、首尾空格以及字面文本 `=?base64?SGVsbG8=?=`de `region`取值──解码 emitido cada sinal, verificando que o valor original foi completamente inoperado.
9. Vai ser transferido para`oneOf`- Não.`items`Ou `$ref`定義的深层分支下──確認即使演示程序从不走进该分支,描述符准入仍将拒绝它──
10. 删除已识别标标头或改其解码后的取值── confirmar HTTP 边界返回状态码 `400`E também JSON-RPC  erro código `-32020`- Não.

O objetivo central desta experiência não é a morte de um fragmento JSON, mas observar como cada um dos seus componentes é preciso.

## 动手实践

Para fazer experiências expandir um`search_evidence`工具──

需求规范:

1. Sua entrada Schema  aceita `query`- Não.`limit`E também de segurança.`region`- Não, não.
2. Sua saída Schema é constituída por um conjunto de objetos, cada objeto contendo`uri`- Não.`title`和 `score`- Não.
3. 结果中每项需要包含兼容性文本以及一个对应的资源链接 (→ "ressource_link") 
4. 参数校验时拒绝未知属性──
5. `limit`受到应用层校验的上限约束──
6. Não há direito de acesso a um determinado URI, seja através de auto-reemplão ou de saída de ferramentas, todos absolutamente não podem ver esse URI.
7. 编写测试,覆盖不合规的分 评分、非法的标标注注解,以及两页分页列表场景──
8. O teste de valor numérico precisa cobrir as letras de controle de ASCII, Unicode, letras de branco, texto de forma de guarda-roupa, bem como o JavaScript.
9. HTTP 测试具需支持大小写不敏感标题名称查找, mas quando encontrar uma falta ou não correspondência de um título já identificado, resolve retornar ao código de estado `400`Com o erro de código`-32020`- Não.

## 交付产物

`outputs/skill-mcp-contract-reviewer.md`É uma habilidade de revisão independente de uso direto e repetível. Descrição de ferramentas de entrada, resultados de exemplo, comportamento e complemento de página, é capaz de emitir decisões de entrada, programas de avaliação de resultados, estratégias de segurança de etiquetas e casos de teste negativo específicos.

## 验证标准

Quando todas as seguintes finalidades forem alcançadas, o objetivo da secção é concluir:

- `tools/list`Durante várias vezes repetidas, mantém-se completamente a mesma ordem lógica.
- 客户端在 `nextCursor`Por`""`时能正确发起第二分页请求──
- 包含不安全敏感标标标的描述符被除,同时其他合规工具正常准入──
- O resultado pode ser emitido através de seu número.
- O resultado do estudo foi o resultado do estudo.
- 报错结果(Error results) deve ser省略或违反已发布的输出方案──
- Text、image、audio、resource_link 和 resource 五种内容块均通过校验──
- O evento de auditoria só registra o nome do título, não registra seu valor específico.
- 純 ASCII 可见字符保持直传;Unicode、控制字符、带空格填充、空字符串及形似哨兵的值均均通过Base64 UTF-8 精确往返编解码──
- 镜像的整数超越 JavaScript 整数范围时被拒绝──
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `oneOf`- Não.`items`- Não, não.`$ref`Ou de saída Schema 中的注解在准入阶段被拦截了──
- O nome de um título identificado apenas é totalmente em consonância com o requisito; a falta ou não correspondência do título produz HTTP.`400`和 JSON-RPC `-32020`- Não.
- O auto-reabastecimento do analista não retorna .`production`- Não.
- 工具自身业务失败使用 `isError: true`; protocolo formato变 usando JSON-RPC `error`- Não.

## O sistema de produção

| 故障现象 | 学习者看到的表象 | 正确处理方案 |
|---------|-----------------------|------------------|
| 客户端假定输出必定是 object | 合法的数组校验失败或被静默包装 | 依据发布的 Schema 进行校验，不假定结果必须为 object |
| 空字符串游标被当成 False 处理 | 最后一页数据意外丢失 | 只要 `nextCursor` 存在且非 null，就继续拉取下一页 |
| 镜像了敏感参数值 | 凭证密钥暴露在代理、WAF 或链路追踪日志中 | 拒绝该描述符，将机密保留在受保护的请求体内部 |
| 原始 Unicode 或空白字符直接镜像 | 网关与源站解析不一致，或值被意外规范化 | 使用 Base64 UTF-8 哨兵编码并在解码后进行比对 |
| 注解隐藏在 Schema 的复杂分支中 | 客户端在准入时漏检了路由元数据 | 遍历整棵 Schema 树，仅允许直接位于一级的属性携带注解 |
| 镜像了大整数 | 中间 JavaScript 代理对路由数值进行了舍入 | 拒绝超出 JavaScript 安全整数范围的数值 |
| 标头与请求体不一致 | 网关路由给服务 A，而源站实际执行服务 B | 在业务分发前以 HTTP `400` 和 JSON-RPC `-32020` 拒绝 |
| 忽略了输出 Schema | 下游程序消费了损坏的脏数据结构 | 在交给模型或应用程序前进行严格校验 |
| 盲目信任返回的资源链接 | 调用方直接读取了未获授权的 URI | 对每一次资源读取重新执行鉴权 |
| 自动补全共享了全局建议列表 | 多租户敏感隔离名称被泄露 | 按调用者身份、引用上下文与权限范围进行过滤 |
| 将工具注解当作安全策略 | 破坏性危险操作跳过了二次确认 | 在注解之外建立独立的授权与审批流 |
| 单个格式错误的工具搞垮整个发现流程 | 整台 MCP 服务端完全不可用 | 拒绝有问题的描述符，独立准入其余合规工具 |

## Capstone 串联

O projeto Capstone da Fase 13 requer um bloco de rede capaz de se reunir de vários terminais de serviço.

Usar este curso para avaliar os quatro principais credenciamentos da Capstone:

- processo de detecção de sinais definido e completo;
- O método de descrição de ferramentas é aplicado em um modelo.
- O processo de avaliação é realizado através de um processo de avaliação de resultados e de resultados.
- 严密守护授权边界的补充与路由元数据──

Não só por uma vez.`tools/call`调用成功就宣称兼容网关规范──请务必捕获描述符、分页链路追踪、已准备入工具集、被拒绝工具集,以及至少一个完整的校验通过结果──

## 关键术语

| 术语 | 含义 |
|------|---------|
| `inputSchema` | 定义工具所接受参数的 JSON Schema 对象 |
| `outputSchema` | 定义 `structuredContent` 格式的可选 JSON Schema |
| `structuredContent` | 工具执行结果所生成的任意 JSON 结构化数值 |
| 内容块（Content block） | 具备类型化标记的 text、image、audio、resource_link 或 embedded resource |
| `x-mcp-header` | 将基础类型参数镜像为 Streamable HTTP 标头元数据的 Schema 注解 |
| 不透明游标（Opaque cursor） | 服务端发出的分页标记，客户端不得解释其内部含义 |
| 补全引用（Completion reference） | 正在请求参数补全的 Prompt 名称或资源 URI/模板 |
| 准入（Admission） | 客户端根据本地策略决定公开暴露还是拒绝已发现描述符的决策过程 |

## 延伸阅读

- [MCP Tools 规范](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Completion 自动补全规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- [MCP Pagination 游标分页规范](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [MCP Streamable HTTP 参数标头规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#custom-headers-from-tool-parameters)
