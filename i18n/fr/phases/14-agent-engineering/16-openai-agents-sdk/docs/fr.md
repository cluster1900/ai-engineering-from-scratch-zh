# SDK OpenAI Agents: remise en main, garde-corps, suivi

> OpenAI Agents SDK est basé sur les réponses API de construction de cadres multi-agents de petite taille.`transfer_to_<agent>`Les outils de la garde sont en entrée ou sortie.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Objectif de l'apprentissage
- Il y a cinq primitives du SDK.
- Expliquer les remises: pourquoi elles sont construites comme outils, quel est le nom du modèle, quelle est sa forme et comment le contexte est transféré.
- 区分 input guardrails、output guardrails 和 tool guardrails; expliquer `run_in_parallel`Avec mode de blocage.
- Utilisez le stdlib pour réaliser un temps d'exécution avec des remises + barreaux + traçage en style de décalage.

##  problématique
Les agents délégués incapables de nettoyer le contenu seront finalement mis en un seul prompt. Les agents sans barrières seront livrés PII, en violation des politiques, ou en boucle éternelle.

## 概念
### Cinq primitifs

1. **Agent.**LLM + instruction + outils + remises en main:
2. **Handoff.**déléguer à un autre agent.`transfer_to_<agent_name>`De l'outil.
3. **Guardrail.**Pour chaque outil de fonction, une validation est effectuée.
4. **Session.**跨 turns 的自动对话历史──
5. **Tracing.**Les générations de MLL, les appels à l'outil, les appels à l'aide, les gardes de garde.

### Les outils

模型会在它的工具列表中看 `transfer_to_billing_agent`❖ Réinitialiser le système en temps de course

1. 复制 Context de conversation `nest_handoff_history`La bêta va s'effondrer.
2. Utiliser les instructions de l'agent cible
3. Avec l'agent cible, continuez à courir.

C'est le modèle de supervision de la production.

### Rennes de garde

Trois types:

- **Input guardrails.**Dans toute demande de MLL, il est possible de refuser ou de dépasser la portée de la demande.
- **Output guardrails.**Dans la dernière production d'agent, on capture des fuites d'informations publiques, des violations de politiques, des réponses malformées.
- **Tool guardrails.**按 function-tool 运行──Validation des arguments、permissions de vérification、exécution de l'audit──

Mode:

- **Parallel**(默认) ――Guardrail LLM avec le principal LLM 同时运行。更低尾延迟──如果触发,主要LLM的工作会被丢弃(浪费代币)。
- **Blocking**(le secteur de l'énergie)`run_in_parallel=False`La première fois que vous avez reçu un message, vous avez reçu un message.

Les câbles triphoniques seront jetés`InputGuardrailTripwireTriggered`- Je suis là .`OutputGuardrailTripwireTriggered`Il y a une autre.

### Traçage

Chaque génération de LLM, appel à outils, lancement et garde-ferre émet une durée.`OPENAI_AGENTS_DISABLE_TRACING=1`Je vais sortir.`add_trace_processor(processor)`L'équipe de diffusion sera diffusée jusqu'à votre propre backend, tout en envoyant à l'OpenAI.

### Les séances

`Session`Pour les autres, il est nécessaire de mettre en place un système de gestion de données.`Runner.run(agent, input, session=session)`Il est en train de se charger.

### Cette façon est facile à trouver

- **Handoff drift.**Agente A, dégage à l'agent B, l'agent B, dégage à l'agent A.
- **Guardrail bypass.**Les barreaux d'outils sont uniquement disponibles dans les outils de fonctionnement; outils de mise en place (lecteur de fichiers, récupération de sites Web) nécessitent une politique unique.
- **Over-tracing.**Les données de l'OTEL GenAI sont disponibles dans les domaines de la recherche et de la recherche.


```figure
ae-agent-handoff
```

## - Je le construis.
`code/main.py`Utilisation de la SDK  Forme de mise en œuvre:

- `Agent`- Je suis là.`FunctionTool`- Je suis là.`Handoff`(en tant qu'outil de fonction de transfert)
- 带 input/output/tool guardrails、handoff dispatch 和 hop counter 的 `Runner`Il y a une autre.
- Un émetteur de durée simple, utilisé pour montrer la trace de forme.
- Un agent de triage, en fonction de la requête de l'utilisateur, remet la main à la facturation ou au support; garde-fou, en fonction d'une entrée,

运行:

```
python3 code/main.py
```

Le trace a montré deux remises de main réussies, un voyage sur la barrière d'entrée, ainsi qu'un arbre de débit émettant du contenu par rapport au vrai SDK.

## Utilisez-le
- **OpenAI Agents SDK**Utilisé pour les premiers produits OpenAI.
- **Claude Agent SDK**(Létion 17) Pour les produits de Claude-first.
- **LangGraph**(Létion 13) Pour utiliser la situation dans laquelle vous voulez un état explicite et un CV durable.
- **Custom**Utilisation de la voix, des déploiements multi-fournisseurs, des déploiements fédérés.

## Je le livre.
`outputs/skill-agents-sdk-scaffold.md`Échafaudage Une application SDK Agents, contenant un agent de triage, des supports, des barreaux d'entrée/sortie/outil, un magasin de séances et un processeur de traçage.

## 练习
1. 添加 handoff hop counter: dépassé N 次 transfers 后拒绝;; Suivre ce comportement;;
2. Il va`nest_handoff_history`实现为一个选项:在转前将前文条文崩成一个总结──
3. 编写一个阻断输出 guardrail──比较会触发它的提示与通过提示的延迟──
4. Il va`add_trace_processor`connexion à JSON logger ⋅ Il émet une forme de quoi pour chaque intervalle ?
5. 阅读 SDK doc──将你的ddlib jouet port jusqu'à `openai-agents-python`Où avez-vous été ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | "LLM + instructions" | SDK 中的 Agent type；拥有 tools 和 handoffs |
| Handoff | "Transfer" | 模型调用以 delegate 给另一个 agent 的 tool |
| Guardrail | "Policy check" | 对 input / output / tool invocation 的 validation |
| Tripwire | "Guardrail trip" | guardrail 拒绝时抛出的 exception |
| Session | "History store" | runs 之间持久化的 conversation memory |
| Tracing | "Spans" | 覆盖 LLM + tool + handoff + guardrail 的内置 observability |
| Blocking guardrail | "Sequential check" | Guardrail 先运行；trip 时不浪费 Token |
| Parallel guardrail | "Concurrent check" | Guardrail 同时运行；latency 更低，trip 时浪费 Token |

## 延伸阅读
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) primitifs, manœuvres, garde-corps, traçage
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) Claude 风格's homologue
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) 何時真正应该使用手渡
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Agents SDK étendue 映射到的标准
