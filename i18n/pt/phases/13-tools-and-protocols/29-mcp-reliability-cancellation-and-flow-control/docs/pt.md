# MCP: Reliabilidade, eliminação e controlo

> Não pode deixar os efeitos secundários ficarem seguros, não pode deixar o processo de trabalho da plataforma para trás parar, nem pode proteger os dados do atraso do consumidor lento.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 09 and 13
**Time:** ~120 minutes

## Objectivo de aprendizagem

- Por estúdio e Streamable HTTP, separar para realizar o pedido de eliminação de sinal.
- 解決完成 (完成) e取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消 (取消) 取消) 取消 (取消) 取消 (取消) 取消) 取消 (取消) 取消 (取消) 取消) 取消 (取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消) 取消 (取消) 取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消) 取消 (取消) 取消)
- 严格区分时请求取消与持久化 `tasks/cancel`De idiomas diferentes.
-  De acordo com as características secundárias e as chaves de independência,
- Ao mesmo tempo em que a linha de progressão é definida como um limite de capacidade, assegure-se de que a resposta final não seja abandonada.
- 通過再連結、权重拉 (re-refetch) 及帶動的退避机制实现流的恢复──

## 核心问题

Os erros mais caros de sistemas distribuídos geralmente ocorrem fora do caminho normal de sua execução.

O cliente iniciou a execução de um instrumento. O serviço começou a executar. O processo de notificação foi continuamente lançado.

Cada componente da cadeia não tinha nenhum erro em sua localização, mas o sistema inteiro foi destruído em sua totalidade.

As regras do MCP definem o formato de mensagem e o comportamento da camada de transmissão, mas o seu aplicativo ainda deve ser pessoalmente responsável:

- 时间预算 (orçamento de orçamentos);
- 业务等性(Depotência empresarial);
- Há grupos de grupos (incluindo as filas limitadas);
- 重试分类(classificação de aposentadoria);
- 持久化任务状态 (estado de tarefa durável);
- 重连与重新拉取策略 (Relaxão e reformulação da política)

Este curso irá construir essas decisões em um simulador de determinação. Aqui não há introdução de sono, socket de rede real ou como ocorre o problema. Você vai controlar diretamente a sequência anterior do evento de eliminação.

## Solicitação de eliminação em função da camada de transmissão

Independentemente do tipo de protocolo de transmissão utilizado, os planos do cliente são iguais: não é necessário mais os resultados atualmente executados.

### Estúdio

O estúdio  adopta单条共享的双向通道──客户端发送一个通知:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": 41,
    "reason": "User closed the operation"
  }
}
```

O notificação pertence a 即发即弃(fire-and-forget) .

O serviço deve cessar o seu trabalho, libertar recursos e não enviar mais respostas a pedidos cancelados. Se o pedido for incompleto ou não puder ser interrompido, o serviço pode ignorar o aviso de cancelamento.

形式错误、 refere-se a um pedido desconhecido ou a um pedido concluído, o anulação do aviso será silenciosamente ignorada.

### HTTP em transmissão

现代 Streamable HTTP 为每个请求分分独立的 HTTP 响应或 SSE 响应流──客户端通过**直接关闭该请求的响应流**Para emitir um sinal de eliminação.

Não é normal HTTP Petição POST  Enviar `notifications/cancelled`O seu próprio "apertura" é o "apertura" do sinal.

Uma vez que o serviço detecte a interrupção da ligação, o serviço deve parar de funcionar e não pode enviar nenhuma mensagem posterior para o pedido.

### 服务端发起的取消范围极其有限

服务端绝不能使用  serviços não podem ser utilizados`notifications/cancelled`Para eliminar o uso normal do cliente.`subscriptions/listen`监听请求―― deve ser separado de forma rigorosa este caminho muito estreito das solicitações habituais de clientes.

## 取消 é uma competição

A ordem dos dois eventos é totalmente legal.

### 取消获胜

```text
request starts（请求启动）
client sends cancellation signal（客户端发送取消信号）
server marks request cancelled（服务端将请求标记为已取消）
worker reaches completion（工作线程执行完成）
server suppresses the response（服务端抑制并不发送响应）
```

### 完成获胜

```text
request starts（请求启动）
worker commits the result（工作线程提交业务结果）
server sends the response（服务端发送响应）
cancellation arrives late（取消信号迟到）
server ignores the late notification（服务端忽略迟到的通知）
```

O cliente também deve ignorar ativamente as respostas atrasadas a pedidos já abandonados.

```figure
mcp-reliability-race
```

本课的 `RequestCoordinator`Uma vez que o registro foi cancelado,`complete()`Não retornará nenhuma resposta; e o aviso de cancelamento de demora também não pode alterar o registro concluído.

## O mecanismo de super-hora precisa de dois horas

单一的无活动(inactivity) 计时器是远远不够的──

 deve simultaneamente introduzir dois conjuntos de tempo:

1. **空闲超时（Idle timeout）**O pedido não produziu qualquer atividade útil durante muito tempo.
2. **最大超时（Maximum timeout）**O orçamento do horário de parede (do que é chamado de orçamento do horário de parede)

Continuar a ocorrer progresso (progresso) pode ser re-imposto, mas**绝不能**推迟或消除最大截止时间──

```text
start: 0 ms
progress: 400 ms
progress: 800 ms
progress: 1200 ms
idle timeout: 500 ms
maximum timeout: 2000 ms
```

Em 1500 ms, a solicitação ainda está em estado ativo, pois a distância do evento de progressão anterior passou apenas de 300 ms. Mas em 2000 ms, o máximo de tempo limite forçará a cancelamento da solicitação, mesmo em 1999 ms.

O serviço pode aceitar um progress order token, mas não enviar nenhuma atualização durante a execução.

O valor de progressão do MCP deve ser incrementado. Após a conclusão ou a eliminação, todos os avisos devem ser imediatamente interrompidos.

## Peliculação de eliminação não é igual a `tasks/cancel`

Os dois mecanismos resolvem problemas de níveis de ciclo de vida completamente diferentes.

| 机制 | 作用目标 | 线路信号 | 成功意味着什么 |
|-----------|--------|--------|--------------------|
| stdio 上的请求取消 | 单次在途 RPC | `notifications/cancelled` | 客户端放弃了该请求；若可行服务端应当停止执行 |
| HTTP 上的请求取消 | 单个在途响应流 | 关闭该流 | 客户端放弃了该请求；若可行服务端应当停止执行 |
| `tasks/cancel` | 单个持久化 Task | 普通 MCP 请求 | 服务端已确认收到取消意图 |

`tasks/cancel`O sucesso da sua utilização não demonstra que o trabalhador da retaguarda já parou de funcionar.`working`status, até que o trabalhador em um ponto de inspecção (checkpoint) perceba até que o sinal seja eliminado; trabalho também pode ter sido executado com sucesso antes de perceber que o sinal é eliminado.

Quando o HTTP  ligação foi interrompida,**绝不要**清除持久化任务的状态―― criar tarefas O objetivo inicial da tarefa era permitir que seu ciclo de vida pudesse superar as limitações de uma única solicitação e de uma única ligação―

## Novos ID JSON-RPC  absolutamente não é igual a 等性

O JSON-RPC id é usado apenas para ligar a solicitações e respostas, elas absolutamente não representam a operação de negócios em si.

假设客户端提交一笔账单扣款 (seja como o caso)`41`), no meio do caminho perdeu a resposta do serviço, depois o cliente utilizou o id `42`O serviço vê duas mensagens muito diferentes. Se não houver uma única identificação da aplicação, o serviço não pode perceber que representam a mesma solicitação de contabilidade.

等键 (等键)                                                                                                                                                                                                                                                           

```json
{
  "name": "charge_account",
  "arguments": {
    "account": "acct-7",
    "cents": 1200,
    "idempotencyKey": "checkout-7"
  }
}
```

服务端会持久化记录:

- 等键;
- 操作参数的哈希指纹(emprego do argumento);
- 已提交的执行结果──

A mesma chave com o mesmo parâmetro retornará diretamente ao resultado do armazenamento anterior. Se a mesma chave tiver parâmetros diferentes, será definitivamente rejeitada. Isso pode evitar que a utilização errada de outras chaves e outros parâmetros alterem a operação de negócios.

### 账本边界 必须具有原子性和持久性

Os seguintes procedimentos de execução são extremamente perigosos e inseguros:

```text
check key（检查键是否存在）
run mutation（执行写操作）
store result（存储执行结果）
```

O trabalhador pode simultaneamente descobrir que a chave não existe, e ao mesmo tempo executar a operação de escrita com efeitos secundários.

Este curso utiliza SQLite 账本, baseado em documentos.`BEGIN IMMEDIATE`O cheque de chave ‒ simulação de efeitos colaterais do negócio ‒ calculador de execução e armazenamento de resultados são todos sequenciados na mesma transação ‒ mesmo que duas contabilidade independentes conectadas usem a mesma chave ‒ também produzirá apenas uma execução real do negócio ‒ e registrará um resultado já enviado ‒ fechado e reaberto o arquivo de contabilidade, o registro histórico permanece completo ‒

Todos os valores de devolução são gerados através de JSON de armazenamento de recomposição de recomposição. O utilizador não obtém diretamente a citação de objetos variáveis que possuem dentro da conta, eliminando assim os riscos de modificação do código de devolução e de contaminação.

Os efeitos secundários do negócio em simulador são os de receitas e contabilidade no mesmo negócio SQLite. Em um ambiente de produção, o pagamento real, a implantação de recipientes ou a utilização de API externas, não é absolutamente necessário escrever um registro para obter automaticamente o atômico em uma tabela de dados local. A estrutura de produção precisa depender de uma caixa de dados distribuída, transações, ou requer que o fornecedor de serviços apoie o mesmo tipo de chave.

### 重试决策矩阵

Antes de realizar a lógica de re-teste, é necessário realizar a re-teste claramente.

| 类别 | 示例 | 重试规则 |
|------|---------|------------|
| 安全（Safe） | 无副作用的确定性读操作 | 在明确故障边界后，可使用新的 JSON-RPC id 直接重试 |
| 有条件（Conditional） | 具备持久化幂等键的写操作（Mutation） | 必须使用完全相同的幂等键和完全相同的参数发起重试 |
| 不安全（Unsafe） | 未提供业务去重机制的写操作 | 严禁自动重试；必须先进入人工或系统对账调和流程 |

工具描述符中附带的                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `readOnlyHint`和 `idempotentHint`A segurança real dos testes de reexame depende totalmente da implementação dos acordos de nível de aplicação e da implementação dos serviços.

## O "backpress" é parte da "correção"

A velocidade de gerar eventos de progressão dos produtores de SSE pode exceder muito a capacidade de consumo do cliente, agente ou rede de ligação. Uma cotação ilimitada de um número ilimitado de redes transformará o congestionamento em memória.

必須採用有界隊列 (→ "Lei limitada"),并明确定义在过载中可以牺牲什么──

进度通知是可替代的. Para a mesma ordem de progresso, o valor de progresso posterior naturalmente substitui o anterior valor.

Esta classe realiza as seguintes estratégias de controle de fluxo:

1. 合并(Coalesce) mesma令牌相邻的进度更新;
2. Quando a linha de comandos atinge o limite de capacidade, abandone os dados de avanço mais antigos;
3. O evento é marcado por "necessidade de autoridade e de reformulação autorizada".
4. 始终完整保留最终响应;
5. Se a retenção da resposta final for necessária para ser abandonada a preço de outra resposta final, rejeita este estado.

É um mecanismo de recuperação definido.

### 代理缓冲问题

O serviço pode ser executado em um processo perfeito, enquanto o agente intermediário é executado em um processo de autoconclusão.

Para a resposta da SSE, deve-se apresentar as seguintes respostas:

```http
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            `X-Accel-Buffering: no`, para que um servidor de agência como Nginx possa enviar eventos instantaneamente ao cliente.

 Para o longo prazo em estado de silêncio,                                                                                                                                                                                                                                                         

```text
:
```

O cliente irá automaticamente ignorar o comentário.

传输保活不等于业务进步――绝不能因为收到了传输层的保活注释就顺带重新置业操作的语义空超时计时器――

## Gravar significa re-recarregá-lo

现代 Streamable HTTP 协议**不支持** através `Last-Event-ID`- Fazer um corte de sangue.

- Não .`subscriptions/listen`事件流意外中断后:

1. Utilize totalmente novo JSON-RPC id 发起新的监听请求;
2. Registrar novamente os requisitos de inscrição;
3. 调用权威接口全量拉取可能受影响的工具,资源,提示或任务;
4. De acordo com a estabilidade, a única identificação da área completa para o estado de aplicação é a de reversão;
5. Não se deve apenas por causa da perda de resposta anterior, re-apropriar a operação de risco não protegida.

O programa de recuperação no exemplo será evidente.`sendLastEventId`Configuração para falso, e lista os recursos necessários para a recuperação total.

### 防止重连风暴 (efeito de rebanho)

Se 10 mil clientes estiverem conectados novamente em um segundo após a interrupção, o serviço que está recuperado será novamente conectado.

 deve ser adotado                                                                                                                                                                                                                                                            

```text
attempt 0: up to 250 ms
attempt 1: up to 500 ms
attempt 2: up to 1000 ms
...
cap: 8000 ms
```

O ambiente de produção pode ser adotado em termos de segurança de código como número de eventos ou número de eventos em execução. O núcleo da invariabilidade é a separação da distribuição do tempo, e não a própria fórmula matemática específica.

## Handwriting realizado

`code/main.py`Construído cinco componentes essenciais de refinamento:

### `RequestCoordinator`

-  iniciar o processo de solicitação e manter o espaço com o máximo de dois períodos de intervalo;
- 发送单调递增的进度通知;
- Por estúdio e HTTP, separar-se-á de gerar regras de eliminação de sinais;
- 忽略非法的取消通知;
-  a situação final entre a decisão de anulação e a conclusão;
- 确保服务端发起的取消仅用于studio 订阅。

### `MutationLedger`

- 演示在缺乏业务键的情况下, usar duas vezes id JSON-RPC diferentes resultaria em duas repetições de execução;
- Utilizando SQLite baseado em documentos de negócios, que se baseia em dados de verificação de dados, simulação de resultados de negócios, calculadores de execução e apresentação de resultados;
- 支持跨多独立账本连接, executar a integração de todos os parâmetros em função dos mesmos tecidos e elementos totalmente uniformes;
- Recusar a utilização da mesma chave, mas alterar os parâmetros;
-  Retorno de defesa  profunda cópia,  retorno de dados submetidos  após reabertura do arquivo de contabilidade 

### `DurableTaskService`

- Para o pedido de confirmação de reconhecimento;
- 保持 任务 处于 `working`status, até que o trabalho fique em check-in até que o marcador;
- Intuito mostra por que a confirmação de recebimento não é igual a uma tarefa terminada.

### `BoundedSseBuffer`

- Em alta pressão de volta, baixo pressão de volta,
- 明确记录当前流已需要进行权威数据全量重拉;
- Não deixe de responder.

### 恢复辅助工具

- 输出适用于代理环境的 SSE标标题与保活心跳注释;
- O programa de execução de uma ligação completa e de uma ligação completa com uma carga de peso de volume;
-  Adotar índices de regresso de algoritmos de determinação e de re-essajamento 

## 运行验证

Do código-fonte do catálogo:

```bash
cd phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code
python3 main.py
python3 -m unittest discover tests -v
```

O programa de demonstração irá demonstrar, em seguida, as duas direções do estado do núcleo de competências, a realização de operações de escrita baseadas em transações em documentos temporários SQLite  contabilidade, a pressão sobrecarregada sobre a área de amortecimento de progressos de fronteira, bem como a demonstração da tarefa de perpetuidade como a transição de uma tarefa de um passo a outro para uma tarefa de trabalho de observação e confirmação de uma tarefa de manutenção.

## 交互式实验

Em qualquer prolongamento do sono, executar quatro eventos específicos em ordem:

1.  iniciação de pedido `A`,将其取消,调用 `complete()`- Não.
2.  iniciação de pedido `B`, a concluir, depois enviar o sinal de eliminação até o final.
3.  iniciação de pedido `C`, em cada vez que o super-hora antes de todos os eventos de progressão, mas a última ruptura é o maior valor absoluto super-hora.
4. Em Streamable HTTP 上 inicialização de solicitação `D`,并直接关闭其响应流──

para cada cenário, registos:

- Solicitação final de seu lugar final;
- Se tiver produzido a resposta final;
- O sinal de eliminação emitido no caminho de comunicação é em forma específica;
- O cliente deve activamente ignorar qualquer evento.

Então vai ser o cenário.`D`改为studio 传输―― operação de negócios totalmente uniforme, mas o sinal de eliminação produzido na linha de comunicação deve mudar―

## 动手实践

Por`MutationLedger`扩展一个 `reserve_inventory`(库存预留) escrevi operação

需求规范:

1. 等键需绑定 SKU、数量、租户以及操作名称──
2. Usando a mesma chave e o mesmo parâmetro, deve retornar diretamente ao resultado de reserva da primeira geração.
3. Utiliza o mesmo teclado, mas quando o número de reservas é alterado, deve ser re-rejeitado e não deve ser re-rejeitado.
4. Quando a operação de redação foi enviada no serviço, mas a resposta foi perdida no caminho de reenvio, o apoio é necessário para o início da verificação da conta.
5. ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡   ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡  ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡  ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡ ‡   ‡ ‡ ‡ ‡
6. Se o cliente não fornecer o mesmo, desligue directamente o mecanismo de reexame automático.
7. 模拟订阅流意外断开的情景,在决定后续动作前,先对该库存记录执行权威全量重拉──
8. 启动两个位于同步屏障 (Barrier) 前的账本连接,并发提交同一个等键──断言全局只有一次预留成功提交──
9. 改第一次回归的预留对象──重新传入该键进行重放, provando que os resultados reais do armazenamento de fundo não foram contaminados──
10. 关闭并重新开账本文件,通过键核验预留数据完好无损──

Por favor, mantenha a sua confiança: se os dados de reserva existem na realidade em outro micro-serviço independente, faça-se bem claro se o micro-serviço suporta a mesma chave, ou se deve ser introduzido em transações (transacções) para se comunicar com o submetedor local e os efeitos secundários da distância.

## 交付产物

`outputs/skill-mcp-reliability-reviewer.md`É uma habilidade de revisão de confiabilidade altamente replicável. Fornece MCP 操作、 运输层、超时策略、 重试规则、队列策略以及恢复机制, é capaz de gerar um quadro de análise de competências completo、 重试分类表、等边界定义、流量控制检查清单以及对应故障测试例──

## 验证标准

Quando todas as seguintes finalidades forem alcançadas, o objetivo da secção é concluir:

- estudio 取消操作发送 `notifications/cancelled`且不接收任何响应── não recebi nenhuma resposta.
- Streamable HTTP 取消操作直接关闭响应流,绝不发送多余的取消 POST 请求。
- 先取消后完成能正确抑制并抹除最终响应──
- Primer completando o seu sinal de eliminação  poder manter a resposta legal e silenciosamente ignorar o seu sinal de eliminação 
- O aviso de progressão pode ser re-imposto em tempo superfluo, mas não pode ser adiado em tempo superfluo.
-  Apenas a alteração de um novo ID JSON-RPC resultaria em uma operação de escrita sem proteção executada duas vezes
- Em duplo estado de ligação, o mesmo  igual e o mesmo tecido com parâmetros concordantes só são executados uma vez.
- 已提交记录在关闭并重新开后完好保存,且重放返回是防御性副本──
- Objetos de retorno modificados não podem danificar o armazenamento de dados de duração de nível inferior.
- Há limites de capacidade sob pressão, sob controlo rigoroso, e não se perde a resposta final.
- O mecanismo de ligação é o seguinte:`Last-Event-ID`,并全量重拉受影响状态──
- `tasks/cancel`O trabalho de verificação de desempenho no trabalhador é de um ponto de observação.

## O sistema de produção

| 故障现象 | 观察到的表象 | 正确处理方案 |
|---------|--------------------|------------------|
| HTTP 客户端 POST 发送取消通知 | 服务端与客户端对请求的生命周期产生分歧 | 直接关闭该请求专有的 SSE 响应流 |
| 服务端在接受取消后依然回传响应 | 客户端收到一份已无法使用的陈旧无用结果 | 当取消获胜时停止业务计算并抑制所有后续消息 |
| 进度通知无限重置所有超时时钟 | 挂起卡死的任务永久占用资源无法退出 | 维持一个独立的全局绝对最大超时硬上限 |
| 将新的 RPC id 当成请求去重依据 | 扣款、发布或删除操作被多次重复执行 | 在应用层引入并强制校验持久化幂等键 |
| 键检查与业务副作用彼此分离 | 并发执行的多个 worker 同时判定键不存在 | 将键占位、副作用记录与结果提交放入单次原子事务 |
| 在多副本集群中使用内存级账本 | 节点重启或换到另一台机器后遗忘了先前的提交 | 使用持久化共享存储或依赖上游系统的幂等支持 |
| 直接返回底层存储的可变对象引用 | 调用方的内存修改意外污染了后续重放结果 | 将提交结果序列化存储，返回时构造深拷贝副本 |
| 相同的键被复用于篡改后的参数 | 单个幂等键混淆了两种不同的业务意图 | 持久化记录并校验调用参数的哈希指纹 |
| 进度通知队列无界增长 | 遇到慢消费者时服务内存持续飙升直至 OOM | 在容量限制内对可替代的进度通知进行合并与淘汰 |
| 在高压下误丢弃了最终响应 | 客户端永远无法获知该请求的最终成败 | 预留专用容量或只淘汰进度通知，绝不丢弃最终响应 |
| 反向代理缓冲了 SSE 事件 | 进度事件呈突发性到达，或在全部执行完后才下发 | 禁用代理缓冲（`X-Accel-Buffering: no`）并调整代理超时 |
| 盲目假定支持 `Last-Event-ID` | 客户端尝试从服务端根本不支持的位点续传 | 使用新请求重连并向权威数据源全量拉取 |
| 所有客户端在断开后同一瞬间重连 | 系统恢复的瞬间引发严重的次生雪崩风暴 | 采用带上限保护、结合随机抖动的指数退避重连机制 |
| 将 Task 的确认回执当成已完成取消 | 前端界面显示已停止，而后台 worker 仍在计费运行 | 持续轮询 Task 状态直到其真正进入终态 |

## Capstone 串联

工具生态 Capstone 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目 项目

Capstone  deve fornecer os seguintes títulos de entrega:

-  a execução de cada tipo de acordo de transmissão;
-  para todas as re-essay decision matrices das operações expostas;
-  registos de permanência de tecidos e de interceptação de parâmetros incompatíveis;
- Equação de dados de controlo de dados, verificação de dados de controlo de dados e testes de isolamento de objetos;
- Código de gestão de tráfego sob o estado de carga;
- Configuração de etiquetas e estratégias de segurança de SSE contrárias ao agente;
- Identificar o programa de recuperação de volume total da ligação de transferência de dados;
- Em Introdução de tarefas  Expansão, completa de perpetuar tarefa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

A utilização bem-sucedida de um processo local só pode provar que a sua função básica foi executada. Somente quando o desempenho de um consumidor lento e lento é perdido, o seu Capstone é realmente preparado para a produção.

## 关键术语

| 术语 | 含义 |
|------|---------|
| 请求取消（Request cancellation） | 放弃单次处于在途状态的 MCP RPC 请求 |
| 取消竞态（Cancellation race） | 终态执行完成与取消信号抵达之间的时序争夺 |
| 空闲超时（Idle timeout） | 距离上一次产生有效请求活动的最大允许时间 |
| 最大超时（Maximum timeout） | 从请求开始时刻算起、不受进度通知影响的全局绝对时间上限 |
| 幂等键（Idempotency key） | 唯一标识单次特定业务意图的应用层去重标识符 |
| 原子账本（Atomic ledger） | 将键校验、副作用记录与结果提交绑定为不可分割单元的持久化存储 |
| 背压（Backpressure） | 在生产者生成速度超过消费者处理能力时施加的流量控制机制 |
| 进度合并（Progress coalescing） | 用更新的权威进度数值替换掉旧的进度更新 |
| 权威重拉（Refetch） | 在数据流中断或出现断层后，向权威接口重新读取当前全量状态 |
| 抖动（Jitter） | 在重试退避间隔中引入的随机偏移，用于在时间轴上打散瞬时并发高峰 |

## 延伸阅读

- [MCP 请求取消机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation)
- [MCP 进度通知规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- [MCP Streamable HTTP 传输规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Tasks 扩展规范提案](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
