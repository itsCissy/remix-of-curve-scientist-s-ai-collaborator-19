import UserAvatar from "./UserAvatar";
import { MessageAttachment } from "@/lib/messageUtils";
import { FileText, File } from "lucide-react";

interface UserMessageProps {
  content: string;
  attachments?: MessageAttachment[];
}

const UserMessage = ({ content, attachments }: UserMessageProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string, name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (type.startsWith("image/")) return null; // Will show preview
    if (["pdf"].includes(ext || "")) return <FileText className="w-4 h-4 text-red-300" />;
    if (["doc", "docx"].includes(ext || "")) return <FileText className="w-4 h-4 text-blue-300" />;
    if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileText className="w-4 h-4 text-emerald-300" />;
    return <File className="w-4 h-4 text-primary-foreground/70" />;
  };

  return (
    <div className="flex justify-end items-start gap-3 animate-fade-in">
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

        {/* Message content */}
        {content && (
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed">{content}</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <UserAvatar name="" size="md" showName={false} />
      </div>
    </div>
  );
};

export default UserMessage;
