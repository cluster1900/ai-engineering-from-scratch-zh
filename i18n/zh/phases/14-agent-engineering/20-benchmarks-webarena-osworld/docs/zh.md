# 基准测试:WebArena和OSWorld

> 在发布时间内,WebArena 在四个自主管理应用程序上测试网络代理能力.OSWorld在Ubuntu、Windows、macOS上测试桌面代理能力.

**类型：**学习 课程
**语言：**字符串 (stdlib)
**先修要求：**阶段14·19 (SWE-bench,GAIA)
**时间：**约60分钟

## 学习目标

- 描述WebArena的四个自主管理应用程序,以及为什么基于执行的评估很重要.
- 解释为什么OSWorld使用真实OS截图而不是可访问性API.
- 描述了两个主要的OSWorld故障模式:GUI接地和操作知识.
- 总结 OS世界G 和 OS世界人 在基础上基准 之上增加了什么.

## 问题

它们能否在浏览器中完成20次点击,从而完成一次购物检查?它们能否仅使用键盘和鼠标配置一个Linux机器?

## 概念

### 网络场 (周等人,ICLR 2024)

- 覆盖四个自主管理的网络应用程序的812个长程任务:购物网站,论坛,类型的GitLab开发工具,商业CMS.
- 其他实用工具:图片,计算器,抓板.
- 评估通过健身房API 基于执行完成:订单是否下单,问题是否已关闭,CMS页面是否更新?
- 发布时:最佳GPT-4代理 达到14.41%的成功率,而人类为78.24%.

自托管设置很重要,因为目标应用程序是固定的,可复制的,所以基准不会因为外部变化而不稳定.

### 扩展

- **VisualWebArena** 视觉接地任务,成功取决于解读图像
- **TheAgentCompany**加入终端+编码;更像真实的远程工作环境──

### 其他技术:

- 覆盖Ubuntu、Windows、macOS的369个真实计算机任务.
- 对于真实应用进行自由形式的键盘和鼠标控制.
- 以 1920×1080 截图作为观察.
- 发布时:最佳模型为12.24%,人类为72.36%.

### 主要故障模式

1. **GUI grounding。**像素 → 元素 映射──模型 很难定位 1920×1080 中可靠 UI 元素──
2. **Operational knowledge。**哪个菜单有这个设置,哪个键盘快捷键,哪个偏好窗口.

### 后续工作

- **OSWorld-G** 564 个样本的地面积套件+Jedi训练套件――将地面积与规划拆解开来,因此可以分别测量――
- **OSWorld-Human** 人工整理的黄金行动轨迹──显示顶级代理 使用的步骤比必要步骤多 1.4-2.7x(轨迹-效率差距)──

### 为什么这很重要?

克劳德计算机使用、OpenAI CUA、Gemini 2.5 计算机使用(21课) 都由WebArena 和 OSWorld塑造的工作负载上训练――基准是目标;生产模型是交付出来的答案――

### 容易出错的地方

- **仅截图 evals。** OSWorld由截图驱动;如果在 OSWorld 上评估使用DOM或可访问性API的代理,就会错过地面挑战.
- **忽略 trajectory length。**根据成功率,会错过OS世界-人类暴露的1.4-2.7x 步骤低效.
- **陈旧的自托管 apps。**网络的应用程序已确定了特定版本;如果未经重新整理更新版本,将破坏可比性.


```figure
ae-agent-human-gap
```

## 构建它

`code/main.py`实现一个玩具网代理套件:

- 一个最小的购物应用程序状态机:列表_项目,添加_卡车,查询.
- 任务的黄金轨迹.
- 一个尝试每个任务的剧本代理.
- 基于执行的评估器 (状态检查) 和轨迹效率指标 (步骤与黄金).

运行它:

```
python3 code/main.py
```

输出:每个任务的成功率和轨迹效率,对应OSWorld-Human的方法论

## 使用它

- **WebArena Verified**自托管在内部集群上,用于持续评估.
- **OSWorld**运行在VM舰队中,用于桌面代理.
- **Computer-use agents**克劳德•开AI CUA•双子女 都在类似的工作负载上训练
- **你自己的产品流程** 为最重要的20个任务捕获黄金轨迹;每周使用它们测试剂.

## 交付它

`outputs/skill-web-desktop-harness.md`构建一个基于执行的评估和轨迹效率指标的网络/桌面代理杆.

## 练习

1. 用第二个应用程序 (论坛) 扩展玩具带.编写3个任务和金轨迹.
2. 在你的玩具中,代理是金的1x,2x还是3x?
3. 实现一个扰器工具,即黄金轨迹 从不使用的工具――书面代理会被诱导吗?
4. 阅读OSWorld-G. 你如何在自己的评估中区分地缘失败与计划失败?
5. 阅读WebArena的应用阅读我. 当你升级某个固定应用程序版本时,会破坏什么?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| WebArena | "Web agent benchmark" | 覆盖 4 个自托管 apps 的 812 个任务；gym-style evaluation |
| VisualWebArena | "Visual WebArena" | 视觉 grounding 的 WebArena；截图是 observations |
| OSWorld | "Desktop agent benchmark" | 在真实 Ubuntu/Windows/macOS 上的 369 个任务 |
| GUI grounding | "Pixel-to-element mapping" | Model 在 1920x1080 中定位 UI 元素 |
| Operational knowledge | "OS know-how" | 哪个菜单、哪个 shortcut、哪个 preference pane |
| OSWorld-G | "Grounding suite" | 564 个仅 grounding 样本 + training set |
| OSWorld-Human | "Gold trajectories" | 用于衡量效率的人工专家动作序列 |
| Trajectory efficiency | "Steps over gold" | Agent 步数除以人类最小步数 |

## 延伸阅读

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) 四应用程序网络基准
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) 跨OS桌面基准
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) 克劳德 由基准 塑造能力
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) OSWorld 和 WebArena 数字
