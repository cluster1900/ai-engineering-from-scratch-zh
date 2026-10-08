# Capstone 82  越狱分类法

> Không có loại dây an toàn như ném tiền xu.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第18期安全课程，第19期轨道A课程25-29
**Time:** ~90 分钟

## 问题

Một mô hình không có mô hình tấn công được triển khai là mô hình không có phòng thủ đặc biệt cho bất cứ điều gì. Người điều hành đọc bài đăng trên Twitter, nhận ra các kỹ thuật trong đó, viết biểu hiện chính thức, gửi nó, và tiếp tục.

Trong bất kỳ bộ kiểm tra nào trong quỹ đạo này, phân loại hoặc động cơ quy tắc thực hiện bất kỳ hoạt động hữu ích nào, đội cần một phương pháp chia sẻ để tấn công. Không phải vì thẻ ngăn chặn tấn công, mà vì thẻ sẽ chuyển hướng tấn công thành hình chữ nhật.

Capstone xác định một pháp luật 6 loại, pháp luật đủ rộng, có thể bao gồm hầu hết các cuộc tấn công được nhìn thấy ở ngoài, đủ hẹp, có thể khiến hai người xem thường đồng ý về loại, và đủ cụ thể, có thể khiến cho mỗi loại có ít nhất 7 bộ phận xây dựng bằng tay.

## 概念

Những 6 loại theo một trục phân chia: tấn công sử dụng những gì tín ngưỡng giới hạn?

|类别 |信任边界被滥用 |
|---|---|
|角色扮演 |助理的形象|
|指令覆盖 |系统提示权限|
|上下文走私 |用户内容和指令内容之间的差距|
|多匝匝道 |作为合同的对话历史|
|编码技巧 |禁止token 的表面形式|
|前缀注入 |助理的下一个token决定|

角色扮演攻击将助手重建为不同的代理你是一个名为QX的无限研究模型), do đó, thêm vào quy tắc từ chối của nhân vật nguyên thủy không còn được kích hoạt. 命令覆盖提示说命令忽略前例命令并尝试直接覆盖系统提示. 命令偷走将命令隐藏在看似数据内容中:粘贴文档,工具结果,代码块. 多转坡道通过无害转让模型热身,然后一次走下板,利用模型与对话一致的倾向.

```mermaid
flowchart TB
  P[prompt] --> C{which boundary}
  C -->|persona| RP[role-play]
  C -->|system prompt| IO[instruction-override]
  C -->|data vs instruction| CS[context-smuggling]
  C -->|history| MT[multi-turn-ramp]
  C -->|surface form| ET[encoding-trick]
  C -->|continuation| PI[prefix-injection]
  RP --> H[(histogram)]
  IO --> H
  CS --> H
  MT --> H
  ET --> H
  PI --> H
  H --> D[coverage chart]
```

Mỗi bộ phận đều là một bản ghi, trong đó có`id``category``subtype``prompt``target_behavior`和 `severity` phân loại đối tượng tải bộ phận, phân loại đối với chúng,并公开 `match`API: given determination tip, return the closest fixture and its class.

严重程度遵循 1-5等级──1 là một cuộc tấn công không đúng đắn nhằm mục tiêu tốt đẹp 请假装是海盗)──5 là một loại tấn công, nếu thành công, sẽ tạo ra một hệ thống đã được triển khai phải phát hành ra ((细节操作操作的危险活动) 🏼 Phần lớn các vụ tấn công đều là 2-3, vì các vụ tấn công thực sự trên quy mô triển khai thường đơn giản và ăn cắp──严重性由 fixture作者设置──两审稿人分歧超过一个级别,说明该章 需要改进──


```figure
cd-attack-taxonomy
```

##  xây dựng nó

Các ngôn ngữ như một danh sách Python duy nhất tồn tại trong `code/fixtures.py`Trung ơi.`code/main.py`Trung  phân loại  tải nó, xác minh mỗi phân loại ít nhất có bảy vật cố định, công khai `by_category``match`和 `stats`方法,并提供印直方图的可运行演示──三元余弦是使用 `numpy`Từ đầu bắt đầu thực hiện.

Quá trình kiểm tra không biến: mỗi vật cố định có một gợi ý không trống, cho thấy mỗi loại trong mô hình, mỗi mức độ nghiêm trọng đều trong`1..5`Trong đó, và mỗi ID cố định đều duy nhất. Sự thất bại ở đây là cứng rắn, chứ không phải là cảnh báo, vì phần còn lại của quỹ đạo phụ thuộc vào sự phù hợp bên trong của bộ nhớ ngôn ngữ.

## Sử dụng nó

Từ khóa học`code/`目录运行 `python3 main.py`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊                                                                                                                                                                                          `match`运行三个例探测,并将 `taxonomy.json`写入课程输出文件──下游课程读取 `taxonomy.json`Thay vì nhập vào Python 模块, do đó, bộ nhớ ngôn ngữ là một tạo vật ổn định.

## 发货

`outputs/skill-jailbreak-taxonomy.md`记录了六类和标题――将其视为团队的共享词汇――第 87 课中的线束记录的每一个发现都引用了一个分类ID――

## 练习

1. 添加第七类间接提示注入( chỉ thị được nhúng vào tài liệu đã được kiểm tra, thay vì người dùng lần lượt trong)  tạo 10 phần mềm và tái chạy bộ chứng thực器。
2. Sử dụng token-edit-distance 评分器 thay thế trigram cosine,并测量 hiện có các thay đổi phân phối phù hợp trên các tài liệu ngôn ngữ.
3. Từ Nhật Bản sản phẩm của riêng bạn (已编辑) 中提取 30 个附加附件,并确认类别分布符合团队的直观预期──

## 关键术语

|术语 |常见用法 |准确含义|
|---|---|---|
|越狱|任何不安全的模型输出 |产生违反既定策略的输出的提示 |
|分类 |类别列表 |攻击者滥用信任边界的攻击分区
|fixture |一个测试示例 |带有类别、严重性和目标行为的 token 提示 |
|严重程度 |输出有多糟糕 |如果攻击成功，影响排名为 1-5 |
|match |检测决定| trigram cosine 的最近 fixture，用于将类别分配给新提示 |

## 进一步阅读

Chương 83-87 được xây dựng trực tiếp trên cơ sở của các tài liệu.
