# 集团聊天和扬声器选择

> 亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app下载_亚博体育app_亚博体育app_亚博体育app_亚博体育app_亚博体育app_亚博体育app_亚博体育app_app_亚博体育app_app_app_app_亚博体育app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app_app

**类型：**学习 + 构建
**语言：**字符串 (stdlib)
**前置条件：**16 · 04阶段 (原始模式)
**时间：**时间60分钟

## 问题

当工作流程已知时,静态图表 (长图) 好用――真实对话不是静态的:有时编码器会问评论家,有时会问研究人员,有时会问作家――硬编码每种可能的交付会产生边缘爆裂――你想要的是 *代理对共享池做出反应*,并由某个函数决定下一个谁说话――

这就是AutoGen集团聊天所做的.

## 概念

### 形状

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

每个代理都能看到每条消息. 每个轮都会调用一个选手来选择下一个发言人.

### 三种选择器 风格

**Round-robin。**固定循环――确定性――按N 线性扩展,但会忽略下文:即使话题是法律审查,编码也会获得轮次――

**LLM-selected。**调用一个LLM,它读取最近的池内容并返回最合适的下一个发言人――具有上下文感知能力,但速度慢:每轮都会增加一次LLM调用――AutoGen的默认方式――

**Custom。**一个Python 函数,包含你想要的任何逻辑――典型做法:LLM-选择加 fallback 规则(例如,代码器 之后总是把轮次交给验证器) 』

### 可交谈的代理API

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`持有选手――当一个代理 完成一轮后,经理会调用选手,选手返回下一个代理――循环持续到满足终止条件――

### 终止

三种常见模式:

- **Max rounds。**对于总轮次数设置硬上限.
- **"TERMINATE" token。**代理可以发出一个哨兵信息;管理员在出现时停止.
- **Goal-reached check。**一个轻量验证器每轮运行一次,然后聊天完成时停止.

### 机器人 → AG2 分裂,以及微软代理框架

2025年初,微软开始围绕事件驱动演员模型进行重大重写.社区将将AutoGen v0.2的GrouppChat语义叉为AG2,保留早期采用者已经集成的API.

2026年2月,微软宣布,AutoGen将进入维护模式,活动驱动演员模式 会合并到**Microsoft Agent Framework**对于兼容v0.2的代码,AG2是首选上游的.

### 什么时候适合集团聊天

- **Emergent conversations。**你不想预先连接每一个可能的下一个扬声器.
- **角色混合任务。**编码者问研究人员,研究人员问档案家,档案家再问回编码者――流程不是DAG――
- **探索式问题解决。**想象一下,风暴会,而不是流水线.

### 什么时候会失败

- **严格确定性。**选择者可能不一致. 同一个提示,不同运行,可能得到不同的.
- **Sycophancy cascades。**代理会服从发言最自信的人.
- **Context bloat。**每个代理都会读取每条信息;10轮后的背景会很大.
- **Hot speakers。**某个代理,因为选择者 偏好其专长而主导对话.

### 集团聊天与监督者

同样原始,不同默认值:

- 监督员:一个代理 规划,其他代理 执行.
- 集团聊天:所有代理都是同行;选择器是共享池的作用函数.

两者都使用04课中的四个原始语种.


```figure
swarm-speaker
```

## 构建它

`code/main.py`通过从零实现一个集团聊天. 包含三个代理人.`TERMINATE`标志的终止.

演示会打印两个变体的对话记录以及选择器的决定痕迹.

运行:

```
python3 code/main.py
```

## 使用它

`outputs/skill-groupchat-selector.md`会为给定任务配置集团聊天选项:轮对法师选择对定制,以及要使用哪些选项输入 (最近的消息,代理专业,转换数量)

## 发布它

检查列表:

- **Max rounds cap。**始终需要――典型任务为 10-20――
- **Speaker-balance metric。**随着每个代理的轮次数;当不平衡超过值时告警.
- **Termination token。** `TERMINATE`或专用验证代理.
- **Projection 或 scoped memory。**后,只考虑给每个代理一个范围的视图,以防止文本膨胀.
- **Selector logging。**对于LLM选定的变体,同时记录选手的输入和选择.

## 练习

1. 运行`code/main.py`比较与LLM选定的下面的对话
2. 在选择器中加入一条"每代理最高说话"规则.
3. 实现目标终止:当评论者 返回"批准"时停止――它在圆顶之前触发的频率是多少?
4. 阅读AutoGen稳定文件 中关于集团聊天的内容(https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager`使用默认选择器
5. 阅读 AG2 备用版https://github.com/ag2ai/ag2），并将其面向v0.4 增长了什么具体属性?

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | "Who talks next" | 选择下一个 agent 的函数。Round-robin、LLM-selected 或 custom。 |
| GroupChatManager | "The meeting host" | 拥有 selector 并循环处理轮次的 AutoGen component。 |
| ConversableAgent | "The base agent" | AutoGen base class；一个可以发送和接收 messages 的 agent。 |
| Termination token | "The 'stop' word" | 结束 chat 的 sentinel string（通常是 `TERMINATE`）。 |
| Hot speaker | "One agent dominates" | selector 不断选择同一个 agent 的 failure mode。 |
| Context bloat | "Pool grows unbounded" | 每个 agent 都读取所有先前 message；context 随轮次增长。 |
| Projection | "Scoped view" | 面向角色的共享池视图，用于防止 context bloat。 |

## 延伸阅读

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html)参考实施
- [AG2 repo](https://github.com/ag2ai/ag2) 社区延续的AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) 合并后的继任者,RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/)事件驱动演员模特 重写细节
