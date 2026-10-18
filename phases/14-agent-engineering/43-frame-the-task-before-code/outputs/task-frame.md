<a id="task-frame-prevent-duplicate-email-addresses-during-signup"></a>

# 任务框架：防止注册时使用重复邮箱地址

状态：READY

<a id="repository-facts"></a>

## 仓库事实
- 账户写入使用 AccountStore (`app/accounts.py:18`)
- 重复账户错误使用状态码 409 (`tests/test_accounts.py:44`)

<a id="allowed-paths"></a>

## 允许修改的路径
- `app/accounts.py`
- `tests/test_accounts.py`

<a id="forbidden-paths"></a>

## 禁止修改的路径
- `migrations/**`
- `deploy/**`

<a id="acceptance-evidence"></a>

## 验收证据
- `python3 -m unittest tests.test_accounts`

<a id="unknowns"></a>

## 待确认事项
- 邮箱地址比较是否忽略大小写
