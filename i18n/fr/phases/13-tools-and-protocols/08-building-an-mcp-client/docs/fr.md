# Construire MCP Client: service découverte 路由与双时代回归

> Le client MCP moderne rédige un résumé complet de son contrat de communication à chaque requête. Il est le plus difficile de prendre une décision de compatibilité, en jugant que l'ancien serveur est une véritable architecture héréditaire, mais aussi un serveur moderne qui peut être corrigé.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（构建 MCP Server）
**Time:** ~85 分钟

## Objectif de l'apprentissage

- Pour chaque MCP`2026-07-28`S'il vous plaît, veuillez utiliser la dernière enveloppe de données de la société.
- Utilisation `server/discover`探测 basé sur un serveur de studio,并协商双方均支持的版本──
-                                                                                                                                                                                                                                                               
-  seulement en vérifiant la version validée en bonne et due forme `initialize`结果后,才接受 时代
- 合并确定性 Outil Liste, référencement
- Pour les outils de communication, il est nécessaire de mettre en place une session de dialogue.

## 问题背景

L'agent hôte a généralement besoin de plusieurs serveurs MCP pour une communication simultanéne. Il doit trouver chaque serveur, réunir des outils, résoudre des conflits de renommée, et se rétablir de manière stable à partir de la rupture de la couche de transmission.

`2026-07-28`La réglementation rend la mise en œuvre de la procédure très simple, car chaque demande est entièrement auto-contenue.

- 支持首选版本的现代 Server;
- Retour à la version identifiable ou Header  err err err err of Moderne Server;
- Je n'ai jamais entendu parler .`server/discover`Le serveur de l'ancienne;
- Jusqu' à ce que je reçoive .`initialize`La main est toujours fermée.

Si tous les erreurs de détection sont généralement considérées comme étant des serveurs héritiers, elles sont extrêmement dangereuses. Les erreurs de format des requêtes modernes, des serveurs surchargés, des processus suspendus et des serveurs vraiment anciens, peuvent produire des signaux de rupture ou de déconnexion superséquents. Ces signaux sont eux-mêmes plein de différences.

## 核心概念

### Pour les parties concernées, la session est

Pour chaque processus de serveur ou de réseau, un enregistrement de transmission à un terminal est effectué:

- 传输句柄或发送函数;
-  selected协议时代与具体版本号;
- Les capacités de serveur découvertes récemment;
- Liste des outils de détermination récents;
- 映射 de la demande ID en attente de réponse;
- L'état de santé physique de la transmission.

Il appartient au registre administratif interne du Client, qui n'est pas le soi-disant état de session . Dans le MCP moderne, le serveur continue de recevoir indépendamment la version et la capacité actuelles de chaque demande d'entreprise.

### De zéro à construire chaque requête moderne

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

Il ne faut pas ajouter une seule fois des données à un objet connecté pour supposer qu'elles peuvent atteindre le réseau. Il faut faire des tests et des tests pour la requête complète de la séquestration finale.

### 现代服务发现

`server/discover`返回支持的版本、Server 能力、使用说明、缓存提示以及推的 Server 身份──Client 选择双方均支持的最高现代版本──

Pour le client purement moderne, le service de découverte est optionnel; mais en studio  mode est fortement recommandé de l'utiliser.`tools/list`Il peut survenir de faux succès.`server/discover`能够建立分明的时代分界线──

### stdio 兼容性探测流程

双时代(double-ère) le client de l'émission de téléchargement avant d'envoyer toute autre demande, priorité de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de la téléchargement de la téléchargement de la téléchargement de la téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de téléchargement de téléchargement de téléchargement de la téléchargement de la téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de téléchargement de la téléchargement de téléchargement de.`server/discover`❖ Peut avoir trois types de résultats:

1. **DiscoverResult（成功发现）**Le serveur pour l'architecture moderne, choisit la version commune, et continue à communiquer avec les entreprises en transportant des données à chaque demande.
2. **Recognized modern error（已识别的现代协议错误）**Le serveur est toujours pour la modernité.`-32022`, de`data.supported`中选择可用版本并使用新请求 ID 重试;若为头条或能力 错误,修改请求内容即可──**严禁回退发送 `initialize`。**
3. **Ambiguous signal（歧义信号）**: JSON-RPC non identifié 报错、超时、连接关闭或空响应均无法确定协议时代──必须默认按失败关闭(fail closed), à moins que le terminal ne soit transporté et configuré de manière explicite 遗产 兼容白名单──

已识别的现代协议错误码 comprennent:

- `-32020`HeaderIncorrespondant (la requête ne correspond pas à la requête)
- `-32021`Faute de compétences (faute de compétences)
- `-32022`Protocole non pris en chargeVersion ((不支持的协议版本)

Même si le terminal est inscrit dans le catalogue du patrimoine, les erreurs modernes déjà identifiées prouvent également qu'il est un serveur moderne.`initialize`Il s'agit d'une attaque de degré dangereux.

Je ne peux pas le faire .`-32601`(method un trouvé) comme preuve suffisante d'entrée dans l'héritage. Il ne représente que le fait que le client soit éligible à démarrer une recherche d'héritage de durée limitée.

### Blanc nom représentant le transport et non le témoignage de l'accord

L'héritage 兼容性 doit être une attribut explicite de la configuration du terminal spécifiée:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

必須將此選項绑定至明确配置的命令或端点──嚴禁使用通配符让任意未知 Server自动降级为较弱语义──未配置`allow_legacy=True`Les résultats de la recherche de résultats sont les résultats de la recherche de résultats.`initialize`Il y a une autre.

Le client ne peut envoyer que des messages dans les limites du délai de livraison.`initialize`S'il vous plaît, alors exigez strictement de satisfaire à toutes les conditions suivantes:

-  Réception de JSON-RPC correspondant à la demande d' ID `2.0`响应;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `result`字段,且无 `error`Le dépôt de la commission
- `protocolVersion`appartenait à l'ancienne version de la collection de configuration autorisée par le Client;
- incluant des types d'objets `capabilities`字段;
- 包含非空字符串 `name`Avec `version``serverInfo`Les objets

Toute version de l'information, de l'information, de l'erreur, de l'erreur ou de l'erreur de l'identité, est directement défaillante.

### 命名空间无冲突合并

Deux serveurs pourraient être exposés .`search`Les instruments devraient être adoptés en suivant les stratégies suivantes:

1. **冲突时加前缀（Prefix on collision）**: conserver le nom de la première outil,`<server>/<tool>`Il y a une autre.
2. **冲突时拒绝（Reject on collision）**: ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇ ̇  ̇ ̇    ̇ ̇         ̇ ̇            ̇                        
3. **静默覆盖（Silent overwrite）**- Le numéro de la liste:**坚决杜绝**Il cache le modèle réellement utilisé par le serveur.

### 调用路由机械

路由是纯粹的映射查找:

```text
规范工具名
  -> 对端名称 + 本地工具名
  -> 生成全新的 JSON-RPC 请求 ID
  -> 现代请求元数据 或 显式 Legacy 结构
  -> 匹配响应 ID 并返回
```

```figure
tp-client-merge
```

## 动手实践

`code/main.py`通过内存对端函数清晰显示了整个协议决策树──它连接到两个现代对端和一个显然白单单标记的遗产对端,合并并路由它们的工具:

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

单元测试 couvre les conditions limites de l'exposition habituelle facilement négligées:

- 现代请求逐次重复元数据;
- Je suis là .`-32022`时重试现代发现, absolument non retourné à la main;
- 已识别的现代错误绝不发生降级;
- 超时、断开与未知错误在无白名单时绝不触发 `initialize`Le dépôt de la commission
- Le nombre de personnes qui ont été récompensées par la loi est de 0,5%`initialize`响应后才确立为遗产;
- l'époque sélectionnée est stable et existe au cours du cycle de vie de la transmission.

## 交付物

本课交付 `outputs/skill-mcp-client-harness.md`Il peut être utilisé pour les demandes modernes de création, les études, les négociations, la détermination du nom de domaine, la mise en place de la sécurité, ainsi que la mise en place de la sécurité.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 对端 (Peer) | Client 端维护的单个 Server 传输句柄及其发现信息的记录实体 |
| 协议时代 (Protocol era) | 现代逐请求元数据模式，或旧版初始化握手语义 |
| 服务发现探测 (Discovery probe) | 用于识别 stdio 对端时代的初始 `server/discover` 请求 |
| 已识别现代错误 (Recognized modern error) | 证明对端属于现代架构并禁止 Legacy 回退的特定协议错误 |
| Legacy 白名单 (Legacy allowlist) | 运维显式授权对指定对端进行一次受限兼容探测的配置 |
| 正向 Legacy 证据 (Positive legacy evidence) | 针对受支持旧版协议返回的有效、ID 匹配的 `initialize` 结果 |
| 合并命名空间 (Merged namespace) | 跨所有活跃对端规范化后的工具全局名称集合 |
| 冲突策略 (Collision policy) | 处理重名工具的加前缀或报错拒绝规则 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
