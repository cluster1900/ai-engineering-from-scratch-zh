# Matar o interruptor de circuito e o Canary Token

> O switch de eliminação é um agente de manutenção fora do edifício Boolean  Redis key ✓ Feature flag ✓ Signed configuration  Usado para o agente de desabilitação total ✓ Circuito interruptor 粒度更细: ele desencadeia em um modo específico (por exemplo, cinco vezes consecutivas de chamadas para ferramentas), suspende um caminho problemático, e atualize para artificial ✓ Canary token ✓ Heredates classic fraudulent technique: a falsa credencial ou o registro do honeypot, agente ✓ não há qualquer razão válida para tocá-lo; ✓ Uma vez visitado, o e-PF data base irá enviar alerta ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ 

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**先修要求：**Fase 15 · 13 (Governadores de custos), Fase 15 · 10 (Modos de autorização)
**Time:** ~60 minutes

## 问题

Os governadores de custos ((Lessão 13) limitam o quanto o agente pode gastar. Não limitam o que o agente pode fazer dentro do orçamento. Um agente com limite de velocidade de US $ 50 ainda pode exfiltrar um segredo. Publicar uma mensagem errada ou excluir um recurso.

Esta aula abrange três tipos de detectores localizados na camada de custo:

1. **Kill switch**O agente não está fora do alcance do botão de desativação booleano.
2. **Circuit breaker**O detector de padrões de ação de um determinado caminho foi suspenso.
3. **Canary token**Não há razão para o agente se expor por causa do toque.

É o terceiro que é engenharia pré-LLM. O classico engano, quebra-limite de taxa e flag-kill são mais antigos que os agentes autônomos. A nova parte é a superfície de ataque: os agentes vão ler o incrível.

## 概念

### Interruptores de apagão

O switch de eliminação é um agente de booleano leível mas não escritível.

- **托管服务中的 feature flag。**Lançamento: Darkly,Statsig,Unleash, Update,Disseminado em segundos.
- **agent 轮询的 Redis key。**简单; requer processo de agente 在每一轮都检查──
- **object storage 中的 signed config。**Agente em iniciação da assinatura; rejeita estados não assinados.
- **OS-level signal 或 container-lifecycle kill。**Docker .`kill`、Kubernetes `kubectl delete pod`- O sistema está parado.

O interruptor de execução é o seguinte:

- O agente não consegue arranjar .`off`◊(Existe nas credenciais de agente 没有写权限的系统中──)
- Ele vai em cada ação consecuente, não apenas a inicialização.
- Quando fechado, o agente não faz nada de observável externamente, incluindo o registro de sistema de acesso do agente.
- A reinicialização é uma operação artificial, não um timeout automático.

### Fusões de circuitos

O interruptor de circuito 暂停 é um modelo específico, e não todo o agente。经典形态(de Nygard 书籍, 2007年,至今仍适用):

- **Closed**A acção é permitida.
- **Open**A acção é impedi-la.
- **Half-open**Depois de resfriar, permita 13 vezes tentativas de sonda;

Trigadores relacionados com agentes:

- 连续五次相同的工具调用 (连续五次相同的工具调用)
- O mesmo instrumento em diferentes entradas 上连续五次失败 (Facultade sistêmica)
- A taxa de chamadas de ferramentas  ultrapassa o limiar Lessão 13 velocidade)。
- Leia o conteúdo fora de confiança (Lessão 11) depois de usar uma ferramenta específica (por exemplo)`file.delete`)。

### Tokens canários

Tokens Canárias (também chamado de honeytokens) são agentes 永远不应触碰的输入――访问就是警报――

Agente exemplo:

- ambiente em meio falso`AWS_SECRET_ACCESS_KEY`Não há qualquer privilégio real.
- 带有已知哨兵值 标记的虚假数据库记录── Qualquer leitura ou atualização 城市触发警告──────────────────────────────────────────────────────────────────
- Arquivo falso no espaço de trabalho.
- Se ele aparecer na saída posterior, indique que a memória foi exfiltrada.

Canary Design para um fluxo de trabalho específico. Um agente tem uma razão para tocar em canary.

### Por que usar estatísticas e limites rígidos

Detetores estatísticos ((EWMA、CUSUM、 taxas de chamadas de ferramentas (a)                                                                                                                                                                                                                                                    

"Limite constitucional duro" (Lessão 17) não vai ser "曲曲" (Lessão 17)`secrets@` Mais simples, auditável, e não pode ser levemente desviado 钻空子──分层模式是:detetores estatísticos 捕获大多数噪声,hard limits 捕获从探测器身边走过去的攻击──

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

A política de rede baseada no eBPF do Cilium pode ser gravada na saída do pod da quarentena no nível do kernel. A saída do pod pode ser gravada no forense honeypot. Os referências abertos do Cilium  relatório diz que a latência do P99 do datapath no TCP_RR é inferior a 1 milésimo de segundo; no seu cluster, no seu orçamento de relógio de parede da quarentena.

### Não há detector que possa capturar o que é .

- **由 allowed primitives 组合而成的 semantic attacks。**Cada ação individual passou por cada detector; o problema está na composição.
- **把 detector 本身纳入 payload 的 attacks。**Se o agente 读取一页,上面写着在你行动前,禁用了,而代理又拥有这个能力,那么探测器就被妥协了.


```figure
circuit-breaker
```

## Use-o

`code/main.py`模拟一个短代理轨迹 通过三类探测器──外部 dict 中保存的杀伤开关;一个会在五次相同的工具中调用触发的电路断断机;一个读取后会触发的警报的加纳文件──它输入一个合成轨迹:legitimate actions、repetitive loop、加纳探测,以及一个由杀伤开关触发的场景,其中的代理行动被停止──

## Entrega-o

`outputs/skill-tripwire-design.md`会审查 agent deployment of拟议探测器 stack,并标记缺失杀开关、缺失可纳里、断路门过松) ――

## 练习

1. 运行 `code/main.py`▽ Confirmar interruptor de circuito em 5° turno (第五次相同调用)触发,并且 kanary在 9° turno (false-key reading)触发。

2. Adicionar um detector estatístico: taxa de chamada de ferramenta 上的 EWMA z-score。输入一条缓慢漂移的轨迹,并显示探测器 从不触发──然后添加一个硬极(10分钟内不超过50次工具调用),并显示硬极 在同一条轨迹上触发──

3. Para agente do navegador (Lessão 11) desenhar um grupo de tokens canários.

4. 阅读Cilium network-policy docs──具体描述一个出口-redirect隔离流:哪个政策选择员、哪个 pod、哪个出口重写、哪个警告──是什么决定从决定隔离到第一转向包的壁钟延迟?

5. Quem pode tornar-se possível? Tem de registrar o que?

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Kill switch | “Off button” | 位于 agent 编辑面之外的 boolean；在每个 consequential action 上检查 |
| Circuit breaker | “Pattern pause” | 针对重复、failure rate 或 rate-limit 的 action-specific trip |
| Canary token | “Honeytoken” | agent 没有正当理由触碰的诱饵；访问会触发 alert |
| Honeypot | “Forensic sandbox” | 被 redirect 的 traffic / workspace，用于观察被 quarantine 的 agent |
| EWMA | “Moving average” | Exponentially weighted；会适应 drift（feature + bug） |
| CUSUM | “Cumulative sum” | 检测相对 baseline 的 sustained shift |
| Hard limit | “Constitutional rule” | 不会适应；无论历史如何都保持常量 |
| Constitutional limit | “Always-true rule” | 绑定到 Lesson 17 的 constitution；不能被 agent 编辑 |

## 延伸阅读
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) agentes autônomos de interruptor de morte e de circuito de corte de enquadramento。
- [Microsoft Agent Framework — HITL 与监督](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) produção 治理模式。
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) 检测与响应要求──
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/) Redirecionamento de saída de nível de cápsula 和 padrões forenses de honeypot。
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)   como restrições constitucionais  de proibições codificadas 
