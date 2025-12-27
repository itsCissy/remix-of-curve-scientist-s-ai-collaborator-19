import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Copy, Download, Share2, Star, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectItemProps {
  icon: string;
  name: string;
  author: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onFavorite?: () => void;
  onOpen?: () => void;
}

const ProjectItem = ({ 
  icon, 
  name, 
  author, 
  isActive = false,
  isCollapsed = false,
  onRename,
  onDelete,
  onCopy,
  onExport,
  onShare,
  onFavorite,
  onOpen,
}: ProjectItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Collapsed view - just show icon
  if (isCollapsed) {
    return (
      <div
        className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 mx-auto ${
          isActive
            ? "bg-primary/10 text-foreground"
            : "hover:bg-curve-hover text-muted-foreground hover:text-foreground"
        }`}
        onClick={onOpen}
        title={name}
      >
        <span className="text-base">{icon}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 group ${
        isActive
          ? "bg-primary/10 text-foreground"
          : "hover:bg-curve-hover text-muted-foreground hover:text-foreground"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpen}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm truncate ${isActive ? "font-medium" : ""}`}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground truncate">{author}</span>
        </div>
      </div>
      
      {/* More Actions Button */}
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={`p-1 rounded hover:bg-background/50 transition-opacity duration-200 ${
              isHovered || menuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>打开项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onRename?.();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>重命名</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>复制项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Star className="w-4 h-4" />
            <span>添加到收藏</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>分享项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onExport?.();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>导出项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            <span>删除项目</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProjectItem;
