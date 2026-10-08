# 结构化输出  JSON 方案,Pydantic,Zod,限制式解码

> 好好要求模型返回JSON即使在前沿模型上,也有5%至15%的时间会失败――结构化输出通过限制式解码缩小了这一差距:模型实际上会被阻止生成任何违反方案的代币――OpenAI的严格模式、人类的方案类型工具的使用、双子`responseSchema`平达人人工智能`output_type`子和子`.parse`学生将在每一条生产阶段提取管道中使用它们.

**类型：**构建
**语言：**字符串 (stdlib,JSON Schema 2020-12 子集)
**前置要求：**阶段13 · 02(调用深度潜水的功能)
**时间：**约75分钟

## 学习目标

- 使用正确的约束(enum、min/max、required、pattern) 为提取目标编写JSON Schema 2020-12。
- 解释为什么严格模式和限制式解码的保证与生成后再验证不同.
- 区分三种失败模式:解析错误,方案违规,模型拒绝.
- 交付一条带类型维修和类型拒绝处理的提取管道。

## 问题

一个读取采购订单邮件的代理 需要把自由文本转换`{customer, line_items, total_usd}`有三种做法.

**方法一：提示模型输出 JSON。**以 JSON 回复,字段包括客户端、线_项目、总_usd。在前沿模型上有85%~95%的时间可用。会以六种方式失败:缺少大括号、尾随逗号、类型错误、幻觉字段、在代币限制处截断、泄漏类似

**方法二：生成后验证。**根据计划验证,失败后重试――可靠但昂贵,你需要支付每次重试费用,而且每次出现一次的断断错误就花了一轮――

**方法三：Constrained Decoding。**提供商在解码时强制执行方案――无效代币 会从采样分布中被掩盖掉――输出保证可解析,并且保证通过验证――失败会收到一种模式:拒绝――模型判断输入不符合方案.

到2026年,每一个前沿供应商都提供了某种形式的方法.

- **OpenAI。** `response_format: {type: "json_schema", strict: true}`如果模型拒绝则响应中包含`refusal`,我知道.
- **Anthropic。**对于`tool_use`输入执行方案执行;`stop_reason: "refusal"`没有,但没有工具的呼叫.`end_turn`这就是信号.
- **Gemini。**要求级别`responseSchema`双子座2026年 针对特定类型提供代币级语法限制.
- **Pydantic AI。** `output_type=InvoiceModel`发发类型为`InvoiceModel`结构化`RunResult`,我知道.
- **Zod (TypeScript)。**运行时解析器,使用Zod方案验证提供商输出;可与OpenAI的`beta.chat.completions.parse`配合使用.

共同点是:一次声明方案,端到端强制执行.

## 概念

###  JSON 方案 2020-12  通用语

每个供应商都接受了2020-12 JSON方案.

- `type`其他:`object`,我知道.`array`,我知道.`string`,我知道.`number`,我知道.`integer`,我知道.`boolean`,我知道.`null`之一.
- `properties`字段名到子方案的映射──
- `required`必须出现的字段名列表
- `enum`允许值的封闭集合――
- `minimum`现在,`maximum`其他`minLength`现在,`maxLength`现在,`pattern`现在,我在做什么?
- `items`应用于每个数组元素的子方案.
- `additionalProperties`其他:`false`禁止额外字段 (默认值因模式而异)

开放AI严格模式 增加了三个要求:每个财产都必须列在`required`在中,所有的位置都必须有.`additionalProperties: false`并且不能有未解决的`$ref`如果违反这些要求,API会在请求时返回400.

### ,,

通过Pydantic v2`model_json_schema()`从数据类形状模型 生成JSON Schema──Pydantic AI对此做封装,所以你可以这样写:

```python
class Invoice(BaseModel):
    customer: str
    line_items: list[LineItem]
    total_usd: Decimal
```

机器人框架 会在边界处把方案转换为OpenAI严格模式、人类`input_schema`或是双子座`responseSchema`△模型输出见面以类型化`Invoice`实例返回──验证错误会抛出 `ValidationError`没有出现类型化错误路径.

### 编辑: 编辑:

子子`z.object({customer: z.string(), ...})`开放AI的 Node SDK 暴露了`zodResponseFormat(Invoice)`它们将转换为 API 的 JSON 方案有效载荷.

### 拒绝

严格模式 不能强迫模型回答. 如果输入无法适应方案,则邮件是一个诗,而不是发票.`refusal`字段──你的代码必须把它视为第一级结果处理,而不是作为失败──拒绝也可以作为安全信号:当模型被要求从受保护内容邮件中提取信用卡号时,将回报带有安全原因的拒绝──

### 开放环境中的限制解码

开放权重实现使用三种技术.

1. **Grammar-based decoding**(`outlines`,我知道.`guidance`,我知道.`lm-format-enforcer`):从方案构建确定性有限自动机;在每一步,面具掉会违反FSM的代币逻辑.
2. **带 JSON parser 的 logit masking**:运行一个与模型同步的流媒体JSON解析器;在每个步骤计算有效-下一个代码集合──
3. **带 verifier 的 speculative decoding**价格:廉价草案模型 提议代币,验证器 强制执行方案.

商业供应商会在幕后选择其中一个.2026年最新水平是:短结构化输出速度比普通产量快,长结构化输出速度大致相同.

### 三种失败模式

1. **Parse error。**输出不有效 JSON. 在严格模式下不会发生. 在非严格的提供商上仍然可能发生.
2. **Schema violation。**输出可以解决,但违反了规则.
3. **Refusal。**模型拒绝.必须作为类型化结果处理.

### 重试策略

当你不在严格模式下时(人类工具使用、非严格的OpenAI、较旧的双胞胎),恢复模式是:

```
generate -> parse -> validate -> if fail, inject error and retry, max 3x
```

一次重试通常足够. 三次重试能捕捉弱模型偶发问题.

### 小模型支持

限制式解码适用于小模型――在结构化任务上,一个带语法执行的3B参数开放模型,表现优于使用原始提示的70B参数模型――这是结构化输出对生产环境的重要主要原因:它把可靠性和模型大小解──


```figure
constrained-decoding
```

## 使用它

`code/main.py`提供一个使用stdlib编写的最小JSON Schema 2020-12验证器 (图类,要求,数量,最大,模式,项目,附加属性)`Invoice`通过验证器,演示解析错误,方案违规和拒绝路径,

需要关注的点:

- 验证器 返回一个类型化的`[ValidationError]`列表包含路径和信息. 这正是你希望暴露给重试提示的形状.
- 拒绝 分支不会重试――它会记录日志并返回类型化拒绝――14期 · 09期 使用拒绝 作为安全信号――
- `additionalProperties: false`检查会在对抗性测试输入上触发,展示为什么严格模式会把幻觉字段在门外.

## 交付它

本课产出发 `outputs/skill-structured-output-designer.md`△给定一个自由文本提取目标 (如发票,支持票,简历等),该技能将产生一个与严格模式兼容的JSON方案2020-12,以及一个与之镜像的Pydantic模型,并内置类型拒绝和重新尝试处理 stub──

## 练习

1. 运行`code/main.py`△添加第四个测试用例,其`total_usd`为负数――确认验证人会通过`minimum`约束路径拒绝它.

2. 扩展验证器,使其支持歧视者`oneOf`常见情况:`line_item`无论是产品,还是服务,并由`kind`打标签──严格模式 在这里有一些细微规则;请查看OpenAI的结构化输出指南──

3. 把同一个发票方案写成Pydantic基模型,并将`model_json_schema()`输出与你手写的方案对比. 找出Pydantic默认设置但手写版本遗漏的一个字段.

4. 测量拒绝率 构造十个不应提取的输入 ((一段歌词"",一个数学证明"",一封空白邮件),并通过带严格模式的真实提供商运行它们――统计拒绝与幻觉输出――这是你进行拒绝意识的反复试验的基本真理――

5. 从头到尾阅读OpenAI的结构化输出指南. 找出它在严格模式中明确禁止,但普通JSON Schema允许一个构建. 然后设计一个不必要使用该禁用构建的方案,并将其重构为严格兼容.

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

- [OpenAI — Structured outputs](https://platform.openai.com/docs/guides/structured-outputs)严格的模式,拒绝和方案要求
- [OpenAI — Introducing structured outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) 2024 年 8 月发布文章,解释解码保证
- [Pydantic AI — Output](https://ai.pydantic.dev/output/) 会序列化到各供应商的输出_类型键
- [JSON Schema — 2020-12 release notes](https://json-schema.org/draft/2020-12/release-notes)法典规范
- [Microsoft — Structured outputs in Azure OpenAI](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/structured-outputs) 企业部署说明和严格模式注意事项
