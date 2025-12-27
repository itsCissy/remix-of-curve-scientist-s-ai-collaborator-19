import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Branch, Collaborator } from "@/hooks/useBranches";
import { GitBranch, MessageSquare, Trash2, ArrowLeft, ZoomIn, ZoomOut, Maximize2, Plus, Clock, Sparkles } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  onMergeBranch?: (branchId: string, conclusion?: string) => void;
  onBack: () => void;
  messageCountByBranch?: Record<string, number>;
  messagesByBranch?: Record<string, { content: string; role: string }[]>;
  onCreateBranch?: (parentBranchId: string, name: string, inheritContext: boolean) => void;
}

const BranchTreeView = ({
  branches,
  collaborators,
  currentBranchId,
  onSelectBranch,
  onDeleteBranch,
  onMergeBranch,
  onBack,
  messageCountByBranch = {},
  messagesByBranch = {},
  onCreateBranch,
}: BranchTreeViewProps) => {
  // Canvas pan and zoom state
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Create branch dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [parentBranchId, setParentBranchId] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState("");
  const [inheritContext, setInheritContext] = useState(true);

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

  // Card dimensions
  const CARD_WIDTH = 320;
  const CARD_HEIGHT = 200;
  const CARD_GAP_X = 140;
  const CARD_GAP_Y = 60;

  // Render single branch card with glassmorphism
  const renderCard = (node: BranchNode, x: number, y: number) => {
    const isSelected = node.id === currentBranchId;
    const isMainBranch = node.is_main;

    return (
      <div
        key={node.id}
        className={cn(
          "absolute group cursor-pointer transition-all duration-300 ease-out",
          "rounded-2xl overflow-hidden",
          "hover:-translate-y-2 hover:shadow-2xl",
          // Glassmorphism effect
          "backdrop-blur-xl",
          isMainBranch 
            ? "bg-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20" 
            : "bg-card/60 border border-border/40 shadow-lg",
          isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
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
          isMainBranch 
            ? "bg-gradient-to-br from-primary/15 via-transparent to-primary/5" 
            : "bg-gradient-to-br from-muted/30 via-transparent to-muted/10"
        )} />
        
        {/* Card Header */}
        <div className={cn(
          "relative flex items-center justify-between px-4 py-3",
          isMainBranch 
            ? "border-b border-primary/20" 
            : "border-b border-border/30"
        )}>
          <div className="flex items-center gap-3">
            {/* Branch icon */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "backdrop-blur-sm",
              isMainBranch 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-muted/50 text-muted-foreground border border-border/30"
            )}>
              {isMainBranch ? <Sparkles className="w-5 h-5" /> : <GitBranch className="w-5 h-5" />}
            </div>
            
            <div className="flex flex-col">
              <span className={cn(
                "font-bold text-base leading-tight",
                isMainBranch ? "text-primary" : "text-foreground"
              )}>
                {node.name}
              </span>
              {isMainBranch && (
                <span className="text-[10px] text-primary/70 font-medium">
                  主线会话
                </span>
              )}
            </div>
          </div>

          {/* Actions - visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!node.is_main && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBranch(node.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-destructive/15 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive/70" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>删除分支</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        
        {/* Summary Content */}
        <div className="relative px-4 py-3 flex-1">
          <p className={cn(
            "text-sm leading-relaxed line-clamp-3",
            node.summary ? "text-foreground/80" : "text-muted-foreground/50 italic"
          )}>
            {node.summary || node.description || "暂无会话内容，双击进入开始对话"}
          </p>
        </div>
        
        {/* Footer */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2.5",
          "border-t",
          isMainBranch ? "border-primary/15 bg-primary/5" : "border-border/20 bg-muted/20"
        )}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(node.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{node.messageCount || 0}</span>
            </div>
          </div>
          
          {node.children.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
              <GitBranch className="w-3 h-3" />
              <span>{node.children.length}</span>
            </div>
          )}
        </div>

        {/* Create branch button - visible on hover */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => handleCreateBranchClick(node.id, e)}
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
          isMainBranch ? "shadow-[inset_0_0_30px_rgba(var(--primary),0.1)]" : "shadow-[inset_0_0_30px_rgba(255,255,255,0.05)]"
        )} />
      </div>
    );
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

    return (
      <div className="relative" style={{ width: maxX, height: maxY, minWidth: 600, minHeight: 400 }}>
        {/* SVG connections with flow animation */}
        <svg 
          className="absolute inset-0 pointer-events-none" 
          style={{ width: maxX, height: maxY }}
        >
          <defs>
            {/* Main branch gradient */}
            <linearGradient id="mainConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            </linearGradient>
            
            {/* Normal branch gradient */}
            <linearGradient id="normalConnectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.4" />
              <stop offset="50%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.3" />
            </linearGradient>

            {/* Flow animation pattern */}
            <pattern id="flowPattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform={`translate(${-animationOffset * 2}, 0)`}>
              <circle cx="2" cy="10" r="1.5" fill="hsl(var(--primary))" opacity="0.8" />
            </pattern>
          </defs>
          
          {connections.map((conn, idx) => {
            const midX = (conn.fromX + conn.toX) / 2;
            const path = `M ${conn.fromX} ${conn.fromY} C ${midX + 40} ${conn.fromY}, ${midX - 40} ${conn.toY}, ${conn.toX} ${conn.toY}`;
            
            return (
              <g key={idx}>
                {/* Glow effect */}
                <path
                  d={path}
                  fill="none"
                  stroke={conn.isMain ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth="8"
                  opacity="0.1"
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
                
                {/* End dot */}
                <circle 
                  cx={conn.toX} 
                  cy={conn.toY} 
                  r="5" 
                  fill={conn.isMain ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
                  opacity="0.5"
                />
              </g>
            );
          })}
        </svg>
        
        {/* Render cards */}
        {positions.map(({ node, x, y }) => renderCard(node, x, y))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            返回对话
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">分支视图</h1>
              <p className="text-xs text-muted-foreground">{branches.length} 个会话分支</p>
            </div>
          </div>
        </div>
        
        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/30">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>缩小</TooltipContent>
            </Tooltip>
            
            <span className="text-xs font-medium text-muted-foreground w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>放大</TooltipContent>
            </Tooltip>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重置视图</TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {/* Infinite canvas */}
      <div 
        ref={canvasRef}
        className={cn(
          "flex-1 overflow-hidden relative",
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
          className="absolute origin-top-left transition-transform duration-100"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          {renderBranchTree()}
        </div>
      </div>

      {/* Hint text */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/60 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30">
        双击卡片进入对话 · 拖拽画布移动 · Ctrl + 滚轮缩放
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
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
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
    </div>
  );
};

export default BranchTreeView;
