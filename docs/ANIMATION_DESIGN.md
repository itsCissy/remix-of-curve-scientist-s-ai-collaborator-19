# 🎬 AI 会话流交互动效设计文档

> 版本：1.0.0  
> 更新日期：2026-01-08  
> 设计师：AI 动效设计团队

---

## 📋 概述

本文档描述了 Curve AI 对话平台的会话流交互动效系统设计。该系统采用简洁、优雅的动效设计，为用户提供清晰的状态反馈，同时保持界面的整洁和专业感。

### 设计原则

1. **Less is More** - 每个动效都有明确目的，避免过度装饰
2. **渐进式反馈** - 只在关键时刻给予视觉提示
3. **性能优先** - 仅使用 CSS 动画，避免 JS 动画开销
4. **一致性** - 统一的动效曲线和时长

---

## 🎯 动效系统架构

### 会话流程

```
[用户发送] → [思考阶段] → [推理阶段] → [工具调用] → [内容生成] → [完成呈现]
     ↓            ↓            ↓            ↓            ↓            ↓
   消息入场     脉冲闪烁     折叠展开     依次淡入     流式光标     淡入完成
```

---

## 📝 各阶段动效详解

### 1. 消息入场动画 (`animate-message-enter`)

**适用场景：** 用户消息和 AI 消息进入视图时

**CSS 定义：**
```css
@keyframes message-enter {
  0% {
    opacity: 0;
    transform: translateY(12px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-message-enter {
  animation: message-enter 0.35s ease-out forwards;
}
```

**参数：**
- 时长：350ms
- 缓动：ease-out
- 位移：12px 向上

---

### 2. 思考阶段动效 (`animate-pulse-soft`)

**适用场景：** AI 正在处理请求，尚未产生任何内容

**视觉效果：**
- 脑图标轻微脉冲呼吸
- "Thinking..." 文字使用 ShinyText 渐变闪烁

**CSS 定义：**
```css
@keyframes pulse-soft {
  0%, 100% { 
    opacity: 0.6;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.05);
  }
}

.animate-pulse-soft {
  animation: pulse-soft 1.5s ease-in-out infinite;
}
```

**参数：**
- 时长：1.5s
- 缓动：ease-in-out
- 循环：infinite
- 透明度：0.6 ↔ 1
- 缩放：1 ↔ 1.05

---

### 3. 流式光标 (`streaming-cursor`)

**适用场景：** AI 正在生成内容，实时显示打字效果

**视觉效果：**
- 品牌蓝色竖线光标（▎）
- 0.8s 周期闪烁

**CSS 定义：**
```css
@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.streaming-cursor::after {
  content: '▎';
  display: inline-block;
  animation: cursor-blink 0.8s step-end infinite;
  color: #123aff;
  margin-left: 1px;
  font-weight: 400;
}
```

**参数：**
- 时长：0.8s
- 缓动：step-end（阶跃函数，实现闪烁）
- 颜色：#123aff（品牌蓝）

---

### 4. 工具标签动画 (`tool-tag-stagger`)

**适用场景：** 显示 AI 调用的工具列表

**视觉效果：**
- 多个工具标签依次淡入
- 每个标签延迟 100ms

**CSS 定义：**
```css
@keyframes tool-fade-in {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.tool-tag-stagger {
  opacity: 0;
  animation: tool-fade-in 0.3s ease-out forwards;
}

.tool-tag-stagger:nth-child(1) { animation-delay: 0ms; }
.tool-tag-stagger:nth-child(2) { animation-delay: 100ms; }
.tool-tag-stagger:nth-child(3) { animation-delay: 200ms; }
/* ... 更多子元素 */
```

**参数：**
- 单个时长：300ms
- 缓动：ease-out
- 延迟间隔：100ms
- 位移：4px 向上

---

### 5. 内容区块渐显 (`animate-content-reveal`)

**适用场景：** 推理内容、结论、分子数据等区块显示

**CSS 定义：**
```css
@keyframes content-reveal {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-content-reveal {
  animation: content-reveal 0.4s ease-out forwards;
}
```

**参数：**
- 时长：400ms
- 缓动：ease-out
- 位移：8px 向上

---

### 6. 推理区域折叠 (`reasoning-collapse`)

**适用场景：** 推理过程的展开/折叠交互

**CSS 定义：**
```css
.reasoning-collapse {
  overflow: hidden;
  transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
}

.reasoning-collapse.collapsed {
  max-height: 0;
  opacity: 0;
}

.reasoning-collapse.expanded {
  max-height: 500px;
  opacity: 1;
}
```

**参数：**
- 过渡时长：300ms
- 缓动：ease-out
- 最大高度：500px（展开时）

---

### 7. 操作按钮淡入 (`animate-actions-fade-in`)

**适用场景：** 消息完成后，底部操作按钮（复制、分支、技能）显示

**CSS 定义：**
```css
@keyframes actions-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.animate-actions-fade-in {
  animation: actions-fade-in 0.3s ease-out 0.2s forwards;
  opacity: 0;
}
```

**参数：**
- 时长：300ms
- 缓动：ease-out
- 延迟：200ms（等待内容渲染完成）

---

### 8. 完成发光效果 (`animate-completion-glow`)

**适用场景：** AI 消息生成完成时的短暂视觉反馈

**CSS 定义：**
```css
@keyframes completion-glow {
  0% {
    box-shadow: 0 0 0 0 rgba(18, 58, 255, 0.1);
  }
  50% {
    box-shadow: 0 0 8px 2px rgba(18, 58, 255, 0.08);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(18, 58, 255, 0);
  }
}

.animate-completion-glow {
  animation: completion-glow 0.6s ease-out forwards;
}
```

**参数：**
- 时长：600ms
- 缓动：ease-out
- 发光颜色：品牌蓝（低透明度）

---

## 🧩 组件映射

| 组件 | 使用的动效 |
|------|------------|
| `UserMessage` | `animate-message-enter` |
| `AgentMessage` | `animate-message-enter` |
| `ThinkingLoader` | `animate-pulse-soft`, `ShinyText` |
| `ReasoningSection` | `animate-content-reveal`, `reasoning-collapse` |
| `ToolsSection` | `tool-tag-stagger` |
| `StructuredMessage` | `streaming-cursor`, `animate-completion-glow`, `animate-actions-fade-in` |
| `MoleculeResultTabs` | `animate-content-reveal` |
| `FileViewer` | `animate-content-reveal` |

---

## 🎨 设计决策记录

### 为什么选择简洁设计？

1. **科研场景专业性** - 用户是科研人员，需要专注于内容而非动效
2. **性能考量** - 长对话场景下，过多动效会影响滚动性能
3. **可访问性** - 简洁动效对减少运动敏感用户友好

### 为什么使用 CSS 动画而非 JS 动画？

1. **性能** - CSS 动画由浏览器 GPU 加速，60fps 保障
2. **简单性** - 无需引入额外动画库
3. **可维护性** - 动效定义集中在 CSS 文件中

### 光标设计选择

选择 `▎` 而非 `|` 的原因：
- 更粗的光标在流式文本中更易识别
- 与 VS Code / Cursor 等开发工具的光标风格一致

---

## 📁 文件变更清单

| 文件路径 | 变更类型 | 说明 |
|----------|----------|------|
| `src/index.css` | 新增 | 添加动效系统 CSS |
| `src/components/curve/ThinkingLoader.tsx` | 修改 | 添加脉冲效果和内联模式 |
| `src/components/curve/StructuredMessage.tsx` | 修改 | 添加流式光标和完成动效 |
| `src/components/curve/AgentMessage.tsx` | 修改 | 更换入场动画类名 |
| `src/components/curve/UserMessage.tsx` | 修改 | 更换入场动画类名 |

---

## 🔧 后续优化建议

1. **暗色模式适配** - 当前动效颜色基于亮色模式，可添加暗色模式变体
2. **减少运动偏好** - 支持 `prefers-reduced-motion` 媒体查询
3. **性能监控** - 添加动画性能指标收集
4. **A/B 测试** - 对比不同动效方案的用户体验数据

---

## ✅ 验收标准

- [ ] 用户消息发送后有入场动画
- [ ] AI 思考时显示脉冲效果
- [ ] 流式生成时显示闪烁光标
- [ ] 工具标签依次淡入
- [ ] 推理区域可折叠展开
- [ ] 消息完成后操作按钮淡入
- [ ] 所有动效流畅无卡顿（60fps）

