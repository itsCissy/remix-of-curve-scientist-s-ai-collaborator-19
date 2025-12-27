import { useState, useMemo } from "react";
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

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
  language?: string;
}> = {
  duckdb: {
    icon: Database,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    label: "DuckDB",
    language: "sql"
  },
  json: {
    icon: FileJson,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    label: "JSON",
    language: "json"
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
    label: "Markdown",
    language: "markdown"
  },
  html: {
    icon: FileCode,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    label: "HTML",
    language: "html"
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

// Get language from file extension for syntax highlighting
const getLanguageFromExtension = (filename: string): string | undefined => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    yaml: 'yaml',
    yml: 'yaml',
    xml: 'xml',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    graphql: 'graphql',
    gql: 'graphql',
    dockerfile: 'docker',
    makefile: 'makefile',
    toml: 'toml',
    ini: 'ini',
    env: 'bash',
  };
  return ext ? languageMap[ext] : undefined;
};

interface CodePreviewProps {
  content: string;
  language?: string;
  maxLength?: number;
}

const CodePreview = ({ content, language, maxLength = 2000 }: CodePreviewProps) => {
  const isDarkMode = useMemo(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  }, []);

  const truncatedContent = content.slice(0, maxLength);
  const isTruncated = content.length > maxLength;

  if (language) {
    return (
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={isDarkMode ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            padding: '0.75rem',
            fontSize: '0.75rem',
            borderRadius: 0,
            background: 'transparent',
          }}
          wrapLines
          wrapLongLines
        >
          {truncatedContent}
        </SyntaxHighlighter>
        {isTruncated && (
          <div className="px-3 pb-2 text-xs text-muted-foreground/60 italic">
            ... (内容已截断，共 {content.length.toLocaleString()} 字符)
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3">
      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
        {truncatedContent}
        {isTruncated && (
          <span className="text-muted-foreground/50">
            {"\n"}... (内容已截断，共 {content.length.toLocaleString()} 字符)
          </span>
        )}
      </pre>
    </div>
  );
};

// CSV Table Preview
const CsvPreview = ({ content, maxRows = 10 }: { content: string; maxRows?: number }) => {
  const rows = useMemo(() => {
    const lines = content.trim().split('\n').slice(0, maxRows + 1);
    return lines.map(line => {
      // Simple CSV parsing (handles basic cases)
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    });
  }, [content, maxRows]);

  const totalRows = content.trim().split('\n').length;

  if (rows.length === 0) return null;

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            {headers.map((header, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium text-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/30 hover:bg-muted/20">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-1.5 text-muted-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalRows > maxRows + 1 && (
        <div className="px-3 py-2 text-xs text-muted-foreground/60 italic text-center">
          显示前 {maxRows} 行，共 {totalRows - 1} 行数据
        </div>
      )}
    </div>
  );
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

  // Determine the language for syntax highlighting
  const language = useMemo(() => {
    if (config.language) return config.language;
    return getLanguageFromExtension(file.name);
  }, [config.language, file.name]);

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

  const renderPreview = () => {
    if (!file.content) return null;

    // Special handling for CSV - show as table
    if (file.type === 'csv') {
      return <CsvPreview content={file.content} />;
    }

    // For JSON, try to format it nicely
    if (file.type === 'json') {
      try {
        const formatted = JSON.stringify(JSON.parse(file.content), null, 2);
        return <CodePreview content={formatted} language="json" />;
      } catch {
        return <CodePreview content={file.content} language="json" />;
      }
    }

    // For other code files
    return <CodePreview content={file.content} language={language} />;
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
            {language && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
                {language}
              </span>
            )}
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

      {/* Content preview with syntax highlighting */}
      {isExpanded && file.content && (
        <div className="border-t border-border/50 animate-fade-in max-h-80 overflow-auto">
          {renderPreview()}
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
