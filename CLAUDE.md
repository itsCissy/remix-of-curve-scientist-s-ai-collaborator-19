# CLAUDE.md - AI 开发助手上下文文档

这是一份专为 AI 开发助手准备的项目上下文文档，帮助快速理解 Curve 项目的架构和开发规范。

## 项目概要

**Curve** 是一个面向科研人员的 AI 对话平台，主要用于：
- 药物分子研发辅助（SMILES 解析、分子属性计算）
- 科研文献检索与分析
- 数据分析与可视化
- 通用编程开发支持

技术栈：React 18 + TypeScript + Vite + TailwindCSS + Supabase

## 快速导航

### 入口文件
- `src/main.tsx` - React 应用挂载点
- `src/App.tsx` - 路由配置，全局 Provider 包装
- `src/index.css` - CSS 变量定义，全局样式

### 核心业务逻辑
- `src/components/curve/ChatArea.tsx` - **最重要的组件**，包含对话核心逻辑
- `src/components/curve/Sidebar.tsx` - 项目列表管理
- `src/layouts/MainLayout.tsx` - 页面布局，Smart Folder 面板控制

### 数据层
- `src/hooks/useProjects.ts` - 项目 CRUD + 消息管理
- `src/hooks/useBranches.ts` - 分支管理 + 协作者管理
- `src/hooks/useSmartFolder.ts` - 智能归档（表格/图片提取）
- `src/hooks/useFileAssets.ts` - 文件资产管理

### 工具函数
- `src/lib/agents.ts` - Agent 定义和系统提示词
- `src/lib/messageUtils.ts` - 消息内容解析（结构化标签提取）
- `src/lib/moleculeDataUtils.ts` - 分子数据解析（CSV/Markdown 表格）

### 后端服务
- `supabase/functions/chat/index.ts` - AI 对话边缘函数

## 代码规范

### 命名约定
```typescript
// 组件：PascalCase
export const ChatArea = () => { ... }

// Hook：use 前缀 + camelCase
export const useProjects = () => { ... }

// 工具函数：camelCase
export function parseMessageContent(content: string) { ... }

// 类型/接口：PascalCase
export interface Project { ... }
export type MessageRole = "user" | "assistant";

// 常量：UPPER_SNAKE_CASE
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
```

### 文件组织
```
components/curve/  - 业务组件，按功能命名
components/ui/     - 基础 UI 组件（shadcn/ui）
hooks/             - 自定义 Hooks，一个文件一个主 Hook
lib/               - 纯函数工具，无副作用
contexts/          - React Context
pages/             - 页面组件
layouts/           - 布局组件
```

### 样式规范
```tsx
// 使用 Tailwind + cn() 工具函数
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "variant-classes"
)} />

// 常用颜色类
// 主色: text-[#123aff], bg-[#123aff], hover:bg-[rgba(18,58,255,0.08)]
// 边框: border-border, border-curve-sidebar-border
// 背景: bg-background, bg-[#fafafa], bg-white

// 响应式布局
// 使用 flex + min-w-0 防止溢出
<div className="flex-1 min-w-0 overflow-hidden">
```

## 核心架构详解

### 1. 消息流转

```
用户输入 (ChatInput)
    ↓
ChatArea.handleSend()
    ├─→ 本地状态更新 (乐观更新)
    ├─→ Supabase 数据库插入
    └─→ 调用 Edge Function (streaming)
           ↓
    Edge Function (chat/index.ts)
        ├─→ 获取 Agent 系统提示词
        └─→ 调用 Lovable AI Gateway
               ↓
    SSE 流式响应
        ↓
    ChatArea.upsertAssistant()
        ├─→ 实时更新 UI
        └─→ 完成后保存到数据库
               ↓
    消息解析 (parseMessageContent)
        ├─→ 提取 <reasoning> / <tools> / <conclusion>
        ├─→ 提取文件附件
        └─→ 检测分子数据
               ↓
    渲染 (AgentMessage / StructuredMessage)
```

### 2. 分支系统

```
主线 (is_main: true)
    │
    ├─── Message 1
    ├─── Message 2  ← 分支点 (branch_point_message_id)
    │        │
    │        └───── 分支 A
    │                   ├─── Message A1
    │                   └─── Message A2
    │
    ├─── Message 3
    └─── Message 4
```

分支创建时：
1. 用户点击消息的分支按钮
2. 弹出 CreateBranchDialog
3. 调用 `createBranch(messageId, name, description, collaboratorId)`
4. 自动切换到新分支

### 3. 智能归档

```
消息内容
    ↓
parseMessageContent() → ParsedContent
    ├─→ moleculeData (分子表格)
    └─→ normalContent (普通内容)
           ↓
extractTables() / extractImages()
    ├─→ 检测 <molecule-data> 标签
    ├─→ 检测 Markdown 表格 (| --- |)
    ├─→ 检测 CSV 代码块
    ├─→ 检测图片 URL / Base64
    └─→ 从 SMILES 生成 PubChem 结构图
           ↓
archiveContent() → 更新 SmartFolder 状态
```

### 4. 项目隔离机制

**严格的 project_id 绑定**：
```typescript
// 1. API 请求时绑定
const { data } = await supabase
  .from("messages")
  .select("*")
  .eq("project_id", projectId);  // 后端过滤

// 2. 前端二次过滤
const validMessages = data.filter(m => m.project_id === projectId);

// 3. 实时订阅时过滤
.on("postgres_changes", {
  filter: `project_id=eq.${projectId}`
})

// 4. 渲染前验证
if (currentProjectIdRef.current !== projectId) return;
```

## 常见开发任务

### 添加新 Agent

1. **前端定义** (`src/lib/agents.ts`)：
```typescript
export const AVAILABLE_AGENTS: Agent[] = [
  // ... 现有 agents
  {
    id: "new-agent",
    name: "New Agent",
    description: "描述文字",
    icon: "🔬",
    color: "bg-purple-500",
    systemPrompt: `你是 New Agent，一个专业的...
    
回复格式要求：
- 使用 <reasoning>...</reasoning> 标签包裹推理过程
- 使用 <tools>...</tools> 标签列出调用的工具和知识库
- 使用 <conclusion>...</conclusion> 标签包裹分析结论

可用的工具与知识库：
- 工具1
- 工具2
...`
  }
];
```

2. **后端同步** (`supabase/functions/chat/index.ts`)：
```typescript
const AGENT_PROMPTS: Record<string, string> = {
  // ... 现有 prompts
  "new-agent": `你是 New Agent，...`  // 与前端一致
};
```

### 添加新的消息标签解析

在 `src/lib/messageUtils.ts` 中：
```typescript
export function parseMessageContent(content: string): ParsedContent {
  // ... 现有解析

  // 添加新标签解析
  const customMatch = content.match(/<custom-tag>([\s\S]*?)<\/custom-tag>/);
  if (customMatch) {
    result.customData = customMatch[1].trim();
  }

  // 从 normalContent 中移除
  let normalContent = content
    .replace(/<custom-tag>[\s\S]*?<\/custom-tag>/g, '')
    // ... 其他替换
    .trim();
}
```

### 添加新的数据库表

1. 创建迁移文件 `supabase/migrations/YYYYMMDD_description.sql`
2. 在 `src/integrations/supabase/types.ts` 中添加类型定义
3. 创建对应的 Hook（参考 `useProjects.ts` 模式）

### 样式调整

CSS 变量在 `src/index.css` 的 `:root` 中定义：
```css
:root {
  --primary: 231 100% 55%;  /* #123aff 的 HSL */
  --background: 0 0% 100%;
  --sidebar-bg: 0 0% 96%;
  /* ... */
}
```

Tailwind 扩展在 `tailwind.config.ts` 中：
```typescript
colors: {
  xtalpi: {
    blue: "#123aff",
    "blue-dark": "#1609a0",
    // ...
  }
}
```

## 调试技巧

### 消息相关问题
```typescript
// 在 ChatArea.tsx 中查看消息过滤
console.log("DB messages:", dbMessages);
console.log("Current branch:", currentBranch);
console.log("Filtered messages:", localMessages);
```

### Supabase 查询调试
```typescript
const { data, error } = await supabase
  .from("messages")
  .select("*")
  .eq("project_id", projectId);
  
if (error) console.error("Supabase error:", error);
```

### 流式响应调试
```typescript
// 在 ChatArea.tsx 的 handleSend 中
while (!streamDone) {
  const { done, value } = await reader.read();
  console.log("Chunk received:", decoder.decode(value));
  // ...
}
```

## 性能优化要点

1. **消息列表虚拟化** - 大量消息时考虑使用 react-virtual
2. **分支数据懒加载** - 仅在进入分支树视图时加载统计
3. **图片懒加载** - 分子结构图使用 IntersectionObserver
4. **状态隔离** - 使用 `currentProjectIdRef` 防止跨项目污染

## 注意事项

1. **不要直接修改 `src/components/ui/`** - 这些是 shadcn/ui 组件，通过 CLI 更新
2. **Edge Function 需要单独部署** - 修改后运行 `supabase functions deploy chat`
3. **环境变量** - 敏感信息放在 `.env.local`，不要提交到 Git
4. **TypeScript 严格模式** - 确保类型正确，避免 `any`
5. **分支切换时清理状态** - 参考 `ChatArea.tsx` 中的 `useEffect` 清理逻辑

## 常用路径别名

```typescript
import { Button } from "@/components/ui/button";     // UI 组件
import { useProjects } from "@/hooks/useProjects";   // Hooks
import { parseMessageContent } from "@/lib/messageUtils";  // 工具
import { supabase } from "@/integrations/supabase/client"; // Supabase
import { cn } from "@/lib/utils";  // 类名合并工具
```

## 测试数据

分子数据测试 SMILES：
```
CCO                    # 乙醇
CC(=O)O                # 乙酸
c1ccccc1               # 苯
CC(C)CC1=CC=C(C=C1)C(C)C(=O)O  # 布洛芬
CC(=O)Nc1ccc(O)cc1     # 扑热息痛
```

---

文档更新日期：2024-12

