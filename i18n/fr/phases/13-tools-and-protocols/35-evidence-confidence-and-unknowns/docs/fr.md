# Deux éléments de preuve dans l'analyse du système, la confiance et l'inconnu

> Une des découvertes du processus de compilation devrait être une source d'autorité et d'autorité, ainsi que des documents de liste de choses qui ne peuvent être prouvés.

**Type:** Build
**Languages:** Python, C
**Prerequisites:** Phase 13 · 32（从零构建 ELF）、Phase 13 · 33（反汇编与控制流）、Phase 13 · 34（提升为伪代码）
**Time:** ~105 分钟

## Objectif de l'apprentissage

- 参照 réal `Evidence` Construire des documents de preuve, distinguer les catégories de confiance dans les revenus, les revenus à déduire et les revenus à déduire.
- 计算基于内容哈希的标识符, faire le file se déplacer à d'autres répertoires lorsque l'标识符保持不变──
- Il sera limité à ce que chaque fournisseur ne peut pas montrer, et il sera limité à ce que les documents soient transmis ensemble.
- Dans le cadre de la fonction, les résultats sont généralement négatifs.
- Les éléments restants seront conservés en version modifiée.
- 按精确键缓存提供方的回答,并拒绝过期重放──

##  problématique

Tu as demandé à un homme intelligent:`ledger-x86_64-O1.o`Le centre`grade`Pour le score 55 返回什么? 智能体调用 rea,读取 Ghidra 伪代码,回答 0── 审阅者追问它如何知道── 智能体手中只有一段 Ghidra 输出文本──默认路径上的文本是`uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);`◊ 該位置的字节却表示 `xor eax, eax`Il y a une autre.

Cette expression et cette instruction génèrent 0, mais le cerveau intelligent ne le sait pas. C'est simplement parce que le texte provient de l'outil qu'il y croit.[NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)), soulignant quatre faiblesses récurrentes: les préjugés de formation, les résultats de l'observation de la confiance excessive, les limites de la base de données et le maintien du plan initial.[arXiv 2607.12507](https://arxiv.org/abs/2607.12507))。

réa 6.5.0 Pour cela, un ensemble de mots est fourni.`Evidence`记录,其 `confidence`Pour`observed`- Je suis là.`derived`Ou `inferred`, et avec`authority`et `limitations`列表──随附技能告诉智能体:每一个结论都必须区分观察、推断和未知项──引用证据ID,保留限制和不完整的覆盖范围,绝不能暗示静态分析观察到了执行──

Réaliser trois choses vous laisser à traiter: le cache rapide est un résultat de requête précis, et non une analyse; lorsque une dimension comparative n'est pas modifiée, l'épreuve détermine la conclusion, mais le code source note clairement, que le processus ne peut pas établir la réalisation globale de l'équivalent; le livre obligatoire ne reçoit que des candidatures de JavaScript et de la carte de gestion, de sorte que la fonction originale ne peut pas la traiter.`verified`Il y a une autre.

Ce cours est en Python pur. Vous écrivez un livre, en conservant chaque fait de l'équipement avec un enregistrement de contenu.`percent_change`et `grade`Ainsi, le livre de la Bible est un livre de révélation et de révélation.

```figure
re-evidence-ledger
```

## Trois types de confiance, cinq types de pouvoir source

`confidence`Il n'y a que trois valeurs, aucune valeur numérique.`authority`Il y a cinq valeurs.`shipped-artifact`et `observed`Il y a une autre.

| 值 | 在夹具上的含义 | 本课中的记录 |
|---|---|---|
| `observed` | 从字节或运行中读取的事实 | ELF 读取器读取的节和符号、两条 Ghidra 记录、17 次宿主机运行 |
| `derived` | 根据观察记录计算出的事实 | switch 表模型、除法模型、每次未知项变更 |
| `inferred` | 尚无观察结果陈述的预期 | 18 项预测 |
| `shipped-artifact` | 来源是磁盘上的文件 | 对 `ledger-x86_64-O1.o` 的每次读取 |
| `controlled-replay` | 由你控制的运行产生的事实 | `harness.c` 的宿主机运行 |
| `analyst-inference` | 你自己的判断 | 预测及未知项变更 |
| `historical-reference` | 旧版本源码树或文档 | 本课没有 |
| `external-service` | 文件和宿主机之外的服务 | 本课没有 |

La première est d'observer le code fausse comme un comportement; en réalité, il s'agit simplement d'observer le contenu de la Ghidra. La deuxième est de considérer la liste vide comme une preuve de l'inexistence.`code/main.py`Le livre central va mettre en œuvre ces deux règles de code.

## 记录

Une section 6.5.0 refusera tout autre section.`code/main.py`Les deux parties peuvent ainsi obtenir la même attestation.`relationship_coverage`Indiquer la pleineur de la liste des utilisateurs ou des utilisateurs.`complete`- Je suis là.`partial`Ou `unknown`Si l'opération ne rapporte pas de relation de travail, alors:`null`Il y a une autre.

| 字段 | 内容 |
| --- | --- |
| `evidence_id` | `ev_` 加 64 位十六进制数字，表示内容哈希 |
| `subject` | `name`、`digest.sha256`、`format`、`architecture`、`local_path`，或 `null` |
| `provider` | `id`、`name`、`version`，或 `null` |
| `analysis_profile` | 提供方的设置及其摘要，或 `null`；该字段始终存在 |
| `predicate_type` | 标签，默认为 `rea.analysis` |
| `operation`, `parameters` | 工具及其输入 |
| `raw_result`, `normalized_result` | 提供方输出及规范化结果 |
| `confidence`, `authority` | 上述枚举值 |
| `environment` | `id`、`platform`、`architecture`、`isolation`，或 `null` |
| `limitations` | 用普通句子描述的限制 |
| `relationship_coverage` | `status` 为 `complete`、`partial` 或 `unknown`，附带诊断信息；或为 `null` |
| `locations` | `address`、`address-range`、`artifact-path`、`file-offset`、`file-offset-range` |
| `evidence_links` | 本记录所依赖的 `ev_` 标识符 |

La dernière est réelle.`grade`写入的真实记录, seulement conserver le seul et même passage de la section concernée.`code/fixtures/rea-evidence-grade.json`, en gros pour 37 573 caractères.

```json
{
  "evidence_id": "ev_67b6d3f992eaf49a2e16de084b6ebfdd9884e8c5c7f75e175b7bb20f4f748ce1",
  "subject": {
    "name": "ledger-x86_64-O1.o",
    "digest": { "sha256": "9a4a8082ba5e285a732552981a6935e0c5255725664f380e37c44ebfb04d803f" },
    "format": "elf",
    "architecture": "x86_64",
    "local_path": "/private/tmp/aiefs-re/phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code/fixtures/ledger-x86_64-O1.o"
  },
  "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
  "analysis_profile": {
    "provider": { "id": "ghidra", "name": "Ghidra", "version": "12.1.4" },
    "parameters": { "jump_table_evidence": "typed-case-default-blocks-v1", "import_mode": "ephemeral-source-immutable" },
    "digest": "9c7f6b24be69294e61da046e4583e3856cb9e40433b149c1bf8bb534d2fe03ef"
  },
  "operation": "analyze_function",
  "parameters": { "procedure": "grade" },
  "confidence": "observed",
  "authority": "shipped-artifact",
  "environment": null,
  "limitations": [
    "Default-space addresses use lowercase 0x-prefixed hexadecimal; other address spaces use <percent-encoded-space>:0x<hex>.",
    "Resolved reference metadata identifies computed, indirect, external, call, jump, and data edges; unresolved targetless flows remain unknown, and function classifications distinguish thunks and externals."
  ],
  "relationship_coverage": {
    "status": "complete",
    "diagnostics": [
      "Only resolved Ghidra call references are returned; unresolved computed or indirect calls remain unknown, while function classifications distinguish thunks and externals."
    ]
  },
  "locations": [],
  "evidence_links": []
}
```

分析配置中真实的 `parameters`Il y a 25 clés, réelles.`limitations`列表有十句话──请全部保留──限制属于内容的一部分,删除一项就会改变标识符,账本也会因此拒绝该记录──

Attention, le dossier ne dit rien.`environment`Pour`null`Parce que Ghidra ne lit que des documents, il n'y a pas de code à utiliser.`locations`Pour l'instant, c'est la même chose.`normalized_result`Le rapport de l'Agence`relationship_coverage`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `complete`, mais ses indications de diagnostic ne retournent que sur les citations de référence de référence résolues, les types de calcul ou de référence indirecte non résolus sont encore inconnus.

## 标识符是内容哈希,路径不参与计算

Réaliser un enregistrement d'une projection selon RFC 8785  normalisation en JSON, calcul SHA-256, réagissant `ev_`Avant, vous obtenez`evidence_id`◊ La projection conserve le sujet `digest`- Je suis là.`format`et `architecture`Je suis désolé .`name`et `local_path`Je suis là.`relationship_coverage`Pour`null`时也删除它, donc ne contient pas de registre de la relation, conserve encore les identifiants précédents de cet épisode.`raw_result`Et chaque limite, tout le monde participe.

RFC 8785 pour le classement des clés d'objet, le déplacement du vide, la mise en forme de représentation des chiffres et des caractères. Pour le classement des chiffres entiers, le Python standard library peut produire les mêmes caractères:

```python
def canonical_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
```

`code/main.py`Dans le cas de la méthode de calcul de la valeur de l'élément de référence, le RFC 8785 est différent de Python pour certaines données.

| rea 的值 | `code/main.py` 重新计算的结果 |
|---|---|
| `grade` 的 `ev_67b6d3f992eaf49a…` | 相同 |
| `percent_change` 的 `ev_e88b10dc0c6400e5…` | 相同 |
| 对 `{provider, parameters}` 计算的配置摘要 `9c7f6b24be69294e…` | 相同 |
| `grade` 快照条目的 `query_26122aebe9d8abae…` | 相同 |
| `percent_change` 条目的 `query_0f95ef38038d3666…` | 相同 |

Pourquoi exclure le chemin ? Pour les mêmes observation des mêmes caractères, quel que soit le changement des machines et des catalogues, tous doivent obtenir le même identifiant.`local_path`Indique vers un périphérique Mac le répertoire;`/home/you/re`后, le signe ne changera pas.`rebind_subject_path()`允许使用新路径展示记录;当 `sha256`- Je suis là.`format`Ou `architecture`En même temps, il refusera la zone 6.5.0 dans le but de re-réparer les enregistrements de nouvelles routes, également en passant par `rebindEvidenceToTargetPath`执行同样操作──

`validate_evidence()`重新计算标识符,若不匹配则使用 rea 的消息拒绝:证据语义标识符不匹配其记录──若记录的 `analysis_profile.provider`Avec `provider`Il ne convient pas, il refuse aussi.`test_tampered_id_and_mismatched_profile_are_rejected`修改真实  réellement`grade`Une ligne de faux code dans le dossier,并观察账本拒绝它──

## Pour faire une observation

Avant de commencer à utiliser n'importe quel livre, le livre doit d'abord être lu.`observe_object()`- Je veux le faire .`struct.unpack_from`解析 ELF64 节头、`.symtab`- Je suis là.`.strtab`et `.rela.text`Il est écrit dans une article.`inspect_object`记录,并为每一个函数符号写入一条 `read_function_bytes`记录──这五条记录均为 `observed`, autorité`shipped-artifact`C'est une source de disques.

| 记录 | 内容 | 标识符 |
|---|---|---|
| `inspect_object` | 五个节的偏移、大小和哈希，四个函数，三条重定位 | `ev_645e0a145f28bd5c…` |
| `read_function_bytes percent_change` | `.text+0x00` 处的 16 字节 | `ev_2572a7d254ad15cb…` |
| `read_function_bytes grade` | `.text+0x10` 处的 46 字节，SHA-256 为 `ffcb75c2a7bb1104…` | `ev_a467c2427bfc0c56…` |
| `read_function_bytes total` | `.text+0x40` 处的 31 字节 | `ev_b1e845cea2543073…` |
| `read_function_bytes grade_label` | `.text+0x60` 处的 63 字节 | `ev_c50041be26e6b7f4…` |

`llvm-objdump -t`Avec lui相符:`grade`      `0000000000000010`, en gros pour`2e`Il y a une autre.`.rela.text`Le nombre de postes de travail en cours est de`.rodata``R_X86_64_PC32`, par déplacement`0x36`- Je suis là.`0x84`- Je suis là.`0x93`, pour augmenter le nombre de séparations`0x10`- Je suis là.`0x24`- Je suis là.`-0x4`                                                                                                                                                                                                                                                              `file-offset-range`位置和一项限制: 节字节从磁盘文件读取──读取器不应用重定位,也运行代码──

Le cours complète a été construit en 60 pages, car il s'agit de la façon dont vous enregistrerez le processus de lecture.

##                                                                                                                                                                                                                                                               

`grade`Le chapitre 46 contient les quatre modes suivants:

| 字节 | 指令 | 在 `grade` 中的偏移 |
|---|---|---|
| `48 69 c0 67 66 66 66` | `imul rax, rax, 0x66666667` | 3 |
| `48 c1 f9 22` | `sar rcx, 34` | 13 |
| `83 c1 fa` | `add ecx, -6` | 23 |
| `83 f9 04 77 0c` | 先 `cmp ecx, 4`，再 `ja` | 28 |

- Je suis là .`0x66666667`后右移 34 位, équivalent à avoir un symbole déduit de 10 ⋅ dans le fichier, il n'y a pas de 10 ⋅`derive_grade_model()`Pour le dire, le nombre de déductions 10 est basé sur le nombre de multiples 0x66666667 et le nombre de déplacements 34 推导的── dans le dossier il n'y a pas de 10──

`add ecx, -6`La première section est de 6...`cmp ecx, 4`Le coup de pouce sans symbole permet cinq branches, soit 6 à 10

`.text+0x33`- Je suis là.`lea`Avec un nombre accru`0x10`L'adresse réelle du PC32 est calculée en fonction des quatre caractères du terminal de déplacement, de sorte que le nombre de points de déplacement est supérieur à celui de la taille de la machine.`.rodata+0x14`Il y a cinq petits mots pour commencer.`1, 2, 3, 4, 4`Il y a une autre.`ledger.c`Le commutateur intermédiaire pour 60 à 69 retour 1, pour 70 à 10 segments retour 2, pour 80 à 10 segments retour 3, pour 90 à 100 retour 4...

Les enregistrements de la vie`ev_605106bff2d9998f…``confidence`Pour`derived`- Je suis désolé .`evidence_links`Les deux observations qui dépendent de l'enregistrement sont supprimées du livre.`ev_a467c242…`时,上图会显示这个状态──

现在与Ghidra比较──它对同字节给出的伪代码如下:

```c
uint grade(int param_1)
{
  uint uVar1;
  uint uVar2;

  uVar2 = param_1 / 10 - 6;
  uVar1 = -(param_1 >> 0x1f) ^ (uint)((ulong)((long)param_1 * 0x66666667) >> 0x3f);
  if (uVar2 < 5) {
    uVar1 = *(uint *)(&DAT_001000b4 + (ulong)uVar2 * 4);
  }
  return uVar1;
}
```

Ghidra 应用了重定位,并将表命名为 `DAT_001000b4`- Je vais le faire .`.text`- Je suis là.`0x100000`Après, c'est ça.`.rodata+0x14`Il est de retour à 10 et à 5 branches. Pour la valeur par défaut, il sort une expression égale à 0 mais n'écrit jamais directement l'expression 0.`native_value_flow`Le code p central marquera ces opérations en tant que`is_dead: true`                                                                                                                                                                                                                                                              

`percent_change`Les archives montrent une autre faillite.`undefined1 [16] percent_change(int param_1,int param_2,ulong param_3)`Le code source est:`int percent_change(int before, int after)`Il y a une autre.`idiv`写入 `EDX:EAX`, et la voie de valeur zéro n' a pas été modifiée `EDX`, l'antécédent de compilation a donc conclu que 16 caractères retournent à la valeur et un troisième paramètre.`grade` donné `native_api.return_type.confidence`Oui `"low"`◊ devrait être rétablie la signature considérée comme la conclusion de la fournisseur,并如实记录──

## 预测是 推测记录

预测 est une affirmation sur le comportement, n'ayant pas encore obtenu de résultats d'observation.`claim_suite()`根据推导模型和源码构建十八项预测──`record_prediction()`La durée de vie de chaque élément`confidence`Pour`inferred`- Je suis là.`authority`Pour`analyst-inference`Les données sont liées à des données.

| 断言 | 预测值 | 依据 |
|---|---|---|
| `percent_change(12400, 15500)` | 25，来自 310000 / 12400 | 除法模型 `ev_076a9167…` |
| `percent_change(0, 5)` | 0，零值保护分支 | 除法模型 |
| `percent_change(100, 50)` | -50 | 除法模型 |
| `percent_change(-7, 3)` | -142，因为 `idiv` 向零截断 | 除法模型 |
| `grade(55)` | 0，索引 -1 无法通过无符号比较 | 表模型 `ev_605106bf…` |
| `grade(60)`, `grade(69)` | 1, 1 | 表模型 |
| `grade(70)`, `grade(85)` | 2, 3 | 表模型 |
| `grade(95)`, `grade(100)`, `grade(105)` | 4, 4, 4 | 表模型 |
| `grade(110)`, `grade(-5)` | 0, 0 | 表模型 |
| `total(1, 2, 3)`, `total()` | 6, 0 | 源码记录 `ev_2f1e6d25…` |
| `grade_label(85)` | `"B"` | 源码记录和表模型 |
| 90 至 100 的 `grade(score)` | 十一个输入都返回 4 | 表模型 |

`predict()`Utiliser C 语义, plutôt que Python 语义。`c_div()`à l'écart,`wrap32()`Pour chaque valeur moyenne, on doit retourner 32 bits à Python.`//`À l'époque, il y avait des problèmes.`(3 - -7) * 100 // -7`Le programme de formation est de type C.

Chaque projet prévoit la construction d'un projet restant inconnu.`controlled-replay``observed`证据,并建议一次探测: dans l'organisme hôte construit sur exécution `execute_function`△下一节会产生这种证据──第一个级断言问题是:编译后的函数实际运行时,级(95) == 4 是否成立?

## Pour le contrôle de la conduite réelle

`code/fixtures/harness.c`包含 `ledger.c`, chaque fois que vous utilisez imprimez un résultat.`observe_runs()`Utiliser le chemin de la première.`clang`- Je suis là.`cc`Ou `gcc`编译它,并将网格中的每一个输入运行一次──每一次运行都成为一个记录:

```json
{
  "operation": "execute_function",
  "parameters": { "function": "grade", "args": [95] },
  "normalized_result": { "result": 4, "stdout": "4\n", "exit_code": 0 },
  "confidence": "observed",
  "authority": "controlled-replay",
  "environment": { "id": "host-process", "platform": "darwin", "architecture": "arm64", "isolation": "process" },
  "limitations": [
    "The run executed a host build of ledger.c, not the x86-64 object. The claim about the object rests on the shared source and on the compiler.",
    "One run observes one input. It proves nothing about other inputs."
  ]
}
```

L'objet principal de l'enregistrement est le test drive du système de gestion de données, sur Mac, il s'agit du Mac-O arm64, possède son propre SHA-256[6].`course-harness`,附带编译器版本行, ici为 `Apple clang version 17.0.0 (clang-1700.6.3.2)`Il y a une autre.`evidence_links`À l'origine des données`ev_2f1e6d251543d017…`, parce que les produits et les documents objectifs sont uniquement partagés`ledger.c`, à part ça, ce n'est pas la même chose.

Le premier document n'a jamais été utilisé sur cette machine. Il est en réalité utilisé pour la deuxième construction d'une autre structure. Il est toujours observé et, sans l'utilisation d'un simulateur, il est la preuve la plus forte que l'on puisse obtenir, de sorte que l'affirmation peut être adoptée, mais doit être accompagnée de cette limite.

17 fois un seul transport en commun.`code/fixtures/run-evidence.json`Sauvé ce 17 条记录和源码记录, daté du 10-13 du 2026 `--record`导出──没有编译器时,`build_ledger()`importation du document dans le cadre du processus et du rapport `runs`字段中明确说明──

## 提升规则

Il n'y a que par l'observation des opérations qui permettent de se faire une idée.`check_claim()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `execute_function`记录,将每个结果与预测比较,并统计覆盖的输入:

| 状态 | 条件 | rea 的完成账本 |
|---|---|---|
| `pass` | 每个输入都有一致的运行，且没有不一致结果 | `pass` |
| `fail` | 任一次运行不一致 | `fail` |
| `unknown` | 部分输入有运行，其他输入没有 | `unknown` |
| `unsupported` | 没有任何输入有运行记录 | `unsupported` |

`promote_claim()`Il est strictement un signe de la vie.`inferred`Ou `derived`Quand il est écrit, il est jeté dehors.`ClaimError`; les identifiants se réfèrent à d'autres fonctions ou autres paramètres, et se déroulent de manière anormale; la liste est vide ou couvre une opération, mais moins que la demande de déclaration, de même.`grade(55)`Ils possèdent également des faux registres et des modèles de code, mais ils ne peuvent pas améliorer cette affirmation.`ev_7be90c0c…`Tu verras les résultats .`unsupported`En dépit de`grade`Les deux enregistrements existent encore.

La portée des déclarations montre la situation de couverture partielle.`check_claim()`Retour`unknown`- Je suis désolé .`covered`Pour 2 de 11 personnes;`promote_claim()`则拒绝,消息为2 de 11 entrées ont observé des exécutions──账本不会把这个结果上成完整覆盖──

`completion_ledger()`Pour la réaction`EvidenceCompletionLedger` Its identifier `ecl_`Plus de contenu de l'enregistrement, et seulement `pass`Ça va .`total`时,`complete`才为真──因为那一项范围断言,演示输出 `ecl_da64933ea13befed…`,并显示 `complete: false`Il y a une autre.

## Les inconnus sont des archives de la chaîne de haché

Les éléments restants de l'inconnu seront conservés pour des enregistrements de structure stricte.`code/main.py`Utilisation du même type et du même nombre de variables.

L' identifiant est`unk_` `{domain, question, scope_digest}`Le SHA-256, dont le problème se replie en continu en blanc pour un seul espace. Deux analystes posent le même problème à la même source, et obtiennent le même identifiant.`scope_digest`Il s'agit du dossier SHA-256

Chaque modification produit une nouvelle version de la modification 1.`previous_revision_digest`Pour`null`◊ 后续每修订都引用前一版本的 `revision_digest`, résumé de la revue de l'article`verify_unknown_chain()`遍历列表, recalculer chaque résumé, vérifier chaque lien s'il s'agit d'une version précédente,并检查每个版本引用的变更证据是否存在账本中──

Chaque changement est lui-même un enregistrement de preuve, avec l'utilisation réelle de la fourniture.`rea-unknown-registry`La même pratique.`confidence`Pour`derived`- Je suis désolé .`authority`Pour`analyst-inference`, sans sujet, ses limites sont:  les décisions prises par l'analyste, ne prouvent pas la réponse à la question.

C'est la raison pour laquelle les 81 articles de la présentation contiennent 36 articles de changements de type de changement de enregistrement: 18 fois de construction et 18 fois de mise à jour.

Chaque modification doit satisfaire à trois variables:

- - Je ne sais pas .`resolved`Je ne sais pas si tu as des problèmes.`resolution`, et seulement modifié 1 没有前驱──
- `contradicted`Les éléments inconnus citent au moins un identifiant de preuve de réfutation, et le même identifiant ne peut pas apparaître simultanément dans deux listes.
- `verified` resolver résultat au moins en citant un identifiant de preuve ayant une catégorie de confiance et une source d'autorité requises.

La troisième règle est que le lieu le plus fréquemment refusé d'être utilisé dans le compte.`resolve_unknown()`拒绝表模型,也拒绝权威来源为 `shipped-artifact`Des enregistrements d'observation, mais acceptent les enregistrements de fonctionnement.`ev_f4ffbe8f922ec7fe…`Il y a une autre.`grade(95)`已解决的修订为版本 2,其`previous_revision_digest`Pour`ffca840b55a8a188…`, équivaut à la révision 1

`update_unknown()`接收 `expected_revision`, quand il est passé à la fin du temps`revision-conflict`, avec réel `update_unknown`工具相同──正确应对方式也与 rea的说明一致:重新读取当前版本,再作决定──

Après la fin de la présentation, un projet inconnu est encore en cours:`unk_f2eb0d7f84c80a19…`, problème est  compléter  fonction fonctionnel pendant la mise en œuvre, 90 à 100  chaque fraction est-elle satisfaite de la note  score) == 4        `investigating`Les données de recherche suggèrent que neuf entrées ne sont pas encore opérationnelles.

##  répondre缓存 pas base de données d'analyse

Il y a trois sortes de choses qui ressemblent à des archives.`-readOnly -deleteProject`导入,关闭时删除──内存中的 `AnalysisSnapshotCache`Pour un deuxième système de conservation jusqu'à 10 000 articles.`target`- Je suis là.`binding`- Je suis là.`entries`- Je suis là.`workflow_entries`et `evidence_bundle`Il y a une autre.

缓存键是 `query_` `{target, binding, operation, parameters}`Il est de la SHA-256...`target`Pour`{sha256, kind, format, architecture}`- Je suis désolé .`raw-binary`objectif également contenu `entry_point`Il y a une autre.`binding`包含 fournir et toute la configuration de l'analyse,连同摘要── modifier n'importe lequel des 25 paramètres de configuration, par exemple:`jump_table_evidence`De `typed-case-default-blocks-v1`改为 `v2`Tout change, tout change avec lui.

`code/fixtures/rea-snapshot.json`Il contient deux articles, ainsi que deux documents de preuve de conservation.`AnswerCache.import_snapshot()`重新计算每个 `query_id`Toutes les différences sont rejetées.`target`Ou `binding`Contrairement à la valeur actuelle, il utilise réal`profile_mismatch`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `format_version`Non , pas du tout .`course-answer-cache-1`Je vais aussi refuser.

Les trois mesures sur cette machine sont les suivantes:`grade`Retour à la recherche de Ghidra, 8,6 secondes; pour la même photo`percent_change`La requête prend 8,5 secondes, car les différentes requêtes ne seront pas mises en cache.`grade`L'enquête prend 2,1 secondes, retourne à la même consigne.`evidence_id` Réinitialisation de la répartition de l'équipement:                                                                                                                                                                                                                                                       `lookup()`Il y a aussi des explications similaires, permettant au lecteur de se distinguer entre la ré-position et la nouvelle réponse.

变更会终止缓存使用──在 rea 6.5.0 中, renommer ou ajouter注释会在调用发送给提供者之前清空快照缓存──失败响应不能证明写入已回滚,因此写入失败也会停止重放──将修改数据库元数据导入同样──

## Pourquoi le corps intelligent a-t-il besoin de cela ?

 À travers le MCP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `evidence_id`Une étude de 2026 a montré que les outils de surconfiance sont facilement équivautants. La sortie de surconfiance est l'un des quatre points faibles de l'étude NDSS BAR.[arXiv 2606.06838](https://arxiv.org/abs/2606.06838)): Pour les fichiers de seconde nature qui ont des centaines de fonctions, seulement 10% à 15% des fonctions sont réellement analysées avant la génération du code par l'intelligent.

账本用记录回应每一个问题,智能体只报告账本中的内容――没有观察运行的断言为`unsupported`, seulement une partie des opérations`unknown`◊ fournir des textes de`observed`Il n'y a que les fournisseurs de produits et services qui ne représentent pas plus.`outputs/`Le livre de compétences est remis à un corps intelligent et le livre devient le seul endroit où il peut être écrit.

## La construction de soi

运行仅使用标准库的演示:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
```

演示读取目标文件,导入两条 rea 记录,验证 rea 快照,并推导两个模型――, puis enregistrer 18 projets prévus, créer 18 projets inconnus, compiler et exécuter des tests, vérifier chaque proposition, ré-résoudre 17 projets inconnus――, structure de l'expérience est la suivante:

```json
{
  "records": 81,
  "by_confidence": { "observed": 25, "derived": 38, "inferred": 18 },
  "rea_snapshot": { "entries": 2, "replay_hit": true, "stale_profile_refused": true },
  "grade_table": [1, 2, 3, 4, 4],
  "runs": "live: Apple clang version 17.0.0 (clang-1700.6.3.2)",
  "claims": [ { "claim_id": "grade(95)", "status": "pass", "covered": "1/1" }, { "claim_id": "grade(90..100)", "status": "unknown", "covered": "2/11" } ],
  "completion_ledger_id": "ecl_da64933ea13befed9483f8b00447bb3f4ceb74324c01e2515eff03f3af3ca750",
  "complete": false,
  "unknowns": { "resolved": 17, "investigating": 1 }
}
```

没有 C 编译器时,`runs`显示 `imported 17 recorded run records from run-evidence.json`Le reste est le même.

按以下顺序阅读 `code/main.py`- Le numéro de la liste:

1. `canonical_json()`et `compute_evidence_id()`实现哈希方法和语义投影──
2. `create_evidence()`et `validate_evidence()`构建并检查记录──
3. `EvidenceLedger.record()`et `import_bundle()`保存记录并拒绝冲突。
4. `open_unknown()`- Je suis là.`update_unknown()`et `resolve_unknown()`维护修订链。
5. `observe_object()`读取 ELF,`derive_grade_model()`Je suis en train de lire.
6. `claim_suite()`- Je suis là.`predict()`et `record_prediction()`写入推测层记录──
7. `observe_runs()`La mise en œuvre de la méthode de test est transmise en un enregistrement d'observation.
8. `check_claim()`- Je suis là.`promote_claim()`et `completion_ledger()`应用提升规则──
9. `AnswerCache`像 rea 快照一样为回答设置键,并拒绝过期结果──

## Utilisez-le

Pour chaque objectif, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, chaque enquête, quelle se soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit soit`provider`, faire identifier naturalisation;. Lorsqu'un objet est reconstruit, le résumé du sujet est modifié, tous les anciens documents sont devenus des preuves d'un autre document.

Une fois que vous savez le nombre de limites, vous écrivez immédiatement. Le lecteur ne re-pilote pas, il explique clairement.

Les caractères et les faux codes de l'objectif sont tous des textes contrôlés par l'objectif, ne peuvent jamais devenir des instructions, ne peuvent jamais devenir des observations de comportement.`_meta.provenance.untrusted_content: true`标记此类结果──其服务器指令要求模型将目标内容视为数据,并将其中要求运行,安装,下载或发送内容的请求报告作为提示注入企图──标记有助,但账本仍然必须确保目标文本不会进入指令层──

## 交互实验

### 实验 A:重新计算 ré 标识符

Dans le`code`Pour le démarrage de Python:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/code
python3 -q
```

运行:

```python
from main import *
record = load_evidence_file(FIXTURES / "rea-evidence-grade.json")
record["evidence_id"] == compute_evidence_id(record)
record["subject"]["local_path"] = "/home/you/re/ledger-x86_64-O1.o"
record["evidence_id"] == compute_evidence_id(record)
record["limitations"].pop()
record["evidence_id"] == compute_evidence_id(record)
```

Les deux résultats de la comparaison sont vrais, parce que le chemin n'est pas participé.

### 实验 B: refuser de se mettre à l'épreuve

```python
ledger, report = build_ledger(live_runs=False)
claim = [c for c in claim_suite(ledger.find(operation="derive_switch_model")[0], ledger.find(operation="derive_arithmetic_model")[0], ledger.find(operation="read_source")[0]) if c.claim_id == "grade(55)"][0]
promote_claim(ledger, claim, [ledger.find(operation="derive_switch_model")[0]["evidence_id"]])
```

La réutilisation de la mise en`ClaimError`,并指出推导记录的标识符──现在传入运行记录标识符:

```python
run = run_records_for(ledger, "grade", [55])[0]
promote_claim(ledger, claim, [run["evidence_id"]])["status"]
```

 état pour `pass`, retour de `limitations`Maintenir l'accueil de l'établissement

### 实验 C: refuser le passage rapide

```python
import json
snapshot = json.loads(REA_SNAPSHOT_PATH.read_text())
target, binding = rea_snapshot_binding(snapshot)
AnswerCache(target, binding).import_snapshot(snapshot)
stale = dict(binding["analysis_profile"]["parameters"], jump_table_evidence="typed-case-default-blocks-v2")
AnswerCache(target, {"provider": binding["provider"], "analysis_profile": make_profile(binding["provider"], stale)}).import_snapshot(snapshot)
```

La première fois, la deuxième fois, la deuxième fois.`profile_mismatch``CacheError`Il n'y a qu'une seule version, et tout le film est rejeté.

### 实验 D: perturbation

```python
unknown_id = [u for u, r in ledger.unknowns.items() if r[-1]["status"] == "investigating"][0]
ledger.verify_unknown_chain(unknown_id)
ledger.unknowns[unknown_id][0]["severity"] = "critical"
ledger.verify_unknown_chain(unknown_id)
```

La première fois, il faut le mettre en place.`EvidenceIntegrityError`, puisque l'amendement 1 ne correspond plus à son résumé, l'amendement 2 se dirige vers un résumé qui n'existe plus.

## 实践实验

关闭未解决未知项目,并添加第二个提供方──

要求:

- 扩展 `run_grid()`, la portée de la mise en œuvre de la déclaration de manque de neuf entrées, puis confirmer les éléments inconnus dans la modification 3 变为 `resolved`Il y a une autre.
- Il va`llvm-objdump -d`添加为第二个提供方, utiliser le sien `provider`Les données sont à jour.`grade`清单记录为 `observed`Il y a une autre.
- 写入一条  Je suis là`derived`记录,说明 Ghidra 和 llvm-objdump's two parts 清单解码出相同的14条指令,并同时链接两者──
- Pour`grade_label(105)`Une nouvelle série de travaux`high`Les résultats sont très intéressants.`labels[4]`; réellement, il faut le résoudre.
- Utilisation `export_bundle()`导出账本,再导入全新账本,证明每条链仍可通过验证──

Success standard: chaque phrase du rapport cite un identifiant dans le paquet de preuves, et cet élément `unknown`Le mot est éliminé.

## Le produit

本课产 出 `outputs/skill-evidence-ledger.md`Il guide les organismes intelligents à écrire chaque découverte en tant que dossier de catégories de confiance, de sources d'autorité, de restrictions et de liens, en expliquant comment conserver les inconnus avec la version modifiée, ainsi que quand les conclusions seront prises.`pass`- Je suis là.`fail`- Je suis là.`unknown`Ou `unsupported`Il y a une autre.

## 验证

运行演示和确定性测试套件:

```bash
cd phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

28 项测试证明:

- 两个 ré `evidence_id`、 configure résumé et deux photos `query_id`Il peut être recalculé
- 改变路径不改变标识符,改变限制则改变标识符
- Les enregistrements modifiés, les offres de configures non conformes, les chiffres de points et les valeurs de référence inconnues seront rejetés.
- Récapitulatif`duplicate`, les enregistrements de conflits, les manifestations, les preuves, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les documents de conflits, les conflits, les conflits, les conflits, etc.
-  18 articles de documents de transport enregistrés, sans lien de référence
- Je ne sais pas ce que je veux dire.`expected_revision`, et seulement observé .`controlled-replay`Les preuves pour y remédier
- 编辑修订内容会破坏链
- 提升拒绝推测、推导、空列和无关证据, uniquement lorsque les résultats du travail sont conformes
- 部分覆盖为 `unknown`,不一致运行则为 `fail`
- 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存 缓存
- 缓存 refuser de mettre à niveau la version de configuration 错误目标 错误格式版本和改的键
- ELF 读取器 转移、大小、字节和重定位上与 `llvm-objdump`Un coup, une lettre`1, 2, 3, 4, 4`
- 预测 usage C except français, et déjà enregistré fonctionnement avec tous les 17 单输入断言一致
- 存在编译器时,实时运行结果也一致

## Mode de défaillance dans l'environnement de production

| 失败 | 不严谨的报告会说什么 | 账本的要求 |
|---|---|---|
| 将伪代码读作行为 | “grade 对不及格分数返回 0” | 该输入的 `execute_function` 记录，否则为 `unsupported` |
| 信任反编译器签名 | “percent_change 返回 16 字节” | 将签名标为提供方推断，并保留其 `low` 置信度 |
| 将空列表读作不存在 | “函数没有调用者” | `unknown` 状态，或工具提供的覆盖字段 |
| 将路径纳入标识符哈希 | 复制后“记录变了” | 不含 `name` 和 `local_path` 的语义投影 |
| 复制时丢弃限制 | 记录看起来比来源更强 | 标识符不匹配，导入时拒绝 |
| 将部分网格夸大为完整覆盖 | “90 起的所有分数都通过” | `unknown`，并显示 `covered` 为 11 中的 2 |
| 将宿主机运行说成目标文件运行 | “x86-64 目标文件返回了 25” | 断言必须携带宿主机构建的限制说明 |
| 用一句话关闭未知项 | “已解决，见上文” | `verified` 解决结果，引用所需权威来源的观察证据标识符 |
| 覆盖过期修订 | 两位分析者的编辑冲突 | `revision-conflict`，然后重新读取 |
| 新版本发布后重放旧快照 | 回答来自已变更的契约 | 导入时返回 `profile_mismatch` |
| 重命名后仍保留缓存 | 重放掩盖了元数据写入 | 发送操作前使缓存失效，并令导出失败 |

## 操作准则

Utilisez trois catégories pour enregistrer le contenu que vous avez lu, le contenu calculé et les résultats attendus. Utilisez un identifiant pour fermer un élément inconnu, sans aucun doute une phrase pour remplacer les preuves.

## 延伸阅读

- [rea 6.5.0 source, `src/domain/evidence.ts` and `src/domain/residualUnknown.ts`](https://github.com/morluto/rea)
- [RFC 8785, JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)
- [Ghidra 12.1.4 release](https://github.com/NationalSecurityAgency/ghidra/releases)
- [Agent Failure Patterns in CTF Reverse Engineering, NDSS BAR 2026](https://www.ndss-symposium.org/wp-content/uploads/bar2026-58.pdf)
- [When Binaries Talk Back: Representation-Confusion Attacks on LLM-Assisted Reverse Engineering, arXiv 2607.12507](https://arxiv.org/abs/2607.12507)
- [Agentic decompilation study, arXiv 2606.06838](https://arxiv.org/abs/2606.06838)
- [When LLM Decompilers Recompile More and Preserve Less, arXiv 2609.05370](https://arxiv.org/abs/2609.05370)
- Le code source est 6.5.0`3b79af2`Le numéro de la liste:`src/domain/evidence.ts`- Je suis là .`.agents/skills/reverse-engineer-anything/SKILL.md`- Je suis là .`docs/cli.md`- Je suis là .`src/domain/reconstructionVerification.ts`- Je suis là .`src/application/ReconstructionObligationCandidates.ts`- Je suis là .`docs/tool-design.md`- Je suis là .`src/domain/evidenceCompletionLedger.ts`- Je suis là .`src/domain/residualUnknown.ts`- Je suis là .`src/application/investigation/UnknownEvidence.ts`- Je suis là .`.agents/skills/reverse-engineer-anything/references/evidence-workflows.md`- Je suis là .`src/application/binary/AnalysisSnapshotCache.ts`- Je suis là .`src/domain/analysisSnapshot.ts`- Je suis là .`src/application/binary/BinarySession.ts`- Je suis là .`src/application/binary/BinarySessionRecords.ts`- Je suis là .`docs/mcp-contracts.md`- Je suis désolé .
