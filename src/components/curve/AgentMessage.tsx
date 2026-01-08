import { memo, useMemo } from "react";
import AgentAvatar from "./AgentAvatar";
import StructuredMessage from "./StructuredMessage";
import { 
  parseMessageContent, 
  StreamingState, 
  StreamPhase,
  parseToolsFromContent,
} from "@/lib/messageUtils";
import { FileAttachment } from "./FileViewer";

interface AgentMessageProps {
  content: string;
  isStreaming?: boolean;
  streamingState?: StreamingState;  // 流式阶段的状态机数据
  files?: FileAttachment[];
  messageId?: string;
  onCreateBranch?: (messageId: string) => void;
  onSaveAsSkill?: (messageId: string, content: string) => void;
}

/**
 * AgentMessage 组件
 * 
 * 渲染策略：
 * - 流式阶段 (isStreaming=true)：使用 streamingState 中的实时解析数据
 * - 完成阶段 (isStreaming=false)：使用 parseMessageContent 最终解析（带缓存）
 * 
 * 这样设计的好处：
 * 1. 流式时实时显示结构化内容（思考/工具/正文分区）
 * 2. 完成后使用完整解析确保准确性
 * 3. streamingState 在完成后被清除，节省内存
 * 4. 使用 React.memo + useMemo 优化非流式消息的渲染性能
 */
const AgentMessageInner = ({ 
  content, 
  isStreaming, 
  streamingState,
  files,
  messageId,
  onCreateBranch,
  onSaveAsSkill,
}: AgentMessageProps) => {
  
  // 缓存非流式消息的解析结果
  // 只有当 content 改变时才重新解析（流式消息每次 streamingState 变化都会更新）
  const parsedContent = useMemo(() => {
    if (isStreaming) return null; // 流式时不使用缓存解析
    return parseMessageContent(content, false);
  }, [content, isStreaming]);
  
  // 根据流式状态选择数据源
  const displayData = useMemo(() => {
    if (isStreaming && streamingState) {
      // 流式阶段：使用状态机中的实时数据
      return {
        reasoning: streamingState.reasoningContent || undefined,
        tools: parseToolsFromContent(streamingState.toolsContent),
        conclusion: streamingState.conclusionContent || undefined,
        normalContent: '', // 流式时不使用 normalContent，内容都在结构化区域
        phase: streamingState.phase,
        files: undefined, // 流式时暂不处理文件
        moleculeData: undefined, // 流式时暂不处理分子数据
      };
    }
    
    // 完成阶段：使用缓存的解析结果
    if (parsedContent) {
      return {
        reasoning: parsedContent.reasoning,
        tools: parsedContent.tools,
        conclusion: parsedContent.conclusion,
        normalContent: parsedContent.normalContent,
        phase: 'done' as StreamPhase,
        files: parsedContent.files,
        moleculeData: parsedContent.moleculeData,
      };
    }
    
    // Fallback（不应该到达这里）
    return {
      reasoning: undefined,
      tools: undefined,
      conclusion: undefined,
      normalContent: content,
      phase: 'done' as StreamPhase,
      files: undefined,
      moleculeData: undefined,
    };
  }, [isStreaming, streamingState, parsedContent, content]);
  
  // 合并文件：props 中的文件 + 解析出的文件
  const allFiles = [...(files || []), ...(displayData.files || [])];

  return (
    <div 
      className="flex items-start gap-3 animate-message-enter group"
      data-message-id={messageId}
    >
      <div className="flex-shrink-0 mt-1">
        <AgentAvatar size="md" />
      </div>
      <div className="flex-1 max-w-[800px]">
        <StructuredMessage
          reasoning={displayData.reasoning}
          tools={displayData.tools}
          conclusion={displayData.conclusion}
          normalContent={displayData.normalContent}
          isStreaming={isStreaming}
          streamPhase={displayData.phase}
          files={allFiles.length > 0 ? allFiles : undefined}
          moleculeData={displayData.moleculeData}
          messageId={messageId}
          onCreateBranch={onCreateBranch}
          onSaveAsSkill={onSaveAsSkill}
        />
      </div>
    </div>
  );
};

/**
 * 自定义比较函数：
 * - 对于非流式消息：只比较 messageId 和 content（忽略其他 props 变化）
 * - 对于流式消息：比较 streamingState 的 phase 和内容长度
 */
const arePropsEqual = (
  prevProps: AgentMessageProps,
  nextProps: AgentMessageProps
): boolean => {
  // messageId 变化必须重新渲染
  if (prevProps.messageId !== nextProps.messageId) return false;
  
  // 流式状态变化必须重新渲染
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  
  // 流式消息：比较 streamingState
  if (nextProps.isStreaming && nextProps.streamingState) {
    const prevState = prevProps.streamingState;
    const nextState = nextProps.streamingState;
    
    if (!prevState) return false;
    
    // 阶段变化或内容长度变化时重新渲染
    return (
      prevState.phase === nextState.phase &&
      prevState.reasoningContent.length === nextState.reasoningContent.length &&
      prevState.toolsContent.length === nextState.toolsContent.length &&
      prevState.conclusionContent.length === nextState.conclusionContent.length
    );
  }
  
  // 非流式消息：只比较 content
  return prevProps.content === nextProps.content;
};

const AgentMessage = memo(AgentMessageInner, arePropsEqual);

export default AgentMessage;
