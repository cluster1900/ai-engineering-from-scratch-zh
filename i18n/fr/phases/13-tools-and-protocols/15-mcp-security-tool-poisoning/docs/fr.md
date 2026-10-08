# MCP 安全:元数据投毒、路由与MRTR 状态

> 无状态不意味零信任(non-confiance) ·············································································································································································································································································································································································································································································································

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~60 minutes

## Objectif de l'apprentissage

- La description de l'outil, les annotations, les informations clientèle et les informations du service sont considérées comme des données incroyables.
- 检测元数据投毒(poison des métadonnées) ‧descriptor 恶意改 ‧rug pull) ainsi que name konflik与遮蔽 ‧shading ‧跨服务器 的名字冲突与遮蔽
- 验证 2026-07-28 版本 版本 请求元数据与流通 HTTP 路由头部──
-  protéger le MRTR `requestState`免受改,并将人工确认与精确调用论据 强绑定──
- L'accord de ratification est en cours de révision et le taux de ratification est limité.

##  problématique

模型 relies sur la lecture de l'outil description  pour décider de quoi utiliser  pour décider de quoi utiliser  pour décider de la demande d'envoi  pour décider de l'envoi de la requête  pour décider de l'opération  pour décider de la description de l'outil  pour décider de la description de l'outil  pour décider de la description de l'outil  pour décider de l'envoi de la requête  pour décider de la description de l'opération  pour décider de la mise en œuvre de l'outil  pour décider de la mise en œuvre de l'outil  pour décider de la mise en œuvre de l'outil  pour décider de la mise en œuvre d'un descripteur mal intentionné, il suffit d'un descripteur pour déclencher une attaque simultanément contre ces trois personnes 

Les directives de sécurité officielles du MCP sont très directes: à moins que les descriptions et les annotations ne proviennent d'un serveur entièrement fiable, sinon une loi devrait être considérée comme incroyable.

Le protocole précédent a également changé les frontières de sécurité. Dans le protocole central de 2026-07-28, il n'y a pas de phase de main-d'œuvre, pas de session de niveau de transmission.`Mcp-Session-Id`Pour ce qui est de la mise en place de la certification de ratification, de la limitation de la vitesse ou de la conception de la sécurité de l'audit, tout a cessé de se conformer aux normes de l'accord actuel.

## 概念

### Les sept grands attaques qui méritent d'être examinées

Au lieu de vous rappeler de manière floue, suivez une liste de défense claire:

1. **元数据投毒（Metadata poisoning）：**Description dans lequel est intégré l'outil de déclaration  comportement complètement sans rapport avec les instructions 如提示注入、越狱) 
2. **Descriptor 恶意篡改（Descriptor rug pull）：** nom ‧ description ‧ schéma ‧ annotation  发生静默变更──
3. **跨 server 名字遮蔽（Cross-server shadowing）：**Les deux derniers extrémités ont révélé le même nom de l'outil non limité, tandis que le routeur a choisi l'un d'entre eux en fonction de l'ordre d'enregistrement.
4. **Header 与 Body 混淆（Header and body confusion）：**HTTP 头部 `Mcp-Method`Ou `Mcp-Name`Le contenu de la requête ne correspond pas à JSON-RPC.
5. **Capability 权限提权（Capability escalation）：**Le serveur  err err err errement considère cette déclaration comme une attestation autorisée 
6. **MRTR 状态篡改（MRTR state tampering）：**客户端 改了                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `requestState`、 répond à une autre question de confirmation complètement différente, ou de réutiliser l'ancien certificat de confirmation pour les arguments suivants:
7. **供应链身份混淆（Supply-chain identity confusion）：**Pour obtenir un nom d'affichage apparemment familier, vous devez être un éditeur ou un serveur.

Ces attaques sont souvent liées entre elles. Haciers de hachage permettent de détecter les conséquences de la description, mais ne peuvent pas prouver la sécurité de la description initiale.

### La première demande de confiance est une preuve, et non une identité.

Chaque requête de la version 2026-07-28 contient:

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

Pour chaque requête, il faut vérifier la version du protocole et la validité structurelle de la capacité.**绝不能**Je ne sais pas .`clientInfo`Lorsqu'il est certifié, il est uniquement des données du client.

Une mise en garde similaire s'applique également aux résultats de l'analyse.`io.modelcontextprotocol/serverInfo`Il est très utile pour les registres et les enquêtes, mais il n'est ni un certificat numérique, ni un certificat de registre, ni plus que la base de décision autorisée.

### Prévé en route, réécrire la stratégie

Pour le`tools/call`,Le niveau de transmission HTTP diffusable contient les sections suivantes:

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

Le nom du titre doit correspondre à celui du corps.`params.name`完全一致──在选择后端、应用 RBAC(基于角色的访问控制) 之前, une fois détecté non conforme, il faut immédiatement revenir `-32020`错误进行拒绝──

Ce type de séquence de vérification élimine les lacunes de la diffusion courante: empêcher l'apparition d'un composant basé sur l'autorité, tandis qu'un autre composant de connexion est basé sur la situation du routeur de l'en-tête.

底层报文验证遵循严格的时间序:先验证 JSON-RPC 和元数据类型,比对头与体值,然后检查匹配的版本是否支持──头不匹配返回HTTP 400与错误码`-32020`Si l'en-tête et le corps sont uniques mais que la version n'est pas prise en charge, retournez à HTTP 400 avec le code d'erreur `-32022`, et`data`必須精确為 `{"supported":["2026-07-28"],"requested":"<actual>"}`◊ Si vous avez demandé un moyen inconnu, alors retournez HTTP 404 avec le code d'erreur `-32601`Il y a une autre.

Lorsque les accords nécessitent une récupération structurée de l'information, chaque objet d'erreur peut contenir des options.`data`字段──由于通知(notification) pas de`id`, il ne recevra donc jamais de réponse réussie ou erronée JSON-RPC.

### Pour l'ensemble du descripteur  effectuer hash lock 

仅对描述 计算哈希会遗漏 schema 和注释 的改──必须对用户批准的所有描述符 字段进行规范化(canonize)并计算哈希:

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

La digestion est stockée dans une clé totalement limitée.`notes.export`)), et enregistré dans l'environnement de production des certificats et du temps d'approbation des éditeurs.

En chaque fois que vous découvrez:

- Il faut qu'il soit en quarantaine jusqu'à ce que la vérification soit terminée.
- Comme un mauvais dessein, il est nécessaire de se séparer de l'autre jusqu'à ce qu'il soit réapprouvé.
- 重复的未限定名称: exigences de détermination de la définition du nom de l'espace de répartition.
- 静态扫描命中:拦截并全面审查整个描述器──

哈希一致 ne peut prouver que le contenu n'a pas changé, ne peut pas prouver sa sécurité de nature.

### L'état de l'air est un signal

Un modèle simple de correspondance est capable de détecter les caractères de marque, les commandes de couverture, les comportements cachés, les visites secrètes et les destinations de connexion douteuses.

Mais le contrôle statique ne peut être utilisé comme preuve de la parole. Une description sûre peut contenir des mots marqués dans les avertissements de sécurité légaux; une description mal intentionnée élaborée peut éviter complètement tous les mots clés.

### 合并之前进行命名空间隔离

Supposons que deux serveurs soient dévoilés .`search`L'outil ne peut être déterminé par l'ordre de l'enregistrement.

```text
notes.search
issues.search
```

完全限定名就是对外曝光的门户 公共名称.`Mcp-Name`路由全部指向同一实体对象──

### Capacités sont déclarations de compatibilité

Dans chaque requête .`clientCapabilities`只是 informer le serveur 客户端 capable de traiter quelles caractéristiques du protocole.**绝不代表** accorder aux clients le droit d'accéder aux outils, aux données ou à l'exploitation

授权仍然完全来自已认证的主体 (主体) 主要) 与资源策略──严格的执行步骤为:

1. 认证传输层凭证──
2. 验证协议版本、header ainsi que la structure des demandes
3. 检查能力 兼容性──
4. Pour les sujets, outils, ressources et arguments, le droit de faire le choix.
5. 执行操作或向用户请求输入──

###  protection sans état MRTR  confirmer

具有重大影响的工具 (outil conséquent) 可能需要用户确认──当前 MCP 采用多往回请求 (多往回请求)  MRTR),而不是 serveur到客户端的反向回调──

Première réponse:

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

客户端 obtenir l'entrée utilisateur, utiliser le nouveau JSON-RPC id 重试原始方法:

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

Chaque .`inputRequests`La valeur est un contenu.`method`et `params`La requête intégrale de l'intégralité de l'intégralité du nom doit être accompagnée.`inputResponses`En ce qui concerne les éléments de l'article, le rapport est basé sur le point de vue de l'article.`requestedSchema`, et le client doit avoir la capacité d'obtenir des formulaires sur le serveur 发起请求前已声明──

Les accords précédents ont deux types de capacité juridique unique:`{"elicitation":{}}`隐式支持表单; et `{"elicitation":{"form":{}}}`Pour une déclaration explicite, il suffit de déclarer l'URL 支持(exemple `{"elicitation":{"url":{}}}`),则不支持表单请求──此时服务器会返回 HTTP 400 与错误码 `-32021`, et`data.requiredCapabilities`Pour`{"elicitation":{"form":{}}}`Il y a une autre.

Il faut que ça arrive.`requestState`Il est également utilisé pour la définition de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur de la valeur.

Nonce 账本绝不能仅存在单台门户内存中──可运行模型注入一个有限的、带 TTL 清理的防重放存储,可由多个门户 实例共享──其原子性核销售(atomic claim) constitue la limite d'exécution: seule une opération de consentement ou une fin manifeste de refus est censée consommer cet état──format de réponse à une erreur ou`cancel`Il n'exécute aucune opération et reste en état de réessaie à l'avance.

切勿将确认上下文藏在某协议会议中──集群中的任何一个服务器 实例都必须能够独立验证重试请求──

### Règlement de deux)

Les trois dimensions pour une modification sont classées:

- Il est nécessaire de faire des efforts pour améliorer la qualité de la vie.
- Y a-t-il ou non accès à des données sensibles ?
- Il y aura des effets externes majeurs irréversibles.

Aucune étape d'automatisation unique ne peut avoir ces trois caractéristiques en même temps. Une fois assemblé, il faut la décomposition, la réduction des droits ou l'introduction d'une confirmation humaine explicite par le biais du MRTR.

### Dans le cadre de la mise en œuvre de la loi sur les droits de douane, la Commission a adopté une décision de la Commission concernant la réduction des droits de douane.

无状态本身不等于安全―― il élimine cependant le risque de conflit caché, mais une demande d'autocontenu peut encore utiliser un gestionnaire trop autorisé 泄露 des données ou causer une destruction irréversible―― la vraie sécurité provient de la contraction des droits dans chaque niveau de bord:

1. **类型化动词（Typed verb）：**暴露单一受限操作(如 `archive_note`), au lieu de la panéalisation `run`Ou `request`Ce type d'outil peut dériver de la capacité non prévue.
2. **校验参数（Validated arguments）：**尽可能采用封闭的方案,拒绝未知字段,进行单次规范化标识符,限制用负载大小,并评估策略前验证目标地址、租户归属与资源所有权──
3. **即时鉴权（Current authorization）：**Les données de référence sont fournies par le service de l'information et de l'information.
4. **绑定动作的审批（Action-bound approval）：** Pour une modification à fort impact, la rédaction de l'approbation artificielle et des paramètres de typographie et de normalisation  liée, et ajoutée à la matière ▌délais de péremption et stratégie unique de validité ▌, toute modification des paramètres doit être réinitialisée ▌
5. **一等拒绝（First-class refusal）：**Il est impossible de refuser la révision de la révision des droits de l'utilisateur en tant qu'outil de sélection plus faible.
6. **脱敏审计证据（Redacted audit evidence）：**记录请求者、采用入口描述与策略版本、授权规范化目标、允许或拒绝的原因,以及是否已经开始执行──在日志中记录 digest或脱敏值而非密钥明文──

Chaque élément est en charge de l'unité de pouvoir exécuté. Le processus de traitement final doit être reçu par un ordre de domaine validé, et non par un certificat de licence de modèle original. Lors du retrait de la mise à jour des tâches ou du transfert de la mise à jour du réseau MRTR, il doit être réintégré dans le réseau.

### Actualités et activités

En 2026-07-28 规范中,Roots、Sampling and Logging 针对新实现已正式废弃──Gateway 只有旧版本请求通道代码作为受版本门禁控制的后兼容路径保留──

 ne pas se tourner autour de l'échantillonnage par session  limiter                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

### 无状态 Transports 检查项

- Dans un seul post, on reçoit le MCP moderne.
- Pour les modèles modernes GET et DELETE à l'intention de ce point de contact, la méthode 405 n'est pas autorisée.
- Ne génère ni ne dépend`Mcp-Session-Id`Il y a une autre.
- 忽略旧版会议 和重放头部, doit être considéré comme une entrée autorisée.
- Pour ce POST, demandez de retourner le domaine de fonctionnement de JSON ou de la classe de demande.
-  seulement dans des situations clairement établies par les deux parties, utilisation `subscriptions/listen`收到长生命周期的变更通知──

```figure
tp-tool-poisoning
```

## 动手构建

`code/main.py` réaliser un modèle de sécurité en ligne de niveau léger dans le processus  Il est utilisé pour la normalisation et le blocage des outils complets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `requestState`Avec le stockage de la réserve de stockage partagé injectable, le processus d'exportation a été achevé en deux rounds avec confirmation.

Le modèle est lancé dans l'adaptateur HTTP pour résoudre JSON.`Content-Type`Ou `Accept` Vous pouvez connecter le même émetteur à un connecteur HTTP en continu complet dans la classe 9, la dernière exigence obligatoire `Content-Type: application/json`且 `Accept`En même temps`application/json`Avec `text/event-stream`Il y a une autre.

Je vais le faire.

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Pour les résultats de test, les données sont fournies par un navigateur.`input_required`Résumé du projet de révision de la loi de l'Union européenne

## Utilisez-le

 将代码中的 `SAFE_TOOLS`替换为您的自认的服务器 规范化快照. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥. 快照中不要包含敏感凭证和密钥.

Au niveau du réseau, lors de la découverte du service, l'exécution de ce système de contrôle, et la mise en œuvre officielle avant de la réutiliser. Le caisse peut réduire les dépenses de réapprovisionnement, mais lorsque le descripteur change, l'état de la mise en œuvre du caisse doit être immédiatement épuisé ou expiré.

## Je le livre.

本课交付 `outputs/skill-mcp-threat-model.md`Il fournit un ensemble de compétences de modélisation des menaces pour les protocoles actuels, une couverture globale des données, des routes, des capacités, des autorisations, des MRTR, des caisses, des registres et des limites de compatibilité.

## 课后深练习

1. Le test de réévaluation est effectué en fonction de la nature de l'objet et de la nature de l'objet.
2. Pour le traitement de la réserve de données, il est nécessaire de modifier la réserve de données à la base de données en utilisant les conditions de conservation des données.
3. Dans le cas d'un défaut de système, la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en élaborée de la mise en élaborée de la mise en la mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise en mise.
4.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `inputSchema`En effet, les données de la description de l'ensemble des données sont disponibles dans les différents pays.
5. augmenter une stratégie de sécurité: voir ce que les différents sujets voient `tools/list`存在差异时, prohibit de faire du caching public (caching public)
6. En revanche, connectant un serveur de version ancienne, tout sera déployé en session.`2025-11-25`Je suis en train de faire une petite partie de la vie.

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
