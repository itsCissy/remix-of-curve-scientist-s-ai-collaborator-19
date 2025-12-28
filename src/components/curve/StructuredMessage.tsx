import { Brain, Wrench, CheckCircle, ChevronDown, Sparkles, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import MarkdownRenderer from "./MarkdownRenderer";
import ThinkingLoader from "./ThinkingLoader";
import FileViewer, { FileAttachment } from "./FileViewer";
import MoleculeResultTabs from "./MoleculeResultTabs";
import { ParsedMoleculeResult } from "@/lib/moleculeDataUtils";
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState(0);

  // Simulate progress based on content length and streaming state
  useEffect(() => {
    if (streaming) {
      // Estimate progress based on typical response patterns
      const estimatedTotal = 500; // Expected average chars
      const currentProgress = Math.min((content.length / estimatedTotal) * 100, 95);
      setProgress(currentProgress);
    } else if (content) {
      setProgress(100);
    }
  }, [content, streaming]);

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden transition-all duration-300",
        streaming && "animate-fade-in",
        streaming
          ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          : "bg-muted/30 border-border/50"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className={cn("relative", streaming && "animate-pulse")}>
          <Brain
            className={cn(
              "w-4 h-4 transition-colors duration-300",
              streaming ? "text-amber-500" : "text-amber-500/70"
            )}
          />
          {streaming && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">推理过程</span>

        {/* Progress indicator */}
        {streaming && (
          <span className="ml-2 flex items-center gap-2 px-2 py-0.5 bg-amber-500/10 rounded-full">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {Math.round(progress)}%
            </span>
          </span>
        )}

        {!streaming && content && (
          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            完成
          </span>
        )}

        <div className="ml-auto">
          <div
            className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-0" : "-rotate-90"
            )}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </button>

      {/* Progress bar */}
      {streaming && (
        <div className="px-4 pb-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap",
              streaming ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {content}
            {streaming && (
              <span className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToolsSectionProps {
  tools: string[];
  isNew?: boolean;
}

const ToolsSection = ({ tools, isNew }: ToolsSectionProps) => {
  const animated = Boolean(isNew);
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleTools, setVisibleTools] = useState<number>(0);

  useEffect(() => {
    if (animated) {
      const timer = setInterval(() => {
        setVisibleTools((prev) => {
          if (prev >= tools.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
      return () => clearInterval(timer);
    }

    setVisibleTools(tools.length);
  }, [tools.length, animated]);

  return (
    <div
      className={cn(
        "bg-blue-500/5 rounded-lg border border-blue-500/20 overflow-hidden",
        animated && "animate-fade-in"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-blue-500/10 transition-colors"
      >
        <Wrench className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-foreground">调用工具与知识库</span>
        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-medium">
          {tools.length} 项
        </span>
        <div className="ml-auto">
          <div
            className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-0" : "-rotate-90"
            )}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-2">
              {tools.map((tool, index) => (
                <span
                  key={index}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium transition-all duration-300",
                    index < visibleTools
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-2 scale-95"
                  )}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div
      className={cn(
        "bg-emerald-500/5 rounded-lg border border-emerald-500/20 overflow-hidden shadow-[0_0_20px_rgba(16,185,129,0.1)]",
        shouldAnimate && "animate-scale-in"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/10 bg-emerald-500/5">
        <div className="relative">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <Sparkles className="w-3 h-3 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="text-sm font-medium text-foreground">分析结论</span>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {isComplete ? "已完成" : "输出中..."}
        </span>
        <button
          onClick={handleCopy}
          className="ml-auto p-1.5 rounded-md hover:bg-emerald-500/10 transition-colors text-emerald-600 dark:text-emerald-400"
          title="复制结论"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="px-4 py-3 text-sm">
        <MarkdownRenderer content={displayedText} />
        {!isComplete && shouldType && (
          <span className="inline-block w-0.5 h-4 bg-emerald-500 ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
};

interface TypewriterTextProps {
  text: string;
  speed?: number;
  enabled?: boolean;
}

const TypewriterText = ({ text, speed = 20, enabled = true }: TypewriterTextProps) => {
  const { displayedText, isComplete } = useTypewriter(text, speed, enabled);
  
  return (
    <span>
      {displayedText}
      {!isComplete && enabled && (
        <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
      )}
    </span>
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
}

const StructuredMessage = ({
  reasoning,
  tools,
  conclusion,
  normalContent,
  isStreaming,
  files,
  moleculeData,
}: StructuredMessageProps) => {
  const hasStructuredContent = reasoning || (tools && tools.length > 0) || conclusion;
  const streaming = Boolean(isStreaming);

  return (
    <div className="space-y-3">
      {/* Normal content before structured sections */}
      {normalContent && (
        <div className={cn("text-sm", streaming && "animate-fade-in")}>
          <MarkdownRenderer content={normalContent} />
          {streaming && (
            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
          )}
        </div>
      )}

      {/* Structured sections */}
      {hasStructuredContent && (
        <div className="space-y-3">
          {reasoning && (
            <ReasoningSection content={reasoning} isStreaming={streaming && !conclusion} />
          )}
          {tools && tools.length > 0 && (
            <ToolsSection tools={tools} isNew={streaming} />
          )}
          {conclusion && (
            <ConclusionSection content={conclusion} animate={streaming} enableTypewriter={false} />
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

      {/* Streaming indicator when no content yet */}
      {streaming && !normalContent && !hasStructuredContent && (
        <ThinkingLoader />
      )}
    </div>
  );
};

export default StructuredMessage;
export type { FileAttachment };
