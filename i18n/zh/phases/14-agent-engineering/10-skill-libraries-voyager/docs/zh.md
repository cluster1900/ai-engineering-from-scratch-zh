# 技能库与终身学习 (旅行者)

> 航母 (Wang et al.,TMLR 2024) 将可执行代码视为一种技能. 技能具有命名,可检查,可组合的特性,并通过环境反持续改进.

**类型：**建立
**语言：**字符串 (stdlib)
**先修：**阶段14 · 07 (MemGPT),阶段14 · 08 (Letta Blocks)
**时间：**七十五分钟

## 学习目标

- 描述旅行者三个组件:自动课程,技能图书馆,反复提示,并说明各自的作用.
- 解释为什么旅行者将动作空间设计为代码而不是原始命令.
- 使用stdlib 实现一个支持注册,检查,组合和由失败驱动改进的技能库
- 将"旅行者"的模式映射到2026年.

## 问题

每次会议都从零重建所有能力的代理,会犯三类错误:

1. **浪费 Token。**每个任务都会重新提出相同的推理.
2. **丢失进展。**修改不会转移到B课程.
3. **无法处理长程组合。**复杂任务需要能力级别;一次性快速 无法表达它们.

旅行者答案是:将每一个可复用能力视为库存中的命名代码块,可通过相似性检查,可与其他技能组合相结合,并通过执行反不断改进.

## 概念

### 三个组件

周围以下内容组织代理:

1. **Automatic curriculum。**根据现任的技能集和环境状态选择下一个任务――探索自底向上――
2. **Skill library。**每个技能都可执行代码.任务成功后将添加新的技能.
3. **Iterative prompting mechanism。**失败时,代理会接收执行错误,环境反和自验证输出,然后改进这个技能.

根据Minecraft的数据,Minecraft的价格是3.3倍,而这些数字是Minecraft的特定,但模式可以迁移.

### 动作空间 = 代码

大多数代理输出原始命令――旅行者输出 JavaScript 函数――一个技能是:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

由子 技能组合而成──如描述 和 嵌入 作为关键存储──作为程序被检查,而不是作为提示──

这就是2026年克劳德代理SDK技能:一段具名,可检索的代码,再加上代理按需加载说明.

### 技能检索

新任务是制造钻石斧.

1. 执行任务描述的嵌入式.
2. 查询技能库,获取顶级的相似技能.
3. 检索`craftIronPickaxe`,我知道.`mineDiamond`,我知道.`placeCraftingTable`其他
4. 用检索到的原语 + 新逻辑组合新技能──

这就是MCP资源 (Phase 13) 和代理SDK技能实现的模式:在知识/代码表面上进行检查,并限于当前任务范围.

### 代改进

旅行者的反循环:

1. 代理编写一个技能.
2. 技能在环境中运行.
3. 返回三种信号之一:`success`,我知道.`error`没有什么可做.`self-verification failure`,我知道.
4. 作为上下文重写技能.
5. 循环直到成功或达到最大轮数.

这是自修的 (自修的) 课05应用于代码生成,并用环境落地验证.

### 课程与探索

根据代理已经拥有什么,还没有做什么,提出类似于在湖边建造一个避难所的任务――建议者使用环境状态 +技能库存 来选择略高于当前能力的任务,也就是探索最佳区间――

对于生产代理来说,这将转化为一个什么缺失运营商:给定当前技能库和一个领域,我们还没有覆盖哪些技能?

### 这种模式很容易出错的地方

- **Skill library rot。**同一个技能被用了不同的描述 添加10次.
- **Composed-skill drift。**父技能依赖于一个后来改进的子技能──给技能做版本化;固定到v1的父技能不会自动到v3──
- **Retrieval quality。**随着技能库增长到几百个以上,基于技能描述的矢量检索 会退化――使用标签过器 和硬约束补充只有技能`category=tooling`) 


```figure
voyager-skills
```

## 构建它

`code/main.py`实现一个工作技能库:

- `Skill`名称,描述,代码,版本,标签,依赖性.
- `SkillLibrary`注册,搜索,代码重叠,组合,依赖,拓排序,完善,更新时版本弹)
- 一个编辑代理:注册三个原始技能,组合第四个,遇到一次失败,然后改进.

运行:

```
python3 code/main.py
```

后续会展示库写入,检查,组合,一次失败执行,以及 v2 改进,也就是旅行者循环的端到端过程.

## 使用它

- **Claude Agent SDK skills**参考:每个技能都有描述、代码和说明; 在代理会议中按需加载。
- **skillkit**面向32+ AI编码代理的跨代理技能管理
- **Custom skill libraries** 特定领域 (例如数据代理的SQL技能,信息代理的地形技能)  旅行模式可以缩小应用.
- **OpenAI Agents SDK `tools`** 低配版本; 每个工具都是轻量技能.

## 交付它

`outputs/skill-skill-library.md`为了实现任何目标的运行时间,

## 练习

1. 给我一个`compose()`添加依赖环检测器. 当技能 A 依赖 B,而B 依赖 A 时会发生什么?错误还是警告?
2. 实现每个技能的版本固定──当父技能组合子技能`crafting@1`时,对`crafting@2`改进不能静默升级父技能.
3. 将代币重叠检索 替换为句子变换器嵌入式(或BM25 stdlib 实现) ⋅在一个50技能玩具库上测量检索@5。
4. 添加一个课程经理:给定当前库和一个域名描述,提出5个缺失技能.
5. 阅读人类的克劳德代理 SDK技能文件.将玩具图书馆移植到 SDK的技能方案.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Skill | “可复用能力” | 带有 description 的命名代码块，可通过相似度检索 |
| Skill library | “agent 的 how-to 记忆” | Skill 的持久化存储，可搜索、可组合 |
| Curriculum | “任务 proposer” | 由当前能力缺口驱动的自底向上目标生成器 |
| Composition | “Skill DAG” | Skill 调用 Skill；执行时进行拓扑排序 |
| Iterative refinement | “自我修正循环” | Env 反馈 + 错误 + 自验证，会折回到下一个版本中 |
| Action-space-as-code | “程序化动作” | 输出函数，而不是原始命令，用于时间跨度更长的行为 |
| Dedup on write | “Skill collapse” | 近重复 description 会合并为一个 canonical Skill |

## 延伸阅读

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) 原始 技能图书馆论文
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)技能的2026年产品化形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 实践中的技能与子科
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) 旅行者底层的改进循环
