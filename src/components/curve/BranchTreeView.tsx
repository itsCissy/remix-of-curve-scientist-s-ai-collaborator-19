import { useState, useMemo, useCallback, useRef } from "react";
import { Branch, Collaborator } from "@/hooks/useBranches";
import { GitBranch, MessageSquare, Trash2, ArrowLeft, ZoomIn, ZoomOut, Maximize2, GitMerge, Move } from "lucide-react";
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
  // Canvas pan and zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Extract summary and questions from messages
  const extractBranchData = useCallback((branchId: string): { summary: string; questions: string[] } => {
    const messages = messagesByBranch[branchId] || [];
    
    // Extract user questions (first 3)
    const userMessages = messages.filter(m => m.role === 'user');
    const questions = userMessages.slice(0, 3).map(m => {
      const text = m.content?.slice(0, 50) || '';
      return text.length >= 50 ? text + '...' : text;
    });
    
    // Extract summary from last assistant message
    let summary = '';
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    
    if (lastAssistantMessage?.content) {
      const conclusionMatch = lastAssistantMessage.content.match(/<conclusion>([\s\S]*?)<\/conclusion>/);
      if (conclusionMatch) {
        summary = conclusionMatch[1].trim().slice(0, 300);
      } else {
        // Extract first meaningful paragraph
        const cleanContent = lastAssistantMessage.content.replace(/<[^>]+>/g, '');
        const paragraphs = cleanContent.split('\n').filter(p => p.trim().length > 20);
        summary = paragraphs.slice(0, 3).join(' ').slice(0, 300);
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
      setScale((prev) => Math.min(Math.max(prev + delta, 0.25), 2));
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.25));
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
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

  // Card dimensions for layout
  const CARD_WIDTH = 360;
  const CARD_GAP_X = 120;
  const CARD_GAP_Y = 60;

  // Render curved connection line using SVG
  const renderConnection = (
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number, 
    key: string
  ) => {
    // Control points for bezier curve
    const midX = (fromX + toX) / 2;
    
    const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
    
    return (
      <path
        key={key}
        d={path}
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="2"
        className="transition-all duration-300"
      />
    );
  };

  // Calculate positions and render nodes
  const renderBranchTree = () => {
    if (buildTree.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 shadow-lg">
            <GitBranch className="w-10 h-10 opacity-40" />
          </div>
          <p className="font-medium text-lg">暂无分支</p>
          <p className="text-sm mt-1">发送消息后将自动创建主线分支</p>
        </div>
      );
    }

    // Calculate positions for each node
    const positions = new Map<string, { x: number; y: number; height: number }>();
    const connections: { fromId: string; toId: string }[] = [];
    
    let currentY = 0;
    
    const calculateNodeHeight = (node: BranchNode): number => {
      // Base height for card header and summary
      let height = 180;
      // Add height for questions
      if (node.questions && node.questions.length > 0) {
        height += node.questions.length * 40 + 20;
      }
      return height;
    };

    const layoutNode = (node: BranchNode, depth: number, startY: number): number => {
      const height = calculateNodeHeight(node);
      const x = depth * (CARD_WIDTH + CARD_GAP_X);
      
      if (node.children.length === 0) {
        positions.set(node.id, { x, y: startY, height });
        return startY + height + CARD_GAP_Y;
      }
      
      // Layout children first to calculate total height
      let childY = startY;
      node.children.forEach(child => {
        connections.push({ fromId: node.id, toId: child.id });
        childY = layoutNode(child, depth + 1, childY);
      });
      
      // Center parent node vertically among children
      const firstChild = positions.get(node.children[0].id);
      const lastChild = positions.get(node.children[node.children.length - 1].id);
      
      if (firstChild && lastChild) {
        const centerY = (firstChild.y + lastChild.y + lastChild.height) / 2 - height / 2;
        positions.set(node.id, { x, y: Math.max(startY, centerY), height });
      } else {
        positions.set(node.id, { x, y: startY, height });
      }
      
      return childY;
    };

    // Layout all root nodes
    buildTree.forEach(root => {
      currentY = layoutNode(root, 0, currentY);
    });

    // Generate SVG connections
    const svgConnections: JSX.Element[] = [];
    connections.forEach(({ fromId, toId }) => {
      const fromPos = positions.get(fromId);
      const toPos = positions.get(toId);
      
      if (fromPos && toPos) {
        const fromX = fromPos.x + CARD_WIDTH;
        const fromY = fromPos.y + fromPos.height / 2;
        const toX = toPos.x;
        const toY = toPos.y + toPos.height / 2;
        
        svgConnections.push(renderConnection(fromX, fromY, toX, toY, `${fromId}-${toId}`));
      }
    });

    // Calculate SVG dimensions
    let maxX = 0;
    let maxY = 0;
    positions.forEach(pos => {
      maxX = Math.max(maxX, pos.x + CARD_WIDTH + 100);
      maxY = Math.max(maxY, pos.y + pos.height + 100);
    });

    // Render cards
    const renderCard = (node: BranchNode) => {
      const pos = positions.get(node.id);
      if (!pos) return null;
      
      const isSelected = node.id === currentBranchId;
      const canMerge = !node.is_main && onMergeBranch;

      return (
        <div
          key={node.id}
          className={cn(
            "absolute group cursor-pointer transition-all duration-200",
            "bg-card border rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1"
          )}
          style={{
            left: pos.x,
            top: pos.y,
            width: CARD_WIDTH,
          }}
          onClick={() => onSelectBranch(node.id)}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">{node.name}</span>
              {node.is_main && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                  主线
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* Merge button */}
              {canMerge && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMergeBranch(node.id, node.summary);
                      }}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-primary/10 transition-all"
                    >
                      <GitMerge className="w-4 h-4 text-primary" />
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
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>删除分支</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white font-medium ml-1"
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
          </div>
          
          {/* Summary Content */}
          <div className="px-4 py-3 border-b border-border/30">
            {node.summary ? (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-6">
                {node.summary}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">
                暂无会话内容
              </p>
            )}
          </div>
          
          {/* Questions List */}
          {node.questions && node.questions.length > 0 && (
            <div className="px-4 py-3 space-y-2">
              {node.questions.map((question, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground font-medium">Q</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    问题{idx + 1}：{question}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-b-xl">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{node.messageCount} 条消息</span>
            </div>
            {node.children.length > 0 && (
              <span className="text-[10px] text-muted-foreground bg-accent/80 px-1.5 py-0.5 rounded-md">
                {node.children.length} 子分支
              </span>
            )}
          </div>

          {/* Selected indicator */}
          {isSelected && (
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-full shadow-lg" />
          )}
        </div>
      );
    };

    // Collect all nodes for rendering
    const allNodes: BranchNode[] = [];
    const collectNodes = (nodes: BranchNode[]) => {
      nodes.forEach(node => {
        allNodes.push(node);
        collectNodes(node.children);
      });
    };
    collectNodes(buildTree);

    return (
      <div className="relative" style={{ width: maxX, height: maxY }}>
        {/* SVG layer for connections */}
        <svg 
          className="absolute inset-0 pointer-events-none" 
          style={{ width: maxX, height: maxY }}
        >
          {svgConnections}
        </svg>
        
        {/* Cards layer */}
        {allNodes.map(renderCard)}
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
        {/* Dot grid background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: `${24 * scale}px ${24 * scale}px`,
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
          <div className="p-8">
            {renderBranchTree()}
          </div>
        </div>

        {/* Drag hint */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border">
          <Move className="w-3.5 h-3.5" />
          <span>拖拽移动</span>
        </div>
      </div>
    </div>
  );
};

export default BranchTreeView;
