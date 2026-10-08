# Matar el interruptor de circuito y el token Canary

> El interruptor de ejecución es un agente de mantenimiento fuera de la red de edición de un agente booleano  Redis key ✓ Feature flag ✓ Signed configuration  Usado para un agente de total desactivación ✓ Circuito interruptor 粒度更细: se desencadena en un modo específico (por ejemplo, cinco llamadas continuas de la misma herramienta), se suspende en un camino problemático, y se actualiza a artificial ✓ Token canario ✓ Heredado de la técnica de engaño clásica: una credencial falsa o un registro de honeypot, agente ✓ No hay ninguna razón válida para tocarlo ✓ Una vez que se visita se emitirá una alerta ✓ Datos de eBPF ✓ Datos de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de datos de la base de datos de la base de datos de la base de datos de la base de datos de datos de la base de datos de datos de la base de datos de datos de la base de datos de datos de la base de datos de datos de la base de datos de la base de datos de datos de datos de la base de datos de datos de la base de datos de la base de datos de datos de la base de datos de datos de

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**先修要求：**Fase 15 · 13 (Gobernadores de costes), Fase 15 · 10 (Modos de autorización)
**Time:** ~60 minutes

##  problemas

Los gobernadores de costos ((Lección 13) limitan lo que el agente puede gastar. Ellos no limitan lo que el agente puede hacer dentro del presupuesto. Un agente que tiene un límite de velocidad de $ 50 todavía puede filtrar un secreto, publicar una publicación errónea, o eliminar un recurso.

Este curso abarca tres tipos de detectores situados en la capa de costos:

1. **Kill switch**: Mantener el agente 触达范围之外的 boolean fuera de botón.
2. **Circuit breaker**: suspender por un tiempo un detector de patrones de acción de un determinado camino.
3. **Canary token**No hay razón para tocar a su agente, se expondrá por el contacto.

Esto es todo antes de la ingeniería LLM. El clásico engaño, el desmantelador de límites de velocidad y el ataque de características son más temprano que los agentes autónomos. La nueva parte es la superficie de ataque: los agentes leerán contenido increíble.

## 概念

### Los interruptores de apagado

El interruptor de ejecución es un agente de boolean legible pero no escritorio.

- **托管服务中的 feature flag。**Lanzamiento: Oscuro, estadístico, desatado, actualizado en unos segundos.
- **agent 轮询的 Redis key。**简单; requerir el proceso del agente 在每一轮都检查──
- **object storage 中的 signed config。**Agente en el inicio de la firma; rechazó estados sin firmar.
- **OS-level signal 或 container-lifecycle kill。**- ¿ Qué ?`kill`、Kubernetes `kubectl delete pod`、Sistema de parada ∙∙

El interruptor de ejecución tiene las siguientes características:

- El agente no puede ponerlo en marcha.`off`◊(Existe en las credenciales de los agentes 没有写权限的系统中──)
- Se ejecutará en cada acción consecuente, no sólo en el inicio de la inspección.
- Cuando se cierra, el agente no hace nada de lo que sea observable externamente, incluyendo el registro de registro del sistema que el agente puede visitar.
- Reactivación es un movimiento humano claro, no un tiempo de espera automático.

### Disruptores de circuitos

El interruptor de circuito 暂停 es un modelo específico, no todo el agente ;;

- **Closed**La acción está permitida.
- **Open**La acción está bloqueada.
- **Half-open**Después de que se enfríe, permita 13 veces intentar la sonda; el fracaso final se cierra y cualquier fallo restante se vuelve a abrir.

Trigadores relacionados con el agente:

- 连续五次相同的工具调用 (连续五次相同的工具调用) 重复循环 (重复循环) 
- La misma herramienta en diferentes entradas 上连续五次失败 (fallo sistémico)
- La velocidad de las llamadas de herramientas  sobrepasa el umbral  Lección 13 velocidad)。
- En el contenido fuera de confianza leer la lección 11) después de调用 un instrumento específico por ejemplo`file.delete`)。

### Tokens de las Canarias

Los tokens canarios (también llamados honeytokens) son agentes de entrada 永远不应触碰的输入――访问就是警报――

Ejemplo de agente:

- medio ambiente en medio falso`AWS_SECRET_ACCESS_KEY`, no tiene ningún privilegio real. Intentos de exfiltración pueden ser inmediatamente atribuidos.
- 带有已知哨兵值 标记的假数据库记录──任何读取或更新都会触发警报──
- En el espacio de trabajo, el archivo falso.
- Inicio de sesión 时注入的假记存输入──如果它出现后续输出中,说明记忆已被过──

Canary  Diseño para enfocarse en un flujo de trabajo específico ∙ Un agente tiene motivos legítimos para tocar canary ∙ Sólo hará ruido ∙

### ¿Por qué separar los niveles de uso de estadísticas y límites duros

Los detectores estadísticos (EWMA, CUSUM, Rate of Tool Calls, Upper Z-score) se adaptarán a la línea de base móvil. Esto es una característica para la deriva legítima, la deriva adversaria es un error.

Los límites constitucionales duros (Lección 17) no se corren.`secrets@` Más simple 、 auditable, y no puede ser desviado lentamente 钻空子──分层模式是: detectores estadísticos 捕获大多数噪音,hard limits 捕获从探测器身边走过去的攻击──

###  A través de la redirección de datos de eBPF  realizar cuarentena

La política de red basada en eBPF de Cilium puede ser escrita en la capa del núcleo para la salida de la cápsula de cuarentena en el módulo forense. Los puntos de referencia públicos de Cilium se refieren a que la latencia de la vía de datos P99 en TCP_RR es inferior a 1 milisegundo. En tu cluster, el presupuesto de la pared de la cuarentena se debe a la actualización de la política.

### No hay detector que capture lo que sea

- **由 allowed primitives 组合而成的 semantic attacks。**Cada acción individual ha pasado por cada detector; el problema está en la composición. Esto es el fallo de la composición del Modo Automático en la Lección 10.
- **把 detector 本身纳入 payload 的 attacks。**Si el agente 读取一页,上面写着在你行动前,禁用了,而代理还拥有这个能力,那么, el detector就被妥协了.


```figure
circuit-breaker
```

## Usalo

`code/main.py`模拟一个短代理轨迹 通过三类探测器──外部 dict 中保存的杀伤开关;一个会在五次相同的工具中调用触发的电路打断器;一个读取后会触发的警报的加拿大文件──它输入一个合成轨迹:合法行动、重复循环、加拿大探测器,以及一个由杀伤开关触发的场景,其中被代理的行动停止──

##  entregarlo

`outputs/skill-tripwire-design.md`La capacidad de detección de los agentes de revisión de la implementación de la pila de detectores de la propuesta,并标记缺缺失杀开关、缺失卡纳里、断路门过松) 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`▽ Confirmar interruptor en la vuelta 5 (第五次相同调用)触发,并且 kanary在转 9 (false-key reading)触发。

2. Añadir un detector estadístico:tales de llamadas de herramienta, por encima de la EWMA z-score.

3. Para el agente del navegador (LECCIÓN 11) diseñar un grupo de tokens canarios.

4. 阅读Cilium network-policy docs──具体描述一个出口转向隔离流:哪个政策选择员、哪个 pod、哪个出口重写、哪个警告──是什么决定从决定隔离到首转向包的墙钟延迟?

5. ¿Quién puede volver a activar? ¿Qué debe registrar?

## 关键术语: "El hombre es un hombre"
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
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) agentes autónomos de interruptor de muerte y enmarcado de interruptor de circuito―
- [Microsoft Agent Framework — HITL 与监督](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) producción 治理模式。
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/) 检测与响应要求──
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/) redirección de salida a nivel de cápsulas y patrones forenses de honeypot。
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  Como prohibiciones codificadas de los límites constitucionales
