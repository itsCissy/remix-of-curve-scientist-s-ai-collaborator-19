import { useState } from "react";
import { Branch, Collaborator } from "@/hooks/useBranches";
import { GitBranch, ChevronRight, MessageSquare, Trash2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BranchNode extends Branch {
  children: BranchNode[];
  messageCount?: number;
}

interface BranchTreeViewProps {
  branches: Branch[];
  collaborators: Collaborator[];
  currentBranchId: string | null;
  onSelectBranch: (branchId: string) => void;
  onDeleteBranch: (branchId: string) => void;
  onBack: () => void;
  messageCountByBranch?: Record<string, number>;
}

const BranchTreeView = ({
  branches,
  collaborators,
  currentBranchId,
  onSelectBranch,
  onDeleteBranch,
  onBack,
  messageCountByBranch = {},
}: BranchTreeViewProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure from flat branches
  const buildTree = (): BranchNode[] => {
    const nodeMap = new Map<string, BranchNode>();
    const roots: BranchNode[] = [];

    // Create nodes
    branches.forEach((branch) => {
      nodeMap.set(branch.id, {
        ...branch,
        children: [],
        messageCount: messageCountByBranch[branch.id] || 0,
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
  };

  const toggleExpand = (nodeId: string) => {
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
    if (!collaboratorId) return "#6B7280";
    const collab = collaborators.find((c) => c.id === collaboratorId);
    return collab?.avatar_color || "#6B7280";
  };

  const renderNode = (node: BranchNode, depth: number = 0): JSX.Element => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = node.id === currentBranchId;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
            "hover:bg-accent/50",
            isSelected && "bg-primary/10 border border-primary/30"
          )}
          style={{ marginLeft: depth * 24 }}
          onClick={() => onSelectBranch(node.id)}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-accent rounded"
            >
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform text-muted-foreground",
                  isExpanded && "rotate-90"
                )}
              />
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Branch icon */}
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              node.is_main ? "bg-primary/20" : "bg-accent"
            )}
          >
            <GitBranch className="w-3.5 h-3.5 text-primary" />
          </div>

          {/* Branch info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{node.name}</span>
              {node.is_main && (
                <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded">
                  主线
                </span>
              )}
            </div>
            {node.description && (
              <p className="text-xs text-muted-foreground truncate">
                {node.description}
              </p>
            )}
          </div>

          {/* Creator avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                style={{ backgroundColor: getCollaboratorColor(node.created_by) }}
              >
                {getCollaboratorName(node.created_by).charAt(0)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>创建者: {getCollaboratorName(node.created_by)}</p>
            </TooltipContent>
          </Tooltip>

          {/* Message count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            <span>{node.messageCount}</span>
          </div>

          {/* Delete button (not for main branch) */}
          {!node.is_main && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBranch(node.id);
                  }}
                  className="p-1 hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除分支</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Connecting line */}
            <div
              className="absolute left-[22px] top-0 bottom-4 w-px bg-border"
              style={{ marginLeft: depth * 24 }}
            />
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const tree = buildTree();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="font-semibold text-foreground">分支视图</h2>
          <p className="text-xs text-muted-foreground">
            共 {branches.length} 个分支
          </p>
        </div>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <GitBranch className="w-12 h-12 mb-3 opacity-30" />
            <p>暂无分支</p>
            <p className="text-xs">发送消息后将自动创建主线分支</p>
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary/20" />
            <span>主线分支</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span>分歧分支</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchTreeView;
