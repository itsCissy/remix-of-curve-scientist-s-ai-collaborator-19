import { Brain, Wrench, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReasoningSectionProps {
  content: string;
  isStreaming?: boolean;
}

const ReasoningSection = ({ content, isStreaming }: ReasoningSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <Brain className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-foreground">推理过程</span>
        {isStreaming && (
          <span className="ml-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">思考中...</span>
          </span>
        )}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
};

interface ToolsSectionProps {
  tools: string[];
}

const ToolsSection = ({ tools }: ToolsSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <Wrench className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium text-foreground">调用工具与知识库</span>
        <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tools.length} 项
        </span>
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {tools.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ConclusionSectionProps {
  content: string;
}

const ConclusionSection = ({ content }: ConclusionSectionProps) => {
  return (
    <div className="bg-emerald-500/5 rounded-lg border border-emerald-500/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/10">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span className="text-sm font-medium text-foreground">分析结论</span>
      </div>
      <div className="px-4 py-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {content}
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
}

const StructuredMessage = ({
  reasoning,
  tools,
  conclusion,
  normalContent,
  isStreaming,
}: StructuredMessageProps) => {
  const hasStructuredContent = reasoning || (tools && tools.length > 0) || conclusion;

  return (
    <div className="space-y-3">
      {/* Normal content before structured sections */}
      {normalContent && (
        <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {normalContent}
        </div>
      )}

      {/* Structured sections */}
      {hasStructuredContent && (
        <div className="space-y-3">
          {reasoning && (
            <ReasoningSection content={reasoning} isStreaming={isStreaming && !conclusion} />
          )}
          {tools && tools.length > 0 && <ToolsSection tools={tools} />}
          {conclusion && <ConclusionSection content={conclusion} />}
        </div>
      )}

      {/* Streaming indicator when no content yet */}
      {isStreaming && !normalContent && !hasStructuredContent && (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-sm text-muted-foreground">正在思考...</span>
        </div>
      )}
    </div>
  );
};

export default StructuredMessage;
