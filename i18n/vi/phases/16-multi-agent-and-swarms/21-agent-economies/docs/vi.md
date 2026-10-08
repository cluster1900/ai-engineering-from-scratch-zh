# Trưởng 经济、Token  khuyến khích、声誉

> 长周期 tự trị đại lý (METR) 1 小时到 8 小时工作曲线) cần năng lực đại lý kinh tế.**5-layer stack**是:**DePIN**(phí-si-c tính) →**Identity**(W3C DIDs + 声誉资本) →**Cognition**(RAG + MCP) →**Settlement**(trích trừ tài khoản) →**Governance**(DAI đại lý)  sản xuất cấp đại lý- khuyến khích 网络包括 **Bittensor**(Các mạng phụ của TAO  Giải thưởng mô hình cụ thể về nhiệm vụ)**Fetch.ai / ASI Alliance**(ASI-1 Mini LLM + FET token) và **Gonka**(Dựa trên PoW của biến thể, sẽ tính toán tái phân bổ vào AI 任务 có giá trị sản xuất)**Shapley-value credit attribution**Để được thưởng công bằng cho các đại lý đóng góp; Google Research  Thiết kế cơ chế cho các mô hình ngôn ngữ lớn   đề xuất trong sự tổng hợp đơn giản  采用 thanh toán giá thứ hai **token auctions**△本课会构建一个最小代理市场,将Shapley-值信用归因应用于多代理管道,并运行一个第二价代币拍卖,让游戏理论机制具体落地──

**Type:** Learn
**Languages:** Python (stdlib)
**前置要求：**Giai đoạn 16 · 16(Tân đàm và thương lượng),Giai đoạn 16 · 09(Tân mạng hàng loạt song song song)
**Time:** ~75 分钟

## 问题
Khi các đại lý  cùng tạo ra giá trị ‒ nhưng cũng cần được thưởng riêng biệt, các hệ thống đa đại lý sẽ trở nên phức tạp ‒ cơ chế cổ điển, chẳng hạn như phân phối trung bình ‒ người đóng góp cuối cùng lấy tất cả, hoặc không công bằng, hoặc dễ bị thao túng ‒ thông qua các giá trị của Shapley  tiến hành các phần thưởng dựa trên liên minh, trong việc xây dựng là công bằng, nhưng chi phí tính toán rất cao ‒ các tài liệu năm 2025-2026 đã thúc đẩy các phương pháp gần như thực tế: mẫu Shapley ‒ đấu giá tổng hợp đơn vị, cũng như danh tiếng trên chuỗi tích lũy từ những đóng góp đã được xác nhận ‒

Ngoài việc gán tín dụng, lĩnh vực này đã chuyển sang các đại lý kinh tế thực sự:Bittensor TAO  thưởng khai thác máy tính, để điều chỉnh các mô hình cụ thể của các mạng phụ;Fetch.ai/ASI sử dụng các mã thông báo FET  thưởng ASI-1 Mini LLM sử dụng;Gonka sẽ biến chứng công việc tái phân phối vào AI có giá trị sản xuất  nhiệm vụ;.

Bài học này xem xét kinh tế đại lý như một vấn đề cụ thể: quy định tín dụng, thiết kế cơ chế và danh tiếng, và sử dụng ít nhất các toán học xây dựng từng phần, để khái niệm thực sự tồn tại.

## 概念
### 5 lớp đại lý-thế toán đống

1. **DePIN（physical compute）。**Để tập trung cơ sở hạ tầng, sử dụng thuê GPU, lưu trữ, băng thông.
2. **Identity。**W3C Decentralized Identifiers (DID) cho mỗi đại lý một cái ID lâu dài không phụ thuộc vào bất kỳ nền tảng nào.
3. **Cognition。**Loop lý luận của đại lý:LLM + RAG + MCP。 đây là các giai đoạn khác 构建的内容。
4. **Settlement。**Quý vị có thể trả gas từ dư thừa của mình, không cần phải có ETH.
5. **Governance。**Các DAO đại lý: bởi nhân loại và các đại lý cùng nhau đối với các thay đổi giao thức  bầu cử cấu trúc quản lý, quyền bỏ phiếu và danh tiếng bị ràng buộc.

Không phải mỗi hệ thống sản xuất đều sử dụng toàn bộ năm tầng. Bittensor sử dụng tầng 1, 2, phần sử dụng tầng 3, 4, không sử dụng tầng 5.

### Bittensor、Fetch.ai、Gonka: Thực tế hoạt động của thứ gì đó

**Bittensor（TAO）。**Các mạng phụ là một nhiệm vụ đặc biệt ([[language modeling]],[[image generation]],[[prediction]])  Các công ty khai thác  gửi các sản phẩm mô hình  Các nhà xác minh về thứ tự của chúng; phân phối điểm số dựa trên cổ phần  Mỗi mạng phụ có phương pháp đánh giá riêng của mình 

**Fetch.ai / ASI Alliance。**ASI-1 Mini LLM 运行在 Fetch.ai's网络上; người dùng sử dụng token FET 支付推断 费用──这里代理-as-peers的故事更强:Fetch 上一个代理可以调用另一个代理 完成任务,并使用 FET 付款──

**Gonka。**Transformer proof-of-work:work là các bài đi trước của transformer.

截至 2026 年 4 月, đây là những thứ ba là cấp độ sản xuất ⋅ 回报 phân phối khác nhau ⋅ Bittensor ⋅ 根据子网验证者的相对质量奖励;Fetch ⋅ 根据付费用户测量的实用性奖励;Gonka ⋅ 奖励可验证的推断工作──

### Thu nhập tín dụng giá trị Shapley

Ba đại lý hợp tác hoàn thành một nhiệm vụ.

Giá trị Shapley:满足四公理 (tương đương, hiệu quả, tính đối xứng, tính tuyến tính, không) chỉ có một khoản tín dụng được phân bổ cho đại lý.`i`- Có thể là:

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

Trong số đó `S_i_O`是排序 `O`Trung `i`之前的代理 集合──实践中:枚举所有变化,记录每个代理 在每个变化中边际贡献,然后取平均──

Đối với N=3 đại lý, có 6 biến đổi. Đối với N=10, có 3,6M, do đó thực tế sẽ đối với các lệnh.

### Sử dụng đấu giá giá giá thứ hai của tổng hợp

Google Research (Mỹ thuật thiết kế cho các mô hình ngôn ngữ lớn) đưa ra đấu giá mã thông báo giá thứ hai để tập hợp các sản phẩm LLM. 设置:N 个代理 各自提出一个完成; mỗi đại lý cho những người được chọn có một giá trị riêng.

Điều này rất quan trọng đối với hệ thống LLM: bạn có thể đưa các nhiệm vụ hoàn thành ra ngoài cho nhiều đại lý với giá khác nhau; đấu giá  chọn giải pháp tốt nhất và thanh toán công bằng, đại lý không có sự khuyến khích sai lầm.

### Tương tự danh tiếng

绑定 DID 声誉分 从已确认贡献中累积──一个简单更新规则:

```
rep(i, t+1) = alpha * rep(i, t) + (1 - alpha) * contribution_quality(i, t)
```

Trong số đó là yếu tố phân rã.`alpha`接近 1―Tuyến tiếng:

- Đối với các quyết định định hướng để đọc chi phí thấp
- 伪造成本高(随时间累积,绑定 DID)
- Có thể được cắt giảm:未经验证的贡献会扣分──

### AAMAS 2025 để tập trung LAMAS

LaMAS  đề xuất(AAMAS 2025) kết hợp:DID danh tính, quy định tín dụng giá trị Shapley và một cơ chế đấu giá đơn giản.

### Cơ chế kinh tế sẽ sụp đổ ở đâu

- **Price oracle manipulation。**Nếu chức năng tín dụng có thể được điều khiển, các đại lý sẽ điều khiển nó.
- **Sybil attacks。**Một nhà khai thác  khởi động các đại lý giả để nâng cao đóng góp của mình;; DID sẽ làm giảm nhưng không thể ngăn chặn hành vi này; phương tiện giảm là chi phí danh tiếng để giả mạo;;
- **Verification cost。**Sự công bằng của việc gán tín dụng phụ thuộc vào người xác minh. Nếu xác minh 便宜 (LLC nhỏ), nó có thể được điều khiển; nếu tốn kém (đơn vị nhân bản), hệ thống không thể mở rộng.
- **Regulatory overhang。**Các nền kinh tế đại lý và quản lý tài chính tương tác.

### 什么时候 đại lý kinh tế có ý nghĩa

- **具有异构 operators 的开放网络。**Không có một đội ngũ nào kiểm soát tất cả các đại lý.
- **可验证输出。**Không xác minh, chỉ là đoán.
- **Long-horizon workflows。**Một nhiệm vụ không thể được hưởng lợi từ sự tích lũy danh tiếng.
- **Tokenized payments 在你的司法辖区合法可行。**

Trong hệ thống doanh nghiệp đóng kín, cơ chế kinh tế sẽ giúp cho việc phân phối đơn giản hơn (những nhà quản lý phân phối công việc, các métrics là nội bộ)


```figure
swarm-auction
```

##  xây dựng nó
`code/main.py`实现:

- `shapley(value_fn, agents)` 通过枚举为小 N 精确计算 Shapley。
- `second_price_auction(bids)` 真实机制; người chiến thắng 支付 thứ hai cao nhất。
- `Reputation` 绑定 DID、带 tăng trưởng suy thoái và cắt giảm danh tiếng.
- Demo 1: ba đại lý 协作, chính xác Shapley 归因信用.
- Demo 2: 5 đại lý cho một vị trí nhiệm vụ  giá xuất khẩu  giá bán đấu giá thứ hai  chọn người chiến thắng + thanh toán
- Demo 3:100 轮任务 phân phối cho các đại lý có cấu trúc khác nhau; rep-weighted routing 优于随机――

运行:

```
python3 code/main.py
```

预期输出: giá trị Shapley của mỗi đại lý; hiển thị kết quả đấu giá của sự cân bằng giá giá đúng; hiển thị sự nóng lên  sau khi rep-weighted định tuyến 相比随机 有 10-20% tăng chất lượng。

## Sử dụng nó
`outputs/skill-economy-designer.md`设计一个最小代理经济:identity layer 选择、信用归属机制、支付机制、声誉规则──

## 交付 nó
Trong năm 2026 vận hành kinh tế đại lý:

- **从 reputation 开始，而不是 tokens。**Nhận thức danh tiếng  đạt được chi phí thấp, độc lập có giá trị; token sẽ tăng sự phức tạp về pháp lý và kinh tế.
- **奖励前先验证。**Đừng phân bổ tín dụng trong trường hợp không có kiểm tra độc lập.
- **使用 Shapley-sample，而不是 Shapley-exact。**采样 100-1000 个订单; 精确枚举无法扩展──
- **限制 decay factor，并设置 reputation floor。**无界衰退会抹去合法贡献者;过慢衰退会奖励过时的高代表代理――
- **以 adversarial 方式审计机制。**Trong các kịch bản đội đỏ, mỗi cơ chế đều có lý thuyết trò chơi; bạn phải tìm ra lỗ hổng, thay vì tìm ra kẻ tấn công.

## 练习
1. 运行 `code/main.py` xác nhận giá trị của Shapley 之和等于总值 (tương tự của hiệu quả)  sửa đổi hàm giá trị; phân bổ của Shapley có thay đổi theo hướng dự kiến không?
2. 实现 Shapley *sampling*(在 K 个命令上蒙特卡罗) ――K 如何影响近似精度?与 N=4 的精确结果比较──
3. Trong đấu giá trước thực hiện một liên minh hình thành 步骤: đại lý có thể hợp tác thành một nhóm và không như một đơn vị xuất giá.
4. 阅读 Google Research's Mechanism-Design 文章;; tìm ra một giả thuyết rằng khi bị vi phạm sẽ phá hủy sự thật;; Trong trường hợp LLM, chế độ thất bại này là gì?
5. 阅读 AAMAS 2025 去中心化 LaMAS 论文―― 在一个合成任务上上为10代理 实现其中的Shapley 步骤――精确计算 需要多长时间?用100次绘图采样能有多接近?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| DePIN | “Decentralized physical infrastructure” | Token-incentivized compute/storage/bandwidth。Bittensor、Akash、Render。 |
| DID | “Decentralized identifier” | 用于 portable IDs 的 W3C spec。Agent reputation 绑定到 DID，而不是平台。 |
| ERC-4337 | “Account abstraction” | 可以 sponsor gas 的 contract accounts，从而支持 agent payments。 |
| Shapley value | “Fair credit attribution” | 满足 efficiency、symmetry、linearity、null 的唯一 allocation。 |
| Second-price auction | “Vickrey auction” | 真实机制：winner 支付 second-highest bid。与 monotone aggregation 兼容。 |
| Reputation capital | “Accumulated quality score” | 来自已确认贡献、绑定 DID 的 score；会随时间 decay。 |
| Agentic DAO | “Agents + humans govern” | 把 agent voters 作为 first-class、投票权绑定 reputation 的 DAO。 |
| TAO / FET / GPU credits | “Token denominations” | Bittensor TAO、Fetch.ai FET、各种 DePIN tokens。 |

## 延伸阅读
- [The Agent Economy](https://arxiv.org/abs/2602.14219) 2026 năm về 5 tầng đại lý- kinh tế xếp hàng của tổng quan
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/)Thầu đấu giá mã hóa của sự tổng hợp đơn giản
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) Nhận tín dụng giá trị Shapley
- [Bittensor TAO documentation](https://docs.bittensor.com/) cấu trúc hạ mạng và phân phối phần thưởng
- [Fetch.ai / ASI Alliance](https://fetch.ai/) ASI-1 Mini LLM và FET token
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/) Cơ sở nhận dạng
