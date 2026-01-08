import { Brain, CheckCircle, ChevronRight, Copy, Check, GitBranch, Wand2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";
import ThinkingLoader from "./ThinkingLoader";
import FileViewer, { FileAttachment } from "./FileViewer";
import MoleculeResultTabs from "./MoleculeResultTabs";
import { ParsedMoleculeResult } from "@/lib/moleculeDataUtils";
import { StreamPhase } from "@/lib/messageUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Typewriter hook for character-by-character display
const useTypewriter = (text: string, speed: number = 20, enabled: boolean = true) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText("");
    setIsComplete(false);
    
    if (!text) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return { displayedText, isComplete };
};

interface ReasoningSectionProps {
  content: string;
  isStreaming?: boolean;
}

const ReasoningSection = ({ content, isStreaming }: ReasoningSectionProps) => {
  const streaming = Boolean(isStreaming);
  const [isExpanded, setIsExpanded] = useState(false);

  const summary = content.slice(0, 60) + (content.length > 60 ? '...' : '');

  return (
    <div className="space-y-1">
      {/* 流式排版：一行简单文本摘要 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 w-full text-left hover:opacity-80 transition-opacity"
      >
        <Brain className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-400 flex-1 truncate">
          {summary}
        </span>
        <ChevronRight 
          className={cn(
            "w-3 h-3 text-slate-400 flex-shrink-0 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {/* 展开后的纯文本流 */}
      {isExpanded && (
        <div className="pl-5 ml-1.5 border-l border-slate-200 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
          {content}
          {streaming && (
            <span className="inline-block w-0.5 h-3 bg-slate-400 ml-0.5 animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
};

interface ToolsSectionProps {
  tools: string[];
  isNew?: boolean;
}

const ToolsSection = ({ tools, isNew }: ToolsSectionProps) => {
  const animated = Boolean(isNew);
  const [visibleTools, setVisibleTools] = useState<number>(0);
  const [completedTools, setCompletedTools] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (animated) {
      const timer = setInterval(() => {
        setVisibleTools((prev) => {
          if (prev >= tools.length) {
            clearInterval(timer);
            return prev;
          }
          const nextIndex = prev + 1;
          // 当工具显示时，标记为完成
          setCompletedTools((completed) => new Set([...completed, prev]));
          return nextIndex;
        });
      }, 150);
      return () => clearInterval(timer);
    }

    setVisibleTools(tools.length);
    // 所有工具完成后，标记为完成
    setCompletedTools(new Set(tools.map((_, i) => i)));
  }, [tools.length, animated]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {tools.map((tool, index) => (
        <span
          key={index}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300",
            "bg-transparent border border-slate-200 text-slate-600",
            index < visibleTools
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-95",
            !completedTools.has(index) && "animate-pulse"
          )}
          style={{ transitionDelay: `${index * 50}ms` }}
        >
          {completedTools.has(index) ? (
            <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
          ) : null}
          {tool}
        </span>
      ))}
    </div>
  );
};

interface ConclusionSectionProps {
  content: string;
  enableTypewriter?: boolean;
  animate?: boolean;
}

const ConclusionSection = ({ content, enableTypewriter, animate }: ConclusionSectionProps) => {
  const shouldType = Boolean(enableTypewriter);
  const shouldAnimate = Boolean(animate);
  const { displayedText, isComplete } = useTypewriter(content, 15, shouldType);

  return (
    <div className={cn("space-y-2", shouldAnimate && "animate-fade-in")}>
      {/* Markdown 原生呈现 */}
      <div className="text-sm">
        <MarkdownRenderer content={displayedText} />
        {!isComplete && shouldType && (
          <span className="inline-block w-0.5 h-4 bg-slate-400 ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
};

interface StructuredMessageProps {
  reasoning?: string;
  tools?: string[];
  conclusion?: string;
  normalContent?: string;
  isStreaming?: boolean;
  streamPhase?: StreamPhase;  // 流式阶段状态
  files?: FileAttachment[];
  moleculeData?: ParsedMoleculeResult;
  messageId?: string;
  onCreateBranch?: (messageId: string) => void;
  onSaveAsSkill?: (messageId: string, content: string) => void;
}

/**
 * StructuredMessage 组件
 * 
 * 根据 streamPhase 决定显示哪些区域：
 * - idle: 显示 ThinkingLoader
 * - reasoning: 显示思考区（带流式光标）
 * - tools: 显示思考区 + 工具区（带动画）
 * - conclusion: 显示思考区 + 工具区 + 正文区（带流式光标）
 * - done: 显示完整内容（无光标）
 * - error: 显示错误状态
 */
const StructuredMessage = ({
  reasoning,
  tools,
  conclusion,
  normalContent,
  isStreaming,
  streamPhase = 'done',
  files,
  moleculeData,
  messageId,
  onCreateBranch,
  onSaveAsSkill,
}: StructuredMessageProps) => {
  const hasStructuredContent = reasoning || (tools && tools.length > 0) || conclusion;
  const streaming = Boolean(isStreaming);
  const [copied, setCopied] = useState(false);
  
  // 根据 streamPhase 判断各区域是否应该显示
  const phaseOrder: StreamPhase[] = ['idle', 'reasoning', 'tools', 'conclusion', 'done'];
  const currentPhaseIndex = phaseOrder.indexOf(streamPhase);
  
  // 各区域显示条件
  const showReasoning = reasoning && currentPhaseIndex >= phaseOrder.indexOf('reasoning');
  const showTools = tools && tools.length > 0 && currentPhaseIndex >= phaseOrder.indexOf('tools');
  const showConclusion = conclusion && currentPhaseIndex >= phaseOrder.indexOf('conclusion');
  
  // 判断各区域是否正在流式输入
  const isReasoningStreaming = streaming && streamPhase === 'reasoning';
  const isToolsStreaming = streaming && streamPhase === 'tools';
  const isConclusionStreaming = streaming && streamPhase === 'conclusion';

  // 收集所有内容文本用于复制
  const getAllContentText = (): string => {
    const parts: string[] = [];
    
    if (normalContent) {
      parts.push(normalContent);
    }
    
    if (reasoning) {
      parts.push(`推理过程：\n${reasoning}`);
    }
    
    if (tools && tools.length > 0) {
      parts.push(`调用工具：\n${tools.join('\n')}`);
    }
    
    if (conclusion) {
      parts.push(`分析结论：\n${conclusion}`);
    }
    
    if (moleculeData?.description) {
      parts.push(moleculeData.description);
    }
    
    return parts.join('\n\n');
  };

  const handleCopy = async () => {
    try {
      const fullText = getAllContentText();
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const hasContent = normalContent || hasStructuredContent || (moleculeData && moleculeData.molecules.length > 0);

  return (
    <div className="space-y-3">
      {/* ThinkingLoader: 仅在 idle 阶段且无内容时显示 */}
      {streaming && streamPhase === 'idle' && !hasStructuredContent && !normalContent && (
        <ThinkingLoader />
      )}

      {/* Normal content - 非结构化消息使用（如模型未输出标签时） */}
      {normalContent && (
        <div className={cn("text-sm", streaming && "animate-fade-in")}>
          <MarkdownRenderer content={normalContent} />
          {streaming && (
            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
          )}
        </div>
      )}

      {/* Structured sections - 根据 streamPhase 逐步显示 */}
      {hasStructuredContent && (
        <div className="space-y-2">
          {/* 思考区 */}
          {showReasoning && (
            <ReasoningSection 
              content={reasoning!} 
              isStreaming={isReasoningStreaming} 
            />
          )}
          
          {/* 工具区 */}
          {showTools && (
            <ToolsSection 
              tools={tools!} 
              isNew={isToolsStreaming || streaming} 
            />
          )}
          
          {/* 正文区 */}
          {showConclusion && (
            <ConclusionSection 
              content={conclusion!} 
              animate={isConclusionStreaming} 
              enableTypewriter={false} 
            />
          )}
          
          {/* 正文区流式光标（conclusion 正在输入时显示） */}
          {isConclusionStreaming && (
            <span className="inline-block w-0.5 h-4 bg-slate-400 ml-0.5 animate-pulse" />
          )}
        </div>
      )}

      {/* Molecule data visualization */}
      {moleculeData && moleculeData.molecules.length > 0 && (
        <MoleculeResultTabs 
          data={moleculeData.molecules}
          description={moleculeData.description}
        />
      )}

      {/* File attachments */}
      {files && files.length > 0 && (
        <FileViewer files={files} />
      )}

      {/* 底部操作栏 - 复制按钮和分支图标 */}
      {hasContent && !streaming && (
        <div className="flex items-center justify-start gap-2 mt-4">
          {/* 复制按钮 - 纯图标化 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md transition-all text-slate-400 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] flex items-center justify-center"
              >
                {copied ? (
                  <Check size={16} strokeWidth={2} style={{ color: '#123aff' }} />
                ) : (
                  <Copy size={16} strokeWidth={2} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{copied ? '已复制' : '复制回答'}</p>
            </TooltipContent>
          </Tooltip>

          {/* 分支图标 */}
          {messageId && onCreateBranch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onCreateBranch(messageId)}
                  className="p-1.5 rounded-md transition-all text-slate-400 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] flex items-center justify-center"
                >
                  <GitBranch size={16} strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>从此处创建分支</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* 存为技能图标 */}
          {messageId && onSaveAsSkill && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSaveAsSkill(messageId, getAllContentText())}
                  className="p-1.5 rounded-md transition-all text-slate-400 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] flex items-center justify-center"
                >
                  <Wand2 size={16} strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>存为技能</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

export default StructuredMessage;
export type { FileAttachment };
