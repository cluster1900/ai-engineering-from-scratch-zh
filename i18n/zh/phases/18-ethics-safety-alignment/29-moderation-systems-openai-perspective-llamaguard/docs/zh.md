# 内容审核系统 OpenAI,视角,拉马卫队

> 生产级调节系统将12-16课中定义安全政策操作化――OpenAI调节API:`omni-moderation-latest`(2024) 基于GPT-4o,可在一次调用中对文本+图像 分类;在多语言测试集上上比较上一版本提升42%;回应方案 返回 13 个类别的布鲁尔语 骚扰,骚扰/威胁,仇恨/威胁,非法,非法/暴力,自伤/意图,自伤/指示,性,性/未成年人,暴力/图形;对大多数开发者免费阅读; 层退休模式:输入中小化 (预生成) 输出中小化 (后生成) 定制 (后生成) 定制 (域规则) 作为互联网用户可隐藏延迟; 回复时代的回应由Liggy Guard (LLC) 提供者 (LLC) 提供者 (LLC) 提供者 (MDL) 提供的内容, 基于MDL) 提供的内容, 影响到其质量, 影响性, 毒性, 影响性, 影响性, 影响性, 影响性等等等.

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**前置要求：**第18阶段 · 16 (拉玛卫队/加拉克/Pyrit)
**Time:** ~60 minutes

## 学习目标
- 描述OpenAI Moderation API的类别分类,以及它与Llama Guard 3的MLCommons组有什么不同.
- 描述三个调度层模式 (输入,输出,定制),并指出每个层的一个失败模式.
- 描述前学期的基础位置,以及为什么它仍然被用于研究.
- 说明Azure的减值时间表.

## 问题
课时12-16 描述攻击与防御工具――课时29 覆盖已部署的调节系统,它们将在用户接触产品表面进行防御操作――三层模式是2026年默认配置――

## 概念
### 开放AI调度API

`omni-moderation-latest`基于GPT-4o──一次调用即可对文字 +图像 分类──对大多数开发者免费──

类别:
- 骚扰,骚扰/威胁
- 仇恨,仇恨/威胁
- 自我伤害,自我伤害/意图,自我伤害/指示
- 性,性/未成年人
- 暴力,暴力/图形
- 非法,非法/暴力

多型支持 适用于`violence`,我知道.`self-harm`和 `sexual`但不适用于`sexual/minors`其他内容仅为文本.

在`code/main.py`为了教导简洁,我们将`/threatening`,我知道.`/intent`,我知道.`/instructions`和 `/graphic`产代码应使用完整的13类方案――

在多语言测试集上比上一代的调度终点 提升42%──提供每类分数;应用自行设置门──

### 拉玛卫兵 3/4

已在16课时覆盖了14.14个MLCommons危险类别组织方式不同于OpenAI的13个响应方案布鲁尔语) 支持8种语言 (v3) ・Llama Guard 4 (2025年4月) 原生支持多元,12B。

开放AI和拉马卫队的类别有重叠但也有分歧.开放AI将被视为"非法"作为一个广泛的类别;拉马卫队将被视为"暴力犯罪"和"非暴力犯罪" 分开――部署时根据其政策类别适合选择――

### 视角API (谷歌saw)

早于2020年之前的士课程中调者 (浪潮) 毒性评分系统──类别:毒性,严重毒性,伤害,亵,威胁,身份攻击──单维度初级评分 (毒性),并带有子维度变异──

它被广泛使用为内容调节研究基线,因为该API 稳定、有文档,并且拥有多年校准数据.

### 三层格式

1. **Input moderation.**在生成前对用户提示 分类──如果标记,则拒绝──延迟:一次分类器调用──
2. **Output moderation.**在交付前对模型输出 分类──如果标记,则替换为拒绝──延迟:代 后一次分类器调用──
3. **Custom moderation.**域特定规则 (regex、allowlists、商业政策) 可在输入或输出阶段运行

这三层按设计是序列的:输入中调 必须在一代前完成,输出中调 在一代后运行.

### 失败模式

- **Input only.**捕捉不到输出幻觉 (课12-14编码攻击会绕过输入分类器)
- **Output only.**允许任何输入到达模型;增加成本;向攻击者 暴露内部推理――
- **Custom only.**无法稳健覆盖各类类别;

两重保险.

### 色减值

亚洲内容主管:2024 年 2 月过期,2027 年 2 月退休.由亚洲AI内容安全替代,后者基于LLM,并与亚洲OpenAI集成.

### 在这个阶段的第18阶段

在红队背景中覆盖调节工具――29课 覆盖部署调节――30课 以当前双重使用能力证据 收尾――


```figure
an-moderation-layers
```

## 使用它
`code/main.py`构建一个三层级调节器:输入调节器 (输入调节器) 关键字+类别分数) 输出调节器 (输出调节器) 针对输出使用相同的分类器) 定制调节器 (定制调节器) 域名规则 (域名规则) 你可以将输入 运过它,并观察哪一层捕捉到了什么.

## 交付它
本课产出发 `outputs/skill-moderation-stack.md`△给定一个部署,它会推调节堆配置:输入 使用哪个分类器,输出 使用哪个分类器,使用哪些定制规则,以及边缘案例 用什么判断──

## 练习
1. 运行`code/main.py`◎将良性,边界和有害输入 跑过全部三层――报告每种情况哪一层触发――

2. 扩展利用,加入针对特定类别的Perspective-API风格毒性评分――比较其门行为与类别评分――

3. 阅读OpenAI调控API文件 和Llama Guard 3类别列表――将每个OpenAI类别映射到最接近的Llama Guard类别――找出三个无法干净映射的类别――

4. 为编码助手部署 (例如GitHub Copilot) 设计调度堆,识别最相关和最不相关的类别,并提出定制规则.

5.  Azure 内容调节者将于2027年2月退休.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | 基于 GPT-4o 的 13-category (text) classifier，带部分 Multimodal support |
| Perspective API | "Google Jigsaw toxicity" | Pre-LLM-era toxicity scoring baseline |
| Llama Guard | "MLCommons 14-category" | Meta 的 hazard classifier（v3：8B text，8 langs；v4：12B Multimodal） |
| Input moderation | "pre-generation filter" | model call 前作用于 user prompt 的 classifier |
| Output moderation | "post-generation filter" | delivery 前作用于 model output 的 classifier |
| Custom moderation | "domain rules" | Deployment-specific rules（regex、allowlist、policy） |
| Layered moderation | "all three layers" | 标准生产部署模式 |

## 延伸阅读
- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations)全适度终点
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) 拉马卫队的回报
- [Google Jigsaw Perspective API](https://perspectiveapi.com/)毒性评分
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) Azure 替代
