# क्लाउड एजेंट एसडीकेःसुबगेंट्स व सेशन स्टोर

> क्लाउड एजेंट एसडीके क्लाउड कोड उपयोग का भंडारण है।

**Type:** 学习 + 构建
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 分钟

## 学习目标
- 解释 एंथ्रोपिक क्लाइंट एसडीके(कच्चा एपीआई) और क्लाउड एजेंट एसडीके(हार्नेस आकार) के बीच अंतर
- 描述 उप-उपयोग: समानांतरता एवं संदर्भ अलगाव,以及何时使用它们──
- Python SDK के सत्र स्टोर सतह को बताएं`append`,`load`,`list_sessions`,`delete`,`list_subkeys`) तथा `--session-mirror`का प्रभाव
- 实现 एक stdlib हर्नस, जिसमें अंतर्निहित उपकरण शामिल हैं 带隔离背景的 subagent spawning、lifecycle hooks 和 सत्र स्टोर──

## 问题
कच्चे एलएलएम एपीआई केवल आपको एक बार फिर से यात्रा प्रदान करता है। उत्पादन एजेंट  उपकरण निष्पादन की आवश्यकता है। MCP सर्वर, जीवनचक्र हुक, उप-बॉगिंग, सत्र दृढ़ता, निशान प्रसार। क्लाउड एजेंट एसडीके इस प्रकार के रूप में एक पुस्तकालय के रूप में प्रदान करेगा, अर्थात् क्लाउड कोड उपयोग के एक ही हर्न, कस्टम एजेंटों के लिए उजागर उपयोग।

## 概念
### क्लाइंट एसडीके बनाम एजेंट एसडीके

- **Client SDK (`anthropic`).**कच्चे संदेश एपीआई──आप स्वयं जिम्मेदार लूप、 उपकरण 和 राज्य──
- **Agent SDK (`claude-agent-sdk`).**बिल्ट-इन उपकरण निष्पादन, MCP कनेक्शन, हुक, उप-सब्गेन्ट जड़ना, सत्र स्टोर, या यह भी क्लाउड कोड लूप के रूप में उपलब्ध है।

### अंतर्निहित उपकरण

SDK 开箱附附10+ उपकरण:फ़ाइल रीड/राइट,शेल,ग्रेप,ग्लोब,वेब फ़्रेच आदि।

### उप-समुद्रण

मानव विज्ञान ने दो उपयोगों को दर्ज किया हैः

1. **Parallelization.**并发运行独立工作── इन 20 मॉड्यूलों में से प्रत्येक के लिए परीक्षण फ़ाइल खोजें是 20 समानांतर उप-कार्य──
2. **Context isolation.**उपनिवेश अपने संदर्भ विंडो का उपयोग करते हैं; केवल परिणाम वापस ऑर्केस्ट्रेटर को लौटते हैं।

पायथन एसडीके के हालिया नए आदान-प्रदानः`list_subagents()``get_subagent_messages()`, उप-सब्जेक्ट प्रतिलेखन पढ़ने के लिए

### सत्र स्टोर

टाइपस्क्रिप्ट के साथ प्रोटोकॉल समानताः

- `append(session_id, message)` 添加一个转
- `load(session_id)`  बातचीत को पुनर्स्थापित करना
- `list_sessions()` 枚举──
- `delete(session_id)` 带有对 subagent सत्रों का एक झटका
- `list_subkeys(session_id)` 列出 सुबगेंट कुंजी──

`--session-mirror`(CLI ध्वज) ट्रांसक्रिप्ट स्ट्रीमिंग में होगा  बाहर फ़ाइलों में अपने दर्पण, डिबग करने के लिए आसान है

### हुक

आप पंजीकृत कर सकते हैं जीवनचक्र हुकः

- `PreToolUse`,`PostToolUse` गेट या ऑडिट टूल कॉल
- `SessionStart`,`SessionEnd` स्थापित और तोड़ना
- `UserPromptSubmit`                                                                                                                                                                                                                                                              
- `PreCompact` 在 संदर्भ संपीड़न 之前运行。
- `Stop` एजेंट बाहर निकलना 时 सफाई
- `Notification` साइड-चैनल अलर्ट्स。

हुक कार्यप्रवाह के लिए अनुकूल हैं (Phase 14 पाठ्यक्रम संदर्भ) तथा इसी तरह के सिस्टम के साथ क्रॉस-कटिंग व्यवहार का तरीका है।

### W3C ट्रैक संदर्भ

调用方上活跃的OTel spans 会通过W3C ट्रेस संदर्भ हेडर 传播到CLI उपप्रक्रिया──整个多进程 ट्रेस 会在您的后台中显示为一个标签──

### क्लाउड ने एजेंटों का प्रबंधन किया

होस्ट किया गया 替代方案(beta header `managed-agents-2026-04-01`)―लंबे समय तक चल रहे असिनक कार्य―बनाया गया शीघ्र कैशिंग―बनाया गया संपीड़न―बनाया गया नियंत्रण 换取 प्रबंधित बुनियादी ढांचा―

### यह पैटर्न आसानी से बाहर आ जाता है

- **Subagent over-spawn.**100  छोटे कार्यों से 100  उप-केंद्र उत्पन्न होते हैं।
- **Hook creep.**प्रत्येक टीम में हुक जोड़ने का समय होता है।
- **Session bloat.**सत्र 持续累积; आकार 增长──使用 `list_sessions`+ समाप्ति नीति


```figure
ae-subagent-isolation
```

##  इसे निर्माण
`code/main.py`उपयोग करने के लिए  SDK आकार को लागू करने के लिएः

- `Tool`,`ToolRegistry`, समाहित अंतर्निहित `read_file`,`write_file`,`list_dir`
- `Subagent` निजी संदर्भ आंतरिक रन  वापसी परिणामों
- `SessionStore` जोड़ें, लोड, सूची, हटाएँ, सूची_उप कुंजी
- `Hooks` `pre_tool_use`,`post_tool_use`,`session_start`,`session_end`
- एक डेमोः मुख्य एजेंट समानांतर 3 个 उप-उपयोगकर्ता उत्पन्न करते हैं, प्रत्येक अलग-अलग), परिणामों को संकलित करते हैं,并持续 सत्र──

运行:

```
python3 code/main.py
```

Trace 会 प्रदर्शित उप-संदर्भ अलगाव(ऑर्केस्ट्रेटर संदर्भ आकार 保持 सीमांकित)  हुक निष्पादन 和 सत्र निरंतरता。

## इसका उपयोग करें
- **Claude Agent SDK**क्लाउड कोड हर्नर आकार की इच्छा के लिए क्लाउड-पहले उत्पादों
- **Claude Managed Agents**उपयोग किया गया है लंबे समय से चल रहे अतुल्यकालिक काम को होस्ट किया गया है
- **OpenAI Agents SDK**(पाठ 16) ओपनएआई-प्रथम समकक्षों के लिए प्रयोग किया जाता है
- **LangGraph + custom tools**यदि आप ग्राफ के आकार की राज्य मशीन चाहते हैं

## 交付 यह
`outputs/skill-claude-agent-scaffold.md`एक क्लाउड एजेंट एसडीके ऐप, जिसमें उप-बॉगेंट, हुक, सत्र स्टोर, एमसीपी सर्वर संलग्नक और डब्ल्यू 3 सी ट्रैस प्रसार शामिल हैं।

## अभ्यास
1. 添加一个子弹器,把20 个任务批成每组5个平行子弹器──衡量乐队员的背景大小与每任务的对比──
2. 实现一个 `PreToolUse`हुक,对 `write_file`कॉल  करने के लिए दर-सीमा ((( प्रत्येक सत्र प्रत्येक मिनट 5 बार)
3. 连接 `list_subkeys`एक सूबागेंट पेड़ से संक्रमित होना. गहरे घोंसले लगने लगते हैं.
4. इस खिलौना पोर्ट को वास्तविक करने के लिए `claude-agent-sdk`पायथन पैकेज---उपकरण पंजीकरण होगा क्या परिवर्तन होगा?
5. 阅读क्लॉड प्रबंधित एजेंट डॉस──你什么时候会自主主办的转换到管理的转换?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent SDK | “Claude Code as a library” | Harness shape：tools、MCP、hooks、subagents、session store |
| Subagent | “Child agent” | Separate context、own budget；results bubble up |
| Session store | “Conversation DB” | Persist、load、list、delete turns，并带 subagent cascade |
| Hook | “Lifecycle callback” | Pre/post tool、session、prompt submit、compact、stop |
| W3C trace context | “Cross-process trace” | Parent span propagates into CLI subprocess |
| Managed Agents | “Hosted harness” | Anthropic-hosted long-running async work |
| `--session-mirror` | “Transcript mirror” | 在 session turns streaming 时将它们写入外部文件 |
| MCP server | “Tool surface” | 附加到 agent 的外部 tool/resource source |

## 延伸阅读
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) क्लाउड कोड का भंडारण
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) 生产模式
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) होस्ट किया गया 替代方案
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) समकक्ष
