import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserPlus, Share2, Search as SearchIcon, ArrowLeft, Folder } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import GlobalSearchPalette from "./GlobalSearchPalette";
import { Project } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/contexts/NavigationContext";

interface TopNavbarProps {
  breadcrumbItems?: Array<{ label: string; onClick?: () => void }>;
  onShowBranchTree?: () => void;
  onShowFileCenter?: () => void;
  fileUnreadCount?: number;
  projects?: Project[];
  activeProject?: Project | null;
  onSelectProject?: (id: string) => Promise<boolean>;
  onSendToAgent?: (query: string) => void;
  onToggleFolder: () => void;
  folderUnreadCount?: number;
  isFolderOpen?: boolean;
}

const TopNavbar = ({ 
  breadcrumbItems = [],
  onShowBranchTree,
  onShowFileCenter,
  fileUnreadCount = 0,
  projects = [],
  activeProject = null,
  onSelectProject,
  onToggleFolder,
  folderUnreadCount = 0,
  isFolderOpen = false,
}: TopNavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { onSendToAgent, isBranchTreeView, onBackFromBranchTree } = useNavigation();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  // Check if we're on Agent or Workflow page
  const isToolPage = location.pathname === "/agent" || location.pathname === "/workflow";

  // Handle back to project
  const handleBackToProject = () => {
    navigate("/");
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("邀请链接已复制到剪贴板");
    } catch (err) {
      toast.error("复制失败");
    }
  };

  const handleShare = () => {
    handleCopyInviteLink();
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-card border-b border-border flex-shrink-0">
      {/* Left: Breadcrumb - Only show action button */}
      <div className="flex items-center flex-1 min-w-0">
        {isBranchTreeView ? (
          // Show "返回对话" button when in branch tree view
          onBackFromBranchTree && (
            <button
              onClick={onBackFromBranchTree}
              className="flex items-center gap-1.5 text-sm text-[#123aff] hover:text-[#123aff]/80 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回对话</span>
            </button>
          )
        ) : isToolPage ? (
          // Show "返回项目" button on Agent/Workflow pages
          <button
            onClick={handleBackToProject}
            className="flex items-center gap-1.5 text-sm text-[#123aff] hover:text-[#123aff]/80 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回项目</span>
          </button>
        ) : (
          // Show "分支视图" button on project page
          onShowBranchTree && (
            <button
              onClick={onShowBranchTree}
              className="flex items-center gap-1.5 text-sm text-[#123aff] hover:text-[#123aff]/80 transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>分支视图</span>
            </button>
          )
        )}
      </div>

      {/* Right: Action Icons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Global Search */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: showGlobalSearch ? '#123aff' : '#52525b',
                backgroundColor: showGlobalSearch ? 'rgba(18, 58, 255, 0.08)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!showGlobalSearch) {
                  e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                  e.currentTarget.style.color = '#123aff';
                }
              }}
              onMouseLeave={(e) => {
                if (!showGlobalSearch) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#52525b';
                } else {
                  // Keep active state when search palette is open
                  e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                  e.currentTarget.style.color = '#123aff';
                }
              }}
            >
              <SearchIcon className="w-4 h-4" style={{ color: 'inherit' }} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>全局搜索</p>
          </TooltipContent>
        </Tooltip>

        {/* Smart Folder - Between Search and Invite - Always visible globally */}
        {onToggleFolder && (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleFolder}
                data-folder-icon
                className="p-2 rounded-lg transition-colors relative"
                style={{
                  color: isFolderOpen ? '#123aff' : '#52525b',
                  backgroundColor: isFolderOpen ? 'rgba(18, 58, 255, 0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                  e.currentTarget.style.color = '#123aff';
                }}
                onMouseLeave={(e) => {
                  if (!isFolderOpen) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#52525b';
                  } else {
                    // Keep active state when folder is open
                    e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                    e.currentTarget.style.color = '#123aff';
                  }
                }}
              >
                <Folder className="w-4 h-4" style={{ color: 'inherit' }} />
                {folderUnreadCount > 0 && !isFolderOpen && (
                  <>
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#123aff' }} />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: '#123aff' }} />
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>智能文件夹</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Invite */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowInviteDialog(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#52525b' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                e.currentTarget.style.color = '#123aff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#52525b';
              }}
            >
              <UserPlus className="w-4 h-4" style={{ color: 'inherit' }} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>邀请协作者</p>
          </TooltipContent>
        </Tooltip>

        {/* Share */}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg transition-colors"
              style={{ color: '#52525b' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(18, 58, 255, 0.08)';
                e.currentTarget.style.color = '#123aff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#52525b';
              }}
            >
              <Share2 className="w-4 h-4" style={{ color: 'inherit' }} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>分享</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>邀请协作者</DialogTitle>
            <DialogDescription>
              分享链接邀请他人加入此项目的协作
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg text-sm break-all">
                {window.location.href}
              </div>
              <Button onClick={handleCopyInviteLink} size="sm">
                复制链接
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              被邀请者打开此链接后即可加入协作
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Search Palette */}
      {onSelectProject && (
        <GlobalSearchPalette
          open={showGlobalSearch}
          onOpenChange={setShowGlobalSearch}
          projects={projects}
          activeProject={activeProject}
          onSelectProject={onSelectProject}
          onSendToAgent={onSendToAgent}
        />
      )}
    </header>
  );
};

export default TopNavbar;
