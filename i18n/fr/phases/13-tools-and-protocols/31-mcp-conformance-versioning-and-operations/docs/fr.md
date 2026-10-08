# MCP unité de développement: version contrôle, preuve et fonctionnement

> 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― 服务端碰巧跑通就称一致合规―― 服务端不能因为正常路径在某SDK碰巧跑通就称一致合规―― 服务端碰巧跑通就称一致性如现在原始线路上,版本边界间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间间

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 17 (gateways), Phase 13 · 30 (registry admission)
**Time:** ~100 minutes

## Objectif de l'apprentissage

- La révision des règles du protocole de MCP est basée sur la révision des règles du protocole de MCP.
- Il sera strict.`2026-07-28`行为与受约束的旧版回退 (backback) 机制清晰隔离──
- 精确区分附加性未知字段与非法的未知 `resultType`Il y a une autre.
- La différenciation entre les preuves JSON-RPC originales et les images post-régularisation du SDK
- Dans la limite du niveau de représentation réelle, le contrôle de la cohérence et de l'intégrité des titres HTTP avec les requêtes.
-                                                                                                                                                                                                                                                               

## 核心问题

Votre clientèle a réussi à utiliser le SDK .`tools/list`Il n'a pas obtenu la liste des outils.

Mais cela laisse de nombreux problèmes clés qui ne peuvent être résolus:

- Le rapport de demande contient-il vraiment des données relatives à l'accord de séparation moderne selon la demande?
- `MCP-Protocol-Version`- Je suis là.`Mcp-Method`et `Mcp-Name`Est-ce que la requête est entièrement conforme à la requête JSON-RPC?
- Le contenu de l'article en ligne est-il légal ?`resultType`, ou est-ce que le SDK a décidé de le faire ?
- 客户端能否无损保留未来前向附加字段?
- Lorsque vous recevez un code d'erreur de protocole moderne déjà identifié, vous allez faire une erreur de rétrogradation de l'ancienne version du processus de poignée de main ?
- Le service a-t-il complètement transmis le code d'état HTTP de la base de données avec des erreurs de détail ?
- A-t-on mis en place des rapports de réponse contre le processeur de notification unique ?
- Le groupe de travail ne peut-il pas démontrer pourquoi une version a été mise en promotion ou pourquoi elle a été exécutée ?

L'accord de cohérence est un ensemble d'invariables qui peuvent être observés par l'objectif. Avant de piétiner le véritable flux de l'environnement de production, il faut construire un ensemble d'outils de test automatisés capables de capturer ces invariables.

```figure
mcp-conformance-operations
```

## De la version纪元(Version Eras) commencé

MCP `2026-07-28`规范采用了完全自包含的按请求元数据(per request métadonnées)`params._meta.io.modelcontextprotocol/protocolVersion`et `params._meta.io.modelcontextprotocol/clientCapabilities`                                                                                                                                                                                                                                                              `protocolVersion`Ou `clientCapabilities`裸键均属于格式变──当HTTP 边界存在镜像路由标标题时, son nombre doit être strictement conforme à la requête JSON-RPC──现代规范下所有成功的响应结果都必须携带.`resultType`Il y a une autre.

À la date de la`2025-11-25`La première version de la série est la première version de la série.`resultType`Les résultats de l'ancienne version ne seront expliqués que lorsqu'une consultation et une consultation de l'ancienne version seront effectuées avec le client.

Il ne faut pas écrire un éditeur qui accepte simultanément deux formes de l'épreuve. Il faut le diviser strictement en deux branches indépendantes:

| 分支 | 准入凭证 | 缺少 `resultType` 的处理 | 初始化握手 |
|---|---|---|---|
| 现代纪元（Modern） | 成功的 `server/discover` 或已识别的现代响应 | 判定为非法（Invalid） | 不再作为默认建立连接路径 |
| 旧版纪元（Legacy） | 现代探测无果后，目标命中白名单且返回合法的旧版 `initialize` 响应 | 解释为 complete | 该纪元所必需的强制步骤 |

Cette stricte isolation a permis de réduire les risques de l'erreur de format modernes en raison de la facilité de l'expérience et du succès de l'essai.

### 严格模式

严格模式(Strict mode) exige que le terminal doit montrer l'apparition d'un acte de coopération directe―`server/discover`Il est possible de trouver une partie moderne.`-32020`- Je suis là.`-32021`Ou `-32022`) peut également établir une section moderne qui devrait modifier la demande ou mettre fin au processus,**绝不能**Retour à l'ancienne version du protocole.

### Retour à la mode

Le mode de retour (Fallback mode) permet d'effectuer une seule recherche moderne avec des limites limitées. Si des réactions interrompues ou non identifiables sont rencontrées, elles ne peuvent être prouvées directement par le terminal comme étant des points de la version ancienne.`initialize`结果及协商版本通过验证后,才能正式切换到旧版本分支──

Le retour n'est pas égal à  une fois que le journal erreur à l'essai de l'ancienne version ── une erreur moderne déjà identifiée contient elle-même une erreur correcte de grande valeur sur la version ci-dessous.  Après avoir reçu ce type d'erreur, la dégradation aveugle ne couvre que les défauts de configuration réels, tels que les déclarations de défaillance de capacité ou les versions incompatibles du protocole.

Ce type de conception peut empêcher les attaquants, les défaillances ou les surfaces de réseau de passer à côté de la réponse moderne pour réduire le système de répression.

Dans chaque échange, il faut préciser le code de référence choisi. Si un passage manquant est déconnecté du code de référence, il apparaît légitime dans une phase de test et sera jugé fatal dans une autre.

## 构建交互记录语料库(Corpus de transcriptions)

Un document de communication de la norme (en anglais seulement) est un document de communication réelle de la frontière de transition réelle, et non seulement l'utilisation de la couche SDK:

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

测试语料库 doit maintenir deux grandes catégories de documents:

### 黄金记录(Les transcriptions en or)

 les enregistrements d'or utilisés pour prouver que les comportements conformes ont été correctement acceptés:

- porter des données correspondantes aux découvertes ou aux demandes de méthodes modernes des étiquettes;
- 携带必需字段的完整结果(`complete`);
- Les méthodes doivent être plus étroitement liées.`input_required`结果;
- ), les résultats de l'expansion ne sont autorisés à être retournés qu'après une déclaration préalable de capacité de réaction;
- Dans l'ancienne version, dans la province`resultType`Les résultats de l'ancienne version;
- Il n'y a pas de réponse à toute notification de traitement de JSON-RPC.

Les données de l'or doivent être précises et précises.

### 负面记录(Transcriptions négatives)

负面记录用于证明违规行为被坚决拒绝:

- 标头与请求体不一致;
- défaut de capacité de déclaration pour chaque demande;
- 协商版本 n'est pas prise en charge;
- 现代请求下缺失 `resultType`Le dépôt de la commission
- Des inconnus ou des non-connus`resultType`Le dépôt de la commission
- 响应中  dans le`jsonrpc`Non pour`2.0`, ou l' ID de retour n' est pas conforme au type numérique ou JSON;
- En même temps`result`et `error`, ou les deux sont absents;
- 缺少整数 `code`Ou un mot`message`Les erreurs de l'objet;
- Pour une erreur de mise en cache de protocole HTTP;
- Pour la notification  err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err err
- 变的 JSON-RPC 信封格式;
- Le gouvernement a décidé de mettre fin à la crise de la sécurité et de la sécurité.

Pour chaque cas d'utilisation négative, il faut affirmer que son rejet a une limite précise avec un code d'erreur stable.`-32020`On peut les appeler des échecs, mais ils transmettent des informations à des transporteurs.

Les tests doivent être obligatoirement effectués en retour HTTP 400 avec un identifiant de requête et un code d'erreur.`-32020`◊ chaque jour de l'épreuve locale observé `HeaderMismatch`Si le code de rejet est correct, il est également un échec de test. Cependant, un test qui est terminé après avoir été testé par le service, le test est lui-même, sans aucun effet sur le comportement de communication en ligne réel du serveur.

Le MCP officiel un ensemble de tests de conformité est un précieux standard et version externes référence. Mais il est essentiel de maintenir votre propre ensemble de données de communication, car le ensemble de tests publics généraux ne peut pas couvrir votre agent spécifique, SDK spécifique, lignes de désignation spécifique et les voies de production et de publication.

## 标标值必须与RPC 要求体匹配

Dans le protocole HTTP Streamable moderne, un intermédiaire peut s'appuyer sur un code de sécurité de mise en œuvre ou d'exécution. Cependant, la requête JSON-RPC est toujours la seule source de vérité de la couche du protocole.

 doit être effectué conformément aux règles suivantes:

1. 解析并校验 JSON-RPC 信封及元数据字段的类型;
2. Pour le mieux .`MCP-Protocol-Version`Avec `params._meta.io.modelcontextprotocol/protocolVersion`Le dépôt de la commission
3. Pour le mieux .`Mcp-Method`Avec `method`Le dépôt de la commission
4. Lorsque cette méthode a un nom de chemin spécifique, par rapport à `Mcp-Name`avec le traitement des demandes;
5. Après avoir été entièrement harmonisée, il est nécessaire de déterminer si la version du protocole et le groupe de capacités correspondant sont pris en charge.

Ce dernier ordre sera marqué par une erreur de non-coïncidence .`-32020`Avec le protocole version non supporté erreur `-32022`清晰区分开来来──它也可以从根本上防止网关校验并批准标题中的安全工具, alors que la source de la station a effectivement exécuté des fraudes de fraudes dans les requêtes de malintention des outils──

HTTP 字段名不区分大小写, mais son字段值严格区分大小写.`Mcp-Name`, il faut d'abord préciser le retour`=?base64?{Base64EncodedValue}?=`UTF-8 哨兵编码,再与请求体比对──未完成哨兵、无效 Base64、非法 UTF-8 或未编码的不安全字符,一律以`-32020`拒绝──未编码的原始首尾空白即便是与请求体字符完全相同的也属于非法,因为传输规则强制要求此类取值在传输前必须经过哨兵编码──

Le service de MCP peut refuser directement des requêtes HTTP qui changent avant l'arrivée du serveur MCP, de sorte que son message d'erreur ne contient pas d'erreur HTTP pure de JSON-RPC. Il doit être enregistré comme si le refus venait du service de MCP ou de la station source.

## Les résultats inconnus ne sont pas égaux

La réalisation de la convergence doit être suivie par deux règles distinctes:

### 附加未知字段

结果对象(Objets de résultat)`_meta`Le testateur doit, en fonction de sa position de responsabilité, choisir de conserver ou d'ignorer sans perte de transmission ces extraits, sauf si ce dernier est directement contraire au contrat de conservation des mots clés. Dans le code d'exemple, le test de suite conserve la réponse initiale complète dans le test, et accepte de manière similaire le résultat connu.`futureHint`De plus, il est possible de faire des changements.

Si vous êtes un agent transparent, conservez des sections inconnues généralement plus sûres que les aveugles; si vous êtes un client d'application de terminal, négligez-les, c'est légal. Mais en tout cas, les différents tests de test doivent être précis pour révéler si le SDK a abandonné le sections lors de la contre-série, en veillant à ce que ce comportement soit une décision de conception réfléchie et non une omission accidentelle.

### Je ne sais pas`resultType`

`resultType`属于核心生命周期判别器 (DD) ◊现代核心协议定义的结果类型仅有 `complete`Avec `input_required` L'accord d'expansion ne peut être rétablie qu'après avoir déclaré et négocié avec succès ses capacités de résolution, et seulement après avoir introduit de nouvelles valeurs de résolution.`task`)。

Pour les résultats de la déclaration non connue ou non déclarée, il est impossible de la présenter comme étant`complete`Il faut donc s'en tenir à la situation de l'économie de marché.

Dans le même article, il est possible de définir simultanément des scénarios de développement non connu de la loi et des types de résultats non connus mortels.

Le juge n'est que le premier porte de l'expérience, puis il doit aussi éprouver sa charge spéciale en fonction de la méthode spécifique.`tools/list`Les résultats complets doivent être inclus.`tools`Numéro, et son descripteur possède un nom unique non vide, une description claire et un point de racine de l'objet.`inputSchema`Le dépôt de la commission`task` résultat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `tools/call`中有效,且强制要求包含 `taskId`、 déjà connu 、 Création et mise à jour 、`ttlMs`ainsi que des interviews juridiques;`completion/complete`Le résultat complet doit contenir pas plus de 100 caractères.`completion`Objectifs, ainsi que le nombre non négatif de choix`total`et valeur choisie`hasMore`│ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │`resultType`Il est impossible de fournir une exemption pour les charges de transport en vrac.

## Quantité de la notification

JSON-RPC Notification 消息没有 `id`❖ Accueil**绝不能**Pour envoyer à l'étranger tout succès ou erreur de JSON-RPC

Pour la réception réussie de la notification sur HTTP, le test kit est prévu pour le service de retourner à un HTTP avec une requête vide.`202 Accepted` MCP`2026-07-28`规范并未在 Streamable HTTP上定义核心的客户端到服务端通知──本课例只使用一个带有命名空间的课程扩展通知,专门用于验证传输层序列化器是否满足绝不回复任何JSON-RPC 报文的不变量──请勿误认为它是新的核心协议方法──

测试时必须覆盖最外层的序列化器,而不能仅仅测试处理函数本身──因为很可能处理函数内部回归 `None`Mais les intermédiaires de l'extérieur sont automatiquement emballés.`{result: null}`Les résultats de la mise en œuvre de JSON doivent être directement saisis et vérifiés et finalement déployés sur le réseau.

## 引入 SDK 差异对比(SDK différentiel)

Les différents types de SDK transforment généralement l'emballage des objets de ligne de niveau inférieur en un type de données facile intégré dans un langage avancé. Cela améliore l'expérience de développement, mais entraîne également une normalisation ultérieure.

 Pour chaque cas de test de haute performance, il faut capturer simultanément quatre niveaux de vue:

1. SDK 解码前's original HTTP 状态码、响应标标标与响应体;
2. Objets ou exemples de valeur de retour produits après la transformation de la KDD  normalisation;
3.  pour les projections pré pré-élection de la version de la période;
4. L'équipe de développement a été créée pour la mise en œuvre de la stratégie de développement durable.

Example Code permet au SDK de se déconnecter uniquement de l'information connue.`resultType`- Je suis là.`_meta`- Je suis là.`ttlMs`et `cacheScope`), en même temps que les charges d'affaires de la base.`futureHint`, test sujets seront utilisés comme différences de police explicit sur le rapport.

Ne supposez pas simplement que chaque différence est un bug du SDK. L'objectif central est de rendre cette transformation de type caché complètement visible.

Avant la publication, chaque SDK que vous maintenez et sa version cible doit être testée par différence. Si deux SDK différents produisent des sorties de normalisation différentes pour un enregistrement de interaction parfaitement identique, la stratégie de publication doit déterminer clairement quel comportement est normalisé, impossible et rare.

##  Capture de la preuve de l'agent

Dans l'environnement de production, la majorité des défaillances de MCP se produisent dans les frontières du réseau de processus ou de traversage des agents.

| 视角 | 最小必要凭据 |
|---|---|
| 入口（Ingress） | 客户端原始请求头、JSON-RPC 请求体、Content-Type、已认证路由、接收时间戳 |
| 源站（Origin） | 代理转发出的标头与请求体哈希、源站 HTTP 状态、源站响应头与响应体 |
| 出口（Egress） | 客户端最终可见的 HTTP 状态、响应头、最终响应体、发送时间戳 |

Le code d'exemple a été développé pour tester les deux comportements les plus courants:

- 源站原本规范返回的HTTP 400 ou 404 JSON-RPC 协议错误, été facilement et brutellement transformé en HTTP 500 de usage général;
- Le contenu des demandes de retour et des sources de retour des clients est en constante évolution.

∆ selon l'architecture de la mise en œuvre réelle, il peut également être étendu à l'intention du type de contenu,`Accept`、 la transmission de compression、 la mise en cache des SSE à la demande unique、 le titre de stockage ainsi que les déclarations ci-dessous sur le suivi du suivi des chaînes distribuées―, sous réserve de la convention, de capturer les deux points de vue avant et après la fin de TLS―, mais veuillez noter: il est impossible de l'imprimer pour prouver la complétude de la chaîne, en imprimant les certificats de clé de détention de la clé de détention―.

## 证据离开内存前 effectuer une détachement

La déminissance appartient à l'étape centrale de la construction du système de coordination, et non au travail de finalisation des correctifs. Avant la séquestration des preuves, le calcul, la rédaction de journaux, le déminissage doit être effectué dans la mémoire.

Example code dans l'exécution de correspondance avant de former un code uni uni uni pour un petit texte et de le déconnecter, puis de le redire à un autre type de code.`Authorization`- Je suis là.`Cookie`- Je suis là.`Set-Cookie`- Je suis là.`X-Api-Key`- Je suis là.`accessToken`- Je suis là.`clientSecret`- Je suis là.`registrationAccessToken`- Je suis là.`token`- Je suis là.`password`- Je suis là.`secret`et `api_key`La normalisation par rapport à la logique et au dictionnaire de la liste noire doit être unifiée, empêcher les différents styles de nomenclature de se contourner entre eux, même en milieu de production.`query`Il semble donc que les noms de clés inoffensifs, peuvent également contenir des données de confidentialité ou de réglementation de la réglementation.

Le calcul est basé sur des preuves de détérioration de la sensibilité. Les données de capture de la sensibilité initiale ne sont lues que dans des enquêtes d'accident spécifiques, par les personnes qui ont obtenu l'autorisation de le faire dans un système de restriction de leur cycle de vie très court.

## La mise en place d'un contrôle de santé et de la régularisation

La conformité de l'accord de niveau est une condition nécessaire à la publication, mais elle n'est pas une condition absolue.

Avant de laisser le flux officiel, il faut définir clairement la fenêtre d'observation de la santé:

- la plus petite capacité de demande de sample;
- Le taux d'erreur maximal permis est la valeur;
- 延迟分位数 ((P95/P99) 上限;
- 资源和度与算力限制;
- 持续观测的时间跨度;
- Par rapport à la direction opposée de l'indicateur de base de la ligne de référence.

De même, le titre de retour doit être préalablement disponible en ligne:

- 精确的前序版本标识;
- Récapitulatif des documents d'entrée précédents;
- Les pièces de travail SHA-256 et les empreintes fixes des descripteurs;
- Actualités officielles du Registre
- le rapport d'évaluation des examens de santé actuels;
- 经过过练习的路由恢复标准作业程序;
- Le certificat de certification est délivré par le gouvernement fédéral de l'État de l'Afrique du Sud.

L'objectif de ce retour est d'être en bonne santé et vérifié avant que la version de candidature ne soit approuvée, plutôt que d'attendre que la version de candidature soit mise en ligne et que les mains temporaires soient occupées à chercher un moyen de sortir.

Si la version de candidature est en panne, alors que l'objectif de roulement défini actuellement manque de soutien complet, le système devrait décider de choisir de s'arrêter à temps plein, il est impossible de se fier à la version normale pour rencontrer le succès.

Il ne faut pas faire de contrôle de la situation pour juger des choses.`healthy: "yes"`Le code d'exemple exige strictement la correspondance avec un type précis, un état actif, trois éléments clés de la signature SHA-256 résumé, un sujet de signature acceptable, ainsi que la signature HMAC-SHA-256 légitime calculée sur la base du chargement complet, dans l'exemple. La clé de la détermination appartient à des instruments de test non secrets; dans un environnement de production, la clé de certification ou de certification de clé non classifiée doit être insérée dans la limite de la mise en œuvre.

发布门禁还会坚决拒绝空白的互动记录的内容、SDK 差异凭证或代理层证券──每一个证据来源都必须提供有效的摘要指针── 一段看起来全绿的健康曲线,绝不能用来掩盖一个从未真正测试过的系统边界──

## Handwriting réalisation

运行 basé sur la norme de réalisation du cadre de construction uniforme:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
```

Le programme de démonstration se déroulera sur 15 ensembles de données d'interaction négative avec l'or (incluant des cas d'utilisation complète de la conformité avec les modifications)  comparer les différences entre les données originales et les visuels du SDK  vérifier un agent intermédiaire modifié du code source de la station d'erreur  évaluer les indicateurs de la fenêtre de santé  vérifier la signature numérique du certificat de retour en roulement, et finalement choisir l'objectif de retour en roulement de sécurité 

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

建议按以下顺序阅读 `code/main.py`La réalisation de la source:

1. `validate_request()`: les règles de conformité avec les exigences de la version spécifique des documents;
2. `validate_result()`: précisément分旧版缺失判别器、现代合法取值、扩展类型及未知类型;
3. `select_era()`: mettre en œuvre une stratégie de retour à la situation stricte et contrainte;
4. `run_transcript()`: évaluer les records d'or et les refus négatifs;
5. `compare_sdk_view()`: révéler les différences de phase dans le processus de normalisation du KDD;
6. `inspect_proxy()`: les points de référence de la relation entre les points d'entrée, de source et d'exportation;
7. `redact()`: éliminer complètement les secrets sensibles évidents avant de produire un extrait de preuve;
8. `rollback_evidence_ready()`: émission de la signature avec un caractère précis du code de l'indexation;
9. `ReleaseGate.evaluate()`Les décisions de décision sont prises sur tous les éléments non vacants:

## 运行与使用

Les quatre éléments clés de la mise en œuvre du test de cohérence sont:

1. Chaque fois que le code est modifié, le test adaptateur est rapidement opérationnel.
2.  pour les produits de deuxième nature des clients et des services construits, fonctionnant sur des niveaux de transmission physiques réels;
3. Dans un environnement de pré-édition, le déploiement réel de la fonction de réaction de l'agent ou du réseau;
4. Dans le cadre de la publication de la présente étude, le rapport a été publié en juin.

Dans tous les niveaux de test, maintenir l'identification de l'usage de l'ensemble du système.`negative-header-body-mismatch`Dans les tests en unités, les tests en fin de compte, les tests en substitution et les rapports de la banque, les résultats doivent être strictement les mêmes qu'un résumé de la preuve.

Le permis de fonctionnement de la machine de test est conservé dans le système de gestion de publication.

## 交互式实验

### 实验 A:验证版本纪元边界

 entrer `code`Actuellement, Python est activé:

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

L' ancienne version de la loi est vraie.`complete`Alors que les temps modernes sont en train de sortir.`ProtocolViolation`异常──接下来测试回退逻辑:

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

La première fois, la sécurité de l'expérience a échoué, car le silence du bout ne constitue pas une preuve légale de l'ancienne version du protocole. La deuxième fois, le succès de la mise en œuvre de l'ancienne version a été déterminé, car la configuration a ouvert manifestement les droits et a observé l'ancienne version légitime des certificats de main. La troisième fois, l'erreur de la capacité de manquement reçue, a conduit le système à être directement bloqué dans la branche moderne.

###  expérience B: la proportion de la valeur ajoutée à la valeur de la valeur ajoutée

```python
validate_result({"resultType": "complete", "tools": [], "futureHint": True}, "modern")
validate_result({"resultType": "future_mode", "tools": []}, "modern")
```

Le résultat est parfaitement conservé.`futureHint`扩展字段;第二条结果则被坚决拦截,因为其生命周期判斷器完全未知──

### 实验 C:检查 SDK 转换

```python
compare_sdk_view(
    {"resultType": "complete", "tools": [], "futureHint": {"mode": "new"}},
    {"tools": []},
)
```

结合你的组件定位评估: est-ce que le système actuel permet de le laisser tomber `futureHint`La décision de projet doit être clairement inscrite dans les règles de publication de l'équipe, et les différences sont absolument silencieuses.

### 实验 D:修复代理层问题

调整演示程序中的交互报文, permettant à l'exportation de pouvoir fidèlement transférer l'état d'origine et la requête de la station de transmission.`python3 main.py` Les agents de police ont été éliminés, mais comme le SDK a encore abandonné le segment, le lancement a été interrompu.`futureHint`La réserve, lorsque toutes les preuves de dimension sont complètement testées, observe la publication des mouvements de changement de dimension.`promote`Je suis désolé.

## 动手实践

Pour tester les outils de la chaîne de test pour les besoins de la classe SSE 流

需求规范:

-  Capture du code d'état de réponse HTTP, du type de contenu, de la séquence d'événements SSE et du signal de terminaison de la connexion;
- provise que chaque événement JSON-RPC émis par SSE a des résultats ou des erreurs concomitantes avec sa version;
-  éditer des cas d' utilisation négatifs: simuler un agent intermédiaire en cas de violation de la loi dans l' intégralité de l' événement après une seule transition;
-  édition d' un cas d' utilisation de test négatif: saisir un ID JSON-RPC dans un événement SSE  avec un ID de défaut qui ne correspond pas à la requête initiale;
- Dans le cas de la persévérance de l'événement, il est nécessaire de procéder à une exécution complète de la sensibilité;
- Pour les cas de santé, le nombre total d'événements est inclus dans la fenêtre d'observation de l'évaluation de la santé.
- ¢ s'assurer que lorsque des événements se produisent de manière inhabituelle, la publication de la décision est interdite ¢ seulement sélectionner les preuves de la réalisation de l'objectif de retour légitime ¢

验收标准: le même cas d'utilisation peut être directement utilisé et parcouru par l'intermédiaire d'un opérateur, et le rapport d'évaluation généré peut déterminer précisément où la frontière du réseau a provoqué des changements de comportement.

## 交付产物

本课程交付 `outputs/skill-mcp-conformance-release-gate.md` L'utilisation de ce logiciel pour modifier les versions de n'importe quel terminal de service, clientèle, réseau ou SDK en une version conforme à la norme et en une décision de publication. Ce logiciel est obligatoire pour fournir un certificat de roulement initial, des résultats de tests négatifs, des enregistrements de négociation de données, des différences entre les versions de SDK et les certificats de dépistage de l'agent, des certificats de dépistage de la sécurité, des certificats de santé et des certificats de roulement complets.

## 验证标准

运行演示程序与全套确定性测试套件:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

测试应严格证明:

- Les 15 groupes d'or et les enregistrements négatifs contenus ont tous atteint les résultats prévus;
- 现代请求强制要求使用带精确命名空间的元数据键;
- HTTP 标标题名称比对不区分大小写,且编码后的 `Mcp-Name`值被无损精准回原;
- 标头与请求体不一致时准确返回现代错误码 `-32020`Le dépôt de la commission
- 响应版本、ID 一致性、结果与错误的互斥性、错误对象结构以及 HTTP 映射均通过严格校验;
- 强制执行 `tools/list`、Tâches  expansion et complément des méthodes de spécification de charge;
- Il faut que tu arrives.`HeaderMismatch`, il faut réellement capturer HTTP 400 avec JSON-RPC `-32020`响应;
- Initialement`Mcp-Name`首尾空白被拒绝, alors que l'utilisation du code de poste blanc caractères peuvent être précisés往返原;
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `resultType` être considérées comme légitimes dans l'ancienne version de la loi;
- Les types de résultats du cycle de vie inconnu seront fermement rejetés;
-  Le type de résultat de l'expansion ne doit être autorisé qu'à condition d'être préalablement informé de la capacité de résistance;
-  Réception d'erreurs identifiées dans le protocole moderne qui ne sont pas incluses dans la régression de la version antérieure du protocole;
- La notification ne produit aucune réponse JSON-RPC;
- Clarity Identification of SDK for Protocol logbook sections normal separation et for business meaning sections accidentel perte;
- 精准检查出代理层对错误码的吞没改,并在小驼峰和带连符等多种风格变体下均可归归脱敏证据;
- Les établissements de santé doivent avoir en même temps un dossier de contacts non vacants, des différences SDK, des audits de représentants et des certificats de gestion des activités dans les zones de santé.
- Qu'il soit en cours de marche ou en cours de randonnée, il est obligatoire d'exister un certificat de signature, un trait de main fixe, un état d'activité et un objectif de randonnée sain.

## Mode de déclenchement de la production

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

Pour tester chaque véritable caractère que vous émettez, pour tester chaque véritable caractère que vous transmettez par un agent intermédiaire, pour tester les significations spécifiques de chaque SDK présentées à l'extérieur, ainsi que les preuves de diagnostic dont la équipe de développement doit dépendre sous une pression élevée d'urgence, la compatibilité du protocole doit être une branche manifeste réfléchie, tandis que le retour à la version est une décision de mise en œuvre de la génération de preuves stricte.

## 延伸阅读

- [MCP 2026-07-28 基础协议规范](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP 版本协商机制规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Streamable HTTP 规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [官方 MCP 一致性测试工程仓库](https://github.com/modelcontextprotocol/conformance)
