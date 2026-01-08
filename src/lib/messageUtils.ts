import { detectFileType, FileAttachment } from "@/components/curve/FileViewer";
import { detectMoleculeData, ParsedMoleculeResult } from "./moleculeDataUtils";

export interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  preview?: string;
}

// ============================================================================
// 流式解析状态机类型定义
// ============================================================================

/**
 * 流式解析阶段
 * - idle: 初始状态，等待第一个标签
 * - reasoning: 正在接收 <reasoning> 内容
 * - tools: 正在接收 <tools> 内容
 * - conclusion: 正在接收 <conclusion> 内容
 * - done: 流式结束
 * - error: 发生错误
 */
export type StreamPhase = 'idle' | 'reasoning' | 'tools' | 'conclusion' | 'done' | 'error';

/**
 * 流式解析状态
 * 追踪当前处于哪个语义阶段，以及各区域累积的内容
 */
export interface StreamingState {
  phase: StreamPhase;
  prefixContent: string;      // <reasoning> 之前的内容（通常丢弃）
  reasoningContent: string;   // 思考区累积内容
  toolsContent: string;       // 工具区累积内容（原始文本）
  conclusionContent: string;  // 正文区累积内容
  buffer: string;             // 待处理的残留文本（可能包含不完整标签）
  error?: string;             // 错误信息
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  streamingState?: StreamingState;  // 流式阶段的状态机数据
  files?: FileAttachment[];
  attachments?: MessageAttachment[];
  collaboratorId?: string;
}

export interface ParsedContent {
  reasoning?: string;
  tools?: string[];
  conclusion?: string;
  normalContent: string;
  files?: FileAttachment[];
  moleculeData?: ParsedMoleculeResult;
}

// 辅助函数：清理内容中的嵌套标签
function cleanNestedTags(text: string): string {
  return text
    .replace(/<\/?reasoning>/g, '')
    .replace(/<\/?tools>/g, '')
    .replace(/<\/?conclusion>/g, '')
    .trim();
}

export function parseMessageContent(content: string, isStreaming: boolean = false): ParsedContent {
  const result: ParsedContent = {
    normalContent: content,
  };

  // 流式时使用严格匹配（必须有闭合标签），避免标签跨 chunk 切分问题
  // 非流式时使用宽松匹配（允许缺失闭合标签）
  const tagEndPattern = isStreaming ? '<\\/reasoning>' : '(?:<\\/reasoning>|$)';
  const toolsEndPattern = isStreaming ? '<\\/tools>' : '(?:<\\/tools>|$)';
  const conclusionEndPattern = isStreaming ? '<\\/conclusion>' : '(?:<\\/conclusion>|$)';

  // Extract reasoning
  const reasoningRegex = new RegExp(`<reasoning>([\\s\\S]*?)${tagEndPattern}`);
  const reasoningMatch = content.match(reasoningRegex);
  if (reasoningMatch) {
    // 清理嵌套标签
    result.reasoning = cleanNestedTags(reasoningMatch[1]);
  }

  // Extract tools
  const toolsRegex = new RegExp(`<tools>([\\s\\S]*?)${toolsEndPattern}`);
  const toolsMatch = content.match(toolsRegex);
  if (toolsMatch) {
    // 清理嵌套标签
    const toolsContent = cleanNestedTags(toolsMatch[1]);
    result.tools = toolsContent
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  // Extract conclusion
  const conclusionRegex = new RegExp(`<conclusion>([\\s\\S]*?)${conclusionEndPattern}`);
  const conclusionMatch = content.match(conclusionRegex);
  if (conclusionMatch) {
    // 清理嵌套标签
    result.conclusion = cleanNestedTags(conclusionMatch[1]);
  }

  // Extract files - format: <file name="filename.ext" size="1.2KB">content</file>
  const filesRegex = /<file\s+name="([^"]+)"(?:\s+size="([^"]+)")?(?:\s+url="([^"]+)")?>([^<]*)<\/file>/g;
  let filesMatch;
  const files: FileAttachment[] = [];
  
  while ((filesMatch = filesRegex.exec(content)) !== null) {
    const [, name, size, url, fileContent] = filesMatch;
    files.push({
      name,
      type: detectFileType(name),
      size: size || undefined,
      url: url || undefined,
      content: fileContent?.trim() || undefined,
    });
  }

  if (files.length > 0) {
    result.files = files;
  }

  // Detect molecule data
  const moleculeData = detectMoleculeData(content);
  if (moleculeData) {
    result.moleculeData = moleculeData;
  }

  // Get normal content (remove all tags)
  // 采用激进的方式：先移除标签包裹的内容块，再移除残留的标签文本
  let normalContent = content;
  
  // 第一步：移除完整闭合的标签块（可能嵌套，所以要迭代多次）
  const tagsToRemove = ['reasoning', 'tools', 'conclusion'];
  for (let iteration = 0; iteration < 5; iteration++) {
    const prevLength = normalContent.length;
    
    for (const tag of tagsToRemove) {
      // 移除完整闭合的标签块
      const closedRegex = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'g');
      normalContent = normalContent.replace(closedRegex, '');
    }
    
    if (normalContent.length === prevLength) break;
  }
  
  // 第二步（非流式时）：移除未闭合的标签块（从开始标签到字符串结尾）
  if (!isStreaming) {
    for (const tag of tagsToRemove) {
      const unclosedRegex = new RegExp(`<${tag}>[\\s\\S]*$`, 'g');
      normalContent = normalContent.replace(unclosedRegex, '');
    }
  }
  
  // 第三步：强制移除所有残留的标签文本本身（包括开始和结束标签）
  normalContent = normalContent
    .replace(/<\/?reasoning>/g, '')
    .replace(/<\/?tools>/g, '')
    .replace(/<\/?conclusion>/g, '');
  
  // 移除文件和分子数据标签
  normalContent = normalContent
    .replace(/<file\s+[^>]*>[\s\S]*?<\/file>/g, '')
    .replace(/<molecule-data[^>]*>[\s\S]*?<\/molecule-data>/g, '');
  
  normalContent = normalContent.trim();

  // 方案2：智能 normalContent 过滤
  // 如果已有结构化内容，检查 normalContent 是否只剩无意义内容
  const hasStructuredContent = result.reasoning || result.conclusion || (result.tools && result.tools.length > 0);
  if (hasStructuredContent) {
    // 移除空白和常见标点后检查
    const substantive = normalContent.replace(/[\s\n\r。，、；：？！.,:;?!]/g, '');
    if (substantive.length < 10) {
      normalContent = '';  // 不显示无意义内容
    }
  }

  result.normalContent = normalContent;

  return result;
}

export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// 流式解析状态机实现
// ============================================================================

/** 已知的结构化标签列表 */
const KNOWN_TAGS = ['reasoning', 'tools', 'conclusion'] as const;

/** 标签边界信息 */
interface TagBoundary {
  tag: 'reasoningStart' | 'reasoningEnd' | 'toolsStart' | 'toolsEnd' | 'conclusionStart' | 'conclusionEnd';
  index: number;
  length: number;
}

/**
 * 创建初始流式状态
 */
export function createStreamingState(): StreamingState {
  return {
    phase: 'idle',
    prefixContent: '',
    reasoningContent: '',
    toolsContent: '',
    conclusionContent: '',
    buffer: '',
  };
}

/**
 * 检测是否有疑似不完整的已知标签
 * 只匹配我们定义的标签模式，避免误判普通文本中的 < 符号
 */
function hasPendingTagStart(text: string): boolean {
  const lastLt = text.lastIndexOf('<');
  if (lastLt === -1) return false;
  
  const tail = text.slice(lastLt);
  
  // 已经闭合了，不是 pending
  if (tail.includes('>')) return false;
  
  // 检查是否匹配已知标签的开头
  for (const tag of KNOWN_TAGS) {
    // 开始标签：<reasoning, <tools, <conclusion
    const startTag = `<${tag}`;
    if (startTag.startsWith(tail) || tail.startsWith(startTag)) {
      return true;
    }
    // 结束标签：</reasoning, </tools, </conclusion
    const endTag = `</${tag}`;
    if (endTag.startsWith(tail) || tail.startsWith(endTag)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 查找 buffer 中所有标签边界，按位置排序
 */
function findTagBoundaries(buffer: string): TagBoundary[] {
  const patterns: Array<{ tag: TagBoundary['tag']; regex: RegExp }> = [
    { tag: 'reasoningStart', regex: /<reasoning>/ },
    { tag: 'reasoningEnd', regex: /<\/reasoning>/ },
    { tag: 'toolsStart', regex: /<tools>/ },
    { tag: 'toolsEnd', regex: /<\/tools>/ },
    { tag: 'conclusionStart', regex: /<conclusion>/ },
    { tag: 'conclusionEnd', regex: /<\/conclusion>/ },
  ];

  const boundaries: TagBoundary[] = [];
  for (const { tag, regex } of patterns) {
    const match = buffer.match(regex);
    if (match && match.index !== undefined) {
      boundaries.push({ tag, index: match.index, length: match[0].length });
    }
  }

  return boundaries.sort((a, b) => a.index - b.index);
}

/**
 * 将文本追加到当前阶段对应的内容区（纯函数）
 */
function appendToPhase(state: StreamingState, text: string): StreamingState {
  switch (state.phase) {
    case 'idle':
      // <reasoning> 之前的内容归入 prefixContent
      return { ...state, prefixContent: state.prefixContent + text };
    case 'reasoning':
      return { ...state, reasoningContent: state.reasoningContent + text };
    case 'tools':
      return { ...state, toolsContent: state.toolsContent + text };
    case 'conclusion':
    case 'done':
      return { ...state, conclusionContent: state.conclusionContent + text };
    case 'error':
      return state; // 错误状态不再累积内容
    default:
      return state;
  }
}

/**
 * 根据标签切换状态机阶段（纯函数）
 */
function switchPhase(state: StreamingState, tag: TagBoundary['tag']): StreamingState {
  switch (tag) {
    case 'reasoningStart':
      return { ...state, phase: 'reasoning' };
    case 'reasoningEnd':
      // 退出 reasoning，回到 idle 等待下一个标签
      return { ...state, phase: state.phase === 'reasoning' ? 'idle' : state.phase };
    case 'toolsStart':
      return { ...state, phase: 'tools' };
    case 'toolsEnd':
      return { ...state, phase: state.phase === 'tools' ? 'idle' : state.phase };
    case 'conclusionStart':
      return { ...state, phase: 'conclusion' };
    case 'conclusionEnd':
      return { ...state, phase: 'done' };
    default:
      return state;
  }
}

/**
 * 处理单个 chunk，返回新状态（纯函数）
 * 核心流式解析逻辑：
 * 1. 将 chunk 追加到 buffer
 * 2. 循环扫描 buffer 中的标签边界
 * 3. 将标签之前的文本归入当前阶段
 * 4. 切换状态机状态
 * 5. 处理不完整标签（保留在 buffer 等下一 chunk）
 */
export function processChunk(state: StreamingState, chunk: string): StreamingState {
  let current: StreamingState = { ...state, buffer: state.buffer + chunk };
  let safetyLimit = 100; // 防止死循环

  while (safetyLimit-- > 0) {
    if (!current.buffer) break;

    const boundaries = findTagBoundaries(current.buffer);

    if (boundaries.length === 0) {
      // 没有完整标签边界
      if (hasPendingTagStart(current.buffer)) {
        // 有疑似不完整标签，保留 buffer 等下一 chunk
        break;
      } else {
        // 没有疑似标签，将 buffer 全部归入当前阶段
        current = appendToPhase(current, current.buffer);
        current = { ...current, buffer: '' };
        break;
      }
    }

    // 处理第一个边界
    const first = boundaries[0];
    const textBefore = current.buffer.slice(0, first.index);
    const textAfter = current.buffer.slice(first.index + first.length);

    // 边界之前的文本归入当前阶段
    if (textBefore) {
      current = appendToPhase(current, textBefore);
    }

    // 切换状态（消费标签，不渲染）
    current = switchPhase(current, first.tag);

    // 更新 buffer 为剩余部分
    current = { ...current, buffer: textAfter };
  }

  return current;
}

/**
 * 流式结束时调用，处理残留 buffer 并标记完成
 */
export function finalizeStreamingState(state: StreamingState): StreamingState {
  let newState = { ...state };

  // 处理 buffer 残留
  if (newState.buffer) {
    // 清理残留的标签文本（宽松处理）
    const cleaned = newState.buffer
      .replace(/<\/?reasoning>/g, '')
      .replace(/<\/?tools>/g, '')
      .replace(/<\/?conclusion>/g, '');

    newState = appendToPhase(newState, cleaned);
    newState = { ...newState, buffer: '' };
  }

  // prefixContent 处理策略：
  // 如果没有任何结构化内容，prefixContent 就是全部正文
  if (newState.prefixContent.trim()) {
    const hasStructured = 
      newState.reasoningContent || 
      newState.toolsContent || 
      newState.conclusionContent;

    if (!hasStructured) {
      // 无结构化内容：prefixContent 就是全部正文
      newState = { ...newState, conclusionContent: newState.prefixContent };
    }
    // 有结构化内容时丢弃 prefixContent（配合 Prompt 约束模型不输出前缀）
  }

  newState = { ...newState, phase: 'done' };
  return newState;
}

/**
 * 从 toolsContent 解析工具列表
 * 支持多种分隔符：换行、逗号、顿号、分号
 */
export function parseToolsFromContent(toolsContent: string): string[] {
  if (!toolsContent.trim()) return [];

  return toolsContent
    .split(/[\n,，、;；]+/)
    .map(line => line.replace(/^[-•*·]\s*/, '').trim())
    .filter(line => line.length > 0);
}

/**
 * 设置流式状态为错误状态
 */
export function setStreamingError(state: StreamingState, error: string): StreamingState {
  return {
    ...state,
    phase: 'error',
    error,
  };
}
