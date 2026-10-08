# MCP 模型输入:échantillonnage 迁移与无状态 MRTR

> MCP 2026-07-28 规范弃用面向新设计的样本特性,并移移至服务器向客户端 发送反向请求的通道──若现有工作流仍需使用客户端模型,服务器会返回`input_required` résultat, le client porte le modèle output  teste la requête initiale                                                                                                                                                                                                                                                  

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## Objectif de l'apprentissage

- 解释为什么MCP 2026-07-28 弃用样本,并为新构建的服务器 选择直接集成模型 (直接模型集成) 的默认架构──
- 实现一套兼容工作流, par plusieurs demandes de retour`sampling/createMessage`Il y a une autre.
- Dans chaque requête `_meta`Les possibilités de mise en œuvre de protocoles et de clients sont en jeu.
- Retour`resultType: "input_required"`,并使用全新的 JSON-RPC id 重试原始方法──
- Pour le`requestState`), et il sera lié au principal (principaux) 、 méthode、 paramètres及过期时间──
- à travers la capacité 校验、人工批准、响应验证和轮次上限, une restriction stricte des cycles d'aide au modèle est effectuée.

## Décisions d'architecture avant la conception du protocole

形如 `summarize_repo`Les outils nécessitent généralement deux types de travail:

1. 确定性工作:列出文件、读取允许访问的文件、校验路径以及组装内容──
2. 模型工作:挑选代表性文件并综合生成摘要──

Vous avez deux types de choix juridiques.

### Nouvelle construction Server: directement intégré

C'est la pratique de recommandation par défaut actuelle. Le serveur de mode de gestion automatique de la sélection, de la configuration des qualifications, de la mise en œuvre du budget, de la stratégie de réévaluation et de la visibilité.`tools/call`Le résultat:

Lorsque le serveur est en lui-même un service de gestion, ou lorsque la performance d'un modèle prévisible est plus importante que celle d'un hôte emprunté, veuillez utiliser ce programme.

### 现有 Sampling 工作流: migration vers le MRTR

En période de transition abandonnée, l'échantillonnage est toujours en place.`sampling/createMessage`En revanche, il sera intégré dans la requête.`InputRequiredResult`Je reviens.

 Lorsque le modèle et les preuves du client sont clairement exprimés, il est nécessaire de choisir ce chemin de compatibilité.

## 无状态契约

Le protocole de juillet 2026 a été délégué.`initialize`Je suis là pour vous.`notifications/initialized`et `Mcp-Session-Id` Dans le passé, il y avait des informations entre les mains, maintenant, elles sont portées directement par chaque demande:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Le serveur se trouve dans chaque requête sur la version du protocole.`-32602`△ version non prise en charge `-32022`, et de fournir des données précises, des données`{"supported":["2026-07-28"],"requested":"<client version>"}` Si la capacité d'échantillonnage est manquée 则返回 `-32021`,并将 `data.requiredCapabilities`设为 `{"sampling":{}}`Il y a une autre.

 sans JSON-RPC `id`La communication est une notification, mais la réponse n'est pas réussie, ni l'erreur de réponse.`202 Accepted`Il y a une autre.

Le serveur doit être mis en œuvre avec précision .`supportedVersions`Les capacités`ttlMs`et `cacheScope``server/discover`方法, afin que le client puisse connaître et enregistrer les données du serveur 由于 discovery 声明 `tools`Le serveur doit aussi être obligatoire.`tools/list` de sa détermination`summarize_repo`描述符包含合法的 objet 类型 `inputSchema`- Je suis là.`resultType: "complete"`、serveur, données et données publiques 缓存提示──

Chaque accord moderne réussi contient un juge:

- `resultType: "complete"`Précisez que l'opération est terminée.
- `resultType: "input_required"`Indique que le client doit exécuter la requête d'entrée intégrée et effectuer une nouvelle tentative.
-  Expansion des règles peuvent définir des types de résultats supplémentaires, par exemple dans le chapitre 13  Tasques  Extension augmentée `"task"`Il y a une autre.

## 单轮 MRTR 交互流程

Le serveur n'a pas pu utiliser le client pendant le traitement de la demande. Il a été transféré et a été rendu comme suit:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

Le client 验证自身支持样本,应用其审核批准与模型策略,并获取模型响应――, puis, le client 发送一个带有全新的 JSON-RPC id 的新请求:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

Cette fois-ci n'est pas une continuation de la réunion. C'est une nouvelle demande: la méthode et les paramètres de la réinitialisation, ajoutées uniquement aux précédentes séries.`inputResponses`,并原封不动地逐字节回显 `requestState`Il y a une autre.

MRTR  seulement permis d' apparaître `tools/call`- Je suis là.`prompts/get`et `resources/read`Le serveur ne peut pas revenir de l' abonnement`input_required`Il y a une autre.

## Gestion de l'état

Le cours nécessite deux modèles de régularisation:

1. `pick_files`Retournez à un nombre JSON.
2. `summary`返回最终的摘要文字──

Comme chaque reprise ne porte que la réponse de cette série, le serveur doit être mis en phase de l'essai et les données intermédiaires passées dans la phase suivante.`requestState`Dans le centre.

Veuillez considérer cette valeur comme des données contrôlées par l'attaquant.

- 经过鉴权的主体 (principal authentifié), et non déclarations faites par soi`clientInfo`Le dépôt de la commission
- 发起调用 méthode originale;
- Résumé du premier épisode
- 较短的过期时间;
- La valeur moyenne de la phase précédente et de l'expérience passée.

Lorsqu'un client ne peut absolument pas lire le contenu de l'état, veuillez utiliser le code de dépôt de la signature (enregistrement authentifié)`-32602`Il y a une autre.

Client 绝不能解析或改 `requestState`Il n'a que la seule responsabilité de transmettre le texte.

## 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 模型偏好 偏好 偏偏偏偏

`costPriority`- Je suis là.`speedPriority`Avec `intelligencePriority`Les préférences ne sont pas des préférences de probabilité, et le total ne doit pas être de 1. Le client a un contrôle absolu sur la stratégie du modèle, il est donc possible de les ignorer complètement.

Si vous êtes toujours en train de maintenir l'ancienne version du processus d'échantillonnage, veuillez le faire.`includeContext` garder pour `"none"`◊ Le mode de texte ci-dessus augmente le risque de fuite, et il est lui-même abandonné.

## Sécurité

Pour les échantillons de l'intégration, le client est le seul à pouvoir le faire.

- Lorsque la stratégie exige une approbation artificielle, le serveur montre clairement à l'utilisateur ce que le modèle exige d'exécuter.
- limitation du MRTR 轮次上限── sinon le serveur malintentionné pourrait créer un cycle de consommation de modèles sans fin──
- Avant de faire l'utilisation de l'échantillonnage 响应作为文件名、URL或工具 输入, il doit être examiné de manière stricte.
- Limitation du nombre de caractères et des symboles à chaque tour.
- refuser une demande d'entrée non déclarée dans les capacités du client en cours。
- 避免让模型输出决定授权鉴权逻辑──
- 记录发起的方法及输入请求钥匙, tout en évitant d'entrer dans le journal de contenu rapide ⋅

`clientInfo`et `serverInfo`☐ les données de diagnostic et de démonstration sont uniquement utilisées.

```figure
t3-sampling-flip
```

## Handwriting réalisation

`code/main.py`Il n'est pas dépendant de tout tiers, il a réalisé pleinement un double cycle de retour et de retour:

- `server/discover`Retour`supportedVersions`, déclaration outil 支持,并返回缓存提示。
- `tools/list`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `summarize_repo`描述符──
- `tools/call`校验每个请求的元数据──
- Première résultat intégré dans le choix de fichiers `sampling/createMessage`Il y a une autre.
- Le résultat du premier test de réécriture du modèle n'est pas inséré dans la deuxième requête.
-  protection de l' HMAC `requestState`Dans la phase d'exécution de la demande de sécurité entre les requêtes indépendantes.
- Finalement utilisé`resultType: "complete"`Il y a une autre.

模拟的主机 模型保证了示例的确定性──当连接到真实主机时,只需要更换 `fake_host_model`◊ L'état du serveur doit toujours être déterminé et facile à tester.

## Utilisation et fonctionnement

Dans le catalogue des magasins:

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- Découverte  Retour avec `ttlMs`et `cacheScope`Le résultat complet de la recherche
- Découverte d'outils  retour de la même description,带有 `resultType`、serveur Identité et cache
-  La capacité de manque et la version non prise en charge `-32021`Avec `-32022`Il y a des erreurs.
- 没有 id 的通知 不产生任何 JSON-RPC 响应──
- Veuillez me faire une demande d' id`[1, 2, 3]`, prouver que chaque MRTR est totalement indépendant.
- Les résultats sont classés en:`input_required`Il y a une autre.
- Les résultats finaux sont classés en:`complete`,并包含 les documents choisis ainsi que le résumé final.
- Dans le temps de réessayer, les paramètres originaux changent et la demande de l'état échoue.

## 交付产物

`outputs/skill-sampling-loop-designer.md`现已升级为迁移规划器――它首先决定是否应废弃样本化 改用直接模型集成――如果必须保留兼容性,它会产生MRTR 交互轮次、状态绑定、能力 门禁、预算控制、数据校验以及平稳退役方案――

## 课后练习

1. Pour modifier la réponse de la sélection de fichiers JSON en inefficacité, le serveur sera retourné.`-32602`Il n'y a pas de modèle de confiance à l'aveugle.
2. Modification entre la première et la seconde modification`audience`参数―― expliquer pourquoi l'état post-séquence peut empêcher la répétition de la demande
3.  augmenter la troisième phase de communication, exiger de l'hôte qu'il examine et critique le résumé.  maintenir le résumé précédent dans l'état de signature et restreindre strictement le processus à trois phases maximum.
4. 彻底移除 Sampling:将模拟的宿主回调替换为服务器自持的模型适配器──列出此时有哪些批准、计费和可观测性职责转移到服务器端──
5. 添加一个过期测试:传入一个已过截止期限的状态值 1 second,验证校验失败──

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用特性，用于请求 client 端的模型执行文本补全 |
| MRTR | 多轮往返请求（Multi Round-Trip Requests），用于在请求中获取 client 输入的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果对象 |
| `inputRequests` | Server 分配的映射表，包含内嵌的 elicitation、sampling 或 roots 请求 |
| `inputResponses` | Client 在当前轮次提交的响应，键名与 `inputRequests` 一一对应 |
| `requestState` | 不透明的 server 状态字符串，由 client 原样回显并由 server 校验完整性 |
| `resultType` | 现代 MCP 返回结果中必须包含的类型判别器 |
| 直接模型集成（Direct model integration） | 新建 server 需要模型推理时的官方推荐替代方案 |
| Capability 门禁（Capability gate） | 防止向未声明相应支持的 client 发送内嵌请求的安全规则 |
| 循环预算（Loop budget） | 本次操作允许的最大轮次、token 数、字节数、执行时长以及花费上限 |

## 旧版兼容性

Le client fixe à la version 2025-11-25 peut encore être utilisé sur une connexion en direct avec un serveur ancien.`sampling/createMessage`流程── s'il vous plaît, laissez le comportement strictement séparé de la version des adaptateurs spécialisés── ne pas avoir de discussion comme la structure du serveur 2026-07-28.

官方 SDK 可以将现代的 `input_required`处理程序转换为适应旧版对端的通信――这种片片shim) est une frontière de la capacité de traitement, ce qui ne signifie pas nécessairement que la logique de la nouvelle dépendance soit ajoutée à cette dernière.

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
