# 内容审核系统  OpenAI, Perspective, Llama Guard

> Hệ thống kiểm soát cấp sản xuất sẽ Bài học 12-16 định nghĩa các chính sách an toàn 操作化。OpenAI Moderation API:`omni-moderation-latest`(2024) 基于GPT-4o,可在一次调用中对文 +图像 分类;在多语言测试集上上上一版本提升42%;回复方案 返回 13 个类别的布鲁尔语 骚扰,骚扰/威胁,仇恨/威胁,非法,非法/暴力,自伤,自伤/意图,自伤/说明,性,性/少数,暴力,暴力/图形;对大多数开发者免费――Layer退休模式:Input moderation (pre-generation) ・Output moderation (post-generation) ・Customation (domain rules) Asyncline calls for parallel 可隐藏性延迟;回复时代:Interfactor Response 通过Liggy Guard (Loggy Guard)  Lâm tính/Limages                                                                                                                                                              

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**前置要求：**Giai đoạn 18 · 16 (Llama Guard / Garak / PyRIT)
**Time:** ~60 minutes

## Học mục tiêu
- Mô tả phân loại phân loại của OpenAI Moderation API, cũng như bộ MLCommons của nó với Llama Guard 3 có gì khác nhau.
- mô tả ba mô hình lớp độ trung bình (input, output, custom),并 chỉ ra mỗi lớp là một chế độ thất bại.
- Mô tả API viễn cảnh như định vị cơ sở của thời đại trước LLM, cũng như lý do tại sao nó vẫn được sử dụng để nghiên cứu.
- Nói rõ thời gian giảm giá Azure.

## 问题
Bài học 12-16 mô tả các cuộc tấn công và các công cụ phòng thủ. Bài học 29 bao gồm các hệ thống kiểm soát đã được triển khai, chúng sẽ phòng thủ trên bề mặt của sản phẩm tiếp xúc với người dùng.

## 概念
### OpenAI Moderation API

`omni-moderation-latest`(2024) ・ dựa trên GPT-4o ・ một lần调用即可对文本 + hình ảnh 分类。 đối với hầu hết các nhà phát triển miễn phí。

Các loại (đối tượng phản ứng 中的 13 个 boolean):
- Trẻ em, quấy rối/cảnh đe dọa
- thù hận, thù hận/cảnh đe dọa
- tự gây hại, tự gây hại/cố định, tự gây hại/sự hướng dẫn
- tình dục, tình dục/từ tuổi thơ
- bạo lực, bạo lực/phần đồ họa
- bất hợp pháp, bất hợp pháp/ bạo lực

Hỗ trợ đa phương tiện 适用于 `violence``self-harm`和 `sexual`, nhưng không thích hợp cho `sexual/minors`;其余为 văn bản-chỉ。

Trong `code/main.py`Trong khi đó, để dạy cho chúng ta tính đơn giản, chúng ta sẽ`/threatening``/intent``/instructions`和 `/graphic`Các phân loại phụ  xếp vào các bậc cha mẹ cấp cao của chúng 

Trong nhiều ngôn ngữ, điểm cuối của các bài kiểm tra được nâng cao 42% hơn so với các bài kiểm tra trên thế hệ trước.

### Llama Guard 3/4

已在课 16 覆盖──14 个 MLCommons nguy cơ loại hình(组织方式不同于OpenAI's 13 个响应方案布鲁尔语)──支持 8 ngôn ngữ (v3)──Llama Guard 4 (2025 年 4 月) 原生支持多模,12B──

Các phân loại của OpenAI và Llama Guard có sự chồng chéo nhưng cũng có sự khác biệt. OpenAI sẽ "không hợp pháp" như một loại rộng lớn; Llama Guard sẽ "sự phạm tội bạo lực" và "sự phạm tội không bạo lực" phân chia.

### API Perspective (Google Jigsaw)

早于 LLM-as-moderator 浪潮(pre-2020) của hệ thống điểm độc tính.

Nó được sử dụng rộng rãi như cơ sở nghiên cứu về kiểm duyệt nội dung, bởi vì API này 稳定、有文档, còn có dữ liệu hiệu chuẩn nhiều năm.

### Mô hình ba lớp

1. **Input moderation.**Trong thế hệ 前对用户提示 分类──如果标记,则拒绝──延迟:一次分类器调用──
2. **Output moderation.**Trong giao hàng trước đối với sản xuất mô hình 分类── nếu được đánh dấu,则替换为拒绝──Latency:generation 后一次分类器调用──
3. **Custom moderation.**Quy tắc cụ thể về lĩnh vực (regex, allowlists, business policy)

Đây là một thứ ba theo thiết kế: sự điều chỉnh đầu vào phải được hoàn thành trong thế hệ trước, sự điều chỉnh đầu ra trong thế hệ sau.

### Các chế độ thất bại

- **Input only.**捕捉不到输出幻觉 (Dạy học 12-14 mã hóa tấn công sẽ đi ngang qua các phân loại đầu vào)
- **Output only.**允许任何输入到达模型; tăng chi phí; cho kẻ tấn công 暴露 ra lý luận nội bộ.
- **Custom only.**Không thể ổn định bao gồm các loại hình; các khu vực rất yếu đuối.

Layered 是默认做法──双重保险──

### Sự giảm giá Azure

Moderator Nội dung Azure: 24 tháng 2 đã hết hạn, 2027 tháng 2 đã nghỉ hưu.

### Khi điều này phù hợp với giai đoạn 18

Bài học 16 Trong bối cảnh nhóm đỏ 中覆盖 умеренция инструменталинг。 Bài học 29 覆盖 triển khai умеренция。 Bài học 30 以当前双用途能力证据 收尾。


```figure
an-moderation-layers
```

## Sử dụng nó
`code/main.py`构建一个三层调节套:输入调节器(keyword + category score) 、输出调节器(对输出使用相同的分类器) 、定制调节器(域规则) 。你可以将输入 跑过它,并观察哪一层捕捉到了什么──

## 交付 nó
本课产 出 `outputs/skill-moderation-stack.md` Đưa ra một triển khai, nó sẽ đề xuất cấu hình dung lượng: input, sử dụng phân loại nào, output, sử dụng các quy tắc tùy chỉnh, cũng như các trường hợp cạnh sử dụng gì đánh giá.

## 练习
1. 运行 `code/main.py`将良性,边界和有害输入 跑过全部三层――报告每种情况哪一层触发――

2. 扩展 harness,加入针对特定类别的 Perspective-API-style toxicity scoring──比较其门行为与类别分数──

3. 阅读 OpenAI Moderation API docs 和 Llama Guard 3 danh sách danh sách danh sách danh mục.

4. Để triển khai trợ lý mã (ví dụ như GitHub Copilot) thiết kế dung lượng điều chỉnh.

5. Moderator Nội dung Azure sẽ nghỉ hưu vào tháng 2 năm 2027                                                                                                                                                                                                                                                       

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
- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) Điểm cuối của sự ôn hòa
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) Llama Guard repo
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) Điểm số độc tính
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) Thay thế Azure
