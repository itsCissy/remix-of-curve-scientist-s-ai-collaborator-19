import { useState, useMemo, useCallback } from "react";
import { Branch, Collaborator } from "@/hooks/useBranches";
import { GitBranch, MessageSquare, Trash2, ArrowLeft, ChevronDown, ChevronRight, Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  onBack,
  messageCountByBranch = {},
  messagesByBranch = {},
}: BranchTreeViewProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(branches.map(b => b.id)));

  // Extract conclusion and question from messages
  const extractBranchSummary = useCallback((branchId: string): { conclusion: string; question: string } => {
    const messages = messagesByBranch[branchId] || [];
    
    // Find first user message as question
    const firstUserMessage = messages.find(m => m.role === 'user');
    const question = firstUserMessage?.content?.slice(0, 80) || '';
    
    // Find last assistant message and extract conclusion
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    let conclusion = '';
    
    if (lastAssistantMessage?.content) {
      // Try to extract <conclusion> tag content
      const conclusionMatch = lastAssistantMessage.content.match(/<conclusion>([\s\S]*?)<\/conclusion>/);
      if (conclusionMatch) {
        conclusion = conclusionMatch[1].trim().slice(0, 150);
      } else {
        // Otherwise take first paragraph
        conclusion = lastAssistantMessage.content
          .replace(/<[^>]+>/g, '')
          .split('\n')
          .find(line => line.trim().length > 20)?.slice(0, 150) || '';
      }
    }
    
    return { conclusion, question };
  }, [messagesByBranch]);

  // Build tree structure from flat branches
  const buildTree = useMemo((): BranchNode[] => {
    const nodeMap = new Map<string, BranchNode>();
    const roots: BranchNode[] = [];

    // Create nodes
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

    // Build tree relationships
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

    return (
      <div key={node.id} className="relative">
        {/* Connection lines from parent */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
            {parentLines.map((showLine, index) => (
              showLine && (
                <div
                  key={index}
                  className="absolute w-0.5 bg-gradient-to-b from-border to-border/50"
                  style={{
                    left: `${index * 280 + 140}px`,
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
          style={{ marginLeft: depth * 280 }}
        >
          {/* Horizontal connector line */}
          {depth > 0 && (
            <div className="relative flex items-center" style={{ width: 40 }}>
              {/* Vertical line segment */}
              <div 
                className="absolute w-0.5 bg-border"
                style={{ 
                  left: -140,
                  top: isLast ? 0 : -20,
                  height: isLast ? 48 : 68,
                }}
              />
              {/* Horizontal line */}
              <div 
                className="absolute h-0.5 bg-border"
                style={{ 
                  left: -140,
                  top: 48,
                  width: 140,
                }}
              />
              {/* Connection dot */}
              <div 
                className="absolute w-2.5 h-2.5 rounded-full bg-border border-2 border-background"
                style={{ left: -4, top: 44 }}
              />
            </div>
          )}

          {/* Branch Card */}
          <div
            className={cn(
              "group relative w-64 rounded-xl border-2 cursor-pointer transition-all duration-200",
              "bg-card hover:bg-accent/30 hover:border-primary/40 hover:shadow-lg",
              isSelected 
                ? "border-primary shadow-lg shadow-primary/10 bg-primary/5" 
                : "border-border/60",
              node.is_main && "ring-2 ring-primary/20"
            )}
            onClick={() => onSelectBranch(node.id)}
          >
            {/* Card Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
              {/* Expand button */}
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
              
              {/* Branch icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                  node.is_main 
                    ? "bg-primary/20 text-primary" 
                    : "bg-accent text-muted-foreground"
                )}
              >
                <GitBranch className="w-4 h-4" />
              </div>

              {/* Branch name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate text-foreground">
                    {node.name}
                  </span>
                  {node.is_main && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-md">
                      主线
                    </span>
                  )}
                </div>
              </div>

              {/* Creator avatar */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white font-medium shadow-sm"
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
            <div className="px-3 py-2.5 space-y-2">
              {/* Question preview */}
              {node.firstQuestion && (
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {node.firstQuestion}
                  </p>
                </div>
              )}

              {/* Conclusion preview */}
              {node.lastMessage && (
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-foreground/80 line-clamp-2">
                    {node.lastMessage}
                  </p>
                </div>
              )}

              {/* Description */}
              {node.description && !node.firstQuestion && !node.lastMessage && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {node.description}
                </p>
              )}

              {/* Empty state */}
              {!node.firstQuestion && !node.lastMessage && !node.description && (
                <p className="text-xs text-muted-foreground/60 italic">
                  暂无会话内容
                </p>
              )}
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/20">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{node.messageCount} 条消息</span>
              </div>

              <div className="flex items-center gap-1">
                {hasChildren && (
                  <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                    {node.children.length} 个子分支
                  </span>
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
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
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
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-r-full" />
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-4 space-y-4">
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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-accent">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">分支视图</h2>
          <p className="text-xs text-muted-foreground">
            共 {branches.length} 个分支 · 点击卡片切换分支
          </p>
        </div>
      </div>

      {/* Tree content */}
      <ScrollArea className="flex-1">
        <div className="p-6 min-w-max">
          {buildTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <GitBranch className="w-8 h-8 opacity-40" />
              </div>
              <p className="font-medium">暂无分支</p>
              <p className="text-xs mt-1">发送消息后将自动创建主线分支</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buildTree.map((node, index) => 
                renderBranchCard(node, 0, index === buildTree.length - 1, [])
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="px-4 py-3 border-t bg-muted/20">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-primary/20 flex items-center justify-center">
              <GitBranch className="w-2.5 h-2.5 text-primary" />
            </div>
            <span>主线分支</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-md bg-accent flex items-center justify-center">
              <GitBranch className="w-2.5 h-2.5 text-muted-foreground" />
            </div>
            <span>分歧分支</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>核心提问</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>核心结论</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchTreeView;
