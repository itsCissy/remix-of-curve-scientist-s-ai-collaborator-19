import AgentAvatar from "./AgentAvatar";
import StructuredMessage from "./StructuredMessage";
import { ParsedContent } from "@/lib/messageUtils";

interface AgentMessageProps {
  content: string;
  parsedContent: ParsedContent;
  isStreaming?: boolean;
}

const AgentMessage = ({ content, parsedContent, isStreaming }: AgentMessageProps) => {
  return (
    <div className="flex items-start gap-3 animate-fade-in">
      <div className="flex-shrink-0 mt-1">
        <AgentAvatar size="md" />
      </div>
      <div className="flex-1 max-w-[800px]">
        <StructuredMessage
          reasoning={parsedContent.reasoning}
          tools={parsedContent.tools}
          conclusion={parsedContent.conclusion}
          normalContent={parsedContent.normalContent}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default AgentMessage;
