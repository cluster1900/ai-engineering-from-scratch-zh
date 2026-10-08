# MCP fiabilité, suppression et contrôle

> Il ne peut pas faire en sorte que les effets secondaires soient sûrs, ne peut pas faire arrêter le processus de travail de l'arrière-plan, ni protéger les données du retard de la consommation.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 09 and 13
**Time:** ~120 minutes

## Objectif de l'apprentissage

- Pour le studio et le streaming HTTP séparément pour réaliser correctement la requête de suppression de signal.
- 解決完成 (complément) et取消 (annulation) entre les échanges, éviter de les envoyer à la fin de l'annulation.
-  strictement distinct moment de demande de suppression et de perpétuation `tasks/cancel`Les différences de signification
- ∆ Élaboration de stratégies de réessayer en fonction des caractéristiques des effets secondaires et des clés de l'indépendance 
- En même temps que la capacité maximale de la ligne d'avancement est fixée, assurez-vous que la réponse finale ne soit pas abandonnée.
- 通过重新连接、权权重拉(refetch) ainsi que le rétablissement du processus de retrait de la circulation 动带动的退避机制

## 核心问题

Les défauts des systèmes distribués les plus chers sont souvent inexistants en dehors de la voie normale de leur exécution.

Le client a appelé un outil. Le service a commencé à exécuter un nouveau test. Il a été réécrit deux fois.

Chaque composant de la chaîne n'a pas été signalé de son propre côté, mais le système entier s'est effondré de son côté.

Les règles MCP définissent le format de message et le comportement de la couche de transmission, mais votre application doit toujours être responsable:

- 时间预算(budgets de temps);
- 业务等性(département d'entreprise);
- Il y a des rangs de rangs limités;
- Classification des retraites;
- 持久化任务状态 (état de tâche durable);
- 重连与重新拉取策略 (Récouplement et réaménagement de la politique)

Ce cours va construire ces décisions dans un simulateur de détermination. Ici, il n'y a pas d'introduction de sommeil, de prise de réseau réelle ou de défaillance. Vous contrôlerez directement l'ordre précédent de l'annulation de l'événement.

## Demande d'élimination différente de la couche de transmission

Quel que soit le type de protocole de transmission utilisé, l'intention du client est la même: il n'est plus nécessaire de réaliser les résultats actuels.

### studio

L'équipe de communication a été informée par le service de communication de l'entreprise.

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

Cette notification appartient à la société de l'information et de l'information.

▌le service doit cesser de travailler ▌la libération de ressources, et ne plus envoyer de réponse à la demande annulée ▌si la demande est incomplète ou ne peut pas être interrompue en toute sécurité, le service peut ignorer la notification d'annulation ▌.

Les messages d'erreur de format, qui se réfèrent à des demandes inconnues ou à des demandes terminées, sont ignorés par le service.

### HTTP par flux

现代 Streamable HTTP pour chaque requête distribuée indépendamment de HTTP 响应或 SSE 响应流──客户端通过**直接关闭该请求的响应流**Pour émettre un signal de désinfection.

Ne pas faire de HTTP ordinaire`notifications/cancelled`Le déconnectage est le seul moyen d'éliminer le signal.

Une fois que le service a été testé, la connexion est interrompue, il doit cesser de fonctionner et ne peut jamais envoyer de nouvelles à la demande.

### 服务端发起的取消范围极其有限

服务端绝不能使用 `notifications/cancelled`Pour le désamorçage de la communication, le service est utilisé en mode standard.`subscriptions/listen`Il faut faire une distinction stricte entre ce chemin très étroit et les demandes habituelles des clients.

## 取消 est une édition

L'ordre des deux événements est parfaitement légal.

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

Les clients doivent également négliger activement les réponses tardives aux demandes qu'ils ont déjà abandonnées.

```figure
mcp-reliability-race
```

本课的 `RequestCoordinator`Une fois qu'il a été supprimé,`complete()`Il ne sera plus de retour à aucune réponse; et l'annulation de notification de retard ne pourra jamais être modifiée.

## Le mécanisme de super-temps a besoin de deux heures

Le temps de l'inactivité est très loin de nous.

Il faut introduire simultanément deux séquences de temps:

1. **空闲超时（Idle timeout）**: demande de ne pas avoir eu d'activité utile pendant une longue période
2. **最大超时（Maximum timeout）**Le budget de l'horloge murale est un budget absolu pour le temps physique.

Il y a des événements qui se produisent.**绝不能**推迟或消除最大截止时间──

```text
start: 0 ms
progress: 400 ms
progress: 800 ms
progress: 1200 ms
idle timeout: 500 ms
maximum timeout: 2000 ms
```

À 1500 ms, la demande est toujours en activité, car la distance entre les événements de progression précédents n'a été que de 300 ms. Mais à 2000 ms, le délai maximum sera forcé d'annuler la demande, même si un nouvel événement de progression a été produit à 1999 ms.

进度通知是可选的. Le service端 peut entièrement accepter un progression令牌 (progress token) mais ne renvoie aucun update pendant la période d'exécution.

La valeur de progression du MCP doit être augmentée ou supprimée. Après sa réalisation ou son abolition, toutes les notifications doivent être immédiatement arrêtées.

## Soyez attentif à ce que vous faites.`tasks/cancel`

Ces deux mécanismes résolvent des problèmes de niveau de cycle de vie totalement différents.

| 机制 | 作用目标 | 线路信号 | 成功意味着什么 |
|-----------|--------|--------|--------------------|
| stdio 上的请求取消 | 单次在途 RPC | `notifications/cancelled` | 客户端放弃了该请求；若可行服务端应当停止执行 |
| HTTP 上的请求取消 | 单个在途响应流 | 关闭该流 | 客户端放弃了该请求；若可行服务端应当停止执行 |
| `tasks/cancel` | 单个持久化 Task | 普通 MCP 请求 | 服务端已确认收到取消意图 |

`tasks/cancel`Le succès de la réforme n'a pas démontré que le travailleur de la dernière étape a cessé de fonctionner.`working`état, jusqu'à ce que le travailleur à un certain point de contrôle (checkpoint) ait réalisé la suppression du marquage;

Lorsque HTTP est coupé,**绝不要**清除持久化任务的状态―― créer une tâche dont le but initial est de permettre à son cycle de vie de dépasser les limites de la seule requête et de la seule connexion――

## Nouveau ID JSON-RPC  Absolument pas égal à  égal

JSON-RPC id est uniquement utilisé pour connecter des requêtes et des réponses uniques, elles ne représentent absolument pas l'opération d'entreprise elle-même.

假设客户端 soumettre un compte à titre de facturation`41`), en perdant la réponse du serveur, puis l'identifiant de l'utilisateur `42`发起重试―― le serve-end voit deux messages très différents―― sans la seule identification de l'application, le serve-end ne peut tout simplement pas les reconnaître pour représenter la même demande de paiement――

等键(idemotency key) 明确代表了业务意图:

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
- 操作参数的哈希指纹(empreinte digitale de l'argument);
- 已提交的执行结果──: résultats d'exécution ont été soumis

La même clé avec le même paramètre retournera directement aux résultats du stockage précédent. Si la même clé porte des paramètres différents, elle sera fermement rejetée. Cela peut empêcher une autre opération commerciale différente d'être modifiée en raison de l'erreur d'utilisation de la clé.

### Les frontières doivent être atomiques et durables

Les procédures d'exécution suivantes sont extrêmement dangereuses et non sûres:

```text
check key（检查键是否存在）
run mutation（执行写操作）
store result（存储执行结果）
```

Les deux ouvriers peuvent constater simultanément que la clé n'existe pas, et exécuter simultanément cette opération de rédaction avec des effets secondaires.

Le cours utilise SQLite 账本.`BEGIN IMMEDIATE`Les contrôles de la clé ‒ les effets secondaires de l'entreprise simulés ‒ les compteurs d'exécution et le stockage des résultats sont tous séquencés dans la même transaction ‒ même si deux connexions de comptes indépendantes utilisent la même clé ‒ ne produisent qu'une seule exécution de l'entreprise réelle et enregistrent un résultat déjà soumis ‒ les documents de la clé ‒ qui sont fermés et rouverts, et l'historique est toujours parfaitement conservé ‒

Toutes les valeurs de retour sont générées par JSON de stockage de reconditionnement. Les utilisateurs ne peuvent pas obtenir directement les citations d'objets variables qui sont en leur possession à l'intérieur du livre de comptes, ce qui élimine les risques de modification du code de retour et de contamination des résultats de la reconditionnement.

Les effets secondaires de l'entreprise dans un simulateur sont les recettes et les compteurs contenus dans le même SQLite. Dans un environnement de production, le paiement réel, la déploiement de contenants ou l'utilisation d'API externes ne dépendent pas du fait de la mise en place de données locales.

### Révélation de la décision

Avant de réaliser la logique de réessayer, il faut effectuer une claire classification de la réessayer.

| 类别 | 示例 | 重试规则 |
|------|---------|------------|
| 安全（Safe） | 无副作用的确定性读操作 | 在明确故障边界后，可使用新的 JSON-RPC id 直接重试 |
| 有条件（Conditional） | 具备持久化幂等键的写操作（Mutation） | 必须使用完全相同的幂等键和完全相同的参数发起重试 |
| 不安全（Unsafe） | 未提供业务去重机制的写操作 | 严禁自动重试；必须先进入人工或系统对账调和流程 |

工具描述符中附带的  outils décrits dans le tableau`readOnlyHint`et `idempotentHint`La sécurité réelle des essais dépend entièrement de la réalisation des conditions de l'application et des conditions de service.

## Le stress est une partie de la vérité.

La vitesse de production des événements progressistes par les producteurs de l'ESS peut dépasser de loin la capacité de consommation du client, de l'agent ou du réseau de liaison.

Il faut utiliser une queue de bordée, et déterminer ce que l'on peut sacrifier pendant le transport.

Pour la même marque d'avancement, la valeur de progression de la dernière est naturellement la valeur de la précédente. Cependant, la réponse finale de JSON-RPC est absolument irremplaçable.

Le cours de la gestion des flux de l'économie de marché est réalisé en:

1. 合并(Coalesce) la même instruction
2. Lorsque la coquille atteint la limite de capacité, la plus ancienne progression des données est abandonnée;
3. Pour les événements, il faut une révision autoritaire.
4. 始终完整保留最终响应;
5. Si la rétention de la réponse finale doit être rejetée à la charge d'une autre réponse finale, elle est rejetée.

C'est une stratégie de rétablissement définie.

### 代理缓冲问题

Le service-end peut être en parfait flux de sortie, tandis que l'intermédiaire inverse est en cas de stockage privé.

Pour les réponses de l'ESS, il faut déployer les réponses suivantes:

```http
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

Réglementation de la mise en service de services de téléphonie mobile en ligne`X-Accel-Buffering: no`, afin de permettre à un serveur d'intermédiaire comme Nginx de transmettre instantanément des événements à un client.

Pour les relations de longue durée en état de silence, il faut régulièrement envoyer SSE

```text
:
```

Les appareils intermédiaires peuvent voir l'activité du réseau, évitant ainsi de couper les connexions qui semblent être vides.

传输保活不等于业务进步――绝不能因为收到传输层的保活注释就顺带重置业务操作的语义空超时计时器――

## Le poids signifie re-attraction

现代 HTTP 协议 par le biais de flux**不支持**- Je suis là.`Last-Event-ID`- Je suis en train de faire une pause.

- Je suis là .`subscriptions/listen`事件流意外中断后:

1. Utiliser un nouveau code JSON-RPC pour émettre une nouvelle demande de suivi;
2. Reinscription des documents nécessaires à la réinscription;
3. 调用权威接口全量拉取可能受影响的工具,资源,提示或任务;
4. Selon la stabilité de l'ensemble de l'identification unique de l'état de l'application;
5. Ne pas laisser à l'aveugle le risque de perte de réponse à une opération non protégée.

Le programme de récupération dans le sample sera évidemment `sendLastEventId`设置为错,并列出需要全量重拉的资源清单──

### 防止重连风暴 (effet du troupeau)

Si 10 000 clients se sont réconnectés en une seconde, le service qui a été rétabli sera immédiatement reconnecté.

 doit être utilisé avec un système de retrait des indices de protection des limites supérieures.

```text
attempt 0: up to 250 ms
attempt 1: up to 500 ms
attempt 2: up to 1000 ms
...
cap: 8000 ms
```

L'environnement de production peut être utilisé en termes de chiffrement de la sécurité des nombres aléatoires ou des nombres aléatoires en cours de fonctionnement. Le noyau de l'invariabilité réside dans la dissolution de la distribution du temps, et non dans une formule mathématique spécifique elle-même.

## Handwriting réalisation

`code/main.py`Il a construit cinq composants de base fiables:

### `RequestCoordinator`

- Initier le processus de demande et maintenir le temps de dépôt du maximum;
- 发送单调递增的进度通知;
- Pour le studio et HTTP, séparer la génération de la norme de suppression du signal;
- 忽略非法的取消通知;
- L'effet final entre la décision de suppression et la finalisation;
- 确保服务端发起的取消仅用于studio 订阅。

### `MutationLedger`

- 演示En cas de manque de clé d'entreprise, l'utilisation de deux fois d'id JSON-RPC différents entraînerait deux répétitions d'exécution;
- Utilisation de SQLite de tâches en ligne à base de fichiers pour vérifier les clés, simuler les résultats de l'entreprise, exécuter le compteur et soumettre les résultats;
- support à travers plusieurs connexions de comptes indépendants, à effectuer un dépistage complet des mêmes clés et paramètres parfaitement harmonisés;
-  refuser d'utiliser les mêmes clés mais modifier les paramètres;
- Retour à la défense, réouverture du dossier de compte, conservation complète des données soumises.

### `DurableTaskService`

- Pour la demande de confirmation de la reconnaissance;
- 保持 tâche 处于 `working`état, jusqu'à ce que le travail de ligne soit inspecté et marqué;
- Directement démontrer pourquoi confirmer la réception n'est pas égal à terminer la tâche.

### `BoundedSseBuffer`

- Dans le cas d'une entreprise, la valeur de l'entreprise est supprimée.
- 明确记录当前流已需要进行权威数据全量重拉;
- Il ne faut pas abandonner la réponse finale.

### 恢复辅助工具

- 输出 标题 SSE 标题与保活心跳注释;
- Produire un programme d'exécution complet de la charge et de la charge de la charge;
-  adoption d'indices de détérioration de l'indice de détermination                                                                                                                                                                                                                                                     

## 运行验证 Le dépôt

À partir de code root

```bash
cd phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code
python3 main.py
python3 -m unittest discover tests -v
```

Le programme de démonstration présentera ensuite les deux directions de l'état de la concurrence centrale, la réalisation d'une opération de rédaction basée sur des opérations de chargement dans un document temporaire SQLite, la pression de surcharge sur la zone de réparation des progrès à la frontière, ainsi que la manière dont la tâche de duration est transférée de l'opération de réparation à l'opération de réparation de la tâche de réparation à l'opération de réparation de la tâche de réparation.

## 交互式实验

Dans le pré-soup sans ajouter aucun temps de retard, fonctionne quatre sortes d'événements spécifiques dans l'ordre suivant:

1. 启动请求 `A`,将其取消, puis调用 `complete()`Il y a une autre.
2. 启动请求 `B`, le terminer, puis envoyer le signal d'annulation jusqu'à la fin.
3. 启动请求 `C`, avant chaque fois que l'heure est superposée, mais la rupture finale est la plus grande valeur absolue de l'heure superposée.
4. Dans le flux HTTP, la requête de démarrage est`D`,并直接关闭其响应流──

pour chaque scène, enregistrer:

- La demande de la fin de la situation;
- Y a-t-il produit une réponse finale;
- En forme spécifique, le signal d'élimination émis sur les lignes de communication;
- Le client doit commencer à ignorer l'événement.

Alors, la scène sera`D`改为studio 传输―― opérationnel parfaitement cohérent, mais les signaux d'élimination sur les lignes de communication doivent changer.

## 动手实践

Pour`MutationLedger`扩展一个 `reserve_inventory`(库存预留) écrit操作。

需求规范:

1.  les éléments essentiels doivent être liés au SKU, au nombre, au loyer et au nom de l'exploitation.
2. En utilisant le même bouton et le même paramètre à nouveau, il faut retourner directement le résultat de la première génération.
3. Utilisez le même bouton mais modifiez le nombre de réservations pour la réinitialisation, il faut signaler l'erreur de rejet et ne pas produire de deuxième réservation.
4. Lorsque l'opération de rédaction a été envoyée au service mais que la réponse a été perdue en cours de rédaction, le support de crédit et autres éléments de base sont mis en place pour vérifier le compte.
5. Il est impossible de consigner les informations confidentielles ou les informations sensibles à payer.
6. Si le clientèle ne fournit pas de clés de ce type lors de la réécriture, il désactive directement le mécanisme de réécriture automatique.
7. 模拟订阅流意外断开的情景,在决定后续动作前,先对该库存记录执行权限全量重拉──
8. 启动两个位于同步屏障 (Barrier) 前的账本连接,并发提交同一个等键──断言全局只有一个预留成功提交──
9. 改首回归预留对象──重新传入该键进行重放, prouvant que le résultat réel du stockage de base n'a pas été contaminé──
10. 关闭并重新开账本文件, 通过键核验预留数据完好无损──

Veuillez garder une bonne foi: si les données de stock existent en réalité dans un autre micro-service indépendant, veuillez préciser si ce micro-service prend en charge le même ou les mêmes clés, ou si il faut introduire une transactionnelle en-tête de transaction (Trans-sactional Outbox) pour relier le soumissionnaire local aux effets secondaires de la distance.

## 交付产物

`outputs/skill-mcp-reliability-reviewer.md`Il est un hautement réutilisable de la compétence de vérification de la fiabilité. Il fournit MCP 操作、 utilisé de la transmission de couches, des stratégies de super-temps, des règles de reprise, des stratégies de file d'attente et le mécanisme de récupération, il peut générer un tableau complet de l'analyse de la concurrence, des table de révision de la classe  etc. définition de la frontière, des contrôles de flux et des exemples de test de défaillance de la réponse.

## 验证标准

Lorsque toutes les activités suivantes seront réalisées, l'objectif de cette partie sera d'achever:

- stdio 取消操作发送 `notifications/cancelled`且不接收任何响应──
- Retour HTTP 取消操作直接关闭响应流,绝不发送多余的取消 POST 请求。
- 先取消后完成能正确抑制并抹除最终响应──
- Permettre de terminer le signal  pouvoir conserver la réponse légale et ignorer le signal de retrait 
- L'avis de progression peut être réinitialisé à l'heure super, mais il ne peut pas être retardé à l'heure super maximale.
-  Le simple changement d'un nouvel ID JSON-RPC entraînerait une deuxième exécution de l'opération de rédaction sans protection
- Dans un double lien, les mêmes clés et paramètres sont exécutés une seule fois.
- 已提交记录在关闭并重新开后完好保存, puis de nouveau retourner est la copie défensive.
- Les objets retournés ne peuvent pas détruire les données de stockage durable de la couche inférieure.
- Il y a une zone de captage à la pression strictement contrôlée dans la limite de capacité, et ne perd pas la réponse finale.
- Le mécanisme de transmission de nouvelles demandes, non porté `Last-Event-ID`,并全量重拉受影响状态──
- `tasks/cancel`Le travail effectué par le travailleur est effectué à la fin de l'année.

## Mode de déclenchement de la production

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

工具生态 Capstone  projets doivent considérer la fiabilité du système comme des preuves de code exécutables, et non comme des deux lignes de caractères de l'architecture du système.

Capstone doit fournir les certificats de livraison suivants:

- ), à l'égard de chaque accord de transmission;
-  pour toute réaction à la réévaluation des opérations exposées;
-  des tests d'interception en cas de résistance des éléments et de désaccord des paramètres;
- Il y a également des tests de contrôle de l'objet et des tests de séparation des objets;
- Date de livraison des données à caractère personnel
- L'évaluation des risques et des risques liés à l'utilisation de l'équipement de sécurité
- - la définition d'un programme de rétablissement de la connexion à la totalité des interfaces de retrait de données;
- En introduisant les tâches  élargissement, complet de la permanence de la tâche                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

Une utilisation réussie dans un processus local unique ne peut prouver que la fonction de base a été remplie. Seulement lorsque la perte de réponse, le retard à l'annulation, les consommateurs en retard et les tempêtes de reprise peuvent produire des résultats de traitement prévisibles, votre Capstone ne possède pas vraiment un niveau de production prêt.

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
