import AgentAvatar from "./AgentAvatar";
import StructuredMessage from "./StructuredMessage";
import { ParsedContent, parseMessageContent } from "@/lib/messageUtils";
import { FileAttachment } from "./FileViewer";

interface AgentMessageProps {
  content: string;
  parsedContent?: ParsedContent;
  isStreaming?: boolean;
  files?: FileAttachment[];
  messageId?: string;
  onCreateBranch?: (messageId: string) => void;
  onSaveAsSkill?: (messageId: string, content: string) => void;
}

const AgentMessage = ({ 
  content, 
  parsedContent, 
  isStreaming, 
  files,
  messageId,
  onCreateBranch,
  onSaveAsSkill,
}: AgentMessageProps) => {
  // Safely parse content if parsedContent is not provided
  const parsed = parsedContent ?? parseMessageContent(content);
  
  // Merge files from props and parsed content
  const allFiles = [...(files || []), ...(parsed.files || [])];

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
          reasoning={parsed.reasoning}
          tools={parsed.tools}
          conclusion={parsed.conclusion}
          normalContent={parsed.normalContent}
          isStreaming={isStreaming}
          files={allFiles.length > 0 ? allFiles : undefined}
          moleculeData={parsed.moleculeData}
          messageId={messageId}
          onCreateBranch={onCreateBranch}
          onSaveAsSkill={onSaveAsSkill}
        />
      </div>
    </div>
  );
};

export default AgentMessage;
