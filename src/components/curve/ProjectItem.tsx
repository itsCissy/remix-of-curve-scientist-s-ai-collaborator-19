import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Copy, Download, Share2, Star, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Collapsed view - just show icon with tooltip
  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-colors duration-200 mx-auto ${
              isActive
                ? "bg-xtalpi-blue/10 text-xtalpi-blue"
                : "hover:bg-slate-200/60 text-muted-foreground hover:text-foreground"
            }`}
            onClick={onOpen}
          >
            <span className="text-base">{icon}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{author}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-200 group ${
        isActive
          ? "bg-xtalpi-blue/10 text-xtalpi-blue"
          : "hover:bg-slate-200/60 text-muted-foreground hover:text-foreground"
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
            className={`p-1 rounded transition-opacity duration-200 ${
              isHovered || menuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4 text-slate-400 hover:text-slate-700 transition-colors duration-200" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <FolderOpen className="w-4 h-4 text-slate-500" />
            <span>打开项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onRename?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <Pencil className="w-4 h-4 text-slate-500" />
            <span>重命名</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onCopy?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <Copy className="w-4 h-4 text-slate-500" />
            <span>复制项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <Star className="w-4 h-4 text-slate-500" />
            <span>添加到收藏</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onShare?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>分享项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onExport?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>导出项目</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="flex items-center gap-2 cursor-pointer text-slate-700"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>删除项目</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProjectItem;
