import { Brain, CheckCircle, Copy, Check, GitBranch, Wand2, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";
import FileViewer, { FileAttachment } from "./FileViewer";
import MoleculeResultTabs from "./MoleculeResultTabs";
import { ParsedMoleculeResult } from "@/lib/moleculeDataUtils";
import ThinkingLoader from "./ThinkingLoader";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ReasoningSectionProps {
  content: string;
  isStreaming?: boolean;
}

const ReasoningSection = ({ content, isStreaming }: ReasoningSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = content.slice(0, 60) + (content.length > 60 ? '...' : '');

  return (
    <div className="space-y-1 animate-content-reveal">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 w-full text-left hover:opacity-80 transition-all duration-200 group"
      >
        <ChevronRight 
          className={cn(
            "w-3 h-3 text-slate-400 flex-shrink-0 transition-transform duration-200",
            isExpanded && "rotate-90"
          )} 
        />
        <Brain className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-400 flex-1 truncate">
          {summary}
          {isStreaming && <span className="streaming-cursor" />}
        </span>
      </button>

      <div 
        className={cn(
          "reasoning-collapse",
          isExpanded ? "expanded" : "collapsed"
        )}
      >
        <div className="pl-5 ml-1.5 border-l border-slate-200 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pt-1">
          {content}
        </div>
      </div>
    </div>
  );
};

interface ToolsSectionProps {
  tools: string[];
  isStreaming?: boolean;
}

const ToolsSection = ({ tools, isStreaming }: ToolsSectionProps) => {
  return (
    <div className="flex flex-wrap gap-1.5 animate-content-reveal">
      {tools.map((tool, index) => (
        <span
          key={index}
          className="tool-tag-stagger inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
        >
          <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
          {tool}
        </span>
      ))}
    </div>
  );
};

interface ConclusionSectionProps {
  content: string;
}

const ConclusionSection = ({ content }: ConclusionSectionProps) => {
  return (
    <div className="space-y-2">
      <div className="text-sm">
        <MarkdownRenderer content={content} />
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
  files?: FileAttachment[];
  moleculeData?: ParsedMoleculeResult;
  messageId?: string;
  onCreateBranch?: (messageId: string) => void;
  onSaveAsSkill?: (messageId: string, content: string) => void;
}

const StructuredMessage = ({
  reasoning,
  tools,
  conclusion,
  normalContent,
  isStreaming,
  files,
  moleculeData,
  messageId,
  onCreateBranch,
  onSaveAsSkill,
}: StructuredMessageProps) => {
  const hasStructuredContent = reasoning || (tools && tools.length > 0) || conclusion;
  const [copied, setCopied] = useState(false);
  
  // 判断是否有任何内容
  const hasAnyContent = Boolean(
    reasoning?.trim() ||
    normalContent?.trim() ||
    conclusion?.trim() ||
    (tools && tools.length > 0) ||
    (files && files.length > 0) ||
    (moleculeData && moleculeData.molecules.length > 0)
  );

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
  
  // 追踪是否刚完成流式传输（用于完成动效）
  const [justCompleted, setJustCompleted] = useState(false);
  const wasStreamingRef = useRef(isStreaming);
  
  useEffect(() => {
    // 检测从 streaming -> 非 streaming 的转变
    if (wasStreamingRef.current && !isStreaming && hasContent) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, hasContent]);

  return (
    <div className={cn(
      "space-y-3",
      justCompleted && "animate-completion-glow rounded-lg"
    )}>
      {/* 如果正在流式传输但没有任何内容，显示 Thinking... */}
      {isStreaming && !hasAnyContent && (
        <ThinkingLoader inline />
      )}

      {/* Reasoning section - 直接显示，默认折叠 */}
      {reasoning && (
        <div className="space-y-2">
          <ReasoningSection content={reasoning} isStreaming={isStreaming && !normalContent && !conclusion} />
        </div>
      )}

      {/* Tools section - 直接显示 */}
      {tools && tools.length > 0 && (
        <ToolsSection tools={tools} isStreaming={isStreaming} />
      )}

      {/* Normal content - 直接显示 */}
      {normalContent && (
        <div className={cn(
          "text-sm animate-content-reveal",
          isStreaming && !conclusion && "streaming-cursor"
        )}>
          <MarkdownRenderer content={normalContent} />
        </div>
      )}

      {/* Conclusion - 直接显示 */}
      {conclusion && (
        <div className={cn(
          isStreaming && "streaming-cursor"
        )}>
          <ConclusionSection content={conclusion} />
        </div>
      )}

      {/* Molecule data visualization - 直接显示 */}
      {moleculeData && moleculeData.molecules.length > 0 && (
        <div className="animate-content-reveal">
          <MoleculeResultTabs 
            data={moleculeData.molecules}
            description={moleculeData.description}
          />
        </div>
      )}

      {/* File attachments - 直接显示 */}
      {files && files.length > 0 && (
        <div className="animate-content-reveal">
          <FileViewer files={files} />
        </div>
      )}

      {/* 底部操作栏 - 复制按钮和分支图标 */}
      {hasContent && !isStreaming && (
        <div className="flex items-center justify-start gap-2 mt-4 animate-actions-fade-in">
          {/* 复制按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md transition-all duration-200 text-slate-400 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] hover:scale-105 flex items-center justify-center"
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
                  className="p-1.5 rounded-md transition-all duration-200 text-slate-400 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] hover:scale-105 flex items-center justify-center"
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
                  className="p-1.5 rounded-md transition-all duration-200 text-slate-400 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] hover:scale-105 flex items-center justify-center"
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
