import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Branch, Collaborator } from "@/hooks/useBranches";
import { useNavigation } from "@/contexts/NavigationContext";
import { GitBranch, MessageSquare, Trash2, ArrowLeft, ZoomIn, ZoomOut, Maximize2, Plus, Clock, Sparkles, AlertTriangle, MoreHorizontal, Pencil, Copy, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface BranchNode extends Branch {
  children: BranchNode[];
  messageCount?: number;
  summary?: string;
  questions?: string[];
}

interface BranchTreeViewProps {
  branches: Branch[];
  collaborators: Collaborator[];
  currentBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
  onDeleteBranch: (branchId: string) => void;
  onRenameBranch?: (branchId: string, newName: string) => void;
  onCopyBranch?: (branchId: string) => void;
  onMergeBranch?: (branchId: string, conclusion?: string) => void;
  onBack: () => void;
  messageCountByBranch?: Record<string, number>;
  messagesByBranch?: Record<string, { content: string; role: string }[]>;
  onCreateBranch?: (parentBranchId: string, name: string, inheritContext: boolean) => void;
  onOpenFolder?: (branchId: string, branchName: string) => void;
}

// Card dimensions
  const CARD_WIDTH = 360;
  const CARD_HEIGHT = 280;
  const CARD_GAP_X = 160;
  const CARD_GAP_Y = 80;

// BranchCard Component - Extracted as separate component
interface BranchCardProps {
  node: BranchNode;
  x: number;
  y: number;
  isSelected: boolean;
  onSelectBranch: (branchId: string) => void;
  onOpenFolder?: (branchId: string, branchName: string) => void;
  onRenameBranchClick: (node: BranchNode) => void;
  onCopyBranchClick: (node: BranchNode) => void;
  onDeleteBranchClick: (node: BranchNode) => void;
  onCreateBranchClick: (branchId: string, e: React.MouseEvent) => void;
  formatDate: (dateString: string) => string;
}

const BranchCard = ({
  node,
  x,
  y,
  isSelected,
  onSelectBranch,
  onOpenFolder,
  onRenameBranchClick,
  onCopyBranchClick,
  onDeleteBranchClick,
  onCreateBranchClick,
  formatDate,
}: BranchCardProps) => {
    const isMainBranch = node.is_main;
    const hasContent = (node.messageCount || 0) > 0;

    return (
      <div
        className={cn(
          "absolute group cursor-pointer transition-all duration-300 ease-out",
          "rounded-2xl overflow-hidden flex flex-col",
          "hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/10",
          "backdrop-blur-xl",
          // Unified default state for all cards
          "bg-card/60 border border-border/40 shadow-lg",
          // Selected/Active state - applies to any card when selected
          isSelected && "bg-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
        style={{
          left: x,
          top: y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }}
        onDoubleClick={() => onSelectBranch(node.id)}
      >
        {/* Background gradient overlay */}
        <div className={cn(
          "absolute inset-0 opacity-60 pointer-events-none",
          isSelected 
            ? "bg-gradient-to-br from-primary/15 via-transparent to-primary/5" 
            : "bg-gradient-to-br from-muted/30 via-transparent to-muted/10"
        )} />
        
        {/* === HEADER === */}
        <div className={cn(
          "relative flex items-center justify-between px-4 py-3 shrink-0",
          isSelected 
            ? "border-b border-primary/20" 
            : "border-b border-border/30"
        )}>
          <div className="flex items-center gap-3">
            {/* Branch icon */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "backdrop-blur-sm",
              isSelected 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-muted/50 text-muted-foreground border border-border/30"
            )}>
              {isMainBranch ? <Sparkles className="w-5 h-5" /> : <GitBranch className="w-5 h-5" />}
            </div>
            
            <div className="flex items-center">
              <span className={cn(
                "font-bold text-base leading-tight",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {node.name}
              </span>
            </div>
          </div>

        {/* Right side actions - Folder and More menu */}
        <div className="flex items-center gap-2">
          {/* Folder icon - visible on hover */}
          {onOpenFolder && (
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenFolder(node.id, node.name);
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    "hover:bg-[rgba(18,58,255,0.08)] hover:scale-110",
                    "opacity-0 group-hover:opacity-100"
                  )}
                  onMouseEnter={(e) => {
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#123aff';
                  }}
                  onMouseLeave={(e) => {
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#52525b';
                  }}
                >
                  <Folder className="w-4 h-4" style={{ color: '#52525b' }} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="z-[9999]">查看文件夹</TooltipContent>
            </Tooltip>
          )}

          {/* More menu - visible on hover */}
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      "hover:bg-[rgba(18,58,255,0.08)] hover:scale-110",
                      "opacity-0 group-hover:opacity-100"
                    )}
                    onMouseEnter={(e) => {
                      const icon = e.currentTarget.querySelector('svg');
                      if (icon) icon.style.color = '#123aff';
                    }}
                    onMouseLeave={(e) => {
                      const icon = e.currentTarget.querySelector('svg');
                      if (icon) icon.style.color = '#52525b';
                    }}
                  >
                    <MoreHorizontal className="w-4 h-4" style={{ color: '#52525b' }} />
                  </button>
                </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-popover border border-border shadow-lg z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem 
                onClick={() => onRenameBranchClick(node)}
                className="gap-2 cursor-pointer text-slate-700"
              >
                <Pencil className="w-4 h-4 text-slate-500" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onCopyBranchClick(node)}
                className="gap-2 cursor-pointer text-slate-700"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                复制分支
              </DropdownMenuItem>
              {!node.is_main && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteBranchClick(node)}
                    className="gap-2 cursor-pointer text-slate-700"
                  >
                    <Trash2 className="w-4 h-4 text-slate-500" />
                    删除分支
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent className="z-[9999]">更多操作</TooltipContent>
          </Tooltip>
        </div>
        </div>
        
        {/* === CONTENT === */}
        <div className="relative px-4 py-3 flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Core Conclusion Summary */}
          {hasContent ? (
            <>
              <div className="flex-1">
                <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium mb-1.5">
                  核心结论
                </p>
                <p className={cn(
                  "text-sm leading-relaxed line-clamp-3",
                  node.summary ? "text-foreground/80" : "text-muted-foreground/50 italic"
                )}>
                  {node.summary || "暂无结论摘要"}
                </p>
              </div>
              
              {/* Key Questions Preview */}
              {node.questions && node.questions.length > 0 && (
                <div className="shrink-0">
                  <p className="text-[11px] text-muted-foreground/70 uppercase tracking-wider font-medium mb-2">
                    关键问题
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {node.questions.slice(0, 3).map((question, idx) => (
                      <span 
                        key={idx}
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs",
                          "bg-muted/50 text-muted-foreground border border-border/30",
                          "max-w-[140px] truncate"
                        )}
                        title={question}
                      >
                        {question}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Empty state
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                "bg-muted/30 border border-border/30"
              )}>
                <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground/60 italic">
                暂无会话内容
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                双击进入开始对话
              </p>
            </div>
          )}
        </div>
        
        {/* === ACTION / FOOTER === */}
        <div className={cn(
          "relative flex items-center justify-between px-4 py-2.5 shrink-0",
          "border-t",
          isSelected ? "border-primary/15 bg-primary/5" : "border-border/20 bg-muted/20"
        )}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(node.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{node.messageCount || 0} 条消息</span>
            </div>
          </div>
          
          {node.children.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
              <GitBranch className="w-3 h-3" />
              <span>{node.children.length} 个分支</span>
            </div>
          )}
        </div>

        {/* Create branch button - visible on hover */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
            onClick={(e) => onCreateBranchClick(node.id, e)}
              className={cn(
                "absolute -right-3 top-1/2 -translate-y-1/2",
                "w-8 h-8 rounded-full",
                "bg-primary text-primary-foreground",
                "flex items-center justify-center",
                "shadow-lg shadow-primary/30",
                "opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2",
                "transition-all duration-300",
                "hover:scale-110 hover:shadow-xl"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>创建分支</p>
          </TooltipContent>
        </Tooltip>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-gradient-to-b from-primary via-primary to-primary/50 rounded-r-full" />
        )}
        
        {/* Hover glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
          isSelected ? "shadow-[inset_0_0_30px_rgba(var(--primary),0.1)]" : "shadow-[inset_0_0_30px_rgba(255,255,255,0.05)]"
        )} />
      </div>
    );
};

const BranchTreeView = ({
  branches,
  collaborators,
  currentBranchId,
  onSelectBranch,
  onDeleteBranch,
  onRenameBranch,
  onCopyBranch,
  onMergeBranch,
  onBack,
  messageCountByBranch = {},
  messagesByBranch = {},
  onCreateBranch,
  onOpenFolder,
}: BranchTreeViewProps) => {
  const { isFolderOpen, contentWidth } = useNavigation();
  
  // Canvas pan and zoom state
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const previousFolderOpenRef = useRef<boolean>(false);
  
  // Create branch dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [parentBranchId, setParentBranchId] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [inheritContext, setInheritContext] = useState(true);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchNode | null>(null);

  // Rename dialog state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [branchToRename, setBranchToRename] = useState<BranchNode | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Animation state for connection lines
  const [animationOffset, setAnimationOffset] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Extract summary from messages
  const extractBranchData = useCallback((branchId: string): { summary: string; questions: string[] } => {
    const messages = messagesByBranch[branchId] || [];
    
    const userMessages = messages.filter(m => m.role === 'user');
    const questions = userMessages.slice(0, 3).map(m => {
      const text = m.content?.slice(0, 50) || '';
      return text.length >= 50 ? text + '...' : text;
    });
    
    let summary = '';
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    
    if (lastAssistantMessage?.content) {
      const conclusionMatch = lastAssistantMessage.content.match(/<conclusion>([\s\S]*?)<\/conclusion>/);
      if (conclusionMatch) {
        summary = conclusionMatch[1].trim().slice(0, 200);
      } else {
        const cleanContent = lastAssistantMessage.content.replace(/<[^>]+>/g, '');
        const paragraphs = cleanContent.split('\n').filter(p => p.trim().length > 20);
        summary = paragraphs.slice(0, 2).join(' ').slice(0, 200);
      }
    }
    
    return { summary, questions };
  }, [messagesByBranch]);

  // Build tree structure
  const buildTree = useMemo((): BranchNode[] => {
    const nodeMap = new Map<string, BranchNode>();
    const roots: BranchNode[] = [];

    branches.forEach((branch) => {
      const data = extractBranchData(branch.id);
      nodeMap.set(branch.id, {
        ...branch,
        children: [],
        messageCount: messageCountByBranch[branch.id] || 0,
        summary: data.summary,
        questions: data.questions,
      });
    });

    branches.forEach((branch) => {
      const node = nodeMap.get(branch.id)!;
      if (branch.parent_branch_id && nodeMap.has(branch.parent_branch_id)) {
        nodeMap.get(branch.parent_branch_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [branches, messageCountByBranch, extractBranchData]);

  // Pan and zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest('[data-canvas-bg]')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.3), 2));
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.3));
  const resetView = () => {
    setScale(0.85);
    setPosition({ x: 80, y: 80 });
  };

  // Fit view to center selected node when folder opens/closes
  const fitViewToSelectedNode = useCallback(() => {
    if (!currentBranchId || !canvasRef.current || !canvasContentRef.current) return;
    
    // Find the selected node's position by recalculating layout
    const positions: { node: BranchNode; x: number; y: number }[] = [];
    const layoutNode = (node: BranchNode, depth: number, startY: number): number => {
      const x = depth * (CARD_WIDTH + CARD_GAP_X);
      
      if (node.children.length === 0) {
        positions.push({ node, x, y: startY });
        return startY + CARD_HEIGHT + CARD_GAP_Y;
      }
      
      let childY = startY;
      const childPositions: number[] = [];
      
      node.children.forEach(child => {
        const childStart = childY;
        childY = layoutNode(child, depth + 1, childY);
        const childPos = positions.find(p => p.node.id === child.id);
        if (childPos) {
          childPositions.push(childPos.y);
        }
      });
      
      let parentY = startY;
      if (childPositions.length > 0) {
        const avgChildY = childPositions.reduce((a, b) => a + b, 0) / childPositions.length;
        parentY = avgChildY;
        parentY = Math.max(startY, parentY);
      }
      
      positions.push({ node, x, y: parentY });
      return childY;
    };
    
    let currentY = 0;
    buildTree.forEach(root => {
      currentY = layoutNode(root, 0, currentY);
    });
    
    const nodePos = positions.find(p => p.node.id === currentBranchId);
    if (!nodePos) return;
    
    // Get canvas container dimensions
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const containerWidth = canvasRect.width;
    const containerHeight = canvasRect.height;
    
    // Calculate center position for the node
    const nodeCenterX = nodePos.x + CARD_WIDTH / 2;
    const nodeCenterY = nodePos.y + CARD_HEIGHT / 2;
    
    // Desired position: node center should be at container center
    const scaledNodeX = nodeCenterX * scale;
    const scaledNodeY = nodeCenterY * scale;
    
    // Calculate new position to center the node
    const newX = containerWidth / 2 - scaledNodeX;
    const newY = containerHeight / 2 - scaledNodeY;
    
    // Smooth transition
    setPosition({ x: newX, y: newY });
  }, [currentBranchId, buildTree, scale]);
  
  // Watch for folder open/close changes
  useEffect(() => {
    if (previousFolderOpenRef.current !== isFolderOpen) {
      previousFolderOpenRef.current = isFolderOpen;
      // Delay to allow layout to settle
      setTimeout(() => {
        fitViewToSelectedNode();
      }, 100);
    }
  }, [isFolderOpen, fitViewToSelectedNode]);

  // 当左侧内容宽度变化时，重新居中选中分支
  useEffect(() => {
    fitViewToSelectedNode();
  }, [contentWidth, fitViewToSelectedNode]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle create branch click
  const handleCreateBranchClick = (branchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setParentBranchId(branchId);
    setNewBranchName("");
    setInheritContext(true);
    setShowCreateDialog(true);
  };

  const handleConfirmCreateBranch = () => {
    if (parentBranchId && newBranchName.trim() && onCreateBranch) {
      onCreateBranch(parentBranchId, newBranchName.trim(), inheritContext);
    }
    setShowCreateDialog(false);
    setParentBranchId(null);
    setNewBranchName("");
  };

  // Handle delete branch click
  const handleDeleteBranchClick = (node: BranchNode) => {
    setBranchToDelete(node);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (branchToDelete) {
      onDeleteBranch(branchToDelete.id);
    }
    setShowDeleteDialog(false);
    setBranchToDelete(null);
  };

  // Handle rename branch
  const handleRenameBranchClick = (node: BranchNode) => {
    setBranchToRename(node);
    setRenameValue(node.name);
    setShowRenameDialog(true);
  };

  const handleConfirmRename = () => {
    if (branchToRename && renameValue.trim() && onRenameBranch) {
      onRenameBranch(branchToRename.id, renameValue.trim());
      toast({
        title: "重命名成功",
        description: `分支已重命名为"${renameValue.trim()}"`,
      });
    }
    setShowRenameDialog(false);
    setBranchToRename(null);
    setRenameValue("");
  };

  // Handle copy branch
  const handleCopyBranchClick = (node: BranchNode) => {
    if (onCopyBranch) {
      onCopyBranch(node.id);
      toast({
        title: "复制分支",
        description: `已创建"${node.name}"的副本`,
      });
    } else {
      toast({
        title: "功能暂未开放",
        description: "复制分支功能正在开发中",
        variant: "destructive",
      });
    }
  };

  // Render tree with positions
  const renderBranchTree = () => {
    if (buildTree.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <div className="w-24 h-24 rounded-2xl bg-muted/30 backdrop-blur-sm flex items-center justify-center mb-6 border border-border/30">
            <GitBranch className="w-12 h-12 opacity-40" />
          </div>
          <p className="font-semibold text-xl text-foreground/80">暂无会话分支</p>
          <p className="text-sm mt-2 text-muted-foreground/70">发送消息后将自动创建主线分支</p>
        </div>
      );
    }

    // Layout calculation
    const positions: { node: BranchNode; x: number; y: number }[] = [];
    const connections: { fromX: number; fromY: number; toX: number; toY: number; isMain: boolean }[] = [];
    
    const layoutNode = (node: BranchNode, depth: number, startY: number): number => {
      const x = depth * (CARD_WIDTH + CARD_GAP_X);
      
      if (node.children.length === 0) {
        positions.push({ node, x, y: startY });
        return startY + CARD_HEIGHT + CARD_GAP_Y;
      }
      
      let childY = startY;
      const childPositions: number[] = [];
      
      node.children.forEach(child => {
        const childStart = childY;
        childY = layoutNode(child, depth + 1, childY);
        const childPos = positions.find(p => p.node.id === child.id);
        if (childPos) {
          childPositions.push(childPos.y);
        }
      });
      
      // Center parent among children
      let parentY = startY;
      if (childPositions.length > 0) {
        const avgChildY = childPositions.reduce((a, b) => a + b, 0) / childPositions.length;
        parentY = avgChildY;
        parentY = Math.max(startY, parentY);
      }
      
      positions.push({ node, x, y: parentY });
      
      // Add connections to children
      node.children.forEach(child => {
        const childPos = positions.find(p => p.node.id === child.id);
        if (childPos) {
          connections.push({
            fromX: x + CARD_WIDTH,
            fromY: parentY + CARD_HEIGHT / 2,
            toX: childPos.x,
            toY: childPos.y + CARD_HEIGHT / 2,
            isMain: node.is_main,
          });
        }
      });
      
      return childY;
    };

    let currentY = 0;
    buildTree.forEach(root => {
      currentY = layoutNode(root, 0, currentY);
    });

    // Calculate canvas size
    let maxX = 0;
    let maxY = 0;
    positions.forEach(p => {
      maxX = Math.max(maxX, p.x + CARD_WIDTH + 200);
      maxY = Math.max(maxY, p.y + CARD_HEIGHT + 150);
    });

    const computedMinWidth = Math.max(
      480,
      Math.min((contentWidth || 960) - 40, 1200)
    );

    return (
      <div
        className="relative"
        style={{ width: maxX, height: maxY, minWidth: computedMinWidth, minHeight: 400 }}
      >
        {/* SVG connections with flow animation */}
        <svg 
          className="absolute inset-0 pointer-events-none" 
          style={{ width: maxX, height: maxY }}
        >
          <defs>
            {/* Main branch gradient - XtalPi Blue gradient */}
            <linearGradient id="mainConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#123aff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#123aff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#123aff" stopOpacity="0.4" />
            </linearGradient>
            
            {/* Normal branch gradient */}
            <linearGradient id="normalConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.4" />
              <stop offset="50%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.3" />
            </linearGradient>

            {/* Flow animation pattern - XtalPi Blue */}
            <pattern id="flowPattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform={`translate(${-animationOffset * 2}, 0)`}>
              <circle cx="2" cy="10" r="1.5" fill="#123aff" opacity="0.8" />
            </pattern>
          </defs>
          
          {connections.map((conn, idx) => {
            const midX = (conn.fromX + conn.toX) / 2;
            const path = `M ${conn.fromX} ${conn.fromY} C ${midX + 40} ${conn.fromY}, ${midX - 40} ${conn.toY}, ${conn.toX} ${conn.toY}`;
            
            return (
              <g key={idx}>
                {/* Glow effect - XtalPi Blue */}
                <path
                  d={path}
                  fill="none"
                  stroke={conn.isMain ? "#123aff" : "hsl(var(--muted-foreground))"}
                  strokeWidth="8"
                  opacity="0.15"
                  strokeLinecap="round"
                />
                
                {/* Main line */}
                <path
                  d={path}
                  fill="none"
                  stroke={conn.isMain ? "url(#mainConnectionGradient)" : "url(#normalConnectionGradient)"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                
                {/* Flow animation dots */}
                {conn.isMain && (
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#flowPattern)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                )}
                
                {/* End dot - XtalPi Blue */}
                <circle 
                  cx={conn.toX} 
                  cy={conn.toY} 
                  r="5" 
                  fill={conn.isMain ? "#123aff" : "hsl(var(--muted-foreground))"} 
                  opacity="0.7"
                />
              </g>
            );
          })}
        </svg>
        
        {/* Render cards */}
        {positions.map(({ node, x, y }) => (
          <BranchCard
            key={node.id}
            node={node}
            x={x}
            y={y}
            isSelected={node.id === currentBranchId}
            onSelectBranch={onSelectBranch}
            onOpenFolder={onOpenFolder}
            onRenameBranchClick={handleRenameBranchClick}
            onCopyBranchClick={handleCopyBranchClick}
            onDeleteBranchClick={handleDeleteBranchClick}
            onCreateBranchClick={handleCreateBranchClick}
            formatDate={formatDate}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-background overflow-hidden flex-1 min-w-0 transition-all duration-300">
      {/* Infinite canvas - Full height */}
      <div 
        ref={canvasRef}
        className={cn(
          "absolute inset-0 overflow-hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        data-canvas-bg
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)
            `,
            backgroundSize: `${32 * scale}px ${32 * scale}px`,
            backgroundPosition: `${position.x}px ${position.y}px`,
          }}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/[0.02] via-transparent to-muted/[0.05]" />
        
        {/* Canvas content */}
        <div
          ref={canvasContentRef}
          className="absolute origin-top-left transition-transform duration-300"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {renderBranchTree()}
        </div>

        {/* Status Floating Layer - Top Left */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md rounded-lg px-3 py-2 border border-border/50 shadow-sm">
            <p className="text-xs font-medium text-foreground">
              {branches.length} 个会话分支
            </p>
        </div>
      </div>

        {/* Control Floating Layer - Top Right */}
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-lg border border-border/50 shadow-lg p-1.5 flex items-center gap-1">
            {/* Zoom controls */}
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 group"
                  style={{ 
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#123aff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#52525b';
                  }}
                  onClick={zoomOut}
                >
                  <ZoomOut className="w-4 h-4" style={{ color: '#52525b' }} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>缩小</TooltipContent>
            </Tooltip>
            
            <span 
              className="text-xs font-medium w-12 text-center transition-colors"
              style={{ color: scale !== 0.85 ? '#123aff' : '#52525b' }}
            >
              {Math.round(scale * 100)}%
            </span>
            
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 group"
                  style={{ 
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#123aff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#52525b';
                  }}
                  onClick={zoomIn}
                >
                  <ZoomIn className="w-4 h-4" style={{ color: '#52525b' }} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>放大</TooltipContent>
            </Tooltip>

            <div className="w-px h-5 bg-border mx-0.5" />
            
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 group"
                  style={{ 
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#123aff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) icon.style.color = '#52525b';
                  }}
                  onClick={resetView}
                >
                  <Maximize2 className="w-4 h-4" style={{ color: '#52525b' }} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重置视图</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Hint text - Bottom center */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="text-xs text-muted-foreground/60 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30 shadow-sm">
        双击卡片进入对话 · 拖拽画布移动 · Ctrl + 滚轮缩放
          </div>
        </div>
      </div>

      {/* Create Branch Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              创建新分支
            </DialogTitle>
            <DialogDescription>
              从当前会话创建一个新的分支进行探索
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branchName">分支名称</Label>
              <Input
                id="branchName"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="输入分支名称..."
                className="bg-muted/30"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/30">
              <div className="space-y-0.5">
                <Label htmlFor="inheritContext" className="font-medium">携带历史上下文</Label>
                <p className="text-xs text-muted-foreground">
                  开启后，新分支将继承父分支的对话历史
                </p>
              </div>
              <Switch
                id="inheritContext"
                checked={inheritContext}
                onCheckedChange={setInheritContext}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              onClick={() => setShowCreateDialog(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmCreateBranch}
              disabled={!newBranchName.trim()}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              创建分支
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-lg">确认删除此会话分支？</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              此操作不可逆。删除该卡片将同步永久删除该分支内存储的所有会话历史记录及相关数据。
              {branchToDelete && (
                <span className="block mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <span className="text-foreground font-medium">分支名称：</span>
                  <span className="text-foreground ml-1">{branchToDelete.name}</span>
                  <span className="block text-xs text-muted-foreground mt-1">
                    包含 {branchToDelete.messageCount || 0} 条消息
                    {branchToDelete.children.length > 0 && (
                      <span className="text-destructive/80 font-medium">
                        ，以及 {branchToDelete.children.length} 个子分支
                      </span>
                    )}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="px-4">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="px-4 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              重命名分支
            </DialogTitle>
            <DialogDescription>
              为该会话分支设置一个新名称
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="renameBranch">分支名称</Label>
              <Input
                id="renameBranch"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="输入新的分支名称..."
                className="bg-muted/30"
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              className="bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              onClick={() => setShowRenameDialog(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmRename}
              disabled={!renameValue.trim() || renameValue.trim() === branchToRename?.name}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              确认重命名
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchTreeView;
