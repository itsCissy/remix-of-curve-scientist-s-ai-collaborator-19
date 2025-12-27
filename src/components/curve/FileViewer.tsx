import { useState } from "react";
import { 
  FileJson, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Database, 
  File,
  Copy,
  Download,
  Check,
  ChevronDown,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface FileAttachment {
  name: string;
  type: 'duckdb' | 'json' | 'pdf' | 'excel' | 'md' | 'html' | 'csv' | 'unknown';
  content?: string;
  size?: string;
  url?: string;
}

const fileTypeConfig: Record<FileAttachment['type'], {
  icon: typeof FileJson;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
}> = {
  duckdb: {
    icon: Database,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    label: "DuckDB"
  },
  json: {
    icon: FileJson,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    label: "JSON"
  },
  pdf: {
    icon: FileText,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    label: "PDF"
  },
  excel: {
    icon: FileSpreadsheet,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    label: "Excel"
  },
  md: {
    icon: FileCode,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    label: "Markdown"
  },
  html: {
    icon: FileCode,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    label: "HTML"
  },
  csv: {
    icon: FileSpreadsheet,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    label: "CSV"
  },
  unknown: {
    icon: File,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
    label: "File"
  }
};

interface FileCardProps {
  file: FileAttachment;
  onCopy?: () => void;
  onExport?: () => void;
}

const FileCard = ({ file, onCopy, onExport }: FileCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const config = fileTypeConfig[file.type];
  const Icon = config.icon;

  const handleCopy = async () => {
    if (file.content) {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    }
  };

  const handleExport = () => {
    if (file.content || file.url) {
      const blob = new Blob([file.content || ""], { type: "text/plain" });
      const url = file.url || URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (!file.url) URL.revokeObjectURL(url);
      toast.success(`已导出 ${file.name}`);
      onExport?.();
    }
  };

  return (
    <div className={cn(
      "group rounded-lg border overflow-hidden transition-all duration-300 hover:shadow-md",
      config.bgColor,
      config.borderColor
    )}>
      {/* File header */}
      <div className="flex items-center gap-3 p-3">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg transition-transform duration-200 group-hover:scale-110",
          config.bgColor
        )}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {file.name}
            </span>
            <span className={cn(
              "px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase",
              config.bgColor,
              config.color
            )}>
              {config.label}
            </span>
          </div>
          {file.size && (
            <span className="text-xs text-muted-foreground">{file.size}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {file.content && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-background/50"
                onClick={handleCopy}
                title="复制内容"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-background/50"
                onClick={() => setIsExpanded(!isExpanded)}
                title="展开预览"
              >
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-background/50"
            onClick={handleExport}
            title="导出文件"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
          </Button>
          {file.url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-background/50"
              onClick={() => window.open(file.url, '_blank')}
              title="在新标签页打开"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Content preview */}
      {isExpanded && file.content && (
        <div className="border-t border-border/50 animate-fade-in">
          <div className="p-3 max-h-64 overflow-auto">
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
              {file.content.slice(0, 2000)}
              {file.content.length > 2000 && (
                <span className="text-muted-foreground/50">
                  {"\n"}... (内容已截断，共 {file.content.length} 字符)
                </span>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

interface FileViewerProps {
  files: FileAttachment[];
  className?: string;
}

const FileViewer = ({ files, className }: FileViewerProps) => {
  if (!files || files.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <File className="w-3.5 h-3.5" />
        <span>附件 ({files.length})</span>
      </div>
      <div className="grid gap-2">
        {files.map((file, index) => (
          <FileCard 
            key={`${file.name}-${index}`} 
            file={file} 
          />
        ))}
      </div>
    </div>
  );
};

// Helper function to detect file type from filename
export const detectFileType = (filename: string): FileAttachment['type'] => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'duckdb':
    case 'db':
      return 'duckdb';
    case 'json':
      return 'json';
    case 'pdf':
      return 'pdf';
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'md':
    case 'markdown':
      return 'md';
    case 'html':
    case 'htm':
      return 'html';
    case 'csv':
      return 'csv';
    default:
      return 'unknown';
  }
};

export default FileViewer;
