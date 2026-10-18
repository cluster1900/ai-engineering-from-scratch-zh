# 储备与训练服务差异

> 一个特征只有一个定义,但有两个读取方法. 训练读取每个标签时刻的历史价值,在线服务读取最新价值.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2，第 08 课（特征工程）、第 13 课（机器学习流水线）、第 15 课（时间序列）和第 19 课（机器学习系统设计）
**Time:** ~100 分钟

## 学习目标

- 解释离线存储"",在线存储"",实体"",事件时间和TTL的含义及各自的职责
- 实现时点正确的关联,并展示简单的关联如何将未来值复制到训练数据中
- 列出训练服务偏差的四个原因:两条代码路径,特征陈旧,默认值不同和时间穿越
- 构建特征注册表,让相同的定义同时用于训练路径和服务路径使用
- 在过去的日期中重新填写新特征,而不读取每日后的数据
- 对同一实体和时刻,比较服务日志中的特征与训练路径产生的特征,从而检测偏差

## 问题

一个团队构建了用户流失模型. 每个标签表示用户在标签日后30天内是否没有购买.`user_id`将标签与用户特征表关联,并基于`days_since_last_purchase`训练一条规则――离线准确率为0.948――

在真实流量上,这个模型却不像更旧的更简单的版本. 特性表保存了每个用户的最新值,其时间比标签日晚了几周. 一个用户最后一次购买发生在第115天,到第175天的快照中已经置了60天,因此特征本身就包含了答案. 与此同时,另一组在不同服务中重新编写了在线特征计算逻辑.

两个缺陷的原因相同:训练和在线服务用两种不同的方法计算同一个特征──本课程将从零构建特征存储的各个部分进行编写注册表,填补逻辑,关联时点,带TTL的在线存储,以及偏差检查.演示将使用具体数值重现这两种缺陷──

## 概念

### 两个读取相同的特征

训练和在线服务对特征的请求形式不同:

| 属性 | 训练（离线） | 服务（在线） |
|---|---|---|
| 问题 | “一千万个（实体，时间）组合各自对应的值是什么？” | “这个实体现在的值是什么？” |
| 时间 | 过去的多个时点 | 当前 |
| 数据量 | 每个任务数百万行 | 每次请求一行 |
| 延迟 | 可以接受数分钟 | 几毫秒 |
| 存储 | 离线存储：在列式文件或数据仓库中保存带时间戳的完整历史 | 在线存储：在键值数据库中保存每个实体的最新值 |

根据相同的特征定义,填充这两类存储――物化物化物化) 是将最新值从离线存储复制到在线存储的任务――

```mermaid
flowchart LR
    R[Raw events] --> D[Feature definitions<br/>in the registry]
    D --> O[Offline store<br/>history with timestamps]
    O --> J[Point-in-time join<br/>with labels]
    J --> T[Training set]
    O --> M[Materialize]
    M --> N[Online store<br/>latest value per entity]
    N --> S[Serving request]
    S --> L[Logged features]
    L --> K[Skew check]
    J --> K
```

### 实体时间与TL

每个特征都可以用四个术语来描述:

- **实体（Entity）。**描述对象的键的特征,例如`user_id`或`card_id`,我知道.
- **事件时间戳（Event timestamp）。**据报道,该事件的时间是14天.
- **创建时间戳（Created timestamp）。**系统写入该行时刻――今天执行的回填会写入事件时间早,创建时间为当前时间的行程――
- **TTL（time to live，生存时间）。**值允许达到最大年龄的值.超过TL的值被视为缺失,因此读者会使用默认值.

具有相同实体、数据源和TL的一组特征,通常称为特征视图(特征视图) 

### 时点正确的关联

一行训练数据应对标签与标签时已存在的特征值配对.

1. 找到同一实体的特征行程.
2. 只有保留事件时间不晚于标签时间的行程.
3. 取其中最新的一行.
4. 如果标签时间减去事件时间超过TLTL,就丢弃该行.

下面展示一个用户的标签,以及每周生成的特征行:

| 特征行日期 | `purchases_30d` | 时点关联 | 仅按 `user_id` 进行朴素关联 |
|---|---|---|---|
| 7 | 4 | | |
| 14 | 3 | 选中 | |
| 21 | 1 | 未来 | |
| 28 | 0 | 未来 | 选中 |

标签要判断用户在第17至第46天购买了任何商品. 标签日后没有购买的那些日子已经统计. 标签显示购买次数为0,因为用户停止购买,而这恰恰是标签测量事件.

时间序列一课按时间分类数据,也是因为同样的原因.

### 训练服务偏差的原因

谷歌的机器学习规则将训练服务偏差定义为训练期间与在线服务期间的性能差异,并列出三个原因:两条流水线处理数据的方式不同,训练和服务之间的数据发生变化,以及反回路.

| 原因 | 发生的情况 | 演示中的例子 |
|---|---|---|
| 两条代码路径 | 训练与服务使用不同代码计算特征 | 服务窗口包含 `now - 30` 这一天，训练窗口却不包含 |
| 特征陈旧 | 服务读取的值与训练所用值的年龄不同 | 训练读取每周快照，而新服务计算实时的新值 |
| 默认值不同 | 两条路径对缺失值的填充方式不同 | 对“尚未购买”，训练使用 365，服务使用 -1 |
| 时间穿越 | 训练读取了标签时刻之后的值 | 朴素关联为每个标签读取最新快照 |

同一指南的第32条规则要求尽可能在训练流水线和服务流水线之间复制代码.

### 标签名表

注册表是定义特征的目录.每个条目包含名称,实体,数据源,变换,窗口,默认值,TTL,负责人,版本和描述.

两条规则可以保证其安全性:

- 两条路径都从注册表读取定义.
- 修改定义时创建新版本──旧版本继续保留,让旧模型仍然可以使用训练时的特征──

### 填写

新特征没有历史,但训练需要它在每个历史标签时刻的值.

填充计算成本随着实体数量和日期数量的乘积增长而增加. 它也可能带来隐蔽漏洞:今天执行的填充虽然写在更早的事件时间,但可能读取迟到的数据或后修改的数据.

### 检测偏差

同一指南第29条规则要求记录服务时使用的特征,并将其用于训练.即使仅记录少量样本,也可以检查一致性.

为了定位原因,比较以下三组结果:

1. 在线存储读取结果与训练相关结果.
2. 实时重新计算的结果与训练相关的结果.
3. 第二条代码路径与实时重新计算的结果.

```figure
mlprod-pit-join
```

## 动手构建

`code/main.py`中代码只使用标准库.时间以整数天表示.每周批量处理任务在第7、14天等日期写入特征快照,直到第175天.

### 步骤1:特征定义与注册表

`FeatureDefinition`将变换表示为数据:聚合方式,窗口和默认值.`compute`方法绝不会读取`as_of`之后的事件.

```python
@dataclass(frozen=True)
class FeatureDefinition:
    name: str
    entity: str
    aggregate: str
    window_days: int | None
    default: float
    version: int = 1
    owner: str = "growth-team"
    description: str = ""

    def compute(self, events: list[Event], as_of: int) -> float:
        visible = [e for e in events if e.day <= as_of]
        if self.window_days is not None:
            visible = [e for e in visible if e.day > as_of - self.window_days]
        if self.aggregate == "count":
            return float(len(visible))
        if self.aggregate == "sum":
            return round(sum(e.amount for e in visible), 2)
        if self.aggregate == "days_since_last":
            return float(as_of - max(e.day for e in visible)) if visible else self.default
        raise ValueError(f"unknown aggregate {self.aggregate!r}")
```

`FeatureRegistry.register`允许重复注册相同的定义,但会拒绝名称和版本相同的内容却有不同的定义.`fill_defaults`为两条路径的缺失值提供相同的默认值.

模型通过`spend_30d@1`这样的引用是固定定义的.`compute`和 `fill_defaults`会解析引用,不含`@`名称会读取最新版本.`@`没有版本号的引用会触发`ValueError`因此拼写错误不会在没有警告的情况下读到最新版本.

### 步骤 2:回填离线存储

```python
def backfill(registry: FeatureRegistry, names: list[str], events: list[Event], days: list[int]) -> list[FeatureRow]:
    rows = []
    for entity, entity_events in sorted(group_events(events).items()):
        for day in days:
            rows.append(FeatureRow(entity, day, registry.compute(names, entity_events, day)))
    return rows
```

演示为299个用户在25个快照日回填满三个特征,共生成7475 行──

### 步骤 3:时点关联

按日期对每个实体的行排序一次.`bisect_right`找到标签日当天或之前的最后一行.

```python
def point_in_time_join(labels: list[LabelRow], rows: list[FeatureRow], ttl_days: int | None = None) -> list[JoinedRow]:
    by_entity: dict[str, list[FeatureRow]] = defaultdict(list)
    for row in rows:
        by_entity[row.entity].append(row)
    days_index = {}
    for entity, entity_rows in by_entity.items():
        entity_rows.sort(key=lambda r: r.day)
        days_index[entity] = [r.day for r in entity_rows]
    joined = []
    for label in labels:
        days = days_index.get(label.entity, [])
        pos = bisect.bisect_right(days, label.day) - 1
        match = by_entity[label.entity][pos] if pos >= 0 else None
        if match is not None and ttl_days is not None and label.day - match.day > ttl_days:
            match = None
        joined.append(JoinedRow(
            label.entity, label.day, label.label,
            match.day if match else None, match.values if match else None,
        ))
    return joined
```

### 步骤 4:测量造成的泄漏

`naive_latest_join`根据实体关联,因此,每标签返回最新行. 演示在第100、120和140天构建标签,并在每个训练集上拟合一条单特征规则.

```console
  naive join used a snapshot from after the label day for 100% of rows
  offline accuracy, naive join: 0.948 (rule: idle > 53 days)
  offline accuracy, PIT join:   0.893 (rule: idle > 19 days)
  accuracy on day 145, trained with naive join: 0.763
  accuracy on day 145, trained with PIT join:   0.876
```

简单关联的离线表现更好:0.948对0.893......但在新数据中更差:0.763对0.876......泄漏的特征将适合出发的置天数值从19天推至53天......

### 步骤5:在线存储与物物化

在线存储为每个实体保留一行,并拒绝超过TL的行.`materialize`只有写入日期不晚于任务时刻的行程.

```python
class OnlineStore:
    def __init__(self, ttl_days: int):
        self.ttl_days = ttl_days
        self._latest: dict[str, FeatureRow] = {}

    def write(self, row: FeatureRow) -> None:
        current = self._latest.get(row.entity)
        if current is None or row.day >= current.day:
            self._latest[row.entity] = row

    def read(self, entity: str, now: int) -> dict[str, float] | None:
        row = self._latest.get(entity)
        if row is None or row.day > now or now - row.day > self.ttl_days:
            return None
        return dict(row.values)
```

如果没有新的物化,第160天的读取将返回默认值,因为该行已经有20天的历史.

### 步骤 6:偏差检查

`detect_skew`比较两个`(entity, day)`关键的图片. 它报告每个特征的不匹配比例和平均绝对差异,当超过1%的值不同时标记该特征.`ValueError`△请求缺失可能掩盖偏差,而没有请求检查无法说明任何问题.

```python
def detect_skew(
    training: dict[tuple[str, int], dict[str, float]],
    serving: dict[tuple[str, int], dict[str, float]],
    features: list[str],
    tolerance: float = 1e-6,
    max_mismatch_rate: float = 0.01,
) -> list[SkewReport]:
    if set(training) != set(serving):
        raise ValueError(f"{len(set(training) ^ set(serving))} keys are in only one view: log and compare the same requests")
    if not training:
        raise ValueError("no requests to compare")
    keys = sorted(training)
    reports = []
    for feature in features:
        diffs = [abs(training[k][feature] - serving[k][feature]) for k in keys]
        mismatches = sum(1 for d in diffs if d > tolerance)
        rate = mismatches / len(keys)
        mean_diff = sum(diffs) / len(keys)
        reports.append(SkewReport(feature, len(keys), rate, mean_diff, rate > max_mismatch_rate))
    return reports
```

演示记录第141到第150天的请求,并运行概念部分介绍的三组比较――请求池中包含了20个没有历史记录的新用户――

```bash
python3 code/main.py
```

```console
=== Skew checks on 383 logged requests, days 141 to 150 ===
  online store read  vs  training join (one definition, same snapshots)
    ok   days_since_last_purchase   mismatch   0.0%  mean |diff|    0.00
    ok   purchases_30d              mismatch   0.0%  mean |diff|    0.00
    ok   spend_30d                  mismatch   0.0%  mean |diff|    0.00
  fresh compute      vs  training join (staleness only)
    SKEW days_since_last_purchase   mismatch  83.0%  mean |diff|    2.77
    SKEW purchases_30d              mismatch  30.5%  mean |diff|    0.38
    SKEW spend_30d                  mismatch  37.1%  mean |diff|   16.77
  second code path   vs  fresh compute (code differences only)
    SKEW days_since_last_purchase   mismatch   5.5%  mean |diff|   20.07
    SKEW purchases_30d              mismatch  12.5%  mean |diff|    0.13
    SKEW spend_30d                  mismatch  12.5%  mean |diff|    5.09
```

根据阅读这三个输出块:

- **同一定义、相同快照。**在线存储和训练关联读取相同的物化行程,因此偏差为零.
- **陈旧性。**在大多数请求中,实时计算值与每周快照不同.
- **代码差异。**第二条代码路径在12.5%的窗口数量上不同,因为它的窗口包含多个一天.`days_since_last_purchase`差异很大:-1对365.

## 使用现有工具

从零实现中,每个部分都能在节日中找到应对项目的:

| 从零实现 | Feast |
|---|---|
| `FeatureDefinition`、`FeatureRegistry` | 特征仓库中的 `Entity`、`FeatureView` 和 `Field`，通过 `feast apply` 注册 |
| `FeatureRow` 历史记录 | 离线存储，例如基于 Parquet 文件的 `FileSource` 或数据仓库表 |
| 带 TTL 的 `point_in_time_join` | `store.get_historical_features(entity_df=..., features=[...])` |
| `materialize` | `feast materialize-incremental <end time>` |
| `OnlineStore.read` | `store.get_online_features(features=[...], entity_rows=[...])` |
| 创建时间戳检查 | 数据源上的 `created_timestamp_column` 和 `filter_by_created_timestamp=True` |

定义如下──这些代码遵循节日快速入门指南,运行本课不需要它们──

```python
from datetime import timedelta

from feast import Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64

user = Entity(name="user", join_keys=["user_id"])

user_activity_source = FileSource(
    name="user_activity_source",
    path="data/user_activity.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created",
)

user_activity = FeatureView(
    name="user_activity",
    entities=[user],
    ttl=timedelta(days=10),
    schema=[
        Field(name="purchases_30d", dtype=Int64),
        Field(name="spend_30d", dtype=Float32),
        Field(name="days_since_last_purchase", dtype=Int64),
    ],
    source=user_activity_source,
)
```

随后,与线上服务学习同一个特征视图:

```python
from feast import FeatureStore

store = FeatureStore(repo_path=".")

training_df = store.get_historical_features(
    entity_df=labels_df,
    features=["user_activity:purchases_30d", "user_activity:days_since_last_purchase"],
    filter_by_created_timestamp=True,
).to_df()

online = store.get_online_features(
    features=["user_activity:purchases_30d", "user_activity:days_since_last_purchase"],
    entity_rows=[{"user_id": 42}],
).to_dict()
```

`labels_df`为了每个标签保存一行,包含`user_id`,我知道.`event_timestamp`标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签: 标签:`point_in_time_join`中的TL检查一致──同一页还介绍了`filter_by_created_timestamp=True`没有所有离线存储都支持此选项.

技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术技术

## 交付成果

本课产出发 `outputs/skill-feature-skew-audit.md`△ 技能审计 流水线中的时间穿越和训练 服务偏差,随后检查相关逻辑,定义,默认值,各路径的数据新鲜度以及偏差检查所需日志.

## 练习

1. 将快照间隔从7天改为1天.
2. 将TTL设为3天.统计有多少训练行业失去了特征.转而使用默认值.
3. 为`FeatureRow`添加创建日期──让关联忽略标签日后写入行──
4. 将`spend_7d`注册为`spend_30d`已从注册表中印出两版本.
5. 修复`legacy_serving_features`列出每项修改.

## 关键术语

| 术语 | 常见说法 | 实际含义 |
|------|----------------|----------------------|
| 特征存储 | “存特征的数据库” | 根据同一组定义计算特征，并同时提供给训练与在线服务的系统 |
| 离线存储 | “训练数据” | 带事件时间戳的完整特征历史，由训练任务和回填任务读取 |
| 在线存储 | “特征缓存” | 每个实体的最新值，供服务路径以毫秒级延迟读取 |
| 实体 | “ID” | 特征所描述对象的键，例如用户或银行卡 |
| 事件时间戳 | “何时发生” | 特征值成立的时刻 |
| 时点关联 | “截至某时刻的关联” | 为每个标签匹配标签时刻当天或之前的最新特征行 |
| TTL | “有效期” | 特征值在被读取方视为缺失之前允许达到的最大年龄 |
| 物化 | “同步到线上” | 将最新特征值从离线存储复制到在线存储的任务 |
| 回填 | “计算历史” | 在过去的日期执行特征定义，以生成其历史记录 |
| 训练—服务偏差 | “离线时明明有效” | 训练与在线服务中的特征或行为差异 |

## 延伸阅读

- [Feast：时点关联](https://docs.feast.dev/getting-started/concepts/point-in-time-joins)创建时间 过
- [Feast 文档](https://docs.feast.dev/)网络存储和物化
- [Google：《机器学习规则》](https://developers.google.com/machine-learning/guides/rules-of-ml)训练服务偏差规则
- [Breck 等：《机器学习的数据验证》（SysML 2019）](https://research.google/pubs/data-validation-for-machine-learning/)谷歌的数据验证,包括训练服务差异
- [TensorFlow Data Validation 指南](https://www.tensorflow.org/tfx/guide/tfdv)模式检查,偏差检查和漂移检查
- [Sculley 等：《机器学习系统中隐藏的技术债》（NeurIPS 2015）](https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html)模型周边的数据依赖流水线技术债务
