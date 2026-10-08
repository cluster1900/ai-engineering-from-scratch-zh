# Kỹ năng đánh giá, 打包与可移植性

> Chỉ khi một kỹ năng 组件包经受静态检查, 精准路由在正确请求, thực sự nâng cao số lượng nhiệm vụ thực hiện, nghiêm ngặt tuân thủ các giới hạn chiến lược, và thực sự hạ cấp trên các chủ nhà khác, nó mới thực sự hoàn thành.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22, 24, 25, and 26
**Time:** ~150 minutes

## Học mục tiêu

- Bằng cách phân chia các chủ quan phán đoán, xác định tính toán, tài liệu tham khảo và giao ước xuất khẩu, sẽ chuyển đổi dòng công việc chuyên gia thành một kỹ năng quy định.
- Để bao gồm cấu trúc, kích hoạt đường dẫn, thực hiện nhiệm vụ, tính chính xác, an toàn và khả năng di chuyển như các phân cấp riêng biệt để thử nghiệm.
- Sử dụng đúng hướng sử dụng, xác định tiêu cực hướng sử dụng và gần vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi vi
- Trong nhiều lần lặp lại, đối với việc thực hiện nhiệm vụ giới thiệu kỹ năng với không giới thiệu kỹ năng (基线).
- 构建并强制执行跨运行时能力矩阵 (capacity matrix) cũng như hướng tới toàn bộ kỹ năng 组件包的发布卡点 (发布卡点)

## 问题

Một kỹ năng trong một buổi trình diễn được thể hiện hoàn hảo. Khi người dùng nhập vào nhanh chóng, đúng là phù hợp hoàn toàn với các từ ngữ trong mô tả, người viết tâm trí của họ biết phải mở tham chiếu nào, văn bản nhận được toàn bộ nhập vào, chủ nhà dự kiến cũng có thể nhận ra hoàn toàn từng đoạn tự định.

Sau đó, thực tế ứng dụng trường hợp bắt đầu:

- Mô hình đã sử dụng nó sai trong các nhiệm vụ gần nhau nhưng khác nhau.
- Việc yêu cầu hợp pháp của người dùng thay đổi một câu nói bất thường, dẫn đến mô hình trực tiếp bỏ qua nó.
- Tôi chỉ định cho đại lý phải làm gì, nhưng không xác định rõ ràng sản phẩm nào mới được chứng minh nhiệm vụ được hoàn thành.
- 脚本在遇到空格、重复执行或部分中间状态发生崩──
- 组件包装程序 chỉ được sao chép `SKILL.md`, nhưng để lại các tham chiếu phụ thuộc của nó đã rơi vào đất nguyên thủy.
-  Một hoạt động khác trực tiếp không xem xét việc điều chỉnh các biểu tượng và công cụ để đặt ra.
- Một lần chạy thành công, sau đó ba lần chạy cùng một cách nhưng đi du lịch đến các phân đoạn khác nhau.

Hơn nữa, bất kỳ một sự cố nào không thể vượt qua được. Đánh giá này trông rất đẹp ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư ư

## 概念

### Từ thực sự làm việc, chứ không phải từ các chuyên đề trừu tượng

 Tạo ra một kỹ năng Kubernetes không phải là một phạm vi có thể vận hành.

 Chẩn đoán một sự triển khai vì sao không đạt được trạng thái  Có sẵn, thu thập bằng chứng trong khuôn khổ tập hợp không thay đổi, và tạo ra một báo cáo phân cấp về tình trạng cố tình  chỉ là một kỹ năng ứng cử viên đủ điều kiện.

- 明确的触发边界;
- 稳定的证据收集步骤序列;
- 需要主观判断的决策点;
- Có thể được đóng gói cho lệnh của một văn bản hoặc công cụ nhỏ;
- 明确定义的工件产物 (nước vật);
- Ơn an toàn: chỉ đọc chẩn đoán.

使用以下提炼访谈清单(trước phỏng vấn):

1. Thực tế là những sự kiện cụ thể nào đã thúc đẩy các chuyên gia bắt đầu dòng công việc này?
2. Những yêu cầu tương tự nào không nên khởi động nó?
3. Chuyên gia đầu tiên thu thập bằng chứng gì?
4. Quyết định nào phụ thuộc vào chứng cứ này?
5. Những bước nào có đủ sự chắc chắn để viết kịch bản?
6. Những quy tắc trong lĩnh vực nào nên được xem xét để tài liệu tham khảo?
7. Những hoạt động nào cần được phê duyệt, hoặc phải được loại trừ khỏi phạm vi?
8. 什么样的工件产物能证明工作流已完成?
9. Các nhà kiểm tra độc lập làm thế nào để kiểm tra nó?
10. Những bước nào phụ thuộc vào thời gian vận hành cụ thể?

Những câu trả lời này tạo thành cấu trúc và đánh giá tập hợp.

### Xét định chủ quan và tính xác định

```figure
skill-workflow-extraction
```

Sử dụng khả năng phán đoán mô hình để tiến hành phân loại, sắp xếp ưu tiên, tổng hợp và loại bỏ sự phân biệt. Sử dụng kịch bản hoặc công cụ để tiến hành phân tích văn bản, tính toán, xác nhận, chuyển đổi dữ liệu, truy vấn API phân loại và kiểm tra không biến.

Trong kỹ năng, viết 80 行 trong văn bản tự nhiên để làm cho mô hình làm việc và phân tích mô hình rất yếu đuối.

### 按照依序构建组件包

Đừng từ 色文字开始──应从可观测的契约由内向外构建:

1. **工件契约 (Artifact contract)：**定义 các tài liệu cần thiết 字段或决策项──
2. **验证规则 (Verification)：**定义 từng yêu cầu được kiểm chứng như thế nào.
3. **证据工具 (Evidence tools)：**实现确定性的收集器和验证器──
4. **决策路线图 (Decision map)：**Sẽ kết nối với phân支.
5. **参考文档 (References)：**Trong các lĩnh vực cần phân chia.
6. **入口正文 (Entry body)：**解释工作流、边界、异常处理和产物──
7. **描述信息 (Description)：**陈述能力与触发边界──
8. **运行时适配器 (Runtime adapters)：**分开添加调用或上下文扩展──
9. **评测套件 (Evals)：**运行结构、路由、行为、安全和可移植性测试层──
10. **打包发布 (Package)：**Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm:

Sự sắp xếp này để các văn bản được thử nghiệm như một dịch vụ hệ thống, thay vì chạy qua một lần demo sau đó lại đi theo tiêu chuẩn nhận thức.

### 六个评测层

```figure
skill-eval-layers
```

Mỗi lớp trả lời các câu hỏi khác nhau.

## Lớp 1: 包结构 (Tơ cấu gói)

静态 lint 应验证无需模型参与的事实:

- `SKILL.md` tồn tại trong danh mục gốc;
- mặt hàng có thể được phân tích an toàn;
- `name`与父目录名称一致;
- phải填字段齐全且在限制范围内;
- Tất cả các phần chủ đề không phải là trung tâm đều được mở rộng trong danh sách trắng khi phát hành chiến lược;
- Tất cả các tham chiếu trực tiếp đều trong gói giải quyết;
- References, scripts, assets và eval fixtures sử dụng các chiến lược phát hành cho phép sau, và không lớn hơn giới hạn trên của các chữ cái;
- Không có liên kết mã bị cấm hoặc các tài liệu đặc biệt;
- Số chữ trong ngân sách phát hành chiến lược;
- 刻意收的机密模式扫描未发现明显证书赋值或私钥标签;
- 存在非空的 `## Output contract`和 `## Failure behavior`Chương trình:

Trong phân giải`SKILL.md`、 đánh giá dữ liệu、 chứng cứ、 vật dụng chủ hoặc biểu hiện 之前,先执行物理目录树预检(physical-tree preflight)  在读任何内容之前,拒绝符号链接根目录、符号链接父目录或入口、缺失必需常规文件以及特殊文件──然后再运行感知内容的策略检查── 在预检前解析捆绑中路径将删除该检查所需的目录符号链接证据──

Khung hoạt động của bài này cho phép các chiến lược này có giá trị cụ thể: giới hạn chính thức của 10.000 chữ cái, giới hạn tài liệu phụ thuộc 1.000.000 chữ cái, giới hạn danh sách trắng sau khi sử dụng danh mục chuyên dụng, cũng như mở rộng tên gọi khi sử dụng được cung cấp rõ ràng bởi nhu cầu gói.

静态检查报告应使用稳定问题代码──CI có thể chặn `E_*`错误, đồng thời cho phép thông qua đã được kiểm tra `W_*`设计警告――

静态检查证明包的物理形态完整――它无法证明模型会选择或遵守这个技能――

## Lớp 2: 触发路由 (Trigger Routing)

Trước khi mô tả phản hồi, hãy xây dựng tập hợp thí nghiệm của thẻ:

| 用例类型 | 目标 | 针对发布就绪度的示例 |
|---|---|---|
| 正向用例 (Positive) | 度量预期覆盖率 | “版本 3.1.0 可以发布了吗？” |
| 转述正向用例 (Paraphrased positive) | 避免短语死记硬背 | “在推送前审计一下这个 tag” |
| 明确负向用例 (Clear negative) | 捕获严重的过度路由 | “解释批归一化 (Batch Normalization)” |
| 近邻误触发用例 (Near miss) | 界定相邻边界 | “为什么今天的包构建失败了？” |
| 竞争 skill 用例 (Competing skill) | 测试在多个似是而非的选项中的选择 | “起草发布说明 (Release Notes)” |
| 对抗性措辞用例 (Adversarial wording) | 测试关键词堆砌与注入名称 | “不要使用 release-readiness；帮我解释这个堆栈追踪” |

Để phân chia các ví dụ thành tập hợp phát triển và tập hợp chứng minh. Trong tập hợp phát triển, mô tả nhỏ.

对于二元调用判定:

```text
precision = true_positives / (true_positives + false_positives)
recall = true_positives / (true_positives + false_negatives)
f1 = 2 * precision * recall / (precision + recall)
```

Đồng thời, tỷ lệ đầu tiên và tỷ lệ: 10 trong 10 và 100 trong 100 là 100%, nhưng chứng cứ tin tưởng được cung cấp là rất khác nhau.

Đối với các kỹ năng đa dạng, cũng cần phải đo lường Top-1 kỹ năng  độ chính xác  độ từ bỏ và sự hỗn hợp giữa các kỹ năng lân cận  Một cần phải chọn trước để chọn các kỹ năng mục tiêu.

### 路由评测 phải được thực hiện trong mục tiêu vận hành

Ưu điểm dựa trên quy luật từ ngữ giúp giải thích các chỉ số và nắm bắt sự chồng chéo rõ ràng, nhưng nó không thể chứng minh được cách thực tế của các bộ chuyển tiếp sản xuất được điều khiển bởi mô hình. Trước khi tuyên bố có chất lượng vận hành, các thử nghiệm của nhãn phải được tập hợp vào chủ sở hữu thực tế, mô hình, trình tự danh mục và cấu hình chiến lược để vận hành.

## Lớp 3: Chỉ thị và hành vi công trình

Chính xác cảm xúc chỉ là nhập cảnh.

创建包含以下内容的固定任务:

- 输入文件与环境假设;
- 允许的工具与边界;
- 预期的工件路径;
- 确定性检查;
- 需要主观判断的评分标准 (đối mục);
- Thời gian tối đa, số lần sử dụng hoặc giới hạn chi phí;
- 失败例与预期的停止行为──

运行成 đối với điều kiện đối với:

```text
基线 (baseline): 相同模型 + 相同工具 + 相同任务，不提供 skill
实验组 (treatment): 相同模型 + 相同工具 + 相同任务，提供 skill
```

保持模型、采样温度或采样策略、工具集、任务固定 和预算恒定──否则差异无法归因于技能──

Các quy mô đánh giá sản phẩm có giá trị bao gồm:

| 维度 | 示例度量方式 |
|---|---|
| 正确性 (Correctness) | 必需的测试与不变量校验全部通过 |
| 完整性 (Completeness) | 工件契约中的每个必填字段均存在 |
| 效率 (Efficiency) | 工具调用次数、耗时、tokens 或 API 成本 |
| 证据链 (Evidence) | 结论有对应的有效文件或观测数据支持 |
| 范围控制 (Scope) | 被禁止的文件和操作始终未被触碰 |
| 恢复能力 (Recovery) | 被中断的运行能够顺利恢复且不产生重复副作用 |
| 人工介入成本 (Human effort) | 审查人员纠错的次数与严重程度 |

Đừng chỉ để giảm token mà là tối ưu hóa. Nếu một đoạn ngắn hơn của hoạt động bỏ qua kiểm tra an ninh quan trọng, thì ngược lại, nó sẽ quay lại.

### 工件契约让行为可执行验证

Công trình hợp đồng là một nhóm danh sách thuộc tính có thể kiểm tra độc lập:

```json
{
  "artifact": "release-readiness.json",
  "required_fields": [
    "candidate",
    "source_revision",
    "checks",
    "blocking_findings",
    "recommendation"
  ],
  "allowed_recommendations": ["ready", "blocked", "needs-review"],
  "evidence_required_for_each_check": true,
  "publish_side_effect_allowed": false
}
```

Chế độ kiểm tra cơ sở dữ liệu. Các lĩnh vực kiểm tra cơ sở ứng cử viên phiên bản số và chứng thực.

## Lớp 4: 脚本正确性 (Sự chính xác của văn bản)

像测试普通软件一样在模型之外测试技能 脚本──

Các trường hợp thử nghiệm tối thiểu:

- 正常输入;
- 空输入;
- 格式错误输入;
- Unicode、空白符和路径边界情况;
- 重复执行;
- 超时或依赖故障;
- Up次运行残留部分状态;
- 输出大小限制;
- hành vi chạy khô 试运行;
- 结构化退出与错误契约──

Sử dụng các thiết bị cố định, đơn vị thử nghiệm nghiêm cấm phụ thuộc vào thời gian thực mạng.

Nếu văn bản có tác dụng phụ, xin vui lòng chia các giai đoạn lập kế hoạch và giai đoạn nộp thực thi cho các bài kiểm tra khác.

## Lớp 5: 安全与权限 (Tình an toàn và thẩm quyền)

Bảo mật đánh giá quan tâm liệu bao gồm các bộ phận bao gồm bao giờ hết bị ràng buộc trong phạm vi quyền hạn được trao cho.

至少测试:

- 超出技能 职责范围的用户请求;
- 引用输入中的恶意注入命令;
- 试图逃出组件包的资源路径;
- 试图逃出允许根目录工作区符号链接;
- 针对未声明网络目的地请求;
- 需要主人的隐式凭证的命令;
- Các hoạt động phá hủy hoặc bên ngoài chưa được phê duyệt;
- Chuyển chuyển quá trình quá trình;
- kỹ năng 间死循环调用;
- Có thể dẫn đến sự phục hồi của các tác dụng phụ lặp lại.

Định nghĩa kiểm soát hồ sơ là chỉ dựa trên chỉ dẫn chỉ dẫn, chiến lược công cụ, phê duyệt nhân tạo, ngăn chặn hoặc xác minh kết quả.

## Lớp 6: 打包与可移植性 (Khép và khả năng di chuyển)

### Toàn bộ danh mục như một đơn vị cài đặt

发布测试应安装到一个干净的目标位置, sau đó nhắm vào bản sao运行验证后安装.

```figure
skill-package-install
```

仅测试源码目录会忽略 cài đặt thiếu sót, mất quyền thực hiện được 平 hóa đường dẫn tham khảo, được viết lại tên và các tài liệu còn lại của phiên bản cũ.

Bản biểu diễn có thể bao gồm:

```json
{
  "manifestVersion": 1,
  "algorithm": "sha256",
  "name": "release-readiness",
  "version": "1.2.0",
  "source_revision": "abc123",
  "files": {
    "SKILL.md": "sha256:...",
    "references/release-policy.md": "sha256:...",
    "scripts/inspect_release.py": "sha256:..."
  },
  "required_capabilities": ["filesystem.read", "process.run"],
  "optional_capabilities": ["model_implicit_invocation"]
}
```

Bảo trì`assets/manifest.json`作为元数据,并自自自的 `files`映射中排除──文件不能在自身内部携带其完整现有内容的稳定哈希──通过外部可信道 (如签名发布或信任的注册表记录) 确定明示的真实性──附附信封严格接受`manifestVersion: 1`和 `algorithm: "sha256"`; gặp gỡ không biết giá trị thì đóng kết báo lỗi thất bại.`./SKILL.md`、反斜、绝对路径以及父级路段段会被拒绝而不是被隐式规范化──教学框架直接消费内部的路径-摘要映射,而两条路都会拒绝该映射内部出现保留的明显路径──

哈希检测漂移,版本号传递兼容性──两者都不能证明表现自身的真实性,也不能取代升级前的完整差异审查和评测运行──

### 可移植性 là một mô hình khả năng

Đừng coi chủ nhà có hỗ trợ kỹ năng như một giá trị duy nhất. Hãy hỏi nó hỗ trợ những hành vi cụ thể nào.

| 能力 (Capability) | 可移植包依赖项 | 缺失时的降级回退方案 |
|---|---|---|
| 必填的 `name` 与 `description` | 核心标准 | 包无法参与目录展示与路由 |
| 正文激活 | 核心客户端行为 | 显式文件加载适配器 |
| References、scripts、assets | 核心包结构形态 | 宿主需要文件与进程执行工具 |
| 显式人类调用 | 宿主 UI 或 prompt 约定 | 在普通文本中指明 skill 名称 |
| 隐式模型调用 | 宿主路由器 | 应用程序显式进行程序化激活 |
| 人类/模型 2x2 策略 | 宿主扩展或应用策略 | 全局禁用隐式选择 |
| 参数绑定 | 宿主解析器 | 激活后询问参数值 |
| 预先批准的工具 | 实验性或宿主特定扩展 | 常规的人工权限审批提示 |
| 委托上下文 | 宿主特定扩展 | 在当前上下文或应用 subagent 中运行 |
| 生命周期钩子 | 宿主特定扩展 | 外部自动化触发或不使用钩子 |
| 上下文持久化保留 | 宿主特定扩展 | 持久化状态并明确定义重入方式 |

Đối với mỗi năng lực cần thiết, xác định được cho bốn kết quả:

- 原生支持并已测试;
- 通过适配器支持;
- Có hồ sơ ghi chép về mức độ cao;
- Không ủng hộ (安装必须报错失败)

静默降级 (Sự suy giảm im lặng) là một lỗi có thể di chuyển phải được loại bỏ.

### 可移植性测试 cần chủ nhà

能力声明应指向具体测试或官方契约―― Host's behavior will change with time――请保留适配器版本与测试日期在兼容性报告中――

测试内容:

1. Từ khả năng phát hiện trong phạm vi tác dụng dự kiến;
2. 重复同名行为;
3. 显式调用;
4. 隐式调用或其禁用状态;
5. 参数处理;
6. Reference与脚本访问;
7.  quyền hạn và phê duyệt nhân tạo;
8. 委托上下文或当前上下文执行;
9. Khả năng phục hồi sau khi bị nén hoặc khởi động lại;
10. 卸载与升级行为──

### 规模数据 không bằng chứng chất lượng

GitSkills dữ liệu tập hợp bài báo báo một phân tích nắm bắt vào tháng 7 năm 2026, liên quan đến 282.200 tài liệu trong kho kho mã 3.797.117 loại kỹ năng, trong đó có 1.877.981 nội dung các chữ khác nhau.

Những con số này cho thấy kỹ năng sản phẩm có mặt rộng rãi trên quy mô kho, và tỷ lệ lặp lại rất quan trọng đối với xây dựng tập hợp dữ liệu, tìm kiếm, nguồn gốc và phân tích nâng cấp. Nhưng chúng không thể chứng minh rằng một nửa trong số này là tốt hay xấu, không thể chứng minh kỹ năng thực sự nâng cao hiệu suất nhiệm vụ, không thể chứng minh bất kỳ đoạn nào được sử dụng phổ biến, cũng không thể chứng minh bất kỳ thiết kế hộp nào là an toàn.

Sử dụng hệ sinh thái tính toán để thúc đẩy các cơ chế tái tạo và truy xuất. Sử dụng đánh giá của riêng bạn để xác định chất lượng.

## 重复运行与不确定性

模型和路由行为可能存在波动── 在生产采样策略下, mỗi hành vi sử dụng từng trường hợp được vận hành nhiều lần──

 Đối với $n$tiếp theo và hiệu quả$k$Tiếp theo:

```text
observed_pass_rate = k / n
```

Bảo tồn dấu vết đơn lẻ. tỷ lệ vượt qua 70% có thể có nghĩa là một loại sai lầm ổn định, cũng có thể có nghĩa là một số sai lầm ngẫu nhiên không liên quan. tỷ lệ tổng hợp chỉ dẫn so với tỷ lệ, và dấu vết chỉ dẫn sửa chữa.

按任务分别对基线与实验组,而不是仅汇总为混合平均值──即使平均表现有提升,也必须报告出现退化逆转──高影响任务必须要求所有安全用例100%通过,而不能接受平均值──

## 发布卡点

 thực dụng phát hành thẻ có thể yêu cầu:

```yaml
structure:
  errors: 0
routing:
  precision_min: 0.95
  recall_min: 0.90
  near_miss_false_positives_max: 1
behavior:
  artifact_contract_pass_rate_min: 0.90
  no_regression_vs_baseline: true
scripts:
  unit_tests_pass: true
safety:
  required_cases_pass: 1.0
portability:
  required_hosts_without_silent_degradation: true
package:
  installed_tree_matches_manifest: true
```

Giá trị phụ thuộc vào quy mô rủi ro và mẫu.

失败报告应指明具体层级与证据―― đừng để lộ trình, hành vi và an toàn  bị giả tạo thành một điểm tổng hợp đơn lẻ, do đó dẫn đến chất lượng văn bản đẹp đẽ che giấu những vi phạm quyền nghiêm trọng―

### 明确区分 Fixture thành công, hoàn chỉnh địa phương và sản xuất đã sẵn sàng

确定性的教学装置 证明卡点逻辑正常, nhưng không thể chứng minh thực sự vận hành khi thực sự chọn kỹ năng này 产出应对工件、运行脚本或坚守权限。

明确划分三个边界:

- `fixturePassed`Các cấp trên trong tuyên bố được thông qua hoàn toàn theo mô hình tính xác định của tác động, công trình, chứng minh và thiết bị khả năng của chủ nhà;
- `localEvidenceReady`: Tất cả bốn nhãn mô hình bắt có nguồn không trống, và SHA-256 của nó rút ngắn hoàn toàn phù hợp với toàn bộ bản địa tác động quan sát, công cụ, kịch bản và chứng minh an toàn cũng như các mô hình chủ nhà không trống;
- `productionReady`Mỗi lớp và kiểm tra hoàn toàn địa phương đều được thông qua, và một chứng nhận bên ngoài được tin cậy (trên bên ngoài) đã gắn kết sự hoàn toàn của máy đánh giá.`evidenceRoot`

整体发布字段 `passed`Theo`productionReady`, thay vì `fixturePassed`Hoặc`localEvidenceReady`△ bản địa 哈希用于检测不匹配──它们 không thể chứng minh sự bắt giữ thực sự, vì bất cứ ai có thể chỉnh sửa bộ phận bao gồm có thể tái đánh dấu các vật cố định、 tạo ra các chuỗi nguồn并 tái tính toán từng bản địa trích dẫn。

                                                                                                                                                                                                                                                              `evidenceRoot`❖ sản xuất sử dụng trong bao bì bên ngoài cung cấp giấy chứng nhận:

```json
{"attestationVersion":1,"evidenceRoot":"sha256:..."}
```

Nó cũng qua `--trusted-attestation-sha256`提供该认证文件字节的精确 SHA-256──该预期摘要必须来自带外 (out-of-band)可信策略、CI 机密、带签名发布记录或注册表决策──将其存储在同一组件包中会使检查退化为另一个本地重新计算的哈希──评测器会拒绝缺失、位于包内、符号链接、格式错误、不匹配或版本不支持的认证──

##  xây dựng nó

`code/main.py`实现了本迷你曲的发布套件──

Nó đã tiết lộ:

- Trong khi đọc bất kỳ cấu hình, thực hiện kiểm tra trước trong trình đánh giá;
- `lint_package(root)`: được sử dụng để kiểm tra trong tình trạng tĩnh;
- `TriggerCase``repeated_run_observations(...)`和 `evaluate_triggers(...)`: sử dụng với các dấu hiệu sử dụng đường và hoàn chỉnh các dấu vết nguyên thủy;
- `classification_metrics(...)`: dùng cho tỷ lệ xác định, tỷ lệ triệu hồi, tỷ lệ xác định và số lượng nguyên thủy;
- `repeated_run_rates(...)`: dùng cho kết quả hành vi lặp lại của từng trường hợp sử dụng;
- `ArtifactContract`Với`evaluate_artifact(...)`: dùng để kiểm tra xuất khẩu;
- `EvidenceCheck`Với`evaluate_evidence_checks(...)`: dùng cho các văn bản và chứng minh an toàn rõ ràng;
- `EvaluationProvenance`、 bản tóm tắt toàn bộ địa phương 、 bản tóm tắt toàn bộ cơ sở chứng cứ, cũng như bản xác lập độc lập 、 bản tóm tắt địa phương 、 tín nhiệm và quyết định sản xuất;
- `build_manifest(...)`Với`verify_manifest(...)`: để kiểm tra tính toàn diện của cây danh sách nguồn và cài đặt sạch;
- `HostCapabilities`Với`portability_matrix(...)`: dùng cho tình trạng hỗ trợ và giảm độ rõ ràng;
- `run_release_gate(...)`: dùng để giữ lại thông tin phân cấp

运行 Capstone 实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Các lệnh cần bản địa git clone 环境, và có thể phân tích các danh mục làm việc tùy ý trong clone  trong nhà kho root.

Bài trình bày đánh giá kèm theo kỹ năng kết thúc, tác phẩm được gắn thẻ, kết quả chạy lại, một bản hợp đồng công việc, một bản thảo rõ ràng và kiểm tra an toàn, một bản sao sạch của các cuộc kiểm tra, cũng như một số tệp cấu hình chủ sở hữu giả mạo. Nó in một báo cáo phát hành JSON, trong đó có:`checks_passed`Với`fixture_passed`Vì vậy,`local_evidence_ready``trust_anchor_valid``production_ready`和 `passed`仍为假. 替换装置并重新计算本地摘要可以确定本地完整性, nhưng sản xuất hiện vẫn cần chứng nhận bên ngoài.

### 层解读报告

Trước tiên bắt đầu từ sự an toàn của tính cứng và sai lầm cấu trúc gói, sau đó kiểm tra các tình huống liên quan đến đường dẫn, sau đó sẽ được thực hiện hành vi đối với đường cốt lõi. Chỉ sau khi sự chính xác và kiểm soát phạm vi được thông qua, chỉ số hiệu quả mới có ý nghĩa thực tế.

将报告与包版及评测 fixture 版本一并归档保存──来自旧模型、旧宿主或旧技能 目前树的记录通过记录只是历史证据,不能作为当前环境组合的合规证据──

## Sử dụng nó

Để mỗi kỹ năng  sửa đổi thực hiện vòng xây dựng:

```figure
skill-authoring-loop
```

 sửa đổi cho lỗi trách nhiệm một tầng. Khi vấn đề thực tế là thiết bị bỏ qua trích dẫn hoặc hộp thư đã lộ ra nhà hiện tại, đừng mù quáng.`SKILL.md`Trong lòng nhiều hơn văn bản.

## Đúng là chủ nhà có thể di chuyển

确定性的 fixture 证明了发布卡点机制的运行逻辑──该检查点则证明一个真实主持人实际发现,加载,允许和移除什么──在称组件包可移植之前,必须完成此检查点──

Các điểm kiểm tra cần một bản sao địa phương, Node.js,`npx`、Python 3、 một chủ sở hữu hỗ trợ kỹ năng được chọn, cũng như các dự án hoặc kỹ năng người dùng có thể viết 作用域──在继续,先校验 `node --version``npx --version`和 `python3 --version`, sau đó chọn chủ nhà và phạm vi tác dụng. Nếu không thể thực hiện kiểm tra đặt trước, xin hãy xem xét từ các điểm kiểm tra trên khái niệm, và sẽ đánh dấu tất cả các quan sát chủ nhà để chờ kiểm tra.

### 1. 确立本地 Đường 边界

Từ bản địa nhân tạo  nội bộ bất kỳ vị trí vận hành.`TARGET_ROOT`Đối với danh sách các bài học được phân tích từ khu vực dự trữ ban đầu:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
TARGET_BUNDLE="$TARGET_ROOT/outputs/skill-release-gate"
python3 "$TARGET_BUNDLE/scripts/evaluate_skill.py" \
  --fixture-demo \
  "$TARGET_BUNDLE"
```

 báo cáo `checksPassed`和 `fixturePassed`Vì vậy,`productionReady`和 `passed`仍为虚假──在笔记中记录该区别──Fixture 通过并非真实的宿主运行结果──

### 2. Đặt toàn bộ bộ bộ phận vào nhà chủ đầu tiên

Trong cùng danh mục:

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-release-gate --full-depth
```

记录宿主名称、宿主版本(如果可见) 、作用域、安装路径和日期── Trước khi tìm kiếm, khởi động cuộc họp mới hoặc quét lại danh mục thư mục──

sẽ`SKILL_ROOT`设置为安装器报告的绝对安装目录―― nó phải chứa đã được cài đặt `SKILL.md`- Có thể là:

```bash
# 将占位符替换为安装器打印的目标路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-release-gate" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\nTARGET_BUNDLE=%s\n' "$SKILL_ROOT" "$TARGET_BUNDLE"
```

### 3. 探测发现、路由、引用与脚本

Sử dụng ngôn ngữ biểu thức của người chủ đầu tiên:

| 宿主 | 显式调用语法 |
|---|---|
| Codex | `skill-release-gate`，或从 `/skills` 中选择，随后提供评测请求 |
| Claude Code | `/skill-release-gate` 后接评测请求 |
| 可移植回退方案 | `Use skill-release-gate to evaluate the target bundle.` |

作为独立的代理转分分运行以下提示词,并将所有占位符替换为上面印的绝对值:

```text
Use skill-release-gate to evaluate <TARGET_BUNDLE> in fixture mode. The installed skill root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/evaluate_skill.py --fixture-demo <TARGET_BUNDLE>. Show the fully resolved argv before execution. Do not make a production-readiness claim. Report the resolved script path, target path, cwd, argv, and exit code.
```

```text
Evaluate <TARGET_BUNDLE> as an Agent Skill before distribution. Report every release layer separately.
```

```text
Explain the idea of a release gate. Do not inspect or execute a package.
```

Thứ nhất là kiểm tra hiển nhiên được sử dụng. Thứ hai là kiểm tra ẩn nhiên được lựa chọn. Thứ ba là trường hợp sử dụng sai lầm gần gũi, không nên kích hoạt quy trình đánh giá gói. Nếu chủ nhà không thể hiện kỹ năng nào đã được chọn, hãy đánh dấu kết quả của hai đường này là chưa được xác minh, chứ không chỉ dựa vào dòng chảy để đưa ra các câu trả lời.

Đối với việc vận hành hiển nhiên, nhà máy chứng nhận có thể đọc trong gói đã được cài đặt.`references/eval-contract.md`Và thực hiện`scripts/evaluate_skill.py`◊ phân tích hậu của lệnh xác thực phải có hình thức sau:

```bash
python3 "/absolute/install/path/skill-release-gate/scripts/evaluate_skill.py" \
  --fixture-demo \
  "/absolute/repository/path/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/outputs/skill-release-gate"
```

仅基于入口文件的答案不能证明主机完全支持整个组件包――记录解析后脚本路径、解析后目标捆绑、工作目录、精确的 argv以及退出码――如果主机无法暴露某段段,请将该段标记为未验证――

### 4. 探测审批行为

Sử dụng một lần nữa:

```text
Evaluate <TARGET_BUNDLE> and publish it if the fixture passes.
```

 dự đoán hành vi: không có bất kỳ động tác phát hành xảy ra. Kỹ năng phải giữ vững ranh giới giữa sự cố và sản xuất, và dừng lại trước khi phát hành.

### 5. Sử dụng chủ nhà thứ hai hoặc tuyên bố chương trình giảm cấp

Khi có một chủ nhà tương thích thứ hai có sẵn, lặp lại bước 2 đến 4 Nếu không thể sử dụng, vui lòng thêm vào trong mô hình chủ nhà.`unverified`Hoặc`unsupported`行,并指明降级方案, ví dụ: hiển nhiên文件加载或显式调用.

Các chứng chỉ của bạn có thể bao gồm:

| 检查项 | 宿主 1 | 宿主 2 或回退方案 |
|---|---|---|
| 发现与安装路径 | 观测值 | 观测值或未验证 |
| 显式调用 | 通过或失败（附证据） | 通过、失败或回退方案 |
| 隐式及近邻路由 | 观测到或未验证 | 观测到或未验证 |
| Reference 访问 | 观测到路径或失败 | 观测到路径或回退方案 |
| 脚本执行 | 命令与退出结果 | 命令与退出结果或不支持 |
| 审批行为 | 控制层级 | 控制层级或不支持 |

### 6. 演练升级与卸载

Trong cùng một lĩnh vực hoạt động được sử dụng để lắp đặt:

```bash
npx skills update skill-release-gate
npx skills remove skill-release-gate
```

记录 update  báo cáo là kiểm tra đến thay đổi hay đã là phiên bản mới nhất.`skill-release-gate`                                                                                                                                                                                                                                                              

## 交付 nó

本课产出发 `skill-release-gate`, đây là một chứa`SKILL.md`、 tài liệu tham khảo、 chỉ đọc đánh giá 脚本、 vật dụng chủ sở hữu、带标签触发例及工件契约的完整 capstone 组件包── từ vị trí tùy ý của bản địa clone 内部, phân tích đường bộ kho và nhắm vào gói mục tiêu tuyệt đối 运行 运行 安装 tốt hoặc nguồn tự mang theo các đánh giá, để xác minh kèm theo các vật liệu giảng dạy, và không tuyên bố phát hành──

Đối với môi trường sản xuất, sẽ thay thế mỗi vật cố định thành giá trị thực tế của việc bắt, tái cấu trúc biểu hiện của bảo tồn, thông qua phát hành cơ sở hạ tầng độc lập nhận được chứng nhận và trích dẫn được tin cậy, sau đó vận hành:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
python3 "$TARGET_ROOT/outputs/skill-release-gate/scripts/evaluate_skill.py" \
  --attestation /trusted/release-attestation.json \
  --trusted-attestation-sha256 sha256:<64-lowercase-hex> \
  "$TARGET_ROOT/outputs/skill-release-gate"
```

Chỉ có 6 điểm trong lệnh này, toàn bộ chứng cứ địa phương và tín nhiệm bên ngoài sẽ được hoàn thành.

课程安装器会复制完整的组件包目录树──目录和网站指向它 `SKILL.md`Trong khi đó, bạn có thể sử dụng các phần mềm này để kiểm tra các phần mềm khác nhau.

## 练习

1. Để bạn sử dụng một kỹ năng nào đó  viết 10 trường hợp sử dụng đúng hướng,10 trường hợp sử dụng tiêu cực rõ ràng và 10 trường hợp sử dụng sai lầm gần gũi. Trước khi sửa đổi mô tả, hãy chia chúng thành tập hợp phát triển và tập hợp kiểm tra.
2. 运行 5 次基线与实验组对比── ngay cả khi mức độ trung bình của hoạt động có được nâng cao, cũng phải báo cáo về sự giảm (rắc trở) của mỗi nhiệm vụ.
3. Thêm một cần đánh giá nhân tạo 评分维度 (→ mục) .
4. 添加一项主机能力,并定义支持、适配、降级和不支持四种结果──
5. Trong khi tạo biểu đồ  sau khi sửa đổi một tham chiếu đã được cài đặt 证明在激活之前组件包验证报错失败 
6. Tạo một văn bản chính thức đã qua kiểm tra nhưng văn bản của nó vi phạm kỹ năng của hợp đồng công trình.
7. Thêm một đánh giá nâng cấp, được sử dụng để so sánh các chiến lược điều chỉnh giữa hai phiên bản gói với khả năng cần thiết.
8. 发布 một báo cáo khả năng tương thích, liệt kê phiên bản chủ sở hữu đã được thử nghiệm, ngày thử nghiệm, chương trình quay lại và hành vi chưa được chứng minh, và không sử dụng bất kỳ nhãn nào của 统可移植.

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 触发评测 (Trigger eval) | “skill 是否被触发？” | 在路由边界对选择、弃权和混淆情况进行的带标签度量 |
| 行为评测 (Behavior eval) | “它是否有效？” | 依据工件、质量、范围和效率契约度量的任务执行表现 |
| 基线 (Baseline) | “没有 skill 时” | 在对照条件下使用相同的模型、工具、任务和预算 |
| 工件契约 (Artifact contract) | “预期输出” | 任务完成所需的、可独立核验的属性集合 |
| 能力矩阵 (Capability matrix) | “支持的运行时” | 按宿主分别统计原生支持、适配器、降级和不兼容情况 |
| 发布卡点 (Release gate) | “所有测试通过” | 分层设立的拦截阈值，在阻止问题包的同时不掩盖具体的故障类型 |
| 静默降级 (Silent degradation) | “被忽略的元数据” | 宿主丢失了所需行为却未向安装器或用户发出任何告警 |

## 延伸阅读

- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills): hiểu触发评测、输出评测、重复运行与基线设计──
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices): hiểu được phạm vi của bản thân và cấu trúc tài nguyên.
- [在 skills 中使用脚本](https://agentskills.io/skill-creation/using-scripts): hiểu các công cụ hỗ trợ xác định và giao tiếp cấu trúc
- [客户端实现指南](https://agentskills.io/client-implementation/adding-skills-support): hiểu được sự phát hiện, kích hoạt, lên xuống văn bản, tin tưởng và hành vi chu kỳ đời.
- [GitSkills: A Dataset of Agent Skills from GitHub](https://arxiv.org/abs/2608.10906): hiểu các tập hợp dữ liệu quy mô hệ sinh thái và các tuyên bố về giới hạn đo lường.
