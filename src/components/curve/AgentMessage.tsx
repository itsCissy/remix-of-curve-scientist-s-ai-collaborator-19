import AgentAvatar from "./AgentAvatar";
import StructuredMessage from "./StructuredMessage";
import { ParsedContent, parseMessageContent } from "@/lib/messageUtils";

interface AgentMessageProps {
  content: string;
  parsedContent?: ParsedContent;
  isStreaming?: boolean;
}

const AgentMessage = ({ content, parsedContent, isStreaming }: AgentMessageProps) => {
  // Safely parse content if parsedContent is not provided
  const parsed = parsedContent ?? parseMessageContent(content);

  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex-shrink-0 mt-1">
        <AgentAvatar size="md" />
      </div>
      <div className="flex-1 max-w-[800px]">
        <StructuredMessage
          reasoning={parsed.reasoning}
          tools={parsed.tools}
          conclusion={parsed.conclusion}
          normalContent={parsed.normalContent}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default AgentMessage;
