# 基准测试:WebArena và OSWorld

> WebArena trên bốn ứng dụng tự quản trên thử nghiệm web-agent 能力──OSWorld trên Ubuntu、Windows、macOS trên thử nghiệm máy tính để bàn-agent 能力──在发布时间(20232024), cả hai đều cho thấy sự khác biệt lớn giữa một đại lý hàng đầu và con người── khoảng cách đang giảm đi; các chế độ thất bại không thay đổi──

**类型：**Học tập
**语言：**Python (stdlib)
**先修要求：**Giai đoạn 14 · 19 (SWE-bench, GAIA)
**时间：**约60分钟

## Học mục tiêu

- Mô tả bốn ứng dụng tự quản lý của WebArena, và lý do tại sao đánh giá dựa trên thực hiện là rất quan trọng.
- 解释 tại sao OSWorld sử dụng thực tế OS 截图, thay vì API truy cập.
- Nói về hai chế độ thất bại OSWorld chính: GUI grounding và kiến thức hoạt động.
- 总结 OSWorld-G 和 OSWorld-Human 在基础基准 之上增加了什么──

## 问题

Các đại lý thông qua có thể điều chỉnh các công cụ. Chúng có thể hoàn thành 20 lần nhấp chuột trong trình duyệt, để hoàn thành một lần thanh toán mua hàng? Chúng có thể chỉ sử dụng bàn phím và chuột để điều chỉnh một máy Linux?

## 概念

### WebArena (Zhou et al., ICLR 2024)

- 覆盖四个自主管理网页应用程序的812个长程任务:购物网站,论坛,类 GitLab的开发工具,商业 CMS,
-  có một công cụ thực tế khác:map, máy tính, scratchpad.
-  đánh giá thông qua gym API  dựa trên thực hiện hoàn thành: Order có đã được download, issue có đã được đóng, CMS  page có được cập nhật không?
- 发布时: đại lý GPT-4 tốt nhất đạt tỷ lệ thành công 14,41%, trong khi con người đạt 78,24%。

Định vị tự quản là rất quan trọng, vì ứng dụng mục tiêu được cố định và có thể thực hiện, vì vậy điểm chuẩn sẽ không ổn định do sự thay đổi bên ngoài.

### 扩展

- **VisualWebArena** 视觉 grounding 任务, thành công phụ thuộc vào giải读图像(截图作为一等观察)
- **TheAgentCompany**(Dec 2024)  加入终端 + mã hóa;更像真实的远程工作环境。

### OSWorld (Xie et al., NeurIPS 2024)

- 覆盖 Ubuntu、Windows、macOS 369 个真实计算机任务──
- Để thực dụng thực tế thực hiện hình thức tự do của bàn phím và kiểm soát chuột.
- 以 1920×1080 截图作为观察.
- 发布时: mô hình tốt nhất là 12,24%, người là 72,36%.

### Các chế độ thất bại chính

1. **GUI grounding。**Pixel → element 映射──Model 很难在 1920×1080 中可靠定位 UI 元素──
2. **Operational knowledge。**哪个菜单里有该设置,哪个键盘快捷键,哪个偏好框──这是人类多年积累出来的知识长尾──

### 后续工作

- **OSWorld-G**564 mẫu bộ ghép đất + bộ huấn luyện Jedi.
- **OSWorld-Human** 人工整理的黄金行动轨迹──显示顶级代理 使用的步骤比必要步骤多 1.4-2.7x(轨迹- hiệu quả khoảng cách)──

### Tại sao điều này quan trọng

Claude sử dụng máy tính, OpenAI CUA, Gemini 2.5 Sử dụng máy tính, Bài học 21) đều đang được xây dựng bởi WebArena và OSWorld.

### Định nghĩa điểm 容易出错的地方

- **仅截图 evals。**OSWorld được điều khiển bởi các thiết bị phân tích; nếu trên OSWorld để đánh giá sử dụng DOM hoặc API truy cập của đại lý, bạn sẽ bỏ qua các thách thức đặt đất.
- **忽略 trajectory length。**Chỉ theo tỷ lệ thành công, sẽ bỏ lỡ OSWorld-Human 曝光 1.4-2.7x 步骤低效.
- **陈旧的自托管 apps。**Các ứng dụng của WebArena đã cố định phiên bản cụ thể; nếu không được sắp xếp lại về phiên bản mới, sẽ phá hủy tính khả thi.


```figure
ae-agent-human-gap
```

##  xây dựng nó

`code/main.py`实现 một đồ chơi web-agent vòng xoáy:

- Một ứng dụng mua sắm nhỏ nhất: list_items, add_to_cart, checkout,
- 3 nhiệm vụ của quỹ đạo vàng.
- Một cố gắng cho mỗi nhiệm vụ của một nhân viên kịch bản.
- 基于执行的评估器 () 状态检查 () 和轨迹-效率指标 () 步骤对黄金 () ) 

运行 nó:

```
python3 code/main.py
```

输出: tỷ lệ thành công và hiệu quả quỹ đạo của mỗi nhiệm vụ, đối phó với phương pháp của OSWorld-Human:

## Sử dụng nó

- **WebArena Verified**tự quản lý trong cluster bên trong, được sử dụng để đánh giá liên tục.
- **OSWorld**运行在 VM舰队中, được sử dụng cho các đại lý máy tính để bàn.
- **Computer-use agents**(Dạy 21)  Claude、OpenAI CUA、Gemini  都在类似类的工作负载上训
- **你自己的产品流程** Đối với 20 nhiệm vụ quan trọng nhất là bắt giữ quỹ đạo vàng; mỗi tuần sử dụng các đại lý kiểm tra chúng.

## 交付 nó

`outputs/skill-web-desktop-harness.md`Xây dựng một hệ thống web/desktop, bao gồm dựa trên các đánh giá và phương pháp đo hiệu quả quỹ đạo thực hiện.

## 练习

1. 用第二个app (论坛) mở rộng vòng chơi.
2. Thêm theo báo cáo nhiệm vụ, hiệu quả quỹ đạo. Trong đồ chơi của bạn, đại lý là vàng 1x 2x hay 3x?
3. Thực hiện một công cụ gây phân tâm, tức là quỹ đạo vàng Từ không sử dụng công cụ.
4. 阅读 OSWorld-G. Bạn sẽ phân biệt giữa thất bại trong việc lập kế hoạch và thất bại trong việc đánh giá của mình như thế nào?
5. 阅读 WebArena's apps README── Khi bạn nâng cấp một ứng dụng cố định  phiên bản, sẽ phá hủy gì?

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

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) 四 app web benchmark
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) 跨 OS benchmark desktop
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) Claude bởi điểm chuẩn 塑造的能力
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) OSWorld và WebArena 数字
