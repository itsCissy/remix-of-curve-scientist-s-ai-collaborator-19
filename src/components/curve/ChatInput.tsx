import { useState, KeyboardEvent, useRef, useCallback, useEffect } from "react";
import { Send, Loader2, Paperclip, Image, X, FileText, File, GitBranch, Plus } from "lucide-react";
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
  externalContent?: string;
  onClearExternalContent?: () => void;
  agentSwitched?: boolean; // For visual feedback when agent changes
}

const ChatInput = ({ 
  onSend, 
  isLoading, 
  selectedAgent, 
  onSelectAgent,
  externalContent,
  onClearExternalContent,
  agentSwitched,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showMoleculeEditor, setShowMoleculeEditor] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle external content injection
  useEffect(() => {
    if (externalContent) {
      // Check if there's existing content
      if (input.trim()) {
        // Append to existing content with a separator
        setInput((prev) => prev + "\n\n" + externalContent);
      } else {
        setInput(externalContent);
      }

      // Focus and position cursor at first variable placeholder {{...}}
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          
          // Find first {{...}} placeholder
          const match = externalContent.match(/\{\{([^}]+)\}\}/);
          if (match && match.index !== undefined) {
            const startPos = input.trim() 
              ? input.length + 2 + match.index 
              : match.index;
            const endPos = startPos + match[0].length;
            textareaRef.current.setSelectionRange(startPos, endPos);
          }

          // Adjust height
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
        }
      }, 50);

      onClearExternalContent?.();
    }
  }, [externalContent, onClearExternalContent]);

  // Visual feedback when agent switches
  useEffect(() => {
    if (agentSwitched) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [agentSwitched, selectedAgent.id]);

  // 清理发送防抖定时器
  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
      }
    };
  }, []);

  // 当 isLoading 从 true 变为 false 时，重置 isSending 状态
  useEffect(() => {
    if (!isLoading && isSending) {
      setIsSending(false);
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current);
        sendTimeoutRef.current = null;
      }
    }
  }, [isLoading, isSending]);

  const handleSend = () => {
    // 防抖：防止用户在卡顿时连续点击
    if (isSending || isLoading) {
      console.log("[ChatInput] Send blocked: already sending");
      return;
    }

    if (!input.trim() && uploadedFiles.length === 0) {
      return;
    }

    // 立即设置发送状态，阻止重复点击
    setIsSending(true);

    // 清除之前的定时器（如果有）
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current);
    }

    // 延迟重置 isSending 状态（300ms 防抖）
    sendTimeoutRef.current = setTimeout(() => {
      setIsSending(false);
    }, 300);

    // 执行发送（先保存当前值再清空）
    const currentInput = input;
    const currentFiles = uploadedFiles.length > 0 ? uploadedFiles : undefined;
    
    setInput("");
    setUploadedFiles([]);
    
    // 在状态清空后调用 onSend
    onSend(currentInput, currentFiles);
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

  // Unified upload handler - opens file picker with all file types
  const handleUnifiedUpload = () => {
    // Create a temporary input that accepts both images and files
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*'; // Accept all file types
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        processFiles(target.files);
      }
    };
    input.click();
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

  const hasContent = input.trim().length > 0 || uploadedFiles.length > 0;

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-2xl shadow-lg border overflow-hidden transition-all duration-200 w-full relative",
          isDragging ? "border-xtalpi-blue border-2 bg-xtalpi-blue/5" : "border-border/50"
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

        {/* Upper Layer: File Preview Cards */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 pt-4 pb-2 flex flex-wrap gap-2">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="relative group flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 max-w-[240px]"
              >
                {uploadedFile.type === "image" ? (
                  <>
                    <div className="relative w-10 h-10 rounded-md overflow-hidden border border-slate-200 bg-muted flex-shrink-0">
                      <img
                        src={uploadedFile.preview}
                        alt={uploadedFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-slate-700">{uploadedFile.file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(uploadedFile.file.size)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-slate-700">{uploadedFile.file.name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(uploadedFile.file.size)}</p>
                    </div>
                  </>
                )}
                <button
                  onClick={() => handleRemoveFile(uploadedFile.id)}
                  className="flex-shrink-0 p-1 rounded-md hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upper Layer: Textarea */}
        <div className="px-4 pt-3 pb-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="发送消息给 Curve..."
            disabled={isLoading}
            rows={1}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[24px] max-h-[200px] overflow-y-auto"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 200) + "px";
            }}
          />
        </div>

        {/* Lower Layer: Function Toolbar */}
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left Group: Plugin buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Unified Upload button - merged image and file upload */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleUnifiedUpload}
                    className="w-9 h-9 p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>上传文件</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Molecule structure editor - kept separate */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowMoleculeEditor(true)}
                    className="w-9 h-9 p-2 rounded-lg transition-all duration-200 text-slate-500 hover:text-[#123aff] hover:bg-[rgba(18,58,255,0.08)] flex items-center justify-center"
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
                  <p>分子结构编辑器</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right Group: Agent Selector and Send button - right-aligned */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Agent Selector - moved to right side */}
            <div className={cn(
              "transition-all duration-300 rounded-lg",
              showFlash && "ring-2 ring-[#123aff] ring-opacity-50 bg-[rgba(18,58,255,0.08)]"
            )}>
              <AgentSelector
                selectedAgent={selectedAgent}
                onSelectAgent={onSelectAgent}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!hasContent || isLoading || isSending}
              className={cn(
                "h-9 w-9 rounded-lg transition-all duration-200 flex items-center justify-center",
                !hasContent || isLoading || isSending
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-[#123aff] text-white hover:bg-curve-hover hover:text-[#123aff] shadow-sm"
              )}
            >
              {isLoading || isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
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
    </>
  );
};

export default ChatInput;
