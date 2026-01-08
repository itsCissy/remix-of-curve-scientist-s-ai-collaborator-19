# Supabase 配置指南

## 问题说明

刷新页面后历史项目和会话数据丢失的原因：代码配置错误导致使用了浏览器本地 IndexedDB 存储，而不是远程 Supabase 数据库。

## 解决方案

使用 Supabase 远程数据库实现数据持久化，确保数据永久保存且支持多设备同步。

---

## 配置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - **Name**: curve-database（或自定义名称）
   - **Database Password**: 设置强密码（请妥善保管）
   - **Region**: 选择最近的区域（推荐：Northeast Asia (Tokyo)）
5. 等待项目初始化完成（约 2-3 分钟）

### 2. 获取 API 密钥

项目创建完成后：

1. 进入项目仪表板
2. 点击左侧菜单 **Settings** → **API**
3. 复制以下两个值：
   - **Project URL** (例如：`https://xxxxx.supabase.co`)
   - **anon public** 密钥（展开 "Project API keys" 下的 anon key）

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件（已有 `.env.example` 模板）：

```bash
# 复制模板文件
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的 Supabase 信息：

```env
# Supabase 项目 URL
VITE_SUPABASE_URL=https://your-project.supabase.co

# Supabase 公开 API 密钥（anon key）
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

**⚠️ 注意**：
- 不要将 `.env.local` 提交到 Git（已自动忽略）
- 不要分享 service_role key（高危密钥）
- anon key 是公开密钥，可以在前端使用

### 4. 运行数据库迁移

项目已包含数据库迁移脚本（`supabase/migrations/` 目录），执行以下步骤初始化数据库：

#### 方法 A：使用 Supabase CLI（推荐）

```bash
# 1. 安装 Supabase CLI
npm install -g supabase

# 2. 登录 Supabase
supabase login

# 3. 关联项目
supabase link --project-ref your_project_ref

# 4. 执行迁移
supabase db push
```

项目引用（project ref）可以在 Supabase 仪表板的 URL 中找到：
`https://supabase.com/dashboard/project/[your_project_ref]`

#### 方法 B：手动在 SQL Editor 执行

1. 打开 Supabase 仪表板
2. 点击 **SQL Editor**
3. 依次执行 `supabase/migrations/` 目录下的 SQL 文件（按文件名日期顺序）：
   - `20251227082624_remix_migration_from_pg_dump.sql`
   - `20251227083610_bc35b9a5-455e-4ca9-b3f5-253835433759.sql`
   - `20251227085256_9800e312-1a49-4a2a-ba06-fdfc0b54d7f2.sql`
   - `20251228022223_a6589072-f9e9-44bf-8ce8-a14e3c02d21b.sql`

### 5. 启动项目

```bash
# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173`，现在数据会自动保存到 Supabase 云端！

---

## 验证配置

### 测试步骤

1. **创建测试项目**
   - 打开应用，点击左上角 "+" 创建新项目
   - 输入项目名称，选择图标，保存

2. **发送测试消息**
   - 在聊天区域输入任意消息
   - 等待 AI 回复

3. **刷新页面**
   - 按 `Ctrl+R` (Windows/Linux) 或 `Cmd+R` (Mac)
   - **预期结果**：项目和消息依然存在

4. **检查数据库**
   - 打开 Supabase 仪表板
   - 点击 **Table Editor**
   - 查看 `projects` 和 `messages` 表，应该能看到刚才创建的数据

### 常见问题

#### Q: 刷新后还是丢失数据？

**检查清单**：
```bash
# 1. 确认环境变量已加载
# 打开浏览器控制台（F12），查看日志：
# 应该看到 "[Supabase] 使用 远程 Supabase 存储模式"

# 2. 检查 .env.local 文件是否存在且配置正确
cat .env.local

# 3. 重启开发服务器
# 按 Ctrl+C 停止，然后重新运行：
npm run dev
```

#### Q: 显示 "加载项目失败" 错误？

**原因**：API 密钥错误或数据库迁移未执行

**解决方法**：
1. 检查 `.env.local` 中的 URL 和密钥是否正确
2. 打开浏览器控制台（F12）查看详细错误信息
3. 确认数据库迁移已成功执行

#### Q: 能否切换回本地存储？

可以，在 `.env.local` 中添加：

```env
VITE_USE_LOCAL_STORAGE=true
```

**注意**：本地存储的数据仅保存在浏览器，清除缓存会丢失。

---

## 数据库架构

### 核心表结构

```
projects (项目表)
├── id: UUID (主键)
├── name: TEXT (项目名称)
├── icon: TEXT (图标)
├── description: TEXT (描述)
├── author: TEXT (作者)
├── selected_agents: TEXT[] (选中的 Agent)
├── is_active: BOOLEAN (是否激活)
└── created_at, updated_at: TIMESTAMP

messages (消息表)
├── id: UUID (主键)
├── project_id: UUID (外键 → projects.id)
├── role: TEXT ('user' | 'assistant')
├── content: TEXT (消息内容)
├── agent_id: TEXT (Agent ID)
├── branch_id: UUID (分支 ID)
└── created_at: TIMESTAMP

branches (分支表)
├── id: UUID (主键)
├── project_id: UUID (外键 → projects.id)
├── name: TEXT (分支名称)
├── is_main: BOOLEAN (是否主分支)
└── branch_point_message_id: UUID (分支点消息 ID)

... (其他表)
```

---

## 部署到生产环境

### Vercel 部署

1. 在 Vercel 项目设置中添加环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

2. 重新部署项目

### Netlify 部署

1. 在 Netlify 项目设置 → Environment Variables 中添加环境变量
2. 重新部署

---

## 安全建议

1. **不要提交敏感信息**
   - `.env.local` 已自动忽略
   - 不要将密钥硬编码在代码中

2. **启用 RLS（行级安全）**
   - 在 Supabase 仪表板中为每个表启用 RLS
   - 添加适当的访问策略（参考迁移文件）

3. **定期备份数据**
   - Supabase 提供自动备份
   - 可在仪表板中手动导出数据

---

## 技术支持

- **Supabase 文档**: https://supabase.com/docs
- **项目 GitHub**: (你的仓库链接)
- **问题反馈**: (你的 Issue 页面)

---

**配置完成后，你的 Curve 项目将具备完整的数据持久化能力！** 🎉

