# 部署指南

## 数据库配置

### 切换到远端数据库

1. **获取远端数据库连接信息**

访问 Supabase 控制台：
```
https://supabase.com/dashboard/project/eqijmsiimuotkpevpwgv
```

进入 **Settings** → **API**，复制以下信息：
- **Project URL**（例如：`https://eqijmsiimuotkpevpwgv.supabase.co`）
- **anon/public key**

2. **更新 `.env.local` 文件**

```bash
# 将本地数据库配置替换为远端配置
VITE_SUPABASE_URL=https://eqijmsiimuotkpevpwgv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **重启开发服务器**

```bash
pnpm dev
```

## AI 模型配置

### 配置 Edge Function 环境变量

AI 模型配置需要在 **Supabase Edge Function** 中设置，而不是前端环境变量。

#### 方式 1：通过 Supabase Dashboard（推荐）

1. 访问 https://supabase.com/dashboard/project/eqijmsiimuotkpevpwgv/functions
2. 选择 `chat` 函数
3. 进入 **Secrets** 标签
4. 添加以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `AI_API_KEY` | AI API 密钥（必填） | `sk-xxx...` |
| `AI_GATEWAY_URL` | API 端点（可选） | `https://api.openai.com/v1/chat/completions` |
| `AI_MODEL` | 模型名称（可选） | `gpt-4` 或 `gpt-3.5-turbo` |

**注意**：
- 如果不设置 `AI_GATEWAY_URL`，默认使用 Lovable Gateway
- 如果不设置 `AI_MODEL`，默认使用 `google/gemini-2.5-flash`
- 保留 `LOVABLE_API_KEY` 可向后兼容（会自动使用它作为 `AI_API_KEY`）

#### 方式 2：通过 Supabase CLI

```bash
# 设置 AI API Key
supabase secrets set AI_API_KEY=sk-xxx...

# 设置 Gateway URL（可选）
supabase secrets set AI_GATEWAY_URL=https://api.openai.com/v1/chat/completions

# 设置模型名称（可选）
supabase secrets set AI_MODEL=gpt-4

# 查看已设置的 secrets
supabase secrets list
```

### 支持的 AI 提供商

#### 1. OpenAI

```bash
AI_API_KEY=sk-xxx...
AI_GATEWAY_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4  # 或 gpt-3.5-turbo
```

#### 2. Anthropic Claude

```bash
AI_API_KEY=sk-ant-xxx...
AI_GATEWAY_URL=https://api.anthropic.com/v1/messages
AI_MODEL=claude-3-5-sonnet-20241022
```

#### 3. Lovable Gateway（默认）

```bash
AI_API_KEY=your_lovable_key
# 无需设置 AI_GATEWAY_URL 和 AI_MODEL，使用默认值
```

#### 4. 自定义 OpenAI 兼容端点

```bash
AI_API_KEY=your_custom_key
AI_GATEWAY_URL=https://your-custom-endpoint.com/v1/chat/completions
AI_MODEL=your-model-name
```

### 部署 Edge Function

修改配置后需要重新部署：

```bash
# 部署 chat 函数
supabase functions deploy chat

# 查看部署日志
supabase functions logs chat
```

## 本地开发与远端切换

### 使用本地数据库

```bash
# 启动本地 Supabase
supabase start

# .env.local 配置
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### 使用远端数据库

```bash
# .env.local 配置
VITE_SUPABASE_URL=https://eqijmsiimuotkpevpwgv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<从控制台获取>
```

## 常见问题

### Q: Edge Function 报错 "AI_API_KEY is not configured"

**A**: 需要在 Supabase Dashboard 的 Edge Functions Secrets 中配置，不是 `.env.local`

### Q: 如何验证配置是否生效？

**A**: 查看 Edge Function 日志：
```bash
supabase functions logs chat --tail
```

日志会显示：`Processing chat request with agent: xxx, model: gpt-4, messages: 3`

### Q: 可以在前端动态切换模型吗？

**A**: 当前版本不支持。模型配置在 Edge Function 中，需要重新部署才能更改。如需动态切换，请参考"方案 C：数据库配置"。

### Q: 支持流式响应吗？

**A**: 是的，所有配置都支持流式响应（SSE）。

## 项目会话数据隔离

项目会话数据通过以下机制确保隔离：

1. **数据库层**：`messages` 表的 `project_id` 字段
2. **API 层**：查询时强制过滤 `.eq("project_id", projectId)`
3. **前端层**：多重验证，防止跨项目数据污染
4. **切换清理**：切换项目时自动清空缓存

相关代码：
- `src/hooks/useProjects.ts` - 消息管理与隔离
- `src/components/curve/ChatArea.tsx` - 消息过滤与渲染



