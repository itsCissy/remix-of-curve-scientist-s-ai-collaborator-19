import { useState, KeyboardEvent, useRef, useCallback } from "react";
import { Send, Loader2, Paperclip, Image, X, FileText, File } from "lucide-react";
import AgentSelector from "./AgentSelector";
import { Agent } from "@/lib/agents";
import { cn } from "@/lib/utils";
import MoleculeEditorDialog from "./MoleculeEditorDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "file";
}

interface ChatInputProps {
  onSend: (message: string, files?: UploadedFile[]) => void;
  isLoading?: boolean;
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

const ChatInput = ({ onSend, isLoading, selectedAgent, onSelectAgent }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showMoleculeEditor, setShowMoleculeEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((input.trim() || uploadedFiles.length > 0) && !isLoading) {
      onSend(input, uploadedFiles.length > 0 ? uploadedFiles : undefined);
      setInput("");
      setUploadedFiles([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: UploadedFile[] = [];

    fileArray.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles((prev) => [
            ...prev,
            {
              id,
              file,
              preview: e.target?.result as string,
              type: "image",
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push({
          id,
          file,
          type: "file",
        });
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext || "")) return <FileText className="w-5 h-5 text-red-500" />;
    if (["doc", "docx"].includes(ext || "")) return <FileText className="w-5 h-5 text-blue-500" />;
    if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileText className="w-5 h-5 text-emerald-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="px-6 py-4">
      <div className="max-w-[900px] mx-auto">
        <div
          className={cn(
            "bg-card rounded-xl shadow-input border overflow-hidden transition-all duration-200",
            isDragging ? "border-primary border-2 bg-primary/5" : "border-border"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 rounded-xl border-2 border-dashed border-primary pointer-events-none">
              <div className="text-center">
                <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-primary">拖放文件到这里</p>
              </div>
            </div>
          )}

          {/* Uploaded files preview */}
          {uploadedFiles.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="relative group"
                >
                  {uploadedFile.type === "image" ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted">
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveFile(uploadedFile.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border border-border max-w-[200px]">
                      {getFileIcon(uploadedFile.file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{uploadedFile.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(uploadedFile.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，按 Enter 发送..."
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[24px] max-h-[200px]"
              style={{ height: "auto" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 200) + "px";
              }}
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              {/* Molecule structure editor button - First */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowMoleculeEditor(true)}
                      className="p-2 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-violet-500"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="8" cy="8" r="2.5" />
                        <circle cx="16" cy="8" r="2.5" />
                        <circle cx="12" cy="15" r="2.5" />
                        <line x1="10" y1="9" x2="13" y2="13.5" />
                        <line x1="14" y1="9" x2="11" y2="13.5" />
                      </svg>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Structure</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Image upload button */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground"
                title="上传图片"
              >
                <Image className="w-5 h-5" />
              </button>

              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground"
                title="上传文件"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Agent Selector */}
              <AgentSelector
                selectedAgent={selectedAgent}
                onSelectAgent={onSelectAgent}
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Molecule Editor Dialog */}
      <MoleculeEditorDialog
        open={showMoleculeEditor}
        onOpenChange={setShowMoleculeEditor}
        onExport={(smiles) => {
          // Insert SMILES into input
          setInput((prev) => {
            const prefix = prev.trim() ? prev + " " : "";
            return prefix + "`" + smiles + "`";
          });
        }}
      />
    </div>
  );
};

export default ChatInput;
