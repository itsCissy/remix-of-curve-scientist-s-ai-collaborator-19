import { useState, useMemo, useCallback } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Atom,
  Download,
  Eye,
  Navigation,
  Trash2,
  Search,
  X,
  Clock,
  ChevronRight,
  ChevronDown,
  Loader2,
  FolderOpen,
  Folder,
  FolderTree,
  Package,
  Home,
  GitBranch,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { FileAsset } from "@/hooks/useFileAssets";
import { Branch } from "@/hooks/useBranches";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FileCenterProps {
  assets: FileAsset[];
  branches: Branch[];
  isLoading: boolean;
  projectName?: string;
  onDeleteAsset: (id: string) => Promise<boolean>;
  onNavigateToMessage: (messageId: string, branchId: string) => void;
  onNavigateToBranch?: (branchId: string) => void;
  onBack?: () => void;
}

// Build branch tree structure
interface BranchNode {
  branch: Branch;
  children: BranchNode[];
  files: FileAsset[];
  totalFiles: number;
}

const categoryConfig = {
  data: {
    label: "数据表格",
    icon: FileSpreadsheet,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  structures: {
    label: "分子结构",
    icon: Atom,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  reports: {
    label: "分析报告",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
};

const fileTypeIcons: Record<string, typeof FileCode> = {
  csv: FileSpreadsheet,
  json: FileCode,
  pdb: Atom,
  mol: Atom,
  sdf: Atom,
  pdf: FileText,
  md: FileText,
  html: FileCode,
  default: FileCode,
};

const FileCenter = ({
  assets,
  branches,
  isLoading,
  projectName = "项目",
  onDeleteAsset,
  onNavigateToMessage,
  onNavigateToBranch,
  onBack,
}: FileCenterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"tree" | "all">("tree");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<FileAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<FileAsset | null>(null);

  // Build branch tree
  const branchTree = useMemo(() => {
    const branchMap = new Map<string, BranchNode>();
    const roots: BranchNode[] = [];

    // Initialize nodes
    branches.forEach((branch) => {
      branchMap.set(branch.id, {
        branch,
        children: [],
        files: assets.filter((a) => a.branch_id === branch.id),
        totalFiles: 0,
      });
    });

    // Build tree structure
    branches.forEach((branch) => {
      const node = branchMap.get(branch.id)!;
      if (branch.parent_branch_id && branchMap.has(branch.parent_branch_id)) {
        branchMap.get(branch.parent_branch_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Calculate total files (including children)
    const calcTotal = (node: BranchNode): number => {
      node.totalFiles = node.files.length + node.children.reduce((sum, child) => sum + calcTotal(child), 0);
      return node.totalFiles;
    };
    roots.forEach(calcTotal);

    // Sort: main branch first, then by name
    roots.sort((a, b) => {
      if (a.branch.is_main) return -1;
      if (b.branch.is_main) return 1;
      return a.branch.name.localeCompare(b.branch.name);
    });

    return roots;
  }, [branches, assets]);

  // Get breadcrumb path for selected branch
  const breadcrumbPath = useMemo(() => {
    if (!selectedBranchId) return [];
    
    const path: Branch[] = [];
    let currentId: string | null = selectedBranchId;
    
    while (currentId) {
      const branch = branches.find((b) => b.id === currentId);
      if (branch) {
        path.unshift(branch);
        currentId = branch.parent_branch_id;
      } else {
        break;
      }
    }
    
    return path;
  }, [selectedBranchId, branches]);

  // Get files for current view
  const currentFiles = useMemo(() => {
    let files: FileAsset[];
    
    if (viewMode === "all" || !selectedBranchId) {
      files = assets;
    } else {
      files = assets.filter((a) => a.branch_id === selectedBranchId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      files = files.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.branch_name?.toLowerCase().includes(query)
      );
    }

    return files;
  }, [assets, selectedBranchId, viewMode, searchQuery]);

  const toggleFolder = useCallback((branchId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  }, []);

  const handleDeleteClick = (asset: FileAsset) => {
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (assetToDelete) {
      await onDeleteAsset(assetToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAssetToDelete(null);
  };

  const handleDownload = (asset: FileAsset) => {
    if (asset.content || asset.url) {
      const blob = new Blob([asset.content || ""], { type: "text/plain" });
      const url = asset.url || URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = asset.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (!asset.url) URL.revokeObjectURL(url);
      toast.success(`已下载 ${asset.name}`);
    }
  };

  const handleDownloadFolder = useCallback(async (branchId: string) => {
    const branchFiles = assets.filter((a) => a.branch_id === branchId);
    if (branchFiles.length === 0) {
      toast.error("该文件夹没有文件");
      return;
    }

    // Download each file
    for (const file of branchFiles) {
      handleDownload(file);
      await new Promise((r) => setTimeout(r, 300)); // Stagger downloads
    }
    
    toast.success(`已下载 ${branchFiles.length} 个文件`);
  }, [assets]);

  const handleNavigate = (asset: FileAsset) => {
    if (asset.message_id && asset.branch_id) {
      onNavigateToMessage(asset.message_id, asset.branch_id);
    } else {
      toast.error("无法定位到源消息");
    }
  };

  const handleBranchClick = (branchId: string) => {
    if (onNavigateToBranch) {
      onNavigateToBranch(branchId);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (type: string) => {
    return fileTypeIcons[type] || fileTypeIcons.default;
  };

  const isDarkMode = useMemo(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  }, []);

  // Recursive folder tree renderer
  const renderFolderNode = (node: BranchNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.branch.id);
    const isSelected = selectedBranchId === node.branch.id;
    const hasChildren = node.children.length > 0;
    const hasFiles = node.files.length > 0;

    return (
      <div key={node.branch.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
            depth > 0 && "ml-4"
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {/* Expand/Collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFolder(node.branch.id);
            }}
            className={cn(
              "p-0.5 rounded hover:bg-muted transition-colors",
              !hasChildren && !hasFiles && "invisible"
            )}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Folder Icon */}
          <div
            onClick={() => setSelectedBranchId(node.branch.id)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            {isExpanded ? (
              <FolderOpen
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  node.branch.is_main ? "text-primary" : "text-amber-500"
                )}
              />
            ) : (
              <Folder
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  node.branch.is_main ? "text-primary" : "text-amber-500"
                )}
              />
            )}
            <span className="truncate text-sm font-medium">{node.branch.name}</span>
            {node.branch.is_main && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                主线
              </Badge>
            )}
          </div>

          {/* File count */}
          <span className="text-xs text-muted-foreground">{node.totalFiles}</span>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            {node.files.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadFolder(node.branch.id);
                }}
                title="下载文件夹"
              >
                <Package className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Children & Files */}
        {isExpanded && (
          <div className="animate-fade-in">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
            {hasFiles && (
              <div className="ml-6 mt-1 space-y-0.5">
                {node.files.slice(0, 5).map((file) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    compact
                    depth={depth + 1}
                    onPreview={() => setPreviewAsset(file)}
                    onDownload={() => handleDownload(file)}
                    onNavigate={() => handleNavigate(file)}
                    onDelete={() => handleDeleteClick(file)}
                  />
                ))}
                {node.files.length > 5 && (
                  <button
                    onClick={() => setSelectedBranchId(node.branch.id)}
                    className="text-xs text-primary hover:underline pl-8"
                  >
                    查看全部 {node.files.length} 个文件...
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Header with Back Button */}
      {onBack && (
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回会话</span>
          </button>
          <span className="text-muted-foreground">|</span>
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">文件夹</h2>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Folder Tree */}
        <div className="w-72 border-r border-border flex flex-col bg-card/50">
          <div className="p-4 border-b border-border">
            {!onBack && (
              <div className="flex items-center gap-2 mb-3">
                <FolderTree className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">文件夹</h2>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("tree")}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  viewMode === "tree"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                按分支
              </button>
              <button
                onClick={() => {
                  setViewMode("all");
                  setSelectedBranchId(null);
                }}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  viewMode === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                全部
              </button>
            </div>
          </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : branchTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                暂无分支
              </div>
            ) : (
              branchTree.map((node) => renderFolderNode(node))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Breadcrumb */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setSelectedBranchId(null)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>{projectName}</span>
              </button>
              
              {breadcrumbPath.map((branch, index) => (
                <div key={branch.id} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <button
                    onClick={() => setSelectedBranchId(branch.id)}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      index === breadcrumbPath.length - 1
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {branch.is_main ? (
                      <Folder className="w-4 h-4 text-primary" />
                    ) : (
                      <Folder className="w-4 h-4 text-amber-500" />
                    )}
                    <span>{branch.name}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* File count */}
            <div className="text-sm text-muted-foreground">
              {currentFiles.length} 个文件
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件..."
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* File List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
          ) : currentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FolderOpen className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">暂无文件</p>
              <p className="text-sm mt-1">
                {searchQuery
                  ? "没有找到匹配的文件"
                  : selectedBranchId
                  ? "该分支暂无文件，开始对话后将自动归档"
                  : "会话中生成的文件将自动归档到对应分支"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {currentFiles.map((file) => (
                <FileListItem
                  key={file.id}
                  file={file}
                  showBranch={viewMode === "all" || !selectedBranchId}
                  onPreview={() => setPreviewAsset(file)}
                  onDownload={() => handleDownload(file)}
                  onNavigate={() => handleNavigate(file)}
                  onDelete={() => handleDeleteClick(file)}
                  onBranchClick={() => file.branch_id && handleBranchClick(file.branch_id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除此文件？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可逆。删除后，文件 "{assetToDelete?.name}" 将永久移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              预览 - {previewAsset?.name}
            </DialogTitle>
            {/* Preview Breadcrumb */}
            {previewAsset && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
                <Home className="w-3.5 h-3.5" />
                <span>{projectName}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <GitBranch className="w-3.5 h-3.5" />
                <span>{previewAsset.branch_name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground">{previewAsset.name}</span>
              </div>
            )}
          </DialogHeader>
          <ScrollArea className="flex-1 rounded-lg border border-border bg-muted/30">
            {previewAsset?.content && (
              <div className="p-4">
                {previewAsset.type === "csv" ? (
                  <CsvPreview content={previewAsset.content} />
                ) : (
                  <SyntaxHighlighter
                    language={previewAsset.type === "json" ? "json" : previewAsset.type}
                    style={isDarkMode ? oneDark : oneLight}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      fontSize: "0.875rem",
                      borderRadius: "0.5rem",
                      background: "transparent",
                    }}
                    wrapLines
                    wrapLongLines
                  >
                    {previewAsset.content}
                  </SyntaxHighlighter>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setPreviewAsset(null)}>
              关闭
            </Button>
            <Button onClick={() => previewAsset && handleDownload(previewAsset)}>
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

// File List Item Component
interface FileListItemProps {
  file: FileAsset;
  compact?: boolean;
  depth?: number;
  showBranch?: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onNavigate: () => void;
  onDelete: () => void;
  onBranchClick?: () => void;
}

const FileListItem = ({
  file,
  compact,
  depth = 0,
  showBranch,
  onPreview,
  onDownload,
  onNavigate,
  onDelete,
  onBranchClick,
}: FileListItemProps) => {
  const FileIcon = fileTypeIcons[file.type] || fileTypeIcons.default;
  const categoryInfo = categoryConfig[file.category as keyof typeof categoryConfig];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={onPreview}
      >
        <FileIcon className={cn("w-3.5 h-3.5 flex-shrink-0", categoryInfo?.color || "text-muted-foreground")} />
        <span className="text-sm truncate flex-1">{file.name}</span>
        <span className="text-xs text-muted-foreground">{file.size}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDownload(); }}>
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors group">
      {/* Icon */}
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", categoryInfo?.bgColor || "bg-muted")}>
        <FileIcon className={cn("w-5 h-5", categoryInfo?.color || "text-muted-foreground")} />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{file.name}</p>
          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", categoryInfo?.bgColor)}>
            {categoryInfo?.label || file.category}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span>{file.size || "-"}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(file.created_at)}
          </span>
          {showBranch && file.branch_name && (
            <>
              <span>•</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBranchClick?.();
                }}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                {file.branch_name}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {file.content && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview} title="预览">
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDownload} title="下载">
          <Download className="w-4 h-4" />
        </Button>
        {file.message_id && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNavigate} title="跳转到会话">
            <Navigation className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete} title="删除">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// CSV Preview Component
const CsvPreview = ({ content }: { content: string }) => {
  const rows = useMemo(() => {
    const lines = content.trim().split("\n").slice(0, 50);
    return lines.map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          cells.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    });
  }, [content]);

  if (rows.length === 0) return null;

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((header, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium text-foreground border border-border">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/30">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-1.5 text-muted-foreground border border-border">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {content.trim().split("\n").length > 50 && (
        <div className="py-2 text-center text-sm text-muted-foreground">显示前 50 行...</div>
      )}
    </div>
  );
};

export default FileCenter;
