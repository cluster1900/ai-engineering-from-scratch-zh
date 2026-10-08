# 结构化输出  JSON Schema, Pydantic, Zod, Decodificação Restriída

>  Boa exigência do modelo de retorno JSON Mesmo no modelo da linha de frente, há 5% a 15% de tempo que falharão Structured output via Constrained Decoding  Reduzido esse diferencial: o modelo será praticamente impedido de gerar qualquer violação de esquema Token OpenAI  Estritamente modo Antropic  Utilização de ferramentas tipo esquema  Gemini `responseSchema`A IA Pidantica`output_type`, bem como Zod `.parse`, são cinco formas de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma de forma

**类型：**Construção
**语言：**Python(stdlib,JSON Schema 2020-12 子集)
**前置要求：**Fase 13 · 02 (função que chama a mergulho profundo)
**时间：**Cerca de 75 minutos

## Objectivo de aprendizagem

- Utilize correct约束(enum、min/max、required、pattern) para o objetivo de extração 编写 JSON Schema 2020-12。
- Explicação de por que o modo rigoroso e a descodificação restrita fornecem garantias diferentes da reavaliada após a produção.
- 区分三种失败模式: erro de parse, violação de esquema, recusa de modelo
- 交付一条带 reparos tipados 和 manipulação de rejeição tipada de tubo de extracção

## 问题

Um agente de compra e compra de encomendas de correio precisa de traduzir o texto livre`{customer, line_items, total_usd}`Há três formas de fazer isto.

**方法一：提示模型输出 JSON。** Em JSON 回复,字段包括客户、line_items、total_usd。 Em modelos de frente há 85% a 95% do tempo disponível。 irá ser usado de seis formas: falta de grandes parentheses、尾随逗号、类型错误、幻觉字段、在 Token 限制处截断、泄漏类似

**方法二：生成后验证。**Libertad de gerar, resolver, verificar, falhar, depois de tentar novamente. É confiável, mas caro.

**方法三：Constrained Decoding。**提供商在解码时强制执行方案──无效 Token 会从采样分布中被掩盖掉──输出保证可解析,并且保证通过验证──失败会收到一种模式:refusal(模型判断输入不符合方案)──

Até 2026, cada fornecedor de linha de frente oferecerá uma forma ou outra de solução.

- **OpenAI。** `response_format: {type: "json_schema", strict: true}`, se o modelo rejeitar, a resposta incluirá`refusal`- Não.
- **Anthropic。**Para o`tool_use`输入执行 execução do esquema;`stop_reason: "refusal"`Não existe, mas não há ferramenta chamada de `end_turn`É o sinal.
- **Gemini。**Peliculação de nível `responseSchema`;2026 Year Gemini 针对特定类型提供 Token 级语法限制──
- **Pydantic AI。** `output_type=InvoiceModel`O tipo de`InvoiceModel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `RunResult`- Não.
- **Zod (TypeScript)。**运行时 parser, usando Zod schema 验证提供商输出;可与 OpenAI 的 `beta.chat.completions.parse`配合使用──

共同点是: uma vez declarada esquema, de fim a fim obrigatória execução.

## 概念

### JSON Schema 2020-12  通用语

Cada fornecedor aceita JSON Schema 2020-12── sua construção mais comum inclui:

- `type`- Não .`object`- Não.`array`- Não.`string`- Não.`number`- Não.`integer`- Não.`boolean`- Não.`null`Uma das duas.
- `properties`O que é o "Sex"
- `required`O que é que é o que é necessário para o desenvolvimento?
- `enum`: permitir valor de fechamento conjunto。
- `minimum`- Não .`maximum`(número),`minLength`- Não .`maxLength`- Não .`pattern`Não sei.
- `items`: é utilizado em subesquemas de cada um dos elementos
- `additionalProperties`- Não .`false`禁止额外字段 (proibido)

O modo rigoroso da OpenAI aumentou três requisitos: cada propriedade deve ser listada em`required`No meio, todos os lugares têm de estar.`additionalProperties: false`, e não pode ter um problema resolvido .`$ref`Se violarem estas exigências, a API irá devolver 400

### Pydantic, Python 绑定

Pydantic v2          `model_json_schema()`A partir do modelo de forma de classe de dados, é gerado um esquema JSON.

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

O quadro de agentes 会在边界处把 schema 转换到OpenAI rigoroso modo、Antropic `input_schema`Ou Gémeos`responseSchema` Modelo de encontro e de tipografia`Invoice`实例返回──验证错误会抛出 `ValidationError`, e tem errores de classificação.

### Zod,TypeScript 绑定

Zod(`z.object({customer: z.string(), ...})`O SDK do Node de OpenAI foi exposto.`zodResponseFormat(Invoice)`, ele será transformado em carga útil do esquema JSON da API.

### Refusos

Modo rigoroso 不能强迫模型回答──如果输入无法适应 schema(邮件是一首诗,不是发票),模型会发发含原因的 `refusal`字段── Seu código deve ser tratado como um primeiro resultado, e não como um fracasso── recusa também pode ser usado como sinal de segurança: quando um modelo é solicitado a tirar um número de cartão de crédito de um e-mail protegido, ele retornará com uma razão de segurança para recusar──

### 开放环境中的 Descodagem restrita

开放权重实现使用三种技术──

1. **Grammar-based decoding**(`outlines`- Não.`guidance`- Não.`lm-format-enforcer`): a partir do esquema construir um autônomo finito determinista; em cada passo, mascar 掉会违反FSM's Token logits──
2. **带 JSON parser 的 logit masking**:运行一个与模型同步的流媒体 JSON parser;在每一步计算有效-下一个代码集合──
3. **带 verifier 的 speculative decoding**O modelo de projeto de preço barato 提议 Token,verifier 强制执行方案──

O novo nível de 2026 é: a produção estruturada curta é mais rápida do que a produção normal, a produção estruturada longa é quase igual.

### 三种失败模式

1. **Parse error。**输出不是有效 JSON──在严格模式下不会发生──在非严格 供应商上仍可能发生──
2. **Schema violation。**O resultado pode ser resolvido, mas é muito comum que o resultado seja contrário ao esquema.
3. **Refusal。**模型拒绝──必须作为类化结果处理──

### 重试策略

Quando você não está no modo rigoroso, o modo de recuperação é:

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

Uma reexperimentação geralmente é suficiente. Três reexperimentações podem capturar problemas de modelos.

### 小模型支持

O decodificação restrita  é adequado para pequenos modelos  Em tarefas estruturais, um modelo aberto de 3B parâmetros com aplicação gramatical, apresenta melhor desempenho do que o modelo de 70B parâmetros de orientação original . É a principal razão pela qual o output estruturado é importante para o ambiente de produção: ele considera a confiabilidade e o modelo grande.


```figure
constrained-decoding
```

## Use-o

`code/main.py`提供一个用 stdlib 编写的最小 JSON Schema 2020-12 validator(tipos、requisitos、enum、min/max、pattern、items、additionalProperties) ⋅ é embalagem de um `Invoice`O resultado do LLM pode ser transformado em resposta real de qualquer fornecedor.

需要关注的点:

- Validador  retornar a um tipo `[ValidationError]`Lista, contém caminho e mensagem. É o que você quer que seja exposto.
- recusa 分支不会重试──它会记录日志并返回类型化 recusa──Fase 14 · 09 Utilize rejeições 作为安全信号──
- `additionalProperties: false`检查会在对抗性测试输入上触发, demonstrar por que o modo rigoroso 会把幻觉字段在门外──

## Entrega-o

本课产 出 `outputs/skill-structured-output-designer.md` Determinar um objetivo de extração de texto livre (invoice, support tickets, resumes, etc.), que irá gerar um JSON Schema 2020-12 com modo rigoroso, bem como um modelo Pydantic com imagem, e inserir rejeição tipada e re-tentar manipulação stub.

## 练习

1. 运行 `code/main.py`◊ Añadir o quarto teste de uso, `total_usd`Por negativo número.`minimum`O caminho do amor é rejeitá-lo.

2.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              `oneOf`❖ Condições comuns:`line_item`Ou seja, produto, ou serviço, ou seja,`kind`打标签──Strict mode Há aqui algumas regras; consulte o guia de saídas estruturadas do OpenAI──

3. Colocar um esquema de faturamento em Pydantic BaseModel,并将 `model_json_schema()`输出与你手写的图对比──找出 Pydantic 默认设置但手写版本遗漏的一个字段──

4. 测量拒绝率 ∼构造十个不应可提取的输入(一段歌词、一个数学证明、一封空白邮件),并通过带严格模式的真实提供商运行它们──统计拒绝与幻觉的输出──这是你进行拒绝意识的重复试验的基本真理──

5. Do início ao fim ler o guia de saídas estruturadas do OpenAI. Descobre que está em modo estritamente proibido, mas o normal JSON Schema permite uma construção.

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

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs) rigoroso modo 、recusos e requisitos de esquema
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 2024 年 8 月发布文章,解释 decoding guarantee
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) A reunião seria organizada para os tipos de output_type de ligações tipados de cada fornecedor
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes) especificação canónica
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项 企业部署说明和严格模式注意事项
