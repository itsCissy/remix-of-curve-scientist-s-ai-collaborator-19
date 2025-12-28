import { useState, useRef, useEffect } from "react";
import UserAvatar from "./UserAvatar";
import { MessageAttachment } from "@/lib/messageUtils";
import { FileText, File, Pencil } from "lucide-react";
import MessageBranchButton from "./MessageBranchButton";
import { Collaborator } from "@/hooks/useBranches";
import CollaboratorBadge from "./CollaboratorBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
  attachments?: MessageAttachment[];
  messageId?: string;
  onCreateBranch?: (messageId: string) => void;
  collaborator?: Collaborator | null;
  isEdited?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

const UserMessage = ({ 
  content, 
  attachments, 
  messageId, 
  onCreateBranch,
  collaborator,
  isEdited,
  onEditMessage,
}: UserMessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (type.startsWith("image/")) return null;
    if (["pdf"].includes(ext || "")) return <FileText className="w-4 h-4 text-red-300" />;
    if (["doc", "docx"].includes(ext || "")) return <FileText className="w-4 h-4 text-blue-300" />;
    if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileText className="w-4 h-4 text-emerald-300" />;
    return <File className="w-4 h-4 text-primary-foreground/70" />;
  };

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editContent.length, editContent.length);
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditContent(content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
  };

  const handleSubmitEdit = () => {
    if (!editContent.trim() || !messageId || !onEditMessage) return;
    onEditMessage(messageId, editContent.trim());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleCancelEdit();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEdit();
    }
  };

  return (
    <div className="flex justify-end items-start gap-3 animate-fade-in group">
      {/* Action buttons */}
      {messageId && !isEditing && (
        <div className="flex-shrink-0 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEditMessage && (
            <button
              onClick={handleStartEdit}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="编辑消息"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onCreateBranch && (
            <MessageBranchButton onCreateBranch={() => onCreateBranch(messageId)} />
          )}
        </div>
      )}
      
      <div className="max-w-[600px] space-y-2">
        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {attachments.map((attachment, index) => (
              <div key={index}>
                {attachment.type.startsWith("image/") && attachment.preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-primary/20 shadow-sm">
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="max-w-[200px] max-h-[200px] object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/80 rounded-xl border border-primary/20">
                    {getFileIcon(attachment.type, attachment.name)}
                    <div className="text-primary-foreground">
                      <p className="text-xs font-medium truncate max-w-[150px]">{attachment.name}</p>
                      <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message content or edit mode */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] w-[400px] bg-background border-primary/30 focus:border-primary resize-none"
              placeholder="编辑消息..."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="text-xs"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitEdit}
                disabled={!editContent.trim()}
                className="text-xs"
              >
                重新发送
              </Button>
            </div>
          </div>
        ) : content ? (
          <div className={cn(
            "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 shadow-sm",
            "relative"
          )}>
            <p className="text-sm leading-relaxed">{content}</p>
            {isEdited && (
              <span className="text-[10px] opacity-60 mt-1 block text-right">（已编辑）</span>
            )}
          </div>
        ) : null}
      </div>

      {/* Avatar - show collaborator or default user */}
      <div className="flex-shrink-0">
        {collaborator ? (
          <CollaboratorBadge collaborator={collaborator} size="md" />
        ) : (
          <UserAvatar name="" size="md" showName={false} showMenu={false} />
        )}
      </div>
    </div>
  );
};

export default UserMessage;
