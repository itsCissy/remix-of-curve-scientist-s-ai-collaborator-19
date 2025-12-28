import { useState, useMemo } from "react";
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
  Filter,
  Clock,
  MessageSquare,
  GitBranch,
  ChevronDown,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface FileCenterProps {
  assets: FileAsset[];
  isLoading: boolean;
  onDeleteAsset: (id: string) => Promise<boolean>;
  onNavigateToMessage: (messageId: string, branchId: string) => void;
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
  isLoading,
  onDeleteAsset,
  onNavigateToMessage,
}: FileCenterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<FileAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<FileAsset | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        !searchQuery ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.branch_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || asset.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [assets, searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    return assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

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

  const handleNavigate = (asset: FileAsset) => {
    if (asset.message_id && asset.branch_id) {
      onNavigateToMessage(asset.message_id, asset.branch_id);
    } else {
      toast.error("无法定位到源消息");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">文件中心</h1>
              <p className="text-sm text-muted-foreground">
                共 {assets.length} 个文件
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文件名或分支..."
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {selectedCategory
                  ? categoryConfig[selectedCategory as keyof typeof categoryConfig]?.label
                  : "所有类型"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                <span className="flex-1">所有类型</span>
                <Badge variant="secondary">{assets.length}</Badge>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                  >
                    <Icon className={cn("w-4 h-4 mr-2", config.color)} />
                    <span className="flex-1">{config.label}</span>
                    <Badge variant="secondary">{categoryCounts[key] || 0}</Badge>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            全部
          </button>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                  selectedCategory === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
                {categoryCounts[key] > 0 && (
                  <span className="text-xs opacity-75">({categoryCounts[key]})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">暂无文件</p>
            <p className="text-sm mt-1">
              {searchQuery || selectedCategory
                ? "没有找到匹配的文件"
                : "会话中生成的文件将自动归档到这里"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">文件名</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>来源分支</TableHead>
                <TableHead>生成时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const FileIcon = getFileIcon(asset.type);
                const categoryInfo =
                  categoryConfig[asset.category as keyof typeof categoryConfig];

                return (
                  <TableRow
                    key={asset.id}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            categoryInfo?.bgColor || "bg-muted"
                          )}
                        >
                          <FileIcon
                            className={cn(
                              "w-4 h-4",
                              categoryInfo?.color || "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{asset.name}</p>
                          <p className="text-xs text-muted-foreground uppercase">
                            .{asset.type}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("gap-1", categoryInfo?.bgColor)}
                      >
                        {categoryInfo?.icon && (
                          <categoryInfo.icon
                            className={cn("w-3 h-3", categoryInfo.color)}
                          />
                        )}
                        {categoryInfo?.label || asset.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.size || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span className="text-sm">{asset.branch_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm">{formatDate(asset.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {asset.content && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewAsset(asset)}
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(asset)}
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {asset.message_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleNavigate(asset)}
                            title="跳转到会话"
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(asset)}
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </ScrollArea>

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
              <th
                key={i}
                className="px-3 py-2 text-left font-medium text-foreground border border-border"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/30">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-3 py-1.5 text-muted-foreground border border-border"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {content.trim().split("\n").length > 50 && (
        <div className="py-2 text-center text-sm text-muted-foreground">
          显示前 50 行...
        </div>
      )}
    </div>
  );
};

export default FileCenter;
