# 安全  秘密、API密钥 轮换、审计日志、保护

> 通过集中式库存 (HashiCorp Vault、AWS Secrets Manager、Azure Key Vault) 消除秘密 蔓延──绝不要把凭证存放在配置文件、VCS 中的 env文件、表格里──优先使用IAM角色,而不是静态密钥;CI/CD 使用OIDC──AI-gateway模式是2026年关系解决方案:应用程序 →网关服务器,网关服务器 在行驶时从库存 拉证券──在库中轮换后,所有应用程序将在几分钟内获取更新,也不需要部署,也需要在 Slack 里有新承诺──使用轮换政策 ≤90天;每次都只使用TrumpleHog / GBA / GBA / GPC 扫描,VIP 测试,GBA / GBA 网络的使用者:GBA 网络密码,GBA / GBA 网络密码,GBA 网络密码,GBA / GBA 网络密码,GBA 网络密码,GBA / GBA 网络密码,GBA 密码,GBA / GBA 网络密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA 密码,GBA `api.openai.com`,我知道.`api.anthropic.com`通过被攻击的CI/CD凭证泄露了数千个客户部署的环境.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## 学习目标
- 列举四种秘密管理反模式,并提出它们的替代方案.
- 解释人工智能门口从口拉出模式为什么是2026年生产标准
- 实现一个带一致的标记化 (同值 →同位持有者) 的 PII清除器,让语义得以保留.
- 描述2026年维尔塞尔供应链事件,以及对CI/CD认证卫生的教训.

## 问题
一名实习生提交了带着API密钥的`.env`它们很快删除了它. 但这些键已经进入了 Git 历史. 吉特卫视扫描已经捕获了它,而你的旋转过程是在 Slack 通知团队,更新了40个配置文件,重新部署所有服务.

另外,用户提示包含了我的SSN是123-45-6789. 提示被发送到OpenAI. 你有BAA,但内部政策要求在转发前屏蔽PII.

另外,您的EKS集群中LLM组可以访问任何互联网主机.有人通过DNS搜索将数据将运输到攻击者控制的域.

必须处理这些类型的向量――库存支持的凭证――PII扫除――网络输出过――审计日志――

## 概念
### 集中式保险箱 + IAM 角色拉

**Vault**据了解,在此次的发布中,

**IAM role**通过其IAM身份进行认证,而不是静态钥匙.

**The AI-gateway pattern**通过门口,在请求时从库存中拉取.`OPENAI_API_KEY`在库中轮换; 下一次请求得到新钥匙.

### 转换政策 ≤90天

所有的API密钥,库存根代币,CI/CD凭证,尽可能自动旋转,手动旋转,需要记录和跟踪.

### 秘密扫描

- **TruffleHog**对对行为做回应+体检测――
- **GitGuardian**商业,准确率高――
- **Gitleaks** OSS,在CI中运行.

每次都运行.如果检测到新的秘密,就阻止公关.

### 零可靠的姿势

- 所有账户必须启用MFA.
- 通过SAML/OIDC使用SSO──
- 基于角色的RBAC或基于属性的ABAC用于细粒度的访问.
- 短暂的代币,而不是天.
- 设备姿势  仅允许启动磁盘加密的体型设备──

### 清洗PII/PHI

在快速离开你的 infra 之前:

1. 实体认可 (空间NER、Presidio、商业)
2. 屏蔽匹配到的实体:`"My SSN is 123-45-6789"`其他`"My SSN is [SSN_TOKEN_A3F]"`,我知道.
3. 连贯的标记化 (Mesh方法):相同的值 映射到相同的位置持有者,让LLM保留关系――
4. 可选:对LLM反应做反向映射

静态regex过器能捕获基本模式;NER能捕获更多──两者都用──

### 输入+输出防护

输入:阻止已知 jailbreaks、禁止主题;按用户做速度限制──

输出:用regex scrub 泄露的秘密(API关键模式、拒绝文本 中的电子邮件模式),用分类器检测政策违规性──

### 网络出口白名单

专业的子网:
- 清单:`api.openai.com`,我知道.`api.anthropic.com`、向量DB终点、口终点──
- 其他一切:滴滴.
- 通过允许的解决器,避免DNS道的输出.

### 审计日志

每次LLM电话的不可变日志,包含:
- 时间标签.
- 用户/租户──
- 为了隐私,不记录原始提示)
- 模型+版本――
- 标志数量.
- 成本
- 答案.
- 任何护旅行.

根据监管要求保留(SOC2 1年,HIPAA6年)

### 2026年,弗塞尔事件

供应链攻击:被攻破的CI/CD凭证 泄露了数千个客户部署的环境.

### 你应该记住的数字

- 转换政策:≤90天──
- 鱼鱼/吉特卫报/吉特利克斯
- 据报道,该公司已向中国政府发出了有关信息.
- 审计日志保存:SOC2 = 1年,HIPAA = 6年──


```figure
i4-vault-rotation
```

## 使用它
`code/main.py`实现一个具有一致的标记化玩具 PII 清洗器,以及一个仅附加的审计日志.

## 交付它
本课生成 `outputs/skill-llm-security-plan.md`根据监管范围和当前状态,规划库迁移,缩,进入,审计日志.

## 练习
1. 运行`code/main.py`〔发送两个引用同一SSN的提示〕确认两者获得相同的位置持有人──
2. 为调用OpenAI+人类+网络的vLLM-on-EKS部署 设计网络退出政策.
3. 你在 Git 历史中发现一个关键 (? 2 年前的) ⋅正确响应是什么:旋转关键,缩历史,还是两者都做?说明理由──
4. 你的审计日志每天增长10GB──设计保留层次──热30d、热12个月、冷6个年)──
5. 论证反向标记化 (把真实值替换回 LLM响应) 是否值得其复杂性,还是让位主可见更好.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Vault | "secrets store" | 集中式 credential management service |
| IAM role | "identity-based auth" | app assume 的 role；返回 short-lived creds |
| OIDC for CI/CD | "cloud-issued tokens" | CI 中没有 static keys — 通过 OIDC 建立 identity |
| TruffleHog / GitGuardian / Gitleaks | "secret scanners" | commit-time secret detection |
| RBAC / ABAC | "access control" | Role-based vs attribute-based |
| PII scrubbing | "data masking" | 移除敏感 entities 或对其 tokenization |
| Consistent tokenization | "stable placeholders" | Same value → same token each time |
| Mesh approach | "Mesh tokenization" | 保留语义的 tokenization pattern |
| Egress whitelist | "outbound allowlist" | 只有允许的 domains 可访问 |
| Audit log | "immutable history" | 用于 compliance 的 append-only record |

## 延伸阅读
- [Doppler — Advanced LLM Security](https://www.doppler.com/blog/advanced-llm-security)
- [Portkey — Manage LLM API keys with secret references](https://portkey.ai/blog/secret-references-ai-api-key-management/)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [JumpServer — Secrets Management Best Practices 2026](https://www.jumpserver.com/blog/secret-management-best-practices-2026)
- [Microsoft Presidio](https://github.com/microsoft/presidio) PII 检测和匿名化
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
