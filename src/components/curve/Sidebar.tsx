import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { FolderKanban, RefreshCw, SquarePen, PanelLeftClose, PanelLeft, Loader2, Search, User, ScrollText, Settings, Languages, LogOut } from "lucide-react";
import ProjectItem from "./ProjectItem";
import NewProjectDialog from "./NewProjectDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import RenameDialog from "./RenameDialog";
import CurveLogo from "./CurveLogo";
import UserAvatar from "./UserAvatar";
import CapabilitiesIcon from "./CapabilitiesIcon";
import CapabilitiesMenu from "../layout/CapabilitiesMenu";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Project } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

interface SidebarProps {
  projects: Project[];
  isLoading: boolean;
  activeProject: Project | null;
  onCreateProject: (data: { 
    name: string; 
    icon: string; 
    description?: string;
    context_path?: string;
    selected_agents?: string[];
    tags?: string[];
    selected_skills?: string[];
    uploaded_files?: any[];
  }) => Promise<Project | null>;
  onDeleteProject: (id: string) => Promise<boolean>;
  onRenameProject: (id: string, name: string) => Promise<boolean>;
  onSelectProject: (id: string) => Promise<boolean>;
}

const Sidebar = ({ 
  projects, 
  isLoading, 
  activeProject,
  onCreateProject, 
  onDeleteProject, 
  onRenameProject,
  onSelectProject 
}: SidebarProps) => {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null);

  // No longer filter projects - show all projects
  const filteredProjects = projects;

  const handleProjectCreate = async (projectData: { 
    name: string; 
    icon: string; 
    description: string;
    context_path?: string;
    selected_agents?: string[];
    tags?: string[];
    selected_skills?: string[];
    uploaded_files?: any[];
  }) => {
    await onCreateProject(projectData);
  };

  const handleRename = (project: Project) => {
    setSelectedProject({ id: project.id, name: project.name });
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (selectedProject) {
      await onRenameProject(selectedProject.id, newName);
      toast.success(`项目已重命名为: ${newName}`);
    }
    setRenameDialogOpen(false);
    setSelectedProject(null);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject({ id: project.id, name: project.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      await onDeleteProject(selectedProject.id);
    }
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleCopy = (projectName: string) => {
    toast.success(`已复制项目: ${projectName}`);
  };

  const handleExport = (projectName: string) => {
    toast.info(`导出项目: ${projectName}`);
  };

  const handleShare = (projectName: string) => {
    toast.info(`分享项目: ${projectName}`);
  };

  const handleFavorite = (projectName: string) => {
    toast.success(`已添加到收藏: ${projectName}`);
  };

  const handleOpen = async (project: Project) => {
    await onSelectProject(project.id);
  };

  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [showCapabilitiesMenu, setShowCapabilitiesMenu] = useState(false);
  const capabilitiesButtonRef = useRef<HTMLButtonElement>(null);
  const [capabilitiesMenuPosition, setCapabilitiesMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);
  
  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const [userMenuPosition, setUserMenuPosition] = useState<{ top?: number; bottom?: number; left?: number; right?: number } | null>(null);

  // Check if any capability page is active
  const isCapabilityPageActive = location.pathname === "/agent" || location.pathname === "/workflow" || location.pathname === "/skills-hub";

  // Handle capabilities menu positioning
  const handleCapabilitiesClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!capabilitiesButtonRef.current) return;
    const rect = capabilitiesButtonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Show menu above the button
    setCapabilitiesMenuPosition({
      bottom: viewportHeight - rect.top + 8,
      left: rect.left,
    });
    setShowCapabilitiesMenu(!showCapabilitiesMenu);
  };

  // Handle user menu positioning
  const handleUserClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!userButtonRef.current) return;
    const rect = userButtonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const menuHeight = 280; // Approximate menu height
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // If there's not enough space below but enough space above, show menu above
    if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
      setUserMenuPosition({
        bottom: viewportHeight - rect.top + 8,
        left: rect.left,
      });
    } else {
      // Show menu below (default)
      setUserMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
    }
    setShowUserMenu(!showUserMenu);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        capabilitiesButtonRef.current &&
        !capabilitiesButtonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-capabilities-menu]')
      ) {
        setShowCapabilitiesMenu(false);
      }
      if (
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-user-menu]')
      ) {
        setShowUserMenu(false);
      }
    };

    if (showCapabilitiesMenu || showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCapabilitiesMenu, showUserMenu]);

  return (
    <>
      <div className={`${isCollapsed ? 'w-[52px]' : 'w-[280px]'} h-screen bg-[#f5f5f5] border-r border-curve-sidebar-border flex flex-col transition-all duration-200 relative z-30`}>
        {/* Brand Area - Top */}
        <div className={`flex-shrink-0 ${isCollapsed ? 'p-2' : 'px-3 py-4'} border-b border-curve-sidebar-border`}>
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setIsCollapsed(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                展开侧边栏
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center justify-between">
              <CurveLogo />
              <button 
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-curve-hover transition-colors text-muted-foreground hover:text-foreground"
                title="折叠侧边栏"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* New Project Button */}
          <div className={`flex-shrink-0 ${isCollapsed ? 'p-2' : 'px-3 py-3'}`}>
            {isCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setNewProjectOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent text-slate-600 hover:bg-[#123aff] hover:text-white transition-all duration-200"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  新建项目
                </TooltipContent>
              </Tooltip>
            ) : (
              <button 
                onClick={() => setNewProjectOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-transparent text-slate-600 rounded-lg hover:bg-[#123aff] hover:text-white transition-all duration-200 font-medium text-sm"
                title="New Project"
              >
                <SquarePen className="w-4 h-4 flex-shrink-0" />
                <span>新建项目</span>
              </button>
            )}
          </div>

        {/* All Projects Section */}
        {!isCollapsed && (
          <div className="px-3 py-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center gap-2 text-sm">
                <FolderKanban className="w-4 h-4" />
                <span>所有项目</span>
              </div>
              <button className="p-1 rounded hover:bg-curve-hover transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

          {/* Project List */}
          <div className={`flex-1 overflow-y-auto scrollbar-thin ${isCollapsed ? 'px-1.5' : 'px-2'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <div className={`${isCollapsed ? 'space-y-1' : 'space-y-0.5'}`}>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <ProjectItem
                    key={project.id}
                    icon={project.icon}
                    name={project.name}
                    author={project.author}
                    isActive={project.id === activeProject?.id}
                    isCollapsed={isCollapsed}
                    onRename={() => handleRename(project)}
                    onDelete={() => handleDelete(project)}
                    onCopy={() => handleCopy(project.name)}
                    onExport={() => handleExport(project.name)}
                    onShare={() => handleShare(project.name)}
                    onFavorite={() => handleFavorite(project.name)}
                    onOpen={() => handleOpen(project)}
                  />
                ))
              ) : (
                !isCollapsed && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{projects.length === 0 ? "暂无项目" : "未找到匹配的项目"}</p>
                    <p className="text-xs mt-1">
                      {projects.length === 0 ? "点击上方按钮创建新项目" : "尝试其他搜索关键词"}
                    </p>
                  </div>
                )
              )}
            </div>
            )}
          </div>
        </div>

        {/* Bottom Twin Icons - Capabilities & User Avatar */}
        <div className={`flex-shrink-0 ${isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'px-3 py-3 flex items-center gap-2'} border-t border-curve-sidebar-border relative z-30`}>
          {/* Capabilities Matrix Icon - Above User Avatar when collapsed */}
          <button
            ref={capabilitiesButtonRef}
            onClick={handleCapabilitiesClick}
            className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-200 w-9 h-9 flex-shrink-0 shadow-sm",
              showCapabilitiesMenu || isCapabilityPageActive
                ? "bg-xtalpi-blue text-white border border-xtalpi-blue"
                : "bg-white/50 hover:bg-white text-muted-foreground hover:text-foreground border border-border/50 hover:border-xtalpi-blue/50"
            )}
          >
            <CapabilitiesIcon className="w-4 h-4" />
          </button>

          {/* User Center Icon - Fixed at bottom */}
          <button
            ref={userButtonRef}
            onClick={handleUserClick}
            className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-200 w-9 h-9 flex-shrink-0 shadow-sm",
              showUserMenu
                ? "bg-xtalpi-blue text-white border border-xtalpi-blue"
                : "bg-white/50 hover:bg-white text-muted-foreground hover:text-foreground border border-border/50 hover:border-xtalpi-blue/50"
            )}
          >
            <User className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog 
        open={newProjectOpen} 
        onOpenChange={setNewProjectOpen}
        onProjectCreate={handleProjectCreate}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        projectName={selectedProject?.name || ""}
        onConfirm={handleDeleteConfirm}
      />

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={selectedProject?.name || ""}
        onConfirm={handleRenameConfirm}
      />

      {/* Capabilities Menu Portal */}
      {showCapabilitiesMenu && capabilitiesMenuPosition && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowCapabilitiesMenu(false)}
          />
          
          {/* Menu */}
          <CapabilitiesMenu
            position={capabilitiesMenuPosition}
            onNavigate={(path) => navigate(path)}
            onClose={() => setShowCapabilitiesMenu(false)}
          />
        </>,
        document.body
      )}

      {/* User Menu Portal */}
      {showUserMenu && userMenuPosition && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowUserMenu(false)}
          />
          
          {/* Menu */}
          <div
            data-user-menu
            style={{
              position: 'fixed',
              ...(userMenuPosition.top !== undefined && { top: userMenuPosition.top }),
              ...(userMenuPosition.bottom !== undefined && { bottom: userMenuPosition.bottom }),
              ...(userMenuPosition.left !== undefined && { left: userMenuPosition.left }),
              ...(userMenuPosition.right !== undefined && { right: userMenuPosition.right }),
              zIndex: 9999,
            }}
            className="min-w-[240px] bg-white/95 backdrop-blur-sm border border-border/50 rounded-xl shadow-xl overflow-hidden animate-fade-in"
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=chengxixi&backgroundColor=ffd5dc"
                    alt="程希希"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-foreground truncate">程希希</span>
                  <span className="text-xs text-muted-foreground truncate mt-0.5">chengxixi@example.com</span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  console.log("Settings clicked");
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f0f2ff] hover:text-[#123aff] transition-colors text-left group"
              >
                <Settings className="w-4 h-4 text-slate-500 group-hover:text-[#123aff] flex-shrink-0 transition-colors" />
                <span>设置</span>
              </button>
              <button
                onClick={() => {
                  console.log("Logs clicked");
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f0f2ff] hover:text-[#123aff] transition-colors text-left group"
              >
                <ScrollText className="w-4 h-4 text-slate-500 group-hover:text-[#123aff] flex-shrink-0 transition-colors" />
                <span>日志</span>
              </button>
              <button
                onClick={() => {
                  console.log("Language clicked");
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f0f2ff] hover:text-[#123aff] transition-colors text-left group"
              >
                <Languages className="w-4 h-4 text-slate-500 group-hover:text-[#123aff] flex-shrink-0 transition-colors" />
                <span>语言切换</span>
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-border pt-1">
              <button
                onClick={() => {
                  console.log("Logout clicked");
                  setShowUserMenu(false);
                  // TODO: Implement logout functionality
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#f0f2ff] hover:text-[#123aff] transition-colors text-left group"
              >
                <LogOut className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-[#123aff] transition-colors" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default Sidebar;
