import { Brain, Wrench, CheckCircle, ChevronDown, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [progress, setProgress] = useState(0);

  // Simulate progress based on content length and streaming state
  useEffect(() => {
    if (isStreaming) {
      // Estimate progress based on typical response patterns
      const estimatedTotal = 500; // Expected average chars
      const currentProgress = Math.min((content.length / estimatedTotal) * 100, 95);
      setProgress(currentProgress);
    } else if (content) {
      setProgress(100);
    }
  }, [content, isStreaming]);

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-all duration-300 animate-fade-in",
      isStreaming 
        ? "bg-amber-500/5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
        : "bg-muted/30 border-border/50"
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className={cn(
          "relative",
          isStreaming && "animate-pulse"
        )}>
          <Brain className={cn(
            "w-4 h-4 transition-colors duration-300",
            isStreaming ? "text-amber-500" : "text-amber-500/70"
          )} />
          {isStreaming && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground">推理过程</span>
        
        {/* Progress indicator */}
        {isStreaming && (
          <span className="ml-2 flex items-center gap-2 px-2 py-0.5 bg-amber-500/10 rounded-full">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {Math.round(progress)}%
            </span>
          </span>
        )}
        
        {!isStreaming && content && (
          <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            完成
          </span>
        )}
        
        <div className="ml-auto">
          <div className={cn(
            "transition-transform duration-200",
            isExpanded ? "rotate-0" : "-rotate-90"
          )}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </button>
      
      {/* Progress bar */}
      {isStreaming && (
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
      
      <div className={cn(
        "grid transition-all duration-300 ease-out",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <div className={cn(
            "px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap",
            isStreaming ? "text-foreground" : "text-muted-foreground"
          )}>
            {content}
            {isStreaming && (
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
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleTools, setVisibleTools] = useState<number>(0);

  useEffect(() => {
    if (isNew) {
      const timer = setInterval(() => {
        setVisibleTools(prev => {
          if (prev >= tools.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 150);
      return () => clearInterval(timer);
    } else {
      setVisibleTools(tools.length);
    }
  }, [tools.length, isNew]);

  return (
    <div className="bg-blue-500/5 rounded-lg border border-blue-500/20 overflow-hidden animate-fade-in">
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
          <div className={cn(
            "transition-transform duration-200",
            isExpanded ? "rotate-0" : "-rotate-90"
          )}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </button>
      <div className={cn(
        "grid transition-all duration-300 ease-out",
        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
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
}

const ConclusionSection = ({ content, enableTypewriter }: ConclusionSectionProps) => {
  const { displayedText, isComplete } = useTypewriter(content, 15, enableTypewriter);

  return (
    <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/20 overflow-hidden animate-scale-in shadow-[0_0_20px_rgba(16,185,129,0.1)]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/10 bg-emerald-500/5">
        <div className="relative">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <Sparkles className="w-3 h-3 text-emerald-400 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="text-sm font-medium text-foreground">分析结论</span>
        <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {isComplete ? "已完成" : "输出中..."}
        </span>
      </div>
      <div className="px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {displayedText}
        {!isComplete && (
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
}

const StructuredMessage = ({
  reasoning,
  tools,
  conclusion,
  normalContent,
  isStreaming,
}: StructuredMessageProps) => {
  const hasStructuredContent = reasoning || (tools && tools.length > 0) || conclusion;
  const [showTools, setShowTools] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);
  const [conclusionKey, setConclusionKey] = useState(0);

  useEffect(() => {
    if (tools && tools.length > 0 && !showTools) {
      setShowTools(true);
    }
  }, [tools, showTools]);

  useEffect(() => {
    if (conclusion && !showConclusion) {
      setShowConclusion(true);
      setConclusionKey(prev => prev + 1); // Reset typewriter on new conclusion
    }
  }, [conclusion, showConclusion]);

  return (
    <div className="space-y-3">
      {/* Normal content before structured sections */}
      {normalContent && (
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap animate-fade-in">
          {isStreaming ? (
            <>
              {normalContent}
              <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
            </>
          ) : (
            normalContent
          )}
        </div>
      )}

      {/* Structured sections */}
      {hasStructuredContent && (
        <div className="space-y-3">
          {reasoning && (
            <ReasoningSection 
              content={reasoning} 
              isStreaming={isStreaming && !conclusion} 
            />
          )}
          {tools && tools.length > 0 && (
            <ToolsSection tools={tools} isNew={!showConclusion} />
          )}
          {conclusion && (
            <ConclusionSection 
              key={conclusionKey}
              content={conclusion} 
              enableTypewriter={!isStreaming}
            />
          )}
        </div>
      )}

      {/* Streaming indicator when no content yet */}
      {isStreaming && !normalContent && !hasStructuredContent && (
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50 animate-fade-in">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full animate-ping" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">正在分析...</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StructuredMessage;
