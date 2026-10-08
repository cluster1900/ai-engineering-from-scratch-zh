# 结构化输出  Schéma JSON, Pydantic, Zod, décoding restreint

>  bon bon requérir le modèle retourne JSON même sur le modèle avant, il y a 5% à 15% de temps qui échouera  Structured output via Restricted Decoding  réduit cette différence: le modèle sera en fait empêché de générer tout schéma contraire à Token  OpenAI  Strict mode  Anthropic  Schéma-typed tool usage  Gemini `responseSchema`L'IA pydaénique`output_type`, ainsi que Zod `.parse`Les cours de ce type seront constitués de validateurs de schéma et de contrats de mode strict, les apprenants les utiliseront dans chaque pipeline d'extraction de production.

**类型：**Construction
**语言：**Python(stdlib, JSON Schema 2020-12 子集)
**前置要求：**Phase 13 · 02 (fonction appelant à la plongée profonde)
**时间：**À environ 75 minutes.

## Objectif de l'apprentissage

- Utilisation de l'échantillon de type type type type (enum、min/max、required、pattern) pour l'objectif d'extraction
- Expliquer pourquoi le mode strict et le décoding restreint sont différents des garanties fournies par le réacquisition après la production.
- 区分三种失败模式: erreur de partage, violation du schéma, refus du modèle
- 交付一条带 réparation typée 和 traitement de refus de type de tuyau d'extraction

##  problématique

Un agent de courrier électronique a besoin de traduire le texte en libre`{customer, line_items, total_usd}`Il y a trois façons de le faire.

**方法一：提示模型输出 JSON。** Avec JSON 回复,字段包括客户、line_items、total_usd。 sur le modèle de la frontière il y a 85% à 95% du temps disponible。 avec six façons de défaut:

**方法二：生成后验证。**Liberté de générer, de résoudre, d'évaluer, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de tester, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier et de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier et de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier et de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de vérifier, de la vérifier, de vérifier, de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de la qualité de

**方法三：Constrained Decoding。**提供商在解码时强制执行方案──无效Token 会从采样分布中被掩盖掉──输出保证可解析,并且保证通过验证──失败会收到一种模式:refusal(模型判断输入不符合方案)──

D'ici 2026, chaque fournisseur de premier plan proposera une sorte de méthode.

- **OpenAI。** `response_format: {type: "json_schema", strict: true}`, si le modèle refuse alors la réponse comprend`refusal`Il y a une autre.
- **Anthropic。**Pour le`tool_use`输入执行 mise en œuvre du schéma;`stop_reason: "refusal"`Il n'existe pas, mais il n'y a pas d'appel d'outils `end_turn`C'est le signal.
- **Gemini。**La demande de classe `responseSchema`;2026 Year Gemini 针对特定类型提供代码级语法限制──
- **Pydantic AI。** `output_type=InvoiceModel`Résultats de la formation`InvoiceModel`                     `RunResult`Il y a une autre.
- **Zod (TypeScript)。**运行时 parser, avec Zod schéma 验证提供商输出;可与 OpenAI 的 `beta.chat.completions.parse`配合使用。

共同点是: une fois déclaré schéma, fin à fin obligatoire de l'exécuter.

## 概念

### Schéma JSON 2020-12  通用语

Chaque fournisseur accepte le schéma JSON 2020-12[6]. Les constructions les plus courantes incluent:

- `type`- Le numéro de la liste:`object`- Je suis là.`array`- Je suis là.`string`- Je suis là.`number`- Je suis là.`integer`- Je suis là.`boolean`- Je suis là.`null`Une seule.
- `properties`:字段名到 sous-schéma 的映射──
- `required`: doit apparaître
- `enum`: permettre la valeur de la collecte de l'arrêt.
- `minimum`- Je suis là .`maximum`(numéro),`minLength`- Je suis là .`maxLength`- Je suis là .`pattern`Je suis désolé.
- `items`: est utilisé pour chaque sous-schéma de chaque élément de l'élément
- `additionalProperties`- Le numéro de la liste:`false`禁止额外字段(默认值因模式而异)

Le mode strict OpenAI a ajouté trois exigences: chaque propriété doit être classée en`required`Toutes les positions doivent être prises.`additionalProperties: false`, et ne peut pas avoir d' indéterminé`$ref`Si ces exigences sont enfreintes, l'API sera en mesure de les renvoyer à 400.

### Pydantic, Python 绑定

Pydantic v2  par le `model_json_schema()`De la classe de données 形状のモデル 生成 JSON Schema。Pydantic AI a fait une enveloppe à ce sujet, vous pouvez donc écrire comme suit:

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

Le cadre d'agents 会在边界处把 schema 转换到OpenAI strict mode、Anthropic `input_schema`Ou Gémeaux `responseSchema` Modèle de type de rencontre`Invoice`实例返回──验证错误会抛出 `ValidationError`, et ont eu des erreurs de typage.

### Zod,TypeScript 绑定

Je suis un homme.`z.object({customer: z.string(), ...})`) est TS et autres objets.`zodResponseFormat(Invoice)`, il sera transformé en charge utile du schéma JSON de l'API.

### Réjections

Mode strict 不能强迫模型回答──如果输入无法适应 schema(邮件是一首诗,不是发票),模型会发发出包含原因的`refusal`字段── Votre code doit être traité comme un résultat de première classe, et non comme un échec──réfusion peut également être utilisé comme un signal de sécurité: lorsque le modèle est demandé à retirer un numéro de carte de crédit du courrier électronique protégé, il revient avec un refus de sécurité──

### Open environment Décodage restreint

开放权重实现使用三种技术──

1. **Grammar-based decoding**(le secteur de l'énergie)`outlines`- Je suis là.`guidance`- Je suis là.`lm-format-enforcer`): à partir du schéma construire un automate finit déterministe; en chaque étape, le masque 掉会违反 FSM's Token logits。
2. **带 JSON parser 的 logit masking**:运行一个与模型同步的流媒体JSON parser;在每一步计算有效-下一个代码集合──
3. **带 verifier 的 speculative decoding**: un projet de modèle 提议 Token, vérificateur 强制执行方案。

L'un des derniers niveaux de l'année 2026 est celui de la production structurée courte plus rapide que la production ordinaire, et de la production structurée longue plus ou moins la même.

### 3 modes de défaillance

1. **Parse error。**输出 n'est pas valide JSON.                                                                                                                                                                                                                                                          
2. **Schema violation。**La sortie peut être résolue, mais contre le schéma.
3. **Refusal。**模型 rejet.  doit être traité en tant que type de résultat.

### Réfléchissez à la stratégie

Lorsque vous n'êtes pas en mode strict, le mode de récupération est:

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

Une fois de nouveau est généralement suffisante. Trois fois de nouveau est capable de saisir un modèle qui se pose parfois des problèmes.

### 小模型支持

Le décoding restreint est adapté à un petit modèle. Dans les tâches structurées, un modèle 3B avec paramètres ouverts de mise en œuvre grammaticale, fonctionne mieux que l'utilisation du modèle 70B avec paramètres originaux.


```figure
constrained-decoding
```

## Utilisez-le

`code/main.py`提供一个用 stdlib 编写的最小JSON Schema 2020-12 validator(types、required、enum、min/max、pattern、items、additionalProperties) `Invoice`Le système de gestion de la production de produits de la société peut être modifié en réponse à la demande de l'entreprise.

需要关注的点:

- validateur  retourner à un type `[ValidationError]`La liste, contient le chemin et le message. C'est exactement ce que vous voulez que je vous montre.
- Résistance à la réception 分支不会重试──它会记录日志并返回类型化拒绝──Phase 14 · 09 Utilisation de refus 作为安全信号──
- `additionalProperties: false`检查会在对抗性测试输入上触发, démontrer pourquoi le mode strict 会把幻觉字段在门外──

## Je le livre.

本课产 出 `outputs/skill-structured-output-designer.md` Donner une cible d'extraction de texte libre (invoices, billets de soutien, résumés, etc.), cette compétence générera un schéma JSON compatible avec le mode strict 2020-12, ainsi qu'un modèle Pydantic avec l'image de l'image, et une réinitialisation et une tentative de manipulation de nouveau stub.

## 练习

1. 运行  référencement`code/main.py`◊ Ajouter un quatrième test usage,其 `total_usd`Pour le nombre négatif, le validateur confirme.`minimum`Il a refusé de le faire.

2.  étendre le validateur, en le soutenant avec le discriminateur `oneOf`❖ Situation habituelle:`line_item`Ou bien produit, ou service, ou par`kind`打标签──Strict mode ️ Il y a ici quelques règles; veuillez consulter le guide des sorties structurées d'OpenAI──

3. Pour mettre le même schéma de facture 写成 Pydantic BaseModel,并将 `model_json_schema()`输出与你手写的图案对比──找出Pydantic 默认设置但手写版本遗漏的一个字段──

4. 测量拒绝率 ∼构造十个不应可提取的输入(一段歌词、一个数学证明、一封空白邮件),并通过带严格模式的真实提供商运行它们──统计拒绝与幻觉输出──这是你进行拒绝意识重复试验的基本真理──

5. Découvrez comment il est strictement interdit, mais le schéma JSON ordinaire permet une construction.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| JSON Schema 2020-12 | “schema spec” | 每个现代提供商都支持的 IETF-draft schema dialect |
| Strict mode | “保证符合 schema” | OpenAI 通过 Constrained Decoding 强制执行 schema 的标志 |
| Constrained decoding | “Logit masking” | decode 时的强制执行，会 mask 无效的下一个 Token |
| Refusal | “模型拒绝” | 输入无法适配 schema 时的类型化结果 |
| Parse error | “无效 JSON” | 输出无法解析为 JSON；在 strict 下不可能发生 |
| Schema violation | “形状错误” | 已解析但违反 type / required / enum / range |
| `additionalProperties: false` | “不允许额外字段” | 禁止未知字段；OpenAI strict 中必需 |
| Pydantic BaseModel | “类型化输出” | 会发出并验证 JSON Schema 的 Python class |
| Zod schema | “TypeScript output type” | 用于提供商输出验证的 TS runtime schema |
| Grammar enforcement | “开放权重 constrained decode” | 基于 FSM 的 logit masking，如 outlines / guidance 中所用 |

## 延伸阅读

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) strict mode 、 refus et exigences de schéma
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 2024 年 8 月发布文章, expliquer garantie de décoding
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) L'organisation des liens de type output_type typé par chaque fournisseur
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) spécifications canoniques
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项
