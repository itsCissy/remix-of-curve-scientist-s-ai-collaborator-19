import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Branch, Collaborator } from "@/hooks/useBranches";
import { GitBranch, MessageSquare, Trash2, ArrowLeft, ChevronDown, ChevronRight, Sparkles, HelpCircle, ZoomIn, ZoomOut, Maximize2, GitMerge, Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";

interface BranchNode extends Branch {
  children: BranchNode[];
  messageCount?: number;
  lastMessage?: string;
  firstQuestion?: string;
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
}: BranchTreeViewProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(branches.map(b => b.id)));
  
  // Canvas pan and zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract conclusion and question from messages
  const extractBranchSummary = useCallback((branchId: string): { conclusion: string; question: string } => {
    const messages = messagesByBranch[branchId] || [];
    
    const firstUserMessage = messages.find(m => m.role === 'user');
    const question = firstUserMessage?.content?.slice(0, 80) || '';
    
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    let conclusion = '';
    
    if (lastAssistantMessage?.content) {
      const conclusionMatch = lastAssistantMessage.content.match(/<conclusion>([\s\S]*?)<\/conclusion>/);
      if (conclusionMatch) {
        conclusion = conclusionMatch[1].trim().slice(0, 150);
      } else {
        conclusion = lastAssistantMessage.content
          .replace(/<[^>]+>/g, '')
          .split('\n')
          .find(line => line.trim().length > 20)?.slice(0, 150) || '';
      }
    }
    
    return { conclusion, question };
  }, [messagesByBranch]);

  // Build tree structure
  const buildTree = useMemo((): BranchNode[] => {
    const nodeMap = new Map<string, BranchNode>();
    const roots: BranchNode[] = [];

    branches.forEach((branch) => {
      const summary = extractBranchSummary(branch.id);
      nodeMap.set(branch.id, {
        ...branch,
        children: [],
        messageCount: messageCountByBranch[branch.id] || 0,
        lastMessage: summary.conclusion,
        firstQuestion: summary.question,
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
  }, [branches, messageCountByBranch, extractBranchSummary]);

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
      setScale((prev) => Math.min(Math.max(prev + delta, 0.25), 2));
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.25));
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getCollaboratorName = (collaboratorId: string | null): string => {
    if (!collaboratorId) return "系统";
    const collab = collaborators.find((c) => c.id === collaboratorId);
    return collab?.name || "未知用户";
  };

  const getCollaboratorColor = (collaboratorId: string | null): string => {
    if (!collaboratorId) return "hsl(var(--muted-foreground))";
    const collab = collaborators.find((c) => c.id === collaboratorId);
    return collab?.avatar_color || "hsl(var(--muted-foreground))";
  };

  const renderBranchCard = (node: BranchNode, depth: number = 0, isLast: boolean = true, parentLines: boolean[] = []): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = node.id === currentBranchId;
    const canMerge = !node.is_main && onMergeBranch;

    return (
      <div key={node.id} className="relative">
        {/* Connection lines from parent */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
            {parentLines.map((showLine, index) => (
              showLine && (
                <div
                  key={index}
                  className="absolute w-0.5 bg-gradient-to-b from-primary/30 via-border to-border/50"
                  style={{
                    left: `${index * 300 + 150}px`,
                    top: 0,
                    bottom: 0,
                  }}
                />
              )
            ))}
          </div>
        )}

        <div 
          className="flex items-start"
          style={{ marginLeft: depth * 300 }}
        >
          {/* Horizontal connector line */}
          {depth > 0 && (
            <div className="relative flex items-center" style={{ width: 50 }}>
              {/* Vertical line segment */}
              <div 
                className="absolute w-0.5 bg-gradient-to-b from-primary/40 to-border"
                style={{ 
                  left: -150,
                  top: isLast ? 0 : -24,
                  height: isLast ? 56 : 80,
                }}
              />
              {/* Horizontal line */}
              <div 
                className="absolute h-0.5 bg-gradient-to-r from-primary/40 to-border"
                style={{ 
                  left: -150,
                  top: 56,
                  width: 150,
                }}
              />
              {/* Connection dot */}
              <div 
                className="absolute w-3 h-3 rounded-full bg-primary/60 border-2 border-background shadow-sm"
                style={{ left: -6, top: 50 }}
              />
            </div>
          )}

          {/* Branch Card */}
          <div
            className={cn(
              "group relative w-72 rounded-xl border-2 cursor-pointer transition-all duration-200",
              "bg-card/95 backdrop-blur-sm hover:bg-accent/30 hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5",
              isSelected 
                ? "border-primary shadow-xl shadow-primary/15 bg-primary/5" 
                : "border-border/60 shadow-md",
              node.is_main && "ring-2 ring-primary/30"
            )}
            onClick={() => onSelectBranch(node.id)}
          >
            {/* Card Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
              {hasChildren && (
                <button
                  onClick={(e) => toggleExpand(node.id, e)}
                  className="p-1 -ml-1 hover:bg-accent rounded-md transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}
              
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm",
                  node.is_main 
                    ? "bg-gradient-to-br from-primary/30 to-primary/10 text-primary" 
                    : "bg-gradient-to-br from-accent to-muted text-muted-foreground"
                )}
              >
                <GitBranch className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate text-foreground">
                    {node.name}
                  </span>
                  {node.is_main && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-md shadow-sm">
                      主线
                    </span>
                  )}
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white font-medium shadow-sm ring-2 ring-background"
                    style={{ backgroundColor: getCollaboratorColor(node.created_by) }}
                  >
                    {getCollaboratorName(node.created_by).charAt(0)}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>创建者: {getCollaboratorName(node.created_by)}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Card Content */}
            <div className="px-3 py-3 space-y-2.5 min-h-[60px]">
              {node.firstQuestion && (
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <HelpCircle className="w-3 h-3 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {node.firstQuestion}
                  </p>
                </div>
              )}

              {node.lastMessage && (
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-2">
                    {node.lastMessage}
                  </p>
                </div>
              )}

              {node.description && !node.firstQuestion && !node.lastMessage && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {node.description}
                </p>
              )}

              {!node.firstQuestion && !node.lastMessage && !node.description && (
                <p className="text-xs text-muted-foreground/60 italic">
                  暂无会话内容
                </p>
              )}
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/30 rounded-b-xl">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{node.messageCount} 条消息</span>
              </div>

              <div className="flex items-center gap-1">
                {hasChildren && (
                  <span className="text-[10px] text-muted-foreground bg-accent/80 px-1.5 py-0.5 rounded-md">
                    {node.children.length} 子分支
                  </span>
                )}
                
                {/* Merge button */}
                {canMerge && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMergeBranch(node.id, node.lastMessage);
                        }}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all"
                      >
                        <GitMerge className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>合并到主线</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                {/* Delete button */}
                {!node.is_main && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBranch(node.id);
                        }}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>删除分支</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-primary rounded-r-full shadow-lg" />
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-5 space-y-5">
            {node.children.map((child, index) => 
              renderBranchCard(
                child, 
                depth + 1, 
                index === node.children.length - 1,
                [...parentLines, index !== node.children.length - 1]
              )
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">分支视图</h2>
          <p className="text-xs text-muted-foreground">
            共 {branches.length} 个分支 · 拖拽画布导航 · Ctrl+滚轮缩放
          </p>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={zoomOut} className="h-7 w-7">
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>缩小</TooltipContent>
          </Tooltip>
          
          <div className="w-24">
            <Slider
              value={[scale * 100]}
              min={25}
              max={200}
              step={5}
              onValueChange={([v]) => setScale(v / 100)}
              className="cursor-pointer"
            />
          </div>
          
          <span className="text-xs text-muted-foreground w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={zoomIn} className="h-7 w-7">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>放大</TooltipContent>
          </Tooltip>
          
          <div className="w-px h-4 bg-border" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={resetView} className="h-7 w-7">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重置视图</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Canvas area */}
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
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * scale}px ${40 * scale}px`,
            backgroundPosition: `${position.x}px ${position.y}px`,
          }}
        />

        {/* Draggable content */}
        <div
          ref={contentRef}
          className="absolute"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <div className="p-8 min-w-max">
            {buildTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 shadow-lg">
                  <GitBranch className="w-10 h-10 opacity-40" />
                </div>
                <p className="font-medium text-lg">暂无分支</p>
                <p className="text-sm mt-1">发送消息后将自动创建主线分支</p>
              </div>
            ) : (
              <div className="space-y-5">
                {buildTree.map((node, index) => 
                  renderBranchCard(node, 0, index === buildTree.length - 1, [])
                )}
              </div>
            )}
          </div>
        </div>

        {/* Drag hint */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border">
          <Move className="w-3.5 h-3.5" />
          <span>拖拽移动</span>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t bg-card/80 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <GitBranch className="w-3 h-3 text-primary" />
            </div>
            <span>主线分支</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-accent to-muted flex items-center justify-center">
              <GitBranch className="w-3 h-3 text-muted-foreground" />
            </div>
            <span>分歧分支</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
              <HelpCircle className="w-3 h-3 text-blue-500" />
            </div>
            <span>核心提问</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <span>核心结论</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
              <GitMerge className="w-3 h-3 text-primary" />
            </div>
            <span>合并分支</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchTreeView;
