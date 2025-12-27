import { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { 
  Pencil, 
  Trash2, 
  Copy, 
  Download, 
  Share2, 
  Star,
  FolderOpen
} from "lucide-react";

interface ProjectContextMenuProps {
  children: ReactNode;
  projectName: string;
  onRename?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  onOpen?: () => void;
}

const ProjectContextMenu = ({
  children,
  projectName,
  onRename,
  onDelete,
  onCopy,
  onExport,
  onShare,
  onFavorite,
  onOpen,
}: ProjectContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem 
          onClick={onOpen}
          className="flex items-center gap-2 cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span>打开项目</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onRename}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Pencil className="w-4 h-4" />
          <span>重命名</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onCopy}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Copy className="w-4 h-4" />
          <span>复制项目</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onFavorite}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Star className="w-4 h-4" />
          <span>添加到收藏</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onShare}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>分享项目</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onExport}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>导出项目</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem 
          onClick={onDelete}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          <span>删除项目</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ProjectContextMenu;
